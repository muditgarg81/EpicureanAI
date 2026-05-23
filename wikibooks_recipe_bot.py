"""
wikibooks_recipe_bot.py
=======================
Downloads every recipe from the Wikibooks Cookbook (en.wikibooks.org) using
the official MediaWiki API. Output: recipes.csv and recipes.json.

Why this is legitimate:
- Wikibooks content is licensed CC BY-SA 3.0 (commercial use OK with attribution).
- We use the official API, not HTML scraping.
- We send a proper User-Agent and rate-limit ourselves (Wikimedia asks for this).

Usage:
    pip install requests
    python wikibooks_recipe_bot.py

The script is resumable: progress is saved to progress.json. If you stop it
(Ctrl+C) and restart, it picks up where it left off.

Expect ~800-1000 recipes, ~20-40 minutes runtime at the polite default rate.
"""

import csv
import json
import re
import sys
import time
from pathlib import Path

import requests

# ---- Configuration -----------------------------------------------------------

API_URL = "https://en.wikibooks.org/w/api.php"
ROOT_CATEGORY = "Category:Recipes"

# Wikimedia explicitly asks bots to identify themselves with contact info.
# Replace the email with your own before running.
HEADERS = {
    "User-Agent": "RecipeBot/1.0 (contact: your-email@example.com) "
                  "Python-requests; educational/personal use"
}

# Polite rate limit: 1 request per second is well below Wikimedia's limits
# and avoids any chance of getting throttled.
REQUEST_DELAY_SECONDS = 1.0

OUTPUT_DIR = Path(".")
CSV_PATH = OUTPUT_DIR / "recipes.csv"
JSON_PATH = OUTPUT_DIR / "recipes.json"
PROGRESS_PATH = OUTPUT_DIR / "progress.json"


# ---- API helpers -------------------------------------------------------------

session = requests.Session()
session.headers.update(HEADERS)


def api_get(params: dict) -> dict:
    """Call the MediaWiki API with polite delay and basic error handling."""
    params = {**params, "format": "json", "formatversion": "2"}
    for attempt in range(3):
        try:
            r = session.get(API_URL, params=params, timeout=30)
            r.raise_for_status()
            time.sleep(REQUEST_DELAY_SECONDS)
            return r.json()
        except (requests.RequestException, ValueError) as e:
            wait = 5 * (attempt + 1)
            print(f"  ! API error ({e}); retrying in {wait}s", file=sys.stderr)
            time.sleep(wait)
    raise RuntimeError("API failed 3 times in a row; giving up.")


def get_category_members(category: str) -> tuple[list[str], list[str]]:
    """Return (recipe_page_titles, subcategory_titles) for a category."""
    pages, subcats = [], []
    cmcontinue = None
    while True:
        params = {
            "action": "query",
            "list": "categorymembers",
            "cmtitle": category,
            "cmlimit": "500",
            "cmtype": "page|subcat",
        }
        if cmcontinue:
            params["cmcontinue"] = cmcontinue
        data = api_get(params)
        for m in data.get("query", {}).get("categorymembers", []):
            title = m["title"]
            if m["ns"] == 14:  # Category namespace
                subcats.append(title)
            else:
                # Cookbook recipe pages live in main namespace and start with "Cookbook:"
                if title.startswith("Cookbook:"):
                    pages.append(title)
        if "continue" in data:
            cmcontinue = data["continue"]["cmcontinue"]
        else:
            break
    return pages, subcats


def collect_all_recipe_titles() -> list[str]:
    """Walk Category:Recipes and all subcategories to gather every recipe page."""
    seen_categories: set[str] = set()
    seen_pages: set[str] = set()
    queue = [ROOT_CATEGORY]

    while queue:
        cat = queue.pop()
        if cat in seen_categories:
            continue
        seen_categories.add(cat)
        print(f"Scanning {cat} ... ", end="", flush=True)
        pages, subcats = get_category_members(cat)
        new = [p for p in pages if p not in seen_pages]
        seen_pages.update(new)
        for sc in subcats:
            if sc not in seen_categories:
                queue.append(sc)
        print(f"+{len(new)} recipes, +{len(subcats)} subcats "
              f"(total so far: {len(seen_pages)})")

    return sorted(seen_pages)


def get_page_wikitext(title: str) -> str:
    """Fetch raw wikitext for a single page."""
    data = api_get({
        "action": "parse",
        "page": title,
        "prop": "wikitext",
    })
    return data.get("parse", {}).get("wikitext", "") or ""


# ---- Wikitext parsing --------------------------------------------------------

# Strip MediaWiki link syntax: [[Cookbook:Salt|salt]] -> salt
LINK_RE = re.compile(r"\[\[(?:[^|\]]+\|)?([^\]]+)\]\]")
TEMPLATE_RE = re.compile(r"\{\{[^{}]*\}\}")
HTML_TAG_RE = re.compile(r"<[^>]+>")
WHITESPACE_RE = re.compile(r"\s+")


def clean_wikitext(s: str) -> str:
    """Lightly normalize wikitext into readable plain text."""
    # Repeatedly strip nested templates
    prev = None
    while prev != s:
        prev = s
        s = TEMPLATE_RE.sub("", s)
    s = LINK_RE.sub(r"\1", s)
    s = HTML_TAG_RE.sub("", s)
    s = s.replace("'''", "").replace("''", "")
    return s.strip()


def extract_section(wikitext: str, *section_names: str) -> str:
    """
    Find a section like '== Ingredients ==' and return its body up to the
    next heading. Tries section_names in order; returns the first one that hits.
    """
    for name in section_names:
        pattern = re.compile(
            rf"==\s*{re.escape(name)}\s*==\s*\n(.*?)(?=\n==[^=]|\Z)",
            re.IGNORECASE | re.DOTALL,
        )
        m = pattern.search(wikitext)
        if m:
            return m.group(1).strip()
    return ""


def parse_list_lines(section: str) -> list[str]:
    """Extract bullet/numbered list items from a section body."""
    items = []
    for line in section.splitlines():
        line = line.strip()
        if line.startswith(("*", "#")):
            cleaned = clean_wikitext(line.lstrip("*# ").strip())
            if cleaned:
                items.append(cleaned)
    return items


def parse_recipesummary(wikitext: str) -> dict:
    """
    The {{recipesummary}} template holds structured metadata like servings,
    time, difficulty, category. Pull its key=value pairs out.
    """
    m = re.search(r"\{\{recipesummary(.*?)\}\}", wikitext,
                  re.IGNORECASE | re.DOTALL)
    if not m:
        return {}
    body = m.group(1)
    fields = {}
    for part in body.split("|"):
        if "=" in part:
            key, _, value = part.partition("=")
            key = key.strip().lower()
            value = clean_wikitext(value.strip())
            if key and value:
                fields[key] = value
    return fields


def parse_recipe(title: str, wikitext: str) -> dict:
    """Turn one recipe page's wikitext into a structured row."""
    summary = parse_recipesummary(wikitext)

    ingredients_section = extract_section(wikitext, "Ingredients")
    ingredients = parse_list_lines(ingredients_section)

    procedure_section = extract_section(
        wikitext, "Procedure", "Instructions", "Directions", "Method", "Preparation"
    )
    steps = parse_list_lines(procedure_section)
    # Some pages use plain paragraphs instead of lists for procedure:
    if not steps and procedure_section:
        steps = [clean_wikitext(p.strip())
                 for p in procedure_section.split("\n\n")
                 if p.strip()]

    notes_section = extract_section(wikitext, "Notes, tips, and variations",
                                    "Notes", "Tips", "Variations")

    display_name = title.replace("Cookbook:", "", 1)

    return {
        "title": display_name,
        "wikibooks_url": f"https://en.wikibooks.org/wiki/{title.replace(' ', '_')}",
        "category": summary.get("category", ""),
        "servings": summary.get("servings", ""),
        "prep_time": summary.get("preptime", "") or summary.get("prep_time", ""),
        "cook_time": summary.get("cooktime", "") or summary.get("cook_time", ""),
        "total_time": summary.get("totaltime", "") or summary.get("time", ""),
        "difficulty": summary.get("difficulty", ""),
        "ingredients": ingredients,
        "steps": steps,
        "notes": clean_wikitext(notes_section),
    }


# ---- Persistence -------------------------------------------------------------

def load_progress() -> dict:
    if PROGRESS_PATH.exists():
        return json.loads(PROGRESS_PATH.read_text(encoding="utf-8"))
    return {"done": [], "recipes": []}


def save_progress(state: dict) -> None:
    PROGRESS_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2),
                             encoding="utf-8")


def write_outputs(recipes: list[dict]) -> None:
    # JSON (full fidelity)
    JSON_PATH.write_text(json.dumps(recipes, ensure_ascii=False, indent=2),
                         encoding="utf-8")

    # CSV (lists flattened with " | " separator for spreadsheet use)
    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "title", "wikibooks_url", "category",
            "servings", "prep_time", "cook_time", "total_time", "difficulty",
            "ingredients", "steps", "notes",
        ])
        for r in recipes:
            writer.writerow([
                r["title"], r["wikibooks_url"], r["category"],
                r["servings"], r["prep_time"], r["cook_time"],
                r["total_time"], r["difficulty"],
                " | ".join(r["ingredients"]),
                " | ".join(r["steps"]),
                r["notes"],
            ])


# ---- Main --------------------------------------------------------------------

def main() -> None:
    print("Step 1: Collecting recipe titles from category tree...")
    titles = collect_all_recipe_titles()
    print(f"\nFound {len(titles)} recipe pages.\n")

    state = load_progress()
    done = set(state["done"])
    recipes = state["recipes"]

    remaining = [t for t in titles if t not in done]
    print(f"Step 2: Fetching {len(remaining)} recipes "
          f"({len(done)} already done from previous run)...\n")

    try:
        for i, title in enumerate(remaining, 1):
            try:
                # Use encode-decode dance to handle Windows console encoding issues for titles with special chars
                print(f"[{i}/{len(remaining)}] {title.encode(sys.stdout.encoding, errors='replace').decode(sys.stdout.encoding)}")
            except:
                print(f"[{i}/{len(remaining)}] (Processing recipe with special characters)")
            try:
                wikitext = get_page_wikitext(title)
                recipe = parse_recipe(title, wikitext)
                recipes.append(recipe)
                done.add(title)
            except Exception as e:
                print(f"  ! Failed: {e}", file=sys.stderr)
                continue

            # Save progress every 25 recipes so a crash isn't catastrophic.
            if i % 25 == 0:
                state["done"] = sorted(done)
                state["recipes"] = recipes
                save_progress(state)
                print(f"  ~ progress saved ({len(recipes)} recipes)")
    except KeyboardInterrupt:
        print("\nInterrupted. Saving progress before exit...")
    finally:
        state["done"] = sorted(done)
        state["recipes"] = recipes
        save_progress(state)
        write_outputs(recipes)
        print(f"\nDone. Wrote {CSV_PATH} and {JSON_PATH} "
              f"with {len(recipes)} recipes.")
        print(f"Progress checkpoint at {PROGRESS_PATH} "
              "(delete it to start fresh next time).")


if __name__ == "__main__":
    main()

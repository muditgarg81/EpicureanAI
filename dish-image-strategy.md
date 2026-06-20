# Epicurean Modern Kitchen — Dish Image Strategy
## Getting the Perfect Image for Every 3,306 Dishes

---

## The Challenge

| Metric | Count |
|--------|-------|
| Total dishes | 3,306 |
| Countries/regions | 531 |
| Well-known dishes (Sushi, Pizza, Biryani) | ~800 |
| Regional dishes (Gongura Chutney, Pantua) | ~1,500 |
| Obscure/hyper-local dishes | ~1,000 |

No single image source covers all 3,306. A **tiered hybrid strategy** is required.

---

## Strategy: 4-Tier Image Sourcing

### Tier 1 — AI-Generated Images (PRIMARY — covers 100%)
**Tool:** Flux Pro / DALL-E 3 / Midjourney via API
**Why:** The ONLY method that guarantees an image for EVERY dish, including obscure ones like "Smoked Pork Naga" or "Gongura Chutney" that no stock library has.

**Approach:**
- Generate one hero image per dish using a standardized prompt template
- Consistent visual style across all 3,306 images (same lighting, angle, plating aesthetic)
- Batch-generate using dish name + country + key ingredients from the recipe

**Prompt Template:**
```
Professional food photography of [DISH NAME], [COUNTRY] cuisine.
[KEY INGREDIENTS/DESCRIPTION from recipe].
Shot from 45-degree angle, on a [ceramic/wooden/traditional] plate,
soft natural window light, shallow depth of field, warm tones,
appetizing presentation, restaurant-quality plating.
Style: modern food magazine editorial.
```

**Cost estimate:**
- Flux Pro API: ~$0.05/image × 3,306 = **~$165**
- DALL-E 3 API: ~$0.04/image × 3,306 = **~$132**
- Midjourney: ~$30/month subscription (manual, slower)

**Pros:** 100% coverage, consistent style, no licensing issues, no attribution needed
**Cons:** Occasional inaccuracies (AI may not know what "Pantua" looks like)

**Quality control:** Flag dishes where AI output looks wrong → manually verify against Google Images → re-prompt with more specific description from the recipe.

---

### Tier 2 — Curated Unsplash/Pexels (for ~500 popular dishes)
**Tool:** Unsplash API (production — apply for free!) + Pexels API
**Why:** Real photography > AI for the most iconic dishes that users will scrutinize.

**Approach:**
- Pre-search and LOCK a specific photo ID for each of the top ~500 dishes
- Store the photo ID + photographer attribution in the database
- Hotlink at runtime (Unsplash requirement)
- Only use for dishes with EXCELLENT matches (biryani, sushi, pizza, pad thai)

**Implementation:**
```javascript
// Add columns to database:
// image_source: 'unsplash' | 'ai_generated' | 'pexels' | 'custom'
// image_id: Unsplash photo ID or generated image filename
// image_attribution: photographer name + link (for Unsplash/Pexels)
```

**Cost:** Free (with proper attribution)
**Compliance:** Use the unsplash-utils.js already built

---

### Tier 3 — Spoonacular / TheMealDB (for ~300 Western dishes)
**Tool:** Spoonacular API ($0 for 150 req/day free tier)
**Why:** Food-specific APIs have pre-matched, verified food images

**Best for:** American, European, and popular Asian dishes that are in their database
**Limitation:** Poor coverage for Indian regional, African, Central Asian, Pacific dishes

---

### Tier 4 — Custom Photography / Community Sourced (stretch goal)
**When:** Post-launch, for the top 50-100 signature dishes
**How:** Commission a food photographer OR crowdsource from users
**Why:** Nothing beats real, custom-shot images for hero/marketing dishes

---

## Recommended Implementation Order

### Phase 1: AI-Generate ALL 3,306 Images (Week 1-2)
This gives you 100% coverage immediately.

```python
# Batch generation script structure
import pandas as pd

df = pd.read_excel('world_dishes_database.xlsx')

for idx, row in df.iterrows():
    dish = row['dish_name']
    country = row['country']
    # Extract key visual details from recipe
    recipe = str(row['detailed_recipe'])
    
    prompt = f"""Professional food photography of {dish}, {country} cuisine.
    Authentic traditional presentation. Shot from 45-degree angle,
    on appropriate traditional serving ware, soft natural window light,
    shallow depth of field, warm inviting tones, restaurant-quality.
    Food magazine editorial style."""
    
    # Call image generation API
    # Save to /images/{dish_id}.webp
    # Update database with image path
```

**Batch workflow:**
1. Export dish list with name + country + recipe excerpt
2. Generate prompts (automated from recipe text)
3. Batch-call Flux/DALL-E API (rate-limited, ~50/min)
4. Save as optimized WebP (800×600, ~50KB each)
5. Total storage: 3,306 × 50KB = ~165MB
6. Quality review: scan all images, flag bad ones, re-generate

### Phase 2: Upgrade Top 500 with Real Photos (Week 3-4)
Replace AI images for the most popular/iconic dishes with curated Unsplash photos.

```python
# Priority dishes for real photos
TIER_1_DISHES = [
    # Dishes users search most + dishes where AI might fail
    'Biryani', 'Sushi', 'Pizza Margherita', 'Pad Thai',
    'Ramen', 'Butter Chicken', 'Tacos', 'Croissant',
    'Pho', 'Dim Sum', 'Paella', 'Tiramisu', ...
]

# Pre-curate Unsplash IDs
CURATED_IMAGES = {
    'Biryani': {'unsplash_id': 'abc123', 'photographer': 'Name'},
    'Sushi': {'unsplash_id': 'def456', 'photographer': 'Name'},
    ...
}
```

### Phase 3: Quality Audit (Week 5)
- Review ALL 3,306 images
- Flag culturally inaccurate AI generations
- Re-generate or replace flagged images
- A/B test: do users engage more with AI or real photos?

---

## Database Schema Addition

Add these columns to `world_dishes_database.xlsx`:

| Column | Type | Example |
|--------|------|---------|
| `image_source` | string | 'ai_generated' / 'unsplash' / 'pexels' / 'custom' |
| `image_url` | string | '/images/biryani.webp' or Unsplash hotlink URL |
| `image_id` | string | Unsplash photo ID or local filename |
| `image_attribution` | string | 'Photo by X on Unsplash' or 'AI Generated' |
| `image_prompt` | string | The prompt used for AI generation (for re-generation) |
| `image_verified` | boolean | Has a human verified this image is accurate? |

---

## Technical Implementation

### Image Delivery Architecture

```
User requests dish page
        ↓
Check image_source in DB
        ↓
┌───────────────────┐
│ AI Generated?     │ → Serve from CDN/S3 (/images/dish_id.webp)
│ Unsplash?         │ → Hotlink from Unsplash URL (with attribution)
│ Pexels?           │ → Hotlink from Pexels URL (with attribution)
│ Custom?           │ → Serve from CDN/S3
└───────────────────┘
        ↓
Display with attribution (if required)
```

### Image Optimization
- Format: WebP (40-50% smaller than JPEG)
- Hero size: 800×600 (for dish detail pages)
- Thumbnail: 400×300 (for search results/grids)
- Card: 200×200 (for compact lists)
- Lazy loading on all images
- CDN delivery (Cloudflare/Vercel Image Optimization)

### Prompt Engineering for Accuracy

For obscure dishes, extract details from the recipe to improve AI accuracy:

```python
def build_image_prompt(dish_name, country, recipe_text):
    # Extract visual keywords from recipe
    colors = extract_colors(recipe_text)  # "golden", "red", "green"
    vessel = extract_vessel(recipe_text)  # "clay pot", "banana leaf", "bowl"
    ingredients = extract_key_ingredients(recipe_text)
    
    return f"""Professional food photography of {dish_name} from {country}.
    A {colors} dish served in/on a {vessel}.
    Key visible ingredients: {ingredients}.
    Authentic {country} presentation style.
    45-degree angle, natural light, shallow depth of field,
    food magazine editorial quality."""
```

---

## Cost Summary

| Item | Cost | Coverage |
|------|------|----------|
| AI generation (3,306 images) | ~$150 | 100% |
| Unsplash API (production) | Free | Top 500 |
| CDN/Storage (165MB) | ~$1/mo | All |
| Quality review (human time) | ~8 hours | All |
| **Total** | **~$150 one-time + $1/mo** | **100%** |

---

## Timeline

| Week | Task | Output |
|------|------|--------|
| 1 | Set up Flux/DALL-E API; generate batch prompts | 3,306 prompts ready |
| 2 | Batch generate all images; store in CDN | 100% coverage |
| 3 | Curate Unsplash photos for top 500 dishes | 500 real photos |
| 4 | Quality audit; re-generate flagged images | All verified |
| 5 | Integrate into app; add attribution | Live on epicureanlabs.com |

---

## Quick Win: Start TODAY

The fastest path to 100% image coverage:

1. **Sign up for Flux Pro API** (https://api.bfl.ml/) — $5 gets you 100 images
2. **Run a test batch** of 20 dishes across different cuisines
3. **Evaluate quality** — if good, batch-generate all 3,306
4. **Meanwhile**, apply for Unsplash production API (free) for real-photo upgrades

This gives you **every single dish with a beautiful, consistent image within 2 weeks for under $200.**

import urllib.request
import re

packages = {
    "Blinkit": "com.grofers.customerapp",
    "Zepto": "com.zeptoconsumerapp",
    "Swiggy": "in.swiggy.android"
}

for name, pkg in packages.items():
    url = f"https://play.google.com/store/apps/details?id={pkg}"
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            
            # Find URLs matching play-lh.googleusercontent.com
            matches = re.findall(r'https://play-lh\.googleusercontent\.com/[a-zA-Z0-9_-]+', html)
            if matches:
                # Typically, the icon is one of the first few images or contains specific patterns.
                # Let's print the first 5 unique matches
                unique_matches = []
                for m in matches:
                    if m not in unique_matches:
                        unique_matches.append(m)
                print(f"--- {name} ({pkg}) ---")
                for u in unique_matches[:10]:
                    print(u)
            else:
                print(f"No matches for {name}")
    except Exception as e:
        print(f"Error fetching {name}: {e}")

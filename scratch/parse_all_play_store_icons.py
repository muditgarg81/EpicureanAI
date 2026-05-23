import urllib.request
import re

packages = {
    "Blinkit": "com.grofers.customerapp",
    "Zepto": "com.zeptoconsumerapp",
    "Swiggy": "in.swiggy.android",
    "BigBasket": "com.bigbasket.mobileapp"
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
            
            # Find all <img ...> tags including multi-line
            img_tags = re.findall(r'<img[^>]+>', html, re.DOTALL)
            
            logo_url = None
            for tag in img_tags:
                if 'alt="Icon image"' in tag:
                    # Extract src
                    src_match = re.search(r'src="([^"]+)"', tag)
                    if src_match:
                        logo_url = src_match.group(1)
                        break
            
            if logo_url:
                # Clean up the URL: remove any size suffix like =s20 or =s40 or =w240-h480 and replace with =s180-rw
                base_url = re.sub(r'=[swh0-9-]+.*$', '', logo_url)
                high_res_url = f"{base_url}=s180-rw"
                print(f"{name}: {high_res_url}")
            else:
                # Let's search inside the HTML for the primary JSON data structure if the tag isn't there
                # Sometimes Google Play serves content differently
                print(f"Could not find alt='Icon image' tag for {name}, trying fallback search...")
                # Search for Google Play's standard icon patterns
                lh_matches = re.findall(r'https://play-lh\.googleusercontent\.com/[a-zA-Z0-9_-]+', html)
                if lh_matches:
                    # Print the unique ones to inspect
                    unique = []
                    for m in lh_matches:
                        if m not in unique:
                            unique.append(m)
                    print(f"Unique googleusercontent URLs for {name}:")
                    for idx, u in enumerate(unique[:5]):
                        print(f"  {idx}: {u}=s180-rw")
                else:
                    print(f"No play-lh URLs found for {name}")
    except Exception as e:
        print(f"Error fetching {name}: {e}")

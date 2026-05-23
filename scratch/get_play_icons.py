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
            
            # Look for <img ... alt="Icon image" ...>
            # We can find all img tags, and search for the one with alt="Icon image" or itemprop="image" or similar
            img_pattern = r'<img [^>]*src="([^"]*)"[^>]*alt="Icon image"[^>]*>'
            match = re.search(img_pattern, html)
            if not match:
                # Try search with alt="Icon image" first in order
                img_pattern_alt = r'alt="Icon image"[^>]*src="([^"]*)"'
                match = re.search(img_pattern_alt, html)
                
            if not match:
                # General fallback: let's look for any image with alt="Icon image" inside a tag
                # Or find src and check if the tag contains alt="Icon image"
                all_imgs = re.findall(r'<img [^>]*>', html)
                for img in all_imgs:
                    if 'alt="Icon image"' in img:
                        src_match = re.search(r'src="([^"]*)"', img)
                        if src_match:
                            match = src_match
                            break
                            
            if match:
                src_url = match.group(1)
                # Clean up the URL: remove any size suffix like =s20 or =s40 and replace with =s180-rw
                base_url = re.sub(r'=[swh0-9-]+.*$', '', src_url)
                high_res_url = f"{base_url}=s180-rw"
                print(f"{name}: {high_res_url}")
            else:
                # If we couldn't find alt="Icon image", print the first googleusercontent URL
                matches = re.findall(r'https://play-lh\.googleusercontent\.com/[a-zA-Z0-9_-]+', html)
                if matches:
                    print(f"{name} (Fallback): {matches[0]}=s180-rw")
                else:
                    print(f"Could not find logo for {name}")
    except Exception as e:
        print(f"Error fetching {name}: {e}")

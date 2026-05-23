import urllib.request
import os

logos = {
    "bigbasket.png": "https://play-lh.googleusercontent.com/EuiZnkT8aEKjXDLX74DTp1VRIwWaeRa8Dvo-LOGAxy1FPQ8GzABTIRenksiM-A7Oz48g=s180-rw",
    "blinkit.png": "https://play-lh.googleusercontent.com/kXJYGrvy4pvHwzw6tMgf-KPthnPDg4RvvoOTgffwSuHCUL63WVxaj3ojX3ADBS0UiD0=s180-rw",
    "zepto.png": "https://play-lh.googleusercontent.com/jrtmMFv4qjtgMPQeaQzUFZ3EYBkHd_8OFYl6O1Ngt5Pey52RJAR4u8K4IoPILkJz76a7s5U3DNaY3r3xnl7t8X4=s180-rw",
    "instamart.png": "https://play-lh.googleusercontent.com/ymXDmYihTOzgPDddKSvZRKzXkboAapBF2yoFIeQBaWSAJmC9IUpSPKgvfaAgS5yFxQ=s180-rw"
}

public_dir = r"c:\Users\MUDIT GARG\Downloads\stitch_global_ai_kitchen_coach\public"

# Make sure directory exists
os.makedirs(public_dir, exist_ok=True)

for filename, url in logos.items():
    dest_path = os.path.join(public_dir, filename)
    print(f"Downloading {url} to {dest_path}...")
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        with urllib.request.urlopen(req) as response, open(dest_path, 'wb') as out_file:
            data = response.read()
            out_file.write(data)
            print(f"Successfully downloaded {filename} ({len(data)} bytes)")
    except Exception as e:
        print(f"Error downloading {filename}: {e}")

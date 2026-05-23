import re

file_path = r"C:\Users\MUDIT GARG\.gemini\antigravity\brain\d9f45e84-252f-476d-b41b-59ada030a063\.system_generated\steps\3199\content.md"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Look for patterns like <img class="..." src="..." alt="Icon image" ...> or similar
# Let's search for image tags first
img_tags = re.findall(r'<img [^>]*src="[^"]*"[^>]*>', content)
print(f"Found {len(img_tags)} img tags")
for img in img_tags:
    if "icon" in img.lower() or "logo" in img.lower() or "googleusercontent" in img:
        print(img)

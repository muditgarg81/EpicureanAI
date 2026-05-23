const fs = require('fs');
const path = require('path');

function search(dir, keyword) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file.startsWith('.')) continue;
    const fullPath = path.join(dir, file);
    try {
      if (fs.statSync(fullPath).isDirectory()) {
        search(fullPath, keyword);
      } else {
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (content.toLowerCase().includes(keyword.toLowerCase())) {
          console.log(`FOUND IN: ${fullPath}`);
        }
      }
    } catch (e) {
      // ignore
    }
  }
}

search('C:/Users/MUDIT GARG/Downloads/stitch_global_ai_kitchen_coach', 'Farm Eggs');

const fs = require('fs');
const path = require('path');

function search(dir, keyword) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      search(fullPath, keyword);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx') || fullPath.endsWith('.json')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        console.log(`FOUND IN: ${fullPath}`);
      }
    }
  }
}

search('C:/Users/MUDIT GARG/Downloads/stitch_global_ai_kitchen_coach/src', 'farm eggs');

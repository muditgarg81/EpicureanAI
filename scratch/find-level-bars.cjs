const fs = require('fs');
const path = require('path');

function isBinary(file) {
  const ext = path.extname(file).toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.gif', '.xlsx', '.pdf', '.docx'].includes(ext);
}

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        searchDir(fullPath);
      }
    } else if (stat.isFile() && !isBinary(file) && (file.endsWith('.js') || file.endsWith('.jsx'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('getItemLevel') || content.includes('levelBarColor')) {
        console.log(`File: ${fullPath} contains level functions`);
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('getItemLevel') || line.includes('levelBarColor')) {
            console.log(`  Line ${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

const rootDir = 'C:\\Users\\MUDIT GARG\\Downloads\\stitch_global_ai_kitchen_coach\\src';
searchDir(rootDir);

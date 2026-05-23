const fs = require('fs');
const content = fs.readFileSync('./src/pages/FamilyKitchenHub.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('culinaryData') || line.includes('getDishImage') || line.includes('cleanIngredientName')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});

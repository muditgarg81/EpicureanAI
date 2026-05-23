const fs = require('fs');

function showContext(filePath, pattern) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  console.log(`=== Matches in ${filePath} for "${pattern}" ===`);
  lines.forEach((line, index) => {
    if (line.includes(pattern)) {
      console.log(`${index + 1}: ${line.trim()}`);
    }
  });
}

showContext('./src/pages/WeeklyMealPlanner.jsx', 'addGroceryItem');
showContext('./src/pages/PantryInventory.jsx', 'addGroceryItem');
showContext('./src/pages/FlavorProfilePantry.jsx', 'groceryList');
showContext('./src/pages/WeeklyMealPlanner.jsx', 'ingredients');

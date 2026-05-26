const xlsx = require('xlsx');

function run() {
  const workbook = xlsx.readFile('C:/Users/MUDIT GARG/Downloads/stitch_global_ai_kitchen_coach/world_dishes_database.xlsx');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);
  
  const samosas = data.filter(row => row.dish_name && row.dish_name.toLowerCase().includes('samosa'));
  console.log("Samosas in Excel:");
  samosas.forEach(s => console.log(s.dish_name));
}

run();

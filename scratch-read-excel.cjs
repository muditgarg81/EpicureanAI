const xlsx = require('xlsx');

function run() {
  try {
    const workbook = xlsx.readFile('world_dishes_database.xlsx');
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, {header: 1});
    console.log('Headers:', data[0]);
    console.log('Row 1:', data[1]);
  } catch(e) {
    console.error("Error reading excel:", e.message);
  }
}
run();

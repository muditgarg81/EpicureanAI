const xlsx = require('xlsx');

try {
  const workbook = xlsx.readFile('world_dishes_database.xlsx');
  console.log('Sheet Names:', workbook.SheetNames);
  
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Get first 3 rows as JSON
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  console.log('Headers:', data[0]);
  console.log('Row 1:', data[1]);
  console.log('Row 2:', data[2]);
} catch (e) {
  console.error(e);
}

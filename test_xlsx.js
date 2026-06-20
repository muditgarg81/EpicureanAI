import * as XLSX from 'xlsx';
import fs from 'fs';

const buf = fs.readFileSync('world_dishes_database.xlsx');
const workbook = XLSX.read(buf);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log("Headers:", json[0]);
console.log("First row:", json[1]);

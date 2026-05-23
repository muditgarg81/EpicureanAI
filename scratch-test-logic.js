const fs = require('fs');
const culinaryData = fs.readFileSync('src/data/culinaryData.js', 'utf8');

// Quick dirty parse
let inBank = false;
let lines = culinaryData.split('\n');
let keys = [];
for (let line of lines) {
  if (line.includes('export const culinaryDataBank = {') || line.includes('const culinaryDataBank = {')) {
    inBank = true;
    continue;
  }
  if (inBank && line.match(/^\s+'([^']+)'/)) {
    keys.push(line.match(/^\s+'([^']+)'/)[1]);
  }
}

console.log("Keys found:", keys.length);
if (keys.includes('lasagna')) console.log("lasagna is present");
if (keys.includes('cacio_e_pepe')) console.log("cacio_e_pepe is present");

const lowerQuery = "pasta";
// Simulate the filter
const matches = keys.filter(key => {
  // We can't eval the whole object easily without Babel, but we know it should work
  const textToSearch = `${key} cacio_e_pepe description pasta`.toLowerCase();
  return textToSearch.includes(lowerQuery);
});
console.log("Matches:", matches.length);

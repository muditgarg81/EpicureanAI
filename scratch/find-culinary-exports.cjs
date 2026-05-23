const fs = require('fs');
const content = fs.readFileSync('./src/data/culinaryData.js', 'utf8');
const lines = content.split('\n');
console.log('Last 30 lines of culinaryData.js:');
lines.slice(-30).forEach((line, index) => {
  console.log(`${lines.length - 29 + index}: ${line}`);
});

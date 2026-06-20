const gis = require('g-i-s');

gis('Lassi (Salted) authentic food', logResults);

function logResults(error, results) {
  if (error) {
    console.log(error);
  }
  else {
    console.log(JSON.stringify(results.slice(0, 3), null, 2));
  }
}

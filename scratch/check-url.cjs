const https = require('https');

const url = 'https://upload.wikimedia.org/wikipedia/commons/e/e0/My_breakfast_menemen.jpg';

https.get(url, (res) => {
  console.log('Status Code:', res.statusCode);
  if (res.statusCode >= 300 && res.statusCode < 400) {
    console.log('Redirects to:', res.headers.location);
  }
}).on('error', (e) => {
  console.error(e);
});

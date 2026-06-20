require('dotenv').config({path: '.env.local'});
const UNSPLASH_ACCESS_KEY = process.env.VITE_UNSPLASH_ACCESS_KEY;
async function run() {
  let uRes = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent('Dal Tadka food')}&per_page=3&orientation=landscape`, { headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` } });
  let uData = await uRes.json();
  console.log("Unsplash Results:", uData.results.map(r => r.urls.regular));
}
run();

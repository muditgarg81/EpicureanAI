import puppeteer from 'puppeteer';

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('PAGE ERROR (Crash):', err.toString());
  });

  console.log('Navigating to app...');
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle2' });
  
  console.log('Waiting for search bar...');
  await page.waitForSelector('input[type="text"]');
  
  console.log('Typing Banana Pudding...');
  await page.type('input[type="text"]', 'Banana Pudding');
  
  console.log('Clicking search button...');
  // Find the button with the search icon
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const searchBtn = btns.find(b => b.textContent.includes('Search') || b.innerHTML.includes('send'));
    if (searchBtn) searchBtn.click();
  });
  
  console.log('Waiting 3 seconds for results or crash...');
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('Done.');
  await browser.close();
  process.exit(0);
})();

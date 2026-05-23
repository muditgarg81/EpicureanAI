import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const routes = [
  { path: '/', name: '01_Onboarding_Welcome' },
  { path: '/onboarding/preferences', name: '02_Onboarding_Preferences' },
  { path: '/onboarding/coach', name: '03_Onboarding_Coach' },
  { path: '/onboarding/complete', name: '04_Onboarding_Complete' },
  { path: '/discovery', name: '05_Discovery_Home' },
  { path: '/generator', name: '06_AI_Recipe_Generator' },
  { path: '/pantry', name: '07_Pantry_Inventory' },
  { path: '/pantry-profile', name: '08_Flavor_Profile' },
  { path: '/pricing', name: '09_Pricing_Plans' },
  { path: '/checkout', name: '10_Secure_Checkout' },
  { path: '/success', name: '11_Payment_Success' },
  { path: '/help', name: '12_Help_Center' },
  { path: '/favorites', name: '13_Favorites' },
  { path: '/reset-password', name: '14_Reset_Password' },
  { path: '/terms', name: '15_Terms_And_Conditions' },
  { path: '/privacy', name: '16_Privacy_Policy' },
  { path: '/refund', name: '17_Refund_Policy' },
  { path: '/legal', name: '18_Legal_Policies' },
];

(async () => {
  const snapshotsDir = path.join(process.cwd(), 'snapshots');
  if (!fs.existsSync(snapshotsDir)) {
    fs.mkdirSync(snapshotsDir);
  }

  console.log('Starting Vite server...');
  const server = spawn('cmd.exe', ['/c', 'npm', 'run', 'dev'], { stdio: 'pipe' });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('Launching Puppeteer...');
  const browser = await puppeteer.launch({
    defaultViewport: { width: 390, height: 844, isMobile: true, hasTouch: true }, // iPhone 12 Pro resolution
  });
  
  const page = await browser.newPage();
  const baseUrl = 'http://localhost:5173';

  for (const route of routes) {
    console.log(`Capturing ${route.name}...`);
    try {
      await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle2' });
      // Inject some delay to let animations finish
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: path.join(snapshotsDir, `${route.name}.png`), fullPage: true });
    } catch (err) {
      console.error(`Failed to capture ${route.name}:`, err.message);
    }
  }

  // To capture authenticated routes, we could inject a mock session into localStorage here, 
  // but for simplicity, we've focused on public/onboarding routes above.

  console.log('Closing browser...');
  await browser.close();
  
  console.log('Shutting down server...');
  server.kill();
  
  console.log('Snapshots complete! Check the /snapshots directory.');
  process.exit(0);
})();

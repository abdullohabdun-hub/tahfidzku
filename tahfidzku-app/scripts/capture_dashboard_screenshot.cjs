const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\fahmi\\.gemini\\antigravity-ide\\brain\\5d69760b-815b-4911-b265-78afad074861';

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('1. Navigating to login page...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

  // Fill inputs
  const inputs = await page.$$('input');
  if (inputs.length >= 2) {
    await inputs[0].fill('admin@demo.com');
    await inputs[1].fill('123456');
  } else {
    await page.fill('#identifier', 'admin@demo.com');
    await page.fill('#pin', '123456');
  }

  console.log('2. Clicking submit...');
  await page.click('button[type="submit"]');

  console.log('3. Waiting for navigation to /admin...');
  await page.waitForURL('**/admin', { timeout: 15000 });
  await page.waitForTimeout(2000);

  const screenshotPath = path.join(ARTIFACT_DIR, 'local_phase2_dashboard_admin.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });

  console.log(`✅ Screenshot saved successfully to ${screenshotPath}`);
  await browser.close();
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});

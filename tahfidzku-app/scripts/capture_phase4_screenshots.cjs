const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function capturePhase4Screenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('1. Logging in as admin...');
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');

  await page.fill('#identifier', 'admin@demo.com');
  await page.fill('#pin', '123456');
  await page.click('button[type="submit"]');

  await page.waitForURL(url => url.pathname.includes('/admin'), { timeout: 10000 });
  console.log('✅ Logged in successfully!');

  // 2. Data Santri Page
  console.log('2. Navigating to Data Santri...');
  await page.goto('http://localhost:3000/admin/santri');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  const santriPath = path.join(process.cwd(), 'scratch', 'local_phase4_data_santri.png');
  const targetBrainPath1 = 'C:\\Users\\fahmi\\.gemini\\antigravity-ide\\brain\\5d69760b-815b-4911-b265-78afad074861\\local_phase4_data_santri.png';
  
  await page.screenshot({ path: santriPath, fullPage: true });
  fs.copyFileSync(santriPath, targetBrainPath1);
  console.log(`✅ Saved Data Santri screenshot to ${targetBrainPath1}`);

  // 3. Cetak Rapor Page
  console.log('3. Navigating to Cetak Rapor...');
  await page.goto('http://localhost:3000/admin/rapor');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  const raporPath = path.join(process.cwd(), 'scratch', 'local_phase4_cetak_rapor.png');
  const targetBrainPath2 = 'C:\\Users\\fahmi\\.gemini\\antigravity-ide\\brain\\5d69760b-815b-4911-b265-78afad074861\\local_phase4_cetak_rapor.png';

  await page.screenshot({ path: raporPath, fullPage: true });
  fs.copyFileSync(raporPath, targetBrainPath2);
  console.log(`✅ Saved Cetak Rapor screenshot to ${targetBrainPath2}`);

  await browser.close();
}

capturePhase4Screenshots().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});

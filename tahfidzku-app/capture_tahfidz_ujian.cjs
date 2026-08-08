const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.fill('input#identifier', 'santri1');
    await page.fill('input#pin', '123456');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('http://localhost:3000/', { timeout: 10000 });
    
    console.log('Capturing Ujian for Tahfidz...');
    await page.goto('http://localhost:3000/santri/ujian');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'C:\\Users\\fahmi\\.gemini\\antigravity-ide\\brain\\7bc9c0e8-1f2a-4d2e-a21a-b59750328582\\scratch\\tahfidz_ujian.png', fullPage: true });
    
  } catch(e) {
    console.error('Script Error:', e);
  } finally { await browser.close(); }
})();

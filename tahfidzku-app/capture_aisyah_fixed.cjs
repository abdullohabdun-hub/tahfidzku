const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for hydration
    
    await page.fill('input#identifier', 'aisyah');
    await page.fill('input#pin', '123456');
    await page.click('button[type="submit"]');
    
    console.log('Waiting for login navigation...');
    await page.waitForURL('http://localhost:3000/', { timeout: 10000 });
    console.log('Login successful! Capturing beranda...');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'C:\\Users\\fahmi\\.gemini\\antigravity-ide\\brain\\7bc9c0e8-1f2a-4d2e-a21a-b59750328582\\scratch\\iqra_beranda_aisyah_real.png', fullPage: true });
    
    console.log('Capturing riwayat...');
    await page.goto('http://localhost:3000/santri/riwayat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'C:\\Users\\fahmi\\.gemini\\antigravity-ide\\brain\\7bc9c0e8-1f2a-4d2e-a21a-b59750328582\\scratch\\iqra_riwayat_aisyah_real.png', fullPage: true });
    
  } catch(e) {
    console.error('Script Error:', e);
    await page.screenshot({ path: 'C:\\Users\\fahmi\\.gemini\\antigravity-ide\\brain\\7bc9c0e8-1f2a-4d2e-a21a-b59750328582\\scratch\\error_state.png', fullPage: true });
  } finally { await browser.close(); }
})();

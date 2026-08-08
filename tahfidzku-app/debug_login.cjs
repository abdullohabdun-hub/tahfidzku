const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await page.goto('http://localhost:3000/login');
    await page.fill('input#identifier', 'aisyah');
    await page.fill('input#pin', '123456');
    await page.click('button[type="submit"]');
    
    // Wait for either success navigation or error message
    await Promise.race([
      page.waitForURL('**/'),
      page.waitForSelector('.text-red-600') // Error message from login.tsx
    ]);
    
    // Get any error text if it exists
    const errorMsg = await page.evaluate(() => {
      const el = document.querySelector('.text-red-600');
      return el ? el.textContent : null;
    });
    console.log('Login Error Message:', errorMsg);
    
    const url = page.url();
    console.log('Current URL after login:', url);
    
    if (url !== 'http://localhost:3000/login') {
        console.log('Login successful! Capturing beranda...');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'C:\\Users\\fahmi\\.gemini\\antigravity-ide\\brain\\7bc9c0e8-1f2a-4d2e-a21a-b59750328582\\scratch\\iqra_beranda_aisyah_fixed.png', fullPage: true });
        
        console.log('Capturing riwayat...');
        await page.goto('http://localhost:3000/riwayat');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'C:\\Users\\fahmi\\.gemini\\antigravity-ide\\brain\\7bc9c0e8-1f2a-4d2e-a21a-b59750328582\\scratch\\iqra_riwayat_aisyah_fixed.png', fullPage: true });
    }
  } catch(e) {
    console.error('Script Error:', e);
  } finally { await browser.close(); }
})();

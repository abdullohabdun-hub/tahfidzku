const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.fill('input#identifier', 'aisyah');
    await page.fill('input#pin', '123456');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('http://localhost:3000/', { timeout: 10000 });
    
    await page.goto('http://localhost:3000/santri/riwayat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Click tab "Statistik & Analitik"
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const analitikTab = tabs.find(t => t.textContent.includes('Statistik & Analitik'));
      if (analitikTab) analitikTab.click();
    });
    
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'C:\\Users\\fahmi\\.gemini\\antigravity-ide\\brain\\7bc9c0e8-1f2a-4d2e-a21a-b59750328582\\scratch\\iqra_analitik_tab_placeholder.png', fullPage: true });
    
  } catch(e) {
    console.error('Script Error:', e);
  } finally { await browser.close(); }
})();

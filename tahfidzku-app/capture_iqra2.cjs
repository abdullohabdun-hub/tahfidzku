const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  try {
    console.log('Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input#identifier', 'admin@demo.com');
    await page.fill('input#pin', '123456');
    await page.click('button[type="submit"]');
    
    console.log('Waiting for network idle...');
    await page.waitForLoadState('networkidle');
    
    console.log('Going to Santri page...');
    await page.goto('http://localhost:3000/admin/santri');
    await page.waitForLoadState('networkidle');
    
    const clicked = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      for (const row of rows) {
        if (row.textContent.includes('Iqra')) {
          const menyamarBtn = Array.from(row.querySelectorAll('button')).find(b => b.textContent.includes('Mode Menyamar'));
          if (menyamarBtn) {
            menyamarBtn.click();
            return true;
          }
        }
      }
      return false;
    });

    if (!clicked) {
      console.log('No Iqra santri found or no menyamar button found');
      await browser.close();
      return;
    }

    console.log('Clicked menyamar. Waiting for navigation...');
    await page.waitForLoadState('networkidle');
    
    console.log('Taking Beranda screenshot...');
    await page.screenshot({ path: 'C:\\Users\\fahmi\\.gemini\\antigravity-ide\\brain\\7bc9c0e8-1f2a-4d2e-a21a-b59750328582\\scratch\\iqra_beranda.png' });

    console.log('Going to Riwayat tab...');
    await page.goto('http://localhost:3000/santri/riwayat');
    await page.waitForLoadState('networkidle');
    
    console.log('Clicking Analitik tab...');
    const tabs = page.locator('button[role="tab"]');
    const count = await tabs.count();
    let foundAnalitik = false;
    for (let i = 0; i < count; i++) {
      const text = await tabs.nth(i).textContent();
      if (text.includes('Statistik') || text.includes('Analitik')) {
        await tabs.nth(i).click();
        foundAnalitik = true;
        break;
      }
    }
    
    if (foundAnalitik) {
      await page.waitForTimeout(1000);
      console.log('Taking Analitik screenshot...');
      await page.screenshot({ path: 'C:\\Users\\fahmi\\.gemini\\antigravity-ide\\brain\\7bc9c0e8-1f2a-4d2e-a21a-b59750328582\\scratch\\iqra_analitik.png', fullPage: true });
    } else {
      console.log('Analitik tab not found');
      await page.screenshot({ path: 'C:\\Users\\fahmi\\.gemini\\antigravity-ide\\brain\\7bc9c0e8-1f2a-4d2e-a21a-b59750328582\\scratch\\iqra_analitik_fallback.png', fullPage: true });
    }

  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();

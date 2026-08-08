const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  try {
    console.log('Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin**');
    
    console.log('Going to Santri page...');
    await page.goto('http://localhost:3000/admin/santri');
    await page.waitForLoadState('networkidle');
    
    // Find Iqra santri (Look for "Iqra" text in table)
    // Actually, just click "Mode Menyamar" on a row where the type is Iqra.
    // In Tahfidzku, the Santri table shows type (e.g. Iqra / Tahfidz). 
    // Let's just evaluate in the page to find an Iqra santri and click its Menyamar button.
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
    // When Menyamar is clicked, it opens a new tab or navigates? It usually navigates to /santri.
    await page.waitForURL('**/santri**');
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
    }

  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();

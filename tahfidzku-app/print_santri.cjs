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
    
    await page.waitForLoadState('networkidle');
    await page.goto('http://localhost:3000/admin/santri');
    
    console.log('Waiting for table rows...');
    await page.waitForSelector('tbody tr', { timeout: 10000 }).catch(() => console.log('Timeout waiting for rows'));
    await page.waitForTimeout(2000); // Wait a bit more for React rendering
    
    const santriData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      return rows.map(row => {
        return row.textContent.replace(/\s+/g, ' ').trim();
      });
    });

    console.log('Santri List:', santriData);
    
    // Now look for any Santri Iqra and Menyamar
    const iqraHref = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      for (const link of links) {
        if (link.textContent.includes('Mode Menyamar') && link.href) {
          // Check if row has Iqra
          const row = link.closest('tr');
          if (row && row.textContent.includes('Iqra')) {
            return link.href;
          }
        }
      }
      return null;
    });

    if (iqraHref) {
       console.log('Found Iqra santri, going to', iqraHref);
       await page.goto(iqraHref);
       await page.waitForLoadState('networkidle');
       await page.waitForTimeout(2000);
       await page.screenshot({ path: 'C:\\Users\\fahmi\\.gemini\\antigravity-ide\\brain\\7bc9c0e8-1f2a-4d2e-a21a-b59750328582\\scratch\\iqra_beranda.png', fullPage: true });
       
       await page.goto('http://localhost:3000/santri/riwayat');
       await page.waitForLoadState('networkidle');
       await page.waitForTimeout(2000);
       await page.screenshot({ path: 'C:\\Users\\fahmi\\.gemini\\antigravity-ide\\brain\\7bc9c0e8-1f2a-4d2e-a21a-b59750328582\\scratch\\iqra_analitik.png', fullPage: true });
       console.log('Screenshots taken');
    } else {
       console.log('No Iqra santri found');
    }

  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();

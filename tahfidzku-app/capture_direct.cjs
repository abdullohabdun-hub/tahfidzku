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
    console.log('Going to Santri Profile...');
    await page.goto('http://localhost:3000/admin/santri/78227c18-b76a-48b9-8d0b-0315a4b679da');
    await page.waitForLoadState('networkidle');
    
    console.log('Clicking Menyamar...');
    // Look for button that says "Mode Menyamar" or "Menyamar"
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Menyamar'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (clicked) {
       console.log('Clicked menyamar. Waiting for navigation...');
       await page.waitForLoadState('networkidle');
       await page.waitForTimeout(2000);
       await page.screenshot({ path: 'C:\\Users\\fahmi\\.gemini\\antigravity-ide\\brain\\7bc9c0e8-1f2a-4d2e-a21a-b59750328582\\scratch\\iqra_beranda.png', fullPage: true });
       
       await page.goto('http://localhost:3000/santri/riwayat');
       await page.waitForLoadState('networkidle');
       await page.waitForTimeout(2000);
       await page.screenshot({ path: 'C:\\Users\\fahmi\\.gemini\\antigravity-ide\\brain\\7bc9c0e8-1f2a-4d2e-a21a-b59750328582\\scratch\\iqra_analitik.png', fullPage: true });
       console.log('Screenshots taken');
    } else {
       console.log('Menyamar button not found on profile');
    }

  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();

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
    
    console.log('Taking Santri List screenshot...');
    await page.screenshot({ path: 'C:\\Users\\fahmi\\.gemini\\antigravity-ide\\brain\\7bc9c0e8-1f2a-4d2e-a21a-b59750328582\\scratch\\santri_list.png', fullPage: true });

  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();

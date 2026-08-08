import { chromium } from 'playwright';
import 'dotenv/config';
import { db } from './src/db/index.ts';
import { users, tenants } from './src/db/schema/index.ts';
import { eq } from 'drizzle-orm';

(async () => {
  console.log('Starting Playwright script...');
  // Setup DB: Create a dummy user
  const tenant = await db.query.tenants.findFirst({ where: eq(tenants.slug, 'tahfidzonlinetsl') });
  if (!tenant) throw new Error('Tenant not found');

  const username = 'ustadz_multi_' + Date.now();
  const [dummy] = await db.insert(users).values({
    tenantId: tenant.id,
    nama: 'Ustadz Multi Dummy',
    username,
    passwordHash: '1234',
    role: 'ustadz',
    roles: ['ustadz', 'admin'],
  }).returning();
  
  console.log('Dummy user created:', username);

  const browser = await chromium.launch({ headless: true });
  
  // Context 1: Super Admin
  const context1 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page1 = await context1.newPage();
  try {
    console.log('Logging in as superadmin to capture form...');
    await page1.goto('http://localhost:3000/login');
    await page1.waitForLoadState('networkidle');
    await page1.fill('input#identifier', 'superadmin');
    await page1.fill('input#pin', '123456');
    await page1.click('button[type="submit"]');
    await page1.waitForURL('http://localhost:3000/admin', { timeout: 10000 });
    
    await page1.goto('http://localhost:3000/admin/ustadz');
    await page1.waitForLoadState('networkidle');
    await page1.waitForTimeout(2000);
    
    // Click "Tambah Ustadz"
    await page1.click('button:has-text("Tambah Ustadz")');
    await page1.waitForTimeout(1000); // wait for form
    
    await page1.screenshot({ path: 'C:\\Users\\fahmi\\.gemini\\antigravity-ide\\brain\\08760585-d7c5-449e-a442-fb20ab646071\\scratch\\FormUstadzCheckbox.png', fullPage: true });
    console.log('Saved FormUstadzCheckbox.png');
  } catch (e) {
    console.error('Error in Context 1:', e);
  } finally {
    await context1.close();
  }

  // Context 2: Multi-Role Ustadz
  const context2 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page2 = await context2.newPage();
  try {
    console.log('Logging in as new ustadz to capture role switcher...');
    // Context 2: Multi-Role Ustadz (Test Admin layout for z-index issue)
    await page2.goto('http://localhost:3000/login');
    await page2.waitForLoadState('networkidle');
    await page2.fill('input#identifier', username);
    await page2.fill('input#pin', '1234');
    await page2.click('button[type="submit"]');
    
    // Ustadz will be redirected to /ustadz
    await page2.waitForURL('http://localhost:3000/ustadz', { timeout: 10000 });
    
    // Now switch role to admin (click role switcher)
    await page2.click('button:has-text("Ustadz")');
    await page2.waitForTimeout(500);
    await page2.click('div[role="menuitem"]:has-text("Admin")');
    
    // Wait for redirect to admin
    await page2.waitForURL('http://localhost:3000/admin', { timeout: 10000 });
    await page2.waitForLoadState('networkidle');
    await page2.waitForTimeout(3000);

    // Capture closed dropdown in Admin
    await page2.screenshot({ path: 'C:\\Users\\fahmi\\.gemini\\antigravity-ide\\brain\\08760585-d7c5-449e-a442-fb20ab646071\\scratch\\Admin_RoleSwitcher_Closed.png', fullPage: true });
    console.log('Saved Admin_RoleSwitcher_Closed.png');

    // Click the dropdown to open it
    await page2.click('button:has-text("Admin")');
    await page2.waitForTimeout(500); // Wait for animation

    // Capture open dropdown in Admin
    await page2.screenshot({ path: 'C:\\Users\\fahmi\\.gemini\\antigravity-ide\\brain\\08760585-d7c5-449e-a442-fb20ab646071\\scratch\\Admin_RoleSwitcher_Open.png', fullPage: true });
    console.log('Saved Admin_RoleSwitcher_Open.png');
  } catch(e) {
    console.error('Error in Context 2:', e);
  } finally {
    await context2.close();
  }

  await browser.close();
  console.log('All screenshots captured!');
  process.exit(0);
})();

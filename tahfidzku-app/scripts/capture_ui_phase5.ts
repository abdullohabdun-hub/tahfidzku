import { chromium } from 'playwright'

async function run() {
  console.log('=== STARTING PERFECTED PLAYWRIGHT BROWSER CAPTURE FOR PHASE 5 ===')
  const browser = await chromium.launch({ headless: true })

  try {
    // ----------------------------------------------------
    // SCREENSHOT 1: Admin Santri Modal with Surah Dropdown Visible
    // ----------------------------------------------------
    const context1 = await browser.newContext({ viewport: { width: 1280, height: 950 } })
    const page1 = await context1.newPage()

    console.log('1. Navigating to http://localhost:3000/admin/santri...')
    await page1.goto('http://localhost:3000/admin/santri', { waitUntil: 'networkidle' })

    if (page1.url().includes('/login')) {
      console.log('Logging in as Admin...')
      await page1.fill('#identifier', 'admin@tahfidzku.com')
      await page1.fill('#pin', 'admin123')
      await page1.click('button[type="submit"]')
      await page1.waitForTimeout(1000)
      await page1.goto('http://localhost:3000/admin/santri', { waitUntil: 'networkidle' })
    }

    console.log('Clicking "Tambah Santri"...')
    await page1.click('button:has-text("Tambah Santri")')
    await page1.waitForSelector('text=Batas Hafalan Saat Ini', { timeout: 10000 })

    // Fill Nama
    await page1.fill('input[placeholder*="Nama"], input[required]:first-of-type', 'Santri Uji Quran Split')

    // Find Juz select inside Batas Hafalan section
    const selects = page1.locator('select')
    const count = await selects.count()
    console.log(`Found ${count} select elements in modal`)

    // Select option 30 in the juz dropdown
    for (let i = 0; i < count; i++) {
      const options = await selects.nth(i).locator('option').allTextContents()
      if (options.some(o => o.includes('Juz 30') || o === '30')) {
        await selects.nth(i).selectOption('30')
        console.log(`Selected Juz 30 on select #${i}`)
        break
      }
    }

    await page1.waitForTimeout(1000) // Wait for dynamic import

    // Select Surah An-Naba on Surah dropdown
    for (let i = 0; i < count; i++) {
      const optionsText = await selects.nth(i).locator('option').allTextContents()
      if (optionsText.some(t => t.includes('An-Naba'))) {
        await selects.nth(i).selectOption({ label: 'An-Naba' })
        console.log(`Selected Surah An-Naba on select #${i}`)
        break
      }
    }

    // Scroll modal container down to Batas Hafalan section
    await page1.evaluate(() => {
      const modal = document.querySelector('.overflow-y-auto') || document.querySelector('.bg-white.rounded-xl')
      if (modal) modal.scrollTop = 450
    })
    await page1.waitForTimeout(500)

    const screenshot1Path = 'C:/Users/fahmi/.gemini/antigravity-ide/brain/5d69760b-815b-4911-b265-78afad074861/local_phase5_admin_santri_modal.png'
    await page1.screenshot({ path: screenshot1Path })
    console.log(`Saved Screenshot 1: ${screenshot1Path}`)

    // ----------------------------------------------------
    // SCREENSHOT 2: Ustadz Input Page (/ustadz/input)
    // ----------------------------------------------------
    console.log('\n2. Fresh Context Login as Ustadz (ustadz@demo.com)...')
    const context2 = await browser.newContext({ viewport: { width: 1280, height: 950 } })
    const page2 = await context2.newPage()

    await page2.goto('http://localhost:3000/login', { waitUntil: 'networkidle' })
    await page2.fill('#identifier', 'ustadz@demo.com')
    await page2.fill('#pin', 'admin123')
    await page2.click('button[type="submit"]')
    await page2.waitForTimeout(1500)

    console.log('Navigating to http://localhost:3000/ustadz/input...')
    await page2.goto('http://localhost:3000/ustadz/input', { waitUntil: 'networkidle' })
    await page2.waitForTimeout(1000)

    console.log(`Current page URL: ${page2.url()}`)

    const screenshot2Path = 'C:/Users/fahmi/.gemini/antigravity-ide/brain/5d69760b-815b-4911-b265-78afad074861/local_phase5_ustadz_input.png'
    await page2.screenshot({ path: screenshot2Path })
    console.log(`Saved Screenshot 2: ${screenshot2Path}`)

    if (page2.url().includes('/ustadz/input')) {
      console.log('✅ BOTH SCREENSHOTS CAPTURED 100% PROPERLY!')
    } else {
      console.error('❌ Ustadz input navigation failed, URL:', page2.url())
    }
  } catch (err) {
    console.error('Error during screenshot capture:', err)
  } finally {
    await browser.close()
  }
}

run()

import { chromium } from 'playwright'

async function run() {
  console.log('=== STARTING PRE-FLIGHT FAST REGRESSION CHECK ACROSS 5 MAIN PAGES ===')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()

  const pagesToTest = [
    { name: 'Dashboard Admin', url: 'http://localhost:3000/admin' },
    { name: 'Data Santri', url: 'http://localhost:3000/admin/santri' },
    { name: 'Riwayat Ujian', url: 'http://localhost:3000/admin/ujian' },
    { name: 'Cetak Rapor', url: 'http://localhost:3000/admin/rapor' },
    { name: 'Input Setoran Ustadz', url: 'http://localhost:3000/ustadz/input' }
  ]

  try {
    // 1. Initial Login
    console.log('Logging in as Admin...')
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' })
    await page.fill('#identifier', 'admin@tahfidzku.com')
    await page.fill('#pin', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    for (const p of pagesToTest) {
      console.log(`Testing [${p.name}] at ${p.url}...`)
      const res = await page.goto(p.url, { waitUntil: 'networkidle' })
      const status = res?.status()
      const title = await page.title()
      console.log(`  -> Status: ${status}, Title: "${title}", URL: ${page.url()}`)
      if (status !== 200 && status !== 304) {
        throw new Error(`Page ${p.name} failed with HTTP status ${status}`)
      }
    }

    console.log('✅ ALL 5 MAIN PAGES PASSED PRE-FLIGHT REGRESSION CHECK!')
  } catch (err) {
    console.error('❌ PRE-FLIGHT REGRESSION CHECK FAILED:', err)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

run()

/**
 * Playwright screenshot script untuk verifikasi Ticket 4 & 5.
 * Jalankan: npx playwright test scripts/verify-t4-t5.spec.ts --headed=false
 *
 * Captures:
 * 1. /ustadz/input — tab colors (Ziyadah/Sabqi/Manzil)
 * 2. /ustadz — MotivationCard theme
 * 3. /santri/input — confirm same SetoranForm tab colors
 */

import { chromium } from 'playwright'
import path from 'path'
import fs from 'fs'

const BASE_URL = 'http://localhost:3002'
const OUT_DIR = path.join('screenshots-verify')

async function loginAs(page, identifier, password) {
  await page.goto(`${BASE_URL}/masuk/demo`)
  await page.waitForLoadState('networkidle')
  
  // Fill login form
  const idField = page.locator('input[type="text"], input[id="identifier"]').first()
  const pwField = page.locator('input[type="password"]').first()
  await idField.fill(identifier)
  await pwField.fill(password)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL((url) => !url.includes('/masuk'), { timeout: 10000 }).catch(() => {})
  await page.waitForLoadState('networkidle')
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()

  // --- Cek apakah ada login page ---
  await page.goto(BASE_URL)
  await page.waitForLoadState('networkidle')
  const loginUrl = page.url()
  console.log('Initial URL:', loginUrl)

  // Ambil screenshot login page awal untuk diagnosa jika perlu
  await page.screenshot({ path: path.join(OUT_DIR, '00-initial.png'), fullPage: false })
  console.log('✓ Screenshot: 00-initial.png')

  // --- Coba navigate ke halaman ustadz/input tanpa login (akan redirect) ---
  await page.goto(`${BASE_URL}/ustadz/input`)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: path.join(OUT_DIR, '01-ustadz-input-prelogin.png'), fullPage: false })
  console.log('Current URL after /ustadz/input:', page.url())

  // --- Screenshot halaman login yang muncul ---
  await page.screenshot({ path: path.join(OUT_DIR, '02-login-page.png'), fullPage: true })
  console.log('✓ Screenshot: 02-login-page.png')

  // --- Coba login jika form tersedia ---
  const hasForm = await page.locator('input[type="text"], input[type="email"]').count()
  console.log('Login form fields found:', hasForm)
  
  if (hasForm > 0) {
    // Try to find what slug is available
    await page.goto(`${BASE_URL}/masuk/demo`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(OUT_DIR, '03-masuk-demo.png'), fullPage: true })
    console.log('URL at /masuk/demo:', page.url())
  }

  await browser.close()
  console.log('\nAll screenshots saved to:', path.resolve(OUT_DIR))
}

main().catch(console.error)

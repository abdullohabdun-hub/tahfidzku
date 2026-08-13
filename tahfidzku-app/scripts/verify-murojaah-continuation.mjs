import { chromium } from 'playwright'
import { SignJWT } from 'jose'
import path from 'path'
import fs from 'fs'

const BASE_URL = 'http://localhost:3002'
const OUT_DIR = path.join('screenshots-verify')

const secretKey = process.env.AUTH_SECRET || 'b779375302088fa81be281c876c7f62d027ea871cf3e089cb15479a1d283308c'
const encodedKey = new TextEncoder().encode(secretKey)

async function createToken(user) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  return await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(encodedKey)
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

  const ustadzSafinah = {
    id: 'ab226255-373f-4d78-9c9d-62606f2b40d7',
    tenantId: '6c3da655-57ab-4c7b-af0a-eae84c891ffa',
    nama: 'Ustadz 5',
    email: null,
    username: 'ustadz5',
    role: 'ustadz',
    roles: ['ustadz'],
  }

  const browser = await chromium.launch({ headless: true })
  const token = await createToken(ustadzSafinah)
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await context.addCookies([
    { name: 'tahfidzku_session', value: token, domain: 'localhost', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }
  ])
  const page = await context.newPage()

  try {
    // 1. Open Input page
    await page.goto(`${BASE_URL}/ustadz/input`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)

    // Select santri "Santri Dewasa 2" or first santri
    const selSantri = page.locator('select').first()
    if (await selSantri.count() > 0) {
      await selSantri.selectOption({ index: 1 }).catch(() => {})
      await page.waitForTimeout(800)
    }

    // 2. Select Manzil tab
    const manzilTab = page.locator('button, div').filter({ hasText: 'Manzil' }).first()
    if (await manzilTab.count() > 0) {
      await manzilTab.click()
      await page.waitForTimeout(800)
    }

    // 3. Set Juz 30, Hal. Mulai 1, Hal. Selesai 10
    const selectJuz = page.locator('select').nth(1)
    if (await selectJuz.count() > 0) {
      await selectJuz.selectOption({ label: 'Juz 30' }).catch(() => {})
    }

    const inputHalMulai = page.locator('input[placeholder*="Hal. Mulai"], input[placeholder*="1 atau 1,5"]').first()
    const inputHalSelesai = page.locator('input[placeholder*="Hal. Selesai"], input[placeholder*="2 atau 2,5"]').first()

    if (await inputHalMulai.count() > 0) {
      await inputHalMulai.fill('1')
    }
    if (await inputHalSelesai.count() > 0) {
      await inputHalSelesai.fill('10')
    }

    // Select Skor 5 (Mumtaz)
    const btnSkor = page.locator('button:has-text("5")').first()
    if (await btnSkor.count() > 0) {
      await btnSkor.click().catch(() => {})
    }

    // Submit setoran
    const btnSubmit = page.locator('button[type="submit"]').first()
    if (await btnSubmit.count() > 0) {
      await btnSubmit.click().catch(() => {})
      await page.waitForTimeout(2000)
    }

    // 4. Open Input page again (or switch tab) to test continuation auto-refill
    await page.goto(`${BASE_URL}/ustadz/input`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)

    if (await selSantri.count() > 0) {
      await selSantri.selectOption({ index: 1 }).catch(() => {})
      await page.waitForTimeout(800)
    }

    if (await manzilTab.count() > 0) {
      await manzilTab.click()
      await page.waitForTimeout(1000)
    }

    await page.screenshot({ path: path.join(OUT_DIR, 'Continuation-Manzil-Hal11-AutoRefill.png'), fullPage: true })
    console.log('✓ Screenshot captured: Continuation-Manzil-Hal11-AutoRefill.png')

  } catch (err) {
    console.error('Failed test:', err)
  } finally {
    await context.close()
    await browser.close()
  }
}

main().catch(console.error)

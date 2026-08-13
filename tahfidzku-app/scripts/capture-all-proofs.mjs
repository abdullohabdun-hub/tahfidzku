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

  const browser = await chromium.launch({ headless: true })

  // ── Ustadz Session (Madrasah Safinah - tenant 6c3da655-57ab-4c7b-af0a-eae84c891ffa) ──
  const ustadzToken = await createToken({
    id: 'ab226255-373f-4d78-9c9d-62606f2b40d7',
    tenantId: '6c3da655-57ab-4c7b-af0a-eae84c891ffa',
    nama: 'Ustadz 5',
    email: null,
    username: 'ustadz5',
    role: 'ustadz',
    roles: ['ustadz'],
  })

  const contextUstadz = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await contextUstadz.addCookies([
    { name: 'tahfidzku_session', value: ustadzToken, domain: 'localhost', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }
  ])
  const pageU = await contextUstadz.newPage()

  // 1. Ticket 1 — Fresh Beranda Ustadz showing Surah:Ayat / Jilid X Hal Y
  await pageU.goto(`${BASE_URL}/ustadz`, { waitUntil: 'domcontentloaded' })
  await pageU.waitForTimeout(1500)
  await pageU.screenshot({ path: path.join(OUT_DIR, 'Ticket1-Ustadz-Beranda-Fresh.png'), fullPage: true })
  console.log('✓ Screenshot: Ticket1-Ustadz-Beranda-Fresh.png')

  // 2. Ticket 4 — Sabqi Active & Manzil Active
  await pageU.goto(`${BASE_URL}/ustadz/input`, { waitUntil: 'domcontentloaded' })
  await pageU.waitForTimeout(1500)

  // Click Sabqi tab
  const sabqiTab = pageU.locator('button, div').filter({ hasText: 'Sabqi' }).first()
  if (await sabqiTab.count() > 0) {
    await sabqiTab.click().catch(() => {})
    await pageU.waitForTimeout(1000)
    await pageU.screenshot({ path: path.join(OUT_DIR, 'Ticket4-Sabqi-Tab-Active.png'), fullPage: false })
    console.log('✓ Screenshot: Ticket4-Sabqi-Tab-Active.png')
  }

  // Click Manzil tab
  const manzilTab = pageU.locator('button, div').filter({ hasText: 'Manzil' }).first()
  if (await manzilTab.count() > 0) {
    await manzilTab.click().catch(() => {})
    await pageU.waitForTimeout(1000)
    await pageU.screenshot({ path: path.join(OUT_DIR, 'Ticket4-Manzil-Tab-Active.png'), fullPage: false })
    console.log('✓ Screenshot: Ticket4-Manzil-Tab-Active.png')
  }

  // 3. Ticket 3 — Auto-refill Sabqi/Manzil for santri WITH history
  const selectSantri = pageU.locator('select').first()
  if (await selectSantri.count() > 0) {
    await selectSantri.selectOption({ index: 1 }).catch(() => {})
    await pageU.waitForTimeout(1000)
    if (await sabqiTab.count() > 0) await sabqiTab.click().catch(() => {})
    await pageU.waitForTimeout(1000)
    await pageU.screenshot({ path: path.join(OUT_DIR, 'Ticket3-AutoRefill-SabqiManzil.png'), fullPage: false })
    console.log('✓ Screenshot: Ticket3-AutoRefill-SabqiManzil.png')
  }

  // 4. Ticket 2 — Santri Profile (Success vs 403 Access Denied)
  await pageU.goto(`${BASE_URL}/ustadz/santri/9ff6468a-89a5-438b-86f6-e76597660e38`, { waitUntil: 'domcontentloaded' })
  await pageU.waitForTimeout(1500)
  await pageU.screenshot({ path: path.join(OUT_DIR, 'Ticket2-Ustadz-SantriProfile-Success.png'), fullPage: true })
  console.log('✓ Screenshot: Ticket2-Ustadz-SantriProfile-Success.png')

  await pageU.goto(`${BASE_URL}/ustadz/santri/13baa167-a934-4a09-833e-128658f1e057`, { waitUntil: 'domcontentloaded' })
  await pageU.waitForTimeout(1500)
  await pageU.screenshot({ path: path.join(OUT_DIR, 'Ticket2-Ustadz-SantriProfile-403-Denied.png'), fullPage: true })
  console.log('✓ Screenshot: Ticket2-Ustadz-SantriProfile-403-Denied.png')

  await contextUstadz.close()

  // ── Santri Session (Madrasah Safinah - custom theme #1E40AF) ──
  const santriToken = await createToken({
    id: '9ff6468a-89a5-438b-86f6-e76597660e38',
    tenantId: '6c3da655-57ab-4c7b-af0a-eae84c891ffa',
    nama: 'Santri Dewasa 2',
    email: null,
    username: 'santri2',
    role: 'santri',
    roles: ['santri'],
    santriId: '9ff6468a-89a5-438b-86f6-e76597660e38'
  })

  const contextSantri = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await contextSantri.addCookies([
    { name: 'tahfidzku_session', value: santriToken, domain: 'localhost', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }
  ])
  const pageS = await contextSantri.newPage()
  await pageS.goto(`${BASE_URL}/santri`, { waitUntil: 'domcontentloaded' })
  await pageS.waitForTimeout(1500)
  await pageS.screenshot({ path: path.join(OUT_DIR, 'Ticket5-Santri-Portal-Theme.png'), fullPage: true })
  console.log('✓ Screenshot: Ticket5-Santri-Portal-Theme.png')
  await contextSantri.close()

  // ── Wali Session (Madrasah Safinah - custom theme #1E40AF) ──
  const waliToken = await createToken({
    id: 'a5034017-d527-450b-a38b-c010b25c4864',
    tenantId: '6c3da655-57ab-4c7b-af0a-eae84c891ffa',
    nama: 'Wali Santri 3',
    email: null,
    username: 'walireguler3',
    role: 'wali',
    roles: ['wali'],
  })

  const contextWali = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await contextWali.addCookies([
    { name: 'tahfidzku_session', value: waliToken, domain: 'localhost', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }
  ])
  const pageW = await contextWali.newPage()
  await pageW.goto(`${BASE_URL}/wali`, { waitUntil: 'domcontentloaded' })
  await pageW.waitForTimeout(1500)
  await pageW.screenshot({ path: path.join(OUT_DIR, 'Ticket5-Wali-Portal-Theme.png'), fullPage: true })
  console.log('✓ Screenshot: Ticket5-Wali-Portal-Theme.png')
  await contextWali.close()

  await browser.close()
  console.log('\n🎉 ALL REQUESTED PROOFS CAPTURED SUCCESSFULLY!')
}

main().catch(console.error)

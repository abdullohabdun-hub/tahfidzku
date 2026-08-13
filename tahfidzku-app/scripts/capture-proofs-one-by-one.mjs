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

async function capture(fileName, url, user, actionFn = null) {
  const browser = await chromium.launch({ headless: true })
  const token = await createToken(user)
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await context.addCookies([
    { name: 'tahfidzku_session', value: token, domain: 'localhost', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }
  ])
  const page = await context.newPage()

  try {
    await page.goto(`${BASE_URL}${url}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)
    if (actionFn) {
      await actionFn(page)
    }
    await page.screenshot({ path: path.join(OUT_DIR, fileName), fullPage: true })
    console.log(`✓ Screenshot captured: ${fileName}`)
  } catch (err) {
    console.error(`Failed ${fileName}:`, err.message)
  } finally {
    await context.close()
    await browser.close()
  }
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

  const santriSafinah = {
    id: '9ff6468a-89a5-438b-86f6-e76597660e38',
    tenantId: '6c3da655-57ab-4c7b-af0a-eae84c891ffa',
    nama: 'Santri Dewasa 2',
    email: null,
    username: 'santri2',
    role: 'santri',
    roles: ['santri'],
    santriId: '9ff6468a-89a5-438b-86f6-e76597660e38'
  }

  const waliSafinah = {
    id: 'a5034017-d527-450b-a38b-c010b25c4864',
    tenantId: '6c3da655-57ab-4c7b-af0a-eae84c891ffa',
    nama: 'Wali Santri 3',
    email: null,
    username: 'walireguler3',
    role: 'wali',
    roles: ['wali'],
  }

  // 1. Ticket 1: Beranda Ustadz Fresh (Surah:Ayat / Jilid X Hal Y)
  await capture('Ticket1-Ustadz-Beranda-Fresh.png', '/ustadz', ustadzSafinah)

  // 2. Ticket 4: Sabqi Tab Active
  await capture('Ticket4-Sabqi-Tab-Active.png', '/ustadz/input', ustadzSafinah, async (page) => {
    const btn = page.locator('button, div').filter({ hasText: 'Sabqi' }).first()
    if (await btn.count() > 0) {
      await btn.click()
      await page.waitForTimeout(1000)
    }
  })

  // 3. Ticket 4: Manzil Tab Active
  await capture('Ticket4-Manzil-Tab-Active.png', '/ustadz/input', ustadzSafinah, async (page) => {
    const btn = page.locator('button, div').filter({ hasText: 'Manzil' }).first()
    if (await btn.count() > 0) {
      await btn.click()
      await page.waitForTimeout(1000)
    }
  })

  // 4. Ticket 3: Auto-refill Sabqi/Manzil
  await capture('Ticket3-AutoRefill-SabqiManzil.png', '/ustadz/input', ustadzSafinah, async (page) => {
    const sel = page.locator('select').first()
    if (await sel.count() > 0) {
      await sel.selectOption({ index: 1 }).catch(() => {})
      await page.waitForTimeout(800)
    }
    const btn = page.locator('button, div').filter({ hasText: 'Sabqi' }).first()
    if (await btn.count() > 0) {
      await btn.click()
      await page.waitForTimeout(800)
    }
  })

  // 5. Ticket 2: Santri Profile Success
  await capture('Ticket2-Ustadz-SantriProfile-Success.png', '/ustadz/santri/9ff6468a-89a5-438b-86f6-e76597660e38', ustadzSafinah)

  // 6. Ticket 2: Santri Profile 403 Access Denied
  await capture('Ticket2-Ustadz-SantriProfile-403-Denied.png', '/ustadz/santri/13baa167-a934-4a09-833e-128658f1e057', ustadzSafinah)

  // 7. Ticket 5: Santri Portal Theme
  await capture('Ticket5-Santri-Portal-Theme.png', '/santri', santriSafinah)

  // 8. Ticket 5: Wali Portal Theme
  await capture('Ticket5-Wali-Portal-Theme.png', '/wali', waliSafinah)
}

main().catch(console.error)

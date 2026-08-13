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
  let browser
  try {
    browser = await chromium.launch({ headless: true })
    const token = await createToken(user)
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    await context.addCookies([
      { name: 'tahfidzku_session', value: token, domain: 'localhost', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }
    ])
    const page = await context.newPage()
    await page.goto(`${BASE_URL}${url}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)
    if (actionFn) await actionFn(page)
    await page.screenshot({ path: path.join(OUT_DIR, fileName), fullPage: true })
    console.log(`✓ Screenshot captured: ${fileName}`)
    await context.close()
  } catch (err) {
    console.error(`Failed ${fileName}:`, err.message)
  } finally {
    if (browser) await browser.close()
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

  // 1. Ustadz Portal under Blue Theme (Header, Avatar, Sidebar, Active Links)
  await capture('Final-Theme-Ustadz-Portal.png', '/ustadz', ustadzSafinah)

  // 2. Santri Portal under Blue Theme (Header, Avatar, Mobile/Desktop Navigation)
  await capture('Final-Theme-Santri-Portal.png', '/santri', santriSafinah)

  // 3. Ticket 3: Auto-Refill for Santri WITH Ziyadah History (Jujun JUnedi / Santri Dewasa 2)
  await capture('Final-AutoRefill-Sabqi-With-Ziyadah-History.png', '/ustadz/input', ustadzSafinah, async (page) => {
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
}

main().catch(console.error)

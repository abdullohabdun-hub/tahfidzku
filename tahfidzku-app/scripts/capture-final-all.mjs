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

  const adminSafinah = {
    id: 'f87a3294-82a1-4322-83b6-1ebbfab98754',
    tenantId: '6c3da655-57ab-4c7b-af0a-eae84c891ffa',
    nama: 'Admin Safinah',
    email: 'admin@safinah.com',
    username: 'adminsafinah',
    role: 'admin',
    roles: ['admin'],
  }

  const ustadzSafinah = {
    id: 'ab226255-373f-4d78-9c9d-62606f2b40d7',
    tenantId: '6c3da655-57ab-4c7b-af0a-eae84c891ffa',
    nama: 'Ustadz 5',
    email: null,
    username: 'ustadz5',
    role: 'ustadz',
    roles: ['ustadz'],
  }

  // 1. Admin Portal under Blue Theme (Chart bars blue, category badges per type)
  await capture('Final-Admin-Dashboard-BlueTheme.png', '/admin', adminSafinah)

  // 2. Ustadz Riwayat under Blue Theme
  await capture('Final-Ustadz-Riwayat-BlueTheme.png', '/ustadz/riwayat', ustadzSafinah)
}

main().catch(console.error)

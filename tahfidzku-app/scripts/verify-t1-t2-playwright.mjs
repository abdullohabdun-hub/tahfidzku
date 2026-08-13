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

  // Test case for Ustadz 5 (Madrasah Safinah)
  const token = await createToken({
    id: 'ab226255-373f-4d78-9c9d-62606f2b40d7',
    tenantId: '6c3da655-57ab-4c7b-af0a-eae84c891ffa',
    nama: 'Ustadz 5',
    email: null,
    username: 'ustadz5',
    role: 'ustadz',
    roles: ['ustadz'],
  })

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await context.addCookies([
    {
      name: 'tahfidzku_session',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    }
  ])

  const page = await context.newPage()

  // 1. Visit /ustadz (Ticket 1: Card Belum Setor displaying last position)
  await page.goto(`${BASE_URL}/ustadz`)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: path.join(OUT_DIR, `Ticket1-Ustadz-Beranda-PosisiTerakhir.png`), fullPage: true })
  console.log('✓ Screenshot: Ticket1-Ustadz-Beranda-PosisiTerakhir.png')

  // 2. Visit /ustadz/santri/9ff6468a-89a5-438b-86f6-e76597660e38 (Ticket 2: Santri Profile for Ustadz - valid santri)
  await page.goto(`${BASE_URL}/ustadz/santri/9ff6468a-89a5-438b-86f6-e76597660e38`)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: path.join(OUT_DIR, `Ticket2-Ustadz-SantriProfile-Valid.png`), fullPage: true })
  console.log('✓ Screenshot: Ticket2-Ustadz-SantriProfile-Valid.png')

  // 3. Visit /ustadz/santri/invalid-id (Ticket 2: Access Denied anti-enumeration view)
  await page.goto(`${BASE_URL}/ustadz/santri/00000000-0000-0000-0000-000000000000`)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: path.join(OUT_DIR, `Ticket2-Ustadz-SantriProfile-AccessDenied.png`), fullPage: true })
  console.log('✓ Screenshot: Ticket2-Ustadz-SantriProfile-AccessDenied.png')

  await browser.close()
}

main().catch(console.error)

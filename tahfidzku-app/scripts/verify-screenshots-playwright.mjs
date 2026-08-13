import { chromium } from 'playwright'
import { SignJWT } from 'jose'
import path from 'path'
import fs from 'fs'

const BASE_URL = 'http://localhost:3002'
const OUT_DIR = path.join('screenshots-verify')

// Read secret from .env or fallback
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

  // Users to test:
  // 1. Ustadz in Madrasah Safinah (tenantId: 6c3da655-57ab-4c7b-af0a-eae84c891ffa, themeColor: #1E40AF - Biru Baja)
  // 2. Ustadz in Tahfidz Online TSL (tenantId: 7fae19f0-fd8f-4049-9f16-46e1a762f5e3, themeColor: #4338CA - Biru Indigo)
  // 3. Ustadz in Tenant 1 (tenantId: 5c970fd0-6426-40ee-96c3-ac2c634a4476, themeConfigured: false - Default Green)

  const testCases = [
    {
      label: 'Tenant-Safinah-BiruBaja',
      user: {
        id: 'ab226255-373f-4d78-9c9d-62606f2b40d7',
        tenantId: '6c3da655-57ab-4c7b-af0a-eae84c891ffa',
        nama: 'Ustadz 5',
        email: null,
        username: 'ustadz5',
        role: 'ustadz',
        roles: ['ustadz'],
      }
    },
    {
      label: 'Tenant-TSL-Indigo',
      user: {
        id: '1a5f074a-b1bd-435b-8cf8-d70d6fccef97',
        tenantId: '7fae19f0-fd8f-4049-9f16-46e1a762f5e3',
        nama: 'Ustadz Fahmi',
        email: 'fahmitasik94@gmail.com',
        username: 'fahmisyahrir',
        role: 'ustadz',
        roles: ['ustadz'],
      }
    },
    {
      label: 'Tenant-Default-Fallback',
      user: {
        id: '3ed8646a-0fc0-420e-ba4c-ae09bf8859fb',
        tenantId: '8756d2fe-f9dc-495c-8c6c-94d8ed208aac',
        nama: 'Test Ustadz',
        email: 'c5688fab-914b-4411-9597-44bc53d9359d@test.com',
        username: null,
        role: 'ustadz',
        roles: ['ustadz'],
      }
    }
  ]

  for (const tc of testCases) {
    console.log(`\n=== Testing ${tc.label} ===`)
    const token = await createToken(tc.user)

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

    // 1. Visit /ustadz/input (Ticket 4 verification - Tabs)
    await page.goto(`${BASE_URL}/ustadz/input`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(OUT_DIR, `${tc.label}-ustadz-input.png`), fullPage: true })
    console.log(`✓ Screenshot: ${tc.label}-ustadz-input.png`)

    // 2. Visit /ustadz (Ticket 5 verification - MotivationCard & Portal Theme)
    await page.goto(`${BASE_URL}/ustadz`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(OUT_DIR, `${tc.label}-ustadz-dashboard.png`), fullPage: true })
    console.log(`✓ Screenshot: ${tc.label}-ustadz-dashboard.png`)

    await context.close()
  }

  await browser.close()
  console.log('\n✅ All screenshots captured successfully in screenshots-verify/')
}

main().catch(console.error)

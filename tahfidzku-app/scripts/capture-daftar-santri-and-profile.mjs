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

  const santriSafinah = {
    id: 'e1122334-5566-7788-9900-aabbccddeeff', // Santri Baru or Santri ID
    santriId: '04c7c88b-24ca-43bc-b5b6-7eb50caefdfb', // Real santri id
    tenantId: '6c3da655-57ab-4c7b-af0a-eae84c891ffa',
    nama: 'Santri Baru',
    email: 'santribaru@safinah.com',
    username: 'santribaru',
    role: 'santri',
    roles: ['santri'],
  }

  const browser = await chromium.launch({ headless: true })

  // 1. Ustadz Dashboard & Daftar Santri
  try {
    const token = await createToken(ustadzSafinah)
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    await context.addCookies([
      { name: 'tahfidzku_session', value: token, domain: 'localhost', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }
    ])
    const page = await context.newPage()

    // 1a. Dashboard Ustadz with Menu Cepat
    await page.goto(`${BASE_URL}/ustadz`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)
    await page.screenshot({ path: path.join(OUT_DIR, 'Ustadz-Dashboard-MenuCepat.png'), fullPage: true })
    console.log('✓ Captured: Ustadz-Dashboard-MenuCepat.png')

    // 1b. Daftar Santri Binaan Page
    await page.goto(`${BASE_URL}/ustadz/santri`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)
    await page.screenshot({ path: path.join(OUT_DIR, 'Daftar-Santri-Binaan-Page.png'), fullPage: true })
    console.log('✓ Captured: Daftar-Santri-Binaan-Page.png')

    // 1c. Click Profil Santri
    const linkProfil = page.locator('a:has-text("Profil")').first()
    if (await linkProfil.count() > 0) {
      await linkProfil.click()
      await page.waitForTimeout(1500)
      await page.screenshot({ path: path.join(OUT_DIR, 'Ustadz-View-Santri-Profile.png'), fullPage: true })
      console.log('✓ Captured: Ustadz-View-Santri-Profile.png')
    }

    await context.close()
  } catch (err) {
    console.error('Ustadz flow failed:', err)
  }

  // 2. Santri Self-Profile Page
  try {
    const token = await createToken(santriSafinah)
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    await context.addCookies([
      { name: 'tahfidzku_session', value: token, domain: 'localhost', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }
    ])
    const page = await context.newPage()

    await page.goto(`${BASE_URL}/santri/profil`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)
    await page.screenshot({ path: path.join(OUT_DIR, 'Santri-Self-Profile-Page.png'), fullPage: true })
    console.log('✓ Captured: Santri-Self-Profile-Page.png')

    await context.close()
  } catch (err) {
    console.error('Santri profile flow failed:', err)
  } finally {
    await browser.close()
  }
}

main().catch(console.error)

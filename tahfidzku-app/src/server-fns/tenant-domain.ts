// src/server-fns/tenant-domain.ts
// Server Functions untuk Pengelolaan Custom Domain via Vercel Domains API

import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { tenants } from '../db/schema'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { success, handleError } from '../lib/response'
import { AuthenticationError, ValidationError } from '../lib/errors'
import { sanitizeCustomDomainInput, isValidCustomDomain } from '../lib/domain-utils'

// ---------------------------------------------------------------------------
// Helper: Cek apakah DNS domain sudah diarahkan dengan benar ke Vercel.
//
// Menggunakan endpoint /v6/domains/{domain}/config yang mengembalikan field
// `misconfigured: boolean`. Ini adalah sumber kebenaran DNS aktual, berbeda
// dari field `verified` di endpoint project domain yang hanya mengindikasikan
// "tidak ada konflik kepemilikan" — BUKAN indikasi DNS/SSL sudah beres.
//
// Referensi: https://vercel.com/docs/rest-api/endpoints/domains#get-a-domain-configuration
// ---------------------------------------------------------------------------
async function checkDomainMisconfigured(domain: string, vercelToken: string): Promise<boolean> {
  const res = await fetch(
    `https://api.vercel.com/v6/domains/${encodeURIComponent(domain)}/config`,
    { headers: { Authorization: `Bearer ${vercelToken}` } }
  )
  if (!res.ok) {
    // Kalau endpoint config gagal (misal domain belum pernah terdaftar),
    // kita asumsikan misconfigured = true (aman: default ke pending).
    return true
  }
  const json = await res.json()
  // `misconfigured: true`  → DNS belum diarahkan ke Vercel, SSL belum terbit
  // `misconfigured: false` → DNS sudah benar, SSL aktif
  return json.misconfigured === true
}

const VERCEL_PROJECT = 'tahfidzku-app'

export const addCustomDomain = createServerFn({ method: 'POST' })
  .validator((data: unknown) =>
    z.object({
      domain: z.string().min(3, 'Domain minimal 3 karakter'),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      // GUARDS BY DESIGN: tenantId diambil HANYA dari session
      const tenantId = session.user.tenantId

      const normalizedDomain = sanitizeCustomDomainInput(data.domain)

      // Guard 1: empty domain
      if (!normalizedDomain) {
        throw new ValidationError('Nama domain tidak boleh kosong.')
      }

      // Guard 2: system domain exact
      if (normalizedDomain === 'tahfidzku.my.id') {
        throw new ValidationError('Tidak dapat mendaftarkan domain utama sistem sebagai custom domain.')
      }

      // Guard 3: subdomain of system domain
      if (normalizedDomain.endsWith('.tahfidzku.my.id')) {
        throw new ValidationError('Tidak dapat mendaftarkan subdomain dari tahfidzku.my.id sebagai custom domain lembaga.')
      }

      // Guard 4: format validity
      if (!isValidCustomDomain(normalizedDomain)) {
        throw new ValidationError('Format domain tidak valid. Contoh yang benar: tahfidz.ponpesalfalah.sch.id')
      }

      // Guard 5: already registered to another tenant
      const existing = await db
        .select({ id: tenants.id })
        .from(tenants)
        .where(eq(tenants.customDomain, normalizedDomain))
        .limit(1)

      if (existing[0] && existing[0].id !== tenantId) {
        throw new ValidationError('Domain ini sudah terdaftar untuk lembaga lain.')
      }

      // Vercel API Call: Add domain to project
      const vercelToken = process.env.VERCEL_API_TOKEN
      if (!vercelToken) {
        throw new Error('VERCEL_API_TOKEN belum dikonfigurasi di server.')
      }

      const res = await fetch(`https://api.vercel.com/v10/projects/${VERCEL_PROJECT}/domains`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: normalizedDomain }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new ValidationError(result.error?.message || 'Gagal mendaftarkan domain ke Vercel.')
      }

      // PENTING: Jangan gunakan result.verified dari POST response untuk menentukan
      // status 'active'. Field `verified` di Vercel hanya berarti "tidak ada konflik
      // kepemilikan" — BUKAN "DNS sudah diarahkan dan SSL sudah aktif".
      // Domain yang baru didaftarkan SELALU dimulai sebagai 'pending'.
      // Status akan diperbarui oleh checkCustomDomainStatus setelah admin konfirmasi
      // bahwa DNS sudah diarahkan.
      await db
        .update(tenants)
        .set({
          customDomain: normalizedDomain,
          customDomainStatus: 'pending',
          customDomainVerifiedAt: null,
        })
        .where(eq(tenants.id, tenantId))

      return success(
        {
          domain: normalizedDomain,
          status: 'pending' as const,
          // Kirimkan verification hints (TXT record dll) ke UI supaya admin tahu
          // apa yang harus dikonfigurasi di DNS mereka.
          verified: false,
          verification: result.verification ?? null,
        },
        'Domain berhasil didaftarkan. Silakan arahkan CNAME record DNS Anda ke cname.vercel-dns.com, lalu klik "Cek Status" setelah DNS propagasi selesai (biasanya 5–60 menit).'
      )
    } catch (err: any) {
      if (err?.code === '23505' || err?.cause?.code === '23505') {
        return handleError(new ValidationError('Domain ini sudah terdaftar untuk lembaga lain.'))
      }
      return handleError(err)
    }
  })

export const checkCustomDomainStatus = createServerFn({ method: 'POST' })
  .handler(async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      // GUARDS BY DESIGN: tenantId & customDomain dari DB session user, BUKAN input client
      const tenantId = session.user.tenantId
      const tenant = await db
        .select({ customDomain: tenants.customDomain })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1)

      if (!tenant[0]?.customDomain) {
        throw new ValidationError('Belum ada domain yang terdaftar untuk lembaga ini.')
      }

      const domain = tenant[0].customDomain
      const vercelToken = process.env.VERCEL_API_TOKEN
      if (!vercelToken) {
        throw new Error('VERCEL_API_TOKEN belum dikonfigurasi di server.')
      }

      // --- Step 1: Cek kepemilikan / konflik domain via endpoint project ---
      const projectRes = await fetch(
        `https://api.vercel.com/v9/projects/${VERCEL_PROJECT}/domains/${encodeURIComponent(domain)}`,
        { headers: { Authorization: `Bearer ${vercelToken}` } }
      )
      const projectJson = await projectRes.json()

      if (!projectRes.ok) {
        throw new ValidationError(projectJson.error?.message || 'Gagal mengecek status domain dari Vercel.')
      }

      // --- Step 2: Cek konfigurasi DNS aktual via endpoint /v6/domains/{domain}/config ---
      // Endpoint ini adalah satu-satunya cara akurat untuk mengetahui apakah DNS
      // sudah diarahkan ke Vercel dan SSL sudah bisa diterbitkan.
      const isMisconfigured = await checkDomainMisconfigured(domain, vercelToken)

      // Status 'active' HANYA boleh di-set kalau KEDUA kondisi ini terpenuhi:
      // 1. verified === true  (tidak ada konflik kepemilikan di Vercel)
      // 2. misconfigured === false (DNS sudah benar-benar diarahkan ke Vercel)
      const isVerified = projectJson.verified === true
      const isFullyActive = isVerified && !isMisconfigured

      const newStatus = isFullyActive ? 'active' : 'pending'
      await db
        .update(tenants)
        .set({
          customDomainStatus: newStatus,
          customDomainVerifiedAt: isFullyActive ? new Date() : null,
        })
        .where(eq(tenants.id, tenantId))

      return success({
        status: newStatus,
        verified: isVerified,
        misconfigured: isMisconfigured,
        verification: projectJson.verification ?? null,
      }, isFullyActive
        ? 'Domain sudah aktif dan terverifikasi! SSL akan aktif dalam beberapa menit.'
        : isVerified
          ? 'Kepemilikan domain terverifikasi, tapi DNS belum diarahkan ke Vercel. Pastikan CNAME record sudah ditambahkan di panel DNS lembaga Anda.'
          : 'Domain masih dalam proses verifikasi. Silakan tambahkan DNS record sesuai instruksi di bawah.'
      )
    } catch (err) {
      return handleError(err)
    }
  })

export const removeCustomDomain = createServerFn({ method: 'POST' })
  .handler(async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      // GUARDS BY DESIGN: domain diambil dari DB tenantId session, BUKAN input client
      const tenantId = session.user.tenantId
      const tenant = await db
        .select({ customDomain: tenants.customDomain })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1)

      if (!tenant[0]?.customDomain) {
        return success(null, 'Tidak ada domain terdaftar untuk dihapus.')
      }

      const domain = tenant[0].customDomain
      const vercelToken = process.env.VERCEL_API_TOKEN
      if (vercelToken) {
        await fetch(`https://api.vercel.com/v9/projects/${VERCEL_PROJECT}/domains/${domain}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${vercelToken}` },
        })
      }

      await db
        .update(tenants)
        .set({
          customDomain: null,
          customDomainStatus: 'none',
          customDomainVerifiedAt: null,
        })
        .where(eq(tenants.id, tenantId))

      return success(null, 'Custom domain berhasil dihapus.')
    } catch (err) {
      return handleError(err)
    }
  })

export const resolveTenantContextServer = createServerFn({ method: 'GET' })
  .handler(async () => {
    try {
      const { getRequest } = await import('@tanstack/react-start/server')
      const { resolveTenantFromHost } = await import('../lib/tenant-resolver')
      const host = getRequest()?.headers.get('host')
      const tenant = await resolveTenantFromHost(host)
      return tenant
    } catch (err) {
      return null
    }
  })


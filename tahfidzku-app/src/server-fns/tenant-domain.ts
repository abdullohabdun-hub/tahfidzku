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

      await db
        .update(tenants)
        .set({
          customDomain: normalizedDomain,
          customDomainStatus: result.verified ? 'active' : 'pending',
          customDomainVerifiedAt: result.verified ? new Date() : null,
        })
        .where(eq(tenants.id, tenantId))

      return success(
        {
          domain: normalizedDomain,
          verified: result.verified ?? false,
          verification: result.verification ?? null,
        },
        'Domain berhasil didaftarkan. Silakan arahkan CNAME record DNS Anda ke cname.vercel-dns.com'
      )
    } catch (err) {
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

      const res = await fetch(
        `https://api.vercel.com/v9/projects/${VERCEL_PROJECT}/domains/${domain}`,
        {
          headers: { Authorization: `Bearer ${vercelToken}` },
        }
      )
      const result = await res.json()

      if (!res.ok) {
        throw new ValidationError(result.error?.message || 'Gagal mengecek status domain dari Vercel.')
      }

      const newStatus = result.verified ? 'active' : 'pending'
      await db
        .update(tenants)
        .set({
          customDomainStatus: newStatus,
          customDomainVerifiedAt: result.verified ? new Date() : null,
        })
        .where(eq(tenants.id, tenantId))

      return success({
        status: newStatus,
        verified: result.verified ?? false,
        verification: result.verification ?? null,
      }, result.verified ? 'Domain sudah aktif dan terverifikasi!' : 'Domain masih dalam proses verifikasi DNS.')
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

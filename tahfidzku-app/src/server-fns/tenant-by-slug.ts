import { createServerFn } from '@tanstack/react-start'
import { eq, and, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { tenants } from '../db/schema'

/**
 * Query inti — SATU sumber kebenaran untuk lookup tema per slug.
 * Digunakan oleh getTenantBySlug (server fn publik) dan API route manifest.
 */
export async function queryTenantThemeBySlug(slug: string) {
  return db
    .select({
      namaLembaga: tenants.namaLembaga,
      themeColor: tenants.themeColor,
      logoUrl: tenants.logoUrl,
    })
    .from(tenants)
    .where(
      and(
        eq(tenants.slug, slug),
        inArray(tenants.status, ['aktif', 'trial'])
      )
    )
    .limit(1)
}

/**
 * Query inti — SATU sumber kebenaran untuk lookup tema per custom domain active.
 */
export async function queryTenantThemeByCustomDomain(domain: string) {
  return db
    .select({
      namaLembaga: tenants.namaLembaga,
      themeColor: tenants.themeColor,
      logoUrl: tenants.logoUrl,
      slug: tenants.slug,
    })
    .from(tenants)
    .where(
      and(
        eq(tenants.customDomain, domain),
        eq(tenants.customDomainStatus, 'active'),
        inArray(tenants.status, ['aktif', 'trial'])
      )
    )
    .limit(1)
}


/**
 * Query inti — SATU sumber kebenaran untuk lookup tema per tenantId session.
 * Digunakan oleh API route manifest untuk user logged-in.
 */
export async function queryTenantThemeById(tenantId: string) {
  return db
    .select({
      themeColor: tenants.themeColor,
      logoUrl: tenants.logoUrl,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1)
}

/**
 * Server function publik (tanpa auth) untuk lookup info tema berdasarkan slug tenant.
 * Dipanggil dari halaman /masuk/[slug].
 */
export const getTenantBySlug = createServerFn({ method: 'POST' })
  .validator((data: unknown) =>
    z.object({
      slug: z.string().min(1, 'Slug wajib diisi'),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const result = await queryTenantThemeBySlug(data.slug)
    return result[0] ?? null
  })

// src/lib/tenant-resolver.ts
// Resolver context tenant dari Host header request (untuk branding publik, BUKAN otorisasi data)

import { queryTenantThemeBySlug, queryTenantThemeByCustomDomain } from '../server-fns/tenant-by-slug'
import { RESERVED_SLUGS, isUuidSlug } from './domain-utils'

export type HostnameTenantContext = {
  namaLembaga: string
  themeColor: string
  logoUrl: string | null
  slug: string
} | null

export async function resolveTenantFromHost(hostHeader: string | null | undefined): Promise<HostnameTenantContext> {
  if (!hostHeader) return null

  // Strip port (cth: localhost:3000 -> localhost, alfalah.tahfidzku.my.id:443 -> alfalah.tahfidzku.my.id)
  const bareHost = hostHeader.split(':')[0].toLowerCase().trim()

  // 1. Cek pola subdomain *.tahfidzku.my.id
  if (bareHost.endsWith('.tahfidzku.my.id')) {
    const label = bareHost.replace(/\.tahfidzku\.my\.id$/, '')
    
    // Abaikan 'www', reserved slug, dan slug format UUID
    if (label && label !== 'www' && !RESERVED_SLUGS.includes(label as any) && !isUuidSlug(label)) {
      const rows = await queryTenantThemeBySlug(label)
      if (rows[0]) {
        return {
          namaLembaga: rows[0].namaLembaga,
          themeColor: rows[0].themeColor,
          logoUrl: rows[0].logoUrl,
          slug: label,
        }
      }
    }
  }

  // 2. Cek custom domain active (cth: tahfidz.ponpesalfalah.sch.id)
  if (bareHost && bareHost !== 'tahfidzku.my.id' && bareHost !== 'www.tahfidzku.my.id' && bareHost !== 'localhost' && bareHost !== '127.0.0.1') {
    const rows = await queryTenantThemeByCustomDomain(bareHost)
    if (rows[0]) {
      return {
        namaLembaga: rows[0].namaLembaga,
        themeColor: rows[0].themeColor,
        logoUrl: rows[0].logoUrl,
        slug: rows[0].slug,
      }
    }
  }

  return null
}

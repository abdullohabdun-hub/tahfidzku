// src/lib/domain-utils.ts
// Utilitas validasi & sanitasi domain & slug tenant

export const RESERVED_SLUGS = [
  'admin', 'api', 'app', 'www', 'mail', 'superadmin', 'auth',
  'login', 'masuk', 'static', 'assets', 'staging', 'dev', 'portal', 'dashboard',
  'tahfidzku',
] as const

// RFC 1035 compliant: 3-63 karakter, huruf kecil/angka/tanda hubung, tak boleh diawali/diakhiri tanda hubung
export const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/

export function isValidSlugForDomain(slug: string): boolean {
  if (!slug) return false
  const normalized = slug.toLowerCase().trim()
  return (
    normalized.length >= 3 &&
    normalized.length <= 63 &&
    SLUG_REGEX.test(normalized) &&
    !RESERVED_SLUGS.includes(normalized as any)
  )
}

export function isUuidSlug(slug: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
}

export function sanitizeCustomDomainInput(input: string): string {
  if (!input) return ''
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '') // Buang http:// atau https://
    .replace(/\/.*$/, '')         // Buang path / slash setelah domain
    .replace(/\.$/, '')           // Buang trailing dot
}

export function isValidCustomDomain(domainInput: string): boolean {
  const domain = sanitizeCustomDomainInput(domainInput)
  if (!domain) return false
  // Format domain dasar — huruf, angka, titik, tanda hubung (min 1 tld, cth: foo.bar.com)
  return /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain)
}

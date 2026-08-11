import { describe, it, expect } from 'vitest'
import {
  isValidSlugForDomain,
  isUuidSlug,
  sanitizeCustomDomainInput,
  isValidCustomDomain,
  RESERVED_SLUGS,
} from '../../src/lib/domain-utils'
import { resolveCookieDomain } from '../../src/lib/session'

describe('domain-utils & cookie domain resolution', () => {
  it('sanitizes custom domain inputs cleanly', () => {
    expect(sanitizeCustomDomainInput('https://tahfidz.ponpesalfalah.sch.id/')).toBe('tahfidz.ponpesalfalah.sch.id')
    expect(sanitizeCustomDomainInput(' HTTP://MY-SCHOOL.EDU.ID ')).toBe('my-school.edu.id')
  })

  it('validates custom domain formats correctly', () => {
    expect(isValidCustomDomain('tahfidz.ponpesalfalah.sch.id')).toBe(true)
    expect(isValidCustomDomain('my-school.co.id')).toBe(true)
    expect(isValidCustomDomain('invalid-domain')).toBe(false)
    expect(isValidCustomDomain('')).toBe(false)
  })

  it('validates tenant slug RFC 1035 compliance and reserved words', () => {
    expect(isValidSlugForDomain('tsl-online')).toBe(true)
    expect(isValidSlugForDomain('demo')).toBe(true)
    expect(isValidSlugForDomain('tahfidzku')).toBe(false) // Reserved word
    expect(isValidSlugForDomain('admin')).toBe(false) // Reserved word
    expect(isValidSlugForDomain('t1')).toBe(false) // < 3 chars
    expect(isValidSlugForDomain('-tsl')).toBe(false) // Leading hyphen
  })

  it('identifies UUID format slugs to ignore', () => {
    expect(isUuidSlug('21b54241-02dc-4fcb-a4ae-0cd11533f856')).toBe(true)
    expect(isUuidSlug('tsl-online')).toBe(false)
  })

  it('resolves cookie domain correctly for subdomain vs custom domain', () => {
    expect(resolveCookieDomain('tsl-online.tahfidzku.my.id')).toBe('.tahfidzku.my.id')
    expect(resolveCookieDomain('tahfidzku.my.id')).toBe('.tahfidzku.my.id')
    expect(resolveCookieDomain('tahfidz.ponpesalfalah.sch.id')).toBe(undefined)
    expect(resolveCookieDomain('localhost:3000')).toBe(undefined)
  })
})

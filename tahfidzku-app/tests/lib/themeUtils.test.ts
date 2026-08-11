import { describe, it, expect } from 'vitest'
import { hexToOklchDetails, hexToOklch, SYSTEM_DEFAULT_HEX } from '../../src/lib/theme-utils'

describe('theme-utils', () => {
  it('converts #047857 to oklch correctly with float tolerance', () => {
    const details = hexToOklchDetails('#047857')
    expect(details.L).toBeCloseTo(0.508, 2)
    expect(details.C).toBeCloseTo(0.105, 2)
    expect(details.H).toBeCloseTo(165.6, 1)
    expect(hexToOklch('#047857')).toBe('oklch(0.508 0.105 165.6)')
  })

  it('converts #4338CA to oklch correctly', () => {
    const details = hexToOklchDetails('#4338CA')
    expect(details.L).toBeCloseTo(0.457, 2)
    expect(details.C).toBeCloseTo(0.215, 2)
    expect(details.H).toBeCloseTo(277.0, 1)
    expect(hexToOklch('#4338CA')).toBe('oklch(0.457 0.215 277.0)')
  })

  it('converts #FF5733 to oklch correctly', () => {
    const details = hexToOklchDetails('#FF5733')
    expect(details.L).toBeCloseTo(0.680, 2)
    expect(details.C).toBeCloseTo(0.210, 2)
    expect(details.H).toBeCloseTo(33.7, 1)
    expect(hexToOklch('#FF5733')).toBe('oklch(0.680 0.210 33.7)')
  })

  it('falls back to default hex when invalid hex is provided', () => {
    const fallback = hexToOklchDetails('invalid-hex')
    const expected = hexToOklchDetails(SYSTEM_DEFAULT_HEX)
    expect(fallback.L).toBeCloseTo(expected.L, 3)
    expect(fallback.C).toBeCloseTo(expected.C, 3)
    expect(fallback.H).toBeCloseTo(expected.H, 3)
  })
})

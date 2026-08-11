export const SYSTEM_DEFAULT_HEX = '#047857'

export const THEME_PRESETS = [
  { name: 'Hijau Emerald', hex: '#047857', contrast: '5.48:1' },
  { name: 'Biru Indigo',   hex: '#4338CA', contrast: '7.90:1' },
  { name: 'Teal',          hex: '#0F766E', contrast: '5.47:1' },
  { name: 'Ungu',          hex: '#7C3AED', contrast: '5.70:1' },
  { name: 'Merah Marun',   hex: '#9F1239', contrast: '8.02:1' },
  { name: 'Coklat Emas',   hex: '#92400E', contrast: '7.09:1' },
  { name: 'Biru Baja',     hex: '#1E40AF', contrast: '8.72:1' },
] as const

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return [r, g, b]
}

function linearize(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

export type OklchComponents = {
  L: number
  C: number
  H: number
  css: string
}

/**
 * Konversi Hex color (#RRGGBB) ke OKLCH object dan CSS string.
 * Jika format hex tidak valid, fallback ke SYSTEM_DEFAULT_HEX.
 */
export function hexToOklchDetails(hexInput: string): OklchComponents {
  const hex = HEX_REGEX.test(hexInput) ? hexInput : SYSTEM_DEFAULT_HEX

  const [r, g, b] = hexToRgb(hex).map(linearize)

  // sRGB -> XYZ D65
  const X = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b
  const Y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b
  const Z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b

  // XYZ -> LMS
  const l = 0.8189330101 * X + 0.3618667424 * Y - 0.1288597137 * Z
  const m = 0.0329845436 * X + 0.9293118715 * Y + 0.0361456387 * Z
  const s = 0.0482003018 * X + 0.2643662691 * Y + 0.6338517070 * Z

  // Cube root
  const l_ = Math.cbrt(l)
  const m_ = Math.cbrt(m)
  const s_ = Math.cbrt(s)

  // LMS -> Oklab
  const Lab_L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
  const Lab_a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
  const Lab_b = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_

  // Oklab -> OKLCH
  const C = Math.sqrt(Lab_a ** 2 + Lab_b ** 2)
  let H = (Math.atan2(Lab_b, Lab_a) * 180) / Math.PI
  if (H < 0) H += 360

  return {
    L: Lab_L,
    C,
    H,
    css: `oklch(${Lab_L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`
  }
}

/**
 * Konversi Hex color (#RRGGBB) ke string CSS oklch(L C H).
 */
export function hexToOklch(hexInput: string): string {
  return hexToOklchDetails(hexInput).css
}

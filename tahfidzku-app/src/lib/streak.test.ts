import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { hitungDailyStreak, hitungWeeklyStreak } from './streak'

describe('streak', () => {
  describe('hitungWeeklyStreak', () => {
    it('harus mengembalikan 0 jika array kosong', () => {
      expect(hitungWeeklyStreak([])).toBe(0)
    })

    it('harus menghitung 3 minggu berurutan', () => {
      const w30 = new Date('2026-07-21T10:00:00Z')
      const w29 = new Date('2026-07-14T10:00:00Z')
      const w28 = new Date('2026-07-07T10:00:00Z')
      const fakeNow = new Date('2026-07-23T10:00:00Z')
      
      expect(hitungWeeklyStreak([w30, w29, w28], fakeNow)).toBe(3)
    })

    it('harus terputus (mereturn 1) jika ada gap di minggu berjalan', () => {
      const w30 = new Date('2026-07-21T10:00:00Z')
      const w28 = new Date('2026-07-07T10:00:00Z')
      const fakeNow = new Date('2026-07-23T10:00:00Z')
      
      // w30 is current week. w29 is empty. streak = 1.
      expect(hitungWeeklyStreak([w30, w28], fakeNow)).toBe(1)
    })

    it('grace period: harus menghitung minggu lalu jika minggu ini kosong', () => {
      const w29 = new Date('2026-07-14T10:00:00Z')
      const w28 = new Date('2026-07-07T10:00:00Z')
      const fakeNow = new Date('2026-07-23T10:00:00Z') // which is w30
      
      expect(hitungWeeklyStreak([w29, w28], fakeNow)).toBe(2)
    })

    it('batas tahun: Dec 22 (W52), Dec 29 (W1 2026), Jan 4 (W1 2026)', () => {
      const dec22 = new Date('2025-12-22T10:00:00Z')
      const dec29 = new Date('2025-12-29T10:00:00Z')
      const jan4 = new Date('2026-01-04T10:00:00Z')
      const fakeNow = new Date('2026-01-05T10:00:00Z')
      
      expect(hitungWeeklyStreak([jan4, dec29, dec22], fakeNow)).toBe(2)
    })
    
    it('Timezone: setoran UTC 17:05 (hari berikutnya di WIB)', () => {
      // 2026-07-19T17:05:00Z is Monday 00:05 WIB (w30)
      const sundayLate = new Date('2026-07-19T17:05:00Z')
      const fakeNow = new Date('2026-07-21T10:00:00Z') // w30
      expect(hitungWeeklyStreak([sundayLate], fakeNow)).toBe(1)
    })
  })

  describe('hitungDailyStreak', () => {
    it('harus mengembalikan 0 jika array kosong', () => {
      expect(hitungDailyStreak([])).toBe(0)
    })

    it('harus menghitung 3 hari berurutan', () => {
      const now = new Date('2026-07-23T10:00:00Z')
      const d1 = new Date('2026-07-23T02:00:00Z')
      const d2 = new Date('2026-07-22T02:00:00Z')
      const d3 = new Date('2026-07-21T02:00:00Z')
      
      expect(hitungDailyStreak([d1, d2, d3], now)).toBe(3)
    })

    it('gap satu hari: mengembalikan 1 jika ada hari ini, tapi tidak kemarin', () => {
      const now = new Date('2026-07-23T10:00:00Z')
      const today = new Date('2026-07-23T02:00:00Z')
      const d3 = new Date('2026-07-21T02:00:00Z')
      
      expect(hitungDailyStreak([today, d3], now)).toBe(1)
    })
  })
})

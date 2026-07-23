import { getISOWeek, getISOWeekYear, subWeeks } from 'date-fns'

const TZ = 'Asia/Jakarta'

/** Konversi timestamp UTC → Date object UTC noon pada tanggal WIB yang sama */
function toWIBNoon(utcDate: Date): Date {
  const wibDateStr = new Date(utcDate).toLocaleDateString('en-CA', { timeZone: TZ })
  return new Date(wibDateStr + 'T12:00:00Z') // Suffix Z: eksplisit UTC, bukan local TZ
}

/** Format kunci minggu ISO: "YYYY-Www" */
function getISOWeekKey(date: Date): string {
  return `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`
}

/** Hitung streak harian berurutan (untuk santri reguler) */
export function hitungDailyStreak(rawDates: Date[], nowRef: Date = new Date()): number {
  if (rawDates.length === 0) return 0

  
  const uniqueDates = new Set( // Gunakan Set, bukan Array, untuk O(1) lookup
    rawDates.map(d => new Date(d).toLocaleDateString('en-CA', { timeZone: TZ }))
  )
  
  const todayStr = nowRef.toLocaleDateString('en-CA', { timeZone: TZ })
  // Gunakan ms-subtraction, bukan setDate() yang bergantung pada TZ runtime
  const yesterdayStr = new Date(nowRef.getTime() - 86400000).toLocaleDateString('en-CA', { timeZone: TZ })

  const anchorStr = uniqueDates.has(todayStr) ? todayStr
    : uniqueDates.has(yesterdayStr) ? yesterdayStr
    : null
    
  if (!anchorStr) return 0

  let streak = 0
  const check = new Date(anchorStr + 'T12:00:00Z') // Eksplisit UTC noon
  while (uniqueDates.has(check.toLocaleDateString('en-CA', { timeZone: TZ }))) {
    streak++
    check.setTime(check.getTime() - 86400000) // Ms-subtraction, bukan setDate()
  }
  return streak
}

/** Hitung streak mingguan berurutan (untuk santri dewasa) */
export function hitungWeeklyStreak(rawDates: Date[], nowRef: Date = new Date()): number {
  if (rawDates.length === 0) return 0
  
  const activeWeeks = new Set(rawDates.map(d => getISOWeekKey(toWIBNoon(d))))
  const nowNoon = toWIBNoon(nowRef)
  
  let anchor = activeWeeks.has(getISOWeekKey(nowNoon)) ? nowNoon : subWeeks(nowNoon, 1)
  let streak = 0
  
  while (activeWeeks.has(getISOWeekKey(anchor))) {
    streak++
    anchor = subWeeks(anchor, 1)
  }
  return streak
}

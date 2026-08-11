# Ticket 2: Dashboard Analitik Santri

**Status:** Backend (Fase 1-3) Selesai. Lanjut Fase 4 (UI).

## TECH DEBT
`getLegacyMingguMulaiKey()` di `src/lib/dateUtils.ts` sengaja mereplikasi bug `toISOString()` (tanggal mundur 1 hari untuk zona UTC+). Sebelum go-live production, perlu:
1. Ganti ke perhitungan tanggal lokal yang benar (misal `date-fns` `format()`).
2. Jalankan backfill untuk `rekap_mingguan_santri.mingguMulai` yang sudah tersimpan salah di database production saat itu terjadi.

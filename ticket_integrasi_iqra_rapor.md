# Ticket: Integrasi Data Iqra (Setoran & Ujian) ke Rapor Digital

## Konteks & Masalah
Rapor Digital (`rapor.ts` + `RaporTemplate.tsx`) saat ini scope-nya eksklusif untuk jalur Tahfidz — query hanya menarik dari tabel `setoran`, dan template tidak punya section untuk Iqra sama sekali. Sementara itu skema database untuk Iqra sudah lengkap: `setoran_iqra` (progres harian jilid/halaman) dan `ujian_iqra` (hasil kelulusan kenaikan jilid), dan ada `tahapSantriEnum` (`'iqra' | 'tahfidz'`) yang menandai santri masih di jalur mana.

Konsekuensi saat ini: santri yang statusnya masih `tahap = 'iqra'` kemungkinan besar menghasilkan rapor kosong/nyaris kosong kalau di-generate, karena satu-satunya sumber data rapor (tabel `setoran` Tahfidz) memang tidak punya row untuk mereka. Ini bukan cuma "fitur belum lengkap" — berpotensi silently menyesatkan ustadz/wali santri.

## ⚠️ Perlu Dikonfirmasi Dulu (evidence-first)
Tolong cek & kirim kode literal untuk hal-hal berikut sebelum ticket ini dieksekusi:

1. **Skema `setoran_iqra`** — field apa saja yang ada, terutama: apakah dia punya kolom tanggal setara `tanggal_setoran` (hasil migrasi Ticket 2a/2b), atau masih murni `created_at`? Kalau masih `created_at`, integrasi Iqra ke rapor akan mewarisi masalah yang sama persis yang baru saja diperbaiki untuk Tahfidz (periode rapor salah kalau ada input Iqra yang telat/backfill manual).
2. **Skema `ujian_iqra`** — field status kelulusan, jilid yang diuji, tanggal ujian, siapa penguji.
3. **Mekanisme transisi `tahapSantriEnum`** — pindah dari `'iqra'` ke `'tahfidz'` itu otomatis (mis. trigger setelah lulus ujian Iqra jilid terakhir) atau manual oleh ustadz? Ini penting untuk kasus santri yang naik tahap **di tengah periode rapor** — datanya akan bercampur dua sumber dalam satu periode yang sama.
4. **Struktur `RaporTemplate.tsx` saat ini** — apakah dia satu template generik yang perlu percabangan render berdasar `tahap`, atau perlu template terpisah untuk Iqra vs Tahfidz vs gabungan?
5. **UI generate rapor saat ini** — apakah ada guard yang mencegah/warning ustadz generate rapor untuk santri `tahap = 'iqra'`, atau tombolnya available begitu saja untuk semua santri tanpa pembeda? (Ini relevan untuk perilaku sementara sampai ticket ini selesai.)
6. **Cara `rapor.ts` query data sekarang** — per-santri satu-satu (berpotensi N+1) atau batched? Perlu tahu pola yang sudah ada supaya query Iqra baru mengikuti pola yang sama, bukan bikin pendekatan performa yang berbeda sendiri.

## Risiko Arsitektur

### 🔴 Risiko #1 — Santri transisi tahap di tengah periode rapor
Kalau santri naik dari Iqra ke Tahfidz di pertengahan bulan/semester, rapor untuk periode itu harus menampilkan **kedua** jenis data (progres Iqra sampai tanggal transisi + progres Tahfidz setelahnya), bukan cuma salah satu berdasarkan `tahap` terkini santri saat rapor di-generate. Kalau logic-nya cuma `if (santri.tahap === 'tahfidz') fetchTahfidz() else fetchIqra()`, riwayat Iqra sebelum transisi akan hilang dari rapor padahal itu bagian valid dari periode tersebut.

### 🟠 Risiko #2 — Konsistensi tanggal dengan fix yang baru selesai
Kalau `setoran_iqra` belum punya `tanggal_setoran` (masih `created_at`), integrasi ini akan menghasilkan rapor yang akurat untuk sisi Tahfidz tapi tidak akurat untuk sisi Iqra dalam satu dokumen yang sama — inkonsistensi yang membingungkan kalau tidak ditangani. Perlu diputuskan: apakah `setoran_iqra` ikut kena treatment migrasi tanggal yang sama (kemungkinan jadi ticket terpisah), atau untuk versi awal ini cukup pakai `created_at` dengan catatan known-limitation eksplisit.

### 🟡 Risiko #3 — Representasi hasil ujian di rapor
Apakah rapor menampilkan **semua riwayat ujian Iqra** dalam periode (termasuk yang tidak lulus, kalau ada percobaan ulang), atau cuma status/jilid terkini? Ini keputusan produk, bukan cuma teknis — perlu jawaban eksplisit sebelum desain query & UI.

### 🟡 Risiko #4 — Guard UI untuk perilaku sementara
Sebelum ticket ini selesai, kalau UI generate rapor tidak punya guard sama sekali, ada window waktu (sampai fix ini live) di mana ustadz bisa keliru generate rapor kosong untuk santri Iqra. Layak dipertimbangkan sebagai quick-fix terpisah (warning banner sederhana) kalau ticket integrasi penuh ini makan waktu lebih dari beberapa hari.

### 🟡 Risiko #5 — Performa
Menambah 2 sumber data baru (`setoran_iqra`, `ujian_iqra`) ke proses generate rapor per santri. Kalau pola query saat ini sudah N+1 per santri, menambah 2 query lagi per santri bisa menggandakan masalah performa yang sudah ada. Perlu tahu pola existing dulu (lihat pertanyaan blocking #6).

## Proposed Scope — Dipecah 3 Ticket

### Ticket 3a — Data Layer: Fetch & Gabungkan Data Iqra
- Tambah query di `rapor.ts` untuk `setoran_iqra` dan `ujian_iqra`, mengikuti pola query yang sudah ada (batched, bukan N+1).
- Payload rapor per santri sekarang membawa dua kemungkinan blok data: `dataTahfidz` dan/atau `dataIqra`, tergantung riwayat santri dalam periode terkait (bukan cuma `tahap` terkini — lihat Risiko #1).
- Tenant isolation & guard yang sama seperti query Tahfidz yang sudah ada.

### Ticket 3b — UI: Section Iqra di `RaporTemplate.tsx`
- Tambah section progres Iqra (jilid & halaman terakhir, riwayat setoran dalam periode).
- Tambah section riwayat ujian Iqra (jilid diuji, status, tanggal).
- Percabangan render: santri murni Iqra → cuma section Iqra; santri murni Tahfidz → cuma section Tahfidz (seperti sekarang); santri transisi dalam periode → tampilkan keduanya dengan pemisah tanggal transisi yang jelas.

### Ticket 3c — Perilaku Sementara (opsional, bisa dikerjakan lebih dulu sebagai quick-fix)
- Guard/warning di UI generate rapor untuk santri `tahap = 'iqra'` sebelum 3a & 3b selesai, supaya tidak ada window silently-wrong output.

## Acceptance Criteria
- [ ] Rapor santri `tahap = 'iqra'` menampilkan progres setoran Iqra & riwayat ujian, bukan kosong.
- [ ] Rapor santri yang naik tahap di tengah periode menampilkan kedua jenis data dengan jelas dipisah berdasarkan tanggal transisi.
- [ ] Tidak ada regresi pada rapor santri Tahfidz murni yang sudah berjalan.
- [ ] Query baru mengikuti pola performa yang sudah ada di `rapor.ts` (tidak menambah N+1 baru).
- [ ] Tenant isolation berlaku di query Iqra yang baru.

## Terkait Tapi Di Luar Scope
- Migrasi `tanggal_setoran` untuk `setoran_iqra` (kalau ternyata belum ada) — kemungkinan jadi ticket terpisah, tapi harus diputuskan dulu apakah jadi prasyarat sebelum 3a dieksekusi.
- Backfill by-date untuk input Iqra (setara Ticket 2a/2b tapi untuk Iqra) — belum diminta, tapi worth dicatat sebagai potensi inkonsistensi jangka panjang antara dua jalur.

## Evidence yang Diperlukan untuk Review Hasil
- Diff literal query baru di `rapor.ts` untuk `setoran_iqra`/`ujian_iqra`.
- Screenshot rapor santri Iqra murni (sebelumnya kosong → sekarang terisi).
- Screenshot rapor santri kasus transisi tahap di tengah periode.
- Konfirmasi pola query (batched/N+1) yang dipakai, dibandingkan dengan pola existing.

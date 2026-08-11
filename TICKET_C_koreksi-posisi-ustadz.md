# TICKET C: Koreksi Posisi Hafalan oleh Ustadz

**Project:** TahfidzKu
**Prioritas:** Sedang
**Dependency:** Dikerjakan **setelah Ticket A (Tracking Iqra) tuntas**. Tidak menghalangi Ticket A/B.

---

## 1. Konteks & Latar Belakang

Ditemukan saat investigasi hotfix `batas-hafalan-readonly`: form Admin (`/admin/santri`) tidak punya jalur yang benar-benar berfungsi untuk mengoreksi `posisiTerakhir` santri yang sudah berjalan progressnya — field "Batas Hafalan" di form itu secara diam-diam diabaikan backend begitu `posisiTerakhir` sudah terisi (guard proteksi lama, sudah benar secara niat, tapi UI-nya menyesatkan). Hotfix sementara mengunci field itu jadi read-only di form Admin.

**Keputusan filosofis yang mendasari ticket ini:** kewenangan menentukan/mengoreksi posisi hafalan santri seharusnya ada di tangan **Ustadz** (yang benar-benar memantau perkembangan bacaan), bukan Admin (yang perannya cuma membantu input data awal/administratif). Admin membantu onboarding data awal santri baru, tapi koreksi posisi berjalan adalah domain Ustadz.

## 2. Keputusan Desain (hasil diskusi)

- **Hanya Ustadz** yang punya akses ke fitur koreksi posisi ini (bukan Admin).
- **Auto-fill "Surat Mulai" tetap berjalan seperti biasa** dari `posisiTerakhir` (`prefillZiyadahBerikutnya`) — fitur ini bukan menggantikan alur normal setoran, melainkan jalur **koreksi manual** untuk kasus khusus (misal admin salah input saat onboarding, santri pindahan yang datanya perlu disesuaikan, dsb).
- **Audit trail wajib**, mengikuti pola yang sudah dibangun untuk `tahapSantri` di Ticket A Fase 1.5: kolom `posisiTerakhirUpdatedBy` (nullable, FK `users.id`) dan `posisiTerakhirUpdatedAt` (nullable, timestamp) di tabel `santri`. Pertimbangkan juga kolom `catatan`/alasan koreksi (opsional) untuk konteks tambahan.
- **Dialog konfirmasi eksplisit** sebelum perubahan disimpan — mengingat ini mengubah data inti yang dipakai banyak fitur turunan (pacing, Estimasi Khatam, Peta Kualitas dari Ticket 2).
- **Penempatan UI**: belum final — akan diminta usulan penempatan terbaik dari Antigravity di Fase 0 (opsi awal: tombol "Koreksi Posisi" di dekat indikator posisi santri di `/ustadz/input`, tapi bisa diusulkan alternatif lain kalau ada pertimbangan UX yang lebih baik).

## 3. Aturan Wajib untuk Agen (sama seperti tiket-tiket sebelumnya)

- Dilarang operasi destruktif tanpa konfirmasi eksplisit Abdulloh.
- Satu fase per waktu, tunjukkan diff, tunggu approval sebelum commit dan sebelum lanjut fase berikutnya.
- `npx tsc --noEmit` dijalankan terpisah sebelum melapor siap commit.
- Verifikasi visual browser wajib tiap akhir fase.
- Mulai dari branch baru dari `master` (pastikan Ticket A dan hotfix `batas-hafalan-readonly` sudah merge dulu): `git checkout master && git checkout -b ticket-c-koreksi-posisi-ustadz`.

---

## FASE 0 — Verifikasi Prasyarat & Usulan Penempatan UI

**Tugas:**
1. Konfirmasi Ticket A dan hotfix `batas-hafalan-readonly` sudah di `master`.
2. Tinjau struktur halaman `/ustadz/input` saat ini (pasca Ticket A, yang sudah punya indikator posisi Iqra dan tahfidz) dan ajukan **usulan penempatan UI** untuk fitur koreksi ini — bisa modal terpisah, panel collapsible, atau halaman tersendiri. Pertimbangkan agar tidak membuat halaman Input yang sudah cukup padat (form Ziyadah/Sabqi/Manzil, indikator posisi, dll) menjadi lebih membingungkan.
3. Laporkan usulan sebelum menulis kode apapun.

**Acceptance Criteria Fase 0:**
- [ ] Laporan usulan penempatan UI, dengan alasan singkat.
- [ ] Tunggu approval sebelum lanjut Fase 1.

---

## FASE 1 — Skema & Backend

**Tugas:**
1. Migration: tambah `posisiTerakhirUpdatedBy` (nullable, FK `users.id`), `posisiTerakhirUpdatedAt` (nullable, timestamp) ke `santri`. Pertimbangkan kolom `catatan` opsional untuk alasan koreksi.
2. Server function baru `koreksiPosisiHafalan` — hanya bisa dipanggil role `ustadz` (bukan `admin`, sesuai keputusan). Menerima input posisi baru (Juz/Surah/Ayat, mirip `bangunPosisiDariAdminInput`), menghitung ulang `posisiTerakhir` + `urutanHafalan`, mengisi audit trail.
3. Tenant isolation + ownership check standar (reuse pola existing).

**Acceptance Criteria Fase 1:**
- [ ] Verifikasi manual: koreksi posisi santri dummy, pastikan `posisiTerakhir` berubah sesuai input, audit trail terisi.
- [ ] Verifikasi keamanan: coba panggil endpoint dengan role admin/santri/wali, harus ditolak.
- [ ] `npx tsc --noEmit` bersih.
- [ ] Tunggu approval sebelum lanjut Fase 2.

---

## FASE 2 — UI Koreksi Posisi

**Tugas:**
1. Implementasi sesuai usulan penempatan yang disetujui di Fase 0.
2. Dialog konfirmasi eksplisit sebelum submit (teks jelas soal dampak: mengubah dasar perhitungan pacing, Estimasi Khatam, dll).
3. Tampilkan riwayat koreksi terakhir (siapa, kapan) kalau ada, sebagai transparansi.

**Acceptance Criteria Fase 2:**
- [ ] Verifikasi visual wajib: ustadz melakukan koreksi, cek "Surat Mulai" di form setoran ikut berubah sesuai posisi baru.
- [ ] Verifikasi role: admin tidak melihat/tidak bisa mengakses fitur ini.
- [ ] Tunggu approval sebelum lanjut Fase 3.

---

## FASE 3 — QA Akhir

- [ ] End-to-end: onboarding santri baru (admin) → berjalan progress (ustadz setoran) → koreksi posisi (ustadz) → verifikasi dampaknya konsisten ke seluruh dashboard (Ticket 2: Estimasi Khatam, Peta Kualitas).
- [ ] Dokumentasi ringkas perubahan sebelum merge ke `master`.

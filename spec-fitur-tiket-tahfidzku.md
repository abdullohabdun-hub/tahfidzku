# Spesifikasi Fitur Tiket (Bantuan) — Revisi
> Menggantikan scope plan awal ("tambah icon header" saja). Ini sudah full-feature: skema, otorisasi, dan UI.

## 1. Ringkasan Perubahan dari Plan Awal
Plan awal Antigravity hanya menambahkan icon `LifeBuoy` di header (5 file layout) tanpa backend. Setelah diskusi, scope resmi menjadi sistem tiket penuh dengan routing dinamis dan balasan in-system. Icon header tetap dipakai sebagai entry point (icon + tooltip saja, tidak perlu label teks — konsisten dengan prinsip mobile-first proyek ini), tapi mengarah ke halaman `/tiket`, bukan link eksternal.

## 2. Skema Database

### Tabel `tiket`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid/serial PK | |
| `tenantId` | FK ke tenant | Tenant asal submitter — **selalu diisi**, termasuk saat target-nya Superadmin (untuk konteks & audit) |
| `submitterId` | FK ke user | |
| `submitterRole` | enum (`santri`,`wali`,`ustadz`,`admin`) | |
| `subject` | text, dibatasi panjang (mis. 150 char) | |
| `message` | text, dibatasi panjang (mis. 2000 char) | |
| `status` | enum (`baru`,`diproses`,`selesai`) | Default `baru` |
| `createdAt` / `updatedAt` | timestamp | |

> **Revisi:** Kolom `targetRole` dihapus dari skema — tidak ada lagi pilihan tujuan saat buat tiket. Visibilitas sekarang diturunkan otomatis dari `submitterRole` (lihat matriks di bawah), bukan disimpan sebagai data terpisah. Ini mengurangi satu field yang berpotensi tidak sinkron dan menyederhanakan form (tidak ada dropdown tujuan untuk Santri/Wali/Ustadz).

### Tabel `tiketBalasan`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid/serial PK | |
| `tiketId` | FK ke `tiket` | |
| `authorId` | FK ke user | |
| `authorRole` | enum | Diisi dari session server-side, **bukan** dari payload client — cegah spoofing role |
| `pesan` | text, dibatasi panjang | |
| `createdAt` | timestamp | |

Thread dipakai sebagai tabel relasional terpisah (bukan JSONB seperti pola `responUstadz`), karena percakapan tiket bisa bolak-balik panjang dan butuh query/ordering yang jelas.

## 3. Matriks Visibilitas & Otorisasi (Final)

Tidak ada lagi pilihan tujuan saat buat tiket. Visibilitas diturunkan otomatis dari `submitterRole`:

| Submitter | Otomatis terlihat oleh |
|---|---|
| Santri (reguler & online) / Wali / Ustadz | Admin tenant-nya **dan** Superadmin (dua-duanya, sekaligus) |
| Admin | Superadmin saja |

| Role viewer | List tiket yang terlihat | Bisa ubah status |
|---|---|---|
| Santri / Wali / Ustadz | Hanya tiket miliknya sendiri | Tidak — hanya lihat & balas thread |
| Admin | Tiket dari tenant-nya dengan `submitterRole ∈ {santri, wali, ustadz}` + tiketnya sendiri yang dia kirim ke Superadmin | Ya, untuk tiket dari tenant-nya dengan `submitterRole ∈ {santri, wali, ustadz}` |
| Superadmin | Semua tiket, lintas tenant (oversight penuh) | Ya, untuk semua tiket — termasuk yang juga bisa diubah Admin (lihat catatan di bawah) |

> ⚠️ **Trade-off yang disepakati:** Santri/Wali/Ustadz tidak lagi bisa melapor ke Superadmin secara privat tanpa diketahui Admin tenant mereka — semua tiket dari tiga role ini otomatis terlihat oleh Admin. Ini disengaja demi kesederhanaan UX; kalau nanti ada kebutuhan pelaporan rahasia (mis. keluhan soal Admin itu sendiri), perlu fitur terpisah, bukan bagian dari sistem tiket umum ini.
>
> ⚠️ **Penanganan ganda:** Karena tiket dari Santri/Wali/Ustadz punya 2 pihak yang bisa balas & ubah status (Admin dan Superadmin), thread balasan yang dibagi bareng (`tiketBalasan`) membuat kedua pihak saling lihat aktivitas satu sama lain — jadi kecil kemungkinan dobel-tangani tanpa sadar. Tidak perlu kolom "assigned to" tambahan untuk versi awal ini.

## 4. Alur / Workflow
1. User (santri/wali/ustadz) klik "Buat Tiket" → isi subjek & pesan saja, **tanpa pilihan tujuan**. Otomatis terlihat oleh Admin tenant-nya dan Superadmin.
2. User dengan role Admin klik "Buat Tiket" → otomatis terlihat hanya oleh Superadmin, form juga tanpa pilihan tujuan.
3. Tiket masuk dengan status `baru`.
4. Admin dan/atau Superadmin (sesuai matriks visibilitas) melihat tiket di halaman `/tiket` mereka, bisa balas via thread bersama, dan mengubah status jadi `diproses` lalu `selesai`.
5. Submitter melihat status & balasan di halaman `/tiket` versi mereka (read + reply, tidak bisa ubah status).

## 5. Komponen UI

- **Header (semua layout — admin/superadmin/ustadz/santri/wali):** icon `LifeBuoy` + tooltip, tanpa label teks. **Rekomendasi arsitektur:** sebelum menyalin markup ke 5 file, cek apakah role-role ini sudah berbagi satu komponen Header/AppShell. Kalau ada, buat satu komponen `<HelpTicketButton />` dan pasang sekali di tempat itu — supaya perubahan di masa depan tidak perlu sentuh 5 file.
- **Halaman `/tiket`:** list dengan filter status (pola sama seperti referensi Safinah — "Semua status" dropdown + tombol Filter), tombol "+ Buat Tiket".
- **Form Buat Tiket:** field subjek dan pesan saja — tidak ada dropdown tujuan untuk role manapun (disederhanakan agar tidak membingungkan Santri/Wali/Ustadz).
- **Halaman detail tiket:** menampilkan thread balasan + kontrol ubah status (khusus penerima yang berwenang).
- **wali.tsx:** perubahan `justify-center` → `justify-between` di header tetap perlu screenshot before/after di verification plan, karena mengubah struktur layout yang sudah ada.

## 6. Pertimbangan Keamanan (Wajib Diperhatikan Antigravity)

1. **Filter tenant + role** untuk Admin (lihat poin 3) — query list Admin wajib `tenantId = tenant Admin` **DAN** `submitterRole ∈ {santri, wali, ustadz}` (mengecualikan tiket dari Admin lain kalau ada lebih dari satu Admin per tenant). Enforced di level query, bukan cuma disembunyikan di UI.
2. **IDOR protection:** akses ke `/tiket/:id` harus divalidasi server-side terhadap kepemilikan/target user yang login, bukan hanya mengandalkan ID yang tidak terlihat di UI.
3. **Role di `tiketBalasan.authorRole`** diisi dari session server-side saat insert, tidak boleh dipercaya dari payload client (cegah spoof sebagai admin).
4. **Rate limiting** pembuatan tiket per user (reuse Postgres-backed limiter yang sudah dipakai di fitur change password, bukan in-memory Map — supaya kompatibel Vercel serverless).
5. **Validasi & batas panjang** input subjek/pesan/balasan untuk cegah abuse dan potensi XSS kalau nanti ditampilkan sebagai rich text.
6. **Endpoint ubah status** harus cek kombinasi role user yang login + `submitterRole` + `tenantId` tiket, mengikuti matriks di poin 3 (Admin hanya boleh ubah status tiket dari tenant-nya sendiri dengan `submitterRole ∈ {santri, wali, ustadz}`; Superadmin boleh ubah status tiket apa saja).

## 7. Verification Plan (Manual)

- [ ] Santri/Wali/Ustadz membuat tiket (tanpa pilihan tujuan) → muncul di list Admin tenant terkait **dan** list Superadmin, tapi **tidak** muncul di list Admin tenant lain.
- [ ] Admin membuat tiket → otomatis hanya ke Superadmin, **tidak** muncul di list Admin lain (termasuk Admin di tenant yang sama kalau ada lebih dari satu).
- [ ] Superadmin melihat semua tiket lintas tenant, termasuk yang dari Santri/Wali/Ustadz, dan bisa ubah statusnya.
- [ ] Admin mengubah status tiket dari Santri/Wali/Ustadz di tenant-nya → berhasil.
- [ ] Admin mencoba ubah status tiket yang dibuat Admin lain (target Superadmin) → ditolak.
- [ ] Admin mencoba akses langsung URL detail tiket milik tenant lain → ditolak (test IDOR).
- [ ] Balasan dari Admin dan Superadmin di tiket yang sama muncul dalam satu thread yang sama-sama terlihat oleh keduanya.
- [ ] Uji rate limit — buat tiket berkali-kali secara cepat, pastikan dibatasi.
- [ ] Cek tampilan header (icon + tooltip) di mobile dan desktop, semua role.
- [ ] Screenshot before/after struktur header wali.tsx untuk memastikan tidak ada regresi visual.

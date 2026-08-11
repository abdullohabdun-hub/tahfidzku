# Tiket: Multi-Akun Admin per Lembaga

## Konteks
Saat ini (asumsi) 1 lembaga hanya punya 1 akun admin. Dibutuhkan kemampuan agar 1 lembaga bisa memiliki **beberapa akun admin sekaligus**, dengan:
- Permission **sederajat** (tidak ada hierarki owner vs admin — semua admin punya akses yang sama terhadap data lembaganya).
- Penambahan akun baru dilakukan **manual oleh admin yang sudah ada** (bukan lewat invitation link/email).

> ⚠️ Catatan: saya tidak punya visibilitas ke skema tabel admin/user saat ini. Bagian "Perubahan Skema" di bawah adalah draft berbasis asumsi umum — **wajib dicocokkan ke kode aktual sebelum diteruskan ke Antigravity**. Lihat bagian "Open Questions".

## Tujuan
Admin lembaga dapat menambah, melihat daftar, dan menonaktifkan akun admin lain dalam lembaga yang sama, tanpa membuka celah kebocoran data lintas tenant.

## Requirement Fungsional
1. **Daftar admin** — halaman/menu baru yang menampilkan semua akun admin dalam lembaga (nama, username/email, status aktif/nonaktif, tanggal dibuat, dibuat oleh siapa).
2. **Tambah admin baru** — admin existing mengisi form (nama, username/email, password awal) untuk membuat akun admin baru dalam lembaga yang sama. Tidak ada flow undangan/email verifikasi.
3. **Nonaktifkan admin** — admin bisa menonaktifkan (bukan hard delete) akun admin lain. Akun nonaktif tidak bisa login tapi datanya (histori aksi) tetap tersimpan untuk audit.
4. **Tidak bisa menonaktifkan diri sendiri** dan **tidak bisa menonaktifkan admin terakhir yang aktif** dalam lembaga (mencegah lembaga terkunci tanpa admin).

## Perubahan Skema (draft — konfirmasi dulu ke tabel aktual)
- Pastikan tabel admin (`admins` atau sejenis) memang punya relasi **1 lembaga : banyak admin** (`lembagaId` sebagai foreign key biasa, **bukan** unique constraint 1:1). Jika saat ini ada unique constraint `lembagaId` di tabel admin, itu perlu dihapus/migrasi.
- Tambah kolom:
  - `isActive` (boolean, default `true`) — untuk nonaktifkan tanpa hard delete.
  - `createdByAdminId` (nullable, self-reference ke tabel admin) — audit siapa yang membuat akun ini.
  - `forcePasswordChange` (boolean, default `true` saat dibuat manual) — reuse pattern yang sudah ada dari fitur Forgot Password, supaya password yang diset admin pembuat bukan password permanen; admin baru wajib ganti password saat login pertama.

## Alur
1. Admin login → buka menu "Kelola Admin".
2. Klik "Tambah Admin" → isi nama, username/email, password awal → submit.
3. Sistem membuat akun baru dengan `lembagaId` yang sama, `forcePasswordChange = true`.
4. Admin baru login pakai kredensial tsb → diarahkan wajib ganti password dulu sebelum akses dashboard.
5. Semua akun admin lembaga tsb punya akses identik ke seluruh fitur admin (santri, ustadz, laporan, dsb).

## Pertimbangan Keamanan (wajib dicek sebelum eksekusi)
- **Tenant isolation**: semua query daftar/tambah/nonaktifkan admin harus difilter ketat oleh `lembagaId` dari sesi admin yang login — jangan sampai admin lembaga A bisa melihat/menonaktifkan admin lembaga B (pola IDOR yang sudah pernah jadi temuan di fitur lain).
- **Password hashing**: pakai mekanisme hashing yang sama dengan fitur change password yang sudah ada (bukan implementasi baru).
- **Guard anti-lockout**: cek jumlah admin aktif di lembaga sebelum mengizinkan nonaktifkan diri sendiri/admin terakhir.
- **Rate limiting**: pertimbangkan reuse rate limiter Postgres-backed yang sudah ada (bukan in-memory Map) untuk endpoint tambah-admin, agar tidak disalahgunakan untuk membuat banyak akun sekaligus.
- **Audit trail**: minimal `createdByAdminId` + `createdAt` + histori nonaktifkan (siapa, kapan) — untuk investigasi jika terjadi insiden seperti kasus Hendri sebelumnya.
- **Validasi duplikasi**: cegah username/email duplikat — scope-nya perlu dipastikan dulu (lihat Open Questions).

## Edge Cases
- Admin mencoba menonaktifkan dirinya sendiri → ditolak dengan pesan jelas.
- Admin mencoba menonaktifkan admin aktif terakhir di lembaga → ditolak.
- Username/email yang didaftarkan sudah dipakai admin lain (dalam lembaga sama atau lembaga lain, tergantung scope) → validasi & pesan error.
- Admin nonaktif mencoba login → pesan error yang tidak membocorkan detail (tidak bilang "akun dinonaktifkan", cukup "kredensial tidak valid" atau sejenisnya, sesuai kebiasaan keamanan login yang sudah dipakai).

## Open Questions — konfirmasi sebelum ke Antigravity
1. **Struktur tabel saat ini**: nama tabel admin/user, dan apakah relasi ke lembaga sekarang 1:1 atau sudah 1:banyak?
2. **Scope keunikan email/username**: unique global (lintas semua lembaga) atau unique per-lembaga saja? Ini menentukan desain flow login (apakah login butuh input lembaga/subdomain dulu, atau cukup email saja lalu sistem cari lembaganya).
3. Apakah perlu tabel log terpisah untuk histori tambah/nonaktifkan admin, atau cukup kolom di tabel admin itu sendiri?

## Acceptance Criteria
- [ ] Admin bisa melihat daftar semua admin aktif & nonaktif di lembaganya (tidak bisa lihat lembaga lain).
- [ ] Admin bisa menambah admin baru dengan `forcePasswordChange = true`.
- [ ] Admin baru wajib ganti password di login pertama sebelum akses dashboard.
- [ ] Admin bisa menonaktifkan admin lain, kecuali diri sendiri atau admin aktif terakhir.
- [ ] Semua query terkait admin ter-scope ketat ke `lembagaId` sesi aktif (verifikasi dengan test lintas-tenant).
- [ ] Password baru di-hash dengan mekanisme yang sama seperti fitur existing.

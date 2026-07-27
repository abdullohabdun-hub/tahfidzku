# Project Rules

## Database Migrations
**Wajib disepakati sebelum migrasi APAPUN menyentuh production:**
Untuk SEMUA migrasi skema (Fase 2, Fase 3, dan seterusnya), mekanisme berikut WAJIB dipakai secara konsisten:

1. **`npx drizzle-kit generate`**: Selalu buat file migrasi versioned.
2. **Review Manual**: Selalu review isi file migrasi tersebut secara manual sebelum dieksekusi.
3. **Fail-Fast Script**: Eksekusi SQL harus menggunakan script yang **BERHENTI TOTAL (fail-fast)** pada statement pertama yang gagal (tidak boleh ada `try-catch` yang hanya melakukan *log-and-continue*). Script wajib melaporkan persis statement mana yang berhasil dan mana yang gagal.
4. **Eksekusi Production**: Untuk *PRODUCTION*, eksekusi migrasi HANYA boleh dijalankan secara manual oleh USER (menggunakan kredensial production sementara). Antigravity tidak boleh mengeksekusi migrasi ke production secara mandiri.

## Type Checking Sebelum Commit
**Wajib dijalankan sebelum commit kode apa pun:**
Sebelum melaporkan "siap commit", Anda WAJIB menjalankan `npx tsc --noEmit` untuk mendeteksi *syntax error* atau *TypeScript error*. Jangan biarkan kode yang merusak *build* lolos ke commit.

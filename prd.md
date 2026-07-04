Berikut adalah *Product Requirements Document* (PRD) yang disusun berdasarkan hasil *brainstorming* kita, serta diadaptasi dengan alur kerja terstruktur yang Anda lampirkan pada referensi gambar `Gemini_Generated_Image_c8l0o4c8l0o4c8l0.png`.

Dokumen ini akan menjadi cetak biru teknis dan bisnis untuk memulai pengembangan.

---

# PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Nama Produk:** TahfidzKu SaaS (Sistem Manajemen Tahfidz Multitenan)
**Status Dokumen:** Draf Awal (MVP)
**Fokus Utama:** Simpel, Elegan, Murni Logika Database (Tanpa AI)

## 1. Ringkasan Eksekutif (Phase 1: Planning)

TahfidzKu adalah aplikasi web *Software as a Service* (SaaS) multitenan yang dirancang untuk membantu lembaga tahfidz, pesantren, dan halaqoh di Indonesia dalam mencatat progres hafalan santri. Produk ini terdiri dari *Landing Page* elegan untuk pemasaran dan *Web App* fungsional dengan antarmuka minimalis, berfokus pada kecepatan input oleh Ustadz dan transparansi laporan bagi Wali Santri.

## 2. Target Pengguna & Akses Role

* **Super Admin (Pemilik SaaS):** Memantau pendaftaran lembaga baru, manajemen *billing*, dan status *tenant*.
* **Admin Lembaga (Tenant):** Mengelola master data Ustadz, Santri, dan pembagian kelas/halaqoh di lembaga masing-masing.
* **Ustadz (Muhaffizh):** Pengguna utama aplikasi. Melakukan pencatatan setoran hafalan (Ziyadah/Murojaah) harian melalui perangkat *mobile*.
* **Wali Santri:** Mengakses *dashboard* ringan bergaya grafik (lingkaran 30 Juz) untuk memantau progres hafalan anak secara *real-time*.

## 3. Ruang Lingkup Fitur Minimum Viable Product (MVP)

**Modul Autentikasi & Multitenan**

* Pendaftaran lembaga mandiri via *Landing Page* dengan pembuatan `tenant_id` otomatis.
* Sistem *Login* berbasis *Role-Based Access Control* (RBAC).
* Isolasi data ketat: Data lembaga A dipastikan tidak bocor ke lembaga B pada level *database*.

**Modul Manajemen Data (Admin Lembaga)**

* CRUD (Create, Read, Update, Delete) Data Ustadz.
* CRUD Data Santri beserta alokasi target hafalan.
* Pembuatan Kelas/Halaqoh dan penetapan Ustadz penanggung jawab.

**Modul Input Setoran (Ustadz)**

* Antarmuka *mobile-first* yang dioptimalkan untuk pengoperasian dengan satu tangan.
* Pilihan *dropdown* cepat untuk Jenis Setoran (Ziyadah, Murojaah, Sabqi, Manzil).
* Pemilihan Surah dan rentang Ayat.
* Tombol penilaian kualitas bacaan (Lancar, Mengulang, Terbata-bata).
* Kolom input teks opsional untuk catatan tajwid/makhraj.

**Modul Laporan (Wali Santri & Lembaga)**

* Kalkulasi otomatis persentase hafalan dari total 30 Juz.
* Riwayat setoran harian dalam bentuk tabel atau lini masa (timeline) yang elegan.

---

## 4. Spesifikasi Teknis (Phase 2 & 3: Frontend & Backend)

Sistem dibangun dalam satu ekosistem terpadu (*monorepo*) untuk menjamin *type-safety* dari antarmuka hingga ke *database*.

**Frontend (Tampilan Visual):**

* **Framework:** TanStack Start (React). Dipilih karena performa rute *file-based* dan integrasi API yang mulus.
* **Styling & UI:** Tailwind CSS dan shadcn/ui. Digunakan untuk menciptakan desain yang minimalis, elegan, dan bersih tanpa beban aset visual yang berat.
* **Perangkat Sasaran:** 100% responsif, dengan prioritas antarmuka aplikasi (*dashboard*) dirancang *mobile-first* untuk Ustadz.

**Backend & Database:**

* **Arsitektur Server:** API Routes internal dari TanStack Start (`createServerFn`).
* **ORM (Object-Relational Mapping):** Drizzle ORM. Berfungsi untuk menjaga keamanan struktur tabel dan mempermudah injeksi filter `tenant_id` pada setiap kueri.
* **Database Engine:** PostgreSQL (menggunakan layanan Neon.tech untuk keandalan ekosistem *serverless*).
* **Logika Keamanan:** Penerapan *Row-Level Security* (RLS) pada PostgreSQL untuk memastikan data *multitenant* terkunci sempurna.
* **Autentikasi:** Better Auth (atau Lucia Auth) untuk manajemen sesi login berbasis *cookie* tanpa sistem AI pihak ketiga.

---

## 5. Rencana Pelaksanaan (Berdasarkan Referensi Alur Kerja 5 Fase)

**Fase 1: Perencanaan & Wireframing**

* Pembuatan sketsa kasar (*wireframe*) untuk *form* setoran Ustadz agar interaksinya secepat mungkin.
* Pendefinisian skema *database* relasional di Drizzle (Tabel: `tenants`, `users`, `santri`, `setoran`).

**Fase 2: Pengembangan Frontend (UI/UX)**

* Pembuatan komponen *Landing Page* publik yang elegan.
* Perakitan komponen *form* dan tabel dinamis menggunakan shadcn/ui.
* Implementasi *state management* lokal untuk navigasi *dashboard*.

**Fase 3: Pengembangan Backend & Relasi Data**

* Pengaturan koneksi Drizzle ORM ke PostgreSQL (Neon.tech).
* Penulisan logika bisnis CRUD di TanStack Start API Routes.
* Pengujian isolasi *Tenant ID* pada saat *login* dan penarikan data hafalan.

**Fase 4: Integrasi & Pengujian**

* Menghubungkan *form* Frontend ke API Routes Backend.
* Memastikan tidak ada celah keamanan silang antar lembaga.
* Pengujian kecepatan respons aplikasi pada simulasi koneksi 3G/4G (kondisi di pesantren/masjid).

**Fase 5: Deployment & Peluncuran**

* Mengonfigurasi alur CI/CD (*Continuous Integration / Continuous Deployment*) menggunakan platform Netlify, sehingga pembaruan kode dan optimalisasi *build* aplikasi web dapat tereksekusi secara otomatis setiap kali ada perbaikan fitur.
* Pengaturan domain khusus (`tahfidzku.com`) dan konfigurasi SSL.
* Pemantauan performa awal pasca peluncuran *Live*.
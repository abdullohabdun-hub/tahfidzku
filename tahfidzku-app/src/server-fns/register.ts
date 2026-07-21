import { createServerFn } from '@tanstack/react-start'
import { eq, or } from 'drizzle-orm'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '../db'
import { tenants, users, rubrikPenilaian, rubrikOpsi } from '../db/schema'
import { createSession } from '../lib/session'
import { success, handleError } from '../lib/response'
import { ValidationError } from '../lib/errors'
import { normalisasiEmail, normalisasiNoWa, normalisasiUsername } from '../lib/string-utils'
import { sendEmail } from '../lib/email'

const RESERVED_SLUGS = ['superadmin', 'admin', 'api', 'login', 'register', '_system', 'www', 'app', 'dashboard', 'santri', 'ustadz', 'wali', 'auth']

const registerLembagaSchema = z.object({
  namaLembaga: z.string().min(3, 'Nama lembaga minimal 3 karakter').max(255),
  slug: z.string()
    .min(3, 'Slug minimal 3 karakter')
    .max(100)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug hanya boleh berisi huruf kecil dan angka, dipisahkan dengan strip (-), dan tidak boleh diawali/diakhiri strip')
    .refine((val) => !RESERVED_SLUGS.includes(val), { message: 'Slug ini merupakan kata cadangan sistem, silakan pilih yang lain' }),
  adminNama: z.string().min(3, 'Nama pengurus minimal 3 karakter').max(255),
  adminEmail: z.string().email('Format email tidak valid'),
  adminUsername: z.string().min(3, 'Username minimal 3 karakter').max(255),
  adminNoWa: z.string().min(9, 'Nomor WA minimal 9 digit').max(50),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter'),
  botField: z.string().optional(), // honeypot
})

export const registerLembaga = createServerFn({ method: 'POST' })
  .validator(registerLembagaSchema)
  .handler(async ({ data }) => {
    try {
      const { namaLembaga, slug, adminNama, adminEmail, adminUsername, adminNoWa, password, botField } = data
      
      // Bot protection
      if (botField && botField.length > 0) {
        throw new ValidationError('Aktivitas mencurigakan terdeteksi.')
      }

      const normUsername = normalisasiUsername(adminUsername)
      const normNoWa = normalisasiNoWa(adminNoWa)
      const normEmail = normalisasiEmail(adminEmail)

      // 1. Cek apakah slug sudah terpakai
      const [existingTenant] = await db
        .select({ id: tenants.id })
        .from(tenants)
        .where(eq(tenants.slug, slug))
        .limit(1)

      if (existingTenant) {
        throw new ValidationError('Slug/URL ini sudah digunakan lembaga lain. Silakan ubah slug Anda (misal tambah angka di belakang).')
      }

      // 2. Cek apakah username / no WA sudah terpakai secara GLOBAL
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(
          or(
            eq(users.username, normUsername),
            eq(users.noWa, normNoWa),
            eq(users.email, normEmail)
          )
        )
        .limit(1)

      if (existingUser) {
        throw new ValidationError('Username atau No WA sudah terdaftar di sistem. Silakan gunakan yang lain.')
      }

      // 3. Hash password
      const passwordHash = await bcrypt.hash(password, 10)

      // 4. Insert Tenant & User berurutan dengan manual rollback jika user gagal
      const [newTenant] = await db
        .insert(tenants)
        .values({
          namaLembaga,
          slug,
          status: 'pending',
          email: normEmail,
          noWa: normNoWa,
          // trialEndsAt tidak di-set saat pending, akan di-set oleh admin saat disetujui
        })
        .returning()

      let newUser;
      try {
        const [insertedUser] = await db
          .insert(users)
          .values({
            tenantId: newTenant.id,
            nama: adminNama,
            username: normUsername,
            email: normEmail,
            noWa: normNoWa,
            passwordHash,
            role: 'admin',
          })
          .returning()
        newUser = insertedUser;
      } catch (insertUserErr) {
        // ROLLBACK MANUAL
        await db.delete(tenants).where(eq(tenants.id, newTenant.id))
        throw new Error('Gagal membuat akun admin. Lembaga dibatalkan.')
      }

      // 4.5. Otomatis buat rubrik default (agar tenant baru tidak perlu setup dari nol)
      try {
        const [newRubrik] = await db.insert(rubrikPenilaian).values({
          tenantId: newTenant.id,
          key: 'kualitas',
          label: 'Kualitas Hafalan',
          urutan: 1,
          aktif: true
        }).returning({ id: rubrikPenilaian.id })

        await db.insert(rubrikOpsi).values([
          { rubrikId: newRubrik.id, value: 'lancar', label: 'Lancar', urutan: 1 },
          { rubrikId: newRubrik.id, value: 'mengulang', label: 'Mengulang', urutan: 2 },
          { rubrikId: newRubrik.id, value: 'terbata', label: 'Terbata-bata', urutan: 3 },
        ])
      } catch (rubrikErr) {
        console.error('Gagal membuat rubrik default (non-fatal):', rubrikErr)
        // Lanjut saja, tidak membatalkan registrasi
      }

      // HAPUS otomatis login (sesi tidak dibuat karena masih pending)
      console.log(`✅ Pendaftaran lembaga baru (pending): ${namaLembaga} (Admin: ${adminNama})`)

      // Kirim Email Info bahwa sedang direview
      sendEmail({
        to: normEmail,
        subject: 'Pendaftaran TahfidzKu Sedang Diproses',
        html: `
          <h2>Ahlan wa Sahlan, ${adminNama}!</h2>
          <p>Terima kasih telah mendaftarkan <b>${namaLembaga}</b> di TahfidzKu.</p>
          <p>Saat ini permohonan pendaftaran Anda <b>sedang dalam proses peninjauan</b> oleh tim kami.</p>
          <p>Kami akan mengabari Anda kembali melalui Email ini maksimal dalam waktu 1x24 jam setelah proses review selesai.</p>
          <br/>
          <p>Tim TahfidzKu</p>
        `
      }).catch(err => console.error('Gagal kirim email pending:', err))
      
      return success({ 
        tenantId: newTenant.id, 
        role: newUser.role 
      }, 'Pendaftaran berhasil. Silakan tunggu konfirmasi dari admin.')

    } catch (err) {
      console.error('❌ Register Error:', err)
      return handleError(err)
    }
  })

export const checkSlugAvailability = createServerFn({ method: 'POST' })
  .validator((slug: string) => z.string().parse(slug))
  .handler(async ({ data: slug }) => {
    if (RESERVED_SLUGS.includes(slug)) return false;
    const [existing] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1)
    
    return !existing;
  })

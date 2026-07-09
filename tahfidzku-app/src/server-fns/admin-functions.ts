import { createServerFn } from '@tanstack/react-start'
import { eq, and, desc } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { users, santri, kelas } from '../db/schema'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { success, handleError } from '../lib/response'
import { AuthenticationError, ValidationError } from '../lib/errors'

// ==========================================
// USTADZ CRUD
// ==========================================

export const getUstadzList = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      const ustadzList = await db
        .select({
          id: users.id,
          nama: users.nama,
          email: users.email,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(and(eq(users.tenantId, session.user.tenantId), eq(users.role, 'ustadz')))
        .orderBy(desc(users.createdAt))

      return success(ustadzList, 'Berhasil mengambil daftar ustadz')
    } catch (err) {
      return handleError(err)
    }
  }
)

export const createUstadz = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const schema = z.object({
      nama: z.string().min(1, 'Nama wajib diisi'),
      email: z.string().min(1, 'Username/Email wajib diisi'), // menggunakan email field sbg username/hp
      password: z.string().min(4, 'PIN/Password minimal 4 karakter')
    })
    return schema.parse(data)
  })
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      // Cek duplikasi email/username
      const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, data.email))
      if (existing.length > 0) throw new ValidationError('Username/Email sudah terdaftar')

      // Note: Di aplikasi produksi, gunakan bcrypt/argon2 untuk hash password.
      // Di sini kita langsung simpan untuk MVP agar simpel, atau gunakan implementasi auth yg ada.
      const passwordHash = data.password 

      const newUser = await db.insert(users).values({
        tenantId: session.user.tenantId,
        nama: data.nama,
        email: data.email,
        passwordHash,
        role: 'ustadz'
      }).returning({ id: users.id, nama: users.nama })

      return success(newUser[0], 'Berhasil menambahkan Ustadz')
    } catch (err) {
      return handleError(err)
    }
  })

export const deleteUstadz = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      await db.delete(users).where(and(eq(users.id, data.id), eq(users.tenantId, session.user.tenantId)))
      return success(null, 'Berhasil menghapus Ustadz')
    } catch (err) {
      return handleError(err)
    }
  })

// ==========================================
// SANTRI CRUD
// ==========================================

export const getSantriList = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      const santriList = await db
        .select({
          id: santri.id,
          nama: santri.nama,
          targetJuz: santri.targetJuz,
          kelasId: santri.kelasId,
          kelasNama: kelas.nama,
          juzProgress: santri.juzProgress,
          batasHafalanJuz: santri.batasHafalanJuz,
          batasHafalanSurah: santri.batasHafalanSurah,
          batasHafalanAyat: santri.batasHafalanAyat,
          tipe: santri.tipe,
          createdAt: santri.createdAt,
        })
        .from(santri)
        .leftJoin(kelas, eq(santri.kelasId, kelas.id))
        .where(eq(santri.tenantId, session.user.tenantId))
        .orderBy(desc(santri.createdAt))

      return success(santriList, 'Berhasil mengambil daftar santri')
    } catch (err) {
      return handleError(err)
    }
  }
)

export const createSantri = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const schema = z.object({
      nama: z.string().min(1, 'Nama santri wajib diisi'),
      targetJuz: z.number().min(1).max(30),
      juzProgress: z.array(z.number()).default([]),
      batasHafalanJuz: z.number().optional().nullable(),
      batasHafalanSurah: z.string().optional().nullable(),
      batasHafalanAyat: z.number().optional().nullable(),
      kelasId: z.string().optional(),
      tipe: z.enum(['reguler', 'dewasa']).default('dewasa')
    })
    return schema.parse(data)
  })
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      const newSantri = await db.insert(santri).values({
        tenantId: session.user.tenantId,
        nama: data.nama,
        targetJuz: data.targetJuz,
        juzProgress: data.juzProgress,
        batasHafalanJuz: data.batasHafalanJuz,
        batasHafalanSurah: data.batasHafalanSurah,
        batasHafalanAyat: data.batasHafalanAyat,
        kelasId: data.kelasId || null,
        tipe: data.tipe,
      }).returning({ id: santri.id, nama: santri.nama, tipe: santri.tipe })

      // Jika Santri Dewasa, otomatis buatkan akun login mandiri
      if (data.tipe === 'dewasa') {
        const username = `santri_${newSantri[0].id.substring(0,6)}`
        
        await db.insert(users).values({
          tenantId: session.user.tenantId,
          nama: data.nama,
          email: username,
          passwordHash: '123456', // Default PIN
          role: 'santri',
          santriId: newSantri[0].id
        })
        return success(newSantri[0], 'Berhasil menambahkan Santri Dewasa dan Akun Login Default')
      }

      return success(newSantri[0], 'Berhasil menambahkan Santri Reguler')
    } catch (err) {
      return handleError(err)
    }
  })

export const deleteSantri = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      await db.delete(santri).where(and(eq(santri.id, data.id), eq(santri.tenantId, session.user.tenantId)))
      return success(null, 'Berhasil menghapus Santri')
    } catch (err) {
      return handleError(err)
    }
  })

// ==========================================
// KELAS CRUD
// ==========================================

export const getKelasList = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      const kelasList = await db
        .select({
          id: kelas.id,
          nama: kelas.nama,
          ustadzId: kelas.ustadzId,
          ustadzNama: users.nama,
        })
        .from(kelas)
        .leftJoin(users, eq(kelas.ustadzId, users.id))
        .where(eq(kelas.tenantId, session.user.tenantId))
        .orderBy(desc(kelas.createdAt))

      return success(kelasList, 'Berhasil mengambil daftar kelas')
    } catch (err) {
      return handleError(err)
    }
  }
)

export const createKelas = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({ 
    nama: z.string().min(1, 'Nama kelas wajib diisi'),
    ustadzId: z.string().optional()
  }).parse(data))
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      const newKelas = await db.insert(kelas).values({
        tenantId: session.user.tenantId,
        nama: data.nama,
        ustadzId: data.ustadzId || null
      }).returning({ id: kelas.id, nama: kelas.nama })

      return success(newKelas[0], 'Berhasil membuat Kelas/Halaqoh')
    } catch (err) {
      return handleError(err)
    }
  })

export const deleteKelas = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      await db.delete(kelas).where(and(eq(kelas.id, data.id), eq(kelas.tenantId, session.user.tenantId)))
      return success(null, 'Berhasil menghapus Kelas/Halaqoh')
    } catch (err) {
      return handleError(err)
    }
  })

import { createServerFn } from '@tanstack/react-start'
import { eq, and, desc, or } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { santri, users } from '../db/schema'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { success, handleError } from '../lib/response'
import { AuthenticationError, ValidationError } from '../lib/errors'
import { bangunUrutanHafalan, bangunPosisiDariAdminInput, kalkulasiJuzProgress } from '../lib/quranMapper'
import { inArray } from 'drizzle-orm'
import { kelas } from '../db/schema'

// ==========================================
// 1. GET SANTRI LIST (ADMIN & USTADZ)
// ==========================================
export const getSantriList = createServerFn({ method: 'POST' }).handler(
  async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      // Bisa diakses admin atau ustadz
      if (session.user.role !== 'admin' && session.user.role !== 'ustadz') {
        throw new AuthenticationError('Akses ditolak')
      }

      const tenantId = session.user.tenantId

      let whereCondition: any = eq(santri.tenantId, tenantId)

      if (session.user.role === 'ustadz') {
        const ustadzKelas = await db.select({ id: kelas.id }).from(kelas).where(eq(kelas.ustadzId, session.user.id))
        const kelasIds = ustadzKelas.map(k => k.id)
        
        if (kelasIds.length === 0) {
          return success([], 'Berhasil mengambil daftar santri')
        }
        
        whereCondition = and(eq(santri.tenantId, tenantId), inArray(santri.kelasId, kelasIds))
      }

      // Menggunakan Relational Query Drizzle
      const results = await db.query.santri.findMany({
        where: whereCondition,
        orderBy: [desc(santri.createdAt)],
        with: {
          kelas: { columns: { nama: true } },
          akun: { columns: { email: true, noWa: true } }
        }
      })

      const mapped = results.map(s => ({
        id: s.id,
        nama: s.nama,
        targetJuz: s.targetJuz,
        kelasId: s.kelasId,
        kelasNama: s.kelas?.nama || null,
        juzProgress: kalkulasiJuzProgress(s.urutanHafalan || [], s.posisiTerakhir),
        batasHafalanJuz: s.batasHafalanJuz,
        batasHafalanSurah: s.batasHafalanSurah,
        batasHafalanAyat: s.batasHafalanAyat,
        tipe: s.tipe,
        email: s.akun && s.akun.length > 0 ? s.akun[0].email : null,
        noWa: s.akun && s.akun.length > 0 ? s.akun[0].noWa : null,
        createdAt: s.createdAt,
        posisiTerakhir: s.posisiTerakhir,
        urutanHafalan: s.urutanHafalan,
      }))

      return success(mapped, 'Berhasil mengambil daftar santri')
    } catch (err) {
      return handleError(err)
    }
  }
)

import { normalisasiEmail, normalisasiNoWa } from '../lib/string-utils'

// ==========================================
// 2. CREATE SANTRI (ADMIN)
// ==========================================
export const createSantri = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const schema = z.object({
      nama: z.string().min(1, 'Nama santri wajib diisi'),
      targetJuz: z.number().min(1).max(30),
      juzProgress: z.array(z.number().int().min(1).max(30)).transform(val => Array.from(new Set(val))).default([]),
      batasHafalanJuz: z.number().optional().nullable(),
      batasHafalanSurah: z.string().optional().nullable(),
      batasHafalanAyat: z.number().optional().nullable(),
      kelasId: z.string().optional(),
      tipe: z.enum(['reguler', 'dewasa']).default('dewasa'),
      email: z.string().optional().nullable(),
      noWa: z.string().optional().nullable(),
      password: z.string().optional()
    })
    return schema.parse(data)
  })
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      const tenantId = session.user.tenantId
      
      const { urutanHafalan: defaultUrutan, posisiTerakhir: defaultPosisi } = bangunPosisiDariAdminInput(
          data.juzProgress, 
          data.batasHafalanJuz,
          data.batasHafalanSurah,
          data.batasHafalanAyat
      )

      const email = data.email ? normalisasiEmail(data.email) : null;
      const noWa = data.noWa ? normalisasiNoWa(data.noWa) : null;

      const [newSantri] = await db.insert(santri).values({
        tenantId,
        nama: data.nama,
        targetJuz: data.targetJuz,
        juzProgress: data.juzProgress,
        batasHafalanJuz: data.batasHafalanJuz,
        batasHafalanSurah: data.batasHafalanSurah,
        batasHafalanAyat: data.batasHafalanAyat,
        kelasId: data.kelasId || null,
        tipe: data.tipe,
        posisiTerakhir: defaultPosisi,
        urutanHafalan: defaultUrutan,
      }).returning({ id: santri.id, nama: santri.nama, tipe: santri.tipe })

      if (data.tipe === 'dewasa') {
        if (!email && !noWa) {
          throw new ValidationError('Santri wajib mengisi Email atau No WA')
        }
        if (!data.password) {
          throw new ValidationError('Password wajib diisi untuk Santri Dewasa')
        }

        const existing = await db.select({ id: users.id }).from(users).where(
          or(
            email ? eq(users.email, email) : undefined,
            noWa ? eq(users.noWa, noWa) : undefined
          )
        )
        if (existing.length > 0) throw new ValidationError('Email / No WA sudah terdaftar oleh pengguna lain.')
        
        await db.insert(users).values({
          tenantId,
          nama: data.nama,
          email,
          noWa,
          passwordHash: data.password,
          role: 'santri',
          santriId: newSantri.id
        })
      }
      const result = newSantri;

      return success(result, 'Berhasil menambahkan Santri')
    } catch (err) {
      return handleError(err)
    }
  })

// ==========================================
// 3. UPDATE SANTRI (ADMIN)
// ==========================================
export const updateSantri = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({
    id: z.string(),
    nama: z.string().min(1, 'Nama santri wajib diisi'),
    targetJuz: z.number().min(1).max(30),
    juzProgress: z.array(z.number().int().min(1).max(30)).transform(val => Array.from(new Set(val))).default([]),
    batasHafalanJuz: z.number().optional().nullable(),
    batasHafalanSurah: z.string().optional().nullable(),
    batasHafalanAyat: z.number().optional().nullable(),
    kelasId: z.string().optional().nullable(),
    tipe: z.enum(['reguler', 'dewasa']).default('dewasa'),
    email: z.string().optional().nullable(),
    noWa: z.string().optional().nullable(),
    password: z.string().optional()
  }).parse(data))
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      const tenantId = session.user.tenantId

      const email = data.email ? normalisasiEmail(data.email) : null;
      const noWa = data.noWa ? normalisasiNoWa(data.noWa) : null;

      // Ambil data santri saat ini untuk memeriksa apakah perlu update posisiTerakhir
      const [currentSantri] = await db.select().from(santri).where(eq(santri.id, data.id)).limit(1)
      
      let newPosisiTerakhir = currentSantri?.posisiTerakhir
      let newUrutanHafalan = currentSantri?.urutanHafalan || bangunUrutanHafalan(data.juzProgress)
      
      // Guard: Jangan pernah menimpa urutanHafalan & posisiTerakhir jika santri sudah punya progres
      // (yaitu posisiTerakhir !== null). Update juzProgress via form ini hanya diizinkan
      // saat onboarding / posisiTerakhir masih kosong.
      if (currentSantri?.posisiTerakhir !== null && currentSantri?.posisiTerakhir !== undefined) {
        // Abaikan perubahan juzProgress dari input admin, gunakan yang lama
        data.juzProgress = currentSantri.juzProgress || []
      } else {
        const buildPosisi = bangunPosisiDariAdminInput(
           data.juzProgress,
           data.batasHafalanJuz,
           data.batasHafalanSurah,
           data.batasHafalanAyat
        );
        newPosisiTerakhir = buildPosisi.posisiTerakhir;
        newUrutanHafalan = buildPosisi.urutanHafalan;
      }

      await db.update(santri).set({
        nama: data.nama,
        targetJuz: data.targetJuz,
        juzProgress: data.juzProgress,
        batasHafalanJuz: data.batasHafalanJuz,
        batasHafalanSurah: data.batasHafalanSurah,
        batasHafalanAyat: data.batasHafalanAyat,
        kelasId: data.kelasId || null,
        tipe: data.tipe,
        posisiTerakhir: newPosisiTerakhir,
        urutanHafalan: newUrutanHafalan,
      }).where(and(eq(santri.id, data.id), eq(santri.tenantId, tenantId)))

      if (data.tipe === 'dewasa') {
        if (!email && !noWa) throw new ValidationError('Santri wajib mengisi Email atau No WA')
        
        const existing = await db.select({ id: users.id }).from(users).where(
          or(
            email ? eq(users.email, email) : undefined,
            noWa ? eq(users.noWa, noWa) : undefined
          )
        )
        const existingUser = existing.find(u => u.id)
        
        const userForSantri = await db.select({ id: users.id }).from(users).where(eq(users.santriId, data.id))

        if (userForSantri.length > 0) {
          if (existingUser && existingUser.id !== userForSantri[0].id) {
            throw new ValidationError('Email / No WA sudah terdaftar oleh pengguna lain.')
          }
          const updateData: any = { nama: data.nama, email, noWa }
          if (data.password) updateData.passwordHash = data.password
          await db.update(users).set(updateData).where(eq(users.id, userForSantri[0].id))
        } else {
          if (!data.password) throw new ValidationError('Password wajib diisi untuk akun baru')
          if (existingUser) throw new ValidationError('Email / No WA sudah terdaftar oleh pengguna lain.')
          await db.insert(users).values({
            tenantId,
            nama: data.nama,
            email,
            noWa,
            passwordHash: data.password,
            role: 'santri',
            santriId: data.id
          })
        }
      }

      return success(null, 'Berhasil memperbarui Santri')
    } catch (err) {
      return handleError(err)
    }
  })

// ==========================================
// 4. DELETE SANTRI (ADMIN)
// ==========================================
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
// 5. UPDATE PROFIL (OLEH SANTRI SENDIRI)
// ==========================================
export const updateSantriProfile = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({
    nama: z.string().min(1, 'Nama tidak boleh kosong'),
  }).parse(data))
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'santri')

      if (!session.user.santriId) throw new Error('Profil santri tidak ditemukan')

      await db.update(santri).set({
        nama: data.nama
      }).where(and(eq(santri.id, session.user.santriId!), eq(santri.tenantId, session.user.tenantId)))

      await db.update(users).set({
        nama: data.nama
      }).where(and(eq(users.santriId, session.user.santriId!), eq(users.tenantId, session.user.tenantId)))

      return success(null, 'Profil berhasil diperbarui')
    } catch (err) {
      return handleError(err)
    }
  })

export const updateSantriPassword = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({
    passwordLama: z.string().min(1, 'Password lama harus diisi'),
    passwordBaru: z.string().min(4, 'Password baru minimal 4 karakter')
  }).parse(data))
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'santri')

      const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1)
      if (!user || user.passwordHash !== data.passwordLama) {
        throw new ValidationError('Password lama salah')
      }

      await db.update(users).set({ passwordHash: data.passwordBaru }).where(eq(users.id, session.user.id))
      return success(null, 'Password berhasil diubah')
    } catch (err) {
      return handleError(err)
    }
  })

// ==========================================
// 6. GET CURRENT SANTRI PROFILE
// ==========================================
export const getSantriProfile = createServerFn({ method: 'POST' }).handler(async () => {
  try {
    const session = await getAuthSession()
    if (!session) throw new AuthenticationError()
    requireRole(session, 'santri')

    if (!session.user.santriId) throw new Error('Profil santri tidak ditemukan')

    const [profile] = await db.select().from(santri).where(
      and(eq(santri.id, session.user.santriId), eq(santri.tenantId, session.user.tenantId))
    ).limit(1)

    if (!profile) throw new Error('Profil santri tidak ditemukan')

    profile.juzProgress = kalkulasiJuzProgress(profile.urutanHafalan || [], profile.posisiTerakhir);

    return success(profile, 'Berhasil memuat profil santri')
  } catch (err) {
    return handleError(err)
  }
})

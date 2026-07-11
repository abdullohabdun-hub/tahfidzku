import { createServerFn } from '@tanstack/react-start'
import { eq, and, desc } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { santri, users } from '../db/schema'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { success, handleError } from '../lib/response'
import { AuthenticationError, ValidationError } from '../lib/errors'
import { bangunUrutanHafalan, getAyatTerakhirJuz, bangunPosisiDariAdminInput } from '../lib/quranMapper'

// ==========================================
// 1. GET SANTRI LIST (ADMIN & USTADZ)
// ==========================================
export const getSantriList = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      // Bisa diakses admin atau ustadz
      if (session.user.role !== 'admin' && session.user.role !== 'ustadz') {
        throw new AuthenticationError('Akses ditolak')
      }

      const tenantId = session.user.tenantId

      // Menggunakan Relational Query Drizzle
      const results = await db.query.santri.findMany({
        where: eq(santri.tenantId, tenantId),
        orderBy: [desc(santri.createdAt)],
        with: {
          kelas: { columns: { nama: true } },
          akun: { columns: { email: true } }
        }
      })

      // Jika role = ustadz, kita mungkin mau filter by ustadzId, tapi untuk sekarang samakan dgn logika sebelumnya yg mengambil semua se-tenant
      // Tapi kita biarkan saja sesuai awal: mengambil semua santri dari tenant.
      
      const mapped = results.map(s => ({
        id: s.id,
        nama: s.nama,
        targetJuz: s.targetJuz,
        kelasId: s.kelasId,
        kelasNama: s.kelas?.nama || null,
        juzProgress: s.juzProgress,
        batasHafalanJuz: s.batasHafalanJuz,
        batasHafalanSurah: s.batasHafalanSurah,
        batasHafalanAyat: s.batasHafalanAyat,
        tipe: s.tipe,
        username: s.akun && s.akun.length > 0 ? s.akun[0].email : null,
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
      username: z.string().optional(),
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
      
      let batasHafalanSaatIni = null;
      if (data.batasHafalanJuz !== null && data.batasHafalanJuz !== undefined && 
          data.batasHafalanSurah !== null && data.batasHafalanSurah !== undefined && 
          data.batasHafalanAyat !== null && data.batasHafalanAyat !== undefined) {
        
        let surahNomor = 1;
        if (typeof data.batasHafalanSurah === 'string') {
          const found = SURAH_LIST.find((s: any) => s.nama.toLowerCase() === (data.batasHafalanSurah as string).toLowerCase());
          surahNomor = found ? found.nomor : parseInt(data.batasHafalanSurah, 10);
        } else {
          surahNomor = data.batasHafalanSurah;
        }
        
        if (!isNaN(surahNomor)) {
          batasHafalanSaatIni = { juz: data.batasHafalanJuz, surahNomor, ayat: data.batasHafalanAyat };
        }
      }

      const { urutanHafalan: defaultUrutan, posisiTerakhir: defaultPosisi } = bangunPosisiDariAdminInput(
          data.juzProgress, 
          batasHafalanSaatIni
      )

      const result = await (async () => {
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
          if (!data.username || !data.password) {
            throw new ValidationError('Username dan Password wajib diisi untuk Santri Dewasa')
          }
          const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, data.username))
          if (existing.length > 0) throw new ValidationError('Username/Email/No WA sudah terdaftar')
          
          await db.insert(users).values({
            tenantId,
            nama: data.nama,
            email: data.username,
            passwordHash: data.password,
            role: 'santri',
            santriId: newSantri.id
          })
        }
        return newSantri
      })();

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
    username: z.string().optional(),
    password: z.string().optional()
  }).parse(data))
  .handler(async ({ data }) => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      const tenantId = session.user.tenantId

      await (async () => {
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
          let batasHafalanSaatIni = null;
          if (data.batasHafalanJuz !== null && data.batasHafalanJuz !== undefined && 
              data.batasHafalanSurah !== null && data.batasHafalanSurah !== undefined && 
              data.batasHafalanAyat !== null && data.batasHafalanAyat !== undefined) {
            
            let surahNomor = 1;
            if (typeof data.batasHafalanSurah === 'string') {
              const found = SURAH_LIST.find((s: any) => s.nama.toLowerCase() === (data.batasHafalanSurah as string).toLowerCase());
              surahNomor = found ? found.nomor : parseInt(data.batasHafalanSurah, 10);
            } else {
              surahNomor = data.batasHafalanSurah;
            }
            
            if (!isNaN(surahNomor)) {
              batasHafalanSaatIni = { juz: data.batasHafalanJuz, surahNomor, ayat: data.batasHafalanAyat };
            }
          }

          const buildPosisi = bangunPosisiDariAdminInput(
             data.juzProgress,
             batasHafalanSaatIni
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
          if (!data.username) throw new ValidationError('Username wajib diisi untuk Santri Dewasa')
          
          const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, data.username))
          const existingUser = existing.find(u => u.id)
          
          const userForSantri = await db.select({ id: users.id }).from(users).where(eq(users.santriId, data.id))

          if (userForSantri.length > 0) {
            if (existingUser && existingUser.id !== userForSantri[0].id) {
              throw new ValidationError('Username sudah terdaftar')
            }
            const updateData: any = { nama: data.nama, email: data.username }
            if (data.password) updateData.passwordHash = data.password
            await db.update(users).set(updateData).where(eq(users.id, userForSantri[0].id))
          } else {
            if (!data.password) throw new ValidationError('Password wajib diisi untuk akun baru')
            if (existingUser) throw new ValidationError('Username sudah terdaftar')
            await db.insert(users).values({
              tenantId,
              nama: data.nama,
              email: data.username,
              passwordHash: data.password,
              role: 'santri',
              santriId: data.id
            })
          }
        }
      })();

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

      await (async () => {
        await db.update(santri).set({ nama: data.nama }).where(eq(santri.id, session.user.santriId!))
        await db.update(users).set({ nama: data.nama }).where(eq(users.id, session.user.id))
      })();

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

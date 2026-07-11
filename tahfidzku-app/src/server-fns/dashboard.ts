import { createServerFn } from '@tanstack/react-start'
import { eq, and, desc, gte } from 'drizzle-orm'
import { db } from '../db'
import { santri, setoran, users, kelas } from '../db/schema'
import { getAuthSession, requireRole } from '../middleware/auth.middleware'
import { success, handleError } from '../lib/response'
import { AuthenticationError } from '../lib/errors'
import { hitungProgresHalaman } from '../lib/quranMapper'

// ==========================================
// 1. ADMIN DASHBOARD
// ==========================================
export const getAdminDashboardStats = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'admin')

      const tenantId = session.user.tenantId

      const santriList = await db.select({ id: santri.id }).from(santri).where(eq(santri.tenantId, tenantId))
      const ustadzList = await db.select({ id: users.id }).from(users).where(and(eq(users.tenantId, tenantId), eq(users.role, 'ustadz')))
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const setoranHariIniList = await db
        .select({ id: setoran.id })
        .from(setoran)
        .where(and(eq(setoran.tenantId, tenantId), gte(setoran.createdAt, today)))

      // Menggunakan Relational Query Drizzle
      const recentSetoran = await db.query.setoran.findMany({
        where: eq(setoran.tenantId, tenantId),
        orderBy: [desc(setoran.createdAt)],
        limit: 5,
        with: {
          santri: {
            columns: { nama: true }
          }
        }
      })

      // Map format agar sesuai dengan frontend (flatten santriNama)
      const formattedRecent = recentSetoran.map(s => ({
        ...s,
        santriNama: s.santri.nama
      }))

      return success({
        totalSantri: santriList.length,
        totalUstadz: ustadzList.length,
        totalSetoranHariIni: setoranHariIniList.length,
        recentSetoran: formattedRecent,
      }, 'Berhasil mengambil statistik dashboard')
    } catch (err) {
      return handleError(err)
    }
  }
)

// ==========================================
// 2. USTADZ DASHBOARD
// ==========================================
export const getUstadzDashboard = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'ustadz')

      const tenantId = session.user.tenantId
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Ambil santri binaan
      const santriBinaan = await db
        .select({
          id: santri.id,
          nama: santri.nama,
          targetJuz: santri.targetJuz,
        })
        .from(santri)
        .innerJoin(kelas, eq(santri.kelasId, kelas.id))
        .where(
          and(
            eq(santri.tenantId, tenantId),
            eq(kelas.ustadzId, session.user.id)
          )
        )

      // Ambil setoran hari ini (Relational Query)
      const setoranHariIniData = await db.query.setoran.findMany({
        where: and(
          eq(setoran.tenantId, tenantId),
          eq(setoran.ustadzId, session.user.id),
          gte(setoran.createdAt, today)
        ),
        orderBy: [desc(setoran.createdAt)],
        with: {
          santri: { columns: { nama: true } }
        }
      })

      const setoranHariIni = setoranHariIniData.map(s => ({
        ...s,
        santriNama: s.santri.nama
      }))

      const sudahSetorIds = setoranHariIni.map((s) => s.santriId)
      const belumSetor = santriBinaan.filter((s) => !sudahSetorIds.includes(s.id))

      return success(
        {
          namaUstadz: session.user.nama,
          totalSantri: santriBinaan.length,
          totalSetoran: setoranHariIni.length,
          setoranTerbaru: setoranHariIni.slice(0, 5),
          belumSetor: belumSetor.slice(0, 5),
        },
        'Dashboard berhasil dimuat',
      )
    } catch (err) {
      return handleError(err)
    }
  }
)

// ==========================================
// 3. SANTRI DASHBOARD
// ==========================================
export const getSantriDashboardData = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new AuthenticationError()
      requireRole(session, 'santri')

      const santriId = session.user.santriId
      if (!santriId) throw new Error('Anda tidak memiliki profil santri.')

      const [profil] = await db.select().from(santri).where(eq(santri.id, santriId)).limit(1)

      const riwayat = await db.query.setoran.findMany({
        where: eq(setoran.santriId, santriId),
        orderBy: [desc(setoran.createdAt)],
        limit: 5
      })

      const targetJuz = profil?.targetJuz || 30
      const juzSelesai = profil?.juzProgress?.length || 0
      
      let progressPercentage = Math.round((juzSelesai / targetJuz) * 100)
      try {
        if (profil?.urutanHafalan && profil?.posisiTerakhir) {
          const progresHal = hitungProgresHalaman(profil.urutanHafalan, profil.posisiTerakhir)
          progressPercentage = progresHal.persen
        }
      } catch (err) {
        // Fallback jika array urutanHafalan / posisiTerakhir tidak konsisten
        progressPercentage = Math.round((juzSelesai / targetJuz) * 100)
      }

      return success({
        profil,
        riwayat,
        progress: {
          targetJuz,
          juzSelesai,
          percentage: progressPercentage,
        },
        streak: 5,
      }, "Data dashboard berhasil diambil")
    } catch (err) {
      return handleError(err)
    }
  }
)

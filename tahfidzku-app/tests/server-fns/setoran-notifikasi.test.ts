import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import { createSetoran, submitFeedbackSetoran } from '../../src/server-fns/setoran'
import { db } from '../../src/db'
import { santri, kelas, users, setoran, notifikasiUstadz, tenants } from '../../src/db/schema'
import { getAuthSession } from '../../src/middleware/auth.middleware'
import { eq, inArray } from 'drizzle-orm'
import { randomUUID } from 'crypto'

vi.mock('../../src/middleware/auth.middleware', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/middleware/auth.middleware')>()
  return {
    ...actual,
    getAuthSession: vi.fn(),
  }
})

// Mock createServerFn from TanStack Start
vi.mock('@tanstack/react-start', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    createServerFn: ({ method }: any) => {
      let validatorFn: any
      const builder = {
        validator: (v: any) => {
          validatorFn = v
          return builder
        },
        handler: (h: any) => {
          return async (args: any) => {
            if (validatorFn) args.data = validatorFn(args.data)
            return h(args)
          }
        }
      }
      return builder
    }
  }
})

describe('Ticket 3: Notifikasi & Feedback Ustadz', () => {
  const tenantId1 = randomUUID()
  const tenantId2 = randomUUID()
  
  let ustadzA_Id: string
  let ustadzB_Id: string
  let ustadzTenant2_Id: string
  
  let santriA_Id: string // Murid Ustadz A
  let santriB_Id: string // Murid Ustadz B (satu tenant)
  let santriNoUstadz_Id: string // Murid tanpa Ustadz
  
  let setoranA_Id: string

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Cleanup first
    await db.delete(santri).where(inArray(santri.tenantId, [tenantId1, tenantId2]))
    await db.delete(kelas).where(inArray(kelas.tenantId, [tenantId1, tenantId2]))
    await db.delete(users).where(inArray(users.tenantId, [tenantId1, tenantId2]))
    await db.delete(tenants).where(inArray(tenants.id, [tenantId1, tenantId2]))
    
    // Setup Tenants
    await db.insert(tenants).values([
      { id: tenantId1, namaLembaga: 'Tenant 1', slug: randomUUID() },
      { id: tenantId2, namaLembaga: 'Tenant 2', slug: randomUUID() }
    ])
    
    // Setup Ustadz
    const uA = await db.insert(users).values({ id: randomUUID(), tenantId: tenantId1, role: 'ustadz', nama: 'Ustadz A', email: 'ua@test.com', username: 'ua', passwordHash: 'test' }).returning()
    ustadzA_Id = uA[0].id
    
    const uB = await db.insert(users).values({ id: randomUUID(), tenantId: tenantId1, role: 'ustadz', nama: 'Ustadz B', email: 'ub@test.com', username: 'ub', passwordHash: 'test' }).returning()
    ustadzB_Id = uB[0].id
    
    const uT2 = await db.insert(users).values({ id: randomUUID(), tenantId: tenantId2, role: 'ustadz', nama: 'Ustadz T2', email: 'ut2@test.com', username: 'ut2', passwordHash: 'test' }).returning()
    ustadzTenant2_Id = uT2[0].id

    // Setup Kelas
    const kA = await db.insert(kelas).values({ id: randomUUID(), tenantId: tenantId1, nama: 'Kelas A', ustadzId: ustadzA_Id, tipeKelas: 'reguler' }).returning()
    const kB = await db.insert(kelas).values({ id: randomUUID(), tenantId: tenantId1, nama: 'Kelas B', ustadzId: ustadzB_Id, tipeKelas: 'reguler' }).returning()
    const kNoUstadz = await db.insert(kelas).values({ id: randomUUID(), tenantId: tenantId1, nama: 'Kelas Kosong', ustadzId: null, tipeKelas: 'reguler' }).returning()
    
    // Setup Santri
    const sA = await db.insert(santri).values({ id: randomUUID(), tenantId: tenantId1, kelasId: kA[0].id, nama: 'Santri A', nis: '111', pinCode: '111111' }).returning()
    santriA_Id = sA[0].id
    
    const sB = await db.insert(santri).values({ id: randomUUID(), tenantId: tenantId1, kelasId: kB[0].id, nama: 'Santri B', nis: '222', pinCode: '222222' }).returning()
    santriB_Id = sB[0].id
    
    const sNo = await db.insert(santri).values({ id: randomUUID(), tenantId: tenantId1, kelasId: kNoUstadz[0].id, nama: 'Santri Kosong', nis: '333', pinCode: '333333' }).returning()
    santriNoUstadz_Id = sNo[0].id
  })

  afterAll(async () => {
    // Teardown
    await db.delete(santri).where(inArray(santri.tenantId, [tenantId1, tenantId2]))
    await db.delete(kelas).where(inArray(kelas.tenantId, [tenantId1, tenantId2]))
    await db.delete(users).where(inArray(users.tenantId, [tenantId1, tenantId2]))
  })

  const mockSession = (userId: string, role: string, tenantId: string, santriId?: string) => {
    vi.mocked(getAuthSession).mockResolvedValue({
      user: { id: userId, role, tenantId, nama: 'Test', email: null, username: null, noWa: null, santriId } as any
    })
  }

  it('1. IDOR Cross-Tenant: Ustadz Tenant 2 menolak setoran Santri Tenant 1', async () => {
    // Buat setoran santri A
    mockSession(santriA_Id, 'santri', tenantId1, santriA_Id)
    const createRes = await createSetoran({ data: { jenis: 'murojaah', lintasJuz: false, juzMulai: 1, halamanAwal: 1, halamanAkhir: 2, kualitas: 'lancar', sumber: 'santri_self_report' } })
    expect(createRes.success).toBe(true)
    const setId = createRes.data?.id!
    
    // Ustadz Tenant 2 mencoba review
    mockSession(ustadzTenant2_Id, 'ustadz', tenantId2)
    const res = await submitFeedbackSetoran({ data: { setoranId: setId, tipe: 'disetujui' } })
    
    // Harus gagal Forbidden
    expect(res.success).toBe(false)
    expect((res as any).error.name).toBe('ForbiddenError')
    expect((res as any).error.statusCode).toBe(403)
  })

  it('2. IDOR Lintas Halaqoh (Satu Tenant): Ustadz B mencoba review setoran Santri A (murid Ustadz A)', async () => {
    // Buat setoran santri A
    mockSession(santriA_Id, 'santri', tenantId1, santriA_Id)
    const createRes = await createSetoran({ data: { jenis: 'murojaah', lintasJuz: false, juzMulai: 1, halamanAwal: 1, halamanAkhir: 2, kualitas: 'lancar', sumber: 'santri_self_report' } })
    const setId = createRes.data?.id!
    
    // Ustadz B mencoba review
    mockSession(ustadzB_Id, 'ustadz', tenantId1)
    const res = await submitFeedbackSetoran({ data: { setoranId: setId, tipe: 'disetujui' } })
    
    // Harus gagal Forbidden
    expect(res.success).toBe(false)
    expect((res as any).error.name).toBe('ForbiddenError')
    expect((res as any).error.statusCode).toBe(403)
  })

  it('3. Ziyadah Validation: Santri mencoba setor Ziyadah mandiri', async () => {
    mockSession(santriA_Id, 'santri', tenantId1, santriA_Id)
    const res = await createSetoran({ data: { jenis: 'ziyadah', lintasJuz: false, juzMulai: 1, halamanAwal: 1, halamanAkhir: 2, kualitas: 'lancar', sumber: 'santri_self_report' } })
    
    // Harus gagal ValidationError 400
    expect(res.success).toBe(false)
    expect((res as any).error.name).toBe('ValidationError')
    expect((res as any).error.statusCode).toBe(400)
    expect((res as any).error.message).toContain('Ziyadah harus didengarkan langsung oleh Ustadz')
  })

  it('4. Happy Path: Santri setor mandiri -> Ustadz pengampu review sukses', async () => {
    // Santri A setor
    mockSession(santriA_Id, 'santri', tenantId1, santriA_Id)
    const createRes = await createSetoran({ data: { jenis: 'murojaah', lintasJuz: false, juzMulai: 1, halamanAwal: 1, halamanAkhir: 2, kualitas: 'lancar', sumber: 'santri_self_report' } })
    expect(createRes.success).toBe(true)
    const setId = createRes.data?.id!
    
    // Pastikan notifikasi masuk untuk Ustadz A
    const notifs = await db.select().from(notifikasiUstadz).where(eq(notifikasiUstadz.setoranId, setId))
    expect(notifs.length).toBe(1)
    expect(notifs[0].ustadzId).toBe(ustadzA_Id)
    
    // Ustadz A review
    mockSession(ustadzA_Id, 'ustadz', tenantId1)
    const res = await submitFeedbackSetoran({ data: { setoranId: setId, tipe: 'disetujui' } })
    
    // Sukses
    expect(res.success).toBe(true)
    
    // Pastikan notif ditandai dibaca
    const updatedNotifs = await db.select().from(notifikasiUstadz).where(eq(notifikasiUstadz.setoranId, setId))
    expect(updatedNotifs[0].dibacaPada).not.toBeNull()
  })

  it('5. Edge Case ustadz null: Santri tanpa ustadz setor mandiri', async () => {
    // Santri tanpa ustadz setor
    mockSession(santriNoUstadz_Id, 'santri', tenantId1, santriNoUstadz_Id)
    const createRes = await createSetoran({ data: { jenis: 'murojaah', lintasJuz: false, juzMulai: 1, halamanAwal: 1, halamanAkhir: 2, kualitas: 'lancar', sumber: 'santri_self_report' } })
    
    // Harus tetap sukses 200/true
    expect(createRes.success).toBe(true)
    const setId = createRes.data?.id!
    
    // Tapi notifikasi = 0 (diskip)
    const notifs = await db.select().from(notifikasiUstadz).where(eq(notifikasiUstadz.setoranId, setId))
    expect(notifs.length).toBe(0)
  })
})

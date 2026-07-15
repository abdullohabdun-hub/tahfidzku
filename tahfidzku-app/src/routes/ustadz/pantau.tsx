import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { db } from '../../db'
import { setoran, santri, kelas } from '../../db/schema'
import { desc, eq, and, or } from 'drizzle-orm'
import { getAuthSession, requireRole } from '../../middleware/auth.middleware'
import { success, handleError } from '../../lib/response'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { BookOpen, Clock } from 'lucide-react'

// Backend Function
export const getPantauanMurojaah = createServerFn({ method: 'GET' })
  .handler(async () => {
    try {
      const session = await getAuthSession()
      if (!session) throw new Error('Unauthenticated')
      requireRole(session, 'ustadz')

      // Ambil setoran jenis sabqi/manzil untuk tenant ini
      const riwayat = await db
        .select({
          id: setoran.id,
          tanggal: setoran.createdAt,
          jenis: setoran.jenis,
          juz: setoran.juz,
          halamanAwal: setoran.halamanAwal,
          halamanAkhir: setoran.halamanAkhir,
          surat: setoran.surah,
          kualitas: setoran.kualitas,
          santriNama: santri.nama,
        })
        .from(setoran)
        .innerJoin(santri, eq(setoran.santriId, santri.id))
        .innerJoin(kelas, eq(santri.kelasId, kelas.id))
        .where(
          and(
            eq(setoran.tenantId, session.user.tenantId),
            eq(kelas.ustadzId, session.user.id),
            or(eq(setoran.jenis, 'sabqi'), eq(setoran.jenis, 'manzil'))
          )
        )
        .orderBy(desc(setoran.createdAt))
        .limit(50)

      return success(riwayat, 'Berhasil mengambil riwayat')
    } catch (err) {
      return handleError(err)
    }
  })

// Frontend Route
export const Route = createFileRoute('/ustadz/pantau')({
  component: UstadzPantauMurojaah,
  loader: async () => {
    const res = await getPantauanMurojaah()
    if (!res.success) throw new Error(res.error?.message)
    return res.data
  }
})

function UstadzPantauMurojaah() {
  const riwayat = Route.useLoaderData() || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Pantauan Murojaah</h1>
          <p className="text-slate-500 mt-1">Laporan murojaah mandiri (Sabqi/Manzil) dari Santri Dewasa.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-600" />
          <h2 className="font-semibold text-slate-700">50 Laporan Terakhir</h2>
        </div>
        
        {riwayat.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Belum ada santri yang melaporkan Murojaah.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {riwayat.map((item: any) => (
              <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{item.santriNama}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                      <span className="font-medium text-emerald-700 uppercase text-xs bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{item.jenis}</span>
                      <span>•</span>
                      {item.surat ? (
                        <span>Surat {item.surat} (Juz {item.juz})</span>
                      ) : (
                        <span>Juz {item.juz} Hal {item.halamanAwal === item.halamanAkhir ? item.halamanAwal : `${item.halamanAwal}-${item.halamanAkhir}`}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 md:text-right ml-14 md:ml-0">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">
                      {format(new Date(item.tanggal), 'd MMM yyyy, HH:mm', { locale: id })}
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                      item.kualitas === 'lancar' ? 'bg-emerald-100 text-emerald-700' : 
                      item.kualitas === 'mengulang' ? 'bg-blue-100 text-blue-700' : 
                      'bg-red-100 text-red-700'
                    }`}>
                      {item.kualitas}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import { createFileRoute, redirect, isRedirect, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { db } from '../../db'
import { setoran, santri, kelas } from '../../db/schema'
import { desc, eq, and, or } from 'drizzle-orm'
import { getAuthSession, requireRole } from '../../middleware/auth.middleware'
import { success, handleError } from '../../lib/response'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { AuthErrorAlert } from '../../components/AuthErrorAlert'
import { BookOpen, Clock, Check } from 'lucide-react'
import { getAllRubrikTenant } from '../../server-fns/rubrik'
import { FormatPenilaian } from '../../components/FormatPenilaian'
import { KATEGORI_COLORS } from '../../constants/kategori-colors'

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
          penilaianKustom: setoran.penilaianKustom,
          santriNama: santri.nama,
          ditinjauOlehUstadz: setoran.ditinjauOlehUstadz,
        })
        .from(setoran)
        .innerJoin(santri, eq(setoran.santriId, santri.id))
        .innerJoin(kelas, eq(santri.kelasId, kelas.id))
        .where(
          and(
            eq(setoran.tenantId, session.user.tenantId),
            eq(kelas.ustadzId, session.user.id),
            eq(setoran.sumber, 'santri_self_report')
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
    try {
      const res = await getPantauanMurojaah()
      if (!res.success) {
        if (res.error?.code === 'UNAUTHENTICATED') throw redirect({ to: '/login' })
        return { riwayat: [], rubrikAktif: [], authError: { message: res.error?.message, code: res.error?.code } }
      }
      const rubrikRes = await getAllRubrikTenant()
      return {
        riwayat: res.data,
        rubrikAktif: rubrikRes,
        authError: null
      }
    } catch (err: any) {
      if (isRedirect(err)) throw err
      return { riwayat: [], rubrikAktif: [], authError: { message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.', code: 'NETWORK_ERROR' } }
    }
  }
})

function UstadzPantauMurojaah() {
  const { riwayat, rubrikAktif, authError } = Route.useLoaderData() || { riwayat: [], rubrikAktif: [], authError: null }

  if (authError) return <AuthErrorAlert error={authError} />

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Pantauan Murojaah</h1>
          <p className="text-slate-500 mt-1">Laporan murojaah mandiri (Sabqi/Manzil) dari Santri Dewasa.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
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
              <Link 
                key={item.id} 
                to="/ustadz/setoran/$setId" 
                params={{ setId: item.id }}
                className="block p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100 relative">
                    <BookOpen className="w-5 h-5" />
                    {item.ditinjauOlehUstadz ? (
                      <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-0.5 border-2 border-white" title="Sudah dipantau">
                        <Check className="w-3 h-3" />
                      </div>
                    ) : (
                      <div className="absolute -bottom-1 -right-1 bg-orange-400 w-3 h-3 rounded-full border-2 border-white" title="Belum ditanggapi"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{item.santriNama}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                      <span className={`font-bold uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-full ${KATEGORI_COLORS[item.jenis as keyof typeof KATEGORI_COLORS]?.bg} ${KATEGORI_COLORS[item.jenis as keyof typeof KATEGORI_COLORS]?.text}`}>{item.jenis}</span>
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
                    <div className="text-xs text-slate-400 mb-1 text-right">
                      {format(new Date(item.tanggal), 'd MMM yyyy, HH:mm', { locale: id })}
                    </div>
                    <FormatPenilaian item={item} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

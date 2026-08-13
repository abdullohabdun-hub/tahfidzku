import { createFileRoute, Link, redirect, isRedirect, useSearch } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { Users, Search, Filter, CheckCircle2, Clock, BookOpen, ChevronRight, User } from 'lucide-react'
import { getSantriList } from '../../server-fns/santri'
import { getUstadzDashboard } from '../../server-fns/dashboard'
import { StatCard } from '../../components/shared/StatCard'
import { AuthErrorAlert } from '../../components/AuthErrorAlert'
import { KATEGORI_COLORS } from '../../constants/kategori-colors'
import { surahByNomor } from '../../lib/quranMapper'

export const Route = createFileRoute('/ustadz/santri/')({
  component: DaftarSantriBinaanPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      status: (search.status as string) || 'semua',
      program: (search.program as string) || 'semua',
      q: (search.q as string) || '',
    }
  },
  loader: async () => {
    try {
      const [resSantri, resAgregat] = await Promise.all([
        getSantriList({ data: { fetchAll: true } }),
        getUstadzDashboard(),
      ])

      if (!resSantri.success) {
        if (resSantri.error?.code === 'UNAUTHENTICATED') throw redirect({ to: '/login' })
        return { santriList: [], sudahSetorIds: [], authError: { message: resSantri.error?.message, code: resSantri.error?.code } }
      }

      const santriListRaw = Array.isArray(resSantri.data) ? resSantri.data : (resSantri.data?.items || [])

      const belumSetorIds = new Set<string>()
      if (resAgregat.success && resAgregat.data?.belumSetor) {
        resAgregat.data.belumSetor.forEach((s: any) => {
          if (s.id) belumSetorIds.add(s.id)
        })
      }

      return {
        santriList: santriListRaw,
        belumSetorIds: Array.from(belumSetorIds),
        authError: null,
      }
    } catch (err: any) {
      if (isRedirect(err)) throw err
      return {
        santriList: [],
        belumSetorIds: [],
        authError: { message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.', code: 'NETWORK_ERROR' },
      }
    }
  },
})

function DaftarSantriBinaanPage() {
  const { santriList, belumSetorIds, authError } = Route.useLoaderData()
  const searchParams = useSearch({ from: '/ustadz/santri/' })

  const [searchTerm, setSearchTerm] = useState(searchParams.q || '')
  const [statusFilter, setStatusFilter] = useState<'semua' | 'belum_setor' | 'sudah_setor'>(
    (searchParams.status as any) || 'semua'
  )
  const [programFilter, setProgramFilter] = useState<'semua' | 'tahfidz' | 'iqra'>(
    (searchParams.program as any) || 'semua'
  )

  if (authError) return <AuthErrorAlert error={authError} />

  const belumSetorSet = useMemo(() => new Set(belumSetorIds), [belumSetorIds])

  const filteredSantri = useMemo(() => {
    return santriList.filter((s: any) => {
      // Filter Nama
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase()
        const matchNama = s.nama?.toLowerCase().includes(q)
        const matchKelas = s.kelasNama?.toLowerCase().includes(q)
        if (!matchNama && !matchKelas) return false
      }

      // Filter Program
      const isIqra = s.tahapSantri === 'iqra'
      if (programFilter === 'tahfidz' && isIqra) return false
      if (programFilter === 'iqra' && !isIqra) return false

      // Filter Status Setoran Hari Ini
      const isBelumSetor = belumSetorSet.has(s.id)
      const isSudahSetor = !isBelumSetor
      if (statusFilter === 'sudah_setor' && !isSudahSetor) return false
      if (statusFilter === 'belum_setor' && isSudahSetor) return false

      return true
    })
  }, [santriList, searchTerm, statusFilter, programFilter, belumSetorSet])

  const totalSantri = santriList.length
  const totalBelumSetor = santriList.filter((s: any) => belumSetorSet.has(s.id)).length
  const totalSudahSetor = totalSantri - totalBelumSetor

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Daftar Santri Binaan
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Pantau santri di halaqoh yang Anda ampu.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter('semua')}
          className={`text-left transition-all rounded-xl focus:outline-none ${
            statusFilter === 'semua' ? 'ring-2 ring-primary/40' : ''
          }`}
        >
          <StatCard
            label="Total Santri"
            value={totalSantri}
            icon={Users}
            tone="neutral"
            compact
          />
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('sudah_setor')}
          className={`text-left transition-all rounded-xl focus:outline-none ${
            statusFilter === 'sudah_setor' ? 'ring-2 ring-emerald-500/40' : ''
          }`}
        >
          <StatCard
            label="Sudah Setor"
            value={totalSudahSetor}
            icon={CheckCircle2}
            tone="success"
            compact
          />
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('belum_setor')}
          className={`text-left transition-all rounded-xl focus:outline-none ${
            statusFilter === 'belum_setor' ? 'ring-2 ring-amber-500/40' : ''
          }`}
        >
          <StatCard
            label="Belum Setor"
            value={totalBelumSetor}
            icon={Clock}
            tone="warning"
            compact
          />
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama santri atau kelas..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="semua">Semua Status</option>
              <option value="belum_setor">Belum Setor Hari Ini</option>
              <option value="sudah_setor">Sudah Setor Hari Ini</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600">
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value as any)}
              className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="semua">Semua Program</option>
              <option value="tahfidz">Tahfidz</option>
              <option value="iqra">Iqra</option>
            </select>
          </div>
        </div>
      </div>

      {/* Santri Cards List */}
      <div className="space-y-3">
        {filteredSantri.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 font-semibold text-sm">Tidak ada santri yang sesuai kriteria</p>
            <p className="text-slate-400 text-xs mt-1">Coba ubah kata kunci atau filter pencarian Anda.</p>
          </div>
        ) : (
          filteredSantri.map((s: any) => {
            const isIqra = s.tahapSantri === 'iqra'
            const isSudahSetor = !belumSetorSet.has(s.id)

            let posLabel = 'Belum ada setoran'
            if (isIqra) {
              if (s.jilidIqraTerakhir) {
                posLabel = `Jilid ${s.jilidIqraTerakhir}${s.halamanIqraTerakhir ? `, Hal. ${s.halamanIqraTerakhir}` : ''}`
              }
            } else {
              const pos = s.posisiTerakhir
              if (pos) {
                const sNo = pos.surahNomor || (typeof pos.surah === 'number' ? pos.surah : parseInt(pos.surah, 10))
                const sInfo = !isNaN(sNo) ? surahByNomor[sNo] : null
                const sNama = pos.surahNama || (sInfo ? sInfo.nama : (typeof pos.surah === 'string' ? pos.surah : (sNo ? `Surah ${sNo}` : '')))
                const ayatVal = pos.ayat || pos.ayatAkhir || pos.ayatAwal || 1
                if (sNama) {
                  posLabel = `${sNama} : ${ayatVal}`
                }
              }
            }

            return (
              <div
                key={s.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs hover:shadow-sm transition-all duration-200 flex items-center justify-between gap-3"
              >
                {/* Info Santri */}
                <div className="flex items-center gap-3 min-w-0">
                  <Link
                    to="/ustadz/santri/$santriId"
                    params={{ santriId: s.id }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold uppercase text-xs border shrink-0 hover:scale-105 transition-transform ${
                      isIqra
                        ? 'bg-violet-50 text-violet-700 border-violet-200'
                        : 'bg-primary/10 text-primary border-primary/20'
                    }`}
                  >
                    {s.nama.substring(0, 2)}
                  </Link>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link
                        to="/ustadz/santri/$santriId"
                        params={{ santriId: s.id }}
                        className="font-semibold text-slate-800 hover:text-primary transition-colors text-sm hover:underline truncate"
                      >
                        {s.nama}
                      </Link>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                          isIqra ? 'bg-violet-100 text-violet-800' : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {isIqra ? 'Iqra' : 'Tahfidz'}
                      </span>
                      {isSudahSetor ? (
                        <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-0.5 shrink-0">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Setor
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-0.5 shrink-0">
                          <Clock className="w-2.5 h-2.5" /> Belum
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      <span className="text-slate-500 font-medium">{s.kelasNama || 'Tanpa Kelas'}</span>
                      {posLabel !== 'Belum ada setoran' && (
                        <> · <span className="text-slate-600">{posLabel}</span></>
                      )}
                    </p>
                  </div>
                </div>

                {/* Quick Action */}
                <Link
                  to="/ustadz/input"
                  search={{ santriId: s.id }}
                  className="shrink-0 bg-primary/10 text-primary hover:bg-primary/20 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                >
                  Input
                </Link>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

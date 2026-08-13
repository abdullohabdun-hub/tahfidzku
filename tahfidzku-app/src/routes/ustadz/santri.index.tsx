import { createFileRoute, Link, redirect, isRedirect, useSearch } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { Users, Search, Filter, CheckCircle2, Clock, BookOpen, ChevronRight, User } from 'lucide-react'
import { getSantriList } from '../../server-fns/santri'
import { getUstadzDashboard } from '../../server-fns/dashboard'
import { AuthErrorAlert } from '../../components/AuthErrorAlert'
import { KATEGORI_COLORS } from '../../constants/kategori-colors'

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
        getSantriList(),
        getUstadzDashboard(),
      ])

      if (!resSantri.success) {
        if (resSantri.error?.code === 'UNAUTHENTICATED') throw redirect({ to: '/login' })
        return { santriList: [], sudahSetorIds: [], authError: { message: resSantri.error?.message, code: resSantri.error?.code } }
      }

      const belumSetorIds = new Set<string>()
      if (resAgregat.success && resAgregat.data?.belumSetor) {
        resAgregat.data.belumSetor.forEach((s: any) => {
          if (s.id) belumSetorIds.add(s.id)
        })
      }

      return {
        santriList: resSantri.data || [],
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            Daftar Santri Binaan
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Kelola dan pantau seluruh santri di halaqoh yang Anda ampu.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <button
          onClick={() => setStatusFilter('semua')}
          className={`p-4 rounded-2xl border text-left transition-all flex items-start justify-between ${
            statusFilter === 'semua'
              ? 'bg-white border-primary shadow-sm ring-2 ring-primary/20'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Santri</p>
            <p className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">{totalSantri}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Santri aktif terdaftar</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100/80 text-slate-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('sudah_setor')}
          className={`p-4 rounded-2xl border text-left transition-all flex items-start justify-between ${
            statusFilter === 'sudah_setor'
              ? 'bg-emerald-50/60 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200/80 hover:border-emerald-300'
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-slate-500">Sudah Setor Hari Ini</p>
            <p className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">{totalSudahSetor}</p>
            <p className="text-[10px] text-emerald-600 font-medium mt-1">Telah menyetor</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('belum_setor')}
          className={`p-4 rounded-2xl border text-left transition-all flex items-start justify-between ${
            statusFilter === 'belum_setor'
              ? 'bg-amber-50/60 border-amber-500 shadow-sm ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200/80 hover:border-amber-300'
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-slate-500">Belum Setor Hari Ini</p>
            <p className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">{totalBelumSetor}</p>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-1 inline-block">
              Perlu Perhatian
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
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
              if (s.posisiTerakhir && s.posisiTerakhir.surahNama && s.posisiTerakhir.ayat) {
                posLabel = `${s.posisiTerakhir.surahNama} : Ayat ${s.posisiTerakhir.ayat}`
              }
            }

            return (
              <div
                key={s.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Info Santri */}
                <div className="flex items-center gap-3.5">
                  <Link
                    to="/ustadz/santri/$santriId"
                    params={{ santriId: s.id }}
                    className={`w-11 h-11 rounded-full flex items-center justify-center font-extrabold uppercase text-sm border shrink-0 hover:scale-105 transition-transform ${
                      isIqra
                        ? 'bg-violet-50 text-violet-700 border-violet-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {s.nama.substring(0, 2)}
                  </Link>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to="/ustadz/santri/$santriId"
                        params={{ santriId: s.id }}
                        className="font-bold text-slate-900 hover:text-primary transition-colors text-base hover:underline"
                      >
                        {s.nama}
                      </Link>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isIqra ? 'bg-violet-100 text-violet-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isIqra ? 'Iqra' : 'Tahfidz'}
                      </span>

                      {isSudahSetor ? (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Sudah Setor Hari Ini
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" /> Belum Setor
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>Kelas: <strong className="text-slate-700">{s.kelasNama || 'Tanpa Kelas'}</strong></span>
                      <span>•</span>
                      <span>Posisi: <strong className="text-slate-700">{posLabel}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Button */}
                <div className="flex items-center gap-2 self-end md:self-auto">
                  <Link
                    to="/ustadz/input"
                    search={{ santriId: s.id }}
                    className="bg-primary/10 text-primary hover:bg-primary/20 font-bold px-3.5 py-2 rounded-xl text-xs transition-colors"
                  >
                    Input Setoran
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

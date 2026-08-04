import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { PageHeader } from '../../components/shared/PageHeader'
import { getUjianList } from '../../server-fns/ujian'
import { warnaBadgeStatus, labelStatus } from '../../lib/ujianLogic'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { EmptyState } from '../../components/shared/EmptyState'
import { ClipboardList } from 'lucide-react'

export const Route = createFileRoute('/admin/ujian')({
  component: AdminUjianPage,
})

type UjianRecord = {
  id: string
  santriNama: string
  ustadzNama: string
  juz: number
  kelancaran: string
  tajwid: string
  skor: number
  status: 'lulus' | 'tidak_lulus'
  cakupanMateri: string | null
  catatan: string | null
  attempt: number
  createdAt: string | Date
}

function AdminUjianPage() {
  const [riwayat, setRiwayat] = useState<UjianRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const res = await getUjianList()
      if (res.success && res.data) {
        setRiwayat(res.data as UjianRecord[])
      }
      setLoading(false)
    }
    loadData()
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat Ujian Kenaikan Juz"
        description="Laporan semua hasil ujian kenaikan juz dari semua ustadz."
      />

      {loading ? (
        <div className="py-12 text-center text-slate-400">Memuat data...</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {riwayat.length === 0 ? (
            <div className="py-10">
              <EmptyState
                icon={ClipboardList}
                title="Belum Ada Ujian"
                description="Belum ada riwayat ujian kenaikan juz dari santri manapun."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                    <th className="text-left p-4">Santri</th>
                    <th className="text-left p-4">Ustadz</th>
                    <th className="text-left p-4">Juz / Materi</th>
                    <th className="text-left p-4">Kelancaran</th>
                    <th className="text-left p-4">Tajwid</th>
                    <th className="text-left p-4">Skor</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {riwayat.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-semibold text-slate-800">{u.santriNama}</td>
                      <td className="p-4 text-slate-600">{u.ustadzNama}</td>
                      <td className="p-4">
                        <div className="font-medium text-emerald-700">Juz {u.juz}</div>
                        {u.cakupanMateri && <div className="text-xs text-slate-500 mt-0.5">{u.cakupanMateri}</div>}
                      </td>
                      <td className="p-4 text-slate-600 capitalize">{u.kelancaran}</td>
                      <td className="p-4 text-slate-600 capitalize">{u.tajwid}</td>
                      <td className="p-4">
                        <span className="font-bold text-slate-700">{u.skor}</span>
                        <span className="text-slate-400 text-xs">/100</span>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full border ${warnaBadgeStatus(u.status)}`}>
                          {labelStatus(u.status)}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 text-xs">
                        {format(new Date(u.createdAt), 'd MMM yyyy', { locale: id })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

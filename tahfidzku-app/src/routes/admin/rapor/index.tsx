import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Printer, Loader2, Search, Users, Settings } from 'lucide-react'
import { getSantriList } from '../../../server-fns/santri'
import { Button } from '../../../components/ui/button'
import { RaporSettingsModal } from '../../../components/Rapor/RaporSettingsModal'

export const Route = createFileRoute('/admin/rapor/')({
  component: RaporIndexPage,
})

function RaporIndexPage() {
  const [santri, setSantri] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const res = await getSantriList()
      if (res.success) {
        setSantri(res.data)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const filteredSantri = santri.filter(s => 
    s.nama.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Printer className="w-6 h-6 text-emerald-600" />
            Cetak Rapor Hafalan
          </h2>
          <p className="text-slate-500 mt-1">Pilih santri untuk melihat dan mencetak rapor bulanannya.</p>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => setIsSettingsOpen(true)}
          className="gap-2 shrink-0 border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50"
        >
          <Settings className="w-4 h-4" />
          Pengaturan Rapor
        </Button>
      </div>

      <RaporSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari nama santri..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="p-6 bg-slate-50/30">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSantri.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-500">
                  Tidak ada santri yang ditemukan.
                </div>
              ) : (
                filteredSantri.map(s => (
                  <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-5 group">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
                        <Users className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-800 line-clamp-1 text-base">{s.nama}</h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${s.tipe === 'dewasa' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {s.tipe === 'dewasa' ? 'Dewasa' : 'Reguler'}
                          </span>
                          <span className="text-xs text-slate-500 truncate">
                            {s.kelasNama ?? 'Belum ada kelas'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <Link to="/admin/rapor/$santriId" params={{ santriId: s.id }} className="w-full mt-2">
                      <Button className="w-full bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 justify-center h-10 shadow-sm">
                        <Printer className="w-4 h-4 mr-2" />
                        Pilih & Cetak
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Users, Plus, Loader2, Trash2 } from 'lucide-react'
import { getSantriList, createSantri, deleteSantri, getKelasList } from '../../server-fns/admin-functions'
import { Button } from '../../components/ui/button'

export const Route = createFileRoute('/admin/santri')({
  component: DataSantriPage,
})

function DataSantriPage() {
  const [santri, setSantri] = useState<any[]>([])
  const [kelasList, setKelasList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  // Form State
  const [nama, setNama] = useState('')
  const [targetJuz, setTargetJuz] = useState<number>(30)
  const [kelasId, setKelasId] = useState('')
  const [tipe, setTipe] = useState<'reguler' | 'dewasa'>('dewasa')
  const [submitting, setSubmitting] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTipe, setFilterTipe] = useState<'all' | 'reguler' | 'dewasa'>('all')
  const [filterKelas, setFilterKelas] = useState<string>('all')

  async function loadData() {
    setLoading(true)
    const [resSantri, resKelas] = await Promise.all([
      getSantriList(),
      getKelasList()
    ])
    if (resSantri.success && resSantri.data) setSantri(resSantri.data)
    if (resKelas.success && resKelas.data) setKelasList(resKelas.data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const res = await createSantri({ 
      data: { 
        nama, 
        targetJuz: Number(targetJuz), 
        kelasId: kelasId ? kelasId : undefined,
        tipe
      } 
    })
    
    if (res.success) {
      alert(res.message || 'Berhasil menambah santri')
      setShowForm(false)
      setNama(''); setTargetJuz(30); setKelasId(''); setTipe('dewasa')
      loadData()
    } else {
      alert(res.error?.message || 'Gagal')
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus data santri ini? Data hafalan santri ini akan ikut terhapus!')) {
      const res = await deleteSantri({ data: { id } })
      if (res.success) {
        loadData()
      } else {
        alert(res.error?.message || 'Gagal menghapus')
      }
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Data Santri</h2>
          <p className="text-slate-500">Kelola master data peserta didik.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" /> Tambah Santri
        </Button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-lg mb-4">Form Tambah Santri</h3>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1">Nama Lengkap</label>
              <input required value={nama} onChange={e => setNama(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="Nama Santri" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Target Hafalan (Juz)</label>
              <input required type="number" min={1} max={30} value={targetJuz} onChange={e => setTargetJuz(Number(e.target.value))} className="w-full border p-2 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pilih Kelas / Halaqoh</label>
              <select value={kelasId} onChange={e => setKelasId(e.target.value)} className="w-full border p-2 rounded-lg bg-white">
                <option value="">-- Belum Masuk Kelas --</option>
                {kelasList.map(k => (
                  <option key={k.id} value={k.id}>{k.nama} (Ust. {k.ustadzNama || '-'})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tipe Santri</label>
              <div className="flex gap-4 items-center mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="tipe" value="reguler" checked={tipe === 'reguler'} onChange={() => setTipe('reguler')} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500" />
                  <span className="text-sm">Santri Reguler (Anak)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="tipe" value="dewasa" checked={tipe === 'dewasa'} onChange={() => setTipe('dewasa')} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500" />
                  <span className="text-sm">Santri Dewasa (Online)</span>
                </label>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {tipe === 'dewasa' ? 'Santri Dewasa akan dibuatkan akun untuk login mandiri dan input Murojaah.' : 'Santri Reguler terhubung ke akun Wali Santri (Orang Tua).'}
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
              <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Simpan
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <input
            type="text"
            placeholder="Cari nama santri..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full sm:max-w-xs border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
          />
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={filterTipe}
              onChange={e => setFilterTipe(e.target.value as any)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-emerald-500 w-full sm:w-auto"
            >
              <option value="all">Semua Tipe</option>
              <option value="dewasa">Dewasa / Online</option>
              <option value="reguler">Reguler (Anak)</option>
            </select>
            <select
              value={filterKelas}
              onChange={e => setFilterKelas(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-emerald-500 w-full sm:w-auto"
            >
              <option value="all">Semua Kelas</option>
              <option value="none">Belum Ada Kelas</option>
              {kelasList.map(k => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" /></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold text-slate-600">Nama Santri</th>
                <th className="p-4 font-semibold text-slate-600">Tipe</th>
                <th className="p-4 font-semibold text-slate-600">Kelas</th>
                <th className="p-4 font-semibold text-slate-600">Target</th>
                <th className="p-4 font-semibold text-slate-600 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {santri.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-500">Belum ada data santri</td>
                </tr>
              ) : (
                santri
                  .filter(s => {
                    const matchSearch = s.nama.toLowerCase().includes(searchQuery.toLowerCase())
                    const matchTipe = filterTipe === 'all' || s.tipe === filterTipe
                    const matchKelas = filterKelas === 'all' || (filterKelas === 'none' && !s.kelasId) || s.kelasId === filterKelas
                    return matchSearch && matchTipe && matchKelas
                  })
                  .map(s => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-medium flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                        <Users className="w-4 h-4" />
                      </div>
                      {s.nama}
                    </td>
                    <td className="p-4">
                      {s.tipe === 'dewasa' 
                        ? <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md text-xs font-medium">Dewasa / Online</span>
                        : <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-md text-xs font-medium">Reguler (Anak)</span>
                      }
                    </td>
                    <td className="p-4 text-slate-600">
                      {s.kelasNama ? <span className="bg-slate-100 px-2 py-1 rounded-md text-xs">{s.kelasNama}</span> : <span className="text-slate-400 italic text-xs">Belum ada kelas</span>}
                    </td>
                    <td className="p-4 text-slate-600">{s.targetJuz} Juz</td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

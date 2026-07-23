import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { BookOpen, Plus, Loader2, Trash2, Edit } from 'lucide-react'
import { getKelasList, createKelas, deleteKelas, updateKelas } from '../../server-fns/kelas'
import { getUstadzList } from '../../server-fns/ustadz'
import { Button } from '../../components/ui/button'

export const Route = createFileRoute('/admin/kelas')({
  component: DataKelasPage,
})

const HARI_OPTIONS = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu']

function DataKelasPage() {
  const [kelasList, setKelasList] = useState<any[]>([])
  const [ustadzList, setUstadzList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nama, setNama] = useState('')
  const [ustadzId, setUstadzId] = useState('')
  const [hariPertemuan, setHariPertemuan] = useState<string[]>([])
  const [jamMulai, setJamMulai] = useState('')
  const [jamSelesai, setJamSelesai] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function loadData() {
    setLoading(true)
    const [resKelas, resUstadz] = await Promise.all([
      getKelasList(),
      getUstadzList()
    ])
    if (resKelas.success && resKelas.data) setKelasList(resKelas.data)
    if (resUstadz.success && resUstadz.data) setUstadzList(resUstadz.data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    if (jamMulai && jamSelesai && jamSelesai <= jamMulai) {
      setErrorMsg('Jam selesai harus lebih akhir dari jam mulai')
      return
    }

    setSubmitting(true)

    const payload = { 
      data: { 
        nama, 
        ustadzId: ustadzId ? ustadzId : undefined,
        hariPertemuan,
        jamMulai: jamMulai || undefined,
        jamSelesai: jamSelesai || undefined,
      } 
    }
    
    let res;
    if (editingId) {
      res = await updateKelas({ data: { ...payload.data, id: editingId } })
    } else {
      res = await createKelas(payload)
    }
    
    if (res.success) {
      alert(res.message || 'Berhasil menyimpan data')
      handleCloseForm()
      loadData()
    } else {
      alert(res.error?.message || 'Gagal')
    }
    setSubmitting(false)
  }

  const handleEdit = (k: any) => {
    setEditingId(k.id)
    setNama(k.nama)
    setUstadzId(k.ustadzId || '')
    setHariPertemuan(k.hariPertemuan || [])
    setJamMulai(k.jamMulai ? k.jamMulai.substring(0, 5) : '')
    setJamSelesai(k.jamSelesai ? k.jamSelesai.substring(0, 5) : '')
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingId(null)
    setNama('')
    setUstadzId('')
    setHariPertemuan([])
    setJamMulai('')
    setJamSelesai('')
    setErrorMsg('')
  }

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus kelas ini? (Santri di dalamnya akan kehilangan relasi kelas)')) {
      const res = await deleteKelas({ data: { id } })
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
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Kelas / Halaqoh</h2>
          <p className="text-slate-500">Kelompokkan santri dan tentukan pengajarnya.</p>
        </div>
        <Button onClick={() => { handleCloseForm(); setShowForm(!showForm) }} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" /> Tambah Kelas
        </Button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-lg mb-4">{editingId ? 'Edit Kelas' : 'Form Tambah Kelas'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1">Nama Kelas / Halaqoh</label>
              <input required value={nama} onChange={e => setNama(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="Contoh: Halaqoh Utsman Bin Affan" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ustadz Penanggung Jawab</label>
              <select value={ustadzId} onChange={e => setUstadzId(e.target.value)} className="w-full border p-2 rounded-lg bg-white">
                <option value="">-- Pilih Ustadz --</option>
                {ustadzList.map(u => (
                  <option key={u.id} value={u.id}>{u.nama}</option>
                ))}
              </select>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-sm font-medium mb-2">Jadwal Pertemuan (Opsional)</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {HARI_OPTIONS.map(hari => {
                  const isSelected = hariPertemuan.includes(hari)
                  return (
                    <button type="button" key={hari} 
                      onClick={() => {
                        setHariPertemuan(prev => isSelected ? prev.filter(h => h !== hari) : [...prev, hari])
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${isSelected ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                    >
                      {hari}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">Jam Mulai</label>
                  <input type="time" value={jamMulai} onChange={e => setJamMulai(e.target.value)} className="w-full border p-2 rounded-lg" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">Jam Selesai</label>
                  <input type="time" value={jamSelesai} onChange={e => setJamSelesai(e.target.value)} className="w-full border p-2 rounded-lg" />
                </div>
              </div>
              {errorMsg && <p className="text-red-500 text-xs mt-2">{errorMsg}</p>}
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleCloseForm}>Batal</Button>
              <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Simpan
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" /></div>
        ) : (
          <table className="w-full text-left text-[13px] whitespace-nowrap">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Nama Kelas</th>
                <th className="px-4 py-3">Ustadz Pengampu</th>
                <th className="px-4 py-3">Jadwal</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {kelasList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-500">Belum ada data kelas</td>
                </tr>
              ) : (
                kelasList.map(k => (
                  <tr key={k.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      {k.nama}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {k.ustadzNama ? <span className="font-medium text-emerald-700">Ust. {k.ustadzNama}</span> : <span className="text-slate-400 italic">Belum ada</span>}
                    </td>
                    <td className="px-4 py-3">
                      {k.hariPertemuan && k.hariPertemuan.length > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <span className="capitalize">{k.hariPertemuan.join(', ')}</span>
                          {(k.jamMulai || k.jamSelesai) && ` · ${k.jamMulai?.substring(0,5) || ''}–${k.jamSelesai?.substring(0,5) || ''}`}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          Jadwal belum diatur
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(k)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(k.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
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

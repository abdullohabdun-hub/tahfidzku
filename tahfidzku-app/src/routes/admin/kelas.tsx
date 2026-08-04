import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { BookOpen, Plus, Loader2, Trash2, Edit, AlertTriangle } from 'lucide-react'
import { getKelasList, createKelas, deleteKelas, updateKelas } from '../../server-fns/kelas'
import { getUstadzList } from '../../server-fns/ustadz'
import { getRaporSettings } from '../../server-fns/rapor'
import { Button } from '../../components/ui/button'
import { toast } from "../../components/ui/sonner"
import { RowActionsMenu } from '../../components/shared/RowActionsMenu'
import { WAKTU_SHALAT_OPTIONS, WAKTU_SHALAT_LABEL } from '../../lib/constants'
import { PageHeader } from '../../components/shared/PageHeader'

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
  const [tipeKelas, setTipeKelas] = useState<'reguler' | 'reguler_non_mukim' | 'online' | ''>('')
  const [hariPertemuan, setHariPertemuan] = useState<string[]>([])
  const [jamMulai, setJamMulai] = useState('')
  const [jamSelesai, setJamSelesai] = useState('')
  const [waktuShalatDiizinkan, setWaktuShalatDiizinkan] = useState<string[]>([])
  const [tenantSesiDefault, setTenantSesiDefault] = useState<string[]>([])
  const [absensiCount, setAbsensiCount] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function loadData() {
    setLoading(true)
    const [resKelas, resUstadz, resRapor] = await Promise.all([
      getKelasList(),
      getUstadzList(),
      getRaporSettings()
    ])
    if (resKelas.success && resKelas.data) setKelasList(resKelas.data)
    if (resUstadz.success && resUstadz.data) setUstadzList(resUstadz.data)
    if (resRapor.success && resRapor.data) setTenantSesiDefault(resRapor.data.sesiRegulerDefault || [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    if (!tipeKelas) {
      setErrorMsg('Pilih tipe kelas (Reguler / Online)')
      return
    }
    if ((tipeKelas === 'online' || tipeKelas === 'reguler_non_mukim') && jamMulai && jamSelesai && jamSelesai <= jamMulai) {
      setErrorMsg('Jam selesai harus lebih akhir dari jam mulai')
      return
    }

    setSubmitting(true)

    try {
      const payload = { 
        data: { 
          nama, 
          ustadzId: ustadzId ? ustadzId : undefined,
          tipeKelas: tipeKelas as any,
          hariPertemuan: (tipeKelas === 'online' || tipeKelas === 'reguler_non_mukim') ? hariPertemuan : undefined,
          jamMulai: ((tipeKelas === 'online' || tipeKelas === 'reguler_non_mukim') && jamMulai) ? jamMulai : undefined,
          jamSelesai: ((tipeKelas === 'online' || tipeKelas === 'reguler_non_mukim') && jamSelesai) ? jamSelesai : undefined,
          waktuShalatDiizinkan: tipeKelas === 'reguler' ? (waktuShalatDiizinkan as any) : undefined
        } 
      }
      
      let res;
      if (editingId) {
        res = await updateKelas({ data: { ...payload.data, id: editingId } })
      } else {
        res = await createKelas(payload)
      }
      
      if (res.success) {
        toast.success(res.message || 'Berhasil menyimpan data')
        handleCloseForm()
        loadData()
      } else {
        toast.error(res.error?.message || 'Gagal')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Terjadi kesalahan sistem')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (k: any) => {
    setEditingId(k.id)
    setNama(k.nama)
    setUstadzId(k.ustadzId || '')
    setTipeKelas(k.tipeKelas || 'reguler')
    setHariPertemuan(k.hariPertemuan || [])
    setJamMulai(k.jamMulai ? k.jamMulai.substring(0, 5) : '')
    setJamSelesai(k.jamSelesai ? k.jamSelesai.substring(0, 5) : '')
    setWaktuShalatDiizinkan(k.waktuShalatDiizinkan || [])
    setAbsensiCount(k.absensiCount || 0)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingId(null)
    setNama('')
    setUstadzId('')
    setTipeKelas('')
    setHariPertemuan([])
    setJamMulai('')
    setJamSelesai('')
    setWaktuShalatDiizinkan([])
    setAbsensiCount(0)
    setErrorMsg('')
  }

  const handleDelete = async (id: string) => {
    // confirm() dihapus — AlertDialog dari RowActionsMenu menangani konfirmasi sebelum handler ini dipanggil
    const res = await deleteKelas({ data: { id } })
    if (res.success) {
      toast.success("Kelas berhasil dihapus")
      loadData()
    } else {
      toast.error(res.error?.message || 'Gagal menghapus')
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Kelas / Halaqoh"
        description="Kelompokkan santri dan tentukan pengajarnya."
        action={
          <Button onClick={() => { handleCloseForm(); setShowForm(!showForm) }}>
            <Plus className="w-4 h-4 mr-2" /> Tambah Kelas
          </Button>
        }
      />

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
              <label className="block text-sm font-medium mb-2">Tipe Kelas</label>
              {editingId && absensiCount > 0 && (
                <div className="mb-3 p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500" />
                  <p>Hati-hati: Mengubah tipe kelas dapat berdampak pada konsistensi {absensiCount} histori absensi yang sudah tercatat.</p>
                </div>
              )}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="tipeKelas" value="reguler" checked={tipeKelas === 'reguler'} onChange={() => {
                    setTipeKelas('reguler')
                    if (!editingId) setWaktuShalatDiizinkan(tenantSesiDefault)
                  }} className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm">Kelas Reguler (Santri Mukim)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="tipeKelas" value="reguler_non_mukim" checked={tipeKelas === 'reguler_non_mukim'} onChange={() => setTipeKelas('reguler_non_mukim')} className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm">Reguler (Non-Mukim)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="tipeKelas" value="online" checked={tipeKelas === 'online'} onChange={() => setTipeKelas('online')} className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm">Kelas Online</span>
                </label>
              </div>
            </div>

            {(tipeKelas === 'online' || tipeKelas === 'reguler_non_mukim') && (
              <div className="pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-medium mb-2">Jadwal Pertemuan</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {HARI_OPTIONS.map(hari => {
                    const isSelected = hariPertemuan.includes(hari)
                    return (
                      <button type="button" key={hari} 
                        onClick={() => {
                          setHariPertemuan(prev => isSelected ? prev.filter(h => h !== hari) : [...prev, hari])
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${isSelected ? 'bg-primary/10 text-primary border border-primary/20 font-semibold' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                      >
                        {hari}
                      </button>
                    )
                  })}
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">Jam Mulai</label>
                    <input type="time" required value={jamMulai} onChange={e => setJamMulai(e.target.value)} className="w-full border p-2 rounded-lg" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">Jam Selesai</label>
                    <input type="time" required value={jamSelesai} onChange={e => setJamSelesai(e.target.value)} className="w-full border p-2 rounded-lg" />
                  </div>
                </div>
              </div>
            )}

            {tipeKelas === 'reguler' && (
              <div className="pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-medium mb-2">Waktu Shalat Diizinkan Buka Sesi (Opsional)</label>
                <p className="text-xs text-slate-500 mb-3">Jika dikosongkan, ustadz bebas membuka sesi di waktu shalat manapun.</p>
                <div className="flex flex-wrap gap-2">
                  {WAKTU_SHALAT_OPTIONS.map(ws => {
                    const isSelected = waktuShalatDiizinkan.includes(ws)
                    return (
                      <button type="button" key={ws}
                        onClick={() => {
                          setWaktuShalatDiizinkan(prev => isSelected ? prev.filter(w => w !== ws) : [...prev, ws])
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${isSelected ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                      >
                        {WAKTU_SHALAT_LABEL[ws]}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {errorMsg && <p className="text-red-500 text-xs mt-2">{errorMsg}</p>}
            
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleCloseForm}>Batal</Button>
              <Button type="submit" disabled={submitting || !tipeKelas}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Simpan
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
        ) : (
          <table className="w-full text-left text-[13px] whitespace-nowrap">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Nama Kelas</th>
                <th className="px-4 py-3">Tipe</th>
                <th className="px-4 py-3">Ustadz Pengampu</th>
                <th className="px-4 py-3">Jadwal / Waktu Sesi</th>
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
                      {k.tipeKelas === 'online' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200">
                          Online
                        </span>
                      ) : k.tipeKelas === 'reguler_non_mukim' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200">
                          Reguler (Non-Mukim)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Reguler (Mukim)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {k.ustadzNama ? <span className="font-medium text-emerald-700">Ust. {k.ustadzNama}</span> : <span className="text-slate-400 italic">Belum ada</span>}
                    </td>
                    <td className="px-4 py-3">
                      {k.tipeKelas === 'online' || k.tipeKelas === 'reguler_non_mukim' ? (
                        k.hariPertemuan && k.hariPertemuan.length > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <span className="capitalize">{k.hariPertemuan.join(', ')}</span>
                            {(k.jamMulai || k.jamSelesai) && ` · ${k.jamMulai?.substring(0,5) || ''}–${k.jamSelesai?.substring(0,5) || ''}`}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Jadwal belum diatur
                          </span>
                        )
                      ) : (
                        k.waktuShalatDiizinkan && k.waktuShalatDiizinkan.length > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {k.waktuShalatDiizinkan.map((w: string) => WAKTU_SHALAT_LABEL[w as keyof typeof WAKTU_SHALAT_LABEL] || w).join(', ')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Semua Waktu
                          </span>
                        )
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {/* Edit + Hapus via RowActionsMenu (AlertDialog konfirmasi untuk Hapus) */}
                      <div className="flex justify-end">
                        <RowActionsMenu
                          actions={[
                            {
                              label: "Edit",
                              icon: Edit,
                              onClick: () => handleEdit(k),
                            },
                            {
                              label: "Hapus",
                              icon: Trash2,
                              onClick: () => handleDelete(k.id),
                              variant: "destructive",
                              entityName: k.nama,
                            },
                          ]}
                        />
                      </div>
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

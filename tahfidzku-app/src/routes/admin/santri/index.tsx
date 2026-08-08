import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Users, Plus, Loader2, Trash2, Edit, VenetianMask, Printer, Search, Eye } from 'lucide-react'
import { toast } from '../../../components/ui/sonner'
import { getSantriList, createSantri, deleteSantri, updateSantri } from '../../../server-fns/santri'
import { getKelasList } from '../../../server-fns/kelas'
import { getTenantInfo } from '../../../server-fns/admin-settings'
import { impersonateUser } from '../../../server-fns/impersonate'
import { getSurahByJuz, getAyatRangeInJuz } from '../../../lib/quranMapper'
import { Button } from '../../../components/ui/button'
import { RowActionsMenu } from '../../../components/shared/RowActionsMenu'
import { PageHeader } from '../../../components/shared/PageHeader'

export const Route = createFileRoute('/admin/santri/')({
  component: DataSantriPage,
})

function DataSantriPage() {
  const navigate = useNavigate()
  const [santri, setSantri] = useState<any[]>([])
  const [kelasList, setKelasList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nama, setNama] = useState('')
  const [tahapSantri, setTahapSantri] = useState<'tahfidz' | 'iqra'>('tahfidz')
  const [initialTahapSantri, setInitialTahapSantri] = useState<'tahfidz' | 'iqra'>('tahfidz')
  const [jilidIqraTerakhir, setJilidIqraTerakhir] = useState<number | ''>('')
  const [halamanIqraTerakhir, setHalamanIqraTerakhir] = useState<number | ''>('')
  
  const [targetJuz, setTargetJuz] = useState<number>(30)
  const [juzProgress, setJuzProgress] = useState<number[]>([])
  const [batasHafalanJuz, setBatasHafalanJuz] = useState<number | ''>('')
  const [batasHafalanSurah, setBatasHafalanSurah] = useState<string>('')
  const [batasHafalanAyat, setBatasHafalanAyat] = useState<number | ''>('')
  const [hasPosisiTerakhir, setHasPosisiTerakhir] = useState(false)
  const [surahOptions, setSurahOptions] = useState<any[]>([])
  const [ayatMax, setAyatMax] = useState<number>(999)

  const [kelasId, setKelasId] = useState('')
  const [hariMasuk, setHariMasuk] = useState<string[]>([])
  const [minHariMasukSantri, setMinHariMasukSantri] = useState(2)

  const [tipe, setTipe] = useState<'reguler' | 'dewasa'>('dewasa')
  const [email, setEmail] = useState('')
  const [noWa, setNoWa] = useState('')
  const [password, setPassword] = useState('')
  
  const [waliNama, setWaliNama] = useState('')
  const [waliEmail, setWaliEmail] = useState('')
  const [waliNoWa, setWaliNoWa] = useState('')
  const [waliPassword, setWaliPassword] = useState('')
  
  const [submitting, setSubmitting] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTipe, setFilterTipe] = useState<'all' | 'reguler' | 'dewasa'>('all')
  const [filterKelas, setFilterKelas] = useState<string>('all')

  // Impersonate State
  const [impersonateTarget, setImpersonateTarget] = useState<any>(null)
  const [impersonating, setImpersonating] = useState(false)

  async function loadData() {
    setLoading(true)
    const [resSantri, resKelas, resTenant] = await Promise.all([
      getSantriList(),
      getKelasList(),
      getTenantInfo()
    ])
    if (resSantri.success && resSantri.data) setSantri(resSantri.data)
    if (resKelas.success && resKelas.data) setKelasList(resKelas.data)
    if (resTenant.success && resTenant.data) setMinHariMasukSantri(resTenant.data.minHariMasukSantri ?? 2)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (batasHafalanJuz !== '') {
      const juzNum = Number(batasHafalanJuz)
      const surahs = getSurahByJuz(juzNum)
      setSurahOptions(surahs)
      if (!surahs.find(s => s.nama === batasHafalanSurah)) {
        setBatasHafalanSurah(surahs[0]?.nama || '')
      }
      // Auto-uncheck Mutqin
      setJuzProgress(prev => prev.includes(juzNum) ? prev.filter(j => j !== juzNum) : prev)
    } else {
      setSurahOptions([])
      setBatasHafalanSurah('')
      setBatasHafalanAyat('')
    }
  }, [batasHafalanJuz])

  useEffect(() => {
    if (batasHafalanJuz !== '' && batasHafalanSurah) {
      const selected = surahOptions.find(s => s.nama === batasHafalanSurah)
      if (selected) {
        const range = getAyatRangeInJuz(Number(batasHafalanJuz), selected.nomor)
        setAyatMax(range.ayatAkhir)
        if (batasHafalanAyat !== '' && batasHafalanAyat > range.ayatAkhir) {
          setBatasHafalanAyat(range.ayatAkhir)
        }
      }
    }
  }, [batasHafalanSurah, batasHafalanJuz, surahOptions])

  // Sinkronisasi checkbox hariMasuk dengan hariPertemuan kelas terpilih
  useEffect(() => {
    if (kelasId) {
      const kelasTarget = kelasList.find(k => k.id === kelasId);
      if (kelasTarget && kelasTarget.hariPertemuan) {
        setHariMasuk(prev => prev.filter(h => kelasTarget.hariPertemuan.includes(h)));
      }
    } else {
      setHariMasuk([]);
    }
  }, [kelasId, kelasList])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const selectedKelasForSubmit = kelasId ? kelasList.find(k => k.id === kelasId) : null;
    const isMukimSubmit = selectedKelasForSubmit?.tipeKelas === 'reguler';
    const isOnlineSubmit = selectedKelasForSubmit?.tipeKelas === 'online';

    if (kelasId && !isMukimSubmit && !isOnlineSubmit && hariMasuk.length < minHariMasukSantri) {
      toast.warning(`Minimal hari masuk untuk lembaga ini adalah ${minHariMasukSantri} hari. Harap tambahkan hari masuk santri.`);
      return;
    }
    
    // Konfirmasi perubahan tahapSantri jika di mode Edit
    if (editingId && tahapSantri !== initialTahapSantri) {
      if (initialTahapSantri === 'tahfidz' && tahapSantri === 'iqra') {
        if (!confirm('PERINGATAN: Anda mengubah status santri dari Tahfidz menjadi Iqra.\n\nData hafalan sebelumnya (juz, riwayat setoran) TIDAK akan terhapus, tetapi dashboard santri/wali akan berubah menjadi tampilan Iqra.\n\nApakah Anda yakin ingin melanjutkan?')) {
          return;
        }
      } else {
        if (!confirm('Anda mengubah Tahap Santri. Lanjutkan?')) {
          return;
        }
      }
    }

    setSubmitting(true)

    const payload = { 
      data: { 
        nama, 
        tahapSantri,
        jilidIqraTerakhir: tahapSantri === 'iqra' && jilidIqraTerakhir !== '' ? Number(jilidIqraTerakhir) : undefined,
        halamanIqraTerakhir: tahapSantri === 'iqra' && halamanIqraTerakhir !== '' ? Number(halamanIqraTerakhir) : undefined,
        targetJuz: Number(targetJuz), 
        juzProgress: tahapSantri === 'tahfidz' ? juzProgress : [],
        batasHafalanJuz: tahapSantri === 'tahfidz' && batasHafalanJuz !== '' ? Number(batasHafalanJuz) : undefined,
        batasHafalanSurah: tahapSantri === 'tahfidz' && batasHafalanSurah ? batasHafalanSurah : undefined,
        batasHafalanAyat: tahapSantri === 'tahfidz' && batasHafalanAyat !== '' ? Number(batasHafalanAyat) : undefined,
        kelasId: kelasId ? kelasId : undefined,
        hariMasuk: kelasId ? hariMasuk : [],
        tipe,
        email: tipe === 'dewasa' ? (email || undefined) : undefined,
        noWa: tipe === 'dewasa' ? (noWa || undefined) : undefined,
        password: tipe === 'dewasa' ? password : undefined,
        waliNama: tipe === 'reguler' ? (waliNama || undefined) : undefined,
        waliEmail: tipe === 'reguler' ? (waliEmail || undefined) : undefined,
        waliNoWa: tipe === 'reguler' ? (waliNoWa || undefined) : undefined,
        waliPassword: tipe === 'reguler' ? (waliPassword || undefined) : undefined
      } 
    }
    
    let res;
    if (editingId) {
      res = await updateSantri({ data: { ...payload.data, id: editingId } })
    } else {
      res = await createSantri(payload)
    }
    
    if (res.success) {
      toast.success(res.message || 'Berhasil menyimpan data')
      handleCloseForm()
      loadData()
    } else {
      toast.error(res.error?.message || 'Gagal')
    }
    setSubmitting(false)
  }

  const handleEdit = (s: any) => {
    setEditingId(s.id)
    setHasPosisiTerakhir(s.posisiTerakhir !== null && s.posisiTerakhir !== undefined)
    setNama(s.nama)
    setTahapSantri(s.tahapSantri || 'tahfidz')
    setInitialTahapSantri(s.tahapSantri || 'tahfidz')
    setJilidIqraTerakhir(s.jilidIqraTerakhir || '')
    setHalamanIqraTerakhir(s.halamanIqraTerakhir === 0 ? 0 : (s.halamanIqraTerakhir || ''))
    
    setTargetJuz(s.targetJuz)
    setJuzProgress(s.juzProgress || [])
    setBatasHafalanJuz(s.batasHafalanJuz || '')
    // batasHafalanSurah will be set after useEffect triggers from batasHafalanJuz, so we setTimeout
    setTimeout(() => {
      setBatasHafalanSurah(s.batasHafalanSurah || '')
      setTimeout(() => {
        setBatasHafalanAyat(s.batasHafalanAyat || '')
      }, 50)
    }, 50)
    
    setKelasId(s.kelasId || '')
    setHariMasuk(s.hariMasuk || [])
    setTipe(s.tipe || 'dewasa')
    setEmail(s.email || '')
    setNoWa(s.noWa || '')
    setPassword('') // Optional when editing
    
    setWaliNama(s.waliNama || '')
    setWaliEmail(s.waliEmail || '')
    setWaliNoWa(s.waliNoWa || '')
    setWaliPassword('') // Optional when editing
    
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingId(null)
    setHasPosisiTerakhir(false)
    setNama('')
    setTahapSantri('tahfidz')
    setInitialTahapSantri('tahfidz')
    setJilidIqraTerakhir('')
    setHalamanIqraTerakhir('')
    setTargetJuz(30)
    setJuzProgress([])
    setBatasHafalanJuz('')
    setBatasHafalanSurah('')
    setBatasHafalanAyat('')
    setKelasId('')
    setHariMasuk([])
    setTipe('dewasa')
    setEmail('')
    setNoWa('')
    setPassword('')
    setWaliNama('')
    setWaliEmail('')
    setWaliNoWa('')
    setWaliPassword('')
  }

  const handleDelete = async (id: string) => {
    // confirm() dihapus — AlertDialog dari RowActionsMenu menangani konfirmasi sebelum handler ini dipanggil
    const res = await deleteSantri({ data: { id } })
    if (res.success) {
      toast.success("Santri berhasil dihapus")
      loadData()
    } else {
      toast.error(res.error?.message || 'Gagal menghapus')
    }
  }

  const handleImpersonate = async () => {
    if (!impersonateTarget) return
    setImpersonating(true)
    const targetRole = impersonateTarget.tipe === 'dewasa' ? 'santri' : 'wali'
    const res = await impersonateUser({ data: { targetRole, targetId: impersonateTarget.id } })
    setImpersonating(false)
    if (res.success && res.data?.redirectUrl) {
      window.location.href = res.data.redirectUrl
    } else {
      toast.error((res as any).error?.message || 'Gagal memulai mode menyamar')
    }
    setImpersonateTarget(null)
  }

  return (
    <div className="space-y-6 max-w-5xl font-sans">
      <PageHeader
        title="Data Santri"
        description="Kelola master data peserta didik."
        action={
          <Button onClick={() => { handleCloseForm(); setShowForm(!showForm) }}>
            <Plus className="w-4 h-4 mr-2" /> Tambah Santri
          </Button>
        }
      />

      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-lg mb-4">{editingId ? 'Edit Santri' : 'Form Tambah Santri'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1">Nama Lengkap</label>
              <input required value={nama} onChange={e => setNama(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="Nama Santri" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tahap Santri</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="tahfidz" checked={tahapSantri === 'tahfidz'} onChange={() => setTahapSantri('tahfidz')} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500" />
                  <span>Tahfidz (Hafalan Qur'an)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="iqra" checked={tahapSantri === 'iqra'} onChange={() => setTahapSantri('iqra')} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500" />
                  <span>Iqra (Tahsin Dasar)</span>
                </label>
              </div>
            </div>

            {tahapSantri === 'tahfidz' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Target Hafalan (Juz)</label>
                  <input required type="number" min={1} max={30} value={targetJuz} onChange={e => setTargetJuz(Number(e.target.value))} className="w-full border p-2 rounded-lg" />
                </div>
                
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Juz yang Telah Selesai (Mutqin)</label>
                <div className="flex flex-wrap gap-1">
                  {Array.from({length: 30}, (_, i) => i + 1).map(j => (
                    <button 
                      key={j} type="button" 
                      onClick={() => {
                        if (editingId) return; // READ-ONLY untuk data berjalan
                        setJuzProgress(prev => prev.includes(j) ? prev.filter(x => x !== j) : [...prev, j].sort((a,b)=>b-a))
                      }}
                      className={`h-10 w-10 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${
                        juzProgress.includes(j) 
                          ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90' 
                          : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                      } ${editingId ? 'opacity-70 cursor-not-allowed' : ''}`}
                      disabled={!!editingId}
                      title={editingId ? "Juz progress otomatis diupdate dari histori riwayat setoran" : ""}
                    >
                      {j}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <label className="block text-sm font-medium mb-2">Batas Hafalan Saat Ini (Parsial/Opsional)</label>
                <div className="grid grid-cols-3 gap-2">
                  <select 
                    value={batasHafalanJuz} 
                    onChange={e => setBatasHafalanJuz(e.target.value ? Number(e.target.value) : '')} 
                    disabled={hasPosisiTerakhir}
                    title={hasPosisiTerakhir ? "Batas hafalan tidak dapat diubah dari sini karena santri sudah memiliki progres riwayat hafalan berjalan. Edit riwayat hafalan terakhir untuk mengoreksi." : ""}
                    className={`border p-2 rounded-lg text-sm ${hasPosisiTerakhir ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
                  >
                    <option value="">Pilih Juz</option>
                    {Array.from({length: 30}, (_, i) => i + 1).map(j => (
                      <option key={j} value={j}>Juz {j}</option>
                    ))}
                  </select>

                  <select 
                    value={batasHafalanSurah} 
                    onChange={e => setBatasHafalanSurah(e.target.value)} 
                    disabled={batasHafalanJuz === '' || hasPosisiTerakhir} 
                    className={`border p-2 rounded-lg text-sm ${batasHafalanJuz === '' || hasPosisiTerakhir ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
                  >
                    <option value="">Pilih Surah</option>
                    {surahOptions.map(s => (
                      <option key={s.nomor} value={s.nama}>{s.nama}</option>
                    ))}
                  </select>

                  <input 
                    type="number" 
                    placeholder="Ayat Terakhir" 
                    min={1} 
                    max={ayatMax}
                    value={batasHafalanAyat} 
                    onChange={e => setBatasHafalanAyat(e.target.value ? Number(e.target.value) : '')} 
                    disabled={batasHafalanJuz === '' || !batasHafalanSurah || hasPosisiTerakhir}
                    className={`border p-2 rounded-lg text-sm ${batasHafalanJuz === '' || !batasHafalanSurah || hasPosisiTerakhir ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`} 
                  />
                </div>
              </div>
            </div>
          </>
        )}

            {tahapSantri === 'iqra' && (
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-4">
                <label className="block text-sm font-medium mb-2">Posisi Iqra Awal (Opsional, khusus santri pindahan)</label>
                <div className="grid grid-cols-2 gap-2">
                  <select 
                    value={jilidIqraTerakhir} 
                    onChange={e => setJilidIqraTerakhir(e.target.value ? Number(e.target.value) : '')} 
                    className="border p-2 rounded-lg text-sm bg-white"
                    disabled={!!editingId}
                  >
                    <option value="">Pilih Jilid Iqra</option>
                    {[1,2,3,4,5,6].map(j => (
                      <option key={j} value={j}>Jilid {j}</option>
                    ))}
                  </select>
                  <input 
                    type="number" 
                    placeholder="Halaman Terakhir" 
                    min={0} 
                    max={50}
                    value={halamanIqraTerakhir} 
                    onChange={e => setHalamanIqraTerakhir(e.target.value ? Number(e.target.value) : '')} 
                    disabled={!!editingId || jilidIqraTerakhir === ''}
                    className="border p-2 rounded-lg text-sm" 
                  />
                </div>
                {editingId && (
                  <p className="text-xs text-amber-600 mt-2">
                    Posisi Iqra awal tidak dapat diubah setelah data tersimpan.
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Pilih Kelas / Halaqoh</label>
              <select value={kelasId} onChange={e => setKelasId(e.target.value)} className="w-full border p-2 rounded-lg bg-white">
                <option value="">-- Belum Masuk Kelas --</option>
                {kelasList.map(k => (
                  <option key={k.id} value={k.id}>{k.nama} (Ust. {k.ustadzNama || '-'})</option>
                ))}
              </select>
            </div>

            {(() => {
              const selectedKelas = kelasList.find(k => k.id === kelasId);
              const isMukim = selectedKelas?.tipeKelas === 'reguler';
              const isOnline = selectedKelas?.tipeKelas === 'online';

              return (
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-4">
                  <label className="block text-sm font-medium mb-1 flex justify-between items-center">
                    <span>Hari Masuk (Jadwal Kehadiran Santri)</span>
                    {kelasId && !isMukim && !isOnline && <span className="text-xs text-slate-500 font-normal">Minimal {minHariMasukSantri} Hari</span>}
                  </label>
                  
                  {!kelasId ? (
                    <div className="text-sm font-medium text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                      Pilih Kelompok (Kelas) terlebih dahulu untuk mengatur hari masuk.
                    </div>
                  ) : isMukim ? (
                    <div className="text-sm font-medium text-indigo-700 bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                      ℹ️ Kelas ini bersifat mukim — santri dianggap hadir setiap hari (7 hari penuh).
                    </div>
                  ) : isOnline ? (
                    <div className="text-sm font-medium text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                      ℹ️ Kelas Online — tidak memiliki kewajiban absensi / jadwal hari masuk.
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {selectedKelas.hariPertemuan.map((hari: string) => {
                          const HARI_LABEL: Record<string, string> = {
                            senin: 'Senin', selasa: 'Selasa', rabu: 'Rabu', 
                            kamis: 'Kamis', jumat: 'Jumat', sabtu: 'Sabtu', minggu: 'Minggu'
                          };
                          return (
                            <label key={hari} className="flex items-center gap-2 cursor-pointer bg-white border border-slate-200 p-2 rounded-lg hover:bg-slate-50">
                              <input 
                                type="checkbox" 
                                checked={hariMasuk.includes(hari)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setHariMasuk(prev => [...prev, hari]);
                                  } else {
                                    setHariMasuk(prev => prev.filter(h => h !== hari));
                                  }
                                }}
                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded border-slate-300" 
                              />
                              <span className="text-sm capitalize">{HARI_LABEL[hari] || hari}</span>
                            </label>
                          )
                        })}
                      </div>
                      {hariMasuk.length < minHariMasukSantri && (
                        <p className="text-xs text-amber-600 mt-2">
                          ⚠️ Peringatan: Anda baru memilih {hariMasuk.length} hari. Minimal yang diizinkan lembaga adalah {minHariMasukSantri} hari.
                        </p>
                      )}
                    </>
                  )}
                </div>
              );
            })()}

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
                {tipe === 'dewasa' ? 'Silakan isi Username dan Password untuk login mandiri Santri.' : 'Santri Reguler terhubung ke akun Wali Santri (Orang Tua).'}
              </p>
            </div>

            {tipe === 'dewasa' && (
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-4">
                <div className="text-sm font-medium text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                  ⚠️ Santri Dewasa wajib mengisi minimal salah satu identitas (Email atau No. WA) untuk login.
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email (Opsional)</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border p-2 rounded-lg bg-white" placeholder="Cth: fulan@gmail.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">No WhatsApp (Opsional)</label>
                  <input value={noWa} onChange={e => setNoWa(e.target.value)} className="w-full border p-2 rounded-lg bg-white" placeholder="Cth: 081234567" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password Login {editingId && <span className="text-slate-500 font-normal">(Kosongkan jika tidak diubah)</span>}</label>
                  <input required={tipe === 'dewasa' && !editingId} type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full border p-2 rounded-lg bg-white" placeholder="Minimal 4 karakter" />
                </div>
              </div>
            )}

            {tipe === 'reguler' && (
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-4">
                <div className="text-sm font-medium text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
                  ℹ️ Data Wali / Orang Tua (Opsional). Jika diisi, Wali bisa login untuk memantau hafalan anak secara real-time.
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nama Wali</label>
                  <input type="text" value={waliNama} onChange={e => setWaliNama(e.target.value)} className="w-full border p-2 rounded-lg bg-white" placeholder="Nama Orang Tua / Wali" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email Wali (Opsional)</label>
                  <input type="email" value={waliEmail} onChange={e => setWaliEmail(e.target.value)} className="w-full border p-2 rounded-lg bg-white" placeholder="Cth: wali@gmail.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">No WhatsApp Wali (Opsional)</label>
                  <input type="text" value={waliNoWa} onChange={e => setWaliNoWa(e.target.value)} className="w-full border p-2 rounded-lg bg-white" placeholder="Cth: 081234567" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password Login {editingId && <span className="text-slate-500 font-normal">(Kosongkan jika tidak diubah)</span>}</label>
                  <input type="text" value={waliPassword} onChange={e => setWaliPassword(e.target.value)} className="w-full border p-2 rounded-lg bg-white" placeholder="Minimal 4 karakter" />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleCloseForm}>Batal</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Simpan
              </Button>
            </div>
          </form>
        </div>
      )}

      {impersonateTarget && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Konfirmasi Mode Menyamar</h3>
            <p className="text-slate-600 mb-6">
              Anda akan masuk ke dashboard sebagai <strong>{impersonateTarget.tipe === 'dewasa' ? impersonateTarget.nama : impersonateTarget.waliNama || 'Wali'}</strong> ({impersonateTarget.tipe === 'dewasa' ? 'Santri' : 'Wali'}). Anda dapat kembali ke mode Admin kapan saja melalui banner di atas layar. Lanjutkan?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setImpersonateTarget(null)} disabled={impersonating}>Batal</Button>
              <Button className="bg-warning text-warning-foreground hover:bg-warning/90" onClick={handleImpersonate} disabled={impersonating}>
                {impersonating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <VenetianMask className="w-4 h-4 mr-2" />}
                Ya, Lanjutkan
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari nama santri..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={filterTipe}
              onChange={e => setFilterTipe(e.target.value as any)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white w-full sm:w-auto"
            >
              <option value="all">Semua Tipe</option>
              <option value="dewasa">Dewasa / Online</option>
              <option value="reguler">Reguler (Anak)</option>
            </select>
            <select
              value={filterKelas}
              onChange={e => setFilterKelas(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white w-full sm:w-auto"
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] whitespace-nowrap">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nama Santri</th>
                  <th className="px-4 py-3">Tipe</th>
                  <th className="px-4 py-3">Kelas</th>
                  <th className="px-4 py-3">Hafalan Awal</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
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
                    <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                            <Users className="w-4 h-4" />
                          </div>
                          <Link to="/admin/santri/$santriId" params={{ santriId: s.id }} className="font-semibold text-slate-800 hover:text-emerald-600 hover:underline">
                            {s.nama}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <div className="flex flex-wrap gap-1">
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                              s.tipe === 'dewasa'
                                ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                : 'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}>
                              {s.tipe === 'dewasa' ? 'Dewasa' : 'Reguler'}
                            </span>
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                              s.tahapSantri === 'tahfidz'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {s.tahapSantri === 'tahfidz' ? 'Tahfidz' : 'Iqra'}
                            </span>
                          </div>
                          {s.tipe === 'dewasa' && s.noWa && (
                            <span className="text-[10px] text-slate-500 mt-1">
                              WA: {s.noWa}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-700">
                            {s.kelasNama ?? <span className="text-slate-400 italic">-</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5 text-xs">
                          {s.juzProgress && s.juzProgress.length > 0 ? (
                            <span className="font-semibold text-emerald-600">
                              Selesai: {s.juzProgress.length} Juz ({s.juzProgress.slice().sort((a: number, b: number)=>b-a).join(', ')})
                            </span>
                          ) : <span className="text-slate-400 italic">Belum ada setoran</span>}
                          <span className="text-slate-500">
                            Batas: {s.batasHafalanJuz ? `Juz ${s.batasHafalanJuz}` : '-'}
                            {s.batasHafalanSurah && ` (${s.batasHafalanSurah} ayat ${s.batasHafalanAyat || '-'})`}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        {s.targetJuz} Juz
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end items-center gap-1">
                          {/* Menyamar: Untuk dewasa (Santri) atau reguler yang punya Wali */}
                          {(s.tipe === 'dewasa' || (s.tipe === 'reguler' && s.waliNama)) && (
                            <Button onClick={() => setImpersonateTarget(s)} variant="ghost" size="icon-sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50" title={s.tipe === 'dewasa' ? "Mode Menyamar (Akses sebagai Santri)" : "Mode Menyamar (Akses sebagai Wali)"}>
                              <VenetianMask className="w-4 h-4" />
                            </Button>
                          )}
                          {/* Cetak Rapor: tetap ikon visible — aksi navigasi primer */}
                          <Link to="/admin/rapor/$santriId" params={{ santriId: s.id }}>
                            <Button variant="ghost" size="icon-sm" className="text-slate-500 hover:text-slate-900" title="Cetak Rapor" aria-label="Cetak Rapor">
                              <Printer className="w-4 h-4" />
                            </Button>
                          </Link>
                          {/* Edit + Hapus masuk dropdown (AlertDialog konfirmasi untuk Hapus) */}
                          <RowActionsMenu
                            actions={[
                              {
                                label: "Lihat Detail",
                                icon: Eye,
                                onClick: () => navigate({ to: '/admin/santri/$santriId', params: { santriId: s.id } }),
                              },
                              {
                                label: "Edit",
                                icon: Edit,
                                onClick: () => handleEdit(s),
                              },
                              {
                                label: "Hapus",
                                icon: Trash2,
                                onClick: () => handleDelete(s.id),
                                variant: "destructive",
                                entityName: s.nama,
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
          </div>
        )}
      </div>
    </div>
  )
}

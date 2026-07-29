import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Loader2, AlertTriangle } from 'lucide-react'
import { koreksiPosisiHafalan } from '../server-fns/santri'
import { getSurahByJuz, getAyatRangeInJuz } from '../lib/quranMapper'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface KoreksiPosisiModalProps {
  isOpen: boolean
  onClose: () => void
  santri: any
  onSuccess: () => void
}

export function KoreksiPosisiModal({ isOpen, onClose, santri, onSuccess }: KoreksiPosisiModalProps) {
  const [batasHafalanJuz, setBatasHafalanJuz] = useState<number | ''>('')
  const [batasHafalanSurah, setBatasHafalanSurah] = useState<string>('')
  const [batasHafalanAyat, setBatasHafalanAyat] = useState<number | ''>('')
  const [catatan, setCatatan] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [surahOptions, setSurahOptions] = useState<any[]>([])
  const [ayatMax, setAyatMax] = useState<number>(999)

  // Initialize from santri when modal opens
  useEffect(() => {
    if (isOpen && santri) {
      setBatasHafalanJuz(santri.batasHafalanJuz || '')
      setBatasHafalanSurah(santri.batasHafalanSurah || '')
      setBatasHafalanAyat(santri.batasHafalanAyat || '')
      setCatatan('')
      setError(null)
    }
  }, [isOpen, santri])

  // Hitung ulang opsi surah berdasarkan juz yang dipilih
  useEffect(() => {
    if (batasHafalanJuz !== '') {
      const surahs = getSurahByJuz(Number(batasHafalanJuz))
      setSurahOptions(surahs)
      
      // Jika surah yang saat ini terpilih tidak ada di juz ini, reset
      if (batasHafalanSurah && !surahs.find(s => s.nama === batasHafalanSurah)) {
        setBatasHafalanSurah('')
      }
    } else {
      setSurahOptions([])
      setBatasHafalanSurah('')
    }
  }, [batasHafalanJuz])

  // Hitung ulang range ayat max berdasarkan surah & juz terpilih
  useEffect(() => {
    if (batasHafalanJuz !== '' && batasHafalanSurah) {
      const selected = surahOptions.find(s => s.nama === batasHafalanSurah)
      if (selected) {
        const range = getAyatRangeInJuz(Number(batasHafalanJuz), selected.nomor)
        if (range) {
          setAyatMax(range.ayatAkhir)
          if (batasHafalanAyat !== '' && Number(batasHafalanAyat) > range.ayatAkhir) {
             setBatasHafalanAyat(range.ayatAkhir)
          }
        }
      }
    }
  }, [batasHafalanSurah, batasHafalanJuz, surahOptions])

  const handleSubmit = async () => {
    if (!santri) return

    try {
      setIsSubmitting(true)
      setError(null)
      
      await koreksiPosisiHafalan({
        data: {
          santriId: santri.id,
          batasHafalanJuz: batasHafalanJuz !== '' ? Number(batasHafalanJuz) : null,
          batasHafalanSurah: batasHafalanSurah || null,
          batasHafalanAyat: batasHafalanAyat !== '' ? Number(batasHafalanAyat) : null,
          catatan: catatan.trim() || undefined,
        }
      })
      
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Gagal menyimpan koreksi posisi')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[425px] flex flex-col my-auto relative">
        <div className="p-6 pb-0">
          <h2 className="text-lg font-semibold leading-none tracking-tight">Koreksi Posisi Hafalan</h2>
          <p className="text-sm text-slate-500 mt-2">
            Sesuaikan posisi hafalan santri saat ini.
          </p>
        </div>

        <div className="p-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 text-amber-800 text-sm mb-4">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <p>
              <strong>Perhatian:</strong> Mengubah posisi ini akan mengoreksi titik awal "Surat Mulai" setoran berikutnya dan mereset kalkulasi Pacing serta Estimasi Khatam.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="space-y-3">
              <label className="text-sm font-medium">Titik Posisi Terakhir (Batas Hafalan):</label>
              <div className="grid grid-cols-3 gap-2">
                <select 
                  value={batasHafalanJuz} 
                  onChange={e => setBatasHafalanJuz(e.target.value ? Number(e.target.value) : '')} 
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="">Pilih Juz</option>
                  {Array.from({length: 30}, (_, i) => i + 1).map(j => (
                    <option key={j} value={j}>Juz {j}</option>
                  ))}
                </select>

                <select 
                  value={batasHafalanSurah} 
                  onChange={e => setBatasHafalanSurah(e.target.value)} 
                  disabled={batasHafalanJuz === ''} 
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background disabled:opacity-50"
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
                  disabled={batasHafalanJuz === '' || !batasHafalanSurah}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background disabled:opacity-50" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Catatan Alasan Koreksi (Opsional):</label>
              <textarea
                className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background"
                placeholder="Contoh: Koreksi penyesuaian karena admin salah input"
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
                rows={2}
              />
            </div>

            {santri?.posisiTerakhirUpdatedAt && (
              <div className="text-xs text-slate-500 mt-2 border-t pt-3">
                Koreksi terakhir pada {format(new Date(santri.posisiTerakhirUpdatedAt), 'dd MMM yyyy, HH:mm', { locale: id })}
                {santri.posisiTerakhirUpdateNote && <span> dengan catatan: "{santri.posisiTerakhirUpdateNote}"</span>}
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500 font-medium">{error}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-0">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Batal</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Simpan Koreksi
          </Button>
        </div>
      </div>
    </div>
  )
}
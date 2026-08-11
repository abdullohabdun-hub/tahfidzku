import { useState } from 'react'
import { Palette, Upload, Loader2, Save, Check, Image as ImageIcon } from 'lucide-react'
import { THEME_PRESETS, hexToOklch, SYSTEM_DEFAULT_HEX } from '../../lib/theme-utils'
import { updateTenantTheme, uploadTenantLogo } from '../../server-fns/tenant-theme'
import { Button } from '../ui/button'
import { toast } from '../ui/sonner'

interface VisualIdentitySettingsProps {
  initialThemeColor?: string
  initialThemePreset?: string | null
  initialLogoUrl?: string | null
  onThemeUpdated?: (newColor: string, newLogoUrl: string | null) => void
}

export function VisualIdentitySettings({
  initialThemeColor = SYSTEM_DEFAULT_HEX,
  initialThemePreset = null,
  initialLogoUrl = null,
  onThemeUpdated,
}: VisualIdentitySettingsProps) {
  const [selectedColor, setSelectedColor] = useState<string>(initialThemeColor)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(initialThemePreset)
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl)

  const [savingTheme, setSavingTheme] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null)

  const handlePresetSelect = (presetName: string, hex: string) => {
    setSelectedPreset(presetName)
    setSelectedColor(hex)
  }

  const handleCustomColorChange = (hex: string) => {
    setSelectedPreset(null)
    setSelectedColor(hex)
  }

  const handleSaveTheme = async () => {
    setSavingTheme(true)
    try {
      const res = await updateTenantTheme({
        data: {
          themeColor: selectedColor,
          themePreset: selectedPreset,
        },
      })

      if (res.success) {
        toast.success('Berhasil memperbarui tema warna lembaga')
        // Safe inject real-time ke document element
        document.documentElement.style.setProperty('--primary', hexToOklch(selectedColor))
        document.documentElement.style.setProperty('--sidebar-primary', hexToOklch(selectedColor))
        if (onThemeUpdated) onThemeUpdated(selectedColor, logoUrl)
      } else {
        toast.error(res.error.message || 'Gagal menyimpan tema')
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan tema')
    } finally {
      setSavingTheme(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Tipe file tidak valid. Hanya PNG, JPEG, dan WebP yang diizinkan (SVG ditolak demi keamanan).')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file logo terlalu besar. Maksimal 2MB.')
      return
    }

    setSelectedFile(file)
    setPreviewFileUrl(URL.createObjectURL(file))
  }

  const handleUploadLogo = async () => {
    if (!selectedFile) return

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const res = await uploadTenantLogo({ data: formData })
      if (res.success) {
        setLogoUrl(res.data.logoUrl)
        setPreviewFileUrl(null)
        setSelectedFile(null)
        toast.success('Logo lembaga berhasil diunggah')
        if (onThemeUpdated) onThemeUpdated(selectedColor, res.data.logoUrl)
      } else {
        toast.error(res.error.message || 'Gagal mengunggah logo')
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat mengunggah logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mt-8">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
        <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center">
          <Palette className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-slate-800">Identitas Visual Lembaga</h3>
          <p className="text-xs text-slate-500">Sesuaikan warna tema dan logo lembaga untuk dashboard & PWA.</p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* SECTION 1: Pilihan Warna Tema */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-semibold text-slate-700 block">Warna Tema Lembaga</label>
              <p className="text-xs text-slate-500">Pilih dari preset warna teruji kontrasnya (WCAG AA) atau pakai warna custom.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500 uppercase font-semibold">{selectedColor}</span>
              <div
                className="w-6 h-6 rounded-md border border-slate-200 shadow-2xs"
                style={{ backgroundColor: selectedColor }}
              />
            </div>
          </div>

          {/* Grid Preset Warna */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {THEME_PRESETS.map((preset) => {
              const isSelected = selectedPreset === preset.name || (!selectedPreset && selectedColor === preset.hex)
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handlePresetSelect(preset.name, preset.hex)}
                  className={`relative flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-slate-800 ring-2 ring-slate-800/10 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-md shrink-0 flex items-center justify-center text-white shadow-2xs"
                    style={{ backgroundColor: preset.hex }}
                  >
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 truncate">{preset.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{preset.hex}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Opsi Custom Color */}
          <div className="pt-2 flex items-center gap-3">
            <div className="relative flex items-center gap-2 border border-slate-200 p-2 rounded-lg bg-slate-50/50">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                className="w-8 h-8 rounded border-0 cursor-pointer p-0 bg-transparent"
              />
              <span className="text-xs font-medium text-slate-700">Warna Custom (Picker)</span>
            </div>

            {/* Live Preview Box */}
            <div
              className="flex-1 p-3 rounded-lg text-white font-medium text-xs flex items-center justify-between shadow-2xs transition-colors"
              style={{ backgroundColor: selectedColor }}
            >
              <span>Preview Kontras Teks</span>
              <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-semibold">Teks Putih</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveTheme} disabled={savingTheme} className="h-10 px-6">
              {savingTheme ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Simpan Warna Tema
            </Button>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* SECTION 2: Upload Logo */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 block">Logo Lembaga (PWA & Branding)</label>
            <p className="text-xs text-slate-500">
              Unggah logo lembaga dalam format PNG, JPEG, atau WebP (maksimal 2MB). Disarankan rasio 1:1 (persegi).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            {/* Preview Logo */}
            <div className="w-24 h-24 rounded-lg border border-slate-200 bg-white flex items-center justify-center p-2 shrink-0 shadow-2xs overflow-hidden">
              {previewFileUrl || logoUrl ? (
                <img
                  src={previewFileUrl || (logoUrl as string)}
                  alt="Logo Lembaga"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-center text-slate-400">
                  <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                  <span className="text-[10px] block">Belum ada logo</span>
                </div>
              )}
            </div>

            <div className="space-y-3 flex-1">
              <input
                type="file"
                id="tenant-logo-input"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex flex-wrap gap-2">
                <label
                  htmlFor="tenant-logo-input"
                  className="cursor-pointer inline-flex items-center px-4 py-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <Upload className="w-4 h-4 mr-2 text-slate-500" />
                  {logoUrl || previewFileUrl ? 'Pilih Logo Baru' : 'Pilih File Logo'}
                </label>

                {selectedFile && (
                  <Button
                    type="button"
                    onClick={handleUploadLogo}
                    disabled={uploadingLogo}
                    className="h-9 px-4 text-xs"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Save className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Unggah Logo Sekarang
                  </Button>
                )}
              </div>

              {selectedFile && (
                <p className="text-xs text-emerald-600 font-medium">
                  File terpilih: <span className="font-mono">{selectedFile.name}</span> ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
              {!selectedFile && logoUrl && (
                <p className="text-[11px] text-slate-400 truncate max-w-md">URL: {logoUrl}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

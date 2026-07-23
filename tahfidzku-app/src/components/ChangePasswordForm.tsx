import { useState } from 'react'
import { KeyRound, Eye, EyeOff, Loader2, Save, ChevronDown } from 'lucide-react'
import { Button } from './ui/button'
import { changePassword } from '../server-fns/auth'
import type { Role } from '../lib/constants'

export function ChangePasswordForm({ role }: { role: Role }) {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const minLength = (role === 'admin' || role === 'ustadz') ? 8 : 4

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (newPassword !== confirmPassword) {
      setError('Password baru dan konfirmasi tidak cocok.')
      return
    }

    if (newPassword.length < minLength) {
      setError(`Password baru minimal ${minLength} karakter.`)
      return
    }

    setLoading(true)
    try {
      const res = await changePassword({ data: { oldPassword, newPassword } })
      if (res.success) {
        setSuccess('Password berhasil diubah!')
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setError(res.error?.message || 'Gagal mengubah password.')
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-6">
      <div 
        className="p-4 border-b border-slate-50 flex items-center justify-between gap-3 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center border border-amber-100">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-left">Keamanan Akun</h3>
            <p className="text-xs text-slate-500">Ubah password Anda untuk menjaga keamanan.</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {isOpen && (
      <form onSubmit={handleSubmit} className="p-5 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 font-medium">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg border border-emerald-100 font-medium">
            {success}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Password Lama</label>
          <div className="relative">
            <input
              type={showOld ? 'text' : 'password'}
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full border border-slate-300 p-2.5 rounded-xl pr-10 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Masukkan password saat ini"
            />
            <button
              type="button"
              onClick={() => setShowOld(!showOld)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Password Baru</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-slate-300 p-2.5 rounded-xl pr-10 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder={`Minimal ${minLength} karakter`}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Konfirmasi Password Baru</label>
          <input
            type={showNew ? 'text' : 'password'}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-slate-300 p-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            placeholder="Ulangi password baru"
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 shadow-md hover:shadow-lg transition-all">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {loading ? 'Menyimpan...' : 'Simpan Password'}
        </Button>
      </form>
      )}
    </div>
  )
}

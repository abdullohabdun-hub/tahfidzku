import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import { BookOpen, Building2, User, Key, Phone, Loader2, ArrowRight, CheckCircle2, XCircle } from 'lucide-react'
import { registerLembaga, checkSlugAvailability } from '../server-fns/register'
import { Button } from '../components/ui/button'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  // Form State
  const [namaLembaga, setNamaLembaga] = useState('')
  const [slug, setSlug] = useState('')
  const [adminNama, setAdminNama] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminUsername, setAdminUsername] = useState('')
  const [adminNoWa, setAdminNoWa] = useState('')
  const [password, setPassword] = useState('')
  const [botField, setBotField] = useState('')

  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [slugError, setSlugError] = useState('')

  // Auto-generate slug when namaLembaga changes
  useEffect(() => {
    if (namaLembaga) {
      const generated = namaLembaga
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
      setSlug(generated)
    } else {
      setSlug('')
    }
  }, [namaLembaga])

  // Debounced check for slug
  useEffect(() => {
    if (!slug) {
      setSlugStatus('idle')
      setSlugError('')
      return
    }
    setSlugStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const isAvailable = await checkSlugAvailability({ data: slug })
        if (isAvailable) {
          setSlugStatus('available')
          setSlugError('')
        } else {
          setSlugStatus('taken')
          setSlugError('URL ini sudah dipakai lembaga lain.')
        }
      } catch {
        setSlugStatus('idle')
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    try {
      const res = await registerLembaga({
        data: {
          namaLembaga,
          slug,
          adminNama,
          adminEmail,
          adminUsername,
          adminNoWa,
          password,
          botField,
        }
      })

      if (res.success) {
        setIsSuccess(true)
      } else {
        setErrorMsg(res.error?.message || 'Terjadi kesalahan saat pendaftaran.')
      }
    } catch (err: any) {
      setErrorMsg('Gagal terhubung ke server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6 hover:opacity-80 transition-opacity">
          <div className="bg-emerald-600 p-2 rounded-xl shadow-sm">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <span className="font-extrabold text-3xl tracking-tight text-emerald-950">TahfidzKu</span>
        </Link>
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">
          Daftarkan Lembaga Anda
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Atau{' '}
          <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors">
            masuk ke akun yang sudah ada
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[500px]">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          {isSuccess ? (
            <div className="py-12 px-4 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-6">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Pendaftaran Berhasil!</h2>
              <p className="text-slate-600 mb-8 max-w-sm mx-auto leading-relaxed">
                Terima kasih telah mendaftarkan lembaga Anda. Permohonan Anda saat ini sedang kami tinjau. 
                Kami akan menghubungi Anda melalui WhatsApp atau Email maksimal dalam waktu 1x24 jam.
              </p>
              <Link to="/">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 rounded-xl">
                  Kembali ke Beranda
                </Button>
              </Link>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              
              {/* Informasi Lembaga */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b">Informasi Lembaga</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Nama Lembaga</label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={namaLembaga}
                        onChange={e => setNamaLembaga(e.target.value)}
                        placeholder="Pesantren Al-Kautsar"
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-shadow"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700">
                      Slug / URL Unik <span className="text-slate-400 font-normal">(Tanpa spasi)</span>
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type="text"
                        required
                        value={slug}
                        onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="al-kautsar"
                        className={`block w-full pr-10 pl-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-shadow ${slugStatus === 'taken' ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300'}`}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        {slugStatus === 'checking' && <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />}
                        {slugStatus === 'available' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        {slugStatus === 'taken' && <XCircle className="h-4 w-4 text-red-500" />}
                      </div>
                    </div>
                    {slugError && <p className="mt-1 text-xs text-red-500">{slugError}</p>}
                    {slugStatus === 'available' && <p className="mt-1 text-xs text-emerald-600">URL tersedia!</p>}
                  </div>
                </div>
              </div>

              {/* Honeypot field (hidden from users, visible to bots) */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input type="text" id="website" name="website" tabIndex={-1} value={botField} onChange={e => setBotField(e.target.value)} />
              </div>

              {/* Informasi Pengurus Utama */}
              <div className="pt-4">
                <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b">Informasi Pengurus Utama (Admin)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Nama Lengkap</label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={adminNama}
                        onChange={e => setAdminNama(e.target.value)}
                        placeholder="Budi Santoso"
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-shadow"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Alamat Email <span className="text-slate-400 font-normal">(Untuk notifikasi)</span></label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        required
                        value={adminEmail}
                        onChange={e => setAdminEmail(e.target.value)}
                        placeholder="budi@example.com"
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-shadow"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">Username</label>
                      <div className="mt-1">
                        <input
                          type="text"
                          required
                          value={adminUsername}
                          onChange={e => setAdminUsername(e.target.value.toLowerCase())}
                          placeholder="budisantoso"
                          className="block w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-shadow"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">No. WhatsApp</label>
                      <div className="mt-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          type="tel"
                          required
                          value={adminNoWa}
                          onChange={e => setAdminNoWa(e.target.value)}
                          placeholder="08123456789"
                          className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-shadow"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Kata Sandi</label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Key className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-shadow"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="rounded-xl bg-red-50 p-4 border border-red-100">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{errorMsg}</h3>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-6 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      Daftar Sekarang <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
              
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

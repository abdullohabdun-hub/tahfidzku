import { createFileRoute, redirect, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { checkAuth, login } from '../server-fns/auth'
import { resolveTenantContextServer } from '../server-fns/tenant-domain'
import { BookOpen, Shield, Smartphone, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button, buttonVariants } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { cn } from "../lib/utils"

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const user = await checkAuth()

    // Jika user sudah login, langsung arahkan ke dashboard masing-masing
    if (user) {
      if ((user as any).isSuperAdmin) {
        throw redirect({ to: '/superadmin' })
      }
      switch (user.role) {
        case 'admin':
          throw redirect({ to: '/admin' })
        case 'ustadz':
          throw redirect({ to: '/ustadz' })
        case 'wali':
          throw redirect({ to: '/wali' })
        case 'santri':
          throw redirect({ to: '/santri' })
      }
    }
  },
  loader: async () => {
    try {
      const tenant = await resolveTenantContextServer()
      return { tenant }
    } catch (err) {
      return { tenant: null }
    }
  },
  component: Page,
})

function Page() {
  const { tenant } = Route.useLoaderData()
  const navigate = useNavigate()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (tenant) {
    const themeColor = tenant.themeColor || '#047857'
    const namaLembaga = tenant.namaLembaga || 'TahfidzKu'

    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault()
      setErrorMsg('')
      setIsLoading(true)

      try {
        const result = await login({ data: { identifier, password } })
        if (result && result.success) {
          navigate({ to: '/' })
        } else {
          setErrorMsg(result?.error?.message || 'Terjadi kesalahan saat masuk.')
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Gagal terhubung ke server.')
      } finally {
        setIsLoading(false)
      }
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
        <Card className="w-full max-w-md shadow-sm border-slate-100 bg-white">
          <CardHeader className="space-y-3 text-center pb-8">
            <div className="mx-auto flex items-center justify-center">
              {tenant.logoUrl ? (
                <img src={tenant.logoUrl} alt={namaLembaga} className="h-16 w-auto max-w-[180px] object-contain rounded-lg" />
              ) : (
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-xs" style={{ backgroundColor: themeColor }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}
            </div>
            <div className="pt-2">
              <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">{namaLembaga}</CardTitle>
              <CardDescription className="text-slate-500 text-sm mt-1">Masukkan Username / No WA / Email dan PIN / Kata Sandi Anda</CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-5">
              {errorMsg && <div className="p-3 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg text-center font-medium">{errorMsg}</div>}
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-slate-700 font-medium">Username / No WA / Email</Label>
                <Input id="identifier" type="text" placeholder="Misal: 08123456789 atau ustadz_123" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="h-12 border-slate-200 rounded-xl outline-none" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin" className="text-slate-700 font-medium">PIN / Kata Sandi</Label>
                <Input id="pin" type="password" placeholder="Masukkan PIN / Kata Sandi" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 border-slate-200 rounded-xl text-center tracking-widest text-lg" required />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col pt-4 pb-6">
              <Button type="submit" style={{ backgroundColor: themeColor }} className="w-full h-12 text-white rounded-xl transition-all font-semibold text-base shadow-xs hover:opacity-90" disabled={isLoading}>
                {isLoading ? 'Memeriksa...' : 'Masuk Sekarang'}
              </Button>
              <p className="text-xs text-center text-slate-400 mt-4">Powered by <span className="font-semibold text-slate-600">TahfidzKu</span></p>
            </CardFooter>
          </form>
        </Card>
      </div>
    )
  }
  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-1.5 rounded-md">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-emerald-950">TahfidzKu</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <a href="#fitur" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Fitur</a>
            <a href="#keunggulan" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Keunggulan</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/login" className={cn(buttonVariants({ variant: "ghost", className: "hidden sm:inline-flex" }))}>
              Masuk
            </Link>
            <Link to="/register" className={cn(buttonVariants({ className: "bg-emerald-600 hover:bg-emerald-700 text-white" }))}>
              Daftarkan Lembaga
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden bg-white pt-24 pb-32">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
            <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800 mb-8">
              <span className="flex h-2 w-2 rounded-full bg-emerald-600 mr-2"></span>
              Platform Digital Dedikasi untuk Umat
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
              Pencatatan Hafalan Santri <br className="hidden md:block" />
              <span className="text-emerald-600">Lebih Simpel & Terstruktur</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Tingkatkan efisiensi lembaga tahfidz Anda dengan sistem murni logika database tanpa kompleksitas. Fokus pada hafalan santri, biarkan kami yang mengurus datanya. 100% Gratis.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className={cn(buttonVariants({ size: "lg", className: "w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-8 text-base" }))}>
                Gunakan Secara Gratis <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base border-slate-300">
                Pelajari Lebih Lanjut
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="fitur" className="py-24 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">Dirancang Khusus untuk Kebutuhan Pesantren</h2>
              <p className="text-slate-600 text-lg">Setiap fitur dibangun berdasarkan masukan langsung dari para Ustadz dan Wali Santri untuk memastikan pengalaman yang optimal.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 text-emerald-600">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Mobile-First untuk Ustadz</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Antarmuka yang dioptimalkan untuk pengoperasian satu tangan. Input setoran Ziyadah & Murojaah lebih cepat dari sekedar mencatat di buku.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Dashboard Wali Santri</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Visualisasi progres hafalan anak dalam bentuk grafik lingkaran 30 Juz. Transparan, real-time, dan mudah dipahami orang tua.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 text-purple-600">
                    <Shield className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Keamanan Privasi Ketat</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Isolasi data pada level database. Data lembaga Anda 100% aman dan tidak akan bercampur dengan lembaga lain.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Benefits Detail Section */}
        <section id="keunggulan" className="py-24 bg-white">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-6">Fokus pada Kesederhanaan & Performa Tinggi</h2>
                <div className="space-y-6">
                  {[
                    "Murni Logika Database, Tanpa sistem kompleks",
                    "Akses Cepat (Optimasi koneksi 3G/4G di pesantren)",
                    "Manajemen Ustadz & Halaqoh dalam 1 klik",
                    "Laporan otomatis tanpa rekap manual akhir bulan"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-lg text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
                <Link to="/login" className={cn(buttonVariants({ className: "mt-8 bg-emerald-600 hover:bg-emerald-700 text-white" }))}>
                  Gunakan Sekarang
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100 to-teal-50 rounded-2xl transform rotate-3 scale-105 -z-10"></div>
                <div className="bg-white border shadow-xl rounded-2xl overflow-hidden aspect-[4/3] flex flex-col">
                  {/* Mockup UI */}
                  <div className="bg-slate-100 border-b px-4 py-3 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="p-6 flex-1 bg-slate-50 flex flex-col gap-4">
                    <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
                    <div className="h-24 bg-white border rounded-lg p-4 flex gap-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full shrink-0"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                        <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                      </div>
                    </div>
                    <div className="h-24 bg-white border rounded-lg p-4 flex gap-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full shrink-0"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                        <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 border-t border-slate-800">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-emerald-600 p-1 rounded-md">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-xl text-white">TahfidzKu</span>
              </div>
              <p className="text-slate-400 max-w-sm mb-6">
                Sistem Manajemen Tahfidz untuk Pesantren dan Halaqoh. Simpel, cepat, dan transparan. Didedikasikan untuk umat.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Produk</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Fitur</a></li>
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Dokumentasi</a></li>
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Keamanan</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Lembaga</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Tentang Kami</a></li>
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Kontak</a></li>
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Donasi</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>&copy; 2026 TahfidzKu. Hak Cipta Dilindungi.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">Syarat & Ketentuan</a>
              <a href="#" className="hover:text-white transition-colors">Kebijakan Privasi</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

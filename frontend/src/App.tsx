import { BookOpen, Shield, Smartphone, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "./components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "./components/ui/card"

function App() {
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
            <Button variant="ghost" className="hidden sm:inline-flex">Masuk</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700">Daftarkan Lembaga</Button>
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
              Pencatatan Hafalan Santri <br className="hidden md:block"/>
              <span className="text-emerald-600">Lebih Simpel & Terstruktur</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Tingkatkan efisiensi lembaga tahfidz Anda dengan sistem murni logika database tanpa kompleksitas. Fokus pada hafalan santri, biarkan kami yang mengurus datanya. 100% Gratis.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 h-12 px-8 text-base">
                Gunakan Secara Gratis <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
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
                <Button className="mt-8 bg-emerald-600 hover:bg-emerald-700">Gunakan Sekarang</Button>
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

export default App

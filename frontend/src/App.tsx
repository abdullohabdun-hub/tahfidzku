import { BrowserRouter, Routes, Route } from "react-router-dom"
import LandingPage from "./pages/LandingPage"
import AdminLayout from "./layouts/AdminLayout"
import Dashboard from "./pages/admin/Dashboard"
import UstadzLayout from "./layouts/UstadzLayout"
import UstadzDashboard from "./pages/ustadz/UstadzDashboard"
import InputSetoran from "./pages/ustadz/InputSetoran"
import SantriLayout from "./layouts/SantriLayout"
import SantriDashboard from "./pages/santri/SantriDashboard"
import InputLaporan from "./pages/santri/InputLaporan"
import WaliLayout from "./layouts/WaliLayout"
import WaliDashboard from "./pages/wali/WaliDashboard"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="ustadz" element={<div className="p-4">Halaman Data Ustadz (Segera Hadir)</div>} />
          <Route path="santri" element={<div className="p-4">Halaman Data Santri (Segera Hadir)</div>} />
          <Route path="kelas" element={<div className="p-4">Halaman Kelas/Halaqoh (Segera Hadir)</div>} />
          <Route path="pengaturan" element={<div className="p-4">Halaman Pengaturan (Segera Hadir)</div>} />
        </Route>

        {/* Ustadz Routes */}
        <Route path="/ustadz" element={<UstadzLayout />}>
          <Route index element={<UstadzDashboard />} />
          <Route path="input" element={<InputSetoran />} />
          <Route path="ujian" element={<div className="p-4 text-center">Form Ujian Kenaikan Juz (Segera Hadir)</div>} />
          <Route path="riwayat" element={<div className="p-4 text-center">Riwayat Setoran (Segera Hadir)</div>} />
          <Route path="profil" element={<div className="p-4 text-center">Profil Ustadz (Segera Hadir)</div>} />
        </Route>

        {/* Santri Routes */}
        <Route path="/santri" element={<SantriLayout />}>
          <Route index element={<SantriDashboard />} />
          <Route path="input" element={<InputLaporan />} />
          <Route path="ujian" element={<div className="p-4 text-center">Hasil Ujian Kenaikan Juz (Segera Hadir)</div>} />
          <Route path="profil" element={<div className="p-4 text-center">Profil Santri (Segera Hadir)</div>} />
        </Route>

        {/* Wali Santri Routes */}
        <Route path="/wali" element={<WaliLayout />}>
          <Route index element={<WaliDashboard />} />
          <Route path="jadwal" element={<div className="p-4 text-center">Jadwal Halaqoh (Segera Hadir)</div>} />
          <Route path="ujian" element={<div className="p-4 text-center">Hasil Ujian Kenaikan Juz (Segera Hadir)</div>} />
          <Route path="profil" element={<div className="p-4 text-center">Profil Wali (Segera Hadir)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

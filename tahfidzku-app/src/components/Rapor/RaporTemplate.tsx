// src/components/Rapor/RaporTemplate.tsx
// Komponen tampilan rapor A4 — digunakan di halaman cetak rapor santri

import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { FormatPenilaian } from '../FormatPenilaian'

// ──────────────────────────────────────────────
// Tipe data yang diterima dari getSantriRaporData
// ──────────────────────────────────────────────
interface Setoran {
  id: string
  jenis: string
  juz: number | null
  juzMulai: number | null
  juzSelesai: number | null
  lintasJuz: boolean | null
  halamanAwal: number | null
  halamanAkhir: number | null
  surah: string | null
  ayatAwal: number | null
  ayatAkhir: number | null
  kualitas: string | null
  skorKualitas?: number | null
  statusHafalan?: string | null
  penilaianKustom: Record<string, any> | null
  catatan: string | null
  createdAt: string | Date
  ustadz: { nama: string } | null
}

interface Ujian {
  id: string
  juz: number
  kelancaran: string
  tajwid: string
  skor: number
  status: string
  catatan: string | null
  attempt: number
  createdAt: string | Date
  ustadz: { nama: string } | null
}

interface RaporData {
  profil: {
    id: string
    nama: string
    kelasNama: string | null
    targetJuz: number
    juzSelesai: number
    juzProgress: number[]
  }
  periode: { label: string; mode: string; tahunAjaran: number; bulan?: number }
  rekapBulanan?: Array<{ bulan: string; ziyadah: number; sabqi: number; manzil: number; rataRataSkor: number | null }>
  setoran: {
    ziyadah: Setoran[]
    sabqi: Setoran[]
    manzil: Setoran[]
  }
  ujian: Ujian[]
  absensi: {
    hadir: number
    izin: number
    sakit: number
    alpa: number
    terlambat: number
    total: number
  }
  raporSettings: {
    namaLembaga: string | null
    alamatLembaga: string | null
    logoUrl: string | null
    kotaCetak: string | null
    namaMudir: string | null
    nipMudir: string | null
    catatanFooter: string | null
    labelPenilaian?: Record<string, string> | null
  } | null
}

// ──────────────────────────────────────────────
// Helper: label kualitas / status
// ──────────────────────────────────────────────
const KUALITAS_LABEL: Record<string, string> = {
  lancar: 'Lancar', mengulang: 'Mengulang', terbata: 'Terbata-bata'
}
const TAJWID_LABEL: Record<string, string> = {
  sempurna: 'Sempurna', cukup: 'Cukup', kurang: 'Kurang'
}
const STATUS_UJIAN_LABEL: Record<string, string> = {
  lulus: 'LULUS ✓', tidak_lulus: 'TIDAK LULUS ✗'
}
const NAMA_BULAN: Record<number, string> = {
  1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April',
  5: 'Mei', 6: 'Juni', 7: 'Juli', 8: 'Agustus',
  9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember'
}

function formatTarget(s: Setoran): string {
  if (s.jenis === 'ziyadah') {
    if (s.surah && s.ayatAwal && s.ayatAkhir) return `${s.surah} ayat ${s.ayatAwal}–${s.ayatAkhir}`
    if (s.juz) return `Juz ${s.juz}`
    return '-'
  }
  const juzVal = s.lintasJuz
    ? `${s.juzMulai}–${s.juzSelesai}`
    : `${s.juzMulai ?? s.juz ?? '-'}`
  const hal = s.halamanAwal != null && s.halamanAkhir != null
    ? ` Hal ${s.halamanAwal}–${s.halamanAkhir}`
    : ''
  return `Juz ${juzVal}${hal}`
}

// ──────────────────────────────────────────────
// Komponen Utama
// ──────────────────────────────────────────────
export function RaporTemplate({ data, tanggalCetak }: { data: RaporData; tanggalCetak?: Date }) {
  const { profil, periode, setoran, ujian, absensi, raporSettings: settings } = data
  const tglCetak = tanggalCetak ?? new Date()
  const namaLembaga = settings?.namaLembaga ?? 'Nama Lembaga'
  const persentaseHafalan = profil.targetJuz > 0
    ? Math.round((profil.juzSelesai / profil.targetJuz) * 100)
    : 0

  return (
    <div
      id="rapor-template"
      className="bg-white text-slate-900 font-sans w-full max-w-[794px] mx-auto px-[20mm] py-[10mm] print:px-0 print:py-0 print:max-w-none print:w-full"
      style={{ fontFamily: 'serif' }}
    >

      {/* ── A. KOP SURAT ── */}
      <div className="flex items-center gap-4 border-b-2 border-slate-800 pb-3 mb-4">
        {settings?.logoUrl && (
          <img
            src={settings.logoUrl}
            alt="Logo Lembaga"
            className="h-20 w-20 object-contain shrink-0"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold uppercase tracking-wide leading-tight">{namaLembaga}</h1>
          {settings?.alamatLembaga && (
            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{settings.alamatLembaga}</p>
          )}
        </div>
      </div>

      {/* ── JUDUL RAPOR ── */}
      <div className="text-center mb-5">
        <h2 className="text-base font-bold uppercase underline tracking-widest">Rapor Hafalan Santri</h2>
        <p className="text-sm mt-1">Periode: {periode.label}</p>
      </div>

      {/* ── B. DATA SANTRI ── */}
      <div className="border border-slate-300 rounded mb-5 overflow-hidden">
        <div className="bg-slate-100 px-4 py-1.5 border-b border-slate-300">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Data Santri</span>
        </div>
        <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <InfoRow label="Nama" value={profil.nama} />
          <InfoRow label="Kelas/Halaqoh" value={profil.kelasNama ?? '-'} />
          <InfoRow label="Target Hafalan" value={`${profil.targetJuz} Juz`} />
          <InfoRow
            label="Capaian Hafalan"
            value={`${profil.juzSelesai} Juz (${persentaseHafalan}%)`}
          />
          {profil.juzProgress.length > 0 && (
            <div className="col-span-2">
              <InfoRow
                label="Juz Selesai"
                value={profil.juzProgress.slice().sort((a, b) => a - b).join(', ')}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── C. REKAP SETORAN ── */}
      <div className="border border-slate-300 rounded mb-5 overflow-hidden">
        <div className="bg-slate-100 px-4 py-1.5 border-b border-slate-300">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Rekap Setoran — {periode.label}
          </span>
        </div>

        {periode.mode === 'bulanan' ? (
          <>
            {/* Ringkasan jumlah per jenis (Hanya Bulanan) */}
            <div className="grid grid-cols-3 divide-x divide-slate-200 border-b border-slate-200">
              {[
                { label: 'Ziyadah', count: setoran.ziyadah.length },
                { label: 'Sabqi', count: setoran.sabqi.length },
                { label: 'Manzil', count: setoran.manzil.length },
              ].map(({ label, count }) => (
                <div key={label} className="px-4 py-2 text-center">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-lg font-bold text-slate-800">{count}</p>
                  <p className="text-[10px] text-slate-400">pertemuan</p>
                </div>
              ))}
            </div>

            {/* Tabel detail setoran */}
            {[...setoran.ziyadah, ...setoran.sabqi, ...setoran.manzil].length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600">Tanggal</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600">Jenis</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600">Materi</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600">Kualitas</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600">Penyimak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...setoran.ziyadah, ...setoran.sabqi, ...setoran.manzil]
                      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                      .map((s) => {
                        return (
                          <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="px-3 py-1.5 whitespace-nowrap text-slate-600">
                              {format(new Date(s.createdAt), 'd MMM yyyy', { locale: idLocale })}
                            </td>
                            <td className="px-3 py-1.5 capitalize font-medium">{s.jenis}</td>
                            <td className="px-3 py-1.5">{formatTarget(s)}</td>
                            <td className="px-3 py-1.5">
                              <FormatPenilaian item={s as any} labelKustom={settings?.labelPenilaian} />
                            </td>
                            <td className="px-3 py-1.5 text-slate-500">{s.ustadz?.nama ?? '-'}</td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-4 py-3 text-sm text-slate-400 italic">Tidak ada catatan setoran pada periode ini.</p>
            )}
          </>
        ) : (
          /* Tabel Rekap Bulanan untuk Semester/Tahunan */
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Bulan</th>
                  <th className="text-center px-3 py-2 font-semibold text-slate-600">Ziyadah</th>
                  <th className="text-center px-3 py-2 font-semibold text-slate-600">Sabqi</th>
                  <th className="text-center px-3 py-2 font-semibold text-slate-600">Manzil</th>
                  <th className="text-center px-3 py-2 font-semibold text-slate-600">Rata-rata Skor</th>
                </tr>
              </thead>
              <tbody>
                {data.rekapBulanan?.map((r) => {
                  const [y, m] = r.bulan.split('-')
                  const namaBulanStr = `${NAMA_BULAN[parseInt(m, 10)]} ${y}`
                  return (
                    <tr key={r.bulan} className="border-b border-slate-100">
                      <td className="px-3 py-1.5 font-medium text-slate-700">{namaBulanStr}</td>
                      <td className="px-3 py-1.5 text-center">{r.ziyadah || '-'}</td>
                      <td className="px-3 py-1.5 text-center">{r.sabqi || '-'}</td>
                      <td className="px-3 py-1.5 text-center">{r.manzil || '-'}</td>
                      <td className="px-3 py-1.5 text-center font-semibold text-slate-800">{r.rataRataSkor ?? '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── D. UJIAN KENAIKAN JUZ ── */}
      <div className="border border-slate-300 rounded mb-5 overflow-hidden">
        <div className="bg-slate-100 px-4 py-1.5 border-b border-slate-300">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Ujian Kenaikan Juz</span>
        </div>
        {ujian.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Tanggal</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Juz</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Kelancaran</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Tajwid</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Skor</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Status</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Penguji</th>
                </tr>
              </thead>
              <tbody>
                {ujian.map(u => (
                  <tr key={u.id} className="border-b border-slate-100">
                    <td className="px-3 py-1.5 whitespace-nowrap text-slate-600">
                      {format(new Date(u.createdAt), 'd MMM yyyy', { locale: idLocale })}
                    </td>
                    <td className="px-3 py-1.5 font-medium">Juz {u.juz}</td>
                    <td className="px-3 py-1.5">{KUALITAS_LABEL[u.kelancaran] ?? u.kelancaran}</td>
                    <td className="px-3 py-1.5">{TAJWID_LABEL[u.tajwid] ?? u.tajwid}</td>
                    <td className="px-3 py-1.5 font-bold">{u.skor}</td>
                    <td className={`px-3 py-1.5 font-semibold ${u.status === 'lulus' ? 'text-emerald-700' : 'text-red-600'}`}>
                      {STATUS_UJIAN_LABEL[u.status] ?? u.status}
                    </td>
                    <td className="px-3 py-1.5 text-slate-500">{u.ustadz?.nama ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-4 py-3 text-sm text-slate-400 italic">Tidak ada ujian kenaikan juz pada periode ini.</p>
        )}
      </div>

      {/* ── E. ABSENSI ── */}
      <div className="border border-slate-300 rounded mb-6 overflow-hidden">
        <div className="bg-slate-100 px-4 py-1.5 border-b border-slate-300">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Rekap Kehadiran</span>
        </div>
        <div className="grid grid-cols-5 divide-x divide-slate-200 text-center py-2">
          {[
            { label: 'Hadir', val: absensi.hadir, cls: 'text-emerald-700' },
            { label: 'Izin', val: absensi.izin, cls: 'text-blue-600' },
            { label: 'Sakit', val: absensi.sakit, cls: 'text-amber-600' },
            { label: 'Alpa', val: absensi.alpa, cls: 'text-red-600' },
            { label: 'Terlambat', val: absensi.terlambat, cls: 'text-orange-500' },
          ].map(({ label, val, cls }) => (
            <div key={label} className="px-2 py-1">
              <p className="text-xs text-slate-500">{label}</p>
              <p className={`text-xl font-bold ${cls}`}>{val}</p>
            </div>
          ))}
        </div>
        <div className="px-4 py-1.5 border-t border-slate-100 text-right">
          <span className="text-xs text-slate-500">Total Sesi Tercatat: <strong>{absensi.total}</strong></span>
        </div>
      </div>

      {/* ── F. CATATAN FOOTER ── */}
      {settings?.catatanFooter && (
        <div className="border border-dashed border-slate-300 rounded px-4 py-3 mb-6 bg-slate-50 text-sm italic text-slate-600">
          {settings.catatanFooter}
        </div>
      )}

      {/* ── G. TANDA TANGAN ── */}
      <div className="flex justify-end mt-4">
        <div className="text-center text-sm w-56">
          <p>
            {settings?.kotaCetak ?? ''},{' '}
            {format(tglCetak, 'd MMMM yyyy', { locale: idLocale })}
          </p>
          <p className="mt-1">Mudir/Kepala Lembaga,</p>
          {/* Ruang tanda tangan */}
          <div className="h-16 mt-1" />
          <p className="font-bold border-t border-slate-800 pt-1">{settings?.namaMudir ?? '___________________________'}</p>
          {settings?.nipMudir && <p className="text-xs text-slate-500">NIP. {settings.nipMudir}</p>}
        </div>
      </div>

    </div>
  )
}

// ──────────────────────────────────────────────
// Helper komponen
// ──────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1">
      <span className="text-slate-500 shrink-0 w-32">{label}</span>
      <span className="font-medium">: {value}</span>
    </div>
  )
}

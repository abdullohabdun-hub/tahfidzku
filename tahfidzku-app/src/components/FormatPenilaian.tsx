// src/components/FormatPenilaian.tsx
// Komponen display penilaian setoran — mendukung sistem skor baru (1-5) dan data lama (legacy)

import { getLabelSkor, getWarnaSkor, getSkorEfektif } from '../lib/penilaian'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  lanjut:    { label: 'Lanjut',    color: 'text-emerald-700 bg-emerald-100 border-emerald-200' },
  mengulang: { label: 'Mengulang', color: 'text-amber-700 bg-amber-100 border-amber-200' },
}

interface PenilaianItem {
  skorKualitas?: number | null
  statusHafalan?: string | null
  kualitas?: string | null
  penilaianKustom?: Record<string, any> | null
}

export function FormatPenilaian({
  item,
  labelKustom,
  showStatus = true,
}: {
  item: PenilaianItem
  labelKustom?: Record<string, string> | null
  showStatus?: boolean
}) {
  const skor = getSkorEfektif(item)
  const hasNew = !!(item.skorKualitas || item.statusHafalan)

  return (
    <div className="flex flex-wrap gap-1 items-center justify-end">
      {/* Badge Skor */}
      {skor && (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border ${getWarnaSkor(skor)}`}>
          <span className="font-black">{skor}</span>
          <span className="opacity-75">— {getLabelSkor(skor, labelKustom)}</span>
        </span>
      )}

      {/* Badge Status Hafalan */}
      {showStatus && item.statusHafalan && STATUS_LABEL[item.statusHafalan] && (
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border ${STATUS_LABEL[item.statusHafalan].color}`}>
          {STATUS_LABEL[item.statusHafalan].label}
        </span>
      )}

      {/* Fallback: penilaian kustom lama */}
      {!hasNew && !skor && item.penilaianKustom && Object.keys(item.penilaianKustom).length > 0 && (
        Object.values(item.penilaianKustom).map((val, i) => (
          <span key={i} className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide capitalize bg-slate-100 text-slate-700 border border-slate-200">
            {String(val)}
          </span>
        ))
      )}

      {/* Jika tidak ada data sama sekali */}
      {!skor && !item.statusHafalan && (!item.penilaianKustom || Object.keys(item.penilaianKustom).length === 0) && (
        <span className="text-[10px] text-slate-400 font-bold">-</span>
      )}
    </div>
  )
}

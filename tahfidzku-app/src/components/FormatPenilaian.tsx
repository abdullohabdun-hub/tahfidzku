

const LEGACY_KUALITAS_MAP: Record<string, { label: string, color: string }> = {
  lancar: { label: 'Lancar', color: 'text-emerald-700 bg-emerald-100 border-emerald-200' },
  mengulang: { label: 'Mengulang', color: 'text-amber-700 bg-amber-100 border-amber-200' },
  terbata: { label: 'Terbata', color: 'text-rose-700 bg-rose-100 border-rose-200' },
}

export function FormatPenilaian({ item, rubrikAktif }: { item: any, rubrikAktif?: any[] }) {
  // 1. Jika ada penilaian kustom, render semua key yang ada
  if (item.penilaianKustom && Object.keys(item.penilaianKustom).length > 0) {
    return (
      <div className="flex flex-wrap gap-1 items-center justify-end">
        {Object.entries(item.penilaianKustom).map(([key, val]) => {
          // Coba cari label dari rubrikAktif jika tersedia
          let displayLabel = String(val)
          if (rubrikAktif) {
            const rubrik = rubrikAktif.find(r => r.key === key)
            if (rubrik && rubrik.opsi) {
              const opsi = rubrik.opsi.find((o: any) => o.value === val)
              if (opsi) {
                displayLabel = opsi.label
              }
            }
          }

          return (
            <span key={key} className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide capitalize bg-slate-100 text-slate-700 border border-slate-200">
              {displayLabel}
            </span>
          )
        })}
      </div>
    )
  }

  // 2. Fallback ke kualitas lama (legacy)
  if (item.kualitas) {
    const legacy = LEGACY_KUALITAS_MAP[item.kualitas.toLowerCase()]
    if (legacy) {
      return (
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide capitalize border ${legacy.color}`}>
          {legacy.label}
        </span>
      )
    }
    // Jika ada nilai tapi tidak dikenali di map
    return (
      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide capitalize bg-slate-100 text-slate-700 border border-slate-200">
        {item.kualitas}
      </span>
    )
  }

  // 3. Keduanya kosong
  return <span className="text-[10px] text-slate-400 font-bold">-</span>
}

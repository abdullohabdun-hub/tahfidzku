import { useEffect, useState } from 'react'

export function PwaReloadPrompt() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [updateFn, setUpdateFn] = useState<(() => void) | null>(null)

  useEffect(() => {
    // Only import virtual:pwa-register in the browser
    if (typeof window !== 'undefined') {
      import('virtual:pwa-register').then(({ registerSW }) => {
        const updateSW = registerSW({
          onNeedRefresh() {
            setNeedRefresh(true)
            setUpdateFn(() => () => updateSW(true))
          },
          onOfflineReady() {
            console.log('Aplikasi siap bekerja offline.')
          }
        })
      }).catch(err => {
        console.error('Gagal mendaftar service worker:', err)
      })
    }
  }, [])

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[9999] bg-white border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl p-4 flex flex-col gap-3 max-w-sm animate-in slide-in-from-bottom-5">
      <div className="text-sm font-medium text-slate-800">
        Versi terbaru aplikasi tersedia! Muat ulang untuk memperbarui.
      </div>
      <div className="flex gap-2 justify-end">
        <button 
          onClick={() => setNeedRefresh(false)}
          className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          Nanti Saja
        </button>
        <button 
          onClick={() => updateFn && updateFn()}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
        >
          Muat Ulang
        </button>
      </div>
    </div>
  )
}

import { useEffect } from 'react'
import { registerSW } from 'virtual:pwa-register'

export function PwaReloadPrompt() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerSW({
        immediate: true,
        onRegisterError(error) {
          console.warn('⚠️ Service Worker registration error:', error)
        },
      })
    }
  }, [])

  return null
}


import { useEffect } from 'react'
import { hexToOklch } from './theme-utils'

interface TenantThemeData {
  themeConfigured?: boolean | null
  themeColor?: string | null
}

/**
 * Shared hook untuk inject CSS variable tema per-lembaga ke document root.
 * Dipakai di semua layout portal (admin, ustadz, santri, wali) agar tema
 * tidak perlu diduplikasi di setiap layout.
 *
 * Jika themeConfigured = false atau themeColor kosong, tidak ada CSS variable
 * yang di-set — fallback ke nilai default dari styles.css tetap berlaku.
 * Ini memastikan tidak ada regresi untuk tenant tanpa tema custom.
 */
export function useTenantTheme(tenantData: TenantThemeData | null | undefined) {
  useEffect(() => {
    if (tenantData?.themeConfigured && tenantData?.themeColor) {
      const oklch = hexToOklch(tenantData.themeColor)
      document.documentElement.style.setProperty('--primary', oklch)
      document.documentElement.style.setProperty('--sidebar-primary', oklch)
    }
  }, [tenantData?.themeConfigured, tenantData?.themeColor])
}

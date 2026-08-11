import { createFileRoute } from '@tanstack/react-router'
import { getAuthSession } from '../../middleware/auth.middleware'
import { queryTenantThemeById, queryTenantThemeBySlug } from '../../server-fns/tenant-by-slug'
import { resolveTenantFromHost } from '../../lib/tenant-resolver'

function extToMimeType(url: string): string {
  if (url.endsWith('.jpg') || url.endsWith('.jpeg')) return 'image/jpeg'
  if (url.endsWith('.webp')) return 'image/webp'
  return 'image/png'
}

export const Route = createFileRoute('/api/manifest.webmanifest')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url)
        const slug = url.searchParams.get('slug')

        let themeColor = '#047857'
        let logoUrl: string | null = null
        let namaLembaga = 'TahfidzKu'

        try {
          const session = await getAuthSession()
          if (session) {
            // Branch 1: User sudah login -> lookup tema by session tenantId
            const rows = await queryTenantThemeById(session.user.tenantId)
            if (rows[0]) {
              themeColor = rows[0].themeColor
              logoUrl = rows[0].logoUrl
            }
          } else if (slug) {
            // Branch 2: Akses lewat link /masuk/[slug] -> lookup tema by slug
            const rows = await queryTenantThemeBySlug(slug)
            if (rows[0]) {
              themeColor = rows[0].themeColor
              logoUrl = rows[0].logoUrl
              namaLembaga = rows[0].namaLembaga
            }
          } else {
            // Branch 3: Akses via subdomain/custom domain -> lookup tenant by Host header
            const host = request.headers.get('host')
            const tenantContext = await resolveTenantFromHost(host)
            if (tenantContext) {
              themeColor = tenantContext.themeColor
              logoUrl = tenantContext.logoUrl
              namaLembaga = tenantContext.namaLembaga
            }
          }
        } catch (err) {
          console.error('Error fetching tenant manifest theme:', err)
        }

        const logoMime = logoUrl ? extToMimeType(logoUrl) : 'image/png'

        const manifest = {
          name: namaLembaga,
          short_name: namaLembaga,
          description: 'Aplikasi Manajemen Hafalan Al-Quran',
          theme_color: themeColor,
          background_color: '#ffffff',
          display: 'standalone',
          display_override: ['standalone', 'minimal-ui'],
          start_url: '/',
          scope: '/',
          orientation: 'portrait',
          lang: 'id',
          icons: logoUrl
            ? [
                { src: logoUrl, sizes: '192x192', type: logoMime },
                { src: logoUrl, sizes: '512x512', type: logoMime },
                { src: '/pwa-512x512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
              ]
            : [
                { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
                { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
                { src: '/pwa-512x512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
              ],
        }

        return new Response(JSON.stringify(manifest), {
          status: 200,
          headers: {
            'Content-Type': 'application/manifest+json',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      },
    },
  },
})

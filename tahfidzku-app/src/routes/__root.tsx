import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { PwaReloadPrompt } from '../components/PwaReloadPrompt'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TahfidzKu',
      },
      {
        name: 'apple-mobile-web-app-capable',
        content: 'yes',
      },
      {
        name: 'apple-mobile-web-app-status-bar-style',
        content: 'default',
      },
      {
        name: 'theme-color',
        content: '#059669',
      }
    ],
    links: [
      {
        rel: 'apple-touch-icon',
        href: '/pwa-192x192.png',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <PwaReloadPrompt />
        <Scripts />
      </body>
    </html>
  )
}

import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  server: {
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'tahfidzku.my.id',
      '.tahfidzku.my.id',
    ],
  },
  plugins: [
    tailwindcss(), 
    tanstackStart(), 
    viteReact(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      manifest: false,
    })
  ],
})

export default config

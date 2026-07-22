import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// BASE_PATH is set by CI to "/<repo-name>/" for GitHub Pages; locally the app serves from "/".
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['ball.svg', 'pwa-apple-180.png'],
      manifest: {
        name: 'Ties Break: Ace Parent',
        short_name: 'Ties Break',
        description: 'Raise a tennis star: an honest career simulation.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Character portraits and other heavy art load on demand — precaching them
        // would balloon the PWA install (public/images is ~37 MB of source PNGs).
        globIgnores: ['**/images/**'],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})

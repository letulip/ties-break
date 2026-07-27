import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// BASE_PATH is set by CI to "/<repo-name>/" for GitHub Pages; locally the app serves from "/".
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    vue(),
    VitePWA({
      // 'prompt': a new build waits for the user to tap "Update" (App.vue UpdateBanner),
      // instead of silently reloading mid-session.
      registerType: 'prompt',
      includeAssets: ['ball.svg', 'pwa-apple-180.png', 'favicon.png'],
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
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
        // The big character paintings stay OUT of the precache, on purpose (R11-9, re-measured).
        // MEASURED, not guessed: public/images/fem-euro-brunnet/ is 67 webp / 3511 KiB, and the
        // rest of the precache is 61 entries / 1746 KiB — so precaching the art would TRIPLE the
        // install, and 31 of those files (1641 KiB: milf/bride/funeral/graduated/pregnant/angry
        // and unused -fs8 variants) are later-life art no code path can request yet. The stale
        // "~37 MB of source PNGs" note this replaces was about the SOURCES, which have since moved
        // to art-src/ and are never served.
        //
        // What IS offline-safe by precache: the 20 small 256px crops in public/avatars (294 KiB),
        // which is why the header and the Home card never break offline.
        globIgnores: ['**/images/**'],
        // ...and the big paintings get a CacheFirst runtime route instead: one age band is only
        // ~413-487 KiB, src/art/preload.ts warms the band she is IN (so a finale popup never
        // renders ahead of its art), and once fetched a painting is offline-durable for 60 days.
        // maxEntries 80 comfortably holds the whole reachable set (36 files) plus headroom.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /\/images\/.*\.(?:webp|png|jpe?g)$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'tb-art-v1',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})

import { defineConfig, type Plugin } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { optimizeArt } from './scripts/optimize-art.mjs'

/**
 * build/webp-only — the art pipeline runs INSIDE the build, not beside it.
 *
 * Raw masters dropped into `public/images/<set>-jpeg/` are encoded to webp in
 * `public/images/<set>/` and then moved out of public/ into the gitignored `art-src/`.
 * The move is the load-bearing half: Vite copies all of public/ into dist/ verbatim,
 * so a master left there ships to every player no matter what git tracks.
 *
 * Why a plugin and not a `prebuild` npm script: npm only fires `prebuild` for
 * `npm run build`. The project gate is `npm run check`, which calls `vite build`
 * directly — a prebuild hook would silently not run there. `buildStart` runs for
 * every `vite build`, however it was invoked.
 *
 * It also runs on `vite dev` so newly dropped art shows up without a build, but never
 * under Vitest: tests must not mutate the working tree.
 *
 * Cost when there is nothing to do: a few stat() calls. See scripts/optimize-art.mjs
 * for the content-hash cache that keeps a second build from re-encoding anything.
 */
function artPipeline(): Plugin {
  let root = process.cwd()
  let done = false
  return {
    name: 'ties-break:art-pipeline',
    apply: (_config, env) => env.command === 'build' || !process.env.VITEST,
    configResolved(config) {
      // The config is bundled before it runs, so the script cannot locate itself — hand it
      // the root Vite resolved.
      root = config.root
    },
    async buildStart() {
      if (done) return // dev server restarts re-run buildStart; once per process is enough
      done = true
      await optimizeArt({ root, log: (m) => this.info(m) })
    },
  }
}

// BASE_PATH is set by CI to "/<repo-name>/" for GitHub Pages; locally the app serves from "/".
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    artPipeline(),
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
        // The big character paintings stay OUT of the precache, on purpose (R11-9; re-measured
        // on build/webp-only, after the duplicate `-fs8` set was deleted).
        // MEASURED, not guessed: public/images/fem-euro-brunnet/ is 42 webp / 2348 KiB, and the
        // whole precache is 67 entries / 1752 KiB — so precaching the art would still more than
        // DOUBLE the install, and 18 of those files (1105 KiB: milf/bride/funeral/graduated/
        // pregnant/angry) are later-life art no code path can request yet — `PortraitStage` has no
        // `milf` and `AvatarEmotion` has no `angry`. Only 24 files / 1243 KiB are reachable.
        //
        // What IS offline-safe by precache: the 20 small 256px crops in public/avatars (324 KiB),
        // which is why the header and the Home card never break offline.
        globIgnores: ['**/images/**'],
        // ...and the big paintings get a CacheFirst runtime route instead: one age band is only
        // ~361-435 KiB, src/art/preload.ts warms the band she is IN (so a finale popup never
        // renders ahead of its art), and once fetched a painting is offline-durable for 60 days.
        // maxEntries 80 comfortably holds the whole reachable set (24 files) plus headroom.
        runtimeCaching: [
          {
            // webp only: after build/webp-only nothing else can exist under /images/.
            urlPattern: ({ url }) => /\/images\/.*\.webp$/.test(url.pathname),
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

import { defineConfig, configDefaults, type Plugin } from 'vitest/config'
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
/** The Monte-Carlo files: 104s of the suite's 183s, and the reason CI's reporter RPC times out.
 *  Declared once so the two projects below cannot disagree about which files are heavy. */
const HEAVY_SIM_FILES = [
  '**/tests/econ-bench.test.ts',
  '**/tests/fatigue-bench.test.ts',
  '**/tests/match/calibration.test.ts',
]

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
        // MEASURED, not guessed: public/images/fem-euro-brunnet/ is 42 webp / 2348 KiB — so
        // precaching the art would still more than DOUBLE the install.
        //
        // The reachable share GREW on 27.07: `PortraitStage` gained `milf` and `AvatarEmotion`
        // gained `angry`, so 35 of the 42 (5 bands x 7 emotions) are now requestable, against 24
        // before. Only 7 files / 400 KiB are still unreachable, and they are STORY frames rather
        // than a missing band — bride / funeral / graduated / pregnant-first / pregnant-last /
        // farewell / retired. They have no AvatarEmotion to name them and no surface that shows
        // them; they wait on a life-events feature, not on a type.
        //
        // Keeping the art out of the precache matters MORE now, not less: a career only ever
        // occupies one band at a time, and src/art/preload.ts fetches that band on demand.
        //
        // What IS offline-safe by precache: the small 256px crops in public/avatars (37 files /
        // 528 KiB — was 20 / 324 KiB before the adult and milf crops were cut), which is why the
        // header and the Home card never break offline at any age.
        globIgnores: ['**/images/**'],
        // ...and the big paintings get a CacheFirst runtime route instead: one age band is only
        // ~361-424 KiB, src/art/preload.ts warms the band she is IN (so a finale popup never
        // renders ahead of its art), and once fetched a painting is offline-durable for 60 days.
        // maxEntries 80 still comfortably holds the whole reachable set (35 files) plus headroom.
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
    // WHY CI RUNS THE SUITE IN ONE FORK.
    //
    // The symptom (29.07, and it survived a re-run): every one of the 1242 tests passes and the job
    // still exits 1 with `[vitest-worker]: Timeout calling "onTaskUpdate"`. That is not a test
    // failure - it is vitest's worker RPC. A worker awaits `onTaskUpdate` on the main process and
    // birpc gives it a HARD-CODED 60s timeout (node_modules/birpc: DEFAULT_TIMEOUT = 6e4), which
    // nothing in vitest's config surface can raise.
    //
    // What makes it fire is contention, and our suite is unusually good at producing it: ~110s of
    // the run is Monte-Carlo simulation in three files (fatigue-bench 44s, econ-bench 34s,
    // match/calibration 31s under load). Vitest opens one fork per core; a GitHub runner has two,
    // so several CPU-bound forks and the main process fight over them and a single blocked call can
    // sit past a minute. Locally, on ten cores, it never happens - which is exactly why it only
    // ever went red in CI.
    //
    // One fork removes the contention rather than papering over it: each file gets a whole core and
    // the main process gets the other, so no RPC waits on a starved thread. It costs wall-clock (the
    // files no longer overlap) and it buys a gate that does not fail for reasons that have nothing
    // to do with the code. Locally the default pool is untouched.
    //
    // The real long-term fix is to stop spending two minutes of CPU on Monte-Carlo inside the PR
    // gate - move the two bench files to their own job. That is a decision about what the gate is
    // for, so it waits for the owner rather than being smuggled in here.
    poolOptions: {
      forks: { singleFork: !!process.env.CI },
    },
    // ⚠ THE GATE STOPS BEING A MONTE-CARLO RUNNER (30.07). The note above ends with "the real
    // long-term fix is to stop spending two minutes of CPU on Monte-Carlo inside the PR gate - move
    // the two bench files to their own job... it waits for the owner". It came due: the suite grew
    // from ~110s to 183s this round and CI went red again at 935/1561 tests with the same
    // `Timeout calling "onTaskUpdate"` - not one assertion failed.
    //
    // Measured, three files are 104s of the 183: econ-bench 43.6s, fatigue-bench 38.7s,
    // match/calibration 21.8s. They are Monte-Carlo sweeps over hundreds of simulated careers, and
    // they are the reason a reporter RPC can sit past birpc's hard-coded 60s.
    //
    // NOTHING IS SKIPPED OR DELETED. They move to a project of their own and CI runs BOTH projects
    // on every push, in two jobs - so every test still guards every change, and the gate no longer
    // fails for reasons that have nothing to do with the code. A bare `vitest run` still runs the
    // lot, which is what a developer wants locally.
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          exclude: [...configDefaults.exclude, ...HEAVY_SIM_FILES],
        },
      },
      {
        // ⚠ NO `extends: true` HERE, and it is not an oversight. With it, this project's `include`
        // MERGES with the root's `tests/**/*.test.ts` and the project collects the whole suite - which
        // is what it did on the first attempt (76 files instead of 3). Without it the include is the
        // only one, which is the whole point of the split.
        test: { name: 'sim', include: HEAVY_SIM_FILES },
      },
    ],
  },
})

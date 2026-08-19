import { defineConfig, configDefaults, type Plugin } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { optimizeArt } from './scripts/optimize-art.mjs'
// ⚠ THE HEAVY-TEST LISTS ARE NOT DECLARED HERE ANY MORE, and that is the point (round-22 review).
// They lived here as two literal arrays while `scripts/sim.mjs` regex-parsed one of them back out
// of this file's SOURCE TEXT and `scripts/units.mjs` kept a hand-copied duplicate of the other –
// three statements of one fact, two of which could go quietly stale on a rename. One module, three
// importers; scripts/heavy-tests.mjs's header carries the full argument.
import { HEAVY_SIM_FILES, HEAVY_UNIT_FILES, asProjectGlobs } from './scripts/heavy-tests.mjs'

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

/**
 * build/no-stowaways — desktop junk never reaches a player, whenever it was created.
 *
 * Vite copies `public/` into `dist/` VERBATIM, so a `.DS_Store` Finder wrote while the owner was
 * dropping an icon ships to everyone. It has reddened the gate twice in one day, and the second time
 * there were two of them – `public/` and `public/icons/`, the folder he had just opened.
 *
 * ⚠ WHY THIS SWEEPS `dist/` AFTER THE BUILD RATHER THAN `public/` BEFORE IT. Cleaning the source
 * would be a race the build cannot win: Finder writes `.DS_Store` when a folder is *viewed*, so it
 * can appear after `buildStart` and before the copy. Sweeping the OUTPUT is the only placement where
 * the guarantee holds regardless of when the file arrived – and it never deletes anything of the
 * owner's, because `dist/` is generated.
 *
 * ⚠ AND IT DOES NOT REPLACE `tests/ui-control-system.test.ts`'s `.DS_Store` CHECK. The two guard
 * different things and both are wanted: this plugin protects the PLAYER (junk cannot ship), the test
 * protects the REPOSITORY (something that does not belong is sitting in the working tree, and
 * somebody has been in the folder by hand). Deleting the test because the plugin now catches it
 * would trade a smoke alarm for a fire blanket.
 *
 * `.textClipping` is on the list from experience, not from a list of known-bad names: dragging a
 * search result out of Finder produces one, and one landed in `public/icons/` on 10.08 wearing the
 * name of an icon it did not contain.
 */
const STOWAWAYS = /^(\.DS_Store|Thumbs\.db|desktop\.ini|\._.*|.*\.textClipping)$/

function noStowaways(): Plugin {
  return {
    name: 'ties-break:no-stowaways',
    apply: 'build',
    async closeBundle() {
      const { readdir, rm } = await import('node:fs/promises')
      const { join } = await import('node:path')
      const removed: string[] = []
      const sweep = async (dir: string): Promise<void> => {
        let entries
        try {
          entries = await readdir(dir, { withFileTypes: true })
        } catch {
          return // no dist/ (a build that failed earlier, or a dry run) is not this plugin's problem
        }
        for (const e of entries) {
          const full = join(dir, e.name)
          if (e.isDirectory()) await sweep(full)
          else if (STOWAWAYS.test(e.name)) {
            await rm(full, { force: true })
            removed.push(full)
          }
        }
      }
      await sweep('dist')
      // Loud on purpose. A silent sweep would hide that the working tree keeps growing these, which
      // is the thing the test is trying to tell somebody.
      if (removed.length) this.warn(`stripped ${removed.length} stowaway(s) from dist: ${removed.join(', ')}`)
    },
  }
}

// BASE_PATH is set by CI to "/<repo-name>/" for GitHub Pages; locally the app serves from "/".
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    artPipeline(),
    noStowaways(),
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
        // = style.css --bg (the 28.07 darker palette). Pinned to it by tests/design-tokens.test.ts:
        // these two and index.html's meta are the copies CSS cannot reach, and they lagged the
        // palette by four days once already (Android status bar + install splash on the old slate).
        theme_color: '#0a0e13',
        background_color: '#0a0e13',
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
        // MEASURED, not guessed, and RE-MEASURED 19.08: public/images/fem-euro-brunnet/ is
        // 64 webp / 2915 KiB – so precaching the art would still more than DOUBLE the install.
        //
        // ⚠ THE COUNTS IN THIS BLOCK WERE FOUR WEEKS STALE (they read "42 webp / 2348 KiB" and
        // "35 of the 42"), which matters because the next-but-one paragraph SIZES A CACHE off
        // them. What arrived since: `rehab` (5 paintings), the 12 `-travel-{mood}-{scene}` journey
        // frames and the `welcome-1` onboarding hero. Counted by `ls`, not by memory:
        //
        //     reachable   53 / 2419 KiB   5 bands x 8 painted faces (40) + 12 travel + welcome-1
        //     unreachable 11 /  496 KiB   7 story frames (394 KiB) + 4 `-sleepy-` rename leftovers
        //
        // The 7 STORY frames are bride / funeral / graduated / pregnant-early / pregnant-last /
        // farewell / retired. They have no `PortraitEmotion` to name them and no surface that
        // shows them; they wait on a life-events feature, not on a type – docs/lore/setting.md
        // §"the art" describes each one and docs/research/life-events-motherhood.md counts them as
        // an in-repo prerequisite for the Phase-6 adult arc. Round 22 proposed deleting them as
        // dead weight and the deletion was NOT taken: unreachable is proven, but "unused" is the
        // owner's call and the record says they are parked, not orphaned. The 4 `-sleepy-` files
        // are a different case with an existing home – docs/art-placeholders.md registers them as
        // superseded by the `-travel-` group, and tests/art-placeholders.test.ts holds that row.
        //
        // Keeping the art out of the precache matters MORE now, not less: a career only ever
        // occupies one band at a time, and src/art/preload.ts fetches that band on demand.
        //
        // What IS offline-safe by precache: the small 256px crops in public/avatars (37 files /
        // 369 KiB, re-measured 19.08 – was 20 files before the adult and milf crops were cut),
        // which is why the header and the Home card never break offline at any age.
        globIgnores: ['**/images/**'],
        // ...and the big paintings get a CacheFirst runtime route instead: one age band is only
        // ~361-424 KiB, src/art/preload.ts warms the band she is IN (so a finale popup never
        // renders ahead of its art), and once fetched a painting is offline-durable for 60 days.
        // ⚠⚠ AND `maxEntries: 80` IS NOT SIZED FOR WHAT THIS ROUTE ACTUALLY MATCHES (19.08, found
        // while re-checking the counts above – the note that stood here read "still holds the whole
        // reachable set plus headroom… the margin has narrowed from 35/80 to 53/80"). That
        // arithmetic is TRUE ABOUT ONE DIRECTORY and the urlPattern below is not scoped to one: it
        // takes every `/images/*.webp` the trophies|sponsors route above did not catch first, and
        // public/images holds 205 webp, not 64. Counted by `ls`, not by memory:
        //
        //     trophies + sponsors    38   -> tb-art-small-v1, maxEntries 48, holds all of them
        //     fem-euro-brunnet       64   the character paintings this note was written about
        //     fields                 73   src/art/venues.ts
        //     coaches                16   src/art/preload.ts
        //     weeks                  14   src/art/weeks.ts
        //     -----------------------------------------------------------------------------
        //     reaching tb-art-v1    167   against maxEntries 80
        //
        // All three extra sets are live and reachable, not rename leftovers. So the eviction this
        // route describes is not a future risk to watch: a career that visits enough venues already
        // passes eighty distinct entries, and the cache drops the least-recently-used one silently –
        // a blank frame OFFLINE rather than an error, which is why nothing has reported it.
        //
        // ⚠ THE NUMBER IS DELIBERATELY LEFT AT 80. It is a phone-storage budget and 167 entries at
        // these sizes is a different install-footprint promise from 80, which is the owner's call
        // and not a tidy-up. What is fixed here is the FALSE HEADROOM CLAIM. Whoever sets the cap
        // next sizes it against the 167, not against one directory – and the same goes for an art
        // wave that adds a face or a scene to all five bands.
        // ⚠ CACHEFIRST NEVER REVALIDATES, AND THE OWNER'S UPDATED TROPHIES PROVED IT (01.08). He
        // replaced two trophy paintings; the new webps reached main the same evening - and his
        // phone kept showing the old ones, because a CacheFirst entry at the SAME URL is served
        // without ever asking the network again for 60 days. Deploys cannot touch it. So the art
        // route splits in two, by how the art actually changes:
        runtimeCaching: [
          {
            // THE SMALL, ITERATED SETS - trophies and sponsor letterheads (≤ ~32 KiB each). The
            // owner repaints these; a repaint must reach a phone on its own. StaleWhileRevalidate
            // serves the cached copy instantly and refetches behind it, so an update self-applies
            // one view later, offline still works, and the revalidation traffic is a few KiB.
            urlPattern: ({ url }) => /\/images\/(trophies|sponsors)\/.*\.webp$/.test(url.pathname),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'tb-art-small-v1',
              expiration: { maxEntries: 48, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // THE BIG CHARACTER PAINTINGS keep CacheFirst - one band is ~361-424 KiB and a phone
            // must not re-ask for it on every view. The freshness cost above is accepted HERE
            // because these change ~never; if a band is ever repainted, bump the cache name.
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
    // ⚠ `singleFork: !!process.env.CI` LIVED HERE AND IS GONE (30.07). It existed for exactly one
    // reason - the Monte-Carlo files fighting the reporter RPC on a 2-core runner - and those files
    // have left the PR gate (see .github/workflows/simulation.yml). A workaround whose reason has
    // been removed is worse than no workaround: the next person to read it will assume it is load-
    // bearing. The gate is 73 fast files and it runs on the default pool, in parallel, in ~14s.
    //
    // If flakes ever come back, the honest first question is which file is spending seconds of CPU
    // and whether it belongs in the gate at all - not how to serialise around it.
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
          // ⚠ tests/component/** MUST be excluded here: the root include is tests/**/*.test.ts, so
          // without this the node-environment unit project picks up the mounted tests and they die on
          // a missing `document`.
          exclude: [
            ...configDefaults.exclude,
            ...asProjectGlobs(HEAVY_SIM_FILES),
            'tests/component/**',
            // ⚠ THE HEAVY UNIT TAIL, SKIPPED ONLY WHEN `scripts/units.mjs` IS ABOUT TO RUN IT
            // ITSELF (05.08). Those three files still gate every pull request - they are regression
            // tests, unlike the Monte-Carlo sweeps - they just get a process each so no worker holds
            // a core past birpc's unraisable 60s window. The env var exists because vitest's CLI
            // `--exclude` does not merge into a project that declares its own `exclude`: passing it
            // three times still ran all 112 files, measured. Unset, nothing changes.
            ...(process.env.TB_UNIT_SKIP_HEAVY ? asProjectGlobs(HEAVY_UNIT_FILES) : []),
          ],
          // ⚠ 20s, AND IT IS A CONTENTION BUDGET RATHER THAN A SLOW-TEST ALLOWANCE (31.07).
          //
          // The owner could not merge: CI failed three runs in a row on `week-notes.test.ts` W2 with
          // "Test timed out in 5000ms". It is not a hang and it is not that test. Measured on an idle
          // machine that sweep runs in **1236 ms** - four times inside the old ceiling - and the same
          // CI job reports 231s of TEST time inside 90s of WALL time, i.e. every core saturated with
          // 84 files at once. A heavy test that loses that race is starved, not broken.
          //
          // The signature confirms it: the failure MOVES. Two agents independently reported this flake
          // on different files on different runs (`week-notes`, `radar`, `world`, `coach-load`), and it
          // reproduces on a pristine tree about one run in three. One slow test fails in one place;
          // contention fails wherever the scheduler happens to squeeze.
          //
          // ⚠ AND I MISDIAGNOSED IT ONCE ALREADY - I told the owner it was my own parallel benches
          // stealing CPU. It is not: this is GitHub Actions, where those benches do not exist. The
          // cause is the suite competing with itself, which is a property of the suite.
          //
          // Raising the ceiling is the honest fix rather than the lazy one, because the thing the old
          // number measured was never this test's cost - it was how much CPU it happened to get. What
          // 5000ms actually enforced was "no test may be unlucky", and the sweeps here grow every time
          // a note, an axis or a licence is added. 20s is far above the 1.2s real cost and still low
          // enough to catch a genuine hang, which is the only thing a timeout is for.
          testTimeout: 20_000,
        },
      },
      {
        // ⚠ NO `extends: true` HERE, and it is not an oversight. With it, this project's `include`
        // MERGES with the root's `tests/**/*.test.ts` and the project collects the whole suite - which
        // is what it did on the first attempt (76 files instead of 3). Without it the include is the
        // only one, which is the whole point of the split.
        //
        // ⚠ THE SIM RUN IS SERIALISED - BUT THE SWITCH LIVES ON THE `test:sim` SCRIPT, NOT HERE.
        // WHY serialise (P6 (d)): birpc gives every worker RPC a HARD-CODED 60s timeout
        // (node_modules/birpc DEFAULT_TIMEOUT = 6e4 - not configurable in vitest 3.2.7), and these
        // files are minutes of synchronous Monte-Carlo. Run in parallel on the weekly 2-core runner,
        // the forks and the main process fight for cores and a pending `onTaskUpdate` ack can sit
        // past the minute - `test:sim` then exits 1 with every test green (reproduced twice, even on
        // an idle 10-core machine). One file at a time leaves the main process a core, so acks flow.
        // WHY not `fileParallelism: false` right here, which is where you would look for it: vitest
        // 3.2.7 IGNORES it at project level - createForksPool builds ONE pool for the whole run off
        // the ROOT config (`vitest.config.fileParallelism` / `vitest.config.poolOptions`, verified
        // in dist source), so a project-level flag changes nothing (measured: 288% CPU, files
        // overlapping). The honest lever is the CLI flag on the SCRIPTS that run this project.
        //
        // ⚠ AND IT IS A MITIGATION, NOT A CURE - measured 02.08, correcting the paragraph above.
        // Two gaps were found: `test:sim:quiet` and `test:all` never carried the flag at all (both
        // reproduced the red-on-green exit), and `test:sim` WITH the flag still exited 1 on one run
        // and 0 on the very next. The reporter is the second variable: the default reporter
        // re-renders the per-test tree and keeps far more `onTaskUpdate` acks in flight, so every
        // sim script now carries `--reporter=dot` too. tests/sim-serialisation.test.ts enforces both
        // halves mechanically, because a fix applied to one script and not its twins is invisible
        // until a cron goes red months later - which is how these two gaps survived.
        //
        // ⚠ THE DURABLE FIX IS NOT HERE, IT IS IN THE FILES - AND IT IS NOW DONE.
        //
        // WHAT THE MECHANISM ACTUALLY IS, measured rather than assumed: the longest SINGLE test in
        // the whole sim project is 18s, so no individual test blows a 60s window. vitest tracks each
        // FILE as a task, and it is that task's ack the timeout applies to - so the metric that
        // matters is the PER-FILE total, not per-test. Before (02.08, serialised): fatigue-bench
        // 58.3s, econ-reach 56.6s on one run and 72.1s on the next. Both on or over the line, and
        // the 56→72s variance on one unchanged file is why this was a coin-flip rather than a rule.
        //
        // So the two offenders were split by MEASURED cost, not by eye - the first attempt moved the
        // wrong 13.7s and left the parent at 55s. Per-describe timings put 38s of fatigue-bench in
        // `policy ordering` and 18s of econ-reach in the pro-proxy arm; those became their own files.
        // After (same run, serialised): econ-reach 34.6s, econ-bench 32.3s, econ-reach-pro 21.8s,
        // fatigue-bench 13.4s, calibration 12.3s, fatigue-bench-planner 7.4s, fatigue-bench-policy.
        // Worst file 34.6s - 25s of headroom under the ceiling.
        //
        // Test counts are unchanged and that is checked, not asserted: 36 `it`/`it.each`
        // declarations across the three fatigue files (was 36 in one) and 4 across the two econ-reach
        // files (was 4), 77 expanded tests before and after. Wall-clock is unchanged too, because
        // this project runs one file at a time regardless.
        test: { name: 'sim', include: asProjectGlobs(HEAVY_SIM_FILES) },
      },
      {
        // THE COMPONENT PROJECT (P9). The first tests in this repo that MOUNT anything.
        //
        // ⚠ WHY IT EXISTS, and it is not "coverage for its own sake". Until now every test of a
        // component read the .vue file AS TEXT and asserted on its structure - `expect(src).toContain(
        // 'onBeforeUnmount(resetSweep)')`. That is a source pin, and a source pin is the opposite of a
        // safety net: it breaks the moment the file is refactored while proving nothing about what the
        // component DOES. The P4 wave paid that bill 17 times, once with a slice whose end marker had
        // moved, which returned -1 and made a negative assertion silently vacuous.
        //
        // The engine could be decomposed from 6019 lines to 2135 because 2230 real tests ran after
        // every extraction. MatchViewer.vue (2239 lines) and SeasonScreen.vue (2022) have no such net,
        // which is why they have not been touched. This project builds it.
        //
        // ⚠ NO `extends: true`, FOR THE REASON THE SIM PROJECT ABOVE ALREADY DOCUMENTS - and this
        // project walked into it too: with `extends: true` the include MERGED with the root's
        // `tests/**/*.test.ts` and it collected 112 files instead of 1, running the whole engine suite
        // under happy-dom. P9's own proposal recommends `extends: true` to inherit the vue() plugin;
        // that advice is wrong for this repo, and the correction is the line below.
        //
        // ⚠ SO THE PLUGIN IS DECLARED HERE INSTEAD. `vue()` is what compiles an SFC's <template> at
        // all; without it a mount dies on the template block. Declaring it per-project keeps the
        // include isolated AND the SFCs compiling, which is what both constraints need.
        plugins: [vue()],
        test: {
          name: 'component',
          include: ['tests/component/**/*.test.ts'],
          environment: 'happy-dom',
          // ⚠ `css: true` SO A COLOUR CAN BE A TESTABLE FACT. Vitest drops stylesheets by default,
          // so until now a mounted test could see the DOM but never what it LOOKED like - and the
          // round-17 #3 regression is precisely what that blind spot lets through: BirthdayDialog
          // painted its buttons `var(--card, #fff)` and their labels `var(--ink, #1c1c1e)`, and
          // because `--card` is declared NOWHERE while `--ink` is `#f2f6f8`, four buttons shipped as
          // near-white text on white. Every structural assertion in birthday-dialog.test.ts passed.
          // With this on, `tests/component/contrast.ts` reads the real cascade through
          // `getComputedStyle` (happy-dom resolves `var()` and its fallbacks correctly - measured)
          // and the contrast ratio becomes an assertion like any other.
          css: true,
        },
      },
    ],
  },
})

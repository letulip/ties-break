// THE E2E HARNESS (S0 of docs/plans/playwright.md). The fourth layer's runtime, and nothing else.
//
// What this layer is FOR is written down in e2e/README.md and in the plan's §2 table; the short
// version is the one rule that keeps it worth having: it covers the SEAMS the other three layers
// cannot reach - the real worker boundary, real IndexedDB, the real service worker, real layout at
// real sizes, real input, the real file round trip. A spec that asserts a button's label is a slower
// copy of a mounted `component` test and belongs there instead.
//
// ⚠ THIS CONFIG IS WRITTEN AGAINST THE PROJECT'S OWN CI LESSON, quoted from
// .github/workflows/simulation.yml: "a gate that fails for reasons unrelated to the code teaches
// people to ignore the gate, which is worse than not having one." Every choice below that looks
// conservative - one browser, one worker on CI, one retry, no reuse of a running server - is that
// sentence applied to a browser suite.

import { defineConfig, devices } from '@playwright/test'

/** `vite preview`'s own default. Pinned here rather than left to chance because `--strictPort` below
 *  turns a taken port into a loud failure instead of a silent shift to 4174 - where Playwright would
 *  then be talking to whatever was already serving. */
const PORT = 4173

export default defineConfig({
  testDir: './e2e',

  // ⚠ 60s PER TEST, AND IT IS A BOOT BUDGET RATHER THAN A SLOW-TEST ALLOWANCE - the same argument
  // vite.config.ts makes for the unit project's 20s. A spec here pays for a cold Chromium, a worker
  // that builds a whole world, and IndexedDB opening for the first time; on a 2-core runner under
  // contention that is not the 30s default's business. The number is far above the real cost
  // (measured: the smoke spec is ~2s of test time) and still low enough to catch a genuine hang,
  // which is the only thing a timeout is for.
  timeout: 60_000,
  // Web-first assertions retry until this. It is the ONLY waiting mechanism this suite may use:
  // `page.waitForTimeout` is banned outright (see e2e/README.md) because the UI here is fed by an
  // async RPC to a worker, so a sleep is a guess about a queue you cannot see.
  expect: { timeout: 10_000 },

  fullyParallel: true,
  // A `.only` left in a spec silently shrinks the gate to one test. On CI that is a failure.
  forbidOnly: !!process.env.CI,

  // ⚠ THE FLAKE BUDGET IS ZERO AND THE RETRY IS NOT A LICENCE. One retry exists so a single
  // infrastructure hiccup does not block a merge - and so the trace and video below get recorded
  // when it happens. A spec that NEEDS the retry to pass gets fixed or deleted, never tolerated:
  // this app is deterministic by construction (seeded RNG, no network, no clock), so a flake here is
  // a real defect in the spec or in the app, not weather.
  retries: process.env.CI ? 1 : 0,
  // Locally, half the cores as usual. On CI, one - this repo has already paid twice for CPU
  // contention producing red builds with nothing failing (vite.config.ts's 20s timeout note, and
  // scripts/units.mjs's whole header). A browser suite is the last place to re-litigate that.
  workers: process.env.CI ? 1 : undefined,

  // The HTML report is the artefact (the plan's §6, and eventually §5's S3 showcase). `open: 'never'`
  // matters on CI, where an auto-opened report hangs the job waiting on a browser that is not there.
  // `github` annotates a failure inline on the pull request diff, which is where it gets read.
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: `http://localhost:${PORT}`,
    // ⚠ ON THE FIRST RETRY, NOT ALWAYS. A trace is tens of MB and a video more; recording every run
    // would make the CI artefact useless by the third PR. Recorded exactly when something failed
    // once, which is the only run anybody opens.
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      // ⚠ CHROMIUM ONLY, AND THAT IS S0's SCOPE RATHER THAN AN OVERSIGHT. The plan's §6 splits the
      // work: the PR gate runs smoke on one engine, and the full device/browser matrix plus visual
      // and a11y belongs to S3's nightly `e2e-full.yml`. One browser is also ~273 MiB of download
      // per cold CI run; three would be most of the job's wall-clock, for a smoke test.
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // THE OWNER'S PHONE, and this app is phone-first: 576x1280 is the width the redesign was
        // measured at (the Home SEASON strip was fixed from 111px over four rows to 52px over two at
        // exactly this size). A desktop viewport would render a layout no player uses.
        // Deliberately NOT `devices['Pixel 5']`: touch emulation and a mobile user agent change
        // behaviour as well as size, and choosing which of those the suite asserts against is S3's
        // matrix decision, not a side effect of picking a viewport.
        viewport: { width: 576, height: 1280 },
      },
    },
  ],

  // ⚠ A REAL PRODUCTION BUILD, NOT THE DEV SERVER. This is a PWA: the dev server serves unbundled
  // modules, no `sw.js`, no manifest, no precache and a differently-built worker - i.e. not the
  // artefact a player runs, which is precisely what this layer exists to test.
  //
  // `vite build` and not `npm run build`: that script is `vue-tsc -b && vite build`, and vue-tsc is
  // `noEmit` - the dist it produces is byte-for-byte the one below. The types are checked by their
  // own CI job (and by `npm run check`), so paying for a second full typecheck here buys nothing and
  // costs a minute of every local run.
  webServer: {
    command: `npx vite build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    // ⚠ NEVER REUSE, not even locally, and the default here is the wrong one for this command.
    // Playwright's default (`!process.env.CI`) assumes the server IS the app; here the command
    // BUILDS the app first, so reusing a running preview means testing whatever dist happened to be
    // on disk - a stale-artefact green run, which is worse than a red one. The build is ~5s.
    reuseExistingServer: false,
    // Build plus preview boot. Generous for a cold CI runner; locally it is nowhere near this.
    timeout: 180_000,
    // ⚠ THE SERVICE WORKER IS BUILT BUT NOT REGISTERED. `sw.js`, the manifest and the precache
    // manifest are all still emitted and served - the artefact under test stays the production
    // artefact - and `src/pwa.ts` skips the one call that installs it. Why: a worker activating
    // mid-run, a precache serving the previous build to the next spec, and an update banner landing
    // on the control a test was about to click are three races that produce red runs with nothing
    // wrong in the code. S2's update-flow spec needs it back ON and gets there by building without
    // this variable - the reasoning and the route are in e2e/README.md.
    env: { VITE_TB_SW: 'off' },
  },
})

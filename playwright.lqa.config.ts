// THE LQA RUNNER'S PLAYWRIGHT CONFIG (L4-3) – `npm run lqa:ru`, and nothing else uses it.
//
// ⚠ A CONFIG OF ITS OWN, NOT A PROJECT OF `playwright.config.ts`, and not inside `npm run test:e2e`: the e2e suite is a regression
// gate with a zero-flake budget; this is a measuring instrument whose product is a report. It rides the same harness (the production
// build, the seeded careers of `e2e/careerAt.ts`, a worker per page) but its specs live in `e2e/lqa/` under the suffix `.lqa.ts`, which the
// e2e config's default `testMatch` never sees, and it serves its builds on its own ports into its own `dist-lqa*/` folders so a
// running instrument can neither clobber nor be clobbered by `dist/`.
//
// ⚠ TWO BUILDS, BOTH WITH THE HOOK. `VITE_TB_LQA=on` compiles `src/i18n/lqa.ts` in (the read-only miss-counter window; see its header and
// `tests/i18n-l4-3-lqa-hook.test.ts`); the first build also switches the service worker off, exactly as the e2e build does and for the
// same three races, and the second leaves it on so route 8 meets a real worker. `tb-locale=ru` is seeded into every context's storage:
// the language question is already answered, and the answer is Russian.
//
// ⚠ SERIAL AND QUIET: one worker, no retry, no trace. A retry here would count a screen's misses twice into a report whose whole value is
// that its numbers are reproducible; a route that cannot finish says so in its verdict instead.
import { defineConfig, devices } from '@playwright/test'

const PORT = 4180
const SW_PORT = 4181
const VIEWPORT = { width: 576, height: 1280 }

export default defineConfig({
  testDir: './e2e/lqa',
  testMatch: /.*\.lqa\.ts$/,
  timeout: 240_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    // A click on a control a blocking card covers must fail in seconds and be RECORDED, not wait out the test (Playwright's default is no limit).
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    storageState: {
      cookies: [],
      origins: [PORT, SW_PORT].map((port) => ({
        origin: `http://localhost:${port}`,
        localStorage: [{ name: 'tb-locale', value: 'ru' }],
      })),
    },
    trace: 'off',
    video: 'off',
    screenshot: 'off',
  },
  projects: [
    {
      name: 'lqa-ru',
      testIgnore: /pwa\.lqa\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: VIEWPORT },
    },
    {
      name: 'lqa-ru-sw',
      testMatch: /pwa\.lqa\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: VIEWPORT, baseURL: `http://localhost:${SW_PORT}` },
    },
  ],
  webServer: [
    {
      command: `npx vite build --outDir dist-lqa && npx vite preview --outDir dist-lqa --port ${PORT} --strictPort`,
      url: `http://localhost:${PORT}/`,
      reuseExistingServer: false,
      timeout: 240_000,
      env: { VITE_TB_LQA: 'on', VITE_TB_SW: 'off' },
    },
    {
      command: `npx vite build --outDir dist-lqa-sw && npx vite preview --outDir dist-lqa-sw --port ${SW_PORT} --strictPort`,
      url: `http://localhost:${SW_PORT}/`,
      reuseExistingServer: false,
      timeout: 240_000,
      env: { VITE_TB_LQA: 'on' },
    },
  ],
})

# The e2e layer

Playwright over a **real production build** in **real Chromium**. This is S0 of
`docs/plans/playwright.md` – the harness and one smoke spec. Nothing here is coverage yet.

```bash
npm run test:e2e            # the suite: builds, serves, runs. ~7 s cold today.
npm run test:e2e:ui         # the time-travel UI – pick a spec, watch it, step back through it
npm run test:e2e -- --headed        # watch the browser do it
npm run test:e2e -- --debug         # the inspector, one action at a time
npm run test:e2e -- -g "week 1"     # one spec by name
```

First run on a new machine needs the browser, which npm does not install:

```bash
npx playwright install chromium     # ~273 MiB, once per machine per Playwright release
```

⚠ **`npm run test:e2e` is not part of `npm run check`, and must not become part of it.** The
pre-push gate is already about four minutes and this is a browser suite. The PR gate runs it as its
own parallel job (`.github/workflows/ci.yml`, `e2e-smoke`).

## What this layer owns – and what it must not duplicate

The repo already had three test layers before this one, and they are good. This layer earns its
place only by covering what none of them can reach (`docs/plans/playwright.md` §2):

| layer | runs in | owns |
|---|---|---|
| `unit` | node | engine arithmetic, ledgers, migrations |
| `component` | happy-dom, mounted | component behaviour and rendering |
| `sim` | node, Monte-Carlo | balance calibration, weekly – not a PR gate |
| **`e2e`** | **real Chromium** | **the seams between them** |

The seams, and they are the only reason to add a spec here:

1. **The Web Worker boundary** – the engine runs in a worker and the UI only ever sees a `Snapshot`.
   Component tests mock that away entirely.
2. **Persistence across a real reload** – `fake-indexeddb` is not IndexedDB.
3. **The service worker** – `registerType: 'prompt'`, the update banner, the CacheFirst art route.
4. **Real layout at real sizes.**
5. **Real input** – taps, the tab bar, the inbox sheet, a file picker.
6. **The file round trip** – export a save, import it back.

**Every spec must answer: which of those six does this exercise?** If the answer is none, it belongs
in `tests/component/`, where it will run in milliseconds instead of seconds and be more precise
about what broke. A Playwright test that asserts a button's label is a slower copy of a test that
already exists.

## The rules that keep it green

**Selectors: role and accessible name.** `getByRole('button', { name: 'Start career' })`. It is
Playwright's own recommendation and it doubles as an accessibility assertion – a control with no
accessible name fails the test *and* is a real defect. `data-testid` only where the accessible name
is genuinely dynamic or ambiguous, with a comment saying why. **Never CSS classes or DOM
structure**, which change with every UI wave and this project has many. The smoke spec needed no
testid at all: every control on the boot path already has a name.

**No `page.waitForTimeout`. Ever.** The UI is fed by an async RPC to a worker, so a sleep is a guess
about a queue you cannot observe – too short and it flakes, too long and the suite is slow for
everyone forever. Use a web-first assertion (`await expect(locator).toBeVisible()`), or
`expect.poll` against rendered state. Both retry.

**The flake budget is zero.** `retries: 1` on CI exists so one infrastructure hiccup does not block
a merge, and so the trace and video get recorded when it happens. A spec that *needs* the retry to
pass gets fixed or deleted. This app is deterministic by construction – seeded RNG, no network, no
clock – so a flake here is a defect in the spec or in the app, not weather.

## The service worker: built, served, not registered

The app is a PWA with `registerType: 'prompt'` and an update banner. Left alone, that is three races
an end-to-end run can lose: a worker activating between `goto` and the first assertion, a precache
serving the **previous** build to the next spec, and an update banner landing on top of the control
a spec was about to click. Each produces a red run with nothing wrong in the code – the failure mode
`.github/workflows/simulation.yml` already ruled against.

So `playwright.config.ts` builds with `VITE_TB_SW=off`, and `src/pwa.ts` skips `registerSW`.

What that does **not** do is change the artefact: `sw.js`, `manifest.webmanifest` and the whole
precache manifest are still generated and still served. Only the registration call is withheld.
Nothing ships to a player either – `import.meta.env` is inlined at build time, so a production
bundle contains the registration and no switch at all. Verified both ways: with the variable set the
string `serviceWorker` does not appear in the bundle; without it, it does.

The smoke spec asserts `navigator.serviceWorker.getRegistrations()` is empty, so if the switch is
ever lost the next run says so instead of the suite going quietly flaky three waves later.

**S2 needs it back ON** for the one spec that tests the update flow. The route is a second
`webServer` entry on another port, built without `VITE_TB_SW`, and a Playwright project pinned to it
by `baseURL` – so the specs that want a worker get a real one, and the rest keep a build that cannot
surprise them. Turning the flag off globally instead would hand every other spec those three races
back.

## Debugging a failure

The HTML report is the artefact:

```bash
npx playwright show-report
```

On CI it is uploaded as `playwright-report` on a failed run only, with seven days of retention.

Traces and video are recorded **on the first retry**, not on every run – tens of MB each, and the
only run anyone opens is the one that failed. A trace is a recording you can scrub: DOM snapshot per
action, console, network, and the exact locator each step used.

```bash
npx playwright show-trace test-results/<spec>/trace.zip
```

To get a trace for something that passes on CI and fails for you, run it with `--trace on`.

## Notes on the harness

- **The build is the server.** `webServer` runs `vite build && vite preview --strictPort`, and
  `reuseExistingServer` is `false` even locally – reusing a running preview would test whatever
  `dist/` happened to be on disk, which is a green run for the wrong reason. The build is about five
  seconds; the honesty is worth more.
- `vite build` and not `npm run build`: that script is `vue-tsc -b && vite build`, and `vue-tsc` is
  `noEmit`. The dist is identical, and the types are checked by their own CI job.
- **Viewport 576×1280**, the owner's phone. This app is phone-first, and the Home SEASON strip was
  measured and fixed at exactly this width. Deliberately not a `devices['Pixel 5']` profile: touch
  emulation and a mobile user agent change behaviour as well as size, and deciding which of those
  the suite asserts against is S3's matrix work.
- **The specs are type-checked.** Playwright strips types with esbuild without checking them, so
  `tsconfig.e2e.json` covers `e2e/**` and `playwright.config.ts`, and `vue-tsc -b` includes it.

## Not here yet

- **S1, the fixture engine** – `careerAt(...)`, writing a prepared save straight into IndexedDB
  before the app boots, so a spec can start at week 412 instead of clicking through 412 weeks.
  That is the load-bearing idea in the plan and it lands on its own branch. It will also need to
  clear or seed the app's `localStorage` markers (`tb:lastSeenInboxLetter:<careerId>`, `tb-muted`
  and friends), which isolated contexts do not do for you in the way IndexedDB is done for you.
- **S2, the journeys** – roughly a dozen specs, one per seam.
- **S3, the showcase** – visual regression, the device matrix, `@axe-core/playwright`, and the
  report published beside the app. Its workflow is `e2e-full.yml`, nightly, and it is where the
  matrix lives. It is not this job.

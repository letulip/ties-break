---
type: plan
status: proposed
area: testing
canonical: false
last-reviewed: 2026-08-06
---

# Playwright: the fourth layer

**Status: a plan, nothing built.** Written 06.08.2026. The repo has no `@playwright/test`, no `e2e/`
directory and exactly **zero** `data-testid` attributes today – so this starts from nothing, which is
the honest place to start from.

## 1. Why this app is an unusually good subject

Most end-to-end suites spend their lives fighting non-determinism: a clock, a network, a database
that remembers yesterday. **This one does not have to.**

- **The world is a pure function of a seed.** `game.newCareer(seed, profile)` and the RNG discipline
  in `CLAUDE.md` mean the same seed produces the same career, match for match. An assertion on a
  scoreline is a stable assertion, not a flake waiting to happen.
- **A career is a file.** `src/engine/saveCodec.ts` already encodes a whole career into a versioned
  binary envelope – gzip payload, SHA-256 integrity – and `src/db/saves.ts` reads and writes them to
  IndexedDB. **A test can start at week 412 instead of clicking through 412 weeks.** This is the
  single most valuable thing in the plan and section 3 is built around it.
- **There is already a fast-forward in production.** `▶▶ 52 (dev)` ships in every build by an owner
  ruling. A test hook that is not a test-only hack.
- **No network at all.** Offline-first PWA, no back end, nothing to stub.

So the suite can be deterministic *by construction* rather than by retry. That is worth saying out
loud because it is the difference between an E2E suite people trust and one people re-run.

## 2. What this layer owns – and what it must not touch

The repo already has three layers and they are good. Playwright earns its place only by covering
what none of them can reach.

| layer | runs in | owns | count today |
|---|---|---|---|
| `unit` | node | engine arithmetic, ledgers, migrations | ~2,318 |
| `component` | happy-dom, mounted | component behaviour and rendering | 94 |
| `sim` | node, Monte-Carlo | balance calibration (weekly, not a PR gate) | 9 files |
| **`e2e`** | **real Chromium** | **the seams between them** | **0** |

**The seams, concretely – every one of these is currently untested by anything:**

1. **The Web Worker boundary.** The engine runs in a worker and the UI only ever sees a `Snapshot`.
   Component tests mock that away entirely. Nothing exercises the real `postMessage` pipeline, the
   FIFO queue, or the transaction/recovery paths from `W1-INTEGRITY-A`.
2. **Persistence across a real reload.** `fake-indexeddb` is not IndexedDB. Save, reload, restore,
   and the storage-recovery UI have never met a real browser.
3. **The service worker.** `registerType: 'prompt'` plus the `UpdateBanner`, and a CacheFirst art
   route with a 60-day life that has already served stale trophies once (`vite.config.ts` records
   it). Offline behaviour is entirely unverified.
4. **Real layout at real sizes.** The Home SEASON strip was measured at 111 px over four rows and
   fixed to 52 px over two – by hand, in a browser, once. Nothing keeps it there.
5. **Real input.** Taps, the tab bar, the inbox sheet, a five-week sponsor window with letters that
   must be openable and answerable.
6. **The file round trip.** Export a save to disk, import it back, through real file inputs.

**What it must NOT do: re-test components.** `tests/component/` is mounted, fast and
mutation-verified, and the repo's own gotcha says a source pin proves nothing. A Playwright test that
asserts a button's label is a slower duplicate of a test that already exists. Every e2e spec must
answer: *which of the six seams above does this exercise?* If the answer is none, it belongs in
`component`.

## 3. The load-bearing idea: seed the state, do not click to it

A career at week 412 is eight seasons of decisions. Clicking there is impossible; fast-forwarding
there costs minutes per test and couples every test to the balance model.

Instead, a fixture writes a prepared save **directly into IndexedDB before the app boots**:

```ts
// e2e/fixtures/career.ts – shape, not final code
export const test = base.extend<{ careerAt: (fixture: CareerFixture) => Promise<void> }>({
  careerAt: async ({ page }, use) => {
    await use(async (fixture) => {
      const bytes = await readFixture(fixture)          // the same envelope saveCodec writes
      await page.addInitScript(seedIndexedDb, bytes)    // runs BEFORE any app script
      await page.goto('/')
    })
  },
})
```

Three consequences, and they are why this is first:

- **Setup drops from minutes to milliseconds.** Every scenario below becomes affordable.
- **Fixtures are generated, never hand-written.** A small script drives the real engine headlessly
  (the benches in `tools/` already do exactly this) and writes `e2e/fixtures/*.tsave`. They are
  regenerated when the schema moves, so they cannot rot into a lie – and the golden-save corpus in
  `tests/fixtures/saves/` is the precedent for how this project already thinks about that.
- ⚠ **The owner's own save is never a fixture.** It may be read locally for diagnosis and must never
  be committed. Generated fixtures only.

Fixture set to start: `fresh` (week 0), `junior` (~week 120, first ranking), `pro` (~week 412,
sponsor window, full ledgers), `broke` (near the bankruptcy fork), `ending` (past the fork).

**BUILT, 06.08** – see [`e2e-fixtures.md`](e2e-fixtures.md) for the generator, the per-fixture
purpose, the rot alarm and why this set and the golden-save corpus cannot do each other's job.
All five were found on the first seed tried, total 288 KiB.

## 4. Selector policy – decide it once, now

Zero `data-testid` exist. That is an opportunity to get the policy right rather than sprinkle them.

1. **Role and accessible name first** (`getByRole('button', { name: 'Continue' })`). It is
   Playwright's own recommendation and it doubles as an accessibility assertion: a control with no
   accessible name fails the test *and* is a real defect.
2. **`data-testid` only where the accessible name is dynamic or genuinely ambiguous** – tier chips,
   week cards, the rung strip. Add them deliberately, with a comment saying why, in the same spirit
   as every other decision in this codebase.
3. **Never CSS classes or DOM structure.** They change with every UI wave and this project has many.

## 5. The stages

Each is independently valuable and independently mergeable. Stop after any one of them and the
project is better off than before.

### S0 – the harness (half a day)

`@playwright/test`, `playwright.config.ts`, one smoke spec (`the app boots, a new career starts, week 1
renders`), `webServer` pointed at `vite preview` against a real production build. A CI job on the PR
gate: **chromium only, smoke only.** Trace and video on first retry, HTML report as an artefact.

The point of S0 is the harness, not the coverage. It proves the shape works before anything is built
on it.

### S1 – the fixture engine (one day)

The `careerAt` fixture from section 3, the generator script, the five fixtures. Plus the two hazards
this app will hit and most apps do not:

- **The service worker must be controlled.** An update prompt appearing mid-test is a flake factory.
  Register it off by default in the e2e build, and turn it on explicitly for the one spec that tests
  the update flow.
- **IndexedDB must be clean per test.** Playwright's isolated contexts give this for free, but the
  app also writes `localStorage` (`tb:lastSeenInboxLetter:<careerId>`, `tb-muted`) – seed or clear
  those in the same fixture, or the mail-marker specs will lie.

### S2 – the journeys (two days)

Roughly a dozen specs, one per seam, each stated as a sentence a non-engineer can read:

- a career survives a reload with its funds, rank and week intact *(worker + IndexedDB)*
- entering a tournament, playing it, and seeing the prize land in the ledger *(worker pipeline)*
- the sponsor window: a letter arrives, opens, is signed, and the deal shows on the money screen
- exporting a save and importing it into a second career slot *(file round trip)*
- the app works offline after one visit, and the update banner appears when a new build lands
- a corrupt save is refused and the storage-recovery UI offers the way out *(a path with real
  consequences and no coverage at all today)*

### S3 – the showcase layer (one to two days)

The part that makes it a portfolio piece rather than a smoke test.

- **Visual regression that can actually pass.** Deterministic seed + fixed viewport + a stubbed
  clock. Snapshot the screens with real weight: a match in progress, the trophy cabinet, the
  season wrap-up, the album. Most visual suites fail here; this app's determinism is why this one
  will not.
- **Device matrix.** Mobile 576×1280 (the owner's actual phone), tablet, desktop – plus dark and
  light. The SEASON strip regression is a concrete thing to pin at mobile width.
- **Accessibility.** `@axe-core/playwright` over the main screens, failing on serious and critical.
  Given the selector policy, most of this comes free.
- **Reporting.** HTML report + traces published to GitHub Pages next to the app itself. **This is
  the artefact to put in a job application** – a live, browsable report with traces someone can
  actually click through beats any description of a test strategy.

## 6. CI, with the project's own cost lesson applied

This repo has already learned this once. `simulation.yml` moved the Monte-Carlo files **off** the PR
gate because they were slow, expensive and losing a fight with vitest's reporter RPC, and its header
says the quiet part: *"a gate that fails for reasons unrelated to the code teaches people to ignore
the gate, which is worse than not having one."*

Apply it from day one rather than after the first red build:

| workflow | what runs | when |
|---|---|---|
| `ci.yml` (existing) | + e2e **smoke**, chromium, mobile viewport | every PR |
| `e2e-full.yml` (new) | the full matrix, visual, a11y | nightly + on demand |

A first-run-flake budget of zero: `retries: process.env.CI ? 1 : 0`, and **any spec that needs a
second retry to pass gets fixed or deleted, not tolerated.**

## 7. The risks, named

- **Flake.** The one real threat, in a project with a documented allergy to unreliable gates.
  Mitigations: determinism by construction, no `waitForTimeout` ever, `expect.poll` against engine
  state rather than sleeps, and the PR gate deliberately kept to smoke.
- **Fixture rot.** Saves are versioned and the schema moves most weeks (v41 → v44 in the last three
  days alone). The generator script is the answer, and it should run in the nightly job so a stale
  fixture is caught by a machine and not by a person.
- **The service worker.** Genuinely fiddly. Budget for it in S1 rather than discovering it in S3.
- **Time.** Four to five focused days for all four stages. S0 and S1 alone – about a day and a half –
  already give a working harness with instant state seeding, which is the part worth showing.

## 8. Why this is worth showing to a hiring panel

Most Playwright portfolios demonstrate that the candidate can drive a browser. The differentiators
here are the things teams actually struggle with:

- **a test-data strategy** – state injection through the product's own save format, rather than
  clicking through the UI to reach a state;
- **determinism as a design property** rather than a retry count;
- **an explicit layering decision** – four layers with a written statement of what each one owns and,
  more tellingly, what it must not duplicate;
- **cost-aware CI** – a fast gate and a thorough nightly, with the reasoning written down;
- **a live report with traces**, published, that someone can click through.

Section 2's table and section 6's reasoning are the parts to hand over. They say more about how
someone thinks than a hundred passing assertions do.

---
type: plan
status: draft
area: testing
canonical: false
last-reviewed: 2026-08-08
---

# Playwright: the fourth layer

**Status: S0, S1 and S2 built (06–09.08); S3's report built, its matrix not.** The coverage map –
what is covered, at which layer, and what is deliberately not – is
[`docs/specs/e2e-coverage.md`](../specs/e2e-coverage.md), and `e2e/coverage-map.spec.ts` keeps that
document honest against the repo. **18 tests, ~25 s.** Written 06.08.2026, when the repo had no
`@playwright/test`, no `e2e/` directory and exactly **zero** `data-testid` attributes – which was the
honest place to start from. **It still has zero:** the harness, the five fixtures and the seeding
fixture were all written against role and accessible name alone (§4), and the two places that came
closest are recorded where they were met rather than papered over with an attribute.

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
| **`e2e`** | **real Chromium** | **the seams between them** | **18** |

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

**AND THE JOIN, 08.08** – `e2e/careerAt.ts`, the typed fixture above, with one thin spec per career in
`e2e/seeded-careers.spec.ts`. The measurement the claim above rests on, taken rather than assumed:

| route to a career at week 412 | measured, 5+ runs |
|---|---|
| `careerAt('pro')` – seeded, booted, week and funds asserted on screen | **0.43–0.57 s** |
| the onboarding wizard alone, which reaches week **0** | 0.35–0.68 s |
| one press of the shipped `▶▶ 52 (dev)` fast-forward | 0.09–0.20 s, **and it does not advance 52 weeks** |

Two things worth saying, and the second is the real one.

**Seeding a week-412 career costs the same as creating an empty one.** Not "faster than clicking to
week 412" – the same as the cheapest thing the UI can do at all, which is why every scenario in §5
becomes affordable rather than merely cheaper.

**And the clicked route does not terminate unattended.** `▶▶ 52` returns in a tenth of a second
because it *stops at the first thing the engine has to show* – the press above came back with the
week's story open and two controls waiting to be dismissed. It is a fast-forward that halts on every
tournament, knock and question, exactly as `sim.worker.ts`'s tick guards intend, so "eight presses"
is not a route: it is hundreds of interactions, each of which has to be answered. Two attempts to
drive it to week 412 were abandoned at ten minutes. The argument for state injection is therefore not
a stopwatch at all – it is that the alternative is not automatable, and a stopwatch is what it looks
like from the outside.

## 4. Selector policy – decide it once, now

Zero `data-testid` exist. That is an opportunity to get the policy right rather than sprinkle them.

1. **Role and accessible name first** (`getByRole('button', { name: 'Continue' })`). It is
   Playwright's own recommendation and it doubles as an accessibility assertion: a control with no
   accessible name fails the test *and* is a real defect.
2. **`data-testid` only where the accessible name is dynamic or genuinely ambiguous** – tier chips,
   week cards, the rung strip. Add them deliberately, with a comment saying why, in the same spirit
   as every other decision in this codebase.
3. **Never CSS classes or DOM structure.** They change with every UI wave and this project has many.

**Measured after S1b, and the count is still zero.** Two of the three places S0 predicted a testid
would be needed were actually met, and neither one needed it:

- **Home's composite cards take their whole text as their accessible name.** The Family budget card
  is a `Card as="button"`, so `{ name: /^Family budget/ }` addresses it by the *start* of that name
  and the figure is asserted inside it with `toContainText`. Scoping was load-bearing rather than
  tidy: on `fresh` the starting funds also appear in the engine's first diary line, so an unscoped
  text match is a strict-mode violation – and the tempting fix is a testid on a control that already
  has a perfectly good name.
- **Landmarks are not unique, and that is the app being right.** `getByRole('navigation')` matched
  the epilogue's own album arrows as well as the tab bar. The fix was to ask a better question –
  name a control only the tab bar has – not to label the tab bar.

The third (country tiles carry a flag emoji) is unchanged: the smoke spec still clicks
`United States` by name.

## 5. The stages

Each is independently valuable and independently mergeable. Stop after any one of them and the
project is better off than before.

### S0 – the harness (half a day)

`@playwright/test`, `playwright.config.ts`, one smoke spec (`the app boots, a new career starts, week 1
renders`), `webServer` pointed at `vite preview` against a real production build. A CI job on the PR
gate: **chromium only, smoke only.** Trace and video on first retry, HTML report as an artefact.

The point of S0 is the harness, not the coverage. It proves the shape works before anything is built
on it.

### S1 – the fixture engine (one day) – BUILT

The `careerAt` fixture from section 3, the generator script, the five fixtures. Plus the two hazards
this app will hit and most apps do not – and a third that only showed up once the two halves met:

- **The service worker must be controlled.** ✅ `VITE_TB_SW=off` on the `webServer` (S0). Still holds
  across the extra navigations seeding adds; the smoke spec asserts no worker is registered, and the
  switch stays a switch for the S2 spec that needs it back on.
- **IndexedDB must be clean per test.** ✅ Isolated contexts give that, and `careerAt` clears
  `localStorage` in the same step and lets a spec write keys back. ⚠ The finding underneath it:
  clearing the marker is *not* the same as making it unseen. `inboxCue.ts` seeds a missing watermark
  to "now" on purpose, so `pro`'s two unopened letters raise the inbox dot through the engine's
  `offerOpen` and not through `letterUnseen`. A mail-marker spec has to pin the watermark behind the
  letters, and `CareerAtOptions` documents how.
- ⚠ **The store reads the database exactly once, and a late seed is silent.** `game.init()` calls
  `listCareers` one time; an empty answer hands the player to the wizard and nothing knocks again.
  IndexedDB writes are async, so "runs before the app's scripts" does not by itself mean "lands
  before the app's read" – and when it loses, no assertion fails, the spec just tests a fresh career.
  ✅ Closed by construction rather than by margin: the record is written **inside the
  `versionchange` transaction that creates the database**, and an `open` cannot complete while an
  upgrade transaction is running, so the app's own `openDB` blocks until the bytes are in. The same
  property makes the seed a one-shot, which is what keeps `addInitScript` from re-seeding on the
  reload that S2's persistence spec depends on.

### S2 – the journeys (two days) – BUILT, 09.08

Six journey specs on top of the harness, twelve tests, each stated as a sentence a non-engineer can
read. **The map is [`docs/specs/e2e-coverage.md`](../specs/e2e-coverage.md)** – per screen and per
mechanic, what is covered, at which layer and why, plus the section that makes the rest believable:
what is deliberately *not* covered end-to-end, with the reason.

Four things worth carrying forward from building it:

- **All six seams are now touched**, including #3. The service worker got the second `webServer` this
  plan predicted: a second production build in `dist-sw/` on port 4174, one project pinned to it,
  one spec. The other eleven specs keep the `VITE_TB_SW=off` build.
- **The load-bearing reload assertion is `week + 1`, not `week`.** A reload spec that asserted the
  *seeded* state would pass in three different broken worlds - no autosave, a silent re-seed, or a
  working one. Every persistence claim is on a week the fixture has never been at.
- **The selector policy paid a dividend nobody planned for.** Role-and-name only turned the journey
  work into a **defect list**: twelve real accessibility gaps, tabulated in §10 of the coverage
  document. Two of them (ambiguous `Enter`, unlabelled coach rows) are the direct cause of two
  coverage gaps - so the map records "not covered, and here is the defect that blocks it".
- **The count is still zero `data-testid`.**

The original list, kept for the record:

- a career survives a reload with its funds, rank and week intact *(worker + IndexedDB)*
- entering a tournament, playing it, and seeing the prize land in the ledger *(worker pipeline)*
- the sponsor window: a letter arrives, opens, is signed, and the deal shows on the money screen
- exporting a save and importing it into a second career slot *(file round trip)*
- the app works offline after one visit, and the update banner appears when a new build lands
- a corrupt save is refused and the storage-recovery UI offers the way out *(a path with real
  consequences and no coverage at all today)*

### S3 – the showcase layer (one to two days) – REPORTING BUILT, THE MATRIX NOT

`npm run test:e2e:report` runs the suite with a trace for **every** test, green ones included, and
opens the HTML report at the end. The default run stays fast and quiet - `trace: 'on-first-retry'`
records nothing on a green run - so the report is a second mode rather than a tax on every run.

⚠ **Visual regression is NOT built, and that is now a decision rather than a gap.** The argument
below still holds in theory, and the reason not to spend it is in `docs/specs/e2e-coverage.md` §6.6:
a screenshot suite goes red on every *intended* restyle, and this project restyles often. What
replaced it is two invariants at 375 px that hold for any design - the page does not scroll sideways,
and the Home season strip does not grow (measured: 148.9 px, ceiling 170). Those catch the two
layout failures this app has actually shipped, and they survive a repaint.

The rest of S3, unbuilt:

- **Visual regression that can actually pass.** Deterministic seed + fixed viewport + a stubbed
  clock. Snapshot the screens with real weight: a match in progress, the trophy cabinet, the
  season wrap-up, the album. Most visual suites fail here; this app's determinism is why this one
  will not.
- **Device matrix.** Mobile 576×1280 (the owner's actual phone), tablet, desktop – plus dark and
  light. The SEASON strip regression is a concrete thing to pin at mobile width.
- **Accessibility.** `@axe-core/playwright` over the main screens, failing on serious and critical.
  ⚠ *"Given the selector policy, most of this comes free"* was optimistic, and S2 measured it: the
  selector policy found **twelve** real gaps (coverage document §10), including five settings
  toggles whose only accessible name is `ON`/`OFF`. An axe run would land on a screen that is not
  ready for it. **Fix the twelve first** – that is a `src/` branch, not a test branch, and it is the
  single highest-value follow-up from this wave.
- **Publishing the report to GitHub Pages** beside the app. `npm run test:e2e:report` produces it
  locally today; nothing publishes it yet.

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

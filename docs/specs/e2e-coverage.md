---
type: specification
status: current
area: testing
canonical: false
last-reviewed: 2026-08-09
---

# End-to-end coverage: what is covered, at which layer, and why

This is the map of what the browser suite actually proves. It is written to be **shown** and to
**survive being questioned**, which are different requirements and the second is the harder one.

Two things follow from that, and they shape the whole document:

- **Every claim names its layer.** "Covered" without "by what" is not a claim, it is a mood.
- **Section 6 lists what is deliberately not covered end-to-end, with the reason.** That section is
  what makes the rest believable. A wall of green that hides its gaps fails twice over: it does not
  survive the first question, and it was never trustworthy to begin with.

The strategy behind it is [`docs/plans/playwright.md`](../plans/playwright.md); the fixture engine is
[`docs/plans/e2e-fixtures.md`](../plans/e2e-fixtures.md); the operating rules are
[`e2e/README.md`](../../e2e/README.md).

## 1. The four layers, and what each one owns

| layer | runs in | owns | size today |
|---|---|---|---|
| `unit` | node | engine arithmetic, ledgers, migrations, guards | 105 files |
| `component` | happy-dom, mounted | component behaviour and rendering | 9 files |
| `sim` | node, Monte-Carlo | balance calibration – weekly, **not** a PR gate | 9 files |
| **`e2e`** | **real Chromium, real production build** | **the seams between them** | **8 spec files** |

Sizes are point-in-time. The shape is the part that matters.

**The governing rule, and it is a rule about what NOT to write:**

> *A Playwright test that asserts a button's label is a slower duplicate of a test that already
> exists.*

Every spec in `e2e/` must answer one question: **which seam does this exercise, and why can no
cheaper layer reach it?** If the answer is "none", it belongs in `tests/component/`, where it runs in
milliseconds and is more precise about what broke. Each spec file carries that answer in its header.

**The six seams** – the whole reason this layer exists:

1. the **Web Worker boundary** – the engine runs in a worker and the UI only ever sees a `Snapshot`;
2. **persistence across a real reload** – `fake-indexeddb` is not IndexedDB;
3. the **service worker** – precache, offline, the update prompt;
4. **real layout at real sizes** – happy-dom has no layout engine at all;
5. **real input** – taps, tab bars, sheets, file pickers;
6. the **file round trip** – export a save, import one back.

## 2. The journeys, and the seam each one owns

<!-- COVERAGE-MAP:JOURNEYS -->
| spec | the journey, in one sentence | seam |
|---|---|---|
| `smoke.spec.ts` | the app boots, a new career starts, week 1 renders | 1 |
| `seeded-careers.spec.ts` | each of the five fixtures boots into the state its manifest describes | 1, 2 |
| `week-advance.spec.ts` | a decision on the table stops the week; answering it starts it, and the answer comes back as news | 1 |
| `week-advance.spec.ts` | a week that ends a season: the wrap-up card, then Home and the money screen move together | 1, 5 |
| `persistence.spec.ts` | a career reloads at the week it was **left** on, not the week it was seeded at | 1, 2 |
| `persistence.spec.ts` | the engine's tournament pause survives a reload and the app re-enters it by itself | 1, 2 |
| `tournament.spec.ts` | a tournament is revealed, played out, and its result reaches the feed and the ledger | 1, 5 |
| `save-file.spec.ts` | a career round-trips through a real file: out of the app, and back in | 6 |
| `save-file.spec.ts` | an untrusted file is refused at the door and the career on disk is untouched | 6 |
| `responsive.spec.ts` | at 375 px nothing scrolls sideways and the season strip stays short | 4 |
| `offline.spec.ts` | after one visit the app boots with the network cut | 3 |
| `coverage-map.spec.ts` | this document has not rotted (section 7) | – |
<!-- /COVERAGE-MAP:JOURNEYS -->

`e2e/journey.ts` carries the shared locator vocabulary and `e2e/careerAt.ts` the seeding fixture;
neither is a spec, so neither appears above.

Three of these deserve their argument spelled out, because they are the ones a reviewer should push
on.

**"The week it was left on, not the week it was seeded at."** Every fixture is injected straight into
IndexedDB before the app's first script runs. A reload test that asserted the *seeded* state would
pass in three different worlds: one where the autosave never happened, one where the reload silently
re-seeded, and one where persistence genuinely works. So the assertion is on a week the fixture has
**never been at** – reached by ticking once first. There is exactly one explanation for that number
being on screen after a reload.

**The tournament pause.** When a week lands on an event she has entered, the engine computes the
whole draw during the tick and parks the career on `world.pendingTournament`; the reveal is pure
presentation over a decision already written down. `App.vue` holds the overlay's visibility in a
plain `ref(false)` – nothing about the reveal is remembered by the UI. So after a reload the overlay
comes back **only** because the pause survived in the world, was rehydrated by a brand-new worker,
and arrived in the first snapshot the new page ever saw. A component test cannot make this claim: it
would have to hand itself the pending snapshot, which is the thing under test.

**The untrusted file.** `decodeExportFile` is the only place the app accepts bytes it did not write,
and it has a real guard chain – size cap, magic, declared version *before* anything is decompressed,
SHA-256, a bounded inflate, a bounds walk, a spine check, then migrations. `tests/` owns every rule
in isolation. What no unit test can own is that the rules are **wired to the door**: a perfect guard
nobody routes through protects nothing. So the spec drives a real file chooser, off the real button,
and asserts both halves – the refusal reaches the screen, **and the career on disk is untouched**.

## 3. Screens

Ten screens live in `src/components/screens/`. Six are touched end-to-end; four are not, on purpose.
Only five are reachable from the tab bar – the rest are content states with no route and no URL,
which is itself a reason some of them can only be reached this way.

<!-- COVERAGE-MAP:SCREENS -->
| screen | reached by | end-to-end | other layers | decision |
|---|---|---|---|---|
| `HomeScreen.vue` | tab `Home` | `week-advance`, `persistence`, `tournament`, `responsive`, `seeded-careers` | `component/home-strip-and-mail`, `component/round20-ui` | **e2e** – it is where the date line, the budget card and the news feed all read the same snapshot; the cross-screen claim has to start somewhere |
| `ThisWeekScreen.vue` | no tab – the app navigates here itself when a week resolves | `week-advance`, `tournament` | `component/week-recap-money` | **e2e** – arriving here is a navigation the app performs on its own after a worker round trip; nothing else can observe that |
| `MoneyScreen.vue` | no tab – Home's budget card | `week-advance`, `tournament`, `responsive` | `component/round20-ui` | **e2e** – second screen off the same snapshot, and the only proof the ledger is fed by the tick |
| `MoreScreen.vue` | no tab – the `Settings` gear | `save-file` | `component/round20-ui` | **e2e** – it owns both file doors, which is seam 6 |
| `SeasonScreen.vue` | tab `Season` | `responsive` (layout only) | `component/season-screen` | **partial** – layout at 375 px only. Entering an event through this screen is not covered; see 6.1 |
| `TrophiesScreen.vue` | tab `Trophies` | – | `component/endings-ui` (album) | **component** – a static cabinet rendered from a snapshot field; no seam of its own |
| `StatsScreen.vue` | tab `Stats` | – | unit (`two-ladders`, ranking tables) | **unit** – three ranking tables and a segmented switch; the arithmetic is unit-owned and the rendering has no worker in it |
| `CalendarScreen.vue` | tab `Calendar` | – | unit (`calendar-week-grid`) | **unit** – see 6.1; its `Enter` door duplicates SeasonScreen's and both are unentered here |
| `KidScreen.vue` | no tab – Home's avatar | – | `component/round20-ui` | **component** – a read-only profile; nothing crosses a boundary that Home does not already cross |
| `CoachMarketScreen.vue` | no tab – Home's coach card | – | unit (`what-a-coach-is-for`) | **not covered** – see 6.2, and this is the largest single gap |
<!-- /COVERAGE-MAP:SCREENS -->

## 4. Mechanics

<!-- COVERAGE-MAP:MECHANICS -->
| mechanic | spec | end-to-end | decision |
|---|---|---|---|
| The week tick and the sticky action bar | [season-planner.md](season-planner.md) | yes – `week-advance` | **e2e** – one click, one worker round trip, three screens repainted |
| Knocks: the decision that stops the week | [season-life-03-injuries.md](season-life-03-injuries.md) | yes – `week-advance` | **e2e** – the engine refuses to tick and the UI must show that refusal before the player presses anything |
| Tournament draw, reveal and result | [tournament-experience.md](tournament-experience.md) | yes – `tournament`, `persistence` | **e2e** – the longest loop in the app and the only one that pauses the world mid-command |
| Season roll-over and the wrap-up card | [season-mirror-2026-08.md](season-mirror-2026-08.md) | yes – `week-advance` | **e2e** – ~50 lines of accounting inside the worker; the card's contents are component-owned |
| The family budget and the ledger | [economy-wave.md](economy-wave.md) | partial – the ledger is reached and non-empty | **unit** – every figure is unit-owned; e2e asserts only that a week's money arrived |
| Ranking tables | [two-ladders.md](two-ladders.md) | partial – the rank chip renders from the snapshot | **unit** – three ladders, points, decay: all arithmetic |
| Save format, export and import | [career-contract-v1.md](career-contract-v1.md) | yes – `save-file` | **e2e** – the guard chain is unit-owned; the *door* is not reachable any other way |
| Offline and the precache | [ui-inventory.md](ui-inventory.md) | yes – `offline` | **e2e** – a second JS context installed by a real browser; nothing else can host it |
| The Home season strip | [home-season-strip.md](home-season-strip.md) | yes – `responsive` | **e2e** – a wrap regression, and happy-dom cannot wrap |
| Match engine: points, scoring, rallies | [phase1-match-engine.md](phase1-match-engine.md) | no | **unit + sim** – see 6.3 |
| Match visualisation | [phase2-match-viz.md](phase2-match-viz.md) | no | **component** – `match-viewer` is mounted and mutation-verified |
| Sponsor window, letters and the inbox | [sponsor-window-2026-08.md](sponsor-window-2026-08.md) | no | see 6.4 – **a real gap** |
| The coach market | [what-a-coach-is-for.md](what-a-coach-is-for.md) | no | see 6.2 – **a real gap** |
| Endings, the fork and the album | [endings-and-the-album.md](endings-and-the-album.md) | partial – `seeded-careers` proves the epilogue replaces the shell | **component** – `endings-ui`, `finale-applause` |
| Storage recovery | [career-contract-v1.md](career-contract-v1.md) | no | see 6.5 – **a real gap** |
| Skills, radar and development | [skills-radar.md](skills-radar.md) | no | **unit** – pure engine arithmetic with a read-only surface |
| The junior conveyor and the living field | [junior-conveyor.md](junior-conveyor.md) | no | **unit + sim** – a population model; there is nothing to click |
| Academy and equipment | [academy-support.md](academy-support.md) | no | **unit** – priced by the engine, surfaced as read-only rows |
<!-- /COVERAGE-MAP:MECHANICS -->

## 5. State injection: why the suite is affordable at all

A career at week 412 is eight seasons of decisions. The suite does not click there – it writes a
prepared save straight into IndexedDB **inside the database-creation transaction**, before the app's
first script runs, so the app's own `openDB` blocks until the bytes are in. Ordering is a guarantee,
not a margin.

| route to a career at week 412 | measured |
|---|---|
| `careerAt('pro')` – seeded, booted, week and funds asserted on screen | **0.43–0.57 s** |
| the onboarding wizard alone, which reaches week **0** | 0.35–0.68 s |
| the shipped `▶▶ 52 (dev)` fast-forward | does not terminate unattended |

The third row is the real argument. `▶▶ 52` halts at the first thing the engine has to show – every
tournament, knock and question – so "eight presses" is not a route, it is hundreds of interactions
each of which has to be answered. The case for state injection is not a stopwatch; it is that the
alternative is not automatable.

## 6. What is deliberately NOT covered end-to-end

This is the section that makes the rest of the document worth reading.

### 6.1 Entering a tournament through the UI

`tournament.spec.ts` plays an event the fixture was **already entered for**. Nothing in the suite
presses `Enter` on SeasonScreen or CalendarScreen, confirms the fee dialog, and watches the entry
appear.

**Why not:** both screens render `Enter` once per event card, so the control is ambiguous by name
alone and would need scoping by position – a DOM-structure dependency this suite refuses. The honest
fix is an accessible name that includes the event (`Enter the Junior Tour 60, May 9–15`), which is a
change to `src/` and belongs in its own branch.

**Risk accepted:** the entry command itself is unit-tested; what is unproven is that the two `Enter`
buttons are wired to it.

### 6.2 The coach market

Hiring, firing and re-pricing a coach is a real economic decision with a confirm dialog, and it has
**no end-to-end coverage at all**.

**Why not:** coach rows carry no `aria-label`; their accessible name is a run-on of name, fit, style,
uplift, load note and price, and the sort control's own name *changes when you press it*
(`Sort Best fit` ⇄ `Sort Price`). A spec written against those names would be pinned to copy, not to
behaviour.

**Risk accepted:** this is the largest single gap in the map, and it is an accessibility defect
before it is a testing one.

### 6.3 Match outcomes and scorelines

No spec asserts who wins, or any score. `tournament.spec.ts` deliberately takes `Skip all rounds`.

**Why not:** watching is minutes of animation whose content is the match engine's property (unit +
sim, including a Monte-Carlo calibration project) and whose rendering is `component/match-viewer`'s,
mounted and mutation-verified. The skip path runs the same engine over the same draw and reaches the
same world. Asserting a scoreline here would duplicate two layers and take a hostage from a third:
every balance wave would move it.

### 6.4 The sponsor window and the inbox

`pro` holds two unopened kit letters and the inbox opens, but no spec signs a deal and follows the
money to the budget screen.

**Why not:** honestly, time – this is the most valuable uncovered journey and the next one to write.
There is also a real subtlety recorded in `careerAt.ts`: `inboxCue.ts` seeds a missing watermark to
"now" on purpose, so a freshly seeded career shows the inbox dot through the engine's half of the
predicate and not through the arrival half. A mail spec has to pin the watermark behind the letters,
and `CareerAtOptions` documents how.

### 6.5 Storage recovery and the corrupt-database path

`game.phase === 'recovery'` renders a whole screen – *"Saved games can't be reached"*, with `Retry`,
`Import a save file` and `Start a new career`. Nothing exercises it.

**Why not:** reaching it means making a real IndexedDB fail in a controlled way mid-session, which is
a fixture the harness does not have yet. It is buildable – the seeding fixture already writes the
database by hand and could write a broken one – and it is the highest-value item after 6.4, because
it is a path with real consequences and no coverage at any layer.

### 6.6 Visual regression, the device matrix and axe

Planned as S3 in the strategy; not built. `responsive.spec.ts` covers exactly two invariants at one
narrow width – no sideways scroll, and one section that must not grow. There are **no screenshot
baselines in this repo**, deliberately: a screenshot suite goes red on every intended restyle, and
this project restyles often.

### 6.7 The update banner

`offline.spec.ts` proves the worker installs, precaches and serves. It does **not** prove the
`prompt`-mode update flow – a second build landing, `needRefresh` flipping, the banner appearing,
`Update` applying it. That needs two builds served in sequence on one origin, which the harness
cannot currently express.

### 6.8 Everything the other three layers already own

Not a gap – a rule. Component rendering, engine arithmetic, ledger figures, migrations, RNG
discipline and balance all have better homes, and duplicating them here would make this layer slower
and less precise while adding nothing.

## 7. The map cannot quietly rot

`e2e/coverage-map.spec.ts` reads **this file** and checks it against the repo:

- every `.vue` in `src/components/screens/` has a row in section 3 – **a new screen with no recorded
  coverage decision fails the suite**;
- every row in section 3 names a screen that still exists – a deleted screen cannot leave a row
  behind claiming coverage;
- every spec cited in section 4 resolves to a file that exists;
- every spec file in `e2e/` appears in section 2's journey table, and every file named there exists.

**What it cannot do, stated plainly:** it cannot notice a *new mechanic*. Section 4's rows are
authored by hand, because `docs/specs/` is not a machine-readable inventory – 70 of its 89 files
carry no frontmatter at all, and many are audits and triage notes rather than mechanics. So section 3
is guarded by construction and section 4 is guarded only against broken references. A map maintained
by hand lies within a month; this one lies more slowly, and only in one half, and now you know which.

## 8. What a save-schema bump costs this suite

The five fixtures are binaries in git, written at one schema version. When
`SAVE_SCHEMA_VERSION` moves:

```bash
npm run e2e:fixtures        # regenerate all five - about 4 s, byte-identical across runs
```

`tests/e2e-fixtures.test.ts` is the alarm and it is **designed to go red** on the bump, in the unit
project, in well under a second – before anyone opens a browser.

**Nothing in the browser suite hard-codes a schema version.** The one spec that needs a version reads
it from `e2e/fixtures/manifest.json` and adds one (`save-file.spec.ts`, the future-schema refusal),
so it keeps asking the right question with no edit. Weeks and funds are read from the manifest and
rendered through the app's own `weekDateLine` and `formatCents`.

**What a regeneration can still break, and how you will know:** two specs depend on fixture *state*
rather than fixture *facts*, and both say so in a comment at the point of use.

| dependency | who pins it | what red looks like |
|---|---|---|
| `junior` boots holding an unanswered knock | `week-advance.spec.ts`, first test | one named failure with an explanatory message |
| `pro` is one week from a season boundary | `week-advance.spec.ts`, second test | the wrap-up assertions fail together |

Both are deliberate canaries with the reasoning written at the assertion. The fix in either case is a
purpose-built fixture (a `season-eve`, a `knock-open`), not deleting the coverage.

## 9. Running it

```bash
npm run test:e2e              # the suite - builds twice, serves both, runs. ~15 s.
npm run test:e2e:report       # the same run, then opens the HTML report with traces
npm run test:e2e:ui           # the time-travel UI
npm run test:e2e -- -g "reload"   # one journey by name
npx playwright install chromium   # once per machine per Playwright release
```

The suite is **not** part of `npm run check` and must not become part of it: the pre-push gate is
already about four minutes and this is a browser suite. It runs as its own parallel job on the PR
gate (`.github/workflows/ci.yml`, `e2e-smoke`).

**The HTML report is the artefact.** `npm run test:e2e:report` produces a browsable report; traces
and video are recorded on the first retry and a screenshot on any failure. A trace is a scrubbable
recording – a DOM snapshot per action, the console, and the exact locator every step used.

## 10. The accessibility gaps this work found

The selector policy is role and accessible name only – no `data-testid` anywhere in this repo, and
this wave added none. That policy has a side effect worth having: **every element a test could not
reach is a real defect**, and writing the journeys produced a defect list rather than a workaround
list. These are reported as findings; none of them was fixed here, because `src/` was owned by other
branches during this wave.

| # | gap | where | consequence |
|---|---|---|---|
| 1 | **Modals are not modals.** The knock dialog blocks the whole page but exposes no `role="dialog"` – `getByRole('dialog')` returns nothing while it is open. The season wrap-up card is the same. | `KnockDialog`, `SeasonSummaryDialog` | a screen-reader user is not told a decision is blocking the app; a test must address it by its buttons |
| 2 | **The five settings toggles have no names.** `role="switch"` with `aria-checked`, but the visible row label is an unassociated sibling, so all five collapse to `ON`/`OFF`. | `MoreScreen.vue` | `getByRole('switch', { name: 'Sound effects' })` cannot work. The single worst gap in the app |
| 3 | **Coach rows carry no label**, and the sort control's name changes when pressed. | `CoachMarketScreen.vue` | the direct cause of gap 6.2 |
| 4 | **`Enter` is ambiguous** – one per event card, with no event in the name. | `SeasonScreen.vue`, `CalendarScreen.vue` | the direct cause of gap 6.1 |
| 5 | **Ledger and expense rows have no role.** `StatRow` renders bare `div`/`span`. | `MoneyScreen.vue` | the ledger can only be asserted by free text |
| 6 | **The season strip's tier chips have no role or label** – plain spans, state in CSS classes. | `HomeScreen.vue` | invisible to a screen reader; `responsive.spec.ts` has to measure the section between two headings instead |
| 7 | **Tabs announce no selected state.** No `aria-current`, `aria-selected` or `role="tab"`; the tab bar `<nav>` has no `aria-label`; the unread dots are empty spans. | `App.vue` | which tab is active cannot be asserted by role, and the dot cannot be asserted at all |
| 8 | **Tables have no accessible names** – standings, the About table, the news table. | `StatsScreen.vue`, `MoreScreen.vue`, `HomeScreen.vue` | `getByRole('table', { name })` never works |
| 9 | **Unlabelled text inputs** – placeholder only. | `SeasonScreen.vue` (seed), `MoreScreen.vue` (save name) | not reachable as named textboxes |
| 10 | **Date lines are plain `<p>`** on Home, Calendar and ThisWeek. | three screens | the app's most-asserted string has no role; specs match it as free text |
| 11 | **Duplicate names across live surfaces** – two `Dismiss` banners can coexist; `Load` means both a career and a slot; the week action label is rendered by both the sticky bar and CalendarScreen at once while a tournament is pending. | `App.vue`, `MoreScreen.vue`, `CalendarScreen.vue` | strict-mode collisions; every journey here stays on Home to avoid the last one |
| 12 | **`aria-label` on a non-interactive `div`** – inert, since a `div` has no role to carry it. | `TrophiesScreen.vue` | the not-yet-won cells are unreachable |

Gaps 2, 3 and 4 are the ones that cost coverage directly. Fixing 4 alone would unlock section 6.1.

## 11. The honest summary

- **Covered end-to-end:** the worker boundary, real persistence across a real reload including the
  engine's tournament pause, the full tournament loop, the season roll-over, the file round trip in
  both directions plus two refusals at the untrusted-input door, offline boot from the precache, and
  layout at the narrowest supported width.
- **Not covered end-to-end:** tournament entry through the UI, the coach market, the sponsor/inbox
  loop, storage recovery, the update banner, match outcomes, and visual regression.
- **Six of ten screens** are touched; four are not, each with a reason above.
- **The suite has never needed a retry**, and the flake budget is zero: a spec that needs one gets
  fixed or deleted.

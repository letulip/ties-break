---
type: specification
status: current
area: testing
canonical: false
last-reviewed: 2026-08-10
---

# Test approach and coverage report: the end-to-end level

This document is two ISTQB artefacts in one file, because they are useless apart:

- a **test approach** – the levels, the types, the techniques, the test basis and the automation
  architecture (ISTQB CTFL v4.0 §1.4, §2.2, §4; CT-TAE §2);
- a **coverage report with a residual-risk register** – what is covered, at which level, and what is
  knowingly not, with the risk stated and accepted (§5.2, §5.3).

It is written to be **shown** and to **survive being questioned**, which are different requirements
and the second is the harder one. Two consequences shape everything below:

- **Every claim names its level.** "Covered" without "by what" is not a claim, it is a mood.
- **§8 is a risk register, not an apology.** A coverage report that cannot name its own gaps is not
  evidence, and the ISTQB principle it would be breaking has a name: *testing shows the presence of
  defects, not their absence* (§1.3).

Related: the test strategy is [`docs/plans/playwright.md`](../plans/playwright.md); the test-data
component is [`docs/plans/e2e-fixtures.md`](../plans/e2e-fixtures.md); the working agreements are
[`e2e/README.md`](../../e2e/README.md).

## 1. Test levels (CTFL §2.2.1)

The repository runs four vitest/Playwright projects. Mapped onto the standard levels:

| project | ISTQB level | test environment | what it may assert | size |
|---|---|---|---|---|
| `unit` | **component testing** | node, no DOM | engine arithmetic, ledgers, migrations, invariants | 105 files |
| `component` | **component integration testing** | happy-dom, real mount | a component plus its composables, rendered | 12 files |
| `sim` | **system testing, non-functional** | node, Monte-Carlo | balance and long-run behaviour over seed populations | 9 files |
| **`e2e`** | **system testing, functional, through the UI** | **real Chromium, real production build** | **the integration seams no lower level contains** | **9 spec files** |

Sizes are point-in-time; the shape is the part that matters.

⚠ **`sim` is a test level boundary that is easy to misread.** It runs in node like `unit`, but it is
not component testing: it exercises the whole assembled engine over hundreds of simulated careers and
its assertions are statistical (rates, medians, distributions). It is **excluded from the PR gate by
design** and runs as a scheduled sweep – an explicit test-execution-schedule decision, not an
oversight.

## 2. Test types, and the rule that keeps the levels apart (CTFL §2.2.2)

| type | where it lives here |
|---|---|
| functional | all four levels |
| non-functional – performance/reliability | `sim` (balance envelopes), and the seeding budget in §6 |
| non-functional – portability | `e2e` (`offline.spec.ts`: service worker, precache) |
| non-functional – usability/accessibility | **partially covered; see §12** – the defect list exists, the automated axe pass does not |
| white-box | `unit` only |
| black-box | `component`, `sim`, `e2e` |
| change-related – confirmation | every fix in this repo ships with a test that was red first |
| change-related – regression | the whole of `unit` + `component`, run on every push |

**The governing rule of the e2e level, and it is a rule about what NOT to write:**

> *A Playwright test that asserts a button's label is a slower duplicate of a test that already
> exists.*

Every spec must answer: **which integration seam does this exercise, and why can no cheaper level
reach it?** If the answer is "none", it belongs one level down, where it runs in milliseconds and
localises the defect better. Each spec file carries that answer in its header.

This is ISTQB's *defect clustering* and *context* principles applied to test placement: coverage that
overlaps is not coverage, it is cost, and cost at this level is paid in wall-clock and in flake.

**The six seams** – the risk items that justify the level existing at all:

1. the **Web Worker boundary** – the engine runs in a worker; the UI only ever sees a `Snapshot`;
2. **persistence across a real reload** – `fake-indexeddb` is not IndexedDB;
3. the **service worker** – precache, offline, the update prompt;
4. **real layout at real sizes** – happy-dom has no layout engine at all;
5. **real input** – taps, tab bars, sheets, file pickers;
6. the **file round trip** – export a save, import one back.

## 3. Test basis and traceability (CTFL §1.4.3–1.4.4)

The **test basis** for this level is not a requirements document – there is no separate one. It is:

- `docs/specs/*.md`, one spec per shipped mechanic, each recording the owner's ruling and the
  measured behaviour. §7's mechanics table links every row to its spec, and that link **is** the
  traceability record.
- `docs/decisions.md`, the dated owner log, for anything a spec has not caught up with.
- The engine's own invariants in `CLAUDE.md` – notably RNG input-independence, which is a *fairness
  property* and therefore a test condition with no natural UI expression.

**Bidirectional traceability, and its honest limit.** Spec → test is machine-checked: §11's guard
resolves every link in the mechanics table and fails on a broken one. Test → spec is by convention
only: nothing forces a new mechanic to acquire a row. That asymmetry is stated again where it bites,
in §11, because a traceability claim that overstates itself is worse than none.

## 4. Test design techniques (CTFL §4)

Named honestly, including where the technique is *not* what a reader might assume.

| technique | applied where | example |
|---|---|---|
| **Equivalence partitioning** | fixture selection | the five career states are partitions of the career lifecycle: fresh / earning / professional / insolvent / ended. Not five arbitrary saves |
| **Boundary value analysis** | fixture construction | `broke` is `bankruptcyGraceWeeks - 1` – one week short of the latch, chosen as a boundary, not as "week 88". `pro` sits one week from a season roll-over |
| **State transition testing** | the week tick and the pause | the career is a state machine over `week`; `persistence.spec.ts` covers the transition *out of and back into* `pendingTournament`, which is the only state the UI can be resumed into |
| **Use case testing** | the journeys | each spec is one end-to-end user task, not a screen tour |
| **Checklist-based** | §7's screen and mechanic tables | the checklist is machine-enforced for screens (§11) |
| **Experience-based / error guessing** | the untrusted-file spec | two hostile inputs chosen from the guard chain's own failure modes |
| **White-box coverage criteria** | **deliberately not used at this level** | statement and branch coverage belong to `unit`. A line-coverage figure quoted for a browser suite measures how much code a click happens to touch, which is not a test-design criterion |

⚠ **The coverage criterion at this level is the SEAM, not the line.** §7 is expressed in seams,
screens and mechanics because those are the coverage items a reader can check and a reviewer can
dispute. A percentage would be less honest and less useful.

## 5. The test oracle

Most UI suites fight the oracle problem: no independent source says what the screen *should* read.
This system has three, and they are why the assertions can be exact rather than smoke-shaped.

1. **The engine is deterministic.** Same seed in, same career out, match for match. A fixture's
   content is reproducible, so an expected value is a fact rather than a snapshot of last Tuesday.
2. **`e2e/fixtures/manifest.json` is a separately-generated statement of truth** – seed, week, funds,
   rank – produced by the engine offline and read by the spec at runtime. The spec compares the
   screen against the manifest, formatted through the app's own `weekDateLine` and `formatCents`, so
   a formatting change moves both sides and a *behaviour* change moves one.
3. **The lower levels own the arithmetic.** This level never re-derives a number it could import.

**The one place the oracle is deliberately weak** is §8.3, match outcomes: who wins is the match
engine's property and asserting a scoreline here would take a hostage from the balance work.

## 6. Test data and the automation architecture (CT-TAE §2, the gTAA)

Mapped onto the generic Test Automation Architecture, because the interesting engineering is here:

| gTAA layer | this project |
|---|---|
| **Test generation** | `tools/e2e-fixtures.ts` – drives the real engine headlessly and *finds* career states by playing careers until one genuinely arrives |
| **Test definition** | the specs; `e2e/journey.ts` holds the shared locator vocabulary |
| **Test execution** | Playwright against a real production build |
| **Test adaptation** | `e2e/careerAt.ts` – writes a prepared save into IndexedDB **inside the database-creation transaction**, before the app's first script runs, so the app's own `openDB` blocks until the bytes are there. Ordering is a guarantee, not a margin |

**Test data management is the load-bearing design decision.** A career at week 412 is eight seasons
of decisions:

| route to a career at week 412 | measured |
|---|---|
| `careerAt('pro')` – seeded, booted, week and funds asserted on screen | **0.43–0.57 s** |
| the onboarding wizard alone, which reaches week **0** | 0.35–0.68 s |
| the shipped `▶▶ 52 (dev)` fast-forward | does not terminate unattended |

The third row is the real argument, and it is a testability argument rather than a speed one:
`▶▶ 52` halts at everything the engine must show – every tournament, knock and question – so "eight
presses" is hundreds of interactions, each needing an answer. **The alternative to state injection is
not a slow test; it is no test.**

⚠ **Fixtures are found, not forged.** No world is poked into shape; where a state is rare the
generator enumerates seeds and plays each career until one arrives, then records the seed. A state
nobody can reach in play is a state no test should assert on.

**Selector strategy:** role and accessible name only. This repository contains **zero**
`data-testid` attributes and this wave added none. The consequence is deliberate and is the source of
§12: every element a test cannot reach is a real accessibility defect, so writing the journeys
produced a *defect list* instead of a workaround list.

## 7. Coverage

### 7.1 Journeys, and the seam each one owns

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
| `coverage-map.spec.ts` | this document has not rotted (§11) | – |
<!-- /COVERAGE-MAP:JOURNEYS -->

`e2e/journey.ts` and `e2e/careerAt.ts` are architecture rather than specs, so neither appears above.

Three of these deserve their argument spelled out, because they are the ones a reviewer should push
on.

**"The week it was left on, not the week it was seeded at."** A reload test asserting the *seeded*
state would pass in three different worlds: one where the autosave never happened, one where the
reload silently re-seeded, and one where persistence genuinely works. So the assertion is on a week
the fixture has **never been at**, reached by ticking once first. There is exactly one explanation
for that number being on screen after a reload. **This is the difference between a test and a
demonstration**, and it is worth checking every seeded-state assertion in any suite for the same
flaw.

**The tournament pause.** When a week lands on an entered event the engine computes the whole draw
during the tick and parks the career on `world.pendingTournament`; the reveal is presentation over a
decision already written down. `App.vue` holds the overlay's visibility in a plain `ref(false)` –
nothing about the reveal is remembered by the UI. So after a reload the overlay returns **only**
because the pause survived in the world, was rehydrated by a brand-new worker, and arrived in the
first snapshot the new page ever saw. A component test cannot make this claim: it would have to hand
itself the pending snapshot, which is the thing under test.

**The untrusted file.** `decodeExportFile` is the only place the app accepts bytes it did not write,
and it has a real guard chain – size cap, magic, declared version *before* decompression, SHA-256, a
bounded inflate, a bounds walk, a spine check, then migrations. `unit` owns every rule in isolation.
What no unit test can own is that the rules are **wired to the door**: a perfect guard nobody routes
through protects nothing. The spec drives a real file chooser off the real button and asserts both
halves – the refusal reaches the screen, **and the career on disk is untouched**.

### 7.2 Screens

Ten screens live in `src/components/screens/`. Six are touched end-to-end; four are not, on purpose.
Only five are reachable from the tab bar – the rest are content states with no route and no URL,
which is itself a reason some can only be reached this way.

<!-- COVERAGE-MAP:SCREENS -->
| screen | reached by | end-to-end | other layers | decision |
|---|---|---|---|---|
| `HomeScreen.vue` | tab `Home` | `week-advance`, `persistence`, `tournament`, `responsive`, `seeded-careers` | `component/home-strip-and-mail`, `component/round20-ui` | **e2e** – it is where the date line, the budget card and the news feed all read the same snapshot; the cross-screen claim has to start somewhere |
| `ThisWeekScreen.vue` | no tab – the app navigates here itself when a week resolves | `week-advance`, `tournament` | `component/week-recap-money` | **e2e** – arriving here is a navigation the app performs on its own after a worker round trip; nothing else can observe that |
| `MoneyScreen.vue` | no tab – Home's budget card | `week-advance`, `tournament`, `responsive` | `component/round20-ui` | **e2e** – second screen off the same snapshot, and the only proof the ledger is fed by the tick |
| `MoreScreen.vue` | no tab – the `Settings` gear | `save-file` | `component/round20-ui` | **e2e** – it owns both file doors, which is seam 6 |
| `SeasonScreen.vue` | tab `Season` | `responsive` (layout only) | `component/season-screen` | **partial** – layout at 375 px only. Entering an event through this screen is not covered; see 8.1 |
| `TrophiesScreen.vue` | tab `Trophies` | – | `component/endings-ui` (album) | **component** – a static cabinet rendered from a snapshot field; no seam of its own |
| `StatsScreen.vue` | tab `Stats` | – | unit (`two-ladders`, ranking tables) | **unit** – three ranking tables and a segmented switch; the arithmetic is unit-owned and the rendering has no worker in it |
| `CalendarScreen.vue` | tab `Calendar` | – | unit (`calendar-week-grid`) | **unit** – see 8.1; its `Enter` door duplicates SeasonScreen's and both are unentered here |
| `KidScreen.vue` | no tab – Home's avatar | – | `component/round20-ui` | **component** – a read-only profile; nothing crosses a boundary that Home does not already cross |
| `CoachMarketScreen.vue` | no tab – Home's coach card | – | unit (`what-a-coach-is-for`) | **not covered** – see 8.2, and this is the largest single gap |
<!-- /COVERAGE-MAP:SCREENS -->

### 7.3 Mechanics, traced to their test basis

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
| Match engine: points, scoring, rallies | [phase1-match-engine.md](phase1-match-engine.md) | no | **unit + sim** – see 8.3 |
| Match visualisation | [phase2-match-viz.md](phase2-match-viz.md) | no | **component** – `match-viewer` is mounted and mutation-verified |
| Sponsor window, letters and the inbox | [sponsor-window-2026-08.md](sponsor-window-2026-08.md) | no | see 8.4 – **a real gap** |
| The coach market | [what-a-coach-is-for.md](what-a-coach-is-for.md) | no | see 8.2 – **a real gap** |
| Endings, the fork and the album | [endings-and-the-album.md](endings-and-the-album.md) | partial – `seeded-careers` proves the epilogue replaces the shell | **component** – `endings-ui`, `finale-applause` |
| Storage recovery | [career-contract-v1.md](career-contract-v1.md) | no | see 8.5 – **a real gap** |
| Skills, radar and development | [skills-radar.md](skills-radar.md) | no | **unit** – pure engine arithmetic with a read-only surface |
| The junior conveyor and the living field | [junior-conveyor.md](junior-conveyor.md) | no | **unit + sim** – a population model; there is nothing to click |
| Academy and equipment | [academy-support.md](academy-support.md) | no | **unit** – priced by the engine, surfaced as read-only rows |
<!-- /COVERAGE-MAP:MECHANICS -->

## 8. Residual product risk, accepted (CTFL §5.2)

Risk-based testing means the uncovered items are *chosen*, and the choice is recorded with its
reasoning so it can be re-taken when the risk changes. Impact and likelihood are this project's own
judgement, not an industry table.

| # | uncovered item | impact | likelihood | why not covered | mitigation in place |
|---|---|---|---|---|---|
| 8.1 | tournament entry through the UI | high | medium | blocked by defect D4 (ambiguous `Enter`) | the entry command is unit-tested; only the wiring is unproven |
| 8.2 | the coach market | high | medium | blocked by defect D3 (unlabelled rows, mutating sort name) | engine pricing is unit-tested; the screen has no coverage at all |
| 8.3 | match outcomes and scorelines | low | low | owned by `unit` + `sim` + `component`; asserting here would duplicate two levels and hostage a third | `tournament.spec.ts` takes `Skip all rounds`, which runs the same engine over the same draw |
| 8.4 | sponsor window and inbox | medium | medium | time – the next journey to write | `pro` holds two unopened letters, so the fixture is ready |
| 8.5 | storage recovery (`phase === 'recovery'`) | high | low | needs a controllably-broken IndexedDB, a fixture the harness lacks | **none – no coverage at any level.** The highest-value item after 8.4 |
| 8.6 | visual regression, device matrix, axe | medium | high | no screenshot baselines, deliberately: a screenshot suite goes red on every intended restyle, and this project restyles often | `responsive.spec.ts` covers two invariants at 375 px |
| 8.7 | the update banner (`prompt` mode) | medium | medium | needs two builds served in sequence on one origin; the harness cannot express it | `offline.spec.ts` proves install, precache and serve |

**8.8 – everything the other three levels already own** is not a gap, it is the rule from §2.
Duplicating component rendering, engine arithmetic, ledger figures, migrations or balance here would
make this level slower and less precise while adding nothing.

⚠ **Two of these gaps are caused by defects, not by effort.** 8.1 and 8.2 are downstream of D3 and
D4 in §12. Fixing D4 alone unlocks 8.1. That is the most useful single sentence in this document for
anyone deciding what to do next.

## 9. Entry and exit criteria (CTFL §5.1.3)

**Entry criteria for a run:** a production build (`npm run test:e2e` builds twice and serves both –
one standard, one with the service worker for the `chromium-sw` project); Chromium installed for the
current Playwright release.

**Exit criteria for the level:**

- every spec green with **zero retries**. The flake budget is zero: a spec that needs a retry gets
  fixed or deleted. `retries` is 1 on CI and 0 locally, and the CI allowance exists to *report* flake,
  not to tolerate it;
- every new screen has a coverage decision recorded (machine-enforced, §11);
- no `data-testid` introduced;
- any element a spec could not reach is filed as a defect, not worked around.

**The suite is deliberately NOT part of `npm run check`.** The pre-push gate is already about four
minutes; this is a browser suite and belongs in its own parallel CI job (`e2e-smoke`). That is a
test-execution-schedule decision and it is the reason the gate stays fast enough to be run.

## 10. Maintenance testing: the impact of a schema change (CTFL §2.3)

The five fixtures are binaries in git, written at one schema version. Impact analysis for a
`SAVE_SCHEMA_VERSION` bump:

```bash
npm run e2e:fixtures        # regenerate all five - about 4 s, byte-identical across runs
```

`tests/e2e-fixtures.test.ts` is the alarm and it is **designed to go red** on the bump, in the `unit`
project, in well under a second – before anyone opens a browser. Shift-left applied to test data.

**Nothing in the browser suite hard-codes a schema version.** The one spec that needs a version reads
it from the manifest and adds one (`save-file.spec.ts`, the future-schema refusal), so it keeps
asking the right question with no edit.

**What a regeneration can still break**, and how you will know – two specs depend on fixture *state*
rather than fixture *facts*, and both say so at the point of use:

| dependency | who pins it | what red looks like |
|---|---|---|
| `junior` boots holding an unanswered knock | `week-advance.spec.ts`, first test | one named failure with an explanatory message |
| `pro` is one week from a season boundary | `week-advance.spec.ts`, second test | the wrap-up assertions fail together |

Both are deliberate canaries. The fix in either case is a purpose-built fixture (a `season-eve`, a
`knock-open`), never deleting the coverage.

## 11. Static testing: the map that cannot quietly rot (CTFL §3)

`e2e/coverage-map.spec.ts` performs static analysis on **this document** against the repository:

- every `.vue` in `src/components/screens/` has a row in §7.2 – **a new screen with no recorded
  coverage decision fails the suite**;
- every row in §7.2 names a screen that still exists;
- every spec cited in §7.3 resolves to a file that exists;
- every spec file in `e2e/` appears in §7.1, and every file named there exists.

It is mutation-verified in three directions.

**What it cannot do, stated plainly:** it cannot notice a *new mechanic*. §7.3's rows are authored by
hand because `docs/specs/` is not a machine-readable inventory – 70 of its 89 files carry no
frontmatter, and many are audits rather than mechanics. So §7.2 is guarded by construction and §7.3
is guarded only against broken references. **A map maintained by hand lies within a month; this one
lies more slowly, in one half only, and now you know which half.**

## 12. Defect reports raised by writing this level (CTFL §5.5)

The role-and-name selector policy has a side effect worth having: **every element a test could not
reach is a real defect.** None was fixed in this wave – `src/` was owned by other branches – so these
are reported, not resolved. Severity is the accessibility impact; priority is what it costs coverage.

| # | defect | component | severity | priority | consequence |
|---|---|---|---|---|---|
| D1 | **Modals are not modals.** The knock dialog blocks the page but exposes no `role="dialog"`; `getByRole('dialog')` returns nothing while it is open. The wrap-up card is the same | `KnockDialog`, `SeasonSummaryDialog` | high | medium | a screen-reader user is not told a decision is blocking the app |
| D2 | **Five settings toggles have no names** – `role="switch"` with the visible label an unassociated sibling, so all five collapse to `ON`/`OFF` | `MoreScreen.vue` | high | low | `getByRole('switch', { name: 'Sound effects' })` cannot work |
| D3 | **Coach rows carry no label**, and the sort control's accessible name changes when pressed (`Sort Best fit` ⇄ `Sort Price`) | `CoachMarketScreen.vue` | medium | **high** | direct cause of gap 8.2 |
| D4 | **`Enter` is ambiguous** – one per event card, with no event in the name | `SeasonScreen.vue`, `CalendarScreen.vue` | medium | **high** | direct cause of gap 8.1 |
| D5 | Ledger and expense rows have no role – `StatRow` renders bare `div`/`span` | `MoneyScreen.vue` | medium | low | the ledger can only be asserted as free text |
| D6 | Season-strip tier chips have no role or label; state lives in CSS classes | `HomeScreen.vue` | medium | low | invisible to a screen reader |
| D7 | Tabs announce no selected state; the tab bar `<nav>` has no label; unread dots are empty spans | `App.vue` | high | medium | the active tab cannot be asserted by role; the dot cannot be asserted at all |
| D8 | Tables have no accessible names | `StatsScreen.vue`, `MoreScreen.vue`, `HomeScreen.vue` | medium | low | `getByRole('table', { name })` never works |
| D9 | Unlabelled text inputs – placeholder only | `SeasonScreen.vue`, `MoreScreen.vue` | medium | low | not reachable as named textboxes |
| D10 | Date lines are plain `<p>` on three screens | Home, Calendar, ThisWeek | low | medium | the app's most-asserted string has no role |
| D11 | Duplicate names across live surfaces – two `Dismiss` banners can coexist; `Load` means both a career and a slot | `App.vue`, `MoreScreen.vue`, `CalendarScreen.vue` | low | medium | strict-mode collisions; every journey stays on Home to avoid the last one |
| D12 | `aria-label` on a non-interactive `div` – inert, a `div` has no role to carry it | `TrophiesScreen.vue` | low | low | the not-yet-won cells are unreachable |

**D3 and D4 are the highest-priority items in this document**, not because they are the worst
accessibility defects – D1, D2 and D7 are – but because they are the two that cost coverage.

## 13. Metrics (CTFL §5.3)

| metric | value |
|---|---|
| test cases at this level | 18, in 9 spec files |
| execution time | ~17 s local, parallel across 5 workers |
| retries used | **0** |
| screens with a recorded coverage decision | 10 of 10 (machine-enforced) |
| screens touched end-to-end | 6 of 10 |
| mechanics with an e2e claim | 8 of 18 covered, 4 partial, 6 delegated |
| accepted risk items | 7, each with impact, likelihood and reason |
| defects raised by this work | 12, none fixed here |
| `data-testid` in the repository | 0 |

**Coverage is deliberately not reported as a percentage.** A single number over levels this different
would be an average of incomparable things, and the ISTQB warning it would be walking into is the
*absence-of-errors fallacy*: a green suite over the wrong coverage items is not quality.

## 14. The principles this level is built on (CTFL §1.3)

Four of the seven do real work here and are worth naming, because each one shows up as a concrete
decision above rather than as a motto:

- **Testing shows the presence of defects, not their absence.** Hence §8 and §12, and hence the
  refusal to publish a coverage percentage.
- **Exhaustive testing is impossible.** Hence risk-based selection, and hence the rule in §2 that
  sends anything a cheaper level can own back down.
- **Early testing saves time and money.** Hence the schema alarm in §10 firing in the `unit` project
  in under a second, before a browser is ever launched.
- **Tests wear out (the pesticide paradox).** Hence §11's static guard against this document rotting,
  and hence the fixture canaries in §10 – both exist because a suite that stops being re-examined
  stops finding anything.

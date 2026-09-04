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

| project | ISTQB level | test environment | what it may assert |
|---|---|---|---|
| `unit` | **component testing** | node, no DOM | engine arithmetic, ledgers, migrations, invariants |
| `component` | **component integration testing** | happy-dom, real mount | a component plus its composables, rendered |
| `sim` | **system testing, non-functional** | node, Monte-Carlo | balance and long-run behaviour over seed populations |
| **`e2e`** | **system testing, functional, through the UI** | **real Chromium, real production build** | **the integration seams no lower level contains** |

⚠ **The size column was here and has been removed (02.09).** It carried a point-in-time count per
project, the table said so, and all four had rotted anyway – by a factor of eight on `component`.
The shape is the part that matters and it is the part that is stable; every runner prints its own
file and test totals, which is the only figure that cannot be wrong.

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
| **Equivalence partitioning** | fixture selection | the six career states are partitions of the career lifecycle: fresh / earning / professional / **sinking** / insolvent / ended. Not six arbitrary saves – and `sinking` and `broke` are two points on ONE partition, kept apart because the boundary between them is the bankruptcy latch |
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

⚠ **And the storage-recovery journey does not break that rule, which is worth stating because it
looks as though it might.** `careerAt` grew two options on 10.08 – `storage: 'unreachable'` and
`autosave: 'damaged'` – and both arrange the **database around** an ordinary fixture rather than the
career inside it. Every world seeded is one the engine played out and the shipped codec encoded; what
varies is which version the database is at, and whether the newest of the two autosave generations
survived its write. Both are things a real browser does to a real player, on paths `src/db/saves.ts`
already carries code for. **The rule is about worlds, and no world here is invented.** The
distinction is written out at length on those two types in `e2e/careerAt.ts`, because "the harness
can now break things" is exactly the licence that would end the rule if it were not bounded.

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
| `prologue.spec.ts` | the childhood's nine cards run, the handover draws her, «go on» starts the career – and no tour follows it | 1, 5 |
| `seeded-careers.spec.ts` | each of the six fixtures boots into the state its manifest describes | 1, 2 |
| `week-advance.spec.ts` | a decision on the table stops the week; answering it starts it, and the answer comes back as news | 1 |
| `week-advance.spec.ts` | a week that ends a season: the wrap-up card, then Home and the money screen move together | 1, 5 |
| `week-advance.spec.ts` | a week that stops **without** ending: the reason, the engine's own count, and which notice it is | 1 |
| `persistence.spec.ts` | a career reloads at the week it was **left** on, not the week it was seeded at | 1, 2 |
| `persistence.spec.ts` | the engine's tournament pause survives a reload and the app re-enters it by itself | 1, 2 |
| `tournament-entry.spec.ts` | an event is entered on Season, and Home and the Calendar both say so – three readers, one snapshot | 1, 5 |
| `tournament.spec.ts` | a tournament is revealed, played out, and its result reaches the feed and the ledger | 1, 5 |
| `sponsor-inbox.spec.ts` | a kit letter is signed: the whole table closes, and the contract turns up on the money screen | 1, 5 |
| `storage-recovery.spec.ts` | a database this build cannot open becomes a screen with three doors, not a fresh install | 2 |
| `storage-recovery.spec.ts` | Retry finds the career again once storage comes back – in the same document, with no reload | 2, 1 |
| `storage-recovery.spec.ts` | a damaged newest autosave falls back to the previous generation, and the shell says so | 2, 1 |
| `save-file.spec.ts` | a career round-trips through a real file: out of the app, and back in | 6 |
| `save-file.spec.ts` | an untrusted file is refused at the door and the career on disk is untouched | 6 |
| `onboarding-tour.spec.ts` | a new player is shown the interface tour, walks it, and dismisses it | 2, 5 |
| `onboarding-tour.spec.ts` | it does not come back on the next boot – and an *unanswered* one still does | 2 |
| `onboarding-tour.spec.ts` | changing tab ends the tour instead of describing a screen the player has left | 4, 5 |
| `onboarding-tour.spec.ts` | ...and More still brings it back after the screen change took it away | 2, 5 |
| `onboarding-tour.spec.ts` | More can ask for the tour again, and asking moves the player to Home | 2, 5 |
| `responsive.spec.ts` | at 375 px nothing scrolls sideways and the season strip stays short | 4 |
| `responsive.spec.ts` | the last card of a week that stacks several rungs is reached by KEYBOARD alone and by pressing an arrow; and at 1280 – where three cards fit, so a two-card week has nothing past its edge – the week draws NO pager (owner's ruling, round 36 phase 7) while the strip stays a tab stop and Left/Right still reach it | 4 |
| `parity.spec.ts` | every screen makes the same controls, headings, figures and icons REACHABLE at 375, 768, 900 and 1280 – every disclosure on the screen is opened before the fingerprint is taken, so «1 к 1 по доступности» is what is measured rather than what is painted on arrival (round 36 phase 3) | 4 |
| `parity.spec.ts` | every screen in `src/components/screens/` has a station in that walk – the list is derived, never written out | 4 |
| `parity.spec.ts` | two rooms behind Money's chapter row, one week that STACKS several rungs, and **the LIVE MATCH on the court** are walked too – a screen file is the derivation's unit, so a state it never reaches is a state it cannot answer for (round 36 phases 4 and 5, and item 17: `MatchViewer.vue` is not in `src/components/screens/` at all, so the match had never been fingerprinted) | 4 |
| `parity.spec.ts` | the desktop rail's DASHBOARD is the one region exempt from that comparison (owner's ruling, round 36 phase 6) – and the exemption is bounded: it is asserted by CONTAINER, that container must hold no control, every figure it shows must exist somewhere at 375, and the same set must be in the strip on every page | 4 |
| `parity.spec.ts` | the week pager's ARROWS are the second and last exempt region (owner's ruling, round 36 phase 7 – they are drawn only where a strip overflows, which depends on the width) – bounded the same four ways: asserted by CONTAINER, that container may hold nothing but the two arrows, only the arrows are taken (the strip, the cards and their controls stay in the check), and the HONEST HALF – a strip that DOES overflow at a width must have them | 4 |
| `offline.spec.ts` | after one visit the app boots with the network cut | 3 |
| `coverage-map.spec.ts` | this document has not rotted (§11) | – |
<!-- /COVERAGE-MAP:JOURNEYS -->

`e2e/journey.ts` and `e2e/careerAt.ts` are architecture rather than specs, so neither appears above.

Six of these deserve their argument spelled out, because they are the ones a reviewer should push
on. The first three were written in the S2 wave; the last three closed §8's writable gaps on 10.08.

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

**Three readers, one snapshot (tournament entry).** The temptation in an entry journey is to assert
that the card changed, which a mounted test already owns. What it cannot own is *agreement*: after
the press, Season's card, Home's next-tournament card and the Calendar's takeover each read the same
new snapshot **and compose it independently** – Home builds its caption from `weekRange(event.week)`,
which is the same function `enterActionName` used to build the button the spec pressed, arrived at by
a different path. A mounted test would hand all three the same object by construction, which is the
thing in question. The spec also asserts that the feed's `Enter` controls all answer to **different
names**, which is defect D4 stated as the thing it cost: a feed is the only place two names can
collide, and a component test renders one card at a time.

**One signature closes the whole table (the sponsor inbox).** `signOffer` does not only sign the
letter it was handed – it walks every other open kit offer and refuses it, because a player in one
brand's kit is in nobody else's. So one press has to be observable **on a letter the player never
touched**, and there is nothing on the other side of a mounted `InboxSheet` to close it. The same
command then produces `snapshot.kitDeal`, which a different screen renders as a running allowance.
The terms are not asserted: what a rung is worth and how the pot is spent down are engine arithmetic,
owned two levels below.

**Storage that refuses (recovery).** The two faults here are the ones the *browser* commits, and
`fake-indexeddb` is not IndexedDB in the way that matters: a database at a version this build cannot
open is refused by a rule that lives in the storage layer, not in the app. Two claims follow that no
other level can make. The first is an **absence** – no onboarding wizard – and it is the exact
historical bug `game.init()`'s comment records: the old probe swallowed a failed reply, so "IndexedDB
denied" arrived as "fresh install" and a player with years of saves was handed the six-step wizard
with nothing looking wrong. The second is that **Retry succeeds in a page that never navigated**,
which is the only shape of evidence the TB-06 fix has: `src/db/saves.ts` used to memoise its
*rejected* open, so one denied open at boot poisoned every later call until the tab was reloaded – and
a reload proves nothing, because a reload works either way.

### 7.2 Screens

Ten screens live in `src/components/screens/`. Six are touched end-to-end; four are not, on purpose.
Only five are reachable from the tab bar – the rest are content states with no route and no URL,
which is itself a reason some can only be reached this way.

⚠ **The count did not move on 10.08 but two rows changed character, which matters more.**
`SeasonScreen` was reached only by `responsive`, at 375 px, with nothing pressed on it – "touched"
in the weakest sense the word has. It is now a screen a command is issued from. `CalendarScreen` had
no row of its own at all and now serves as the third reader in the entry journey. A table that
counted both before and after would have reported no change, which is why the decision column says
what kind of coverage each row has rather than only whether it has any.

<!-- COVERAGE-MAP:SCREENS -->
| screen | reached by | end-to-end | other layers | decision |
|---|---|---|---|---|
| `HomeScreen.vue` | tab `Home` | `week-advance`, `persistence`, `tournament`, `tournament-entry`, `sponsor-inbox`, `storage-recovery`, `responsive`, `seeded-careers`, `parity` (presence at four widths) | `component/home-strip-and-mail`, `component/round20-ui` | **e2e** – it is where the date line, the budget card, the next-tournament card, the inbox and the news feed all read the same snapshot; the cross-screen claim has to start somewhere |
| `ThisWeekScreen.vue` | no tab – the app navigates here itself when a week resolves | `week-advance`, `tournament`, `parity` (presence at four widths) | `component/week-recap-money` | **e2e** – arriving here is a navigation the app performs on its own after a worker round trip; nothing else can observe that |
| `MoneyScreen.vue` | no tab – Home's budget card | `week-advance`, `tournament`, `sponsor-inbox`, `responsive`, `parity` (presence at four widths, **and two rooms behind the chapter row: the shop's front door and one shelf** – round 36 phase 4) | `component/round20-ui` | **e2e** – second screen off the same snapshot: the only proof the ledger is fed by the tick, and the only proof a signature becomes a contract |
| `MoreScreen.vue` | no tab – the `Settings` gear | `save-file`, `parity` (presence at four widths) | `component/round20-ui` | **e2e** – it owns both file doors, which is seam 6 |
| `SeasonScreen.vue` | tab `Season` | `tournament-entry`, `responsive` (layout only), `parity` (presence at four widths) | `component/season-screen` | **e2e** – entering an event is a command whose result three screens have to agree about; the feed is also the only place two `Enter` names can collide (D4) |
| `TrophiesScreen.vue` | tab `Trophies` | `parity` (presence at four widths) | `component/endings-ui` (album) | **component** – a static cabinet rendered from a snapshot field; no seam of its own |
| `StatsScreen.vue` | tab `Stats` | `parity` (presence at four widths) | unit (`two-ladders`, ranking tables) | **unit** – three ranking tables and a segmented switch; the arithmetic is unit-owned and the rendering has no worker in it |
| `CalendarScreen.vue` | tab `Calendar` | `tournament-entry` (the takeover, as the third reader), `parity` (presence at four widths) | unit (`calendar-week-grid`) | **partial** – it is read as a second surface on an entry made elsewhere. Entering *through* its own takeover is not covered and does not need to be: it is the same command behind the same shared name |
| `KidScreen.vue` | no tab – Home's avatar | `parity` (presence at four widths) | `component/round20-ui` | **component** – a read-only profile; nothing crosses a boundary that Home does not already cross |
| `CoachMarketScreen.vue` | no tab – Home's coach card | `parity` (presence at four widths) | unit (`what-a-coach-is-for`) | **partial** – no journey of its own (see 8.2: unblocked and deliberately deferred, the screen is being rebuilt). Round 36 phase 1 walks it for PRESENCE at four widths, which is a parity claim and not a behaviour one |
<!-- /COVERAGE-MAP:SCREENS -->

### 7.3 Mechanics, traced to their test basis

<!-- COVERAGE-MAP:MECHANICS -->
| mechanic | spec | end-to-end | decision |
|---|---|---|---|
| The week tick and the sticky action bar | [season-planner.md](season-planner.md) | yes – `week-advance` | **e2e** – one click, one worker round trip, three screens repainted |
| Knocks: the decision that stops the week | [season-life-03-injuries.md](season-life-03-injuries.md) | yes – `week-advance` | **e2e** – the engine refuses to tick and the UI must show that refusal before the player presses anything |
| Tournament entry through the UI | [season-planner.md](season-planner.md) | yes – `tournament-entry` | **e2e** – one command, three screens that must agree about its result, and a spend with no tick behind it |
| Tournament draw, reveal and result | [tournament-experience.md](tournament-experience.md) | yes – `tournament`, `persistence` | **e2e** – the longest loop in the app and the only one that pauses the world mid-command |
| A week that stops and says why | [season-planner.md](season-planner.md) | yes – `week-advance` | **e2e** – the shell's banner is unmountable below this level (`virtual:pwa-register`), and the count on it is the engine's `snapshot.debt`. The warning phase the count belongs to is [adult-tour-and-endings.md](adult-tour-and-endings.md) |
| Season roll-over and the wrap-up card | [season-mirror-2026-08.md](season-mirror-2026-08.md) | yes – `week-advance` | **e2e** – ~50 lines of accounting inside the worker; the card's contents are component-owned |
| The family budget and the ledger | [economy-wave.md](economy-wave.md) | partial – the ledger is reached and non-empty | **unit** – every figure is unit-owned; e2e asserts only that a week's money arrived |
| Ranking tables | [two-ladders.md](two-ladders.md) | partial – the rank chip renders from the snapshot | **unit** – three ladders, points, decay: all arithmetic |
| Save format, export and import | [career-contract-v1.md](career-contract-v1.md) | yes – `save-file` | **e2e** – the guard chain is unit-owned; the *door* is not reachable any other way |
| Offline and the precache | [ui-inventory.md](ui-inventory.md) | yes – `offline` | **e2e** – a second JS context installed by a real browser; nothing else can host it |
| The Home season strip | [home-season-strip.md](home-season-strip.md) | yes – `responsive` | **e2e** – a wrap regression, and happy-dom cannot wrap |
| Match engine: points, scoring, rallies | [phase1-match-engine.md](phase1-match-engine.md) | no | **unit + sim** – see 8.3 |
| Match visualisation | [phase2-match-viz.md](phase2-match-viz.md) | no | **component** – `match-viewer` is mounted and mutation-verified |
| Sponsor window, letters and the inbox | [sponsor-window-2026-08.md](sponsor-window-2026-08.md) | yes – `sponsor-inbox` | **e2e** – one signature has to close a letter nobody touched and raise a contract on another screen; the terms stay unit-owned. The sheet's own spec is [offers-and-the-inbox.md](offers-and-the-inbox.md) |
| The coach market | [what-a-coach-is-for.md](what-a-coach-is-for.md) | no | see 8.2 – **a real gap**, unblocked and deliberately deferred |
| Endings, the fork and the album | [endings-and-the-album.md](endings-and-the-album.md) | partial – `seeded-careers` proves the epilogue replaces the shell | **component** – `endings-ui`, `finale-applause` |
| Storage recovery | [career-contract-v1.md](career-contract-v1.md) | yes – `storage-recovery` | **e2e** – a real IndexedDB refusing a real open, and a real SHA-256 failing on a real generation. Nothing below this level has either |
| Skills, radar and development | [skills-radar.md](skills-radar.md) | no | **unit** – pure engine arithmetic with a read-only surface |
| The junior conveyor and the living field | [junior-conveyor.md](junior-conveyor.md) | no | **unit + sim** – a population model; there is nothing to click |
| Academy and equipment | [academy-support.md](academy-support.md) | no | **unit** – priced by the engine, surfaced as read-only rows |
| The first-run tour of the interface | [onboarding-tour.md](onboarding-tour.md) | yes – `onboarding-tour` | **e2e** – the whole defect was about what survives a reload, so a mounted test cannot hold it; the marks' copy, the walk and the card's box on a phone stay in `tests/component/onboarding-tour.test.ts` |
<!-- /COVERAGE-MAP:MECHANICS -->

## 8. Residual product risk, accepted (CTFL §5.2)

Risk-based testing means the uncovered items are *chosen*, and the choice is recorded with its
reasoning so it can be re-taken when the risk changes. Impact and likelihood are this project's own
judgement, not an industry table.

| # | uncovered item | impact | likelihood | why not covered | mitigation in place |
|---|---|---|---|---|---|
| ~~8.1~~ | ~~tournament entry through the UI~~ | high | medium | **CLOSED 10.08** – `tournament-entry.spec.ts`, once D4 made the controls nameable | – |
| 8.2 | the coach market | high | medium | **unblocked (D3 is closed) and deliberately DEFERRED** – see the note below | engine pricing is unit-tested; the screen has no coverage at all |
| 8.3 | match outcomes and scorelines | low | low | owned by `unit` + `sim` + `component`; asserting here would duplicate two levels and hostage a third | `tournament.spec.ts` takes `Skip all rounds`, which runs the same engine over the same draw |
| ~~8.4~~ | ~~sponsor window and inbox~~ | medium | medium | **CLOSED 10.08** – `sponsor-inbox.spec.ts`. The terms remain unit-owned and are not asserted here | – |
| ~~8.5~~ | ~~storage recovery (`phase === 'recovery'`)~~ | high | low | **CLOSED 10.08** – `storage-recovery.spec.ts`, three tests. The broken database is an *environment* option on `careerAt`, not a forged world | – |
| 8.6 | visual regression, device matrix, axe | medium | high | no screenshot baselines, deliberately: a screenshot suite goes red on every intended restyle, and this project restyles often | `responsive.spec.ts` covers two invariants at 375 px |
| 8.7 | the update banner (`prompt` mode) | medium | medium | needs two builds served in sequence on one origin; **the Playwright harness still cannot express it**, but ⚠ the "cannot" is now narrower than it reads – `tools/precache-delta.mjs` (round 29 part two #7) does serve two builds in sequence on one origin and drives a real Chromium through the second install. What it does NOT do is press the banner: it stops at `registration.waiting`, which is where the UI's job starts | `offline.spec.ts` proves install, precache and serve; `tools/precache-delta.mjs` proves the second install fetches only what changed (1 file of 205, measured) |
| 8.9 | the other three stop reasons – `deadline`, `medical`, `walkover` | low | medium | `funds` is the only one a fixture can hold deterministically; the other three are injury- and calendar-dependent, which is a coin toss rather than a journey | the banner itself, its copy map and its dismissal are covered through `funds` (`week-advance`); what is uncovered is the three other *routes* into it |
| 8.10 | the recovery screen's Import and "Start a new career" doors | medium | low | both are *named and enabled* in `storage-recovery.spec.ts`; neither is pressed. Import over an unopenable database necessarily fails (the write cannot land) and would assert an error path, not a recovery; "Start a new career" leads into the wizard `smoke.spec.ts` already walks | the door that actually recovers a career – Retry – is covered end to end |

**8.8 – everything the other three levels already own** is not a gap, it is the rule from §2.
Duplicating component rendering, engine arithmetic, ledger figures, migrations or balance here would
make this level slower and less precise while adding nothing.

⚠ **The two gaps that were caused by defects are now both unblocked, and only one of them is
closed.** That sentence used to read "fixing D4 alone unlocks 8.1", and it did.

> **8.1 IS CLOSED (10.08, `test/e2e-journeys`).** `tournament-entry.spec.ts` enters the soonest event
> on Season and asserts that three independent readers of the resulting snapshot agree about it. It
> also asserts that every `Enter` in a live feed answers to a *different* name, which is D4 stated as
> the thing it cost – and it is mutation-verified against removing the label again.

> **8.2 IS UNBLOCKED AND DEFERRED ON PURPOSE, WHICH IS NOT THE SAME AS BLOCKED.** D3 is closed, so the
> obstacle is gone; the reason there is no journey is **timing, not difficulty**.
> [`training-dials.md`](training-dials.md) §9 puts a two-segment `Her week` / `Coaches` switcher on
> the Coach Market and moves the entire training plan onto it, and that work is in flight. A journey
> written against today's screen would be rewritten within the week, and a rewritten journey is a
> journey nobody trusts. **This row is a scheduling decision with an owner and a trigger: write it
> once the switcher lands.** Recorded here rather than left as silence, because a gap whose reason is
> "we chose to wait" is a different risk from one whose reason is "we cannot".

⚠ **The two renamed banners are covered now, and it took a fixture.** D11's `Dismiss autosave notice`
and `Dismiss stop notice` shipped with no test, for a measured reason: the `broke` fixture is eleven
debt weeks against a twelve-week grace window, so the advance that would raise the funds toast
latches the bankruptcy ending instead. The sixth fixture, **`sinking`**, walks the same corridor and
stops at half the grace window. Each banner is now asserted present on a screen where the other is
absent – `week-advance` for the stop notice, `storage-recovery` for the autosave one – which is D11
stated as a pair rather than as two labels.

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

**The suite is deliberately NOT part of `npm run check`.** The pre-push gate is already about seven
minutes (429 s, measured quiet 02.09 – it said "four" until then); this is a browser suite and
belongs in its own parallel CI job (`e2e`). That is a
test-execution-schedule decision and it is the reason the gate stays fast enough to be run.

## 10. Maintenance testing: the impact of a schema change (CTFL §2.3)

The six fixtures are binaries in git, written at one schema version. Impact analysis for a
`SAVE_SCHEMA_VERSION` bump:

```bash
npm run e2e:fixtures        # regenerate all six - about 4 s, byte-identical across runs
```

`tests/e2e-fixtures.test.ts` is the alarm and it is **designed to go red** on the bump, in the `unit`
project, in well under a second – before anyone opens a browser. Shift-left applied to test data.

**Nothing in the browser suite hard-codes a schema version.** The one spec that needs a version reads
it from the manifest and adds one (`save-file.spec.ts`, the future-schema refusal), so it keeps
asking the right question with no edit.

**What a regeneration can still break**, and how you will know – five assertions depend on fixture
*state* rather than fixture *facts*, and every one of them says so at the point of use, with a
message naming the fixture rather than the symptom:

| dependency | who pins it | what red looks like |
|---|---|---|
| `junior` boots holding an unanswered knock | `week-advance.spec.ts`, first test | one named failure with an explanatory message |
| `pro` is one week from a season boundary | `week-advance.spec.ts`, second test | the wrap-up assertions fail together |
| `sinking` is still under water the week *after* the one it was found on | `week-advance.spec.ts`, third test | the toast assertion alone, naming the fixture and the fix (raise its debt spell) |
| `pro` boots with a feed of **more than one** enterable event | `tournament-entry.spec.ts` | the feed count, before anything is pressed |
| `pro` boots with exactly two open kit letters and no live deal | `sponsor-inbox.spec.ts` | a manifest-fact assertion, before the browser is asked anything |

All five are deliberate canaries. The fix is always a purpose-built fixture or a recipe that searches
for the state (a `season-eve`, a `knock-open`), never deleting the coverage. **The last two are the
cheap kind**: they read the manifest and fail before a single click, so a regeneration that moves
`pro` reports which property was lost rather than which locator timed out.

⚠ **`sinking` is the fixture this section exists to warn about, and it is already hedged.** Its
recipe stops at `floor(bankruptcyGraceWeeks / 2)` rather than at a week number, so a retune of the
grace window moves it with the constant; and `tests/e2e-fixtures.test.ts` asserts the *distance* from
both ends – more than one week of spell behind it, more than one week of grace ahead – because the
property that makes it a different fixture from `broke` is the gap between them, not either depth on
its own.

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
reach is a real defect.** None was fixed in the wave that raised them – `src/` was owned by other
branches – so they were reported, not resolved. Severity is the accessibility impact; priority is
what it costs coverage.

⚠ **Two are fixed now** (10.08, `fix/r14-group-c`, which owned those two files): **D4** and **D9**.
Their rows are struck through rather than deleted – a defect register that quietly loses its closed
rows cannot be audited, and D4 in particular is the one this document spent a paragraph on.

⚠ **And four are new** (10.08): **D13**, **D14** and **D15**, all three raised by the sponsor/inbox
journey, and **D16**, raised on `wave/dials` when the v47 fixture regeneration broke the entry
journey's Calendar locator. None was worked around in `src/`; that work owns `e2e/` and `docs/`, so
they are reported here, which is the same discipline the first twelve were reported under.

| # | defect | component | severity | priority | consequence |
|---|---|---|---|---|---|
| D1 | **Modals are not modals** – **CLOSED for two of ten (10.08)**: `KnockDialog` and `SeasonSummaryDialog` now carry `role="dialog"` + `aria-modal` on the CARD, named by the lines they already print, with a real focus trap (`src/composables/dialogFocus.ts`: focus in, Tab contained, focus restored). ⚠ **Two limits, stated rather than implied**: the rest of the app is NOT `inert`, so a MOUSE can still reach behind a dialog; and eight other overlays (`ConfirmDialog`, `ForkDialog`, `RetirementDialog`, `InjuryStopDialog`, `RankHelpDialog`, `TierGuide`, `InboxSheet`, `PlanWeekSheet`) are still roleless divs. The composable is a two-line adoption for each | ~~`KnockDialog`~~, ~~`SeasonSummaryDialog`~~, eight others | high | medium | a screen-reader user is not told a decision is blocking the app |
| D2 | **Five settings toggles have no names** – **CLOSED**: `aria-labelledby` on all five, pointing at the label already on screen. Reached in a browser by `save-file.spec.ts` as `getByRole('switch', { name: 'Sound effects' })` | ~~`MoreScreen.vue`~~ | high | low | was: the name could not be asked for |
| D3 | **Coach rows carry no label**, sort control renamed itself when pressed – **CLOSED (round-15 surfaces)**: `aria-labelledby`/`describedby` pin the name to the static half; rows carry the decision as their label | ~~`CoachMarketScreen.vue`~~ | medium | high | was the direct cause of gap 8.2 |
| ~~D4~~ | ~~**`Enter` is ambiguous** – one per event card, with no event in the name~~ **FIXED 10.08**: the name is `Enter the <event>, <dates>`, from one shared helper both screens read. The visible word is still the first word of the name (WCAG 2.5.3) | `SeasonScreen.vue`, `CalendarScreen.vue` | medium | **high** | was the direct cause of gap 8.1 |
| D5 | Ledger and expense rows have no role – **CLOSED**: `StatRow` is `role="group"` with a name from label/meta/value. Not `listitem` – half the callers are one row inside a card, and a listitem outside a list is invalid ARIA. `week-advance.spec.ts` now asserts the ledger as ROWS instead of as the absence of an empty-state string | ~~`MoneyScreen.vue`~~ | medium | low | was: assertable only as free text |
| D6 | Season-strip tier chips – **CLOSED**: `role="group"` named "Season ladder"; each rung a named `role="img"` whose label carries the STATE that lived only in a CSS class | ~~`HomeScreen.vue`~~ | medium | low | was: invisible to a screen reader |
| D7 | Tabs announce no selected state – **CLOSED**: `<nav aria-label="Main">`, `aria-current="page"` on the active tab, and the three unread dots merged into one named element exposed via `aria-describedby`. ⚠ The button carries an explicit `aria-label` equal to its visible word **so a dot arriving cannot rename the tab** – which is exactly the D3 defect, one screen over, prevented rather than repeated | ~~`App.vue`~~ | high | medium | was: the active tab could not be asserted by role |
| D8 | Tables have no accessible names – **`StatsScreen` FIXED (R14-E)**: all three of its tables now carry an `aria-label` that follows the ladder picker, so the name says WHICH table (three render through one element). `CountingResultsTable` takes an optional `label` with **no default** – `RankHelpDialog` renders two side by side, and a default name would have bought D11 with D8's money. Mounted guard: `tests/component/season-by-table.test.ts` | ~~`StatsScreen.vue`~~, `MoreScreen.vue`, `HomeScreen.vue` | medium | low | `getByRole('table', { name })` never works |
| D9 | Unlabelled text inputs – placeholder only. **Half fixed 10.08 (R14-C)**: Season's friendly-match seed has a real `<label for>` now; `MoreScreen.vue` still stands and was not that branch's file | ~~`SeasonScreen.vue`~~, `MoreScreen.vue` | medium | low | not reachable as named textboxes |
| ~~D10~~ | Date lines are plain `<p>` – **CLOSED 10.08**: `ThisWeekScreen`'s line took the same fix Home's did (`role`/`aria-level` on the existing `<p>`, guarded in `tests/component/a11y-sweep.test.ts`), and the Calendar's own header line is `weekDateLine` inside a `<header>` that already carries the screen's name. Previously: Home's is `role="heading" aria-level="1"` (a role on the existing `<p>`, not an `<h1>`, which would bring the browser's own type to a line laid over a photograph). ⚠ **`ThisWeekScreen` is the same one-line fix and is owned by nobody** – it was on no agent's list | ~~Home~~, Calendar, **ThisWeek (unowned)** | low | medium | the app's most-asserted string |
| D11 | Duplicate names across live surfaces – **More CLOSED**: `Load career – Emma` / `Load save {name}`, each extending its visible word (WCAG 2.5.3 checked). **App PARTLY**: the two banners are renamed in VISIBLE copy to `Dismiss autosave notice` / `Dismiss stop notice`, and ⚠ **no test reaches them** – measured, not assumed: the `broke` fixture is 11 debt weeks against a 12-week grace, so the advance that would raise the funds toast latches the BANKRUPTCY ending instead, and `App.vue` cannot be mounted in the component runner (`virtual:pwa-register`). The fixture that would fix it is `debtWeeks ~ 6 of 12` | ~~`MoreScreen.vue`~~, `App.vue` (untested), `CalendarScreen.vue` | low | medium | strict-mode collisions |
| D12 | `aria-label` on a non-interactive `div` – **CLOSED**: `role="img"` on the non-foldable trophy cells, which is what `cellLabel`'s own header already described. Foldable ones stay buttons | ~~`TrophiesScreen.vue`~~ | low | low | was: the not-yet-won cells were unreachable |
| ~~D13~~ | **FIXED 10.08 (`feat/dials-screen`)**: the confirm's label is `Sign it`, so the two live controls have distinct exact names and `sponsor-inbox.spec.ts` drops `.last()`. Mounted guard: `tests/component/a11y-sweep.test.ts`. The defect, kept: **The inbox's one irreversible control shares its name with the control that opens it.** `OfferLetter` draws `Sign`; the `ConfirmDialog` it raises draws `Sign` too, and both are on screen together – so `getByRole('button', { name: 'Sign' })` is a strict-mode collision on the single press in this app that cannot be taken back. `ConfirmDialog` is also one of D1's eight roleless overlays, so it cannot be scoped by `getByRole('dialog')` either; between the two there is no name-based reading, and `sponsor-inbox.spec.ts` presses `.last()` with the defect cited at the point of use. The fix is one prop – the confirm's label already varies per caller (`Delete`, `Withdraw`, `Push through`), so a confirm-label that extends rather than repeats the verb costs nothing | `InboxSheet.vue` (and every caller that reuses a verb) | medium | **high** | the one control a mis-press cannot be undone on is the one a test cannot name |
| D14 | **An inbox row's accessible name changes every week.** A row is a `<button>` with no `aria-label`, so its name is its whole text – letterhead, subject, filing week **and** a countdown the engine rewrites weekly (`4 weeks to decide`, then `3 weeks…`). There is therefore no stable name for "the letter from X": a spec has to read the letterhead out of the row's text, which is what `sponsor-inbox.spec.ts` does and says so. This is the rule D7 established one screen over, applied backwards – its fix note is explicit that a *changing* fact belongs in the DESCRIPTION (`aria-describedby`) and the name must be pinned, precisely so a dot arriving could not rename the Home tab. Same shape, opposite outcome | `InboxSheet.vue` | low | medium | letters cannot be addressed by name, only by position or by parsing |
| ~~D15~~ | **FIXED 10.08 (`feat/dials-screen`)**: each dot is a named `role="img"` handed to its button through `aria-describedby` – D7's fix, one screen over, applied verbatim, so a marker arriving cannot rename the control. Mounted guard: `tests/component/a11y-sweep.test.ts`. The defect, kept: **Home's two diary-tool dots are unnamed** – `<span class="diary-tool-dot">` beside the bell and the inbox: no role, no text, no label. This is exactly the D7 defect one screen over, and D7 is closed: the tab bar's three dots were merged into one named element exposed through `aria-describedby`, with the argument written out in `App.vue`. The two on Home were not in that branch's files. The consequence for coverage is concrete – `sponsor-inbox.spec.ts` can assert that signing empties the letter table but **not** that the inbox marker goes out, which is the fact a player actually navigates by | `HomeScreen.vue` | medium | low | the app's two unread markers are invisible to a screen reader and to this level |
| D16 | **The Calendar's grid marker is the one control that names a tournament without the shared helper.** Three live surfaces name an event: Season's `Enter` pill, the Calendar takeover's `Enter` – both read `enterActionName`, which is what D4 bought – and the Calendar's grid MARKER, which composes its own name in the template: `` `${row.note}, ${row.label}, ${row.dates} – open this tournament` `` (`CalendarScreen.vue`, fed by `lookAheadFor` in `weekDays.ts`). So one event is `Enter the World Tour 35, Dec 27, 2038 – Jan 2, 2039` on one screen and `World Tour 35, W1 '39, Dec 27 – Jan 2 – open this tournament` on the other. ⚠ **The two date FORMATS are deliberate and must not be unified** – `weekSpan`'s own header argues it: a span printed beside a week label that already carries the year must not repeat it. What is missing is a shared TOKEN, not a shared format, so the fix is a marker-name helper beside `enterActionName` in `src/composables/eventName.ts`, in the grid's vocabulary. Measured cost: `tournament-entry.spec.ts` has to run `weekRange` forwards to translate one screen's week into the other's before it can address the row (`weekPrintedAs`), and that helper says it should not survive this fix | `CalendarScreen.vue`, `src/composables/weekDays.ts` | low | medium | no single string identifies one event across the app's naming surfaces |

⚠ **Three more closed on 10.08** by `feat/dials-screen`, which owned the three files they were in:
**D13** (the highest-priority open item, and a one-prop fix as predicted), **D15** and the unowned
half of **D10**. All three are struck through above rather than deleted, and each carries the mounted
test that now holds it. **D14 and D16 are the two that remain open**, plus D1's eight overlays, D8's
two screens, D9's `MoreScreen` and D11's `App.vue` half.

**D3 and D4 were the highest-priority items in this document**, not because they are the worst
accessibility defects – D1, D2 and D7 are – but because they are the two that cost coverage. **Both
are now closed**, and so is **D13**, which inherited the title on the same grounds: it forced a
positional selector onto an irreversible control, and it cost one prop to close. The
highest-priority item still open is **D16**.

⚠ **D13, D14 and D15 were all raised by writing the sponsor journey**, which is the policy in §6
working as intended: role-and-name selectors turn every unreachable element into a defect report
instead of a `data-testid`. Three of the four journeys in this wave needed no new names at all; the
inbox needed three, and none was added.

⚠ **D16 was raised by a FIXTURE REGENERATION, which is a different and rarer way to find one.** The
v47 bump gave `pro` a second World Tour 35, and the entry journey's Calendar locator – which named
the tier and not the event – resolved to two elements. The failure was the spec's; the finding
underneath it was the app's, and it had been sitting there since the Calendar was built. **A test
suite that only ever runs against one frozen fixture set cannot find this class of defect at all**,
which is an argument for regenerating on every schema bump rather than migrating.

## 13. Metrics (CTFL §5.3)

⚠ **THIS TABLE IS A DATED READING, NOT A LIVE ONE, AND ITS TOP ROW IS ALREADY BEHIND.** It was
measured on 10.08 and every column is a snapshot of that day – which is what a coverage report is
for. It has not been re-measured since, and the suite has grown: `npx playwright test --list` prints
the current test and file totals in a second, and it is the figure to quote. The row is left as
written so the 09.08 → 10.08 comparison beside it still reads; **do not cite it as today.**

| metric | value, 10.08 | was, 09.08 |
|---|---|---|
| test cases at this level | **25**, in **12** spec files | 18 in 9 |
| execution time | **~19 s** local, parallel across 5 workers | ~17 s |
| retries used | **0** | 0 |
| screens with a recorded coverage decision | 10 of 10 (machine-enforced) | 10 of 10 |
| screens touched end-to-end | 6 of 10 – and two of the six moved from *rendered* to *driven*, see §7.2 | 6 of 10 |
| mechanics with an e2e claim | **11 of 20** covered, 3 partial, 6 delegated | 8 of 18, 4 partial, 6 delegated |
| accepted risk items | **6 open** (8.2, 8.3, 8.6, 8.7, 8.9, 8.10), **3 closed** (8.1, 8.4, 8.5) | 7 open |
| committed career states | **6** – `sinking` added so a stop could be reached without an ending | 5 |
| defects raised by this work | **16 raised**; 2 closed (D4, D9's Season half) on `fix/r14-group-c`, D3 closed on the round-15 surfaces; **4 new** (D13–D16) | 12 raised, 2 closed |
| `data-testid` in the repository | 0 | 0 |

**Five new tests carry a `MUTATION-VERIFIED` note, and every one of them was actually run.** Six
mutations, in six different files, each producing red on the intended line and nowhere else:
`signOffer`'s refusal loop deleted (`sponsor-inbox`), both banner labels reverted to `Dismiss`
(`week-advance` **and** `storage-recovery`, together), the `Enter` pill's `aria-label` removed
(`tournament-entry`), `init()`'s failed-probe arm changed back to `ready` (`storage-recovery`), and
the `.catch` that clears a rejected `dbPromise` removed from `src/db/saves.ts` (`storage-recovery`),
and the takeover pill's `aria-label` removed from `CalendarScreen.vue` (`tournament-entry`, step 0).
`src/` was restored from git after each round; this work touches no source file.

⚠ **That last mutation is the one worth reading, because the suite USED TO SURVIVE IT.** Until 10.08
the entry journey's only claim about the Calendar's `Enter` was that it had gone after the entry –
and `toHaveCount(0)` counts zero just as happily when the name was never there. Removing the label
left the test green. The fix was to assert the name is PRESENT before the press and absent after, so
the absence is evidence rather than a coincidence; it cost two taps. **An absence assertion is only
worth what the presence assertion beside it is worth**, and this suite now has one instance of that
lesson found the expensive way.

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

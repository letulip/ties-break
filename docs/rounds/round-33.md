---
type: round
status: current
area: rounds
canonical: false
last-reviewed: 2026-09-01
---

# Round 33 – the tidy-up wave, and the screen that was never two screens

- [x] **Three August measurements landed.** `measure/first-round-exit`, `measure/fortnight-bisect`
  and `measure/potential-band` each carried a spec and a tool and never reached main – exactly the
  class the round-29 audit exists to catch. ⚠ Their BRANCHES were not mergeable: they predate round
  30's split of `coach-travel-edge` into three files and would have dragged the old test back, so
  only the six files that exist nowhere else were taken.

- [x] **1. «опять экран next tournament содержит next week – объясни мне пожалуйста, почему вообще
  получилось так, что эти два на одном экране постоянно оказываются? это разные экраны, нужны для
  разных вещей, мне кажется у них ничего общего нет. На экране family budget ведь нет ничего такого.
  На экране конца недели теперь нет информации о next tournament и это правильно.»** **build**.

  ⭐⭐ THE ANSWER TO HIS QUESTION IS STRUCTURAL, AND IT IS WHY FOUR ROUNDS FAILED TO FIX IT: **there
  is no tournament screen.** `src/components/screens/` holds ten screens and none of them is one.
  Home's plate emits `navigate → 'week:tournament'`; `App.vue:214` turns that into
  `openWeek('tournament')`, which sets `tab = 'week'` and hands `ThisWeekScreen` an `entry` prop.
  **The "Next tournament screen" IS the This Week screen in a different mode.**

  ⚠ So rounds 29, 30, 31 and 32 were all rearranging blocks INSIDE one screen while he described
  two. Round 31 #1 moved the order on that arrival; round 32 #2 took the tournament off the results
  view. Neither could give him what he is asking for, because the thing he is asking for does not
  exist as a screen.

  ⭐ AND HIS OWN COMPARISON IS THE PROOF: the family budget has `MoneyScreen.vue` and its own tab.
  The tournament never got either.

  FIX: on the `entry: 'tournament'` arrival the screen shows the TOURNAMENT and none of the week's
  own furniture. ⚠ The other arrival is untouched – round 32 #2's «results view shows results» must
  stay exactly as he approved it, and the mutation that proves it is a re-run of that round's guard.

  ### What shipped, and what the tournament arrival keeps

  `src/components/screens/ThisWeekScreen.vue`. The prop stops deciding an ORDER and starts deciding
  what the screen IS: `tournamentOnly = entry === 'tournament' && !!nearestEntered`, and four blocks
  come off that arrival – the «This week» heading, the status pill (with the latest-match score it
  carries), the week's story, and the whole training-plan section. `showStory = showRecap &&
  !tournamentOnly` carries the story's four parts together, so the card, the header's ×, the footer's
  Proceed pill and the `has-proceed` padding cannot part company.

  **The tournament arrival is exactly three things, and the guard asserts them as a list:**

  | kept | why |
  | --- | --- |
  | the header's date line | it says WHICH week the tournament is in, and it is the screen's `role="heading" aria-level="1"` landmark (D10). Removing it would leave the page with no title |
  | the way back to Home | ⚠ ROUND 20 #3. `week` has no seat in the bottom bar, and the story's × and Proceed pill – which were this arrival's only own controls – left with the story. The control is the app's existing back link (`IconButton variant="bare" icon="back" label="Back to Home"`), the same object `MoneyScreen.vue` and `KidScreen.vue` carry for the same trip, so **no new wording enters the app** (invariant 4) |
  | `NextTournamentPanel`, unframed | it is what the plate is a door to. `section.bare` now says something literally true – the plate is the only object on the page |

  Nothing else: no heading, no pill, no story, no plan, no footer. Adding any of them back reddens
  `tests/component/round33-tournament-arrival.test.ts` §1, which asserts the whole page as a LIST
  rather than as a handful of `exists()` calls – this was the FIFTH pass over these blocks and each
  of the previous four drifted, so a guard that goes green again when something creeps back was not
  good enough.

  ⚠ THE STORY IS NOT SILENCED, AND THAT HAZARD IS ONE LINE AWAY. `dismissedRecapKey` is module scope
  (R9-18) and outlives every unmount, so an arrival built by DISMISSING the story rather than by not
  rendering it would cost him a week's story for good – tapped away by a plate on Home he never
  connected to it. Three arms across three files hold that line, and the mutation that builds the
  arrival by dismissing reddens exactly those three while leaving §1 entirely green.

  ### ⭐⭐ Should it be a REAL screen with its own tab? – for the owner to rule

  **A tab: no, and it is not an agent's call to make.** The bottom bar is his own five slots in his
  own order with Home in the CENTRE (`epic/redesign-home`, 28.07), `ui-inventory` §4 Q1 says every
  screen keeps the navigation it has, and both of the screens this one is being compared to –
  Family budget and Her page – are TABLESS, reached from Home and left by a back arrow. A sixth slot
  or an eviction is a navigation change plus a label, and both are his.

  **A separate `TournamentScreen.vue` with no tab: yes, eventually – it is the structurally honest
  fix, and it is why this item exists.** It was NOT built in this round because the round's own FIX
  line asked for the arrival, and because a screen split is a nav change made while he is playing.
  What it would take, in full: a `'tournament'` content state in App.vue's `tab`; `openFromHome`
  pointing the plate at it instead of at `openWeek`; a ~60-line `TournamentScreen.vue` (ScreenShell,
  the date line, the back link, the panel); and then a DELETION – `ThisWeekScreen` loses the `entry`
  prop, `tournamentOnly`, `showStory` and half of `tournamentShown`, and App.vue loses `WeekEntry`,
  `weekEntry`, `openWeek` and the `if (advanced || runClosed) weekEntry.value = 'story'` reset, which
  exists ONLY because the two screens share one file and is round 31 #1's hardest guarded line.
  `round13-nav.test.ts` would want one line for the new tabless state.

  **What the prop version costs while it stands.** Three things, and they are worth naming so the
  next reader sees a decision:
  1. `ThisWeekScreen.vue` still carries both screens' markup, and every block anyone adds to the week
     from now on needs a `v-if="!tournamentOnly"` or it lands on the tournament too. That is a
     standing tax paid in attention, which is the tax four rounds already failed to pay.
  2. The wrong state is still REPRESENTABLE – a forgotten `v-if` rebuilds his complaint. §1's list
     guard is a test standing in for a type.
  3. The tournament screen has no name in `src/components/screens/`, so the next person to read that
     folder learns exactly what the last four rounds learned: that there are ten screens and no
     tournament among them.

## Where it landed

The box is ticked with the place, per `docs/rounds/README.md` §"Keeping this true". Branch
`round/33`, gated once at the end and each verdict read out of its own uniquely named log file
rather than a pipe or a background notification: `npm run check` **exit 0** (unit 3,870 tests /
component 1,125 / build ok / engine purity ok), `npm run test:e2e` **exit 0** (31 tests),
`npm run test:sim` **exit 0** (12 files, 296s). ⚠ The background task's completion notice said
«exit code 0» on the two runs whose logs said `CHECK_EXIT=1` – the twenty-first and twenty-second
times it has done that here.

- **1** – `16430c3d`, `src/components/screens/ThisWeekScreen.vue`. Guard:
  `tests/component/round33-tournament-arrival.test.ts` (9 arms, both arrivals asserted as section
  LISTS), nine mutations measured. Re-aimed rather than weakened: round 29's plan line, round 31's
  tournament-arrival lists, round 32 §3, `tests/round13-nav.test.ts`'s two source pins, and
  `e2e/responsive.spec.ts`'s 375px journey. **`src/engine|worker|db|shared` carry a zero-line diff
  across the whole branch**, the frozen capture (41550 / `e6b0c709`) is untouched and
  `SAVE_SCHEMA_VERSION` is still 69.

### ⚠ Two gate breaks left by this branch's earlier commits, repaired here

Neither is mine and both were blocking `npm run check` before any of my work ran, which is worth
recording because both come from the same tidy-up commit:

- `docs/specs/first-round-exit-or-the-draw-2026-08.md` landed in `f6ec1398` with **no governance
  frontmatter**, and `context:audit` refuses a new document without it (its two siblings from the
  same commit have theirs). Given the same `type/status/area/canonical/last-reviewed` block they
  carry.
- `docs/now-next-later.md` still said **«THE LIVE WAVE IS ROUND 32»** after `2d311dd5` shipped this
  ledger, and `scripts/doc-facts.mjs` machine-checks that line against the newest file in
  `docs/rounds/`. The Now section is moved on one place: round 33 is the open wave, 32 the previous
  one, 31 the one before it.

⚠ NOT DONE, AND NAMED: `docs/rounds/README.md`'s navigation table still stops at **round 25** –
rounds 26 to 33 have no row. Nothing checks it, it is the fifth recorded instance of that table
lagging its own folder, and adding a row for 33 alone while seven are missing would make the table
more misleading rather than less. It wants one pass over all eight, not a line smuggled into a
build round.

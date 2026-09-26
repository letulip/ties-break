---
type: review
status: audit
area: project-review
canonical: false
last-reviewed: 2026-09-26
baseline: 03d92221
---

# Engine core – 26 September 2026 review

## Verdict

The engine core keeps its load-bearing laws. The runtime graph has no cycle, every roll reads a
purpose-scoped sub-stream, and the 05.09 lane closed nine of its ten engine-core findings with real
commits (E-01, E-04, E-05, E-06, E-07, E-08 and E-12 are fixed; E-02 is fixed as filed). What is left
is one family of defects. The rule "which questions stop time" and the rule "which verdict a screen
may state" are each written more than once inside the engine, and the copies have drifted.

The three things that matter most:

1. **A college year ticks past her blocking life beats (B-01, P1).** `resumeFromCollege` pauses a year
   for a birthday but not for a `met` or `ended` card. In 23 of 217 year-calls over 16 college
   careers, a blocking beat was passed over. In two of those calls she met someone, and the break-up
   was raised before the first card was ever shown.
2. **`mutate` commits before it can render (B-02, P1).** E-02 moved "build the reply before adopting
   the world" onto `new`, `restoreSlot` and `importSave`. The path that 41 commands take still writes
   the autosave first and builds the snapshot second. A throw inside `toSnapshot` then persists a save
   that cannot load, which is how round 42 #15 bricked a career.
3. **The Money screen's ad shelf restates the letter gate inside `toSnapshot`, and the copy has
   drifted (B-03, P1).** The clothing slot says "Open – nobody signed · A letter here writes about $X
   a year". In three whole careers that was true on 0 of the 949 sampled weeks that showed it, because
   no kit deal was live and `reviewAdOffer` writes no clothing letter without one.

Lead 2 is answered with a price: a shared roll primitive saves about 8 lines and adds a key-composition
risk. What is actually missing is the key-inventory pin (B-07). Lead 3 still stands for the known
expecting and bereavement pools, and the sweep found a third pool, `'engaged'`, with four unreachable
roof lines (B-08, re-rated to P3 in verification).

## Scope and method

Everything below was read or run at `03d92221`. Code was read in the clean worktree
`/Users/letulip/Projects/Claude/tb-review`, and every file:line points into it. Where this report says
`RAW`, it means
`/private/tmp/claude-501/-Users-letulip-Projects-Claude/c8208cb1-8875-425d-987a-91238b4d6641/scratchpad/review-raw/B/`,
and every log there ends in `X_EXIT=0`. No timing was taken, because Phase 0's numbers are the ones
consumed. No gate was run. One product mutation was made, in a scratch worktree that has since been
removed.

**Read in full or in their code lines:**
- In `engine/world.ts`: `finalizeTournament`, the reveal trio, `createWorld`, `tickWeek`,
  `advanceWeeks`, `skipEvent`, `resumeFromCollege` and `endCollegeEarly`.
- In `engine/world/multiWeek.ts`: `advanceRefusal`, `ADVANCE_REFUSALS` and `spanWeeksFor`.
- The worker command switch, `src/worker/sim.worker.ts:233-800`.
- Every engine function the switch calls, 37 bodies (`RAW/cmd-bodies.txt`).
- The nine `roll*` hazards in `world/lifeBeat.ts`, their eligibility gates, the presence law
  (`:570-650`), `lifeBeatSaid` and `lifeStageAt`.
- `world/shootClash.ts:1-260`.
- `world/snapshot.ts`, `toSnapshot` in full (`RAW/tosnapshot.txt`).
- In `world/sponsors.ts`: `reviewAdOffer`.
- In `world/bookkeeping.ts`: `pruneEvents`.
- In `world/state.ts`: the `offers`, `bond`, `spirit` and season counters.
- In `diary/weekNotes.ts`: `:400-860`.
- **Gap-fill pass, the brief §6 B files the first pass had left out:**
  - `world/coachMarket.ts` (3,045 lines, 780 code / 2,164 comment, 00-baseline §A2): every exported
    function sized; the code bodies of the three commands (`hireCoach`, `setCoachOnEventWeeks`,
    `setCoachOnJuniorEvents`) and of 18 derivations read comment-stripped (`RAW/coachmarket-bodies.txt`),
    including `coachBilling`, `coachMarket`, `householdWeekly`, `familyWeeklyIncomeCents`,
    `supportPayrollWeeklyCents`, `coachProgressScore`, `resolveCoachRaise`, `coachEdgeView`,
    `coachLadderNote` (and its doc, `:2962-3014`), `travelCoverReachesHer` and `coachSinceWeek`; the
    import block (`:15-93`) mapped against its call sites.
  - `world/college.ts`: its four sub-stream keys and their test mentions, `leaveCollege`
    (`:1034-1039`), and the jscpd pair `:551-573` ↔ `:913-935` (lane F's P3-04 in `06-duplication.md`, not re-filed).
  - `world/medical.ts`: `entryVerdict` and `availabilityStatus` sized (105 / 95 code lines); the cap
    arm `:790-850` read against `world/entryCaps.ts:28-68`, `:285-295` (E's hand-off, B-P3-09).
  - `world/assets.ts`: the export list and its one randomness note (`:20`); no throw, no sub-stream.
  - `world/albumBook.ts`: its two sub-stream keys (`:1136`, `:1151`), the one throw (`:318`) and its
    caller (`sim.worker.ts:775-779`, the on-demand `album` query, not the snapshot).

**Searched, not read:**
- `docs/decisions.md` (unreachable roofs, clothing, `resumeFromCollege`).
- `docs/now-next-later.md:215-240`.
- `docs/backlog/the-quality-rig.md`.
- The 05.09 `02-engine.md`, which was read whole.

**Probes.** Each one is authored in `docs/review-principles-2026-09-26/probes/`, copied to the same
path in the worktree, and run from the worktree root.

| probe | command | output | what it answers |
| --- | --- | --- | --- |
| `b-fn-sizes.mjs` | `node …/b-fn-sizes.mjs sizes src/engine/world.ts src/engine/world/*.ts src/engine/migrations.ts`; `… body <name> <files>` | `RAW/fn-sizes.txt`, `RAW/cmd-bodies.txt`, `RAW/roll-bodies.txt`, `RAW/tosnapshot.txt` | function code lines via the repo's `typescript`, and comment-stripped bodies |
| `b-clash-midspan.ts` | `npx vite-node …/b-clash-midspan.ts` | `RAW/clash-midspan.log` | whether `advanceWeeks(…, 4)` stops when a shoot clash opens mid-span (B-04) |
| `b-close-unfinished.ts` | `npx vite-node …/b-close-unfinished.ts` | `RAW/close-unfinished.log` | whether `closeTournament` refuses an unfinished reveal or drops it (B-05) |
| `b-college-beats.ts` | `npx vite-node …/b-college-beats.ts` | `RAW/college-beats.log` | whether a college year ticks past unanswered blocking beats (B-01) |
| `b-ad-shelf-parity.ts` | `npx vite-node …/b-ad-shelf-parity.ts -- <5\|2\|7> 0` | `RAW/ad-shelf.log` | the shelf's clothing verdict against the letter gate, over three whole careers (B-03) |
| `b-spine-sweep.ts`, `b-spine-silent.ts` | `npx vite-node …/b-spine-sweep.ts`; `… b-spine-silent.ts` | `RAW/spine-sweep.log`, `RAW/spine-silent.log` | each top-level key of `v89.json` deleted and taken through the gate, the load, `toSnapshot` and four ticks (B-06) |
| `b-required-defaults.mjs` | `node …/b-required-defaults.mjs` | `RAW/required-defaults.log` | the `??` / `?.` reads of the required members of `WorldState` (B-06) |
| ad hoc | `npx vite-node <scratchpad>/st-count.ts` | `RAW/smalltalk-count.log` | small-talk situations per voice and stage (lead 3) |
| `b-fn-sizes.mjs` (gap-fill) | `for f in coachBilling coachMarket householdWeekly … coachedWeeksLostToRest; do node …/b-fn-sizes.mjs body $f src/engine/world/coachMarket.ts >> RAW/coachmarket-bodies.txt; done` | `RAW/coachmarket-bodies.txt` | the `coachMarket.ts` code bodies behind B-P3-10 / B-P3-11 |
| ad hoc `git grep` (gap-fill) | `git grep -nP "(householdWeekly\|familyWeeklyIncomeCents\|supportPayrollWeeklyCents)\(" -- src`; `for s in masseurWeeklyCents … activeKitDeal; do grep -n "\b$s\b" src/engine/world/coachMarket.ts; done`; `git grep -n "\.household\b" -- src/components src/composables`; `git grep -lF "<key>" -- tests` for `:collegeoffer:` `:callup:` `:rubbers:` `:collegeleague:` `:album:flavour:` `album:flavour:patch` | terminal, re-runnable | the household meter's only runtime path (B-P3-10) and the college / album key coverage (B-P3-12) |

**The one mutation (B-07).**
1. Created the scratch worktree: `git -C tb-review worktree add --detach ../tb-review-laneb 03d92221`
   (`RAW/mut-setup.log`).
2. Renamed `life:loss` to `life:bereavement` at `lifeBeat.ts:7999`.
3. Ran `npx vitest run --project unit tests/wave11-bereavement.test.ts` (`RAW/mut-bereavement.log`):
   14 of 14 passed, `X_EXIT=0`.
4. Removed the worktree (`RAW/mut-teardown.log`).

**Counts.** Blast radii are `git grep -l "<symbol>" -- tests/ | wc -l`, run at `03d92221`.

## Findings

### B-01 · A college year ticks past her blocking life beats – 23 of 217 year-calls passed at least one unanswered card
- Severity: P1
- Category: correctness-risk
- Evidence:
  - **The year loop.** `resumeFromCollege` (`engine/world.ts:2686-2745`) ticks up to 52 weeks in one
    command. It stops for a call-up (`:2705-2708`), a college-league reveal (`:2723-2726`) and a
    birthday (`:2733-2736`). It has no stop for `pendingLifeBeat`.
  - **Why the birthday stops the loop, in the function's own words.** A birthday "cannot be
    collected, it has to be ASKED, on its own week" (`:2598-2608`).
  - **The rolls have no college guard.** The life rolls run every college week: `rollEnds` and
    `rollArrival` at `world/phaseHerWeek.ts:321-322`, the rest down to `rollSmallTalk` at `:623`,
    all inside `resolveBodyAndPlanner` (`:247`). Only the knock is suppressed there
    (`world/phaseGrowth.ts:399`, `if (!inCollege(world)) rollKnock(world)`).
  - **`met` and `ended` are blocking** (`LIFE_BEAT_BLOCKING`, `world/lifeBeat.ts:250-280`).
  - **The probe.** `b-college-beats.ts` ran 16 careers: 8 with the fork forced at week 60, as
    `tests/collegeBirthdayFixtures.ts` does, and 8 walked to the real fork at 19. It found 23 of 217
    year-calls that ticked past at least one blocking row. The count is 15 `met` and 10 `ended`, and
    18 of the 23 calls are in the real-fork arm. Two calls passed a `met` AND its `ended`, for example
    `b-college-age19-3 year 450->480 passed=["met@466","ended@476"]`. One call returned `stops=[]`
    while passing an `ended` (`age19-7 492->502`).
  - **A false premise in shipped code.** Two notes rest on "a blocking row stops the week
    (`advanceWeeks` and `answerFork` both refuse while one is unanswered)" (`lifeBeat.ts:3788`,
    `:4582`). Inside this loop it does not.
- Why it matters:
  - Each passed card surfaces weeks late, after the year returns, and it is worded as news. The
    parent can be asked how he reacts to "she has met someone" about a relationship whose break-up
    card is queued behind it.
  - This is the hole `▶▶ 52` had until v85 T11b, and the worker's own note names it: "a blocking beat
    is HER SPEAKING, so a loop that outran one would answer her by walking away"
    (`sim.worker.ts:365-373`).
  - The college branch is a real player path, not a dev button.
  - It is not P0 only because nothing is lost: the rows stay unanswered and are asked later.
- Proposal:
  - This is an owner decision first, because his ruling "it collects, it does not halt"
    (`world.ts:2588-2597`) is the one the birthday was an explicit exception to. Two options:
    - (a) A blocking beat pauses the year exactly as the birthday does: add `pendingLifeBeat(world)
      !== null` beside `:2733`, re-latch with `pendingYearStart` (`:2776-2791`), and add `'life'` to
      the returned stops. This is one more click, in the roughly 1 year in 9 that holds a beat.
    - (b) College collects beats by ruling. Then the two `lifeBeat.ts` notes and the `met`/`ended`
      copy must say so, and that copy is a wording question for him.
  - Either way, the loop's pause set should be read from the one engine owner of "open questions"
    (B-04), not re-listed.
  - The probe becomes a test: under (a) the "passed" count is 0; under (b) the order of the queued
    rows is asserted.
  - Owner of the merged code: `engine/world.ts` `resumeFromCollege`.
- Blast radius:
  - RNG: none. A pause is RNG-safe because `rngMain` is persisted and the year resumes from
    `pendingYearStart`, the birthday's own mechanism. Weeks, keys and draws are byte-identical for
    every year that holds no blocking beat. Proof: the frozen capture (41550 / `e6b0c709`) is
    untouched because no MAIN draw moves, and the college fixtures' hashes are compared before and
    after.
  - Schema: none (`pendingYearStart` exists). Wording: only under (b).
  - Tests: `resumeFromCollege` → 29 files.
- Effort: S for (a); S for (b) plus copy
- Confidence: high – the probe is deterministic and names each week. A player-policy bench walking
  the college branch at scale would raise the frequency estimate.
- Versus 05.09: new
- Verification: CONFIRMED – resumeFromCollege's loop pauses only for a call-up reveal, a college-league reveal and a birthday (world.ts:2690-2738), with no pendingLifeBeat stop or entry refusal while LIFE_BEAT_BLOCKING marks met and ended true; the probe re-ran byte for byte (217 year-calls, 23 passing an unanswered blocking row, 15 met / 10 ended) and no owner ruling or queue entry covers it.

### B-02 · `mutate` commits the candidate before it can render – E-02's ordering rule covers 3 lifecycle paths, not the 41 mutation commands
- Severity: P1
- Category: correctness-risk
- Evidence:
  - **The order in `mutate`.** `sim.worker.ts:241-248` runs `structuredClone` → command →
    `await commitAutosave(candidate, …)` → `world = candidate` → `return snapshotMsg(…)`, and
    `snapshotMsg` builds `toSnapshot` at reply time (`:147-167`).
  - **The rule it misses.** E-02's fix builds the snapshot first on `new` (`:319-327`: "the ordering
    is the property, and a lifecycle path that commits before it can render is the defect regardless
    of which of the three found it first"), on `restoreSlot` (`:690`) and on `importSave` (`:722`).
  - **The path it misses is the everyday one.** All 41 `return mutate(` cases – every command that changes
    the career – take the old order.
  - **The class has already bricked a save.** Round 42 #15: a soft small-talk row was re-worded at a
    stage with no line, "`smallTalkOpener` throws inside the snapshot the whole app renders from.
    Rare, silent to write, and fatal to the save" (`world/lifeBeat.ts:3773-3779`, fixed in
    `b801de6d`).
  - **Load has no fallback for a save that cannot render.** `loadCareer` (`:658-664`) adopts the
    newest autosave and then builds the snapshot, with no fallback to the older generation when that
    throws.
  - **The throw sites are real.** `lifeBeatSaid` alone carries 5 `throw new Error` arms reached from
    `toSnapshot` (`lifeBeat.ts:3887`, `:3896`, `:3914`, `:3930`, `:3943`).
- Why it matters:
  - Any future engine bug that makes `toSnapshot` throw is turned, by this order, from "the command
    was refused" into "the career is persisted in a state that cannot load". That is the difference
    between a toast and a lost save.
  - The fix costs nothing: the snapshot is built on every command anyway.
- Proposal:
  - In `mutate`, build `const snapshot = toSnapshot(candidate, stopReasons)` before
    `commitAutosave`, and pass `{ snapshot }` to `snapshotMsg`, the exact shape of `:323`/`:327`.
  - `revision` is still read off `committedRevision` at reply time (`:163`), so nothing else moves.
  - Test: a worker-pipeline case with `toSnapshot` spied to throw once. The command replies
    `ok:false`, the committed revision and the autosave are unchanged, and the next `getSnapshot`
    succeeds.
  - The load-side fallback, which tries the older generation when the newest cannot render, is lane
    D's line (`loadCareer`, `sim.worker.ts:658-664`).
  - Owner: `src/worker/sim.worker.ts` (lane D's file; filed here because the hazard is the
    snapshot's).
- Blast radius:
  - House laws: no RNG, schema, wording or balance moves – the same snapshot, built earlier.
  - Tests: `sim.worker` → 19 files. `tests/dev-fast-forward.test.ts` pins the `tick` case text and
    does not read `mutate`.
- Effort: S
- Confidence: high on the ordering, which is read directly. The bricking consequence rests on round
  42 #15's own record, and a spied-throw test would demonstrate it.
- Versus 05.09: carried (E-02 – the ordering half, applied to the lifecycle paths only)
- Verification: CONFIRMED – mutate (sim.worker.ts:233-249) awaits commitAutosave and adopts the candidate before snapshotMsg runs toSnapshot, E-02's snapshot-first order exists only in new/restoreSlot/importSave, and an injected single toSnapshot throw made the advance reply ok:false while the week and revision were already committed.

### B-03 · The ad shelf restates the letter gate inside `toSnapshot` and has drifted – the clothing slot is "Open" on weeks the engine cannot write it
- Severity: P1
- Category: correctness-risk
- Evidence:
  - **The letter gate.** `reviewAdOffer` writes a clothing letter only with a live kit deal:
    `if (category === 'clothing') { const kit = activeKitDeal(…); if (!kit) continue` at
    `world/sponsors.ts:827-829`. `docs/decisions.md:4008` records it ("clothing already needs a live
    kit deal to be written at all").
  - **The shelf.** It is built inside `toSnapshot`'s `adPortfolio` IIFE (`world/snapshot.ts:1754-1858`)
    and marks a category `state: 'open'` whenever its fee cell is priced (`:1830-1832`). It asks
    nothing about kit.
  - **What the screen prints.** MoneyScreen renders "Open – nobody signed" and "A letter here writes
    about {openCashCents} a year at her standing" (`components/screens/MoneyScreen.vue:2533`,
    `:2559-2561`).
  - **The probe.** `b-ad-shelf-parity.ts` sampled every 4th week of three whole careers under the
    player policy (`bench-middle-0` / `bench-working-0` / `bench-wealthy-0`, `RAW/ad-shelf.log`).
    Clothing showed "open" on 316 / 331 / 302 sampled weeks, and a live kit deal existed on none of
    them. In every one of the 949, the engine could not write the letter the shelf promised.
  - **Why no test saw it.** The letter side is tested
    (`tests/round29p4-ad-portfolio.test.ts:20`, the "no live kit deal" negative arm). The shelf side
    has no such case.
- Why it matters:
  - This is the calibration's "two spellings of one fact", in the form "a chip re-authored the
    engine's refusal and made an unconditional claim the engine never made". Here both spellings sit
    inside the engine.
  - It is reachable in any career without a live kit deal: before the first one, between deals, and
    after a refusal.
  - The owner already asked once why a letter never came (round 42 #39a, `InboxSheet.vue:92-100`).
    This shelf is a standing promise of the same kind.
- Proposal:
  - Put one gate beside its writer: `adCategoryOpen(world, category)` in `world/sponsors.ts` returns
    the verdict and its reason (band, junior, tenure, Slam, kit).
  - `reviewAdOffer` calls it before its roll. `adPortfolioView(world)`, moved out of the IIFE into the
    same file, calls it for the row.
  - The roll stays where it is and stays keyed as it is (`adWritesAt`, `seed:ad:<category>:<week>`),
    so no draw moves.
  - Which existing row a kitless clothing slot shows is an owner question. Options: `closed` with
    "Not open yet" (an existing string, `MoneyScreen.vue:2543`), or a new reason line, which is new
    wording.
  - Test: the probe as a mounted or unit case – a career with no kit deal whose clothing row must not
    read `open` – mutated both ways.
- Blast radius:
  - RNG: none (pure reads; the sub-stream call site is unchanged).
  - Wording: the kitless row (the owner's call); every other row byte-identical, proven by
    deep-equal `adPortfolio` over the e2e fixtures and the 90 golden saves before and after.
  - Balance: none.
  - Tests: `adPortfolio` → 3 files, `reviewAdOffer` → 7.
- Effort: S
- Confidence: high – measured over three careers. A career that signs kit deals would show the
  complementary weeks, where the row is honest.
- Versus 05.09: new
- Verification: CONFIRMED – the letter writer skips clothing without a live kit deal (sponsors.ts:827-829) while the adPortfolio IIFE (snapshot.ts:1754-1858) marks clothing open whenever its fee is priced, and the probe reproduced 316/331/302 on the three presets with 0 live-kit weeks; the verifier notes the 949 counts kitless weeks under a bench policy that never answers offers, not a typical player's share.

### B-04 · "Which questions stop time" is spelled in every loop that moves time, and the engine's own multi-week loop has already dropped the shoot clash
- Severity: P2
- Category: duplication
- Evidence:
  - **The list is written five times:**
    - `ADVANCE_REFUSALS` (`world/multiWeek.ts:317`, hand-written, 8 members);
    - `advanceRefusal` (`:325-378`, 8 clauses);
    - the worker's `decisionOpen` (`sim.worker.ts:357-392`, 8 clauses – lane D's D-03);
    - `advanceWeeks`' mid-loop stops (`engine/world.ts:2458-2520`, 7 of the 8 blocking members plus
      the reports);
    - `resumeFromCollege`'s pause set (`:2686-2745`: tournament, call-up, league, birthday).
  - **The engine loop has drifted.** `advanceWeeks` adds `'tournament'`, `'knock'`, `'birthday'`,
    `'life'`, `'ending'`, `'fork'` and `'retirement'` after each tick, but no `'shoot-clash'`, which
    `STOP_PRECEDENCE` and `advanceRefusal` both carry.
  - **The probe.** `b-clash-midspan.ts` builds `tests/round29-shoot-clash.test.ts`'s own collision
    two weeks early and advances 4 weeks, on 3 seeds (`RAW/clash-midspan.log`):
    - it returns `stops=["tournament"]` at week 216;
    - the tick trace shows `w215:open=true` passed without a stop;
    - the control (standing on week 215) refuses with `["shoot-clash"]`.
    - The owner's four-answer question was never asked, and neither arm that is only possible before
      the week began remained possible.
  - **Why it is not reached today.** The UI offers a multi-week span only inside a layoff
    (`spanWeeksFor`, `multiWeek.ts:273-283`), and a layoff nulls the clash (`shootClash.ts:64`).
  - **But the engine accepts it.** The worker accepts `advance` for 1 to 52 weeks
    (`sim.worker.ts:265-270`). The engine therefore relies on the screen's span arithmetic, which is
    exactly what invariant 1 says it must not do.
  - B-01 is the same drift in the college loop, and it is reached.
- Why it matters:
  - Each new blocking kind has to be added to five places.
  - The record shows what that costs. The life beat was missing from the worker copy from v73 to v85
    (`CLAUDE.md`, `827efe6f`). The shoot clash is missing from `advanceWeeks` today. The life beat is
    missing from the college loop today (B-01).
- Proposal:
  - One owner, `openQuestions(world): StopReason[]` in `world/multiWeek.ts`. It returns every
    `ADVANCE_REFUSALS` member that holds, in that order.
  - `advanceRefusal` becomes `openQuestions(world)[0] ?? null`.
  - The `advanceWeeks` loop adds `for (const r of openQuestions(world)) stops.add(r)` in place of its
    seven hand-written lines, which also adds `'shoot-clash'`.
  - `resumeFromCollege` reads it for the members its ruling (B-01) lets pause.
  - The worker uses `advanceRefusal(w) !== null` (D-03).
  - `r2-13-advance-span.test.ts`' drift guard then counts one list.
- Blast radius:
  - RNG: none (pure predicates). Stops stay byte-identical on every span except one that crosses an
    opening clash, which is unreachable from the UI. Proof: `round11`, `r2-13-advance-span` and
    `dev-fast-forward` stay green; the probe's mid-span arm returns `["shoot-clash"]` at week 215.
  - Schema and wording: none.
  - Tests: `advanceRefusal` → 13 files, `advanceWeeks` → 43, `decisionOpen` → 1.
- Effort: S
- Confidence: high – the probe was run on three seeds.
- Versus 05.09: new
- Verification: CONFIRMED – the blocking-question list is spelled separately in ADVANCE_REFUSALS, advanceRefusal, decisionOpen and advanceWeeks' mid-loop stops, the mid-loop stops (world.ts:2447-2461) lack shoot-clash with no explanation, and the probe reproduced byte for byte; the UI does not reach it today, so P2 stands.

### B-05 · The engine does not re-validate the reveal trio – `closeTournament` on an unfinished run drops her points, her record and the condition it cost
- Severity: P2
- Category: correctness-risk
- Evidence:
  - **The contract.** `closeTournament` is documented "Dismiss a finished reveal" (`engine/world.ts:1336`).
  - **The code does not check `finished`.** After the college and call-up dispatch it runs
    `world.pendingTournament = null` unconditionally (`:1353`).
  - **The probe.** `b-close-unfinished.ts` walked 3 seeds to an open week-3 reveal
    (`RAW/close-unfinished.log`) and compared two arms:
    - Close-only: 0 match rows, 0 result rows, a 0-0 season record and condition 100.
    - Skip then close, the UI's path: 2 / 3 / 1 match rows, a result row, a record of 1-1 / 2-1 / 0-1
      and condition 92 / 88 / 97.
    - The next tick runs normally after the drop.
  - **The sibling no-ops commit anyway.** `revealTournamentRound` and `skipTournament` silently
    return when nothing is pending (`:1296`, `:1325`), and `mutate` still commits a revision. That is
    the "commits a revision for a world that did not move" class E-06 closed for `weeks`
    (`sim.worker.ts:263-264`).
- Why it matters:
  - Invariant 1 promises that a stale or foreign command cannot corrupt a career. Here the engine
    trusts the screen to send `close` only after the finale (`TournamentFlow.vue:644`).
  - A free tournament – no condition cost and no loss on the record – is exactly what the caller
    order is protecting, and nothing engine-side does.
  - The shipped UI never reaches it, hence P2.
- Proposal:
  - Make `close` total rather than refusing: `if (p && !p.finished) skipTournament(world)` before
    clearing. An unfinished run is then finished, not dropped.
  - No new sentence is needed, and the guaranteed exit that `blockingOverlay.ts:147-151` relies on
    stays guaranteed.
  - The two no-ops can stay idempotent, as their doc says, or refuse – refusing needs a sentence, so
    it is a question for the owner.
- Blast radius:
  - House laws: no RNG (finalizing draws nothing new – the run was simulated at the tick), no schema,
    no wording.
  - Tests: `closeTournament` → 133 files, but a by-file check finds 0 test files that close without
    first skipping or revealing. One archival tool relies on the drop (`tools/summer-bench.ts:78`,
    typechecked, not run).
- Effort: S
- Confidence: high – measured.
- Versus 05.09: new
- Verification: CONFIRMED – closeTournament clears pendingTournament with no finished check (world.ts:1353) against its own doc and invariant 1, and mutate commits a revision regardless; only the finale calls it in the shipped app, so P2 stands (small numeric slip: skip-then-close gave 1/1/0 kid result rows, and 132 rather than 133 test files call closeTournament).

### B-06 · Required at the type, optional at the read – 169 defaults on 39 required `WorldState` members, while 16 others crash and 3 silently become NaN
- Severity: P2
- Category: correctness-risk
- Evidence:
  - **The defaults.** `b-required-defaults.mjs` (`RAW/required-defaults.log`) finds 89 required and
    19 optional members of `WorldState`. It counts 169 `??` / `?.` reads of required non-nullable
    members across engine and worker code (with `migrations.ts` excluded). The largest:
    - `offers ??` 14;
    - `trophiesByTier?.` 14;
    - `bond ??` 13 (e.g. `spirit.ts:1407`);
    - `masseurHired ??` 12;
    - `temperament ??` 8.
  - **The default is written twice.** `bond: number` is required (`world/state.ts:1329`). The
    migration writes the literal `save.bond ??= 70` (`migrations.ts:2468`, a literal by house rule),
    and 13 read sites write `?? ECONOMY.bond.start`.
  - **The other half.** Lane D's D-04 sweep, reproduced by `b-spine-sweep.ts` (`RAW/spine-sweep.log`):
    16 of 103 top-level keys of `v89.json` pass the gate and then throw.
  - **What survives, and how.** 60 keys pass and "survive" a snapshot plus four ticks
    (`b-spine-silent.ts`, `RAW/spine-silent.log`), and the survival is not clean:
    - `condition` → NaN, and still NaN after 4 ticks;
    - `peakPhysical` → NaN; `composureBonus` → NaN;
    - `bond` 66.5 → 70 and `spirit` 78.3 → 75, re-defaulted silently;
    - `seasonWins` and `physioActive` stay `undefined`.
- Why it matters:
  - There is no load policy. For each required field, a reader decides at the read whether the field
    may be missing: 39 fields default, 16 crash and 3 corrupt.
  - The defaults also hide missing fields from the spine that is supposed to catch them. A future
    retune of `ECONOMY.bond.start` would move what a damaged save wakes up as, which is what the
    migration's literal rule exists to prevent.
  - It needs a foreign or hand-edited file to reach the crash and NaN arms, hence P2, E-02's grade.
- Proposal:
  - Normalise at the door, once. Every required member is either a spine row that refuses (D-04's
    proposal) or is filled by a named post-migration normaliser with the migration's literals.
  - Then drop the `??` on required members module by module, as waves touch them. Do not sweep.
  - The probe's counter becomes a one-way ratchet (the `pins:check` pattern): the count may only fall.
- Blast radius:
  - House laws: no RNG or balance on a well-formed save; no schema move (required members are
    already written by `createWorld` and the migrations); no wording.
  - Tests: `world.bond` → 38 files. Tests that hand-build partial worlds (`as WorldState`) → 52 files;
    these are the ones a dropped default would expose.
- Effort: M
- Confidence: high on the counts. Medium on whether some partial-world tools depend on a default,
  which a `check:tools` plus unit run per module would settle.
- Versus 05.09: new (the crash half is E-02's, carried by D-04)
- Verification: PLAUSIBLE – every probe number reproduces (89/19 members, 169 sites, 16 of 103 keys pass the gate then throw, 60 survive with NaN/reset fields), but '39 members' is 39 field/operator pairs over 36 distinct fields with 3 sites in the seedWorldForV6 hydrator, and 'no single load policy' misses the documented ruling at saveGuard.ts:229-234; what is proven is that the ruling's premise has failed (peakPhysical now goes NaN, knockHistory now throws at the tick).

### B-07 · Lead 2 – the life-beat rolls need a key-inventory pin, not a shared primitive: 20 sub-stream keys, 3 in no test, and a renamed key passes its own suite
- Severity: P2
- Category: tests
- Evidence:
  - **The pattern exists.** `lifeBeat.ts` holds 20 code lines calling `rngFromSeed` (`git grep`). Eight
    are the hazard shape "eligibility → chance → `if (rngFromSeed(key)() >= chance) return` → write":
    `rollArrival :5112`, `rollSmallTalk :5679`, `rollEnds :5951`, `rollLeak :6305`, `rollWedding :6595`,
    `rollPregnancy :7185`, `rollPregnancyLoss :7835`, `rollBereavement :7999` (`RAW/roll-bodies.txt`).
  - **The keys do not share a shape**, so a primitive cannot compose them without risk:
    - `life:<kind>:<week>` (arrival, ends, wedding, pregnancy);
    - `life:leak:<episode>:<week>`;
    - `life:pregnancy-loss:<conceivedWeek>:<week>`;
    - `life:loss:<week>` for bereavement, not `life:bereavement` – kept distinct on purpose
      (`lifeBeat.ts:7920-7925`).
  - **Seven modules have an inventory pin; lifeBeat has none.** `tests/knock.test.ts:268` is one of
    seven, with `kidLife`, `match-retirement`, `offers`, `preview`, `radar-read` and
    `redesign-home`. Each asserts the full key set of its module. `lifeBeat.ts` has the most keys of
    any file and no such pin.
  - **Three keys appear in no test:** `life:loss`, `life:pregnancy-loss`, `life:window`
    (`git grep -l <key> -- tests` → 0).
  - **The mutation.** `life:loss` → `life:bereavement` in a scratch worktree leaves
    `tests/wave11-bereavement.test.ts` at 14 of 14 green (`RAW/mut-bereavement.log`). The suite finds
    its deaths "on the engine's own dice", so any key yields some deaths. The frozen MAIN capture
    cannot see a sub-stream.
- Why it matters:
  - **The price of a shared primitive.** It saves about one line at each of 8 sites, about 8 of the
    file's 1,969 code lines. It either takes the whole key (no gain) or composes it from a kind (a new
    way to write `life:bereavement` by accident).
  - **Its proof.** CLAUDE.md requires byte-identical keys, and today nothing could show that for the
    three unpinned keys. A refactor that moved one would pass the gate and silently re-deal every
    career's deaths, losses and conception windows.
- Proposal:
  - Do not extract a roll primitive; the saving is too small for the risk.
  - Add `tests/life-beat-keys.test.ts` on the `knock.test.ts:268` pattern. It reads
    `engineModuleSource('world/lifeBeat')` through `tests/worldSource.ts`, extracts every
    `rngFromSeed(\`…\`)` template, and asserts the exact set of 20.
  - Mutation check: rename `life:loss` and watch it fail.
  - If a primitive is ever wanted, it lands after this pin and takes the literal key, so identity is
    proven by the pin plus the key-count nets.
- Blast radius:
  - House laws: none; a new test only. RNG keys are frozen by it rather than moved.
  - Tests: 0 files move; `life:` → 33 files already mention a key.
- Effort: S
- Confidence: high – the mutation was run.
- Versus 05.09: new
- Verification: CONFIRMED – lifeBeat.ts has 20 rngFromSeed code lines, life:loss, life:pregnancy-loss and life:window appear in no test, and renaming life:loss left wave11-bereavement 14 of 14 green in a scratch worktree; nuance: the seven existing pins (e.g. knock.test.ts:268) assert a prefix allowlist, not the exact key set.

## P3 – polish

| id | title | file:line | one-line proposal |
| --- | --- | --- | --- |
| B-P3-01 | `setWeightEnabled` has no `guardNotEnded` while its note says it has "`setCoachOnEventWeeks`'s shape and nothing more" | `engine/world/lifeBeat.ts:7747-7749` | Add the guard, or say in the note that settings stay writable on an ended career. The owner rules which. |
| B-P3-02 | Three answer commands route an unknown enum to a default arm instead of refusing: `decideKnock` (anything not `'rest'` becomes a push), `answerShootClash` (anything unmatched becomes "do both"), `answerFork` (anything not `'college'` goes to `endingForForkAnswer`) | `world/knock.ts:365-389`, `world/shootClash.ts:208-254`, `world/endings.ts:1116-1130` | Check against the choice list at entry, as `setPsychologistFocus` does (`psychologist.ts:560`). The refusal sentence is the owner's. |
| B-P3-03 | `lifeBeatSaid` takes 10 positional parameters with defaults, and `stage = 'school'` means a caller that forgets the stage silently renders the roof; `birthdayOffer` takes 9 | `world/lifeBeat.ts:3838-3849`, `world/birthday.ts:1218` | An options object when next touched (E-10's recipe). |
| B-P3-04 | E-11's orphaned doc comment still sits above `medicalWithdrawalWeek`; `seasonWins`/`seasonLosses` have none | `world/state.ts:1221-1223`, `:1233-1234` | Move the three lines above `:1233`. |
| B-P3-05 | The prose bound "≈ EVENTS_CAP − kept − 120 ≈ 265" holds early only; kept rows reach 96–107 by the end (00-baseline §B.6), which leaves ≈ 175 | `world/constants.ts:192-197` | Restate it as a formula with no number, or pin the number. |
| B-P3-06 | The feed ends 404 rows against a cap of 400 on the ending week: rows are written after `housekeep` (`settleMandatoryQuota`, `maybeFireSeasonWrapUp`, `resolveEndings`) | `world/phaseAiWeek.ts:504-513` | Bounded and harmless. Note it at `EVENTS_CAP`, or prune once more at the latch. |
| B-P3-07 | Two notes claim "a blocking row stops the week", which is false inside `resumeFromCollege` | `world/lifeBeat.ts:3788`, `:4582` | Re-aim both with B-01's ruling. |
| B-P3-08 | `migrateSave` is one function of 805 code lines over 3,109 | `engine/migrations.ts:203` | Append future steps as named step functions called from the ladder; shipped steps are never touched. |
| B-08 | Lead 3 – twelve roof lines sit on events gated at 23 and can never be shown; `'engaged'` is a third pool beside the two already queued (re-rated P2 → P3 in verification; write-up below) | `world/lifeBeat.ts:2645`, `:2809`, `:2870`; `economy.ts:5090`, `:5790` | Owner's call on the copy: collapse the three pools to the away column as the divorce pool was, or keep the drafts and say why; engine side, a reachability pin from each presence-keyed kind's age gate to `lifeStageAt`. |
| B-09 | `toSnapshot` is a 915-line function that decides domain verdicts inline, and `world.ts` grew 27 % since 05.09 (re-rated P2 → P3 in verification; write-up below) | `world/snapshot.ts:1485-2399`, `:1754-1858`; `engine/world.ts` | Span-move the named derivations (`adPortfolioView` with B-03, `divorcedWeeksAgo`, `forkAftermath`) beside their owners, identity by deep-equal `toSnapshot` over the e2e fixtures and 90 golden saves. |
| B-P3-09 | The engine-side twin of E-01: two notes in `entryVerdict` still say the allowance is "gone until the season turns", and the pro note says the refusal must tell the parent "it is THIS season's", while the code under each counts her birthday year (`entryCapUsage` / `proEntryCapUsage`, `world/entryCaps.ts:41-68`, `:285-288`) and both refusal strings already say "on her next birthday". Unchanged since `ea708fa89` (02.08). Comment-only, so no rendered string moves. Handed over by lane E (`05-ui.md`, Not reviewed); `medical.ts` is a `world/*` file | `world/medical.ts:795`, `:817-822` | Re-aim both notes at the birthday window in the same pass as C-02's stale age-grid notes (the same "a note restates a rule the code has left" class). No wording question: no player sees these lines. |
| B-P3-10 | The household meter lives inside the coach bill. `householdWeekly`, `familyWeeklyIncomeCents` and `supportPayrollWeeklyCents` are the family's whole weekly picture (parents, retainer, merch, academy, staff, assets, upkeep), yet they sit in `coachMarket.ts` and reach the snapshot only as `coachBilling().household` (`:825`, `:828`). 12 of `coachMarket.ts`' imported symbols, from 7 modules (`masseur`, `psychologist`, `sparring`, `assets`, `business`, `economy`, `offers`), are used by these three functions and nothing else. `coachBilling.household` has 6 mentions in components and composables, one of them the live read (`HouseholdStrip.vue:40`) | `world/coachMarket.ts:936-1118` | When the household next changes: move the three into `world/household.ts` beside a top-level `Snapshot.household`, a pure span-move with comments verbatim, identity by deep-equal snapshot over the e2e fixtures and golden saves. Tests that move: `coachBilling.household\|householdWeekly` → 12 files. |
| B-P3-11 | `travelCoverReachesHer` passes `{ travelCostCents: 10_000_00 } as SeasonEvent` to `supportedTravelCents`, whose honesty rests on a note that the callee reads nothing else on the event. The cast hides it from the compiler if the callee ever reads `week` or `tier` | `world/coachMarket.ts:857`, `world/sponsors.ts:985-990` | Narrow `supportedTravelCents`' parameter to `Pick<SeasonEvent, 'travelCostCents'>`, so the note becomes a type and the cast goes. No behaviour moves. |
| B-P3-12 | B-07's gap has two cosmetic siblings: `album:flavour:patch` (the childhood club's name, `world/albumBook.ts:1151`) appears in no test, and `:rubbers:` (`world/college.ts:523`) in one. The album is assembled on demand from the seed, so a renamed key would silently rename her club in every existing career's album | `world/albumBook.ts:1136`, `:1151`; `world/college.ts:115`, `:317`, `:523`, `:892` | Extend B-07's key-inventory pin to `albumBook` and `college` in the same file; mutation check by renaming `album:flavour:patch`. |

### Re-rated to P3 in verification: B-08 and B-09

Both were filed at P2 and re-rated to P3 by Phase 2. They are rows in the table above, as §8 asks. Their write-ups follow unchanged, Verification lines included, because the Seed-leads answer (B-08) and the E-09 delta row (B-09) cite their evidence.

### B-08 · Lead 3 – twelve roof lines sit on events gated at 23 and can never be shown; `'engaged'` is a third pool beside the two already queued
- Severity: P3 (re-rated from P2 in verification)
- Category: correctness-risk
- Evidence:
  - **The presence law.** Presence is derived from the life stage and nothing else
    (`lifeBeat.ts:615-619` → `diary/words.ts:79`). Roof means `school` or `after-school`. At 22 or
    over, a girl out of school and not at college is `independent`, which is away, and college is away
    too (`diary/facts.ts:423-431`).
  - **The three pools.** Each is keyed by temperament × presence:
    - `ENGAGED_HER_LINE` (`:2645`), raised by `rollWedding`, gated `kidAgeNow >= wedding.ageGate` = 23
      (`economy.ts:5090`, ruled 11.09);
    - `EXPECTING_HER_LINE` (`:2809`), which needs a latched episode, so 23 or over;
    - `BEREAVEMENT_HER_LINE` (`:2870`), gated `fromAgeYears: 23` (`economy.ts:5790`).
  - Their 4 + 4 + 4 `roof:` strings are unreachable at 23 or over.
  - The divorce pool's collapse (23.09, `2ef9d0fb`/`739797c5`) is still in place:
    `DIVORCED_HER_LINE: Record<Temperament, string>` at `:2946`.
  - The full sweep is under Seed leads below.
- Why it matters:
  - Twelve player-facing strings are carried, reviewed by the owner as drafts, and would pass any
    pin, yet no career can show them. That is review time spent on dead copy.
  - Worse, a completeness pin that demanded both columns would enforce writing more of them.
  - Expecting and bereavement are queued (`docs/now-next-later.md:227-230`, "The unreachable-roof
    siblings"). The new evidence is `'engaged'`, the same shape, which is not on that list.
- Proposal:
  - An owner decision, since the copy is his: collapse the three pools to the reachable column as the
    divorce pool was (`PresenceCell` → `string`, the `away` text kept byte-identical), or keep the roof
    drafts for a future younger gate and say so in the pool's note.
  - Engine side, either way: a reachability pin that maps each presence-keyed kind to its age gate and
    asserts `lifeStageAt` is away for every week at or past it. The next pool keyed on a gate at 22 or
    over then fails at authoring time.
- Blast radius:
  - Wording: the owner's call; every rendered string stays byte-identical, because only unreachable
    ones would leave. RNG: none. Schema: none.
  - Tests: `ENGAGED_HER_LINE\|'engaged'` → 11 files.
- Effort: S
- Confidence: high – the gate constants and the stage derivation are read directly.
- Versus 05.09: new
- Verification: CONFIRMED – presence comes only from lifeStageAt via the single lifeBeatSaid caller and all three pools are gated at 23 or over, so the 4+4+4 roof strings are unreachable; expecting and bereavement are already queued and the new engaged pool is dead copy and an owner wording call without a measured correctness cost, hence P3.

### B-09 · `toSnapshot` is a 915-line function that decides domain verdicts inline, and `world.ts` grew 27 % since 05.09
- Severity: P3 (re-rated from P2 in verification)
- Category: architecture
- Evidence:
  - **The function sizes.** `b-fn-sizes.mjs sizes` over `world.ts`, `world/*` and `migrations.ts`
    (`RAW/fn-sizes.txt`) finds 864 top-level functions, 28 over 50 code lines and 7 over 100:
    - `migrateSave` 805 code / 3,109 lines (`migrations.ts:203`, append-only by law);
    - `toSnapshot` 390 / 915 (`world/snapshot.ts:1485-2399`);
    - `finalizeTournament` 170 / 534 (`world.ts:713-1246`; E-09 read 166 / 485);
    - `createWorld` 146 / 539 (`:1527-2065`).
  - **`toSnapshot` holds domain logic inline.** `snapshot.ts` has 6 IIFEs (`grep -c "(() => {"`),
    among them `divorcedWeeksAgo` (`:1641-1648`), `forkAftermath` (`:1662-1668`) and the 105-line
    `adPortfolio` (`:1754-1858`), which re-derives the ad gates B-03 found drifted.
  - **`world.ts` has grown.** 2,265 → 2,878 lines, 953 of them code (00-baseline §A2). The barrel
    importers went 486 → 747 (§A1; lane A owns the barrel).
- Why it matters:
  - A verdict that lives in an anonymous block of a 915-line function has no name to test and no
    owner to find. B-03's drift survived there because the gate's second spelling was not a function
    anyone could point a test at.
  - The source pins make each later move dearer: `snapshot.ts'` → 5 files, `engine/world.ts'` → 12.
- Proposal:
  - Span-move, comments verbatim, the domain derivations to named view builders beside their owners:
    - `adPortfolioView` to `world/sponsors.ts` (with B-03);
    - `divorcedWeeksAgo` and `forkAftermath` to `lifeBeat.ts` / `endings.ts`.
  - `toSnapshot` keeps only assembly.
  - Run `git grep -l "engine/world/snapshot.ts'" -- tests/` first, per CLAUDE.md.
  - Prove identity by deep-equal `toSnapshot` over the 13 e2e fixtures and the 90 golden saves before
    and after.
  - `finalizeTournament` stays where it is until a feature needs its seam (E-09's standing ruling).
- Blast radius:
  - House laws: no RNG (views draw nothing), no schema, no wording (byte-identical by the deep-equal).
  - Tests: `toSnapshot` → 269 files as callers, 5 source pins.
- Effort: M
- Confidence: medium – the size numbers are measured, but the cost argument rests on one drift
  (B-03). A second restated verdict found in a remaining IIFE would raise it.
- Versus 05.09: carried (E-09)
- Verification: PLAUSIBLE – every size number holds (864 functions, toSnapshot 390/915, finalizeTournament 170/534, 6 IIFEs, world.ts +27 %), but the cost argument is unproven: the shelf is tested by name through toSnapshot(world).adPortfolio so B-03's drift was a missing test arm, 'world/snapshot.ts' has 3 real source pins rather than 5, and world.ts decomposition is already ongoing work, so this is size debt without its own measured cost – P3, as 05.09 rated E-09.

## Delta versus 05.09

Lane C statuses E-03 (the card's chance against the match model) and E-10 (long parameter lists, in
`season/preview.ts` and `season/tournament.ts`). For C's table: `masseurWorksInWeek(hired, frozen,
bookedOff)` at `world/masseur.ts:407` is still three positional booleans.

| ID | title | status | evidence |
| --- | --- | --- | --- |
| E-01 | The published draw is not kept across the season boundary | fixed | `f2242e4c`; `world/phaseObligations.ts:63-70` hands `promised` to `renewCohort` (`season/conveyor.ts:125`); `tests/round35-draw-fact.test.ts` covers the boundary |
| E-02 | The import spine ends at v38, and the worker commits before it can build the reply | fixed as filed; the class is still open | `47a36cc0`: spine rows v11–v48 (`saveGuard.ts:235-252`); lifecycle ordering (`sim.worker.ts:319-327`, `:690`, `:722`). At v89, 16 keys pass then throw → lane D's **D-04**. The ordering is not applied to `mutate` → **B-02**. |
| E-04 | The RNG plausibility bound has a 0.6 % margin | fixed | `bf6fcca5`: `MAIN_DRAWS_FLAT_PER_WEEK = 8 + 2 * COHORT_SIZE` (`world.ts:2111`), `MAIN_DRAWS_PER_WEEK_MAX` (`:2117`); `tests/sim-worker-rng.test.ts` relates it to the tick |
| E-05 | Save-file error codes stop at the worker | fixed | `77bf2dc7`; `sim.worker.ts:823-833` maps `SaveFileError.code` |
| E-06 | Three wire payloads the engine trusts | fixed | `21ce03d5`: `guardWeeks` (`sim.worker.ts:265-270`), `profileShapeError` (`:298-299`), empty sanitised name refused (`db/saves.ts:422-431`). Enum payloads remain → B-P3-02 |
| E-07 | Two snapshot fields with no reader | fixed | `39971391`; `onRampCleared` and `recoveryBuff` are gone from the protocol (`git grep` finds only `migrations.ts:364`, `:983-1012`) |
| E-08 | 70 exports with no external consumer, 3 with none | fixed as ruled | `39aa7525`: `firstWeekOfMonth` and `AD_TIERS` deleted (`offers.ts:1916` notes it); `ENDING_BLURB` kept (`ending.ts:1110`), per the commit's own title |
| E-09 | `world.ts` decomposition status | still open, grown | 2,265 → 2,878 lines; `finalizeTournament` 485 → 534 lines; barrel 486 → 747 (§A1) → **B-09** |
| E-11 | Comment volume, and one orphaned doc comment | still open | orphan at `state.ts:1221-1223` → B-P3-04; the comment-share measurement is lane H's (00-baseline §A2: `world/state.ts` 92.2 %) |
| E-12 | Hand-rolled dollar formatters, and a comparator that is not a total order | fixed | `cc2e455c`; `git grep` finds no `Math.round(…/100).toLocaleString` in the engine outside the deliberate `college.ts:1236` |

## August review

No August section is assigned to this lane. P4 (the `world.ts` decomposition) is lane A's to status;
the engine-core numbers it needs are in E-09's row above and in B-09.

## Seed leads

**Lead 2 – the roll pattern: partially confirmed → B-07.** The pattern is real: 8 hazard sites in
`lifeBeat.ts` have the shape eligibility → chance → keyed roll → write. A shared primitive is refuted
on price, for three reasons:
- The saving is about 8 lines.
- The keys have four shapes, and one of them (`life:loss`) deliberately does not match its function's
  name.
- Byte-identity could not be proven today for three keys, because no test names them and a rename
  passes the file's own suite (mutation, `RAW/mut-bereavement.log`).

The device that is actually missing is the key-inventory pin seven other modules already have.

**Lead 3 – voice pools with unreachable cells: confirmed → B-08.** The sweep covers every pool keyed
by presence, plus the other axes a pool is keyed by. "Roof" = `school` / `after-school`; "away" =
`college` / `independent` (`diary/facts.ts:423-431`, `diary/words.ts:79`). Status at `03d92221`:

| pool (file:line) | axes | written by | gates | roof cells | away cells | verdict |
| --- | --- | --- | --- | --- | --- | --- |
| `MET_HER_LINE` `lifeBeat.ts:1171` | temperament × wants × presence | `'met'`, `rollArrival` `:5098` | age ≥ 16 (`economy.ts:4819`), no open episode, cooldown | reachable at 16–22 at home | reachable (college, 22+) | all reachable |
| `ENDED_HER_LINE` `:2291` | temperament × ends-register × presence | `'ended'`, `rollEnds` `:5919` (unmarried) | an open episode (16+) | reachable | reachable | all reachable |
| `SMALL_TALK_LINE` `:1491` (legacy subjects: worry / joy / question) | temperament × subject × presence (11 away frames; `sunny`/`joy` shared) | `rollSmallTalk`'s fallback `:5695-5703`, only when no situation is reachable | per voice: 2 unconditional situations at `school`, 13 at `after-school`, 38 at `college` / `independent` (`RAW/smalltalk-count.log`), minus the last 2 used | reachable (school only) | reachable only from a pre-corpus row (before `b801de6d`) still inside its three-week life | legacy by construction, not a defect |
| `ENGAGED_HER_LINE` `:2645` | temperament × presence | `'engaged'`, `rollWedding` `:6593` | age ≥ 23 (`economy.ts:5090`) | **4 unreachable** | reachable | ⚠ **new** → B-08 |
| `EXPECTING_HER_LINE` `:2809` | temperament × presence | `'expecting'` after `rollPregnancy` `:7181` | a latched episode (wedding, 23+) | **4 unreachable** | reachable | ⚠ **still stands** (queued, `now-next-later.md:227-230`) |
| `BEREAVEMENT_HER_LINE` `:2870` | temperament × presence | `'bereavement'`, `rollBereavement` `:7995` | the weight on, age ≥ 23 (`economy.ts:5790`), cap 2, spacing 156 | **4 unreachable** | reachable | ⚠ **still stands** (queued) |
| `DIVORCED_HER_LINE` `:2946` | temperament | `'divorced'`, `rollEnds` (married) | latched, 23+ | – (collapsed 23.09) | 4 | **fixed** (`2ef9d0fb`, `739797c5`) |
| `LOSS_HER_LINE` `:7891` | mother's temperament × told / untold (`null` for quiet / deep by ruling) | `rollPregnancyLoss` `:7830` | conception weeks 4–18; the announcement window is drawn | no presence axis | – | both columns reachable by design (`:7869-7872`) |
| `HER_LINE` `:672`, `HER_STOP_LINE` `:769`, `HER_CONTINUATION` `:801` | temperament × want × register / driver | `'fork-opinion'` at 19 | – | no presence axis | – | not swept past the axes |
| `*_HEADING_HEARD` `:2519`, `:2555`; `*_EVENT_HEARD` `:5228`, `:5377` | temperament × wants / register / read | the psychologist's listen | – | no presence axis | – | not swept |
| `VOICE_LINES` `diary/weekNotes.ts:559` | temperament × 8 moments × 4 stages | the diary, a licence per note | `restingKnock` / `pushingKnock` at `college`: the knock never rolls at college (`phaseGrowth.ts:399`), so these need a pre-departure knock still governing on a snapshot week | – | – | not settled; the licence-level sweep is lane C's |
| `BIRTHDAY_LINES` `:775` / `OFF_SEASON_LINES` `:794` | temperament × {school, after-school} / {college, independent} | the diary | college snapshot weeks are sparse (the year pauses only for a birthday, a league reveal or a call-up) | – | – | reachable in principle; not measured |
| `MOTHERHOOD_WORDS` `:881`, `FORK_AFTERMATH_WORDS` `:1051`, `BEREAVED_WORDS` `:958`, `DIVORCED_WORDS` `:1005`, `albumCorpus` `:68`, `ALBUM_ARC` `:1125` | temperament × band / arm / direction, or flat | the diary, the album | – | no presence axis | – | not swept past the axes |

One adjacent lead goes to lane C. The small-talk fact `'march-entry-open'` is evaluated inside the
college loop, where `world.ending` is `null` (`world.ts:2684`). Two situations declare `college`, so a
girl at college can be handed "the March tournament" decision while entries are frozen.

## Not reviewed

- **The 28 functions over 50 code lines, beyond the ones named.** `entryVerdict`,
  `maybeFireSeasonWrapUp`, `availabilityStatus`, `resolveBaseCosts` and the rest were sized, not read
  for logic (`coachBilling` was read in the gap-fill pass).
- **The gap-fill files, where they stop.** `coachMarket.ts` was reviewed in the gap-fill pass (Scope
  and method): its three commands re-validate engine-side (`guardNotEnded`; `hireCoach` also refuses
  an unknown id and the Elite gate through the same `eliteGateShortfall` the market row uses, so the
  screen's disabled button and the engine agree), it draws on no sub-stream, and it yields no P0–P2,
  only B-P3-10 and B-P3-11. Two things there look like smells and are deliberate by their own notes:
  `coachLadderNote` tests the RUNG rather than the event gate (`:3006-3010`), and coach tenure is read
  off the kept `coach-since-<week>` feed rows rather than a state field (`:212-236`, no schema bump).
  Its copy builders (`coachPlaqueLine`, `coachRoomNote`, `coachDeclineNote`, `coachBlurb`, the decline
  variants `:1951-2180`) were not read line by line: they are wording, which is the owner's. In
  `college.ts`, `medical.ts`, `assets.ts` and `albumBook.ts` only what Scope and method lists was read;
  their remaining derivations were not, and no finding rests on them.
- **The E hand-off about `world/medical.ts:817-822`** is closed here as B-P3-09 (with its junior-cap
  sibling at `:795`), not left to lane C.
- **The migration ladder's individual steps.** They are append-only by law; only the entry function's
  size was measured.
- **Snapshot and tick timing.** These are Phase 0's (§B) and lane G's.
- **The weekNotes licence-level reachability.** That is lane C's diary; the stage axis is in the lead-3
  table.
- **The barrel, P4 and the app map.** These are lane A's.
- **The store facade and the save codec.** These are lane D's. D-03, D-04 and D-07 are cited instead
  of duplicated: the worker's copy of the refusal list, the v89 spine, and the inbox's false "handful
  of rows" contract.

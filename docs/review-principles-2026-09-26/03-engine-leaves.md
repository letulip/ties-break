---
type: review
status: audit
area: project-review
canonical: false
last-reviewed: 2026-09-26
baseline: 03d92221
---

# Engine leaves & simulation – 26 September 2026 review

## Verdict

The leaf layer is the healthiest code in the engine by every structural measure this lane took. Its
49 modules hold 669 functions, and only two of them exceed 80 code lines (`simulateMatch` 116,
`assembleDiaryFacts` 95). Money is integer cents with no unrounded arithmetic. Every key suffix in
`ECONOMY` agrees with its value's unit: of 1,081 numeric leaves, one is flagged and it is a false
positive. The two model defects the 05.09 review found in this layer are both closed with tests:
E-01, the published draw lost at the season boundary, and E-03, the card's chance against the match
she plays. Lead 7's premise of `ECONOMY` keys nothing reads is mostly refuted. A type-aware probe
over all 884 leaf key paths finds **none unread by everything**, and only three unread by the
product: two are documented on purpose and one is a real case of the same fact spelled twice.

**Gap-fill, after verification.** Closing the hand-offs other lanes left with lane C found two
defects that outrank everything below. **C-06 (P0):** a knock can arrive on the week she leaves for
college, and it then stands unanswered under the college latch. `decideKnock` refuses it with the
freeze sentence, and at her first birthday or life-beat pause the app shows it as a dialog whose
only exit is that refused answer. That happened in 5 of 90 probed college careers, 2 of 30 on the
real fork at 19. **C-07 (P1):** the small-talk gate `'march-entry-open'` says "a March entry is
open and there is time to decide" on 24 of 95 college pause-weeks. On all 24, `enterEvent` refuses
that entry. Both live in lane B's files; lane C writes them up because B handed the second one over
and the first surfaced while settling lead 3's knock cells.

What matters is elsewhere, and three things matter most:

1. **A cache that can defeat a documented A/B (C-01, P1).** The rivals' run index is memoised on
   2 of the 5 knobs it is computed from. A patch to `tierMatchFatigue`, `matchFatigue` or
   `runFatigueLadderDeep` leaves the whole field on the shipped strains while her own path reads the
   patched knob. The probe reproduces this on all three knobs.
2. **The age grid is still restated in engine prose, and wrongly (C-02, P2).** The owner ruled on
   16.08 that there is one source of truth for the age grid. The decision log recorded two engine
   comments as still stale that day, and at `03d92221` three are. They state doorways at 16 and 17
   where `TIERS` says 14 and 15.
3. **`economy.ts` has become a file nobody can read whole (C-03, P2).** It is 8,911 lines and
   680,579 bytes, 92.6 % of its characters are comment, and the tuned values are 48,088 characters.
   Its comment lines grew 3,967 → 7,306 in 21 days against +407 code lines. A per-domain split keeps
   the `ECONOMY` object byte-identical and cuts what a builder loads to touch one block by one to two
   orders of magnitude.

Hot-path cost is not a lane-C problem at `03d92221`. The tick is 5.07 → 6.96 ms/week from the first
to the last hundred weeks (Phase 0 §B.2), and the leaf functions it calls are O(n log n) or better
over bounded inputs. The per-command cost that dominates the worker path belongs to lanes B, D and G.

## Scope and method

**Baseline.** `03d92221` in the clean worktree `/Users/letulip/Projects/Claude/tb-review`. Every
command ran there, with its output redirected to a file under
`RAW = /private/tmp/claude-501/-Users-letulip-Projects-Claude/c8208cb1-8875-425d-987a-91238b4d6641/scratchpad/review-raw/C/`
and an `X_EXIT=$?` sentinel appended inside the command. Every verdict below was read from a file
carrying `X_EXIT=0`. Per the Phase 1 rules, no timing was taken and no gate was run. Costs come from
`00-baseline.md` §B–§D, and the probes count operations instead of timing them.

**Scope** (lane map): `src/engine/*.ts` except `world.ts`, `migrations.ts`, `saveCodec.ts`,
`saveGuard.ts` and `rng.ts`, plus `src/engine/match/*`, `src/engine/season/*` and
`src/engine/diary/*`. That is 49 files, 11,806 code and 25,721 comment lines.

**Read in full:** the brief; `00-baseline.md`; `docs/review-principles-2026-09-05/02-engine.md`;
`docs/specs/engine-ui-parity-2026-09.md` (§Current truth).

**Read in part (code lines, then the notes around anything suspicious):**
- `match/engine.ts`, `match/liveProb.ts`, `match/point.ts:200-300`
- `season/ranking.ts:330-579`, `season/rival.ts:57-240`, `season/conveyor.ts:95-167`,
  `season/tournament.ts:499-712` and `:1024-1096`, `season/preview.ts:640-671`,
  `season/fieldPros.ts:700-1000`, `season/calendar.ts` (the age-gate notes, `:1612-1625`)
- `condition.ts` (all code lines), `body.ts:40-75`, `diary/words.ts:50-75`,
  `diary/weekNotes.ts:300-330` and `:2100-2159`, `diary.ts:666-721`, `nationalTeam.ts:100-132`,
  `collegeOffer.ts:405-422`, `ending.ts:60-76`, `:435-450` and `:1085-1112`, `offers.ts:735-770`
- In `economy.ts`: `:205-300`, `:845-870`, `:1000-1030`, `:3558-3575`, `:4600-4640`, `:4740-4800`,
  `:5150-5370`, `:5985-6080`, `:6262-6290`, `:6900-6935`
- The consuming sites named in each finding
- **Gap-fill additions:**
  - Every code line of `academy.ts`, `coach.ts` and `coachLoad.ts` (comment-stripped view).
  - `knock.ts:320-385`; `world/knock.ts:50-60`, `:95-112` and `:355-375`.
  - `world/phaseGrowth.ts:395-405`; `world/endings.ts:500-512` and `:960-987`.
  - `world/constants.ts:55-70`; `world/entries.ts:38-60`; `world/medical.ts:960-1000`
    (`entryStatus` / `entryVerdict`).
  - `world.ts:2223-2281` (`tickWeek`) and `:2610-2700` (`resumeFromCollege`); `world/lifeBeat.ts:1685-1740`.
  - `diary/weekNotes.ts:420-600`; `diary.ts:664-716`; `world/snapshot.ts:1680-1700`.
  - `composables/blockingOverlay.ts:59-100`, `components/KnockDialog.vue:8-70` and `App.vue:1093-1094`
    (read only to follow C-06 to the screen).
  - `offers.ts:165-180` and `:1075-1100`; `match/point.ts:120-130`; `season/tournament.ts:1024-1046`.

**Data-structure choices (gap-fill).**
- **Linear lookups at bounded sizes.** The leaves keep state as arrays of records and look things up
  linearly: `world.entries.includes` (about 2 rows), `offers.find` / `.some` by id (at most 274–364
  rows at career end, §B.6), `season.find` by id (about 190). No leaf module scans the ~2,200-row
  results window once per player: the only `results.filter` in leaf scope is `academy.ts:192`, once
  a year.
- **Rosters rebuilt on read.** `coachById` rebuilds the whole roster (`buildCoachRoster`,
  `coach.ts:682-733`) on each read. It is a pure function of (seed, age) over the roster slots, with
  15 call sites in `src` outside `coach.ts` (`git grep -c "coachById(\|buildCoachRoster(" -- src`): a
  choice for determinism, not a cost.
- **Dials outside `ECONOMY`.** Tuned constants also live as module exports: `PHYSIO_QUALITY` and
  `COACH_EDGE_CORRIDOR_PP` in `coach.ts:617`, `:826`, the strain/escalation dials in
  `coachLoad.ts:87-289` and `KNOCK_*` in `knock.ts`. They fall outside `economy-keys.mjs`' scope,
  which is a blind spot of the lead-7 method, not a finding.

**Searched, not read:** `docs/decisions.md`, `docs/now-next-later.md` and
`docs/backlog/the-quality-rig.md`, for `runsIndex`, `rival.ts`, `economy.ts`, `bond.step`,
`roundHalf`, `usCountryCode`, `replay`, options objects and E-08/E-10. Nothing in this report is
queued there. The one hit is `docs/decisions.md:1087-1092`, which C-02 carries forward.

**Probes** (in `docs/review-principles-2026-09-26/probes/`, copied to the same path in the worktree
and run from its root):

| probe | what it does | command → output |
| --- | --- | --- |
| `economy-keys.mjs` | Every leaf key path of a config object literal (default `ECONOMY`), and a reader search over one TypeScript program of 1,232 files: all tracked `.ts` in src, tests, tools and e2e, plus the 86 `.vue` files as virtual `.ts` with their template expressions. It resolves chains, aliases, destructuring, interface-typed branches (63 links), literal and union-typed dynamic keys, and escapes (a branch used whole). Verdicts: PRODUCT, PRODUCT-INDIRECT, TESTS/TOOLS-ONLY, DEAD. Method and blind spots are in its header. | `node --max-old-space-size=6144 …/economy-keys.mjs RAW` → `RAW/economy-keys.md`, `.json`; with `<module> <CONST>` for 15 leaf config objects → `RAW/keys-<CONST>.md`, summary `RAW/leaf-config-keys.txt` |
| `economy-mirrors.ts` | Walks the live `ECONOMY`. It reports identical numeric vectors (length ≥ 3), shared contiguous runs between branches, identical subtrees, and `===` object identity. | `npx vite-node …/economy-mirrors.ts` → `RAW/economy-mirrors.txt` |
| `economy-units.ts` | Checks each numeric leaf against its key suffix: `*Cents` integer, `*Bps` integer, share/prob ≤ 1, `*Weeks` integer. | `npx vite-node …/economy-units.ts` → `RAW/economy-units.txt` |
| (ad hoc, in `RAW`) | The Phase 0 line classifier applied per `ECONOMY` top-level block, with the character counts. | `python3 - > RAW/economy-split.txt` |
| `leaf-comment-growth.py` | Code and comment lines of the leaf scope at a given SHA. | `python3 …/leaf-comment-growth.py 98e3560b; … 03d92221` → `RAW/leaf-growth.txt` |
| `leaf-exports.mjs` | Every export of the 49 leaf modules, and its references by file through the type checker, with aliases and barrel re-exports followed. | `node …/leaf-exports.mjs RAW` → `RAW/leaf-exports.md`, `.json` |
| `leaf-functions.mjs` | Code lines per function, counted from the AST's token leaves, plus parameter counts and positional booleans. | `node …/leaf-functions.mjs` → `RAW/leaf-functions.txt` |
| `rival-cache-stale.ts` | Warms the rivals' run index, patches one knob the way the repo's benches do, then reads `rivalCondition` twice: cached, and after a forced rebuild. It also counts the size of the index. | `npx vite-node …/rival-cache-stale.ts` → `RAW/rival-cache-stale.txt` |

| `c-knock-at-latch.ts` (gap-fill) | Walks careers to a college latch: 60 with the fork forced at week 60 (the `collegeBirthdayFixtures` recipe) and 30 at the real fork at 19, answering every earlier knock `rest`. On a latch week with an unanswered knock it records `blockingOverlay(toSnapshot(world))` and `decideKnock` on a clone. It then presses `resumeFromCollege` the way the Home shell does and records the first press whose snapshot puts the knock on screen. | `npx vite-node …/c-knock-at-latch.ts` → `RAW/knock-at-latch.txt` |
| `c-knock-at-college.ts` (gap-fill) | Lead 3's `VOICE_LINES` knock cells at `college`. It reads `toSnapshot(world).diary` on every college-stage snapshot (latch week, knock answers, every press) for `knockChoice !== null` and the week note. Arm A is natural, with 30 careers on the fork at 19. Arm B plants a pushed knock on the week before departure, in 20 careers. | `npx vite-node …/c-knock-at-college.ts` → `RAW/knock-at-college.txt` |
| `c-march-entry-college.ts` (gap-fill) | 8 careers × up to 12 college presses. At each pause it records whether R8/R20 are in `reachableSituations(world, voice, 'college')` for any voice, mirrors the fact's predicate to find its March event (agreement 95/95), and tries `enterEvent` on that event on a clone. It also counts the R8/R20 rows actually raised inside the freeze. | `npx vite-node …/c-march-entry-college.ts` → `RAW/march-entry-college.txt` |
| `c-tick-growth.ts` (gap-fill, **no timing**) | Replays Phase 0's own career. That is `runtime-career.ts`' driver, `openCareer(PRESETS[5], 0, POLICIES[1])` after the same warm-up. It refuses the join unless the final world hash equals Phase 0's (`3272aa98f61626b3`: equal). Per week it counts results written, calendar events resolving by rung family, her point-simulated matches and their games, and every growing collection. It then joins Phase 0's own per-week `stepMs` (`review-raw/0b/career-middle0-r2-bare.json`). | `npx vite-node …/c-tick-growth.ts -- review-raw/0b/career-middle0-r2-bare.json RAW/tick-growth.json` → `RAW/tick-growth.txt`; window split `python3 - > RAW/tick-growth-windows.txt` |

Test blast radii: `git grep -lE "<q>" -- tests/ | wc -l` → `RAW/blast.txt` (gap-fill counts: `RAW/blast-gapfill.txt`).

## Findings

C-06 and C-07 were added in the gap-fill, after the other five had been verified. They are placed
in severity order and numbered after the existing IDs.

### C-06 · A knock that arrives on the departure week cannot be answered under the college latch – its dialog comes up at the first pause and its only exit is refused
- Severity: P0
- Category: correctness-risk
- Evidence:
  - **The order of one tick.** `tickWeek` runs `growAndLive` (`world.ts:2275`), which rolls the knock
    whenever she is not yet at college: `if (!inCollege(world)) rollKnock(world)`
    (`world/phaseGrowth.ts:399`). Then `closeTheWeek` (`world.ts:2281`) reaches `resolveEndings`
    (`world/phaseAiWeek.ts:538`), whose step 7c′ `resolveCollegeDeparture` (`world/endings.ts:509`)
    sets `world.college` and latches the `college` ending on the departure week (`:962-987`). On that
    week `inCollege` is still false at the roll, so a knock can arrive and the latch lands on top of it.
    Nothing at the departure retires or answers it (`retireKnock`'s only callers are
    `world/injury.ts:705` and `world/knock.ts:106`).
  - **The answer is refused.** `decideKnock` opens with `guardNotEnded(world)`
    (`world/knock.ts:361`), which throws `COLLEGE_FREEZE_REFUSAL` for a `college` ending
    (`world/constants.ts:68`).
  - **The year does not stop for it.** `resumeFromCollege` has no knock guard (`world.ts:2610-2668`;
    it returns early only for the reveal, the call-up and the birthday). An undecided knock never
    expires (`expireKnock`, `world/knock.ts:104-107`), so it rides through the freeze.
  - **The screen puts it up.** Under the latch, `blockingOverlay` returns `'ending'`, the college
    shell, unless a birthday or a life beat is laid over it. Once one is, the knock outranks both:
    `if (snapshot.knockPrompt) return 'knock'` (`composables/blockingOverlay.ts:91-95`).
    `KnockDialog` is "the one dialog in the app with no way out that is not an answer"
    (`components/KnockDialog.vue:12-16`), and its only control reaches `decideKnock` (`:59-68`).
    The birthday under it keeps `resumeFromCollege` returning `['birthday']` (`world.ts:2668`).
  - **Measured.** `npx vite-node docs/review-principles-2026-09-26/probes/c-knock-at-latch.ts`
    (`RAW/knock-at-latch.txt`, `X_EXIT=0`, at `03d92221`):
    ```
    forced60: careers 60 · college latched 60 · unanswered knock standing under the latch 3 · knock dialog put on screen at a freeze pause 3
    age19:    careers 30 · college latched 30 · unanswered knock standing under the latch 2 · knock dialog put on screen at a freeze pause 2
    age19 c-latch-age19-18: latch wk 294 (college.fromWeek 294), knock sinceWeek 294; overlay at latch = ending; decideKnock -> COLLEGE_FREEZE_REFUSAL
       press 0 wk 324: stops [ending,college-league] lifeBeatPrompt true -> overlay 'knock'; decideKnock -> COLLEGE_FREEZE_REFUSAL
    forced60 c-latch-forced60-0: … press 1 wk 128: stops [ending,birthday] birthdayPrompt true -> overlay 'knock';
       decideKnock -> COLLEGE_FREEZE_REFUSAL; resumeFromCollege again -> [birthday]
    ```
    In all five careers the knock arrived on the latch week itself (`sinceWeek === college.fromWeek`).
    In all five it reached the screen at the first pause, and the answer was refused.
  - **Not known or queued.** No hit for a knock at the departure or the freeze in
    `docs/now-next-later.md`, `docs/backlog/the-quality-rig.md` or `docs/decisions.md`
    (`git grep -n -i knock -- <file> | grep -i "college\|freeze\|depart\|latch"`). No other lane
    report has it. B-01 is the neighbouring defect, in which the year ticks past blocking life beats.
- Why it matters:
  - **A career that cannot continue.** The overlay stands over the college shell, the one answer it
    offers is refused on every press, and the birthday or beat beneath it cannot be reached. So the
    year cannot be pressed again. The state is in the world, not the screen: a reload restores it.
  - **Reachable on the real path.** It happened in 2 of 30 careers that chose college at the real
    fork at 19, and 3 of 60 on the fixture recipe. Nothing unusual is needed: a knock roll on the one
    week the departure lands.
  - **The class.** A guard (`guardNotEnded` in `decideKnock`) refuses a state that the engine's own
    tick order creates. The dialog promises an exit the engine will not honour. It is the brief's §11
    "boundary only the real runtime reaches". The shared college fixture calls `decideKnock` right
    after every tick, the latch tick included (`tests/collegeBirthdayFixtures.ts:150-156`). A seed
    that reached this state would throw there, so the committed seeds can only be ones that miss it.
- Proposal:
  - **Prevent the state, zero draws.** On the departure week, do not roll: gate the roll at
    `world/phaseGrowth.ts:399` on "she does not leave this week" (`fork.departsWeek`, the value
    `resolveCollegeDeparture` reads), or have `resolveCollegeDeparture` retire an undecided knock
    before latching. Which one is a design choice about her last week at home, so it is the owner's;
    neither needs a wording change.
  - **Repair a save already in the state.** Per the 03.09 ruling there are no players yet, so only
    the owner's own saves and the fixtures matter. Of the 90 golden fixtures, only `v50.json` holds
    a `college` ending, and its `knock` is null (a JSON scan of `tests/fixtures/saves/*.json`). The
    compressed e2e `.tsave` files and the owner's saves were not checked. If any is in the state, a
    repair is a save-schema move, which is the three-part law.
  - **Owner of the merged code:** `world/phaseGrowth.ts` / `world/endings.ts` (lane B's files).
  - **The net.** A unit test on the probe's seed `c-latch-age19-18` asserts that after the latch
    either `pendingKnock` is false or `decideKnock` succeeds. Its mutation arm restores today's
    order and watches it redden. A mounted test over the same snapshot asserts that
    `blockingOverlay` never returns `'knock'` for a knock the engine refuses.
- Blast radius:
  - **House laws.** RNG: `rollKnock` draws only on `seed:knock:<week>` (`world/knock.ts`, "ZERO
    main-stream draws", `:109`), so skipping it on one week moves no MAIN draw. The frozen capture 41550 /
    `e6b0c709` holds; prove it with `tests/condition.test.ts` unchanged. Behaviour moves only on the
    departure week of a college career. `npm run bench:knock` should be byte-identical outside that
    week. No wording. Save schema only if a repair step is chosen.
  - **Tests that would move:** `git grep -l "resolveCollegeDeparture" -- tests/ | wc -l` → 6,
    `rollKnock` → 8, `decideKnock` → 48 (most answer a knock outside college and are unaffected)
    (`RAW/blast-gapfill.txt`).
- Effort: S
- Confidence: high on the engine side: the probe reproduces it and every link is a cited line. The
  screen half comes from reading `blockingOverlay` (which the probe ran) and `KnockDialog`. A
  mounted test on `c-latch-age19-18`'s snapshot would raise it to certain.
- Versus 05.09: new
- Verification: CONFIRMED – every link holds at 03d92221 and the re-run probe reproduces 3/60 + 2/30 knocks at the latch, all refused with COLLEGE_FREEZE_REFUSAL under a 'knock' overlay whose only exit is that refused Proceed (reach caveat: both arms use coachTier 'self', a valid onboarding tier; a load-managing coach answers the knock inside rollKnock).

### C-01 · The rivals' run index is keyed on 2 of its 5 knobs – a dial on the other three leaves the whole field on shipped strains
- Severity: P1
- Category: correctness-risk
- Evidence:
  - **The cache.** `src/engine/season/rival.ts:100-134` memoises the (tier, finish) → strain
    index, and its only freshness test is
    `runsIndexCache.ladder === ladder && runsIndexCache.ladderWta === ladderWta` (`:110`).
  - **What the index is built from.** `runStrain` (`:77`) calls `tournamentRunStrain`
    (`src/engine/condition.ts:109`), which reads:
    - `ECONOMY.condition.matchFatigue` (`:32`)
    - `tierMatchFatigue[tier]` (`:37`)
    - `runFatigueLadderDeep` for draws over 32 (`:101`)
    - the two keyed ladders.
  - **The note calls this failure mode known.** Directly above the cache, the note (`rival.ts:81-99`)
    says it broke twice before: first as a module-load snapshot, then keyed on one ladder only. Its
    rule is "a knob object is replaced, never scribbled on in place".
  - **The key stopped at two ladders before the third existed.** It was widened to two ladders on
    01.08 (`fde515dd`), and the third ladder arrived on 14.08 (`84c7d12e`) without joining the key.
  - **The repo's own benches scribble in place.** `tools/season-equation.ts:203` (`withDials`,
    `npm run bench:season-eq`) patches `tierMatchFatigue[t]`, and its `noDrain` arm patches
    `matchFatigue.*`.
  - **A sweep already had to work around it by hand.** `tests/rivals.test.ts:757-758` records one:
    "the runsIndex memo invalidated – it is keyed on the ladder array, so a matchFatigue patch alone
    is invisible to it".
  - **Measured.** `npx vite-node docs/review-principles-2026-09-26/probes/rival-cache-stale.ts`
    (`RAW/rival-cache-stale.txt`, `X_EXIT=0`):
    ```
    knob                                  tier  shipped  CACHED  FRESH  kid run strain  stale?
    tierMatchFatigue +3 in place          w35   92       92      77     24 -> 39        STALE
    matchFatigue.straightSets +2          j300  75       75      65     41 -> 51        STALE
    runFatigueLadderDeep replaced         slam  70       70      45     46 -> 71        STALE
    index build: 16 tiers, 96 (tier, finish) pairs, <= 490 matchDrain calls
    ```
- Why it matters:
  - **This is the brief's own P1 example**, a copy that can defeat a documented A/B. Rival
    condition feeds `selectEntrants`' fitness floor (`season/tournament.ts:499-712`) and every draw
    preview. So an A/B on any of those three knobs moves her strain (24 → 39 above) and leaves 199
    rivals where they were, which measures half the game. That is the exact failure the cache's own
    note says it exists to prevent.
  - **No live bench is shown defeated today, and only by accident.** `season-equation.ts`' arms
    rebuild the index because its `finally` restores `runFatigueLadder` from a copy
    (`:191`, `:232`), which changes the array's identity.
- Proposal:
  - **Change.** Key the memo on the content of all five inputs, not on two identities. For example,
    a string of `runFatigueLadder`, `runFatigueLadderWta`, `runFatigueLadderDeep`,
    `matchFatigue.straightSets` and `Object.values(tierMatchFatigue)`, about 40 numbers. Or drop the
    memo: the index is 96 pairs and at most 490 `matchDrain` calls, and `rivalConditions` has three call sites
    (`world/weekField.ts:118`, `world/snapshot.ts:443`, `season/preview.ts:660`).
  - **Owner of the merged code:** `season/rival.ts`.
  - **The test.** Turn the probe into a unit test with its mutation arm: delete the new key term and
    watch the relevant row go STALE.
- Blast radius:
  - **House laws.** No RNG key or draw is touched (the index is pure), and no save schema, wording or
    balance is involved. The values served on shipped knobs are identical, so every frozen hash,
    including the 41550 / `e6b0c709` capture, holds.
  - **Bench arm proving no behaviour moves:** `npm run bench:fatigue`, plus the coach-travel-edge
    frozen hashes, byte-identical.
  - **Tests that would move:** `git grep -l "season/rival" -- tests/ | wc -l` → 17, of which only
    `runsIndex` → 1 (the `rivals.test.ts` comment) needs editing.
- Effort: S
- Confidence: high. The probe reproduces all three knobs. Showing a live bench producing a different
  table with the fix would raise it further.
- Versus 05.09: new
- Verification: CONFIRMED – rival.ts:110 checks only the two ladder identities while runStrain also reads matchFatigue, tierMatchFatigue[tier] and runFatigueLadderDeep, and the re-run probe reproduces the same three STALE rows (no live bench is shown defeated, because season-equation's finally restores copies).

### C-02 · The age grid is still restated in three engine comments, wrongly, 41 days after the owner's "one source of truth" ruling
- Severity: P2
- Category: docs
- Evidence:
  - **The owner's ruling, 16.08, verbatim:** «…оставь один источник истины, хватит мне это возвращать»
    (`docs/decisions.md:1058-1060`). That entry logged `economy.ts`' `proSubCapByAge` note as
    "STILL OUTSTANDING, IN CODE, AND REPORTED RATHER THAN TOUCHED" (`:1087-1092`). At `03d92221`
    three live claims contradict `TIERS`:
    - `src/engine/economy.ts:6276-6280`: "IT CANNOT BIND AT THE SHIPPED CONSTANTS … W75 opens at 17
      and no W rung above W15 opens below 16". In fact `w75.minAgeYears` is 14, per the `w75` block
      of `season/calendar.ts`, and `world/entryCaps.ts:370-384` says the opposite of the economy note
      about the same rule ("IT COULD NOT BIND AT ALL UNTIL 16.08, AND NOW IT CAN").
    - `src/engine/season/types.ts:226-229`: "W15 opens at 16 and the J rungs close after 18, so a
      sixteen-to-eighteen-year-old holds both tours". `w15.minAgeYears` is 14, and the calendar's
      own w15 note says the overlap "widens … to 14-18".
    - `src/engine/season/calendar.ts:1619-1620`, the doc of the age gate itself: "the adult rungs
      open at 16/16/17". Every W rung from w15 to w100 is 14 and wta125 is 15 (awk over the `TIERS`
      blocks).
  - **Dated records are not in this count.** The other hits of
    `git grep -nE "opens at (16|17)" -- src` are quoted and corrected text (`calendar.ts:790`, `:976`,
    `:1140`; `world/entryCaps.ts:372`; `world/birthday.ts:438`).
- Why it matters:
  - **A number in prose survives a full gate.** CLAUDE.md records this class, with wave 9's "32
    where the corpus held 28".
  - **This grid has already reached the owner twice as a contradiction.** A builder reading
    `isTierAgeOpen`'s doc, or the sub-cap note, today is told a rule the engine stopped applying on
    16.08. The sub-cap note's "cannot bind" is the premise of a documented deferral (a save-schema
    move for a pro-ledger tier).
- Proposal:
  - **The comments.** Replace the three numeric restatements with the pointer the 16.08 ruling
    prescribes: `docs/specs/college-is-its-own-branch-2026-08.md` §0a plus `TIERS[*].minAgeYears`.
    Keep the superseded sentences as quoted history, the way `entryCaps.ts:370-384` already does.
    Comments are not player wording, so no owner question is needed.
  - **Hand-off to lane H.** A test (`tests/tier-window.test.ts:170`, message "W15 opens at 16 and she
    is 14") carries the same stale sentence, and the decision log names it too.
- Blast radius:
  - **House laws.** Comments only, so no law is touched.
  - **Tests that would move:** `git grep -lF "CANNOT BIND" -- tests/` → 0 and
    `git grep -lF "opens at 16/16/17" -- tests/` → 0.
- Effort: S
- Confidence: high. It rests on the calendar table and the decision log. A sweep of `docs/specs/` for
  the same grid would be lane H's.
- Versus 05.09: new
- Verification: CONFIRMED – economy.ts:6276-6280, types.ts:226 and calendar.ts:1619-1620 assert doorways of 16/17 that TIERS contradicts (w15–w100 at 14, wta125 at 15), and no queue entry carries them.

### C-03 · `economy.ts` is 92.6 % comment by characters and cannot be read in one pass; the constants belong in per-domain modules
- Severity: P2
- Category: architecture
- Evidence:
  - **Size.** `wc -c src/engine/economy.ts` → 680,579 bytes and 8,911 lines (1,480 code / 7,306
    comment, §A2). By characters (`RAW/economy-split.txt`) that is 48,088 code against 602,935
    comment, **92.6 %**.
  - **What the constants are.** The `ECONOMY` literal (`:247-8452`) holds 884 leaf key paths in
    44 top-level blocks. They are 1,263 code lines against 6,849 comment lines.
  - **Growth since 05.09** (`RAW/leaf-growth.txt`): comment lines 3,967 → 7,306 (+3,339) against
    code 1,073 → 1,480 (+407), which is **8.2 comment lines per code line added**. The file grew
    379,954 → 680,579 bytes (+79 %). The whole leaf scope went 17,583 → 25,721 comment lines against
    9,567 → 11,806 code, or 3.6 per code line.
  - **The heaviest blocks**, as comment lines / leaves: `shop` 661 / 26, `sponsorship` 507 / 66,
    `motherhood` 416 / 32, `coach` 412 / 42, `advertising` 401 / 45, `business` 353 / 32,
    `development` 348 / 32. Per leaf: `managerCommission` 34, `summerBlock` 26, `shop` 25,
    `sponsor` 23.
  - **Scope of a change.** 191 test files import `engine/economy`, and
    `git grep -l "economy.ts'" -- tests/` finds no source pin on the file's text.
- Why it matters:
  - **Nobody reads it whole.** An agent that needs one block, say `vacation` at 232 lines, loads the
    file in five 2,000-line reads, or searches it and loses the notes around the value.
  - **It is where the growth is.** In the 21 days since 05.09, economy.ts added 3,339 comment lines,
    41 % of the whole leaf scope's growth in comments (+8,138, `RAW/leaf-growth.txt`).
  - **Not a bundle cost.** Comments are stripped, and economy is 26 KB in each chunk (§A5).
  - **Owner's call.** Lane H prices the comment convention itself. This finding is only about where
    the constants live, and it keeps every comment verbatim.
- Proposal:
  - **Move each top-level block**, value and notes verbatim (CLAUDE.md), into
    `src/engine/economy/<block>.ts` as a named const.
  - **What stays in `economy.ts`:** the assembled `export const ECONOMY = { wealthCorridor: …,
    shop: SHOP } as const`, in the current key order, plus the functions at `:8454-8911`.
  - **Why nothing breaks.** Object identity is preserved: every in-place bench patch
    (`ECONOMY.condition.x = …`) still reaches the same object the engine reads.
  - **Owner of the merged code:** `economy.ts` stays the one import path.
- Blast radius:
  - **House laws.** No RNG key is touched: the values are the same objects. No save schema or
    wording is involved (comments move verbatim). Balance is untouched.
  - **Proof of identity.** A hash pin such as `sha256(JSON.stringify(ECONOMY))` taken before and
    after, plus `Object.keys` order at every depth. Also `npm run bench:econ` byte-identical.
  - **Tests that would move:** 0 source pins
    (`git grep -l "engineModuleSource('economy')" -- tests/` → 0). The 191 importers are unchanged.
- Effort: M
- Confidence: medium. The mechanics are certain, but the value depends on the owner wanting
  constants separate from essays. Lane H's comment-cost measurement would raise it.
- Versus 05.09: carried (E-11, the leaf-module half)
- Verification: CONFIRMED – every number reproduces (8,911 lines, 680,579 bytes, 8.2:1 comment to code, 41 % of the leaf scope's comment growth), no test reads economy.ts's source text, and no ruling forbids the split.

### C-04 · The match replay contract is spelled seven times – four recorders and three replayers – and its guards spell it an eighth way
- Severity: P2
- Category: duplication
- Evidence:
  - **The mechanism.** A recorded match is replayed by re-running `simulateMatch(a, b, opts)` on
    the stored seed (`tests/match/match-annotation-parity.test.ts:9-12` describes it). Nothing
    shares `opts`.
  - **The engine records with** `{ surface, tour: JUNIOR_TOUR, seed }` at:
    - `season/tournament.ts:1036`
    - `world/college.ts:542` and `:904`
    - `world/planner.ts:418`
  - **The UI rebuilds it** at:
    - `components/MatchReplay.vue:37-41`
    - `components/PracticeFlow.vue:66-70`
    - `components/TournamentFlow.vue:693`, with `seed: m.seed ?? ''`
  - **The tests that assert "the replay reproduces the recorded winner" re-spell it too**:
    `tests/events.test.ts:281` and `tests/round10-view.test.ts:243`, `:249`, `:269-270`. They
    therefore prove that the tests' spelling reproduces the engine, not that the screens' does.
- Why it matters:
  - **The parity class, applied to matches.** A screen restates an engine fact here: the options a
    match was played under.
  - **How it breaks.** Suppose a recorder gains `momentum`, `firstServer` or a `condition` map
    (`MatchOptions` has all three; `match/engine.ts:104`, `:129` and `:138` read them). The tests will go red, get
    re-spelled, and the three screens will replay a different match under the recorded scoreline
    while every test stays green: the brief's §11 "two spellings of one fact".
- Proposal:
  - **One primitive.** `export function recordedMatchOptions(rec: { surface: Surface; seed?: string }): MatchOptions`
    in `match/engine.ts`, the owner.
  - **Who calls it.** The four recorders build their options through it, and the three replayers
    and the replay tests call it.
  - **The mounted net.** One mounted test on `MatchReplay` over a recorded career asserts that the
    replayed winner and score equal the record, with a mutation arm that adds `momentum: false` to
    one recorder.
- Blast radius:
  - **House laws.** RNG keys are unchanged: the seed strings are the same template, so draws are
    byte-identical. Prove it with `tests/match/match-annotation-parity.test.ts` (hash) and
    `tests/events.test.ts`. No schema, wording or balance is involved.
  - **Tests that would move:** `git grep -l "simulateMatch" -- tests/ | wc -l` → 42. Only the
    re-spelling sites (2 files) must change.
- Effort: S
- Confidence: medium. No divergence exists today. Lane E's parity sweep would confirm whether any
  other screen replays a match.
- Versus 05.09: new
- Verification: CONFIRMED – the recorders and replayers each spell {surface, tour: JUNIOR_TOUR, seed} on their own and no test compares an engine-recorded match through a mounted screen; the count is understated (PrologueLocalOpen.vue:196-200 is a fourth replayer, with more test re-spellings), and the cost is a verified mechanism, not a measured divergence.

### C-05 · `ECONOMY.bond.step` is a dial no write reads – the grid is a hard-coded `roundHalf`
- Severity: P2
- Category: duplication
- Evidence:
  - **The dial.** `src/engine/economy.ts:4635` declares `step: 0.5`, "the granularity every write
    rounds to".
  - **Nothing in the product reads it.** Every bond write rounds through
    `roundHalf(x) = Math.round(x * 2) / 2` (`src/engine/spirit.ts:442-447`, used at `:1408` and
    `:1661`), which never reads `step`. The only reader of `step` is `tests/spirit.test.ts:456`
    (`economy-keys.mjs` verdict TESTS-ONLY; the product spells the grid as a literal instead).
  - **The test tells a future tuner to turn it.** Its own note (`tests/spirit.test.ts:454-455`)
    says a wave wanting slower healing "changes the mechanism – a finer `step`". Changing `step`
    alone changes no engine write.
- Why it matters:
  - **Two spellings of one fact.** One of them is a dial that does nothing and says it does.
  - **What catches it.** The engine half of that test would redden on a finer step, so the failure
    is loud. But it is found at test time by someone who believed the constant, instead of being
    impossible.
- Proposal:
  - **Change.** `roundHalf` → `roundToStep(x) = Math.round(x / ECONOMY.bond.step) * ECONOMY.bond.step`.
    This is byte-identical for 0.5, because dividing or multiplying by a power of two is exact in
    IEEE-754, so `x / 0.5 === x * 2` and `n * 0.5 === n / 2` for every finite x.
  - **Owner:** `spirit.ts`.
- Blast radius:
  - **House laws.** No RNG, schema or wording is touched. Balance is identical at 0.5.
  - **Proof:** `tests/spirit.test.ts` green unchanged, plus the frozen coach-travel-edge hashes.
  - **Tests that would move:** `git grep -l "roundHalf" -- tests/` → 1, comment only.
- Effort: S
- Confidence: high
- Versus 05.09: new
- Verification: CONFIRMED – economy.ts:4635's `step` is read by no src/ code (only tests/spirit.test.ts:456), the rounding is the hard-coded roundHalf at spirit.ts:445, and three places (including economy.ts:4649-4651) tell a future wave to change `step`; the 'test would redden' claim was checked by arithmetic only.

### C-07 · The small-talk gate `'march-entry-open'` certifies an entry the college freeze refuses – true on 24 of 95 college pause-weeks, refused on all 24
- Severity: P2 (re-rated from P1 in verification)
- Category: correctness-risk
- Evidence:
  - **The gate.** `SMALL_TALK_FACT['march-entry-open']` (`world/lifeBeat.ts:1726-1733`) holds when a
    March event lies ahead, she is not entered, `world.week < e.deadlineWeek`, and
    `entryStatus(world, e).level !== 'blocked'`. Its contract is that "a false fact removes the
    situation from the pool instead of being papered over in the copy" (`:1712-1714`), and "say
    there's time to decide – only when the deadline actually permits it" (`:1716-1722`).
  - **Two rows at college stand on it.** R8 `alone-or-with-them` and R20
    `the-money-she-did-not-ask-about` declare `stages: ['college', 'independent']`
    (`world/smallTalkCorpus.ts:1200-1203`, `:2124-2127`). The spec gates R8 because "it presumes an
    upcoming entry, which is a career fact" (`docs/specs/small-talk-corpus-2026-09.md:896-900`). R20
    is "only legal while the entry's deadline proves waiting is possible, which `march-entry-open`
    does" (`:1468`).
  - **What the gate does not read.** `entryStatus` → `entryVerdict` (`world/medical.ts:992`) has no
    college clause. The door is shut elsewhere: `enterEvent` opens with `guardNotEnded`
    (`world/entries.ts:39`), which throws `COLLEGE_FREEZE_REFUSAL` under the latch
    (`world/constants.ts:68`). A gate that asked the latch would not help either. The small-talk roll
    runs inside `resumeFromCollege`'s loop, which sets `world.ending = null` before ticking
    (`world.ts:2684`). This is lane B's hand-off, and why the honest predicate is `world.college`,
    not `world.ending`.
  - **Measured.** `npx vite-node docs/review-principles-2026-09-26/probes/c-march-entry-college.ts`
    (`RAW/march-entry-college.txt`, `X_EXIT=0`, at `03d92221`):
    ```
    seeds 8 · college pause-weeks asked 95
    gate true (R8 or R20 in reachableSituations(college), any voice): 24 / 95
    probe mirror agrees with the gate: 95 / 95
    enterEvent on the gate's own March event: refused with COLLEGE_FREEZE_REFUSAL 24 · refused otherwise 0 · accepted 0
    R8/R20 small-talk rows raised inside the freeze (lifeLog, college weeks): 1
    ```
    24 / 95 = 25.3 %, beside the spec's own 24.6 % on its college pause sample
    (`small-talk-corpus-2026-09.md:1240-1242`).
  - **Queued, but without this cause.** `docs/plans/life-wave-7-handoff-2026-09.md:70` ("Still his",
    item 4) leaves "the march-entry-open 24.6% vs live 91% disagreement" to the owner, with "a March
    deadline's seasonal window" as the candidate reading. The new evidence is that at college every
    one of those 24.6 % is a week on which the certified entry cannot be made.
- Why it matters:
  - **The class.** A gate passes while the thing it guards is gone (brief §8, P1). The fact's own
    contract is that it cannot be true when the sentence is false. At college it is true on a
    quarter of the askable weeks, and a row did reach a real walk inside the freeze.
  - **The cost is player-facing but small.** One small-talk card asks the parent about an entry
    nobody can make. Nothing is spent and no state moves, which is why this is P1 and not P0.
- Proposal:
  - **The owner rules first.** The two options differ in what the college rows mean:
    - (a) Add `!inCollege(world)` to the fact: `world.college !== null && week < untilWeek`, never
      `world.ending`, which the loop nulls. R8/R20 then speak only at `independent`, and their
      `college` cells join lead 3's written-but-unreachable class.
    - (b) Give the college column its own fact over the college fixture, if the owner means "the
      team's next event". That keeps the rows alive. Only a gate is added; no string moves.
  - **Owner of the merged code:** `world/lifeBeat.ts` (lane B's file).
  - **The net.** A unit test on the probe's recipe asserts that the gate is never true on a week
    `enterEvent` refuses with the freeze sentence. Its mutation arm drops the new clause.
- Blast radius:
  - **House laws.** RNG: `rollSmallTalk` draws on `seed:life:smalltalk:<week>` sub-streams
    (`world/lifeBeat.ts:5672-5694`). A smaller pool changes which situation a college week draws
    but no MAIN draw, so the frozen 41550 / `e6b0c709` holds (`tests/condition.test.ts`). Bench arm:
    `npx vite-node tools/small-talk-corpus-bench.ts` K5b. R8/R20's college-pause reachability should
    fall 24.6 % → 0 under (a) and nothing else should move. No wording or schema is touched.
  - **Tests that would move:** `git grep -l "march-entry-open" -- tests/ | wc -l` → 0,
    `alone-or-with-them` → 0, `reachableSituations` → 4 (`RAW/blast-gapfill.txt`).
- Effort: S
- Confidence: high. The probe's mirror agrees with the engine's own `reachableSituations` on 95 of
  95 weeks, and the refusal is the engine's own. The 1 raised row is a small sample, and a K5b run
  with the clause would price it.
- Versus 05.09: new
- Verification: CONFIRMED – the probe reproduces exactly (gate true 24/95, refused 24/24, 1 row raised) and the fact at lifeBeat.ts:1726-1733 has no freeze clause; re-rated to P2 because the cost is one soft small-talk card with nothing spent and no state moved, the 24.6 % reachability is already on the owner's list, and R8's kernel may legitimately read as a team event, so the defect is clearest for R20.

## P3 – polish

| id | title | file:line | one-line proposal |
| --- | --- | --- | --- |
| C-P01 | `drawBodyRegion` has no reader anywhere (only `drawBodyRegionFrom` is called, `world/injury.ts:560`) | `src/engine/body.ts:56` | Delete it, and re-point the note at `:62` that calls it "this function with the shipped table" |
| C-P02 | `collegeVoice` has no reader anywhere (`leaf-exports.mjs` DEAD) | `src/engine/diary/words.ts:61` | Delete it, or use it where `means.ts:104` says it is "the same shape" |
| C-P03 | `COLLEGE_OFFER.usCountryCode` is read only by `tools/ladder-baseline.ts:880`, and its doc still says it is "the country code that gets the need-based layer", which D8 buried on 14.09 (`5a81cdc7`) | `src/engine/collegeOffer.ts:413-420` | Move it under the D8 tombstone as history, or delete it with the tool's line |
| C-P04 | `isSponsorWindowOpenWeek` has no product reader, and its doc "THE ONE WEEK THE OUTGOING DEAL IS JUDGED" has been false since fix/sponsor-catchup (`world/sponsors.ts:457-466`) | `src/engine/offers.ts:745-750` | Correct the doc to what the bench uses it for (the window's opening read) |
| C-P05 | 77 value exports of the leaf modules have no consumer outside their file; the largest groups are `radar.ts` 17, `diary/travelHome.ts` 13, `diary/weekNotes.ts` 10, `offers.ts` 6, `knock.ts` 6 (`leaf-exports.mjs`) | `RAW/leaf-exports.md` §INTERNAL | Drop `export` module by module when a wave touches the file (05.09's rule, not a sweep) |
| C-P06 | `previewEvent` 9 parameters, `drawnField` 8, `firstRoundDraw` / `fillOnRamp` / `playMatch` / `runTournament` 7 – unchanged since 05.09 | `season/preview.ts:672`, `:206`, `:646`; `season/tournament.ts:432`, `:1024`, `:1223` | The options object 05.09 proposed (`argsFor` in `world/snapshot.ts` already builds it) |
| C-P07 | The skill-key union is spelled three ways: `development.ts:64/72`, `match/style.ts:43/124` ("A SECOND UNION, ON PURPOSE") and `ECONOMY.development.ageWeight` typed `Record<string, number>` to dodge the cycle, compensated by a test | `src/engine/economy.ts:3558-3574` | Declare it once in `match/types.ts` (a type-only leaf all three already reach) and derive the other two |
| C-P08 | `windowedBestSum` re-implements `computeRanking`'s per-player fold (filter, sort, `windowSlots`, `rankableTotal`) and relies on a parity test (`tests/season/ranking.test.ts:94-99`) | `src/engine/season/ranking.ts:337-368` vs `:521-530` | Extract one `playerBestSum(list, bestN)` both call |
| C-P09 | `NATIONAL_TEAM.callChance` is read only by tests, and `callChanceByLeague[1]` is its literal copy (0.4) | `src/engine/nationalTeam.ts:103`, `:130` | A hoisted const both keys read; byte-identical |
| C-P10 | `offerAnswerError` spells liveness a second time inline: `state !== 'open'` then `week > deadlineWeek`, both returning "That offer has already gone." (lane E's hand-off, E-07) | `src/engine/offers.ts:1092-1094` vs `isOfferLive` `:171-173` | After the `signed` arm, `if (!isOfferLive(offer, week)) return 'That offer has already gone.'`. That is byte-identical: one message for both arms, and `signed` is still answered first. Build it in E-07's wave (tests: `offerAnswerError` → 1, `isOfferLive` → 2) |

## Delta versus 05.09

The lane map gives lane C the 05.09 `02-engine.md` findings whose code is in the leaf modules. I
status E-01, E-03, E-08, E-10 and E-11. E-01's code is split (`season/conveyor.ts`, mine, and
`world/phaseObligations.ts`, lane B); I status it because its fix landed in the conveyor. The other
seven belong elsewhere: E-02, E-05 and E-06 to lane D; E-04, E-07, E-09 and E-12 to lane B (E-12(c)'s
sort sites include `conveyor.ts:108`, and lane B holds the item whole).

| ID | title | status | evidence |
| --- | --- | --- | --- |
| E-01 | The published draw is not kept across the season boundary | **fixed** | `f2242e4c`: `renewCohort(…, keep)` (`season/conveyor.ts:104-129`, `:148`) plus `promised` in `world/phaseObligations.ts:66-67`; draw taken before `keep` is read (MAIN untouched); `tests/round35-draw-fact.test.ts:223-244` walks onto a boundary week and fails if the walk has none |
| E-03 | The card's chance and her match are two models | **fixed** | `cffdcb11` (C4) and the #34 re-fit `fc856e17`: `calibratedPServe` = `basePServe + nerveAndLegs` (`match/point.ts:241`, `:271`), read by `fastMatchProbability` (`match/engine.ts:31`); residual rms 0.40 pp (note at `point.ts:254-270`); guarded by `tests/match/calibration.test.ts` "C4: the closed form is the match she plays" (sim project, 1 pp bound, mutation arm) |
| E-08 | 70 exports with no external consumer, 3 with none | **partly fixed; the rest still open** | The three dead: `firstWeekOfMonth` removed (tombstone `shared/dates.ts:244`, pin `tests/week-numbering.test.ts:328`); `AD_TIERS` removed (`offers.ts:1916`, pin `tests/offers.test.ts:3184`); `ENDING_BLURB` **superseded** by the owner's ruling, "unconsumed WRITING is a candidate for the owner" (`ending.ts:1102-1109`). In leaf scope now: 77 internal-only and 2 new dead (`leaf-exports.mjs`; methods differ from 05.09's regex scan, so the counts are not a trend) → C-P01, C-P02, C-P05 |
| E-10 | Parameter lists over five | **still open** | The same functions at the same lines (`leaf-functions.mjs`: 9 / 8 / 7 / 7 / 7 / 7) → C-P06 |
| E-11 | Comment volume, measured | **still open, growing faster** (leaf half) | Leaf scope 17,583 → 25,721 comment lines against 9,567 → 11,806 code (3.6 : 1); `economy.ts` 3,967 → 7,306 against 1,073 → 1,480 (8.2 : 1) (`leaf-comment-growth.py`) → C-03. The rest of E-11 (`state.ts`, `world.ts`, the convention) is lanes B and H |

## The August review

Lane C was assigned no section of the August review (`docs/review/`).

## Seed leads

**Lead 7 (`economy.ts`) – partly confirmed.**

- **"Constants versus essays" – confirmed, and measured.** 48,088 code characters against 602,935
  comment characters (92.6 %). By lines, 1,480 code against 7,306 comment (83.2 %), and 8.2 comment
  lines per code line added since 05.09. The block table is in C-03 and the finding is C-03.
- **"ECONOMY keys nothing reads" – refuted for the product, with the method stated.**
  `economy-keys.mjs` enumerates 884 leaf key paths (1,107 nodes, 44 top-level keys) and searches all
  1,232 files of src, tests, tools and e2e through the type checker:

  | verdict | leaves |
  | --- | ---: |
  | PRODUCT: read by a direct, chain-resolved read in `src/` | 501 |
  | PRODUCT-INDIRECT: read in `src/` only through a dynamic key or a branch used whole | 380 |
  | read only outside `src/` | 3 |
  | read by nothing | **0** |

  - **What the 380 are.** Enum- or age-keyed tables such as `ageInjuryFactor[age]` and
    `minConditionToEnter[tier]`. Each escape is listed in `RAW/economy-keys.md`, and the 48 whose key
    name never appears in `src` were checked by hand: all are read through a typed key.
  - **The three read only outside `src/`:**
    - `bond.step`: two spellings, **C-05**.
    - `motherhood.termWeeks`: deliberately kept; the note at `economy.ts:5359-5362` gives the reason.
    - `form.corridorPp`: bench-only by design; the note at `economy.ts:6926-6931` says so.
  - **The same method over 15 leaf config objects** (`CHILDHOOD` … `ALTERNATES`, 146 leaves, in
    `RAW/leaf-config-keys.txt`):
    - one DEAD: `FIELD.ageRampFloor`, a documented tombstone at `season/fieldPros.ts:493-500`;
    - five read only outside `src/`: three documented (`ENDINGS.forkAgeYears`, `FIELD.size`,
      `FIELD.career.peakFrom`), one a literal copy (C-P09), and one with a stale doc (C-P03).
    The output labels these lines `economy.ts:<n>`; the numbers are the module's own lines.
- **"Tables mirrored by hand" – confirmed, and all deliberate but one.** `economy-mirrors.ts`
  reports every identical numeric vector, run and subtree:

  | mirror | where | derivation byte-identical? | status |
  | --- | --- | --- | --- |
  | `divorce.{matched, mismatched, sortItOut, dismiss}` = `bond.delta.ended{Matched, Mismatched, FixIt, Blame}` (3 / −3 / −1 / −4) | `economy.ts:5186-5195` vs `:4774-4777` | yes (`divorce.matched: DELTA.endedMatched` …) | **deliberate**: "the owner may un-mirror either at review" (`world/lifeBeat.ts:3456-3462`, `economy.ts:5173-5179`), pinned by `tests/wave12-parting.test.ts:462-476`. Whether to derive or keep two dials is the owner's (balance), so it is listed here, not as a finding |
  | `DIVORCED_BOND_COMPANY` = `ENDED_BOND_COMPANY`, one rung up | `world/lifeBeat.ts:3451-3467` | yes | deliberate, same note (lane B's file) |
  | `spirit.mood.heavyBelow` 60 = `spirit.knee` 60 | `economy.ts:4611-4614` | yes, with a hoisted const (an object literal cannot read its sibling) | deliberate ("if one moves the other has to be argued"), pinned `tests/spirit.test.ts:654` |
  | `motherhood.termTotalWeeks: 8 + 31` = `playsOnWeeks + termWeeks` | `economy.ts:5363-5364` | yes, with hoisted consts | deliberate, pinned `tests/wave11-window.test.ts:152` |
  | `chemistry.phasePerLoss` −0.1 = −`phasePerWin` | `economy.ts:1027-1028` | yes (`-(0.1) === -0.1`) | deliberate ("measured into this block"), in the mutation table of `tests/round43-chemistry.test.ts:19` |
  | `NATIONAL_TEAM.callChanceByLeague[1]` = `callChance` | `nationalTeam.ts:103`, `:130` | yes | pinned `tests/college-league.test.ts:423` → C-P09 |
  | `bond.step` 0.5 vs `roundHalf`'s `* 2 / 2` | `economy.ts:4635`, `spirit.ts:445` | yes (power-of-two exact) | **not deliberate** → **C-05** |
  | `wealthCorridor` / `travelBgFactor` / `physio.medicalBgFactor` | `economy.ts:249`, `:866`, `:6421` | already one object (`===`, probe) | not a mirror: one owner, three historical names |

  Coincidental matches the probe also found, which are not mirrors: `severityBands[3]` =
  `retirementSeverityBands[3]`, `spirit` / `bond` [70, 0, 100], and five other short runs.

**Hand-offs other lanes sent to lane C (gap-fill) – each answered.**

| from | hand-off | answer |
| --- | --- | --- |
| B (lead-3 note) | `'march-entry-open'` is evaluated inside `resumeFromCollege`'s loop, where `world.ending` is null (`world.ts:2684`), so a girl at college can be handed the March decision while entries are frozen | **confirmed → C-07** (24 / 95 college pause-weeks; `enterEvent` refuses all 24) |
| B (lead-3 table, `VOICE_LINES` row) | `restingKnock` / `pushingKnock` at `college`: "not settled; the licence-level sweep is lane C's" | **settled: reachable, on one week.** `c-knock-at-college.ts` (`RAW/knock-at-college.txt`, `X_EXIT=0`). Arm A, natural, 30 careers on the real fork: 2 careers (`c-knock-17`, `c-knock-20`) show sunny's college `pushingKnock` cell on the departure week. That is week 294 = `college.fromWeek`, the latch snapshot, with note "She texted after training. \"It held the whole week. All good.\"" Arm B, a pushed knock planted on the week before departure: 20 of 20 careers license it. It opens nowhere else: the knock never rolls at college (`phaseGrowth.ts:399`), a decided knock governs `sinceWeek + 1 … untilWeek` (`knock.ts:343-345`, `:381-383`), and college weeks after the latch are snapshot only at a pause. So the cell is live on the departure week, and for a push on the two weeks after it if a pause falls there. `restingKnock` has the same one-week window (`untilWeek = sinceWeek + 1`) and was not drawn in this sample. The sweep also found **C-06**: a knock arriving ON the departure week cannot be answered at all. Caveat: the diary stage reads `school` until school is over (`diary/facts.ts:423-431`), so fixtures that force the fork at week 60 never reach these cells |
| E (E-07, Not reviewed) | `offerAnswerError`'s inline liveness check (`offers.ts:1092-1094`) is a second spelling of `isOfferLive` | **confirmed, P3 → C-P10**, to be built in E-07's wave. Both spellings sit in one file, and the fold is byte-identical |
| D (the August [LOW] "non-terminating match loop" row) | "The import gate still validates no tour enum – lane C for the match side" | **refuted for the match side.** No save field carries a tour into a match. Every engine `simulateMatch` / `fastMatchProbability` call passes the constant `JUNIOR_TOUR` (`season/tournament.ts:16`; `git grep -c "tour: JUNIOR_TOUR" -- src` → 13 lines, 8 of them in the engine), and the one UI literal is the exhibition's `tour: 'wta'` (`SeasonScreen.vue:1350`, lane E's file, equal to `JUNIOR_TOUR`). So an import cannot hand the match engine an unknown tour, and the gate has nothing to validate. The residual is fail-slow: an unknown `tour` makes `TOUR_AVG_P[opts.tour]` undefined and `basePServe` NaN (`match/point.ts:8`, `:126`). Only a mistyped call site could reach it, and `Tour` is a closed union (`match/types.ts:5`) |
| B / G ("why the tick grows +37 %") | B deferred it to G; G called it "context, not a defect" | **partly traced, no timing taken**, below under Not reviewed |

## Not reviewed

- **Timing of any kind** is excluded by the Phase 1 rules. Hot-path claims rest on Phase 0 §B and on
  reading the complexity:
  - `computeRanking` is O(R + P log P) over a results window that stays around 2,200 rows (§B.6).
  - `selectEntrants` is O(n log n) with n ≤ 199.
  - `rivalConditions` is O(R + 16·P).
  - `simulateMatch` is O(points) with O(1) per point.
  - `matchWinProbability` runs only in the UI (`match/rally.ts:358` via `annotateMatch`).

  **Why the tick grows +37 % (gap-fill): partly traced by counting, not timing.**
  `c-tick-growth.ts` replays Phase 0's `bench-middle-0`. The hash matches: `3272aa98f61626b3`.
  The per-week times are Phase 0's own `stepMs`. From `RAW/tick-growth.txt` and
  `RAW/tick-growth-windows.txt`, both `X_EXIT=0`, at `03d92221`:

  | window | quiet weeks (no result written): n, med ms | result weeks: n, med ms | result weeks without her match, med ms | results written / result week, med | events resolving / week (junior + adult) | her matches / 100 wk | her games / 100 wk |
  | --- | --- | --- | --- | ---: | --- | ---: | ---: |
  | early 1–100 | 11, 3.31 | 89, 5.33 | 4.95 | 42 | 0.90 + 2.82 | 94 | 2,274 |
  | ~200 | 11, 3.36 | 89, 5.73 | 5.25 | 42 | 0.86 + 2.74 | 117 | 2,572 |
  | mid | 7, 3.06 | 93, 6.61 | 6.17 | 43 | 0.85 + 2.72 | 129 | 3,047 |
  | ~800 | 7, 3.14 | 93, 6.54 | 6.15 | 45 | 0.86 + 2.72 | 122 | 2,884 |
  | late (last 100) | 6, 3.35 | 94, 7.49 | 6.64 | 43 | 0.89 + 2.81 | 124 | 3,087 |

  - **Where the growth is.** All of it is on the weeks that write tournament results. Quiet weeks
    stay flat, and quiet weeks run every per-tick scan of the only-growing collections (`offers`
    2 → 255, `lifeLog` 3 → 82, `milestones` 5 → 57). The quiet samples are small (6–11 weeks).
  - **What does not explain it.** The volume those weeks resolve is flat: 42 → 43 results
    written, and the same calendar mix and adult draw slots (86 → 87 per week).
  - **Her own matches explain part.** Her point-simulated matches (`season/tournament.ts:1033-1045`;
    every rival match is the closed form) rise 94 → 124 per 100 weeks, and her games +36 %.
  - **Most of it remains.** Result weeks without any match of hers still grow 4.95 → 6.64 ms, a
    step between the early and mid windows and a rise at the end. Across those 615 weeks, `stepMs`
    correlates with none of the growing collections (Pearson r 0.06–0.08).
  - **What is left.** The remaining ~1.7 ms is per result-week work that is not volume. Naming it
    needs a CPU profile of result weeks early against late (`node --cpu-prof` on `runtime-career.ts`'
    bare arm), which Phase 1 forbids, so it goes to lane G / Phase 3. No window is super-linear, so
    it is not a finding.
- **The inbox that only grows** (§B.8 #1, `offers` 4 → 274 rows) is created by `offers.ts`, but its
  contract lives in `world/state.ts` and it matters in the snapshot. Lanes B, D and G.
- **The econ sim family's growth** (§D.7 #4) is lane G. At the lane-C level, the tick's early-window
  cost is unchanged since 05.09 (5.07 against 5.3 ms/week).
- **Balance and tuned values** are the benches' (brief §10). Nothing here judges a number, only
  whether it is read and spelled once.
- **Voice pools** in `diary/weekNotes.ts` and `diary/pool.ts` are covered only structurally. They
  are the jscpd LOW clusters of 23 and 21 sites (§A4). The `claims`/`license` pairing is checked
  independently by `tests/week-notes.test.ts:10-14`, `:617-620`. Their wording is the owner's. Of lead 3's licence-level
  sweep, only the `VOICE_LINES` knock cells at `college` were settled (see Hand-offs). The other 7
  moments × 4 stages of `VOICE_LINES`, and the other `WEEK_NOTES` rows, were not swept for
  reachability, because a licence-level sweep needs its own instrument (a `weekNoteFor` census over walked
  careers). The table holds 147 literal rows (`grep -c "claims:" src/engine/diary/weekNotes.ts`)
  plus the generated staged cells.
- **Read at code level in the gap-fill:** `coach.ts` (342 code lines), `academy.ts` (117) and
  `coachLoad.ts`, plus the knock paths in `knock.ts` that C-06 needed. Nothing further was found
  there beyond the data-structure notes in Scope and method.
- **Still not read beyond the grep- and probe-level views above:** `radar.ts` (1,341 lines),
  `kidLife.ts` (966), `development.ts` (1,314; only `growWeek`'s size), `chemistry.ts`,
  `childhood.ts`, `collegeLeague.ts`, `equipment.ts`, `plan.ts`, `form.ts`, and most of `offers.ts`
  (2,671) and `season/calendar.ts`. The reason is budget, not a judgement. The structural probes
  (`leaf-functions.mjs`, `leaf-exports.mjs`, `economy-keys.mjs` over their config objects) cover
  them for size, dead exports and dead keys. Their logic, and data-structure choices beyond
  linear-scan sizes, are not reviewed.
- **For README §9 (Not reviewed), proposed entry:** "Lane C read the coach and academy modules at
  code level only in the gap-fill. `radar`, `kidLife`, `development`, `chemistry`, `childhood`,
  `collegeLeague`, `equipment`, `plan`, `form`, and most of `offers` and `season/calendar` were
  covered by structural probes (size, dead exports, dead config keys), not by reading. Lead 3's
  licence-level sweep of `WEEK_NOTES` was settled only for the knock cells at `college`. The tick's
  +37 % is traced to result weeks and left for a profile."

---
type: plan
status: current
area: project-review
last-reviewed: 2026-09-26
---

# The principles fix – the builder's plan, step by step (six waves)

The owner, 26.09: «сделай пожалуйста полноценную пошаговую спеку для билдера на починку всего по
твоим рекомендациям». This plan executes the principles review of 26.09 as its intake resolved it:
every open choice is settled by the architect's recommendation (section 1), every finding named
here is CONFIRMED (the PLAUSIBLE ones ride only where named, with their extra condition).

**Read first, in this order:** `CLAUDE.md`; the intake
[14-principles-review-response-2026-09-26.md](../review-codex/14-principles-review-response-2026-09-26.md)
(the verdicts and modifications); the review's synthesis
[README.md](../review-principles-2026-09-26/README.md) §6 (the waves as the review wrote them).
**Before each task, read its finding in the lane file** – Evidence, Proposal, Blast radius and
Verification are there with `file:line` at the baseline, and this plan does not repeat them.
Lane files: `01-architecture` (A), `02-engine-core` (B), `03-engine-leaves` (C),
`04-worker-protocol-persistence` (D), `05-ui` (E), `06-duplication` (F), `07-performance` (G),
`08-tests-tooling-docs` (H), all in `docs/review-principles-2026-09-26/`.

## 1. The rulings this plan executes (resolved 26.09)

| # | finding | resolved as |
| ---: | --- | --- |
| 1 | C-06 | **(a)** no knock arrives on the departure week – prevention; nothing is retired silently |
| 2 | B-01 | **(a)** a blocking life beat pauses the college year, exactly as the birthday does |
| 3 | C-07 | **(a)** R8 / R20's `'march-entry-open'` fact is false at college |
| 4 | E-01 | **(a)** the header reuses the pills' own phrase – DRAFT strings in §5 W4 |
| 5 | B-03 | **(a)** a kitless clothing row reads `closed` with the existing «Not open yet» |
| 6 | E-04 | **(a)** the tier chip prints the engine's `refusal.detail` for the aged-out and capped arms |
| 7 | E-02 | **(a)** «the layout is the preset's» (HerWeekTab's rule) for all three readers |
| 8 | A-05 | **(a)** a malformed handover is refused in the existing `New career: …` shape – DRAFT |
| 9 | B-05 · B-P3-01 · B-P3-02 | the three answer commands refuse an unknown enum; `setWeightEnabled` refuses on an ended career through `guardNotEnded`; reveal no-ops stay idempotent |
| 10 | D-02 · D-07 | D-02 keeps today's text; D-07 is **option A** (on-demand inbox, render-identical) |
| 11 | H-04 | **O1**, the reading tool (W5); the forward rule is the architect's |
| 13 | A-04 | **(a)** finish P4 – three span-moves (W6) |
| 15 | A-03 | freeze the barrel and drop its 93 dead names (W6, after A-04) |
| 17 | H-17 · H-02 (c) | freeze dormant archival tools out of `check:tools` (W5); the world map **stays committed** – the pre-commit hook keeps it fresh |
| 19 | B-08 | collapse the unreachable roof cells in the `expecting`, `bereavement` and `engaged` pools (W3) |

**Added 26.09 on his follow-up questions:** A-06, the split of `lifeBeat.ts` (T6.8), and a
duplication re-measure with a guard against re-copying (T5.14).

### 1a. Appended after dispatch – pick these up

⚠ **This plan grows while you build** – the owner, 26.09: «По остальным вопросам и задачам вся
ответственность за измерения и фиксы после них на тебе. Спека есть, если что – дописывай туда
следом еще пункты, пока билдер работает, он подхватит». The architect appends on
`review/principles-2026-09-26`. **At every wave boundary** run `git fetch origin && git merge
origin/review/principles-2026-09-26` into your current wave branch (the appends are docs only),
re-read this section, and take every entry whose wave you have not closed. An entry for a wave
you have already closed goes first into the next one. Every entry is dated.

| added | task | wave |
| --- | --- | --- |
| 26.09 | T1.6 – the save doors in a real browser (e2e) | W1 |
| 26.09 | T1.7 – the save doors under hostile input (a seeded property test) | W1 |
| 26.09 | W7 – the notes: chronicles move out of the code, verbatim, per module (T7.1–T7.5) | W7, after W6 |
| 26.09 | C-03 revived as T7.3 (the `economy.ts` split rides the notes move) | W7 |
| 26.09 | T3.12 – the manifest-only maskable icon leaves the precache (−105 KiB, no pixel moves) | W3 |

**Not in this plan:** #12 H-09, the forward rules of A-06, H-08 and H-04, A-03's `CLAUDE.md`
line and W7's `CLAUDE.md` rule – all the architect's; image re-encoding (the masters live only on
the owner's machine – the architect's, measured first); E-P07 (the planner preview) – a question
for the owner; B-06's `??` ratchet. ⚠ **AVIF is ruled out** (26.09): inside the browser floor
this build targets (Vite 7: Chrome 107, Edge 107, Firefox 104, Safari 16) it breaks images on
Safari under macOS 11–12 and on Edge 107–120, and the owner's terms are 100 % coverage from one
image set. If the owner's own saves turn out to hold the C-06 state, their repair is a separate
item with its own schema move.

## 2. How every wave works

- **Branches**, one per wave, **stacked**: `fix/principles-w1` from the head of
  `review/principles-2026-09-26` (it carries this plan and the review); `fix/principles-w2` from
  w1's head, and so on. Push each to `origin` when its gate is green – never to `main`; the owner
  merges in order. If a merge lands while you work, `git merge origin/main` into your current
  branch once and say so – never rebase shared history.
- **Commits**: the pathspec form only, never `--amend`, never `git add -A`. ⚠ The checkout may
  hold another live session's untracked files (`tools/_devlog_*`, `tools/devlog/`,
  `playwright.devlog.config.ts`): never commit, move or delete them; gate in a clean worktree.
- **Red first.** Every task writes its test first, runs it RED on the unfixed tree, then fixes.
  Name the mutation arm in the test's comment and quote both outputs in the report.
- **The frozen MAIN capture (41550 / `e6b0c709`) does not move anywhere in this plan.** No MAIN
  draw is added, removed or reordered. Sub-stream changes exist only where named: C-06 skips one
  `seed:knock:<week>` derivation on one week; G-03 removes preview derivations and re-keys none.
- **No save-schema move anywhere.** `SAVE_SCHEMA_VERSION` stays at its value; if a task seems to
  need a move, stop and ask.
- **Wording.** Every rendered string stays byte-identical except the DRAFTs this plan names (W2's
  refusals, W4's header) and the surfaces that start printing an EXISTING engine sentence (E-04).
  All of them go into `docs/plans/principles-fix-strings-2026-09.md` (the wave-12 table format),
  pinned both ways by `tests/principles-fix-strings-roundtrip.test.ts`; the count lives in the
  test, never in prose.
- **Before any move**, run `CLAUDE.md`'s pin query and say what it predicted.
- **Gates per wave**: `npm run check`, `npm run test:sim`, `npm run test:e2e` – one at a time,
  exit codes appended inside the command and read from the FILE with fresh mtime, machine quiet
  first. Plus the wave's own proofs below. After any file add or remove, regenerate the registries
  in the clean worktree (`npm run tools:registry`, `npm run decisions`, `node
  scripts/world-map.mjs`) – they read the directory.
- **P3 polish rides along**: in every file a wave touches, apply the lane P3 rows that need no
  ruling (no wording, no balance) and list them in the report.
- **Report per wave**, then continue to the next wave without waiting: what shipped per task, the
  mutation arms with both outputs, the pins moved (each with its dated re-aim note), every DRAFT
  verbatim, the gate verdicts, questions last. Stop and wait only on a red gate or a blocking
  question.

## 3. W1 – save safety and the soft-lock · branch `fix/principles-w1`

The two P0s and the save layer's edges. All S.

- **T1.1 · D-01 (P0) – «Restore previous» cannot restore the present.**
  1. `MoreScreen.vue` refreshes `slots` on mount and whenever `game.revision` moves while it is
     open (the list's one reader becomes its one refresh).
  2. `restoreSlot` carries the `revision` the UI believed the slot held (`SlotMeta.revision`,
     optional on the wire); the worker refuses with the existing `STALE_REVISION` when the record
     disagrees – invariant 1: a stale screen cannot corrupt a career. No new sentence.
  3. Tests: the lane's probe as a mounted MoreScreen case (advance, then `setPhysio`, then
     restore – the pre-toggle generation survives); mutation: delete the mount refresh → red. A
     worker case for the revision refusal; mutation: skip the comparison → red.
- **T1.2 · C-06 (P0) – no knock on the departure week.**
  1. Extract `collegeDepartsThisWeek(world)` from `resolveCollegeDeparture`'s own guard
     (`world/endings.ts`) – ONE spelling of «the departure resolves at this week's close» – and
     gate `rollKnock` on it at `world/phaseGrowth.ts:399`.
  2. `git grep` every writer of `world.knock`; gate each on the same predicate or prove it
     unreachable on that week, in the report.
  3. Tests: a unit case on seed `c-latch-age19-18` (and one `forced60` seed from the probe) – no
     knock stands under the latch; mutation: drop the gate → the refused knock returns.
  4. Proofs: the capture holds; `npm run bench:knock` byte-identical (the departure week is the
     only week that can differ – say whether the bench reaches one).
- **T1.3 · D-02 (P1) – a newer build's save is not corruption.** `decompressWorld` throws
  `SaveFileError('future-schema', …)` before `migrateSave`, message byte-identical;
  `readLatestAutosave` falls back to the older generation only on `corrupted`. Test: the
  `tests/saves.test.ts` straddle case (a newer-schema newest generation must NOT silently load the
  older one); mutation: restore the catch-all → red.
- **T1.4 · B-02 (P1) – commit only what renders.** `mutate` builds `toSnapshot(candidate)` before
  `commitAutosave`, the shape `new` / `restoreSlot` / `importSave` already use. Test: a worker case
  with `toSnapshot` spied to throw once – nothing is committed and the world is unchanged;
  mutation: swap the order back → red.
- **T1.5 · D-04 – the import gate stops passing fields that throw.** Spine rows for the three
  array fields (the existing sentence); a one-tick dry run on a discarded clone inside
  `importSave`, a throw wrapped as `corrupted` with the existing «damaged» sentence (B-06's door
  normaliser rides here, named). Test: the table-driven `save-import-guard` case over the lane's
  16 fields; mutation: remove the dry run → red.
- **T1.6 · the save doors in a real browser** (appended 26.09 – D-01 was proven in node over
  fake IndexedDB, and a harness is not the runtime). `e2e/save-safety.spec.ts`, two cases:
  1. **Restore after a non-refreshing action.** Load a fixture, perform one of D-01's fifteen
     actions through the UI (answering a knock is the natural one), open More, «Restore
     previous» – the restored world is the pre-action one and the later generation still exists on
     disk (read IndexedDB through `page.evaluate`). Mutation: revert T1.1's More refresh → red.
  2. **Boot beside a newer build's save.** Seed IndexedDB with a newest generation whose
     `schemaVersion` is one above this build's (encode a fixture, bump the field, re-encode) and a
     valid older one; boot. The app must not silently open the older generation, the existing
     error surface shows, and after two commands the newer generation is still on disk. Mutation:
     restore D-02's catch-all → red.
  Add both to `docs/specs/e2e-coverage.md`.
- **T1.7 · the save doors under hostile input** (appended 26.09). `tests/save-doors-fuzz.test.ts`:
  a seeded generator (fixed seeds, no `Math.random`) derives ~200 variants from the golden saves and
  the e2e fixtures – truncated at random offsets, a field deleted at a random depth, a type swapped,
  `schemaVersion` moved by ±k, a checksum flipped – and drives each through the import door and the
  boot door (`readLatestAutosave` with the variant as the newest generation beside a valid older
  one). The invariants, each asserted per variant: every refusal is a typed `SaveFileError` carrying
  an existing sentence (never a bare `TypeError`); nothing accepted throws on the next tick or in
  `toSnapshot`; the boot door falls back only on `corrupted`; no call overwrites or deletes a
  known-good generation. Mutations: restore D-02's catch-all → red; remove T1.5's dry run → red.
  It runs in the unit project under the 60 s budget – split the corpus if it does not.

## 4. W2 – one owner for «which questions stop time» · branch `fix/principles-w2`

In this order – B-04 is the owner the others read.

- **T2.1 · B-04 – `openQuestions(world): StopReason[]`** in `world/multiWeek.ts`;
  `advanceRefusal = openQuestions(world)[0] ?? null`; the `advanceWeeks` loop reads it in place of
  its seven hand-written lines, which adds the missing `'shoot-clash'` mid-span stop. Test: the
  mid-span probe as a unit case; mutation: drop `'shoot-clash'` from the owner → red.
- **T2.2 · A-01 = D-03 (P1) – the dev tick reads the owner.** `decisionOpen = (w) =>
  advanceRefusal(w) !== null` in `sim.worker.ts`; call positions and the thrown string
  byte-identical. The seven `toContain` spellings in `dev-fast-forward.test.ts` become one
  «calls `advanceRefusal`» pin plus table-driven behaviour cases (birthday, fork, retirement,
  ending, shoot clash); `r2-13-advance-span`'s drift guard covers every `ADVANCE_REFUSALS` member;
  A-P3-4's stale «six / five» comment fixed. Mutation: `shootClashOpen(w)` → `false` in the owner
  → the new cases red (the old pin stayed green on it three times).
- **T2.3 · B-01 (P1) – the college year pauses for a blocking beat** (ruling 2a).
  `resumeFromCollege`'s pause set is read from `openQuestions`; a pending blocking life beat
  pauses and re-latches through `pendingYearStart`, `'life'` joins the returned stops. D-06 (P3)
  rides named: `'resumeFromCollege'` into `HEAVY_COMMANDS`. Test: the probe's 217 year-calls → 0
  passed an unanswered blocking row; mutation: remove the pause → red. Proof: every college year
  WITHOUT a beat is byte-identical before and after (the capture plus the college fixtures'
  hashes).
- **T2.4 · C-07 – the March-entry fact is false at college** (ruling 3a). `'march-entry-open'`
  adds `!inCollege(world)` (never `world.ending`, which the loop nulls). Test: the gate is never
  true on a week `enterEvent` refuses with the freeze sentence; mutation: drop the clause → red.
  Proof: `tools/small-talk-corpus-bench.ts` K5b – R8 / R20 college reachability 24.6 % → 0, no
  other cell moves.
- **T2.5 · B-05 – the reveal trio re-validates.** `closeTournament` finishes an unfinished run
  (`if (p && !p.finished) skipTournament(world)`) instead of dropping it; no new sentence.
  Re-aim `tools/summer-bench.ts:78`, which relied on the drop, and say so.
- **T2.6 · A-05 – the handovers are shape-checked** (ruling 8a). `prologueShapeError` and
  `dynastyShapeError` beside `profileShapeError`, called in the `new` case before `createWorld`,
  refused as `New career: …`. The two new sentences are DRAFTs – write them plainly (what could
  not be read, nothing more) and table them. `prologueFundsCents`' doc corrected to «bounds
  finite values». Test: malformed payloads refused; mutation: delete the call → red.
- **T2.7 · #9 – fail fast on unknown answers.** `decideKnock`, `answerShootClash` and
  `answerFork` check the choice against their own choice lists and refuse anything else (one
  shared DRAFT sentence, tabled); `setWeightEnabled` gains `guardNotEnded` (its existing
  sentence) and its note stops claiming otherwise; the reveal no-ops stay idempotent. Tests per
  command; mutation: remove each check → red.

## 5. W3 – engine: one spelling per fact, and the dead bytes · branch `fix/principles-w3`

- **T3.1 · G-01 – 49 KB leave the UI chunk, first.** `albumBook.ts:315` becomes lazy; the four
  `…_VOICES` and `WEEK_NOTES` in `weekNotes.ts` go behind `/*#__PURE__*/` IIFEs. Proof: `vite
  build` + `node scripts/install-size.mjs` – headroom ≈ 65 KiB (from 17); the worker chunk's hash
  unchanged.
- **T3.2 · C-01 (P1) – the rivals' memo keys on all five inputs.** Key the run-index cache on the
  content of every knob `runStrain` reads, or drop the memo – measure both arms and ship the
  cheaper correct one. Test: the probe's in-place dials (`tierMatchFatigue +3`, `matchFatigue
  +2`) move the cached index; mutation: restore the two-ladder key → red. Proof: `npm run
  bench:fatigue` and the coach-travel-edge hashes identical on shipped knobs; re-aim the
  workaround comment at `tests/rivals.test.ts:758`.
- **T3.3 · B-03 (P1) – the shelf asks the letter's question** (ruling 5a). `adCategoryOpen(world,
  category)` beside `reviewAdOffer` in `world/sponsors.ts`, called by both; `adPortfolioView` moves
  out of `toSnapshot`'s IIFE; a kitless clothing row is `closed` with the existing «Not open yet».
  The roll and its key stay. Test: the probe's kitless weeks show `closed`; mutation: drop the kit
  clause → red.
- **T3.4 · C-05** – `roundHalf` → `roundToStep` reading `ECONOMY.bond.step` (exact at 0.5).
- **T3.5 · F-05 + F P3-14** – `chargeStaffFare(world, event, fare, label)`; the two fare gates →
  one `staffSeatFareFor`; feed text byte-identical (the 12 «one additional fare» pins unchanged).
- **T3.6 · F-06 + F P3-17** – `DiaryWorldView` derived by `Pick` from `DiaryFacts`;
  `coachBilling` / `coachEdgeView` return the protocol types; one `ShopFamily` union.
  `vue-tsc -b --force` is the gate.
- **T3.7 · F-11** – `CONDITION_TIRED_BELOW` / `CONDITION_SERIOUS_BELOW` exported from
  `shared/avatarEmotion.ts`, read by all three ladders.
- **T3.8 · C-02 + B-P3-09** – the three stale age-grid comments point at `TIERS[*].minAgeYears` and
  the 16.08 spec; the pro-cap notes in `medical.ts` in the same pass. (`npm run context:audit`'s
  age-grid guard reads docs, not code – read every comment you touch against the constant.)
- **T3.9 · B-07 – the key-inventory pin.** `tests/life-beat-keys.test.ts` on the `knock.test.ts`
  pattern: extract every `rngFromSeed(\`…\`)` template from `lifeBeat.ts` (plus `albumBook` and
  `college`) through `tests/worldSource.ts` and assert the exact set. Mutation: rename
  `life:loss` → red. It lands before any `lifeBeat.ts` move.
- **T3.10 · G-03 – no exclusion work for far preview cards.** The far branch passes no
  `excluded` (prefer a lazy `excluded` over a second far-only argument list, per the site's
  «ASSEMBLED ONCE PER EVENT AND SPENT TWICE» ruling); exclusions computed in the near branch only;
  `posOf` deleted. Price it with `npm run bench:snapshot` before and after.
- **T3.11 · B-08 – collapse the unreachable roof cells** (ruling 19). The `expecting`,
  `bereavement` and `engaged` her-line pools lose their presence axis the way the divorce pool did
  (`Record<Temperament, string>`, the away cell kept verbatim); every event they serve is gated at
  23+, where no stage is `roof`. Strings REMOVED, none reworded: update the wave-7 / wave-11
  strings tables and their roundtrip pins with a dated note each. Test: a reachability sweep over
  every stage an eligible week can hold; mutation: re-add a roof read → the sweep's assertion
  names it.

- **T3.12 · the manifest-only icon leaves the install** (appended 26.09, the architect's
  delivery measurement). `pwa-maskable-512.png` (105.1 KiB) is read by the manifest alone – the
  platform fetches it once, online, when the app is installed – so it joins the precache's
  `globIgnores` in `vite.config.ts` and stays in the manifest's `icons`. ⚠ `pwa-192.png` and
  `pwa-512.png` STAY precached: `src/audio/music.ts` hands them to the Media Session as the
  lock-screen artwork, which must work offline. Proof: `vite build` + `node
  scripts/install-size.mjs` (≈ −105 KiB), the manifest still lists the icon, the offline e2e green;
  a unit check that the built precache manifest omits the maskable icon and keeps the other two.
  Mutation: drop the ignore → red.

**W3's behaviour proof, once for the wave:** serialise `toSnapshot` over the 90 golden saves and
the 13 e2e fixtures at the wave's base and head (two worktrees) and diff byte for byte – the only
allowed differences are B-03's kitless clothing rows; say so with the count.

## 6. W4 – UI parity and accessibility · branch `fix/principles-w4`

E-04 and E-05 project from `snapshot.ts` – they land after W3's edits to it (the stack guarantees
it).

- **T4.1 · E-06** – `export const eventActionable = eventIsHers`.
- **T4.2 · E-07 + C-P10** – the three UI copies and `offerAnswerError` call `isOfferLive`.
- **T4.3 · F-07** – `practiceMatchId(week)` and `isPracticeMatchEvent(e)` in `world/planner.ts`;
  `App.vue` and `SeasonScreen` narrow to the recap's rule.
- **T4.4 · E-05** – project `kidFinish` (and `isFinal`) on the pending view; compare numbers, not
  the display words.
- **T4.5 · C-04 (+ F-08 folded)** – `recordedMatchOptions` in `match/engine.ts` for the four
  recorders; `composables/annotatedMatch.ts` for the four replayers (`MatchReplay`,
  `PracticeFlow`, `TournamentFlow`, `PrologueLocalOpen`); `ui/BoxScoreTable.vue`. Test: a mounted
  `MatchReplay` net; mutation: add `momentum: false` to one recorder → red. Proof:
  `match-annotation-parity`'s hash plus one `replayMatch(m).result.sets = m.score` assertion per
  match kind.
- **T4.6 · E-03** – `aria-describedby` from the rank chips (Home, rail) to their own visible spans.
- **T4.7 · E-08** – `useDialogFocus` on EndingScreen (no Escape) and on `.mv-hurt` with
  `aria-modal` and a 375×667 dismiss net (the popup law, mutation-proven by lengthening the card);
  RankHelp's treatment for TierGuide.
- **T4.8 · E-09** – the five hand-rolled refusal lines → `<StoreError />`; one inside each blocking
  popup and EndingScreen. Re-run the five screens' fit nets.
- **T4.9 · E-10** – `role="status"` on the three shell notices.
- **T4.10 · F-10** – `onRadioGroupKey` in `composables/radioGroupKeys.ts` (the dialogs are open
  anyway).
- **T4.11 · E-01 (P1) – the header states the engine's window** (ruling 4a). DRAFTs, tabled:
  - line: `Pro entries, birthday to birthday: ${used} of ${limit}`
  - title: «The tour's age rule limits how many professional (W) events she may enter in the year
    she is this age – counted from birthday to birthday. A fresh allowance arrives on her next
    birthday; junior and national events are not counted.»
  Then a mounted form-B case over `v46` pairing the header with the pills (both read one window);
  the header row's phone fit measured (`fits.ts`, 375×667) with its mutation.
- **T4.12 · E-02 – one `presetOf(week)`** (ruling 7a) next to `planFromWeek` in `engine/plan.ts`,
  carrying HerWeekTab's «the layout is the preset's»; one `PlanPresetRow` on the `SegmentedRow`
  contract with the labels as props (every string byte-identical per host) and `aria-pressed`
  on the pills. Tests: the three readers agree on every legal week; mutation: revert one reader →
  red.
- **T4.13 · E-04 – the chip prints the engine's refusals** (ruling 6a). Project the cap verdict
  per rung from the engine (`tierVerdict` with availability's cap block, or `tierCapRefusal(world,
  tier)` walking all three caps); the aged-out and capped arms print `refusal.detail`. D-P9's type
  narrowing of `TierRefusal.reason` rides. The chip now shows EXISTING engine sentences – list
  each changed surface in the strings table as «engine sentence, new surface». Test: a sub-capped
  snapshot; mutation: restore the chip's own sentence → red.

**W4's proof:** every rendered string byte-identical except T4.11's DRAFTs and T4.13's surfaces
(sweep the mounted screens over the e2e fixtures and diff); the a11y sweep green;
`componentLogic` pins survive the extractions, `componentFile` negatives re-read.

## 7. W5 – tests and tooling · branch `fix/principles-w5`

Tests and scripts only – no product file moves in this wave.

- **T5.1 · G-02 = H-01 (P1) – memoise the frozen careers.** `walkFrozenCareer` memoised per process,
  keyed `(presetIndex, policyIndex, force, profileOverride)`, handing out a deep-frozen world (a
  mutation that writes to it throws). Proof: the rungs' frozen hashes unchanged; per-file solo
  seconds before and after. ⚠ **The rung ratchet stays** (the intake's modification) – retiring it
  is a follow-up after one runner run confirms the timings.
- **T5.2 · H-05 + G-05's stale sentence** – a gate-on-gates test: every file matching a declared
  family glob (`coach-travel-edge-*-schemas`, `goldenSaves*`) is in `HEAVY_UNIT_FILES` (it catches
  `-late-schemas` today); correct `heavy-tests.mjs:255-256`'s «~32 s in-pool» to the solo
  measure. Re-curation by solo seconds is NOT in this wave.
- **T5.3 · H-06** – clamp the 30 test-level budgets over 60 s (the `round34` `beforeAll` hook stays
  legal) and add the parser guard beside `tests/sim-serialisation.test.ts`.
- **T5.4 · H-19** – `tier-window`'s too-young fixture reads `TIERS.w15.minAgeYears - 1` with a
  `tierAgeBlock(…) === 'young'` precondition. First check whether any other `feedContext` /
  `feedShows` file catches the mutation; if none does, report it as the P1 it then is.
- **T5.5 · D-08** – one unit test mocking `request` to `structuredClone` its argument, driving
  every store action that carries an object; mutation: drop `plainDynasty` → red.
- **T5.6 · H-03 – gates judge the commit.** `tools-registry.mjs` enumerates `git ls-files tools
  tests e2e`; `check:tools` compiles a registry-generated file list. Proof: with an untracked
  `.ts` in `tools/`, both steps stay green (the owner's own checkout has seven such files).
- **T5.7 · H-17** – dormant archival tools leave `check:tools` through a registry-kept list; the
  report names how many and why each is dormant.
- **T5.8 · H-02 (a) + (b)** – a `pre-commit` hook in `.githooks/` (wired by `prepare`) runs the
  three registry checks when their inputs are staged (~0.6 s) and names the regenerating command
  on red; `ci.yml` gains `pins:check` and `decisions:check` if it does not run them already.
- **T5.9 · G-04 (a)** – the wedding spec starts first (its own project or name); local e2e wall
  before and after.
- **T5.10 · F-03** – the storage shim moves into `tests/component/setup.ts`, **scoped** (164
  component files run without `localStorage` today, and at least
  `r47-raise-another-route.test.ts:193-198` reasons from that absence).
- **T5.11 · H-07, then F-01, F-02** – `tests/helpers/scenarios/`: `atCollege` (×8) and `clashWorld`
  (×3, with a `brand` option defaulting to the watches' first house – «Nine Bells» was a local
  constant), then `signedAdPaper`, `loveEpisode` / `married`, `pushEvent`; `tests/helpers/career.ts`
  gains `walkWeeks`, `pokedAt`, `weekAtAge`. Answer the in-code counter-stance at
  `round30-do-both-shoot.test.ts:67-68` in the change (the 23.09 three-copy re-aim is the answer).
  Proof: each migrated call site's world hash before and after (`tests/helpers/hash.ts`).
- **T5.12 · F-04 (PLAUSIBLE, live carriers only)** – `tools/_stats.ts` lifted byte-identical from
  `econ-bench.ts:1068-1087`, plus `_fmt.ts` and `_args.ts`, for the 35 live carriers; archival
  tools untouched. Proof: each migrated bench's output diffed at both commits.
- **T5.13 · H-04 O1 – the reading tool.** `node scripts/code-view.mjs <file>` prints code lines
  with their numbers, collapses each comment block to its first line plus `[N lines: L-M]`, and
  keeps any line carrying ⚠⚠, «» or Cyrillic in full; an npm script for it; a unit test on a
  fixture file; register it. The `CLAUDE.md` line that tells agents to use it is the architect's.
- **T5.14 · the copies stay merged** (the owner, 26.09: «копипаста растёт – это тоже чиним?»).
  (1) Re-run jscpd at the 05.09 flags over `tests` and `tools` at the wave's head and report the
  rates against 3.89 % / 2.81 %. (2) A guard test: the families this wave merged may not be
  redefined locally – the storage shim outside `tests/component/setup.ts`, `clashWorld` /
  `atCollege` / `walkWeeks` / `weekAtAge` outside `tests/helpers/`, `argOf` outside `tools/_args.ts`
  in a live tool. Mutation: paste one local copy back → red.

## 8. W6 – structure · branch `fix/principles-w6`

Larger moves, each proven identical. One commit series per item.

- **T6.1 · D-05 – one `commit(msg)` in the store.** Every named action becomes one line (component
  call names kept); the per-action list refreshes are deleted – W1's More refresh reads where the
  list is read; `listSlots` reads its career's two key ranges only (no DB upgrade). Proof:
  `useGameStore`'s 196 importing files green, an advance measured at one round trip.
- **T6.2 · D-07 option A – the inbox on demand.** An `inbox` query (the album's precedent) returns
  the full list when `InboxSheet` opens; the snapshot carries live rows, running signed deals and
  the newest letter id; `inboxMail.persist` reads the query's list; `state.ts:1398`'s «a handful of
  rows» corrected. Proof: a mounted `InboxSheet` test rendering identically over both paths on the
  `pro` and `parting` fixtures; snapshot size at career end before and after.
- **T6.3 · E-11 – the Money shop leaves MoneyScreen.** `ShopPanel.vue` + `useShop`, moved verbatim
  with comments; the pin query first (`git grep -l "MoneyScreen.vue'" -- tests/`), positive pins
  through `componentLogic`.
- **T6.4 · F-09 – shared CSS objects** in `src/style.css` beside `dialog-card` under the neutral
  names the finding lists; components add the shared class and keep their own for the deltas;
  every computed value byte-identical (the fit nets re-run are the proof).
- **T6.5 · A-04 (a) – finish P4.** Three span-moves of the zero-call-back clusters –
  `world/tournamentClose.ts`, `world/create.ts`, and the tick / college-exit module – by P4's own
  rules (`CLAUDE.md`: type-only imports, re-export under historical names, the pin query first:
  12 files predicted). `world.ts` is left as the barrel plus its layering comment, pinned to hold
  no function bodies.
- **T6.6 · A-03 – freeze the barrel**, after T6.5: a test pins
  `Object.keys(await import('…/world'))` against a literal list – today's minus the 93 dead names
  – and the 93 re-export lines go. Proof: `vue-tsc -b --force`, `check:tools`, 0 tests moved.
- **T6.7 · A-02 (PLAUSIBLE) – measure first.** Run the build arm the lane left open: repoint the
  17 UI imports off the barrel in a worktree and measure the UI chunk. Ship the repoint plus a
  reverse-purity gate only if the arm frees bytes; otherwise record the null result with the arm's
  provenance. (Context: 121,534 B of engine code sits in BOTH the UI chunk and the worker chunk –
  `00-baseline.md` §A5 – so this is a delivery question as well as an architecture one.)
- **T6.8 · A-06 – split `world/lifeBeat.ts` by beat kind** (the owner, 26.09: «можем распилить и
  оптимизировать? это в спеке?»). After T3.9's key pin, never before. The lane's map is the plan:
  the 14 per-kind copy sections (§3b–§3m) are leaves, and nine of the twelve hazard sections (§7–§11,
  §13–§16) have zero inbound references. Move **one kind per commit** – its copy section and its
  hazard section together – into `src/engine/world/lifeBeat/<kind>.ts` (`wedding`, `pregnancy`,
  `weight`, `leak`, `booth`, `ownKey`, `spouseView`, `smallTalk`, `divorced` …); `lifeBeat.ts` keeps
  the hub (the queue, raising and answering, prompt assembly, the shared presence law) and
  re-exports every moved name under its historical name, so no importer and no barrel name moves.
  Comments move verbatim. The pin query first (`git grep -l "world/lifeBeat" -- tests/`), and
  `tests/worldSource.ts` gains a reader that returns the hub plus its kind modules, so positive
  source pins survive the split; negative pins are re-read. Proof per commit: the capture holds,
  T3.9's key inventory is identical, the life-beat key-count nets and every life-beat suite stay
  green; the e2e life specs at the end. The forward rule («a new beat kind is a new module») is the
  architect's `CLAUDE.md` line.

## 9. W7 – the notes: the chronicles move out of the code · branch `fix/principles-w7`

Appended 26.09. The comment convention measured: 75.6 % of `src`'s tokens are comments, growing
two comment lines per code line, and 67.8 % of the comment lines sit in blocks that are dated or
name a round, wave or review item (H-04). The owner's own proposal – «реорганизовать в отдельные
файлы, а в коде держать только ссылки» – is H-04's O2; the architect rules it under the 26.09
delegation, **per module at the moment of a split, never as a sweep**.

**What stays at the site:** the «why» in at most five lines; every ⚠ warning, one line each; the
owner's ruling as one line with its date; and a pointer `→ docs/notes/<area>/<file>.md#<anchor>`.
**What moves, verbatim:** dated re-aim chronicles, measurement narratives, «what stood here
before» blocks and the long quotes – byte for byte, Cyrillic included, never paraphrased. Every
notes file carries the front matter `npm run context:audit` accepts (`type: reference`). Source pins
that read moved text are repointed at the notes file through a notes reader in
`tests/helpers/source.ts` – never deleted; find them first by grepping each moved block's most
distinctive phrase in `tests/`.

- **T7.1 · the pointer check.** `scripts/notes-pointers.mjs`, wired into `npm run check` after
  `context:audit`: every `docs/notes/…#anchor` pointer in `src` resolves to an existing file and
  heading. A unit test over a fixture; mutation: rename an anchor → red.
- **T7.2 · the pilot – the schema history.** The version-by-version history above
  `SAVE_SCHEMA_VERSION` in `world/state.ts` (the lane measured the block at lines ~89–958) moves to
  `docs/notes/engine/save-schema-history.md`; the site keeps what the rules above keep. Report the
  file's lines, comment share and O1 reading tokens (T5.13's tool) before and after.
- **T7.3 · `economy.ts`, split and annotated (C-03 revived).** One module per block under
  `src/engine/economy/`, `ECONOMY` re-assembled in `economy.ts` in the same key order (the 191
  importers do not move); each constant keeps its one-line why and a pointer; the essays move to
  `docs/notes/economy/<block>.md`. Proof: `sha256(JSON.stringify(ECONOMY))` identical and key order
  identical at every depth (a test), `npm run bench:econ` byte-identical.
- **T7.4 · the life-beat kinds** (after T6.8): each kind module's chronicles move to
  `docs/notes/life-beats/<kind>.md`.
- **T7.5 · the measurement.** The comment share and O1 token count of every touched module and of
  `src` as a whole, before and after – in the report, never in prose that no test reads.

## 10. When you finish

The last report lists, per wave: the branch and its head, the gate verdicts from files, the proofs,
the DRAFT strings verbatim, the P3 rows applied, and the questions. The architect reviews each
wave before its PR is assembled; the owner merges W1 first.

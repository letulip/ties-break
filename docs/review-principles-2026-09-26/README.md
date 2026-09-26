---
type: review
status: audit
area: project-review
canonical: false
last-reviewed: 2026-09-26
baseline: 03d92221
---

# Ties Break principles review – 26 September 2026

> Run against `03d92221`, read-only on the product. Phase 0 was four serial agents – static, engine
> runtime, browser, gates – writing one shared baseline (`00-baseline.md`) on a quiet machine, so every
> timing in this review is a serial one. Eight lanes then ran in parallel, one agent each
> (`01-architecture.md` … `08-tests-tooling-docs.md`). Every P0–P2 finding was re-checked by an agent
> that had not written it and was told to refute it (CONFIRMED 56 · PLAUSIBLE 11 · REFUTED 1; the one
> refutation is in `09-refuted.md`). A completeness critic then listed dropped hand-offs and unstatused
> items, and a gap-fill pass closed them in the lanes. This file is the synthesis: it deduplicates,
> reconciles and ranks, and says who owns each decision.
>
> Every number below is quoted from the lane report or `00-baseline.md` section named beside it, where
> its command is recorded; all of them ran at `03d92221`. **IDs:** a bare `A-01` … `H-19` is this review.
> A 05.09 ID is always written with its source – `05.09 E-02` is the 05.09 engine lane, and this
> review's lane E (UI) reuses `E-01` … `E-11` for different findings. `05.09 P-nn` follows
> `04-performance.md`'s numbering, not the 05.09 README's ranked list (README P-02 is the lane's P-05,
> `toSnapshot`; README P-04 is the lane's P-02, the install guard). `02.09 P-03` / `P-04` are the
> 2 September review's Money-shop and week-navigation items, not 05.09's.

## 1. Executive verdict

**Two P0s, both CONFIRMED, both narrow, both S to fix.**

- **D-01 (P0) – «Restore previous» can restore the present and destroy the past.** 15 of the 41
  mutation actions in `stores/game.ts` never refresh the slot list, and More reads the stale list
  (`MoreScreen.vue:218-240`). After any of them – the four irreversible dialog answers (life beat,
  knock, gift, shoot clash), every `setPlan` tap, the staff settings – «Restore previous» targets the
  generation that now holds the current state and overwrites the true previous one. Reproduced through
  the real store over the real worker (`04-worker-protocol-persistence.md`, D-01).
- **C-06 (P0) – a knock that arrives on the college departure week soft-locks the career.** The tick
  rolls the knock before `resolveCollegeDeparture` latches the college ending, so a knock can land
  under the latch; `decideKnock` then refuses it with the freeze sentence, and at the first birthday or
  life-beat pause `blockingOverlay` puts up `KnockDialog`, whose only exit is that refused answer.
  5 of 90 probed careers, 2 of 30 on the real fork at 19 (`03-engine-leaves.md`, C-06). The state is in
  the world, so a reload restores it.

Neither blocks what shipped before it, but both should lead the next wave. Beside them, the load-bearing
invariants hold where they are enforced: engine purity green, the runtime import graph of `src`
acyclic over 297 files (`00-baseline.md` §A3), every roll on a purpose-scoped sub-stream, the save
payload flat after week ~200 (77 → 80 KiB, §B.5), no engine heap growth over a 1,400-week career
(§B.7), IndexedDB ~1 ms per autosave (§C.1), and the three largest screens 1.0–2.6 ms to update in
place (§C.2). `src` is 0.19 % duplicated lines (05.09: 0.23 %).

**The five things that matter most:**

1. **The save layer's edges** – D-01 (P0), then **D-02** (P1: a save written by a newer build is
   treated as corruption on the boot door, rolled back and overwritten two commands later – the
   August review's 31.07 finding, still open), **B-02** (P1: `mutate` writes the autosave before it
   builds the snapshot, so a `toSnapshot` throw – the round 42 #15 class that already bricked a save –
   persists a career that cannot load) and **D-04** (P2: 16 of 103 v89 fields pass the import gate and
   then throw). All in `src/worker` and `src/db`, all S.
2. **"Which questions stop time" is written five times, and three copies have drifted.** The dev
   tick's guard hand-copies `advanceRefusal` and its test cannot see the shoot-clash clause go
   (**A-01 = D-03**, P1, mutation-proven three times); `resumeFromCollege` ticks past blocking life
   beats (**B-01**, P1, 23 of 217 college year-calls); `advanceWeeks` drops the shoot clash mid-span
   (**B-04**); the college latch lets a knock in that nothing can answer (**C-06**, P0); and a
   small-talk gate certifies a March entry the freeze refuses (**C-07**). One owner –
   `openQuestions(world)` in `world/multiWeek.ts` (B-04) – closes the class.
3. **Two spellings of one fact that already disagree.** The rivals' run-index memo is keyed on 2 of
   its 5 knobs, so an A/B on the other three moves her and not the field (**C-01**, P1 – the brief's
   own P1 example); the Money screen's ad shelf promises a clothing letter the engine cannot write on
   949 of 949 sampled kitless weeks (**B-03**, P1); the Season header counts the pro allowance by
   season while the engine has counted birthday to birthday since 16.08 (**E-01**, P1). The last two
   wait on the owner's wording.
4. **Test minutes are walked careers, and one family is the cheap lever.** The coach-travel-edge family
   makes ~123 walk calls to reach three careers, has been cut five times and has turned five runner
   runs red with every test green (**G-02 = H-01**, P1). A per-process deep-frozen memo was run on one
   file: 8/8 rungs green on 3 walks instead of 24–25. It retires the cutting protocol.
5. **The costs the owner asked about are mostly in the scaffolding and the headroom, not the product.**
   Tests are 3.89 % duplicated (05.09: 3.34 %) and every 05.09 scaffolding consolidation is still undone
   (F-01 … F-04, H-07); the install gate is 17 KiB from red and 47.9 KB of never-called engine corpus
   rides in the UI chunk (**G-01**, a scratch build freed 49,042 B); and the comment convention costs
   context – 75.6 % of `src` tokens, growing 1.99 comment lines per code line since 05.09 – which is an
   owner decision (**H-04**).

### P0 and P1, deduplicated

| # | ID | sev | eff | what | verdict | needs owner? |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | D-01 | P0 | S | «Restore previous» overwrites the true previous generation after 15 of 41 mutations | CONFIRMED | no |
| 2 | C-06 | P0 | S | a knock on the departure week cannot be answered under the college latch | CONFIRMED | which prevention (no wording) |
| 3 | A-01 = D-03 | P1 | S | the dev tick's guard re-spells `advanceRefusal`; the shoot-clash mutation survives its test | CONFIRMED ×2 | no |
| 4 | B-01 | P1 | S | a college year ticks past blocking life beats (23 of 217 year-calls) | CONFIRMED | yes – pause or collect |
| 5 | B-02 | P1 | S | `mutate` commits the autosave before it can render | CONFIRMED | no |
| 6 | D-02 | P1 | S | a newer build's save is rolled back and overwritten on the boot door | CONFIRMED | no (optional wording) |
| 7 | C-01 | P1 | S | the rivals' run index is keyed on 2 of its 5 knobs | CONFIRMED | no |
| 8 | B-03 | P1 | S | the ad shelf says "Open" for clothing on weeks the engine cannot write the letter | CONFIRMED | the kitless row's words |
| 9 | E-01 | P1 | S | the Season header's pro allowance states the pre-16.08 season window | CONFIRMED | the words |
| 10 | G-02 = H-01 | P1 | S | coach-travel-edge re-walks three careers ~123 times; memo, not a sixth cut | CONFIRMED ×2 | no |

After merging, the review carries **2 P0, 8 P1 and 49 P2** findings, plus four P2s re-rated to P3 in
verification (B-08, B-09, D-06, F-10) and one absorbed (G-05 into H-05). Each lane's P3 table holds the
polish.

### Reconciled across lanes

The completeness critic found five defects written up two or three times and four conflicting
statuses. Each now has one owner here, and the lane files stay as filed.

| merged item | lanes | resolution |
| --- | --- | --- |
| the dev tick's copy of `advanceRefusal` | A-01 (P1), D-03 (P1), B-04's worker half | One finding, cited **A-01 = D-03**, one wave item (W2). The same mutation (`shootClashOpen(w)` → `false` at `sim.worker.ts:392`) survived `dev-fast-forward.test.ts` in lane A, lane D and A's verifier. A-01 and D-03 propose the same fix; **B-04's `openQuestions(world)` supersedes both** as the owner, with the worker calling `advanceRefusal(w) !== null`. B-04 stays its own P2 for the `advanceWeeks` mid-span drift. |
| the dead album corpus in the UI chunk | A-02 (P2, PLAUSIBLE), G-01 (P2) | Two items. **G-01 owns the bytes**: the `/*#__PURE__*/` / lazy initialiser fix, CONFIRMED by a scratch build (757,571 → 708,529 B, headroom 17 → 65 KiB, worker hash unchanged). The lanes disagree on cause, and **A-02's verifier has the stronger evidence**: besides `BracketTabs → world.ts`, the barrel reaches the main thread through `MoreScreen → db/saves → saveCodec → migrations.ts / saveGuard.ts`, so G-01's "the only runtime path" is wrong and repointing the 17 UI imports alone frees nothing. A-02's repoint plus a reverse-purity gate is a separate architecture item (W6, PLAUSIBLE); A-P3-7 (repoint `migrations.ts`'s barrel imports) cuts the second path. A's 28,275 B is the album corpus alone; G's 47.9 KB adds `weekNotes.ts`' 19,641 B. |
| the coach-travel-edge re-walks | G-02 (P1), H-01 (P1) | One finding, **G-02 = H-01**; H owns the fixture design, G the minutes. **One count:** about 123 non-comment walk calls across the five hash helpers (H-01's verifier), 111 of them `careerHashAtSchema` by Phase 0's anchored regex (§D.2), over three careers. **One red history:** five red runner runs with every test green – three by 16.09 (`8527757a`, «the third time»), the 18.09 deploy (`5e44e506`) and the 23.09 wave-12 PR (`154b17d0`'s message: «the wave-12 PR's runner went red with every test green»). G's "five", quoted from the ratchet's header, is right; H's "four" stopped at 18.09. |
| the heavy-file list | G-05 (P3 after verification, PLAUSIBLE), H-05 (P2) | **Which bar is current: solo seconds.** `heavy-tests.mjs:255-256` still reads «the line sits at ~32 s in-pool», but `52ded7ae` (26.08, the same day) withdrew in-pool as the measure – «By the honest measure – solo cost» – and the 12.09 and 18.09 entries were measured solo, the latter against a ~31 s solo bar (`heavy-tests.mjs:414-418`). H-05's verification rested on the stale in-pool bar; G-05's verifier is right about the bar. On the solo measure no bulk file crosses it – `week-notes` / `coach-load` / `wave10-walker-retirement` read 27.4 / 24.6 / 21.6 s – so what survives is narrower: `-late-schemas` (15.7 s solo) breaks the family convention (the other six members are listed), and the list no longer reflects measured cost (those three are heavier than 24 of the 25 heavy shards while nine shards take under 11 s). **One finding, H-05 (P2)**, whose family-glob guard is the confirmed, cheap part; the re-curation by solo seconds rides as G-05's P3 and needs one CI run per arm first. The stale «~32 s in-pool» sentence is a comment fix in the same change. |
| the helper sprawl (lead 1) | F-01, F-02 (census), H-07 (architecture) | **One target shape**, per the brief (H the architecture, F the census): `tests/helpers/career.ts` owns walks – F's `walkWeeks` with its policy flags, `pokedAt`, `weekAtAge`, and H's `memoWalk`; `tests/helpers/scenarios/<name>.ts` owns named scenarios – `clashWorld`, `atCollege`, and F's `signedAdPaper`, `loveEpisode` / `married`, `pushEvent` (F's proposed `tests/helpers/fixtures.ts` content, filed under H's folder). The two walk censuses are both true under their scopes: 90 `walk` definitions of which 34 are real world walks (F), and 69 `function walk(` of which 53 bodies are distinct (H, all kinds). Migration is proven by H's world-hash identity at each call site. |
| the stored-match replay recipe | C-04 (CONFIRMED), F-08 (PLAUSIBLE) | **One finding, C-04, CONFIRMED at P2**, with F-08 folded in. Four recorders and **four** UI replayers (`MatchReplay`, `PracticeFlow`, `TournamentFlow`, `PrologueLocalOpen` – C's verifier added the fourth). The verdicts are compatible: engine tests do replay stored records under the recipe (F-08's verifier), which is exactly why nothing ties the *screens* to the engine's recording options (C-04's evidence). One owner: `recordedMatchOptions` in `match/engine.ts` (C), wrapped for the components by `composables/annotatedMatch.ts` (F), with the box-score table to `ui/BoxScoreTable.vue`. No divergence exists today; the cost is argued, not measured. |
| the counting-window fold | C-P08, F P3-03 | One P3 cluster (05.09 D-07 / C.11). Owner F P3-03; C-P08's `playerBestSum(list, bestN)` is the extraction. |
| CLAUDE.md's stale gate figures | G-P3-04, H-09 | One item, **H-09** (PLAUSIBLE). Only `test:component` is shown stale (~45 s against 67.83 s); the sim figure (7.66 min) is a sum of 13 runs, and the one-invocation wall was never taken. |
| 05.09 E-02 | B: "fixed as filed, class open → B-02"; D: "partially fixed" | **Partially fixed.** `47a36cc0` put the snapshot before the commit on `new`, `restoreSlot` and `importSave` and added spine rows. Open: the v89 spine (D-04) and the same ordering on `mutate` (B-02). D's verdict that the candidate-commit pipeline does what its notes say is not contradicted – B-02 is outside E-02's filed scope – but B-02 sits in D's file and rides in D's wave (W1). |
| 05.09 E-06 | B: fixed in `21ce03d5`; D: fixed in `f58abe75`; A: residue open | **Fixed in `21ce03d5`** («fix: the three refusals the engine did not have - E-06», 06.09); `f58abe75` is the later r37 name-cap follow-up. Residue: enum payloads routed to default arms (B-P3-02) and the unvalidated `new.prologue` / `new.dynasty` arguments, which A handed to D and A itself then filed as **A-05** in gap-fill. |
| 05.09 E-07 | B: `39971391`; D: `3363a974` | **Fixed in `39971391`** («fix(E-07): the two unread Snapshot members are deleted»); `3363a974` is an unrelated year-focus commit that touched the cited lines later. |
| 05.09 E-08 | B: "fixed as ruled"; C: "partly fixed" | **Fixed as filed** (`39aa7525`: two dead exports removed, `ENDING_BLURB` kept by the owner's ruling). The export-surface half is open as P3: 77 internal-only leaf exports and 2 new dead ones (C-P01, C-P02, C-P05) and 93 barrel re-exports nothing imports (A-03). |
| 05.09 E-12 / D-02 | B: fixed; F: the gate half not done | **Fixed** (`cc2e455c`, guarded by `tests/engine-money-strings.test.ts`). Two owner-pending residues, both recorded: `tests/money-format.test.ts:50-54` keeps the engine out of the DRY gate by a written reason, and the career-opening feed line (`world.ts`) prints unrounded decimals that `engine-money-strings.test.ts` pins for the owner's decision. |
| 05.09 E-09 / E-11 | statused in A-04, B-09, C-03, H-04 | E-09: **still open, grown** (`world.ts` 2,265 → 2,878 lines) – the decision is A-04. E-11: **still open, growing** – the convention is H-04, `economy.ts` is C-03, the orphaned doc comment is B-P3-04. |
| the inbox's "handful of rows" contract | D-07; reused by H-04 and B | One finding, **D-07**; the `state.ts:1398` sentence fix rides with it. |
| B-06 and D-04 | the same v89 spine sweep | Counted once (16 of 103 fields pass then throw); **D-04** carries the fix, **B-06** (PLAUSIBLE) adds the defaults / `NaN` half and rides named. |
| B-01, D-06 and C-07 | all in `resumeFromCollege`'s loop | One wave item (W2). |

### The eleven seed leads

| lead | answer | where |
| --- | --- | --- |
| 1 helper sprawl | confirmed; `clashWorld` ×3 drifted, `atCollege` ×8 identical, 27 `weekAtAge`, 56 `LoveEpisode` literals, 53 byte-identical storage shims | F-01 … F-04, H-07 |
| 2 the roll pattern | a shared primitive refuted on price (~8 lines saved, key-composition risk); the missing device is a key-inventory pin – a renamed `life:loss` passes its own suite | B-07 |
| 3 unreachable voice cells | confirmed; expecting and bereavement still stand (queued), `'engaged'` is a third pool; the college knock cells are reachable on one week, and the sweep found C-06 | B-08 (P3), C-06 |
| 4 `plainDynasty` | the explicit copy earns its keep (`toRaw` is shallow); the class needs a unit net | D-08 |
| 5 restated verdicts | confirmed across 47 UI sites: one live wrong window, one re-authored refusal, three copies agreeing only by construction | E-01, E-04, E-06, E-07, F-07 |
| 6 the barrel | a bundle cost (dead corpus), not a typecheck cost (8.6 s whole program); transform and collect cost unmeasured | G-01, A-02, A-03; Not reviewed |
| 7 `economy.ts` | "keys nothing reads" refuted (0 of 884 leaves unread; 3 read only outside `src`); one real double spelling; the file is 92.6 % comment by characters | C-05, C-03 |
| 8 long-career growth | refuted for saves (flat after w200), confirmed for the snapshot: `offers` only grows, 4 → 274 rows, 67 of 90 KiB of growth | D-07 |
| 9 install ceiling | confirmed; JS is +411 of +612 KiB since 05.09; 47.9 KB can leave without a ruling | G-01 |
| 10 `check:tools` | refuted as time (2.9 s of 458 s); an evidence-integrity question for archival tools | H-17 (P3, owner option) |
| 11 test time | confirmed for coach-travel-edge; the college component re-walk is worth at most ~3 s of wall | G-02 = H-01 |

## 2. The app map

Lane A's map (`01-architecture.md`), with each part's top finding taken from whichever lane owns it.
Where that finding changes lane A's verdict, the column says so. Sizes are `00-baseline.md` §A2–§A3
(code / comment lines; fan = fan-in / fan-out over src modules).

| part | size | verdict | top finding (owning lane) |
| --- | --- | --- | --- |
| `engine/world.ts` (integration core + barrel) | 2,878 lines (953 / 1,854); 627 exported names; first function at line 702 | **risk** (A: debt) | **B-01** (P1): `resumeFromCollege` ticks past blocking life beats; then A-04 (P4's status) and B-05 (`closeTournament` drops an unfinished run) |
| `engine/world/*` | 60 files, 50,258 lines; `lifeBeat.ts` 8,003; `snapshot.ts` fan-out 63 | **risk** (A: debt) | **C-06** (P0, `phaseGrowth` / `endings` / `knock`); B-03 (P1, the ad shelf in `toSnapshot`); A-06 (`lifeBeat.ts` 0 → 8,003 lines in 17 days) |
| engine leaf modules (`economy`, `offers`, `spirit` …) | 26 files, 7,436 / 19,814 | **debt** | C-03 (`economy.ts` 92.6 % comment by characters); C-05 (`bond.step` read by no write) |
| `engine/season/` | 11 files; `calendar.ts` fan-in 76 | **risk** (A: healthy) | **C-01** (P1): the rivals' run-index memo keyed on 2 of 5 knobs |
| `engine/match/` | 10 files | **healthy** | C-04 (P2): the replay options have no owner primitive |
| `engine/diary/` | 6 files | **healthy** | F-06 (engine and protocol diary types declared twice); G-01 (`weekNotes` initialisers in the UI chunk) |
| `engine/migrations.ts` | 3,311 lines; `migrateSave` 805 code lines | **debt** | A-P3-7 (live barrel imports, AUG-A9); B-P3-08 (append future steps as named functions) |
| `worker/` | `sim.worker.ts` 943 + `client.ts` 226 | **risk** | **A-01 = D-03** (P1) and **B-02** (P1); A-05 (the prologue / dynasty handovers unchecked) |
| `db/` | 2 files, 580 lines; autosave ≈ 1 ms | **risk** (A: healthy) | **D-02** (P1): `readLatestAutosave` falls back on any throw, a newer schema included; D-05 (`listSlots` reads every record) |
| `stores/game.ts` | 908 lines | **risk** (A: healthy) | **D-01** (P0): 15 of 41 mutation actions never refresh the slot list More restores from; D-05 (41 hand-copied bodies) |
| `shared/` (incl. `protocol/`) | 18 files, 2,349 / 7,380 | **healthy** | F-11 (the 40/60 condition ladder ×3); D-P9 (`TierRefusal` admits reasons never emitted) |
| `composables/` | 44 files, 3,470 / 6,019 | **debt** | E-04 (the tier chip re-authors the engine's refusals, cannot see the third cap); E-06 (`eventActionable` a second body of `eventIsHers`) |
| `components/` (+ `screens/`, `ui/`, `album/`) | 86 files, 23,408 / 20,945 | **risk** (A: debt) | **E-01** (P1, Season header); E-11 (MoneyScreen 4,240 → 4,913 lines, the shop still inline); More is D-01's only reader |
| `App.vue` | 1,980 lines, fan-out 47 | **debt** | E-10 (the three shell notices have no live region); F-07 (the practice-friendly predicate, one of three copies) |
| `prologue/` | 5 files | **healthy** | A-05 (its handover is not shape-checked worker-side; unreachable through the shipped cards) |
| `art/`, `audio/` | 9 + 3 files | **healthy** | – |
| `viz/` | 8 files | **healthy** | F P3-10 (the timeline's "mirror" of the `ooh` rule has drifted) |
| `pwa.ts` | 1 file | **healthy** | `registerType: 'prompt'` is D-02's trigger (an old tab on an old worker) |
| the main chunk's engine share | 70 engine / shared / db / worker modules, 128,034 B; 121,534 B also in the worker | **risk** | **G-01** (47.9 KB never called, against 17 KiB of headroom); A-02 (the barrel keeps the route) |
| *scaffolding:* `tests/` | 607 files, 3.89 % duplicated | **debt** | **G-02 = H-01** (P1); H-19 (a `tier-window` case vacuous since 16.08); F-01 / F-02 / H-07 |
| *scaffolding:* `tools/`, `scripts/`, CI | 266 tools, 26 scripts | **debt** | H-02 (132 of 1,036 commits carry a stale registry); H-03 (two gates read the working directory); F-04 (stats helpers disagree) |
| *scaffolding:* docs, CLAUDE.md | 465 markdown files; CLAUDE.md at its budget | **debt** | H-04 (the comment convention, priced); H-09 (CLAUDE.md headroom 635 characters) |

## 3. Delta against 05.09 and August

### 05.09 (`docs/review-principles-2026-09-05/`, at `98e3560b`)

Every numbered 05.09 finding has one status here; the evidence is in the lane named. Where two lanes
disagreed, the row carries the reconciled status (section 1).

| 05.09 lane | statused in | fixed | partially | superseded | still open | regressed |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| engine E-01 … E-12 | B, C, D | 7 (E-01, 03, 04, 06, 07, 08, 12) | 2 (E-02, E-05) | – | 3 (E-09 grown, E-10, E-11 growing) | – |
| UI U-01 … U-12 | E | 10 | 2 (U-06 → E-08; U-11, the Boy control is the owner's) | – | – | – |
| performance P-01 … P-20 | G | 7 (P-01, 02, 07, 13, 16, 17, 18) | – | 7 (P-03, 06, 09, 11, 14, 15, 20) | 6 (P-04, P-05's advance half → G-03, P-08 → D-05, P-19; P-10 and P-12 not re-measured) | – |
| duplication D-01 … D-09 | F | 4 (D-01, 02, 03, 09) | – | – | 3 (D-04 partly, D-06, D-07) | 2 (D-05 → F-04, D-08 → F-03) |
| duplication clusters C.1 … C.17 | F | 1 (C.16) | 2 (C.8, C.10) | – | 7 (C.4, 5, 7, 9, 11, 12, 17) | 7 (C.1, 2, 3, 6, 13, 14, 15) |
| tests T-01 … T-13 | H | 9 (T-01, 02, 03, 04, 06, 07, 09, 10, 11) | 1 (T-05 → H-05, H-06) | – | 3 (T-08 shrinking, T-12, T-13 by decision) | – |
| **66 numbered findings** (clusters apart) | | **37** | **5** | **7** | **15** | **2** |

- **05.09 E-05** is "fixed on the file door, open on the boot door": lane B called it fixed, lane D
  reproduced the boot-door straddle (D-02), and D's evidence is the stronger.
- **05.09's README "What needs you":** #1 (05.09 E-03, the card's chance) fixed (`cffdcb11`,
  `fc856e17`); #2 (the coach-card floor) fixed on the market (`eb26d25a`), with one invisible residue on
  Home (E-P19); #3 (`npm run icons`) superseded by the owner's 06.09 ruling – it still cannot run, by
  design, and restoring the master stays his; #4 (the install ceiling) guard fixed, the ceiling itself
  queued (`docs/now-next-later.md:243`) and now pressed by G-01; #5 (the wording items) 05.09 E-06
  refusals and D-03 `layoffNote` fixed, U-11 half; #6 (axe) fixed (`70788b49`); #7 (source pins) still
  open and shrinking (86 pin files against 215 mounting); #8 (comment volume) re-priced as H-04; #9
  (`world.ts`) is A-04.
- **02.09 rows carried by 05.09** (lane E): R2-05, R2-08, the `fundsShort` DRY, PROD-34 and QA-39 fixed;
  R2-07 mostly fixed (residue E-08); **02.09 P-03** (extract the Money shop) not started → E-11;
  **02.09 P-04** (App week navigation, Season planner owners) not started and not queued – not raised
  to a finding, since no defect traced to either seam; the KISS script sizes still open and larger.
- **Regressed since 05.09:** the tools' helper copies (05.09 D-05: `money` 27 → 43), the storage shim
  (05.09 D-08: 33 → 57 files), seven duplication clusters (C.1, C.2, C.3, C.6, C.13, C.14, C.15 –
  the staff fare went 2 → 3 copies, F-05), the bulk budgets over 60 s (05.09 T-05: 30 → 42, counted
  under different defaults), round-named test files (38 % → 55 %, H-08), and the screen monoliths
  (AUG-A6). Grown rather than regressed: `world.ts` (+27 %) and the comment share (1.99 : 1).

### August (`docs/review/`, 01.08)

| document | statused in | fixed / done | partly | superseded / ruled | still open | regressed |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| 01 architecture AUG-A1 … A10 | A | 4 (A2, A3 as a guard, A7, A8) | 4 (A1, A5, A9, A10) | 1 (A4) | – | 1 (A6, the screen monoliths) |
| 08 cross-cutting X1 … X8 | A | 5 (X1, X2, X3, X7, X8) | 2 (X4, X5) | – | 1 (X6, a product call) | – |
| 09 proposals P1 … P9 | A | 5 (P1, P3, P5 phase A, P6, P7) | 3 (P4 stalled since 26.08, P8 one third, P9 half) | 1 (P2, absorbed into `spirit.ts`) | – | – |
| 06 performance and robustness | D, G | 4 (career-load replay, autosave desync, precache icons; the match loop no longer reproduces) | 1 (multi-tab: CAS landed, the lease deferred by plan) | 1 (audio cache, by ruling) | 4 (version skew → **D-02**, IDB churn → D-05, canvas, the eager bundle → G-01) | – |
| 05 UX / UI / PWA (code-level items) | E | 4 (errors surface, tour, manifest colour, viewer prefs) | 2 (dialogs mostly → E-08; live regions → E-10) | 2 (column tokens; tap-to-start by ruling) | 7 (safe-area – unverified, history – queued, pills → E-02, px typography, More back affordance – unverified, the week button's hidden reason, install promotion) | – |
| 07 testing and tooling | H | 2 (`test:sim` exit code, components mounted) | 2 (source pins, the wall-time meta-test never built → H-05) | 1 (pre-merge calibration, by ruling) | 4 (linter, coverage – both queued; migration hops v13–v32; small-sample bench bounds) | 1 (round naming 38 → 55 %) |
| 02 code quality | F (duplication), H (the rest) | 3 (money formatting, `STARTING_FUNDS_CENTS`, the badge copies) | 3 (global/scoped CSS, worker boilerplate, dead exports) | – | 4 (replay recipe → C-04, the `ooh` mirror, the friendly lookup → F-07, css-dry-audit drift) | – |
| 03 game design, 04 narrative | none | – | – | – | – | – (not reviewed, section 8) |

## 4. DRY summary

**Clone rates at the 05.09 flags** (jscpd 5.1.2, `--min-tokens 60 --min-lines 6 --skip-comments`;
`00-baseline.md` §A4, read by `06-duplication.md`):

| run | 26.09 | 05.09 | reading |
| --- | --- | --- | --- |
| `src` | 34 clones, 563 lines, **0.19 %** | 29, 488, 0.23 % | flat; the typescript share doubled (91 → 270 lines), a third of it one parallel type (F-06) |
| `tests` | 610, 9,941, **3.89 %** | 332, 5,061, 3.34 % | up; duplicated lines ×1.96 while test lines grew 151k → 256k |
| `tools` | 267, 2,831, **2.81 %** | 192, 1,958, 3.05 % | rate down, volume ×1.45; the helper copies grew faster than the files |
| `scripts` + `e2e` | 23, 368, 2.19 % | 14, 166, 1.76 % | small |
| `src` LOW (30/4) | 424, 9,760, 3.34 % | 344, 5,930, 2.73 % | typescript flat; the rise is the html whole-script artefact and css |

**Every `src` clone at 60/6 was classified**: 26 merge · 4 deliberate (with the note cited) ·
4 coincidental. The duplication that costs is not the mechanical kind in `src`; it is **two spellings
of one fact**, and this review found 15 of them: A-01 = D-03, B-03, B-04, C-01, C-04, C-05, E-01, E-02,
E-04, E-06, E-07, F-05, F-06, F-07, F-11. Four of them already disagree (B-03, E-01's window, E-02's two
answers, F-07's narrowing) and one can defeat an A/B (C-01).

**The largest clusters** (Phase 0's cluster list, opened by lane F):

| cluster | sites | verdict |
| --- | --- | --- |
| tests: the storage shim + mount fixture | 168 sites in 74 files; 53 shims byte-identical | merge → F-03 (`tests/component/setup.ts`, which exists) |
| tests: world walk + `toSnapshot` fixture | 54 in 23; 158 clones in the family | merge → F-02 / H-07 |
| tests: the rng key recorder `vi.mock(engine/rng)` | 50 in 27 | **deliberate** – hoisted per file |
| tests: life fixtures (`married`, `episode`, `weekAtAge`) | 49 in 20 | merge → F-01 / F-02 |
| tools: `argOf` and the args block | 94 in 52; 84 definitions, 11 bodies | merge → F-04 |
| src LOW: the dialog key handler | 38 sites in 13 files | merge → F-10 (P3) |
| src: the CSS objects (floating CTA, scrim, kicker, option, hero fade, proceed, note pill, portrait strip) | 8 families, 3 new since 05.09 | merge → F-09 |

216 test and tool clones matched no family rule and have no verdict (section 8).

**What to merge first** – by cost against drift risk, all byte-identical by construction:

1. **XS, one sitting:** F-05 (the staff-fare charge ×3 → `chargeStaffFare`, feed text byte-identical),
   F-11 (the 40/60 ladder → two exported constants), E-06 (`export const eventActionable =
   eventIsHers`), C-05 (`roundHalf` → `roundToStep`, exact at 0.5), C-P10 (`offerAnswerError` calls
   `isOfferLive`).
2. **S, the drifting facts:** A-01 = D-03 via B-04's `openQuestions`; E-07 (three UI copies of
   `isOfferLive`); F-07 (`isPracticeMatchEvent`); C-04 (the replay options primitive); F-06 (types
   derived by `Pick`).
3. **S, the scaffolding with the best ratio:** F-03 (one shim in `setup.ts`, scoped – see its
   verification note on the 164 files that run without `localStorage` today); `clashWorld` and
   `atCollege` into `tests/helpers/scenarios/` (H-07 steps 1–2).
4. **M, when a wave touches them:** F-01 / F-02 (the fixture builders and walks), F-04 (the tools'
   `_stats` / `_fmt` / `_args`, lifted byte-identical from `econ-bench.ts`), F-09 (the CSS objects).

**Argued and not merged:** the lead-2 roll primitive (B-07), the divorce answer deltas mirrored from
the break-up's (deliberate, pinned, the owner's balance call), `dynastyHandoverOf`'s title fold (still
two readers – the condition its note names has not been met).

## 5. Optimisation summary

**Where the player waits** (Apple M4, a floor for a phone; `00-baseline.md` §B–§C):

| path | measured | share | lever |
| --- | --- | --- | --- |
| one-week advance, worker | 42–55 ms in the browser (§C.2); in node, late window: tick 6.96 + clone 2.50 + encode 7.67 + `toSnapshot` 13.7 ≈ 31 ms (§B.2) | the worker is ~90 % of command → rendered | per-command work is ~3.4× the tick |
| post-advance `toSnapshot` | 12.6–13.7 ms, 36–37 memo misses – unchanged since 05.09 | the one command every week runs | **G-03**: 5–15 exclusion sets and 4–16 `selectEntrants` runs per advance for far preview cards that never read them, plus a dead `posOf` map; removable by construction, gain unpriced in ms (no profile) |
| same-week command | 5.4–6.9 ms `toSnapshot` on a clone (Wave A's memo) | fixed since 05.09 | – |
| snapshot size | 72 → 162 KiB over a career; `offers` is 67 of the 90 KiB gained | transfer ≤ 1.2 ms | **D-07**: ship live rows, fetch the history on demand; ≲ 1.5 ms per command at career end, derived |
| extra round trips | 3 per advance, 2 per settings command; `listSlots` materialises every record | < 0.5 ms each on one career; linear in careers | **D-05** (P-08 carried) |
| render, three largest screens | 1.0–2.6 ms in place; ≤ 6.7 ms Money → Home swap | small | not a lever – splitting a screen is a maintainability question |
| IndexedDB autosave | ~1 ms, flat to week 1,133 | 1–5 % of worker time | not a lever |
| tick growth | 5.07 → 6.96 ms/week, first to last 100 weeks (+37 %), nothing super-linear | – | traced to result weeks (C's gap-fill); ~1.7 ms unexplained, needs a CPU profile |

**The install gate:** 16,367 of 16,384 KiB (17 KiB headroom); JS grew +411 of the +612 KiB since 05.09.
**G-01** frees 49,042 B (measured in verification: headroom 17 → 65 KiB) with no ruling. Beyond it,
only owner options remain: the manifest-only `pwa-maskable-512.png` (105.1 KiB), `theme.mp3`'s bitrate
(2,524 KiB, 15.4 % of the install), and whether the ceiling means raw or gzip bytes.

**The gates** (`00-baseline.md` §D): `npm run check` 458 s summed by step – the unit gate 374 s (82 %),
the component project 67.8 s (15 %), everything else 16 s. Expected gains, all tests-only, none able to
move behaviour:

| proposal | expected gain | how it is proven |
| --- | --- | --- |
| **G-02 = H-01** memo `walkFrozenCareer` | each schema file 12.5–20.9 s → ~4 s; about −64 s serial heavy time, ≈ −32 s of the local unit gate (374 → ~342 s); about −2 min on the CI heavy job (derived from the repo's ×1.9) | the rungs' own frozen hashes; proven on `-mid-schemas` (8/8, 3 walks) |
| **G-04** (a) start the wedding spec first | local e2e 72 → ~45 s | wall clock |
| **H-06** clamp 31 bulk budgets to 60 s | no time; turns an opaque birpc stall back into a named timeout | a guard test |
| G-05 (P3) re-curate the heavy list by solo seconds | unmeasured, possibly negative on CI | one runner run per arm first |

`check:tools`' 266 scripts cost 2.9 s (lead 10 refuted as time). The college component re-walks are
worth at most ~3 s of wall.

## 6. Proposed waves

Only CONFIRMED findings are in scope; a PLAUSIBLE one rides only where it is named as such. The eleven
PLAUSIBLE findings – A-02, A-03, A-06, B-06, B-09, D-06, F-04, F-08, G-05, H-08, H-09 – kept their
evidence in verification but not their whole claim (each lane file's Verification line says which part
is unproven); H-08 appears in no wave. Six waves,
grouped by collision surface. Each item ships with a test that fails on the unfixed tree, proved by
mutation, as 05.09's bundles did. The frozen MAIN capture is **41550 draws / `e6b0c709`**
(`tests/condition.test.ts`) throughout.

**Order and parallelism.** W1 first (the P0s). W2 after W1 (both edit `sim.worker.ts`). W3, W4 and W5
can run in parallel with each other once W1 has landed, with one rule: W4's snapshot projections
(E-04, E-05) land after W3's `snapshot.ts` edits (B-03, G-03). W6 last; D-05 in it needs W1's D-01.

### W1 – Save safety and the soft-lock (P0 + P1) · effort M (five S items) · no owner needed except C-06's choice

| item | change | owner of the code |
| --- | --- | --- |
| **D-01** (P0) | More refreshes `slots` on mount and whenever `game.revision` moves; optionally `restoreSlot` carries the revision the UI believed and the worker refuses with the existing `STALE_REVISION` | `MoreScreen.vue`; `sim.worker.ts` for the optional half |
| **C-06** (P0) | prevent the state with zero MAIN draws: either skip `rollKnock` on the departure week (`world/phaseGrowth.ts:399`) or retire an undecided knock in `resolveCollegeDeparture`; the owner picks which (section 7) | `world/phaseGrowth.ts` or `world/endings.ts` |
| **D-02** (P1) | `decompressWorld` throws `SaveFileError('future-schema', …)` before `migrateSave`, message byte-identical; `readLatestAutosave` falls back only on `corrupted` | `engine/saveCodec.ts`, `db/saves.ts` |
| **B-02** (P1) | `mutate` builds `toSnapshot(candidate)` before `commitAutosave`, the shape `new` / `restoreSlot` / `importSave` already use | `sim.worker.ts` |
| **D-04** (P2) | spine rows for the three array fields (existing sentence); a one-tick dry run on a clone inside `importSave`, wrapped as `corrupted` with the existing "damaged" sentence. **B-06** (PLAUSIBLE) rides named: its door normaliser is this item; its `??` ratchet waits for W6 | `saveGuard.ts`, `sim.worker.ts` |

- **House laws.** RNG: C-06 skips a sub-stream roll (`seed:knock:<week>`) on one week – no MAIN draw,
  the capture holds, `npm run bench:knock` byte-identical outside the departure week; D-04's dry run
  draws only on a discarded clone. Save schema: none, unless the owner's saves hold the C-06 state and a
  repair is chosen – then the three-part law (question 3). Wording: none (D-02 and D-04 reuse existing
  sentences byte-identical). Balance: none.
- **Pins that move.** New: a mounted MoreScreen case (mutate by deleting the mount refresh), a
  `tests/saves.test.ts` straddle case, a worker case with `toSnapshot` spied to throw once, a unit case
  on seed `c-latch-age19-18`, a table-driven `save-import-guard` case. Touched: `restoreSlot` 3 files;
  `readLatestAutosave` 1, `decompressWorld` 2 (the 8 "newer than supported" files unchanged);
  `resolveCollegeDeparture` 6, `rollKnock` 8, `decideKnock` 48 (most unaffected); `saveGuard` 4.

### W2 – One owner for "which questions stop time" · effort M · owner rulings for B-01 and C-07

| order | item | change |
| ---: | --- | --- |
| 1 | **B-04** (P2) | `openQuestions(world): StopReason[]` in `world/multiWeek.ts`; `advanceRefusal = openQuestions(world)[0] ?? null`; the `advanceWeeks` loop adds its results in place of seven hand-written lines (which adds the missing `'shoot-clash'`) |
| 2 | **A-01 = D-03** (P1) | `decisionOpen = (w) => advanceRefusal(w) !== null`; call positions and the thrown string byte-identical; the seven `toContain` spellings become one "calls `advanceRefusal`" pin; table-driven layer-2 cases for birthday, fork, retirement, ending and shoot clash; `r2-13-advance-span`'s drift guard checks every `ADVANCE_REFUSALS` member but `'tournament'` is a `BlockingOverlay` member; A-P3-4's stale "six / five" comment fixed |
| 3 | **B-01** (P1) | under the owner's ruling (a): `resumeFromCollege` pauses for a blocking beat through `pendingYearStart`, read from `openQuestions`; under (b): the loop collects, and B-P3-07's two notes and the copy say so. **D-06** (P3, PLAUSIBLE) rides named: `'resumeFromCollege'` into `HEAVY_COMMANDS` |
| 4 | **C-07** (P2) | under the owner's ruling (a): `'march-entry-open'` adds `!inCollege(world)` (never `world.ending`, which the loop nulls); under (b): the college rows get their own fact |
| 5 | **B-05** (P2) | `closeTournament` finishes an unfinished run (`if (p && !p.finished) skipTournament(world)`) instead of dropping it; no new sentence |
| 6 | **A-05** (P2) | `prologueShapeError` / `dynastyShapeError` beside `profileShapeError`, called in the `new` case before `createWorld`; `prologueFundsCents`' doc corrected to "bounds finite values"; whether the new refusal sentences may reach the error surface is the owner's (section 7) |

- **House laws.** RNG: none – pure predicates; B-01's pause resumes from `pendingYearStart`, so every
  year without a blocking beat is byte-identical (prove with the capture and the college fixtures'
  hashes before and after); C-07 (a) shrinks a sub-stream pool only (`seed:life:smalltalk:<week>`),
  checked with `tools/small-talk-corpus-bench.ts` K5b (R8/R20 college reachability 24.6 % → 0, nothing
  else moves). Schema: none (`pendingYearStart` exists). Wording: B-01 (b) and A-05's refusals are the
  owner's; everything else byte-identical. Balance: none.
- **Pins that move.** `dev-fast-forward.test.ts` (7 spellings → 1; `decisionOpen` 1 file);
  `r2-13-advance-span` gains assertions; `advanceRefusal` 13 and `advanceWeeks` 43 files stay green;
  `resumeFromCollege` 29 files; `closeTournament` 132 callers, 0 need an edit (one archival tool,
  `tools/summer-bench.ts:78`, relies on the drop); `march-entry-open` 0, `reachableSituations` 4; one new
  A-05 file (mutate by deleting the call).

### W3 – Engine: one spelling per fact, and the dead bytes and work · effort M (XS–S items) · B-03's row needs the owner

| item | change |
| --- | --- |
| **C-01** (P1) | key the rivals' run-index memo on the content of all five inputs (or drop the memo: 96 pairs, ≤ 490 `matchDrain` calls) |
| **B-03** (P1) | `adCategoryOpen(world, category)` beside `reviewAdOffer` in `world/sponsors.ts`; `adPortfolioView` moves out of `toSnapshot`'s IIFE and calls it; the roll and its key stay; the kitless row's words wait for the owner |
| **C-05** (P2) | `roundHalf` → `roundToStep` reading `ECONOMY.bond.step` (exact at 0.5) |
| **F-05** (P2) + F P3-14 | `chargeStaffFare(world, event, fare, label)`; the two fare gates → one `staffSeatFareFor` |
| **F-06** (P2) + F P3-17 | `DiaryWorldView` derived by `Pick` from `DiaryFacts`; `coachBilling` / `coachEdgeView` return the protocol types; one `ShopFamily` union |
| **F-11** (P2) | `CONDITION_TIRED_BELOW` / `CONDITION_SERIOUS_BELOW` exported from `shared/avatarEmotion.ts`, read by all three ladders |
| **C-02** (P2) | three stale age-grid comments point at `TIERS[*].minAgeYears` and the 16.08 spec; B-P3-09 (the pro-cap notes in `medical.ts`) in the same pass |
| **B-07** (P2) + B-P3-12 | a key-inventory pin for `lifeBeat.ts`' 20 sub-stream keys (plus `albumBook` and `college`); mutate by renaming `life:loss`. Lands before any `lifeBeat.ts` move (A-06) |
| **G-01** (P2) | `albumBook.ts:315` lazy; the four `…_VOICES` and `WEEK_NOTES` in `weekNotes.ts` behind `/*#__PURE__*/` IIFEs |
| **G-03** (P2) | the far-preview branch passes no `excluded`; exclusions computed in the near branch only; `posOf` deleted. Prefer a lazy `excluded` over a second far-only argument list, per the site's «ASSEMBLED ONCE PER EVENT AND SPENT TWICE» ruling (its verification note) |

- **House laws.** RNG: G-03 removes sub-stream calls (`${seed}:kidtour:${e.id}`), re-keys none; B-07
  freezes keys; no MAIN draw moves anywhere, the capture holds. Balance: C-01 serves identical values on
  shipped knobs (prove with `npm run bench:fatigue` and the coach-travel-edge hashes); C-05 identical at
  0.5. Wording: B-03's kitless row is the owner's; F-05's feed text byte-identical by construction.
  Schema: none. Behaviour: G-03 and B-03 are proven by serialising `toSnapshot` over the 90 golden saves
  and the 13 e2e fixtures at both commits and diffing byte for byte (B-03's diff may differ only in the
  kitless clothing row); G-01 by `vite build` + `node scripts/install-size.mjs` (headroom ≈ 65 KiB) with
  the worker chunk's hash unchanged.
- **Pins that move.** `season/rival` 17 files, only the `rivals.test.ts` comment edited; `roundHalf` 1
  (comment); `chargeMasseurTravel` 1, `chargeCoachTravel` 2, the 12 "one additional fare" text pins
  unchanged; `DiaryFacts` 17 and `diarySource(` 5 re-read, `vue-tsc -b --force` is the gate;
  `conditionBandOf` 4; `adPortfolio` 3, `reviewAdOffer` 7; `albumBook` 9 and `WEEK_NOTES` 8 unchanged, no
  pin on the initialisers; `world/snapshot` 25 and `season/preview` 8, no pin on `argsFor` or `posOf`;
  one new key-inventory test.

### W4 – UI parity and accessibility · effort M · three items wait on the owner

| item | change | owner needed? |
| --- | --- | --- |
| **E-06** (P2) | `export const eventActionable = eventIsHers` | no |
| **E-07** (P2) + C-P10 | the three UI copies and `offerAnswerError` call `isOfferLive` | no |
| **F-07** (P2) | `practiceMatchId(week)` and `isPracticeMatchEvent(e)` in `world/planner.ts`; `App.vue` and `SeasonScreen` narrow to the recap's rule | no |
| **E-05** (P2) | project `kidFinish` (and `isFinal`) on the pending view; compare numbers, not "Runner-up" / "Final" | no |
| **C-04** (P2) + F-08 (PLAUSIBLE, folded) | `recordedMatchOptions` in `match/engine.ts`, used by the four recorders, `composables/annotatedMatch.ts` for the four replayers, `ui/BoxScoreTable.vue`; a mounted `MatchReplay` net whose mutation adds `momentum: false` to one recorder | no |
| **E-03** (P2) | `aria-describedby` from the rank chips (Home, rail) to their own visible spans | no |
| **E-08** (P2) | `useDialogFocus` on EndingScreen (no Escape), on `.mv-hurt` with `aria-modal` and a 375×667 dismiss net, and RankHelp's treatment for TierGuide | no |
| **E-09** (P2) | the five hand-rolled refusal lines → `<StoreError />`; one inside each blocking popup and EndingScreen | no |
| **E-10** (P2) | `role="status"` on the three shell notices | no |
| **F-10** (P3) | `onRadioGroupKey` in `composables/radioGroupKeys.ts` – rides named, since the dialogs are open anyway | no |
| **E-01** (P1) | the header's window words, then a mounted form-B case over `v46` pairing header and pills | **yes – the words** |
| **E-02** (P2) | one `presetOf(week)` in `engine/plan.ts` and one `PlanPresetRow` on the `SegmentedRow` contract, labels as props | **yes – which rule is "hers"** |
| **E-04** (P2) | project the cap verdict per rung from the engine (`tierVerdict` with availability's cap block, or `tierCapRefusal`); the chip prints `refusal.detail`; D-P9's type narrowing rides | **yes – whose sentence stays** |

- **House laws.** Wording: E-01, E-02, E-04 are the owner's; everything else keeps every rendered
  string byte-identical (E-02's labels become props per host). RNG: C-04's seed strings are the same
  template, so replays are byte-identical (prove with `match-annotation-parity`'s hash and one
  `replayMatch(m).result.sets` = `m.score` assertion per match kind). Schema: none – projections only.
- **Pins that move.** `eventActionable` 2; `isOfferLive` 2 (20 letter files unaffected); `practice-w` 4,
  `e.friendly` 7; `TournamentFlow` 49 mount it, 1 file per predicate; `simulateMatch` 42, of which the 2
  re-spelling files change; the rank-chip label 6 files (two select by the label and keep working);
  `EndingScreen` / `TierGuide` / `mv-hurt` 22; `StoreError` 6 plus the five screens' fit nets re-run;
  shell notices 5; `tierState` 15; the preset rows 3. `componentLogic` pins survive the extractions,
  `componentFile` negatives are re-read (CLAUDE.md).

### W5 – Test and tooling structure · effort M–L · tests and scripts only

| order | item | change |
| ---: | --- | --- |
| 1 | **G-02 = H-01** (P1) | memoise `walkFrozenCareer` per process, keyed `(presetIndex, policyIndex, force, profileOverride)`, handing out a deep-frozen world; stop cutting; retire or re-aim the rung ratchet |
| 2 | **H-05** (P2) + G-05 (P3) | a gate-on-gates test: every file matching a declared family glob (`coach-travel-edge-*-schemas`, `goldenSaves*`) is in `HEAVY_UNIT_FILES`; the stale «~32 s in-pool» sentence corrected to the solo measure; re-curation by solo seconds only after one runner run per arm (G-05) |
| 3 | **H-06** (P2) | clamp the 30 test-level budgets over 60 s (one number each; the `round34` `beforeAll` budget stays legal) and add the parser guard |
| 4 | **H-19** (P2) | `tier-window`'s too-young fixture reads `TIERS.w15.minAgeYears - 1`, with a `tierAgeBlock(…) === 'young'` precondition |
| 5 | **D-08** (P2) | one unit test mocking `request` to `structuredClone` its argument, driving every store action that carries an object; mutate by dropping `plainDynasty` |
| 6 | **H-03** (P2) | `tools-registry.mjs` enumerates `git ls-files`; `check:tools` compiles a registry-generated list |
| 7 | **H-02** (P2) (a) + (b) | a pre-commit hook runs the three registry checks when their inputs are staged (~0.6 s); `ci.yml` gains `pins:check` and `decisions:check` |
| 8 | **G-04** (P2) (a) | the wedding spec starts first (own project or name) |
| 9 | **F-03** (P2) | the shim moves into `tests/component/setup.ts`, **scoped** – its verification found 164 component files that run without `localStorage` today, and at least `r47-raise-another-route.test.ts:193-198` reasons from that absence |
| 10 | **H-07** (P2), then **F-01**, **F-02** (P2) | the section 1 target shape: `atCollege` ×8 and `clashWorld` ×3 into `tests/helpers/scenarios/`, then `signedAdPaper`, `loveEpisode` / `married`, `pushEvent`, `walkWeeks`, `pokedAt`, `weekAtAge`; F-01's verifier asks that the in-code counter-stance («a fixture shared across files drifts into being a second production module», `round30-do-both-shoot.test.ts:67-68`) be answered in the change – `bc29ac13` is the answer |
| 11 | F-04 (PLAUSIBLE, rides named) | `tools/_stats.ts` lifted byte-identical from `econ-bench.ts:1068-1087` and re-exported; `_fmt.ts`, `_args.ts`; the 35 live carriers first, each bench's output diffed at both commits |

- **House laws.** None of RNG, schema, wording or balance: tests and scripts only. Every fixture
  migration is proven by the call site's world hash before and after (`tests/helpers/hash.ts`); G-02's
  proof is the rungs' own frozen hashes plus the deep-freeze mutation check; F-04's is a per-bench
  output diff naming every moved cell.
- **Pins that move.** `coachTravelEdgeFixtures` 24 files, none edited if the memo lives inside
  `walkFrozenCareer`; `coach-travel-edge-rungs-ratchet` re-aimed; `heavy-tests` 7; 30 files one budget
  number each; `tier-window` 1; the storage shim 57 files; `clashWorld` 3, `atCollege` 8, the ad paper
  17, `publicWrong: false` 43, `travelCostCents: 100_00` 34, `function walk(` 44, `careerAt` 28,
  `weekAtAge` 26 (overlapping; migrate family by family); registry scripts 1 test each.

### W6 – Structure, when a feature needs the seam · effort L · mostly owner-gated

| item | change | gate |
| --- | --- | --- |
| **D-05** (P2) | one private `commit(msg)` action; per-action list refreshes removed (after W1's D-01 More refresh); `listSlots` reads its career's key ranges only | none; needs W1 |
| **D-07** (P2) | an on-demand `inbox` query (the album's precedent); the snapshot keeps live rows, running deals and the newest letter id; `state.ts:1398`'s "handful of rows" corrected | none for option A |
| **E-11** (P2) | the Money shop → `ShopPanel.vue` + `useShop`, verbatim, after the pin query | none |
| **F-09** (P2) | shared CSS objects beside `dialog-card` under neutral names (`.floating-cta`, `.dialog-kicker`, `.dialog-proceed`, `.portrait-strip` …), every value byte-identical | none |
| **C-03** (P2) | `economy.ts` blocks → `src/engine/economy/<block>.ts`, `ECONOMY` re-assembled in key order; identity by `sha256(JSON.stringify(ECONOMY))`, key order at every depth, `npm run bench:econ` | the owner wanting constants apart from essays |
| **A-04** (P2) | finish P4 (three span-moves) or declare the ordered facade final | the owner |
| A-06, A-03, A-02, B-06, H-09 (all PLAUSIBLE, ride named) | the `lifeBeat.ts` split (after B-07), the barrel freeze, the UI repoint + reverse-purity gate, the `??` ratchet, CLAUDE.md's budget | the owner, per section 7 |

- **House laws.** No RNG key or draw moves in any span-move (the capture plus the life-beat key-count
  nets and B-07's pin); no schema (D-05 needs no DB upgrade; D-07 prunes nothing on disk); no wording
  (D-07 option A renders identically – a mounted `InboxSheet` test over both paths on `pro` and
  `parting`). Balance: C-03's identity hash.
- **Pins that move.** `useGameStore` 196 files (action names kept), `stores/game.ts` 9 source readers,
  `listSlots` 9; `InboxSheet` 14, `inboxCue` 8, `newestLetterId` 3, `inboxMail` 1; `MoneyScreen` 49
  (source pins repointed through `componentLogic`); the CSS class pins (`cal-go` 5, `week-proceed` 5,
  `next-week-bar` 8, `cm-art` 11 …); `economy.ts` 0 source pins, 191 importers unchanged; P4 moves
  12 pin files (`git grep -l "engine/world.ts'" -- tests`).

## 7. Owner decisions

Each is a choice among priced options; none blocks the waves' other items.

| # | finding | the choice | options, priced |
| ---: | --- | --- | --- |
| 1 | **C-06** (P0) | her last week at home | (a) no knock roll on the departure week – S, zero MAIN draws, behaviour moves only on that week; (b) `resolveCollegeDeparture` retires an undecided knock – S, same laws. No wording either way |
| 2 | **B-01** (P1) | does college collect blocking beats or pause for them (your «it collects, it does not halt», with the birthday as the one exception) | (a) pause like the birthday – S, one more click in roughly 1 year in 9, no wording; (b) collect by ruling – S, plus the two `lifeBeat.ts` notes and the `met` / `ended` copy to say so (wording) |
| 3 | **C-07** (P2) | what R8 / R20 mean at college | (a) gate them off at college – S, their college cells join the unreachable class; (b) a college fact over the college fixture – S, keeps the rows. No string moves |
| 4 | **E-01** (P1) | the header's words | (a) the pills' own "counted from birthday to birthday" – S; (b) the engine refusal's "on her next birthday" – S. Either way a mounted form-B pair follows |
| 5 | **B-03** (P1) | what a kitless clothing slot shows | (a) `closed` with the existing "Not open yet" – S, no new words; (b) a new reason line – S, new wording |
| 6 | **E-04** (P2) | whose sentence the tier chip prints for aged-out and capped rungs | (a) the engine's `refusal.detail` – M, the chip's words change; (b) keep the chip's – M, the engine's projection still lands and a form-B case documents the gap |
| 7 | **E-02** (P2) | which preset is "hers" | (a) the layout is the preset's (HerWeekTab's note) – S; (b) the share is the preset's (Coaches, This week) – S. Labels stay byte-identical |
| 8 | **A-05** (P2) | may a malformed-handover refusal reach the error surface | (a) yes, in the existing `New career: …` shape – S, new strings reachable only by a malformed payload; (b) refuse silently to a generic line – S |
| 9 | **B-05** / B-P3-02 / B-P3-01 | refusals that need a sentence | the reveal no-ops refuse or stay idempotent; the three answer commands refuse unknown enums; `setWeightEnabled` refuses on an ended career – each S, each one new sentence or none |
| 10 | **D-02**, D-07 option B | wording and history | D-02: show saveGuard's "update the app" on the boot path (wording) or keep today's text (S, no wording); D-07 (b) cap the shipped history at N rows – S, changes rendered history, against (a) M, render-identical |
| 11 | **H-04** | the comment convention (75.6 % of `src` tokens, 1.99 : 1 growth) | O0 status quo – 0; **O1** a reading tool that collapses comment blocks – S, no source change, an agent reads ~17–25 % of the tokens; O2 short "why" at the site, chronicles verbatim behind a pointer – L swept / S per file, needs "verbatim at a pointer", moves 36 pin anchors in 19 files; **O3** a growth ratchet – S, but it cuts against `context-audit.mjs`' documented never-fail design; O4 git as the chronicle – as O2 without a notes file. Cheapest pair: O1 + O3 |
| 12 | **H-09** (PLAUSIBLE) | CLAUDE.md's budget (635 characters, 2.9 %, left) | (a) raise the ceiling – S; (b) one-line rules with the incident narratives moved verbatim to `docs/context/` – S, ~8–10 KB freed; (c) both |
| 13 | **A-04** | P4 | (a) finish it – M, three span-moves of clusters with zero call-backs, 12 pin files; (b) declare the ordered facade final and pin today's function list – S. One status in one place either way |
| 14 | A-06 (PLAUSIBLE) | `lifeBeat.ts` (8,003 lines, 0 → 8,003 in 17 days) | a CLAUDE.md line "a new beat kind is a new module" plus P4's method one kind per PR – M, after B-07; or leave it |
| 15 | A-03 (PLAUSIBLE) | the barrel | freeze its 534 live names and drop the 93 dead ones – S, 0 tests move; or keep P4's "one barrel line per new module" |
| 16 | C-03 | `economy.ts` | split per block – M, identity-hashed; or keep one file (and rely on H-04 O1 for reading) |
| 17 | H-02 (c), H-17 | generated and archival files | stop committing the world map – S–M, removes 65 commits' churn; freeze dormant archival tools out of `check:tools` by a registry list – S |
| 18 | G-01 (a)–(b), G-04 (b) | bytes and the e2e route | the manifest-only maskable icon (105.1 KiB), `theme.mp3`'s bitrate (2,524 KiB); walk the wedding spec's eight ordinary weeks with reduced motion (≥ 24 s, changes the route the spec defends) |
| 19 | carried | unchanged since 05.09 | the Boy control (E-P18); the divorce answer deltas derived or kept as two dials (lead 7, balance); `money-format.test.ts` keeping the engine out, and the career-opening line's unrounded decimals (pinned in `engine-money-strings.test.ts`); the icon master (05.09 README #3); B-08's twelve unreachable roof lines – collapse or keep as drafts |

## 8. Not reviewed

**No lane failed.** All eight returned reports, every P0–P2 finding got a verdict, and Phase 2's
routing missed none. What was not covered, and why:

**Phase 0 measurements that could not be taken:**
- **The one-invocation `npm run test:sim` wall.** §D's 7.66 min is a SUM of 13 per-file invocations,
  each paying its own start (~12–24 s over-stated in all), so every sim comparison here (25.09's ~8 min,
  H-09, G-P3-04) compares a sum with a wall.
- **Week ~1,600.** No measured career reaches it: under the player policy they retire at weeks
  1,349–1,453 (§B.1), and the deepest committed fixture is `parting` at 1,133. Lead 8 was answered at
  **career end against week 200** instead (stored payload 77.2 → 79.9 KiB); a week-1,600 world needs a
  policy that postpones retirement.
- **No phone-class or CPU-throttled browser run.** Every absolute in §C is an M4 floor. So 05.09 P-10
  (playback at 4× throttle), P-12 (the mobile boot long task), the page-heap half of P-11, the
  screen-switch costs and the service-worker install timings were not re-measured, and IndexedDB was
  not measured on phone flash.
- **CI durations are derived, not read.** Every CI figure (G-02's ~2 min, the ×1.9 / ×2.3 columns) comes
  from the repo's own multipliers; no runner log was read.
- **The barrel's transform and collect cost (lead 6).** No per-file split exists; the arm is a throwaway
  component test mounting `BracketTabs`, timed at `03d92221` and with its `KID_ID` import repointed
  (`01-architecture.md`, Not reviewed).
- **A CPU profile of the post-advance `toSnapshot`,** so G-03's gain is unpriced in milliseconds, and of
  result weeks early against late, so ~1.7 ms of the tick's +37 % is unexplained.

**Left open by the lanes:**
- **Lane A:** the full unit gate on A-01's mutant (one file was run); the A-02 build arm for the UI
  repoint; the individual migration steps (append-only by law).
- **Lane B:** 28 functions over 50 code lines sized, not read; `coachMarket.ts`' copy builders (wording);
  the remaining derivations of `college.ts`, `medical.ts`, `assets.ts`, `albumBook.ts`. `coachMarket.ts`
  itself was reviewed in B's gap-fill (B-P3-10, B-P3-11, no P0–P2).
- **Lane C:** the coach and academy modules were read at code level only in gap-fill; `radar`, `kidLife`,
  `development`, `chemistry`, `childhood`, `collegeLeague`, `equipment`, `plan`, `form`, most of
  `offers` and `season/calendar` were covered by structural probes (size, dead exports, dead keys), not
  read. Lead 3's licence-level sweep of `WEEK_NOTES` was settled only for the knock cells at college.
- **Lane D:** a browser run of D-01 (proven in node over fake-indexeddb) and D-06; real-device quota and
  eviction; `src/pwa.ts` and the update flow beyond D-02's trigger.
- **Lane E:** no browser and no screen reader – every accessibility claim (E-02, E-03, E-08, E-10,
  E-P11–E-P13) rests on the template AST, the accname rules and mounted tests; the August **safe-area**
  item (`--app-pad-top: 24px` flat, no status-bar style in `index.html`) needs a notched device in
  standalone mode; the August **More back affordance** is confirmed as a code fact, its cost untested;
  contrast was not re-derived.
- **Lane F:** clone classification is complete only for `src` at 60/6. **216 test and tool clones** (125
  and 91) match no family rule and have no verdict; the html LOW clones and the rest of the LOW pass were
  classified by class, not clone by clone; the archival tools' copies were counted only.
- **Lane G:** `seasonSupply`'s per-season-week cost and `weekFieldExclusion`'s unit cost (timings); the
  real click path of an advance, so the sweep's share of G-04 is inferred from `dayCross.ts`.
- **Lane H:** whether any of the other 10 `feedContext` / `feedShows` files catches H-19's mutation – if
  none does, H-19 is P1; the 465-document corpus was measured, not read; GitLab CI and the graphify graph.
- **C-06's reach into existing saves:** of the 90 golden fixtures only `v50` holds a `college` ending
  (knock null); the compressed e2e `.tsave` files and the owner's own saves were not checked.
- **August 03 (game design) and 04 (narrative)** were statused by no lane: balance numbers belong to the
  benches and narrative is player-facing wording (brief §10, invariant 4). Neither is a principles
  question.

## 9. Questions

Things the review could not settle from the code and the docs. Each blocks the finding named; none is
guessed.

1. **C-06 – are any of your own saves, or the e2e `.tsave` fixtures, sitting in the knock-at-latch
   state?** The review checked only the JSON golden corpus. If one is, the fix needs a repair step,
   which is a save-schema move under the three-part law; if none is, prevention alone is enough.
2. **C-07 – at college, does R8 (`alone-or-with-them`) mean "the team's next event"?** Its verifier
   notes the kernel may legitimately read that way. The answer picks C-07's option (a) or (b); R20 is
   the clear case either way.
3. **G-01 (c) – is the 16,384 KiB install ceiling meant to bound the download or the storage?** JS is
   1,391.7 KiB raw against about 447 KiB gzip. The answer decides whether the ceiling counts raw bytes,
   and so how much headroom the next content wave has.
4. **F-01 / H-07 – is the brand `'Nine Bells'` in `tests/component/round30-do-both-shoot.test.ts:65`
   meant to be outside the ad ladder?** Its two siblings read `ECONOMY.advertising`'s first house. The
   answer decides the shared `clashWorld`'s brand option.
5. **F P3-20 – is the diary's $8,000 "watchful" money line (`diary/facts.ts:448`) meant to track the
   working family's starting reserve (`economy.ts:271`) if that is retuned,** or is it an independent
   threshold? The answer decides whether it reads the constant.
6. **E-P07 – should the planner's "+gain → N/100" preview include booked rest?** It starts from today's
   condition, not the engine's `projectedConditionAt`. The answer decides whether a per-week arrival
   figure is projected.
7. **E-P15 – are the sub-phone media queries deliberate** (`CollegeYearCard.vue:677` at 340,
   `NextTournamentPanel.vue:513` and `MoneyScreen.vue:3692` at 359)? `docs/specs/responsive-2026-09.md`
   records 560 among the breakpoints that existed before the ladder, and its ruling says only that
   below 768 is "mobile, unchanged", which neither allows nor forbids a 340 / 359 step. The answer
   decides whether each is recorded as deliberate or folded into the existing breakpoints.

---
type: plan
status: current
area: life
canonical: false
last-reviewed: 2026-09-14
---

# Wave 6 builder brief – «the spotlight» (`life/wave-6`, v77)

The owner's commission (14.09): «давай тогда для 1. Волна прожектора (§3c who-she-is) может
спеку билдеру распишем?» – same contract as wave 5: he launches the builder himself, one builder
works T1–T10 in order and hands the branch back to the architect for the final gate.
Self-contained on purpose; when something here is thin, the named source wins, never a guess.

**Sources, single-source rule.** The wave builds against
[who-she-is-2026-09](../specs/who-she-is-2026-09.md) **§3c and §3c-bis** – THE spec, his 09.09
ask ruled and extended 10.09, and on any drift IT wins. The booth boundary and the closed loop
are [the-way-she-sounds-2026-09](the-way-she-sounds-2026-09.md) **C4**, ruled 10.09 – read the
whole row before T7; ⚠ C4's PERSONA half (the duo, the tics, the rotation) is C4's own wave and
NOT this one. The fifth focus is
[the-psychologists-year-2026-09](../specs/the-psychologists-year-2026-09.md) §2's «The public
life» row and O7, ruled 13.09 («ships WITH the spotlight wave, not before it has something to
shrink»). The rung law is [the-masseur-2026-08](../specs/the-masseur-2026-08.md) §4: each rung
measurably better than the one below AT THE CHOSEN FOCUS, or it is re-priced. Fame is READ, never
retuned: `world/fame.ts` (`fameAt` 0–100 capped, `fameEventWeeks`, `completedShootWeeks`) and
[fame-presence-2026-09](../specs/fame-presence-2026-09.md) own that ground. Process laws:
[wave-3 brief](life-wave-3-builder-2026-09.md) §0 applies VERBATIM (read v77 where its law 4
says v74), [wave-4 brief](life-wave-4-builder-2026-09.md) §0's deltas stand (the count-keys net
for zero-draw claims, the `DRAIN_ANSWER` registry, the presence law, the per-key freeze protocol
with rung archaeology), and [wave-5 brief](life-wave-5-builder-2026-09.md) §0's deltas stand –
above all its **law 1: `accrueSpirit` stays the ONE writer of `world.spirit`**. Re-read all
three §0 blocks before T1.

**Base.** `life/wave-6` branches from post-merge `main` `c3c63ddd` (PR #142, wave 5 – the walls,
the focus machinery and `expressedTemperamentOf` this wave stands on are all in; this brief's own
commit sits on the branch). ⚠ First command: re-verify `SAVE_SCHEMA_VERSION`
(`src/engine/world/state.ts:431`) – **76** at brief time, so the wave takes **v77**. Round 41's
parked `OwnedAsset.entries` still hunts a number too – whoever lands second takes the next one,
the standing rule.

**Do not run in parallel with**: the планка-3 / bond-memory session (owner + architect, moves
`ECONOMY.bond`), the form/sparring wave (its spec awaits O1–O8), the voice C-queue (B → C1 → C2
– C4's persona half lives there), or anything else touching `spirit.ts`, `lifeBeat.ts`,
`world/fame.ts`, `commentary.ts` or `SupportStaffTab.vue`.

---

## 0. Wave-6 deltas to the standing laws (read after wave-3, wave-4 and wave-5 §0)

1. **The pressure is a term INSIDE `accrueSpirit`'s own pass, and exposure arrives as an
   argument.** Wave-5 law 1 stands untouched: no spirit write anywhere else. The exposure list
   is computed by the new leaf (`world/spotlight.ts`) and passed in at the `phaseHerWeek` caller
   – the exact dependency-inversion move ruling J used for `psychologistWorks`
   (`phaseHerWeek.ts:27` is the precedent line). `spirit.ts` imports nothing new.
2. **The engine decides, the viz renders.** The booth's private-life mention is an ENGINE fact:
   decided in the weekly tick, stamped on the episode, registered as exposure. `buildCommentary`
   (`src/viz/commentary.ts:1310`) stays a pure, replay-deterministic function – it gains one
   nullable context input (the `CommentaryCoach` shape's twin) fed from the snapshot, and it
   never draws, never reads the world, never decides whether to speak. A draw in `src/viz` is
   this wave's gravest finding.
3. **Publicity is a fact with a week, and it is not the parent's week.** `publicWeek` (when the
   WORLD learned) lives beside `knownWeek` (when the parent did) and they never merge. The booth
   and every public surface may voice ONLY facts with `publicWeek !== null`, at a fame that
   makes her news – «the honest boundary is the world's own PUBLICITY, not the family's walls»
   (C4, ruled 10.09). A fact only the family holds is never voiced, at any fame.
4. **No success tax.** Pressure lands on EXPOSURE EVENTS only – never as a standing weekly
   drain, never keyed on rank or prize. A week with no exposure event is byte-identical to
   wave-5 behaviour (pin, T3), whatever her fame. «Мы ни за что не наказываем» (09.09) is the
   law this delta operationalises.
5. **Habituation is hers; walls freeze it; the focus accelerates it.** It only ever GROWS (v1 –
   she does not unlearn living known), it grows only while she is actually known, it grows not
   at all while any wall is flipped, and no surface prints it – the fog law: the spotlight is
   READ through the feed's plain words, the Mood dips, the diary and the booth, never through a
   meter.
6. **Expression for mechanics, birth for voices – wave-5 law 2 extended to this family.** The
   pressure scale, the habituation freeze and the leak hazard read
   `expressedTemperamentOf(world)` (`spirit.ts:228`, axes via `temperamentOpenness` /
   `temperamentIntensity`); every diary/feed LINE keeps reading birth (the bibles' law).

## 1. Commit order

| # | task | ships |
| --- | --- | --- |
| T1 | schema v77 | `spotlightHabituation` + the four episode publicity fields, fixture, e2e regen, zero-diff pin |
| T2 | the exposure ledger | `world/spotlight.ts`: `exposureEventsOf`, the news bar, five kinds |
| T3 | the pressure | the term inside `accrueSpirit`, expression scaling, the plain feed word |
| T4 | habituation | the slow shrink, the walls freeze, the cap and the floor |
| T5 | the fifth focus | `'publicLife'` joins `PsyFocus`; shrink by rung, acceleration by rung |
| T6 | the leak | per-episode hazard, accuracy by openness, the overtake, the world's feed row |
| T7 | the booth channel | the engine stamp, the snapshot packet, one beat in `buildCommentary` |
| T8 | the strings | drafts → the architect's read → his playtest (standing delegation) |
| T9 | the benches | psy-grid 5×3, `bench:spotlight`, census high-fame column + leak prints |
| T10 | e2e + frozen + gate | the mechanic case, fixtures v77, the first NESTED peel, handoff |
| T11 | the dice come back (owner, 14.09) | two reroll buttons on the prologue identity card – a restore, not a design |
| T12 | need reads reachable money (owner, 14.09) | the cameo gate stops being blind to parked cash – `reachableFundsCents`, the sweep, the wall restored |

⚠ T11 and T12 were added mid-wave by the owner's 14.09 words («докинь микрофикс в эту волну»; the
deposit exploit from his live playtest); they run any time before T10 – their tests ride T10's
gate – and nothing above renumbers.

## 2. The tasks, expanded

### T1 – schema v77

On `WorldState` (`state.ts`, beside the wave-5 walls block):

* `spotlightHabituation: number` – one decimal like spirit; 0 = she has never lived known
  (back-fill `0`). Units: accumulated «known weeks» toward `habituationFullWeeks` (§4).

On `LoveEpisode` (`src/shared/protocol/narrative.ts:328` – flat, boring TS, four fields):

* `publicWeek: number | null` – the week the WORLD learned; null until a leak (back-fill `null`)
* `publicWrong: boolean` – the story landed wrong (the tabloid misattribution flag; back-fill
  `false`; meaningless while `publicWeek` is null)
* `airedMetWeek: number | null` / `airedEndedWeek: number | null` – the booth's once-ness
  stamps: the week each fact was first voiced on air, null = never (back-fill `null`)

Bump 76 → 77, append-only migration (⚠ it walks `loveEpisodes` and back-fills EVERY entry – the
corpus has careers with episodes), golden `tests/fixtures/saves/v77.json`, `npm run
e2e:fixtures`. Expect the seventeen-file-shaped move: `PRE_V77` peel in
`coachTravelEdgeFixtures` (⚠ see T10 – the episode fields make it the protocol's first NESTED
peel), world-symbol-map, `docs/context/saves-and-worker.md`. **The zero-diff pin lands here**: a
migrated world (habituation 0, every episode field at its back-fill) plays byte-identical weeks
before any reader exists.

### T2 – the exposure ledger

New leaf `src/engine/world/spotlight.ts` – pure derivation, ZERO draws, ZERO writes:

* `sheIsNewsAt(world, week)` = `fameAt(world, week) >= ECONOMY.spotlight.newsFameMin` – the one
  gate every public surface shares. ⚠ No fame BANDS exist in the codebase (verified 14.09) –
  this constant is the wave's own bar, a §4 proposal.
* `exposureEventsOf(world, week): ExposureEvent[]` – what put her in the light THIS week, five
  kinds, each licensed by facts the world already records:
  - `'stage'` – a title or final at a big stage this week (tier ≥ the §4 `stageTierMin`; the
    slam fortnight counts by construction). Derivation: this week's finish facts, the same
    ground `fameEventWeeks` (`fame.ts:301`) reads – but ⚠ NOT `fameEventWeeks` itself: that
    list includes w15 titles and season-end stamps, which are nobody's spotlight.
  - `'shoot'` – a delivered shoot week. ⚠ CORRECTED BY T2 (14.09, the wave's rulings doc): the
    brief first grounded this on `completedShootWeeks(world, week)` containing `week`, and that
    function returns weeks lived STRICTLY BEFORE `week` – spelled that way the kind could never
    fire once. The ground is `completedShootWeeks(world, week + 1)` (`fame.ts:212` – keeping
    fame.ts's single predicate and its college-freeze rule), and T2's ARM 3 pins the literal
    spelling red.
  - `'publicLoss'` – an early exit at a big stage while she is news (round ≤ R2 at
    `stageTierMin`+; the heavily public loss of §3c).
  - `'aired'` – the booth touched her private life this week (T7's stamp; reading the stamp
    keeps this pure).
  - `'wrongStory'` – a leak landed WRONG this week (T6; the wrong story is its own pressure
    event, §3c-bis).
  Every kind fires only when `sheIsNewsAt` – an unknown girl has no spotlight, whatever she
  wins. Unit tests craft one world per kind and prove the licence both ways.

### T3 – the pressure

Inside `accrueSpirit`'s own pass (§0.1 – exposure passed in at the `phaseHerWeek` caller):

* Per exposure event: `pressure = base[kind]` (§4 drafts, −2..−4 territory)
  `× perturbationScale(expressed intensity)` (the standing ×0.8/×1.25 – the same helper the
  break-up shock uses) `× opennessScale(expressed openness)` (**×0.75 expressed-open, ×1.5
  expressed-private** – §3c's own numbers: an open girl half-feeds on attention, a private one
  pays more) `× habituationScale` (T4) `× focusShrink` (T5). Summed over the week's events,
  applied as ONE named term, same clamp, same tenths rounding as everything in the pass.
* ⚠ It is weather, not a shock: no `spiritShock` write, no return-curve change – the standing
  return toward baseline is what recovers it. The break-up shock stays the only shock.
* **The legibility law** (§3c: «every dip explainable»): each exposure week prints one no-cents
  feed row naming the thing in plain words (drafts, T8 – «The cameras were everywhere this
  week» territory), `type: 'life'`, kept only when §4's keep rule says so. One row per week,
  not per event – the feed is not a ledger.
* **Pins**: a no-exposure week is byte-identical to wave-5 (the §0.4 pin, run against a famous
  world with no events); the same event costs an expressed-private girl exactly ×2 an
  expressed-open one before habituation (1.5/0.75 – the ratio is the spec's, pin it as a ratio
  so §4 re-tuning cannot silently break the shape).

### T4 – habituation

* Growth: `+1` per week while `sheIsNewsAt` (she is living known), `× focusAccel[rung]` while
  the fifth focus is held (T5), **×0 while `wallsFlipped.open || wallsFlipped.reg`** – walls
  freeze habituation, §3c verbatim; recommendation EITHER axis freezes (a walled-up girl is not
  acclimating, whichever wall it is) – if the builder reads §2a differently, that is a question
  to the architect, not a silent choice. Clamp at `habituationFullWeeks`.
* Read: `habituationScale = 1 − (1 − habituationFloor) × (spotlightHabituation /
  habituationFullWeeks)` – linear from 1 down to `habituationFloor` (§4; the veteran «shrugs»
  but the floor keeps the cameras from ever costing exactly nothing).
* No decay (v1, §0.5), no surface, no snapshot field – deliberately absent and named so nobody
  adds them.
* **Pins**: frozen under a flipped wall (grow a walled and an unwalled twin, equal fame – only
  one moves); monotone in held weeks; the scale's two endpoints exact.

### T5 – the fifth focus – «The public life» (O7, ruled 13.09)

* `'publicLife'` joins `PsyFocus` (`state.ts:472`) – and the type system forces the roster:
  `PSY_FOCUSES` (iteration order: append last), `PSY_FOCUS_LABEL`, `PSY_FOCUS_LINE`
  (`psychologist.ts:300/304/318`). ⚠ The hired card SPLICES `PSY_FOCUS_LINE[focus]` after «On
  retainer – » with the first letter lowercased (`SupportStaffTab.vue`, the Q9 ruling of 14.09)
  – the new line must read naturally in BOTH frames; draft it that way (T8).
* Effects, both through `psychologistWorkingRung(world, 'publicLife')` (`psychologist.ts:242` –
  the college/vacation stand-down comes free):
  - the pressure shrinks: `focusShrink = publicLifeShrink[rung]` inside T3's product;
  - habituation accelerates: `focusAccel[rung]` inside T4's growth.
  Both monotone in rung or the rung is re-priced – the masseur §4 law, benched in T9.
* The year-focus machinery is wave 5's and does not move: free pick at hire, changes in the
  true off-season only, once a season, the 18+ joint choice and the not-ready card all apply to
  this focus exactly as to the other four – zero new consent code.
* The never-fired corridor gains him: weeks paid with the focus held while she is NOT news (or
  habituation already full) are his idle weeks – printed in T9, the academy-fares watch's law.

### T6 – the leak (§3c-bis, the hazard half – the BEATS stay out, see §8)

* **The hazard**: per episode-week, while `publicWeek === null` and `sheIsNewsAt`: one uniform
  on `seed:life:leak:<episodeId>:<week>` against `leakBasePerWeek × leakOpennessMult(expressed
  openness)` (§4 – more lenses on a bigger star is already priced by the news gate; open is
  simply seen). On fire: `publicWeek = week`.
* **Accuracy – the films' gem**: one uniform on `seed:life:leak:story:<episodeId>:<week>`
  against `wrongShare(expressed openness)` (§4 – open leaks roughly TRUE, private leaks WRONG;
  the LATE half of «late and wrong» is emergent from the lower hazard, price it in the bench,
  do not add a lag term). On wrong: `publicWrong = true`, and the landing week carries a
  `'wrongStory'` exposure event (T2).
* **The world's feed row**: the leak week prints the WORLD's version as a kept life row
  (drafts: a true story names the plain fact; a wrong one prints the tabloid's shape – «a
  mystery man» territory, T8). No `amountCents`, ever.
* **The overtake** (the founding scene): if `knownWeek === null` when the leak fires, the
  parent learns FROM the headline – deliver through the STANDING machinery
  (`deliverKnownPartner`, `lifeBeat.ts:3186`) in the same week, so `knownWeek = publicWeek` and
  the existing `'met'` beat rises as built. ⚠ NO new beat kind, no new delivery path – the one
  addition is a headline-register intro variant on the standing prompt (one line, DRAFT, T8);
  if it cannot be one line, that is a question, not a redesign.
* An episode that ENDS while public needs no second hazard: the world that knows of them
  learns of the end with the ending (the booth's `airedEndedWeek` licence reads
  `endedWeek !== null && publicWeek !== null`).
* **Pins**: no leak below the news bar however long the episode runs (count-keys net – zero
  draws while ineligible, per stream); the overtake delivers the same week; `publicWrong`
  requires `publicWeek`; a `'met'` raised by overtake deep-equals a normal one except the
  intro register.

### T7 – the booth channel (C4's boundary, the loop closed – NOT its personas)

* **The engine decides** (in the weekly tick, deterministic, ZERO draws): if this week has a
  big-stage match (the `'stage'`/`'publicLoss'` ground), and `sheIsNewsAt`, and an episode
  holds an unaired public fact (`publicWeek !== null && airedMetWeek === null`, or the ended
  twin) inside `newsWindowWeeks` of the fact's week – the booth touches it: stamp the aired
  week, and the week carries an `'aired'` exposure event (T2). At most one fact per week; met
  before ended if both are somehow due. Once aired, never again – the stamps are the once-ness.
* **The snapshot packet**: one nullable field, facts only, no strings –
  `{ kind: 'met' | 'ended', wrong: boolean }` territory (builder names it; the snapshot's
  «joins and nothing else moves» discipline applies). The world never ships an episode object
  to the UI that the fog law does not already allow.
* **The viz renders**: `buildCommentary` gains a nullable context input beside
  `CommentaryCoach` (`commentary.ts:735` is the shape precedent); when present, ONE beat –
  placed at a changeover by the existing importance machinery, copy in `commentary.ts` where
  all booth copy lives (drafts, T8; «a face in the players' box» is the register for `'met'`,
  the Wimbledon end-titles read for `'ended'`). MatchViewer (`MatchViewer.vue:833`) passes the
  packet through; a mounted component test proves the beat appears with the packet and is
  byte-absent without it.
* ⚠ The wrong story airs WRONG – the booth repeats the world's version, `wrong: true` reaches
  the copy, and the line carries the world's mistake (that sting is §3c-bis working); the
  correction is a later wave's beat, not this one's.

### T8 – the strings (→ the architect's read, the standing delegation)

All drafts, short dash only, no Cyrillic in code or templates, gender-free partner references;
voices read BIRTH (§0.6):

1. The fifth focus: name, label, `PSY_FOCUS_LINE` row (⚠ must read after «On retainer – » with
   its first letter lowercased AND alone – both frames), the card copy, the spec's own receipt
   register («The cameras stopped costing her sleep» is the anchor sentence).
2. The exposure feed rows, per kind × plain words – the week named legibly, never a meter.
3. The leak rows: the true story and the wrong story (the tabloid shape), per fact kind.
4. The overtake's headline-register intro line on the `'met'` prompt.
5. The booth beats: `'met'` (the box read) and `'ended'` (the end-titles read), true and wrong
   variants – booth-legal, vivid, C4's tone reference without its personas.
6. Diary tier-0/1 lines for exposure weeks per BIRTH voice (a private girl after a famous win
   speaks in guarded lines about the noise – bible material).

### T9 – the benches

* **`bench:psy` grows the fifth column** – 5 focuses × 3 rungs, paired arms per cell against
  the rung below AND no-seat: pressure-shrink monotone in rung (> 2×SEM per step or re-priced);
  habituation-acceleration monotone; the never-fired corridor printed per focus including his
  idle weeks.
* **NEW `tools/spotlight-bench.ts` (`bench:spotlight`)** – predicted-first, instrument laws
  stand (no try/catch, per-temperament actuation, `–` never `0.0%`, two exit codes):
  - paired high-fame arms per BIRTH temperament: lifetime spirit-weeks under the knee, match-win
    delta – **the fairness corridor gains its high-fame column, ±1.5 pp on birth cohorts**
    (who-she-is §5's bar, re-read here);
  - the habituation curve measured: weeks from first news to the floor, walled vs unwalled vs
    focus-held arms – «the veteran shrugs» priced before any ruling;
  - the walls loop: a walled-up famous girl vs a repaired one – the parent-in-the-loop claim
    (§3c) shown as numbers.
* **The census (`bench:life-arrival`) gains the leak prints**: share of episodes leaked, median
  lag `sinceWeek → publicWeek`, wrong-story share – per BIRTH temperament, expected shape open
  = often/early/true, private = rare/late/wrong; plus the overtake share (how many parents met
  the boyfriend in a headline).

### T10 – e2e, the frozen careers, the gate

One e2e mechanic case (the 29.08 rule): a famous fixture career → an exposure week's feed line
in plain words → hire + the fifth focus picked → the card carries the year. Keep it one walk;
the booth beat is the component test's job, not e2e's. Fixtures regenerate at v77. Frozen
careers by the per-key protocol, ⚠ **with the protocol's first NESTED peel**: the episode
fields (`publicWeek`, `publicWrong`, `airedMetWeek`, `airedEndedWeek`) peel per
`loveEpisodes` ENTRY, not per world key – extend the peel helper, record the extension in the
fixtures header beside the 14.09 protocol note. Leak draws in re-walked fixtures are the wave's
own expected diff, stamped with their record; **`rngMain` byte-identical is the STOP condition,
every time**; diff FIRST, control = the change neutralised in place, then re-stamp. ⚠ Any new
test walking hundreds of weeks × seed-pairs goes STRAIGHT into `HEAVY_UNIT_FILES`
(`scripts/heavy-tests.mjs`) – the pool has now fired four times and the fourth was this exact
shape; do not wait for the PR gate to teach it a fifth. Then the wave gate – wave-3 §6 verbatim
(check/sim/e2e/capture from files with mtimes newer than the run, parity 375/768/900/1280,
mutation arms recorded, fixture freshness vs head, the build line) – plus this wave's own §6
below, and the handoff package: strings tables, bench records, the questions doc, the ledger
entries in the builder's own voice (`life-wave-6-questions-2026-09.md` /
`-strings-` / `-handoff-`, the wave-5 files are the templates).

### T11 – the dice come back to her name (owner, 14.09 – added mid-wave)

> «вернуть "кубики" на имя и фамилию при создании, оставив дефолт текущий, у нас они были, но
> куда-то пропали»

Archaeology first, so nobody hunts a deleter: nothing was deleted. The dice still live in the
wizard – `reroll()` / `rerollLast()` at `OnboardingWizard.vue:291–296`, the two icon buttons at
`:375` / `:391` (different pip faces on the two dice, on purpose), the `.ob-dice` styles – but
creation moved to the prologue, and the age-5 identity card (`PrologueCard.vue:451–473`) was
built with plain inputs. That is the whole disappearance. The fix is a RESTORE on the card, not
a design:

* Two icon buttons beside the first/last-name inputs on the identity card – the wizard's own
  SVG die faces and `aria-label`s VERBATIM («Random first name» / «Random last name»). Zero new
  visible strings; invariant 4 is untouched by construction.
* **One pool, two readers.** The first-name pool is the wizard's LOCAL `NAMES`
  (`OnboardingWizard.vue:62`); surnames are its `SURNAMES` import (`engine/season/cohort`).
  Lift the pool and the two draw helpers to one importable home (builder's pick) and re-point
  the wizard at it – NO second copy of any list, the repo's two-sides-one-question defect
  class.
* **The default stays prefilled** – `OPENING_IDENTITY` (Alice Martin) untouched, and the ⚠
  prefill doctrine in `src/prologue/identity.ts` stays TRUE and unedited: the field still
  STARTS on the default; a roll is the player's own act, which is exactly the difference the
  doctrine records. `settleIdentity`'s fallback comment also stays true.
* `Math.random` is legal exactly here: pre-world UI, the wizard's own precedent. No engine
  file moves, no world stream, no schema, no snapshot – the RNG laws are not in question
  because nothing they govern is touched.
* Mounted test in the prologue component suite: both dice render inside the 375 frame beside
  their inputs, a click lands a POOL member (⚠ assert membership, not ≠ default – a roll may
  legitimately land the default itself), no click leaves Alice Martin, and
  `prologue-two-paths` stays green. Mutation-proven per the house rule.

### T12 – need reads the money she can REACH (owner, 14.09 – added mid-wave, from his live playtest)

> «у рабочей семьи, если вложить все деньги сразу со стартом карьеры в депозит, сразу же приходят
> спонсорские деньги. Это надо починить, чтобы поддержка приходила реально тогда, когда вообще уже
> край и денег нет, а не только кошельком мыслить» – and, the same hour: «предполагаю, что у
> среднего класса так же будет, так что на них тоже распространяется».

**Anatomy, so the fix lands on the true cause.** The cameo sponsor's gate is `sponsorNeedMet`
(`src/engine/world/sponsors.ts:201`): `fundsCents < runwayWeeks × courtCents`, called from
`phaseFinance.ts:580` with `world.fundsCents`. Its spec –
[need-not-background-2026-08](../specs/need-not-background-2026-08.md) – built a correctness
wall: «nobody is in need before a ball is struck» (worst week-0 runway 81.5 against the bar 62).
That wall was TRUE on 10.08 and was silently broken by a LATER wave: the deposit and the index
fund (rounds 29–30, `economy.ts:1668`'s own words – «WHERE MONEY EARNS NOW») gave the wallet two
parking places the gate cannot see. Park everything at week 0 → `fundsCents ≈ 0` → runway 0 →
the shop writes to a family holding its whole starting cash. Two waves, each correct alone. ⚠
And the owner is right about `middle` BY CONSTRUCTION: the gate has been background-blind since
its own wave (that was the point of it), so the hole is every background's – the fix is one
read, not per-background patches.

* **The helper – one function, one question.** `reachableFundsCents(world)` in
  `world/assets.ts`: `world.fundsCents` + Σ `valueCents` over the CASH-PARKING rows.
  `OwnedAsset.valueCents` is re-written by `revalueAssets` every tick, so no new arithmetic and
  no price re-derivation – the read is already maintained. Cash-parking = the deposit and the
  index fund, MARKED ON THE CATALOGUE (a flag on the two `ECONOMY.shop.catalogue` rows, or the
  mechanism the builder defends in the rulings doc) – never an id string-match at a call site.
  Cars, gear, the business/brand stay OUT: they are things, not parked cash, their worth curves
  are path-dependent, and nobody sells a company to qualify for a $500 cameo.
* **The confirmed site moves**: `sponsorNeedMet`'s caller passes `reachableFundsCents(world)`.
  The bar itself does not move – `runwayWeeks 62`, the court denominator, the rung cut, the
  amounts are all UNTOUCHED (§2.2/§2.3 of the spec stand; only the INPUT widens).
* **The sweep – every need-verdict on the wallet, listed in the handoff.** Run
  `git grep -n "fundsCents" -- src/engine` and judge each VERDICT read (writes and spending
  caps are not the family): (a) `ending.ts:239–240` – the broke-ending pair reads raw
  `fundsCents`; a family with a fat deposit must not be declared «край» by the mirror of the
  same blindness – verify against how bills and the deposit actually interact and either move
  it to the helper or bring the architect the reason it stays; (b) `diary.ts:216`
  `fundsPressure` – mom worrying about money while $30k sits parked is a falsehood in her
  voice; measure how often it fires on parked-cash worlds and propose; (c) academy
  `needFactor` and the college need layer read BACKGROUND by their own ruled design (the
  anketa, not the account) – NOT touched, named here so nobody «fixes» them.
* **Tests.** The repro as a unit test, both his arms: a `working` AND a `middle` family,
  week-0, deposit-all → the cameo must NOT fire while the money is parked (walk the full
  window); then spend the parking down for real → it fires once reachable money is under the
  bar. Mutation arm: revert the gate to raw `fundsCents` and the test reddens. Control pin: a
  world with zero asset rows plays byte-identical (the helper degenerates to the wallet there
  – the no-deposit family's behaviour is provably unchanged).
* **Bench.** Re-run `tools/runway-probe.ts` (the spec's own instrument) on the widened read:
  the no-deposit corridors must come back byte-identical (its policies never buy assets – that
  IS the control), plus one deposit-all arm printed predicted-vs-measured. The spec gets a
  dated amendment: the wall's sentence gains «…and parking the wallet does not fake it» with
  the 14.09 story.
* No wording changes anywhere in T12; no `ECONOMY.sponsor` number moves; no new state – the
  helper is derived, schema untouched.

## 3. The streams of this wave

| stream | drawn for | keyed on |
| --- | --- | --- |
| `seed:life:leak:<episodeId>:<week>` | does this episode leak, this week | the episode and the week |
| `seed:life:leak:story:<episodeId>:<week>` | did the story land wrong, at the leak week | same pair, its own purpose – one value per key, the §1f law |

Nothing else draws. T2's ledger, T3's pressure, T4's habituation and T7's booth stamp are pure
arithmetic; zero draws while ineligible is proven with the count-keys net (wave-4 §0.1), per
stream. Both keys are (seed, calendar), never a choice; MAIN is untouched and the capture
(41550 / `e6b0c709`) must not move. ⚠ The booth mention is DETERMINISTIC by design – the
licence conditions fire it, no dice: variety is the persona wave's business, not this wave's.

## 4. The constants (home: `ECONOMY.spotlight`, one block; the focus rows join
`ECONOMY.psychologist`)

**Anchored by the spec – quote the source at each constant:**
`opennessScale` **×0.75 expressed-open / ×1.5 expressed-private** (§3c's own numbers) · the
pressure drafts live in «−2..−4 before scaling» (§3c) · the intensity scale is the STANDING
`perturbationScale` – not a new constant.

**Proposals – NONE ruled, all bench-priced predicted-first, his word after:**
`newsFameMin 30` (anchor ⚠ CORRECTED BY T2, 14.09: the 30 lives at
`ECONOMY.business.merch.contracts.fameCap` – the merch/brand-reach model's own bar, one system
further from «the ad market» than the brief first said; a proposal, not a derivation) · `stageTierMin 500` · `pressureBase { stage: −3, shoot: −2,
publicLoss: −4, aired: −3, wrongStory: −4 }` · `newsWindowWeeks 6` · `habituationFullWeeks 104`
(two seasons of living known) · `habituationFloor 0.25` · `publicLifeShrink [0.85, 0.70, 0.55]`
· `publicLifeAccel [1.5, 2.0, 2.5]` · `leakBasePerWeek 0.008` · `leakOpennessMult ×2.0
expressed-open / ×0.5 expressed-private` · `wrongShare 0.15 open / 0.60 private` · the feed
keep rule (keep the first exposure row of a season, drop repeats – proposal).

## 5. The string gate (invariant 4)

Every player-facing word in T8's list is a DRAFT: the builder writes against the bibles, the
architect's вычитка is the delivery gate, the owner's playtest is final (the 10.09 rule). No
existing string moves – a fix that seems to need one is a question to the architect, not an
edit. ⚠ The booth beats are doubly bound: DRAFT under invariant 4 AND booth-legal under C4 –
what is true stays machine-checked (only `publicWeek` facts, only her news window), how it is
said is his.

## 6. The final gate

Wave-3 brief §6 verbatim, plus this wave's own: the T1 zero-diff pin green at head; the T3
no-exposure byte-identity pin green against a FAMOUS world; the ×2 private/open ratio pin; the
walls-freeze pin; the fairness corridor's high-fame column inside ±1.5 pp or the miss printed
and carried to the owner; the census leak prints attached; `grep -rn "rng\|Math.random" src/viz/commentary.ts`
provably clean of draws; `ECONOMY.fame` provably untouched (a grep is the proof). The sentence
«ветка готова» follows the assembled PR body and nothing else.

## 7. Decided on entry / still open

**Ruled on entry**: the booth may touch her private life exactly as far as the world publicly
knows it, and such a mention IS an exposure event – the commentary and the pressure are one
system (10.09, both quotes in C4) · pressure on exposure, never a success tax; no standing
drain (§3c, 09.09's «мы ни за что не наказываем») · who carries it well reads the CURRENT her –
expression, not birth (§3c) · walls freeze habituation (§3c) · «The public life» ships in this
wave, effects = shrink by rung + habituation acceleration (O7, 13.09) · the leak HAZARD and the
booth/box channel ride this wave; the press-question and correction BEATS do not (§3c-bis's own
landing) · identity immutable, the fence stands (§3, 09.09).

**Still open, to the owner, in the handoff**: every §4 proposal number (after the benches) ·
every T8 string (his playtest final) · whether the WRONG story may cost pressure before its
correction beat exists (shipped per the spec's landing; flag it in the handoff so he rules with
the numbers in hand) · the habituation freeze axis if the builder contests EITHER-axis (T4).

## 8. What wave 6 must NOT do

No booth personas, no duo, no tics, no rotation draw – C4's own wave owns them; no
press-question beat, no correction beat, no new `LifeBeatKind` member; no publicity meter, no
habituation surface, no leaning printout – the fog law; no standing fame drain and no fame cap
change – `ECONOMY.fame` is fame-presence's ground and this wave only READS `fameAt`; no rival
spotlight – rivals unaffected (§3c boundaries); no draw and no world import in `src/viz`; no
spirit write outside T3's term inside `accrueSpirit`; no new shock kind – `spiritShock` stays
breakup-only; no `spiritMatchFactor` change – the 0.90 floor and knee 60 stand for everybody;
no walls retune and no `ECONOMY.bond` touch (планка-3's session owns bond); no `Temperament`
rewrite ever; no wording change outside T8's draft set; and the wave adds NO consent code – the
fifth focus inherits wave 5's year machinery byte-for-byte.

---
type: plan
status: current
area: life
canonical: false
last-reviewed: 2026-09-13
---

# Wave 5 builder brief – «the psychologist's year» (`life/wave-5`, v76)

The owner's commission (13.09): «окей, бриф пиши, а билдера я сам запущу» – he launches the
builder himself, so this brief is the WHOLE handoff: one builder works T1–T11 in order and hands
the branch back to the architect for the final gate. Self-contained on purpose; when something
here is thin, the named source wins, never a guess.

**Sources, single-source rule.** The wave builds against
[the-psychologists-year-2026-09](../specs/the-psychologists-year-2026-09.md) – THE spec, ruled
13.09, and on any drift IT wins; its §2 table is the focus effects' source. The walls model is
[who-she-is-2026-09](../specs/who-she-is-2026-09.md) §2a verbatim (identity immutable · repair is
free, growth is work · mechanics read expression, voices read birth), with §3's fence and §4's
constants beside it. The seat's ruled shape is
[the-travelling-team-2026-08](the-travelling-team-2026-08.md) §2 (unlocks with the professional
career · remote · salary only, ruling Б) and its §4 legibility law («you paid, and you cannot
tell» is the failure). The rung law is [the-masseur-2026-08](../specs/the-masseur-2026-08.md) §4:
each rung measurably better than the one below AT THE CHOSEN FOCUS, or it is re-priced. The build
plan's §6a is fed, not governing (its own 09.09 note). Process laws:
[wave-3 brief](life-wave-3-builder-2026-09.md) §0 applies VERBATIM (read v76 where its law 4 says
v74), and [wave-4 brief](life-wave-4-builder-2026-09.md) §0's deltas stand – the count-keys net
for zero-draw claims, the `DRAIN_ANSWER` registry, the presence law for HER pools, the per-key
freeze protocol with rung archaeology. Re-read both before T1.

**Base.** `life/wave-5` branches from post-merge `main` `4ceb7c0d` (PR #136 wave-4 and PR #137
round-41 both in; this brief's own commit sits on the branch). ⚠ First command: re-verify
`SAVE_SCHEMA_VERSION` (`src/engine/world/state.ts`) – **75** at brief time, so the wave takes
**v76**. Round 41's parked #22 (`OwnedAsset.entries`) also aims at v76 – whoever lands second
takes the next number, the standing rule.

**Do not run in parallel with**: the планка-3 / bond-memory session (it moves `ECONOMY.bond`; by
the 13.09 word it stays the owner's own session AFTER his playtest – if it somehow lands first,
re-run this wave's benches on the union), the C-queue diary work, or anything else touching
`lifeBeat.ts` / `spirit.ts` / `SupportStaffTab.vue`.

---

## 0. Wave-5 deltas to the standing laws (read after wave-3 §0 and wave-4 §0)

1. **`accrueSpirit` stays the ONE writer of `world.spirit`.** The recovery focus is a term
   INSIDE its own pass – while a shock is live the return step reads the seat's state and gets
   bigger (T4); the slope dies with the clear. A spirit write anywhere in `psychologist.ts`, in
   a command handler, or anywhere else is the gravest finding this wave can produce.
2. **Expression vs birth, made file-law.** A new pure `expressedTemperamentOf(world)` is what
   the MECHANICS read (T7 lists every re-pointed site); the voice bibles, the tier-0/1 pools,
   the prompt registers and the birthday-ask weighting keep reading BIRTH (who-she-is §3's
   fence: «the voice bibles read birth alone»). While the leanings are 0 and nothing is flipped
   the function RETURNS birth – the wave's first pin is a zero-diff proof, and it lands in T1
   before any reader moves.
3. **Repair is free – the layer's own law, benched.** Every walls-fall path must be measured
   with `psychologistHired === false` in the control arm; the seat only ever ACCELERATES the
   road home. Gating any part of that road behind the retainer is a design violation, not a
   tuning miss («мы ни за что не наказываем», ruled 09.09).
4. **Consent is deterministic.** The not-ready card (`'herself'` at a strained/cold bond) and
   the 18+ joint decline read the bond BAND and nothing else – no draw, ever. Her yes is never
   dice, and both refusals are engine-side (the command refuses; the card explains with the
   same sentence – the R10-16 one-story doctrine).
5. **The counsel seat does not reshape `lifeBeat.ts`.** The psy beat is ONE `raiseLifeBeat`
   call at the reserved slot (the ⚠⚠ comment beside the `'fork-counsel'` raise names it) plus
   registry rows. The file's own promise – «nothing about this file changes shape to take him»
   – binds this wave's diff to exactly that.

## 1. Commit order

| # | task | ships |
| --- | --- | --- |
| T1 | schema v76 | seat fields + the two walls-leanings, fixture, e2e regen, zero-diff pin |
| T2 | the seat | `world/psychologist.ts`, pro gate, salary, suspend pair, staff card |
| T3 | the year-focus | pick at hire, change in the off-season only, consent gates |
| T4 | «Back on her feet» | the recovery slope inside `accrueSpirit`, clear receipt |
| T5 | «Cool head» | bounded composure walk toward her own ceiling |
| T6 | «Learning to listen» | the legible-wording draw; bond arithmetic byte-identical |
| T7 | the walls | leanings, flips with hysteresis, `expressedTemperamentOf`, re-points |
| T8 | the counsel seat | `'fork-psy'` at the reserved slot, gated on the hire |
| T9 | the strings | drafts → the architect's read → his playtest (standing delegation) |
| T10 | the benches | the 4×3 grid, the never-fired corridor, census v3, fairness re-read |
| T11 | e2e + frozen + gate | the mechanic case, fixtures v76, per-key protocol, handoff |
| T12 | coach profiles (owner, 13.09) | a derived LENS on the market's existing axes – ruling H |
| T13 | the elite gate goes ON (owner, 13.09) | the built flag flips, surfaces re-proven – ruling H |

⚠ T12–T13 were added mid-wave by the owner's 13.09 word; their full task text is **ruling H in
[life-wave-5-rulings-2026-09](life-wave-5-rulings-2026-09.md)** – they run after T9, before
T10–T11 (T10 gains their bench lines, T11's gate covers them), and nothing above renumbers.

## 2. The tasks, expanded

### T1 – schema v76

On `WorldState` (`state.ts`, the masseur v59 block's style – flat seat fields, one walls pair):

* `psychologistHired: boolean` (back-fill `false`)
* `psychologistRung: 0 | 1 | 2` (back-fill `1` – the sport psychologist is the DEFAULT rung,
  the masseur's middle-rung precedent; meaningless until hired)
* `psychologistFocus: PsyFocus | null` where
  `PsyFocus = 'coolhead' | 'recovery' | 'listen' | 'herself'` (back-fill `null`)
* `psychologistFocusSeason: number | null` – the season the focus was set FOR (T3's
  one-change-per-season fact; back-fill `null`). ⚠ AMENDED BY RULING I after T3 measured it:
  `psychologistFocusSeasonFor(week)`, not `seasonIndexOf(week)` – the off-season is the last three
  weeks of the block it ENDS, so the plain index locked a mid-season hire for up to 101 weeks
* `wallsLean: { open: number; reg: number }` – the two §2a leanings, one decimal like spirit;
  0 = expression equals nature (back-fill `{ open: 0, reg: 0 }`)
* `wallsFlipped: { open: boolean; reg: boolean }` – the hysteresis state: `true` = the
  expressed pole on that axis is the opposite of birth (back-fill both `false`)

Bump 75 → 76, append-only migration, golden `tests/fixtures/saves/v76.json`,
`npm run e2e:fixtures`. ⚠ Expect the wave-4 T1 lesson: this is a seventeen-file-shaped move –
`PRE_V76` peel in `coachTravelEdgeFixtures`, world-symbol-map, `docs/context/saves-and-worker.md`
move with it. **And the zero-diff pin lands here**: a migrated world (leanings 0, nothing
flipped, seat empty) deep-equals every temperament read against birth and plays byte-identical
weeks – proven before any reader is re-pointed, so T7's swaps have a floor to stand on.

### T2 – the seat

New leaf `src/engine/world/psychologist.ts`, `masseur.ts`'s twin by construction (same import
discipline, same guard set, ZERO draws on any stream – a salary is a negotiated number):

* `psychologistUnlocked(world)` = `activeLadderOf(world) === 'wta'` – the travelling-team ruled
  table's own gate, `masseurUnlocked`'s twin on the same one-way door; plus
  `PSYCHOLOGIST_LOCKED_DETAIL` (draft), printed by the card AND thrown by the hire – one story.
* `hirePsychologist(world, hire)` – the coach's shape: no signing fee, effective from the next
  weekly bill, firing always allowed; refused inside the college freeze with the college
  sentence; `guardNotEnded`. Firing keeps `psychologistFocus` as a dead letter (re-hiring
  mid-season resumes it; the season guard still holds changes).
* `setPsychologistRung(world, rung)` – any time, the masseur dial's precedent.
* The salary: flat weekly per rung, `ECONOMY.psychologist.rungs[rung].salaryCents`, charged in
  the weekly finance pass beside the masseur's row (feed text draft: `Psychologist – weekly
  salary`), **no fare, ever** – ruling Б; `staffSeatFareCents` and `staffResultShareBps` are
  not widened (O3 ruled: no results share – he is not in the box on match day).
* `psychologistWorksInWeek(hired, inCollege, familyWeek)` – the masseur's stand-down pair
  MIRRORED byte-for-byte in shape: suspends (does not cancel) in college and on a family
  vacation week; read `masseurWorksInWeek` / `resolveMasseur` and twin their work-vs-billing
  semantics exactly rather than re-deriving them.
* Wire: commands through `messages.ts` → `sim.worker.ts` → `client.ts` → `game.ts`, the masseur
  wire's twin. Snapshot: `psychologistHired`, `psychologistUnlocked`, rung, focus, the card's
  `line` and `priceLabel`; the salary joins `outgoingCents` – `snapshot.ts`'s own promised seam
  («joins `outgoingCents` and NOTHING else has to move»), so HouseholdStrip moves by itself.
* UI: the second `StaffMember` entry in `SupportStaffTab.vue` – the list was built for him and
  its comments say so; **no dial and no travel switch** (the descriptor made both optional for
  exactly this seat). The two keyed confirms already serve the whole list; give him his own
  `data-staff` hook. The rung selector (three rungs) and the focus row (T3's entry point)
  follow round 40's radio conventions; any new dialog carries the mounted 375x667 pin, proven
  by mutation.

### T3 – the year-focus

* `setPsychologistFocus(world, focus)` engine-side, id re-validated: refused when not hired;
  **the first pick at hire is free** (the year starts when the work starts); **a CHANGE is
  allowed only in the off-season window** (`isOffSeasonWeek` – ⚠ AMENDED BY RULING I; the brief
  first named `isBlackoutWeek`, which is the off-season OR an exam fortnight while school is not
  over, and that gave a still-at-school professional a second window in June) **and once per
  season**
  (`psychologistFocusSeason` guards it) – O1's «season boundary only», made mechanical. Refusal
  sentences are drafts, printed by card and throw alike.
* **From 18 the choice is JOINT** (`kidAgeExact ≥ 18`, ruled 09.09): at a `strained`/`cold`
  bond she declines any set or change – deterministic band read (§0.4), and the card carries
  her decline line (HER voice: the bibles' strained/cold register – the flat-pool law applies
  by construction, since the decline only exists at those bands).
* **`'herself'` requires readiness at ANY age**: at strained/cold the card says she is not
  ready (the spec's ruled line) – same deterministic read, its own sentence.
* Deliberately absent: no `lifeLog` row (a focus pick is the parent's staffing decision, not a
  life beat), no bond delta from the pick itself, no money beyond the salary already running.

### T4 – focus «Back on her feet»

`ECONOMY.psychologist.recoverySlope = [2, 3, 4]` (the spec §2's ruled numbers). Inside
`accrueSpirit`'s own pass: while `spiritShock` is live AND the seat is hired with
`focus === 'recovery'`, the return step is `returnPerWeek[intensity] + recoverySlope[rung]` –
one step, the same clamp, the same tenths rounding, and it dies with the clear
(`baseline − 2`). No second curve, no taper, no flag – the standing rule, made faster while he
works. **Receipt**: at the clear week, one no-cents feed line (draft: «She came back sooner
than last time») printed only when the focus was held for at least half the shock's weeks
(`spiritShock.week` gives the span – an honest «he worked it», not a subscription stamp).
**Pin**: with the seat empty the whole recovery is byte-identical to wave-4's – the control arm
in code, not only in the bench.

### T5 – focus «Cool head»

`ECONOMY.psychologist.coolheadPerSeason = [1.5, 2.5, 3.5]` (spec §2; O5 – bench-first, his word
after measurement). Per held week: `rate / WEEKS_PER_YEAR` added to `composure` toward
`potential.composure` and NEVER past it – clamp at the ceiling, zero effect there (the spec's
own bar), applied in the weekly development pass as its OWN named term beside training growth,
never by mutating the plan. `SKILL_KEYS` untouched; `veteranPoise` and the age creep untouched.
⚠ This is the ONE place the seat touches a skill (the spec's own ⚠): the own-ceiling cap and
T10's training-only control arm are the licence – anything touching any other skill, or any
ceiling, is out of scope and a finding.

### T6 – focus «Learning to listen»

At the RAISE of a read-bearing beat (`'met'` with its wants read, `'ended'` with its
space-vs-company read), if the seat is hired with `focus === 'listen'`: one uniform on
`seed:psy:listen:<kind>:<week>` against `listenClarity = [0.60, 0.80, 0.95]` (spec §2, ruled).
Success ⇒ the prompt heading and the kept feed row use the LEGIBLE wording variant – it says
plainly what she wants; failure ⇒ the standing ambiguous wording, byte-identical. **Bond
arithmetic untouched in both arms**: the deltas, the read draw, the option set are the same
bytes with the focus on or off (pin: deep-equal the priced option sets across the toggle). He
coaches the PARENT and never reports her sessions (the ruled re-cut) – every legible line is
written as the parent's own trained reading, never «the psychologist says she wants…».

### T7 – the walls (who-she-is §2a, verbatim model)

* **The weekly leaning pass** – deterministic, ZERO draws – rides beside the bond regression in
  `spirit.ts`'s weekly pass (the file's own «one weekly function» law; now three numbers, one
  week). Per axis, drift by the CURRENT bond band:
  - `strained`/`cold` ⇒ **−wallsRisePerWeek** (walls up, both axes – kicks close her and
    dysregulate her); a RETAINED seat at rung ≥ 2, any focus, slows this: ×0.75 (O6, ruled –
    the second legible thing the retainer buys; the multiplier is a bench proposal);
  - `close`/`steady` ⇒ **+wallsRepairPerWeek toward 0 and NOT past it** – repair is free and
    stops at her nature; holding `'herself'` accelerates it ×1.5 (proposal);
  - **beyond 0** – toward the opposite pole: open for a born-`private` girl on the open axis,
    steady for a born-`intense` one on reg; clamp at 0 for born-open/born-steady, nowhere to
    grow – ONLY while `'herself'` is held AND the bond is close/steady (consent stands):
    **+wallsGrowthPerWeek**.
* **Flip hazards**: past ±`flipArm` the axis ARMS – one uniform per armed axis-week on
  `seed:life:walls:<axis>:<week>`, p = `flipHazardPerWeek`, and in the beyond-baseline
  direction ONLY the rung scales it **×1 / ×1.5 / ×2** (the spec §2's ruled row). On fire,
  `wallsFlipped[axis]` toggles. The un-flip arms only once the leaning is back inside
  ±`flipRelease` – the band between release and arm is the hysteresis dead zone and arms
  nothing. «A flip is an event of seasons»: ~40 weeks of sustained pattern to arm, then a
  median ~13 armed weeks (the proposals' own arithmetic; the census holds it).
* **`expressedTemperamentOf(world)`**: birth poles with flipped axes inverted → the same four
  buckets. Re-point the MECHANICS – each swap is one import and one call-site with a ⚠ comment:
  the arrival and ends hazard multipliers and their cooldowns (per-bucket), the feed-lag and
  wants draws (openness), `returnPerWeek` and `perturbationScale` (intensity). The voices, the
  prompt registers, the birthday-ask weighting stay BIRTH (§0.2).
* **No surface shows any of it** – no leaning, no flip line, v1: the existing surfaces (the
  face, the Mood word, the diary bands, the feed's silence) ARE the telegraph, and the album
  reads the arc later (step 6+). Deliberately absent and named so nobody adds it.
* The zero-diff pin (T1) must still be green after every re-point – re-run it per swap, not
  once at the end.

### T8 – the counsel seat

`'fork-psy'` joins `LifeBeatKind` (`narrative.ts`'s union) – and the type system forces the
registry rows: `LIFE_BEAT_BLOCKING['fork-psy'] = true`, a `DRAIN_ANSWER` row, an `ANSWER_EVENT`
row (a real feed line – drafts). The raise is ONE call at the reserved slot in `lifeBeat.ts`
(the ⚠⚠ comment beside the `'fork-counsel'` raise – same condition, same driver), gated
`world.psychologistHired`; the queue answers in log order and `answerFork` already waits for
every blocking row – zero new plumbing, the comment's own promise. Mirror `'fork-counsel'`'s
option and pricing shape exactly (it is the precedent built one line above); what differs is
his TEXT: he may read `spiritShock` and its kind for the wording register – «a girl under her
line, and a girl under her line because somebody left» is exactly what he exists to tell apart
(`spirit.ts`'s own promise) – **never for weights**. Glyph: 🤍 fallback until the owner picks.

### T9 – the strings (→ the architect's read, the standing delegation)

All drafts, short dash only, no Cyrillic in code or templates, gender-free partner references:

1. The four focus names and the card copy per focus (the spec §2's working names and sentences
   are the base – «Cool head», «She came back sooner than last time», etc.).
2. The seat: hire/fire lines, `PSYCHOLOGIST_LOCKED_DETAIL`, the freeze refusal, rung labels ×3,
   the salary feed row.
3. The consent set: the not-ready card, the 18+ decline in HER voice (strained/cold register by
   construction), the off-season-only refusal.
4. T6's legible variants: per read axis (wants private/open · space/company) × the four voices,
   told-now and told-late where the beat carries both.
5. `'fork-psy'`: prompt registers (shock-aware and plain), option labels, the `ANSWER_EVENT`
   line.
6. The recovery receipt line (T4).

### T10 – the benches

* **`tools/psy-grid.ts` (`bench:psy`) – the 4 focuses × 3 rungs grid**, paired arms per cell
  against the rung below AND against no-seat, every number predicted-vs-measured into the
  spec's new measured section:
  - recovery: wave-4's paired shock arms re-run per rung – weeks-under-the-knee strictly
    monotone in rung, each step > 2×SEM or the rung is re-priced (the masseur §4 law);
  - coolhead: growth vs a training-only control > 2×SEM per rung; zero at the ceiling proven;
  - listen: matched-reaction share monotone, the realised clarity inside CI of 0.60/0.80/0.95;
    bond byte-identity re-proven on the same runs;
  - herself: beyond-baseline movement REQUIRES the focus – the caring no-focus arm shows zero
    beyond-baseline flips (the anti-«hugged into an extravert» dam, a hard invariant, not a
    corridor); flip medians monotone in rung.
* **The never-fired corridor PRINTED**: per focus, the share of paid weeks with nothing to do
  (recovery with no shock is most of it, by construction) – the academy-fares watch
  (round 23 #16) in its new coat.
* **Census v3** (`bench:life-arrival` grows): walls-raised / walls-lowered / round-trip shares
  under a caring arm and a grinding arm; the end-of-career EXPRESSED distribution printed
  beside the constant birth one; **the ±1.5 pp fairness corridor re-read on BIRTH cohorts**
  (the census identity is birth – the fence).
* Instrument laws stand: no try/catch, per-temperament actuation, `–` never `0.0%`, two exit
  codes.

### T11 – e2e, the frozen careers, the gate

One e2e mechanic case (his 29.08 rule): a pro-unlocked fixture career → hire (default rung) →
the focus pick → the weekly salary row in the feed → the staff card shows him; the college
suspend if it fits the same walk cheaply. Fixtures regenerate at v76. Frozen careers by the
per-key protocol: the NEW keys peel at `PRE_V76`; the leanings' deterministic drift in
re-walked fixtures is the wave's own expected diff, stamped with its record; if a long
fixture's bond bands arm a flip, the draw is on the new sub-stream – **`rngMain` byte-identical
is the STOP condition, every time**; diff FIRST, control = the change neutralised in place,
then re-stamp. Then the wave gate – wave-3 §6 verbatim (check/sim/e2e/capture from files with
mtimes newer than the run, parity 375/768/900/1280, mutation arms recorded, fixture freshness
vs head, the build line) – and the handoff package: strings tables, bench records, the ledger
entries in the builder's own voice. The final gate is the architect's, on the returned branch,
after the agents are quiet.

## 3. The streams of this wave

| stream | drawn for | keyed on |
| --- | --- | --- |
| `seed:psy:listen:<kind>:<week>` | did the parent read her plainly, this beat | the beat kind and the week – ⚠ kind is IN the key, so two read-bearing beats in one week can never share a value (§1f's one-value-per-key law) |
| `seed:life:walls:<axis>:<week>` | does the armed axis flip, this week | the axis (`open` / `reg`) and the week |

Nothing else draws. T4's slope, T5's walk and T7's leaning pass are pure arithmetic; zero draws
while ineligible is proven with the count-keys net (wave-4 §0.1), per stream. Both keys are
(seed, calendar), never a choice; MAIN is untouched and the capture (41550 / `e6b0c709`) must
not move.

## 4. The constants (home: `ECONOMY.psychologist`, one block beside `ECONOMY.masseur`)

**Ruled by the spec §2 – quote the source at each constant:**
`recoverySlope [2, 3, 4]` · `coolheadPerSeason [1.5, 2.5, 3.5]` (O5: numbers stand as
bench-first proposals inside a ruled shape) · `listenClarity [0.60, 0.80, 0.95]` ·
the beyond-baseline hazard scale `[1, 1.5, 2]`.

**Proposals – NONE ruled, all bench-priced predicted-first, his word after:**
salaries `[10000, 20000, 40000]` cents/week ($100 / $200 / $400 – below the masseur's entry ·
the default · the high coach's neighbourhood) · `wallsRisePerWeek 1.5` ·
`wallsRepairPerWeek 1.0` · `wallsGrowthPerWeek 0.5` · retention slow-down ×0.75 (rung ≥ 2) ·
`'herself'` repair acceleration ×1.5 · `flipArm 60` · `flipRelease 40` ·
`flipHazardPerWeek 0.05`.

## 5. The string gate (invariant 4)

Every player-facing word in T9's list is a DRAFT: the builder writes against the bibles, the
architect's вычитка is the delivery gate, the owner's playtest is final (the 10.09 rule). No
existing string moves – a fix that seems to need one is a question to the architect, not an
edit.

## 6. The final gate

Wave-3 brief §6 verbatim, plus this wave's own: the T1 zero-diff pin green at head; the 4×3
grid's bars met or the miss printed and carried to the owner; the never-fired corridor printed;
census v3's walls prints and the fairness re-read attached; `staffResultShareBps` and
`staffSeatFareCents` provably untouched (O3/О4 – a grep is the proof). The sentence «ветка
готова» follows the assembled PR body and nothing else.

## 7. Decided on entry / still open

**Ruled 13.09** (the owner's «окей» to the architect's nine-point list – decisions.md entry of
the day): O1 focus changes at the season boundary only · O2 every focus at every rung · O3 no
results share · O4 remote in v1 · O5 cool-head numbers bench-first · O6 a retained rung ≥ 2
slows the walls' rise, priced at the census · O7 «The public life» ships with the spotlight
wave, NOT here · the walls ride this wave's schema move · the rung prices are proposals.

**Standing rulings that bind here**: the pro-career unlock (travelling-team §2's ruled table) ·
1 session a week at every rung – the rung buys WHO comes to the call · repair free / growth is
work / identity immutable (§2a, 09.09) · the joint choice from 18 and the not-ready card
(09.09) · «listen» coaches the parent and never reports her sessions (09.09).

**Still open, to the owner, in the handoff**: every §4 proposal number (after the benches) ·
every T9 string (his playtest final) · the `'fork-psy'` glyph pick (🤍 stands until his word).

## 8. What wave 5 must NOT do

No fifth focus (the spotlight wave owns «The public life» – O7); no burnout/breaking-point and
no on-court conduct (named later beats, their own specs); no travel and no fare for the seat
(ruling Б); no results share (O3); no bond write from anything of his – the listen focus's
byte-identity pin is the fence; no spirit write outside T4's slope inside `accrueSpirit`; no
walls surface, no leaning on any screen, no flip announcement; no temperament rewrite ever –
identity is immutable; no paywall on repair – the free road is benched with the seat empty; no
`ECONOMY.bond` retune (планка-3's session owns it); no wording change outside T9's draft set
plus ruling H's card strings. And for T12: **no new coach lever** – the profile is words over
axes that already exist; the skill-lean idea stays out of v1 by the ruling's own text.

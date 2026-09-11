---
type: plan
status: draft
area: life
canonical: false
last-reviewed: 2026-09-09
---

# The private life – the build plan for steps 1–4

The design is [the-private-life.md](the-private-life.md) and this file never contradicts it – it
puts numbers, seams, schema moves and benches under its steps. The owner asked for exactly that:
«более подробно, мы их потом поревьюим». The backlog row it details is
[the-private-life-layer.md](../backlog/the-private-life-layer.md) #1.

**Boundary:** steps 1–4 are detailed to implementation grade because the design plan draws the
complete-feature line under step 4 («steps 1-4 are a complete feature on their own»). Steps 5–8 are
sized sketches at the end. ⚠ Stop after any step remains the law.

Two absorbed sources, used and named so nobody re-derives them:
[P2-pillar3-morale-relationship.md](../review/proposals/P2-pillar3-morale-relationship.md) supplies
the two-variable physics and half the delta table (the design plan's backlog row 3 says P2's
substance lives in step 1); [form-and-slump.md](../specs/form-and-slump.md) supplies the scale
yardstick and the boundary this layer must not cross (results-driven form is PARKED by the owner's
own word – «форму и спад тоже давай распишем спеком, но уже на потом»).

⚠⚠ **RE-BASED 09.09 AGAINST v71 CODE AND THE FULLY RULED
[who-she-is-2026-09](../specs/who-she-is-2026-09.md)** – the third absorbed source, and the one
that changes constants below. What moved since 23.08, so nobody builds against the old snapshot:

* **Schema numbers**: written at v59; `SAVE_SCHEMA_VERSION` is **71** on 09.09, so the waves take
  **v72–v75** (renumbered below). The standing rule still binds – whoever lands second takes the
  next number; re-count at land.
* **The tick moved**: `tickWeek` is a seven-phase dispatcher (`world.ts:1660`); `accrueCondition`
  lives in `world/phaseHerWeek.ts` inside `resolveBodyAndPlanner` (:219 on 09.09), and its
  arity-2 signature is TEST-PINNED – `accrueSpirit` is therefore its own call immediately after
  it, never a new parameter.
* **`answerFork` lives in `world/endings.ts` (:504)**, not college.ts; the fork's hold field is
  `departsWeek`. `StopReason` is a union in `src/shared/protocol/events.ts` (:478–597) with
  `STOP_PRECEDENCE` at :605 – the new `'life'` member joins BOTH.
* **The seam**: `kidMatchPlayerFor` at `world/player.ts:169`, the condition factor at :230
  multiplying the wings at :249–253; `spirit` joins the narrow arg type as the EIGHTH optional
  field, absent ⇒ 1.0 – the file's own documented extension pattern.
* **`portraitStageFor` is `portraitStage`**, and the 31+ stage's type name is `lateCareer`.
* **Temperament folded in** (who-she-is, every ruling 09.09): wave 1 carries `world.temperament`
  (drawn on `seed:temperament`; the migration DERIVES it from the career's own seed – zero
  draws, bit-stable), per-intensity spirit physics, the five-word Mood ladder (sharing
  condition's «Steady», priority: injury first, then the larger deviation), the portrait-emotion
  input, the four voice bibles and tier-0 quoted lines. Waves 3–4 carry the per-temperament
  hazard multipliers, openness feed-lag and wants weights, the bond-gated delivery channel,
  tier-1 small talk (bond delta 0 – ruled V2) and the feed life-row emoji (his glyphs). The
  fork-opinion draw gains `spirit`/`bond` inputs. Benches grow per-temperament arms, the census
  (who-she-is §4's bars, drift prints included) and the **±1.5 pp fairness corridor**.
* **Gates grew since 23.08**: every wave's gate also carries the responsive parity harness
  (375/768/900/1280, round 36), the prologue's radio conventions where a dialog SELECTS
  (round 40), **one e2e case per shipped mechanic** (his 29.08 rule), and the voice completeness
  pin (who-she-is §5b.3).
* **Ruled names and starts**: `bond` stays `bond` (09.09, beside the offers' `kit-bond-*`
  strings); the start is uniform 70/70 – the prologue does not load it (ruling V4).
* ⚠ **Source of truth for constants**: values here are quoted from who-she-is §4 – THAT table
  wins on any drift between the two documents (the single-source rule, 09.09).

---

## 1. The two numbers, exactly

### 1a. Names

* **`spirit`** – the weather number (design §2's «weekly spirit (name it later)» – the name
  proposed here is `spirit`). NOT `morale`: «мораль» is the owner's word for the whole layer and
  P2's word for its absorbed proposal; giving it to one half of the split invites exactly the
  confusion §4a.2 warns about. Runner-up considered: `mood` (too small a word for a bereavement).
* **`bond`** – the parent's standing (design §4a.2's number with a memory – «отношения можно
  укрепить или разрушить»). P2's name, kept. Runner-up: `standing`, `trust`.

Neither is ever shown as a number on any surface – the fog rule (`coachRoomNote`'s house style, and
P2's parent-as-observer argument against a trust gauge).

### 1b. `spirit` – range, start, weekly rule

* Range **0..100** in tenths (0.1 – ruled 09.09; the intensity multipliers produce fractions,
  and every write rounds to the nearest tenth). Start **70** = `ECONOMY.spirit.baseline`.
* **Effective baseline** = `baseline` (70) **+ 5** while the attachment slot is full
  (`attachmentLift: 5`, step 3) – §3a's «lifts a little and stays lifted» is a baseline shift, not
  a one-off bump, so the lift arrives over ~2 weeks and holds.
* **Weekly update** (`accrueSpirit(world)`, in a new leaf `src/engine/spirit.ts` beside
  `condition.ts`; ⚠ re-based 09.09: called from `resolveBodyAndPlanner` in
  `world/phaseHerWeek.ts`, immediately AFTER the `accrueCondition` call (:219) – its own call,
  never a parameter, because accrueCondition's arity-2 is test-pinned; pure arithmetic,
  **zero draws on any stream**):
  1. step toward the effective baseline by **min(returnPerWeekFor(temperament), |gap|)** –
     **5/week steady, 3/week intense** (who-she-is §4; the flat 4 of the 23.08 draft is
     superseded) – ⚠⚠ **RETURN RUNS FIRST, off LAST week's value (order ruled 09.09)**: in the
     drafted perturb-then-return order a steady girl's vacation (+4) met the same-tick return of
     4 and vanished, and with it most ordinary weather and most of the Mood ladder's words;
  2. apply THIS week's perturbations (table below) **× the intensity scale – ×0.8 steady /
     ×1.25 intense** (who-she-is §4), clamp 0..100, **round to the nearest tenth** (spirit is
     stored in tenths – the multipliers produce fractions and the rounding is named). One rule
     for the lift, the break-up recovery and every drift – no second curve to tune.

**Step-1 perturbation table** – existing world facts only, no life events yet (that is step 1's
definition). ⚠ Deliberately absent: match results (that is form's channel, parked), training load
(condition's channel), anything of the cohort's.

| existing fact (where it is read) | spirit |
| --- | --- |
| injury onset (`world.injury.sinceWeek === week`) | −8 |
| each further laid-up week | −1 |
| a knock pushed through, per governed week (`knockGoverns`) | −2 |
| vacation week resolved (`resolveVacation`) | +5 |
| her birthday week (`birthdayTurning` non-null) | +2 |
| exam week with `plan.train ≥ 85` (`isExamWeek`) | −2 |
| season wraps with zero vacations booked (season boundary block) | −3 |
| off-season/blackout week (`isBlackoutWeek`) | +1 |

Equilibrium check (per intensity since 09.09): perturbations stay small against the return rate
in BOTH arms, so a career hovers at 70 ± a few points and only step 4's shock (−22 steady /
−34 intense) produces a multi-week excursion. That is the step-1 «neither drifting to an
extreme» row, made checkable (§1f) – the bench runs it per-temperament, and the ±1.5 pp fairness
corridor (who-she-is §4) is read off the same arms.

### 1c. `spirit`'s ONE reader – the exact seam

`condition` reaches the match through one line of `kidMatchPlayerFor` (src/engine/world/player.ts
:169; re-based 09.09): `const factor = conditionMatchFactor(world.condition)` at :230, then the
five wings multiply by `factor` at :249–253. `spirit` takes the identical seam, as the EIGHTH
optional field of the narrow arg type – the file's own documented extension pattern:

```ts
// engine/spirit.ts – same curve family as conditionMatchFactor
export function spiritMatchFactor(spirit: number): number {
  if (spirit >= 60) return 1                    // knee
  return 0.90 + (1 - 0.90) * (spirit / 60)      // floor 0.90 at 0
}
```

and in `kidMatchPlayerFor` the wings become `raw.serve * factor * spiritF` etc. – a SECOND
multiplicative factor beside condition's, zero RNG, applied exactly once per match because every
path that puts her on court already builds her here (the file's own contract). `spirit` joins the
narrow arg type as **optional**: absent ⇒ 1.0, so every pure caller and every stored `WorldMatch`
replay is byte-identical, the same trick `kit`, `skills` and `coachId` already use.

* **Scale, against the measured yardstick** (form-and-slump §1: condition factor 0.9357 ↔ 2.7–9.9
  pp of match-win probability, tools/winrate-read.ts): post-break-up spirit 47 → factor 0.978 →
  **~0.9–3.4 pp per match**. Fatigue's worst is bigger by construction (floor 0.55 vs 0.90) – the
  design's «smaller than fatigue» bound holds at every point of the curve.
* **No bonus above the knee** – baseline 70 and lifted 75 both read 1.0, exactly as condition ≥ 70
  does. The 3a lift's mechanical value is DISTANCE FROM THE KNEE (a lifted girl falls to 47, not
  42, and is back sooner). Symmetric upside is form's property, not spirit's; see open question 6.
* **The kid only.** Rivals do not read spirit (their private lives do not exist; the cohort
  question is form spec §4.4's, deferred with it).

### 1d. `bond` – range, start, weekly rule, the memory

* Range **0..100** in steps of 0.5. Start **70**.
* Moves **only on parent decisions** – never on scorelines, never on weather (§4a.2: the first is
  weather; the second is the relationship, «and it accumulates»).

| parent decision (where it lands) | bond |
| --- | --- |
| knock: rest her (`decideKnock`) | +1 |
| knock: push / push on a repeated part | −3 / −5 |
| entering her under a `'warn'` medical clearance (played hurt) | −4 |
| birthday: the time-together ids only – `day` / `familyweek` / `trip` (`chooseGift`) | +2 / +3 / +4 |
| birthday: a material gift she did NOT ask for | 0 |
| birthday: ⭐ the material gift she ASKED for, granted (`asked` = `given`) | +2..+3 (proposal – bench) |
| birthday: she asked and was refused (`given` null, or another thing) | −1..−2 (proposal – bench) |
| a vacation that resolves | +1 |
| season wrapped with zero vacations booked | −3 |
| step 2+: a reaction option | −4..+3 (per beat) |
| step 3+: a tier-1 small-talk reply (who-she-is §5b, ruling V2) | 0 – texture, never economy |

The birthday row is the seam `birthday.ts` explicitly left waiting – the owner on the day/week
pair: «когда будем мораль делать может быть надо будет учитывать оба».

⭐ **AND HE CORRECTED THE «материальные 0» RULE, 23.08.** The draft had every material gift at 0,
to preserve the module's ruling 2 (a gift that moves a number is a purchase). His word, verbatim:

> «а как же с теми, которых она сама просила? мне кажется там вполне может двигаться в
> положительную сторону мораль»

So the zero survives only for UNPROMPTED material purchases. **An asked-for gift granted is a
heard request, and a heard request moves the relationship** – which is not a purchase, and ruling
2 survives intact for the reason the birthday spec already built: the ask is drawn on
`seed:birthday:<age>` – (seed, calendar), never a choice – so a player cannot manufacture the ask
and buy the bond; he can only ANSWER it. The mechanic costs nothing new:
[birthday-and-gifts.md](../specs/birthday-and-gifts.md) §2ab already records the three-way outcome
per birthday (`asked` = `given` match / they differ / `given` null), so the three bond rows above
read a record that exists. Proposed deltas – **+2..+3 for the asked-for gift granted, −1..−2 for
the refusal** (null harsher than a different real present) – are for the bench, not rulings; the
step-1 bench corridor absorbs them. ⚠ The build commit must amend BOTH homes in the same move:
ruling 2's comment in `birthday.ts` and the birthday spec's «records and does not consume» §2b –
this table is the consumer it was waiting for.

* **The memory property:** deltas land immediately and then regress toward 70 at **0.5/week** –
  nothing else moves it. A −25 season heals in ~50 weeks, which is §4a.3's recoverability («one bad
  click at fifteen» must not ruin a ten-season career) without making decisions weightless inside a
  season. Steady states, computed from the tables: a push-everything grind hovers ~55–60; a caring
  career ~72–78; the gap ≥ 12 points is the step-1 bench corridor.

### 1e. `bond`'s ONE reader at step 1

The diary. `DiaryFacts` gains `bondBand` (`close ≥ 80 / steady 55..79 / strained 35..54 / cold
< 35`), `WeekClaims` gains `strainedBond` / `closeBond` licences, 4–6 lines, honesty-pinned like
every licence. No meter, no tile, no snapshot number. ⚠ And no diary line for `spirit` at step 1 –
its one reader is the match engine; a second reader is step 3's business. (The P2 idea of
re-pointing KidScreen's Confidence tile is NOT taken here – later surface, owner's call.)

### 1f. RNG law for the whole of steps 1–4

* **Step 1 takes zero draws anywhere** – both weekly rules are pure arithmetic, the strongest
  possible answer to invariant 2. The frozen capture (41550 / `e6b0c709`) is untouched through all
  four steps; a step that legitimately changes match OUTCOMES (the factor) changes no draw
  sequence, the same category as kit and the coach's edge.
* Steps 2–4 randomness lives on **purpose-scoped sub-streams, named now**:

| stream | drawn for | keyed on |
| --- | --- | --- |
| `seed:life:arrival:<week>` | does someone exist, this week (3a hazard) | the week – reload-proof, choice-proof |
| `seed:life:partner:<sinceWeek>:lag` | the feed lag alone – ⚠ SPLIT 09.09: one value per key, so a later added read can never shift a neighbour | the arrival week |
| `seed:life:partner:<sinceWeek>:wants` | her `wants` read | the arrival week |
| `seed:life:ends:<week>` | does it end this week (3b hazard) | the week |
| `seed:life:ends:<week>:react` | the space/company read at the ending | the week |
| `seed:life:fork:<seasonIndex>` | her stated want at the college fork (step 2's beat) | the season |
| `seed:life:copy:<week>` | copy selection at snapshot time only | the week |
| `seed:temperament` | who she is – the two axis picks at world creation; the migration derives with the SAME formula, so old careers turn out to have always been her (09.09) | the seed alone |
| `seed:hervoice:<kind>:<week>` | tier-0/1 line and moment picks (who-she-is §5b) – keyed per kind, so a new kind never shifts an old pick (09.09) | the kind and the week |
| `seed:life:smalltalk:<week>` | does she come with something small this week (tier 1) | the week |

All re-derived at the call site, nothing persisted, MAIN never touched – `seed:birthday:<age>`'s
exact shape, including the immutability argument: every key is (seed, calendar), never a choice.

---

## 2. Step 1 – the two numbers (wave 1)

**Schema move (v72, re-based 09.09):** `world.spirit: number` + `world.bond: number` beside
`condition`, **plus `world.temperament`**; bump `SAVE_SCHEMA_VERSION` 71 → 72; append-only
migration back-fills `{ spirit: 70, bond: 70 }` (uniform start – ruling V4, the prologue does not
load it) and DERIVES `temperament` from the career's own seed with createWorld's exact formula –
zero draws, bit-stable, old careers turn out to have always been her. Golden fixture
`tests/fixtures/saves/v72.json`. Migrated saves play byte-identical matches until something moves
(70 is above the knee ⇒ factor 1.0). ⚠ Version-number coordination is the standing rule: whoever
lands second takes the next number.

**Wiring points:** `createWorld` init (temperament draw included); `accrueSpirit` call after the
`accrueCondition` call in `resolveBodyAndPlanner` (world/phaseHerWeek.ts:219); bond deltas inside
`decideKnock`, `chooseGift`, the played-hurt arm where `clearance` is in hand, `resolveVacation`,
and the season boundary block; the factor in `kidMatchPlayerFor`; diary bands. **Plus the voice's
ground (who-she-is, all ruled):** `spirit` joins the engine-side emotion decision
(`assembleDiaryFacts` → `avatarEmotion`); the Mood word ladder gains the five spirit words
(sharing condition's «Steady»; priority – injury first, then the larger deviation of body vs
mood); the FOUR VOICE BIBLES land as docs and tier-0 quoted lines enter the week-note pools in
all four voices (flat pool for strained/cold); the birthday ask re-weights mildly by temperament
(~1.5× toward her register, the draw and record untouched).

**Tests:** delta table unit tests; clamp/equilibrium per intensity; `spiritMatchFactor` exactly 1
on [60,100]; seam test – `kidMatchPlayerFor` with spirit absent or ≥ 60 deep-equals the pre-slice
player; B1 capture pin untouched; migration idempotency + fixture (temperament derivation pinned
against the createWorld formula); diary licence sweep (new lines unselectable outside their
bands); **the voice completeness pin** – beatKind × temperament × register with no silent
fallback (the flat pool is the one legal shared fallback, only at strained/cold); **every
perturbation row asserted FROM BASELINE per intensity arm** – the next week shows the full
scaled delta (the order fix's own pin); **the Mood-word occupancy bar** read off the bench –
each of the five words in ≥ 2% of weeks under normal play.

**Bench (the «done when» row made measurable):** `tools/spirit-bench.ts` (`bench:spirit`), 32
seeds × 4 seasons, arms {care: rest knocks + vacations + light exams} × {grind: push knocks + zero
vacations + heavy exams}, balanced entries in both. Pass bars:

* spirit MOVES: per-career sd over weeks ≥ 2 points in both arms;
* no extreme drift: weeks at spirit < 20 or > 95 under 2%; long-run mean 70 ± 4 – **held per
  temperament arm** (09.09: the grid runs 2 policies × 4 temperaments);
* bond separates: grind vs care gap **≥ 12 points at season 3, and > 2×SEM** (means ± SEM printed);
* neither arm's bond median at a clamp (0 or 100);
* **the fairness corridor (who-she-is §4): paired lifetime match-win deltas across temperaments
  inside ±1.5 pp** – breached means the support-responsiveness compensator conversation, never a
  silent stat rebate.

**Collision surface:** `src/engine/world/phaseHerWeek.ts`, new `src/engine/spirit.ts`,
`src/engine/world/player.ts`, `src/engine/economy.ts`, `src/engine/migrations.ts`,
`src/engine/world/state.ts`, `src/engine/world/birthday.ts`, `src/engine/diary.ts` + `diary/*`,
`src/shared/avatarEmotion.ts`, `src/shared/protocol/narrative.ts` (DiaryFacts),
`src/components/screens/KidScreen.vue`, `src/components/WeekRecapCard.vue` (the Mood word),
`tests/*`, `tools/spirit-bench.ts`, `package.json`. One agent – even more shared hubs than the
23.08 draft counted; do not split.

---

## 3. Step 2 – one reaction surface (wave 2)

The built precedent is the birthday (`world/birthday.ts` + round 24's college-pause work). What
GENERALISES into a new leaf `src/engine/world/lifeBeat.ts`, and what stays birthday's own:

| generalises (step 2 builds it once) | stays birthday-specific |
| --- | --- |
| the BLOCK contract: a new `StopReason` `'life'`, guard at the top of `advanceWeeks` + collected inside the loop (a beat can share a week with a tournament) | the unconditional annual firing («я бы оставил попап на ДР всегда») – life beats are hazard-drawn |
| `guardNotEndedForGood` – a beat about the family's own calendar answers inside the college latch | the age-banded catalogue and the ask drawn from the four offered |
| the record row IS the answered flag – `world.lifeLog` rows with `answer: null` = pending, no second boolean to desync (birthday's trick, inverted: the row exists first) | `world.birthdays` and `pendingBirthday`'s absent-row derivation |
| engine-side re-validation of the option id (a stale dialog cannot record an unoffered answer) | the never-spent day, the durable/repeatable copy swap |
| the no-cents rule: an answer is NEVER a purchase – `addEvent` without `amountCents`, no price in the words | – |
| the dialog shape: N buttons, all of them answers, no X (walking away must not silently become an answer) + copy assembled engine-side (`buildLifeBeatPrompt`) | – |
| the round-20 popup law: a mounted 375x667 assertion that the LAST button's box is on screen, mutation-verified | – |

**Schema move (v73, re-based 09.09):** `world.lifeLog: LifeBeatRecord[]` –
`{ week, kind: 'fork-opinion' (grows per step), detail: string, answer: string | null }`.
Append-only, never pruned (a handful of rows per career – `birthdays`' own argument). Fixture
`v73.json`.

**The proving beat – her opinion in the fork gap.** The design plan names it itself: D2's
ask–hold–depart split is live, and «the fork gap is its readiest beat»; the paused E1 surface
(«да, пока на паузе» – until steps 1–2 exist) is unpaused BY this wave, machinery landing first
inside it. Mechanics:

* trigger: the tick that opens the college fork also writes a `'fork-opinion'` row; her stated
  want (`college` / `tour` / `stop`) drawn on `seed:life:fork:<seasonIndex>`, weighted by her
  standing on the ladder **and – ruled 09.09 – by `spirit` and `bond`** (a worn-down girl leans
  `stop`, a close one dares more; deterministic inputs + the stream, nothing of the player's,
  and temperament itself stays OUT of the want – it colours only the wording, who-she-is §3's
  fence);
* order forced mechanically, not by the UI: the `'life'` guard sits ABOVE the fork guard in
  `advanceWeeks`, and `answerFork` refuses while her row is unanswered – he hears her out first
  (invariant 1: the engine is the gate);
* his reaction options (SHAPE – responses, never her choices): back her want / press the other way
  / listen and say nothing. Bond +2 / −2 / 0;
* the second delta lands where the decision does: `answerFork` matching her recorded want +3,
  contradicting it −4. A parent can disagree out loud and then do as she asked – the two deltas
  are separate on purpose.

**The collision contract (09.09 – the second review's ask, made explicit):**

* `STOP_PRECEDENCE`: `'life'` slots after `'birthday'` and before `'fork'` – a knock and a
  birthday still outrank a life beat inside one week, and the fork-gap ordering (`'life'` above
  `'fork'` in `advanceWeeks`) is this wave's own mechanic;
* several life beats in one week QUEUE in lifeLog order – one dialog at a time, none lost
  (`answer: null` rows ARE the queue, the machinery's own trick);
* the face and the Mood word under collision: injury first, then **a live `spiritShock` outranks
  result joy** – a title won in the week it ended shows a girl who won hollow, which is the
  scene, not a bug – then the larger deviation of body vs mood (wave 1's rule);
* a life beat sharing a week with a tournament is already the BLOCK contract's covered case
  (collected inside the loop) – nothing new;
* ⚠⚠ **THE COLLEGE-FREEZE OVERLAY HOLE – waves 3–4's to close (found 09.09 while building wave
  2):** `blockingOverlay` white-lists only the BIRTHDAY through the college freeze, so a life
  beat raised INSIDE the freeze would be swallowed behind the freeze's own overlay – a stopped
  week with no card to answer it. Harmless in wave 2 (the fork-opinion fires at the fork's
  opening, outside the freeze), but the arrival (wave 3) and ending (wave 4) hazards run through
  college years by design, so those waves must widen the overlay's exception on the birthday's
  own precedent AND pin it with a mounted test before their first beat can fire behind the
  freeze.

**Bench / gate:** the «reverting the reaction changes the number, measured» row is deterministic –
same seed, answer A vs answer B, bond differs by exactly the table (an equality test, no SEM);
B1 capture byte-identical; fixture + migration tests; the 375x667 mounted test proven by mutation.

**Collision surface (re-based 09.09):** new `src/engine/world/lifeBeat.ts`, `src/engine/world.ts`
(guards, command), `src/engine/world/endings.ts` (fork congruence – `answerFork` lives THERE, not
college.ts), `src/shared/protocol/events.ts` (`StopReason` union :478–597 AND `STOP_PRECEDENCE`
:605 – the `'life'` member joins both), `src/shared/protocol/messages.ts` (prompt wire),
`src/worker/sim.worker.ts`, `src/worker/client.ts`, `src/stores/game.ts`, new
`src/components/LifeBeatDialog.vue` (its prompts written against the four voice bibles; its
selecting controls follow round 40's radio conventions), `App.vue`, `tests/component/*`,
`src/engine/migrations.ts`. The engine half and the Vue half can be two agents; the protocol
modules are the shared files – land the wire first.

---

## 4. Step 3 – someone exists (wave 3)

**Trigger conditions:**

* age gate: nothing fires before `kidAgeExact ≥ 16` – ⭐ RULED 23.08, 16 confirmed (question 5,
  closed);
* hazard while the slot is empty and the cooldown is clear: **1.0%/week before 18, 2.5%/week from
  18, × the temperament multiplier** (who-she-is §4, ruled: sunny ×1.2 · fiery ×1.6 · quiet ×0.6
  · deep ×0.5), one uniform on `seed:life:arrival:<week>` per eligible week – so the first-love
  medians SPLIT by who she is (quiet ≥ 17.5, fiery ≤ 17, the census bars);
* cooldown after an `endedWeek`, per temperament: **12 fiery / 26 sunny / 39 quiet / 52 deep**
  weeks.

**Schema move (v74, re-cut 09.09 to EPISODES – the review's find #5):**
`world.loveEpisodes: LoveEpisode[]` –
`{ id, sinceWeek, endedWeek: number | null, knownWeek: number | null, wants: 'private' | 'open', partnerId }`,
append-only; **the ACTIVE attachment is DERIVED** – the last row with `endedWeek === null` – so a
romance that begins AND ends before the parent knew survives save/reload intact and surfaces
later as one honest late row (the drafted single slot was nulled at the break-up and lost exactly
that scene). The episode list is also step 6's courtship history and the album's love list,
bought early for free. `partnerId` = `p:<sinceWeek>` – an identity, **no name and no gender
persisted** (⚠ deliberate: the schema must not hardwire boyfriend→husband; who the partner is
arrives with step 6's naming pass and the owner's word, and «no romance at all» / «never
latches» remain first-class hazard outcomes, not failures). Her `wants` draw is weighted by
openness – ~70% toward her own register (who-she-is §4). Fixture `v74.json`.

**Feed-first, possibly late (§0.1; lag re-cut 09.09 by openness):** at `sinceWeek` the TRUTH
moves – the slot fills, the spirit baseline lifts +5 – and the parent is told nothing. The feed
lag is drawn once on `seed:life:partner:<sinceWeek>`, **by openness: open – 0 with p 0.45, else
uniform 1..5; private – 0 with p 0.10, else uniform 2..12** – and the bond band SHAVES a private
girl's lag toward the open distribution (who-she-is §2a channel 1: she trusts THIS parent). The
DELIVERY follows §5b's channel rule: at `close` bond the news arrives as her own dialog, at
`steady` a mention, at `strained`/`cold` the feed alone – late, flat, or never in her voice. An
attentive player can still see her playing a shade lighter before anything says why – the fog is
honest. At `knownWeek`: a kept feed row plus the reaction beat (step 2's machinery,
`kind: 'met'`), which pauses the week.

**Also in this wave (ruled 09.09, who-she-is §5a–§5b):** tier-1 small talk – she comes with
something small, 2–3 replies, **bond delta 0** (ruling V2), frequency by bond band (a few per
season at `close`, none at `cold` – the silence is the line), hazard on
`seed:life:smalltalk:<week>`, capped from `lifeLog` counts; and the feed's life-row emoji – one
Unicode glyph per row kind, HIS picks, the proposed set delivered as drafts with this wave.

**Reaction options' shape** (his responses – her choice was never on a menu): warm («tell her you
are glad») / wary («ask the coach to keep an eye on the schedule») / intrusive («ask to meet him,
now») / silent. Bond +2 / 0 / −3 / −1, with the `wants` read flipping warm-vs-silent: a girl whose
drawn `wants` is `'private'` reads +2 on silent and −1 on warm – the read is in the feed line's
wording, never marked, the birthday-ask scene generalised. ⚠ Nothing else moves: no spirit delta
from his words (weather is hers; his words are the relationship – §4a.2's split, kept mechanical).
Fallback if the owner wants 3a truly minimal: ship feed + record + lift only, dialog deferred to
step 4 – open question 7.

**Bench (re-cut 09.09 into the census):** 200 careers PER TEMPERAMENT on `tools/life-arrival.ts`
(`bench:life-arrival`), who-she-is §4's bars verbatim: romance-count medians separate (fiery ≥ 4,
sunny 2–3, deep ≤ 3, quiet ≤ 2 before the latch); first-arrival medians (quiet ≥ 17.5, fiery
≤ 17); «first or second love reaches the latch» share (quiet ≥ 50%, fiery ≤ 20% – readable once
step 6 exists, printed as the carried-into-year-two proxy until then); late share by openness
(private ≥ 60%, open ≤ 25%); input-independence arm – a no-action and an action-laden run under
the same seed report identical `sinceWeek`s; MAIN capture untouched.

**Collision surface:** `src/engine/world/lifeBeat.ts` (grows), `src/engine/world.ts` (tick hazard),
`src/engine/spirit.ts` (baseline read), `src/engine/world/ledger.ts` callers, `src/shared/protocol.ts`,
`src/engine/migrations.ts`, `src/engine/diary.ts` (her-life lines arrive HERE, spirit's second
reader), `tools/life-arrival.ts`. One agent.

---

## 5. Step 4 – it ends (wave 4)

**Trigger:** while the slot is full, **1.2%/week × the temperament multiplier** (who-she-is §4:
sunny ×0.6 · fiery ×1.5 · quiet ×0.35 · deep ×0.9) on `seed:life:ends:<week>` – so duration
medians split (quiet ~3 seasons, fiery ~0.7; the several-or-one trajectories of his 23.08 ruling
now have CAUSES). Active from `sinceWeek`, not `knownWeek`: it can end before he ever knew, and
the whole episode then surfaces as one late row – §0's strongest scene, free of charge.

**The shock and the recovery curve – the numbers a bench can check:**

* at `endedWeek`: spirit **−22 steady / −34 intense** (who-she-is §4; the 23.08 flat −28 is
  superseded), the lift removed (effective baseline back to 70), **the episode's `endedWeek`
  written – the row STAYS, nothing is nulled** (the active slot is derived; 09.09),
  `world.spiritShock = { week, kind: 'breakup' }` set, lifeLog `'ended'` row written;
* recovery is the standing weekly rule, nothing special-cased: the per-intensity return (5/3)
  toward baseline. From a lifted 75: **steady ~1–2 weeks under the knee, back ~week 5; intense
  ~6–7 under, back ~week 12** – the break-up finally HITS differently by who she is, which is
  the personalities made visible in results; factor bottoms per §1c's curve;
* `spiritShock` clears when spirit ≥ baseline − 2. It exists ONLY so step 5's psychologist has a
  clean thing to read («is a recovery running») – he will add +3/week during one, 4 weeks under
  the knee becoming 2: legible with no number quoted, which is his whole hiring case;
* first cost the parent cannot buy off: no booking, no retainer, no gift touches the curve in this
  step – deliberately.

**Reaction beat** at the week he learns it ended (`kind: 'ended'`): space / company / fix-it /
blame. The space-vs-company read is drawn on the ends stream and surfaced in the feed line's
wording; match +3, mismatch −3, fix-it −1, blame −4 always (some things are wrong regardless of
what she wanted). Bond only – his words never speed her recovery (that is the psychologist's
lever, and blurring them would make reactions an optimisation puzzle).

**Schema move (v75, re-based 09.09):** `world.spiritShock: { week: number, kind: 'breakup' } | null`
(kinds grow at steps 7–8). Fixture `v75.json`.

**Bench (the «visible in results, not just in a stat» row):** paired arms on `bench:spirit` – 128
seed-pairs, arm A forces the break-up at a fixed week by a tool-side world poke (never by touching
a stream), arm B is the same seed untouched. Bars:

* paired match-win-rate drop over the weeks after the shock **inside [1, 8] pp and > 2×SEM** –
  held PER INTENSITY ARM (09.09): both steady and intense land inside the corridor, at their own
  depths;
* median weeks-to-baseline **5 ± 1 steady / 12 ± 2 intense**; weeks under the knee **1–2 steady /
  6 ± 1 intense** (who-she-is §4's table is the source);
* after recovery completes: paired difference statistically zero (< 1×SEM) – the cost ENDS, it is
  weather, not a scar;
* the ±1.5 pp lifetime fairness corridor re-read on the same arms (who-she-is §4).

**Collision surface:** `src/engine/spirit.ts`, `src/engine/world/lifeBeat.ts`,
`src/engine/world.ts`, `src/shared/protocol.ts`, `src/engine/migrations.ts`, `src/engine/diary.ts`,
`tools/spirit-bench.ts`. One agent.

---

## 6. Steps 5–8 – sized sketches, plus the owner's 23.08 words on them (§6a–6b)

| # | step | size | sketch |
| --- | --- | --- | --- |
| 5 | the psychologist | **M** | ⭐ EXPANDED 23.08 by the owner's word – he is not one hire with one number, he is a LADDER. The full design section is §6a below; the sketch that stood here (remote-only, salaried retainer, +3/week while `spiritShock` is live, the masseur's travel seams if he ever travels) survives inside it as the middle rung's shape. |
| 6 | marriage (3c) | **L** | The slot latches (`attachment.latched`, schema move) – ⭐ and not before 22, his 23.08 gate (§6b); a second adult with an OPINION – a small disagreement surface over schedule and travel through step 2's machinery, and the first outside claim on money (round 23 #18 put her prize share in her own account; the claim reads that seam, it does not invent one). Needs courtship states on the slot and the partner finally needs a name – the fictional-name pass lands here. First-sketch stack: [the-wedding-and-the-children.md](the-wedding-and-the-children.md). |
| 7 | pregnancy (3d) | **L** | The fork that stops the career – the college fork's machinery, months out, a return that is not guaranteed, protected ranking modelled from [life-events-motherhood.md](../research/life-events-motherhood.md). Not before 3a–3c (the design's own order). `spiritShock` gains a kind; the ranking decay while away is the hard half. Sketched further in [the-wedding-and-the-children.md](the-wedding-and-the-children.md). |
| 8 | a death in the family (3e) | **M–L** | Deliberately NOT on the attachment machinery (design §3e). Its own shock kind with an asymmetric, longer curve, it can reach the parent, and it ships behind an off switch – the settings question is open question 1 and must be answered before this is built. Last, carefully. ⭐ AND RULED INTO THE ORDER 23.08 – the funeral itself, gated on the adult rung; see §6b. |

### 6a. ⭐ Step 5 expanded – the psychologist has LEVELS (owner, 23.08)

⚠ **09.09: THIS SECTION IS NOW FED, NOT GOVERNING.** Two rulings landed after it was written –
the 08.09 year-focus («можно будет у психолога делать выбор над чем работать в ближайший год») and
the 09.09 drift re-cut (who-she-is §2a: «работа над собой» is a focus that enables the care-pole
walk) – so step 5 has THREE-plus candidate channels, not one. The reconciliation is
[the-psychologists-year-2026-09](../specs/the-psychologists-year-2026-09.md); build step 5 against
IT, and read this section as the preserved 23.08 record it absorbs. ⚠ Step 5's schema move also
carries **who-she-is §2a's two walls-leanings** (initialised 0 = expression equals nature;
migration back-fills 0) – their one and only schema home, next number at land (the review's find
#4: the leanings had no wave until 09.09).

His word, verbatim:

> «надо еще отдельным слоем добавить психолога туда как раз и его влияние, варианты работы с ним,
> по идее это 1 сессия в неделю но может быть тогда будут разные уровни психологов с разной
> эффективностью, надо подумать этот момент»

So step 5 is a ladder, and the built precedent is the masseur's dial
([the-masseur-2026-08.md](../specs/the-masseur-2026-08.md) §5): rungs, honest prices in the game's
own scale, and **each rung measurably better than the one below or it is decoration** – the exact
flaw his 22.08 masseur amendment fixed (rungs 1–2 had been indistinguishable on any healthy week,
so the $150 step bought nothing a player could read) and that spec's §4 law. Strict monotonicity
gets a pin, as the masseur's condition ladder has.

**The base shape, kept from the sketch.** Remote-only (his ruling recorded in
[the-travelling-team-2026-08.md](the-travelling-team-2026-08.md) §5), a salaried retainer that
persists (schema move), **1 session a week** – his own cadence, at every rung. That cadence is
also why the bill reads as a flat weekly retainer rather than a bookings surface: one session,
every week, priced per rung – the masseur's flat-contract legibility argument, one level up. If he
ever travels, `staffSeatFareCents` / `staffResultShareBps` already answer the seat and the share
questions ([the-masseur-2026-08.md](../specs/the-masseur-2026-08.md) §9); nothing here reopens
them.

**What he reads: `spiritShock`, and nothing else.** Step 4 built the flag for exactly him – «is a
recovery running». His effect lands on the recovery slope while a shock is live, which is his
whole hiring case: the player sees her back sooner than last time and knows why, with no number
quoted (design §4). He does not touch the weekly return rule outside a shock, he does not touch
`bond`, and he does not soften the shock's depth – life hits how it hits; he helps her through it,
he does not pre-numb her.

**What the levels change – the candidate rungs.** ⚠ Every number below is a proposal for the
bench, none is ruled – his own «надо подумать этот момент» is the instruction:

| rung (working name) | price idea, in the game's own scale | while a shock is live | what else the rung might buy |
| --- | --- | --- | --- |
| a counsellor | ~$100/wk – below the masseur's entry $150; a weekly hour, not a specialist | **+2/week** on top of the standing +4 | – |
| a sport psychologist | ~$200/wk – between the masseur's entry and default rungs | **+3/week** (the sketch's number) | – |
| a tour-grade specialist | ~$400/wk – the high coach's neighbourhood, below elite | **+4/week** | ⭐ the wants read – see below |

⚠ **The honest arithmetic problem the bench must settle before any ruling: the slope axis blurs at
the top.** From the step-4 shock (47 after a lifted 75), weeks under the knee read ~3 / 2 / 2
across +2/+3/+4 – the top two rungs are near-indistinguishable on the metric that is his
legibility, which is precisely the masseur's pre-amendment flaw. Two ways out, both for the owner
after the bench prices them:

* step the slope wider (+1/+3/+5), buying separation at the cost of the top rung nearly erasing
  the excursion (a break-up over in a fortnight may be too cheap – §5.3's own bound applies to the
  RELIEF as much as to the cost);
* give the top rung a second, different axis instead of a third slope step: **the wants read** –
  steps 3–4 draw what she wants (private-vs-open, space-vs-company) and surface it only in the
  feed line's wording; a tour-grade psychologist briefs the parent, and the wording becomes
  legible rather than ambiguous. That raises the chance of a MATCHED reaction without ever moving
  `bond` itself – the bond-reaction quality as the top rung's product, his «разной
  эффективностью» read as «he makes YOU better at this», not only her.

**Bench (the decoration test made mechanical):** re-run step 4's paired arms per rung – weeks
under the knee strictly monotone in rung (the pin), and each rung's paired delta > 2×SEM against
the rung below, or the rung is re-priced. Plus a hired-before-any-shock corridor: the share of
careers where a hired psychologist never fires must be printed, because a retainer that never
works is the academy-fares failure (round 23 #16) wearing a new coat.

**Open questions for the owner, each with a recommendation:**

1. **What do the rungs change?** Recommendation: the recovery slope as the base axis, and the TOP
   rung distinguished by the wants read rather than a third slope step – the arithmetic above says
   the slope alone cannot honestly separate three rungs, and the masseur's lesson should be
   pre-applied, not re-learned. Bench first, then his word.
2. **Does he ever read anything but shocks?** (exam weeks, the weekly return rate.)
   Recommendation: no – shocks only. An effect inside the weekly rule is condition-style
   invisible, the exact failure the design plan's §4 names as what he must not be.
3. **One session a week at every rung?** Recommendation: yes – «1 сессия в неделю» is the cadence;
   «разные уровни психологов» reads as WHO comes to the call, not how often. The top rung buys a
   better specialist, never a busier calendar.
4. **Can he be hired before any shock exists?** Recommendation: yes, retainer-shaped like the
   masseur pre-injury – but the hire card says plainly what he is for, and the bench corridor
   above keeps the never-fired share honest.

### 6b. Owner's 23.08 rulings on steps 6–8 – recorded where they land

**The romance gate is 16, CONFIRMED** – step 3's `kidAgeExact ≥ 16` is no longer a
recommendation (open question 5 is closed below).

**Weddings from 22, and both romance trajectories are first-class.** His word, verbatim:

> «Свадьбы предлагаю с 22+ уже делать. Романов может быть как несколько, так и один, как мне
> кажется, это тоже будет сильно»

So step 6's latch carries its own age gate – ⭐ **no marriage before 23** since 11.09 (his 23.08
«с 22+» superseded by his own word on the art-driven gate: the bride is painted at the `adult`
portrait stage only, «свадьба на 23+ – мне вполне ок») – beside step 3's 16, and
the slot's life between those gates may CYCLE (arrival → end → cooldown → someone new) or HOLD
(one long romance carried into the latch). Both are his design, not edge cases: step 4's hazards
already produce both (median duration ≈ 57 weeks, ~28% of relationships reach year two), and no
bench or tuning pass may treat either trajectory as the golden path – a career of several romances
and a career of one are both «сильно», his word. The branch behind the latch – the wedding itself,
pregnancy, children – now has its own first-sketch stack:
[the-wedding-and-the-children.md](the-wedding-and-the-children.md).

**The funerals, gated on the adult rung.** His word, verbatim:

> «Где-то начиная со ступени adult нам еще надо будет вплести похороны с соответствующими
> эффектами»

So step 8 gains a hard gate the sketch did not have: nothing of it fires before the **adult
rung** – the game's own stage ladder puts `adult` at 23+ (`portraitStage`,
`src/shared/avatarEmotion.ts`: jun <11 · young 11–16 · teen 17–22 · adult 23–30 · lateCareer 31+
– names re-checked 09.09), so
the recommendation is a `kidAgeExact ≥ 23` gate, and the junior years never see a bereavement.
The funeral itself is part of the beat – «с соответствующими эффектами» – not a feed line: its own
shock kind on step 8's asymmetric, longer curve, and everything §3e already holds still stands:
deliberately NOT on the attachment machinery, it can reach the parent, it ships behind an off
switch (open question 1 must be answered first), last, carefully.

---

## 7. Steps × waves

| wave | step | schema | new files | shared hubs touched | gate |
| --- | --- | --- | --- | --- | --- |
| 1 | the two numbers + temperament + the voice's ground (bibles, tier 0, the Mood ladder, the emotion input) | v72 | engine/spirit.ts, tools/spirit-bench.ts, the four voice bibles | phaseHerWeek.ts, player.ts, economy.ts, migrations.ts, state.ts, birthday.ts, diary/*, avatarEmotion.ts, KidScreen.vue, WeekRecapCard.vue, protocol/* | check + test:sim + B1 pin + v72.json + bench corridor (per-temperament arms + ±1.5 pp fairness) + voice completeness pin + e2e case + parity run |
| 2 | reaction surface (+ fork-gap beat; spirit/bond join the want) | v73 | world/lifeBeat.ts, LifeBeatDialog.vue | world.ts, endings.ts, protocol/events.ts, protocol/messages.ts, worker RPC, game.ts, App.vue | check + test:sim + revert-the-reaction equality + 375x667 mounted pin + radio conventions + parity run + v73.json + e2e case |
| 3 | someone exists + tier-1 small talk + the feed's life-row emoji | v74 | tools/life-arrival.ts | lifeBeat.ts, world.ts, spirit.ts, diary.ts, protocol/* | check + test:sim + per-temperament census + input-independence arm + v74.json + e2e case |
| 4 | it ends | v75 | – | spirit.ts, lifeBeat.ts, world.ts, diary.ts, protocol/* | check + test:sim + paired-cost bench (per-intensity arms) + v75.json + e2e case |

One branch per wave (house law); inside wave 2 the engine and Vue halves can be parallel agents if
the protocol wire lands first. Waves are strictly sequential – every step reads the one above.
⚠ Schema numbers re-based 09.09 from `SAVE_SCHEMA_VERSION = 71`; whoever lands second takes the
next number – re-count at land.

---

## 8. Open questions for the owner – each with a recommendation

1. **§5.1 – can any of it be refused at the start?** Recommendation: steps 1–4 ship with no
   switch (a boyfriend and a break-up are career-sim-normal, and a switch nobody needs is a
   settings tax); the off switch is designed ONLY for step 8, at new-career creation, default ON
   for everything, bereavement default ASK-AT-CREATION. Decide before step 8, not before step 1.
2. **§5.2 – does the career survive motherhood in OUR model?** Recommendation: both, as fork
   answers – a protected-ranking return that is real but not guaranteed, and «she does not come
   back» as an ending in its own right. The research doc supports both happening in life; a game
   that picks one is thinner than the truth. Decide at step 7.
3. **§5.3 – how much can `spirit` move a match?** Recommendation: knee 60 / floor 0.90, which
   prices a break-up at ~0.9–3.4 pp per match for about a month – bigger than decoration, smaller
   than fatigue at every point. The step-4 bench measures the realised pp; the corridor [1, 8] pp
   is the honest middle §5.3 asks for, and the two constants are one line each to retune.
4. **The birthday licence – ANSWERED 23.08, with a correction.** The draft's «material gifts stay
   at 0 forever» did not survive contact with him: «а как же с теми, которых она сама просила? мне
   кажется там вполне может двигаться в положительную сторону мораль». The rule as it now stands
   is §1d's: time-together ids move `bond`, the ASKED-FOR material gift granted moves it up, the
   refusal down, and only the unprompted material purchase stays at 0. What remains open is only
   the deltas' exact size (the +2..+3 / −1..−2 corridors are bench proposals) – and the build
   commit owes the amendment to ruling 2's comment and the birthday spec, as §1d records.
5. **The romance age gate – RULED 23.08: 16 confirmed.** (The recommendation stood: below 16 the
   layer has nothing to say that `kidLife`'s school texture does not already say better.)
6. **Does spirit ever help above baseline?** Recommendation: no – factor 1.0 everywhere ≥ 60,
   mirroring condition; the lift's value is the buffer before the knee. A symmetric upside is
   form's designed property and building it here would pre-empt the parked spec.
7. **Is 3a's reaction dialog in step 3, or is 3a feed-only?** Recommendation: in step 3 – §4a.1
   says every beat needs a reaction, the machinery is already paid for by step 2, and a beat with
   no answer is the slot machine §0 warns about. The feed-only cut stays named as the fallback.

## ⚠ One cross-review note (23.08)

The Codex perspective argued psychology should mostly NOT touch match probability. The house answer,
recorded in `docs/review-codex/12-backlog-perspective-response-2026-08-23.md`: `bond` never touches
a match (diary bands only – convergent); `spirit` touches it DELIBERATELY as a bounded NAMED term
(floor 0.90, smaller than fatigue at every point, decaying) – which satisfies the perspective's own
protected principle for match terms. Awaiting the owner's explicit confirmation, listed in
`docs/backlog/awaiting-his-word.md`.

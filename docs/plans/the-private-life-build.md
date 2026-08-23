---
type: plan
status: draft
area: life
canonical: false
last-reviewed: 2026-08-23
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

* Range **0..100**, integer. Start **70** = `ECONOMY.spirit.baseline`.
* **Effective baseline** = `baseline` (70) **+ 5** while the attachment slot is full
  (`attachmentLift: 5`, step 3) – §3a's «lifts a little and stays lifted» is a baseline shift, not
  a one-off bump, so the lift arrives over ~2 weeks and holds.
* **Weekly update** (`accrueSpirit(world)`, in a new leaf `src/engine/spirit.ts` beside
  `condition.ts`; called in `tickWeek` immediately after `accrueCondition` – world.ts:3300; pure
  arithmetic, **zero draws on any stream**):
  1. apply the week's perturbations (table below), clamp 0..100;
  2. step toward the effective baseline by **min(4, |gap|)** (`returnPerWeek: 4`), both directions.
     One rule for the lift, the break-up recovery and every drift – no second curve to tune.

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

Equilibrium check: perturbations are small against `returnPerWeek: 4`, so a career hovers at
70 ± a few points and only step 4's shock (−28) produces a multi-week excursion. That is the
step-1 «neither drifting to an extreme» row, made checkable (§1f).

### 1c. `spirit`'s ONE reader – the exact seam

`condition` reaches the match through one line of `kidMatchPlayerFor`
(src/engine/world/player.ts:211): `const factor = conditionMatchFactor(world.condition)`, then the
five wings multiply by `factor` at the composition point. `spirit` takes the identical seam:

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
| `seed:life:partner:<sinceWeek>` | who he is: the feed lag, her `wants` read | the arrival week |
| `seed:life:ends:<week>` | does it end this week (3b hazard) + the space/company read | the week |
| `seed:life:fork:<seasonIndex>` | her stated want at the college fork (step 2's beat) | the season |
| `seed:life:copy:<week>` | copy selection at snapshot time only | the week |

All re-derived at the call site, nothing persisted, MAIN never touched – `seed:birthday:<age>`'s
exact shape, including the immutability argument: every key is (seed, calendar), never a choice.

---

## 2. Step 1 – the two numbers (wave 1)

**Schema move (v60):** `world.spirit: number` + `world.bond: number` beside `condition`; bump
`SAVE_SCHEMA_VERSION` 59 → 60; append-only migration back-fills `{ spirit: 70, bond: 70 }`;
golden fixture `tests/fixtures/saves/v60.json`. Migrated saves play byte-identical matches until
something moves (70 is above the knee ⇒ factor 1.0). ⚠ Version-number coordination is the standing
rule: whoever lands second takes the next number.

**Wiring points:** `createWorld` init; `accrueSpirit` call after `accrueCondition`
(world.ts:3300); bond deltas inside `decideKnock`, `chooseGift`, the played-hurt arm where
`clearance` is in hand, `resolveVacation`, and the season boundary block; the factor in
`kidMatchPlayerFor`; diary bands.

**Tests:** delta table unit tests; clamp/equilibrium; `spiritMatchFactor` exactly 1 on [60,100];
seam test – `kidMatchPlayerFor` with spirit absent or ≥ 60 deep-equals the pre-slice player; B1
capture pin untouched; migration idempotency + fixture; diary licence sweep (new lines unselectable
outside their bands).

**Bench (the «done when» row made measurable):** `tools/spirit-bench.ts` (`bench:spirit`), 32
seeds × 4 seasons, arms {care: rest knocks + vacations + light exams} × {grind: push knocks + zero
vacations + heavy exams}, balanced entries in both. Pass bars:

* spirit MOVES: per-career sd over weeks ≥ 2 points in both arms;
* no extreme drift: weeks at spirit < 20 or > 95 under 2%; long-run mean 70 ± 4;
* bond separates: grind vs care gap **≥ 12 points at season 3, and > 2×SEM** (means ± SEM printed);
* neither arm's bond median at a clamp (0 or 100).

**Collision surface:** `src/engine/world.ts`, new `src/engine/spirit.ts`, `src/engine/world/player.ts`,
`src/engine/economy.ts`, `src/engine/migrations.ts`, `src/engine/world/birthday.ts`,
`src/engine/diary.ts`, `src/shared/protocol.ts` (DiaryFacts), `tests/*`, `tools/spirit-bench.ts`,
`package.json`. One agent – too many shared hubs to split.

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

**Schema move (v61):** `world.lifeLog: LifeBeatRecord[]` –
`{ week, kind: 'fork-opinion' (grows per step), detail: string, answer: string | null }`.
Append-only, never pruned (a handful of rows per career – `birthdays`' own argument). Fixture
`v61.json`.

**The proving beat – her opinion in the fork gap.** The design plan names it itself: D2's
ask–hold–depart split is live, and «the fork gap is its readiest beat»; the paused E1 surface
(«да, пока на паузе» – until steps 1–2 exist) is unpaused BY this wave, machinery landing first
inside it. Mechanics:

* trigger: the tick that opens the college fork also writes a `'fork-opinion'` row; her stated
  want (`college` / `tour` / `stop`) drawn on `seed:life:fork:<seasonIndex>`, weighted by her
  standing on the ladder (deterministic inputs + the stream, nothing of the player's);
* order forced mechanically, not by the UI: the `'life'` guard sits ABOVE the fork guard in
  `advanceWeeks`, and `answerFork` refuses while her row is unanswered – he hears her out first
  (invariant 1: the engine is the gate);
* his reaction options (SHAPE – responses, never her choices): back her want / press the other way
  / listen and say nothing. Bond +2 / −2 / 0;
* the second delta lands where the decision does: `answerFork` matching her recorded want +3,
  contradicting it −4. A parent can disagree out loud and then do as she asked – the two deltas
  are separate on purpose.

**Bench / gate:** the «reverting the reaction changes the number, measured» row is deterministic –
same seed, answer A vs answer B, bond differs by exactly the table (an equality test, no SEM);
B1 capture byte-identical; fixture + migration tests; the 375x667 mounted test proven by mutation.

**Collision surface:** new `src/engine/world/lifeBeat.ts`, `src/engine/world.ts` (guards, command),
`src/engine/world/college.ts` (fork congruence), `src/shared/protocol.ts` (StopReason:291, prompt
wire), `src/worker/sim.worker.ts`, `src/worker/client.ts`, `src/stores/game.ts`, new
`src/components/LifeBeatDialog.vue`, `App.vue`, `tests/component/*`, `src/engine/migrations.ts`.
The engine half and the Vue half can be two agents; `protocol.ts` is the one shared file – land the
wire first.

---

## 4. Step 3 – someone exists (wave 3)

**Trigger conditions:**

* age gate: nothing fires before `kidAgeExact ≥ 16` – ⭐ RULED 23.08, 16 confirmed (question 5,
  closed);
* hazard while the slot is empty and the cooldown is clear: **1.0%/week before 18, 2.5%/week from
  18**, one uniform on `seed:life:arrival:<week>` per eligible week. Median first arrival ≈ 17.3;
  ~90% of careers have met someone by 19;
* cooldown: **26 weeks** after an `endedWeek` – nobody new for half a season.

**Schema move (v62):** `world.attachment:
{ sinceWeek: number, knownWeek: number | null, partnerId: string, wants: 'private' | 'open' } | null`.
`partnerId` = `p:<sinceWeek>` – an identity for later steps, no name at step 3 (the fictional-name
rule gets its own pass when a name is ever printed). Fixture `v62.json`.

**Feed-first, possibly late (§0.1):** at `sinceWeek` the TRUTH moves – the slot fills, the spirit
baseline lifts +5 – and the parent is told nothing. The feed lag is drawn once on
`seed:life:partner:<sinceWeek>`: **0 with p = 0.25, else uniform 1..10 weeks**; `knownWeek =
sinceWeek + lag`. So ~52% of arrivals surface 4+ weeks late, and an attentive player can see her
playing a shade lighter before the feed says why – the fog is honest. At `knownWeek`: a kept feed
row plus the reaction beat (step 2's machinery, `kind: 'met'`), which pauses the week.

**Reaction options' shape** (his responses – her choice was never on a menu): warm («tell her you
are glad») / wary («ask the coach to keep an eye on the schedule») / intrusive («ask to meet him,
now») / silent. Bond +2 / 0 / −3 / −1, with the `wants` read flipping warm-vs-silent: a girl whose
drawn `wants` is `'private'` reads +2 on silent and −1 on warm – the read is in the feed line's
wording, never marked, the birthday-ask scene generalised. ⚠ Nothing else moves: no spirit delta
from his words (weather is hers; his words are the relationship – §4a.2's split, kept mechanical).
Fallback if the owner wants 3a truly minimal: ship feed + record + lift only, dialog deferred to
step 4 – open question 7.

**Bench:** 200 careers on `tools/life-arrival.ts` (`bench:life-arrival`): median first-arrival age
in [16.5, 18.5]; late share (lag ≥ 4) in [40, 60]%; input-independence arm – a no-action and an
action-laden run under the same seed report identical `sinceWeek`s; MAIN capture untouched.

**Collision surface:** `src/engine/world/lifeBeat.ts` (grows), `src/engine/world.ts` (tick hazard),
`src/engine/spirit.ts` (baseline read), `src/engine/world/ledger.ts` callers, `src/shared/protocol.ts`,
`src/engine/migrations.ts`, `src/engine/diary.ts` (her-life lines arrive HERE, spirit's second
reader), `tools/life-arrival.ts`. One agent.

---

## 5. Step 4 – it ends (wave 4)

**Trigger:** while the slot is full, **1.2%/week** on `seed:life:ends:<week>` (median duration
≈ 57 weeks; ~28% of relationships survive to year two – step 6's raw material). Active from
`sinceWeek`, not `knownWeek`: it can end before he ever knew, and the whole episode then surfaces
as one late row – §0's strongest scene, free of charge.

**The shock and the recovery curve – the numbers a bench can check:**

* at `endedWeek`: spirit **−28**, slot lift removed (effective baseline back to 70), slot nulled,
  `world.spiritShock = { week, kind: 'breakup' }` set, lifeLog `'ended'` row written;
* recovery is the standing weekly rule, nothing special-cased: +4/week toward baseline. From a
  lifted 75: 47 → 51 → 55 → 59 → 63 – **4 weeks under the knee (visibly below herself), back at
  baseline ~week 7**; factor bottoms at 0.978 ≈ 0.9–3.4 pp per match (§1c's yardstick);
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

**Schema move (v63):** `world.spiritShock: { week: number, kind: 'breakup' } | null` (kinds grow
at steps 7–8). Fixture `v63.json`.

**Bench (the «visible in results, not just in a stat» row):** paired arms on `bench:spirit` – 128
seed-pairs, arm A forces the break-up at a fixed week by a tool-side world poke (never by touching
a stream), arm B is the same seed untouched. Bars:

* paired match-win-rate drop over the 5 weeks after the shock **inside [1, 8] pp and > 2×SEM**;
* median weeks-to-baseline **7 ± 1**; weeks under the knee **4 ± 1**;
* week 10+ after the shock: paired difference statistically zero (< 1×SEM) – the cost ENDS, it is
  weather, not a scar.

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

So step 6's latch carries its own age gate – **no marriage before 22** – beside step 3's 16, and
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
rung** – the game's own stage ladder puts `adult` at 23+ (`portraitStageFor`,
`src/shared/avatarEmotion.ts`: jun <11 · young 11–16 · teen 17–22 · adult 23–30 · milf 31+), so
the recommendation is a `kidAgeExact ≥ 23` gate, and the junior years never see a bereavement.
The funeral itself is part of the beat – «с соответствующими эффектами» – not a feed line: its own
shock kind on step 8's asymmetric, longer curve, and everything §3e already holds still stands:
deliberately NOT on the attachment machinery, it can reach the parent, it ships behind an off
switch (open question 1 must be answered first), last, carefully.

---

## 7. Steps × waves

| wave | step | schema | new files | shared hubs touched | gate |
| --- | --- | --- | --- | --- | --- |
| 1 | the two numbers | v60 | engine/spirit.ts, tools/spirit-bench.ts | world.ts, player.ts, economy.ts, migrations.ts, birthday.ts, diary.ts, protocol.ts | check + test:sim + B1 pin + v60.json + bench corridor |
| 2 | reaction surface (+ fork-gap beat) | v61 | world/lifeBeat.ts, LifeBeatDialog.vue | world.ts, college.ts, protocol.ts, worker RPC, game.ts, App.vue | check + test:sim + revert-the-reaction equality + 375x667 mounted pin + v61.json |
| 3 | someone exists | v62 | tools/life-arrival.ts | lifeBeat.ts, world.ts, spirit.ts, diary.ts, protocol.ts | check + test:sim + arrival census + input-independence arm + v62.json |
| 4 | it ends | v63 | – | spirit.ts, lifeBeat.ts, world.ts, diary.ts, protocol.ts | check + test:sim + paired-cost bench + v63.json |

One branch per wave (house law); inside wave 2 the engine and Vue halves can be parallel agents if
the protocol.ts wire lands first. Waves are strictly sequential – every step reads the one above.

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

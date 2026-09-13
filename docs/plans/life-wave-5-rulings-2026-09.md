---
type: plan
status: current
area: life
canonical: false
last-reviewed: 2026-09-13
---

# Wave 5 – the architect's rulings, measured before the tasks that need them

Wave 4 shipped its rulings in a file of their own and the wave read better for it; the same here.
Each ruling names the measurement that produced it, so a builder can check the reasoning rather
than take it on authority.

## Ruling A – which temperament reads move to expression, and the law that decides it

**Measured 13.09, before T7 was briefed.** `src/engine/world/lifeBeat.ts` ALREADY splits the two
readings by function, and the doc comments already name the split:

* `voiceOf(world)` :1622 – "Who she is, for the WORDING alone" – ONE call site (:1986).
* `temperamentOf(world)` :2219 – "WHO SHE IS" – FIVE call sites: :1928, :2263, :2362, :2587, :2918.

So the obvious T7 move is to re-point `temperamentOf`'s body and be done. **That would be wrong**,
and this ruling is why.

## The law

**A draw whose RESULT IS PERSISTED may read EXPRESSION – it is stamped at the week it was true.
A draw that is RE-DERIVED from persisted facts must read BIRTH, because expression is not a
persisted fact of the episode; it is a fact about the world's current week, and re-derivation
would change history.**

## Applied, site by site (`temperamentOf`'s five)

| site | what it feeds | stored? | reads |
| --- | --- | --- | --- |
| :2362 `rollArrival` | `arrivalHazardFor`, `drawPartnerWants` → `wants`, `drawRawLag` → `knownWeek` | hazard evaluated now; wants and knownWeek STAMPED on the episode | **expressed** |
| :2263 | the ends cooldown `life.cooldownWeeks[…]` | evaluated now | **expressed** |
| :2918 | `endsHazardFor` | evaluated now | **expressed** |
| :1928 `beatEndsRead` | `drawEndsRead` – the card's priced option set | ⚠ RE-DERIVED, NEVER STORED | **birth** |
| :2587 told-late feed row | `drawEndsRead` – the kept row's text | the TEXT is persisted, the READ is re-derived | **birth** |

The last two are twins by design – the file's own comment: «the read comes off the ENDING's own
week … so the row and the card the same tick raises cannot disagree». They move together or not
at all, and this ruling says not at all.

## Why, in the code's own words

`beatEndsRead`'s ⚠⚠ block: «RE-DERIVED AND NEVER STORED, which is a correctness requirement and
not a preference. `answerLifeBeat` re-validates the chosen option against the priced set … so the
price has to be RECONSTRUCTIBLE at answer time from facts the world holds.» Expression is not such
a fact. The `'ended'` options are space/company at +3 or −3 BY THE READ – a read that moved between
the shown prompt and the validated answer would charge the opposite sign of what the player chose.

**Honest limit of the claim: this is LATENT, not live.** `LIFE_BEAT_BLOCKING.ended === true` in
both registers (:154), so the week cannot tick – and no leaning pass can run – between the raise
and the answer. The trap is for what comes next: the album (step 6+) is promised a read of the arc
«later», and any later re-derivation would rewrite wording the player already saw.

## What T7 must therefore do

Re-point **per call site**, never by re-pointing `temperamentOf`'s body – exactly what the brief
already asks («each swap is one import and one call-site with a ⚠ comment»), and now with the
reason written down. Three of the five move; two stay and carry a ⚠ comment naming this ruling.
`voiceOf` is untouched (§0.2's fence).

Outside `lifeBeat.ts`: `accrueSpirit`'s intensity read (`spirit.ts:393` – `returnPerWeek`,
`perturbationScale`) is evaluated now ⇒ **expressed**. `birthday.ts:1351` (the ask weighting) is
§0.2's named fence ⇒ **birth**.

## Ruling B – three facts T1 measured that correct the brief, and one habit of mine they retire

T1 was dispatched with a frozen-career table carried from memory. **It was wrong in three of five
cells** and the builder measured the truth: `elitePlayer` no longer exists – the 12.09 union merge
renamed that cell `highPlayer` – and the counts are middleGrinder **79** · eliteGrinder **78** ·
selfTravelling **80** · middlePlayer **79** · highPlayer **78**. A schema move now costs **eleven**
live constants, not nine, for the same reason.

⚠ **The habit, retired: no brief in this wave repeats that table from the architect's memory.**
Each task that touches the frozen corpus is told to MEASURE the cell set and the counts first. A
remembered number handed down as a measured one is the same failure as a guessed constant.

**The e2e corpus was stale at the wave's base, and this wave's regeneration silently pays another
round's debt.** The last regeneration was wave 4's `eeea42ad`; round 41's `043d49e1` (ad letters
from sixteen, her share from the first W cheque) landed afterwards and regenerated nothing. So the
`.tsave` drift inside T1's commit is NOT all T1's: `unheard` moves seed 13→1 and `belated` 472→671.
This is the debt recorded at the end of wave 4 – «the `.tsave` corpus has no gate of its own, and
the fixture and its manifest regenerate together» – arriving exactly one wave later, which is the
argument for paying it that the debt entry itself could not make.

**And the wave's own base shipped a red gate.** `ccc83cbc` – the architect's brief commit – added a
dated `decisions.md` entry without regenerating the index block above the archive, and
`decisions:check` is step 5 of `npm run check`, so nothing after it ran. Measured at the base in a
throw-away worktree, fixed in its own two-line commit (`89850de2`). The lesson is the house rule
this repo already has and the architect skipped: **a doc commit is gated like any other.**
## Ruling C – the recovery receipt counts the weeks he actually worked, and the counter is a key on the shock

**The gap, found before T4 was briefed.** The brief asks the T4 receipt to print «only when the
focus was held for at least half the shock's weeks (`spiritShock.week` gives the span)». The span
it does give: `world.week - shock.week` at the clear. **What it does not give is the HELD half** –
the world persists nothing from which «the slope actually applied on week W» can be recovered.

The cheap proxy is `psychologistFocusSeason` plus «hired now»: the focus can only change at a
season boundary (T3), so «held since season S» is exact FOR THE FOCUS. It is not exact for the
HIRE – a parent who fires him mid-shock and re-hires at the clear reads identically. A receipt
whose sentence says «he worked it» while its code checks «a focus was set in some season and he is
on the payroll today» is the wave-4 monitor's own defect: **a check whose MESSAGE claims more than
its CODE verifies.** Rejected.

**The ruling: `spiritShock` gains an optional `weeks?: number`**, incremented inside `accrueSpirit`
on exactly the weeks the slope applied (shock live ∧ hired ∧ `focus === 'recovery'`), and the
receipt prints iff `weeks >= 1 && weeks * 2 >= world.week - shock.week`. The `weeks >= 1` half is
not decoration: a shock that lands and clears in one week has span 0, and `0 * 2 >= 0` would print
the receipt for work nobody did.

**No schema bump is owed, and that is the house rule rather than a convenience.**
`pendingTournament.masseurThere?: boolean` (state.ts, v59 step 2) is the precedent: an optional key
on a TRANSIENT record – one created and discarded inside play – back-fills to absent, and absent is
exactly true here («no week of this shock was ever counted», which is what a pre-counter shock is).
`injury.weeksSaved` is the same instrument for the masseur's own claim, one seat over. ⚠ The
increment lives INSIDE `accrueSpirit` – §0.1 forbids a `world.spirit` write elsewhere, and this is
not one, but it must not migrate into `psychologist.ts` either.

Frozen careers cannot move on this: they never hire, so the key never appears.

## Ruling D – T5's site, measured, and the term's shape

The wave brief says the composure walk is «applied in the weekly development pass as its OWN named
term beside training growth, never by mutating the plan». **Measured, that pass is
`growWeek` in `src/engine/development.ts`**, reached from `growAndLive` (`world/phaseGrowth.ts:50`,
step 3b) and drawing on `seed:growth:<week>` – its own stream, which is why the frozen capture
cannot move. `SKILL_KEYS` is at `development.ts:72` and `isPhysicalSkill` is literally
`k !== 'composure'` (`:83`), so composure is already the one non-physical skill the file knows how
to treat apart. Put the term there and name it; do not add a key to `SKILL_KEYS` and do not touch
`isPhysicalSkill`.

## Ruling E – T6's legibility is STAMPED on the row, and why that is not ruling A reversed

Ruling A forbids stamping the ends READ and insists it be re-derived. This ruling stamps T6's
legibility on the same row. Both are right, and the line between them is the point.

**The key's `<week>` is the beat's RAISE week** (`LifeBeatRecord.week` – the row carries it,
`narrative.ts:237`), never `world.week`. Without that the stream is not reconstructible at all.

**But the raise week is not enough, because the seat is not a persisted fact of the row.** The
listen coin reads `psychologistHired`, `psychologistFocus` and – through `listenClarity[rung]` –
the RUNG. All three are mutable by command. And `buildLifeBeatPrompt(world)` is rebuilt **on every
snapshot** (`world/snapshot.ts:1815`), so a re-derived heading is re-derived after every command,
not once per beat. Fire him, or drop him a rung, with a beat pending, and the heading's wording
flips from legible to ambiguous under the player's eyes – while the kept feed row, whose TEXT was
persisted at the raise, still says the legible thing. One piece of news, two wordings.

⚠ **Measured limit: the ENGINE permits this; whether today's UI does is T6's to measure.** The
blocking dialog sits over a scrim on Home and may well be undismissable, in which case the path is
closed by the surface rather than by the rule. The ruling does not depend on it.

**Why stamping is allowed here and forbidden there.** `beatEndsRead`'s ⚠⚠ block forbids stamping
because the read is a PRICE input – `'ended'`'s space/company delta is +3 or −3 by it, and
`answerLifeBeat` re-validates the chosen option against a priced set that must be reconstructible.
**T6's legibility is not a price input at all**: its own pin is that the bond arithmetic, the read
draw and the priced option set are byte-identical with the focus on or off. Stamping a wording
choice creates no second source of truth for any price. So:

**`LifeBeatRecord` gains an optional `heard?: boolean`**, written at the raise, read by both the
prompt heading and the kept feed row. Absent = «nobody was teaching you to listen», which is
exactly true of every row that predates the seat – the same back-fill honesty as ruling C, and no
schema bump owed for the same house rule.

## Ruling F – the leaning pass runs at the TAIL of `accrueSpirit`, so a flip never bites its own week

T4 adds a term to the return step at the head of `accrueSpirit`; T7 adds the weekly leaning pass to
the same function («one weekly function, two numbers» becomes three). That puts a flip and the
arithmetic it changes inside one tick, and the order decides whether the flip's first week is
arithmetically special.

**It must not be.** `accrueSpirit` reads `intensity` ONCE at its head and spends it on
`returnPerWeek[intensity]`, `perturbationScale[intensity]` and `shock[kind][intensity]`. The week's
perturbation was experienced by the girl she was all week. A flip that fired mid-pass would price
half the week as one person and half as another – the same defect the 09.09 ORDER FIX corrected for
the return-vs-event order, and a cousin of «no second curve, no taper, no flag».

So: **the leaning drift and the flip hazard run after step 4's shock clear, at the tail**, and the
new expression is first read on the NEXT tick. The `intensity` const at the head stays a single
read for the whole pass – do not re-read it after the pass, and do not thread the new value into
the same tick.

Two axes arm independently, so an armed week can draw twice – `seed:life:walls:open:<week>` and
`seed:life:walls:reg:<week>`, one value per key, §1f satisfied by the axis being IN the key.

## Ruling G – what T2 measured that binds every task after it

Five of these are corrections to the wave brief, found by building against it. They are recorded
here so no later brief repeats them.

1. **A `Snapshot` member ships WITH its reader, never before it.** `tests/snapshot-contract.test.ts`
   (E-07, the 05.09 engine review: «a Snapshot member with no reader is a promise to the UI that
   nothing collects») went red on `psychologistFocus` alone. So the seat's wire carries FOUR facts
   in T2 and the focus joins in T3, beside the card that reads it – the same discipline
   `spiritShock` was held to in wave 4.
2. **The seat DOES get a rung selector.** «No dial and no travel switch» was half wrong: ruling Б
   covers the TRAVEL switch only, and the spec's §3 gives him three rungs. `StaffRung.sessions`
   became `StaffRung.value` – an index, not a count – and one radio group renders both seats.
3. **The college-freeze refusal is NOT a new string and must not be drafted.** `guardNotEnded`
   throws the existing `COLLEGE_FREEZE_REFUSAL` first; a second sentence would break the R10-16
   one-story doctrine and invariant 4 at once. ⚠ T9's string list asks for a draft that must not be
   written – strike that row.
4. **Every new command joins `tests/round24-college-refusals.test.ts`.** It is a guard SET the
   masseur's commands joined in v59, and it was in no file list of mine. T3's `setPsychologistFocus`
   joins it too.
5. **`householdWeekly` names its seats; it does not total `'staff'` rows.** My brief quoted
   `snapshot.ts` promising that a salary «joins `outgoingCents` and NOTHING else has to move». The
   promise that was true is twenty lines away in `world/coachMarket.ts:688`, whose own block says a
   psychologist «joins as one more line in this list». One term was required. Everything downstream
   did follow by itself.

⚠ **And the process hazard fired twice in one session, live.** The background-task notice reported
«exit code 0» over a run whose log said `CHECK_EXIT=2`, and again over one that said
`CHECK_EXIT=1`. This is exactly the CLAUDE.md rule about never trusting a notification's exit code,
observed rather than recited. Every verdict in this wave is read from a log file the command itself
appended, with its mtime checked against the run's start.

## Ruling H – the owner grows the wave: coach profiles (T12) and the elite gate (T13)

*(The architect's, 13.09 – appended while the builder's own rulings C–G were landing, which is
why the letter is H and the earlier cross-references say so.)*

His word, 13.09, in the coach-types discussion (the full reasoning is the discussion's record in
decisions.md; the reality audit it produced is
[team-economics-2026-09](../research/team-economics-2026-09.md)): «профили тренеров давай в эту
волну после психолога, elite gate включим здесь же, добавишь в спеку билдеру?» Both run AFTER
T9 and BEFORE T10–T11; T10 gains their bench lines, T11's gate covers them; nothing renumbers.

### T12 – coach profiles: a LENS on axes that already exist, never a new lever

The market already differentiates coaches on real axes the card never says out loud: `style`
(`PlayStyle`: aggressive / counterpuncher / serve-first / all-court) × her style → `StyleFit`
great/good/off → a DEVELOPMENT multiplier (`coachFitFor` → `coachFactor`, coach.ts:384); the
personal edge placement within the tier's corridor (`coachEdgePlacement` lower/middle/upper);
physio inclusion; the season uplift projection. T12 makes those axes READABLE as a profile – a
short label plus one line on the market card and the room note reading the fit in words –
**derived from (seed, coachId) exactly as the roster itself is: NO schema, NO new mechanic, NO
skill-lean** (the lean idea from the discussion is deliberately NOT in v1 – it would be a new
lever, and the label must first prove the existing differences alone change hiring decisions).
Strings are drafts (invariant 4); the card follows the mounted-test law; the bench line in T10:
profiles must be DISTINGUISHABLE – across a seeded roster sweep, profile labels partition the
existing axes with no two profiles identical on all shown axes, and the fit sentence agrees
with `coachFitFor` (a label that says nothing the axes do not hold is decoration, the masseur
§4 law read for words).

### T13 – the elite gate goes ON

`ECONOMY.coach.eliteGate` = `{ enabled: false, minPoints: 150 }` – built, tested, waiting; his
word turns the flag. The builder's job is the flip PLUS the proof the built surfaces still tell
one story (`coachHireable` is asked by the market row state, the hire refusal and the screen
lock – the R10-16 doctrine; the locked-row copy exists from the original build – verify, never
rewrite). ⚠ Expect frozen-career consequences: any preset that hires an elite coach before 150
points now walks differently – per-key protocol, diff FIRST, `rngMain` byte-identity the STOP
condition; e2e gains the locked-row case. If no preset trips the gate, say so in the record –
a null result with the arm named.

## Ruling I – the off-season window is the TRUE off-season, and the stamp is the year the choice is FOR

T3 shipped against the wave brief's named seam and then reported two problems with it. Both are
real, both are the same arithmetic, and the measurement settles them.

**Measured:** `isOffSeasonWeek(week)` (`season/calendar.ts:1705`) is true for the **last three
weeks of the 52-week block** (`OFF_SEASON_WEEKS = 3`, offsets 49–51), and
`seasonIndexOf(week) = Math.floor(week / WEEKS_PER_YEAR)` (`world/ledger.ts:203`). So **the
off-season sits INSIDE the same season index as the year it ends.**

**Problem 1 – the window was too wide.** `isBlackoutWeek` is the off-season **or an exam fortnight
while school is not over**, and the pro unlock can precede school's end. A still-at-school
professional therefore gets a second change window in June, which is mid-season switching – exactly
what O1 («at the season boundary only … mid-season switching would make focuses a dial») forbids.
**The window is `isOffSeasonWeek(week)`.** It takes one argument, which also retires the
`schoolIsOver` plumbing the wider predicate needed.

**Problem 2 – a free pick locked up to two years.** With the stamp written as
`seasonIndexOf(week)`, a hire at offset k in block N stamps N; every off-season week of block N is
STILL N, so the first change lands in block N+1's off-season – **between 50 and 101 weeks later**.
A parent who picks before knowing anything is held to it for up to two years. That is «наказание»
by arithmetic rather than by design, and the standing rule says we punish for nothing.

**The ruling: the stamp is the season the choice is FOR, not the week the click happened in.**

```
psychologistFocusSeason = seasonIndexOf(week) + (isOffSeasonWeek(week) ? 1 : 0)
```

and the change guard compares against that same expression. The whole behaviour falls out:

| case | stamp | next change allowed |
| --- | --- | --- |
| hire mid-season N (free pick) | N | the coming off-season of N (stamps N+1) – 49−k weeks |
| hire during N's off-season (free pick) | N+1 | N+1's off-season – one year |
| change in N's off-season | N+1 | N+1's off-season – one year |
| a SECOND change in the same off-season | – | refused: the stamp already reads N+1 |
| any mid-season attempt | – | refused by the window |

Exactly one choice per year, taken at the year boundary, with no trap at either end. ⚠ The free
pick still spends nothing extra: it is free because it is the first, not because it is unstamped.

**Accepted as shipped, no change:** T3's (a) a pick writes no ledger row – nothing about the bill
moves; (b) during a college freeze `guardNotEnded` throws the existing sentence, identical to the
rung dial; (c) is what this ruling replaces.

**And T3 was right to overrule my fence.** I wrote «if the decline set is per-voice it must be
complete over all four». The premise fails: the decline exists ONLY at `strained`/`cold`, which is
exactly where the bibles collapse the four voices into the flat pool, so a VOICED decline would be
a voice speaking where the bibles say it is obscured. One flat sentence is correct, and the wave
brief's own §2 T3 parenthesis already said so – my two documents disagreed and the builder found
the one that was right.

### Ruling I, addendum – what T3b measured building it

**The exam-fortnight pin needs the pick and the exam week in DIFFERENT season blocks.** Inside one
block the once-a-season fact refuses first, so the case passes under `isBlackoutWeek` and
`isOffSeasonWeek` alike – a test that proves nothing while looking correct. The shipped case is
built across a boundary and goes red on the old predicate (ARM 9, one red: the two predicates
differ on exactly one kind of week, so nothing else in the file CAN see the change).

**Reachability, with the run/read line drawn honestly.** School end: RUN – a probe over all twelve
birth months through `schoolEndWeek`/`kidAgeExact` gives week 242 (months 1–8) or 294 (9–12), ages
18.03–18.96, no month escaping the band. The exam weeks: RUN – a 900-week walk returns exactly ten
for the default profile, at ages 14.00 through 17.99. `TIERS.w15.minAgeYears = 14`: **READ, not
run**, off `season/calendar.ts:466` – and it nearly went in as 13, which is what a comment at
`economy.ts:4528` says about a different tier. ⚠ **The gap, stated as a gap:** no simulated career
was run that actually WINS a counting W-series result before week 179; the fixture sets
`bestFinishByTier.w15` directly. What is proved is that the engine's own unlock predicate accepts
the state and the age gate permits it at 14 against a school end of 18+.

**Ruling I's arithmetic survived intact** – every number re-checked against the source, and the
«50 to 101 weeks» lock reproduced as a measured instance (a pick at week 250 reopened at 309 under
the old stamp: 59 = 101−42; under the new one at 257: 7 = 49−42).

**Two of T3's cases could not be kept**, and that is the house rule working rather than a loss: one
asserted precisely the behaviour this ruling overturns, and the laundering case's second half
rested on the same lock. Both re-aimed with the ⚠ note; ARM 2's hole stays covered.

⚠ **And the notification lied a third time in this wave** – a deliberately killed sim came back as
«exit code 0» while its own log read `SIM_EXIT=143`.

## Ruling J – the effect rides the billing predicate, and how `spirit.ts` is allowed to ask

T4 shipped the recovery slope gated on `psychologistHired && focus === 'recovery'` and then handed
the question back rather than guessing. It was right to: **the gate is wrong, and the file's own
twin says so.**

**Measured.** `resolvePsychologist` opens with `if (!psychologistWorksThisWeek(world)) return` – so
on a college-freeze week and on a booked family week the parent is **not billed**. T4's
`shockBeingWorked` reads only `psychologistHired` and the focus, so on exactly those weeks the
slope still ran. Pay nothing, receive the work – the travelling-team §4 legibility law read
backwards.

**The precedent is one seat over and it is explicit.** `world/medical.ts:62` imports
`masseurWorksThisWeek` directly and spends it inside `accrueCondition`; `phaseHerWeek`'s own comment
states the rule in words: «His effects ride the same predicate». The psychologist was built as that
man's twin and must be a twin here too.

**Why the twin's own method is closed to `spirit.ts`, measured rather than assumed.** Importing the
seat from `spirit.ts` closes a real value cycle:
`spirit → psychologist → college → player → spirit` (`world/player.ts:15` imports
`spiritMatchFactor`). Cutting the `bondBandOf` arrow T3 added would remove only one of the two
edges; the `inCollege` arrow T2 added closes it anyway. And moving `inCollege` to a cycle-free leaf
is a **23-file** change – a plumbing refactor inflating a wave that is about a psychologist.

**The ruling: dependency inversion at the caller, which already holds both facts.**
`phaseHerWeek.ts` imports `accrueSpirit` (`:27`), `inCollege` (`:55`) and `resolvePsychologist`
(`:57`). So the call becomes

```
accrueSpirit(world, psychologistWorksThisWeek(world))
```

self-describing at the call site, one implementation, no new arrow, no cycle. **The same parameter
serves T7's O6 retainer slow-down** – a standing-down seat slows nothing either, for the same
reason – so it is added once and read twice.

⚠ **Two guard pins re-aim, and the re-aim must STRENGTHEN rather than renumber.**
`tests/spirit.test.ts:929` asserts `accrueSpirit.length === 1` under the heading «neither weekly
function takes an Rng at all – the strongest form of the same claim», and `:1053` pins the call text
`accrueSpirit(world)` as appearing exactly once. A `boolean` parameter leaves the pins' PURPOSE
untouched, so bumping 1 to 2 and calling it done would trade a real claim for a number. The re-aim
carries the ⚠ note naming this ruling AND keeps the no-Rng claim alive by asserting it of the
signature directly; the zero-draw test immediately above it is the net that actually catches a
draw.

⚠ **T5, T6 and T7's other readers do NOT have this cycle** and must use the twin's own method – a
direct import of `psychologistWorksThisWeek`, exactly as `medical.ts` does. The parameter is
`spirit.ts`'s exception, not the wave's pattern.

## Ruling B, corrected a second time – `FROZEN` holds THREE cells

T4 measured what T1, T2, T3, T3b and I had all been repeating loosely: **`FROZEN` carries three
cells** – `middleGrinder` 5/0, `eliteGrinder` 8/0, `selfTravelling` 0/1. `PRE_R28B` is the rung that
carries five, with `highPlayer` 6/1 and `middlePlayer` 5/1. The five-cell key counts (85 · 84 · 86 ·
84 · 85 after v76) are counts of the CAREERS a diff walks, not of one constant's members. Ruling B's
⚠ stands and gets sharper: measure the rung you are actually peeling.

## Ruling K – what the frozen corpus cannot see, named before it misleads someone

T4's §E pin first hashed the FINAL world after a walk and reported `spirit` unmoved – because spirit
returns to baseline either way, and a terminal diff cannot see that one arm got there four weeks
sooner. The pin now hashes every key every week.

⚠ **The frozen-career corpus is diffed the blind way**: it compares end states. So «0 keys moved»
is strong evidence about a change that shifts an end state and **weak evidence about a change that
converges** – a faster walk to the same place, a different route to the same wallet. Every
convergent effect this wave ships (the recovery slope, the composure walk toward a ceiling she
reaches anyway, the walls repairing to 0) is exactly that shape. The corpus is not the instrument
for them; T10's paired arms are, and a zero from the corpus must never be reported as if it were
one from the bench.

### Ruling J, corrected by T4b – the rule is the college arrow, not `spirit.ts`

Ruling J closed with «T5, T6 and T7's other readers do NOT have this cycle». **Measured and false.**
T4b walked the tree's own value-import graph (type-only clauses excluded, re-run with
`export … from` counted as edges – same answer):

* `engine/development.ts` – **T5's site** – closes **six** cycle paths, the shortest
  `psychologist → college → development`, and it closes on a VALUE: `world/college.ts:23` imports
  `SKILL_KEYS` and spends it at `:173`.
* `world/lifeBeat.ts` (T6) and `world/medical.ts` close **zero**.

So the rule is not «`spirit.ts` is special». It is: **a focus pass that sits UNDER `world/college.ts`
in the import graph must be handed the fact; one that does not may import
`psychologistWorksThisWeek` directly, the masseur's own way.** T4b confirmed the `spirit.ts` cycle
rather than taking it from me – both back-edges live, and cutting `bondBandOf` leaves the college
one, measured by cutting it and re-walking.

⚠ **T5's shape is probably cheaper than `spirit.ts`'s and must be verified before it is assumed.**
`growWeek` takes an **object** argument (`development.ts:682`), and `growAndLive` lives in
`world/phaseGrowth.ts:50` – which is not under `college.ts`. So the fact can be computed in
`growAndLive` and handed down as one more field, with **no arity change and no pin re-aim
anywhere**. T5 runs the same graph walk before relying on this.

**And «two guard pins re-aim» was wrong: there are FOUR.** `tests/wave4-ends.test.ts:610` and
`tests/wave4-ended-beat.test.ts:257` carry the same `code.indexOf('accrueSpirit(world)')` anchor
inside helpers several cases call – found by an arm going red, not by a grep of mine.

**The re-aim held its purpose rather than its number.** The arity line stayed but the no-Rng claim
moved onto the signature itself: an arm that retyped the parameter `boolean → Rng` **with arity
unchanged at 2** goes red on the signature assertion and green on a renumbered arity pin. That is
the difference between a pin and a number.

⚠ And the notification lied a fifth and sixth time this wave – twice over killed `check` runs, the
second with its own log reading `CHECK_EXIT=143`.

## Ruling L – the count-keys net has a blind spot, and T5 measured it

Wave-4 §0.1 made the **count-keys net** the LAW for zero-draw claims: prove eligibility
short-circuits with a key COUNTER the code cannot see, plus a positive control. It is still the
law. But T5's ARM 7a found what it cannot do, and the finding is general enough that every later
task must know it.

**The arm:** one extra `rng()` call inserted before `luck` inside `growWeek` – **same key, same key
count.** The key list stayed **GREEN**. What moved was a value: `serve` 53.6324 → 53.5834, because
four physical skills share the week's luck draw and every one of them shifted down the sequence.

**So: a key counter sees KEYS, never CONSUMED VALUES.** It proves a stream was not REACHED. It
cannot prove a stream was not ADVANCED. A term added inside a function that already draws – which
is exactly where T5's term, T6's listen coin and T7's flip hazard all live – can silently consume a
value on an existing key and the net will not blink.

⚠ **The rule this wave adopts: when a new term lives INSIDE a drawing function, the count-keys net
is necessary and not sufficient. Pair it with a value-level check** – a key-by-key world hash over
a walked career, or the skills object itself – and mutation-verify with an arm that consumes a draw
**without** adding a key. An arm that only deletes the term tests nothing about this.

## Ruling M – two numbers T10 must predict, or its own bars will read as failures

Both measured by T5 over five seeds, and both are arithmetic rather than defects.

**1. A held season delivers ~90% of the number on the card: 1.35 / 2.25 / 3.15 against the
constants' 1.5 / 2.5 / 3.5.** `growWeek`'s gain is `rate × HEADROOM × luck × aim`, so a girl he has
already lifted has marginally less headroom for the training that follows. ⚠ This is the OPPOSITE
of the double-charge the spec's own ⚠ worries about – the two channels add to slightly LESS than
their sum, never more. **T10's grid predicts 0.9×**, or a correct implementation will be reported
as a miss.

**2. At or within one week's rate of her ceiling, all three rungs collapse to exactly 0.** So a
strict-monotonicity bar must segment or exclude careers sitting at the ceiling – a ten-season hold
reached it and stopped buying anything. That same fact is this focus's **never-fired corridor**
material: paid weeks with nothing left to buy.

### Two smaller corrections, recorded so they are not re-found

* **T4b's «six cycle paths» was seven** – its enumerator returned early at its own `limit = 6`, so
  the six was the cap, not a count. The ruling is untouched (the shortest path and its closing
  value are the same), but a number that is really a limit is worth naming: it is the same family
  as reading a verdict off a pipe.
* **`inCollege` ignores `fromWeek`** – `college.ts:165` is `college !== null && week < untilWeek`.
  A freeze fixture built on the other reading measures a different week set while looking correct.
* **The composure number is on NO screen.** The radar carries a fogged `shownValue` into a polygon
  and prints no text (decisions.md #11, «axes without numbers»). So the cool-head sentence is not a
  caption for a number the player can already see – without it the year is genuinely invisible,
  which is the travelling-team §4 failure by name. My brief guessed the opposite and the guess was
  wrong in the direction that makes the line MORE load-bearing.

## Ruling N – the leaning's SIGN, and the one direction each girl can flip in

The wave brief's T7 describes the drift in three bullets that are individually clear and jointly
ambiguous: «−wallsRisePerWeek (walls up)», «+wallsRepairPerWeek toward 0 and NOT past it», «beyond
0 – toward the opposite pole … clamp at 0 for born-open/born-steady, nowhere to grow». Read
quickly, that supports two incompatible sign conventions, and a build against the wrong one looks
correct and is inside-out. Ruled before T7, so nobody guesses.

**The lean is ABSOLUTE, not relative to birth. Zero is her nature.**

| axis | negative | 0 | positive |
| --- | --- | --- | --- |
| `open` | more private – walls up, she stops telling | born-open or born-private, as drawn | more open – beyond her baseline |
| `reg` | more intense – dysregulated, she braces | as drawn | more steady – tools her temperament never gave her |

Buckets, for the mapping: `sunny = open+steady · fiery = open+intense · quiet = private+steady ·
deep = private+intense` (`spirit.ts:87`).

**⚠ Each girl has exactly ONE armable direction per axis, and BIRTH decides which.** A flip means
«the expressed pole on that axis is the opposite of birth», so there must be an opposite pole to
reach:

| birth on the axis | arms at | the other direction |
| --- | --- | --- |
| open | **−`flipArm`** – walls up, expressed-private | positive is clamped at 0: she is already open, there is nowhere to grow |
| private | **+`flipArm`** – her own work, expressed-open | negative accumulates as REAL WALLS and arms **nothing** – there is no pole more private than private |
| steady | **−`flipArm`** – dysregulated, expressed-intense | positive clamped at 0 |
| intense | **+`flipArm`** – regulation learned, expressed-steady | negative accumulates and arms nothing |

**And the direction that cannot flip is not wasted – it is the whole of «repair is free, growth is
work».** A born-private girl who was kicked for seasons carries a negative lean that changes no
bucket and shows on no surface, and she must be walked back to 0 before a single point of growth
can be bought. Neglect costs her the LADDER even where it cannot change who she is read as. That is
the honest shape of the law, and it is why the lean is persisted rather than derived.

**What scales what, so the two multipliers do not get swapped:**
* the rung's **×1 / ×1.5 / ×2** applies to the flip hazard in the **beyond-baseline (positive)
  direction ONLY** – the seat accelerates her own work and never her collapse;
* O6's **×0.75** at a retained rung ≥ 2 slows the **negative DRIFT**, not the hazard – a good
  psychologist in the house makes the walls rise slower; he does not make a flip less likely once
  they are up.

**Hysteresis, stated as state rather than as a rule of thumb:** a flip does NOT reset the lean. The
flip is a separate boolean and the lean keeps drifting under it. The un-flip arms only once
`|lean| <= flipRelease`; the band between `flipRelease` and `flipArm` is a dead zone that arms
nothing **in either direction**.

**And `expressedTemperamentOf` reads `wallsFlipped` ALONE, never the lean** (T1 built it that way).
The lean is invisible to every reader, every surface and every draw except the hazard it arms –
which is what lets it be gradual, rare and honest without becoming the continuous model who-she-is
§2a rejected.

## Ruling O – a focus changes HOW a surface reads, never WHICH surfaces exist

T6 built the legible told-now ending row carrying the space/company read, flagged it as the one
thing it wanted ruled, and was right to stop there: it is a ruling change, not a builder's call.

**Measured.** `ENDED_NOW_EVENT` (`world/lifeBeat.ts:2779`) is a SINGLE string –
«It ended this week, and there is nobody in her life now.» – while `ENDED_LATE_EVENT[read]` is
indexed. Wave-4 ruling I fixed the read's surfaces at «4 heading cells plus 2 feed rows», and the
told-now row's own note **refuses a read there** on purpose: the prompt is raised the same tick, so
the heading already tells the parent what she wants, and a row repeating it would be one piece of
news told twice.

**The ruling: the told-now ending row stays read-free in BOTH arms, and gets no legible variant.**
Under the listen focus an ending told NOW makes the **heading** legible and leaves the feed row
exactly as it stands; an ending told LATE makes its row legible, because for a late telling that
row is the only surface the read has.

The principle, general to the wave and to whatever adds a focus later: **a focus may change how an
existing surface reads. It may not create a surface.** Giving the told-now row a read adds
information it has never carried – which is invariant 4's territory and the owner's, not a wave
about a psychologist. `ENDED_EVENT_HEARD` therefore loses its told-now half (16 → 8 cells), and the
wave's new string count falls from 48 to 40.

### Ruling L, amended by T6 – the value check must not call the function under test

T6 found ruling L's prescription insufficient **as written**, and the correction matters more than
the original. I wrote «pair it with a value-level check – a key-by-key world hash over a walked
career **with the focus off**». That arm cannot see a consumed draw, because with the focus off no
draw happens at all. The catching instrument is the **positive** arm.

And the positive arm only works if its expectation is derived **independently of the code under
test**. T6's first version compared the stamp against `drawListenHeard` itself – so an arm that
made the function draw twice moved BOTH sides and walked straight through it (1 red, in the wrong
place). The fix re-derives the stream's raw first value inside the test. ⚠ This is the «unable to
fail» family again, in its purest form: **an equality comparing two arms is invisible to a mutation
that moves both.** The amended rule: *pair the key net with a value check whose expectation does
not call the function under test*, and widen the walk – a consumed value only flips a coin-shaped
outcome about half the time, so three samples can pass by luck (T6 widened from 3 to 8).

### Two smaller things T6 settled, recorded so they are not re-litigated

* **The voice axis on parent's-frame copy is a deliberate fence extension.** `MET_MENTION`'s note
  says only the girl's-voice pools are temperament-indexed. The legible lines are the parent's
  frame and ARE indexed by her temperament – because what they carry is **his read of her**, so it
  varies with which girl is being read, not with how the parent speaks. Named at the pool; the
  ambiguous pools stay untouched.
* **No legible cell may assert a telling.** The heading is carried at every bond band, and at
  `strained`/`cold` she never spoke – so a line like «the easy telling is the whole of it» is false
  on a third of the ladder. Six drafts were re-cut to name a standing habit of hers plus the drawn
  read, both true of a week she said nothing. ⚠ The lint that catches this was itself unable to
  fail at first – its banned entry `the telling` missed `the easy telling`; widened to `telling`,
  the same arm reds.
* **`heard` is three-state and must stay so**: absent = nobody was teaching you, `false` = he was
  and this one got past, `true` = the legible arm. A blanket `false` on every raise breaks
  whole-row deep-equals in `tests/wave3-soft-surface.test.ts` (measured, 7 red).

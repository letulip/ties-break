---
type: plan
status: current
area: life
canonical: false
last-reviewed: 2026-09-12
---

# Wave-4 architect rulings – the seven the brief leaves to a builder to guess

The wave-4 brief (`life-wave-4-builder-2026-09.md`) rules every mechanic, but seven of its
sentences do not survive contact with the tree as written. Each ruling below is the brief's own
intent made buildable; where a ruling DEPARTS from the brief's literal words, the departure and
its reason are stated, so the next reader can overrule it knowing what it cost.

⚠ T2, T3 and T4 are bound by these. A builder that finds one of them wrong REPORTS it rather than
working around it – that is wave 3's standing rule and it produced that wave's best work.

---

## A. The told-late discriminator is THE `'met'` RECEIPT, not `endedWeek < knownWeek`

**Brief §T4 says**: told-late when `endedWeek < knownWeek`.

**Ruled instead**: told-late when, at the moment the ending is learned, **no `'met'` beat has been
raised for that episode**. The receipt already exists and is already the dedupe key –
`lifeLogOf(world).some(row => row.kind === 'met' && row.detail === episode.id)`
(`lifeBeat.ts`, `deliverKnownPartner`).

**Why the literal rule is wrong, and it is REACHABLE rather than theoretical.** The two readings
agree everywhere except `endedWeek === knownWeek`, and there the literal rule classifies the
episode as *known* (`knownWeek <= endedWeek`) – so T2's tick raises `'ended'` while the SAME tick's
`deliverKnownPartner` fires again on the same episode. Two beats in one week for one piece of news,
which is the exact outcome the brief forbids two lines above: «it must read as one honest late row,
not two contradictory beats».

⚠ **CORRECTED 12.09 BY T4's MEASUREMENT – the verdict stood, the arithmetic was one row off.** This
ruling predicted the pair would be `['ended', 'met']`. Measured, it is `['ended', 'ended']`: the
second row comes out of ruling B's told-late branch, which lives in the same function. The defect is
the same size and the same shape; only its name was wrong.

⭐⭐ **AND T4 MEASURED THE MORE DANGEROUS VARIANT, which this ruling had not foreseen.** A later
reader who applies the literal rule but KEEPS ruling B's two-kind dedupe – the combination somebody
would actually reach for – does not get a loud double row. It fails **quieter**: the card is raised,
delivery sees a receipt and skips, and **the week's news never reaches the album at all.** A
duplicate row is visible; a missing one is not. That is the stronger argument for the receipt
reading, and it was found by building the arm rather than by reasoning.

Reachability: `rollEnds` runs BEFORE `rollArrival`, so an episode cannot end in its own arrival week
and `endedWeek >= sinceWeek + 1`. `endedWeek === knownWeek` therefore needs only a lag >= 1 – drawn
at p 0.30 for an open girl (U[1..4]) and p 0.90 for a private one (U[2..12]) – and the hazard firing
on that one week. For a quiet girl that is ~0.42%/wk on a specific week; across a 200-career census
per temperament it is a certainty, not a corner.

## B. Delivery SCANS the episode list; it must stop reading the tail

`deliverKnownPartner` today goes `knownPartner()` -> `activeEpisode()` -> **the tail row, and only if
still open**. Wave 4 makes ended rows the normal case, so that path returns null for exactly the
episodes the told-late scene is about.

**Ruled**: walk `loveEpisodesOf(world)` for the FIRST row with `knownWeek !== null && knownWeek <=
week` carrying no receipt (`'met'` or `'ended'`) in the lifeLog.

**Why a scan and not a tail read with a guard.** Today's constants do happen to guarantee the
undelivered row is the tail – a new row cannot be appended before the old one is delivered unless
`cooldown <= lag - 1`, and the tightest pair is fiery's `12 <= 3`, false with nine weeks to spare
(sunny `26 <= 3`, quiet `39 <= 11`, deep `52 <= 11`). But that is an accident of two unrelated
constant tables, either of which the планка-3 session or step 6 may move. The scan costs one loop
and is the house idiom already: `pendingLifeBeat` takes the FIRST unanswered row for the same stated
reason – «a queue that answered its newest entry first would lose the oldest».

**The resulting split of responsibility** (this is the whole of T4's raise logic):

* `rollEnds` – writes `endedWeek`, sets `spiritShock`, and raises `'ended'` in the **told-now**
  register ONLY IF the `'met'` receipt already exists.
* `deliverKnownPartner` – scans as above. `endedWeek === null` -> the existing `'met'` path, byte
  unchanged. `endedWeek !== null` -> the **told-late** path: the told-late feed row and the `'ended'`
  beat in its told-late register, and **no `'met'` beat, ever**.

## C. The shock does NOT go through `weekPerturbation` – it is added after the scale

`accrueSpirit` computes `returned + weekPerturbation(...) * s.perturbationScale[intensity]`.
who-she-is §4's −22 / −34 are **already scaled**: they are one base of about −27.5 seen through the
two scales (−27.5 x 0.8 = −22.0, −27.5 x 1.25 = −34.4). A row inside `weekPerturbation` would scale
them a second time, to −17.6 / −42.5.

**Ruled**: `ECONOMY.spirit.shock.breakup = { steady: -22, intense: -34 }` – §4's own two numbers,
which win on drift (so −34, never the derived −34.375) – added to the week's movement on its own
line, AFTER the scaled perturbation. This is the brief's «applied through the standing perturbation
path with the intensity scale ALREADY inside the numbers – do not double-scale» made concrete: the
same weekly arithmetic, no second curve, no second multiplication. The comment says exactly this,
with the −27.5 reconstruction shown, so the next reader cannot re-derive the row into the wrong place.

## D. The clear bar reads the PLAIN baseline (68), not the effective one

`spiritShock` clears when `spirit >= s.baseline - 2`, i.e. 68 – never `baseline + attachmentLift - 2`.

**Why.** It is a question about HER recovery, not about who is in her life now. The effective
reading (73 while a new attachment is live) would hold a shock OPEN LONGER precisely because a new
romance arrived, which reads backwards on screen.

**And it must be a TESTED property that the shock cannot self-clear on its setting tick**, not an
arithmetic assumption: from a lifted 75 a steady girl lands 70 − 22 = 48 and an intense one
72 − 34 = 38, both far under 68 – but the lift and both shock constants are tunable, so the net
belongs in the test file, armed, and not in a comment.

## E. The ends multipliers are a NEW table, never the arrival one overloaded

`ECONOMY.life.temperamentMult` holds who-she-is §4's **arrival** column (sunny 1.2 / fiery 1.6 /
quiet 0.6 / deep 0.5). The **end** column is a different row of the same table (sunny 0.6 / fiery 1.5
/ quiet 0.35 / deep 0.9) and gets its own record – `endsMult`, beside `endsPerWeek: 0.012`. Reusing
the arrival record would make a fiery girl's break-ups 1.6x instead of 1.5x and a deep girl's 0.5x
instead of 0.9x, silently, with both numbers looking plausible.

## F. Corollary pinned by A + the call order: an episode cannot end in its own arrival week

`rollEnds` -> `rollArrival` -> ... -> `accrueSpirit` means the row does not exist when `rollEnds`
runs on `sinceWeek`. So `endedWeek >= sinceWeek + 1` by construction, and the shortest possible
attachment is one week. Pin it – it is the premise ruling A's reachability argument rests on.

## G. The `'ended'` read is RE-DERIVED from persisted facts, exactly as `beatWants` is

The four `'ended'` options are priced **match +3 / mismatch −3 / fix-it −1 / blame −4**, so the
space-vs-company read moves the PRICE as well as the wording – the `'met'` flip's shape exactly
(`MET_BOND_PRIVATE`: prices flip, «THE LABELS ARE UNTOUCHED BY THE FLIP»). The brief's «surfaced
ONLY in the prompt's and feed row's wording» is about what the PLAYER is shown, not about what the
table does; there is no meter on a button either way.

Three consequences, all forced:

1. **The read is drawn on the ENDING week, never on the raise week.** `seed:life:ends:<week>:react`
   is the sibling of `seed:life:ends:<week>`, and a pair keyed on two different weeks is two facts
   sharing a name. On a told-late episode the raise is seasons after the ending; the key stays
   `endedWeek`.
2. **It is re-derived, never stored.** `answerLifeBeat` re-validates the chosen option against the
   priced set (rule 3), so the price must be reconstructible at answer time from facts the world
   holds. `beatEndsRead(world, row)` is `beatWants`' twin: find the episode by `row.detail`, derive
   `rngFromSeed(`${seed}:life:ends:${episode.endedWeek}:react`)()`. The `'ended'` row's `detail` is
   therefore **the episode id**, like `'met'`'s – machine-readable, never a rendered sentence.
3. **`lifeBeatOptionsFor` stays the ONE road to a priced answer set.** It grows the kind; it does not
   grow a sibling. Whatever the signature becomes, `pendingLifeBeatOptions`, `buildLifeBeatPrompt`
   and `answerLifeBeat` all keep reaching the prices through it, and `tools/_lifeBeats.ts` keeps
   reaching them through `pendingLifeBeatOptions`.


## H. The space-vs-company read draws at the SAME 0.70, off the SAME openness register

Neither the wave-4 brief nor ruling G rules the read's distribution, and T4 flagged that a builder
reading only those two ships a **coin flip** – a silent tuning change wearing the clothes of an
absent constant. **who-she-is §4 does rule it**, in one sentence:

> **Wants weights**: open girls draw `'open'` / `'company'` at ~70%; private girls `'private'` /
> `'space'` at ~70%.

One sentence, one number, both pairs. `'company'` is the open register's read exactly as `'open'` is
its want. So `drawEndsRead` is `drawPartnerWants`' twin off `ECONOMY.life.wantsOwnRegister`, and
T4's implementation is **confirmed**.

⚠ **They share the constant because §4 states them as ONE rule about ONE axis – her openness** – not
because 0.70 happened twice. A later session that wants to move one without the other is making a
SPEC change, not a tuning change, and must say so in §4 first. The comment at the constant says this,
so the coupling cannot be dissolved by accident.

## I. The read surfaces on the HEADING and the told-late feed row, not inside her line

T4 had to place the read and asked for the call. **Confirmed as built**, on its own two grounds:

1. The heading is the **parent's frame**, and «what she seems to want» belongs there – she does not
   narrate her own needs. T6's enumerated matrix gives HER_LINE no read axis, which is consistent
   with that rather than an omission.
2. It is carried at **every bond band**, so the dry card at `strained`/`cold` carries it too. That is
   `MET_DRY`'s own argument: a rule only half the ladder can read is a hidden number.

⚠ Cheap to move – it is 4 heading cells plus 2 feed rows – so T6 or the owner's вычитка may relocate
it without touching the mechanic.

## J. Her `'ended'` line must stay READ-NEUTRAL, and that is now a lint rather than a habit

**Found by the architect's read of T6's matrix (12.09).** `ENDED_HER_LINE` is keyed
`Record<Temperament, Record<EndsRegister, PresenceCell>>` – **no read axis.** The heading DOES carry
the read (ruling I). So her line and the heading are two surfaces of one card that vary
independently, and a line that leans on space-vs-company contradicts the heading **half the time**.

⚠ **T6's sixteen lines are safe, and the reason is a distinction worth naming**, because it is what a
later editor has to preserve. The two lines that sound like a signal – fiery's «No, I don't want to
go through it» and deep's «I'd rather not say more» – are about **RECOUNTING**, not about solitude.
The read is about **PRESENCE**. «Don't make me explain it, but don't leave me alone» is one coherent
person, so those lines sit honestly under a `company` heading.

**What would NOT be safe**: «I'd rather be on my own», «just stay a while», «I don't want to be
alone» – any line taking a position on whether she wants somebody there. Under the opposite read the
card would then argue with itself, in a pool whose register-neutrality note already trained the
reader to think the axes were handled.

⚠ The pool's existing ⚠⚠ note covers REGISTER-neutrality only. It taught the reader that the axes
were thought about, which is exactly what makes the missing one easy to walk past.

**Ruled**: the invariant is stated at the pool AND enforced by a phrase lint in the wave-3
banned-tails style (`tests/helpers/bannedTails.ts` is the precedent – a list, a helper, and a test
that fails on a new pool member). The owner's вычитка is the most likely place a leaning line gets
written, so the lint must be live before he reads.

---
type: spec
status: current
area: engine/psychology
canonical: false
last-reviewed: 2026-09-16
---

# The form and the sparring partner – the third way down, unparked

The owner, 13.09, on being shown that the sparring partner is the one staff role with a free
number: «а вот это видимо как раз пришло время, надо сделать спеку и разложить по косточкам».

This spec UNPARKS [form-and-slump.md](form-and-slump.md) and builds on it without contradicting
it – that file keeps three jobs: the measured finding that motivates form (she cannot get worse
before 29), the scale yardstick (condition 100→60 ≈ 2.7–9.9 pp, `tools/winrate-read.ts`), and
the adopted driver (23.08, Codex review, confirmed): **results relative to pre-match
expectation, never raw wins and losses**. The parking condition is dissolved by its own terms –
«form ships only WITH the psychology surfaces that give it meaning», and those surfaces now
exist: `spirit` and the Mood word shipped with waves 1–4, the coach's sentence machinery is
live, and the psychologist's year-focus menu (wave 5, in build) is exactly the shelf his slump
focus goes on. Money anchor for the seat:
[team-economics-2026-09](../research/team-economics-2026-09.md) §4.

⚠ Everything numeric below is a PROPOSAL for the bench (invariant 5, predicted-first); the
SHAPES are what this spec asks the owner to rule.

---

## 1. The number

`world.form` – tenths, **0-centered, clamped to [−10, +10]**, backfill 0 = neutral, so every
migrated career and every stored replay is byte-identical until something moves. One weekly
update in the tick beside condition's, **zero draws on any stream** – a deterministic
accumulator over facts the world already holds (results ledger + calendar), which is the
strongest answer to invariant 2. `seed:form:<week>` stays RESERVED and unused – if the owner
ever wants «a slump that arrives rather than accumulates», the key is named; v1 recommends
against the dice (O4).

Two inputs, two channels – and the split is load-bearing, because each channel later belongs to
a different specialist:

**1a. The results channel (the slump's home).** Per completed competitive match, the residual
against the expectation the odds ring already computes: on a win `+G × (1 − p)`, on a loss
`−G × p`, `p` = her pre-match win probability, `G = 1.5` (proposal). Beating a favourite moves
her; losing as one costs her; doing what the ring expected barely registers – the adopted
driver, made arithmetic. Self-centering by construction: a career that performs exactly to
expectation accumulates nothing.

**1b. The rhythm channel (the rust's home).** Weeks WITHOUT a completed competitive match, once
the gap exceeds `rustAfterWeeks = 3` (proposal): drift `−0.4/wk` toward `rustFloor = −4`
(proposal) and never below it – rust dulls, it does not destroy. The channel reads the calendar
the parent already controls through entries – influence stays INDIRECT, which is the «not a
second condition» fence from the parked spec, kept.

**1c. The return to neutral.** Mean reversion `0.5/wk` toward 0, always, both signs – applied
first, off last week's value (the order lesson `accrueSpirit` already learned: return first,
then this week's inputs). Half-life of a deep slump ≈ a month of ordinary results – «a mood,
not a season» unless the results keep feeding it; a purple patch decays at the same honest rate.

## 2. The one reader

Form modulates **effective composure at `MatchPlayer` build time** – the parked spec's own
choice, kept verbatim, because it is the cheapest honest seam: `composureEff = clamp(composure +
form × K)`, `K = 0.6` (proposal → ±6 composure points at the clamps), applied in
`kidMatchPlayerFor` beside the condition and spirit factors, optional-absent ⇒ neutral, so every
pure caller and stored replay is untouched. The radar, the box score, the live commentary and
the coach's read all INHERIT it with zero new surfaces – her serve wobbling in a slump is the
same composure the commentary already knows how to talk about.

* **Scale, against the yardstick**: ±6 composure points is smaller than the condition floor's
  worth at every point – the bench prices the realised pp and the corridor proposal is
  **[0.5, 4] pp** at the clamps: it decides close matches, never a career (form-and-slump §1's
  bound, kept as law).
* **`potential` and `skills` never move** – form is STATE. The monotone development contract,
  every fixture and every bench anchor survive untouched.
* **The kid only, v1** – rivals do not carry form (O6; the parked spec's §4.4 cost note stands:
  measure the 199 + 1,600-scalar bill before assuming it is cheap).

## 3. The fences – what form must never touch or double-charge

* **Not a second condition**: driven by results and rhythm, steered only through entries –
  no dial, no screen, no doctor.
* **The spirit fence**: `spirit` is life weather through its OWN factor; form is tennis state
  through composure. No cross-writes in either direction – a breakup does not move form, a
  slump does not move spirit; the two multiply at the seam and the bench prints the COMBINED
  floor (condition 0.55 × spirit 0.90 × form-at-clamp) so the worst week is a measured number,
  not a surprise.
* **Temperament stays out** (who-she-is §3's fence: no direct tennis) – intensity does not
  scale residuals, openness does not read the ledger. Who she is reaches a match through
  spirit alone, bounded, same as ever.
* **The knock/injury thread**: NO direct link (O5 recommendation) – and the honest interaction
  arrives free: an injury empties the calendar, the empty calendar rusts the rhythm channel,
  and her first weeks back feel it. «Coming back is hard» emerges from two systems doing their
  own jobs – which is what the parked spec's §4.5 asked for, one story from two threads.
* **No number on any surface** (the fog rule): form speaks only through the coach's sentence –
  he is «the eye», and `coachRoomNote`'s machinery already knows how to say a thing without
  quoting it («She is striking the ball clean» / «She needs matches under her» – drafts, his) –
  and through the match itself.

## 4. The sparring partner – the seat, and exactly one channel of the number

**The fence sentence first, because it is the design**: **the slump is the psychologist's
patient; the rust is the sparring partner's** – the results channel and the rhythm channel,
split between two hires the way prevention and recovery split the physio from the masseur. A
seat that touched both would be the two-levers-one-number failure the staff layer was built to
avoid.

* **What he does**: while hired, the rhythm channel's drift is cut by rung –
  `×0.6 / ×0.35 / ×0.15` (proposals) – practice weeks stand in for match weeks. He does NOT
  touch the results channel, the reversion rate, or anything else: a slumping girl who plays
  every week gets nothing from him, and the bench's never-fired corridor prints exactly that
  share (the academy-fares watch).
* **The receipt** (the travelling-team §4 law – no sentence, no seat): the coach's line while a
  gap is open and covered («The week off did not dull her») and one no-cents feed line at her
  first match back from a covered gap ≥ `rustAfterWeeks` – draft: «Her first match back did not
  look like a first match back». Both his words, drafts.
* **The money** (research anchor: $50–80k/yr + full travel): rungs **$500 / $900 / $1,400 a
  week** (proposals – a college hitter · a journeyman pro · a top-100's sparring partner), and
  ~~**he TRAVELS, always** – travelling is the job, so no travel switch and no remote mode~~; the
  fare rides `staffSeatFareCents` asked once more (the round-22 rule: never a second travel
  model).

  ⭐⭐ **OVERRULED BY THE OWNER, 15.09.2026 – HE GETS THE SAME TRAVEL SWITCH AS EVERY OTHER SEAT.**
  His words: «серьезно? даже выбора нет? а если семья в начале пути и на w15 не за что платить? мне
  кажется это странно, тем более, что у остальных есть галочка "ездит"». He is right twice over.
  ECONOMICALLY: a family on the w15 rungs cannot carry a second fare, and a seat that forces one is a
  seat that career can never hire – which is not a design, it is an exclusion. AND IN THE FICTION: a
  hitting partner at the home club is the ordinary shape of this job for a junior; the travelling
  version is what a top-100 buys later. So the switch is the same `staffSeatFareCents` switch the
  masseur already has, and it earns its keep rather than being symmetry for its own sake:

  * **NOT travelling** – he covers the weeks she is at home, which is where most rust is made (an
    off-season, a layoff, an empty stretch of calendar). Cheap, and it is the junior shape.
  * **Travelling** – he covers the road weeks too, where a girl between matches at a two-week swing
    otherwise goes cold. The expensive shape, and what the research's $50–80k + travel anchor prices.

  ⚠ The rung multipliers above are therefore the CEILING of what he cuts, not a flat promise: a seat
  that does not travel cannot cut the drift of a week it was not at. The bench measures BOTH stances
  rather than one, and the owner's numbers land on that table. **No results share** – research and our union agree; `staffResultShareBps` stays
  `'coach' | 'masseur'`.
* **The shape otherwise**: the masseur's twin – pro-career unlock (`activeLadderOf === 'wta'`,
  the ruled table's family), weekly salary in cents, suspend-not-cancel at college and family
  weeks, hire/fire any week, no signing fee, a nameless role card (no roster – the coach
  market's individuality is the coach's; a second roster would double UI for no decision), the
  third `StaffMember` entry in `SupportStaffTab`.

## 5. The psychologist's slump focus – the shelf is already built

Wave 5 ships the year-focus menu; form's results channel is a LATER focus on that shelf
(working name «Out of her head»): while held and `form ≤ slumpBand`, the mean reversion gains
`+0.3 / +0.5 / +0.7`/wk by rung (proposals) – slumps end sooner, purple patches are untouched
(he treats the hole, he does not manufacture the high). Ships in wave F3, AFTER both form and
wave 5 are live; the focus-menu machinery takes him as one more row (O2's ruling: every focus
at every rung). The 10.08 spec's whole argument – «form gives the psychologist something to
do» – lands here, two waves late and exactly as written.

## 6. Schema and RNG

One bump at F1: `world.form: number` (backfill 0). One more field at F2 beside it if F2 lands
separately: `sparringHired: boolean`, `sparringRung: 0 | 1 | 2` (backfills false/1). Both moves
are the full three-part law + `e2e:fixtures` regen; version numbers re-counted at land (the
standing rule). RNG: zero draws anywhere in F1–F3; `seed:form:<week>` reserved-unused; the
frozen capture cannot see any of it – but the frozen CAREERS re-walk with form live (their
match results shift where form ≠ 0), so F1 carries a full per-key re-stamp by the protocol,
`rngMain` byte-identity the STOP condition as always.

## 7. The benches (all predicted-first, misses printed)

* **The scale arm**: `tools/winrate-read.ts` grows a form column – realised pp at form −10/−4
  (rust floor)/+10 inside the [0.5, 4] corridor, printed beside condition's and spirit's rows,
  plus the COMBINED floor.
* **The slump census**: distribution of slump depth and duration per policy arm (care/grind ×
  entry-rich/entry-poor), the half-life measured against §1c's month, «weather not scar»
  proven: post-slump paired deltas < 1×SEM once form returns to band.
* **The rust pairs**: forced layoff at a fixed week (tool-side poke, the wave-4 precedent),
  with/without the seat per rung – first-five-matches-back paired win-rate delta monotone in
  rung and > 2×SEM per step, or the rung is re-priced (the masseur §4 law).
* **The never-fired corridor**: paid weeks with no open gap, printed per rung.
* **Fairness**: the ±1.5 pp lifetime corridor re-read on birth cohorts – form reads results
  and calendar only, so any drift through it is a bug, and the corridor is the alarm.
* **Input-independence**: identical entry policies under one seed ⇒ identical form traces;
  MAIN untouched (the capture pin).

## 8. Waves, sized

| wave | ships | size |
| --- | --- | --- |
| F1 | `world.form`, both channels, the reader, the coach's two sentences, the scale/census benches, schema | **M** |
| F2 | the sparring seat – engine leaf, money, card, receipts, rust pairs | **M** |
| F3 | the psychologist's «Out of her head» focus row + the rival-form measurement gate (§4.4's question, measured then ruled) | **S–M** |

Sequencing recommendation: after wave 5 lands and the spotlight wave ships (the committed
pipeline holds); F1 is self-sufficient and legal to build the moment he wants it – the old
parking condition is satisfied. F1 and F2 can be one branch if a single builder takes both.

## 9. Open questions for the owner – each with a recommendation

| # | question | recommendation |
| --- | --- | --- |
| O1 | the residual gain `G`, the reader `K`, and the [0.5, 4] pp corridor | bench-first: run the scale arm, then his word – the corridor is the ruling, the constants serve it |
| O2 | is form visible anywhere beyond the coach and the match? | no – no number, no Mood word (that is spirit's), no diary line in v1; the coach's sentence is the one window (the fog rule) |
| O3 | does the radar show modulated or base composure? | modulated – the radar is the coach's read of TODAY's her, and the fog rule guards ceilings, not state; a slump the radar cannot see would make his sentence unbacked |
| O4 | slump as dice («arrives») or accumulator? | accumulator, deterministic, v1 – legible and benchable; `seed:form:<week>` stays reserved if drama is ever wanted |
| O5 | any direct knock/injury → form link? | none – the interaction already emerges through the empty calendar, and a direct link would double-charge the same misfortune |
| O6 | do rivals carry form? | not in v1 – measure the population cost at F3 and rule then (the parked spec's own caution) |
| O7 | sparring rungs and prices ($500/$900/$1,400, drift cuts ×0.6/×0.35/×0.15) | proposals for the rust pairs; the research band ($50–80k/yr + travel) is the anchor |
| O8 | when do F1–F3 run? | after the committed pipeline (wave 5 + spotlight); pull earlier only if his playtest wants the slump story sooner |

**Done when:** O1–O8 are ruled, the scale arm's corridor is accepted, and the builder brief for
F1 points here.

⭐⭐ **RULED 16.09.2026 IN ONE PASS – «все по твоим рекомендациям».** Every recommendation in the
table above is now the ruling, so this gate is OPEN and F1's builder brief may point here. The eight
are restated in `docs/decisions.md` under 16.09 so they are findable from the dated log as well.

⚠ **O1 keeps its shape rather than becoming a number.** What he ruled is the METHOD: the
[0.5, 4] pp corridor is the ruling and `G` / `K` are its consequence, fitted by the scale arm. A
builder that ships a constant without that arm has not implemented O1, it has skipped it.

⭐ **AND THE ORDER IS NOW DEFENSIBLE RATHER THAN ASSERTED, on round 42 #34's measurement.** F1's only
reader is `composureEff`. Before #34 composure was worth **0.4–0.6 pp** of match win rate per twenty
points, so a ±6-point slump would have moved about **0.15 pp** – a slump nobody can feel, and the
third decorative mechanic that round found. After #34 (+20 composure = **+4.1 pp**, measured against
his ruled +4 pp target) the same ±6 points are worth several times that, and the slump becomes a
thing the player fights. **#34 → F1 → F2.**

## 9a. Does the psychologist travel? – the owner's 16.09 question, parked with an answer

He refused the #46 copy draft on a fact and the correction is the better reading:

> «психолог не ездит, но онлайн созвоны вполне может делать. Хотя, может и ездить он тоже может, но
> тогда надо подумать, на что он может качественно влиять в поездке и нужно ли это делать.»

**The engine already agrees with the first half.** `psychologistWorksThisWeek`'s own note says the
retainer «runs on a tournament week exactly as the coach's does» and that he works through a layoff
because «an injury is when the head needs the **call** most». There is no fare, no stand-down and no
gap: this is the one seat whose work never pauses, which is a positive thing to say on screen rather
than an absence to apologise for.

**If a switch is ever added, there is exactly one thing it can honestly buy, and the fence already
names it.** §4's fence sentence is **«the slump is the psychologist's patient, the rust is the
sparring partner's»**. So a travelling psychologist would make a LOSS cost less form – he is in the
room on the night it happens rather than five days later on a call.

⭐ **That shape is worth writing down because it is the mirror of the seat next to it.** The masseur
in the travelling state pays most on a DEEP RUN and nothing on a first-round exit; a travelling
psychologist would pay most on a BAD WEEK and nothing when she wins. Two travelling seats paying on
opposite outcomes is a thing a player can read without a manual, and it is the reason to prefer this
over the obvious alternative.

⚠⚠ **THE OBVIOUS ALTERNATIVE IS REFUSED, AND IT SHOULD BE REFUSED OUT LOUD.** The tempting design
after round 42 #34 is a travelling psychologist who lifts composure ON THE DAY – straight into the
pressure set #34 just built. It is refused because it would be **the first thing in this game that
buys match odds directly with money**; every other travelling seat buys development or recovery and
lets the odds follow. That is a fence worth keeping, and breaking it is a decision that deserves its
own conversation rather than arriving inside a copy fix.

**RECOMMENDATION: do not build the switch now.** Two reasons, one of them this round's own lesson:

1. **It cannot be priced before `world.form` exists.** The effect is a discount on a number that does
   not yet exist, so any rung price would be guessed – which is invariant 5's exact prohibition.
2. ⚠ **A switch whose effect is invisible on a good week is the decorative-mechanic trap this round
   has now found twice** (composure before #34; the slump itself before #34). The honest sequence is
   F1 first, then measure how much form a loss actually costs, then price the seat against that
   measurement. **So it belongs in F3 beside the psychologist's own slump focus, and not earlier.**

Until then the copy says the true and positive thing: no fare, and the sessions follow her.

---

## 10. SHIPPED 16.09.2026 – F1 and F2, predicted vs measured

Schema **v80** (`world.form`; the three sparring keys finally gain their reader and needed no key of
their own). Instrument `tools/form-bench.ts` (`npm run bench:form`), 8,000 paired sims an arm for the
match sections and 18 careers × 624 weeks (12 seasons) for the census and the rung table. Tests:
`tests/round43-form.test.ts` (27 cases, eight mutation arms) and
`tests/component/sparring-card.test.ts` (10 cases, two arms).

### 10a. O1 – the corridor is the ruling, and `K` is its consequence

The arm was proven before it was trusted: clamp-to-clamp **2.46 pp** on the shipped `K`, against
**28.97 pp** on an absurd `K × 10`. Then the sweep, same opponents, same seeds, only `K` moving:

| `K` | composure at the clamps | peer | #20 | #60 | #150 | worst | corridor |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | --- |
| 0.4 | ±4.0 | 1.27 | 1.11 | 0.74 | 0.77 | **1.27** | inside |
| **0.6** | **±6.0** | 1.64 | 1.53 | 1.22 | 1.01 | **1.64** | **inside – shipped** |
| 0.8 | ±8.0 | 2.25 | 2.19 | 1.71 | 1.24 | **2.25** | inside |
| 1.0 | ±10.0 | 2.76 | 2.45 | 1.94 | 1.51 | **2.76** | inside |
| 1.2 | ±12.0 | 3.12 | 3.01 | 2.47 | 1.84 | **3.12** | inside |

⭐ **THE SPEC'S OWN PROPOSAL SURVIVED ITS OWN TEST, which is worth saying because it usually does
not.** `K = 0.6` is shipped: it is inside the corridor against every opponent, and it is the value
§2 proposed. ⚠ **AND EVERY ROW IS INSIDE**, so the corridor does not pick a single number – it
admits a factor of three. The shipped value is the one that also agrees with round 42 #34's own
measurement (+20 composure = +4.1 pp ⇒ ±6 points ≈ ±1.2 pp), which is the second constraint the
corridor alone does not carry. **Moving it is one line and the sweep is the table to move it
against.**

⭐⭐ **AND #34's CASE FOR THE ORDER IS CONFIRMED RATHER THAN MERELY ASSERTED.** §9 predicted that
before #34 a ±6-point slump would have moved «about 0.15 pp» and that after it the same points are
worth «several times that». Measured: **1.64 pp**, eleven times the pre-#34 figure. The slump is a
thing the player fights.

### 10b. The census – where a career's form actually lives

| | p1 | p5 | p25 | median | p75 | p95 | p99 | min | max |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| all weeks | −5.8 | −4.0 | −1.2 | −0.4 | 0.0 | +1.9 | +3.3 | −7.6 | +6.3 |

18.2% of weeks are at exactly neutral · 18.2% in a slump (≤ −2) · 1.6% striking it clean (≥ +3) ·
7.7% at or past the rust floor · **0.0% within one point of a clamp.**

⚠ **SO THE CORRIDOR PRICES A PLACE NO CAREER VISITS, and that is the honest reading of §10a rather
than a complaint about it.** `G = 1.5` puts the lived band at roughly [−4, +2] of a possible ±10, so
the swing a real career feels is about **0.5–0.7 pp**, not 1.64. Two things follow and both are his
to rule: the clamps are a safety rail rather than a destination, and **if the slump should bite
harder the lever is `G`, not `K`** – `G` decides how far in she travels, `K` what a point is worth
when she gets there.

The coach's eye, per career per season: **0.28** «She is striking the ball clean.» and **0.52** «She
needs matches under her.» – a remark rather than a subscription, which is O2's own ask.

### 10c. O7 – the rung table, isolated

⚠⚠ **THE OBVIOUS ARM WAS THE WRONG ARM AND THE BENCH RAN IT FIRST.** Hiring the seat on a LIVE career
and comparing mean form made the number **worse** at every rung, monotonically in the price (−0.58
with nobody → −3.69 at the top rung). The seat was not failing; the WALLET was. A salary on a
junior-era family buys fewer tournaments, fewer tournaments are more matchless weeks, and more
matchless weeks are more rust – `elite-retainer-2026-09` §9's path divergence, one wave on. **So the
calendar is held fixed:** each career is walked once with nobody hired, the engine's own residuals
and gaps are recorded, and every rung replays `accrueForm` over that same calendar. Only `rustCut`
differs between rows.

| arm | mean form | slump weeks | floor weeks | vs no seat | drift saved |
| --- | ---: | ---: | ---: | ---: | ---: |
| no seat | −0.488 | 14.2% | 5.8% | – | – |
| A college hitter · home | −0.392 | 11.8% | 4.6% | +0.096 | 19.7% |
| A college hitter · travels | −0.380 | 11.4% | 4.3% | +0.108 | 22.1% |
| A journeyman pro · home | −0.285 | 9.1% | 3.5% | +0.203 | 41.6% |
| A journeyman pro · travels | −0.255 | 8.4% | 3.0% | +0.233 | 47.8% |
| A top-100 partner · home | −0.176 | 7.0% | 2.2% | +0.312 | 63.9% |
| A top-100 partner · travels | −0.120 | 5.7% | 1.4% | +0.368 | 75.4% |

⚠⚠ **THE THREE CUTS ARE 0.75 / 0.5 / 0.25 AND NOT §4's 0.6 / 0.35 / 0.15, AND THE REASON IS A
MEASUREMENT.** Form is kept in TENTHS. At a base drift of 0.4/wk the proposed cuts give 0.24 / 0.14 /
0.06 a week, and the accumulated value is rounded to a tenth every week – so 0.14 and 0.06 **both**
ratchet the number down by exactly one tenth and **the top two rungs were the same seat**, measured
identical to the thousandth (+0.312 / +0.312). That is the masseur §4 law broken. The shipped cuts
are exact in the unit the number is kept in (0.3 / 0.2 / 0.1 a week), so the floor is reached in
**13 / 20 / 40** matchless weeks against **10** with nobody hired. ⚠ The top rung is therefore a
weaker cut than §4 proposed; a ladder whose top two rungs differ by a rounding artefact is worse than
a shallower one.

### 10d. The travel arm, against round 42 #48's 89.4%

| rung | home | travels | the home stance reaches | #48 predicted |
| --- | ---: | ---: | ---: | ---: |
| A college hitter | +0.096 | +0.108 | **88.9%** | 89.4% |
| A journeyman pro | +0.203 | +0.233 | **87.0%** | 89.4% |
| A top-100 partner | +0.312 | +0.368 | **84.7%** | 89.4% |

⭐ **ROUND 42 #48's PREDICTION IS CONFIRMED and §4's own first draft stays overruled.** «Travelling is
the job» would have been the expensive shape of a seat whose value is almost entirely at home. The
default stance is **stays home**, the switch is the luxury, and the card says which.

### 10e. What it costs – the live arm, where a price is honest

| arm | salary/season | fares/season | total | research $50–80k | weeks billed of 52 |
| --- | ---: | ---: | ---: | --- | ---: |
| A college hitter · home | $21,137 | $0 | $21,137 | outside | 42.3 |
| A college hitter · travels | $25,653 | $1,006 | $26,659 | outside | 51.3 |
| A journeyman pro · home | $44,275 | $0 | $44,275 | outside | 49.2 |
| A journeyman pro · travels | $46,542 | $144 | $46,686 | outside | 51.7 |
| **A top-100 partner · home** | **$69,656** | $0 | **$69,656** | **inside** | 49.8 |
| A top-100 partner · travels | $72,560 | $0 | $72,560 | **inside** | 51.8 |

⭐ Round 42 #48 predicted the not-travelling top rung at **$72,800** and that it would be the only
rung inside the band; measured **$69,656**, and the 2.2 weeks a season he is stood down for are the
away weeks the switch exists to cover. ⚠ The fares column is small because a bench career reaches
paying rungs late; it is not zero, and the switch's real bill on a long professional career is the
number #48 quoted.

### 10f. Invariant 2, and the frozen careers

**`rngMain` is byte-identical on all three frozen careers** – `d84bcbf0c481` / `1dbff28caca2` /
`aebc8101d6df`, the fingerprints this file's ladder has carried for fourteen waves. Zero draws on any
stream (O4); `seed:form:<week>` stays reserved and unused; the frozen MAIN capture (41550 /
e6b0c709) is untouched by construction. The per-key diff was taken FIRST, control = this tree with
the weekly pass neutralised in place: **3 / 34 / 33 keys of 94 moved**, and the narrow cell (25k
middle, grinder) moved `form`, `events` and `nextEventId` alone – the coach's eye and nothing else.

⚠ **`PRE_V80` IS THE FIRST RUNG IN `coachTravelEdgeFixtures.ts` WHOSE THREE CELLS ARE NOT THE
PREVIOUS VERSION'S LIVE CONSTANTS.** A peel drops a key; it cannot replay a career without the
mechanic, and this mechanic reaches every career that plays a match. The rung still proves what it is
for: `form` is the only key v80 appended and it is the last of `createWorld`'s literal.

### 10g. What was NOT built, and why

* **O3 – THE RADAR'S MODULATED COMPOSURE, and it is the one ruling this wave did not take.** The
  one-line implementation (`shownSkill` adding the composure delta on that axis) was built, measured
  and REVERTED: it breaks four shipped honesty contracts of the radar's own geometry –
  `|shownValue − skills| ≤ band`, `|startValue − born| ≤ band`, `startValue ≤ shownValue`, and
  `ceilingLo ≥ shownValue`. Satisfying all four needs the composure axis's reported band widened by
  the delta, BOTH contours shifted and the ceiling haze raised with them – which changes the shape of
  a picture he has already approved and weakens four guarantees his own fog design rests on. **That
  is a redesign rather than a ruling, and it is his call.** ⭐ The cheap version, if he wants the slump
  visible on the radar at all, is the BAND alone: «the coach is less sure of her nerve when she is
  out of form» is a true sentence, a one-number change, and it costs no contract.
  `formComposureDelta` is exported and has exactly one caller, so the reader is one line whenever he
  rules.
* **§5's «Out of her head»** – the psychologist's slump focus is F3's by the spec's own wave table.
* **O6, rivals** – no form on the cohort, ruled, and the population cost is F3's measurement.
* **§9a's travelling psychologist** – refused here as it is there: it cannot be priced until form's
  loss cost is measured, which is now possible and is F3's.
* **The receipt line's own fire rate** is unmeasured: `sparringComebackGap` reads the pruned results
  ledger, so a comeback from a layoff longer than 52 weeks leaves one row and the sentence stays
  silent. A receipt may under-fire; it must never over-claim.

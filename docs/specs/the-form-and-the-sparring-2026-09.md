---
type: spec
status: draft
area: engine/psychology
canonical: false
last-reviewed: 2026-09-13
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
  **he TRAVELS, always** – travelling is the job, so no travel switch and no remote mode; the
  fare rides `staffSeatFareCents` asked once more (the round-22 rule: never a second travel
  model). **No results share** – research and our union agree; `staffResultShareBps` stays
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

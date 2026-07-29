# Coach tiers — a ladder instead of a boolean

The owner's fix for a measured wall, with his own price research (29.07) folded in and converted to
what our engine actually bills.

## 1. The wall this exists to close

`bench:econ`, 120 seeds, 14→18: **25k middle + hired coach goes bankrupt in 120 careers out of 120,
at week 61.** The owner's ruling was that this is not a balance bug and gets no patch — it closes
when the coach becomes a ladder of tiers at different prices instead of one all-or-nothing hire, and
when the weekly training split feeds the coaching bill as well as the development rate.

Today `coachSetup` is `'parent' | 'hired'` and the bill is a weekly band: parent $120–400,
hired $250–700, scaled by the family's wealth corridor. Coaching is ~$119k of a 4-year wealthy
career — the single largest line in the game.

## 2. The owner's research, and what survives conversion

His figures are **per hour, individual lessons, big-city rate**. Ours is a **weekly** bill. The
conversion is the whole job, and it is where the design lives.

His per-hour ladder for the ages we simulate:

| age band | Budget | Middle | High | Elite |
| --- | --- | --- | --- | --- |
| 12–16 (development) | $30 | $50 | $80 | $120 |
| 17–22 (pro) | $35 | $60 | $100 | $160 |
| 22–28 (peak) | $40 | $65 | $120 | $200+ |

A junior at this level trains **3–5 sessions a week**. At four hours, the 12–16 row becomes a weekly
bill of roughly:

| tier | $/h (12–16) | ×4 h/wk | against today's model |
| --- | --- | --- | --- |
| Budget | 30 | **$120** | the bottom of today's `parent` band |
| Middle | 50 | **$200** | inside today's `hired` band |
| High | 80 | **$320** | inside today's `hired` band |
| Elite | 120 | **$480** | *above* today's `hired` ceiling |

So today's single `hired` band ($250–700) is a smear across three real tiers, and its midpoint
(~$475) is an **Elite** coach. That is the wall, stated in his own numbers: the middle family was
never choosing a coach, it was being handed the most expensive one in the game.

**Self-coaching stays** as the rung below Budget — the parent on the court, free, and the reason
`coachParent` exists at 0.82.

### The training split has to feed the bill

This is the half the current model is missing and the half that actually rescues the middle family.
`plan.train` (60 → 85) already scales the development rate; it must also scale **hours**, and hours
are what the coach charges for. Roughly 3 → 6 sessions a week across the slider.

That gives the family two dials instead of none: **which coach, and how much of him**. A High coach
at three sessions ($240/wk) is affordable where an Elite at six ($720) is not, and the choice reads
as a real one rather than as a difficulty setting.

### Age raises the price

His table does, and the reason is real: the same hour of a better coach's time is worth more to a
seventeen-year-old than to an eleven-year-old, because what is being coached has changed. A simple
multiplier by age band, following his rows. Note his own caveat — 17–22 and 22–28 barely differ, and
29+ holds level because the work becomes maintenance.

### The wealth corridor comes OFF coaching

Today the corridor scales the coaching bill by family background — the fiction being that poorer
families use cheaper coaches. **The tier now says that explicitly**, so keeping the corridor would
charge it twice: a working family would pick Budget *and* get a discount on it.

A coach's rate is a market rate. It is the same number for everyone; what differs is who can pay it.
That is the same argument that keeps prize money outside the corridor
(`adult-tour-and-endings.md` §3), and it makes the two families' difference legible: they are not
paying different prices, they are buying different things.

## 3. Where I would not follow the research yet

**Group sessions** ($20–35 vs $50+ individual) are a *format* axis crossed with the tier axis. Two
axes is a lot of machine for one number; the honest simplification is that the Budget tier's fiction
IS the group session — a coach who takes four kids at once is what $30 an hour buys. Worth revisiting
if the coach market screen ever wants a second dimension.

**Hidden specialisations discovered through trial lessons** is a genuinely good mechanic and a
different feature. What screen T already designs is **fit against her play style** — the great / good
/ off pills — which we can source from data we have today. Discovery-by-trial wants an event system
and a memory of what the parent has learned; backlog.

**The coach events** he sketches are both worth having, and one of them is already shipped: "an elite
coach invites her for a trial, $5,000, 60% chance of an academy contract" is the academy scholarship
we built, seen from the other side. The other — "five sessions a week instead of three, progress
doubles, injury risk rises" — is exactly the training-split dial above, and it should be a *dilemma
the coach raises* rather than a second mechanic.

**Court rental as its own line** ($10–30/h) is real and we already charge it for practice matches.
Adding it to coaching too would be double-counting unless the coaching bill is explicitly
"coach only"; simpler to keep the tier price inclusive and say so.

## 4. What has to be measured

- `bench:econ`, 120 seeds, 14→18, before and after. The claim to test is specific: **25k middle
  stops being 0/120** without 8k working becoming comfortable.
- The development spread. `coachParent 0.82 / coachHired 1.15` becomes four values plus self-coached;
  the spread between the cheapest and the dearest career should stay near the factor of two that
  Phase 4 measured, or the ladder has quietly become the only lever that matters.
- Draw-count discipline: the coaching bill is drawn once per tick with `pickInt`. Whatever replaces
  it must still spend **exactly one draw**, or the frozen MAIN capture moves.

## 5. Open for the owner

- The four tier prices in *our* units (weekly, at four sessions) once the bench has spoken.
- Whether changing coach mid-season costs something. Real academies charge notice; a free swap makes
  the choice weightless.

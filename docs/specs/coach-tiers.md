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

> ### ⚠ REVERSED ON 08.08 – the court IS its own line now
>
> The paragraph above is what shipped, and the owner read the consequence off his own wallet:
>
> > «на неделях всё еще списывается какая-то рандомная сумма и как будто не за тренера, мне кажется
> > нам нужно отдельной строчкой списывать тренера, а отдельной рент залов и прочего»
>
> **What the ruling missed is who it charged.** "Keep the tier price inclusive and say so" is a fine
> simplification for a hired rung, but `self` is priced at *exactly* the court rental – that is the
> whole design of the rung, and the argument for it is three paragraphs up in §2. So a self-coached
> family's line labelled **Coaching** was 100% court rental for a parent who works free, and the game
> had no way to tell it otherwise. For everyone else the number was coach plus court in one figure
> that nobody could decompose, including us.
>
> **"Simpler" was doing the work, and it turned out to cost more than it saved.** The reversal is a
> *partition*, not a re-price: the facility line is the court rental this section already quotes and
> the coach line is what is left of his rate above it, so `coach + facility` is byte-identical to the
> number the ledger charged before – measured, 3,120 weekly figures across 15 corridor/rung arms, zero
> mismatches. The tier price is *still* inclusive of the court. It is simply now inclusive **visibly**.
>
> **Double-counting was the right fear and it does not arise**, because the split subtracts rather than
> adds: nothing new is charged and the practice-match court fee is untouched (it is a different court on
> a different day, booked by the planner and billed under `practice`).
>
> The corridor needed nothing added – it multiplies the whole bill, so it multiplies the court with it,
> which is the owner's own second ask («с разным тиром для разного уровня семей») already satisfied by
> arithmetic that was in the model. Priced and measured in
> [split-the-bill-2026-08.md](split-the-bill-2026-08.md); `WorldEventCategory` gains `facility` at
> save schema v44.

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

---

# Round 2 — the owner corrects the model (29.07)

## The wealth corridor goes back ON coaching, and I had the reason wrong

I argued the corridor should come off because the tier already expresses "poorer families buy cheaper
coaches", so keeping both would charge the difference twice. The owner's model is better and it is
not the same claim:

> «для 8к все тиры **[в их академии]** стоят согласно их коридору, для 25к — свои цены, для 120к
> **[в их премиальных и элитных местах]** стоят дороже всего»

The corridor is not a discount for being poor. It is **the market she trains in**. The same rung of
coach costs different money in a working-class club, an ordinary academy and a premium one — because
the court, the city and the queue for that coach's time are different. A family does not get a
cheaper Middle coach because it is poor; it hires the Middle coach *its academy has*.

So **every tier is priced in every corridor**, and both dials are real: which rung, and which world
you are hiring in. It also means the wealthy family pays MORE for the same rung, which is right and
which the previous model got backwards.

## Hours are 4 / 5 / 6

The owner's numbers, replacing the 3/4/6 anchoring: `plan.train` light / balanced / grind means
**4, 5 and 6 sessions a week**, and an hour is a session. The price table's per-hour figures are
unchanged; the weekly bill is `rate(tier, age, corridor) × hours(plan)`.

## A roster, not a rung

Roughly **four coaches per tier — one per play style**, each carrying the family's corridor price.
That is what makes screen T a market rather than a menu: at any tier the parent is choosing between
a coach who fits her game and one who does not, at the same price, and the fit pill (great / good /
off) is the whole point of the choice.

## Screen T ships in THIS wave

No longer deferred. The Coach Market is the surface the whole slice hangs off, and every choice this
model adds is unreachable without it. It is designed in `docs/design/` (screenshot `T-coach-market`,
README §T) and its components are listed there — tier section headers with a dot, a count and a
price range, the fit pills, the budget meter, and the three price-action states (hire / current /
over budget).

## Elite may be gated, not just expensive

Owner: «элит, кстати, могу вообще стать доступны для туров, как вариант и стоит соответствующе».
An option worth pricing rather than assuming: an Elite coach does not take a fourteen-year-old with
no results — she becomes hireable when the player has something to show. That turns the top rung from
"the thing rich families buy at week 1" into something earned, which is the same shape as the academy
scholarship. Leave the hook in the model; the owner decides whether it is on.

## Show the player what they are buying

> «а мы можем подсветить у каждого тира тренера на сколько он будет полезен игроку? … "budget может
> добавить 0-2%", "middle 1-3%", "high 2-4%" но всё зависит от ребенка»

Yes — and it should be **computed, not written down**, because the game already knows the answer and
a hand-written band would drift the moment a knob moves.

The honest quantity is her **growth rate against her remaining headroom**: `growWeek` gains a share
of the distance still to go, scaled by the coach factor. So the card can say what this rung would add
*for her, right now*, and the "depends on the child" part is not a disclaimer — it is literally her
headroom, and it is why the same coach is worth more to a thirteen-year-old with room than to a girl
already near her ceiling.

Two rules for the copy:
- **A range, never a number.** The weekly luck draw (`ECONOMY.development.weekLuck`, 0.55–1.45) is
  real spread and the band must carry it.
- **Never promise.** The phrasing is what a rung *can* add over a season against her current build,
  not what she will get.

## Everything gets recomputed and re-measured

Prices per class, all six bench presets, and the specific claim restated: **each family should have a
real choice inside its own corridor** — survive-and-plateau or gamble, at more than one rung, rather
than one viable rung per class.

---

# Rounds 3 and 4 — the roster's shape, twice corrected

Recorded here because the corrections lived only in a commit message and a code comment, and the
second one reverses a rule the first one kept.

## Round 3 (29.07): four a tier, and the duplicate parked at Budget

Round 2 shipped Budget with **three** coaches, on a deliberate rule: *"Budget ships no serve-first
coach — a big serve is the expensive build, and a serve-first kid who shops at the bottom finds
nobody who fits her."* Middle carried **five**, two of them counterpunchers, purely because five
middle portraits had to go somewhere.

R3 moved `middle-4` down to Budget. That bought **four a tier all the way up**, left Middle / High /
Elite at exactly one coach per style, and put the single duplicate where it was argued to read as
something rather than as an accident — *the club IS defence and consistency, so two defensive coaches
at the bottom of the market is what a club looks like*, and a counterpuncher gained two Budget prices
to choose between. The serve-first rule was explicitly **kept**.

The stem stayed `middle-4`: a stem names the master file, not the rung, and the id is what a save
holds.

## Round 4 (30.07): the owner reverses the serve-first rule

> «2 counterpancher budget, none big serve»

One complaint, not two, and it is **the poorest family's** complaint — Budget is the only rung a
working-class career can actually shop at, and it was the one rung with a hole in it.

**Why the texture argument loses.** A play style is chosen once, on screen R, before the player has
any idea what coaching costs, and it is persisted for the whole career. So "serve-first has no great
fit at Budget" is not texture; it is a fourteen-year-old's irreversible choice quietly taxing the
family least able to buy its way out. The other three styles each had a great-fit Budget coach who
was also the **cheapest great fit in the game**; serve-first alone had to find $41/h at Middle
against $28 at Budget. The rule was only ever visible to a serve-first family, and to them it read
as the game being broken.

**The fix, and what it costs.** `middle-4` keeps his Budget rung and his portrait, and his style is
re-read as `serve-first`. `budget-1` keeps the counterpuncher slot — he is the Home card's face for
the working-class family and the cheapest great-fit counterpuncher in the game, which is the fact R3
pinned in answer to the owner's *previous* complaint about this rung.

So R3's duplicate is deliberately given up. That is the cheaper of the two things to lose: a
counterpuncher loses a *second* Budget price, while a serve-first girl was losing the only coach who
could fit her at all.

**The spread, after:** one coach per style per rung — **4 × 4, sixteen slots, no duplicate anywhere**,
which is the most even spread this art can produce. R3's structural half (four a tier) survives
untouched; only the fourth Budget coach's game changed.

Both pins in `tests/coachTiers.test.ts` are re-aimed rather than dropped, with the reasoning above
next to them. The protected fact under them is unchanged and now asserted over **all four** rungs
instead of three: *the style spread is a deliberate, asserted shape and not an accident of which
portraits happened to ship.*

---
type: spec
status: deferred
area: engine/balance
canonical: false
last-reviewed: 2026-08-16
---

# The acceptance tail – a deferred design question, kept because the owner asked for it to be kept (16.08.2026)

**NOTHING HERE IS BUILT, AND NOTHING HERE MAY BE BUILT WITHOUT HIM.** This document exists for one
reason: the argument below arrived late on the day the junior-ladder wave closed, he ruled against
building it *now*, and he asked that the reasoning survive until he has played.

> **The ruling, verbatim (16.08):** «пусть остануться жесткие отсечки, доделывайте всё остальное»
>
> **And then, on this argument specifically:** «хотя вот этот аргумент интересный, давай его пока
> сохраним, я поиграю и скажу ощущения свои потом.»

So: **the hard acceptance cuts stay, and they stay by a dated decision rather than by inertia.** An
agent who reads the regulation section quoted below and reaches for a soft tail should find this page
and stop, not re-derive the question.

---

## 1. WHERE IT CAME FROM

He was shown the claim, from outside this repo, that *to be **guaranteed** entry to a W50 or W75 you
need a WTA ranking of roughly **top 300-500**; below that it is quotas and the rest.*

**Our shipped cuts are already inside that band, and they got there independently.** P3 read real
acceptance lists (`docs/specs/acceptance-cuts-corrected-2026-08.md`): W50 observed at 204 / 234 / 390 /
424 / 441, W75 at 262 / 305 / 334 / 359, and shipped **w50 #330 · w75 #300**. Two sources, one band.

⚠ **The band is about W50 and W75 only.** `w100` (#240) and `wta125` (#180) are labelled in
`season/calendar.ts` as PLACED, not sourced – they exist to keep the chain monotone. Nothing here
supports them and nothing here is evidence about them.

---

## 2. THE ONE THING THE CLAIM ADDS – and it is the word "guaranteed"

`docs/research/ranking-points-by-tier.md` §4-A, on the 2026 ITF WTT Regulations: W35, W50, W75 and
W100 are governed by **one** "System of Merit" section, and **there is no threshold anywhere in it.**
It is an *ordering* – WTA ranking, then ITF points list, then World Tennis Number, then a top-500
national ranking, then *"randomly drawn electronically"* – and an unranked player **is not refused a
W75; she is placed at the bottom of the acceptance list.**

So in the sport the 300-500 band is not a door. It is the rank at which you stop needing luck. Below
it you are an alternate, and quotas, withdrawals and qualifying decide. That is exactly his «до этого
там квоты и прочее».

**Ours is a hard door**: outside #300 at a W75, refused.

---

## 3. WHAT A TAIL WOULD BE, IF IT IS EVER BUILT

Above the cut she enters always; below it with a probability that falls away, resolved through the
regulation's own ordering rather than a new invented curve. ⚠ It would need a purpose-scoped RNG
sub-stream (`rngFromSeed`), never MAIN, because an acceptance that rolls is a draw and
input-independence is permanent law.

⚠ **AND OUR BIG WORLD IS THE REASON IT WOULD MEAN ANYTHING** (his point): the merged W table is
**1800 rows**, so a tail spread under a #300 cut has hundreds of real places to be spread over. In a
200-row world the same mechanic would be noise.

---

## 4. ⭐ THE ARGUMENT HE ASKED TO KEEP – every rung of ours is a cliff

This is the part that is worth more than the sourcing, because it is about how the game FEELS rather
than about what the rulebook says.

**P3 met it head-on at `j300` and had to stop short of the real number.** Its measured evidence, from
`acceptance-cuts-corrected-2026-08.md`:

* real J300 acceptance lists cut at ITF Combined Junior 81 / 101 / 182 against a girls' list of 4,890
  – **the top ~2%**;
* ours admitted the top **40%**, i.e. **twenty times too loose**, the largest single error on the
  ladder;
* the audit had measured 0.02 – the real figure – as **deleting the rung entirely**, 3.8 entries a
  career to 0.0;
* P3 swept 0.02 / 0.05 / 0.10 / 0.15 / 0.175 / 0.20 / 0.25 and **landed on 0.20**, still five times
  looser than reality, because below 0.20 the rung falls off a cliff rather than narrowing.

**A hard cut has no middle.** The rung is hers or it does not exist, so the only way to make it
selective is to make it empty – and P3 shipped a number it knew to be five times wrong for exactly
that reason, and said so.

**A tail has a middle by construction.** The rung narrows instead of vanishing: fewer entries, later,
and the ones she does get are the ones the draw gave her. The 0.02-versus-0.20 fork simply would not
arise – which is the same shape as the finding P6 made one storey up, that what the ladder lost in
this wave was its **gradient**.

⚠ **AND IT IS NOT A FREE LUNCH.** Everything above is an argument that a tail would model the sport
more honestly and read better on the way up. It is NOT a measurement that it plays better, and this
document must not be quoted as one. It would also make an entry decision partly a dice roll, which is
a real cost in a game about a parent planning a season – and the one thing the owner is going to
answer from the seat, not from a spec.

---

## 5. WHAT WOULD HAVE TO HAPPEN FIRST

1. **His verdict from playing.** That is the whole reason this is deferred.
2. Its own phase, its own bench run, its own predicted-vs-measured spec. It moves every field in the
   world, so it cannot ride along with anything else – the same reason the calendar co-phasing that
   the boredom guard needs is not part of any wave so far.
3. ⚠ **The boredom guard is already RED and would move again.** `docs/specs/age-eligibility-window-2026-08.md`
   §7a: 29 weeks of 354 where a cap refusal leaves nothing else playable, a calendar-coverage hole
   rather than a cap number. A tail changes what is enterable in exactly those weeks, so the two
   questions have to be sequenced rather than measured against each other.

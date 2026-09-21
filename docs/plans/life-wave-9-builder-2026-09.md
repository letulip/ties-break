---
type: plan
status: current
area: life
canonical: false
last-reviewed: 2026-09-21
---

# Wave 9 builder brief – «the child» (`life/wave-9`) – DRAFT, awaiting his rulings

Step **W5** of [the-wedding-and-the-children.md](the-wedding-and-the-children.md) §5, and the last
step of the pregnancy branch. Opened by his «что там дальше по плану слоя? Давай сделаем спеку и
обсудим что нужно детализировать» (21.09). Nothing is in work: §4 is the list of things he rules
before a builder starts.

The sketch's own sentence is the boundary this wave lives inside: *«A birth is a beat; a child is
STATE – present every week after, forever»*, and *«no child-raising loop. The player is already
raising a daughter; the game does not recurse»*.

⭐ **And his 21.09 framing tells a builder what the wave is FOR**, which no earlier document said out
loud: «воспитания нет, всё верно, это просто ручка для династии дальше». The child is the handle
step 9 turns. Every task below is sized by that: enough presence that the career remembers her, and
not one mechanic more.

## 1. Where the layer stands

| step | what | state |
| --- | --- | --- |
| 1–6 | spirit/bond, reactions, the slot, the break-up, the psychologist, the spotlight, the wedding | merged |
| 7 | the pregnancy and the return (v85) | wave 8 + 8b, **merged 21.09** (PR #151) |
| **7½** | **the child as state (W5)** | **this brief** |
| 8 | a death in the family | later; hard-gated on the adult stage, the off-switch designed first |
| 9 | the dynasty hook | after 7½; ⭐ his 21.09 ruling – the door never closes, a childless career is offered «роды случились после» |

## 2. The debt this wave inherits, collected from the code rather than from memory

Every item below is a deferral written into a shipped comment during waves 8/8b, with the file that
carries it. A builder can find each one by grepping `W5`.

| # | the deferral | where it is written |
| --- | --- | --- |
| a | the one-pregnancy scope brake is lifted here | `world/lifeBeat.ts` (`pregnancyEligible`) |
| b | the repeat pregnancy re-enters the same seat once `world.pregnancy` is cleared | `world/state.ts` |
| c | the child's standing cost line – deliberately not a birth fee | `world/lifeBeat.ts` |
| d | the four-voice diary band (≈32 more lines) | `diary/weekNotes.ts` |
| e | the album reads «once per pregnancy», so a second child lands correctly with no edit | `world/albumBook.ts` |
| f | `wedding-bench.ts` §(g) mis-reports on a world that has wave 8 in it | wave-7 instrument, wave-8 handoff |
| g | the resilience bonus after the return – the branch's one skill-adjacent number | the sketch §3 |

## 3. The tasks

Commit order is the task order; each task's tests land with it.

### T1 – ⚠ WITHDRAWN 21.09: the family wallet does not feel the child

The brief drafted a weekly cost line and asked whether it should exist at all. It should not: «думаю,
что нет, это её ребенок». So this branch never moves the parent's money – the wedding had no price
and the birth had no fee, and now the child has no standing line either. ⭐ It is consistent with the
seam round 23 #18 already built: her prize share goes to her own account from eighteen, and the child
belongs to the same side of that line. Her own spending is not simulated, so «her child, her money»
needs no mechanic at all – which is why this task is a deletion rather than a smaller version of
itself.

The child's presence is therefore carried entirely by the diary (T4), the travel weeks (T2) and the
album, and the wave has no money constant of any kind.

### T2 – the travel calculus, in `spirit` (ruled 21.09)

The sketch's second named effect: a child is «a seat, a reason to decline the long swings». Ruled
as the **spirit** shape rather than the money one – the fare is something she already pays and
would read as a tax, while a week away from a small child belongs to the layer that prices weeks.
The rule reads the seams that already answer travel (`travelCostFor`'s own trip window, the one the
masseur's stance uses) rather than duplicating them, and it is a rule about THIS week over existing
state: no travel planner, no second calendar.

⚠ Two things for the builder to bring rather than decide: how long «small» lasts (a drafted age
window on the child's own `bornWeek`), and whether the psychologist's channel touches this the way
it touches every other spirit mark – the answer is probably yes, and it should be measured, not
assumed.

### T3 – the repeat pregnancy

Lift the brake (`world.children.length > 0`) and give the second pregnancy its own rates from his
digest's own row – *«Second child | 28–38 | 1–2% | even less influence»*: a narrower window, a
lower weekly hazard, and the count of children in the term so a third stays rare. Everything else
is wave 8's machinery re-entered: the beat, the pause, the birth, the decision, the return.

⚠ The second return is where the research's «multi-return careers, est. 20–30% success» lives; the
bench reports it rather than the model forcing it.

### T4 – the diary's four voices

The 32 lines the pregnancy band deferred: the same occasions, per temperament, so a `fiery` mother
and a `quiet` one do not read identically for a year. All drafts for his pass, in a strings table.

### T5 – the resilience bonus, benched (ruled 21.09 – in scope)

The sketch's one skill-adjacent candidate: *«a possible permanent mental-resilience bonus after the
return (priorities shift)»*. Mechanically it is clean – `composure` never declines, so a one-off
addition stays what it was – but it is a skill number in a life layer, so:

* it ships only with predicted-vs-measured in the spec (invariant 5);
* the bench must show what it changes in match outcomes, not only in the number;
* ⚠ and it needs **one appended field** so it cannot be applied twice – which makes this wave a
  schema move after all: **v86**, the seven-part rite, the field on the child's own row (the row is
  where «once per child» already lives, and T3's second child must be able to earn its own).

### T6 – the instrument heal

`wedding-bench.ts` §(g) reads a world that now has a pregnancy in it and will call this design a P0.
The precedent is wave 7's K5 heal: fix the instrument, re-run the arm, record the healed numbers in
an addendum rather than averaging the disagreement away.

### T7 – strings, bench, spec, gate

The strings table for T4 and anything T1–T3 says out loud; `tools/child-bench.ts` (or the
motherhood bench extended – the builder picks and says why) with the census of second pregnancies,
the cost line against the wealth corridors, and T5's arm if it ships; the spec
`docs/specs/the-child-2026-09.md` predicted-before-measured; then the gate in a clean worktree.

## 4. His rulings of 21.09, and the one question still open

Ruled, and folded into §3 above:

1. **The resilience bonus is in scope**, benched – so the wave is a **v86 schema move**, one
   appended field on the child's row, the seven-part rite.
2. **The travel calculus is the `spirit` shape**, not the money one.
3. **No cap on the number of children** – the digest's window and rates make a third rare on their
   own, and the arithmetic decides.
4. **The child is deliberately NOT named**, and the reason is the next step: «не даем намеренно,
   если пользователь пойдет в династию даст сам: имя выбирает родитель». ⚠ So step 9 inherits a
   contract from here – the dynasty's first screen ASKS for the name, and nothing in this wave may
   invent one, in a string or in a fixture.

5. **The family wallet does not feel the child** – «думаю, что нет, это её ребенок». T1 is
   withdrawn; the wave ships no money constant. ⚠ The record's own correction, his, the same day:
   the wedding price was removed **jointly** and not by his ruling alone – «мы сняли вместе с твоими
   аргументами» – which is how all three of this branch's money questions were settled.

**Nothing is open. The wave starts on his «поехали» and not before.**

## 5. What this wave does not do

No child-raising loop, no second career sim, no custody content, no bereavement (step 8), no
dynasty (step 9), no divorce content, no `spouseBond`, no second wallet – and no constant moved on
any agent's word.

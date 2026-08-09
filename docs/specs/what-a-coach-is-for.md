---
type: spec
status: current
area: economy/progression
canonical: true
last-reviewed: 2026-08-06
---

# What a coach is for

## Current truth

- **The coach's job changes as she grows, and that is the design.** Early years he buys growth; later
  he buys scheduling, load, opponent preparation and the emotional part. Paying an elite coach at
  twenty-two is not a bet that he makes her better – she is at her ceiling. It is a bet that he stops
  her wasting seasons and breaking down.
- **Growth correctly fades and must not be propped up.** `growWeek` takes a share of REMAINING
  headroom, so the same coach honestly buys less as she approaches her ceiling. That is not a bug and
  the fix is never to inflate the multiplier.
- **Scheduling is the first pillar and is being built now** (06.08, `fix/ladder-window-floor`), on the
  surface that already exists: `coachEntryLine` → `UpcomingEvent.coachCaution` → the event row on the
  Calendar and Season screens, and the enter-confirm dialog that already changes `Enter` to
  `Push through` when he speaks.
- **No new mechanic.** `coach-as-load-manager.md`'s rule holds for every pillar: what moves is WHO
  DECIDES and what he has an opinion about, never a new system bolted beside the old one.

## 1. The problem, measured

The coach is a **skill-growth multiplier and nothing else**. Measured on the owner's save (week 255,
age 18.0, `high-3`, 93.4% of her own ceiling realised):

| age | realisation | what the screen offers |
|---|---|---|
| 14 | 82.2% | +1.1–2.2% a season |
| 16 | 89.9% | +0.4–1.0% |
| 18 | 93.4% | **+0.2–0.5%** |

Headroom is the driver, not age: rolling headroom back to 75% multiplies the offer by **4.4**, rolling
age back to fifteen by only 1.6.

And at that realisation **the market has stopped discriminating**. `budget-3` prints +0.1–0.2%;
`elit-1` prints +0.2–0.5% – identical to the high-tier coach she already has, beside a $312/wk bill.
Next season the elite prints +0.0–0.1%.

**So the role does not degrade gracefully. It stops having work.** The owner's question was the right
one: *«давай думать обоснование "зачем вообще игроку тренер" и думать что это даёт в жизни».*

## 2. The answer: the job changes, as it does in life

A real coach is not a growth multiplier that expires. What he does moves as the player does.

### Pillar 1 – scheduling *(building now)*

Which event, and whether to go at all. This became a real decision the moment the ladder's lower
bound stopped refusing entries (`ladder-floor-2026-08.md`): a nineteen-year-old professional may now
enter a club draw, and nothing but her own judgement stops her. In life that judgement is largely the
coach's, and *"not that one – there is a real event two weeks out"* is the single most characteristic
sentence in the job.

### Pillar 2 – load and the body

He sees her arriving broken before the player does. The fatigue and injury models exist and are
calibrated (`fatigue-injury-audit-2026-08.md`); `coachEntryLine` already speaks about condition. This
pillar is half-built and its other half is telling the player about a *pattern* rather than a week.

### Pillar 3 – the opponent

The match engine models play styles and surfaces. A coach who has watched the opponent is worth a
small edge **in that match**, not a permanent increment to her. That is what tour-level coaching is
sold on, and it is the pillar that keeps an elite coach worth paying for at her ceiling.

### Pillar 4 – the person

Already written and already working: his note on Home, his read on her. The oldest pillar and the one
that needs no argument.

## 3. What this rules out

- **Inflating the growth multiplier so the coach stays relevant.** The fade is honest. A coach who
  keeps buying skill at 95% realisation is a lie about how athletes work, and the player would be
  right to feel swindled by the arithmetic rather than by the price.
- **A second currency, a coaching minigame, a skill tree.** `coach-as-load-manager.md`'s rule: no new
  mechanic. Every pillar pays into a system that is already tuned.
- **A coach who is always right.** He is a person with a rung. A budget coach notices the obvious; an
  elite one sees the block ahead. If he is never wrong he is an oracle, and the player stops choosing.

## 4. What is still open

- **The tier gradient.** Pillar 1's read should sharpen with the coach's own rung – that is what makes
  hiring a decision again. Flagged in the scheduling brief; may not fit in the first wave.
- **Pillars 3 and 4's arithmetic.** Unbuilt, unmeasured, unruled.
- **The retainer on tournament weeks** (owner, 06.08: the coach keeps working there and she keeps
  progressing) is being implemented separately, and it interacts with this: if he contributes nothing
  on a competition week, the model says his most visible week of the year is his emptiest. That
  question belongs to pillar 3 and is named there rather than answered here.

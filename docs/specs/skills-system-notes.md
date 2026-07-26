# Design notes for the skills system (parked, owner-approved 26.07.2026)

Collected so they are not re-derived later. The skills system is the missing half of several
mechanics that currently only cost money or condition without ever producing anything.

## What training does today (the gap)
The train/rest slider currently affects exactly two things:
1. **Money** — the weekly expense scales with the training share (`ECONOMY.planFactor`).
2. **Recovery pacing** — on a MATCH-FREE week the slider adds a threshold bonus (rest ≥ 40 → +2,
   ≥ 25 → +1, the 85/15 grind → +0).
There is **no development effect at all**. That is why round 7 deferred the day-detail screens
("they will not mean anything until training produces an effect") and why the Kid screen still shows
a "Skills & development" placeholder.

## The owner's principle (26.07): a practice week does not cancel that week's training
Stated as fair, and it is — but note precisely what the engine does today: a practice week keeps the
base recovery and forfeits only the **rest bonus** ("you played, so you rested less"). Training
itself is not cancelled; it simply has no output yet. So the principle needs the skills system to
become visible, and when it lands:

- A week with a practice match should credit **both** the week's training AND the friendly.
- The friendly should be worth a bit MORE than pure training for the same week, because it is
  competitive practice — that is what makes it a real choice ("I pay condition, I get development")
  rather than a free top-up.
- Deliberately NOT done instead: giving a practice week its rest bonus back. That would make a
  friendly cost roughly nothing in condition, and "play every week" becomes the dominant strategy
  again — the exact degeneracy the week-type ladder exists to prevent (bench: a
  practice-every-week grinder already craters at mean condition 47 with the bonus withheld).

## Other things waiting on skills
- **The coach-as-choice review lever.** The owner's post-match "detailed review + drills" popup with
  profile knobs ("after which events, how thoroughly") needs a visible % effect to sit on.
- **The careful-policy trade-off.** Load management currently has NO cost: resting more never means
  developing less. Once training produces growth, `careful` starts paying for its freshness, which is
  what makes the bench's policy comparison honest (today `careful` is close to strictly better).
- **A performance cross-section of the policies** (owner's ask): the spread of career outcomes for
  grinder / balanced / careful over 1-2-4 seasons only becomes meaningful once resting has a price.
- **Practice-match development** is the reason practices exist beyond flavour; today they cost money
  and condition and return only a watchable match and a news line.

## Bench-policy caveat worth remembering
The bench's `careful` practises whenever condition ≥ 80. Because a load-managing player is almost
always above 80, that gate is permissive rather than restrictive, so `careful` books ~30
practices/season against `balanced`'s every-other-week ~18. When practices start producing skill
growth, that policy definition needs revisiting or `careful` will look better than it should.

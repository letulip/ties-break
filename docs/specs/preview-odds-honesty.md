# The event card's percentage — measured (31.07.2026)

The owner, playing, raised two things about the same number:

> **(7)** «А почему на карточках турниров % меняется от одной недели к другой? На одной неделе было
> 92%, на следующей уже 64% – это довольно странно.»
>
> **(8)** «Странно, пишет шанс обыграть на j30 84%, приезжаем, ставит нас #124 против #22, проигрыш и
> вылет в первом раунде. Точно правильно считает??»

Both are answered here with numbers rather than an opinion. Two benches: `tools/odds-calibration.ts`
and `tools/preview-drift.ts`.

---

## 1. The formula is not wrong. It is calibrated to within ~1 point.

The card quotes `fastMatchProbability` — a closed form, no momentum, no RNG. Her actual match is
played by `simulateMatch`, point by point, with momentum on. If those two disagreed, every percentage
in the game would be wrong in the same direction.

`tools/odds-calibration.ts` plays **88,500 matches** across the whole skill grid and buckets realised
win-rate against quoted probability:

| quoted | realised | quoted | realised |
|---|---|---|---|
| 3.7% | 3.2% | 66.5% | 66.1% |
| 12.3% | 11.9% | 73.9% | 74.6% |
| 26.1% | 26.2% | 80.3% | 80.0% |
| 41.5% | 41.3% | 87.7% | 88.5% |
| 50.0% | 51.2% | 93.2% | 93.8% |

**Worst bucket gap: 1.2 points.** Momentum on or off makes no difference (1.2 vs 1.1). So when the
card says 84% *against that opponent*, she really does win about 84% of the time.

**Answer to (8): yes, it counts correctly — but the 84% was not about the girl she met.**

---

## 2. The whiplash has exactly one cause, and it is not noise

`tools/preview-drift.ts` walks **12 careers × 104 weeks**, recording every upcoming event's card every
week it is on screen — 15,384 week-to-week steps over 2,328 event-lifetimes.

```
TOTAL SWING per event, first sighting to last:   p50 = 30.2   p90 = 48.8   max = 73.9 points
WEEK-TO-WEEK step:                               p50 =  7.3   p90 = 28.3   max = 66.5 points
   steps over 20 points: 21.0%        steps over 10 points: 42.9%

NAMED OPPONENT changed between consecutive weeks:  72.4%
FIELD STRENGTH (the WORDS) changed:                 0.0%

When the opponent did NOT change, the % moved by:  p50 = 0.1   p90 = 0.2 points
```

His 92% → 64% is a 28-point step. **21% of all steps are bigger than 20 points.** He was not unlucky;
he was looking at the ordinary behaviour of the card.

**And the decomposition is unusually clean.** When the drawn opponent stays the same, the number is
essentially frozen (p90 of 0.2 points). Every bit of the movement is **which girl she is currently
projected to draw** — and that changes **72% of the time**, because `previewEvent` re-draws the whole
field every week from today's standings and today's availability gate.

⚠ **Meanwhile the verbal reading never moved once.** `fieldStrength` — favourite / even / strong —
changed in **0.0%** of 15,384 steps.

---

## 3. So the diagnosis is not "the number is wrong"

**The card pairs a rock-stable verbal reading with a violently unstable number, and the number is the
one the player believes.**

`preview.ts` is honest in its own terms and says so at length in its header: it is "an estimate about
a field she would meet if it started now… never a prophecy". That is true. But it answers *"who would
she play if the tournament began today"*, and the player reads it as *"her chance at this
tournament"* — a question about a week eight weeks away, whose draw does not exist yet.

**It is precise about the wrong week.** Precision on an unanswerable question reads as randomness, and
a number that reads as random poisons the one thing the file set out to protect: "a real number, not
a mood".

---

## 4. Recommendation — the stable reading is already computed

Do **not** freeze the preview (stale by another route), and do **not** widen it into a range that
hides the same instability behind bigger numbers.

1. **Make the percentage a FIELD-level statement, not a first-round-draw statement.** Her chance
   against this field is what the parent is deciding on, it is what `fieldStrength` already measures,
   and the measurement above shows a field-level reading is stable while a draw-level one cannot be.
2. **Keep the named opponent for the event's OWN week only.** `preview.ts`'s header already notes that
   a preview taken on the event's week names the girl she actually gets — because the sub-stream is
   then read at the same position as the real run. Before that week, naming an opponent is naming
   someone she has a 72% chance of never meeting.
3. **Say "as of today" on the card** wherever a projection remains.

## 5. The other half of (8): the draw itself is fine

`buildDraw` places seeds via `seedsFor(field.length)` and Fisher-Yates shuffles the unseeded tail. An
unseeded #124 in a J30 can therefore land against any seed in round one, #22 included. That is
ordinary bracket behaviour and not a bug — but it is a second reason the pre-event percentage could
never have been about that match.

---
type: spec
status: draft
area: life
canonical: false
last-reviewed: 2026-09-17
---

# The decline, and whether four paid seats may touch it

Opened 17.09 on his own career and his own words: **«мне кажется, что это не спад, а прыжок с
обрыва»**, and **«все эти специалисты должны его если не тормозить, то хотя бы сглаживать, а может
у кого-то и тормозить даже немного»**. With a calibration point he supplied and which the model has
to answer to: **the 2026 US Open final was Sabalenka at 28 and Rybakina at 27.**

## §1 First, the measurement – and it corrects BOTH of us

The curve is `0.00035 × (1 + (age − declineStart) × 0.24)` a week, times `ageWeight`
(serve 0.6 · return 1.2 · stamina 1.6 · groundstrokes 1.0; composure is excluded and gains
`veteranPoise` instead). For his career, `declineStart` is **25.99**. Share of each attribute still
standing:

| age | serve | return | stamina | groundstrokes |
| --- | ---: | ---: | ---: | ---: |
| 27 | 98.8% | 97.5% | 96.7% | 97.9% |
| 28 | 97.3% | 94.7% | 93.0% | 95.5% |
| **28.76 (his career now)** | **96.0%** | **92.2%** | **89.7%** | **93.5%** |
| 30 | 93.7% | 87.8% | 84.1% | 89.7% |
| 32 | 89.3% | 79.8% | 74.0% | 82.8% |

⭐ **So the slope is NOT a cliff, and the architect's own «cliff» framing was loose.** At 28.76 she
holds 90–96% of her peak. In absolute points the whole decline has cost her **serve −2.6, return
−4.6, stamina −6.2, groundstrokes −4.1**.

⚠⚠ **AND ONE SEASON OF IT IS ABOUT 1.5 POINTS, WHICH CANNOT EXPLAIN 70% → 53%.** His 2044 was 42–18
and his 2045 is 26–23. A point-and-a-half of skill does not move a win rate seventeen points. **The
decline is therefore NOT the whole cause of what he felt**, and saying so is the difference between
a diagnosis and a story.

## §2 What actually produced the fall from #13 to #59 – three terms, not one

1. **~1.5 points of ageing** over the season. Real, small.
2. **Two mid-match retirements, both in 128-draws** – w710 (2044 R16) and w754 (2045 R64). The two
   events that pay the most points, exited at the two rounds that pay least.
3. **The ranking is a rolling 52-week sum.** 4,008 points expired and 1,584 replaced them. The drop
   from #13 to #59 is that arithmetic, not a judgement on how she played.

⭐ **Term 2 is the one the seats could plausibly have touched, and did not.** The shoulder knocked
four times (w676, w685, w699, w709) and was pushed four times, the fourth carrying `brokeDown: true`.
Nothing on the payroll reduces the breakdown hazard of pushing.

## §3 His calibration point, and what the model actually says about it

Sabalenka at 28 and Rybakina at 27 are not merely still playing – they are contesting a Slam final,
after documented career slumps. The model's 28-year-old holds 90–96% of HER OWN peak, which by
itself is not obviously wrong.

⚠⚠ **The mismatch is not in the slope, it is in the LEVEL, and `ECONOMY` already says so in its own
voice.** Round 38 #3d's note over `declineAccel`: «she is at 47 on four attributes where the tour's
elite sit at **65–70** – so **any loss at all is decisive there**. This dial softens the slope; **the
level is C2's question and it is still open.** Said out loud so the next reader does not credit this
change with a fix it does not deliver.»

His player peaked at serve 66 · return 59 · stamina 61 · groundstrokes 63 against an elite band of
65–70, and reached #13 on **composure 78**. A four-point loss from that base crosses a threshold that
the same loss from 70 would not. **That is why a gentle slope feels like a cliff jump** – he is
reading the effect correctly and the cause is one layer under where either of us first looked.

## §4 THE PROPOSAL – one seat, one attribute it plausibly protects. DRAFT, his ruling.

His shape: «если не тормозить, то хотя бы сглаживать, а может у кого-то и тормозить даже немного».
So: **no seat stops the decline; each softens the ONE attribute it has a real-world claim on.**

| seat | attribute | claim | proposed effect |
| --- | --- | --- | --- |
| masseur | **stamina** (weight 1.6, the fastest) | weekly body work is exactly what a veteran's endurance runs on | reduce its effective weight while hired and working |
| hitting partner | **return** (weight 1.2) | the return is reaction, and reaction is what match-style practice drills | reduce its effective weight while hired |
| coach | **all four, slightly** | an elite coach's job past the peak is maintenance, not growth | a small maintenance term, scaled by tier and fit |
| psychologist | **composure** | already aligned – composure is excluded from the decline and gains `veteranPoise` | no change |

⚠⚠ **Numbers are deliberately absent from this table.** Invariant 5: a balance change ships with a
bench arm and a predicted-against-measured spec. The arm has to answer two questions before any
constant is chosen: **does the fully-staffed career still decline** (it must – a seat that stops
ageing is an immortality button), and **does the gap between a staffed and an unstaffed veteran
read as a difference the player can feel** rather than as noise.

⭐ **And the coach's row fixes something that is close to a defect today:** past `declineStart`
`ageFactor` returns 0, so an elite coach multiplies zero. A family paying elite money for a
twenty-eight-year-old is buying nothing at all, and nothing on screen says so.

## §5 What is NOT proposed here

- **Moving `declineStart` or the slope.** Round 38 already measured that and its own note warns the
  next reader not to credit the dial with a fix it does not deliver.
- **Touching the LEVEL question (C2).** It is the real cause of the threshold effect in §3 and it is
  bigger than this spec. Named so it is not quietly absorbed.
- **Anything about the knock hazard.** Round 43 #9 stood that down on his «по ноккам отбой»; if term
  2 of §2 is to be addressed, that ruling is his to revisit.

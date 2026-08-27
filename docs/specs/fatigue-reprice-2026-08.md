# Re-pricing the week: fatigue, recovery, vacations — and the injury curve under them

Written 03.08.2026 on the owner's instruction («по усталости нам надо комплексно что-то сделать, я
чувствую. Значит надо все рычаги потрогать»), and because the W2-WINDOW acceptance criterion he
added the same day — 20–30 events a season, PLAYED — cannot be met by the shipped numbers under any
window. Everything below is measured on the shipped constants; nothing here is built yet.

---

## 1. His frame, which is the specification

«Если нам надо сыграть 20 чемпионатов в год, то это 60-100 матчей примерно. При этом это КАЖДАЯ
ВТОРАЯ НЕДЕЛЯ в году БЕЗ ПРОПУСКОВ ВООБЩЕ. Т.е. нам надо, чтобы состояние усталости накапливалось -
это верно, но к концу сезона мы бы привозили то, что за off-season РЕАЛЬНО восстановить с 1 большим
или парой небольших отпусков.»

That is a complete design in three clauses, and it turns into arithmetic directly:

- **Twenty events, every second week.** One played week, one rest week, twenty times ≈ 40 weeks,
  with the off-season and the exam blackout making up the rest of the year.
- **Fatigue accumulates.** So each play-plus-rest PAIR must cost something — the season must decline
  rather than settle at an equilibrium.
- **The off-season plus a vacation really restores it.** So the decline over a season must be
  smaller than what three blackout weeks and one big (or two small) vacations return.

Target: arrive at the off-season around **45–50**, i.e. a decline of ~55 over twenty pairs, i.e.
**each pair costs about −2.75**.

---

## 2. Where a tournament's cost actually is

A W35 title — five matches, two of them three-setters — costs **41** today. Decomposed:

| component | points | share |
| --- | --- | --- |
| the tennis itself (scoreline: 2 per straight-sets match, 3 per hard one) | 12 | 29% |
| **tier surcharge, 5 PER MATCH** | **25** | **61%** |
| cumulative run ladder (W family: +1 per subsequent match) | 4 | 10% |

⚠ **THE CUMULATIVE IS ALREADY THE OWNER'S LIGHTER VERSION** — his 01.08 ruling put the W family on
ladder D, `[0,1,1,1,1]`, which is exactly the «просто по 1 за каждый следующий матч» he proposed
again on 03.08; the J and domestic rungs keep the steeper C, `[0,1,1,2,2]`. So «кумулятив до J
включительно, а на W полегче» is shipped. Removing it from W entirely is worth **4 points**, not
the ~10 the feel suggests.

⚠ **THE ~10 POINTS ARE IN THE SURCHARGE**, because it is charged PER MATCH and therefore multiplied
by the depth of the run. And the owner's own argument — «это же работа, она привыкла» — is an
argument about exactly that number: the surcharge is the "international travel, time zones, a
fortnight from home" tax, written for a schoolgirl who flies to a J300 twice a year. A professional
grinding W35s is conditioned for her own tour. It should not cost her more per match than it costs
a fifteen-year-old at a J300 (today: both 5, and W75+ costs 6).

| change | a W35 title costs | she comes home at |
| --- | --- | --- |
| shipped | 41 | 59% |
| drop the cumulative on W | 37 | 63% |
| surcharge 5 → 3 | 31 | 69% |
| surcharge 5 → 2 | 26 | 74% |
| surcharge 3 + no cumulative | 27 | 73% |
| surcharge 2 + no cumulative | 22 | 78% |

---

## 3. What the season equation demands of recovery

A rest week returns **3** today (base 1 + the rest-slider bonus 2). For twenty pairs to cost ~2.75
each, the rest week has to return nearly what the average event drains:

| W surcharge | average event | REQUIRED rest-week recovery |
| --- | --- | --- |
| 5 (shipped) | 20.0 | 17.3 |
| 4 | 17.5 | 14.8 |
| **3** | **15.0** | **12.3** |
| **2** | **12.5** | **9.8** |
| 1 | 10.0 | 7.3 |

(Average event = the weighted mix of a competitive season: 30% first-round exits, 25% two matches,
20% three, 15% four, 10% titles.)

At the shipped surcharge a rest week would have to return **17** — that is not rest, that is
convalescence. So both dials move towards each other. **Proposed: surcharge 2–3, recovery base 6–8
plus the existing rest-slider bonus.**

⚠ THE CUMULATIVE STAYS. It is 10% of the bill and it earns its keep narratively — matches every
other day grind a professional down exactly as they grind a junior, which is the one part of the
model that is not about travel. Cutting it buys 4 points and costs the story.

---

## 4. The reset: the off-season and the vacation table

From ~47 back to ~100 is **53 points**, and it has to come from three blackout weeks plus what she
books. With the recovery base at 6–8 the blackout weeks return 27–30, so the vacation carries
25–30 — which the shipped table's top package (30) only just covers, and only if she buys the most
expensive week in the game.

The owner: «надо все приподнять». Proposed, with the shipped values beside them:

| package | price | shipped | proposed | ≈ rest weeks at the new base |
| --- | --- | --- | --- | --- |
| Staycation with friends | free | 12 | **18** | 2.2 |
| A week at grandma's | $21–50 | 14 | **22** | 2.7 |
| Camping road-trip | $105–300 | 16 | **26** | 3.2 |
| Seaside family hotel | $600–1,000 | 20 | **32** | 4.0 |
| Sports recovery resort | $1,800–3,000 | 25 | **40** | 5.0 |
| Elite recovery programme | $4,000–7,000 | 30 | **48** | 6.0 |

Two properties this table is built for, both testable:

- **The free week is a real mid-season tool.** At 18 it is worth two rest weeks, so taking a week
  out after a hard block or an injury is a genuine move rather than a gesture — which is what the
  owner asked for («в течение сезона она сможет брать мини отпуска на неделю иногда»).
- **Money buys recovery SPEED, not recovery.** The ladder spans 18 → 48; the elite week alone nearly
  closes a season's deficit, the free one does not, and the gap is the honest-economics thesis
  applied to the body rather than the wallet. ⚠ The wealth corridor must NOT scale the gain itself —
  the same package restores the same condition for every family, exactly as prize money pays the
  same cheque (the rule act2-pro-tour.md §3 sets for money).

---

## 5. ⚠ THE INJURY CURVE — the owner's own warning, and it is already firing

«у нас же там еще риск травм растет, как бы мы себе в ногу не стрельнули усталостью.» Measured on
the shipped model — weekly risk = (0.006 + 0.0009 × fatigue) × 1.8 on a competing week:

| she lives at | resting week | competing week | P(≥1 injury) over 20 competing + 24 resting weeks |
| --- | --- | --- | --- |
| 100 | 0.60% | 1.08% | **30%** |
| 90 | 1.50% | 2.70% | 60% |
| 80 | 2.40% | 4.32% | 77% |
| 70 | 3.30% | 5.94% | 87% |
| 60 | 4.20% | 7.56% | 93% |
| 50 | 5.10% | 9.18% | **96%** |
| 40 | 6.00% | 10.80% | 98% |

The research anchor this model was built against (docs/research/injury-stats-by-age.md) is **46–54%
season prevalence** for junior girls. Read the table again: she clears that band at condition ~92,
and the shipped fatigue model parks her in the 30–50 range for most of a busy season — which is
**96–98%**, i.e. an injury a season, guaranteed, twice over.

⚠ **SO THE FOOT IS ALREADY SHOT, AND THIS RE-PRICE IS THE BANDAGE, NOT THE BULLET.** Raising her
average condition from ~40 to ~65 moves the season from ~97% to ~90% — better, and still far above
the researched band. The re-price alone cannot fix it: at 20 competing weeks the base rate of
0.006 × 1.8 contributes 23% on its own, before any fatigue at all.

⚠⚠ **AND THIS SECTION IS ABOUT ONE OF THE TWO DOORS – THE SMALLER ONE, ON A CAREFUL CAREER.** The
weekly roll priced above is the only injury model anybody has tuned, but the in-match RETIREMENT
hazard (`src/engine/match/point.ts`, shipped 10.08 – after this spec was written) delivers **56% of
a fresh player's injuries** and is the whole of the professional era's prevalence overshoot. It is
not a knob on this page and it does not read anything this page prices: measured, arriving at 95
and arriving at 70 carry **identical** retirement risk. Before re-calibrating anything here, read
`docs/specs/retirement-shape-2026-08.md` – the numbers, the dominant term and the candidate fixes –
or this section will re-tune the weekly curve to absorb a defect that is not in it.

⚠⚠ **AND THAT DOOR WAS RE-SHAPED ON 27.08, WHICH MOVES THE TARGET THIS SECTION AIMS AT** –
`retirement-shape-2026-08.md` §13. The hazard now has its own condition curve, so the retirement door
finally reads the number this page prices. The LEVEL did not move (the re-aimed bench reads 2.65% of
matches against the 2.73% anchor, `RETIRE_K` untouched) but the SPLIT did, and it lands on this
section's own acceptance number: measured over 96 season-years an arm, **season injury prevalence goes
48% → 39% for a careful policy** – inside the researched 30–54% band for the first time – **and 79% →
92% for the professional grinding arm.** ⚠ So §6 criterion 4 is now POLICY-DEPENDENT rather than a
single number, and the reason the grinding arm cannot reach the band is exactly what THIS page has not
shipped yet: at the shipped surcharge the professional era arrives at ~37 whatever the player does, so
the freshness lever the fix creates cannot be pulled there. **Re-price the week and re-measure §6.4
before touching any injury knob** – that is the same ordering warning §5 ends with, now with a number
on both sides of it.

**Therefore this wave carries a third lever: the injury curve is re-calibrated in the same pass**,
against the researched 46–54% at a realistic professional season. The candidates, in the order I
would try them:

1. **The fatigue slope** (0.0009 per point) — it is what makes a tired week five times as dangerous
   as a fresh one. Halving it flattens the cliff without denying that tiredness hurts.
2. **The competing multiplier** (1.8) — a professional's match week against a junior's.
3. **The base** (0.006) — last, because it is the number anchored directly to the research.

⚠ AND THE ORDER OF WORK MATTERS: re-price fatigue FIRST, re-measure the injury rate SECOND, then
re-calibrate. Changing both at once makes the result unattributable, which is the mistake the A3
note in act2-pro-tour.md warns about for best-16.

---

## 6. Acceptance — five benched numbers

1. **PLAYED: 20–30 events a season** on a bench career that tries to play (W2-WINDOW's own
   criterion; the baseline is 11 on the owner's W230 career).
2. **The season's shape**: she arrives at the off-season at **45–50**, and after the blackout weeks
   plus one big (or two small) vacations she opens the next season at **≥90**.
   ⚠ **THE 45–50 HALF NO LONGER DESCRIBES THIS GAME'S LADDER** (audit §2, 04.08): it is derived from
   §3's average event of 2.35 matches, and since W3-ACT2 opened ten professional rungs the measured
   figure is **1.6** – she loses in the first round of most of what she now enters, and a first-round
   exit costs less than the rest week beside it returns. Measured today: the door is at **73** and she
   opens the next season at **89**. The obvious repair (raise the top rungs' per-match surcharge) is
   refused there under «мы ни за что не наказываем» – it would charge her body more for LOSING – and
   §7 below reserves the professional week's price to the owner anyway.
3. **A W35 title leaves her at 70–78%**, not 59% — the number the owner reads off the screen.
4. **Season injury prevalence 46–54%** at that schedule, per the research anchor.
   ⚠ **RE-AIMED TO 30–54% ON 04.08** (docs/specs/fatigue-injury-audit-2026-08.md §8): this is the
   JUNIOR band from docs/research/injury-stats-by-age.md §1, applied to a schedule §1 of this very
   spec describes as twenty PROFESSIONAL events a year. The same research carries a professional
   band – 30–54% – and the measured 38% sits inside it. No injury knob moved; the criterion did.
5. **The junior era does not move.** Domestic and J rungs keep ladder C and their surcharges; the
   junior-era benches (`tools/fatigue-bench.ts` reference tables in tests/fatigueReference.test.ts)
   must not move a cell that is not deliberately re-aimed with a note.

---

## 7. What this wave does NOT touch

The wealth corridor's scaling of travel and coaching; prize money; the medical floor (15) and the
doctor's veto; the rival fatigue window (16 weeks) except where the shared implementation forces a
re-measure; and every J/domestic number. If reaching (1) requires moving any of those, STOP and
report the number — the owner priced them himself and what the professional era should cost is his
ruling, not a knob to turn in passing.

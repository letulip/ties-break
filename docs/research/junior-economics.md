# Junior tennis economics — research brief (grounds the Phase-4 economy redesign)

Compiled 2026-07-24. All figures USD unless noted; ranges are wide (sources mix region/year/level).
Soft/synthesised numbers are flagged. This is reference for the expense-realism + availability
(season-load) redesign — see docs/specs/econ-breakdown-bench.md for the measurement side.

## Headline numbers the sim should hit

| Level | Real annual total | Maps to our tier |
|---|---|---|
| Modest competitive | ~$10,000–$20,000/yr | working (8k start) squeezed |
| Well-funded / club HP | ~$25,000–$40,000/yr | middle (25k) |
| Residential academy / pre-pro | ~$40,000–$100,000+/yr | wealthy (120k) |
| Cumulative to raise one champion | ~$400,000 | full career arc |

Our bench gross (working $22k · middle $27–38k · wealthy $50k) sits inside this band — the model
is already realistic in aggregate; the work is per-category realism + gating tournament count.

## Coaching (our biggest line — tier it, don't flat-rate)

- Private coach hourly: $65–$160/hr (juniors $30–$80/session group vs private).
- Club weekly HP package (private + drilling + fitness): ~$400–$500/wk ≈ **$20–26k/yr**; a-la-carte
  competitive ~$5–15k/yr.
- Residential academy (IMG-style): **~$90k/yr** tuition (+30–40% real cost).
- Elite/personal touring coach: **$250/day, up to $3,000/wk** when travelling (you replace their
  home income); on tour often 5–15% of prize money + player pays all coach travel/lodging.
- Coach travelling TO tournaments is a higher-level premium, not default: ~$200–$500/day + travel.

Our config: hired $250–700/wk (=$13–36k/yr), parent $120–400/wk (=$6–21k/yr) → maps a-la-carte→club.
Realistic. Room for an **academy/elite tier** above hired.

## Tournaments per year — the real cap (validates "bench over-enters")

- U12: USTA ≤2/month, **≤12/yr**.
- Serious juniors 13–18: **ITF recommends ≤20 tournaments/yr** (incl. team events). >40 MATCHES/yr
  (≠ tournaments) is the specialization/injury-risk threshold.
- Caps in reality: cost ($300–$500/trip), school calendar, fatigue/injury, ranking eligibility,
  scheduling rules (may enter ≤3 ITF junior events/week but hold acceptance in only 1).

→ realistic play ≈ **15–20 events/yr**, not the ~50 our entry-policy-v1 enters. The season-load
system should land the player here organically.

## Travel — the volatile, choice-driven line

$300–$500 per out-of-town weekend on top of $40–$80 entry. Named repeatedly as the single biggest
swing factor. "Which tournaments do I fly to?" is the recurring economic decision. Equipment: strings
every few weeks, shoes every 2–3 months (our gear cadence already ~matches).

## Injury / fatigue / load (grounds the availability system)

- Injury incidence ~2.1–3.5 per 1,000 hrs; **~46–54% seasonal prevalence** (about half get hurt).
- Strongest predictor: an acute:chronic workload spike (**ACWR ≥1.3**) — sudden load jumps.
- Physio / S&C / conditioning measurably reduces injury: ramp-up progressions −21%, kinetic-chain
  conditioning −26%. So sports-med is an availability-preserving *investment*, not flavour.
- Burnout: ~10% moderate / ~3% high risk in elite juniors, driven by early specialization + volume.

## Income — near-zero, payoff deferred and steep (the honest squeeze)

- Junior events (incl. junior Grand Slams) carry **no prize money**. Players earn ~nothing.
- Grants: small and merit-gated (e.g. £250–£2,000, one/player/yr). Federation/ITF dev funds are
  competitive, top-talent-only.
- Junior sponsorship ≈ **free gear** (racquets/strings/shoes/apparel), not cash; travel sponsorship
  only after national/international wins.
- Break-even doesn't arrive until roughly **top-300 pro** (and that figure excludes coaching, so
  really higher). Real profit near **top-100**. One cited pro: $6,771 prize vs $34,500 expenses/yr.

→ funding sources should **stretch the negative-cashflow runway, not flip it positive early**. That
is exactly the "invest hard, unknown return, chase a *chance* at pro" thesis.

## Ranking / eligibility gates (couple economy to the career ladder)

- Age 13 → end of the year they turn 18.
- Acceptance by ranking: newcomers start **J30/J60**, climb via results; can't just enter J300–J500 /
  Junior Grand Slam unranked. Entry via IPIN.
- Escape hatches: qualifying draws, wildcards, a 16U Regional Reserved Programme, WTN pathway.

→ ranking is the progression currency that **unlocks bigger tournaments → bigger costs → eventual
payoff**. Low-ranked kids literally can't over-enter the top → the gate self-limits the calendar.

## Implications for our redesign

1. **Expense tiers drive both cost AND development** (money↔progress tension); let the player choose.
2. **Travel = the volatile per-event decision**, gated by cash on hand.
3. **Coach-travels-to-events = a premium mid-game unlock** (+results/ranking, burns cash).
4. **Income stretches the runway, never flips it early** — no junior prize money; gear-only sponsors.
5. **Load/injury tied to tournament count, mitigated by physio spend** (turns sports-med into a real
   budget trade-off; ~20% fewer injuries when funded).
6. **Ranking gate unlocks the money** and self-limits over-entry.

## Data-quality flags

Ranges are wide and region/year-mixed — treat single figures as midpoints. Break-even ranking (#330)
is ~2013 ITF data excluding coaching (optimistic). "Tournaments/yr" vs "matches/yr" are different
units across sources. The Section-2 % split is a synthesis, not a single cited breakdown. Junior
sponsorship is almost entirely in-kind gear, rarely dollar-quantified.

(Full source URLs retained in the session research task output.)

# Research — personal life, motherhood, and the random-events architecture (owner digest, 25.07.2026)

Owner-supplied research + mechanics proposals, recorded for Phase-4/6 design work. Fictional
analogues only in-game (WTA/players' names are reference data, not game content).

## 1. Motherhood in the tour (the data)
- ~25 playing mothers on the tour today (~20 in 2023) — small but growing, driven by rules:
  **ranking freeze for 3 years post-birth** (since 2019, used by 50+ players) and **paid
  maternity leave up to 12 months** (since 2025).
- 2026 milestone: two mothers simultaneously in the top-10 for the first time (returns from
  #421→#9 and stable top-10; other climbs: #817→#81, #628→#53).
- Success at the very top stays EXCEPTIONAL: only 3 Grand-Slam titles won by mothers in the Open
  era; top-10 returns before 2026 — four players total.
- Typical timeline: return to play ~6 months post-birth; full form 12–18 months. ~40% of mothers
  return successfully. Second children happen and can work (two documented multi-return careers),
  est. ~20–30% success.
- First-child ages among pros: 26 / 28 / 31 / 35 — wide spread over the 24–35 window.
- Game reading (owner): the freeze mechanic is a ready-made risk/possibility balance; the
  child-vs-career-peak dilemma (peak 23–28) is the emotional core; outcomes legitimately split
  between "breakout return" and "fade" — both must be possible.

## 2. Personal-life arc (parent = OBSERVER, not puppeteer — owner's core principle)
The parent never decides for her; they only shape circumstances and REACT. Hard control → rebellion,
morale loss, relationship damage. Support helps; pressure hurts — systematically.

| Stage | Age | ~Chance/yr | Parent's lever |
|---|---|---|---|
| First crush | 14–18 | 10–15% | support / neutral / forbid (forbid → rebellion risk) |
| Serious relationship | 18–25 | 5–8% | approve / silent disapproval / talk her out (conflict) |
| Marriage | 22–30 | 3–5% | bless / distance / oppose |
| First pregnancy | 24–35 | 2–4% | support only — reaction sets recovery trajectory |
| Return to tour | post-birth | ~40% success | support speeds recovery; pressure → depression risk ↑ |
| Second child | 28–38 | 1–2% | even less influence |

Return mechanics sketch (owner): staged penalties ≈ −40% (0–3 mo) → −20% (3–6) → −10% (6–12) →
full recovery 12+ mo, possible PERMANENT mental-resilience bonus after (priorities shift);
ranking freeze usable for 3 years; sponsors partially lost during the pause; wrong ramp-up
(straight to big events on wildcards) is a documented failure mode vs the small-events ramp.

## 3. Random-events architecture (owner's 3-level split)
- **Micro** (household): mood/small money/fatigue — colds, neighbors, stolen bag, phone addiction.
- **Meso** (strategic): money/rating/contracts — academy offer, federation grant WITH a clawback
  condition, gear-brand contract vs exclusivity, investor % offers, coach departure, national-team
  camp call-up (honor + cost + schedule hit).
- **Macro** (life-defining): career/relationships/health — growth spurt, severe injury, burnout,
  relocation offer, the personal-life arc above.
- **Story arcs** (multi-season chains): "wonder child" (early fame → pressure → burnout risk),
  "valley of death" 16–19 (plateau → technique rebuild gamble vs eternal qualifier),
  "the move" (elite academy abroad → family uproots), "the pivotal match" (top junior showdown),
  "second life" (post-injury style change vs risk).
- Integration: weekly deterministic event roll on a purpose-scoped stream (the planned
  `seed:life:week` — Phase-4 opener per docs/plan); choices move stats (morale/relations/health/
  money), never just text; an events journal surfaces the causal chain.
- ⚠ Cadence discrepancy to resolve on the bench: this digest suggests "1–2 events/week", the
  standing plan says `eventChancePerWeek ≈ 8%`. Start at the plan's ~8% and tune up — 1–2/week
  would drown the season loop.

## 4. Already built vs. future (so we don't double-build)
Already in the game (Season Life wave): injuries by severity with weeks-out + rehab (slice C),
overtraining ≈ the condition system (B), school/exam hard blackouts (B), vacations/recovery →
the season-planner slice, entry auto-refunds (round8-ui slice).
Future, with their gating systems:
- Morale/burnout, parent-child relationship stats → Phase 6 (the racket-rage flagship lives there).
- Growth spurt → younger-years prologue (girl growth peak ~11.5 < our age-14 start).
- Weather/heat (+ thermoregulation, in-match collapse) → weather/venue model.
- Personal-life arc + motherhood → Phase 6+ ADULT arc; pairs with the core principle "levers
  change as she grows" — the parent-as-observer IS that principle's endgame. Needs: morale,
  relationships, adult-stage portraits (bride/pregnant/milf art already in the repo ✅).
- Meso money events (grants with clawbacks, investors) → the explicit-valves economy wave.

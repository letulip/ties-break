# Research — tennis injury statistics by age (owner digest, 25.07.2026)

Owner-supplied research + a proposed mechanics system. This doc: (1) the data worth keeping,
(2) an honest reconciliation of the proposed numbers against the engine's tuning, (3) the
apply-now / defer split. The slice-C spec (`docs/specs/season-life-03-injuries.md`) carries the
applied deltas; `docs/backlog/season-life-future.md` carries the deferred mechanics.

## 1. The data (kept as ground truth)

**Prevalence.** Per season: juniors **46–54%** injured, pros 30–54%. Elite athletes 9–27: 46%
report ≥1 career injury. Rates: juniors **2.1–3.5 injuries / 1000 h** of play.

**Age shape.** ER-visit peak: boys **14**, girls **16** (our WTA-first kid starts at 14 → the sim
window 14→18 spans the girl peak exactly). Under-12 injuries are mostly acute/household (41.9%
head/face) — random events, not overuse. Teens 13–17 = the risk peak (growth + technique churn +
load): sprains, back/lumbar trouble. Adults 18+: risk shifts to chronic lower-limb wear
(**48–56% lower limb**), retirements rising (4.8% of matches unfinished in 2025 vs 3.3% in 2023).

**Sex differences.** Girls: more **ankle + knee sprains** (our kid). Boys: more fractures,
face/eye. Peak-growth loss: boys 16.4 days/yr at peak, girls 7.2 days/yr post-peak.

**Growth spurt.** Injury peak rides the growth-velocity peak: boys ~13.2, girls ~**11.5**. For a
girl starting at 14, the spurt is essentially PAST → the growth-spurt mechanic belongs to the
younger-years phase (5-6→12-14), not to slice C.

## 2. Reconciliation — owner's proposed numbers vs the engine

The proposal's balance examples are internally hotter than its own statistics:
- Proposed: base 0.5%/day with multipliers → a normal 15-year-old lands ~1.8%/day ≈ 12.6%/wk ≈
  **~6 injuries/yr**; the formula-example gives 9%/wk.
- The same document's real-world stats: **46–54% of juniors injured per season** ≈ ~0.5–0.8
  injuries/yr.
→ The multiplier TABLE is a good relative shape; the absolute base must be anchored to the
prevalence, not to the examples. (Also: our engine ticks WEEKLY — all rates below are per-week;
no per-day conversion exists anywhere in the engine.)

Engine anchor (already in the slice-C spec, pre-amendment): balanced kid ≈ tau 0.022/wk →
expected ~1.1 injuries/52wk ≈ prevalence ~65% (slightly hot vs 46–54%, minors dominating —
bench-tunable); grinder ≈ 1 injury / 12–18 wks. This is the right order of magnitude, so the
base + fatigue slope stay; the owner's factors modulate AROUND them (mild, near-1.0 factors),
they do not multiply the base by 3×.

Equivalences (no double-count):
- Proposed "Выносливость <20% → ×3.0 … >60% → ×0.5" ≈ our existing `injuryFatigueSlope` on
  `fatigue = 100 - condition`. Already in. Not added again.
- Proposed "нагрузка (тренировки/нед)" ≈ our `plan.train` already drains condition → feeds the
  same slope. Not added again.
- Proposed "уже травмирован ×0.5" — we use full immunity while out + a 1-week grace after
  clearing. Kept (simpler, and recovery weeks are already lost weeks).

## 3. APPLIED to slice C now (spec deltas, all invariance-safe)

All are post-draw threshold (tau) shifts from pure state, or extra pulls on the private
`seed:injury:week` / `seed:physio:week` generators — the main-stream draw sequence stays
byte-identical (C1 hash 9f783705 unchanged).

1. **Age factor** (girl curve, peak 16): `tau *= ageInjuryFactor(ageYears)` with
   14: 0.90 · 15: 1.05 · 16: 1.20 · 17: 1.05 · 18: 0.95 · 19+: 0.85. Mild by design (see §2);
   bench-tunable. `ageYears = 14 + floor(week / 52)`.
2. **Consecutive-competition load** (proposal: 2/3/4+ tournaments without rest → ×1.2/×1.8/×3.0,
   softened because the play-week ×1.8 already stacks): count the kid's competed weeks in the
   trailing 4 weeks (incl. this one); 2 → ×1.2, 3 → ×1.5, 4 → ×1.8. Derived from the results
   ledger — pure state.
3. **Severity split 60/30/10** (was 55/30/12/3): cum 0.60 minor / 0.90 moderate / 0.975 major /
   1.000 severe (the 10% "heavy" splits 7.5 major / 2.5 severe).
4. **WTA sex skew**: within the lower-limb region (still ~48%), ankle + knee take the majority
   share (girls' sprain pattern); core keeps a lumbar bias (teen back trouble).
5. **One-time treatment cost at onset** (proposal: light $200–500, medium $1–3k, heavy $5–15k+,
   surgery $20k+ — deliberately COMPRESSED so the severe tail stays brutal-but-survivable for the
   8k family, per the owner's "everyone keeps a chance" vision): minor $0 (weekly rehab only) ·
   moderate $200–500 · major $1,000–2,500 · severe $4,000–8,000; plus the existing $60–120/wk
   rehab. Billed on the physio sub-stream, category 'physio'. OWNER-TUNABLE — flagged for the
   bench pass; real-world surgery costs ($20k+) would need an insurance/federation-help valve
   first.

## 4. DEFERRED (→ backlog, each names its missing system)

- **Growth spurt** (12–14: technique −30%, risk ×2, then post-spurt bonuses) → younger-years
  phase; the girl's spurt (~11.5) predates our 14+ start.
- **Heat/humidity/surface-switch multipliers** (×1.3–1.5) + thermoregulation gauge + in-match
  Collapse → needs a weather/venue model + match-engine integration.
- **Recurrence risk** (+30% for 2 wks after an ankle sprain) → needs a post-recovery decay state;
  cheap later via injuryHistory.
- **Injury → sponsor loss** → needs richer sponsorship contracts (current sponsorship is
  rank-gated product discounts only).
- **Parent mini-fork events** ("жалуется на колено": пропустить тренировку vs перетерпеть) →
  the Phase-4/6 random-events system; excellent flagship material alongside the broken racket.
- **Hidden "Heart" / cardiac tail, panic attacks** → already in the backlog (medical exam system,
  morale system).
- **Under-12 acute/household injuries** (falls, face/eye) → younger-years phase random events.

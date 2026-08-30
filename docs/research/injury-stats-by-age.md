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

---

## 5. THE ADULT LIMB – what the literature does and does not say (round 30 #26, 30.08.2026)

§1 above was scoped to the junior window on purpose («our WTA-first kid starts at 14 → the sim
window 14→18 spans the girl peak exactly»), and §3.1's `19+: 0.85` was the off-the-end fallback,
not an adult model. Round 30 #22 found that the fallback had quietly BECOME the adult model – it is
the table's own lowest value and it carries every year from 19 to retirement – and #26 asked for the
adult limb. This section is the evidence sweep that was run to build it. Tags: `[S]` sourced (a
named study with a figure), `[I]` inferred (arithmetic or a defensible reading, and from what),
`[GAP]` not published.

### 5a. The central finding, and it is a gap rather than a curve

⚠⚠ **`[GAP]` THERE IS NO PUBLISHED AGE-STRATIFIED INJURY INCIDENCE FOR PROFESSIONAL WOMEN'S TENNIS.**
Not "we could not find it" – the field says so itself, twice:

- `[S]` **Pluim BM et al., "Tennis-specific extension of the IOC consensus statement",
  *Br J Sports Med* 2021** sets the recommended surveillance age bands at junior (≤18),
  **adult (19–49)**, senior (50+). A single thirty-year-wide "adult" bucket covering a whole
  professional career IS the state of the practice.
- `[S]` **Montalvan B et al., *Orthop J Sports Med* 2024;12(4) (French Open 2011–2022)** reports the
  mean age of INJURED players (27.2 ± 5.4, range 15–44) and states in as many words that
  "demographics of the non-injured players were not available; therefore, it was not possible to
  evaluate whether certain demographics were associated with a higher risk of injury."
- `[S]` **Amor-Salamanca MS et al., *Sports (Basel)* 2025;13(10):336** – the newest systematic review
  – reports two brackets only: adolescents (13–18) **2.11–3.50 injuries/1000 player-hours** against
  adults/professionals (≥19) **1.25–56.6/1000**. That adult range is methodological heterogeneity,
  not an age gradient, and the review does not subdivide it.

**So an adult limb cannot be sourced directly. It has to be built from a proxy, and the proxy has to
be named.** ⚠ Anything below that reads like a tennis age curve is `[I]`.

### 5b. And the two studies that DID test age in women's tennis found nothing

⚠⚠ This is the finding that most constrains how steep the limb may be, and it points AGAINST the
intuition. Both large retrospective mid-match-retirement cohorts tested age as a covariate:

- `[S]` **Palau M et al., *PLOS ONE* 2024;19(6):e0304638** – WTA 267,380 matches / 7,306 retirements
  (1994–2018), 1.36 retirements per 1000 games. Age (match average) tested: **no significant effect
  in the WTA arm.** The ATP arm shows **1.31× per +5 years of match-average age**, and the authors
  flag it as confounded with study year.
- `[S]` **Oliver L et al., *Eur J Sport Sci* 2024;24(10):1526–1536** – WTA main tour, 46,268 matches
  / 801 retirements (1975–2019), 0.81/1000 games. Age difference between opponents **not
  significant**; the authors attribute the rising retirement trend to "escalation of competitive
  burden" rather than to player age.

⚠ Neither is a clean incidence study – both measure the STOPPAGE, which is this engine's second
door, not its weekly roll – but they are the only two places anybody has actually asked whether an
older WTA player breaks down more often, and both times the answer was no.

### 5c. What the tennis literature DOES show with age is BURDEN, not incidence

⭐ **`[S]` Amor-Salamanca et al. 2025: the SEVERE share (>28 days lost) is 43% in adolescents against
54–66% in collegiate/professional players** – a ratio of **1.26–1.53×** on severity where the
incidence numbers show no gradient at all.

Corroborated outside tennis, in the closest-shaped professional sport:

- `[S]` **Williams S et al., *J Sci Med Sport* 2023;26(1):25–30** (elite men's rugby union, English
  Premiership, three seasons): a heavy match season raises the following season's injury **BURDEN and
  not its incidence**, and the effect is "driven by an increased risk for older (>26y) Forwards."

⭐⭐ **THE SHAPE OF THE EVIDENCE IS THEREFORE: EVENTS ROUGHLY FLAT, CONSEQUENCES RISING.** That is a
different instrument in this engine – `severityBands` and the weeks-out draw, not
`ageInjuryFactor` – and it is the better-sourced of the two.

### 5d. The proxies for a rising INCIDENCE limb, ranked, with their numbers

Ranked by how close the sport's loading is to tennis. ⚠ None is tennis, and the spread between them
is the honest width of the uncertainty.

| proxy | comparison | effect | tag |
| --- | --- | --- | --- |
| Masters athletics – Ganse B et al., *J Musculoskelet Neuronal Interact* 2014;14(2):148–154, n=3,154 | 5-year bands from 35 | **no significant age gradient** (2.8% women / 2.2% men cumulative) | `[S]` |
| WTA – Palau 2024, Oliver 2024 (§5b) | age as a covariate | **no significant effect**, twice | `[S]` |
| ATP – Palau 2024 | per +5 years | 1.31× (confounded with year, men) | `[S]` |
| Tennis severity – Amor-Salamanca 2025 | adolescent vs pro, share >28d | 1.26–1.53× | `[S]` |
| Premier League – Argibay-González JC et al., *Int J Environ Res Public Health* 2022;19(18):11296 | 30+ vs <21, injured-share ÷ squad-share | 1.04 / 0.45 ≈ **2.3×** | `[I]` from `[S]` counts |
| LaLiga – same paper | 30+ vs <21, same method | 1.42 / 0.29 ≈ **4.9×** | `[I]` from `[S]` counts |
| EPL hamstrings – Henderson G et al., *J Sci Med Sport* 2010;13(4):397–402, n=36 | per +1 year | OR **1.78** (multivariate) | `[S]` |

⚠ **THE FOOTBALL NUMBERS ARE THE STEEPEST AND THE LEAST TRANSFERABLE.** A hamstring OR of 1.78 per
YEAR compounds to absurdity over a career (×1.78⁹ ≈ 100 from 21 to 30) and comes from a
36-player single-season model; the 2.3–4.9× band from squad shares is sturdier but it is a
collision-and-sprint-duel sport whose dominant injury is a maximal-velocity hamstring tear.
**Tennis's own two attempts at the question returned null.** So the defensible reading of the whole
table is a MODEST rise, at the bottom of the football range and above the tennis null – not the 3–5×
a football-only reading would suggest.

### 5e. And the WTA's own age history runs the OTHER way

⭐ `[S]` **Otis CL et al., "The Sony Ericsson WTA Tour 10 year age eligibility and professional
development review", *Br J Sports Med* 2006;40:464–468.** Premature retirement (leaving the tour at
or before 21) fell from **7% before the Age Eligibility Rule (pre-1995) to <1% after**; median career
length rose **43%**; injury was the top-rated career stressor across every player group.

`[I]` **The documented age-related breakdown problem in women's tennis is at the YOUNG end, not the
old one** – teenagers turned professional too early – which is the opposite of the football proxy's
monotone rise, and it is the one age effect in this sport that an organisation actually measured and
then legislated against. It supports keeping §3.1's junior peak; it does NOT supply an adult limb.

### 5f. Career-end shape

- `[GAP]` No published age-at-retirement distribution or survival curve for WTA players was found.
  The widely-repeated "~27 years average" is a blog claim with no stated denominator and is NOT
  treated as sourced here.
- `[S]` The cleanest sourced "injury as the stated cause" figure in any sport:
  **Koch M et al., *Knee Surg Sports Traumatol Arthrosc* 2021;29(11):3560–3568** – retired Bundesliga
  professionals, n=116: mean age at career end **32.2 ± 4.2**, and **62.9% cite injury as the
  reason**. Men's football, and named as a proxy.

### 5g. What this section licenses, and what it does not

- ⭐ **Licensed:** a modest rising adult limb, roughly **1.5–2×** from the prime years to the
  mid-thirties. It is the bottom of the only quantified proxy band (2.3–4.9× in football) and it
  respects tennis's own two nulls by not going near the top of it. `[I]`
- ⭐⭐ **Better licensed, and it is a DIFFERENT instrument:** an age term on **severity / weeks out**,
  where tennis has its own sourced 1.26–1.53× (§5c). `ageInjuryFactor` cannot express this – it
  multiplies the occurrence threshold, and the layoff length is drawn from `severityBands`.
- ❌ **NOT licensed:** a 3–5× adult limb, a per-year odds ratio, or any claim that the shape is
  MEASURED in tennis. It is not. It is a proxy, and §5a is why.

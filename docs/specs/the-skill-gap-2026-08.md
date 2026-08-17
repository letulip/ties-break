---
type: spec
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-17
---

# Does skill decide a match? – the owner's oldest complaint, measured against the sport

**The owner, more than once, most recently in round 21:**

> «есть впечатление, что скилл особо ни на что не влияет или если и влияет, то очень незначительно.
> Мне бы хотелось, чтобы корреляция стала более явной. Понятно, что в топ-50 разброс по скиллам
> будет не очень заметен, но когда играют топ-50 против топ-200 или топ-300 – это совсем другое
> дело… Есть DnD система, она учитывает результаты не только брошенных кубиков, но и скиллы
> персонажей и мультипликаторы. Я бы хотел, чтобы у нас тоже появились четкие формулы, по которым
> более менее точно можно предсказывать и нам самим и игрокам не биться головой в бетон.»

And, refining it:

> «Я допускаю, что 300 вполне может обыграть 50, это спорт, всякое случается, но вероятность такого
> довольно мала, как мне кажется. Можно поискать статистику.»

**Three parts, in order: what the real number is, what ours is, and what the smallest change would
be.** Nothing here ships. A match-model constant moves every rung, every ranking and every career,
so the proposal arrives with its curve, its cost and its blast radius, and the owner rules.

---

## 1. THE PREDICTIONS, WRITTEN BEFORE THE RUNS

Recorded here first, per CLAUDE.md invariant 4. Commit of this file is the timestamp; the
measurement tool (`tools/skill-gap-odds.ts`) is committed after it.

**P1 – the point→match compounding is CORRECT and is not the defect.** `pMatchBo3` is the standard
iid Markov closed form and should reproduce `docs/research/03-match-engine-math.md`'s own quoted
values to within a point: p .63/.62 → ~55%, .65/.62 → ~65%, .67/.62 → ~73%, .70/.60 → ~89%.

**P2 – neither clamp binds anywhere in the reachable world.** `BASE_CLAMP [0.42, 0.82]` needs
(0.82−0.57)/0.0027 ≈ **93 core points** of gap to reach its ceiling from the WTA base. The widest gap
the population can produce is `tourElite` top 77 against `newcomer` floor 18 = **59**. Predicted
incidence at every rank pair: **0%**. Same for `FINAL_CLAMP [0.3, 0.9]`, which sits further out
still and can only be reached by adding momentum (±0.015) and fatigue (±0.03) to a base that never
got near it.

**P3 – at LARGE rank gaps our model is not flat, it is STEEP.** Our population's core bands are
`tourElite` 67–77 / `contender` 43–53 / `journeyman` 38–48, so #50 vs #300 is roughly core 72 vs 43 =
**29 points** = 0.0783 of p each way. Predicted P(favourite) at #50 vs #300: **≥ 95%**, i.e. an upset
rate **under 5%** – which I predict is *below* the real sport's.

**P4 – the flatness the owner sees is a SMALL-gap phenomenon, and its size is fixed by
`SKILL_K + RALLY_K = 0.0027`.** One core point is worth 0.0054 of combined p gap. Predicted: near
even, **one core point ≈ 2 percentage points of match probability**, so Ines's measured +6.7 core
over her band mean should be worth **~+13 points, i.e. ~63%** against the band. If her measured
record is ~50%, the flattener is *not* inside `src/engine/match/` and the audit has to look at what
sits between a rank and a core.

**P5 – the player's own throttle is the smallest quantity in the system.** The world spans 59 core
points; round 21 measured four years of a college squad's match play at **+0.06 of one core point**
and P5 measured the whole coached/un-coached gap at **0.12**. Predicted: every lever the player can
pull is worth **under one percentage point** of match probability, against a world axis worth ~120.

**P6 – the proposal will be a GAIN and a FLOOR, not a new curve.** Predicted shape: raise the skill
gain so a real rank gap reads like the sport's, and add an explicit noise floor so the upset never
disappears. Predicted cost: the ladder gets harder to climb, because the same steepening that makes
her beat #300 makes #50 beat her.

---

## 2. MEASURED – reality

*(filled after part 1's research; see `docs/research/the-upset-rate.md`)*

## 3. MEASURED – ours

*(filled after the runs)*

## 4. THE PROPOSAL

*(filled last)*

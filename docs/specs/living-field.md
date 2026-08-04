# The Living Field — design document (28.07.2026, pre-code)

> **Partly landed (29.07).** Two of §1's four "does not live" findings are fixed inside the existing
> 199-player cohort rather than by the three-ring architecture below. **Nobody grows** → v20's age +
> ceiling curves (`season/cohort.ts`). **Nobody arrives, nobody leaves** → the conveyor, scoped to
> this one population: `docs/specs/junior-conveyor.md` and `season/conveyor.ts` — §2.1's crunch, the
> yearly intake and the retirement schedule, with the field size held fixed so the tick's cost does
> not move. What is still ahead is the SCALE: the ~2,000-strong population, the LIVE/FIELD/ARCHIVE
> rings (§3) and the separate pro contour (§2.2). Read the sections below as the plan for that; read
> the two specs above for what the engine does today.

> **The FIELD ring landed for the W track (01.08, `feat/living-field`).** §8 below is the
> implemented architecture — ~300 derived professionals behind the professional table, the merged W
> standings, and the W rungs drawing from them — with the calibration table and the measured
> numbers. §§2-3 remain the plan for the full three-ring build; §8 is what the engine does today
> and the phase-2 list it leaves behind.

The owner's brief, from three conversations on 27-28.07, verbatim where it matters:

> «мы сейчас считаем топ-200, почему бы не оставить осознанное сдвигаемое окно +/-100 от девочки,
> которое реально считается и играет С НЕЙ, а по мере продвижения это окно будет с ней сдвигаться…
> А всех остальных (1-2-3к для красивой таблицы) мы будем пересчитывать на основе какой-то средней
> логики, процентов и данных?»

> «сможем мы как-то показывать и "отправлять на пенсию" возрастных игроков, чтобы наши 2-3к реально
> жили? …теоретически какой-то супер-талантливый и удачливый 18-19 лет вполне может прийти и
> разгромить мировые турниры?»

And the standing constraint that owns this whole design: **это нас вообще не парит, мы в
разработке, у нас ни одного игрока нет** — save compatibility is NOT a requirement for this slice.
That licence is spent once; this document is what it is spent on.

---

## 1. Why — the measured problem

The field does not live, and every balance lever we pulled this week bent around that fact.

- **Nobody ages.** `AiPlayer` has no age field at all. 199 girls generated at 14 stay 14 forever.
- **Nobody grows.** `growCohort` adds `rng() * 0.05 * growth` per skill per season — hundredths of
  a point against a 30-60 generation range. The kid's gear alone moves her more in a month.
- **Nobody arrives, nobody leaves.** The same 199 ids from week 0 to week 400.
- **Consequence, played and measured:** the owner's 120k career «доминировала просто на J30,
  уничтожая всё, 50+ побед за сезон». The engine agrees: after the rival-fatigue fix her top-10
  rate tripled — against a field that objectively stops developing while she compounds coach, gear
  and experience. Season 2+ difficulty is an illusion of numbers, not opposition.
- **"Top 20" is unmeaning.** The ITF merit allowances (+4 events for a top-20 junior at 14-15) were
  left out of `feat/junior-age-caps` precisely because top-20-of-199-static maps to nothing real.
- **The band trap (R12-2/13/17).** With one static population the only difficulty dial is the entry
  band, so outgrowing Local at 85 pts slams a door reality never slams. A living field replaces the
  door with a field that simply gets harder above you.

What already works and must be preserved:

- The **replay invariant**: per-week MAIN-stream draw count/order never depends on player input;
  all new randomness is post-draw multiplies or purpose-scoped sub-streams. Non-negotiable.
- The kid's tournaments are REAL simulations; AI-AI matches resolve by closed form inside
  `runAiTournament` (~53 AI tournaments per season, `seed:aitour:<eventId>`).
- Rival fatigue reconstructs from result rows (`reconstructRun`), sharing the kid's drain family.
- The 52-week best-6 ranking window is verbatim ITF Reg 10 — the counting rule survives unchanged.

## 2. Shape — two populations, one card index

### 2.1 The junior tour (13-18): a conveyor, not a pond

- **Population ~1,200 alive at any time** (≈200 per birth-year across six years). Each season:
  the 18-year-olds **graduate out** (top slice seeds into the pro population, the rest retire to
  the archive), and a new intake of ~200 thirteen-year-olds enters at the bottom.
- Every junior gets `birthYear` and an **age-anchored development curve**: skills climb steeply
  13→16, flatten 17-18. The hidden `growth` multiplier (0.5..1.5) finally earns its keep — it IS
  the talent spread. A `growth`≈1.5 girl visibly eats the ladder; a 0.6 stalls at regionals.
  The curve is deterministic per (id, season) off `seed:dev:<season>:<id>` — one draw per player
  per season, never on the MAIN stream.
- **This answers the owner's prodigy question in the negative for juniors, by rule**: nobody
  dominates the junior tour at 19 because nobody IS in the junior tour at 19 — same as reality.

### 2.2 The pro contour (18-35): where the prodigy lives

- **Population ~800**: seeded once from the archive + intake from junior graduations each season.
- Curve: climb to a peak at ~23-24 (the lore doc's WTA-peak research), plateau, decline after ~29,
  retirement by results-vs-age (a fading top-100 hangs on longer than a fading #500 — money).
- **The 18-19 prodigy is REQUIRED here**: a junior graduating with `growth` ≥ ~1.4 and elite skills
  keeps climbing through her pro curve's steep phase and can crash the top within 1-2 seasons.
  That is the girl who becomes the daughter's generational rival — emergent, not scripted.
- The kid crosses into this population the same way every junior does, at 18 — the pro contour is
  Phase-5+ content, but the POPULATION must exist from day one so her seniors are real people with
  real histories when she gets there.

### 2.3 One card index, generated lazily

A player's full card (name, nation, skills at any season, growth, style) is a **pure function of
(worldSeed, playerId)** — exactly how `surnameForSeed` and `generateCohort` already work, extended
with the age curve. Nothing about a dormant player is stored; the card materialises when asked for.
Stored state exists ONLY for what history actually changed: result rows, points, injuries — and
only for players inside the live window (§3).

## 3. The window — who is actually simulated

### 3.1 Three rings

| ring | who | what runs |
|---|---|---|
| **LIVE** | everyone within ±100 ranking places of the kid, PLUS the top 20 of each tour, PLUS anyone with a stored relationship to her (played her, named rival) | full current model: real entrant selection, `runAiTournament` closed-form matches, fatigue reconstruction, injuries |
| **FIELD** | the rest of the alive population (~1,500-2,000) | one seasonal pass: development curve + a season-points allotment (§3.3); no weekly anything |
| **ARCHIVE** | retired/graduated | frozen rows for history screens; zero cost |

The kid's tournaments draw entrants from LIVE, exactly as today — **the number of simulated
tournaments per season does not change (~53), so the weekly tick budget does not change.** That is
the whole trick: the field grows 10×, the simulation does not.

### 3.2 The window is a VIEW, not a list

Membership is **recomputed from the standings at each season boundary** (not weekly — a window that
breathes weekly makes entrant selection chase its own tail). Nothing is stored about membership
itself; it derives from (standings, kid's rank). Crossing INTO the window is seamless by
construction: the newcomer's card comes from the pure card index, her points from the FIELD
allotment she already earned (§3.3), her fatigue starts clean at the boundary — the same
"pre-history, then live" hand-off the cohort already does for the kid's own debut season.

The one hard rule: **LIVE-ring draw streams stay keyed the way they are** (`seed:aitour:<eventId>`,
`seed:injury:<week>` …). Window recomposition changes WHO is selected as entrants — which those
sub-streams already tolerate (entrant selection is downstream of the stream key) — and never
changes the MAIN stream. The frozen capture (41550 / `e6b0c709`) must survive the whole slice
untouched; if any step moves it, that step is wrong.

### 3.3 The FIELD's season pass — points without matches

Once per season, per field player: `seed:field:<season>:<id>` drives
1. the development step (curve + growth + a small noise term), and
2. a **season-points allotment** drawn from a strength-conditioned distribution calibrated so that
   the FIELD's aggregate points table matches what LIVE players of the same strength earn by
   playing. Calibration is a bench task with a pinned test, not a hand-wave: sample N field players,
   compare their allotted season points against LIVE players ±2 strength points, assert the
   distributions overlap.

Titles the field "wins" are attributed by weighted lottery (strength-weighted, off the same
sub-stream) so the news/history screens can say who won a tournament the kid never saw — the table
stays coloured, never flat.

### 3.4 Coherence at the boundary (the failure mode to test hardest)

A girl entering LIVE at rank 180 must be *continuous*: her card says 16yo/strong, her points match
her allotments, and her next live results should not jump discontinuously. The pinned test: run the
same world twice, once with the window forced wide (she was always LIVE) and once entering normally;
her season-end points must land in the same statistical band. Individual matches will differ
(different streams touch her) — the DISTRIBUTION must not.

## 4. What rides in this slice — because the field makes them meaningful

**Points retable** (`docs/research/ranking-points-by-tier.md` §6, owner-approved direction):
the three international rungs take the real ITF table ×10, domestic rungs placed via the LTA
conversion, ladder reordered `local < regional < j30 < j60 < national < j300`, every
`enterPointBand` rescaled. Doing this INSIDE the field slice (not before) means it is measured
against opposition that develops — the wave-B lesson was that measuring it twice is the cost of
sequencing it wrong.

**The band trap dies by soft entry** (R12-2/13/17): with the retable, "outgrown" tiers stop hard-
closing. She may enter down-tier; what stops her is reality's own stoppers — zero-to-token points
(the real ITF pays nothing beneath your level THROUGH the points table, not through a ban) and a
"beneath her level" warning. The owner's sliding-overlap instinct and the research's soft-entry
option converge here; the hard `enterPointBand` ceiling survives only as the UI's "beneath her
level" line, not as a lock.

**ITF merit allowances** (+4 events for top-20 at 14-15, the pro-event allowance for a year-end
top-5 junior): with a 1,200-strong junior tour whose top 20 are the best of six birth-years, these
finally map honestly. They go in WITH the age caps that already shipped — the cap gains its real-
world escape valve exactly where the real rulebook has one.

**Rival storylines get their substrate for free**: named rivals with birth years, growth arcs,
graduations, retirements. The `angry`-at-a-named-rival trigger the emotion system wants becomes
possible. This slice does NOT build storylines; it makes them buildable.

## 5. Costs, measured against today

- **Save size**: an alive population of ~2,000 needs NOTHING stored per player beyond what LIVE
  players store today (cards are derived). Stored rows grow only with the live window's history —
  same order of magnitude as the current 199-cohort save (3-4 KB gzipped). Non-issue.
- **Tick budget**: unchanged by construction (§3.1). The one new cost is the season-boundary pass:
  ~2,000 × (one curve step + one allotment draw) — thousands of arithmetic ops, once per 52 weeks.
  Invisible.
- **The schema break**: `AiPlayer` gains `birthYear` (and drops nothing); the cohort array becomes
  the LIVE ring's roster; `seasonHistory`/results formats survive. One schema bump, one migration
  that RE-SEEDS the world's population (old saves' careers can keep their kid but get a new field —
  acceptable per the owner's "мы в разработке" licence, and said in the release note, not hidden).

## 6. Slices — each lands green on its own

1. **S1 — ages and the conveyor** (engine): `birthYear`, the dev curve, graduation/intake at the
   season boundary, retirement rule for pros. Cohort stays 199-sized this slice; the curve alone
   already un-freezes the field. Bench: season-3 win-rate vs today (expect it to DROP — that is
   the point), band-clearance times, outcome bands vs `career-outcome-targets.md`.
2. **S2 — the big population + rings**: 1,200 juniors + 800 pros, the card index, the window as a
   view, the FIELD season pass + calibration pin, the boundary-coherence pin. The standings screen
   learns to show a big table cheaply.
3. **S3 — the retable + soft entry + merit allowances**, measured on the living field, gated on
   `career-outcome-targets.md`. The J30-domination scenario from the owner's 120k career becomes a
   named regression: same profile, same policy, assert she can no longer sweep 3-of-5 J30 titles
   in season 2 with a 50+ win season.
4. **S4 — surfaces**: news/standings/history showing arrivals, graduations, retirements, the
   prodigy's rise; the "beneath her level" copy; rival cards with age.

Each slice is a branch, each gets the full gate, S2 carries the schema bump.

## 7. Open questions for the owner (none block S1)

1. **Intake size vs difficulty**: ~200/year keeps the junior tour at ~1,200. Bigger intake = deeper
   fields = harder titles everywhere. This is THE difficulty dial of the game after this slice —
   tune on the bench, but the first value is a design taste call.
2. **Does the kid see the pro tour before 18?** The population exists from day one; the question is
   purely UI — a "world tour" news feed with pro results could run from Phase 4's news slice.
3. **Named rivals**: how many, and are they chosen by the engine (most-played, closest-ranked) or
   ever by the player? Substrate lands in S2 either way.
4. **The archive**: do retired players stay browsable forever (a "where are they now" screen is
   nearly free) or fade after N seasons?

## 8. The FIELD tier, phase W — implemented (01.08, `feat/living-field`)

The owner's ruling that scheduled this slice ahead of everything else in the plan: **«Население -
это критично»**. The measured problem it answers is §1's, one table up: the professional (WTA)
table held no professionals. A W15 field was drawn by percentile band over a MIXED-currency table
of 199 juniors, its median entrant sat at position ~53/200 with mean core skill 50.2 — WEAKER than
a J300 field (median position 20, skill 53.9) — and the owner's ITF-#6 girl won five W15 titles in
a row losing one match total. Five W15 titles then printed **#9** on the professional table,
because the table was 199 zero rows and her.

### 8.1 What exists now

**~300 field professionals for the W track** (`season/fieldPros.ts`), each { id `fp-<n>`, name,
nation, age 16-30, the four attributes + a stored-equals-derived groundstroke, a strength storey
`elite | contender | journeyman`, and virtual W points }. They are **pure derivation, never
persisted**: every fact comes off `rngFromSeed(`${seed}:field:<seasonIndex>:<n>`)` — a fresh
purpose-scoped generator per player — so the MAIN weekly stream is untouched BY CONSTRUCTION (the
frozen capture 41550/`e6b0c709` re-derives green on this branch, which is §3.2's hard rule
holding). Not in `world.cohort` (no fifth `driftCohort` draw, no conveyor roll), not in the save
(schema stays 34, no migration), regenerated each season (`seasonIndex` in the key = phase-W
turnover: stable within a season so previews and draws agree, new faces each year). Names come from
the cohort's own pools, deduped against the LIVE cohort and within the field by salted re-draw —
the two persisted "Uma Tamm" stay, no new collisions join them.

**The merged W standings** (`mergedWtaRanking`): LIVE rows exactly as `computeRanking` folds them
(earned points, kid included) interleaved with the field's virtual rows — points descending, earned
beats derived on ties, competition rank numbers. Every read of the W table flows through one line
in `rankingFor(world, 'wta')`: `kidRankWta` (her HONEST rank — five W15 titles now lands ~#52, the
whole point), the Stats standings (already windowed top-10 + around her, so ~500 rows cost
nothing), the tournament overlay's opponent ranks, and the entry gates. `acceptanceRank` reads the
merged size for W rungs — the enterPct SHARES survive the field growing, exactly as their comment
promised: w35 "top 100 of 200" became "top 250 of 500", w100 "top 50" became "top 125", and the
girl with five W15 titles still clears both.

**Her W draws are made of the merged field**: `computeShadowTournament` and the Season-card preview
hand `selectEntrants` the union universe (LIVE cohort ∪ field pros) positioned by the merged W
standings, for W-track events ONLY — `universeForTier` returns the cohort BY REFERENCE for the six
other rungs, and a guard pins that with reference equality. The percentile-band machinery on top is
byte-identical; LIVE rows fold without the kid, the same independence rule `aiRanking` has always
had. Field pros enter fresh (condition 100): they carry no fatigue ledger in phase W — a named
simplification, conservative in the hard direction (the field she meets is at its best).

**The canonical AI W-brackets stay LIVE-only.** They write result rows; a field pro must never
write into `world.results` (persisted, pruned, sized for 199). Consequence, accepted: news lines
about AI W-tour winners still name LIVE players in phase W. Her own shadow brackets DO contain
field pros — they award nothing to anyone but her, snapshot her opponents by value into the match
record (replays stay self-contained), and the champion news line resolves fp- names through the
derivation.

### 8.2 The calibration, measured (tools/field-quality.ts; 16 worlds, 400 W15 / 208 W35 events)

The bench ticks each world 40 real engine weeks first — canonical brackets filling the ledger,
rivals earning and tiring — because that is the state a career actually meets its W15s in, and it
is what the static week-0 probe got wrong (it read BEFORE at 22%, missing the fatigue that made
the owner's five-in-a-row possible). Reference build = the owner's real case: serve 66 / ret 50 /
composure 57 / stamina 54 / ground 65, fresh, run through the full engine bracket on the event's
own `seed:kidtour:` stream.

|                                    | BEFORE (mixed table, LIVE only) | AFTER (merged, cohort ∪ field) |
|---|---|---|
| W15 field mean core                | 49.4 (wrecked — mid-season fatigue) | 49.0 (fresh professionals) |
| W15 median entrant position        | 67/199 of the mixed table       | 94/499 of the merged table |
| **P(she wins a W15 title)**        | **83.0%** — the five-in-a-row reality | **20.5%** — target 15-35% ✓ |
| W35 field mean core                | —                               | 51.0 (measurably above W15 ✓) |
| P(W35 title)                       | —                               | 16.3% |

The honest-rank pins, from the same run: 51 of 300 pros hold >50 W points, so a LIVE girl with
five W15 titles lands **#52 of 500** (pinned to the promised #40-80 in
`tests/season/fieldPros.test.ts`); accepts w35 **top 250**, w100 **top 125**.

The strength table (ONE table, `FIELD` in fieldPros.ts): elite 30 @ core 56-66 (measured mean
61.8), contender 120 @ 43-53 (47.8), journeyman 150 @ 38-48 (43.1); per-tier points bands 85-450 /
18-64 / 2-16, an age ramp (young pros hold 0.65..1.0 of their skill-implied points — the
under-ranked young shark, and the reason a 28-year-old outranks a 19-year-old of equal game), and
a ±10% jitter. ⚠ The middle and tail sit ~one notch below the design draft (52-62 / 45-55), moved
WITH THE BENCH IN HAND under the brief's own tuning clause: W15's window over a ~500 table is
roughly the players ranked #75-140, and under any skill-monotone points curve those ARE the
75th-140th strongest — the draft pyramid put mean core 56.8 there, dead level with the reference
junior, and measured her title chance at 3%. No points-curve shape can fix rank order equalling
skill order; only the pyramid could move, and the elite storey did not (it still towers over every
junior).

### 8.2b Phase 2 — the fourth storey and week exclusivity (02.08, W2-FIELD2)

Ruling 3 unchanged: still derived, still per-season, zero persisted bytes, zero schema. What
changed is the SHAPE of the pyramid and the rule that governs a shared week.

**The measurement that opened the wave**, taken on `main` before a line moved (tools/field-quality.ts
widened from two rungs to six, 16 worlds):

| rung | field mean core | P(reference strong junior takes the title) |
| --- | --- | --- |
| W15 | 51.4 | **8.8%** — against a shipped 15–35% target |
| W35 | 53.8 | 6.8% |
| W50 | 57.3 | 1.6% |
| W75 | 59.7 | 0.6% |
| W100 | 59.7 | 1.0% |
| WTA 125 | 59.7 | 2.1% |

Two defects in one table. The top **three rungs drew the same field to one decimal** — every window
from W75 up opened at percentile 0, entry is position-biased, and there was nothing above a
thirty-strong elite storey for a WTA 125 to reach for. And **W15's title probability had drifted to
8.8%** since the phase-W calibration read 20.5%: W2-LADDER's 25 extra draws a season give the LIVE
cohort real W points, LIVE girls rise in the merged table, and every pro they pass is pushed down
into the W15 window. Nobody chose that; nobody had re-run the bench.

**`tourElite`** — 64 pros, core [67, 77], points 550–11,000 at gamma 3 (median ≈ 1,900, one or two
names a season over 9,000). `FIELD.size` 300 → 364; the three shipped storeys keep their counts.
The core band is solved from two measurements rather than chosen: the TOP is the midpoint of what a
career can become (20k `rollPotential` rolls — p99 73.2, max 80.8), so the world #1 is reachable and
only by a near-max career; the MEDIAN is set so the reference strong junior beats it 21.6%, the same
number as her own W15 title target (a median elite is a coin flip for her at 47.3%). Its points are
borrowed from a tour we do not simulate — 250/500/1000/Slams are act 3 — which is why no career and
no derived pro can EARN a five-figure row inside today's calendar.

**The windows slide instead of nesting.** Nested prefixes (`[0, x]` with x shrinking) are what made
three rungs one field; every rung now has a top as well as a bottom, because in the real sport a W75
does not draw the world's head. Measured, shipped (16 worlds, up to 400 events a rung, exclusivity
live):

| rung | band | field core | P(title) | candidates min/mean |
| --- | --- | --- | --- | --- |
| W15 | [0.22, 0.72] | 48.5 | **19.8%** | 226 / 273 |
| W35 | [0.185, 0.62] | 50.4 | 13.1% | 202 / 237 |
| W50 | [0.145, 0.52] | 55.1 | 2.3% | 177 / 204 |
| W75 | [0.105, 0.42] | 60.0 | 0.0% | 139 / 162 |
| W100 | [0.065, 0.33] | 65.9 | 0.0% | 124 / 137 |
| WTA 125 | [0.025, 0.26] | 70.7 | 0.0% | 119 / 125 |

Strictly monotone, W15 restored, and **0.0% of every rung's draw comes from outside its own band** —
no window is quietly made of backfill, which is the failure W100's own comment records.

**Week exclusivity** (`weekFieldExclusion`, season/tournament.ts): when two W rungs share a week the
higher one draws first, off its own `seed:kidtour:` sub-stream, and its members leave the lower
rung's candidate window. Order is TIER_LADDER with an event-id tie-break, so it is total. It is a
separate mechanism from `resolveDoubleBookings` because that one is post-draw arithmetic over the
canonical brackets and a field pro has no ledger row to rearrange. Scope: the W track; a non-W event
gets the empty set on the first line. Measured effect on the weeks where it bites — a W50 sharing a
week with a W100 draws a field of core 51.4 against 52.6 on a clear week, and her title chance there
is 14.1% against 8.2%. One pro plays one event a week, and it is visible.

The clean A/B, same seeds, same bands, the rule off and on (`--no-exclusivity`, 16 worlds):

| rung | core OFF → ON | P(title) OFF → ON | candidates at the narrowest OFF → ON |
| --- | --- | --- | --- |
| W15 | 49.2 → 48.5 | 19.5% → 19.8% | 282 → 226 |
| W35 | 51.2 → 50.4 | 12.8% → 13.1% | 245 → 202 |
| W50 | 56.1 → 55.1 | 1.2% → 2.3% | 211 → 177 |
| W75 | 61.2 → 60.0 | 0.0% → 0.0% | 161 → 139 |
| W100 | 66.6 → 65.9 | 0.0% → 0.0% | 136 → 124 |
| WTA 125 | 70.7 → 70.7 | 0.0% → 0.0% | 119 → 119 |

Every rung softens except the top one, which has nothing above it to lose people to — the rule's own
shape, read off the measurement. The price is 12–56 candidates at the narrowest week, and every
window still holds three to seven draws' worth with the out-of-band share at 0.0%.

### 8.2c The points curve — the owner's pacing ruling (03.08)

The fourth storey fixed the head and left the defect that actually sets the pace: **the table was
flat under her.** Pre-wave, a 104-point girl read as world #27 in a table whose #300 held 9 points
and whose #500 held 0 — a ~14× position error against the real ladder, and the reason a career
reached the top of the world in two seasons. The owner's ruling, 03.08: «согласен с первым
вариантом, настоящая кривая. Всё так, мы воссоздаем максимально всю лестницу с небольшими
корректировками и допущениями с нашей стороны» — the merged table takes the REAL points-to-rank
curve, and the consequence he accepted with it is that the top of that table is legitimately out of
her reach until act 3 builds the 250/500/1000/Slam rungs (our shipped ladder's theoretical maximum
season is ~1,500 points ≈ real #45).

So the whole pyramid was lifted, not just topped. Achieved fit, printed by every bench run:

| rank | #1 | #10 | #50 | #100 | #150 | #300 | #500 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| REAL | ~10,500 | 4,000 | 1,400 | 850 | 520 | 190 | 75 |
| OURS | 10,469 | 4,308 | 1,340 | 822 | 513 | 189 | **0** |

Rows below #50 are stable to a few percent across seeds (#50 1,249–1,340 · #100 822–869 · #300
184–194); the head is a 1-in-64 order statistic over a gamma-6.5 band and varies (#10 measured
4,067–6,244 across four seeds).

**What the fit buys, checked against this project's own published arithmetic** (act2-pro-tour.md §2,
written as a design target and untrue of the old table): year 3 «≈ 400–650 pts → #150–200» measures
#183 at 400 and #132 at 650; year 4 «700–1,000 → top-100» measures #87 at 1,000; year 5+ «1,400+ →
top-50» measures #49 at 1,400.

**⚠ #500 IS THE ONE ANCHOR THIS BUILD CANNOT REACH, and it is a population limit, not a calibration
one.** 364 derived pros hold points; rows 365+ of the merged table are the LIVE cohort, mostly on
zero. Matching #500 = 75 needs a fifth storey and `FIELD.size` near 520 — a merged table of ~704
rows, which re-opens every `entrantPctBand` and the sponsor gate that is derived from the table's
size. Reported, not taken.

### 8.2d The acceptance cuts, re-derived — and what actually gates the climb now

**THE BUG THE CURVE EXPOSED.** `enterPct` was a SHARE of the merged table, and that was the right
unit while the table was a compressed artefact where "the better half" meant "a decent player".
Against a table carrying the real curve a share bites in real ranks: W35's 0.5 resolved to 282nd
place ≈ **219 W points**, while a perfect best-16 window of nothing but W15 **titles** caps at
**160**. The second rung of the ladder was unreachable from the first, and no guard could see it —
every test in the suite checks one rung at a time.

**THE FIX IS THE REAL TOUR'S OWN ENTRY RANGES**, because an acceptance list was never a share of
anything: it is a rank cut, and the same cut whether the world holds 500 players or 5,000.

| rung | real acceptance range (women's ITF/WTA) | our cut = the range's floor |
| --- | --- | --- |
| W15 | ~#400–1000+, unranked players get in | none — it is the on-ramp (ITF junior points) |
| W35 | ~#250–700 | 700 |
| W50 | ~#200–550 | 550 |
| W75 | ~#150–450 | 450 |
| W100 | ~#120–350 | 350 |
| WTA 125 | ~#80–250, plus wildcards | 250 |

New field `TierDef.acceptsRank`, read by `acceptanceRank` in preference to `enterPct`. The ITF and
domestic rungs **keep the share** — their tables are population artefacts with no external anchor,
so a share is still the honest unit there. One rule per table, stated per table; `hasAcceptanceList`
is the single predicate everything else asks so the on-ramp cannot be mis-detected.

⚠ The lower cuts are **no-ops by construction**, and that is the finding rather than a shortcut: our
table is 564 rows deep and a real W35's list reaches #700, i.e. below the whole table. W35 and W50
admit anybody the table holds — which is what the real rungs do, and it is how «she must always have
tennis» survives an honest curve.

**THE WALKABILITY RECEIPT** (`tools/ladder-walk.ts`, 6 prospect careers × 9 seasons, entry policy
"the strongest rung the engine accepts", real brackets, real fatigue, real AER cap):

| season | age | median W pts | median rank | rungs open | entered |
| --- | --- | --- | --- | --- | --- |
| 0–3 | 14–17 | 0 | #460–498 | W15, W35, W50 | junior events |
| 4 | 18 | 0 | #498 | W15, W35, W50 | W15 ×1 |
| 5 | 19 | 7 | #493 | W15, W35, W50 | W15 ×4 |
| 6 | 20 | 8 | #510 | W15, W35, W50 | — |
| 7 | 21 | 3 | #502 | W15, W35, W50 | W35 ×1, W50 ×1 |
| 8 | 22 | 10 | #490 | W15, W35, W50 | W15 ×2 |

Best merged rank reached, per career: **#460 #449 #468 #462 #452 #463**. Against the retired
share-based cuts (W35 282 · W50 226 · W75 169 · W100 141 · WTA 125 113) **not one career would have
cleared even W35 in its whole life**; under the shipped rank cuts W35 and W50 are open from her first
professional week. That is the blocker removed.

**⚠⚠ AND THE LADDER STILL DOES NOT COMPLETE — IT IS GATED BY FATIGUE, NOT BY POINTS.** W75 opened in
1 career of 6 (season 8); W100 and WTA 125 in none. The reason is volume, not the cut and not her
game: she reaches **core 73.7** — stronger than any field she meets — and still enters only
**7.5–8 events a season across every tier** in her twenties, of which a handful are W-rung. The
calendar offers ~70 W events a season. Swept across entry disciplines (how far above a rung's
condition floor she insists on being before booking), the volume barely moves:

| rest margin above the floor | 0 | 5 | 10 | 15 | 20 |
| --- | --- | --- | --- | --- | --- |
| events entered, season 7 | 8.7 | 7.0 | 12.0 | 8.3 | 9.0 |
| mean condition | 48 | 59 | 43 | 59 | 46 |

Grinding wrecks her and resting starves her: the ceiling is `recoveryBase` 1/week against a
title-depth run's strain, not the policy. **Reported and stopped there** — fatigue pricing is an open
owner decision and this wave does not pre-empt it.

⚠ The sponsor gates moved with the cut they are derived from, since the rule ("National signs the
girl who would be IN the W100 draw, Global the one still in it on the last day") reads W100's
acceptance list: `national.maxWtaRank` 125 → **350**, `global` 31 → **87**. A looser gate, following
from the table being honest rather than compressed. Flagged, not smoothed.

A 50-point LIVE row (five W15 titles) consequently lands **#365 of 564**, not the phase-W promise of
#40–80 — which was only ever reachable because the field held nobody in the middle. The pin in
`tests/season/fieldPros.test.ts` is re-aimed to #300–420, and what it defends is unchanged: the
number it exists to kill is «#9».

**⚠ THE COHORT COST W2-LADDER HANDED OVER: measured, and the fix is out of this slice's scope.** Its
finding was 25 extra W draws a season landing on the same ~82 sixteen-plus LIVE rivals. The
population does NOT relieve it and cannot: the canonical `seed:aitour:` brackets are LIVE-only by
`universeForTier`'s scope fence, so 364 professionals absorb exactly zero W draws — measured, 4.50 W
result rows per rival over a 20-week window before the wave and 4.50 after. What the band re-measure
did do is spread the same load: heavy-floored rivals 20–27 → 10–20 of 199, at the price of the
ever-floored share rising 27.6–33.7% → 33.7–38.2%. The fatigue bench's rival-side gate therefore
stays at 40 (measured `rivalCondMean` 46.3 → 45.4); W2-LADDER's hope of restoring it to 50 is not
recoverable without the §8.3 item below.

### 8.3 Phase 2 — what this slice deliberately leaves

- **J and domestic tiers keep the LIVE-only universe.** The mixed-table percentile issue for J
  tiers (§1's band trap, junior edition) is real and untouched.
- **Field-pro fatigue.** Phase W's pros are always fresh; a derived seasonal schedule (or §3.3's
  allotment shape) would let a tired pro sit a week out.
- ~~**Field pros in the canonical AI brackets and the news**~~ — **LANDED 04.08, §8.4 below.** It
  needed neither fp-safe result rows nor the §3.3 title lottery: a pro plays the bracket and simply
  leaves no row.
- **Aging and turnover ACROSS seasons** — today the field re-deals per season; §2.2's pro contour
  (careers, peaks at 23-24, retirements, the graduating junior joining the field) is the real
  design.
- **Name-pool widening** — 44×210 combinations serve 199+300 players; the pool should grow before
  the population does (append-only, see the SURNAMES note in cohort.ts).
- **The Stats World-Tour chip** — the wta tab rides in a parallel wave (feat/round15); the data
  under it (`ladders.wta`) is finished here and works whichever lands first.

### 8.4 The canonical brackets — the fence moves, the ledger does not (04.08, W3-FIELD3)

§8.3's third bullet, taken. The scope fence at the top of `fieldPros.ts` held two facts together
that turn out to be separable — **"a field pro is in the draw"** and **"a field pro leaves a row"** —
and only the second one costs persisted bytes. So the W-track canonical brackets now draw from LIVE
cohort ∪ field pros, through the same `universeForTier` seam, the same `selectEntrants`, the same
age gate and the same entrant bands her shadow run has used since phase W; and `runAiTournament`
writes a ledger row for the LIVE entrants only (`isFieldProId` → `continue`).

**The shape, and what it costs.** Zero schema, zero migration, zero new fields. The ledger gets
*smaller*: a 32-draw W event used to push 32 junior rows into `world.results` and now pushes only as
many as it drew LIVE girls. Two alternatives were considered and not taken — a parallel
non-persisted results view (a second ledger for `rivalConditions` to keep in step with the first)
and a bounded per-season pro-results structure (a schema bump to buy a pro a ranking that moves,
which is §2.2's pro contour and should arrive *with* aging and retirement, not ahead of them). What
the chosen shape costs is fidelity: **a pro's canonical results change nothing about her.** She
cannot climb by winning a W100, cannot fall out by losing her opener, and banks no fatigue.

**And it made the tick FASTER, which was not the aim** — 3 worlds × 208 timed weeks after a season
of warm-up, both arms on this branch: **2.34 → 1.65 ms/week (−29%)**. A bigger candidate pool costs
one draw per extra candidate on an event sub-stream; not writing ~30 rows per W event costs the
ledger nothing every week thereafter, and `rivalConditions` / `computeRanking` / `pruneResults` all
fold that smaller ledger on every single tick. The saving is larger than the spend.

**RNG.** Zero MAIN draws, exactly as before — the frozen capture (41550 / `e6b0c709`) re-derives
byte-for-byte, asserted by five suites and by both arms of every input-independence A/B in
`planner.test.ts` P1. What moved is the COMPOSITION of each W event's own `seed:aitour:<id>`
sub-stream (one draw per candidate of a 563-row universe instead of a 199-row one) — the documented
mutable class, and independent of player input by construction: the count is a function of (seed,
week, the kid-free ledger, the derived field). The six non-W rungs are byte-identical, because
`universeForTier` hands them back the cohort array instance itself.

**Acceptance 1 — big draws are possible now** (`tools/big-draw-cost.ts`, 4 worlds × 260 weeks,
sampled every 13th; both arms measured on this branch, the seam off and on):

| draw | of-age in world | in-band | out-of-band | under-age | youngest | ms/bracket | verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 32 BEFORE | 110.4 | 37.0 | 0.0% | 0.0% | 17 | 0.13 | OK |
| 32 AFTER | 450.1 | 99.2 | 0.0% | 0.0% | 17 | 0.56 | OK |
| 64 BEFORE | 110.4 | 37.0 | 42.2% | 0.0% | 17 | 0.24 | OK |
| 64 AFTER | 450.1 | 99.2 | **0.0%** | 0.0% | 17 | 0.74 | OK |
| 128 BEFORE | 110.4 | 37.0 | 71.1% | **14.6%** | **13** | 0.48 | **BROKEN** |
| 128 AFTER | 450.1 | 99.2 | **22.5%** | **0.0%** | **17** | 1.76 | **OK** |

The measurement that shipped the majors at 32 was population, and the population answered: 110
eligible players became 450, the 128-draw's children are gone, and the youngest entrant of a Grand
Slam is seventeen at every size. ⚠ **The draw sizes are NOT changed in this wave** – this is the
number that lets the owner decide. What he should read before deciding: at 128 the draw is still
22.5% backfill, because the Slam's own window `[0, 0.185]` is 104 rows of a 563-row table against
128 chairs. A real 128 therefore also wants either a wider top-rung window or the fifth storey §8.2c
flags (`FIELD.size` ≈ 520). At **64 the field is entirely in-band** and the clock is 0.74 ms.

**Acceptance 2 — the W tour can name a professional.** `runAiTournament` gained a champion news
line, and the name resolves through `playerShortName`, so an `fp-` id comes back as a person. Two
deliberate limits: it fires from **W100 up** (a feed budget, not a taste — `EVENTS_CAP` is 400 and
all ten W rungs would be ~98 lines a season against a feed that already takes ~364; W100-and-up is
~37, under one a week), and it skips the event **she entered**, because her shadow run and the
canonical bracket are two different universes for one event id and printing both would put two
champions of one tournament in one week's news.

**⚠ THE COHORT COST §8.2d HANDED OVER IS REPAID, AND IT OVERSHOT.** That entry measured 4.50 W
result rows per rival before and after W2-FIELD2 and concluded the population "does NOT relieve it
and cannot" while the fence stood. With the fence moved, the same sweep as every C2 re-pin (8 seeds
× 40 ticked weeks × 199 rivals, window 20w), the seam off and on:

| | BEFORE (canonical W = LIVE only) | AFTER (LIVE ∪ pros) |
| --- | --- | --- |
| W result rows per rival | 6.79 | **0.00** |
| worst floored weeks / 20 | 10–19 | **0** |
| heavy (≥10w floored) of 199 | 1–22 | **0** |
| ever floored | 23.1–31.2% | **0.0%** |
| min median condition | 28–36 | **95–100** |

The C2 tripwire that has been inverted since task #17 — "the knee claim is currently LOST … if a
later slice gives the field its condition back, this line fails and somebody has to restore the
stronger assertion" — is restored at the knee it originally defended.

**⚠⚠ AND THE FLIP SIDE, WHICH IS THIS WAVE'S OPEN ITEM: the load did not get SHARED, it MOVED. LIVE
W rows are now exactly zero.** A junior holds no W points, so she sits below all 364 pros in the
merged table, so she is outside every W rung's entrant window (the widest, W15's, ends at percentile
0.72 and the pros alone fill it), so she is never drawn, so she can never earn a W point. That is a
**closed loop** — the same one the kid's own gate solves with an on-ramp rule (`tierFloorOpen` reads
her ITF junior points for W15, "because a player cannot hold a ranking in a table she has never
played in"). The AI juniors have no such rule and this wave deliberately does not invent one. It is
pinned as a fact in `tests/rivals.test.ts` C2 and `tests/season/fieldPros.test.ts`, so whoever gives
the juniors a route into the professional table has to come back and restate the trade. The two
obvious knobs: an AI on-ramp (a junior's ITF standing positioning her in the merged W tail) or a
capped professional share of each W draw.

**Also freed, unasked:** the pre-off-season wall. `resolveDoubleBookings`' over-subscribed weeks —
three structural offsets in every season of every seed, 312 draw slots for 199 rivals — measure
**zero in 104 weeks**, because the shortage was always a W shortage and a W chair may now hold any
of 364 professionals. The Hall arithmetic inside that guard is untouched and the count is pinned at
the measured zero.

**⚠ The rival-side fatigue gate now has room that is not this wave's to spend.** §8.2d recorded that
the fatigue bench's rival-side gate stays at 40 and «W2-LADDER's hope of restoring it to 50 is not
recoverable without the §8.3 item». It is recoverable now — `rivalCondMean` has a great deal more
headroom than 50 — but re-tuning a bench gate on the back of a population change is a separate,
measured decision. Reported, not taken.

---
*Grounded in: `cohort.ts` (199 / 8 draws / 0.05-growth), `world.ts` `runAiTournament`
(`seed:aitour`), `rival.ts` `reconstructRun`, `calendar.ts` cadences and `entrantPctBand`s,
`ranking-points-by-tier.md`, `career-outcome-targets.md`, the owner's careers (120k J30 domination;
8k band trap), and the wave-B measurement that points alone do not move the grind.*

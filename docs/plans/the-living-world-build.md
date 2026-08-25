---
type: plan
status: draft
area: season
canonical: false
last-reviewed: 2026-08-23
---

# The living pro contour – build plan

The backlog's L-item 1 ([the-living-world.md](../backlog/the-living-world.md)), detailed for
review. The ask: the professional field genuinely LIVES – results that move, aging, retirement,
arrivals. The plan is established from the code first, because **more than half of this already
exists** and two of the backlog row's own claims are stale against the tree it points at.

Sources read end to end: [fieldPros.ts](../../src/engine/season/fieldPros.ts),
[living-field.md](../specs/living-field.md) §§8.3–8.4, the slam block in
[calendar.ts](../../src/engine/season/calendar.ts) (the «fp-safe result rows, its own wave» note),
[world-strength-audit-2026-08.md](../specs/world-strength-audit-2026-08.md) §§9c–9f,
[dual-universe.md](../specs/dual-universe.md), [conveyor.ts](../../src/engine/season/conveyor.ts),
[entryCaps.ts](../../src/engine/world/entryCaps.ts), [ladder.ts](../../src/engine/world/ladder.ts).

---

## 1. What already exists – measured, in the tree

The backlog row (last-reviewed 22.08) says «today the field re-deals per season» and quotes §8.4's
«she cannot climb by winning a W100». Both sentences describe the engine as it stood on 04.08.
Since then two waves landed exactly inside this item's territory:

| mechanism | where | since | the numbers |
| --- | --- | --- | --- |
| **Aging** – age = `debutAge + (season − debutSeason)`, computed, never drawn | `careerAt`, `makeFieldPro` (fieldPros.ts) | W4-LIVES, 04.08 | +1 in 100.0% of (pro, season→season+1) pairs; 0.0% get younger; population age is a pyramid, mean 23.83 (audit §9d #4–5) |
| **Retirement and debuts** – a chair (`fp-<n>`) holds a SUCCESSION of careers; debut 16–19, retirement 26–34, span 7–18 seasons, median ~12 | `FIELD.career`, `careerAt`, `drawSpan` | W4-LIVES | 27.2 retirements per season of 364 chairs (12–38); scaled to today's 1,600 chairs ≈ **~120 a season**; mean career 13.1 seasons |
| **Tenure at the top** – somebody holds it for years, then loses it | `careerArc` (plateau 22–28, decline to 0.55) + per-season form jitter | W4-LIVES | #10 chair median 5 consecutive seasons (p90 11–14, max 18); top-100 name churn 98.9 → **10.7** people a season |
| **The climb into the chair** – a debutante banks 25% of her chair's book, whole by season 3; tenure permutes WHO holds which row inside a storey, never what a row is worth | `tenureRamp`, the ⭐⭐ permutation block in `fieldProsFor` | 19.08 | the multiset of row values is untouched by construction; `chairBook` + `tenure` carried on the row so the ordering is reproducible |
| **Results that move – WITHIN the season** | `livePoints` + `mergedWtaRanking(…, earned)`; `WorldState.fieldSeasonPoints` | **v53** | a pro's winnings replace her proportional share of her book, bounded to ±20% (`FIELD.liveSwing`); table total preserved exactly (additive rule measured +10.7%/+22.8%/+32.7% bloat at weeks 13/26/39 and rejected); share normalised over the ~300–450 of 1,600 who actually get a draw |
| **Persistence of the above** | `fieldSeasonPoints` – schema v53, migration, golden fixture | v53 | ONE persisted number per scoring pro per season (~3 KB) against the ~6,048 result rows the alternative costs; cleared at the season wrap (`milestones.ts`) |
| **Real per-event results for field pros** | `runAiTournament` – canonical W brackets are LIVE ∪ 1,600 pros; a pro's finish pays the tally, never a `world.results` row | W3-FIELD3 + v53 | tick got FASTER by not writing rows: 2.34 → 1.65 ms/week |
| **Identity across seasons** | stream keyed `seed:field:<n>:c<careerIndex>` – per CAREER, not per season | W4-LIVES | name, nation, skills constant for her whole span; a named rival is the same person for 7–18 years |
| **The guards that grew around it** | AER on the field's universe (`withinAnnualEntryLimit`, 19.08); W champion news lines from W100 up (~37 a season); the AI on-ramp (2 held slots of 32) | – | all live |

So the parent claim to correct before planning: **the field does NOT re-deal per season, a pro's
results DO move her row within a season, and the mechanics of aging, retirement and debuts are
built and measured.** What is missing is narrower, and sharper.

## 2. What is genuinely missing

1. **Nothing carries across the season boundary.** `fieldSeasonPoints` is cleared at the wrap and
   the new season's book re-derives purely from (chair, career, arc, jitter). A breakthrough season
   leaves zero trace in January. Within-season movement is also bounded to ±20% of the book, so
   «falls out of the table by losing» never compounds.
2. **Nobody SEES the succession.** ~120 retirements a season happen in silence; a chair's new
   occupant simply appears with a new name. The junior conveyor announces its turnover
   (`turnOverField`: «A new intake: …», with the best-ranked departure named at `NOTABLE_DEPARTURE_RANK`
   = top-50); the professional field has no sibling line.
3. **No arrival from the LIVE world.** The conveyor's departing players vanish; a field debutante is
   always a derived stranger. (Note the frame has shifted since §2.2 was written: the LIVE cohort
   itself now carries players to 34 via `proStay`/`hardRetireAge`, so «the graduating junior» already
   lives a full adult career INSIDE the live ring – the gap is only that the two populations never
   exchange people.)
4. **Her GAME never ages – only her book.** `growth: 1`, `potential` = current, by the W4-LIVES
   ruling's own limit («ageing and retirement, NOT a re-balance of how strong the tour is»). A body
   curve is deliberately unbuilt.
5. **No fp fatigue** – backlog item 2, its own row, not re-planned here; it interacts (a tired pro
   sitting a week out is also «results that move»).

## 3. The law, and what it actually permits now

Living-field §8.3/§8.4 and the slam block's old note state the constraint: **a derived field pro
must never write a persisted result row** – `world.results` is pruned on a 52-week window sized for
199 LIVE players, and every tick folds it (`rivalConditions`, `computeRanking`, `pruneResults`).
v53 is the precedent for what the law permits: **rows never; a bounded, schema-versioned tally
yes** – one number per pro, ~3 KB, zero RNG, with the three-part schema move paid. §8.4 itself
listed «a bounded per-season pro-results structure» as the alternative deferred to the pro contour.
This plan IS the pro contour, so the deferral expires here; the law against rows does not.

## 4. Results that move ACROSS seasons – the honest options

| | **A1 – persisted carry, value-moving** | **A2 – persisted carry, order-moving (recommended)** | **B – seeded career noise, zero persistence** | **D – fp rows in `world.results`** |
| --- | --- | --- | --- | --- |
| shape | at the wrap, fold `fieldSeasonPoints` vs her proportional share into a per-chair multiplier (clamped, decaying ~half per season); next season's `wtaPoints` scales by it | same fold, but the carry joins `tenure` in the ⭐⭐ merit key: it decides WHERE IN HER STOREY she stands, never what a row is worth | a `seed:fieldtraj:<n>:c<k>:<seasonsOnTour>` sub-stream gives each career multi-season form waves (breakout year, slump) | every fp finish becomes a ledger row |
| schema | v59 → v60, append-only migration, golden fixture | same (one `Record<string, number>`, sparse) | none | none new, but prune/window re-sizing |
| save size (1,600 chairs) | only deviating chairs stored: ~350 played → ~5 KB raw / ~1–2 KB gzipped; worst case 1,600 ≈ 22 KB raw | same | **0 bytes** | ~6,048 rows a season (the code's own count) – the ledger the whole engine folds per tick |
| RNG discipline | zero new draws – finishes are already decided; input-independent because canonical brackets fold kid-free (`aiRanking`'s rule) | same | one new purpose-scoped sub-stream, input-independent by key construction; MUST be per-season, not per-week – `fieldProsFor` promises «stable within a season» to previews and draws | zero draws, but breaks §8.3 outright |
| per-tick cost | zero (one O(~350) fold per season wrap; `mergedWtaRanking` unchanged) | zero | +1 draw per pro per seasonal derivation (memoised) – noise | measured NEGATIVE precedent: not writing rows is what took the tick 2.34 → 1.65 ms/week |
| what it buys | a real cross-season trajectory; a circuit pro who wins big genuinely climbs toward the head | a real cross-season trajectory WITHIN her storey; the calibrated points-to-rank curve (#50 ~1,400 · #100 ~850 · #300 ~190) preserved BY CONSTRUCTION, so the `fieldPros.test.ts` anchors, `ladder-floor` and `unranked-sentinel` do not move | plausible-looking careers for the ~1,250 pros the calendar never seats | full fidelity |
| what it costs | re-anchoring every merged-table pin with a bench in hand; the exact renormalisation trap v53 documented twice (deflated table = an unearned promotion for the kid) | cross-storey climb still absent across seasons (see Q1) | **dishonest** – actual results still change nothing, which is precisely the smell the owner caught from the seat («таблица просто "стоит"… и номер 1 мы обыгрывали на шлеме»); v53 exists because of that sentence | rejected: §8.3, prune arithmetic, and the measured tick cost |

**Recommendation: A2, and no B.** The per-season `seed:fieldform:` jitter already supplies
year-to-year wobble with zero persistence, so B's only honest role (motion for the unseated 1,250)
is filled; adding fake trajectories next to real carried ones would mean two kinds of movement, one
of them a lie. A2 is v53's own discipline extended one boundary further: results decide WHO holds
which row; calibration decides what rows exist.

## 5. What the player actually sees change – the surfaces

| surface | today | after |
| --- | --- | --- |
| **Stats → W standings** (top-10 + window around her, via `rankingFor(world,'wta')`) | rows move within a season (v53), snap back each January | named rivals rise and fall ACROSS seasons; the churn is carried, not re-dealt |
| **News feed** | W100+ champion lines (~37 a season) already name pros; the junior intake line names a top-50 departure | NEW: a farewell line for a retiring pro whose merged rank is ≤50 (~4 a season at 1,600 chairs / ~13-season careers) + one annual «N professionals retired» line; optionally a debut note when a top-storey chair turns over. Feed budget: `EVENTS_CAP` 400, feed already takes ~364 a season – +~5 lines fits, all-retirements (~120) does not |
| **VS card / tournament overlay / full bracket** | opponent ranks read the merged table; fp names resolve | same code paths, now showing carried standings – zero new surface work |
| **Season card previews** | draw from the merged universe | unchanged mechanics; the field's composition reflects carry |
| **Her cohort's graduates** | a departing LIVE adult gets one intake line, then vanishes | step 4 (owner-gated): a notable departure's name continues in a vacated chair |

## 6. Interactions to guard

- **AER / entry caps** ([entryCaps.ts](../../src/engine/world/entryCaps.ts)). The field-side AER
  exists BECAUSE v53 moved draw composition (a 14-year-old landed in ten capped draws against a
  rulebook row of eight; owner ruling 19.08). `rivalProEntries` counts `world.results` rows – a
  field pro writes none, so a 16–17-year-old fp debutante is inside `withinAnnualEntryLimit`'s
  filter but her count is permanently 0. The carry does not change that asymmetry; it must be
  RESTATED in the step-2 spec, and `tests/aer-cohort.test.ts` re-run, because carried standings
  shift which minors the windows reach.
- **The shadow bracket universe** ([dual-universe.md](../specs/dual-universe.md)). Her entered event
  runs two brackets; the news names the shadow champion and the table pays the canonical one in ~91%
  of her events. The carry makes the canonical universe MORE authoritative (it now shapes next
  January), which sharpens backlog item 5's pending ruling – flag it to the owner together. The §3
  gate stands: any Phase B talk starts with a bench re-run on the merged main, fingerprint attached.
- **`mergedWtaRanking`** has exactly three call sites (`ladder.rankingFor`, and the two
  `computeShadowTournament`/`drawAiEntrants`-side folds in world.ts). The carry must flow through
  the same single function – round 22's one-owner consolidation, not a fourth copy.
- **Acceptance cuts and sponsor gates** are rank-denominated (`acceptsRank`; national 350 / global
  87 read W100's list), so A2 – which never changes what any row is worth – leaves them untouched
  by construction. A1 would not.
- **The on-ramp held slots** (2 of 32, [ai-w-onramp.md](../specs/ai-w-onramp.md)) and
  `weekFieldExclusion` read the merged order – both tolerate composition change (documented mutable
  class) but their pins get re-run at every step's gate.

## 7. The frozen captures – which move, and why that is legitimate

- **The MAIN capture (41550 draws / e6b0c709) does NOT move at any step.** Every mechanism here is
  a persisted fold of already-decided finishes (zero draws) or a purpose-scoped sub-stream. A step
  that touches MAIN is a wrong step, not a re-pin.
- **Event sub-stream compositions (`seed:aitour:<id>`, `seed:kidtour:<id>`) WILL move** at steps
  2–4: carried standings re-position candidates, an arrival changes the universe. This is the
  documented mutable class – fieldPros.ts's own header: entrant sets «have changed with every
  band/age re-pick» – and the candidate-count discipline (count a function of window and universe,
  never of results content or input) is preserved.
- **The frozen career captures** (the A/B fixtures re-frozen per wave, 22.08 precedent) WILL move
  for any career that plays professional weeks – re-frozen with the control-arm discipline, per-key
  diff attached.
- **Sim corridors** (fatigue-bench-policy C3 and the sim-health set) may move through draw
  composition – re-aimed only after the control-tree run proves the movement is the wave's
  (the 22.08 «measured on the control tree before a bound moved» precedent).
- **The merged-table anchors** in `tests/season/fieldPros.test.ts` (#50/#100/#300, the 50-pt row's
  #300–420 band) do NOT move under A2 – that is the argument for A2. Under A1 they all re-anchor,
  bench in hand.

## 8. Steps – sizes and stop points

| # | step | size | stop point / gate |
| --- | --- | --- | --- |
| 0 | **Re-measure before planning further**: `tools/world-turnover.ts` + `tools/field-quality.ts` on merged main – the audit's numbers are from the 364-chair, pre-v53 world; today's is 1,600 chairs with a live table | S – bench runs, zero code | numbers materially off (retirements/season outside ~100–140, tenure median outside 3–7) → re-plan before building |
| 1 | **Surface the succession that already runs**: retirement farewell (merged rank ≤50) + annual count line + top-storey debut note, the professional sibling of `turnOverField` | S – one news function at the season boundary + mounted/feed-budget tests | zero schema, zero MAIN, +~5 feed lines a season; **this is the smallest honest first step** – the mechanics exist, only the telling is missing |
| 2 | **The carry (A2)**: wrap folds earned-vs-share into a per-chair merit carry (clamped, decaying), spent beside `tenure` in the ⭐⭐ ordering; schema v60 three-part move | M – engine + migration + fixture + pins | merged-table anchors byte-stable (the A2 property, asserted); frozen careers re-frozen; sim corridors control-run; `aer-cohort` re-run |
| 3 | **Bound the within-season swing honestly against the carry**: re-measure `liveSwing` 0.2 with carry live (the kid-protection measurement – 51 places for tennis she did not play – re-run) | S – bench + possibly one constant | `ladder-floor` and `unranked-sentinel` green at shipped values, else report, don't tune |
| 4 | **Arrivals from the LIVE world** (owner-gated, Q2): a notable conveyor departure's identity binds to a vacated chair – the first persisted fp identity (name/nation, a few entries a season) | M | only after the owner says derived strangers feel wrong in play; C2 pins in `tests/rivals.test.ts` restate their trade |
| 5 | **The body curve + fp fatigue** – her GAME ages, a tired pro sits out | L – a re-balance of tour strength, invariant 4 | needs its own owner ruling and bench; the audit says the binding constraint on HER climb is the points economy, not field strength (skill #72 vs book #298), so this buys realism, not access |

Steps 1–3 are one wave's worth; each lands green alone. Step 0 is a morning.

## 9. Open questions for the owner – each with a recommendation

1. **May results change what a row is WORTH, or only WHO holds it?** (A1 vs A2 – everything else
   follows from this.) A2 keeps the calibrated curve by construction; its cost is that a `circuit`
   chair's occupant can never carry herself into `elite` across seasons, because «the chair keeps
   its storey» is the calibration law. *Recommendation: A2 now; revisit cross-storey mobility only
   with a bench showing Spearman(skill, points) ≥ 0.85 survives it – the population-1600 wave
   measured 0.888 → 0.818 as a fail for less.*
2. **Do graduates take chairs?** The LIVE cohort already carries her known rivals to 34 with real
   results – the «graduating junior joining the field» of §2.2 half-exists on the other side of the
   fence. Binding departures to chairs buys name continuity at the price of the first persisted fp
   identity. *Recommendation: not in the first wave; step 1's farewells + step 2's carry first,
   then ask the seat.*
3. **Retirement news scope**: top-50 farewells (~4 a season) + one annual line, or more?
   *Recommendation: as stated – `EVENTS_CAP` arithmetic above; matches `NOTABLE_DEPARTURE_RANK`.*
   ⭐⭐ **SHIPPED 25.08 AS RECOMMENDED, AHEAD OF THE REST OF THE PLAN AND WITHOUT IT** – round 26 #10
   («В новостях во время колледжа вообще пустота»), which is this row arriving from the player's
   side. [`src/engine/world/fieldNews.ts`](../../src/engine/world/fieldNews.ts): top-50 farewells
   capped at `FIELD_NEWS.farewellsPerSeason` = 3, one turnover line and one intake line = **5 rows a
   season**, all ordinary, measured at +7.3% of the freeze's news rows with the events array and its
   kept count identical (401 / 39 in both arms). ⚠ **THE NEWS HALF ONLY**: nothing about the CARRY
   (steps 1-2, Q1) shipped with it, so the field still re-deals its books each January and every
   number in §§2-4 stands unchanged. What the news reports is the SUCCESSION, which `careerAt` has
   walked since W4-LIVES. A second, unplanned line came out of the same measurement and is worth
   recording here: the champion line now carries the champion's age and a first/last-season clause
   at **zero row cost**, because the college freeze runs at `EVENTS_ORDINARY_FLOOR` (rest pinned at
   120 of the 400) and hands the player only eight screens in 208 weeks – a once-a-season row is
   outside his window by arithmetic, and a clause on a line already in it is not.
4. **The champion-news contradiction** (backlog 5, ~91%): the carry makes the canonical universe
   the one that shapes the future – does the news switch to naming canonical champions for her
   entered events too? *Recommendation: yes, decide it WITH this wave; it is one line's source and
   the §3 bench gate is owed anyway.*
5. **The body curve** (step 5): license it now or after the points economy work?
   *Recommendation: after – the two probes converge on the points economy as the binding
   constraint; a strength re-balance before that is motion without access.*

The sharpest of these is Q1 – it is §8.3's law restated as a choice, and every pin, every cut and
every save byte in this plan takes its size from the answer.

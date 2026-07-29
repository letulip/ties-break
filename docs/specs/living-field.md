# The Living Field — design document (28.07.2026, pre-code)

> **Partly landed (29.07).** Two of §1's four "does not live" findings are fixed inside the existing
> 199-player cohort rather than by the three-ring architecture below. **Nobody grows** → v20's age +
> ceiling curves (`season/cohort.ts`). **Nobody arrives, nobody leaves** → the conveyor, scoped to
> this one population: `docs/specs/junior-conveyor.md` and `season/conveyor.ts` — §2.1's crunch, the
> yearly intake and the retirement schedule, with the field size held fixed so the tick's cost does
> not move. What is still ahead is the SCALE: the ~2,000-strong population, the LIVE/FIELD/ARCHIVE
> rings (§3) and the separate pro contour (§2.2). Read the sections below as the plan for that; read
> the two specs above for what the engine does today.

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

---
*Grounded in: `cohort.ts` (199 / 8 draws / 0.05-growth), `world.ts` `runAiTournament`
(`seed:aitour`), `rival.ts` `reconstructRun`, `calendar.ts` cadences and `entrantPctBand`s,
`ranking-points-by-tier.md`, `career-outcome-targets.md`, the owner's careers (120k J30 domination;
8k band trap), and the wave-B measurement that points alone do not move the grind.*

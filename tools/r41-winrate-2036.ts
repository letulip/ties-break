/**
 * r41-winrate-2036 – WHY DOES THE WIN RATE FALL IN 2036?
 *
 * ROUND 41 #23, and it is a MEASUREMENT. The owner, playing his own career: «почему-то в 2036
 * сезоне упала выигрываемость, даже не смотря на лучшего тренера и массажиста, которые с ней
 * ездят». His girl is ~19 in 2036 and top-5 on the W50 table by 2037 – so the complaint is not
 * about a career going wrong. It is about the per-match win rate falling while everything the
 * player can buy is already bought. Item 23 is classed «measure»: a mechanical defect ships, a
 * tuning move is the owner's call with this table in front of him. Nothing under src/ is touched
 * by this file or by the wave that carries it.
 *
 * ⚠ THE CALENDAR, FIRST, BECAUSE THE BRIEF HAD IT WRONG. `EPOCH_YEAR` is 2031 (shared/dates.ts)
 * and `START_AGE_YEARS` is 14 (engine/world/age.ts), so season 0 is 2031 with her at 14 and
 * **2036 is season 5, at 19; 2037 is season 6, at 20**. The walk is therefore SEVEN seasons
 * (364 weeks), not eleven. Both of the owner's facts – «~19 в 2036» and top-5 in 2037 – fall out
 * of that arithmetic exactly, which is the confirmation that this is the right window.
 *
 * =================================================================================================
 * THE FOUR CANDIDATE LEVERS (the recon's, verified file:line)
 * =================================================================================================
 *
 *  (A) GROWTH HANDS OVER AT 18. `ECONOMY.development.ageCurve` (economy.ts:2746) is
 *      growthStart 13 / growthEnd 18 / plateauStart 23 / peakRate 0.0062 / growthEase 0.5 /
 *      plateauRate 0.0027, and `ageFactor` (development.ts:379-393) runs the steep branch only
 *      BELOW 18. ⚠ IT IS NOT A FLATLINE AND THE RECON'S WORDING OVERSTATED IT: from 18 to
 *      `plateauStart` the rate decays from peakRate·(1−growthEase)=0.0031 to plateauRate=0.0027,
 *      a ~13% slide, not a stop. The half that can actually be large is the OTHER factor in
 *      `gain = headroom × rate`: by 19 a well-managed career has spent most of
 *      `rollPotential − skills`. So A is measured as TWO numbers, rate and headroom, not one.
 *      (`ageRoutes`, economy.ts:2895: direct 22/27, college 23/29 – the fork at 19.)
 *
 *  (B) THE FIELD STRENGTHENS EVERY SEASON. `driftCohort` (cohort.ts:254-272), the conveyor keeping
 *      the strong and replacing the weak (conveyor.ts:84-91), and the professional table's
 *      `tenureRamp` – a ramp-limited debutante in 2035 is a full-book player in 2036
 *      (fieldPros.ts). Measured here as the mean `power()` of the head of the professional table
 *      per season, which is a pure function of (seed, seasonIndex) and so costs nothing.
 *
 *  (C) RANK-DRIVEN DRAW DIFFICULTY. Climbing 100→5 promotes her two rungs (acceptance cuts,
 *      ladder.ts; `entrantPctBand` per tier, calendar.ts) and SEEDS her (tournament.ts,
 *      `kidSeedIndexIn` → `buildDraw`). A higher seed meets weak players early and strong ones
 *      LATE, and plays more matches per entry – so the per-match rate can fall while the career
 *      improves. The diagnostic is win rate PER ROUND and PER OPPONENT-STRENGTH BUCKET, never
 *      per match.
 *
 *  (D) FATIGUE ASYMMETRY. She carries a condition ledger; the field pros never do – phaseHerWeek.ts
 *      says it in its own words, «the field she meets is at its best». A denser calendar at the new
 *      tier costs only her. Levers: `conditionMatchFactor` (engine/condition.ts), the in-match
 *      fatigue term, `minConditionToEnter`.
 *
 * =================================================================================================
 * PREDICTIONS, WRITTEN BEFORE THE FIRST RUN (the coordinator's priors, recorded verbatim)
 * =================================================================================================
 *
 *   C is the headline – per-match rate falls as she climbs, mechanically guaranteed by seeding.
 *   A is the undertone – flat attributes against a rising field.
 *   D is visible in the condition bands.
 *   B is the background slope.
 *
 * Predicted shape, stated so it can be wrong: overall win rate drops several points at season 5;
 * the SAME-BUCKET win rate is roughly flat; the shift-share decomposition puts most of the drop in
 * the COMPOSITION term; her attribute gain per season collapses from season 4 on; mean condition
 * at match time falls a few points.
 *
 * =================================================================================================
 * HOW IT MEASURES
 * =================================================================================================
 *
 * The REAL ENGINE, walked week by week through `econ-bench`'s own career policy (`openCareer` +
 * `stepCareerWeek`) – the house's career-walking idiom, the same one masseur-bench and twenty other
 * probes drive. Nothing about a draw, a field or a match is re-implemented here; the only
 * arithmetic this file owns is counting.
 *
 * ⚠ THE OBSERVER, AND WHY IT IS A PROPERTY AND NOT AN ENGINE EDIT. `stepCareerWeek` closes the
 * week's tournament itself (`skipTournament` + `closeTournament`), so `world.pendingTournament` is
 * null again by the time the step returns and the match records are gone. This file installs a
 * TRANSPARENT accessor on that one field – the getter and setter pass the value straight through,
 * nothing is computed, nothing is withheld – and keeps a reference to every object the engine
 * assigns. It observes exactly what the engine built; it cannot change what the engine does.
 *
 * ⚠ AND THE CAPTURE CARRIES ITS OWN RECEIPT. A run only counts a captured tournament once
 * `finished === true` (set by `finalizeTournament`), so a withdrawal or a medical scratch is
 * excluded by construction. The per-season (wins, losses) this file tallies is then checked
 * against `world.seasonHistory[i]`, which the ENGINE banks from the identical filter
 * (`world.ts:643-652`). Exact agreement on every career is the proof that the capture is complete;
 * a single disagreement prints the career and the run refuses its own tables.
 *
 * OPPONENT STRENGTH is read off `PendingTournament.players[oppId]` – the `MatchPlayer` that
 * actually took the court, surface-styled and condition-scaled by `rivalMatchPlayer`. The scalar
 * is `power()`'s own definition, the mean of the five attributes, applied to that record (see
 * `core5`). EXPECTED win probability is the engine's own closed form, `fastMatchProbability`, on
 * the same two records with the event's own surface and tour – i.e. the number `playMatch` itself
 * uses to resolve every AI-AI match.
 *
 * RNG: bench-local only. `openCareer` derives `rngFromSeed(world.seed)` and every sub-stream is
 * re-derived at its call site inside the engine. This file draws nothing and persists nothing.
 *
 * Run:
 *   npx vite-node tools/r41-winrate-2036.ts                       # baseline, 32 careers
 *   npx vite-node tools/r41-winrate-2036.ts --careers 64
 *   npx vite-node tools/r41-winrate-2036.ts --growth-end 28 --careers 16   # the A counterfactual
 *   npx vite-node tools/r41-winrate-2036.ts --actuate              # the levers move the output
 */
import { PRESETS, POLICIES, openCareer, stepCareerWeek, mean } from './econ-bench'
import {
  hireMasseur,
  inCollege,
  masseurUnlocked,
  setMasseurSessions,
  setMasseurTravels,
  KID_ID,
  startingSkills,
  type PendingTournament,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { rollPotential, SKILL_KEYS, type KidSkills } from '../src/engine/development'
import { power } from '../src/engine/season/cohort'
import { fieldProsOf } from '../src/engine/world/ladder'
import { fastMatchProbability } from '../src/engine/match/engine'
import { conditionMatchFactor } from '../src/engine/condition'
import { JUNIOR_TOUR } from '../src/engine/season/tournament'
import { TIERS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { seasonYear } from '../src/shared/dates'
import { kidAgeExact } from '../src/engine/world/age'
import type { MatchPlayer } from '../src/engine/match/types'
import type { TierId } from '../src/engine/season/types'

// --- args ----------------------------------------------------------------------------------------
const argv = process.argv.slice(2)
const numOf = (name: string, fallback: number): number => {
  const i = argv.indexOf(`--${name}`)
  const n = i >= 0 ? Number(argv[i + 1]) : NaN
  return Number.isFinite(n) ? n : fallback
}
const CAREERS = numOf('careers', 32)
/** 0..6 = 2031..2037. Seven seasons is the whole question; anything past 2037 is not asked. */
const SEASONS = numOf('seasons', 7)
/** ⭐ THE A-ARM, AS A PARAMETER RATHER THAN AN EDIT. `ageFactor` is pure arithmetic over
 *  `ECONOMY.development.ageCurve` and `growWeek` draws only on its own re-derived
 *  `seed:growth:<week>` sub-stream – so moving this constant IN THIS PROCESS changes her
 *  development and nothing else's stream position. The engine file is never touched and no absurd
 *  constant is ever committed. Default = the shipped 18, i.e. no patch at all. */
const GROWTH_END = numOf('growth-end', ECONOMY.development.ageCurve.growthEnd)
/** ⭐ and the same handle on the RATE, for the actuation proof below. */
const PEAK_RATE = numOf('peak-rate', ECONOMY.development.ageCurve.peakRate)
const ACTUATE = argv.includes('--actuate')
/** The preset the owner's own career sits closest to: the money is there and the coach is the top
 *  of the market, because his complaint is explicitly «даже не смотря на лучшего тренера». */
const PRESET = PRESETS[numOf('preset', 8)]
const POLICY = POLICIES[1] // 'player' – the reasonable parent, not an optimiser

// --- small helpers -------------------------------------------------------------------------------
const padL = (s: string | number, n: number) => String(s).padStart(n)
const padR = (s: string | number, n: number) => String(s).padEnd(n)
const rule = (n = 112) => '-'.repeat(n)
const section = (t: string) => console.log(`\n${rule()}\n${t}\n${rule()}`)
/** House law: an empty cell is `–`, never `0.0%`. */
const pct = (part: number, whole: number, dp = 1): string => (whole === 0 ? '–' : `${((100 * part) / whole).toFixed(dp)}%`)
const num = (x: number | null, dp = 1): string => (x === null || !Number.isFinite(x) ? '–' : x.toFixed(dp))
/** A DELTA always carries its own sign, and never both of them – the first cut of this file printed
 *  `+-0.19` by pasting a `+` in front of `toFixed`, which is how a fall reads as a rise at a glance. */
const signed = (x: number | null, dp = 1, unit = ''): string =>
  x === null || !Number.isFinite(x) ? '–' : `${x >= 0 ? '+' : '-'}${Math.abs(x).toFixed(dp)}${unit}`
/** Standard error of a corpus mean. `–` on fewer than two samples, because one career has none. */
function sem(xs: number[]): number | null {
  if (xs.length < 2) return null
  const m = mean(xs)
  const v = xs.reduce((a, x) => a + (x - m) * (x - m), 0) / (xs.length - 1)
  return Math.sqrt(v / xs.length)
}

/** `power()`'s OWN definition – the mean of the five attributes – read off the `MatchPlayer` the
 *  engine actually put on court (surface-styled and condition-scaled by `rivalMatchPlayer`).
 *
 *  ⚠ WHY NOT `power()` ITSELF. That function takes an `AiPlayer` and re-derives the fifth
 *  attribute from the `gs:<id>` sub-stream, because a cohort row does not store one. A
 *  `MatchPlayer` already CARRIES its groundstrokes – post-style, post-condition – so calling
 *  `power` here would throw away the two transformations that make this the strength she met and
 *  replace the fifth axis with the pre-style one. Same formula, honest input. */
const core5 = (p: MatchPlayer): number => (p.serve + p.ret + p.composure + p.stamina + p.groundstrokes) / 5
/** Her raw skill sheet as a single number, before condition and surface – the A-arm's axis. */
const skillMean = (s: KidSkills): number => SKILL_KEYS.reduce((n, k) => n + s[k], 0) / SKILL_KEYS.length

// --- what one of her matches is ------------------------------------------------------------------
interface KidMatch {
  /** which career this match belongs to – without it "matches per entry" counts two careers'
   *  week-14 draws as one entry, which is how the first cut printed 41.5 matches per tournament. */
  career: number
  season: number
  week: number
  tier: TierId
  /** 0 = first round */
  round: number
  /** rounds still to play when this one started: 1 = Final, 2 = SF, 3 = QF, 4 = R16 ... */
  depth: number
  won: boolean
  /** the opponent as the engine built her for this match */
  oppCore: number
  /** her own build for this match – condition already inside it */
  herCore: number
  /** the condition she took the court at (the snapshot on her own MatchPlayer) */
  condition: number
  /** the engine's own closed form: P(she wins), the number `playMatch` resolves AI-AI matches on */
  pWin: number
}

interface SeasonRow {
  season: number
  ageAtMidSeason: number
  matches: KidMatch[]
  /** her sheet at the season's last week, and what she could still become */
  skill: number
  ceiling: number
  /** rank on the W table at the season's last week (null = unranked) */
  rank: number | null
  /** engine-banked record for the season, the capture's receipt */
  bankedWins: number
  bankedLosses: number
  collegeWeeks: number
  /** mean `power()` of the head of the professional table this season (lever B) */
  fieldTop50: number
  fieldTop200: number
}

interface Career {
  seed: string
  seasons: SeasonRow[]
  /** did the capture agree with the engine's own books, season by season? */
  receiptOk: boolean
  receiptNote: string
}

// --- the walk ------------------------------------------------------------------------------------
/** (Re)hire only above this – a parent does not staff up on fumes (masseur-bench's own floor). */
const HIRE_FLOOR_CENTS = 25_000_00
const RELEASE_FLOOR_CENTS = 10_000_00
/** The top of `ECONOMY.masseur.rungs` – 7 sessions is «Daily», and he travels. The owner's own
 *  setup, and his sentence: «лучший тренер и массажист, которые с ней ездят». */
const MASSEUR_SESSIONS = 7

function walk(index: number): Career {
  const { world, rng } = openCareer(PRESET, index, POLICY)

  // ⚠ THE TRANSPARENT OBSERVER. See the header. The getter and setter do nothing but pass the
  // value through; `seen` holds a reference to every `PendingTournament` the engine assigns, and
  // the drain below keeps only the ones that reached `finalizeTournament`.
  const seen: PendingTournament[] = []
  let backing: PendingTournament | null = world.pendingTournament
  Object.defineProperty(world, 'pendingTournament', {
    configurable: true,
    enumerable: true,
    get: () => backing,
    set: (v: PendingTournament | null) => {
      if (v) seen.push(v)
      backing = v
    },
  })

  const potential = rollPotential(world.seed, startingSkills(world.seed, world.profile))
  const ceiling = skillMean(potential)
  const seasons: SeasonRow[] = []
  /** every match of the whole walk, filed by the WEEK IT WAS PLAYED – see the box below. */
  const matches: KidMatch[] = []
  const collegeWeeksBySeason = new Array<number>(SEASONS + 1).fill(0)
  /** her sheet on the LAST week of each season, taken before that week's tick */
  const skillAtSeasonEnd = new Array<number>(SEASONS).fill(NaN)
  const fieldAtSeasonEnd: { t50: number; t200: number }[] = []

  // ⚠⚠ A MATCH BELONGS TO THE SEASON OF THE WEEK IT WAS PLAYED, NOT TO THE 52-TICK BLOCK IT WAS
  // WALKED IN, and the first version of this file got that wrong in a way only the receipt caught.
  // `tickWeek` increments `world.week` FIRST and runs the season wrap immediately after, so the
  // tick that carries week s·52+51 → (s+1)·52 banks season s and THEN plays a tournament whose
  // week is already in season s+1. Filing that run under the block's own `s` reported one extra
  // match per boundary: measured on the smoke run, `bench-wealthy-0` captured 23-22 against the
  // engine's banked 23-21 and `bench-wealthy-1` 81-9 against 80-8. Deriving the season from the
  // week closes it exactly – which is why the receipt is an equality and not a tolerance.
  for (let s = 0; s < SEASONS; s++) {
    for (let w = 0; w < WEEKS_PER_YEAR; w++) {
      if (w === WEEKS_PER_YEAR - 1) skillAtSeasonEnd[s] = skillMean(world.skills)
      // The owner's staffing: the masseur joins the moment the professional gate opens and travels.
      if (masseurUnlocked(world) && !world.ending && !inCollege(world)) {
        if (!world.masseurHired && world.fundsCents > HIRE_FLOOR_CENTS) {
          hireMasseur(world, true)
          setMasseurSessions(world, MASSEUR_SESSIONS)
          if (!world.masseurTravels) setMasseurTravels(world, true)
        } else if (world.masseurHired && world.fundsCents < RELEASE_FLOOR_CENTS) {
          hireMasseur(world, false)
        }
      }
      if (inCollege(world)) collegeWeeksBySeason[s]++
      seen.length = 0
      stepCareerWeek(world, rng, POLICY)
      // `tickWeek` incremented it, so this IS the week the tournament was played in.
      const playedWeek = world.week
      for (const p of seen) {
        // ⚠ ONLY WHAT FINALIZED. `finalizeTournament` sets `finished`; a withdrawal or a medical
        // scratch never reaches it, and the engine banks no win or loss for those either – which
        // is exactly why the receipt below can be an EQUALITY rather than an inequality.
        if (!p.finished) continue
        const event = world.season.find((e) => e.id === p.eventId)
        const tier = event ? event.tier : (p.eventId.split('-')[0] as TierId)
        const def = TIERS[tier as keyof typeof TIERS]
        if (!def || !event) continue
        const her = p.players[KID_ID]
        const rounds = Math.log2(def.drawSize)
        for (const m of p.result.matches) {
          if (m.aId !== KID_ID && m.bId !== KID_ID) continue
          const oppId = m.aId === KID_ID ? m.bId : m.aId
          const opp = p.players[oppId]
          if (!her || !opp) continue
          matches.push({
            career: index,
            season: Math.floor(playedWeek / WEEKS_PER_YEAR),
            week: playedWeek,
            tier,
            round: m.round,
            depth: rounds - m.round,
            won: m.winnerId === KID_ID,
            oppCore: core5(opp),
            herCore: core5(her),
            condition: her.condition ?? world.condition,
            pWin: fastMatchProbability(her, opp, { surface: event.surface, tour: JUNIOR_TOUR, seed: '' }),
          })
        }
      }
    }
    fieldAtSeasonEnd.push({ t50: headMean(world, 50), t200: headMean(world, 200) })
  }

  for (let s = 0; s < SEASONS; s++) {
    const banked = world.seasonHistory.find((h) => h.seasonIndex === s)
    seasons.push({
      season: s,
      ageAtMidSeason: kidAgeExact(s * WEEKS_PER_YEAR + 26, world.profile.birthMonth, world.profile.birthDay),
      matches: matches.filter((m) => m.season === s),
      skill: skillAtSeasonEnd[s],
      ceiling,
      rank: banked?.byTrack?.wta?.endRank ?? banked?.endRank ?? null,
      bankedWins: banked?.wins ?? 0,
      bankedLosses: banked?.losses ?? 0,
      collegeWeeks: collegeWeeksBySeason[s],
      fieldTop50: fieldAtSeasonEnd[s].t50,
      fieldTop200: fieldAtSeasonEnd[s].t200,
    })
  }

  // --- THE RECEIPT ---------------------------------------------------------------------------
  // The engine banks `seasonWins`/`seasonLosses` from `p.result.matches` filtered to her
  // (world.ts:643-652) and rolls them onto the season row at the wrap. This file filters the same
  // list on the same key. The two must be equal for every season or the capture is incomplete and
  // every table below is built on a subset.
  let receiptOk = true
  let receiptNote = ''
  for (const row of seasons) {
    const wins = row.matches.filter((m) => m.won).length
    const losses = row.matches.length - wins
    if (wins !== row.bankedWins || losses !== row.bankedLosses) {
      receiptOk = false
      receiptNote = `season ${row.season}: captured ${wins}-${losses}, engine banked ${row.bankedWins}-${row.bankedLosses}`
      break
    }
  }
  return { seed: world.seed, seasons, receiptOk, receiptNote }
}

/** Mean `power()` of the head of the PROFESSIONAL table this season – lever B, and it costs nothing
 *  because `fieldProsFor` is a pure function of (seed, seasonIndex). The cohort is deliberately not
 *  folded in: 199 juniors cannot reach the ranks this row is about, and adding them would only make
 *  the denominator noisy (field-quality.ts's own argument for the same choice). */
function headMean(world: WorldState, n: number): number {
  const pros = [...fieldProsOf(world)].sort((a, b) => b.wtaPoints - a.wtaPoints).slice(0, n)
  return pros.length ? mean(pros.map((p) => power(p))) : NaN
}

// --- the axes the decomposition runs on ----------------------------------------------------------
/** Opponent strength bands. Four points wide: narrow enough that "the same opponent" means
 *  something, wide enough that a 32-career season fills them. */
const CORE_BANDS = [48, 52, 56, 60, 64, 68, 72]
const coreBandOf = (c: number): number => {
  let i = 0
  while (i < CORE_BANDS.length && c >= CORE_BANDS[i]) i++
  return i
}
const coreBandLabel = (i: number): string =>
  i === 0 ? `<${CORE_BANDS[0]}` : i === CORE_BANDS.length ? `${CORE_BANDS[i - 1]}+` : `${CORE_BANDS[i - 1]}-${CORE_BANDS[i]}`

/** Condition bands – the doctor's floor and the policy's rest floor are the natural cuts. */
const COND_BANDS = [55, 70, 80, 90]
const condBandOf = (c: number): number => {
  let i = 0
  while (i < COND_BANDS.length && c >= COND_BANDS[i]) i++
  return i
}
const condBandLabel = (i: number): string =>
  i === 0 ? `<${COND_BANDS[0]}` : i === COND_BANDS.length ? `${COND_BANDS[i - 1]}+` : `${COND_BANDS[i - 1]}-${COND_BANDS[i]}`

// --- the shift-share decomposition ---------------------------------------------------------------
//
// THE ONE PIECE OF ARITHMETIC THIS FILE OWNS, and it is the answer to C.
//
//   W = Σ_b s_b · p_b        (s_b = share of her matches in band b, p_b = her win rate in it)
//
//   W₅ − W₄ = Σ_b (s₅_b − s₄_b)·p₄_b   +   Σ_b s₅_b·(p₅_b − p₄_b)
//             \_____ COMPOSITION _____/     \________ RATE ________/
//
// COMPOSITION is "she met a different mix of opponents / rounds / conditions"; RATE is "she played
// worse against the same ones". The identity is exact – no residual – for every band populated in
// BOTH seasons. A band populated in only one is reported as uncovered rather than fudged: with
// p₄_b undefined there is no honest number to put in the first term, and inventing one (the
// season's overall rate is the usual fudge) would silently move weight into COMPOSITION.
interface Shift {
  delta: number
  composition: number
  rate: number
  coveredA: number
  coveredB: number
  nA: number
  nB: number
}
function shiftShare(a: KidMatch[], b: KidMatch[], bandOf: (m: KidMatch) => number): Shift {
  const tally = (ms: KidMatch[]): Map<number, { n: number; w: number }> => {
    const t = new Map<number, { n: number; w: number }>()
    for (const m of ms) {
      const k = bandOf(m)
      const e = t.get(k) ?? { n: 0, w: 0 }
      e.n++
      if (m.won) e.w++
      t.set(k, e)
    }
    return t
  }
  const ta = tally(a)
  const tb = tally(b)
  const both = [...tb.keys()].filter((k) => ta.has(k))
  const nA = a.length
  const nB = b.length
  let composition = 0
  let rate = 0
  let coveredA = 0
  let coveredB = 0
  for (const k of new Set([...ta.keys(), ...tb.keys()])) {
    if (!both.includes(k)) continue
    const ea = ta.get(k)!
    const eb = tb.get(k)!
    const sa = ea.n / nA
    const sb = eb.n / nB
    const pa = ea.w / ea.n
    const pb = eb.w / eb.n
    composition += (sb - sa) * pa
    rate += sb * (pb - pa)
    coveredA += ea.n
    coveredB += eb.n
  }
  const wa = a.filter((m) => m.won).length / Math.max(1, nA)
  const wb = b.filter((m) => m.won).length / Math.max(1, nB)
  return { delta: wb - wa, composition, rate, coveredA, coveredB, nA, nB }
}

// =================================================================================================
// RUN
// =================================================================================================
if (GROWTH_END !== ECONOMY.development.ageCurve.growthEnd) {
  Object.assign(ECONOMY.development.ageCurve, { growthEnd: GROWTH_END })
}
if (PEAK_RATE !== ECONOMY.development.ageCurve.peakRate) {
  Object.assign(ECONOMY.development.ageCurve, { peakRate: PEAK_RATE })
}

const t0 = Date.now()
const careers: Career[] = []
for (let i = 0; i < CAREERS; i++) careers.push(walk(i))
const elapsed = (Date.now() - t0) / 1000

console.log(`r41 #23 – THE 2036 WIN RATE, DECOMPOSED`)
console.log(
  `corpus ${CAREERS} careers x ${SEASONS} seasons (${seasonYear(0)}..${seasonYear(SEASONS - 1)}), preset "${PRESET.label}", policy "${POLICY.label}",` +
    ` masseur hired at the pro gate (${MASSEUR_SESSIONS}/wk, travels)`,
)
console.log(
  `ageCurve: growthEnd ${ECONOMY.development.ageCurve.growthEnd} · peakRate ${ECONOMY.development.ageCurve.peakRate}` +
    ` · growthEase ${ECONOMY.development.ageCurve.growthEase} · plateauStart ${ECONOMY.development.ageCurve.plateauStart}` +
    ` · plateauRate ${ECONOMY.development.ageCurve.plateauRate}` +
    (GROWTH_END !== 18 || PEAK_RATE !== 0.0062 ? '   <<< PATCHED IN MEMORY (counterfactual arm)' : ''),
)
console.log(`walked in ${elapsed.toFixed(0)}s`)

// --- 0. THE RECEIPT ------------------------------------------------------------------------------
const bad = careers.filter((c) => !c.receiptOk)
console.log('')
if (bad.length) {
  console.log(`⚠⚠ CAPTURE RECEIPT FAILED on ${bad.length} of ${CAREERS} careers – the tables below are NOT trustworthy.`)
  for (const c of bad.slice(0, 5)) console.log(`   ${c.seed}: ${c.receiptNote}`)
  process.exit(1)
}
console.log(
  `capture receipt: per-season (wins, losses) vs world.seasonHistory – ✓ all ${CAREERS} careers agree exactly` +
    ` (${careers.reduce((n, c) => n + c.seasons.reduce((k, s) => k + s.matches.length, 0), 0)} matches captured)`,
)

const perSeason = (s: number): KidMatch[] => careers.flatMap((c) => c.seasons[s]?.matches ?? [])
const seasonLabel = (s: number): string => `${seasonYear(s)}`

// --- 1. DID THE CORPUS REPRODUCE HIS CAREER AT ALL? ----------------------------------------------
section('0. THE CORPUS – is this the career he is describing?')
console.log(`  ${padR('season', 8)}${padL('age', 5)}${padL('median rank', 13)}${padL('best', 6)}${padL('top-5', 7)}${padL('top-20', 8)}${padL('top-100', 9)}${padL('ranked', 8)}${padL('college wks', 13)}`)
for (let s = 0; s < SEASONS; s++) {
  const rows = careers.map((c) => c.seasons[s]).filter(Boolean)
  const ranks = rows.map((r) => r.rank).filter((r): r is number => r !== null && r > 0)
  const sorted = [...ranks].sort((a, b) => a - b)
  console.log(
    `  ${padR(seasonLabel(s), 8)}${padL(num(mean(rows.map((r) => r.ageAtMidSeason))), 5)}` +
      `${padL(sorted.length ? sorted[Math.floor(sorted.length / 2)] : '–', 13)}${padL(sorted.length ? sorted[0] : '–', 6)}` +
      `${padL(ranks.filter((r) => r <= 5).length, 7)}${padL(ranks.filter((r) => r <= 20).length, 8)}` +
      `${padL(ranks.filter((r) => r <= 100).length, 9)}${padL(`${ranks.length}/${rows.length}`, 8)}` +
      `${padL(rows.reduce((n, r) => n + r.collegeWeeks, 0), 13)}`,
  )
}

// --- 2. BASELINE ---------------------------------------------------------------------------------
section('1. BASELINE – does a 2036-shaped dip reproduce? (per-career win rate, corpus mean ± SEM)')
console.log(
  `  ${padR('season', 8)}${padL('age', 5)}${padL('matches', 9)}${padL('m/career', 10)}${padL('win rate', 10)}${padL('± SEM', 8)}` +
    `${padL('Δ vs prev', 11)}${padL('E[win]', 9)}${padL('actual−E', 10)}${padL('careers', 9)}`,
)
const seasonWinRates: (number | null)[] = []
for (let s = 0; s < SEASONS; s++) {
  const per = careers.map((c) => c.seasons[s]).filter((r) => r && r.matches.length > 0)
  const rates = per.map((r) => r.matches.filter((m) => m.won).length / r.matches.length)
  const all = perSeason(s)
  const wr = rates.length ? mean(rates) : null
  seasonWinRates.push(wr)
  const prev = s > 0 ? seasonWinRates[s - 1] : null
  const exp = all.length ? mean(all.map((m) => m.pWin)) : null
  console.log(
    `  ${padR(seasonLabel(s), 8)}${padL(num(mean(per.map((r) => r.ageAtMidSeason))), 5)}${padL(all.length, 9)}` +
      `${padL(num(all.length / Math.max(1, per.length), 1), 10)}` +
      `${padL(wr === null ? '–' : `${(100 * wr).toFixed(1)}%`, 10)}${padL(sem(rates) === null ? '–' : (100 * sem(rates)!).toFixed(1), 8)}` +
      `${padL(wr === null || prev === null ? '–' : signed(100 * (wr - prev), 1, 'pp'), 11)}` +
      `${padL(exp === null ? '–' : `${(100 * exp).toFixed(1)}%`, 9)}` +
      `${padL(wr === null || exp === null ? '–' : signed(100 * (wr - exp), 1, 'pp'), 10)}` +
      `${padL(per.length, 9)}`,
  )
}
console.log('')
console.log('  "m/career" is matches per career per season, i.e. how much tennis the season held.')
console.log("  E[win] is the ENGINE's own closed form on the two builds that took the court – not a model of it.")

// THE DIP CENSUS – per career, not per corpus mean.
console.log('')
console.log('  THE DIP, PER CAREER (a career "dips" when its win rate falls season-over-season while its rank holds or improves):')
console.log(`  ${padR('transition', 16)}${padL('careers with both seasons', 27)}${padL('win rate fell', 15)}${padL('...and rank held/improved', 27)}`)
for (let s = 1; s < SEASONS; s++) {
  let both = 0
  let fell = 0
  let dipped = 0
  for (const c of careers) {
    const a = c.seasons[s - 1]
    const b = c.seasons[s]
    if (!a || !b || a.matches.length < 5 || b.matches.length < 5) continue
    both++
    const wa = a.matches.filter((m) => m.won).length / a.matches.length
    const wb = b.matches.filter((m) => m.won).length / b.matches.length
    if (wb < wa) {
      fell++
      const ra = a.rank ?? Number.MAX_SAFE_INTEGER
      const rb = b.rank ?? Number.MAX_SAFE_INTEGER
      if (rb <= ra) dipped++
    }
  }
  console.log(
    `  ${padR(`${seasonLabel(s - 1)}→${seasonLabel(s)}`, 16)}${padL(both, 27)}${padL(`${fell} (${pct(fell, both, 0)})`, 15)}` +
      `${padL(`${dipped} (${pct(dipped, both, 0)})`, 27)}`,
  )
}

// --- 3. THE DECOMPOSITION ------------------------------------------------------------------------
section('2. THE DECOMPOSITION – where the season-over-season change actually comes from (shift-share)')
console.log('  Δ win rate = COMPOSITION (a different mix of opponents / rounds / conditions) + RATE (she played worse against the same ones)')
console.log('')
console.log(
  `  ${padR('transition', 16)}${padR('axis', 20)}${padL('Δ win rate', 12)}${padL('composition', 13)}${padL('rate', 9)}${padL('covered', 10)}`,
)
const AXES: { label: string; of: (m: KidMatch) => number }[] = [
  { label: 'opponent strength', of: (m) => coreBandOf(m.oppCore) },
  { label: 'round reached', of: (m) => m.round },
  { label: 'condition band', of: (m) => condBandOf(m.condition) },
  { label: 'tier', of: (m) => Object.keys(TIERS).indexOf(m.tier) },
]
for (let s = 1; s < SEASONS; s++) {
  const a = perSeason(s - 1)
  const b = perSeason(s)
  if (a.length < 20 || b.length < 20) continue
  for (const axis of AXES) {
    const r = shiftShare(a, b, axis.of)
    console.log(
      `  ${padR(axis === AXES[0] ? `${seasonLabel(s - 1)}→${seasonLabel(s)}` : '', 16)}${padR(axis.label, 20)}` +
        `${padL(signed(100 * r.delta, 1, 'pp'), 12)}` +
        `${padL(signed(100 * r.composition, 1, 'pp'), 13)}` +
        `${padL(signed(100 * r.rate, 1, 'pp'), 9)}` +
        `${padL(pct(r.coveredB, r.nB, 0), 10)}`,
    )
  }
  console.log('')
}
console.log('  "covered" = share of the LATER season\'s matches in bands populated in BOTH seasons; the rest carry no honest p₄ and are left out rather than fudged.')

// --- 4. STRATIFIED READ (C) ----------------------------------------------------------------------
section('3. THE STRATIFIED READ (answers C) – her win rate at EQUAL opponent strength')
{
  const header = ['season', ...CORE_BANDS.map((_, i) => coreBandLabel(i)), coreBandLabel(CORE_BANDS.length)]
  console.log(`  ${padR(header[0], 8)}${header.slice(1).map((h) => padL(h, 14)).join('')}`)
  for (let s = 0; s < SEASONS; s++) {
    const ms = perSeason(s)
    if (!ms.length) continue
    let line = `  ${padR(seasonLabel(s), 8)}`
    for (let b = 0; b <= CORE_BANDS.length; b++) {
      const inB = ms.filter((m) => coreBandOf(m.oppCore) === b)
      const w = inB.filter((m) => m.won).length
      line += padL(inB.length < 10 ? (inB.length === 0 ? '–' : `(${inB.length})`) : `${pct(w, inB.length, 0)} n=${inB.length}`, 14)
    }
    console.log(line)
  }
  console.log('')
  console.log('  Cells with fewer than 10 matches print their n in brackets rather than a rate – a 3-match "67%" is not a measurement.')
  console.log('')
  console.log('  ...and the SAME table as the share of her matches, so the composition shift can be read beside the rates:')
  console.log(`  ${padR('season', 8)}${[...CORE_BANDS.map((_, i) => coreBandLabel(i)), coreBandLabel(CORE_BANDS.length)].map((h) => padL(h, 14)).join('')}${padL('mean opp', 10)}`)
  for (let s = 0; s < SEASONS; s++) {
    const ms = perSeason(s)
    if (!ms.length) continue
    let line = `  ${padR(seasonLabel(s), 8)}`
    for (let b = 0; b <= CORE_BANDS.length; b++) {
      const n = ms.filter((m) => coreBandOf(m.oppCore) === b).length
      line += padL(pct(n, ms.length, 0), 14)
    }
    console.log(line + padL(num(mean(ms.map((m) => m.oppCore))), 10))
  }
}

// --- 5. THE ROUND READ (C) -----------------------------------------------------------------------
section('4. THE ROUND READ (the other half of C) – how deep her matches are, and how she does there')
{
  const MAXR = 7
  console.log(`  ${padR('season', 8)}${Array.from({ length: MAXR }, (_, r) => padL(`R${r + 1}`, 13)).join('')}${padL('mean round', 12)}${padL('m/entry', 9)}`)
  for (let s = 0; s < SEASONS; s++) {
    const ms = perSeason(s)
    if (!ms.length) continue
    let line = `  ${padR(seasonLabel(s), 8)}`
    for (let r = 0; r < MAXR; r++) {
      const inR = ms.filter((m) => m.round === r)
      const w = inR.filter((m) => m.won).length
      line += padL(inR.length < 10 ? (inR.length === 0 ? '–' : `(${inR.length})`) : `${pct(w, inR.length, 0)} n=${inR.length}`, 13)
    }
    const entries = new Set(ms.map((m) => `${m.career}:${m.week}`)).size
    console.log(line + padL(num(mean(ms.map((m) => m.round + 1)), 2), 12) + padL(num(ms.length / Math.max(1, entries), 2), 9))
  }
  console.log('')
  console.log('  R1 is the first round of the draw. A seeded player wins R1 and R2 cheaply and meets the head of the field at R3+;')
  console.log('  if the LATE rounds are where the matches moved, the per-match rate falls for a reason that is a promotion, not a decline.')
  console.log('')
  console.log('  ...and her opponent\'s mean strength in each round, which is the mechanism itself:')
  console.log(`  ${padR('season', 8)}${Array.from({ length: MAXR }, (_, r) => padL(`R${r + 1}`, 13)).join('')}${padL('her core', 10)}`)
  for (let s = 0; s < SEASONS; s++) {
    const ms = perSeason(s)
    if (!ms.length) continue
    let line = `  ${padR(seasonLabel(s), 8)}`
    for (let r = 0; r < MAXR; r++) {
      const inR = ms.filter((m) => m.round === r)
      line += padL(inR.length < 10 ? '–' : num(mean(inR.map((m) => m.oppCore))), 13)
    }
    console.log(line + padL(num(mean(ms.map((m) => m.herCore))), 10))
  }
}

// --- 6. GROWTH (A) -------------------------------------------------------------------------------
section('5. GROWTH (answers A) – her sheet against her own ceiling, and against the field')
console.log(
  `  ${padR('season', 8)}${padL('age', 5)}${padL('her skills', 12)}${padL('Δ/season', 10)}${padL('ceiling', 9)}${padL('headroom', 10)}` +
    `${padL('% realised', 12)}${padL('opp she met', 13)}${padL('Δ/season', 10)}${padL('her − opp', 11)}`,
)
for (let s = 0; s < SEASONS; s++) {
  const rows = careers.map((c) => c.seasons[s]).filter(Boolean)
  const prev = s > 0 ? careers.map((c) => c.seasons[s - 1]).filter(Boolean) : null
  const skill = mean(rows.map((r) => r.skill))
  const ceil = mean(rows.map((r) => r.ceiling))
  const ms = perSeason(s)
  const opp = ms.length ? mean(ms.map((m) => m.oppCore)) : NaN
  const prevMs = s > 0 ? perSeason(s - 1) : []
  const prevOpp = prevMs.length ? mean(prevMs.map((m) => m.oppCore)) : NaN
  console.log(
    `  ${padR(seasonLabel(s), 8)}${padL(num(mean(rows.map((r) => r.ageAtMidSeason))), 5)}${padL(num(skill, 2), 12)}` +
      `${padL(prev ? signed(skill - mean(prev.map((r) => r.skill)), 2) : '–', 10)}` +
      `${padL(num(ceil, 2), 9)}${padL(num(ceil - skill, 2), 10)}` +
      `${padL(pct(skill, ceil, 1), 12)}` +
      `${padL(num(opp, 2), 13)}${padL(s > 0 && prevMs.length ? signed(opp - prevOpp, 2) : '–', 10)}` +
      `${padL(num(skill - opp, 2), 11)}`,
  )
}
console.log('')
console.log(`  "% realised" is her sheet as a share of her OWN rolled ceiling (rollPotential) – the headroom half of gain = headroom x rate.`)
console.log(`  "opp she met" is the mean core of the opponents she actually faced – the field AT HER TIER, which is what a promotion moves.`)
console.log(
  `  the rate half, off ageFactor with the shipped curve: ` +
    [14, 16, 18, 19, 20, 22, 23].map((a) => `${a}y ${ageFactorAt(a).toFixed(5)}`).join(' · '),
)

// --- 7. FATIGUE (D) ------------------------------------------------------------------------------
section('6. FATIGUE (answers D) – the condition she took the court at, and what it was worth')
console.log(
  `  ${padR('season', 8)}${padL('mean cond', 11)}${padL('p10', 7)}${padL('p90', 7)}${padL('share <70', 11)}` +
    COND_BANDS.map((_, i) => padL(condBandLabel(i), 14)).join('') +
    padL(condBandLabel(COND_BANDS.length), 14),
)
for (let s = 0; s < SEASONS; s++) {
  const ms = perSeason(s)
  if (!ms.length) continue
  const conds = ms.map((m) => m.condition).sort((a, b) => a - b)
  let line =
    `  ${padR(seasonLabel(s), 8)}${padL(num(mean(conds)), 11)}${padL(num(conds[Math.floor(0.1 * conds.length)]), 7)}` +
    `${padL(num(conds[Math.floor(0.9 * conds.length)]), 7)}${padL(pct(conds.filter((c) => c < 70).length, conds.length, 0), 11)}`
  for (let b = 0; b <= COND_BANDS.length; b++) {
    const inB = ms.filter((m) => condBandOf(m.condition) === b)
    const w = inB.filter((m) => m.won).length
    line += padL(inB.length < 10 ? (inB.length === 0 ? '–' : `(${inB.length})`) : `${pct(w, inB.length, 0)} n=${inB.length}`, 14)
  }
  console.log(line)
}
console.log('')
console.log(
  `  the lever's size: conditionMatchFactor 100→${conditionMatchFactor(100).toFixed(3)} · 90→${conditionMatchFactor(90).toFixed(3)}` +
    ` · 80→${conditionMatchFactor(80).toFixed(3)} · 70→${conditionMatchFactor(70).toFixed(3)} · 60→${conditionMatchFactor(60).toFixed(3)}` +
    ` · 50→${conditionMatchFactor(50).toFixed(3)}`,
)
console.log('  Every attribute she plays with is multiplied by that factor; her opponents in the professional field carry no ledger and are always at 1.000.')

// --- 8. THE FIELD (B) ----------------------------------------------------------------------------
section('7. THE FIELD (answers B) – the head of the professional table, season by season')
console.log(`  ${padR('season', 8)}${padL('top-50 core', 13)}${padL('Δ', 8)}${padL('top-200 core', 14)}${padL('Δ', 8)}${padL('her core', 10)}${padL('her − top50', 13)}`)
for (let s = 0; s < SEASONS; s++) {
  const rows = careers.map((c) => c.seasons[s]).filter(Boolean)
  const prev = s > 0 ? careers.map((c) => c.seasons[s - 1]).filter(Boolean) : null
  const t50 = mean(rows.map((r) => r.fieldTop50))
  const t200 = mean(rows.map((r) => r.fieldTop200))
  const her = mean(rows.map((r) => r.skill))
  console.log(
    `  ${padR(seasonLabel(s), 8)}${padL(num(t50, 2), 13)}${padL(prev ? signed(t50 - mean(prev.map((r) => r.fieldTop50)), 2) : '–', 8)}` +
      `${padL(num(t200, 2), 14)}${padL(prev ? signed(t200 - mean(prev.map((r) => r.fieldTop200)), 2) : '–', 8)}` +
      `${padL(num(her, 2), 10)}${padL(num(her - t50, 2), 13)}`,
  )
}

// --- 9. TIER MIX ---------------------------------------------------------------------------------
section('8. WHERE SHE PLAYED – the tier mix, which is what a promotion looks like from the outside')
{
  const tiers = [...new Set(careers.flatMap((c) => c.seasons.flatMap((s) => s.matches.map((m) => m.tier))))].sort(
    (a, b) => Object.keys(TIERS).indexOf(a) - Object.keys(TIERS).indexOf(b),
  )
  console.log(`  ${padR('season', 8)}${tiers.map((t) => padL(t, 13)).join('')}`)
  for (let s = 0; s < SEASONS; s++) {
    const ms = perSeason(s)
    if (!ms.length) continue
    console.log(`  ${padR(seasonLabel(s), 8)}${tiers.map((t) => padL(pct(ms.filter((m) => m.tier === t).length, ms.length, 0), 13)).join('')}`)
  }
  console.log('')
  console.log('  ...and her win rate inside each tier, so "the tier got harder" and "she moved tier" stay separable:')
  console.log(`  ${padR('season', 8)}${tiers.map((t) => padL(t, 13)).join('')}`)
  for (let s = 0; s < SEASONS; s++) {
    const ms = perSeason(s)
    if (!ms.length) continue
    console.log(
      `  ${padR(seasonLabel(s), 8)}` +
        tiers
          .map((t) => {
            const inT = ms.filter((m) => m.tier === t)
            const w = inT.filter((m) => m.won).length
            return padL(inT.length < 10 ? (inT.length === 0 ? '–' : `(${inT.length})`) : pct(w, inT.length, 0), 13)
          })
          .join(''),
    )
  }
}

/** `ageFactor` is not exported for a scalar read, so the curve is printed off the engine's own
 *  constants with the engine's own arithmetic – the exact expression in development.ts:379-393. */
function ageFactorAt(age: number): number {
  const c = ECONOMY.development.ageCurve
  if (age < c.growthEnd) {
    const t = Math.max(0, (age - c.growthStart) / (c.growthEnd - c.growthStart))
    return c.peakRate * (1 - c.growthEase * t)
  }
  if (age < c.plateauStart) {
    const t = (age - c.growthEnd) / (c.plateauStart - c.growthEnd)
    return c.peakRate * (1 - c.growthEase) * (1 - t) + c.plateauRate * t
  }
  if (age < c.declineStart) return c.plateauRate
  return 0
}

// --- 10. ACTUATION -------------------------------------------------------------------------------
if (ACTUATE) {
  section('9. ACTUATION – each lever moved on purpose, so a null result cannot be a dead arm')
  console.log('  ⚠ IN-MEMORY ONLY. Nothing under src/ is edited and no absurd constant is committed; the process exits and the file is what it was.')
  console.log('')
  // ⚠ THE PATCHES ARE `Record<string, number>` AND NOT `Partial<typeof shipped>` ON PURPOSE: the
  // ageCurve's fields are literal-typed by the `as const` on ECONOMY, so the declared type of
  // `growthEnd` is the literal `18` and no counterfactual value is assignable to it. Widening here
  // is the bench asking a question the shipped type is deliberately not built to allow.
  const shipped: Record<string, number> = { ...ECONOMY.development.ageCurve }
  const arms: { label: string; patch: Record<string, number> }[] = [
    { label: 'shipped', patch: {} },
    { label: 'growthEnd 18→28', patch: { growthEnd: 28 } },
    { label: 'peakRate x5 (absurd)', patch: { peakRate: shipped.peakRate * 5 } },
  ]
  console.log(`  ${padR('arm', 24)}${padL('skills @2035', 14)}${padL('skills @2036', 14)}${padL('win rate @2035', 16)}${padL('win rate @2036', 16)}${padL('Δ 35→36', 10)}`)
  const N = Math.min(6, CAREERS)
  for (const arm of arms) {
    Object.assign(ECONOMY.development.ageCurve, shipped, arm.patch)
    const cs: Career[] = []
    for (let i = 0; i < N; i++) cs.push(walk(i))
    const at = (s: number) => cs.flatMap((c) => c.seasons[s]?.matches ?? [])
    const sk = (s: number) => mean(cs.map((c) => c.seasons[s]?.skill ?? NaN))
    const wr = (s: number) => {
      const ms = at(s)
      return ms.length ? ms.filter((m) => m.won).length / ms.length : NaN
    }
    console.log(
      `  ${padR(arm.label, 24)}${padL(num(sk(4), 2), 14)}${padL(num(sk(5), 2), 14)}` +
        `${padL(`${(100 * wr(4)).toFixed(1)}%`, 16)}${padL(`${(100 * wr(5)).toFixed(1)}%`, 16)}` +
        `${padL(signed(100 * (wr(5) - wr(4)), 1, 'pp'), 10)}`,
    )
  }
  Object.assign(ECONOMY.development.ageCurve, shipped)
  console.log('')
  console.log(`  restored: growthEnd ${ECONOMY.development.ageCurve.growthEnd}, peakRate ${ECONOMY.development.ageCurve.peakRate}`)
  console.log(`  n = ${N} careers per arm – enough to prove the dial MOVES the output, not enough to size the effect. The sized answer is the table above.`)
}

// --- the SEM footnote ----------------------------------------------------------------------------
console.log('')
console.log(rule())
console.log(
  `SEM: the "± SEM" column of §1 is the standard error of the CORPUS mean over ${CAREERS} careers` +
    ` (per-career win rate is one sample). Per-band cells carry their own n; the SE of a band's` +
    ` proportion at n=100 and p≈0.5 is 5.0pp, at n=400 it is 2.5pp – read the small cells accordingly.`,
)

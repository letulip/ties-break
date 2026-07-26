import { describe, it, expect } from 'vitest'
import {
  RIVAL_STYLE,
  applySurfaceStyle,
  matchesForFinish,
  reconstructRun,
  rivalCondition,
  rivalConditions,
  rivalMatchPlayer,
  styleOf,
} from '../src/engine/season/rival'
import { conditionMatchFactor, matchDrain } from '../src/engine/condition'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import { generateCohort } from '../src/engine/season/cohort'
import { ECONOMY } from '../src/engine/economy'
import type { SeasonResult } from '../src/engine/season/ranking'
import type { TierId } from '../src/engine/season/types'
import type { MatchPlayer, Surface } from '../src/engine/match/types'
import type { PlayStyle } from '../src/shared/protocol'
import {
  KID_ID,
  SAVE_SCHEMA_VERSION,
  closeTournament,
  createWorld,
  enterEvent,
  skipTournament,
  tickWeek,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'

// ---------------------------------------------------------------------------
// Rivals become real — Part A: rival fatigue, DERIVED from the results ledger.
//
// The whole slice is a pure derivation: no new WorldState field, no schema bump, ZERO RNG draws.
// A rival's condition is reconstructed from the rows she already has in `world.results` –
// `points` inverts through `TIERS[tier].points` to a finish index, the finish index gives how
// many matches she played, and from there the SAME matchDrain / tournamentRunStrain / recovery /
// conditionMatchFactor the kid uses do the rest.
// ---------------------------------------------------------------------------

const R = ECONOMY.condition

/** One ledger row for `ai-x` at `week`, finishing `finish` at `tier`. */
function row(tier: TierId, finish: number, week: number, playerId = 'ai-x'): SeasonResult {
  return { playerId, week, points: TIERS[tier].points[finish], tier }
}

describe('A1 — reconstruction: (tier, points) round-trips to the right match count', () => {
  it('champion plays log2(drawSize) matches and a first-round exit plays exactly 1, every tier', () => {
    for (const tier of TIER_LADDER) {
      const def = TIERS[tier]
      const rounds = Math.log2(def.drawSize)
      // Every tier awards points at EVERY finish (the arrays are strictly positive), so every
      // entrant of every draw leaves a reconstructible row – nobody is invisible to the ledger.
      expect(def.points.length).toBe(rounds + 1)
      expect(def.points.every((p) => p > 0)).toBe(true)

      expect(reconstructRun(row(tier, 0, 1))).toMatchObject({ tier, matches: rounds }) // champion
      expect(reconstructRun(row(tier, rounds, 1))).toMatchObject({ tier, matches: 1 }) // R1 exit
    }
  })

  it('every (tier, finish) inverts to the finish it came from, and the match count is monotone', () => {
    for (const tier of TIER_LADDER) {
      const rounds = Math.log2(TIERS[tier].drawSize)
      let prev = Infinity
      for (let finish = 0; finish <= rounds; finish++) {
        const run = reconstructRun(row(tier, finish, 3))
        expect(run.tier).toBe(tier)
        // finish f (f > 0) = lost in round `rounds - f`, so she played `rounds - f + 1` matches;
        // the champion (f = 0) played every round.
        expect(run.matches).toBe(finish === 0 ? rounds : rounds - finish + 1)
        expect(run.matches).toBeLessThanOrEqual(prev) // deeper finish ⇒ never fewer matches
        prev = run.matches
      }
    }
  })

  it('matchesForFinish: runner-up plays as many matches as the champion, R1 exit plays one', () => {
    expect(matchesForFinish(3, 0)).toBe(3) // 8-draw champion: R1 + SF + F
    expect(matchesForFinish(3, 1)).toBe(3) // runner-up plays the same three
    expect(matchesForFinish(3, 2)).toBe(2) // semifinalist
    expect(matchesForFinish(3, 3)).toBe(1) // first round
    expect(matchesForFinish(5, 0)).toBe(5) // 32-draw champion
    expect(matchesForFinish(5, 5)).toBe(1)
  })

  it("the run's strain IS tournamentRunStrain over score-less matches – one drain rule, both sides", () => {
    // AI-vs-AI records carry no scoreline (they resolve closed-form), so every rival match takes
    // matchDrain's score-less branch: straightSets + the tier surcharge. Identical to what the kid
    // would pay for a straight-sets match at that tier – never a private rival formula.
    const run = reconstructRun(row('j300', 0, 4))
    expect(run.matches).toBe(5)
    expect(run.strain).toBe(5 * matchDrain('j300', undefined))
    expect(run.strain).toBe(30) // 5 × (1 straight-sets + 5 j300 surcharge)
    expect(reconstructRun(row('local', 3, 4)).strain).toBe(matchDrain('local', undefined)) // 1
  })
})

describe('A2 — a tier-less row (legacy saves / pre-history) is handled explicitly', () => {
  // `SeasonResult.tier` is OPTIONAL and every AI row written before this slice omitted it. Such a
  // row is reconstructed by MINIMUM STRAIN over the (tier, finish) pairs that could have produced
  // those points: deterministic, never a crash, and never "free".
  it('never crashes and never treats the row as free', () => {
    for (const tier of TIER_LADDER) {
      const rounds = Math.log2(TIERS[tier].drawSize)
      for (let finish = 0; finish <= rounds; finish++) {
        const { tier: _t, ...legacy } = row(tier, finish, 2)
        const run = reconstructRun(legacy)
        expect(run.matches).toBeGreaterThanOrEqual(1)
        expect(run.strain).toBeGreaterThan(0)
      }
    }
  })

  it('resolves an AMBIGUOUS points value to the cheapest reading, deterministically', () => {
    // 30 points is a Local title (3 matches, no surcharge = 3), a J30 last-16 (2 × 4 = 8) or a
    // J300 first round (1 × 6 = 6). The cheapest reading wins: a legacy row can never invent
    // fatigue the rival may not have earned.
    const run = reconstructRun({ playerId: 'ai-x', week: 2, points: 30 })
    expect(run).toMatchObject({ tier: 'local', matches: 3, strain: 3 })
    // ...and it is a pure function: same row, same answer, every time.
    expect(reconstructRun({ playerId: 'ai-x', week: 2, points: 30 })).toEqual(run)
  })

  it('a points value that matches no tier at all costs one straight-sets match at the entry tier', () => {
    const run = reconstructRun({ playerId: 'ai-x', week: 2, points: 777 })
    expect(run.matches).toBe(1)
    expect(run.strain).toBe(matchDrain(TIER_LADDER[0], undefined))
  })
})

describe('A3 — the same drain + the same time recovery the kid uses', () => {
  it('a quiet rival sits at full condition', () => {
    expect(rivalCondition([], 'ai-x', 20)).toBe(R.max)
    expect(rivalCondition([row('j300', 0, 1, 'ai-other')], 'ai-x', 20)).toBe(R.max) // not her row
  })

  it('a five-match J300 run costs exactly the run strain, and recovers recoveryBase per quiet week', () => {
    const ledger = [row('j300', 0, 10)]
    expect(rivalCondition(ledger, 'ai-x', 10)).toBe(R.max - 30) // 70 – the run week itself
    // A tournament week earns matchWeekRecoveryBase (0 shipped); every quiet week earns
    // recoveryBase, +blackoutBonus on an off-season/exam week. Weeks 11-14 are all plain.
    expect(rivalCondition(ledger, 'ai-x', 11)).toBe(R.max - 30 + R.recoveryBase)
    expect(rivalCondition(ledger, 'ai-x', 14)).toBe(R.max - 30 + 4 * R.recoveryBase)
  })

  it('rivals get NO plan slider, NO physio and NO vacation – that asymmetry is the player edge', () => {
    // The kid on the 60/40 preset recovers recoveryBase + 2 on a free week, +1 more on physio.
    // A rival recovers the base alone: four quiet weeks buy her exactly 4 * recoveryBase. Dug out
    // of a deep enough hole (a J300 title, 30) that the ceiling clamp cannot flatter the reading.
    const deep = [row('j300', 0, 10)]
    const gained = rivalCondition(deep, 'ai-x', 14) - rivalCondition(deep, 'ai-x', 10)
    expect(gained).toBe(4 * R.recoveryBase)
    expect(gained).toBeLessThan(4 * (R.recoveryBase + 2)) // strictly worse than the careful kid
  })

  it('clamps to the same [min, max] bounds', () => {
    // Eight back-to-back J300 titles (240 strain) cannot push her below the floor...
    const brutal = Array.from({ length: 8 }, (_, i) => row('j300', 0, 3 + i))
    expect(rivalCondition(brutal, 'ai-x', 10)).toBe(R.min)
    // ...and no amount of rest lifts her over the ceiling.
    expect(rivalCondition([row('local', 3, 1)], 'ai-x', 1 + 5 * R.max)).toBe(R.max)
  })

  it('is bounded work: only the last ECONOMY.condition.rivalFatigueWindowWeeks weeks are scanned', () => {
    const window = R.rivalFatigueWindowWeeks
    expect(window).toBeGreaterThan(0)
    const ancient = [row('j300', 0, 100 - window - 1)] // one week outside the window
    expect(rivalCondition(ancient, 'ai-x', 100)).toBe(R.max)
    const inside = [row('j300', 0, 100 - window + 1)]
    expect(rivalCondition(inside, 'ai-x', 100)).toBeLessThan(R.max)
  })

  it('is deterministic and pure: same ledger, same week, same number – and the ledger is not mutated', () => {
    const ledger = [row('j60', 1, 8), row('j30', 3, 11), row('national', 0, 12)]
    const snapshot = JSON.stringify(ledger)
    const a = rivalCondition(ledger, 'ai-x', 13)
    const b = rivalCondition(ledger.slice().reverse(), 'ai-x', 13) // order-independent
    expect(b).toBe(a)
    expect(JSON.stringify(ledger)).toBe(snapshot)
  })

  it('rivalConditions batches the whole field and agrees with the single-player function', () => {
    const ledger = [row('j60', 1, 8, 'ai-1'), row('j30', 3, 11, 'ai-2'), row('national', 0, 12, 'ai-1')]
    const map = rivalConditions(ledger, 13)
    expect(map.get('ai-1')).toBe(rivalCondition(ledger, 'ai-1', 13))
    expect(map.get('ai-2')).toBe(rivalCondition(ledger, 'ai-2', 13))
    expect(map.get('ai-never-played')).toBeUndefined() // absent = full condition, by construction
  })
})

describe('A4 — a deep run leaves a soft week behind her, and it heals', () => {
  // Two identical rivals carrying the SAME recent load (the live world never hands anyone a blank
  // ledger); one then plays a five-match J300, the other sits the week out.
  const history = (id: string): SeasonResult[] => [
    row('j30', 2, 4, id),
    row('j60', 3, 7, id),
    row('j30', 1, 9, id),
  ]
  const runner = [...history('ai-run'), row('j300', 0, 12, 'ai-run')]
  const rester = history('ai-rest')

  it('the week after a five-match run she is measurably weaker; the rival who sat out is not', () => {
    const cRun = rivalCondition(runner, 'ai-run', 13)
    const cRest = rivalCondition(rester, 'ai-rest', 13)
    expect(cRun).toBeLessThan(cRest)
    // ...and the gap is big enough to cross the strength knee, so it shows up on court.
    expect(conditionMatchFactor(cRun)).toBeLessThan(conditionMatchFactor(cRest))
  })

  it('the owner curve still holds: a FRESH rival pays condition for one deep run, not strength', () => {
    // 100 − 30 = 70 = matchStrengthKnee exactly, so a rival arriving fresh at a J300 and winning it
    // walks away tired but undamaged. Fatigue bites on ACCUMULATED load, which is the point.
    const fresh = rivalCondition([row('j300', 0, 12, 'ai-fresh')], 'ai-fresh', 13)
    expect(fresh).toBeLessThan(R.max)
    expect(conditionMatchFactor(fresh)).toBe(1)
  })

  it('after enough quiet weeks the two converge again', () => {
    const quiet = 13 + R.rivalFatigueWindowWeeks
    expect(rivalCondition(runner, 'ai-run', quiet)).toBe(rivalCondition(rester, 'ai-rest', quiet))
    expect(rivalCondition(runner, 'ai-run', quiet)).toBe(R.max)
  })
})

// ---------------------------------------------------------------------------
// Part B — derived play styles. A pure function of the attributes the cohort was ALREADY
// generated with, fed with the event's surface through applySurfaceStyle.
// ---------------------------------------------------------------------------

const STYLES: PlayStyle[] = ['aggressive', 'counterpuncher', 'serve-first', 'all-court']
const SURFACES: Surface[] = ['hard', 'clay', 'grass']

/** A bare MatchPlayer with the given attributes – style reads only serve/ret/stamina. */
function player(serve: number, ret: number, stamina: number, composure = 50): MatchPlayer {
  return { id: 'p', name: 'P', serve, ret, composure, stamina }
}

describe('B1 — the style thresholds are exported, documented knobs', () => {
  it('sits inside the cohort generation ranges (serve/ret 30-60, stamina 30-70)', () => {
    expect(RIVAL_STYLE.serveEdge).toBeGreaterThan(0)
    for (const t of [RIVAL_STYLE.highServe, RIVAL_STYLE.highRet]) {
      expect(t).toBeGreaterThan(30)
      expect(t).toBeLessThan(60)
    }
    expect(RIVAL_STYLE.highStamina).toBeGreaterThan(30)
    expect(RIVAL_STYLE.highStamina).toBeLessThan(70)
  })
})

describe('B2 — styleOf: a pure function of existing attributes, in the spec order', () => {
  const s = RIVAL_STYLE

  it('a serve clearly ahead of the return is serve-first, and it wins over every other arm', () => {
    expect(styleOf(player(58, 58 - s.serveEdge, 30))).toBe('serve-first')
    // ...even when the counterpuncher and aggressive arms would BOTH also match: the loudest
    // signal is checked first (spec order), so the classification is total and unambiguous.
    expect(styleOf(player(60, 60 - s.serveEdge, 70))).toBe('serve-first')
    expect(styleOf(player(58, 58 - s.serveEdge + 1, 30))).not.toBe('serve-first') // one short of the gap
  })

  it('a high return on high stamina is a counterpuncher – legs, not the first ball', () => {
    expect(styleOf(player(s.highRet, s.highRet, s.highStamina))).toBe('counterpuncher')
    // Same return, no legs: she cannot grind, so she is the aggressive baseliner instead.
    expect(styleOf(player(s.highServe, s.highRet, s.highStamina - 1))).toBe('aggressive')
  })

  it('two weapons without the legs is aggressive; anything else is all-court', () => {
    expect(styleOf(player(s.highServe, s.highRet, 30))).toBe('aggressive')
    expect(styleOf(player(s.highServe - 1, s.highRet, 30))).toBe('all-court') // one weapon short
    expect(styleOf(player(40, 40, 40))).toBe('all-court')
    expect(styleOf(player(30, 30, 30))).toBe('all-court') // the generation floor
  })

  it('is pure: same attributes, same style, and it never touches the player object', () => {
    const p = player(52, 44, 60)
    const snapshot = JSON.stringify(p)
    expect(styleOf(p)).toBe(styleOf(p))
    expect(JSON.stringify(p)).toBe(snapshot)
  })
})

describe('B3 — the style histogram over a REAL generated cohort', () => {
  const cohort = generateCohort('rival-style-histogram')

  it('every style is represented and none swallows the field', () => {
    const counts = new Map<PlayStyle, number>(STYLES.map((s) => [s, 0]))
    for (const p of cohort) counts.set(styleOf(p), counts.get(styleOf(p))! + 1)
    // Reported in the slice write-up; asserted as a BAND, not a pin, so cohort tuning stays free.
    for (const style of STYLES) {
      const share = counts.get(style)! / cohort.length
      expect(share, `${style} share`).toBeGreaterThan(0.05) // present, and not a curiosity
      expect(share, `${style} share`).toBeLessThan(0.5) // ...and not the whole field
    }
    expect([...counts.values()].reduce((a, b) => a + b, 0)).toBe(cohort.length) // total, no gaps
  })

  it('holds across independent cohort seeds – it is the thresholds, not one lucky draw', () => {
    for (const seed of ['alpha', 'bravo', 'charlie', 'bench-working-0']) {
      const present = new Set(generateCohort(seed).map(styleOf))
      expect(present.size, `seed ${seed}`).toBe(STYLES.length)
    }
  })
})

describe('B4 — applySurfaceStyle: the surface finally cuts both ways', () => {
  it('is pure and leaves identity fields (and composure) alone', () => {
    const p = player(50, 50, 50)
    const out = applySurfaceStyle(p, 'serve-first', 'grass')
    expect(out).not.toBe(p)
    expect(p).toEqual(player(50, 50, 50)) // input untouched
    expect(out.id).toBe(p.id)
    expect(out.name).toBe(p.name)
    expect(out.composure).toBe(p.composure)
  })

  it('serve-first is rewarded on grass and blunted on clay', () => {
    const p = player(50, 50, 50)
    expect(applySurfaceStyle(p, 'serve-first', 'grass').serve).toBeGreaterThan(p.serve)
    expect(applySurfaceStyle(p, 'serve-first', 'clay').serve).toBeLessThan(p.serve)
  })

  it('the counterpuncher is rewarded on clay and exposed on grass', () => {
    const p = player(50, 50, 50)
    expect(applySurfaceStyle(p, 'counterpuncher', 'clay').ret).toBeGreaterThan(p.ret)
    expect(applySurfaceStyle(p, 'counterpuncher', 'grass').ret).toBeLessThan(p.ret)
  })

  it('all-court is neutral everywhere – that IS its identity, no weaknesses and no shortcuts', () => {
    const p = player(50, 44, 61)
    for (const surface of SURFACES) expect(applySurfaceStyle(p, 'all-court', surface)).toEqual(p)
  })

  it('stays a COLOURING: no attribute moves more than 10% on any (style, surface) cell', () => {
    const p = player(50, 50, 50)
    for (const style of STYLES) {
      for (const surface of SURFACES) {
        const out = applySurfaceStyle(p, style, surface)
        for (const key of ['serve', 'ret', 'stamina'] as const) {
          expect(Math.abs(out[key] - p[key]) / p[key], `${style}/${surface}/${key}`).toBeLessThanOrEqual(0.1)
        }
      }
    }
  })

  it('no style is uniformly better: every non-neutral style gives back somewhere', () => {
    const p = player(50, 50, 50)
    for (const style of STYLES.filter((s) => s !== 'all-court')) {
      const sums = SURFACES.map((surface) => {
        const out = applySurfaceStyle(p, style, surface)
        return out.serve + out.ret + out.stamina
      })
      expect(Math.min(...sums), style).toBeLessThan(p.serve + p.ret + p.stamina)
      expect(Math.max(...sums), style).toBeGreaterThan(p.serve + p.ret + p.stamina)
    }
  })
})

describe('B5 — rivalMatchPlayer: ONE composition, in the kid order, applied exactly once', () => {
  const rival = generateCohort('compose')[0]

  it('is base -> surface/style -> condition factor, and nothing else', () => {
    const condition = 40
    const built = rivalMatchPlayer(rival, 'clay', condition)
    const styled = applySurfaceStyle(rival, styleOf(rival), 'clay')
    const factor = conditionMatchFactor(condition)
    expect(built.serve).toBeCloseTo(styled.serve * factor, 12)
    expect(built.ret).toBeCloseTo(styled.ret * factor, 12)
    expect(built.stamina).toBeCloseTo(styled.stamina * factor, 12)
    // composure takes the condition factor only – the style table deliberately never touches it.
    expect(built.composure).toBeCloseTo(rival.composure * factor, 12)
  })

  it('a fresh rival is her styled self exactly – the condition factor is a no-op above the knee', () => {
    for (const surface of SURFACES) {
      const fresh = rivalMatchPlayer(rival, surface, ECONOMY.condition.max)
      const styled = applySurfaceStyle(rival, styleOf(rival), surface)
      expect(fresh.serve).toBeCloseTo(styled.serve, 12)
      expect(fresh.ret).toBeCloseTo(styled.ret, 12)
    }
    // ...and the default argument means "fresh", so a caller with no derived condition is safe.
    expect(rivalMatchPlayer(rival, 'hard')).toEqual(rivalMatchPlayer(rival, 'hard', ECONOMY.condition.max))
  })

  it('a tired rival is strictly weaker on every attribute, and never below the floor', () => {
    const fresh = rivalMatchPlayer(rival, 'hard', ECONOMY.condition.max)
    const spent = rivalMatchPlayer(rival, 'hard', ECONOMY.condition.min)
    for (const key of ['serve', 'ret', 'composure', 'stamina'] as const) {
      expect(spent[key]).toBeLessThan(fresh[key])
      expect(spent[key]).toBeCloseTo(fresh[key] * ECONOMY.condition.matchStrengthFloor, 12)
    }
    expect(spent.id).toBe(rival.id)
    expect(spent.name).toBe(rival.name)
  })

  it('drops the AiPlayer-only fields: a MatchPlayer goes into the bracket, not a cohort row', () => {
    const built = rivalMatchPlayer(rival, 'hard', 80)
    expect(Object.keys(built).sort()).toEqual(['composure', 'id', 'name', 'ret', 'serve', 'stamina'])
  })

  it('is deterministic and never mutates the cohort row', () => {
    const snapshot = JSON.stringify(rival)
    expect(rivalMatchPlayer(rival, 'grass', 55)).toEqual(rivalMatchPlayer(rival, 'grass', 55))
    expect(JSON.stringify(rival)).toBe(snapshot)
  })
})

// ---------------------------------------------------------------------------
// C — the WIRING. Both halves reach the bracket through one helper, in a real ticked world.
// ---------------------------------------------------------------------------

/** Tick a fresh world `weeks` weeks, resolving any reveal so time keeps moving. */
function runWorld(seed: string, weeks: number): WorldState {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return world
}

describe('C1 — derive, never store: no schema bump and no new cohort field', () => {
  it('the save schema is untouched and a cohort row still carries exactly its generated fields', () => {
    const world = runWorld('rival-wiring', 8)
    expect(world.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    for (const p of world.cohort.slice(0, 5)) {
      expect(Object.keys(p).sort()).toEqual(['composure', 'growth', 'id', 'name', 'nation', 'ret', 'serve', 'stamina'])
    }
  })

  it('AI result rows now record their tier, so next week reconstructs them EXACTLY', () => {
    const world = runWorld('rival-wiring', 8)
    const ai = world.results.filter((r) => r.playerId !== KID_ID && r.week > 0)
    expect(ai.length).toBeGreaterThan(0)
    expect(ai.every((r) => r.tier !== undefined)).toBe(true)
    // ...and the tier is a real one, whose points array really does contain that value.
    for (const r of ai.slice(0, 40)) expect(TIERS[r.tier!].points).toContain(r.points)
  })
})

describe('C2 — a real season produces genuinely tired rivals, and nobody is pinned all season', () => {
  const world = runWorld('rival-wiring', 40)

  it('the ledger feeds the derivation: some of the field is under the strength knee', () => {
    const conds = world.cohort.map((p) => rivalConditions(world.results, world.week).get(p.id) ?? ECONOMY.condition.max)
    expect(conds.some((c) => c < ECONOMY.condition.matchStrengthKnee)).toBe(true)
    expect(conds.some((c) => c === ECONOMY.condition.max)).toBe(true) // ...and some are fresh
  })

  it('NO rival sits at the floor for the whole season – the degenerate cell stays closed', () => {
    const flooredWeeks = new Map<string, number>()
    const weeks = 20
    for (let w = world.week - weeks + 1; w <= world.week; w++) {
      const conds = rivalConditions(world.results, w)
      for (const [id, c] of conds) if (c === ECONOMY.condition.min) flooredWeeks.set(id, (flooredWeeks.get(id) ?? 0) + 1)
    }
    for (const [id, n] of flooredWeeks) expect(n, `${id} floored weeks`).toBeLessThan(weeks / 2)
  })
})

describe('C3 — the kid faces the rivals who actually took the court', () => {
  it('her snapshotted opponents carry the surface/style modifier and their own fatigue', () => {
    const world = createWorld('rival-snapshot')
    const rng = rngFromSeed(world.seed)
    const target = world.season.find((e) => e.tier === 'local' && e.deadlineWeek >= world.week)!
    enterEvent(world, target.id)
    while (!world.pendingTournament) tickWeek(world, rng)
    const p = world.pendingTournament!
    const event = world.season.find((e) => e.id === p.eventId)!
    const byId = new Map(world.cohort.map((c) => [c.id, c]))
    const opponents = Object.entries(p.players).filter(([id]) => id !== KID_ID)
    expect(opponents.length).toBeGreaterThan(0)
    for (const [id, snapshot] of opponents) {
      const row = byId.get(id)!
      const fatigue = rivalConditions(world.results, world.week).get(id) ?? ECONOMY.condition.max
      const expected = rivalMatchPlayer(row, event.surface, fatigue)
      expect(snapshot.id).toBe(expected.id)
      expect(snapshot.name).toBe(expected.name)
      // The snapshot is what the ONE composition helper builds – no second code path. It is taken
      // PRE-drift (step 2 of the tick; driftCohort is step 3), which is deliberate: it is what
      // keeps a revealed match record replayable however the cohort moves afterwards. So the
      // cohort row we read back here has had exactly one drift nudge applied (<= 0.075 per
      // attribute), and the comparison is a ratio rather than an equality.
      for (const key of ['serve', 'ret', 'composure', 'stamina'] as const) {
        expect(snapshot[key] / expected[key], `${id}.${key}`).toBeCloseTo(1, 2)
      }
    }
  })
})

describe('C4 — determinism: same seed, same world, and zero new draws', () => {
  it('two runs of the same seed produce identical ledgers, cohorts and ranks', () => {
    const a = runWorld('rival-determinism', 24)
    const b = runWorld('rival-determinism', 24)
    expect(b.results).toEqual(a.results)
    expect(b.cohort).toEqual(a.cohort)
    expect(b.kidRank).toBe(a.kidRank)
  })

  it('the per-week MAIN-stream draw count is still base costs + cohort drift and nothing else', () => {
    // The rival derivation is pure arithmetic over the ledger, so it cannot add a draw. Proved here
    // independently of the frozen B1/C1/P1 pins, which guard the same property from the other side.
    const world = createWorld('rival-draws')
    const base = rngFromSeed(world.seed)
    const draws: number[] = []
    const rng = () => {
      const v = base()
      draws.push(v)
      return v
    }
    const driftDraws = 4 * world.cohort.length
    for (let i = 0; i < 12; i++) {
      const before = draws.length
      tickWeek(world, rng)
      const week = draws.slice(before)
      const sponsorHit = week[2] < ECONOMY.sponsor.rollChance
      expect(week.length).toBe(driftDraws + (sponsorHit ? 4 : 3))
    }
  })
})

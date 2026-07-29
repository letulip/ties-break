/**
 * Skills-radar bench (docs/specs/skills-radar.md) – a headless "how thick is the fog, and does it
 * lift for the right reasons" tool.
 *
 * WHY IT EXISTS. Everything the radar slice builds is INVISIBLE BY DESIGN: the snapshot carries an
 * estimate and a haze, never a truth, so the usual way of checking an engine change – look at the
 * number it produced – is exactly the thing the design forbids. Tests pin the invariants; this
 * measures the FEEL, which is the part that decides whether the mechanic is doing anything.
 *
 * MEASUREMENT ONLY. It imports the engine and reads snapshots; it changes no engine numbers, and it
 * never draws on the MAIN stream (the radar runs at snapshot time, on its own sub-streams).
 *
 * THREE QUESTIONS, one per section, and each one is a claim the design rests on:
 *
 *   A. THE COACH LADDER'S SECOND JOB. How wide is the fog at week 1 and at week 18, self-coached
 *      versus Elite-coached? If the rung does not visibly change the answer, source 1 of the spec
 *      is not doing its job and the coach ladder has not really been given a second reason to pay.
 *
 *   B. EVIDENCE, NOT ELAPSED TIME. Does composure stay foggy through a career of comfortable
 *      first-round wins, and sharpen through one full of three-setters? That is the claim the whole
 *      design rests on. Measured twice: on SYNTHETIC histories (the clean experiment – identical
 *      match counts, only the scorelines differ, which no live career can be made to hold) and on
 *      LIVE careers sorted by how tight their tennis actually was.
 *
 *   C. THE CEILING FLOOR. Does the outer haze stop narrowing? `potential` is rolled once and never
 *      moves, so a haze that tightened without limit would hand the exact ceiling to a patient
 *      player. Swept over confidence, and then watched on a real 208-week career.
 *
 * PAIRED SEEDS: the seed is `radar-<index>`; the coach rung is NOT in the seed, so every rung faces
 * the same calendar, the same cohort and the same girl. Only the reading of her differs.
 *
 * Run:  npm run bench:radar
 *       npm run bench:radar -- --seeds 12 --weeks 208
 */
import {
  availabilityStatus,
  closeTournament,
  createWorld,
  enterEvent,
  KID_ID,
  matchesEverPlayed,
  skipTournament,
  startingSkills,
  tickWeek,
  toSnapshot,
  coachSinceWeek,
  type WorldState,
} from '../src/engine/world'
import {
  buildRadar,
  ceilingHalfWidth,
  radarConfidence,
  composureUnitsOf,
  readScoreline,
  staminaUnitsOf,
  CEILING_FLOOR_HALF,
  RADAR_BAND_MAX,
  type RadarWorldView,
} from '../src/engine/radar'
import { SKILL_KEYS, type SkillKey } from '../src/engine/development'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS, type CoachTier, type WorldMatch } from '../src/shared/protocol'

const args = process.argv.slice(2)
function flag(name: string, fallback: number): number {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const SEEDS = flag('seeds', 8)
const WEEKS = flag('weeks', 208)
const MARKS = [1, 18, 52, 104, 208].filter((w) => w <= WEEKS)
const TIERS: CoachTier[] = ['self', 'budget', 'middle', 'high', 'elite']

const f1 = (x: number) => x.toFixed(1)
const f2 = (x: number) => x.toFixed(2)
const pad = (s: string, n: number) => s.padEnd(n)
const padL = (s: string, n: number) => s.padStart(n)
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)

// --- a career, driven the way an ordinary player drives one ------------------------------------

interface Mark {
  week: number
  band: Record<SkillKey, number>
  ceilWidth: Record<SkillKey, number>
  conf: Record<SkillKey, number>
  matches: number
  /** composure evidence her retained matches produced, PER MATCH (0 = every afternoon was
   *  comfortable, 1.2 = every one went to the wire) */
  tightShare: number
  /** the same fold for stamina: how much of a long match the average one of hers was */
  longShare: number
  notes: (string | null)[]
}

/** 'all' enters everything she is eligible for. 'home' never leaves the local circuit - the closest
 *  a LIVE career can get to the spec's "a girl who has only ever won easy first rounds", and a
 *  perfectly ordinary way for a cautious family to play. */
type EntryPolicy = 'all' | 'home'

function runCareer(
  seed: string,
  tier: CoachTier,
  weeks: number,
  policy: EntryPolicy = 'all',
): { marks: Mark[]; world: WorldState } {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background: 'wealthy', coachTier: tier })
  const rng = rngFromSeed(world.seed)
  world.plan = { ...WEEK_PLAN_PRESETS.balanced }
  const marks: Mark[] = []
  for (let w = 0; w < weeks; w++) {
    for (const e of world.season.filter((e) => e.week > world.week && e.week <= world.week + 4)) {
      if (world.entries.includes(e.id)) continue
      if (policy === 'home' && e.tier !== 'local') continue
      try {
        if (availabilityStatus(world, e).level === 'blocked') continue
        enterEvent(world, e.id)
      } catch {
        /* an entry we cannot afford or are not eligible for – the player would see the lock */
      }
    }
    tickWeek(world, rng)
    while (world.pendingTournament) {
      if (!world.pendingTournament.finished) skipTournament(world)
      closeTournament(world)
    }
    if (MARKS.includes(world.week)) marks.push(markOf(world))
  }
  return { marks, world }
}

function markOf(world: WorldState): Mark {
  const snap = toSnapshot(world)
  const conf = radarConfidence(viewOf(world))
  const band = {} as Record<SkillKey, number>
  const ceilWidth = {} as Record<SkillKey, number>
  for (const a of snap.radar) {
    band[a.key] = a.band
    ceilWidth[a.key] = a.ceilingHi - a.ceilingLo
  }
  const her = kidMatches(world)
  // The evidence rate her tennis actually produced, per match – the quantity the radar reads, not a
  // proxy for it. `tightShare` is the same fold for composure; `longShare` for stamina.
  const tight = her.reduce((s, m) => s + composureUnitsOf(readScoreline(m.score)), 0)
  const long = her.reduce((s, m) => s + staminaUnitsOf(readScoreline(m.score)), 0)
  return {
    week: world.week,
    band,
    ceilWidth,
    conf,
    matches: matchesEverPlayed(world),
    tightShare: her.length ? tight / her.length : 0,
    longShare: her.length ? long / her.length : 0,
    notes: snap.radar.map((a) => a.note),
  }
}

function kidMatches(world: WorldState): WorldMatch[] {
  return world.events
    .filter((e) => e.match !== undefined && !e.friendly)
    .map((e) => e.match!)
    .filter((m) => m.aId === KID_ID || m.bId === KID_ID)
}

function viewOf(world: WorldState): RadarWorldView {
  const snap = toSnapshot(world)
  return {
    seed: world.seed,
    week: world.week,
    kidId: KID_ID,
    skills: world.skills,
    startSkills: startingSkills(world.seed, world.profile),
    potential: world.potential,
    coachTier: snap.coachMarket.find((c) => c.current)?.tier ?? 'self',
    coachSinceWeek: coachSinceWeek(world),
    matchesPlayed: matchesEverPlayed(world),
    matches: kidMatches(world),
  }
}

// --- A. the coach ladder's second job ----------------------------------------------------------

function sectionA(): Map<string, Mark[]> {
  console.log('\n=== A. THE FOG, BY RUNG =========================================================')
  console.log('    mean |band| in skill points over', SEEDS, 'seeds. 0 = discovered,', RADAR_BAND_MAX, '= a stranger.')
  const all = new Map<string, Mark[]>()
  for (const tier of TIERS) {
    for (let i = 0; i < SEEDS; i++) all.set(`${tier}#${i}`, runCareer(`radar-${i}`, tier, WEEKS).marks)
  }
  console.log('\n  mean band across the four axes')
  console.log('  ' + pad('rung', 9) + MARKS.map((w) => padL(`w${w}`, 8)).join(''))
  for (const tier of TIERS) {
    const row = MARKS.map((w) => {
      const vals: number[] = []
      for (let i = 0; i < SEEDS; i++) {
        const m = all.get(`${tier}#${i}`)!.find((x) => x.week === w)
        if (m) vals.push(mean(SKILL_KEYS.map((k) => m.band[k])))
      }
      return padL(f2(mean(vals)), 8)
    }).join('')
    console.log('  ' + pad(tier, 9) + row)
  }
  console.log('\n  ...and the same, per axis, at week 18 (the four-month read)')
  console.log('  ' + pad('rung', 9) + SKILL_KEYS.map((k) => padL(k, 11)).join(''))
  for (const tier of TIERS) {
    const row = SKILL_KEYS.map((k) => {
      const vals: number[] = []
      for (let i = 0; i < SEEDS; i++) {
        const m = all.get(`${tier}#${i}`)!.find((x) => x.week === 18)
        if (m) vals.push(m.band[k])
      }
      return padL(f2(mean(vals)), 11)
    }).join('')
    console.log('  ' + pad(tier, 9) + row)
  }
  const w1self = mean(bandsAt(all, 'self', 1))
  const w1elite = mean(bandsAt(all, 'elite', 1))
  const w18self = mean(bandsAt(all, 'self', 18))
  const w18elite = mean(bandsAt(all, 'elite', 18))
  console.log('\n  VERDICT  week 1:  self', f2(w1self), 'vs elite', f2(w1elite), `(elite is ${f2(w1self / w1elite)}x sharper)`)
  console.log('           week 18: self', f2(w18self), 'vs elite', f2(w18elite), `(elite is ${f2(w18self / w18elite)}x sharper)`)
  return all
}

function bandsAt(all: Map<string, Mark[]>, tier: CoachTier, week: number): number[] {
  const out: number[] = []
  for (let i = 0; i < SEEDS; i++) {
    const m = all.get(`${tier}#${i}`)!.find((x) => x.week === week)
    if (m) out.push(mean(SKILL_KEYS.map((k) => m.band[k])))
  }
  return out
}

// --- B. evidence, not elapsed time -------------------------------------------------------------

/** A synthetic history of `n` identical matches, so the ONLY thing that differs between two
 *  careers is what the scorelines say happened. A live career cannot be held this still. */
function syntheticView(seed: string, n: number, score: string, tier: CoachTier = 'middle'): RadarWorldView {
  const build = (id: string) => ({ id, name: id, serve: 50, ret: 50, composure: 50, stamina: 50 })
  const matches: WorldMatch[] = Array.from({ length: n }, (_, i) => ({
    round: 0,
    aId: KID_ID,
    bId: `ai-${i}`,
    winnerId: KID_ID,
    score,
    eventId: `e${i}`,
    surface: 'hard' as const,
    oppName: `Opp ${i}`,
    a: build(KID_ID),
    b: build(`ai-${i}`),
  }))
  return {
    seed,
    week: 52,
    kidId: KID_ID,
    skills: { serve: 50, ret: 50, composure: 50, stamina: 50 },
    // This bench measures the FOG, which `startSkills` has no part in - it only feeds the Weekly
    // Story's training line. A girl who has not moved is the neutral fixture for the questions
    // below, and it keeps the synthetic histories comparable to the live careers above.
    startSkills: { serve: 50, ret: 50, composure: 50, stamina: 50 },
    potential: { serve: 65, ret: 65, composure: 65, stamina: 65 },
    coachTier: tier,
    coachSinceWeek: 0,
    matchesPlayed: n,
    matches,
  }
}

function sectionB(all: Map<string, Mark[]>): void {
  console.log('\n=== B. EVIDENCE, NOT ELAPSED TIME ===============================================')
  console.log('    Identical careers, identical coach, identical week. Only the scorelines differ.')
  const cases: [string, string][] = [
    ['easy wins      6-1 6-2', '6-1 6-2'],
    ['routine        6-4 6-3', '6-4 6-3'],
    ['three-setters  6-4 3-6 6-4', '6-4 3-6 6-4'],
    ['tiebreak wars  7-6 6-7 7-6', '7-6 6-7 7-6'],
  ]
  console.log('\n  ' + pad('20 matches of...', 26) + SKILL_KEYS.map((k) => padL(`${k} band`, 16)).join(''))
  for (const [label, score] of cases) {
    const radar = buildRadar(syntheticView('radar-synth', 20, score))
    const row = SKILL_KEYS.map((k) => padL(f2(radar.find((a) => a.key === k)!.band), 16)).join('')
    console.log('  ' + pad(label, 26) + row)
  }
  console.log('\n  the coach note on those two axes, 20 matches in:')
  for (const [label, score] of cases) {
    const radar = buildRadar(syntheticView('radar-synth', 20, score))
    console.log('  ' + pad(label, 28) + 'composure: ' + (radar.find((a) => a.key === 'composure')!.note ?? '(silent)'))
    console.log('  ' + pad('', 28) + 'stamina:   ' + (radar.find((a) => a.key === 'stamina')!.note ?? '(silent)'))
  }
  console.log('\n  ...and how it grows with the number of matches (composure band, middle rung):')
  console.log('  ' + pad('matches', 10) + cases.map(([l]) => padL(l.split(' ')[0], 15)).join(''))
  for (const n of [0, 1, 3, 6, 12, 25, 50]) {
    const row = cases
      .map(([, score]) => padL(f2(buildRadar(syntheticView('radar-synth', n, score)).find((a) => a.key === 'composure')!.band), 15))
      .join('')
    console.log('  ' + padL(String(n), 7) + '   ' + row)
  }

  console.log('\n  LIVE CAREERS (middle rung, week 52) sorted by how tight her tennis actually was:')
  console.log(
    '  ' + pad('seed', 10) + padL('tight/match', 13) + padL('long/match', 12) + padL('matches', 9) +
      padL('composure band', 16) + padL('stamina band', 14) + padL('serve band', 13),
  )
  const rows: { seed: string; tight: number; long: number; matches: number; comp: number; stam: number; serve: number }[] = []
  for (let i = 0; i < SEEDS; i++) {
    const m = all.get(`middle#${i}`)!.find((x) => x.week === 52)
    if (m) {
      rows.push({
        seed: `radar-${i}`, tight: m.tightShare, long: m.longShare, matches: m.matches,
        comp: m.band.composure, stam: m.band.stamina, serve: m.band.serve,
      })
    }
  }
  rows.sort((a, b) => a.tight - b.tight)
  for (const r of rows) {
    console.log(
      '  ' + pad(r.seed, 10) + padL(f2(r.tight), 13) + padL(f2(r.long), 12) + padL(String(r.matches), 9) +
        padL(f2(r.comp), 16) + padL(f2(r.stam), 14) + padL(f2(r.serve), 13),
    )
  }

  // THE SPEC'S OWN SCENARIO, LIVE: "a girl who has only ever won easy first rounds". A family that
  // never leaves the local circuit against one that plays the whole ladder - same seeds, same rung,
  // same girl, and the only difference is the tennis she is asked to play.
  console.log('\n  ...and the same comparison between two LIVE ENTRY POLICIES (middle rung):')
  console.log(
    '  ' + pad('policy', 22) + padL('week', 6) + padL('matches', 9) + padL('tight/match', 13) +
      padL('composure band', 16) + padL('serve band', 13),
  )
  for (const policy of ['all', 'home'] as EntryPolicy[]) {
    const runs = Array.from({ length: SEEDS }, (_, i) => runCareer(`radar-${i}`, 'middle', WEEKS, policy).marks)
    for (const w of MARKS.filter((x) => x >= 52)) {
      const ms = runs.map((r) => r.find((x) => x.week === w)).filter((m): m is Mark => m !== undefined)
      if (ms.length === 0) continue
      console.log(
        '  ' + pad(policy === 'all' ? 'the whole ladder' : 'local circuit only', 22) + padL(`w${w}`, 6) +
          padL(f1(mean(ms.map((m) => m.matches))), 9) + padL(f2(mean(ms.map((m) => m.tightShare))), 13) +
          padL(f2(mean(ms.map((m) => m.band.composure))), 16) + padL(f2(mean(ms.map((m) => m.band.serve))), 13),
      )
    }
  }
}

// --- C. the ceiling floor ----------------------------------------------------------------------

function sectionC(all: Map<string, Mark[]>): void {
  console.log('\n=== C. THE CEILING FLOOR ========================================================')
  console.log(`    Half-width of the outer haze against confidence. It must STOP at ${CEILING_FLOOR_HALF}.`)
  console.log('\n  ' + pad('confidence', 12) + padL('half-width', 12) + '   ')
  for (const c of [0, 0.2, 0.4, 0.6, 2 / 3, 0.7, 0.8, 0.9, 0.99, 1]) {
    const h = ceilingHalfWidth(c)
    const bar = '#'.repeat(Math.round(h * 2))
    console.log('  ' + pad(f2(c), 12) + padL(f1(h), 12) + '   ' + bar + (h === CEILING_FLOOR_HALF ? '  <- FLOOR' : ''))
  }
  console.log('\n  ...and on a live Elite-coached career (mean haze WIDTH, i.e. ceilingHi - ceilingLo):')
  console.log('  ' + pad('week', 8) + SKILL_KEYS.map((k) => padL(k, 11)).join('') + padL('confidence', 12))
  for (const w of MARKS) {
    const vals = SKILL_KEYS.map((k) => {
      const xs: number[] = []
      for (let i = 0; i < SEEDS; i++) {
        const m = all.get(`elite#${i}`)!.find((x) => x.week === w)
        if (m) xs.push(m.ceilWidth[k])
      }
      return padL(f2(mean(xs)), 11)
    }).join('')
    const cs: number[] = []
    for (let i = 0; i < SEEDS; i++) {
      const m = all.get(`elite#${i}`)!.find((x) => x.week === w)
      if (m) cs.push(mean(SKILL_KEYS.map((k) => m.conf[k])))
    }
    console.log('  ' + pad(`w${w}`, 8) + vals + padL(f2(mean(cs)), 12))
  }
  console.log(
    '\n  A haze that stops at ' + 2 * CEILING_FLOOR_HALF + ' points wide is the whole of "you learn the range, never the number".',
  )
}

// --- D. what the empty state looks like --------------------------------------------------------

function sectionD(): void {
  console.log('\n=== D. THE EMPTY STATE (week 1, no matches, self-coached) =======================')
  const world = createWorld('radar-0', { ...DEFAULT_PROFILE, coachTier: 'self' })
  const snap = toSnapshot(world)
  console.log('  ' + pad('axis', 11) + padL('shown', 8) + padL('band', 8) + padL('ceilLo', 9) + padL('ceilHi', 9) + '  note')
  for (const a of snap.radar) {
    console.log(
      '  ' +
        pad(a.key, 11) +
        padL(f1(a.shownValue), 8) +
        padL(f1(a.band), 8) +
        padL(f1(a.ceilingLo), 9) +
        padL(f1(a.ceilingHi), 9) +
        '  ' +
        (a.note ?? '(silent)'),
    )
  }
  const elite = toSnapshot(createWorld('radar-0', { ...DEFAULT_PROFILE, coachTier: 'elite' }))
  console.log('\n  the same girl, the same week, with an Elite coach already hired:')
  for (const a of elite.radar) {
    console.log('  ' + pad(a.key, 11) + padL(f1(a.shownValue), 8) + padL(f1(a.band), 8) + '  ' + (a.note ?? '(silent)'))
  }
  // ...and what the same card says once she has a career behind her, which is the copy the screen
  // will be laying out most of the time.
  console.log('\n  ...and a mid-career card (High rung, week 60):')
  const mid = toSnapshot(runCareer('radar-0', 'high', 60).world)
  for (const a of mid.radar) {
    console.log(
      '  ' + pad(a.key, 11) + padL(f1(a.shownValue), 8) + padL(f1(a.band), 8) + padL(f1(a.ceilingLo), 9) +
        padL(f1(a.ceilingHi), 9) + '  ' + (a.note ?? '(silent)'),
    )
  }
}


console.log('SKILLS-RADAR BENCH  –', SEEDS, 'seeds x', TIERS.length, 'rungs, horizon', WEEKS, 'weeks')
const all = sectionA()
sectionB(all)
sectionC(all)
sectionD()
console.log('')

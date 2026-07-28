// The tournament preview (wave 2) – what the Season card promises about an event she has not played.
//
// This is a NEW PROMISE TO THE PLAYER, so it is pinned harder than a layout is. Three properties
// carry it, and each has a way of going quietly wrong:
//
//   1. IT NAMES THE OPPONENT SHE ACTUALLY GETS. The preview rebuilds the field the bracket will
//      build; if the two ever drift, the card lies about a specific person. Pinned by playing the
//      real tournament and comparing.
//   2. IT IS STABLE. A card whose number moves between renders is not information.
//   3. IT COSTS THE MAIN STREAM NOTHING. Previews are computed on every snapshot; if one drew from
//      the weekly stream, merely LOOKING at the Season screen would change the career.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { previewEvent, eventTemperature } from '../src/engine/season/preview'
import {
  drawKidInto,
  firstRoundOpponent,
  selectEntrants,
  standardSeedOrder,
  runTournament,
  JUNIOR_TOUR,
} from '../src/engine/season/tournament'
import { computeRanking } from '../src/engine/season/ranking'
import { rivalConditions, rivalMatchPlayer } from '../src/engine/season/rival'
import { fastMatchProbability } from '../src/engine/match/engine'
import { TIERS } from '../src/engine/season/calendar'
import { ECONOMY } from '../src/engine/economy'
import { createWorld, kidMatchPlayerFor, KID_ID, tickWeek, toSnapshot } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import type { MatchPlayer } from '../src/engine/match/types'
import type { SeasonEvent } from '../src/engine/season/types'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

/** The roster `computeRanking` wants: the whole cohort plus her. `cohortIds` is engine-internal, so
 *  the test spells the same thing rather than widening the engine's surface for a test's sake. */
const roster = (w: { cohort: { id: string }[] }) => [...w.cohort.map((p) => p.id), KID_ID]

function fixture(seed: string) {
  const world = createWorld(seed)
  const ranking = computeRanking(world.results, world.week, roster(world))
  const event = world.season.find((e) => e.week > world.week)!
  const kid = kidMatchPlayerFor(world, event.surface)
  return { world, ranking, event, kid }
}

describe('the preview names the opponent the bracket actually produces', () => {
  it('agrees with a real run of the same event, on every tier', () => {
    // The load-bearing test of the whole module. The preview and `runTournament` build the field
    // independently; they agree only because they consume the SAME sub-stream in the same order and
    // share `drawKidInto`. Break either and this fails with a name.
    for (const seed of ['pv-a', 'pv-b', 'pv-c', 'pv-d']) {
      const { world, ranking, event, kid } = fixture(seed)
      const preview = previewEvent(world, event, ranking, kid)

      // Now play it for real, exactly as computeShadowTournament does.
      // The bracket scales opponents by their REAL fatigue; the preview scales them rested (see
      // preview.ts). That changes how strong they are, never WHO they are - `selectEntrants` reads
      // the standings, not conditions - so the identity check below still bites.
      const fatigue = rivalConditions(world.results, world.week)
      const rng = rngFromSeed(`${world.seed}:kidtour:${event.id}`)
      const field = selectEntrants(event, world.cohort, ranking, rng).map((p) =>
        rivalMatchPlayer(p, event.surface, fatigue.get(p.id) ?? ECONOMY.condition.max),
      )
      const result = runTournament(event, field, kid, world.seed, rng)
      const first = result.matches.find((m) => m.aId === KID_ID || m.bId === KID_ID)!
      const realOppId = first.aId === KID_ID ? first.bId : first.aId
      const realOpp = field.find((p) => p.id === realOppId)!

      expect(preview.opponentName, `${seed}/${event.tier}`).toBe(realOpp.name)
    }
  })

  it('the chance is the engine\'s own formula against that opponent – not a second model', () => {
    const { world, ranking, event, kid } = fixture('pv-formula')
    const preview = previewEvent(world, event, ranking, kid)
    const rng = rngFromSeed(`${world.seed}:kidtour:${event.id}`)
    const entrants = selectEntrants(event, world.cohort, ranking, rng).map((p) =>
      rivalMatchPlayer(p, event.surface, ECONOMY.condition.max),
    )
    const drawSize = TIERS[event.tier].drawSize
    const f: MatchPlayer[] = entrants.slice(0, drawSize - 1)
    f.push(kid)
    const alive = standardSeedOrder(f.length).map((s) => f[s - 1])
    drawKidInto(alive, kid, rng)
    const opp = firstRoundOpponent(alive, kid)!
    expect(preview.firstMatchChance).toBe(
      fastMatchProbability(kid, opp, { surface: event.surface, tour: JUNIOR_TOUR, seed: '' }),
    )
  })
})

describe('the preview is stable, and free', () => {
  it('is a pure function: the same world and event give the same card, every time', () => {
    const { world, ranking, event, kid } = fixture('pv-stable')
    const first = previewEvent(world, event, ranking, kid)
    for (let i = 0; i < 10; i++) {
      expect(previewEvent(world, event, ranking, kid)).toEqual(first)
    }
  })

  it('computing it does not advance the career – a rendered card changes nothing', () => {
    // The real guarantee behind "no MAIN-stream draws": build a world, snapshot its whole state,
    // preview every upcoming event several times, and check the world is untouched.
    const world = createWorld('pv-free')
    const before = JSON.stringify(world)
    const ranking = computeRanking(world.results, world.week, roster(world))
    for (let i = 0; i < 3; i++) {
      for (const e of world.season.filter((x) => x.week > world.week).slice(0, 8)) {
        previewEvent(world, e, ranking, kidMatchPlayerFor(world, e.surface))
      }
    }
    expect(JSON.stringify(world)).toBe(before)
  })

  it('two careers that only differ by seed do not share a preview', () => {
    const a = fixture('pv-seed-a')
    const b = fixture('pv-seed-b')
    const pa = previewEvent(a.world, a.event, a.ranking, a.kid)
    const pb = previewEvent(b.world, b.event, b.ranking, b.kid)
    expect(pa).not.toEqual(pb)
  })

  it('previews a RESTED field – a rival\'s exhaustion today is not a fact about a future week', () => {
    // The correction that produced this rule: previewing at today's condition read 81% for a J30
    // event eight weeks out, against a field whose median condition that day was 3 out of 100. The
    // same draw rested reads 52%. So the module must not consult the fatigue map at all.
    const src = read('../src/engine/season/preview.ts')
    expect(src).not.toContain('rivalConditions')
    expect(src).toContain('rivalMatchPlayer(p, event.surface, ECONOMY.condition.max)')
    // ...and its input type cannot even reach the results ledger the fatigue is derived from.
    const sig = src.slice(src.indexOf('export function previewEvent'), src.indexOf('): EventPreview'))
    expect(sig).not.toContain('results')
  })

  it('draws ONLY on purpose-scoped sub-streams – the frozen capture cannot move', () => {
    const src = read('../src/engine/season/preview.ts')
    const keys = [...src.matchAll(/rngFromSeed\(`([^`]+)`\)/g)].map((m) => m[1])
    expect(keys.length).toBeGreaterThan(0)
    for (const k of keys) {
      expect(k, `preview reads ${k}`).toMatch(/^\$\{seed\}:(kidtour|weather):/)
    }
  })
})

describe('what the numbers say', () => {
  it('the chance is a probability, on every tier and surface the calendar can produce', () => {
    for (const seed of ['pv-r1', 'pv-r2', 'pv-r3']) {
      const world = createWorld(seed)
      const ranking = computeRanking(world.results, world.week, roster(world))
      for (const e of world.season.filter((x) => x.week > world.week).slice(0, 12)) {
        const p = previewEvent(world, e, ranking, kidMatchPlayerFor(world, e.surface))
        expect(p.firstMatchChance, `${seed}/${e.tier}/${e.surface}`).toBeGreaterThan(0)
        expect(p.firstMatchChance).toBeLessThan(1)
        expect(p.opponentName).not.toBe('')
        expect(['favourite', 'even', 'strong']).toContain(p.fieldStrength)
      }
    }
  })

  it('a stronger tier is a harder field: J30 reads worse than Local for the same girl', () => {
    // Pooled over seeds, because a single draw is a draw. The property is about the LEVEL, not
    // about any one opponent.
    let local = 0
    let j30 = 0
    let n = 0
    for (let i = 0; i < 12; i++) {
      const world = createWorld(`pv-tier-${i}`)
      const ranking = computeRanking(world.results, world.week, roster(world))
      const l = world.season.find((e) => e.tier === 'local' && e.week > world.week)
      const j = world.season.find((e) => e.tier === 'j30' && e.week > world.week)
      if (!l || !j) continue
      local += previewEvent(world, l, ranking, kidMatchPlayerFor(world, l.surface)).firstMatchChance
      j30 += previewEvent(world, j, ranking, kidMatchPlayerFor(world, j.surface)).firstMatchChance
      n++
    }
    expect(n).toBeGreaterThan(4)
    expect(local / n).toBeGreaterThan(j30 / n)
  })

  it('the field reads STRONGER at the top of the ladder than at the bottom', () => {
    const rank = { favourite: 0, even: 1, strong: 2 }
    let localScore = 0
    let j30Score = 0
    let n = 0
    for (let i = 0; i < 12; i++) {
      const world = createWorld(`pv-band-${i}`)
      const ranking = computeRanking(world.results, world.week, roster(world))
      const l = world.season.find((e) => e.tier === 'local' && e.week > world.week)
      const j = world.season.find((e) => e.tier === 'j30' && e.week > world.week)
      if (!l || !j) continue
      localScore += rank[previewEvent(world, l, ranking, kidMatchPlayerFor(world, l.surface)).fieldStrength]
      j30Score += rank[previewEvent(world, j, ranking, kidMatchPlayerFor(world, j.surface)).fieldStrength]
      n++
    }
    expect(n).toBeGreaterThan(4)
    expect(j30Score).toBeGreaterThanOrEqual(localScore)
  })

  it('her odds move with HER: a girl with results reads better than the same girl without', () => {
    // The estimate has to respond to the career, or it is decoration with a percent sign.
    const bare = createWorld('pv-growth')
    const strong = createWorld('pv-growth')
    // Give the second one a season's worth of standing.
    for (let w = 0; w < 30; w++) {
      strong.results.push({ playerId: KID_ID, week: w, points: 60, tier: 'regional' })
    }
    const event = bare.season.find((e) => e.tier === 'regional' && e.week > bare.week)!
    const pBare = previewEvent(
      bare,
      event,
      computeRanking(bare.results, bare.week, roster(bare)),
      kidMatchPlayerFor(bare, event.surface),
    )
    const pStrong = previewEvent(
      strong,
      event,
      computeRanking(strong.results, strong.week, roster(strong)),
      kidMatchPlayerFor(strong, event.surface),
    )
    // Her standing changed, so the field she is drawn into and how she reads against it changed too.
    expect(pStrong).not.toEqual(pBare)
  })
})

describe('the weather is decoration, and stays decoration', () => {
  it('is stable per event and varies between events', () => {
    const world = createWorld('pv-weather')
    const events = world.season.filter((e) => e.week > world.week).slice(0, 20)
    const seen = new Set<number>()
    for (const e of events) {
      const t = eventTemperature(world.seed, e)
      expect(eventTemperature(world.seed, e)).toBe(t) // stable
      expect(t).toBeGreaterThan(0)
      expect(t).toBeLessThan(45)
      seen.add(t)
    }
    expect(seen.size).toBeGreaterThan(1) // it actually varies
  })

  it('touches nothing the simulation reads: two worlds tick identically whatever the weather says', () => {
    const a = createWorld('pv-weather-free')
    const b = createWorld('pv-weather-free')
    // Read every temperature on one of them, then tick both the same way.
    for (const e of a.season) eventTemperature(a.seed, e)
    const ra = rngFromSeed(a.seed)
    const rb = rngFromSeed(b.seed)
    for (let i = 0; i < 20; i++) {
      tickWeek(a, ra)
      tickWeek(b, rb)
    }
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('is not consulted by the engine – only the preview and the view know it exists', () => {
    // A grep guard, because the day someone makes weather affect a match is the day it stops being
    // free and starts needing a schema, a capture re-pin and a balance sweep.
    for (const rel of ['../src/engine/world.ts', '../src/engine/match/engine.ts', '../src/engine/season/tournament.ts']) {
      expect(read(rel), rel).not.toContain('eventTemperature')
      expect(read(rel), rel).not.toContain(':weather:')
    }
  })
})

describe('every upcoming card on the snapshot carries one', () => {
  it('the Season screen never has to ask twice, and never gets an empty card', () => {
    const world = createWorld('pv-snapshot')
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 6; i++) tickWeek(world, rng)
    const snap = toSnapshot(world)
    expect(snap.upcoming.length).toBeGreaterThan(0)
    for (const u of snap.upcoming) {
      expect(u.preview.opponentName, u.id).not.toBe('')
      expect(u.preview.firstMatchChance).toBeGreaterThan(0)
      expect(u.preview.temperatureC).toBeGreaterThan(0)
    }
  })
})

/** Referenced so the SeasonEvent import is used by the fixture helper's return type. */
export type _Event = SeasonEvent

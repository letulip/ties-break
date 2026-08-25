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
import { worldSource } from './worldSource'
import { readFileSync } from 'node:fs'
import { previewEvent, eventTemperature, eventCrowd } from '../src/engine/season/preview'
import {
  buildDraw,
  firstRoundOpponent,
  kidSeedIndexIn,
  selectEntrants,
  runTournament,
  JUNIOR_TOUR,
} from '../src/engine/season/tournament'
import { BEST_N_BY_TRACK, computeRanking } from '../src/engine/season/ranking'
import { rivalConditions, rivalMatchPlayer } from '../src/engine/season/rival'
import { fastMatchProbability } from '../src/engine/match/engine'
import { ECONOMY } from '../src/engine/economy'
import { createWorld, kidMatchPlayerFor, KID_ID, tickWeek, toSnapshot } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import type { SeasonEvent, TierId } from '../src/engine/season/types'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

/** The spectator corridors, restated INDEPENDENTLY of the engine's own table (preview.ts
 *  CROWD_BANDS) rather than imported from it. A test that imports the numbers it is checking pins
 *  nothing; written out here, retuning a band is a deliberate two-file edit that shows up in a
 *  diff – which is what the owner tunes this feature by. */
const EXPECTED_BANDS: Record<TierId, readonly [number, number]> = {
  local: [10, 40],
  regional: [45, 130],
  national: [220, 650],
  j30: [30, 90],
  j60: [110, 320],
  j300: [900, 2600],
  // ⚠ RE-AIMED, NOT WEAKENED (task #17): three rungs joined the catalogue and this restatement is
  // exhaustive over `TierId` on purpose, so it grew by exactly three rows. Read them against j30's
  // [30, 90] and regional's [45, 130] before assuming they are too low - the table's whole joke is
  // that its order is PRODUCTION SCALE and not prestige, and W15 keeps it going one table up: the
  // first rung of the women's professional tour is the emptiest room in the game, quieter than a
  // Regional and quieter than a J30. Even W100's ceiling sits below J300's, which is also correct:
  // a junior Slam feeder buses children in, a $100k adult event is a Tuesday in a mid-size town.
  w15: [20, 70],
  w35: [60, 200],
  // W2-LADDER: the middle rungs continue the production-scale climb (a W50 is a W35 with a second
  // stand, a W75 the first organised adult week) and both stay BELOW J300's 900-2,600; the 125 is
  // the first room that OUTGROWS it - a WTA event proper. Same two-file discipline as every row
  // above: these numbers restate preview.ts's table independently.
  w50: [90, 280],
  w75: [150, 500],
  w100: [400, 1400],
  wta125: [1200, 3500],
  // W3-ACT2, and this is where the joke stops: every rung so far has been a ROOM, and these four are
  // the tour she was climbing towards. Four more rows, same two-file discipline - the numbers below
  // restate preview.ts's table independently, so retuning a band is a deliberate edit that shows in
  // a diff rather than a silent one.
  wta250: [3000, 9000],
  wta500: [7000, 18000],
  wta1000: [15000, 35000],
  slam: [25000, 70000],
}

/** The roster `computeRanking` wants: the whole cohort plus her. `cohortIds` is engine-internal, so
 *  the test spells the same thing rather than widening the engine's surface for a test's sake. */
const roster = (w: { cohort: { id: string }[] }) => [...w.cohort.map((p) => p.id), KID_ID]

function fixture(seed: string) {
  const world = createWorld(seed)
  const ranking = computeRanking(world.results, world.week, BEST_N_BY_TRACK.itf, roster(world))
  const event = world.season.find((e) => e.week > world.week)!
  const kid = kidMatchPlayerFor(world, event.surface)
  return { world, ranking, event, kid }
}

describe('the preview names the opponent the bracket actually produces', () => {
  it('agrees with a real run of the same event, on every tier', () => {
    // The load-bearing test of the whole module. The preview and `runTournament` build the field
    // independently; they agree only because they consume the SAME sub-stream in the same order and
    // share the draw itself. Break either and this fails with a name.
    // ⚠ RE-AIMED (29.07, partial seeding): `drawKidInto` is gone – the whole bracket is now built by
    // `buildDraw`, which seeds the top 8 of 32 and shuffles the rest, the kid included, at her own
    // standing. The protected fact is unchanged and is the only one that matters here: the name the
    // card prints is the name the bracket produces.
    for (const seed of ['pv-a', 'pv-b', 'pv-c', 'pv-d']) {
      const { world, ranking, event, kid } = fixture(seed)
      const preview = previewEvent(world, event, ranking, kid)

      // Now play it for real, exactly as computeShadowTournament does.
      // Built exactly as computeShadowTournament does, GATE INCLUDED: `selectEntrants` now takes
      // the fatigue map, because a rival under her tier's floor sits the week out. The preview must
      // pass the same map or it would name an opponent who is not in the draw - which is precisely
      // what this test exists to catch. (It scales them rested; that changes strength, never
      // identity.)
      const fatigue = rivalConditions(world.results, world.week)
      const rng = rngFromSeed(`${world.seed}:kidtour:${event.id}`)
      const field = selectEntrants(event, world.cohort, ranking, rng, fatigue).map((p) =>
        rivalMatchPlayer(p, event.surface, fatigue.get(p.id) ?? ECONOMY.condition.max),
      )
      const result = runTournament(event, field, kid, world.seed, rng, kidSeedIndexIn(field, ranking, KID_ID))
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
    const entrants = selectEntrants(
      event,
      world.cohort,
      ranking,
      rng,
      rivalConditions(world.results, world.week),
    ).map((p) => rivalMatchPlayer(p, event.surface, ECONOMY.condition.max))
    // ⚠ RE-AIMED with the test above: one call to the shared `buildDraw` replaces the hand-rolled
    // copy of the bracket, which is the point of extracting it.
    const alive = buildDraw(event, entrants, kid, kidSeedIndexIn(entrants, ranking, kid.id), rng)
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
    const ranking = computeRanking(world.results, world.week, BEST_N_BY_TRACK.itf, roster(world))
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
    // ⚠ TIGHTENED, not loosened, by the rival availability gate (28.07). The module DOES read the
    // fatigue map now - it has to, because a rival under her tier's floor no longer enters and the
    // preview would otherwise name someone who is not in the draw. What must never happen is
    // fatigue reaching the STRENGTH of the players, and that is what is pinned: the only place a
    // condition is handed to `rivalMatchPlayer` is the constant maximum.
    const src = read('../src/engine/season/preview.ts')
    expect(src).toContain('rivalMatchPlayer(p, event.surface, ECONOMY.condition.max)')
    expect(src.match(/rivalMatchPlayer\(/g) ?? []).toHaveLength(1)
    expect(src).not.toMatch(/rivalMatchPlayer\([^)]*conditions/)
    // ...and the fatigue map only ever reaches the entrant SELECTION.
    // ⚠ RE-AIMED (W2-FIELD2): the call gained a sixth argument, `excluded` – whoever a HIGHER W rung
    // of the same week has already drawn. It is a SELECTION input like `conditions` beside it and
    // belongs on exactly this line, so the guard follows the call rather than the spelling.
    expect(src).toContain('selectEntrants(event, cohort, ranking, rng, conditions, excluded)')
  })

  it('draws ONLY on purpose-scoped sub-streams – the frozen capture cannot move', () => {
    // ⚠ RE-AIMED, NOT WEAKENED: the allowlist gained `crowd` when the spectator figure landed
    // (`seed:crowd:<eventId>`, engine/season/preview.ts `eventCrowd`). WHAT IS PINNED HERE IS
    // UNCHANGED and is not the list of names: it is that every stream this module opens is
    // PURPOSE-SCOPED and event-keyed – never the bare `${seed}`, which is the MAIN weekly stream
    // the frozen 41550 / e6b0c709 capture measures. A closed allowlist rather than a generic
    // `${seed}:<word>:` pattern is the point: a fourth sub-stream must be added here deliberately,
    // by someone who has read this comment, instead of appearing by accident.
    const src = read('../src/engine/season/preview.ts')
    const keys = [...src.matchAll(/rngFromSeed\(`([^`]+)`\)/g)].map((m) => m[1])
    expect(keys.length).toBeGreaterThan(0)
    for (const k of keys) {
      expect(k, `preview reads ${k}`).toMatch(/^\$\{seed\}:(kidtour|weather|crowd):/)
    }
  })
})

describe('what the numbers say', () => {
  it('the chance is a probability, on every tier and surface the calendar can produce', () => {
    for (const seed of ['pv-r1', 'pv-r2', 'pv-r3']) {
      const world = createWorld(seed)
      const ranking = computeRanking(world.results, world.week, BEST_N_BY_TRACK.itf, roster(world))
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
      const ranking = computeRanking(world.results, world.week, BEST_N_BY_TRACK.itf, roster(world))
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
      const ranking = computeRanking(world.results, world.week, BEST_N_BY_TRACK.itf, roster(world))
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
      computeRanking(bare.results, bare.week, BEST_N_BY_TRACK.itf, roster(bare)),
      kidMatchPlayerFor(bare, event.surface),
    )
    const pStrong = previewEvent(
      strong,
      event,
      computeRanking(strong.results, strong.week, BEST_N_BY_TRACK.itf, roster(strong)),
      kidMatchPlayerFor(strong, event.surface),
    )
    // Her standing changed, so the field she is drawn into and how she reads against it changed too.
    expect(pStrong).not.toEqual(pBare)
  })
})

// THE CROWD (owner: «"Spectators" – это прикольно вроде, можно как-то прикинуть какие-то коридоры
// для разного уровня турниров»). Pinned to the weather's standard, plus one property the weather
// does not have: the bands have to say something. A crowd figure that does not separate the rungs
// is not atmosphere, it is noise with a label on it.
describe('the crowd is decoration, and stays decoration', () => {
  it('is stable per event, varies between events, and never leaves its tier band', () => {
    const world = createWorld('pv-crowd')
    const events = world.season.filter((e) => e.week > world.week)
    const seen = new Map<TierId, Set<number>>()
    for (const e of events) {
      const c = eventCrowd(world.seed, e)
      expect(eventCrowd(world.seed, e), e.id).toBe(c) // stable: the card cannot move under the player
      const [lo, hi] = EXPECTED_BANDS[e.tier]
      expect(c, `${e.id} out of band`).toBeGreaterThanOrEqual(lo)
      expect(c, `${e.id} out of band`).toBeLessThanOrEqual(hi)
      // Rounded to an estimate, never a turnstile count – and the rounding must not push a figure
      // out of its own corridor, which is why every band end is a multiple of its step.
      expect(c % (hi >= 1000 ? 50 : hi >= 200 ? 10 : 5), e.id).toBe(0)
      ;(seen.get(e.tier) ?? seen.set(e.tier, new Set()).get(e.tier)!).add(c)
    }
    for (const [tier, values] of seen) expect(values.size, `${tier} is a constant`).toBeGreaterThan(1)
  })

  it('the ladder is FELT: local is a bench, national is a stand, J300 is a show court', () => {
    // The owner's own acceptance test - "if local and national overlap, the bands are wrong".
    // Measured over real seasons rather than off the table, so a future tuning of the table is
    // judged by what the calendar actually produces.
    const byTier = new Map<TierId, number[]>()
    for (const seed of ['pv-crowd-1', 'pv-crowd-2', 'pv-crowd-3']) {
      const world = createWorld(seed)
      for (const e of world.season) (byTier.get(e.tier) ?? byTier.set(e.tier, []).get(e.tier)!).push(eventCrowd(world.seed, e))
    }
    const span = (t: TierId) => {
      const v = byTier.get(t) ?? []
      expect(v.length, `${t} never scheduled`).toBeGreaterThan(0)
      return [Math.min(...v), Math.max(...v)] as const
    }
    // ⚠ THE HARD ONE (owner). A local open and a national championship must not be confusable.
    expect(span('local')[1], 'local tops out above national\'s floor').toBeLessThan(span('national')[0])
    // Each ladder climbs within itself - the DOMESTIC rungs and the ITF rungs separately, because
    // production scale is not prestige and the two tracks are deliberately interleaved (a J30
    // abroad draws fewer people than a national at home). See the table in preview.ts.
    expect(span('local')[1]).toBeLessThan(span('regional')[0])
    expect(span('regional')[1]).toBeLessThan(span('national')[0])
    expect(span('j30')[1]).toBeLessThan(span('j60')[0])
    expect(span('j60')[1]).toBeLessThan(span('j300')[0])
    // And the top of the ladder is a different KIND of event: an order of magnitude past everything.
    expect(span('j300')[0]).toBeGreaterThan(span('national')[1])
    // Nobody should ever feel a local event drew a thousand people.
    expect(span('local')[1]).toBeLessThan(100)
  })

  it('touches nothing the simulation reads: two worlds tick identically whatever the crowd says', () => {
    const a = createWorld('pv-crowd-free')
    const b = createWorld('pv-crowd-free')
    // Read every gate on one of them, then tick both the same way.
    for (const e of a.season) eventCrowd(a.seed, e)
    const ra = rngFromSeed(a.seed)
    const rb = rngFromSeed(b.seed)
    for (let i = 0; i < 20; i++) {
      tickWeek(a, ra)
      tickWeek(b, rb)
    }
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('is not consulted by the engine – condition, nerves and money never see it', () => {
    // The same grep guard the weather carries, and for the same reason: the day someone lets a
    // crowd figure move a match is the day it stops being free and starts needing a schema, a
    // capture re-pin and a balance sweep. world.ts is exempted for ONE call - the snapshot copy
    // that carries the figure to screen E - so the guard checks the SIMULATION files, and checks
    // that world.ts's single use is the view assembly and not a rule.
    for (const rel of ['../src/engine/match/engine.ts', '../src/engine/season/tournament.ts', '../src/engine/condition.ts']) {
      expect(read(rel), rel).not.toContain('eventCrowd')
      expect(read(rel), rel).not.toContain(':crowd:')
    }
    const world = worldSource()
    expect(world.match(/eventCrowd\(/g) ?? [], 'world.ts uses the crowd more than once').toHaveLength(1)
    expect(world).toContain('crowd: eventCrowd(world.seed, event)')
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
    //
    // ⚠ RE-AIMED, NOT WEAKENED, and world.ts is now exempted for ONE call – exactly the shape the
    // crowd's guard above already has. THE PROTECTED FACT IS UNCHANGED: weather must not reach the
    // SIMULATION. What changed is that the live match needs to SHOW the day, and the number has to
    // travel there on the pending view because `upcoming` drops an event the week it is played.
    // A view assembly is not a rule, and the pin below is what keeps the difference honest: the
    // match engine and the tournament still may not name it at all, and world.ts gets one use,
    // whose exact text is asserted so a second one cannot hide behind the first.
    for (const rel of ['../src/engine/match/engine.ts', '../src/engine/season/tournament.ts']) {
      expect(read(rel), rel).not.toContain('eventTemperature')
      expect(read(rel), rel).not.toContain(':weather:')
    }
    const world = worldSource()
    expect(world).not.toContain(':weather:')
    // ⚠ ROUND 26 #6 RE-AIM – TWO USES NOW, AND BOTH ARE NAMED SO A THIRD CANNOT HIDE BEHIND THEM.
    // The claim this pin makes is «the weather is a VIEW ASSEMBLY and the simulation never reads
    // it», and that is unchanged: both uses are inside `pendingView`, both write `temperatureC` on
    // the view and nothing else. The second one belongs to the College League's reveal, which walks
    // the same flow and therefore needs the same decorative day – through the SAME function, because
    // two weather functions is how one tournament comes to have two days.
    expect(world.match(/eventTemperature\(/g) ?? [], 'world.ts uses the weather somewhere new').toHaveLength(2)
    expect(world).toContain('temperatureC: eventTemperature(world.seed, event)')
    expect(world).toContain('temperatureC: eventTemperature(world.seed, { id: `college-w${reveal.week}`, surface })')
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
      expect(u.preview.crowd, u.id).toBeGreaterThan(0)
    }
  })

  it('the E brief and the Season card quote the SAME crowd for the same tournament', () => {
    // The figure reaches screen E through `PendingView.crowd`, because the preview leaves the
    // snapshot the week its event arrives. Two carriers for one number is exactly how two screens
    // start disagreeing about one tournament, so this pins that they cannot: both read `eventCrowd`
    // off the same event id.
    const world = createWorld('pv-crowd-handoff')
    for (const e of world.season.filter((x) => x.week > world.week).slice(0, 10)) {
      const p = previewEvent(world, e, computeRanking(world.results, world.week, BEST_N_BY_TRACK.itf, roster(world)), kidMatchPlayerFor(world, e.surface))
      expect(p.crowd, e.id).toBe(eventCrowd(world.seed, e))
    }
  })
})

/** Referenced so the SeasonEvent import is used by the fixture helper's return type. */
export type _Event = SeasonEvent

// THE EIGHT FIXTURES THE FILM IS SHOT ON – real careers, walked through the bench's own harness,
// ended by the SHIPPED resolvers.
//
// ⚠⚠ NOT ONE THRESHOLD, PROBABILITY OR PIECE OF ENDING LOGIC IS TOUCHED. `ENDINGS` is read and never
// written; every ending here is latched by `answerFork`, `answerRetirement`, `resolveEndings` or
// `resolveLeaving` on a world those functions were handed. What this file chooses is WHICH CAREER to
// film, which is what a demo save is.
//
// ⚠ THE SAVES ARE WRITTEN OUTSIDE THE REPOSITORY. `--out` is a directory argument; nothing is
// committed, and the owner's own saves are never opened, read or written by this tool.
//
// ⭐ THE TWO RARE DOORS ARE CAST, NOT TUNED. `resolveLeaving` draws
// `rngFromSeed(`${seed}:ending:${door}:${seasonIndex}`)()` against a chance of 0.02 / 0.01, so
// whether a given career's coin lands is a fact about that career. `coin-search.ts` enumerates the
// (seed, season) pairs whose coin lands – in milliseconds, without walking anything – and the walk
// below then has to prove the DOOR was open at that season as well. Both halves are the engine's.
import fs from 'node:fs'
import { openCareer, stepCareerWeek, PRESETS, POLICIES, type Policy } from '../econ-bench'
import { answerBirthdayNeutral } from '../_birthday'
import { drainLifeBeats } from '../_lifeBeats'
import {
  answerFork,
  answerRetirement,
  pendingBirthday,
  kidAgeYears,
  leavingViewOf,
  resolveLeaving,
  type WorldState,
} from '../../src/engine/world'
import { peakLeavingDue, fallLeavingDue, ENDING_TITLE } from '../../src/engine/ending'
import { encodeExportFile } from '../../src/engine/saveCodec'
import { WEEKS_PER_YEAR } from '../../src/engine/season/calendar'
import type { ForkAnswer } from '../../src/shared/protocol'

const POLICY: Policy = POLICIES[1] ?? POLICIES[0]
const HORIZON = 45 * WEEKS_PER_YEAR

export type WalkOpts = {
  /** stop the walk the moment the season history reaches this length (a wrap has just landed) */
  untilSeasons?: number
  /** 'accept' takes every retirement offer; 'decline' asks for one more year, every time */
  retire?: 'accept' | 'decline'
  fork?: ForkAnswer
}

/** One career, walked by the same harness every balance bench uses. Returns as soon as the engine
 *  latches an ending, or when the requested wrap lands, or at the horizon. */
export function walk(index: number, opts: WalkOpts = {}): { world: WorldState; seed: string } {
  const preset = PRESETS[index % PRESETS.length]
  const { world, rng, seed } = openCareer(preset, index, POLICY)
  for (let w = 0; w < HORIZON; w++) {
    if (world.ending) break
    if (opts.untilSeasons !== undefined && world.seasonHistory.length >= opts.untilSeasons) break
    if (pendingBirthday(world)) answerBirthdayNeutral(world)
    drainLifeBeats(world)
    if (world.fork !== null && world.fork.answer === null) {
      drainLifeBeats(world)
      answerFork(world, opts.fork ?? ('continue' as ForkAnswer))
    }
    // ⚠ A DECLINED **FINAL** OFFER THROWS (`LAST_OFFER_NOT_A_QUESTION`) – the engine's way of saying
    // the winters have run out. "Decline" therefore means every offer that still has a next one.
    if (world.retirementOffer) {
      const takeIt = opts.retire !== 'decline' || world.retirementOffer.final
      answerRetirement(world, takeIt)
    }
    if (world.ending) break
    stepCareerWeek(world, rng, POLICY)
  }
  return { world, seed }
}

export const describe = (world: WorldState, seed: string) => {
  const last = world.seasonHistory.at(-1)
  const prev = world.seasonHistory.at(-2)
  const w = (e: any) => (e?.byTrack?.wta ? `#${e.byTrack.wta.endRank ?? '-'}/${e.byTrack.wta.points}` : 'unranked')
  return (
    `${seed} | ${world.ending ? ENDING_TITLE[world.ending.type] : 'still playing'}` +
    ` | wk ${world.week} age ${kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay)}` +
    ` | ${world.seasonHistory.length} seasons | ${w(prev)} -> ${w(last)}` +
    (world.ending ? ` | "${world.ending.detail}"` : '')
  )
}

/** ⭐ THE OWNER'S OWN FIGURES, PLACED AS CAREER STATE AND THEN JUDGED BY THE SHIPPED PREDICATE.
 *  The brief names the fall exactly – «#13 and 4,008 points to #59 and 1,584 points» – so the two
 *  season rows are written and `fallLeavingDue` is asked whether they are a fall. They are: 4,008 is
 *  over `fallPointsFloor` (200), 1,584 is under half of 4,008 (`fallPointsShare`), #59 is past double
 *  #13 (`fallRankFactor`) and 46 places is past 30 (`fallRankPlaces`). Nothing here reaches a
 *  threshold; it reaches the SEASON TABLE, which is the thing a career is made of. */
export function placeTheFall(world: WorldState): void {
  // ⚠ BY SEASON INDEX, NOT BY POSITION. `leavingViewOf` looks the two rows up as
  // `seasonIndexOf(world.week)` and that minus one – writing to `at(-1)`/`at(-2)` would be a
  // different pair the moment a season is missing from the history.
  const view = leavingViewOf(world)
  const row = (i: number) => world.seasonHistory.find((e) => e.seasonIndex === i)
  const last = row(view.seasonIndex)
  const prev = row(view.seasonIndex - 1)
  if (!last || !prev) throw new Error(`the fall needs seasons ${view.seasonIndex - 1} and ${view.seasonIndex} recorded`)
  const put = (row: any, endRank: number, points: number) => {
    row.endRank = endRank
    row.byTrack = { ...(row.byTrack ?? {}), wta: { ...(row.byTrack?.wta ?? { wins: 0, losses: 0 }), endRank, points } }
  }
  put(prev, 13, 4008)
  put(last, 59, 1584)
}

export async function save(world: WorldState, dir: string, name: string): Promise<string> {
  fs.mkdirSync(dir, { recursive: true })
  // ⚠⚠ ONE CAREER ID PER FIXTURE, AND IT COST A TAKE. Five of these are the SAME career – the fall's
  // pre-latch save and its four voices – so they carried one `careerId`, and `adoptAutosave` keys its
  // slot on exactly that: each install overwrote the last, and the film booted the same ended world
  // five times while asking for five different ones. The id is the save's IDENTITY on disk, not a
  // game rule; naming it after the fixture is what makes twelve careers twelve careers.
  world.careerId = `film-${name}`
  const bytes = await encodeExportFile(world)
  const path = `${dir}/${name}.tsave`
  fs.writeFileSync(path, bytes)
  return path
}

// --- the driver, when run directly ---------------------------------------------------------------
if (process.env.FIXTURE_RUN) {
  const mode = process.env.FIXTURE_RUN
  if (mode === 'build') {
    const dir = process.env.OUT || '/tmp/ending-fixtures'
    const made: string[] = []
    const emit = async (name: string, world: WorldState, seed: string) => {
      made.push(`  ${name.padEnd(12)} ${describe(world, seed)}`)
      await save(world, dir, name)
    }

    // --- the four the engine reaches on its own, on the seeds the scan found ---------------------
    for (const [name, index] of [
      ['plateau', Number(process.env.I_PLATEAU || 0)],
      ['natural', Number(process.env.I_NATURAL || 1)],
      ['bankruptcy', Number(process.env.I_BANKRUPT || 5)],
      ['injury', Number(process.env.I_INJURY || 66)],
    ] as const) {
      const { world, seed } = walk(index, { retire: 'accept' })
      if (world.ending?.type !== name) throw new Error(`[${name}] seed ${seed} latched ${world.ending?.type ?? 'nothing'}`)
      await emit(name, world, seed)
    }

    // --- the fork's other two answers, which are the player's and not the engine's ---------------
    for (const [name, answer] of [
      ['stopped', 'stop'],
      ['college', 'college'],
    ] as const) {
      const index = Number(process.env[`I_${name.toUpperCase()}`] || (name === 'stopped' ? 3 : 4))
      const { world, seed } = walk(index, { retire: 'accept', fork: answer as ForkAnswer })
      const want = name === 'stopped' ? 'stopped' : 'college'
      if (world.ending?.type !== want) throw new Error(`[${name}] seed ${seed} latched ${world.ending?.type ?? 'nothing'}`)
      await emit(name, world, seed)
    }

    // --- the fall: the owner's own two seasons, judged by the shipped predicate ------------------
    const fallIndex = Number(process.env.I_FALL || 53)
    const fallSeason = Number(process.env.S_FALL || 18)
    {
      const { world, seed } = walk(fallIndex, { retire: 'decline', untilSeasons: fallSeason + 1 })
      // ⭐⭐ THIS CAREER TAKES THE FALL DOOR ON ITS OWN. `resolveLeaving` runs inside the tick, so the
      // walk comes back with the ending already latched: the door opened and the 1% coin landed
      // without anybody arranging it. What the brief dictates is the two SEASON FIGURES – «#13 and
      // 4,008 points to #59 and 1,584» – so the latch is wound back one step, the owner's rows are
      // written into the season table, and the SAME resolver is asked again on the SAME coin. It
      // lands again because a coin is a pure function of (seed, door, season); nothing about the
      // chance, the gate or the composer is touched.
      const natural: WorldState['ending'] = (world as WorldState).ending
      if (!natural) throw new Error(`[fall] seed ${seed} never reached the door`)
      if (natural.type !== 'fall') throw new Error(`[fall] seed ${seed} ended as ${natural.type} instead`)
      // ...and the diary line the first latch wrote goes with it, or the record would name the
      // ending twice.
      const wasEvents = world.events.length
      world.events = world.events.filter((e) => !(e.type === 'milestone' && e.text.startsWith(ENDING_TITLE.fall)))
      if (world.events.length === wasEvents) throw new Error('[fall] the first latch left no line to wind back')
      ;(world as WorldState).ending = null
      world.retirementOffer = null
      placeTheFall(world)
      const view = leavingViewOf(world)
      if (!fallLeavingDue(view)) throw new Error(`[fall] the placed seasons are not a fall: ${JSON.stringify(view)}`)
      console.log(`  fall cast: ${seed} | season ${view.seasonIndex} | age ${view.ageYears} | #${view.prevEndRank}/${view.prevPoints} -> #${view.endRank}/${view.points}`)
      // the PRE-latch save: the same career one beat before the door, for the season table
      await emit('fall-pre', JSON.parse(JSON.stringify(world)), seed)
      // ...and the four voices, each a copy of the same world with her own temperament
      for (const [suffix, t] of [['', 'deep'], ['-fiery', 'fiery'], ['-quiet', 'quiet'], ['-sunny', 'sunny']] as const) {
        const copy: WorldState = JSON.parse(JSON.stringify(world))
        copy.temperament = t
        resolveLeaving(copy)
        if (copy.ending?.type !== 'fall') throw new Error(`[fall${suffix}] resolveLeaving latched ${copy.ending?.type ?? 'nothing'} – the coin did not land`)
        await emit(`fall${suffix}`, copy, seed)
      }
    }

    // --- the peak: a career that was at the top at twenty-five-plus, and whose coin landed -------
    if (!process.env.SKIP_PEAK) {
      const index = Number(process.env.I_PEAK || 8)
      const season = Number(process.env.S_PEAK || 12)
      const { world, seed } = walk(index, { retire: 'decline', untilSeasons: season + 1 })
      const view = leavingViewOf(world)
      // ⭐⭐ THE ENGINE USUALLY GETS THERE FIRST, AND THAT IS THE POINT. `resolveLeaving` runs at every
      // wrap inside the tick, so on the career this fixture is cast from the door opened and the coin
      // landed while the walk was still walking – the peak here is latched by the shipped resolver on
      // its own, with nothing staged. The explicit call below is only for the case where the walk
      // stopped ON the wrap before the resolver had run.
      const already: WorldState['ending'] = (world as WorldState).ending
      if (already && already.type !== 'peak') throw new Error(`[peak] seed ${seed} ended as ${already.type} instead`)
      if (!already) {
        if (!peakLeavingDue(view)) throw new Error(`[peak] the door is shut: ${JSON.stringify(view)}`)
        resolveLeaving(world)
      }
      const latched: WorldState['ending'] = (world as WorldState).ending
      if (latched?.type !== 'peak') throw new Error(`[peak] latched ${latched?.type ?? 'nothing'} – the coin did not land`)
      if (view.ageYears < 25 || !view.professional) throw new Error(`[peak] the brief wants 25+ on the paid table: ${JSON.stringify(view)}`)
      console.log(`  peak cast: ${seed} | age ${view.ageYears} | endRank #${view.endRank} | topTitle ${view.topTitleThisSeason} | latched by the walk: ${already ? 'yes' : 'no'}`)
      await emit('peak', world, seed)
    }

    console.log(`\nbuilt into ${dir}:`)
    for (const line of made) console.log(line)
  }
  if (mode === 'find-peak') {
    // Walk only the seeds whose peak coin lands, and report which of them had the DOOR open too.
    const pairs = (process.env.PAIRS || '').split(',').filter(Boolean)
    for (const pair of pairs) {
      const [seedPart, seasonPart] = pair.split('@s')
      const index = Number(seedPart.split('-').at(-1))
      const target = Number(seasonPart)
      const { world, seed } = walk(index, { retire: 'decline', untilSeasons: target + 1 })
      const view = leavingViewOf(world)
      const open = peakLeavingDue(view)
      console.log(
        `  ${pair.padEnd(26)} reached ${String(world.seasonHistory.length).padStart(3)} seasons` +
          ` | age ${String(view.ageYears).padStart(3)} | pro ${view.professional} | endRank ${String(view.endRank)}` +
          ` | topTitle ${view.topTitleThisSeason} | DOOR ${open ? 'OPEN' : 'shut'}` +
          ` | latched ${world.ending?.type ?? '-'}`,
      )
      void seed
    }
  }
}

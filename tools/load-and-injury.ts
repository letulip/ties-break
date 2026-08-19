// ⭐⭐ DOES PLAYING HERSELF INTO THE GROUND ACTUALLY INJURE HER? – the owner, 19.08: «тот, кто на
// износ играет точно должен получать больше, мы это не раз обсуждали».
//
// ⚠⚠ IT EXISTS BECAUSE TWO THROWAWAY PROBES DISAGREED ABOUT THE SAME NUMBER on 18.08 – one said her
// condition sits at 100 all season, the other said the median is 53 – and a balance question cannot be
// answered by whichever probe was written last. The disagreement had one cause worth stating: BOTH
// sampled `world.condition` once a week BEFORE the tick, which is the point of MAXIMUM recovery. The
// engine reads her condition when the match is played. So this samples where the engine reads.
//
//     npx vite-node tools/load-and-injury.ts [--careers 20] [--weeks 156]
import { createWorld, enterEvent, tickWeek, entryStatus, pendingKnock, decideKnock, skipTournament, closeTournament } from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { ECONOMY } from '../src/engine/economy'

const arg = (n: string, d: number) => { const v = Number(process.argv[process.argv.indexOf(`--${n}`) + 1]); return Number.isFinite(v) ? v : d }
const CAREERS = arg('careers', 20)
const WEEKS = arg('weeks', 156)

/** GREEDY = enter everything the door allows. CAREFUL = never enter under `restFloor` condition. */
// ⚠⚠ THE CONTRAST IS THE SEASON'S VOLUME, NOT A CONDITION FLOOR AT ENTRY – and the first draft used
// the floor, which measured nothing. An entry decision is taken at the START of a week, when she has
// recovered; she PLAYS at the end of it, tired. So "refuse to enter below condition 70" never fires:
// measured, greedy and floor-70 produced identical injury rates because the floor was never reached.
// The owner's question is about somebody who «хочет заявляться вообще на все турниры в календаре и
// играть их», so the arms are ALL of them against a capped schedule.
for (const [label, capPerSeason] of [['everything', 99], ['capped 18 ', 18], ['capped 12 ', 12]] as [string, number][]) {
  let played = 0, injuries = 0, weeksOut = 0, matches = 0
  const atMatch: number[] = []
  const drains: number[] = []
  for (let s = 0; s < CAREERS; s++) {
    const world: any = createWorld(`load-${s}`, DEFAULT_PROFILE)
    world.fundsCents = 500_000_00
    const rng = resumeMain(world.rngMain)
    let enteredThisSeason = 0
    for (let w = 0; w < WEEKS; w++) {
      if (pendingKnock(world)) decideKnock(world, 'rest')
      if (world.week % 52 === 0) enteredThisSeason = 0
      for (const e of world.season as any[]) {
        if (e.week <= world.week || world.entries.includes(e.id)) continue
        if (enteredThisSeason >= capPerSeason) continue
        if (entryStatus(world, e).level === 'blocked') continue
        try { enterEvent(world, e.id); enteredThisSeason++ } catch { /* refused */ }
      }
      tickWeek(world, rng)
      // ⭐ SAMPLED HERE: the tick has resolved the week and a pending tournament is about to be played,
      // so this is her condition AS THE ENGINE WILL READ IT for the match – not her recovered figure.
      if (world.pendingTournament) {
        atMatch.push(world.condition)
        const before = world.condition
        skipTournament(world)
        closeTournament(world)
        drains.push(before - world.condition)
        played++
      }
    }
    matches += (world.results ?? []).filter((r: any) => r.playerId === 'kid').length
    const hist = world.injuryHistory ?? []
    injuries += hist.length
    weeksOut += hist.reduce((a: number, h: any) => a + (h.weeksOut ?? 0), 0)
  }
  // ⚠⚠ THE VACUITY GUARD, AND IT IS HERE BECAUSE ITS ABSENCE COST FIVE MEASUREMENTS ON 18-19.08. A
  // probe called a function that does not exist (`playTournament`), a bare `catch` swallowed the
  // TypeError 49 times, and four numbers were reported off a career that had entered 73 tournaments
  // and PLAYED NONE - zero results, zero wins, zero losses. A run that measures nothing must say so
  // instead of printing a plausible table.
  if (matches === 0) throw new Error('she banked no results at all - this run played nothing, and its numbers mean nothing')
  atMatch.sort((a, b) => a - b)
  const q = (f: number) => atMatch.length ? atMatch[Math.floor(f * (atMatch.length - 1))] : NaN
  const meanFatigue = atMatch.reduce((a, c) => a + (100 - c), 0) / Math.max(1, atMatch.length)
  const a = ECONOMY.availability
  const implied = Math.min(a.injuryBaseChance + meanFatigue * a.injuryFatigueSlope, a.injuryChanceCap)
  drains.sort((a, b) => a - b)
  const dq = (f: number) => drains.length ? drains[Math.floor(f * (drains.length - 1))] : NaN
  console.log(
    `${label} DRAIN per tournament: p10 ${dq(0.1)} median ${dq(0.5)} p90 ${dq(0.9)} max ${dq(1)}  ·  recovery/week ${8}`,
  )
  console.log(
    `${label} results ${(matches / CAREERS).toFixed(0)}/career · played ${(played / CAREERS / (WEEKS / 52)).toFixed(1)}/season · condition AT THE MATCH p10 ${q(0.1)} median ${q(0.5)} p90 ${q(0.9)}` +
    ` · injuries ${(injuries / CAREERS / (WEEKS / 52)).toFixed(2)}/season · weeks out ${(weeksOut / CAREERS).toFixed(1)}/career` +
    ` · implied weekly risk ${(100 * implied).toFixed(2)}% (base ${(100 * a.injuryBaseChance).toFixed(2)}%)`,
  )
}

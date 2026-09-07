/**
 * r38-save-read – the owner's week-1115 career, read for the balance wave.
 *
 * ⚠ READ-ONLY LAW (tools/injury-saves-read.ts' own standing): the save is personal, handed in on the
 * command line, read through the game's own import door (`decodeExportFile`) and NEVER copied or
 * committed. What the repo keeps is the derived statistics printed here.
 *
 * Run: npx vite-node tools/r38-save-read.ts -- --save /path/career.tsave
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import {
  SKILL_KEYS,
  ageCurveOf,
  ageFactor,
  declineFactor,
  physicalMean,
} from '../src/engine/development'
import { startingSkills, withHeadStart } from '../src/engine/world/player'
import { kidAgeExact, kidAgeYears } from '../src/engine/world/age'
import { rankingFor, fieldProsOf, cohortIds } from '../src/engine/world/ladder'
import { brandSignalsOf, brandWeeklyGrossCents, brandMultipleX, brandGrossWorthCents, brandReachOf } from '../src/engine/world/brand'
import { fameFloorOf, fameShootMultOf } from '../src/engine/world/fame'
import { assetWeeklyIncomeCents, academyReputationOf, academyWeeklyIncomeCents, merchWeeklyIncomeCents } from '../src/engine/world/business'
import { ECONOMY } from '../src/engine/economy'
import { basePServe } from '../src/engine/match/point'
import { pMatchBo3 } from '../src/engine/match/closedForm'
import { kidMatchPlayer } from '../src/engine/world/player'
import { rivalMatchPlayer, rivalCondition } from '../src/engine/season/rival'
import type { MatchOptions, Surface } from '../src/engine/match/types'
import type { WorldState } from '../src/engine/world'

const args = process.argv.slice(2)
let savePath = ''
for (let i = 0; i < args.length; i++) if (args[i] === '--save' && args[i + 1]) savePath = args[++i]!
if (!savePath) {
  console.error('usage: npx vite-node tools/r38-save-read.ts -- --save /path/career.tsave')
  process.exit(1)
}

const money = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
const f2 = (n: number) => n.toFixed(2)
const padL = (s: string | number, n: number) => String(s).padStart(n)
const padR = (s: string | number, n: number) => String(s).padEnd(n)

async function main() {
  const world = (await decodeExportFile(new Uint8Array(readFileSync(savePath)))) as WorldState
  const w = world.week

  console.log('='.repeat(96))
  console.log(`A. HER – ${world.profile.kidName} ${world.profile.kidLastName}, week ${w}, schema v${world.schemaVersion}`)
  console.log('='.repeat(96))

  const age = kidAgeExact(w, world.profile.birthMonth, world.profile.birthDay)
  const ageY = kidAgeYears(w, world.profile.birthMonth, world.profile.birthDay)
  const birth = withHeadStart(startingSkills(world.seed, world.profile), world.profile.birthMonth)
  const now = world.skills
  const pot = world.potential
  const bounds = ageCurveOf(world.ageCurve, world.careerTotals?.weeksLostToInjury ?? 0)

  console.log(`age ${f2(age)} (${ageY}) · stored curve ${JSON.stringify(world.ageCurve)} · weeks lost ${world.careerTotals?.weeksLostToInjury}`)
  console.log(`effective curve after the injury pull: plateauStart ${f2(bounds.plateauStart)} declineStart ${f2(bounds.declineStart)}`)
  console.log(`years past declineStart: ${f2(age - bounds.declineStart)}`)
  console.log()
  console.log(padR('skill', 15) + padL('birth', 8) + padL('now', 9) + padL('potential', 11) + padL('now-birth', 11) + padL('%ofPot', 9) + padL('%ofBirth', 10))
  for (const k of SKILL_KEYS) {
    const b = birth[k], n = now[k], p = pot[k]
    console.log(
      padR(k, 15) + padL(f2(b), 8) + padL(f2(n), 9) + padL(f2(p), 11) +
      padL((n - b >= 0 ? '+' : '') + f2(n - b), 11) +
      padL(f2((n / p) * 100), 9) + padL(f2((n / b) * 100), 10),
    )
  }
  const pmNow = physicalMean(now)
  const pmBirth = physicalMean(birth)
  console.log()
  console.log(`physicalMean: birth ${f2(pmBirth)} · now ${f2(pmNow)} · peakPhysical ${f2(world.peakPhysical ?? NaN)} · now/peak ${f2((pmNow / (world.peakPhysical || 1)) * 100)}%`)
  console.log(`composure (never declines, gains veteranPoise): birth ${f2(birth.composure)} → ${f2(now.composure)} (potential ${f2(pot.composure)})`)
  console.log(`ECONOMY.development.floor = ${ECONOMY.development.floor} · declineRate ${ECONOMY.development.ageCurve.declineRate} · declineAccel ${ECONOMY.development.ageCurve.declineAccel}`)
  console.log()
  console.log('the decline clock, per year of her life (share of an attribute lost per week, and per season):')
  console.log(padR('age', 7) + padL('ageFactor', 11) + padL('decline/wk', 12) + padL('lost/season', 13) + padL('serve after', 13))
  let serve = birth.serve
  for (let a = Math.floor(bounds.declineStart); a <= Math.ceil(age) + 5; a++) {
    const d = declineFactor(a, bounds)
    const perSeason = 1 - Math.pow(1 - d, WEEKS_PER_YEAR)
    serve = serve * Math.pow(1 - d, WEEKS_PER_YEAR)
    console.log(padR(a, 7) + padL(f2(ageFactor(a, bounds)), 11) + padL(d.toFixed(5), 12) + padL(f2(perSeason * 100) + '%', 13) + padL(f2(Math.max(ECONOMY.development.floor, serve)), 13))
  }

  console.log()
  console.log('='.repeat(96))
  console.log('B. THE FIELD – who is above her, and what they are made of')
  console.log('='.repeat(96))

  const cohort = new Map((world.cohort ?? []).map((p: any) => [p.id, p]))
  const pros = new Map(fieldProsOf(world).map((p: any) => [p.id, p]))
  console.log(`cohort ${cohort.size} · fieldPros ${pros.size} · cohortIds ${cohortIds(world).length}`)
  const proSample = fieldProsOf(world)[0]
  console.log('fieldPro sample:', JSON.stringify(proSample))

  for (const track of ['wta', 'itf'] as const) {
    const table = rankingFor(world, track)
    console.log()
    console.log(`--- ${track.toUpperCase()} table, top 12 (+ her row) · size ${table.length} ---`)
    console.log(padR('#', 4) + padR('id', 12) + padR('name', 24) + padL('points', 9) + padL('age', 5) + padL('serve', 7) + padL('ret', 7) + padL('comp', 7) + padL('stam', 7) + padL('grnd', 7) + padL('mean4', 8))
    const rows = [...table.slice(0, 12), ...table.filter((r) => r.playerId === 'kid')]
    for (const r of rows) {
      const c: any = cohort.get(r.playerId)
      const p: any = pros.get(r.playerId)
      const isKid = r.playerId === 'kid'
      const s: any = isKid ? now : (c ?? p ?? null)
      const nm = isKid ? `${world.profile.kidName} ${world.profile.kidLastName}` : (c?.name ?? p?.name ?? '?')
      const ag = isKid ? f2(age) : String(c?.ageYears ?? p?.ageYears ?? '?')
      const cell = (v: any) => (typeof v === 'number' ? f2(v) : '-')
      const parts = s ? [s.serve, s.ret, s.stamina, s.groundstrokes].filter((v: any) => typeof v === 'number') : []
      const mean4 = parts.length ? f2(parts.reduce((a: number, b: number) => a + b, 0) / parts.length) : '-'
      console.log(
        padR(r.rank, 4) + padR(r.playerId, 12) + padR(nm.slice(0, 23), 24) + padL(Math.round(r.points), 9) + padL(ag, 5) +
        padL(cell(s?.serve), 7) + padL(cell(s?.ret), 7) + padL(cell(s?.composure), 7) + padL(cell(s?.stamina), 7) + padL(cell(s?.groundstrokes), 7) + padL(mean4, 8),
      )
    }
  }

  console.log()
  console.log('='.repeat(96))
  console.log('C. THE BRAND – what it earns, what it is worth, and why both move')
  console.log('='.repeat(96))

  const merchItem = (ECONOMY.shop.catalogue as unknown as { id: string; entryCents: number; earningsMultipleX?: number }[])
    .find((i) => i.id === 'merch-brand')
  const baseX = merchItem?.earningsMultipleX ?? 14
  console.log(`merch rung: entry ${money(merchItem?.entryCents ?? 0)} · earningsMultipleX ${baseX} · fame halfLifeWeeks ${ECONOMY.fame.halfLifeWeeks}`)
  console.log(`value band: unknownX ${ECONOMY.business.merch.value.unknownX} · maxX ${ECONOMY.business.merch.value.maxX}`)
  console.log()
  console.log(padR('week', 7) + padL('fame', 8) + padL('strength', 10) + padL('reach', 8) + padL('floor', 8) + padL('shootMult', 10) + padL('gross/wk', 11) + padL('multX', 8) + padL('worth', 14))
  const weeks = [w - 208, w - 156, w - 104, w - 52, w - 26, w]
  for (const ww of weeks) {
    if (ww < 1) continue
    const sig = brandSignalsOf(world, ww)
    console.log(
      padR(ww, 7) + padL(f2(sig.fame), 8) + padL(f2(sig.strength), 10) + padL(f2(brandReachOf(sig)), 8) +
      padL(f2(fameFloorOf(world, ww)), 8) + padL(f2(fameShootMultOf(world, ww)), 10) +
      padL(money(brandWeeklyGrossCents(sig)), 11) + padL(f2(brandMultipleX(sig, baseX)), 8) + padL(money(brandGrossWorthCents(sig, baseX)), 14),
    )
  }
  console.log()
  const stored = (world.assets ?? []).find((a: any) => a.id === 'merch-brand') as any
  console.log(`stored merch valueCents ${money(stored?.valueCents ?? 0)} (paid ${money(stored?.paidCents ?? 0)}, bought w${stored?.boughtWeek})`)
  console.log(`merch weekly gross now ${money(merchWeeklyIncomeCents(world))} · academy weekly ${money(academyWeeklyIncomeCents(world))} · academy reputation ${f2(academyReputationOf(world))}`)
  console.log()
  console.log('owned shelf:')
  for (const a of (world.assets ?? []) as any[]) {
    console.log('  ' + padR(a.id, 18) + padL('w' + a.boughtWeek, 8) + padL(money(a.paidCents), 14) + padL(money(a.valueCents), 14) + padL(money(assetWeeklyIncomeCents(world, a.id)) + '/wk', 12))
  }

  console.log()
  console.log('='.repeat(96))
  console.log('D. HER AGAINST THE NUMBER THREE – what the table is made of')
  console.log('='.repeat(96))

  const wta = rankingFor(world, 'wta')
  const three = wta[2]!
  const rival: any = pros.get(three.playerId) ?? cohort.get(three.playerId)
  console.log(`#3 is ${rival?.name} (${three.playerId}), ${rival?.ageYears} years old, ${Math.round(three.points)} points, tier ${rival?.strengthTier ?? '-'}`)
  console.log()
  const her = kidMatchPlayer(world as any)
  her.age = age
  const him = rivalMatchPlayer(rival, 'hard', ECONOMY.condition.max)
  console.log(padR('', 16) + padL('Alice', 10) + padL(String(rival?.name ?? '#3').slice(0, 16), 18) + padL('gap', 10))
  for (const k of ['serve', 'ret', 'composure', 'stamina', 'groundstrokes'] as const) {
    const a = (her as any)[k] as number
    const b = (him as any)[k] as number
    console.log(padR(k, 16) + padL(f2(a), 10) + padL(f2(b), 18) + padL((a - b >= 0 ? '+' : '') + f2(a - b), 10))
  }
  console.log(padR('age', 16) + padL(f2(age), 10) + padL(String(rival?.ageYears), 18))
  console.log()
  for (const surface of ['hard', 'clay', 'grass'] as Surface[]) {
    const opts: MatchOptions = { surface, tour: 'wta', seed: 'probe' }
    const pA = basePServe(her, him, opts)
    const pB = basePServe(him, her, opts)
    console.log(`${padR(surface, 7)} her hold ${f2(pA * 100)}%  ·  hers-to-face ${f2(pB * 100)}%  ·  closed-form match ${f2(pMatchBo3(pA, pB) * 100)}%`)
  }

  console.log()
  console.log('='.repeat(96))
  console.log('E. THE AGE CENSUS – who is actually up there')
  console.log('='.repeat(96))
  const top = wta.slice(0, 100)
  const ages: number[] = []
  for (const r of top) {
    const p: any = pros.get(r.playerId) ?? cohort.get(r.playerId)
    if (typeof p?.ageYears === 'number') ages.push(p.ageYears)
  }
  ages.sort((a, b) => a - b)
  const mean = ages.reduce((a, b) => a + b, 0) / (ages.length || 1)
  const older = (n: number) => ages.filter((a) => a >= n).length
  console.log(`WTA top 100: ${ages.length} aged rows · mean age ${f2(mean)} · min ${ages[0]} · max ${ages[ages.length - 1]}`)
  console.log(`aged 30+: ${older(30)} · 32+: ${older(32)} · 34+: ${older(34)} · 35+: ${older(35)} · 36+: ${older(36)}`)
  const herRank = wta.find((r) => r.playerId === 'kid')?.rank
  console.log(`she is ${f2(age)} and ranked #${herRank} of ${wta.length}`)
  const bands: Record<string, number[]> = {}
  for (const r of wta.slice(0, 300)) {
    const p: any = pros.get(r.playerId) ?? cohort.get(r.playerId)
    if (typeof p?.ageYears !== 'number') continue
    const band = p.ageYears >= 34 ? '34+' : p.ageYears >= 30 ? '30-33' : p.ageYears >= 26 ? '26-29' : p.ageYears >= 22 ? '22-25' : '<22'
    ;(bands[band] ??= []).push(r.rank)
  }
  console.log()
  console.log(padR('age band', 12) + padL('rows in top300', 16) + padL('best rank', 12) + padL('median rank', 14))
  for (const b of ['<22', '22-25', '26-29', '30-33', '34+']) {
    const rs = (bands[b] ?? []).sort((x, y) => x - y)
    if (!rs.length) { console.log(padR(b, 12) + padL(0, 16)); continue }
    console.log(padR(b, 12) + padL(rs.length, 16) + padL(rs[0]!, 12) + padL(rs[Math.floor(rs.length / 2)]!, 14))
  }
  console.log()
  console.log(`her condition ${f2(world.condition ?? 0)} · rivalCondition sample for #3 ${f2(rivalCondition(world.results, three.playerId, w))}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

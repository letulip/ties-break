/**
 * r39-save-read – the owner's Ines career (week 832), read for round 39.
 *
 * ⚠ READ-ONLY LAW (tools/injury-saves-read.ts' own standing): the save is personal, handed in on the
 * command line, read through the game's own import door (`decodeExportFile`) and NEVER copied or
 * committed. What the repo keeps is the derived statistics printed here.
 *
 * Run: npx vite-node tools/r39-save-read.ts -- --save /path/career.tsave [--shape]
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { physicalMean } from '../src/engine/development'
import { kidAgeExact } from '../src/engine/world/age'
import { rankingFor } from '../src/engine/world/ladder'
import { brandGrossWorthCents, brandReachOf, brandSignalsOf } from '../src/engine/world/brand'
import { rampedWorthCents, worthRampHalfLife, academyReputationOf } from '../src/engine/world/assets'
import { academyWeeklyIncomeCents, merchWeeklyIncomeCents } from '../src/engine/world/business'
import { supportedTravelCents, travelCostFor } from '../src/engine/world/sponsors'
import { coachDeclineNote } from '../src/engine/world/coachMarket'
import { ECONOMY } from '../src/engine/economy'
import type { WorldState } from '../src/engine/world'

const args = process.argv.slice(2)
let savePath = ''
const shape = args.includes('--shape')
for (let i = 0; i < args.length; i++) if (args[i] === '--save' && args[i + 1]) savePath = args[++i]!
if (!savePath) {
  console.error('usage: npx vite-node tools/r39-save-read.ts -- --save /path/career.tsave')
  process.exit(1)
}

const world = (await decodeExportFile(new Uint8Array(readFileSync(savePath)))) as unknown as Record<string, unknown>

const kind = (v: unknown): string => {
  if (Array.isArray(v)) return `array[${v.length}]${v.length ? ' of ' + kind(v[0]) : ''}`
  if (v === null) return 'null'
  if (typeof v === 'object') return `{${Object.keys(v as object).slice(0, 14).join(', ')}}`
  return `${typeof v} = ${JSON.stringify(v)?.slice(0, 60)}`
}

if (shape) {
  console.log('WORLD KEYS')
  for (const k of Object.keys(world).sort()) console.log(`  ${k.padEnd(26)} ${kind(world[k])}`)
}

const peek = args.includes('--peek')
if (peek) {
  const w = world as Record<string, any>
  const show = (label: string, v: unknown) => console.log(`\n--- ${label} ---\n` + JSON.stringify(v, null, 1).slice(0, 1400))
  show('assets (all 16)', w.assets)
  show('offers[0..2]', (w.offers as unknown[]).slice(0, 3))
  show('offer kinds x state', (w.offers as any[]).reduce((a: Record<string, number>, o: any) => { const k = `${o.kind}/${o.state}`; a[k] = (a[k] ?? 0) + 1; return a }, {}))
  show('birthdays', w.birthdays)
  show('results[0..2]', (w.results as unknown[]).slice(0, 3))
  show('events sample types', (w.events as any[]).reduce((a: Record<string, number>, e: any) => { a[e.type] = (a[e.type] ?? 0) + 1; return a }, {}))
  show('trophiesByTier', w.trophiesByTier)
  show('seasonHistory last 5', (w.seasonHistory as unknown[]).slice(-5))
  show('milestones last 6', (w.milestones as unknown[]).slice(-6))
}

if (args.includes('--peek2')) {
  const w = world as Record<string, any>
  const show = (label: string, v: unknown) => console.log(`\n--- ${label} ---\n` + JSON.stringify(v, null, 1).slice(0, 1600))
  show('trophies: slam + wta + w100', { slam: w.trophiesByTier.slam, wta500: w.trophiesByTier.wta500, wta250: w.trophiesByTier.wta250, wta125: w.trophiesByTier.wta125, w100: w.trophiesByTier.w100 })
  show('seasonHistory last 6', (w.seasonHistory as unknown[]).slice(-6))
  console.log('\n--- match events, last 8 ---')
  for (const e of (w.events as any[]).filter((e) => e.type === 'match').slice(-8)) console.log(`  w${e.week}  ${e.text}`)
  show('fork', w.fork)
  show('lastSeasonSummary', w.lastSeasonSummary)
  console.log('\noneMoreYearCount:', w.oneMoreYearCount, '| kidRank', w.kidRank, '| wta', w.kidRankWta, '| week', w.week)
}

if (args.includes('--matches')) {
  const w = world as Record<string, any>
  const ms = (w.events as any[]).filter((e) => e.type === 'match')
  console.log(`match events: ${ms.length}, weeks ${ms[0]?.week}..${ms[ms.length - 1]?.week}`)
  for (const e of ms.slice(-12)) console.log(`  w${e.week}  ${JSON.stringify(e).slice(0, 220)}`)
  console.log('\nseasonHistory compact: idx  wtaEndRank  W-L  points')
  for (const s of w.seasonHistory as any[]) {
    console.log(`  ${String(s.seasonIndex).padStart(2)}  wta#${String(s.byTrack?.wta?.endRank ?? '-').padStart(4)}  ${String(s.wins)}-${s.losses}  ${s.points}`)
  }
}

// =================================================================================================
// THE ROUND-39 REPORT – one pass, numbered by his own items.
// =================================================================================================
if (args.includes('--report')) {
  const w = world as unknown as WorldState
  const any = world as Record<string, any>
  const money = (c: number) => `$${(c / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  const wta = rankingFor(w, 'wta')
  const rankOf = new Map(wta.map((r) => [r.playerId, r.rank]))
  const age = kidAgeExact(w.week, w.profile.birthMonth, w.profile.birthDay)

  console.log(`INES, week ${w.week}, age ${age.toFixed(1)} · WTA #${any.kidRankWta} · funds ${money(any.fundsCents)}`)

  console.log('\n#3 CONTRACT TERMS – every signed deal, and how long it ran')
  console.log('  kind  brand                from   until  seasons  weeks   her WTA rank that season')
  for (const o of (any.offers as any[]).filter((x) => x.state === 'signed').sort((a, b) => a.fromWeek - b.fromWeek)) {
    const seasons = o.terms?.seasons ?? '-'
    const weeks = (o.untilWeek ?? 0) - (o.fromWeek ?? 0)
    const si = Math.floor((o.fromWeek ?? 0) / WEEKS_PER_YEAR)
    const hist = (any.seasonHistory as any[]).find((s) => s.seasonIndex === si)
    const rk = hist?.byTrack?.wta?.endRank ?? '-'
    console.log(`  ${String(o.kind).padEnd(5)} ${String(o.terms?.brand ?? '').padEnd(20)} ${String(o.fromWeek).padStart(5)} ${String(o.untilWeek).padStart(6)} ${String(seasons).padStart(8)} ${String(weeks).padStart(6)}   wta#${rk}`)
  }

  console.log('\n#5 / #11 THE BRAND AND THE ACADEMY')
  const brand = (any.assets as any[]).find((a) => a.id === 'merch-brand')
  const held = w.week - brand.boughtWeek
  const sig = brandSignalsOf(w)
  const merchItem = ECONOMY.shop.catalogue.find((i) => i.id === 'merch-brand') as { earningsMultipleX?: number } | undefined
  const baseX = merchItem?.earningsMultipleX ?? 14
  const derived = brandGrossWorthCents(sig, baseX)
  const hl = worthRampHalfLife(sig.fame, ECONOMY.shop.worthRamp.medianFame)
  console.log(`  brand  paid ${money(brand.paidCents)} at week ${brand.boughtWeek} · held ${held} weeks · shown ${money(brand.valueCents)}`)
  console.log(`  derived (where the ramp is heading) ${money(derived)} · ramp half-life ${hl.toFixed(1)} weeks · reach ${brandReachOf(sig).toFixed(1)} · fame ${sig.fame.toFixed(1)}`)
  console.log('  ⚠ THE RE-BUY CURVE – what a brand bought TODAY for $250,000 would be worth:')
  for (const n of [1, 5, 13, 26, 52, 104, 235]) {
    console.log(`      after ${String(n).padStart(3)} weeks  ${money(rampedWorthCents(25_000_00, derived, n, hl))}`)
  }
  const academyRows = (any.assets as any[]).filter((a) => String(a.id).startsWith('academy-'))
  const academyValue = academyRows.reduce((s, a) => s + a.valueCents, 0)
  const academyPaid = academyRows.reduce((s, a) => s + a.paidCents, 0)
  console.log(`  academy  ${academyRows.length} rungs · paid ${money(academyPaid)} · worth ${money(academyValue)} · reputation ${academyReputationOf(w).toFixed(2)}`)
  console.log(`  WEEKLY INCOME  brand ${money(merchWeeklyIncomeCents(w))}  ·  academy ${money(academyWeeklyIncomeCents(w))}`)
  console.log(`  worth ratio brand/academy ${(brand.valueCents / academyValue).toFixed(2)}x · income ratio ${(merchWeeklyIncomeCents(w) / Math.max(1, academyWeeklyIncomeCents(w))).toFixed(2)}x`)

  console.log('\n#6 SPONSORS – every ad deal by season, brand named')
  for (const o of (any.offers as any[]).filter((x) => x.kind === 'ad').sort((a, b) => a.week - b.week)) {
    console.log(`  w${String(o.week).padStart(4)}  season ${String(Math.floor(o.week / WEEKS_PER_YEAR)).padStart(2)}  ${String(o.state).padEnd(8)} ${String(o.terms?.brand ?? '?').padEnd(22)} ${money(o.terms?.feeCents ?? o.terms?.perSeasonCents ?? 0)}`)
  }

  console.log('\n#7 TITLES – the slam, and what she kept winning after it')
  for (const [tier, t] of Object.entries(any.trophiesByTier as Record<string, any>)) {
    if (!t.titles.length && !t.finals.length) continue
    console.log(`  ${tier.padEnd(8)} titles ${JSON.stringify(t.titles)}  finals ${JSON.stringify(t.finals)}`)
  }

  console.log('\n#10 WHO SHE LOSES TO – every logged match, opponent ranked NOW')
  const ms = (any.events as any[]).filter((e) => e.type === 'match' && e.match)
  let wins = 0, losses = 0
  const upsets: string[] = []
  for (const e of ms) {
    const m = e.match
    const oppId = m.aId === 'kid' ? m.bId : m.aId
    const won = m.winnerId === 'kid'
    if (won) wins++
    else {
      losses++
      const r = rankOf.get(oppId)
      if (r !== undefined && r > 50) upsets.push(`w${e.week} lost to #${r}`)
    }
  }
  console.log(`  logged ${ms.length} matches from week ${ms[0]?.week} · ${wins} won, ${losses} lost (${((wins / Math.max(1, ms.length)) * 100).toFixed(1)}%)`)
  console.log(`  losses to an opponent currently outside the top 50: ${upsets.length} of ${losses}`)
  for (const u of upsets) console.log(`      ${u}`)

  console.log('\n#12 THE PLANE')
  const plane = (any.assets as any[]).find((a) => String(a.id).startsWith('plane'))
  console.log(`  owns ${plane?.id} · paid ${money(plane?.paidCents ?? 0)} · planeTravelShare ${ECONOMY.shop.planeTravelShare}`)
  const nextEvents = (any.season as any[]).slice(0, 6)
  for (const ev of nextEvents) {
    console.log(`      w${ev.week} ${String(ev.tier).padEnd(7)} sticker ${money(ev.travelCostCents)} → supported ${money(supportedTravelCents(w, ev))} → after own plane ${money(travelCostFor(w, ev))}`)
  }

  console.log('\n#13 THE COACH CARD')
  console.log(`  "${coachDeclineNote(w).replace(/\n/g, ' | ')}"`)
  console.log(`  age ${age.toFixed(1)} · physicalMean ${physicalMean(w.skills).toFixed(2)} of peak ${any.peakPhysical.toFixed(2)} = ${((physicalMean(w.skills) / any.peakPhysical) * 100).toFixed(1)}%`)
}

if (args.includes('--extra')) {
  const w = world as unknown as WorldState
  const any = world as Record<string, any>
  console.log('--- one ad offer, whole terms ---')
  console.log(JSON.stringify((any.offers as any[]).filter((o) => o.kind === 'ad').slice(-1)[0], null, 1))
  console.log('\n--- #10 the rank of every opponent that beat her ---')
  const wta = rankingFor(w, 'wta')
  const rankOf = new Map(wta.map((r) => [r.playerId, r.rank]))
  const beat: number[] = []
  for (const e of (any.events as any[]).filter((e) => e.type === 'match' && e.match)) {
    const m = e.match
    if (m.winnerId === 'kid') continue
    const oppId = m.aId === 'kid' ? m.bId : m.aId
    const r = rankOf.get(oppId)
    if (r !== undefined) beat.push(r)
  }
  beat.sort((a, b) => a - b)
  console.log(`  ${beat.length} of her losses map to a ranked opponent`)
  console.log(`  best #${beat[0]} · median #${beat[Math.floor(beat.length / 2)]} · WORST #${beat[beat.length - 1]}`)
  const bands = { 'top 10': 0, '11-25': 0, '26-50': 0, '51-100': 0, 'below 100': 0 }
  for (const r of beat) {
    if (r <= 10) bands['top 10']++
    else if (r <= 25) bands['11-25']++
    else if (r <= 50) bands['26-50']++
    else if (r <= 100) bands['51-100']++
    else bands['below 100']++
  }
  console.log('  ' + Object.entries(bands).map(([k, v]) => `${k}: ${v}`).join(' · '))
  console.log('\n--- #7 how many slam events has she even entered? ---')
  const slamWeeks = (any.season as any[]).filter((e) => e.tier === 'slam').map((e) => e.week)
  console.log(`  slam events on the current calendar: ${slamWeeks.length} at weeks ${slamWeeks.join(', ')}`)
  const slamMatches = (any.events as any[]).filter((e) => e.type === 'match' && e.match && String(e.match.seed ?? '').includes('slam'))
  console.log(`  logged slam matches since week 634: ${slamMatches.length}`)
  for (const e of slamMatches) console.log(`      w${e.week} ${e.text}`)
}

if (args.includes('--extra2')) {
  const w = world as unknown as WorldState
  const any = world as Record<string, any>
  const money = (c: number) => `$${(c / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  console.log('#6 / #8 EVERY AD DEAL – category, cash and term')
  for (const o of (any.offers as any[]).filter((x) => x.kind === 'ad').sort((a, b) => a.week - b.week)) {
    const t = o.terms ?? {}
    console.log('  w' + String(o.week).padStart(4) + '  s' + String(Math.floor(o.week / WEEKS_PER_YEAR)).padStart(2) +
      '  ' + String(o.state).padEnd(8) + String(t.category ?? '?').padEnd(10) + String(t.brand ?? '?').padEnd(20) +
      money(t.cashCents ?? 0).padStart(12) + '  ' + (t.termYears ?? '-') + 'y')
  }
  console.log('\n#8 KIT DEALS – the same, for comparison')
  for (const o of (any.offers as any[]).filter((x) => x.kind === 'kit' && x.state === 'signed').sort((a, b) => a.week - b.week)) {
    const t = o.terms ?? {}
    console.log('  w' + String(o.week).padStart(4) + '  ' + String(t.tier ?? '?').padEnd(9) + String(t.brand ?? '?').padEnd(20) +
      ' allowance ' + money(t.kitAllowanceCents ?? 0).padStart(10) + '  travelShare ' + (t.travelShare ?? 0) + '  ' + (t.seasons ?? '-') + ' seasons')
  }
  console.log('\n#10 THE RECENT WINDOW – the least confounded read (ranks are current)')
  const wta = rankingFor(w, 'wta')
  const rankOf = new Map(wta.map((r) => [r.playerId, r.rank]))
  for (const since of [634, 750, 790, 802]) {
    let won = 0, lost = 0, lostBelow50 = 0
    for (const e of (any.events as any[]).filter((e) => e.type === 'match' && e.match && e.week >= since)) {
      const m = e.match
      if (m.winnerId === 'kid') { won++; continue }
      lost++
      const r = rankOf.get(m.aId === 'kid' ? m.bId : m.aId)
      if (r !== undefined && r > 50) lostBelow50++
    }
    console.log(`  from week ${since} (${w.week - since} weeks): ${won}W ${lost}L · ${lostBelow50} losses to a player now outside the top 50 (${lost ? ((lostBelow50 / lost) * 100).toFixed(0) : 0}% of losses)`)
  }
}

if (args.includes('--academy')) {
  const w = world as unknown as WorldState
  const money = (c: number) => `$${(c / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  const { assetWeeklyIncomeCents } = await import('../src/engine/world/business')
  for (const id of ['academy-land', 'academy-courts', 'academy-building', 'academy-staff', 'merch-brand']) {
    console.log(`  ${id.padEnd(17)} ${money(assetWeeklyIncomeCents(w, id)).padStart(10)}/wk`)
  }
  console.log(`  academy total     ${money(academyWeeklyIncomeCents(w)).padStart(10)}/wk`)
}

// #7 + #10 – THE SKILL-FORMULA AUDIT (owner, 08.09: «корректно ли работает наша формула по скиллам…
// как они относятся к остальным соперникам, особенно ниже 50»). Closed-form p(win) on her logged
// matches, expected wins against actual. ⚠ Skills and ranks are TODAY's, matches are up to 198
// weeks old – the headline window is the recent one, where that confound is smallest.
if (args.includes('--audit')) {
  const w = world as unknown as WorldState
  const any = world as Record<string, any>
  const f1 = (n: number) => n.toFixed(1)
  const { kidMatchPlayer } = await import('../src/engine/world/player')
  const { rivalMatchPlayer } = await import('../src/engine/season/rival')
  const { basePServe } = await import('../src/engine/match/point')
  const { pMatchBo3 } = await import('../src/engine/match/closedForm')
  const { fieldProsOf } = await import('../src/engine/world/ladder')

  const pros = new Map(fieldProsOf(w).map((p: any) => [p.id, p]))
  const cohort = new Map((any.cohort as any[]).map((p) => [p.id, p]))
  const wta = rankingFor(w, 'wta')
  const rankOf = new Map(wta.map((r) => [r.playerId, r.rank]))
  const her = kidMatchPlayer(w as any)

  const tierOf = (seed: string) => (seed.match(/-w\d+-([a-z0-9]+):/) ?? [])[1] ?? '?'
  type Row = { week: number; opp: any; rank: number | undefined; tier: string; won: boolean; p: number }
  const rows: Row[] = []
  for (const e of (any.events as any[]).filter((e) => e.type === 'match' && e.match?.seed)) {
    const m = e.match
    const oppId = m.aId === 'kid' ? m.bId : m.aId
    const opp = pros.get(oppId) ?? cohort.get(oppId)
    if (!opp) continue
    const him = rivalMatchPlayer(opp, 'hard', ECONOMY.condition.max)
    const pA = basePServe(her, him, { surface: 'hard', tour: 'wta', seed: 'audit' } as any)
    const pB = basePServe(him, her, { surface: 'hard', tour: 'wta', seed: 'audit' } as any)
    rows.push({ week: e.week, opp, rank: rankOf.get(oppId), tier: tierOf(m.seed), won: m.winnerId === 'kid', p: pMatchBo3(pA, pB) })
  }

  const agg = (rs: Row[], label: string) => {
    if (!rs.length) { console.log(`  ${label.padEnd(30)} (none)`); return }
    const exp = rs.reduce((s, r) => s + r.p, 0)
    const act = rs.filter((r) => r.won).length
    console.log(`  ${label.padEnd(30)} n=${String(rs.length).padStart(3)}  model expects ${f1(exp)} wins (${f1((exp / rs.length) * 100)}%)  actual ${act} (${f1((act / rs.length) * 100)}%)  gap ${f1(act - exp)}`)
  }

  for (const since of [634, 790]) {
    const win = rows.filter((r) => r.week >= since)
    console.log(`\nWINDOW from week ${since} (${w.week - since} weeks, ${win.length} matches)`)
    agg(win, 'ALL')
    agg(win.filter((r) => (r.rank ?? 999) <= 10), 'vs top 10 (now)')
    agg(win.filter((r) => (r.rank ?? 999) > 10 && (r.rank ?? 999) <= 50), 'vs 11-50')
    agg(win.filter((r) => (r.rank ?? 0) > 50), 'vs outside top 50')
    agg(win.filter((r) => r.tier === 'slam'), 'slams only')
    agg(win.filter((r) => r.tier === 'wta1000'), 'wta1000 only')
  }

  console.log('\nHER SKILLS AGAINST THE BANDS (current cohort+field, mean per attribute)')
  const bands: [string, (r: number) => boolean][] = [['top 10', (r) => r <= 10], ['11-25', (r) => r > 10 && r <= 25], ['26-50', (r) => r > 25 && r <= 50], ['51-100', (r) => r > 50 && r <= 100]]
  const keys = ['serve', 'ret', 'composure', 'stamina', 'groundstrokes'] as const
  console.log('  ' + 'band'.padEnd(9) + keys.map((k) => k.padStart(8)).join('') + '  p(win) closed-form vs band-average player')
  for (const [label, fits] of bands) {
    const members = wta.filter((r) => fits(r.rank) && r.playerId !== 'kid').map((r) => pros.get(r.playerId) ?? cohort.get(r.playerId)).filter(Boolean)
    if (!members.length) continue
    const avg: any = {}
    for (const k of keys) avg[k] = members.reduce((s: number, m: any) => s + (m[k] ?? 0), 0) / members.length
    avg.id = 'avg'; avg.name = 'avg'; avg.ageYears = 26; avg.growth = 0
    const him = rivalMatchPlayer(avg, 'hard', ECONOMY.condition.max)
    const pA = basePServe(her, him, { surface: 'hard', tour: 'wta', seed: 'audit' } as any)
    const pB = basePServe(him, her, { surface: 'hard', tour: 'wta', seed: 'audit' } as any)
    console.log('  ' + label.padEnd(9) + keys.map((k) => avg[k].toFixed(1).padStart(8)).join('') + `  ${ (pMatchBo3(pA, pB) * 100).toFixed(1)}%`)
  }
  console.log('  ' + 'HER'.padEnd(9) + keys.map((k) => (w.skills as any)[k].toFixed(1).padStart(8)).join(''))
}

// #16 (owner, 08.09) – IN-MATCH RETIREMENTS ON HIS OWN CAREERS: hers against her opponents'.
// ⚠ WHAT THE SAVE CAN AND CANNOT SAY: the diary logs HER matches only, so this counts retirements
// in matches SHE played. Nothing here can see an AI-vs-AI retirement – that sample does not exist
// on a save. The design anchor to hold the numbers against: RETIRE_K is calibrated so ~2.73% of
// matches end in a retirement by EITHER side (match/point.ts, PLOS ONE corpus).
if (args.includes('--retire')) {
  const any = world as Record<string, any>
  const ms = (any.events as any[]).filter((e) => e.type === 'match' && e.match)
  let hers = 0, theirs = 0
  const rows: string[] = []
  for (const e of ms) {
    const r = e.match.retiredId
    if (r === undefined || r === null) continue
    const mine = r === 'kid'
    if (mine) hers++
    else theirs++
    rows.push(`      w${e.week}  ${mine ? 'SHE stopped' : 'opponent stopped'}  ${String(e.text).slice(0, 78)}`)
  }
  const n = ms.length
  const total = hers + theirs
  console.log(`  logged matches ${n} (weeks ${ms[0]?.week}..${ms[ms.length - 1]?.week})`)
  console.log(`  retirements: ${total} of ${n} = ${((total / Math.max(1, n)) * 100).toFixed(2)}% of her matches (design anchor 2.73% either side)`)
  console.log(`    hers      ${hers}  (${((hers / Math.max(1, n)) * 100).toFixed(2)}% of matches)`)
  console.log(`    opponents ${theirs}  (${((theirs / Math.max(1, n)) * 100).toFixed(2)}% of matches)`)
  for (const r of rows) console.log(r)
}

// THE TWO TENURE GATES ON A REAL CAREER (owner, 08.09: «всё именно так и есть» - three of four).
// Both the shipped 8-year capstone and wave EF's lifetime letter read `capstoneSeasonsOf`, so this
// prints what his own careers actually banked against them.
if (args.includes('--tenure')) {
  const w = world as unknown as WorldState
  const any = world as Record<string, any>
  const { capstoneSeasonsOf } = await import('../src/engine/world/sponsors')
  const seasons = capstoneSeasonsOf(w)
  const slams = (any.trophiesByTier?.slam?.titles ?? []).length
  console.log(`  ${any.profile.kidName} ${any.profile.kidLastName}, week ${w.week}`)
  console.log(`  seasons ENDED in the wta top 10: ${seasons}   slam titles: ${slams}`)
  const rows = (any.seasonHistory as any[]).map((h) => h.byTrack?.wta?.endRank).filter((r) => r !== undefined)
  console.log(`  every wta end-rank: ${rows.join(', ')}`)
  const near = rows.filter((r: number) => r > 10 && r <= 20).length
  console.log(`  seasons ended 11-20 (just outside): ${near}`)
  console.log(`  capstone gate  (4 top-10 seasons)            -> ${seasons >= 4 ? 'FIRES' : `SHORT by ${4 - seasons}`}`)
  console.log(`  lifetime gate  (4 top-10 seasons + 1 slam)   -> ${seasons >= 4 && slams >= 1 ? 'FIRES' : `SHORT by ${Math.max(0, 4 - seasons)} season(s)${slams >= 1 ? '' : ' and a slam'}`}`)
  console.log(`  at a threshold of 3 seasons: capstone ${seasons >= 3 ? 'FIRES' : 'short'} · lifetime ${seasons >= 3 && slams >= 1 ? 'FIRES' : 'short'}`)
  const cap = (any.offers as any[]).filter((o) => o.terms?.category === 'capstone')
  console.log(`  capstone letters actually received in this career: ${cap.length}`)
}

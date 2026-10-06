/** ROUND 47 #13 – THE CAREER DOSSIER. The owner exported a finished 20-season career through
 *  round 46 #20's dev button and asked for everything: «травмы, перформанс, как отработали
 *  помогающие специалисты, как и с какой скоростью она деградировала и т.д.». This probe decodes
 *  a .tsave through the app's OWN import door (decodeExportFile – magic, checksum, bounded
 *  inflate, the migration ladder) and prints a scout's dossier from what the save actually holds.
 *
 *  Honesty notes baked into the output: `injuryHistory` prunes to the LAST 20 rows by design
 *  (v40) – the lifetime figure is `careerTotals.weeksLostToInjury`; per-week condition/form are
 *  NOT stored (only the current snapshot), so the decline arc is read from season-grain facts
 *  (ranks, titles, win rates) rather than invented.
 *
 *  Run: npx vite-node tools/career-dossier.ts -- <path-to.tsave>
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import type { WorldState } from '../src/engine/world/state'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'

function dollars(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(cents)
  if (abs >= 100_000_000) return `${sign}$${(abs / 100_000_000).toFixed(1)}M`
  return `${sign}$${Math.round(abs / 100).toLocaleString('en-US')}`
}
const pct = (a: number, b: number) => (b === 0 ? '–' : `${Math.round((a / b) * 100)}%`)

async function main() {
  const path = process.argv[process.argv.length - 1]
  const world = (await decodeExportFile(new Uint8Array(readFileSync(path)))) as WorldState
  const w = world as unknown as Record<string, any>
  const season = (week: number) => Math.floor(week / WEEKS_PER_YEAR) + 1

  console.log('== FRAME ==')
  console.log({
    schemaVersion: w.schemaVersion,
    week: world.week,
    startYear: (w.startYear ?? 2031),
    seasons: season(world.week),
    kid: `${w.profile?.kidName} ${w.profile?.kidLastName}`,
    ageYears: w.ageYears ?? w.kidAgeYears ?? '(derived)',
    ending: w.ending ? { type: w.ending.type, week: w.ending.week } : null,
  })

  console.log('\n== TOP-LEVEL CENSUS (name: kind/len) ==')
  for (const k of Object.keys(w).sort()) {
    const v = w[k]
    const d = Array.isArray(v) ? `array[${v.length}]` : v === null ? 'null' : typeof v
    console.log(`  ${k}: ${d}`)
  }

  const sh: any[] = w.seasonHistory ?? []
  console.log('\n== SEASON HISTORY (one row per closed season) ==')
  if (sh.length) console.log('  fields of row 0:', Object.keys(sh[0]).join(', '))
  for (const [i, s] of sh.entries()) console.log(`  S${i + 1}:`, JSON.stringify(s))

  console.log('\n== INJURIES ==')
  console.log('  lifetime weeks lost (careerTotals):', w.careerTotals?.weeksLostToInjury)
  console.log('  ageCurve:', JSON.stringify(w.ageCurve))
  const ih: any[] = w.injuryHistory ?? []
  console.log(`  injuryHistory (last ${ih.length}, pruned to 20 by design):`)
  for (const r of ih)
    console.log(
      `    w${r.week} (S${season(r.week)}): ${r.kind}/${r.severity}, out ${r.weeksOut}` +
        (r.weeksSaved ? `, masseur saved ${r.weeksSaved}` : ''),
    )

  console.log('\n== FINANCE, WHOLE CAREER BY CATEGORY (financeWeeks fold) ==')
  const byCat = new Map<string, number>()
  for (const fw of (w.financeWeeks ?? []) as any[])
    for (const [cat, cents] of Object.entries(fw.byCategory ?? {}))
      byCat.set(cat, (byCat.get(cat) ?? 0) + (cents as number))
  const rows = [...byCat.entries()].sort((a, b) => a[1] - b[1])
  for (const [cat, cents] of rows) console.log(`  ${cat}: ${dollars(cents)}`)
  console.log('  careerTotals:', JSON.stringify(w.careerTotals))

  console.log('\n== STAFF / OFFERS LOG (tenures from the letters) ==')
  const offers: any[] = w.offers ?? []
  console.log(`  offers rows: ${offers.length}; kinds:`, [...new Set(offers.map((o) => o.kind))].join(', '))
  for (const o of offers.slice(0, 400))
    if (o.kind === 'staff' || o.kind === 'coach')
      console.log(
        `    w${o.week} ${o.kind}:${o.seat ?? o.coachId ?? ''} ${o.state ?? ''} ${o.terms ? JSON.stringify(o.terms) : ''}`,
      )
  console.log('  coachDeal:', JSON.stringify(w.coachDeal))
  console.log('  staff flags:', JSON.stringify({ masseur: w.masseur, sparring: w.sparring, psychologist: w.psychologist }))

  console.log('\n== LIFE ==')
  console.log('  loveEpisodes:', JSON.stringify(w.loveEpisodes ?? w.love ?? null))
  console.log('  children:', JSON.stringify(w.children))
  console.log('  lifeLog rows:', (w.lifeLog ?? []).length, 'kinds:', [
    ...new Set(((w.lifeLog ?? []) as any[]).map((r) => r.kind)),
  ].join(', '))

  console.log('\n== NOW (the final snapshot-grain state) ==')
  console.log('  condition:', w.condition, ' form:', JSON.stringify(w.form), ' fatigue:', w.fatigue)
  console.log('  development/radar:', JSON.stringify(w.development ?? w.radar))
  console.log('  kidRank:', JSON.stringify(w.kidRank), ' bestRank:', JSON.stringify(w.bestRank))
  console.log('  funds:', dollars(w.fundsCents ?? 0), ' kidFunds:', dollars(w.kidFundsCents ?? 0))
  console.log('  assets rows:', (w.assets ?? []).length)
  for (const a of (w.assets ?? []) as any[])
    console.log(`    ${a.id}: paid ${dollars(a.paidCents ?? 0)}, value ${dollars(a.valueCents ?? 0)}, units ${a.units ?? '-'}`)
}

if (!process.env.VITEST) main().catch((e) => { console.error(e); process.exitCode = 1 })

/** ROUND 47 #13, PART TWO – the computed folds the dossier's tables are built from. Appended as a
 *  second main-guarded block so the census half above stays a readable first pass. */
async function computed() {
  const path = process.argv[process.argv.length - 1]
  const { readFileSync } = await import('node:fs')
  const { decodeExportFile } = await import('../src/engine/saveCodec')
  const w: any = await decodeExportFile(new Uint8Array(readFileSync(path)))
  const S = (week: number) => Math.floor(week / 52)

  console.log('\n== TITLES BY TIER (from trophiesByTier) ==')
  let total = 0
  for (const [tier, t] of Object.entries<any>(w.trophiesByTier)) {
    const n = (t.titles ?? []).length
    total += n
    if (n) console.log(`  ${tier}: ${n} titles (finals lost: ${(t.finals ?? []).length}) weeks: ${t.titles.join(',')}`)
  }
  console.log('  TOTAL titles:', total, ' slams at seasons:', (w.trophiesByTier.slam?.titles ?? []).map((wk: number) => 'S' + (S(wk) + 1)).join(','))

  console.log('\n== HER POINTS BY SEASON x TIER (results fold, playerId=kid) ==')
  const fold = new Map<number, Map<string, number>>()
  for (const r of w.results) {
    if (r.playerId !== 'kid') continue
    const s = S(r.week)
    if (!fold.has(s)) fold.set(s, new Map())
    const m = fold.get(s)!
    m.set(r.tier, (m.get(r.tier) ?? 0) + r.points)
  }
  for (const [s, m] of [...fold.entries()].sort((a, b) => a[0] - b[0]))
    console.log(`  S${s + 1}: ` + [...m.entries()].sort((a, b) => b[1] - a[1]).map(([t, p]) => `${t}:${p}`).join(' '))

  console.log('\n== KNOCKS (the push/rest ledger) ==')
  for (const k of w.knockHistory) console.log(`  w${k.sinceWeek}-w${k.untilWeek} (S${S(k.sinceWeek) + 1}) ${k.part}: ${k.choice}`)

  console.log('\n== SKILLS: now vs potential (peakPhysical=' + w.peakPhysical + ') ==')
  for (const k of Object.keys(w.skills)) console.log(`  ${k}: ${w.skills[k].toFixed(1)} / ${w.potential[k].toFixed(1)}`)

  console.log('\n== ASSET TIMELINE (boughtWeek order) ==')
  for (const a of [...w.assets].sort((x: any, y: any) => (x.boughtWeek ?? 0) - (y.boughtWeek ?? 0)))
    console.log(`  w${a.boughtWeek} (S${S(a.boughtWeek) + 1}) ${a.id}: paid ${dollars(a.paidCents)} -> now ${dollars(a.valueCents)}` + (a.realisedGainCents ? ` (realised ${dollars(a.realisedGainCents)})` : ''))
}

if (!process.env.VITEST && process.env.DOSSIER_COMPUTED) computed().catch((e) => { console.error(e); process.exitCode = 1 })

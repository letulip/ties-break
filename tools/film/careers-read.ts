// READ THE TWO CAREERS THE WAY THE GAME READS THEM, and print the facts the film is going to claim.
//
// ⚠ THE SAVE BYTES NEVER ENTER THE REPOSITORY. Both paths come in on the command line and nothing is
// written back: `decodeExportFile` is the shipped import door (size cap, header, checksum, bounded
// inflation, bounds walk, then the migration ladder) and it returns a candidate world in memory. The
// files on disk are opened read-only and are not touched.
//
// ⚠ THE PROFESSIONAL RANK IS `ladders.wta.rank` AND NOTHING ELSE. `kidRank` is the INTERNATIONAL
// alias (shared/protocol/ladder.ts), and so is `seasonHistory[].endRank`; a season's professional
// place lives in `byTrack.wta`, which is OPTIONAL and whose absence means "not recorded" rather than
// zero. Both distinctions are printed below rather than assumed.
import fs from 'node:fs'
import { decodeExportFile } from '../../src/engine/saveCodec'
import { toSnapshot } from '../../src/engine/world/snapshot'
import { LADDER_LABEL } from '../../src/shared/protocol'

const paths = process.argv.slice(2)
if (paths.length !== 2) throw new Error('usage: careers-read.ts <left.tsave> <right.tsave>')

const money = (c: number | undefined) => (c === undefined ? '-' : '$' + (c / 100).toLocaleString('en-US', { maximumFractionDigits: 0 }))

for (const path of paths) {
  const bytes = new Uint8Array(fs.readFileSync(path))
  const world: any = await decodeExportFile(bytes)
  const s: any = toSnapshot(world)
  console.log('\n' + '='.repeat(96))
  console.log(path.split('/').pop())
  console.log('='.repeat(96))
  console.log('  seed              ', s.seed)
  console.log('  schemaVersion     ', world.schemaVersion)
  console.log('  week              ', s.week, '| ageYears', s.ageYears, '| season index', Math.floor(s.week / 52))
  console.log('  kid               ', s.profile?.kidName, s.profile?.kidLastName, '| country', s.profile?.country, '| style', s.profile?.playStyle)
  console.log('  background        ', s.profile?.background, '| coachTier', s.profile?.coachTier)
  console.log('  funds             ', money(s.fundsCents))
  console.log('  --- RANKS ---')
  console.log('  kidRank (ITF alias)', s.kidRank)
  for (const k of ['domestic', 'itf', 'wta'] as const) {
    const l = s.ladders?.[k]
    console.log(`  ladders.${k.padEnd(9)} ${LADDER_LABEL[k].padEnd(14)} rank ${String(l?.rank)} | prev ${String(l?.prevRank)} | points ${l?.points} | counting ${l?.countingResults?.length ?? 0}`)
  }
  console.log('  --- COACH ---')
  console.log('  world.coachId     ', world.coachId)
  console.log('  coachBilling      ', JSON.stringify(s.coachBilling ?? null))
  console.log('  coachEdge         ', JSON.stringify(s.coachEdge ?? null))
  console.log('  coachMarket rows  ', (s.coachMarket ?? []).map((r: any) => `${r.id}:${r.name ?? '?'}:${r.rung ?? r.tier ?? '?'}${r.hired ? ' HIRED' : ''}${r.current ? ' CURRENT' : ''}`).join(' | '))
  console.log('  masseur/psych     ', s.masseurHired, s.psychologistHired, s.psychologistRung)
  console.log('  --- THE RAW RANK CACHES (rule 4) ---')
  console.log('  world.kidRank', world.kidRank, '| kidRankWta', world.kidRankWta, '| kidRankDomestic', world.kidRankDomestic)
  console.log('  world.prevKidRankWta', world.prevKidRankWta, '| snapshot ladders.wta.rank', s.ladders?.wta?.rank)
  console.log('  --- WHAT SURVIVES OF PAST MATCHES (rule 8) ---')
  const results = world.results ?? []
  console.log('  results kept:', results.length, results.length ? '| oldest week ' + Math.min(...results.map((r: any) => r.week)) + ' newest ' + Math.max(...results.map((r: any) => r.week)) : '')
  if (results.length) console.log('  one result row:', JSON.stringify(results[results.length - 1]))
  console.log('  result row keys:', results.length ? Object.keys(results[0]).join(' ') : '(none)')
  console.log('  any stored per-match score/sets?', results.some((r: any) => r.score || r.sets || r.matches) ? 'YES' : 'NO')
  console.log('  --- TROPHIES (trophiesByTier) ---')
  for (const [tier, t] of Object.entries<any>(s.trophiesByTier ?? {})) {
    if (!t || (!t.titles && !t.finals && !t.semis)) continue
    console.log(`    ${tier.padEnd(14)} ${JSON.stringify(t)}`)
  }
  console.log('  --- MILESTONES ---')
  for (const m of s.milestones ?? []) console.log(`    week ${String(m.week).padStart(4)}  ${m.id ?? m.kind ?? '?'}  ${JSON.stringify(m).slice(0, 180)}`)
  console.log('  --- SEASON HISTORY (endRank is the ITF alias; byTrack.wta is Professional) ---')
  console.log('    idx  endRank(ITF)   wta.end  wta.points  wta W-L  itf.end  dom.end  W-L(all)  bestFinish  endFunds')
  for (const e of s.seasonHistory ?? []) {
    const w = e.byTrack?.wta
    const i = e.byTrack?.itf
    const d = e.byTrack?.domestic
    console.log(
      `    ${String(e.seasonIndex).padStart(3)}  ${String(e.endRank).padStart(12)}  ${String(w?.endRank ?? '-').padStart(8)}  ${String(w?.points ?? '-').padStart(10)}  ${String((w?.wins ?? '-') + '-' + (w?.losses ?? '-')).padStart(7)}  ${String(i?.endRank ?? '-').padStart(7)}  ${String(d?.endRank ?? '-').padStart(7)}  ${String(e.wins + '-' + e.losses).padStart(8)}  ${String(e.bestFinish ?? '-').padStart(10)}  ${money(e.endFundsCents)}`,
    )
  }
  console.log('  --- STORED MATCH RECORDS ---')
  console.log('  world top-level keys:', Object.keys(world).sort().join(' '))
  console.log('  snapshot top-level keys:', Object.keys(s).sort().join(' '))
  console.log('  --- RADAR (fogged, as the Kid screen draws it) ---')
  for (const a of s.radar ?? []) console.log(`    ${String(a.key).padEnd(14)} shown ${a.shownValue.toFixed(1)}  start ${a.startValue.toFixed(1)}  band ${a.band.toFixed(2)}  ceil ${a.ceilingLo.toFixed(1)}..${a.ceilingHi.toFixed(1)}  ${a.note ?? ''}`)
  console.log('  true skills (engine, never on a screen):', JSON.stringify(world.skills))
  console.log('  matchesEverPlayed', s.matchesEverPlayed, '| results kept', (world.results ?? []).length, '| resultsWindow', (world.resultsWindow ?? []).length)
}

// =================================================================================================
// ⭐ THE BRIEF'S TABLE AS ASSERTIONS. «The verified data table in this brief is the factual
// checklist. Recheck through decodeExportFile and the real engine before capture.» So it is rechecked
// here, against the decoded worlds, and the film's provenance note quotes this output.
// =================================================================================================
{
  const load = async (path: string) => {
    const world: any = await decodeExportFile(new Uint8Array(fs.readFileSync(path)))
    return { world, s: toSnapshot(world) as any }
  }
  const [L, R] = await Promise.all([load(paths[0]), load(paths[1])])
  const seasonRow = (s: any, idx: number) => s.seasonHistory.find((e: any) => e.seasonIndex === idx)
  const wtaEnd = (s: any, idx: number) => seasonRow(s, idx)?.byTrack?.wta?.endRank ?? null
  const bestWta = (s: any) => {
    const rows = s.seasonHistory.map((e: any) => ({ i: e.seasonIndex, r: e.byTrack?.wta?.endRank })).filter((x: any) => typeof x.r === 'number')
    const best = Math.min(...rows.map((x: any) => x.r))
    return { rank: best, seasons: rows.filter((x: any) => x.r === best).map((x: any) => x.i + 1) }
  }
  const titles = (s: any, tier: string) => (s.trophiesByTier?.[tier]?.titles ?? []) as number[]

  const checks: [string, unknown, unknown][] = [
    ['LEFT is Zoe Slavic', `${L.s.profile.kidName} ${L.s.profile.kidLastName}`, 'Zoe Slavic'],
    ['LEFT seed', L.s.seed, 'prologue-kbakekls'],
    ['LEFT week', L.s.week, 517],
    ['LEFT age', L.s.ageYears, 23],
    ['LEFT background', L.s.profile.background, 'working'],
    ['LEFT has no coach (self-coached)', L.world.coachId, null],
    ['LEFT Professional rank is the FOLDED one, not the cache', L.s.ladders.wta.rank, 16],
    ['LEFT stale kidRankWta cache is 13 (not used)', L.world.kidRankWta, 13],
    ['LEFT kidRank is the ITF alias (not used)', L.s.kidRank, 80],
    ['LEFT first WTA 250 title week', titles(L.s, 'wta250')[0], 274],
    ['LEFT season 5 (index 4) Professional rank', wtaEnd(L.s, 4), 98],
    ['LEFT best season-end Professional rank', bestWta(L.s).rank, 7],
    ['LEFT best came in season', bestWta(L.s).seasons.join(','), '9'],
    ['LEFT WTA 500 titles', titles(L.s, 'wta500').length, 6],
    ['LEFT WTA 1000 titles', titles(L.s, 'wta1000').length, 4],
    ['LEFT Slam titles', titles(L.s, 'slam').length, 0],
    ['RIGHT is Alice Martin', `${R.s.profile.kidName} ${R.s.profile.kidLastName}`, 'Alice Martin'],
    ['RIGHT seed', R.s.seed, 'prologue-pmb8nzwh'],
    ['RIGHT week', R.s.week, 405],
    ['RIGHT age', R.s.ageYears, 21],
    ['RIGHT background', R.s.profile.background, 'wealthy'],
    ['RIGHT coach rung', R.s.profile.coachTier, 'high'],
    ['RIGHT current coach id', R.world.coachId, 'elit-4'],
    ['RIGHT current coach name', (R.s.coachMarket ?? []).find((c: any) => c.id === R.world.coachId)?.name, 'Niko Duval'],
    ['RIGHT Professional rank', R.s.ladders.wta.rank, 8],
    ['RIGHT first WTA 250 title week', titles(R.s, 'wta250')[0], 112],
    ['RIGHT season 5 (index 4) Professional rank', wtaEnd(R.s, 4), 3],
    ['RIGHT best season-end Professional rank', bestWta(R.s).rank, 3],
    ['RIGHT best came in seasons', bestWta(R.s).seasons.join(','), '5,7'],
    ['RIGHT WTA 500 titles', titles(R.s, 'wta500').length, 11],
    ['RIGHT WTA 1000 titles', titles(R.s, 'wta1000').length, 7],
    ['RIGHT Slam titles', titles(R.s, 'slam').length, 1],
    ['both careers share season index 4', seasonRow(L.s, 4) !== undefined && seasonRow(R.s, 4) !== undefined, true],
  ]
  console.log('\n' + '='.repeat(96) + '\nTHE BRIEF’S TABLE, RECHECKED AGAINST THE DECODED WORLDS\n' + '='.repeat(96))
  let bad = 0
  for (const [what, got, want] of checks) {
    const ok = JSON.stringify(got) === JSON.stringify(want)
    if (!ok) bad++
    console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what.padEnd(58)} ${JSON.stringify(got)}${ok ? '' : ' != ' + JSON.stringify(want)}`)
  }
  console.log(`\n  ${checks.length - bad}/${checks.length} verified`)
  if (bad) process.exitCode = 2
}

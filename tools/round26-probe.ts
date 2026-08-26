// ROUND 26 #13 – the college clock, read out of his own save. He suspects the years are muddled;
// this reads what the state actually says before anyone changes a line. READ-ONLY on the save.
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'

const path = process.argv[2] ?? `${process.env.HOME}/Downloads/tennis-sim_alice-cfbv_w502.tsave`
const w = (await decodeExportFile(new Uint8Array(readFileSync(path)))) as any
const c = w.college

console.log(`week ${w.week} · schema v${w.schemaVersion} · funds ${(w.fundsCents / 100).toFixed(0)} · hers ${((w.kidFundsCents ?? 0) / 100).toFixed(0)}`)
console.log('ending:', w.ending?.type ?? 'none', '· resumesWeek', w.ending?.resumesWeek ?? '-')
if (!c) { console.log('NO COLLEGE STATE'); process.exit(0) }
console.log(`college: from ${c.fromWeek} until ${c.untilWeek} done ${c.doneWeek ?? '-'} tier ${c.tier}`)
console.log(`years banked: ${c.years?.length ?? 0} · pendingYearStart ${c.pendingYearStart ? 'SET' : 'null'}`)
for (const [i, y] of (c.years ?? []).entries()) {
  console.log(`  year[${i}] index=${y.index} delta=${y.fundsDeltaCents} league=${y.league ? `${y.league.roundsWon} rounds won` : 'NONE'} callUp=${y.callUp ? 'yes' : 'no'}`)
}
const elapsed = w.week - c.fromWeek
console.log(`elapsed since departure: ${elapsed} weeks = ${(elapsed / 52).toFixed(2)} years`)
console.log(`span: ${c.untilWeek - c.fromWeek} weeks = ${((c.untilWeek - c.fromWeek) / 52).toFixed(2)} years`)
console.log(`=> the card would read "Year ${(c.years?.length ?? 0) + 1} of 4"`)

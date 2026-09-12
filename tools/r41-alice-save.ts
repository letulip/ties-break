/**
 * r41-alice-save – the round's own source save, read against the round's items.
 *
 * ROUND 41 was written whole while playing ONE career («раунд я целиком писал, играя за этот
 * сейв»), and the owner handed the .tsave over for verification: does the shipped round hold on
 * the exact world it was reported from, and does the save light anything the list missed?
 *
 * MEASUREMENT ONLY. Imports the engine read-only, changes no constant, ships no fixture.
 * ⚠ THE SAVE IS PERSONAL AND IS NEVER COMMITTED – tools/plateau-probe.ts's own rule; only the
 * aggregate facts quoted in docs/rounds/round-41.md leave this run.
 *
 * Run:
 *   npx vite-node tools/r41-alice-save.ts -- --save ~/Downloads/….tsave
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import type { WorldState } from '../src/engine/world'
import { toSnapshot } from '../src/engine/world'
import { kidAgeYears } from '../src/engine/world/age'
import { seasonIndexOf } from '../src/engine/world/ledger'
import { rankingFor } from '../src/engine/world/ladder'
import { KID_ID } from '../src/engine/world/constants'
import { kidPrizeShareCents } from '../src/engine/economy'
import { activeKitDeal } from '../src/engine/offers'
import { formatCents } from '../src/shared/money'

function section(title: string): void {
  console.log(`\n${'='.repeat(86)}\n${title}\n${'='.repeat(86)}`)
}

async function main(): Promise<void> {
  const i = process.argv.indexOf('--save')
  const path = i >= 0 ? process.argv[i + 1].replace('~', process.env.HOME ?? '') : ''
  const w = (await decodeExportFile(new Uint8Array(readFileSync(path)))) as WorldState

  section('WHO SHE IS ON THIS SAVE (post-migration to the working tree schema)')
  const age = kidAgeYears(w.week, w.profile.birthMonth, w.profile.birthDay)
  console.log(`week ${w.week} · season ${seasonIndexOf(w.week)} · age ${age.toFixed(2)} · background ${w.profile.background}`)
  console.log(`funds ${formatCents(w.fundsCents)} · her account ${formatCents(w.kidFundsCents ?? 0)}`)

  section('ITEM 26 – the cached rank vs the fold, ON HIS WORLD')
  const fold = rankingFor(w, 'wta').find((r) => r.playerId === KID_ID)?.rank ?? null
  console.log(`world.kidRankWta (the cache) = ${w.kidRankWta ?? '–'}`)
  console.log(`rankingFor fold, her row     = ${fold ?? '–'}`)
  console.log(fold === (w.kidRankWta ?? null) ? 'AGREE on this save' : '*** DISAGREE – the defect, live on his save ***')
  const snap = toSnapshot(w)
  console.log(`snapshot ladders.wta.rank (the fix's read) = ${snap.ladders.wta.rank ?? '–'}`)

  section('ITEM 27 – what the A1 split would have paid HER on this career')
  console.log(`careerTotals.prizeCents (gross, career)   = ${formatCents(w.careerTotals?.prizeCents ?? 0)}`)
  console.log(`kidFundsCents on the save                  = ${formatCents(w.kidFundsCents ?? 0)}`)
  console.log(`share at her age now (${age.toFixed(1)})              = ${kidPrizeShareCents(100_00, age)} cents of a $100 cheque`)

  section('ITEM 25 – the kit deal and its allowance, AS HE PLAYS IT')
  // ⚠ RE-CUT: the first draft read `w.kitDeal`, a field that does not exist on WorldState – so its
  // «no live kit deal» line was printed from a never-set value and check:tools was red (P1's agent
  // caught both). The engine's own accessor is the truth: activeKitDeal(world.offers, week).
  const deal = activeKitDeal(w.offers ?? [], w.week)
  if (deal) {
    const d = deal as unknown as { brand?: string; coveredCents?: number; terms?: { kitAllowanceCents?: number } }
    console.log(
      `brand ${d.brand ?? '?'} · covered ${formatCents(d.coveredCents ?? 0)} of ${formatCents(d.terms?.kitAllowanceCents ?? 0)}`,
    )
  } else console.log('no live kit deal on the save (via activeKitDeal – the engine\'s own read)')

  section('ITEMS 18/24/28 – what the family owns (assets: id, paid, worth, readyWeek)')
  for (const a of w.assets ?? []) {
    const row = a as { id: string; paidCents: number; valueCents: number; readyWeek?: number | null; boughtWeek: number }
    console.log(
      `${row.id.padEnd(16)} paid ${formatCents(row.paidCents).padStart(12)} · worth ${formatCents(row.valueCents).padStart(12)} · bought w${row.boughtWeek}${row.readyWeek != null ? ` · READY w${row.readyWeek} (building)` : ''}`,
    )
  }
  if (!(w.assets ?? []).length) console.log('none')

  section('WAVE-3 FIELDS AFTER MIGRATION (the save predates the wave)')
  console.log(`loveEpisodes = ${JSON.stringify((w as unknown as { loveEpisodes?: unknown[] }).loveEpisodes ?? 'MISSING')}`)
  console.log(`activeAdDeals = ${JSON.stringify((w as unknown as { activeAdDeals?: unknown[] }).activeAdDeals ?? [])}`)

  section('ANYTHING ELSE THAT LOOKS OFF (quick sweeps)')
  console.log(`injury = ${JSON.stringify(w.injury)}`)
  console.log(`condition ${w.condition} · results rows ${w.results.length} · events ${w.events.length} · seasons ${w.seasonHistory.length}`)
  const neg = [w.fundsCents, w.kidFundsCents ?? 0].filter((c) => c < 0)
  console.log(neg.length ? `*** NEGATIVE BALANCES: ${neg.map((c) => formatCents(c)).join(', ')}` : 'no negative balances')
}

void main()

/**
 * r41-brand-history – item 18 answered from the owner's OWN save, week by week.
 *
 * His question, repeated on the second visit: the brand bought fresh at 16 in the top-100 sat
 * «около 240к около года и приносил 270 долларов всё это время», woke only after a W500 title,
 * then dropped suddenly later – «мне хочется понять с чем это связано, потому что в моем
 * представлении она уже должна была быть знаменита. У нее был вайлдкард на Шлем, когда она
 * была #155».
 *
 * The engine's brand is a pure read of dated state (`brandSignalsOf(world, week)`,
 * `fameFloorOf(world, week)` – trophiesByTier carries the WEEK of every title and lost final), so
 * the whole price path RECONSTRUCTS from the save: fame(t), income(t), derived(t), and the two
 * worth walks – the shipped-before-round-41 closed form whose half-life was re-read from today's
 * fame over the whole holding period (the retro defect), and the round's incremental walk.
 *
 * ⚠ One honest wrinkle, stated not hidden: brandSignalsOf's proSeasons/topSeasons terms fold over
 * ALL of seasonHistory regardless of the asked week, so a reconstruction at an early t counts a
 * season or two that had not ended yet – it flatters early `multiple` slightly and cannot create
 * his plateau; fame, income and the floor are exactly dated.
 *
 * MEASUREMENT ONLY; the personal save is never committed (plateau-probe's rule).
 * Run: npx vite-node tools/r41-brand-history.ts -- --save ~/Downloads/….tsave
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import type { WorldState } from '../src/engine/world'
import { brandSignalsOf, brandWeeklyGrossCents, brandGrossWorthCents } from '../src/engine/world/brand'
import { worthRampHalfLife } from '../src/engine/world/assets'
import { ECONOMY } from '../src/engine/economy'
import { formatCents } from '../src/shared/money'

function section(title: string): void {
  console.log(`\n${'='.repeat(96)}\n${title}\n${'='.repeat(96)}`)
}

async function main(): Promise<void> {
  const i = process.argv.indexOf('--save')
  const path = i >= 0 ? process.argv[i + 1].replace('~', process.env.HOME ?? '') : ''
  const w = (await decodeExportFile(new Uint8Array(readFileSync(path)))) as WorldState

  const brand = (w.assets ?? []).find((a) => a.id === 'merch-brand')
  if (!brand) {
    console.log('no merch-brand on the save')
    return
  }
  const bought = brand.boughtWeek
  const paid = brand.paidCents
  const floorShare = ECONOMY.shop.businessValueFloorShare
  const medianFame = ECONOMY.shop.worthRamp.medianFame
  const baseX = 14 // the catalogue's earningsMultipleX for merch-brand

  section(`THE SHELF OF DATED TITLES AND LOST FINALS (what fame is made of on this save)`)
  for (const [tier, shelf] of Object.entries(w.trophiesByTier ?? {})) {
    const s = shelf as { titles: number[]; finals?: number[] }
    if (s.titles.length || s.finals?.length) {
      console.log(
        `${tier.padEnd(8)} titles @ w${s.titles.join(', w') || '–'}${s.finals?.length ? `  · lost finals @ w${s.finals.join(', w')}` : ''}`,
      )
    }
  }

  section(`THE BRAND, WEEK BY WEEK FROM ITS PURCHASE (bought w${bought}, paid ${formatCents(paid)})`)
  console.log('week   fame    income/wk     derived        OLD worth (retro-H)   NEW worth (incremental)   note')
  let incr = paid
  let prevOld = paid
  const drops: { week: number; oldStep: number }[] = []
  for (let t = bought; t <= w.week; t++) {
    const sig = brandSignalsOf(w, t)
    const gross = brandGrossWorthCents(sig, baseX)
    const derived = Math.max(Math.round(paid * floorShare), gross)
    const H = worthRampHalfLife(sig.fame, medianFame)
    // OLD: the closed form, kept re-derived from t0 with TODAY's H – the retro defect.
    const kept = Math.pow(0.5, Math.max(0, t - bought) / H)
    const old = Math.round(derived + (paid - derived) * kept)
    // NEW: one step a week by this week's H, the persisted value as the accumulator.
    incr = Math.round(incr + (derived - incr) * (1 - Math.pow(0.5, 1 / H)))
    const oldStep = old - prevOld
    if (t > bought && oldStep < -100_000_00) drops.push({ week: t, oldStep })
    prevOld = old
    if ((t - bought) % 8 === 0 || Math.abs(oldStep) > 100_000_00) {
      console.log(
        `w${String(t).padEnd(5)} ${sig.fame.toFixed(1).padStart(5)} ${formatCents(brandWeeklyGrossCents(sig)).padStart(10)} ${formatCents(derived).padStart(14)} ${formatCents(old).padStart(18)} ${formatCents(incr).padStart(18)}${Math.abs(oldStep) > 100_000_00 ? `   << OLD steps ${formatCents(oldStep)} in ONE week` : ''}`,
      )
    }
  }

  section('THE SUDDEN DROPS THE OLD MODEL MANUFACTURED (one-week steps over $100k)')
  if (!drops.length) console.log('none over the bar on this save')
  for (const d of drops) console.log(`w${d.week}: ${formatCents(d.oldStep)} in one week – the half-life re-read, not a market`)
}

void main()

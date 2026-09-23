// THE CANCEL-SHARE BENCH (23.09, his «оставшиеся» - docs/specs/the-cancel-share-2026-09.md).
// `npx vite-node tools/cancel-share-bench.ts` - a measurement harness, run by hand, never a gate.
//
// WHAT IT MEASURES. `shootCancelCents` divided the cheque by `shootCount` - the PER-YEAR figure
// wearing a total's name (the catalogue writes it from `bands[band].shootWeeksPerYear`) - so a
// multi-season paper refunded a season's share for one cancelled shoot. The repair divides by the
// PAPER's list. This sweep prices every catalogue cell (category x band x term years) with its
// paper booked by the REAL signature path (`chooseShootWeeks`), and prints the refund under the
// old divisor against the new one. Predicted: new/old = 1/years exactly, wherever the booker
// filled the term; a short-booked cell is printed, never smoothed.
//
// ⚠ DETERMINISTIC AND CAREER-FREE by design: the arithmetic under test is signature-time paper
// arithmetic, so walking careers would measure `chooseShootWeeks`' dice and the clash hazard on
// top of it. One fixed sign week, one derived seed per cell. Zero MAIN draws (the chooser rolls
// its own sub-stream); nothing here can touch a career.
// ⚠ The legacy `tools/ad-shoot-bench.ts` could NOT carry this section: it crashes at startup on
// today's engine (pre-existing rot, found 23.09 while adding this very sweep - the ad system
// moved under it across rounds 34-44 and nobody ran it since). Its repair is its own task.
import { ECONOMY } from '../src/engine/economy'
import { chooseShootWeeks } from '../src/engine/offers'

const AD = ECONOMY.advertising
const SIGN_WEEK = 216 // an ordinary in-season adult week - the clash suite's own probe week
const share = (cashCents: number, divisor: number) => Math.round(cashCents / Math.max(1, divisor))

console.log('='.repeat(100))
console.log('CANCEL-SHARE BENCH - the old divisor (per-year figure) vs the paper, every catalogue cell')
console.log('='.repeat(100))

const byYears = new Map<number, { cells: number; ratios: number[]; shortBooked: number }>()
for (const [cat, def] of Object.entries(AD.categories)) {
  for (let band = 0; band < AD.bands.length; band++) {
    const fee = def.feeCentsByBand[band]
    if (fee == null) continue
    const b = AD.bands[band]
    for (let years = b.termYearsMin; years <= b.termYearsMax; years++) {
      const weeks = chooseShootWeeks(`cancel-share:${cat}:${band}:${years}`, SIGN_WEEK, years * 52, b.shootWeeksPerYear, AD.shootLeadWeeks)
      const oldCents = share(fee, b.shootWeeksPerYear)
      const newCents = share(fee, weeks.length)
      const slot = byYears.get(years) ?? { cells: 0, ratios: [], shortBooked: 0 }
      slot.cells++
      slot.ratios.push(newCents / oldCents)
      if (weeks.length !== b.shootWeeksPerYear * years) slot.shortBooked++
      byYears.set(years, slot)
      if (years === b.termYearsMax && band >= 3)
        console.log(
          `   ${cat} band${band} ${years}y: fee $${(fee / 100).toLocaleString('en-US')} · booked ${weeks.length}` +
            ` · old $${(oldCents / 100).toLocaleString('en-US')} -> new $${(newCents / 100).toLocaleString('en-US')}`,
        )
    }
  }
}

console.log('')
for (const [years, s] of [...byYears.entries()].sort((a, b) => a[0] - b[0])) {
  const r = s.ratios.slice().sort((a, b) => a - b)
  console.log(
    `   ${years}-season papers: ${s.cells} cells · refund ratio new/old median ${r[Math.floor(r.length / 2)].toFixed(3)}` +
      ` (predicted ${(1 / years).toFixed(3)}) · min ${r[0].toFixed(3)} max ${r[r.length - 1].toFixed(3)} · short-booked ${s.shortBooked}`,
  )
}

console.log('')
console.log('   the probe (the 23.09 defect report): a $400,000 / 3-season / 2-per-year paper, one cancel of six:')
console.log(`     old $${(share(400_000_00, 2) / 100).toLocaleString('en-US')} -> new $${(share(400_000_00, 6) / 100).toLocaleString('en-US')}`)

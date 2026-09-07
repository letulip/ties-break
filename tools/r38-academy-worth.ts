/**
 * r38-academy-worth – round 38 #8, the academy's worth, measured on a real career.
 *
 * ⚠⚠ WHY THIS TOOL EXISTS AND NOT `npm run probe:shop`. The shop probe walks SYNTHETIC bench
 * careers and answers §2e-1/§2e-5 – questions about the good car and about whether the shelf
 * dominates a season's outgoings. It takes no save, and the question this item is accepted on is
 * about a save: `docs/specs/academy-worth-2026-09.md` §3 is a table of what HIS week-1115 career
 * reads, and §4 step 1's proof is «the two rows move by the drift and NOTHING ELSE ON THE SHELF
 * MOVES». Only a probe that opens the file can say that.
 *
 * ⚠ READ-ONLY LAW (`tools/r38-save-read.ts`' own standing, and `tools/injury-saves-read.ts` before
 * it): the save is personal, handed in on the command line, read through the game's own import door
 * (`decodeExportFile`) and NEVER copied into the repo or made a fixture. What the repo keeps is the
 * derived table printed here.
 *
 * ⚠⚠ IT GOES THROUGH THE SHIPPED PATH AND NOT THROUGH ITS OWN ARITHMETIC, which is the whole point
 * of measuring rather than asserting: `revalueAssets` writes `valueCents` off `assetWorthCents`, and
 * `shopView` is what the screen actually renders. This tool prints the SHOP VIEW's own
 * `valueCents` – so a number that moves here is a number that moved on his phone.
 *
 * Run: npx vite-node tools/r38-academy-worth.ts -- --save /path/career.tsave
 *      (add `--json` for a machine-diffable dump of every owned row)
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { revalueAssets, shopView, ownedAssets, shopItem, assetHeldWeeks } from '../src/engine/world'
import { academyReputationOf } from '../src/engine/world/business'
import { ECONOMY } from '../src/engine/economy'
import type { WorldState } from '../src/engine/world'

const args = process.argv.slice(2)
let savePath = ''
let asJson = false
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--save' && args[i + 1]) savePath = args[++i]!
  if (args[i] === '--json') asJson = true
}
if (!savePath) {
  console.error('usage: npx vite-node tools/r38-academy-worth.ts -- --save /path/career.tsave [--json]')
  process.exit(1)
}

const money = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
const f2 = (n: number) => n.toFixed(2)
const f4 = (n: number) => n.toFixed(4)
const padL = (s: string | number, n: number) => String(s).padStart(n)
const padR = (s: string | number, n: number) => String(s).padEnd(n)

async function main() {
  const world = (await decodeExportFile(new Uint8Array(readFileSync(savePath)))) as WorldState

  // ⚠ THE SHIPPED WRITER, RUN ON PURPOSE. A save carries the `valueCents` the tick that wrote it
  // computed, under the code THAT build was running – so reading the stored field alone would report
  // the old arithmetic on a new tree and call it a null result. `revalueAssets` is the same call the
  // weekly tick makes; running it here is what makes the two arms comparable.
  revalueAssets(world)
  const view = shopView(world)
  const owned = ownedAssets(world)
  const rep = academyReputationOf(world)
  const A = ECONOMY.business.academy
  const premiumPerRep = (A as { premiumPerRep?: number }).premiumPerRep ?? 0

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          week: world.week,
          schemaVersion: world.schemaVersion,
          reputation: rep,
          premiumPerRep,
          rows: owned.map((a) => {
            const row = view.rows.find((r) => r.id === a.id)
            return {
              id: a.id,
              family: shopItem(a.id)?.family ?? null,
              annualRateBps: shopItem(a.id)?.annualRateBps ?? null,
              boughtWeek: a.boughtWeek,
              basisWeek: a.basisWeek ?? null,
              paidCents: a.paidCents,
              valueCents: row?.valueCents ?? null,
            }
          }),
        },
        null,
        2,
      ),
    )
    return
  }

  console.log('='.repeat(112))
  console.log(
    `THE WHOLE SHELF – ${world.profile.kidName} ${world.profile.kidLastName}, week ${world.week}, schema v${world.schemaVersion}`,
  )
  console.log(`academy reputation ${f2(rep)} · ECONOMY.business.academy.premiumPerRep ${premiumPerRep}`)
  console.log('='.repeat(112))
  console.log(
    padR('id', 16) +
      padR('family', 12) +
      padL('rateBps', 9) +
      padL('bought', 8) +
      padL('years', 8) +
      padL('paid', 15) +
      padL('valueCents', 15) +
      padL('vs paid', 14),
  )
  // ⚠ EVERY OWNED ROW, NOT THE ACADEMY'S. §4 step 1's acceptance is a NEGATIVE claim about the rest
  // of the shelf, and a table that printed only the rows expected to move could not carry it.
  let totalPaid = 0
  let totalValue = 0
  for (const a of owned) {
    const item = shopItem(a.id)
    const row = view.rows.find((r) => r.id === a.id)
    const value = row?.valueCents ?? a.valueCents
    const years = assetHeldWeeks(world, a) / WEEKS_PER_YEAR
    totalPaid += a.paidCents
    totalValue += value
    console.log(
      padR(a.id, 16) +
        padR(item?.family ?? '?', 12) +
        padL(item?.annualRateBps ?? '?', 9) +
        padL('w' + a.boughtWeek, 8) +
        padL(f2(years), 8) +
        padL(money(a.paidCents), 15) +
        padL(money(value), 15) +
        padL((value - a.paidCents >= 0 ? '+' : '') + money(value - a.paidCents), 14),
    )
  }
  console.log(padR('TOTAL', 16) + padR('', 12) + padL('', 9) + padL('', 8) + padL('', 8) + padL(money(totalPaid), 15) + padL(money(totalValue), 15) + padL((totalValue - totalPaid >= 0 ? '+' : '') + money(totalValue - totalPaid), 14))

  // --- the academy's own arithmetic, factor by factor -------------------------------------------
  const academy = owned.filter((a) => shopItem(a.id)?.family === 'academy')
  if (academy.length === 0) {
    console.log('\n(this career owns no academy stage)')
    return
  }
  console.log('')
  console.log('THE ACADEMY, FACTOR BY FACTOR – paid x drift x premium, the formula in the spec')
  console.log(
    padR('id', 16) +
      padL('years', 8) +
      padL('driftX', 10) +
      padL('premiumX', 10) +
      padL('paid', 15) +
      padL('paid x drift', 15) +
      padL('worth', 15),
  )
  let floorTotal = 0
  let worthTotal = 0
  for (const a of academy) {
    const item = shopItem(a.id)!
    const years = Math.max(0, assetHeldWeeks(world, a)) / WEEKS_PER_YEAR
    const driftX = Math.pow(1 + item.annualRateBps / 10_000, years)
    const premiumX = 1 + premiumPerRep * (rep - 1)
    const floor = Math.round(a.paidCents * driftX)
    const worth = view.rows.find((r) => r.id === a.id)?.valueCents ?? a.valueCents
    floorTotal += floor
    worthTotal += worth
    console.log(
      padR(a.id, 16) +
        padL(f2(years), 8) +
        padL(f4(driftX), 10) +
        padL(f4(premiumX), 10) +
        padL(money(a.paidCents), 15) +
        padL(money(floor), 15) +
        padL(money(worth), 15),
    )
    // ⚠ THE FLOOR IS CHECKED ON THE ROW AND NOT ONLY IN A TEST, because a probe that reported a
    // violation as an ordinary number would be a probe nobody reads twice.
    if (worth < floor) console.log(`     ⚠ FLOOR BREACHED on ${a.id}: ${money(worth)} < ${money(floor)}`)
  }
  console.log(padR('together', 16) + padL('', 8) + padL('', 10) + padL('', 10) + padL('', 15) + padL(money(floorTotal), 15) + padL(money(worthTotal), 15))
  console.log('')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

/**
 * r39-apparel-bond – HOW OFTEN A CLOTHING CAMPAIGN OUTLIVES THE KIT DEAL THAT AUTHORED IT, and by
 * how many weeks. The measurement round 39 item 17 is built on (CLAUDE.md invariant 5: a mechanic
 * ships with a bench run, and «if it turns out to be vanishingly rare, say so»).
 *
 * THE BOND, AS IT EXISTS TODAY: a `clothing` campaign is authored by the brand of the KIT DEAL LIVE
 * THE WEEK IT ARRIVES (`reviewAdOffer` – «двойной программой»: no kit deal, nobody writes it), and
 * that bond is read ONCE, at arrival, and never again. So the campaign can outlive the deal that
 * authored it, and this tool counts how far.
 *
 * FOUR NUMBERS, and each one is a different half of the item:
 *   1. ORPHAN WEEKS – weeks a signed clothing campaign was running past the end of the kit deal
 *      that wrote it. This is the guarantee's own reach: exactly the weeks in which house X would
 *      now write her a kit letter unconditionally.
 *   2. THE ORPHAN SPAN per campaign – how many weeks each one outlived its author, so the table can
 *      say whether this is a fortnight's seam or a three-year hole.
 *   3. NAKED WEEKS – of those orphan weeks, the ones where she held NO kit deal at all. The
 *      guarantee's trigger («whenever her kit deal expires») lands here.
 *   4. LEAVINGS – she signs a kit deal with a DIFFERENT house while a clothing campaign runs. This
 *      is the price's own trigger, and the cents column is what the rival's letter must now name.
 *
 * ⚠ THE ARM HAS TO CONTAIN ITS READER (CLAUDE.md, 17.08). `econ-bench`'s policies never answer the
 * post, so a walk that did not sign would raise clothing letters and sign none, and the whole table
 * would read zero – a null arm mistaken for a null result. This walk answers the post eagerly, the
 * week a letter lands: `sponsor-ladder-reach.ts`' own `answerThePost` policy (the strongest live kit
 * letter, plus every live advertising letter), through `acceptOffer`, the engine's own door.
 *
 * ⚠ The owner's personal saves are never read here – synthetic careers only.
 *
 * Run: npx vite-node tools/r39-apparel-bond.ts [-- --seeds 3 --weeks 900]
 */
import { PRESETS, POLICIES, openCareer, stepCareerWeek } from './econ-bench'
import { acceptOffer, type WorldState } from '../src/engine/world'
import { activeKitDeal, adCategoryOf, isOfferLive } from '../src/engine/offers'
import type { AdOfferTerms, KitOfferTerms, Offer, SponsorTier } from '../src/shared/protocol'
import { SPONSOR_TIERS } from '../src/engine/offers'

const args = process.argv.slice(2)
const numArg = (flag: string, dflt: number) => {
  const i = args.indexOf(flag)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : dflt
}
const seeds = numArg('--seeds', 3)
const weeks = numArg('--weeks', 900)

const rungIndex = (t: SponsorTier | undefined): number => (t ? SPONSOR_TIERS.indexOf(t) : -1)

/** The eager parent: the strongest live kit letter, and every live advertising letter. */
function answerThePost(world: WorldState): void {
  const live = world.offers.filter((o) => (o.kind === 'kit' || o.kind === 'ad') && isOfferLive(o, world.week))
  if (live.length === 0) return
  const kit = live.filter((o) => o.kind === 'kit')
  const best = [...kit].sort(
    (a, b) => rungIndex((b.terms as KitOfferTerms).tier) - rungIndex((a.terms as KitOfferTerms).tier),
  )[0]
  for (const target of [...(best ? [best] : []), ...live.filter((o) => o.kind === 'ad')]) {
    try {
      acceptOffer(world, target.id)
    } catch {
      // the engine re-validating: an ended career, or a slot already spoken for.
    }
  }
}

const signedClothing = (offers: Offer[]): Offer[] =>
  offers.filter(
    (o) => o.kind === 'ad' && o.state === 'signed' && adCategoryOf(o.terms as AdOfferTerms) === 'clothing',
  )

type CampaignRow = {
  preset: string
  policy: string
  seed: number
  brand: string
  from: number
  until: number
  /** the kit deal live the week the campaign arrived – by construction the same brand */
  kitUntil: number | null
  orphanWeeks: number
}
type LeaveRow = { preset: string; policy: string; seed: number; week: number; from: string; to: string; leftCents: number }

const campaigns: CampaignRow[] = []
const leavings: LeaveRow[] = []
let careers = 0
let orphanWeeks = 0
let nakedWeeks = 0
let campaignWeeks = 0
let careersWithClothing = 0
let careersWithOrphan = 0

const WEEKS_PER_YEAR = 52

for (const preset of PRESETS) {
  for (const policy of POLICIES) {
    for (let i = 0; i < seeds; i++) {
      const { world, rng } = openCareer(preset, i, policy)
      careers++
      // the kit brand this career was wearing last week, so a CHANGE of house is visible
      let lastKitBrand: string | null = null
      for (let w = 0; w < weeks; w++) {
        answerThePost(world)
        const kit = activeKitDeal(world.offers, world.week)
        const kitBrand = kit ? (kit.terms as KitOfferTerms).brand : null
        const running = signedClothing(world.offers).filter(
          (o) => world.week >= (o.fromWeek ?? o.week) && world.week <= (o.untilWeek ?? -1),
        )
        if (running.length > 0) {
          campaignWeeks++
          // the campaign's own author is live only while a kit deal of the SAME brand is live
          const authored = running.some((o) => (o.terms as AdOfferTerms).brand === kitBrand)
          if (!authored) orphanWeeks++
          if (kitBrand === null) nakedWeeks++
          // THE PRICE'S TRIGGER: a kit deal from a different house signed under a running campaign
          if (kitBrand !== null && lastKitBrand !== kitBrand) {
            for (const c of running) {
              const t = c.terms as AdOfferTerms
              if (t.brand === kitBrand) continue
              const years = Math.max(1, t.termYears ?? 1)
              const from = c.fromWeek ?? c.week
              let left = 0
              for (let k = 1; k < years; k++) if (from + k * WEEKS_PER_YEAR > world.week) left++
              leavings.push({
                preset: preset.label,
                policy: policy.label,
                seed: i,
                week: world.week,
                from: t.brand,
                to: kitBrand,
                leftCents: left * t.cashCents,
              })
            }
          }
        }
        if (kitBrand !== null) lastKitBrand = kitBrand
        stepCareerWeek(world, rng, policy)
      }
      const mine = signedClothing(world.offers)
      if (mine.length > 0) careersWithClothing++
      let anyOrphan = false
      for (const c of mine) {
        const t = c.terms as AdOfferTerms
        const from = c.fromWeek ?? c.week
        const until = c.untilWeek ?? -1
        // the kit deal that authored it: the same brand, live at `from`
        const author = world.offers.find(
          (o) =>
            o.kind === 'kit' &&
            o.state === 'signed' &&
            (o.terms as KitOfferTerms).brand === t.brand &&
            from >= (o.fromWeek ?? o.week) &&
            from <= (o.untilWeek ?? -1),
        )
        const kitUntil = author ? (author.untilWeek ?? null) : null
        const orphan = kitUntil === null ? 0 : Math.max(0, until - kitUntil)
        if (orphan > 0) anyOrphan = true
        campaigns.push({
          preset: preset.label,
          policy: policy.label,
          seed: i,
          brand: t.brand,
          from,
          until,
          kitUntil,
          orphanWeeks: orphan,
        })
      }
      if (anyOrphan) careersWithOrphan++
    }
  }
}

const money = (c: number) => `$${(c / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
const pct = (k: number, n: number) => (n === 0 ? '  n/a' : `${((k / n) * 100).toFixed(1)}%`)

console.log(
  `\nCORPUS: ${PRESETS.length} presets x ${POLICIES.length} policies x ${seeds} seeds = ${careers} careers, ${weeks} weeks each`,
)
console.log('POLICY: the eager parent answers the post – the strongest kit letter, every ad letter\n')

console.log('CAREERS')
console.log(`  with a signed clothing campaign          ${String(careersWithClothing).padStart(4)} of ${careers}   ${pct(careersWithClothing, careers)}`)
console.log(`  in which one OUTLIVED its kit deal       ${String(careersWithOrphan).padStart(4)} of ${careers}   ${pct(careersWithOrphan, careers)}`)

console.log('\nWEEKS')
console.log(`  a signed clothing campaign was running   ${String(campaignWeeks).padStart(6)}`)
console.log(`  ...with its own author NOT dressing her  ${String(orphanWeeks).padStart(6)}   ${pct(orphanWeeks, campaignWeeks)} of campaign weeks`)
console.log(`  ...of those, with NO kit deal at all     ${String(nakedWeeks).padStart(6)}   ${pct(nakedWeeks, campaignWeeks)} of campaign weeks`)

console.log('\nCAMPAIGNS, one row per signed clothing deal')
const orphaned = campaigns.filter((c) => c.orphanWeeks > 0)
console.log(`  signed clothing campaigns               ${String(campaigns.length).padStart(4)}`)
console.log(`  that outlived their kit deal            ${String(orphaned.length).padStart(4)}   ${pct(orphaned.length, campaigns.length)}`)
if (orphaned.length > 0) {
  const spans = orphaned.map((c) => c.orphanWeeks).sort((a, b) => a - b)
  const at = (q: number) => spans[Math.min(spans.length - 1, Math.floor(q * spans.length))]
  console.log(`  outlived by, in weeks: min ${spans[0]} · median ${at(0.5)} · p90 ${at(0.9)} · max ${spans[spans.length - 1]}`)
  const bucket = (lo: number, hi: number) => spans.filter((s) => s >= lo && s <= hi).length
  console.log(`    1-4 weeks   ${String(bucket(1, 4)).padStart(4)}`)
  console.log(`    5-26 weeks  ${String(bucket(5, 26)).padStart(4)}`)
  console.log(`    27-52 weeks ${String(bucket(27, 52)).padStart(4)}`)
  console.log(`    53+ weeks   ${String(bucket(53, 99999)).padStart(4)}`)
}

console.log('\nTHE PRICE OF LEAVING – a kit deal signed with a different house under a running campaign')
console.log(`  events                                  ${String(leavings.length).padStart(4)}`)
if (leavings.length > 0) {
  const withMoney = leavings.filter((l) => l.leftCents > 0)
  console.log(`  ...that would cost money (anniversaries) ${String(withMoney.length).padStart(4)}`)
  const cents = leavings.map((l) => l.leftCents).sort((a, b) => a - b)
  console.log(`  cost left on the table: median ${money(cents[Math.floor(cents.length / 2)])} · max ${money(cents[cents.length - 1])}`)
  for (const l of leavings.slice(0, 12)) {
    console.log(`    w${l.week} ${l.from} -> ${l.to} · ${money(l.leftCents)} · ${l.preset} · ${l.policy} · seed ${l.seed}`)
  }
}

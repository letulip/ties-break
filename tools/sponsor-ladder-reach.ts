/**
 * SPONSOR LADDER REACH – round 29 items 7 and 15, and the question is REACHABILITY, not the catalogue.
 *
 * The owner, off a career at WTA #21 whose inbox holds Quiet Hour, Baseline Athletic, Netrally
 * Distribution and String House: «А что у нас со спонсорами вообще, кстати? Кроме часов за 20к есть
 * ещё кто-то и когда появляется? Мы что-то говорили о больших чеках вроде.» and «И где все наши
 * топовые спонсоры, интересно? … На других аккаунтах я помню один был мощный.»
 *
 * The catalogue is a grep: six rungs in `ECONOMY.sponsorship`, gates in `standingClears`. What a grep
 * CANNOT say is whether the top two of them are ever reached by a career the engine actually
 * produces – and a rung that is theoretically open and empirically never seen is dead content, which
 * is exactly the failure `tools/brand-gate-bench.ts` was written for the first time this happened
 * (the local shop's gate, denominated in a table she did not hold, fired for nobody).
 *
 * SO THIS COUNTS CAREERS, NOT CONSTANTS. Three different questions per rung, kept apart because they
 * have three different answers:
 *
 *   CLEARED  – her standing on a sponsor-window week satisfies `standingClears`. The GATE.
 *   WRITTEN  – a letter from that rung actually landed. The gate AND the dice AND the schedule.
 *   SIGNED   – the parent took it. Under the eager arm below that is "written and not crowded out".
 *
 * ⚠ THE HORIZON IS THE WHOLE INSTRUMENT. `tools/sponsor-window-bench.ts` runs 312 weeks (to age 20)
 * because it measures CONTINUITY, which is legible early. The top rungs are gated on WTA #50 and
 * WTA #10, standings a career reaches – if ever – in its middle twenties, so a 312-week probe cannot
 * see them at all and its silence would be a property of the probe. This one runs to 780 weeks by
 * default: the length of the owner's own save, and age 29.
 *
 * ⚠ THE SIGNING ARM IS DELIBERATELY THE FRIENDLIEST ONE. It signs the strongest live letter the week
 * it lands, so a rung that is never SIGNED here is not being missed by a cautious parent. If even
 * this arm never sees a rung, nobody does.
 *
 * ⚠ MEASUREMENT ONLY. It imports the career loop and the preset ladder from tools/econ-bench.ts, so
 * the world evolution is defined in one place, and it writes nothing to any engine constant. Signing
 * a letter is a player action and taps no MAIN draw (CLAUDE.md invariant 2), so the arms here cannot
 * move the frozen capture.
 *
 * Run:  npx vite-node tools/sponsor-ladder-reach.ts
 *       npx vite-node tools/sponsor-ladder-reach.ts -- --weeks 780 --seeds 6 --json out.json
 */
import { writeFileSync } from 'node:fs'
// ⭐ ROUND 29 PART FOUR P7 – `buyAsset` for the business arm (the engine's own command, so the
// requiresId chain and the wallet guard are the engine's, never re-derived here), and the two
// income folds + fame so the arm can report what the businesses actually did.
import { academyReputationOf, acceptOffer, buyAsset, fameAt, financeWindow, type WorldState } from '../src/engine/world'
import { AD_CATEGORIES, adCategoryOf, isOfferLive, seasonSpokenFor, sponsorWindowOpensAt, windowLadder, SPONSOR_TIERS, TIER_COVERS, standingClears, isSponsorWindowWeek } from '../src/engine/offers'
import { sponsorStandingOf } from '../src/engine/world/sponsors'
// ⚠ THE SHELF IS READ THROUGH ITS OWN LEAF (`world/assets.ts`) AND NOT RE-PRICED HERE. `shopItem`'s
// three numbers – price, rate and upkeep – have exactly one arithmetic in this codebase and it is
// `assetUpkeepCents`; a bench that divided `upkeepBps` by 52 itself would be the second reader of one
// question that `world/assets.ts`' own header forbids.
import { assetUpkeepCents, shopCatalogue } from '../src/engine/world/assets'
import { ECONOMY } from '../src/engine/economy'
import { START_AGE_YEARS } from '../src/engine/world/age'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { AdCategory, AdOfferTerms, KitOfferTerms, SponsorTier, WorldEventCategory } from '../src/shared/protocol'
import { PRESETS, POLICIES, openCareer, stepCareerWeek, type Preset, type Policy } from './econ-bench'

/** Fifteen seasons – the length of the owner's own save (`w780`), and the first horizon on which the
 *  two upper rungs' gates (WTA #50, WTA #10) are reachable by anybody at all. */
const DEFAULT_WEEKS = 780
const DEFAULT_SEEDS = 6

/** Weakest-first, the array's own order – so an index comparison IS a ladder comparison. */
const LADDER: readonly SponsorTier[] = SPONSOR_TIERS

/** ⭐ THE THREE STAGES, in weeks off the career's own zero (`START_AGE_YEARS` = 14). See StageSpend
 *  for why the cuts are ages: 18 is the birthday her cut starts on and 23 is halfway up its ramp. */
const STAGE_CUTS = [
  { label: '14-18 the junior sink', fromWeek: 0, toWeek: 4 * WEEKS_PER_YEAR - 1 },
  { label: '18-23 the climb     ', fromWeek: 4 * WEEKS_PER_YEAR, toWeek: 9 * WEEKS_PER_YEAR - 1 },
  { label: '23-29 the cap years ', fromWeek: 9 * WEEKS_PER_YEAR, toWeek: Number.MAX_SAFE_INTEGER },
] as const

/** ⭐ THE BANDS TENURE WOULD BE COUNTED IN, and they are the advertising ladder's own gates
 *  (`ECONOMY.advertising.houses`: WTA 200 / 50 / 10) plus the #100 the owner named in #20. */
const TENURE_BANDS = [200, 100, 50, 10] as const
const rungIndex = (t: SponsorTier): number => LADDER.indexOf(t)

/** ⭐⭐ ONE SPONSOR WINDOW, AND WHAT THE POST DID IN IT – round 29 part two #12. Recorded on the
 *  window's OPENING week, with the letters of this winter taken out of the question: `raiseKitOffers`
 *  asks `seasonSpokenFor` BEFORE it writes, and asking it against the final offer list would also see
 *  the deal the parent signed later the same winter – so every winter would read "spoken for",
 *  including the ones that plainly produced letters. (That mistake was made once in this file's
 *  `readOneSave` and is written out there too.) */
interface Winter {
  week: number
  /** the rung of the contract that was already covering the season ahead, or null */
  spokenBy: SponsorTier | null
  /** the strongest rung her standing cleared that the running contract turned away, or null */
  blockedTop: SponsorTier | null
  /** how many kit letters the winter actually produced */
  letters: number
}

/** ⭐⭐ ONE SLICE OF A CAREER AND WHAT IT COST – the owner's «расходы уже 200к+» made into a table.
 *
 *  ⚠ THE CUT-POINTS ARE AGES AND NOT RANKS, deliberately, and the difference is the whole reading.
 *  A rank band answers «what does a season at #40 cost», which §5 of docs/research/off-court-money.md
 *  already measured; HIS question is «where does the money go», which is a question about a career
 *  moving through time – a family that never gets ranked still spends, and a rank-banded table
 *  cannot see it. The three cuts are the game's own: the junior sink (14-18, nothing she enters
 *  pays), the climb (18-23, her cut starts at 18 and ramps), and the years the ramp is at its cap
 *  (23-29). */
interface StageSpend {
  label: string
  fromWeek: number
  toWeek: number
  /** signed cents per category, income positive and spend negative – `FinanceWeek`'s own convention. */
  byCategory: Partial<Record<WorldEventCategory, number>>
  /** what she was paid out of the gross in this stage – `FinanceWeek.kidShare.cents`, summed. */
  kidCutCents: number
  /** ...and what those cuts were a share OF (`FinanceWeek.kidShare.baseCents`). Zero before 18. */
  kidCutBaseCents: number
}

interface CareerRow {
  preset: string
  policy: string
  seed: string
  /** the strongest rung her standing cleared on a sponsor-window week, and the week it first did. */
  bestCleared: SponsorTier | null
  bestClearedWeek: number | null
  /** every rung she EVER cleared on a window week. */
  clearedRungs: SponsorTier[]
  /** ...and the first week each of them opened, which is the half of item 7 that asks «когда». */
  firstClearedWeek: Partial<Record<SponsorTier, number>>
  /** every rung that actually wrote her a letter, and the strongest of them. */
  writtenRungs: SponsorTier[]
  bestWritten: SponsorTier | null
  /** every rung she signed. */
  signedRungs: SponsorTier[]
  bestSigned: SponsorTier | null
  /** the best professional standing she ever held while genuinely ranked. */
  bestWtaRank: number | null
  bestItfRank: number | null
  /** the advertising post – «часов за 20к», its own clock and its own gate. */
  adLettersRaised: number
  adSigned: number
  /** ⭐ round 29 part four P6/§8 – which CELLS of the portfolio (category x band) ever wrote, and
   *  which were taken, as 'category@band' keys ('watches@200', 'capstone'). A cell nobody reaches
   *  is not shipped, so these two are what turn a catalogue into a shelf somebody actually sees. */
  adCellsWritten: string[]
  adCellsSigned: string[]
  /** ⭐ round 29 part two #20 – one reading a season of what the last 52 weeks COST her, tagged with
   *  the professional standing she held when it was taken. The denominator of the sizing rule. */
  outgoingsByRank: { rank: number; cents: number }[]
  /** ⭐ round 29 part two #12 – every sponsor window this career lived through and what the post
   *  did in it. */
  winters: Winter[]
  /** what the sponsors actually banked over the career, gross of her cut. */
  sponsorIncomeCents: number
  /** ⭐ 29.08 – the GROSS of every sponsor cheque, before any split. The denominator the commission
   *  ruling is a share of. */
  sponsorGrossCents: number
  /** ...and the ADVERTISING fee, which `sponsorIncomeCents` never counted (a different post). */
  adFeeIncomeCents: number
  /** what the commission arm took back out of the wallet over the career. Zero on the shipped arm. */
  commissionHandedBackCents: number
  /** the single largest sponsor cheque the career ever received. */
  biggestChequeCents: number
  biggestChequeText: string
  /** ⭐⭐ ROUND 29 PART TWO, THE OWNER'S 29.08 REPLY – «Без всех этих пунктов не очень понятно зачем
   *  нам вообще магазин пока что.» The ladder was sized as a share of a stage's outgoings without
   *  anybody ever asking whether the SHELF is reachable, which is the wrong order: the shop is the
   *  sink the advertising money is for, so the sink's price list is the sizing rule's real
   *  denominator. Six numbers, all read off the world at the week they are true.
   *
   *  ⚠ `careerTotals` IS THE ONLY HONEST LIFETIME LEDGER AND THAT IS WHY IT IS USED. `financeWeeks`
   *  prunes to sixty weeks and `events` to four hundred rows, so a horizon-end read of either is a
   *  read of the last season and nothing else – the trap this file's own sponsor-cash scan already
   *  documents. `careerTotals` is accumulated by `accrueFinance` at the moment each row is written
   *  and never pruned. */
  peakFundsCents: number
  peakFundsWeek: number
  endFundsCents: number
  /** every cent that ever came IN to the family wallet, over the whole career. ⚠ ALREADY NET OF HER
   *  CUT: `finalizeTournament` credits the family `prize − herShare`, so this is the parent's side
   *  of the split and `kidFundsCents` is the other. GROSS is the sum of the two. */
  lifetimeEarnedCents: number
  /** ...and every cent that ever went out. */
  lifetimeSpentCents: number
  /** her half of the cheques – `world.kidFundsCents`, the money that left the family wallet for her
   *  own account. The owner: «с учетом 50% отчислений дочери так и вообще доход практически не
   *  ощущается». */
  kidFundsCents: number
  /** ⭐ WHERE THE MONEY WENT, in three stages of a career, signed cents per category. Accumulated
   *  per tick off `financeWeeks`' own row for THIS week, for the pruning reason above. */
  stages: StageSpend[]
  /** ⭐ THE SHELF, RUNG BY RUNG: the first week the wallet held the price, and the first week it held
   *  the price plus a year of the thing's upkeep. Null for a rung the career never came near. */
  affordWeek: Record<string, number | null>
  affordAndCarryWeek: Record<string, number | null>
  /** ⭐ TENURE, and it costs nothing to measure because the world already banks it: how many SEASONS
   *  this career ended inside each professional band (`seasonHistory[].byTrack.wta.endRank`). */
  seasonsInTop: Record<number, number>
  endedWeek: number | null
  weeksRun: number
  /** ⭐ ROUND 29 PART FOUR P7, the business arm (`--buy-business`) – what the parent's own
   *  businesses did over the career. All zero / null on the default arm, which buys nothing. */
  merchBoughtWeek: number | null
  academyDoneWeek: number | null
  merchIncomeCents: number
  academyIncomeCents: number
  /** the week the academy's own income first covered its $12M build, or null if it never did */
  academyPaybackWeek: number | null
  endReputation: number
  endFame: number
}

/** THE THREE CASH LINES A BRAND WRITES, and they are the sponsor bench's own three regexes rather
 *  than new ones – `payRetainer`, `appearanceFeeFor` and `resultBonusFor` are the only producers, so
 *  two files reading the ledger differently would be two answers to one question. The kit allowance
 *  and the travel share are NOT cash and are deliberately absent: they are bills the brand did not
 *  send, which is a different sentence from a cheque it did. */
// ⚠⚠ THE FIRST OF THESE WAS END-ANCHORED AND MATCHED NOTHING, AND IT IS THE MEASUREMENT BEHIND A
// HEADLINE. `bankSponsorCheque` APPENDS «, less her N% share ($X)» to every row it splits, from her
// eighteenth birthday onward – and the rungs that pay a retainer at all gate on WTA #200, first
// cleared at 18-20, so in practice EVERY retainer row carries the suffix and `/…quarterly$/` saw
// none of them. Probed on one wealthy/player career over 780 weeks: **0 matched, 32 missed.** The
// other two were prefix-anchored and were never affected, which is why the figure looked plausible.
// ⚠ So round 29 part two #12's «career sponsor cash: median $1,942,862 -> $4,321,847» was measured
// with the retainer line MISSING. The doubling is real – both arms had the same blind spot – but the
// LEVEL was understated. Corrected here and re-reported in the ledger.
const RETAINER_RE = / retainer – quarterly(?:,|$)/
const APPEARANCE_RE = /^Appearance fee – /
const BONUS_RE = /^Sponsor bonus – /
/** ⭐ THE ADVERTISING FEE, WHICH WAS NEVER IN THE THREE ABOVE AT ALL. It is a different post and
 *  `sponsorIncomeCents` means «what the KIT brands paid», so it is counted separately rather than
 *  folded in – but it goes through the same `bankSponsorCheque` and is therefore subject to the same
 *  share ruling, which is the only reason this file needs to see it. */
const AD_FEE_RE = / endorsement – the campaign fee, on signing(?:,|$)/
/** ⭐ P6's multi-year deals pay again on each anniversary (`payAdAnniversaries`) – a second row
 *  shape on the same post, counted with the signature fee or the ad line under-reports every
 *  multi-year deal by (years − 1) years of money. */
const AD_YEAR_RE = / endorsement – year \d+ of \d+(?:,|$)/
/** ⭐⭐ HER SHARE, READ OFF THE ROW THAT PAID IT AND NEVER RE-DERIVED. `bankSponsorCheque` writes the
 *  cents it actually credited her into the text; `family + herCents` is the gross cheque TO THE CENT,
 *  where `family / (1 - bps/10000)` is a division on a figure that was rounded once on the way in –
 *  the exact arithmetic `kidPrizeShareCents`' own comment forbids. */
const HER_SHARE_RE = /, less her [\d.]+% share \(\$([\d,]+(?:\.\d\d)?)\)$/
function grossOfSponsorRow(text: string, familyCents: number): number {
  const m = HER_SHARE_RE.exec(text)
  if (!m) return familyCents
  return familyCents + Math.round(Number(m[1].replace(/,/g, '')) * 100)
}

/** Sign the strongest live kit letter AND every live advertising letter, the week they land.
 *  ⚠ EVERY ad letter and not one, since the portfolio (P6): the categories are independent slots
 *  and the eager arm's whole job is «if even this arm never sees a cell, nobody does». */
function answerThePost(
  world: WorldState,
  signedRungs: Set<SponsorTier>,
  adSigned: { n: number },
  adSignedCells: Set<string>,
): void {
  const live = world.offers.filter((o) => (o.kind === 'kit' || o.kind === 'ad') && isOfferLive(o, world.week))
  if (live.length === 0) return
  const kit = live.filter((o) => o.kind === 'kit')
  const best = [...kit].sort(
    (a, b) => rungIndex((b.terms as KitOfferTerms).tier) - rungIndex((a.terms as KitOfferTerms).tier),
  )[0]
  const targets = [...(best ? [best] : []), ...live.filter((o) => o.kind === 'ad')]
  for (const target of targets) {
    try {
      acceptOffer(world, target.id)
      if (target.kind === 'kit') signedRungs.add((target.terms as KitOfferTerms).tier)
      else {
        adSigned.n++
        adSignedCells.add(adCellOf(target.terms as AdOfferTerms))
      }
    } catch {
      // A career that has ended – or a deal that is already spoken for – refuses. That is the engine
      // re-validating, which is the point of asking it rather than deciding here.
    }
  }
}

/** 'category@band' for a letter, the band read back off the letter's own frozen fee – the cells are
 *  distinct per category, so the match is exact. The capstone and the historical single-post
 *  letters are their own keys. */
function adCellOf(terms: AdOfferTerms): string {
  const category = adCategoryOf(terms)
  if (category === 'capstone') return 'capstone'
  if (!terms.category) return `${category}@legacy`
  const bands = ECONOMY.advertising.bands
  const fees = ECONOMY.advertising.categories[category as Exclude<AdCategory, 'capstone'>].feeCentsByBand
  const at = fees.findIndex((f) => f === terms.cashCents)
  return `${category}@${at >= 0 ? bands[at].maxWtaRank : '?'}`
}

function runCareer(
  preset: Preset,
  policy: Policy,
  index: number,
  weeks: number,
  /** ⭐ ROUND 29 PART TWO, 29.08 – the manager's commission in basis points, or null for the shipped
   *  rule (her age ramp). See the withdrawal inside the loop for what it does and does not model. */
  commissionBps: number | null = null,
  /** ⭐ ROUND 29 PART FOUR P7 – the BUSINESS arm: eagerly start the merch brand and build the
   *  academy's four stages, each the first week the wallet holds TWICE its price (the eager arm's
   *  own friendliness with the one prudence a real parent has – never the last dollar). Purchases
   *  are player actions through `buyAsset`, so they tap no MAIN draw; the careers do diverge from
   *  the default arm downstream (a poorer wallet enters differently), which is why this is a bench
   *  arm and not a paired A/B on one seed – the commission arm's own note, one parameter up. */
  buyBusiness = false,
): CareerRow {
  const { world, rng, seed } = openCareer(preset, index, policy)
  const cleared = new Set<SponsorTier>()
  const written = new Set<SponsorTier>()
  const adWritten = new Set<string>()
  const signed = new Set<SponsorTier>()
  const firstClearedWeek: Partial<Record<SponsorTier, number>> = {}
  const adSigned = { n: 0 }
  const adSignedCells = new Set<string>()
  const winters: Winter[] = []
  const outgoingsByRank: { rank: number; cents: number }[] = []
  let bestCleared: SponsorTier | null = null
  let bestClearedWeek: number | null = null
  let bestWtaRank: number | null = null
  let bestItfRank: number | null = null
  let sponsorIncomeCents = 0
  let sponsorGrossCents = 0
  let adFeeIncomeCents = 0
  let commissionHandedBackCents = 0
  let biggestChequeCents = 0
  let biggestChequeText = ''
  let ran = 0
  // ⭐ THE SHELF'S OWN READINGS. `peakFunds` starts at the wallet's opening balance rather than at 0,
  // so a family that never banks a cent still reports what it actually had.
  let peakFundsCents = world.fundsCents
  let peakFundsWeek = world.week
  const stages: StageSpend[] = STAGE_CUTS.map((s) => ({ ...s, byCategory: {}, kidCutCents: 0, kidCutBaseCents: 0 }))
  const affordWeek: Record<string, number | null> = {}
  const affordAndCarryWeek: Record<string, number | null> = {}
  for (const item of shopCatalogue()) {
    affordWeek[item.id] = null
    affordAndCarryWeek[item.id] = null
  }
  // ⭐ the business arm's own readings – see the parameter note above.
  const BUSINESS_LADDER = ['merch-brand', 'academy-land', 'academy-courts', 'academy-building', 'academy-staff']
  let merchBoughtWeek: number | null = null
  let academyDoneWeek: number | null = null
  let merchIncomeCents = 0
  let academyIncomeCents = 0
  let academyPaybackWeek: number | null = null

  for (let i = 0; i < weeks; i++) {
    const week = world.week
    stepCareerWeek(world, rng, policy)
    ran++
    // ⚠ WHAT THE BRANDS PAID, SCANNED AT THE WEEK IT IS WRITTEN AND NOT AT THE END. `world.events`
    // is pruned at 400 ROWS, so an index that only ever grows walks off the end of a career this
    // long and reports ZERO for every rung – which is exactly what the first run of this file did.
    // The sponsor bench dodges the same trap the same way.
    for (const row of world.events) {
      if (row.week !== week || row.type !== 'income') continue
      const amount = row.amountCents ?? 0
      if (amount <= 0) continue
      // ⭐ P7 – the businesses' own two lines, split by the row's category and its own first word
      // (`resolveBusinessIncome` writes exactly two shapes). Counted apart from the sponsor cash:
      // a business is the PARENT's income, not a brand's cheque, and folding them would re-create
      // the «ad fee inside sponsorIncomeCents» confusion this file already had to unpick once.
      if (row.category === 'business') {
        if (row.text.startsWith('Merch')) merchIncomeCents += amount
        else {
          academyIncomeCents += amount
          if (academyPaybackWeek === null && academyIncomeCents >= 12_000_000_00) academyPaybackWeek = week
        }
        continue
      }
      const isKitCash = RETAINER_RE.test(row.text) || APPEARANCE_RE.test(row.text) || BONUS_RE.test(row.text)
      const isAdFee = AD_FEE_RE.test(row.text) || AD_YEAR_RE.test(row.text)
      if (!isKitCash && !isAdFee) continue
      // ⭐⭐ THE SHARE RULING, SIMULATED IN THE BENCH AND NOWHERE ELSE (the owner, 29.08: «контракт на
      // полную сумму ребенку приходит на почту, после подписания видим на счету уже родительский
      // кат», at «10-20% например»). Today `bankSponsorCheque` credits the family `gross − her ramp
      // share`, so the parent keeps 100% before her eighteenth and 50% from her twenty-sixth. Under
      // the ruling the parent keeps a flat commission and the rest is hers.
      //
      // ⚠⚠ THIS IS A REAL B ARM AND NOT A SUBTRACTION AFTERWARDS. The money is taken OUT of the
      // wallet the week it lands, so the career that follows is genuinely poorer – its reserve is
      // smaller, and `reserveFor` gates coach rungs and entries off exactly that. A static
      // re-attribution at the end would have reported the money and none of the consequence.
      // ⚠ It writes cents and taps NO draw, so it cannot move the frozen MAIN capture. It does make
      // the two arms diverge in the MAIN sequence downstream (a career that enters fewer events rolls
      // different dice), which is why this is a bench arm and not a paired A/B on one seed.
      const grossCents = grossOfSponsorRow(row.text, amount)
      sponsorGrossCents += grossCents
      if (isKitCash) sponsorIncomeCents += amount
      else adFeeIncomeCents += amount
      if (commissionBps !== null) {
        const kept = Math.round((grossCents * commissionBps) / 10_000)
        const handedBack = amount - kept
        if (handedBack > 0) {
          world.fundsCents -= handedBack
          commissionHandedBackCents += handedBack
        }
      }
      if (amount > biggestChequeCents) {
        biggestChequeCents = amount
        biggestChequeText = row.text
      }
    }
    // ⚠ READ AFTER THE TICK AND KEYED ON `week`, THE WEEK THAT WAS JUST PLAYED. `stepCareerWeek`
    // advances the clock, so `world.week` is already the NEXT week here and a fold keyed on it would
    // find nothing and report a career that spent nothing – which is exactly the shape of the null
    // this file's own event scan is written against. `financeWeeks` prunes to a sixty-week trailing
    // window, so the row has to be folded the week it is written or it is gone.
    const fw = world.financeWeeks.find((r) => r.week === week)
    if (fw) {
      const stage = stages.find((s) => week >= s.fromWeek && week <= s.toWeek)
      if (stage) {
        for (const [cat, amt] of Object.entries(fw.byCategory) as [WorldEventCategory, number][]) {
          stage.byCategory[cat] = (stage.byCategory[cat] ?? 0) + amt
        }
        stage.kidCutCents += fw.kidShare?.cents ?? 0
        stage.kidCutBaseCents += fw.kidShare?.baseCents ?? 0
      }
    }
    // ⭐⭐ CAN THE FAMILY BUY THE THING, AND CAN IT KEEP THE THING – two different questions, and the
    // second is the one the elite shelf turns on. A yacht is $12,000,000 and $23,077 A WEEK; a
    // family that can just afford the hull and not the crew has not reached the rung, it has reached
    // a bill. `assetUpkeepCents` is the shelf's own arithmetic rather than a second one here.
    if (world.fundsCents > peakFundsCents) {
      peakFundsCents = world.fundsCents
      peakFundsWeek = week
    }
    for (const item of shopCatalogue()) {
      if (affordWeek[item.id] === null && world.fundsCents >= item.entryCents) affordWeek[item.id] = week
      const carry = item.entryCents + assetUpkeepCents(item, item.entryCents) * WEEKS_PER_YEAR
      if (affordAndCarryWeek[item.id] === null && world.fundsCents >= carry) affordAndCarryWeek[item.id] = week
    }
    // ⭐⭐ P7 – THE BUSINESS ARM BUYS, in the ladder's own order, half the wallet always kept. The
    // engine's `buyAsset` re-validates the price and the academy's requiresId chain, so a refusal
    // is the engine's and never this file's guess.
    if (buyBusiness) {
      for (const id of BUSINESS_LADDER) {
        if (world.assets.some((a) => a.id === id)) continue
        const item = shopCatalogue().find((r) => r.id === id)
        if (!item || world.fundsCents < item.entryCents * 2) continue
        try {
          buyAsset(world, id)
          if (id === 'merch-brand') merchBoughtWeek = week
          if (id === 'academy-staff') academyDoneWeek = week
        } catch {
          // an ended career refuses; the engine said so, which is the point of asking it
        }
      }
    }
    const standing = sponsorStandingOf(world)
    if (standing.wtaRanked && (bestWtaRank === null || standing.wtaRank < bestWtaRank)) {
      bestWtaRank = standing.wtaRank
    }
    if (standing.itfRanked && (bestItfRank === null || standing.itfRank < bestItfRank)) {
      bestItfRank = standing.itfRank
    }
    // THE GATE, asked only on the weeks it can produce anything. A standing held in April is not a
    // rung reached: `raiseKitOffers` refuses outside the window, so counting it would inflate every
    // figure below with standings no brand was ever in a position to read.
    // ⭐⭐ THE WINTER CENSUS – round 29 part two #12, taken on the window's OPENING week and BEFORE
    // this winter's own letters exist, which is the only reading `raiseKitOffers` itself takes.
    if (isSponsorWindowWeek(world.week) && sponsorWindowOpensAt(world.week) === world.week) {
      const before = world.offers.filter((o) => o.week < world.week)
      const spoken = seasonSpokenFor(before, world.week)
      const spokenBy = spoken ? ((spoken.terms as KitOfferTerms).tier ?? null) : null
      const ladder = windowLadder(standing)
      winters.push({
        week: world.week,
        spokenBy,
        blockedTop:
          spokenBy && ladder.length > 0 && rungIndex(ladder[0]) > rungIndex(spokenBy) ? ladder[0] : null,
        letters: 0,
      })
      // ...and what the season just gone COST, tagged with the standing she holds today. One reading
      // a year, so a band is counted once per season rather than fifty-two times.
      if (standing.wtaRanked && world.week >= WEEKS_PER_YEAR) {
        outgoingsByRank.push({
          rank: standing.wtaRank,
          cents: financeWindow(world.financeWeeks, world.week - (WEEKS_PER_YEAR - 1)).expenseCents,
        })
      }
    }
    if (isSponsorWindowWeek(world.week)) {
      for (const tier of LADDER) {
        if (!standingClears(standing, tier)) continue
        cleared.add(tier)
        if (firstClearedWeek[tier] === undefined) firstClearedWeek[tier] = world.week
        if (bestCleared === null || rungIndex(tier) > rungIndex(bestCleared)) {
          bestCleared = tier
          bestClearedWeek = world.week
        }
      }
    }
    // THE POST, read off the world's own offer list rather than off a return value, so a letter
    // raised by any path is seen.
    for (const o of world.offers) {
      if (o.kind === 'kit') written.add((o.terms as KitOfferTerms).tier)
      if (o.kind === 'ad') adWritten.add(adCellOf(o.terms as AdOfferTerms))
    }
    answerThePost(world, signed, adSigned, adSignedCells)
    if (world.ending) break
  }

  const adLetters = world.offers.filter((o) => o.kind === 'ad')
  // Kit letters are never pruned, so each winter's own count is a complete reconstruction.
  for (const w of winters) {
    w.letters = world.offers.filter(
      (o) => o.kind === 'kit' && o.state !== 'info' && o.week >= w.week && o.week < w.week + 5,
    ).length
  }
  return {
    preset: preset.label,
    policy: policy.label,
    seed,
    bestCleared,
    bestClearedWeek,
    clearedRungs: LADDER.filter((t) => cleared.has(t)),
    firstClearedWeek,
    writtenRungs: LADDER.filter((t) => written.has(t)),
    bestWritten: LADDER.filter((t) => written.has(t)).slice(-1)[0] ?? null,
    signedRungs: LADDER.filter((t) => signed.has(t)),
    bestSigned: LADDER.filter((t) => signed.has(t)).slice(-1)[0] ?? null,
    bestWtaRank,
    bestItfRank,
    adLettersRaised: adLetters.length,
    adSigned: adSigned.n,
    adCellsWritten: [...adWritten].sort(),
    adCellsSigned: [...adSignedCells].sort(),
    outgoingsByRank,
    winters,
    sponsorIncomeCents,
    sponsorGrossCents,
    adFeeIncomeCents,
    commissionHandedBackCents,
    biggestChequeCents,
    biggestChequeText,
    peakFundsCents,
    peakFundsWeek,
    endFundsCents: world.fundsCents,
    // ⚠ `?? 0` FOR A CAREER THAT NEVER BANKED A ROW, which is a real state on the junior arm and not
    // a defensive shrug: `careerTotals` is created lazily by `accrueFinance`'s own `??=`.
    lifetimeEarnedCents: world.careerTotals?.earnedCents ?? 0,
    lifetimeSpentCents: world.careerTotals?.spentCents ?? 0,
    kidFundsCents: world.kidFundsCents ?? 0,
    stages,
    affordWeek,
    affordAndCarryWeek,
    // ⭐⭐ TENURE, READ OFF WHAT THE WORLD ALREADY BANKS. `seasonHistory[].byTrack.wta.endRank` is the
    // professional place she held at each season's wrap – appended once a year at `wrapSeason`,
    // capped at 30 seasons (a 15-season career never reaches it) and NEVER pruned by the 60-week
    // finance window or the 400-row event cap. So «years spent in the top 100» is a fold over an
    // existing field and not a schema question at SEASON granularity. ⚠ `byTrack` is optional (v46);
    // absent means «not recorded», never «unranked», so a missing row is skipped rather than counted.
    seasonsInTop: Object.fromEntries(
      TENURE_BANDS.map((cut) => [
        cut,
        world.seasonHistory.filter((h) => {
          const r = h.byTrack?.wta?.endRank
          return r !== undefined && r <= cut
        }).length,
      ]),
    ),
    endedWeek: world.ending ? world.week : null,
    weeksRun: ran,
    merchBoughtWeek,
    academyDoneWeek,
    merchIncomeCents,
    academyIncomeCents,
    academyPaybackWeek,
    endReputation: academyReputationOf(world),
    endFame: fameAt(world),
  }
}

const usd = (cents: number) => `$${Math.round(cents / 100).toLocaleString('en-US')}`
const pct = (n: number, d: number) => (d === 0 ? '  –  ' : `${((100 * n) / d).toFixed(0)}%`.padStart(5))

/** ⚠ ONE SAVE, READ-ONLY, AS ONE DATA POINT AND NEVER AS THE POPULATION. The owner asks these two
 *  questions off a career he is playing, and the career he is playing is one seed - so it can say
 *  where HE is on the ladder and it cannot say what the ladder does. Nothing is written back and
 *  nothing but rungs, brands and a rank is printed: the save is personal and stays in his Downloads.
 *
 *  Run with `--save ~/Downloads/<file>.tsave`. */
async function readOneSave(path: string): Promise<void> {
  const { decodeExportFile } = await import('../src/engine/saveCodec')
  const { readFileSync } = await import('node:fs')
  const bytes = readFileSync(path.replace('~', process.env.HOME ?? ''))
  const world = (await decodeExportFile(new Uint8Array(bytes))) as WorldState
  const standing = sponsorStandingOf(world)
  console.log(`\nONE SAVE – week ${world.week} (age ${(START_AGE_YEARS + world.week / WEEKS_PER_YEAR).toFixed(1)})`)
  console.log(
    `  standing: WTA ${standing.wtaRanked ? `#${standing.wtaRank}` : 'unranked'}` +
      ` · ITF ${standing.itfRanked ? `#${standing.itfRank}` : 'unranked'}` +
      ` · national #${standing.nationalRank}`,
  )
  console.log('  rung        clears?  letters held')
  for (const tier of LADDER) {
    const mine = world.offers.filter((o) => o.kind === 'kit' && (o.terms as KitOfferTerms).tier === tier)
    const states = mine.map((o) => `${o.id}:${o.state}`).join(' ') || '–'
    console.log(`  ${tier.padEnd(11)} ${(standingClears(standing, tier) ? 'YES' : 'no ').padEnd(8)} ${states}`)
  }
  const ads = world.offers.filter((o) => o.kind === 'ad')
  console.log(`  advertising: ${ads.length} letter(s) – ${ads.map((o) => `${o.id}:${o.state}`).join(' ') || '–'}`)

  // ⚠ AND WHY A RUNG HE CLEARS MAY NEVER HAVE WRITTEN – the winters, one line each. `raiseKitOffers`
  // returns EMPTY the moment the season ahead is already promised («one brand at a time»,
  // `seasonSpokenFor`), so a multi-season deal signed once shuts the whole post for as long as it
  // runs. That is the rule having its bite and not a fault, but it is invisible from the inbox: the
  // winters it ate look exactly like winters nobody wrote in. Kit letters are never pruned, so this
  // is a complete reconstruction from the save's own offer list.
  const { seasonSpokenFor, sponsorWindowOpensAt } = await import('../src/engine/offers')
  console.log('\n  every sponsor window of this career, and what the post did:')
  for (let w = WEEKS_PER_YEAR - 5; w <= world.week; w += WEEKS_PER_YEAR) {
    const opened = sponsorWindowOpensAt(w)
    // ⚠⚠ THE QUESTION IS ASKED WITH THE LETTERS OF THIS WINTER TAKEN OUT, and the first draft of
    // this loop did not do that and was therefore wrong on every line. `raiseKitOffers` asks
    // `seasonSpokenFor` BEFORE it writes; asked against the FINAL offer list it also sees the deal
    // the parent signed later the same winter, whose term by construction reaches into the season
    // ahead - so every winter reads "spoken for", including the ones that plainly produced letters.
    // A letter's `week` is its arrival, so dropping the ones that arrived on or after the opening
    // week is exactly the state the schedule read.
    const before = world.offers.filter((o) => o.week < opened)
    const spoken = seasonSpokenFor(before, opened)
    const spokenTier = spoken ? (spoken.terms as KitOfferTerms).tier : null
    const raised = world.offers.filter(
      (o) => o.kind === 'kit' && o.week >= opened && o.week < opened + 5 && !o.id.startsWith('kit-end'),
    )
    const what = raised.map((o) => `${(o.terms as KitOfferTerms).tier}:${o.state}`).join(' ')
    console.log(
      `    w${String(opened).padStart(3)} ${spokenTier ? `SPOKEN FOR by ${spokenTier}`.padEnd(28) : 'post open'.padEnd(28)} ${what || '(nothing)'}`,
    )
  }
}

export function main(argv: string[] = process.argv.slice(2)): void {
  const arg = (name: string, fallback: number): number => {
    const i = argv.indexOf(name)
    return i >= 0 ? Number(argv[i + 1]) : fallback
  }
  const saveAt = argv.indexOf('--save')
  if (saveAt >= 0) {
    void readOneSave(argv[saveAt + 1])
    return
  }
  const weeks = arg('--weeks', DEFAULT_WEEKS)
  const seeds = arg('--seeds', DEFAULT_SEEDS)
  const jsonAt = argv.indexOf('--json')
  // ⭐ `--commission 15` runs the 29.08 ruling instead of the shipped ramp: sponsor money is HERS and
  // the parent keeps 15% of the gross. Absent = the shipped rule, byte for byte.
  const commissionAt = argv.indexOf('--commission')
  const commissionBps = commissionAt >= 0 ? Math.round(Number(argv[commissionAt + 1]) * 100) : null
  // ⭐ ROUND 29 PART FOUR P7 – `--buy-business` runs the business arm: every career eagerly starts
  // the merch brand and builds the academy (half the wallet always kept). Absent = the shipped
  // world, byte for byte, which is what the published kit/ad figures are checked against.
  const buyBusiness = argv.includes('--buy-business')

  const rows: CareerRow[] = []
  for (const preset of PRESETS) {
    for (const policy of POLICIES) {
      for (let i = 0; i < seeds; i++) rows.push(runCareer(preset, policy, i, weeks, commissionBps, buyBusiness))
    }
  }

  const n = rows.length
  console.log(`\nSPONSOR LADDER REACH – ${n} careers x ${weeks} weeks (to age ${START_AGE_YEARS + Math.floor(weeks / WEEKS_PER_YEAR)})`)
  console.log(
    `${PRESETS.length} presets x ${POLICIES.length} policies x ${seeds} seeds, eager signing` +
      (commissionBps === null
        ? '  ·  SHIPPED share rule (her age ramp on every sponsor cheque)\n'
        : `  ·  ⭐ COMMISSION ARM: sponsor money is HERS, the parent keeps ${commissionBps / 100}%\n`),
  )

  console.log('  rung        brand                  gate                        cleared  written   signed')
  const gateOf: Record<SponsorTier, string> = {
    local: `national #${ECONOMY.sponsorship.maxRank} / ITF #${ECONOMY.sponsorship.localMaxItfRank} / any W`,
    national: `ITF #${ECONOMY.sponsorship.national.maxItfRank} or WTA #${ECONOMY.sponsorship.national.maxWtaRank}`,
    tour: `WTA #${ECONOMY.sponsorship.tour.maxWtaRank}`,
    global: `ITF #${ECONOMY.sponsorship.global.maxItfRank} or WTA #${ECONOMY.sponsorship.global.maxWtaRank}`,
    premium: `WTA #${ECONOMY.sponsorship.premium.maxWtaRank}`,
    icon: `WTA #${ECONOMY.sponsorship.icon.maxWtaRank}`,
  }
  const brandOf: Record<SponsorTier, string> = {
    local: ECONOMY.sponsorship.localBrand,
    national: ECONOMY.sponsorship.national.brand,
    tour: ECONOMY.sponsorship.tour.brand,
    global: ECONOMY.sponsorship.global.brand,
    premium: ECONOMY.sponsorship.premium.brand,
    icon: ECONOMY.sponsorship.icon.brand,
  }
  for (const tier of LADDER) {
    const cleared = rows.filter((r) => r.clearedRungs.includes(tier)).length
    const written = rows.filter((r) => r.writtenRungs.includes(tier)).length
    const signedN = rows.filter((r) => r.signedRungs.includes(tier)).length
    console.log(
      `  ${tier.padEnd(11)} ${brandOf[tier].padEnd(22)} ${gateOf[tier].padEnd(27)} ` +
        `${String(cleared).padStart(3)} ${pct(cleared, n)}  ${String(written).padStart(3)} ${pct(written, n)}  ${String(signedN).padStart(3)} ${pct(signedN, n)}`,
    )
  }

  // ⚠⚠ AND THE LADDER'S OWN SAFETY PROMISE, CHECKED RATHER THAN ASSUMED. `windowLadder`'s header
  // states it outright: strongest-first ordering exists so that «signing on sight is always safe and
  // waiting always optional». That is only true if a rung listed ABOVE another is worth at least as
  // much, and nothing in the codebase checks it. Read straight off `ECONOMY.sponsorship` – no
  // simulation can make this clearer than the constants do.
  console.log('\n  WHAT EACH RUNG IS WORTH IN A SEASON, weakest-first – the ordering`s own promise:')
  console.log('    rung        kit/season  retainer/season  appearance  bonus       travel  lines  seasons')
  const S = ECONOMY.sponsorship
  const money: Record<SponsorTier, { kit: number; retainer: number; appearance: number; bonus: number; travel: number; lines: number; seasons: number }> = {
    local: { kit: S.seasonCents, retainer: 0, appearance: 0, bonus: 0, travel: 0, lines: TIER_COVERS.local.length, seasons: 1 },
    national: { kit: S.national.seasonCents, retainer: 0, appearance: 0, bonus: 0, travel: 0, lines: TIER_COVERS.national.length, seasons: S.national.seasons },
    tour: { kit: S.tour.seasonCents, retainer: S.tour.retainerCents * 4, appearance: 0, bonus: S.tour.bonusShare, travel: S.tour.travelShare, lines: TIER_COVERS.tour.length, seasons: S.tour.seasons },
    // ⭐ ROUND 29 PART TWO #5 – global carries a retainer and a bonus now, and this row was reading
    // ZERO for both because it was hand-built when they did not exist. A table that prints the
    // domination warning off stale figures is worse than no table: it was still flagging the defect
    // for a whole run AFTER the ruling shipped.
    global: { kit: S.global.seasonCents, retainer: S.global.retainerCents * 4, appearance: 0, bonus: S.global.bonusShare, travel: S.global.travelShare, lines: TIER_COVERS.global.length, seasons: S.global.seasons },
    premium: { kit: S.premium.seasonCents, retainer: S.premium.retainerCents * 4, appearance: S.premium.appearanceFeeCents, bonus: S.premium.bonusShare, travel: S.premium.travelShare, lines: TIER_COVERS.premium.length, seasons: S.premium.seasons },
    icon: { kit: S.icon.seasonCents, retainer: S.icon.retainerCents * 4, appearance: S.icon.appearanceFeeCents, bonus: S.icon.bonusShare, travel: S.icon.travelShare, lines: TIER_COVERS.icon.length, seasons: S.icon.seasons },
  }
  for (const tier of LADDER) {
    const m = money[tier]
    console.log(
      `    ${tier.padEnd(11)} ${usd(m.kit).padStart(10)}  ${usd(m.retainer).padStart(15)}  ` +
        `${(m.appearance ? usd(m.appearance) : '–').padStart(10)}  ${(m.bonus ? `${Math.round(m.bonus * 100)}%` : '–').padStart(10)}  ` +
        `${`${Math.round(m.travel * 100)}%`.padStart(6)}  ${String(m.lines).padStart(5)}  ${String(m.seasons).padStart(7)}`,
    )
  }
  // A rung is DOMINATED when the rung immediately below it pays at least as much on every axis and
  // more on one. That is precisely the case the strongest-first order promises cannot exist.
  for (let i = 1; i < LADDER.length; i++) {
    const hi = money[LADDER[i]]
    const lo = money[LADDER[i - 1]]
    const worseOn = (['kit', 'retainer', 'appearance', 'bonus', 'travel', 'lines'] as const).filter((k) => hi[k] < lo[k])
    if (worseOn.length > 0) {
      console.log(
        `    ⚠ ${LADDER[i]} is presented ABOVE ${LADDER[i - 1]} and pays LESS on: ${worseOn.join(', ')}` +
          ` – and locks ${hi.seasons} seasons against ${lo.seasons}`,
      )
    }
  }

  console.log('\n  WHEN a rung opens, over the careers that ever cleared it (his «когда появляется»):')
  for (const tier of LADDER) {
    const at = rows.map((r) => r.firstClearedWeek[tier]).filter((w): w is number => w !== undefined).sort((a, b) => a - b)
    if (at.length === 0) {
      console.log(`    ${tier.padEnd(9)} never`)
      continue
    }
    const age = (w: number) => (START_AGE_YEARS + w / WEEKS_PER_YEAR).toFixed(1)
    const med = at[Math.floor(at.length / 2)]
    console.log(
      `    ${tier.padEnd(9)} earliest week ${String(at[0]).padStart(3)} (age ${age(at[0])})` +
        `   median week ${String(med).padStart(3)} (age ${age(med)})   n=${at.length}`,
    )
  }

  console.log('\n  the STRONGEST rung each career ever reached (its ceiling):')
  for (const tier of [...LADDER].reverse()) {
    const top = rows.filter((r) => r.bestCleared === tier)
    if (top.length === 0) {
      console.log(`    ${tier.padEnd(9)} 0 careers`)
      continue
    }
    const weeksTo = top.map((r) => r.bestClearedWeek ?? 0).sort((a, b) => a - b)
    console.log(
      `    ${tier.padEnd(9)} ${String(top.length).padStart(3)} careers ${pct(top.length, n)}` +
        `  first cleared at week ${weeksTo[0]} (age ${(START_AGE_YEARS + weeksTo[0] / WEEKS_PER_YEAR).toFixed(1)})`,
    )
  }
  const none = rows.filter((r) => r.bestCleared === null).length
  console.log(`    ${'(none)'.padEnd(9)} ${String(none).padStart(3)} careers ${pct(none, n)}`)

  const ranked = rows.filter((r) => r.bestWtaRank !== null).map((r) => r.bestWtaRank!).sort((a, b) => a - b)
  console.log(`\n  best professional standing ever held – ${ranked.length}/${n} careers were ever W-ranked`)
  if (ranked.length > 0) {
    const at = (q: number) => ranked[Math.min(ranked.length - 1, Math.floor(q * ranked.length))]
    console.log(`    best #${ranked[0]}   p10 #${at(0.1)}   median #${at(0.5)}   p90 #${at(0.9)}   worst #${ranked[ranked.length - 1]}`)
    for (const cut of [ECONOMY.sponsorship.icon.maxWtaRank, ECONOMY.sponsorship.premium.maxWtaRank, ECONOMY.sponsorship.tour.maxWtaRank]) {
      console.log(`    ever inside WTA #${String(cut).padStart(3)}: ${String(ranked.filter((r) => r <= cut).length).padStart(3)} careers ${pct(ranked.filter((r) => r <= cut).length, n)}`)
    }
  }

  const adRows = rows.filter((r) => r.adLettersRaised > 0)
  console.log(
    `\n  the advertising post (age ${ECONOMY.advertising.fromAgeYears}+):` +
      ` ${adRows.length}/${n} careers written to ${pct(adRows.length, n)}, ` +
      `${rows.reduce((s, r) => s + r.adLettersRaised, 0)} letters in all`,
  )

  // ⭐⭐ ROUND 29 PART FOUR P6/§8 – THE SHELF HE ORDERED, CELL BY CELL, AND WHETHER ANYBODY SEES IT.
  //
  // «на каждой ступени может быть до 4-6 одновременно, только с разными чеками» – so the table is
  // category x band: the fee each cell writes, and the share of careers a letter from that cell ever
  // reached (written) and was taken by (signed). A cell nobody reaches is not content – the same
  // discipline the kit table above keeps. The capstone is its own row: tenure-gated, not rank-gated.
  console.log('\n  ⭐ THE ADVERTISING PORTFOLIO – fee per cell, and how often each cell is actually seen:')
  {
    const bands = ECONOMY.advertising.bands
    const catKeys = AD_CATEGORIES.filter((c): c is Exclude<AdCategory, 'capstone'> => c !== 'capstone')
    console.log(`    category    houses${' '.repeat(30)}${bands.map((b) => `<=${String(b.maxWtaRank).padEnd(10)}`).join('')}`)
    for (const c of catKeys) {
      const def = ECONOMY.advertising.categories[c]
      const cells = bands.map((b, i) => {
        const fee = def.feeCentsByBand[i]
        if (fee === null) return '–'.padEnd(12)
        const written = rows.filter((r) => r.adCellsWritten.includes(`${c}@${b.maxWtaRank}`)).length
        const signedN = rows.filter((r) => r.adCellsSigned.includes(`${c}@${b.maxWtaRank}`)).length
        return `${usd(fee)} ${written}w/${signedN}s`.padEnd(12)
      })
      const houses = def.houses.length > 0 ? def.houses.join(', ') : '(the live kit brand)'
      console.log(`    ${c.padEnd(11)} ${houses.slice(0, 34).padEnd(35)} ${cells.join('')}`)
    }
    const capW = rows.filter((r) => r.adCellsWritten.includes('capstone')).length
    const capS = rows.filter((r) => r.adCellsSigned.includes('capstone')).length
    const cap = ECONOMY.advertising.capstone
    console.log(
      `    ${'capstone'.padEnd(11)} ${'(the kit house that dresses her)'.padEnd(35)} ` +
        `${usd(cap.cashCents)}/yr x ${cap.termYears}yr, gate ${cap.seasonsInTop10} top-10 seasons – ${capW} written ${pct(capW, n)}, ${capS} signed ${pct(capS, n)}`,
    )
    // ...and the same reach folded PER BAND – «reach per band per category» in one line each.
    console.log('\n    per band, careers reached by at least one letter of the band:')
    for (const b of bands) {
      const written = rows.filter((r) => r.adCellsWritten.some((k) => k.endsWith(`@${b.maxWtaRank}`))).length
      const signedN = rows.filter((r) => r.adCellsSigned.some((k) => k.endsWith(`@${b.maxWtaRank}`))).length
      const cats = rows.length === 0 ? 0 : Math.max(...rows.map((r) => new Set(r.adCellsSigned.filter((k) => k.endsWith(`@${b.maxWtaRank}`)).map((k) => k.split('@')[0])).size))
      console.log(
        `      WTA <=${String(b.maxWtaRank).padEnd(4)} written ${String(written).padStart(3)} ${pct(written, n)}   signed ${String(signedN).padStart(3)} ${pct(signedN, n)}   most categories one career held at this band: ${cats}`,
      )
    }
  }

  // ⭐⭐⭐ ROUND 29 PART TWO, HIS 29.08 REPLY – «Без всех этих пунктов не очень понятно зачем нам
  // вообще магазин пока что.» EVERYTHING ABOVE SIZES A CHEQUE AGAINST A SEASON'S COSTS. This block
  // asks the question that should have come first: what does a whole career BANK, and what will the
  // shelf sell it? A ladder tuned to a share of the outgoings is defensible and still pointless if
  // the sink it feeds is out of reach – so the price list is printed against the money, rung by rung.
  const q = (xs: number[], p: number): number =>
    xs.length === 0 ? 0 : [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(p * xs.length))]
  const gross = (r: CareerRow) => r.lifetimeEarnedCents + r.kidFundsCents
  console.log('\n  ⭐⭐ A WHOLE CAREER, IN MONEY – what the shelf is shopping with:')
  console.log('    line                                   median          p90         best')
  const lines: [string, (r: CareerRow) => number][] = [
    ['gross into the household (incl. her cut)', gross],
    ['  ...of which HER cut left for her own account', (r) => r.kidFundsCents],
    ['what the FAMILY actually banked', (r) => r.lifetimeEarnedCents],
    ['what the family spent', (r) => r.lifetimeSpentCents],
    ['the most it ever held AT ONCE (peak wallet)', (r) => r.peakFundsCents],
    ['what it was left holding at the end', (r) => r.endFundsCents],
  ]
  for (const [label, read] of lines) {
    const xs = rows.map(read)
    console.log(`    ${label.padEnd(38)} ${usd(q(xs, 0.5)).padStart(12)} ${usd(q(xs, 0.9)).padStart(12)} ${usd(q(xs, 1)).padStart(12)}`)
  }

  // ⭐⭐ THE SPONSOR LINE ON ITS OWN – the money the 29.08 commission ruling is about, and the only
  // line in the game whose OWNER is now in question. Printed gross, because a share needs a base.
  console.log('\n  ⭐ THE SPONSOR MONEY, WHOSE SHARE IS THE 29.08 RULING:')
  const sponsorLines: [string, (r: CareerRow) => number][] = [
    ['GROSS sponsor money (kit cash + ad fees)', (r) => r.sponsorGrossCents],
    ['  what the kit brands paid the FAMILY', (r) => r.sponsorIncomeCents],
    ['  what the advertising post paid the FAMILY', (r) => r.adFeeIncomeCents],
    ['  handed back under the commission arm', (r) => r.commissionHandedBackCents],
  ]
  for (const [label, read] of sponsorLines) {
    const xs = rows.map(read)
    console.log(`    ${label.padEnd(38)} ${usd(q(xs, 0.5)).padStart(12)} ${usd(q(xs, 0.9)).padStart(12)} ${usd(q(xs, 1)).padStart(12)}`)
  }
  const grossAll = rows.reduce((s, r) => s + r.sponsorGrossCents, 0)
  const keptAll = rows.reduce((s, r) => s + r.sponsorIncomeCents + r.adFeeIncomeCents - r.commissionHandedBackCents, 0)
  console.log(
    `    ...so across all ${n} careers the parent kept ${((100 * keptAll) / Math.max(1, grossAll)).toFixed(1)}% of the gross sponsor money`,
  )

  // ⚠⚠ TWO COLUMNS AND NOT ONE, AND THE SECOND IS THE HONEST ONE. «Afford» is `fundsCents >= price`
  // at some week of the career. «Afford + carry» adds ONE YEAR of the rung's own upkeep on top,
  // because a $12M yacht is also $23,077 a week and a family that clears the hull and not the crew
  // has reached a bill rather than a rung. Both are generous: neither leaves a penny for the tennis.
  console.log('\n  ⭐⭐ THE SHELF, AND WHETHER ANY CAREER REACHES IT:')
  console.log('    rung                      price   upkeep/wk    afforded   ...+1yr upkeep   median week afforded')
  for (const item of shopCatalogue()) {
    const up = assetUpkeepCents(item, item.entryCents)
    const got = rows.filter((r) => r.affordWeek[item.id] !== null)
    const carried = rows.filter((r) => r.affordAndCarryWeek[item.id] !== null)
    const at = got.map((r) => r.affordWeek[item.id]!).sort((a, b) => a - b)
    const medWeek = at.length === 0 ? '–' : `w${at[Math.floor(at.length / 2)]} (age ${(START_AGE_YEARS + at[Math.floor(at.length / 2)] / WEEKS_PER_YEAR).toFixed(1)})`
    console.log(
      `    ${item.label.padEnd(22)} ${usd(item.entryCents).padStart(12)} ${(up ? usd(up) : '–').padStart(11)}` +
        `   ${String(got.length).padStart(3)} ${pct(got.length, n)}    ${String(carried.length).padStart(3)} ${pct(carried.length, n)}   ${medWeek}`,
    )
  }

  // ...AND THE ONE SENTENCE HE ASKED FOR: the dearest rung a career's peak wallet ever cleared, with
  // its upkeep carried. That is «how far up the shelf does the median career get», answered as a
  // NAME rather than as a number.
  const topRungOf = (r: CareerRow): string => {
    const reached = shopCatalogue().filter((i) => r.affordAndCarryWeek[i.id] !== null)
    if (reached.length === 0) return '(nothing on the shelf)'
    return reached.reduce((a, b) => (b.entryCents > a.entryCents ? b : a)).label
  }
  const priceOf = (r: CareerRow): number => {
    const reached = shopCatalogue().filter((i) => r.affordAndCarryWeek[i.id] !== null)
    return reached.length === 0 ? 0 : Math.max(...reached.map((i) => i.entryCents))
  }
  const ceilings = [...rows].sort((a, b) => priceOf(a) - priceOf(b))
  const nameAt = (p: number) => {
    const r = ceilings[Math.min(ceilings.length - 1, Math.floor(p * ceilings.length))]
    return `${topRungOf(r)} (${usd(priceOf(r))})`
  }
  console.log('\n  ⭐⭐ HOW FAR UP THE SHELF – the dearest rung the wallet ever cleared WITH a year of its upkeep:')
  console.log(`    median career   ${nameAt(0.5)}`)
  console.log(`    p90 career      ${nameAt(0.9)}`)
  console.log(`    the best of ${n}   ${nameAt(1)}`)
  const stuck = rows.filter((r) => priceOf(r) === 0).length
  console.log(`    reached NOTHING on the shelf at all: ${stuck} ${pct(stuck, n)}`)

  // ⭐⭐ WHERE THE MONEY ACTUALLY GOES – his own list, as a share of GROSS (family + her cut), so the
  // percentages of one stage add up against the money that stage produced.
  console.log('\n  ⭐⭐ WHERE THE MONEY GOES, as a share of the stage`s GROSS income:')
  const catsShown: WorldEventCategory[] = ['coaching', 'facility', 'staff', 'physio', 'travel', 'entry', 'gear', 'stringing', 'vacation', 'shop', 'other']
  console.log(`    stage                  gross in    ${catsShown.map((c) => c.slice(0, 5).padStart(6)).join('')}   her cut`)
  for (let s = 0; s < STAGE_CUTS.length; s++) {
    // Summed across careers rather than averaged per career: a share of a total is what the question
    // asks, and a mean of ratios over careers that earned nothing is undefined.
    const grossIn = rows.reduce((sum, r) => {
      const st = r.stages[s]
      return sum + Object.values(st.byCategory).reduce((a, v) => a + Math.max(0, v ?? 0), 0) + st.kidCutCents
    }, 0)
    const share = (c: WorldEventCategory) => {
      const spent = rows.reduce((sum, r) => sum + Math.max(0, -(r.stages[s].byCategory[c] ?? 0)), 0)
      return grossIn === 0 ? '   –  ' : `${((100 * spent) / grossIn).toFixed(1)}%`.padStart(6)
    }
    const her = rows.reduce((sum, r) => sum + r.stages[s].kidCutCents, 0)
    console.log(
      `    ${STAGE_CUTS[s].label} ${usd(grossIn).padStart(12)}    ${catsShown.map(share).join('')}   ` +
        `${(grossIn === 0 ? '–' : `${((100 * her) / grossIn).toFixed(1)}%`).padStart(6)}`,
    )
  }

  // ⭐⭐ TENURE – the fourth proposal's feasibility, measured rather than asserted. He asked to tie the
  // big contracts to TIME IN BAND; this is what the world already knows, and it knows it for free.
  console.log('\n  ⭐⭐ TENURE – SEASONS ENDED INSIDE EACH BAND (`seasonHistory[].byTrack.wta.endRank`):')
  console.log('    band       careers with >=1   >=2 seasons   >=4 seasons   most any career held')
  for (const cut of TENURE_BANDS) {
    const counts = rows.map((r) => r.seasonsInTop[cut] ?? 0)
    const atLeast = (k: number) => counts.filter((c) => c >= k).length
    console.log(
      `    WTA #${String(cut).padStart(3)}   ${String(atLeast(1)).padStart(9)} ${pct(atLeast(1), n)}   ` +
        `${String(atLeast(2)).padStart(6)} ${pct(atLeast(2), n)}   ${String(atLeast(4)).padStart(6)} ${pct(atLeast(4), n)}   ${Math.max(...counts)}`,
    )
  }

  // ⭐⭐ ROUND 29 PART TWO #12 – WHY A WINTER PRODUCES NO KIT LETTER, and how often a BIGGER house
  // was standing behind the closed door. The owner: «открытое сейчас в вашем ящике продление
  // Baseline закроет и следующую зимнюю почту… там без спонсора грустновато немного живется».
  const winters = rows.flatMap((r) => r.winters)
  const shut = winters.filter((w) => w.letters === 0)
  const spoken = winters.filter((w) => w.spokenBy !== null)
  const blocked = winters.filter((w) => w.blockedTop !== null)
  console.log(`\n  ⭐ THE WINTERS – ${winters.length} sponsor windows lived through:`)
  console.log(`    produced no kit letter at all      ${String(shut.length).padStart(4)} ${pct(shut.length, winters.length)}`)
  console.log(`    the season ahead was already promised ${String(spoken.length).padStart(2)} ${pct(spoken.length, winters.length)}` +
    `   (letters raised anyway: ${spoken.filter((w) => w.letters > 0).length})`)
  // ⚠ THE LABEL IS THE SITUATION AND NOT THE OUTCOME, since round 29 part two #12: these are the
  // winters in which a running deal stood in front of a BIGGER house. Under the shipped rule every
  // one of them was silent; under `rungTurnedAway` they are exactly the ones now let through.
  console.log(`    ...and a STRICTLY STRONGER rung was standing behind that contract ${String(blocked.length).padStart(4)} ${pct(blocked.length, winters.length)}`)
  const byStep = new Map<string, number>()
  for (const w of blocked) {
    const k = `${w.spokenBy} -> ${w.blockedTop}`
    byStep.set(k, (byStep.get(k) ?? 0) + 1)
  }
  for (const [k, v] of [...byStep.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`      ${k.padEnd(24)} ${String(v).padStart(4)}`)
  }

  // ⭐⭐⭐ ROUND 29 PART FOUR P7 – THE BUSINESS ARM'S OWN REPORT: what merch and the academy DID.
  if (buyBusiness) {
    console.log('\n  ⭐⭐ THE PARENT\'S BUSINESSES (the --buy-business arm; the default arm buys nothing):')
    const merchOwners = rows.filter((r) => r.merchBoughtWeek !== null)
    const fameOf = (r: CareerRow) => r.endFame
    console.log(
      `    merch: started by ${merchOwners.length}/${n} careers` +
        (merchOwners.length > 0
          ? `, median start week ${q(merchOwners.map((r) => r.merchBoughtWeek!), 0.5)}` +
            `; career merch income median ${usd(q(merchOwners.map((r) => r.merchIncomeCents), 0.5))}` +
            ` · p90 ${usd(q(merchOwners.map((r) => r.merchIncomeCents), 0.9))}` +
            ` · best ${usd(q(merchOwners.map((r) => r.merchIncomeCents), 1))}`
          : ''),
    )
    console.log(
      `    fame at the horizon, all careers: median ${q(rows.map(fameOf), 0.5).toFixed(1)}` +
        ` · p90 ${q(rows.map(fameOf), 0.9).toFixed(1)} · best ${q(rows.map(fameOf), 1).toFixed(1)}`,
    )
    const builders = rows.filter((r) => r.academyDoneWeek !== null)
    console.log(
      `    academy: all four stages delivered by ${builders.length}/${n} careers` +
        (builders.length > 0 ? `, median delivered week ${q(builders.map((r) => r.academyDoneWeek!), 0.5)}` : ''),
    )
    if (builders.length > 0) {
      const reps = builders.map((r) => r.endReputation)
      console.log(
        `      builders' end reputation: min ${q(reps, 0).toFixed(2)} · median ${q(reps, 0.5).toFixed(2)}` +
          ` · max ${q(reps, 1).toFixed(2)}`,
      )
      console.log(
        `      academy income banked by the horizon: median ${usd(q(builders.map((r) => r.academyIncomeCents), 0.5))}` +
          ` · p90 ${usd(q(builders.map((r) => r.academyIncomeCents), 0.9))}` +
          ` · best ${usd(q(builders.map((r) => r.academyIncomeCents), 1))}`,
      )
      // ⚠ TWO PAYBACK READINGS, kept apart: MEASURED (did $12M of academy income actually land
      // before the horizon) and ARITHMETIC (the seasons the $12M takes at the reputation the
      // career ended holding – the honest horizon for a career that built late).
      const repaid = builders.filter((r) => r.academyPaybackWeek !== null)
      const baseCents = Object.values(ECONOMY.business.academy.stageIncomeCents).reduce((s, c) => s + c, 0)
      const horizonYears = builders.map(
        (r) => 12_000_000_00 / (Math.round(baseCents * r.endReputation) * WEEKS_PER_YEAR),
      )
      console.log(
        `      $12M repaid inside the horizon by ${repaid.length}/${builders.length} builders` +
          (repaid.length > 0
            ? ` (median ${(q(repaid.map((r) => r.academyPaybackWeek! - r.academyDoneWeek!), 0.5) / WEEKS_PER_YEAR).toFixed(1)} seasons from delivery)`
            : ''),
      )
      console.log(
        `      arithmetic payback at the builders' own reputations: best ${q(horizonYears, 0).toFixed(1)}` +
          ` · median ${q(horizonYears, 0.5).toFixed(1)} · worst ${q(horizonYears, 1).toFixed(1)} seasons` +
          ` (the P7 criterion: roughly 5–10 at a real reign)`,
      )
    }
  }

  const paid = rows.filter((r) => r.sponsorIncomeCents > 0)
  console.log(`\n  what the brands paid in CASH over a career (retainer + appearance + bonus), ${paid.length}/${n} careers received any:`)
  const cash = paid.map((r) => r.sponsorIncomeCents).sort((a, b) => b - a)
  if (cash.length > 0) {
    console.log(`    most ${usd(cash[0])}   median ${usd(cash[Math.floor(cash.length / 2)])}   least ${usd(cash[cash.length - 1])}`)
    const biggest = [...rows].sort((a, b) => b.biggestChequeCents - a.biggestChequeCents)[0]
    console.log(`    the largest SINGLE cheque any career received: ${usd(biggest.biggestChequeCents)} – "${biggest.biggestChequeText}" (${biggest.preset} · ${biggest.policy})`)
  }

  const ended = rows.filter((r) => r.endedWeek !== null)
  console.log(`\n  ${ended.length}/${n} careers ended before the horizon; median run ${[...rows].map((r) => r.weeksRun).sort((a, b) => a - b)[Math.floor(n / 2)]} weeks\n`)

  if (jsonAt >= 0) {
    writeFileSync(argv[jsonAt + 1], JSON.stringify(rows, null, 1))
    console.log(`rows -> ${argv[jsonAt + 1]}`)
  }
}

// A one-shot probe with no importers, so it simply runs. (`vite-node` strips the script path out of
// `process.argv` altogether – measured, not assumed – so the "am I the entry point" guards the older
// benches carry would never fire here.)
main()

export type { CareerRow }

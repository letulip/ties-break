/**
 * r42-junior-coverage – ROUND 42 #40. WHAT SHARE OF THE JUNIOR BILL DO THE SPONSORS PAY?
 *
 * THE OWNER, off his own save: «за всё время до 18 пришёл 1 спонсор на 40к на год». Item 16's paper
 * trail confirmed the sentence is literally true of the junior band. Item 40 asks the next question:
 * the junior years' TOTAL sponsor income against what the family SPENDS in the same years – i.e.
 * what share of the junior bill a good junior career can actually cover.
 *
 * ⚠⚠ MEASUREMENT ONLY, AND THE PREDICTION IS WRITTEN DOWN IN
 * docs/specs/junior-years-coverage-2026-09.md §3 **BEFORE** THIS FILE WAS FIRST RUN (invariant 5).
 * The measured column goes back into that table and a miss is reported as a miss. NO ENGINE CONSTANT
 * MOVES except inside the `--absurd` arm below, which restores every value it touched.
 *
 * ⚠ THERE ARE **THREE** FAMILY BACKGROUNDS, NOT FOUR. `FamilyBackground` is
 * `'wealthy' | 'middle' | 'working'` (src/shared/protocol/profile.ts:16; `BACKGROUNDS_ALLOWED` on
 * line 125 says the same). The fourth name in circulation is the COACH ladder
 * (self/budget/middle/high/elite), which is a different axis – so §3 prints the nine
 * background×coach presets underneath the three backgrounds, because the coach is the largest line
 * in a junior bill and a background mean averages over families that hired nobody.
 *
 * ---------------------------------------------------------------------------------------------
 * WHY THIS READS EVENTS AND NOT `financeWeeks.byCategory`
 * ---------------------------------------------------------------------------------------------
 * Seven channels reach a junior career and THREE OF THEM ARE INVISIBLE to a category fold:
 *
 *   1. the local cameo                      -> `category: 'sponsor'`, 100% family
 *   2. advertising fee + anniversaries      -> `category: 'sponsor'`, 15% family / 85% hers
 *   3. a cancelled shoot's clawback         -> `category: 'sponsor'`, NEGATIVE
 *   4. kit retainer / appearance fee / bonus -> **`category: 'income'`**, beside the parent's wage
 *   5. the kit rung's kit allowance         -> **nowhere**: `resolveGear` emits the gear row at what
 *                                              the family PAID, so a covered line is a cost that
 *                                              never appears
 *   6. the top rung's 25% travel share      -> **nowhere**: `supportedTravelCents` reduces the fare
 *                                              silently before `chargeTravel` writes the row
 *   7. the academy's kit grant and travel cover – NOT sponsor money, reported apart and excluded
 *                                              from both sides of every ratio
 *
 * (4) is why `sponsors.ts:226`'s note – «`financeWeeks.byCategory.sponsor` cannot tell a cameo from
 * a retainer or an ad cheque» – cuts both ways: the category is neither necessary nor sufficient.
 *
 * ⚠⚠ SO THE LETTER MONEY IS NOT TEXT-MATCHED. Every cheque in (2) and (4) goes through
 * `bankSponsorCheque`, which writes `FinanceWeek.kidShare.sponsor` with BOTH the cents she kept and
 * the GROSS they were a share of – the engine's own two figures at the moment it paid. So
 *
 *     letters, gross  = Σ kidShare.sponsor.baseCents
 *     letters, hers   = Σ kidShare.sponsor.cents
 *     letters, family = gross − hers      (exactly the manager's commission, by subtraction)
 *
 * and no literal can rot underneath it. The text-matched fold is kept anyway and printed in §4 as a
 * CROSS-CHECK: if the two disagree, a write site has moved and the report says so.
 *
 * (5) is folded off `Offer.coveredCents` as a per-deal DELTA – `rolloverKitAllowance` zeroes it every
 * season, so the delta is clamped at 0 and the next season accumulates from scratch. (6) is
 * recovered from her own fare rows: `chargeTravel` writes `net = afterAcademy × (1 − brandShare)`,
 * so the brand put in `net × share/(1 − share)`. ⚠ ONLY HER OWN FARE – the coach's and the masseur's
 * rows are in the same category and the brand's share never touches them (the 15.08 ruling: «этот
 * механизм не должен поддерживать их чрезмерные траты»), so they are matched out by their own text.
 * ⚠ AND THE FAMILY PLANE WOULD BREAK THAT ARITHMETIC (`afterOwnPlaneCents` is a third factor), so
 * the walk ASSERTS the shelf is empty rather than assuming it.
 *
 * ⚠⚠ 85 CENTS OF EVERY ADVERTISING DOLLAR IS **HERS**. `ECONOMY.managerCommission.bps = 1500`, so a
 * bench that printed one number for «the sponsor money» would be describing the wrong pocket. Four
 * readings are printed and each is named; the primary one is FAMILY-SIDE.
 *
 * ⚠ MONEY IS IN CENTS EVERYWHERE BELOW. The single conversion to dollars is `money()` from
 * `tools/_corridor.ts` (`Math.round(cents / 100)`); nothing else in this file divides by 100 except
 * the two places that print a bps constant as a percentage.
 *
 * ⚠ RNG DISCIPLINE (invariant 2). The walk uses `econ-bench`'s `openCareer`, which is the engine's
 * own `rngFromSeed(world.seed)` – a career's MAIN stream, walked exactly as a real career walks it.
 * This file draws NOTHING of its own: no `Math.random`, no `new Date`, no second stream. Signing a
 * letter is a player action and taps zero MAIN draws, so the eager arm cannot move the world's dice.
 *
 * ⚠ NO try/catch ANYWHERE: a throw is a finding (house bench law). A share with no denominator
 * prints `–`, never `0.0%`.
 *
 * Run:  npx vite-node tools/r42-junior-coverage.ts -- --seeds 16 --absurd        (the spec's §4 + §5)
 *       npx vite-node tools/r42-junior-coverage.ts -- --seeds 2 --zero-accounting (the null arm)
 *       npx vite-node tools/r42-junior-coverage.ts                                (the default, 12 seeds)
 *
 * ⚠ THE SHIPPED FIGURES WERE MEASURED ON A WORKING TREE CARRYING ANOTHER AGENT'S UNCOMMITTED ROUND-42
 * WORK (items 34 / 47 / 49b), bracketed by an identical md5 of the whole of `src/` before and after,
 * with two consecutive runs byte-identical inside that bracket. The spec's §7 carries the whole of it,
 * including the fact that round 42 #47 rewrote the local cameo in the middle of the measurement.
 */
import { acceptOffer, kidAgeExact, kidAgeYears, type WorldState } from '../src/engine/world'
import { isOfferLive, kitTravelShare, SPONSOR_TIERS } from '../src/engine/offers'
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { openCareer, stepCareerWeek, PRESETS, POLICIES, mean, median } from './econ-bench'
import { money, num, padL, padR } from './_corridor'
import type { KitOfferTerms, SponsorTier, WorldEvent, WorldEventCategory } from '../src/shared/protocol'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
/** seeds PER PRESET. n = seeds x 9 careers. */
const SEEDS = argOf('seeds', 12)
const ABSURD = args.includes('--absurd')
/** ⚠ THE NULL ARM – zero the sponsor numerator in the ACCOUNTING (not in the engine) and every
 *  coverage reading below must print exactly 0.0%. The cheap half of «prove the arm». */
const ZERO_SPONSORS = args.includes('--zero-accounting')

/** ⭐ THE BAND, DEFINED HERE AND NOWHERE ELSE: every ledger row whose week falls before her
 *  EIGHTEENTH birthday, on her REAL age (`kidAgeYears`, the one-clock ruling of 09.08) and never on
 *  a week count.
 *
 *  ⚠ THAT IS NOT THE SAME AS «208 weeks», AND THE DIFFERENCE IS REAL RATHER THAN PEDANTIC.
 *  `econ-bench`'s careers open in the January of the band's year and `DEFAULT_PROFILE`'s birthday is
 *  15 June, so she is **13.5 at week 0** and does not turn eighteen until about week 232 –
 *  `age.ts`' own note («a December girl is 13.08 and does not turn 14 until week ~48»). §1 prints
 *  the measured band so the number is never assumed. */
const JUNIOR_UNTIL_AGE = 18
/** The walk runs past the band on purpose – far enough that EVERY birth month has crossed eighteen
 *  inside it, so the band can never be truncated by the horizon. */
const WALK_WEEKS = 5 * WEEKS_PER_YEAR
/** ⚠ `POLICIES[1]` ('player'), item 25's choice inherited for item 41's reason: the 'grinder' arm
 *  keeps no reserve and bankrupts much of the corpus, which would turn «what share of the bill do
 *  sponsors pay» into a question about who died first. */
const POLICY = POLICIES[1]

const LADDER: readonly SponsorTier[] = SPONSOR_TIERS
const rungIndex = (t: SponsorTier): number => LADDER.indexOf(t)

// -------------------------------------------------------------------------------------------------
// THE CLASSIFIER
// -------------------------------------------------------------------------------------------------

/** The three expense buckets item 40 names. */
const COACH_CATS: WorldEventCategory[] = ['coaching', 'facility']
const TRAVEL_CATS: WorldEventCategory[] = ['travel', 'entry']
const KIT_CATS: WorldEventCategory[] = ['gear', 'stringing']
/** ...and the rest of the spending side, so the BILL is the whole bill and not three lines of it. */
const OTHER_EXPENSE_CATS: WorldEventCategory[] = ['physio', 'vacation', 'practice', 'shop', 'tuition', 'other']
/** ⚠ THE INCOME SIDE, NAMED EXHAUSTIVELY, BECAUSE THE FIRST DRAFT OF THIS FILE SWEPT `prize` INTO
 *  THE `other` EXPENSE BUCKET AS A NEGATIVE COST AND PRINTED A NEGATIVE BILL. An `else` branch over
 *  a union is how that happens; `assertKnown` below is why it cannot happen again. */
const INCOME_CATS: WorldEventCategory[] = ['prize', 'income', 'sponsor', 'academy', 'interest', 'business']

/** ⚠ THE THREE SPONSOR ROWS THAT HIDE UNDER `category: 'income'`, matched on the engine's own
 *  literals at their write sites (`payRetainer`, and the two `bankSponsorCheque` calls in
 *  `finalizeTournament`). ⚠⚠ THIS FOLD CARRIES NO MONEY INTO ANY RATIO – the letter money comes off
 *  `kidShare.sponsor`, which is arithmetic rather than prose. It exists only as §4's cross-check.
 *  Measurement only: nothing here changes a string (invariant 4). */
const RETAINER_MARK = 'retainer – quarterly'
const APPEARANCE_MARK = 'Appearance fee – '
const BONUS_MARK = 'Sponsor bonus – '
const PARENT_MARK = "Parents' contribution"
const MANAGER_MARK = "the manager's"
/** Her OWN fare, as against the coach's («Your coach travels to…») and the masseur's. */
const HER_FARE_MARK = 'Travel to '

interface Read {
  background: string
  preset: string
  seed: string

  // --- the junior bill, cents, positive magnitudes ---
  coachCents: number
  travelCents: number
  kitCents: number
  otherCents: number
  /** what the family actually paid over the band */
  spentCents: number

  // --- what the SPONSORS put in, cents ---
  /** the need-based local cameo, 100% family (`ECONOMY.sponsor`), less any shoot clawback */
  cameoCents: number
  /** the family's side of every LETTER – gross minus hers, i.e. the manager's commission exactly */
  letterFamilyCents: number
  /** HER side of the same letters (`kidShare.sponsor.cents`) */
  letterHerCents: number
  /** the gross those letters were written for (`kidShare.sponsor.baseCents`) */
  letterGrossCents: number
  /** gear bills a kit rung paid instead of the family (`Offer.coveredCents`, delta-folded) */
  kitCoveredCents: number
  /** fare a kit rung paid instead of the family, recovered from her own fare rows */
  travelCoveredCents: number

  // --- context, not sponsor money ---
  /** what the tennis itself paid the family over the band (`category: 'prize'`, already net of hers) */
  prizeFamilyCents: number
  /** the academy's annual kit grant (`category: 'academy'`) – somebody else's money, not a brand's */
  academyCents: number

  // --- diagnostics ---
  /** the same letter money as `letterFamilyCents`, folded by TEXT – §4's cross-check */
  letterFamilyByTextCents: number
  travelShareWeeks: number
  kitLettersSigned: number
  adLettersSigned: number
  bandWeeks: number
  bandLastWeek: number
  ageAtWeek0: number
  /** ⭐⭐ WHAT KIND OF CAREER THIS IS, WITHOUT WHICH «a good junior career» IS AN ASSERTION. Her WTA
   *  and ITF standing on the last week of the band, and whether she has a professional ranking at
   *  all – so the reader can see whether the corpus is answering about a prodigy or about a club
   *  junior, and read the coverage share accordingly. */
  wtaRankAtBandEnd: number | null
  itfRankAtBandEnd: number
  endedInBand: string | null
  unknownIncome: Map<string, number>
}

/** The bill BEFORE any sponsor help – what the junior years would have cost with no brand behind
 *  her. A covered gear line and a subsidised fare never appear as costs, so they are added back or
 *  the ratio flatters itself. ⚠ The ACADEMY's cover is in neither side: the family never paid it and
 *  no sponsor paid it either. */
const billCents = (r: Read): number => r.spentCents + r.kitCoveredCents + r.travelCoveredCents
/** family-side numerator: cash the family banked, plus bills a brand paid on its behalf */
const familySponsorCents = (r: Read): number =>
  r.cameoCents + r.letterFamilyCents + r.kitCoveredCents + r.travelCoveredCents
/** the same with the need-based cameo removed – the reading that answers «1 спонсор» */
const letterSponsorCents = (r: Read): number => r.letterFamilyCents + r.kitCoveredCents + r.travelCoveredCents
/** every cent the brands paid, her 85% included */
const grossSponsorCents = (r: Read): number =>
  r.cameoCents + r.letterGrossCents + r.kitCoveredCents + r.travelCoveredCents

const share = (numerator: number, denominator: number): number | null =>
  denominator === 0 ? null : (100 * numerator) / denominator

// -------------------------------------------------------------------------------------------------
// THE WALK
// -------------------------------------------------------------------------------------------------

/** The friendliest parent there is: he signs the strongest live kit letter and every live
 *  advertising letter the week it lands. `tools/sponsor-ladder-reach.ts`' own eager arm, because «a
 *  good junior career» is one that answers its post – a rung nobody signs here is a rung nobody can
 *  sign. Signing draws ZERO on MAIN (invariant 2).
 *
 *  ⚠ NO try/catch, unlike the tool this is modelled on: the two reasons `acceptOffer` throws are an
 *  ENDED career and a letter that is not answerable, and both are guarded here rather than caught,
 *  so a throw would be a real finding. */
function answerThePost(world: WorldState, read: Read): void {
  if (world.ending) return
  const live = world.offers.filter((o) => (o.kind === 'kit' || o.kind === 'ad') && isOfferLive(o, world.week))
  if (live.length === 0) return
  const inBand = kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay) < JUNIOR_UNTIL_AGE
  const best = [...live.filter((o) => o.kind === 'kit')].sort(
    (a, b) => rungIndex((b.terms as KitOfferTerms).tier) - rungIndex((a.terms as KitOfferTerms).tier),
  )[0]
  if (best) {
    acceptOffer(world, best.id)
    if (inBand) read.kitLettersSigned++
  }
  for (const ad of live.filter((o) => o.kind === 'ad')) {
    // ⚠ RE-ASKED, NOT RE-USED: signing the kit letter above can shut an advertising slot in the same
    // week (`adSpokenFor`), and a stale `live` list would then hand `acceptOffer` an unanswerable id.
    if (!isOfferLive(ad, world.week)) continue
    acceptOffer(world, ad.id)
    if (inBand) read.adLettersSigned++
  }
}

function runCareer(presetIndex: number, seedIndex: number): Read {
  const preset = PRESETS[presetIndex]
  const { world, rng, seed } = openCareer(preset, seedIndex, POLICY)
  const read: Read = {
    background: preset.background,
    preset: preset.label,
    seed,
    coachCents: 0,
    travelCents: 0,
    kitCents: 0,
    otherCents: 0,
    spentCents: 0,
    cameoCents: 0,
    letterFamilyCents: 0,
    letterHerCents: 0,
    letterGrossCents: 0,
    kitCoveredCents: 0,
    travelCoveredCents: 0,
    prizeFamilyCents: 0,
    academyCents: 0,
    letterFamilyByTextCents: 0,
    travelShareWeeks: 0,
    kitLettersSigned: 0,
    adLettersSigned: 0,
    bandWeeks: 0,
    bandLastWeek: -1,
    ageAtWeek0: kidAgeExact(0, world.profile.birthMonth, world.profile.birthDay),
    wtaRankAtBandEnd: null,
    itfRankAtBandEnd: 0,
    endedInBand: null,
    unknownIncome: new Map(),
  }
  const inBand = (week: number): boolean =>
    kidAgeYears(week, world.profile.birthMonth, world.profile.birthDay) < JUNIOR_UNTIL_AGE
  /** per-deal `coveredCents` as last seen, so the fold takes DELTAS and the season rollover
   *  (`rolloverKitAllowance` sets it back to 0) contributes 0 rather than a negative. */
  const coveredSeen = new Map<string, number>()
  /** weeks whose `kidShare` memo has already been folded – see the block at the fold. */
  const kidShareFolded = new Set<number>()

  for (let w = 0; w < WALK_WEEKS; w++) {
    // ⚠⚠ THE WATERMARK IS TAKEN **BEFORE** THE SIGNATURE, AND THE SECOND DRAFT OF THIS FILE TOOK IT
    // AFTER. `acceptOffer` pays the whole advertising fee the week the paper is signed
    // (`bankSponsorCheque`, from `acceptOffer` itself) – so a watermark taken after `answerThePost`
    // skipped exactly one channel: THE AD SIGNATURE FEE, which is the $40,000 letter this item is
    // about. It was invisible rather than wrong-by-a-little: the median career's letter money read
    // $0, and the text cross-check agreed with the kidShare fold because BOTH folds shared the
    // blind spot. Two instruments agreeing is not a check when they agree by construction.
    const watermark = world.nextEventId
    // The eager arm answers the post BEFORE the week ticks, which is when a player would.
    answerThePost(world, read)
    stepCareerWeek(world, rng, POLICY)

    // ⚠⚠ `tickWeek`'s FIRST statement is `world.week += 1` (world.ts, and the tick order is written
    // out in phaseHerWeek.ts' ruling-P block), so every row the tick wrote carries the POST-step
    // week. The first draft of this file read `weekBefore` here and was one week out of step all the
    // way down. The EVENT fold below is immune either way – it bands on `e.week`, the row's own.
    const played = world.week
    const bandWeek = inBand(played)
    if (bandWeek) {
      read.bandWeeks++
      read.bandLastWeek = played
      // ⚠ READ EVERY BAND WEEK AND KEPT, RATHER THAN ASKED ONCE AFTER THE WALK: the standing at the
      // horizon is an eighteen-and-a-half-year-old's, which is not the question.
      read.wtaRankAtBandEnd = world.onRampCleared.wta ? (world.kidRankWta ?? null) : null
      read.itfRankAtBandEnd = world.kidRank
    }

    // --- (1) every row written this week, off the watermark: prune-proof by construction ---------
    for (const e of world.events) {
      if (e.id < watermark) continue
      foldEvent(e, read, inBand, kitTravelShare(world.offers, e.week))
    }
    // --- (2) the letter money, off the engine's own memo rather than off any sentence -------------
    //
    // ⚠⚠ EVERY **CLOSED** WEEK, NOT «THIS WEEK», AND THAT IS THE SAME DEFECT AS THE WATERMARK ABOVE
    // WEARING ITS OTHER FACE. Two different moments write `kidShare.sponsor` into a week's row: the
    // tick (the retainer, the appearance fee, the result bonus, an anniversary) writes into the week
    // it has just advanced to, and `acceptOffer` writes into the week BEFORE the next step – so a
    // row read at the moment the step returns can still be added to on the next pass. A week is
    // therefore folded only once `world.week` has moved PAST it, and the set makes that once.
    // `financeWeeks` retains sixty weeks and this loop visits every week, so nothing is ever pruned
    // before it is read.
    foldClosedKidShares(world, read, inBand, kidShareFolded)
    // --- (3) the kit allowance the brand spent instead of the family ----------------------------
    for (const o of world.offers) {
      if (o.kind !== 'kit') continue
      const now = o.coveredCents ?? 0
      const before = coveredSeen.get(o.id) ?? 0
      if (bandWeek && now > before) read.kitCoveredCents += now - before
      coveredSeen.set(o.id, now)
    }
    if (bandWeek && kitTravelShare(world.offers, played) > 0) read.travelShareWeeks++
    if (bandWeek && world.ending && read.endedInBand === null) read.endedInBand = world.ending.type
    // ⚠ THE ASSUMPTION UNDER THE TRAVEL ARITHMETIC, ASSERTED RATHER THAN TRUSTED. `afterOwnPlaneCents`
    // is a THIRD factor on a fare and it would silently break `net × s/(1−s)`. No bench policy buys
    // the shelf, and a throw here is the finding if one ever does.
    if (world.assets.length > 0) {
      throw new Error(`${seed}: the shelf is not empty at week ${played} – the travel arithmetic in this tool assumes no plane`)
    }
  }
  // ⚠ THE FLUSH. The last week of the walk is never «past», so its row would otherwise be dropped –
  // the same one-row loss the first draft had at both ends. Nothing writes after the loop, so every
  // remaining retained row is closed by definition.
  foldClosedKidShares(world, read, inBand, kidShareFolded, true)
  if (ZERO_SPONSORS) {
    read.cameoCents = 0
    read.letterFamilyCents = 0
    read.letterHerCents = 0
    read.letterGrossCents = 0
    read.kitCoveredCents = 0
    read.travelCoveredCents = 0
  }
  return read
}

/** Fold the `kidShare.sponsor` memo of every retained week that can no longer be written to. `flush`
 *  drops the «closed» test for the end of the walk, where nothing can write any more. */
function foldClosedKidShares(
  world: WorldState,
  read: Read,
  inBand: (week: number) => boolean,
  folded: Set<number>,
  flush = false,
): void {
  for (const f of world.financeWeeks) {
    if (folded.has(f.week)) continue
    if (!flush && f.week >= world.week) continue
    folded.add(f.week)
    if (!inBand(f.week)) continue
    const part = f.kidShare?.sponsor
    if (!part) continue
    read.letterHerCents += part.cents
    read.letterGrossCents += part.baseCents
    read.letterFamilyCents += part.baseCents - part.cents
  }
}

/** One ledger row into the right bucket. `amountCents` is SIGNED on the row – expenses negative – so
 *  the expense buckets take `-amount` and the income ones take it as written. `brandFareShare` is
 *  `kitTravelShare` at this row's own week, used only to recover channel (6). */
function foldEvent(e: WorldEvent, read: Read, inBand: (week: number) => boolean, brandFareShare: number): void {
  const amount = e.amountCents
  if (amount === undefined || amount === 0) return
  if (!inBand(e.week)) return
  const cat = e.category ?? 'other'

  // ⚠ THE SPONSOR CATEGORY IS TAKEN SIGNED AND IS NEVER AN EXPENSE BUCKET. A cancelled shoot's
  // clawback books a NEGATIVE 'sponsor' row (`shootClash.ts`); filing it as a cost would both inflate
  // the bill and leave the cheque it reverses standing in the numerator.
  if (cat === 'sponsor') {
    // The cameo is the one 'sponsor' row that never passes through `bankSponsorCheque`, and the
    // manager's clause the splitter appends is what tells them apart – the tell
    // `tools/sponsor-ladder-reach.ts` already reads, used here as a classifier and not as arithmetic.
    if (e.text.includes(MANAGER_MARK)) read.letterFamilyByTextCents += amount
    else read.cameoCents += amount
    return
  }
  if (cat === 'income') {
    if (e.text.includes(RETAINER_MARK) || e.text.startsWith(APPEARANCE_MARK) || e.text.startsWith(BONUS_MARK)) {
      read.letterFamilyByTextCents += amount
      return
    }
    if (e.text !== PARENT_MARK) read.unknownIncome.set(e.text, (read.unknownIncome.get(e.text) ?? 0) + amount)
    return
  }
  if (cat === 'prize') {
    read.prizeFamilyCents += amount
    return
  }
  if (cat === 'academy') {
    read.academyCents += amount
    return
  }
  if (cat === 'interest' || cat === 'business') return

  // --- the spending side ------------------------------------------------------------------------
  assertKnown(cat)
  if (COACH_CATS.includes(cat)) read.coachCents += -amount
  else if (TRAVEL_CATS.includes(cat)) {
    read.travelCents += -amount
    // ⭐ CHANNEL (6), RECOVERED. `chargeTravel` writes `net = afterAcademy × (1 − share)`, so the
    // brand put in `net × share / (1 − share)`. HER OWN FARE ONLY – the coach's and the masseur's
    // rows sit in this category too and the brand's share never touches them.
    if (brandFareShare > 0 && amount < 0 && e.text.startsWith(HER_FARE_MARK)) {
      read.travelCoveredCents += Math.round((-amount * brandFareShare) / (1 - brandFareShare))
    }
  } else if (KIT_CATS.includes(cat)) read.kitCents += -amount
  else read.otherCents += -amount
  read.spentCents += -amount
}

/** ⚠ A CATEGORY THIS FILE HAS NEVER HEARD OF IS A FINDING, NOT A ROW TO SWEEP INTO `other`. The
 *  first draft's `else` branch put PRIZE MONEY into the expense remainder as a negative cost and
 *  printed a negative junior bill. */
function assertKnown(cat: WorldEventCategory): void {
  if (COACH_CATS.includes(cat) || TRAVEL_CATS.includes(cat) || KIT_CATS.includes(cat)) return
  if (OTHER_EXPENSE_CATS.includes(cat)) return
  if (INCOME_CATS.includes(cat)) return
  throw new Error(`r42-junior-coverage: unknown ledger category '${cat}' – classify it before trusting any total`)
}

// -------------------------------------------------------------------------------------------------
// THE PRINT
// -------------------------------------------------------------------------------------------------

const pct = (x: number | null): string => (x === null ? '–' : `${x.toFixed(1)}%`)
const quantile = (xs: number[], q: number): number => {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.max(0, Math.round(q * (s.length - 1))))]
}

/** One cohort's coverage row. ⚠ EVERY CAREER'S SHARE IS COMPUTED FIRST AND THEN SUMMARISED – a
 *  median of ratios, never a ratio of sums – because a ratio of sums is a mean wearing a median's
 *  clothes and this repo has been burnt by a heavy-tailed mean before. The pooled ratio is printed
 *  beside it so the two can be compared rather than confused. */
function coverageRow(label: string, rows: Read[]): void {
  if (rows.length === 0) {
    console.log(`  ${padR(label, 30)}${padL('– no careers –', 20)}`)
    return
  }
  const of = (pick: (r: Read) => number) =>
    rows.map((r) => share(pick(r), billCents(r))).filter((x): x is number => x !== null)
  const per = of(familySponsorCents)
  const pooled = share(
    rows.reduce((s, r) => s + familySponsorCents(r), 0),
    rows.reduce((s, r) => s + billCents(r), 0),
  )
  const cash = rows
    .map((r) => share(r.cameoCents + r.letterFamilyCents, r.spentCents))
    .filter((x): x is number => x !== null)
  console.log(
    `  ${padR(label, 30)}${padL(pct(median(per)), 11)}${padL(pct(mean(per)), 11)}` +
      `${padL(`${pct(quantile(per, 0.25))} – ${pct(quantile(per, 0.75))}`, 20)}${padL(pct(pooled), 11)}` +
      `${padL(pct(median(of(letterSponsorCents))), 12)}${padL(pct(median(of(grossSponsorCents))), 11)}` +
      `${padL(pct(median(cash)), 11)}${padL(rows.length, 5)}`,
  )
}

function coverageHeader(): void {
  console.log(
    `  ${padR('', 30)}${padL('median', 11)}${padL('mean', 11)}${padL('p25 – p75', 20)}${padL('pooled', 11)}` +
      `${padL('letters', 12)}${padL('gross', 11)}${padL('cash', 11)}${padL('n', 5)}`,
  )
}

function moneyHeader(): void {
  console.log(
    `  ${padR('MEDIAN per career', 30)}${padL('the BILL', 13)}${padL('coach', 12)}${padL('travel', 12)}` +
      `${padL('kit', 11)}${padL('other', 11)}${padL('FAMILY GETS', 14)}${padL('cameo', 11)}${padL('letters', 11)}` +
      `${padL('kit cover', 11)}${padL('fare cover', 11)}${padL('(hers)', 11)}${padL('(prize)', 12)}`,
  )
}

function moneyRow(label: string, rows: Read[]): void {
  if (rows.length === 0) {
    console.log(`  ${padR(label, 30)}${padL('– no careers –', 20)}`)
    return
  }
  const m = (pick: (r: Read) => number) => median(rows.map(pick))
  console.log(
    `  ${padR(label, 30)}${padL(money(m(billCents)), 13)}${padL(money(m((r) => r.coachCents)), 12)}` +
      `${padL(money(m((r) => r.travelCents)), 12)}${padL(money(m((r) => r.kitCents)), 11)}` +
      `${padL(money(m((r) => r.otherCents)), 11)}${padL(money(m(familySponsorCents)), 14)}` +
      `${padL(money(m((r) => r.cameoCents)), 11)}${padL(money(m((r) => r.letterFamilyCents)), 11)}` +
      `${padL(money(m((r) => r.kitCoveredCents)), 11)}${padL(money(m((r) => r.travelCoveredCents)), 11)}` +
      `${padL(money(m((r) => r.letterHerCents)), 11)}${padL(money(m((r) => r.prizeFamilyCents)), 12)}`,
  )
}

const BACKGROUNDS = ['working', 'middle', 'wealthy']

function report(rows: Read[]): void {
  const byBg = (bg: string) => rows.filter((r) => r.background === bg)

  console.log('\n§2 ⭐⭐ THE COVERAGE SHARE BY BACKGROUND  (per-career shares, then summarised)\n')
  coverageHeader()
  for (const bg of BACKGROUNDS) coverageRow(`background · ${bg}`, byBg(bg))
  coverageRow('ALL', rows)
  console.log(
    '\n  median / mean / p25–p75 / pooled are all the FAMILY-SIDE reading: (family cash + kit covered' +
      '\n  + fare covered) over (what she spent + kit covered + fare covered). `letters` is the same with' +
      '\n  the need-based cameo removed – the column that answers «за всё время до 18 пришёл 1 спонсор».' +
      '\n  `gross` swaps the family\'s 15% for the brands\' whole cheque. `cash` is the naive ledger' +
      '\n  reading: family sponsor cash over what the family actually paid.',
  )

  console.log('\n\n§3 THE SAME, BY PRESET – the COACH is the bill, and a background averages over families that hired nobody\n')
  coverageHeader()
  for (const preset of PRESETS) coverageRow(preset.label, rows.filter((r) => r.preset === preset.label))

  console.log('\n\n§4 WHAT THE NUMBERS ARE MADE OF\n')
  moneyHeader()
  for (const bg of BACKGROUNDS) moneyRow(`background · ${bg}`, byBg(bg))
  moneyRow('ALL', rows)
  console.log(
    '\n  ⚠ EVERY CELL IS THE MEDIAN OF ITS OWN COLUMN AND **MEDIANS DO NOT ADD**: the four sponsor' +
      '\n    columns will not sum to `FAMILY GETS`, and the four spending columns will not sum to `the' +
      '\n    BILL`. The coverage shares in §2 are computed PER CAREER, where the arithmetic does hold.' +
      "\n  ⚠ AND THE BILL IS A CEILING BY ONE SMALL AMOUNT: an entry refund books under `income`" +
      '\n    («Entry refunded: …») rather than as a negative `entry` row, so a refunded fee is not taken' +
      '\n    back off the travel+entry line. The total refunded is printed with the unmatched rows below.',
  )

  // ⭐⭐ WHAT KIND OF CAREER THIS IS. «A good junior career» has to be a number before the coverage
  // share means anything: a corpus of prodigies OVERSTATES what sponsors pay for a junior, so a
  // «decorative» verdict read off it is the conservative one.
  console.log('\n  WHO THESE CAREERS ARE at the last week of the band (she is ~17.9):')
  for (const bg of BACKGROUNDS) {
    const sel = byBg(bg)
    const ranked = sel.filter((r) => r.wtaRankAtBandEnd !== null)
    const wta = ranked.map((r) => r.wtaRankAtBandEnd as number)
    console.log(
      `    ${padR(bg, 9)}${padL(`WTA-ranked ${ranked.length}/${sel.length}`, 22)}` +
        `${padL(ranked.length ? `WTA median #${Math.round(median(wta))}` : 'WTA –', 22)}` +
        `${padL(ranked.length ? `best #${Math.min(...wta)}, worst #${Math.max(...wta)}` : '', 28)}` +
        `${padL(`ITF median #${Math.round(median(sel.map((r) => r.itfRankAtBandEnd)))}`, 22)}` +
        `${padL(`prize before 18, median ${money(median(sel.map((r) => r.prizeFamilyCents)))}`, 40)}`,
    )
  }

  console.log('\n  the letters that actually arrived, over the band:')
  for (const bg of BACKGROUNDS) {
    const sel = byBg(bg)
    const withAd = sel.filter((r) => r.adLettersSigned > 0).length
    const withKit = sel.filter((r) => r.kitLettersSigned > 0).length
    const withCameo = sel.filter((r) => r.cameoCents > 0).length
    console.log(
      `    ${padR(bg, 9)}${padL(`kit ${num(mean(sel.map((r) => r.kitLettersSigned)), 2)}/career`, 20)}` +
        `${padL(`ad ${num(mean(sel.map((r) => r.adLettersSigned)), 2)}/career`, 20)}` +
        `${padL(`with an ad letter ${withAd}/${sel.length}`, 28)}` +
        `${padL(`with a kit deal ${withKit}/${sel.length}`, 26)}${padL(`with a cameo ${withCameo}/${sel.length}`, 24)}`,
    )
  }

  // --- the three self-checks --------------------------------------------------------------------
  const lf = rows.reduce((s, r) => s + r.letterFamilyCents, 0)
  const lg = rows.reduce((s, r) => s + r.letterGrossCents, 0)
  const byText = rows.reduce((s, r) => s + r.letterFamilyByTextCents, 0)
  const cameo = rows.reduce((s, r) => s + r.cameoCents, 0)
  console.log('\n  SELF-CHECKS')
  console.log(
    `    the family's share of the letters is ${pct(share(lf, lg))} of the gross;` +
      ` ECONOMY.managerCommission.bps says ${ECONOMY.managerCommission.bps / 100}%`,
  )
  console.log(
    `    letters folded off kidShare: ${money(lf)}   ·   the same folded by TEXT: ${money(byText)}` +
      `   ·   gap ${money(byText - lf)} (${pct(share(byText - lf, lf))})`,
  )
  console.log(`    the cameo, which is the one channel that is NOT split with her: ${money(cameo)}`)

  const travelWeeks = rows.reduce((s, r) => s + r.travelShareWeeks, 0)
  const bandWeeks = rows.reduce((s, r) => s + r.bandWeeks, 0)
  const fareCover = rows.reduce((s, r) => s + r.travelCoveredCents, 0)
  console.log(
    `    junior weeks under a deal carrying a travel share: ${travelWeeks} of ${bandWeeks}` +
      ` (${pct(share(travelWeeks, bandWeeks))}), worth ${money(fareCover)} across the corpus`,
  )
  const ended = rows.filter((r) => r.endedInBand !== null).length
  console.log(`    careers that ended (bankruptcy or otherwise) inside the band: ${ended} of ${rows.length}`)
  const unknown = new Map<string, number>()
  for (const r of rows) for (const [k, v] of r.unknownIncome) unknown.set(k, (unknown.get(k) ?? 0) + v)
  if (unknown.size === 0) {
    console.log("    unmatched 'income' rows: none")
  } else {
    let unknownTotal = 0
    for (const v of unknown.values()) unknownTotal += v
    console.log(
      `    unmatched 'income' rows, NOT counted as sponsor money (check none is a rotted literal) –` +
        ` ${unknown.size} texts, ${money(unknownTotal)} across the corpus, ${money(Math.round(unknownTotal / rows.length))} a career:`,
    )
    for (const [k, v] of [...unknown].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 6)) {
      console.log(`      ${padR(k.slice(0, 64), 66)}${padL(money(v), 14)}`)
    }
  }
  const academy = rows.reduce((s, r) => s + r.academyCents, 0)
  console.log(`    the academy's kit grant over the band (context, NOT a sponsor): ${money(academy)}`)
}

// -------------------------------------------------------------------------------------------------
// §5 THE ACTUATION PROOF
// -------------------------------------------------------------------------------------------------

/** ⚠ `ECONOMY` is `as const`, so an arm reaches it through the cast the house benches already use
 *  (`tools/r42-coach-every-cheque.ts`, `tools/band-vs-field.ts`). NOTHING IN `src/` IS EDITED: the
 *  arm is the live object, in one process, restored before the process exits – so «a constant
 *  without its reader» (CLAUDE.md) cannot happen here, there is no second tree. */
interface JuniorBand {
  feeBps: number
  chanceBps: number
}
/** ⚠⚠ EVERY RUNG CARRIES ITS OWN `seasonCents` AND THE FIRST ACTUATION ARM ONLY MOVED THE FIRST
 *  ONE, WHICH IS RECORDED HERE RATHER THAN QUIETLY FIXED. `ECONOMY.sponsorship.seasonCents` is the
 *  LOCAL shop's allowance alone; `kitTermsFor` reads `s.national.seasonCents`, `s.global…`,
 *  `s.tour…`, `s.premium…` and `s.icon…` for everything above it (offers.ts). The arm moved $1,000
 *  to $100,000 and the measured kit cover did not shift by one cent – because every career in the
 *  corpus had climbed off `local` by then. A dial that reaches one rung of six is a null arm wearing
 *  a proof, and it is exactly the failure CLAUDE.md's «prove the arm» note describes. */
interface Rung {
  seasonCents: number
}
interface Sponsorship extends Rung {
  topSeasonCents: number
  national: Rung
  global: Rung
  tour: Rung
  premium: Rung
  icon: Rung
}
const JUNIOR = ECONOMY.advertising.junior as unknown as JuniorBand
const SPONSORSHIP = ECONOMY.sponsorship as unknown as Sponsorship
const RUNGS: Rung[] = [
  SPONSORSHIP.national,
  SPONSORSHIP.global,
  SPONSORSHIP.tour,
  SPONSORSHIP.premium,
  SPONSORSHIP.icon,
]
const SHIPPED_JUNIOR: JuniorBand = { feeBps: JUNIOR.feeBps, chanceBps: JUNIOR.chanceBps }
const SHIPPED_LOCAL = { seasonCents: SPONSORSHIP.seasonCents, topSeasonCents: SPONSORSHIP.topSeasonCents }
const SHIPPED_RUNGS: number[] = RUNGS.map((r) => r.seasonCents)
function restore(): void {
  Object.assign(JUNIOR, SHIPPED_JUNIOR)
  Object.assign(SPONSORSHIP, SHIPPED_LOCAL)
  RUNGS.forEach((r, i) => (r.seasonCents = SHIPPED_RUNGS[i]))
}

function runArm(seeds: number): Read[] {
  const out: Read[] = []
  for (let i = 0; i < PRESETS.length; i++) for (let s = 0; s < seeds; s++) out.push(runCareer(i, s))
  return out
}

function actuation(): void {
  const seeds = Math.max(2, Math.floor(SEEDS / 2))
  const live = runArm(seeds)
  // 20x the ADULT cell rather than half of it, every junior letter certain, and EVERY kit rung –
  // all six of them – spending a hundred times what it does.
  JUNIOR.feeBps = 200_000
  JUNIOR.chanceBps = 10_000
  SPONSORSHIP.seasonCents = SHIPPED_LOCAL.seasonCents * 100
  SPONSORSHIP.topSeasonCents = SHIPPED_LOCAL.topSeasonCents * 100
  RUNGS.forEach((r, i) => (r.seasonCents = SHIPPED_RUNGS[i] * 100))
  const absurd = runArm(seeds)
  restore()

  console.log(
    `\n\n§5 ACTUATION – the dial must move the output, or every table above is a null  (${seeds * PRESETS.length} careers per arm)\n`,
  )
  console.log(`  ${padR('', 36)}${padL('SHIPPED', 16)}${padL('ABSURD', 16)}${padL('delta', 16)}`)
  const medOf = (rows: Read[], pick: (r: Read) => number) =>
    median(rows.map((r) => share(pick(r), billCents(r)) ?? 0))
  const row = (label: string, a: number, b: number) =>
    console.log(`  ${padR(label, 36)}${padL(pct(a), 16)}${padL(pct(b), 16)}${padL(`${(b - a).toFixed(1)} pp`, 16)}`)
  const cash = (label: string, pick: (r: Read) => number) =>
    console.log(
      `  ${padR(label, 36)}${padL(money(median(live.map(pick))), 16)}${padL(money(median(absurd.map(pick))), 16)}` +
        `${padL(money(median(absurd.map(pick)) - median(live.map(pick))), 16)}`,
    )
  // ⭐ THE TWO DIALS, EACH READ ON THE CHANNEL IT ACTUALLY CONTROLS.
  cash('kit covered, median per career', (r) => r.kitCoveredCents)
  cash('letters gross, median per career', (r) => r.letterGrossCents)
  cash('letters to the family, median', (r) => r.letterFamilyCents)
  row('LETTERS-ONLY coverage, median', medOf(live, letterSponsorCents), medOf(absurd, letterSponsorCents))
  const kitMoved = median(absurd.map((r) => r.kitCoveredCents)) > median(live.map((r) => r.kitCoveredCents))
  const adMoved = median(absurd.map((r) => r.letterGrossCents)) > median(live.map((r) => r.letterGrossCents))
  const coverMoved = medOf(absurd, letterSponsorCents) > medOf(live, letterSponsorCents)
  console.log(
    `\n  -> the KIT dial is ${kitMoved ? 'WIRED' : '**NOT WIRED**'}; the ADVERTISING dial is ${adMoved ? 'WIRED' : '**NOT WIRED**'};` +
      ` the letters-only coverage ${coverMoved ? 'FOLLOWS THEM' : '**DOES NOT FOLLOW – THE TABLES ABOVE ARE A NULL**'}`,
  )

  // ⭐⭐ ...AND THE COMPOSITE MOVES THE OTHER WAY, WHICH IS A FINDING RATHER THAN A FAILED PROOF. The
  // cameo is NEED-BASED (`sponsorNeedMet` reads the family's own balance), so paying the brands'
  // money into the same wallet SWITCHES IT OFF. A richer family is a family the shop stops helping,
  // and on this corpus the cameo it loses is larger than the letters it gains – which is why the
  // actuation verdict above is read on the letters alone and not on the total.
  row('family-side coverage, median', medOf(live, familySponsorCents), medOf(absurd, familySponsorCents))
  cash('  ...of which the cameo, median', (r) => r.cameoCents)
  console.log(
    '\n  ⚠ THE CAMEO IS A NEED GATE, SO THE TOTAL IS NOT MONOTONE IN THE SPONSOR CONSTANTS: more brand' +
      '\n    money makes the family solvent and `sponsorNeedMet` then refuses the shop. Read the dials on' +
      '\n    the letters; read the total as a design fact.',
  )
  console.log(
    `  restored: junior feeBps ${JUNIOR.feeBps}, chanceBps ${JUNIOR.chanceBps}, local $${SPONSORSHIP.seasonCents / 100} / ` +
      `$${SPONSORSHIP.topSeasonCents / 100}, rungs ${RUNGS.map((r) => `$${r.seasonCents / 100}`).join(' / ')}`,
  )
}

function main(): void {
  console.log('\n⭐⭐ ROUND 42 #40 – WHAT SHARE OF THE JUNIOR BILL DO THE SPONSORS PAY?')
  const rows = runCorpusWithHeader()
  report(rows)
  if (ABSURD) actuation()
  else console.log('\n\n§5 ACTUATION – not run. Pass `--absurd` to prove the dials move the output.')
}

function runCorpusWithHeader(): Read[] {
  console.log(
    '\n§1 THE BAND AND THE CORPUS' +
      `\n  the junior band  : every ledger row before her EIGHTEENTH birthday (kidAgeYears < ${JUNIOR_UNTIL_AGE}, her REAL age)` +
      `\n  the walk         : ${WALK_WEEKS} weeks, so the band can never be truncated by the horizon` +
      `\n  the corpus       : ${SEEDS} seeds x ${PRESETS.length} presets = ${SEEDS * PRESETS.length} careers, seeds \`bench-<background>-<0..${SEEDS - 1}>\`` +
      `\n  the policy       : '${POLICY.label}' (econ-bench POLICIES[1])` +
      '\n  the parent       : signs the strongest live kit letter and EVERY live advertising letter' +
      `\n  shipped now      : junior ad fee ${SHIPPED_JUNIOR.feeBps / 100}% of the adult cell, arrivals ${SHIPPED_JUNIOR.chanceBps / 100}% of the adult rate;` +
      `\n                     kit allowances a season – local $${SHIPPED_LOCAL.seasonCents / 100} / top $${SHIPPED_LOCAL.topSeasonCents / 100} / ` +
      `${RUNGS.map((r) => `$${r.seasonCents / 100}`).join(' / ')}; manager's cut ${ECONOMY.managerCommission.bps / 100}%` +
      (ZERO_SPONSORS ? '\n  ⚠⚠ --zero-accounting: THE SPONSOR NUMERATOR IS ZEROED. Every share below must read 0.0%.' : ''),
  )
  const rows = runCorpus()
  console.log(
    `  measured band    : she is ${num(rows[0].ageAtWeek0, 2)} at week 0 and turns ${JUNIOR_UNTIL_AGE} after week ` +
      `${rows[0].bandLastWeek} – ${rows[0].bandWeeks} weeks, ${num(rows[0].bandWeeks / WEEKS_PER_YEAR, 1)} seasons`,
  )
  return rows
}

function runCorpus(): Read[] {
  return runArm(SEEDS)
}

main()

// THE KIT SHE PLAYS WITH, AS A DECISION - the till, and what the Money screen reads off it.
//
// The owner, W3-KIT: «давайте сделаем эти ручки для ракеток, обуви и прочего, чтобы пользователь мог
// выбирать. Может быть в ledger?» - so the shop window is the Money screen, which is where the family
// already looks at what it spends.
//
// AND THE RULING BEHIND THE LADDER, which is the thing that had to survive into code: «я вообще за
// оба подхода одновременно, как с тренерами. Мы же точно знаем, что начальные ракетки из алюминия
// тяжелее и хуже во многом, чем начальные композитные, значит экип влияет и на травмы и на
// производительность игрока.» A rung is a coach rung: it moves what she can do AND what happens to
// her body, and the parent pays for it.
//
// ⚠ THIS FILE OWNS NO ARITHMETIC. Where a rung lands is engine/equipment.ts (`kitWearAt` folds it in
// under the same clamp the wear model always had, which is why the anti-destiny bound is structural
// rather than tuned); what a rung costs is `kitLinePriceCents`; what it is called is
// `ECONOMY.equipment.gradeCopy`. What lives here is the two things a WORLD is needed for: charging
// the purchase, and assembling the view.
//
// ⚠ RNG: nothing here draws, on any stream. The over-the-counter price is the deterministic shop
// window (see `kitLinePriceCents`), the recurring bill keeps its own `seed:gear:<category>` draw
// inside `resolveGear`, and the frozen MAIN capture (41550 / e6b0c709) cannot see a purchase.
//
// ⚠ DEPENDENCY DIRECTION. `WorldState` is a TYPE-ONLY import, so world.ts imports these values with
// no runtime cycle - the same shape every other `world/*.ts` leaf keeps.
import { ECONOMY } from '../economy'
import {
  DEFAULT_KIT_GRADES,
  KIT_GRADES,
  LINE_GEAR_CATEGORY,
  defaultKitState,
  kitLinePriceCents,
  kitWearAt,
} from '../equipment'
import { activeKitDeal, kitFreshCap } from '../offers'
import type { KitDealView, KitGrade, KitLine, KitLineView, KitOfferTerms } from '../../shared/protocol'
import { addEvent } from './ledger'
import type { WorldState } from '../world'
import { guardNotEnded } from './endings'

/** The three lines, in the order the equipment model reads them and the screen draws them. */
export const KIT_LINES: readonly KitLine[] = ['strings', 'frame', 'shoes']

/** Her kit state, with the shipped default standing in for a world that predates the field. ONE
 *  place answers "what is she on", so the till, the snapshot and the wear model cannot disagree. */
export function kitStateOf(world: WorldState): NonNullable<WorldState['kit']> {
  return world.kit ?? defaultKitState()
}

/** Where a rung sits on the ladder. -1 for a value that is not a rung at all, which is what makes the
 *  guard in `setKitGrade` a real check rather than a cast. */
function rungIndex(grade: KitGrade): number {
  return KIT_GRADES.indexOf(grade)
}

/** The wear at which the Money screen's own vocabulary stops calling a line usable. `wearWord` bands
 *  it Fresh / Fine / Worn / Gone at 0.25 / 0.55 / 0.85, so this is the "Worn" edge - the week the
 *  parent would look at the row and think about replacing it. */
const WORN_AT = 0.55

/**
 * HOW MANY WEEKS A NEW ONE OF THESE STAYS OUT OF "WORN" - what a rung actually buys, in the only
 * unit that is honest about it.
 *
 * ⚠ READ engine/equipment.ts BEFORE CHANGING THIS. A rung does exactly two things and NEITHER of
 * them is an upside: `startWear` puts a cheap line partway down its own curve the day it is bought,
 * and `lifeFactor` stretches or shortens the curve. Fresh kit is EXACTLY neutral at every rung -
 * `startWear` is 0 from `composite` up, every multiplier is 1, and the file's own promise is that
 * "wear only ever subtracts". So a `pro` frame does not hit harder than a `composite` one; it is
 * simply still sound in week 24 when the composite is not.
 *
 * That is why this returns TIME and not a power figure: a screen that said "pro: +3% serve" would be
 * inventing a bonus the model refuses to give, and a screen that said nothing at all (which is what
 * shipped) leaves the parent buying a four-times bill on faith. Weeks-until-Worn is the true
 * sentence, it is derived from the same constants the wear curve uses, and it moves the moment a
 * knob does.
 *
 * The frame carries its flat head (`frameSoundWeeks`, "sound is sound however old"); strings and
 * shoes decay from the first week. Pure, no draws, no world needed.
 */
export function goodWeeksFor(line: KitLine, grade: KitGrade): number {
  const e = ECONOMY.equipment
  const rung = e.grades[grade]
  const room = Math.max(0, WORN_AT - rung.startWear[line])
  if (line === 'frame') {
    return Math.round(rung.lifeFactor * (e.frameSoundWeeks + room * e.framePatchWeeks))
  }
  const life = line === 'strings' ? e.stringLifeWeeks : e.shoeLifeWeeks
  return Math.round(room * life * rung.lifeFactor)
}

/**
 * MOVE ONE LINE OF HER KIT ONTO ANOTHER RUNG. The only way `world.kit.grade` ever changes.
 *
 * ⚠ UP IS A PURCHASE AND DOWN IS AN INSTRUCTION, and the asymmetry is the honest one:
 *   * moving UP she walks out of the shop holding the thing. One bill at once, at the rung's own
 *     price, and the line's wear clock resets - `sinceWeek` is what says she is holding a new frame
 *     THIS week rather than one that happens to be a better model of the frame she has been playing
 *     with for eleven weeks.
 *   * moving DOWN costs nothing and resets nothing. Nobody refunds a racket she owns; what changes is
 *     what the family buys NEXT time the cadence comes round, which is exactly what a downgrade is.
 *
 * ⚠ IT MAY PUT THE FAMILY IN THE RED, and that is deliberate rather than an oversight. `resolveGear`
 * has always billed the recurring purchase unconditionally - engine/equipment.ts's own note says "a
 * family that cannot afford a restring buys it anyway and goes further into the red" - so refusing a
 * chosen purchase for want of funds would make the ONE gear decision the player controls stricter
 * than the ones he does not. The screen shows the balance and the price; the parent decides.
 *
 * ⚠⚠ AND THE SPONSOR PAYS FOR A LINE IT COVERS (owner, 08.08). Until this wave this function was the
 * ONE place in the game that spent money on kit without asking whether somebody else had promised to
 * pay for it: `resolveGear` consulted `activeKitDeal` for the recurring bill and `kitFreshCap` held
 * the wear down, and the till here did neither. So the letter said «Her strings and frames - up to
 * $3,000 of kit over the season, on us», the Money screen printed "Her sponsor supplies this line"
 * directly under the buttons, and pressing one charged the family in full. Measured on the owner's
 * own save: a national deal covering strings and frame, $536.22 of allowance still unspent, and both
 * pro purchases billed at 100%. «ну надо что-то с этим сделать, а то совсем непонятный механизм
 * сейчас.»
 *
 * The arithmetic is `resolveGear`'s, deliberately - same `Math.min(amount, remaining)`, same
 * allowance ceiling, same "the line is still EMITTED at what the family actually paid" so a $0 row
 * explains itself in the breakdown instead of vanishing. Buying up therefore does not buy MORE
 * sponsorship; it spends the same allowance faster, which is the honest trade and needed no new rule.
 *
 * Zero draws, and the whole thing is idempotent: setting the rung she is already on does nothing at
 * all, so a double-tap cannot buy two frames.
 */
export function setKitGrade(world: WorldState, line: KitLine, grade: KitGrade): void {
  // ⚠ W2-ENDINGS: the career must still have a next week. The engine re-validates every command
  // because the worker is not the gate - a tab left open behind the epilogue must not be able to
  // spend money for a girl who has retired.
  guardNotEnded(world)
  if (!KIT_LINES.includes(line)) throw new Error('Unknown kit line')
  if (rungIndex(grade) < 0) throw new Error('Unknown kit grade')
  const kit = kitStateOf(world)
  world.kit = kit
  const current = kit.grade[line]
  if (current === grade) return

  const movingUp = rungIndex(grade) > rungIndex(current)
  kit.grade[line] = grade
  if (!movingUp) return

  const costCents = kitLinePriceCents(world.profile.background, line, grade)
  kit.sinceWeek[line] = world.week
  const { paidCents, coveredCents, brand } = chargeKitPurchase(world, line, costCents)
  world.fundsCents -= paidCents
  addEvent(world, {
    week: world.week,
    type: 'expense',
    // The ledger's own split, not a new bucket: stringing has had its own row on the Money pie since
    // round 7 because it recurs far more often than the rest, and a bought string bed is stringing.
    category: ECONOMY.gear[LINE_GEAR_CATEGORY[line]].breakdown,
    text: coveredCents > 0
      ? `Bought: ${ECONOMY.equipment.gradeCopy[grade][line].label} – on ${brand}`
      : `Bought: ${ECONOMY.equipment.gradeCopy[grade][line].label}`,
    // `|| 0` because a fully covered purchase makes `-paidCents` the NEGATIVE ZERO, which survives
    // into the ledger and out through any formatter as "-$0". JSON round-trips it to 0 anyway, so
    // this only ever changes what a screen would print.
    amountCents: -paidCents || 0,
  })
}

/** WHAT THE FAMILY ACTUALLY PAYS FOR ONE OVER-THE-COUNTER PURCHASE, and what the brand picks up.
 *
 *  ⚠ THE ONE PLACE THE PURCHASE PATH ASKS ABOUT THE DEAL, and it mutates `coveredCents` because the
 *  allowance is a single shared pot: a frame bought at the shop and a restring billed on cadence are
 *  spending the same $3,000, which is what stops "buy up on every line" being free money. Exported
 *  so `kitLineViews` can quote the SAME answer on the button the parent is about to press - a screen
 *  that priced this itself is a screen that can disagree with the till. */
export function kitPurchaseSplit(
  world: WorldState,
  line: KitLine,
  costCents: number,
): { paidCents: number; coveredCents: number; brand: string } {
  const deal = activeKitDeal(world.offers ?? [], world.week)
  const terms = deal ? (deal.terms as KitOfferTerms) : null
  if (!deal || !terms || !terms.covers.includes(line)) return { paidCents: costCents, coveredCents: 0, brand: '' }
  const remaining = kitAllowanceRemainingCents(terms, deal.coveredCents ?? 0)
  const coveredCents = Math.min(costCents, remaining)
  return { paidCents: costCents - coveredCents, coveredCents, brand: terms.brand }
}

/** WHAT IS LEFT OF THE SEASON'S ALLOWANCE, in cents - the one number the Bills page never had.
 *
 *  ⚠ IT IS THE TILL'S OWN EXPRESSION, LIFTED RATHER THAN COPIED. `kitPurchaseSplit` reads exactly
 *  this to decide what a purchase costs, and `resolveGear` reads the same shape for the recurring
 *  bill; a screen that subtracted `coveredCents` for itself would be a third computation of a number
 *  two others already own, and the whole defect this fixes is two surfaces disagreeing about it. */
export function kitAllowanceRemainingCents(terms: KitOfferTerms, spentCents: number): number {
  return Math.max(0, terms.kitAllowanceCents - spentCents)
}

/** HER KIT DEAL AS THE BILLS PAGE READS IT - the running contract, its remaining quota and its term.
 *
 *  Null when nobody is kitting her out. Derived at snapshot time and persisting nothing, exactly as
 *  `kitLineViews` is; see `KitDealView` for why every field on it is there. */
export function kitDealView(world: WorldState): KitDealView | null {
  const deal = activeKitDeal(world.offers ?? [], world.week)
  if (!deal) return null
  const terms = deal.terms as KitOfferTerms
  const spentCents = deal.coveredCents ?? 0
  return {
    tier: terms.tier,
    brand: terms.brand,
    // A COPY, like every array on this message: the snapshot is never a live view of engine state,
    // and `covers` is a persisted term on the offer itself.
    covers: [...terms.covers],
    allowanceCents: terms.kitAllowanceCents,
    spentCents,
    remainingCents: kitAllowanceRemainingCents(terms, spentCents),
    seasons: terms.seasons ?? 1,
    // A deal in force HAS both weeks - `signOffer` writes them and the v41 migration back-filled
    // every shipped contract - so the fallbacks are for a hand-edited save rather than a real one.
    fromWeek: deal.fromWeek ?? deal.decidedWeek ?? deal.week,
    untilWeek: deal.untilWeek ?? deal.week,
    minEventsPerSeason: terms.minEventsPerSeason,
  }
}

/** The same split, and it BANKS the spend against the allowance. Only the till may call this. */
function chargeKitPurchase(
  world: WorldState,
  line: KitLine,
  costCents: number,
): { paidCents: number; coveredCents: number; brand: string } {
  const split = kitPurchaseSplit(world, line, costCents)
  if (split.coveredCents > 0) {
    const deal = activeKitDeal(world.offers ?? [], world.week)!
    deal.coveredCents = (deal.coveredCents ?? 0) + split.coveredCents
  }
  return split
}

/**
 * HER KIT AS THE MONEY SCREEN READS IT - one row per line, every rung priced, her condition on it.
 *
 * Derived at snapshot time and persisting nothing, like every other view block. The screen may not
 * price a rung or read a wear curve itself: this app's standing rule is that a surface which derives
 * its own fact is a surface that can disagree with the engine, and the equipment model is precisely
 * where a disagreement would be invisible (a price is checkable; a wear coefficient is not).
 */
export function kitLineViews(world: WorldState): KitLineView[] {
  const kit = kitStateOf(world)
  const bg = world.profile.background
  const cap = kitFreshCap(world.offers ?? [], world.week)
  const wear = kitWearAt(world.seed, bg, world.week, cap, kit)
  return KIT_LINES.map((line) => {
    const grade = kit.grade[line] ?? DEFAULT_KIT_GRADES[line]
    return {
      line,
      grade,
      label: ECONOMY.equipment.gradeCopy[grade][line].label,
      blurb: ECONOMY.equipment.gradeCopy[grade][line].blurb,
      wear: wear[line],
      rungs: KIT_GRADES.map((g) => {
        const priceCents = kitLinePriceCents(bg, line, g)
        return {
          grade: g,
          label: ECONOMY.equipment.gradeCopy[g][line].label,
          blurb: ECONOMY.equipment.gradeCopy[g][line].blurb,
          priceCents,
          // ⚠ WHAT THE FAMILY WOULD ACTUALLY HAND OVER, engine-computed (08.08). The sticker price
          // and the bill are two different numbers the moment a deal covers this line, and the
          // screen may not derive the second from the first - it is the till's answer or nothing.
          payableCents: kitPurchaseSplit(world, line, priceCents).paidCents,
          // ⚠ AND WHAT THE RUNG BUYS, IN WEEKS (owner, 08.08: «хорошо бы дать понять что разные
          // тиры шмота дают вообще»). See `goodWeeksFor` - it is the only honest unit here, because
          // a rung buys TIME on good kit and never a bonus.
          goodWeeks: goodWeeksFor(line, g),
          owned: g === grade,
        }
      }),
      // ⚠ WORTH SAYING OUT LOUD ON THE SCREEN, because it changes what buying up is FOR. A signed
      // deal holds a covered line's wear under `freshCap` whatever rung she is on, so on that line
      // the ladder mostly moves the BILL (which the brand is paying, until the allowance runs out)
      // and hardly moves her condition at all. That is the right answer - somebody else is kitting
      // her out - and it is a fact the parent should be able to see before he spends.
      sponsored: cap?.[line] !== undefined,
    }
  })
}

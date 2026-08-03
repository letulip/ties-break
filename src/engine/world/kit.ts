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
import { kitFreshCap } from '../offers'
import type { KitGrade, KitLine, KitLineView } from '../../shared/protocol'
import { addEvent } from './ledger'
import type { WorldState } from '../world'

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
 * Zero draws, and the whole thing is idempotent: setting the rung she is already on does nothing at
 * all, so a double-tap cannot buy two frames.
 */
export function setKitGrade(world: WorldState, line: KitLine, grade: KitGrade): void {
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
  world.fundsCents -= costCents
  addEvent(world, {
    week: world.week,
    type: 'expense',
    // The ledger's own split, not a new bucket: stringing has had its own row on the Money pie since
    // round 7 because it recurs far more often than the rest, and a bought string bed is stringing.
    category: ECONOMY.gear[LINE_GEAR_CATEGORY[line]].breakdown,
    text: `Bought: ${ECONOMY.equipment.gradeCopy[grade][line].label}`,
    amountCents: -costCents,
  })
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
      rungs: KIT_GRADES.map((g) => ({
        grade: g,
        label: ECONOMY.equipment.gradeCopy[g][line].label,
        blurb: ECONOMY.equipment.gradeCopy[g][line].blurb,
        priceCents: kitLinePriceCents(bg, line, g),
        owned: g === grade,
      })),
      // ⚠ WORTH SAYING OUT LOUD ON THE SCREEN, because it changes what buying up is FOR. A signed
      // deal holds a covered line's wear under `freshCap` whatever rung she is on, so on that line
      // the ladder mostly moves the BILL (which the brand is paying, until the allowance runs out)
      // and hardly moves her condition at all. That is the right answer - somebody else is kitting
      // her out - and it is a fact the parent should be able to see before he spends.
      sponsored: cap?.[line] !== undefined,
    }
  })
}

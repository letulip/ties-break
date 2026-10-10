// A-06 / T6.10 – `world/lifeBeat.ts` §8 MOVED HERE VERBATIM, span for span, comments and all.
//
// ⚠ ended: THE HAZARD DIRECTION, as `world/lifeBeat/bereavement.ts`'s header sets it out: this module imports the hub – `endedKeptRow`…
// ⚠ ended: IT IMPORTS TWO SIBLINGS DIRECTLY AND THAT IS THE PACKAGE WORKING RATHER THAN A SHORTCUT.
// ⚠⚠ ended: `rollEnds` IS ONE OF THE THREE PLACES `spiritShock` IS SET
// ⚠ ended: `seed:life:ends:<episodeId>:<week>` AND THE READ/REGISTER DRAWS LIVE HERE NOW
// → docs/notes/life-beats/ended.md#endedts-header
import { rngFromSeed } from '../../rng'
import { ECONOMY } from '../../economy'
import { cp } from '../../../shared/i18n'
import { expressedTemperamentOf } from '../../spirit'
import { addEvent } from '../ledger'
import { activeEpisode, endEpisode } from '../loveEpisodes'
import { captureMilestone, fireMilestone } from '../milestones'
import { divorcedKeptRow } from './divorcedCopy'
import { endedKeptRow, hasBeatFor, listenHeardNow, raiseLifeBeat, voiceOf } from '../lifeBeat'
import type { HeardRead } from '../lifeBeat'
import type { Temperament } from '../../spirit'
import type { WorldState } from '../state'

// 8. THE END – ⚠⚠ THE WEEK IT IS OVER (the private life, wave 4: T2) –
// `docs/plans/life-wave-4-builder-2026-09.md` §2 T2, constants in `ECONOMY.life` (who-she-is
// §4's `end` column). §5 above decides whether someone appears; this decides whether they are
// still there, and it is the step that makes the attachment an ARC instead of a state a career
// enters once.
//
// ⚠ ended: IT IS §8 AND NOT §5b, AND THE POSITION IS A COMPROMISE RATHER THAN A READING.
// ⚠⚠ ended: THE FIFTH STREAM, AND IT IS THE ONE §5 AND §7 HAVE BEEN RESERVING SINCE WAVE 3
// ⚠ ended: RE-AIMED BY T4: this said `seed:life:ends:<week>:react` «does not exist on this tree», and it does now…
// ⚠ ended: THIS FUNCTION DERIVES ONLY THE FIRST OF THEM
// ⚠⚠ ended: ZERO DRAWS ON MAIN AND ZERO DRAWS ON AN INELIGIBLE WEEK.
// ⚠ ended: AND THE TEST FOR THAT IS A KEY COUNT, NOT AN ALIGNMENT COMPARISON
// ⚠⚠ ended: NO FEED LAG FOR AN ENDING, v1
// ⚠⚠ ended: IT RAISES NOTHING AND WRITES NO ROW
// ⚠ ended: AND THE TOLD-LATE HALF IS NOT HERE AND CANNOT BE
// → docs/notes/life-beats/ended.md#endedts-8--the-end

/** ⭐⭐ THE GATE – ONE CLAUSE, AND A FALSE HERE MEANS **ZERO DRAWS**, not a discarded one.
 *
 *  ⚠⚠ endsEligible: A PREDICATE OF ITS OWN FOR `arrivalEligible`'s AND `smallTalkEligible`'s STATED REASON
 *  ⚠ endsEligible: THE WHOLE OF IT IS «IS SOMEBODY THERE», and it is `activeEpisode`'s answer rather than a second spelling of it.
 *  ⚠⚠ endsEligible: IT COUNTS FROM `sinceWeek`, NEVER FROM `knownWeek`.
 *  → docs/notes/life-beats/ended.md#endseligible--the-gate--one-clause-and-a-false-here-means-zero
 */
export function endsEligible(world: WorldState): boolean {
  return activeEpisode(world) !== null
}

/** THE WEEKLY END HAZARD, as one probability (who-she-is §4: base 1.2%/wk times the
 *  temperament's `end` multiplier). Takes the TEMPERAMENT rather than the world –
 *  `arrivalHazardFor`'s own primitives doctrine – so the corridor tests and T7's census can
 *  sweep the table directly instead of posing a world per cell.
 *
 *  ⚠⚠ endsHazardFor: IT READS `endsMult` AND NOT `temperamentMult`, WHICH IS RULING E AND IS THE ONE LINE IN THIS SECTION MOST LIKELY…
 *  ⚠ endsHazardFor: NO AGE TERM, unlike the arrival's – §4's end column is one rate for the whole life.
 *  → docs/notes/life-beats/ended.md#endshazardfor--the-weekly-end-hazard-as-one-probability
 */
export function endsHazardFor(temperament: Temperament): number {
  return ECONOMY.life.endsPerWeek * ECONOMY.life.endsMult[temperament]
}

/** ⭐⭐⭐ THE WEEKLY ROLL, and the ONE caller of `endEpisode`.
 *
 *  ⚠⚠ rollEnds: THE GATE RUNS FIRST AND RETURNS BEFORE ANY STREAM IS DERIVED.
 *  ⚠⚠ rollEnds: IT RUNS BEFORE `rollArrival` IN THE TICK, AND TWO RULINGS REST ON THAT ORDER (the wave-4 rulings, F and A).
 *  ⚠ rollEnds: `<` AND NOT `<=`, `rollArrival`'s own note: `rngFromSeed` can return exactly 0…
 *  ⚠⚠ rollEnds: IT TAKES NO `Rng`, AND SINCE T3 IT WRITES THE DATE **AND THE MARK**
 *  ⚠⚠ rollEnds: THE MARK IS SET HERE AND THE ARITHMETIC IS DONE THERE, WHICH IS THE WHOLE SPLIT
 *  ⚠ rollEnds: IT IS SET ON THE SAME LINE-RUN AS THE DATE AND NEVER CONDITIONALLY
 *  → docs/notes/life-beats/ended.md#rollends--the-weekly-roll-and-the-one-caller-of-endepisode
 */
export function rollEnds(world: WorldState): void {
  if (!endsEligible(world)) return
  // ⭐ v75 T4 – THE ROW IS TAKEN **BEFORE** IT IS DATED, because after `endEpisode` runs
  // `activeEpisode` is null by construction and there would be no id left to raise the beat about.
  // ⭐ RE-AIMED BY v83 (the wedding, wave 7 – T4), NOT WEAKENED: the fetch moved ABOVE the draw,
  // because the row now prices its own hazard – the latch below reads it – and the reason it was
  // taken early at all (dated rows have no id left) holds one line further up unchanged.
  const over = activeEpisode(world)!
  // ⚠⚠ EXPRESSION, NOT BIRTH – v76's T7, THE ARCHITECT'S RULING A. The hazard is EVALUATED NOW
  // and nothing about it is stored: what `endEpisode` writes is a DATE. So the multiplier is the
  // one belonging to the girl she is this week. ⚠ AND IT IS THE INTENSITY AXIS THAT OWNS THIS
  // ONE (who-she-is §1: «INTENSITY owns how hard things land and how long feelings hold – … an
  // attachment's end-hazard»), which is why a `reg` flip is the axis that moves it.
  //
  // ⚠ rollEnds: THE FACTOR LIVES HERE AND NOT IN `endsHazardFor`, DELIBERATELY
  // ⚠ rollEnds: NOT ZERO AND NOT A GATE: a latched episode ending through this same hazard stays possible and rare…
  // ⚠ rollEnds: ZERO RNG CHANGE: same one uniform, same key, same draw count on every week – only the THRESHOLD moves…
  // → docs/notes/life-beats/ended.md#rollends--expression-not-birth--v76-t7-the-architects-ruling-a
  const hazard =
    endsHazardFor(expressedTemperamentOf(world)) *
    (over.latchedWeek !== null ? ECONOMY.wedding.latchEndFactor : 1)
  // ⭐ ONE UNIFORM, ONE WEEK, ITS OWN KEY – and the key carries no temperament, so the four girls read
  // the SAME uniform against four different hazards. That is what makes the multiplier a pure scale
  // rather than four unrelated dice, and it is the property the nesting pin holds them to.
  if (rngFromSeed(`${world.seed}:life:ends:${world.week}`)() >= hazard) return
  // ⭐⭐⭐ v88 (the parting, wave 12 – T2) – **THE WHOLE OF THE WAVE'S ENGINE, AND IT IS A PURE
  // READ.** Was this a marriage? Everything below splits on this one boolean and nothing else:
  // the shock's kind, the card's kind, the kept row's sentence and its stamp.
  //
  // ⚠ rollEnds: NOT A SECOND DRAW, NOT A SECOND GATE AND NOT A SECOND HAZARD
  // ⚠⚠ rollEnds: IT IS TAKEN BEFORE `endEpisode` FOR READABILITY AND NOT FOR SAFETY
  // → docs/notes/life-beats/ended.md#rollends--v88--the-whole-of-the-waves-engine-is-a-pure-read
  const married = over.latchedWeek !== null
  endEpisode(world, world.week)
  // ⭐⭐⭐ v75 T3 – AND THE MARK IT LEAVES ON HER. A fact, never a number: what it costs is
  // `ECONOMY.spirit.shock.breakup` and `accrueSpirit` is the one place that reads it (see the
  // note above). The kind is the union's only member today; steps 7–8 add the others.
  //
  // ⚠ rollEnds: THE SPLIT IS THE WHOLE OF WHAT THIS LINE DOES
  // → docs/notes/life-beats/ended.md#rollends--v75-t3--and-the-mark-it-leaves
  world.spiritShock = { week: world.week, kind: married ? 'divorce' : 'breakup' }
  // ⭐⭐⭐ v75 T4, RULING B – AND THE TOLD-NOW CARD, **ONLY IF HE ALREADY KNEW THERE WAS
  // SOMEBODY**.
  //
  // ⚠⚠ rollEnds: THE RECEIPT IS THE WHOLE CONDITION AND IT IS RULING A's DISCRIMINATOR, NOT `knownWeek`.
  // ⚠ rollEnds: IT IS REACHABLE, NOT A CORNER
  // ⚠ rollEnds: AND THE OTHER SIDE OF THE FALL-THROUGH IS THE TOLD-LATE SCENE ITSELF
  // ⚠⚠ rollEnds: THE ROW AND THE CARD SHARE ONE CONDITION AND MUST GO ON SHARING IT.
  // ⚠ rollEnds: THE ORDER IS THE READING, as it is in §6
  // → docs/notes/life-beats/ended.md#rollends--v75-t4-ruling-b--the-told-now-card-only-if-he-knew
  if (!hasBeatFor(world, over.id, ['met'])) return
  // ⭐⭐⭐ v76 T6 – THE THIRD AND LAST RAISE SITE OF A READ-BEARING BEAT, and it reads the coin
  // exactly as §6's two do: one uniform on `seed:psy:listen:ended:<week>`, spent on the kept
  // row's text below and on the card's stamp underneath it. ⚠ IT IS DRAWN **AFTER** THE RECEIPT
  // GATE, so an ending that raises nothing here derives nothing either – the told-late path in
  // §6 owns that episode and draws its own coin on the week the parent actually hears of it.
  //
  // ⚠ rollEnds: IT RETURNS RATHER THAN BRANCHING THE REST
  // ⚠⚠ rollEnds: THE LISTEN COIN IS **NOT DERIVED ON THIS PATH**, AND THAT IS A REAL CONSEQUENCE RATHER THAN AN OMISSION
  // ⚠ rollEnds: IT COSTS NO STREAM EITHER WAY
  // → docs/notes/life-beats/ended.md#rollends--v76-t6--the-third-and-last-raise-site
  if (married) {
    addEvent(world, {
      week: world.week,
      type: 'life',
      // ⚠ KEPT, for `MET_EVENT`'s own reason: a career reads its own life back seasons later and the
      // week a marriage ended is not a line the album may be missing.
      keep: true,
      // ⚠ NO AMOUNT – a life beat is never a purchase (rule 4), and there is no money in this wave
      // at all (spec §2.4, his wedding ruling extended).
      text: divorcedKeptRow(),
      // ⭐ L3-5 (10.10): `c` beside the text – the kept row's one sentence, its own key
      c: { k: divorcedKeptRow() },
      lifeKind: 'divorced',
    })
    // ⭐⭐⭐ v88 (the parting, wave 12 – T3) – AND THE ALBUM KEEPS A LINE, on his «можно» of 23.09.
    // `landWedding`'s two-surface idiom exactly: `fireMilestone` keeps the line past every prune
    // and `captureMilestone` gives the scroll its row, both idempotent per `divorce:<episodeId>` –
    // so a SECOND marriage's divorce on a later row captures its own line, which is the 11.09
    // re-shape inherited from the wedding this closes.
    //
    // ⚠⚠ rollEnds: THIS IS THE ONE WEEK IN THE GAME THAT WRITES BOTH A `'life'` ROW AND A `'milestone'` ROW
    // ⚠ rollEnds: SO THE TWO SENTENCES ARE WRITTEN NOT TO STUTTER
    // ⚠ rollEnds: THE ALBUM LINE SETTLES NOTHING
    // ⚠ rollEnds: HIS REVIEW APPLIED 23.09
    // → docs/notes/life-beats/ended.md#rollends--v88-t3--the-album-keeps-a-line
    fireMilestone(world, `divorce:${over.id}`, 'The marriage ended. We had no say in it, only in what we said next.', cp`The marriage ended. We had no say in it, only in what we said next.`)
    captureMilestone(world, { type: 'divorce', week: world.week, kind: over.id })
    raiseLifeBeat(world, 'divorced', over.id)
    return
  }
  const heardNow = listenHeardNow(world, 'ended')
  const frameNow: HeardRead | null = heardNow === true ? { voice: voiceOf(world), wants: over.wants } : null
  addEvent(world, {
    week: world.week,
    type: 'life',
    // ⚠ KEPT. `pruneEvents` drops ordinary rows at sixty weeks and a career reads its own life back
    // seasons later; the week it ended is not a line the album may be missing, for `MET_EVENT`'s own
    // reason one scene on.
    keep: true,
    // ⚠ NO AMOUNT – a life beat is never a purchase (rule 4), and the absence of the field is what
    // keeps `accrueFinance` from ever seeing this row. ⚠⚠ NO READ ON THIS ROW IN EITHER ARM –
    // RULING O, and T6b took the legible half back out.
    //
    // ⚠⚠ rollEnds: SO `seed:life:ends:<week>:react` IS NOT DERIVED HERE ON EITHER ARM
    // → docs/notes/life-beats/ended.md#rollends--no-amount--a-life-beat-is-never-a-purchase
    text: endedKeptRow('told-now', 'space', frameNow),
    // ⭐ L3-5 (10.10): `c` beside the text – the told-now row is one sentence whatever the read or the frame (`ENDED_NOW_EVENT`), its own key
    c: { k: endedKeptRow('told-now', 'space', frameNow) },
    // ⭐ THE KIND, STAMPED – the same `'ended'` the told-late row carries, because it is the same
    // piece of news in the other register (see that row's note).
    lifeKind: 'ended',
  })
  raiseLifeBeat(world, 'ended', over.id, heardNow ?? undefined)
}


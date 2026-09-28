// A-06 / T6.10 – `world/lifeBeat.ts` §8 MOVED HERE VERBATIM, span for span, comments and all.
//
// ⚠ THE HAZARD DIRECTION, as `world/lifeBeat/bereavement.ts`'s header sets it out: this module imports
// the hub – `endedKeptRow`, `hasBeatFor`, `listenHeardNow`, `raiseLifeBeat`, `voiceOf`, plus
// `HeardRead` as an `import type`, which TypeScript erases – so the hub
// re-exports NOTHING of it. `src/engine/world.ts` takes the three names off `./world/lifeBeat/ended`
// and re-exports them on its existing export statement, so the barrel's frozen name set (T6.6) does not
// move a specifier; `world/phaseHerWeek.ts` asks this module for `rollEnds`. The edge runs
// world.ts → ended → lifeBeat, and the hub reaches `world.ts` only as `import type`, erased.
//
// ⚠ IT IMPORTS TWO SIBLINGS DIRECTLY AND THAT IS THE PACKAGE WORKING RATHER THAN A SHORTCUT.
// `world/lifeBeat/endedCopy.ts` holds `'ended'`'s words and `world/lifeBeat/divorcedCopy.ts` holds the
// parting feed row – both are COPY leaves, neither imports this file, and `divorcedKeptRow` was the last
// name the hub was importing from the divorce's copy purely on this section's behalf, so that import
// left the hub with the section. A copy leaf may be read by the hub and by a hazard alike; what it may
// never do is import one back.
//
// ⚠⚠ `rollEnds` IS ONE OF THE THREE PLACES `spiritShock` IS SET, and after T6.10 the three sit one per
// file – `tests/wave4-spirit-shock.test.ts`' exhaustive census is the instrument that says so, and it
// names this path. It is also the section that decides whether the parting is a DIVORCE, which is why
// the divorce's copy is read here and not in the hub.
//
// ⚠ `seed:life:ends:<episodeId>:<week>` AND THE READ/REGISTER DRAWS LIVE HERE NOW, and they stay in
// T3.9's inventory (`tests/life-beat-keys.test.ts`, set equality) because the file is FLAT in
// `world/lifeBeat/`, which is what `engineModuleSource` reads.
//
// `WorldState` comes from `../state`, the module that declares it (CLAUDE.md's P4 rule).
import { rngFromSeed } from '../../rng'
import { ECONOMY } from '../../economy'
import { expressedTemperamentOf } from '../../spirit'
import { addEvent } from '../ledger'
import { activeEpisode, endEpisode } from '../loveEpisodes'
import { captureMilestone, fireMilestone } from '../milestones'
import { divorcedKeptRow } from './divorcedCopy'
import { endedKeptRow, hasBeatFor, listenHeardNow, raiseLifeBeat, voiceOf } from '../lifeBeat'
import type { HeardRead } from '../lifeBeat'
import type { Temperament } from '../../spirit'
import type { WorldState } from '../state'

// =================================================================================================
// 8. THE END – ⚠⚠ THE WEEK IT IS OVER (the private life, wave 4: T2)
// =================================================================================================
//
// `docs/plans/life-wave-4-builder-2026-09.md` §2 T2, constants in `ECONOMY.life` (who-she-is §4's
// `end` column). §5 above decides whether someone appears; this decides whether they are still there,
// and it is the step that makes the attachment an ARC instead of a state a career enters once.
//
// ⚠ IT IS §8 AND NOT §5b, AND THE POSITION IS A COMPROMISE RATHER THAN A READING. It belongs beside
// the arrival by subject – they are one hazard asked twice – and it is appended at the end because
// renumbering four sections would rewrite every «§6» and «§7» reference in this file and in the six
// test files that quote them, for no gain a reader could feel. The ORDER THAT MATTERS is the call
// site's, and that one is not a matter of taste: see `world/phaseHerWeek.ts`.
//
// ⚠⚠ THE FIFTH STREAM, AND IT IS THE ONE §5 AND §7 HAVE BEEN RESERVING SINCE WAVE 3:
//
//     seed:life:ends:<week>                does it end, this week
//
// (seed, calendar)-keyed like the other four, so a player cannot end a romance by playing the week
// differently – and keyed on the WEEK alone, never on the episode, so the hazard is a property of the
// calendar rather than of the row it happens to be reading. ⚠ RE-AIMED BY T4: this said
// `seed:life:ends:<week>:react` «does not exist on this tree», and it does now – §3e's `drawEndsRead`
// derives it on the ENDING's week, which is what makes the two genuine siblings (wave-4 brief §3,
// ruling G.1: «a pair keyed on two different weeks is two facts sharing a name»). Those two are the
// wave's whole table and no third may be invented. ⚠ THIS FUNCTION DERIVES ONLY THE FIRST OF THEM –
// the read is worded from, never rolled here, and §B's count-keys net says so.
//
// ⚠⚠ ZERO DRAWS ON MAIN AND ZERO DRAWS ON AN INELIGIBLE WEEK. The first is structural – nothing here
// takes an `Rng`, so the frozen capture (41550 / e6b0c709) cannot see this file, and T2 could not move
// it if it tried. The second is §5's load-bearing rule inherited whole: `endsEligible` decides
// everything and `rollEnds` returns on it BEFORE the stream is derived. A career with nobody in it
// takes no draw at all; it never compares one against a hazard it was never going to clear.
//
// ⚠ AND THE TEST FOR THAT IS A KEY COUNT, NOT AN ALIGNMENT COMPARISON – wave 3's finding, now the
// wave-4 brief's §0.1 LAW for every zero-draw claim. Every key here carries its own week, so a
// discarded draw shifts no other week's value and «two worlds produce identical later verdicts» stays
// green under the very draw-and-discard mutation it would be written to catch.
// `tests/wave4-ends.test.ts` §B counts the keys the gate reached, in an array the code under test
// cannot see, with a positive control.
//
// ⚠⚠ NO FEED LAG FOR AN ENDING, v1 – A DESIGN NOTE AND NOT AN OVERSIGHT (the wave-4 brief says it in
// those words). An arrival is shy and a break-up is loud: the lag exists because a girl decides when
// to mention that somebody exists, and there is no matching decision here – the parent of a girl who
// has just been left finds out because she is in the house. The told-LATE scene the plan wants comes
// from endings that predate `knownWeek` – the romance he was never told about, already over by the
// time he hears of it – and never from lagging the ending itself. Adding a symmetrical
// `endKnownWeek` would produce a fourth date on the row and a scene nobody asked for.
//
// ⚠⚠ IT RAISES NOTHING AND WRITES NO ROW – not a beat, not a feed line, not a spirit point. ⭐ RE-AIMED
// BY T3 (12.09) AND NOT RELAXED: this line ended «not `spiritShock`. T3 is the shock…», and T3 is
// here. The MARK is now written by `rollEnds` – one `{week, kind}` fact on the world – while the
// POINTS it is worth stay `accrueSpirit`'s, four calls later in the same tick, which keeps that
// function the only writer of `world.spirit` in the engine. T4 is still the `'ended'` beat and its
// told-late branch, T5 still the feed row and the `lifeKind` stamp. The commit order IS the design:
// ship each half alone and let the derived readings fall out of it, so that anything which moves in
// the frozen careers moved for exactly one nameable reason.
// ⭐⭐ RE-AIMED AGAIN BY T4 (12.09), AND THE PARAGRAPH ABOVE IS KEPT WHOLE so both re-aims read as one
// history. WHAT MOVED: `rollEnds` now raises the TOLD-NOW `'ended'` card, and only when the `'met'`
// receipt already exists (ruling B's split of responsibility). WHAT DID NOT: `world.spirit`, `events`
// and the `lifeKind` stamp are still not this function's to touch – the POINTS are `accrueSpirit`'s,
// the ending's own kept feed row and the per-kind glyph are T5's, and any of those appearing here is
// still the defect this note exists to make visible.
// ⭐⭐ RE-AIMED A THIRD TIME BY T5 (12.09), AND THE TWO PARAGRAPHS ABOVE ARE KEPT WHOLE. WHAT MOVED:
// `events` – the told-now ending's kept row and its `lifeKind: 'ended'` stamp are written here now,
// behind the very same `'met'` receipt as the card, so the album and the queue can never disagree
// about which scene this week was. WHAT DID NOT: `world.spirit`, which is the one item this note has
// been guarding since T2 and is the only one left on the list. ⚠ AND THE TOLD-LATE HALF IS NOT HERE AND CANNOT
// BE: it fires on a week this function has no way to see (`knownWeek`, which may be seasons off), so
// §6 owns it – see `deliverKnownPartner`.

/** ⭐⭐ THE GATE – ONE CLAUSE, AND A FALSE HERE MEANS **ZERO DRAWS**, not a discarded one.
 *
 *  ⚠⚠ A PREDICATE OF ITS OWN FOR `arrivalEligible`'s AND `smallTalkEligible`'s STATED REASON, and the
 *  reason survives the clause count going down to one: a reader has to be able to see, in one place,
 *  that the whole of eligibility is decided before any stream exists. Pure, zero draws, no writes.
 *
 *  ⚠ THE WHOLE OF IT IS «IS SOMEBODY THERE», and it is `activeEpisode`'s answer rather than a second
 *  spelling of it. Two things follow that are worth naming because both are easy to add by accident:
 *
 *  1. ⚠⚠ IT COUNTS FROM `sinceWeek`, NEVER FROM `knownWeek`. `activeEpisode` reads `endedWeek` and
 *     nothing else, so a romance the parent has not been told about is exactly as endable as one he
 *     has – which is the premise of wave 4's told-late scene and would be destroyed by an innocent
 *     `knownPartner` here. There is no bar above this line and there must never be one.
 *  2. AND THERE IS NO AGE GATE. `arrivalEligible` has one because sixteen is when somebody may first
 *     APPEAR; by the time a row exists she has already passed it, so a second reading of the same
 *     ruling here would be dead code that looked like a rule. */
export function endsEligible(world: WorldState): boolean {
  return activeEpisode(world) !== null
}

/** THE WEEKLY END HAZARD, as one probability (who-she-is §4: base 1.2%/wk times the temperament's
 *  `end` multiplier). Takes the TEMPERAMENT rather than the world – `arrivalHazardFor`'s own
 *  primitives doctrine – so the corridor tests and T7's census can sweep the table directly instead
 *  of posing a world per cell.
 *
 *  ⚠⚠ IT READS `endsMult` AND NOT `temperamentMult`, WHICH IS RULING E AND IS THE ONE LINE IN THIS
 *  SECTION MOST LIKELY TO BE «SIMPLIFIED» BY A LATER READER. They are two columns of one table in the
 *  spec and they are different numbers: arrival is sunny 1.2 · fiery 1.6 · quiet 0.6 · deep 0.5, and
 *  this is sunny 0.6 · fiery 1.5 · quiet 0.35 · deep 0.9. Sharing the record would have shifted every
 *  break-up rate in the game by a factor nobody would have noticed, because both values look right.
 *
 *  ⚠ NO AGE TERM, unlike the arrival's – §4's end column is one rate for the whole life. See the
 *  constant's own note in `economy.ts` for why a second row is not this file's to invent. */
export function endsHazardFor(temperament: Temperament): number {
  return ECONOMY.life.endsPerWeek * ECONOMY.life.endsMult[temperament]
}

/** ⭐⭐⭐ THE WEEKLY ROLL, and the ONE caller of `endEpisode`.
 *
 *  ⚠⚠ THE GATE RUNS FIRST AND RETURNS BEFORE ANY STREAM IS DERIVED. An ineligible week takes ZERO
 *  draws – never draw-and-discard – which is the wave's load-bearing rule, inherited from §5 word for
 *  word. The line order below IS the rule; moving the roll above the gate would break it silently,
 *  because every key here carries its own week and a discarded draw changes no other week's value.
 *  That is why the net for it counts keys instead of comparing worlds (§0.1 of the wave-4 brief).
 *
 *  ⚠⚠ IT RUNS BEFORE `rollArrival` IN THE TICK, AND TWO RULINGS REST ON THAT ORDER (the wave-4
 *  rulings, F and A). The row this week's arrival is about to append DOES NOT EXIST YET when this
 *  line runs, so an attachment can never end in its own arrival week: `endedWeek >= sinceWeek + 1` by
 *  construction and the shortest romance the engine can produce is exactly one week. And because
 *  `endEpisode` writes the date before `arrivalEligible` is next asked, the cooldown refuses
 *  same-tick re-arrival by construction too – the slot is free and the clock is already running, so
 *  nobody arrives on the afternoon of a break-up. Both are pinned in tests/wave4-ends.test.ts §E;
 *  the ORDER itself is pinned in tests/spirit.test.ts.
 *
 *  ⚠ `<` AND NOT `<=`, `rollArrival`'s own note: `rngFromSeed` can return exactly 0, and a hazard of
 *  0 must be impossible rather than merely unlikely. No row in `endsMult` is zero today – so unlike
 *  §7's gate this comparison is not standing in for a short-circuit – but a temperament priced at
 *  «she never leaves» is the kind of row a later spec adds, and it would have to mean never.
 *
 *  ⚠⚠ IT TAKES NO `Rng`, AND SINCE T3 IT WRITES THE DATE **AND THE MARK** – RE-AIMED, NOT RELAXED.
 *  This note read «writes NOTHING BUT THE DATE. The shock is T3's, the beat is T4's, the feed row is
 *  T5's», and T3 is the step it was written to be re-read on. WHAT MOVED: the `world.spiritShock`
 *  line below. WHAT DID NOT: `world.spirit` itself, `lifeLog` and `events` are still not this
 *  function's to touch – the POINTS are `accrueSpirit`'s (which runs later in the same tick and stays
 *  the one writer of `world.spirit`), the `'ended'` beat is T4's and the feed row is T5's, and any of
 *  those three appearing here is still the defect this note exists to make visible.
 *  ⭐⭐ ...AND T4 IS NOW HERE TOO, SO THE LIST SHORTENS BY ONE AND THE HISTORY IS KEPT. WHAT MOVED: the
 *  `raiseLifeBeat(world, 'ended', …)` on the last line, guarded by the `'met'` receipt (ruling B).
 *  WHAT STILL DID NOT: `world.spirit` and `events`. A feed row or a spirit point appearing in this
 *  function is the defect the note is still watching for; the ending's own kept row is T5's.
 *  ⭐⭐ ...AND T5 IS THE LAST OF THEM, SO THE LIST IS DOWN TO ONE AND THE WHOLE HISTORY STAYS READABLE.
 *  WHAT MOVED: `events` – the kept told-now row, stamped `lifeKind: 'ended'`, behind the same receipt
 *  as the card. WHAT STILL DID NOT AND NEVER WILL: `world.spirit`. `accrueSpirit` is the one writer
 *  of it in the engine and that is the property these three re-aims have been protecting all along.
 *
 *  ⚠⚠ THE MARK IS SET HERE AND THE ARITHMETIC IS DONE THERE, WHICH IS THE WHOLE SPLIT (ruling C, and
 *  the T3 brief's «who sets it, who applies it»). This function knows the WEEK an attachment ended;
 *  `accrueSpirit` owns the weekly sum and the intensity scale. So the ending stamps a fact –
 *  `{week, kind}` – and the spirit pass four calls later reads that fact, applies −22/−34 on the
 *  week it matches, and clears the stamp again once she is back within `shockClearWithin` of her own
 *  baseline. No second writer of `world.spirit`, and no spirit arithmetic in the private life's
 *  hazards.
 *
 *  ⚠ IT IS SET ON THE SAME LINE-RUN AS THE DATE AND NEVER CONDITIONALLY, so «an attachment ended this
 *  week» and «a shock is live» cannot disagree. `endEpisode` is a no-op when there is nothing to end,
 *  but it cannot be reached in that state from here – the gate above has already found the row. */
export function rollEnds(world: WorldState): void {
  if (!endsEligible(world)) return
  // ⭐ v75 T4 – THE ROW IS TAKEN **BEFORE** IT IS DATED, because after `endEpisode` runs
  // `activeEpisode` is null by construction and there would be no id left to raise the beat about.
  // ⭐ RE-AIMED BY v83 (the wedding, wave 7 – T4), NOT WEAKENED: the fetch moved ABOVE the draw,
  // because the row now prices its own hazard – the latch below reads it – and the reason it was
  // taken early at all (dated rows have no id left) holds one line further up unchanged.
  const over = activeEpisode(world)!
  // ⚠⚠ EXPRESSION, NOT BIRTH – v76's T7, THE ARCHITECT'S RULING A. The hazard is EVALUATED NOW and
  // nothing about it is stored: what `endEpisode` writes is a DATE. So the multiplier is the one
  // belonging to the girl she is this week. ⚠ AND IT IS THE INTENSITY AXIS THAT OWNS THIS ONE
  // (who-she-is §1: «INTENSITY owns how hard things land and how long feelings hold – … an
  // attachment's end-hazard»), which is why a `reg` flip is the axis that moves it.
  //
  // ⭐⭐⭐ v83 (the wedding, wave 7 – T4) – AND THE LATCH IS THE ONE SEAM THAT SCALES IT. A latched
  // episode's ending hazard is wave-4's whole product × `ECONOMY.wedding.latchEndFactor` (drafted
  // 0.15, measured in T8): marriage steadies the slot, which is its whole mechanical meaning at W1.
  // ⚠ THE FACTOR LIVES HERE AND NOT IN `endsHazardFor`, DELIBERATELY – that function takes the
  // TEMPERAMENT alone so the corridor tests and the census sweep the table directly (its own
  // primitives doctrine), and the latch is a fact about the ROW, not about the girl. One seam, at
  // the one caller, exactly where the brief pointed. ⚠ NOT ZERO AND NOT A GATE: a latched episode
  // ending through this same hazard stays possible and rare – the divorce door the schema pre-paid
  // – and everything downstream of the draw (the shock, the card, the kept row) is wave-4's
  // machinery UNTOUCHED, no new shock kind anywhere in the wave. ⚠ ZERO RNG CHANGE: same one
  // uniform, same key, same draw count on every week – only the THRESHOLD moves, so no stream
  // shifts and input-independence cannot be touched.
  const hazard =
    endsHazardFor(expressedTemperamentOf(world)) *
    (over.latchedWeek !== null ? ECONOMY.wedding.latchEndFactor : 1)
  // ⭐ ONE UNIFORM, ONE WEEK, ITS OWN KEY – and the key carries no temperament, so the four girls read
  // the SAME uniform against four different hazards. That is what makes the multiplier a pure scale
  // rather than four unrelated dice, and it is the property the nesting pin holds them to.
  if (rngFromSeed(`${world.seed}:life:ends:${world.week}`)() >= hazard) return
  // ⭐⭐⭐ v88 (the parting, wave 12 – T2) – **THE WHOLE OF THE WAVE'S ENGINE, AND IT IS A PURE READ.**
  // Was this a marriage? Everything below splits on this one boolean and nothing else: the shock's
  // kind, the card's kind, the kept row's sentence and its stamp. ⚠ NOT A SECOND DRAW, NOT A SECOND
  // GATE AND NOT A SECOND HAZARD – the ending's rate already knows about the latch (it is the
  // `latchEndFactor` in the hazard eight lines up), so by the time this line runs the dice have
  // finished and the only question left is what to CALL what they did.
  //
  // ⚠⚠ IT IS TAKEN BEFORE `endEpisode` FOR READABILITY AND NOT FOR SAFETY, which is worth saying so
  // nobody "tidies" it back down. `endEpisode` writes `endedWeek` and never touches `latchedWeek`,
  // and `over` is a reference to the row rather than a copy, so the read would be correct anywhere
  // below. It sits here because the four uses underneath should all be reading ONE named fact – the
  // two-readings defect rule 3 exists to prevent, at the smallest scale it can occur.
  const married = over.latchedWeek !== null
  endEpisode(world, world.week)
  // ⭐⭐⭐ v75 T3 – AND THE MARK IT LEAVES ON HER. A fact, never a number: what it costs is
  // `ECONOMY.spirit.shock.breakup` and `accrueSpirit` is the one place that reads it (see the note
  // above). The kind is the union's only member today; steps 7–8 add the others.
  // ⭐⭐⭐ v88 (wave 12 – T2) – AND STEPS 7–8 CAME AND WENT, so this line finally has the choice the
  // union was widened for. `'divorce'` costs −27/−42 against the break-up's −22/−34
  // (`ECONOMY.spirit.shock`, both DRAFT): deeper, because a marriage is more of a life. ⚠ THE SPLIT
  // IS THE WHOLE OF WHAT THIS LINE DOES – the ARITHMETIC is still `accrueSpirit`'s four calls later,
  // and this function still stamps a fact and never a number. The note over this function has been
  // watching for a `world.spirit` write since T3 and still is.
  world.spiritShock = { week: world.week, kind: married ? 'divorce' : 'breakup' }
  // ⭐⭐⭐ v75 T4, RULING B – AND THE TOLD-NOW CARD, **ONLY IF HE ALREADY KNEW THERE WAS SOMEBODY**.
  //
  // ⚠⚠ THE RECEIPT IS THE WHOLE CONDITION AND IT IS RULING A's DISCRIMINATOR, NOT `knownWeek`. A
  // `knownWeek <= week` test here would fire on the tick where `endedWeek === knownWeek` – and §6,
  // four calls later in this same tick, would then deliver the SAME episode and raise `'met'`: two
  // contradictory beats about one girl in one week, which the brief forbids in as many words. Asking
  // the receipt instead makes that case fall through to §6, which sees an ended row and raises ONE
  // told-late card. ⚠ IT IS REACHABLE, NOT A CORNER: ruling F gives `endedWeek >= sinceWeek + 1`, so
  // the collision needs only a lag of one or more and the hazard landing on that week.
  //
  // ⚠ AND THE OTHER SIDE OF THE FALL-THROUGH IS THE TOLD-LATE SCENE ITSELF: an episode that ends
  // while the lag is still running raises nothing here, waits out its `knownWeek`, and surfaces as
  // one honest late row. The romance the parent was never told about is not lost – it is deferred to
  // the week he hears of it, which is the whole reason `loveEpisodes` is a list.
  //
  // ⭐⭐ RE-AIMED BY T5 (12.09) AND THE OLD SENTENCE IS KEPT SO THE RE-AIM READS AS ONE HISTORY. It
  // said «NO FEED ROW ON THIS PATH (T5's, per the commit order) and NO SPIRIT POINT», and T5 is the
  // step it was written to be re-read on. WHAT MOVED: the kept `'life'` row below, stamped `'ended'`.
  // WHAT DID NOT: `world.spirit` – the POINTS are still `accrueSpirit`'s, four calls later in this
  // same tick, and a spirit delta appearing in this function is still the defect the note watches for.
  //
  // ⚠⚠ THE ROW AND THE CARD SHARE ONE CONDITION AND MUST GO ON SHARING IT. Behind the receipt they
  // both fire; without it BOTH wait, and §6 raises the told-late pair on `knownWeek` instead. A row
  // written here unconditionally would tell a parent about a romance he has never heard of, in the
  // week it ends – which is precisely the news `deliverKnownPartner` exists to deliver honestly, one
  // sentence later in her story rather than two.
  //
  // ⚠ THE ORDER IS THE READING, as it is in §6: the feed row is what HAPPENED and the card is what he
  // is being asked about it, so the news is on the record before the card can be answered.
  if (!hasBeatFor(world, over.id, ['met'])) return
  // ⭐⭐⭐ v76 T6 – THE THIRD AND LAST RAISE SITE OF A READ-BEARING BEAT, and it reads the coin exactly
  // as §6's two do: one uniform on `seed:psy:listen:ended:<week>`, spent on the kept row's text below
  // and on the card's stamp underneath it. ⚠ IT IS DRAWN **AFTER** THE RECEIPT GATE, so an ending
  // that raises nothing here derives nothing either – the told-late path in §6 owns that episode and
  // draws its own coin on the week the parent actually hears of it.
  // ⭐⭐⭐ v88 (wave 12 – T2) – AND THE MARRIAGE'S ENDING TAKES THE OTHER ROAD, WHICH IS SHORTER BY
  // EVERYTHING BELOW. One kept row, one raise, no coin and no frame. ⚠ IT RETURNS RATHER THAN
  // BRANCHING THE REST, because the two paths share nothing after this point: the ending's row and
  // card are assembled from a coin, a voice, a `wants` and a register, and the divorce's are
  // assembled from neither.
  //
  // ⚠⚠ THE LISTEN COIN IS **NOT DERIVED ON THIS PATH**, AND THAT IS A REAL CONSEQUENCE RATHER THAN
  // AN OMISSION – said plainly here because it is the one thing this wave takes away. On a week the
  // family is paying a psychologist whose year is `'listen'`, a break-up's heading can be the
  // LEGIBLE one (`ENDED_HEADING_HEARD`, 16 cells). A divorce's cannot: `DIVORCED_HEADING` has two
  // cells and no legible arm, so the focus goes quiet on this one card. Building one would mean
  // drafting eight more cells of the parent's own reading, which is a surface this wave was not
  // asked for and copy that is not an agent's to invent (invariant 4). ⚠ IT COSTS NO STREAM EITHER
  // WAY: `listenHeardNow` returns `null` without drawing unless a listen rung is actually working,
  // and sub-streams are re-derived at the call site and persist nothing, so skipping the call moves
  // no other key's value. Carried to the wave's report as a question for the owner.
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
      lifeKind: 'divorced',
    })
    // ⭐⭐⭐ v88 (the parting, wave 12 – T3) – AND THE ALBUM KEEPS A LINE, on his «можно» of 23.09.
    // `landWedding`'s two-surface idiom exactly: `fireMilestone` keeps the line past every prune and
    // `captureMilestone` gives the scroll its row, both idempotent per `divorce:<episodeId>` – so a
    // SECOND marriage's divorce on a later row captures its own line, which is the 11.09 re-shape
    // inherited from the wedding this closes.
    //
    // ⚠⚠ THIS IS THE ONE WEEK IN THE GAME THAT WRITES BOTH A `'life'` ROW AND A `'milestone'` ROW,
    // and it is the spec asking for both rather than a duplicate. The two channels answer different
    // questions – `landBirth`'s own note draws the line: `'life'` is NEWS about her life, `'milestone'`
    // is what the family KEEPS – and an ending has always had the first while a wedding has always
    // had the second. A marriage ending is both at once, which is exactly why it needed a wave. ⚠ SO
    // THE TWO SENTENCES ARE WRITTEN NOT TO STUTTER: the kept row says what this week did, and the
    // album line says what the career will read back later. Flagged in the wave's report, because
    // «two rows on one week» is a thing the owner sees on a screen and may not want.
    //
    // ⚠ THE ALBUM LINE SETTLES NOTHING – §5's law and the bereavement precedent: no fault, no
    // duration, no name, no money. It records that the marriage ended and that the family was
    // somewhere when it did.
    // ⚠ HIS REVIEW APPLIED 23.09: «the phone still rang» asserted a delivery channel the quiet
    // voice contradicts (her news arrives in messages), so the line now says only what every
    // divorce shares – the family had no part in the decision, and a part in what came after.
    fireMilestone(world, `divorce:${over.id}`, 'The marriage ended. We had no say in it, only in what we said next.')
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
    // keeps `accrueFinance` from ever seeing this row.
    // ⚠⚠ NO READ ON THIS ROW IN EITHER ARM – RULING O, and T6b took the legible half back out. The
    // sentence below is the one that shipped, byte for byte, on a coached week and an uncoached one
    // alike; the read the parent bought reaches the TOLD-NOW ending through the card's heading, which
    // `lifeBeatPromptFor` raises on this same tick. `endedKeptRow` is where that is decided and
    // pinned, so `frameNow` is handed over here exactly as §6's two raise sites hand theirs over –
    // one function answers «which sentence does the album keep», and a re-cut has one place to touch.
    // ⚠⚠ SO `seed:life:ends:<week>:react` IS NOT DERIVED HERE ON EITHER ARM, which is the stream
    // discipline the ruling bought back: the told-now path never reached that key before this wave,
    // and deriving it «for the legible arm» would have put a new key into every ending of every
    // career, the frozen corpus included. The `'space'` handed over is the base table and is never
    // read – `beatEndsRead`'s own fallback idiom one section up.
    text: endedKeptRow('told-now', 'space', frameNow),
    // ⭐ THE KIND, STAMPED – the same `'ended'` the told-late row carries, because it is the same
    // piece of news in the other register (see that row's note).
    lifeKind: 'ended',
  })
  raiseLifeBeat(world, 'ended', over.id, heardNow ?? undefined)
}


// A-06 / T6.10 – `world/lifeBeat.ts` §14 MOVED HERE VERBATIM, span for span, comments and all.
//
// ⚠ pregnancy: THE HAZARD DIRECTION, as `world/lifeBeat/bereavement.ts`'s header sets it out: this module imports the hub – `kidAgeNow`…
// ⚠⚠ pregnancy: AND `tests/import-cycles.test.ts` IS NOT THE WITNESS TO THAT DIRECTION TODAY.
// ⚠⚠ pregnancy: SEVEN SUB-STREAMS LIVE HERE AND THREE OF THEM ARE THE ONES T3.9 EXISTS FOR.
// ⚠ pregnancy: `'expecting'`'s COPY is a separate module, `world/lifeBeat/pregnancyCopy.ts` (T6.8)…
// → docs/notes/life-beats/pregnancy.md#pregnancyts-header
import { pickInt, rngFromSeed } from '../../rng'
import { ECONOMY } from '../../economy'
import { temperamentFor, temperamentOpenness } from '../../spirit'
import { addEvent } from '../ledger'
import { knockRunning } from '../constants'
import { kidPoints, rankIn } from '../ladder'
import { captureMilestone, fireMilestone } from '../milestones'
// ⭐ ROUND 46 #22 – the dev life-event boost (a leaf).
import { boostedChance } from '../lifeBoost'
import { kidAgeNow, latchedEpisode, raiseLifeBeat } from '../lifeBeat'
import { PREGNANT_LAST_WEEKS } from '../../../shared/avatarEmotion'
import type { MotherhoodBand } from '../../../shared/protocol/narrative'
import type { ComebackState, PregnancyState, WorldState } from '../state'

// 14. THE PREGNANCY – ⚠⚠ THE WEEK SHE SAYS SHE IS HAVING A CHILD (the pregnancy, wave 8: T2) –
// `docs/plans/life-wave-8-builder-2026-09.md` §2 T2, constants in `ECONOMY.motherhood`, the
// research `docs/research/life-events-motherhood.md`. §11 decides whether the episode becomes
// a MARRIAGE; this decides whether the marriage becomes a FAMILY, and it is the step the
// design plan's 3d was gated on.
//
// ⚠ pregnancy: It is §14 for §8's own stated reason: appended rather than renumbered.
// ⚠⚠ pregnancy: THE WAVE'S FIRST STREAM, RESERVED BY THE BRIEF'S §0 AND CREATED HERE
// ⚠⚠ pregnancy: ZERO DRAWS ON AN INELIGIBLE WEEK **AND ON A WEEK WHOSE SHAPED HAZARD IS 0**
// ⚠ pregnancy: SHE DECIDES; THE HAZARD IS THE DECIDING (§4a, at the layer's biggest moment).
// owner (pregnancy): «развелись и развелись, жизнь продолжается, да, будут эмоциональные последствия, но в целом»…
// ⚠ pregnancy: NOTHING IS ADDED FOR THE MID-TERM ENDING AND NOTHING IS SUPPRESSED.
// ⚠ pregnancy: THE GATE IS THE ONE PLACE ALIVENESS IS READ, AND IT IS READ ABOUT THE FUTURE RATHER THAN THE PAST
// → docs/notes/life-beats/pregnancy.md#pregnancyts-14--the-pregnancy

/** ⭐⭐ THE SHAPED HAZARD – her weekly chance on an ELIGIBLE week, or 0. Pure, zero draws, no
 *  writes.
 *
 *  ⚠⚠ pregnancyChanceAt: THE RATE IS **DERIVED FROM HIS OWN DIGEST** AND THE DERIVATION IS AT THE CONSTANT, NOT HERE
 *  owner (pregnancyChanceAt), 20.09: «а на чем основана цифра?»
 *  ⚠ pregnancyChanceAt: THE LAST RUNG WHOSE `fromAge` SHE HAS REACHED WINS, and an age under the first rung takes 0.
 *  ⚠⚠ pregnancyChanceAt: AGE IS **NOT** IN THE GATE AND THIS IS WHERE IT LIVES INSTEAD
 *  → docs/notes/life-beats/pregnancy.md#pregnancychanceat--the-shaped-hazard--her-weekly-chance-on-an-eligible-week
 */
export function pregnancyChanceAt(world: WorldState): number {
  const age = kidAgeNow(world)
  const m = ECONOMY.motherhood
  // ⭐⭐⭐ W5/T3 – WHICH CURVE, and it is the count of children that decides. A career with none on
  // the board reads `perWeekByAge` and is byte-identical to everything wave 8 measured; a career
  // that already has one reads `repeatPerWeekByAge`, which is his digest's own later window and
  // lower rate. ⚠ TWO CURVES AND ONE READING – the rung loop below is shared, so the two can differ
  // in what they say and never in how they are consumed.
  const born = world.children.length
  const rungs = born === 0 ? m.perWeekByAge : m.repeatPerWeekByAge
  let perWeek = 0
  for (const rung of rungs) if (age >= rung.fromAge) perWeek = rung.perWeek
  if (perWeek <= 0 || born <= 1) return perWeek
  // ⭐⭐ AND EVERY CHILD AFTER THE FIRST THINS IT – the design's «a third stays rare rather than
  // routine», as one factor rather than a third curve. `born - 1` so the SECOND child is the plain
  // repeat rate and the third is the first one thinned.
  return perWeek * Math.pow(m.repeatCountFactor, born - 1)
}

/** ⭐⭐ THE GATE – ALL FOUR, AND A FALSE HERE MEANS **ZERO DRAWS**, not a discarded one. A
 *  predicate of its own for `weddingEligible`'s and `arrivalEligible`'s stated reason: a reader
 *  must see, in one place, that the whole of eligibility is decided before any stream exists.
 *  Pure, zero draws, no writes.
 *
 *  ⚠ pregnancyEligible: THREE AT T2 AND FOUR SINCE T2½ PIECE 3
 *  ⚠ pregnancyEligible: The age floor rides in free: a wedding needs 23+ (wave 7, RULED 11.09) plus a 52-week-deep episode…
 *  ⚠ pregnancyEligible: ON THE T2 TREE NOTHING EVER CLEARED IT, so this clause was ALSO the once-per-career receipt…
 *  ⚠⚠ pregnancyEligible: THAT CONCLUSION WAS WRONG AND IS CORRECTED BELOW
 *  ⚠⚠ pregnancyEligible: ⭐⭐⭐ **LIFTED BY W5/T3 (21.09), AS THIS BULLET ITSELF PREDICTED.** What replaces it is the COOLDOWN below plus…
 *  ⚠⚠ pregnancyEligible: THIS IS A **SCOPE BRAKE** AND NOT A CLAIM ABOUT HER LIFE.
 *  owner (pregnancyEligible): «после беременности может быть и повторная»
 *  ⚠ pregnancyEligible: WITHOUT IT §4 IS FALSE THE MOMENT THE RECORD IS CLEARED
 *  ⚠ pregnancyEligible: IT NEEDS NO NEW FIELD: `children` already exists and T4 is its writer…
 *  ⚠ pregnancyEligible: NO KNOCK RUNNING – `knockRunning`
 *  ⚠ pregnancyEligible: AND NOTHING ABOUT HER RANK, HER FORM OR HER MONEY IS IN HERE
 *  → docs/notes/life-beats/pregnancy.md#pregnancyeligible--the-gate--all-four-and-a-false-here-means-zero
 */
export function pregnancyEligible(world: WorldState): boolean {
  if (latchedEpisode(world) === null) return false
  if (world.pregnancy !== null) return false
  // ⭐⭐⭐ W5/T3 – AND CLAUSE 3 IS LIFTED, exactly as T2½'s own note said it would be: the SCOPE
  // BRAKE («this WAVE ships at most one pregnancy per career») is replaced by the count-aware
  // hazard the design asked for, which lives in `pregnancyChanceAt` above.
  //
  // ⚠ pregnancyEligible: AND WHAT THE COOLDOWN PROTECTS IS THE COMEBACK, not decency.
  // ⚠ pregnancyEligible: DRAFTED AT A YEAR and benched in T7; the alternative shape (refuse only while the freeze still has entries left)…
  // → docs/notes/life-beats/pregnancy.md#pregnancyeligible--w5t3--clause-3-is-lifted
  const lastBirth = world.children.reduce((w, child) => Math.max(w, child.bornWeek), -Infinity)
  if (world.children.length > 0 && world.week - lastBirth < ECONOMY.motherhood.repeatCooldownWeeks) {
    return false
  }
  // ⭐⭐⭐ v87 T4 – AND A LOSS RE-ARMS THE HAZARD BEHIND A GENTLER COOLDOWN, through this same
  // machinery rather than through a clause of its own (the spec's §3: «reading the same
  // eligibility machinery wave 9 built»).
  //
  // ⚠⚠ pregnancyEligible: IT READS `pregnancyLossWeeks` AND NEVER A DERIVED GUESS
  // → docs/notes/life-beats/pregnancy.md#pregnancyeligible--v87-t4--a-loss-re-arms-the-hazard-behind-a-gentler-cooldown
  const lastLoss = world.pregnancyLossWeeks.reduce((w, at) => Math.max(w, at), -Infinity)
  if (world.pregnancyLossWeeks.length > 0 && world.week - lastLoss < ECONOMY.weight.lossCooldownWeeks) {
    return false
  }
  if (knockRunning(world)) return false
  return true
}

/** ⭐⭐⭐ v87 (the weight, wave 11 T2) – **HOW LONG SHE CARRIES IT BEFORE SHE SAYS SO**, in weeks,
 *  on `seed:life:window:<conceivedWeek>`. The hidden window of the design's §3, and the
 *  cheapest thing in the whole wave: one persisted number and one draw.
 *
 *  ⚠⚠ drawConceptionWindow: **THE WINDOW IS NOT THE WEIGHT AND IT IS NOT GATED BY THE SWITCH**…
 *  ⚠ drawConceptionWindow: IT READS `ECONOMY.life.lag`'s SHAPE AND NOT `drawRawLag`'s STREAM
 *  ⚠ drawConceptionWindow: NO BOND SHAVE.
 *  ⚠ drawConceptionWindow: KEYED ON THE CONCEPTION WEEK, so it is (seed, calendar)-keyed like every sibling and a player cannot shorten…
 *  → docs/notes/life-beats/pregnancy.md#drawconceptionwindow--v87-t2--how-long-she-carries-it-before-she-says-so
 */
export function drawConceptionWindow(seed: string, conceivedWeek: number, openness: 'open' | 'private'): number {
  const table = ECONOMY.life.lag[openness]
  const r = rngFromSeed(`${seed}:life:window:${conceivedWeek}`)
  if (r() < table.zeroChance) return 0
  return pickInt(r, table.min, table.max)
}

/** ⭐⭐⭐ THE WEEKLY ROLL, the ONE place in the engine where `world.pregnancy` goes non-null.
 *
 *  ⚠⚠ rollPregnancy: THE LINE ORDER IS THE RULE, AND IT IS FOUR STEPS RATHER THAN §11's THREE.
 *  ⚠ rollPregnancy: `<` AND NOT `<=`, `rollArrival`'s own note: `rngFromSeed` can return exactly 0…
 *  ⚠ rollPregnancy: NO TEMPERAMENT TERM, `wedding.perWeek`'s…
 *  ⚠⚠ rollPregnancy: THE RECORD IS WRITTEN AT THE **CONCEPTION** AND NOT AT THE ANSWER, and the choice is deliberate.
 *  ⚠ rollPregnancy: `returnPlan` IS NOT ON THIS RECORD ANY MORE
 *  ⚠ rollPregnancy: `dueWeek` IS COMPUTED HERE AND PERSISTED
 *  ⚠ rollPregnancy: IT WRITES THE RECORD AND NOTHING ELSE
 *  ⚠⚠ rollPregnancy: TWO DRAWS ON TWO KEYS SINCE v87, AND THE SECOND ONE IS **NOT** GATED BY THE WEIGHT SWITCH.
 *  ⚠ rollPregnancy: The window draw happens ONLY on a week the hazard actually landed, so an ineligible week and a missed roll still take…
 *  → docs/notes/life-beats/pregnancy.md#rollpregnancy--the-weekly-roll--where-worldpregnancy-goes-non-null
 */
export function rollPregnancy(world: WorldState): void {
  if (!pregnancyEligible(world)) return
  const chance = pregnancyChanceAt(world)
  if (chance === 0) return
  // ⭐ ROUND 46 #22 – compares against `chance * 1` OFF (bit-identical) and `chance * 8` ON; `pregnancyChanceAt` itself is untouched, so its other readers still see the real figure.
  if (rngFromSeed(`${world.seed}:life:pregnancy:${world.week}`)() >= boostedChance(chance)) return
  // ⚠ THE ROW IS TAKEN AFTER THE DRAW AND IS THE GATE'S OWN – `pregnancyEligible` just proved it
  // non-null, and `rollEnds` runs before this at the call site, so the marriage the record points at
  // is the marriage still standing this week.
  const episode = latchedEpisode(world)!
  // ⭐⭐⭐ v87 T2 – THE HIDDEN WINDOW, DRAWN ON THE WEEK SHE CONCEIVES. Openness is the girl's own
  // register (`temperamentFor`), not the `wants` she drew for this attachment: `drawRawLag`'s own
  // reading of who-she-is §4, inherited rather than re-argued.
  const openness = temperamentOpenness(temperamentFor(world.seed, world.dynasty?.motherTemperament))
  const windowWeeks = drawConceptionWindow(world.seed, world.week, openness)
  const conceivedWeek = world.week
  const announcedWeek = conceivedWeek + windowWeeks
  // ⭐⭐ THE FIRST-TRIMESTER CAP (the review of T2 – the constant's own note carries the argument):
  // «up to 8 after she tells», and never past the trimester competition really stops at. For a short
  // window the min is the shipped arithmetic unchanged; for a long one she stops entering BEFORE the
  // announcement – the absence of entries is the telling, the design doc's own scene.
  const pausesWeek = Math.min(
    announcedWeek + ECONOMY.motherhood.playsOnWeeks,
    conceivedWeek + ECONOMY.motherhood.firstTrimesterWeeks,
  )
  world.pregnancy = {
    // ⭐⭐⭐ A REFERENCE AND NEVER A LIVENESS CHECK – THE DECOUPLING LAW, and the banner above is
    // where it is argued. This id says WHOSE and WHICH MARRIAGE, for the record, the diary and the
    // album; it does not say whether the pregnancy is still real. T4 and T5 read `world.pregnancy`.
    episodeId: episode.id,
    // ⭐⭐⭐ v87 T2 – THE WEEK THE HAZARD FIRED, which is the week she conceived and is no longer the
    // week she says so. Everything below is derived from it.
    conceivedWeek,
    announcedWeek,
    pausesWeek,
    // ⭐⭐⭐ v87 T2 – **THE ONE-NUMBER LAW** (§2): the birth rides the CONCEPTION clock, so the
    // announcement sits inside the term instead of ahead of it and a pregnancy is 39 weeks lived
    // whatever the window drew. `dueWeek = pausesWeek + termWeeks` was the wave-8 formula and it
    // assumed conception AT the announcement – kept as `termWeeks` and written out as half of
    // `termTotalWeeks`, so the arithmetic below reproduces every pre-window date exactly when the
    // window draws 0.
    dueWeek: conceivedWeek + ECONOMY.motherhood.termTotalWeeks,
    // ⚠ NULL IS A REAL STATE AND NOT A PLACEHOLDER: she has told him and he has not answered yet.
    // `answerLifeBeat` writes the grade, once, on the answer (T1's own note on the field).
    support: null,
    // ⚠⚠ NULL UNTIL THE PAUSE WEEK, AND IT IS **NOT** CAPTURED HERE (v85 T6). The ruled freeze is «her
    // rank at `pausesWeek`», which is eight weeks after this line – she plays on through them, so the
    // standing this week is not the standing the rule names. `landPregnancyPause` takes it on the week
    // it is true; the field's own note in `world/state.ts` carries why it is a capture at all.
    rankAtPause: null,
  }
}

/** ⭐⭐⭐ v87 (the weight, wave 11 T2) – **THE WEEK SHE SAYS IT**, which is no longer the week she
 *  conceived. The ONE raise site of an `'expecting'` row, moved here out of `rollPregnancy`
 *  when the window separated the two facts.
 *
 *  ⚠⚠ landPregnancyAnnouncement: NOTHING PRICES THE WEEKS BEFORE THIS ONE, AND THAT IS THE DESIGN'S OWN LAW RATHER THAN A CONSEQUENCE…
 *  ⚠ landPregnancyAnnouncement: IT RAISES WITH `pregnancy.episodeId` AND NEVER WITH `latchedEpisode` – THE DECOUPLING LAW (RULED 20.09)
 *  ⚠⚠ landPregnancyAnnouncement: `>=` PLUS A RECEIPT, NOT `===`, AND THE PAIR IS `landWedding`'s RATHER THAN `landPregnancyPause`'s.
 *  ⚠ landPregnancyAnnouncement: ZERO DRAWS: the window was drawn at conception and is persisted…
 *  → docs/notes/life-beats/pregnancy.md#landpregnancyannouncement--v87-t2--the-week-she-says-it
 */
export function landPregnancyAnnouncement(world: WorldState): void {
  const pregnancy = world.pregnancy
  if (pregnancy === null || world.week < pregnancy.announcedWeek) return
  if (world.lifeLog.some((row) => row.kind === 'expecting' && row.week >= pregnancy.conceivedWeek)) return
  // ⚠ THE DETAIL IS THE EPISODE ID, `'met'` / `'ended'` / `'engaged'`'s own shape – machine-readable,
  // never a rendered sentence. ⚠ AND IT IS NOT THE RECEIPT HERE, which is the one way this kind
  // parts from the wedding: `world.pregnancy` is what clause 2 of the gate reads, so the once-ness
  // lives on the record rather than in the log, and a career that reaches a SECOND pregnancy one day
  // (W5) gets a second row about the same marriage without any of this changing.
  raiseLifeBeat(world, 'expecting', pregnancy.episodeId)
}

/** ⭐⭐⭐ **HIS STRING, PASSED 21.09 IN SESSION** (wave 8b, C5) – the pause week's one feed row,
 *  and no longer a draft. Invariant 4 now binds the other way: nobody re-words it unasked.
 *
 *  ⚠ PAUSE_EVENT: IT MUST NOT SAY THE SEASON IS OVER, and that is the whole difficulty of writing…
 *  ⚠ PAUSE_EVENT: HUSBAND-AGNOSTIC (§0's decoupling ruling): it reads correctly for a career whose marriage ended the week before…
 *  ⚠ PAUSE_EVENT: AND IT NAMES NO RETURN.
 *  ⚠⚠ PAUSE_EVENT: THE FIRST DRAFT READ «entering nothing more», THE TAIL-LINT CAUGHT…
 *  ⚠ PAUSE_EVENT: THE EXEMPTION IS PER-ROW AND LIVES BESIDE THE BAN (`TAIL_EXEMPT_LINES`, `tests/helpers/bannedTails.ts`)
 *  → docs/notes/life-beats/pregnancy.md#pause_event--his-string-passed-2109-in-session-wave-8b-c5
 */
const PAUSE_EVENT = 'She is entering nothing more before the birth. What she is already in, she will play.'

/** ⭐⭐ THE WEEK THE ENTRIES CLOSE – the pause's ONLY tick step, and it writes ONE feed row.
 *
 *  ⚠⚠ landPregnancyPause: THE PAUSE ITSELF NEEDS NO TICK STEP AT ALL
 *  ⚠ landPregnancyPause: AND NOTHING ELSE IS ADDED TO THE WEEK.
 *  ⚠ landPregnancyPause: ONCE-NESS IS TWO CLAUSES, AND THE SECOND ONE IS A RECEIPT RATHER THAN A DATE.
 *  ⚠ landPregnancyPause: IT IS A STRUCTURAL LOOK-UP AND NOT A TEXT MATCH
 *  ⚠ landPregnancyPause: AND IT COSTS ONE SCAN ON ONE WEEK OF ONE CAREER
 *  ⚠ landPregnancyPause: The alternative was `fireMilestone`'s key-idempotency, and the row is deliberately NOT a milestone…
 *  ⚠ landPregnancyPause: `keep: true`, for the ended row's own reason one section up: `pruneEvents` drops ordinary rows at sixty weeks…
 *  ⚠⚠ landPregnancyPause: `lifeKind: 'expecting'` IS THE HOUSE LAW AND NOT A GLYPH PICK
 *  ⚠ landPregnancyPause: NO GLYPH IS PICKED FOR…
 *  ⚠ landPregnancyPause: ZERO DRAWS on any stream – two integers compared and one row appended.
 *  ⚠ landPregnancyPause: IT READS `world.pregnancy` AND NEVER THE EPISODE
 *  → docs/notes/life-beats/pregnancy.md#landpregnancypause--the-week-the-entries-close--the-pauses-only-tick
 */
export function landPregnancyPause(world: WorldState): void {
  const pregnancy = world.pregnancy
  if (pregnancy === null || world.week !== pregnancy.pausesWeek) return
  // ⭐⭐⭐ v85 T6 – AND THE ONE NUMBER THE FREEZE IS MADE OF, TAKEN ON THE ONE WEEK IT IS TRUE. The
  // ruled protected rank is «her rank at `pausesWeek`» and this line is the only place in the
  // engine that week is standing under a live pregnancy.
  //
  // ⚠ landPregnancyPause: ABOVE THE FEED ROW'S ONCE-NESS CHECK, DELIBERATELY
  // ⚠ landPregnancyPause: «UNRANKED IS NOT RANK ONE»
  // → docs/notes/life-beats/pregnancy.md#landpregnancypause--v85-t6--the-one-number-the-freeze-is-made-of
  pregnancy.rankAtPause ??= kidPoints(world, 'wta') > 0 ? rankIn(world, 'wta') : null
  if (world.events.some((e) => e.week === world.week && e.type === 'life' && e.lifeKind === 'expecting')) return
  // ⚠ NO AMOUNT – a life row is never a purchase (rule 4 at the top of this file), and the absence of
  // the field is what keeps `accrueFinance` from ever seeing it. There is no price on this week:
  // §2 T4's «NO COST EVENT» read one task early, and the pause charges nothing either.
  addEvent(world, { week: world.week, type: 'life', keep: true, lifeKind: 'expecting', text: PAUSE_EVENT })
}

/** ⚠⚠ **DRAFT – T8's TABLE, NOT SHIPPED COPY** (invariant 4). The birth week's one kept feed
 *  row, written to `landWedding`'s line and to its budget: one quiet sentence about the day,
 *  then one about what the family is now.
 *
 *  ⚠ BIRTH_EVENT: HUSBAND-AGNOSTIC (§0's decoupling ruling, and here it is load-bearing rather than polite)…
 *  ⚠ BIRTH_EVENT: IT MAY SAY «daughter» – the sex is RULED (20.09, «пол нужен … пока будут только девочки») and written as a literal…
 *  ⚠ BIRTH_EVENT: AND IT NAMES NO RETURN AND NO DATE, `PAUSE_EVENT`'s…
 *  ⚠ BIRTH_EVENT: NO FIGURE AND NO PRICE, because there is none – see `landBirth`'s ⚠⚠ NO COST EVENT.
 *  → docs/notes/life-beats/pregnancy.md#birth_event--draft--t8s-table-not-shipped-copy-invariant-4
 */
const BIRTH_EVENT = 'Her daughter was born this week. The family has somebody new in it.'

/** ⭐⭐⭐ THE BIRTH – the week the child arrives, and the ONE writer of `world.children` in the
 *  engine.
 *
 *  ⚠⚠ landBirth: IT IS **NEWS AND NOT A DECISION**, which is the brief's own sentence…
 *  ⚠⚠ landBirth: **NO COST EVENT.** Not a birth fee, not a ledger row, not a cent.
 *  owner (landBirth): «я думаю как с подарками, никто и нисколько»
 *  owner (landBirth): «развелись и развелись, жизнь продолжается»
 *  ⚠ landBirth: FIVE WRITES AND THE MIDDLE THREE ARE `landWedding`'s, LINE FOR LINE – and NOTHING on `world.pregnancy`, see the ⚠⚠ at the tail
 *  ⚠ landBirth: `>=` AND A RECEIPT, WHICH IS `landWedding`'s ARRANGEMENT AND NOT `landPregnancyPause`'s.
 *  ⚠⚠ landBirth: AND THE RECEIPT IS THE PUSH ITSELF, READ BACK
 *  ⚠ landBirth: `bornWeek >= dueWeek` IS EXACT AND IS **W5-SAFE**
 *  owner (landBirth), 20.09: «пол нужен, но мальчиков у нас пока нет, можно сделать заготовку, но пока будут только девочки»
 *  ⚠ landBirth: THE FEED ROW IS A `'milestone'` AND NOT A `'life'` ROW
 *  ⚠ landBirth: ZERO DRAWS ON ANY STREAM
 *  ⚠⚠ landBirth: AND WHAT IT DOES **NOT** DO TO `world.pregnancy` IS A DECISION WITH A REASON, not an omission.
 *  ⚠ landBirth: T4 WROTE «and T6 reads `returnPlan` INTO it», T5 FALSIFIED THAT HALF AND T6 SETTLED…
 *  ⚠ landBirth: The architect's RULING A (20.09) moved the field to `world.comeback`, the seat that outlives the pregnancy…
 *  ⚠ landBirth: THE BOUND IS `resolveReturnDecision` (`world/endings.ts`, T5)
 *  ⚠ landBirth: THE ONE COST OF THAT, REPORTED RATHER THAN PAPERED OVER
 *  → docs/notes/life-beats/pregnancy.md#landbirth--the-birth--the-week-the-child-arrives
 */
export function landBirth(world: WorldState): void {
  const pregnancy = world.pregnancy
  if (pregnancy === null || world.week < pregnancy.dueWeek) return
  if (world.children.some((child) => child.bornWeek >= pregnancy.dueWeek)) return
  world.children.push({ bornWeek: world.week, sex: 'girl' })
  // ⚠ DRAFT – the kept line is the builder's draft (invariant 4), `landWedding`'s own marking.
  // ⚠ THE KEY IS THE WEEK, `milestoneKey`'s own identity for this type and for its reason: a birth is
  // once per PREGNANCY, not once per marriage, so an episode-keyed receipt would swallow W5's second
  // child of the same marriage.
  fireMilestone(world, `birth:${world.week}`, BIRTH_EVENT)
  captureMilestone(world, { type: 'birth', week: world.week })
  // ⭐⭐⭐ AND THE MARK THE MONTHS AFTER LEAVE ON HER – the SECOND writer of `world.spiritShock` in
  // the engine (`rollEnds` is the first, `engine/spirit.ts`'s own banner carries the corrected
  // sentence). A fact, never a number: what it costs is `ECONOMY.spirit.shock.postpartum`,
  // scaled by the parent's persisted `support` grade, and `accrueSpirit` – SIX calls later in
  // this same tick, counted rather than guessed – is the one place that reads either.
  //
  // ⚠⚠ landBirth: IT IS **ONE SLOT AND THIS WRITE OVERWRITES**, DELIBERATELY AND WITH THE PRICE NAMED.
  // ⚠ landBirth: PINNED IN §D OF THE SUITE RATHER THAN LEFT TO FIELD ORDER
  // → docs/notes/life-beats/pregnancy.md#landbirth--the-mark-the-months-after-leave-on-her
  world.spiritShock = { week: world.week, kind: 'postpartum' }
}

/** ⭐⭐⭐ THE WEEK SHE SAYS – the ONE week of the decision window that carries the draw, derived
 *  off the record in ONE place so the gate and the RNG key cannot ever name two different weeks
 *  (`activeEpisode`'s own law: two spellings of one fact are a defect waiting for a week to
 *  disagree). Pure, zero draws, no writes. `resolveReturnDecision` (`world/endings.ts`) is the
 *  reader.
 *
 *  ⚠⚠ decisionWeekOf: **ONE DRAW, AND IT IS THE END OF THE WINDOW RATHER THAN ITS START**…
 *  ⚠ decisionWeekOf: IT IS DERIVED AND NOT PERSISTED, WHICH IS THE ONE PLACE THIS WAVE'S RECORDS PART FROM `dueWeek`'s LAW
 *  ⚠ decisionWeekOf: T5 WROTE «`PregnancyState` gained its last field at T1» AND T6 FALSIFIED THAT HALF…
 *  → docs/notes/life-beats/pregnancy.md#decisionweekof--the-week-she-says--the-one-week-of-the-decision-window
 */
export function decisionWeekOf(pregnancy: PregnancyState): number {
  return pregnancy.dueWeek + ECONOMY.motherhood.decisionWeeksAfterBirth
}

/** ⭐⭐⭐ WAVE 8b T2 (C6) – **WHERE IN THE MOTHERHOOD ARC THIS WEEK FALLS**, for the diary band.
 *  The wave-8 hand-back listed the diary half of T3's texture as one of two things the brief
 *  asked for and did not ship; his 21.09 word is what makes it this batch's, and this is the
 *  whole of the plumbing it needed.
 *
 *  ⚠⚠ motherhoodBandAt: **PURE READ, ZERO DRAWS, AND IT PERSISTS NOTHING.** Three fields the world has carried since v85 – `pregnancy`…
 *  ⚠ motherhoodBandAt: THE ORDER OF THE TESTS IS THE ARC'S OWN and the two early returns are why it reads oddly…
 *  ⚠ motherhoodBandAt: `last` IS **THE PORTRAIT'S OWN WINDOW** (`PREGNANT_LAST_WEEKS`, `shared/avatarEmotion.ts`)
 *  ⚠ motherhoodBandAt: THE `early`/`mid` SEAM IS THE MIDPOINT OF WHAT IS LEFT
 *  ⚠ motherhoodBandAt: `returned` IS THE **FIRST RUNG** OF THE COMEBACK RAMP and stops there.
 *  → docs/notes/life-beats/pregnancy.md#motherhoodbandat--wave-8b-t2-c6--where-in-the-motherhood-arc-this-week-falls
 */
export function motherhoodBandAt(world: WorldState): MotherhoodBand | null {
  const week = world.week
  const pregnancy = world.pregnancy
  if (pregnancy !== null) {
    // ⚠ THE ROSTER AND NOT THE CALENDAR – `landBirth`'s own once-ness test verbatim, so a second
    // pregnancy standing beside an older sibling's row (W5) reads this correctly without an edit.
    const born = world.children.filter((child) => child.bornWeek >= pregnancy.dueWeek)
    if (born.length > 0) return born.some((child) => child.bornWeek === week) ? 'birth' : 'postpartum'
    // ⭐⭐⭐ v87 T2 – **THE HIDDEN WINDOW IS SILENT, AND IT IS SAID OUT LOUD RATHER THAN LEFT TO THE
    // CLAUSE BELOW.** Between the conception and the announcement the parent has not been told, so
    // there is nothing for his diary to be about: a band here would be the game telling him a thing
    // she has not said. The `week < pausesWeek` clause two lines down already returned `null` for
    // these weeks by arithmetic – this states it as the law it is (the design's §3, «no mechanic
    // prices those weeks»), so a later edit to the pause clause cannot silently open the window.
    if (week < pregnancy.announcedWeek) return null
    if (week === pregnancy.announcedWeek) return 'announced'
    // The eight weeks she plays on carry no band: they look like any other week, and a band that
    // spoke about them would be saying something the player cannot yet see.
    if (week < pregnancy.pausesWeek) return null
    const lastOpens = pregnancy.dueWeek - PREGNANT_LAST_WEEKS
    if (week >= lastOpens) return 'last'
    return week < pregnancy.pausesWeek + Math.ceil((lastOpens - pregnancy.pausesWeek) / 2) ? 'early' : 'mid'
  }
  const comeback = world.comeback
  if (comeback === null) return null
  const back = week - comeback.returnedWeek
  // ⚠ A WEEK **BEFORE** THE RETURN TAKES NO BAND, which is `comebackMatchFactor`'s own discipline one
  // module over («a week before the return takes no rung and comes back 1.0»). It is unreachable
  // through the app – `world.comeback` is written AT the return, so the engine never asks about an
  // earlier week – and it is answered anyway, because a total function cannot be made wrong by a
  // future caller (`portraitStage`'s own rule). Without it a negative `back` is also «less than the
  // first rung» and the band would say «the bag is packed again» about a week she was still carrying.
  if (back < 0) return null
  const stages = ECONOMY.motherhood.comebackStages
  return back < stages[1].fromWeeksBack ? 'returned' : null
}

/** ⭐⭐⭐ HER CHANCE OF **TRYING** – pure over the four inputs the brief names, in its own order
 *  of size: `support` (the biggest, the digest's own claim), then `spirit`, `bond` and age.
 *  Zero draws, no writes, no world – `arrivalHazardFor`'s and `endsHazardFor`'s own shape (§5),
 *  which is what lets every grade be pinned without building a career.
 *
 *  ⚠⚠ returnChanceFor: IT ANSWERS «DOES SHE TRY» AND NOTHING ELSE, AND THAT FENCE IS THE POINT OF THE WHOLE MODEL.
 *  ⚠ returnChanceFor: NOTHING HERE MAY EVER BECOME A SUCCESS RATE
 *  ⚠ returnChanceFor: SHE DECIDES AND NOBODY IS ASKED (§4a, at the layer's second-biggest moment).
 *  ⚠ returnChanceFor: A `null` GRADE READS THE `measured` CELL
 *  ⚠ returnChanceFor: THE AGE TERM IS ONE-SIDED AND THE YEARS ARE WHOLE
 *  → docs/notes/life-beats/pregnancy.md#returnchancefor--her-chance-of-trying--pure-over-the-four-inputs
 */
export function returnChanceFor(
  support: PregnancyState['support'],
  spirit: number,
  bond: number,
  ageYears: number,
): number {
  const m = ECONOMY.motherhood
  const yearsOver = Math.max(0, Math.floor(ageYears - m.returnAgePivotYears))
  const chance =
    m.returnBase +
    m.returnSupportShift[support ?? 'measured'] +
    (spirit - ECONOMY.spirit.baseline) * m.returnSpiritPerPoint +
    (bond - ECONOMY.bond.start) * m.returnBondPerPoint -
    yearsOver * m.returnAgePerYearOver
  return Math.min(m.returnChanceMax, Math.max(m.returnChanceMin, chance))
}

/** ⭐⭐⭐ v85 T6 – **WHAT THE RETURN LEAVES BEHIND**: the pregnancy's last two facts turned into
 *  the record that outlives it. Pure, zero draws, no writes and no world – `returnChanceFor`'s
 *  own shape one function up, and for its reason: every cell of the freeze can then be pinned
 *  without building a career. `resolveReturnDecision` (`world/endings.ts`) is the ONE caller
 *  and it calls this on the line ABOVE the clear, which is the seam T5 marked and left.
 *
 *  ⚠⚠ comebackAtReturn: IT IS WRITTEN **BEFORE** `world.pregnancy` GOES NULL AND THAT ORDER IS THE WHOLE FUNCTION.
 *  owner (comebackAtReturn): «наверное да, у нас тоже были исследования»
 *  ⚠ comebackAtReturn: `validUntilWeek` IS ANCHORED ON THE **RETURN**, and the alternative is named rather than hidden.
 *  ⚠ comebackAtReturn: A `null` RANK MAKES A `null` FREEZE AND STILL MAKES A COMEBACK
 *  → docs/notes/life-beats/pregnancy.md#comebackatreturn--v85-t6--what-the-return-leaves-behind
 */
export function comebackAtReturn(pregnancy: PregnancyState, week: number): ComebackState {
  const m = ECONOMY.motherhood
  return {
    returnedWeek: week,
    protectedRank:
      pregnancy.rankAtPause === null
        ? null
        : {
            rank: pregnancy.rankAtPause,
            entriesLeft: m.protectedRankEntries,
            validUntilWeek: week + m.protectedRankWeeks,
          },
    // ⚠ NULL, AND THE BEAT RAISED ON THIS SAME WEEK IS WHAT FILLS IT (ruling A, 20.09 – the field
    // moved here off `PregnancyState`, which the clear one line below destroys). `support`'s own
    // argument: the beat BLOCKS, so «she is back and nobody has said how» is the true reading of the
    // gap, and every available default would be a plan nobody chose.
    returnPlan: null,
  }
}


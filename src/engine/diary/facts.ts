// THE FACTS THE DIARY READS: her latest result, the milestones worth keeping, and the two bands
// (condition, money pressure) every phrase pool asks about.
//
// ⚠ DEPENDENCY DIRECTION. This is the bottom of the diary package: it imports from the engine's own
// leaves and from shared/, never from diary.ts. Everything above it - travel, the phrase pools, the
// week notes, memory - reads these and not the other way round.
//
// ⚠ RNG: nothing here draws. These are pure reads over the events ledger and two numeric bands.
import { resultShowsOnHerFace, type LastKidResult, type LastKidTitle, type MemoryFace } from '../../shared/avatarEmotion'
import type {
  ConditionBand,
  DiaryLifeStage,
  FundsPressure,
  Milestone,
  MilestoneType,
  KnockChoice,
  LossStreak,
  SpouseViewOccasion,
  WorldEvent,
} from '../../shared/protocol'
import { TIERS, tierFromLabel } from '../season/calendar'
// ⭐ v72: who she is, type-only – the derivation and the physics stay in engine/spirit.ts.
import type { Temperament } from '../spirit'

const TIER_IDS = Object.keys(TIERS) as TierId[]
import type { TierId } from '../season/types'

// --- the one emotion walk (moved here from composables/kidEmotion.ts) -----------------------
// The walk that answers "what is her latest result / title" used to live in the UI composable;
// Diary-1 gave it a second consumer on the engine side (the facts object), and one walk in one
// place is the only way the painting and the phrase can never disagree. The composable now reads
// the engine's decision off the snapshot instead of re-deriving it.

/** `${year}-w${week}-${tier}` → tier (undefined for an unparseable/foreign id). */
export function tierFromEventId(eventId: string | undefined): TierId | undefined {
  if (!eventId) return undefined
  const tail = eventId.split('-').pop()
  return TIER_IDS.find((t) => t === tail)
}

/** The kid's most recent TOURNAMENT match off the event feed (newest first). A result emotion
 *  only lasts until the next weekly tick, so walking the trailing feed is enough. R11-2: a
 *  practice friendly is skipped outright – it is not a result her face reports on. */
export function lastKidResultOf(events: readonly WorldEvent[], kidId: string): LastKidResult | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i]
    const match = e.match
    if (!match || !resultShowsOnHerFace(e)) continue
    const won = match.winnerId === kidId
    // R8-6a: a loss in the FINAL = runner-up = a good result. The same week's tournament
    // summary carries finishIdx 1 exactly when her run ended in the final.
    const lostFinal =
      !won && events.some((t) => t.type === 'tournament' && t.week === e.week && t.finishIdx === 1)
    return { week: e.week, won, lostFinal, tier: tierFromEventId(match.eventId) }
  }
  return null
}

/** R9-11: the kid's most recent TITLE (finishIdx 0 on a tournament summary), for win-immunity. */
export function lastKidTitleOf(events: readonly WorldEvent[]): LastKidTitle | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i]
    if (e.type !== 'tournament' || e.finishIdx !== 0) continue
    const tier = tierFromLabel(e.text)
    if (tier) return { tier, week: e.week }
  }
  return null
}

// --- milestones (D10) -----------------------------------------------------------------------

/** A milestone's IDENTITY, for idempotent capture: first title/final are per tier, the first
 *  international entry and the first injury are per career, a season's rank is per season. */
export function milestoneKey(m: Milestone): string {
  switch (m.type) {
    case 'title':
    case 'final':
      return `${m.type}:${m.tier ?? '?'}`
    case 'international':
    case 'injury':
    // R15-5: the first PRIZE MONEY is per career, like the first passport week - the memorable
    // thing is that the tennis paid her at all, not which rung wrote the cheque (the tier rides on
    // the row for the memory line, it is just not the identity).
    case 'prize':
    // W4-SCHOOL: once per career, and the week rides on the row rather than being the identity -
    // so a back-filled row and a captured one are the SAME milestone and cannot double.
    case 'school':
      return m.type
    case 'season-rank':
      return `season-rank:${m.seasonIndex ?? -1}`
    // ⚠ W2-ENDINGS: TWO CROSSINGS, TWO IDENTITIES, ONE TYPE. "Break-even" names two different events
    // that are YEARS apart, and the album needs both: `kind: 'week'` is the first week whose prize
    // money beat that week's costs (common - it lands in the first professional season), `kind:
    // 'career'` is the week her prize money to date passed everything the family had ever spent
    // (measured at 0% across the bench, which is what slot 6's copy is written against). Each can
    // happen only once, so the kind IS the identity.
    case 'break-even':
      return `${m.type}:${m.kind ?? 'career'}`
    // ⭐ v83 (the wedding, wave 7 T3): PER EPISODE, NEVER PER CAREER – `kind` carries the
    // `LoveEpisode.id`, because a second marriage on a later row is first-class (the 11.09 re-shape)
    // and a `'wedding'` identity with no episode in it would silently swallow it. The `?` fallback
    // is for a hand-built row only; the one writer (`landWedding`) always stamps the id.
    case 'wedding':
      return `${m.type}:${m.kind ?? '?'}`
    // ⭐ v85 (the birth, wave 8 T4): PER WEEK, AND THAT IS THE ONE PLACE IT PARTS FROM THE WEDDING
    // ABOVE. A wedding is once per EPISODE and its id says which marriage; a birth is once per
    // PREGNANCY, and a second child of the same marriage is confirmed wanted (11.09, W5's) – so an
    // episode-keyed identity would silently swallow the second one. Two children cannot be born in
    // one week here, so the week IS the identity, and no `kind` rides the row at all.
    case 'birth':
      return `${m.type}:${m.week}`
  }
}

/** The painting a memory of each milestone type shows. `happy` only for the title – the one
 *  moment that earned it; everything else stays in the composed half of the set.
 *
 *  R14-1: `injury` STAYS here and is one of the two surfaces that can still request that painting.
 *  A Memory is a picture of a week that happened – "ankle strain – her first injury" is the week
 *  she went down, not the nine that followed it – so the moment face is the right one and the
 *  layoff's `rehab` would be wrong.
 *
 *  ⚠⚠ THE TYPE WIDENED ON 18.09 AND THE OLD SENTENCE IS WORTH KEEPING TO SAY WHY. It read «typed on
 *  the NARROW union … nothing a milestone maps to is painting-only, so the Memory polaroid keeps a
 *  crop it could fall back on», which was true until a milestone had a painting of its own. The
 *  wedding does: `fem-euro-brunnet-adult-bride.webp`, on disk since the art set shipped and the
 *  reason the 23+ gate was ruled on 11.09. `MemoryFace` is the widest of the three unions – see
 *  `shared/avatarEmotion.ts` for why the bride is a member of that one and of neither of the others
 *  – and the fallback the polaroid actually needs is a BAND fallback, not a crop one: `portraitUrl`
 *  resolves it, explicitly and tested. No crop is ever requested here; nothing in the app renders an
 *  emotion crop at all. */
export const MEMORY_EMOTION: Record<MilestoneType, MemoryFace> = {
  title: 'happy',
  final: 'serious',
  // R15-5: the first cheque is the other moment that earned the smile - it is the week the tennis
  // stopped being only a bill.
  prize: 'happy',
  // W4-SCHOOL: `norm`, not `happy`. Leaving school is a change rather than a triumph - nobody beat
  // anybody - and a grin on the polaroid would be the game telling her how to feel about a Tuesday
  // in September. The composed face is what a girl walking out of a building for the last time has.
  school: 'norm',
  international: 'norm',
  injury: 'injury',
  'season-rank': 'norm',
  // W2-ENDINGS: the week the tennis stopped being only a bill FOR GOOD, which is a bigger version of
  // the same moment `prize` earns the smile for.
  'break-even': 'happy',
  // ⭐⭐⭐ v83 (the wedding, wave 7 T3), REPAIRED 18.09 – AND THE DRAFT NOTE IS WHAT FOUND IT.
  //
  // This shipped as `'happy'`, flagged as «THE BUILDER'S PICK AND A DRAFT LIKE THE WAVE'S WORDS»,
  // with the argument «the bride art the 11.09 ruling gated the whole branch on is painted smiling».
  // The argument was right about the painting and wrong about which painting was being drawn:
  // `'happy'` is her ordinary adult face, so the polaroid of her WEDDING DAY showed a girl with a
  // trophy. `fem-euro-brunnet-adult-bride.webp` has been on disk since the art set shipped, is the
  // reason the 23+ minimum was ruled at all (the comments in `economy.ts` and `world/lifeBeat.ts`
  // both say so), and was referenced by NOTHING in `src/`.
  //
  // ⚠ IT IS NOT A NEW PICK AND NOT A NEW STRING – it is the picture the ruling was about, finally
  // wired to the beat that ruling created. The face for a wedding in a band the bride is not painted
  // for falls back honestly (`paintedFaceFor`), which is a first-class answer rather than a 404: the
  // gate is 23+, so `adult` is the common case and `lateCareer` is an ordinary one.
  wedding: 'bride',
  // ⭐⭐ v85 (the birth, wave 8 T4) – `'norm'`, AND IT IS **THE BUILDER'S DRAFT** exactly as the
  // wedding's was, flagged here so the next reader finds it the way the wedding's draft note found
  // its own mistake eighteen days later.
  //
  // ⚠⚠ THE WEDDING'S REPAIR IS THE WHOLE ARGUMENT, READ FORWARD. `'happy'` is her ordinary adult
  // face – that is what the 18.09 repair above established – so a `'happy'` polaroid of the week her
  // daughter was born would show a girl with a trophy, which is the same defect one moment over.
  // THERE IS NO BIRTH PAINTING: `FACE_BANDS` holds exactly one moment-face (`bride`), cut for the
  // wedding the 11.09 ruling gated the branch on, and nothing on disk answers a birth. So the honest
  // pick is the app's own honest answer where a moment has no picture – `norm`, the neutral stage
  // portrait, which is literally what `paintedFaceFor` falls back to.
  // ⚠ `school`'s ROW IS THE PRECEDENT AND ITS SENTENCE IS THE REASON: «a grin on the polaroid would
  // be the game telling her how to feel». A birth week is also the week the postpartum shock lands
  // (`landBirth`, world/lifeBeat.ts §14) – −24/−37.5 of spirit – so a smile is the one face the
  // arithmetic of the same week actively contradicts.
  // ⚠ IF A BIRTH PAINTING IS EVER CUT, this is a one-word change plus a `FACE_BANDS` row – T10 owns
  // the portraits and it is HIS call, not a builder's (who-she-is §5a).
  birth: 'norm',
}

// --- the facts ------------------------------------------------------------------------------

/** The narrow slice of the world the diary is allowed to read. Assembled by toSnapshot – the
 *  structural type is what keeps this module free of a world.ts import cycle. */
export interface DiaryWorldView {
  seed: string
  week: number
  /** Current age and college status are carried only to choose an honest narrative viewpoint.
   *  Neither is persisted by the diary. */
  ageYears: number
  inCollege: boolean
  /** W4-SCHOOL: is she past her last school year in THIS week? The diary owns no calendar
   *  arithmetic, so the answer arrives with the facts – `schoolIsOver(week, birthMonth)`. A view
   *  that omits it is a view about a schoolgirl, which is why it is required rather than optional:
   *  the exam pool's licences all read `examsWeek`, and a defaulted `false` puts revision notes in a
   *  twenty-two-year-old's diary, which is the bug this wave is here to fix. */
  schoolOver: boolean
  kidId: string
  /** ⭐⭐⭐ HER AGE IN ANY WEEK, THE ONE CLOCK, HANDED IN RATHER THAN RE-DERIVED (D-01, 05.09 review).
   *
   *  ⚠⚠ IT REPLACES `startAgeYears`, AND THAT IS THE WHOLE FIX. The diary used to carry her age at
   *  week 0 and rebuild every other age from it as `startAgeYears + Math.floor(week / 52)` – the
   *  BAND clock, which `world/age.ts:65` says of in capitals: «IF YOU ARE ASKING HOW OLD SHE IS,
   *  THIS IS THE WRONG FUNCTION». Every other surface reads `Snapshot.ageYears`, built from
   *  `kidAgeAt` off her real birth date. Measured over ten seasons: a girl born 20 December had the
   *  diary painting the NEXT portrait stage for 51 consecutive weeks at each `portraitStage`
   *  boundary (weeks 156-206 and 468-518), so her Home header and her diary showed two different
   *  faces of the same girl on one screen for a year at a time. Even a 15 January birthday drifts
   *  for two weeks. The album's own header (`world/album.ts:68-73`) records the last time this class
   *  of drift shipped: «header said «2031 – she was 13» while Home, about the same week, read 14».
   *
   *  ⚠ A FUNCTION AND NOT A BIRTH DATE, because the diary owns no calendar arithmetic – the same
   *  rule `schoolOver` above is written to. `toSnapshot` closes over the world and passes
   *  `kidAgeAt`, so the ruling keeps its one spelling and this module gains no import.
   *
   *  ⚠ AND THE WHOLE-CAREER DOMAIN IS LOAD-BEARING: the Memory card paints her as she was at a
   *  milestone's week, which may be seasons back, so this is asked about arbitrary past weeks and
   *  not only about `week`. */
  kidAgeAt: (week: number) => number
  condition: number
  /** ⭐ v72 – HER TWO NUMBERS, RAW, AND THIS IS THE LAST PLACE THEY ARE NUMBERS. `assembleDiaryFacts`
   *  bands both on the way in (`spiritBandOf` / `bondBandOf`) and `DiaryFacts` carries no figure for
   *  either: the fog law is enforced by the shape of the object the UI actually receives.
   *
   *  ⚠ REQUIRED, NOT OPTIONAL, AND `vacationPackageId` BELOW SPELLS OUT WHY AT LENGTH: both feed COPY
   *  LICENCES now – the spirit register picks the variant, the bond band picks the channel – so a
   *  fixture that omitted one would still build, still pass, and quietly sweep the wrong space. */
  spirit: number
  bond: number
  /** ⭐ v72 – WHO SHE IS. The licence all 44 voiced lines read; without it none is selectable and the
   *  wave ships dead copy. Required for the same reason as the two above. */
  temperament: Temperament
  fundsCents: number
  injury: { kind: string; weeksRemaining: number; totalWeeks: number } | null
  /** the FULL retained event log (not the snapshot's trailing 60) */
  events: readonly WorldEvent[]
  /** the engine's streak, computed once per snapshot (computeLossStreak) */
  lossStreak: LossStreak | null
  kidRank: number
  prevKidRank: number | null
  /** a tournament reveal is in progress and NOT yet finalized: the week's rank recompute has not
   *  run, so `rankClimbed` must not read last week's movement as this week's. */
  pendingUnfinished: boolean
  /** R13-2: the ranking points the kid's run AWARDED this week (sum of her result rows at
   *  `week`). 0 on a first-round exit – see DiaryFacts.runPointsThisWeek. */
  runPointsThisWeek: number
  milestones: readonly Milestone[]
  /** a booked family vacation resolved this week */
  vacationWeek: boolean
  /** W5: ...and WHICH package. Non-null on exactly the weeks `vacationWeek` is true and the booking
   *  is still on file (bookings are retained four trailing weeks after they resolve, so the week's
   *  own row is always there when its story is told).
   *
   *  ⚠ NO LONGER OPTIONAL, AND THE OLD NOTE HERE EXPLAINS EXACTLY WHY IT COULD NOT STAY SO. It read:
   *  "`trainPct` / `knockChoice` / `knockPart` all feed COPY LICENCES, so a fixture that forgot one
   *  would silently sweep the wrong space. This one selects a PAINTING and nothing else - no licence
   *  in either pool reads it - so a view that omits it is a view about the words."
   *
   *  That reasoning was right, and it is what changed: the photo and condition pools now license on
   *  this field, one line per package (owner, 31.07: «куда бы ни поехала ... week recap, ну кроме
   *  картинки» - the picture was the ONLY thing it moved). So it has joined the class the note
   *  describes, and it takes that class's rule with it: a fixture that omitted it would still build,
   *  still pass, and quietly sweep the generic sentence instead of the six new ones. Required.
   *  That world.ts really passes it is pinned in tests/week-scene.test.ts. */
  vacationPackageId: string | null
  /** ⭐ ROUND-21 #2: did the coach travel with her? `coachTravelsWithHer(world)` – the ONE predicate
   *  the tournament flow and the live commentary also read, so the three surfaces cannot disagree
   *  about the same trip.
   *
   *  Required rather than optional, for the reason `vacationPackageId` above spells out at length: it
   *  selects COPY, and a view that forgot it would build, pass, and quietly say he stayed home. */
  coachTravelled: boolean
  /** ⭐⭐ v74 (the private life, wave 3 – T6) – DOES THE PARENT KNOW THERE IS SOMEONE? The ONE
   *  predicate, `knownPartner(world, week) !== null`, asked at snapshot time and carried – exactly
   *  the shape `coachTravelled` above records, and for the same reason: the beat, the feed row and
   *  the diary must not be able to disagree about the same attachment.
   *
   *  Required rather than optional, for the reason `vacationPackageId` spells out at length: it
   *  selects COPY, and a view that forgot it would build, pass, and quietly say nobody is there. */
  partnerKnown: boolean
  /** ⭐⭐ v75 (the private life, wave 4 – T6) – IS THE MARK OF AN ENDING STILL ON HER? The ONE
   *  predicate, `world.spiritShock !== null && kind === 'breakup'`, asked at snapshot time and carried
   *  – exactly the shape `partnerKnown` above and `coachTravelled` before it record, and for the same
   *  reason: the week note and the engine's own recovery arithmetic must not be able to disagree about
   *  whether she is still carrying it.
   *
   *  Required rather than optional, for the reason `vacationPackageId` spells out at length: it selects
   *  COPY, and a view that forgot it would build, pass, and quietly sweep the ordinary week instead.
   *
   *  ⚠ IT IS NOT `partnerKnown` INVERTED. That fact is about DISCLOSURE and goes false the instant an
   *  episode ends; this one is about HER, and is true for weeks on end after an ending the parent may
   *  never have heard of. See the field's note in `shared/protocol/narrative.ts`. */
  freshBreakup: boolean
  /** ⭐ v83 (the wedding, wave 7 – T5) – THE OCCASION THE SPOUSE RAISED THIS WEEK, or null. The ONE
   *  derivation is `spouseViewOccasionThisWeek(world)` (world/lifeBeat.ts §12), asked at snapshot
   *  time and carried – `partnerKnown`'s own shape, and REQUIRED for its reason: it selects COPY
   *  (the week note's `spouseSpoke` band), and a view that forgot it would build, pass, and quietly
   *  say nothing was said at home. See the field's full licence note in
   *  `shared/protocol/narrative.ts` (`DiaryFacts.spouseOccasion`). */
  spouseOccasion: SpouseViewOccasion | null
  /** ⭐ v83 (wave 7 – T10) – THIS IS THE WEEK SHE GOT HER OWN PLACE. The ONE derivation is
   *  `ownKeyThisWeek(world)` (world/lifeBeat.ts §13), asked at snapshot time and carried, and
   *  REQUIRED for the field above's reason: it selects COPY (the week note's `ownKey` line). See
   *  `shared/protocol/narrative.ts` (`DiaryFacts.ownKeyWeek`) for the licence. */
  ownKeyWeek: boolean
  /** W2: `plan.train` – the percentage of the week the PLAYER put on court. */
  trainPct: number
  /** W4: the live knock's decision, or null – `'rest'` on the week she is spending off the training
   *  court, `'push'` on the weeks she is training through it. Assembled by toSnapshot off
   *  `world.knock`, which is the persisted record of what the player answered. */
  knockChoice: KnockChoice | null
  /** W4: where it is, on exactly the weeks `knockChoice` is non-null. */
  knockPart: string | null
  /** the age she turns this week, or null - world.ts derives it from her birth month */
  birthdayAge: number | null
  /** ⭐ v48: what he gave her, as a noun ("the headphones"), or null until he has answered. */
  birthdayGift: string | null
  /** ⭐ v48: whether it answered what she had been asking for. */
  birthdayWanted: boolean
  /** ⭐ v48: the age she was the last time she was given this exact thing, or null the first time. */
  birthdayRepeatAge: number | null
}

/** One derived answer for every diary surface that needs to know how close the parent is to the
 *  ordinary week. Twenty-two is a voice boundary, not a new gameplay or save-system rule. */
export function diaryLifeStageFor(
  ageYears: number,
  schoolOver: boolean,
  inCollege: boolean,
): DiaryLifeStage {
  if (!schoolOver) return 'school'
  if (inCollege) return 'college'
  return ageYears >= 22 ? 'independent' : 'after-school'
}

/** Condition, as the word Home speaks (D3). The 80/60/40 rungs mirror the idle-emotion ladder
 *  (tired < 40, serious < 60) plus the "genuinely fresh" line the honesty pin holds tired-copy
 *  against: no tired phrase at 80+. */
export function conditionBandOf(condition: number): ConditionBand {
  if (condition >= 80) return 'fresh'
  if (condition >= 60) return 'ok'
  if (condition >= 40) return 'worn'
  return 'drained'
}

/** The family wallet as a pressure band – the diary never quotes the balance. $2,000 is the
 *  D7 licence line the spec names for money worry; $8,000 covers "watching it" (a working-class
 *  season of base costs). */
export function fundsPressureOf(fundsCents: number): FundsPressure {
  if (fundsCents < 2_000_00) return 'tight'
  if (fundsCents < 8_000_00) return 'watchful'
  return 'ok'
}

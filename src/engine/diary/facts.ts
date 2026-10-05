// THE FACTS THE DIARY READS: her latest result, the milestones worth keeping, and the two bands
// (condition, money pressure) every phrase pool asks about.
//
// ⚠ DEPENDENCY DIRECTION. This is the bottom of the diary package: it imports from the engine's own
// leaves and from shared/, never from diary.ts. Everything above it - travel, the phrase pools, the
// week notes, memory - reads these and not the other way round.
//
// ⚠ RNG: nothing here draws. These are pure reads over the events ledger and two numeric bands.
// ⚠ `CONDITION_TIRED_BELOW` / `CONDITION_SERIOUS_BELOW` come from here and are NOT restated below
// (F-11, 26.09): `conditionBandOf`'s lower two rungs are the idle-emotion ladder's own two.
import {
  CONDITION_SERIOUS_BELOW,
  CONDITION_TIRED_BELOW,
  resultShowsOnHerFace,
  type LastKidResult,
  type LastKidTitle,
  type MemoryFace,
} from '../../shared/avatarEmotion'
// ⚠ FOUR TYPE IMPORTS LEFT WITH `DiaryWorldView`'s PICKED MEMBERS (F-06, 26.09): `KnockChoice`,
// `MotherhoodBand`, `SpouseViewOccasion` and `Temperament` were named ONLY to restate members
// `DiaryFacts` already declares, so the pick took them with it. ⭐ v72's note on the last of them,
// verbatim, because the rule outlives the line: «who she is, type-only – the derivation and the
// physics stay in engine/spirit.ts.» That is still how this module sees her; it now sees her through
// the wire type instead of through a second declaration.
import type {
  ConditionBand,
  DiaryFacts,
  DiaryLifeStage,
  FundsPressure,
  Milestone,
  MilestoneType,
  LossStreak,
  WorldEvent,
} from '../../shared/protocol'
import { TIERS, tierFromLabel } from '../season/calendar'

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
    // ⭐ v88 (the parting, wave 12 T3): PER EPISODE, `'wedding'`'s CALL AND NOT `'birth'`'s – and
    // the two live three lines apart so the difference is readable. A marriage ends once per
    // EPISODE, so `divorce:<episodeId>` is exact and a SECOND marriage's divorce on a later row
    // captures its own line; the birth is per WEEK because a second child of the same marriage would
    // be swallowed by an episode key. The `?` fallback is for a hand-built row only; the one writer
    // always stamps the id.
    case 'divorce':
      return `${m.type}:${m.kind ?? '?'}`
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
  /** ⭐⭐ v88 (the parting, wave 12 T3) – `serious`, AND THE CHOICE IS A REFUSAL AS MUCH AS A PICK.
   *  Three faces were candidates and two are refused by the album's own law (§5: it does not settle
   *  who was right): `funeral` paints a grief this is not – the person is alive and in the world –
   *  and `norm` paints nothing at all, which on the one page that says a marriage ended reads as the
   *  album shrugging. `serious` is the composed half of the set, the face `final` already wears: a
   *  week that mattered and that nobody won. ⚠ NO NEW PAINTING IS COMMISSIONED and none is needed –
   *  `serious` is a `PortraitEmotion`, painted at every band, so `FACE_BANDS` gains no row and
   *  `paintedFaceFor` has no fallback to take. */
  divorce: 'serious',
  // ⭐⭐ v85 (the birth, wave 8 T4) – `'norm'`, AND IT IS **THE BUILDER'S DRAFT** exactly as the
  // wedding's was, flagged here so the next reader finds it the way the wedding's draft note found
  // its own mistake eighteen days later.
  //
  // ⚠⚠ THE WEDDING'S REPAIR IS THE WHOLE ARGUMENT, READ FORWARD. `'happy'` is her ordinary adult
  // face – that is what the 18.09 repair above established – so a `'happy'` polaroid of the week her
  // daughter was born would show a girl with a trophy, which is the same defect one moment over.
  // ⭐⭐⭐ WAVE 8b T5 (E1) – **THE BIRTH PAINTING EXISTS NOW AND THIS ROW IS ITS ONE-WORD CHANGE.**
  // Wave 8 shipped `'norm'` here and the paragraph below is its reason, kept verbatim because it is
  // the record of a question that got an answer: «THERE IS NO BIRTH PAINTING: `FACE_BANDS` holds
  // exactly one moment-face (`bride`), cut for the wedding the 11.09 ruling gated the branch on, and
  // nothing on disk answers a birth. So the honest pick is the app's own honest answer where a moment
  // has no picture – `norm`, the neutral stage portrait, which is literally what `paintedFaceFor`
  // falls back to. ⚠ IF A BIRTH PAINTING IS EVER CUT, this is a one-word change plus a `FACE_BANDS`
  // row – T10 owns the portraits and it is HIS call, not a builder's (who-she-is §5a).»
  // He commissioned it; `fem-euro-brunnet-adult-birth.webp` is on disk; the change is the one word
  // and the one row that sentence predicted, and nothing else moved.
  // ⚠ `school`'s ROW IS THE PRECEDENT AND ITS SENTENCE IS STILL THE REASON THIS IS NOT `'happy'`:
  // «a grin on the polaroid would be the game telling her how to feel». A birth week is also the week
  // the postpartum shock lands (`landBirth`, world/lifeBeat.ts §14), so a smile is the one face the
  // arithmetic of the same week actively contradicts. ⭐ THE PAINTING ITSELF IS NOT A GRIN – she is
  // looking down at the child – which is why it can be the honest face where `happy` could not.
  birth: 'birth',
}

// --- the facts ------------------------------------------------------------------------------

/** ⭐⭐ THE 27 FACTS THE DIARY CARRIES STRAIGHT THROUGH ARE PICKED OFF `DiaryFacts` (F-06, 26.09) AND
 *  NO LONGER RESTATED HERE. The two interfaces declared 28 members on both sides of the boundary,
 *  each with its own docstring, and 13 of the 15 commits that touched this file since `98e3560b`
 *  touched `shared/protocol/narrative.ts` as well – three edits and two docstrings per carried fact.
 *  The compiler caught a TYPE drift in one direction only and never caught a DOC drift at all: the
 *  two `freshBreakup` notes had already come to stress different halves of the same ruling. Every
 *  carried member's licence note lives on `DiaryFacts` now, which is where a line's author reads it.
 *
 *  ⚠ EVERY CARRIED MEMBER IS REQUIRED AND MUTABLE BECAUSE `DiaryFacts` IS – the rule the notes here
 *  used to have to state field by field is now a property of the derivation, and a `?` cannot be
 *  forgotten onto one of them. The chronicle of that rule, verbatim from `vacationPackageId`, whose
 *  pick took it out of this list:
 *
 *      «⚠ NO LONGER OPTIONAL, AND THE OLD NOTE HERE EXPLAINS EXACTLY WHY IT COULD NOT STAY SO. It
 *      read: "`trainPct` / `knockChoice` / `knockPart` all feed COPY LICENCES, so a fixture that
 *      forgot one would silently sweep the wrong space. This one selects a PAINTING and nothing else
 *      - no licence in either pool reads it - so a view that omits it is a view about the words."
 *
 *      That reasoning was right, and it is what changed: the photo and condition pools now license
 *      on this field, one line per package (owner, 31.07: «куда бы ни поехала ... week recap, ну
 *      кроме картинки» - the picture was the ONLY thing it moved). So it has joined the class the
 *      note describes, and it takes that class's rule with it: a fixture that omitted it would still
 *      build, still pass, and quietly sweep the generic sentence instead of the six new ones.
 *      Required. That world.ts really passes it is pinned in tests/week-scene.test.ts.»
 *
 *  ⚠ AND `schoolOver`'s OWN HALF OF THAT RULE STAYS ON THIS SIDE, verbatim, because it is about the
 *  VIEW rather than about the fact: «The diary owns no calendar arithmetic, so the answer arrives
 *  with the facts – `schoolIsOver(week, birthMonth)`.» `kidAgeAt` below is the same rule pointing the
 *  other way, and says so in its own note.
 *
 *  ⚠ `lossStreak` IS THE ONE SHARED NAME THAT NEVER MEANT ONE THING, so it is RENAMED rather than
 *  picked (F P3-17): an object here, a count on the wire. It is `lossStreakRun` below;
 *  `DiaryFacts.lossStreak` keeps its name and its count, and `assembleDiaryFacts` still bridges the
 *  two in the one line it always did.
 *
 *  The narrow slice of the world the diary is allowed to read. Assembled by toSnapshot – the
 *  structural type is what keeps this module free of a world.ts import cycle. */
export interface DiaryWorldView
  extends Pick<
    DiaryFacts,
    | 'week'
    | 'ageYears'
    | 'schoolOver'
    | 'condition'
    | 'temperament'
    | 'runPointsThisWeek'
    | 'vacationWeek'
    | 'vacationPackageId'
    | 'partnerKnown'
    | 'freshBreakup'
    | 'spouseOccasion'
    | 'ownKeyWeek'
    | 'motherhoodBand'
    | 'motherhoodSupport'
    | 'bereavedWeeksAgo'
    | 'divorcedWeeksAgo'
    | 'forkAftermath'
    | 'lineageTitles'
    | 'lineageOpen'
    | 'lineageEndedHurt'
    | 'trainPct'
    | 'knockChoice'
    | 'knockPart'
    | 'birthdayAge'
    | 'birthdayGift'
    | 'birthdayWanted'
    | 'birthdayRepeatAge'
  > {
  seed: string
  /** Current age and college status are carried only to choose an honest narrative viewpoint.
   *  Neither is persisted by the diary. (`ageYears` is the other half of that sentence and is picked
   *  off `DiaryFacts` above; this is the half that stays.) */
  inCollege: boolean
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
  /** ⭐ v92 (SUCCESSION S1) – the career's epoch year (`world.startYear`); OPTIONAL so a view built by hand keeps meaning 2031. */
  startYear?: number
  /** ⭐ v72 – HER TWO NUMBERS, RAW, AND THIS IS THE LAST PLACE THEY ARE NUMBERS. `assembleDiaryFacts`
   *  bands both on the way in (`spiritBandOf` / `bondBandOf`) and `DiaryFacts` carries no figure for
   *  either: the fog law is enforced by the shape of the object the UI actually receives.
   *
   *  ⚠ REQUIRED, NOT OPTIONAL, AND THE INTERFACE'S OWN BLOCK ABOVE SPELLS OUT WHY AT LENGTH
   *  (`vacationPackageId`'s chronicle, which moved there with the pick): both feed COPY
   *  LICENCES now – the spirit register picks the variant, the bond band picks the channel – so a
   *  fixture that omitted one would still build, still pass, and quietly sweep the wrong space. */
  spirit: number
  bond: number
  fundsCents: number
  injury: { kind: string; weeksRemaining: number; totalWeeks: number } | null
  /** the FULL retained event log (not the snapshot's trailing 60) */
  events: readonly WorldEvent[]
  /** the engine's streak, computed once per snapshot (computeLossStreak). ⚠ THE OBJECT, and the
   *  reason the name differs from `DiaryFacts.lossStreak`'s count – see F P3-17 in the block above. */
  lossStreakRun: LossStreak | null
  kidRank: number
  prevKidRank: number | null
  /** a tournament reveal is in progress and NOT yet finalized: the week's rank recompute has not
   *  run, so `rankClimbed` must not read last week's movement as this week's. */
  pendingUnfinished: boolean
  milestones: readonly Milestone[]
  /** ⭐ ROUND-21 #2: did the coach travel with her? `coachTravelsWithHer(world)` – the ONE predicate
   *  the tournament flow and the live commentary also read, so the three surfaces cannot disagree
   *  about the same trip.
   *
   *  Required rather than optional, for the reason the interface's own block above spells out at
   *  length (`vacationPackageId`'s chronicle): it
   *  selects COPY, and a view that forgot it would build, pass, and quietly say he stayed home. */
  coachTravelled: boolean
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

/** Condition, as the word Home speaks (D3). The lower two rungs ARE the idle-emotion ladder – they
 *  read its own `CONDITION_TIRED_BELOW` / `CONDITION_SERIOUS_BELOW` – plus the "genuinely fresh" line
 *  the honesty pin holds tired-copy against: no tired phrase at 80+, which is this function's own rung
 *  and stays a literal here.
 *
 *  ⚠ IT ASKS RATHER THAN MIRRORS SINCE 26.09 (F-11). This note used to say «the 80/60/40 rungs MIRROR
 *  the idle-emotion ladder (tired < 40, serious < 60)» while spelling 40 and 60 itself, and no test
 *  tied the two together – the face ladder was pinned against `conditionDeviation` and this third
 *  copy against nothing, so a retune of the face would have landed on two rungs of three and the
 *  word and the face would have described different weeks. The numbers did not change; only their
 *  source did. `>=` here is the exact complement of the owner's strict `<`. */
export function conditionBandOf(condition: number): ConditionBand {
  if (condition >= 80) return 'fresh'
  if (condition >= CONDITION_SERIOUS_BELOW) return 'ok'
  if (condition >= CONDITION_TIRED_BELOW) return 'worn'
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

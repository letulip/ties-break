// THE FACTS THE DIARY READS: her latest result, the milestones worth keeping, and the two bands
// (condition, money pressure) every phrase pool asks about.
//
// ⚠ DEPENDENCY DIRECTION. This is the bottom of the diary package: it imports from the engine's own
// leaves and from shared/, never from diary.ts. Everything above it - travel, the phrase pools, the
// week notes, memory - reads these and not the other way round.
//
// ⚠ RNG: nothing here draws. These are pure reads over the events ledger and two numeric bands.
import { resultShowsOnHerFace, type AvatarEmotion, type LastKidResult, type LastKidTitle } from '../../shared/avatarEmotion'
import type {
  ConditionBand,
  DiaryLifeStage,
  FundsPressure,
  Milestone,
  MilestoneType,
  KnockChoice,
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
  }
}

/** The painting a memory of each milestone type shows. `happy` only for the title – the one
 *  moment that earned it; everything else stays in the composed half of the set.
 *
 *  R14-1: `injury` STAYS here and is one of the two surfaces that can still request that painting.
 *  A Memory is a picture of a week that happened – "ankle strain – her first injury" is the week
 *  she went down, not the nine that followed it – so the moment face is the right one and the
 *  layoff's `rehab` would be wrong. Typed on the NARROW union for that reason: nothing a milestone
 *  maps to is painting-only, so the Memory polaroid keeps a crop it could fall back on. */
export const MEMORY_EMOTION: Record<MilestoneType, AvatarEmotion> = {
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
  startAgeYears: number
  condition: number
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

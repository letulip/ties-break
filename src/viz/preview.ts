// THE PRE-MATCH PREVIEW (owner, 11.08: «комментаторы дают какую-то короткую информацию об
// участниках, их шансе на победу или на продвижение в таблице»).
//
// A commentator's intro, before a ball is struck. It is a pure function of facts the game already
// holds - no engine change, no new state, no RNG - and it is a DOCUMENT PLANNER first and a phrase
// bank second: what it decides is which facts are said at all, and that decision is the ladder.
//
// ---------------------------------------------------------------------------------------------
// THE LADDER OF VOICES - the owner's ruling, docs/specs/round16-triage.md §3
// ---------------------------------------------------------------------------------------------
// «чем ниже ступень - тем меньше информации, это нам на руку. Но убирать совсем я бы всё-таки не
// стал - это добавляет живости происходящему.»
//
// So: THINNER, NEVER EMPTY. Four storeys, and the rule is MONOTONE - each gets strictly more than
// the one below, because that is what makes it read as a ladder to a player climbing it.
//
//   1  local / regional / national   people, weather, the ball-mark argument
//   2  J30 - J300                    + what the round is for, and who is in the chair
//   3  W15 - W125                    + the numbers start: her chance, what the round pays
//   4  WTA 250+ / majors             + the professional register: where the two of them stand
//
// ⚠ IT IS OUR LADDER, NOT A COPY OF WHAT EACH REAL EQUIVALENT PUBLISHES. The research found the real
// WTA product is the THINNEST of the six real sites - no winners, no unforced errors, no serve speed
// (live-text-adult-tour.md §1.1). Copying that would put a hole in the middle of our own ladder. The
// owner's ruling, 11.08: «он у нас посередине между J и высокой серией, поэтому и данных туда даём
// для трансляции посередине тоже». Real-world poverty at one rung is not a reason to break the climb.
//
// ⚠ MONOTONICITY IS STRUCTURAL, NOT A PROMISE. Every line below is produced by an entry in one
// ordered table with a `from` storey, and a preview is that table filtered. So a storey cannot
// accidentally lose a line its junior has, and `tests/viz/preview.test.ts` asserts the counts are
// strictly increasing rather than trusting the reading.
//
// ⚠ AND THE FACTS THAT ARE ONLY TRUE LOW DOWN ARE REPLACED, NOT DROPPED. Self-officiating is a fact
// about storey 1 and a lie about storey 4, so the officiating line is ONE entry whose text varies by
// storey - the count never falls, and nothing is asserted where it is false. This is the one place
// the junior/adult difference the research found becomes CONTENT rather than absence.
//
// ---------------------------------------------------------------------------------------------
// HONESTY, exactly as viz/commentary.ts is held to it
// ---------------------------------------------------------------------------------------------
// A line may assert nothing the game does not hold. Her chance is `fastMatchProbability`, the same
// closed form that resolves every AI-vs-AI match; the opponent's age is the frozen `MatchPlayer.age`
// the save keeps; the ranks arrive already measured in ONE table (the caller's job - see
// `PendingView.ladder`); the points are the tier's own table. Nothing here estimates, and nothing
// here draws.
//
// Player copy: English, short dash only (project rule). Tournament names are the tier's own labels,
// which are fictional by construction - no real event, tour body or venue is nameable from here.

import { fastMatchProbability } from '../engine/match/engine'
import { TIERS } from '../engine/season/calendar'
import { tierFromEventId } from '../engine/diary/facts'
import { stageLabel } from '../engine/world/labels'
import type { TierId } from '../engine/season/types'
import type { MatchPlayer, Side, Surface, Tour } from '../engine/match/types'

/** The four storeys of the ladder, low to high. */
export type Storey = 1 | 2 | 3 | 4

/**
 * ⭐ THE SAME LADDER AT THE RESOLUTION THE RUNNING COMMENTARY NEEDS - round 23 item 4.
 *
 * ⚠ WHY A SECOND NUMBER EXISTS AT ALL, AND WHY IT IS NOT A SECOND LADDER. `storeyOf` answers "how
 * much does the PRE-MATCH INTRO say", and four answers is exactly right for it: the intro's entries
 * are whole facts (the officials, her chance, where the two of them stand) and there is no fifth
 * fact a 500 holds that a 250 does not. But the RUNNING commentary's lever is not which facts exist,
 * it is how much of the match gets told - and there the top storey was one flat floor four rungs
 * wide. Measured over 120 seeded matches (tests/commentary-tier-detail.test.ts): a WTA 500 and a WTA
 * 250 narrated BYTE-IDENTICALLY, and so did a WTA 500 final and a Grand Slam final, because
 * `storeyOf` collapses them and `wta250.drawSize === wta500.drawSize` leaves the round label nothing
 * to say either. The owner has climbed from a 250 to a 500 and the log did not move.
 *
 * ⚠ SO `storeyOf` IS DERIVED FROM THIS, NOT PARALLEL TO IT. One switch decides where a tier sits and
 * the storey is a lookup on the answer, so the two can never disagree - the same discipline that
 * made viz/commentary.ts import `storeyOf` rather than restate it. Every storey is a contiguous run
 * of rungs, which is what makes the derivation total and the ladder still monotone.
 */
export type Rung = 1 | 2 | 3 | 4 | 5 | 6 | 7

/** Which rung a tier stands on, low to high. The three lower families are one rung each - the
 *  intro's own three storeys - and the professional top is spread over four, one per series, because
 *  that is the stretch of the ladder a player spends years climbing and the one she can see. */
export function rungOf(tier: TierId): Rung {
  switch (tier) {
    case 'local':
    case 'regional':
    case 'national':
      return 1
    case 'j30':
    case 'j60':
    case 'j300':
      return 2
    case 'w15':
    case 'w35':
    case 'w50':
    case 'w75':
    case 'w100':
    case 'wta125':
      return 3
    case 'wta500':
      return 5
    case 'wta1000':
      return 6
    case 'slam':
      return 7
    // wta250, and anything a later wave adds. ⚠ THE DEFAULT IS THE BOTTOM OF THE TOP STOREY, NOT THE
    // TOP OF IT: an unrecognised tier used to fall to `storeyOf`'s `default: 4`, and this keeps that
    // answer exactly (rung 4 maps to storey 4) rather than quietly promoting it to a Slam.
    default:
      return 4
  }
}

const STOREY_OF_RUNG: Record<Rung, Storey> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 4, 6: 4, 7: 4 }

/** Which storey a rung stands on. The three families are the game's own tracks plus the split at the
 *  top of the professional ladder, where the tour stops being a grind and starts being television. */
export function storeyOf(tier: TierId): Storey {
  return STOREY_OF_RUNG[rungOf(tier)]
}

export interface PreviewEvent {
  tier: TierId
  /** 'Final' | 'Semifinal' | 'Quarterfinal' | 'Round of N' - `stageLabel`'s own output. */
  roundLabel: string
}

/**
 * ⭐ THE OCCASION BEHIND A STORED MATCH - round 23 item 4, and it is a BUG FIX with a shape.
 *
 * ⚠ WHAT WAS WRONG. `MatchViewer.previewEvent` is optional and defaults to null, and null is a real
 * answer for two of its four callers (the friendly, the sandbox hit-out) - so a caller that simply
 * FORGOT to pass it is indistinguishable from one that meant it. Exactly one caller passed it:
 * `TournamentFlow`. `MatchReplay` - which is how every re-watch in the game opens, from the Season
 * bracket and from the Home feed alike - passed nothing, so a Grand Slam quarter-final watched a
 * second time narrated as storey 1: no stake, no room, no standing, the poorest log in the game, on
 * a match that had just been played at the top of the tour.
 *
 * ⚠ AND THE FIX IS NOT "REMEMBER TO PASS THE PROP". A stored `WorldMatch` already carries the two
 * fields the occasion is made of, so the honest answer is DERIVED rather than remembered, in one
 * place all four call sites read. Silence stops being ambiguous: a practice friendly's id does not
 * name a tier, this returns null for it, and that null is now a computed answer rather than an
 * omission somebody has to notice.
 *
 * ⚠ IT PARSES NOTHING ITSELF. `tierFromEventId` is the engine's own reader of its own id format
 * (`${year}-w${week}-${tier}`) and `stageLabel` is the engine's own namer of a round - two readers of
 * either would be exactly how a draw-size assumption gets in, which is the rule `remainingIn` below
 * is already written under.
 *
 * @param eventId the stored `WorldMatch.eventId`; `practice-w12` and any foreign id yield null
 * @param round the stored `MatchRecord.round`, 0 = first round
 */
export function occasionOf(eventId: string | undefined, round: number | undefined): PreviewEvent | null {
  const tier = tierFromEventId(eventId)
  if (tier === undefined || round === undefined || !Number.isFinite(round)) return null
  return { tier, roundLabel: stageLabel(round, TIERS[tier].drawSize) }
}

export interface PreviewInput {
  /** the two players AS COMPOSED for this match, so ages are the ones that played */
  a: MatchPlayer
  b: MatchPlayer
  /** which side is HER. The preview is written from the family's seat, not from neutral. */
  heroSide: Side
  surface: Surface
  tour: Tour
  /** both ranks in the SAME table, or null where a player holds no counting result in it */
  heroRank: number | null
  oppRank: number | null
  /** null when no tournament is behind this match - a friendly, or the sandbox hit-out */
  event: PreviewEvent | null
  /** the day's temperature in C, or null when the caller has none */
  temperatureC: number | null
}

export interface PreviewLine {
  /** stable across rebuilds, so a list render does not churn */
  key: string
  text: string
}

const SURFACE_WORD: Record<Surface, string> = { hard: 'Hard court', clay: 'Clay', grass: 'Grass' }

/** How the ball will behave, per surface - the compatibility rule from
 *  docs/research/commentary-lexicon.md §5.4, where `bite` is clay, `skid` is grass and `true bounce`
 *  is hard, and mixing them is the fastest way to sound like a machine.
 *
 *  ⚠ NONE OF THEM NAMES ITS SURFACE. The occasion line one row up has already said which court this
 *  is, and a block that says "Grass today: low and skidding through" is a generator repeating its
 *  own slot back at the reader. */
const SURFACE_NOTE: Record<Surface, string> = {
  hard: 'A true bounce all day, and no surprises off it.',
  clay: 'Slow and high, and the ball will bite.',
  grass: 'It will stay low and skid through, so the points will be short.',
}

/**
 * WHAT THE DAY IS LIKE TO PLAY IN (round 17 item 25, owner: "It's chilly here today", "it's hot,
 * everybody is sweating").
 *
 * ⚠ IT IS A CONDITIONS NOTE, NOT A SECOND TEMPERATURE. The occasion line above already prints the
 * figure, and a generator that says "21 degrees" and then "it is 21 degrees" is repeating its own
 * slot back at the reader (the same rule `SURFACE_NOTE` is written under). What this adds is the
 * only thing the number does not carry: what it DOES to the tennis. Every phrase comes from
 * docs/research/commentary-lexicon.md §5.5 - `the ball is not flying` and `numb hands` for cold,
 * `ice towels` and `sapping` for heat - and none of them asserts anything outside the reading.
 *
 * ⚠ THE BANDS ARE THE GENERATOR'S OWN RANGE, not a weather scale. `eventTemperature`
 * (engine/season/preview.ts) draws 12-26 on hard, 16-28 on clay and 19-29 on grass, so the five
 * bands below carve up exactly the temperatures this game can produce - `cold` really is its
 * bottom end and `hot` really is its top, rather than two branches nothing ever reaches.
 *
 * ⚠ AND IT IS RNG-FREE, like every other line in this file. It is a lookup on a number the day
 * already has.
 */
function conditionsNote(c: number): string {
  if (c <= 14) return 'Cold enough that the ball will not fly, and cold hands on the racket all afternoon.'
  if (c <= 18) return 'Cool, and it will take a while for either of them to feel the ball.'
  if (c <= 24) return 'A comfortable day for it, and no excuses in the air.'
  if (c <= 27) return 'Warm work out there, and the towel comes out between points.'
  return 'Hot, and everybody is sweating before the end of the first game.'
}

/** The number said the way a person says it, never as a decimal. Rounded at the template boundary,
 *  which is the shipped bug the research found in a real product (live-text-adult-tour.md §2.3). */
function pct(x: number): string {
  return `${Math.round(x * 100)}%`
}

/** How many players are left when a round of this size is played. 'Final' is two, and the rest come
 *  off `stageLabel`'s own vocabulary. Null when the label is not one this game produces.
 *
 *  ⚠ IT PARSES THE LABEL RATHER THAN COUNTING ROUNDS, WHICH IS WHY THE 14.08 DRAW CHANGE COST IT
 *  NOTHING. A Slam went 32 -> 128 and a WTA 1000 32 -> 64 that morning, so "Round of 128" and
 *  "Round of 64" are now labels this game really produces; the regex below already read them and
 *  every consumer's arithmetic is `log2`, not a five-round constant. Exported since round 21 item 3
 *  so viz/commentary.ts names the stakes off the SAME parse - two readers of `stageLabel`'s
 *  vocabulary is exactly how a draw-size assumption gets in. */
export function remainingIn(roundLabel: string): number | null {
  if (roundLabel === 'Final') return 2
  if (roundLabel === 'Semifinal') return 4
  if (roundLabel === 'Quarterfinal') return 8
  const m = /^Round of (\d+)$/.exec(roundLabel)
  return m ? Number(m[1]) : null
}

/** What she is playing INTO, as a whole clause rather than a noun.
 *
 *  ⚠ THE FINAL IS NOT "into" ANYTHING and that is why this returns the verb too. Slotting a noun
 *  into a fixed "is into ___" frame produced "Win it and Olivia is into the title", which is the
 *  classic template tell: one frame stretched over a case it does not fit. The last round is a
 *  different sentence, so it gets one. */
function stakeClause(roundLabel: string, who: string): string | null {
  const remaining = remainingIn(roundLabel)
  if (remaining === null || remaining < 2) return null
  if (remaining === 2) return `Win it and ${who} has the title`
  const stage =
    remaining === 4
      ? 'the final'
      : remaining === 8
        ? 'the semifinals'
        : remaining === 16
          ? 'the quarterfinals'
          : `the round of ${remaining / 2}`
  return `Win it and ${who} is into ${stage}`
}

/**
 * WHAT WINNING THIS MATCH IS WORTH, in this tier's own points.
 *
 * `TierDef.points` is indexed by FINISH, 0 = champion. Winning a round leaves `remaining / 2`
 * players, so the best finish it guarantees is `log2(remaining) - 1`: win the final and the index is
 * 0, win a semifinal and it is 1, and so on. Null when the round is not one this game labels, or
 * when the tier's table is shorter than the draw (it never is, but a preview may not invent a
 * number when it would be reading off the end of an array).
 */
function roundPoints(tier: TierId, roundLabel: string): number | null {
  const remaining = remainingIn(roundLabel)
  if (remaining === null || remaining < 2) return null
  const finish = Math.round(Math.log2(remaining)) - 1
  const points = TIERS[tier].points[finish]
  return points === undefined ? null : points
}

/** Her age, in whole years, when the save froze one. Fractional by design (`MatchPlayer.age`), and a
 *  preview says the BAND a person would say out loud. */
function years(p: MatchPlayer): number | null {
  return p.age === undefined ? null : Math.floor(p.age)
}

/** First name only, on the one condition viz/commentary.ts already established: every word in the
 *  name is capitalised, so a label like "Top seed" keeps its whole self. */
function firstName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length < 2) return name.trim()
  if (!words.every((w) => w[0] === w[0].toUpperCase() && w[0] !== w[0].toLowerCase())) return name.trim()
  return words[0]
}

/** One entry in the ordered table that IS the ladder. `from` is the lowest storey that says it. */
interface Entry {
  key: string
  from: Storey
  say: (ctx: Ctx) => string | null
}

interface Ctx {
  storey: Storey
  input: PreviewInput
  /** her, and the girl across the net */
  her: MatchPlayer
  opp: MatchPlayer
  oppName: string
  event: PreviewEvent | null
  chance: number
}

const ENTRIES: readonly Entry[] = [
  // ---- storey 1: the occasion, the girl, and the argument about the ball mark ----------------
  {
    key: 'occasion',
    from: 1,
    say: ({ event, input }) => {
      const where = event ? `${event.roundLabel} at the ${TIERS[event.tier].label}.` : 'A hit-out, nothing on it.'
      // ⚠ THE TEMPERATURE STAYS AT EVERY STOREY, and the first draft dropped it above the junior
      // rungs on the argument that the weather plate above the court already carries it. That breaks
      // the ladder: monotone means a storey never has LESS than the one below it, and "the top of the
      // ladder stops telling you what the day is like" is exactly the kind of quiet subtraction the
      // rule exists to forbid. The block is read as one piece and stands on its own.
      if (input.temperatureC === null) return `${where} ${SURFACE_WORD[input.surface]}.`
      return `${where} ${SURFACE_WORD[input.surface]}, ${Math.round(input.temperatureC)} degrees.`
    },
  },
  {
    // ⚠ ROUND 17 #25 SITS AT STOREY 1, WHICH IS WHERE A WEATHER NOTE HAS TO SIT. The owner asked for
    // it "opening the commentary", and the preview IS the opening of the log (it is the block at the
    // bottom, which the log reads last because the log reads newest-first). Putting it at storey 1
    // means the local Sunday-morning draw gets it too - the rung where the weather is most of what
    // there is to say - and the ladder stays monotone because a line every storey has cannot break
    // a rule about storeys having MORE than the one below.
    //
    // ⚠ AND IT IS NOT A PER-POINT BEAT, DELIBERATELY. viz/commentary.ts is a pure function of the
    // MATCH and the day's temperature is a fact about the DRAW, which the match does not carry - the
    // same split that keeps the whole preview out of that module. A weather line inside
    // `buildCommentary` would need an input the determinism pin exists to keep out.
    key: 'conditions',
    from: 1,
    say: ({ input }) => (input.temperatureC === null ? null : conditionsNote(Math.round(input.temperatureC))),
  },
  {
    key: 'opponent',
    from: 1,
    say: ({ storey, oppName, opp, input }) => {
      const age = years(opp)
      const bits: string[] = []
      if (age !== null) bits.push(`${age}`)
      // The rank arrives at storey 2 - below that there is no table anybody is looking at.
      if (storey >= 2 && input.oppRank !== null) bits.push(`ranked #${input.oppRank}`)
      const tail = bits.length > 0 ? `, ${bits.join(', ')}` : ''
      return `Across the net: ${oppName}${tail}.`
    },
  },
  {
    key: 'officials',
    from: 1,
    say: ({ storey, input, event }) => {
      if (storey === 1) {
        // No chair, no data, self-scored - and on clay the mark on the court is the whole argument.
        return input.surface === 'clay'
          ? 'Nobody in the chair. They call their own lines, and the mark on the court settles it.'
          : 'Nobody in the chair. They call their own lines, and a bad call is part of the day.'
      }
      if (storey === 2) {
        // The junior ladder puts a chair in the seat only at the sharp end, and which end depends on
        // the rung: the lower Junior Tour levels get one for the final, J300 from the semifinals.
        const late = event ? isLateRound(event) : false
        const fromWhere = event?.tier === 'j300' ? 'the semifinals' : 'the final'
        return late
          ? 'A chair umpire in the seat for this one, and a live score going out.'
          : `No chair umpire until ${fromWhere}. Today they call their own lines.`
      }
      if (storey === 3) return 'Chair umpire, and the match stats go on the record afterwards.'
      return 'Chair, review, and every point of it published as it happens.'
    },
  },
  // ---- storey 2: what the round is for ------------------------------------------------------
  {
    key: 'stake',
    from: 2,
    say: ({ storey, event, her }) => {
      if (!event) return null
      const clause = stakeClause(event.roundLabel, firstName(her.name))
      if (clause === null) return null
      if (storey === 2) return `${clause}.`
      const points = roundPoints(event.tier, event.roundLabel)
      // From storey 3 the same sentence carries the number, which is the whole of "the numbers start".
      return points === null || points === 0 ? `${clause}.` : `${clause} – and the round pays ${points} points.`
    },
  },
  // ---- storey 3: the numbers start ----------------------------------------------------------
  {
    key: 'chance',
    from: 3,
    say: ({ chance, her }) => `${firstName(her.name)} goes in with a ${pct(chance)} chance of winning it.`,
  },
  // ---- storey 4: the professional register --------------------------------------------------
  {
    key: 'standing',
    from: 4,
    say: ({ input, oppName, her }) => {
      const mine = input.heroRank
      const theirs = input.oppRank
      const who = firstName(her.name)
      if (mine === null && theirs === null) return `Neither ${who} nor ${oppName} has a ranking to defend here.`
      if (mine === null) return `${who} is unranked at this level; ${oppName} is #${theirs}.`
      if (theirs === null) return `${who} is #${mine}; ${oppName} arrives with no ranking at all.`
      const gap = Math.abs(mine - theirs)
      if (gap === 0) return `${who} and ${oppName} are level on the table at #${mine}.`
      const ahead = theirs < mine ? oppName : who
      return gap === 1
        ? `#${mine} against #${theirs}: one place between them, and it is ${ahead}'s.`
        : `#${mine} against #${theirs}, and ${ahead} is ${gap} places ahead.`
    },
  },
  {
    key: 'surface-note',
    from: 4,
    say: ({ input }) => SURFACE_NOTE[input.surface],
  },
]

/** The sharp end of a junior draw, where the regulations actually put somebody in the chair. */
function isLateRound(event: PreviewEvent): boolean {
  if (event.roundLabel === 'Final') return true
  return event.tier === 'j300' && event.roundLabel === 'Semifinal'
}

/**
 * The preview, top to bottom in reading order.
 *
 * ⚠ NEVER EMPTY, which is the owner's own ruling and the reason there is no `event` guard at the
 * top of this function. A friendly with no tournament behind it still has two people, a surface and
 * a day, and the storey-1 entries all survive a null event - so the sandbox hit-out gets the
 * thinnest possible intro rather than a blank.
 */
export function buildPreview(input: PreviewInput): PreviewLine[] {
  const storey: Storey = input.event ? storeyOf(input.event.tier) : 1
  const her = input.heroSide === 0 ? input.a : input.b
  const opp = input.heroSide === 0 ? input.b : input.a
  // Her chance, from the closed form that resolves every AI-vs-AI match. Seed is irrelevant to it
  // (`fastMatchProbability` plays no points) and is passed empty for exactly that reason.
  const pOfA = fastMatchProbability(input.a, input.b, { surface: input.surface, tour: input.tour, seed: '' })
  const ctx: Ctx = {
    storey,
    input,
    her,
    opp,
    oppName: firstName(opp.name),
    event: input.event,
    chance: input.heroSide === 0 ? pOfA : 1 - pOfA,
  }
  const out: PreviewLine[] = []
  for (const entry of ENTRIES) {
    if (entry.from > storey) continue
    const text = entry.say(ctx)
    if (text) out.push({ key: entry.key, text })
  }
  return out
}

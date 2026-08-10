// THE RUNNING COMMENTARY (owner's ruling, docs/specs/ui-inventory.md §4 Q2: screen I is
// "our live match ... plus a canonical running text commentary of the key moments, which we do
// not have at all today"; §3 states the gap flatly - "the match engine produces the points;
// nothing turns them into readable beats").
//
// This module IS that missing piece, and nothing else: a pure function from an AnnotatedMatch to
// an ordered list of BEATS - the handful of moments a person would actually tell you about after
// the match. It decides nothing about the match and draws nothing from any RNG stream (see THE
// DETERMINISM RULE below). MatchViewer renders it; the engine never sees it.
//
// ---------------------------------------------------------------------------------------------
// WHAT COUNTS AS A KEY MOMENT - the whole design, and the reason it is SHORT
// ---------------------------------------------------------------------------------------------
// A three-set match is ~200 points. A line every third point is a wall of text nobody reads, so
// the question is not "what can we detect" but "what would someone SAY". Eight kinds, and every
// one of them is something a parent in the stands would repeat in the car:
//
//   open      one line, the anchor at the bottom of the log: who serves first.
//   break     A BREAK OF SERVE. The event of a tennis match - the only thing that moves a set.
//   hold      a hold that MEANT something: two or more break points saved, or serving to stay in
//             the set/match. One break point saved is a Tuesday; two is a story.
//   tiebreak  six games all. The set stops being a set and becomes a coin toss you can watch.
//   streak    six or more points in a row. The owner's own example, and it is the one beat that
//             is invisible in a scoreline - "she won six straight" never shows up as 6-4.
//   rally     one exchange so long it is its own memory. Twelve shots plus, ending in a winner.
//   set       a set decided (except the last - the match beat says it better).
//   match     the final point, with the scoreline and how it ended.
//
// AND WHAT IS DELIBERATELY NOT HERE. Aces, double faults, winners and errors are NOT beats. They
// are far too common to be moments (a match has 4-12 aces and dozens of misses) - so instead they
// arrive as the MANNER of a beat that already earned its row: "Bianca breaks. Dana sends it long."
// One row, two facts, and the ace only gets told when it decided something. That single decision
// is most of why this reads as commentary rather than as a stat feed.
//
// VOLUME CAPS, because "detectable" is not "worth telling":
//   * ONE beat per point (see PRIORITY): a set won on a break is ONE row that says both.
//   * at most ONE streak and ONE rally per set - the longest, so a set's best moment is the one
//     that gets told and the second-best stays quiet.
//   * silence is allowed. A dull set with no break, no streak and no long rally says nothing but
//     its set beat, and that is correct: the quiet sets are what make the loud ones land.
// Measured over 200 real simulated matches this lands at ~4-6 beats per set (see
// tests/viz/commentary.test.ts, which FAILS if the density drifts back toward a point log).
//
// ---------------------------------------------------------------------------------------------
// THE KEY CUT - what 'key' shows that 'full' does not (owner, 06.08)
// ---------------------------------------------------------------------------------------------
// «Сам матч идёт быстрее и показывает ключевые моменты, но в тексте трансляции вообще ничего не
// меняется, надо это синхронизировать ... может быть мы можем как-то всё-таки full/key моменты
// сделать больше отличий.»
//
// ⚠ THE SWITCH USED TO REACH THE TIMELINE AND NOTHING ELSE. `buildTimeline(match, mode)` drops the
// points 'key' does not show; the log was built once per MATCH and revealed off `displayedPointIndex`,
// so both modes always printed the same rows in the same order - the only difference being that 'key'
// revealed them in bursts, several points behind the ball. Every beat now decides for itself whether
// it is in the key cut, and the viewer picks a list. `full` is unchanged.
//
// WHAT DECIDES IT, and it is NOT a second opinion about tennis. Two tests, in this order:
//
//   1. STRUCTURE. `open`, `set`, `tiebreak` and `match` are always in. They are the anchor, the two
//      ways a set changes hands, and the ending - a highlights package without them is a list of
//      incidents with no shape. Four rows, at most, in a whole match.
//
//   2. THE MATCH MOVED. Everything else (break, hold, streak, rally) is in only when the ENGINE's
//      own live win probability - `AnnotatedPoint.winProbA`, from match/liveProb.ts, the same number
//      the momentum curve is drawn from - moved by at least KEY_SWING across the span the beat
//      describes: the whole GAME for a break or a hold, the whole RUN for a streak, the point itself
//      for a rally. That is the difference between "she broke at 2-0" and "she broke back serving to
//      stay in the set", and the probability model already knows which is which. Nothing here counts
//      games or reads the score to guess at drama.
//
// ⚠ THE SPAN IS THE POINT OF (2). A per-POINT swing would have thrown every streak away: six points
// in a row move the match a long way, and no single one of them moves it much. Measured on the corpus
// below, a per-point test kept 0 of 41 streak beats; the run's own span keeps the ones that turned a
// set and drops the ones that only tidied up a game already won.
//
// KEY_SWING IS MEASURED, NOT CHOSEN. See the constant.
//
// ---------------------------------------------------------------------------------------------
// THE DETERMINISM RULE
// ---------------------------------------------------------------------------------------------
// The same match must narrate identically, every replay, forever. This module therefore draws
// ZERO random numbers - not from the MAIN stream, and not from a purpose-scoped sub-stream
// either. Phrase variety (which the repeated beats, break and hold, genuinely need) comes from
// `variant()`: an integer hash of the point index, which is a pure function of the match data. So
// there is no stream to keep off, no seed to thread, and nothing that can move the frozen MAIN
// capture (41550 draws / hash e6b0c709) even in principle.
//
// VOICE - matched to the coach's read on Home (HomeScreen COACH_QUOTES) and the family diary
// (engine/diary.ts): short, plain, present tense, concrete. And the diary's honesty pin applies
// here too - a beat may assert NOTHING the point log does not carry. There is no crowd in the
// data, no nerves, no momentum-as-feeling; there is who won, who served, how the ball ended and
// what the score became. Everything below is derived from exactly those.
// Player copy: English, short dash only (project rule) - and this file needs no dash at all.

import type { AnnotatedMatch, AnnotatedPoint } from './types'
import { COURT } from './types'
import type { Side } from '../engine/match/types'

export type BeatKind = 'open' | 'break' | 'hold' | 'tiebreak' | 'streak' | 'rally' | 'set' | 'match'

export interface Beat {
  /** index into match.points - the point this beat is anchored to (drives progressive reveal) */
  pointIndex: number
  kind: BeatKind
  /** the short scannable tag, rendered accent/800 at the head of the row ("Break!"); null on `open` */
  lead: string | null
  /** the sentence(s) after the lead */
  text: string
  /** right column: games in this beat's set (A-B), or the full scoreline on the match beat */
  score: string
  /** 1-based set the beat belongs to - the log's left rail label */
  set: number
  /** ⚠ IS THIS BEAT IN THE 'key' CUT? See THE KEY CUT below. Pure function of the match like every
   *  other field here - a beat's own answer, decided once, so the viewer switches lists rather than
   *  re-deciding editorial policy on every mode click. */
  keyMoment: boolean
}

/** ⚠ THE ROW'S BUDGET, AND THE BUILDER NOW KEEPS IT RATHER THAN HAPPENING TO.
 *
 *  `tests/viz/commentary.test.ts` has always asserted "nothing may run away with the row: two or
 *  three short sentences, never a paragraph" at 120 characters. Nothing in here enforced it - the
 *  beats concatenated their clauses and the assertion held because no scoreline in the corpus had yet
 *  produced the worst case. One did, the moment the v25 rally term changed which points the corpus's
 *  matches turn on: "Bianca breaks from love-forty down. She serves for the set next. Eight shots, and
 *  it ends with a winner through the middle." - 123 characters, three true sentences, and a row that
 *  wraps to four lines on a 390px frame.
 *
 *  That was a latent hole rather than a consequence of the new attribute: ANY change to a match
 *  outcome anywhere could have found it, and the next one would have. So the rule now lives beside
 *  the copy instead of only in the test that checks it. */
const BEAT_MAX_CHARS = 120

/** Join a beat's clauses in order, keeping each only while the row can still hold it.
 *
 *  THE FIRST CLAUSE IS NEVER DROPPED - it is the beat's actual claim ("she breaks from love-forty
 *  down"), and a beat that cannot say what happened has no reason to exist. What gets dropped is the
 *  tail, and the beats are all written with the same ordering discipline for exactly that reason:
 *  the CLAIM first, then what the score means next, and the rally's COLOUR last. Colour is what a
 *  human editor would cut too. */
function clauses(...parts: (string | null | undefined)[]): string {
  const kept: string[] = []
  for (const part of parts) {
    const p = part?.trim()
    if (!p) continue
    const next = kept.length === 0 ? p : `${kept.join(' ')} ${p}`
    if (kept.length > 0 && next.length > BEAT_MAX_CHARS) continue
    kept.push(p)
  }
  return kept.join(' ')
}

/** Six in a row is where a run stops being noise and becomes the thing you remember. */
const STREAK_MIN = 6
/** Twelve shots: the top rally bucket is 13-18 shots at 5% of points, and grass takes one off. */
const RALLY_MIN = 12
/** Two break points saved is a story; one is a Tuesday. */
const SAVES_MIN = 2

/**
 * ⚠ HOW FAR THE MATCH HAS TO MOVE FOR A NON-STRUCTURAL BEAT TO MAKE THE KEY CUT - in units of side
 * A's match-win probability, the engine's own `winProbA`.
 *
 * MEASURED (tools sweep, 209 matches: 200 seeded builds across the three surfaces plus the nine real
 * matches stored in the owner's W255 save, three of them WTA 250s). `full` is 15.5 beats a match
 * throughout - the cut only ever decides what `key` keeps:
 *
 *   KEY_SWING   key/match   key as % of full   matches left with < 4 rows
 *     0.05        12.8            83%                    0%
 *     0.08        10.6            69%                    2%
 *     0.10         8.9            58%                    4%
 *     0.12         7.6            49%                   10%
 *     0.15         6.3            41%                   17%
 *     0.20         4.9            32%                   32%
 *
 * 0.10 is the pick, and it is the last two columns read together. The cut has to be big enough that
 * the two modes are visibly different rather than subtly different (58% - the log roughly halves),
 * and small enough that a match is not reduced to its own scaffolding. Four rows is that floor: the
 * three structural beats of a straight-sets match (open, one set, match) plus one thing that
 * happened. At 0.12 one match in ten falls through it and at 0.20 one in three does, which is not a
 * highlights package, it is a scoreline with a caption.
 *
 * WHAT IT KEEPS AT 0.10, by kind: 50% of breaks, 84% of streaks, 26% of holds, 2% of rallies. That
 * ordering is the finding rather than a target. A break moves the match by construction; a run of
 * six points nearly always does; a hold restores the position it started from, so only the ones that
 * came back from somewhere survive; and a long rally is one point - it is colour, and colour already
 * rides on the beats it belongs to as their manner clause.
 */
const KEY_SWING = 0.1

// One beat per point. When two candidates land on the same point the bigger one wins and SAYS the
// smaller one - a set won on a break is a set beat that mentions the break, not two rows.
const PRIORITY: Record<BeatKind, number> = {
  // `open` outranks everything, and only ever competes for point 0: it is the anchor at the
  // bottom of the log, and a 16-shot rally on the very first point was silently eating it in
  // ~2% of matches (measured) before this line existed. `match` can never collide with it -
  // no match is one point long.
  open: -1,
  match: 0,
  set: 1,
  tiebreak: 2,
  break: 3,
  hold: 3,
  streak: 4,
  rally: 5,
}

const ORDINAL = ['first', 'second', 'third', 'fourth', 'fifth'] as const
// Up to twenty because that is the ceiling of everything this file counts out loud: the longest
// rally the generator can produce is 18 shots + clay + the parity fix-up, and a streak past twenty
// is a scoreline, not a sentence. Beyond it, digits.
const NUMBER_WORD = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
  'nineteen', 'twenty',
] as const

function ordinal(n: number): string {
  return ORDINAL[n - 1] ?? `${n}th`
}

function numberWord(n: number): string {
  return NUMBER_WORD[n] ?? String(n)
}

/** The same word, opening a sentence. */
function Num(n: number): string {
  const w = numberWord(n)
  return w.charAt(0).toUpperCase() + w.slice(1)
}

/** "a set point" / "two set points" - a counted thing said the way a person says it. */
function nPoints(n: number, kind: string): string {
  return n === 1 ? `a ${kind}` : `${numberWord(n)} ${kind}s`
}

/** The three ways of saying a break that had no story of its own in the score. Three, because a
 *  match has 4-8 breaks and two framings put the same sentence back to back too often. */
const BREAK_LINES: readonly ((who: string) => string)[] = [
  (who) => `${who} breaks.`,
  (who) => `The break goes to ${who}.`,
  (who) => `${who} breaks serve.`,
]

/** A break that pulls the set back level. In a break-heavy set this fires four or five times, so
 *  it gets its own pair rather than saying the identical sentence down the whole log. */
const LEVEL_LINES: readonly ((who: string) => string)[] = [
  (who) => `${who} breaks back. Level again.`,
  (who) => `${who} breaks back, and the set is level.`,
]

/** Deterministic phrase variety with no RNG: an integer hash of the point index, folded to `n`.
 *  Knuth's multiplicative constant, so consecutive indices do not land on consecutive variants
 *  (a plain `index % n` correlates with the alternating serve and reads as a pattern). */
function variant(pointIndex: number, n: number): number {
  return (Math.imul(pointIndex + 1, 2654435761) >>> 0) % n
}

// --- names --------------------------------------------------------------------------------------
// Commentary uses FIRST names ("Bianca breaks") the way the design's own log copy does, because a
// running commentary is spoken about people, not about table rows. Two things send a name back to
// its full form, and both were found by reading real output:
//
//   * IT IS NOT A PERSON'S NAME. The Season screen's exhibition opponent is literally called
//     "Top seed", and taking its first word produced "Top sends it long." A name is treated as
//     "First Last" only when every word in it is capitalised, which every generated junior and
//     every kid name is, and "Top seed" is not.
//   * BOTH GIRLS SHARE A FIRST NAME. Then neither may use it - it is better for the whole match to
//     read formally than for two rows to be ambiguous about who did what.
function speakingNames(a: string, b: string): [string, string] {
  const personal = (n: string): string | null => {
    const words = n.trim().split(/\s+/).filter(Boolean)
    if (words.length < 2) return null
    if (!words.every((w) => w[0] === w[0].toUpperCase() && w[0] !== w[0].toLowerCase())) return null
    return words[0]
  }
  const fa = personal(a)
  const fb = personal(b)
  // The collision rule is symmetric (both go formal); the not-a-person rule is not - a real girl
  // opposite "Top seed" keeps her first name.
  if (fa && fb && fa.toLowerCase() === fb.toLowerCase()) return [a.trim(), b.trim()]
  return [fa ?? a.trim(), fb ?? b.trim()]
}

// --- the scan -----------------------------------------------------------------------------------

interface GameSpan {
  /** 0-based set index */
  set: number
  /** index of the point that ended the game */
  last: number
  server: Side
  winner: Side
  tiebreak: boolean
  /** break points the SERVER faced in this game (a tiebreak never carries any) */
  bpFaced: number
  /** per side: points in this game where LOSING the point would have lost them the set */
  spFaced: [number, number]
  /** per side: points in this game where losing the point would have lost them the MATCH */
  mpFaced: [number, number]
  /** per side: this side stood at love-forty in this game (0 points to the other's 3) */
  loveForty: [boolean, boolean]
  gamesBefore: [number, number]
  gamesAfter: [number, number]
  setsBefore: [number, number]
  setEnd: boolean
}

interface Scan {
  games: GameSpan[]
  /** per point: games standing in its set AFTER the point, as "A-B" */
  gamesAt: string[]
  /** per point: 0-based set index */
  setOf: number[]
}

function scan(points: readonly AnnotatedPoint[]): Scan {
  const out: Scan = { games: [], gamesAt: [], setOf: [] }
  const games: [number, number] = [0, 0]
  const sets: [number, number] = [0, 0]
  let setIdx = 0
  let bpFaced = 0
  const spFaced: [number, number] = [0, 0]
  const mpFaced: [number, number] = [0, 0]
  const loveForty: [boolean, boolean] = [false, false]
  const gamePts: [number, number] = [0, 0]
  let tiebreak = false

  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    out.setOf.push(setIdx)
    if (p.entry.breakPoint) bpFaced++
    // setPointFor/matchPointFor name who WINS by taking the point, so the other side is the one
    // one point from losing the set/match - which is the side whose survival is the story.
    if (p.entry.setPointFor !== null) spFaced[p.entry.setPointFor === 0 ? 1 : 0]++
    if (p.entry.matchPointFor !== null) mpFaced[p.entry.matchPointFor === 0 ? 1 : 0]++
    if (p.entry.tiebreak) tiebreak = true
    // Love-forty, tracked on the raw counters (a tiebreak's 0-3 is not love-forty, so it is
    // excluded). The side sitting on zero is the one with a story if it wins the game from here.
    gamePts[p.entry.winner]++
    if (!p.entry.tiebreak) {
      if (gamePts[0] === 0 && gamePts[1] === 3) loveForty[0] = true
      if (gamePts[1] === 0 && gamePts[0] === 3) loveForty[1] = true
    }
    if (p.gameEnd) {
      const w = p.entry.winner
      const gamesBefore: [number, number] = [games[0], games[1]]
      games[w]++
      out.games.push({
        set: setIdx,
        last: i,
        server: p.entry.server,
        winner: w,
        tiebreak,
        bpFaced,
        spFaced: [spFaced[0], spFaced[1]],
        mpFaced: [mpFaced[0], mpFaced[1]],
        loveForty: [loveForty[0], loveForty[1]],
        gamesBefore,
        gamesAfter: [games[0], games[1]],
        setsBefore: [sets[0], sets[1]],
        setEnd: p.setEnd,
      })
      out.gamesAt.push(`${games[0]}-${games[1]}`)
      bpFaced = 0
      spFaced[0] = 0
      spFaced[1] = 0
      mpFaced[0] = 0
      mpFaced[1] = 0
      loveForty[0] = false
      loveForty[1] = false
      gamePts[0] = 0
      gamePts[1] = 0
      tiebreak = false
      if (p.setEnd) {
        sets[w]++
        games[0] = 0
        games[1] = 0
        setIdx++
      }
    } else {
      out.gamesAt.push(`${games[0]}-${games[1]}`)
    }
  }
  return out
}

// --- manner: HOW a point ended --------------------------------------------------------------
// Read straight off the rally the viz layer already generates (engine/match/rally.ts), which is
// itself deterministic from the match seed. Never a beat of its own - always an adjective on one.

type Manner =
  | { kind: 'ace'; by: Side; direction: string }
  | { kind: 'df'; by: Side }
  | { kind: 'winner'; by: Side; shots: number; direction: string }
  | { kind: 'error'; by: Side; how: 'net' | 'long' | 'wide'; shots: number }

function mannerOf(p: AnnotatedPoint): Manner | null {
  const shots = p.rally.shots
  const last = shots[shots.length - 1]
  if (!last) return null
  if (p.rally.ace) return { kind: 'ace', by: p.entry.server, direction: String(last.direction) }
  if (p.rally.doubleFault) return { kind: 'df', by: p.entry.server }
  if (last.result === 'winner') {
    return { kind: 'winner', by: last.by, shots: shots.length, direction: String(last.direction) }
  }
  const how: 'net' | 'long' | 'wide' =
    last.result === 'net' ? 'net' : Math.abs(last.bounce.y) > COURT.halfLength ? 'long' : 'wide'
  return { kind: 'error', by: last.by, how, shots: shots.length }
}

/** Serve placement, in words. The design's own log copy is "Ace! Clean serve down the T." */
function servePhrase(direction: string): string {
  if (direction === 'T') return 'down the T'
  if (direction === 'wide') return 'out wide'
  return 'into the body'
}

/** Rally-shot placement, in words. */
function rallyPhrase(direction: string): string {
  if (direction === 'line') return 'down the line'
  if (direction === 'middle') return 'through the middle'
  return 'cross-court'
}

function missPhrase(how: 'net' | 'long' | 'wide'): string {
  if (how === 'net') return 'nets it'
  if (how === 'long') return 'sends it long'
  return 'sends it wide'
}

/** One short sentence saying how the deciding point ended, or '' when it adds nothing.
 *
 *  `hero` is the beat's protagonist (who broke / held / won the set). When the deciding shot is
 *  THEIRS the sentence drops the name: "Bianca breaks. Fourteen shots, and it ends with a winner
 *  down the line." - a second "Bianca" in a two-sentence row reads like a robot. When the shot is
 *  the other player's the name is essential, because that is the whole point of the clause. */
function mannerLine(m: Manner | null, names: [string, string], hero: Side | null, closing: boolean): string {
  if (!m) return ''
  const who = names[m.by]
  switch (m.kind) {
    case 'ace':
      return closing ? `An ace ${servePhrase(m.direction)} to finish.` : `An ace ${servePhrase(m.direction)} to seal it.`
    case 'df':
      return 'It ends on a double fault.'
    case 'winner': {
      const dir = rallyPhrase(m.direction)
      if (m.by === hero) {
        return m.shots >= 8
          ? `${Num(m.shots)} shots, and it ends with a winner ${dir}.`
          : `A winner ${dir} to end it.`
      }
      return m.shots >= 8
        ? `${Num(m.shots)} shots, and ${who} ends it ${dir}.`
        : `${who} ends it with a winner ${dir}.`
    }
    case 'error':
      return m.shots >= 8
        ? `A long exchange, and ${who} ${missPhrase(m.how)}.`
        : `${who} ${missPhrase(m.how)}.`
  }
}

// --- streak scan ----------------------------------------------------------------------------

interface Run {
  side: Side
  len: number
  /** index of the run's last point */
  end: number
}

/** Every maximal run of consecutive points won by the same side. */
function runs(points: readonly AnnotatedPoint[]): Run[] {
  const out: Run[] = []
  let side: Side = points[0].entry.winner
  let len = 0
  for (let i = 0; i < points.length; i++) {
    const w = points[i].entry.winner
    if (w === side) len++
    else {
      out.push({ side, len, end: i - 1 })
      side = w
      len = 1
    }
  }
  out.push({ side, len, end: points.length - 1 })
  return out
}

// --- the build ----------------------------------------------------------------------------------

interface Candidate extends Beat {
  priority: number
}

export function buildCommentary(match: AnnotatedMatch, playerA: string, playerB: string): Beat[] {
  const points = match.points
  if (points.length === 0) return []
  const names = speakingNames(playerA, playerB)
  const s = scan(points)
  const lastIndex = points.length - 1
  const cands: Candidate[] = []

  /**
   * How far the match TRAVELLED across (from, to], read off the engine's own live win probability:
   * the furthest any point in the span got from where the span started. `from` is the last point
   * BEFORE the thing being measured, so what comes back is what the thing itself did.
   *
   * ⚠ TRAVELLED, NOT MOVED, AND THE DIFFERENCE IS THE HOLDS. Net displacement (`|end - start|`) is
   * the obvious reading and it is blind to exactly the game a person retells: serving at love-forty
   * and holding ENDS where it started, so its net swing is ~0 and the measure threw every one of
   * them away (measured: 29 of 294 hold beats survived at 0.10, against 76 once the span is read as
   * an excursion). A break is unaffected - its furthest point is its last one.
   *
   * The very first game of a match has no point before it, so it is measured from point 0 and reads
   * a shade low. That is the one span in the file that understates itself, and the first game of a
   * match is the last place a highlights package needs the benefit of the doubt.
   */
  const swing = (from: number, to: number): number => {
    const start = Math.max(0, from)
    const base = points[start]?.winProbA ?? 0
    let most = 0
    for (let i = start + 1; i <= to; i++) most = Math.max(most, Math.abs((points[i]?.winProbA ?? base) - base))
    return most
  }

  // `keyMoment` defaults to TRUE because the four structural beats (open/set/tiebreak/match) are the
  // ones that omit it - see THE KEY CUT. Everything else passes its own measured answer.
  const push = (
    pointIndex: number,
    kind: BeatKind,
    lead: string | null,
    text: string,
    score?: string,
    keyMoment = true,
  ): void => {
    cands.push({
      pointIndex,
      kind,
      lead,
      text,
      score: score ?? s.gamesAt[pointIndex] ?? '0-0',
      set: (s.setOf[pointIndex] ?? 0) + 1,
      keyMoment,
      priority: PRIORITY[kind],
    })
  }

  // --- open ---------------------------------------------------------------------------------
  push(0, 'open', null, `${names[points[0].entry.server]} serves first.`, '0-0')

  // --- match --------------------------------------------------------------------------------
  const winner = match.result.winner
  const scoreline = match.result.sets.map((set) => `${set.a}-${set.b}`).join('  ')
  // ⚠ A RETIREMENT ENDS A MATCH WITHOUT ENDING A SET, and every line below assumed those were the
  // same thing. "Takes it in straight sets" is false of a match that stopped at 4-6 6-4 4-2, and so
  // is the MANNER line, which is passed `setEnd: true` and would describe the last point as though
  // it had won something. Both are replaced rather than patched: the beat's job is to say how the
  // match ended, and how this one ended is that somebody could not go on.
  //
  // The beat still sits on `lastIndex` and still carries the real scoreline, so the honesty
  // properties every other beat is held to are unchanged – it is the SET-END property alone that a
  // retirement does not have, and it never claimed to be one.
  const retired = match.result.retired
  push(
    lastIndex,
    'match',
    retired ? 'Retired.' : 'Match.',
    retired
      ? `${names[retired.side]} cannot continue. ${names[winner]} goes through.`
      : clauses(
          match.result.sets.length === 3
            ? `${names[winner]} takes it in three.`
            : `${names[winner]} takes it in straight sets.`,
          mannerLine(mannerOf(points[lastIndex]), names, winner, true),
        ),
    scoreline,
  )

  // --- per game: break / hold / tiebreak / set ----------------------------------------------
  // `prevGameLast` is the last point of the PREVIOUS game, i.e. the point immediately before this
  // game began - the `from` end of a game's swing (see `swing`). 0 for the first game of the match.
  let prevGameLast = 0
  for (const g of s.games) {
    const p = points[g.last]
    const w = g.winner
    const loser: Side = w === 0 ? 1 : 0
    const manner = mannerLine(mannerOf(p), names, w, g.setEnd)
    // Read before the `continue`s below, so every branch of this loop leaves it correct.
    const gameMoved = swing(prevGameLast, g.last) >= KEY_SWING
    prevGameLast = g.last

    if (g.setEnd) {
      // The LAST set is told by the match beat, which says it better (and outranks this anyway).
      const how = g.tiebreak
        ? `${names[w]} takes the ${ordinal(g.set + 1)} set in a tiebreak.`
        : w !== g.server
          ? `${names[w]} breaks to take the ${ordinal(g.set + 1)} set.`
          : `${names[w]} serves out the ${ordinal(g.set + 1)} set.`
      // A non-final second set can only ever have been won by whoever lost the first, so it is
      // always the leveller. The first set needs no standing - it IS the standing.
      const standing = g.set === 0 ? '' : ' One set each.'
      push(g.last, 'set', 'Set.', clauses(`${how}${standing}`, manner), `${g.gamesAfter[0]}-${g.gamesAfter[1]}`)
      continue
    }

    // A tiebreak always ends its set, so anything still here is a normal game.
    if (g.tiebreak) continue

    if (g.gamesAfter[0] === 6 && g.gamesAfter[1] === 6) {
      const got =
        w !== g.server
          ? `${names[w]} breaks back for six games all.`
          : `${names[w]} holds for six games all.`
      push(g.last, 'tiebreak', 'Tiebreak.', `${got} A breaker decides the set.`, '6-6')
      continue
    }

    if (w !== g.server) {
      // BREAK OF SERVE. Three framings, and the first two are earned by the score rather than
      // chosen: breaking a player who was serving for the set (so the breaker had been facing
      // set/match points) is a different event from breaking at 2-1, and it says so.
      const level = g.gamesBefore[w] < g.gamesBefore[loser] && g.gamesAfter[w] === g.gamesAfter[loser]
      const base = g.mpFaced[w]
        ? `${names[w]} breaks back from match point down.`
        : g.spFaced[w]
          ? `${names[w]} breaks back from set point down.`
          : g.loveForty[w]
            ? `${names[w]} breaks from love-forty down.`
            : level
              ? LEVEL_LINES[variant(g.last, LEVEL_LINES.length)](names[w])
              : BREAK_LINES[variant(g.last, BREAK_LINES.length)](names[w])
      // "She" is safe here and only here: the sentence it follows names her and names nobody
      // else, and the tour is women's (JUNIOR_TOUR = 'wta'; the cohort's given-name pool is
      // female). Naming her twice in two short sentences reads like a machine.
      const tail = g.gamesAfter[w] === 5 && g.gamesAfter[loser] <= 4 ? ' She serves for the set next.' : ''
      push(g.last, 'break', 'Break!', clauses(`${base}${tail}`, manner), undefined, gameMoved)
      continue
    }

    // A HOLD, told only when it meant something. Three licences, biggest first - and note that
    // "serving to stay in the set" is NOT one of them: it fires 2-3 times in any set that reaches
    // 5-4, which turned the log into a drum. Facing an actual set or match point and surviving it
    // is the same drama, one third as often, and it is the thing a person actually retells.
    const base = g.mpFaced[w]
      ? `${names[w]} saves ${nPoints(g.mpFaced[w], 'match point')}.`
      : g.spFaced[w]
        ? `${names[w]} saves ${nPoints(g.spFaced[w], 'set point')} and holds.`
        : // Love-forty down and held = exactly three break points and five straight points; a
          // longer deuce war saved MORE than three, and then the count is the better line.
          g.loveForty[w] && g.bpFaced === 3
          ? `${names[w]} holds from love-forty down.`
          : g.bpFaced >= SAVES_MIN
            ? `${names[w]} saves ${nPoints(g.bpFaced, 'break point')} and holds.`
            : ''
    if (!base) continue
    push(g.last, 'hold', 'Held.', clauses(base, manner), undefined, gameMoved)
  }

  // --- streaks: the longest run of >= STREAK_MIN points in each set, at the point it ended ----
  {
    const best = new Map<number, Run>()
    for (const r of runs(points)) {
      if (r.len < STREAK_MIN) continue
      const setIdx = s.setOf[r.end] ?? 0
      const cur = best.get(setIdx)
      if (!cur || r.len > cur.len) best.set(setIdx, r)
    }
    for (const r of best.values()) {
      // THE RUN's own span, not the point it ended on - see THE KEY CUT for the measurement that
      // sent this back: six points in a row move the match a long way and no one of them much.
      push(
        r.end,
        'streak',
        'Streak.',
        `${Num(r.len)} points in a row for ${names[r.side]}.`,
        undefined,
        swing(r.end - r.len, r.end) >= KEY_SWING,
      )
    }
  }

  // --- rallies: the longest >= RALLY_MIN shot rally ending in a winner, one per set ----------
  {
    const best = new Map<number, { shots: number; index: number }>()
    for (let i = 0; i < points.length; i++) {
      const shots = points[i].rally.shots
      const last = shots[shots.length - 1]
      if (shots.length < RALLY_MIN || last?.result !== 'winner') continue
      const setIdx = s.setOf[i] ?? 0
      const cur = best.get(setIdx)
      if (!cur || shots.length > cur.shots) best.set(setIdx, { shots: shots.length, index: i })
    }
    for (const r of best.values()) {
      const shots = points[r.index].rally.shots
      const last = shots[shots.length - 1]
      push(
        r.index,
        'rally',
        'Rally.',
        `${Num(r.shots)} shots, and ${names[last.by]} puts it away ${rallyPhrase(String(last.direction))}.`,
        undefined,
        swing(r.index - 1, r.index) >= KEY_SWING,
      )
    }
  }

  // --- resolve: one beat per point, biggest wins; then chronological -------------------------
  const byPoint = new Map<number, Candidate>()
  for (const c of cands) {
    const cur = byPoint.get(c.pointIndex)
    if (!cur || c.priority < cur.priority) byPoint.set(c.pointIndex, c)
  }
  return [...byPoint.values()]
    .sort((x, y) => x.pointIndex - y.pointIndex)
    .map(({ priority: _priority, ...beat }) => beat)
}

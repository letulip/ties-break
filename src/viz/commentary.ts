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
}

/** Six in a row is where a run stops being noise and becomes the thing you remember. */
const STREAK_MIN = 6
/** Twelve shots: the top rally bucket is 13-18 shots at 5% of points, and grass takes one off. */
const RALLY_MIN = 12
/** Two break points saved is a story; one is a Tuesday. */
const SAVES_MIN = 2

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

  const push = (pointIndex: number, kind: BeatKind, lead: string | null, text: string, score?: string): void => {
    cands.push({
      pointIndex,
      kind,
      lead,
      text,
      score: score ?? s.gamesAt[pointIndex] ?? '0-0',
      set: (s.setOf[pointIndex] ?? 0) + 1,
      priority: PRIORITY[kind],
    })
  }

  // --- open ---------------------------------------------------------------------------------
  push(0, 'open', null, `${names[points[0].entry.server]} serves first.`, '0-0')

  // --- match --------------------------------------------------------------------------------
  const winner = match.result.winner
  const scoreline = match.result.sets.map((set) => `${set.a}-${set.b}`).join('  ')
  push(
    lastIndex,
    'match',
    'Match.',
    [
      match.result.sets.length === 3
        ? `${names[winner]} takes it in three.`
        : `${names[winner]} takes it in straight sets.`,
      mannerLine(mannerOf(points[lastIndex]), names, winner, true),
    ]
      .filter(Boolean)
      .join(' '),
    scoreline,
  )

  // --- per game: break / hold / tiebreak / set ----------------------------------------------
  for (const g of s.games) {
    const p = points[g.last]
    const w = g.winner
    const loser: Side = w === 0 ? 1 : 0
    const manner = mannerLine(mannerOf(p), names, w, g.setEnd)

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
      push(g.last, 'set', 'Set.', [`${how}${standing}`, manner].filter(Boolean).join(' '), `${g.gamesAfter[0]}-${g.gamesAfter[1]}`)
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
      push(g.last, 'break', 'Break!', `${base}${tail} ${manner}`.trim())
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
    push(g.last, 'hold', 'Held.', `${base} ${manner}`.trim())
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
      push(r.end, 'streak', 'Streak.', `${Num(r.len)} points in a row for ${names[r.side]}.`)
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

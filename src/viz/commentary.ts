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
//   games     a run of GAMES, not points - four or more in a row. Round 16 item 11: the research
//             names it as the thing a 6-1 set is entirely made of and that nothing here ever said
//             (commentary-generation.md §5.2, "visible in 6-1 but never said"). A streak of points
//             lives inside one or two games; this is the set running away, and the two are
//             different facts. One per set, the longest, like the streak beat beside it.
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
// ROUND 16 ITEM 11 - "full shows almost nothing" (owner, 11.08)
// ---------------------------------------------------------------------------------------------
// What he was actually looking at was not a row COUNT. `full` sits at ~15 beats a match by
// measurement, which is the density this design was written to. It was the SAMENESS: every repeated
// beat reached into a pool of five authored strings behind `variant()`, a hash of the point index
// with no memory, so a break-heavy set really could print the same sentence three times, and the
// manner clause after it only ever had one shape. Three fixes, all named by the research
// (docs/research/commentary-generation.md §5, live-text-adult-tour.md §2.1), all RNG-free:
//
//   1. A USED-RECENTLY ROTOR (`rotor`). MIKE's recency decay, in its minimal form - the research's
//      own suggestion, `variant(pointIndex, n)` walked forward until it lands on something the
//      family has not just said. A pure accumulator over the beat sequence, so it is still a
//      function of the match alone. This is the single highest-leverage change in the file.
//
//   2. THE INDUSTRY TEMPLATE (`outcomeLine`). Every deterministic point-by-point feed in adult
//      tennis - IBM's at two Slams, Infosys's at the other two - emits ONE sentence shape:
//      `{Player} {wins|loses} the {point|game|set|match} with {a descriptor}`, where the subject is
//      whoever hit the last ball and the verb flips on whether that ball was a winner or a miss.
//      Its whole input is `(pointWinner, endingShot)`, which this file already reads. It rotates
//      against the existing hero-relative `mannerLine`, so one event now has two sentence moulds.
//      ⚠ THE DESCRIPTOR IS NARROWER THAN THE REAL FEEDS' AND MUST STAY THAT WAY. Theirs is
//      `[wing] [shotType] [outcome]`; we model no wing and no volley, so ours is
//      `[serve|return|groundstroke] [outcome]` and never says forehand or backhand. Inventing a
//      wing would be the exact thing the honesty rule below forbids.
//
//   3. MORRIS (1977) POINT IMPORTANCE (`importanceAt`). The published measure of how much a point
//      matters: the gap between winning and losing it, in match-win probability. Exact here, not
//      estimated - `matchWinProbability` is the engine's own solver and takes an arbitrary score,
//      so both branches of a point are two calls on a cloned `MatchScore`. It is never printed;
//      it decides REGISTER (`registerAt`), which is the lexicon's escalation ladder: at the top of
//      a match the sentence gets SHORTER and drops its colour clause rather than gaining adjectives
//      (docs/research/commentary-lexicon.md §5.3 - "tier 5 is not tier 1 with more adjectives").
//
// ⚠ AND THE SCORE IS STILL NEVER INSIDE A SENTENCE. Universal across IBM, Infosys, Flashscore and
// Sofascore (live-text-adult-tour.md §2.2): the score is a separate rendered element. `Beat.score`
// is that element and no template below interpolates it.
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
import type { MatchScore, SetGames, Side } from '../engine/match/types'
import { awardPoint } from '../engine/match/scoring'
import { matchWinProbability } from '../engine/match/liveProb'

export type BeatKind =
  | 'open'
  | 'break'
  | 'hold'
  | 'tiebreak'
  | 'streak'
  | 'rally'
  | 'games'
  | 'set'
  | 'match'

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
function clausesUpTo(max: number, ...parts: (string | null | undefined)[]): string {
  const kept: string[] = []
  for (const part of parts) {
    const p = part?.trim()
    if (!p) continue
    const next = kept.length === 0 ? p : `${kept.join(' ')} ${p}`
    if (kept.length > 0 && next.length > max) continue
    kept.push(p)
  }
  return kept.join(' ')
}

function clauses(...parts: (string | null | undefined)[]): string {
  return clausesUpTo(BEAT_MAX_CHARS, ...parts)
}

/** ⚠ THE PEAK'S BUDGET, AND IT IS SMALLER ON PURPOSE (round 16 item 11).
 *
 *  The escalation ladder in docs/research/commentary-lexicon.md §5.3 is explicit that the top of a
 *  match is not the bottom of it with more adjectives: tier 5 has FEWER modifiers and more concrete
 *  detail, and its strongest device is a beat of nothing. A generator has no silence to spend inside
 *  a row it has already decided to print, so what it can spend instead is LENGTH - the colour clause
 *  is the first thing `clausesUpTo` drops, and at a match point the colour is what a person cuts. */
const PEAK_MAX_CHARS = 88

/** Six in a row is where a run stops being noise and becomes the thing you remember. */
const STREAK_MIN = 6
/** Twelve shots: the top rally bucket is 13-18 shots at 5% of points, and grass takes one off. */
const RALLY_MIN = 12
/** Two break points saved is a story; one is a Tuesday. */
const SAVES_MIN = 2
/** Four GAMES in a row. Round 16 item 11.
 *
 *  MEASURED, not chosen (tools/commentary-register-probe.ts, 200 matches / 506 sets): the longest
 *  run per set fires 0.87 times a set at three, 0.43 at four and 0.24 at five. Three is most of a
 *  6-3 and every 6-2, so it would be saying out loud what the score column already prints; five is
 *  rare enough that a straight-sets match would usually never see one. At four it is the set that
 *  got away - the fact this beat exists to state - and it costs the log ~1.1 rows a match, well
 *  inside the density band the volume test pins. */
const GAMES_MIN = 4

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
  // A GAME run outranks a point streak and a rally: it is the biggest of the three (a whole set
  // getting away), and when it lands on the same point as one of them the reader should be told the
  // larger fact.
  //
  // ⚠ IT SITS BELOW break/hold, AND THAT DECIDES WHEN IT IS HEARD FROM AT ALL. Its anchor is the
  // last point of the run's last game, which is exactly where a break or hold beat would also sit,
  // and the game's own story is the more specific claim. MEASURED: a run of four exists 0.43 times
  // a set, and 49 of ~130 in a 120-match corpus survive the collision - the ones whose closing game
  // was a routine hold with nothing else to say.
  //
  // That is the right outcome rather than a loss. This file's rule is that the bigger beat SAYS the
  // smaller one, and here the SCORE COLUMN does it: "Break! Bianca breaks." next to `5-0` already
  // tells a reader the set is gone. The run beat exists for the case that column cannot carry alone
  // - a quiet game in the middle of a rout - and it fires in about a third of matches, which is
  // what a beat about a set running away should do.
  games: 4,
  streak: 5,
  rally: 6,
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

/** How many of a family's recent picks are remembered. Two is enough to make a three-string pool
 *  cycle rather than repeat, and it is the most a pool of three can carry: remembering all three
 *  would leave nothing to say. */
const ROTOR_MEMORY = 2

/**
 * ⚠ THE USED-RECENTLY ROTOR - THE ANTI-REPETITION FIX, AND THE HIGHEST-LEVERAGE LINE IN THE FILE
 * (round 16 item 11).
 *
 * `variant()` above is MEMORYLESS. It is a hash of the point index, so it is deterministic and it
 * spreads - but it has no way to know it just said the same thing, and a match with five breaks
 * really did print "Bianca breaks." three times, twice in a row. That is the failure mode the
 * automated-journalism literature names first ("one construction dominates the whole match",
 * live-text-adult-tour.md §2.3) and the one a bigger phrase pool does not fix.
 *
 * This is MIKE's recency decay in the minimal form the research itself proposes: keep the hash as
 * the STARTING position - so a match still varies with its own data rather than always opening on
 * variant 0 - then walk forward until it lands on something this family has not just used.
 *
 * ⚠ STILL ZERO RNG, AND STILL A PURE FUNCTION OF THE MATCH. It is an accumulator over the beat
 * sequence, which is itself a function of the point log; the rotor is created inside
 * `buildCommentary` and dies with the call, so two builds of the same match walk it identically.
 * See THE DETERMINISM RULE.
 *
 * ⚠ IT IS FED IN CHRONOLOGICAL ORDER OR IT IS FEEDING ON THE WRONG NEIGHBOUR. The per-game loop
 * below walks `s.games`, which is in play order, so "what was just said" means what the reader will
 * just have read. Candidates pushed outside that loop (streaks, rallies) do not use the rotor.
 */
function rotor(): (family: string, pointIndex: number, n: number) => number {
  const recent = new Map<string, number[]>()
  return (family, pointIndex, n) => {
    const seen = recent.get(family) ?? []
    let k = variant(pointIndex, n)
    for (let step = 0; step < n && seen.includes(k); step++) k = (k + 1) % n
    seen.push(k)
    while (seen.length > Math.min(ROTOR_MEMORY, n - 1)) seen.shift()
    recent.set(family, seen)
    return k
  }
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
  /** ⚠ per point: the full engine `MatchScore` as it stood BEFORE the point was played (round 16
   *  item 11). The one thing Morris importance needs and the only thing the point log does not
   *  already hand over in a usable shape - `PointLogEntry.scoreAfter` is a formatted string, and a
   *  DP solver cannot read a string. Everything in it was already being tracked here to answer other
   *  questions; this just stops throwing it away. */
  before: MatchScore[]
}

function scan(points: readonly AnnotatedPoint[]): Scan {
  const out: Scan = { games: [], gamesAt: [], setOf: [], before: [] }
  const games: [number, number] = [0, 0]
  const sets: [number, number] = [0, 0]
  /** completed sets in play order - the head of a `MatchScore.sets`, whose last element is the
   *  in-progress one. `sets` above counts them; this one remembers what they said. */
  const done: SetGames[] = []
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
    // ⚠ CAPTURED AT THE TOP OF THE LOOP, WHICH IS WHAT MAKES IT THE *PRE*-POINT SCORE. Every counter
    // below is advanced by this point further down; read here they still say what the scoreboard
    // said as she walked to the line. `inTiebreak` comes off the entry rather than the local
    // `tiebreak` flag because the entry's copy is the engine's own PointContext, decided before the
    // point, and the local one is a per-game latch that has not been set yet on the first point of a
    // breaker.
    out.before.push({
      sets: [...done.map((st) => ({ a: st.a, b: st.b })), { a: games[0], b: games[1] }],
      game: { a: gamePts[0], b: gamePts[1] },
      inTiebreak: p.entry.tiebreak,
      server: p.entry.server,
      winner: null,
    })
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
        done.push({ a: games[0], b: games[1] })
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
  | { kind: 'ace'; by: Side; direction: string; second: boolean }
  | { kind: 'df'; by: Side }
  | { kind: 'winner'; by: Side; shots: number; direction: string }
  | { kind: 'error'; by: Side; how: 'net' | 'long' | 'wide'; shots: number; onReturn: boolean }

function mannerOf(p: AnnotatedPoint): Manner | null {
  const shots = p.rally.shots
  const last = shots[shots.length - 1]
  if (!last) return null
  if (p.rally.ace) {
    // ⚠ A SECOND-SERVE ACE IS A REAL FACT AND IT IS FREE: `Shot.kind` already distinguishes the two
    // deliveries, and the lexicon lists the flat second serve as "a story in itself" (§1.1). It is
    // read here rather than asserted anywhere else - nothing infers spin, which we do not model.
    return {
      kind: 'ace',
      by: p.entry.server,
      direction: String(last.direction),
      second: last.kind === 'serve2',
    }
  }
  if (p.rally.doubleFault) return { kind: 'df', by: p.entry.server }
  if (last.result === 'winner') {
    return { kind: 'winner', by: last.by, shots: shots.length, direction: String(last.direction) }
  }
  const how: 'net' | 'long' | 'wide' =
    last.result === 'net' ? 'net' : Math.abs(last.bounce.y) > COURT.halfLength ? 'long' : 'wide'
  // ⚠ "ON THE RETURN" IS DERIVED, NOT GUESSED, and the derivation is the reason it is not simply
  // `shots.length === 2`: a first-serve fault REPEATS the server, so the returner's first ball can
  // sit at index 1 or index 2. The first `rally`-kind shot in the list is the return by
  // construction (rally.ts alternates hitters from the server once the serve is in), so being that
  // shot is exactly what makes a miss a return error. Everything past it is a groundstroke - which
  // is all we may say, because this engine models no volley and no wing.
  const firstRally = shots.findIndex((s) => s.kind === 'rally')
  return {
    kind: 'error',
    by: last.by,
    how,
    shots: shots.length,
    onReturn: firstRally >= 0 && firstRally === shots.length - 1,
  }
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

// --- the industry template (round 16 item 11) -------------------------------------------------
// `{Player} {wins|loses} the {point|game|set|match} with {a descriptor}` - the ONE sentence shape
// every deterministic point-by-point feed in adult tennis emits, at two Slams from IBM and at the
// other two from Infosys, with no other shape between them (live-text-adult-tour.md §2.1). Its
// elegance is a single rule: the SUBJECT is whoever hit the last ball, and the VERB flips on whether
// that ball was a winner or a miss. That is `(pointWinner, endingShot)` and nothing else, which is
// precisely what a Markov engine has.
//
// It is a second MOULD for a fact the file could already state, not a second fact - `mannerLine`
// above says the same thing hero-relatively ("Dana sends it long") and this says it feed-style
// ("Dana loses the game with a long groundstroke"). The rotor alternates them, so one event has two
// shapes and a break-heavy set stops reading like one sentence with the names swapped.

/** The `[shot] [outcome]` half. ⚠ NARROWER THAN THE REAL FEEDS' `[wing] [shotType] [outcome]`, on
 *  purpose: we model no forehand/backhand and no volley, and the honesty rule at the head of this
 *  file forbids asserting either. What is left is true of every ball this engine hits. */
function descriptorOf(m: Manner): string {
  switch (m.kind) {
    case 'ace':
      return `${m.second ? 'a second-serve ace' : 'an ace'} ${servePhrase(m.direction)}`
    case 'df':
      return 'a double fault'
    case 'winner':
      return `a winner ${rallyPhrase(m.direction)}`
    case 'error': {
      const shot = m.onReturn ? 'return' : 'groundstroke'
      if (m.how === 'net') return `a netted ${shot}`
      return `a ${m.how} ${shot}`
    }
  }
}

/** What the point that ended decided, in the feeds' own vocabulary. */
type Unit = 'game' | 'set'

/**
 * ⚠ TWO SHAPES, AND THE SECOND ONE IS REFERRING-EXPRESSION GENERATION rather than a template
 * variant. Read straight off real output, which is the only way this was ever going to be caught:
 * the plain template printed "Bianca breaks. Bianca wins the game with a winner cross-court." - the
 * name twice in two short sentences, which is the exact thing this file already refuses one line
 * further down ("naming her twice in two short sentences reads like a machine"), and a UNIT the
 * claim had just announced.
 *
 * So when the ball was the HERO's own, the sentence pronominalises and drops down a unit: she did
 * not win "the game" a second time, she won the POINT that won it. The pronoun is safe here for the
 * reason the `tail` clause below gives - the sentence it follows names her and names nobody else.
 * When the ball was the OTHER player's, the name is the whole information and the unit is the real
 * one, which is the feeds' own grammar verbatim.
 *
 * (There is no third case. If the non-hero had struck a winner they would have won the point, and
 * then the hero could not have won the game on it - so a ball hit by the loser of a game is always
 * a miss, and the verb is always `loses`.)
 */
function outcomeLine(m: Manner | null, names: [string, string], unit: Unit, hero: Side | null): string {
  if (!m) return ''
  // The verb is the whole rule: a winner or an ace WINS it for the player who struck it, an error or
  // a double fault LOSES it for them. No third case exists in the observed inventory.
  const won = m.kind === 'ace' || m.kind === 'winner'
  const verb = won ? 'wins' : 'loses'
  if (m.by === hero) return `She ${verb} the point with ${descriptorOf(m)}.`
  return `${names[m.by]} ${verb} the ${unit} with ${descriptorOf(m)}.`
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

// --- Morris (1977) point importance, and the register it decides ------------------------------
//
// «I(state) = P(A wins | A wins this point) - P(A wins | A loses this point)» - the published
// definition of how much a point matters, and the one this engine already half-believes: point.ts
// applies the Klaassen-Magnus big-point penalty and names them in its own comment. What it never did
// was NARRATE from it.
//
// ⚠ EXACT, NOT ESTIMATED, AND THE TWO INPUTS ARE BOTH ALREADY IN THE LOG.
//   * the pre-point score - `Scan.before`, reconstructed above from the point log;
//   * pA / pB, each side's base point-win-on-serve - recovered below, exactly.
// Then it is two calls on the engine's own solver over a cloned score. Pure arithmetic, zero draws.
//
// ⚠ IT IS NEVER PRINTED, AND THAT IS WHY IT MAY BE A JUDGEMENT AT ALL. The honesty rule says a beat
// may assert nothing the point log does not carry; importance asserts nothing, it only decides how
// much of what the log DOES carry gets said. Compare `swing()` below, which is the retrospective
// (WPA-family) measure and keeps its own job: deciding the `key` cut.

/**
 * THE TWO BASE SERVE PROBABILITIES, RECOVERED FROM THE LOG.
 *
 * `PointLogEntry.pServe` is the MODIFIED probability - `modifiedPServe` has already added momentum,
 * subtracted the big-point penalty and subtracted fatigue. But all three modifiers are gated, and a
 * point where none of them fires carries the base value untouched:
 *
 *   * momentum needs a running streak of >= 3 points (point.ts, MOMENTUM_MIN_STREAK);
 *   * the big-point penalty needs `ctx.breakPoint`;
 *   * fatigue needs `ctx.pointNumber > FATIGUE_START` (120).
 *
 * The final clamp cannot bite either: it is [0.3, 0.9] and the base is already clamped to
 * [0.42, 0.82]. So the FIRST point of the match is always clean by construction (no prior points, no
 * break point at love-all, point one), and the other side's first clean service point is found the
 * same way. Both are present in every real match; the fallback is the tour average, and it is there
 * so a hand-built fixture cannot throw.
 */
function baseServeProbabilities(points: readonly AnnotatedPoint[]): [number, number] {
  const found: [number | null, number | null] = [null, null]
  let streakSide: Side = points[0].entry.winner
  let streakLen = 0
  for (const p of points) {
    const e = p.entry
    const clean = streakLen < 3 && !e.breakPoint && e.pointNumber <= 120
    if (clean && found[e.server] === null) found[e.server] = e.pServe
    if (streakLen > 0 && streakSide === e.winner) streakLen++
    else {
      streakSide = e.winner
      streakLen = 1
    }
    if (found[0] !== null && found[1] !== null) break
  }
  // 0.57 is TOUR_AVG_P.wta - the women's tour average this whole model is calibrated around.
  return [found[0] ?? 0.57, found[1] ?? 0.57]
}

/**
 * ⚠ WHERE THE TOP OF THE LADDER STARTS, in units of Morris importance. MEASURED, NOT CHOSEN
 * (`tools/commentary-register-probe.ts`, 200 seeded matches over the three surfaces, 32,641 points,
 * importance evaluated at every one):
 *
 *   all points     mean 0.064   median 0.051   p90 0.121   p99 0.241   max 0.511
 *   break points   mean 0.097   median 0.086
 *   set points     mean 0.090   median 0.059
 *   match points   mean 0.112   median 0.077
 *   at BEATS       mean 0.077   median 0.061   p90 0.154   p99 0.303   max 0.511
 *
 * and the sweep that picked it, read over BEATS - the population that matters, because a beat has
 * already survived one salience gate:
 *
 *   peak    share of beats   per match   ...and on a real set/match point
 *   0.10         23%            3.6                  27%
 *   0.12         16%            2.5                  33%
 *   0.15         11%            1.7                  41%
 *   0.18          6%            0.9                  40%
 *   0.20          4%            0.6                  48%
 *   0.25          2%            0.3                  61%
 *
 * 0.15 is the pick and the last two columns are why. The top of the ladder has to be somewhere a
 * match actually GOES - at 0.20 and above most matches never reach it once - and it has to be about
 * the stakes without being only about them: 41% of what it keeps sits on a game containing a real
 * set or match point, and the rest is the other thing that genuinely is one, a break at 5-5 in a
 * decider. Once or twice a match is the frequency the escalation ladder describes for its top tier.
 *
 * ⚠ TWO STEPS, NOT THE THREE THE RESEARCH PROPOSES, and the measurement is the reason.
 * `commentary-generation.md` §5.3.3 recommends flat / raised / peak. Built and measured, the middle
 * bucket changed nothing a reader could see: the register's levers here are the sentence mould and
 * the row's budget, and at any threshold that left a real top step the middle band's rows came out
 * byte-identical to the flat ones (a claim plus a manner clause is 90-100 characters, so a budget
 * between 104 and 120 never cuts). A third name that renders the same string is a comment pretending
 * to be a feature. Recorded here rather than quietly dropped - invariant 4 cuts both ways.
 */
export const PEAK_IMPORTANCE = 0.15

type Register = 'flat' | 'peak'

/**
 * A reader for Morris importance over one match: `at(i)` is how much point `i` mattered.
 *
 * ⚠ LAZY AND MEMOISED, WHICH IS A COST DECISION AND NOT A STYLE ONE. The DP is the only thing in
 * this file that is not O(1), and a build asks about ~15 anchors out of ~180 points. Computed
 * eagerly across the whole log, the commentary suite's own corpora (about 1,500 matches over its
 * describe blocks) went from 15 seconds to well over a minute for numbers nobody read.
 */
function importanceReader(before: readonly MatchScore[], pA: number, pB: number): (i: number) => number {
  const memo = new Map<number, number>()
  return (i) => {
    const cached = memo.get(i)
    if (cached !== undefined) return cached
    const state = before[i]
    let value = 0
    if (state) {
      // Clone and award, once each way. `awardPoint` mutates, so each branch gets its own copy; the
      // sets array is the only nested part.
      const branch = (to: Side): number => {
        const copy: MatchScore = {
          sets: state.sets.map((st) => ({ a: st.a, b: st.b })),
          game: { a: state.game.a, b: state.game.b },
          inTiebreak: state.inTiebreak,
          server: state.server,
          winner: null,
        }
        awardPoint(copy, to)
        return matchWinProbability(copy, pA, pB)
      }
      value = Math.abs(branch(0) - branch(1))
    }
    memo.set(i, value)
    return value
  }
}

/**
 * Morris importance at every point of a match, in play order.
 *
 * ⚠ EXPORTED AS A TESTING AND MEASUREMENT SEAM, not because anything else renders it. The register
 * ladder is a rule about a number, and a test that cannot see the number can only pin the source
 * text - which CLAUDE.md is explicit about preferring not to do. With this, `tests/viz/commentary
 * .test.ts` asserts the actual rules ("a peak beat never carries a forward look", "a peak beat fits
 * the shorter budget") against the same arithmetic the builder used.
 *
 * Pure, and the same zero-RNG guarantee as everything else here.
 */
export function pointImportance(match: AnnotatedMatch): number[] {
  const points = match.points
  if (points.length === 0) return []
  const [pA, pB] = baseServeProbabilities(points)
  const at = importanceReader(scan(points).before, pA, pB)
  return points.map((_, i) => at(i))
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

  // MORRIS IMPORTANCE at one point - see the block above the build for what it is and why it is
  // exact. Memoised because a beat asks for its own anchor twice (register, then the budget) and
  // because the solver is the only thing in this file that is not O(1).
  const [pA, pB] = baseServeProbabilities(points)
  const importanceAt = importanceReader(s.before, pA, pB)
  const registerAt = (i: number): Register => (importanceAt(i) >= PEAK_IMPORTANCE ? 'peak' : 'flat')

  // The used-recently rotor (see `rotor`). One per build, walked in play order by the per-game loop.
  const pick = rotor()

  /** The manner clause for a beat, in whichever of the two moulds has not just been used, and cut to
   *  whatever the register allows. `hero` is the beat's protagonist; `unit` is what the point
   *  decided, which is the industry mould's object slot. */
  const mannerFor = (
    m: Manner | null,
    hero: Side | null,
    unit: Unit,
    closing: boolean,
    at: number,
  ): string => {
    if (!m) return ''
    // ⚠ AT THE PEAK THERE IS NO CHOICE TO MAKE. The escalation ladder wants the top of a match said
    // plainly and short, and the feed mould IS the plain one - subject, verb, what the ball did, no
    // shot count and no "a long exchange, and". The rotor is not consulted, so a match point never
    // reads as a stylistic decision.
    if (registerAt(at) === 'peak') return outcomeLine(m, names, unit, hero)
    return pick('manner', at, 2) === 0
      ? mannerLine(m, names, hero, closing)
      : outcomeLine(m, names, unit, hero)
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
  // ⚠ ROUND 16 ITEM 18 - "максимально неявно" (owner, 11.08). The beat above EXISTED and still said
  // almost nothing: "cannot continue. Bianca goes through." is scoreboard language, and next to the
  // score column it read as the fragment he reported - «4-5 cannot continue» - an event with no
  // explanation attached. Three things are wrong with that line and all three are fixed here.
  //
  //   1. IT DID NOT SAY WHAT HAPPENED. A reader is told a match stopped and not that a BODY stopped.
  //      "She retires hurt" is the world's own wording for this already (the tournament summary
  //      prints "Semifinalist (+30 pts) – she retired hurt", match-retirement.md §9), so the log now
  //      agrees with the rest of the game instead of inventing a quieter phrase for the same fact.
  //   2. IT DID NOT SAY WHY, and the model has an answer. `retireHazard` (point.ts) is
  //      `RETIRE_K * spentness(pointNumber, stamina)` and `spentness` is EXACTLY ZERO up to
  //      FATIGUE_START, so every retirement this engine can produce happened past 120 points to a
  //      girl who is not fresh. "A long match on tired legs" is that file's own summary of its own
  //      mechanism and it is true of every match that reaches this branch by construction - which is
  //      the standard the honesty rule sets. `tests/viz/commentary.test.ts` asserts the >120
  //      property directly, so the sentence cannot outlive the mechanism that licenses it.
  //   3. "GOES THROUGH" IS THE WRONG VERB, and the rulebooks are explicit about which one is right:
  //      the opponent ADVANCES, and did not beat her (docs/research/commentary-lexicon.md §4.6). The
  //      distinction is the whole reason a retirement is not a loss like any other in the TEXT even
  //      though the bracket treats it as one.
  //
  // ⚠ AND THERE IS NO EARLIER BEAT, deliberately. The obvious ask is a line when she starts to
  // struggle - and the engine gives no such signal: the hazard is a per-point coin the log does not
  // record, so a "she is labouring" row would be the narrator inventing a fact. The retirement is
  // knowable at exactly one point, and this is it.
  const retired = match.result.retired
  push(
    lastIndex,
    'match',
    retired ? 'Retired.' : 'Match.',
    retired
      ? clauses(
          `${names[retired.side]} cannot go on. ${names[winner]} advances.`,
          'A long match on tired legs.',
          // ⚠ THE CLAUSES ARE SPLIT RATHER THAN JOINED, and it is `clauses()`'s degradation order
          // doing real work: two players who share a first name both fall back to full names (see
          // `speakingNames`), which costs this row eleven characters. Written as one long colour
          // sentence the whole explanation fell off that case; written as two, the CAUSE survives
          // and only the flourish goes.
          'It ends with a handshake, not a winner.',
        )
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
    // ⚠ TWO MOULDS NOW, PICKED BY THE ROTOR AND OVERRIDDEN AT THE PEAK - see `mannerFor`. The unit
    // is what the point actually decided, which is the industry mould's object slot.
    //
    // ⚠ AND IT IS LAZY, WHICH IS NOT A MICRO-OPTIMISATION - IT IS THE ROTOR'S CORRECTNESS. This loop
    // walks EVERY game, and most of them print nothing (a routine hold falls out at `if (!base)
    // continue` below). Computed eagerly, the rotor was advanced by rows nobody would ever read, so
    // two visible beats with silent games between them could still land on the same mould. Found by
    // reading real output rather than by reasoning: the first build printed "Bianca breaks. Bianca
    // wins the game with a winner cross-court." twice in one set, two rows apart, with the rotor
    // having "alternated" across a game that printed nothing in between. "What was just said" has to
    // mean what was just PRINTED, so nothing may touch the rotor until a row is going in.
    const manner = (): string => mannerFor(mannerOf(p), w, g.setEnd ? 'set' : 'game', g.setEnd, g.last)
    // The row's budget shrinks at the top of a match, so the colour clause is cut where a human
    // editor would cut it. Read once per game, beside the manner it governs.
    const budget = registerAt(g.last) === 'peak' ? PEAK_MAX_CHARS : BEAT_MAX_CHARS
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
      push(
        g.last,
        'set',
        'Set.',
        clausesUpTo(budget, `${how}${standing}`, manner()),
        `${g.gamesAfter[0]}-${g.gamesAfter[1]}`,
      )
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
              ? // ⚠ THE ROTOR, NOT THE BARE HASH (round 16 item 11). Same pools, same starting
                // position - what changed is that the pool now knows what it just said, so a
                // break-heavy set cycles instead of repeating. See `rotor`.
                LEVEL_LINES[pick('level', g.last, LEVEL_LINES.length)](names[w])
              : BREAK_LINES[pick('break', g.last, BREAK_LINES.length)](names[w])
      // "She" is safe here and only here: the sentence it follows names her and names nobody
      // else, and the tour is women's (JUNIOR_TOUR = 'wta'; the cohort's given-name pool is
      // female). Naming her twice in two short sentences reads like a machine.
      //
      // ⚠ AND IT IS DROPPED AT THE PEAK, which is the second half of the escalation ladder's rule.
      // This clause is a FORWARD LOOK - what the next game is now - and the top of a match is where
      // real commentary stops looking ahead and stays with the ball that just landed
      // (commentary-lexicon.md §5.3: tier 4 "slows down. Shorter sentences."). It is glued to the
      // claim rather than passed as its own clause, so the budget alone could never cut it.
      const forward = g.gamesAfter[w] === 5 && g.gamesAfter[loser] <= 4
      const tail = forward && budget !== PEAK_MAX_CHARS ? ' She serves for the set next.' : ''
      push(g.last, 'break', 'Break!', clausesUpTo(budget, `${base}${tail}`, manner()), undefined, gameMoved)
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
    push(g.last, 'hold', 'Held.', clausesUpTo(budget, base, manner()), undefined, gameMoved)
  }

  // --- game runs: the longest run of >= GAMES_MIN consecutive games in each set ---------------
  // Round 16 item 11, and the research's own example of a fact the log could not state: a 6-1 set is
  // made entirely of a run of games, and nothing here ever said so. A POINT streak lives inside one
  // or two games; this is the set itself running away, which is a different thing and reads as one.
  //
  // Anchored to the last point of the run's last game, and the key cut is asked the same question
  // every non-structural beat is asked: did the match MOVE across the run's own span.
  {
    const best = new Map<number, { side: Side; len: number; from: number; last: number }>()
    let side: Side | null = null
    let len = 0
    let firstPoint = 0
    for (const g of s.games) {
      if (g.winner === side) len++
      else {
        side = g.winner
        len = 1
        firstPoint = g.last
      }
      // A run is claimed for the set its LAST game sits in, so a run that straddles a set break is
      // told once, where it finished. `firstPoint` is the last point of the run's FIRST game, which
      // is the point just before the run began doing anything - exactly `swing`'s `from`.
      if (len < GAMES_MIN) continue
      const cur = best.get(g.set)
      if (!cur || len > cur.len) best.set(g.set, { side, len, from: firstPoint, last: g.last })
    }
    for (const r of best.values()) {
      push(
        r.last,
        'games',
        'Run.',
        `${Num(r.len)} games in a row for ${names[r.side]}.`,
        undefined,
        swing(r.from, r.last) >= KEY_SWING,
      )
    }
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

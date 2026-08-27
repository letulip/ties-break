// Shared contract for the match engine (Phase 1). This file is the source of truth:
// implementations in scoring.ts / point.ts / closedForm.ts / engine.ts must conform to it.

export type Surface = 'hard' | 'clay' | 'grass'
export type Tour = 'wta' | 'atp'
export type Side = 0 | 1

export interface MatchPlayer {
  id: string
  name: string
  /** 0-100: serve quality + first-strike game */
  serve: number
  /** 0-100: return + neutralizing quality */
  ret: number
  /** 0-100: big-point nerves; 100 = no choke penalty on break points */
  composure: number
  /** 0-100: resistance to late-match fatigue */
  stamina: number
  /** 0-100: damage off the ground – THE RALLY, added v25 (docs/specs/skills-radar.md §5).
   *
   *  The third leg of a point. `serve` acts on the server's side only and `ret` on the receiver's
   *  only; the rally is contested by BOTH, so this one enters `basePServe` as a difference and is
   *  worth exactly nothing when the two players are level. That is deliberate: every symmetric
   *  fixture and every calibration band stays byte-identical.
   *
   *  ⚠ `AiPlayer` deliberately does NOT inherit this field – see season/types.ts. The cohort is
   *  persisted and its weekly drift is what the frozen MAIN capture is made of, so a rival's value
   *  is DERIVED at match time (`rivalGroundstrokes`). */
  groundstrokes: number
  /** Her age in years at the moment she stepped on court, FRACTIONAL (a December girl is 13.08 in
   *  her first January). Not a skill and never read by `basePServe` – it is the age half of the
   *  serve-speed curve (match/serveSpeed.ts) and, through it, of the ace rate.
   *
   *  ⚠ IT BELONGS ON THE SNAPSHOT, which is why it lives here rather than being resolved at render
   *  time. `WorldMatch.a/.b` freeze a MatchPlayer into the save, so a box score re-opened three
   *  seasons later must still report the serve of the girl who played it, not of the girl she has
   *  since become. Resolving her age from today's world would have quietly re-aged every historical
   *  match every week.
   *
   *  OPTIONAL because pre-branch snapshots were frozen without it (see LEGACY_SNAPSHOT_AGE); the
   *  live composition points always set it. ⚠ `AiPlayer` does not inherit it either - the cohort
   *  already carries `ageYears`, and two ages on one row is one age too many. */
  age?: number
  /** ⭐ HOW FRESH SHE ARRIVED, 0-100 – the condition she stepped on court at, read by the RETIREMENT
   *  HAZARD and by nothing else (`retireDurability`, match/point.ts, 27.08).
   *
   *  ⚠ IT IS A SECOND NUMBER BECAUSE `stamina` CANNOT ANSWER THE QUESTION. The hazard read `stamina`
   *  and nothing else, and `stamina` conflates TALENT with FRESHNESS: a 45 is either a worn-out star
   *  or a fresh weak girl and the function cannot tell them apart. Measured, that left the hazard
   *  unable to tell a girl who arrived at 95 from one who arrived at 70 – ×1.00 to the last decimal
   *  across the whole band (docs/specs/retirement-shape-2026-08.md §6).
   *
   *  ⚠ NOT A SKILL, AND NEVER READ BY `basePServe`. The STRENGTH half of condition is already inside
   *  the four scaled attributes above – both composition points multiply by `conditionMatchFactor`
   *  before they write this – so a model that read this for point-win probability would be paying for
   *  condition twice. Exactly the rule `age` is under, one field up.
   *
   *  ⚠⚠ IT BELONGS ON THE SNAPSHOT, and the argument is `age`'s own, word for word: `WorldMatch.a/.b`
   *  freeze a `MatchPlayer` into the save, and a match re-opened three seasons later must replay as
   *  the match that was played. It was FIRST built as a `MatchOptions` field – no persisted type
   *  touched, which looked like the cheaper seam – and `tests/college-league.test.ts`'s "every stored
   *  match REPLAYS" caught it inside one run: the three replay call sites rebuild `MatchOptions` from
   *  a stored record that carries `{surface, tour, seed}` and no body, so a re-watch of a match whose
   *  retirement turned on freshness replayed as a different match. That test's own comment names the
   *  stake – "a record that failed here is a Watch button that opens on nothing". The freshness she
   *  played at is a fact about the girl who played, not about the call that is asking.
   *
   *  OPTIONAL, and ABSENT MEANS A MULTIPLIER OF EXACTLY 1 – not "she was fresh". Every snapshot frozen
   *  before this field existed, every hand-built fixture and every calibration case therefore
   *  integrates the identical hazard it always did, which is why no migration is owed and
   *  `SAVE_SCHEMA_VERSION` does not move (the same reading `MatchRecord.retiredId` and `age` ship
   *  under). A raw opponent nobody composed a condition for – a sparring partner, a call-up rubber –
   *  is deliberately left absent: "no opinion" and "fresh at 100" are different claims. */
  condition?: number
}

export interface MatchOptions {
  surface: Surface
  tour: Tour
  /** only best-of-3 in Phase 1 */
  bestOf?: 3
  seed: string
  /** cosmetic (provably irrelevant to win probability); defaults to 0 */
  firstServer?: Side
  /** momentum/streak modifier on; defaults to true */
  momentum?: boolean
  /** ⭐ AN OVERRIDE FOR HOW FRESH THE TWO PLAYERS ARRIVED, 0-100, `[side 0, side 1]` – the same
   *  quantity as `MatchPlayer.condition` and read by the same one consumer, the retirement hazard.
   *
   *  ⚠ THE PLAYER'S OWN FIELD IS THE RECORD; THIS IS THE OPINION, and the order is: option first,
   *  then the snapshot, then a multiplier of exactly 1. That order is what lets a caller who builds
   *  players BY HAND – a calibration fixture, a probe asking "what if she had arrived at 85?" – say
   *  so without inventing a composition point, while a stored match replays off its own snapshot
   *  with no option at all. Every live call site in `src/` passes NOTHING here and is answered by the
   *  snapshot, which is the property that makes a re-watch reproduce.
   *
   *  ⚠ OMITTED IS NOT "BOTH FRESH". It is "no opinion", and it falls through to the players. */
  condition?: [number, number]
}

/** Raw point counters of the current game or tiebreak (deuce = margin rule, not a state). */
export interface GamePoints {
  a: number
  b: number
}

/** Games won per side in one set, from side A's perspective. */
export interface SetGames {
  a: number
  b: number
}

export interface MatchScore {
  /** completed sets, plus the in-progress set as the last element */
  sets: SetGames[]
  game: GamePoints
  inTiebreak: boolean
  server: Side
  winner: Side | null
}

/** Context of the NEXT point, computed before it is played. */
export interface PointContext {
  /** 1-based sequential number of the point in the match */
  pointNumber: number
  server: Side
  tiebreak: boolean
  /** receiver wins the game if they win this point (regular games only) */
  breakPoint: boolean
  setPointFor: Side | null
  matchPointFor: Side | null
}

export interface PointLogEntry extends PointContext {
  winner: Side
  /** serve-point win probability actually used, after all modifiers */
  pServe: number
  /** score AFTER the point, e.g. "6-4 2-1 30-30" or "6-4 6-6 TB 3-2" */
  scoreAfter: string
}

export interface SideMatchStats {
  pointsWon: number
  servePointsPlayed: number
  servePointsWon: number
  /** on own serve */
  breakPointsFaced: number
  breakPointsSaved: number
  /** return games won */
  breaksWon: number
  longestPointStreak: number
}

export interface MatchResult {
  /** ⚠ ON A RETIREMENT THIS IS THE PLAYER WHO WAS STILL STANDING, AT FULL VALUE. The rulebooks are
   *  unanimous and unusually explicit about it – "a match won by retirement, default or walkover
   *  will count as a match won for ranking points and prize money" (2026 ITF WTT Regs, Women's
   *  §XII.C.1.b), and the WTT's System of Merit spells out the contrast: retirement wins count,
   *  walkovers do not. It is the WALKOVER the rules discount, never the retirement. So there is no
   *  "win by retirement" variant here and there must not be one: `winner` means the same thing on
   *  every row. See docs/research/retirement-and-withdrawal.md §4. */
  winner: Side
  /** completed sets, e.g. [{a:6,b:4},{a:7,b:6}].
   *
   *  ⚠ ON A RETIREMENT THE LAST ELEMENT IS THE SET SHE STOPPED IN, and it is deliberately not
   *  completed – "6-4 2-1 ret." is what a real result sheet prints, and dropping the partial set
   *  would throw away the only part of a retirement scoreline that says WHEN. A trailing 0-0 is
   *  trimmed by `simulateMatch` (she stopped at the change of ends, so the sheet reads "6-4 ret."),
   *  which is the one case where the partial set carries no information. */
  sets: SetGames[]
  stats: [SideMatchStats, SideMatchStats]
  log: PointLogEntry[]
  totalPoints: number
  seed: string
  /** SHE STOPPED. Present iff the match ended in a RETIREMENT rather than on a match point.
   *
   *  ⚠ OPTIONAL, AND THAT IS THE WHOLE REASON THE EXTENSION IS THIS AND NOT A WIDER ONE. Three
   *  shapes were on the table: a `MatchResult` union (`{kind:'completed'} | {kind:'retired'}`), a
   *  required `retired: Retirement | null`, and this. The union re-types eleven call sites and every
   *  fixture for a case that fires in under three percent of matches; a required field breaks every
   *  hand-built `MatchResult` in the test corpus and every historical save that carries one. An
   *  OPTIONAL field is read as "absent = she played it out", which is exactly what an old save
   *  means, so no migration is owed and `SAVE_SCHEMA_VERSION` did not move for this slice.
   *
   *  `side` is the player who STOPPED – i.e. the loser, `winner` is the other one. `pointNumber` is
   *  the last point actually played, so `totalPoints === pointNumber` and `log` ends there: a
   *  truncated match is a real, shorter match in every field, which is what lets the visualiser,
   *  the box score, `annotateMatch` and `matchDrain` read it without knowing this field exists. */
  retired?: { side: Side; pointNumber: number }
}

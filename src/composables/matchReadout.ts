// THE MATCH READOUT: everything the viewer's panel DERIVES from a match and a point cursor –
// the score cells, the game score, momentum, the serve reading and the stat rows.
//
// ⚠ WHY IT LEFT MatchViewer.vue. Measured before the cut: 250 lines with ZERO mutable state – eight
// computeds and a handful of constants – depending on exactly five things from the component
// (`props`, and the refs `displayedPointIndex`, `finished`, `liveServeSpeed`, `endsSwappedRef`).
// Pure derivation behind a five-value interface is the safest thing an SFC can give up, and it is
// what let the 2,239-line viewer start coming apart at all.
//
// ⚠ NOTHING HERE DECIDES ANYTHING. Pillar 1: the match is already resolved before the viewer opens
// it. These are read-outs of a committed result, which is exactly why they can be pure.
import { computed, type ComputedRef, type Ref } from 'vue'
import { KID_ID } from '../engine/world'
import type { AnnotatedMatch } from '../viz/types'
import type { MatchPlayer, Side } from '../engine/match/types'
import type { StruckServe } from '../engine/match/serveSpeed'

export interface SetCell {
  a: string
  b: string
  state: 'played' | 'current' | 'future'
  /** who leads the IN-PROGRESS set – the export fills the leader's cell with the accent */
  leader: Side | null
}

export interface PanelStats {
  /** first serves landed in / service points played, per side */
  firstIn: [number, number]
  firstPlayed: [number, number]
  /** break points CONVERTED / had, per side as the returner (the broadcast stat) */
  bpWon: [number, number]
  bpHad: [number, number]
}

/** The five things the readout needs from the component that owns the playback. */
export interface MatchReadoutInput {
  props: { match: AnnotatedMatch; playerA: MatchPlayer; playerB: MatchPlayer }
  displayedPointIndex: Ref<number>
  finished: Ref<boolean>
  liveServeSpeed: Ref<StruckServe | null>
  endsSwappedRef: ComputedRef<boolean> | Ref<boolean>
}

export function useMatchReadout(input: MatchReadoutInput) {
  const { props, displayedPointIndex, finished, liveServeSpeed, endsSwappedRef } = input

  // --- readout: score / serve / win-probability / stats -------------------------
  function playerName(side: Side): string {
    return side === 0 ? props.playerA.name : props.playerB.name
  }

  // HER side, when she is in this match at all. The design writes our own girl's name in the accent
  // and everyone else's in white ("у своей игроницы имя лаймом"), and draws the momentum curve from
  // her point of view. Every call site that carries the kid gives her `id: KID_ID` (world.ts
  // kidMatchPlayer, and SeasonScreen's exhibition too), so the viewer can tell without a new prop.
  const kidSide = computed<Side | null>(() =>
    props.playerA.id === KID_ID ? 0 : props.playerB.id === KID_ID ? 1 : null,
  )
  /** Whose point of view the momentum curve and its caption take: hers, or side A's by default. */
  const heroSide = computed<Side>(() => kidSide.value ?? 0)

  /** For the two-row / two-column readouts, in the panel's fixed A-then-B order. */
  const SIDES: readonly Side[] = [0, 1]

  // --- round 4 item 1: server-highlight labels row, on the players' CURRENT sides ----
  // Name truncation is the shared formatShortName ("First Last" -> "F. Last"); see
  // docs/specs/round4-viz.md §1 for the row's origin.
  const leftSide = computed<Side>(() => (endsSwappedRef.value ? 1 : 0))
  const rightSide = computed<Side>(() => (endsSwappedRef.value ? 0 : 1))

  const currentAnnotated = computed(() => (displayedPointIndex.value >= 0 ? props.match.points[displayedPointIndex.value] : null))
  const winProbA = computed(() => currentAnnotated.value?.winProbA ?? 0.5)

  // --- design I §2: the two player rows and their per-set score cells ----------------------------
  // Best-of-THREE cells, not the export's four. The export draws four boxes and our matches are
  // bo3 (`MatchOptions.bestOf?: 3` is the only value the engine takes), so a fourth box would be a
  // permanently empty dash claiming a format we do not play. Reported as a deliberate deviation.
  const SET_CELLS = 3


  const setCells = computed<SetCell[]>(() => {
    const done: [number, number][] = []
    const games: [number, number] = [0, 0]
    for (let i = 0; i <= displayedPointIndex.value; i++) {
      const p = props.match.points[i]
      if (!p?.gameEnd) continue
      games[p.entry.winner]++
      if (p.setEnd) {
        done.push([games[0], games[1]])
        games[0] = 0
        games[1] = 0
      }
    }
    const live = !finished.value && done.length < props.match.result.sets.length
    return Array.from({ length: SET_CELLS }, (_, i): SetCell => {
      const set = done[i]
      if (set) return { a: String(set[0]), b: String(set[1]), state: 'played', leader: null }
      if (i === done.length && live) {
        return {
          a: String(games[0]),
          b: String(games[1]),
          state: 'current',
          leader: games[0] > games[1] ? 0 : games[1] > games[0] ? 1 : null,
        }
      }
      return { a: '–', b: '–', state: 'future', leader: null }
    })
  })

  /** How far into the match we are. Shown once it is over, in place of the live game score. */
  const pointsPlayed = computed(() => Math.max(0, displayedPointIndex.value + 1))

  const POINT_NAMES = ['0', '15', '30', '40'] as const

  /** THE POINT SCORE OF THE GAME IN PROGRESS ("30-40", "40-A", "TB 3-2").
   *
   *  The export gives this slot to a wall clock and labels it "Match time". The engine has no time
   *  model at all, so a clock here would be a number we made up - and a live tennis view that cannot
   *  tell you it is 30-40 is missing the most basic thing on a scoreboard. So the slot keeps the
   *  export's shape and its typography, and carries the one live reading the export's own point log
   *  used to carry instead (the commentary's score column shows GAMES, not points).
   *
   *  ⚠ THE SLOT MOVED ON 31.07 AND THE READING DID NOT. It used to be the right-hand end of a serve
   *  row under the player rows; the owner had the row's other half deleted as a duplicate and this
   *  half moved into the court's bottom run-off band, which was already drawn and already empty. Same
   *  words, same typography, one fewer row of panel - see `scoreReadout` and `.mv-score`. */
  const gameScore = computed(() => {
    // ⚠ 0-0 IS A SCORE AND IT SHOWS (04.08). This used to return nothing until the first point
    // landed, so the counter blinked out of existence at the top of every game - which is exactly
    // when a viewer looks at it to see who is about to serve for what. `finished` still reads empty:
    // once the match is over the readout carries the point TOTAL instead (see `scoreReadout`).
    if (finished.value) return null
    if (displayedPointIndex.value < 0) return { a: '0', b: '0', tiebreak: false }
    const pts: [number, number] = [0, 0]
    let tiebreak = false
    for (let i = 0; i <= displayedPointIndex.value; i++) {
      const p = props.match.points[i]
      if (!p) continue
      pts[p.entry.winner]++
      tiebreak = p.entry.tiebreak
      if (p.gameEnd) {
        pts[0] = 0
        pts[1] = 0
        tiebreak = false
      }
    }
    // The point AFTER a completed game is served in the next one, which the flags on the NEXT point
    // already know; a game boundary therefore reads 0-0 until the first point of the new game lands.
    const next = props.match.points[displayedPointIndex.value + 1]
    if (next?.entry.tiebreak) tiebreak = true
    // ⚠ PER SIDE, NOT AS ONE STRING (owner, 04.08: «сделать максимально наглядно 0-0, 0-15, 0-30…
    // Чтобы точно было видно кто и почему забирает сет. И предлагаю еще выделять желтым цифру нашего
    // игрока»). The reading is unchanged - what changes is that the two halves stay separable, so the
    // template can colour HER number and order the pair by which end each player is standing at.
    if (tiebreak) return { a: String(pts[0]), b: String(pts[1]), tiebreak: true }
    if (pts[0] >= 3 && pts[1] >= 3) {
      if (pts[0] === pts[1]) return { a: '40', b: '40', tiebreak: false }
      return pts[0] > pts[1] ? { a: 'A', b: '40', tiebreak: false } : { a: '40', b: 'A', tiebreak: false }
    }
    return { a: POINT_NAMES[pts[0]], b: POINT_NAMES[pts[1]], tiebreak: false }
  })

  /** THE POINT SCORE AS THE COURT SHOWS IT: left number = whoever is standing at the left end.
   *
   *  ⚠ IT SWAPS WITH THE PLAYERS, AND THE OWNER ASKED THE RIGHT QUESTION ABOUT IT («правильно ли я
   *  понимаю, что при смене сторон счет тоже должен меняться сторонами»). Yes - because this readout
   *  lives UNDER THE COURT rather than in the panel's fixed A-then-B rows. The serve speed already
   *  crosses the screen on a change of ends for exactly this reason; a score that did not would put
   *  the left player's points above the right player's feet from the third game on. The panel rows
   *  above stay A-then-B, which is what a scoreboard is for; this is what the court is for. */
  const courtScore = computed(() => {
    const g = gameScore.value
    if (!g) return null
    const l = leftSide.value
    return {
      left: l === 0 ? g.a : g.b,
      right: l === 0 ? g.b : g.a,
      tiebreak: g.tiebreak,
      /** which END her number is at, so the template can accent exactly one of the two */
      hersAt: kidSide.value === null ? null : kidSide.value === l ? 'left' : 'right',
    }
  })

  /**
   * WHAT THE COUNTER UNDER THE COURT SAYS (owner, 31.07 - see `.mv-score` for where it sits).
   *
   * Both readings the deleted serve row carried, in one place and unchanged: the point score of the
   * game in progress while it is being played, and how far the match got once it is over. Neither is
   * a duplicate of anything else on the screen - the commentary's score column shows GAMES, and the
   * set cells show sets - which is exactly why the row's OTHER half was the one that went.
   *
   * Empty before the first point lands (`gameScore` returns '' there), and the template drops the
   * element entirely rather than pinning an empty box over the court.
   */
  const scoreReadout = computed(() => (finished.value ? `${pointsPlayed.value} points` : null))

  /**
   * WHICH END OF THE RUN-OFF BAND THE SPEED IS WRITTEN AT, or null when there is nothing to write.
   *
   * Owner: «справа и слева, в зависимости от того, кто подает». The band is directly under the court
   * and the court is landscape (viz/geometry: side 0 defends the LEFT half), so an end really is a
   * left and a right - the same mapping `.ends-labels` already uses one row further down, through the
   * same `leftSide`. The reading therefore sits with the player who struck the serve, and crosses the
   * screen when the serve does: on a change of ends, because the players swapped; on a change of
   * serve, because the server did.
   */
  const serveSpeedEnd = computed<'left' | 'right' | null>(() =>
    liveServeSpeed.value === null ? null : liveServeSpeed.value.side === leftSide.value ? 'left' : 'right',
  )

  // --- design I §4a: MOMENTUM ---------------------------------------------------------------
  // The export's "two polylines + a caption" IS the live win probability we already compute per
  // point (viz/liveProb), drawn from HER point of view. Sampled to at most 48 columns so the shape
  // stays readable in a 104x26 box however long the match runs.
  const MOM_W = 104
  const MOM_H = 26
  const MOM_PAD = 2
  const MOM_MAX_SAMPLES = 48

  /** Her win probability after the point currently on screen. */
  const heroProb = computed(() => (heroSide.value === 0 ? winProbA.value : 1 - winProbA.value))

  const momentum = computed<{ hero: string; rival: string } | null>(() => {
    const upto = displayedPointIndex.value
    if (upto < 1) return null
    const n = Math.min(upto + 1, MOM_MAX_SAMPLES)
    const hero: string[] = []
    const rival: string[] = []
    for (let i = 0; i < n; i++) {
      const idx = Math.round((i / (n - 1)) * upto)
      const pa = props.match.points[idx]?.winProbA ?? 0.5
      const p = heroSide.value === 0 ? pa : 1 - pa
      const x = MOM_PAD + (i / (n - 1)) * (MOM_W - MOM_PAD * 2)
      const span = MOM_H - MOM_PAD * 2
      hero.push(`${x.toFixed(1)},${(MOM_PAD + (1 - p) * span).toFixed(1)}`)
      rival.push(`${x.toFixed(1)},${(MOM_PAD + p * span).toFixed(1)}`)
    }
    return { hero: hero.join(' '), rival: rival.join(' ') }
  })

  /** The export's "Slight edge" caption, as a band of the same probability the curve draws. Seven
   *  bands, symmetric, and never a claim about how she FEELS – only about where the match stands. */
  const momentumCaption = computed(() => {
    if (displayedPointIndex.value < 0) return 'Not started'
    const p = heroProb.value
    if (p >= 0.9) return 'Almost there'
    if (p >= 0.7) return 'Well ahead'
    if (p >= 0.57) return 'Slight edge'
    if (p > 0.43) return 'Even'
    if (p > 0.3) return 'Uphill'
    if (p > 0.1) return 'Well behind'
    return 'Hanging on'
  })

  // --- design I §4b/c: 1st serve % and break points, both live ------------------------------

  const panelStats = computed<PanelStats>(() => {
    const st: PanelStats = { firstIn: [0, 0], firstPlayed: [0, 0], bpWon: [0, 0], bpHad: [0, 0] }
    for (let i = 0; i <= displayedPointIndex.value; i++) {
      const p = props.match.points[i]
      if (!p) continue
      const server = p.entry.server
      const first = p.rally.shots[0]
      if (first) {
        st.firstPlayed[server]++
        // rally.ts always emits the first serve as shots[0]; 'out'/'net' means it was missed.
        if (first.result !== 'out' && first.result !== 'net') st.firstIn[server]++
      }
      if (p.entry.breakPoint) {
        const returner: Side = server === 0 ? 1 : 0
        st.bpHad[returner]++
        if (p.entry.winner === returner) st.bpWon[returner]++
      }
    }
    return st
  })

  function pct(n: number, of: number): number {
    return of ? Math.round((n / of) * 100) : 0
  }

  return { playerName, kidSide, heroSide, SIDES, leftSide, rightSide, currentAnnotated, winProbA, SET_CELLS, setCells, pointsPlayed, POINT_NAMES, gameScore, courtScore, scoreReadout, serveSpeedEnd, MOM_W, MOM_H, MOM_PAD, MOM_MAX_SAMPLES, heroProb, momentum, momentumCaption, panelStats, pct }
}

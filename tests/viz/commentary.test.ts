import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildCommentary, pointImportance, PEAK_IMPORTANCE, type Beat } from '../../src/viz/commentary'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import type { AnnotatedMatch } from '../../src/viz/types'
import type { MatchPlayer, MatchOptions, Side, Surface } from '../../src/engine/match/types'

// Two juniors with different shapes so the corpus below contains blowouts, three-setters and
// tiebreaks rather than one repeated match.
const A: MatchPlayer = { id: 'kid', name: 'Bianca Tran', serve: 58, ret: 55, composure: 42, stamina: 61, groundstrokes: 56 }
const B: MatchPlayer = { id: 'opp', name: 'Dana Delgado', serve: 60, ret: 57, composure: 55, stamina: 60, groundstrokes: 58 }
const SURFACES: Surface[] = ['hard', 'clay', 'grass']

function play(seed: string, surface: Surface = 'hard'): AnnotatedMatch {
  const opts: MatchOptions = { surface, tour: 'wta', seed }
  return annotateMatch(simulateMatch(A, B, opts), A, B, opts)
}

function corpus(n: number): AnnotatedMatch[] {
  const out: AnnotatedMatch[] = []
  for (let i = 0; i < n; i++) out.push(play(`c-${i}`, SURFACES[i % SURFACES.length]))
  return out
}

const commentate = (m: AnnotatedMatch): Beat[] => buildCommentary(m, A.name, B.name)

describe('commentary – determinism', () => {
  it('the same match narrates identically, twice in a row', () => {
    const m = play('det-1')
    expect(commentate(m)).toEqual(commentate(m))
  })

  it('a REPLAY narrates identically – re-simulate from the stored seed, re-annotate, re-build', () => {
    // This is exactly the path MatchReplay/PracticeFlow take: the result is already committed and
    // the viewer re-runs simulateMatch under the SAME seed. If the commentary ever depended on
    // anything outside (match, names) this is the test that would catch it.
    for (const seed of ['replay-a', 'replay-b', 'replay-c']) {
      expect(commentate(play(seed))).toEqual(commentate(play(seed)))
    }
  })

  it('draws ZERO random numbers – not from the main stream, not from a sub-stream', () => {
    // Behavioural, not a source grep: Math.random is booby-trapped for the duration of the build.
    // (An engine RNG would not be caught by this, which is what the source pin below is for.)
    const m = play('det-rng')
    const real = Math.random
    Math.random = () => {
      throw new Error('commentary must not draw randomness')
    }
    try {
      expect(commentate(m).length).toBeGreaterThan(0)
    } finally {
      Math.random = real
    }
  })

  it('the module imports no RNG at all, so the frozen MAIN capture cannot move by construction', () => {
    const src = readFileSync(new URL('../../src/viz/commentary.ts', import.meta.url), 'utf8')
    // ⚠ If phrase variety ever DOES need a stream, this pin is the thing to re-aim – and the
    // replacement must be a purpose-scoped sub-stream (`rngFromSeed(seed + ':commentary')`, the
    // diary/outcall idiom), never the main one. Today it needs none: variety comes from a hash of
    // the point index, which is a pure function of the match.
    expect(src).not.toMatch(/from '.*engine\/rng'/)
    expect(src).not.toContain('Math.random')
  })
})

describe('commentary – volume discipline', () => {
  // The whole feature dies if it becomes a point log. A ~200-point three-setter must not produce
  // ~70 lines; the target the design was written to is "a handful of real beats per set".
  it('lands at a handful of beats per set across 200 matches, and never at point-log density', () => {
    const perSet: number[] = []
    let worstMatch = 0
    for (const m of corpus(200)) {
      const beats = commentate(m)
      const sets = m.result.sets.length
      perSet.push(beats.length / sets)
      worstMatch = Math.max(worstMatch, beats.length / m.points.length)
    }
    const mean = perSet.reduce((a, b) => a + b, 0) / perSet.length
    const max = Math.max(...perSet)
    expect(mean, `mean beats/set = ${mean.toFixed(2)}`).toBeLessThan(8)
    expect(mean).toBeGreaterThan(3) // and it must still SAY something
    expect(max, `worst set = ${max.toFixed(2)} beats`).toBeLessThanOrEqual(14)
    // A point log would sit near 1.0. Even the chattiest match here stays far under a fifth.
    expect(worstMatch, `worst beats/point = ${worstMatch.toFixed(3)}`).toBeLessThan(0.2)
  })

  it('at most one streak and at most one rally beat per set', () => {
    for (const m of corpus(60)) {
      const perSet = new Map<string, number>()
      for (const b of commentate(m)) {
        if (b.kind !== 'streak' && b.kind !== 'rally') continue
        const key = `${b.set}:${b.kind}`
        perSet.set(key, (perSet.get(key) ?? 0) + 1)
      }
      for (const [key, n] of perSet) expect(n, key).toBe(1)
    }
  })
})

// =================================================================================================
// THE KEY CUT (owner, 06.08): «сам матч идёт быстрее и показывает ключевые моменты, но в тексте
// трансляции вообще ничего не меняется, надо это синхронизировать ... может быть мы можем full/key
// моменты сделать больше отличий».
//
// The switch used to reach `buildTimeline` and nothing else, so both modes always printed the same
// log. `Beat.keyMoment` is the tighter cut, and these are its properties as a CUT - the module's own
// header states the rule, and a test that re-derived the rule could only ever agree with it. So what
// is asserted here is what the cut has to be TRUE OF whatever the rule is: a real subset, never
// empty, never everything, and never missing the beats that give a match its shape.
// =================================================================================================
describe('commentary – the key cut', () => {
  const STRUCTURAL = new Set(['open', 'set', 'tiebreak', 'match'])

  it('⚠ is a strict, proper subset: smaller than the full log on nearly every match, never larger', () => {
    let smaller = 0
    let full = 0
    let key = 0
    const matches = corpus(200)
    for (const m of matches) {
      const beats = commentate(m)
      const cut = beats.filter((b) => b.keyMoment)
      // Same beats, not new ones: the cut is a filter over the list the full mode shows.
      for (const b of cut) expect(beats).toContain(b)
      expect(cut.length).toBeLessThanOrEqual(beats.length)
      if (cut.length < beats.length) smaller++
      full += beats.length
      key += cut.length
    }
    // If this drops, the switch has stopped being visible to a player - which IS the reported bug.
    expect(smaller / matches.length, 'the cut left most matches untouched').toBeGreaterThan(0.95)
    // ...and the density band. Measured at 58% (KEY_SWING = 0.10, see the constant's own table); the
    // band is wide enough to survive a tuning nudge and narrow enough to fail "keep everything"
    // (100%) and "keep only the scaffolding" (~30%).
    const share = key / full
    expect(share, `key kept ${(share * 100).toFixed(0)}% of full`).toBeGreaterThan(0.4)
    expect(share, `key kept ${(share * 100).toFixed(0)}% of full`).toBeLessThan(0.75)
  })

  it('⚠ always keeps the shape of the match: the opener, every set, every tiebreak, the ending', () => {
    // A highlights package that can lose the set it was won in is not a highlights package. These
    // four kinds are in by construction and this is what says so - it is the assertion that fails if
    // the swing test is ever let loose on them.
    for (const m of corpus(120)) {
      for (const b of commentate(m)) {
        if (STRUCTURAL.has(b.kind)) expect(b.keyMoment, `${b.kind} beat dropped from the key cut`).toBe(true)
      }
    }
  })

  it('⚠ still tells a story: no match is cut down to its scaffolding alone', () => {
    // The floor the constant was chosen against. Four rows is the three structural beats of a
    // straight-sets match plus one thing that actually happened; below that the log stops being
    // commentary. Measured at KEY_SWING = 0.10: 4% of matches sit at the floor, none under it.
    let thin = 0
    const matches = corpus(200)
    for (const m of matches) {
      const cut = commentate(m).filter((b) => b.keyMoment)
      expect(cut.length, 'a match with nothing in its key log at all').toBeGreaterThanOrEqual(2)
      if (cut.length < 4) thin++
    }
    expect(thin / matches.length, `${thin} of ${matches.length} matches fell to scaffolding`).toBeLessThan(0.1)
  })

  it('⚠ is decided by the match and nothing else - the same match cuts the same way twice', () => {
    // The determinism rule reaches the new field too: `keyMoment` reads winProbA, which is the
    // engine's, and draws nothing of its own.
    for (const seed of ['cut-a', 'cut-b', 'cut-c']) {
      const one = commentate(play(seed)).map((b) => `${b.pointIndex}:${b.keyMoment}`)
      const two = commentate(play(seed)).map((b) => `${b.pointIndex}:${b.keyMoment}`)
      expect(two).toEqual(one)
    }
  })
})

describe('commentary – shape', () => {
  it('is chronological, one beat per point, and bracketed by the opener and the match beat', () => {
    for (const m of corpus(60)) {
      const beats = commentate(m)
      const indices = beats.map((b) => b.pointIndex)
      expect([...indices].sort((x, y) => x - y)).toEqual(indices)
      expect(new Set(indices).size).toBe(indices.length)
      expect(beats[0].kind).toBe('open')
      expect(beats[0].pointIndex).toBe(0)
      expect(beats[beats.length - 1].kind).toBe('match')
      expect(beats[beats.length - 1].pointIndex).toBe(m.points.length - 1)
      expect(beats.filter((b) => b.kind === 'match')).toHaveLength(1)
      expect(beats.filter((b) => b.kind === 'open')).toHaveLength(1)
      // The LAST set is told by the match beat, so a `set` beat exists for every set but that one.
      //
      // ⚠ RE-AIMED, NOT RELAXED (10.08, the retirement slice). The claim above is a statement about
      // COMPLETED sets that could be written as `sets.length - 1` only while the last element of
      // `sets` was always the one the match beat tells. A retirement stops mid-set, so its last
      // element is a set nobody won and no `set` beat may claim – and when she stops at a change of
      // ends the partial set is trimmed altogether, which is the case that failed here (2 completed
      // sets, 2 elements, and the old arithmetic asked for 1). The assertion is now the sentence it
      // always meant: ONE `set` BEAT PER SET THE POINT LOG ACTUALLY ENDED, minus the last one on a
      // completed match because the match beat tells it. Counted off the log rather than off
      // `sets.length`, so it can never drift from the thing it is about again.
      const setEnds = m.points.filter((p) => p.setEnd).length
      expect(beats.filter((b) => b.kind === 'set')).toHaveLength(
        m.result.retired ? setEnds : setEnds - 1,
      )
      // ...and the old arithmetic is still asserted on every match it was ever true of.
      if (!m.result.retired) {
        expect(beats.filter((b) => b.kind === 'set')).toHaveLength(m.result.sets.length - 1)
      }
      for (const b of beats) expect(b.set).toBeGreaterThanOrEqual(1)
    }
  })

  it('an empty match produces nothing rather than throwing', () => {
    const empty = { ...play('shape-empty'), points: [] }
    expect(buildCommentary(empty, A.name, B.name)).toEqual([])
  })
})

describe('commentary – honesty (a beat may claim nothing the point log does not carry)', () => {
  it("a `break` beat only ever sits on a game the RETURNER won, and never inside a tiebreak", () => {
    for (const m of corpus(60)) {
      for (const b of commentate(m).filter((x) => x.kind === 'break')) {
        const p = m.points[b.pointIndex]
        expect(p.gameEnd, 'break beats sit on a game end').toBe(true)
        expect(p.entry.tiebreak).toBe(false)
        expect(p.entry.winner).not.toBe(p.entry.server)
      }
    }
  })

  it('a `hold` beat only ever sits on a game the SERVER won', () => {
    for (const m of corpus(60)) {
      for (const b of commentate(m).filter((x) => x.kind === 'hold')) {
        const p = m.points[b.pointIndex]
        expect(p.gameEnd).toBe(true)
        expect(p.entry.winner).toBe(p.entry.server)
        expect(p.setEnd, 'a set-deciding hold is told by the set beat, not twice').toBe(false)
      }
    }
  })

  it('a `set` beat sits on a set end, and the `match` beat on the final point', () => {
    for (const m of corpus(60)) {
      const beats = commentate(m)
      for (const b of beats.filter((x) => x.kind === 'set')) {
        expect(m.points[b.pointIndex].setEnd).toBe(true)
        expect(b.pointIndex).not.toBe(m.points.length - 1)
      }
      const match = beats[beats.length - 1]
      // It carries the actual scoreline, whichever way the match ended.
      expect(match.score).toBe(m.result.sets.map((s) => `${s.a}-${s.b}`).join('  '))
      // ⚠ RE-AIMED, NOT RELAXED (10.08, the retirement slice). "The match beat sits on a set end" was
      // true because a match could only end by somebody winning a set. A RETIREMENT ends a match
      // WITHOUT ending a set – she stops at 4-6 6-4 4-2 – so the beat now has two shapes and both are
      // asserted, in full. Nothing above is weakened: every completed match still has to satisfy the
      // original three claims, verbatim, in the else branch.
      const winnerName = m.result.winner === 0 ? 'Bianca' : 'Dana'
      const retiredName = m.result.retired?.side === 0 ? 'Bianca' : 'Dana'
      if (m.result.retired) {
        // The beat may not claim a set was won. It must name who stopped and who went through, and
        // must NOT contain either of the completed-match phrases – "takes it in straight sets" on a
        // retirement is the exact lie this block exists to stop.
        expect(match.lead).toBe('Retired.')
        expect(match.text.startsWith(retiredName)).toBe(true)
        expect(match.text).toContain(winnerName)
        expect(match.text).not.toContain('straight sets')
        expect(match.text).not.toContain('in three')
      } else {
        expect(m.points[match.pointIndex].setEnd).toBe(true)
        // It names the actual winner and carries the actual scoreline.
        expect(match.text.startsWith(winnerName)).toBe(true)
        expect(match.text).toContain(m.result.sets.length === 3 ? 'in three' : 'straight sets')
      }
    }
  })

  // ⚠ AND THE SWEEP ABOVE HAS TO ACTUALLY REACH ONE (10.08). A retirement fires in ~2.7% of matches,
  // so a 60-match corpus sees it about four times in five runs – i.e. the two re-aimed branches above
  // could have gone green on a corpus that never took the new arm at all. This builds the case
  // directly instead of hoping for it: a pair with nothing left in the tank, played until one of them
  // stops, then narrated.
  it('a RETIREMENT is narrated as one, and the corpus can really produce it', () => {
    const spent: MatchPlayer = { ...A, stamina: 10 }
    const other: MatchPlayer = { ...B, stamina: 10 }
    let found = 0
    for (let i = 0; i < 400 && found < 5; i++) {
      const opts: MatchOptions = { surface: 'hard', tour: 'wta', seed: `ret-narr-${i}` }
      const res = simulateMatch(spent, other, opts)
      if (!res.retired) continue
      found++
      const m = annotateMatch(res, spent, other, opts)
      const beats = buildCommentary(m, spent.name, other.name)
      const last = beats[beats.length - 1]
      expect(last.kind).toBe('match')
      expect(last.lead).toBe('Retired.')
      expect(last.pointIndex).toBe(m.points.length - 1)
      expect(m.points[last.pointIndex].setEnd, 'a retirement does not end a set').toBe(false)
      expect(last.text).not.toContain('straight sets')
      // Every other honesty property still holds: chronological, unique indices, opener first.
      const indices = beats.map((b) => b.pointIndex)
      expect([...indices].sort((x, y) => x - y)).toEqual(indices)
      expect(new Set(indices).size).toBe(indices.length)
      expect(beats[0].kind).toBe('open')
    }
    expect(found, 'the fixture must actually produce retirements').toBeGreaterThan(0)
  })

  it('a `streak` beat counts a run that really ended on that point', () => {
    const NUM: Record<string, number> = {
      Six: 6, Seven: 7, Eight: 8, Nine: 9, Ten: 10, Eleven: 11, Twelve: 12,
      Thirteen: 13, Fourteen: 14, Fifteen: 15, Sixteen: 16, Seventeen: 17,
      Eighteen: 18, Nineteen: 19, Twenty: 20,
    }
    let seen = 0
    for (const m of corpus(60)) {
      for (const b of commentate(m).filter((x) => x.kind === 'streak')) {
        const word = b.text.split(' ')[0]
        const claimed = NUM[word] ?? Number(word)
        expect(Number.isFinite(claimed), b.text).toBe(true)
        expect(claimed).toBeGreaterThanOrEqual(6)
        const side = m.points[b.pointIndex].entry.winner
        // Count backwards from the anchor: the claimed run must actually be there...
        let actual = 0
        for (let i = b.pointIndex; i >= 0 && m.points[i].entry.winner === side; i--) actual++
        expect(actual, b.text).toBe(claimed)
        // ...and it must have ENDED here (the next point went the other way, or the match did).
        const next = m.points[b.pointIndex + 1]
        expect(next === undefined || next.entry.winner !== side, 'the run ended on its anchor').toBe(true)
        expect(b.text).toContain(side === 0 ? 'Bianca' : 'Dana')
        seen++
      }
    }
    expect(seen, 'the corpus must actually contain streaks').toBeGreaterThan(20)
  })

  it('a `rally` beat counts the shots that are really in the rally, and it ended in a winner', () => {
    let seen = 0
    for (const m of corpus(60)) {
      for (const b of commentate(m).filter((x) => x.kind === 'rally')) {
        const shots = m.points[b.pointIndex].rally.shots
        expect(shots.length).toBeGreaterThanOrEqual(12)
        expect(shots[shots.length - 1].result).toBe('winner')
        expect(b.text).toContain(shots[shots.length - 1].by === 0 ? 'Bianca' : 'Dana')
        seen++
      }
    }
    expect(seen).toBeGreaterThan(20)
  })

  it('a `tiebreak` beat only fires at six games all, before the breaker is played', () => {
    let seen = 0
    for (const m of corpus(120)) {
      for (const b of commentate(m).filter((x) => x.kind === 'tiebreak')) {
        expect(b.score).toBe('6-6')
        expect(m.points[b.pointIndex].gameEnd).toBe(true)
        expect(m.points[b.pointIndex].setEnd).toBe(false)
        expect(m.points[b.pointIndex + 1].entry.tiebreak).toBe(true)
        seen++
      }
    }
    expect(seen, 'the corpus must actually contain tiebreaks').toBeGreaterThan(10)
  })

  it('every "saves N match/set points" claim is backed by the point log', () => {
    let matchPoints = 0
    for (const m of corpus(120)) {
      for (const b of commentate(m).filter((x) => x.kind === 'hold')) {
        const held = m.points[b.pointIndex].entry.winner
        const other: Side = held === 0 ? 1 : 0
        // Walk back over the game this beat closed and count what the log actually says.
        let faced = 0
        for (let i = b.pointIndex; i >= 0; i--) {
          if (m.points[i].entry.matchPointFor === other) faced++
          if (i < b.pointIndex && m.points[i].gameEnd) break
        }
        if (b.text.includes('match point')) {
          expect(faced, b.text).toBeGreaterThan(0)
          matchPoints++
        } else {
          expect(faced, `"${b.text}" hides a saved match point`).toBe(0)
        }
      }
    }
    expect(matchPoints, 'the corpus must contain saved match points').toBeGreaterThan(3)
  })
})

describe('commentary – copy rules', () => {
  it('no long dash, no Cyrillic, no leftover digits-as-words, and every line is a sentence', () => {
    for (const m of corpus(80)) {
      for (const b of commentate(m)) {
        const line = `${b.lead ?? ''} ${b.text}`
        expect(line, 'player copy uses the short dash only').not.toContain('—')
        expect(line).not.toMatch(/[Ѐ-ӿ]/)
        expect(b.text.endsWith('.'), b.text).toBe(true)
        expect(b.text[0], b.text).toBe(b.text[0].toUpperCase())
        // Leads are TAGS, not sentences – they have to fit the log row's accent slot.
        if (b.lead !== null) expect(b.lead.length).toBeLessThanOrEqual(10)
        // Nothing may run away with the row: two or three short sentences, never a paragraph.
        expect(b.text.length, b.text).toBeLessThanOrEqual(120)
      }
    }
  })

  it('players are told apart by name in every beat that names anyone', () => {
    // The one ambiguity worth guarding: two players who share a first name fall back to the full
    // name for BOTH, so no row can be read as being about the wrong girl.
    const m = play('copy-names')
    const clash = buildCommentary(m, 'Mila Tran', 'Mila Delgado')
    for (const b of clash) {
      expect(b.text.includes('Mila Tran') || b.text.includes('Mila Delgado') || !b.text.includes('Mila')).toBe(true)
    }
  })

  it('a label that is not a person keeps its whole name ("Top seed", not "Top")', () => {
    // The Season screen's exhibition opponent really is called "Top seed", and the first-name rule
    // was writing "Top sends it long." Found in the browser, not in the suite.
    const m = play('copy-label')
    for (const b of buildCommentary(m, 'Vera Martin', 'Top seed')) {
      expect(b.text, b.text).not.toMatch(/\bTop\b(?! seed)/)
      if (b.text.includes('Vera')) expect(b.text).not.toContain('Vera Martin')
    }
  })
})

// =================================================================================================
// ROUND 16 ITEM 11 (owner, 11.08): «full показывает почти ничего». What he was looking at was not a
// row count – `full` sits at ~16 beats a match and always has – it was the SAMENESS. Three fixes,
// and these are their properties as BEHAVIOUR: what the log has to be true of, not what the file
// says. See the module header for the mechanisms.
// =================================================================================================
describe('commentary – item 11: it stopped repeating itself', () => {
  it('⚠ never prints the same sentence twice in a row, and rarely twice in a match', () => {
    // THE ROTOR'S WHOLE JOB. `variant()` is a hash of the point index with no memory, so a break-heavy
    // set could print "Bianca breaks." three times, twice of them adjacent. Adjacency is the hard
    // rule (it is what a reader actually notices); the whole-log rate is the softer one, and it is
    // measured rather than asserted at zero because two different sets legitimately containing the
    // identical event should say the identical true thing.
    let rows = 0
    let repeats = 0
    for (const m of corpus(200)) {
      const beats = commentate(m)
      const seen = new Map<string, number>()
      for (let i = 0; i < beats.length; i++) {
        rows++
        if (i > 0) {
          expect(beats[i].text, `two identical rows in a row: "${beats[i].text}"`).not.toBe(beats[i - 1].text)
        }
        const n = (seen.get(beats[i].text) ?? 0) + 1
        seen.set(beats[i].text, n)
        if (n > 1) repeats++
      }
    }
    // Measured: 2.4% before the rotor, 1.4% after. The band is wide enough to survive a copy change
    // and tight enough to fail a regression to the memoryless hash.
    const rate = repeats / rows
    expect(rate, `${(100 * rate).toFixed(1)}% of rows repeat a sentence already in their own log`).toBeLessThan(0.02)
  })

  it('⚠ the industry template really is in use, and it is honest about the ball', () => {
    // `{Player} {wins|loses} the {point|game|set} with {a descriptor}` – the shape every real
    // deterministic feed emits. Two things are checked: that it FIRES (a mould nothing reaches is
    // not a mould), and that every descriptor it emits is backed by the shot the point ended on.
    let used = 0
    for (const m of corpus(120)) {
      for (const b of commentate(m)) {
        const withPhrase = /(wins|loses) the (point|game|set) with (.+)\./.exec(b.text)
        if (!withPhrase) continue
        used++
        const descriptor = withPhrase[3]
        const p = m.points[b.pointIndex]
        const shots = p.rally.shots
        const last = shots[shots.length - 1]
        if (descriptor.includes('ace')) {
          expect(p.rally.ace, `"${b.text}" claims an ace`).toBe(true)
          // ...and "second-serve" is a claim about which delivery it was.
          if (descriptor.includes('second-serve')) expect(last.kind).toBe('serve2')
          else expect(last.kind).toBe('serve1')
        } else if (descriptor.includes('double fault')) {
          expect(p.rally.doubleFault, `"${b.text}" claims a double fault`).toBe(true)
        } else if (descriptor.includes('winner')) {
          expect(last.result, `"${b.text}" claims a winner`).toBe('winner')
        } else {
          // An error. The miss direction and whether it was struck on the RETURN are both derived,
          // so both are checked against the rally.
          expect(last.result === 'net' || last.result === 'out', b.text).toBe(true)
          if (descriptor.includes('netted')) expect(last.result).toBe('net')
          const firstRally = shots.findIndex((s) => s.kind === 'rally')
          const onReturn = firstRally >= 0 && firstRally === shots.length - 1
          expect(descriptor.includes('return'), `"${b.text}" vs shot ${shots.length - 1}/${firstRally}`).toBe(onReturn)
        }
        // ⚠ AND NEVER A WING. We model no forehand/backhand, so the descriptor may not have one –
        // this is the exact slot the real feeds fill and we deliberately cannot.
        expect(descriptor, 'a wing was invented').not.toMatch(/forehand|backhand|volley|smash/)
      }
    }
    expect(used, 'the industry mould never fired at all').toBeGreaterThan(100)
  })

  it('⚠ the score is never inside a sentence – it is a separate element, as in every real feed', () => {
    // live-text-adult-tour.md §2.2, and it is universal across IBM, Infosys, Flashscore and
    // Sofascore. `Beat.score` is that element. A game score in the prose would be the tell.
    for (const m of corpus(80)) {
      for (const b of commentate(m)) {
        expect(b.text, `"${b.text}" carries a game score`).not.toMatch(/\b\d+\s*[-:]\s*\d+\b/)
      }
    }
  })

  it('a `games` beat counts a run of GAMES that really happened, and only the longest in its set', () => {
    const NUM: Record<string, number> = {
      Four: 4, Five: 5, Six: 6, Seven: 7, Eight: 8, Nine: 9, Ten: 10, Eleven: 11, Twelve: 12,
    }
    let seen = 0
    for (const m of corpus(120)) {
      const perSet = new Map<number, number>()
      for (const b of commentate(m).filter((x) => x.kind === 'games')) {
        const claimed = NUM[b.text.split(' ')[0]] ?? Number(b.text.split(' ')[0])
        expect(Number.isFinite(claimed), b.text).toBe(true)
        expect(claimed).toBeGreaterThanOrEqual(4)
        // It sits on a game end, and the run really is there: walk back over game ends.
        const p = m.points[b.pointIndex]
        expect(p.gameEnd, 'a games beat sits on a game end').toBe(true)
        const side = p.entry.winner
        let actual = 0
        for (let i = b.pointIndex; i >= 0; i--) {
          if (!m.points[i].gameEnd) continue
          if (m.points[i].entry.winner !== side) break
          actual++
        }
        expect(actual, b.text).toBe(claimed)
        expect(b.text).toContain(side === 0 ? 'Bianca' : 'Dana')
        perSet.set(b.set, (perSet.get(b.set) ?? 0) + 1)
        seen++
      }
      for (const [set, n] of perSet) expect(n, `set ${set} has ${n} run beats`).toBe(1)
    }
    // ⚠ THE FLOOR IS LOW ON PURPOSE, and finding out why is what this number is for. A run of four
    // exists 0.43 times a set, but its anchor is a game end - where a `break` or `hold` beat also
    // sits and outranks it. So most runs are absorbed by the game's own story and the score column
    // beside it, and what survives is the quiet game in the middle of a rout: measured at 49 over
    // 120 matches, i.e. the beat fires in about a third of them. See PRIORITY for the reasoning.
    expect(seen, 'the corpus must actually contain game runs').toBeGreaterThan(25)
  })
})

describe('commentary – item 11: the register ladder', () => {
  // The escalation ladder (docs/research/commentary-lexicon.md §5.3) says the top of a match is not
  // the bottom of it with more adjectives: it is SHORTER and it stops looking ahead. `pointImportance`
  // is the same arithmetic the builder used, so these assert the rules rather than the source text.
  it('⚠ a peak beat is shorter than the ordinary budget and never looks ahead', () => {
    let peaks = 0
    for (const m of corpus(200)) {
      const imp = pointImportance(m)
      for (const b of commentate(m)) {
        if (b.kind === 'match' || b.kind === 'open') continue // the match beat writes its own ending
        if ((imp[b.pointIndex] ?? 0) < PEAK_IMPORTANCE) continue
        peaks++
        expect(b.text.length, `peak row over budget: "${b.text}"`).toBeLessThanOrEqual(88)
        expect(b.text, `a peak row looked ahead: "${b.text}"`).not.toContain('serves for the set next')
      }
    }
    expect(peaks, 'nothing in the corpus ever reached the top of the ladder').toBeGreaterThan(150)
  })

  it('⚠ ...and the ladder has a bottom too, so the constant is not just "everything"', () => {
    // Anti-vacuity, and the measurement the constant was chosen against: 11% of beats at 0.15.
    let peak = 0
    let all = 0
    for (const m of corpus(200)) {
      const imp = pointImportance(m)
      for (const b of commentate(m)) {
        all++
        if ((imp[b.pointIndex] ?? 0) >= PEAK_IMPORTANCE) peak++
      }
    }
    const share = peak / all
    expect(share, `${(100 * share).toFixed(0)}% of beats are at the peak`).toBeGreaterThan(0.04)
    expect(share, `${(100 * share).toFixed(0)}% of beats are at the peak`).toBeLessThan(0.25)
  })

  it('importance is exact, deterministic, and agrees with the engine about who is winning', () => {
    // Morris importance is a difference of two match-win probabilities, so it is bounded, and the
    // most important point of a match must be at least as important as its median. Both are
    // properties of the definition rather than of our thresholds.
    for (const seed of ['imp-a', 'imp-b', 'imp-c']) {
      const m = play(seed)
      const one = pointImportance(m)
      expect(pointImportance(play(seed))).toEqual(one)
      for (const x of one) {
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThanOrEqual(1)
      }
      const sorted = [...one].sort((a, b) => a - b)
      expect(Math.max(...one)).toBeGreaterThan(sorted[Math.floor(sorted.length / 2)])
    }
  })
})

// =================================================================================================
// ROUND 16 ITEM 18 – the retirement, which the owner called «максимально неявно». The beat existed
// and said almost nothing; what it has to do now is say that a BODY stopped, why, and that the
// opponent ADVANCED rather than won.
// =================================================================================================
describe('commentary – item 18: a retirement is explained, not just recorded', () => {
  const spent: MatchPlayer = { ...A, stamina: 10 }
  const other: MatchPlayer = { ...B, stamina: 10 }

  /** Retirements, built directly rather than hoped for – the same fixture the shape suite uses. */
  function retirements(n: number): { m: AnnotatedMatch; a: MatchPlayer; b: MatchPlayer }[] {
    const out: { m: AnnotatedMatch; a: MatchPlayer; b: MatchPlayer }[] = []
    for (let i = 0; i < 600 && out.length < n; i++) {
      const opts: MatchOptions = { surface: 'hard', tour: 'wta', seed: `ret-16-${i}` }
      const res = simulateMatch(spent, other, opts)
      if (!res.retired) continue
      out.push({ m: annotateMatch(res, spent, other, opts), a: spent, b: other })
    }
    return out
  }

  it('⚠ says a body stopped, says the winner ADVANCED, and never says she was beaten', () => {
    const cases = retirements(8)
    expect(cases.length, 'the fixture must actually produce retirements').toBeGreaterThan(4)
    for (const { m } of cases) {
      const beats = buildCommentary(m, spent.name, other.name)
      const last = beats[beats.length - 1]
      const stopped = m.result.retired!.side === 0 ? 'Bianca' : 'Dana'
      const through = m.result.winner === 0 ? 'Bianca' : 'Dana'
      expect(last.lead).toBe('Retired.')
      expect(last.text.startsWith(stopped), last.text).toBe(true)
      // ⚠ THE VERB IS THE POINT. The rulebooks are explicit that the opponent ADVANCES and did not
      // beat her (commentary-lexicon.md §4.6), and the scoreboard word "goes through" is what the
      // owner read as an event with no explanation.
      expect(last.text, last.text).toContain(`${through} advances`)
      expect(last.text, 'a retirement was narrated as a defeat').not.toMatch(/\bbeats\b|\bbeat\b|takes it in/)
      // ...and it explains itself rather than only recording.
      expect(last.text, last.text).toMatch(/cannot go on/)
      expect(last.text.length, last.text).toBeLessThanOrEqual(120)
    }
  })

  it('⚠ "a long match on tired legs" is licensed by the engine, not by the copywriter', () => {
    // `retireHazard` is RETIRE_K * spentness(...), and spentness is EXACTLY ZERO up to FATIGUE_START.
    // So every retirement this engine can produce happened past 120 points – which is what makes the
    // sentence true by construction rather than a guess. If the hazard ever stops reading fatigue,
    // this fails and the sentence must go with it.
    const cases = retirements(8)
    for (const { m } of cases) {
      expect(m.points.length, 'a retirement inside the fatigue-free window').toBeGreaterThan(120)
      const last = buildCommentary(m, spent.name, other.name).slice(-1)[0]
      expect(last.text).toContain('A long match on tired legs.')
    }
  })

  it('the explanation degrades before the claim does, when two players share a first name', () => {
    // Both names go formal on a clash, which costs the row eleven characters. The CAUSE has to
    // survive that and only the flourish may go – `clauses()`'s ordering doing real work.
    const { m } = retirements(1)[0]
    const clash = buildCommentary(m, 'Mila Tran', 'Mila Delgado')
    const last = clash[clash.length - 1]
    expect(last.text).toContain('cannot go on')
    expect(last.text).toContain('advances')
    expect(last.text).toContain('A long match on tired legs.')
    expect(last.text.length).toBeLessThanOrEqual(120)
  })
})

// =================================================================================================
// ROUND 21 ITEM 3 (owner, 14.08, SECOND ASK): «И ещё раз: проверь пожалуйста что с комментариями
// текстовой трансляции на 1000 и шлемах, кажется ничего не изменилось».
//
// He was right, and the measurement is the whole point of this block. BEFORE
// (tools/commentary-rung-probe.ts, 200 seeded matches): every rung produced 16.07 beats a match out
// of 483 distinct phrasings and **0.0% of rows differed** between a J30 first round and a Grand Slam
// final - not "similar", identical, because `buildCommentary` took three arguments and none of them
// was the tournament. AFTER: 650/653 phrasings at storey 3 and 749/758 at storey 4, with 59.7% of
// rows differing from the J30 arm.
//
// ⚠ EVERY TEST BELOW HAS TO FAIL IF THE RUNG IS IGNORED. Mutating `storeyFor` to `return 1` (or
// dropping the fourth argument at the call site) turns this whole describe red; a test that only
// checked "commentary exists" would not have.
// =================================================================================================
describe('commentary – item 3: the log knows which rung she is playing on', () => {
  /** The draws as they stand after the 14.08 wave: a Slam is 128 (seven rounds) and a 1000 is 64
   *  (six). Named here so a copy rule that assumed five rounds or a 32 draw shows up as a failure. */
  const SLAM_DRAW = 128
  const THOUSAND_DRAW = 64
  const J30_DRAW = 32

  const stage = (round: number, drawSize: number): string => {
    const remaining = drawSize / 2 ** round
    if (remaining === 2) return 'Final'
    if (remaining === 4) return 'Semifinal'
    if (remaining === 8) return 'Quarterfinal'
    return `Round of ${remaining}`
  }

  const J30_R1 = { tier: 'j30' as const, roundLabel: stage(0, J30_DRAW) }
  const J30_FINAL = { tier: 'j30' as const, roundLabel: 'Final' }
  const NATIONAL_FINAL = { tier: 'national' as const, roundLabel: 'Final' }
  const W75_R1 = { tier: 'w75' as const, roundLabel: stage(0, J30_DRAW) }
  const THOUSAND_R1 = { tier: 'wta1000' as const, roundLabel: stage(0, THOUSAND_DRAW) }
  const SLAM_R1 = { tier: 'slam' as const, roundLabel: stage(0, SLAM_DRAW) }
  const SLAM_FINAL = { tier: 'slam' as const, roundLabel: 'Final' }

  const rows = (m: AnnotatedMatch, event: Parameters<typeof buildCommentary>[3]): string[] =>
    buildCommentary(m, A.name, B.name, event).map((b) => `${b.lead ?? '-'}|${b.text}`)

  /** The row with names and numbers masked out, so what is left is the PHRASING - the "sameness"
   *  measure the owner is actually reporting. */
  const shape = (line: string): string =>
    line.split(A.name).join('{P}').split(B.name).join('{P}').split('Bianca').join('{P}').split('Dana').join('{P}')
      .replace(/\b\d+\b/g, '#')

  /** The same, with the COUNTED WORDS masked too ("six break points" -> "# break points"). ⚠ THE
   *  SUBSET CLAIM BELOW NEEDS THIS AND `shape` ALONE IS NOT ENOUGH: a pool is additive, but an
   *  observed sample is not - a rare count like "six break points" can be phrased one way at storey 2
   *  and the other way at storey 3 in a 120-match corpus, and the base mould then never appears
   *  beside that number at all. That is a fact about the sample, not a lost phrasing, and masking the
   *  count is what tells the two apart. Found by this test failing on exactly that row. */
  const NUM_WORD =
    /\b(a|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b/gi
  const mould = (line: string): string => shape(line).replace(NUM_WORD, '#')

  const phrasings = (event: Parameters<typeof buildCommentary>[3], n = 120): Set<string> => {
    const out = new Set<string>()
    for (const m of corpus(n)) for (const line of rows(m, event)) out.add(shape(line))
    return out
  }

  it('⚠ THE OWNER\'S OWN QUESTION: a Grand Slam final and a J30 first round do not read the same', () => {
    let differing = 0
    let total = 0
    let identicalMatches = 0
    for (const m of corpus(80)) {
      const junior = rows(m, J30_R1)
      const slam = rows(m, SLAM_FINAL)
      // ⭐ ROUND-23 #4: the Slam log is LONGER now, and that is the fix rather than a drift. It used
      // to be the same rows in different words, which is precisely why he could not see the round-21
      // change - see BARS and THE LONG GAME in the source. A row the junior has and the Slam does not
      // is still counted as differing, which is what makes the comparison honest at unequal lengths.
      expect(slam.length, 'a bigger occasion may never say LESS').toBeGreaterThanOrEqual(junior.length)
      let same = slam.length === junior.length
      for (let i = 0; i < Math.max(junior.length, slam.length); i++) {
        total++
        if (junior[i] !== slam[i]) {
          differing++
          same = false
        }
      }
      if (same) identicalMatches++
    }
    // BEFORE this landed both numbers were 0 and 80 respectively, which is the report he filed.
    expect(identicalMatches, 'a whole match narrated identically at both ends of the ladder').toBe(0)
    expect(differing / total, `only ${((100 * differing) / total).toFixed(1)}% of rows differ by rung`).toBeGreaterThan(
      0.4,
    )
  })

  it('⚠ says MORE KINDS OF THING higher up: distinct phrasings grow with the storey', () => {
    const junior = phrasings(J30_R1).size
    const pro = phrasings(W75_R1).size
    const top = phrasings(SLAM_R1).size
    expect(pro, `storey 3 (${pro}) must out-phrase storey 2 (${junior})`).toBeGreaterThan(junior)
    expect(top, `storey 4 (${top}) must out-phrase storey 3 (${pro})`).toBeGreaterThan(pro)
    // ...and by a real margin rather than by one new sentence.
    expect(top / junior).toBeGreaterThan(1.3)
  })

  it('⚠ ...and the growth is ADDITIVE, so a rung never loses a phrasing its junior has', () => {
    // Read on the CLAIM (the beat's first sentence), which is the part the pools decide. The manner
    // clause after it is chosen by the rotor and cut by the budget, so a whole row is not the right
    // unit for a subset claim - see `pool` in the source for the monotonicity rule itself.
    const claims = (event: Parameters<typeof buildCommentary>[3], kind: Beat['kind']): Set<string> => {
      const out = new Set<string>()
      for (const m of corpus(120)) {
        for (const b of buildCommentary(m, A.name, B.name, event)) {
          if (b.kind === kind) out.add(mould(`${b.text.split('. ')[0]}.`))
        }
      }
      return out
    }
    for (const kind of ['break', 'hold', 'streak', 'games'] as const) {
      const junior = claims(J30_R1, kind)
      const pro = claims(W75_R1, kind)
      const top = claims(SLAM_R1, kind)
      for (const c of junior) {
        expect(pro.has(c), `storey 3 lost a "${kind}" phrasing storey 2 has: ${c}`).toBe(true)
        expect(top.has(c), `storey 4 lost a "${kind}" phrasing storey 2 has: ${c}`).toBe(true)
      }
      expect(pro.size, `"${kind}" gained nothing at storey 3`).toBeGreaterThan(junior.size)
      expect(top.size, `"${kind}" gained nothing at storey 4`).toBeGreaterThan(pro.size)
    }
  })

  it('⚠ names the STAKES off the draw sheet, and a 128 draw is read as 128', () => {
    // The 14.08 wave took a Slam to seven rounds and a 1000 to six. Nothing here counts rounds: the
    // stake is parsed out of `stageLabel`'s own label, so every round of the biggest draw resolves.
    const m = play('stakes-1')
    const matchBeat = (event: Parameters<typeof buildCommentary>[3]): string => {
      const beats = buildCommentary(m, A.name, B.name, event)
      return beats[beats.length - 1].text
    }
    const expected: [number, string][] = [
      [0, 'a place in the round of 64'],
      [1, 'a place in the round of 32'],
      [2, 'a place in the round of 16'],
      [3, 'a place in the quarterfinals'],
      [4, 'a place in the semifinals'],
      [5, 'a place in the final'],
      [6, 'the title with it'],
    ]
    expect(expected.length, 'a 128 draw is seven rounds').toBe(Math.log2(SLAM_DRAW))
    for (const [round, said] of expected) {
      const label = stage(round, SLAM_DRAW)
      const text = matchBeat({ tier: 'slam', roundLabel: label })
      expect(text, `${label} of a ${SLAM_DRAW} draw`).toContain(said)
    }
    // The 1000 is a different size and says so: its opener wins into a round of 32, not a round of 64.
    expect(matchBeat(THOUSAND_R1)).toContain('a place in the round of 32')
    expect(stage(0, THOUSAND_DRAW)).toBe('Round of 64')
    // And a J30 opener off a 32 draw is a third answer again.
    expect(matchBeat(J30_R1)).toContain('a place in the round of 16')
    expect(matchBeat(J30_FINAL)).toContain('the title with it')
    // A match with no tournament behind it claims no stake at all.
    expect(matchBeat(null)).not.toContain('a place in')
    expect(matchBeat(null)).not.toContain('the title')
  })

  it('⚠ the CROWD exists from storey 3 up and never below it', () => {
    const ROOM = /crowd|stadium|applause|stands|seat|quiet for it|at the net/i
    for (const m of corpus(40)) {
      for (const event of [null, NATIONAL_FINAL, J30_R1, J30_FINAL]) {
        for (const line of rows(m, event)) {
          expect(ROOM.test(line), `a junior court grew a crowd: ${line}`).toBe(false)
        }
      }
    }
    const heard = corpus(40).flatMap((m) => rows(m, SLAM_FINAL)).filter((l) => ROOM.test(l))
    expect(heard.length, 'nothing in a Grand Slam final mentions the room at all').toBeGreaterThan(20)
  })

  it('⚠ the ladder only ADDS: no occasion, and a storey-1 occasion, narrate byte for byte as before', () => {
    // The regression guard for every existing caller. `buildCommentary(m, a, b)` is what the friendly,
    // the sandbox hit-out, MatchReplay and this whole test file use, and it must be untouched.
    for (const m of corpus(60)) {
      const bare = buildCommentary(m, A.name, B.name)
      expect(buildCommentary(m, A.name, B.name, null)).toEqual(bare)
      expect(buildCommentary(m, A.name, B.name, NATIONAL_FINAL), 'storey 1 is where the file already was')
        .toEqual(bare)
    }
  })

  // ⚠⚠ THIS TEST USED TO ASSERT THE OPPOSITE, AND ASSERTING IT IS WHY THE OWNER ASKED A THIRD TIME.
  // It read "the occasion does not change the CUT: same rows, same key moments, same volume", on the
  // reasoning that escalation is entry LENGTH and vocabulary and never row count. Half of the
  // research says otherwise in the same sentence - live-text-adult-tour.md §2.7 is "ENTRY FREQUENCY
  // and entry length" - and freezing the row count is exactly what left the top of the ladder saying
  // the same things in different words. Round 23 item 4 measured it: 16.20 beats a match at every
  // rung from a J30 to a Slam, +1.1% characters and 1.8% FEWER sentences for a 56% reword.
  //
  // What replaces it is the property that was actually worth protecting, and it is strictly stronger
  // than a row-count freeze: THE LADDER ONLY ADDS. Every bar in `BARS` only ever comes DOWN as the
  // rung goes up, so every candidate a junior rung had is still a candidate above it and no point
  // that spoke can fall silent. A higher rung may swap WHICH beat wins a point (a long game outranks
  // the rally inside it - see PRIORITY), and it may never leave the point empty.
  it('⚠ the ladder only ever ADDS ROWS: a higher rung never goes silent where a junior spoke', () => {
    let juniorRows = 0
    let slamRows = 0
    for (const m of corpus(60)) {
      const junior = buildCommentary(m, A.name, B.name, J30_R1)
      const slam = buildCommentary(m, A.name, B.name, SLAM_FINAL)
      const spoken = new Set(slam.map((b) => b.pointIndex))
      for (const b of junior) {
        expect(spoken.has(b.pointIndex), `a Slam lost the row a J30 has at point ${b.pointIndex}`).toBe(true)
      }
      expect(slam.length, 'a bigger occasion may never say less').toBeGreaterThanOrEqual(junior.length)
      juniorRows += junior.length
      slamRows += slam.length
    }
    // ...and it must be a REAL gain rather than a row here and there, or this is the round-21 fix
    // again wearing a new number. Measured at 1.28 over 200 matches in tools/commentary-rung-probe.ts.
    expect(slamRows / juniorRows, `a Slam says ${(slamRows / juniorRows).toFixed(2)}x what a J30 says`).toBeGreaterThan(
      1.2,
    )
  })

  it('⚠ is still deterministic with an occasion, and still draws nothing', () => {
    for (const seed of ['occ-a', 'occ-b', 'occ-c']) {
      expect(rows(play(seed), SLAM_FINAL)).toEqual(rows(play(seed), SLAM_FINAL))
    }
    const m = play('occ-rng')
    const real = Math.random
    Math.random = () => {
      throw new Error('commentary must not draw randomness')
    }
    try {
      expect(buildCommentary(m, A.name, B.name, SLAM_FINAL).length).toBeGreaterThan(0)
    } finally {
      Math.random = real
    }
  })

  it('every storey obeys the copy rules – the row budget, the short dash, a real sentence', () => {
    for (const m of corpus(60)) {
      for (const event of [NATIONAL_FINAL, J30_FINAL, W75_R1, THOUSAND_R1, SLAM_R1, SLAM_FINAL]) {
        for (const b of buildCommentary(m, A.name, B.name, event)) {
          expect(b.text, 'the row budget is the same at every rung').toHaveLength(
            Math.min(b.text.length, 120),
          )
          expect(b.text.length, b.text).toBeLessThanOrEqual(120)
          expect(b.text.endsWith('.'), b.text).toBe(true)
          expect(b.text[0], b.text).toBe(b.text[0].toUpperCase())
          expect(`${b.lead ?? ''} ${b.text}`).not.toContain('—')
          expect(`${b.lead ?? ''} ${b.text}`).not.toMatch(/[Ѐ-ӿ]/)
        }
      }
    }
  })
})

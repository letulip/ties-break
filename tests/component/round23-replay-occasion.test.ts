// ROUND 23 #4, THE SECOND HALF – A RE-WATCHED MATCH USED TO FALL TO THE BOTTOM OF THE LADDER.
//
// ⚠ THE BUG, AND WHY NOTHING CAUGHT IT FOR TWO ROUNDS. `MatchViewer.previewEvent` is optional and
// defaults to null, and null is the RIGHT answer for two of the four match surfaces (the booked
// friendly, the sandbox hit-out). So a caller that meant null and a caller that forgot rendered
// identically – and exactly one caller, `TournamentFlow`, ever passed it. `MatchReplay` is how a
// match is watched again from BOTH the Season bracket and the Home feed, and it passed nothing: a
// WTA 500 quarter-final re-opened there narrated as storey 1, the poorest log in the game, with no
// stake, no room, no standing and none of the extra beats round 23 gave the professional rungs.
//
// ⚠ MOUNTED, NOT PINNED, and against RENDERED TEXT rather than the component's internals – the rule
// tests/component/match-viewer.test.ts is written under. The intro block is the honest probe: it is
// produced entirely by the storey (`buildPreview`, viz/preview.ts), it renders at mount without any
// playback, and its bottom rung says something a tournament never says.
//
// ⚠ MUTATION-VERIFIED. Changing `:preview-event="previewEvent"` back to nothing in MatchReplay.vue
// turns the first three assertions red with the right message, and the friendly case below stays
// green – which is what proves the net is aimed at the prop and not at the fixture.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MatchReplay from '../../src/components/MatchReplay.vue'
import { occasionOf, storeyOf } from '../../src/viz/preview'
import { buildCommentary } from '../../src/viz/commentary'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { JUNIOR_TOUR } from '../../src/engine/season/tournament'
import { TIERS } from '../../src/engine/season/calendar'
import type { MatchOptions, MatchPlayer } from '../../src/engine/match/types'
import type { WorldMatch } from '../../src/shared/protocol'

const A: MatchPlayer = { id: 'kid', name: 'Vera Novak', serve: 58, ret: 55, composure: 42, stamina: 61, groundstrokes: 56 }
const B: MatchPlayer = { id: 'opp', name: 'Ines Duval', serve: 60, ret: 57, composure: 55, stamina: 60, groundstrokes: 58 }

/** A stored record, exactly the shape `runKidTournament` files and the Season bracket hands over. */
function record(eventId: string, round: number): WorldMatch {
  return {
    eventId,
    round,
    aId: A.id,
    bId: B.id,
    winnerId: A.id,
    seed: 'r23-replay',
    score: '6-4 6-3',
    surface: 'hard',
    oppName: B.name,
    a: A,
    b: B,
  }
}

const text = (match: WorldMatch): string => mount(MatchReplay, { props: { match } }).text()

/** The storey-1 occasion line, verbatim from viz/preview.ts – what a match with no draw behind it
 *  says, and the exact sentence the owner was being shown for a WTA 500. */
const NO_DRAW = 'A hit-out, nothing on it.'
/** The storey-4 officials line, verbatim – it exists at no lower rung. */
const TOP_OF_THE_TOUR = 'Chair, review, and every point of it published as it happens.'

describe('round 23 #4 – a re-watched match keeps the rung it was played on', () => {
  it('a WTA 500 quarter-final re-opens as a WTA 500, not as a hit-out', () => {
    const out = text(record('2029-w14-wta500', 2))
    expect(out, 'the re-watch fell back to storey 1').not.toContain(NO_DRAW)
    // The occasion line names the tournament and the round off the draw sheet's own vocabulary.
    expect(out).toContain(TIERS.wta500.label)
    expect(out).toContain('Quarterfinal')
    // ...and the whole storey-4 register arrives with it, which is the thing the log was missing.
    expect(storeyOf('wta500')).toBe(4)
    expect(out).toContain(TOP_OF_THE_TOUR)
  })

  it('...and a Grand Slam re-opens as a Grand Slam, off a 128 draw it never counts rounds for', () => {
    const out = text(record('2031-w22-slam', 0))
    expect(out).not.toContain(NO_DRAW)
    expect(out).toContain(TIERS.slam.label)
    expect(out).toContain(`Round of ${TIERS.slam.drawSize}`)
  })

  it('a booked friendly still says there is no draw behind it – null is an ANSWER here', () => {
    // `resolvePractice` files a friendly under `practice-w<week>`, an id that names no tier. This is
    // the case that keeps the fix honest: the prop is derived, not blanket-filled, so the surfaces
    // that genuinely have no tournament still read as the hit-outs they are.
    const out = text(record('practice-w41', 0))
    expect(out).toContain(NO_DRAW)
    expect(occasionOf('practice-w41', 0)).toBeNull()
  })

  it('and the RUNNING LOG gains with it, not just the intro', () => {
    // The intro proves the prop arrives; this proves what the prop is worth. Same match, same seed,
    // the two calls the viewer makes with and without the occasion (viz/commentary.ts, BARS).
    const opts: MatchOptions = { surface: 'hard', tour: JUNIOR_TOUR, seed: 'r23-replay-log' }
    const m = annotateMatch(simulateMatch(A, B, opts), A, B, opts)
    const fallen = buildCommentary(m, A.name, B.name, null)
    const kept = buildCommentary(m, A.name, B.name, occasionOf('2029-w14-wta500', 2))
    expect(kept.length, 'the 500 log must say more than the storey-1 one').toBeGreaterThan(fallen.length)
  })
})

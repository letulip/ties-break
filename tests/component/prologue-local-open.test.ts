// ⭐ THE AGE-10 TOURNAMENT SHOWS THE MATCH VIEWER, and the pool's children are real enough for it.
//
// His ruling, build spec §3: «⚠ THE AGE-10 TOURNAMENT SHOWS THE MATCH VIEWER (his ruling: «да»).
// §8's open question is closed.» Phase 3's job is the FIELD, so what this file has to establish is
// exactly one thing: that a child invented by `src/prologue/pool.ts` can be put on court against her
// and the shipped viewer plays the match – no new prop, no new mechanism, no world.
//
// ⚠ WHY IT IS MOUNTED AND NOT A SOURCE PIN. CLAUDE.md: «Prefer a mounted test to a source pin …
// Mutate the thing you think you are covering and watch it fail before you believe a green run.» The
// claim here is about what a real component does with a real pool row, and the two things it could
// get wrong – a missing attribute, or an age the field forgot to set – are both invisible to a pin
// and both visible below.
//
// ⚠ AND THERE IS NO NEW COMPONENT IN THIS PHASE. The viewer is mounted directly, exactly as the four
// existing viewer tests mount it, because phase 4 is the wiring phase and a screen built here would
// be a screen phase 4 has to unbuild. What is proven is the CONTRACT: two `MatchPlayer`s, a surface
// and a mode is all the viewer has ever wanted, and the pool supplies its half of that.
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import MatchViewer from '../../src/components/MatchViewer.vue'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { JUNIOR_TOUR } from '../../src/engine/season/tournament'
import { expectedServeSpeed, LEGACY_SNAPSHOT_AGE } from '../../src/engine/match/serveSpeed'
import { KID_ID } from '../../src/engine/world'
import { LOCAL_POOL, playLocalOpen, type LocalOpen } from '../../src/prologue/pool'
import { SKILL_KEYS, STARTING_SKILL_BAND } from '../../src/engine/development'
import type { MatchOptions, MatchPlayer } from '../../src/engine/match/types'

const SKIP_LABEL = 'Skip to the result'

/** An ordinary ten-year-old on the game's own scale – the middle of the band `startingSkills` draws
 *  a build from, which is the girl a median childhood produces. How she is really composed at ten is
 *  phase 4's; this file only needs somebody plausible to put on the other side of the net. */
function her(): MatchPlayer {
  const skills = {} as Record<string, number>
  for (const k of SKILL_KEYS) {
    const [lo, hi] = STARTING_SKILL_BAND[k]
    skills[k] = Math.round((lo + hi) / 2)
  }
  return { id: KID_ID, name: 'Vera Novak', age: 10, ...skills } as MatchPlayer
}

/** Her first-round match at the Local Open, in the shape the viewer takes. This is the whole
 *  integration: `playLocalOpen` decides who she meets, and the two rows go straight into the same
 *  `simulateMatch` + `annotateMatch` recipe SeasonScreen's hit-out and every other viewer surface
 *  already use. */
function firstRound(seed = 'prologue-open'): {
  open: LocalOpen
  a: MatchPlayer
  b: MatchPlayer
  match: ReturnType<typeof annotateMatch>
  opts: MatchOptions
} {
  const kid = her()
  const open = playLocalOpen(seed, kid, 10)
  const record = open.result.matches.find((m) => m.round === 0 && (m.aId === KID_ID || m.bId === KID_ID))
  expect(record, 'she was not in her own draw').toBeTruthy()
  const oppId = record!.aId === KID_ID ? record!.bId : record!.aId
  const opponent = open.field.find((p) => p.id === oppId)
  expect(opponent, 'her opponent is not a child from the pool').toBeTruthy()
  const a = record!.aId === KID_ID ? kid : opponent!
  const b = record!.aId === KID_ID ? opponent! : kid
  const opts: MatchOptions = { surface: open.event.surface, tour: JUNIOR_TOUR, seed: record!.seed! }
  return { open, a, b, match: annotateMatch(simulateMatch(a, b, opts), a, b, opts), opts }
}

function mountOpen(seed?: string) {
  const { a, b, match, open } = firstRound(seed)
  const wrapper = mount(MatchViewer, {
    props: { match, playerA: a, playerB: b, surface: open.event.surface, mode: 'live' as const },
  })
  return { wrapper, a, b, match, open }
}

describe('⭐ the age-10 Local Open shows the match viewer', () => {
  it('mounts against a child the prologue invented, and names them both', () => {
    const { wrapper, a, b } = mountOpen()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain(a.name)
    expect(wrapper.text()).toContain(b.name)
    expect(wrapper.find('canvas').exists()).toBe(true)
    wrapper.unmount()
  })

  it('⭐ plays it – Skip leaves the un-started state and shows the winner the ENGINE decided', async () => {
    const { wrapper, a, b, match } = mountOpen()
    expect(wrapper.text()).toContain('Not started')
    const skip = wrapper.findAll('button').find((btn) => btn.text() === SKIP_LABEL)
    expect(skip, `no "${SKIP_LABEL}" button`).toBeTruthy()
    await skip!.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).not.toContain('Not started')
    // `winner` is a Side, not an id: the viewer may only display what the engine already committed.
    expect(wrapper.text()).toContain(match.result.winner === 0 ? a.name : b.name)
    wrapper.unmount()
  })

  it('⚠ the viewer knows which one is HER – exactly one side carries KID_ID', () => {
    // `matchReadout`'s `kidSide` reads `playerA.id === KID_ID ? 0 : playerB.id === KID_ID ? 1 : null`,
    // and it is what puts her name in the accent colour and draws momentum from her seat. A pool
    // child that collided with her id would silently make the viewer point at the wrong girl.
    const { a, b, wrapper } = mountOpen()
    expect([a.id, b.id].filter((id) => id === KID_ID)).toHaveLength(1)
    expect([a.id, b.id].filter((id) => /^local-10-0-\d+$/.test(id))).toHaveLength(1)
    wrapper.unmount()
  })

  it('the match is a real match and not an empty one, which is what makes the cases above mean something', () => {
    const { match } = firstRound()
    expect(match.points.length).toBeGreaterThan(30)
    expect(match.result.sets.length).toBeGreaterThanOrEqual(2)
    for (const p of match.points) expect(p.rally.shots.length).toBeGreaterThan(0)
  })

  it('⚠ a different career meets a different child, so nothing here is pinned to one lucky draw', () => {
    const one = firstRound('career-one')
    const two = firstRound('career-two')
    expect(two.b.name === one.b.name && two.a.name === one.a.name).toBe(false)
  })
})

describe('⚠⚠ the children serve like ten-year-olds, which is the one thing their age buys', () => {
  // The serve-speed curve is the ONLY reader of an absolute age in the match model (`basePServe`
  // never touches it), and `annotateMatch` resolves it as `expectedServeSpeed(a.age ??
  // LEGACY_SNAPSHOT_AGE, a.serve)`. So a pool that forgot to set `age` would not fail to compile and
  // would not fail any assertion about the bracket – it would quietly put a fourteen-year-old's
  // serve on a ten-year-old, and this is the case that sees it.

  it('⭐ every child is age 10, and 10 is not the fallback the viewer would have used', () => {
    const { open } = firstRound()
    expect(LEGACY_SNAPSHOT_AGE).toBe(14)
    for (const child of open.field) expect(child.age).toBe(10)
    expect(LOCAL_POOL.fromAge).toBe(10)
  })

  it('⚠ and it lands on the screen – a ten-year-old\'s serve is measurably slower than a fourteen\'s', () => {
    // The mutation arm, in the file: the same child with her age dropped is what a pool that forgot
    // the field would produce, and the number moves by a margin nobody could call rounding.
    const { open } = firstRound()
    const child = open.field[0]
    const asTen = expectedServeSpeed(child.age!, child.serve)
    const asFourteen = expectedServeSpeed(child.age ?? LEGACY_SNAPSHOT_AGE, child.serve)
    expect(asTen).toBeLessThan(expectedServeSpeed(LEGACY_SNAPSHOT_AGE, child.serve) - 10)
    expect(asFourteen).toBe(asTen)
    // ...and the curve genuinely runs this low: its own note documents the table down to age 6.
    expect(expectedServeSpeed(6, child.serve)).toBeLessThan(asTen)
  })
})

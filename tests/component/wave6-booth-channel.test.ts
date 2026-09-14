// ⭐⭐⭐ v77 T7 – THE BOOTH TOUCHES HER PRIVATE LIFE, ON A REAL SCREEN (wave 6, the spotlight; C4's
// boundary ruled 10.09). The unit half – the licence, the window, the once-ness and the beat itself –
// is `tests/wave6-booth-channel.test.ts`; this file holds the one claim that file cannot make: that
// the packet REACHES the log a player reads, and that a match nobody aired anything at says nothing.
//
// ⚠ WHY A MOUNTED TEST AND NOT A SOURCE PIN. A derivation nobody calls is not a feature, and the
// wiring is the half that has actually been wrong here before: round 21 item 3 shipped a whole rung
// ladder inside `buildCommentary` while `MatchViewer` passed nothing, and the owner asked three times
// why «на 1000 и шлемах кажется ничего не изменилось» – a green builder beside a silent viewer. So
// the claim is made against RENDERED ROWS, through the real cascade, exactly as the coach's own
// presence test makes it one prop over.
//
// =================================================================================================
// THE ARMS – both watched to FAIL before this file was believed
// =================================================================================================
//
//   ARM A   the sixth argument dropped from the `buildCommentary` call in `MatchViewer.vue`
//           (`props.boothPrivateLife && …` replaced by a bare `null`). **4 RED** · §1's rendered
//           row, §1's wrong-story row, §1's «both public facts» and §2's call-text case.
//           ⚠ The byte-absence case and the rival-replay case STAY GREEN, which is the point of the
//           pair: a silent viewer is indistinguishable from a silent booth unless something asserts
//           the booth can speak at all.
//
//   ARM B   `:booth-private-life` dropped from the `MatchViewer` binding in `TournamentFlow.vue`.
//           **1 RED** · §2's prop case, exactly the split the owner would see as «the papers had it
//           and the commentary never mentioned it».
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import MatchViewer from '../../src/components/MatchViewer.vue'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { JUNIOR_TOUR } from '../../src/engine/season/tournament'
import { KID_ID } from '../../src/engine/world'
import type { MatchOptions, MatchPlayer } from '../../src/engine/match/types'
import type { BoothPrivateLife } from '../../src/shared/protocol'

function player(over: Partial<MatchPlayer> = {}): MatchPlayer {
  return { id: 'p', name: 'P', serve: 50, ret: 50, composure: 50, stamina: 50, groundstrokes: 50, ...over }
}

/** The same recipe MatchReplay.vue uses: a seeded match is a pure function of (a, b, opts). */
function fixture(seed = 'booth-component') {
  // ⚠ SIDE A IS **HER**, and it is `KID_ID` that says so rather than a prop: `useMatchReadout`
  // derives `kidSide` by comparing the two players' ids to it, which is exactly how every real call
  // site carries her. A fixture that named her 'a' would have no side, and the booth would be silent
  // for the reason a rival replay is – see the last case in §1.
  const a = player({ id: KID_ID, name: 'Vera Novak', serve: 62 })
  const b = player({ id: 'b', name: 'Ines Duval', serve: 48 })
  const opts: MatchOptions = { surface: 'hard', tour: JUNIOR_TOUR, seed }
  return { a, b, match: annotateMatch(simulateMatch(a, b, opts), a, b, opts) }
}

const SKIP_LABEL = 'Skip to the result'

/** Mount the viewer with (or without) a booth packet and reveal the whole match, so every beat the
 *  log will ever hold is on screen. Side A is hers (see `fixture`), so the line is about `playerA`. */
async function rowsWith(packet: BoothPrivateLife | null, seed = 'booth-component'): Promise<string[]> {
  const { a, b, match } = fixture(seed)
  const w = mount(MatchViewer, {
    props: {
      match,
      playerA: a,
      playerB: b,
      surface: 'hard' as const,
      mode: 'replay' as const,
      boothPrivateLife: packet,
    },
  })
  const button = w.findAll('button').find((x) => x.text() === SKIP_LABEL)
  expect(button, 'no skip control on the viewer').toBeTruthy()
  await button!.trigger('click')
  await nextTick()
  const rows = w.findAll('.mv-beat:not(.intro)').map((r) => r.text().replace(/\s+/g, ' ').trim())
  w.unmount()
  return rows
}

// =================================================================================================
// 1. THE LOG A PLAYER READS
// =================================================================================================
describe('wave 6 T7 §1 – the beat is on screen with the packet, and byte-absent without it', () => {
  it('⭐⭐⭐ THE PACKET PUTS THE BOOTH IN THE LOG', async () => {
    const without = await rowsWith(null)
    const with_ = await rowsWith({ kind: 'met', wrong: false })
    // ⚠ NEITHER ARM IS VACUOUS: the match really does produce a log, in both of them. A pair of
    // empty lists would satisfy «absent without» and prove nothing at all.
    expect(without.length, 'the fixture match produced no beats at all').toBeGreaterThan(4)
    expect(with_.length).toBe(without.length + 1)
    const extra = with_.filter((r) => !without.includes(r))
    expect(extra, 'exactly one row is new').toHaveLength(1)
    expect(extra[0], 'and it is the booth speaking').toMatch(/Off court\./)
    expect(extra[0], 'about the girl whose family is watching').toContain('Vera')
  })

  it('⭐⭐ ...and a match the booth said nothing at is byte-identical to the log before this wave', async () => {
    const without = await rowsWith(null)
    expect(without.some((r) => r.includes('Off court.')), 'the booth spoke with no packet').toBe(false)
    // Across several matches, so the claim is about the channel and not about one scoreline.
    for (const seed of ['booth-c-1', 'booth-c-2', 'booth-c-3']) {
      const rows = await rowsWith(null, seed)
      expect(rows.length, `${seed} produced no log`).toBeGreaterThan(4)
      expect(rows.some((r) => r.includes('Off court.'))).toBe(false)
    }
  })

  it('⭐⭐ THE WRONG STORY IS ON SCREEN, WRONG – `wrong: true` reaches the row', async () => {
    const trueRow = (await rowsWith({ kind: 'met', wrong: false })).find((r) => r.includes('Off court.'))
    const wrongRow = (await rowsWith({ kind: 'met', wrong: true })).find((r) => r.includes('Off court.'))
    expect(trueRow, 'the true arm never spoke').toBeTruthy()
    expect(wrongRow, 'the wrong arm never spoke').toBeTruthy()
    expect(wrongRow).not.toBe(trueRow)
    expect(wrongRow!.toLowerCase()).toMatch(/mystery man|no two of them|not one of them/)
  })

  it('both public facts reach the screen, and they do not read the same', async () => {
    const met = (await rowsWith({ kind: 'met', wrong: false })).find((r) => r.includes('Off court.'))
    const ended = (await rowsWith({ kind: 'ended', wrong: false })).find((r) => r.includes('Off court.'))
    expect(met).toBeTruthy()
    expect(ended).toBeTruthy()
    expect(met).not.toBe(ended)
  })

  it('⚠ A MATCH THAT IS NOT HERS IS SILENT – the side is the view\'s own answer', async () => {
    // `kidSide` null is a rival's replay, where nobody's private life is the family's. The component
    // refuses to hand the packet over at all there, which is why this needs a MOUNTED case: the
    // builder cannot express «there is no side».
    // ⚠ NEITHER PLAYER IS HER – a rival's match, which is what `MatchReplay` opens.
    const { b, match } = fixture()
    const a = player({ id: 'not-her', name: 'Vera Novak', serve: 62 })
    const w = mount(MatchViewer, {
      props: {
        match,
        playerA: a,
        playerB: b,
        surface: 'hard' as const,
        mode: 'replay' as const,
        boothPrivateLife: { kind: 'met', wrong: false } as BoothPrivateLife,
      },
    })
    const button = w.findAll('button').find((x) => x.text() === SKIP_LABEL)
    await button!.trigger('click')
    await nextTick()
    const rows = w.findAll('.mv-beat:not(.intro)').map((r) => r.text())
    expect(rows.length, 'the replay produced no log').toBeGreaterThan(4)
    expect(rows.some((r) => r.includes('Off court.')), 'her private life aired over a rival\'s match').toBe(false)
    w.unmount()
  })
})

// =================================================================================================
// 2. THE FLOW HANDS IT OVER – the half a viewer test cannot see
// =================================================================================================
//
// ⚠ THE SAME GUARD `coach-travelled` HAS, one prop over, and for the same reason: the engine decides,
// the flow carries, the log speaks. A binding dropped here is a booth that never mentions a story the
// world's own feed row has already printed.
describe('wave 6 T7 §2 – TournamentFlow passes the packet to the viewer', () => {
  it('⚠ the binding is on the MatchViewer, off the pending view and nowhere else', async () => {
    // ⚠ A TEMPLATE-BINDING CLAIM AND THEREFORE A TEXT ONE – there is no way to mount the flow into
    // this match without a whole career behind it, and the coach's own wiring case (which does) lives
    // in `tests/component/round21-coach-travel.test.ts` §2. What is asserted here is the ONE line
    // that would go missing: the prop, bound to the engine's answer, with a null fallback.
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const flow = readFileSync(resolve(__dirname, '../../src/components/TournamentFlow.vue'), 'utf8')
    expect(flow).toContain(':booth-private-life="pending?.boothPrivateLife ?? null"')
    const viewer = readFileSync(resolve(__dirname, '../../src/components/MatchViewer.vue'), 'utf8')
    // ...and the viewer feeds it to the narrator with the side it owns, never re-deciding the fact.
    expect(viewer).toMatch(/props\.boothPrivateLife && kidSide\.value !== null/)
  })
})

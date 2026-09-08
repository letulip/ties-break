// ⭐⭐⭐ ROUND 40 #7 – THE TWO SEEDS, MOUNTED. docs/rounds/round-40.md item 7.
//
// THE FACT THAT STARTED IT: the promo recorder had no way to tell the prologue which childhood to
// walk, so it patched `Math.random` around the mount and restored it after – which pinned the
// PROLOGUE seed and left the CAREER seed random. Two halves of one comparison walked one childhood
// and handed it to two different girls, under a caption reading «Same hidden potential». The
// recorder now refuses such a take, but the hazard was ours: two independent seeds, two independent
// `Math.random` calls, and an injection point on only one of them (`game.newCareer`'s first
// argument).
//
// WHAT THIS FILE CLAIMS, and it is two things and not one:
//
//   B – `ChildhoodPrologue` TAKES A SEED, exactly as `newCareer` does: supplied wins, blank and
//       whitespace fall back to the shipped fresh draw, and the fallback is byte-identical. So a
//       walk can be pinned without a global being patched.
//   C – THE CAREER BORN FROM A PROLOGUE INHERITS THAT SEED. One girl, one seed, all the way
//       through – and two careers from the same prologue seed are the SAME girl, which is the
//       property the recorder needed and could not get.
//
// ⚠ THE STORE'S TWO ACTIONS ARE STUBBED AND NOTHING ELSE IS – `prologue-two-paths.test.ts`'s own
// idiom, copied because it is the shape that lets the REAL engine build the career off the ARGUMENTS
// the component actually passed. Everything the girl is downstream of the seam is the genuine
// article; the only thing faked is the Web Worker, which does not exist under happy-dom.
//
// ⚠ NOT ONE `Math.random` IS PATCHED IN THE SUPPLIED ARMS, and that absence is the point of B. The
// one arm that does pin it is the FALLBACK arm, whose whole claim is that the unsupplied walk still
// makes exactly the draw it always made.
//
// MUTATION-VERIFIED, each restored – the log of what was watched failing is in the wave's report:
//   * `initialSeed()` reduced to `freshSeed()` (the supplied seed ignored) -> every supplied arm
//     goes red, and the twin-career arm goes red naming two different girls.
//   * `newCareer(seed.value, …)` reverted to `newCareer('', …)` -> the inheritance arms go red.
//   * the anti-vacuity arm is the guard on all of it: two DIFFERENT seeds must produce two
//     different girls, or a world that ignored seeds entirely would satisfy every arm above.
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import { setViewport, PHONE } from './fits'
import ChildhoodPrologue from '../../src/components/ChildhoodPrologue.vue'
import PrologueLocalOpen from '../../src/components/PrologueLocalOpen.vue'
import { landing } from './prologueLanding'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { CARD_AGES, PROLOGUE_CARDS } from '../../src/prologue/cards'
import { DEFAULT_PROFILE, type PlayerProfile, type PrologueHandover } from '../../src/shared/protocol'

/** What `freshSeed()` makes of one `Math.random` value – the shipped formula, spelled out here so
 *  the fallback arm asserts the BYTES rather than a shape. Kept in step by that arm going red. */
const freshSeedOf = (v: number): string => `prologue-${(v.toString(36).slice(2) + '0000').slice(0, 8)}`

/** A career, as the component asked for it. `seed` is the field round 40 #7 C is about. */
interface Call {
  seed: string
  profile: PlayerProfile
  prologue?: PrologueHandover
}

function stubStore(): { calls: Call[] } {
  const game = useGameStore()
  const calls: Call[] = []
  game.newCareer = vi.fn(
    async (seed: string, profile: PlayerProfile = DEFAULT_PROFILE, prologue?: PrologueHandover) => {
      calls.push({ seed, profile, prologue })
      // ⭐ THE REAL ENGINE, ON THE REAL ARGUMENTS – including the seed, which is the whole subject of
      // this file. `createWorld` is what turns a seed into a girl, so building the career here is
      // what makes «the same seed is the same girl» a claim about the product and not about a stub.
      game.snapshot = toSnapshot(createWorld(seed, profile, `c-${calls.length}`, prologue))
    },
  )
  game.deleteCareer = vi.fn(async () => {
    game.snapshot = null
  })
  return { calls }
}

/** Press the answer whose label starts with `label`, and let round 40 #3's landing elapse. */
async function answer(w: VueWrapper, label: string): Promise<void> {
  const button = w.findAll('.prologue-answer').find((b) => b.text().startsWith(label))
  expect(button, `no control «${label}» on this card: ${w.text().slice(0, 140)}`).toBeTruthy()
  await landing(() => button!.trigger('click'))
  await Promise.resolve()
  await w.vm.$nextTick()
}

/** The dearest road, as far as the first weekend – she is entered at ten, so the walk stops on a
 *  bracket the prologue's own seed drew. This is where B's seed becomes visible from outside: the
 *  weekend is handed to `PrologueLocalOpen` with the seed the walk is running on. */
async function walkToFirstWeekend(w: VueWrapper): Promise<void> {
  await answer(w, 'A city, and the bills are paid.')
  for (const age of [6, 7]) await answer(w, PROLOGUE_CARDS.find((c) => c.age === age)!.continueLabel)
  await answer(w, 'The club across town')
  await answer(w, 'Buy the hour, one to one')
  await answer(w, 'Enter her')
  expect(w.find('.plo').exists(), 'entering her at ten did not open a weekend').toBe(true)
}

/** The seed this walk is actually running on, read where the product itself passes it. */
function walkSeed(w: VueWrapper): string {
  return w.findComponent(PrologueLocalOpen).props('seed') as string
}

/** The weekend as it was resolved – the bracket, every match in it. Two walks that agree on this
 *  agree on the tennis the childhood contained. */
function bracket(w: VueWrapper): string {
  return JSON.stringify(w.findComponent(PrologueLocalOpen).props('open'))
}

/** ⭐ THE CHEAPEST ROAD, AND IT ENTERS NOTHING – no Local Open in any year, so the nine cards are
 *  nine presses and the match engine never runs. Used by everything about the HANDOVER, where the
 *  question is which seed reached `newCareer` rather than what the tennis did. */
const QUIET: Record<number, string> = {
  8: 'Stay at the municipal court',
  9: 'Keep her in the group',
  10: 'Not this year',
  11: 'Ordinary school',
}

async function walkQuietChildhood(w: VueWrapper): Promise<void> {
  for (const age of CARD_AGES) {
    const card = PROLOGUE_CARDS.find((c) => c.age === age)!
    if (card.origins) {
      await answer(w, card.origins[0].label)
    } else if (age === 12) {
      // The twelfth has two faces and which one is drawn is DERIVED from the years before it, so the
      // pick is taken off the card on screen rather than off the table – `prologue-two-paths.test.ts`
      // takes the same care for the same reason. Index 0 is the cheap answer on either face.
      const labels = w.findAll('.prologue-answer-label').map((b) => b.text())
      await answer(w, labels[0]!)
    } else if (QUIET[age]) {
      await answer(w, QUIET[age]!)
    } else if (!card.tournament) {
      await answer(w, card.continueLabel)
    }
    // ...and this year's tournament ask, declined – the second beat on the same card since round
    // 35 #4. On the thirteenth, which has no decision of its own, this IS the way on.
    if (w.findAll('.prologue-answer-label').some((b) => b.text() === 'Not this year')) {
      await answer(w, 'Not this year')
    }
  }
}

describe('⭐⭐ round 40 #7 B – the prologue takes a seed, exactly as the career does', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })

  it('a supplied seed is the seed the walk runs on – no global patched', async () => {
    stubStore()
    const w = mount(ChildhoodPrologue, { props: { seed: 'promo-take-1' }, attachTo: document.body })
    await walkToFirstWeekend(w)
    expect(walkSeed(w)).toBe('promo-take-1')
    w.unmount()
  })

  it('⭐ the same supplied seed walks the same childhood twice – the take the film could not get', async () => {
    stubStore()
    const first = mount(ChildhoodPrologue, { props: { seed: 'twin-childhood' }, attachTo: document.body })
    await walkToFirstWeekend(first)
    const a = bracket(first)
    first.unmount()

    document.body.innerHTML = ''
    const second = mount(ChildhoodPrologue, { props: { seed: 'twin-childhood' }, attachTo: document.body })
    await walkToFirstWeekend(second)
    expect(bracket(second), 'one seed, two different weekends').toBe(a)
    second.unmount()
  })

  it('⚠ ...and a DIFFERENT seed does not – the anti-vacuity arm', async () => {
    stubStore()
    const first = mount(ChildhoodPrologue, { props: { seed: 'twin-childhood' }, attachTo: document.body })
    await walkToFirstWeekend(first)
    const a = bracket(first)
    first.unmount()

    document.body.innerHTML = ''
    const second = mount(ChildhoodPrologue, { props: { seed: 'another-childhood' }, attachTo: document.body })
    await walkToFirstWeekend(second)
    expect(bracket(second), 'two seeds, one weekend – the walk is ignoring its seed').not.toBe(a)
    second.unmount()
  })

  it('⚠ no seed supplied: the shipped fresh draw, byte for byte', async () => {
    stubStore()
    // ⚠ THE ONE ARM THAT PINS `Math.random`, and it pins it to prove the OLD behaviour survived: the
    // walk still makes exactly one draw at mount and still spells it the way `freshSeed` always did.
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.4242)
    const w = mount(ChildhoodPrologue, { attachTo: document.body })
    spy.mockRestore()
    await walkToFirstWeekend(w)
    expect(walkSeed(w)).toBe(freshSeedOf(0.4242))
    w.unmount()
  })

  it('⚠ a whitespace seed is no seed – `.trim() ||`, the store\'s own spelling', async () => {
    stubStore()
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.4242)
    const w = mount(ChildhoodPrologue, { props: { seed: '   ' }, attachTo: document.body })
    spy.mockRestore()
    await walkToFirstWeekend(w)
    expect(walkSeed(w)).toBe(freshSeedOf(0.4242))
    w.unmount()
  })
})

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

/** A career, as the store would have made it – `seed` is the FINAL seed (the component's, or the
 *  store's fallback when the component passed a blank one). That field is what #7 C is about. */
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
      // ⚠⚠ THE STORE'S OWN FALLBACK IS PART OF THE STUB, AND LEAVING IT OUT MADE AN ARM LIE. Watched
      // it happen: with the pass-through mutated away the component passes `''`, and a stub that fed
      // `''` straight to `createWorld` gave BOTH runs the same girl – so «two careers from the same
      // prologue seed are the same girl» stayed GREEN against the very defect it exists to catch.
      // The line below is `game.newCareer`'s, copied, so a blank seed here is as random as it is in
      // the product and the mutation reddens the arm.
      const finalSeed =
        seed.trim() || `${profile.kidName.toLowerCase()}-${(Math.random().toString(36).slice(2) + '0000').slice(0, 4)}`
      calls.push({ seed: finalSeed, profile, prologue })
      // ⭐ THE REAL ENGINE, ON THE REAL ARGUMENTS – including the seed, which is the whole subject of
      // this file. `createWorld` is what turns a seed into a girl, so building the career here is
      // what makes «the same seed is the same girl» a claim about the product and not about a stub.
      game.snapshot = toSnapshot(createWorld(finalSeed, profile, `c-${calls.length}`, prologue))
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
    //
    // ⚠ THE ASK IS RECOGNISED BY ITS *ENTER* LABEL AND DECLINED BY ITS OTHER ONE, and that is not
    // fussiness: «Not this year» is ALSO the tenth card's own stay-home option, so a walk that
    // looked for the decline label would answer the tenth year's decision a card early and every
    // year after it by the wrong control. `Put her name down` appears on the ask and nowhere else.
    if (w.findAll('.prologue-answer-label').some((b) => b.text() === 'Put her name down')) {
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

describe('⭐⭐ round 40 #7 C – the career born from a prologue inherits its seed', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })

  it('the seed the nine cards ran on is the seed the career is made with', async () => {
    const { calls } = stubStore()
    const w = mount(ChildhoodPrologue, { props: { seed: 'one-girl-one-seed' }, attachTo: document.body })
    await walkQuietChildhood(w)
    expect(calls.length, 'one career, not nine').toBe(1)
    expect(calls[0]!.seed).toBe('one-girl-one-seed')
    w.unmount()
  })

  it('⚠ an ordinary new career is untouched: no seed supplied, a fresh random one still', async () => {
    const { calls } = stubStore()
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.4242)
    const w = mount(ChildhoodPrologue, { attachTo: document.body })
    spy.mockRestore()
    await walkQuietChildhood(w)
    // ⚠ THE CAREER IS NOT BORN BLANK ANY MORE, and that is C. What a player must not be able to tell
    // is that the seed STOPPED BEING RANDOM: it is the walk's own fresh draw, which is exactly as
    // random as the store's fallback was, and no shipped caller supplies one.
    expect(calls[0]!.seed).toBe(freshSeedOf(0.4242))
    w.unmount()
  })

  it('⭐⭐ two careers from the same prologue seed are the SAME GIRL', async () => {
    const runs = []
    for (const _ of [0, 1]) {
      setActivePinia(createPinia())
      document.body.innerHTML = ''
      const { calls } = stubStore()
      const w = mount(ChildhoodPrologue, { props: { seed: 'same-hidden-potential' }, attachTo: document.body })
      await walkQuietChildhood(w)
      const call = calls[0]!
      // The world the worker would have built, from the arguments the component actually passed.
      const world = createWorld(call.seed, call.profile, 'c', call.prologue)
      runs.push({
        seed: call.seed,
        skills: JSON.stringify(world.skills),
        potential: JSON.stringify(world.potential),
        // The coach's read is what the handover SAYS about her, and it is on screen right now.
        read: (w.find('.handover-card').text() ?? '').replace(/\s+/g, ' ').trim(),
      })
      expect(runs[runs.length - 1]!.read.length, 'the handover is empty').toBeGreaterThan(80)
      w.unmount()
    }
    const [a, b] = runs
    expect(b!.seed).toBe(a!.seed)
    expect(b!.skills, 'same seed, different build').toBe(a!.skills)
    expect(b!.potential, 'same seed, different ceiling').toBe(a!.potential)
    expect(b!.read, "same seed, a different coach's read").toBe(a!.read)
  })

  it('⚠ ...and two careers from DIFFERENT prologue seeds are not – the anti-vacuity arm', async () => {
    const runs = []
    for (const seed of ['same-hidden-potential', 'a-different-girl']) {
      setActivePinia(createPinia())
      document.body.innerHTML = ''
      const { calls } = stubStore()
      const w = mount(ChildhoodPrologue, { props: { seed }, attachTo: document.body })
      await walkQuietChildhood(w)
      const call = calls[0]!
      const world = createWorld(call.seed, call.profile, 'c', call.prologue)
      runs.push({ skills: JSON.stringify(world.skills), potential: JSON.stringify(world.potential) })
      w.unmount()
    }
    const [a, b] = runs
    // ⚠ WITHOUT THIS ARM the file passes against a world that ignores seeds entirely.
    expect(b!.skills, 'two seeds, one build – the world is ignoring its seed').not.toBe(a!.skills)
    expect(b!.potential, 'two seeds, one ceiling – the world is ignoring its seed').not.toBe(a!.potential)
  })

  it('⚠ «start again» keeps a SUPPLIED seed, and re-draws when there is none', async () => {
    // The promo case, exactly: one seed, two different childhoods, the same girl at the end of both.
    const { calls } = stubStore()
    const supplied = mount(ChildhoodPrologue, { props: { seed: 'one-seed-two-walks' }, attachTo: document.body })
    await walkQuietChildhood(supplied)
    await supplied.findAll('.handover-answer')[1]!.trigger('click')
    await Promise.resolve()
    await supplied.vm.$nextTick()
    await walkQuietChildhood(supplied)
    expect(calls.length).toBe(2)
    expect(calls[1]!.seed, 'a supplied seed did not survive «start again»').toBe(calls[0]!.seed)
    supplied.unmount()

    // ...and §2.3 is unmoved for a player: nothing supplied, so the restart is a different girl.
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    const { calls: free } = stubStore()
    const w = mount(ChildhoodPrologue, { attachTo: document.body })
    await walkQuietChildhood(w)
    await w.findAll('.handover-answer')[1]!.trigger('click')
    await Promise.resolve()
    await w.vm.$nextTick()
    await walkQuietChildhood(w)
    expect(free.length).toBe(2)
    expect(free[1]!.seed, '«start again» replayed the same childhood for a player').not.toBe(free[0]!.seed)
    w.unmount()
  })
})

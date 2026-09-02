// ⭐⭐⭐ THE HANDOVER, MOUNTED ON A PHONE – phase 4 of docs/specs/childhood-prologue-build-2026-09.md
// §5, «the most important screen in the game».
//
// ⚠⚠ WHY THE ROUND-20 #3 RULE BINDS HARDER HERE THAN ANYWHERE. `TourBriefingDialog` shipped with a
// lead, a list, five bullets and a closing line on the shared `dialog-card`, and on a 375x667 phone
// its dismiss control sat below the fold on a BLOCKING overlay – the owner's career stopped there
// and could not be resumed. This card carries a PICTURE, a paragraph, a figure and two controls, and
// it is the last screen before a career starts: a player who cannot reach the controls cannot go on
// AND cannot start again, with nothing behind the card to go back to.
//
// ⚠ MUTATION-VERIFIED. Watched failing before it was believed:
//   * `max-height: 100%; overflow-y: auto` removed from `.dialog-card` in src/style.css (the
//     stylesheet as it stood before round-20 #3) -> the fit assertion goes red naming the content
//     floor and «cap NONE, NOT scrollable».
//   * the rose's declared height raised to 3000px -> the aspect pin goes red. ⚠ IT IS NOT CAUGHT BY
//     THE FIT ASSERTION, and that is the shared rule working as designed rather than a hole: a card
//     that is bounded and scrolls satisfies round-20 #3 at any content height. What a taller picture
//     really does is push the words down a scroll, so the claim that has to be held is the picture's
//     OWN size - which is what the pin below holds, against the viewBox it is drawn from.
//   * `.handover-answers` moved above `.handover-read` in the template -> red, because the controls
//     are no longer the card's last element and the measurement's precondition is asserted.
//   * the coach's line swapped for another band's -> the band test goes red.
//   * a second money figure added to the card -> the once-ness test goes red.
import { describe, expect, it, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { regionToLast } from '../helpers/source'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
// ⚠ THE APP'S OWN STYLESHEET. Without it `.dialog-card`'s height bound is not in the cascade and
// every measurement below is vacuous – the same reason prologue-walk.test.ts imports it.
import '../../src/style.css'
import { assertLegible } from './contrast'
import { assertDismissReachable, measureDialog, setViewport, PHONE, NARROW_PHONE } from './fits'
import PrologueHandover from '../../src/components/PrologueHandover.vue'
import { COACH_BASE_READS, COACH_READS, HANDOVER_COPY, coachBaseReadFor, coachReadFor, spentLine } from '../../src/prologue/handover'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { handoverBaseBand, handoverRoomBand } from '../../src/engine/world/coachMarket'
import { PROLOGUE_CARDS, TWELFTH_WANTS_MORE } from '../../src/prologue/cards'
import { DEFAULT_PROFILE, type HandoverBaseBand, type RadarAxis } from '../../src/shared/protocol'

/** A REAL career's rose, not a hand-built one: the axes the handover draws are exactly what the
 *  worker hands the screen after `newCareer`, fog and all. */
function realCareer(seed: string): {
  axes: RadarAxis[]
  band: string
  read: string
  baseBand: HandoverBaseBand | ''
  base: string
} {
  const world = createWorld(seed, DEFAULT_PROFILE, 'c')
  const snap = toSnapshot(world)
  return {
    axes: snap.radar,
    band: snap.handoverBand,
    read: coachReadFor(snap.handoverBand, snap.seed),
    // ⭐ PHASE 7 – the OTHER half of the read, taken off the snapshot exactly as the container takes
    // it. Leaving it out here would be the easy way to make this whole file lie: the screen the
    // player meets carries two sentences and every height number below is only about that screen
    // because this line is here.
    baseBand: snap.handoverBaseBand,
    base: coachBaseReadFor(snap.handoverBaseBand, snap.seed),
  }
}

/** The ROOM sentence on the rendered card – the one WITHOUT the base's own class. Spelled once,
 *  because `.handover-read-line` alone now matches two paragraphs and the first of them is the base:
 *  a selector that used to mean «his read» would silently start meaning the other statement. */
function roomLine(): string {
  return document.querySelector('.handover-read-line:not(.handover-read-base)')!.textContent!.trim()
}

/** The seed whose fresh career draws the band this screen exists for (§5: «where a weak draw stops
 *  being a hundred-hour ambush»). Found by walking, not assumed, so it cannot rot into a seed that
 *  quietly stopped being a weak draw. */
function seedForBand(want: string): string {
  for (let i = 0; i < 2000; i++) {
    const seed = `hand-${i}`
    if (handoverRoomBand(createWorld(seed, DEFAULT_PROFILE, 'c')) === want) return seed
  }
  throw new Error(`no seed in 2000 draws the band ${want} – the arm is empty and every test on it is vacuous`)
}

function mountHandover(seed: string, spentCents: number, vp: { width: number; height: number }) {
  setViewport(vp)
  const career = realCareer(seed)
  const wrapper = mount(PrologueHandover, {
    attachTo: document.body,
    props: { axes: career.axes, base: career.base, read: career.read, spentCents },
  })
  const el = document.querySelector('.handover-card')!
  const answers = document.querySelector('.handover-answers')!
  expect(el, 'the card is up, so nothing below is vacuous').toBeTruthy()
  return { wrapper, el, answers, career }
}

describe('⭐⭐ the handover fits a 375x667 phone, with both controls on the screen', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('the acceptance criterion itself – the way on is reachable', () => {
    const { wrapper, el, answers } = mountHandover(seedForBand('Close to her ceiling'), 28_150_00, PHONE)
    assertDismissReachable(el, answers, PHONE, 'the handover')
    wrapper.unmount()
  })

  it('...and BOTH controls are on screen together, not just the last of them', () => {
    // `measureDialog` reads the LAST thing in the flow off the card's bottom edge. Two stacked
    // controls means the first one is above it by exactly its own box, so the pair fits when the
    // block does – asserted rather than reasoned, because a control the player cannot see is a
    // choice the screen did not offer.
    const { wrapper, el, answers } = mountHandover(seedForBand('Close to her ceiling'), 28_150_00, PHONE)
    const fit = measureDialog(el, answers, PHONE)
    expect(document.querySelectorAll('.handover-answer').length, 'go on, and start again').toBe(2)
    expect(fit.dismissTop, 'the top of the pair is inside the viewport').toBeGreaterThanOrEqual(0)
    expect(fit.dismissBottom, 'and so is the bottom of it').toBeLessThanOrEqual(PHONE.height)
    wrapper.unmount()
  })

  it('and on the narrowest phone the app supports', () => {
    const { wrapper, el, answers } = mountHandover(seedForBand('Huge potential'), 8_200_00, NARROW_PHONE)
    assertDismissReachable(el, answers, NARROW_PHONE, 'the handover, narrow')
    wrapper.unmount()
  })

  it('⚠⚠ the rose is drawn at its viewBox`s own aspect, and cannot grow silently', () => {
    // The one input to every measurement above that happy-dom cannot compute for itself. If this
    // number and the viewBox disagree, the picture on a real phone is a different size from the
    // picture these tests measured – and the fit numbers are fiction.
    const { wrapper } = mountHandover('hand-1', 18_175_00, PHONE)
    const svg = document.querySelector('.radar-svg')!
    const [, , boxW, boxH] = (svg.getAttribute('viewBox') ?? '').split(/\s+/).map(Number)
    const declared = getComputedStyle(svg).height
    expect(declared, 'the picture declares a height at all').toMatch(/^\d+px$/)
    expect(parseFloat(declared), `viewBox ${boxW}x${boxH}`).toBe(boxH)
    const maxWidth = parseFloat(getComputedStyle(svg).maxWidth)
    expect(maxWidth, 'and it is the height that aspect gives at the width it is capped to').toBe(boxW)
    wrapper.unmount()
  })

  it('⚠ the controls are the LAST thing on the card – the precondition every fit number rests on', () => {
    const { wrapper, el, answers } = mountHandover('hand-1', 18_175_00, PHONE)
    expect(el.lastElementChild, 'something follows the way out').toBe(answers)
    wrapper.unmount()
  })

  it('the card is bounded by the screen and scrolls, whatever the copy grows into', () => {
    const { wrapper, el, answers } = mountHandover('hand-1', 18_175_00, PHONE)
    const fit = measureDialog(el, answers, PHONE)
    expect(fit.cap).toBeLessThanOrEqual(fit.available.height)
    expect(fit.scrollable, 'the card scrolls, so anything past the fold can still be reached').toBe(true)
    wrapper.unmount()
  })

  it('every line clears AA against what is actually behind it', () => {
    const { wrapper } = mountHandover('hand-1', 18_175_00, PHONE)
    assertLegible(document.querySelector('.handover-title')!, 'the title')
    for (const el of document.querySelectorAll('.handover-read-line')) assertLegible(el, 'the coach')
    assertLegible(document.querySelector('.handover-spent')!, 'the money')
    for (const el of document.querySelectorAll('.handover-answer')) assertLegible(el, 'a control')
    wrapper.unmount()
  })
})

describe('⭐⭐ the three things on the screen (§5)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('1. THE FORMED ROSE – drawn by the shipped component, off the career`s own axes', () => {
    const { wrapper, career } = mountHandover('hand-1', 18_175_00, PHONE)
    const svg = document.querySelector('.radar-svg')!
    expect(svg, 'the rose is on the screen').toBeTruthy()
    expect(svg.getAttribute('aria-label')).toBe(HANDOVER_COPY.roseTitle)
    // Five spokes for five attributes, and the contour is a real polygon rather than a stub.
    expect(document.querySelectorAll('.radar-grid line').length).toBe(career.axes.length)
    expect(document.querySelector('.radar-core')?.getAttribute('d')?.length).toBeGreaterThan(20)
    wrapper.unmount()
  })

  it('⚠ ...and it carries no number, exactly as it does on the Kid screen', () => {
    const { wrapper } = mountHandover('hand-1', 18_175_00, PHONE)
    const rose = document.querySelector('.handover-rose')!
    expect(/\d/.test(rose.textContent ?? ''), rose.textContent ?? '').toBe(false)
    wrapper.unmount()
  })

  it('2. THE COACH`S READ – his band`s words, and no number in them', () => {
    for (const band of ['Close to her ceiling', 'Still room to grow', 'Huge potential']) {
      const seed = seedForBand(band)
      const { wrapper, career } = mountHandover(seed, 18_175_00, PHONE)
      expect(career.band, seed).toBe(band)
      const line = roomLine()
      expect(COACH_READS[band], `${band}: ${line}`).toContain(line)
      expect(/\d|\$|%/.test(line), line).toBe(false)
      wrapper.unmount()
    }
  })

  it('⭐⭐ a `Close to her ceiling` career gets the honest read AND the choice', () => {
    // The whole reason §5 says this screen exists. The weak draw is told, in his voice, and the way
    // out is on the same screen.
    const { wrapper } = mountHandover(seedForBand('Close to her ceiling'), 28_150_00, PHONE)
    const line = roomLine()
    expect(COACH_READS['Close to her ceiling']).toContain(line)
    const controls = [...document.querySelectorAll('.handover-answer')].map((b) => b.textContent!.trim())
    expect(controls).toEqual([HANDOVER_COPY.goOn, HANDOVER_COPY.startAgain])
    wrapper.unmount()
  })

  // =================================================================================================
  // ⭐⭐⭐ PHASE 7 – AND HE SAYS TWO THINGS, IN THIS ORDER
  // =================================================================================================
  //
  // ⚠⚠ MUTATION-VERIFIED: swapping the two paragraphs in the template reddens the order test;
  // deleting the `v-if="base"` paragraph reddens both of the tests below; dropping `:base` from
  // `ChildhoodPrologue.vue` reddens the container test in prologue-two-paths.test.ts.
  it('⭐⭐ the BASE comes first and the ROOM follows – what you built, then what she was born with', () => {
    const { wrapper, career } = mountHandover('hand-1', 18_175_00, PHONE)
    const lines = [...document.querySelectorAll('.handover-read-line')].map((e) => e.textContent!.trim())
    expect(lines.length, 'the coach says two things now').toBe(2)
    expect(lines[0], 'the base is first').toBe(career.base)
    expect(lines[1], 'his own approved line follows it').toBe(career.read)
    expect(COACH_BASE_READS[career.baseBand as 'behind' | 'level' | 'ahead']).toContain(lines[0])
    expect(COACH_READS[career.band]).toContain(lines[1])
    // ⚠ ONE LABEL FOR BOTH. A second label would be a new sentence on a screen whose every word is a
    // draft the owner has not approved.
    expect(document.querySelectorAll('.handover-read-label').length).toBe(1)
    wrapper.unmount()
  })

  it('⭐ all three base bands reach the screen, and none of them carries a number', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 60 && seen.size < 3; i++) {
      const seed = `base-screen-${i}`
      const band = handoverBaseBand(createWorld(seed, DEFAULT_PROFILE, 'c'))
      if (seen.has(band)) continue
      seen.add(band)
      const { wrapper } = mountHandover(seed, 18_175_00, PHONE)
      const line = document.querySelector('.handover-read-base')!.textContent!.trim()
      expect(COACH_BASE_READS[band], `${band}: ${line}`).toContain(line)
      expect(/\d|\$|%/.test(line), line).toBe(false)
      wrapper.unmount()
    }
    expect(seen, 'all three bands are reachable on a fresh career').toEqual(new Set(['behind', 'level', 'ahead']))
  })

  it('⚠ two sentences still leave both controls on a 375x667 phone', () => {
    // The round-20 #3 rule, re-run against the card as it is NOW: adding an honest sentence is
    // exactly how a dialog grows past a phone, and this screen is the one with nothing behind it.
    const { wrapper, el, answers } = mountHandover('hand-1', 28_150_00, PHONE)
    expect(document.querySelectorAll('.handover-read-line').length).toBe(2)
    assertDismissReachable(el, answers, PHONE, 'the handover with both sentences')
    wrapper.unmount()
  })

  it('⚠ he never names a ceiling, and the fourth engine band cannot be spoken', () => {
    // §5: «If he ever names a ceiling, the fog stops meaning anything.» The weak draw`s read admits
    // he can be wrong; `At her ceiling` – a ceiling claim in three words – is never a band this
    // screen is handed, because `handoverRoomBand` cannot return it.
    expect(COACH_READS['Close to her ceiling'].join(' ')).toContain('I have been wrong before')
    const seen = new Set<string>()
    for (let i = 0; i < 400; i++) seen.add(handoverRoomBand(createWorld(`ceil-${i}`, DEFAULT_PROFILE, 'c')))
    expect(seen.has('At her ceiling')).toBe(false)
  })

  it('3. THE HONEST CHOICE – two controls, and neither is marked as the one to take', () => {
    const { wrapper } = mountHandover('hand-1', 18_175_00, PHONE)
    const controls = [...document.querySelectorAll('.handover-answer')]
    expect(controls.length).toBe(2)
    // Same class, same rule, no positional selector – the screen does not point at an answer.
    expect(new Set(controls.map((c) => c.className)).size).toBe(1)
    wrapper.unmount()
  })

  it('...and each one emits its own answer', async () => {
    const { wrapper } = mountHandover('hand-1', 18_175_00, PHONE)
    const controls = wrapper.findAll('.handover-answer')
    await controls[0].trigger('click')
    await controls[1].trigger('click')
    expect(wrapper.emitted('go-on')?.length).toBe(1)
    expect(wrapper.emitted('start-again')?.length).toBe(1)
    wrapper.unmount()
  })

  it('⚠⚠ and the screen says NOTHING about rerolling, odds or a floor – his ruling, §2.3', () => {
    const { wrapper } = mountHandover(seedForBand('Close to her ceiling'), 28_150_00, PHONE)
    const text = wrapper.text()
    for (const word of ['reroll', 're-roll', 'odds', 'chance', 'random', 'seed', 'restart', 'retry', 'potential']) {
      expect(text.toLowerCase().includes(word), `${word} is on the screen`).toBe(false)
    }
    wrapper.unmount()
  })
})

describe('⭐ the money, exactly once, here and nowhere else in the prologue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('the total is on the handover, and it is the only figure on it', () => {
    const { wrapper } = mountHandover('hand-1', 28_150_00, PHONE)
    const text = wrapper.text()
    expect(text).toContain(spentLine(28_150_00))
    // ⚠ ONCE. Every `$` on the screen, counted – a second figure anywhere (a balance, a running
    // total, the same number twice) reddens this.
    expect((text.match(/\$/g) ?? []).length, text).toBe(1)
    expect((text.match(/[\d,]*\d/g) ?? []).join('|')).toBe('28,150')
    wrapper.unmount()
  })

  it('⚠ ...and not one of the ten card scenes carries a figure at all', () => {
    // prologue-walk.test.ts asserts this on the RENDERED cards; this is the same claim about the
    // table itself, stated here so the pair «once, on the handover» is provable in one place.
    const scenes = [...PROLOGUE_CARDS, TWELFTH_WANTS_MORE]
    for (const card of scenes) {
      const strings = [
        card.kicker, card.title, card.lede, card.her.cool, card.her.warm, card.coach.cool, card.coach.warm,
        card.continueLabel,
        ...(card.options ?? []).flatMap((o) => [o.label, o.note]),
        ...(card.origins ?? []).flatMap((o) => [o.label, o.note]),
      ]
      for (const s of strings) {
        expect(/\d|\$/.test(s), `age ${card.age}: ${s}`).toBe(false)
      }
    }
  })
})

describe('⚠ the screen holds no copy of its own', () => {
  it('every sentence on it comes from the table', () => {
    // The same claim `tests/prologue-cards.test.ts` makes about PrologueCard.vue, and for the same
    // reason: the owner has not read a word of this screen, and replacing it must stay a data edit.
    // ⚠ `process.cwd()`, NOT `import.meta.url` – the component project runs under happy-dom, where
    // `import.meta.url` is not a file URL. The same helper round14-group-c.test.ts uses.
    const file = readFileSync(resolve(process.cwd(), 'src/components/PrologueHandover.vue'), 'utf8')
    // ⚠ THE MARKER HELPER, NEVER A RAW `indexOf` (CLAUDE.md). `regionToLast` THROWS on an absent
    // marker; the raw form returns -1 and the region silently widens to most of the file while the
    // pin stays green - which is how two pins in this repo were found to have been lying.
    const template = regionToLast(file, '<template>', '</template>')
    // A sentence is three or more words in a row outside a binding or a tag. The template's own
    // comments are stripped first – they are prose about the code, not copy.
    const visible = template
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\{\{[\s\S]*?\}\}/g, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    expect(visible, `the template renders its own text: ${visible}`).toBe('')
  })
})

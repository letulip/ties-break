// ⭐⭐ ROUND 30 #6 – THE NEXT-TOURNAMENT SCREEN, RE-LAID.
//
// The owner's words are in `NextTournamentPanel.vue`'s script header in full (Cyrillic may not
// appear in a template, and a test that mounts one is held to the same rule by
// `round29-next-tournament.test.ts`). Itemised, he asked for: no frame; a SQUARE tournament picture,
// Home being the example; part of the description, `The read`, the weather and the trip ON the
// picture; the rounds as their own plate below, full width with padding at the edges; the four icons
// directly under the picture, in a row, with no plate; and the training plan at the bottom unchanged.
//
// ⚠ THIS FILE ASSERTS PLACEMENT, AND ONLY PLACEMENT. What the panel SAYS is round 29 #8's, and
// `round29-next-tournament.test.ts` still holds every figure, label and sentence of it – it passed
// unchanged across this re-lay, which is the evidence that this was a redesign and not a rebuild.
// The two files are deliberately not merged: one would go red on a restyle, the other on a rewrite.
//
// ⚠ MOUNTED AGAINST A REAL SNAPSHOT, engine-built, never a hand-written shape – round20-ui's house
// rule, and the reason the fixture below walks a real career.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import NextTournamentPanel from '../../src/components/NextTournamentPanel.vue'
import ThisWeekScreen from '../../src/components/screens/ThisWeekScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, enterEvent, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type Snapshot, type UpcomingEvent } from '../../src/shared/protocol'

function careerAndEvent(weeks = 12): { snap: Snapshot; event: UpcomingEvent } {
  const world = createWorld('r30-next-tournament', DEFAULT_PROFILE)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  const snap = toSnapshot(world)
  return { snap, event: snap.upcoming[0] }
}

function mountPanel(): ReturnType<typeof mount> {
  const { snap, event } = careerAndEvent()
  useGameStore().snapshot = snap
  // ⚠ ATTACHED, because half of what this file asks is answered by the real cascade
  // (`getComputedStyle` is live in the component project – vitest sets `css: true`), and a detached
  // tree gets none of it.
  return mount(NextTournamentPanel, { props: { event }, attachTo: document.body })
}

/** A career with something ENTERED – the only state Home's "Next tournament" card opens onto. */
function enteredCareer(): Snapshot {
  const world = createWorld('r30-this-week', DEFAULT_PROFILE)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 12; i++) tickWeek(world, rng)
  const target = toSnapshot(world).upcoming.find((e) => e.eligible && !e.entered)
  expect(target, 'the fixture must have something she may enter').toBeTruthy()
  enterEvent(world, target!.id)
  return toSnapshot(world)
}

beforeEach(() => {
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})

describe('round 30 #6 – the picture is square, and it is not a card', () => {
  it('⭐ SQUARE, «по примеру главной» – the same declaration Home\'s hero carries', () => {
    const w = mountPanel()
    const hero = w.find('.nt-hero').element
    // ⚠ READ THROUGH THE REAL CASCADE, not off the source text. A source pin would go green on a
    // rule that never reaches the element (a scoped selector that stopped matching, a rule shadowed
    // by a later one); this is what the browser would compute.
    const ratio = getComputedStyle(hero).aspectRatio.replace(/\s+/g, '')
    expect(ratio, 'the tournament picture is square').toBe('1/1')
    w.unmount()
  })

  it('⭐ NO FRAME – the hero stopped being a <Card>, so its hairline went with it', () => {
    const w = mountPanel()
    // `Card.vue` stamps `tb-card` on its root and that is where the border lives. The hero must not
    // carry it – and the rounds plate below MUST, which is the half that makes this a real claim
    // rather than "no cards anywhere".
    expect(w.find('.nt-hero').classes(), 'the picture wears no card').not.toContain('tb-card')
    expect(w.find('.nt-first').classes(), 'the rounds are still a plate').toContain('tb-card')
    w.unmount()
  })
})

describe('round 30 #6 – what is ON the picture, and what is under it', () => {
  it('⭐ the description, `The read` and its ring are all inside the picture', () => {
    const w = mountPanel()
    const hero = w.find('.nt-hero')
    expect(hero.find('.nt-hero-title').exists(), 'the tournament name is on the art').toBe(true)
    expect(hero.find('.nt-hero-meta').exists(), 'the court and the dates are on the art').toBe(true)
    expect(hero.find('.nt-read').exists(), '«The read можно как раз на картинке»').toBe(true)
    expect(hero.find('.nt-read-label').text()).toBe('The read')
    expect(hero.find('.nt-ring').exists(), 'the forecast ring came with it').toBe(true)
    w.unmount()
  })

  it('⭐ the weather and the trip are on the picture too, all three readings', () => {
    const w = mountPanel()
    const rows = w.findAll('.nt-hero .nt-money-row')
    expect(rows.length, 'entry fee, travel budget and the conditions').toBe(3)
    // ⚠ THE LABELS ARE UNCHANGED AND THAT IS ASSERTED HERE ON PURPOSE (invariant 4). He asked for
    // the block to MOVE; a re-lay that quietly re-words it on the way is the defect this round's
    // item 4 was about.
    expect(rows.map((r) => r.find('.hint').text())).toEqual(['Entry fee', 'Travel budget', 'Conditions'])
    // The weather plate wears its on-art face, which is the component's own answer to a photograph.
    expect(w.find('.nt-hero .tb-weather').classes()).toContain('on-art')
    // ...and nothing of the three is left below the picture.
    expect(w.findAll('.nt-money-row').length, 'the block moved rather than being copied').toBe(3)
    w.unmount()
  })

  it('⭐ the four icons sit DIRECTLY under the picture, in a row, on nothing', () => {
    const w = mountPanel()
    const kids = Array.from(w.find('.next-tourn').element.children)
    // The panel is three objects now, in his order: the picture, the icon row, the rounds plate.
    // ⚠ Named by the class each block OWNS rather than by `className[0]` – `Card.vue` puts its own
    // two classes in front of the caller's, so reading the first token would pin the ui kit's
    // internal order instead of this panel's layout.
    expect(kids.length, 'three objects, no fourth').toBe(3)
    expect(kids.map((el) => ['nt-hero', 'nt-facts', 'nt-first'].find((c) => el.classList.contains(c)))).toEqual([
      'nt-hero',
      'nt-facts',
      'nt-first',
    ])
    expect(w.findAll('.nt-fact').length).toBe(4)
    // «без плашки» – the row is not inside a card, and it is not one either.
    expect(w.find('.nt-facts').classes()).not.toContain('tb-card')
    expect(w.find('.nt-facts').element.closest('.tb-card'), 'nothing is behind the icons').toBeNull()
    w.unmount()
  })

  it('⭐ the rounds are the ONE plate, and they are full width', () => {
    const w = mountPanel()
    const plates = w.findAll('.tb-card')
    expect(plates.length, 'exactly one plate on the panel').toBe(1)
    expect(plates[0].classes()).toContain('nt-first')
    // Full width inside the app's gutter: the plate declares no width of its own, so it fills the
    // column. A width or a max-width here would be the "with padding at the edges" clause broken.
    const box = getComputedStyle(plates[0].element)
    expect(box.width, 'the rounds plate is not narrowed').toBe('')
    expect(box.maxWidth === '' || box.maxWidth === 'none').toBe(true)
    w.unmount()
  })
})

describe('round 30 #6 – the screen around it', () => {
  it('⭐ the hosting section loses its frame while the panel is there', () => {
    useGameStore().snapshot = enteredCareer()
    const w = mount(ThisWeekScreen, { attachTo: document.body })
    const section = w.find('.next-tourn').element.closest('section')!
    expect(section.classList.contains('bare'), '«убрать рамку»').toBe(true)
    // ⚠ AND THE FRAME IS REALLY OFF, read through the cascade rather than off the class name –
    // `section.bare` is src/style.css's rule and this is what the browser would paint.
    const paint = getComputedStyle(section)
    expect(paint.border === '' || paint.border.includes('none') || paint.borderWidth === '0px').toBe(true)
    w.unmount()
  })

  it('⚠ ...and a week with nothing entered keeps the frame it had – not asked is not permission', () => {
    const world = createWorld('r30-this-week-empty', DEFAULT_PROFILE)
    useGameStore().snapshot = toSnapshot(world)
    const w = mount(ThisWeekScreen, { attachTo: document.body })
    expect(w.find('.next-tourn').exists()).toBe(false)
    const sections = w.findAll('section')
    expect(sections[0].classes(), 'the training-week state is untouched').not.toContain('bare')
    w.unmount()
  })

  it('⭐ «план тренировок внизу остаётся как есть» – the plan section keeps its frame and its parts', () => {
    useGameStore().snapshot = enteredCareer()
    const w = mount(ThisWeekScreen, { attachTo: document.body })
    const sections = w.findAll('section')
    const plan = sections.find((s) => s.text().includes('Training plan'))!
    expect(plan, 'the plan section is still there').toBeTruthy()
    expect(plan.classes(), 'and it is still framed').not.toContain('bare')
    expect(plan.findAll('.option-pill').length, 'its presets are untouched').toBeGreaterThan(0)
    expect(plan.find('.this-week-plan').exists()).toBe(true)
    expect(plan.find('.spend-row').exists()).toBe(true)
    w.unmount()
  })
})

// ROUND 15, GROUP D - the surfaces that print the wrong thing, MOUNTED.
//
// Four describes: the season plaque (R15-18), the radar legend (R15-15), the Kid screen's radar
// panel (R15-18 again, one screen over) and the two accessibility defects the e2e sweep filed
// against the coach market on 09.08.
//
// Every claim here is about what a player SEES or HEARS, so every one is asserted against a real
// component rendering a real snapshot. A source pin would have been cheaper and would have proved
// nothing: "the file contains SELF_FIELD_LINES" says nothing about whether a self-coached family
// ever gets one, "the file contains radar-legend" says nothing about whether the legend reaches the
// page, and "the file contains aria-labelledby" says nothing about what a control is called AFTER
// somebody presses it - which was the whole defect.
//
// ⚠ MUTATION-VERIFIED. Every `it` below was watched failing before it was believed:
//   * `selfCoached` pinned to `false` -> the self-coached label test goes red on "Coach says:".
//   * `readLabel` returned as a constant -> the two-registers test goes red.
//   * the SELF_FIELD_LINES branch removed from `coachSays` -> the register test goes red on the
//     coach pool leaking onto a self-coached card.
//   * the `<ul class="radar-legend">` block deleted -> all four legend tests go red.
//   * a key given its own class instead of the one the shape it explains wears -> the "the key IS the
//     stroke" test goes red while the label test still passes, which is why they are separate.
//   * `radarBlurb`'s condition pinned to `true` -> the self-coached panel test goes red.
//   * the self branch of `radarBlurb` stripped of the two shapes -> "the PICTURE is untouched" goes
//     red while the register tests stay green, which is why that one is separate too.
//   * `aria-labelledby` removed from the sort control -> red, and the message is the defect itself:
//     expected 'SortPrice' to be 'SortBest fit'. Same for the style control beside it.
//   * `:aria-label="rowLabel(r)"` removed from the row -> the label test goes red.
//   * `rowLabel`'s `current` arm changed to 'hire' -> the action test goes red on its own.
//   * the portrait given back `:alt="r.name"` -> the decorative-portrait test goes red.
//
// ⚠ SEASONSCREEN, KIDSCREEN AND COACHMARKETSCREEN ARE STORE-DRIVEN and SKILLSRADAR IS PROP-DRIVEN,
// so the describes build their fixture differently on purpose - see tests/component/season-screen.test.ts
// for why a screen fixture is a real world through the real protocol rather than a hand-written
// snapshot.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SkillsRadar from '../../src/components/SkillsRadar.vue'
import KidScreen from '../../src/components/screens/KidScreen.vue'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type CoachTier, type RadarAxis, type Snapshot } from '../../src/shared/protocol'
import { SKILL_KEYS } from '../../src/engine/development'
import { mountSeason } from '../helpers/mountSeason'

/** A real career at a chosen rung, walked far enough to have a calendar with previews on it. */
function snapshotAt(coachTier: CoachTier, weeks = 12, seed = `r15-${coachTier}`): Snapshot {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier })
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  return toSnapshot(world)
}

function mountWithSnapshot(component: typeof KidScreen | typeof CoachMarketScreen, snapshot: Snapshot) {
  const store = useGameStore()
  store.snapshot = snapshot
  return mount(component, { global: { stubs: { teleport: true } } })
}

// =================================================================================================
// R15-18 - "Coach says:" to a family that has hired nobody.
//
// `coachSays(e)` read `e.preview` alone and never asked whether anybody was on the payroll, so an
// 8k self-coached career got professional draw analysis, for free, under a plaque naming a coach who
// does not exist. Owner, 09.08: «на 8к без тренера на карточках в season написано coach says и очень
// профессионально… непонятно чем этот вариант отличается от тренера».
//
// The fix is PRESENTATION. `preview` is untouched, the ring beside the plaque is the same number
// either way, and the mechanical answer to "what does a coach buy" is the per-day training controls
// being designed separately. What these tests hold is that the words name the right author.
// =================================================================================================
describe('R15-18 - the plaque names whoever is actually reading the draw', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('a hired coach still says "Coach says:"', () => {
    const snapshot = snapshotAt('middle')
    expect(snapshot.coachId, 'the fixture must actually have hired somebody').not.toBeNull()
    const wrapper = mountSeason(snapshot)
    const labels = wrapper.findAll('.event-coach-label').map((n) => n.text())
    expect(labels.length).toBeGreaterThan(0)
    for (const l of labels) expect(l).toBe('Coach says:')
    wrapper.unmount()
  })

  it('...and a family paying nobody is never told a coach said anything', () => {
    // The owner's own case: `coachTier: 'self'` leaves `coachId` null, which is the engine's answer
    // to "is anybody hired" and the only fact the screen is allowed to read for this.
    const snapshot = snapshotAt('self')
    expect(snapshot.coachId, 'the fixture must actually be self-coached').toBeNull()
    const wrapper = mountSeason(snapshot)
    const labels = wrapper.findAll('.event-coach-label').map((n) => n.text())
    expect(labels.length).toBeGreaterThan(0)
    for (const l of labels) expect(l).toBe('Your read:')
    // ...and nowhere else on the page either. The plaque was the only surface making the claim, and
    // a sweep of the rendered text is what stops it coming back through a different element.
    expect(wrapper.text()).not.toContain('Coach says')
    wrapper.unmount()
  })

  it('the line itself changes register, not just the label - and it does NOT vanish', () => {
    // ⚠ A BLANK CARD IS WORSE THAN A PLAIN ONE. The failure mode this test exists to catch is the
    // lazy fix: hide the plaque when nobody is hired, and the self-coached family loses the one
    // sentence on the card that says anything about the draw. So the assertion is two-sided - the
    // words must be DIFFERENT and they must be THERE.
    const self = mountSeason(snapshotAt('self'))
    const selfLines = self.findAll('.event-coach-line').map((n) => n.text())
    self.unmount()

    setActivePinia(createPinia())
    const hired = mountSeason(snapshotAt('middle'))
    const hiredLines = hired.findAll('.event-coach-line').map((n) => n.text())
    hired.unmount()

    expect(selfLines.length).toBeGreaterThan(0)
    for (const l of selfLines) expect(l.trim().length).toBeGreaterThan(0)
    // The two pools share no wording at all - a parent squinting at a draw sheet and a professional
    // reading a field are meant to be audibly different people, which is the whole item.
    expect(new Set(selfLines).size).toBeGreaterThan(0)
    for (const l of selfLines) expect(hiredLines).not.toContain(l)
  })

  it('the same career, self-coached, still gets VARIETY across its cards', () => {
    // The parent pools are four wordings per verdict like the coach's, off the same per-event
    // sub-stream. A branch that returned one string would satisfy every test above and would be the
    // "Club courts – 5 h" defect wearing a different hat, one screen over.
    const wrapper = mountSeason(snapshotAt('self', 20, 'r15-variety'))
    const lines = wrapper.findAll('.event-coach-line').map((n) => n.text())
    expect(lines.length).toBeGreaterThan(2)
    expect(new Set(lines).size).toBeGreaterThan(1)
    wrapper.unmount()
  })
})

// =================================================================================================
// R15-15 - the dashed line on the radar had no legend.
//
// Owner, 09.08: «а что значит пунктирная линия на нашей розе скиллов?» It was `.radar-ceiling-edge`,
// the far edge of the ceiling haze - where the coach believes her potential is - deliberately faint
// and dashed against the solid contour of what has actually been seen. The DRAWING was right;
// nothing anywhere said so.
//
// ⚠ RE-AIMED 11.08, NOT WEAKENED, AND THE PICTURE MOVED UNDER IT TWICE OVER. The owner then ruled
// that edge OFF - «контур "безнадежности" текущий надо убрать… Заблюренная зона это ок.» - and had
// the rose grow a THIRD shape, "where she started". So the legend this block guards now has three
// keys instead of two, and the shape the third one explains is a filled region rather than a stroke.
// Every claim below is the same claim: one key per shape, each wearing the paint of the shape it
// stands for, present before the coach has said a word, carrying no digits. The count and the class
// names are what moved, and both are read off the picture rather than asserted from memory.
// =================================================================================================

/** Axes with a real fog, a real ceiling band and a real starting point, so all three shapes are
 *  drawn. `note` is null on all of them deliberately - the legend must not depend on the coach having
 *  found something to say. `startValue` sits below `shownValue`, which is what a career that has gone
 *  forward looks like. */
const AXES: RadarAxis[] = SKILL_KEYS.map((key, i) => ({
  key,
  shownValue: 40 + i * 3,
  startValue: 31 + i * 3,
  band: 9,
  ceilingLo: 62 + i * 2,
  ceilingHi: 80 + i * 2,
  note: null,
}))

describe('R15-15 - the radar says what its lines mean', () => {
  it('there is a legend, and it names every shape the picture draws', () => {
    const wrapper = mount(SkillsRadar, { props: { axes: AXES, title: 'Her game' } })
    const keys = wrapper.findAll('.radar-legend li').map((n) => n.text())
    expect(keys).toHaveLength(3)
    expect(keys[0]).toContain('Where she started')
    expect(keys[1]).toContain('Where she is')
    expect(keys[2]).toContain('How far she could go')
    wrapper.unmount()
  })

  it('...and the keys ARE the paint they stand for, not a second drawing of it', () => {
    // ⚠ THE DESIGN'S OWN PRINCIPLE, MECHANICALLY. The file's comment: every shape is one accent at a
    // different strength, "because they are the same uncertainty at two distances". A legend with
    // hand-picked swatch colours would be free to drift from the picture on the very next restyle.
    // Each key wears the SAME class as the shape it explains, so a restyled contour restyles its own
    // key and a legend that lies about the drawing is not constructible.
    const wrapper = mount(SkillsRadar, { props: { axes: AXES, title: 'Her game' } })
    const items = wrapper.findAll('.radar-legend li')
    expect(items[0].find('path').classes()).toContain('radar-start')
    expect(items[1].find('path').classes()).toContain('radar-core')
    // ⚠ THE HAZE'S KEY IS A RECT AND THAT IS THE POINT, not an inconsistency. `.radar-ceiling` is a
    // FILL with no stroke - it lost its outline on 11.08 - so a two-point path wearing it would draw
    // literally nothing. A key that renders empty is worse than no key.
    expect(items[2].find('rect').classes()).toContain('radar-ceiling')
    // The picture really does draw all three, so the keys are keys to something.
    expect(wrapper.find('svg.radar-svg path.radar-start').exists()).toBe(true)
    expect(wrapper.find('svg.radar-svg path.radar-core').exists()).toBe(true)
    expect(wrapper.find('svg.radar-svg path.radar-ceiling').exists()).toBe(true)
    wrapper.unmount()
  })

  it('the legend is there before the coach has anything to say, which is when it is needed most', () => {
    // `note` is null on every axis early in a career - that is the quiet state the fog is for - and
    // it is exactly when a player first meets an unexplained dashed line. A legend rendered inside
    // the notes list would disappear on precisely that week.
    const wrapper = mount(SkillsRadar, { props: { axes: AXES, title: 'Her game' } })
    expect(wrapper.find('.radar-notes').exists()).toBe(false)
    expect(wrapper.find('.radar-quiet').exists()).toBe(true)
    expect(wrapper.findAll('.radar-legend li')).toHaveLength(3)
    wrapper.unmount()
  })

  it('and it still carries NO NUMBERS, which is the ruling the whole element exists under', () => {
    // decisions.md #11: no numbers on the axes, in a tooltip, or in the aria-label. A legend is a
    // new place for a digit to appear, so the ban is re-asserted over the new text rather than
    // assumed to have been inherited.
    const wrapper = mount(SkillsRadar, { props: { axes: AXES, title: 'Her game' } })
    const legend = `${wrapper.find('.radar-legend').text()} ${wrapper.find('.radar-legend-note').text()}`
    expect(legend).not.toMatch(/\d/)
    // Short dash only in player-facing copy, and no Cyrillic anywhere near a template.
    expect(legend).not.toContain('—')
    expect(legend).not.toMatch(/[Ѐ-ӿ]/)
    wrapper.unmount()
  })
})

// =================================================================================================
// R15-18, ONE SCREEN OVER - the Kid screen's radar panel credited a coach nobody had hired.
//
// The same defect as the season plaque above, on the surface the owner's question about the dashed
// line was asked from. The tile directly above this panel has printed "You" for a self-coached
// family since it was built (`coachName`), and the sentence under it still said "What her coach can
// tell so far". The radar's MODEL already knows the difference - engine/radar.ts prices the `self`
// rung's read lowest and never lets it resolve - so this is the words catching up with the maths.
// =================================================================================================
describe('R15-18 - the radar panel names whoever is actually watching her', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('a hired coach is still the one reading her game', () => {
    const wrapper = mountWithSnapshot(KidScreen, snapshotAt('middle'))
    const note = wrapper.find('.kid-panel-note').text()
    expect(note).toContain('What her coach can tell so far')
    expect(note).toContain('as the coach learns her')
    wrapper.unmount()
  })

  it('...and a family paying nobody is told it is their own read', () => {
    const snapshot = snapshotAt('self')
    expect(snapshot.coachId, 'the fixture must actually be self-coached').toBeNull()
    const wrapper = mountWithSnapshot(KidScreen, snapshot)
    const note = wrapper.find('.kid-panel-note').text()
    expect(note).toContain('What you can tell so far')
    expect(note).toContain('as you learn her')
    // The claim that was wrong, gone from the whole panel rather than from one sentence.
    expect(note).not.toContain('coach')
    wrapper.unmount()
  })

  it('the PICTURE is untouched - every shape is still drawn, and so is the legend', () => {
    // ⚠ VOICE, NOT VALUE, asserted rather than promised. The register change may not cost the
    // self-coached family anything the paying one gets: same contours, same fog, same legend, and the
    // same sentences describing them. Only the reader's name moves.
    //
    // ⚠ RE-AIMED 11.08 AT THE PICTURE THE OWNER RULED FOR, and it is the same claim about the same
    // thing: the shapes named in the frame are the shapes on the page, for both registers. The dashed
    // CEILING edge went (it read as a verdict about how far she could go); a dashed START contour
    // arrived, and the sentence grew a third clause to match. So the assertion moved from "the two
    // shapes" to "all three", which is strictly more than it held before.
    for (const tier of ['self', 'middle'] as const) {
      setActivePinia(createPinia())
      const wrapper = mountWithSnapshot(KidScreen, snapshotAt(tier))
      expect(wrapper.find('svg.radar-svg path.radar-start').exists(), tier).toBe(true)
      expect(wrapper.find('svg.radar-svg path.radar-core').exists(), tier).toBe(true)
      expect(wrapper.find('svg.radar-svg path.radar-ceiling').exists(), tier).toBe(true)
      expect(wrapper.findAll('.radar-legend li'), tier).toHaveLength(3)
      const note = wrapper.find('.kid-panel-note').text()
      expect(note, tier).toContain('The dashed shape is where she started')
      expect(note, tier).toContain('the solid shape is where she is')
      expect(note, tier).toContain('the haze around them is how far she might go')
      wrapper.unmount()
    }
  })
})

// =================================================================================================
// THE TWO ACCESSIBILITY DEFECTS THE E2E SWEEP FILED AGAINST THIS SCREEN (09.08), fixed here because
// R15-7 had this file open anyway.
//
//   1. THE SORT CONTROL RENAMED ITSELF WHEN PRESSED. Its visible text is LABEL + CURRENT VALUE and
//      all of it was the accessible name, so pressing "Sort Best fit" left the user on a button
//      called "Sort Price" - indistinguishable from the focus having moved. Same shape on the Style
//      button beside it, which is the identical control and is fixed with it.
//   2. THE COACH ROWS WERE UNLABELLED - or rather named by concatenation, which is the same thing to
//      a listener: name, pill, style, uplift range, load note, price and action word ran together
//      into an unpunctuated paragraph with the decision buried in it.
//
// ⚠ HOW AN ACCESSIBLE NAME IS CHECKED HERE. happy-dom computes no accname, so `accessibleName` below
// walks the first two steps of the real algorithm - `aria-label`, then `aria-labelledby` resolved
// against the document - which are the only two steps these controls use. It is deliberately NOT a
// source pin: it reads the rendered DOM, and the press really happens.
// =================================================================================================
function accessibleName(wrapper: ReturnType<typeof mountWithSnapshot>, selector: string): string {
  const el = wrapper.find(selector)
  const label = el.attributes('aria-label')
  if (label !== undefined) return label
  const ids = el.attributes('aria-labelledby')
  if (ids !== undefined) return ids.split(/\s+/).map((id) => wrapper.find(`#${id}`).text()).join(' ')
  return el.text()
}

/** ⚠ THE MARKET IS BEHIND A TAB SINCE v47 (docs/specs/training-dials.md §9a) – the Coach Market
 *  screen is `Her week` / `Coaches` on the app's one segmented row, and it opens on the plan. So the
 *  six tests below have to be ON the tab they are about before they can assert anything, which is a
 *  navigation step and not a weakening: every assertion in this describe is unchanged, and the click
 *  is the same one a player makes. It is asserted rather than assumed, so a renamed tab is loud. */
async function openCoaches(wrapper: ReturnType<typeof mountWithSnapshot>): Promise<void> {
  const tab = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Coaches')
  expect(tab, 'the Coaches tab is gone from the market screen').toBeTruthy()
  await tab!.trigger('click')
  expect(wrapper.findAll('.cm-row').length, 'the Coaches tab drew no rows').toBeGreaterThan(0)
}

describe('a11y - the coach market announces itself honestly', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('the sort control keeps its name when it is pressed, and its VALUE still changes', async () => {
    const wrapper = mountWithSnapshot(CoachMarketScreen, snapshotAt('middle'))
    await openCoaches(wrapper)
    const buttons = wrapper.findAll('.market-drop')
    const sort = buttons[buttons.length - 1]
    const before = accessibleName(wrapper, '.market-controls .market-drop:last-child')
    const valueBefore = sort.find('strong').text()

    await sort.trigger('click')

    const after = accessibleName(wrapper, '.market-controls .market-drop:last-child')
    const valueAfter = sort.find('strong').text()
    // The defect, stated: `before` used to be "Sort Best fit" and `after` "Sort Price".
    expect(after).toBe(before)
    expect(before).toBe('Sort')
    // ...and the control really did do something, so the test above cannot be satisfied by a button
    // that stopped working.
    expect(valueAfter).not.toBe(valueBefore)
    // The changing half is still spoken - as the DESCRIPTION, which is where a value belongs.
    expect(sort.attributes('aria-describedby')).toBe('cm-sort-value')
    expect(wrapper.find('#cm-sort-value').text()).toBe(valueAfter)
    wrapper.unmount()
  })

  it('the style control has the same shape and the same fix', async () => {
    const wrapper = mountWithSnapshot(CoachMarketScreen, snapshotAt('middle'))
    await openCoaches(wrapper)
    const style = wrapper.findAll('.market-drop')[0]
    const before = accessibleName(wrapper, '.market-controls .market-drop:first-child')
    const valueBefore = style.find('strong').text()
    await style.trigger('click')
    expect(accessibleName(wrapper, '.market-controls .market-drop:first-child')).toBe(before)
    expect(before).toBe('Style')
    expect(style.find('strong').text()).not.toBe(valueBefore)
    wrapper.unmount()
  })

  it('every coach row has a label, and it is the DECISION: who, which rung, the fit, the price', async () => {
    const wrapper = mountWithSnapshot(CoachMarketScreen, snapshotAt('middle'))
    await openCoaches(wrapper)
    const rows = wrapper.findAll('.cm-row')
    expect(rows.length).toBeGreaterThan(3)
    for (const row of rows) {
      const label = row.attributes('aria-label')
      expect(label, 'a row with no label').toBeTruthy()
      // Every fact in the label is a fact the card itself prints - a label that drifts from the row
      // it labels is worse than none, so each one is checked against that row's own text.
      expect(label, label).toContain(row.find('.cm-name').text())
      expect(label, label).toContain(row.find('.cm-price').text().replace('/wk', ''))
      expect(label, label).toMatch(/(Great fit|Good fit|Off-style)/)
      expect(label, label).toMatch(/ tier,/)
      // Player-facing copy rules reach the labels too: they are read out loud, so they are copy.
      expect(label, label).not.toContain('—')
      expect(label, label).not.toMatch(/[Ѐ-ӿ]/)
    }
    // No two rows sound the same - the whole point of naming them individually.
    const labels = rows.map((r) => r.attributes('aria-label'))
    expect(new Set(labels).size).toBe(labels.length)
    wrapper.unmount()
  })

  it('the label says what pressing it would DO, and the current coach is not offered for hire', async () => {
    const wrapper = mountWithSnapshot(CoachMarketScreen, snapshotAt('middle'))
    await openCoaches(wrapper)
    const rows = wrapper.findAll('.cm-row')
    const current = rows.filter((r) => r.classes().includes('current'))
    expect(current.length, 'the fixture must have somebody hired').toBe(1)
    expect(current[0].attributes('aria-label')).toContain('her coach now')
    // Every OTHER row ends in the action its visible chip shows, so the two cannot disagree.
    for (const row of rows) {
      const label = row.attributes('aria-label') ?? ''
      const action = row.find('.cm-action').text()
      if (action === 'Current') expect(label).toContain('her coach now')
      else if (action.endsWith('pts short')) expect(label).toContain('ranking points short')
      else if (action.endsWith('over')) expect(label).toContain('over budget by')
      else expect(label, label).toMatch(/– hire$/)
    }
    wrapper.unmount()
  })

  it('R15-7, MOUNTED on the screen he was looking at: nothing rendered here says "he"', async () => {
    // ⚠ THE CORPUS CLAIM LIVES IN tests/coach-voice.test.ts and cannot be mounted - "no surface
    // anywhere" is not a thing any number of mounts can prove. THIS is the other half: the owner's
    // sighting was «у Тернеров в списке везде "He"», i.e. this list, so the screen he named renders
    // its whole self here - rows, load notes, price note, room note and the labels a screen reader
    // gets - and no masculine pronoun survives in any of it.
    const wrapper = mountWithSnapshot(CoachMarketScreen, snapshotAt('middle'))
    await openCoaches(wrapper)
    const spoken = [
      wrapper.text(),
      ...wrapper.findAll('[aria-label]').map((n) => n.attributes('aria-label') ?? ''),
    ].join(' \n ')
    expect(spoken.length).toBeGreaterThan(200)
    const offenders = spoken.split('\n').filter((l) => /\b(he|his|him|himself)\b/i.test(l))
    expect(offenders).toEqual([])
    wrapper.unmount()
  })

  it('the portrait is decorative now the row is labelled - the name is not announced twice', async () => {
    const wrapper = mountWithSnapshot(CoachMarketScreen, snapshotAt('middle'))
    await openCoaches(wrapper)
    const arts = wrapper.findAll('.cm-art img')
    expect(arts.length).toBeGreaterThan(3)
    for (const img of arts) expect(img.attributes('alt')).toBe('')
    wrapper.unmount()
  })
})

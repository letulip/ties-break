// ⭐ ROUND 41 #5 – THE KID SCREEN'S DESKTOP LAYOUT, HOME'S OWN IDIOM TRANSPLANTED.
//
// The owner: «на десктоп на экране ребенка (по клику на аватар в углу) давай тоже сделаем как на
// главной примерно: кватратная картинка полная, все карточки останутся внизу, а вот эти ее Skills
// может быть вполне влезут возле фото справа.» (quoted here rather than in the template –
// tests/round13-nav.test.ts bans Cyrillic inside one).
//
// ⚠ WHY THIS FILE READS DECLARED GRID PROPERTIES RATHER THAN PIXEL POSITIONS. happy-dom has no
// layout engine (fits.ts's own header), and unlike a flex row or a literal `grid-template-columns:
// 50% minmax(0, 1fr)` (round36-pass2-shop-recap.test.ts), THIS grid's tracks are `minmax(0, 512px)
// minmax(310px, 1fr)` – an `fr` unit and a content-driven minmax that no engine without real layout
// can resolve to a pixel width. What the cascade DOES resolve honestly (verified by probing it
// directly) is the declared placement: `display`, the literal `grid-template-columns` string (var()
// substituted), and each item's own `grid-column`/`grid-row`/`align-self`. Those ARE the x-overlap
// guarantee, not a proxy for it: CSS Grid's own semantics make two items in disjoint column tracks
// spatially disjoint by construction, so "the hero sits in track 1 and Skills is placed in track 2"
// is the same claim a pixel measurement would make, stated in the vocabulary this runner can check.
//
// ⚠ MUTATION-VERIFIED (recorded in the round-41 ledger and the executor's report):
//   * delete the `@media (min-width: 1024px)` block entirely – every desktop-only assertion below
//     goes red (the phone-cascade arm stays green, which is the point: it is the control).
//   * delete only `.kid-panel-radar { grid-column: 2; grid-row: 1; }` – the Skills-placement arm
//     goes red alone; the hero and the "everything else wraps" arms stay green.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import KidScreen from '../../src/components/screens/KidScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { buildKidLife } from '../../src/engine/kidLife'
import { seasonYear } from '../../src/shared/dates'
import type { Snapshot } from '../../src/shared/protocol'
import { PHONE, DESKTOP, setViewport } from './fits'

/** A cheap real snapshot with `life.ownAccount` forced truthy, so at least one of the three
 *  conditional `.kid-grid-note` paragraphs is a REAL rendered element rather than an assertion
 *  about a class name nothing on screen carries. `buildKidLife` is the pure function
 *  round23-kid-page.test.ts already uses for exactly this – reused rather than re-derived, and far
 *  cheaper than the 300-week walk that test needs for its OTHER claims (this one needs none of
 *  them: only the age and the funds matter to `ownAccount`). */
function snapshotWithGridNote(): Snapshot {
  const base = toSnapshot(createWorld('kid-desktop-41'))
  const life = buildKidLife({
    seed: base.seed,
    week: base.week,
    ageYears: 20,
    seasonYear: seasonYear(Math.floor(base.week / 52)),
    playStyle: base.profile.playStyle,
    birthMonth: base.profile.birthMonth,
    injured: false,
    weeksAway: 0,
    lossStreak: 0,
    weeksSinceTitle: null,
    college: null,
    kidFundsCents: 512_835_00,
    ownsBrand: false,
  })
  return { ...base, life }
}

function mountKidAt(vp: typeof PHONE, snapshot: Snapshot) {
  setViewport(vp)
  useGameStore().snapshot = snapshot
  return mount(KidScreen, { attachTo: document.body, global: { stubs: { teleport: true } } })
}

describe('round 41 #5 – the kid screen at 1280: Home’s desktop idiom', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    setViewport(PHONE)
    document.body.innerHTML = ''
  })

  it('⭐⭐ the shell body becomes the same two-track grid Home’s hero row uses', () => {
    expect(document.head.querySelector('style'), 'no stylesheet – this would be vacuous').toBeTruthy()
    const w = mountKidAt(DESKTOP, snapshotWithGridNote())
    const body = document.querySelector('.tb-screen-body')!
    const cs = getComputedStyle(body)
    expect(cs.display, 'the screen body is the grid container').toBe('grid')
    // `--hero-max` (512px) and the 310px floor are HomeScreen.vue's own tokens for this exact
    // breakpoint (src/style.css) – reused, not re-picked, which is what makes "как на главной" a
    // fact about the code rather than a coincidence of two hand-typed numbers.
    expect(cs.gridTemplateColumns.replace(/\s+/g, ' ')).toBe('minmax(0, 512px) minmax(310px, 1fr)')
    w.unmount()
  })

  it('⭐⭐ the photo takes the first track, square-ish and capped, exactly as Home’s hero does', () => {
    const w = mountKidAt(DESKTOP, snapshotWithGridNote())
    const hero = getComputedStyle(w.find('.kid-hero').element)
    expect(hero.gridRow, 'spans both rows, so the pair beside it can be two cards tall').toContain('span 2')
    expect(hero.alignSelf, 'starts at the top rather than stretching to match a taller column').toBe('start')
    expect(hero.maxWidth, 'the same cap Home’s .diary-hero reads').toBe('512px')
    expect(hero.aspectRatio.replace(/\s+/g, ' '), 'Home’s own 1024+ ratio, not a new number').toBe('450 / 400')
    // `height: auto` is what lets the ratio size the box at all – the base (phone) rule's fixed
    // `height: 392px` would otherwise win outright, since a box with both dimensions already
    // definite never consults `aspect-ratio`.
    expect(hero.height).toBe('auto')
    w.unmount()
  })

  it('⭐⭐ ...AND SKILLS SITS IN THE SECOND TRACK, ROW ONE – beside the photo, not under it', () => {
    // ⚠ THIS IS THE CLAIM ITEM 5 IS ACTUALLY ABOUT. The Skills panel is the LAST of six blocks in
    // the template's own source order (after the attribute grid, both footnotes and the moments
    // strip) – if this reads anything but column 2 / row 1, the template was reordered instead of
    // grid-placed, or the placement rule never reached this element.
    const w = mountKidAt(DESKTOP, snapshotWithGridNote())
    const skills = w.find('.kid-panel-radar')
    expect(skills.exists(), 'the Skills card is on the page').toBe(true)
    const cs = getComputedStyle(skills.element)
    expect(cs.gridColumn, 'the second track – Home’s own cards column').toBe('2')
    expect(cs.gridRow, 'the same row the photo starts in').toBe('1')
    w.unmount()
  })

  it('⭐ everything else wraps to a full-width row below the hero/Skills pair', () => {
    const w = mountKidAt(DESKTOP, snapshotWithGridNote())
    const fullWidth = (sel: string, label: string) => {
      const el = document.querySelector(sel)
      expect(el, `${label} is on the page`).toBeTruthy()
      expect(getComputedStyle(el!).gridColumn, label).toBe('1 / -1')
    }
    fullWidth('.kid-grid', 'the attribute grid')
    // A REAL rendered note, off `snapshotWithGridNote`'s own fixture – not a claim about a class
    // name, a claim about an element actually on this screen.
    fullWidth('.kid-note-account', 'her own-account footnote')
    // The two panels that are NOT the Skills radar – `.kid-panel` minus `.kid-panel-radar`.
    const otherPanels = [...document.querySelectorAll('.kid-panel')].filter(
      (el) => !el.classList.contains('kid-panel-radar'),
    )
    expect(otherPanels.length, 'Important moments and Counting results, both on screen').toBe(2)
    for (const el of otherPanels) {
      expect(getComputedStyle(el).gridColumn, 'a panel that is not the Skills card').toBe('1 / -1')
    }
    w.unmount()
  })

  it('⚠ and nothing below 1024 moved – the phone still stacks in a plain column', () => {
    const w = mountKidAt(PHONE, snapshotWithGridNote())
    const body = document.querySelector('.tb-screen-body')!
    expect(getComputedStyle(body).display, 'no grid below 1024').not.toBe('grid')
    const hero = getComputedStyle(w.find('.kid-hero').element)
    expect(hero.height, 'the shipped fixed height, untouched').toBe('392px')
    expect(hero.gridRow === '' || hero.gridRow === 'auto', 'no grid placement at all on a phone').toBe(true)
    w.unmount()
  })
})

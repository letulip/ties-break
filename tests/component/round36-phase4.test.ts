// ⭐⭐⭐ ROUND 36 PHASE 4 – THE SCREENS THE DESIGN PACK DOES NOT DRAW, MOUNTED.
//
// Phases 2 and 3 worked from sixteen frames. This phase has none: the onboarding wizard, the match
// viewer, the draw, the finale poster, the epilogue, the shop and the prologue are «расширить
// колонку, больше ничего не менять» inherited, plus rule 4 of the round –
//
//   «можно его НЕ тянуть на всю ширину, посмотрите, чтобы красиво было»
//
// – which is the judgement the owner asked for by name when phase 3 capped «Her own account» at
// 640. Every arm below is a cap or a column, and every one of them was MEASURED IN CHROMIUM FIRST
// (the numbers are in docs/rounds/round-36.md); this file is what stops them drifting.
//
// ⚠ THE ORDER IS ALWAYS `setViewport` -> mount -> read. happy-dom evaluates a media query on an
// element's FIRST computed-style read and then caches it – phase 2 measured that and wrote it down
// beside `TABLET` in fits.ts. Setting the width after the mount reads the previous test's screen.
//
// ⚠ `attachTo: document.body` IS MANDATORY, not tidy: happy-dom applies no rule at all to a detached
// tree, so every computed value here would be an initial one and every arm would be vacuous.
//
// ⚠ MUTATION-VERIFIED – what each mutation reddened is written above each block.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import TakeoverShell from '../../src/components/ui/TakeoverShell.vue'
import MatchViewer from '../../src/components/MatchViewer.vue'
import OnboardingWizard from '../../src/components/OnboardingWizard.vue'
import EndingScreen from '../../src/components/EndingScreen.vue'
import PrologueLocalOpen from '../../src/components/PrologueLocalOpen.vue'
import TournamentFlow from '../../src/components/TournamentFlow.vue'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { JUNIOR_TOUR } from '../../src/engine/season/tournament'
import {
  KID_ID,
  closeTournament,
  createWorld,
  decideKnock,
  enterEvent,
  pendingKnock,
  skipTournament,
  tickWeek,
  toSnapshot,
} from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { playLocalOpen, prologueEntrant } from '../../src/prologue/pool'
import type { MatchOptions, MatchPlayer } from '../../src/engine/match/types'
import type { AlbumPage, CareerEndingType, EndingView, Snapshot } from '../../src/shared/protocol'
import { DESKTOP, PHONE, TABLET, setViewport } from './fits'

function assertSheetPresent(): void {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`')
  }
}

/** The token ladder, read off the document the way a rule reads it. */
function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/**
 * ⚠ TWO HAPPY-DOM FACTS, BOTH MET WHILE WRITING THIS FILE AND BOTH WORTH STATING ONCE.
 *
 *  1. AN UNSET `max-width` COMES BACK AS THE EMPTY STRING, not as `none`. A test that asserted
 *     `'none'` would go red on a rule that is genuinely absent, which is the wrong direction.
 *  2. `margin-inline: auto` IS NOT EXPANDED INTO `marginLeft` / `marginRight`. The shorthand is
 *     readable and the longhands are empty, so «is it centred» has to ask both – and `.tf-top` /
 *     `.tf-body` use `margin: 0 auto`, which DOES expand, so both forms are really in the sheet.
 */
function maxWidthOf(selector: string): string {
  const el = document.querySelector(selector)
  if (!el) throw new Error(`${selector} is not on the screen – there is nothing to measure`)
  return getComputedStyle(el).maxWidth || 'none'
}

function isCentred(selector: string): boolean {
  const el = document.querySelector(selector)
  if (!el) throw new Error(`${selector} is not on the screen – there is nothing to measure`)
  const cs = getComputedStyle(el)
  return cs.marginLeft === 'auto' || (cs.getPropertyValue('margin-inline') || '').includes('auto')
}

// =================================================================================================
// 1. THE TAKEOVER'S READING COLUMN
// =================================================================================================
// `--takeover-col-max` is 480 below 768 – the number `.onboarding-body, .tf-body` and `.tf-top` each
// spelled out before this phase – and `--app-max-width` above it, which is the cap the wizard and
// the tour briefing already sat on. Measured in Chromium: the live court was 446px wide at 768, 900,
// 1024 AND 1280 before this, and the takeover column is 736 / 848 after it.
//
// MUTATION-VERIFIED, each alone:
//   * the 768 rung deleted from the token -> the tablet and desktop arms, phone still green;
//   * `.tf-top`'s `max-width` reverted to a literal 480px -> the header/body join arm alone;
//   * `.tf-body`'s reverted -> the body arm and the join.
describe('round 36 phase 4 – the takeover gets a column', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => setViewport(PHONE))

  /**
   * ⚠ THE LADDER IS READ THROUGH THE RULES THAT CONSUME IT AND NOT OFF THE CUSTOM PROPERTY, which
   * is a stronger claim AND the only one this runner can make. happy-dom resolves `var()` when it
   * computes a real property – `max-width: var(--takeover-col-max)` comes back as `880px` – but
   * `getPropertyValue('--takeover-col-max')` on the root returns the BASE declaration whatever the
   * viewport is, so an arm written against the token would have said 480 at every width and been
   * wrong about a rule that works.
   */
  async function takeoverCaps(vp: { width: number; height: number }): Promise<[string, string]> {
    setViewport(vp)
    const wrapper = mount(TakeoverShell, {
      attachTo: document.body,
      props: { title: 'Clay Open' },
      slots: { default: '<p>a screen in the body</p>', exit: '<button>To result</button>' },
    })
    await nextTick()
    const caps: [string, string] = [maxWidthOf('.tf-top'), maxWidthOf('.tf-body')]
    wrapper.unmount()
    document.body.innerHTML = ''
    return caps
  }

  it('⭐⭐ the header and the body read ONE token, and it is the takeover cap past 768', async () => {
    assertSheetPresent()
    const cap = token('--app-max-width')
    expect(cap, 'the takeover cap is declared').toBe('880px')
    expect(await takeoverCaps(TABLET), 'a tablet takes the takeover cap').toEqual([cap, cap])
    expect(await takeoverCaps(DESKTOP), 'and so does a desktop – the plateau is the cap').toEqual([cap, cap])
  })

  it('⚠ …and on a phone both are the 480 they have always been', async () => {
    assertSheetPresent()
    expect(await takeoverCaps(PHONE), 'not one phone pixel moved').toEqual(['480px', '480px'])
  })
})

// =================================================================================================
// 2. THE COURT STOPS AT ITS OWN DRAWING SURFACE
// =================================================================================================
// The canvas is a FIXED internal resolution scaled by `devicePixelRatio` (`CSS_W` / `CSS_H` in
// MatchViewer.vue), so every CSS pixel past 680 is a 680px bitmap being enlarged. Until this phase
// the takeover column was 480 and the court could never reach it; the column is 848 now, and inside
// the prologue's weekend – which had no column at all – the takeover measured 1,256px at 1280 and the
// court inherits its width.
//
// MUTATION-VERIFIED: the `:style` binding removed from `.mv-court` -> the cap arm and the join arm;
// `margin-inline: auto` deleted -> the centring arm alone; `CSS_W` changed to 640 -> BOTH the cap and
// the aspect-ratio move together, which is the join this arm exists to state.
describe('round 36 phase 4 – the match court', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => setViewport(PHONE))

  function fixture() {
    const p = (over: Partial<MatchPlayer>): MatchPlayer => ({
      id: 'p',
      name: 'P',
      serve: 50,
      ret: 50,
      composure: 50,
      stamina: 50,
      groundstrokes: 50,
      ...over,
    })
    const a = p({ id: 'a', name: 'Vera Novak', serve: 62 })
    const b = p({ id: 'b', name: 'Ines Duval', serve: 48 })
    const opts: MatchOptions = { surface: 'hard', tour: JUNIOR_TOUR, seed: 'r36-p4-court' }
    return { a, b, match: annotateMatch(simulateMatch(a, b, opts), a, b, opts) }
  }

  it('⭐⭐ the cap IS the drawing surface’s own width, and it is centred', async () => {
    assertSheetPresent()
    setViewport(DESKTOP)
    const { a, b, match } = fixture()
    const wrapper = mount(MatchViewer, {
      attachTo: document.body,
      props: { match, playerA: a, playerB: b, surface: 'hard' as const, mode: 'replay' as const },
    })
    await nextTick()
    const court = document.querySelector('.mv-court')
    expect(court, 'the viewer drew a court').toBeTruthy()
    const cs = getComputedStyle(court!)
    // The cap is bound inline off `CSS_W`, so this reads the constant rather than a copy of it.
    expect(cs.maxWidth, 'the court stops at the bitmap it is drawn from').toBe('680px')
    expect(isCentred('.mv-court'), 'and what is left of the column is either side of it').toBe(true)

    // ⭐ THE JOIN, WHICH IS THE POINT OF BINDING BOTH OFF ONE CONSTANT: the number the court stops at
    // is the same number the ratio is written from. A cap typed as a literal would pass the arm
    // above and drift the day `CSS_W` moves.
    const ratio = getComputedStyle(document.querySelector('.mv-canvas')!).aspectRatio
    const width = /^\s*(\d+)\s*\/\s*(\d+)\s*$/.exec(ratio)?.[1]
    expect(width, `the canvas ratio is a pair of numbers (${ratio})`).toBeTruthy()
    expect(`${width}px`, 'the cap and the ratio come from the same constant').toBe(cs.maxWidth)
    wrapper.unmount()
  })

  it('⚠ …and a phone is untouched: the court is the column, because the column is smaller', async () => {
    assertSheetPresent()
    setViewport(PHONE)
    const { a, b, match } = fixture()
    const wrapper = mount(MatchViewer, {
      attachTo: document.body,
      props: { match, playerA: a, playerB: b, surface: 'hard' as const, mode: 'replay' as const },
    })
    await nextTick()
    // The cap is on the element at every width – it is an inline binding, not a media query – and it
    // is INERT below 680px of column, which is what «nothing on a phone moved» means here.
    expect(getComputedStyle(document.querySelector('.mv-court')!).maxWidth).toBe('680px')
    wrapper.unmount()
  })
})

// =================================================================================================
// 3. THE ONBOARDING WIZARD'S READING COLUMN
// =================================================================================================
// Measured before, at 1280x900: the shell is 880, the pane 842 and «First name» is a text input
// 780px wide. 640 is the number phase 3 capped «Her own account» at, and the cap is on ScreenShell's
// three slots rather than on `.ob-pane` – the pane is a scrollport carrying `margin: -3px` for the
// focus-ring clip, and an auto inline margin there would fight it.
//
// ⚠ THE SHELL'S OWN 880 IS UNTOUCHED, and that is phase 1's open question for the owner. This file
// asserts it is still `--app-max-width`, so a later phase that answers his question moves ONE token
// and this arm follows it instead of pinning 880 in a second place.
//
// MUTATION-VERIFIED: the media block deleted -> both wide arms, phone green; `640px` raised to
// `100%` -> the wide arms alone; the `:deep(.tb-screen-foot)` selector dropped -> the footer arm.
describe('round 36 phase 4 – the wizard reads in a column', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => setViewport(PHONE))

  it('⭐ head, body and foot are one 640px column past 768', async () => {
    assertSheetPresent()
    setViewport(DESKTOP)
    const wrapper = mount(OnboardingWizard, {
      attachTo: document.body,
      global: { stubs: { teleport: true } },
    })
    await nextTick()
    for (const part of ['.tb-screen-head', '.tb-screen-body', '.tb-screen-foot']) {
      expect(maxWidthOf(part), `${part} is the reading column`).toBe('640px')
      expect(isCentred(part), `${part} is centred`).toBe(true)
    }
    // ...and the shell around them still carries the takeover cap, which is the owner's own open
    // question and not this phase's to answer.
    expect(maxWidthOf('.ob-shell'), 'the shell is unchanged').toBe(token('--app-max-width'))
    wrapper.unmount()
  })

  it('⚠ …and a phone has no column at all – the gutter is the whole of it', async () => {
    assertSheetPresent()
    setViewport(PHONE)
    const wrapper = mount(OnboardingWizard, {
      attachTo: document.body,
      global: { stubs: { teleport: true } },
    })
    await nextTick()
    expect(maxWidthOf('.tb-screen-body'), 'no cap below 768').toBe('none')
    wrapper.unmount()
  })
})

// =================================================================================================
// 4. THE EPILOGUE
// =================================================================================================
// Measured before, at 1280x900: `.album-nav` was 1214px wide with **Back at x=33 and Next at x=1208**
// – 1175px apart, around a photograph 285px wide in the middle of them. An album is a page you turn;
// two arrows at opposite ends of a monitor are not a pager.
//
// MUTATION-VERIFIED: the media block deleted -> the desktop arm, phone green; the selector widened
// from `.ending > section` to `.ending` -> the ground arm, because the celebration colour then stops
// covering the page.
describe('round 36 phase 4 – the epilogue gets a column', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => setViewport(PHONE))

  function albumPage(slot: number): AlbumPage {
    return {
      slot,
      why: `why ${slot}`,
      caption: `caption ${slot}`,
      fact: `fact ${slot}`,
      week: 52 * slot,
      seasonIndex: slot,
      stage: 'teen',
      emotion: 'norm',
      empty: false,
    }
  }

  function endingView(type: CareerEndingType = 'stopped'): EndingView {
    return {
      ending: { type, week: 265, ageYears: 19, detail: 'she stopped at nineteen', resumesWeek: null },
      album: [1, 2, 3, 4, 5, 6, 7].map(albumPage),
      scroll: [
        { seasonIndex: 0, year: 2031, ageYears: 14, rows: [{ week: 12, label: 'Title', detail: 'Local Open' }] },
      ],
      handoff: { childBorn: false, freshCapitalFork: true, resumesWeek: null, resumesAgeYears: null },
      totals: { earnedCents: 100_00, spentCents: 50_000_00, prizeCents: 0, weeksLostToInjury: 0 },
      seasonsPlayed: 5,
      bestRank: 88,
      titles: 2,
      oneMoreYearCount: 0,
      academy: null,
      college: null,
    }
  }

  function mountEpilogue() {
    useGameStore().$patch({
      snapshot: {
        ageYears: 19,
        week: 265,
        kidRank: 88,
        fundsCents: 1234_00,
        careerTotals: { earnedCents: 0, spentCents: 0, prizeCents: 0 },
        ending: endingView(),
      } as unknown as Snapshot,
    })
    return mount(EndingScreen, { attachTo: document.body })
  }

  it('⭐ the album is a 480px column on a desktop, and the ground still covers the page', async () => {
    assertSheetPresent()
    setViewport(DESKTOP)
    const w = mountEpilogue()
    await nextTick()
    expect(maxWidthOf('.ending-album'), 'the album reads in a column').toBe('480px')
    expect(isCentred('.ending-album'), 'and it is centred on the celebration ground').toBe(true)
    // ⚠ THE CAP IS ON THE SECTION AND NOT ON `.ending`, which paints the celebration ground over the
    // whole app. Capping the painted box would letterbox the epilogue in the page colour.
    expect(maxWidthOf('.ending'), 'the ground is not capped').toBe('none')
    w.unmount()
  })

  it('⚠ …and a phone keeps the album at the width of the screen', async () => {
    assertSheetPresent()
    setViewport(PHONE)
    const w = mountEpilogue()
    await nextTick()
    expect(maxWidthOf('.ending-album'), 'no cap below 768').toBe('none')
    w.unmount()
  })
})

// =================================================================================================
// 5. THE PROLOGUE'S WEEKEND
// =================================================================================================
// The nine cards and the handover are `max-width: 420px`; this takeover was `inset: 0` with 12px of
// padding and nothing else, so `.plo-hero` – `calc(100% + 24px)` at `aspect-ratio: 1 / 1` – was a
// **1280 x 1280** painting on a 1280px screen. The match inside it is the exception: it takes the
// takeover column, because 420 would make the prologue's court NARROWER than the 744px it has on a
// tablet today.
//
// MUTATION-VERIFIED: the media block deleted -> both wide arms; `.plo > .mv`'s rule deleted -> the
// match arm alone, because `.plo > *` then catches the viewer too.
describe('round 36 phase 4 – the prologue’s weekend takes the prologue’s column', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => setViewport(PHONE))

  /** A seed whose ten-year-old wins at least one round, so the weekend has a second beat. */
  function seedWithAWin(): string {
    for (let i = 0; i < 60; i++) {
      const kid = prologueEntrant(`r36p4-${i}`, KID_ID, 'Vera Novak', 10)
      if (playLocalOpen(`r36p4-${i}`, kid, 10).wins >= 1) return `r36p4-${i}`
    }
    throw new Error('no seed in 60 gave her a win – the search is broken and this arm is vacuous')
  }

  function mountWeekend(seed: string) {
    const kid = prologueEntrant(seed, KID_ID, 'Vera Novak', 10)
    const open = playLocalOpen(seed, kid, 10)
    return mount(PrologueLocalOpen, { attachTo: document.body, props: { open, kid, seed } })
  }

  it('⭐ the header and the weekend’s beats are the cards’ own 420px column', async () => {
    assertSheetPresent()
    setViewport(DESKTOP)
    const wrapper = mountWeekend(seedWithAWin())
    await nextTick()
    expect(maxWidthOf('.plo-head'), 'the escape line is on the column').toBe('420px')
    expect(maxWidthOf('.plo-splash'), 'and so is the venue painting under it').toBe('420px')
    expect(isCentred('.plo-splash'), 'and it is centred').toBe(true)
    wrapper.unmount()
  })

  it('⭐⭐ …but the match is the app’s match screen and takes the takeover column', async () => {
    assertSheetPresent()
    setViewport(DESKTOP)
    const wrapper = mountWeekend(seedWithAWin())
    await nextTick()
    // Two presses: the tournament's own screen, then the transition before the first match.
    await wrapper.find('.plo-go').trigger('click')
    await nextTick()
    await wrapper.find('.plo-go').trigger('click')
    await nextTick()
    const mv = document.querySelector('.mv')
    expect(mv, 'the weekend reached its first match').toBeTruthy()
    expect(getComputedStyle(mv!).maxWidth, 'the court is not squeezed into the card column').toBe(
      token('--app-max-width'),
    )
    wrapper.unmount()
  })

  it('⚠ …and a phone has no column here either', async () => {
    assertSheetPresent()
    setViewport(PHONE)
    const wrapper = mountWeekend(seedWithAWin())
    await nextTick()
    expect(maxWidthOf('.plo-splash'), 'no cap below 768').toBe('none')
    wrapper.unmount()
  })
})

// =================================================================================================
// 6. THE SHOP
// =================================================================================================
// Two separate claims, and both are measurements rather than tastes.
//
//  * THE SIX CATEGORY CARDS. `1fr` columns and a fixed `aspect-ratio` is a tile whose HEIGHT is its
//    width times 1.542, so the front door grew from 109x168 (grid 344px) at 375 to 311x479 (grid
//    966px) at 1280 – and the page went 1057 -> 1534, i.e. TALLER on a monitor than on a phone.
//  * THE ITEM ROWS. One row per card, 948px wide at 1280, with a 378px painting at one end and two
//    sentences at the other. They take the coach market's own rule, because they are the same card.
//
// MUTATION-VERIFIED: `width: 100%` dropped from `.shelf-cats` -> the stretch arm (and in Chromium
// the grid really did collapse to 22px with 2x3px tiles, which is how that line was found); the 640
// cap dropped -> the cap arm; the 1024 block deleted -> the desktop row arm alone.
//
// ⚠⚠ AND TWO MUTATIONS DID **NOT** BITE, WHICH IS RECORDED RATHER THAN QUIETLY DROPPED. Reducing
// `.shop-family.shop-family` (768) to one class left every arm green, and so did reducing the 1024
// rung from three classes to two: source order settles both ties, in this runner and in a browser.
// What IS load-bearing is measured – the 1024 rung cut to ONE class, i.e. lighter than the 768
// rung, reddens the desktop arm by name. The extra classes stay because they cost nothing and a
// rule that wins only on source order is one re-order away from losing, but this file does not
// pretend to prove that.
describe('round 36 phase 4 – the shop stops growing', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => setViewport(PHONE))

  /** A career rich enough that no rung is greyed for money alone – round35-shop.test.ts's recipe. */
  function rich(seed: string, weeks = 20): Snapshot {
    const world = createWorld(seed)
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < weeks; i++) {
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
    }
    world.bestFinishByTier.wta250 = 3
    world.fundsCents = 60_000_000_00
    return toSnapshot(world)
  }

  async function mountShop(snapshot: Snapshot) {
    useGameStore().snapshot = snapshot
    const wrapper = mount(MoneyScreen, {
      attachTo: document.body,
      global: { stubs: { teleport: true } },
    })
    const tab = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === 'Shop')
    expect(tab, 'the Shop chapter').toBeTruthy()
    await tab!.trigger('click')
    return wrapper
  }

  it('⭐⭐ the six category cards stop at 640, and the grid is told to fill it', async () => {
    assertSheetPresent()
    setViewport(TABLET)
    const wrapper = await mountShop(rich('r36p4-shop'))
    const grid = document.querySelector('.shelf-cats')
    expect(grid, 'the shop opened on its front door').toBeTruthy()
    const cs = getComputedStyle(grid!)
    expect(cs.maxWidth, 'the front door stops growing').toBe('640px')
    expect(isCentred('.shelf-cats'), 'and what is left is either side of it').toBe(true)
    // ⚠⚠ THE HALF THAT IS NOT BELT-AND-BRACES. A grid item with auto inline margins does NOT stretch
    // – it falls back to max-content – and the six tiles are `width: 100%` of an indefinite width.
    // Measured in Chromium on the first build of this rule: 22px of grid holding 2x3px tiles.
    expect(cs.width, 'the grid fills its track before the cap trims it').toBe('100%')
    expect(cs.gridTemplateColumns, 'his 3x2 is untouched').toBe('repeat(3, 1fr)')
    wrapper.unmount()
  })

  it('⚠ …and a phone keeps the front door at the width of the column', async () => {
    assertSheetPresent()
    setViewport(PHONE)
    const wrapper = await mountShop(rich('r36p4-shop'))
    expect(maxWidthOf('.shelf-cats'), 'no cap below 768').toBe('none')
    wrapper.unmount()
  })

  it('⭐⭐ the shelf’s rows go two to a row on a tablet, and the heading spans', async () => {
    assertSheetPresent()
    setViewport(TABLET)
    const wrapper = await mountShop(rich('r36p4-shop'))
    const tile = wrapper.findAll('.shelf-cat').find((n) => n.text().trim() === 'Cars')
    expect(tile, 'the Cars category card').toBeTruthy()
    await tile!.trigger('click')
    const family = document.querySelector('.shop-family')
    expect(family, 'a family of rungs is on the screen').toBeTruthy()
    const cs = getComputedStyle(family!)
    expect(cs.display, 'the family is a shelf, not a list').toBe('grid')
    expect(cs.gridTemplateColumns, 'two to a row at 768 – the coach market’s own number').toBe(
      'repeat(2, minmax(0, 1fr))',
    )
    const head = document.querySelector('.shop-family-head')
    expect(getComputedStyle(head!).gridColumn.replace(/\s+/g, ''), 'the heading is a row above the pair').toBe(
      '1/-1',
    )
    wrapper.unmount()
  })

  it('⭐ …and on a desktop the count follows from the phone’s own card width', async () => {
    assertSheetPresent()
    setViewport(DESKTOP)
    const wrapper = await mountShop(rich('r36p4-shop'))
    const tile = wrapper.findAll('.shelf-cat').find((n) => n.text().trim() === 'Cars')
    await tile!.trigger('click')
    expect(
      getComputedStyle(document.querySelector('.shop-family')!).gridTemplateColumns,
      'as many as fit at no less than the phone’s 343px – D17’s rule, on a second screen',
    ).toBe('repeat(auto-fill, minmax(343px, 1fr))')
    wrapper.unmount()
  })

  it('⚠ …and a phone keeps one rung per row', async () => {
    assertSheetPresent()
    setViewport(PHONE)
    const wrapper = await mountShop(rich('r36p4-shop'))
    const tile = wrapper.findAll('.shelf-cat').find((n) => n.text().trim() === 'Cars')
    await tile!.trigger('click')
    const cs = getComputedStyle(document.querySelector('.shop-family')!)
    expect(cs.display, 'a phone stacks them').toBe('flex')
    wrapper.unmount()
  })
})

// =================================================================================================
// 7. THE TOURNAMENT BRIEF'S VENUE PLATE
// =================================================================================================
// `min-height: 300px` on a 343px column is nearly square, which is what this brief has always drawn.
// The takeover column is 848 now, and 848 x 300 is 2.83 : 1 over a 512x512 master – two thirds of the
// painting thrown away, which is D6's objection to a flat height arriving on a third hero.
//
// ⚠ IT DOES NOT READ `--hero-aspect`: that token's desktop rung is `450 / 400`, which on a
// full-width block with no cap would be a 754px-tall photograph. What it takes is the token's TABLET
// rung, which is the shape the owner accepted for a wide hero.
//
// MUTATION-VERIFIED: the media block deleted -> the wide arm, phone green; `450 / 400` written in
// instead -> the wide arm, with the message naming the shape.
describe('round 36 phase 4 – the venue plate takes a shape', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => setViewport(PHONE))

  /** A career parked on a revealed tournament – round21-coach-travel.test.ts's own recipe. */
  function atTournament(seed: string): Snapshot {
    const world = createWorld(seed)
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 160; i++) {
      world.fundsCents = Math.max(world.fundsCents, 500_000_00)
      if (pendingKnock(world)) decideKnock(world, 'rest')
      for (const e of world.season) {
        if (e.week > world.week && !world.entries.includes(e.id)) {
          try {
            enterEvent(world, e.id)
          } catch {
            /* eligibility and caps are the engine's business */
          }
        }
      }
      tickWeek(world, rng)
      if (world.pendingTournament) return toSnapshot(world)
    }
    throw new Error('no tournament reached – the fixture is broken, not the assertion')
  }

  it('⭐ the plate asks for the tablet hero’s shape past 768', async () => {
    assertSheetPresent()
    setViewport(DESKTOP)
    useGameStore().snapshot = atTournament('r36p4-brief')
    const wrapper = mount(TournamentFlow, { attachTo: document.body })
    await nextTick()
    const hero = document.querySelector('.tf-hero')
    expect(hero, 'the brief drew its venue plate').toBeTruthy()
    expect(
      getComputedStyle(hero!).aspectRatio.replace(/\s+/g, ' ').trim(),
      'the shape the owner accepted for a wide hero, not the column hero’s 450 / 400',
    ).toBe('768 / 400')
    wrapper.unmount()
  })

  it('⚠ …and a phone keeps the nearly-square plate it has always drawn', async () => {
    assertSheetPresent()
    setViewport(PHONE)
    useGameStore().snapshot = atTournament('r36p4-brief')
    const wrapper = mount(TournamentFlow, { attachTo: document.body })
    await nextTick()
    const cs = getComputedStyle(document.querySelector('.tf-hero')!)
    expect(cs.aspectRatio === '' || cs.aspectRatio === 'auto', 'no ratio below 768').toBe(true)
    expect(cs.minHeight, 'only the floor it always had').toBe('300px')
    wrapper.unmount()
  })
})

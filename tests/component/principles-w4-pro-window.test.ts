// ⭐⭐ T4.11 · E-01 – THE SEASON HEADER STATES THE WINDOW THE ENGINE COUNTS (the owner's ruling 4a).
//
// The finding (docs/review-principles-2026-09-26/05-ui.md, E-01, P1): the header line and its title
// said «this season» and «A fresh allowance arrives when the season turns», while the NUMBER beside
// them is `proEntryCapUsage` – `proEntryWeeks` whose `kidAgeAt` equals her age now, a BIRTHDAY-TO-
// BIRTHDAY window since 16.08 (`world/entryCaps.ts`). The line was written 02.08 (`fdce8055`); the
// engine moved on 16.08 (`39b12224`) and the card pills on the SAME SCREEN followed twenty minutes
// later (`53223b3d`). The header never did. Measured on the `v46` golden save: a sixteen-year-old at
// week 155 reading «6 of 12» where the engine's count stays 6 through the season turn at w156 and
// falls to 0 only at her birthday at w180 – so for 24 weeks the header named this SEASON's allowance
// against one entry made this season.
//
// His ruling 4a: the header reuses the phrase the pills already carry. Both DRAFTs are tabled in
// docs/plans/principles-fix-strings-2026-09.md §3 and pinned character for character by
// tests/principles-fix-strings-roundtrip.test.ts – ⚠ THIS FILE IS NOT THAT PIN. What it asserts is
// that the two SURFACES agree about the window, which no source pin can see.
//
// ⚠⚠ FORM B, AND THE SPEC IS EXPLICIT ABOUT WHY THAT IS SECOND BEST (engine-ui-parity-2026-09.md §1):
// form A GUARANTEES parity, form B only WITNESSES it. The number needs no primitive – both surfaces
// already read `proEntryCapUsage`, the header at `world.week` and each pill at its own EVENT's week,
// which is round-17 #2's deliberate difference and not a copy. What is restated is the SENTENCE the
// screen composes about that number, and a sentence is what §3 sends to form B.
//
// ⚠ MUTATION TABLE, §2's asymmetry, both arms run (outputs quoted in the wave's report):
//   arm A – the shared SOURCE: move `proEntryCapUsage`'s window (`kidAgeAt(w) === age` -> a season
//     read) and BOTH surfaces' numbers move together, because there is one window under them.
//   arm B – the SHARING: hand-code «this season» back onto the header alone and THIS file reddens
//     while `round16-surfaces.test.ts` – the pills' own suite – stays entirely green.
//
// ⚠⚠ AND THE HEADER ROW IS MEASURED AGAINST A PHONE (CLAUDE.md's popup law). The new line is ten
// characters longer than the one it replaces, and the law's failure mode is exactly this: «a dialog
// grows by one honest sentence at a time and nothing objects until it is taller than a phone». This
// is a header rather than a blocking card, so what it can cost is the FOLD – the feed the screen
// exists for – and §3 below measures it with `fits.ts` at 375x667 against the frame's own tokens.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createPinia, setActivePinia } from 'pinia'
import SeasonScreen from '../../src/components/screens/SeasonScreen.vue'
// ⚠ THE REAL STYLESHEET, or §3's measurement reads an empty cascade and passes vacuously – `fits.ts`
// refuses a document with no `<style>` in it for exactly that reason.
import '../../src/style.css'
import { useGameStore } from '../../src/stores/game'
import { migrateSave } from '../../src/engine/migrations'
import { proEntryCapUsage, toSnapshot, type WorldState } from '../../src/engine/world'
import { PHONE, availableWidth, boxOf, lengthPx, setViewport } from './fits'
import type { Snapshot } from '../../src/shared/protocol'

/** The window phrase the owner's ruling 4a settles on: the pills' own words, now the header's. */
const WINDOW = 'birthday to birthday'
/** What the header used to say. Neither surface may name a season window again. */
const OLD_WINDOW = /this season|when the season turns/

/** The `v46` golden save, migrated and snapshotted – the real career E-01 was measured on, at week
 *  155 and age 16, which is one of the two ages the tour's rule meters at all. */
function goldenV46(): { world: WorldState; snap: Snapshot } {
  const world = migrateSave(
    JSON.parse(readFileSync(resolve(process.cwd(), 'tests/fixtures/saves/v46.json'), 'utf8')),
  ) as WorldState
  return { world, snap: toSnapshot(world) }
}

/** ⚠ `attachTo` IS NOT DECORATION IN THIS FILE. §3 reads the cascade through `getComputedStyle`, and
 *  a detached subtree resolves no `var()` off `:root`. The rest of the arrangement is
 *  `tests/helpers/mountSeason.ts`' – the store-driven screen with teleports stubbed. */
function mountSeasonAttached(snapshot: Snapshot) {
  useGameStore().snapshot = snapshot
  return mount(SeasonScreen, { attachTo: document.body, global: { stubs: { teleport: true } } })
}

describe('T4.11 · E-01 – one window, on the header and on the cards', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  // ===============================================================================================
  // 1. THE FIXTURE IS THE CAREER THE FINDING WAS MEASURED ON
  // ===============================================================================================

  it('v46 really is a metered age-year with a spent allowance – or everything below is vacuous', () => {
    const { world, snap } = goldenV46()
    expect(snap.week).toBe(155)
    expect(snap.ageYears).toBe(16)
    expect(snap.proEntryCap.limit).toBeLessThan(Number.MAX_SAFE_INTEGER)
    expect(snap.proEntryCap.used).toBeGreaterThan(0)
    // ⭐ THE FINDING'S OWN MEASUREMENT, RE-RUN HERE: the count does NOT fall at the season turn, and
    // that is the whole of E-01. `seasonStartWeek` is 52 weeks wide, so w156 opens the next season
    // block; the engine's figure is unchanged there and only her birthday empties it.
    const atTurn = proEntryCapUsage(world, 156)
    expect(atTurn.used, 'if this ever falls at the season turn, the OLD wording was right').toBe(
      snap.proEntryCap.used,
    )
    // ⚠⚠ THE WINDOW'S OWN NUMBERS, PINNED, AND THAT IS WHAT MAKES ARM A POSSIBLE. Without a value
    // here, widening `proEntryCapUsage`'s window moves the header and the pills TOGETHER and nothing
    // in this file can see it – both surfaces would go on agreeing with each other about a wrong
    // figure, which is the one thing a parity witness must not be able to do. `6 of 12` is E-01's own
    // measurement on this save, and a red here means the engine's window moved: read `entryCaps.ts`
    // before touching this line.
    expect(snap.proEntryCap.used, 'v46: the engine no longer counts 6 pro entries in her age-year').toBe(6)
    expect(snap.proEntryCap.limit, 'v46: the metered limit at sixteen moved').toBe(12)
  })

  // ===============================================================================================
  // 2. FORM B – the header's window word and the pills' agree, on ONE posed snapshot
  // ===============================================================================================

  it('⭐ the header names the engine\'s window, in the pills\' own phrase', () => {
    const { snap } = goldenV46()
    const wrapper = mountSeasonAttached(snap)
    const header = wrapper.find('.season-pro-budget')
    expect(header.exists(), 'the header must be on screen on a metered age-year').toBe(true)
    expect(header.text()).toContain(`${snap.proEntryCap.used} of ${snap.proEntryCap.limit}`)
    // ...and the figure itself, so arm A (a moved engine window) reddens HERE and not only in §1.
    expect(header.text(), 'the header is printing a different allowance than v46 holds').toContain('6 of 12')
    expect(header.text(), 'the line itself names the window').toContain(WINDOW)
    expect(header.attributes('title'), 'and so does its long form').toContain(WINDOW)
    expect(header.text(), 'the season window is back on the line').not.toMatch(OLD_WINDOW)
    expect(header.attributes('title'), 'the season window is back in the title').not.toMatch(OLD_WINDOW)
    wrapper.unmount()
  })

  it('⭐ ...and the pills on the same screen say the same thing about the same number', () => {
    const { snap } = goldenV46()
    const wrapper = mountSeasonAttached(snap)
    const pills = wrapper.findAll('.pro-entries')
    expect(pills.length, 'the fixture must draw at least one W card, or there is no pair to compare').toBeGreaterThan(0)
    for (const pill of pills) {
      expect(pill.attributes('title')).toContain(WINDOW)
      expect(pill.attributes('title')).not.toMatch(OLD_WINDOW)
      // The pills' half of arm A: the same engine window, so the same figure.
      expect(pill.text(), 'a W card is printing a different allowance than v46 holds').toContain('6 / 12')
    }
    // THE NUMBERS, where the two windows coincide. Each pill reads its own EVENT's week (round-17 #2)
    // and the header reads THIS week, so they agree exactly on the cards inside her current age-year
    // – which on v46 is every card in the horizon (her birthday is at w180).
    const header = wrapper.find('.season-pro-budget').text()
    const inThisAgeYear = snap.upcoming.filter(
      (e) => e.proEntryCap && e.proEntryCap.used === snap.proEntryCap.used && e.proEntryCap.limit === snap.proEntryCap.limit,
    )
    expect(inThisAgeYear.length, 'the horizon must hold cards in her current age-year').toBeGreaterThan(0)
    const pillTexts = pills.map((p) => p.text())
    expect(pillTexts.length).toBeGreaterThan(0)
    for (const text of pillTexts) {
      const m = /pro entries (\d+) \/ (\d+)/.exec(text)
      expect(m, `a pill that does not print a fraction: ${text}`).not.toBeNull()
      expect(
        header,
        'the header and the card disagree about how much of ONE allowance is spent',
      ).toContain(`${m![1]} of ${m![2]}`)
    }
    wrapper.unmount()
  })

  it('⚠ the two surfaces are not one surface – the pills read their OWN week', () => {
    // The other half of form B, and it is what keeps the case above from over-claiming. If the header
    // and the pills were the same read, round-17 #2's fix would be undone: the horizon crosses her
    // birthday on a career it can, and a card past it is judged against a different allowance. Posed
    // here, because v46's horizon does not reach w180.
    const { snap } = goldenV46()
    const crossing = { ...snap.upcoming[0], proEntryCap: { used: 0, limit: 12, remaining: 12 } }
    const posed: Snapshot = { ...snap, upcoming: [crossing, ...snap.upcoming.slice(1)] }
    const wrapper = mountSeasonAttached(posed)
    const header = wrapper.find('.season-pro-budget').text()
    expect(header).toContain(`${snap.proEntryCap.used} of ${snap.proEntryCap.limit}`)
    expect(header, 'the header took its number off a CARD').not.toContain('0 of 12')
    wrapper.unmount()
  })

  // ===============================================================================================
  // 3. THE HEADER ROW ON A PHONE – CLAUDE.md's popup law, applied to the surface that grew
  // ===============================================================================================

  /** The usable column of a 375x667 phone, in the frame's OWN numbers rather than in this file's:
   *  `--app-pad-top` is the inset above the first pixel of the page and `--app-bar-bottom` is how far
   *  the floating CTA floats off the bottom, which style.css records as «clear of the tab bar (52px of
   *  bar plus 6)». Anything the header pushes past that is below the fold before the player scrolls –
   *  and the feed is what this screen is for. */
  function usableHeight(): number {
    const root = getComputedStyle(document.documentElement)
    const top = lengthPx(root.getPropertyValue('--app-pad-top').trim(), PHONE.height)
    const bottom = lengthPx(root.getPropertyValue('--app-bar-bottom').trim(), PHONE.height)
    expect(Number.isFinite(top), 'the frame tokens did not resolve – the cascade is not loaded').toBe(true)
    expect(Number.isFinite(bottom), 'the frame tokens did not resolve – the cascade is not loaded').toBe(true)
    return PHONE.height - top - bottom
  }

  /** The header row's modelled border box at 375x667, through `fits.ts`' own instruments. */
  function headerBox(wrapper: ReturnType<typeof mountSeasonAttached>): { h: number; room: number } {
    const bar = wrapper.find('.season-topbar').element
    const room = availableWidth(bar, PHONE)
    const box = boxOf(bar, room)
    return { h: box.marginTop + box.h + box.marginBottom, room }
  }

  it('⭐ the header row fits the phone with the longest allowance the rule can meter', () => {
    // ⚠ THE WIDEST DATA, NOT THE FIXTURE'S: `proPerYearByAge` tops out at 16 at seventeen and
    // `meritIncrease.proExtra` adds four, so «20 of 20» is the widest fraction this line can ever
    // print. Measured at both, and the numbers are in the wave's report.
    // ⚠⚠ setViewport BEFORE THE MOUNT, never after: happy-dom evaluates a media query on an
    // element's FIRST computed-style read and caches it, so a viewport set afterwards measures the
    // previous screen (`fits.ts`' own note on `TABLET`). It bites here in particular – past 1024
    // `--app-bar-bottom` becomes `--app-pad-top`, so a desktop read makes the phone's column 34px
    // roomier than it is.
    setViewport(PHONE)
    const { snap } = goldenV46()
    const widest: Snapshot = { ...snap, proEntryCap: { used: 20, limit: 20, remaining: 0 } }
    const wrapper = mountSeasonAttached(widest)
    expect(wrapper.find('.season-pro-budget').text()).toContain('20 of 20')
    const { h, room } = headerBox(wrapper)
    const usable = usableHeight()
    expect(room, 'the row is measured against a phone, not against a desktop column').toBeLessThanOrEqual(PHONE.width)
    expect(
      h,
      `the season header demands ${h.toFixed(0)}px of a ${usable.toFixed(0)}px column at ` +
        `${PHONE.width}x${PHONE.height} – the feed it stands over starts below the fold`,
    ).toBeLessThanOrEqual(usable)
    wrapper.unmount()
  })

  it('⚠⚠ MUTATION PROOF – lengthen the line and the SAME assertion goes red', () => {
    // Without this the case above is unfalsifiable: happy-dom does no layout, so a green verdict
    // would only prove the cascade exists. The line is lengthened the way the popup law says these
    // things really grow – by honest sentences, on the element the screen already draws – and the
    // assertion has to be able to see it. This is a POSED DOM, never a source change: nothing about
    // the shipped line moves.
    setViewport(PHONE)
    const { snap } = goldenV46()
    const wrapper = mountSeasonAttached(snap)
    const before = headerBox(wrapper).h
    const line = wrapper.find('.season-pro-budget').element
    line.textContent =
      'Pro entries, birthday to birthday: 6 of 12. ' +
      'The tour counts a professional entry against the year she is this age, so the allowance she has left is not the one the season block would suggest, and a parent planning the rest of her year has to read it that way. '.repeat(
        9,
      )
    const after = headerBox(wrapper).h
    const usable = usableHeight()
    expect(after, 'the lengthened line really is taller – otherwise the arm measures nothing').toBeGreaterThan(before)
    expect(after, 'the mutation must push the row off the screen, or it is not this arm').toBeGreaterThan(usable)
    wrapper.unmount()
  })
})

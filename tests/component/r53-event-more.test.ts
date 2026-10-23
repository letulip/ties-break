// ROUND 53 L3 (step 3) – TWO HALVES ON THE SEASON SCREEN.
//
// A. Round 15 #3: the professional events stop appearing on the feed with no sentence why. Each W card
//    now says how many MORE of its own rung the season holds, off the SAME `seasonSupply` row the
//    header's line reads (`open`, minus this card's own place when the engine counts it).
// B. Review E-P02: `rescueTitle` asked `condition < cautionCondition` with the screen's own `<`; the
//    engine's `practiceTired` is the one spelling, and `practiceCaution` uses it for its 'tired' limb.
//
// ⚠ MUTATION-VERIFIED (21.10, each applied alone, all restored; red = tests that fail):
//   * `moreInTier` reading `row.entered` instead of `row.open`      -> red: the count test, the RU test;
//   * `moreInTier` not subtracting the card's own place             -> red: count, junior/absent, RU;
//   * `moreInTier` without the `track !== 'wta'` guard              -> red: the junior/absent test (the fixture carries a junior row);
//   * the `row` lookup ignoring `ev.tier` (rows[0])                 -> red: count, junior/absent, RU;
//   * `rescueTitle` restored to its own `<` AND `practiceTired` moved to `<=` -> red: the parity sweep;
//   * `practiceTired` moved to `<=` alone                           -> GREEN, by design: the headline and `practiceCaution` read the same function, so they move together.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

vi.mock('../../src/audio/sfx', () => ({
  playSfx: () => {},
  primeSfx: () => {},
  initSfx: () => {},
  installGlobalSfx: () => {},
  isMuted: () => false,
  setMuted: () => {},
}))

import { toSnapshot, practiceCaution, type WorldState } from '../../src/engine/world'
import { practiceTired } from '../../src/engine/world/planner'
import { migrateSave } from '../../src/engine/migrations'
import { TIERS, TIER_SHORT } from '../../src/engine/season/calendar'
import { ECONOMY } from '../../src/engine/economy'
import { installCatalog, resetI18nForTests, setLocale } from '../../src/i18n'
import { installMemoryStorage } from './setup'
import { mountSeason } from '../helpers/mountSeason'
import { NARROW_PHONE, PHONE, type Viewport } from './fits'
import type { Snapshot, UpcomingEvent } from '../../src/shared/protocol'

Element.prototype.scrollIntoView = function () {}
const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>

/** The v46 golden save: a real sixteen-year-old mid-season whose feed holds W and junior cards. */
function feedSnapshot(): Snapshot {
  const world = migrateSave(
    JSON.parse(readFileSync(resolve(process.cwd(), 'tests/fixtures/saves/v46.json'), 'utf8')),
  ) as WorldState
  return toSnapshot(world)
}

const isPro = (e: UpcomingEvent): boolean => TIERS[e.tier].track === 'wta'

/** A feed whose pro cards are all entered (so the engine counts each one in `open`) and whose supply
 *  holds `open` events of the first pro card's rung plus a decoy row for another rung. */
function withSupply(open: number | null) {
  const snap = feedSnapshot()
  const pro = snap.upcoming.filter(isPro)
  expect(pro.length, 'the fixture must carry a professional card').toBeGreaterThan(0)
  const tier = pro[0].tier
  for (const e of snap.upcoming) if (isPro(e)) e.entered = true
  const decoyTier = pro.find((e) => e.tier !== tier)?.tier ?? snap.upcoming.find((e) => !isPro(e))!.tier
  // The engine's supply carries junior rungs too; a card of one must still print nothing.
  const juniorTier = snap.upcoming.find((e) => !isPro(e))!.tier
  snap.seasonSupply = {
    weeksLeft: 20,
    rows: [
      { tier: juniorTier, open: 5, entered: 0 },
      ...(decoyTier === juniorTier ? [] : [{ tier: decoyTier, open: 9, entered: 0 }]),
      ...(open === null ? [] : [{ tier, open, entered: 1 }]),
    ],
  }
  return { snap, tier }
}

const cardsOf = (w: ReturnType<typeof mountSeason>) => w.findAll('.event-card')

beforeEach(() => {
  setActivePinia(createPinia())
  installMemoryStorage()
  resetI18nForTests(null)
})

describe('R53 L3 A – the remaining-events counter on the W cards', () => {
  it('prints the supply row\'s count for THAT card\'s rung, less the card itself', async () => {
    await setLocale('en')
    const { snap, tier } = withSupply(3)
    const w = mountSeason(snap)
    const mine = cardsOf(w).filter((c) => c.find('.event-tier').text().trim() === TIERS[tier].label)
    expect(mine.length, 'the rung must be drawn').toBeGreaterThan(0)
    for (const c of mine) {
      expect(c.find('.event-more').text()).toBe(`2 more ${TIER_SHORT[tier]} this season`)
    }
    w.unmount()
  })

  it('shows nothing on a junior card, nothing when the row is absent, nothing when none are left beside this card', async () => {
    await setLocale('en')
    const { snap, tier } = withSupply(3)
    const w = mountSeason(snap)
    let juniors = 0
    for (const c of cardsOf(w)) {
      const rung = Object.values(TIERS).find((t) => t.label === c.find('.event-tier').text().trim())
      expect(rung, 'every card names a rung').toBeTruthy()
      const junior = rung!.track !== 'wta'
      if (junior) {
        juniors++
        expect(c.find('.event-more').exists(), 'junior cards carry no counter').toBe(false)
      }
    }
    expect(juniors, 'the fixture must draw a junior card').toBeGreaterThan(0)
    w.unmount()
    setActivePinia(createPinia())
    const absent = withSupply(null)
    const w2 = mountSeason(absent.snap)
    const ofTier = (w: ReturnType<typeof mountSeason>, t: string) => cardsOf(w).filter((c) => c.find('.event-tier').text().trim() === TIERS[t as keyof typeof TIERS].label)
    expect(ofTier(w2, absent.tier).length, 'the rung is drawn').toBeGreaterThan(0)
    for (const c of ofTier(w2, absent.tier)) expect(c.find('.event-more').exists(), 'no row, no line').toBe(false)
    w2.unmount()
    setActivePinia(createPinia())
    const last = withSupply(1)
    const w3 = mountSeason(last.snap)
    for (const c of ofTier(w3, last.tier)) expect(c.find('.event-more').exists(), 'open 1 is this card alone').toBe(false)
    w3.unmount()
    expect(tier).toBeTruthy()
  })

  it('under ru the line prints the RU row', async () => {
    resetI18nForTests(null)
    installCatalog('ru', RU)
    await setLocale('ru')
    const { snap, tier } = withSupply(4)
    const w = mountSeason(snap)
    const c = cardsOf(w).find((x) => x.find('.event-more').exists())!
    expect(c.find('.event-more').text()).toBe(`ещё 3 ${TIER_SHORT[tier]} в этом сезоне`)
    w.unmount()
  })

  // ⚠ HOW THIS IS MEASURED, AND WHAT IT CANNOT SAY: happy-dom does not apply the SFC's `scoped` CSS (a
  // probe printed an empty computed font-size on `.event-more`), so the cascade cannot give the width.
  // The box is MODELLED, floor-style like fits.ts: the line sits in a card whose `pad` is 16+16, in a
  // screen gutter of 16+16, and in the WORST strip – a week that stacks two cards narrows each to 88% of
  // the row (`.week-stack.swipeable > .event-card`). Glyphs are charged 0.62 em, wider than the face's
  // digits and Latin. The font-size is read from the SFC source, so a change there moves the number.
  it.each([PHONE, NARROW_PHONE] as Viewport[])('one line at %o for the longest realistic rung, in both languages', (vp) => {
    const src = readFileSync('src/components/screens/SeasonScreen.vue', 'utf8')
    const rule = /\.event-more \{[^}]*font-size:\s*([\d.]+)px/.exec(src)
    expect(rule, '.event-more declares its font-size').toBeTruthy()
    const fontSize = Number(rule![1])
    const room = (vp.width - 32) * 0.88 - 32
    for (const line of ['12 more WTA 500 this season', 'ещё 12 WTA 500 в этом сезоне']) {
      expect(line.length * fontSize * 0.62, `"${line}" at ${vp.width}`).toBeLessThanOrEqual(room)
    }
  })
})

describe('R53 L3 B – rescueTitle reads the engine\'s own tired verdict', () => {
  const WORN = 'She is worn out – maybe a family week?'
  const OFF = 'She could use a week off – maybe a family week?'

  it('across a sweep around cautionCondition, the headline\'s branch equals practiceCaution\'s tired limb', async () => {
    await setLocale('en')
    const edge = ECONOMY.practice.cautionCondition
    expect(edge, 'the sweep must sit inside the rescue band').toBeLessThanOrEqual(ECONOMY.practice.rescueCondition)
    for (const c of [edge - 6, edge - 1, edge - 0.5, edge, edge + 0.5, edge + 1, ECONOMY.practice.rescueCondition]) {
      setActivePinia(createPinia())
      const snap = feedSnapshot()
      snap.injury = null
      snap.condition = c
      const w = mountSeason(snap)
      const title = w.find('.rescue-title')
      expect(title.exists(), `condition ${c}: the rescue card must be on screen for this sweep to measure anything`).toBe(true)
      const tired = practiceCaution({ condition: c, practiceWeeks: [], week: 1 }).reasons.includes('tired')
      expect(practiceTired(c)).toBe(tired)
      expect(title.text(), `condition ${c}`).toBe(tired ? WORN : OFF)
      w.unmount()
    }
  })
})

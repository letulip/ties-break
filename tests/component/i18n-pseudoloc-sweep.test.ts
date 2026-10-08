// THE PSEUDO-LOCALE SWEEP – mounted, wave L1b (spec §6). The harness and its proof; the per-batch full sweeps
// are L2-n's, one per landing, because a sweep over copy that is not wrapped yet can only report leaks.
//
//   1. OVERFLOW. Three blocking dialogs – the retirement winter card, the first-run locale prompt, the tour
//      briefing – are mounted at 375x667 with the text on screen padded by 30% (`expandRendered`, or the `xx`
//      catalog where the copy is already wrapped), and the round-20 #3 law is asserted: the dismiss control's
//      box is inside the viewport. The pad must REACH the measurement (the modelled content floor grows) and
//      the cap must still be the thing that holds (strip it and the same assertion goes red).
//   2. HARDCODE LEAKS. Under `xx` a fully wrapped surface (the locale prompt) has no unbracketed text; an
//      unwrapped one (the tour briefing) is reported, by name.
//
// ⚠ NO RUSSIAN, NO NEW COPY: the catalog `xx` is generated from the English keys; the dialogs are mounted as
// the existing tests mount them, and nothing is asserted about what a sentence says.
//
// ⚠ MUTATION ARMS (watched red; outputs in the wave report):
//   1. `.dialog-card { max-height }` stripped in the test (style.maxHeight = 'none')  -> the overflow cases go red.
//   2. `expandRendered` made a no-op                                             -> «the pad reached the measure» goes red.
//   3. `hardcodeLeaks` allow-listing everything                                     -> «reported by name» goes red.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import LocalePrompt from '../../src/components/LocalePrompt.vue'
import RetirementDialog from '../../src/components/RetirementDialog.vue'
import TourBriefingDialog from '../../src/components/TourBriefingDialog.vue'
import { resetI18nForTests } from '../../src/i18n'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot, KID_ID } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import type { RetirementOffer, SeasonHistoryEntry, SeasonTrackRow, Snapshot } from '../../src/shared/protocol'
import type { LadderTrack } from '../../src/engine/season/types'
import { moneyOf } from '../helpers/careerMoney'
import { installMemoryStorage } from './setup'
import { assertDismissReachable, measureDialog, PHONE, setViewport } from './fits'
import { expandRendered, hardcodeLeaks, installPseudoLocale } from './pseudoloc'

beforeEach(() => {
  installMemoryStorage()
  resetI18nForTests(null)
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})
afterEach(() => {
  document.body.innerHTML = ''
  document.documentElement.lang = 'en'
})

// --- the three dialogs, mounted the way their own tests mount them --------------------------------------

const EMPTY_ROW: SeasonTrackRow = { points: 0, wins: 0, losses: 0 }
function season(seasonIndex: number, wtaRank: number): SeasonHistoryEntry {
  const byTrack = { domestic: { ...EMPTY_ROW }, itf: { ...EMPTY_ROW }, wta: { ...EMPTY_ROW, endRank: wtaRank } } as Record<LadderTrack, SeasonTrackRow>
  return { seasonIndex, endRank: wtaRank, points: 0, wins: 0, losses: 0, fundsDeltaCents: 0, endFundsCents: 0, byTrack }
}
const WINTER: RetirementOffer = { askedWeek: 1453, seasonIndex: 27, reason: 'age', final: false }

interface Mounted {
  unmount: () => void
  card: Element
  dismiss: Element
}

/** The tallest retirement card: the rung, her season word and the last-winter warning all on it (r40 §5). */
function retirement(): Mounted {
  useGameStore().snapshot = {
    ageYears: 41,
    week: 1453,
    kidRank: 88,
    fundsCents: 1234_00,
    oneMoreYearCount: 0,
    careerTotals: { earnedCents: 0, spentCents: 0, prizeCents: 0 },
    careerMoney: moneyOf({ earnedCents: 0, spentCents: 0, prizeCents: 0, weeksLostToInjury: 0 }),
    seed: 'l1b-xx-retire',
    physicalShare: 0.6,
    coachMarket: [{ id: 'c1', name: 'Marco Ricci', current: true }],
    seasonHistory: [season(24, 20), season(25, 68), season(26, 125)],
    lastWinterIn: 2,
    retirementOffer: WINTER,
  } as unknown as Snapshot
  const w = mount(RetirementDialog, { attachTo: document.body })
  return { unmount: () => w.unmount(), card: w.get('.retire-card').element, dismiss: w.get('.retire-answers').element }
}

function localePrompt(): Mounted {
  const w = mount(LocalePrompt, { attachTo: document.body })
  return { unmount: () => w.unmount(), card: w.get('.locale-prompt .dialog-card').element, dismiss: w.get('.dialog-actions').element }
}

function tourBriefing(): Mounted {
  const world = createWorld('l1b-xx-brief')
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 4; i++) tickWeek(world, rng)
  world.results.push({ playerId: KID_ID, week: world.week, points: 250, tier: 'wta250' })
  world.kidRankWta = 34
  useGameStore().snapshot = toSnapshot(world)
  const w = mount(TourBriefingDialog, { attachTo: document.body })
  return { unmount: () => w.unmount(), card: document.querySelector('.dialog-card')!, dismiss: document.querySelector('.tour-briefing-actions')! }
}

const DIALOGS: readonly [string, () => Mounted, 'wrapped' | 'unwrapped'][] = [
  ['RetirementDialog (last winter)', retirement, 'unwrapped'],
  ['LocalePrompt (first run)', localePrompt, 'wrapped'],
  ['TourBriefingDialog', tourBriefing, 'unwrapped'],
]

describe('xx overflow – the dismiss law holds with the text 30% longer, at 375x667', () => {
  for (const [name, mountIt, copy] of DIALOGS) {
    it(`⚠ ${name}: the decision controls stay inside the phone`, async () => {
      setViewport(PHONE) // BEFORE the mount: happy-dom caches a media query on the first computed-style read
      if (copy === 'wrapped') await installPseudoLocale()
      const m = mountIt()
      expect(m.card, `${name}: the card is up – nothing below is vacuous`).toBeTruthy()
      expect(m.dismiss.querySelectorAll('button').length, `${name}: the decision block IS the way out`).toBeGreaterThan(0)
      const english = copy === 'wrapped' ? null : measureDialog(m.card, m.dismiss, PHONE)
      const reached = expandRendered(document.body)
      if (copy === 'unwrapped') expect(reached, `${name}: the pad reached nothing – this sweep would be vacuous`).toBeGreaterThan(0)
      else expect(document.body.textContent, `${name}: the xx catalog did not reach the screen`).toContain('⟦')
      const fit = assertDismissReachable(m.card, m.dismiss, PHONE, `${name} under xx`)
      // The pad must show up in the measurement, or the green above says nothing about +30%.
      if (english) expect(fit.contentFloor, `${name}: +30% text left the modelled content no taller`).toBeGreaterThan(english.contentFloor)
      expect(fit.cardHeight).toBeLessThanOrEqual(fit.available.height)
      m.unmount()
    })
  }

  it('⚠⚠ MUTATION PROOF – strip the height cap and the SAME assertion goes red on the dialogs that scroll', async () => {
    for (const [name, mountIt] of DIALOGS.filter(([, , copy]) => copy === 'unwrapped')) {
      document.body.innerHTML = ''
      setActivePinia(createPinia())
      setViewport(PHONE)
      const m = mountIt()
      expandRendered(document.body)
      ;(m.card as HTMLElement).style.maxHeight = 'none'
      ;(m.card as HTMLElement).style.overflowY = 'visible'
      expect(
        () => assertDismissReachable(m.card, m.dismiss, PHONE, `${name} (cap removed)`),
        `${name}: the cap could be removed and this sweep would not notice`,
      ).toThrow(/declares no height bound|taller than the screen|outside the viewport/)
      m.unmount()
    }
  })
})

describe('xx hardcode leaks – unbracketed text under the pseudo-locale is an unwrapped literal', () => {
  it('a fully wrapped surface (the first-run prompt) leaks nothing', async () => {
    setViewport(PHONE)
    await installPseudoLocale()
    const m = localePrompt()
    expect(document.body.textContent).toContain('⟦')
    expect(hardcodeLeaks(document.body)).toEqual([])
    m.unmount()
  })

  it('an unwrapped surface (the tour briefing) is reported, by name', async () => {
    setViewport(PHONE)
    await installPseudoLocale()
    const m = tourBriefing()
    const leaks = hardcodeLeaks(document.body)
    expect(leaks.length, 'nothing reported – the sweep would pass an unmigrated screen').toBeGreaterThan(0)
    expect(leaks, 'the Continue button is a literal in the template today').toContain('Continue')
    m.unmount()
  })

  it('the allowlist is the spec\'s: numbers, the product mark and tier codes are not leaks', async () => {
    document.body.innerHTML = '<div><p>12</p><p>$1,200</p><p>#34</p><p>Ties Break</p><p>WTA 250</p><p>W14</p><p>Plain English</p></div>'
    expect(hardcodeLeaks(document.body)).toEqual(['Plain English'])
  })
})

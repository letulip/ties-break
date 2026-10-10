// L3-3 (10.10) – THE TOUR BRIEFING DIALOG RENDERS ITS PROSE FROM THE SNAPSHOT'S REFS. docs/specs/i18n-2026-10.md §8 row L3-3.
//
// THE ORPHAN L3-2 FOUND: the popup's lead, requirement lines, cost lines and closing are assembled by the engine AT SNAPSHOT TIME (`buildTourBriefing`, world/mandatory.ts) from
// `ECONOMY.mandatory` and the calendar – nothing is stored, and the worker does not know the locale. So the engine emits each sentence as a CopyRef BESIDE the English
// (`TourBriefing.leadC` / `costsC` / `closingC`, `TourBriefingRow.askC` / `detailC` – the `LifeMoment.lineC` shape) and the dialog shows them through `eventText`.
//
//   1. UNDER ENGLISH the dialog draws the engine's strings byte for byte (the refs' identity path).
//   2. UNDER A PROBE CATALOG (ASCII markers) every prose element follows the locale and no English prose is left in them – the dialog's own chrome (its kicker, headings and
//      the Continue button) is the L2 batch's, still literal, and is NOT asserted here (tests/component/i18n-pseudoloc-sweep.test.ts reports it by name).
//   3. THE POPUP AND THE LETTER ARE ONE TRANSLATION: the three requirement keys are the ones `composables/letterCopy.ts` reads the season notice's stored phrases with.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TourBriefingDialog from '../../src/components/TourBriefingDialog.vue'
import { installCatalog, resetI18nForTests, setLocale } from '../../src/i18n'
import { requirementLine } from '../../src/composables/letterCopy'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot, KID_ID } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { installMemoryStorage } from './setup'

beforeEach(() => {
  installMemoryStorage()
  resetI18nForTests(null)
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})
afterEach(() => {
  document.body.innerHTML = ''
  resetI18nForTests(null)
})

const norm = (s: string): string => s.replace(/\s+/g, ' ').trim()

function mountBriefing() {
  const world = createWorld('l33-brief-dialog')
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 4; i++) tickWeek(world, rng)
  world.results.push({ playerId: KID_ID, week: world.week, points: 250, tier: 'wta250' })
  world.kidRankWta = 34
  const snapshot = toSnapshot(world)
  useGameStore().snapshot = snapshot
  const w = mount(TourBriefingDialog, { attachTo: document.body })
  return { w, briefing: snapshot.tourBriefing! }
}

describe('L3-3 – the tour briefing dialog', () => {
  it('under English it draws the engine\'s strings byte for byte (lead, asks, details, costs, closing)', () => {
    const { w, briefing } = mountBriefing()
    expect(briefing, 'the regime binds this world').toBeTruthy()
    expect(norm(w.get('.tour-briefing-lead').text())).toBe(norm(briefing.lead))
    const asks = w.findAll('.tour-briefing-ask-what').map((e) => norm(e.text()))
    const details = w.findAll('.tour-briefing-ask-detail').map((e) => norm(e.text()))
    expect(asks).toEqual(briefing.requirements.map((r) => norm(r.ask)))
    expect(details).toEqual(briefing.requirements.map((r) => norm(r.detail)))
    expect(w.findAll('.tour-briefing-costs li').map((e) => norm(e.text()))).toEqual(briefing.costs.map(norm))
    expect(norm(w.get('.tour-briefing-closing').text())).toBe(norm(briefing.closing))
    // the refs are really there (the dialog is not just showing `text`)
    expect(briefing.leadC && briefing.closingC && briefing.costsC?.length === briefing.costs.length).toBeTruthy()
    expect(briefing.requirements.every((r) => r.askC && r.detailC)).toBe(true)
    w.unmount()
  })

  it('under a probe catalog every prose element follows the locale – and none of the English prose is left in them', async () => {
    const { w, briefing } = mountBriefing()
    w.unmount()
    // one marker per ref key the briefing can hold (ASCII, no Cyrillic): the catalog maps the ENGLISH KEY to a marker that keeps the holes
    const entries: Record<string, string> = {}
    const all = [briefing.leadC!, briefing.closingC!, ...briefing.costsC!, ...briefing.requirements.flatMap((r) => [r.askC!, r.detailC!])]
    all.forEach((c, i) => {
      const holes = (c.k.match(/\{\d+\}/g) ?? []).map((h) => h).join('/')
      entries[c.k] = `P${i}[${holes}]`
    })
    installCatalog('ru', entries)
    await setLocale('ru')
    const again = mountBriefing()
    const lead = norm(again.w.get('.tour-briefing-lead').text())
    expect(lead).toMatch(/^P\d+\[\{0\}\/\{1\}\]$|^P\d+\[/)
    expect(lead, 'no English prose left in the lead').not.toContain('She is ranked')
    for (const el of again.w.findAll('.tour-briefing-ask-what, .tour-briefing-ask-detail, .tour-briefing-costs li, .tour-briefing-closing')) {
      const text = norm(el.text())
      expect(text, 'a marker, not the engine\'s English').toMatch(/^P\d+\[/)
    }
    // the marker's holes were FILLED (the params rode along): no literal brace is left
    expect(again.w.text()).not.toMatch(/\{\d+\}/)
    again.w.unmount()
  })

  it('the popup and the season notice read their requirement phrases with the SAME three keys', async () => {
    const { w, briefing } = mountBriefing()
    w.unmount()
    const keys = new Set(briefing.requirements.map((r) => r.askC!.k))
    for (const k of keys) expect(['All {0} {1}', 'All {0} {1}s', '{0} of the {1} {2}s'], k).toContain(k)
    installCatalog('ru', { 'All {0} {1}s': 'A {0}/{1}', 'All {0} {1}': 'B {0}/{1}', '{0} of the {1} {2}s': 'C {0}/{1}/{2}' })
    await setLocale('ru')
    const again = mountBriefing()
    const popup = again.w.findAll('.tour-briefing-ask-what').map((e) => norm(e.text()))
    again.w.unmount()
    // the letter's adapter turns the stored English `ask` into the same words
    expect(popup).toEqual(briefing.requirements.map((r) => requirementLine(r.ask)))
  })
})

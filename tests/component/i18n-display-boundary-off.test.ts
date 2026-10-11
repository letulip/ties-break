// RU-22 (11.10) – THE CONTROL ARM OF THE MOUNTED NET: the display boundary's word hook SWITCHED OFF.
//
// tests/component/i18n-display-boundary.test.ts proves the sites that read a label through `engineText` / `engineWord`. The other half of the boundary is the HOOK: the engine's words that a screen hands to
// `t(key, params)` as params (`NATIONAL_TEAM.label`, a stage from `leagueExitLabel`) are read by `RenderContext.words` when the Russian row renders. This file mounts the college year card – which hands the
// national team's name and the league's exit stage into two rows – with `createWordReaders` replaced by a copy whose `holes` is the identity, and asserts the English words DO reach the Russian line. Beside it, the same card
// with the real hook, the carpet's ru arm (`xxCarpet.ts`) and the unit net (`tests/i18n-display-words.test.ts` §3) print none. A net that cannot fail is not a net.
//
// ⚠ NO CYRILLIC IS TYPED HERE: the Russian is read from ru.json by key.
import { vi } from 'vitest'

vi.mock('../../src/audio/sfx', () => ({
  playSfx: () => {},
  primeSfx: () => {},
  initSfx: () => {},
  installGlobalSfx: () => {},
  isMuted: () => false,
  setMuted: () => {},
}))
vi.mock('../../src/worker/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/worker/client')>()
  return { ...actual, request: vi.fn(async () => ({ ok: false })) }
})
// the control: the real readers, with the hook that rewrites a message's params replaced by the identity
vi.mock('../../src/i18n/words', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/i18n/words')>()
  return {
    ...real,
    createWordReaders: (...args: Parameters<typeof real.createWordReaders>) => ({ ...real.createWordReaders(...args), holes: (_key: string, params: unknown) => params }),
  }
})

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import '../../src/style.css'
import CollegeYearCard from '../../src/components/CollegeYearCard.vue'
import { ENDINGS } from '../../src/engine/ending'
import { NATIONAL_TEAM } from '../../src/engine/nationalTeam'
import { KID_ID } from '../../src/engine/world/constants'
import type { CollegeProgressView, CollegeYear, Snapshot, WorldMatch } from '../../src/shared/protocol'
import { useGameStore } from '../../src/stores/game'
import { installCatalog, resetI18nForTests, setLocale } from '../../src/i18n'
import { installMemoryStorage } from './setup'
import { SHELL } from './xxCarpet'

const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>

// --- the college year card on its busiest banked state (the carpet's `BUSY`, L2-10's CARD_STATES) ------------------------------------------------
function collegeYear(over: Partial<CollegeYear> = {}): CollegeYear {
  return {
    index: 1, fromWeek: 281, untilWeek: 333, startSkill: 58.6, endSkill: 58.9, startRank: null, endRank: null, fundsDeltaCents: -3_806_075, callUp: null,
    league: { week: 293, roundsWon: 2, rounds: 3 }, ...over,
  } as CollegeYear
}
function collegeView(over: Partial<CollegeProgressView> = {}): CollegeProgressView {
  return {
    yearsDone: 1, totalYears: ENDINGS.collegeYears, last: collegeYear(), final: false, billPerYearCents: 8_673_00, tier: 'state', rubbers: [],
    league: { week: 293, roundsWon: 2, rounds: 3 }, leagueMatches: [], yearInProgress: false, leagueIsNextStop: false, callUpIsNextStop: false, ...over,
  } as CollegeProgressView
}
const fixture = (eventId: string, opp: string, winnerId: string, score: string, retiredId?: string): WorldMatch =>
  ({ eventId, round: 0, oppName: opp, winnerId, score, retiredId, surface: 'hard' }) as unknown as WorldMatch
const CALL_UP = { rubbersPlayed: 2, rubbersWon: 1, nationFinish: 2 } as unknown as CollegeYear['callUp']
const BUSY = collegeView({
  yearsDone: 3, final: true, last: collegeYear({ index: 3, startRank: 12, endRank: null, callUp: CALL_UP }), league: { week: 293, roundsWon: 0, rounds: 3 },
  rubbers: [fixture('r1', 'Ana Petrova', KID_ID, '6-3 6-4'), fixture('r2', 'Ina Boll', 'opp', '3-6', 'kid')], leagueMatches: [fixture('l1', 'Eva Roth', 'opp', '2-6 1-6')],
})
const snap = (view: CollegeProgressView): Snapshot => ({ week: 281, seed: 'ru22-college', ending: { college: view }, college: { untilWeek: 333 } }) as unknown as Snapshot

async function card(): Promise<{ w: VueWrapper; text: string }> {
  useGameStore().snapshot = snap(BUSY)
  const w = mount(CollegeYearCard, { ...SHELL }) as VueWrapper
  await flushPromises()
  return { w, text: w.text().replace(/\s+/g, ' ') }
}

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

describe('the hook-off control: the engine\'s words reach the Russian line', () => {
  it('the league\'s exit stage and the national team\'s name stand in English inside their Russian rows when the hook is off', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    const { w, text } = await card()
    // the selectors row carries the competition's name in a hole: `NATIONAL_TEAM.label`
    expect(text, 'the control: the English competition name is in the Russian line').toContain(NATIONAL_TEAM.label)
    // the league note names the stage the engine named in guillemets
    expect(text, 'the control: the English stage is in the Russian line').toMatch(/«(?:Quarterfinal|Semifinal|Final)»/)
    w.unmount()
  })

  it('and under English nothing is different from the real hook\'s run: the same card, the same words (the hook is never asked)', async () => {
    const { w, text } = await card()
    expect(text).toContain(NATIONAL_TEAM.label)
    w.unmount()
  })
})

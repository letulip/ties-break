// L3-0 (09.10) – A LEDGER ROW SHOWS ITS REF, MOUNTED. The only thing the unit tests cannot say about `WorldEvent.c` is whether the SCREEN reads it: that the feed
// (HomeScreen's `#diary-news` table – the biggest of the render sites) draws `eventText(e)` and not `e.text`. This mounts the real screen over a real fresh career whose
// ledger is exactly the rows given, and asserts what the cell holds.
//
//   · English: a row carrying a ref and its stored text show the SAME bytes (the formatter's identity path) – the 0-risk half of the wave;
//   · Russian with a catalog: the ref is looked up and the TRANSLATION is drawn, the stored English is not – the half that makes the migration worth having;
//   · a row with no ref (every row a writer still emits, and the migration's remainder) draws its text under any locale – visible English, which is what the L4
//     miss counter exists to count, not something to hide here.
//
// ⚠ FIXTURE SENTENCES ON PURPOSE (CLAUDE.md invariant 4): nothing here asserts a shipped string, so no wording change can move this file.
// ⚠ PROVEN TO BE ABLE TO FAIL: HomeScreen's cell put back to `{{ e.text }}` -> the Russian case goes red (watched, 09.10; output in the wave report).
import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { DEFAULT_PROFILE, type Snapshot, type WorldEvent } from '../../src/shared/protocol'
import { installCatalog, missCount, resetI18nForTests, setLocale } from '../../src/i18n'
import { installMemoryStorage } from './setup'

// HomeScreen reads localStorage at setup and this runner has none: the shared opt-in shim (tests/component/setup.ts), not a ninth copy of the block (T5.14's ratchet).
installMemoryStorage()

const REF_ROW = 'fixture sentence one'
const PLAIN_ROW = 'fixture plain row'

function openHome(rows: WorldEvent[]) {
  const world = createWorld('l3-0-event-display', { ...DEFAULT_PROFILE })
  world.events = rows
  const game = useGameStore()
  game.$patch({ snapshot: toSnapshot(world) as Snapshot })
  return mount(HomeScreen, { props: { recapFresh: false } })
}

const feedCells = (wrapper: ReturnType<typeof openHome>): string[] => wrapper.findAll('#diary-news tbody tr td').map((td) => (td.element.textContent ?? '').trim())
const rows = (): WorldEvent[] => [
  { id: 1, week: 1, type: 'info', text: REF_ROW, keep: true, c: { k: 'fixture sentence {0}', p: ['one'] } },
  { id: 2, week: 1, type: 'info', text: PLAIN_ROW, keep: true },
]

describe('L3-0 – the feed draws a ledger row through its ref', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    resetI18nForTests()
  })

  it('English: a row with a ref and the same row with only its text are the same bytes on the screen', () => {
    const cells = feedCells(openHome(rows()))
    expect(cells.some((c) => c.endsWith(REF_ROW)), 'the ref row').toBe(true)
    expect(cells.some((c) => c.endsWith(PLAIN_ROW)), 'the plain row').toBe(true)
  })

  it('Russian with a catalog: the ref is looked up and the translation is drawn, not the stored English', async () => {
    installCatalog('ru', { 'fixture sentence {0}': 'ФИКСТУРА {0}' })
    await setLocale('ru')
    const wrapper = openHome(rows())
    await nextTick()
    const cells = feedCells(wrapper)
    expect(cells.some((c) => c.endsWith('ФИКСТУРА one')), 'the translated ref, holes filled with the captured strings').toBe(true)
    expect(cells.some((c) => c.endsWith(REF_ROW)), 'the stored English of a row that HAS a ref is not drawn').toBe(false)
    expect(cells.some((c) => c.endsWith(PLAIN_ROW)), 'a row with no ref stays visible English – the remainder the miss counter exists for').toBe(true)
  })

  it('a ref the catalog does not know falls back to English and is COUNTED, never thrown', async () => {
    installCatalog('ru', {})
    await setLocale('ru')
    const before = missCount()
    const wrapper = openHome(rows())
    await nextTick()
    expect(feedCells(wrapper).some((c) => c.endsWith(REF_ROW))).toBe(true)
    expect(missCount() - before, 'ruling 4 as a number: the untranslated ref row').toBeGreaterThanOrEqual(1)
  })
})

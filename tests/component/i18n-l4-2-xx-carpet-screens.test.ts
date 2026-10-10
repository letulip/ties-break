// THE `xx` CARPET, AREA 1 – the eleven screens (wave L4-2, spec §6). Home, This week, Calendar, Season, Kid, Coach Market (both landings),
// the four Family-budget tabs, Stats, Trophies, the Album, and the three More tabs – each mounted on the REAL career the L2 net for
// that screen poses, in English and under `xx`, through the shared instrument (`xxCarpet.ts`). Registry only: the sweep, the ledger
// and the report are the harness's.
import { vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import type { Component } from 'vue'
import '../../src/style.css'

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

import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import ThisWeekScreen from '../../src/components/screens/ThisWeekScreen.vue'
import CalendarScreen from '../../src/components/screens/CalendarScreen.vue'
import SeasonScreen from '../../src/components/screens/SeasonScreen.vue'
import KidScreen from '../../src/components/screens/KidScreen.vue'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import StatsScreen from '../../src/components/screens/StatsScreen.vue'
import TrophiesScreen from '../../src/components/screens/TrophiesScreen.vue'
import AlbumScreen from '../../src/components/screens/AlbumScreen.vue'
import { coachBlurb, coachProfileNote } from '../../src/engine/world/coachMarket'
import type { Snapshot } from '../../src/shared/protocol'
import { bookOf } from './albumFixture'
import { carpet, posed, type Extra, type Surface } from './xxCarpet'
import { coached, golden, mountMore, ranked, selfCoached, shopSnap } from './xxPoses'

Element.prototype.scrollIntoView = function () {}

/** A screen on a snapshot – the harness's `posed`, kind fixed. */
const screen = (id: string, swept: string, comp: Component, snap: () => Snapshot, props: Record<string, unknown> = {}, after?: (w: VueWrapper) => Promise<void>, extra: Extra = {}): Surface =>
  posed(id, 'screen', swept, comp, snap, props, after, extra)

/** The Coach Market's own prose: the engine writes a blurb per coach and a profile note per tier/fit (`coachBlurb`, `coachProfileNote` – L2-5's corpus). */
const coachWords = (snap: Snapshot): string[] =>
  (snap.coachMarket ?? []).flatMap((r) => [coachBlurb(r.id) ?? '', coachProfileNote(r.tier, r.fit), coachProfileNote(r.tier, 'good'), coachProfileNote(r.tier, 'off')])
const BOOK = bookOf(3)
/** The same three sheets with a layout-C opener: the tag card and the tagged page the plain book never draws. */
const BOOK_C = bookOf(3, { layout: 'C' })

/** The Family-budget screen on one of its four tabs (Spending, Bills, History, Shop), picked by position – the label is bracketed under xx. */
const money = (id: string, tab: number, snap: () => Snapshot): Surface =>
  screen(id, 'L2-6', MoneyScreen, snap, {}, async (w: VueWrapper) => {
    if (tab > 0) await w.findAll('.money-tabs button')[tab]!.trigger('click')
    await flushPromises()
  })

/** More, on `tab` – the shared pose (`xxPoses.mountMore`), the worker client mocked above to answer «no». */
const more = (id: string, tab: 0 | 1 | 2): Surface => ({ id, kind: 'screen', swept: 'L2-11', mount: () => mountMore(tab) })

const SURFACES: readonly Surface[] = [
  screen('HomeScreen', 'L2-3', HomeScreen, ranked, { props: { recapFresh: true } }),
  screen('ThisWeekScreen', 'L2-3', ThisWeekScreen, coached),
  screen('CalendarScreen', 'L2-3', CalendarScreen, coached),
  screen('SeasonScreen', 'L2-4', SeasonScreen, coached),
  screen('KidScreen', 'L2-5', KidScreen, selfCoached),
  screen('CoachMarketScreen (coaches)', 'L2-5', CoachMarketScreen, coached, {}, undefined, { words: coachWords }),
  screen('CoachMarketScreen (her week)', 'L2-5', CoachMarketScreen, selfCoached, {}, undefined, { words: coachWords }),
  money('MoneyScreen: Spending', 0, coached),
  money('MoneyScreen: Bills', 1, coached),
  money('MoneyScreen: History', 2, coached),
  money('MoneyScreen: Shop', 3, shopSnap),
  screen('StatsScreen', 'L2-7', StatsScreen, golden),
  screen('TrophiesScreen', 'L2-7', TrophiesScreen, golden),
  screen('AlbumScreen', 'L2-7', AlbumScreen, golden, { props: { book: BOOK } }, undefined, { engine: () => [BOOK] }),
  screen('AlbumScreen: layout C', 'L2-7', AlbumScreen, golden, { props: { book: BOOK_C } }, undefined, { engine: () => [BOOK_C] }),
  more('MoreScreen: Play', 0),
  more('MoreScreen: Saves', 1),
  more('MoreScreen: About', 2),
]

carpet('screens', SURFACES)

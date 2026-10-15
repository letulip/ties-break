// THE `xx` CARPET, AREA 1 – FIRST HALF (wave L4-2, spec §6): Home, This week, Season, the four Family-budget tabs and the
// three More tabs, each mounted on the REAL career the L2 net for that screen poses, in English and under `xx`, through the shared instrument (`xxCarpet.ts`). Registry only: the
// sweep, the ledger and the report are the harness's. The other half – the kid, the Calendar, the Coach Market, Stats, Trophies and the Album – is `i18n-l4-2-xx-carpet-screens-b.test.ts`, area `screens-b`.
//
// ⚠ CUT IN TWO ON 14.10 (r52, I1), UNDER THE RADAR LAW (11.08: a file on the wall is cut, never given a late-ack classifier). The CI component job runs `npm run test:component`
// plainly on a 2-core runner, and the owner's trace of that day had all 323 files and 3891 tests PASSED and still exited non-zero on one unhandled error, `[vitest-worker]: Timeout
// calling "onTaskUpdate"` – birpc's 60 s window. This screens carpet was the longest component file of the project: 69 s in that run, under the whole suite's contention, against
// 29.4 s solo – so contention reached it first, and it was never a regression of the round. The halves are cut by COST, not by theme (`CoachMarketScreen (coaches)` alone is
// 4.5 s solo, which is why the cheaper Kid, Calendar and records ride with it in the other file). A surface's ledger rows (`xxFindings.ts`, `ruRawFindings.ts`) are keyed by AREA and
// move with it: a row left under `screens` for a surface of `screens-b` fails the carpet's first arm, «ledger rows with no surface». Neither ledger held a row for either half
// when it was cut, and the instrument pins the union of the two halves by id.
import { vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
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
import SeasonScreen from '../../src/components/screens/SeasonScreen.vue'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import type { Snapshot } from '../../src/shared/protocol'
import { carpet, screen, type Surface } from './xxCarpet'
import { coached, mountMore, ranked, shopSnap } from './xxPoses'

Element.prototype.scrollIntoView = function () {}

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
  screen('SeasonScreen', 'L2-4', SeasonScreen, coached),
  money('MoneyScreen: Spending', 0, coached),
  money('MoneyScreen: Bills', 1, coached),
  money('MoneyScreen: History', 2, coached),
  money('MoneyScreen: Shop', 3, shopSnap),
  more('MoreScreen: Play', 0),
  more('MoreScreen: Saves', 1),
  more('MoreScreen: About', 2),
]

carpet('screens', SURFACES)

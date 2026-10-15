// THE `xx` CARPET, AREA 1 – SECOND HALF (wave L4-2, spec §6): Kid, Calendar, Coach Market (both landings), Stats, Trophies and the
// Album (both layouts), each mounted on the REAL career (or the v46 golden save) the L2 net for that screen poses, in English and under `xx`, through the shared instrument
// (`xxCarpet.ts`). Registry only: the sweep, the ledger and the report are the harness's. The first half – Home, This week, Season, the Family budget and More –
// is `i18n-l4-2-xx-carpet-screens.test.ts`, area `screens`.
//
// ⚠ CUT FROM THAT FILE ON 14.10 (r52, I1), UNDER THE RADAR LAW (11.08: a file on the wall is cut, never given a late-ack classifier). The owner's CI trace had all 323 files and
// 3891 tests PASSED and still exited non-zero on one unhandled error, `[vitest-worker]: Timeout calling "onTaskUpdate"` – birpc's 60 s window. This screens carpet was the longest
// component file of the project: 69 s in that run, under the whole suite's contention, against 29.4 s solo. `CoachMarketScreen (coaches)` alone is 4.5 s solo, so the halves are
// cut by COST, not by theme. A surface's ledger rows (`xxFindings.ts`, `ruRawFindings.ts`) are keyed by AREA and move with it – this file's is `screens-b`; neither ledger held a row
// for any of these surfaces when they moved, and the instrument pins the union of the two halves by id.
import { vi } from 'vitest'
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

import KidScreen from '../../src/components/screens/KidScreen.vue'
import CalendarScreen from '../../src/components/screens/CalendarScreen.vue'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import StatsScreen from '../../src/components/screens/StatsScreen.vue'
import TrophiesScreen from '../../src/components/screens/TrophiesScreen.vue'
import AlbumScreen from '../../src/components/screens/AlbumScreen.vue'
import { bookOf } from './albumFixture'
import { carpet, screen, type Surface } from './xxCarpet'
import { coached, golden, selfCoached } from './xxPoses'

Element.prototype.scrollIntoView = function () {}

// ⭐ RU-23 (11.10): THE COACH MARKET'S OWN PROSE IS NO LONGER AN ALLOWANCE. It was – `coachBlurb` and `coachProfileNote` were engine words the surface printed unwrapped, so the carpet listed them as the
// engine's. They are catalog keys now (the seat `engine.text`), read through `engineText`, so under `xx` they are bracketed like any wrapped line and a raw print of one is a leak again.
const BOOK = bookOf(3)
/** The same three sheets with a layout-C opener: the tag card and the tagged page the plain book never draws. */
const BOOK_C = bookOf(3, { layout: 'C' })

const SURFACES: readonly Surface[] = [
  screen('KidScreen', 'L2-5', KidScreen, selfCoached),
  screen('CalendarScreen', 'L2-3', CalendarScreen, coached),
  screen('CoachMarketScreen (coaches)', 'L2-5', CoachMarketScreen, coached),
  screen('CoachMarketScreen (her week)', 'L2-5', CoachMarketScreen, selfCoached),
  screen('StatsScreen', 'L2-7', StatsScreen, golden),
  screen('TrophiesScreen', 'L2-7', TrophiesScreen, golden),
  screen('AlbumScreen', 'L2-7', AlbumScreen, golden, { props: { book: BOOK } }, undefined, { engine: () => [BOOK] }),
  screen('AlbumScreen: layout C', 'L2-7', AlbumScreen, golden, { props: { book: BOOK_C } }, undefined, { engine: () => [BOOK_C] }),
]

carpet('screens-b', SURFACES)

// MOUNTING SEASONSCREEN – four suites, one arrangement.
//
// SeasonScreen is STORE-DRIVEN: it reads `useGameStore().snapshot` rather than taking a prop, so
// "mount it against this career" means "push the snapshot into a live Pinia store first". The
// `teleport: true` stub is what keeps the screen's dialogs inside the wrapper, where a test can find
// them. Miss either half and the mount is not the screen the player sees.
//
// The four copies were semantically identical; one wrote `useGameStore().snapshot = snapshot` and
// three took a temporary. Nothing else differed.
//
// ⚠ COMPONENT PROJECT ONLY. This pulls in @vue/test-utils and an SFC, and `vue()` is declared on the
// `component` project alone (vite.config.ts) – a unit test importing this would die on the template
// block. Nothing outside tests/component/ may import it.
import { mount } from '@vue/test-utils'
import SeasonScreen from '../../src/components/screens/SeasonScreen.vue'
import { useGameStore } from '../../src/stores/game'
import type { Snapshot } from '../../src/shared/protocol'

/** SeasonScreen mounted against `snapshot`, with teleports stubbed so dialogs stay findable. */
export function mountSeason(snapshot: Snapshot) {
  const store = useGameStore()
  store.snapshot = snapshot
  return mount(SeasonScreen, { global: { stubs: { teleport: true } } })
}

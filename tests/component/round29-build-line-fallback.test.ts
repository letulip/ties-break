// ROUND 29 #19 - WHAT THE FOOT OF SETTINGS RENDERS WHEN THE BUILD CONSTANT IS ABSENT.
//
// ⭐ THIS IS THE CASE THAT WILL ACTUALLY HAPPEN ONE DAY. A build made by anything that does not run
// our `define` - a clean tarball, a container with no git history, someone bundling `src/` by hand -
// leaves `__BUILD_SHA__` unsubstituted, and `src/buildStamp.ts` hands the screen an empty string. The
// requirement is that the line still RENDERS, and says `unknown` rather than going blank or printing
// half a sentence: an empty footer reads as a rendering bug and sends the reader looking for the
// wrong defect, and that is precisely the confusion the whole item exists to end.
//
// ⚠ THE MOCK IS ON THE INJECTION POINT AND NOTHING ELSE. `src/buildStamp.ts` is two exported
// constants - the place `define` lands - and replacing it here is exactly what "the build constant is
// absent" means. The formatting, the fallback and the screen are all the real ones; nothing under
// test is stubbed. That seam is why buildStamp.ts is a separate module from composables/buildInfo.ts.
//
// ⚠ AND IT IS ITS OWN FILE BECAUSE `vi.mock` IS FILE-SCOPED. Sharing a file with the real-values
// assertions in round29-build-line.test.ts would mock the constants those assertions exist to read.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// The unsubstituted state, verbatim: what `typeof __BUILD_SHA__ === 'string' ? … : ''` produces when
// the bundler never rewrote the identifier.
vi.mock('../../src/buildStamp', () => ({ RAW_BUILD_SHA: '', RAW_BUILD_DATE: '' }))

import MoreScreen from '../../src/components/screens/MoreScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { SAVE_SCHEMA_VERSION } from '../../src/engine/world'

function mountMore() {
  const store = useGameStore()
  store.refreshCareers = async () => {}
  return mount(MoreScreen, { global: { stubs: { teleport: true } } })
}

beforeEach(() => setActivePinia(createPinia()))

describe('with no build constant, the foot of Settings still says something honest', () => {
  it('renders the line and says "unknown" - not blank, not a broken string', () => {
    const line = mountMore().get('.build-line').text()

    // It is THERE. A footer that vanishes when the stamp is missing would look identical to a
    // version line we never shipped.
    expect(line.length).toBeGreaterThan(0)
    // ⚠ THE EXACT STRING, because "contains unknown" would also pass for "Build unknownunknown" and
    // for a line that lost its separators. This is the sentence a reader sees.
    expect(line).toBe(`Build unknown · unknown · save schema v${SAVE_SCHEMA_VERSION}`)
  })

  it('still tells him the schema, which is the one number that survives a missing git', () => {
    // The schema is compiled from the engine constant, not from the define - so a build with no
    // commit to name still carries the number that misled us in the first place.
    expect(mountMore().get('.build-line').text()).toContain(`save schema v${SAVE_SCHEMA_VERSION}`)
  })

  it('renders no placeholder token - the identifier itself must never reach the screen', () => {
    const line = mountMore().get('.build-line').text()
    expect(line).not.toContain('__BUILD_SHA__')
    expect(line).not.toContain('__BUILD_DATE__')
    expect(line).not.toContain('undefined')
    expect(line).not.toContain('NaN')
  })
})

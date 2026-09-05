// ⭐ WHERE THE VACATION PAINTINGS ARE CROPPED – ROUND-17 #26, AND THE THIRD TIME IT HAS BEEN FOUND.
//
// The owner, 12.08: the elite-vacation recap image is cropped centre, not right. He had already
// ruled on this on 30.07 – «square of the right part of a not square (long) frame – there's a face
// there» – and MoneyScreen's trip polaroid was measured and fixed then, at `90% 50%`, off the
// finding that she sits on the RIGHT of all six frames (face at 66% of the width in `vac-village`,
// 79% in `vac-elite`). The two OTHER surfaces that crop the same six paintings were not touched.
//
// ⚠ SO THE TEST IS DELIBERATELY NOT "THE RECAP CARD IS RIGHT-SHIFTED". That is the bug he reported,
// and pinning only it would leave the next surface to be found by the next report – which is exactly
// the loop this is the third turn of. What is pinned is the CLASS of surface: every surface that
// crops a vacation frame horizontally steers with the same measured token. The list below is the
// audited answer to "which surfaces are those", with the reason each one is or is not on it.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import '../../src/style.css'
import WeekRecapCard from '../../src/components/WeekRecapCard.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { VACATION_ART_STEMS } from '../../src/art/weeks'
import type { Snapshot, WeekScene } from '../../src/shared/protocol'
import { PHONE, TABLET, setViewport } from './fits'

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8')

/** A real snapshot with the week's scene replaced – the recap card reads `diary.scene` and nothing
 *  else to choose its painting, so this is the whole input. */
function withScene(scene: WeekScene): Snapshot {
  const snap = toSnapshot(createWorld('vacation-crop'))
  return { ...snap, diary: { ...snap.diary, scene } }
}

function mountWithScene(scene: WeekScene) {
  const store = useGameStore()
  store.snapshot = withScene(scene)
  return mount(WeekRecapCard)
}

describe('the recap card crops a vacation frame towards her', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('an elite-vacation week – the owner\'s own case – is marked for the right-shifted crop', () => {
    // ⚠ MUTATION-VERIFIED: drop `:class="{ 'recap-art-vacation': isVacationScene }"` from the
    // template and this goes red. Drop only the CSS rule and it stays green – which is why the
    // second case below reads the stylesheet instead of trusting this one.
    const w = mountWithScene({ kind: 'vacation', packageId: 'elite', week: 12 } as WeekScene)
    expect(w.find('.recap-art').classes(), 'the crop follows the picture').toContain('recap-art-vacation')
    w.unmount()
  })

  it('and the class actually steers the crop, at the measured number', () => {
    // The class is only half the fix; a class nothing styles is a no-op that mounts green. Both
    // halves are asserted, in the two places they live.
    const sfc = read('../../src/components/WeekRecapCard.vue')
    expect(sfc).toMatch(/\.recap-art-vacation img\s*\{[^}]*object-position:\s*var\(--crop-vacation-x\)/)
    const sheet = read('../../src/style.css')
    // One measured number, defined once. 90% holds all six frames – see the token's own note.
    expect(sheet).toMatch(/--crop-vacation-x:\s*90%/)
  })

  it('all six packages get it, not just the one that was reported', () => {
    // `vac-elite` is the worst case, not the only one: the leftmost face of the six is still at 66%
    // and a centre crop loses her there too. Reporting one and fixing one is how this became a
    // three-round bug.
    for (const id of ['staycation', 'grandma', 'camping', 'seaside', 'resort', 'elite']) {
      const w = mountWithScene({ kind: 'vacation', packageId: id, week: 12 } as WeekScene)
      expect(w.find('.recap-art').classes(), `${id} is one of the six`).toContain('recap-art-vacation')
      w.unmount()
    }
    expect(VACATION_ART_STEMS, 'and six is still how many there are').toHaveLength(6)
  })

  it('a package with NO painting yet is left centred – the fallback is a different shape', () => {
    // `weekSceneArtUrl` falls back to the plain week painting when a package has no art, «because
    // the package catalogue can grow before the art does». That fallback is 1.88:1, not 2.50:1, and
    // shifting it to 90% would push the crop off the picture the other way. Keyed on the URL, not
    // on the scene kind, which is the difference.
    const w = mountWithScene({ kind: 'vacation', packageId: 'not-painted-yet', week: 12 } as WeekScene)
    expect(w.find('.recap-art').classes()).not.toContain('recap-art-vacation')
    w.unmount()
  })

  it('an ordinary training week is untouched', () => {
    const w = mountWithScene({ kind: 'week', week: 12 } as WeekScene)
    expect(w.find('.recap-art').classes()).not.toContain('recap-art-vacation')
    w.unmount()
  })
})

describe('every surface that crops a vacation frame – the audited list', () => {
  // ⚠ THIS IS THE HALF THAT STOPS THE LOOP. Four surfaces draw `vacationArtUrl`; each is named here
  // with why it does or does not need the steer. A FIFTH consumer appearing is not caught by any
  // assertion below – it is caught by a reader finding this list, which is the honest limit of what
  // a test can promise about art. Keep the list current when a surface is added.
  it('the package picker crops hardest of the three and uses the token', () => {
    // `.pkg-art` is a 62%-wide strip holding a 2.50:1 painting, and EVERY image it ever draws is one
    // of the six – the picker has no other art – so the rule is unconditional there.
    const sheet = read('../../src/style.css')
    expect(sheet).toMatch(/\.pkg-art img\s*\{[^}]*object-position:\s*var\(--crop-vacation-x\)/)
  })

  it('the trip polaroid keeps the 30.07 value it was measured at', () => {
    // MoneyScreen was fixed first and is left literal on purpose: it passes the value as an inline
    // style through a Polaroid prop, not through a stylesheet. Asserted so a tidy-up cannot quietly
    // recentre the one surface that was right all along.
    expect(read('../../src/components/screens/MoneyScreen.vue')).toMatch(/objectPosition:\s*'90% 50%'/)
  })

  it('the Season feed card is deliberately NOT on the list, and here is why', () => {
    // `.week-card.vacation` takes its aspect-ratio FROM the art (941/377), so `cover` fits exactly
    // and there is no horizontal crop to steer. Adding the token there would be a no-op pretending
    // to be a fix – and a no-op in a fix list is worse than an omission, because it answers the
    // question "was this checked?" wrongly.
    expect(read('../../src/components/screens/SeasonScreen.vue')).toMatch(
      /\.week-card\.vacation\s*\{[^}]*aspect-ratio:\s*941\s*\/\s*377/,
    )
  })
})

// ⭐⭐ ROUND 36 PHASE 2 – AND THE BOX THOSE CROPS HAPPEN INSIDE STOPPED GROWING AT 390px.
//
// `.recap-art` measures 343x251 on a phone and then 390x286 at EVERY width above it – 520, 576,
// 768, 900 and 1280 alike, measured in Chromium on the shipped build. Its `max-height: 286px` was
// written for exactly this case («capped at D's number so a tablet does not turn the story into a
// poster»), but a block with an `aspect-ratio` and a violated `max-height` has its WIDTH transferred
// back down the ratio – so at 768 the picture was 390px under the 736px paper note that rides on it.
//
// ⚠ THIS IS THE SAME BOX THIS FILE IS ABOUT, which is why the arm lives here: a crop is a statement
// about a painting inside a frame, and the frame had the wrong width. D10 in
// docs/specs/responsive-decisions-2026-09.md carries the decision.
//
// ⚠ THE 520/576 CASE IS DELIBERATELY NOT FIXED and is deliberately not pinned as fixed – phase 2 may
// not move anything below 768. It is recorded in docs/rounds/round-36.md.
//
// MUTATION-VERIFIED: removing the `width: 100%` reddens the tablet arm and leaves the phone arm
// green; moving it out of the media query reddens the phone arm instead.
describe('round 36 phase 2 – the recap painting fills the column on a tablet', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    setViewport(PHONE)
    document.body.innerHTML = ''
  })

  function artAt(vp: typeof PHONE): { width: string; maxHeight: string } {
    setViewport(vp)
    const store = useGameStore()
    store.snapshot = withScene({ kind: 'week', week: 12 } as WeekScene)
    // ⚠ ATTACHED, unlike the crop arms above: happy-dom applies no rule to a detached element, so a
    // computed width read off an unattached mount is the initial value and this would assert nothing.
    const w = mount(WeekRecapCard, { attachTo: document.body })
    const cs = getComputedStyle(w.find('.recap-art').element)
    // Copied out before the unmount – a detached element computes nothing.
    const box = { width: cs.width, maxHeight: cs.maxHeight }
    w.unmount()
    return box
  }

  it('⭐ at 768 the painting takes the whole column, and the 286px ceiling still holds', () => {
    expect(document.head.querySelector('style'), 'no stylesheet – this would be vacuous').toBeTruthy()
    const art = artAt(TABLET)
    expect(art.width, 'the column decides the width, not the ratio through the ceiling').toBe('100%')
    expect(art.maxHeight, 'and the story is still a band rather than a poster').toBe('286px')
  })

  it('⚠ and a phone declares no width of its own – nothing below 768 moved', () => {
    const art = artAt(PHONE)
    expect(art.width === '' || art.width === 'auto', 'the phone box is the shipped one').toBe(true)
    expect(art.maxHeight, 'with the same ceiling it always had').toBe('286px')
  })
})

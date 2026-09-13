// ⭐ ROUND 41 #13 – THE WEEK STORY'S DESKTOP CROP CUTS HEADS OFF.
//
// The owner, off a screenshot: «Проверить картинки на week recap, на скриншоте одна, где голова
// обрезана (десктоп), есть и другие, может просто этот блок чуть выше сделать или для десктоп
// картинку по-другому спозиционировать» (quoted here rather than in a template –
// tests/template-copy-rules.test.ts bans Cyrillic inside one).
//
// ⚠ THE SHAPE IS WHY. Past 768 `.recap-art` is a WIDE rectangle (384x286 at 768, 640x286 at 1280 –
// see round36-pass2-shop-recap.test.ts), while most of what rotates through it (src/art/weeks.ts) is
// square or near-square. Under `object-fit: cover` a box wider than its picture crops VERTICALLY, and
// the shared rule's default `50% 50%` (`.week-art img`, style.css) spends half of that overflow above
// the subject – which is the head this item is about. `WeekRecapCard.vue`'s new rule biases the
// window to `50% 20%`, gated to the same 768 the rectangle starts at.
//
// ⚠ THIS FILE REUSES `vacation-crop.test.ts`'s OWN HARNESS (`withScene`/`mountWithScene`) rather than
// inventing a second one for the same card: the recap reads `diary.scene` and nothing else to choose
// its painting, so replacing it on a real snapshot is the whole input either test needs.
//
// ⚠ MUTATION-VERIFIED (recorded in the round-41 ledger and the executor's report):
//   * delete the `@media (min-width: 768px) { .recap-art img { object-position: 50% 20%; } }` block
//     – the first arm goes red (`50% 50%` again).
//   * move that block BELOW `.recap-art-vacation img` in the stylesheet – the second arm goes red
//     (the vacation scene loses its horizontal steer to this rule's `50% 20%`).
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import WeekRecapCard from '../../src/components/WeekRecapCard.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
import type { Snapshot, WeekScene } from '../../src/shared/protocol'
import { DESKTOP, PHONE, setViewport } from './fits'

/** A real snapshot with the week's scene replaced – `vacation-crop.test.ts`'s own helper. */
function withScene(scene: WeekScene): Snapshot {
  const snap = toSnapshot(createWorld('recap-crop-41'))
  return { ...snap, diary: { ...snap.diary, scene } }
}

function mountWithScene(vp: typeof DESKTOP, scene: WeekScene) {
  setViewport(vp)
  useGameStore().snapshot = withScene(scene)
  // ⚠ ATTACHED, and set BEFORE mount – happy-dom evaluates a media query on an element's first
  // computed-style read and caches it (round36-pass2-shop-recap.test.ts's header), so the order is
  // always setViewport, then mount, then read.
  return mount(WeekRecapCard, { attachTo: document.body })
}

describe('round 41 #13 – the recap painting stops cropping through her head, on desktop', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    setViewport(PHONE)
    document.body.innerHTML = ''
  })

  it('⭐⭐ an ordinary week, at 1280, biases the crop up towards the head', () => {
    expect(document.head.querySelector('style'), 'no stylesheet – this would be vacuous').toBeTruthy()
    const w = mountWithScene(DESKTOP, { kind: 'week', week: 12 } as WeekScene)
    const img = getComputedStyle(w.find('.recap-art img').element)
    expect(img.objectPosition, 'the window is biased up, not centred').toBe('50% 20%')
    w.unmount()
  })

  it('⭐⭐ a vacation week, at 1280, keeps its own horizontal steer – the new rule does not blend in', () => {
    const w = mountWithScene(DESKTOP, { kind: 'vacation', packageId: 'elite', week: 12 } as WeekScene)
    expect(w.find('.recap-art').classes(), 'the vacation class is still the one that fires').toContain(
      'recap-art-vacation',
    )
    const img = getComputedStyle(w.find('.recap-art img').element)
    // --crop-vacation-x is 90% (style.css) – her measured position in all six frames, untouched by
    // this item. If this reads 50% 20%, item 13's rule is winning the tie it must lose.
    expect(img.objectPosition, "the vacation scene's own steer, not this item's").toBe('90% 50%')
    w.unmount()
  })

  it('⚠ and nothing below 768 moved – an ordinary week at 375 declares no object-position at all', () => {
    const w = mountWithScene(PHONE, { kind: 'week', week: 12 } as WeekScene)
    const img = getComputedStyle(w.find('.recap-art img').element)
    // ⚠ happy-dom reports an unset longhand as '', not the spec's initial `50% 50%` – the same idiom
    // `vacation-crop.test.ts` uses for `.recap-art`'s own unset `width` on a phone. Either reading
    // means the same thing here: this item's rule never reached this element.
    expect(
      img.objectPosition === '' || img.objectPosition === '50% 50%',
      `the phone cascade is untouched, read back as '${img.objectPosition}'`,
    ).toBe(true)
    w.unmount()
  })
})

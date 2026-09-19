// ⭐⭐⭐ THE PAINTED BRIDE, MOUNTED – the wedding memory on Home's polaroid (18.09).
//
// `fem-euro-brunnet-adult-bride.webp` shipped with the art set, is the reason the wedding's 23+
// minimum was ruled on 11.09, and was referenced by NOTHING in `src/` until this wave wired it.
// `tests/portrait-bands.test.ts` covers the ART side – which files exist, which band falls back to
// what – and `tests/wave7-wedding.test.ts` covers the ENGINE side – that the milestone points at the
// bride at all. This file covers the third thing, which neither of those can see and which is the
// one that actually reaches a player:
//
// ⚠⚠ THE POLAROID ASKS TWO QUESTIONS OF THE SAME PAINTING AND MUST GET ONE ANSWER. It binds `src`
// (built by `portraitUrl`) and `photo-style` (an `object-position` built from `facePoint`, which is
// keyed on the painting's STEM). The bride exists in ONE band, so the url resolves a fallback for
// the other four – and if the stem did not, `facePoint` would be handed a key it does not know and
// answer its 50/50 default, which on a landscape cover window is her shoulder. That divergence is
// exactly what `art/faceRects.ts`' own header predicted of any builder that spells a stem by hand,
// and it is invisible to a source pin and to both files above.
//
// MUTATION LEDGER (MEASURED 18.09, and the counts are the measurements rather than predictions):
//   ARM 1  HomeScreen spells the stem by hand again              → 1 RED [1 test, 1 assertion]: the
//          (`${stage}-${emotion}` instead of `paintedStemFor`)      lateCareer case, framing at
//                                                                   «50% 50%» instead of
//                                                                   «46.875% 16.6015625%»
//   ARM 2  `paintedFaceFor` ignores `FACE_BANDS` (returns the    → 1 RED [1 test, 1 assertion]: the
//          face unchanged)                                          same case, whose `src` then
//                                                                   names a file not on disk
//
// ⚠ WHY ARM 1 REDDENS ONE CASE AND NOT TWO, said out loud because the asymmetry is the argument for
// this file existing: in the `adult` band the hand-spelled stem happens to BE the right one, so the
// bug is invisible on the career the wedding most often produces and shows only on the one that
// falls back. That is the shape of every defect `art/faceRects.ts`' header warns about – «harmless
// TODAY» – and it is why the measurement had to be taken rather than assumed. ⚠ The «one stem, two
// consumers» arm in tests/portrait-bands.test.ts was run against ARM 1 first and measured GREEN: it
// asserts on `paintedStemFor` itself and cannot see what HomeScreen does with it. A test that cannot
// fail on the broken version is not this test.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
// ⚠ THE APP'S OWN SHEET FIRST, and `DEFAULT_PROFILE` off `shared/protocol` rather than off
// `engine/world` – round37-home-cards.test.ts' exact preamble, and it is load-bearing rather than
// cosmetic: pulled through the engine barrel instead, this file died at import with
// `corridorBandFor is not a function`, which is the nine-hop-cycle symptom `world/reckoning.ts`
// exists because of. The house rule after that finding is to copy a working preamble, not to
// re-derive one.
import '../../src/style.css'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { CROPS } from '../../src/art/faceRects'
import type { MemoryFace, PortraitStage } from '../../src/shared/avatarEmotion'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'

// ⚠ THIS RUNNER HAS NO localStorage AND HomeScreen READS IT AT SETUP (`tb:kidAvatarHintSeen`), so a
// mount throws before anything can be measured. The shim round18-coach.test.ts installs and
// round37-home-cards.test.ts copies: the browser's own object supplied, never the component weakened.
const backing = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => (backing.has(k) ? backing.get(k)! : null),
    setItem: (k: string, v: string) => void backing.set(k, String(v)),
    removeItem: (k: string) => void backing.delete(k),
    clear: () => backing.clear(),
    key: (i: number) => [...backing.keys()][i] ?? null,
    get length() {
      return backing.size
    },
  },
})

let wrapper: VueWrapper | null = null

/** A real career four weeks in – long enough for the diary to hold a memory, which is what puts the
 *  polaroid on the page at all. A measurement taken on a card with no photograph on it would be a
 *  null arm dressed as a null result (round 37's own note). */
function snapshotWithMemory(stage: PortraitStage, emotion: MemoryFace): Snapshot {
  const world = createWorld('w7-bride-home', { ...DEFAULT_PROFILE, coachTier: 'middle' })
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 4; i++) tickWeek(world, rng)
  const snap = toSnapshot(world)
  if (!snap.diary.memory) throw new Error('the fixture has no memory – the polaroid would not render')
  // ⚠ THE MEMORY IS PATCHED RATHER THAN WALKED TO, DELIBERATELY. Reaching a real wedding needs a
  // 23+ career with a deep episode and a hazard hit – hundreds of weeks in a component project that
  // is meant to be seconds. The SHAPE is the engine's own (`MemoryCard` off `toSnapshot`), the face
  // is the one `MEMORY_EMOTION.wedding` puts there, and `tests/wave7-wedding.test.ts` is what pins
  // that the engine really writes it.
  return { ...snap, diary: { ...snap.diary, memory: { ...snap.diary.memory, stage, emotion } } }
}

function mountHome(stage: PortraitStage, emotion: MemoryFace): void {
  useGameStore().snapshot = snapshotWithMemory(stage, emotion)
  wrapper = mount(HomeScreen, {
    props: { recapFresh: false },
    global: { stubs: { teleport: true } },
    attachTo: document.body,
  })
}

/** The polaroid's photograph, as the DOM actually holds it. */
function photo(): HTMLImageElement {
  const el = document.querySelector('.memory-polaroid img')
  if (!el) throw new Error('no memory photograph on the page – the measurement below would be vacuous')
  return el as HTMLImageElement
}

/** `object-position` as the rectangle table would write it for a named stem. */
function expectedPosition(stem: string): string {
  const rect = CROPS[stem]
  if (!rect) throw new Error(`${stem} has no face rectangle – the expectation would be invented`)
  const pct = (v: number) => Math.min(100, Math.max(0, (v / 512) * 100))
  return `${pct(rect[0])}% ${pct(rect[1])}%`
}

beforeEach(() => setActivePinia(createPinia()))
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})

describe('⭐⭐⭐ the wedding polaroid draws the bride, and frames her by her own rectangle', () => {
  it('⭐⭐⭐ in the band she is painted for, the photograph IS the bride and is framed as one', () => {
    mountHome('adult', 'bride')
    const img = photo()
    expect(img.getAttribute('src'), 'the painting the 11.09 ruling was about').toContain(
      'fem-euro-brunnet-adult-bride.webp',
    )
    // ⚠⚠ THE ARM (ARM 1). The framing is the half a source pin cannot see: a hand-spelled stem
    // resolves to a key `facePoint` does not know and falls to «50% 50%», which on a cover window is
    // her shoulder rather than her face.
    expect(img.style.objectPosition, 'framed by HER rectangle, not the 50/50 default').toBe(
      expectedPosition('adult-bride'),
    )
    expect(img.style.objectPosition).not.toBe('50% 50%')
  })

  it('⭐⭐ in a band she is NOT painted for, both halves fall back TOGETHER – no 404, no 50/50', () => {
    // A first marriage in the thirties is an ordinary career, not an edge case: the gate is 23+ and
    // `lateCareer` starts at 31.
    mountHome('lateCareer', 'bride')
    const img = photo()
    // ⚠⚠ THE ARM (ARM 2). Without the band table this names `fem-euro-brunnet-lateCareer-bride.webp`,
    // which is not on disk – a broken frame on the last screen a player looks at.
    expect(img.getAttribute('src'), 'a woman of thirty-one, in her own band').toContain(
      'fem-euro-brunnet-lateCareer-norm.webp',
    )
    expect(img.getAttribute('src'), 'and never a file that does not exist').not.toContain('lateCareer-bride')
    // ...and the FRAMING followed the picture rather than the request, which is the whole point of
    // there being one stem: the rectangle is `lateCareer-norm`'s, because that is what is on screen.
    expect(img.style.objectPosition, 'the framing names the painting that is actually drawn').toBe(
      expectedPosition('lateCareer-norm'),
    )
    expect(img.style.objectPosition).not.toBe('50% 50%')
  })

  it('⚠ the ordinary faces are untouched – every band of every mood memory frames exactly as before', () => {
    // The band table is a `Partial` keyed on the face, so for the eight matrix faces `paintedFaceFor`
    // is the identity and nothing about this card moved. Checked on the two that a memory actually
    // uses at opposite ends of the register.
    for (const [stage, face] of [['teen', 'happy'], ['young', 'injury']] as const) {
      wrapper?.unmount()
      document.body.innerHTML = ''
      setActivePinia(createPinia())
      mountHome(stage, face)
      const img = photo()
      expect(img.getAttribute('src'), `${stage}-${face} still names its own painting`).toContain(
        `fem-euro-brunnet-${stage}-${face}.webp`,
      )
      expect(img.style.objectPosition, `${stage}-${face} still frames by its own rectangle`).toBe(
        expectedPosition(`${stage}-${face}`),
      )
    }
  })
})

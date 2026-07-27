// The owner's 27.07 call, pinned: FIVE portrait bands, `angry` a real emotion, and no band
// wearing another band's face.
//
//   jun <11 · young 11-16 · teen 17-22 · adult 23-30 · milf 31+
//
// Three things are worth a test here and one thing is worth a test AGAINST:
//   1. the band boundaries, including the upper bound `adult` did not used to have;
//   2. the art matrix — 5 stages x 7 emotions, crops AND paintings, actually on disk, because a
//      missing crop is a broken <img> in the header rather than a type error;
//   3. that the adult->teen crop clamp is gone from every surface that had it;
//   4. that `angry` is reachable ONLY through its trigger. It used to be a test AGAINST – nothing
//      selected the emotion at all – and that pin went red exactly as intended when fix/world-trio
//      wired the owner's trigger (a run of 4-6 straight losses). What survives is the half that is
//      still a real property: every OTHER input still resolves to one of the six faces it always
//      did, so anger cannot leak into an ordinary loss. The trigger's own behaviour is pinned in
//      tests/world-trio.test.ts.
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import {
  avatarCropPath,
  avatarEmotion,
  idleEmotion,
  portraitStage,
  type AvatarEmotion,
  type PortraitStage,
} from '../src/shared/avatarEmotion'
import { cropUrl, portraitUrl } from '../src/art/preload'
import type { TierId } from '../src/engine/season/types'

const STAGES: PortraitStage[] = ['jun', 'young', 'teen', 'adult', 'milf']
const EMOTIONS: AvatarEmotion[] = ['norm', 'happy', 'sad', 'serious', 'tired', 'injury', 'angry']
const TIERS: TierId[] = ['local', 'regional', 'national', 'j30', 'j60', 'j300']

const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8')
const asset = (rel: string) => new URL(`../public/${rel}`, import.meta.url)

describe('the five portrait bands', () => {
  it('resolves the owner\'s boundaries exactly', () => {
    const expected: [number, PortraitStage][] = [
      [0, 'jun'], [6, 'jun'], [10, 'jun'],
      [11, 'young'], [14, 'young'], [16, 'young'],
      [17, 'teen'], [22, 'teen'],
      [23, 'adult'], [30, 'adult'],
      [31, 'milf'], [45, 'milf'],
    ]
    for (const [age, stage] of expected) expect(portraitStage(age), `age ${age}`).toBe(stage)
  })

  it('is total and monotonic – every age lands in a band, and a band is never revisited', () => {
    // A birthday may only ever move her FORWARD along the ladder. The old resolver could not get
    // this wrong (adult was terminal); with a fifth band an off-by-one could.
    const seen: PortraitStage[] = []
    for (let age = 0; age <= 60; age++) {
      const s = portraitStage(age)
      expect(STAGES, `age ${age} resolved outside the ladder`).toContain(s)
      if (seen[seen.length - 1] !== s) {
        expect(seen, `age ${age} went BACK to ${s}`).not.toContain(s)
        seen.push(s)
      }
    }
    expect(seen).toEqual(STAGES)
  })

  it('a 31-year-old does not wear a 17-year-old\'s face – the adult->teen clamp is gone', () => {
    expect(avatarCropPath('adult', 'norm')).toBe('avatars/adult-norm.webp')
    expect(avatarCropPath('milf', 'norm')).toBe('avatars/milf-norm.webp')
    for (const stage of STAGES) {
      for (const emotion of EMOTIONS) {
        expect(avatarCropPath(stage, emotion)).toBe(`avatars/${stage}-${emotion}.webp`)
      }
    }
    // ...and no surface reintroduces it behind the shared helper's back.
    for (const f of ['../src/shared/avatarEmotion.ts', '../src/art/preload.ts', '../src/composables/kidEmotion.ts']) {
      expect(read(f), `${f} still clamps a stage`).not.toMatch(/===\s*'adult'\s*\?/)
    }
  })
})

describe('the art matrix is complete on disk', () => {
  it('every stage x emotion has a 256px crop', () => {
    for (const stage of STAGES) {
      for (const emotion of EMOTIONS) {
        expect(existsSync(asset(avatarCropPath(stage, emotion))), `missing crop ${stage}-${emotion}`).toBe(true)
      }
    }
  })

  it('every stage x emotion has a full painting', () => {
    for (const stage of STAGES) {
      for (const emotion of EMOTIONS) {
        const rel = `images/fem-euro-brunnet/fem-euro-brunnet-${stage}-${emotion}.webp`
        expect(existsSync(asset(rel)), `missing painting ${stage}-${emotion}`).toBe(true)
      }
    }
  })

  it('the url builders agree with the files – milf and angry included', () => {
    const strip = (u: string) => u.slice(import.meta.env.BASE_URL.length)
    for (const stage of STAGES) {
      for (const emotion of EMOTIONS) {
        expect(existsSync(asset(strip(cropUrl(stage, emotion)))), `cropUrl ${stage}-${emotion}`).toBe(true)
        expect(existsSync(asset(strip(portraitUrl(stage, emotion)))), `portraitUrl ${stage}-${emotion}`).toBe(true)
      }
    }
  })
})

describe('`angry` is reachable only through its trigger', () => {
  it('is a member of the union the surfaces accept', () => {
    // Compile-time is the real assertion; this keeps it honest at runtime too.
    expect(avatarCropPath('milf', 'angry')).toBe('avatars/milf-angry.webp')
  })

  it('the art pipeline no longer skips it', () => {
    const src = read('../scripts/optimize-art.mjs')
    expect(src, 'the -angry NOT_SHIPPED rule must be gone').not.toMatch(/\{\s*re:\s*\/-angry\$\/i/)
    // the logo rule is a separate decision and stays
    expect(src).toMatch(/re:\s*\/\^logo-tb-\/i/)
  })

  it('NOTHING WITHOUT A LOSING STREAK returns it', () => {
    // Sweep the whole rest of avatarEmotion's input space: fresh/stale result x won/lost x
    // final-or-not x every tier x every title tier and age x injury x the condition ladder, with no
    // streak supplied. This is the half of the old "nothing returns angry" pin that is still TRUE
    // and still worth having: the trigger must be the ONLY door, so an ordinary loss – at any tier,
    // in any state – still reads sad/serious exactly as it did before the emotion existed.
    const results = new Set<AvatarEmotion>()
    for (const condition of [0, 39, 40, 59, 60, 100]) {
      for (const injured of [false, true]) {
        results.add(idleEmotion(injured, condition))
        for (const won of [false, true]) {
          for (const lostFinal of [false, true]) {
            for (const tier of [undefined, ...TIERS]) {
              for (const resultWeek of [10, 9]) {
                for (const lastTitle of [null, ...TIERS.flatMap((t) => [8, 9, 10].map((w) => ({ tier: t, week: w })))]) {
                  // both shapes a caller can hand over when there is no run: absent and null
                  for (const lossStreak of [undefined, null]) {
                    results.add(
                      avatarEmotion({
                        week: 10,
                        condition,
                        injured,
                        lastResult: { week: resultWeek, won, lostFinal, tier },
                        lastTitle,
                        lossStreak,
                      }),
                    )
                  }
                }
              }
            }
          }
        }
        results.add(avatarEmotion({ week: 10, condition, injured, lastResult: null }))
      }
    }
    expect([...results].sort()).toEqual(['happy', 'injury', 'norm', 'sad', 'serious', 'tired'])
    expect(results.has('angry')).toBe(false)
  })

  it('IS preloaded now that it can happen – bytes follow reachability', async () => {
    // The rule never changed, only the answer: warm every face the decision can return, and only
    // those. `angry` was excluded while it was unreachable and joins the set with its trigger.
    const { KID_EMOTIONS } = await import('../src/art/preload')
    expect(KID_EMOTIONS).toContain('angry')
    expect([...KID_EMOTIONS].sort()).toEqual(['angry', 'happy', 'injury', 'norm', 'sad', 'serious', 'tired'])
  })
})

// ---------------------------------------------------------------------------
// THE CROP TABLE IS THE ONLY RECORD OF HOW THE FACES ARE FRAMED.
//
// art-src/ is gitignored by design, so the 256px masters live only on the author's machine. If the
// rectangles are not in the repo, an art refresh means re-finding 35 faces by eye — which is what
// this branch had to do for the 17 it added, and what nobody could do for the 18 that shipped
// before (they were recovered by cross-correlation instead). This test makes the table complete by
// construction: add a stage or an emotion and it fails until the rectangle exists.
// ---------------------------------------------------------------------------
describe('the avatar crop table covers every face the code can request', () => {
  it('has a rectangle for every stage x emotion', async () => {
    const { CROPS } = await import('../scripts/cut-avatar-crops.mjs')
    const missing: string[] = []
    for (const stage of STAGES) {
      for (const emotion of EMOTIONS) {
        if (!(`${stage}-${emotion}` in CROPS)) missing.push(`${stage}-${emotion}`)
      }
    }
    expect(missing, 'stage x emotion pairs with no crop rectangle').toEqual([])
  })

  it('every rectangle is a square that fits inside the 512px painting', async () => {
    // A window clamped at the canvas edge silently re-frames the face, so catch it here instead.
    const { CROPS } = await import('../scripts/cut-avatar-crops.mjs')
    for (const [stem, [cx, cy, side]] of Object.entries(CROPS)) {
      expect(side, `${stem} side`).toBeGreaterThanOrEqual(100)
      expect(side, `${stem} side`).toBeLessThanOrEqual(256)
      expect(cx - side / 2, `${stem} left edge`).toBeGreaterThanOrEqual(0)
      expect(cy - side / 2, `${stem} top edge`).toBeGreaterThanOrEqual(0)
      expect(cx + side / 2, `${stem} right edge`).toBeLessThanOrEqual(512)
      expect(cy + side / 2, `${stem} bottom edge`).toBeLessThanOrEqual(512)
    }
  })
})

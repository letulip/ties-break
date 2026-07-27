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
//   4. AGAINST: that `angry` is never RETURNED by the decision. It is a member of the union and its
//      art ships, but nothing selects it yet (see shared/avatarEmotion.ts). If someone later wires
//      a trigger, this test is the one that should go red and make them say so out loud.
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

describe('`angry` is shipped art, not a live outcome', () => {
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

  it('NOTHING the decision can be asked returns it', () => {
    // Sweep the whole reachable input space of avatarEmotion: fresh/stale result x won/lost x
    // final-or-not x every tier x every title tier and age x injury x the condition ladder.
    const results = new Set<AvatarEmotion>()
    for (const condition of [0, 39, 40, 59, 60, 100]) {
      for (const injured of [false, true]) {
        results.add(idleEmotion(injured, condition))
        for (const won of [false, true]) {
          for (const lostFinal of [false, true]) {
            for (const tier of [undefined, ...TIERS]) {
              for (const resultWeek of [10, 9]) {
                for (const lastTitle of [null, ...TIERS.flatMap((t) => [8, 9, 10].map((w) => ({ tier: t, week: w })))]) {
                  results.add(
                    avatarEmotion({
                      week: 10,
                      condition,
                      injured,
                      lastResult: { week: resultWeek, won, lostFinal, tier },
                      lastTitle,
                    }),
                  )
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

  it('is not preloaded while it cannot happen – bytes follow reachability', async () => {
    const { KID_EMOTIONS } = await import('../src/art/preload')
    expect(KID_EMOTIONS).not.toContain('angry')
    expect([...KID_EMOTIONS].sort()).toEqual(['happy', 'injury', 'norm', 'sad', 'serious', 'tired'])
  })
})

// The owner's 27.07 call, pinned: FIVE portrait bands, `angry` a real emotion, and no band
// wearing another band's face.
//
//   jun <11 · young 11-16 · teen 17-22 · adult 23-30 · lateCareer 31+ (files: milf-*, see the alias)
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
//
// ⚠ RE-AIMED by ui/art-rehab-sleepy (owner, 29.07: rehab is the layoff STATE, injury is the
// MOMENT). What moved: there are now TWO emotion sets, not one.
//
//   CROPPABLE (7)  norm happy sad serious tired injury angry   – have a 256px crop AND a painting
//   PAINTED   (8)  ...those, plus REHAB                        – have a painting
//
// So the crops loop below still runs over the seven, and the paintings loop runs over the eight.
// That is NOT the matrix pin being weakened – it is the same pin over the real matrix, and it got
// STRICTER in the direction that matters: a new test asserts that `rehab` has NO crop on disk and
// that no url builder can ask for one.
//
// WHY REHAB IS PAINTING-ONLY, so the next reader does not "fix" this by cutting five crops:
// NOTHING IN THE APP RENDERS AN EMOTION CROP. The app header is age-only `norm` (F45-1), Home's
// corner crop is the same age-only `norm`, and `useKidEmotion().cropUrl` – the one emotional crop
// seam that exists – has zero consumers in src/components/. Five crops would be five files in
// every user's download that no code path can request. If a future card DOES want an emotional
// crop, cut them then and move `rehab` into CROPPABLE_EMOTIONS; until then the types say so
// (`avatarCropPath` will not accept the face) and these tests say why.
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import {
  CROPPABLE_EMOTIONS,
  PORTRAIT_EMOTIONS,
  avatarCropPath,
  avatarEmotion,
  hasCrop,
  idleEmotion,
  portraitStage,
  type AvatarEmotion,
  type PortraitEmotion,
  type PortraitStage,
} from '../src/shared/avatarEmotion'
import { cropUrl, portraitUrl } from '../src/art/preload'
// ⚠ R2-18: the band's TYPE name and its FILE stem are two different strings now - see the alias.
import { portraitAssetStem } from '../src/shared/avatarEmotion'
import { PAINTING_ONLY_FACES } from '../src/art/faceRects'
import type { TierId } from '../src/engine/season/types'

const STAGES: PortraitStage[] = ['jun', 'young', 'teen', 'adult', 'lateCareer']
/** the seven faces a 256px crop is cut for – what `avatarCropPath` is total over */
const EMOTIONS: AvatarEmotion[] = [...CROPPABLE_EMOTIONS]
/** the eight faces a full painting exists for – what the portrait surfaces accept */
const PAINTED: PortraitEmotion[] = [...PORTRAIT_EMOTIONS]
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
      [31, 'lateCareer'], [45, 'lateCareer'],
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
    // ⚠ RE-AIMED BY R2-18, AND THE CLAIM IS UNCHANGED: every band resolves to its OWN file, so no
    // band borrows another's face. What moved is that the fifth band's TYPE NAME is no longer its
    // FILE NAME - the paintings were not renamed and must not be (see `portraitAssetStem`) - so the
    // expectation is built through the alias instead of by interpolating the stage.
    expect(avatarCropPath('adult', 'norm')).toBe('avatars/adult-norm.webp')
    expect(avatarCropPath('lateCareer', 'norm')).toBe('avatars/milf-norm.webp')
    for (const stage of STAGES) {
      for (const emotion of EMOTIONS) {
        expect(avatarCropPath(stage, emotion)).toBe(`avatars/${portraitAssetStem(stage)}-${emotion}.webp`)
      }
    }
    // ...and the alias is a BIJECTION over the bands: two stages sharing a stem would put one
    // band's face on another, which is the very thing this test is named for.
    expect(new Set(STAGES.map(portraitAssetStem)).size, 'two bands share a stem').toBe(STAGES.length)
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

  it('every stage x PAINTED emotion has a full painting – the wider set, rehab included', () => {
    for (const stage of STAGES) {
      for (const emotion of PAINTED) {
        // ⚠ R2-18: the FILE stem, not the band's type name - the 31+ band was renamed and its
        // paintings deliberately were not. This is the check that would have caught a stem built by
        // hand anywhere else, and on the first run of the rename it did exactly that.
        const rel = `images/fem-euro-brunnet/fem-euro-brunnet-${portraitAssetStem(stage)}-${emotion}.webp`
        expect(existsSync(asset(rel)), `missing painting ${stage}-${emotion}`).toBe(true)
      }
    }
  })

  it('the url builders agree with the files – the 31+ band, angry and rehab included', () => {
    const strip = (u: string) => u.slice(import.meta.env.BASE_URL.length)
    for (const stage of STAGES) {
      for (const emotion of EMOTIONS) {
        expect(existsSync(asset(strip(cropUrl(stage, emotion)))), `cropUrl ${stage}-${emotion}`).toBe(true)
      }
      for (const emotion of PAINTED) {
        expect(existsSync(asset(strip(portraitUrl(stage, emotion)))), `portraitUrl ${stage}-${emotion}`).toBe(true)
      }
    }
  })

  // ⚠ THE OTHER HALF OF THE MATRIX PIN, added by ui/art-rehab-sleepy. "Every painting has a crop"
  // stopped being true, so the fact has to be stated the other way round or the loop above quietly
  // becomes the only record of it. These three assertions are what make "painting-only" a property
  // of the code rather than a comment.
  it('rehab is PAINTING-ONLY: no crop on disk, and no builder can ask for one', () => {
    // 1. the files really are absent – the loop above must not be silently satisfiable by cutting
    //    five crops nobody renders (see the note at the top of this file for why they are not cut)
    for (const stage of STAGES) {
      const stem = portraitAssetStem(stage)
      expect(existsSync(asset(`avatars/${stem}-rehab.webp`)), `${stem}-rehab crop should NOT exist`).toBe(false)
    }
    // 2. the two unions differ by exactly `rehab`, and the narrowing guard agrees with both
    expect(PAINTED.filter((e) => !(EMOTIONS as PortraitEmotion[]).includes(e))).toEqual(['rehab'])
    expect(hasCrop('rehab')).toBe(false)
    for (const e of EMOTIONS) expect(hasCrop(e), `${e} should be croppable`).toBe(true)
    // 3. the ART side's own spelling of the same fact (faceRects, which the cutter script reads)
    //    cannot drift from the type union – add a painting-only face to one and this fails.
    expect(PAINTING_ONLY_FACES).toEqual(['rehab'])
  })
})

describe('`angry` is reachable only through its trigger', () => {
  it('is a member of the union the surfaces accept', () => {
    // Compile-time is the real assertion; this keeps it honest at runtime too.
    expect(avatarCropPath('lateCareer', 'angry')).toBe('avatars/milf-angry.webp')
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
    const results = new Set<PortraitEmotion>()
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
    // ⚠ 'injury' -> 'rehab' (ui/art-rehab-sleepy). The set is the same SIZE and the property is
    // identical – an ordinary loss, at any tier, in any state, still resolves to one of the six
    // faces it always did and anger cannot leak in. What changed is only which face the INJURED
    // arm of the idle ladder returns: the layoff wears the rehab painting for its whole length, and
    // `injury` became a moment-only face that this function no longer returns at all (the popup and
    // the Memory card are its two surfaces). Note that is now ASSERTED below, not just implied.
    expect([...results].sort()).toEqual(['happy', 'norm', 'rehab', 'sad', 'serious', 'tired'])
    expect(results.has('injury'), 'the emotion ladder must never return the MOMENT face').toBe(false)
    expect(results.has('angry')).toBe(false)
  })

  it('IS preloaded now that it can happen – bytes follow reachability', async () => {
    // The rule never changed, only the answer: warm every face a SURFACE can request, and only
    // those. `angry` was excluded while it was unreachable and joins the set with its trigger.
    // ⚠ RE-AIMED (ui/art-rehab-sleepy): one list became two, because the painting set and the crop
    // set stopped being equal. Both halves of the rule are pinned:
    //   - `rehab` is warmed as a painting and NOT as a crop (there is no rehab crop);
    //   - `injury` stays in BOTH even though the ladder no longer returns it – reachability is the
    //     test, and the injury popup + the Memory card can still request it.
    const { KID_PAINTING_EMOTIONS, KID_CROP_EMOTIONS } = await import('../src/art/preload')
    expect(KID_PAINTING_EMOTIONS).toContain('angry')
    expect([...KID_PAINTING_EMOTIONS].sort()).toEqual([
      'angry', 'happy', 'injury', 'norm', 'rehab', 'sad', 'serious', 'tired',
    ])
    expect([...KID_CROP_EMOTIONS].sort()).toEqual([
      'angry', 'happy', 'injury', 'norm', 'sad', 'serious', 'tired',
    ])
    expect(KID_CROP_EMOTIONS).not.toContain('rehab')
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
//
// ⚠ IT IS KEYED ON PAINTINGS, NOT ON CROPS (ui/art-rehab-sleepy). The table has a second consumer –
// the Home hero shows the full painting landscape-cropped and steers `object-position` off the same
// face centre – so it needs an entry for every PAINTED face, `rehab` included. Without one, a
// rehab week frames at 50/50, which on a cover window is her knee. The sweep below therefore runs
// over PAINTED, and the cutter is what decides which of those become files (croppableStems).
// ---------------------------------------------------------------------------
describe('the avatar crop table covers every face the code can request', () => {
  it('has a rectangle for every stage x PAINTED emotion – the Home hero frames by this', async () => {
    const { CROPS } = await import('../scripts/cut-avatar-crops.mjs')
    const missing: string[] = []
    for (const stage of STAGES) {
      for (const emotion of PAINTED) {
        // R2-18: `CROPS` is the ART side's table and is keyed on the painting's stem.
        const key = `${portraitAssetStem(stage)}-${emotion}`
        if (!(key in CROPS)) missing.push(key)
      }
    }
    expect(missing, 'stage x emotion pairs with no face rectangle').toEqual([])
  })

  it('...but the CUTTER skips the painting-only faces – a centre is not a crop', async () => {
    const { croppableStems, CROPS } = await import('../scripts/cut-avatar-crops.mjs')
    const stems: string[] = croppableStems()
    expect(stems.length).toBe(STAGES.length * EMOTIONS.length)
    expect(stems.filter((s: string) => s.endsWith('-rehab')), 'the cutter must not cut rehab').toEqual([])
    // and every stem it DOES cut is one the code can build a crop url for
    for (const stem of stems) expect(stem in CROPS).toBe(true)
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

// ---------------------------------------------------------------------------
// THE PRE-MATCH SCENE SHOWS THE WHOLE PAINTING (round 15, owner 01.08).
//
// «ничего не надо нормировать, просто изображение в полную высоту и всё, какое есть - такое и ок».
// MatchScene used to be a fixed-height cover crop steered by the face table, and the paintings
// frame her head at different sizes (teen-serious 182 of 512 against young-serious 124), so the
// close-up jumped from band to band. A scale-normalisation pass was designed and REJECTED - the
// ruling is that the scene simply shows the painting, whole. These pins are what keep a future
// "improvement" from quietly reintroducing the crop.
// ---------------------------------------------------------------------------
describe('MatchScene renders the painting uncropped', () => {
  const scene = read('../src/components/MatchScene.vue')
  /** Comments are not code – the house helper (tests/calendar-grid.test.ts and friends). The
   *  scene's own header NAMES the crop it stopped doing, which is the convention, and a raw
   *  `not.toContain` would fail on the note that explains the rule it enforces. */
  const code = scene
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*\/\/.*$/gm, '')

  it('⚠ RE-AIMED (03.08): the SQUARE card is still whole-painting; only the FILLED one magnifies', () => {
    // THE RULE CHANGED BY THE OWNER, AND ONLY FOR THE SCREEN HE CHANGED IT FOR. 03.08: «я бы хотел,
    // чтобы картинка вела себя как на макете F. Match Day, т.е. занимала всё возможное
    // пространство, надо вернуть увеличение для этого». So `cover` is no longer banned outright -
    // it is REQUIRED on `.scene--fill` and still forbidden everywhere else in this component.
    //
    // WHAT THE 01.08 RULING ACTUALLY REJECTED, and what this guard still protects: NORMALISATION -
    // a per-painting scale steered by the face table so every band framed her head at one size,
    // over a fixed 396px window that turned teen-serious into a tight close-up. The magnification
    // shipped here is ONE geometry for every painting, no face table, no per-band number. The
    // face-table bans in the next test are what keep the rejected thing rejected.
    // Sliced on the COMMENT-STRIPPED source: the prose above each rule names the other rule, so
    // slicing the raw file finds a sentence rather than a selector.
    const fillBlock = code.slice(code.indexOf('.scene--fill .scene-art'))
    expect(fillBlock, 'the fill card must magnify - the owner asked for it twice').toContain('object-fit: cover')
    // ...and the default card - the friendly's, and any future caller that does not pass `fill` -
    // still shows the whole painting in its own square. This is the half of 01.08 that stands.
    const squareBlock = code.slice(code.indexOf('.scene-art {'), code.indexOf('.scene--fill .scene-art'))
    expect(squareBlock).toContain('object-fit: contain')
    expect(squareBlock).not.toContain('object-fit: cover')
    expect(scene).toContain('aspect-ratio: 1 / 1')
    // ...and the fixed-height prop went with the OLD crop and is not coming back: a per-caller
    // height is how the 396px window happened, and `fill` is a boolean precisely so no number can.
    expect(code).not.toContain('height?: number')
  })

  it('⚠ it no longer reads the face table – there is nothing to steer when everything is in frame', () => {
    expect(code).not.toContain('facePoint')
    expect(code).not.toContain('faceRects')
    // ⚠ RE-AIMED TWICE, NEVER WEAKENED (02.08 then 03.08). It began as a bare
    // `not.toContain('object-position')`, which was right while the scene could not crop at all.
    // Now the filled card DOES magnify (see above), so an anchor is load-bearing rather than
    // decorative: `center top` spends the crop at the foot, under the glass plate, and keeps her
    // head complete on every box shape. THE REGRESSION THIS GUARD EXISTS FOR IS UNCHANGED and is
    // the line below it: a face-table pan - a percentage pair, a facePoint binding - is how the
    // per-band close-up came back last time, and it still fails here. One keyword anchor, no
    // numbers, no face table.
    expect(code.match(/object-position/g) ?? []).toHaveLength(1)
    expect(scene).toContain('object-position: center top')
    expect(code).not.toMatch(/object-position:\s*[\d.]+%/)
    // The OTHER face-table consumers are deliberately untouched: the Home hero and the finale
    // poster frame small windows, so a crop is their whole mechanism. The finale's crop is pinned
    // here so "remove it from MatchScene" can never creep into "remove it everywhere".
    expect(read('../src/components/TournamentFlow.vue')).toContain('facePoint')
    expect(read('../src/components/screens/HomeScreen.vue')).toContain('facePoint')
  })
})

// =================================================================================================
// WAVE 3, T14 – THE GRADUATED PORTRAIT: THE DECISION, AND THE ART IT RESTS ON
// =================================================================================================
//
// `docs/plans/life-wave-3-builder-2026-09.md` §2 T14. The owner, 11.09, on a painting that shipped
// with the art set and that no code had ever asked for: «graduated – вот это хорошо, что ты нашёл,
// мы забыли эту картинку, надо встроить на окончание колледжа где-то, может быть в попапе и даже на
// главной показывать неделю по окончании (если случилось окончание)».
//
// ⚠ WHAT IS HERE AND WHAT IS NEXT DOOR. This file is the PURE half – the decision (who wears it and
// for how long) and the facts about the art the decision is built on. The two SURFACES are mounted
// in tests/component/wave3-graduated-portrait.test.ts: a picture that a unit test says is chosen is
// not a picture on screen.
//
// ⚠ NO STRING IS ASSERTED HERE, because the step raises none (CLAUDE.md invariant 4): T14 is a
// picture, the dialog's existing copy is byte-identical, and the image is decorative (`alt=""`).
//
// =================================================================================================
// ⚠⚠ THE ARM LEDGER – every net below was watched fail, and what it said is written here
// =================================================================================================
//
//   ARM 1  the honesty guard deleted – `finishedTheCourse` returns `totalYears > 0`, i.e. true for
//          everybody who ever enrolled
//          2 RED here · §B «⚠⚠ the leaver never wears it, in any week of her career: 0 of 4 years,
//          week 500: expected true to be false» and the table case «expected true to be false».
//          ⚠ AND 3 RED NEXT DOOR, which is the point of sharing the predicate: the popup's leaver
//          arm and BOTH portrait surfaces went red on the same mutation.
//
//   ARM 2  the window ignored – `wearsGraduationPortrait` drops the `since` test and returns true
//          from `doneWeek` onwards
//          2 RED · §B «⭐ the week after is an ordinary week again – and it never comes back:
//          expected true to be false» and «⚠ no week BEFORE the finish wears it: week 480: expected
//          true to be false». 2 RED next door as well (the hero one week later, and +30).
//
//   ARM 3  the window opened a week early – `since >= -1`
//          1 RED · §B «⚠ no week BEFORE the finish wears it: week 499: expected true to be false»
//
//   ARM 4  `graduatedUrl` band-scoped – `${NAME}-${portraitAssetStem('teen')}-graduated.webp`,
//          i.e. the shape a `PortraitEmotion` member would have produced on a 22-year-old
//          1 RED · §A «the url the app builds names a file that is on disk: expected false to be
//          true» – the 404 the union member would have shipped, caught by the existence check
//
//   ARM 5  `'graduated'` removed from `PAINTING_ONLY_FACES` – the cutter's skip list
//          3 RED · §A «⚠ PAINTING-ONLY…: expected [ 'rehab' ] to include 'graduated'», and BOTH
//          halves of the re-aimed pin in tests/portrait-bands.test.ts – «expected [ 'rehab' ] to
//          deeply equal [ 'graduated', 'rehab' ]» and «...but the CUTTER skips the painting-only
//          faces – a centre is not a crop: expected 36 to be 35»
//
//   ARM 6  the face centre removed from `CROPS` (so `facePoint` falls back to 50/50)
//          1 RED · §A «the 50/50 fallback means there is no rectangle for this painting: expected
//          { x: 50, y: 50 } to not deeply equal { x: 50, y: 50 }»
//          ⚠ AND THE COMPONENT FILE STAYED GREEN ON IT – 10 passed – which is a finding rather than
//          a failed arm. Both surfaces there assert «the style carries what `facePoint` answers»,
//          so a table with no entry moves the surfaces and the expectation together. THIS case is
//          the one that owns «the table has an answer at all»; the mounted pair own «the surface
//          uses it», and ARM 4 next door is what catches a surface reading the wrong stem.
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import {
  CROPPABLE_EMOTIONS,
  GRADUATION_PORTRAIT_WEEKS,
  PORTRAIT_EMOTIONS,
  finishedTheCourse,
  portraitAssetStem,
  wearsGraduationPortrait,
  type PortraitStage,
} from '../src/shared/avatarEmotion'
import { GRADUATED_ART_STEM, graduatedUrl } from '../src/art/preload'
import { PAINTING_ONLY_FACES, croppableStems, facePoint } from '../src/art/faceRects'
import { ENDINGS } from '../src/engine/ending'

const STAGES: PortraitStage[] = ['jun', 'young', 'teen', 'adult', 'lateCareer']
const asset = (rel: string) => new URL(`../public/${rel}`, import.meta.url)
const strip = (url: string) => url.slice(import.meta.env.BASE_URL.length)

// =================================================================================================
// A. THE ART, AND THE ONE MEASUREMENT THE WHOLE SHAPE OF T14 RESTS ON
// =================================================================================================
describe('T14 §A – the graduation painting is one file, not a band set', () => {
  it('⚠⚠ exists in `adult` AND IN NO OTHER BAND – the fact the design is built on', () => {
    // The brief proposed copying `rehab`: a painting-only member of `PortraitEmotion`. `rehab` ships
    // FIVE paintings; this ships one. A union member would make `portraitUrl(stage, 'graduated')`
    // able to name four files that do not exist – and a career graduates at about twenty-two, i.e.
    // in the `teen` band, so the missing ones are the ones it would ask for. Measured, not assumed.
    expect(
      existsSync(asset('images/fem-euro-brunnet/fem-euro-brunnet-adult-graduated.webp')),
      'the owner\'s found asset',
    ).toBe(true)
    const elsewhere = STAGES.filter((s) => s !== 'adult').filter((s) =>
      existsSync(asset(`images/fem-euro-brunnet/fem-euro-brunnet-${portraitAssetStem(s)}-graduated.webp`)),
    )
    expect(elsewhere, 'bands that DO have a graduation painting – if this ever stops being empty, the union member becomes possible').toEqual([])
  })

  it('the url the app builds names a file that is on disk', () => {
    expect(graduatedUrl().endsWith('fem-euro-brunnet-adult-graduated.webp')).toBe(true)
    expect(existsSync(asset(strip(graduatedUrl())))).toBe(true)
  })

  it('⚠ it is NOT in the band matrix – so `portraitUrl` stays total over what it accepts', () => {
    // The property `shared/avatarEmotion.ts` protects in as many words: every string the painting
    // builder can return names a file that exists. These two lists are what keep it true.
    expect(PORTRAIT_EMOTIONS as readonly string[]).not.toContain('graduated')
    expect(CROPPABLE_EMOTIONS as readonly string[]).not.toContain('graduated')
  })

  it('⚠ PAINTING-ONLY, in the sense the CUTTER cares about: no crop, and none can be asked for', () => {
    // 1. the file really is absent, in every band – the pin above must not be satisfiable by cutting
    for (const stage of STAGES) {
      expect(
        existsSync(asset(`avatars/${portraitAssetStem(stage)}-graduated.webp`)),
        `${stage}-graduated crop should NOT exist`,
      ).toBe(false)
    }
    // 2. ...and the cutter is told so, which is the only reason it stays absent after `npm run art`
    expect(PAINTING_ONLY_FACES).toContain('graduated')
    expect(
      croppableStems().filter((s) => s.endsWith('-graduated')),
      'the cutter must not be asked to cut a crop that has no painting-only skip',
    ).toEqual([])
  })

  it('the graduation painting is framed by the ONE face table, not by the fallback', () => {
    // `facePoint` is total – an unknown stem centres the frame at 50/50, which on a landscape cover
    // window is her waist rather than her face. Two surfaces crop this painting landscape (the
    // popup's strip and Home's hero on a tablet), so the entry has to be real.
    const p = facePoint(GRADUATED_ART_STEM)
    expect(p, 'the 50/50 fallback means there is no rectangle for this painting').not.toEqual({ x: 50, y: 50 })
    // her head spans y~62-172 of the 512px painting – the centre is well above the middle
    expect(p.y).toBeLessThan(40)
    expect(p.x).toBeGreaterThan(35)
    expect(p.x).toBeLessThan(65)
  })
})

// =================================================================================================
// B. WHO WEARS IT – the honesty guard, which is the load-bearing half of the step
// =================================================================================================
//
// `engine/kidLife.ts` already carries the rule in words: THREE college states and not two, because
// `endCollegeEarly` is a real answer at every year boundary, and «a tile that knew only "she went"
// and "she graduated" would print the graduate's line for a girl who left after one year». The
// painting obeys the identical split.
describe('T14 §B – the graduate wears it, and the leaver never does', () => {
  const TOTAL = ENDINGS.collegeYears
  const grad = (week: number, doneWeek: number) =>
    wearsGraduationPortrait({ week, doneWeek, yearsDone: TOTAL, totalYears: TOTAL })

  it('⭐ the graduate wears it on the week she came out', () => {
    expect(grad(500, 500)).toBe(true)
  })

  it('⭐ the week after is an ordinary week again – and it never comes back', () => {
    expect(grad(501, 500)).toBe(false)
    // ⚠ THE SWEEP IS THE POINT. `doneWeek` never moves again, so a window written as «she has
    // graduated» rather than «this week» would put the painting on her face for the rest of her
    // career – twenty seasons of a woman holding up her exam results.
    for (let w = 501; w <= 552; w++) expect(grad(w, 500), `week ${w}`).toBe(false)
  })

  it('⚠ no week BEFORE the finish wears it', () => {
    for (let w = 480; w < 500; w++) expect(grad(w, 500), `week ${w}`).toBe(false)
  })

  it('⚠⚠ the leaver never wears it, in any week of her career', () => {
    // The two real shapes: «Back on tour now» taken after one year, and after three. Both are
    // `endCollegeEarly`, both set `doneWeek`, and neither is a degree.
    for (const yearsDone of [0, 1, TOTAL - 1]) {
      for (let w = 500; w <= 560; w++) {
        expect(
          wearsGraduationPortrait({ week: w, doneWeek: 500, yearsDone, totalYears: TOTAL }),
          `${yearsDone} of ${TOTAL} years, week ${w}`,
        ).toBe(false)
      }
    }
  })

  it('a career that never went to college has nothing to wear', () => {
    expect(wearsGraduationPortrait({ week: 300, doneWeek: null, yearsDone: 0, totalYears: TOTAL })).toBe(false)
    // ...and neither has one still inside the freeze: `doneWeek` is null until she comes out.
    expect(wearsGraduationPortrait({ week: 300, doneWeek: null, yearsDone: 2, totalYears: TOTAL })).toBe(false)
  })

  it('the window is ONE week, and the constant says so', () => {
    expect(GRADUATION_PORTRAIT_WEEKS).toBe(1)
  })

  it('`finishedTheCourse` is the split, as a table', () => {
    expect(finishedTheCourse(4, 4)).toBe(true)
    expect(finishedTheCourse(5, 4), 'a fifth row could only be a bug, and it is still a degree').toBe(true)
    expect(finishedTheCourse(3, 4)).toBe(false)
    expect(finishedTheCourse(1, 4)).toBe(false)
    expect(finishedTheCourse(0, 4)).toBe(false)
    // ⚠ a course that does not exist is not a course finished – `0 >= 0` would otherwise graduate
    // every career in the game.
    expect(finishedTheCourse(0, 0), 'a course that does not exist is not a course finished').toBe(false)
  })
})

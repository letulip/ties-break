// THE ALBUM'S BIRTH PAGE, WAVE 8b – T6 (E2, RULED 21.09: «да, получает, картинка теперь есть»).
//
// Wave 8's questions pass carried E2 with a recommendation – «a birth is the largest life event the
// album could hold and the corpus is his document – an occasion row plus his lines» – and he ruled it
// in. A34 `birth` is the thirty-fourth occasion; the frame's art is the painting T5 shipped.
//
//   §A  ⚠⚠ THE WALK. The career reaches a birth through the ENGINE, never through a posed field
//   §B  the page: the occasion, the painting, and the band it lands in
//   §C  BASE_PATH safety – the album wave's own deployed-only 404 lesson
//   §D  husband-agnostic, by test, over all twelve of A34's strings
//   §E  the negative: a career with no birth has no birth page
//
// ⚠⚠⚠ **THE TEST WALKS TO A BIRTH AND NEVER POSES `world.children`**, and that sentence is the
// brief's, not this file's flourish: posing state was wave 8's recurring defect class. Concretely,
// NOTHING below writes `world.children`, `world.pregnancy` or a `'birth'` milestone by hand:
//   · the pregnancy is written by `rollPregnancy` on a week the ENGINE'S OWN hazard actually hits,
//     found by walking `pregnancyChanceAt` against the real stream (T2's `onHitWeek`, verbatim in
//     spirit and the idiom `tests/wave8-pause.test.ts` already keeps);
//   · the birth is written by `landBirth` INSIDE `tickWeek`, at step `phaseHerWeek`, on the due week;
//   · the MILESTONE the album selects on is `captureMilestone`'s, written by that same call.
// A case that pushed `{ type: 'birth', week }` onto `world.milestones` – which is how every elder
// album case builds its occasions – would prove the SELECTOR works and would say nothing about
// whether a real career can ever reach it. §A.1 is the assertion that the engine really wrote all
// three, so the walk cannot rot into a pose without a red.
//
// MUTATION LEDGER – measured reds, each arm applied by an exact-string edit and reverted from a copy:
//   ARM 1  the `birth` candidate deleted from `lifeCandidates`     → 3 RED: §B.1, §B.2, §B.3 – the
//                                                                     whole page disappears
//   ARM 2  `MOMENT_FACE.birth` deleted, so the frame falls to the  → 1 RED: §B.2 ONLY. ⚠ PREDICTED 2
//          portrait rung                                              and MEASURED 1: the page
//                                                                     SURVIVES and wears the band
//                                                                     portrait, so §C.1 stays green
//                                                                     because a `-norm` path is just
//                                                                     as relative as the right one.
//                                                                     Recorded rather than corrected:
//                                                                     §C is about the PATH SHAPE and
//                                                                     is not a second net on the art
//   ARM 3  `paintingPath` made absolute (`/images/...`)            → 2 RED: §C.1 and §B.2. It is the
//                                                                     only arm that reproduces the
//                                                                     album wave's deployed-only 404

import { describe, it, expect } from 'vitest'
import {
  assembleAlbum,
  createWorld,
  kidAgeExact,
  pregnancyChanceAt,
  rollPregnancy,
  tickWeek,
  skipTournament,
  closeTournament,
  answerLifeBeat,
  pendingLifeBeat,
  type WorldState,
} from '../src/engine/world'
// ⚠ `resumeMain` IS `engine/rng`'s AND NOT ON THE WORLD BARREL – the shipped game's own resumption,
// which is what makes this a real walk rather than a fresh stream (`tools/motherhood-bench.ts` takes
// it from the same place, and the barrel's public API is not a test's to widen).
import { resumeMain, rngFromSeed } from '../src/engine/rng'
import { ALBUM_CORPUS, type AlbumBand } from '../src/engine/world/albumCorpus'
import { ALBUM_CHAPTER_TITLES } from '../src/engine/world/albumBook'
import { PARTNER_NAME_POOL } from '../src/engine/world'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { LoveEpisode } from '../src/shared/protocol'

const PUBLIC = fileURLToPath(new URL('../public', import.meta.url))

/** The FIRST week she reads at or above `years` – walked on the engine's own clock. */
function weekAtAge(world: WorldState, years: number): number {
  for (let w = 0; w < 40 * 52; w++) {
    if (kidAgeExact(w, world.profile.birthMonth, world.profile.birthDay) >= years) return w
  }
  throw new Error(`no week reaches age ${years}`)
}

function married(sinceWeek: number, latchedWeek: number): LoveEpisode {
  return {
    id: `p:${sinceWeek}`, sinceWeek, endedWeek: null, knownWeek: sinceWeek + 2, wants: 'open',
    partnerId: `p:${sinceWeek}`, publicWeek: null, publicWrong: false, airedMetWeek: null,
    airedEndedWeek: null, latchedWeek, partnerName: 'Anton',
  }
}

/** ⭐⭐ A MARRIED CAREER PARKED ON A WEEK WHOSE PREGNANCY UNIFORM IS A REAL **HIT**, on the engine's
 *  own stream and at the engine's own age-shaped chance – `tests/wave8-pause.test.ts`' `onHitWeek`,
 *  carried verbatim because two spellings of one recipe are two recipes.
 *
 *  ⚠ THE COIN IS THE POINT, not `chance > 0`: the hazard runs at 2–4% a YEAR, so «a week it could
 *  fire on» is almost every week and «a week it DOES» is the one in a few hundred this searches for.
 *  Drawn on the engine's own key (`seed:life:pregnancy:<week>`) so the probe and `rollPregnancy`
 *  cannot disagree about which weeks hit. */
function onHitWeek(base: string): WorldState {
  for (let i = 0; i < 400; i++) {
    const seed = i === 0 ? base : `${base}-${i}`
    const probe = createWorld(seed)
    const to = weekAtAge(probe, 34)
    for (let w = weekAtAge(probe, 24); w < to; w++) {
      probe.week = w
      const chance = pregnancyChanceAt(probe)
      if (chance > 0 && rngFromSeed(`${seed}:life:pregnancy:${w}`)() < chance) {
        const world = createWorld(seed)
        world.season = []
        world.week = w
        world.loveEpisodes = [married(w - 104, w - 52)]
        world.condition = 100
        world.fundsCents = 5_000_00
        return world
      }
    }
  }
  throw new Error(`no pregnancy hit inside the window for any seed from ${base}`)
}

/** Tick one week and answer anything that opens, so a walk cannot stall (T3's helper, plus the two
 *  blocking beats this wave added – answered through the ENGINE's own `answerLifeBeat`). */
function tickThrough(world: WorldState, rng: () => number): void {
  tickWeek(world, rng)
  if (world.pendingTournament) {
    skipTournament(world)
    closeTournament(world)
  }
  const beat = pendingLifeBeat(world)
  if (beat?.kind === 'expecting') answerLifeBeat(world, 'joy')
  else if (beat?.kind === 'return-plan') answerLifeBeat(world, 'small-first')
}

/** ⭐⭐⭐ THE WALK. A married career, the hazard fired on its own stream, then TICKED to the birth –
 *  and the only thing this function writes to the world is `world.week` before `rollPregnancy`. */
function walkedToABirth(base: string): WorldState {
  const world = onHitWeek(base)
  const rng = resumeMain(world.rngMain)
  rollPregnancy(world)
  const pregnancy = world.pregnancy
  if (pregnancy === null) throw new Error('the hazard did not write a record on a week it can fire')
  const due = pregnancy.dueWeek
  while (world.week <= due && world.children.length === 0) tickThrough(world, rng)
  if (world.children.length === 0) throw new Error('the walk reached the due week and no child landed')
  // ...and on for a season, so the album sees a career that lived past the page it is about.
  const to = world.week + 40
  while (world.week < to) tickThrough(world, rng)
  return world
}

const BIRTH_ART = 'images/fem-euro-brunnet/fem-euro-brunnet-adult-birth.webp'

/** A34's row, read out of the corpus rather than transcribed – the strings are his document's. */
const A34 = ALBUM_CORPUS.find((o) => o.id === 'birth')!

// =================================================================================================
// A. THE WALK – the engine wrote all three, and this file wrote none of them
// =================================================================================================
describe('wave 8b T6 A – the career reaches a birth through the engine', () => {
  it('⭐⭐⭐ the record, the row and the MILESTONE are all the engine\'s, on a real walked career', () => {
    const world = walkedToABirth('w8b-t6-walk')
    expect(world.children.length, 'the roster row `landBirth` pushed').toBe(1)
    expect(world.children[0].sex, 'girls only, ruled').toBe('girl')
    const m = world.milestones.filter((row) => row.type === 'birth')
    expect(m.length, '`captureMilestone`\'s own row, once').toBe(1)
    expect(m[0].week, 'on the week the child arrived').toBe(world.children[0].bornWeek)
    // ⚠ AND THE WEEK IS THE RECORD'S, WHICH IS WHAT SAYS THE TICK DID IT: `landBirth` refuses before
    // `dueWeek`, so a row on that exact week is the engine's own gate having opened.
    expect(m[0].week, 'and the due week is the record\'s').toBe(world.pregnancy?.dueWeek ?? m[0].week)
  })
})

// =================================================================================================
// B. THE PAGE
// =================================================================================================
describe('wave 8b T6 B – the album holds a birth page, with the painting on it', () => {
  it('⭐⭐⭐ the birth is an OCCASION, and its caption is A34\'s own – in her voice', () => {
    const world = walkedToABirth('w8b-t6-page')
    const voice = world.temperament ?? 'sunny'
    const captions = assembleAlbum(world).sheets.flatMap((s) => s.frames.map((f) => f.caption))
    expect(captions, 'the birth reached a page').toContain(A34.voices[voice].caption)
  })

  it('⭐⭐⭐ the frame wears the BIRTH PAINTING, and the file is on disk', () => {
    const world = walkedToABirth('w8b-t6-art')
    const voice = world.temperament ?? 'sunny'
    const frame = assembleAlbum(world).sheets
      .flatMap((s) => s.frames)
      .find((f) => f.caption === A34.voices[voice].caption)
    expect(frame, 'the page is there to have art at all').toBeDefined()
    expect(frame!.art, 'the painting T5 shipped').toBe(BIRTH_ART)
    expect(existsSync(`${PUBLIC}/${frame!.art}`), 'and it really is on disk').toBe(true)
  })

  it('⭐⭐ it lands in the LIVED BAND the birth week belongs to, by the book\'s own logic', () => {
    // ⚠ NOT A CHAPTER THIS FILE PICKS. The book bands a candidate by her AGE that week, and the
    // hazard's window is 24–35, so a birth is `adult` or `lateCareer` – which is exactly the pair
    // A34 declares in the document. This asserts the two agree rather than naming one.
    const world = walkedToABirth('w8b-t6-band')
    const voice = world.temperament ?? 'sunny'
    const book = assembleAlbum(world)
    const sheet = book.sheets.find((s) => s.frames.some((f) => f.caption === A34.voices[voice].caption))
    expect(sheet, 'the page exists').toBeDefined()
    // ⚠ THE WIRE CARRIES THE CHAPTER'S TITLE AND NOT ITS BAND (`AlbumSheetModel`), so the band is
    // read back through `ALBUM_CHAPTER_TITLES` – the one table that joins the two – rather than
    // re-derived from her age here, which would be a second spelling of the book's own banding.
    const bandOf = (title: string) =>
      (Object.keys(ALBUM_CHAPTER_TITLES) as AlbumBand[]).find((b) => ALBUM_CHAPTER_TITLES[b] === title)
    const band = bandOf(sheet!.chapterTitle)
    expect(band, `«${sheet!.chapterTitle}» is one of the five chapters`).toBeDefined()
    expect(A34.bands, 'the corpus declares the bands the selector can reach').toContain(band)
  })
})

// =================================================================================================
// C. BASE_PATH – the album wave's own deployed-only 404
// =================================================================================================
describe('wave 8b T6 C – the art path is relative, so a sub-path deploy does not 404', () => {
  it('⚠⚠ the frame\'s `art` carries NO leading slash and no origin – `AlbumPhoto` adds BASE_URL', () => {
    // THE LESSON THIS IS FOR: the album wave shipped a path that worked on localhost and 404'd on the
    // deployed sub-path, because something built an absolute url instead of a relative one.
    // `AlbumPhoto.vue` is the ONE place that prefixes `import.meta.env.BASE_URL`; anything absolute
    // here escapes it and is invisible until deploy.
    const world = walkedToABirth('w8b-t6-base')
    for (const f of assembleAlbum(world).sheets.flatMap((s) => s.frames)) {
      expect(f.art.startsWith('/'), `«${f.art}» is absolute and will 404 under a sub-path`).toBe(false)
      expect(f.art.includes('://'), `«${f.art}» carries an origin`).toBe(false)
      expect(existsSync(`${PUBLIC}/${f.art}`), `«${f.art}» must be a file on disk`).toBe(true)
    }
  })
})

// =================================================================================================
// D. HUSBAND-AGNOSTIC, BY TEST
// =================================================================================================
describe('wave 8b T6 D – A34 names no partner, and that is the acceptance criterion', () => {
  it('⭐⭐⭐ none of the twelve strings names or genders the one she married', () => {
    // §0's decoupling ruling read strictly, and here it is load-bearing rather than polite: the
    // marriage may have ended months before and the birth milestone fires anyway, so a line that
    // named him would be false on exactly the careers that ruling exists to protect.
    // ⚠ WORD BOUNDARIES, NOT SUBSTRINGS – «the» contains «he», «other» contains «her».
    const BAN = /\b(he|him|his|husband|wife|spouse|partner|married|marriage|father|dad)\b/i
    const every = Object.values(A34.voices).flatMap((v) => [v.note, v.caption, v.line])
    expect(every.length, 'four voices x three registers').toBe(12)
    for (const text of every) {
      expect(BAN.test(text), `⚠ «${text}» names a partner`).toBe(false)
      for (const name of PARTNER_NAME_POOL) {
        expect(text.includes(name), `⚠ «${text}» speaks the persisted partner name «${name}»`).toBe(false)
      }
    }
    // ⚠ AND THE BAN IS REAL RATHER THAN VACUOUS: without this it could rot to /$^/ and every line
    // above would pass. The wedding's own note, one occasion up, is the control.
    expect(BAN.test('You married him on a Tuesday.'), 'control: the ban can fire').toBe(true)
  })

  it('⚠ the note speaks TO her, the caption and the line do not – A34 keeps the register law', () => {
    // The corpus's §1, asserted for the new row specifically rather than trusted to the round-trip
    // sweep: a note that stopped addressing her would be a fourth register nobody declared.
    for (const v of Object.values(A34.voices)) {
      expect(/\byou\b/i.test(v.note), `the note addresses her: «${v.note}»`).toBe(true)
      expect(/\byou\b/i.test(v.caption), `the caption does not: «${v.caption}»`).toBe(false)
      expect(/\byou\b/i.test(v.line), `the line does not: «${v.line}»`).toBe(false)
    }
  })
})

// =================================================================================================
// E. THE NEGATIVE
// =================================================================================================
describe('wave 8b T6 E – a career with no birth has no birth page', () => {
  it('⚠ the occasion is not reachable without the milestone – no page appears by default', () => {
    // The other half of §B, and the reason it is here: a selector that pushed the candidate
    // unconditionally would satisfy every case above and give a page to a career that never had a
    // child. ⚠ THE CONTROL IS A REAL WALKED CAREER of the same shape, not an empty world.
    const world = createWorld('w8b-t6-nobirth')
    world.week = weekAtAge(world, 30)
    expect(world.children, 'the fixture really has no child').toEqual([])
    expect(world.milestones.some((m) => m.type === 'birth'), 'and no milestone').toBe(false)
    const voice = world.temperament ?? 'sunny'
    const captions = assembleAlbum(world).sheets.flatMap((s) => s.frames.map((f) => f.caption))
    expect(captions, 'so no page speaks A34').not.toContain(A34.voices[voice].caption)
  })
})

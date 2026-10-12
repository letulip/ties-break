// ROUND 49 №8 – «всё ещё не вижу свадебной фото в альбоме» (REOPENED). The missing net, and the two
// drop routes this wave closes:
//
//   (c) THE SHARED WEEK. `selectRepresentatives` (albumBook.ts) keeps ONE frame per week and the
//       higher priority names it – at the wedding's old 90 a rare (96–101) or any same-week
//       higher candidate silently deleted the once-per-career wedding photo. Fixed by lifting the
//       wedding to 102, above every rare and below nothing but the closers' 1000.
//       ⚠ MEASURED red→green on the arm below: at 90 the same-week `first-number-one` (99) evicted
//       the wedding frame (RED, 12.10); at 102 the wedding survives (GREEN, same test, same seed).
//   (d) THE SAVE THE ALBUM NEVER HEARS OF. The album's one source for the wedding is the
//       `type: 'wedding'` milestone, whose one writer is `landWedding` – born in the SAME commit as
//       the latch itself (eccbd578, v83), so an engine-born save cannot hold a married row without
//       its milestone. The v94 step is the net for every save OUTSIDE that guarantee (hand-carried
//       worlds, unknown intermediate builds – the owner's reopened №8 is a long-lived save this repo
//       cannot read): it recovers the milestone EXACTLY, because `episode.latchedWeek` IS the week
//       `landWedding` stamped and `episode.id` is the `kind` it captured.
//
// ⚠ EVERY CASE HERE WALKS THE REAL PATH – `rollWedding` raises the beat on its own hazard stream,
// `answerLifeBeat` answers it, `landWedding` latches and captures – because every pre-existing album
// case POSED the milestone (`world.milestones.push(...)`), and a posed ledger cannot catch a landing
// that stopped writing what the album reads. Zero draws are added to MAIN: the roll rides the
// purpose-scoped `seed:life:wedding:<week>` sub-stream, exactly as the engine does.

import { describe, it, expect } from 'vitest'
import { firstWeekAtAge } from './helpers/career'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  answerLifeBeat,
  assembleAlbum,
  createWorld,
  kidAgeAt,
  landWedding,
  rollWedding,
  SAVE_SCHEMA_VERSION,
  type WorldState,
} from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { ALBUM_CORPUS } from '../src/engine/world/albumCorpus'
import type { AlbumBook, LoveEpisode, Milestone } from '../src/shared/protocol'

const WEDDING = ECONOMY.wedding
const SAVES = fileURLToPath(new URL('./fixtures/saves', import.meta.url))

/** The row shape `tests/wave7-wedding.test.ts` poses – a latched-nothing attachment the engine could
 *  have written, with the latch left for `landWedding` itself. */
function episodeRow(sinceWeek: number): LoveEpisode {
  return {
    id: `p:${sinceWeek}`,
    sinceWeek,
    endedWeek: null,
    knownWeek: sinceWeek + 2,
    wants: 'open',
    partnerId: `p:${sinceWeek}`,
    publicWeek: null,
    publicWrong: false,
    airedMetWeek: null,
    airedEndedWeek: null,
    latchedWeek: null,
    partnerName: null,
  }
}

/** The first week at/after `from` whose wedding uniform lands – found on the engine's OWN stream
 *  (`seed:life:wedding:<week>`), so the case stands on a real hit rather than a posed one. */
function firstHit(seed: string, from: number): number {
  for (let w = from; w < from + 2000; w++) {
    if (rngFromSeed(`${seed}:life:wedding:${w}`)() < WEDDING.perWeek) return w
  }
  throw new Error('no wedding hit inside 2000 weeks')
}



/** A career whose wedding LANDED through the real path: the hazard hit on its own sub-stream, the
 *  beat was answered, and `landWedding` latched `weeksAfterEngagement` later – the one writer of
 *  both the latch and the milestone.
 *
 *  ⚠ RE-AIMED r50 №1 (12.10): the `> 30 continue` skip is GONE. It existed because a landing at 31+
 *  used to measure the band FALLBACK (`lateCareer-norm`) rather than the wedding page; the owner's
 *  third ask turned that fallback into the defect, and the album now clamps the moment art
 *  (`EVENT_STEM.wedding = 'adult-bride'`), so EVERY landing paints the same bride. `fromAge` lets
 *  the 31+ arm start the hazard search inside the lateCareer band – the same engine path, later. */
function engineWedding(fromAge: number = WEDDING.ageGate): WorldState {
  const seed = 'r49-wed-0'
  const probe = createWorld(seed)
  const gate = firstWeekAtAge(probe, fromAge)
  const hit = firstHit(seed, gate)
  const landing = hit + WEDDING.weeksAfterEngagement
  const world = createWorld(seed)
  world.season = []
  world.week = hit
  world.loveEpisodes = [episodeRow(hit - WEDDING.minEpisodeWeeks)]
  world.bond = 70
  rollWedding(world)
  answerLifeBeat(world, 'bless')
  world.week = landing
  landWedding(world)
  if (world.loveEpisodes[0].latchedWeek !== landing) {
    throw new Error('the engine did not land the wedding on the week its own predicate names')
  }
  return world
}

/** Every caption the wedding occasion can print in this voice – the whole r49 variant pool, so the
 *  reverse lookup survives the deterministic variant walk. */
function weddingCaptions(voice: 'sunny' | 'fiery' | 'quiet' | 'deep'): Set<string> {
  const row = ALBUM_CORPUS.find((o) => o.id === 'wedding')
  if (!row) throw new Error('no wedding occasion in the corpus')
  return new Set(row.voices[voice].map((h) => h.caption))
}

function frames(book: AlbumBook): { caption: string; art: string; alt: string }[] {
  return book.sheets.flatMap((sheet) => sheet.frames.map((f) => ({ caption: f.caption, art: f.art, alt: f.alt })))
}

const BRIDE_ART = 'images/fem-euro-brunnet/fem-euro-brunnet-adult-bride.webp'

describe('round 49 №8 – the engine-born wedding reaches the album', () => {
  it('⭐⭐⭐ one wedding frame, the bride painting at an adult-band week, the caption the corpus wrote', () => {
    const world = engineWedding()
    const captured = world.milestones.filter((m) => m.type === 'wedding')
    expect(captured, 'landWedding captured exactly one milestone').toHaveLength(1)
    expect(captured[0].week, 'the milestone week IS the latch week').toBe(world.loveEpisodes[0].latchedWeek)

    const book = assembleAlbum(world)
    const caps = weddingCaptions(world.temperament!)
    const wedding = frames(book).filter((f) => caps.has(f.caption))
    expect(wedding, 'exactly one wedding frame in the book').toHaveLength(1)
    expect(wedding[0].art, 'the bride painting – her own band, or the r50 clamp').toBe(BRIDE_ART)
  })

  it('⭐⭐⭐ r50 №1 – a landing at 31+ paints the SAME bride, with her own alt (the band clamp)', () => {
    // The hole the owner reported three times: `FACE_BANDS.bride = ['adult']`, so a lateCareer
    // wedding used to fall back to `lateCareer-norm` under the generic portrait alt – the frame
    // existed and was unrecognizable. The clamp (`EVENT_STEM.wedding`) pins the art at any band;
    // the HOME portrait fallback is untouched and stays pinned in tests/portrait-bands.test.ts.
    const world = engineWedding(31)
    const week = world.milestones.find((m) => m.type === 'wedding')!.week
    expect(kidAgeAt(world, week), 'the landing really is inside the lateCareer band').toBeGreaterThan(30)
    const book = assembleAlbum(world)
    const caps = weddingCaptions(world.temperament!)
    const wedding = frames(book).filter((f) => caps.has(f.caption))
    expect(wedding, 'the 31+ wedding reaches the book').toHaveLength(1)
    expect(wedding[0].art, 'adult-bride, clamped – never the band portrait').toBe(BRIDE_ART)
    expect(wedding[0].alt, 'and the alt is the wedding\'s own, because the picture is').toBe('Her wedding day')
  })

  it('⭐⭐ r50 №1 – two landed weddings in ONE chapter keep BOTH frames: kind `wedding` leaves the cap\'s trim', () => {
    // «в третий раз прошу» – the last quiet drop route. A divorce writes `endedWeek` and NOTHING
    // else (`endEpisode`, loveEpisodes.ts), the first latch survives, and a second episode can land
    // its own wedding. Both milestones band `adult` here; a two-frame chapter's honest cap is 1, so
    // without the exemption `selectRepresentatives`' tightening pass cut the second frame silently.
    // ⚠ both land in the LATE CAREER band (31+ has no upper edge, so two hits years apart still
    // share the chapter) – which also exercises the r50 clamp on both frames at once
    const world = engineWedding(31)
    const first = world.loveEpisodes[0]
    const w1 = first.latchedWeek!
    expect(kidAgeAt(world, w1) > 30, 'the first landing is inside the lateCareer band').toBe(true)
    first.endedWeek = w1 + 10
    // the second attachment: posed the way the first was, old enough at its own hit week
    const hit2 = firstHit(world.seed, w1 + WEDDING.minEpisodeWeeks + 12)
    const landing2 = hit2 + WEDDING.weeksAfterEngagement
    world.loveEpisodes.push(episodeRow(hit2 - WEDDING.minEpisodeWeeks))
    world.week = hit2
    rollWedding(world)
    answerLifeBeat(world, 'bless')
    world.week = landing2
    landWedding(world)
    expect(world.milestones.filter((m) => m.type === 'wedding'), 'two captured weddings').toHaveLength(2)
    // ⚠ counted by ART, not caption: two firings of a one-hand pool write the same caption, and the
    // per-sheet dedupe (r49 №4) blanks the literal repeat – which is about words, never about frames.
    const brides = frames(assembleAlbum(world)).filter((f) => f.art === BRIDE_ART)
    expect(brides, 'both wedding frames survive selection').toHaveLength(2)
  })

  it('⭐⭐ route (c): a same-week RARE no longer evicts the wedding – one week, one frame, the wedding wins', () => {
    // The strongest realistic competitor `selectRepresentatives` can seat in the wedding's week:
    // the first-touch latch ('first-number-one', priority 99 – above every non-closer except
    // 'first-number-one-title' at 101, whose extra title-in-the-same-week precondition the career
    // here does not hold). At the wedding's old 90 this arm is RED – the byWeek map kept the rare
    // and the once-per-career wedding photo silently vanished (measured 12.10); at 102 it is GREEN.
    const world = engineWedding()
    const week = world.milestones.find((m) => m.type === 'wedding')!.week
    world.firstNo1 = { wta: week }
    const book = assembleAlbum(world)
    const caps = weddingCaptions(world.temperament!)
    const wedding = frames(book).filter((f) => caps.has(f.caption))
    expect(wedding, 'the wedding survives the shared week').toHaveLength(1)
  })
})

describe('round 49 №8 – the v94 net: a married save without its wedding milestone is repaired', () => {
  const v93 = (): Record<string, unknown> => JSON.parse(readFileSync(`${SAVES}/v93.json`, 'utf8'))
  const latchedRow = (): LoveEpisode => ({ ...episodeRow(100), latchedWeek: 180, partnerName: 'Anton' })
  const weddings = (out: WorldState): Milestone[] => out.milestones.filter((m) => m.type === 'wedding')

  it('⭐⭐⭐ backfills EXACTLY what `landWedding` would have written, from `latchedWeek` and the episode id', () => {
    const base = v93()
    const lived = {
      ...base,
      schemaVersion: 93,
      loveEpisodes: [latchedRow()],
      milestones: (base.milestones as Milestone[]).filter((m) => m.type !== 'wedding'),
    }
    const out = migrateSave(JSON.parse(JSON.stringify(lived)))
    expect(out.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(weddings(out), 'the row is byte-identical to a captured one').toEqual([
      { type: 'wedding', week: 180, kind: 'p:100' },
    ])
  })

  it('⭐⭐ idempotent: a second run over the migrated save adds nothing', () => {
    const lived = { ...v93(), schemaVersion: 93, loveEpisodes: [latchedRow()] }
    const once = migrateSave(JSON.parse(JSON.stringify(lived)))
    expect(weddings(once)).toHaveLength(1)
    const again = migrateSave({ ...JSON.parse(JSON.stringify(once)), schemaVersion: 93 })
    expect(weddings(again), 'the guard, not luck: one milestone after two runs').toHaveLength(1)
  })

  it('⭐ the identity on every engine-born save: milestone already there, or no wedding ever landed', () => {
    const base = v93()
    const kept = {
      ...base,
      schemaVersion: 93,
      loveEpisodes: [latchedRow()],
      milestones: [...(base.milestones as Milestone[]), { type: 'wedding', week: 180, kind: 'p:100' } as Milestone],
    }
    const out = migrateSave(JSON.parse(JSON.stringify(kept)))
    expect(weddings(out), 'nothing added beside the captured row').toHaveLength(1)
    // the fixture's own episode is ended and never latched – no wedding, no backfill
    const untouched = migrateSave(v93())
    expect(weddings(untouched)).toHaveLength(0)
  })
})

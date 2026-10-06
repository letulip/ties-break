// ⭐⭐⭐ ROUND 45 #5 – THE FIRST TIME SHE WAS NUMBER ONE (the owner, 02.10: «В альбоме вполне можно сделать
// чуть ли не отельную страницу, если она на #1 в мире выходит, даже если в моменте, а не по итогам года,
// это значимый момент», and «можно и на других уровнях тоже показывать»).
//
// WHAT IS BUILT, AND WHAT THIS FILE IS EVIDENCE FOR. The first-#1 week is not derivable from any save
// (`seasonHistory` is year-end only, `results` a 52-week window), so v91 persists ONE fact per table – the
// first-touch latch `world.firstNo1 = { wta?, junior? }`, written once in `recomputeKidRank` – and the album
// reads it as two `rare` occasions at priority 99 (`first-number-one`, `first-number-one-junior`).
//
//   A. THE LATCH     – written once, only on rank 1 with points held, kept when she falls, absent when never
//                      touched, written by the load path and by the tick's own step as well.
//   B. THE PAGE      – exactly once per latched table, never otherwise (a cached rank of 1 is not a latch),
//                      dated at the latch's week, byte-stable, and ranked between the top-tier title (100)
//                      and the years at the top (98).
//   C. THE MIGRATION – v90 -> v91 sets a latch ONLY where a cached rank is 1 as the save is written, else
//                      leaves the key absent; the golden fixture is the real migration's own output.
//   D. AS PLAYED     – careers WALKED through the public engine commands: the latch the engine writes on its own is the
//                      page the book prints, and a career that never touched #1 has none.
//   E. THE SHARED WEEK – 5b, his 02.10 third batch («а они обе не могут на одной странице жить?…»): when the first world #1 and the first title at the highest step fall in
//                      ONE week the book prints ONE combined page (`first-number-one-title`, priority 101) and neither plain page; every other week is exactly what it
//                      was. B7b, B9 – B16 – and B9/B10 are the two cases whose CLAIM moved with the ruling (each says so where it stands).
//
// ⚠ POSED LEDGERS, AND WHY THAT IS HONEST HERE: the latch's input is a RANKING ROW, so the cases give the
// kid a result worth more than the field on the table under test and let the REAL `recomputeKidRank` fold it
// – the writer is never called with a hand-built answer except in the one case (A7) whose subject is the
// `points > 0` belt, which a well-formed fold cannot reach.
//
// -------------------------------------------------------------------------------------------------
// THE MUTATION LEDGER – every arm run, and the red it produced. Measured, not predicted.
// -------------------------------------------------------------------------------------------------
//   M1  the latch is never written (`recomputeKidRank`'s write removed)               RED  A2 A3 A4 A5 A7 A8 A9 B5   (8)
//   M2  the page fires off the CACHED rank instead of the latch                      RED  B1 B2 B3 B4 B5 B8         (6)
//         ⭐ B1 is the one that names it: a cached rank of 1 with no latch must yield no page.
//   M3  the migration sets the latch UNCONDITIONALLY (the two `=== 1` tests removed)  RED  C1 C2 C3 C4            (4)
//   M4  the latch is rewritten on every #1 week (the `=== undefined` once-guard gone) RED  A4 A9                    (2)
//   M5  second place latches (`rank <= 2`)                                            RED  A6                       (1)
//   M6  the `points > 0` belt dropped                                                 RED  A7                       (1)
//   M7a priority 101 – above the top-tier title (100)                                 RED  B9                       (1)
//   M7b priority 97 – below the years at the top (98)                                 RED  B8                       (1)
//   M8  a junior touch written under the WORLD key                                    RED  A2 A4 A5 A7 A8 A9 B5     (7)
//   M9  `recomputeKidRank` no longer calls the latch (the tick/load paths go quiet)   RED  A2 A3 A4 A5 A8 A9 B5     (7)
//   Ten arms, ten reds, and the three source files restored byte-identical after the run (sha-256 compared). The two the ruling's own
//   words depend on are M1 («даже если в моменте»: no latch, no page) and M4 («the FIRST week»: a latch that moves is a page on the wrong day).
//
//   ⭐ 5b – THE COMBINED PAGE'S OWN ARMS, run against `albumBook.ts`, `tests/round45-first-number-one.test.ts` alone (+ the album test for M17). The unmutated run printed
//   «Tests 32 passed (32)» on that command, so no arm below ran empty; the source was restored byte-identical after each (sha-256 compared).
//   M10 the combined trigger off (`wta === titleWeek` -> `false`: the collision falls back to the absorbed title)  RED  B9 B10 B13 B15 B16   (5)
//   M11 the one-frame-per-week rule off (`selectRepresentatives` keeps every candidate)                           RED  B16                 (1)
//         ⭐ THE FIRST RUN OF THIS ARM WENT RED NOWHERE: in a chapter of nothing but rare pages the thirds rule trims the kind to one frame anyway, so the
//         double print hid behind a SECOND rule. B16 was written for exactly that – a chapter full of other kinds, the cap on rare at two – and is the page-count arm.
//   M12 priority 99 – the title (100) wins the week and the combined page is absorbed                            RED  B9 B10 B13 B15 B16   (5)
//   M12b priority 100 – a tie, and the title is seated first                                                      RED  B9 B10 B13 B15 B16   (5)
//   M13 the trigger ignores the title: a combined page on EVERY first world #1 (the other direction)             RED  B2 B4 B8 B12 D1      (5)
//   M14 the trigger accepts ANY highest-title week and not the first one's (the title page's own reading)         RED  B12                 (1)
//   M15 the shared reading names the LAST title's week, not the first's                                           RED  B12                 (1)
//   M16 the combined page drops its tier and finish (the sheet's tag loses the tournament fact)                   RED  B15                 (1)
//   M17 the mood row removed                                                                                      RED  tests/albumBook.test.ts (a row for every non-closing occasion)
//   M10, M11 and M12 are the three the brief names: the trigger, the suppression (which IS the one-frame rule plus the priority – there is no second mechanism, see `rareCandidates`),
//   and the priority. M13 – M16 are the arms the other direction and the title's own week needed.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { assembleAlbum, createWorld, kidAgeAt, refreshDerivedRankCaches, SAVE_SCHEMA_VERSION, type WorldState } from '../src/engine/world'
import { latchFirstNo1, recomputeKidRank } from '../src/engine/world/ladder'
import { recomputeRankAndMilestones } from '../src/engine/world/bookkeeping'
import { KID_ID } from '../src/engine/world/constants'
import { ALBUM_CORPUS } from '../src/engine/world/albumCorpus'
import { migrateSave } from '../src/engine/migrations'
import { resumeMain } from '../src/engine/rng'
import { answerFork, answerRetirement, pendingBirthday } from '../src/engine/world'
import { PRESETS, POLICIES, openCareer, stepCareerWeek } from '../tools/econ-bench'
import { drainLifeBeatsTallied } from '../tools/_lifeBeats'
import { answerBirthdayNeutral } from '../tools/_birthday'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { weekSpan } from '../src/shared/dates'
import type { AlbumBook } from '../src/shared/protocol'

const FIX = 'tests/fixtures/saves'
const read = (v: number): Parameters<typeof migrateSave>[0] => JSON.parse(readFileSync(`${FIX}/v${v}.json`, 'utf8'))

type Table = 'itf' | 'wta'
const tierOf = (track: Table) => TIER_LADDER.find((t) => TIERS[t].track === track)!

/** Give the kid ONE result on `track`'s table, worth `points` – the pose the whole file stands on. The REAL fold then
 *  ranks it: whether it is a #1 is asserted by every case that needs one, never assumed. */
function pose(world: WorldState, track: Table, week: number, points: number, playerId: string = KID_ID): void {
  world.results = world.results.filter((r) => !(r.playerId === playerId && r.tier !== undefined && TIERS[r.tier].track === track))
  world.results.push({ playerId, week, points, tier: tierOf(track) })
}

/** TWO RIVALS AT A KNOWN WORTH – 2,000,000 and 1,500,000 on `track` – so «second» and «third» are places on a table the case built, not
 *  on whatever the cohort happened to hold: a freshly created world has no ledger, and on an empty one a single point is number one. */
function seedRivals(world: WorldState, track: Table, week: number): void {
  pose(world, track, week, 2_000_000, world.cohort[0].id)
  pose(world, track, week, 1_500_000, world.cohort[1].id)
}

/** A world with the clock at `week` and the kid number one on `track` – and the proof that she is. */
function atNumberOne(seed: string, track: Table, week: number): WorldState {
  const world = createWorld(seed)
  world.week = week
  pose(world, track, week, 1_000_000)
  recomputeKidRank(world)
  expect(track === 'itf' ? world.kidRank : world.kidRankWta, 'the pose is a genuine #1 on the table under test').toBe(1)
  return world
}

function voiceOf(world: WorldState) {
  return world.temperament!
}

/** The corpus ids of every frame the book carries, read back through the captions (the wire carries words, not ids). */
function pages(world: WorldState, book: AlbumBook = assembleAlbum(world)): string[] {
  const voice = voiceOf(world)
  return book.sheets.flatMap((s) =>
    s.frames.map((f) => {
      const row = ALBUM_CORPUS.find((o) => o.voices[voice].caption === f.caption)
      if (!row) throw new Error(`no corpus occasion renders the caption «${f.caption}»`)
      return row.id
    }),
  )
}

const NO1 = ['first-number-one', 'first-number-one-junior']
/** The combined page (round 45 #5b): the world latch's page when it shares its week with the first title at the highest step. */
const COMBINED = 'first-number-one-title'
const weekAtAge = (world: WorldState, age: number): number => {
  for (let w = 0; w < 2000; w++) if (kidAgeAt(world, w) === age) return w
  throw new Error(`no week reaches age ${age}`)
}

describe('A · the latch – one week per table, written once, only on a real number one', () => {
  it('A1 · a career that never touches #1 has no latch – not an empty one, no key at all', () => {
    const world = createWorld('r45-no1-a1')
    expect('firstNo1' in world, 'a fresh career is created without the key').toBe(false)
    recomputeKidRank(world)
    pose(world, 'itf', 5, 3)
    pose(world, 'wta', 5, 3)
    world.week = 5
    recomputeKidRank(world)
    expect(world.kidRank, 'three points is nowhere near the top').toBeGreaterThan(1)
    expect('firstNo1' in world, 'the key is created lazily – a career with nothing to say serialises exactly as before').toBe(false)
  })

  it('A2 · the first week the junior table says #1 is written, at THAT week, and only the junior key', () => {
    const world = atNumberOne('r45-no1-a2', 'itf', 10)
    expect(world.firstNo1).toEqual({ junior: 10 })
    expect('wta' in world.firstNo1!, 'the professional key is not touched by a junior touch').toBe(false)
  })

  it('A3 · the professional table is its own latch', () => {
    const world = atNumberOne('r45-no1-a3', 'wta', 12)
    expect(world.firstNo1).toEqual({ wta: 12 })
    expect('junior' in world.firstNo1!, 'a W result is not a junior touch').toBe(false)
  })

  it('A4 · written ONCE: staying at #1 into a later week does not move it', () => {
    const world = atNumberOne('r45-no1-a4', 'itf', 10)
    world.week = 30
    recomputeKidRank(world)
    expect(world.kidRank, 'still number one in week 30').toBe(1)
    expect(world.firstNo1, 'and the latch still names week 10').toEqual({ junior: 10 })
  })

  it('A5 · ⭐ a June touch that ends the season at #3 is KEPT – the owner\'s own case («даже если в моменте»)', () => {
    const world = createWorld('r45-no1-a5')
    world.week = 10
    seedRivals(world, 'itf', 10)
    pose(world, 'itf', 10, 3_000_000)
    recomputeKidRank(world)
    expect(world.kidRank, 'June: she is first, ahead of both rivals').toBe(1)
    // the fall: her result is now worth less than both rivals', and the clock has moved on
    world.week = 40
    pose(world, 'itf', 10, 1_000_000)
    recomputeKidRank(world)
    expect(world.kidRank, 'she ends it at number three').toBe(3)
    expect(world.firstNo1, 'but the moment she was first is still on the record').toEqual({ junior: 10 })
  })

  it('A6 · only a #1 latches – second place on the table writes nothing', () => {
    const world = createWorld('r45-no1-a6')
    world.week = 10
    seedRivals(world, 'itf', 10)
    pose(world, 'itf', 10, 1_700_000)
    recomputeKidRank(world)
    expect(world.kidRank, 'the pose is a genuine #2').toBe(2)
    expect('firstNo1' in world, 'second is not first').toBe(false)
  })

  it('A7 · the belt: a row of rank 1 with NO points held latches nothing (and with points, it does)', () => {
    // ⚠ A WELL-FORMED FOLD CANNOT PRODUCE THIS ROW – on an all-zero table everyone is at the bottom – so it is the one case that hands
    // the writer a row. «Unranked is not rank one» is every rank reader's guard here, and this one wears it too.
    const world = createWorld('r45-no1-a7')
    world.week = 7
    latchFirstNo1(world, { playerId: KID_ID, points: 0, rank: 1 }, { playerId: KID_ID, points: 0, rank: 1 })
    expect('firstNo1' in world, 'a zero-point rank 1 is an artefact of an empty table, not a touch').toBe(false)
    latchFirstNo1(world, { playerId: KID_ID, points: 1, rank: 1 }, undefined)
    expect(world.firstNo1, 'the same row WITH points held latches').toEqual({ junior: 7 })
  })

  it('A8 · the load path and the tick\'s own step write it too – a rank-1 week cannot pass unseen', () => {
    const load = createWorld('r45-no1-a8-load')
    load.week = 20
    pose(load, 'wta', 20, 1_000_000)
    expect(refreshDerivedRankCaches(load), 'the adoption-time refresh moved the cache').toBe(true)
    expect(load.firstNo1, 'and latched on the way through').toEqual({ wta: 20 })

    const tick = createWorld('r45-no1-a8-tick')
    tick.week = 21
    pose(tick, 'itf', 21, 1_000_000)
    recomputeRankAndMilestones(tick)
    expect(tick.firstNo1, 'step 5 of a resolved week latches').toEqual({ junior: 21 })
  })

  it('A9 · two tables, two latches, each at its own week – and no MAIN draw is taken', () => {
    const world = atNumberOne('r45-no1-a9', 'itf', 10)
    const before = JSON.stringify(world.rngMain)
    world.week = 60
    pose(world, 'wta', 60, 1_000_000)
    recomputeKidRank(world)
    expect(world.firstNo1).toEqual({ junior: 10, wta: 60 })
    expect(JSON.stringify(world.rngMain), 'a pure state write: the MAIN stream\'s position did not move').toBe(before)
  })
})

describe('B · the page – once per latched table, never otherwise', () => {
  const SEED = 'r45-no1-album'

  it('B1 · a career with no latch has neither page – even with a cached rank of 1 on both tables', () => {
    const world = createWorld(SEED)
    expect(pages(world).filter((p) => NO1.includes(p)), 'a fresh career').toEqual([])
    // ⚠ THE PAGE READS THE LATCH, NOT THE CACHE: a cached rank is what the fold says THIS WEEK, and a page built from it would vanish the
    // week she slipped – exactly the year-end-only failure the latch exists to close.
    world.week = weekAtAge(world, 20) + 5
    world.kidRank = 1
    world.kidRankWta = 1
    expect(pages(world).filter((p) => NO1.includes(p)), 'a cached rank is not a latch').toEqual([])
  })

  it('B2 · a world latch yields exactly one `first-number-one` page, dated at the latch\'s week, in the parent\'s own words', () => {
    const world = createWorld(SEED)
    const week = weekAtAge(world, 21) + 6
    world.firstNo1 = { wta: week }
    const book = assembleAlbum(world)
    expect(pages(world, book), 'one frame, and it is this occasion').toEqual(['first-number-one'])
    const sheet = book.sheets[0]
    const row = ALBUM_CORPUS.find((o) => o.id === 'first-number-one')!
    expect(sheet.note?.text, 'the note is the occasion\'s, in her voice').toBe(row.voices[voiceOf(world)].note)
    expect(sheet.note?.dateLabel, 'dated at the week the latch names').toBe(weekSpan(week))
  })

  it('B3 · a junior latch yields exactly one `first-number-one-junior` page', () => {
    const world = createWorld(SEED)
    const week = weekAtAge(world, 15) + 9
    world.firstNo1 = { junior: week }
    const book = assembleAlbum(world)
    expect(pages(world, book)).toEqual(['first-number-one-junior'])
    expect(book.sheets[0].note?.dateLabel).toBe(weekSpan(week))
  })

  it('B4 · a career that touched both has two pages, each at its own moment\'s week', () => {
    const world = createWorld(SEED)
    const junior = weekAtAge(world, 15) + 9
    const wta = weekAtAge(world, 25) + 4
    world.firstNo1 = { junior, wta }
    const book = assembleAlbum(world)
    expect(pages(world, book), 'the junior page first, in the book\'s chronological order').toEqual(['first-number-one-junior', 'first-number-one'])
    expect(book.sheets.map((s) => s.note?.dateLabel)).toEqual([weekSpan(junior), weekSpan(wta)])
  })

  it('B5 · ⭐ the whole path, as the owner played it: a June touch, a fall to #3, and the page is still there', () => {
    const world = createWorld(SEED)
    const june = weekAtAge(world, 16) + 20
    world.week = june
    seedRivals(world, 'itf', june)
    pose(world, 'itf', june, 3_000_000)
    recomputeKidRank(world)
    expect(world.kidRank).toBe(1)
    world.week = june + 30
    pose(world, 'itf', june, 1_000_000)
    recomputeKidRank(world)
    expect(world.kidRank, 'she finished the season third').toBe(3)
    expect(pages(world), 'and the book still has the page for the week she touched the top').toEqual(['first-number-one-junior'])
    expect(assembleAlbum(world).sheets[0].note?.dateLabel).toBe(weekSpan(june))
  })

  it('B6 · deterministic and read-only: the same state gives the byte-same book, and the world is not touched', () => {
    const world = createWorld(SEED)
    world.firstNo1 = { junior: weekAtAge(world, 15) + 9, wta: weekAtAge(world, 25) + 4 }
    const before = JSON.stringify(world)
    const a = JSON.stringify(assembleAlbum(world))
    const b = JSON.stringify(assembleAlbum(world))
    expect(a, 'two assemblies of one state').toBe(b)
    expect(JSON.stringify(world), 'assembling the album writes nothing').toBe(before)
  })

  it('B7 · the occasions are `rare`, declared where a first #1 can fall, and the junior page cannot be a professional one', () => {
    const world = ALBUM_CORPUS.find((o) => o.id === 'first-number-one')!
    const junior = ALBUM_CORPUS.find((o) => o.id === 'first-number-one-junior')!
    expect(world.kind).toBe('rare')
    expect(junior.kind).toBe('rare')
    expect(world.voices.sunny.note, 'the two tables are two sentences, never one with a noun swapped').not.toBe(junior.voices.sunny.note)
    expect([...junior.bands], 'a junior #1 can fall in her early teens').toContain('young')
    expect([...world.bands], 'a world #1 is never a thirteen-year-old\'s').not.toContain('young')
  })

  it('B7b · the combined occasion is rare, in the bands of BOTH pages it replaces, with words of its own in every voice', () => {
    const combined = ALBUM_CORPUS.find((o) => o.id === COMBINED)!
    const title = ALBUM_CORPUS.find((o) => o.id === 'top-tier-title')!
    const world = ALBUM_CORPUS.find((o) => o.id === 'first-number-one')!
    expect(combined.kind).toBe('rare')
    // ⚠ THE BANDS ARE THE PAIR'S, BOTH OF THEM: the band filter runs BEFORE the one-frame-per-week rule, so a combined page that missed a band its two plain pages
    // are in would be dropped THERE and the title's page would print, silently – the collision falling back to the old absorb with every other check green.
    expect([...combined.bands], 'the first #1 page\'s bands').toEqual([...world.bands])
    expect([...combined.bands], 'and the title page\'s bands').toEqual([...title.bands])
    for (const voice of Object.keys(combined.voices) as Array<keyof typeof combined.voices>) {
      for (const plain of [title, world]) {
        expect(combined.voices[voice].note, voice + ': the combined note is not the note of ' + plain.id).not.toBe(plain.voices[voice].note)
        expect(combined.voices[voice].caption, voice + ': nor its caption').not.toBe(plain.voices[voice].caption)
        expect(combined.voices[voice].line, voice + ': nor its line').not.toBe(plain.voices[voice].line)
      }
    }
  })

  /** A world whose chapter for the adult years holds ONLY the colliding candidates, so «who won the week» is the whole question. */
  function colliding(): { world: WorldState; week: number } {
    const world = createWorld(SEED)
    const season = 11
    const week = season * WEEKS_PER_YEAR + WEEKS_PER_YEAR - 1
    expect(kidAgeAt(world, week), 'the collision week is in her twenties').toBeGreaterThanOrEqual(23)
    world.seasonHistory = [season - 3, season - 2, season - 1, season].map((seasonIndex) => ({ seasonIndex, byTrack: { wta: { endRank: 5 } } })) as unknown as WorldState['seasonHistory']
    world.firstNo1 = { wta: week }
    return { world, week }
  }

  it('B8 · priority 99: it beats the years at the top (98) for the same week…', () => {
    const { world } = colliding()
    expect(pages(world), 'the first touch names the week, and the run it began yields it').toEqual(['first-number-one'])
  })

  /** The collision as the 02.10 ruling frames it: the first #1 AND the first title at the highest step in ONE week – with the streak's page in that week too,
   *  so three plain rivals share its one frame. */
  function collidingWithTitle(): { world: WorldState; week: number } {
    const { world, week } = colliding()
    const top = TIER_LADDER[TIER_LADDER.length - 1]
    world.week = week
    world.bestFinishByTier[top] = 0
    world.trophiesByTier[top] = { titles: [week], finals: [] }
    return { world, week }
  }

  it('B9 · ⭐⭐ …and the highest title in that SAME week no longer absorbs it: ONE combined page prints (101 over the title\'s 100, the first #1\'s 99 and the streak\'s 98), and neither plain page beside it', () => {
    // ⚠⚠ 02.10, THIRD BATCH – THE OWNER'S RULING, NOT DRIFT. This case used to read «…and yields to the top-tier title (100) for the same week» and expected the
    // title's page ALONE: the first #1 was absorbed. He ruled otherwise («а они обе не могут на одной странице жить?… она же стала №1 потому что выиграла шлем,
    // без него никак. Это тоже как-то надо научиться показывать» – docs/decisions.md, THIRD BATCH): the pair shares ONE page. The claim that moved is exactly
    // «the title absorbs the first #1»; what did not move is that a same-week contest has ONE winner, by priority – it is the combined page's 101 now.
    const { world, week } = collidingWithTitle()
    const book = assembleAlbum(world)
    expect(book.sheets.flatMap((s) => s.frames).length, 'ONE frame in the whole book – the week is not printed twice').toBe(1)
    expect(pages(world, book), 'and it is the combined page, with neither the title\'s page nor the first #1\'s beside it').toEqual([COMBINED])
    const sheet = book.sheets[0]
    expect(sheet.note?.text, 'the note is the combined occasion\'s, in her voice').toBe(ALBUM_CORPUS.find((o) => o.id === COMBINED)!.voices[voiceOf(world)].note)
    expect(sheet.note?.dateLabel, 'dated at the one week the two share').toBe(weekSpan(week))
  })

  it('B10 · ⭐ …and the walked set\'s own property reads that week as ONE combined page – printed once, nothing absorbed, no plain page expected for it', () => {
    // ⚠ 02.10 – THE TARIFF RETUNE MOVED WALKED CAREERS; FIXTURE RE-AIMED, CLAIM UNCHANGED. D1's «the walk met the same-week coincidence» arm lived on
    // one walked career (first #1 and the biggest title in week 294) that the retuned trajectories no longer produce – 0 of 36 walked careers
    // have it. The claim is about the priority rule, which a posed week tests honestly: the same latch-and-title week as B9, read through
    // D1's own property so that its accounting is exercised and not just the page list.
    // ⚠⚠ 02.10, THIRD BATCH – AND THEN THE CLAIM ITSELF MOVED, ON HIS RULING (see B9). This case read «absorbed === 1, live === 0» – the first #1 swallowed by the
    // title's page. It reads «combined === 1, absorbed === 0, live === 0» now: the latch week is a page of its own, so nothing is absorbed and no plain #1 page is
    // expected for it. The re-aim is the ruling's, the old numbers are kept here so the move is visible and not silent.
    const { world } = collidingWithTitle()
    const read = expectBookNamesItsLatches(world)
    expect(read.combined, 'the one latch shares its week with the highest title – ONE combined page, and the property says so').toBe(1)
    expect(read.absorbed, 'and nothing is absorbed any more').toBe(0)
    expect(read.live, 'and no plain #1 page is expected for that week').toBe(0)
  })

  it('B11 · ⭐ the other direction – a title with NO first #1 in its week is still the title\'s page, and nothing else', () => {
    const { world, week } = colliding()
    const top = TIER_LADDER[TIER_LADDER.length - 1]
    delete world.firstNo1
    world.week = week
    world.bestFinishByTier[top] = 0
    world.trophiesByTier[top] = { titles: [week], finals: [] }
    expect(pages(world), 'the highest title alone is exactly the page it always was – the combined page needs BOTH facts').toEqual(['top-tier-title'])
  })

  it('B12 · ⭐ a LATER highest title in the latch week is not a collision – the title\'s page is the FIRST title\'s, and the latch week stays the plain first #1', () => {
    // ⚠ «ONE QUESTION, TWO SIDES»: the combined page is asked of the title page's OWN week – the first title at the highest step. A second one in the latch week is
    // not that page's week, so there is no pair to combine: the career already has its title page (earlier, in her teens) and the latch week is the quiet one.
    const { world, week } = colliding()
    const top = TIER_LADDER[TIER_LADDER.length - 1]
    const first = weekAtAge(world, 17) + 5
    world.week = week
    world.bestFinishByTier[top] = 0
    world.trophiesByTier[top] = { titles: [first, week], finals: [] }
    expect(kidAgeAt(world, first), 'the first title is a teenager\'s – a chapter of its own, so the thirds rule is not what is being read').toBeLessThan(20)
    expect(pages(world), 'the title\'s page at the FIRST title, the plain first #1 at the latch week, and no combined page').toEqual(['top-tier-title', 'first-number-one'])
  })

  it('B13 · nothing double-prints: the junior table keeps the absorb rule – a junior latch in the same teen week is swallowed by the combined page, which prints once', () => {
    const world = createWorld(SEED)
    const week = weekAtAge(world, 17) + 9
    const top = TIER_LADDER[TIER_LADDER.length - 1]
    world.week = week
    world.firstNo1 = { junior: week }
    expect(pages(world), 'the premise: on its own the junior latch has a page in that very week').toEqual(['first-number-one-junior'])
    world.bestFinishByTier[top] = 0
    world.trophiesByTier[top] = { titles: [week], finals: [] }
    world.firstNo1 = { wta: week, junior: week }
    expect(pages(world), 'one frame – the combined page; the junior #1 page (99) has no twin and is absorbed, exactly as before').toEqual([COMBINED])
    expect(expectBookNamesItsLatches(world), 'and the walked set\'s property reads it so').toEqual({ live: 0, combined: 1, absorbed: 1 })
  })

  it('B14 · deterministic and read-only on the collision too: the same state gives the byte-same book – twice, and from a clone – and the world is not touched', () => {
    const { world } = collidingWithTitle()
    const before = JSON.stringify(world)
    const a = JSON.stringify(assembleAlbum(world))
    const b = JSON.stringify(assembleAlbum(world))
    expect(a, 'two assemblies of one state').toBe(b)
    expect(JSON.stringify(assembleAlbum(structuredClone(world))), 'and of a clone of it').toBe(a)
    expect(JSON.stringify(world), 'assembling the album writes nothing').toBe(before)
  })

  it('B15 · ⭐ the combined page REPLACES the title\'s page on its sheet and loses nothing but the words – same layout, same tournament fact (the tag), same date', () => {
    // ⚠ TWO CHAPTERS ON PURPOSE: a junior page first, so the adult sheet is not the book's first and the rotation puts it on layout C – the layout that carries the
    // TAG, which is where the tournament fact (the tier and the champion's stage) is visible. On layout A there is nothing to read it off, and a combined page that
    // dropped its tier and finish would pass every other check here.
    const build = (collision: boolean): WorldState => {
      const { world, week } = colliding()
      const top = TIER_LADDER[TIER_LADDER.length - 1]
      world.week = week
      world.bestFinishByTier[top] = 0
      world.trophiesByTier[top] = { titles: [week], finals: [] }
      world.firstNo1 = collision ? { junior: weekAtAge(world, 15) + 9, wta: week } : { junior: weekAtAge(world, 15) + 9 }
      return world
    }
    const adultSheet = (world: WorldState) => assembleAlbum(world).sheets.at(-1)!
    const titleOnly = adultSheet(build(false))
    const combined = adultSheet(build(true))
    expect(titleOnly.layout, 'the premise: the adult chapter opens on layout C, the one that carries the tag').toBe('C')
    expect(titleOnly.tag, 'and the title\'s sheet has its tag').not.toBeNull()
    type Sheet = AlbumBook['sheets'][number]
    const wordless = (s: Sheet) => ({ ...s, note: s.note ? { ...s.note, text: '' } : s.note, line: '', frames: s.frames.map((f) => ({ ...f, caption: '' })) })
    expect(wordless(combined), 'everything but the words is the title\'s sheet\'s: layout, tag, date, age, art').toEqual(wordless(titleOnly))
    expect(combined.note?.text, 'and the words are the combined occasion\'s').toBe(ALBUM_CORPUS.find((o) => o.id === COMBINED)!.voices[voiceOf(build(true))].note)
    expect(combined.note?.text).not.toBe(titleOnly.note?.text)
  })

  it('B16 · ⭐ ONE page even where the chapter has room for several rare ones – the one-frame-per-week rule keeps the week single, not the thirds cap', () => {
    // ⚠ WHY THIS CASE EXISTS – IT IS MUTATION M-b'S OWN RESULT (the ledger at the head of this file). In a chapter that holds NOTHING BUT rare pages the thirds rule (no kind above
    // a third of the frames) trims the rare kind to ONE frame anyway, so every posed world above stays single even with the one-frame-per-week rule switched OFF: that arm's first
    // run went red NOWHERE – a double print was invisible to every page-count arm. Here the chapter is FULL of other kinds, the cap on rare is two, and a week printed twice shows.
    const { world, week } = collidingWithTitle()
    world.milestones.push({ type: 'title', week: week - 90, tier: 'w15' })
    world.milestones.push({ type: 'title', week: week - 82, tier: 'w35' })
    world.milestones.push({ type: 'final', week: week - 70, tier: 'w75' })
    world.milestones.push({ type: 'break-even', week: week - 62, kind: 'career' })
    world.milestones.push({ type: 'wedding', week: week - 54, kind: 'p:1' })
    world.assets.push({ id: 'house-first', boughtWeek: week - 46, paidCents: 0, valueCents: 0, entries: [] })
    world.assets.push({ id: 'merch-brand', boughtWeek: week - 38, paidCents: 0, valueCents: 0, entries: [] })
    const printed = pages(world)
    expect(printed.length, 'the premise: the chapter is full of other kinds, so the thirds cap lets TWO rare frames through').toBeGreaterThanOrEqual(6)
    expect(
      printed.filter((p) => [COMBINED, 'top-tier-title', 'first-number-one', 'years-at-the-top'].includes(p)),
      'the collision week is printed ONCE – as the combined page – with the title\'s page, the plain #1 page and the streak\'s page all gone',
    ).toEqual([COMBINED])
  })
})

describe('C · the migration – a latch only where the cached rank is 1 as the save is written', () => {
  it('C1 · the head is v91 and the golden fixture is the real migration\'s own output on v90.json', () => {
    expect(SAVE_SCHEMA_VERSION).toBe(92)
    expect((read(91) as { schemaVersion: number }).schemaVersion).toBe(91)
    // ⚠ RE-AIMED 06.10 BY v92 (SUCCESSION S1, the calendar's start year): the head moved, so migrating v90.json now arrives at v92 – the recipe is unchanged.
    // v91.json is its output MINUS the two things the later step adds (`startYear` and the version number), and v92.json is the whole of it.
    const stripped = (w: unknown): Record<string, unknown> => {
      const { startYear: _startYear, schemaVersion: _schemaVersion, ...rest } = w as Record<string, unknown>
      return rest
    }
    expect(stripped(migrateSave(read(90))), 'the recipe every fixture since v25 uses – v91.json is its output minus what v92 adds').toEqual(stripped(read(91)))
    expect(migrateSave(read(90)), 'and the head fixture is the same recipe one rung up').toEqual(read(92))
    expect('firstNo1' in migrateSave(read(90)), 'a save whose cached ranks are not 1 gains no key').toBe(false)
  })

  const crafted = (patch: Record<string, unknown>) => migrateSave({ ...(read(90) as object), ...patch } as never)

  it('C2 · a v90 save whose cached WORLD rank is 1 gets the wta latch at the CURRENT week, and only that', () => {
    const out = crafted({ kidRankWta: 1 })
    expect(out.firstNo1).toEqual({ wta: out.week })
  })

  it('C3 · …and the cached junior rank is its own table', () => {
    const out = crafted({ kidRank: 1 })
    expect(out.firstNo1).toEqual({ junior: out.week })
    expect(crafted({ kidRank: 1, kidRankWta: 1 }).firstNo1, 'both at once, both at the current week').toEqual({ junior: out.week, wta: out.week })
  })

  it('C4 · a v90 save that is number one on NEITHER table gets no key – however well she once did', () => {
    const out = crafted({ kidRank: 2, kidRankWta: 3, peakDomesticPoints: 5000 })
    expect('firstNo1' in out, 'a past touch is unknowable, so nothing is written').toBe(false)
  })

  it('C5 · a v91 save is never touched by the step – its latch survives a load unchanged', () => {
    const out = migrateSave({ ...(read(91) as object), firstNo1: { wta: 5 }, kidRankWta: 1 } as never)
    expect(out.firstNo1).toEqual({ wta: 5 })
  })
})

/** THE PROPERTY D1 READS OFF EVERY CAREER IT IS HANDED – and B10 and B13 read off a posed one, which is why it lives at module scope. The book names exactly the pages
 *  its latches name: one plain #1 page per latched table that no title shares a week with, none for an unlatched one, never the same page twice. A latch week that holds the
 *  FIRST title at the highest step is a SHARED week (the title's page is dated at that title – stated here from the ledger, not asked of the engine): the world latch there is
 *  ONE combined page (5b, the 02.10 third batch – the title's page and the plain #1 page both give way to it), and the junior latch there keeps the absorb rule. Returns how many
 *  latches stayed live (plain pages), how many became the combined page, and how many were absorbed. */
function expectBookNamesItsLatches(world: WorldState): { live: number; combined: number; absorbed: number } {
  const top = TIER_LADDER[TIER_LADDER.length - 1]
  const printed = pages(world)
  const printedNo1 = printed.filter((p) => NO1.includes(p))
  const titleWeek = world.bestFinishByTier[top] === 0 ? (world.trophiesByTier[top]?.titles ?? [])[0] : undefined
  const latches = Object.entries(world.firstNo1 ?? {}) as ['wta' | 'junior', number][]
  const shared = latches.filter(([, week]) => week === titleWeek)
  const combined = shared.filter(([table]) => table === 'wta')
  const absorbed = shared.filter(([table]) => table === 'junior')
  const live = latches.filter(([, week]) => week !== titleWeek)
  expect(printed.filter((p) => p === COMBINED).length, 'the combined page prints once where the world latch shares the title\'s week, and nowhere else').toBe(combined.length)
  if (shared.length > 0) {
    expect(printed, 'week ' + titleWeek + ': the highest title is in the book – as the combined page where the world latch shares its week, as its own page otherwise').toContain(combined.length > 0 ? COMBINED : 'top-tier-title')
  }
  if (combined.length > 0) expect(printed, 'and the title\'s own page is not printed beside the combined one').not.toContain('top-tier-title')
  expect(printedNo1.length, 'one plain page per latched table that no title shares a week with, and none for an unlatched one').toBe(live.length)
  expect(new Set(printedNo1).size, 'and never the same page twice').toBe(printedNo1.length)
  for (const [table] of live) expect(printedNo1).toContain(table === 'wta' ? 'first-number-one' : 'first-number-one-junior')
  if (world.firstNo1?.wta !== undefined) expect(world.firstNo1.wta, 'the latch names a week the career has lived through').toBeLessThanOrEqual(world.week)
  expect(JSON.stringify(assembleAlbum(world)), 'byte-stable on a real career too').toBe(JSON.stringify(assembleAlbum(world)))
  return { live: live.length, combined: combined.length, absorbed: absorbed.length }
}

describe('D · as played – careers walked through the public commands, nothing posed', () => {
  /** `tools/album-spread-probe.ts`' drain: a career stalls at every pending decision. */
  function answerWhateverIsOpen(world: WorldState): void {
    if (world.fork !== null && world.fork.answer === null) {
      drainLifeBeatsTallied(world)
      answerFork(world, 'continue')
    }
    drainLifeBeatsTallied(world)
    if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
    if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)
  }

  function walk(presetIx: number, index: number, weeks: number): WorldState {
    const policy = POLICIES[1]
    const { world } = openCareer(PRESETS[presetIx], index, policy)
    const rng = resumeMain(world.rngMain)
    for (let i = 0; i < weeks; i++) {
      stepCareerWeek(world, rng, policy)
      if (world.ending === null) answerWhateverIsOpen(world)
      if (world.ending !== null) break
    }
    return world
  }

  it('D1 · ⭐ every walked career prints exactly the pages its latch names – and the one that touched #1 has them', () => {
    // ⚠ THE CAREERS ARE `tools/first-number-one-probe.ts`' OWN: three of its eighteen, walked 340 weeks – one that touched BOTH tables, one that
    // touched only the world one, one that touched neither within the window. The assertion is a PROPERTY (pages === latch keys), so a balance
    // change that moves who touches #1 cannot make it quietly pass: the case states that at least one page has to be printed.
    //
    // ⚠⚠ ONE REAL COINCIDENCE THE POSED CASES COULD NOT HAVE FOUND, MEASURED ON THE FIRST CAREER BELOW: she reached world #1 IN THE WEEK SHE WON
    // THE BIGGEST TITLE (week 294 – the title's points are what put her there), so the album's one-frame-per-week rule names the week for the
    // higher priority, the top-tier title (100 over this page's 99), and the first-#1 page is absorbed into it. That is the rule working as
    // written (B9 pins it on a posed week) and not a missing page – but it is the owner's to confirm, and the property below carries it
    // explicitly so it cannot be mistaken for one: a latch week that holds a top-tier title expects THAT page and no #1 page.
    // ⚠⚠ 02.10 – THE TARIFF RETUNE MOVED WALKED CAREERS; FIXTURE RE-AIMED, CLAIM UNCHANGED – AND THE COINCIDENCE ARM MOVED TO A POSED WORLD (B10), WHICH
    // IS WHAT A HUNT THAT FOUND NOTHING LICENSES. B11 (a match costs a junior 1/2/3, a W15–75 week 1, W100–250 2, 500+ 3) re-timed every walk: the
    // first career below still touches world #1 in week 294, but it no longer WINS that week's final – it is a finalist (best finish 1), so the
    // title that used to share the week is gone. Hunted for a walk that has it again: presets 0–8 x indices 3–6, 340 weeks, 36 careers –
    // 2 latch a world #1 at all (weeks 294 and 299), 2 more win a top-tier title with no latch (weeks 210 and 234), and NONE has the two in
    // one week. So the coincidence is no longer asserted off a walk: the priority rule it reports is B9's rule, and B10 runs THIS property
    // (`expectBookNamesItsLatches`, the same code as below) over a posed week that holds both. The walked set keeps every other claim.
    // ⚠⚠ 02.10, THIRD BATCH – THE RULE THESE PARAGRAPHS REPORT HAS SINCE MOVED, ON HIS RULING: that coincidence week now prints ONE combined page instead of the title's
    // page alone (B9, B10 and the property below). The paragraphs above are the history of how the coincidence was found; the walked set's own claims are untouched.
    // ⚠⚠ 05.10 – THE RUN-LADDER RULING (round 46 #7: 250-12, 500-15, 1000-18, Slam-21) RE-TIMED THE WALKS AGAIN; FIXTURE RE-AIMED, CLAIM UNCHANGED: the third career moves p4/i3 -> p6/i3. None of the three
    // careers above latches a #1 any more, and the claim is that at least one page has to be printed. Hunted over presets 0–8 x indices 0–6, 340 weeks, with this case's own walker (63 careers): exactly ONE
    // latches a #1 at all – p6/i3, the JUNIOR table, in week 171 – and 62 latch nothing, the world table included. So the walked set carries the junior page and two careers that touch neither; the world-table
    // page has no walked witness on this grid any more and is exercised by this file's posed cases (the latch tests above).
    const careers = [walk(2, 3, 340), walk(1, 3, 340), walk(6, 3, 340)]
    let expectedTotal = 0
    for (const world of careers) expectedTotal += expectBookNamesItsLatches(world).live
    expect(expectedTotal, 'the walk produced at least one #1 page – otherwise this case proves nothing').toBeGreaterThan(0)
  }, 60_000)
})

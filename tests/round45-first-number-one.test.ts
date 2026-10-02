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

  it('B9 · …and yields to the top-tier title (100) for the same week', () => {
    const { world, week } = colliding()
    const top = TIER_LADDER[TIER_LADDER.length - 1]
    world.bestFinishByTier[top] = 0
    world.trophiesByTier[top] = { titles: [week], finals: [] }
    expect(pages(world), 'the biggest trophy there is outranks even the first number one').toEqual(['top-tier-title'])
  })

  it('B10 · ⭐ …and the walked set\'s own property reads that week as ABSORBED, not as a missing page – the coincidence D1 can no longer find on a walk', () => {
    // ⚠ 02.10 – THE TARIFF RETUNE MOVED WALKED CAREERS; FIXTURE RE-AIMED, CLAIM UNCHANGED. D1's «the walk met the same-week coincidence» arm lived on
    // one walked career (first #1 and the biggest title in week 294) that the retuned trajectories no longer produce – 0 of 36 walked careers
    // have it. The claim is about the priority rule, which a posed week tests honestly: the same latch-and-title week as B9, read through
    // D1's own property so that its «absorbed» accounting is exercised and not just the page list.
    const { world, week } = colliding()
    const top = TIER_LADDER[TIER_LADDER.length - 1]
    world.week = week
    world.bestFinishByTier[top] = 0
    world.trophiesByTier[top] = { titles: [week], finals: [] }
    const read = expectBookNamesItsLatches(world)
    expect(read.absorbed, 'the one latch shares its week with the top-tier title – absorbed, and the property says so').toBe(1)
    expect(read.live, 'and no #1 page is expected for it').toBe(0)
  })
})

describe('C · the migration – a latch only where the cached rank is 1 as the save is written', () => {
  it('C1 · the head is v91 and the golden fixture is the real migration\'s own output on v90.json', () => {
    expect(SAVE_SCHEMA_VERSION).toBe(91)
    expect((read(91) as { schemaVersion: number }).schemaVersion).toBe(91)
    expect(migrateSave(read(90)), 'the recipe every fixture since v25 uses').toEqual(read(91))
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

/** THE PROPERTY D1 READS OFF EVERY CAREER IT IS HANDED – and B10 reads off a posed one, which is why it lives at module scope. The book names
 *  exactly the pages its latches name: one #1 page per latched table that no bigger moment shares a week with, none for an unlatched one, never
 *  the same page twice, and a latch week that holds the top-tier title names THAT page instead (the one-frame-per-week rule, priority 100 over
 *  this page's 99). Returns how many latches stayed live and how many were absorbed by a same-week top-tier title. */
function expectBookNamesItsLatches(world: WorldState): { live: number; absorbed: number } {
  const top = TIER_LADDER[TIER_LADDER.length - 1]
  const printed = pages(world)
  const printedNo1 = printed.filter((p) => NO1.includes(p))
  const slamWeeks = world.bestFinishByTier[top] === 0 ? (world.trophiesByTier[top]?.titles ?? []) : []
  const latches = Object.entries(world.firstNo1 ?? {}) as ['wta' | 'junior', number][]
  const live = latches.filter(([, week]) => !slamWeeks.includes(week))
  for (const [, week] of latches.filter(([, w]) => slamWeeks.includes(w))) {
    expect(printed, `week ${week}: the biggest title and the first #1 fell in one week, and the title names it`).toContain('top-tier-title')
  }
  expect(printedNo1.length, 'one page per latched table that no bigger moment shares a week with, and none for an unlatched one').toBe(live.length)
  expect(new Set(printedNo1).size, 'and never the same page twice').toBe(printedNo1.length)
  for (const [table] of live) expect(printedNo1).toContain(table === 'wta' ? 'first-number-one' : 'first-number-one-junior')
  if (world.firstNo1?.wta !== undefined) expect(world.firstNo1.wta, 'the latch names a week the career has lived through').toBeLessThanOrEqual(world.week)
  expect(JSON.stringify(assembleAlbum(world)), 'byte-stable on a real career too').toBe(JSON.stringify(assembleAlbum(world)))
  return { live: live.length, absorbed: latches.length - live.length }
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
    const careers = [walk(2, 3, 340), walk(1, 3, 340), walk(4, 3, 340)]
    let expectedTotal = 0
    for (const world of careers) expectedTotal += expectBookNamesItsLatches(world).live
    expect(expectedTotal, 'the walk produced at least one #1 page – otherwise this case proves nothing').toBeGreaterThan(0)
  }, 60_000)
})

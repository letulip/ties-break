// THE ALBUM ASSEMBLY – the engine half of docs/specs/the-album-2026-09.md, unit-proved.
//
// Every case runs the REAL `assembleAlbum` over a REAL `createWorld` world whose ledgers are then
// populated the way the engine populates them (milestone rows, asset rows, entry weeks) – probe
// worlds, the house's own idiom, never saves. The handwriting asserted on is the CORPUS's – nothing
// here types a sentence (`tests/component/albumFixture.ts`'s own rule).
//
// MUTATION LEDGER (each arm applied to the module, measured red, restored – 19.09; re-run after the
// rewrite onto the corpus registry and the stand-in wire):
//   ARM A  the thirds cap removed (`groupCapOf` -> 99)             → red (the thirds case)
//   ARM B  the slam's priority gutted (100 -> 5, no displacement)  → red (the displacement case)
//   ARM C  the ladder swapped (travel above the event painting)    → red (the wedding-away case)
//   ARM D  `ALBUM_MOOD.injury` back to the fall (`'sad'`)          → red (the mood row + the
//          away-injury exception)
//   ARM E  empty chapters emitted (the guards removed)             → red (the lived-but-empty case)
//   ARM F  the flavour re-keyed per CALL (a counter in the key)    → red (the determinism case)
//   ARM G  a fourth sheet at eight frames (`8: [2,2,2,2]`)         → red (the density case)
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { assembleAlbum, ALBUM_MOOD, createWorld, kidAgeAt, type WorldState } from '../src/engine/world'
import type { TierId } from '../src/engine/season/types'
import { ALBUM_CORPUS } from '../src/engine/world/albumCorpus'
import type { AlbumBook, AlbumSheetModel, Milestone } from '../src/shared/protocol'

const PUBLIC = fileURLToPath(new URL('../public', import.meta.url))

/** The first week she is `age` – the album's own clock (`kidAgeAt`), scanned rather than assumed,
 *  so a birth-month change cannot silently re-band every case. */
function weekAtAge(world: WorldState, age: number): number {
  for (let w = 0; w < 2000; w++) if (kidAgeAt(world, w) === age) return w
  throw new Error(`no week reaches age ${age}`)
}

function probe(seed: string): WorldState {
  return createWorld(seed)
}

function title(week: number, tier: TierId = 'j30'): Milestone {
  return { type: 'title', week, tier }
}

function frames(book: AlbumBook): { sheet: AlbumSheetModel; caption: string; art: string }[] {
  return book.sheets.flatMap((sheet) => sheet.frames.map((f) => ({ sheet, caption: f.caption, art: f.art })))
}

/** The corpus row a rendered caption came from – the reverse lookup the assertions read occasions
 *  through, since the wire deliberately carries WORDS and not ids. */
function occasionsOf(book: AlbumBook, voice: 'sunny' | 'fiery' | 'quiet' | 'deep'): string[] {
  return frames(book).map(({ caption }) => {
    const row = ALBUM_CORPUS.find((o) => o.voices[voice].caption === caption)
    if (!row) throw new Error(`no corpus occasion renders the caption «${caption}»`)
    return row.id
  })
}

/** His two guarantees, swept over any book: no empty chapters, no empty sheets, 1–3 sheets per
 *  chapter – «сколько прошла, столько и покажем». */
function sweepNoEmpties(book: AlbumBook): void {
  expect(book.sheets.length, 'a book with chapters has sheets').toBe(
    book.chapters.reduce((n, c) => n + c.sheetCount, 0),
  )
  for (const chapter of book.chapters) {
    expect(chapter.sheetCount, `chapter ${chapter.index}: a chapter that exists has sheets`).toBeGreaterThanOrEqual(1)
    expect(chapter.sheetCount, `chapter ${chapter.index}: 1-3 sheets, ruled`).toBeLessThanOrEqual(3)
    const own = book.sheets.filter((s) => s.chapterIndex === chapter.index)
    expect(own.length, `chapter ${chapter.index}: the flat list agrees with the row`).toBe(chapter.sheetCount)
    expect(own[0], `chapter ${chapter.index}: firstSheet points at its own opener`).toBe(book.sheets[chapter.firstSheet])
    for (const sheet of own) {
      expect(sheet.frames.length, `${sheet.id}: never empty`).toBeGreaterThanOrEqual(1)
      expect(sheet.frames.length, `${sheet.id}: at most three frames`).toBeLessThanOrEqual(3)
      if (sheet.layout !== 'B') expect(sheet.frames.length, `${sheet.id}: an opener draws two at most`).toBeLessThanOrEqual(2)
    }
  }
}

// ⚠⚠ THE §WIRE PIN RETIRED WITH ITS SUBJECT, 19.09 (the seam wave). It held
// `src/components/album/albumWire.ts` and `src/shared/protocol/album.ts` assignable in BOTH
// directions while the two declarations existed side by side, so neither could drift while the UI
// and the engine were built in parallel on this branch. The stand-in's importers are re-pointed at
// the protocol barrel and the file is DELETED – there is no second declaration left to compare, and
// a pin comparing a type with itself asserts nothing. ⭐ The verdict it was holding: the two shapes
// were still identical to the field when they were joined, so the join was a rename and not a
// redesign. The shapes themselves are asserted against the running engine by every case below.

describe('chapters exist exactly where something was lived AND earned', () => {
  it('a wizard career with an empty ledger has NO chapters – and no prologue chapter ever', () => {
    const world = probe('album-empty')
    const book = assembleAlbum(world)
    expect(book.chapters, 'nothing earned, nothing shown').toEqual([])
    expect(book.sheets).toEqual([])
  })

  it('one title makes one chapter, in its own band, and no others', () => {
    const world = probe('album-one')
    const w = weekAtAge(world, 15)
    world.week = w + 1
    world.milestones.push(title(w))
    const book = assembleAlbum(world)
    expect(book.chapters.length).toBe(1)
    expect(book.chapters[0].title, 'the young band\'s draft heading').toBe('Growing up')
    sweepNoEmpties(book)
  })

  it('a band LIVED but empty of frames earns no chapter – lived alone is not enough', () => {
    // she is twenty – `young` AND `teen` are both lived – and only `young` ever earned a frame:
    // a chapter of nothing is exactly the page his principle forbids
    const world = probe('album-lived-empty')
    world.week = weekAtAge(world, 20)
    world.milestones.push(title(weekAtAge(world, 15)))
    const book = assembleAlbum(world)
    expect(book.chapters.length, 'no empty teen chapter, however truly lived').toBe(1)
    sweepNoEmpties(book)
  })

  it('the prologue chapter exists iff the trace is non-null AND holds a moment', () => {
    const world = probe('album-prologue')
    world.milestones.push(title(weekAtAge(world, 15)))
    expect(assembleAlbum(world).chapters.length, 'null trace – the wizard case').toBe(1)
    // ⚠ an EMPTY trace is a crafted edge (no engine path writes one): honestly no moment, no chapter
    world.prologueTrace = { picks: {}, entries: {}, opens: [] }
    expect(assembleAlbum(world).chapters.length, 'a trace with no moment earns no page').toBe(1)
    world.prologueTrace = {
      picks: { 6: 'court-weekends' },
      entries: { 11: 'enter-open' },
      opens: [{ age: 11, index: 0, finish: 0, rounds: 3, wins: 3, outcome: 'won' }],
    }
    const book = assembleAlbum(world)
    expect(book.chapters.length).toBe(2)
    expect(book.chapters[0].index, 'the childhood opens the book').toBe(1)
    const occasions = occasionsOf(book, world.temperament!)
    expect(occasions).toContain('first-court')
    expect(occasions, 'the cup outranks the plain first-weekend reading of the same Saturday').toContain('first-cup')
    // the first-court frame is the jun-training painting – written exactly for this chapter
    const court = frames(book)[occasions.indexOf('first-court')]
    expect(court.art).toBe('images/fem-euro-brunnet/fem-euro-brunnet-jun-training.webp')
    const opener = book.sheets[0]
    expect(opener.note, 'a prologue note carries the age and honestly no career date').not.toBeNull()
    expect(opener.note!.dateLabel).toBeNull()
    expect(opener.note!.ageLabel).toMatch(/^Age \d+$/)
    sweepNoEmpties(book)
  })
})

describe('density and the thirds rule – representatives, never the injury ward', () => {
  it('a dense band caps at 3 sheets and 8 frames; every art path names a file on disk', () => {
    const world = probe('album-density')
    const base = weekAtAge(world, 14)
    world.week = weekAtAge(world, 16) + 40
    const tiers: TierId[] = ['local', 'regional', 'national', 'j30', 'j60', 'j300']
    tiers.forEach((tier, i) => world.milestones.push(title(base + i * 4, tier)))
    world.milestones.push({ type: 'prize', week: base + 30, tier: 'j30' })
    world.milestones.push({ type: 'international', week: base + 34, tier: 'j30' })
    world.milestones.push({ type: 'school', week: base + 38 })
    world.milestones.push({ type: 'injury', week: base + 42, kind: 'ankle soreness' })
    world.milestones.push({ type: 'season-rank', week: base + 46, seasonIndex: 1, rank: 40 })
    // ⚠ NOT break-even: the corpus declares its bands as teen+ (measured median 16 – §4 of the
    // corpus doc), so a young-band crossing has no handwriting and honestly earns no frame
    world.milestones.push({ type: 'final', week: base + 2, tier: 'j30' })
    const book = assembleAlbum(world)
    expect(book.sheets.length, 'dense period, the ruled ceiling').toBe(3)
    const all = frames(book)
    expect(all.length, 'the budget fills to its ceiling here – the arm the splits are measured by').toBe(8)
    for (const { art } of all) {
      expect(existsSync(`${PUBLIC}/${art}`), `${art} names a painting on disk`).toBe(true)
    }
    sweepNoEmpties(book)
  })

  it('no corpus kind takes more than a third of a chapter (floor one), however loud the bulk', () => {
    const world = probe('album-thirds')
    const base = weekAtAge(world, 24)
    world.week = base + 300
    // the measured adult-years bulk: season closes, eight of them, against one title
    for (let s = 0; s < 8; s++) {
      world.milestones.push({ type: 'season-rank', week: base + s * 4, seasonIndex: 10 + s, rank: 30 - s })
    }
    world.milestones.push(title(base + 2, 'w75'))
    const book = assembleAlbum(world)
    const occasions = occasionsOf(book, world.temperament!)
    const closes = occasions.filter((id) => id.startsWith('season-')).length
    const cap = Math.max(1, Math.floor(occasions.length / 3))
    expect(closes, `season closes hold ${closes} of ${occasions.length}`).toBeLessThanOrEqual(cap)
    expect(occasions, 'the title is never crowded out by bulk').toContain('first-title')
  })

  it('a super-rare DISPLACES an ordinary representative – the budget does not grow', () => {
    const world = probe('album-super')
    const base = weekAtAge(world, 24)
    world.week = base + 300
    const tiers: TierId[] = ['w15', 'w35', 'w50', 'w75', 'w100', 'wta125']
    tiers.forEach((tier, i) => world.milestones.push(title(base + i * 8, tier)))
    world.milestones.push({ type: 'final', week: base + 62, tier: 'w75' })
    world.milestones.push({ type: 'break-even', week: base + 64, kind: 'career' })
    world.milestones.push({ type: 'injury', week: base + 72, kind: 'ankle soreness' })
    world.injuryHistory.push({ kind: 'ankle soreness', severity: 'moderate', week: base + 78, weeksOut: 6 })
    world.milestones.push({ type: 'wedding', week: base + 84, kind: 'p:1' })
    world.assets.push({ id: 'house-first', boughtWeek: base + 88, paidCents: 0, valueCents: 0, entries: [] })
    world.assets.push({ id: 'merch-brand', boughtWeek: base + 92, paidCents: 0, valueCents: 0, entries: [] })
    const before = frames(assembleAlbum(world)).length
    expect(before, 'the chapter is FULL before the slam lands, or displacement proves nothing').toBe(8)
    // now the slam lands: the gate is the high-water mark, the week is the titles ledger's (v31)
    world.bestFinishByTier.slam = 0
    world.trophiesByTier.slam.titles.push(base + 90)
    const book = assembleAlbum(world)
    const occasions = occasionsOf(book, world.temperament!)
    expect(occasions, 'the slam is in').toContain('top-tier-title')
    expect(frames(book).length, 'and the budget did not grow – something ordinary left').toBeLessThanOrEqual(before)
  })
})

describe('the ladder: event painting beats travel beats portrait', () => {
  it('a wedding on an away week still resolves to the bride painting, band-resolved', () => {
    const world = probe('album-ladder-event')
    const w = weekAtAge(world, 24)
    world.week = w + 10
    world.milestones.push({ type: 'wedding', week: w, kind: 'p:1' })
    world.proEntryWeeks.push(w)
    const art = frames(assembleAlbum(world))[0].art
    expect(art).toBe('images/fem-euro-brunnet/fem-euro-brunnet-adult-bride.webp')
    expect(existsSync(`${PUBLIC}/${art}`)).toBe(true)
  })

  it('a title at an away event is the journey home, happy; at home it is the band portrait', () => {
    const world = probe('album-ladder-travel')
    const away = weekAtAge(world, 18)
    const home = away + 8
    world.week = home + 10
    world.milestones.push(title(away, 'j60'), { type: 'prize', week: home, tier: 'w15' })
    world.internationalEntryWeeks.push(away)
    const book = assembleAlbum(world)
    const occasions = occasionsOf(book, world.temperament!)
    const all = frames(book)
    const travelled = all[occasions.indexOf('first-title')]
    expect(travelled.art).toMatch(/travel-happy-(airport|plane|bus|car)\.webp$/)
    const stayed = all[occasions.indexOf('first-prize')]
    expect(stayed.art).toBe('images/fem-euro-brunnet/fem-euro-brunnet-teen-happy.webp')
  })

  it('⚠ the ruled exception: an injury on an away week never becomes a sad journey – the album shows the comeback', () => {
    const world = probe('album-ladder-injury')
    const w = weekAtAge(world, 18)
    world.week = w + 10
    world.milestones.push({ type: 'injury', week: w, kind: 'ankle soreness' })
    world.internationalEntryWeeks.push(w)
    const art = frames(assembleAlbum(world))[0].art
    expect(art, '«альбом помнит, как она вставала, а не как падала»').toBe(
      'images/fem-euro-brunnet/fem-euro-brunnet-teen-rehab.webp',
    )
  })
})

describe('the mood table – ruled 19.09, written once', () => {
  it('title -> happy and injury -> rehab, the two rows his ruling names, and a row for every non-closing occasion', () => {
    expect(ALBUM_MOOD['first-title']).toBe('happy')
    expect(ALBUM_MOOD.injury).toBe('rehab')
    expect(ALBUM_MOOD['injury-return']).toBe('rehab')
    for (const o of ALBUM_CORPUS) {
      expect(ALBUM_MOOD[o.id], `${o.id} has a mood row`).toBeDefined()
    }
  })
})

describe('the closers – ruled: graduated where a college happened, farewell, then retired last', () => {
  it('an ended career closes on farewell then retired, and retired is the very last frame of the book', () => {
    const world = probe('album-ending')
    const w = weekAtAge(world, 31)
    world.week = w + 2
    world.milestones.push(title(w - 10, 'wta250'))
    world.ending = { type: 'natural', week: w, ageYears: 31, detail: 'probe', resumesWeek: null }
    const book = assembleAlbum(world)
    const occasions = occasionsOf(book, world.temperament!)
    expect(occasions[occasions.length - 1], 'the book ends on retired').toBe('retired')
    expect(occasions[occasions.length - 2], 'the last match stands beside it').toBe('farewell')
    const all = frames(book)
    expect(all[all.length - 1].art).toBe('images/fem-euro-brunnet/fem-euro-brunnet-lateCareer-retired.webp')
    expect(all[all.length - 2].art).toBe('images/fem-euro-brunnet/fem-euro-brunnet-lateCareer-farewell.webp')
    sweepNoEmpties(book)
  })

  it('graduated appears only for the FULL course – a leaver gets no graduation frame', () => {
    const world = probe('album-college')
    const w = weekAtAge(world, 23)
    world.week = w + 10
    world.milestones.push(title(w + 2, 'w15'))
    const year = { startWeek: 0 } as never
    world.college = {
      fromWeek: w - 208,
      untilWeek: w,
      doneWeek: w,
      years: [year, year, year, year],
      pendingCallUp: null,
      pendingLeague: null,
    }
    expect(occasionsOf(assembleAlbum(world), world.temperament!), 'four banked years – the full course').toContain('graduated')
    world.college.years = [year]
    expect(
      occasionsOf(assembleAlbum(world), world.temperament!),
      'one year is a leaver – no graduation frame on any surface',
    ).not.toContain('graduated')
  })
})

describe('the arc – displacing the closing sheet\'s words when the lean moved, and only then', () => {
  it('a still lean keeps A32\'s own closing words – nothing is written for the never-drifted', () => {
    const world = probe('album-arc-still')
    const w = weekAtAge(world, 31)
    world.week = w + 2
    world.milestones.push(title(w - 10, 'wta250'))
    world.ending = { type: 'natural', week: w, ageYears: 31, detail: 'probe', resumesWeek: null }
    const closing = assembleAlbum(world).sheets.at(-1)!
    const retired = ALBUM_CORPUS.find((o) => o.id === 'retired')!.voices[world.temperament!]
    expect(closing.note!.text, 'the ordinary closing note is A32\'s own').toBe(retired.note)
    expect(closing.line).toBe(retired.line)
  })

  it('a moved OPEN lean replaces the closing note and line with the arc\'s cell for her voice', () => {
    const world = probe('album-arc-moved')
    const w = weekAtAge(world, 31)
    world.week = w + 2
    world.milestones.push(title(w - 10, 'wta250'))
    world.ending = { type: 'natural', week: w, ageYears: 31, detail: 'probe', resumesWeek: null }
    world.wallsLean = { open: 3, reg: 0 }
    const book = assembleAlbum(world)
    const closing = book.sheets.at(-1)!
    const retired = ALBUM_CORPUS.find((o) => o.id === 'retired')!.voices[world.temperament!]
    expect(closing.note!.text, 'the arc displaced the ordinary note').not.toBe(retired.note)
    expect(closing.line).not.toBe(retired.line)
    // ...and ONLY the closing sheet carries it: every other sheet keeps its own occasion's words
    for (const sheet of book.sheets.slice(0, -1)) {
      expect(sheet.line, `${sheet.id} keeps its own line`).not.toBe(closing.line)
    }
    // a live career never writes the arc, whatever the lean did
    world.ending = null
    const live = assembleAlbum(world).sheets.at(-1)!
    expect(live.line, 'no closing sheet mid-career, no arc mid-career').not.toBe(closing.line)
  })
})

describe('tickets, tags and the flavour – real facts, drawn антураж, and determinism', () => {
  it('a B sheet holding a title carries a boarding pass with the FICTIONAL tier name', () => {
    const world = probe('album-ticket')
    const base = weekAtAge(world, 18)
    world.week = base + 60
    // chronology puts the quiet facts first so a TITLE lands on an ordinary sheet, not the opener
    world.milestones.push({ type: 'school', week: base })
    world.milestones.push({ type: 'prize', week: base + 4, tier: 'w15' })
    world.milestones.push(title(base + 8, 'j30'))
    world.milestones.push({ type: 'international', week: base + 12, tier: 'j30' })
    world.milestones.push(title(base + 16, 'w15'))
    world.milestones.push({ type: 'injury', week: base + 20, kind: 'ankle soreness' })
    const book = assembleAlbum(world)
    const b = book.sheets.find((s) => s.layout === 'B' && s.ticket)
    expect(b, 'a dense chapter has an ordinary sheet with a boarding pass').toBeDefined()
    const ticket = b!.ticket!
    expect(ticket.tier, 'the calendar\'s own name, never a trademark').not.toMatch(/ITF|WTA|ATP/)
    expect(ticket.tier.length).toBeGreaterThan(0)
    expect(ticket.stage, 'a title frame reads the draw sheet\'s own word').toBe('Champion')
    expect(ticket.bars.length).toBe(12)
    expect(ticket.seat).toMatch(/^Seat \d+[A-F]$/)
  })

  it('two assemblies of one world are deep-equal – flavour included – and the world is untouched', () => {
    const world = probe('album-determinism')
    const base = weekAtAge(world, 15)
    world.week = base + 60
    world.milestones.push(title(base), { type: 'prize', week: base + 6, tier: 'j30' }, { type: 'school', week: base + 12 })
    world.prologueTrace = { picks: { 6: 'a' }, entries: {}, opens: [] }
    const before = JSON.stringify(world)
    const one = assembleAlbum(world)
    const two = assembleAlbum(world)
    expect(two, 'the book does not flicker – his «чтобы не мигал»').toEqual(one)
    expect(JSON.stringify(world), 'a pure read: not one byte of the world moved, rngMain included').toBe(before)
  })
})

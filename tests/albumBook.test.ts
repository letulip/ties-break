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
// The rank-ramp and second-axis work added five more (20.09), each applied, run and restored:
//   ARM H  `wallsGrowable`'s reg arm asks for 'steady'              → 1 red (the fiery case: her
//          regulation stops moving, so the state the arc gap lives in stops being reachable)
//   ARM I  the arc fires on EITHER axis (`open || reg`)             → 1 red (the fiery case: the
//          closing sheet takes an OPENNESS sentence for a girl whose openness never moved)
//   ARM J  the kick branch doubled on `reg` alone                   → 1 red (the both-axes case)
//   ARM K  `ALBUM_TIER_STEP.slam` -> 'budget'                       → 1 red (the ramp order)
//   ARM L  `ticketOf` hard-codes `step: 'elite'`                    → 1 red (the printed case)
// His five contract blockers added five more (20.09), each applied to `albumBook.ts`, run, restored:
//   ARM M  the first-court age back to `picks`' first key            → 1 red (scenario 1: the frame
//          is dated at eight, which is where the first PICK is and not where the court is)
//   ARM N  the season routing back to three arms (`rank <= prev`)    → 1 red (scenario 2: the climb
//          back from #80 to #40 prints «A year of holding on»)
//   ARM O  the built rungs back to `boughtWeek`                      → 1 red (scenario 3: the courts
//          go in on the week the money left, years before they exist)
//   ARM P  both closers back on any `world.ending`                   → 1 red (scenario 4: a college
//          latch that resumes is handed the last page of the album)
//   ARM Q  the layouts back to opener-B-B                            → 2 red (the rotation case and
//          the density sweep: a chapter of three sheets shows two of them the same)
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { assembleAlbum, ALBUM_MOOD, createWorld, deliverAssets, kidAgeAt, TEMPERAMENTS, type WorldState } from '../src/engine/world'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'
import { ECONOMY } from '../src/engine/economy'
import { ENDING_BLURB } from '../src/engine/ending'
import { driftWalls, type Temperament } from '../src/engine/spirit'
import { ALBUM_CORPUS } from '../src/engine/world/albumCorpus'
import { ALBUM_CLOSING_FAMILY, ALBUM_TIER_STEP } from '../src/engine/world/albumBook'
import { PROLOGUE_CARDS } from '../src/prologue/cards'
import { EMPTY_RUN, traceOf, withEntry, withOpen, withPick } from '../src/prologue/run'
import { weekSpan } from '../src/shared/dates'
import { FIRST_COURT_AGE } from '../src/shared/protocol'
import type { AlbumBook, AlbumSheetModel, AlbumTierStep, CareerEndingType, Milestone } from '../src/shared/protocol'

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

/** A seed that draws the girl we need – SEARCHED, never a magic string, because `createWorld` draws
 *  her off `seed:temperament` and a hand-picked seed would silently repoint at a different girl the
 *  day that draw is re-ordered (`tests/wave5-psychologist-walls.test.ts` keeps the same helper for
 *  the same reason). Throws rather than falling back: a case that quietly ran on the wrong
 *  temperament is a case that proves nothing. */
function seedBorn(born: Temperament): string {
  for (let i = 0; i < 2000; i++) {
    const seed = `album-born-${i}`
    if (createWorld(seed).temperament === born) return seed
  }
  throw new Error(`no seed in 2000 draws a ${born} girl`)
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
    // ⭐ HIS 20.09 RE-RULING, swept on every book rather than pinned in one case: «хочется, чтобы
    // одинаковых подряд просто не было и всё». A chapter of three sheets shows all three layouts,
    // and no chapter opens on B – the only layout that draws no chapter heading.
    if (own.length === MAX_SHEETS) {
      expect(new Set(own.map((s) => s.layout)).size, `chapter ${chapter.index}: three sheets, three layouts`).toBe(3)
    }
    expect(own[0].layout, `chapter ${chapter.index}: a chapter cannot open on the sheet with no name on it`).not.toBe('B')
  }
  for (const [i, sheet] of book.sheets.entries()) {
    if (i === 0) continue
    expect(sheet.layout, `${sheet.id}: two sheets in a row on the same layout`).not.toBe(book.sheets[i - 1].layout)
  }
}

/** The ruled «1-3 страницы на каждую главу», spelled once here so a case can ask for the dense arm
 *  without repeating the number. */
const MAX_SHEETS = 3

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
    // ⚠⚠ THE PICKS START AT EIGHT, WHICH IS WHAT A WALKED CHILDHOOD WRITES. This fixture carried
    // `picks: { 6: … }` until 20.09 and that invention was half of his blocker 3: the album read the
    // first pick's age as the age of the first day on court, the test handed it a six-year-old pick
    // no engine path can produce, and the defect was hidden by its own fixture. The real first pick
    // is the age-8 card (`club` / `municipal`); the court scene is the age-6 card, which has no
    // options at all. `a real prologue, and the first day on court is at six` below walks the real
    // cards rather than posing a trace.
    world.prologueTrace = {
      picks: { 8: 'club', 9: 'group' },
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
    // ⚠ SEVEN AND NOT EIGHT SINCE 20.09, and the number follows the layout rotation he re-ruled:
    // three sheets are one A, one B and one C in some order (2 + 3 + 2), where the old opener-B-B
    // held 2 + 3 + 3. Two B sheets in a chapter of three means two of them adjacent, which is the
    // one thing his rule forbids.
    expect(all.length, 'the budget fills to its ceiling here – the arm the splits are measured by').toBe(7)
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
    // ⚠ SEVEN since the 20.09 layout rotation: three sheets are A + B + C, which is 2 + 3 + 2
    expect(before, 'the chapter is FULL before the slam lands, or displacement proves nothing').toBe(7)
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

describe('the closers – ruled: graduated where a college happened, farewell, then the last page', () => {
  it('an ended career closes on farewell then career-ended, and career-ended is the very last frame of the book', () => {
    const world = probe('album-ending')
    const w = weekAtAge(world, 31)
    world.week = w + 12
    // the last match the save can prove – a title in the final chapter, four weeks before she stopped
    world.milestones.push(title(w + 4, 'wta250'))
    world.ending = { type: 'natural', week: w + 10, ageYears: 31, detail: 'probe', resumesWeek: null }
    const book = assembleAlbum(world)
    const occasions = occasionsOf(book, world.temperament!)
    expect(occasions[occasions.length - 1], 'the book ends on the last page').toBe('career-ended')
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
    const retired = ALBUM_CORPUS.find((o) => o.id === 'career-ended')!.voices[world.temperament!]
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
    const retired = ALBUM_CORPUS.find((o) => o.id === 'career-ended')!.voices[world.temperament!]
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

  // ⚠⚠ THE SECOND AXIS, REACHED THROUGH THE REAL WRITER AND NOT POSED (20.09).
  //
  // `assembleAlbum` writes the arc iff `wallsLean.open !== 0`, and spec §4b measured the two axes
  // moving together and equally on the only two drifted saves he had – which is exactly the evidence
  // that makes a reg-only career look impossible. It is not. `driftWalls` moves ONE axis alone in
  // exactly one branch (growth beyond her baseline, which needs `wallsGrowable`), and that predicate
  // splits the two mixed temperaments: `fiery` is open+intense, so her `reg` grows while her `open`
  // is clamped at her nature. This case earns that state by RUNNING the pass, so it fails if the
  // engine ever closes the door – which is the whole point of proving reachability rather than
  // asserting it. The album's behaviour is then pinned as it stands: the ordinary closing sheet,
  // because the corpus has no regulation-axis sentences and those are the owner's to write.
  it('⚠ a fiery girl\'s reg-only drift is REACHABLE – and takes the ordinary closing sheet', () => {
    const seed = seedBorn('fiery')
    const world = probe(seed)
    expect(world.temperament, 'the seed search found her').toBe('fiery')

    // a caring bond, the seat hired and the focus she chose for herself – §2a's three conditions
    world.bond = ECONOMY.bond.band.close + 5
    world.psychologistHired = true
    world.psychologistFocus = 'herself'
    world.psychologistRung = 1
    for (let i = 0; i < 20; i++) {
      world.week += 1
      driftWalls(world, true)
    }

    expect(world.wallsLean.reg, 'her regulation moved – twenty weeks of her own work').toBeGreaterThan(0)
    expect(world.wallsLean.open, 'and her openness did not: clamped at her nature, nothing to grow').toBe(0)

    const w = weekAtAge(world, 31)
    world.week = w + 2
    world.milestones.push(title(w - 10, 'wta250'))
    world.ending = { type: 'natural', week: w, ageYears: 31, detail: 'probe', resumesWeek: null }
    const closing = assembleAlbum(world).sheets.at(-1)!
    const retired = ALBUM_CORPUS.find((o) => o.id === 'career-ended')!.voices.fiery
    expect(closing.note!.text, 'no arc: the corpus has no words for the regulation axis').toBe(retired.note)
    expect(closing.line).toBe(retired.line)

    // ...and the same career WOULD have taken the arc had the openness axis been the one that moved,
    // so the case above is a statement about the axis and not about this world being arc-proof
    world.wallsLean = { open: world.wallsLean.reg, reg: 0 }
    const moved = assembleAlbum(world).sheets.at(-1)!
    expect(moved.line, 'the same world on the open axis does take the arc').not.toBe(retired.line)
  })

  // ⚠ THE OTHER HALF OF THE SAME TRACE: a career that was only ever kicked (or only ever healed)
  // carries `open === reg` at every week, because every branch except growth treats the two axes
  // identically. This is what makes §4b's `{43, 43}` and `{66, 66}` the expected reading rather than
  // a coincidence – and it is why the open axis alone is a sufficient test for every career EXCEPT
  // the two mixed births.
  it('kicks move both axes equally – the arc condition is complete for every career but fiery\'s', () => {
    for (const born of TEMPERAMENTS) {
      const world = probe(seedBorn(born))
      world.bond = ECONOMY.bond.band.strained - 5 // cold: the kick branch, on both axes
      for (let i = 0; i < 12; i++) {
        world.week += 1
        driftWalls(world, false)
      }
      expect(world.wallsLean.open, `${born}: kicked, and both axes moved the same`).toBeLessThan(0)
      expect(world.wallsLean.open, `${born}: neither axis outran the other`).toBe(world.wallsLean.reg)
    }
  })
})

describe('the rank\'s step on the app\'s four-step ramp (spec §4)', () => {
  it('every rung the calendar ships has a step, and the ladder never steps DOWN the ramp', () => {
    const order: AlbumTierStep[] = ['budget', 'middle', 'high', 'elite']
    expect(TIER_LADDER.length, 'the whole ladder is walked').toBeGreaterThan(0)
    for (const [i, rung] of TIER_LADDER.entries()) {
      const step = ALBUM_TIER_STEP[rung]
      expect(order, `${rung} has no step on the ramp`).toContain(step)
      if (i > 0) {
        expect(
          order.indexOf(step),
          `${rung} sits above ${TIER_LADDER[i - 1]} on the ladder – «чем выше ступень, тем насыщеннее»`,
        ).toBeGreaterThanOrEqual(order.indexOf(ALBUM_TIER_STEP[TIER_LADDER[i - 1]]))
      }
    }
    expect(new Set(TIER_LADDER.map((t) => ALBUM_TIER_STEP[t])).size, 'all four steps are used').toBe(4)
  })

  it('a pass and a tag carry the step their own tier maps to', () => {
    const world = probe('album-ticket-step')
    const base = weekAtAge(world, 18)
    world.week = base + 60
    world.milestones.push({ type: 'school', week: base })
    world.milestones.push({ type: 'prize', week: base + 4, tier: 'w15' })
    world.milestones.push(title(base + 8, 'j30'))
    world.milestones.push({ type: 'international', week: base + 12, tier: 'j30' })
    world.milestones.push(title(base + 16, 'w15'))
    world.milestones.push({ type: 'injury', week: base + 20, kind: 'ankle soreness' })
    const printed = assembleAlbum(world)
      .sheets.flatMap((s) => [s.ticket, s.tag])
      .filter((x): x is NonNullable<typeof x> => x !== null)
    expect(printed.length, 'the dense chapter printed at least one pass or tag').toBeGreaterThan(0)
    for (const item of printed) {
      // the label is the only handle the wire gives back to the rung, which is the argument for
      // shipping the step at all – done here in a TEST, where a wrong answer is a red line
      const rung = TIER_LADDER.find((t) => TIERS[t].label === item.tier)
      expect(rung, `«${item.tier}» is not a rung of our own calendar`).toBeDefined()
      expect(item.step, `«${item.tier}» must print on its own step`).toBe(ALBUM_TIER_STEP[rung!])
    }
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
    world.prologueTrace = { picks: { 8: 'club' }, entries: {}, opens: [] }
    const before = JSON.stringify(world)
    const one = assembleAlbum(world)
    const two = assembleAlbum(world)
    expect(two, 'the book does not flicker – his «чтобы не мигал»').toEqual(one)
    expect(JSON.stringify(world), 'a pure read: not one byte of the world moved, rngMain included').toBe(before)
  })
})

// =================================================================================================
// HIS FOUR SCENARIO CASES, 20.09 – «хорошие строки могут описывать событие, которого в карьере не
// было»
// =================================================================================================
//
// ⚠⚠ SCENARIOS AND NOT A WORD BLACKLIST, WHICH IS HIS OWN RULING ON HOW TO TEST THIS: «будет много
// ложных тревог. Лучше проверять смысловые источники на уровне сценариев». A sweep for the word
// «built» would redden on `A24`'s field and stay green on the real defect, which was a TRUE sentence
// printed against a FALSE date. Each case below builds the career that must not get the page and
// asks whether the page came.

describe('the layout rotation – his 20.09 re-ruling', () => {
  // ⭐⭐ «я бы хотел, чтобы в главах были все листы, а порядок уже значения не имеет. Хочется, чтобы
  // одинаковых подряд просто не было и всё… Или сразу как-то задать набор непересекающихся и
  // недублирующихся подряд страниц, а потом его по факту заполнять, пропуская невостребованные.»
  // This supersedes both «дальше B» and the openers' own alternation: one cursor over A, B, C runs
  // the whole book and every sheet takes the next one.
  it('a dense book shows all three layouts, none twice in a row, and never opens a chapter on B', () => {
    const world = probe('album-rotation')
    const teen = weekAtAge(world, 18)
    const adult = weekAtAge(world, 24)
    world.week = adult + 200
    // a dense teen period – three sheets' worth – and a second chapter after it, so the rule is
    // measured ACROSS the chapter break as well as inside a chapter
    const tiers: TierId[] = ['local', 'regional', 'national', 'j30']
    tiers.forEach((tier, i) => world.milestones.push(title(teen + i * 4, tier)))
    world.milestones.push({ type: 'prize', week: teen + 20, tier: 'j30' })
    world.milestones.push({ type: 'international', week: teen + 24, tier: 'j30' })
    world.milestones.push({ type: 'school', week: teen + 28 })
    world.milestones.push({ type: 'injury', week: teen + 32, kind: 'ankle soreness' })
    world.milestones.push(title(adult + 4, 'w75'), title(adult + 40, 'wta250'))
    world.milestones.push({ type: 'wedding', week: adult + 20, kind: 'p:1' })
    world.assets.push({ id: 'house-first', boughtWeek: adult + 60, paidCents: 0, valueCents: 0, entries: [] })

    const book = assembleAlbum(world)
    expect(book.chapters.length, 'two chapters, so the break itself is under test').toBeGreaterThanOrEqual(2)
    const dense = book.chapters.find((c) => c.sheetCount === 3)
    expect(dense, 'a period dense enough to earn three sheets').toBeDefined()
    const own = book.sheets.filter((s) => s.chapterIndex === dense!.index)
    expect(own.map((s) => s.layout).sort(), 'all three layouts live inside the chapter').toEqual(['A', 'B', 'C'])
    expect(new Set(book.sheets.map((s) => s.layout)).size, 'and the book uses all three').toBe(3)
    // the sweep asserts the no-repeat rule over every book; stated here too, because it is the whole
    // of what he asked for and a reader of this file should not have to find it in a helper
    for (const [i, sheet] of book.sheets.entries()) {
      if (i > 0) expect(sheet.layout, `${sheet.id} repeats ${book.sheets[i - 1].id}`).not.toBe(book.sheets[i - 1].layout)
    }
    sweepNoEmpties(book)
  })
})

describe('⭐⭐ the four scenarios: a sentence is only printed where its own fact is', () => {
  it('1 · a real prologue, walked through the real cards, dates the first day on court at six', () => {
    // ⚠⚠ THE TRACE IS BUILT BY THE PROLOGUE'S OWN FUNCTIONS, not posed. That is the whole point of
    // this case: the old fixture invented `picks: { 6: … }`, which is precisely the row a walked
    // childhood cannot contain, and the invention hid the defect it was standing in for.
    let run = EMPTY_RUN
    run = withPick(run, 8, 'club')
    run = withPick(run, 9, 'one-to-one')
    run = withEntry(run, 10, 'enter-open')
    run = withPick(run, 10, 'enter')
    run = withOpen(run, { age: 10, index: 0, finish: 2, rounds: 3, wins: 1, outcome: 'lost' })
    run = withPick(run, 11, 'sports-school')
    const trace = traceOf(run)

    const ages = Object.keys(trace.picks).map(Number).sort((a, b) => a - b)
    expect(ages[0], 'a walked childhood writes its first pick at eight – the club card').toBe(8)
    expect(trace.picks[FIRST_COURT_AGE], 'and writes nothing at all at six').toBeUndefined()

    // the card table's own row for that age: the fixed scene, and it carries no options to pick from
    const scene = PROLOGUE_CARDS.find((c) => c.age === FIRST_COURT_AGE)
    expect(scene, 'the prologue has a card at FIRST_COURT_AGE').toBeDefined()
    expect(scene!.options, 'the first day on court is a scene, not a choice – so it always happens').toBeUndefined()

    const world = probe('album-first-court')
    world.week = weekAtAge(world, 15) + 4
    world.milestones.push(title(weekAtAge(world, 15)))
    world.prologueTrace = trace
    const book = assembleAlbum(world)
    const occasions = occasionsOf(book, world.temperament!)
    expect(occasions[0], 'the childhood opens the book on the day she first stood on a court').toBe('first-court')
    const opener = book.sheets[0]
    expect(opener.note!.ageLabel, 'and it is dated at six, never at the age of the first PICK').toBe(
      `Age ${FIRST_COURT_AGE}`,
    )
    expect(opener.note!.ageLabel, 'the eight the old reading printed').not.toBe(`Age ${ages[0]}`)
    sweepNoEmpties(book)
  })

  it('2 · a recovery season is NOT «a year of holding on» – his own #80 → #40 under a best of #20', () => {
    const world = probe('album-recovery')
    const base = weekAtAge(world, 24)
    world.week = base + 200
    // her best year is behind her, then a bad one, then the climb back – the exact shape he named
    world.milestones.push({ type: 'season-rank', week: base, seasonIndex: 10, rank: 20 })
    world.milestones.push({ type: 'season-rank', week: base + 52, seasonIndex: 11, rank: 80 })
    world.milestones.push({ type: 'season-rank', week: base + 104, seasonIndex: 12, rank: 40 })
    // ⚠ AND ENOUGH OTHER MATERIAL FOR THE THIRDS RULE TO ALLOW TWO SEASON ROWS. With a chapter of
    // nothing but closes the cap is one and the test would measure the cap instead of the gate.
    world.milestones.push(title(base + 8, 'w75'), title(base + 60, 'wta250'))
    world.milestones.push({ type: 'wedding', week: base + 20, kind: 'p:1' })
    world.milestones.push({ type: 'break-even', week: base + 30, kind: 'career' })
    world.assets.push({ id: 'house-first', boughtWeek: base + 40, paidCents: 0, valueCents: 0, entries: [] })
    const occasions = occasionsOf(assembleAlbum(world), world.temperament!)
    expect(occasions, 'the climb back has its own page').toContain('season-recovery')
    expect(occasions, 'and nothing on this career says she stood still').not.toContain('season-held')
    expect(occasions, 'the year that fell is still the year that fell').toContain('season-down')

    // ...and the flat year still reaches `A13`, or the new gate would have closed the page instead
    // of narrowing it: #40 to #41 is inside the band, and the band is what «holding on» now means
    const flat = probe('album-held')
    const at = weekAtAge(flat, 24)
    flat.week = at + 200
    flat.milestones.push({ type: 'season-rank', week: at, seasonIndex: 10, rank: 40 })
    flat.milestones.push({ type: 'season-rank', week: at + 52, seasonIndex: 11, rank: 41 })
    const held = occasionsOf(assembleAlbum(flat), flat.temperament!)
    expect(held, 'a year that really did stand still keeps A13').toContain('season-held')
    expect(held, 'and it is not a recovery').not.toContain('season-recovery')
  })

  it('3 · a build that was ORDERED and never delivered gets no A25 and no A26', () => {
    const world = probe('album-build')
    const ordered = weekAtAge(world, 24)
    world.week = ordered + 40
    // paid for, under construction, nothing standing: `readyWeek` is the shop's own «not here yet»
    world.assets.push({ id: 'academy-courts', boughtWeek: ordered, paidCents: 0, valueCents: 0, entries: [], readyWeek: ordered + 6 })
    world.assets.push({ id: 'academy-building', boughtWeek: ordered + 2, paidCents: 0, valueCents: 0, entries: [], readyWeek: ordered + 32 })
    // ⚠ AND ENOUGH OTHER MATERIAL FOR THE THIRDS RULE TO ALLOW BOTH ASSET ROWS: a chapter of two
    // frames caps a kind at one, and this case is about the gate rather than about the cap.
    world.milestones.push(title(ordered + 2, 'w75'), title(ordered + 6, 'wta250'))
    world.milestones.push({ type: 'wedding', week: ordered + 10, kind: 'p:1' })
    world.milestones.push({ type: 'break-even', week: ordered + 14, kind: 'career' })
    const pending = occasionsOf(assembleAlbum(world), world.temperament!)
    expect(pending, '«The courts went in» is a sentence about a delivery').not.toContain('academy-courts')
    expect(pending, '«The building is up» likewise').not.toContain('academy-built')

    // ⭐ THE DELIVERY IS MADE BY THE ENGINE'S OWN `deliverAssets`, which is where the letter the album
    // reads comes from – his «письмо и альбом будут ссылаться на один факт доставки», proved rather
    // than asserted. The week it lands on is the week the SKIP lands on, not `boughtWeek + buildWeeks`.
    const delivered = ordered + 30
    world.week = delivered
    deliverAssets(world)
    world.week = ordered + 36
    deliverAssets(world)
    world.week = ordered + 40
    const book = assembleAlbum(world)
    const occasions = occasionsOf(book, world.temperament!)
    expect(occasions, 'the courts are in, so the page exists').toContain('academy-courts')
    expect(occasions, 'and so is the clubhouse').toContain('academy-built')
    const sheet = book.sheets.find((s) => s.frames[0].caption === courtsCaption(world))
    expect(sheet, 'the courts drew a sheet, and lead it').toBeDefined()
    expect(sheet!.note!.dateLabel, 'dated to the week it was finished').toBe(weekSpan(delivered))
    expect(sheet!.note!.dateLabel, 'never to the week the money left').not.toBe(weekSpan(ordered))
  })

  it('4 · all eight endings yield admissible closing sheets – and a college latch closes nothing', () => {
    const types = Object.keys(ENDING_BLURB) as CareerEndingType[]
    expect(types.length, 'the union the album must answer for').toBe(8)
    for (const type of types) {
      expect(ALBUM_CLOSING_FAMILY[type], `${type}: every ending belongs to a family`).toBeDefined()

      const world = probe(`album-ending-${type}`)
      const w = weekAtAge(world, 31)
      world.week = w + 12
      const lastMatch = w + 4
      world.milestones.push(title(lastMatch, 'wta250'))
      // ⚠ COLLEGE IS THE ONE THAT RESUMES, and it carries its own `resumesWeek` exactly as the engine
      // writes it – his ruling: it is not a final page at all while she is coming back.
      const resumes = type === 'college' ? w + 62 : null
      world.ending = { type, week: w + 10, ageYears: 31, detail: 'probe', resumesWeek: resumes }
      const occasions = occasionsOf(assembleAlbum(world), world.temperament!)

      if (type === 'college') {
        expect(occasions, `${type}: she is coming back – no last page`).not.toContain('career-ended')
        expect(occasions, `${type}: and no farewell either`).not.toContain('farewell')
        continue
      }
      expect(occasions[occasions.length - 1], `${type}: the book closes`).toBe('career-ended')
      expect(occasions, `${type}: a last match was played, so the farewell is true`).toContain('farewell')
    }

    // ⚠⚠ AND THE FAREWELL IS THE LAST MATCH's WEEK, NOT THE ENDING's – the half of blocker 1 that is
    // a DATE. She stopped playing long before the story stopped: the sheet is dated where she last
    // stood on a court.
    const late = probe('album-farewell-date')
    const w = weekAtAge(late, 31)
    late.week = w + 60
    const lastMatch = w + 2
    late.milestones.push(title(lastMatch, 'wta250'))
    late.ending = { type: 'injury', week: w + 50, ageYears: 32, detail: 'probe', resumesWeek: null }
    const dated = assembleAlbum(late)
    const withFarewell = dated.sheets.find((s) => s.frames.some((f) => f.art.endsWith('lateCareer-farewell.webp')))
    expect(withFarewell, 'the farewell drew a sheet').toBeDefined()
    expect(withFarewell!.note!.dateLabel, 'the week she last played').toBe(weekSpan(lastMatch))
    expect(withFarewell!.note!.dateLabel, 'and not the week the career stopped').not.toBe(weekSpan(w + 50))

    // ...and a career the save can prove NO match for gets no farewell at all, which is the gate
    // rather than the date: nothing in these ledgers, nothing on the page.
    const unplayed = probe('album-no-match')
    const stop = weekAtAge(unplayed, 31)
    unplayed.week = stop + 4
    unplayed.milestones.push({ type: 'wedding', week: stop - 4, kind: 'p:1' })
    unplayed.ending = { type: 'bankruptcy', week: stop, ageYears: 31, detail: 'probe', resumesWeek: null }
    const quiet = occasionsOf(assembleAlbum(unplayed), unplayed.temperament!)
    expect(quiet, 'the career ended, so the book closes').toContain('career-ended')
    expect(quiet, 'but nothing proves a last match, so nobody says goodbye on court').not.toContain('farewell')
  })
})

/** The caption `academy-courts` renders in this world's voice – the reverse of `occasionsOf`, for a
 *  case that needs the SHEET rather than the list of occasions. */
function courtsCaption(world: WorldState): string {
  return ALBUM_CORPUS.find((o) => o.id === 'academy-courts')!.voices[world.temperament!].caption
}

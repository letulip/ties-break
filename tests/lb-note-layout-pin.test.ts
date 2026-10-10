// LB-NOTE · THE SHEET THAT CARRIES A CHECKLIST IS LAYOUT A – THE ENGINE HALF (owner 10.10, decisions.md №38).
//
// The checklist lies UNDER the prose now (`AlbumNoteCard.vue`), which makes the graduate's and the heirloom's note the tallest scrap in the book, and a tall scrap on layout B or C lands on the
// boarding pass or the baggage tag. The cheap lever is the engine's: `planBook` (albumBook.ts) seats the sheet that holds the checklist on layout A. This file holds that the lever (1) changes nothing
// for a book with no checklist, (2) never breaks the owner's 20.09 laws to get there, (3) seats every checklist sheet that ANY lawful arrangement can seat, and (4) really does move the books the rotation
// alone leaves on B and C. The mounted half – the card, the 375x667 phone, the note against the pass and the tag – is `tests/component/lb-note-checklist-under.test.ts`.
//
// ⚠ THE ORACLES ARE RESTATED HERE AND NOT IMPORTED. `rotationOnly` is the cursor loop exactly as it stood until 10.10 and `feasible` is a brute force over every lawful run, written from the owner's
// sentences (no two in a row, nothing opens on B, three sheets show all three) and from the layouts' own photograph slots (`LAYOUTS[x].photos.length`, the page's number and not the engine's
// `FRAME_CAPACITY`). A planner checked against its own helpers can only agree with itself.
//
// ⚠⚠ NO DRAW: the lever is a search over lawful runs in a fixed order. The last case assembles twice and holds MAIN where it was.
//
// MUTATION LEDGER (each arm applied to `src/engine/world/albumBook.ts`, RUN, the red pasted into the wave's report, restored byte-exact – 10.10):
//   ARM 1  `planBook` pins nothing (`pinned` always empty)
//          -> 3 red of 13: the single-pin seating case (planner false, brute force true), the two-checklists case, and «the graduation sheet is layout A in every book». The heirloom cases stay GREEN,
//             which is right: the mother's page leads the book and the rotation already puts it on A, so the heirloom was never the pin's work.
//   ARM 2  the cheap-looking pin – the checklist sheet's layout simply overwritten with 'A' in `sheetsOf` (the planner pins nothing)
//          -> 5 red of 13: «teen-3 twice in a row: expected 'A' not to be 'A'» in the graduate sweep and in the dynasty-daughter book, the faithful-reconstruction case, and the two planner cases that
//             compare the book with what the brute force says. (The graduate sweep's case also asserts «never more frames than the layout draws», the break of a three-frame B sheet turned A;
//             it stops at the first failure, which was the adjacency one, so that second assertion was not seen red on its own.)
//   ARM 3  `lawfulRuns` forgets the neighbour across a chapter break (`before` is null at a chapter's first sheet)
//          -> 4 red of 13: the laws case (a chapter opens on the layout the last one ended on), the two-checklists case, the graduate sweep's laws case and the dynasty-daughter book.
import { describe, expect, it } from 'vitest'
import { assembleAlbum } from '../src/engine/world'
import { planBook, type SheetPlan } from '../src/engine/world/albumBook'
import { LAYOUTS } from '../src/components/album/albumPlacement'
import type { AlbumLayout } from '../src/shared/protocol'
import { captionOf, chapter, dynastyOf, graduateOf, readChapters, seatOf } from './helpers/lb-note-books'

// ===============================================================================================
// THE ORACLES
// ===============================================================================================

const ROTATION: readonly AlbumLayout[] = ['A', 'B', 'C']
/** What a sheet of each layout can draw: the page's own slots. */
const CAP: Record<AlbumLayout, number> = { A: LAYOUTS.A.photos.length, B: LAYOUTS.B.photos.length, C: LAYOUTS.C.photos.length }
const MAX_SHEETS = 3

/** one frame per sheet first, then the emptiest sheet takes the next, the later of two equals winning – the book's own rule, restated */
function deal(frames: number, caps: readonly number[]): number[] {
  const take = caps.map(() => 0)
  let left = frames
  for (let i = 0; i < take.length && left > 0; i++) {
    take[i] = 1
    left -= 1
  }
  while (left > 0) {
    let at = -1
    for (let i = 0; i < take.length; i++) {
      if (take[i] >= caps[i]) continue
      if (at === -1 || take[i] <= take[at]) at = i
    }
    if (at === -1) break
    take[at] += 1
    left -= 1
  }
  return take
}

/** THE ROTATION AS IT STOOD UNTIL 10.10: one cursor over the whole book, B skipped at a chapter's first sheet, the fewest of the next three layouts that hold the frames. */
function rotationOnly(sizes: readonly number[]): SheetPlan[] {
  let cursor = 0
  return sizes.map((frames) => {
    let at = cursor
    if (ROTATION[at % 3] === 'B') at += 1
    const offered = [0, 1, 2].map((i) => ROTATION[(at + i) % 3] as AlbumLayout)
    let count = MAX_SHEETS
    for (let k = 1; k <= MAX_SHEETS; k++) {
      if (offered.slice(0, k).reduce((n, l) => n + CAP[l], 0) >= frames) {
        count = k
        break
      }
    }
    const layouts = offered.slice(0, count)
    cursor = at + count
    return { layouts, takes: deal(frames, layouts.map((l) => CAP[l])) }
  })
}

/** The owner's laws and the layouts' capacities, as a list of what a plan breaks (empty = lawful). */
function broken(plans: readonly SheetPlan[], sizes: readonly number[]): string[] {
  const out: string[] = []
  let before: AlbumLayout | null = null
  if (plans.length !== sizes.length) return [`${plans.length} plans for ${sizes.length} chapters`]
  plans.forEach((p, c) => {
    const n = sizes[c] as number
    if (p.layouts.length < 1 || p.layouts.length > MAX_SHEETS) out.push(`chapter ${c}: ${p.layouts.length} sheets`)
    if (p.takes.length !== p.layouts.length) out.push(`chapter ${c}: takes and layouts disagree`)
    if (p.takes.reduce((a, b) => a + b, 0) !== n) out.push(`chapter ${c}: ${p.takes.join('+')} frames for ${n}`)
    if (p.layouts[0] === 'B') out.push(`chapter ${c}: opens on B`)
    if (p.layouts.length === MAX_SHEETS && new Set(p.layouts).size !== MAX_SHEETS) out.push(`chapter ${c}: three sheets, not three layouts (${p.layouts.join('')})`)
    p.layouts.forEach((l, i) => {
      if (l === before) out.push(`chapter ${c} sheet ${i}: ${l} twice in a row`)
      if ((p.takes[i] as number) < 1) out.push(`chapter ${c} sheet ${i}: an empty sheet`)
      if ((p.takes[i] as number) > CAP[l]) out.push(`chapter ${c} sheet ${i}: ${p.takes[i]} frames on a layout that draws ${CAP[l]}`)
      before = l
    })
  })
  return out
}

/** BRUTE FORCE: can ANY lawful arrangement seat every listed frame on an A? (every run of 1-3 layouts for every chapter, backtracking across the book) */
function feasible(sizes: readonly number[], pins: ReadonlyMap<number, readonly number[]>): boolean {
  const go = (c: number, prev: AlbumLayout | null): boolean => {
    if (c === sizes.length) return true
    const n = sizes[c] as number
    const want = pins.get(c) ?? []
    for (let m = 1; m <= Math.min(MAX_SHEETS, n); m++) {
      const runs: AlbumLayout[][] = [[]]
      for (let i = 0; i < m; i++) runs.splice(0, runs.length, ...runs.flatMap((r) => ROTATION.map((l) => [...r, l])))
      for (const run of runs) {
        if (run[0] === 'B' || run[0] === prev) continue
        if (run.some((l, i) => i > 0 && l === run[i - 1])) continue
        if (m === MAX_SHEETS && new Set(run).size !== MAX_SHEETS) continue
        if (run.reduce((a, l) => a + CAP[l], 0) < n) continue
        const plan = { layouts: run, takes: deal(n, run.map((l) => CAP[l])) }
        if (want.some((k) => seatOf(plan, k) !== 'A')) continue
        if (go(c + 1, run[run.length - 1] as AlbumLayout)) return true
      }
    }
    return false
  }
  return go(0, null)
}

/** every list of 1..3 chapter sizes drawn from 1..7 */
function shapes(): number[][] {
  const out: number[][] = []
  const sizes = [1, 2, 3, 4, 5, 6, 7]
  for (const a of sizes) {
    out.push([a])
    for (const b of sizes) {
      out.push([a, b])
      for (const c of sizes) out.push([a, b, c])
    }
  }
  return out
}
const SHAPES = shapes()

// ===============================================================================================
// THE PLANNER
// ===============================================================================================

describe('LB-note · planBook – the lever, inside the owner\'s laws', () => {
  it('is not vacuous: the oracle walks chapters of 7, 2 and 3 frames as ABC | A | CA, worked by hand, and that walk obeys the laws', () => {
    // 7 frames fill A B C (2 + 3 + 2); the cursor stands on A again for the next chapter of 2 (one A holds both), then on B – which cannot open a chapter – so the chapter of 3 starts on C and needs a second sheet
    const walk = rotationOnly([7, 2, 3])
    expect(walk.map((p) => p.layouts.join(''))).toEqual(['ABC', 'A', 'CA'])
    expect(walk[0]?.takes).toEqual([2, 3, 2])
    expect(walk[2]?.takes).toEqual([1, 2])
    expect(broken(walk, [7, 2, 3])).toEqual([])
    // and the checker has teeth: two A in a row, and a three-frame sheet turned A, are both named
    expect(broken([{ layouts: ['A'], takes: [2] }, { layouts: ['A'], takes: [3] }], [2, 3])).toEqual(['chapter 1 sheet 0: A twice in a row', 'chapter 1 sheet 0: 3 frames on a layout that draws 2'])
  })

  it('with NO checklist anywhere, the plan is the rotation\'s own walk – for all 399 shapes of up to three chapters', () => {
    for (const sizes of SHAPES) {
      const chapters = sizes.map((n) => chapter(n))
      expect(planBook(chapters), `sizes ${sizes.join(',')}`).toEqual(rotationOnly(sizes))
      expect(planBook(chapters, false), `sizes ${sizes.join(',')} (before-arm)`).toEqual(rotationOnly(sizes))
    }
  })

  it('⚠⚠ every pinned plan obeys the laws: no two in a row across a chapter break, no opener on B, three sheets show all three, no sheet holds more than its layout draws', () => {
    let plans = 0
    for (const sizes of SHAPES) {
      sizes.forEach((n, c) => {
        for (let k = 0; k < n; k++) {
          const chapters = sizes.map((size, i) => chapter(size, i === c ? [k] : []))
          expect(broken(planBook(chapters), sizes), `sizes ${sizes.join(',')} pin chapter ${c} frame ${k}`).toEqual([])
          plans++
        }
      })
    }
    expect(plans, 'the sweep is not empty').toBeGreaterThan(4000)
  })

  it('⭐ a single checklist frame is seated on A in EVERY shape where any lawful arrangement can seat it – and the one shape none can is the fifth frame of a full seven', () => {
    const unseated = new Set<string>()
    let seatable = 0
    for (const sizes of SHAPES) {
      sizes.forEach((n, c) => {
        for (let k = 0; k < n; k++) {
          const pins = new Map([[c, [k]]])
          const plan = planBook(sizes.map((size, i) => chapter(size, i === c ? [k] : [])))
          const seated = seatOf(plan[c] as SheetPlan, k) === 'A'
          const possible = feasible(sizes, pins)
          // the planner seats exactly what the brute force says can be seated: nothing more, nothing less
          expect(seated, `sizes ${sizes.join(',')} chapter ${c} frame ${k}: planner ${seated}, brute force ${possible}`).toBe(possible)
          if (possible) seatable++
          else unseated.add(`n=${n} k=${k}`)
        }
      })
    }
    expect([...unseated], 'the only unseatable shape').toEqual(['n=7 k=4'])
    expect(seatable, 'and everything else is').toBeGreaterThan(4000)
  })

  it('the rotation ALONE leaves a great many of those frames off A – the before-arm, so the pin is not idle', () => {
    let off = 0
    let total = 0
    for (const sizes of SHAPES) {
      sizes.forEach((n, c) => {
        for (let k = 0; k < n; k++) {
          const plan = planBook(sizes.map((size, i) => chapter(size, i === c ? [k] : [])), false)
          total++
          if (seatOf(plan[c] as SheetPlan, k) !== 'A') off++
        }
      })
    }
    expect(off / total, `${off} of ${total} single-frame cases are off A under the rotation alone`).toBeGreaterThan(0.5)
  })

  it('two checklists (the heirloom leads the book, a graduate follows): both are A when the laws allow it, and when they do not the LATER yields – never the first', () => {
    let both = 0
    let later = 0
    for (const first of [1, 2, 3, 5, 7]) {
      for (const between of [[], [1], [2], [3], [5], [7], [1, 1], [2, 4]]) {
        for (const last of [1, 2, 3, 4, 5, 6, 7]) {
          for (let k = 0; k < last; k++) {
            const sizes = [first, ...between, last]
            const at = sizes.length - 1
            const chapters = sizes.map((n, i) => chapter(n, i === 0 ? [0] : i === at ? [k] : []))
            const plans = planBook(chapters)
            expect(broken(plans, sizes), `sizes ${sizes.join(',')} frame ${k}`).toEqual([])
            const firstSeated = seatOf(plans[0] as SheetPlan, 0) === 'A'
            const lastSeated = seatOf(plans[at] as SheetPlan, k) === 'A'
            const possible = feasible(sizes, new Map([[0, [0]], [at, [k]]]))
            expect(firstSeated, `sizes ${sizes.join(',')} frame ${k}: the first sheet is A by the rotation itself`).toBe(true)
            // both, exactly when a lawful arrangement seats both; otherwise the later one is the one that yields
            expect(lastSeated, `sizes ${sizes.join(',')} frame ${k}: brute force says both ${possible}`).toBe(possible)
            if (possible) both++
            else later++
          }
        }
      }
    }
    expect(both, 'the arm that seats both is exercised').toBeGreaterThan(50)
    expect(later, 'and so is the arm where the later pin yields').toBeGreaterThan(5)
  })
})

// ===============================================================================================
// THE BOOKS – real assemblies, the graduate and the heirloom
// ===============================================================================================

let graduates: ReturnType<typeof graduateRows> | null = null
function graduateRows() {
  return [20, 21, 22, 23].flatMap((age) =>
    Array.from({ length: 48 }, (_, i) => {
      const world = graduateOf(i, age)
      const book = assembleAlbum(world)
      const read = readChapters(book, captionOf('graduated', world))
      return { age, i, book, ...read }
    }),
  )
}

describe('LB-note · the graduate\'s book – 48 posed careers x graduation at 20, 21, 22 and 23', () => {
  const all = (): ReturnType<typeof graduateRows> => (graduates ??= graduateRows())

  it('every book has exactly one checklist sheet, and the planner read back off the finished book reproduces its layouts and its frames per sheet (the reconstruction is faithful)', () => {
    const rows = all()
    expect(rows).toHaveLength(192)
    for (const r of rows) {
      expect(r.at, `age ${r.age} career ${r.i}: a checklist sheet`).toBeGreaterThanOrEqual(0)
      expect(r.book.sheets.filter((s) => (s.note?.lines.length ?? 0) > 0), `age ${r.age} career ${r.i}: one`).toHaveLength(1)
      const plans = planBook(r.chapters)
      r.book.chapters.forEach((ch, c) => {
        const sheets = r.book.sheets.slice(ch.firstSheet, ch.firstSheet + ch.sheetCount)
        expect(plans[c]?.layouts, `age ${r.age} career ${r.i} chapter ${c + 1}`).toEqual(sheets.map((s) => s.layout))
        expect(plans[c]?.takes, `age ${r.age} career ${r.i} chapter ${c + 1} frames`).toEqual(sheets.map((s) => s.frames.length))
      })
    }
  })

  it('⭐⭐ the graduation sheet is layout A in every book – except the one shape no arrangement can seat (the fifth frame of a full seven)', () => {
    const rows = all()
    const off: string[] = []
    for (const r of rows) {
      const sheet = r.book.sheets.find((s) => (s.note?.lines.length ?? 0) > 0)!
      if (sheet.layout === 'A') continue
      off.push(`age ${r.age} career ${r.i}: ${sheet.layout} (chapter of ${r.sizes[r.at]}, frame ${r.k})`)
      expect(feasible(r.sizes, new Map([[r.at, [r.k]]])), `age ${r.age} career ${r.i}: off A though an arrangement could seat it`).toBe(false)
      expect([r.sizes[r.at], r.k], 'and that is the fifth frame of a full seven').toEqual([7, 4])
    }
    expect(off.length, `${off.length} of ${rows.length} books keep the rotation's layout: ${off.slice(0, 3).join(' | ')}`).toBeLessThan(rows.length / 5)
  })

  it('and the rotation alone would have left most of them on B or C (the before-arm over the same chapters), so the case above is not idle', () => {
    const rows = all()
    let offA = 0
    for (const r of rows) {
      const before = planBook(r.chapters, false)
      if (seatOf(before[r.at] as SheetPlan, r.k) !== 'A') offA++
    }
    expect(offA / rows.length, `${offA} of ${rows.length} graduate books were off A under the rotation alone`).toBeGreaterThan(0.5)
  })

  it('every other sheet of these books still obeys the owner\'s laws (no two in a row, nothing opens on B, three sheets show all three)', () => {
    const rows = all()
    for (const r of rows) {
      expect(broken(planBook(r.chapters), r.sizes), `age ${r.age} career ${r.i}`).toEqual([])
      r.book.sheets.forEach((s, n) => {
        if (n > 0) expect(s.layout, `age ${r.age} career ${r.i}: ${s.id}`).not.toBe(r.book.sheets[n - 1]?.layout)
        expect(s.frames.length, `${s.id}: never more frames than the layout draws`).toBeLessThanOrEqual(CAP[s.layout])
      })
    }
  })
})

describe('LB-note · the heirloom\'s book', () => {
  it('the mother\'s page leads the book on layout A – by the rotation itself, and the pin keeps it there – whatever she won', () => {
    const worlds = [dynastyOf('lbn-heir-a'), dynastyOf('lbn-heir-b', { titles: 0, bestRank: null, slams: 0 }), dynastyOf('lbn-heir-c', { titles: 2, bestRank: 17 })]
    for (const world of worlds) {
      const book = assembleAlbum(world)
      const first = book.sheets[0]!
      expect(first.note?.lines.length ?? 0, 'her cabinet rides the first sheet').toBeGreaterThan(0)
      expect(first.layout).toBe('A')
      expect(book.sheets.filter((s) => (s.note?.lines.length ?? 0) > 0)).toHaveLength(1)
    }
  })

  it('a dynasty daughter who also goes to college has BOTH checklists in one book: the heirloom on the first sheet, the degree on A where the laws allow it', () => {
    let both = 0
    for (let i = 0; i < 48; i++) {
      const world = graduateOf(i, 22)
      world.dynasty = dynastyOf(`lbn-both-${i}`).dynasty
      const book = assembleAlbum(world)
      const lined = book.sheets.filter((s) => (s.note?.lines.length ?? 0) > 0)
      if (lined.length === 2) both++
      expect(lined[0], 'the first checklist is the first sheet').toBe(book.sheets[0])
      expect(book.sheets[0]?.layout).toBe('A')
      for (const [n, s] of book.sheets.entries()) if (n > 0) expect(s.layout, `${s.id} twice in a row`).not.toBe(book.sheets[n - 1]?.layout)
    }
    expect(both, 'the posed careers do carry both checklists').toBeGreaterThan(20)
  })
})

describe('LB-note · NO DRAW (invariant 2)', () => {
  it('assembling a checklist book twice is the same book, and the world\'s MAIN stream is exactly where it was', () => {
    const world = graduateOf(7, 22)
    const mainBefore = JSON.stringify(world.rngMain)
    const a = JSON.stringify(assembleAlbum(world))
    const b = JSON.stringify(assembleAlbum(world))
    expect(b).toBe(a)
    expect(JSON.stringify(world.rngMain), 'assembling the album taps no MAIN draw').toBe(mainBefore)
  })
})

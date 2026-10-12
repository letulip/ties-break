// ROUND 50 №1 – THE PREGNANCY ENTERS THE ALBUM, derived and never stored (no schema move).
//
// The derivation (`pregnancyCandidates`, world/albumBook.ts): for each `world.children` row, the
// nearest `'expecting'` lifeLog announcement before `bornWeek` inside the model's own term window
// (39 weeks nominal – `motherhood.playsOnWeeks + termWeeks` – plus slack, 45) becomes occasion
// `pregnancy` at the ANNOUNCEMENT week, priority 91 – one under the birth's 92, and never colliding
// with it on a week (announcement and birth sit ~39 weeks apart by construction).
//
// ⚠⚠ THE LOSS-SILENCE LAW IS THE OTHER HALF AND IT IS TESTED, NOT ASSUMED: an announcement no birth
// followed – a loss, reachable since the weight wave re-arms the hazard – earns NO page. Whether the
// book should ever speak about a loss is an owner ruling nobody has asked for; the child-first
// derivation makes the silence automatic, and the arm below is the net that keeps it automatic.
//
// ⚠ THE ROWS ARE POSED AND THAT IS HONEST HERE: the candidates are a PURE READ of two append-only
// ledgers (`lifeLog`, `children`) plus the `birth` milestone, and `tests/wave8b-album-birth.test.ts`
// already walks a REAL career – hazard, tick, `landBirth` – to the same ledgers; its walked book now
// carries this page too, so the engine-born path is covered where it was always covered.
//
// MUTATION LEDGER (run 12.10, r50 №1, each arm applied to world/albumBook.ts and reverted):
//   ARM (ii)  the matching window broken – a candidate pushed per `'expecting'` row, children
//             ignored → the loss-silence arm REDS (a loss gets a page) and the stale-announcement
//             arm REDS with it; the matched-child arms stay green, which is the point: the window is
//             only visible where it refuses.

import { describe, expect, it } from 'vitest'
import { assembleAlbum, createWorld, type WorldState } from '../src/engine/world'
import { ALBUM_CORPUS } from '../src/engine/world/albumCorpus'
import type { AlbumBook, Milestone } from '../src/shared/protocol'
import { weekAtAge } from './helpers/career'

const PREGNANT_ART = 'images/fem-euro-brunnet/fem-euro-brunnet-adult-pregnant-early.webp'
const BIRTH_ART = 'images/fem-euro-brunnet/fem-euro-brunnet-adult-birth.webp'

/** A38's row, read out of the corpus rather than transcribed – the strings are his document's. */
const A38 = ALBUM_CORPUS.find((o) => o.id === 'pregnancy')!

/** A career whose ledgers hold one announcement and, where asked, the child that followed it.
 *  `gap` is bornWeek − announcedWeek; the model's own distance is 39. */
function mother(seed: string, opts: { announceAt?: number; gap?: number; child?: boolean } = {}): WorldState {
  const world = createWorld(seed)
  world.season = []
  const announce = weekAtAge(world, opts.announceAt ?? 25)
  const born = announce + (opts.gap ?? 39)
  world.lifeLog.push({ week: announce, kind: 'expecting', detail: 'p:probe', answer: 'joy' })
  if (opts.child !== false) {
    world.children.push({ bornWeek: born, sex: 'girl' })
    world.milestones.push({ type: 'birth', week: born } as Milestone)
  }
  world.week = born + 10
  return world
}

function frames(book: AlbumBook): { caption: string; art: string; alt: string }[] {
  return book.sheets.flatMap((s) => s.frames.map((f) => ({ caption: f.caption, art: f.art, alt: f.alt })))
}

describe('r50 №1 – the announcement week becomes an album page', () => {
  it('⭐⭐⭐ the page: A38\'s caption in her voice, the early painting, its own alt – beside the birth page', () => {
    const world = mother('r50-preg')
    const all = frames(assembleAlbum(world))
    const page = all.filter((f) => f.art === PREGNANT_ART)
    expect(page, 'exactly one pregnancy frame').toHaveLength(1)
    expect(page[0].caption, 'the corpus speaks it, in her birth voice').toBe(A38.voices[world.temperament!][0].caption)
    expect(page[0].alt, 'the alt is the painting\'s own').toBe('The week she told us')
    // priority 91 under the birth's 92: both pages exist – nothing evicted anything
    expect(all.some((f) => f.art === BIRTH_ART), 'and the birth keeps its own frame').toBe(true)
  })

  it('⭐⭐ a 31+ announcement wears the SAME painting – the r50 band clamp, pregnancy\'s own arm', () => {
    const world = mother('r50-preg-late', { announceAt: 32 })
    const page = frames(assembleAlbum(world)).filter((f) => f.art === PREGNANT_ART)
    expect(page, 'the lateCareer chapter holds the page').toHaveLength(1)
    expect(page[0].alt).toBe('The week she told us')
  })

  it('⚠⚠ THE LOSS STAYS SILENT: an announcement no child followed earns no page', () => {
    const world = mother('r50-preg-loss', { child: false })
    const all = frames(assembleAlbum(world))
    expect(all.some((f) => f.art === PREGNANT_ART), 'no pregnancy frame').toBe(false)
    const spoken = new Set(Object.values(A38.voices).flat().map((h) => h.caption))
    expect(all.some((f) => spoken.has(f.caption)), 'and no A38 caption anywhere').toBe(false)
  })

  it('⚠ the window: an announcement 60 weeks before a birth is not that child\'s – no page', () => {
    // a stale row (a loss) plus a LATER child whose own announcement was never logged – the
    // derivation refuses to stretch one across the term window rather than guess
    const world = mother('r50-preg-window', { gap: 60 })
    expect(frames(assembleAlbum(world)).some((f) => f.art === PREGNANT_ART)).toBe(false)
  })

  it('⭐ two children, two announcements – a page each: the derivation is per CHILD, not once', () => {
    // the second pregnancy sits in the next band (announced at 32), so each chapter holds its own
    // pregnancy+birth pair and the §5 thirds rule – which this round exempts only the WEDDING from –
    // has nothing to trim
    const world = mother('r50-preg-two')
    const second = weekAtAge(world, 32)
    world.lifeLog.push({ week: second, kind: 'expecting', detail: 'p:probe2', answer: 'joy' })
    world.children.push({ bornWeek: second + 39, sex: 'girl' })
    world.milestones.push({ type: 'birth', week: second + 39 } as Milestone)
    world.week = second + 60
    const pages = frames(assembleAlbum(world)).filter((f) => f.art === PREGNANT_ART)
    expect(pages, 'one page per matched pregnancy').toHaveLength(2)
  })
})

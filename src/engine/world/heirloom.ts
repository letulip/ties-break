// ⭐⭐⭐ SUCCESSION S2d – THE MOTHER'S ALBUM, READ OFF THE WORLD (docs/specs/succession-2026-10.md §3: «the album – generation 1's album, read-only,
// openable from the new career as an heirloom»).
//
// A generation-2 world carries the finished book in `world.legacy.heirloomAlbum` (S2b wrote it, `structuredClone`d off the blob the door carried).
// THIS LEAF IS THE ONE READING OF IT: the snapshot asks it a yes-or-no (`hasHeirloom`, which draws the control on the album screen) and the worker asks
// it for the book (`heirloomBookOf`, which the control's press opens), so the control and the query behind it can never disagree about whether a book
// exists.
//
// ⚠ A LEAF ON PURPOSE, TYPES ONLY. `snapshot.ts` imports it, and `succession.ts` – which owns the legacy block's WRITER – imports half the engine
// (creation, the endings, the shop, the album's assembler): a snapshot -> succession edge is a cycle waiting for the next import to close it.
// ⚠ `legacy.heirloomAlbum` IS TYPED `unknown` (S1 declared the block before the book's shape was ruled), so its shape is judged HERE, at the one place
// it is read: an object holding the two arrays the album screen pages through. Anything else – a null, a string, a hand-edited save's `{}` – is «no
// heirloom» on BOTH readings, never a control that opens onto nothing and never a crash.
// ⚠ THE BOOK LEAVES AS A COPY. The reply is plain data and the worker's `postMessage` clones it anyway; the copy here makes «a query changes nothing»
// a property of the reader and not of the transport, so a caller that holds the answer cannot reach the world through it.
import type { AlbumBook } from '../../shared/protocol'
import type { WorldState } from './state'

/** The persisted book when it has the book's shape, else null. A REFERENCE into the world – the two exports below decide what leaves. */
function heirloomOf(world: WorldState): AlbumBook | null {
  const stored: unknown = world.legacy?.heirloomAlbum
  if (typeof stored !== 'object' || stored === null) return null
  const shape = stored as Partial<AlbumBook>
  return Array.isArray(shape.chapters) && Array.isArray(shape.sheets) ? (stored as AlbumBook) : null
}

/** Does this career carry a mother's album? `Snapshot.hasHeirloom` – one bit per snapshot, never the book. */
export function hasHeirloom(world: WorldState): boolean {
  return heirloomOf(world) !== null
}

/** The mother's finished album as a COPY, or null on a career with none – the `heirloomAlbum` query's answer. */
export function heirloomBookOf(world: WorldState): AlbumBook | null {
  const book = heirloomOf(world)
  return book === null ? null : structuredClone(book)
}

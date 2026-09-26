import type { WorldState } from './world'
import { SAVE_SCHEMA_VERSION } from './world'
import { migrateSave } from './migrations'
import {
  guardCompressedSize,
  guardDeclaredShape,
  guardDeclaredVersion,
  guardPayloadBounds,
  MAX_EXPANDED_BYTES,
  SaveFileError,
} from './saveGuard'

// Export-file layout: MAGIC(8) | schemaVersion u32 BE | sha256(32) of gzip payload | gzip(JSON)
// The same gzip payload + checksum are what save slots store in IndexedDB.
//
// TWO DOORS, TWO TRUST LEVELS (W1-INTEGRITY-B):
//   * `decompressWorld` reads DATABASE records – our own writers, guarded by the checksum. It gets
//     the RESOURCE CAPS (compressed + expanded bytes) and nothing stricter, because refusing a
//     repairable autosave out of the player's own database would turn a safety net into data loss;
//     the worker's verify-and-repair handles what the checksum cannot.
//   * `decodeExportFile` reads FILES OFF DISK – untrusted by definition (hand-edited, half
//     downloaded, or not ours at all). It runs the full gate from saveGuard.ts: caps, header and
//     declared-version checks BEFORE decompression, checksum, a bounds walk over the whole parsed
//     payload, then the declared schema's spine – and only then migration. Every step works on a
//     local candidate; a throw at any point leaves no global touched.

const MAGIC = 'TSIMSAVE'
const HEADER_BYTES = 8 + 4 + 32

async function gzip(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new CompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

/** Streaming gunzip that ABORTS past `maxBytes` instead of buffering whatever the stream yields.
 *  The old one-liner (`new Response(stream).arrayBuffer()`) would obligingly materialise a gzip
 *  bomb whole – 16 MiB of compressed zeros inflates towards ~16 GiB, and the cap has to bite
 *  DURING inflation, not after the tab has already swallowed the result. */
async function gunzipBounded(data: Uint8Array, maxBytes: number): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('gzip'))
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel()
      throw new SaveFileError(
        'oversized-expanded',
        'This save file expands far beyond any real career – refusing to unpack it',
      )
    }
    chunks.push(value)
  }
  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }
  return out
}

export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', data as BufferSource))
}

export async function compressWorld(world: WorldState): Promise<{ payload: Uint8Array; checksum: Uint8Array }> {
  const json = new TextEncoder().encode(JSON.stringify(world))
  const payload = await gzip(json)
  return { payload, checksum: await sha256(payload) }
}

async function verifyChecksum(payload: Uint8Array, checksum: Uint8Array): Promise<void> {
  const actual = await sha256(payload)
  if (actual.length !== checksum.length || !actual.every((b, i) => b === checksum[i])) {
    throw new SaveFileError('corrupted', 'Save checksum mismatch: data is corrupted')
  }
}

/** ⭐ D-02's other half: run `step` and give whatever it throws raw the `corrupted` CODE, with its
 *  MESSAGE untouched. `readLatestAutosave` may fall back to the older autosave generation on
 *  corruption alone now, and "corruption" here means every way a record of ours can be unreadable –
 *  a torn gzip stream, unparseable JSON, a migration block tripping over data the checksum happily
 *  blessed. Those are exactly the cases the two-generation design exists for, and leaving them
 *  untyped would have made the narrower fallback a data-loss regression. Nothing is re-worded:
 *  `decodeExportFile` writes its own sentences one door along because a FILE is untrusted; a record
 *  out of the player's own database already has a sentence on the boot path and it stays. */
async function asCorrupted<T>(step: () => T | Promise<T>): Promise<T> {
  try {
    return await step()
  } catch (err) {
    if (err instanceof SaveFileError) throw err
    throw new SaveFileError('corrupted', err instanceof Error ? err.message : String(err))
  }
}

/** The DB-record door: caps + checksum + migration. See the trust-levels note up top for why this
 *  path deliberately does NOT run the bounds walk or the spine – the autosave chain is family. */
export async function decompressWorld(payload: Uint8Array, checksum?: Uint8Array): Promise<WorldState> {
  guardCompressedSize(payload.byteLength)
  if (checksum) await verifyChecksum(payload, checksum)
  const parsed = await asCorrupted(async () =>
    JSON.parse(new TextDecoder().decode(await gunzipBounded(payload, MAX_EXPANDED_BYTES))),
  )
  // ⭐⭐ D-02 (principles review, 26.09) – A SAVE FROM A NEWER BUILD IS NOT CORRUPTION, AND THIS DOOR
  // USED TO SAY IT WAS. `migrateSave` refuses a schema it does not know with a plain `Error`, so no
  // code crossed, and `readLatestAutosave`'s corruption fallback caught it like any other throw: the
  // player was told the career had been "repaired", handed the older generation, and had the newer
  // one overwritten two commits later. E-05 already fixed this on the FILE door
  // (`guardDeclaredVersion`, saveGuard.ts), where the answer is «update the app, then import it»;
  // this is the same question arriving through the player's own database, and it has to be the same
  // KIND of answer. The migration ladder is the wrong place to ask it – its charter is that
  // migrations "upgrade versions, they do not audit".
  // ⚠ THE SENTENCE IS THE LADDER'S OWN, BYTE FOR BYTE (`migrations.ts`: `Save schema ${v} is newer
  // than supported ${SAVE_SCHEMA_VERSION}`), because no shipped migration may be edited and no copy
  // is this wave's to change. What is new is the TYPE around it: `future-schema` reaches the store,
  // and the fallback can tell "unrecoverable" from "recoverable by updating".
  const declared = (parsed as { schemaVersion?: unknown } | null)?.schemaVersion
  if (typeof declared === 'number' && declared > SAVE_SCHEMA_VERSION) {
    throw new SaveFileError('future-schema', `Save schema ${declared} is newer than supported ${SAVE_SCHEMA_VERSION}`)
  }
  // ⚠ AND EVERY OTHER FAILURE OF THIS DOOR CARRIES THE `corrupted` CODE, which is what lets
  // `readLatestAutosave` fall back on corruption ALONE. Without it, "fall back only on 'corrupted'"
  // would have deleted today's net for the one case that really needs it: a record whose bytes are
  // intact – so the checksum blesses them – and which then explodes inside a migration block, e.g.
  // the ladder's own "missing seed/week/profile". That is an unreadable newer generation and the
  // older one IS the answer; refusing it would turn a safety net into data loss, which is the
  // argument this file's trust-levels note already makes.
  // ⚠ THE MESSAGE IS THE ORIGINAL, UNCHANGED – only a code is added around it. `decodeExportFile`
  // does the same thing one door along and REWRITES the sentence there; here the sentence is what a
  // player already sees on the boot path and no copy in this wave is ours to move.
  return asCorrupted(() => migrateSave(parsed))
}

export async function encodeExportFile(world: WorldState): Promise<Uint8Array> {
  const { payload, checksum } = await compressWorld(world)
  const out = new Uint8Array(HEADER_BYTES + payload.length)
  out.set(new TextEncoder().encode(MAGIC), 0)
  new DataView(out.buffer).setUint32(8, world.schemaVersion)
  out.set(checksum, 12)
  out.set(payload, 44)
  return out
}

/**
 * The import door – the full untrusted-input pipeline, in the order TB-06 prescribes: size cap
 * BEFORE any parse; header and DECLARED schema version BEFORE any decompression; checksum;
 * bounded inflation; JSON; bounds walk; the declared version's spine; and only then the migration
 * ladder. Everything happens in locals – the caller commits the returned candidate or nothing.
 *
 * Errors are `SaveFileError` with a machine-readable `code` end to end; anything a lower layer
 * throws raw (a broken gzip stream, JSON.parse, a migration block tripping over data the spine
 * does not cover) is wrapped as 'corrupted' so the player never sees a bare stack-trace message.
 */
export async function decodeExportFile(bytes: Uint8Array): Promise<WorldState> {
  guardCompressedSize(bytes.byteLength)
  if (bytes.length < 8 || new TextDecoder().decode(bytes.subarray(0, 8)) !== MAGIC) {
    throw new SaveFileError('not-a-save', 'Not a Tennis Sim save file')
  }
  if (bytes.length < HEADER_BYTES) {
    throw new SaveFileError('truncated', 'This save file is cut short – it is smaller than its own header')
  }
  const declaredVersion = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(8)
  guardDeclaredVersion(declaredVersion)

  const payload = bytes.subarray(44)
  await verifyChecksum(payload, bytes.subarray(12, 44))

  let parsed: unknown
  try {
    const json = new TextDecoder().decode(await gunzipBounded(payload, MAX_EXPANDED_BYTES))
    parsed = JSON.parse(json)
  } catch (err) {
    if (err instanceof SaveFileError) throw err
    throw new SaveFileError('corrupted', 'This save file is damaged – its contents cannot be read')
  }

  guardPayloadBounds(parsed)
  const candidate = guardDeclaredShape(parsed, declaredVersion)

  try {
    return migrateSave(candidate)
  } catch (err) {
    if (err instanceof SaveFileError) throw err
    const detail = err instanceof Error ? err.message : String(err)
    throw new SaveFileError('corrupted', `This save file could not be upgraded – ${detail}`)
  }
}

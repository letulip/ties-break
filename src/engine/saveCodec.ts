import type { WorldState } from './world'
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

/** The DB-record door: caps + checksum + migration. See the trust-levels note up top for why this
 *  path deliberately does NOT run the bounds walk or the spine – the autosave chain is family. */
export async function decompressWorld(payload: Uint8Array, checksum?: Uint8Array): Promise<WorldState> {
  guardCompressedSize(payload.byteLength)
  if (checksum) await verifyChecksum(payload, checksum)
  const json = new TextDecoder().decode(await gunzipBounded(payload, MAX_EXPANDED_BYTES))
  return migrateSave(JSON.parse(json))
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

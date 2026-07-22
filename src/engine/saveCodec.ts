import type { WorldState } from './world'
import { migrateSave } from './migrations'

// Export-file layout: MAGIC(8) | schemaVersion u32 BE | sha256(32) of gzip payload | gzip(JSON)
// The same gzip payload + checksum are what save slots store in IndexedDB.

const MAGIC = 'TSIMSAVE'

async function gzip(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new CompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function gunzip(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', data as BufferSource))
}

export async function compressWorld(world: WorldState): Promise<{ payload: Uint8Array; checksum: Uint8Array }> {
  const json = new TextEncoder().encode(JSON.stringify(world))
  const payload = await gzip(json)
  return { payload, checksum: await sha256(payload) }
}

export async function decompressWorld(payload: Uint8Array, checksum?: Uint8Array): Promise<WorldState> {
  if (checksum) {
    const actual = await sha256(payload)
    if (actual.length !== checksum.length || !actual.every((b, i) => b === checksum[i])) {
      throw new Error('Save checksum mismatch: data is corrupted')
    }
  }
  const json = new TextDecoder().decode(await gunzip(payload))
  return migrateSave(JSON.parse(json))
}

export async function encodeExportFile(world: WorldState): Promise<Uint8Array> {
  const { payload, checksum } = await compressWorld(world)
  const out = new Uint8Array(8 + 4 + 32 + payload.length)
  out.set(new TextEncoder().encode(MAGIC), 0)
  new DataView(out.buffer).setUint32(8, world.schemaVersion)
  out.set(checksum, 12)
  out.set(payload, 44)
  return out
}

export async function decodeExportFile(bytes: Uint8Array): Promise<WorldState> {
  if (bytes.length < 44 || new TextDecoder().decode(bytes.subarray(0, 8)) !== MAGIC) {
    throw new Error('Not a Tennis Sim save file')
  }
  return decompressWorld(bytes.subarray(44), bytes.subarray(12, 44))
}

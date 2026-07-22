import { describe, it, expect } from 'vitest'
import { createWorld, tickWeek } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { compressWorld, decompressWorld, encodeExportFile, decodeExportFile } from '../src/engine/saveCodec'

function sampleWorld() {
  const world = createWorld('codec-test')
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 100; i++) tickWeek(world, rng)
  return world
}

describe('saveCodec', () => {
  it('round-trips through gzip + checksum', async () => {
    const world = sampleWorld()
    const { payload, checksum } = await compressWorld(world)
    expect(payload.length).toBeLessThan(JSON.stringify(world).length)
    const restored = await decompressWorld(payload, checksum)
    expect(restored).toEqual(world)
  })

  it('detects tampered payloads', async () => {
    const world = sampleWorld()
    const { payload, checksum } = await compressWorld(world)
    payload[payload.length - 5] ^= 0xff
    await expect(decompressWorld(payload, checksum)).rejects.toThrow(/checksum/i)
  })

  it('round-trips through the export file format', async () => {
    const world = sampleWorld()
    const file = await encodeExportFile(world)
    expect(new TextDecoder().decode(file.subarray(0, 8))).toBe('TSIMSAVE')
    const restored = await decodeExportFile(file)
    expect(restored).toEqual(world)
  })

  it('rejects non-save files', async () => {
    await expect(decodeExportFile(new TextEncoder().encode('definitely not a save'))).rejects.toThrow(
      /not a tennis sim save/i,
    )
  })
})

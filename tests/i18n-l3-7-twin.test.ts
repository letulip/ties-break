// L3-7 (10.10) – THE TWIN AGAINST THE PRE-WAVE TREE. docs/specs/i18n-2026-10.md §8 row L3-7.
//
// Capture mode (`L37_CAPTURE=<path>`) writes the digests of everything a player reads, on WHATEVER tree it runs on – the stored fixture was captured on the pre-wave tree (4adc0d58), before a line of the
// wave existed. Compare mode (default) reads that fixture and requires this tree to reproduce it.
import { describe, expect, it } from 'vitest'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import {
  commentaryDigests, previewDigests, knockDigest, famousDigest, playBench, playCollege, watchedDigest, rowsDigest, worldMinusRefs, snapshotMinusRefs, sha,
} from './helpers/l3-7-play'

const FIXTURE = resolve(__dirname, 'fixtures/l3-7/old-arm.json')
const CAREERS: Array<[number, number]> = [[5, 0], [8, 0], [0, 1], [6, 1], [5, 1]]

interface Capture {
  viz: { commentary: ReturnType<typeof commentaryDigests>; preview: ReturnType<typeof previewDigests>; knock: ReturnType<typeof knockDigest>; famous: ReturnType<typeof famousDigest> }
  careers: Record<string, { rows: number; rowsDigest: string; rows150: number; rowsDigest150: string; watched: ReturnType<typeof watchedDigest>; next3: number[]; world: string; snapshot: string }>
  college: Record<string, { rows: number; rowsDigest: string; watched: ReturnType<typeof watchedDigest>; next3: number[]; world: string; snapshot: string; weeks: number }>
}

function capture(): Capture {
  const careers: Capture['careers'] = {}
  for (const [preset, policy] of CAREERS) {
    let rows150 = 0
    let digest150 = ''
    const p = playBench(preset, policy, 300, (w, world) => {
      if (w === 149) {
        // the retained rows at week 150 are read from the stream below, so only the count is taken here
        rows150 = -1
        void world
      }
    })
    const first150 = p.rows.filter((r) => r.week <= 150)
    rows150 = first150.length
    digest150 = rowsDigest(first150)
    careers[p.label] = {
      rows: p.rows.length, rowsDigest: rowsDigest(p.rows), rows150, rowsDigest150: digest150, watched: watchedDigest(p), next3: p.next3,
      world: sha(worldMinusRefs(p.world)), snapshot: sha(snapshotMinusRefs(p.world)),
    }
  }
  const college: Capture['college'] = {}
  for (const [seed, early] of [['l37-college-a', false], ['l37-college-b', true]] as const) {
    const p = playCollege(seed, early)
    college[p.label] = {
      rows: p.rows.length, rowsDigest: rowsDigest(p.rows), watched: watchedDigest(p), next3: p.next3, weeks: p.weeks,
      world: sha(worldMinusRefs(p.world)), snapshot: sha(snapshotMinusRefs(p.world)),
    }
  }
  return { viz: { commentary: commentaryDigests(), preview: previewDigests(), knock: knockDigest(), famous: famousDigest() }, careers, college }
}

const target = process.env.L37_CAPTURE
if (target) {
  describe('L3-7 capture', () => {
    it('writes the digests of this tree', () => {
      const out = capture()
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, JSON.stringify(out, null, 1) + '\n')
      expect(existsSync(target)).toBe(true)
    }, 60_000)
  })
} else {
  describe('L3-7 the twin – this tree reproduces the pre-wave tree\'s English', () => {
    const old = JSON.parse(readFileSync(FIXTURE, 'utf8')) as Capture
    const now = capture()
    it('commentary: every digest of the grid is the pre-wave tree\'s', () => {
      expect(now.viz.commentary.builds, 'a non-empty denominator on both arms').toBe(old.viz.commentary.builds)
      expect(now.viz.commentary.beats).toBe(old.viz.commentary.beats)
      expect(now.viz.commentary.digests).toEqual(old.viz.commentary.digests)
    })
    it('preview: every digest of the grid is the pre-wave tree\'s', () => {
      expect(now.viz.preview.builds).toBe(old.viz.preview.builds)
      expect(now.viz.preview.digests).toEqual(old.viz.preview.digests)
    })
    it('the famous career: the booth\'s six packets as the ENGINE issues them, and the commentary of ten matches under each, are the pre-wave tree\'s', () => {
      expect(now.viz.famous.packets.filter((p) => p.packet).length, 'a non-empty denominator: all six packets were issued').toBe(6)
      expect(now.viz.famous.booth, 'the booth really spoke').toBeGreaterThan(0)
      expect(now.viz.famous).toEqual(old.viz.famous)
    })
    it('the knock prompt grid is the pre-wave tree\'s', () => {
      expect(now.viz.knock).toEqual(old.viz.knock)
    })
    it('five bench careers x 300 weeks: every row read as it was written, the matches watched, the world and the snapshot minus refs, the next draws', () => {
      expect(now.careers).toEqual(old.careers)
    })
    it('a college career driven through the years and back, and one that came back early', () => {
      expect(now.college).toEqual(old.college)
    })
  })
}

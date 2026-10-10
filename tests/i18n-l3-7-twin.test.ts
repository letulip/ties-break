// L3-7 (10.10) – THE TWIN AGAINST THE PRE-WAVE TREE. docs/specs/i18n-2026-10.md §8 row L3-7.
//
// Capture mode (`L37_CAPTURE=<path>`) writes the digests of everything a player reads, on WHATEVER tree it runs on – the stored fixture was captured on the pre-wave tree (4adc0d58), before a line of the
// wave existed. Compare mode (default) reads that fixture and requires this tree to reproduce it.
// ⚠ 10.10 (the strong-repeat trim): the owner's own ruling moved four door receipts, so «the
// pre-wave tree's English» now means «plus his ruled wording changes» – the fixture refreshes at
// each such ruling (re-captured, the diff reviewed to be ONLY the ruled strings) with a dated note.
//
// ⚠⚠ TWO PLATFORM FAMILIES, BOTH TRUE (10.10, the day-long hunt). The PR runner (ubuntu/x64,
// node 22) produces snapshot digests no darwin/arm64 machine can – measured to the last cell: a
// podman `--platform linux/amd64 node:22` capture reproduced ALL SEVEN of the CI run's digests
// exactly, while solo and bulk runs on two arm64 Macs reproduce the darwin fixture. The carriers
// (coachMarket / coachDeal / upcoming) are where the coach-price curves' transcendentals live, and
// a last-ulp difference between V8 builds is a cent, which is a different quote. The PRODUCT law
// is per-device determinism (a save resumes, never replays – v35); cross-platform byte-equality of
// float curves was never its claim, so the NET now compares each platform family to ITS OWN frozen
// capture, full strength on both:
//   darwin/arm64:  tests/fixtures/l3-7/old-arm.json            (L37_CAPTURE on this Mac)
//   linux/x64:     tests/fixtures/l3-7/old-arm.linux-x64.json  (podman run --rm --platform
//     linux/amd64 -v "$PWD":/src:ro -v <out>:/out node:22 … L37_CAPTURE=/out/… – node 22 is the
//     CI pin; refresh BOTH on every ruled wording change, diff-reviewed the same way.)
// An unlisted family refuses by name rather than comparing apples to a frozen orange.
import { describe, expect, it } from 'vitest'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import {
  commentaryDigests, previewDigests, knockDigest, famousDigest, playBench, playCollege, watchedDigest, rowsDigest, worldMinusRefs, snapshotMinusRefs, worldFieldDigests, snapshotFieldDigests, sha,
} from './helpers/l3-7-play'
import { coachMarket } from '../src/engine/world/coachMarket'
import { toSnapshot } from '../src/engine/world'

// ⚠ L37_DUMP (10.10) – the FIELD dump, the diagnostic twin of L37_CAPTURE: writes the three fields
// the owner's reproducible red names (coachMarket, upcoming, coachDeal) as OBJECTS, per career, so
// two machines' runs can be diffed cell by cell instead of hash against hash. Works in both modes;
// a red compare still writes it. One environment produces digests no other can reproduce – this is
// the instrument that names the cell.
/** The first pass's raw serialisations, retained so a mismatch writes the DIVERGED bytes – a re-play after the fact could land on the other family. */
const rawArm: Record<string, { world: string; snapshot: string }> = {}

const DUMP = process.env.L37_DUMP
const dumped: Record<string, unknown> = {}
function dumpFields(label: string, world: Parameters<typeof toSnapshot>[0]): void {
  if (!DUMP) return
  const w = world as unknown as Record<string, unknown>
  const snap = toSnapshot(world) as unknown as Record<string, unknown>
  dumped[label] = { coachDeal: w.coachDeal ?? null, coachMarket: coachMarket(world), upcoming: snap.upcoming }
}

const FAMILY = `${process.platform}-${process.arch}`
const FIXTURE_BY_FAMILY: Record<string, string> = {
  'darwin-arm64': 'fixtures/l3-7/old-arm.json',
  'linux-x64': 'fixtures/l3-7/old-arm.linux-x64.json',
}
const FIXTURE_REL = FIXTURE_BY_FAMILY[FAMILY]
if (FIXTURE_REL === undefined) throw new Error(`the twin has no frozen capture for the platform family «${FAMILY}» – capture one (commands in this file's header) and list it in FIXTURE_BY_FAMILY`)
const FIXTURE = resolve(__dirname, FIXTURE_REL)
const CAREERS: Array<[number, number]> = [[5, 0], [8, 0], [0, 1], [6, 1], [5, 1]]

// `worldFields`/`snapshotFields` (10.10): the same serialisation digested per top-level key, so a
// mismatch names the field that moved instead of handing over one opaque hash. The fixture was
// re-captured at the SAME pre-wave commit (4adc0d58) with the extended shape; every aggregate
// digest was byte-compared against the previous fixture before the swap, so the net's claim did
// not move – only its failure mode did.
interface Capture {
  viz: { commentary: ReturnType<typeof commentaryDigests>; preview: ReturnType<typeof previewDigests>; knock: ReturnType<typeof knockDigest>; famous: ReturnType<typeof famousDigest> }
  careers: Record<string, { rows: number; rowsDigest: string; rows150: number; rowsDigest150: string; watched: ReturnType<typeof watchedDigest>; next3: number[]; world: string; snapshot: string; worldFields: Record<string, string>; snapshotFields: Record<string, string> }>
  college: Record<string, { rows: number; rowsDigest: string; watched: ReturnType<typeof watchedDigest>; next3: number[]; world: string; snapshot: string; weeks: number; worldFields: Record<string, string>; snapshotFields: Record<string, string> }>
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
      worldFields: worldFieldDigests(p.world), snapshotFields: snapshotFieldDigests(p.world),
    }
    dumpFields(p.label, p.world)
    rawArm[p.label] = { world: worldMinusRefs(p.world), snapshot: snapshotMinusRefs(p.world) }
  }
  const college: Capture['college'] = {}
  for (const [seed, early] of [['l37-college-a', false], ['l37-college-b', true]] as const) {
    const p = playCollege(seed, early)
    college[p.label] = {
      rows: p.rows.length, rowsDigest: rowsDigest(p.rows), watched: watchedDigest(p), next3: p.next3, weeks: p.weeks,
      world: sha(worldMinusRefs(p.world)), snapshot: sha(snapshotMinusRefs(p.world)),
      worldFields: worldFieldDigests(p.world), snapshotFields: snapshotFieldDigests(p.world),
    }
    dumpFields(p.label, p.world)
    rawArm[p.label] = { world: worldMinusRefs(p.world), snapshot: snapshotMinusRefs(p.world) }
  }
  if (DUMP) {
    mkdirSync(dirname(DUMP), { recursive: true })
    writeFileSync(DUMP, JSON.stringify({ node: process.version, env: { TZ: process.env.TZ ?? null, LANG: process.env.LANG ?? null, NODE_OPTIONS: process.env.NODE_OPTIONS ?? null }, fields: dumped }, null, 1) + '\n')
  }
  return { viz: { commentary: commentaryDigests(), preview: previewDigests(), knock: knockDigest(), famous: famousDigest() }, careers, college }
}

// ⚠ L37_TWICE (10.10) – the in-registry statefulness probe: the owner's bulk reds carry digests no
// solo run on EITHER machine reproduces, and the one mechanism left is a second collection in a
// warm module registry (vitest re-collects a file when a stalled worker's report is lost). This
// knob runs capture() twice in ONE registry and names every digest the second pass moved – green
// means the engine is registry-pure and the bulk red is the runner's, red names the stateful module.
if (process.env.L37_TWICE) {
  describe('L3-7 twice – a second capture in the same registry changes nothing', () => {
    it('every digest of pass two equals pass one', () => {
      const first = capture()
      const second = capture()
      expect(second).toEqual(first)
    }, 60_000)  /* birpc ceiling – the probe runs only under its env knob, never in bulk, but the budget ratchet sweeps statically */
  })
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
    // ⚠ 10.10 – EVIDENCE SELF-CAPTURES ON RED. The owner's bulk reds (three now, always beside
    // birpc stalls, always the same alternate digests) never coincided with an armed dump knob, so
    // the cell stayed unnamed. On ANY digest mismatch the net now writes the diverging careers'
    // full minus-refs serialisations to a timestamped file in the system tmpdir and names it in
    // the failure output – no knob, no overwrite, the red carries its own forensics.
    const divergent = [...Object.keys(now.careers), ...Object.keys(now.college)].filter((k) => {
      const a = (now.careers[k] ?? now.college[k])!
      const b = (old.careers[k] ?? old.college[k])
      return b === undefined || a.snapshot !== b.snapshot || a.world !== b.world || a.rowsDigest !== b.rowsDigest
    })
    if (divergent.length > 0) {
      const evid = `${tmpdir()}/twin-red-${Date.now()}.json`
      const bodies: Record<string, unknown> = {}
      for (const label of divergent) {
        const raw = rawArm[label]
        if (raw) bodies[label] = { world: JSON.parse(raw.world), snapshot: JSON.parse(raw.snapshot) }
      }
      writeFileSync(evid, JSON.stringify({ node: process.version, divergent, bodies }, null, 1))
      // eslint-disable-next-line no-console
      console.error(`[twin] digests diverged for ${divergent.join(', ')} – full bodies written to ${evid}`)
    }
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

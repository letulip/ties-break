// Lane A probe (26.09 review, baseline 03d92221). Read-only: imports repo code, writes nothing.
//
// What `createWorld` does with a `new.prologue` handover that is out of domain. The worker passes
// `msg.prologue` through untouched (sim.worker.ts:311-318); `profileShapeError` checks only
// `msg.profile`. `prologueFundsCents`'s own doc calls its clamp "A GUARD AND NOT A DIAL" against a
// wire payload (economy.ts:8764-8767). This asks: does the clamp hold for NaN / non-numbers, what
// do out-of-domain `years` do to the arrival, and what happens to such a career at export/import.
//
// Run from the baseline worktree: npx vite-node docs/review-principles-2026-09-26/probes/a-prologue-wire.ts
import { createWorld, tickWeek, dynastyHandoverOf } from '../../../src/engine/world'
import { medianChildhood } from '../../../src/engine/childhood'
import { resumeMain } from '../../../src/engine/rng'
import { encodeExportFile, decodeExportFile, compressWorld, decompressWorld } from '../../../src/engine/saveCodec'
import { DEFAULT_PROFILE, type PrologueHandover } from '../../../src/shared/protocol'

const SEED = 'lane-a-wire'

function born(label: string, prologue: unknown): ReturnType<typeof createWorld> | null {
  try {
    const w = createWorld(SEED, { ...DEFAULT_PROFILE }, 'c-' + label, prologue as PrologueHandover)
    const s = w.skills as unknown as Record<string, number>
    const bad = Object.entries(s).filter(([, v]) => !Number.isFinite(v)).map(([k]) => k)
    console.log(`${label}: born; fundsCents=${w.fundsCents}; non-finite skills=[${bad.join(',')}]; coachTier=${w.profile.coachTier}; playStyle=${w.profile.playStyle}`)
    return w
  } catch (e) {
    console.log(`${label}: createWorld THREW – ${(e as Error).message}`)
    return null
  }
}

async function lifecycle(label: string, w: ReturnType<typeof createWorld>): Promise<void> {
  const rng = resumeMain(w.rngMain)
  for (let i = 0; i < 4; i++) tickWeek(w, rng)
  console.log(`${label}: after 4 ticks fundsCents=${w.fundsCents}`)
  try {
    const { payload, checksum } = await compressWorld(w)
    const back = await decompressWorld(payload, checksum)
    console.log(`${label}: autosave codec round-trip fundsCents=${JSON.stringify(back.fundsCents)}`)
  } catch (e) {
    console.log(`${label}: autosave codec round-trip THREW – ${(e as Error).message}`)
  }
  try {
    const bytes = await encodeExportFile(w)
    const back = await decodeExportFile(bytes)
    console.log(`${label}: export -> import OK, fundsCents=${back.fundsCents}`)
  } catch (e) {
    console.log(`${label}: export -> import REFUSED – ${(e as Error).message}`)
  }
}

async function main(): Promise<void> {
  const years = medianChildhood()
  const control = born('control', { years, spentCents: 0 })
  if (control) await lifecycle('control', control)

  const nan = born('spentCents=NaN', { years, spentCents: Number.NaN })
  if (nan) await lifecycle('spentCents=NaN', nan)

  born('spentCents="0"(string)', { years, spentCents: '0' })
  born('spentCents missing', { years })

  const nanYear = years.map((y, i) => (i === 0 ? { ...y, practice: Number.NaN } : y))
  const w2 = born('years[0].practice=NaN', { years: nanYear, spentCents: 0 })
  if (w2) await lifecycle('years[0].practice=NaN', w2)

  born('years=null', { years: null, spentCents: 0 })

  // The sixth-argument sibling: `new.dynasty` is not shape-checked either, and its `background`
  // REPLACES the profile's background after `profileShapeError` has accepted the profile.
  if (control) {
    try {
      const real = dynastyHandoverOf(control)
      const bogus = { ...real, background: 'bogus' }
      const w = createWorld(SEED, { ...DEFAULT_PROFILE }, 'c-dyn', undefined, bogus as never)
      console.log(`dynasty.background="bogus": born; fundsCents=${w.fundsCents}; profile.background=${w.profile.background}`)
      await lifecycle('dynasty.background="bogus"', w)
    } catch (e) {
      console.log(`dynasty.background="bogus": THREW – ${(e as Error).message}`)
    }
  }
  born('years[0].focus="bogus"', { years: years.map((y, i) => (i === 0 ? { ...y, focus: 'bogus' } : y)), spentCents: 0 })
}

main().then(
  () => console.log('PROBE_DONE'),
  (e) => {
    console.log('PROBE_FAILED', e)
    process.exitCode = 1
  },
)

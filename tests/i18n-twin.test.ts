// THE DETERMINISM TWIN – the locale never touches the engine's dice (spec §3.4, CLAUDE.md invariant 2).
//
// The input-independence law says a no-action run and an action-laden run under the same code tap
// IDENTICAL MAIN sequences: a player's choices may never re-roll the world. The language is a player
// choice like any other, so the same law applies to it. One seed, one career, three arms:
//
//   en                       – the source language, no catalog
//   ru, empty catalog        – today's Russian: the locale is `ru` and every key misses
//   ru, catalog loaded       – the locale is `ru` and some keys translate
//
// each ticked for 104 weeks the way the worker does it (`resumeMain(world.rngMain)`, tournaments
// answered by skipping), with the UI's own `t()` calls interleaved between the ticks as a screen would
// make them. The arms must end on the SAME `rngMain {s, n}` and the SAME snapshot, byte for byte.
//
// ⚠ WHAT THIS CATCHES, STATED HONESTLY. The engine imports nothing from `src/i18n`
// (tests/i18n-purity.test.ts holds that edge), so today the twin is true by construction. It is a net
// for the wave that makes it false: an engine module that reads the locale and branches or draws on it
// (a `cp` migration that formats instead of emitting a CopyRef, a «Russian gets another flavour line»
// shortcut). That is the failure the mutation arm below plants.
//
// ⚠ MUTATION ARMS (watched red; outputs in the wave report):
//   1. src/engine/world/tick.ts: import the locale and draw one extra MAIN number when it is `ru`
//      -> the twin goes red on `rngMain` and on the snapshot.
//   2. src/engine/saveCodec.ts: write the locale into the serialised world
//      -> the byte-identical-save case goes red.
import { describe, expect, it } from 'vitest'
import { closeTournament, createWorld, skipTournament, tickWeek, toSnapshot, type WorldState } from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { compressWorld, encodeExportFile } from '../src/engine/saveCodec'
import { installCatalog, locale, missCount, renderCopy, resetI18nForTests, setLocale, t } from '../src/i18n'
import { cp } from '../src/shared/i18n'
import { fnv1aHex } from './helpers/hash'

const SEED = 'i18n-twin-l1a'
const WEEKS = 104

interface Arm {
  name: string
  locale: 'en' | 'ru'
  catalog?: Record<string, string>
}
const ARMS: Arm[] = [
  { name: 'en', locale: 'en' },
  { name: 'ru, empty catalog', locale: 'ru' },
  { name: 'ru, catalog loaded', locale: 'ru', catalog: { Home: '[ru] Home', 'Week {n}': '[ru] week {n}' } },
]

// This runner has no localStorage; the locale module tolerates its absence by design (a private-mode
// browser is the same shape), so nothing is installed here.

async function enter(arm: Arm): Promise<void> {
  resetI18nForTests()
  if (arm.catalog) installCatalog(arm.locale, arm.catalog)
  await setLocale(arm.locale)
  expect(locale.value, `the ${arm.name} arm really runs in its locale`).toBe(arm.locale)
}

async function walk(arm: Arm): Promise<WorldState> {
  await enter(arm)
  const world = createWorld(SEED)
  const rng = resumeMain(world.rngMain)
  for (let week = 0; week < WEEKS; week++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
    // What a mounted screen does between ticks, in the arm's locale. None of it is the engine's business.
    t('Week {n}', { n: week })
    t('Home')
    renderCopy(cp`Rain washed out ${'practice'}`)
  }
  return world
}

/** Every finite number in the snapshot, in key order – the «numeric snapshot» of spec §3.4. */
function numbersOf(value: unknown, out: number[] = []): number[] {
  if (typeof value === 'number') {
    if (Number.isFinite(value)) out.push(value)
  } else if (Array.isArray(value)) {
    for (const v of value) numbersOf(v, out)
  } else if (value !== null && typeof value === 'object') {
    for (const k of Object.keys(value).sort()) numbersOf((value as Record<string, unknown>)[k], out)
  }
  return out
}

const hex = (bytes: Uint8Array): string => Buffer.from(bytes).toString('hex')

describe('the twin run: same seed, locale en vs ru – identical dice, identical world', () => {
  it('rngMain {s, n} and the whole snapshot agree across all three arms after 104 weeks', async () => {
    const runs: Array<{ arm: Arm; rngMain: { s: number; n: number }; json: string; numbers: number[] }> = []
    for (const arm of ARMS) {
      const world = await walk(arm)
      const snapshot = toSnapshot(world)
      runs.push({ arm, rngMain: { ...world.rngMain }, json: JSON.stringify(snapshot), numbers: numbersOf(snapshot) })
    }
    const base = runs[0]!
    // A non-empty denominator on EVERY arm: an arm that ticked nothing would "agree" with anything.
    for (const run of runs) {
      expect(run.rngMain.n, `${run.arm.name}: the arm drew from MAIN`).toBeGreaterThan(1000)
      expect(run.numbers.length, `${run.arm.name}: the snapshot has numbers to compare`).toBeGreaterThan(500)
    }
    for (const run of runs.slice(1)) {
      expect(run.rngMain, `${run.arm.name} ends on the same MAIN position as en`).toEqual(base.rngMain)
      expect(fnv1aHex(run.numbers.join(',')), `${run.arm.name}: numeric snapshot`).toBe(fnv1aHex(base.numbers.join(',')))
      expect(run.json === base.json, `${run.arm.name}: the snapshot is byte-identical to en`).toBe(true)
    }
  })

  it('the Russian arms really exercised the misses (the arms differ in what the UI did, not in what the engine did)', async () => {
    await walk(ARMS[0]!)
    expect(missCount(), 'English never counts').toBe(0)
    await walk(ARMS[1]!)
    expect(missCount(), 'empty-catalog Russian misses on every render').toBeGreaterThan(0)
  })
})

describe('the locale is never written into a save', () => {
  it('the same world encodes to byte-identical payload, checksum and export file under every locale', async () => {
    const world = await walk(ARMS[0]!)
    const encoded: Array<{ payload: string; checksum: string; file: string }> = []
    for (const arm of ARMS) {
      await enter(arm)
      const { payload, checksum } = await compressWorld(world)
      encoded.push({ payload: hex(payload), checksum: hex(checksum), file: hex(await encodeExportFile(world)) })
    }
    expect(encoded[0]!.payload.length, 'the save is not empty').toBeGreaterThan(1000)
    expect(encoded[1], 'ru (empty catalog) saves the same bytes as en').toEqual(encoded[0])
    expect(encoded[2], 'ru (catalog loaded) saves the same bytes as en').toEqual(encoded[0])
  })

  it('neither the world nor its snapshot carries a locale field or the preference key', async () => {
    const world = await walk(ARMS[1]!)
    for (const [what, json] of [
      ['world', JSON.stringify(world)],
      ['snapshot', JSON.stringify(toSnapshot(world))],
    ] as const) {
      expect(json, `the ${what} names no locale`).not.toMatch(/"locale"|"lang"|tb-locale/)
    }
  })
})

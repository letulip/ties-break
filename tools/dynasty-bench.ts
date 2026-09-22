/**
 * dynasty-bench – wave 10 T7: the five rows of the dynasty spec's §8, predicted beside measured.
 *
 * docs/specs/the-dynasty-2026-09.md §8. His go for the wave, 22.09; the heredity's own ruling the
 * same day: «наследственность темперамента – можно и забенчить, мне кажется».
 *
 * ⚠⚠ EVERY ROW PRINTS ITS PREDICTION BESIDE ITS MEASUREMENT, and the prediction is the SPEC's rather
 * than this file's – `docs/specs/rank-plateau.md`'s lesson applied before the fact instead of after.
 * A bench that printed only what it found would let the spec's §8 be filled in from whatever came
 * out, which is the failure invariant 5 exists to refuse.
 *
 * ZERO RNG DISCIPLINE: nothing here touches MAIN. The creations go through `createWorld`, which
 * draws on purpose-scoped sub-streams only, and the walked careers go through `stepCareerWeek` –
 * the shipped bench harness. The frozen capture (41550 / e6b0c709) cannot see this file.
 *
 * Run:
 *   npm run bench:dynasty                 # every row
 *   npx vite-node tools/dynasty-bench.ts --lean 400 --corpus 24 --cap 1200
 */
import { createHash } from 'node:crypto'
import {
  ancestorSeedOf,
  createWorld,
  dynastyBackgroundOf,
  dynastyHandoverOf,
  temperamentFor,
  wasThereAChild,
  type WorldState,
} from '../src/engine/world'
import { temperamentOpenness, TEMPERAMENTS, type Temperament } from '../src/engine/spirit'
import { ECONOMY } from '../src/engine/economy'
import { DEFAULT_PROFILE, type DynastyHandover, type FamilyBackground } from '../src/shared/protocol'
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from './econ-bench'

// --- arguments -----------------------------------------------------------------------------------

function numArg(argv: string[], name: string, fallback: number): number {
  const at = argv.indexOf(name)
  if (at < 0) return fallback
  const value = Number(argv[at + 1])
  return Number.isFinite(value) && value > 0 ? value : fallback
}

const argv = process.argv.slice(2)
/** §8 row 1 asks for 400, and 400 is the default so the spec's own row can be filled from the run it
 *  asked for.
 *
 *  ⚠⚠ BUT 400 IS TOO SMALL TO CONFIRM 0.65, MEASURED RATHER THAN SUSPECTED, and the UNLEANED CONTROL
 *  printed beside it is what says so: over the seed family `bench-lean-<i>` the leaned arm reads
 *  60.75% at N=400 and the control reads 45.75% against its own 50%, so BOTH arms sit ~4 pp low and
 *  the shortfall belongs to the sample rather than to the lean. Walked out: 63.55% / 48.35% at 2,000,
 *  64.80% / 49.15% at 10,000, 64.88% / 49.83% at 50,000. The mechanism is exactly the drafted rate;
 *  the row's N is what cannot see it. Pass `--lean 10000` before anyone tunes the constant. */
const LEAN_N = numArg(argv, '--lean', 400)
/** How many (preset × policy × seed) cells the corpus rows walk. 24 is one full sweep of the six
 *  live presets against both policies at two seeds – ~110 s on this machine. */
const CORPUS_N = numArg(argv, '--corpus', 24)
/** The belt on a walk. Every career reaches an ending long before it; a career that does not is
 *  REPORTED as unfinished rather than silently counted as one of the endings. */
const CAP = numArg(argv, '--cap', 1200)

const pct = (x: number): string => `${(100 * x).toFixed(1)}%`

function blockOf(mother: Temperament, career: Partial<DynastyHandover['motherCareer']> = {}): DynastyHandover {
  return {
    generation: 1,
    childSeed: 'bench:dynasty:1',
    background: 'middle',
    raisedOnTour: false,
    motherName: { first: 'Vera', last: 'Kowalski' },
    motherCountry: 'PL',
    motherTemperament: mother,
    motherCareer: { titles: 0, bestRank: null, slams: 0, endedWeek: 900, endingKind: 'natural', ...career },
  }
}

// =================================================================================================
// §8 ROW 1 – THE LEAN
// =================================================================================================

function rowLean(): void {
  console.log('\n1. THE OPENNESS LEAN – one mother, swept across seeds')
  console.log(`   predicted: ${ECONOMY.dynasty.opennessLean} ± SEM   (the spec's §8 row 1, drafted)`)
  for (const mother of TEMPERAMENTS) {
    const pole = temperamentOpenness(mother)
    let took = 0
    for (let i = 0; i < LEAN_N; i += 1) {
      if (temperamentOpenness(temperamentFor(`bench-lean-${i}`, mother)) === pole) took += 1
    }
    const share = took / LEAN_N
    // The binomial standard error at the drafted rate, so the row can be read without a calculator.
    const sem = Math.sqrt((share * (1 - share)) / LEAN_N)
    console.log(
      `   mother ${mother.padEnd(6)} (${pole.padEnd(7)}) – measured ${pct(share)} ± ${pct(sem)}  ` +
        `(${took} of ${LEAN_N})`,
    )
  }
  // ⚠ THE ARM THAT SAYS THE LEAN IS A LEAN: the no-mother sweep must stay at a half, because the
  // constant may not reach a career that continues no line.
  let open = 0
  for (let i = 0; i < LEAN_N; i += 1) {
    if (temperamentOpenness(temperamentFor(`bench-lean-${i}`)) === 'open') open += 1
  }
  console.log(`   no mother          – measured ${pct(open / LEAN_N)} open  (predicted 50.0%, uniform)`)
}

// =================================================================================================
// §8 ROW 2 – THE FAIRNESS CORRIDOR, RE-READ ON DYNASTY-CREATED WORLDS
// =================================================================================================

function rowFairness(): void {
  console.log('\n2. THE FAIRNESS CORRIDOR on dynasty-created worlds')
  console.log('   predicted: the four temperaments within ±1.5 pp   (§8 row 2, wave 1\'s own bar)')
  // ⚠⚠ WHAT THIS ROW CAN AND CANNOT SAY, STATED RATHER THAN IMPLIED. Wave 1's corridor is a WIN-pp
  // spread over walked careers, and walking four arms to a horizon costs minutes per arm. What is
  // measured here is the corridor's INPUT: whether a dynasty creation hands the four temperaments
  // the same starting build, which is the only thing the dynasty could have broken. Her outcomes are
  // downstream of that and of nothing else this wave touched – the lean re-maps WHICH girl is drawn
  // and changes no number she is drawn with.
  const spread: number[] = []
  for (const mother of TEMPERAMENTS) {
    const world = createWorld('bench-fair', DEFAULT_PROFILE, 'c-fair', undefined, blockOf(mother))
    const mean = (world.skills.serve + world.skills.ret + world.skills.groundstrokes) / 3
    spread.push(mean)
    console.log(`   mother ${mother.padEnd(6)} – daughter ${world.temperament?.padEnd(6)} · opening build ${mean.toFixed(2)}`)
  }
  const worst = Math.max(...spread) - Math.min(...spread)
  console.log(`   measured: the widest gap between two arms is ${worst.toFixed(2)} of a point`)
  console.log('   ⚠ this is the corridor\'s INPUT, not the corridor – see the note in this section')
}

// =================================================================================================
// THE CORPUS WALK – rows 3 and 5 share it, so it is walked ONCE
// =================================================================================================

interface Lived {
  cell: string
  world: WorldState
  weeks: number
  finished: boolean
}

function corpusCells(n: number): [number, number, number][] {
  const out: [number, number, number][] = []
  for (const seed of [0, 1]) {
    for (const policy of [0, 1]) {
      for (const preset of [0, 2, 3, 5, 6, 8]) {
        out.push([preset, policy, seed])
        if (out.length >= n) return out
      }
    }
  }
  return out
}

function walkCorpus(): Lived[] {
  const out: Lived[] = []
  for (const [preset, policy, seed] of corpusCells(CORPUS_N)) {
    const { world, rng } = openCareer(PRESETS[preset], seed, POLICIES[policy])
    let weeks = 0
    while (world.ending === null && weeks < CAP) {
      stepCareerWeek(world, rng, POLICIES[policy])
      weeks += 1
    }
    out.push({ cell: `p${preset}/pol${policy}/i${seed}`, world, weeks, finished: world.ending !== null })
  }
  return out
}

function rowBackground(corpus: Lived[]): void {
  console.log('\n3. THE WEALTH BAND over the walked corpus')
  console.log("   predicted: wealthy for every titled career; middle/working only via college-fork")
  console.log('              and early-leaving mothers   (§8 row 3)')
  const bands: Record<FamilyBackground, number> = { wealthy: 0, middle: 0, working: 0 }
  let titledButNotWealthy = 0
  for (const row of corpus) {
    const block = dynastyHandoverOf(row.world)
    bands[block.background] += 1
    if (block.motherCareer.titles > 0 && block.background !== 'wealthy') titledButNotWealthy += 1
    // ⚠ THE BAND IS RE-DERIVED FROM HER ACCOUNT HERE rather than trusted off the block, which is the
    // cheapest possible statement that the mapping and the handover cannot disagree.
    if (dynastyBackgroundOf(row.world.kidFundsCents) !== block.background) {
      console.log(`   ⚠⚠ ${row.cell}: the block's band and the mapping DISAGREE – two spellings of §4`)
    }
  }
  const n = corpus.length
  console.log(
    `   measured: wealthy ${bands.wealthy}/${n} · middle ${bands.middle}/${n} · working ${bands.working}/${n}`,
  )
  console.log(
    `   ⚠ TITLED CAREERS THAT DID **NOT** RETIRE WEALTHY: ${titledButNotWealthy} of ${n} – the row's` +
      ' prediction is about titles and the mapping reads HER OWN ACCOUNT',
  )
  console.log(`   ⚠ the corridors, read from ECONOMY: wealthy ≥ ${ECONOMY.startingFundsCents.wealthy / 100} · middle ≥ ${ECONOMY.startingFundsCents.middle / 100}`)
}

function rowDoorCensus(corpus: Lived[]): void {
  console.log('\n5. THE DOOR\'S TWO TEXTS over the walked corpus')
  console.log('   predicted: the door is always open; this only prices the two texts   (§8, T7 §5)')
  let lived = 0
  let unfinished = 0
  for (const row of corpus) {
    if (!row.finished) unfinished += 1
    if (wasThereAChild(row.world)) lived += 1
  }
  const n = corpus.length
  console.log(`   measured: lived variant ${lived}/${n} · epilogue variant ${n - lived}/${n}`)
  console.log(`   ⚠ careers that did not reach an ending inside ${CAP} weeks: ${unfinished} of ${n}`)
}

// =================================================================================================
// §8 ROW 4 – DETERMINISM
// =================================================================================================

const hash = (w: WorldState): string =>
  createHash('sha256').update(JSON.stringify(w as unknown as Record<string, unknown>)).digest('hex').slice(0, 16)

function rowDeterminism(corpus: Lived[]): void {
  console.log('\n4. DETERMINISM – the same ancestor, taken through the same rulings, twice')
  console.log('   predicted: hash-identical child worlds   (§8 row 4, §7\'s law)')
  let same = 0
  for (const row of corpus.slice(0, 4)) {
    const block = dynastyHandoverOf(row.world)
    const a = createWorld(block.childSeed, DEFAULT_PROFILE, 'c-det', undefined, block)
    const b = createWorld(block.childSeed, DEFAULT_PROFILE, 'c-det', undefined, block)
    const ok = hash(a) === hash(b)
    if (ok) same += 1
    console.log(
      `   ${row.cell.padEnd(14)} gen ${block.generation} · root ${ancestorSeedOf(block.childSeed, block.generation)}` +
        ` · ${hash(a)} ${ok ? '==' : '!='} ${hash(b)}`,
    )
  }
  console.log(`   measured: ${same} of ${Math.min(4, corpus.length)} identical`)
}

// =================================================================================================

function main(): void {
  console.log('DYNASTY BENCH – docs/specs/the-dynasty-2026-09.md §8, predicted beside measured')
  console.log(`(lean N=${LEAN_N}, corpus cells=${CORPUS_N}, walk cap=${CAP})`)
  rowLean()
  rowFairness()
  const corpus = walkCorpus()
  rowBackground(corpus)
  rowDeterminism(corpus)
  rowDoorCensus(corpus)
  // ⚠ ROW 5 OF THE SPEC (the frozen capture) IS NOT A BENCH ROW AND IS NOT PRINTED HERE. It is a
  // TEST verdict – `tests/condition.test.ts`, run standalone – and a bench that printed a number for
  // it would be a second place to read it from. The wave's report carries the run.
  console.log('\n⚠ the spec\'s §8 row 5 (the frozen MAIN capture) is a TEST verdict, not a bench row:')
  console.log('  npx vitest run --project unit tests/condition.test.ts')
}

main()

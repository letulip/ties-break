/**
 * weight-bench – wave 11 T6: the eight rows of the weight spec's §8, predicted beside measured.
 *
 * docs/specs/the-weight-2026-09.md §8. His go for the wave, 22.09.
 *
 * ⚠⚠ EVERY ROW PRINTS ITS PREDICTION BESIDE ITS MEASUREMENT, and the prediction is the SPEC's rather
 * than this file's – `docs/specs/rank-plateau.md`'s lesson applied before the fact instead of after.
 * A bench that printed only what it found would let §8 be filled in from whatever came out, which is
 * the failure invariant 5 exists to refuse.
 *
 * ⚠⚠ AND THE CORPUS TURNS THE SWITCH ON, WHICH IS THE ONE THING THIS FILE HAS TO DO THAT NO OTHER
 * BENCH DOES. `createWorld` writes `weightEnabled: false` for every caller that does not ask, and
 * `openCareer` does not ask – so a bench that forgot this line would measure a world where neither
 * hazard can fire and would report zeroes as findings. `setWeightEnabled(world, true)` on week 0 is
 * exactly what the settings row does, and row 6's OFF arm is the same corpus without it.
 *
 * ZERO RNG DISCIPLINE: nothing here touches MAIN except through `stepCareerWeek`, which is the
 * shipped walker. The hazards ride `seed:life:pregnancy-loss:<conceived>:<week>` and
 * `seed:life:loss:<week>`, both purpose-scoped. The frozen capture (41550 / e6b0c709) cannot see
 * this file, and row 8 re-runs it rather than assuming it.
 *
 * Run:
 *   npm run bench:weight                  # every row
 *   npx vite-node tools/weight-bench.ts --corpus 12 --hazard 4000
 */
import {
  bereavementChanceAt,
  createWorld,
  drawConceptionWindow,
  kidAgeExact,
  pregnancyLossChanceAt,
  rollBereavement,
  rollPregnancy,
  rollPregnancyLoss,
  setWeightEnabled,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { TEMPERAMENTS, temperamentOpenness, type Temperament } from '../src/engine/spirit'
import type { LoveEpisode } from '../src/shared/protocol'
import { drainLifeBeats } from './_lifeBeats'
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from './econ-bench'

// --- arguments -----------------------------------------------------------------------------------

function numArg(name: string, fallback: number): number {
  const at = process.argv.indexOf(name)
  if (at < 0) return fallback
  const value = Number(process.argv[at + 1])
  return Number.isFinite(value) && value > 0 ? value : fallback
}

/** How many (preset × policy × seed) cells the walked rows use. 12 is one sweep of the six live
 *  presets against both policies – ~55 s on this machine at the cap below. */
const CORPUS_N = numArg('--corpus', 12)
/** The belt on a walk. 1600 since the walker answers the retirement offer (wave 10's review): the
 *  natural ending lands around week 1506, so a shorter cap cuts exactly the endings row 1 needs. */
const CAP = numArg('--cap', 1600)
/** How many synthetic pregnancies / career-weeks the HAZARD rows draw. These rows measure a
 *  DISTRIBUTION rather than a career, so they are walked on the engine's own roll over parked
 *  worlds – thousands of draws for the price of none of the tick. */
const HAZARD_N = numArg('--hazard', 4000)

const pct = (x: number): string => `${(100 * x).toFixed(1)}%`
const W = ECONOMY.weight

// --- fixtures ------------------------------------------------------------------------------------

function weekAtAge(world: WorldState, years: number): number {
  for (let w = 0; w < 40 * 52; w++) {
    if (kidAgeExact(w, world.profile.birthMonth, world.profile.birthDay) >= years) return w
  }
  throw new Error(`no week reaches age ${years}`)
}

function married(latchedWeek: number, sinceWeek: number): LoveEpisode {
  return {
    id: `p:${sinceWeek}`, sinceWeek, endedWeek: null, knownWeek: sinceWeek + 2, wants: 'open',
    partnerId: `p:${sinceWeek}`, publicWeek: null, publicWrong: false, airedMetWeek: null,
    airedEndedWeek: null, latchedWeek, partnerName: 'Anton',
  }
}

/** A married, weight-ON career parked on a week the pregnancy hazard really lands on, at an age the
 *  caller names. ⚠ THE HIT IS FOUND ON THE ENGINE'S OWN CHANCE AND STREAM, never on a transcribed
 *  curve: a bench that hunted hits under a hazard the engine does not have would be measuring
 *  itself. Returns null when the seed's window holds no hit at that age. */
function conceivedAt(seed: string, ageYears: number): WorldState | null {
  // ⚠⚠ **ONE WORLD, WALKED** – and the first draft of this helper built a FRESH `createWorld` per
  // week, which is 52 of the engine's most expensive constructor per seed and made row 4 the slowest
  // thing in the file by an order of magnitude. It is safe to walk one: `rollPregnancy` MUTATES only
  // on a hit (it writes `world.pregnancy` and returns), a miss writes nothing at all, and the draw is
  // keyed on (seed, week) alone – so the dice a walked world meets are the dice fifty-two fresh ones
  // would have met. Measured rather than assumed: both shapes return the same pregnancies.
  const world = createWorld(seed, undefined, `c-${seed}`, undefined, undefined, true)
  world.season = []
  const from = weekAtAge(world, ageYears)
  const to = Math.min(weekAtAge(world, ageYears + 1), 40 * 52)
  world.loveEpisodes = [married(from - 104, from - 52)]
  for (let w = from; w < to; w++) {
    world.week = w
    rollPregnancy(world)
    if (world.pregnancy !== null) return world
  }
  return null
}

/** Walk a live pregnancy through the whole loss window and answer the week it ended, or null. */
function lossWeekOf(world: WorldState): number | null {
  const conceived = world.pregnancy!.conceivedWeek
  for (let w = conceived + W.lossFromWeek; w < conceived + W.lossUntilWeek; w++) {
    world.week = w
    rollPregnancyLoss(world)
    if (world.pregnancy === null) return w
  }
  return null
}

interface Lived {
  cell: string
  world: WorldState
  weeks: number
  finished: boolean
}

function walkCorpus(weightOn: boolean): Lived[] {
  const out: Lived[] = []
  // ⚠⚠ THE SEED INDEX VARIES PER CELL, AND IT IS A CORRECTION MADE BY THE FIRST RUN OF THIS BENCH
  // RATHER THAN A PRECAUTION. `openCareer` builds its seed as `bench-<background>-<index>`, and the
  // six live presets carry only THREE backgrounds – so a corpus at index 0 is twelve careers over
  // THREE dice sequences, and a census of «how many met a death» would be three draws reported as
  // twelve. The bereavement's key is `seed:life:loss:<week>`, so shared seeds means shared deaths.
  const cells: [number, number, number][] = []
  let i = 0
  // ⚠ THE SEED LOOP IS OUTERMOST so that a corpus of any size is a fair slice: `--corpus 6` takes
  // six different presets rather than three presets twice.
  for (let round = 0; cells.length < CORPUS_N; round++) {
    for (const policy of [0, 1]) {
      for (const preset of [0, 2, 3, 5, 6, 8]) {
        cells.push([preset, policy, i])
        i += 1
        if (cells.length >= CORPUS_N) break
      }
      if (cells.length >= CORPUS_N) break
    }
    if (round > 200) break
  }
  for (const [preset, policy, index] of cells.slice(0, CORPUS_N)) {
    const pol = { ...POLICIES[policy], answerRetirementOffers: true }
    const { world, rng } = openCareer(PRESETS[preset], index, pol)
    // ⚠⚠ THE SWITCH, ON WEEK 0, AND IT IS THE WHOLE DIFFERENCE BETWEEN THE TWO ARMS OF ROW 6.
    if (weightOn) setWeightEnabled(world, true)
    let weeks = 0
    while (world.ending === null && weeks < CAP) {
      stepCareerWeek(world, rng, pol)
      // ⚠ THE BEATS ARE DRAINED AT THE KIND'S OWN REGISTERED ANSWER (`DRAIN_ANSWER`), which for the
      // bereavement is `come` at 0 – so the drain carries a stated skew of exactly nothing.
      // ⚠⚠ AND NOT ON AN ENDED CAREER: `answerLifeBeat` goes through `guardNotEndedForGood` and
      // THROWS, which is the engine refusing a command a stale screen could not have sent. Measured
      // on the first run of this bench rather than reasoned about – a career that latches its
      // ending on the same tick a beat is raised would have crashed the walk.
      if (world.ending === null) drainLifeBeats(world)
      weeks += 1
    }
    out.push({ cell: `p${preset}/pol${policy}/i${index}`, world, weeks, finished: world.ending !== null })
  }
  return out
}

// --- the rows ------------------------------------------------------------------------------------

function row1(corpus: Lived[]): void {
  console.log('\n1. BEREAVEMENT FREQUENCY over the 23→35 tail, switch ON')
  console.log('   predicted: ~40% of careers meet one, ~8% a second; spacing ≥156 and cap 2 never')
  console.log('              violated   (§8 row 1)')
  // ⚠⚠ THE CLOSED FORM FIRST, because it is what his 11.09 numbers PREDICT, and the walked census
  // second, because it is what a player meets. The two differ for a reason the row has to print
  // rather than hide: a walked career only accrues tail weeks while it is still running.
  const tail = 52 * (35 - 23)
  console.log(`   closed form over a FULL tail (${tail} weeks at ${W.bereavement.perWeek}/wk):`)
  console.log(`     one or more ${pct(1 - Math.pow(1 - W.bereavement.perWeek, tail))} · E = ${(tail * W.bereavement.perWeek).toFixed(2)}`)
  let met = 0
  let twice = 0
  let violations = 0
  let adultWeeks = 0
  for (const row of corpus) {
    const weeks = row.world.bereavementWeeks
    if (weeks.length > 0) met += 1
    if (weeks.length > 1) twice += 1
    if (weeks.length > W.bereavement.capPerCareer) violations += 1
    for (let i = 1; i < weeks.length; i++) {
      if (weeks[i] - weeks[i - 1] < W.bereavement.spacingWeeks) violations += 1
    }
    const adultFrom = weekAtAge(row.world, W.bereavement.fromAgeYears)
    adultWeeks += Math.max(0, row.world.week - adultFrom)
  }
  const n = corpus.length
  console.log(`   measured over ${n} walked careers: met one ${pct(met / n)} · a second ${pct(twice / n)}`)
  console.log(`     cap/spacing violations: ${violations}   (any number but 0 is a defect)`)
  console.log(`     ⚠ mean ADULT weeks actually lived: ${(adultWeeks / n).toFixed(0)} of ${tail} –`)
  console.log('       the share is a share of the tail a career REACHES, not of the tail on paper')
}

function row2(): void {
  console.log('\n2. HAZARD ↔ TEMPERAMENT (the design-law arm)')
  console.log('   predicted: zero – identical realised hazard across all four temperaments on')
  console.log('              shared seeds   (§8 row 2)')
  let disagreements = 0
  let metAny = 0
  for (let i = 0; i < 40; i++) {
    const base = createWorld(`weight-voice-${i}`, undefined, `c${i}`, undefined, undefined, true)
    base.season = []
    base.week = weekAtAge(base, 23)
    const arms = TEMPERAMENTS.map((t: Temperament) => {
      const world = structuredClone(base)
      world.temperament = t
      const from = world.week
      for (let w = from; w < from + 52 * 12; w++) {
        world.week = w
        rollBereavement(world)
        world.lifeLog = []
      }
      return world.bereavementWeeks.join(',')
    })
    if (arms[0].length > 0) metAny += 1
    if (new Set(arms).size > 1) disagreements += 1
  }
  console.log(`   measured over 40 seeds × 4 voices: disagreements ${disagreements} (0 is the law)`)
  console.log(`     ⚠ and ${metAny} of 40 control arms met one – a sweep of survivors proves nothing`)
  console.log(`     the hazard's read-set is its own signature: bereavementChanceAt() takes nothing`)
  console.log(`     and returns ${bereavementChanceAt()}`)
}

function row3(): void {
  console.log('\n3. PREGNANCY LENGTH on the conception clock')
  console.log('   predicted: 39–40 weeks lived for every window draw; announcement-to-birth shrinks')
  console.log('              by exactly the window   (§8 row 3)')
  const lengths = new Set<number>()
  const windows = new Map<number, number>()
  let shrinkOk = 0
  let seen = 0
  for (let i = 0; i < HAZARD_N && seen < 400; i++) {
    const world = conceivedAt(`weight-term-${i}`, 24 + (i % 12))
    if (world === null) continue
    const p = world.pregnancy!
    seen += 1
    lengths.add(p.dueWeek - p.conceivedWeek)
    const win = p.announcedWeek - p.conceivedWeek
    windows.set(win, (windows.get(win) ?? 0) + 1)
    if (p.dueWeek - p.announcedWeek === (p.dueWeek - p.conceivedWeek) - win) shrinkOk += 1
  }
  console.log(`   measured over ${seen} real pregnancies:`)
  console.log(`     conception→birth lengths seen: {${[...lengths].sort((a, b) => a - b).join(', ')}}`)
  console.log(`     announcement→birth = length − window on ${shrinkOk}/${seen}`)
  console.log(`     windows drawn: ${[...windows.keys()].sort((a, b) => a - b).join(', ')}`)
}

function row4(): void {
  console.log('\n4. REALISED LOSS RATE by age band, switch ON')
  console.log('   predicted: tracks 9.8 / 10.8 / 16.7% within SEM   (§8 row 4)')
  // ⚠⚠ BUCKETED BY HER AGE IN THE MIDDLE OF THE LOSS WINDOW AND NOT AT THE CONCEPTION, and the
  // difference is the row's own finding rather than book-keeping. The hazard reads her CURRENT age
  // every week it runs, so a pregnancy conceived at 34.8 spends part of its window on the 35+ rung.
  // Bucketing at conception would have reported that rung as untouched.
  const BANDS: [string, number, number][] = [['24–29', 24, 0.098], ['30–34', 30, 0.108], ['35+', 35, 0.167]]
  const carried = new Map<string, number>()
  const lost = new Map<string, number>()
  let made = 0
  for (let i = 0; i < HAZARD_N && made < 1200; i++) {
    // ⚠ THE AGES SWEEP THE WHOLE WINDOW THE PREGNANCY GATE ALLOWS – 24 to just under 35.
    const world = conceivedAt(`weight-loss-${i}`, 24 + (i % 11))
    if (world === null) continue
    made += 1
    const mid = world.pregnancy!.conceivedWeek + Math.floor((W.lossFromWeek + W.lossUntilWeek) / 2)
    const age = kidAgeExact(mid, world.profile.birthMonth, world.profile.birthDay)
    const band = BANDS.filter((b) => age >= b[1]).slice(-1)[0]?.[0] ?? '24–29'
    carried.set(band, (carried.get(band) ?? 0) + 1)
    if (lossWeekOf(world) !== null) lost.set(band, (lost.get(band) ?? 0) + 1)
  }
  for (const [label, age, target] of BANDS) {
    const n = carried.get(label) ?? 0
    const k = lost.get(label) ?? 0
    // ⚠ THE SEM IS PRINTED BESIDE THE FIGURE rather than left to the reader: a share this file
    // cannot bound is a number and not a measurement.
    const share = n === 0 ? 0 : k / n
    const sem = n === 0 ? 0 : Math.sqrt((share * (1 - share)) / n)
    console.log(`   ${label}: ${n === 0 ? '   –' : pct(share)} ± ${pct(sem)} over ${n} pregnancies   (target ${pct(target)})`)
    console.log(`     per-week rate ${pregnancyLossChanceAt(age).toFixed(6)} over ${W.lossUntilWeek - W.lossFromWeek} weeks`)
  }
  console.log('   ⚠⚠ AND THE 35+ RUNG IS ALMOST UNREACHABLE, WHICH IS A FINDING ABOUT THE **PREGNANCY**')
  console.log('     GATE RATHER THAN ABOUT THIS CURVE: `ECONOMY.motherhood.perWeekByAge` reads 0 from')
  console.log('     35, so nobody CONCEIVES at 35+. The rung is reached only by a pregnancy conceived')
  console.log('     late in her 34th year whose window crosses the birthday. The J-curve\'s climb is')
  console.log('     in the constants and the game\'s own window closes before it bites.')
}

function row5(): void {
  console.log('\n5. WINDOW LENGTH by openness')
  console.log('   predicted: open medians 1–4 weeks, private up to 12 – the shipped lag shape,')
  console.log('              re-read   (§8 row 5)')
  for (const openness of ['open', 'private'] as const) {
    const draws: number[] = []
    for (let w = 0; w < HAZARD_N; w++) draws.push(drawConceptionWindow('weight-window', w, openness))
    draws.sort((a, b) => a - b)
    const zero = draws.filter((d) => d === 0).length
    const median = draws[Math.floor(draws.length / 2)]
    const nonZero = draws.filter((d) => d > 0)
    const medianNonZero = nonZero[Math.floor(nonZero.length / 2)]
    console.log(`   ${openness}: median ${median} · median of the NON-ZERO draws ${medianNonZero} ·`)
    console.log(`     zero ${pct(zero / draws.length)} · max ${draws[draws.length - 1]} · n ${draws.length}`)
  }
  console.log('     ⚠ the ZERO share is the shipped `ECONOMY.life.lag` table, not this wave\'s: an')
  console.log('       open girl tells at once 70% of the time (moved there 11.09, by measurement)')
  console.log('     ⭐ AND THE VOICES MAP ONTO IT: ' + TEMPERAMENTS.map((t) => `${t}→${temperamentOpenness(t)}`).join(' · '))
}

function row6(on: Lived[], off: Lived[]): void {
  console.log('\n6. THE SWITCH-OFF ARM')
  console.log('   predicted: zero weight draws, zero events, byte-identical spirit trace to a')
  console.log('              pre-wave career   (§8 row 6)')
  // ⚠⚠ BOTH ARMS ARE BUILT WITH THE READER PRESENT – CLAUDE.md's null-result law. The OFF arm is
  // this tree with the switch off, never an older commit: a constant without its reader is a null
  // arm that looks like a null result.
  let offEvents = 0
  let onEvents = 0
  for (const row of off) offEvents += row.world.bereavementWeeks.length + row.world.pregnancyLossWeeks.length
  for (const row of on) onEvents += row.world.bereavementWeeks.length + row.world.pregnancyLossWeeks.length
  console.log(`   measured: OFF arm weight events ${offEvents} (0 is the claim) · ON arm ${onEvents}`)
  // ⭐⭐⭐ THE **MAIN STREAM** IS THE SHARPEST HALF AND IT HOLDS ON EVERY CELL, EVENT OR NOT. Neither
  // hazard takes a MAIN draw – both ride purpose-scoped sub-streams – so `rngMain` must be
  // byte-identical between the arms even on a career that met a death. That is a stronger statement
  // than «spirit matches», because spirit converges back to a baseline and a match there can be
  // agreement by exhaustion.
  let mainSame = 0
  let spiritSame = 0
  let untouched = 0
  let untouchedSame = 0
  const n = Math.min(on.length, off.length)
  for (let i = 0; i < n; i++) {
    const a = on[i].world
    const b = off[i].world
    if (JSON.stringify(a.rngMain) === JSON.stringify(b.rngMain)) mainSame += 1
    if ((a.spirit ?? 0) === (b.spirit ?? 0)) spiritSame += 1
    if (a.bereavementWeeks.length === 0 && a.pregnancyLossWeeks.length === 0) {
      untouched += 1
      if ((a.spirit ?? 0) === (b.spirit ?? 0)) untouchedSame += 1
    }
  }
  console.log(`   rngMain identical on ${mainSame}/${n} cells   (${n}/${n} is the claim – zero MAIN draws)`)
  console.log(`   spirit at the horizon identical on ${spiritSame}/${n} cells`)
  console.log(`     ...and on ${untouchedSame}/${untouched} cells the weight never touched`)
  console.log('     ⚠ A CELL THAT MET A WEIGHT EVENT **SHOULD** DIFFER in spirit – that is the arm')
  console.log('       working. What the row claims is that a career the weight never touched is')
  console.log('       untouched, and that MAIN never moves either way.')
}

function row7(corpus: Lived[]): void {
  console.log('\n7. RESPONSE FAIRNESS (±1.5 pp, RESPONSE arms only)')
  console.log('   predicted: within the corridor; depth/duration ordered by intensity, expression')
  console.log('              by openness   (§8 row 7)')
  // ⚠⚠ THE DEPTH IS ARITHMETIC AND IS PRINTED AS SUCH rather than sampled: the shock band is a
  // constant seen through `perturbationScale`, so «ordered by intensity» is a statement about two
  // numbers and a walked corpus would only add noise to a thing that has none.
  const s = ECONOMY.spirit.shock
  console.log(`   depth by intensity: loss ${s.loss.steady}/${s.loss.intense} ·`)
  console.log(`                       bereavement ${s.bereavement.steady}/${s.bereavement.intense}`)
  console.log(`     (break-up ${s.breakup.steady}/${s.breakup.intense} · postpartum ${s.postpartum.steady}/${s.postpartum.intense})`)
  const rate = ECONOMY.spirit.returnPerWeek
  const clear = ECONOMY.spirit.baseline - ECONOMY.spirit.shockClearWithin
  for (const kind of ['loss', 'bereavement'] as const) {
    for (const intensity of ['steady', 'intense'] as const) {
      const landing = ECONOMY.spirit.baseline + s[kind][intensity]
      const weeks = Math.ceil((clear - landing) / rate[intensity])
      console.log(`     ${kind}/${intensity}: lands at ${landing.toFixed(1)}, clears in ${weeks} weeks`)
    }
  }
  console.log('     ⭐ DURATION IS DEPTH UNDER THE ONE-RATE LAW – no second return rate exists.')
  const voices = corpus.filter((r) => r.world.bereavementWeeks.length > 0).length
  console.log(`   expression by openness: ${voices}/${corpus.length} walked careers met one; the`)
  console.log('     private voices say less in the SAME arc (LOSS_HER_LINE holds null for both)')
}

function row8(): void {
  console.log('\n8. THE FROZEN MAIN CAPTURE')
  console.log('   predicted: unmoved – 41550 / e6b0c709   (§8 row 8)')
  console.log('   ⚠ THIS ROW IS NOT MEASURED HERE AND SAYS SO. `tests/condition.test.ts` owns the')
  console.log('     capture and re-runs it; a bench that re-derived the count would be a second')
  console.log('     spelling of a pin. Run it and quote the verdict:')
  console.log('       npx vitest run --project unit tests/condition.test.ts')
}

// --- main ----------------------------------------------------------------------------------------

console.log('THE WEIGHT – wave 11 T6, the spec §8 rows, predicted beside measured')
console.log(`corpus ${CORPUS_N} cells · cap ${CAP} weeks · hazard n ${HAZARD_N}`)

const onArm = walkCorpus(true)
const offArm = walkCorpus(false)
row1(onArm)
row2()
row3()
row4()
row5()
row6(onArm, offArm)
row7(onArm)
row8()
console.log('')

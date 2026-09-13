/**
 * r41-ad-gate-16 – ROUND 41 #15, ASK A1. WHAT OPENING THE ADVERTISING LETTERS AT SIXTEEN DOES.
 *
 * THE OWNER'S QUESTION, 12.09: «А рекламных контрактов правда не предлагают до 18 лет или это наше
 * ноу-хау? кажется молодые тоже в рекламах снимаются.» AND HIS RULING, the same day: «реклама
 * открывается с 16 (юниорские суммы, реже), а призовые падают на её счёт с первого старта W-серии
 * независимо от возраста – согласен».
 *
 * ⚠⚠ THE PREDICTION IS WRITTEN DOWN HERE **BEFORE** THE FIRST RUN (invariant 5: «predict a fix,
 * measure it doing nothing, find the real cause»). Four numbers, named in advance so the run can
 * contradict them:
 *
 *   P1  share of careers that SIGN any advertising deal before eighteen ....... 4%   (single digits)
 *   P2  her own account at eighteen, mean over the WHOLE corpus, delta ........ under $10,000
 *   P3  ...conditional on a career that signed at least one ................... $40,000 – $80,000
 *   P4  the family's funds at eighteen, mean delta ............................ under $2,000
 *
 * ⚠ THE REASONING BEHIND P1, so a wrong prediction is informative rather than embarrassing: a junior
 * letter needs a COUNTING professional standing inside WTA #400 at sixteen or seventeen (`adBandFor`
 * over `sponsorStandingOf`), and the calibration the ad tests quote is «first points 17-18, top-100
 * about 4.5 years later». On top of that the junior band halves the weekly arrival chance («реже»).
 * Two rare things multiplied is where the single digit comes from.
 *
 * ⚠ P2 vs P4 ARE NOT THE SAME QUESTION AND THE SPLIT IS THE OWNER'S OWN RULING. An advertising fee
 * is written to HER at full value and the parent earns the manager's 15% of it
 * (`bankSponsorCheque`), so ~85% of any junior money is hers and the family's delta is the fee. A
 * bench that reported one number for «the money» would be describing the wrong pocket.
 *
 * HOW THE TWO ARMS ARE BUILT, AND WHY IT IS NOT A WORKTREE. `ECONOMY` is a plain object, so the OFF
 * arm is the shipped constant put back: `fromAgeYears = 18` makes `adJuniorAt`'s window empty
 * ([18,18) is no ages at all), which is exactly the pre-item engine – the junior branch becomes
 * unreachable rather than merely unused. Both arms therefore run the SAME BUILD on the SAME SEEDS,
 * which is the one thing CLAUDE.md's null-result rule asks for: the reader is present in both trees.
 *
 * ⚠ ACTUATION IS PROVEN PER ARM AND NOT ASSUMED – `--absurd` sets the junior fee share to 10x the
 * adult cheque and the chance to certainty, and the recorded run moved (see the spec section). A
 * bench whose arms cannot be made to differ is measuring nothing.
 *
 * ⚠ THE SIGNING ARM IS THE FRIENDLIEST ONE, `tools/sponsor-ladder-reach.ts`' own stance: every live
 * advertising letter is signed the week it lands. A junior deal nobody signs here is a junior deal
 * nobody can sign. Signing draws ZERO on MAIN (invariant 2), so the arms cannot move the world's
 * dice apart – the careers are the same careers.
 *
 * ⚠ NO try/catch ANYWHERE: a throw is a finding, not a row to swallow (house bench law). A share
 * with no denominator prints `–` and never `0.0%`.
 *
 * Run:  npx vite-node tools/r41-ad-gate-16.ts
 *       npx vite-node tools/r41-ad-gate-16.ts -- --seeds 30 --json out.json
 *       npx vite-node tools/r41-ad-gate-16.ts -- --absurd        (the actuation proof)
 */
import { writeFileSync } from 'node:fs'
import { acceptOffer, recomputeKidRank, KID_ID, type WorldState } from '../src/engine/world'
import { adBandFor, adCategoryOf, isOfferLive } from '../src/engine/offers'
import { sponsorStandingOf } from '../src/engine/world/sponsors'
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { openCareer, stepCareerWeek, PRESETS, POLICIES, mean, median } from './econ-bench'
import type { AdOfferTerms } from '../src/shared/protocol'

const args = process.argv.slice(2)
let seedsPerPreset = 24
let jsonPath = ''
let absurd = false
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--seeds' && args[i + 1]) seedsPerPreset = Number(args[++i])
  if (args[i] === '--json' && args[i + 1]) jsonPath = args[++i]!
  if (args[i] === '--absurd') absurd = true
}

/** Careers open at fourteen (`econ-bench`'s own START_AGE_YEARS), so her eighteenth birthday is four
 *  seasons in. The walk stops THERE: everything this item does happens in the two seasons below it,
 *  and a longer horizon would dilute the very effect being measured. */
const WEEKS_TO_EIGHTEEN = 4 * WEEKS_PER_YEAR
/** Her sixteenth birthday on the bench's own clock – two seasons in, which is where the gate this
 *  item moved now sits. The staged arm writes her professional book from this week onward. */
const STAGE_AT_WEEK = 2 * WEEKS_PER_YEAR
/** ⚠ 400 POINTS IS `tests/ad-offer.test.ts`' OWN BOOK, read and not re-derived: it puts her at about
 *  world #183, inside the ≤200 band – a real sixteen-year-old prodigy, which is exactly the career
 *  the owner was playing when he asked the question. A weaker book would land in the ≤400 band and
 *  pay the same drinks cell, so this choice moves the CLOTHING cheque and nothing else. */
const STAGE_POINTS = 400

const money = (cents: number) => `$${Math.round(cents / 100).toLocaleString('en-US')}`
const padL = (s: string | number, n: number) => String(s).padStart(n)
const padR = (s: string | number, n: number) => String(s).padEnd(n)
/** ⚠ `–` AND NEVER `0.0%` WHEN THERE IS NO DENOMINATOR (house bench law): a share of nothing is not
 *  zero, it is unmeasured, and the two read identically on a table until somebody acts on it. */
const pct = (num: number, den: number) => (den === 0 ? '–' : `${((num / den) * 100).toFixed(1)}%`)

interface CareerRead {
  /** advertising letters SIGNED strictly before her eighteenth */
  juniorSigned: number
  /** the categories those letters were in */
  juniorCategories: string[]
  /** gross cents on those junior papers */
  juniorGrossCents: number
  /** her own account at eighteen */
  kidFundsCents: number
  /** the family's funds at eighteen */
  fundsCents: number
  /** did she ever stand in an advertising band before eighteen */
  bandedBefore18: boolean
}

/** ONE CAREER, WALKED BY THE REAL ENGINE TO HER EIGHTEENTH, SIGNING EVERY ADVERTISING LETTER.
 *
 *  ⚠ THE LETTERS ARE READ OFF `world.offers` AFTER THE TICK, which is where `reviewAdOffer` puts
 *  them – the bench never calls the reviewer itself, so what is measured is the wiring as well as
 *  the rule (`tests/ad-offer.test.ts`' own «the walk asks the engine» stance). */
function runCareerToEighteen(presetIndex: number, seedIndex: number, stagePoints = 0): CareerRead {
  const { world, rng } = openCareer(PRESETS[presetIndex], seedIndex, POLICIES[0])
  const read: CareerRead = {
    juniorSigned: 0,
    juniorCategories: [],
    juniorGrossCents: 0,
    kidFundsCents: 0,
    fundsCents: 0,
    bandedBefore18: false,
  }
  for (let w = 0; w < WEEKS_TO_EIGHTEEN; w++) {
    stepCareerWeek(world, rng, POLICIES[0])
    if (world.ending) break
    // ⚠⚠ THE STAGED ARM CROSSES THE BAR ON HER SIXTEENTH AND THE WALK IS STILL REAL – the
    // `proWorld` idiom `tests/ad-offer.test.ts` documents, for the reason that file gives: «an
    // organic crossing would need eight-plus entered seasons per arm and still not be guaranteed by
    // the calibration (first points 17-18, top-100 about 4.5 years later)». The ORGANIC arm above
    // measures how often the game gets there by itself; this one measures what the junior band is
    // WORTH to a career that does, which is the question his own save asks (a girl in the top 100
    // at sixteen – round 41 #18's own opening sentence).
    if (stagePoints > 0 && w >= STAGE_AT_WEEK) {
      world.results = world.results.filter((r) => !(r.playerId === KID_ID && r.tier === 'w100'))
      world.results.push({ playerId: KID_ID, week: world.week, points: stagePoints, tier: 'w100' })
      world.onRampCleared = { itf: true, wta: true }
      recomputeKidRank(world)
    }
    // ⚠⚠ THE DIAGNOSTIC THAT MAKES A NULL RESULT READABLE, AND IT IS NOT AN AFTERTHOUGHT. If no
    // career signs anything the reader has to be able to tell WHICH of the two rare things failed:
    // the standing, or the dice. This counts the weeks she stood in an advertising band at all –
    // the gate `reviewAdOffer` reads one line after the age – so a zero here says «she was never in
    // a band», and a non-zero with no letters says «the dice said no».
    if (adBandFor(sponsorStandingOf(world)) !== null) read.bandedBefore18 = true
    signEveryAdLetter(world, read)
  }
  read.kidFundsCents = world.kidFundsCents ?? 0
  read.fundsCents = world.fundsCents
  return read
}

/** The friendliest parent there is: he signs every advertising letter the week it lands. */
function signEveryAdLetter(world: WorldState, read: CareerRead): void {
  for (const offer of world.offers) {
    if (offer.kind !== 'ad') continue
    if (!isOfferLive(offer, world.week)) continue
    const terms = offer.terms as AdOfferTerms
    acceptOffer(world, offer.id)
    read.juniorSigned++
    read.juniorCategories.push(String(adCategoryOf(terms)))
    read.juniorGrossCents += terms.cashCents
  }
}

interface ArmRead {
  label: string
  careers: CareerRead[]
}

/** ⚠⚠ THE ARM IS THE CONSTANT, PUT BACK AND TAKEN AWAY AROUND ONE RUN, AND IT IS RESTORED IN A
 *  `finally` SO NO LATER ARM INHERITS A MUTATED CATALOGUE – `tests/round38-academy-worth.test.ts`'
 *  hostile-band idiom, which asserts the restoration rather than trusting it. This is not a
 *  try/CATCH: nothing is swallowed, a throw still ends the run. */
function withGateAge(ageYears: number, fn: () => ArmRead): ArmRead {
  const ad = ECONOMY.advertising as { fromAgeYears: number }
  const was = ad.fromAgeYears
  ad.fromAgeYears = ageYears
  try {
    return fn()
  } finally {
    ad.fromAgeYears = was
  }
}

function runArm(label: string, stagePoints = 0): ArmRead {
  const careers: CareerRead[] = []
  for (let p = 0; p < PRESETS.length; p++) {
    for (let s = 0; s < seedsPerPreset; s++) careers.push(runCareerToEighteen(p, s, stagePoints))
  }
  return { label, careers }
}

function report(on: ArmRead, off: ArmRead): void {
  const n = on.careers.length
  const signedOn = on.careers.filter((c) => c.juniorSigned > 0)
  const signedOff = off.careers.filter((c) => c.juniorSigned > 0)

  console.log(`\nROUND 41 #15 – THE ADVERTISING GATE AT SIXTEEN (${n} careers per arm, walked to her eighteenth)\n`)
  console.log(`  ${padR('', 42)}${padL('ON (16)', 16)}${padL('OFF (18)', 16)}${padL('delta', 16)}`)
  const row = (label: string, a: string, b: string, d: string) =>
    console.log(`  ${padR(label, 42)}${padL(a, 16)}${padL(b, 16)}${padL(d, 16)}`)

  row(
    'careers signing any ad deal before 18',
    `${signedOn.length} (${pct(signedOn.length, n)})`,
    `${signedOff.length} (${pct(signedOff.length, n)})`,
    `${signedOn.length - signedOff.length}`,
  )
  const lettersOn = on.careers.reduce((s, c) => s + c.juniorSigned, 0)
  const lettersOff = off.careers.reduce((s, c) => s + c.juniorSigned, 0)
  row('letters signed before 18, total', String(lettersOn), String(lettersOff), String(lettersOn - lettersOff))

  const kidOn = mean(on.careers.map((c) => c.kidFundsCents))
  const kidOff = mean(off.careers.map((c) => c.kidFundsCents))
  row('HER account at 18 – mean', money(kidOn), money(kidOff), money(kidOn - kidOff))
  const kidMedOn = median(on.careers.map((c) => c.kidFundsCents))
  const kidMedOff = median(off.careers.map((c) => c.kidFundsCents))
  row('HER account at 18 – median', money(kidMedOn), money(kidMedOff), money(kidMedOn - kidMedOff))

  const famOn = mean(on.careers.map((c) => c.fundsCents))
  const famOff = mean(off.careers.map((c) => c.fundsCents))
  row('FAMILY funds at 18 – mean', money(famOn), money(famOff), money(famOn - famOff))
  const famMedOn = median(on.careers.map((c) => c.fundsCents))
  const famMedOff = median(off.careers.map((c) => c.fundsCents))
  row('FAMILY funds at 18 – median', money(famMedOn), money(famMedOff), money(famMedOn - famMedOff))

  // ⚠ CONDITIONAL ON SIGNING – the number a player who gets one actually sees. The whole-corpus mean
  // above is dominated by the careers that never stood in a band, and quoting only that would hide
  // the size of the thing being introduced.
  console.log('')
  if (signedOn.length === 0) {
    console.log('  conditional on signing: – (no career in this corpus signed one)')
  } else {
    const grossMean = mean(signedOn.map((c) => c.juniorGrossCents))
    console.log(`  conditional on signing – junior gross per career, mean: ${money(grossMean)}`)
    console.log(`  conditional on signing – her account at 18, mean:      ${money(mean(signedOn.map((c) => c.kidFundsCents)))}`)
    const cats = new Map<string, number>()
    for (const c of signedOn) for (const k of c.juniorCategories) cats.set(k, (cats.get(k) ?? 0) + 1)
    const shelf = [...cats.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ')
    console.log(`  the junior shelf that actually arrived:                ${shelf || '–'}`)
  }

  // ⚠ THE NEGATIVE ARM THAT MAKES THE POSITIVE ONE MEAN SOMETHING: with the gate back at eighteen no
  // career may sign anything before it, however friendly the parent. A non-zero here is a defect in
  // the bench, not a finding about the game.
  // ⚠ AND THE DIAGNOSTIC THAT TELLS A NULL RESULT APART FROM A BROKEN BENCH: how many careers ever
  // STOOD in an advertising band before eighteen at all. The letters are a band AND the dice; this
  // is the band alone, so a zero here explains a zero above and a non-zero convicts the dice.
  const bandedOn = on.careers.filter((c) => c.bandedBefore18).length
  console.log('')
  console.log(`  careers ever standing in an ad band before 18:         ${bandedOn} (${pct(bandedOn, n)})`)
  console.log(`  OFF-arm letters before eighteen (must be 0):           ${lettersOff}`)
  console.log(`  ECONOMY.advertising.fromAgeYears, restored:           ${ECONOMY.advertising.fromAgeYears}`)
}

function main(): void {
  if (absurd) {
    // THE ACTUATION PROOF. The junior cheque goes to ten times the adult cell and the arrival becomes
    // certain; if the ON arm does not move, the arm is wrong before the hypothesis is.
    const j = ECONOMY.advertising.junior as { feeBps: number; chanceBps: number }
    j.feeBps = 100_000
    j.chanceBps = 100_000
    console.log('⚠ ABSURD ARM: junior fee at 10x the adult cell, arrival certain.')
  }
  // ⚠⚠ TWO POPULATIONS, TWO QUESTIONS, AND REPORTING ONLY THE FIRST WOULD BE A NULL RESULT NOBODY
  // COULD READ. The ORGANIC corpus answers «how often does the game reach this at all»; the STAGED
  // corpus answers «and what is it worth to a career that does». A bench that printed only the
  // organic zero would have said «the item does nothing», which is false – and CLAUDE.md's own rule
  // is that a null result is a claim needing the same provenance as a positive one.
  console.log('\n================ ORGANIC: the careers the bench actually produces ================')
  report(withGateAge(16, () => runArm('ON (16)')), withGateAge(18, () => runArm('OFF (18)')))
  console.log('\n================ STAGED: a counting professional standing from her sixteenth =====')
  console.log(`(the pro-fixture idiom: ${STAGE_POINTS} W-series points written from week ${STAGE_AT_WEEK})`)
  report(withGateAge(16, () => runArm('ON (16)', STAGE_POINTS)), withGateAge(18, () => runArm('OFF (18)', STAGE_POINTS)))
  if (jsonPath) {
    const dump = {
      organic: { on: withGateAge(16, () => runArm('ON (16)')), off: withGateAge(18, () => runArm('OFF (18)')) },
      staged: {
        on: withGateAge(16, () => runArm('ON (16)', STAGE_POINTS)),
        off: withGateAge(18, () => runArm('OFF (18)', STAGE_POINTS)),
      },
    }
    writeFileSync(jsonPath, JSON.stringify(dump, null, 2))
    console.log(`\njson: ${jsonPath}`)
  }
}

main()

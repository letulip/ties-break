// THE PAUSE-BRAND PROBE – wave 8 T7, «sponsors, MEASURED before built».
//
//   npx vite-node tools/pause-brand-probe.ts -- --seeds 56 --walk 1300 --emit /tmp/a.json
//   npx vite-node tools/pause-brand-probe.ts -- --compare /tmp/a.json /tmp/b.json
//
// THE QUESTION, AND IT IS THE ONLY ONE THIS FILE ANSWERS: **what a twelve-month absence costs in
// brand income under EXISTING rules.** The research says «sponsors partially lost during the pause»
// (docs/research/life-events-motherhood.md:37) and the brief's temptation is a
// `ECONOMY.motherhood.pauseBrandFactor`. Brand contracts and their windows ALREADY expire on their
// own machinery, and a pause is already a year with no results – so a factor added before this
// measurement would double-charge a price the world has already taken. The measurement decides
// whether the constant ships at all.
//
// ⚠⚠ TWO ARMS, AND THEY DIFFER BY THE CAREER'S HISTORY AND NOT BY THE CODE – the 17.08 law
// (CLAUDE.md, «BEFORE YOU BELIEVE A NULL RESULT, PROVE THE ARM CONTAINS BOTH THE CHANGE AND ITS
// READER»). Both arms are run from the SAME commit; what separates them is one reverse-edited
// constant in `src/engine/economy.ts`, which is the wedding bench's own control discipline
// (`tools/wedding-bench.ts` section (b): «THE CONTROL ARM IS A REVERSE EDIT, NOT A FLAG»):
//
//   A  `perWeekByAge` at its shipped rungs      – careers that pause and return
//   B  `perWeekByAge` with every rung at 0      – THE CONTROL: the same seeds, never pausing
//
// ⭐⭐⭐ AND THE PAIRING IS EXACT RATHER THAN MERELY «COMPARABLE», which is the whole reason the
// control is built this way instead of by picking never-pregnant careers out of one run. The hazard
// draws on `seed:life:pregnancy:<week>` and ZERO MAIN draws, and `rollPregnancy` returns on a chance
// of 0 BEFORE it derives the stream – so an arm-B career is byte-identical to its arm-A twin for
// every week up to the announcement, and the two only part where the pregnancy itself acts. The
// comparison prints the pre-window season of brand income for both arms precisely so a reader can
// see that identity hold; a pair whose PRE window disagrees is a broken pairing, not a finding.
//
// ⚠⚠ WHAT «BRAND INCOME» MEANS HERE, AND IT IS ASKED OF THE LEDGER RATHER THAN OF A TEXT MATCH.
// `FinanceWeek.kidShare` is tagged BY SOURCE (`world/ledger.ts`, `accrueKidShare`) and carries
// `baseCents` – the GROSS of the cheque, before the manager's fee:
//
//   kidShare.sponsor.baseCents   every cheque through `bankSponsorCheque` – the quarterly kit
//                                retainer, appearance fees, result bonuses, the endorsement
//                                signature fee, its anniversaries and the ad shoot's fee
//   kidShare.brand.baseCents     the merch brand's weekly gross («her name on the shelves»)
//
// ⚠ GROSS AND NOT THE FAMILY'S SIDE, deliberately: `bankSponsorCheque` credits the family only the
// manager's commission and the rest is HERS, so the family ledger row is ~15% of what the brand
// actually paid and would understate the loss by the same factor. ⚠ AND NOT `byCategory`, which
// cannot answer the question: the retainer books under `'income'` beside the parent's WAGE, and
// `'business'` carries the academy beside the merch. The tagged share is the one instrument in the
// engine that separates brand money from everything else without reading a single string.
//
// ⚠ ONE THING THE INSTRUMENT DOES NOT SEE, stated so nobody reads its silence as a zero: the local
// sponsor's cameo gift (`phaseFinance.ts`, «A local sponsor chipped in!») does not go through
// `bankSponsorCheque` and so has no tagged share. That is correct here – it is a need-gated gift
// against an unpayable trip, not a brand contract – but it means this probe measures CONTRACTED
// brand income, and says so.
//
// ⚠ THE WALK IS THE PROVEN RECIPE AND NOT A NEW ONE – `tools/wedding-bench.ts`' own
// `answerWhateverIsOpen`, which is two-doors' shape: `openCareer` + `stepCareerWeek`, the fork
// continued, the birthday answered neutrally, retirement refused until final, and EVERY blocking
// life beat drained through `tools/_lifeBeats`' registry. ⚠⚠ THIS WAVE HAS FOUR BLOCKING BEATS –
// `'expecting'`, the fork's two and `'return-plan'` – and a walker that answered none of them would
// simply stall, because `advanceWeeks` refuses to tick while a row is unanswered.
//
// ⚠⚠ AND THE DRAIN DECIDES TWO OF THIS PROBE'S ARMS FOR IT, which `tools/_lifeBeats.ts` states at
// the rows themselves and this file repeats because it is the one measuring them:
// `DRAIN_ANSWER['expecting']` is `worry`, so every paused career here carries a **`measured`**
// support grade; and `DRAIN_ANSWER['return-plan']` is `small-first`, so every comeback here is the
// SMALL-FIRST arm. Neither is a sponsor lever, and both are held identical across A and B, so
// neither can move the comparison – but a later reader asking «which support grade was this?»
// deserves the answer without re-deriving it.
//
// RNG: careers advance on `resumeMain(world.rngMain)` – the shipped game's own resumption. Nothing
// in this file draws on any stream of its own.
import { PRESETS, POLICIES, openCareer, stepCareerWeek, median, type Preset, type Policy } from './econ-bench'
import { drainLifeBeatsTallied, emptyDrainCounts, drainSkewLine } from './_lifeBeats'
import { answerBirthdayNeutral } from './_birthday'
import { acceptOffer, answerFork, answerRetirement, buyAsset, kidAgeExact, latchedEpisode, leavingViewOf, pendingBirthday, shopItem, type WorldState } from '../src/engine/world'
import { activeKitDeal, isOfferLive, SPONSOR_TIERS } from '../src/engine/offers'
import { ECONOMY } from '../src/engine/economy'
import { resumeMain } from '../src/engine/rng'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { Temperament } from '../src/engine/spirit'
import type { KitOfferTerms, SponsorTier } from '../src/shared/protocol'
import type { LifeBeatKind } from '../src/shared/protocol'
import { readFileSync, writeFileSync } from 'node:fs'

const argOf = (name: string, fallback: number): number => {
  const at = process.argv.indexOf(`--${name}`)
  const n = Number(process.argv[at + 1])
  return at > 0 && Number.isFinite(n) ? n : fallback
}
const strArg = (name: string): string | null => {
  const at = process.argv.indexOf(`--${name}`)
  return at > 0 && typeof process.argv[at + 1] === 'string' ? process.argv[at + 1] : null
}

/** 56 x the three backgrounds = 168 careers, every one a distinct seed – the wedding bench's grid. */
const SEEDS = argOf('seeds', 56)
/** ⚠ LONGER THAN THE WEDDING BENCH'S 912 BY DESIGN, AND THE ARITHMETIC IS THE WINDOW'S. The hazard's
 *  last live rung is 34–35, the pause opens `playsOnWeeks` (8) after the announcement and runs
 *  `termWeeks + decisionWeeksAfterBirth` (51) – and this probe then wants a FULL SEASON after that.
 *  A pregnancy announced at 34.9 therefore needs (34.9 − 13.56) x 52 + 8 + 51 + 52 = 1221 weeks
 *  before its «year after» closes, so 1300 is that with a month in hand. */
const WALK_WEEKS = argOf('walk', 1300)

const pad = (s: string, n: number): string => s.padEnd(n)
const padL = (s: string, n: number): string => s.padStart(n)
const money = (cents: number): string => `$${Math.round(cents / 100).toLocaleString('en-US')}`
const pct = (n: number, d: number): string => (d === 0 ? '   –' : `${((100 * n) / d).toFixed(1)}%`)

// =================================================================================================
// THE RECORD ONE CAREER LEAVES
// =================================================================================================

/** ⚠ RUN-LENGTH, NOT A WEEK LIST: a kit deal runs for whole seasons and a per-week array over 1300
 *  weeks x 168 careers is 200k numbers for a fact with a dozen edges. `[from, to)`. */
type Run = [number, number]

interface KitEnd {
  week: number
  /** `KitEndReason` as the goodbye letter recorded it – `'events'` / `'standing'` / `'term'`. */
  reason: string
  eventsPlayed: number
}

interface CareerBrand {
  seed: string
  background: string
  temperament: Temperament
  endedType: string | null
  walkEndWeek: number
  endAge: number
  latchedWeek: number | null
  announcedWeek: number | null
  pausesWeek: number | null
  dueWeek: number | null
  bornWeek: number | null
  supportGrade: string | null
  rankAtPause: number | null
  returnedWeek: number | null
  returnPlan: string | null
  protectedRank: number | null
  /** the weeks that paid brand money, and the GROSS each paid – sparse, ascending */
  payWeeks: number[]
  sponsorGross: number[]
  merchGross: number[]
  /** the weeks she committed to at least one event – so «the pause» is a visible zero, not a claim */
  entryWeeks: number[]
  /** the spans a kit deal was live */
  kitRuns: Run[]
  kitEnds: KitEnd[]
  /** the inbox, counted at the end – it keeps every letter for the life of the career, so nothing
   *  here can age out. The sanity line: a career nobody ever wrote to has no brand income to lose. */
  lettersKit: number
  lettersAd: number
  signedKit: number
  signedAd: number
  byKind: Record<LifeBeatKind, number>
}

interface Emitted {
  arm: string
  hazard: string
  seeds: number
  walk: number
  /** ⚠ CARRIED ON THE EMIT AND NOT RE-READ AT COMPARE TIME. The absence's length is
   *  `termWeeks + decisionWeeksAfterBirth`, and an absurd-value arm is allowed to move either of
   *  them – so a comparison that read the LIVE constant would measure arm A's careers through arm
   *  Z's window after the reverse edit had been restored. The window belongs to the run that walked
   *  it; A's is the one both arms are cut against, because the pause is A's fact. */
  pauseWeeks: number
  /** the `minEvents` ladder this run was built with – the reader the null-result law asks about */
  minEvents: number[]
  careers: CareerBrand[]
}

/** The questions a walked career answers on its way past them – `tools/wedding-bench.ts`' own list,
 *  tallied. ⚠ THE DRAIN IS WHAT CARRIES THIS WAVE'S FOUR BLOCKING BEATS; see the header. */
function answerWhateverIsOpen(world: WorldState, byKind: Record<LifeBeatKind, number>): void {
  const fold = (t: { byKind: Record<LifeBeatKind, number> }): void => {
    for (const k of Object.keys(t.byKind) as LifeBeatKind[]) byKind[k] += t.byKind[k]
  }
  if (world.fork !== null && world.fork.answer === null) {
    fold(drainLifeBeatsTallied(world))
    answerFork(world, 'continue')
  }
  fold(drainLifeBeatsTallied(world))
  if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
  // ⚠ REFUSE EVERY RETIREMENT OFFER BUT THE LAST – the wedding bench's conservative arm: the census
  // is of the longest careers the game produces, and a pregnancy window that opens at 24 needs them.
  if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)
}

/** The rung's place on the ladder, strongest last – so «the best letter in the inbox» is a max.
 *  `tools/sponsor-window-bench.ts`' own line. */
const LADDER_INDEX = new Map<SponsorTier, number>(SPONSOR_TIERS.map((t, i) => [t, i]))

/** ⭐⭐⭐ THE PARENT SIGNS, AND WITHOUT THIS THE WHOLE PROBE MEASURES ZERO – which is exactly what the
 *  first smoke run printed, and it is T6's warning in this file's own terms. `stepCareerWeek` does
 *  NOT answer the post (`tools/econ-bench.ts` has no `acceptOffer` in it at all), so a career walked
 *  by the wedding-bench recipe alone never holds a kit deal, never signs an endorsement, and takes
 *  **$0 of brand money over 1300 weeks**. An arm of those careers would have reported «the pause
 *  costs nothing» on a population that had nothing to lose – a null result produced by the fixture,
 *  which is the 17.08 law's own failure mode.
 *
 *  ⚠ EAGER, `tools/sponsor-window-bench.ts`' own first policy: sign the best live kit letter the week
 *  it lands, and take every live endorsement (the portfolio is deliberately multi-category since
 *  round 29 part four, so «one at a time» would be a rule this game does not have).
 *
 *  ⚠⚠ AND IT CANNOT MOVE THE WORLD'S DICE, which is what keeps the two arms paired. Signing a kit
 *  letter draws nothing at all; signing an `'ad'` letter draws `chooseShootWeeks` on the ad's OWN
 *  sub-stream (`acceptOffer`, world/sponsors.ts – «ZERO draws on MAIN, so signing can never move the
 *  world's dice»). Both arms sign identically on every week before the announcement, because both
 *  arms ARE the same career until then. */
function answerThePost(world: WorldState): void {
  const live = world.offers.filter((o) => isOfferLive(o, world.week))
  const kits = live.filter((o) => o.kind === 'kit')
  if (kits.length > 0) {
    const best = [...kits].sort(
      (a, b) => (LADDER_INDEX.get((b.terms as KitOfferTerms).tier) ?? -1) - (LADDER_INDEX.get((a.terms as KitOfferTerms).tier) ?? -1),
    )[0]
    // ⚠ A CAREER THAT HAS ENDED REFUSES EVERY COMMAND – that is the engine re-validating, not a bug
    // (`tools/sponsor-window-bench.ts`' own catch, and its reason).
    try {
      acceptOffer(world, best.id)
    } catch {
      /* the epilogue refuses */
    }
  }
  for (const ad of live.filter((o) => o.kind === 'ad')) {
    try {
      acceptOffer(world, ad.id)
    } catch {
      /* the epilogue refuses, or the category is already spoken for */
    }
  }
}

/** ⚠ FOUR TIMES THE SHELF PRICE BEFORE THE FAMILY BUYS – a bench policy, stated rather than tuned.
 *  The brand is `entryCents` 250,000_00 with no build wait and no upkeep, so the only real question
 *  is whether the purchase can bankrupt the career it is meant to instrument; a 4x reserve is the
 *  cheapest answer that is obviously safe, and every career here clears it by an order of magnitude
 *  long before the pregnancy window opens. */
const MERCH_RESERVE_X = 4

/** ⭐⭐ THE SECOND HALF OF «BRAND INCOME», AND WITHOUT IT THE MERCH COLUMN IS A STRUCTURAL ZERO.
 *  `merchWeeklyIncomeCents` is `assetWeeklyIncomeCents(world, 'merch-brand')` – the brand is a SHOP
 *  ASSET the family buys, not a thing a career grows – so a walk that never shops reads $0 for ever,
 *  and the smoke run did exactly that ($386,966,038 of sponsor money beside $0 of merch).
 *
 *  ⚠⚠ AND EXCLUDING IT WOULD HAVE BIASED THE ANSWER IN THE DANGEROUS DIRECTION. Merch is the half of
 *  brand income that follows FAME rather than a contract, and fame is exactly what a year with no
 *  results takes away – so a probe blind to merch would UNDERSTATE the loss natural expiry already
 *  produces, and understating it is what argues for shipping a `pauseBrandFactor` that is not needed.
 *
 *  ⚠ ZERO DRAWS AND THEREFORE NO THREAT TO THE PAIRING: `buyAsset` is a guarded state write and a
 *  ledger row. Both arms buy on the same week, because both arms are the same career until the
 *  announcement. */
function buyTheBrandWhenItIsSafe(world: WorldState): void {
  if ((world.assets ?? []).some((a) => a.id === 'merch-brand')) return
  const item = shopItem('merch-brand')
  if (item === undefined) return
  if (world.fundsCents < item.entryCents * MERCH_RESERVE_X) return
  try {
    buyAsset(world, 'merch-brand')
  } catch {
    /* a terminal latch refuses every command – the engine re-validating, not a bug */
  }
}

/** ⭐⭐ WHAT THE BRAND PAID, WEEK BY WEEK, DIFFED OUT OF THE LEDGER'S TAGGED SHARE.
 *
 *  ⚠⚠ IT DIFFS RATHER THAN MARKING A WEEK «SEEN», `tools/money-decomposition.ts`' own rule and for
 *  its reason: a week's row keeps GROWING after we first look at it – a title week reaches
 *  `bankSponsorCheque` twice and the merch line lands in its own phase – so a seen-set would drop
 *  every cheque booked after the first one in its week. */
function foldBrand(
  world: WorldState,
  seen: Map<number, { sponsor: number; brand: number }>,
  sink: (week: number, sponsorGross: number, merchGross: number) => void,
): void {
  for (const fw of world.financeWeeks) {
    const share = fw.kidShare
    const sponsor = share?.sponsor?.baseCents ?? 0
    const brand = share?.brand?.baseCents ?? 0
    const prev = seen.get(fw.week) ?? { sponsor: 0, brand: 0 }
    if (sponsor !== prev.sponsor || brand !== prev.brand) {
      sink(fw.week, sponsor - prev.sponsor, brand - prev.brand)
      seen.set(fw.week, { sponsor, brand })
    }
  }
}

function runCareer(preset: Preset, index: number, policy: Policy): CareerBrand {
  const { world } = openCareer(preset, index, policy)
  const rng = resumeMain(world.rngMain)
  const out: CareerBrand = {
    seed: world.seed,
    background: preset.background,
    temperament: leavingViewOf(world).temperament,
    endedType: null,
    walkEndWeek: 0,
    endAge: 0,
    latchedWeek: null,
    announcedWeek: null,
    pausesWeek: null,
    dueWeek: null,
    bornWeek: null,
    supportGrade: null,
    rankAtPause: null,
    returnedWeek: null,
    returnPlan: null,
    protectedRank: null,
    payWeeks: [],
    sponsorGross: [],
    merchGross: [],
    entryWeeks: [],
    kitRuns: [],
    kitEnds: [],
    lettersKit: 0,
    lettersAd: 0,
    signedKit: 0,
    signedAd: 0,
    byKind: emptyDrainCounts(),
  }
  const seen = new Map<number, { sponsor: number; brand: number }>()
  const pay = new Map<number, { sponsor: number; brand: number }>()
  let kitFrom: number | null = null

  for (let i = 0; i < WALK_WEEKS; i++) {
    const entered = stepCareerWeek(world, rng, policy)
    if (world.ending === null) {
      answerWhateverIsOpen(world, out.byKind)
      answerThePost(world)
      buyTheBrandWhenItIsSafe(world)
    }

    // --- the hooks, all pure reads ---
    if (Object.values(entered).some((n) => n > 0)) out.entryWeeks.push(world.week)
    foldBrand(world, seen, (week, sponsor, brand) => {
      const row = pay.get(week) ?? { sponsor: 0, brand: 0 }
      row.sponsor += sponsor
      row.brand += brand
      pay.set(week, row)
    })
    const kit = activeKitDeal(world.offers, world.week)
    if (kit !== null && kitFrom === null) kitFrom = world.week
    if (kit === null && kitFrom !== null) {
      out.kitRuns.push([kitFrom, world.week])
      kitFrom = null
    }
    // ⚠ THE MARKS ARE TAKEN THE FIRST WEEK THEY EXIST AND NEVER RE-READ. `world.pregnancy` is
    // CLEARED at the return (`resolveReturnDecision`), so a probe that only looked at the end state
    // would find nothing on every career that came back – which is every career this file is about.
    const p = world.pregnancy
    if (p !== null && out.announcedWeek === null) {
      out.announcedWeek = p.announcedWeek
      out.pausesWeek = p.pausesWeek
      out.dueWeek = p.dueWeek
    }
    if (p !== null && p.support !== null && out.supportGrade === null) out.supportGrade = p.support
    if (p !== null && p.rankAtPause !== null && out.rankAtPause === null) out.rankAtPause = p.rankAtPause
    const child = world.children[0]
    if (child !== undefined && out.bornWeek === null) out.bornWeek = child.bornWeek
    const c = world.comeback
    if (c !== null && out.returnedWeek === null) {
      out.returnedWeek = c.returnedWeek
      out.protectedRank = c.protectedRank?.rank ?? null
    }
    if (c !== null && c.returnPlan !== null && out.returnPlan === null) out.returnPlan = c.returnPlan
    if (world.ending !== null) break
  }

  if (kitFrom !== null) out.kitRuns.push([kitFrom, world.week + 1])
  // ⚠ THE GOODBYE LETTERS ARE READ ONCE AT THE END, not per week: the inbox holds all of them for the
  // life of the career (`reviewSponsors`' own note – «the inbox holds all three states for the life
  // of the career, which the feed could never do anyway»), so nothing can age out from under this.
  for (const o of world.offers) {
    if (o.id.startsWith('kit-end-')) {
      const t = o.terms as KitOfferTerms
      out.kitEnds.push({ week: o.week, reason: t.ended ?? '(unstamped)', eventsPlayed: t.endedEventsPlayed ?? 0 })
      continue
    }
    if (o.kind === 'kit') {
      out.lettersKit++
      if (o.state === 'signed') out.signedKit++
    }
    if (o.kind === 'ad') {
      out.lettersAd++
      if (o.state === 'signed') out.signedAd++
    }
  }
  out.kitEnds.sort((a, b) => a.week - b.week)
  for (const week of [...pay.keys()].sort((a, b) => a - b)) {
    const row = pay.get(week)!
    if (row.sponsor === 0 && row.brand === 0) continue
    out.payWeeks.push(week)
    out.sponsorGross.push(row.sponsor)
    out.merchGross.push(row.brand)
  }
  const latched = latchedEpisode(world)
  out.latchedWeek = latched?.latchedWeek ?? null
  out.endedType = world.ending?.type ?? null
  out.walkEndWeek = world.week
  out.endAge = kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)
  return out
}

// =================================================================================================
// THE FOLDS
// =================================================================================================

/** Gross brand money inside `[from, to)` – the two tags separately, because the mechanisms that could
 *  take them away are different ones (a contract is ENDED; merch DECAYS). */
function brandIn(c: CareerBrand, from: number, to: number): { sponsor: number; merch: number } {
  let sponsor = 0
  let merch = 0
  for (let i = 0; i < c.payWeeks.length; i++) {
    const w = c.payWeeks[i]
    if (w < from || w >= to) continue
    sponsor += c.sponsorGross[i]
    merch += c.merchGross[i]
  }
  return { sponsor, merch }
}

function countIn(weeks: number[], from: number, to: number): number {
  return weeks.filter((w) => w >= from && w < to).length
}

function kitWeeksIn(c: CareerBrand, from: number, to: number): number {
  let n = 0
  for (const [a, b] of c.kitRuns) n += Math.max(0, Math.min(b, to) - Math.max(a, from))
  return n
}

/** ⚠ A CAREER WHOSE WALK SIMPLY RAN OUT OF WEEKS INSIDE THE WINDOW IS NOT A ZERO, IT IS AN ABSENCE OF
 *  EVIDENCE, and the two must never be added together. A career that ENDED – retired, bankrupt,
 *  `'family'` – really did earn nothing for the rest of the window and counts in full. */
function covers(c: CareerBrand, to: number): boolean {
  return c.endedType !== null || c.walkEndWeek >= to - 1
}

interface Window {
  label: string
  from: (p: CareerBrand) => number
  to: (p: CareerBrand) => number
}

const LIVE_PAUSE_WEEKS = ECONOMY.motherhood.termWeeks + ECONOMY.motherhood.decisionWeeksAfterBirth
const LIVE_MIN_EVENTS = [
  ECONOMY.sponsorship.minEvents,
  ECONOMY.sponsorship.topMinEvents,
  ECONOMY.sponsorship.national.minEvents,
  ECONOMY.sponsorship.global.minEvents,
  ECONOMY.sponsorship.tour.minEvents,
  ECONOMY.sponsorship.premium.minEvents,
  ECONOMY.sponsorship.icon.minEvents,
]

function windowsFor(pauseWeeks: number): Window[] {
  return [
    // ⚠ THE PRE WINDOW IS THE PAIRING'S OWN WITNESS rather than a finding: A and B are byte-identical
    // up to the announcement, so these two columns MUST agree. A run where they do not is a broken
    // pairing, not a measurement, and the comparison says so in as many words.
    { label: 'the season before', from: (p) => p.pausesWeek! - WEEKS_PER_YEAR, to: (p) => p.pausesWeek! },
    { label: 'THE ABSENCE', from: (p) => p.pausesWeek!, to: (p) => p.pausesWeek! + pauseWeeks },
    { label: 'the year after', from: (p) => p.pausesWeek! + pauseWeeks, to: (p) => p.pausesWeek! + pauseWeeks + WEEKS_PER_YEAR },
    {
      label: 'the second year after',
      from: (p) => p.pausesWeek! + pauseWeeks + WEEKS_PER_YEAR,
      to: (p) => p.pausesWeek! + pauseWeeks + 2 * WEEKS_PER_YEAR,
    },
  ]
}

function compare(pathA: string, pathB: string): void {
  const a = JSON.parse(readFileSync(pathA, 'utf8')) as Emitted
  const b = JSON.parse(readFileSync(pathB, 'utf8')) as Emitted
  const byB = new Map(b.careers.map((c) => [c.seed, c]))
  // ⚠ A'S WINDOW AND NOT THE LIVE CONSTANT'S – see `Emitted.pauseWeeks`. `?? LIVE_PAUSE_WEEKS` is the
  // courtesy for an emit written before the field existed, and it is the only reading that can go
  // stale, so it says so in the header line below.
  const pauseWeeks = a.pauseWeeks ?? LIVE_PAUSE_WEEKS
  const windows = windowsFor(pauseWeeks)

  console.log('')
  console.log('THE PAUSE-BRAND COMPARISON – wave 8 T7 (sponsors, measured before built)')
  console.log(`  A "${a.arm}"  hazard ${a.hazard}`)
  console.log(`     minEvents ${(a.minEvents ?? LIVE_MIN_EVENTS).join('/')}  ·  ${a.careers.length} careers, walk ${a.walk}`)
  console.log(`  B "${b.arm}"  hazard ${b.hazard}`)
  console.log(`     minEvents ${(b.minEvents ?? LIVE_MIN_EVENTS).join('/')}  ·  ${b.careers.length} careers, walk ${b.walk}`)
  console.log(`  the absence is ${pauseWeeks} weeks from pausesWeek, taken from ARM A's own emit`)
  console.log('')

  const paused = a.careers.filter((c) => c.pausesWeek !== null)
  const orphans = paused.filter((c) => !byB.has(c.seed)).length
  console.log(`  A careers that reached a pregnancy: ${paused.length}/${a.careers.length} (${pct(paused.length, a.careers.length)})`)
  if (orphans > 0) console.log(`  ⚠ ${orphans} of them have no twin in B – B was run over a smaller seed range and they are NOT counted`)
  const latchedA = a.careers.filter((c) => c.latchedWeek !== null).length
  console.log(`  ...of the ${latchedA} that ever married: ${pct(paused.length, latchedA)}`)
  const returned = paused.filter((c) => c.returnedWeek !== null).length
  const family = paused.filter((c) => c.endedType === 'family').length
  console.log(`  of those: came back ${returned}, ended 'family' ${family}, still inside the window at walk end ${paused.length - returned - family}`)
  console.log('')

  // ⚠ THE ARM'S OWN SANITY LINE, AND IT IS T6's WARNING MADE MECHANICAL: a hand-built career that
  // never crossed the professional on-ramps has NO professional access and therefore no brand income
  // at all, and an arm of those would measure zero for a reason that is not the hypothesis. So the
  // first number printed is whether these careers can earn brand money BEFORE anything is taken away.
  console.log('  ── (0) CAN THESE ARMS EARN BRAND MONEY AT ALL? (the season BEFORE the pause, arm A) ──')
  const earners = paused.filter((c) => {
    const { sponsor, merch } = brandIn(c, c.pausesWeek! - WEEKS_PER_YEAR, c.pausesWeek!)
    return sponsor + merch > 0
  })
  const preTotals = paused.map((c) => {
    const { sponsor, merch } = brandIn(c, c.pausesWeek! - WEEKS_PER_YEAR, c.pausesWeek!)
    return sponsor + merch
  })
  console.log(
    `  ${earners.length}/${paused.length} paused careers took brand money in the season before the pause ` +
      `(median ${money(preTotals.length ? median(preTotals) : 0)}, max ${money(Math.max(0, ...preTotals))})`,
  )
  const kitAtPause = paused.filter((c) => kitWeeksIn(c, c.pausesWeek! - 1, c.pausesWeek!) > 0).length
  console.log(`  ${kitAtPause}/${paused.length} were holding a live kit deal on the week the entries closed`)
  console.log('')

  for (const win of windows) {
    let nPairs = 0
    let broken = 0
    let aSponsor = 0
    let aMerch = 0
    let bSponsor = 0
    let bMerch = 0
    let aEntries = 0
    let bEntries = 0
    let aKit = 0
    let bKit = 0
    const deltas: number[] = []
    for (const c of paused) {
      const twin = byB.get(c.seed)
      if (twin === undefined) continue
      const from = win.from(c)
      const to = win.to(c)
      if (!covers(c, to) || !covers(twin, to)) {
        broken++
        continue
      }
      nPairs++
      const ax = brandIn(c, from, to)
      const bx = brandIn(twin, from, to)
      aSponsor += ax.sponsor
      aMerch += ax.merch
      bSponsor += bx.sponsor
      bMerch += bx.merch
      aEntries += countIn(c.entryWeeks, from, to)
      bEntries += countIn(twin.entryWeeks, from, to)
      aKit += kitWeeksIn(c, from, to)
      bKit += kitWeeksIn(twin, from, to)
      deltas.push(ax.sponsor + ax.merch - (bx.sponsor + bx.merch))
    }
    const aTotal = aSponsor + aMerch
    const bTotal = bSponsor + bMerch
    console.log(`  ── ${win.label.toUpperCase()} – ${nPairs} pairs (${broken} dropped: a walk that ran out of weeks is not a zero) ──`)
    console.log(`  ${pad('', 22)}${padL('A (pauses)', 16)}${padL('B (control)', 16)}${padL('A − B', 16)}${padL('A / B', 10)}`)
    const row = (label: string, x: number, y: number, fmt: (n: number) => string): void => {
      console.log(
        `  ${pad(label, 22)}${padL(fmt(x), 16)}${padL(fmt(y), 16)}${padL(fmt(x - y), 16)}` +
          `${padL(y === 0 ? '–' : `${((100 * x) / y).toFixed(1)}%`, 10)}`,
      )
    }
    row('contracted sponsor', aSponsor, bSponsor, money)
    row('merch', aMerch, bMerch, money)
    row('BRAND TOTAL', aTotal, bTotal, money)
    row('events entered', aEntries, bEntries, (n) => String(n))
    row('kit-deal weeks', aKit, bKit, (n) => String(n))
    if (nPairs > 0) {
      const perCareer = (aTotal - bTotal) / nPairs
      console.log(`  per career: ${money(perCareer)}  ·  median pair delta ${money(median(deltas))}  ·  pairs where A < B: ${deltas.filter((d) => d < 0).length}/${nPairs}`)
    }
    console.log('')
  }

  // --- WHY THE CONTRACTS WENT, which is the reader's own record rather than an inference ---
  console.log('  ── WHY A KIT DEAL ENDED, inside the absence window (the goodbye letters) ──')
  const reasons = new Map<string, number>()
  const reasonsB = new Map<string, number>()
  for (const c of paused) {
    const twin = byB.get(c.seed)
    const from = c.pausesWeek!
    const to = from + pauseWeeks
    for (const e of c.kitEnds) if (e.week >= from && e.week < to) reasons.set(e.reason, (reasons.get(e.reason) ?? 0) + 1)
    if (twin) for (const e of twin.kitEnds) if (e.week >= from && e.week < to) reasonsB.set(e.reason, (reasonsB.get(e.reason) ?? 0) + 1)
  }
  const allReasons = [...new Set([...reasons.keys(), ...reasonsB.keys()])].sort()
  console.log(`  ${pad('reason', 16)}${padL('A (pauses)', 14)}${padL('B (control)', 14)}`)
  for (const r of allReasons) {
    console.log(`  ${pad(r, 16)}${padL(String(reasons.get(r) ?? 0), 14)}${padL(String(reasonsB.get(r) ?? 0), 14)}`)
  }
  console.log('')
}

function main(): void {
  const cmpA = strArg('compare')
  if (cmpA !== null) {
    const at = process.argv.indexOf('--compare')
    const cmpB = process.argv[at + 2]
    if (typeof cmpB !== 'string') throw new Error('--compare takes TWO paths: the A emit and the B emit')
    compare(cmpA, cmpB)
    return
  }

  const policy = POLICIES[1] // `player` – the arm that reaches professional winters (two-doors' note)
  const presets = PRESETS.filter((p, i) => PRESETS.findIndex((q) => q.background === p.background) === i)
  const hazard = ECONOMY.motherhood.perWeekByAge.map((r) => `${r.fromAge}:${(r.perWeek * 52 * 100).toFixed(1)}%/yr`).join(' ')
  const arm = strArg('arm') ?? 'unnamed'

  console.log('')
  console.log('THE PAUSE-BRAND PROBE – wave 8 T7 (sponsors, measured before built)')
  console.log(
    `  ${presets.length} presets x ${SEEDS} seeds = ${presets.length * SEEDS} careers, every one a distinct seed · ` +
      `walk ${WALK_WEEKS} weeks (to age ~${(13.56 + WALK_WEEKS / 52).toFixed(1)}) · policy "${policy.label}"`,
  )
  // ⚠ THE HEADER PRINTS THE LIVE HAZARD SO EACH LOG SELF-DESCRIBES WHICH ARM IT IS – the wedding
  // bench's own rule for a reverse-edited control («the header prints the live value»).
  console.log(`  ARM "${arm}" · perWeekByAge THIS RUN: ${hazard}`)
  console.log(`  the absence: playsOnWeeks ${ECONOMY.motherhood.playsOnWeeks} then ${LIVE_PAUSE_WEEKS} weeks shut`)
  // ⚠ PRINTED BECAUSE IT IS THE READER THE NULL-RESULT LAW ASKS ABOUT. `minEvents` is what
  // `reviewSponsors` fails a deal on (`played >= dealTerms.minEventsPerSeason`), and a season inside
  // the absence plays none – so if the loss this probe measures is real, THIS is the constant doing
  // most of the work, and the absurd-value arm sets every one of these to 0.
  console.log(
    `  minEvents THIS RUN: junior ${ECONOMY.sponsorship.minEvents}/${ECONOMY.sponsorship.topMinEvents} · ` +
      `national ${ECONOMY.sponsorship.national.minEvents} · global ${ECONOMY.sponsorship.global.minEvents} · ` +
      `tour ${ECONOMY.sponsorship.tour.minEvents} · premium ${ECONOMY.sponsorship.premium.minEvents} · icon ${ECONOMY.sponsorship.icon.minEvents}`,
  )
  console.log('')

  const careers: CareerBrand[] = []
  const byKind = emptyDrainCounts()
  for (const preset of presets) {
    for (let i = 0; i < SEEDS; i++) {
      const c = runCareer(preset, i, policy)
      careers.push(c)
      for (const k of Object.keys(c.byKind) as LifeBeatKind[]) byKind[k] += c.byKind[k]
    }
  }
  console.log(`  ${drainSkewLine(byKind)}  (per career: /${careers.length})`)

  const paused = careers.filter((c) => c.pausesWeek !== null)
  const latched = careers.filter((c) => c.latchedWeek !== null)
  console.log(`  married: ${latched.length}/${careers.length} · pregnancies: ${paused.length} (${pct(paused.length, latched.length)} of married)`)
  const ages = paused.map((c) => (c.announcedWeek! / WEEKS_PER_YEAR) + 13.56).sort((x, y) => x - y)
  if (ages.length > 0) console.log(`  announcement age: median ${median(ages).toFixed(1)} (min ${ages[0].toFixed(1)}, max ${ages[ages.length - 1].toFixed(1)})`)
  const withBrand = careers.filter((c) => c.payWeeks.length > 0).length
  console.log(`  careers that ever took brand money: ${withBrand}/${careers.length} (${pct(withBrand, careers.length)}) – the on-ramp sanity line`)
  const totals = careers.map((c) => c.sponsorGross.reduce((s, x) => s + x, 0) + c.merchGross.reduce((s, x) => s + x, 0))
  const sponsorAll = careers.reduce((s, c) => s + c.sponsorGross.reduce((t, x) => t + x, 0), 0)
  const merchAll = careers.reduce((s, c) => s + c.merchGross.reduce((t, x) => t + x, 0), 0)
  console.log(
    `  gross brand money over the walk: total ${money(sponsorAll + merchAll)} (contracted ${money(sponsorAll)} + merch ${money(merchAll)}), ` +
      `median ${money(median(totals))}, max ${money(Math.max(0, ...totals))}`,
  )
  const brands = careers.filter((c) => c.merchGross.some((x) => x > 0)).length
  console.log(`  families that bought the merch brand and earned from it: ${brands}/${careers.length}`)
  console.log(
    `  the inbox: kit letters ${careers.reduce((s, c) => s + c.lettersKit, 0)} (signed ${careers.reduce((s, c) => s + c.signedKit, 0)}) · ` +
      `ad letters ${careers.reduce((s, c) => s + c.lettersAd, 0)} (signed ${careers.reduce((s, c) => s + c.signedAd, 0)})`,
  )
  const kitEnds = careers.flatMap((c) => c.kitEnds)
  const byReason = new Map<string, number>()
  for (const e of kitEnds) byReason.set(e.reason, (byReason.get(e.reason) ?? 0) + 1)
  console.log(`  kit deals ended: ${kitEnds.length} – ${[...byReason.entries()].sort().map(([r, n]) => `${r} ${n}`).join(' · ') || 'none'}`)
  const endings = new Map<string, number>()
  for (const c of careers) endings.set(c.endedType ?? '(reached walk end)', (endings.get(c.endedType ?? '(reached walk end)') ?? 0) + 1)
  console.log(`  endings: ${[...endings.entries()].sort((x, y) => y[1] - x[1]).map(([k, n]) => `${k} ${n}`).join(' · ')}`)
  console.log('')

  const emit = strArg('emit')
  if (emit !== null) {
    const payload: Emitted = { arm, hazard, seeds: SEEDS, walk: WALK_WEEKS, pauseWeeks: LIVE_PAUSE_WEEKS, minEvents: LIVE_MIN_EVENTS, careers }
    writeFileSync(emit, JSON.stringify(payload))
    console.log(`  emitted ${careers.length} careers to ${emit}`)
    console.log('')
  }
}

main()

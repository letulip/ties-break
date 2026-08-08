/**
 * real-vs-bench – is the bench measuring a player who exists?
 *
 * MEASUREMENT ONLY (backlog #89). This file imports the engine read-only, changes no constant,
 * re-bases nothing and ships no fixture. It exists to answer one question the balance work has
 * never asked: **the bench's careers and a human's career – are they the same population?**
 *
 * WHY IT WAS WRITTEN. `tests/econ-reach.test.ts`'s 14→18 arm reads 1 of 30 and the bench's own arms
 * say 30 of 30 careers latch bankruptcy with the coach retainer live
 * (docs/specs/compound-cost-2026-08.md §1a). The owner played the game and reported the opposite,
 * and `docs/specs/money-decomposition-2026-08.md` already measured prize/spend at 44.9% on his real
 * career against a bench median of 12.4%. A three-and-a-half-fold gap on the headline money ratio is
 * not a tuning disagreement – it is the instrument and the subject describing different games.
 *
 * ⚠ THE SAVES ARE PERSONAL AND ARE NEVER COMMITTED, AND NEITHER IS ANY FIXTURE BUILT FROM ONE.
 * The human arm reads a `.tsave` handed to it on the command line, through the game's OWN import
 * door (`decodeExportFile`), so the world it characterises is the world the player played – migrated
 * up the same ladder a real load runs. What this repo keeps is the DERIVED STATISTICS in
 * docs/specs/real-vs-bench-2026-08.md: bands, rates, per-season medians. Never the careers.
 *
 * ⚠ AND BOTH SIDES ARE READ OFF THE SAME ENGINE-WRITTEN RECORD, which is what makes the comparison
 * worth anything. `maybeFireSeasonWrapUp` appends one `SeasonHistoryEntry` per season – endRank,
 * points, wins, losses, fundsDelta, endFunds, spent, earned – to `world.seasonHistory`, and it does
 * that for a bench career ticked by `stepCareerWeek` exactly as it does for a career played by hand.
 * So the axes below are not two tools' readings of two things; they are one writer's rows, compared.
 * That is deliberately NOT how `financeWeeks` works (pruned to 60 weeks), which is why a per-season
 * category fold is impossible on the human side and is not attempted.
 *
 * Run:
 *   npx vite-node tools/real-vs-bench.ts -- --save /path/a.tsave --save /path/b.tsave
 *   npx vite-node tools/real-vs-bench.ts -- --save ... --cell          # the 25k middle-coach claim
 *   npx vite-node tools/real-vs-bench.ts -- --save ... --verify        # the entry estimator's error
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import {
  acceptOffer,
  answerFork,
  bookVacation,
  hireCoach,
  type WorldState,
} from '../src/engine/world'
import { SPONSOR_TIERS } from '../src/engine/offers'
import { buildCoachRoster, coachById, tierOf, COACH_TIER_LABEL } from '../src/engine/coach'
import type { CoachTier, FamilyBackground, SponsorTier } from '../src/shared/protocol'
import { WEEKS_PER_YEAR, TIER_LADDER } from '../src/engine/season/calendar'
import type { SeasonEvent, TierId } from '../src/engine/season/types'

/** ⚠ RESOLVED LAZILY, AND THE REASON IS THE WAVE ATTRIBUTION ITSELF. `coachLadderNote` is the LADDER
 *  wave's own counterweight, so it does not exist on the two pre-ladder arms this same file is run
 *  on (§10: `d9efb4e` and `d9efb4e + bf00acb` both lack it). A static import would make the tool
 *  unloadable there – the arm would report nothing rather than a number, which is the worst possible
 *  outcome for a measurement. So the coach-voice bracket asks for the function at start-up and, when
 *  the tree has no such thing, says so and skips itself. */
type LadderNote = (w: WorldState, e: SeasonEvent, t: CoachTier) => string | null
let COACH_NOTE: LadderNote | null = null
import {
  PRESETS,
  POLICIES,
  START_AGE_YEARS,
  SEASON_WRAP_OFFSET,
  openCareer,
  stepCareerWeek,
  zeroByTier,
  mean,
  median,
  type EntryVeto,
  type Policy,
  type Preset,
} from './econ-bench'

// --- the axes ----------------------------------------------------------------

/** One season, on the axes BOTH sides can honestly answer. Everything here except `titles`,
 *  `entriesEst` and `entriesTrue` is a field the engine itself wrote at the season wrap. */
interface SeasonRow {
  seasonIndex: number
  endRank: number
  points: number
  wins: number
  losses: number
  /** wins + losses – matches actually played that season. */
  matches: number
  /** titles won in this season's week range, or null when the trophy ledger does not cover it. */
  titles: number | null
  /** losses + titles: every entry ends in exactly one loss unless she wins the thing. Null when
   *  `titles` is. See `--verify` for the estimator's measured error against true bench entries. */
  entriesEst: number | null
  /** bench only – the entries the policy actually committed. Null on the human side, always. */
  entriesTrue: number | null
  /** bench only – that season's entries split by rung, for the tier-mix axis. */
  entriesByTier?: Record<TierId, number>
  /** sampled AT THE WRAP, not derived from the row: career-cumulative prize and spend, the top rung
   *  reached so far, her W rank, the rung she was being coached at, and the mean condition she
   *  played the season at. A row alone cannot say any of these and they are what the deep read is
   *  for. */
  prizeToDateCents?: number
  spentToDateCents?: number
  topRungToDate?: TierId | null
  kidRankWta?: number | null
  coachTierNow?: CoachTier
  meanCondition?: number
  /** gross spend, positive cents. Absent on rows written before schema v-W7 backfilled it. */
  spentCents: number | null
  earnedCents: number | null
  fundsDeltaCents: number
  endFundsCents: number
}

/** A whole career, human or bench, on one shape. */
interface Career {
  label: string
  background: FamilyBackground
  /** the rung she STARTED on (profile.coachTier) and the rung she ended on (resolved off coachId). */
  startCoachTier: CoachTier
  endCoachTier: CoachTier
  /** every rung change the diary still carries, oldest first. The bench never has one. */
  coachArc: { week: number; tier: CoachTier }[]
  plan: { train: number; rest: number }
  weeks: number
  seasons: SeasonRow[]
  /** careerTotals – earned/spent/prize over the WHOLE career, never pruned. */
  earnedCents: number
  spentCents: number
  prizeCents: number
  weeksLostToInjury: number
  endFundsCents: number
  /** did the career latch an ending, which kind, and in what week. */
  ending: string | null
  endingWeek: number | null
  /** ⚠ WAS SHE EVER ON AN ACADEMY SCHOLARSHIP – not "is she on one now", and the difference was a
   *  false finding caught in review. `ECONOMY.academy.ageBand` is [13, 18], so `world.academy` is
   *  null at the end of ANY seven-season run (she is 21) whether or not she ever had one. Read at
   *  the end, the first version of this tool reported "academy: 0% of bench cells, 50% of humans"
   *  and both halves were artefacts: the owner's save is week 412 and his scholarship had simply
   *  aged out. The diary still carries it – `fireMilestone` writes the award `keep: true`, so it
   *  survives the event ledger's pruning – and the bench side now ORs the flag every week. */
  academy: boolean
  academyCoveredCents: number
  /** kit-deal offers by outcome – the decisions the player made about money coming IN. */
  offers: { signed: number; refused: number; expired: number; open: number }
  vacations: number
  /** bench only – what the arm actually DID, so a claim about a behaviour is never taken on the
   *  strength of the flag that asked for it. */
  acts?: { signed: number; refused: number; holidays: number; vetoed: number; forkAnswered: number }
  /** best (lowest) end-of-season rank across the seasons banked. */
  bestSeasonRank: number
  kidRankWta: number | null
  /** THE HIGHEST RUNG SHE EVER PLAYED, as an index into TIER_LADDER. Read off `bestFinishByTier`,
   *  which gains a key the first time she finishes an event at that tier – so it is a record of
   *  what she ENTERED, and unlike the trophy cabinet it is not empty-migrated. This is the cleanest
   *  axis in the file: `money-decomposition-2026-08.md` §4.5 measures the bench at 0 of 180 careers
   *  ever entering a WTA 250, and one of the two human careers has a best finish at one. */
  topRungIndex: number
  topRung: TierId | null
}

const fmt$ = (cents: number): string => {
  const d = Math.round(cents / 100)
  return `${d < 0 ? '-' : ''}$${Math.abs(d).toLocaleString('en-US')}`
}
const pad = (s: string, w: number) => (s.length >= w ? s : ' '.repeat(w - s.length) + s)
const padE = (s: string, w: number) => (s.length >= w ? s : s + ' '.repeat(w - s.length))
const r1 = (x: number) => (Number.isFinite(x) ? x.toFixed(1) : '–')

/** Season index a week belongs to. The engine's own definition (`floor(week / WEEKS_PER_YEAR)`) –
 *  see SeasonHistoryEntry's note on why an index and not a calendar year. */
const seasonOf = (week: number) => Math.floor(week / WEEKS_PER_YEAR)

// --- the human side ----------------------------------------------------------

/** Titles per season out of `trophiesByTier`, and the first season the ledger actually covers.
 *
 *  ⚠ THE LEDGER IS NOT RETROSPECTIVE AND THAT IS A REAL LIMIT, NOT A BUG. `trophiesByTier` arrived
 *  at schema v31 and its migration creates an EMPTY cabinet – it cannot backfill weeks nobody
 *  recorded. Both human saves show it: the owner's diary milestones name a Local title at week 9 and
 *  a National at week 48, and his cabinet's earliest entry is week 90. So titles (and therefore the
 *  entry estimate) are only honest from the first season the cabinet has anything in, and every
 *  earlier season is reported as null rather than as a smaller number. */
function titlesBySeason(world: WorldState): { titles: Map<number, number>; firstCoveredSeason: number } {
  const titles = new Map<number, number>()
  let earliest = Infinity
  for (const cabinet of Object.values(world.trophiesByTier)) {
    for (const week of cabinet?.titles ?? []) {
      titles.set(seasonOf(week), (titles.get(seasonOf(week)) ?? 0) + 1)
      if (week < earliest) earliest = week
    }
  }
  // The cabinet's first title is somewhere INSIDE its first covered season, so that season's count
  // may itself be short. The first season we trust is the one after it.
  return { titles, firstCoveredSeason: earliest === Infinity ? Infinity : seasonOf(earliest) + 1 }
}

/** The highest rung she ever finished an event at. `bestFinishByTier` gains its key in
 *  `finalizeTournament`, so a tier present here is a tier she played, whatever the result. */
function topRungOf(world: WorldState): { topRungIndex: number; topRung: TierId | null } {
  let best = -1
  for (const [tier, finish] of Object.entries(world.bestFinishByTier) as [TierId, number | undefined][]) {
    if (finish === undefined || finish === null) continue
    const i = TIER_LADDER.indexOf(tier)
    if (i > best) best = i
  }
  return { topRungIndex: best, topRung: best < 0 ? null : TIER_LADDER[best] }
}

/** The rung a coach id names. Resolved through the roster, NEVER off the id's prefix: the roster
 *  carries `{ portrait: 'middle-4', tier: 'budget' }` on purpose (coach.ts records the argument),
 *  so a prefix read would mis-rung a real career. */
function tierOfCoachId(world: WorldState, id: string | null): CoachTier {
  if (!id) return 'self'
  const ageYears = START_AGE_YEARS + Math.floor(world.week / WEEKS_PER_YEAR)
  return tierOf(coachById(world.seed, ageYears, id))
}

/** Every rung change the diary still carries. The event ledger is capped and prunes non-`keep` rows,
 *  but a coach hire is written `keep: true`, so this survives the whole career. */
function coachArcOf(world: WorldState): { week: number; tier: CoachTier }[] {
  const arc: { week: number; tier: CoachTier }[] = []
  const label = new Map<string, CoachTier>()
  for (const [tier, text] of Object.entries(COACH_TIER_LABEL) as [CoachTier, string][]) {
    label.set(text.toLowerCase(), tier)
  }
  for (const e of world.events) {
    const m = /is her coach now – (\w+) tier/i.exec(String(e.text ?? ''))
    if (!m) continue
    const tier = label.get(m[1].toLowerCase())
    if (tier) arc.push({ week: e.week, tier })
  }
  return arc
}

function seasonRowsOf(world: WorldState): SeasonRow[] {
  const { titles, firstCoveredSeason } = titlesBySeason(world)
  return world.seasonHistory.map((h) => {
    const covered = h.seasonIndex >= firstCoveredSeason
    const t = covered ? (titles.get(h.seasonIndex) ?? 0) : null
    return {
      seasonIndex: h.seasonIndex,
      endRank: h.endRank,
      points: h.points,
      wins: h.wins,
      losses: h.losses,
      matches: h.wins + h.losses,
      titles: t,
      entriesEst: t === null ? null : h.losses + t,
      entriesTrue: null,
      spentCents: h.spentCents ?? null,
      earnedCents: h.earnedCents ?? null,
      fundsDeltaCents: h.fundsDeltaCents,
      endFundsCents: h.endFundsCents,
    }
  })
}

async function readHumanCareer(path: string): Promise<Career> {
  const world = await decodeExportFile(new Uint8Array(readFileSync(path)))
  const offers = { signed: 0, refused: 0, expired: 0, open: 0 }
  for (const o of world.offers) {
    if (o.kind !== 'kit') continue
    if (o.state === 'signed') offers.signed++
    else if (o.state === 'refused') offers.refused++
    else if (o.state === 'expired') offers.expired++
    else offers.open++
  }
  const rows = seasonRowsOf(world)
  return {
    label: `${world.profile.kidName} (human, w${world.week})`,
    background: world.profile.background,
    startCoachTier: world.profile.coachTier ?? 'self',
    endCoachTier: tierOfCoachId(world, world.coachId),
    coachArc: coachArcOf(world),
    plan: { train: world.plan.train, rest: world.plan.rest },
    weeks: world.week,
    seasons: rows,
    earnedCents: world.careerTotals.earnedCents,
    spentCents: world.careerTotals.spentCents,
    prizeCents: world.careerTotals.prizeCents,
    weeksLostToInjury: world.careerTotals.weeksLostToInjury,
    endFundsCents: world.fundsCents,
    ending: world.ending?.type ?? null,
    endingWeek: world.ending?.week ?? null,
    // Live scholarship, or the award line the diary kept. See the field's note.
    academy:
      world.academy !== null ||
      world.events.some((e) => /academy has taken her on/i.test(String(e.text ?? ''))),
    academyCoveredCents: world.academy?.coveredCents ?? 0,
    offers,
    vacations: world.vacations.length,
    bestSeasonRank: rows.length ? Math.min(...rows.map((r) => r.endRank)) : world.kidRank,
    kidRankWta: world.kidRankWta ?? null,
    ...topRungOf(world),
  }
}

// --- the bench side ----------------------------------------------------------

/** An arm: a preset, a policy, and optionally a coach ladder the parent climbs. `Policy.id` is a
 *  closed union in econ-bench and a new arm has no business widening it, so an arm carries its own
 *  label and hands `stepCareerWeek` a Policy whose id is only ever read for econ-bench's own
 *  console – the step function itself reads reserveCents, restFloor and coachOnEventWeeks and
 *  nothing else. */
interface Arm {
  label: string
  policy: Policy
  /** the proposed `human` arm's coach ladder – see §5 of the spec. Undefined = the bench's own
   *  behaviour, which is to hold the rung it was born on for the entire career. */
  coachLadder?: { upgradeAtCents: number; minWeeksBetween: number; ladder: CoachTier[] }
  /** does she take the family holiday the planner offers? Human careers do; no bench arm ever has. */
  vacations?: boolean
  /** DERIVED (§9a): sign every kit offer at this sponsor rung or better, and never one below it.
   *  Six of six decided offers across the two saves fit that rule with no exceptions. */
  signOffersFrom?: SponsorTier
  /** DERIVED (§9a): answer the age-19 fork 'continue', which is literally what the owner's save
   *  records (`fork: { askedWeek: 265, answer: 'continue' }`). It is also the only way a bench arm
   *  models a real player past nineteen at all – `advanceWeeks` returns `['fork']` and REFUSES to
   *  tick while the fork is open, but `tickWeek` has no such guard, so an unanswered fork stops a
   *  human's career and the bench sails straight through it. */
  answerForkContinue?: boolean
  /** ⚠ SENSITIVITY BRACKET, NOT PART OF THE MODEL (§9b). Book the free staycation once a season.
   *  Evidence: ONE staycation, once, at week 408 of 412, and none at all in the other career. That
   *  is far too thin to model as a recurring habit, so it is measured as a bound on what the
   *  holiday lever is worth and never folded into the derived arm. */
  holidayEachSeason?: boolean
  /** ⚠ SENSITIVITY BRACKET, NOT PART OF THE MODEL (§9b). Do whatever the coach says about every
   *  trip, via the engine's own `coachLadderNote` – the veto `tools/ladder-floor.ts` §4c uses. No
   *  save can record an entry a parent DIDN'T make, so there is no direct evidence either way; what
   *  the saves do say is that his entry rate sits between the grinder's and this arm's. */
  coachVoice?: boolean
}

/** ⚠ THE UPGRADE THRESHOLD IS READ OFF THE TWO CAREERS, NOT CHOSEN FOR AN OUTCOME. Both humans
 *  climbed the coach ladder mid-career and the balance they held when they did is in the saves:
 *  Zoe hired budget at w38 (~$8-9k), middle at w113 (~$9.6k) and high at w162 (~$10.8k); the owner
 *  went to middle at w211 (~$16.0k). The median of those four upgrade balances is ~$10.2k, so the
 *  arm upgrades one rung whenever the family holds $10,000. It is one number and it is the median
 *  of the observed four – if it were tuned, this comment would be where the tuning was hidden. */
const HUMAN_UPGRADE_AT_CENTS = 10_000_00

/** ⚠ AND THE CLIMB IS PACED, WHICH THE FIRST VERSION OF THIS ARM MISSED AND THE MEASUREMENT CAUGHT.
 *  With a balance trigger alone a 25k family clears $10,000 on day one and climbs self → budget →
 *  middle → high in three consecutive weeks, arriving at a rung it never earned; the arm then
 *  reproduced `25k · middle · high coach · player` to the dollar (matches 10.5 against 10.6, net
 *  -$3,698 against -$3,698) and was measuring the preset it was supposed to replace.
 *
 *  The saves say the climb takes years: Zoe's three upgrades are 38, 75 and 49 weeks apart, and the
 *  owner sat on one rung for 211 weeks before moving. One rung per SEASON is the nearest bound the
 *  game's own calendar expresses and it holds for three of the four observed gaps. Zoe's first
 *  upgrade at 38 weeks is inside a season and therefore faster than this rule allows – stated
 *  rather than fitted, because an arm is a model of the behaviour and not a replay of it. */
const HUMAN_MIN_WEEKS_BETWEEN_UPGRADES = WEEKS_PER_YEAR

/** THE PROPOSED `human` ARM. It is `player` plus the one behaviour no bench cell can express: the
 *  parent does not buy a coach rung at birth and hold it for twenty years, he starts self-coached
 *  and climbs as the tennis pays.
 *
 *  ⚠ WHAT IS DERIVED AND WHAT IS INHERITED, stated separately so neither is mistaken for the other:
 *   - DERIVED from the saves: the coach ladder itself (both careers climbed one), its rungs
 *     (self → budget → middle → high, the order both took) and the $10,000 trigger (above).
 *   - INHERITED unchanged from `POLICIES[1]`: the $5,000 reserve and the condition-70 rest floor.
 *     Neither is derivable from a save – a save carries no condition history and no per-week cash –
 *     so they are taken as-is rather than invented. What CAN be checked is the observable they
 *     produce, and it lands inside the human band on entries and matches per season before this arm
 *     adds anything (§2 of the spec). That is a validation of the inherited pair, not a derivation. */
const HUMAN_LADDER: CoachTier[] = ['budget', 'middle', 'high']

function armsFor(): Arm[] {
  return [
    { label: 'grinder', policy: POLICIES[0] },
    { label: 'player', policy: POLICIES[1] },
  ]
}

/** ⚠ THE SPONSOR RUNG HE SIGNS AT, AND IT IS THE CLEANEST DERIVATION IN THIS FILE. Every kit offer
 *  either save ever decided, with its rung and his answer:
 *
 *      owner  w153  global    SIGNED        zoe  w99   local     expired
 *      owner  w257  local     expired       zoe  w151  national  SIGNED
 *      owner  w309  national  SIGNED        zoe  w152  local     REFUSED
 *
 *  Three signed, and all three are `national` or better. Three not signed, and all three are
 *  `local` – one of them refused outright while a national letter sat in the same inbox the
 *  following week. **Six of six, no exceptions.** So the rule is `national`, and it is read off the
 *  decisions rather than chosen to make an arm survive. */
const HUMAN_SIGNS_FROM: SponsorTier = 'national'

/** The base derived arm: the coach ladder plus the fork answer. Both are things the saves record. */
function humanArm(): Arm {
  return {
    label: 'human',
    policy: POLICIES[1],
    coachLadder: {
      upgradeAtCents: HUMAN_UPGRADE_AT_CENTS,
      minWeeksBetween: HUMAN_MIN_WEEKS_BETWEEN_UPGRADES,
      ladder: HUMAN_LADDER,
    },
    answerForkContinue: true,
  }
}

/** THE ADAPTING ARM – the derived arm plus the one decision the bench has never made. */
function adaptArm(): Arm {
  return { ...humanArm(), label: 'human+signs', signOffersFrom: HUMAN_SIGNS_FROM }
}

/** The two sensitivity brackets, kept apart from the model on purpose (§9b). */
function bracketArms(): Arm[] {
  return [
    { ...adaptArm(), label: 'human+signs+holiday', holidayEachSeason: true },
    { ...adaptArm(), label: 'human+signs+coachvoice', coachVoice: true },
  ]
}

const CLIMB_LABEL: Record<FamilyBackground, string> = {
  working: '8k   · working · climbs',
  middle: '25k  · middle  · climbs',
  wealthy: '120k · wealthy · climbs',
}

/** The human arm collapses the bench's nine cells to three, and that IS the finding it encodes:
 *  the nine differ only in a coach rung held for life, and no human holds one. */
function humanCells(arm: Arm = humanArm()): { preset: Preset; arm: Arm }[] {
  return (['working', 'middle', 'wealthy'] as FamilyBackground[]).map((background) => ({
    preset: { label: CLIMB_LABEL[background], background, coachTier: 'self' as CoachTier },
    arm,
  }))
}

/** The owner's own family and plan: 8k working, self-coached at the start, climbing. Both saved
 *  careers are this cell, so it is the one the deep read and the wave attribution use. */
function ownerCell(arm: Arm): { preset: Preset; arm: Arm } {
  return {
    preset: { label: CLIMB_LABEL.working, background: 'working', coachTier: 'self' },
    arm,
  }
}

/** Run one bench career for `seasons` seasons and characterise it on the SAME axes as a human save.
 *  The season rows are read off `world.seasonHistory` – the engine's own writer – so the two sides
 *  are the same record and not two tools' opinions of it. */
function runBenchCareer(preset: Preset, index: number, seasons: number, arm: Arm): Career {
  const { world, rng } = openCareer(preset, index, arm.policy)
  const weeks = seasons * WEEKS_PER_YEAR
  const entriesBySeason = new Map<number, number>()
  const byTier = zeroByTier()
  const coachArc: { week: number; tier: CoachTier }[] = []
  // -1 = self-coached, the rung both humans started from. The ladder's first entry is the first
  // hire, so the first upgrade is allowed as soon as the balance clears – the dwell only paces the
  // ones after it. Zoe's own first hire was at week 38, so making her wait a whole season for ANY
  // coach would be stricter than either career was.
  let rung = -1
  let lastUpgradeWeek = -(arm.coachLadder?.minWeeksBetween ?? 0)
  // Sampled every week, because the scholarship's age band closes at 18 and a seven-season run ends
  // at 21 – an end-of-run read is always null. See Career.academy.
  let academyEver = false
  let academyPeakCents = 0
  // Per-season instrumentation, sampled inside the loop because none of it survives to the end.
  const tierBySeason = new Map<number, Record<TierId, number>>()
  const wrap = new Map<
    number,
    { prize: number; spent: number; rung: TierId | null; wta: number | null; coach: CoachTier; cond: number }
  >()
  const condSum = new Map<number, { sum: number; n: number }>()
  const acts = { signed: 0, refused: 0, holidays: 0, vetoed: 0, forkAnswered: 0 }

  // ⚠ THE COACH'S VOICE, through the engine's own note rather than a second opinion of it. Only
  // built when the arm asks for it, so the default arm's MAIN stream is untouched.
  const veto: EntryVeto | undefined = arm.coachVoice
    ? (w, e) => {
        if (!COACH_NOTE) return false
        const said = COACH_NOTE(w, e, tierOfCoachId(w, w.coachId))
        if (said !== null) acts.vetoed++
        return said !== null
      }
    : undefined

  for (let i = 0; i < weeks; i++) {
    // The coach ladder, if this arm climbs one: upgrade when the family can visibly afford it.
    // Checked BEFORE the week is stepped so the new rung bills from this week on, which is what a
    // player who hires on a Monday gets.
    if (arm.coachLadder && !world.ending) {
      const next = arm.coachLadder.ladder[rung + 1]
      const rested = world.week - lastUpgradeWeek >= arm.coachLadder.minWeeksBetween
      if (next && rested && world.fundsCents >= arm.coachLadder.upgradeAtCents) {
        const ageYears = START_AGE_YEARS + Math.floor(world.week / WEEKS_PER_YEAR)
        const pick = buildCoachRoster(world.seed, ageYears).find(
          (c) => c.tier === next && c.style === world.profile.playStyle,
        ) ?? buildCoachRoster(world.seed, ageYears).find((c) => c.tier === next)
        if (pick) {
          hireCoach(world, pick.id)
          coachArc.push({ week: world.week, tier: next })
          rung++
          lastUpgradeWeek = world.week
        }
      }
    }
    // THE DECISIONS A HUMAN MAKES AND NO BENCH POLICY EVER HAS. All of them BEFORE the tick, which
    // is where a player makes them (the inbox and the planner are opened during the week, not after
    // it), and all of them guarded on `world.ending` – a career that has stopped decides nothing.
    if (!world.ending) {
      if (arm.answerForkContinue && world.fork !== null && world.fork.answer === null) {
        answerFork(world, 'continue')
        acts.forkAnswered++
      }
      if (arm.signOffersFrom) {
        // ⚠ COMPARED AS STRINGS ON PURPOSE. `Offer.terms.tier` is a union across offer kinds –
        // a kit letter carries a SponsorTier and an entry card carries a TierId – and the `kind`
        // test above does not narrow `terms`. Ranking by position in SPONSOR_TIERS over strings is
        // honest about that; a cast would assert a narrowing the type system has not done.
        const ladder: readonly string[] = SPONSOR_TIERS
        const floor = ladder.indexOf(arm.signOffersFrom)
        for (const o of world.offers) {
          if (o.kind !== 'kit' || o.state !== 'open') continue
          if (world.week > o.deadlineWeek) continue
          const tier = o.terms?.tier
          const rank = tier === undefined ? -1 : ladder.indexOf(String(tier))
          if (rank < floor) continue // a local letter is left to lapse, exactly as both saves show
          // acceptOffer throws on the one-brand rule; a parent who already has a deal simply does
          // not sign a second, so a refusal here is the rule working and not an error to swallow.
          try {
            acceptOffer(world, o.id)
            acts.signed++
          } catch {
            /* already spoken for this season – nothing to do */
          }
        }
      }
      // ⚠ SENSITIVITY ONLY. One free staycation, booked in the first competition week of the season
      // it can be booked in. `bookVacation` validates the week itself and throws when it cannot.
      if (arm.holidayEachSeason && world.week % WEEKS_PER_YEAR === 1) {
        try {
          bookVacation(world, world.week + 1, 'staycation')
          acts.holidays++
        } catch {
          /* not bookable that week */
        }
      }
    }

    const e = stepCareerWeek(world, rng, arm.policy, veto)
    let n = 0
    // The entry is committed in the week the parent commits, so it belongs to THAT week's season.
    const s = seasonOf(world.week - 1)
    const tm = tierBySeason.get(s) ?? zeroByTier()
    for (const t of Object.keys(e) as TierId[]) {
      n += e[t]
      byTier[t] += e[t]
      tm[t] += e[t]
    }
    tierBySeason.set(s, tm)
    entriesBySeason.set(s, (entriesBySeason.get(s) ?? 0) + n)
    const c = condSum.get(s) ?? { sum: 0, n: 0 }
    c.sum += world.condition
    c.n++
    condSum.set(s, c)
    if (world.academy) {
      academyEver = true
      if (world.academy.coveredCents > academyPeakCents) academyPeakCents = world.academy.coveredCents
    }
    // The wrap: `maybeFireSeasonWrapUp` has already appended the row by now, so this samples the
    // career-cumulative facts a row cannot carry, keyed on the same season index the row uses.
    if (world.week % WEEKS_PER_YEAR === SEASON_WRAP_OFFSET) {
      const si = Math.floor(world.week / WEEKS_PER_YEAR)
      const cc = condSum.get(si)
      wrap.set(si, {
        prize: world.careerTotals.prizeCents,
        spent: world.careerTotals.spentCents,
        rung: topRungOf(world).topRung,
        wta: world.kidRankWta ?? null,
        coach: tierOfCoachId(world, world.coachId),
        cond: cc && cc.n ? cc.sum / cc.n : 0,
      })
    }
  }

  const { titles } = titlesBySeason(world)
  const rows: SeasonRow[] = world.seasonHistory.map((h) => {
    const t = titles.get(h.seasonIndex) ?? 0
    return {
      seasonIndex: h.seasonIndex,
      endRank: h.endRank,
      points: h.points,
      wins: h.wins,
      losses: h.losses,
      matches: h.wins + h.losses,
      titles: t,
      entriesEst: h.losses + t,
      entriesTrue: entriesBySeason.get(h.seasonIndex) ?? 0,
      entriesByTier: tierBySeason.get(h.seasonIndex) ?? zeroByTier(),
      prizeToDateCents: wrap.get(h.seasonIndex)?.prize,
      spentToDateCents: wrap.get(h.seasonIndex)?.spent,
      topRungToDate: wrap.get(h.seasonIndex)?.rung ?? null,
      kidRankWta: wrap.get(h.seasonIndex)?.wta ?? null,
      coachTierNow: wrap.get(h.seasonIndex)?.coach,
      meanCondition: wrap.get(h.seasonIndex)?.cond,
      spentCents: h.spentCents ?? null,
      earnedCents: h.earnedCents ?? null,
      fundsDeltaCents: h.fundsDeltaCents,
      endFundsCents: h.endFundsCents,
    }
  })

  const offers = { signed: 0, refused: 0, expired: 0, open: 0 }
  for (const o of world.offers) {
    if (o.kind !== 'kit') continue
    if (o.state === 'signed') offers.signed++
    else if (o.state === 'refused') offers.refused++
    else if (o.state === 'expired') offers.expired++
    else offers.open++
  }

  return {
    label: `${preset.label} · ${arm.label}`,
    background: preset.background,
    startCoachTier: preset.coachTier,
    endCoachTier: tierOfCoachId(world, world.coachId),
    coachArc,
    plan: { train: world.plan.train, rest: world.plan.rest },
    weeks,
    seasons: rows,
    earnedCents: world.careerTotals.earnedCents,
    spentCents: world.careerTotals.spentCents,
    prizeCents: world.careerTotals.prizeCents,
    weeksLostToInjury: world.careerTotals.weeksLostToInjury,
    endFundsCents: world.fundsCents,
    ending: world.ending?.type ?? null,
    endingWeek: world.ending?.week ?? null,
    academy: academyEver,
    academyCoveredCents: academyPeakCents,
    offers,
    vacations: world.vacations.length,
    acts,
    bestSeasonRank: rows.length ? Math.min(...rows.map((r) => r.endRank)) : world.kidRank,
    kidRankWta: world.kidRankWta ?? null,
    ...topRungOf(world),
  }
}

// --- the axes, folded --------------------------------------------------------

/** The per-season axes a cell is compared on. Career-level ratios are folded from the same rows so
 *  a censored career (bankrupt at week 90) cannot quietly report a small spend as thrift. */
interface Axes {
  n: number
  matches: number
  wins: number
  losses: number
  entries: number | null
  winRate: number
  spend: number
  earned: number
  net: number
  /** career prize / career spend, off careerTotals – never pruned, so this is exact on both sides. */
  prizeOverSpend: number
  bestRank: number
  /** median highest rung played, as a TIER_LADDER index. */
  topRung: number
  /** gross spend per match actually played – "what does a week of tennis cost her". */
  spendPerMatch: number
  /** share of careers in the group that latched an ending (bankruptcy included). */
  endedRate: number
  /** share whose season-end balance went negative at any wrap. */
  redRate: number
  /** THE THREE THINGS THE OWNER NAMED AND NO BENCH ARM DOES. Academy support is engine-granted (a
   *  review level, not a decision) so both sides can have it; a kit deal needs `signOffer` and a
   *  holiday needs a booking, and no policy in `tools/econ-bench.ts` calls either – so the bench
   *  forgoes every dollar of sponsorship in the game and never uses the one lever that stops the
   *  retainer. Counted rather than argued. */
  academyRate: number
  kitSigned: number
  kitExpired: number
  vacations: number
}

function foldAxes(careers: Career[]): Axes {
  const rows = careers.flatMap((c) => c.seasons)
  const withSpend = rows.filter((r) => r.spentCents !== null)
  const withEntries = rows.filter((r) => r.entriesEst !== null)
  const wins = rows.reduce((s, r) => s + r.wins, 0)
  const losses = rows.reduce((s, r) => s + r.losses, 0)
  return {
    n: careers.length,
    matches: mean(rows.map((r) => r.matches)),
    wins: mean(rows.map((r) => r.wins)),
    losses: mean(rows.map((r) => r.losses)),
    entries: withEntries.length ? mean(withEntries.map((r) => r.entriesEst as number)) : null,
    winRate: wins + losses > 0 ? wins / (wins + losses) : 0,
    spend: withSpend.length ? median(withSpend.map((r) => r.spentCents as number)) : 0,
    earned: withSpend.length ? median(withSpend.map((r) => r.earnedCents as number)) : 0,
    net: median(rows.map((r) => r.fundsDeltaCents)),
    prizeOverSpend: median(careers.map((c) => (c.spentCents > 0 ? c.prizeCents / c.spentCents : 0))),
    bestRank: median(careers.map((c) => c.bestSeasonRank)),
    topRung: median(careers.map((c) => c.topRungIndex)),
    spendPerMatch: median(
      withSpend.filter((r) => r.matches > 0).map((r) => (r.spentCents as number) / r.matches),
    ),
    endedRate: careers.filter((c) => c.ending !== null).length / Math.max(1, careers.length),
    redRate:
      careers.filter((c) => c.seasons.some((r) => r.endFundsCents < 0)).length /
      Math.max(1, careers.length),
    academyRate: careers.filter((c) => c.academy).length / Math.max(1, careers.length),
    kitSigned: mean(careers.map((c) => c.offers.signed)),
    kitExpired: mean(careers.map((c) => c.offers.expired)),
    vacations: mean(careers.map((c) => c.vacations)),
  }
}

function supportRow(label: string, a: Axes): string {
  return (
    '  ' +
    padE(label, 38) +
    pad((a.academyRate * 100).toFixed(0) + '%', 10) +
    pad(a.kitSigned.toFixed(1), 12) +
    pad(a.kitExpired.toFixed(1), 13) +
    pad(a.vacations.toFixed(1), 11) +
    pad((a.redRate * 100).toFixed(0) + '%', 10)
  )
}

const supportHeader = () =>
  '  ' +
  padE('cell', 38) +
  [['academy', 10], ['kit signed', 12], ['kit expired', 13], ['holidays', 11], ['ever red', 10]]
    .map(([h, w]) => pad(h as string, w as number))
    .join('')

const COLS: [string, number][] = [
  ['matches', 9],
  ['entries', 9],
  ['win%', 7],
  ['spend/yr', 10],
  ['earn/yr', 10],
  ['net/yr', 10],
  ['$/match', 9],
  ['prize/spend', 12],
  ['topRung', 9],
  ['bestRank', 9],
  ['ended', 7],
]

function axesHeader(): string {
  return '  ' + padE('cell', 38) + COLS.map(([h, w]) => pad(h, w)).join('')
}

function axesRow(label: string, a: Axes): string {
  const rung = a.topRung < 0 ? '–' : (TIER_LADDER[Math.round(a.topRung)] ?? '–')
  return (
    '  ' +
    padE(label, 38) +
    pad(r1(a.matches), 9) +
    pad(a.entries === null ? '–' : r1(a.entries), 9) +
    pad((a.winRate * 100).toFixed(0) + '%', 7) +
    pad(fmt$(a.spend), 10) +
    pad(fmt$(a.earned), 10) +
    pad(fmt$(a.net), 10) +
    pad(fmt$(a.spendPerMatch), 9) +
    pad((a.prizeOverSpend * 100).toFixed(1) + '%', 12) +
    pad(rung, 9) +
    pad('#' + Math.round(a.bestRank), 9) +
    pad((a.endedRate * 100).toFixed(0) + '%', 7)
  )
}

// --- the envelope ------------------------------------------------------------

/** The human band on each axis: min and max across the human careers' own per-season rows. A bench
 *  cell is INSIDE on an axis when its group mean/median sits within that band. */
interface Band {
  lo: number
  hi: number
}
interface Envelope {
  matches: Band
  entries: Band
  winRate: Band
  spend: Band
  earned: Band
  net: Band
  prizeOverSpend: Band
  topRung: Band
  spendPerMatch: Band
}

const bandOf = (xs: number[]): Band => ({ lo: Math.min(...xs), hi: Math.max(...xs) })

function envelopeOf(humans: Career[]): Envelope {
  const rows = humans.flatMap((c) => c.seasons)
  const withSpend = rows.filter((r) => r.spentCents !== null)
  const withEntries = rows.filter((r) => r.entriesEst !== null)
  return {
    matches: bandOf(rows.map((r) => r.matches)),
    entries: bandOf(withEntries.map((r) => r.entriesEst as number)),
    winRate: bandOf(rows.map((r) => (r.matches ? r.wins / r.matches : 0))),
    spend: bandOf(withSpend.map((r) => r.spentCents as number)),
    earned: bandOf(withSpend.map((r) => r.earnedCents as number)),
    net: bandOf(rows.map((r) => r.fundsDeltaCents)),
    prizeOverSpend: bandOf(humans.map((c) => c.prizeCents / c.spentCents)),
    topRung: bandOf(humans.map((c) => c.topRungIndex)),
    spendPerMatch: bandOf(
      withSpend.filter((r) => r.matches > 0).map((r) => (r.spentCents as number) / r.matches),
    ),
  }
}

const inside = (x: number, b: Band) => x >= b.lo && x <= b.hi

/** Which of the envelope's axes a cell falls inside.
 *
 *  ⚠ A BAND OF TWO CAREERS IS A WIDE, GENEROUS TEST AND THAT IS DELIBERATE. The band is the FULL
 *  min-max of the humans' own per-season rows, not a confidence interval, so a cell only fails an
 *  axis by landing outside everything either human ever did in any season. Failing this test is a
 *  strong statement; passing it is a weak one. Read the misses, not the hits.
 *
 *  `topRung` is an index into TIER_LADDER, so "inside" means she got as far up the ladder as the
 *  humans did – the axis `money-decomposition-2026-08.md` §4.5 shows the bench never clearing. */
const AXES: [string, (a: Axes) => number, (e: Envelope) => Band][] = [
  ['matches', (a) => a.matches, (e) => e.matches],
  ['entries', (a) => a.entries ?? NaN, (e) => e.entries],
  ['win%', (a) => a.winRate, (e) => e.winRate],
  ['spend', (a) => a.spend, (e) => e.spend],
  ['earned', (a) => a.earned, (e) => e.earned],
  ['net', (a) => a.net, (e) => e.net],
  ['$/match', (a) => a.spendPerMatch, (e) => e.spendPerMatch],
  ['prize/spend', (a) => a.prizeOverSpend, (e) => e.prizeOverSpend],
  ['topRung', (a) => a.topRung, (e) => e.topRung],
]

function insideCount(a: Axes, env: Envelope): { hits: string[]; misses: string[] } {
  const hits: string[] = []
  const misses: string[] = []
  for (const [name, get, band] of AXES) (inside(get(a), band(env)) ? hits : misses).push(name)
  return { hits, misses }
}

// --- the 25k middle-coach cell -----------------------------------------------

/** THE SPECIFIC CLAIM. The bench says a 25k family with a middle coach goes bankrupt; the owner is
 *  running that exact cell and is up $3k at week 20. Reproduced as closely as a bench can: the same
 *  background, the same rung, the same 75/25 plan, and then run forward season by season with the
 *  week-20 balance called out, because that is the week he reported. */
function cellReport(seeds: number, seasons: number, arms: Arm[]): string[] {
  const out: string[] = []
  // ⚠ TWO CELLS, BECAUSE THE CLAIM AND THE EVIDENCE FOR IT NAME DIFFERENT ONES. The owner is
  // running a MIDDLE-tier coach at $201/wk (inside the middle corridor's $175-340 band at 14).
  // `compound-cost-2026-08.md`'s "30 of 30 latch bankruptcy" is measured on `middleHigh` – the
  // tripwire's own fixture, which is 25k · middle · HIGH coach. They are one rung apart and the
  // rung is the most expensive line in the game, so both are run and printed together.
  const presets = [
    PRESETS.find((p) => p.background === 'middle' && p.coachTier === 'middle'),
    PRESETS.find((p) => p.background === 'middle' && p.coachTier === 'high'),
  ].filter((p): p is Preset => p !== undefined)
  for (const preset of presets) out.push(...cellArms(preset, seeds, seasons, arms))
  return out
}

function cellArms(preset: Preset, seeds: number, seasons: number, arms: Arm[]): string[] {
  const out: string[] = []
  out.push('')
  out.push(`  THE CELL: ${preset.label}, plan balanced 75/25, ${seeds} seeds, ${seasons} seasons`)
  out.push(`  The owner's report: week 20, family up $3,000 on a $25,000 start.`)
  out.push('')
  for (const arm of arms) {
    // Week-20 balance needs the career walked rather than a horizon result, so it is walked.
    const w20: number[] = []
    const careers: Career[] = []
    for (let i = 0; i < seeds; i++) {
      const { world, rng } = openCareer(preset, i, arm.policy)
      for (let k = 0; k < 20; k++) stepCareerWeek(world, rng, arm.policy)
      w20.push(world.fundsCents)
      careers.push(runBenchCareer(preset, i, seasons, arm))
    }
    const up = w20.filter((f) => f > 25_000_00).length
    const bankruptSeason = careers.map((c) => c.seasons.findIndex((r) => r.endFundsCents < 0))
    const everRed = bankruptSeason.filter((s) => s >= 0)
    out.push(
      `  ${padE(arm.label, 10)} week 20: median ${fmt$(median(w20))} · ${up}/${seeds} above the $25,000 start`,
    )
    // ⚠ "ENDED" IS NOT "WENT BANKRUPT", and the claim under test is specifically about the money.
    // A career can also stop for a plateau, an injury or the natural end of the road, and lumping
    // those in would answer a question nobody asked.
    const byKind = new Map<string, number[]>()
    for (const c of careers) {
      if (!c.ending) continue
      const at = byKind.get(c.ending) ?? []
      at.push(c.endingWeek ?? NaN)
      byKind.set(c.ending, at)
    }
    const kinds = [...byKind.entries()]
      .map(([k, ws]) => `${k} ${ws.length}/${seeds} (median week ${Math.round(median(ws))})`)
      .join(' · ')
    out.push(
      `  ${padE('', 10)} endings: ${kinds || 'none'}` +
        ` | first RED season end: ${everRed.length}/${seeds}` +
        (everRed.length ? ` (median season ${median(everRed).toFixed(1)})` : ''),
    )
    const perSeason = (k: number) =>
      careers.map((c) => c.seasons[k]).filter((r): r is SeasonRow => r !== undefined)
    for (let k = 0; k < seasons; k++) {
      const rows = perSeason(k)
      if (!rows.length) continue
      out.push(
        `  ${padE('', 10)} s${k}: end funds median ${pad(fmt$(median(rows.map((r) => r.endFundsCents))), 10)}` +
          ` · spend ${pad(fmt$(median(rows.map((r) => r.spentCents ?? 0))), 10)}` +
          ` · earned ${pad(fmt$(median(rows.map((r) => r.earnedCents ?? 0))), 10)}` +
          ` · entries ${pad(r1(mean(rows.map((r) => r.entriesTrue ?? 0))), 6)}` +
          ` · matches ${pad(r1(mean(rows.map((r) => r.matches))), 6)}`,
      )
    }
    out.push('')
  }
  return out
}

// --- the deep read ----------------------------------------------------------

/** SEASON BY SEASON, one arm, on every axis the envelope is drawn on – plus the four things a
 *  season row cannot say (cumulative prize ratio, top rung reached, W rank, mean condition).
 *
 *  Medians across the seeds, per season, because a mean over a population where some careers have
 *  stopped is the censoring trap `compound-cost-2026-08.md` §1a warns about. Every column also
 *  carries the count of careers still alive, so a row that looks calm because it is nearly empty
 *  says so. */
function deepReport(cell: { preset: Preset; arm: Arm }, seeds: number, seasons: number, env: Envelope): string[] {
  const out: string[] = []
  const careers: Career[] = []
  for (let i = 0; i < seeds; i++) careers.push(runBenchCareer(cell.preset, i, seasons, cell.arm))
  out.push('')
  out.push(`  ${cell.preset.label} · ${cell.arm.label} – ${seeds} seeds, ${seasons} seasons, medians`)
  const a = careers[0]?.acts
  if (a) {
    const tot = careers.reduce(
      (s, c) => ({
        signed: s.signed + (c.acts?.signed ?? 0),
        holidays: s.holidays + (c.acts?.holidays ?? 0),
        vetoed: s.vetoed + (c.acts?.vetoed ?? 0),
        forkAnswered: s.forkAnswered + (c.acts?.forkAnswered ?? 0),
      }),
      { signed: 0, holidays: 0, vetoed: 0, forkAnswered: 0 },
    )
    out.push(
      `  what the arm DID, per career: kit deals signed ${(tot.signed / seeds).toFixed(1)}` +
        ` · holidays ${(tot.holidays / seeds).toFixed(1)}` +
        ` · entries the coach talked her out of ${(tot.vetoed / seeds).toFixed(1)}` +
        ` · fork answered ${(tot.forkAnswered / seeds).toFixed(2)}`,
    )
  }
  out.push('')
  const head = ['alive', 'matches', 'W-L', 'entries', 'win%', 'cond', 'spend', 'earned', 'endFunds', 'prize/sp', 'topRung', 'coach', 'WTA']
  const w = [7, 9, 9, 9, 7, 6, 10, 10, 11, 10, 9, 8, 7]
  out.push('  ' + padE('season', 8) + head.map((h, i) => pad(h, w[i])).join(''))
  for (let k = 0; k < seasons; k++) {
    const rows = careers.map((c) => c.seasons[k]).filter((r): r is SeasonRow => r !== undefined)
    if (!rows.length) continue
    const live = careers.filter((c) => c.endingWeek === null || c.endingWeek > (k + 1) * WEEKS_PER_YEAR).length
    const wins = rows.reduce((s, r) => s + r.wins, 0)
    const losses = rows.reduce((s, r) => s + r.losses, 0)
    const pz = rows.filter((r) => (r.spentToDateCents ?? 0) > 0)
    const ratio = pz.length
      ? median(pz.map((r) => (r.prizeToDateCents as number) / (r.spentToDateCents as number)))
      : 0
    const rungIdx = rows.map((r) => (r.topRungToDate ? TIER_LADDER.indexOf(r.topRungToDate) : -1))
    const wta = rows
      .map((r) => r.kidRankWta)
      .filter((x): x is number => x !== null && x !== undefined && x > 0)
    out.push(
      '  ' +
        padE('s' + k, 8) +
        pad(`${live}/${seeds}`, w[0]) +
        pad(r1(median(rows.map((r) => r.matches))), w[1]) +
        pad(`${Math.round(median(rows.map((r) => r.wins)))}-${Math.round(median(rows.map((r) => r.losses)))}`, w[2]) +
        pad(r1(median(rows.map((r) => r.entriesTrue ?? 0))), w[3]) +
        pad(wins + losses ? ((wins / (wins + losses)) * 100).toFixed(0) + '%' : '–', w[4]) +
        pad(r1(median(rows.map((r) => r.meanCondition ?? 0))), w[5]) +
        pad(fmt$(median(rows.map((r) => r.spentCents ?? 0))), w[6]) +
        pad(fmt$(median(rows.map((r) => r.earnedCents ?? 0))), w[7]) +
        pad(fmt$(median(rows.map((r) => r.endFundsCents))), w[8]) +
        pad((ratio * 100).toFixed(1) + '%', w[9]) +
        pad(TIER_LADDER[Math.round(median(rungIdx))] ?? '–', w[10]) +
        pad(rows[0].coachTierNow ?? '–', w[11]) +
        pad(wta.length ? '#' + Math.round(median(wta)) : '–', w[12]),
    )
  }
  // The tier mix, summed across seeds and normalised per career – "what did she actually play".
  out.push('')
  out.push('  TIER MIX, entries per career per season:')
  out.push('  ' + padE('season', 8) + TIER_LADDER.slice(0, 13).map((t) => pad(t, 8)).join(''))
  for (let k = 0; k < seasons; k++) {
    const rows = careers.map((c) => c.seasons[k]).filter((r): r is SeasonRow => r !== undefined)
    if (!rows.length) continue
    out.push(
      '  ' +
        padE('s' + k, 8) +
        TIER_LADDER.slice(0, 13)
          .map((t) => {
            const v = mean(rows.map((r) => r.entriesByTier?.[t] ?? 0))
            return pad(v === 0 ? '·' : v.toFixed(1), 8)
          })
          .join(''),
    )
  }
  // And the verdict, so the deep read carries its own envelope answer.
  const axes = foldAxes(careers)
  const { hits, misses } = insideCount(axes, env)
  out.push('')
  out.push(`  ENVELOPE: ${hits.length}/${AXES.length} inside` + (misses.length ? ` · outside: ${misses.join(', ')}` : ' · FULLY INSIDE'))
  out.push(axesHeader())
  out.push(axesRow(cell.preset.label + ' · ' + cell.arm.label, axes))
  const ends = new Map<string, number>()
  for (const c of careers) if (c.ending) ends.set(c.ending, (ends.get(c.ending) ?? 0) + 1)
  out.push(
    `  endings: ${[...ends].map(([k, n]) => `${k} ${n}/${seeds}`).join(' · ') || 'none'}` +
      ` · ever red at a wrap: ${careers.filter((c) => c.seasons.some((r) => r.endFundsCents < 0)).length}/${seeds}`,
  )
  return out
}

/** ⚠ THE RESERVE SWEEP, AND IT EXISTS BECAUSE HIS OWN SAVE FALSIFIES THE INHERITED NUMBER.
 *
 *  `POLICIES[1]` keeps a $5,000 reserve and refuses any trip that would break it. The owner's save
 *  wraps season 1 on **$4,055** and then enters fifteen events in season 2 – so whatever reserve he
 *  was keeping, it did not lock him out at four thousand dollars. A $5,000 floor is not a
 *  conservative assumption about him; it is contradicted by what he did.
 *
 *  This is a SWEEP rather than a new number, because picking the value that makes the arm survive is
 *  the trap. The sweep reports the whole curve and the saves bound it from above: any reserve at or
 *  above ~$4,000 is inconsistent with his season 2. Where the lock-out appears in that range is the
 *  measurement. */
function reserveSweep(cell: { preset: Preset; arm: Arm }, seeds: number, seasons: number, reserves: number[], env: Envelope): string[] {
  const out: string[] = ['', '  RESERVE SWEEP on the derived arm – his save bounds this from above at ~$4,000', '']
  out.push(
    '  ' +
      padE('reserve', 12) +
      [['entries/yr', 12], ['first DEAD season', 19], ['matches/yr', 12], ['prize/spend', 12], ['topRung', 9], ['bankrupt', 10], ['inside', 8]]
        .map(([h, w]) => pad(h as string, w as number))
        .join(''),
  )
  for (const reserveCents of reserves) {
    const arm: Arm = { ...cell.arm, policy: { ...cell.arm.policy, reserveCents } }
    const careers: Career[] = []
    for (let i = 0; i < seeds; i++) careers.push(runBenchCareer(cell.preset, i, seasons, arm))
    // A DEAD season is one she entered nothing at all in – not bankruptcy, not retirement: a
    // calendar she is locked out of while the coach is still billed. It is the failure this sweep
    // was written to find and it has no name anywhere else in the bench.
    const deadFrom = careers.map((c) => {
      const k = c.seasons.findIndex((r) => (r.entriesTrue ?? 0) === 0)
      return k < 0 ? Infinity : k
    })
    const everDead = deadFrom.filter((k) => k !== Infinity)
    const axes = foldAxes(careers)
    const { hits } = insideCount(axes, env)
    out.push(
      '  ' +
        padE(fmt$(reserveCents), 12) +
        pad(r1(axes.entries ?? 0), 12) +
        pad(everDead.length ? `s${median(everDead).toFixed(1)} (${everDead.length}/${seeds})` : 'never', 19) +
        pad(r1(axes.matches), 12) +
        pad((axes.prizeOverSpend * 100).toFixed(1) + '%', 12) +
        pad(axes.topRung < 0 ? '–' : (TIER_LADDER[Math.round(axes.topRung)] ?? '–'), 9) +
        pad(`${careers.filter((c) => c.ending === 'bankruptcy').length}/${seeds}`, 10) +
        pad(`${hits.length}/${AXES.length}`, 8),
    )
  }
  return out
}

// --- the estimator's receipt -------------------------------------------------

/** `entries = losses + titles` is an identity only if every entry is played out. It is used on the
 *  human side because a save cannot report entries any other way, so its error is measured here
 *  against bench careers where BOTH numbers are known. A tool that asserts its own estimator is not
 *  a measurement. */
function verifyEstimator(seeds: number, seasons: number, arms: Arm[]): string[] {
  const out: string[] = ['', '  ESTIMATOR CHECK: entries = losses + titles, against true bench entries', '']
  let rows = 0
  let exact = 0
  let sumAbs = 0
  let sumTrue = 0
  for (const preset of PRESETS) {
    for (const arm of arms) {
      for (let i = 0; i < seeds; i++) {
        for (const r of runBenchCareer(preset, i, seasons, arm).seasons) {
          if (r.entriesTrue === null || r.entriesEst === null) continue
          rows++
          sumTrue += r.entriesTrue
          const err = r.entriesEst - r.entriesTrue
          if (err === 0) exact++
          sumAbs += Math.abs(err)
        }
      }
    }
  }
  out.push(
    `  ${rows} season rows · exact ${exact}/${rows} = ${((exact / Math.max(1, rows)) * 100).toFixed(1)}%` +
      ` · mean |error| ${(sumAbs / Math.max(1, rows)).toFixed(2)} entries` +
      ` on a mean of ${(sumTrue / Math.max(1, rows)).toFixed(1)} true entries/season`,
  )
  out.push('')
  return out
}

// --- main --------------------------------------------------------------------

function argOf(flag: string, fallback: number): number {
  const i = process.argv.indexOf(flag)
  return i >= 0 && process.argv[i + 1] ? Number(process.argv[i + 1]) : fallback
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2)
  console.log(`RUN real-vs-bench · ${process.cwd()}`)
  // The coach's voice, if this tree has one. See the LadderNote note above.
  try {
    const mod = (await import('../src/engine/world')) as unknown as Record<string, unknown>
    if (typeof mod.coachLadderNote === 'function') COACH_NOTE = mod.coachLadderNote as LadderNote
  } catch {
    COACH_NOTE = null
  }
  console.log(
    `  coach's scheduling voice on this tree: ${COACH_NOTE ? 'present' : 'ABSENT (pre-ladder-wave) – the coachvoice bracket will read as a no-op'}`,
  )

  const savePaths: string[] = []
  for (let i = 0; i < argv.length; i++) if (argv[i] === '--save' && argv[i + 1]) savePaths.push(argv[i + 1])
  const seeds = argOf('--seeds', 10)
  const arms = armsFor()

  if (savePaths.length === 0) {
    console.log('  no --save given: nothing to compare the bench against. Pass one or more .tsave paths.')
    return
  }

  // --- 1. the human -----------------------------------------------------------
  const humans: Career[] = []
  for (const p of savePaths) humans.push(await readHumanCareer(p))

  console.log('')
  console.log('══ 1. THE HUMAN ══')
  for (const h of humans) {
    console.log('')
    console.log(
      `  ${h.label} · ${h.background} · coach ${h.startCoachTier} → ${h.endCoachTier}` +
        ` · plan ${h.plan.train}/${h.plan.rest} · ${h.seasons.length} banked seasons of ${Math.floor(h.weeks / 52)}`,
    )
    console.log(
      `    career: earned ${fmt$(h.earnedCents)} · spent ${fmt$(h.spentCents)} · prize ${fmt$(h.prizeCents)}` +
        ` = ${((h.prizeCents / h.spentCents) * 100).toFixed(1)}% of spend · funds now ${fmt$(h.endFundsCents)}`,
    )
    console.log(
      `    coach arc: ${h.coachArc.length ? h.coachArc.map((c) => `w${c.week}:${c.tier}`).join(' → ') : '(none recorded)'}`,
    )
    console.log(
      `    academy ${h.academy ? 'yes (' + fmt$(h.academyCoveredCents) + ' covered)' : 'no'}` +
        ` · kit offers signed ${h.offers.signed} refused ${h.offers.refused} expired ${h.offers.expired}` +
        ` · vacations ${h.vacations} · weeks lost to injury ${h.weeksLostToInjury}`,
    )
    console.log(
      '    ' +
        padE('season', 8) +
        ['rank', 'pts', 'W', 'L', 'matches', 'titles', 'entries', 'spend', 'earned', 'net', 'endFunds'].map((x, i) =>
          pad(x, [6, 6, 5, 5, 9, 8, 9, 11, 11, 11, 11][i]),
        ).join(''),
    )
    for (const r of h.seasons) {
      console.log(
        '    ' +
          padE('s' + r.seasonIndex, 8) +
          pad('#' + r.endRank, 6) +
          pad(String(r.points), 6) +
          pad(String(r.wins), 5) +
          pad(String(r.losses), 5) +
          pad(String(r.matches), 9) +
          pad(r.titles === null ? '–' : String(r.titles), 8) +
          pad(r.entriesEst === null ? '–' : String(r.entriesEst), 9) +
          pad(r.spentCents === null ? '–' : fmt$(r.spentCents), 11) +
          pad(r.earnedCents === null ? '–' : fmt$(r.earnedCents), 11) +
          pad(fmt$(r.fundsDeltaCents), 11) +
          pad(fmt$(r.endFundsCents), 11),
      )
    }
  }

  const env = envelopeOf(humans)
  console.log('')
  console.log('  THE ENVELOPE (per-season min–max across the human careers):')
  console.log(`    matches/season   ${env.matches.lo}–${env.matches.hi}`)
  console.log(`    entries/season   ${env.entries.lo}–${env.entries.hi}   (seasons the trophy ledger covers)`)
  console.log(`    win rate         ${(env.winRate.lo * 100).toFixed(0)}%–${(env.winRate.hi * 100).toFixed(0)}%`)
  console.log(`    spend/season     ${fmt$(env.spend.lo)}–${fmt$(env.spend.hi)}`)
  console.log(`    earned/season    ${fmt$(env.earned.lo)}–${fmt$(env.earned.hi)}`)
  console.log(`    net/season       ${fmt$(env.net.lo)}–${fmt$(env.net.hi)}`)
  console.log(`    spend/match      ${fmt$(env.spendPerMatch.lo)}–${fmt$(env.spendPerMatch.hi)}`)
  console.log(
    `    prize/spend      ${(env.prizeOverSpend.lo * 100).toFixed(1)}%–${(env.prizeOverSpend.hi * 100).toFixed(1)}%`,
  )
  console.log(
    `    top rung played  ${TIER_LADDER[env.topRung.lo] ?? '–'}–${TIER_LADDER[env.topRung.hi] ?? '–'}` +
      `   (index ${env.topRung.lo}–${env.topRung.hi} of ${TIER_LADDER.length - 1})`,
  )

  // --- 2. the bench, on the same axes and the same season count ---------------
  const seasons = Math.max(...humans.map((h) => h.seasons.length))
  console.log('')
  console.log(`══ 2. THE BENCH, same axes, ${seasons} seasons, ${seeds} seeds/cell ══`)
  console.log('')
  console.log(axesHeader())
  const humanAxes = foldAxes(humans)
  console.log(axesRow('HUMAN (' + humans.length + ' careers)', humanAxes))
  console.log('  ' + '─'.repeat(120))

  const plan: { preset: Preset; arm: Arm }[] = []
  for (const preset of PRESETS) for (const arm of arms) plan.push({ preset, arm })
  if (argv.includes('--human')) plan.push(...humanCells())
  if (argv.includes('--adapt')) {
    plan.push(ownerCell(adaptArm()))
    for (const b of bracketArms()) plan.push(ownerCell(b))
  }

  const cells: { label: string; axes: Axes; careers: Career[] }[] = []
  for (const { preset, arm } of plan) {
    const careers: Career[] = []
    for (let i = 0; i < seeds; i++) careers.push(runBenchCareer(preset, i, seasons, arm))
    const axes = foldAxes(careers)
    const label = `${preset.label} · ${arm.label}`
    cells.push({ label, axes, careers })
    console.log(axesRow(label, axes))
    // The climb is the whole point of the human arm, so it is reported rather than assumed: the
    // median week each rung was reached, across the cell's seeds.
    if (arm.coachLadder) {
      const at = arm.coachLadder.ladder.map((tier, i) => {
        const weeks = careers.map((c) => c.coachArc[i]?.week).filter((w): w is number => w !== undefined)
        return `${tier} ${weeks.length ? 'w' + Math.round(median(weeks)) + ` (${weeks.length}/${careers.length})` : 'never'}`
      })
      console.log(`  ${padE('', 38)}climb: ${at.join('  ·  ')}`)
    }
  }

  // --- 2b. the support lines --------------------------------------------------
  console.log('')
  console.log('  SUPPORT – academy, sponsorship and the holiday that stops the retainer:')
  console.log('')
  console.log(supportHeader())
  console.log(supportRow('HUMAN (' + humans.length + ' careers)', humanAxes))
  console.log('  ' + '─'.repeat(94))
  for (const c of cells) console.log(supportRow(c.label, c.axes))

  // --- 3. the envelope verdict ------------------------------------------------
  console.log('')
  console.log('══ 3. IS ANY CELL INSIDE THE HUMAN ENVELOPE? ══')
  console.log('')
  let best = { label: '', hits: 0 }
  const n = AXES.length
  for (const c of cells) {
    const { hits, misses } = insideCount(c.axes, env)
    if (hits.length > best.hits) best = { label: c.label, hits: hits.length }
    console.log(
      `  ${padE(c.label, 38)} ${pad(hits.length + '/' + n, 6)} inside` +
        (misses.length ? `   outside: ${misses.join(', ')}` : '   ** FULLY INSIDE **'),
    )
  }
  console.log('')
  console.log(`  best cell: ${best.label} at ${best.hits}/${n} axes inside the human envelope.`)
  const fully = cells.filter((c) => insideCount(c.axes, env).misses.length === 0)
  console.log(`  cells fully inside: ${fully.length ? fully.map((c) => c.label).join(', ') : 'NONE'}`)

  // --- 3b. the deep read on his own cell --------------------------------------
  if (argv.includes('--deep')) {
    console.log('')
    console.log('══ 3b. THE DERIVED ARM, SEASON BY SEASON, ON HIS OWN CELL ══')
    for (const arm of [humanArm(), adaptArm(), ...bracketArms()]) {
      for (const line of deepReport(ownerCell(arm), seeds, seasons, env)) console.log(line)
    }
    for (const line of reserveSweep(ownerCell(adaptArm()), seeds, seasons, [0, 1_000_00, 2_000_00, 3_000_00, 4_000_00, 5_000_00], env))
      console.log(line)
  }

  // --- 4. the 25k middle-coach claim ------------------------------------------
  if (argv.includes('--cell')) {
    console.log('')
    console.log('══ 4. THE 25k MIDDLE-COACH CELL ══')
    for (const line of cellReport(seeds, seasons, arms)) console.log(line)
  }

  if (argv.includes('--verify')) {
    for (const line of verifyEstimator(Math.min(seeds, 5), seasons, arms)) console.log(line)
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})

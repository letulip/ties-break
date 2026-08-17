// ⭐ THE EMPTY-WEEK CENSUS – how many weeks of a career have no tennis on them at all.
//
//   npx vite-node tools/empty-week-census.ts [--seeds N] [--policy 1] [--from-age 14] [--to-age 26]
//
// THE OWNER'S QUESTION, 16.08, and it OVERRULES the acceptance test it replaces: «вообще не страшно,
// если иногда в сетке есть пустые недели, не вижу ничего плохого. Так что просто надо понять сколько
// пустых недель у нас есть вообще и оттуда отталкиваясь делать логику. До этого я играл – всё было
// нормально с календарем, меня более чем устраивало. Если сейчас так же – то это ок.»
//
// So the deliverable is a NUMBER and a COMPARISON, not a pass/fail. This tool exits 0 always; the
// verdict is the diff against the build he played (`6c7507b`), run in a worktree.
//
// ⚠⚠ WHY `tools/boredom-guard.ts` CANNOT ANSWER IT, stated here because the two look like the same
// tool and are not. The boredom guard inspects ONLY weeks where a W entry was REFUSED BY THE AER CAP
// – it starts from `entryStatus(...).reason === 'capped'` on the pro arm and asks what else that week
// offered. Measured on the tree of 16.08, 12 careers x 260 weeks = 3,120 lived: **674 such weeks, 88
// of them with no alternative** before the acceptance inversions were fixed, **354 and 29** after. A
// week that is simply EMPTY – nothing refused because nothing was scheduled, or everything on it
// locked on rank – is INVISIBLE to it at either figure, because no refusal ever put the week on its
// list. The guard answers "does the cap strand her?"; this answers "how much of the calendar is
// blank?", and this census puts the second number at ~5 weeks a season on the same tree.
//
// THE THREE CLASSES, and the third is the whole reason the number means anything:
//
//   * PLAYABLE  – at least one scheduled event she could have entered, asked of the ENGINE's own gate
//                 (`entryStatus` level 'ok' or 'caution' – a fatigue caution is a playable week by the
//                 owner's own rule) at the LAST DECISION MOMENT for that event, its deadline week.
//                 An event she actually holds an entry for counts too, whatever the gate says today:
//                 the entry is honoured (`entryStatus` governs entering, not an entry already made).
//   * EMPTY     – a non-blackout week with no enterable event at all.
//   * BLACKOUT  – off-season, school exams, a booked family week, an injury layoff. ⚠ THESE ARE NOT
//                 EMPTY WEEKS. They are the calendar working: the tour is shut, or she is at her
//                 desk, or away with her family, or hurt. Counting them as "empty" would put ~7 weeks
//                 a season of deliberate design into a number the owner is reading as a defect, and
//                 the figure would be meaningless. They are reported separately and are OUT of the
//                 share's denominator.
//
// ⚠ AND THE POLICY IS NOT THE CALENDAR. The career is DRIVEN by `POLICIES[1]` (the player arm) so the
// world evolves the way a played career does – her rank, her money, her fatigue, her bookings all
// come from a plausible parent. But the CLASSIFICATION never asks the policy anything: a week the
// player arm declined to enter (too dear, too tired, a rung she has outgrown) is PLAYABLE, because
// tennis was there and she chose otherwise. Reading the policy's own refusals as empty weeks would
// measure the bench's opinions and call them the game's calendar.
//
// ⚠ THE READ IS AT THE DEADLINE, WHICH IS `tools/boredom-guard.ts`'s idiom and is deliberate. Entry
// lists close before the week is played, so "could she have entered" is a question about the moment
// the decision was live, with the AER allowance, her rank and her ranking book as they stood then.
// Each event is scored EXACTLY ONCE, the first week its deadline is not in the future, and the scan
// is by event id rather than by week so a season chunk appended later cannot be missed.
//
// ⚠ AN ENDED CAREER IS NOT A CALENDAR FACT. Bankruptcy and the career-ending injury latch an
// `ending`, after which `stepCareerWeek` enters nothing by construction; those weeks are counted in
// their own column and excluded from every share. The fork at nineteen is never answered (the
// baseline tool's own property, kept so the two tables describe the same careers).

// ⭐⭐ ROUND-21 #2 ADDED TWO SECTIONS, AND BOTH ARE HERE BECAUSE THEY RIDE THE SAME WALK.
//
// (a) RUN LENGTHS. «Снова какая-то чехарда в календаре бывает по 3-5 недель пустота. Собери мне
//     пожалуйста такую сетку, чтобы хотя бы 1 раз в 2 недели был какой-то турнир.» The census as it
//     shipped reports a RATE – 12.6% of non-blackout weeks, ~5 a season – and the rate is not what
//     he is describing. Five empty weeks spread one at a time through a season is a calendar nobody
//     notices; the same five in a row is the complaint. A rate cannot tell those apart, so it could
//     not have answered him and did not. His rule is a RUN-LENGTH rule ("a tournament at least every
//     second week" = no run longer than 1), so the run length is what the tool now prints.
//
//     ⚠ TWO HISTOGRAMS, BECAUSE A BLACKOUT IS AND IS NOT A GAP. The 16.08 ruling above stands: an
//     off-season or an exam block is the calendar working, not a defect. But a parent looking at the
//     screen in week 30 does not see a taxonomy, he sees nothing happening. So:
//       * EMPTY RUNS – consecutive EMPTY weeks, closed by a playable week AND by any blackout. This
//         is the actionable number: weeks the calendar could have filled and did not, back to back.
//         The owner's rule is stated against THIS one.
//       * FELT RUNS – the same, but the in-season blackouts (exams, a booked family week, an injury
//         layoff) count INSIDE the run instead of closing it. Only the off-season closes it, because
//         the tour being shut is the one gap he already knows about and has never complained of.
//         This is the honest upper bound on "3-5 weeks of nothing" as he experiences it.
//
// (b) HEADER vs FEED, which is the half that smells like a defect: «Я вижу, что их много есть на
//     странице сезона сверху, но в ленте почему-то их не вижу», against a header reading `9 left to
//     enter over 10 weeks`. Two surfaces on ONE screen count two different sets, and until this
//     section existed nobody could say which set was the honest one. Both predicates are re-derived
//     here from the SAME engine calls the two surfaces make – `seasonSupply`'s loop and
//     `feedContext`/`feedShows` – rather than re-implemented, so a divergence found here is a
//     divergence the owner's screen has.
//
//     ⚠ AND IT IS BUILT FROM `world` DIRECTLY RATHER THAN FROM `toSnapshot`. The snapshot is the
//     honest source and would be the obvious choice, but it costs 11-15 ms and this walk asks the
//     question ~12,000 times; `upcomingEvents` alone rebuilds the full ranking and a match preview
//     per card. Every input the two predicates actually read (`tierOpenFor`, `hasOutgrown`,
//     `activeLadderOf`, `kidAgeAt`, `entryStatus`) is exported and is what the snapshot itself
//     calls, so this is the same arithmetic without the previews neither predicate looks at.

import {
  entryStatus,
  isBlackoutWeek,
  schoolIsOver,
  layoffCovering,
  vacationForWeek,
  kidAgeAt,
} from '../src/engine/world'
import { isOffSeasonWeek, WEEKS_PER_YEAR, TIER_LADDER, tierAgeBlock } from '../src/engine/season/calendar'
import { activeLadderOf, tierOpenFor, hasOutgrown } from '../src/engine/world/ladder'
import { UPCOMING_WEEKS } from '../src/engine/world/constants'
import { seasonLastWeek } from '../src/engine/offers'
import { feedContext, feedShows } from '../src/composables/tierState'
import type { TierId } from '../src/engine/season/types'
import { openCareer, stepCareerWeek, POLICIES, PRESETS } from './econ-bench'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] !== undefined ? Number(args[i + 1]) : fallback
}

/** careers per preset – 2 x 9 presets = 18 careers, comfortably over the brief's n >= 12. */
const SEEDS = argOf('seeds', 2)
const POLICY = POLICIES[argOf('policy', 1)] ?? POLICIES[1]
const FROM_AGE = argOf('from-age', 14)
const TO_AGE = argOf('to-age', 26)

/** ⚠ THE AGE AXIS IS HERS, NOT THE WEEK COUNTER'S. A career opens at 14.0 and the brief asks for 14
 *  to 26, so the horizon is the last week she is still 26 – computed off `kidAgeAt` rather than
 *  assumed to be 13 x 52, because the birth month puts her birthday inside the season year. */
const WEEKS = (TO_AGE - FROM_AGE + 1) * WEEKS_PER_YEAR

interface AgeCell {
  playable: number
  empty: number
  blackout: number
  ended: number
}
const zeroCell = (): AgeCell => ({ playable: 0, empty: 0, blackout: 0, ended: 0 })

const byAge = new Map<number, AgeCell>()
const total = zeroCell()
/** why an empty week was empty – the classifier, so a share can be read as a cause rather than a mood */
const emptyReasons = new Map<string, number>()
/** blackout weeks by their own kind, so "the calendar working" is itself legible */
const blackoutKinds = new Map<string, number>()
let careersEnded = 0
/** ⚠ THE ONE PLACE THE POLICY COULD HIDE THE ANSWER, so it is measured rather than trusted. A booked
 *  family week is a blackout by the brief's own list – but it is the only blackout the BENCH books
 *  rather than the calendar, and `planRecoveryWeek` books it when she is run down, which correlates
 *  with a thin stretch of season. If a rescue week happens to land on a week that had nothing on it
 *  anyway, the census would count a blackout where an empty week lived. These two counters give the
 *  UPPER BOUND: fold every booked family week back into the denominator and the ones that were blank
 *  anyway back into the numerator. */
let vacationWeeks = 0
let vacationWeeksBlank = 0

const bump = (m: Map<string, number>, k: string): void => {
  m.set(k, (m.get(k) ?? 0) + 1)
}

// --- (a) RUN LENGTHS -----------------------------------------------------------------------------
/** run length -> how many runs of that length occurred, for each of the two readings. */
const emptyRuns = new Map<number, number>()
const feltRuns = new Map<number, number>()
const bumpN = (m: Map<number, number>, k: number): void => {
  m.set(k, (m.get(k) ?? 0) + 1)
}

// --- (b) HEADER vs FEED --------------------------------------------------------------------------
/** weeks on which the season header counted at least one enterable event. */
let hdrWeeks = 0
/** ...of those, the weeks the FEED drew no tournament card at all – the owner's exact screen. */
let hdrWeeksFeedBlank = 0
/** every (week, event) the header counted, and how many of them the feed also drew. */
let hdrEvents = 0
let hdrEventsShown = 0
/** why a counted event never reached the feed. */
const hiddenWhy = new Map<string, number>()
/** ...and by rung, because the owner's own screenshot names the rungs. */
const hiddenByTier = new Map<string, number>()
/** the mirror: events the FEED drew that the header refuses to count (she cannot enter them). */
let feedEventsUncounted = 0
let feedEvents = 0
/** cards the rung/horizon rules admitted and the ROW COLLAPSE then threw away – the fall-through. */
let bookingSwallowed = 0

// --- (c) THE THIRD CLASS, AND IT IS THE ONE THAT MATCHES WHAT HE IS LOOKING AT ------------------
// ⚠⚠ THE CENSUS CLASSIFIES THE WORLD; THE OWNER READS A SCREEN. A week can be PLAYABLE by every
// test above – an event on it, the gate saying yes at the deadline – and still have been invisible
// to him for the entire time it was enterable, because the feed never drew a card for it. From his
// seat that week is empty, and no amount of adding tournaments to the calendar would fill it.
//
// So each week is asked a third question: while it was still in the future, did the feed EVER show
// him anything on it? `SEEN` = at least once. This is the axis his «по 3-5 недель пустота» lives
// on, and it is the only one of the three that can be longer than the EMPTY runs rather than a
// subset of them.
let seenWeeks = 0
let unseenPlayable = 0
const unseenRuns = new Map<number, number>()
/** ...and the same three, measured against a feed where a booked week no longer swallows its
 *  tournament card. The CANDIDATE, measured on the same careers in the same walk. */
let seenWeeksFix = 0
let unseenPlayableFix = 0
const unseenRunsFix = new Map<number, number>()

/** THE SEASON HEADER'S OWN PREDICATE, lifted verbatim from `seasonSupply` in engine/world/snapshot.ts
 *  – rest of the season, an entry already made counts whatever the gate says, otherwise the deadline
 *  must still be open and `entryStatus` must not be 'blocked'. NO TIER FILTER: the header counts
 *  every rung, which is the `+4 lower` tail on the owner's screenshot. */
function headerCounts(world: ReturnType<typeof openCareer>['world']): { id: string; week: number; tier: TierId }[] {
  const entered = new Set(world.entries)
  const lastWeek = seasonLastWeek(world.week)
  const out: { id: string; week: number; tier: TierId }[] = []
  for (const e of world.season) {
    if (e.week <= world.week || e.week > lastWeek) continue
    if (!entered.has(e.id)) {
      if (world.week > e.deadlineWeek) continue
      if (entryStatus(world, e).level === 'blocked') continue
    }
    out.push({ id: e.id, week: e.week, tier: e.tier })
  }
  return out
}

/** THE FEED'S OWN PREDICATE, through the real `feedContext`/`feedShows` the screen calls, over the
 *  real `UPCOMING_WEEKS` horizon the snapshot clips to. `entered`/`eligible` are filled from the same
 *  gate the snapshot fills them from. */
function feedDraws(world: ReturnType<typeof openCareer>['world']): { id: string; week: number; tier: TierId }[] {
  const entered = new Set(world.entries)
  const facts = world.season
    .filter((e) => e.week > world.week && e.week <= world.week + UPCOMING_WEEKS)
    .map((e) => ({
      id: e.id,
      week: e.week,
      tier: e.tier,
      entered: entered.has(e.id),
      eligible: entryStatus(world, e).level !== 'blocked',
    }))
  const ctx = feedContext({
    ageYears: kidAgeAt(world, world.week),
    tierOpen: Object.fromEntries(TIER_LADDER.map((t) => [t, tierOpenFor(world, t)])),
    tierOutgrown: Object.fromEntries(TIER_LADDER.map((t) => [t, hasOutgrown(world, t)])),
    // ⚠ THE ROUND-21 #5 TABLE FILTER IS PASSED. `tools/feed-audit.ts` omits it, and
    // `paysIntoHerTables` returns its input untouched when `active` is falsy – so that tool reports
    // cards as SHOWN which the live screen hides, understating exactly this gap. Not repeated here.
    activeLadder: activeLadderOf(world),
    upcoming: facts,
  })
  // ⚠ RETURNED IN TWO HALVES SO ONE WALK MEASURES THE BEFORE AND THE CANDIDATE FIX. `admitted` is
  // what the feed's own rung and horizon rules let through; `drawn` is what survives the row
  // collapse below. Their difference is the whole cost of the booking fall-through, so the "after"
  // column of the spec is a MEASUREMENT of the candidate rather than a prediction about it.
  const admitted = facts.filter((e) => feedShows(e, ctx))
  // ⚠⚠ AND THEN THE ROW COLLAPSE, WHICH IS THE HALF A PURE `feedShows` READ WOULD MISS ENTIRELY.
  // `calendarRows` in SeasonScreen.vue draws ONE row per week and decides its kind in this order:
  //
  //     vacation ? 'vacation' : practice ? 'practice' : e ? 'event' : exam : off-season : training
  //
  // ...and the template draws a tournament card only on `kind === 'event'`. So a week the parent has
  // booked - a family week, or a PRACTICE - renders as that booking and the tournament on it is not
  // drawn at all, however enterable it is and however loudly the header above counts it. The event
  // is still on the row object; nothing on screen shows it. That is not a filter anybody wrote as a
  // rule about tournaments, it is a fall-through, and modelling it here is the difference between a
  // tool that reproduces the owner's screen and one that reproduces an idealised version of it.
  return {
    admitted,
    drawn: admitted.filter(
      (e) => vacationForWeek(world, e.week) === undefined && !world.practices.some((p) => p.week === e.week),
    ),
  }
}

let careers = 0
for (let s = 0; s < SEEDS; s++) {
  for (let p = 0; p < PRESETS.length; p++) {
    const { world, rng } = openCareer(PRESETS[p], s, POLICY)
    careers++
    /** target week -> was ANY event on it enterable when its entry list closed */
    const playableFor = new Map<number, boolean>()
    /** target week -> the refusal reasons of the events that were on it, for the classifier */
    const refusalsFor = new Map<number, string[]>()
    const scored = new Set<string>()
    /** target week -> did the feed EVER draw a card for it while it was still ahead of her. */
    const everSeen = new Set<number>()
    /** ...and the same under the candidate, where a booking no longer swallows the card. */
    const everSeenFix = new Set<number>()
    /** the open runs, closed and filed below. */
    let emptyRun = 0
    let feltRun = 0
    let unseenRun = 0
    let unseenRunFix = 0
    const closeUnseen = (): void => {
      if (unseenRun > 0) bumpN(unseenRuns, unseenRun)
      unseenRun = 0
      if (unseenRunFix > 0) bumpN(unseenRunsFix, unseenRunFix)
      unseenRunFix = 0
    }
    const closeEmpty = (): void => {
      if (emptyRun > 0) bumpN(emptyRuns, emptyRun)
      emptyRun = 0
    }
    const closeFelt = (): void => {
      if (feltRun > 0) bumpN(feltRuns, feltRun)
      feltRun = 0
    }

    for (let i = 0; i < WEEKS; i++) {
      // --- score every event whose entry list has now closed, exactly once ------------------------
      for (const e of world.season) {
        if (scored.has(e.id) || e.deadlineWeek > world.week) continue
        scored.add(e.id)
        const st = entryStatus(world, e)
        const held = world.entries.includes(e.id)
        const ok = held || st.level === 'ok' || st.level === 'caution'
        playableFor.set(e.week, (playableFor.get(e.week) ?? false) || ok)
        const rs = refusalsFor.get(e.week) ?? []
        rs.push(ok ? 'ok' : (st.reason ?? 'blocked'))
        refusalsFor.set(e.week, rs)
      }

      // --- classify the week she is living through -----------------------------------------------
      const week = world.week
      const age = kidAgeAt(world, week)
      const cell = byAge.get(age) ?? zeroCell()
      byAge.set(age, cell)
      const schoolOver = schoolIsOver(week, world.profile.birthMonth)
      if (world.ending !== null) {
        cell.ended++
        total.ended++
        // An ended career is not a calendar fact (see the header), so it closes both runs rather
        // than extending either: counting the rest of a bankrupt career as one 300-week drought
        // would swamp the histogram with a number that is not about the calendar at all.
        closeEmpty()
        closeFelt()
      } else if (isBlackoutWeek(week, schoolOver)) {
        cell.blackout++
        total.blackout++
        const offSeason = isOffSeasonWeek(week)
        bump(blackoutKinds, offSeason ? 'off-season' : 'school exams')
        closeEmpty()
        // The off-season is the one gap he already knows about and has never complained of, so it
        // closes even the FELT run; exams are in-season and do not.
        if (offSeason) closeFelt()
        else feltRun++
      } else if (vacationForWeek(world, week) !== undefined) {
        cell.blackout++
        total.blackout++
        bump(blackoutKinds, 'booked family week')
        vacationWeeks++
        if (playableFor.get(week) !== true) vacationWeeksBlank++
        closeEmpty()
        feltRun++
      } else if (layoffCovering(world, week) !== null) {
        cell.blackout++
        total.blackout++
        bump(blackoutKinds, 'injury layoff')
        closeEmpty()
        feltRun++
      } else if (playableFor.get(week) === true) {
        cell.playable++
        total.playable++
        // Tennis she could have entered is the only thing that closes both. Whether the POLICY chose
        // to enter it is never asked – see the header: reading the bench's refusals as empty weeks
        // would measure the bench's opinions and call them the game's calendar.
        closeEmpty()
        closeFelt()
      } else {
        cell.empty++
        total.empty++
        const rs = refusalsFor.get(week)
        bump(emptyReasons, rs === undefined || rs.length === 0 ? 'no event scheduled at all' : [...new Set(rs)].sort().join('+'))
        emptyRun++
        feltRun++
      }

      // --- (c) the same week, asked of the SCREEN instead of the world ---------------------------
      // Mirrors the EMPTY axis exactly – same denominator, same closing rule – so the two histograms
      // are directly comparable and their DIFFERENCE is the feed's own contribution to the drought.
      // `everSeen` is complete for this week by construction: the feed's horizon is 8 weeks and it
      // was rendered on each of the 8 iterations before this one.
      const isBlackout =
        isBlackoutWeek(week, schoolOver) ||
        vacationForWeek(world, week) !== undefined ||
        layoffCovering(world, week) !== null
      // The two arms are independent – the candidate can show a week the shipped feed hid, so their
      // runs open and close on different weeks – and each is closed by its own membership test. Only
      // a blackout or an ending closes both at once, which is what keeps the two histograms
      // comparable with each other and with EMPTY RUNS.
      if (world.ending !== null || isBlackout) {
        closeUnseen()
      } else {
        const playable = playableFor.get(week) === true
        if (everSeen.has(week)) {
          seenWeeks++
          if (unseenRun > 0) bumpN(unseenRuns, unseenRun)
          unseenRun = 0
        } else {
          if (playable) unseenPlayable++
          unseenRun++
        }
        if (everSeenFix.has(week)) {
          seenWeeksFix++
          if (unseenRunFix > 0) bumpN(unseenRunsFix, unseenRunFix)
          unseenRunFix = 0
        } else {
          if (playable) unseenPlayableFix++
          unseenRunFix++
        }
      }

      // --- (b) what the header counts against what the feed draws, on the same week --------------
      // Asked on every LIVED week, blackout or not: the header and the feed are both on screen in an
      // off-season too, and a week she cannot play is exactly when a parent goes looking at the
      // season page. Skipped only after an ending, when there is no screen left to disagree on.
      if (world.ending === null) {
        const counted = headerCounts(world)
        const { admitted, drawn } = feedDraws(world)
        const drawnIds = new Set(drawn.map((e) => e.id))
        for (const e of drawn) everSeen.add(e.week)
        for (const e of admitted) everSeenFix.add(e.week)
        feedEvents += drawn.length
        bookingSwallowed += admitted.length - drawn.length
        for (const e of drawn) if (!counted.some((c) => c.id === e.id)) feedEventsUncounted++
        if (counted.length > 0) {
          hdrWeeks++
          hdrEvents += counted.length
          if (drawn.length === 0) hdrWeeksFeedBlank++
          for (const e of counted) {
            if (drawnIds.has(e.id)) {
              hdrEventsShown++
              continue
            }
            const beyond = e.week > world.week + UPCOMING_WEEKS
            // Re-derive the feed's rung window once per miss rather than caching it: `feedDraws`
            // already built it, and asking whether the rung is in `drawn` would answer a different
            // question on a week where the rung IS open but every event on it is out of horizon.
            const rungShown = drawn.some((d) => d.tier === e.tier)
            bump(
              hiddenWhy,
              beyond && !rungShown
                ? 'beyond the 8-week feed horizon AND on a rung the feed hides'
                : beyond
                  ? 'beyond the 8-week feed horizon'
                  : 'inside the horizon, on a rung the feed hides',
            )
            if (!beyond) bump(hiddenByTier, e.tier)
          }
        }
      }

      stepCareerWeek(world, rng, POLICY)
    }
    // A career that reaches the horizon mid-drought still had that drought, so both runs are filed
    // rather than dropped – discarding them would bias the histogram against the long ones, which
    // are the only ones the owner is asking about.
    closeEmpty()
    closeFelt()
    closeUnseen()
    if (world.ending !== null) careersEnded++
    console.error(`  career ${careers}/${SEEDS * PRESETS.length} done`)
  }
}

const pct = (n: number, d: number): string => (d === 0 ? '   – ' : `${((100 * n) / d).toFixed(1)}%`)
const perSeason = (n: number, weeks: number): string =>
  weeks === 0 ? '  – ' : ((n * WEEKS_PER_YEAR) / weeks).toFixed(1)

console.log('')
console.log(`EMPTY-WEEK CENSUS – ${careers} careers x ${WEEKS} weeks (ages ${FROM_AGE}-${TO_AGE}), policy "${POLICY.label}"`)
console.log(`  ${careersEnded} of ${careers} careers latched an ending inside the horizon`)
console.log('')
const lived = total.playable + total.empty + total.blackout + total.ended
const nonBlackout = total.playable + total.empty
console.log(`  weeks lived                     ${lived}`)
console.log(`  blackout (not empty – by design)${String(total.blackout).padStart(7)}   ${pct(total.blackout, lived)} of lived`)
console.log(`  after an ending (excluded)      ${String(total.ended).padStart(7)}   ${pct(total.ended, lived)} of lived`)
console.log(`  NON-BLACKOUT weeks              ${String(nonBlackout).padStart(7)}   <- the denominator`)
console.log(`    playable                      ${String(total.playable).padStart(7)}   ${pct(total.playable, nonBlackout)}`)
console.log(`    EMPTY                         ${String(total.empty).padStart(7)}   ${pct(total.empty, nonBlackout)}   = ${perSeason(total.empty, nonBlackout + total.blackout)} weeks per 52-week season`)
console.log(
  `  UPPER BOUND – every booked family week folded back in (${vacationWeeks} weeks, ${vacationWeeksBlank} of them blank anyway):` +
    ` ${pct(total.empty + vacationWeeksBlank, nonBlackout + vacationWeeks)} of non-blackout,` +
    ` ${perSeason(total.empty + vacationWeeksBlank, nonBlackout + total.blackout)} per season`,
)
console.log('')
console.log('  BY AGE (share of that age\'s non-blackout weeks, and empty weeks per season lived at that age)')
console.log('    age   lived  blackout   playable     EMPTY   share   /season')
for (let age = FROM_AGE; age <= TO_AGE; age++) {
  const c = byAge.get(age) ?? zeroCell()
  const l = c.playable + c.empty + c.blackout + c.ended
  if (l === 0) continue
  const nb = c.playable + c.empty
  console.log(
    `    ${String(age).padStart(3)} ${String(l).padStart(7)} ${String(c.blackout).padStart(9)} ` +
      `${String(c.playable).padStart(10)} ${String(c.empty).padStart(9)} ${pct(c.empty, nb).padStart(7)} ` +
      `${perSeason(c.empty, nb + c.blackout).padStart(9)}`,
  )
}
console.log('')
console.log('  WHY THE EMPTY WEEKS WERE EMPTY (the events that WERE on the week, by refusal reason)')
for (const [reason, n] of [...emptyReasons].sort((a, b) => b[1] - a[1])) {
  console.log(`    ${String(n).padStart(6)}  ${pct(n, total.empty).padStart(6)}  ${reason}`)
}
console.log('')
console.log('  BLACKOUT WEEKS BY KIND (for completeness – none of these is an empty week)')
for (const [kind, n] of [...blackoutKinds].sort((a, b) => b[1] - a[1])) {
  console.log(`    ${String(n).padStart(6)}  ${pct(n, total.blackout).padStart(6)}  ${kind}`)
}

// =================================================================================================
// (a) RUN LENGTHS – the owner's rule is about CLUSTERING, and a rate cannot see it
// =================================================================================================
const runTable = (m: Map<number, number>, label: string, rule: string): void => {
  const runs = [...m].sort((a, b) => a[0] - b[0])
  const totalRuns = runs.reduce((s, [, n]) => s + n, 0)
  const weeksInRuns = runs.reduce((s, [len, n]) => s + len * n, 0)
  const breaches = runs.filter(([len]) => len > 1).reduce((s, [, n]) => s + n, 0)
  const worst = runs.length === 0 ? 0 : runs[runs.length - 1][0]
  console.log('')
  console.log(`  ${label}`)
  console.log(`    ${totalRuns} runs over ${careers} careers = ${(totalRuns / careers).toFixed(1)} per career,` +
    ` ${weeksInRuns} weeks in them, longest ${worst}`)
  console.log('    length   runs    share   per career   weeks in them')
  for (const [len, n] of runs) {
    console.log(
      `    ${String(len).padStart(6)} ${String(n).padStart(6)} ${pct(n, totalRuns).padStart(8)} ` +
        `${(n / careers).toFixed(2).padStart(12)} ${String(len * n).padStart(15)}`,
    )
  }
  console.log(`    -> ${rule}: ${breaches} runs longer than 1 week ` +
    `(${pct(breaches, totalRuns)} of runs, ${(breaches / careers).toFixed(1)} per career,` +
    ` ${(breaches / (careers * (TO_AGE - FROM_AGE + 1))).toFixed(2)} per season)`)
}
console.log('')
console.log('=================================================================================')
console.log('  RUN LENGTHS – «бывает по 3-5 недель пустота», and the rule «хотя бы 1 раз в 2 недели»')
console.log('  A rate cannot answer this. 5 empty weeks spread through a season is invisible; the')
console.log('  same 5 in a row is the complaint. The owner\'s rule = NO RUN LONGER THAN 1 WEEK.')
console.log('=================================================================================')
runTable(
  emptyRuns,
  'EMPTY RUNS – consecutive empty weeks, closed by a playable week AND by any blackout',
  'against the owner\'s rule',
)
runTable(
  feltRuns,
  'FELT RUNS – in-season blackouts (exams, family week, injury) count INSIDE the run; only the ' +
    'off-season and a playable week close it',
  'as the parent experiences it',
)
console.log('')
console.log('  ⚠⚠ AND THE THIRD AXIS, WHICH IS THE ONE HE IS ACTUALLY LOOKING AT. A week the feed')
console.log('  never drew a card for is empty from his seat however much tennis the world put on it.')
console.log(`    non-blackout weeks the feed showed him at least once  ${String(seenWeeks).padStart(7)}   ${pct(seenWeeks, nonBlackout)}`)
console.log(`    PLAYABLE weeks he was never shown                     ${String(unseenPlayable).padStart(7)}   ${pct(unseenPlayable, nonBlackout)}   <- invisible tennis`)
runTable(
  unseenRuns,
  'UNSEEN RUNS – consecutive non-blackout weeks with no card the feed EVER drew. Same denominator ' +
    'and same closing rule as EMPTY RUNS, so the difference between the two IS the feed',
  'what the owner counts when he says «по 3-5 недель пустота»',
)
console.log('')
console.log('  --- THE CANDIDATE, measured on the same careers in the same walk -------------------')
console.log('  A booked week no longer swallows the tournament on it. Nothing else moves: same')
console.log('  calendar, same rungs, same 8-week horizon, same RNG. This is the smallest change')
console.log('  that can touch the drought, and it does not move a single field in the world.')
console.log(`    cards the rung/horizon rules admitted and the row collapse threw away ${String(bookingSwallowed).padStart(7)}`)
console.log(`    non-blackout weeks shown at least once   ${String(seenWeeksFix).padStart(7)}   ${pct(seenWeeksFix, nonBlackout)}   (was ${pct(seenWeeks, nonBlackout)})`)
console.log(`    PLAYABLE weeks never shown               ${String(unseenPlayableFix).padStart(7)}   ${pct(unseenPlayableFix, nonBlackout)}   (was ${pct(unseenPlayable, nonBlackout)})`)
runTable(
  unseenRunsFix,
  'UNSEEN RUNS, WITH THE CANDIDATE APPLIED',
  'the owner\'s rule, on the screen he actually reads',
)

// =================================================================================================
// (b) HEADER vs FEED – which of the two surfaces is telling him the truth
// =================================================================================================
console.log('')
console.log('=================================================================================')
console.log('  THE SEASON HEADER AGAINST THE FEED – «их много есть на странице сезона сверху,')
console.log('  но в ленте почему-то их не вижу» (screenshot: 9 left to enter over 10 weeks)')
console.log('=================================================================================')
console.log('')
console.log(`  weeks the header counted >= 1 enterable event   ${String(hdrWeeks).padStart(7)}`)
console.log(`    ...of which the feed drew NO event card at all${String(hdrWeeksFeedBlank).padStart(7)}   ${pct(hdrWeeksFeedBlank, hdrWeeks)}   <- HIS SCREEN`)
console.log('')
console.log(`  events the header counted (week x event)        ${String(hdrEvents).padStart(7)}`)
console.log(`    the feed also drew                            ${String(hdrEventsShown).padStart(7)}   ${pct(hdrEventsShown, hdrEvents)}`)
console.log(`    the feed HID                                  ${String(hdrEvents - hdrEventsShown).padStart(7)}   ${pct(hdrEvents - hdrEventsShown, hdrEvents)}`)
console.log('')
console.log('  WHY A COUNTED EVENT NEVER REACHED THE FEED')
for (const [why, n] of [...hiddenWhy].sort((a, b) => b[1] - a[1])) {
  console.log(`    ${String(n).padStart(7)}  ${pct(n, hdrEvents - hdrEventsShown).padStart(6)}  ${why}`)
}
console.log('')
console.log('  ...AND ON WHICH RUNGS, counting only the ones INSIDE the feed\'s own 8-week horizon –')
console.log('  a horizon miss is the two surfaces looking at different weeks, which is not a lie by')
console.log('  either; a rung miss is the feed refusing to draw an event she could enter TODAY.')
for (const [tier, n] of [...hiddenByTier].sort((a, b) => b[1] - a[1])) {
  console.log(`    ${String(n).padStart(7)}  ${tier}`)
}
console.log('')
console.log('  THE MIRROR – events the FEED draws that the header refuses to count (she cannot enter)')
console.log(`    ${String(feedEventsUncounted).padStart(7)}  of ${feedEvents} drawn  ${pct(feedEventsUncounted, feedEvents)}`)

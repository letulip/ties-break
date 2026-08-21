import {
  DEFAULT_PROFILE,
  WEEK_PLAN_PRESETS,
  type CareerTotals,
  type ForkState,
  type FinanceWeek,
  type KitGrades,
  type KitLine,
  type Milestone,
  type SeasonHistoryEntry,
  type SessionKind,
  type WorldEventCategory,
} from '../shared/protocol'
import {
  emptySeasonEntries,
  emptySeasonRecord,
  emptyTrophyLedger,
  isCappedTier,
  KID_ID,
  SAVE_SCHEMA_VERSION,
  openingCoachId,
  replayMainState,
  seasonStartWeek,
  seedWorldForV6,
  startingSkills,
  type WorldState,
} from './world'
import { rollPotential } from './development'
// v47: the migration lays a week out, so the two layout functions it needs live in the ENGINE now
// (engine/plan.ts) and `composables/weekDays.ts` re-exports them under their historical names. The
// engine may not import a composable – CLAUDE.md invariant 1 – and a second spelling of REST_PRIORITY
// would be two conventions the calendar and the save could drift apart on.
import { PLAN_DAYS, sessionDays, sessionsForPlan } from './plan'
import { coachIncludesPhysio } from './coach'
import { COHORT } from './season/cohort'
import type { PlayerProfile } from '../shared/protocol'
// v27: her birth day is clamped to her own month, and February is never 29 - see daysInBirthMonth.
import { daysInBirthMonth } from '../shared/dates'
import { pickSurname } from './season/cohort'
import { rngFromSeed, pickInt, type MainRngState } from './rng'
import { OFF_SEASON_WEEKS, TIERS, tierFromLabel, WEEKS_PER_YEAR } from './season/calendar'
import { milestoneKey } from './diary'
import { schoolEndWeek } from './kidLife'
import { WEEKS_IN_SEASON, weekMonth, weekYear } from '../shared/dates'
import type { TierId } from './season/types'

// Save-data migrations. Append-only: never renumber, never delete a block.
// Each `if (v < N)` block upgrades from N-1 to N and must be idempotent for its version.


/** The absolute career week she turned nineteen, for the v39 fork back-fill.
 *
 *  ⚠ IT IS A SEARCH RATHER THAN A FORMULA, on purpose. `kidAgeYears` folds the birth month into the
 *  game's real calendar (a December girl is 13.08 at week 0), so "the week she turned 19" is not
 *  `5 * 52` for anybody but a January girl. Walking the season she crosses into is exact for every
 *  birth date, costs at most 52 comparisons once per migrated save, and cannot drift if the age
 *  arithmetic ever moves - which a hard-coded week absolutely would. */
function nineteenthBirthdayWeek(birthMonth: number, cap: number): number {
  for (let w = 0; w <= cap; w++) {
    if (frozenMonthClockAge(w, birthMonth) >= 19) return w
  }
  return cap
}

/** ⚠⚠ THE AGE CLOCK AS IT STOOD WHEN v39 SHIPPED, FROZEN HERE BECAUSE A MIGRATION MAY NOT CHANGE ITS
 *  MIND (18.08). `kidAgeYears` became DATE-aware on 18.08 – it had been reading the birth MONTH, so a
 *  girl's age rose on the first Monday of her birth month rather than on her birthday, by up to six
 *  weeks. That was a real defect and it is fixed at the source.
 *
 *  ⚠ BUT v39 IS SHIPPED, AND THE APPEND-ONLY RULE IS ABOUT THE OUTPUT, NOT THE SOURCE TEXT. A v38
 *  save migrated last month got `fork.askedWeek` off the month clock; the same file migrated tomorrow
 *  must land on the same week, or two players who imported the same save on different days hold
 *  careers that diverge. The comment two functions down states the rule in its own words - "widening
 *  this line would make a v38 save skip straight to a v51 shape, which is the edit the append-only
 *  rule forbids" - and following the new clock here would be exactly that edit wearing a fix's
 *  clothes.
 *
 *  ⚠ SO THE DRIFT WARNING ON `nineteenthBirthdayWeek` WAS HALF RIGHT AND IS NOW ANSWERED. It said the
 *  search "cannot drift if the age arithmetic ever moves". It could - the arithmetic moved on 18.08 -
 *  and what stops it is this copy rather than the search. The back-fill is bounded and self-correcting
 *  anyway: it only ever writes `askedWeek` for a career already past nineteen, and the LIVE fork every
 *  career raises from here on reads the real clock through `forkDue`. */
function frozenMonthClockAge(week: number, birthMonth: number): number {
  const month = Math.max(1, Math.min(12, Math.round(birthMonth)))
  return Math.floor(weekYear(week) - (weekYear(0) - 14) + (weekMonth(week) - month) / 12)
}

const EPOCH_SEASON_YEAR = weekYear(0) // 2031 – the year season 0 opened in

/** The calendar year a season's first Monday fell in UNDER THE OLD CONTINUOUS CALENDAR, frozen here
 *  as literal arithmetic. The career used to run 364 days a season straight off one epoch (Monday 6
 *  Jan 2031), which slid ~1.24 days earlier every year; `shared/dates.ts` re-anchors each season to
 *  its own January, so the live `weekYear` no longer answers this question and MUST NOT be asked it.
 *
 *  ⚠ IT IS FROZEN BECAUSE THE MIGRATION IT SERVES IS SHIPPED. v16 below inverts a value written by
 *  the OLD writer against the OLD calendar; if this followed `weekYear` into the re-anchor, a save
 *  that migrated one way in a shipped build would migrate a different way in the next one – seasons
 *  6+ would land an index off. Append-only means the OUTPUT is append-only, not just the source text,
 *  so the historical arithmetic has to be carried rather than re-derived.
 *
 *  ⚠ EXPORTED FOR THE COLLISION PINS, and for nothing else. Three test files (world-trio,
 *  week-numbering, trophy-cabinet) exist to prove the season-5 clash was REAL before proving the
 *  shipped calendar cannot produce it. They need the historical arithmetic to say so, and a fact
 *  stated in four places is a fact that will disagree with itself. Do not read this in app code. */
export function legacyWeekYear(week: number): number {
  const LEGACY_EPOCH_UTC = Date.UTC(2031, 0, 6) // Monday, Jan 6, 2031
  return new Date(LEGACY_EPOCH_UTC + week * 7 * 24 * 60 * 60 * 1000).getUTCFullYear()
}

/** v16 helper: invert the pre-v16 `year` field back to the season index that wrote it.
 *
 *  The old wrap-up stamped `legacyWeekYear(seasonIndex * WEEKS_IN_SEASON)` and refused to write a
 *  year already present, so the smallest index yielding a given year IS the index that produced the
 *  row. Bounded well past the game's horizon; falls back to the flat offset if it runs off the end. */
function seasonIndexOfLegacyYear(year: number): number {
  for (let k = 0; k <= 200; k++) if (legacyWeekYear(k * WEEKS_IN_SEASON) === year) return k
  return Math.max(0, year - EPOCH_SEASON_YEAR)
}

export function migrateSave(raw: unknown): WorldState {
  // `log` is a pre-v6 field (dropped from WorldState when Snapshot switched to
  // structured events); keep it typed here so the historical blocks can touch it.
  const save = raw as Partial<WorldState> & { schemaVersion?: number; log?: string[] }
  let v = save.schemaVersion ?? 0

  if (v < 1) {
    // v0: pre-release dev saves had no fundsCents
    if (typeof save.fundsCents !== 'number') save.fundsCents = 20_000_00
    if (!Array.isArray(save.log)) save.log = []
    v = 1
  }

  if (v < 2) {
    // v2 added the player profile (onboarding); v1 careers get the demo defaults
    save.profile = { ...DEFAULT_PROFILE }
    v = 2
  }

  if (v < 3) {
    // v3 added playStyle to the profile
    if (save.profile && !save.profile.playStyle) save.profile.playStyle = 'all-court'
    v = 3
  }

  if (v < 4) {
    // v4 added the weekly time plan
    save.plan ??= { ...WEEK_PLAN_PRESETS.balanced }
    v = 4
  }

  if (v < 5) {
    // v5 added careerId (career profiles / save generations); pre-v5 saves are one career per seed
    if (typeof save.careerId !== 'string') save.careerId = `legacy-${save.seed}`
    v = 5
  }

  if (v < 6) {
    // v6 added the living world: cohort, rolling season, results, structured events.
    // Old `log` strings become `info` events; the `log` field is dropped (Snapshot
    // switches to events). Cohort/season are regenerated deterministically from the seed.
    if (typeof save.seed === 'string' && typeof save.week === 'number') {
      seedWorldForV6(save as Partial<WorldState> & { seed: string; week: number; log?: string[] })
    }
    v = 6
  }

  if (v < 7) {
    // v7 added the kid's family name + the previous-week rank cache. The last name
    // defaults deterministically from the seed's surname sub-RNG (same pool the cohort draws).
    if (save.profile && typeof save.profile.kidLastName !== 'string') {
      save.profile.kidLastName = pickSurname(typeof save.seed === 'string' ? save.seed : '')
    }
    if (save.prevKidRank === undefined) save.prevKidRank = null
    v = 7
  }

  if (v < 8) {
    // v8 added the tournament-reveal flow: a week with the kid's event pauses into
    // world.pendingTournament instead of resolving inline. Old saves were never mid-reveal.
    if (save.pendingTournament === undefined) save.pendingTournament = null
    v = 8
  }

  if (v < 9) {
    // v9 added the profile's birth month (relative-age-effect groundwork, round-3 QA item
    // 16; round-6 bundle). Pre-v9 saves never chose one at onboarding, so it's backfilled
    // deterministically from the seed – same pattern as v7's kidLastName backfill – rather
    // than collapsing to the static DEFAULT_PROFILE value, so two different legacy careers
    // don't all land on the same birth month.
    if (save.profile && typeof save.profile.birthMonth !== 'number') {
      const seed = typeof save.seed === 'string' ? save.seed : ''
      save.profile.birthMonth = pickInt(rngFromSeed(`${seed}:bm`), 1, 12)
    }
    v = 9
  }

  if (v < 10) {
    // v10 added: per-tier best finish (drives the Home season strip), the structured
    // last-season summary (SeasonSummaryDialog), and running season W-L counters.
    // bestFinishByTier is BACKFILLED from surviving `tournament` events (each carries the kid's
    // finishIdx) so a migrated career shows real tier progress immediately; the rest start
    // empty/zero (an in-flight season's W-L can't be reconstructed post-pruning, and there's no
    // summary until the next wrap-up). Historical events don't store the tier, so it's recovered
    // from the summary text's tier-label prefix (e.g. "Local Open (…): …").
    if (typeof save.bestFinishByTier !== 'object' || save.bestFinishByTier === null) {
      const byTier: Partial<Record<TierId, number>> = {}
      for (const e of Array.isArray(save.events) ? save.events : []) {
        if (e.type !== 'tournament' || typeof e.finishIdx !== 'number' || typeof e.text !== 'string') continue
        // Shared longest-label-first lookup (calendar.ts): "Junior Tour 30" is a prefix of
        // "Junior Tour 300", so a naive scan would credit a J300 result to J30.
        const tier = tierFromLabel(e.text)
        if (!tier) continue
        const prior = byTier[tier]
        if (prior === undefined || e.finishIdx < prior) byTier[tier] = e.finishIdx
      }
      save.bestFinishByTier = byTier
    }
    if (save.lastSeasonSummary === undefined) save.lastSeasonSummary = null
    if (typeof save.seasonWins !== 'number') save.seasonWins = 0
    if (typeof save.seasonLosses !== 'number') save.seasonLosses = 0
    v = 10
  }

  if (v < 11) {
    // v11 added the persisted per-week/per-category finance ledger (financeWeeks) that keeps the
    // Money breakdown/ledger window-accurate past the 60-event snapshot cap. BEST-EFFORT rebuild
    // from the retained finance events (each carries week + category + amountCents), pruned to the
    // same 60-week trailing window the engine maintains. History already pruned out of `events` is
    // unrecoverable – that's acceptable: exact going forward, approximate for the pre-migration tail.
    if (!Array.isArray(save.financeWeeks)) {
      const byWeek = new Map<number, FinanceWeek>()
      const weeks: FinanceWeek[] = []
      for (const e of Array.isArray(save.events) ? save.events : []) {
        if (typeof e.week !== 'number' || typeof e.amountCents !== 'number' || e.amountCents === 0) continue
        const category = (e.category ?? 'other') as WorldEventCategory
        let entry = byWeek.get(e.week)
        if (!entry) {
          entry = { week: e.week, byCategory: {} }
          byWeek.set(e.week, entry)
          weeks.push(entry)
        }
        entry.byCategory[category] = (entry.byCategory[category] ?? 0) + e.amountCents
      }
      weeks.sort((a, b) => a.week - b.week)
      const currentWeek = typeof save.week === 'number' ? save.week : 0
      save.financeWeeks = weeks.filter((w) => w.week >= currentWeek - 59)
    }
    v = 11
  }

  if (v < 12) {
    // v12 added Season-Life availability: persisted condition + injury/physio state (Slices B+C).
    // Pre-v12 saves never stored these; backfill to a healthy default. condition=100 also keeps the
    // (currently-off) match-strength coupling neutral, so no historical shift.
    if (typeof save.condition !== 'number') save.condition = 100
    if (save.injury === undefined) save.injury = null
    if (!Array.isArray(save.injuryHistory)) save.injuryHistory = []
    // ⚠ RE-AIMED by the coach ladder (v22), and the historical answer is unchanged. This block used
    // to read `save.profile?.coachSetup === 'hired'`. A save reaching it can now carry EITHER
    // profile shape: a genuine pre-v12 save still has `coachSetup` (v22 is downstream and has not
    // run yet), while a v0/v1 save was handed today's DEFAULT_PROFILE by the v2 block above, which
    // carries `coachTier`. Both are asked, and both say the same thing – "she has a hired coach" –
    // because every rung but self-coached IS a hire.
    if (typeof save.physioActive !== 'boolean') {
      const p = save.profile as (PlayerProfile & { coachSetup?: string }) | undefined
      save.physioActive =
        p?.coachSetup !== undefined
          ? p.coachSetup === 'hired'
          : p?.coachTier !== undefined && coachIncludesPhysio(p.coachTier)
    }
    v = 12
  }

  if (v < 13) {
    // v13 added the season planner: booked family-vacation weeks, booked practice-match weeks,
    // and the carry-over recovery buff from a resort/elite package. Pre-v13 careers never planned
    // anything, so the backfill is simply "nothing booked, no buff running" – append-only and
    // idempotent (an existing v13 array is never touched, so a re-migration can't drop a booking).
    if (!Array.isArray(save.vacations)) save.vacations = []
    if (!Array.isArray(save.practices)) save.practices = []
    if (save.recoveryBuff === undefined) save.recoveryBuff = null
    v = 13
  }

  if (v < 14) {
    // v14 (R10-9) added the append-only per-season history list behind the Stats season-by-season
    // table. `lastSeasonSummary` is the only per-season record that ever existed before it, so a
    // migrated career SEEDS the list with that one season (when it has one) and grows from the next
    // wrap-up on – the same "backfill what survives, be exact going forward" rule v10/v11 used.
    // `bestFinish` stays absent on a backfilled row: the old summary stored only prose for it, and
    // parsing text back into an index is exactly what the wrap-up work moved away from.
    // Idempotent: an existing array is never touched, so a re-migration cannot duplicate a season.
    // NOTE (v16): this block writes the v14 SHAPE, with the `year` field that v16 later re-keys to
    // `seasonIndex`. Blocks are append-only and each one upgrades to ITS OWN version, so it stays
    // exactly as it was written; the cast is what lets a historical shape be expressed against the
    // current type. The v16 block below converts whatever this produced.
    if (!Array.isArray(save.seasonHistory)) {
      const s = save.lastSeasonSummary
      save.seasonHistory = (s
        ? [
            {
              year: s.seasonYear,
              endRank: s.endRank,
              points: s.points,
              wins: s.wins,
              losses: s.losses,
              fundsDeltaCents: s.fundsDeltaCents,
              // The old summary carried no closing balance; the save's CURRENT funds are the
              // closest honest figure for the most recent season (off-season, nothing spent yet).
              endFundsCents: typeof save.fundsCents === 'number' ? save.fundsCents : 0,
            },
          ]
        : []) as unknown as SeasonHistoryEntry[]
    }
    v = 14
  }

  if (v < 15) {
    // v15 added the ITF annual entry cap's ledger: the week of every INTERNATIONAL entry she has
    // made, counted per season against ECONOMY.entryCap.perYearByAge (docs/research/
    // ranking-points-by-tier.md §2). Nothing in a pre-v15 save can reconstruct it – the kid's
    // result row is award-only, so wave B's first-round zero left her cheapest entries with no
    // trace at all – so the backfill is an EMPTY ledger, i.e. a legacy career resumes with this
    // season's allowance untouched. That is the lenient direction on purpose: the alternative is
    // to invent a number and possibly lock a loaded career out of a tier it was mid-way through.
    // Idempotent: an existing array is never touched, so a re-migration cannot drop a slot.
    if (!Array.isArray(save.internationalEntryWeeks)) save.internationalEntryWeeks = []
    v = 15
  }

  if (v < 16) {
    // v16 (fix/world-trio) re-keys `seasonHistory` on the SEASON INDEX. Rows used to carry `year`,
    // the calendar year of the season's first Monday, and the wrap-up used that as the season's
    // IDENTITY – but a season is 364 days, so its opening Monday drifts back over New Year and
    // weekYear(208) === weekYear(260) === 2035. Season 5 therefore looked already-banked and its
    // row was never written. See SeasonHistoryEntry.seasonIndex.
    //
    // THE BACKFILL IS EXACT, not best-effort, because the buggy writer's own guard makes it
    // invertible: it kept the FIRST season to claim a year and dropped every later claimant, so a
    // legacy `year` can only ever have come from the SMALLEST index that yields it. Recovering that
    // index is a short scan over `legacyWeekYear(k * WEEKS_IN_SEASON)`. (2035 is the only collision
    // inside 40 seasons, so in practice this shifts nothing below season 5 and re-labels seasons 6+
    // by the one year the drop had cost them.) Idempotent: a row that already has an index is left alone.
    //
    // ⚠ THE SCAN CANNOT BE COLLAPSED TO `year - 2031`, NOW OR EVER, even though the calendar was
    // re-anchored a wave later and the live `weekYear(k * 52)` IS `2031 + k`. The whole point of this
    // block is that the value it inverts was written by a writer that skipped 2035's second claimant:
    // the smallest legacy index yielding 2036 is SIX, and `year - 2031` would say five. Simplifying
    // it would silently re-label every legacy season past the collision. See docs/specs/season-anchor.md §6.
    if (Array.isArray(save.seasonHistory)) {
      save.seasonHistory = save.seasonHistory.map((h) => {
        const row = h as SeasonHistoryEntry & { year?: number }
        if (typeof row.seasonIndex === 'number') return row
        const { year, ...rest } = row
        return { ...rest, seasonIndex: seasonIndexOfLegacyYear(year ?? EPOCH_SEASON_YEAR) }
      })
    }
    v = 16
  }

  if (v < 17) {
    // v17 (R12-S1) adds `seasonStartRank` – her dense rank as she entered the season in progress.
    // It exists because the wrap-up used to REPLAY that ranking from the results ledger, 49 weeks
    // after the fact, by which time the 52-week prune had removed every row behind it: the replay
    // saw an almost empty table, everyone tied on 0 points, and competition ranking handed the
    // whole tie rank #1. Both of the owner's careers reported "from #1" for season 2.
    //
    // A pre-v17 save cannot be backfilled, for exactly the reason the field had to be added: the
    // data is gone. Null is therefore the honest value, and it is a value every reader already
    // handles – `SeasonSummary.startRank` has been nullable since it was introduced, and the popup
    // renders no "from #N" at all when it is null. A career loaded from an older save loses the
    // start-rank line for the season it is currently in, and captures a real one from the next
    // season boundary onward. Idempotent: an existing value is never overwritten.
    if (save.seasonStartRank === undefined) save.seasonStartRank = null
    v = 17
  }

  if (v < 18) {
    // v18 (Diary-1, D10) adds the durable milestone ledger behind the Memory card: first title and
    // first final per tier, the first international entry (j30+), the first injury, each season's
    // closing rank. Going forward these are captured AT THE MOMENT they happen; here they are
    // BACKFILLED from what an old save still carries, with the earliest surviving evidence winning
    // per milestone identity.
    //
    // WHAT THE BACKFILL CAN HONESTLY SAY, and what it cannot:
    //  - titles/finals: read from surviving `tournament` events (finishIdx + label → tier), from
    //    the kept `first-title` milestone event (exact, survives all pruning), and from the kid's
    //    result rows (points inverted through the tier table – rows are award-only, so a points
    //    value names its finish exactly). Events prune at 400 and results at 52 weeks, so a
    //    backfilled "first" is the earliest SURVIVING one – the true first may predate it on a long
    //    career. The global first title is exact whenever its kept event exists (every save since
    //    v6 keeps it forever).
    //  - first injury: injuryHistory (onset = week − weeksOut) plus the active injury. Exact
    //    unless the 20-entry cap has already eaten her earliest layoffs.
    //  - season ranks: seasonHistory rows are exact for every season they retain (cap 30).
    //  - first international: NO true record survives (the entry ledger prunes to the current
    //    season, and a first-round exit leaves no result row at all since wave B), so the earliest
    //    surviving j30+ evidence stands in. Approximate by construction, and better than the
    //    alternative – an empty slot here would let the NEXT entry of a seasoned traveller be
    //    captured as her "first".
    if (!Array.isArray(save.milestones)) {
      const candidates: Milestone[] = []
      const events = Array.isArray(save.events) ? save.events : []
      for (const e of events) {
        if (e.type !== 'tournament' || typeof e.finishIdx !== 'number' || typeof e.text !== 'string') continue
        const tier = tierFromLabel(e.text)
        if (!tier || typeof e.week !== 'number') continue
        if (e.finishIdx === 0) candidates.push({ type: 'title', week: e.week, tier })
        if (e.finishIdx <= 1) candidates.push({ type: 'final', week: e.week, tier })
        if (isCappedTier(tier)) candidates.push({ type: 'international', week: e.week, tier })
      }
      for (const e of events) {
        if (e.milestoneKey !== 'first-title' || typeof e.text !== 'string' || typeof e.week !== 'number') continue
        const tail = e.text.split('First career title: ')[1]
        const tier = tail ? tierFromLabel(tail) : undefined
        if (tier) {
          candidates.push({ type: 'title', week: e.week, tier })
          candidates.push({ type: 'final', week: e.week, tier })
        }
      }
      for (const r of Array.isArray(save.results) ? save.results : []) {
        if (r.playerId !== KID_ID || !r.tier || typeof r.points !== 'number' || r.points <= 0) continue
        const finish = TIERS[r.tier].points.indexOf(r.points)
        if (finish < 0) continue
        if (finish === 0) candidates.push({ type: 'title', week: r.week, tier: r.tier })
        if (finish <= 1) candidates.push({ type: 'final', week: r.week, tier: r.tier })
        if (isCappedTier(r.tier)) candidates.push({ type: 'international', week: r.week, tier: r.tier })
      }
      for (const w of Array.isArray(save.internationalEntryWeeks) ? save.internationalEntryWeeks : []) {
        if (typeof w === 'number') candidates.push({ type: 'international', week: w })
      }
      for (const h of Array.isArray(save.injuryHistory) ? save.injuryHistory : []) {
        candidates.push({ type: 'injury', week: h.week - h.weeksOut, kind: h.kind })
      }
      if (save.injury) candidates.push({ type: 'injury', week: save.injury.sinceWeek, kind: save.injury.kind })
      for (const h of Array.isArray(save.seasonHistory) ? save.seasonHistory : []) {
        candidates.push({
          type: 'season-rank',
          week: h.seasonIndex * WEEKS_IN_SEASON + (WEEKS_IN_SEASON - OFF_SEASON_WEEKS),
          seasonIndex: h.seasonIndex,
          rank: h.endRank,
        })
      }
      // Earliest surviving evidence wins per identity: sort by week, first claim of a key stands.
      candidates.sort((a, b) => a.week - b.week)
      const ledger: Milestone[] = []
      for (const m of candidates) {
        if (!ledger.some((x) => milestoneKey(x) === milestoneKey(m))) ledger.push(m)
      }
      save.milestones = ledger
    }
    v = 18
  }

  // v18 -> v19: DEVELOPMENT (Phase 4). Her build stops being re-derived on demand and becomes state
  // that moves. Both fields are back-filled from the SAME `seed:kid` derivation the engine used to
  // recompute every time, so a career opened after this migration is byte-identical to the one that
  // was saved - she simply starts developing from here rather than never.
  //
  // Potential is rolled from `seed:potential`, its own stream, so an old save gets the same ceiling
  // it would have had if it had been created under v19. A ceiling must not be re-rollable.
  if (v === 18) {
    const start = startingSkills(String(save.seed), save.profile as PlayerProfile)
    save.skills = start
    save.potential = rollPotential(String(save.seed), start)
    v = 19
  }

  // v19 -> v20: THE COHORT GETS AN AGE AND A CEILING. Until now they grew about 1.5 a year for
  // ever, so no career could catch the ladder. Back-filled deterministically from the player's own
  // seed - the same generator the cohort was built with would have given them these numbers, and a
  // migrated career must not get a DIFFERENT field from a fresh one on the same seed.
  if (v === 19) {
    const cohort = Array.isArray(save.cohort) ? (save.cohort as unknown as Record<string, unknown>[]) : []
    const rng = rngFromSeed(`${String(save.seed)}:cohort-age`)
    for (const p of cohort) {
      p.ageYears = pickInt(rng, COHORT.ageBand[0], COHORT.ageBand[1])
      const [lo, hi] = COHORT.potentialBand
      const head = () => lo + rng() * (hi - lo)
      // Their CURRENT attributes are wherever the old unbounded drift left them, so the ceiling is
      // measured from there: a save that has been running for years keeps the players it earned.
      p.potential = {
        serve: Number(p.serve) + head(),
        ret: Number(p.ret) + head(),
        composure: Number(p.composure) + head(),
        stamina: Number(p.stamina) + head(),
      }
    }
    v = 20
  }

  // v20 -> v21: THE ACADEMY SCHOLARSHIP. Back-filled as `null` – nobody is backing her – rather
  // than by replaying what the reviews WOULD have decided over the career so far.
  //
  // That is a deliberate choice and not a shortcut. A replay would have to invent the events that
  // never fired (the offer, the renewals, the kit grants) and refund the travel she has already
  // paid full price for, or else quietly hand her a scholarship she was never told about. Starting
  // from null costs a migrated career at most one season: the next boundary reviews her on the year
  // she just played, and if the academy wants her, they say so then – as an offer, with the
  // milestone that goes with it.
  if (v === 20) {
    save.academy = null
    v = 21
  }

  // v21 -> v22: THE COACH LADDER (docs/specs/coach-tiers.md). `profile.coachSetup: 'parent' |
  // 'hired'` becomes `profile.coachTier: 'self' | 'budget' | 'middle' | 'high' | 'elite'`.
  //
  // THE BACK-FILL IS THE OWNER'S RULING AND IT IS DELIBERATELY BLUNT: `hired` -> `elite`,
  // `parent` -> `self`. Asked what an existing career should land on, he said Elite and that he
  // does not mind, because there are no players yet - so the version of this block that priced
  // each save's old weekly bill against every rung and picked the nearest is gone. It was more
  // arithmetic than the question deserved.
  //
  // It is also, as it happens, what that arithmetic mostly said: the old `hired` band's midpoint
  // (~$475/wk) is what the spec's own conversion prices an Elite coach at, to within $5. And both
  // mappings are DEVELOPMENT-NEUTRAL - `self` carries 0.82, which is exactly the `coachParent` a
  // parent-coached career was growing at, and `elite` carries 1.15, which is exactly `coachHired`.
  // No migrated career's growth rate moves by a hair; only its bill does.
  //
  // A migrated career is not stranded on that bill, either: the Coach Market (screen T) ships in
  // the same wave, so an Elite coach it cannot afford is one screen away from being a Budget one.
  if (v === 21) {
    const profile = save.profile as (PlayerProfile & { coachSetup?: 'parent' | 'hired' }) | undefined
    if (profile && profile.coachTier === undefined) {
      profile.coachTier = profile.coachSetup === 'hired' ? 'elite' : 'self'
      delete profile.coachSetup
    }
    v = 22
  }

  // v22 -> v23: A ROSTER, NOT A RUNG. `world.coachId` joins the profile's rung - the id of the
  // actual person she trains with, or `null` for the parent on the court.
  //
  // The back-fill hires the coach at the rung she was already on, choosing by fit and then by
  // price, which is the same rule `openingCoachId` applies to a brand-new career. So a migrated
  // save keeps the tier it was being billed at, keeps its development factor, and simply gains a
  // name and a face for the money it was already spending.
  //
  // Nothing here is drawn on the main stream: the roster is a pure derivation of the seed
  // (engine/coach.ts buildCoachRoster), which is also why only the id needs storing - the roster
  // itself rebuilds identically on every load, for ever.
  if (v === 22) {
    const profile = save.profile as PlayerProfile | undefined
    if (save.coachId === undefined) {
      save.coachId = profile ? openingCoachId(String(save.seed), profile) : null
    }
    v = 23
  }

  // v23 -> v24: DOES THE COACH COME TO TOURNAMENTS. A competition week stops being billed as a
  // coaching week by default (owner, R4), and `coachOnEventWeeks` buys him for those weeks anyway.
  //
  // Back-filled FALSE, which is the new default and NOT a preservation of what the save was doing -
  // an existing career was billed for every week, so this migration makes its coach cheaper and,
  // on tournament weeks, absent. That is deliberate: the owner's framing is that competition weeks
  // are automatically not coach weeks, so the automatic rule is what a migrated career should wake
  // up under. The toggle is one tap away on the Coach Market for anyone who wants the old
  // behaviour back, and it is the cheaper direction, which is the safe one to migrate into.
  if (v === 23) {
    save.coachOnEventWeeks = false
    v = 24
  }

  // v24 -> v25: THE FIFTH ATTRIBUTE. `KidSkills` gains `groundstrokes` - damage off the ground, the
  // leg of a point the model never had (owner, 30.07; docs/specs/skills-radar.md §5).
  //
  // THE TWO OBVIOUS BACK-FILLS ARE BOTH WRONG, and saying why is the whole of this block. Her BIRTH
  // value would open a week-200 career with a fourteen-year-old's forehand - one absurd notch on a
  // radar that is otherwise about a nineteen-year-old. Her CEILING is wrong for the mirror reason.
  // Both would read as the game having forgotten five years of her career, which is exactly what it
  // did NOT do: she has been hitting forehands the whole time. The attribute was not modelled; the
  // girl was.
  //
  // SO SHE IS PLACED AT THE SHARE OF THE NEW AXIS'S HEADROOM SHE HAS TAKEN ON THE OTHER FOUR. A girl
  // who is two thirds of the way to her ceiling everywhere else is two thirds of the way there off
  // the ground too, which is the only statement the save actually supports.
  //
  // ⚠ A FRESH CAREER LANDS ON EXACTLY `startingSkills`, because `progress` is 0 at week 1. That is
  // the property v19 established for `skills`/`potential` and it is worth keeping: a new game and a
  // migrated week-1 game must be the same career, or the migration is inventing history.
  //
  // Both new numbers come off the APPENDED draws on `seed:kid` / `seed:potential` (see
  // world.ts startingSkills and development.ts SKILL_KEYS), so the four attributes this save already
  // holds are untouched and the two sub-streams' earlier draws are byte-identical. Zero main-stream
  // draws: this runs at load time, not inside a tick.
  if (v === 24) {
    const born = startingSkills(String(save.seed), save.profile as PlayerProfile)
    const ceiling = rollPotential(String(save.seed), born)
    const skills = save.skills as Record<string, number> | undefined
    const potential = save.potential as Record<string, number> | undefined
    if (skills && potential && skills.groundstrokes === undefined) {
      const OLD_KEYS = ['serve', 'ret', 'composure', 'stamina'] as const
      let progress = 0
      for (const k of OLD_KEYS) {
        const headroom = ceiling[k] - born[k]
        // Guard the degenerate ceiling (a career whose potential roll landed on its start) rather
        // than dividing by it; such an attribute simply contributes no evidence of progress.
        const share = headroom > 0 ? (skills[k] - born[k]) / headroom : 0
        progress += Math.max(0, Math.min(1, share)) / OLD_KEYS.length
      }
      skills.groundstrokes = born.groundstrokes + progress * (ceiling.groundstrokes - born.groundstrokes)
      potential.groundstrokes = ceiling.groundstrokes
    }
    v = 25
  }

  // v25 -> v26: THE KNOCK. The ordinary training week gets one thing that happens and one thing the
  // parent decides - she comes off court sore, and he rests it or sends her back out (owner, 30.07,
  // asking a second time: «Чтобы тренировочные недели не просто скипались… пришло время сделать
  // какое-то пошаговые события»). See engine/knock.ts for the design and the anti-farming argument.
  //
  // BACK-FILLED EMPTY, AND UNLIKE v18's MILESTONES THERE IS NOTHING TO RECONSTRUCT. A knock leaves no
  // trace an old save could carry: it was never rolled, never logged and never persisted, so there is
  // no earlier evidence to mine the way the milestone ledger could be rebuilt from surviving
  // tournament events. Inventing a history here would mean inventing decisions the player never made
  // - and `knockHistory` is precisely the record of his decisions (`pushedParts` reads it to decide
  // which part of her body is on the thread), so a fabricated row would put a weak shoulder on a
  // career whose owner never ignored anything.
  //
  // A migrated career therefore wakes up with a clean body and a clean record, and the first knock
  // arrives on its next ordinary training week like any other. That is the honest state: the system
  // did not exist, so nothing had happened under it.
  //
  // ⚠ NOTHING ELSE IN THE SAVE MOVES. The knock's dice are `seed:knock:<week>` and its dialog copy is
  // `seed:knockread:<sinceWeek>` - two sub-streams that did not exist before, so no existing stream's
  // sequence shifts by a draw, and the frozen MAIN capture (41550 / e6b0c709) is untouched. The
  // injury threshold gains a POST-DRAW multiply (`knockTauFactor`) that returns exactly 1 while
  // `knock` is null, which it is for every migrated save at the moment it loads.
  if (v === 25) {
    save.knock ??= null
    save.knockHistory ??= []
    v = 26
  }

  // v27 added the profile's birth DAY (owner, 30.07: the birthday week has to be the right week, because
  // the family congratulates her on it and eventually brings a present to it).
  //
  // BACK-FILLED FROM THE SEED, NOT FROM DEFAULT_PROFILE - the same pattern and the same reason as v9's
  // `birthMonth` back-fill next door: collapsing every legacy career onto the static default would give
  // them all the same birthday, and this is a field whose whole job is to be personal. Drawn off its own
  // `:bd` sub-stream, so no existing stream's sequence moves.
  //
  // ⚠ CLAMPED TO HER OWN MONTH. February is 28 (her birth year is the band's, which is never a leap year -
  // see `daysInBirthMonth`), so a back-filled day can never be a date she could not have been born on.
  // Reading `birthMonth` here is safe: v9 ran long before this and guarantees it is a number.
  if (v === 26) {
    if (save.profile && typeof save.profile.birthDay !== 'number') {
      const seed = typeof save.seed === 'string' ? save.seed : ''
      const month = typeof save.profile.birthMonth === 'number' ? save.profile.birthMonth : 6
      save.profile.birthDay = pickInt(rngFromSeed(`${seed}:bd`), 1, daysInBirthMonth(month))
    }
    v = 27
  }

  // v27 -> v28: THE SEASON W-L, TOLD APART BY LADDER. `world.seasonRecord` joins the two running
  // counters (owner, 31.07: «national/international разделить победы и поражения, мне кажется они не
  // должны быть общими»). See `Snapshot.seasonRecord` for why the totals stay where they are.
  //
  // THE BACK-FILL IS A RECONSTRUCTION, AND IT IS EXACT WHEREVER THE EVENT FEED STILL REACHES. Unlike
  // v26's knock there IS earlier evidence to mine, and unlike v10's own "an in-flight season's W-L
  // can't be reconstructed post-pruning" it does not need the match records: `finalizeTournament` is
  // the ONLY writer of a `tournament` event, it stamps `finishIdx` on it, and a finish index over a
  // known draw size IS the match count. She played `rounds - finishIdx` wins and, unless she won the
  // thing, exactly one loss. The tier comes off the summary's own label prefix through the shared
  // longest-label-first lookup - the same recipe v10 used to rebuild `bestFinishByTier` and v18 used
  // to rebuild the milestone ledger, and it is safe for the same reason: "Junior Tour 30" is a prefix
  // of "Junior Tour 300", so a naive scan would file a J300 run under J30.
  //
  // ⚠ ONLY THE CURRENT SEASON, because that is all the field means. The counters reset at every
  // wrap-up, so a row from a finished season would be double-counting a figure already banked in
  // `seasonHistory`.
  //
  // ⚠ AND THE TOTALS ARE NOT TOUCHED, which is the half worth defending. `matchesEverPlayed` folds
  // `seasonWins + seasonLosses` into the radar's confidence, and that count is documented as one that
  // may only ever go UP - a fall would re-thicken the fog on its own, which is the shimmer the radar
  // spec forbids. So a save whose feed has already pruned past the start of its season keeps its true
  // total and gets a split that accounts for as much of it as the evidence supports; the remainder is
  // simply not attributed to either ladder, because nothing left in the save says which one it was.
  // That costs a migrated career at most the tail of one season on ONE screen, and it is the same
  // bargain v17 struck for `seasonStartRank`. Idempotent: an existing record is never rebuilt.
  if (v === 27) {
    if (save.seasonRecord === undefined) {
      const record = emptySeasonRecord()
      const week = typeof save.week === 'number' ? save.week : 0
      const from = seasonStartWeek(week)
      for (const e of Array.isArray(save.events) ? save.events : []) {
        if (e.type !== 'tournament' || typeof e.finishIdx !== 'number' || typeof e.text !== 'string') continue
        if (typeof e.week !== 'number' || e.week < from || e.week > week) continue
        const tier = tierFromLabel(e.text)
        if (!tier) continue
        const def = TIERS[tier]
        const rounds = Math.round(Math.log2(def.drawSize))
        const bucket = record[def.track]
        bucket.wins += Math.max(0, rounds - e.finishIdx)
        if (e.finishIdx > 0) bucket.losses += 1
      }
      // Defensive clamp: the split is a DECOMPOSITION of the totals and must never claim more than
      // they hold. It cannot overshoot on a save this engine wrote, but a hand-edited or truncated
      // one must not produce a screen that reads 13-4 out of a season of 9-3.
      const capTo = (key: 'wins' | 'losses', total: number) => {
        const sum = record.domestic[key] + record.itf[key]
        if (sum <= total) return
        let over = sum - total
        for (const t of ['itf', 'domestic'] as const) {
          const take = Math.min(over, record[t][key])
          record[t][key] -= take
          over -= take
        }
      }
      capTo('wins', typeof save.seasonWins === 'number' ? save.seasonWins : 0)
      capTo('losses', typeof save.seasonLosses === 'number' ? save.seasonLosses : 0)
      save.seasonRecord = record
    }
    v = 28
  }

  // ⚠ THIS BLOCK WAS WRITTEN AS v27 -> v28 AND IS RENUMBERED HERE (round-19). Two waves of the same
  // day each appended a schema step and each called it 28: the ladder split above, and this one. They
  // touch different fields and neither reads the other, so the collision was only ever the NUMBER -
  // and this one moves because its migration is a deliberate no-op, which makes it the cheaper of the
  // two to renumber. Append-only is preserved either way: no shipped save has ever seen a 28 that
  // means "spend history", because neither branch was merged before this one.
  //
  // v28 -> v29: `seasonHistory` rows `+spentCents +earnedCents` (what each season COST and BROUGHT IN,
  // gross, in positive cents). The owner: «было бы очень интересно где-то хранить всю историю затрат
  // за карьеру по годам в каком-то виде.»
  //
  // ⚠ IT IS A NO-OP ON PURPOSE, AND THAT IS THE WHOLE POINT OF THE BLOCK. There is nothing to
  // back-fill and nothing that could be: the figures come off `financeWeeks`, which is pruned to a
  // 60-week trailing window (`pruneFinanceWeeks`), so every season older than about fourteen months
  // has had its per-category rows deleted from the save long before this migration runs. The only
  // other trace is `lastSeasonSummary`, which holds ONE season and is overwritten every year.
  //
  // A back-fill would therefore have to invent numbers, and this is the one field where an invented
  // number is worse than no number at all: the whole feature is a player asking "what has she cost
  // us", and a fabricated answer to that is a lie with a dollar sign on it. The reader prints
  // silence for a row without the fields (see `SeasonHistoryEntry.spentCents`), the same contract
  // `bestFinish` has carried since v14 - so a migrated career shows its seasons honestly as "not
  // recorded" and starts keeping real figures from its next wrap-up.
  //
  // Nothing else moves: no stream is added or reordered, no existing field is read or rewritten, and
  // the frozen MAIN capture (41550 / e6b0c709) is untouched by construction.
  if (v === 28) {
    v = 29
  }

  // v29 -> v30: `seasonRecord` gains its THIRD bucket – `wta`, the professional table (task #17, the
  // adult rungs). `LadderTrack` went from two members to three, and this is the only place in the
  // save where that union is a persisted KEY SET rather than something re-derived on the next tick.
  //
  // ⚠ IT IS A BACK-FILL, AND UNIQUELY AMONG THE BACK-FILLS IN THIS FILE IT IS EXACT. v18 mined
  // surviving evidence and admitted its "firsts" were only the earliest still-visible ones; v28
  // reconstructed a split and clamped it because the feed had been pruned; v29 refused to guess at
  // all. This one guesses nothing and loses nothing: W15/W35/W100 did not exist in any shipped
  // build, so no match in any save that reaches this line can have been played on the professional
  // table, and zero is not a placeholder for the true value - it IS the true value. The season W-L
  // invariant (`seasonRecord` sums to `seasonWins`/`seasonLosses`) therefore still holds afterwards,
  // which is the property the Stats screen's two figures rest on.
  //
  // Written defensively rather than as a blind `save.seasonRecord.wta = ...`: a save can arrive here
  // with `seasonRecord` undefined only if it entered the ladder above v27 (v28's block fills it), but
  // this file is append-only and a later step must not assume an earlier one's post-condition still
  // reads the way it did the day it was written.
  //
  // Nothing else moves: no stream is added or reordered and no existing number is rewritten, so the
  // frozen MAIN capture (41550 / e6b0c709) is untouched by construction.
  if (v === 29) {
    const rec = save.seasonRecord
    if (rec === undefined || rec === null || typeof rec !== 'object') {
      save.seasonRecord = emptySeasonRecord()
    } else if (rec.wta === undefined) {
      rec.wta = { wins: 0, losses: 0 }
    }
    v = 30
  }

  // v30 -> v31: `world.trophiesByTier` – THE TITLES LEDGER, behind the Trophy Cabinet. Every title
  // and every LOST final of her career, per tier, as the absolute weeks they happened in.
  //
  // ⚠ THE BACK-FILL IS A DELIBERATE NO-OP, IN THE SENSE v29's SPEND HISTORY ESTABLISHED: the shape
  // is created, the history is not invented. An existing career wakes up with eighteen empty
  // shelves, and its next final - won or lost - is the first thing that goes in one.
  //
  // NOT because the mining would be hard. Because the evidence is GONE, and the little of it that
  // survives would produce a confident wrong answer rather than a partial one:
  //
  //   * `results` is pruned to the 52-week ranking window, so nothing older than a season is there
  //     at all - and the kid's row is award-only anyway;
  //   * `events` is capped at 400 rows, and a busy career burns that in a couple of seasons;
  //   * `milestones` is FIRSTS-ONLY by identity (`title:<tier>`), so a five-time J30 champion has
  //     exactly one title row. Reading it would produce a cabinet claiming one J30 title, which is
  //     not an incomplete answer - it is a WRONG one, stated with a year on it;
  //   * `bestFinishByTier` is a high-water mark with no week and no count, and the day she won a
  //     tier it overwrote the runner-up it held. It can say "she has won a J30" and can never say
  //     when, how many times, or whether she ever lost one.
  //
  // v18 mined its ledger from surviving evidence and was careful to document that its "firsts" are
  // only the earliest STILL-VISIBLE ones - a bargain worth striking there, because a memory that
  // starts late is still a memory. A trophy cabinet is the other kind of surface: it prints a
  // NUMBER under each cup, that number is the whole point, and a number reconstructed from a 400-row
  // window would be wrong in the one direction a cabinet must never be wrong in. The owner, asked
  // directly: «нас это в данный момент не беспокоит». So the screen shows what exists.
  //
  // Nothing else moves: no field is read or rewritten, no sub-stream is added or reordered, and a
  // push onto an array spends no draw - the frozen MAIN capture (41550 / e6b0c709) is untouched by
  // construction.
  if (v === 30) {
    const cabinet = save.trophiesByTier
    if (cabinet === undefined || cabinet === null || typeof cabinet !== 'object') {
      save.trophiesByTier = emptyTrophyLedger()
    }
    v = 31
  }

  // v31 -> v32: `world.offers` – THE INBOX. Every letter this career has been sent, and what the
  // parent did about each one. docs/specs/offers-and-the-inbox.md §2; the mechanism lives in
  // engine/offers.ts and this slice carries the kit sponsor alone.
  //
  // ⚠ THE BACK-FILL IS EMPTY, AND UNLIKE v29's AND v31's NO-OPS THAT IS NOT A BARGAIN WITH A PRUNED
  // LOG - THERE IS GENUINELY NOTHING TO RECONSTRUCT. v18 mined surviving evidence, v28 rebuilt a
  // split from finish indices, v31 declined to guess at a count it could not see. All three were
  // looking at a record of things that HAD HAPPENED. An offer is a record of a DECISION, and no
  // decision was ever taken: until this version the kit deal was not a decision at all. It was
  // weather - `reviewLocalSponsor` added $1,000 or $2,000 to the balance at the season boundary and
  // wrote a line in the feed, and the player was never asked. There is no earlier state that means
  // "he signed" or "he refused", because there was nothing to sign.
  //
  // This is v26's case exactly, and for the same reason: fabricating rows here would mean fabricating
  // decisions the player never made, which is the one thing a ledger OF decisions must never contain.
  // A migrated career therefore wakes up with an empty inbox and gets its first real letter at its
  // next season boundary, like any other.
  //
  // ⚠ AND THE CASH IT WAS RECEIVING SIMPLY STOPS, which is worth being explicit about because it is
  // the one migration in this file that leaves a career materially poorer. Nothing is clawed back -
  // every grant already banked stays banked, and the events that announced them stay in the feed -
  // but the season boundary after the update raises a letter instead of a cheque, and the parent has
  // to sign it. That is the whole point of the slice («кит вместо денег») rather than a side effect
  // of it, and the deal she can sign is worth the same figure in kit that it used to be in money.
  //
  // Written defensively (an absent or non-array value is rebuilt whole) for the append-only reason
  // v30 states: a later step must not assume an earlier one's post-condition still reads the way it
  // did the day it was written.
  //
  // Nothing else moves: no field is read or rewritten, and the one sub-stream this slice adds
  // (`seed:offer:<week>`) did not exist before, so no existing stream shifts by a draw and the frozen
  // MAIN capture (41550 / e6b0c709) is untouched by construction.
  if (v === 31) {
    if (!Array.isArray(save.offers)) save.offers = []
    v = 32
  }

  // v32 -> v33: `offer.terms` gains `covers` / `travelShare` / `seasons` – THE BRAND LADDER. A
  // sponsorship rung stopped being one shop and became three, and the rung says WHICH OF HER
  // EQUIPMENT LINES the deal covers (strings / +frames / everything + a hand with the travel). See
  // `SponsorTier` for the design and ECONOMY.sponsorship for every number.
  //
  // ⚠ THIS ONE BACK-FILLS RATHER THAN DECLINING TO, WHICH IS THE OPPOSITE OF v32 A LINE ABOVE - and
  // the difference is exactly the one v32's own comment draws. v32 refused to mine because an offer
  // is a record of a DECISION and no decision had ever been taken. Here a decision HAS been taken:
  // a v32 career may be sitting on a signed contract this very week, and the three new fields are
  // not a guess about what the player chose - they are the terms of the deal he already agreed to,
  // written down. Refusing to fill them would not be modesty, it would be losing a contract.
  //
  // ⚠ AND THE VALUE IS THE OLD BEHAVIOUR, NOT THE NEW RUNG'S. Every v32 deal is a `local` one, and
  // under v32 a local deal covered ALL THREE LINES: `KIT_DEAL_CATEGORIES` was ['rackets',
  // 'stringing', 'shoes'] and the freshness cap applied to every line of `KitWear`. Under v33 a
  // local deal covers her strings alone. So a back-fill of `TIER_COVERS.local` would quietly take
  // two lines away from a contract the letter had already promised them on - it would be re-writing
  // history in the brand's favour, on paper the player still has in his inbox. `activeKitDeal` has
  // said since the day it shipped that "a deal signed under one set of numbers is honoured under
  // those numbers for its whole life"; this is that rule meeting its first real test, and the
  // migration honours the letter that was actually sent.
  //
  // `travelShare` is 0 (no rung paid for travel before this version) and `seasons` is 1 (every v32
  // deal ran for exactly one season, which is what `untilWeek` on those saves already says - and
  // `untilWeek` is NOT recomputed here for the same reason `covers` is not: the term she signed is
  // the term she gets).
  //
  // Written defensively (a malformed terms object is skipped rather than trusted, an already-filled
  // one is left alone) for the append-only reason v30 states, which also makes it idempotent.
  //
  // Nothing else moves: no field is removed, no sub-stream is added or reordered, and the arrival
  // draw stays on `seed:offer:<week>` where it has been since v32 - so the frozen MAIN capture
  // (41550 / e6b0c709) is untouched by construction.
  if (v === 32) {
    const ALL_LINES = ['strings', 'frame', 'shoes']
    for (const offer of Array.isArray(save.offers) ? save.offers : []) {
      const terms = (offer as unknown as { terms?: Record<string, unknown> } | null)?.terms
      if (!terms || typeof terms !== 'object') continue
      if (!Array.isArray(terms.covers)) terms.covers = ALL_LINES
      if (typeof terms.travelShare !== 'number') terms.travelShare = 0
      if (typeof terms.seasons !== 'number') terms.seasons = 1
    }
    v = 33
  }

  // v33 -> v34: THE ON-RAMPS SHE HAS ALREADY CROSSED.
  //
  // `WorldState.onRampCleared` latches the bottom rung of each table open once she has cleared its
  // band, because the band is denominated in a ROLLING 52-WEEK window and the evidence therefore
  // deletes itself (see the field's own note, and tools/j30-onramp-lock.ts for what that cost).
  //
  // ⚠ THE BACK-FILL IS EXACT, NOT BEST-EFFORT, and that is worth spelling out because a save's
  // `results` are pruned to 52 weeks and would have made it a guess. `bestFinishByTier` is a
  // HIGH-WATER MARK that is never pruned: a tier appears in it if she has ever finished an event
  // there. So "has she ever been on the ITF table" is answerable exactly, for every existing save,
  // however long ago it happened - which is the difference between a girl keeping the access she
  // earned and a girl being asked to earn it twice.
  //
  // Three sources, OR-ed, weakest last:
  //   * a finish recorded at any rung of the table          - durable, never pruned;
  //   * a counting result on it inside the current window   - she is out there right now;
  //   * the on-ramp's band met today                        - the standard the rung asks for.
  // The last two are what `latchOnRamps` re-checks on every tick anyway, so they are here only so a
  // migrated save is already correct BEFORE its first tick - nothing depends on them being complete.
  //
  // Written defensively and idempotently (an already-filled object is left alone, a malformed one
  // replaced) for the append-only reason v30 states. No field is removed, no sub-stream is added or
  // reordered, and not one draw is taken - so the frozen MAIN capture (41550 / e6b0c709) cannot move.
  if (v === 33) {
    const best = (save.bestFinishByTier ?? {}) as Record<string, unknown>
    const played = (tiers: string[]) => tiers.some((t) => best[t] !== undefined)
    const results = Array.isArray(save.results) ? (save.results as { playerId?: string; tier?: string }[]) : []
    const hasResultOn = (tiers: string[]) =>
      results.some((r) => r.playerId === KID_ID && typeof r.tier === 'string' && tiers.includes(r.tier))
    const ITF = ['j30', 'j60', 'j300']
    const WTA = ['w15', 'w35', 'w100']
    const current = save.onRampCleared as { itf?: unknown; wta?: unknown } | undefined
    if (!current || typeof current !== 'object') {
      save.onRampCleared = {
        itf: played(ITF) || hasResultOn(ITF),
        wta: played(WTA) || hasResultOn(WTA),
      }
    }
    v = 34
  }

  // v34 -> v35: THE PERSISTED MAIN POSITION (docs/review/proposals/P3-rng-persistence.md).
  // `WorldState.rngMain` — mulberry32's register plus the cumulative MAIN draw count — becomes
  // state, and loading a career stops replaying every week it ever played just to move a 32-bit
  // number to the right place.
  //
  // ⚠ THIS BLOCK RUNS THE REPLAY IT RETIRES, ONCE, AND THAT IS THE WHOLE DESIGN. `replayMainState`
  // is byte-identical to what `restoreRng` did on every single load until today: a fresh probe
  // world on the same seed, one `tickWeek` per elapsed week, no entries — valid because the
  // per-week MAIN draw count is independent of player input. The difference is the tense: every
  // load PAID this forever; this block pays it for the LAST time per career and writes the answer
  // down. tests/migrations.test.ts pins the computed `{s, n}` for the v34 fixture as a frozen
  // expectation, so a future tickWeek change that would silently drift this replay goes loudly red
  // instead.
  //
  // ⚠ AND IT IS A LIVE-HELPER CALL, WHICH THIS FILE OTHERWISE AVOIDS — accepted DELIBERATELY (the
  // review's own LOW finding, docs/review/01-architecture.md). The usual argument against reaching
  // into live code from a migration is that the helper drifts and the migration silently changes
  // meaning. Here that drift is (a) exactly as dangerous as it already was for every load under
  // the old regime — the replay IS what loads did — and (b) pinned by the fixture expectation
  // above, which is more protection than the old per-load replay ever had.
  //
  // Defensive and idempotent like every block above: a well-formed pair already present is never
  // recomputed (a second pass through this file must not re-roll a position the first one stamped
  // — and more importantly, must not OVERWRITE a live position with a week-boundary one). The
  // deeper integrity question — does the pair actually satisfy the s/n algebra — deliberately does
  // NOT live here: append-only blocks upgrade versions, they do not audit the current one. The
  // worker's `verifyMainState` audits every load and routes a corrupt pair through
  // `recoverMainState`, which replays exactly like this block does.
  if (v === 34) {
    const st = save.rngMain as MainRngState | undefined
    if (!st || typeof st.s !== 'number' || typeof st.n !== 'number') {
      save.rngMain = replayMainState(
        String(save.seed),
        save.profile as PlayerProfile,
        typeof save.week === 'number' ? save.week : 0,
      )
    }
    v = 35
  }

  // v35 -> v36: `world.proEntryWeeks` – THE PRO AER LEDGER (W2-LADDER, act2-pro-tour.md §5). The
  // WTA's own age-eligibility rule (the Capriati rule) gets the junior cap's PARALLEL structure:
  // its own capped family (the W rungs), its own age table (16 -> 12, 17 -> 16, 18+ unlimited),
  // and this second persisted ledger – entered at enter-time, spliced on a refunding withdrawal,
  // kept on every forfeiting exit, exactly like `internationalEntryWeeks` and never merged with it
  // (the real rules are "separate from and additional to" each other, research §4).
  //
  // ⚠ THE BACK-FILL IS AN EMPTY LEDGER, v15's OWN BARGAIN AT ITS OWN VERSION, and the argument
  // transfers verbatim: nothing in an older save can reconstruct the entries this cap exists to
  // count. The kid's result row is award-only, so a first-round W15/W35 exit leaves NO row at all;
  // `world.entries` prunes to future events the week one is played; and unlike v34's latches there
  // is no never-pruned high-water mark that records ENTRY (bestFinishByTier records finishes, and
  // a finish is not an entry – a walkover week has the one and not the other). So a migrated
  // career resumes with this season's pro allowance untouched – the LENIENT direction, on purpose:
  // the alternative invents a number and possibly locks a loaded sixteen-year-old out of a tier
  // she was mid-way through. Careers at 18+ never feel it at all (the default row is unlimited).
  //
  // Idempotent (an existing array is never touched, so a re-migration cannot drop a slot) and
  // defensive in v30's sense. Nothing else moves: no sub-stream is added or reordered, not one
  // draw is taken – the entry cap family is post-draw gating end to end – so the frozen MAIN
  // capture (41550 / e6b0c709) is untouched by construction.
  if (v === 35) {
    if (!Array.isArray(save.proEntryWeeks)) save.proEntryWeeks = []
    v = 36
  }

  // v36 -> v37: `world.kit` - THE QUALITY LADDER THE PLAYER CHOOSES (W3-KIT). The equipment model has
  // had a CONDITION axis since it shipped and no QUALITY axis at all; the owner ruled that it needs
  // both, «как с тренерами», because an aluminium starter frame really is heavier, slower and harder
  // on the arm than a composite one. A rung per line is therefore a decision, and this engine never
  // re-derives a decision - hence the first persisted field the equipment model has ever needed.
  //
  // ⚠ THE BACK-FILL IS THE SHIPPED RUNG, AND THAT IS THE ONLY VALUE THAT COULD BE CORRECT. `composite`
  // is the ladder's identity element by construction: zero `startWear`, `lifeFactor` 1, `priceFactor`
  // 1 (ECONOMY.equipment.grades). So a migrated career's wear curve, its injury threshold and its gear
  // bills are BYTE-IDENTICAL to what they were the week before it was loaded, which is what "old saves
  // open unchanged" has to mean for a field that feeds the match engine. Filling `alloy` instead would
  // silently make every existing girl worse at everything on load - the exact behavioural surprise
  // this project's migration rules exist to prevent - and filling `pro` would hand her the top of a
  // ladder she never bought and leave the owner's own save with nothing to spend on.
  //
  // ⚠ `sinceWeek` IS ZERO, WHICH READS AS "NEVER BOUGHT ONE BY HAND" AND IS ALSO A NO-OP. `kitWearAt`
  // takes the more recent of the scheduled purchase and the hand purchase; `week - 0` is `week`, which
  // is exactly what `weeksSinceGear` returns before the first scheduled hit, so the minimum is the
  // scheduled clock on every line at every week. Nothing about her condition moves.
  //
  // Defensive and idempotent in v30's sense: an object already carrying a well-formed `grade` is left
  // alone (a second pass must not reset a rung the player bought), a malformed one is replaced, and a
  // missing LINE inside an otherwise valid object is filled with the shipped rung rather than left
  // undefined - `kitWearAt` indexes it directly. No sub-stream is added or reordered and not one draw
  // is taken: the ladder is post-draw arithmetic end to end (`resolveGear` still bills exactly the
  // cents `seed:gear:<category>` produces, and multiplies afterwards), so the frozen MAIN capture
  // (41550 / e6b0c709) is untouched by construction.
  if (v === 36) {
    const GRADES: readonly string[] = ['alloy', 'composite', 'performance', 'pro']
    const LINES = ['strings', 'frame', 'shoes'] as const
    const current = save.kit as { grade?: Record<string, unknown>; sinceWeek?: Record<string, unknown> } | undefined
    const grade = {} as KitGrades
    const sinceWeek = {} as Record<KitLine, number>
    for (const line of LINES) {
      const held = current?.grade?.[line]
      grade[line] = typeof held === 'string' && GRADES.includes(held) ? (held as KitGrades[KitLine]) : 'composite'
      const since = current?.sinceWeek?.[line]
      sinceWeek[line] = typeof since === 'number' && Number.isFinite(since) && since >= 0 ? since : 0
    }
    save.kit = { grade, sinceWeek }
    v = 37
  }

  // v37 -> v38: THE PENALTY LEDGER (W3-ACT2, act2-pro-tour.md §6). Two fields, both created empty:
  // `penalties` (one row per charge the TOUR has made, with the week, the points and the rule) and
  // `suspendedUntilWeek` (the sentence it handed down, or null).
  //
  // ⚠ THE BACK-FILL IS THE IDENTITY, AND HERE THAT IS NOT MERELY THE SAFE CHOICE BUT THE ONLY
  // TRUTHFUL ONE. The regime did not exist before this version, so no career has ever been charged
  // anything - inventing history would mean fining a player retroactively for a rule she was never
  // told about, which is precisely what «мы ни за что не наказываем» and §6's "announced before it
  // can bite" forbid. A migrated career therefore wakes up owing nothing and free to play, and the
  // first obligation it ever meets arrives as a letter like everybody else's.
  //
  // ⚠ AND IT IS NOT A NO-OP FOR A TOP-50 CAREER, which is worth saying plainly: a save loaded here
  // may already be inside the standing the regime binds, so the very next mandatory entry deadline
  // it ticks past will write its first letter. That is the correct behaviour - the letter is the
  // announcement - and it is the reason the warning fires at the DEADLINE rather than at the event.
  //
  // Defensive and idempotent in v30's sense (a well-formed array is left alone, a malformed value is
  // replaced). No sub-stream is added or reordered and not one draw is taken: the whole regime is
  // post-draw bookkeeping, so the frozen MAIN capture is untouched by construction.
  if (v === 37) {
    if (!Array.isArray(save.penalties)) save.penalties = []
    const held = save.suspendedUntilWeek
    save.suspendedUntilWeek = typeof held === 'number' && Number.isFinite(held) ? held : null
    v = 38
  }

  // v38 -> v39: WHERE THE CAREER ENDS (W2-ENDINGS, career-contract-v1.md §4). Seven fields, and
  // every one of them a fact no older save could have held: until this version nothing in the game
  // could end, so there is no history to reconstruct and no risk of inventing one.
  //
  // ⚠ THE ONE BACK-FILL THAT IS NOT THE IDENTITY IS `fork`, AND IT HAD TO BE. The fork at nineteen
  // is raised on her birthday week and blocks the advance until it is answered, so a career loaded
  // at twenty-four with `fork: null` would be stopped on the next tick and asked whether she wants
  // to stop at nineteen - about a decision she visibly made five years ago. She is twenty-four and
  // still playing; the only truthful reading of that is `continue`, and it is recorded as having
  // been answered on the birthday week it would have been asked on. A career still UNDER nineteen
  // gets `null` and is asked on the day, like everybody born after this version.
  //
  // ⚠ `careerTotals` IS EXACT FOR A YOUNG CAREER AND A DOCUMENTED UNDERCOUNT FOR AN OLD ONE, which
  // is the honest half of the same bargain v15 struck. `financeWeeks` prunes to a 60-week window
  // (FINANCE_WEEKS), so a save past its second season simply does not contain the money it spent in
  // its first - and `seasonHistory` keeps a NET delta per season, which cannot be split back into
  // gross in and gross out. The alternative was to invent a plausible number, and a reckoning built
  // on an invented number is worse than one that starts counting today. NOTE the visible
  // consequence, stated rather than hidden: a migrated career's album may show the break-even
  // crossing EARLIER than it truly happened, because the costs behind it were pruned before this
  // counter existed. Careers begun on v39 are exact.
  //
  // ⚠ `debtSinceWeek` RESTARTS THE SPELL rather than reconstructing it. A family loaded under water
  // gets the full grace window from the week it loads, which is the generous direction on purpose -
  // the alternative is a career that opens and ends in the same click, for weeks the player was
  // never warned about because the warning did not exist yet.
  //
  // Defensive and idempotent in v30's sense (a well-formed value is left alone, a malformed one is
  // replaced). No sub-stream is added or reordered and not one draw is taken: every ending is
  // post-draw state, so the frozen MAIN capture (41550 / e6b0c709) is untouched by construction.
  if (v === 38) {
    if (save.ending === undefined || typeof save.ending !== 'object') save.ending = null
    const funds = typeof save.fundsCents === 'number' ? save.fundsCents : 0
    const week = typeof save.week === 'number' ? save.week : 0
    if (typeof save.debtSinceWeek !== 'number') save.debtSinceWeek = funds < 0 ? week : null
    const totals = save.careerTotals as { earnedCents?: unknown } | undefined
    if (!totals || typeof totals.earnedCents !== 'number') {
      const fw = (Array.isArray(save.financeWeeks) ? save.financeWeeks : []) as FinanceWeek[]
      let earnedCents = 0
      let spentCents = 0
      let prizeCents = 0
      for (const w of fw) {
        for (const [cat, amt] of Object.entries(w.byCategory ?? {}) as [WorldEventCategory, number][]) {
          if (amt > 0) earnedCents += amt
          else spentCents += -amt
          if (cat === 'prize') prizeCents += amt
        }
      }
      // ⚠ THE CAST IS TYPE-ONLY AND THE MIGRATION IS UNCHANGED (v40 added
      // `careerTotals.weeksLostToInjury`). A shipped migration writes the shape ITS OWN version
      // froze - v39 knew three counters - and the v40 block below is what upgrades it. Widening
      // this line to the new shape would make a v38 save skip straight to a v40 object, which is
      // exactly the edit the append-only rule forbids.
      save.careerTotals = { earnedCents, spentCents, prizeCents } as CareerTotals
    }
    if (save.fork === undefined || typeof save.fork !== 'object') {
      const profile = save.profile as PlayerProfile | undefined
      const birthMonth = profile?.birthMonth ?? DEFAULT_PROFILE.birthMonth
      const nineteenth = nineteenthBirthdayWeek(birthMonth, week)
      // ⚠ THE CAST IS TYPE-ONLY AND THIS MIGRATION IS UNCHANGED – the same idiom, and the same
      // reason, as `careerTotals` eight lines up (v51 added `ForkState.offer`). v39 froze a fork with
      // two fields and that is what it must keep writing; the v51 block at the end of this file is
      // what back-fills `offer: null` onto it. Widening this line would make a v38 save skip straight
      // to a v51 shape, which is the edit the append-only rule forbids.
      save.fork =
        frozenMonthClockAge(week, birthMonth) >= 19 ? ({ askedWeek: nineteenth, answer: 'continue' } as ForkState) : null
    }
    if (save.retirementOffer === undefined || typeof save.retirementOffer !== 'object') {
      save.retirementOffer = null
    }
    if (typeof save.oneMoreYearCount !== 'number') save.oneMoreYearCount = 0
    if (save.college === undefined || typeof save.college !== 'object') save.college = null
    v = 39
  }

  // v40 – THE WEEKS-LOST COUNTER (docs/specs/fatigue-injury-audit-2026-08.md §6).
  //
  // `careerTotals.weeksLostToInjury` is the monotone total of the weeks her body has spent off
  // court. It exists because `injuryHistory` is PRUNED to its last twenty rows by `rollInjury`,
  // while the career-ending injury (#4) is keyed on the SUM of that list – so the accumulator went
  // short exactly on the bodies the rule is about. Measured over 90 full careers: 13 reached the
  // cap, and 1.4% of onsets were judged against a total a mean of 6.1 weeks light.
  //
  // ⚠ THE BACK-FILL IS EXACT FOR EVERY CAREER UNDER TWENTY LAYOFFS AND AN HONEST UNDERCOUNT ABOVE
  // IT, and there is no third option: the pruned rows are gone from the save and no other field
  // records them (`events` prunes at 400, `milestones` keeps only the FIRST injury, `seasonHistory`
  // keeps no medical column at all). Undercounting is also the safe direction – `weeksLostSoFar`
  // takes the LARGER of the counter and the surviving history, so a migrated career can never have
  // its ending fire on weeks it did not lose, and starts counting exactly from the load.
  //
  // Defensive and idempotent in v30's sense; zero draws on any stream, so the frozen MAIN capture
  // (41550 / e6b0c709) is untouched by construction.
  if (v === 39) {
    const totals = (save.careerTotals ?? {}) as { weeksLostToInjury?: unknown }
    if (typeof totals.weeksLostToInjury !== 'number' || !Number.isFinite(totals.weeksLostToInjury)) {
      const history = (Array.isArray(save.injuryHistory) ? save.injuryHistory : []) as { weeksOut?: unknown }[]
      const lost = history.reduce((sum, h) => sum + (typeof h.weeksOut === 'number' ? h.weeksOut : 0), 0)
      save.careerTotals = { ...(save.careerTotals as object), weeksLostToInjury: lost } as CareerTotals
    }
    v = 40
  }

  // v41 – THE SPONSOR WINDOW LANDS EVERY RUNNING CONTRACT ON A SEASON BOUNDARY
  // (docs/specs/sponsor-window-2026-08.md).
  //
  // Two fields on the kit deals in the inbox, and both are forced by the same change of schedule.
  // Letters now arrive across weeks 47-51 and a contract ends on week 49 (`contractEndWeek`), so for
  // three weeks a year the next deal can be signed while the present one is still supplying her.
  //   * `fromWeek` – the first week the deal covers. It used to be `decidedWeek`, which is exactly
  //     what a migrated deal meant by it, so the back-fill is EXACT rather than a reconstruction.
  //   * `untilWeek` – snapped to the contract end of the season it was already going to finish in.
  //
  // ⚠ THE DIRECTION OF THE SNAP, STATED, because it is the one thing a player could feel. Every deal
  // written before this version ends on the season year's LAST week (offset 51: `dealUntilWeek` ran
  // `seasons * 52 - 1` from the covered season's start, and `endDealWithSeason` used `seasonLastWeek`
  // for the same offset). Those land two weeks LATER than the new rule, so they are trimmed DOWN by
  // one or two weeks - and the weeks they give up are off-season weeks that carry no tournament, no
  // ranking and no entry, so the cost is at most a fortnight of the freshness ceiling. Anything
  // ending EARLIER in the year - which no shipped rule produces, but a hand-edited or future save
  // could - is rounded UP to the same week, because extending a promise is the safe direction and
  // shortening one is not. Both cases are the same single expression: the contract end of the season
  // the deal already died in.
  //
  // Defensive and idempotent in v30's sense: a value already on the boundary is left where it is, a
  // malformed one is skipped rather than trusted. Zero draws on any stream - a signed contract is
  // post-draw state - so the frozen MAIN capture (41550 / e6b0c709) is untouched by construction.
  if (v === 40) {
    const offers = Array.isArray(save.offers) ? (save.offers as unknown as Record<string, unknown>[]) : []
    for (const o of offers) {
      if (!o || typeof o !== 'object' || o.kind !== 'kit' || o.state !== 'signed') continue
      if (typeof o.fromWeek !== 'number' || !Number.isFinite(o.fromWeek)) {
        const decided = typeof o.decidedWeek === 'number' ? o.decidedWeek : o.week
        if (typeof decided === 'number' && Number.isFinite(decided)) o.fromWeek = decided
      }
      if (typeof o.untilWeek === 'number' && Number.isFinite(o.untilWeek) && o.untilWeek >= 0) {
        o.untilWeek = Math.floor(o.untilWeek / WEEKS_PER_YEAR) * WEEKS_PER_YEAR + (WEEKS_PER_YEAR - OFF_SEASON_WEEKS)
      }
    }
    v = 41
  }

  // ⚠⚠ v42 IS RESERVED FOR A CONCURRENT WAVE AND THIS RUNG IS A DELIBERATE NO-OP.
  //
  // The school wave was told to take v43 because another agent may take v42 on a branch that has not
  // landed. The ladder has to be TOTAL on this branch or `migrateSave` throws on every fixture, so
  // this bridge exists purely to carry a v41 save across an empty rung.
  //
  // ⚠ WHOEVER MERGES SECOND DELETES THESE THREE LINES. The other wave's own v41 -> v42 step replaces
  // them and MUST sit here, ABOVE the v42 -> v43 block below: the ladder is walked in file order, so
  // a real 41 -> 42 step placed after this bridge would never fire. That is the whole hazard, and it
  // is written here rather than in a merge note nobody reads.
  if (v === 41) {
    v = 42
  }

  // v43 – SCHOOL ENDS, AND A CAREER ALREADY PAST IT LEAVES ON LOAD
  // (docs/specs/school-ends-2026-08.md).
  //
  // THE FACT NEEDS NO MIGRATION AND THAT IS WORTH SAYING FIRST. `schoolIsOver(week, birthMonth)` is a
  // pure function of two numbers a save has always carried, so the moment this build reads the
  // owner's twenty-two-year-old career the exam fortnight is gone, the calendar draws a
  // professional's day and the School tile has left the classroom behind (round 23 #6 replaced the
  // terminal "School finished" with a stage that keeps moving). Nothing is stored and nothing can
  // drift.
  //
  // WHAT THE MIGRATION IS FOR IS THE MOMENT. `markSchoolEnd` fires on exactly one week, and for every
  // career already past that week it never fired - so the album's scroll would have a hole where a
  // life changed, and the owner, whose report this whole wave answers, would be the one player who
  // never sees the thing he asked for. This back-fills the milestone row at the week it happened.
  //
  // ⚠ THE MILESTONE ONLY, NOT THE FEED LINE, AND THE ASYMMETRY IS DELIBERATE. `world.events` is a
  // NEWS FEED: `pruneEvents` caps it at 400 rows oldest-first and the screens read its tail. A row
  // dated three seasons ago is either already past that horizon or arrives as an old headline in a
  // current feed. `milestones` is the durable ledger that is never pruned and is exactly where a
  // past moment belongs - the same reasoning v10 used when it rebuilt `bestFinishByTier` from
  // history rather than re-announcing it.
  //
  // ⚠ EXACT, NOT RECONSTRUCTED. The week is `schoolEndWeek(birthMonth)` - the same function the tick
  // calls - so a back-filled row and a captured one are byte-identical, and `milestoneKey` makes the
  // type its identity, so a save that already holds one is left alone.
  //
  // Defensive and idempotent in v30's sense; zero draws on any stream, so the frozen MAIN capture
  // (41550 / e6b0c709) is untouched by construction.
  if (v === 42) {
    const birthMonth = (save.profile as { birthMonth?: unknown } | undefined)?.birthMonth
    const week = save.week
    if (typeof birthMonth === 'number' && Number.isFinite(birthMonth) && typeof week === 'number') {
      const endWeek = schoolEndWeek(birthMonth)
      const rows = Array.isArray(save.milestones) ? (save.milestones as Milestone[]) : []
      if (week >= endWeek && !rows.some((m) => m && m.type === 'school')) {
        rows.push({ type: 'school', week: endWeek })
        save.milestones = rows
      }
    }
    v = 43
  }

  // v44 – THE WEEKLY BILL SPLITS IN TWO, AND AN OLD SAVE'S HISTORY IS LEFT ALONE
  // (docs/specs/split-the-bill-2026-08.md).
  //
  // WHAT CHANGED IS THE PROTOCOL, NOT THE STATE. `WorldEventCategory` gains 'facility' – the court
  // half of the training bill, split off 'coaching' because the owner could not read his own bill
  // («нам нужно отдельной строчкой списывать тренера, а отдельной рент залов и прочего»). A new
  // member of that union is a schema change by the rule in CLAUDE.md §3, so the version moves and
  // this step exists; there is no field to add, rename or default.
  //
  // ⚠ AND IT DELIBERATELY BACK-FILLS NOTHING. Every 'coaching' row a v43 save holds – in `events`
  // and in `financeWeeks[].byCategory` – is the number that was ACTUALLY charged as one line, and
  // there is no honest way to say which cents of it were the court: the split needs the hourly rate
  // and the hours of the week it was drawn in, and `financeWeeks` keeps a total per category and
  // nothing else. A reconstruction would be a guess wearing a ledger's clothes. So history stays as
  // it was billed, the next tick starts splitting, and the Money screen's category list simply gains
  // a row that begins at the load week. `byCategory` is a Partial record, so a missing 'facility'
  // key reads as absent everywhere rather than as zero.
  //
  // Zero draws on any stream; the frozen MAIN capture is untouched by construction.
  if (v === 43) {
    v = 44
  }

  // v45 – THE SEASON MIRROR OPENS ITS LEDGER, AND DELIBERATELY BACK-FILLS NOTHING
  // (docs/specs/season-mirror-2026-08.md).
  //
  // `seasonEntries` counts, at the moment each entry is committed, how many of the season's tournaments
  // were entered into a best-N book that could not have taken their title. The wrap-up prints the pair.
  //
  // ⚠ IT CANNOT BE BACK-FILLED AND IT MUST NOT PRETEND TO BE, which is the whole content of this step.
  // The judgement is about the book she held ON THE WEEK SHE ENTERED – her results over the 52 weeks
  // before it – and `pruneResults` keeps only `world.week - r.week <= 52`, so the book behind an entry
  // made two weeks ago is already partly gone and the book behind one made in week 3 of a season being
  // wrapped in week 49 is gone entirely. That is the same 49-week hole `seasonStartRank` (v17) exists
  // because of, and it is why this is a capture rather than a fold.
  //
  // So the ledger opens AT THE LOAD WEEK and claims nothing about what came before it. The wrap-up's own
  // test is `fromWeek <= yearStart`: a career loaded mid-season shows NO LINE for the season in progress
  // and a real one from the next wrap onward. A zero would have been the wrong silence – "0 could not
  // move her ranking" is the good news, and printing it over a season nobody counted is the defect that
  // reported "no tournaments played" over a 44-19 record.
  //
  // ⚠ AND NOTE WHAT IS NOT CAPTURED, because it is what keeps the card self-consistent: each row stores
  // the two facts about her BOOK (both of which decay) plus the tier's own track (which does not). The
  // comparison against the table the season was played on happens at the WRAP, against the same
  // `rankTrack` the card prints two rows above the line.
  //
  // Idempotent in v30's sense (the field is only written when absent), and zero draws on any stream, so
  // the frozen MAIN capture (41550 / e6b0c709) is untouched by construction.
  if (v === 44) {
    if (!save.seasonEntries && typeof save.week === 'number') {
      save.seasonEntries = emptySeasonEntries(save.week)
    }
    v = 45
  }

  // v46 – THE SEASON HISTORY LEARNS WHICH TABLE IT IS TALKING ABOUT, AND AN OLD ROW KEEPS ITS ONE
  // HONEST FIGURE.
  //
  // The owner, twice, most recently 09.08: «Season by season в stats в разных вкладках всё ещё одно и
  // то же показывает.» He is right, the screen was not at fault, and this step is the reason it could
  // not have been: a `SeasonHistoryEntry` carried ONE `endRank` (the ITF one – the wrap writes
  // `world.kidRank`) and three folds (`points`, `wins`, `losses`, all three tables added together). The
  // three tabs showed one row because the record held one row. v46 banks `byTrack` beside them, and
  // every season wrapped from here on differs per table.
  //
  // ⚠⚠ AND THIS STEP DELIBERATELY BACK-FILLS NOTHING, WHICH IS THE WHOLE OF IT. A career saved before
  // v46 has one number per season per figure and NO WAY TO RECOVER THE OTHER TWO – not "expensively",
  // not "approximately": the evidence is deleted. `pruneResults` keeps `world.week - r.week <= 52`, so
  // the results that made season 1 were gone before season 3 opened; `events` caps at 400 rows;
  // `bestFinishByTier` is a career high-water mark with no year on it; `milestones` keeps the season's
  // rank and that rank is the ITF one again. This is the same 49-week hole `seasonStartRank` (v17) and
  // the season mirror (v45) both exist because of, and the same answer both gave.
  //
  // ⚠ WHAT AN OLD ROW THEREFORE SHOWS, stated here because this is where the decision is made rather
  // than in the component that obeys it:
  //   * INTERNATIONAL – its stored `endRank`. That number always WAS the ITF rank, so printing it under
  //     the international tab is not a reconstruction, it is the field being read where it belongs.
  //   * NATIONAL and PROFESSIONAL – no rank. A blank, never a zero and never the ITF number wearing
  //     another table's heading: «Professional rank #128» over a junior rank is exactly the class of
  //     claim that put «Rank #4» on Home against «#128» in Stats, and «Final national rank #3» over
  //     thirteen domestic events.
  //   * POINTS and W-L on every tab – the fold, marked as the fold. They are three tables added
  //     together and there is no tab they belong to, so the row says so instead of pretending. Deleting
  //     them would have been the other error: a 44-19 season is not nothing, and this table is the only
  //     place it survives.
  // A BLANK MEANS "NOT RECORDED" AND A ZERO MEANS "SHE SCORED NOTHING", and this project has been bitten
  // by that distinction before – which is why `byTrack` is left ABSENT here rather than written as three
  // zeroed rows. Absent is a shape the reader can recognise; three zeros are a lie it cannot.
  //
  // No field is added, renamed or defaulted, so the step is a bump – v44's own shape (`WorldEventCategory
  // +facility`), for v44's own reason. Zero draws on any stream: the frozen MAIN capture (41550 /
  // e6b0c709) is untouched by construction.
  if (v === 45) {
    v = 46
  }

  // v47 – THE WEEK BECOMES THE PLAN, AND A SHIPPED CAREER READS BACK AS ITSELF
  // (docs/specs/training-dials.md §10).
  //
  // `WeekPlan` gains `week: SessionKind[][]` – Monday..Sunday, each day holding the kinds she trains
  // that day. `train`/`rest` are kept as a PROJECTION of it, so every existing reader (`trainFactor`,
  // `coachHoursForPlan`, `knockChance`, `restRecoveryBonus`, `sessionsForPlan`) is untouched.
  //
  // ⚠⚠ THE MIGRATION HAS EXACTLY ONE HONEST ANSWER, AND `general` EXISTS SO THAT IT DOES. Every career
  // ever shipped has been running a single number: `growWeek` grows all five skills at one shared rate
  // off one shared luck draw, which is precisely what a week of `general` sessions means in v47. So the
  // week is rebuilt out of the display conventions the Calendar has been drawing all along –
  //
  //     sessions = sessionsForPlan(save.plan.train)   // 4 / 5 / 6, unchanged
  //     sessionDays(sessions)                         // which indexes are sessions, unchanged
  //     every session day -> ['general'],  every other day -> []
  //
  // – and the loaded career has the same session count, the same rate, the same bill, the same knock
  // chance and the same recovery it had before. `aimWeights` returns the all-ones vector for a week of
  // nothing but general practice, EXACTLY (integer arithmetic – see AIM_UNIT), so the skills it banks
  // on the week it is loaded are byte-identical rather than approximately so. That is §12 criterion 8
  // and tests/plan.test.ts proves it rather than asserting it.
  //
  // ⚠ THE DRAWN GYM DAY MIGRATES TO `general`, NOT `fitness`, AND THAT IS DELIBERATE. The gym day has
  // never been simulated – `growWeek` has never heard of it, and `gymDayIndex` is a display convention
  // that exists so the Calendar's Tuesday does not shuffle when a preset moves – so promoting it to a
  // real Fitness session on load would be the migration changing his game. The visible consequence is
  // small and honest: a loaded career opens with no gym day ticked, and the plan tab's first invitation
  // is to decide whether one of those days is one.
  //
  // ⚠ AND IT DOES NOT CLAMP TO 4..6 SESSIONS. A save poked to `train: 100` draws seven session days
  // today and must keep billing and developing exactly as it does (both readers clamp on their own).
  // The 4..6 band is a rule about new PLAYER input and is enforced in `setPlan`; applying it here would
  // be the migration editing a career rather than reading it.
  //
  // ⚠ WHAT THIS STEP DOES **NOT** MAKE IDENTICAL, stated here because it is the slice's one ruled
  // behavioural change and hiding it in a spec would be the wrong place: a migrated week is never
  // DOUBLED, and since v47 `summerLoadFactor` follows the doubling rather than the calendar (owner,
  // 10.08: «да»). So a loaded career's school-free weeks – the summer holidays, and every week past her
  // last school year – come back at 1.0 instead of the automatic 1.4 until he ticks a second session
  // onto a day. On every other week the load factor is 1 in both versions and the arithmetic is exact.
  // Measured on `school-ends-2026-08.md`'s own harness; see tools/school-bench.ts §4.
  //
  // Idempotent in v30's sense (the field is only written when absent), and zero draws on any stream, so
  // the frozen MAIN capture (41550 / e6b0c709) is untouched by construction.
  if (v === 46) {
    const plan = save.plan as { train?: number; week?: unknown } | undefined
    if (plan && !plan.week && typeof plan.train === 'number') {
      const days = new Set(sessionDays(sessionsForPlan(plan.train)))
      const week: SessionKind[][] = []
      for (let d = 0; d < PLAN_DAYS; d++) week.push(days.has(d) ? ['general'] : [])
      ;(plan as { week?: SessionKind[][] }).week = week
    }
    v = 47
  }

  // ⭐ v48 – THE BIRTHDAY BECOMES A THING THAT HAPPENED (docs/specs/birthday-and-gifts.md §2b).
  //
  // `birthdays: BirthdayRecord[]` – one row per birthday: the week, the age she turned, what she had
  // been asking for, and what was chosen.
  //
  // ⚠⚠ THE DEFAULT IS `[]` AND IT MEANS "NO BIRTHDAYS RECORDED" – NOT "gave nothing every year", and
  // the difference is the whole reason this step is three lines rather than a backfill. A career
  // shipped before this wave HAD birthdays: the feed said «She is sixteen this week» every year, and
  // `birthdayWeek` can name every one of them exactly. It would be easy, and wrong, to walk the
  // calendar and write a row per year with `given: null` – because that row is a STATEMENT, and the
  // statement would be that this parent gave his daughter nothing on every birthday of her life. He
  // was never asked. Absent is not zero (spec ship rule 5; the same distinction v45 and v46 were both
  // built around), and the diary is written to say nothing at all where there is no row.
  //
  // ⚠ AND NOTHING IS INVENTED FOR THE BIRTHDAY THE SAVE IS SITTING ON, either. A career loaded ON its
  // birthday week finds `pendingBirthday` non-null and gets the popup, which is exactly right: that
  // birthday has not been answered, because nobody could answer it before this build existed.
  //
  // Idempotent in v30's sense (the field is only written when absent), and zero draws on any stream –
  // the ask rides a purpose-scoped `seed:birthday:<age>` sub-stream that persists nothing – so the
  // frozen MAIN capture (41550 / e6b0c709) is untouched by construction.
  if (v === 47) {
    const w = save as { birthdays?: unknown }
    if (!Array.isArray(w.birthdays)) w.birthdays = []
    v = 48
  }

  // ⭐ v49 – THE COACH MAY BE SENT TO THE RUNGS THAT PAY HER NOTHING, AND IT IS THE PLAYER WHO SENDS
  // HIM (docs/specs/coach-travel-2026-08.md §5, the ⛔ finding).
  //
  // `coachOnJuniorEvents: boolean` – the nested half of the v24 travel stance. Until now the fare
  // simply REFUSED every rung with no prize money, which was the engine deciding on the family's
  // behalf. The owner overturned that on 15.08 – «делаем тогда» – with his own model of whose
  // decision it is: «По мне игрок сам решает: есть деньги - едет тренер, нет - не едет, или едет, но
  // быстрее банкротится.»
  //
  // ⚠⚠ THE DEFAULT IS `false` AND IT IS A PRESERVATION, NOT A CHOICE MADE FOR ANYBODY. Every career
  // written before this version was played under an engine where the junior fare did not exist, so
  // `false` is exactly what it has been doing since the day it was saved: the same fares on the same
  // rungs, the same ledger, the same match-strength helping (which follows the fare, so it cannot
  // drift from it). A migrated career is byte-identical in behaviour and the new option is simply an
  // unticked box the next time screen T is opened – which is also why nothing here reads the career's
  // wealth, age or results to guess an answer. It was never asked.
  //
  // ⚠ AND IT IS ADDED BESIDE `coachOnEventWeeks` RATHER THAN RETYPING IT. The tidier shape - one
  // scope field with three values - would have rewritten a boolean persisted since v24 and every
  // reader of it, for a decision that is genuinely a second, more expensive choice on top of the
  // first. Absent is not zero here either: it means "he has never been sent", which is what `?? false`
  // reads it as at the one place it is consulted (`coachTravelFareFor`).
  //
  // Idempotent in v30's sense (the field is only written when absent), and zero draws on any stream -
  // it is a stance, not an event - so the frozen MAIN capture (41550 / e6b0c709) is untouched by
  // construction.
  if (v === 48) {
    const w = save as { coachOnJuniorEvents?: unknown }
    if (typeof w.coachOnJuniorEvents !== 'boolean') w.coachOnJuniorEvents = false
    v = 49
  }

  // v50 – THE COLLEGE YEARS GET A LEDGER, AND A CAREER ALREADY INSIDE THE FREEZE KEEPS ITS SPAN
  // (P5, docs/specs/college-as-a-second-act-2026-08.md).
  //
  // `CollegeState` gains `years: CollegeYear[]` and `pendingCallUp`, because the four-year skip is
  // spent one year at a time now and each year is a row nothing else can reconstruct: `pruneResults`
  // deletes a result 52 weeks after it happened and `financeWeeks` keeps a 60-week window, so by the
  // fourth year's card there is no way back to what her rank or her balance was in the first.
  //
  // ⚠ IT BACK-FILLS AN EMPTY LEDGER AND DELIBERATELY INVENTS NO ROWS. A v49 career mid-freeze has
  // lived some of those weeks and there is no honest way to say what they contained – the
  // measurements were never taken, and `pruneResults` has already deleted the evidence. So her ledger
  // opens empty and the next year she spends is her first ROW, not her first year. The alternative
  // (fabricating rows from the span) would have put invented numbers on the one screen this phase
  // exists to make honest.
  //
  // ⚠ AND HER SPAN IS UNTOUCHED, WHICH IS WHAT KEEPS THE MIGRATION SAFE. `untilWeek` still says when
  // the scholarship ends and `inCollege` still reads it, so every one of the freeze's guards answers
  // exactly as it did. What she loses is the record of the years already behind her; what she keeps
  // is the career.
  //
  // Idempotent in v30's sense (each field is written only when absent or the wrong shape), and zero
  // draws on any stream, so the frozen MAIN capture (41550 / e6b0c709) is untouched by construction.
  if (v === 49) {
    const w = save as { college?: { years?: unknown; pendingCallUp?: unknown } | null }
    if (w.college !== null && typeof w.college === 'object' && w.college !== undefined) {
      if (!Array.isArray(w.college.years)) w.college.years = []
      if (w.college.pendingCallUp === undefined) w.college.pendingCallUp = null
    }
    v = 50
  }

  // v51 – THE COLLEGE ANSWER GETS A PRICE, AND A CAREER ALREADY STANDING AT THE FORK IS NOT QUOTED
  // ONE AFTER THE FACT (docs/specs/what-the-college-place-costs-2026-08.md).
  //
  // `ForkState` gains `offer: CollegeOffer | null` – a place, an athletics share, a need-based share
  // and the family's bill, measured the week the fork is raised. Before v51 the third answer was
  // offered unconditionally AND FREE in 100% of careers: `docs/research/college-and-the-junior-exit.md`
  // §1d prices a real year at $30,990 in-state and the NCAA's own page says *"Most scholarships are
  // partial"*, so neither half of "free, always" was a model of the thing.
  //
  // ⚠⚠ IT BACK-FILLS `null` AND DELIBERATELY INVENTS NO OFFER, which is v50's discipline applied to
  // the next field along. The offer is in principle re-derivable – it reads `bestFinishByTier`, a
  // high-water mark, and a `seed:collegeoffer:<week>` sub-stream – but a migration that re-derived it
  // would have to import the engine's own constants and would then quote a v50 career a bill it never
  // agreed to, halfway through a decision it had already been shown. `null` reads as "never
  // measured", NOT as "refused": the card still draws three answers, `answerFork` still refuses
  // nothing, and `resolveCollegeBill` charges a null offer nothing at all. She keeps the career and
  // the free ride she was promised; only careers that reach the fork from here get a price.
  //
  // ⚠ AND THE REFUSAL HAS ITS OWN SHAPE INSIDE THE OFFER, so `null` never has to carry two meanings:
  // `offer.programme === null` is "no programme saw her", and even that enrols her as a walk-on.
  //
  // Idempotent in v30's sense (the field is written only when absent), and zero draws on any stream –
  // it writes a literal – so the frozen MAIN capture (41550 / e6b0c709) is untouched by construction.
  if (v === 50) {
    const w = save as { fork?: { offer?: unknown } | null }
    if (w.fork !== null && typeof w.fork === 'object' && w.fork !== undefined) {
      if (w.fork.offer === undefined) w.fork.offer = null
    }
    v = 51
  }

  // v52 – A COLLEGE TIER STOPS BEING A FUNDING SHARE AND BECOMES A PLACE WITH A PRICE, AND A CAREER
  // ALREADY PAYING FOR ONE KEEPS PAYING EXACTLY WHAT IT AGREED TO
  // (docs/specs/the-college-choice-2026-08.md).
  //
  // v51 froze `ForkState.offer` as ONE quote – `{ programme: 'strong'|'solid'|'small'|null,
  // athleticShare, needShare, costPerYearCents, familyPerYearCents }` – where `programme` was a
  // FUNDING BAND her junior record had bought and the price was the same at every band. The owner's
  // scheme of 17.08 is the other way round: three PLACES with three sourced prices, and the PLAYER
  // picks one. So the offer is now a list of quotes plus the one she chose.
  //
  // ⚠⚠ IT REBUILDS ONE QUOTE, NOT THREE, AND THAT IS THE `null`-INVENTS-NOTHING DISCIPLINE AGAIN.
  // A v51 career was quoted exactly one price and may be four weeks into paying it. The two places it
  // was never shown are not facts about it, and writing them would mean re-deriving an award against
  // tiers that did not exist when the career agreed to its bill – the same silent re-pricing the v51
  // block refused. So the migration carries across what was actually measured:
  //
  //   * the TIER is read off the PRICE, which is the one field that identifies a place: $30,990 is
  //     the public in-state sticker ('state') and $50,920 the out-of-state one ('national'). Those
  //     were the only two v51 could produce. Anything else falls back to 'state' rather than throwing –
  //     a save that will not load is worse than a save that loads with the cheap label.
  //   * `chosen` is that tier IF she took the college answer, and `null` otherwise, so a career still
  //     standing at the fork is still standing at it and `resolveCollegeBill` charges it nothing.
  //   * `open: true`, because it was quoted to her – residence had already been applied upstream.
  //   * `canPayPerYearCents: null` = NEVER MEASURED. v51 never asked whether the family could afford
  //     the place, and a migration that answered would be inventing. The card prints nothing for it.
  //
  // ⚠ THE BILL IS BYTE-IDENTICAL ACROSS THE MOVE. `familyPerYearCents` is copied, `chosenQuoteOf`
  // returns this quote, and the weekly debit is the same arithmetic on the same number.
  //
  // Idempotent in v30's sense (it converts only the frozen shape, recognised by `programme` being
  // present), and zero draws on any stream – it writes literals – so the frozen MAIN capture
  // (41550 / e6b0c709) is untouched by construction.
  if (v === 51) {
    const w = save as { fork?: { answer?: unknown; offer?: Record<string, unknown> | null } | null }
    const offer = w.fork && typeof w.fork === 'object' ? w.fork.offer : null
    if (offer && typeof offer === 'object' && 'programme' in offer) {
      const cost = typeof offer.costPerYearCents === 'number' ? offer.costPerYearCents : 30_990_00
      const tier = cost === 50_920_00 ? 'national' : 'state'
      w.fork!.offer = {
        quotes: [
          {
            tier,
            costPerYearCents: cost,
            athleticShare: typeof offer.athleticShare === 'number' ? offer.athleticShare : 0,
            needShare: typeof offer.needShare === 'number' ? offer.needShare : 0,
            familyPerYearCents: typeof offer.familyPerYearCents === 'number' ? offer.familyPerYearCents : cost,
            open: true,
          },
        ],
        chosen: w.fork!.answer === 'college' ? tier : null,
        canPayPerYearCents: null,
      }
    }
    v = 52
  }

  // v52 -> v53: THE FIELD'S SEASON LEDGER. `fieldSeasonPoints` is what each professional has earned
  // since January, so the professional table stops being a pure function of (seed, season).
  //
  // ⚠ THE BACK-FILL IS EMPTY, AND THAT IS A PRESERVATION RATHER THAN A DEFAULT CHOSEN FOR ANYBODY.
  // Every career saved before v53 was played under an engine that discarded the field's results, so
  // an empty tally is exactly what those seasons contained - the same table, the same ranks, the same
  // acceptance cuts as the week it was saved. Inventing a tally would rewrite her standing retroactively
  // against results this save never had.
  //
  // ⚠ AND IT FILLS ITSELF FROM THE NEXT TOURNAMENT WEEK ON, so an old save is a season behind for at
  // most the rest of its current season and is level from the next wrap.
  if (v === 52) {
    if (save.fieldSeasonPoints === undefined) save.fieldSeasonPoints = {}
    v = 53
  }

  // v53 -> v54: HER OWN BANK ACCOUNT (round-23 #18). `kidFundsCents` is the balance the prize split
  // in `finalizeTournament` pays into from her eighteenth birthday – see `ECONOMY.kidShare`.
  //
  // ⚠ THE BACK-FILL IS ZERO, AND ZERO IS THE TRUE VALUE RATHER THAN A PLACEHOLDER. This is v30's
  // case and not v29's: no build before this one ever transferred a cent to her, so there is no
  // history being declined – there is no history. A migrated career keeps every dollar it ever
  // banked (nothing is clawed back out of `fundsCents`) and starts splitting from its next cheque.
  //
  // ⚠ AND IT COULD NOT BE RECONSTRUCTED EVEN IF IT SHOULD BE. `financeWeeks` prunes at sixty weeks
  // and `results` at fifty-two, so a twenty-six-year-old's save holds no trace of the cheques she
  // was paid at nineteen. `careerTotals.prizeCents` survives, but it is a career total with no ages
  // attached, and the ramp is a function of her age at each cheque – applying today's percentage to
  // it would invent a number, which is the one thing a balance must never be.
  //
  // Defensive (an absent or non-numeric value is written whole) for the append-only reason v30
  // states, which also makes it idempotent. It writes a literal: zero draws on any stream, so the
  // frozen MAIN capture (41550 / e6b0c709) is untouched by construction.
  if (v === 53) {
    if (typeof save.kidFundsCents !== 'number' || !Number.isFinite(save.kidFundsCents)) save.kidFundsCents = 0
    v = 54
  }

  // ⭐⭐⭐ v54 -> v55: THE STRANDED REVEAL IS CLEARED (round 24, the freeze's hygiene). A REPAIR, and
  // the only one in this file that is not a shape change – nothing is added, nothing is renamed.
  //
  // ⚠⚠ WHY A CAREER CAN NEED IT, AND WHY IT CANNOT FIX ITSELF. Before this wave, an entry that was
  // still outstanding when the college fork was answered was PLAYED inside the freeze: `tickWeek`
  // stashed a `pendingTournament` that the epilogue screen had no surface to answer, and from that
  // week the tick skipped its whole housekeeping step – no `ensureSeason`, no `pruneResults`, no
  // rank – for as long as the freeze lasted. The owner's own save came out of four years with **0
  // calendar events, 1 result row and a 200-row junior table tied at #1 on zero points**.
  //
  // The state SEALS ITSELF, which is the fact that makes this migration necessary rather than
  // convenient: `pendingView` returns undefined when `eventById` cannot find the reveal's event, and
  // the same freeze emptied `world.season`. So `snapshot.pending` is null, `TournamentFlow` never
  // mounts, the sticky bar's resume button never renders, and `advanceWeeks` returns 'tournament'
  // having ticked nothing – with no toast, because 'tournament' is deliberately absent from
  // `STOP_REASON_TEXT` (the overlay owns that message, and the overlay is not there). Pressing Play
  // does nothing and says nothing, for ever. There is no tap in the app that reaches it.
  //
  // ⚠ THE PREDICATE IS THE MECHANISM, NOT THE SYMPTOM. "The reveal's event is not on the calendar"
  // is exactly `pendingView`'s own refusal, i.e. exactly "no surface can draw this". A college-shaped
  // test (`college.doneWeek !== null`) would be both too wide – it would discard a perfectly
  // playable reveal whose event IS still scheduled – and too narrow, since any future route to the
  // same seal would go unrepaired. Nothing else can produce it: `advanceWeeks` refuses to move time
  // while a reveal is open and the worker's dev `tick` refuses at entry, so the event cannot age out
  // from under a live reveal by any other path.
  //
  // ⚠ NOTHING IS LOST EITHER WAY. A FINISHED reveal has already been awarded – `finalizeTournament`
  // banks the points and runs the deferred housekeeping when the last round is revealed, and
  // `closeTournament` is a bare `pendingTournament = null` – so this is the Continue button she never
  // got to press. An UNFINISHED one had awarded nothing yet, so there is no ledger row to orphan.
  //
  // ⚠ AND IT WRITES NO NEWS. A migration that invented a feed row would be putting words in a
  // career's mouth about weeks it did not live. The repair is silent by design and the world heals
  // itself: two ticks rebuild the calendar (`housekeep` -> `ensureSeason`) and one season restores
  // the table – measured on the owner's save, rank 27 by +6 weeks and the junior table back to 71
  // scored rows, in an arm with no player action in it at all.
  //
  // Idempotent (a save already at v55 never reaches this branch, and a second run would find
  // `pendingTournament` null anyway) and it writes a literal: ZERO draws on any stream, so the frozen
  // MAIN capture (41550 / e6b0c709) is untouched by construction.
  if (v === 54) {
    const pending = save.pendingTournament as { eventId?: unknown } | null | undefined
    if (pending && typeof pending === 'object') {
      const season = Array.isArray(save.season) ? (save.season as Array<{ id?: unknown }>) : []
      if (!season.some((e) => e && e.id === pending.eventId)) save.pendingTournament = null
    }
    v = 55
  }

  if (v !== SAVE_SCHEMA_VERSION) {
    throw new Error(`Save schema ${v} is newer than supported ${SAVE_SCHEMA_VERSION}`)
  }
  save.schemaVersion = v
  if (typeof save.seed !== 'string' || typeof save.week !== 'number' || typeof save.profile !== 'object') {
    throw new Error('Corrupted save: missing seed/week/profile')
  }
  return save as WorldState
}

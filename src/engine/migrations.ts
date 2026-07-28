import {
  DEFAULT_PROFILE,
  WEEK_PLAN_PRESETS,
  type FinanceWeek,
  type Milestone,
  type SeasonHistoryEntry,
  type WorldEventCategory,
} from '../shared/protocol'
import { isCappedTier, KID_ID, SAVE_SCHEMA_VERSION, seedWorldForV6, type WorldState } from './world'
import { pickSurname } from './season/cohort'
import { rngFromSeed, pickInt } from './rng'
import { OFF_SEASON_WEEKS, TIERS, tierFromLabel } from './season/calendar'
import { milestoneKey } from './diary'
import { WEEKS_IN_SEASON, weekYear } from '../shared/dates'
import type { TierId } from './season/types'

// Save-data migrations. Append-only: never renumber, never delete a block.
// Each `if (v < N)` block upgrades from N-1 to N and must be idempotent for its version.

const EPOCH_SEASON_YEAR = weekYear(0) // 2031 – the year season 0 opened in

/** v16 helper: invert the pre-v16 `year` field back to the season index that wrote it.
 *
 *  The old wrap-up stamped `weekYear(seasonIndex * WEEKS_IN_SEASON)` and refused to write a year
 *  already present, so the smallest index yielding a given year IS the index that produced the row.
 *  Bounded well past the game's horizon; falls back to the flat offset if it ever runs off the end. */
function seasonIndexOfLegacyYear(year: number): number {
  for (let k = 0; k <= 200; k++) if (weekYear(k * WEEKS_IN_SEASON) === year) return k
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
    if (typeof save.physioActive !== 'boolean') save.physioActive = save.profile?.coachSetup === 'hired'
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
    // index is a short scan over `weekYear(k * WEEKS_IN_SEASON)`. (2035 is the only collision inside
    // 40 seasons, so in practice this shifts nothing below season 5 and re-labels seasons 6+ by the
    // one year the drop had cost them.) Idempotent: a row that already has an index is left alone.
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

  if (v !== SAVE_SCHEMA_VERSION) {
    throw new Error(`Save schema ${v} is newer than supported ${SAVE_SCHEMA_VERSION}`)
  }
  save.schemaVersion = v
  if (typeof save.seed !== 'string' || typeof save.week !== 'number' || typeof save.profile !== 'object') {
    throw new Error('Corrupted save: missing seed/week/profile')
  }
  return save as WorldState
}

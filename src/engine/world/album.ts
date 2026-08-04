// THE ALBUM: seven polaroids, and the rule printed on every one of them.
//
// The owner designed this page himself (career-contract-v1.md §9, 05.08): «мне кажется это должно
// быть что-то кинематографичное, что-то вроде фотоальбома с этими неделями, что-то эмоциональное…
// у нас есть рамка для фоточки на главной». It is not a new idea invented here – it is Home's
// memory card grown to the size of a career, and `ui/Polaroid.vue` already says so in its own
// header.
//
// ⚠ THE SEVEN SLOTS ARE FIXED (§9.2), so every career's album has the same shape, and each slot is
// filled by a rule a player could check by hand off the Stats screen. That is §9.1's point 4 and it
// is the whole reason the album is allowed to exist at all: §6 promises the game never grades her,
// and an engine that silently chooses "what mattered" is the game judging. An engine that SHOWS ITS
// REASON on the page is the game explaining. So `why` is never optional and never hidden.
//
// ⚠ DEPENDENCY DIRECTION. `WorldState` is a TYPE-ONLY import (erased at compile time), so world.ts
// imports these values with no runtime cycle. Everything at runtime comes from sibling leaves and
// from `shared/`.
//
// ⚠ RNG: nothing here draws. The album is a fold over ledgers that are already written.
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR } from '../season/calendar'
import { seasonYear, weekLabel } from '../../shared/dates'
import { formatCents } from '../../shared/money'
import { portraitStage } from '../../shared/avatarEmotion'
import type { AvatarEmotion } from '../../shared/avatarEmotion'
import type {
  AlbumPage,
  CareerEndingType,
  Milestone,
  ScrollSeason,
} from '../../shared/protocol'
import { ENDING_TITLE } from '../ending'
import { kidAgeYears, START_AGE_YEARS } from './age'
import { seasonIndexOf } from './ledger'
import { finishLabel } from './labels'
import type { WorldState } from '../world'

/** ⚠ MEASURED BEFORE THE COPY WAS WRITTEN (§9.2's own instruction for slot 6, and the wave brief
 *  repeated it in capitals). `tools/endings-bench.ts` reports two different crossings:
 *
 *    – the WEEK crossing: one week's prize money beat that week's costs. Common – it lands in the
 *      first professional season for most careers that get there at all.
 *    – the CUMULATIVE crossing: her prize money to date beat her costs to date, counting from the
 *      week she was fourteen. That is the one §9.2 asks for, and it is rare.
 *
 *  So the empty page is the COMMON case and the copy says so plainly rather than apologising for
 *  it. The measured numbers and the argument are in docs/specs/endings-and-the-album.md §5. */
export const SLOT6_EMPTY_WHY = 'The week the money turned – it never came'

const EMOTION_BY_ENDING: Record<CareerEndingType, AvatarEmotion> = {
  stopped: 'serious',
  college: 'norm',
  bankruptcy: 'sad',
  injury: 'injury',
  natural: 'serious',
  plateau: 'serious',
}

function ageAt(world: WorldState, week: number): number {
  return kidAgeYears(week, world.profile.birthMonth)
}

function page(
  world: WorldState,
  slot: number,
  why: string,
  caption: string,
  fact: string | null,
  week: number | null,
  emotion: AvatarEmotion,
  empty = false,
): AlbumPage {
  const at = week ?? world.week
  return {
    slot,
    why,
    caption,
    fact,
    week,
    seasonIndex: week === null ? null : seasonIndexOf(week),
    stage: portraitStage(ageAt(world, at)),
    emotion,
    empty,
  }
}

function tierLabel(m: Milestone): string {
  return m.tier ? TIERS[m.tier].label : 'a tournament'
}

function earliest(milestones: readonly Milestone[], type: Milestone['type']): Milestone | null {
  let best: Milestone | null = null
  for (const m of milestones) {
    if (m.type !== type) continue
    if (best === null || m.week < best.week) best = m
  }
  return best
}

/** ⚠ THE SHARED FORMATTER, NOT A LOCAL ONE. The engine may THINK in absolute weeks; everything it
 *  WRITES for a player goes through `weekLabel` – tests/world-trio.test.ts enforces that mechanically
 *  and it caught this file's first draft growing its own. */
const seasonLabel = weekLabel

// --- the seven slots ----------------------------------------------------------------------------

/** SLOT 1 – THE BEGINNING. Never empty.
 *
 *  ⚠ DEVIATION FROM §9.2's WORDING, STATED RATHER THAN SMUGGLED. The table says "her first entered
 *  event"; nothing in a save can answer that. `milestones` records her first INTERNATIONAL entry
 *  and no domestic one, `events` prunes at 400 rows, `results` at the 52-week ranking window, and
 *  `bestFinishByTier` records finishes rather than entries (a walkover week has the one and not the
 *  other). A second `MilestoneType` would have bought it, at the price of a field no migrated save
 *  could back-fill honestly.
 *
 *  So the page is the true beginning instead: week zero, the week she was fourteen and the family
 *  counted what it had. It is never empty by construction, it is the same page for every career –
 *  which is right for a page called "The beginning" – and her first passport week rides on it as
 *  the fact when she ever had one. */
export function slotBeginning(world: WorldState): AlbumPage {
  const first = earliest(world.milestones, 'international')
  const fact = first
    ? `Her first trip abroad came in ${seasonLabel(first.week)}, at the ${tierLabel(first)}`
    : `${formatCents(world.careerTotals.spentCents)} went out before anybody knew the answer`
  return page(
    world,
    1,
    'Where it started – every album opens on the same page',
    `${START_AGE_YEARS} years old, and we said yes`,
    fact,
    0,
    'norm',
  )
}

/** SLOT 2 – THE FIRST TIME SHE WON SOMETHING. Earliest `title` at any rung; falls back to the
 *  earliest `final`. Empty only for a career that never reached a final anywhere. */
export function slotFirstWin(world: WorldState): AlbumPage {
  const title = earliest(world.milestones, 'title')
  if (title) {
    return page(
      world,
      2,
      'Her first title – the earliest one she ever won',
      'We kept the draw sheet',
      `${tierLabel(title)} – champion, ${seasonLabel(title.week)}`,
      title.week,
      'happy',
    )
  }
  const final = earliest(world.milestones, 'final')
  if (final) {
    return page(
      world,
      2,
      'She never won one – this is the first final she reached',
      'So close, and she knew it',
      `${tierLabel(final)} – ${finishLabel(1)}, ${seasonLabel(final.week)}`,
      final.week,
      'serious',
    )
  }
  return page(
    world,
    2,
    'She never reached a final',
    'The draw sheets, all of them',
    null,
    null,
    'serious',
    true,
  )
}

/** SLOT 3 – THE FIRST CHEQUE. Earliest `prize`.
 *
 *  ⚠ THE EMPTY FACE THAT MATTERS MOST, and §9.2 is explicit about why. No junior rung pays prize
 *  money at all – that is the design, «juniors pay to play», the whole valley-of-death thesis – so
 *  every career that stops at nineteen without turning professional has NEVER BEEN PAID. That is
 *  ending #1, the one the owner insisted must be a real ending rather than a failure, and college
 *  delays it four years further. The page has to be able to say so WITHOUT CONSOLATION: no "but",
 *  no "still", nothing that quietly re-grades the answer the player was allowed to give. */
export function slotFirstCheque(world: WorldState): AlbumPage {
  const prize = earliest(world.milestones, 'prize')
  if (prize) {
    return page(
      world,
      3,
      'The first time the tennis paid her',
      'The first one we did not pay for',
      `${tierLabel(prize)}, ${seasonLabel(prize.week)} – ${formatCents(world.careerTotals.prizeCents)} in the end`,
      prize.week,
      'happy',
    )
  }
  return page(
    world,
    3,
    'The first cheque – there was never one',
    'No junior tournament has ever paid anybody',
    null,
    null,
    'norm',
    true,
  )
}

/** SLOT 4 – THE BEST WEEK. The highest-rung `title`; falls back to the best `season-rank`. */
export function slotBestWeek(world: WorldState): AlbumPage {
  let best: Milestone | null = null
  for (const m of world.milestones) {
    if (m.type !== 'title' || !m.tier) continue
    if (best === null || TIER_LADDER.indexOf(m.tier) > TIER_LADDER.indexOf(best.tier!)) best = m
  }
  if (best) {
    return page(
      world,
      4,
      'The highest rung she ever won on',
      'The best week of the lot',
      `${tierLabel(best)} – champion, ${seasonLabel(best.week)}`,
      best.week,
      'happy',
    )
  }
  let bestRank: Milestone | null = null
  for (const m of world.milestones) {
    if (m.type !== 'season-rank' || m.rank === undefined) continue
    if (bestRank === null || m.rank < bestRank.rank!) bestRank = m
  }
  if (bestRank) {
    return page(
      world,
      4,
      'She never won a title – this is the highest she ever stood',
      'Number ' + bestRank.rank,
      `#${bestRank.rank} at the close of ${seasonYear(bestRank.seasonIndex ?? 0)}`,
      bestRank.week,
      'serious',
    )
  }
  return page(world, 4, 'No week ever stood out', 'A season like the others', null, null, 'norm', true)
}

/** SLOT 5 – THE WORST WEEK. The longest layoff, or the season her rank fell furthest.
 *
 *  ⚠ NO EMPTY FACE, and that correction is §9.2's own (05.08): season injury prevalence is ~51%
 *  after the 04.08 calibration, so over five or more seasons virtually every career is hurt at least
 *  once – and the fallback fills even for the career that never was. It is never empty in practice,
 *  so building an empty face for it was defensive noise. */
export function slotWorstWeek(world: WorldState): AlbumPage {
  let longest: { week: number; kind: string; weeksOut: number } | null = null
  for (const h of world.injuryHistory) {
    if (longest === null || h.weeksOut > longest.weeksOut) longest = { week: h.week - h.weeksOut, kind: h.kind, weeksOut: h.weeksOut }
  }
  if (world.injury && (longest === null || world.injury.totalWeeks > longest.weeksOut)) {
    longest = { week: world.injury.sinceWeek, kind: world.injury.kind, weeksOut: world.injury.totalWeeks }
  }
  if (longest) {
    return page(
      world,
      5,
      `The one that took ${longest.weeksOut} weeks`,
      'We stopped counting the appointments',
      `${longest.kind} – ${seasonLabel(longest.week)}, ${longest.weeksOut} weeks out`,
      longest.week,
      'injury',
    )
  }
  let worst: { seasonIndex: number; fall: number; endRank: number; week: number } | null = null
  for (let i = 1; i < world.seasonHistory.length; i++) {
    const fall = world.seasonHistory[i].endRank - world.seasonHistory[i - 1].endRank
    if (worst === null || fall > worst.fall) {
      worst = {
        seasonIndex: world.seasonHistory[i].seasonIndex,
        fall,
        endRank: world.seasonHistory[i].endRank,
        week: world.seasonHistory[i].seasonIndex * WEEKS_PER_YEAR + WEEKS_PER_YEAR - 1,
      }
    }
  }
  if (worst) {
    return page(
      world,
      5,
      `The season the table took ${worst.fall} places off her`,
      'Nobody said much that winter',
      `Closed ${seasonYear(worst.seasonIndex)} at #${worst.endRank}`,
      worst.week,
      'sad',
    )
  }
  return page(world, 5, 'She was never seriously hurt', 'Not one bad week worth the page', null, null, 'norm', true)
}

/** SLOT 6 – THE TURN. The week her cumulative prize money first passed her cumulative costs.
 *
 *  ⚠ IT IS READ OFF A MILESTONE AND CANNOT BE COMPUTED HERE (§9.4). The finance ledger keeps sixty
 *  weeks; the crossing may happen in season seven. By the time this function runs, the arithmetic
 *  behind the answer has been pruned out of the save – so it is captured the week it happens, in
 *  `tickWeek`, and this page just reads the row. */
export function slotTheTurn(world: WorldState): AlbumPage {
  const turn = earliest(world.milestones, 'break-even')
  if (turn) {
    return page(
      world,
      6,
      'The week the money turned – prize money past everything the family had spent',
      'It paid for itself',
      `${seasonLabel(turn.week)} – ${formatCents(world.careerTotals.prizeCents)} won against ${formatCents(world.careerTotals.spentCents)} spent`,
      turn.week,
      'happy',
    )
  }
  // The empty face. Measured, not assumed – see SLOT6_EMPTY_WHY.
  const won = world.careerTotals.prizeCents
  const spent = world.careerTotals.spentCents
  const caption =
    won > 0
      ? 'It paid for some of it'
      : 'It never paid for any of it'
  const fact =
    won > 0
      ? `${formatCents(won)} won against ${formatCents(spent)} spent – most careers end on this page`
      : `${formatCents(spent)} spent, and the tennis never sent a cheque`
  return page(world, 6, SLOT6_EMPTY_WHY, caption, fact, null, won > 0 ? 'serious' : 'norm', true)
}

/** SLOT 7 – THE LAST WEEK. The ending itself, whichever of the six it was. Never empty. */
export function slotLastWeek(world: WorldState): AlbumPage {
  const ending = world.ending
  if (!ending) {
    return page(world, 7, 'The story has not stopped yet', 'Still going', null, null, 'norm', true)
  }
  return page(
    world,
    7,
    ENDING_TITLE[ending.type],
    ending.type === 'college' ? 'See you in four years' : 'The last week',
    `${seasonLabel(ending.week)}, aged ${ending.ageYears} – ${ending.detail}`,
    ending.week,
    EMOTION_BY_ENDING[ending.type],
  )
}

/** The album, whole and in slot order. Exactly seven pages, always. */
export function buildAlbum(world: WorldState): AlbumPage[] {
  return [
    slotBeginning(world),
    slotFirstWin(world),
    slotFirstCheque(world),
    slotBestWeek(world),
    slotWorstWeek(world),
    slotTheTurn(world),
    slotLastWeek(world),
  ]
}

// --- §9.3: underneath ---------------------------------------------------------------------------

const SCROLL_LABEL: Record<Milestone['type'], string> = {
  title: 'Title',
  final: 'Final',
  prize: 'First prize money',
  international: 'First trip abroad',
  injury: 'First injury',
  'season-rank': 'Season close',
  'break-even': 'The money turned',
}

function scrollDetail(m: Milestone): string | null {
  switch (m.type) {
    case 'title':
    case 'final':
    case 'prize':
    case 'international':
      return m.tier ? TIERS[m.tier].label : null
    case 'injury':
      return m.kind ?? null
    case 'season-rank':
      return m.rank === undefined ? null : `#${m.rank}`
    case 'break-even':
      return null
  }
}

/** THE FULL SCROLL – every milestone in order, paged by season (§9.3). §5.5's option (a), kept as
 *  the floor rather than as the surface: reachable from the album's last page for the player who
 *  wants the record rather than the story. */
export function buildScroll(world: WorldState): ScrollSeason[] {
  const bySeason = new Map<number, ScrollSeason>()
  const rows = [...world.milestones].sort((a, b) => a.week - b.week)
  for (const m of rows) {
    const seasonIndex = seasonIndexOf(m.week)
    let season = bySeason.get(seasonIndex)
    if (!season) {
      season = {
        seasonIndex,
        year: seasonYear(seasonIndex),
        ageYears: ageAt(world, seasonIndex * WEEKS_PER_YEAR),
        rows: [],
      }
      bySeason.set(seasonIndex, season)
    }
    season.rows.push({ week: m.week, label: SCROLL_LABEL[m.type], detail: scrollDetail(m) })
  }
  return [...bySeason.values()].sort((a, b) => a.seasonIndex - b.seasonIndex)
}

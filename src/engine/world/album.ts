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
import {
  LADDER_TRACKS,
  type AlbumPage,
  type CareerEndingType,
  type Milestone,
  type ScrollSeason,
  type SeasonTrackRow,
} from '../../shared/protocol'
import type { LadderTrack } from '../season/types'
import { ENDING_TITLE, endingDetailRef, endingTitleRef } from '../ending'
// ⭐ L3-6 (10.10): the closing page and the scroll carry CopyRefs beside their English (see `AlbumPage.whyC` / `ScrollSeason.rows`).
import { cp, type CopyRef } from '../../shared/i18n'
import { kidAgeAt } from './age'
import { seasonIndexOf } from './ledger'
import { careerMoney } from './reckoning'
// ⚠ `highestLadderReached`, NOT `activeLadderOf` – ruling C, 18.09. The import moved with the call
// (see `slotBestWeek`): the two answer different questions and the album asks the historical one.
import { bestSeasonClose, highestLadderReached } from './ladder'
import { finishLabel } from './labels'
import type { WorldState } from '../world'

/** ⚠ MEASURED BEFORE THE COPY WAS WRITTEN – §9.2's own instruction for slot 6, and the wave brief
 *  repeated it in capitals. `tools/endings-bench.ts` reports two crossings that both get called
 *  "break-even" and are YEARS apart:
 *
 *    – the WEEK crossing: one week's prize money beat that week's costs. COMMON. It lands in the
 *      first professional season for most careers that reach one, around seventeen – which is where
 *      the owner watched his own career cross it.
 *    – the CUMULATIVE crossing: her prize money to date passed everything the family had ever spent,
 *      counting from the week she was fourteen. That is the one §9.2 asks slot 6 for, and it is
 *      RARE: measured at 0 careers in 216 across every preset and both retirement policies.
 *
 *  So the empty page is THE COMMON CASE, not the exception, and the copy says so plainly instead of
 *  apologising for it. And when a career had the week but never the career, the empty face carries
 *  THAT – it is the honest thing to have on the page, and «the tennis paid for a week of itself and
 *  never for the whole of it» is the game's own thesis arriving as a fact about her rather than as a
 *  claim in a store description. The numbers and the argument are in
 *  docs/specs/endings-and-the-album.md §5. */
export const SLOT6_EMPTY_WHY = 'The week the money turned – it never came, and for almost nobody does it'

/** ⚠ ROUND 45 – THE COMPILER IS WHY THE TWO NEW DOORS ARRIVE WITH A FACE. This record is TOTAL over
 *  `CareerEndingType`, so widening that union went red here until `peak` and `fall` were answered,
 *  which is the spec's own point: a new ending cannot ship without its blurb, its title and her face.
 *
 *  ⚠ BOTH NEW FACES ARE DRAFTS (invariant 4, docs/specs/the-two-doors-corpus-2026-09.md §5).
 *  `peak` is the only `happy` in the table and it is the one leaving that is not a loss – but it is
 *  her face and not a verdict, exactly as `bankruptcy`'s `sad` is hers. `fall` takes `serious`
 *  rather than `sad` or `angry` DELIBERATELY: the door has two voices, one of which slams it and one
 *  of which says nothing at all, and a face that picked either of them would be telling a `quiet`
 *  girl's story in a `fiery` girl's expression. `serious` is the one that is true of both. */
const EMOTION_BY_ENDING: Record<CareerEndingType, AvatarEmotion> = {
  stopped: 'serious',
  college: 'norm',
  bankruptcy: 'sad',
  injury: 'injury',
  natural: 'serious',
  plateau: 'serious',
  // ⚠ ROUND 45, REPAIRED 17.09. The peak shipped as `happy` and he read it against the voices: «happy
  // fits `sunny` and not `deep`… or `serious` is the safer shared one». The un-partitioning settles
  // it – with `DOOR_BY_TEMPERAMENT` gone all four voices reach the peak, so a face that fits one of
  // them is wrong three times in four. `serious` is the face he approved on the fall for exactly this
  // reason (one door, two voices, neither told wrong by it), and it is the same argument here.
  // ⚠ A PER-VOICE face is still open and still his – `EMOTION_BY_ENDING` is keyed on the ending, and
  // making it per voice is a small engine change nobody has asked for yet (spec §6.6 item 4).
  peak: 'serious',
  fall: 'serious',
  // ⚠ WAVE 8 T5 – A DRAFT (invariant 4), and `norm` was the real alternative rather than a straw one.
  // The case for it: `college` is the one other row here where she leaves the tour for another life
  // instead of being stopped by one, and `norm` is the face it takes. What decides against it is that
  // `college` is also the one ending in the union that RESUMES – `resumesWeek` points a year out and
  // she comes back – so its `norm` reads as «nothing has ended», which is exactly what `'family'` is
  // not. ⚠ AND `happy` IS REFUSED FOR THE PEAK'S OWN REASON, repaired 17.09: all four voices reach
  // this ending, so a face that fits `sunny` is wrong three times in four. `serious` is the one that
  // is true of all of them, and it grades nothing – which is the whole rule this record keeps.
  family: 'serious',
}

/** ⚠ THE GIRL, AND IT USED TO BE THE BAND – the defect this comment used to describe is now fixed
 *  rather than documented. It read `ageAtWeek(week)` and argued that "everything the app PRINTS reads
 *  the band, because `Snapshot.ageYears` does", which was true and was the bug: the scroll's season
 *  header said «2031 – she was 13» while Home, about the same week, read 14. Two surfaces, one week,
 *  two numbers, caught in the browser.
 *
 *  Owner ruling 1, 09.08 (world/age.ts): there is ONE clock and it is hers. `Snapshot.ageYears` reads
 *  `kidAgeAt` now and so does this, so the album, the header and the ending all name the same age -
 *  and the ending's `kidAgeYears` was the one that was right all along. */
function ageAt(world: WorldState, week: number): number {
  return kidAgeAt(world, week)
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
  refs?: { why?: CopyRef; caption?: CopyRef; fact?: CopyRef },
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
    // ⭐ L3-6: a page without refs has exactly the shape it always had – the keys are ABSENT, not undefined.
    ...(refs?.why ? { whyC: refs.why } : {}),
    ...(refs?.caption ? { captionC: refs.caption } : {}),
    ...(refs?.fact ? { factC: refs.fact } : {}),
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
 *  So the page is the true beginning instead: week zero, the week the family counted what it had.
 *  It is never empty by construction, it is the same page for every career – which is right for a
 *  page called "The beginning" – and her first passport week rides on it as the fact when she ever
 *  had one.
 *
 *  ⚠ THE CAPTION NAMES HER AGE AND NOT THE BAND'S (owner ruling 1, 09.08). It was the constant
 *  `START_AGE_YEARS`, so every album in the game opened on «14 years old, and we said yes» – including
 *  the December careers whose girl was thirteen that week, and whose own birthday note said so nine
 *  months later. Same page for every career, her own number on it. */
export function slotBeginning(world: WorldState): AlbumPage {
  const first = earliest(world.milestones, 'international')
  // ⭐ ROUND 46 #9 – «went out» IS `outlayCents`, not the raw accumulator. Money that turned into a
  // house is still the family's; only what left for good ever «went out». See `careerMoney`.
  const fact = first
    ? `Her first trip abroad came in ${seasonLabel(first.week)}, at the ${tierLabel(first)}`
    : `${formatCents(careerMoney(world).outlayCents)} went out before anybody knew the answer`
  return page(
    world,
    1,
    'Where it started – every album opens on the same page',
    `${ageAt(world, 0)} years old, and we said yes`,
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

/** SLOT 4 – THE BEST WEEK. The highest-rung `title`; falls back to the best season she ever CLOSED
 *  on her own table (round 46 #10 – it used to be the best `season-rank` milestone, which is the
 *  junior rank on every row; see `bestSeasonClose`). */
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
  // ⭐⭐⭐ ROUND 46 #10 – OFF THE ONE READER, AND WHAT STOOD HERE WAS THE EPILOGUE'S OWN BUG IN A
  // SECOND COPY. It scanned the `season-rank` milestones, whose `rank` is written from
  // `world.kidRank` – the ITF one, always – so this page handed a career that had spent its life on
  // the professional table its best JUNIOR year-end. `bestSeasonClose` is asked which table is hers,
  // exactly as `bestRankEver` asks for the epilogue.
  //
  // ⭐⭐⭐ RE-AIMED 18.09 BY RULING C, AND IT HAD TO MOVE WITH THE EPILOGUE OR THE TWO WOULD HAVE
  // DIVERGED AGAIN – which is the whole defect this page was repaired for one ruling earlier. The
  // table is `highestLadderReached` now, not `activeLadderOf`: «делаем на высшей ступени из тех, на
  // которых она была, если ушла после J – значит это высшая». The two functions agree on every
  // career that ended on its own peak and differ on exactly the one his sentence names – a girl who
  // left after the junior rungs, whose ITF book has since decayed out of the 52-week window.
  //
  // ⚠ IT IS THE CLOSES AND NOT THE LIVE RANK, WHICH IS A DIFFERENCE FROM THE EPILOGUE AND IS THE
  // COPY'S DOING: this fact says «at the close of», so a mid-season standing folded in would make
  // the sentence false. The narrower question is why the reader is split in two rather than shared
  // whole – see `bestSeasonClose`.
  //
  // ⚠ AND THE DATE DOES NOT MOVE FOR ANY CAREER THE OLD SCAN COULD SEE: the week it derives is the
  // wrap week, which is the very week the matching `season-rank` milestone carries.
  const closed = bestSeasonClose(world, highestLadderReached(world))
  if (closed) {
    return page(
      world,
      4,
      'She never won a title – this is the highest she ever stood',
      'Number ' + closed.rank,
      `#${closed.rank} at the close of ${seasonYear(closed.seasonIndex, world.startYear)}`,
      closed.week,
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
      `Closed ${seasonYear(worst.seasonIndex, world.startYear)} at #${worst.endRank}`,
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
  // ⭐⭐⭐ ROUND 46 #9 – THE DENOMINATOR IS `outlayCents` ON ALL FOUR FACES OF THIS PAGE, AND THE
  // MILESTONE THAT GATES IT MOVED WITH THEM (`captureBreakEven`). The owner read «$13M won against
  // $83M spent» off a career that ended holding a fund, houses and an academy, and most of that
  // «spent» was the money those things are made of – see `careerMoney` for the decomposition. A page
  // whose figures said one thing while the milestone in front of it said another would be the same
  // defect one layer up, so the test and the sentence read the SAME number.
  const money = careerMoney(world)
  const career = world.milestones.find((m) => m.type === 'break-even' && m.kind === 'career')
  if (career) {
    return page(
      world,
      6,
      'The week the money turned – prize money past everything the family had ever spent',
      'It paid for itself',
      `${seasonLabel(career.week)} – ${formatCents(money.prizeCents)} won against ${formatCents(money.outlayCents)} spent`,
      career.week,
      'happy',
    )
  }
  // THE EMPTY FACE. Measured, not assumed – see SLOT6_EMPTY_WHY for the two rates.
  const week = world.milestones.find((m) => m.type === 'break-even' && m.kind === 'week')
  const won = money.prizeCents
  const spent = money.outlayCents
  if (week) {
    // ⚠ THE HONEST MIDDLE, and it is the commonest true story the game has: one week where the
    // tennis paid for itself, and never the whole of it. Naming the week is not consolation – it is
    // the exact size of what did happen, printed next to the exact size of what did not.
    return page(
      world,
      6,
      SLOT6_EMPTY_WHY,
      'One week, it paid for itself',
      `${seasonLabel(week.week)} – and in the end ${formatCents(won)} won against ${formatCents(spent)} spent`,
      week.week,
      'serious',
      true,
    )
  }
  const caption = won > 0 ? 'It paid for some of it' : 'It never paid for any of it'
  const fact =
    won > 0
      ? `${formatCents(won)} won against ${formatCents(spent)} spent – not one week of it covered itself`
      : `${formatCents(spent)} spent, and the tennis never sent a cheque`
  return page(world, 6, SLOT6_EMPTY_WHY, caption, fact, null, won > 0 ? 'serious' : 'norm', true)
}

/** SLOT 7 – THE LAST WEEK. The ending itself, whichever of the six it was. Never empty. */
export function slotLastWeek(world: WorldState): AlbumPage {
  const ending = world.ending
  if (!ending) {
    return page(world, 7, 'The story has not stopped yet', 'Still going', null, null, 'norm', true, {
      why: cp`The story has not stopped yet`,
      caption: cp`Still going`,
    })
  }
  return page(
    world,
    7,
    ENDING_TITLE[ending.type],
    ending.type === 'college' ? 'See you in four years' : 'The last week',
    `${seasonLabel(ending.week)}, aged ${ending.ageYears} – ${ending.detail}`,
    ending.week,
    EMOTION_BY_ENDING[ending.type],
    false,
    // ⭐ L3-6: the title is the page's `why`; the fact nests the stored detail as the ref `endingDetailRef` reads back from it (the week label is a formatter's output and rides as a string param, RU-13D's).
    {
      why: endingTitleRef(ending.type),
      caption: ending.type === 'college' ? cp`See you in four years` : cp`The last week`,
      fact: cp`${seasonLabel(ending.week)}, aged ${ending.ageYears} – ${endingDetailRef(ending)}`,
    },
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
  school: 'School behind her',
  // ⚠ DRAFT (v83, the wedding – wave 7 T3; invariant 4: the owner's word lands in the T7 table).
  wedding: 'Her wedding',
  // ⚠ DRAFT (v85, the birth – wave 8 T4; invariant 4: the owner's word lands in the T8 table).
  // ⚠ HUSBAND-AGNOSTIC, per §0's decoupling ruling – a mid-pregnancy divorce is ordinary life, so no
  // line of this wave may need to know whether he is still there. The sex is RULED (20.09, girls
  // only at v1), so the label may say it.
  birth: 'Her daughter',
  // ⚠ DRAFT (v88, the parting – wave 12 T3; invariant 4: the owner's word lands in the T8 table).
  // ⚠⚠ THE LABEL SETTLES NOTHING, which is §5's law and the one constraint on this cell: the album
  // does not say who was right, how long it had been coming or what it cost. «The marriage ended» is
  // the whole of what the world holds. ⚠ AND IT IS NOT «Her divorce», which was the first draft and
  // reads as a possession she acquired; this names the thing that happened.
  divorce: 'The marriage ended',
}

/** ⭐ L3-6 (10.10) – THE SAME ELEVEN LABELS AS REFS. A record keyed on the milestone type, so a twelfth type cannot ship with a label and no ref (the compiler asks). Each is a catalog key by its `cp` site. */
const SCROLL_LABEL_REF: Record<Milestone['type'], CopyRef> = {
  title: cp`Title`,
  final: cp`Final`,
  prize: cp`First prize money`,
  international: cp`First trip abroad`,
  injury: cp`First injury`,
  'season-rank': cp`Season close`,
  'break-even': cp`The money turned`,
  school: cp`School behind her`,
  wedding: cp`Her wedding`,
  birth: cp`Her daughter`,
  divorce: cp`The marriage ended`,
}

/** ⭐⭐⭐ ROUND 48 #7a – THE TABLE A BANKED SEASON WAS ABOUT, which is `dominantTrackOfSeason`'s
 *  question (world/milestones.ts) asked of the row the wrap WROTE instead of the counters it READ.
 *
 *  THE OWNER, 07.10, on «The whole record»: «там какая-то ерунда в каждом season close написана». The
 *  line printed `Milestone.rank`, which is `world.kidRank` at the wrap – the INTERNATIONAL table,
 *  always and by construction – so a professional's record carried her stale junior placing: the
 *  season she went 97-11 and finished world #1 read «#71», and her third-in-the-world year «#79».
 *
 *  ⚠ MIRRORED, NOT IMPORTED, AND THE REASON IS THE INPUT. `dominantTrackOfSeason` reads the LIVE
 *  counters (`seasonRecord`, `seasonPointsByTrack`), and the wrap resets them nine lines after it
 *  banks a row – so a reader that arrives a season later has nothing live to ask. `byTrack` holds the
 *  same figures frozen at the same instant (`seasonHistoryByTrack` copies `seasonRecord`'s W-L and
 *  `seasonPointsByTrack`'s points out of the very calls the comparator makes), so the SAME rule on
 *  the banked row names the SAME table the season card named. `tests/r48-b2-scroll-truth.test.ts`
 *  holds the two together on real wraps.
 *
 *  THE RULE, copied from its source: most matches (wins + losses) wins; a tie goes to the table with
 *  more points; and the walk runs lowest table first with `>=` on the tie-break, so on a dead heat the
 *  HIGHER table speaks (`LADDER_TRACKS`' order is meaning – see its note in shared/protocol/ladder.ts).
 *
 *  ⚠ NOBODY PLAYED – no table has a match – is the one arm that cannot be copied: the comparator falls
 *  back to `activeLadderOf(world)`, a read of her live points. Its banked twin is the HIGHEST table she
 *  held a rank in at the wrap, because `endRank` is written exactly where `kidPoints > 0`, which is the
 *  test `activeLadderOf` makes. (Its one other term, the `wtaEverCounted` latch, is not banked; it only
 *  differs for a once-professional with no professional point left, and there it can only name a table
 *  she IS ranked in.) None ranked at all answers `null`: the card says «Unranked» and so does this. */
function closeTrackOf(byTrack: Record<LadderTrack, SeasonTrackRow>): LadderTrack | null {
  let best: LadderTrack | null = null
  let bestMatches = 0
  for (const track of LADDER_TRACKS) {
    const played = (byTrack[track]?.wins ?? 0) + (byTrack[track]?.losses ?? 0)
    if (played === 0) continue
    if (
      best === null ||
      played > bestMatches ||
      (played === bestMatches && (byTrack[track]?.points ?? 0) >= (byTrack[best]?.points ?? 0))
    ) {
      best = track
      bestMatches = played
    }
  }
  if (best !== null) return best
  for (let i = LADDER_TRACKS.length - 1; i >= 0; i--) {
    if (byTrack[LADDER_TRACKS[i]]?.endRank !== undefined) return LADDER_TRACKS[i]
  }
  return null
}

/** A season close's detail: HER place in the table the season was about, as the wrap banked it.
 *
 *  ⚠ ABSENT IS SILENCE, NEVER A NUMBER – «unranked is not a number», the house rule. A dominant table
 *  with no `endRank` means she held no counting result in it, so the cell is `null` and the label row
 *  stands alone; it does NOT reach for another table's rank, which is the defect this function repairs.
 *
 *  ⚠ TWO CASES HAVE NOTHING BANKED TO READ, and both keep the line this scroll has always printed
 *  rather than inventing a table: a season that fell out of `SEASON_HISTORY_CAP`, and a row banked
 *  before v46, which has no `byTrack` and none can be recovered (the v45 -> v46 step in
 *  engine/migrations.ts back-filled nothing, on purpose). The milestone's own rank is also that old
 *  row's bare `endRank` – both are `world.kidRank` at the one wrap. */
function seasonCloseDetail(world: WorldState, m: Milestone): string | null {
  const rank = seasonCloseRankOf(world, m)
  return rank === null ? null : `#${rank}`
}

/** ⭐ L3-6 (10.10): THE NUMBER BEHIND `seasonCloseDetail`, read once for the sentence and for its ref – the rule above is unchanged, only the `#` is no longer glued on inside the reader. */
function seasonCloseRankOf(world: WorldState, m: Milestone): number | null {
  const row =
    m.seasonIndex === undefined ? undefined : world.seasonHistory.find((h) => h.seasonIndex === m.seasonIndex)
  const byTrack = row?.byTrack
  if (byTrack === undefined) return m.rank === undefined ? null : m.rank
  const track = closeTrackOf(byTrack)
  const endRank = track === null ? undefined : byTrack[track]?.endRank
  return endRank === undefined ? null : endRank
}

function scrollDetail(m: Milestone, world: WorldState): string | null {
  switch (m.type) {
    // ⚠ 07.10 (round 48 #7b): `buildScroll` no longer walks `title` and `final` – the trophy cabinet
    // speaks for them – so these two arms are reached by no caller today. They stay because this is a
    // pure function of a milestone and a milestone of either type is still a legal argument.
    case 'title':
    case 'final':
    case 'prize':
    case 'international':
      return m.tier ? TIERS[m.tier].label : null
    case 'injury':
      return m.kind ?? null
    // ⚠ 07.10 (round 48 #7a): read off the banked season row, not off `m.rank` – see `closeTrackOf`.
    case 'season-rank':
      return seasonCloseDetail(world, m)
    case 'break-even':
      // Two crossings, one type – say which. See `milestoneKey` in diary/facts.ts.
      return m.kind === 'week' ? 'one week of it' : 'the whole of it'
    case 'school':
      return 'the last school year is over'
    // ⚠ v83 (wave 7 T3): NO DETAIL, DELIBERATELY. The milestone's `kind` is the EPISODE ID – a
    // machine value the scroll must never print – and whether any surface speaks the husband's NAME
    // is a wording question that belongs to the owner's pass (T7), not to a detail cell that would
    // settle it by default. The label row alone is the record.
    case 'wedding':
      return null
    // ⚠ v85 (wave 8 T4): NO DETAIL EITHER, and for a shorter version of the same reason. The row
    // carries no `kind` at all (see `MilestoneType`'s own note): the sex is a ruled constant that
    // the label already speaks, and the marriage the child belongs to is on `world.pregnancy`, whose
    // id is a machine value and whose liveness is nobody's business here – the decoupling law
    // (RULED 20.09, world/lifeBeat.ts §14's banner). The label row alone is the record.
    case 'birth':
      return null
    // ⚠ v88 (wave 12 T3): NO DETAIL, `'wedding'`'s OWN CELL AND ITS OWN REASON ONE WAVE ON. The
    // milestone's `kind` is the EPISODE ID – a machine value the scroll must never print – and the
    // husband's NAME, which the episode has carried since v83, is the owner's wording question
    // rather than a detail cell's to settle by default. ⚠ AND THERE IS NOTHING ELSE TO PUT HERE:
    // no duration, no fault and no money exist in the world to be shown. The label row is the record.
    case 'divorce':
      return null
  }
}

/** ⭐ L3-6 (10.10) – THE DETAIL CELL AS A REF, or undefined when the cell has none to carry. Four arms speak a ref: the season close's place (`#{0}`), the two break-even phrases and the school line. The rest print
 *  an ENGINE-BORN word – a tier's label (`Title`, `Final`, `First prize money`, `First trip abroad` rows) and the injury `kind` – which no localisation path reaches yet (the shared tier / body-part
 *  formatters are RU-04's and RU-05's); the row keeps its English `detail` and the screen prints it as it always did. */
function scrollDetailRef(m: Milestone, world: WorldState): CopyRef | undefined {
  switch (m.type) {
    case 'season-rank': {
      const rank = seasonCloseRankOf(world, m)
      return rank === null ? undefined : cp`#${rank}`
    }
    case 'break-even':
      return m.kind === 'week' ? cp`one week of it` : cp`the whole of it`
    case 'school':
      return cp`the last school year is over`
    default:
      return undefined
  }
}

/** THE FULL SCROLL – every milestone in order, paged by season (§9.3). §5.5's option (a), kept as
 *  the floor rather than as the surface: reachable from the album's last page for the player who
 *  wants the record rather than the story. */
export function buildScroll(world: WorldState): ScrollSeason[] {
  const bySeason = new Map<number, ScrollSeason>()
  // ⭐⭐⭐ ROUND 48 #7b – THE ROWS HAVE TWO SOURCES AND ARE UNIFIED BEFORE THEY ARE GROUPED, so a season
  // that holds only a cabinet week still gets its page.
  //
  // THE OWNER, 07.10: «а еще с 2036 начиная нет никаких титулов вообще». He was right and the data was
  // never missing: `title` and `final` milestones are FIRST-PER-TIER (identity `title:<tier>`), so his
  // 127-title career had fourteen of them and the scroll's 2036 – four real titles – showed none. The
  // never-pruned `trophiesByTier` holds EVERY title and lost-final week per tier, and every first-per-tier
  // milestone is one of those weeks (the capture writes both from the same `kidFinish`), so the two
  // walks are swapped rather than added: nothing is lost and nothing prints twice.
  //
  // ⚠ ONE VISIBLE CONSEQUENCE, SAID HERE SO IT IS NOT A SURPRISE: the cabinet's `finals` are LOST finals
  // (`TierTrophies.finals`), while the `final` milestone fires for `kidFinish <= 1`, a title week
  // included. A first-ever title used to print a `Final` row beside its `Title` row on the same week; it
  // prints the `Title` alone now, and every `Final` row is a final she lost.
  //
  // ⚠ ALL THE OTHER MILESTONE TYPES ARE UNTOUCHED, label and detail. And this stays a PURE READ: no
  // stream is drawn, nothing on `world` is written, and the same world yields the same scroll.
  const rows: ScrollSeason['rows'] = []
  for (const m of world.milestones) {
    if (m.type === 'title' || m.type === 'final') continue
    const detailC = scrollDetailRef(m, world)
    rows.push({ week: m.week, label: SCROLL_LABEL[m.type], detail: scrollDetail(m, world), labelC: SCROLL_LABEL_REF[m.type], ...(detailC ? { detailC } : {}) })
  }
  for (const tier of TIER_LADDER) {
    const cabinet = world.trophiesByTier?.[tier]
    if (!cabinet) continue
    for (const week of cabinet.titles) rows.push({ week, label: SCROLL_LABEL.title, detail: TIERS[tier].label, labelC: SCROLL_LABEL_REF.title })
    for (const week of cabinet.finals) rows.push({ week, label: SCROLL_LABEL.final, detail: TIERS[tier].label, labelC: SCROLL_LABEL_REF.final })
  }
  // A STABLE sort, so a tie keeps the order the rows were pushed in: the milestones in their capture
  // order, then the cabinet's – which is the order a week really happened in (a first cheque is
  // captured before the title that follows it in `finalizeTournament`).
  rows.sort((a, b) => a.week - b.week)
  for (const row of rows) {
    const seasonIndex = seasonIndexOf(row.week)
    let season = bySeason.get(seasonIndex)
    if (!season) {
      season = {
        seasonIndex,
        year: seasonYear(seasonIndex, world.startYear),
        ageYears: ageAt(world, seasonIndex * WEEKS_PER_YEAR),
        rows: [],
      }
      bySeason.set(seasonIndex, season)
    }
    season.rows.push(row)
  }
  return [...bySeason.values()].sort((a, b) => a.seasonIndex - b.seasonIndex)
}

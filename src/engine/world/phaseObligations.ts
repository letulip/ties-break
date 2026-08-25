// ⭐ R2-10 STEP 2, PHASE 1 – THE SEASON BOUNDARY AND THE RECURRING OBLIGATIONS.
//
// THE FIRST NAMED PHASE OF THE WEEKLY TICK: everything the world owes the calendar before a single
// price is quoted. A season turning over (the rank she carries in, the cohort's age, the academy's
// verdict, the field's intake, the kit allowance), the contracts that talk on their own clock (the
// sponsor window, the ad house, the quarterly retainer), and the deadlines the world keeps FOR the
// player rather than decisions it makes for him (a knock retiring, a letter lapsing, the tour's
// mandatory desk, the scholarship's paperwork).
//
// ⚠ IT IS A MOVE AND NOT A REWRITE. The body below is `tickWeek`'s lines 0a00 to 0a0c-ter in their
// original order, comment for comment – including the step numbers, which are the reader's map of
// the week and are deliberately NOT renumbered. `tickWeek` calls this first and then goes on down
// its list; there is no callback into the barrel, no registry and no dispatch, which is what lets
// this be a leaf like every other `world/*` module.
//
// ⚠ ZERO DRAWS ON THE MAIN STREAM, WHICH IS WHY THE PHASE EXISTS WHERE IT DOES. Every step in here
// is pure state or draws on a purpose-scoped sub-stream (`seed:offer:<week>`, `seed:ad:<week>`,
// `seed:conveyor:<season>`) – the individual notes below say so one by one, and they are the
// argument for this block being safe to hoist above the tick's first MAIN draw. The frozen capture
// (41550 / e6b0c709) cannot see any of it, and the whole phase takes no `rng` argument at all: the
// signature is the guarantee.
import type { KitLine, KitOfferTerms } from '../../shared/protocol'
import type { WorldState } from './state'
import { ECONOMY } from '../economy'
import { WEEKS_PER_YEAR } from '../season/calendar'
import { ageCohort } from '../season/cohort'
import { renewCohort } from '../season/conveyor'
import { kitGrantCents, reviewLevel, settleAcademyLetters, travelCoverPct } from '../academy'
import { activeKitDeal, expireOffers, isSponsorWindowWeek } from '../offers'
import { KID_ID, RESULTS_WINDOW } from './constants'
import { addEvent, seasonIndexOf } from './ledger'
import { kidAgeAt } from './age'
import { fullRanking } from './ladder'
import { fireMilestone } from './milestones'
import { inCollege } from './college'
import { expireKnock } from './knock'
import {
  settleMandatoryDeadlines,
  settleMandatoryMisses,
  settleTourSeasonNotice,
} from './mandatory'
import { payRetainer, reviewAdOffer, reviewSponsors, rolloverKitAllowance } from './sponsors'

// --- the junior conveyor -----------------------------------------------------
// The field turns over once a year: who is still here, and who has just arrived underneath her.
// The mechanism and its whole argument live in season/conveyor.ts; this is the world-side wiring
// and the one line of news it is worth.

/** How well a departing player has to have been doing for her leaving to be NEWS. Top-50 of a
 *  ~200-strong field: somebody the player has plausibly seen in the standings or across a net. */
const NOTABLE_DEPARTURE_RANK = 50

function turnOverField(world: WorldState, seasonIndex: number): void {
  // The standings as they stand BEFORE the turnover – the only moment a departing player still has
  // a rank, because renewCohort removes her from the id list `fullRanking` is built over.
  const rankBefore = new Map(fullRanking(world).map((r) => [r.playerId, r.rank]))
  const { left, joined } = renewCohort(world.cohort, world.seed, seasonIndex)
  if (left.length === 0) return

  // The best-ranked of the ones who stopped. Named because a number alone ("9 players left") is
  // weather; a name the player has seen in the table is a story.
  let notable: { name: string; rank: number } | null = null
  for (const p of left) {
    const rank = rankBefore.get(p.id)
    if (rank === undefined || rank > NOTABLE_DEPARTURE_RANK) continue
    if (!notable || rank < notable.rank) notable = { name: p.name, rank }
  }

  const base = `A new intake: ${left.length} players have left the tour and ${joined.length} thirteen-year-olds have taken their places.`
  addEvent(world, {
    week: world.week,
    type: 'info',
    text: notable ? `${base} ${notable.name} (#${notable.rank}) is among those who stopped.` : base,
  })
}

// --- the academy's annual review ---------------------------------------------
// Runs at the season boundary, on the rank she CARRIES IN (the one the season just gone earned
// her) and the year of tournaments behind it. Zero draws on any stream – see engine/academy.ts.

/** ⭐⭐ THE THREE THINGS AN ACADEMY REVIEW CAN SAY, as openings that the WRITER below and the STOP in
 *  `advanceWeeks` both read (round 23 #16). They are shared constants and not two copies of a string
 *  for one reason: the stop has to fire on "the review spoke this week", and matching that by
 *  re-spelling the sentence at the reader would mean a reworded notice silently stops stopping. The
 *  test `academy-notice` mutates each of these and watches the stop go with it. */
export const ACADEMY_NOTICE = {
  arrived: 'An academy has taken her on',
  reviewed: 'Academy review:',
  ended: 'The academy has ended her scholarship',
} as const

/** Did the academy say anything at `world.week`? The signal the season-boundary review leaves behind,
 *  read out of the ledger it already writes – so it needs no new persisted field and no schema move. */
export function academySpokeThisWeek(world: WorldState): boolean {
  const openings = Object.values(ACADEMY_NOTICE)
  return world.events.some((e) => e.week === world.week && openings.some((o) => e.text.startsWith(o)))
}

export function reviewAcademy(world: WorldState): void {
  const seasonIndex = seasonIndexOf(world.week)
  const prev = world.academy
  if (prev && prev.seasonIndex === seasonIndex) return // idempotent per season

  // ⚠ HER AGE, NOT THE BAND'S (owner ruling 1, 09.08 - world/age.ts). The academy's junior programme
  // has an age band (`ECONOMY.academy.ageBand`, 13-18) and «she has aged out of their junior
  // programme» is a sentence about the girl the letter is addressed to. Reading the band told a
  // December seventeen-year-old she was eighteen and closed the scholarship a season early.
  const ageYears = kidAgeAt(world, world.week)
  const playedLastYear = world.results.filter((r) => r.playerId === KID_ID && world.week - r.week <= RESULTS_WINDOW).length
  const level = reviewLevel({
    rank: world.kidRank,
    potential: world.potential,
    background: world.profile.background,
    playedLastYear,
    ageYears,
  })

  if (level <= 0) {
    if (prev) {
      // Why it ended matters – "she aged out" and "she stopped playing" are different stories, and
      // the second one is a lesson.
      const reason =
        ageYears > ECONOMY.academy.ageBand[1]
          ? 'she has aged out of their junior programme'
          : playedLastYear < ECONOMY.academy.minEventsPerYear
            ? 'she barely competed this year'
            : 'her year did not make their case'
      addEvent(world, {
        week: world.week,
        type: 'info',
        text: `${ACADEMY_NOTICE.ended} – ${reason}.`,
      })
    }
    world.academy = null
    return
  }

  const pct = travelCoverPct(level)
  if (!prev) {
    fireMilestone(world, `academy-in-${seasonIndex}`, `${ACADEMY_NOTICE.arrived} – a scholarship covering ${pct}% of her travel.`)
  } else {
    const wasPct = travelCoverPct(prev.level)
    if (pct !== wasPct) {
      addEvent(world, {
        week: world.week,
        type: 'info',
        text: `${ACADEMY_NOTICE.reviewed} her scholarship ${pct > wasPct ? 'rises' : 'falls'} to ${pct}% of her travel.`,
      })
    }
  }

  world.academy = {
    level,
    // A renewal is not a new offer: the relationship keeps its start date.
    sinceWeek: prev ? prev.sinceWeek : world.week,
    seasonIndex,
    coveredCents: 0,
  }

  // "и экипа" – the kit, once a year, as money rather than as a per-purchase discount, because it
  // arrives as a delivery and not as a coupon.
  //
  // ⚠ THE GRANT STANDS DOWN UNDER A LIVE KIT DEAL (owner, 01.08: «мне кажется, что это справедливо»).
  // Until round 15 the academy paid the full grant while a signed brand deal covered the same
  // equipment lines - the family was being paid twice for one string bed. The academy is not naive:
  // at review time it reads the deal in force (`activeKitDeal`, the same one answer the wear model
  // and the travel share read) and funds only the UNCOVERED lines, a third of the grant per line.
  // Full coverage (the global rung: strings + frame + shoes) pays nothing, and the review SAYS SO in
  // the feed instead of going silent - a line that used to arrive every year and quietly stops is a
  // bug report waiting to be filed. The review is a flow, not persisted terms: nothing here touches
  // the schema, and a deal signed or lapsed between reviews is simply read fresh next year.
  // Zero draws, like everything in this review.
  const kit = kitGrantCents(level)
  const deal = activeKitDeal(world.offers, world.week)
  const covers = deal ? (deal.terms as KitOfferTerms).covers : []
  const brand = deal ? (deal.terms as KitOfferTerms).brand : ''
  const grant = Math.round((kit * (3 - covers.length)) / 3)
  if (kit > 0 && covers.length >= 3) {
    addEvent(world, {
      week: world.week,
      type: 'info',
      text: `No academy kit grant this year – ${brand} already kits her out.`,
    })
  } else if (grant > 0) {
    world.fundsCents += grant
    // The income row says what the money is FOR when a brand holds some of her lines - the parent
    // reading the ledger must be able to tell a two-thirds grant from a full one.
    const uncovered = (['strings', 'frame', 'shoes'] as KitLine[]).filter((l) => !covers.includes(l))
    const LINE_WORD: Record<KitLine, string> = { strings: 'strings', frame: 'frames', shoes: 'shoes' }
    const listOf = (lines: KitLine[]) => lines.map((l) => LINE_WORD[l]).join(' and ')
    addEvent(world, {
      week: world.week,
      type: 'income',
      category: 'academy',
      text: deal
        ? `Academy kit grant – ${listOf(uncovered)}; ${brand} covers her ${listOf([...covers])}.`
        : 'Academy kit grant – rackets, strings and shoes for the season',
      amountCents: grant,
    })
  }
}

/** ⭐ PHASE 1 OF THE WEEKLY TICK – the season boundary and the recurring obligations.
 *
 *  Called once, first, from `tickWeek`, after `world.week` has been incremented and before any
 *  money moves. Takes no `rng`: nothing in here may touch the MAIN stream (see the header). */
export function seasonBoundaryAndObligations(world: WorldState): void {
  // 0a00. R12-S1: a NEW SEASON opens – bank the rank she carries into it, before anything this year
  //       can move it. This is the only moment the number exists: by the wrap-up 49 weeks later the
  //       results behind it have been pruned out of the 52-week window and it cannot be replayed
  //       (which is exactly how the wrap-up came to report "from #1"). `world.kidRank` here is still
  //       last week's – the final off-season week of the season just gone – which is precisely "the
  //       rank she started this season on". Pure state, ZERO draws, and it runs before every RNG
  //       step so it cannot perturb the weekly sequence.
  if (world.week % WEEKS_PER_YEAR === 0) {
    world.seasonStartRank = world.kidRank
    // 0a0b (v20): AND EVERYBODY GETS A YEAR OLDER. The cohort had no age at all until now, which is
    // why it grew for ever and the ladder could never be caught. Pure arithmetic, ZERO draws, and
    // it runs beside the rank capture because they are the same event: a season turned over.
    ageCohort(world.cohort)
    // 0a0c (v21): AND THE ACADEMY DECIDES. It reads `world.kidRank` before this season can touch
    // it – the rank the year just gone earned her – which is precisely what an academy reviewing
    // her in the off-season would be looking at. ZERO draws, so it is safe this far up the tick.
    // ⚠ ...AND NOT WHILE SHE IS AT COLLEGE (W2-ENDINGS): she already has a scholarship, and it is
    //   not this one. Zero draws either way, so the boundary block's draw count is untouched.
    if (!inCollege(world)) reviewAcademy(world)
    // 0a0d: AND THE FIELD TURNS OVER. Last, because everything above is about the season that just
    // ENDED and wants the field that played it – the academy's verdict in particular is a reading
    // of her standing among those players, not among their replacements. ZERO main-stream draws:
    // the conveyor runs entirely on `seed:conveyor:<season>`. See season/conveyor.ts.
    turnOverField(world, seasonIndexOf(world.week))
    // 0a0e (08.08): AND THE KIT ALLOWANCE STARTS AGAIN, because the letter says it does.
    //
    // ⚠ THE PAPER PROMISED A SEASON AND THE CODE DELIVERED A TERM. `signOffer` zeroes `coveredCents`
    // once, at signature, and nothing ever reset it again – so on the two- and three-season rungs
    // «up to $3,000 of kit OVER THE SEASON» was really $3,000 over the whole contract, and a player
    // who read the paper was being over-promised by a factor of `seasons`. The owner's save is a
    // two-season national deal that had spent $2,463.78 of one $3,000 pot across a hundred weeks.
    //
    // ⚠ HERE RATHER THAN IN THE SPONSOR REVIEW, and that is what makes it idempotent WITHOUT a new
    // persisted field. `tickWeek` visits each week exactly once, so a reset hung on week ≡ 0 fires
    // exactly once per season by construction – no `coveredSeasonIndex`, no schema bump, no
    // migration. The sponsor window sits at weeks 47-49 and would have reset it three weeks early,
    // inside the season it was still measuring.
    //
    // AND IT REPAIRS THE GOODBYE LETTER FOR FREE: `reviewSponsors` reports `coveredCents` as
    // "kitted her out all season – $X of kit", read at the window close, which is now the season's
    // own spend rather than the term's. Zero draws.
    rolloverKitAllowance(world)
  }

  // 0a0c-bis (30.07, MOVED 01.08): AND THE SPONSORS DECIDE – in the OFF-SEASON, which is where a
  //         contract for next year is really agreed. It used to sit inside the boundary block above,
  //         so the letter landed on week 1 of the new season and the parent spent the first four
  //         weeks of competition weighing it; the owner asked for it to be tied to the start of the
  //         season instead («мне кажется было бы логичным их как раз к старту сезона привязывать»),
  //         and in the real sport equipment deals are negotiated in November and December so the
  //         player opens the year already kitted.
  //
  //         ⚠ AND SINCE 05.08 IT IS A FIVE-WEEK WINDOW (feat/sponsor-window, and the owner's own
  //         design: «нужно делать окно на все 5 недель (межсезонье +2)… и как раз в окно могут
  //         приходить письма и есть время на принятие решения и выбор»). The off-season plus the two
  //         weeks before it, `isSponsorWindowWeek`, and `reviewSponsors` is what splits the three
  //         jobs across it - the outgoing deal is judged on the first week, a letter may land on each
  //         of the first four, and the ONE feed row is written on the last. The once-a-season
  //         guarantee that used to live in this predicate now lives inside: at most one letter a
  //         week, from one rung, off a queue the week's own position indexes.
  //
  //         Placed here, in the same zero-main-draw region the boundary block occupies, and for the
  //         same reason: it takes at most one draw and that draw is on `seed:offer:<week>`, its own
  //         sub-stream. The frozen MAIN capture (41550 / e6b0c709) cannot see it.
  // ⚠ AND NOBODY WRITES TO AN AMATEUR (W2-ENDINGS). A college player on a scholarship cannot take
  //   an endorsement, which is a real rule and also the only thing that keeps the four-year freeze
  //   from being free money. `reviewSponsors` draws on `seed:offer:<week>`, never MAIN.
  if (isSponsorWindowWeek(world.week) && !inCollege(world)) reviewSponsors(world)

  // ⭐ 0a0c-quater (round 24 item 2, the-face-and-the-court.md §6 STEP 1): AND, FROM EIGHTEEN, THE
  //         OTHER KIND OF SPONSOR – a non-endemic house paying cash for her face. Weekly rather than
  //         windowed, because a campaign is not an off-season ritual and the plan's own table says
  //         the deal LAGS results; the gate (18+, a counting W standing inside the bar, one deal at
  //         a time) is `reviewAdOffer`'s own. Behind the SAME freeze gate as the kit review one line
  //         up – «nobody writes to an amateur» silences both kinds of sponsor identically, while a
  //         deal SIGNED before she enrolled keeps its banked fee and lapses on its own clock, its
  //         shoot weeks lapsing silently with it (plan §4c – no penalty, ever; `accrueCondition`
  //         guards the freeze before it charges a shoot). At most one draw, on `seed:ad:<week>`,
  //         never MAIN: the frozen capture (41550 / e6b0c709) cannot see it.
  if (!inCollege(world)) reviewAdOffer(world)

  // 0a0c-ter (W3-ACT2 §7): AND THE PROFESSIONAL RUNGS PAY A QUARTERLY RETAINER. Four arrivals a
  //         season on fixed offsets (0 / 13 / 26 / 39) rather than one number at the boundary,
  //         because a retainer is a WAGE and one annual figure would read as the cheque the whole
  //         inbox replaced. Beside the sponsor review because it is the same contract talking, and
  //         ZERO draws, so it is safe this far up the tick.
  payRetainer(world)

  // 0a0-w4. W4: retire a knock whose weeks are up. FIRST of the pure-state steps, because everything
  //         below that reads it – `injuryTau` at step 1c most of all – must see the same answer for
  //         the whole week. ZERO draws.
  expireKnock(world)

  // 0a0-inbox (v32). ⚠ AND A LETTER LEFT TOO LONG IS GONE. The window is the feature, not a courtesy
  //         (docs/specs/offers-and-the-inbox.md §2): an offer past its deadline lapses, whether or not
  //         the parent ever opened it, and the inbox dot goes out on its own when the last one does.
  //         Beside `expireKnock` because it is the same kind of step - a deadline the world keeps for
  //         the player rather than a decision it makes for him - and ZERO draws, so it is safe this
  //         far up the tick.
  //
  // ⚠ AND IT DELIBERATELY WRITES NOTHING IN THE FEED, which is the one place this slice had to give
  // something up. See the note on `reviewLocalSponsor` for the measurement: a non-match event row
  // permanently displaces a MATCH from the 400-row cap, and the radar's estimate is measured over the
  // matches that window still holds. So the whole inbox is held to the same feed budget as the cheque
  // it replaced - one row per season boundary and not one more - and an expiry is carried by the two
  // surfaces that already carry it truthfully: the dot goes out, and the letter itself says "Expired"
  // in the inbox for as long as the career lasts.
  expireOffers(world.offers, world.week)

  // 0a0-tour (v38, W3-ACT2 §6). THE TOUR'S OWN DESK, and its two steps are in this order for the
  //         reason the whole regime exists: the WARNING first, the CHARGE second, so that no career
  //         can ever be charged for an obligation it was not written to about.
  //
  //         `settleMandatoryDeadlines` fires at the entry deadline of every mandatory event she is
  //         bound to and has not entered - two weeks before the tournament, while entering is still
  //         possible. `settleMandatoryMisses` fires on the event's OWN week, for the obligations
  //         whose deadline has since passed, and writes both the penalty and the zero that occupies
  //         one of her sixteen counted slots.
  //
  //         Placed with the inbox's own steps because that is what they are - deadlines the world
  //         keeps for the player - and ZERO DRAWS on any stream, so the frozen MAIN capture
  //         (41550 / e6b0c709) cannot see either of them. It is also above every gate that reads
  //         `isSuspendedAt`, so a suspension handed down this week is in force for the rest of it.
  settleMandatoryDeadlines(world)
  settleMandatoryMisses(world)
  // ⭐ round-18 #8 – ...AND THE REGIME ITSELF IS ANNOUNCED, not only its individual obligations. One
  //         letter per season she is bound in, written on the first week of that season in which she
  //         is (its opening week in every year but the first, the crossing week in the first). It is
  //         ABOVE the two settlements on purpose, so the season a career crosses in cannot have a due
  //         notice reach the inbox before the letter that explains what a due notice is. The blocking
  //         half of the same item is `buildTourBriefing`, read at snapshot time. ZERO draws.
  settleTourSeasonNotice(world)
  // ⭐ round-24 #1 – AND THE SCHOLARSHIP IS ON PAPER TOO (owner, 20.08: «Я бы и рад изучить, да
  //         только далее не знаю где»). The toast round 23 #16 gave the verdict still does its own
  //         job, which is to say WHEN; this is the destination it never had. It sits HERE, one line
  //         under the tour's own season letter, because the letter has to be able to report the week
  //         it describes: `reviewAcademy` has already spoken this tick (above, in the season-boundary
  //         block) and the grant's income row is already written, so `settleAcademyLetters` reads
  //         both rather than re-deriving either. ZERO draws.
  settleAcademyLetters(world)
}

// ⭐⭐ THE TOURNAMENT CLOSE – committing the kid's run, and the three commands that read it out
// (A-04 (a) / T6.5, the last span-moves P4 left; docs/review/proposals/P4-world-decomposition.md).
//
// WHAT IS HERE AND WHY IT IS ONE MODULE. The week has already been simulated when these run: the
// shadow tournament sits in `world.pendingTournament` and nothing below rolls a die. `finalizeTournament`
// commits it once – points, the summary, the milestones, the rank recompute and the housekeep – and
// the three commands (`revealTournamentRound`, `skipTournament`, `closeTournament`) are the doors the
// player opens it through. They call each other and nothing else calls them, which is why they are a
// module rather than five: the 26.09 lane measured this cluster at ZERO call-backs into the
// integration core (`docs/review-principles-2026-09-26/probes/world-callbacks.mjs`), so it moved
// whole, by P4's rule, with no dependency inversion and no changed signature.
//
// ⚠ RNG: ZERO DRAWS, ON EITHER STREAM. Nothing here derives a sub-stream and nothing touches MAIN –
// the run was rolled at the tick on `seed:kidtour:<eventId>` and `pendingTournament` carries its
// result, so these three read it OUT and commit it. The frozen capture (41550 / e6b0c709) cannot see
// this file, which is what makes the move provably identical.
//
// ⚠ `rankingDeltaSuffix` TRAVELS WITH ITS ONE CALLER and stays on the barrel: it is the sentence
// `finalizeTournament` appends to a summary, and it is exported because the tests and the ladder's
// own copy pins read it.
import { formatShortName } from '../../shared/format'
import { weekLabel } from '../../shared/dates'
import { formatCents } from '../../shared/money'
import type { MatchPlayer } from '../match/types'
import type { MatchRecord, SeasonEvent } from '../season/types'
import { TIERS } from '../season/calendar'
import { clamp, tournamentRunStrain } from '../condition'
import { ECONOMY, kidPrizeShareBps, kidPrizeShareCents, staffPrizeShareCents, staffResultShareBps } from '../economy'
import { BEST_N_BY_TRACK, WINDOW_BY_TRACK, RANKABLE_MIN, windowedBestSum } from '../season/ranking'
import { isFieldProId } from '../season/fieldPros'
import { addEvent, accrueCoachCut, accrueKidShare } from './ledger'
import { kidMatchEvent, kidMatchesOf, rivalRetirementNews } from './matchNews'
import { retirementInjury } from './injury'
import { masseurSessionCents, masseurTourRelief, masseurTourWeekCents } from './masseur'
import { eventById } from './bookings'
import { fireMilestone, captureMilestone, emptySeasonRecord } from './milestones'
import { resolveEndings } from './endings'
import {
  callUpRevealOpen,
  closeCallUpReveal,
  closeCollegeLeagueReveal,
  collegeLeagueRevealOpen,
  // ⭐ ROUND 42 #25 – the paused-step count `finalizeTournament` reads before it splits a cheque.
  collegePausedShareYears,
  revealCallUpRubber,
  revealCollegeLeagueRound,
  skipCallUpRubbers,
  skipCollegeLeagueRounds,
} from './college'
import { appearanceFeeFor, resultBonusFor, bankSponsorCheque } from './sponsors'
import { inTrack, fieldProsOf } from './ladder'
import { KID_ID, SLAM_DEBUT_KEY } from './constants'
import { finishLabel, prizeCentsFor } from './labels'
import { kidAgeYears } from './age'
import { housekeep, recomputeRankAndMilestones } from './bookkeeping'
// ⚠ TYPE-ONLY, AND THAT IS THE WHOLE OF WHY THIS IS NOT A CYCLE (CLAUDE.md's P4 rules): the barrel
// imports these four names back and re-exports them under their historical names, and this import is
// erased at compile time, so no runtime edge points from the package back at `world.ts`.
import type { WorldState } from '../world'

/** The clause appended to a tournament summary that explains the EFFECTIVE ranking change
 *  (round-5 item 1a). `delta` is the change in the kid's windowed best-N sum caused by the
 *  new result: `points` when nothing was displaced, `points − displaced` when a counted
 *  result was pushed out, `0` when the result didn't crack the best N. `bestN` is the TRACK's
 *  window width (W2-LADDER §3) so the sentence names the rule it measured against - "best 6" on a
 *  junior summary, "best 18" on a professional one - instead of quoting the junior rule at both.
 *  It reads the constant rather than a literal, so the 05.08 correction from sixteen to the
 *  rulebook's eighteen changed this copy without touching this function.
 *
 *  ⚠ AND THE THIRD CASE IS THE MINIMUM (points-by-the-book, 05.08, §VIII.A.2.b). A player who has
 *  scored but is not yet on the list has `after === 0` with `points > 0`, and the old two-case
 *  sentence would have told her the result "does not improve best 18" – true of the arithmetic and
 *  nonsense to read, because the reason is not that her window was full, it is that she has no
 *  window yet. `notRanked` says which rule is holding her instead. It is passed by the call site
 *  rather than derived here, because this function is a formatter and knows nothing about tables. */
export function rankingDeltaSuffix(points: number, delta: number, bestN: number, notRanked = false): string {
  if (points <= 0) return ''
  if (notRanked) return ` (+${points} banked – a ranking needs ${RANKABLE_MIN.tournaments} events with points, or ${RANKABLE_MIN.points})`
  if (delta <= 0) return ` (does not improve best ${bestN})`
  if (delta < points) return ` (ranking total +${delta})`
  return ''
}

// Commit the kid's run: award points, emit the summary + milestones, recompute rank + housekeep.
// Runs once, when the last kid match is revealed. Keeps `pendingTournament` alive (finished: true)
// so the finale stays a real snapshot; `closeTournament` clears it.
function finalizeTournament(world: WorldState): void {
  const p = world.pendingTournament
  if (!p || p.finished) return
  const event = eventById(world, p.eventId)
  if (!event) {
    world.pendingTournament = null
    return
  }
  const tier = TIERS[event.tier]
  const kidFinish = p.result.finishes[KID_ID] ?? Math.log2(tier.drawSize)
  const points = tier.points[kidFinish] ?? 0
  // ⚠ SHE STOPPED, AND THE OWNER'S RULING IS THAT NOTHING ON THIS LINE CHANGES (10.08: «если травма
  // до матча – ничего не защитываем, если во время – защитываем поражение в текущей ступени»).
  // A retirement is a defeat in the round she reached and pays that round in full - the same finish
  // index, the same points table, the same cheque. There is no partial credit and no haircut, at any
  // level: ITF WTT Regs Women's §XII.C.5.b ("she shall receive the loser's prize money / points for
  // the round in which she retired"), WTA §VIII.B.3.a.i(b) + §IX.C.1.a.ii, ITF Juniors Reg 31 a) i)
  // (where the question does not arise because juniors are paid nothing, ever). See
  // docs/research/retirement-and-withdrawal.md §§2-3 and docs/specs/match-retirement.md §3.
  //
  // ⚠ WHICH IS WHY THIS IS A LOOKUP AND NOT A BRANCH. `retiredRound` is read purely to write the
  // right sentence and to open the injury; the arithmetic above it never sees it. A version of this
  // feature that discounted the points would have needed a reason, and there is not one anywhere in
  // four rulebooks.
  const retiredMatch = kidMatchesOf(p.result).find((m) => m.retiredId === KID_ID)

  // v10: remember the kid's best (smallest) finish index per tier – drives the Home season strip.
  const priorBest = world.bestFinishByTier[event.tier]
  if (priorBest === undefined || kidFinish < priorBest) world.bestFinishByTier[event.tier] = kidFinish

  // v31: ...AND THE CABINET REMEMBERS EVERY ONE OF THEM, which the line above cannot. That is a
  // high-water mark: it holds 0 or 1 and never both, it carries no week, and the day she finally
  // wins a tier it OVERWRITES the runner-up it was holding. Nothing else in the save counts either:
  // `milestones` keeps firsts (one row per tier however many she wins), `results` prunes at 52
  // weeks, `events` at 400. So five J30 titles were, until this line, one row and no years.
  //
  // ⚠ THE TWO ARRAYS ARE DISJOINT: `=== 0` and `=== 1`, never `<= 1`. The milestone capture eight
  // lines below deliberately uses `<= 1`, because reaching a first final is the moment a MEMORY
  // wants and winning it is reaching it. A CABINET is the other question - which piece of
  // silverware came home - and one week produces exactly one piece. Counted the milestone's way,
  // the silver plate would light up the first time she WON something and would then claim a tally
  // of finals she never lost. Runner-up has to be countable on its own or the silver half of the
  // screen is a lie. (See `TierTrophies` in protocol.ts.)
  //
  // No draw, no stream, no reordering - a push onto an array the RNG cannot see. The frozen MAIN
  // capture (41550 / e6b0c709) is untouched by construction.
  //
  // The row is created on demand rather than assumed, and that is v30's lesson written down: a
  // migration runs ONCE, so a save upgraded today holds exactly today's tiers, and the week a tenth
  // rung joins TIER_LADDER every one of those saves reaches this line with no shelf for it. That is
  // precisely how `record[track].wins++` came to throw on `undefined` when `LadderTrack` gained
  // `wta`. `emptyTrophyLedger` already follows the ladder for NEW careers; this makes the existing
  // ones grow a shelf the first time they need one, so no future rung needs a migration at all.
  const cabinet = (world.trophiesByTier[event.tier] ??= { titles: [], finals: [] })
  if (kidFinish === 0) cabinet.titles.push(world.week)
  else if (kidFinish === 1) cabinet.finals.push(world.week)

  // v10: count this season's kid wins/losses as they resolve (never re-parsed from text; pruning
  // can't lose them). Every match on the kid's path is one played match.
  //
  // v28: AND THE SAME MATCH IS COUNTED INTO ITS OWN LADDER, one line further on. This is the whole of
  // the owner's «разделить победы и поражения» and it needs no new fact: the event is right here, the
  // event carries its tier, and the tier carries its track, so the attribution is read rather than
  // decided. The two counters and the pair are maintained together on purpose – the pair is a
  // DECOMPOSITION of the totals, not a replacement for them, and anything that increments one and not
  // the other breaks the invariant the Stats screen shows both halves of.
  const track = tier.track
  const record = (world.seasonRecord ??= emptySeasonRecord())
  for (const m of p.result.matches) {
    if (m.aId !== KID_ID && m.bId !== KID_ID) continue
    if (m.winnerId === KID_ID) {
      world.seasonWins++
      record[track].wins++
    } else {
      world.seasonLosses++
      record[track].losses++
    }
  }

  // A2: AND THIS IS WHERE THE TENNIS FINALLY PAYS HER (task #17). Same commit point as the points,
  // off the same finish index, out of the tier's own table – so a result cannot award one without
  // the other and a skipped event or a medical withdrawal pays nothing because it never reaches
  // finalize.
  //
  // ⚠⚠ RESTATED BY THE RETIREMENT SLICE (10.08), AND READ THIS BEFORE TRUSTING THE SENTENCE ABOVE.
  // It used to end "...a skipped event or a walkover pays nothing because it never reaches
  // finalize", and a reader took from it the rule that AN INJURY WEEK NEVER PAYS. That rule is now
  // FALSE, and leaving the old wording would have been worse than no comment at all. What is true:
  //
  //   NEVER REACHES FINALIZE (still, and unchanged): a skipped event; the walkover branch in
  //     tickWeek (entered, the layoff covers the week, she never takes the court); the medical
  //     withdrawal. All three are the rulebooks' WITHDRAWAL, not their walkover – see the note on
  //     `arrivalStatus`' verdict and research §1 – and all three correctly pay nothing.
  //   REACHES FINALIZE AND IS PAID IN FULL (new): a RETIREMENT. She took the court and stopped, so
  //     the round she had reached is hers, cheque included. This is the whole of the owner's ruling
  //     and it is also what every rulebook says.
  //
  // The distinguishing question was never "did she get hurt" – it is "did she strike a ball". The
  // real tours price exactly that difference deliberately, to make a player start the match: an ITF
  // first-round WITHDRAWAL "will receive no prize money, and the Tournament shall not count on their
  // record" (§XII.C.5.b.i.2.d) while a retirement in the same round is paid. Two more comments in
  // this file (the appearance fee, ~40 lines down; the run's condition strain, ~70 down) and one in
  // shared/protocol.ts (`SeasonSummary.prizeCents`) leaned on the same invariant and are restated in
  // the same terms.
  //
  // ⚠ NO WEALTH CORRIDOR ON THIS LINE, AND THAT IS THE WHOLE POINT OF IT. Everything else the family
  // touches is priced by where they come from: the trip that got her here was multiplied by
  // ECONOMY.travelBgFactor, the coach is billed in the market they can afford, the physio bill has
  // its own factor. The cheque is not a price, it is what the tournament pays the person who won the
  // match, and a working family and a wealthy one are handed the identical piece of paper. It is the
  // only number in the game of which that is true, and it is what makes the cliff mean the same thing
  // to everybody. If a future slice wants a background-scaled income, it must NOT reach for this one.
  const prize = prizeCentsFor(event.tier, kidFinish)
  if (prize > 0) {
    // ⭐⭐ ROUND-23 #18 – AND FROM EIGHTEEN THE CHEQUE IS SPLIT BEFORE IT REACHES THE FAMILY.
    //
    // The owner: «после появления её счета в банке в 18 начать ей призовые переводить какие-то суммы,
    // например начать с 10-20% и может быть наращивать год к году», and on the ceiling: «может не до
    // 30, а до 40 или 50 вообще, это всё-таки ее карьера?». The ramp is `ECONOMY.kidShare` (10% at
    // 18, +5 a birthday, half from 26); nothing about it is spelled out here.
    //
    // ⚠⚠ IT LEAVES THE FAMILY WALLET, AND THAT IS THE DECISION. `world.fundsCents` receives the
    // family's part ONLY, so a parent watching his daughter's cheques get bigger also watches his own
    // share of them get smaller – which is the mechanic he asked for. The alternative on the table was
    // to credit the wallet in full and tally hers beside it; that costs the player nothing, decides
    // nothing, and «это всё-таки её карьера» is an argument about whose money it is.
    //
    // ⚠ ONE ROUNDING, AND THE FAMILY GETS THE REMAINDER. `kidPrizeShareCents` rounds once and this
    // subtracts, so the two balances add up to the tournament's cheque to the cent – a player can put
    // the two numbers side by side on screen and they must not disagree by a penny.
    //
    // ⚠ THE LEDGER ROW IS WHAT THE FAMILY ACTUALLY BANKED, which is the academy travel subsidy's own
    // precedent one file over: a scholarship's travel half «is taken off the travel line itself, so
    // the ledger shows the reduced price the family actually paid». `careerTotals.prizeCents` follows
    // it and therefore becomes prize money THE FAMILY KEPT – the number the album's break-even page
    // is really about, since the family is the side that did the spending.
    //
    // ⚠ HER REAL AGE (`kidAgeYears`), never the band's – the one-clock ruling of 09.08. Zero draws:
    // this is integer arithmetic on a cheque that has already been decided.
    //
    // ⭐⭐⭐ ROUND 42 #25 – AND THE STEPS COUNT TOUR YEARS ONLY («пока она снова в тур не вернется»),
    // so the ramp is read at (her age, the birthdays college ate). `collegePausedShareYears` is the
    // ONE derivation of that count and the rate below, the sentence in the ledger row and the memo
    // on the recap all go through this one `pausedShare` – two reads of it here would be two
    // percentages on one cheque, which is the defect round 30 #21 exists to have ended.
    const ageNow = kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay)
    const pausedShare = collegePausedShareYears(world)
    const herShare = kidPrizeShareCents(prize, ageNow, pausedShare)
    const familyShare = prize - herShare
    world.fundsCents += familyShare
    world.kidFundsCents = (world.kidFundsCents ?? 0) + herShare
    addEvent(world, {
      week: world.week,
      type: 'income',
      category: 'prize',
      // Names the finish, because the whole design is that the player should be able to read this
      // line against the travel line two rows up and feel the arithmetic. Short dash only.
      // ⚠ AND IT NAMES THE SPLIT WHEN THERE IS ONE, because a prize row that quietly shrank by half
      // would read as a bug in the till. Silent before her eighteenth, where nothing is deducted.
      //
      // ⭐⭐ ROUND 26 #5b – ...AND SINCE 25.08 IT NAMES THE MONEY AND NOT ONLY THE RATE. The owner:
      // «неплохо бы об этом где-то игроку сообщать, кстати». The percentage alone cannot be read
      // against the figure beside it: a parent looking at «+$3,250.00 · less her 35% share» has to
      // do the arithmetic to learn what left, and the whole design of this row is that he should be
      // able to READ it. The `info` row two blocks down already carries the cents, but it has no
      // `amountCents` and `snapshot.financialEvents` filters on exactly that – so on the MONEY
      // screen, the one surface a parent opens to look at money, the transfer was invisible. Same
      // rounding, same variable: `herShare` is the cents the account actually received, not a second
      // computation of it, so the two rows can never disagree.
      text:
        herShare > 0
          ? `${tier.label} prize money – ${finishLabel(kidFinish)}, less her ${kidPrizeShareBps(ageNow, pausedShare) / 100}% share (${formatCents(herShare)})`
          : `${tier.label} prize money – ${finishLabel(kidFinish)}`,
      amountCents: familyShare,
    })
    // ...and the transfer itself gets a row of its own, so the money can be followed out of one
    // account and into the other. NO `amountCents`: the family ledger has already recorded what it
    // received, and booking her share as a family EXPENSE would count the same cents twice - once
    // against `careerTotals.spentCents`, which is the denominator of the album's break-even page.
    if (herShare > 0) {
      addEvent(world, {
        week: world.week,
        type: 'info',
        text: `${world.profile.kidName}'s share of the prize money – ${formatCents(herShare)} into her own account`,
      })
      // ⭐⭐ ...AND THE SAME CENTS ARE PARKED ON THE DURABLE LEDGER, so the week recap can say it too.
      //
      // THE OWNER, 27.08: «на плашке Finances на week recap после турниров можно писать что-то вроде
      // Income $sum / Spent $sum / Her cut 10% $sum / Balance $sum. Мне кажется так будет нагляднее»
      // – and, once shown that subtracting it again would double-count, «(B) мемо под балансом - вот
      // это хорошо, да». So the recap prints it BELOW the balance as a memo and the balance does not
      // move: `Income` there is `familyShare`, already net, exactly as this block decided above.
      //
      // ⚠ NOT ON THE `info` ROW ABOVE, AND THE CHOICE IS MEASURED, NOT STYLISTIC. The recap's
      // Finances tile was moved OFF the event feed on 05.08 because the feed is count-capped
      // (EVENTS_CAP = 400) and the owner's own save at week 412 deleted every money row on the tick
      // that wrote it – see the tile's note in WeekRecapCard.vue: «"the money for one week" is a
      // question a count-capped feed must never be asked.» Her cut for the week is money for one
      // week, so it goes where the tile's other three figures already come from: `financeWeeks`,
      // which prunes on a 60-WEEK window and therefore always holds the week the card is showing.
      //
      // ⚠ `herShare` ITSELF, NOT A RATIO INVERTED BACK OUT of the family's row – the one-rounding
      // rule stated twenty lines up. And the RATE beside it is `kidPrizeShareBps(ageNow)`, the very
      // call the sentence above divides by, so the memo and the ledger row can never quote two
      // different percentages. Zero draws: a state write on a cheque already decided.
      // ⭐⭐ ROUND 29 #10 – AND THE BASE IS `prize`, THE GROSS CHEQUE, not the `familyShare` the row
      // two blocks up reports. That distinction IS the item: the ledger row is deliberately «what
      // the family actually banked», so the only prize figure any screen could reach was already
      // net of the very cut the memo was quoting a percentage of.
      // ⭐⭐⭐ ROUND 30 #21 – tagged `prize`, so the week recap can name HER RAMP («50% of every prize
      // cheque», the rule the budget screen states) instead of averaging it with a brand cheque that
      // splits under a different rule entirely. The rate handed in is unchanged.
      accrueKidShare(world, world.week, herShare, kidPrizeShareBps(ageNow, pausedShare), prize, 'prize')
    }
    // ⭐⭐ ROUND-24 – AND THE TEAM IS PAID ON THE RESULT (owner 22.08, docs/plans/the-team-share.md
    // §3 as re-ruled). His model verbatim: «3млн призовые из них отчисляется процент дочери (скажем
    // 30 для примера) и тренеру (скажем 10 для примера) – это будет 900к дочери и 300к тренеру плюс
    // остальные расходы» – and the masseur joined the same day, smaller («может по-меньше чем
    // тренеру, но давать»). A UNIVERSAL rule, not a contract form: computed here from `ECONOMY`
    // constants and the finish, nothing persisted, nothing chosen at hire – the architect's
    // form-choice design is dead by the owner's own ruling.
    //
    // ⚠ TITLES AND FINALS ONLY («за победы или 2е места», «за 2е только по-меньше») – below a
    // final `staffPrizeShareCents` returns 0 and no row is written. PRO TOUR ONLY (`track ===
    // 'wta'`): junior tennis is not the convention's world and its cheques are pocket change.
    // INDEPENDENT OF ANY TRAVEL SWITCH – «тренер может не ездить, но долю получать … вполне
    // может» – but only a FILLED seat: a self-coached family owes no coach share and an empty
    // table no masseur share.
    //
    // ⭐⭐⭐ ROUND 42 #41 (15.09) – AND THE FIRST OF THOSE SENTENCES NO LONGER DESCRIBES THE COACH.
    // His ruling, off his own research: «10% безусловных отчислений с любых призовых, независимо от
    // глубины прохода». The coach's `everyBps` is 1000, so `staffPrizeShareCents('coach', …)` is
    // positive at EVERY finish and the `coaching` row below is written on a first-round cheque too.
    // ⚠ NOT ONE LINE OF THE ARITHMETIC HERE CHANGED FOR IT, which is the point of the rates living on
    // `ECONOMY`: the gates (pro tour, filled seat, travel-blind), the gross base, the single rounding
    // and the family-keeps-the-remainder subtraction are all exactly what round 24 built.
    // ⚠ THE MASSEUR KEEPS THE TITLE-AND-FINAL SHAPE (`everyBps: 0`), so his block below is still
    // silent below a final – whether he follows the coach is the owner's open question, measured in
    // docs/specs/coach-every-cheque-2026-09.md §5 and deliberately not decided here.
    // ⚠ THE ORDER IS UNTOUCHED AND IT STILL CANNOT MATTER: her share comes off the GROSS above and
    // both staff shares come off that same GROSS, so no hand shrinks another's base. That is round 41
    // A1's pinned property and the every-cheque arm rides it rather than reopening it.
    //
    // ⚠ BOTH SHARES OFF THE GROSS, EACH ROUNDED ONCE, THE FAMILY KEEPS THE REMAINDER – the kid
    // ramp's own discipline, fourth and fifth hands on the same cheque: her share is untouched
    // above, and funds move by familyShare − coachShare − masseurShare, so the four pieces re-add
    // to the tournament's cheque to the cent.
    //
    // ⚠ EXPENSE ROWS, NOT A SMALLER INCOME ROW, and the categories are the seats' own: the coach's
    // share lands under `coaching` and the masseur's under `staff`, so the Money screen's
    // breakdown, the season wrap and `careerTotals.spentCents` all absorb them through `addEvent`'s
    // one choke point with no second tally – the coaching line the wrap prints simply stops lying
    // by never having been given the chance. Zero draws: integer arithmetic on a decided cheque.
    const coachShare = track === 'wta' && world.coachId !== null ? staffPrizeShareCents('coach', prize, kidFinish) : 0
    if (coachShare > 0) {
      world.fundsCents -= coachShare
      addEvent(world, {
        week: world.week,
        type: 'expense',
        category: 'coaching',
        // No pronoun names the coach (R15-7 – women are on every roster by construction).
        text: `Coach's share of the prize money – ${staffResultShareBps('coach', kidFinish) / 100}% of the ${tier.label} cheque`,
        amountCents: -coachShare,
      })
      // ⭐⭐ ROUND 29 PART TWO #13 – AND THE SAME CENTS ARE PARKED ON THE DURABLE LEDGER, so the
      // WEEKLY screen can name them. The owner, 29.08: «вот и можно как раз добавить cut тренера на
      // weekly экране для прозрачности». Part-one #13 put the RULE on the coaches page; this is the
      // FIGURE, on the week he actually reads.
      //
      // ⚠ NOT ON THE EXPENSE ROW ABOVE, AND THE CHOICE IS THE ONE HER CUT ALREADY MADE, MEASURED:
      // the recap's Finances tile was moved off the event feed on 05.08 because the feed is
      // count-capped (EVENTS_CAP = 400) and a save at week 412 deleted every money row on the tick
      // that wrote it. «The money for one week» is a question a count-capped feed must never be
      // asked, so this goes where the tile's other figures come from – `financeWeeks`, pruned on a
      // 60-WEEK window and therefore always holding the week the card is showing.
      //
      // ⚠ `coachShare` ITSELF and `staffResultShareBps` ITSELF, the same two values the row above
      // prints and the wallet was debited by, so the memo and the ledger row can never quote two
      // different percentages. ⚠ It does NOT re-book the money: `accrueCoachCut` writes a memo
      // field, never `byCategory` – the expense is the row above and it is counted exactly once.
      // Zero draws: a state write on a cheque already decided.
      accrueCoachCut(world, world.week, coachShare, staffResultShareBps('coach', kidFinish))
    }
    const masseurShare = track === 'wta' && (world.masseurHired ?? false) ? staffPrizeShareCents('masseur', prize, kidFinish) : 0
    if (masseurShare > 0) {
      world.fundsCents -= masseurShare
      addEvent(world, {
        week: world.week,
        type: 'expense',
        category: 'staff',
        text: `Masseur's share of the prize money – ${staffResultShareBps('masseur', kidFinish) / 100}% of the ${tier.label} cheque`,
        amountCents: -masseurShare,
      })
    }
    // D10 + R15-5: THE FIRST CHEQUE IS A MILESTONE (owner, 01.08: «я believe it's a very memorable
    // moment»). The first week the tennis pays her anything at all - after years of the family
    // paying for everything - is a beat the career keeps: captured into the durable ledger (one row
    // per career, `milestoneKey` collapses repeats) and fired once into the feed with the real
    // figure on it, because "$130 for a first-round exit" and "$2,200 for the title" are different
    // memories and the ledger line two rows up already taught the player to read the number.
    // Same commit point as the cheque itself, so a walkover or a skip can never fire it. Zero draws.
    captureMilestone(world, { type: 'prize', week: world.week, tier: event.tier })
    fireMilestone(
      world,
      'first-prize',
      // ⚠ E-12: `formatCents`, not a fifth hand-rolled copy of it. Byte-identical here – the
      // hand-roll WAS `Math.round(cents / 100).toLocaleString('en-US')` behind a `$`, and a prize is
      // never negative, so the sign arm the helper adds cannot fire. Pinned both ways in
      // tests/engine-money-strings.test.ts.
      `💰 First prize money – ${formatCents(prize)} at the ${tier.label}!`,
    )
  }

  // A3 (W3-ACT2 §7): AND THE BRAND PAYS TOO, at the same commit point and for the same reason. An
  // APPEARANCE FEE is money for being on the poster and a RESULT BONUS is a share of the cheque she
  // just won - both are the professional rungs' own terms (tour / premium / icon), both are zero
  // while no such deal is running, and both are frozen onto the signed offer rather than re-read
  // from ECONOMY, so a contract is honoured under the numbers it was signed under.
  //
  // ⚠ COMMITTED HERE AND NOWHERE ELSE, which is what makes an appearance fee conditional on
  // APPEARING: a skipped event, a walkover or a medical withdrawal never reaches finalize, so
  // neither line pays. And neither scales with the wealth corridor - see the prize note above, which
  // is the same rule for the same reason.
  //
  // ⚠⚠ RESTATED BY THE RETIREMENT SLICE (10.08). "Conditional on APPEARING" is still exactly right,
  // and the retirement is the case that shows what the word was always doing: she DID appear. She
  // was on the poster, she walked out, she played. So both lines pay on a retirement, and that is
  // not a loophole – an appearance fee is money for being there, and she was. What still pays
  // nothing is the trio that never reaches this function: a skipped event, the injury walkover and
  // the medical withdrawal, none of which put her on a court. See the fuller restatement above the
  // prize money.
  //
  // ⭐⭐ ROUND-28 #15 – AND BOTH ARE SPLIT WITH HER, at the ramp the prize money above already uses.
  // The owner: «С чеков спонсоров мне кажется ребёнку тоже нужно % перечислять, как и с призовых».
  // `bankSponsorCheque` credits the family and her from ONE rounding and writes both rows – the
  // whole ruling, and the list of which sponsor money it does and does not reach, is in its header
  // in world/sponsors.ts. The RESULT BONUS is the sharpest case there: it is literally a fraction of
  // the very cheque split forty lines up, so leaving it whole would make her realised share of a
  // winning week fall as sponsorship grows.
  const appearance = appearanceFeeFor(world, event.tier)
  if (appearance > 0) {
    bankSponsorCheque(world, appearance, { category: 'income', text: `Appearance fee – ${tier.label}` })
  }
  const bonus = resultBonusFor(world, event.tier, kidFinish)
  if (bonus > 0) {
    bankSponsorCheque(world, bonus, {
      category: 'income',
      text: `Sponsor bonus – ${finishLabel(kidFinish)} at the ${tier.label}`,
    })
  }

  // R9-7: the run's physical toll lands HERE, when it commits – per-match, not flat per tier.
  // A skipped event week (R9-9) or a walkover never reaches finalize, so neither costs strain.
  //
  // ⚠⚠ RESTATED BY THE RETIREMENT SLICE (10.08). A RETIREMENT DOES REACH FINALIZE, so it DOES cost
  // strain – and it costs the honest amount without a rule of its own, which is the point worth
  // recording. `tournamentRunStrain` folds `matchDrain` over the run's records and `matchDrain`
  // reads the SCORELINE; a retirement's scoreline is the partial one she stopped at, so a match she
  // walked off after five games is priced as the shorter thing it was. Her body then takes the
  // layoff on top, opened below by `retirementInjury` – so the week charges her for the tennis she
  // played and for the injury separately, which is the truth of it.
  // ⭐ v59 STEP 2 – AND THE HANDS THAT MADE THE TRIP TAKE SOME OF IT BACK (the owner's deep-run
  // question, «влияет ли он на восстановление на глубоких играх»). `masseurTourRelief` is per
  // NIGHT BETWEEN ROUNDS – × (matches − 1), capped at the strain – so a first-round exit buys
  // nothing and a title week buys the most, which is the fare pricing exactly the thing it
  // insures. Gated on `p.masseurThere`, written in the arm that CHARGED the fare: the bill and
  // the effect are one decision about one week by construction. Zero draws on any stream.
  const runMatches = kidMatchesOf(p.result)
  const runStrain = tournamentRunStrain(event.tier, runMatches)
  const tourRelief = masseurTourRelief(runMatches.length, runStrain, p.masseurThere ?? false)
  world.condition = clamp(
    world.condition - (runStrain - tourRelief),
    ECONOMY.condition.min,
    ECONOMY.condition.max,
  )
  // The receipt, on a run deep enough to have really used the table – the legibility half of the
  // plan's §4 law, one bounded line per tournament. Quiet on shallow weeks: a beat for every
  // R1 exit would teach the player the line means nothing.
  if (tourRelief > 0 && runMatches.length >= 3) {
    addEvent(world, {
      week: world.week,
      type: 'info',
      text: 'Deep week, fresh legs – the table work on tour kept the run from eating her.',
    })
  }
  // ⭐ ...AND THE WEEK HE BOARDED IS BILLED PER MATCH (owner 22.08: «на неделе выезда по-матчевая
  // цена заменяет недельную»). `resolveMasseur` stood the weekly rung bill down when the play arm
  // recorded `masseurThere`; this is the replacement, at the one point the matches are known –
  // matches played × the $75 session, so a Slam title week is 7 × $75 = $525 (exactly the daily
  // rung's home week) and a first-round exit is one session. Charged off the recorded fact, not
  // the current hire – he made the trip whatever the family decided since (the round-21 #2
  // doctrine). Fare on top, exactly as at home. Zero draws.
  if (p.masseurThere ?? false) {
    const tourBill = masseurTourWeekCents(runMatches.length, masseurSessionCents(world))
    if (tourBill > 0) {
      world.fundsCents -= tourBill
      addEvent(world, {
        week: world.week,
        type: 'expense',
        category: 'staff',
        text: `Masseur on tour – ${runMatches.length} ${runMatches.length === 1 ? 'match' : 'matches'} worked, billed per match`,
        amountCents: -tourBill,
      })
    }
    // A trip he MADE settles any older return debt too: the between-rounds relief was this
    // week's work, and the return she comes home from is this tournament's, not a stale one's.
    delete world.masseurReturnDue
  } else if (world.masseurHired ?? false) {
    // ⭐ THE RETURN-WEEK SESSION'S MARK (owner 22.08: «довесить послетурнирное восстановление 1
    // сеанс массажа по возвращении»): he was NOT flown, so the first non-played week after this
    // run gets one extra session's worth of recovery – settled and receipted by
    // `resolveMasseurReturn`. Written at the commit point for the same reason the cheque is: a
    // walkover, a skip or a medical withdrawal never reaches finalize, and none of them is a trip
    // to return from. Overwriting an unspent older mark is correct – she has been home since.
    world.masseurReturnDue = world.week
  }

  // Effective ranking delta = kid's windowed best-6 sum after adding the result minus before.
  //
  // THE KID'S ROW IS STILL AWARD-ONLY, deliberately (fix/rival-fatigue-rows). The cohort's rows
  // became APPEARANCE rows because the ledger is the only record rival fatigue has; the kid needs
  // no such record – her run's strain is charged directly, twenty lines above, off the very match
  // list that produced it. What she does still read out of the ledger is `playedWeeksInTrailing4`
  // (the consecutive-play multiplier on injury risk), and THAT is under-counting a week she lost
  // her opener in, exactly as rival fatigue was. It is left alone here on purpose: it moves injury
  // exposure, which is a tuning decision with its own targets, and folding it into this slice would
  // make the cohort-fatigue measurement unattributable. Flagged for the owner in the commit message.
  // ⚠ IN THE EVENT'S OWN TRACK, AT THAT TRACK'S WINDOW WIDTH (W2-LADDER §3 - and a latent bug
  // fixed by the same stroke). This pair used to fold the WHOLE ledger with no track filter, so
  // the "best 6" being diffed was a mixed-currency pool: a girl carrying a J300-heavy book who
  // won a W15 was told "does not improve best 6" about a table her result plainly improved,
  // because the junior 300s crowded the mixed six. The suffix now diffs the one table the result
  // pays into, under that table's own N - which is what the sentence always claimed to mean.
  // (`track` is the v28 attribution const a few lines up - the same fact, read once.)
  // ⚠ AND UNDER THAT TABLE'S OWN WINDOW TOO (round 23 #12/#13, 19.08). This pair folded ROLLING for
  // every track, so once the domestic table became season-to-date the diary could say "does not
  // improve her best 6" about a result the table plainly improved – a sentence wrong in the one place
  // the player is looking when she reads it. The window is the table's fact, exactly like `bestN`
  // beside it, so it is asked for by the same key rather than assumed.
  const window = WINDOW_BY_TRACK[track]
  const before = windowedBestSum(world.results, world.week, KID_ID, BEST_N_BY_TRACK[track], inTrack(track), window)
  if (points > 0) world.results.push({ playerId: KID_ID, week: world.week, points, tier: event.tier })
  const after = windowedBestSum(world.results, world.week, KID_ID, BEST_N_BY_TRACK[track], inTrack(track), window)
  addEvent(world, {
    week: world.week,
    type: 'tournament',
    text:
      `${tier.label} (${event.surface}, ${weekLabel(event.week)}): ${world.profile.kidName} – ` +
      // ⚠ A CLAUSE ON THE END, NOT A REPLACEMENT FOR THE FINISH. `finishLabel` is a NOUN – she is the
      // Semifinalist, and she still is: that is the owner's ruling («защитываем поражение в текущей
      // ступени») and it must be the first thing the line says, unqualified and with the points
      // beside it. What no existing token can say is that she did not finish, and a week that ended
      // with her walking off court must not read identically to a week she was beaten in. So the
      // clause comes AFTER the arithmetic, which is the sentence doing its second job: the player
      // reads "Semifinalist (+30 pts) – she retired hurt" on one line and learns the rule (the round
      // she reached is hers, in full) without ever being told it.
      `${finishLabel(kidFinish)} (+${points} pts)${rankingDeltaSuffix(points, after - before, BEST_N_BY_TRACK[track], after === 0)}${retiredMatch ? ' – she retired hurt' : ''}`,
    finishIdx: kidFinish,
  })
  // ...AND THE BODY GETS ITS BILL. Opened here, at the commit point, for the same reason the cheque
  // is: the run is over and its result is final, so nothing that follows can be re-decided by it.
  //
  // ⚠ AFTER the summary line and BEFORE the champion's, so the feed reads in the order it happened –
  // she stopped, the run is scored, the clinic says how long. `retirementInjury` emits its own
  // `'injury'` event and its own scans expense, sweeps the entries the layoff swallows and retires a
  // live knock, exactly as an ordinary onset does; it draws only from `seed:retire:<week>`.
  //
  // ⚠ AND IT CANNOT DOUBLE-OPEN ONE. `finalizeTournament` returns at its first line when `p.finished`
  // (the reveal trio all pass through it, more than once by construction), so this runs exactly once
  // per run. `rollInjury` at step 1c has already run this week and found her healthy – if it had
  // not, the walkover branch in `tickWeek` would have resolved the week and no run would exist to
  // finalize.
  if (retiredMatch) retirementInjury(world)
  // World news: who actually took the title of the draw she played in. When the kid IS the
  // champion, the summary + first-title milestone already celebrate it, so only report others.
  const championId = Object.entries(p.result.finishes).find(([, f]) => f === 0)?.[0]
  if (championId && championId !== KID_ID) {
    // A W draw's champion can be a field pro now (living-field phase W, 01.08), and she is in
    // neither the cohort nor `players` unless the kid met her – so the derived field is the third
    // place to ask before falling back to the raw id.
    const champName =
      world.cohort.find((c) => c.id === championId)?.name ??
      p.players[championId]?.name ??
      (isFieldProId(championId) ? fieldProsOf(world).find((c) => c.id === championId)?.name : undefined) ??
      championId
    addEvent(world, {
      week: world.week,
      type: 'info',
      text: `🏆 ${formatShortName(champName)} won the ${tier.label} (${event.surface}).`,
    })
  }
  if (kidFinish === 0) fireMilestone(world, 'first-title', `🏆 First career title: ${tier.label}!`)
  // ⭐⭐⭐ ROUND 41 #18 PART TWO (12.09) – AND THE FIRST GRAND SLAM MAIN DRAW, WHICHEVER ROUND IT ENDS
  // IN. The owner: «да, делаем fame за основу Шлема… У нее был вайлдкард на Шлем, когда она была
  // #155.» Until this line the biggest week of a climbing career left no durable trace anywhere: the
  // fame floor pays the champion and the runner-up and nobody else, `world.results` prunes at 52
  // weeks, and the tournament summary row is an ordinary feed row the 400-cap eats. So the WEEK is
  // recorded here, once, as the ledger's own kind of fact – and `world/fame.ts` reads it back.
  //
  // ⚠ EVERY SLAM RUN THAT REACHES THIS LINE IS A MAIN DRAW, AND THAT IS A PROPERTY OF THE GAME
  // RATHER THAN AN ASSUMPTION: qualifying is not modelled at any rung («a qualifier earns her place
  // in a draw we do not run» – `season/tournament.ts`), so the eight reserved wildcard chairs
  // (`WILD_CARD`) and the direct acceptances are the only two ways in. His case was the wildcard.
  //
  // ⚠ AT THE COMMIT POINT, beside the two milestones around it, which is what makes it mean «she
  // PLAYED it»: `finalizeTournament` is not reached by a skipped event, by the walkover branch or by
  // a medical withdrawal (the three WITHDRAWALS this function's prize-money note enumerates), and it
  // returns at its first line once `p.finished`. A retirement mid-match DOES reach it and does count
  // – she took the court, which is the rulebooks' own distinguishing question.
  //
  // ⚠ IDEMPOTENT BY THE ROW, NOT BY A FLAG: `fireMilestone` returns when the feed already carries
  // `SLAM_DEBUT_KEY`, so the second Slam and the two-hundredth write nothing and the date stays the
  // first one. ZERO RNG – one array scan and one push.
  if (event.tier === 'slam') {
    fireMilestone(world, SLAM_DEBUT_KEY, '🏆 First Grand Slam main draw – from this week the world knows her name.')
  }
  // D10: the durable ledger remembers the FIRST title and the FIRST final per tier, at the moment
  // they land. A title week captures both – reaching the final is part of winning it.
  if (kidFinish === 0) captureMilestone(world, { type: 'title', week: world.week, tier: event.tier })
  if (kidFinish <= 1) captureMilestone(world, { type: 'final', week: world.week, tier: event.tier })
  if (
    event.tier === 'national' &&
    p.result.matches.some((m) => (m.aId === KID_ID || m.bId === KID_ID) && m.winnerId === KID_ID)
  ) {
    fireMilestone(world, 'first-national', '🏆 First win at National level!')
  }
  recomputeRankAndMilestones(world)
  housekeep(world)
  // W2-ENDINGS: the deferred step 7. A reveal week's money is not settled until here – the entry
  // fee and the travel went out on the tick, the cheque comes in on this line – so a bankruptcy
  // check on the tick would have been reading a balance that was about to change.
  resolveEndings(world)
  p.finished = true
}

/** ONE revealed kid match: the `match` row itself, and – when the girl across the net could not
 *  finish – the one news row that says so (round 23 #3b).
 *
 *  ⚠ IT SITS RIGHT UNDER THE MATCH IT IS ABOUT, and that is the whole reason it is emitted here
 *  rather than beside the champion line in `finalizeTournament`: the feed then reads in the order
 *  the week happened – the scoreline, then why it stopped – and it reads the same whether the player
 *  watched the reveal round by round or hit "Skip tournament". Both paths call this, which is also
 *  why it exists: two copies of the emit is exactly how the two paths drift apart.
 *
 *  ⚠ TYPE `'info'`, NOT `'injury'` – the same ruling `world/knock.ts` records for the same reason:
 *  `'injury'` is a row about HER body, and the Memory card's first-injury milestone reads that
 *  channel. Nothing has happened to the kid here. ZERO RNG. */
function emitKidMatch(
  world: WorldState,
  event: SeasonEvent,
  m: MatchRecord,
  players: Record<string, MatchPlayer>,
): void {
  const ev = kidMatchEvent(world, event, m, players)
  addEvent(world, { week: world.week, type: 'match', text: ev.text, match: ev.match })
  const hurt = rivalRetirementNews(world, event, m, players)
  if (hurt) addEvent(world, { week: world.week, type: 'info', text: hurt })
}

/** Reveal ONE more kid match: emit its News `match` event, bump `revealedRounds`, and finalize the
 *  run once the kid's last match (elimination or the final) has been shown. Idempotent when done. */
export function revealTournamentRound(world: WorldState): void {
  // ⚠ W2-ENDINGS – DELIBERATELY NOT `guardNotEnded`, AND THE REASON IS A MEASURED BUG. The reveal
  // trio completes an action that STARTED before the ending: `resolveEndings` runs at the end of
  // `finalizeTournament`, while `pendingTournament` is still set and waiting to be closed, so a
  // career that goes bankrupt on the very week it plays a tournament latches with the reveal still
  // open. Guard these and that career can never clear `pendingTournament` – which is the one piece
  // of state `advanceWeeks` refuses to tick past. The mutating commands that are DECISIONS (entries,
  // bookings, hires, offers, kit) are the ones the guard belongs on; finishing a week already in
  // flight is not a decision. Found by tests/travel-home.test.ts, which plays a real career.
  //
  // ⭐⭐⭐ ROUND 26 #6 – AND THE COLLEGE LEAGUE COMES DOWN THIS ROAD. The owner: «в чем проблема
  // использовать наш флоу турниров полностью… Я уже просил это сделать». The dispatch is here rather
  // than in the worker because the engine is where every command is re-validated (invariant 1), and
  // it is THREE LINES rather than a parallel command set because that is what «полностью» means:
  // `TournamentFlow`'s Watch, Skip all rounds and Continue reach the college reveal by the same
  // store action, the same worker case and the same engine entry point they always used.
  if (collegeLeagueRevealOpen(world)) return revealCollegeLeagueRound(world)
  // ⭐⭐⭐ ROUND 27 #6 – AND THE NATIONS CUP TIE COMES DOWN THE SAME ROAD, for round 26 #6's reason
  // said once more: the owner asked for «обычный флоу турнира», and a second command set would be a
  // second place for a reveal to strand. One line per command, exactly as the championship took.
  if (callUpRevealOpen(world)) return revealCallUpRubber(world)
  const p = world.pendingTournament
  if (!p || p.finished) return
  const event = eventById(world, p.eventId)
  if (!event) return
  const kidMatches = kidMatchesOf(p.result)
  const m = kidMatches[p.revealedRounds]
  if (!m) {
    finalizeTournament(world)
    return
  }
  emitKidMatch(world, event, m, p.players)
  p.revealedRounds++
  if (p.revealedRounds >= kidMatches.length) finalizeTournament(world)
}

/** Reveal every remaining round at once, then finalize – the "Skip tournament" path to the finale. */
export function skipTournament(world: WorldState): void {
  // ⚠ W2-ENDINGS – DELIBERATELY NOT `guardNotEnded`, AND THE REASON IS A MEASURED BUG. The reveal
  // trio completes an action that STARTED before the ending: `resolveEndings` runs at the end of
  // `finalizeTournament`, while `pendingTournament` is still set and waiting to be closed, so a
  // career that goes bankrupt on the very week it plays a tournament latches with the reveal still
  // open. Guard these and that career can never clear `pendingTournament` – which is the one piece
  // of state `advanceWeeks` refuses to tick past. The mutating commands that are DECISIONS (entries,
  // bookings, hires, offers, kit) are the ones the guard belongs on; finishing a week already in
  // flight is not a decision. Found by tests/travel-home.test.ts, which plays a real career.
  // ⭐⭐⭐ ROUND 26 #6 – the college reveal's «Skip all rounds», by the same dispatch as one door up.
  if (collegeLeagueRevealOpen(world)) return skipCollegeLeagueRounds(world)
  // ⭐⭐⭐ ROUND 27 #6 – the tie's «Skip all rounds», by the same dispatch as one door up.
  if (callUpRevealOpen(world)) return skipCallUpRubbers(world)
  const p = world.pendingTournament
  if (!p || p.finished) return
  const event = eventById(world, p.eventId)
  if (!event) return
  const kidMatches = kidMatchesOf(p.result)
  while (p.revealedRounds < kidMatches.length) {
    emitKidMatch(world, event, kidMatches[p.revealedRounds], p.players)
    p.revealedRounds++
  }
  finalizeTournament(world)
}

/** Dismiss a finished reveal (the finale's "Continue"): clear the pending state so the week closes. */
export function closeTournament(world: WorldState): void {
  // ⚠ W2-ENDINGS – DELIBERATELY NOT `guardNotEnded`, AND THE REASON IS A MEASURED BUG. The reveal
  // trio completes an action that STARTED before the ending: `resolveEndings` runs at the end of
  // `finalizeTournament`, while `pendingTournament` is still set and waiting to be closed, so a
  // career that goes bankrupt on the very week it plays a tournament latches with the reveal still
  // open. Guard these and that career can never clear `pendingTournament` – which is the one piece
  // of state `advanceWeeks` refuses to tick past. The mutating commands that are DECISIONS (entries,
  // bookings, hires, offers, kit) are the ones the guard belongs on; finishing a week already in
  // flight is not a decision. Found by tests/travel-home.test.ts, which plays a real career.
  // ⭐⭐⭐ ROUND 26 #6 – the college reveal's finale «Continue», by the same dispatch. Answering it is
  // what lets `resumeFromCollege` spend the rest of the year, exactly as closing a tour reveal is
  // what lets `advanceWeeks` tick again.
  if (collegeLeagueRevealOpen(world)) return closeCollegeLeagueReveal(world)
  // ⭐⭐⭐ ROUND 27 #6 – the tie's finale «Continue». Answering it is what lets `resumeFromCollege`
  // spend the rest of the year, exactly as answering the championship's does.
  if (callUpRevealOpen(world)) return closeCallUpReveal(world)
  // ⭐⭐⭐ B-05 / T2.5 (26.09) – AND AN UNFINISHED RUN IS FINISHED HERE, NOT DROPPED. This line was
  // `world.pendingTournament = null` alone, against this function's own doc one comment up («Dismiss
  // a FINISHED reveal») – so a `close` on a run nobody had read out threw the whole run away: her
  // points, her match rows, her season record and the condition the week cost. MEASURED on three
  // walked careers (the review's `b-close-unfinished` probe): close-only gave 0 match rows, 0 result
  // rows, a 0-0 record and condition 100, against the UI's skip-then-close 2/3/1 match rows, 1/1/0
  // result rows, records 1-1 / 2-1 / 0-1 and condition 92/88/97. The next tick then ran normally on
  // top of the hole – a FREE tournament, which is precisely what the caller order was protecting.
  //
  // ⚠⚠ TOTAL AND NOT A REFUSAL, WHICH IS THE OWNER'S RULING 9. Invariant 1 says every command is
  // re-validated engine-side, and the shipped UI never reaches this (`TournamentFlow` sends `close`
  // only from the finale) – so what is wrong here is that the engine TRUSTED the screen's ordering. A
  // refusal would fix that too, and it would need a player-facing sentence, and the copy is his; this
  // needs none. The guaranteed exit `composables/blockingOverlay.ts` relies on is untouched: `close`
  // still always closes, on every path, which is what makes the overlay unable to strand a career.
  //
  // ⚠ ZERO DRAWS ADDED. The run was simulated at the tick and `pendingTournament` holds its result –
  // `skipTournament` reads the remaining rounds OUT and commits them, so nothing is rolled here and
  // MAIN does not move. The frozen capture is untouched.
  //
  // ⚠ AND IT IS STILL TOTAL IF THE RUN CANNOT BE FINISHED: `skipTournament` returns early when the
  // event has left the calendar (a repaired or foreign save), and the clear below then runs anyway.
  // A career that could not clear this field is the one state `advanceWeeks` cannot tick past, so the
  // fallback is the drop on purpose – and it is now the LAST resort rather than the only behaviour.
  const p = world.pendingTournament
  if (p && !p.finished) skipTournament(world)
  world.pendingTournament = null
}

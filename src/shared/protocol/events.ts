// THE WEEK'S LEDGER: what happened, what it cost, and why the advance stopped.
//
// Structured world events (financial ones carry a SIGNED `amountCents`), the finance rollups the
// Money screen folds, the career-total money, and the stop-reason union with its surfacing order.
//
// Part of the `shared/protocol` module set – see src/shared/protocol.ts, which re-exports every
// name below under the historical public path. Nothing here imports that barrel back.

import type { MatchPlayer, Surface } from '../../engine/match/types'
import type { MatchRecord } from '../../engine/season/types'
import type { EntryReleaseReason } from './offers'

// --- World events (Package M) ------------------------------------------------
// Structured events replace the old flat `log` strings. Financial events carry a
// SIGNED `amountCents` (expense/entry-fee/travel negative, income/refund positive)
// so the Money ledger is a running sum. `keep: true` milestones survive pruning.

export type WorldEventType =
  | 'info'
  | 'expense'
  | 'income'
  | 'entry'
  | 'match'
  | 'tournament'
  | 'milestone'
  | 'injury'
  | 'recovery'

/** Spending/earning bucket a financial event belongs to (Money-breakdown pie, round-7).
 *  Optional on the event: pre-round-7 events carry none and render as 'other'.
 *  'physio' (Season-Life slice C) buckets every medical line: weekly rehab, the one-time
 *  onset treatment, and the healthy-week physio retainer.
 *  'interest' (round-9 R9-1) is an INCOME-side category: the weekly savings interest on a
 *  positive balance ("Savings interest").
 *  'vacation' / 'practice' (season planner, schema v13) bucket the two planner spends: a family
 *  vacation package and a practice-match court rental (+ the optional coach). Refunds are booked
 *  under the SAME category, so a cancelled booking nets to zero on the Money breakdown. */
export type WorldEventCategory =
  | 'coaching'
  /** 'facility' (v44, docs/specs/split-the-bill-2026-08.md) is the COURT half of the weekly training
   *  bill, split off 'coaching' so the family can read what it is paying for.
   *
   *  ⚠ IT IS A SPLIT, NOT A NEW CHARGE. `ECONOMY.coach.hourlyRateCents` has always priced every rung
   *  INCLUSIVE of court rental – the recorded decision this reverses is coach-tiers.md §3 – so the
   *  two lines are a partition of a total that did not move: `coaching + facility` this week equals
   *  what `coaching` alone was charged before. Its sharpest consequence is that a SELF-COACHED family
   *  now books nothing under 'coaching' at all, which is the honest reading of a parent who works
   *  free: what it was being billed for was always the court.
   *
   *  ⚠ AND AN OLD SAVE HAS NO ROWS OF IT, BY CONSTRUCTION. `byCategory` is a partial record and the
   *  migration back-fills nothing (see migrations.ts v43 -> v44): a career loaded from v43 keeps its
   *  history under 'coaching' and starts splitting from the next tick, so the ledger stays truthful
   *  about what it actually charged rather than being retconned. */
  | 'facility'
  | 'travel'
  | 'entry'
  | 'gear'
  | 'stringing'
  | 'sponsor'
  /** 'academy' (v21) is an INCOME-side category: the once-a-year kit grant that comes with a
   *  scholarship. The travel half of the same scholarship is NOT booked here – it is taken off the
   *  travel line itself, so the ledger shows the reduced price the family actually paid.
   *
   *  ⚠ The comparison this used to draw – "exactly like the racket sponsor's gear discount" – is
   *  gone with that discount (30.07, tune/rank-numbers). The local sponsor no longer reduces a line;
   *  it pays a flat annual grant under 'sponsor', the way this kit grant already did. See
   *  ECONOMY.sponsorship. Travel-cover remains the only price-reducing subsidy in the game. */
  | 'academy'
  /** 'prize' (task #17) is an INCOME-side category: what a tournament pays her, off the finishing
   *  tier's own `prizeCents` table. THE ONLY INCOME THE TENNIS ITSELF PRODUCES – every other income
   *  category in this union is somebody deciding to fund her (a parent, a shop, an academy) or a
   *  bank paying interest on what is left. It exists only on the adult rungs: the junior tour pays
   *  nothing, ever, which is the real rule and the whole thesis of the game.
   *
   *  ⚠ It is also the one category that is NOT priced by the wealth corridor, so the Money breakdown
   *  shows a working family and a wealthy one exactly the same figure for exactly the same week. See
   *  TierDef.prizeCents. */
  | 'prize'
  /** 'tuition' (v51, docs/specs/what-the-college-place-costs-2026-08.md) is the family's share of a
   *  college year, charged one fifty-second at a time for as long as she is enrolled.
   *
   *  ⚠ IT IS THE FIRST COST IN THE GAME THAT IS NOT TENNIS, and that is why it gets its own bucket
   *  rather than joining 'other'. The four years used to be free by construction – P6 measured the
   *  college arm banking $152,243 against the tour's $45,544 and decomposed it as 100% avoided spend
   *  with the scholarship paying $0 – and `docs/research/college-and-the-junior-exit.md` §1d prices a
   *  real year at $30,990 in-state. The award pays a share of that; this line is the rest.
   *
   *  ⚠ AN OLD SAVE HAS NO ROWS OF IT AND A CAREER MIGRATED MID-FORK NEVER WILL, by construction: the
   *  v51 migration back-fills a `null` offer rather than inventing one, and a null offer is charged
   *  nothing. Same discipline as v44's 'facility' split and v50's empty college ledger. */
  | 'tuition'
  | 'income'
  | 'interest'
  | 'physio'
  /** 'staff' (v59, the travelling team) is the SALARIED PEOPLE beyond the coach – the masseur
   *  today, the rest of the team as it hires. Deliberately NOT folded into 'physio': that bucket
   *  is the clinic service, and a salary the player cannot find on the breakdown is the academy's
   *  $20,879 mistake again (round 23 #16) – you paid, and you could not tell. */
  | 'staff'
  | 'vacation'
  | 'practice'
  | 'other'

/** A kid match, replayable on demand: seed (on MatchRecord) + both players' skill
 *  snapshots + surface feed simulateMatch/annotateMatch. No AnnotatedMatch is stored. */
export interface WorldMatch extends MatchRecord {
  eventId: string
  surface: Surface
  /** the non-kid side's display name */
  oppName: string
  /** skill snapshots at match time (AI skills drift week to week) */
  a: MatchPlayer
  b: MatchPlayer
}

export interface WorldEvent {
  id: number
  week: number
  type: WorldEventType
  text: string
  /** signed delta to funds, present on financial events */
  amountCents?: number
  /** spending/earning bucket for the Money breakdown (round-7); absent ⇒ 'other' */
  category?: WorldEventCategory
  match?: WorldMatch
  /** true on a PRACTICE-match record (season planner): a watchable friendly that awards ZERO
   *  ranking points, so the UI can keep it out of the tournament card and label it honestly. */
  friendly?: boolean
  /** milestones are never pruned */
  keep?: boolean
  /** stable key for idempotent milestone firing (e.g. 'first-title', 'rank-10') */
  milestoneKey?: string
  /** present on `tournament` summary events: the kid's finish index for that run
   *  (0 = champion), so the year-end wrap-up (Round 5 item 16/21) can read the
   *  season's best result straight off the event log – no extra persisted state. */
  finishIdx?: number
  /** ⭐ R2-02 – THE ENTRY A ROW IS ABOUT, AS A FACT RATHER THAN AS A SENTENCE.
   *
   *  ⚠ THIS IS THE ONE FACT THE INJURY REPORT COULD NOT DERIVE, AND IT WAS MEASURED BEFORE IT WAS
   *  ADDED. `releaseEntry` takes the id out of `world.entries`, out of `seasonEntries.rows` and out
   *  of the two entry-cap week ledgers, and (below the pro rungs) raises no letter – so a probe run
   *  on a real career at the onset week found the released tournaments written down NOWHERE except
   *  in English: two `income` rows reading "Entry refunded: Local Open" and two `entry` rows reading
   *  "Taken out of Local Open – W12 '31, she is not fit for that week." Re-deriving them from the
   *  calendar is not possible either: the layoff window held 30 candidate events and four of them
   *  were the same rung at the same fee, so the fee cannot name which two she actually held. That is
   *  why `InjuryStopDialog` was parsing prose for four years' worth of rounds, and why the fix has to
   *  put the fact on the row rather than teach the reader a better regex.
   *
   *  ⚠ OPTIONAL, AND NOT A SCHEMA MOVE. Absent is exactly what every historical save and every
   *  hand-built fixture already mean ("this row is not about one entry"), so no migration is owed,
   *  no golden fixture is added and `SAVE_SCHEMA_VERSION` does not move.
   *
   *  ⚠⚠ THE PRECEDENT, CORRECTED AT THE WAVE-A GATE (23.08): the wave first cited a
   *  `MatchResult.retired?` field, and **no such field exists** – a citation to a plausible memory
   *  rather than to the tree, which in a repo that treats comments as a second spec is the very
   *  defect class (TB-10) this wave was sent to reduce. What genuinely stands behind this line is
   *  two things, both checkable: **this interface already carries five optional persisted fields**
   *  (`match`, `friendly`, `keep`, `milestoneKey`, `finishIdx`), so widening it in place is its own
   *  established shape; and the recorded widening precedent is **commit 2763caa**, which added the
   *  whole `entry` offer family while leaving `SAVE_SCHEMA_VERSION` at 36 – written down twice in
   *  this same file (see `OfferKind` and `EntryLetterTerms`). Written today by `releaseEntry` on the two rows it emits –
   *  the refund and the feed line – so a reader can total the money and name the tournaments from
   *  the same structured field instead of from two different sentences. */
  entryRef?: WorldEventEntryRef
}

/** The season event a `WorldEvent` is ABOUT: enough to name it on a screen without re-reading the
 *  sentence the engine wrote about it. `week` is the week the tournament is PLAYED in, never the
 *  week the row was written – those differ by the whole length of a layoff, and confusing them is
 *  the bug this type exists to make unwritable. */
export interface WorldEventEntryRef {
  /** the `SeasonEvent.id` – stable, and the only handle that survives a copy edit */
  id: string
  /** the tier's display label at the time the row was written (`TIERS[tier].label`) */
  label: string
  /** the week the tournament is played in */
  week: number
  /** who took her off the list; absent on a row that is not a release */
  releasedBy?: EntryReleaseReason
}

// --- finance aggregate (Part A) ----------------------------------------------
// The Money breakdown/ledger can't read `events`: those are capped (the snapshot's trailing 60,
// the engine's retained 400) so old finance is pruned away and a tournament-heavy stretch buries
// the rest under news. Instead the world maintains a tiny per-week/per-category signed-cents
// ledger that survives pruning, and the snapshot carries pre-folded windows off it.

/** Signed cents per (week, category): income positive, expense negative – matches the event
 *  convention. One entry per week that had >=1 financial event, week-ascending. Maintained on
 *  the world (survives event pruning), pruned only to a 60-week trailing career window. */
export interface FinanceWeek {
  week: number
  byCategory: Partial<Record<WorldEventCategory, number>>
}

/** A category-accurate rollup of `FinanceWeek[]` over a trailing window (pure fold; the bench and
 *  the Money screen both read one of these instead of scraping events). */
export interface FinanceWindow {
  startWeek: number
  /** signed cents per category (income positive, expense negative) */
  byCategory: Partial<Record<WorldEventCategory, number>>
  /** sum of the positive category totals */
  incomeCents: number
  /** magnitude of the negative category totals (a positive number) */
  expenseCents: number
  /** income - expense (== the signed sum of byCategory) */
  netCents: number
}

/** ONE week of the Home budget card's 12-week chart (epic/redesign-home): what came IN and what
 *  went OUT, both as positive magnitudes. The existing `FinanceWindow` is a FOLD – it answers "how
 *  much this season", which is the wallet's question – and a chart needs the shape over time, which
 *  no fold can give back. Derived at snapshot time from the same `FinanceWeek[]` ledger the windows
 *  fold, so the card and the wallet can never disagree about a week; persists nothing. */
export interface FinanceWeekPoint {
  week: number
  /** sum of the week's POSITIVE category totals, in cents */
  incomeCents: number
  /** magnitude of the week's negative category totals, in cents (a positive number) */
  expenseCents: number
  /** what the family HAD at the end of this week, in cents – the running balance, reconstructed
   *  backwards from today's funds so the last point of the series IS the number printed above the
   *  chart. Signed: a family below zero charts below zero. (A2, the owner's chart ruling: the card
   *  draws the line the export draws, and the line a parent actually watches is the balance, not
   *  the per-week churn – the slope toward zero is the whole game.) */
  balanceCents: number
}

export type StopReason =
  | 'tournament'
  | 'deadline'
  | 'funds'
  | 'season-end'
  | 'injury'
  | 'medical'
  /** ROUND 23 #16: the academy's season verdict – it took her on, changed her share, or ended it.
   *  Good news rather than a cost, so it sits low in the precedence below; but it landed on the one
   *  week a player stepping by four can never see, and passed in silence for a whole career. */
  | 'academy'
  /** ⭐ A LETTER SHE CAN STILL ANSWER LANDED THIS WEEK – R2-13's own item text lists «offers» among
   *  the events the span must stop before, and phase 1 shipped without one: offers reached the
   *  player through the span digest and the inbox dot only, which is the surface round-23 #16 proved
   *  insufficient («I did not see when the academy appeared»).
   *
   *  ⚠⚠ IT IS RAISED FOR A DECISION AND NEVER FOR A NOTICE, AND THAT LINE IS THE WHOLE FEATURE. The
   *  inbox carries two kinds of paper and `OfferState` already names the difference: an `open` letter
   *  is a proposal with a `deadlineWeek` that EXPIRES unanswered (`expireOffers`), while an `info`
   *  letter «is born terminal – there is nothing to sign and nothing to refuse». The tournament
   *  desk's receipts, the tour's due/penalty/suspension/season notices, the academy's three letters
   *  and a brand's goodbye are all `info`: nothing about them is lost by being read four weeks later,
   *  and a stop for each one would turn the four-week pill back into a press a week, which is the
   *  disease R2-13 exists to cure. Only the three producers of an `open` letter can raise this –
   *  `raiseKitOffers`, `raiseKitRenewal` and `raiseAdOffer`.
   *
   *  ⚠ AND IT FIRES ON THE WEEK THE PAPER ARRIVED, ONCE – never for as long as it lies open. A
   *  sponsor window is five weeks wide, so «there is a live offer» as a stop condition would halt
   *  four consecutive spans over one unanswered letter. `stoppableOfferWeek` is the arrival
   *  predicate; the same shape `academySpokeThisWeek` and `walkoverWeek === week` already use.
   *
   *  ⚠ NOT A BLOCK. `advanceRefusal` does not name it and must not: an unanswered letter is not a
   *  question standing in front of the week, and the parent is allowed to let one expire – the
   *  window «is the feature, not a courtesy» (offers.ts). It halts the span it landed in and the
   *  next press moves time again. */
  | 'offer'
  /** ⭐⭐ THE COLLEGE WAVE: her country played, and since this wave the rubbers are REAL MATCHES.
   *
   *  ⚠⚠ IT EXISTS FOR THE SAME REASON 'academy' DOES, ONE TURN OF THE SCREW WORSE. The academy's
   *  verdict landed on the one week a `+4` could never reach; a college call-up lands inside
   *  `resumeFromCollege`, which spends **a whole year in one call with no player in it at all**. The
   *  owner asked for a competition he can WATCH («которые можно смотреть так же, как и наши
   *  текущие»), and a match played inside a 52-week loop that reports nothing is a match nobody can
   *  watch however well it is simulated. This is the channel that carries the week back out.
   *
   *  ⚠ IT IS THE ONE MEMBER NO `advanceWeeks` EVER SETS. `resumeFromCollege` is the only producer –
   *  the call-up fires only inside the freeze and the freeze is only ever spent by that command –
   *  and `mutate` puts the returned reasons on the snapshot exactly as it does for an advance. */
  | 'call-up'
  /** ⭐⭐⭐ ROUND 24 – THE COLLEGE LEAGUE WAS PLAYED. The sibling of 'call-up' one line up, and the
   *  difference between them is the whole of this round's design: 'call-up' reports a week that MAY
   *  happen (measured at 40% of college years, and it is now earned), this one reports a week that
   *  ALWAYS happens. Every college year raises it exactly once.
   *
   *  ⚠ IT SITS ABOVE 'call-up' IN THE PRECEDENCE AND THAT IS CAUSAL ORDER, NOT IMPORTANCE. The
   *  championship is played on `COLLEGE_LEAGUE.seasonWeek` and read by the selectors two weeks
   *  later, so on a year that produced both, the toast that explains the other one has to lead.
   *
   *  ⚠ LIKE 'call-up', NO `advanceWeeks` EVER SETS IT. `resumeFromCollege` is the only producer. */
  | 'college-league'
  /** R12-15: an entered tournament came round while she was still inside her layoff, so the week
   *  resolved as a WALKOVER – 0 points, and the entry fee forfeited (the list had closed with her on
   *  it, so there was nothing to refund). It costs her real money and a real entry, exactly like
   *  'medical', and it used to pass in complete silence.
   *
   *  ⚠ THE NAME IS OURS AND IT IS THE WRONG WORD, which is worth knowing now that the game also has a
   *  RETIREMENT to tell it apart from. In all four rulebooks a WALKOVER is something a player
   *  RECEIVES – her opponent failed to appear – and is never something she does; what this member
   *  describes (entered, medically unable, never took the court) the rules call a **withdrawal**, and
   *  it is priced differently from the retirement precisely so that a player has a reason to start
   *  the match: an ITF first-round withdrawal "will receive no prize money, and the Tournament shall
   *  not count on their record" (2026 WTT Regs, Women's §XII.C.5.b.i.2.d) while a retirement in the
   *  same round is paid in full. Our engine gets the BEHAVIOUR right on both counts – this member
   *  pays nothing and a retirement pays the round reached – so this is a naming bug and not a
   *  behaviour bug.
   *
   *  DELIBERATELY NOT RENAMED, on the research's own recommendation (docs/research/
   *  retirement-and-withdrawal.md §10.1 Q4): the identifier is persisted and player-visible copy
   *  quotes it in three surfaces, so a rename is a schema bump plus a UI sweep to fix a noun. This
   *  comment is the cheap half, and it exists to stop the next reader repeating the confusion. */
  | 'walkover'
  /** W4: she came off court with a KNOCK and the parent has not answered yet. Unlike every reason
   *  above it does not merely halt the advance, it BLOCKS it – `advanceWeeks` refuses to tick at all
   *  while a knock is undecided, the same contract `pendingTournament` has. That is the whole point:
   *  the owner's complaint was that training weeks «просто скипались», and a stop the player can
   *  skip past is not a decision. See engine/knock.ts. */
  | 'knock'
  /** ⭐ v48: IT IS HER BIRTHDAY AND NOBODY HAS ANSWERED IT. Blocks exactly like a knock, and for the
   *  ruling's own reason rather than by imitation: the owner asked for the popup to fire ALWAYS
   *  («я бы оставил попап на ДР всегда»), and a popup a `+4` can tick straight past does not always
   *  fire. All four buttons are valid answers, so this can never dead-end a career.
   *
   *  ⭐⭐⭐ ROUND 24 – AND `resumeFromCollege` NOW PRODUCES IT TOO (the owner's «да, день рождения
   *  делай»). Unlike its two college siblings above it does not merely report a week that happened:
   *  the year PAUSES on her birthday week – the loop breaks, the college latch goes back on with the
   *  SAME year's end under it, and the gift dialog renders on the live Home shell. The next press
   *  finishes the year. It is the one member of this list that both blocking commands raise. */
  | 'birthday'
  /** W2-ENDINGS: the story has no next week. It outranks everything because its surface REPLACES
   *  the app shell rather than laying a dialog over it – there is nothing behind an epilogue left
   *  to stop for. `advanceWeeks` refuses to tick at all while it is latched. */
  | 'ending'
  /** W2-ENDINGS: SHE IS NINETEEN AND THE FORK IS OPEN (contract §4 #1/#2). Blocks like a knock and
   *  for a stronger reason – two of its three answers end the career. */
  | 'fork'
  /** W2-ENDINGS: the natural end has asked her and she has not answered (contract §5.3). Blocks
   *  like the fork; an off-season question a player can tick past is not a decision. */
  | 'retirement'

/** R11-1: the order the UI must SURFACE a week's stop reasons in, and the order `advanceWeeks`
 *  returns them in. One advance can stop for SEVERAL true reasons at once (the owner's lost injury
 *  popup: a fresh injury landing on the season wrap-up week was reported as 'season-end' alone, so
 *  neither the injury dialog nor a toast ever appeared and the auto-withdrawals happened in
 *  silence). Medical events rank FIRST precisely because they may never be swallowed by a stop that
 *  can wait a click: they cost her entries and money the moment they land. */
export const STOP_PRECEDENCE: readonly StopReason[] = [
  // W2-ENDINGS: FIRST, above even the medical trio, because it is not a stop at all in the sense
  // the rest of this list is. The others halt a week and hand it back to the tab shell; this one
  // says the shell is over. Nothing below it has a surface left to render into.
  'ending',
  'injury',
  'medical',
  // Third, with its two medical siblings and above everything that can wait a click: a walkover
  // costs her the entry fee. When it lands on the SAME week as the onset (an entry on the very week
  // she gets hurt) both fire – the injury dialog leads, the walkover toast rides above it – because
  // they are two different facts and R11-1's whole point is that a week may be several things.
  'walkover',
  // ROUND 23 #16: BELOW the three that cost her something and above the ordinary week – a
  // scholarship arriving is news she should not miss, and never an emergency.
  'academy',
  // ⭐ THE LETTER HE CAN STILL ANSWER, IMMEDIATELY BELOW THE ACADEMY'S VERDICT AND ABOVE EVERY
  // REASON THAT WAITS FOR HIM. Two neighbours, two different arguments, and both are read off the
  // lines they sit between rather than chosen by feel:
  //
  //   * BELOW 'academy', because the academy's verdict is a change to the family's money that HAS
  //     ALREADY HAPPENED – it took her on, changed her share or ended it, and the travel cover moved
  //     with it whether or not anybody read the letter. That is the metric the whole top of this
  //     list is ordered on ("they cost her entries and money the moment they land"), one notch
  //     softer. An offer has cost nothing and given nothing: it is a proposal, and until it is
  //     signed the wallet does not know it exists. On the one week the two can collide the sentence
  //     the parent needs is the one about the money that already moved – and it is needed MORE, not
  //     less, because the offer's own deadline is printed on the offer's own paper in the inbox both
  //     toasts send him to, while the academy's change to his travel budget is written nowhere else
  //     that week.
  //
  //   * ABOVE 'college-league', 'call-up' and everything under them, because it is the LOWEST reason
  //     in this list that can be LOST BY NOT BEING READ. Everything below it either waits for the
  //     player indefinitely (the knock, the birthday, the fork, the retirement offer and a paused
  //     reveal all block until he answers) or fires again on the next press ('funds' every week
  //     under water, 'deadline' at the deadline and the week before it, 'season-end' next season);
  //     the two college reports above them are records of matches already played, and the rows keep.
  //     An open letter is the one thing here with a clock the player does not control: it expires at
  //     `deadlineWeek` – for a kit letter that is the sponsor window's close, which can be as little
  //     as two weeks after it lands – and after that there is nothing left to answer. A stop that
  //     ranks below a reason that will still be there next week could be swallowed by it exactly
  //     once, and the once would be the whole deal.
  'offer',
  // ⭐⭐ THE COLLEGE CALL-UP, in the academy's own news block and above everything dismissable, for
  // the same reason and with one sharpening: it is the only member of this list that can arrive
  // ALONGSIDE 'ending' every single time it fires, because `resumeFromCollege` re-latches the
  // epilogue on the very call that produces it. 'ending' carries no toast copy (its surface IS the
  // screen), so the toast falls through to this line – which is precisely the ordering R11-1 exists
  // to decide. It costs her nothing by the time it fires, so it sits under the academy's news and
  // far under the three that cost money.
  //
  // ⭐⭐⭐ ROUND 24 – AND THE COLLEGE LEAGUE SITS IMMEDIATELY ABOVE IT, WHICH IS CAUSAL ORDER. Both
  // are produced by `resumeFromCollege` and a year that raises the call-up has ALWAYS raised the
  // league too (the championship is on the calendar, the letter is read off its result), so this
  // pair co-occurs by construction rather than by coincidence – the only such pair in this list. The
  // championship is the week that explains the other one, so it leads; the toast speaks for the
  // highest-precedence reason that has copy, and it is now this.
  'college-league',
  'call-up',
  // W4: fourth, above everything that can wait a click, for a stronger reason than the three
  // medical beats have – the advance CANNOT continue until it is answered (`advanceWeeks` returns
  // early on an undecided knock). A stop nobody surfaces would strand the career, so it has to
  // outrank every reason that owns a dismissable toast. It sits BELOW the medical trio because those
  // have already cost money by the time they fire, and a knock has not cost anything yet.
  //
  // It can never collide with 'tournament' or 'season-end' on the same week (a knock only arrives on
  // an ordinary training week – no tournament, no off-season), but it CAN co-occur with 'deadline'
  // and 'funds', which is exactly the ordering this line decides.
  'knock',
  // ⭐ v48: THE BIRTHDAY, immediately below the knock and above everything dismissable, because it
  // BLOCKS for the same mechanical reason and costs nothing by the time it fires. It sits BELOW the
  // knock rather than above because a knock is about her BODY and the week it governs starts now,
  // while the birthday is a day on the family's calendar that will still be there after the sore
  // shoulder is answered. Unlike a knock it CAN co-occur with 'tournament' and with 'season-end' – a
  // birthday lands wherever the date lands, including a playing week and the off-season – which is
  // exactly the ordering this line decides.
  //
  // ⭐⭐⭐ ROUND 24: ...and since the college birthday it can co-occur with 'college-league' and
  // 'call-up' too – a birthday inside the freeze lands wherever the date lands, including the
  // championship week. Both college reports rank above it here, which is right twice over: they are
  // NEWS the toast has copy for, while the birthday's surface is the blocking dialog itself.
  'birthday',
  // W2-ENDINGS. The fork and the natural end's offer sit here, below the knock and above everything
  // that owns a dismissable toast, because they BLOCK: `advanceWeeks` refuses to restart until they
  // are answered. They are below the medical trio for the trio's own reason – those have already
  // cost her money by the time they fire, and a question has not cost anything yet. They can
  // co-occur with 'season-end' (the retirement offer is raised on the wrap week by construction) and
  // with 'funds', which is exactly the ordering these two lines decide.
  'fork',
  'retirement',
  'tournament',
  'season-end',
  'deadline',
  'funds',
]

/** CAREER-TOTAL MONEY, and it is a NEW FACT rather than a view of an old one – the same argument
 *  `trophiesByTier` makes. `financeWeeks` prunes to a 60-week trailing window (FINANCE_WEEKS), so
 *  by season three the early bills are simply not in the save any more; `seasonHistory` keeps a NET
 *  delta per season, which cannot separate gross in from gross out. A fifteen-season reckoning is
 *  therefore not recoverable from anything already persisted.
 *
 *  ⚠ `prizeCents` IS TRACKED APART FROM `earnedCents` BECAUSE SLOT 6 IS ABOUT THE TENNIS, not about
 *  the household. Parent income, sponsor money, the academy grant and savings interest are all
 *  income; none of them is the tennis paying for itself. The break-even the game is about is prize
 *  money against costs (§9.2 slot 6). */
export interface CareerTotals {
  earnedCents: number
  spentCents: number
  prizeCents: number
  /** ⚠ EVERY WEEK HER BODY HAS EVER SPENT OFF COURT, AND IT LIVES HERE BECAUSE `injuryHistory` IS
   *  PRUNED (v40, docs/specs/fatigue-injury-audit-2026-08.md §6). `rollInjury` keeps the last twenty
   *  layoffs and drops the rest, and the career-ending injury (#4) is keyed on the SUM of them – so
   *  a body past its twentieth layoff started forgetting the earliest ones, and the rule got harder
   *  the more broken she was. Measured over 90 full careers: 13 reached the cap and 1.4% of onsets
   *  were judged against an accumulator a mean of 6.1 weeks short of the truth.
   *
   *  A monotone counter cannot be pruned, and it is also the number the epilogue prints. It counts
   *  RECOVERED layoffs only – the same moment `injuryHistory` gets its row – so an ongoing injury is
   *  not yet in it, which is what «a body that has ALREADY lost N weeks» means. Migrated saves
   *  back-fill from whatever the pruned list still holds: exact for every career under twenty
   *  layoffs, an honest undercount for the rest, and never larger than the truth. */
  weeksLostToInjury: number
}

/** THE DEBT SPELL, surfaced while she is under water – the WARNING PHASE bankruptcy wants before
 *  the fact (adult spec B4). One bad week is never death: the spell resets the week funds recover. */
export interface DebtView {
  sinceWeek: number
  weeks: number
  graceWeeks: number
}

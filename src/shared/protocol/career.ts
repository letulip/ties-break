// HOW A CAREER ENDS, and the long interlude that can precede it.
//
// The fork at nineteen, the college years and their banked seasons, the retirement offer, the six
// endings, and the epilogue's album / scroll / hand-off.
//
// Part of the `shared/protocol` module set – see src/shared/protocol.ts, which re-exports every
// name below under the historical public path. Nothing here imports that barrel back.

import type { AvatarEmotion, PortraitStage } from '../avatarEmotion'
import type { CareerTotals, WorldMatch } from './events'

// --- HOW A CAREER ENDS (schema v39, career-contract-v1.md §4) ----------------------------------

/** THE SIX ENDINGS THE CONTRACT SIGNS OFF, and they are six FATES rather than five failures and a
 *  win (adult-tour-and-endings.md §6 call 4: «"stop" CAN be the right answer at 19»).
 *
 *  ⚠ `'natural'` AND `'plateau'` ARE ONE MECHANISM AND TWO REASONS, on purpose. §5.2 asked for the
 *  plateau «в дешёвой форме»: the natural end already offers her the question each off-season from
 *  29, and the plateau reading simply lets it ask EARLIER. So there is one offer, one answer and one
 *  latch – and the type records WHICH of the two put the question in front of her, because §5.2's
 *  closing line is "the epilogue says which of the two it was".
 *
 *  ⚠ `'college'` IS THE ONLY ONE THAT RESUMES (§5.1). It latches like the rest – the album is shown,
 *  every mutating command refuses – and then the epilogue asks a question and takes an answer.
 *
 *  ⭐⭐ P5 (16.08, docs/specs/college-as-a-second-act-2026-08.md): it used to be ONE button spending
 *  four years in one tap. It is one year at a time now, because the sport's own case is the early
 *  return – Diana Shnaider left NC State after about a season and is inside the WTA top 15 – so the
 *  block was the wrong SHAPE as well as an empty one. `resumesWeek` therefore points ONE year out and
 *  the ending is re-latched with the next one until she has spent all four or answers
 *  `endCollegeEarly`.
 *
 *  ⚠ AND THE OLD CLAIM THAT SHE COMES BACK "with no ranking at all" IS WITHDRAWN AS A CAUSAL ONE.
 *  Measured over 52 careers at the fork (spec §2c) her professional rank is **#290 before the freeze
 *  and #290 after it** – she was already off the list the week she walked in, because at nineteen her
 *  professional results are too few for `RANKABLE_MIN`. The four years took nothing from her; what
 *  they cost is the ladder moving without her, and that is 121 places against the same seeds spent on
 *  tour. */
export type CareerEndingType =
  | 'stopped'
  | 'college'
  | 'bankruptcy'
  | 'injury'
  | 'natural'
  | 'plateau'

export interface CareerEnding {
  type: CareerEndingType
  /** the absolute career week the story stopped having a next week */
  week: number
  /** her age that week, in whole years – `kidAgeYears`, the GIRL's clock and not the career band */
  ageYears: number
  /** one short line of specifics: the layoff, the debt spell, the seasons flat. Never a verdict. */
  detail: string
  /** COLLEGE ONLY: the week she comes back. Null on the five that do not resume. */
  resumesWeek: number | null
}

export type ForkAnswer = 'continue' | 'college' | 'stop'

/** THE FORK AT NINETEEN (§4 #1/#2, adult spec B2 – "the most expensive click in the game").
 *
 *  ⚠ IT BLOCKS, exactly as an undecided knock does. A question the player can dismiss with one tap
 *  and re-press past is a notification, not a decision, and this is the one decision the whole
 *  second act hangs off. `answer === null` is the open state. */
export interface ForkState {
  askedWeek: number
  answer: ForkAnswer | null
  /** ⭐⭐ WHAT THE COLLEGE ANSWER ACTUALLY OFFERS, measured the week the fork was raised (v51,
   *  `docs/specs/what-the-college-place-costs-2026-08.md`; the model is `engine/collegeOffer.ts`).
   *
   *  ⚠ IT IS PERSISTED BECAUSE IT IS MONEY LEAVING THE ACCOUNT FOR FOUR YEARS, and that is
   *  `bankCollegeYear`'s own argument: a measurement taken at a moment is a new fact. The inputs
   *  happen to be stable (`bestFinishByTier` is a high-water mark and the junior rungs close at
   *  eighteen), so it COULD be re-derived – but then a future wave that re-tunes a constant would
   *  silently re-price every career already mid-course, halfway through a bill it had agreed to.
   *
   *  ⚠⚠ `null` MEANS "NEVER MEASURED", NOT "REFUSED", and a refusal has its own shape inside the
   *  offer (a quote with `athleticShare === 0` is a WALK-ON place – nobody funded her and she may
   *  still enrol and pay for it). A career
   *  migrated from v50 with the fork already open carries `null` here, because the v51 migration
   *  invents nothing – exactly the discipline v50 applied to the college ledger it could not
   *  reconstruct. Such a career is charged nothing and the card falls back to the pre-v51 copy. */
  offer: CollegeOffer | null
  /** ⭐⭐⭐ v58 – THE WEEK SHE LEAVES FOR COLLEGE (round 24 #5: ask / hold / depart). Set by
   *  `answerFork` on the college answer only – `nextAcademicYearStart(answer week)`, the next
   *  1 September – and read by `resolveCollegeDeparture`, which enrols her there. Between the two
   *  the career is ON HOLD-but-playing: `answer === 'college'` with `world.college` still null is
   *  the reservation state, and every freeze gate stays open because they all read `inCollege`.
   *
   *  ⚠ OPTIONAL FOR THE `pendingYearStart` REASON: absent and null mean the same thing – no
   *  departure is booked. Null on every fork answered 'continue'/'stop', on every v≤57 fork (the
   *  v58 migration writes the explicit null; an already-enrolled college career never consults it),
   *  and until the college answer lands. Readers normalise with `?? null`. It SURVIVES the
   *  departure as the record of the week she left – `college.fromWeek` equals it on every career
   *  that departs on schedule, and differs only where a migrated save overshot and left late. */
  departsWeek?: number | null
}

/** ⭐⭐ WHICH KIND OF PLACE SHE PICKED – a PRICE and a QUALITY, and the player chooses between them
 *  (owner, 17.08, `docs/specs/the-college-choice-2026-08.md`).
 *
 *  ⚠⚠ `CollegeProgrammeTier = 'strong' | 'solid' | 'small'` WAS HERE AND IT WAS NOT A PLACE AT ALL.
 *  Its own note read *"Three, because the research supports a spread and not a curve"* – true of the
 *  funding spread it described, and the three values were **funding SHARES** (0.85 / 0.55 / 0.30)
 *  **derived from her junior record**, over a price that was the same at all three. So the player
 *  chose nothing, and the card printed a residual ($8,673) under a sourced sticker ($30,990) with
 *  nothing on screen to connect them. The owner asked where the figure came from and there was no
 *  surface that could tell him.
 *
 *  ⚠ THE THREE IDS ARE THE THREE SOURCED PRICES, in that order: public in-state **$30,990**, public
 *  out-of-state **$50,920**, private nonprofit **$65,470** `[S]` (College Board, Trends in College
 *  Pricing and Student Aid 2025, Figure CP-1). The QUALITY LADDER laid over them is OURS and is
 *  labelled as ours everywhere it appears – `engine/collegeOffer.ts` carries the table. */
export type CollegeTier = 'state' | 'national' | 'private'

/** ⭐⭐ THE COLLEGE OFFER – a place, a share of the bill, and the rest of the bill.
 *
 *  All three shares are fractions of ONE YEAR'S PUBLISHED COST OF ATTENDANCE, which is what "a full
 *  ride" means in the sport's own rulebook: Bylaw 15.02.5 defines a full grant-in-aid as tuition,
 *  fees, living expenses, books and other expenses **up to the cost of attendance** `[S]`. There is no
 *  separate athletics price list.
 *
 *  ⚠⚠ THE OWNER'S QUESTION OF 16.08 – «едины для всех или тоже от достатка?» – IS ANSWERED BY THE FACT
 *  THAT THESE ARE TWO FIELDS AND NOT ONE. `athleticShare` is merit-only and reads nothing about the
 *  family; `needShare` is means-tested and reads nothing about her tennis. The engine keeps them apart
 *  because the sport does: there is no means test anywhere in Bylaw 15 on athletics aid, and the only
 *  means test in the system is on the other layer. `engine/collegeOffer.ts` carries the sources. */
export interface CollegeQuote {
  tier: CollegeTier
  /** one year's published cost of attendance at this kind of place, cents `[S]` */
  costPerYearCents: number
  /** ⚠⚠ MERIT ONLY, 0-1 **of the price of THIS tier**. Reads her junior record and the programme's
   *  own funding and nothing else – `athleticShareOf`'s signature takes a tier, a score and a die and
   *  no family at all, which is the proof rather than the promise.
   *
   *  ⚠ THE SAME RECORD IS WORTH A DIFFERENT SHARE AT EACH TIER, and that is the trade the choice is
   *  about: a dearer place is a stronger squad, so she sits lower on its recruiting board. */
  athleticShare: number
  /** the need-based layer beside it, 0-1. Means-tested on the family's position at enrolment, and
   *  effectively shut to a non-American: 34 CFR §668.33 bars federal student aid to anyone in the US
   *  "for a temporary purpose" `[S]`, and NAFSA calls institutional aid to undergraduate
   *  internationals "uncommon". */
  needShare: number
  /** what the family pays for a year at this place, cents – the price after both layers, and the
   *  number the ledger charges one fifty-second at a time once she has picked it */
  familyPerYearCents: number
  /** ⚠ IS THIS PLACE HERS TO PICK? False on exactly one case and it is primary law rather than a
   *  balance knob: the in-state price IS residence, and a non-resident alien is never in-state
   *  anywhere. **Two tiers are always open**, so nothing here can remove the college answer (owner,
   *  16.08) – it removes one SCHOOL from a list of three. */
  open: boolean
}

/** ⭐⭐ THE COLLEGE OFFER – every place she could take, and the one she took.
 *
 *  All shares are fractions of ONE YEAR'S PUBLISHED COST OF ATTENDANCE at the tier they belong to,
 *  which is what "a full ride" means in the sport's own rulebook: Bylaw 15.02.5 defines a full
 *  grant-in-aid as tuition, fees, living expenses, books and other expenses **up to the cost of
 *  attendance** `[S]`. There is no separate athletics price list.
 *
 *  ⚠⚠ THE OWNER'S QUESTION OF 16.08 – «едины для всех или тоже от достатка?» – IS ANSWERED BY THE FACT
 *  THAT EACH QUOTE CARRIES TWO SHARES AND NOT ONE. `athleticShare` is merit-only and reads nothing
 *  about the family; `needShare` is means-tested and reads nothing about her tennis. The engine keeps
 *  them apart because the sport does: there is no means test anywhere in Bylaw 15 on athletics aid.
 *
 *  ⚠ AND HE GUESSED THE CEILING EXACTLY. A scholarship may not exceed the price – Bylaw 15.1 – and
 *  the trim falls on the NEED layer (15.1.3), never on the award. */
export interface CollegeOffer {
  /** one per tier, cheapest first. ⚠ ALWAYS ALL THREE, including the one residence shuts: the card
   *  shows what a place costs even when it is not hers, because a list that silently loses a row is
   *  a list the player cannot reason about. */
  quotes: CollegeQuote[]
  /** which she took. `null` while the fork is still open – **there is no default**, because a default
   *  on this card would be a recommendation drawn in preselection (ruling 4, 30.07). */
  chosen: CollegeTier | null
  /** ⭐ WHAT A YEAR OF THIS FAMILY'S MONEY IS, measured the week the fork is raised: the parents'
   *  annualised contribution plus their savings spread over the four years she would be enrolled.
   *
   *  ⚠ IT IS NOT THE MEANS TEST AND MUST NOT BE CONFUSED WITH IT. `familyPositionCents` shields the
   *  first $25,000 of savings because a means test does not expect a family to liquidate its cushion;
   *  this number does not, because a family deciding whether it can pay absolutely does count its
   *  cushion. Two questions, two numbers – see `familyCanPayPerYearCents`.
   *
   *  ⚠ `null` MEANS "NEVER MEASURED", NOT "SHE CAN PAY NOTHING" – a career migrated from v51 was
   *  quoted a price before this question existed, and the v52 migration invents no answer to it. Same
   *  discipline as `ForkState.offer`'s own `null`. */
  canPayPerYearCents: number | null
}

/** THE NATURAL END'S OFFER (§5.3). Raised in the off-season, answered before time can move again.
 *
 *  ⚠ `final: true` IS THE FLOOR AT 38, AND THE FLOOR IS NOT A RETIREMENT RULE. 38 is the age at
 *  which the game STOPS ASKING: from 29 she may always refuse, and at 38 the last offer is made and
 *  taken. So the final offer carries no refusal – not because a mechanic retires her, but because
 *  the question has run out. The copy has to carry that and this flag is what lets it. */
export interface RetirementOffer {
  askedWeek: number
  seasonIndex: number
  /** which reading put the question in front of her – `'age'` from 29, `'plateau'` earlier */
  reason: 'age' | 'plateau'
  /** the last offer: made and taken (§5.3) */
  final: boolean
}

/** THE COLLEGE YEARS (§5.1). Written the week she chooses college; `doneWeek` is null while she is
 *  still there, so a save taken mid-decision resumes into the same button.
 *
 *  ⭐⭐ P5 – IT USED TO BE A FOUR-YEAR FREEZE SPENT IN ONE TAP AND IT IS FOUR YEARS SPENT ONE AT A
 *  TIME NOW (docs/specs/college-as-a-second-act-2026-08.md). The reason is the sport's: Diana
 *  Shnaider left after about a year and is inside the WTA top 15, so a four-year block is the wrong
 *  SHAPE and not merely an empty one. `untilWeek` is therefore no longer a constant – it is moved
 *  BACK to the current week the moment she leaves, which is what makes `inCollege` false without a
 *  second flag to keep in step. */
export interface CollegeState {
  fromWeek: number
  /** the week the freeze ends. Moved back to `world.week` on an early return – see above. */
  untilWeek: number
  doneWeek: number | null
  /** ⭐ P5: one row per year LIVED, appended as each finishes. Empty until the first year is spent,
   *  and never longer than `ENDINGS.collegeYears`. This is the whole of what is behind the door. */
  years: CollegeYear[]
  /** ⭐ P5: the national-team week of the year IN PROGRESS, held from the week it happens until the
   *  year closes around it. Null the rest of the time.
   *
   *  ⚠ IT LIVES INSIDE `CollegeState` AND NOT ON THE WORLD, because it is meaningless outside the
   *  freeze and a top-level field would have to be nulled by every other code path that ends a
   *  career. Here it dies with the object that gives it meaning. */
  pendingCallUp: CollegeCallUp | null
  /** ⭐⭐⭐ v56 – THE COLLEGE LEAGUE OF THE YEAR IN PROGRESS, held from the week it is played until
   *  `bankCollegeYear` folds it into the year. Null the rest of the time, exactly like
   *  `pendingCallUp` one line up and for the same lifetime reason.
   *
   *  ⚠⚠ IT IS ALSO HALF OF WHAT THE CALL-UP READS, and the other half is the banked years – see
   *  `lastLeagueRun` in `engine/world/college.ts`. There is deliberately NO second "last result"
   *  field: one persisted copy plus a lookup cannot drift from itself, and two could. */
  pendingLeague: CollegeLeagueRun | null
  /** ⭐⭐⭐ v57 – THE OPENING MEASUREMENTS OF A YEAR PAUSED MID-FLIGHT (round 24, the owner's «да,
   *  день рождения делай»). Her birthday now PAUSES the college year – `resumeFromCollege` breaks
   *  on the birthday week, the gift dialog renders on the live Home shell, and the next press
   *  finishes the year. That next press must bank the year against the measurements taken when the
   *  year OPENED, and those are history by then: her skill, her rank and the family balance have
   *  all moved since. A measurement is a new fact and has to be persisted – `CollegeYear`'s own
   *  argument, one interface up.
   *
   *  Non-null exactly while a year is paused mid-flight; `bankCollegeYear` nulls it beside
   *  `pendingCallUp` and `pendingLeague`, whose lifetime it shares.
   *
   *  ⚠ OPTIONAL FOR A SEQUENCING REASON, NOT A STYLE ONE. Making it required would force a field
   *  into `answerFork`'s college literal, and agent D2 owns `answerFork` next (the fork moves to the
   *  academic year). Absent and null mean the same thing – no year is mid-flight – the v57 migration
   *  writes the explicit null for migrated saves, and every reader normalises with `?? null`. */
  pendingYearStart?: CollegeYearStart | null
  /** ⭐⭐⭐ v60 – THE CHAMPIONSHIP'S REVEAL, OPEN UNTIL HE HAS WALKED IT (round 26 #6, the owner's
   *  «в чем проблема использовать наш флоу турниров полностью… Я уже просил это сделать»).
   *
   *  ⚠⚠ IT IS THE COLLEGE TWIN OF `world.pendingTournament` AND DELIBERATELY NOT THAT FIELD. The
   *  tour's reveal is a `PendingTournament` over a `SeasonEvent`, and `finalizeTournament` reads
   *  `TIERS[event.tier]` to award points and a cheque – so borrowing it would either invent a rung
   *  for a student field or break «a result cannot award one without the other». This holds two
   *  numbers, awards nothing, and `world.pendingTournament` stays null through every college week,
   *  which is what keeps round 24's refusal (`COLLEGE_REVEAL_REFUSAL`) a statement about a state
   *  that still cannot occur inside the freeze.
   *
   *  ⚠ PERSISTED BECAUSE IT BLOCKS. `resumeFromCollege` will not spend a year over an open one, so
   *  it is a question standing in front of the world – and an unpersisted blocking state is exactly
   *  the class of failure B1's law was written about. Two numbers is the whole of it: the matches
   *  themselves are `keep: true` rows in `world.events` already (see `collegeLeagueMatchesOf`), so
   *  nothing about the record is copied here.
   *
   *  ⚠ NULL – or absent, on every save older than v60 – MEANS NO REVEAL IS OPEN, which is the true
   *  value for a career that played its championships before the flow existed. The migration writes
   *  the explicit null and nothing is back-filled: a year already lived is not re-offered. */
  leagueReveal?: CollegeLeagueReveal | null
}

/** ⭐⭐⭐ v60 – WHERE HE IS IN THE CHAMPIONSHIP'S REVEAL. The college mirror of
 *  `PendingTournament.revealedRounds` + `finished`, and it needs neither a result nor a player map
 *  because both already live in the feed rows the tick wrote.
 *
 *  ⚠ `revealed === leagueMatchesPlayed(run)` IS THE FINALE, exactly as `revealedRounds >=
 *  kidMatches.length` is on the tour; the object is cleared by `closeCollegeLeagueReveal`, which is
 *  `closeTournament`'s twin. There is no `finished` flag for the same reason `wonTheLeague` is not
 *  a stored boolean: a second copy of a derivable fact can drift from the first. */
export interface CollegeLeagueReveal {
  /** the week the championship was played – the key into `collegeLeagueMatchesOf` */
  week: number
  /** how many of her matches he has been shown, 0..the run's match count */
  revealed: number
}

/** ⭐ v57 – WHAT A COLLEGE YEAR IS OPENED WITH: the measurements `bankCollegeYear` will close it
 *  against, taken before the first of its weeks ticks. Lived in `engine/world/college.ts` unpersisted
 *  since P5; the birthday pause made it savable state, and persisted shapes are defined here. */
export interface CollegeYearStart {
  week: number
  /** her skill mean, 0-100 – `skillMeanOf(world.skills)` at the year's opening */
  skill: number
  /** her professional rank, or null when she is not on the list (`LadderView.rank`'s contract) */
  rank: number | null
  fundsCents: number
}

/** ⭐ P5 – ONE COLLEGE YEAR, banked the week it finishes.
 *
 *  ⚠ IT STORES WHAT WAS MEASURED AT THE TWO ENDS AND NEVER A DERIVED VERDICT. `pruneResults` deletes
 *  a result 52 weeks after it happened and `financeWeeks` keeps a 60-week window, so by the time the
 *  epilogue is drawn NONE of this is recoverable from anything else the save holds – which is the
 *  same argument `CareerTotals` makes, and the reason this is a new fact rather than a view. */
export interface CollegeYear {
  /** 1-based: the first year she spent there is 1 */
  index: number
  fromWeek: number
  untilWeek: number
  /** her skill mean at each end, 0-100 – what the year did to her game */
  startSkill: number
  endSkill: number
  /** her professional rank at each end, or null when she is not on the list at all (the same
   *  contract `LadderView.rank` keeps: null IS NOT #1) */
  startRank: number | null
  endRank: number | null
  /** what the family's balance did over the year. Positive is the scholarship's whole economic
   *  point – it is the one stretch of the game where the money goes the other way. */
  fundsDeltaCents: number
  /** the national-team week, or null in a year nobody wrote to her – see `engine/nationalTeam.ts` */
  callUp: CollegeCallUp | null
  /** ⭐⭐⭐ v56 – THE ONE TOURNAMENT THE YEAR IS GUARANTEED (`engine/collegeLeague.ts`).
   *
   *  ⚠ NULLABLE EVEN THOUGH IT IS GUARANTEED, AND THE NULL IS NOT A HOLE IN THE GUARANTEE. Two
   *  careers legitimately have one: a v55 save migrated in mid-freeze (its banked years were lived
   *  before this fixture existed and inventing a result for them would be putting a scoreline in a
   *  career's mouth), and a year cut short by an ending before week `COLLEGE_LEAGUE.seasonWeek` came
   *  round. Both are years that really did hold no championship. */
  league: CollegeLeagueRun | null
}

/** ⭐⭐⭐ v56 – ONE COLLEGE LEAGUE, PERSISTED. The leaf's `CollegeLeagueResult` plus the week it was
 *  played on – exactly the split `CollegeCallUp` keeps against `nationalTeam.ts`'s `CallUp`.
 *
 *  ⚠ ZERO MONEY AND ZERO RANKING POINTS, by design and not by omission: she is an amateur while she
 *  is there, and a student fixture that paid points would make four years of college a ranking route
 *  and stop the fork being a real choice. `engine/collegeLeague.ts` carries the argument. */
export interface CollegeLeagueRun {
  week: number
  /** 0..`rounds`; `rounds` means she won the title */
  roundsWon: number
  /** the draw's round count as it was when she played – 3 for a draw of 8 */
  rounds: number
}

/** One national-team week inside a college year. Zero money and zero ranking points, by the
 *  rulebook – `engine/nationalTeam.ts` carries the sources. */
export interface CollegeCallUp {
  week: number
  rubbersPlayed: number
  rubbersWon: number
  nationFinish: number
}

/** ONE PAGE OF THE ALBUM (career-contract-v1.md §9.1). Four things and no fifth. */
export interface AlbumPage {
  /** 1..7 – the slots are FIXED so the album has a shape every career shares (§9.2) */
  slot: number
  /** ⚠ POINT 4, AND IT IS ALWAYS VISIBLE: why this week is in the album. The owner's «видимое
   *  правило отбора». An engine that silently chooses "what mattered" is the game judging; an
   *  engine that shows its reason is the game explaining. */
  why: string
  /** POINT 2: the week in her own hand, ON THE CARD – the polaroid's own bottom lip, in the app's
   *  handwriting face. The engine writes the words; `Polaroid`'s caption slot renders them. */
  caption: string
  /** POINT 3: ONE hard fact off the milestone itself – the cheque, the rank, the opponent, the
   *  layoff. Never a computed summary. Null on an empty face, which has no fact to give. */
  fact: string | null
  /** the absolute career week this page is, or null on an empty face */
  week: number | null
  /** the season the page belongs to, for the date under the caption; null on an empty face */
  seasonIndex: number | null
  /** POINT 1: the photograph, as the art system's two keys. The ENGINE never builds a URL – it
   *  hands over the age band and the week's emotion and the UI calls `portraitUrl`. */
  stage: PortraitStage
  emotion: AvatarEmotion
  /** ⚠ AN EMPTY FACE, and only slots 3 and 6 can ever have one (§9.2, corrected 05.08). Slot 5's
   *  empty face was dropped: injury prevalence is ~51% a season and the slot's own fallback fills
   *  even for a career that never was, so it is never empty in practice. */
  empty: boolean
}

/** §9.3 – UNDERNEATH THE ALBUM: the full scroll, every milestone in order, paged by season. §5.5's
 *  option (a), kept as the floor rather than as the surface. */
export interface ScrollSeason {
  seasonIndex: number
  year: number
  ageYears: number
  rows: { week: number; label: string; detail: string | null }[]
}

/** THE HAND-OFF (§5.6): an OFFER, not a credits roll. One tap to a new career, the next daughter
 *  generated automatically, and exactly ONE question asked – the starting-capital fork the player
 *  already answers at onboarding. Nothing mechanical carries over.
 *
 *  ⚠ THREE OF THE FOUR FIELDS ARE PRODUCED AND READ BY NOTHING (measured 19.08.2026, round 22).
 *  `world/endings.ts` fills `childBorn`, `freshCapitalFork` and `resumesAgeYears` on every ending
 *  view, and the only component that touches this interface – `EndingScreen.vue` – reads
 *  `resumesWeek` and nothing else. Their remaining readers are `tests/ending.test.ts` and three
 *  component-test fixtures, i.e. the contract testing itself. LEFT STANDING DELIBERATELY, NOT
 *  OVERLOOKED: each carries an argument for being asked before it can be answered (see the field
 *  comments below), and whether that argument outlives YAGNI is the owner's call, not an agent's.
 *  Recorded here so the next reader does not have to re-derive the grep. */
export interface HandoffView {
  /** ⚠ THE SEAM THAT ALWAYS ANSWERS NO IN v1. «Если ребенка родила за игру – то вполне может
   *  попробовать продолжить»: if a child was born during the career, THAT child is the next
   *  daughter. Pregnancy is post-v1 (§5.4), so this is false for every career this build can
   *  produce – but the question is ASKED, and asking it now is what stops the lineage needing a
   *  retrofit the day the system lands. */
  childBorn: boolean
  /** ⚠ FRESH FORK, NOT THE MOTHER'S BALANCE (§5.6, the architect's call). Carrying her final money
   *  over is exactly the meta-currency §5.6 rules out, and a family that ended rich would open the
   *  next daughter's story with its central tension already resolved. */
  freshCapitalFork: true
  /** COLLEGE ONLY: the week she comes back, and how old she is then. */
  resumesWeek: number | null
  resumesAgeYears: number | null
}

/** THE EPILOGUE, whole. Present on the snapshot exactly while `world.ending` is latched, which is
 *  why the takeover gates on this FIELD and never on a stop reason: permanent state must survive
 *  any fresh snapshot (the same argument App.vue makes for the knock). */
export interface EndingView {
  ending: CareerEnding
  /** exactly seven pages, in slot order */
  album: AlbumPage[]
  scroll: ScrollSeason[]
  handoff: HandoffView
  /** the career's money, whole – not a score, just the two numbers the ledger kept */
  totals: CareerTotals
  seasonsPlayed: number
  /** best (smallest) season-end rank she ever held, or null if she never closed a season */
  bestRank: number | null
  titles: number
  /** how many times she answered "one more year" (§5.3's decade of decisions) */
  oneMoreYearCount: number
  /** ⭐ P5: the college years, while she is living them. Null on every other ending and on college
   *  itself once she has left – it is the state of an OPEN question, and there is exactly one screen
   *  allowed to ask it. */
  college: CollegeProgressView | null
}

/** ⭐ P5 – WHAT THE EPILOGUE SCREEN NEEDS TO ASK "ANOTHER YEAR?" AND NOTHING ELSE.
 *
 *  ⚠ `final` IS THE FIELD THAT DECIDES WHETHER THERE IS A QUESTION AT ALL, and it is built exactly
 *  like `RetirementOffer.final`: the last year is not a choice she declines, it is the year after
 *  which nobody is asking. Two answers or none – the screen may not invent a third. */
export interface CollegeProgressView {
  /** how many years she has finished – 0 before the first one is spent */
  yearsDone: number
  /** `ENDINGS.collegeYears`, read out of the engine so the copy never says "four" from a template */
  totalYears: number
  /** the year that just finished, or null before the first one */
  last: CollegeYear | null
  /** ⚠ "THE NEXT YEAR IS THE LAST ONE", not "she is out". A career that is out has no ending latched
   *  and is never rendered here, so a flag for that state would be dead on arrival. This is the
   *  difference between a question with years behind it and the LAST question there will be – the
   *  same job `RetirementOffer.final` does one door along, and the copy has to carry it. */
  final: boolean
  /** ⭐⭐ WHAT THIS YEAR COSTS THE FAMILY, in cents – round 21, the owner's «прозрачной оплатой и
   *  годовым списанием».
   *
   *  ⚠⚠ THE MONEY WAS ALREADY LEAVING AND THIS SCREEN SAID IT WAS NOT. `resolveCollegeBill` has
   *  debited `familyPerYearCents / 52` every week she is enrolled since v51, and the epilogue went on
   *  printing "the family stops paying" on two separate lines. A player deciding whether to spend
   *  another year was being asked to agree to a bill nothing on the screen named.
   *
   *  ⚠ IT IS A WIRE FIELD AND NOT A SAVE FIELD, deliberately. It is read straight off the persisted
   *  `fork.offer` at snapshot time – the offer is the contract she agreed to at nineteen and it does
   *  not move – so this adds no `SAVE_SCHEMA_VERSION` bump, no migration and no golden fixture. A
   *  career that entered college before v51 carries a null offer and reads **0** here, which is the
   *  truth for it: it was never quoted a price and is never charged one. */
  billPerYearCents: number
  /** ⭐ WHICH PLACE SHE IS AT (17.08). Derived from `fork.offer.chosen` at snapshot time – no save
   *  field, no migration. `null` on a career that entered college before the choice existed, and the
   *  screen says nothing rather than naming a place it was never told. */
  tier: CollegeTier | null
  /** ⭐⭐ THE RUBBERS OF `last`'s CALL-UP WEEK, WATCHABLE – the college wave, the owner's item 3.
   *
   *  ⚠ THE RECORDS THEMSELVES, because that is what watching one takes: `MatchReplay` re-runs
   *  `simulateMatch(a, b, {surface, tour, seed})` under the stored seed and reproduces the match
   *  point for point. A list of scorelines would be a report about a match; this is the match.
   *
   *  ⚠ A WIRE FIELD AND NOT A SAVE FIELD, on exactly `billPerYearCents`' argument two doors up. The
   *  rows live in `world.events` like every other match in the game and are read out at snapshot
   *  time by `callUpRubbersOf`, so this adds no `SAVE_SCHEMA_VERSION` bump, no migration and no
   *  golden fixture.
   *
   *  EMPTY in a year nobody wrote to her, and empty on the year she was named and never took the
   *  court – which is a real outcome, not a missing one, and the copy beside it says so. */
  rubbers: WorldMatch[]
  /** ⭐⭐⭐ v56 – THE COLLEGE LEAGUE OF THE YEAR JUST FINISHED, or of the year in progress once it has
   *  been played. Null only before the first championship of the career (and on a v55 career
   *  migrated in mid-freeze, whose banked years genuinely held none).
   *
   *  ⚠ IT IS READ FROM `pendingLeague` FIRST AND THE BANKED YEARS SECOND – `lastLeagueRun` – so the
   *  card reports the championship the WEEK it is played rather than at the year boundary. That
   *  matters because it is also what the call-up two weeks later is about to read: the player sees
   *  the fact the selectors will use, before they use it. */
  league: CollegeLeagueRun | null
  /** ⭐⭐⭐ v56 – THE CHAMPIONSHIP'S MATCHES, WATCHABLE, on `rubbers`' own argument two doors up: the
   *  records themselves, because that is what watching one takes. A wire field and not a save field
   *  – the rows live in `world.events` like every other match in the game.
   *
   *  Between one and three rows: she is in the draw every year, so unlike `rubbers` this is EMPTY
   *  only on a career that has not reached its first championship week. */
  leagueMatches: WorldMatch[]
  /** ⭐ v57 – IS A YEAR PAUSED MID-FLIGHT (her birthday stopped it)? True exactly while
   *  `college.pendingYearStart` is held, so the bottom control can say «Finish the year» instead of
   *  offering to start one, and the early return can stand down until the year she started is done.
   *  A wire field off persisted state – no schema implications of its own. */
  yearInProgress: boolean
}

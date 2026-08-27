// THE SNAPSHOT – the ONE object the UI is ever handed.
//
// Every field is either persisted state the worker copied out or a view it derived at snapshot time;
// the types themselves live in the sibling modules this file imports.
//
// Part of the `shared/protocol` module set – see src/shared/protocol.ts, which re-exports every
// name below under the historical public path. Nothing here imports that barrel back.

import type { LadderTrack, TierId } from '../../engine/season/types'
import type { CollegeOffer, CollegeState, EndingView, RetirementOffer } from './career'
import type { ArrivalPreview, EntryCapUsage, LossStreak, PendingView, SeasonHistoryEntry, SeasonSummary, SeasonSupply, TierOpenMap, TierRefusal, TierTrophies, UpcomingEvent } from './competition'
import type { CareerTotals, DebtView, FinanceWeekPoint, FinanceWindow, StopReason, WorldEvent } from './events'
import type { InjuryReport, Knock, KnockPrompt, SnapshotInjury } from './health'
import type { CountingResult, LadderViews, StandingRow } from './ladder'
import type { BirthdayPrompt, DiarySnapshot, KidLife, Milestone, RadarAxis, TrainingRead } from './narrative'
import type { CoachMarketRow, KitDealView, KitLineView, Offer, ShopView, SnapshotAcademy, TourBriefing } from './offers'
import type { CoachEdgePlacement, PlayerProfile, PracticeBooking, RecoveryBuff, VacationBooking, WeekPlan } from './profile'

export interface Snapshot {
  schemaVersion: number
  careerId: string
  seed: string
  week: number
  /** derived: detailed simulation starts at 14 */
  ageYears: number
  /** W4-SCHOOL – THE CAREER WEEK HER SCHOOL YEARS END, and the only school fact the UI is given.
   *
   *  ⚠ A WEEK AND NOT A BOOLEAN, and that is the whole reason it is shaped this way. Three surfaces
   *  ask about weeks that are not this one – the calendar's seven-week look-ahead, the Season
   *  screen's rows, the planner's future bookings – and a boolean captured at the current week would
   *  paint a lesson block on a week she will not be at school in. Every caller asks the same
   *  question: `w >= snap.schoolEndsWeek`.
   *
   *  DERIVED, never persisted: `schoolEndWeek(profile.birthMonth)`, a pure function of her birth
   *  month, so a save from any version answers it the moment it is loaded and nothing can drift out
   *  of step with `world.week`. */
  schoolEndsWeek: number
  /** ⭐⭐⭐ ROUND 24 #5 – THE WEEK SHE LEAVES FOR COLLEGE, or null when no departure is in front of
   *  her. Non-null in exactly two states, and it is the same fact in both: while the fork is OPEN it
   *  is the prospective `nextAcademicYearStart(askedWeek)` (what the college answer would book – the
   *  dialog prints it), and through the HOLD (college answered, not yet enrolled) it is the booked
   *  `fork.departsWeek` (the calendar's look-ahead marks it). Null once she enrols, on every other
   *  fork answer, and behind any latched ending – a voided reservation never resurfaces.
   *
   *  DERIVED, never persisted as its own field: `toSnapshot` reads the fork. A week and not a
   *  boolean, `schoolEndsWeek`'s own reason one line up – the look-ahead asks about weeks that are
   *  not this one. */
  collegeDepartsWeek: number | null
  /** ⭐ AD STEP 2 (the-face-and-the-court.md §4a) – THE RUNNING ENDORSEMENT'S SHOOT WEEKS, or null
   *  when no signed advertising deal is in force this week. The calendar look-ahead marks them the
   *  way it marks the college departure – a decision already made, visible before it arrives – and
   *  the brand rides along so the row can say WHOSE shoot it is without the UI re-deriving a deal.
   *
   *  DERIVED, never persisted: `toSnapshot` reads the active deal's own frozen terms
   *  (`activeAdDeal`), so the markers and the recovery the engine actually charges can never name
   *  different weeks. Weeks are absolute career weeks, `weekLabel`'s own unit. */
  adShoot: { brand: string; weeks: number[] } | null
  fundsCents: number
  profile: PlayerProfile
  plan: WeekPlan
  /** v47 – HOW MANY SESSIONS ONE DAY MAY HOLD in the week the plan is about to be lived in: 1 on an
   *  ordinary school day, 2 on a day with no school (docs/specs/training-dials.md §3). THE PLAN TAB'S
   *  CAPACITY DOTS READ THIS, so the limit is visible before he bumps into it rather than arriving as
   *  a refusal.
   *
   *  DERIVED, never persisted, and carried as data for the reason `CalendarWeek.schoolOver` is: the
   *  screen may not ask the engine, and `summerBlockWeek` is not a predicate it could re-derive – it
   *  refuses on an injury, a booked family week, a tournament and a rested knock as well as on the
   *  calendar. It is the capacity of `week + 1`, the week the main button plays. */
  planDayCapacity: number
  /** the kid's per-week condition 0..100 (100 = fresh); fatigue is the derived 100 - condition
   *  (Season-Life slice B, schema v12).
   *
   *  ⭐⭐ A WHOLE NUMBER, ALWAYS – rounded ONCE by `toSnapshot` (the long goodbye §4a, owner 26.08:
   *  «у нас в логике могут быть дробные числа – это окей, а у пользователя целые в интерфейсе»).
   *  `world.condition` behind it is FRACTIONAL in the professional era, because the recovery a rest
   *  week returns fades with her body from 29 on. No screen may round this again: the boundary owns
   *  the decision, and `tests/condition-boundary.test.ts` is the ratchet that says so. */
  condition: number
  /** the kid's active injury, or null when healthy. Always null in slice B (Slice C populates it). */
  injury: SnapshotInjury | null
  /** ⭐ R2-02 – WHAT THAT INJURY DID, as facts rather than as sentences: the door it came in by, the
   *  entries the layoff cancelled, the ones it stranded, and the money that came back. Non-null on
   *  exactly the weeks `injury` is. The dialog that renders it is a FORMATTER: it parses no feed
   *  prose for anything it shows, so re-wording a news line can no longer silence a report. */
  injuryReport: InjuryReport | null
  /** whether physio recovery is active (its cost lever is billed in Slice C; in B this just
   *  reflects/sets the flag, default = every coach tier but self-coached). */
  physioActive: boolean
  /** v59, the travelling team step 1: is the masseur on the payroll. Suspends (does not cancel) at
   *  college and on booked family weeks – the coach's own stand-down pair. */
  masseurHired: boolean
  /** ...whether the hire is even on offer – her first counting W-series result opens the door
   *  (`masseurUnlocked`, the professional table's own one-way latch). The card locks with
   *  `MASSEUR_LOCKED_DETAIL` until this is true, so the disabled state and the refused click can
   *  never tell two stories. */
  masseurUnlocked: boolean
  /** ...the weekly bill at the family's chosen rung, in cents – a FLAT contract per rung (sessions
   *  × the professional session rate, no corridor, no jitter), so the card's quote IS the ledger's
   *  row. */
  masseurSalaryCents: number
  /** ⭐ v59 step 2 – THE DIAL (the owner's own idea): sessions a week on the table, one of the
   *  `ECONOMY.masseur.rungs` sessions values (2 / 4 / 7). The bill, the rehab cadence and the
   *  condition bonus all follow the rung. */
  masseurSessionsPerWeek: number
  /** ...and THE TRAVEL STANCE (step 2, ruling Б: «массажист ездит») – the coach's
   *  `coachOnEventWeeks` pattern for the next seat: default off, the switch buys one more fare on
   *  every trip to a paying rung, and the fare buys table work between rounds (the strain relief at
   *  finalize). */
  masseurTravels: boolean
  /** What the booked trips would cost the masseur's seat – priced with the stance forced ON (the
   *  coach billing's as-if rule: a price the switch's row quotes must not change when the switch is
   *  flipped), summed over the entries currently held at paying rungs. */
  masseurTravelFareCents: number
  /** ...over how many booked trips. */
  masseurTravelTrips: number
  /** ⭐ THE MASSEUR'S OWN ROOM NOTE (the plan's §4 law): one plain sentence that says what his
   *  hands did lately – the rehab he is working, the layoff that ended early, the quiet weeks –
   *  quoting no figure, '' when nobody is hired. See `masseurRoomNote`. */
  masseurNote: string
  /** W4 – THE UNANSWERED KNOCK, or null. Non-null on exactly the weeks a decision is outstanding
   *  (`knock.choice === null`), which is the same condition `advanceWeeks` blocks on – so the dialog
   *  and the engine can never disagree about whether the career is waiting for him.
   *
   *  DERIVED, not the persisted `Knock`: the copy is assembled per snapshot (buildKnockPrompt) and
   *  the state it is assembled from lives on the world. Once he answers, this goes null while the
   *  knock itself stays live for its weeks – there is nothing left to ask. */
  knockPrompt: KnockPrompt | null
  /** ⭐ v48 – HER BIRTHDAY, AND THE QUESTION IT ASKS. Non-null on exactly the weeks a birthday is
   *  waiting to be answered, which is the same condition `advanceWeeks` blocks on – so the dialog and
   *  the engine can never disagree about whether the career is waiting for him.
   *
   *  DERIVED, not persisted: assembled per snapshot (buildBirthdayPrompt) off the birth date and the
   *  record. Once he answers, the row appears in `birthdays` and this goes null. */
  birthdayPrompt: BirthdayPrompt | null
  /** ⭐ round-18 #8 – THE TOUR'S COMMITMENT RULES, EXPLAINED THE FIRST TIME THEY BIND HER. Non-null on
   *  every week `mandatoryBindsRank` is true; the shell shows it ONCE per career and then never again
   *  (a per-career localStorage watermark, exactly like the injury report's). See `TourBriefing`. */
  tourBriefing: TourBriefing | null
  /** W4: the knock that is LIVE this week, decided or not – what the week is being spent under.
   *  Null on a week with nothing wrong. The UI reads `choice` off this to say "resting the ankle"
   *  rather than re-deriving anything. */
  knock: Knock | null
  /** most recent 60 events, chronological (oldest first) */
  events: WorldEvent[]
  /** category-accurate spending/income over the full retained finance history (survives the
   *  60-event cap). window12w = last 12 weeks; season = the current 52-week season block;
   *  weekly12 = the SAME 12 weeks kept week-by-week, for the Home budget card's chart (a fold
   *  cannot be un-folded, so the shape over time has to be carried separately). */
  finance: { window12w: FinanceWindow; season: FinanceWindow; weekly12: FinanceWeekPoint[] }
  /** most recent financial transactions (amountCents present), id-ascending, up to 50 –
   *  independent of the mixed 60-event `events` cap so the ledger isn't starved by news. */
  financialEvents: WorldEvent[]
  /** scheduled events over the next 8 weeks, with entry state */
  upcoming: UpcomingEvent[]
  /** ...and how much tennis is left in the WHOLE season, by rung - the planning counter. See
   *  `seasonSupply` in world.ts for what "available" means and why this is not a longer `upcoming`. */
  seasonSupply: SeasonSupply
  /** R12-15/R12-3: the engine's verdict on the entered event for `week + 1` – the week the sticky
   *  bar's button is about to play – or null when nothing is entered there. See ArrivalPreview. */
  arrival: ArrivalPreview | null
  /** the ITF annual entry cap for the CURRENT season – what the Home tier ladder needs to tell
   *  "capped for the year" apart from "locked on points" and "nothing scheduled". Derived at
   *  snapshot time from the persisted ledger, so it persists nothing of its own. */
  entryCap: EntryCapUsage
  /** THE PRO AER allowance for the CURRENT season (W2-LADDER §5, schema v36's `proEntryWeeks`
   *  behind it) – the junior cap's exact parallel one table up, never merged: the WTA age rule is
   *  "separate from and additional to" the ITF junior one, so a sixteen-year-old holds both
   *  budgets at once. The planner's «Pro entries this season: N of M» line and the W rungs'
   *  "capped" tier state both read THIS, and unlimited seasons read as
   *  `limit: Number.MAX_SAFE_INTEGER` exactly as the junior field does at 17+. */
  proEntryCap: EntryCapUsage
  /** the engine's own per-tier entry verdict - see TierOpenMap */
  tierOpen: TierOpenMap
  /** ...AND WHICH OF THE OPEN ONES SHE HAS ALREADY PASSED (`hasOutgrown`, 06.08). Since the lower
   *  bound stopped refusing, `tierOpen` alone can no longer tell a working rung from one she has
   *  outgrown – they are both `true` – and the two are a completely different sentence on a screen.
   *  ⚠ IT IS NOT A LOCK AND NO SURFACE MAY DRAW IT AS ONE: it is the ladder's own "she is past this
   *  level", and the reason the feed's per-week pick can lead with the more relevant rung.
   *  Derived at snapshot time, persists nothing, and every rung it is true of is a rung she may
   *  still enter. */
  tierOutgrown: TierOpenMap
  /** THE ACCEPTANCE LIST, AS A POSITION, per rung that has one – `acceptanceRank(world, tier)`, absent
   *  for every rung that gates on points instead.
   *
   *  ⚠ IT IS HERE SO THE LOCKED PLAQUE CAN SAY WHEN THE RUNG OPENS (31.07, the owner: «когда
   *  открываются турниры разных типов? Что-то раньше было в интерфейсе видно и понятно, а теперь не
   *  очень»). J60 and J300 gate on her ITF rank position, so their `enterPointBand` is `[0, MAX]` and
   *  every surface that read a band to explain them said either nothing or "0+". The number cannot be
   *  written down in the UI either: it is `enterPct × (cohort + 1)`, so it moves with a re-picked
   *  acceptance list AND with the population – the illustrative "top 50" that used to sit in a comment
   *  was stale by two re-pins when it was found. Derived at snapshot time, persists nothing. */
  tierAcceptance: Partial<Record<TierId, number>>
  /** ⭐⭐ WHY A RUNG IS SHUT, IN THE ENGINE'S OWN WORDS (PR-09 / TB-05, 19.08). Present only for a
   *  rung the engine refuses; ABSENT means open, so this map never restates `tierOpen`.
   *
   *  ⚠ IT EXISTS BECAUSE THE UI USED TO REBUILD THE REASON. `tierOpen` has answered "may she" since
   *  W2-LADDER, but not "why not" - so `composables/tierState.ts` kept its own age gate, its own
   *  point band and its own copy of `entryBandTrack` to produce the sentence. That is the "two sides
   *  asking different functions about one question" class, and it has shipped as a defect four times
   *  (the wild cards, the age gates, the bench pre-filter, and a W15 reading "68 / 120 international
   *  pts" while the engine held it open).
   *
   *  ⚠ THE SAME FIELDS AN EVENT'S REFUSAL ALREADY CARRIES, deliberately - `ineligibleReason` and its
   *  numbers, one shape for both scopes, so a card and a tournament row explain a refusal the same
   *  way. What is NOT here is anything already on the Snapshot: `outgrown` is `tierOutgrown`, open is
   *  `tierOpen`, and duplicating either would be this proposal's own defect.
   *
   *  ⚠ IT IS THE RUNG'S BASELINE, not a promise about any one tournament: computed with no per-event
   *  door (`tierVerdict`'s `id: null`). The home wild card, the alternates list and the reserved
   *  junior place can only ever ADMIT, so a named event may be MORE permissive than this and never
   *  less. Derived at snapshot time, persists nothing. */
  tierRefusal: Partial<Record<TierId, TierRefusal>>
  /** THE ON-RAMP LATCHES (v34 state, surfaced read-only in R15-9): has she EVER cleared the way
   *  onto each upper table. The event feed no longer reads them directly - W2-LADDER §4's
   *  two-type rule derives its pair from `tierOpen` below (see `feedContext` in
   *  composables/tierState.ts), and the latches reach the feed THROUGH the oracle (the on-ramp
   *  rungs' openness IS the latch). Still surfaced: the pure UI reads them for context, and the
   *  R15-9 story they carry is the two-type rule's ancestor. */
  onRampCleared: { itf: boolean; wta: boolean }
  /** WHO SHE TRAINS WITH (v23): the roster coach's id, or null for the parent on the court. */
  coachId: string | null
  /** THE COACH MARKET (screen T): every coach, priced and read for her. Derived, never stored. */
  coachMarket: CoachMarketRow[]
  /** What the coach costs, weekly and over the coming year.
   *
   *  ⚠ ONE SEASON FIGURE SINCE 08.08, not the OFF/ON pair. The retainer is charged on every week the
   *  coach is not stood down - which is no longer a question the tournament calendar answers - so
   *  there is nothing left to compare. See `coachWorksThisWeek`. */
  coachBilling: {
    /** ⭐ ROUND-21 #2: does he TRAVEL with her. A persisted stance, and since this wave a LIVE one –
     *  the row on screen T sets it, the till charges a second fare for it, and the flow, the
     *  commentary and the week's story all say when he came. */
    onEventWeeks: boolean
    /** ⭐ v49: ...and to the rungs that pay her nothing too – the NESTED half of the stance, and the
     *  one the bench says can end a career in the junior years. Only meaningful while `onEventWeeks`
     *  is on, which is how screen T draws it: a second and more expensive choice, not a second row. */
    onJuniorEvents: boolean
    weeklyCents: number
    /** weeks of the season she is entered for – the season she is in, or the one just finished */
    eventWeeks: number
    /** weeks of the coming year the retainer is actually charged for */
    billedWeeks: number
    seasonCents: number
    /** ⭐ ROUND-21 #2: what the second seat would add over the trips he WOULD BE ON this season, in
     *  cents. Priced whether the switch is on or off – it is the price of the decision, not a
     *  receipt. 0 for a self-coached family (nobody to send) and 0 with nothing booked.
     *  ⚠ GROSS since 15.08: the support pays for HER seat and never for his, so this is the full
     *  fare. It is read out of `coachTravelFareFor` itself, which is what stops the row on screen T
     *  and the line on the till quoting different money. */
    travelFareCents: number
    /** ...and how many trips that figure covers, so the screen never prints a total with nothing to
     *  divide it by. Trips he would be ON – which is fewer than she has booked whenever the rungs on
     *  her card are ones he is not sent to. */
    travelTrips: number
    /** ⭐ 15.08: what HER seats cost over those same trips, net of every cover. Equal to
     *  `travelFareCents` for a family paying full price, and SMALLER for one holding a scholarship or
     *  a brand's travel share – which is precisely the case where "twice the fare" stopped being
     *  true and the screen has to print both figures instead. */
    travelHerFareCents: number
    /** ⭐ v49: what opening junior travel would add on top, and over how many further trips. Disjoint
     *  from `travelFareCents` by construction – a rung either pays prize money or it does not. */
    travelJuniorCents: number
    travelJuniorTrips: number
    /** ⭐ 15.08: is any support reducing HER travel this week? Asked of the one fare definition rather
     *  than of a list of covers, so a support stream added later is inside the answer. It is what
     *  lets screen T say "his seat is not covered" only to the families that hold a cover. */
    travelCovered: boolean
    /** ⭐⭐ ROUND-21 #2, 17.08: and is a sponsor's contract reducing **HIS** seat, as a whole
     *  percentage – 0 for every family holding no deal that pays towards travel.
     *
     *  ⚠ IT IS THE SAME SHARE HER OWN FARE READS (`KitOfferTerms.travelShare`), because that is the
     *  whole rule: one sponsor number, two seats. What differs between the seats is the SCHOLARSHIP -
     *  `travelCovered` above answers "is anything covering HERS", and a needs-based rescue is in that
     *  answer and may never be in this one. Two fields because they answer two questions, not because
     *  there are two sponsor terms. */
    coachFareCoverPct: number
    /** ⭐ ROUND-21 #12: WHAT ARRIVES EVERY WEEK, ALL OF IT – the parents' contribution plus the
     *  savings interest the balance earns plus a signed kit deal's retainer, pro-rated. It is the cap
     *  the coaching budget meter draws against and the denominator every `overBudgetCents` is cut
     *  from, and it is carried here rather than reverse-engineered on the screen (which only worked
     *  while some row happened to be over budget). See `familyWeeklyIncomeCents`. */
    weeklyIncomeCents: number
  }
  /** ONE SENTENCE ABOUT HOW MUCH ROOM IS LEFT IN HER (08.08) – the context every uplift on screen T
   *  is relative to, since a rung's worth is a share of remaining headroom and collapses as she
   *  fills her ceiling. Never quotes the ceiling itself; see `coachRoomNote`. */
  coachRoomNote: string
  /** WHAT THE COACH'S EDGE IS WORTH HERE (docs/specs/coach-match-edge.md §4 and §7): the corridor of
   *  the rung she is on, and WHERE IN IT the man she actually has turned out to sit, once she has
   *  had him for a full season.
   *
   *  ⚠ THERE IS NO NUMBER FOR HIM ON THIS SNAPSHOT, and that is structural rather than a matter of
   *  discipline (§7). `realisedPct` used to be here and the card printed it to two decimals; the
   *  owner's objection – «как это вообще измеримо, если абстрагироваться от нашей механики?» – is
   *  that nobody inside the world could ever produce that figure. A field the UI cannot read is a
   *  rule that cannot be broken by the next screen that wants to be helpful. The engine still knows
   *  the value (`coachEdgePp`) and composes her match player from it; the UI gets `placement`.
   *
   *  ⚠ `placement` IS null UNTIL `revealed`, and the ENGINE decides that – the reveal is a rule about
   *  the career (a season with him), not a formatting choice, and it is the anti-shopping gate §4
   *  exists for. Derived at snapshot time; nothing about the edge is persisted, because the value is
   *  re-derived off his id like every other sub-stream in the engine. */
  coachEdge: {
    /** [lo, hi] pp per match for her rung – [0, 0] self-coached, which is not a corridor */
    corridorPct: [number, number]
    /** ⭐ ROUND-21 #2: ...and the same band DOUBLED on the trips the coach is on, or `null` when this
     *  family would not send him. A bracket, like the one above it – no coach id is read anywhere in
     *  its derivation, so §7's "no figure for him on any screen" survives it. */
    travelCorridorPct: [number, number] | null
    /** which third of that corridor he landed in, or null while there is nothing honest to show */
    placement: CoachEdgePlacement | null
    revealed: boolean
    weeksTogether: number
    /** ⭐ ROUND-21 #7c: THE WEEK THE VERDICT LANDS IN, and it is an OFF-SEASON week rather than a
     *  duration. It was `revealAfterWeeks: 52` – a rolling bar off the hire date that never looked
     *  at the calendar, which is how the card came to print "49 weeks of 52" in an off-season with
     *  the season already played. See `coachRevealWeek`. */
    revealWeek: number
    /** ...and the same clock in seasons, which is what the plaque's CONFIDENCE is banded on (§8a) */
    seasonsTogether: number
    /** THE PLAQUE, WRITTEN (§7/§8a). One sentence, composed engine-side from the place and the
     *  clock, because the two halves answer to different things and a screen holding both would be
     *  the second copy of that rule. The card prints it and formats nothing. */
    plaqueLine: string
    /** ⭐ ROUND-21 #2: THE CONDITION UNDER THE SECOND FIGURE, or '' when there is no second figure.
     *  It says «twice that on the trips the coach travels to» rather than «doubled», because the
     *  helping follows `coachTravelFareFor` and a junior week doubles nothing unless that stance is
     *  open too. Composed engine-side and quoting no number – see `TRAVEL_EDGE_LINE`. */
    travelLine: string
  }
  /** season planner (schema v13): booked vacation weeks from the current week onward. The
   *  calendar renders them by package name; a booked week is a hard blackout for entries. */
  vacations: VacationBooking[]
  /** season planner (schema v13): booked practice-match weeks from the current week onward. */
  practices: PracticeBooking[]
  /** an active resort/elite recovery buff, or null. Surfaced so the UI can show that the
   *  expensive package is still working. */
  recoveryBuff: RecoveryBuff | null
  /** HER KIT, LINE BY LINE (schema v37): the rung she is on, what it costs to move, and how worn
   *  each line is right now. Derived at snapshot time from the persisted `KitState` - the SCREEN
   *  never prices a rung or reads a wear curve, for the reason every other derived block on this
   *  snapshot exists. */
  kit: KitLineView[]
  /** THE DEAL BEHIND THOSE LINES, or null when nobody is kitting her out. See `KitDealView` - the
   *  running allowance is the fact the Bills page was missing. */
  kitDeal: KitDealView | null
  /** ⭐⭐ THE SHELF (schema v63, docs/specs/the-shop-2026-08.md §2): every rung, its price, whether
   *  the family owns it and what it is worth now. `kit`'s own shape and `kit`'s own rule – the
   *  SCREEN never prices a rung, never applies a rate and never subtracts two figures to find a
   *  loss; the engine does all three and hands over the answers. See `ShopView`. */
  shop: ShopView
  /** her academy scholarship, or null when nobody is backing her (schema v21). Surfaced because
   *  every travel figure the planner quotes is already net of it, and a smaller number with no
   *  explanation is worse than no discount at all. */
  academy: SnapshotAcademy | null
  /** the kid's current dense rank among the cohort + kid */
  kidRank: number
  /** the kid's rank at the start of the last resolved week; null before any tick (schema v7) */
  prevKidRank: number | null
  /** top 10 + 5 around the kid, deduped, rank order. THE ITF TABLE - an alias of `ladders.itf`. */
  standings: StandingRow[]
  /** the kid's counted best-6 results (round-5 item 1b), strongest first. THE ITF TABLE - an alias of
   *  `ladders.itf.countingResults`. */
  countingResults: CountingResult[]
  /** BOTH TABLES (docs/specs/two-ladders.md). `kidRank`, `standings` and `countingResults` above are
   *  the ITF ones and remain as aliases of `ladders.itf`, so nothing that already reads them changes;
   *  a test pins the aliasing, because two names for one fact is precisely how the rank bug began. */
  ladders: LadderViews
  /** WHICH TABLE SHE IS ACTUALLY COMPETING IN, decided by the engine (`activeLadderOf`) so the screens
   *  cannot answer it three different ways: the international one once she holds a counting result in
   *  it, her national one before that. A screen showing "her rank" with no further question asked
   *  should show THIS ladder's. */
  activeLadder: LadderTrack
  /** best (smallest) finish index the kid has ever reached per tier (schema v10); drives the
   *  Home season strip's real tier progress. Untouched tiers are absent. */
  bestFinishByTier: Partial<Record<TierId, number>>
  /** EVERY TITLE AND EVERY LOST FINAL OF HER CAREER, per tier, as weeks (schema v31). Behind the
   *  Trophy Cabinet. See `TierTrophies` above for the shape and for why `finals` excludes titles.
   *
   *  ⚠ IT IS PERSISTED STATE AND NOT A DERIVATION, WHICH IS UNUSUAL FOR THIS SNAPSHOT, and the
   *  reason is that nothing already in a save can answer the question. `milestones` is firsts-only
   *  (its identity is `title:<tier>`, so five J30 titles leave one row); `bestFinishByTier` is a
   *  single high-water mark with no year on it, and it is OVERWRITTEN the week a silver becomes a
   *  gold; `results` is pruned to a 52-week ranking window; `events` is capped at 400 rows and only
   *  the trailing 60 reach this snapshot. A career-wide "how many, and when" is therefore not
   *  recoverable from any of them, which is exactly what the cabinet has to print.
   *
   *  Every tier is present from week 0 with two empty arrays - the screen shows all eighteen
   *  trophies from the start, locked, so an absent key would be a shape the reader has to defend
   *  against for no gain. */
  trophiesByTier: Record<TierId, TierTrophies>
  /** THE INBOX (schema v32): every letter this career has been sent, oldest first – open, signed,
   *  refused and expired alike. See `Offer`.
   *
   *  ⚠ PERSISTED STATE, LIKE `trophiesByTier` AND FOR THE SAME REASON: a signed deal has to outlive
   *  every prune. The event feed caps at 400 rows and only the trailing 60 reach this snapshot, so a
   *  contract that lives in the feed is a contract that silently stops existing two seasons later.
   *  Bounded by construction – at most a handful of letters a season – so it is never pruned. */
  offers: Offer[]
  /** ⚠ THE INBOX DOT, AND THE ENGINE DECIDES IT. Exactly the bell's discipline (HomeScreen's own
   *  comment: "the bell's dot asserts one FACT and not the 'unread' it cannot know"): this asserts
   *  that AN OFFER IS OPEN AND ITS DEADLINE HAS NOT PASSED, which is a fact the engine holds. It is
   *  never "unread" – the engine cannot know what the player has looked at, and a dot that claims to
   *  is a dot that lies on the second visit.
   *
   *  It goes out on its own: the last open offer being signed, refused or expiring is the same
   *  event as this turning false. */
  offerOpen: boolean
  /** the CURRENT season's kid W-L (round-8, the R6 debt): mirrors the v10 world counters that
   *  accumulate at finalizeTournament and reset at each season wrap-up.
   *
   *  ⚠ THE TOTAL, BOTH LADDERS TOGETHER, and it stays that on purpose. `matchesEverPlayed` folds it
   *  with `seasonHistory` into the radar's confidence, which is documented as a count that may only
   *  ever go UP; `SeasonSummary` and `seasonHistory` bank it per season. Splitting it per ladder is
   *  `seasonRecord` below, which is ADDED beside it rather than replacing it. */
  seasonWins: number
  seasonLosses: number
  /** THE SAME W-L, TOLD APART BY LADDER (31.07, the owner: «national/international разделить победы и
   *  поражения, мне кажется они не должны быть общими»).
   *
   *  Every match the counters see is a tournament match, so every one of them is attributable without
   *  inventing anything: `finalizeTournament` knows the event, the event knows its tier, and the tier
   *  knows its track. Nothing lands in neither bucket and nothing lands in both – a practice friendly
   *  never reaches finalize (R11-2: nothing was on the line), and a walkover or a medical withdrawal
   *  never reaches it either, because she never took the court.
   *
   *  ⚠⚠ RESTATED BY THE RETIREMENT SLICE (10.08), because the clause after the dash is now a
   *  half-truth and a reader would take the wrong rule out of it. "She never took the court" is still
   *  the correct test and still excludes the walkover and the medical withdrawal – but she CAN now
   *  take the court and not finish, and a RETIREMENT does reach finalize. It is counted, and counted
   *  as a LOSS in the event's own track, which is what it is: the tournament counts on her record and
   *  the opponent's win counts on theirs (2026 ITF WTT Regs, Women's §XII.C.1.b; the WTT's System of
   *  Merit §VI.B says it from the other side – "wins by retirement or default (after the match has
   *  started) count as wins, but byes and walkovers do not"). Two comments in engine/world.ts, at the
   *  prize money and the appearance fee, carried the same assumption and are restated there.
   *
   *  ⚠ WHY A SPLIT W-L IS NOT MERELY COSMETIC. The Stats screen switches every other figure it shows
   *  – rank, points, the standings table, the counting results – with the ladder picker at the top of
   *  it, and left this one figure standing still underneath. A 24–9 that does not move when the
   *  National/International switch does reads as a claim that those 24 wins are in the table currently
   *  on screen, which for a domestic career is false about all of them. */
  seasonRecord: Record<LadderTrack, { wins: number; losses: number }>
  /** her current run of consecutive competitive losses + the threshold that turns it angry, or
   *  null when her last competitive match was a win (or she has never played one). Derived at
   *  snapshot time from the event log – persists nothing, bumps no schema. */
  lossStreak: LossStreak | null
  /** Diary-1: the facts + the selected lines for every diary surface (photo card, condition
   *  note, Memory). Derived at snapshot time – only the milestone ledger behind `memory`
   *  persists (schema v18). */
  diary: DiarySnapshot
  /** THE DURABLE MILESTONE LEDGER, whole (`world.milestones`, schema v18) – her firsts, one row per
   *  identity, never pruned.
   *
   *  ⚠ IT IS ON THE SNAPSHOT BECAUSE `events` IS THE WRONG PLACE TO READ A PERMANENT FACT FROM.
   *  `events` is capped at the trailing 60 rows, positionally, so any surface that scrapes a
   *  milestone out of it works for a couple of months and then silently empties – which is precisely
   *  what happened to the Kid screen's moments strip. `diary.memory` is not a substitute either: it
   *  is ONE rotating card, chosen for this week's story, not the list. A surface that wants "what has
   *  she done so far" reads this. */
  milestones: readonly Milestone[]
  /** HER LIFE OFF THE COURT: the Personality / School / Friends tiles of screen C, derived in
   *  engine/kidLife.ts from her play style, her age and birth month, and the week's facts. Derived
   *  at snapshot time, persists nothing, bumps no schema. */
  life: KidLife
  /** THE SKILLS RADAR: four axes, always in `SKILL_KEYS` order (serve, ret, composure, stamina).
   *  An ESTIMATE of her build and a haze over her ceiling – never the truth, which stays in the
   *  engine. Derived at snapshot time, persists nothing, bumps no schema. See RadarAxis. */
  radar: RadarAxis[]
  /** THE WEEKLY STORY'S TRAINING LINE: what came along this week, in words, or null for a quiet
   *  week. The same fog as `radar`, one step further on – see TrainingRead. */
  trainingRead: TrainingRead | null
  /** the most recent end-of-season recap (schema v10), or null before the first season ends */
  lastSeasonSummary: SeasonSummary | null
  /** ⭐ ROUND-19 #2 – THE SEASON WHOSE WRAP-UP IS STILL OWED THIS WEEK (its INDEX), or null.
   *
   *  The recap popup used to be gated on the `'season-end'` STOP REASON, and a stop reason is a
   *  property of the last ADVANCE: any later command builds a snapshot without one. The retirement
   *  offer is raised on the wrap week by construction and outranks the recap, so answering it – a
   *  real command – erased the reason behind it and the season's summary was never shown. The fork
   *  did the same one rank up.
   *
   *  So the recap now reads STATE, like the ending, the fork, the offer and the injury report before
   *  it: `seasonWrapDue` in engine/world/milestones.ts, derived from `lastSeasonSummary` and the
   *  week, persisting nothing. The number is the season's IDENTITY and the UI keeps it as the
   *  watermark of what it has already shown – a per-snapshot dismiss flag can only gate a per-advance
   *  reason, which is round-16 #19's lesson about the injury popup. */
  seasonWrapPrompt: number | null
  /** every finished season, oldest first (schema v14, R10-9) – the season-by-season table on
   *  Stats. Empty until the first wrap-up. */
  seasonHistory: SeasonHistoryEntry[]
  /** EVERY reason the WEEK-SPENDING command reported, in STOP_PRECEDENCE order; absent when it ran
   *  its full course. R11-1: this replaced a single `stopReason`, which could only ever report one
   *  of the week's true reasons and silently dropped the rest (a fresh injury on the wrap-up week
   *  came back as 'season-end' alone). The UI dispatches off the SET, so an injury and the season
   *  wrap-up are both reachable from one advance.
   *
   *  ⚠ TWO PRODUCERS SINCE THE COLLEGE WAVE, and the noun above changed for it: `advanceWeeks`, and
   *  `resumeFromCollege`, which spends a college YEAR in one command and has to report the
   *  national-team week played inside it ('call-up'). No consumer changes – both hand the same array
   *  through the same `mutate` – but "an advance" was the wrong word for the field as soon as there
   *  was a second one, and a wrong word here is quoted back as a rule three comments away. */
  stopReasons?: StopReason[]
  /** present while a tournament reveal is in progress (drives TournamentFlow) */
  pending?: PendingView
  /** THE EPILOGUE, or null while the story still has a next week (schema v39).
   *
   *  ⚠ THE TAKEOVER GATES ON THIS FIELD AND NEVER ON THE STOP REASON, for exactly the reason
   *  App.vue gives for the knock: a stop reason is a property of the LAST ADVANCE, and permanent
   *  state has to survive any fresh snapshot. Reload an ended career and the album is there again;
   *  the stop reason is long gone. */
  ending: EndingView | null
  /** the debt spell while she is under water, else null – the warning phase before bankruptcy */
  debt: DebtView | null
  /** the fork at nineteen while it is OPEN and unanswered, else null */
  fork: {
    askedWeek: number
    ageYears: number
    /** ⭐⭐ WHAT THE THIRD ANSWER COSTS, so the card can say it (v51). ⚠ THIS IS NOT `collegeOpen`
     *  COMING BACK. That flag decided whether the button was DRAWN; this one decides what the button
     *  SAYS, and there is no value of it that removes an answer – an offer whose every quote is a
     *  walk-on still draws three answers and still lets her enrol, at the full price. The owner's
     *  ruling of 16.08 is about the answer's existence and it is untouched.
     *
     *  ⚠ AND UNLIKE `collegeOpen` IT IS PERSISTED STATE RATHER THAN A SNAPSHOT DERIVATION – it is
     *  copied off `world.fork.offer`, which is why v51 is a schema move and the removal of
     *  `collegeOpen` was not. `null` on a career migrated from v50. */
    offer: CollegeOffer | null
    /* ⚠ `collegeOpen: boolean` WAS HERE (round-17 #6) AND IS REMOVED ON THE OWNER'S RULING OF 16.08:
     *  «Колледж – это независимая ветка карьеры … альтернативная.» The flag existed so the card could
     *  stop drawing an answer `answerFork` would refuse; there is no such refusal any more, so the
     *  third answer is unconditional and the card has nothing to be told. It was derived from
     *  `bestFinishByTier`, never persisted – no save field moved and none moves back. */
  } | null
  /** the natural end's offer while it is OPEN and unanswered, else null */
  retirementOffer: RetirementOffer | null
  /** ⭐⭐ HOW MANY TIMES SHE HAS SAID «one more year» (the long goodbye step 4). On the snapshot
   *  ALWAYS, not only at the end, and that is the change: `EndingView.oneMoreYearCount` has carried
   *  it since the album shipped, but the ending view is null until a career has one – and the
   *  surface that needs it now is the retirement card, which is drawn while the career is still
   *  running. Her last word reads it (`lastWordLine`, engine/ending.ts), and one who has said those
   *  words four times is telling a different story from one who never had to.
   *
   *  ⚠ IT COUNTS BOTH QUESTIONS – the age offer's refusals and the plateau's – which is what the
   *  sentence claims: how often she has said those words, not which reading prompted them.
   *
   *  DERIVED IS THE WRONG WORD AND THE FIELD IS STILL NOT A SCHEMA MOVE: it is copied straight off
   *  the persisted `world.oneMoreYearCount`, which has existed since the album. Nothing new is
   *  stored, so `SAVE_SCHEMA_VERSION` does not move for it. */
  oneMoreYearCount: number
  /** her college years, once she has chosen them – null for every career that did not. ⭐ P5: she may
   *  leave after any of them, so this is a span she is LIVING rather than a four-year block. */
  college: CollegeState | null
  /** career-total money (v39). On the snapshot always, not only at the end: the Money screen's
   *  "since week one" row reads it, and it is what makes the reckoning cheap. */
  careerTotals: CareerTotals
}

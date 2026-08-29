// ⭐ R2-10 STEP 2, PHASE 2 – WHAT THE WEEK COSTS: the family's money, the coach's bill, the
// college's tuition and the kit that wears out.
//
// THE SECOND NAMED PHASE OF THE WEEKLY TICK, and the ONLY one of the five that draws on the MAIN
// stream. Interest on the carried-in balance, the parent's contribution, the coaching/facility bill
// with the receipt it writes, the college's weekly share and the recurring gear line-items – in
// that order, which is the order money has to move in: income before costs, and costs before the
// body reads what it can afford.
//
// ⚠ IT IS A MOVE AND NOT A REWRITE. The body below is `tickWeek`'s steps 0a0 to 1b in their
// original order, comment for comment – step numbers included, because they are the reader's map of
// the week and renumbering them would make every note that cites one wrong. The two private
// helpers' blocks came with them unchanged: the flavour tables the receipt is written from, and the
// five functions themselves.
//
// ⚠ THE MAIN STREAM: EXACTLY WHERE IT WAS. `resolveBaseCosts` spends 3 draws (jitter, flavour,
// sponsor roll) plus a 4th when the roll hits, and it is still the first MAIN draw of the tick and
// still ahead of `driftCohort`'s 4-per-rival. Nothing else in this phase touches MAIN: the interest
// and the college bill are arithmetic, the parent's contribution replays `seed:income:<season>`,
// and every gear line runs on `seed:gear:<category>`. The phase takes `rng` for one function and
// hands it to that one function, so the budget `maxMainDraws` is bounded by is unchanged.
//
// ⚠ `coachWorksThisWeek` LIVES HERE NOW, with the bill that is its first reader – and it is
// re-exported from `engine/world` under its historical name, so the development step, the snapshot
// and the tests all still read the ONE predicate. Moving it was forced rather than chosen: a leaf
// may not import the barrel, so the bill could not have come here without it.
import type { CoachTier, FamilyBackground, KitOfferTerms } from '../../shared/protocol'
import type { Rng } from '../rng'
import type { WorldState } from './state'
import { pickInt, rngFromSeed } from '../rng'
import {
  ECONOMY,
  GEAR_CATEGORIES,
  gearHitForWeek,
  gearVoice,
  parentIncomeForWeekCents,
} from '../economy'
import {
  coachById,
  coachCorridorFactor,
  coachHoursForPlan,
  facilityRateCents,
  tierOf,
  weeklyBillSplit,
} from '../coach'
import { activeKitDeal } from '../offers'
import { GEAR_CATEGORY_LINE } from '../equipment'
import { schoolIsOver } from '../kidLife'
import { addEvent } from './ledger'
import { ageAtWeek } from './age'
import { vacationForWeek } from './bookings'
import { inCollege, resolveCollegeBill } from './college'
import { sponsorNeedMet } from './sponsors'
// ⚠ THE LEAF, NOT `./shop` – `world/assets.ts` is the shelf's pure reads and imports nothing from
// this package, which is what keeps the till free of the shop's command-side dependencies.
import { assetUpkeepCents, deliveredAssets } from './assets'
// The businesses' one arithmetic (round 29 part four P7) – the till charges what these quote, and
// the household meter quotes the same two functions, so the strip and the ledger cannot disagree.
import { academyWeeklyIncomeCents, merchWeeklyIncomeCents } from './business'

// Flavor lists are background-aware but a flavor is always chosen with ONE `pickInt`
// (a single rng() call regardless of list length), so the per-tick draw count is
// identical across backgrounds. middle keeps the original lists verbatim.
const TRAIN_EVENTS = [
  'Coaching block: technique drills',
  'Coaching block: footwork and conditioning',
  'Practice sets at the local club',
  'Sparring with the older kids',
  'Video session: studying her last matches',
]

// ⚠ SAME LENGTH, ONE LINE DIFFERENT (W4-SCHOOL), and the length is load-bearing: `pickInt` spends
// exactly ONE draw whatever the list holds, so swapping a list of the same length is RNG-neutral by
// construction and the frozen MAIN capture cannot notice. A twenty-two-year-old has no school to
// catch up on; what a light week catches up on then is the rest of a life lived in hotels.
const REST_EVENTS = [
  'Light week: school catches up',
  'Family weekend away from the courts',
  'Recovery week: stretching and pool',
  'Hitting for fun, no drills',
  'Off week: she reread her favorite book',
]

// working can't afford video analysis – swap that one line for a public-courts clinic.
const WORKING_TRAIN_EVENTS = TRAIN_EVENTS.map((e) =>
  e === 'Video session: studying her last matches' ? 'Group clinic at the public courts' : e,
)

// wealthy adds premium recovery lines to the rest pool.
const WEALTHY_REST_EVENTS = [...REST_EVENTS, 'Physio session', 'Massage & recovery']

// W4-SCHOOL: the same pools with the one school line swapped, built by `map` so the LENGTH is
// structurally identical to its parent and the single `pickInt` draw stays one draw. Same idiom
// `WORKING_TRAIN_EVENTS` already uses for the background swap, one axis over.
const AFTER_SCHOOL = (e: string): string =>
  e === 'Light week: school catches up' ? 'Light week: the rest of life catches up' : e
const POST_SCHOOL_REST_EVENTS = REST_EVENTS.map(AFTER_SCHOOL)
const POST_SCHOOL_WEALTHY_REST_EVENTS = WEALTHY_REST_EVENTS.map(AFTER_SCHOOL)

function trainFlavors(background: FamilyBackground): string[] {
  return background === 'working' ? WORKING_TRAIN_EVENTS : TRAIN_EVENTS
}

function restFlavors(background: FamilyBackground, schoolOver: boolean): string[] {
  if (background === 'wealthy') return schoolOver ? POST_SCHOOL_WEALTHY_REST_EVENTS : WEALTHY_REST_EVENTS
  return schoolOver ? POST_SCHOOL_REST_EVENTS : REST_EVENTS
}

/** WHERE SHE TRAINS, AND FOR HOW LONG - the facility row's words
 *  (docs/specs/split-the-bill-2026-08.md).
 *
 *  ⚠ A PURE LOOK-UP AND NOT A FLAVOUR DRAW, and that is a constraint rather than a preference: the
 *  weekly bill spends exactly one main-stream `pickInt` and the training row already holds it. A
 *  second story would need a second draw or a sub-stream, and the honest thing for a standing charge
 *  is not a story anyway - a court hire reads the same every week because it IS the same every week.
 *
 *  ⚠ IT NAMES THE CORRIDOR, which is the owner's own argument made visible («с разным тиром для
 *  разного уровня семей»). The price difference between these three venues is already in the bill -
 *  `wealthCorridor` multiplies it - and this is the sentence that says why the numbers differ. The
 *  hours are the other half of "why is it not the quote": rate x hours is the whole line bar jitter.
 *
 *  ⚠ AND SINCE 08.08 IT NAMES THE RUNG'S VENUE TOO, BECAUSE IT HAS TO
 *  (docs/specs/court-follows-the-coach-2026-08.md, owner: «более дорогой тренер = более дорогой
 *  корт»). `courtTierFactor` makes a dearer rung's court dearer in the SAME corridor, and words that
 *  did not move with the number would put two families on one street looking at the same sentence and
 *  different money - which is precisely the unexplained-charge complaint the bill split exists to
 *  remove. So the look-up is 3 corridors x 4 venue steps, ONE STEP PER DISTINCT COURT PRICE: if two
 *  rungs pay the same they read the same, and if they pay differently they say so.
 *
 *  ⚠ `self` AND `budget` SHARE THE CLUB ROW, so the FIRST STRING OF EACH CORRIDOR IS THE ONE THAT
 *  SHIPPED WITH THE SPLIT, verbatim. Those two rungs' court price did not move one cent and their
 *  receipt should not either. The fiction is exact: a club coach uses the club's courts, which are the
 *  same courts the parent books for herself.
 *
 *  The ladders OVERLAP between corridors on purpose - a working family's best venue is a middle
 *  family's ordinary one - which is what a real market looks like from inside it. */
const FACILITY_VENUE: Record<FamilyBackground, [string, string, string, string]> = {
  working: ['Club courts', 'Indoor courts', 'Academy courts', 'Performance centre'],
  middle: ['Court hire', 'Academy courts', 'Performance centre', 'Show courts'],
  wealthy: ['Academy courts', 'Performance centre', 'Show courts', 'Centre court'],
}

/** WHEN THE HOURS WERE BOOKED - the clause that stops the most-read line in the game from being one
 *  string for a whole career (R15-17, owner 09.08).
 *
 *  ⚠ THE DEFECT WAS THE OTHER HALF OF THE LOOK-UP'S OWN VIRTUE. `FACILITY_VENUE[background][step]`
 *  plus the plan's hours is a pure look-up, and for a SELF-COACHED family at a fixed background both
 *  inputs are constant - so "Club courts – 5 h" was byte-identical on all 208 weeks of a career, on
 *  the line the WeekRecapCard scrap shows them (a self-coached family books no coach row at all, so
 *  the court row IS their handwritten scrap). A charge that never varies its words stops being read.
 *
 *  ⚠ IT IS STILL A RECEIPT AND NOT A STORY, which is the constraint the venue look-up was written
 *  under and the reason none of these clauses says what she DID. Every one of them is a fact about a
 *  BOOKING - which slots, at what rate - so the line cannot describe a week that did not happen: an
 *  injured week, a blacked-out exam fortnight and a full training week all book the same court, and
 *  the family is charged for all three. What she did with the hours is the training row's job.
 *
 *  ⚠ TWO OF THE THREE BANDS ARE READ OFF THE WEEK'S REAL PRICE, and that is the half worth having.
 *  `jitter` is the ONE main-stream `pickInt` `resolveBaseCosts` already draws, and it multiplies the
 *  facility line along with everything else - so a dear week really did cost more than a cheap one,
 *  and the row now says why instead of leaving an unexplained wobble under an unchanging sentence.
 *  The fiction is the one this repo already recorded for that draw in tests/split-the-bill.test.ts
 *  ("a session moved, a court at a busier hour"); this is that sentence made visible. Strictly, the
 *  jitter moves the coach line too, but it is attributed here because the court is the thing with
 *  peak hours, and the court's own share genuinely moved by exactly this factor.
 *
 *  ⚠ THE MIDDLE BAND IS THE ONLY PLACE A DRAW HAPPENS, and it is a PURPOSE-SCOPED SUB-STREAM
 *  (`seed:court:<week>`), never MAIN - invariant 2, and the same discipline `coachCorridorFactor`
 *  uses two lines above on `seed:coachbg:<week>`. Zero new main-stream draws, so the frozen capture
 *  (41550 / e6b0c709) cannot see this and input-independence is untouched: the key holds the seed and
 *  the week and nothing a player decides.
 *
 *  ⚠ AND SCHOOL DECIDES WHICH ORDINARY POOL, because "after school" stops being true. A twenty-two
 *  year old on tour has no school to come from, exactly as `restFlavors` already knows one line over.
 *
 *  ⚠ EVERY CLAUSE IS 14 CHARACTERS OR FEWER, and that is a measurement rather than taste. The scrap
 *  under the recap painting sets a ledger fragment at 23px in a ~300px column; the longest head this
 *  can produce is "Performance centre – 5 h" at 24, and the training flavours it shares that paper
 *  with already run to 40 ("Coaching block: footwork and conditioning"). A short clause keeps the
 *  worst case at the length the scrap is already proven to hold and off the third line the
 *  `--travel` rule in WeekRecapCard.vue exists to prevent. */
const COURT_WHEN_DEAR = ['peak slots', 'peak rate', 'prime time', 'the busy hours']
const COURT_WHEN_CHEAP = ['off-peak', 'quiet hours', 'early slots', 'off-peak rate']
const COURT_WHEN_SCHOOL = ['after school', 'evenings', 'the usual slot', 'weekday hours']
const COURT_WHEN_FREE = ['daytime slots', 'mornings', 'the usual slot', 'midweek']

function facilityFlavor(input: {
  background: FamilyBackground
  tier: CoachTier
  hours: number
  /** the career seed - the sub-stream is derived from it and persists nothing */
  seed: string
  week: number
  /** the week's own jitter as a multiplier, exactly as `weeklyBillSplit` was handed it */
  jitter: number
  /** has she finished school - `restFlavors`' own question, one line over */
  schoolOver: boolean
}): string {
  const { background, tier, hours, seed, week, jitter, schoolOver } = input
  const step = tier === 'elite' ? 3 : tier === 'high' ? 2 : tier === 'middle' ? 1 : 0
  const venue = FACILITY_VENUE[background][step]
  // Whole hours at the three plan presets (4 / 5 / 6); one decimal only when a custom split lands
  // between them, so the common case reads as a clean number.
  const shown = Math.round(hours * 10) / 10
  // Where this week's price sits in its own band, 0 = the cheapest week the jitter can produce and
  // 1 = the dearest. Read off ECONOMY rather than hard-coded, so re-tuning the band re-tunes the
  // words with it and a widened jitter cannot leave every week reading "the usual slot".
  const [jLo, jHi] = ECONOMY.coach.weekJitterBps
  const at = (jHi - jLo > 0 ? (jitter * 10_000 - jLo) / (jHi - jLo) : 0.5)
  const pool =
    at >= 2 / 3 ? COURT_WHEN_DEAR : at <= 1 / 3 ? COURT_WHEN_CHEAP : schoolOver ? COURT_WHEN_FREE : COURT_WHEN_SCHOOL
  const clause = pool[Math.floor(rngFromSeed(`${seed}:court:${week}`)() * pool.length) % pool.length]
  // ⚠ THE HEAD IS BYTE-IDENTICAL TO WHAT SHIPPED WITH THE SPLIT, and the clause is a suffix after a
  // comma rather than a rewording. tests/split-the-bill.test.ts pins all nine corridor x rung cells
  // against that head, and the rule it protects - one venue step per distinct court price, so two
  // rungs that pay the same read the same - is a claim about the HEAD alone. The clause is a
  // property of the week; letting it into that comparison would have made the pin about the dice.
  return `${venue} – ${shown} h, ${clause}`
}

// --- weekly resolution pieces ------------------------------------------------
//
// ⭐⭐⭐ R9-1's SAVINGS INTEREST STOOD HERE, AND ROUND 29 #12 REMOVED IT.
//
// THE OWNER, 28.08: «И я предлагал убрать авто начисление % на текущий счёт.» A RULING – it settles
// round 28 #9, which had been filed as an ask.
//
// WHAT IT WAS: `round(fundsCents x ECONOMY.savings.apyWeekly)` credited on the CARRIED-IN balance at
// the top of every tick, ~3.1%/yr, zero RNG, emitted as an `income` row under the category
// 'interest'. It was silent, automatic, and it grew with the balance – which is exactly why it had to
// go: a current account that pays a wage means the richest careers get richer for doing nothing, and
// a parent who has banked a million earns more from the balance than from the job.
//
// ⚠ WHAT REPLACES IT IS ALREADY ON THE SHELF, and that is what makes this a design and not a
// subtraction. Money now earns where the family DECIDES to put it – `ECONOMY.shop.catalogue`'s
// deposit (+2%/season) and index fund (+7%/season) – and round 29 #11 gave both of them top-ups in
// the same wave, so moving the balance into them is a thing a player can actually keep doing. The
// wallet is a wallet; yield is a choice.
//
// ⚠⚠ AND THE CATEGORY 'interest' SURVIVES ON PURPOSE. Every save already written carries `interest`
// rows in `events` and in `financeWeeks.byCategory`, and `WorldEventCategory` is how a screen knows
// what they were. Deleting the category to tidy up would leave a career's own history unrenderable –
// see `shared/protocol/events.ts`, where the category is now marked historical rather than removed.
//
// ⚠ ZERO DRAWS THEN, ZERO DRAWS NOW. It never touched the MAIN stream, so removing it moves no
// sequence: the frozen capture (41550 / e6b0c709) and the input-independence freezes are untouched
// by construction – `releaseOutgrownEntries`' own note, four lines down, on the identical situation.

// The parent's weekly contribution to the budget. Runs BEFORE costs and draws no MAIN-stream RNG:
// the per-season growth (round 12, +5-10% compounding each new season) replays from the private
// `seed:income:<season>` sub-stream inside parentIncomeForWeekCents, so the amount is a pure
// function of (seed, background, week) - nothing stored, nothing to migrate.
function resolveParentIncome(world: WorldState): void {
  const income = parentIncomeForWeekCents(world.seed, world.profile.background, world.week)
  world.fundsCents += income
  addEvent(world, {
    week: world.week,
    type: 'income',
    category: 'income',
    text: "Parents' contribution",
    amountCents: income,
  })
}


/** Is the coach on the clock this week? Pure, zero draws, and the ONE place the rule lives: the bill and
 *  the development step both ask it, so they can never disagree about whether he was there.
 *
 *  ⚠ A BOOKED FAMILY WEEK IS NOT A COACHING WEEK (owner, 30.07). It used to be: a vacation is not a
 *  COMPETITION week, so this returned true and an elite coach billed $909 for the week the diary describes
 *  as «A week away as a family. Nobody mentioned rankings once.» - measured, on seed bill-probe W8. The
 *  family is at the seaside; he is not there, he is not owed, and `growWeek` should not be developing her
 *  at his rate either. One clause fixes the bill and the development together, which is the whole reason
 *  they read the same predicate.
 *
 *  ⚠ THE LAYOFF STAYS A COACHING WEEK, and that is the owner's call rather than an oversight: «это ок, они
 *  вполне могут вместе восстанавливаться». She is at home doing rehab and he is part of it.
 *
 *  ⚠ AND SO DOES THE EXAM FORTNIGHT - «на тренировку можно доехать». She is home, blacked out from
 *  tournaments, not from training. What was wrong on those weeks was the COPY, not the money: the notes
 *  claimed the racquet never left the hall while $933 of coaching was billed. Fixed in engine/diary.ts.
 *
 *  ⚠⚠ AND A COMPETITION WEEK IS A COACHING WEEK AGAIN (owner, 08.08). This is a REVERSAL of the R4
 *  rule that used to live on the last line, and the owner's correction is that R4 ran two different
 *  questions together:
 *
 *      «я не отрицаю, мы общались про поездки тренера с игроком... а сейчас я говорю про еженедельное
 *       списание тренерских сумм на неделях турниров - тренер продолжает работать там и давать прогресс»
 *
 *  The two are:
 *    * DOES HE TRAVEL WITH HER - the 29.07 conversation, and the model he does not dispute. That is
 *      `coachOnEventWeeks`, which is still a persisted stance and still the (locked) row on screen T.
 *    * IS THE WEEKLY RETAINER CHARGED WHILE SHE IS AWAY - and it is, because a retainer does not stop
 *      being a retainer because she is at an event. He keeps working and she keeps progressing.
 *  R4 implemented the first question's toggle over the second question's arithmetic, so a girl playing
 *  a full adult calendar had her coach stood down for 43% of her season (measured on the owner's own
 *  save, weeks 196-255: 34 weeks billed, 26 not) while the market screen quoted her a rung computed as
 *  if he came every week. The retainer is therefore unconditional here, and `coachOnEventWeeks` is no
 *  longer read by this predicate at all - it means travel, and only travel, until the travel mechanic
 *  is built. Priced in docs/specs/coach-retainer-2026-08.md.
 *
 *  ⚠ THE TWO EXEMPTIONS THAT SURVIVE ARE THE TWO THE OWNER RULED ON, and neither is a competition
 *  week: college (the family stops paying) and a booked family holiday (he is not at the seaside). */
export function coachWorksThisWeek(world: WorldState): boolean {
  // ⚠ AND FOUR YEARS AT COLLEGE ARE NOT COACHING WEEKS EITHER (W2-ENDINGS, §5.1: «the family stops
  // paying»). The scholarship is the whole economic point of that fork - it is the only place in
  // the game where the money goes the other way - so the family cannot still be billed for a coach
  // she is not training with. One clause moves the bill AND the development rate together, which is
  // the reason both of them read this predicate and not a copy of it.
  if (inCollege(world)) return false
  if (vacationForWeek(world, world.week) !== undefined) return false
  return true
}

/** ⭐⭐ ROUND 29 PART FOUR P7 – WHAT THE PARENT'S BUSINESSES BRING IN THIS WEEK: the merch brand
 *  (follows FAME – world/fame.ts) and the academy's stages (follow REPUTATION – seasons in band).
 *
 *  ⚠ INCOME BEFORE COSTS – this phase's own stated order, which is why it sits beside the parents'
 *  contribution rather than somewhere clever. ⚠ ONE ROW PER BUSINESS AND NEVER PER STAGE: the
 *  academy's line is one number a week (the Nadal accounts are the flavour of the sentence, not
 *  four lines), and a week that earns nothing books nothing – a $0 income row every week of a
 *  junior career would be noise, and unlike the coach's stood-down $0 there is no standing
 *  relationship to explain: a family with no business simply has no line.
 *
 *  ⚠ INCOME ONLY, NEVER NEGATIVE («мы ни за что не наказываем») – both functions are bounded at
 *  zero by construction, and the shelf's upkeep (where a rung has one) stays its own separate
 *  expense line: round 29 #10's lesson, never net two facts silently.
 *
 *  ⚠ ZERO DRAWS ON ANY STREAM. Arithmetic on persisted records (world/business.ts), so the MAIN
 *  sequence is byte-identical for every career that owns neither – which is every career that
 *  never bought them, the frozen three included – and the frozen capture (41550 / e6b0c709)
 *  cannot see it. Nothing here is a die, so the input-independence law is not engaged. */
function resolveBusinessIncome(world: WorldState): void {
  const merch = merchWeeklyIncomeCents(world)
  if (merch > 0) {
    world.fundsCents += merch
    addEvent(world, {
      week: world.week,
      type: 'income',
      category: 'business',
      text: 'Merch – her name on the shelves',
      amountCents: merch,
    })
  }
  const academy = academyWeeklyIncomeCents(world)
  if (academy > 0) {
    world.fundsCents += academy
    addEvent(world, {
      week: world.week,
      type: 'income',
      category: 'business',
      // The Nadal shape as flavour (endorsement-tiers-and-academy-money.md §3a): the campus is the
      // business – programmes, beds, its own sponsors – and ONE number reaches the ledger.
      text: 'The academy – programmes, lodging and its own sponsors',
      amountCents: academy,
    })
  }
}

function resolveBaseCosts(world: WorldState, rng: Rng): void {
  // THE COACHING BILL = his rate x hours x the market she trains in x this week's jitter
  // (docs/specs/coach-tiers.md; the model is engine/coach.ts).
  //
  // ONE MAIN-STREAM DRAW, IN THE SAME POSITION IT ALWAYS HELD. The old bill drew a band with one
  // `pickInt` here and multiplied by the plan factor and a corridor roll. The new one draws the
  // WEEK'S JITTER with one `pickInt` here and multiplies by the coach's own rate, the hours the
  // plan buys and the corridor roll. Same draw, same slot, and the frozen MAIN capture (41550
  // draws / e6b0c709) cannot see the difference - which is the whole reason the jitter is what
  // gets drawn and everything with a decision behind it is what gets multiplied.
  //
  // ⚠ THE WEALTH CORRIDOR IS BACK ON THIS LINE (Round 2), on the SAME private
  // `seed:coachbg:<week>` sub-stream it always used. I had taken it off arguing the tier already
  // said "poorer families buy cheaper coaches"; the owner's model is better and is a different
  // claim - the corridor is THE MARKET SHE TRAINS IN, so the same rung costs different money in a
  // working-class club, an ordinary academy and a premium one, and the wealthy family pays MORE for
  // the same coach. POST-draw multiply, so the main-stream sequence still cannot depend on
  // background (the invariance test in economy.test.ts holds it to that).
  const age = ageAtWeek(world.week)
  const coach = coachById(world.seed, age, world.coachId)
  const tier = tierOf(coach)
  const rate = coach ? coach.rateCents : facilityRateCents(age, tier)
  const [jLo, jHi] = ECONOMY.coach.weekJitterBps
  const jitter = pickInt(rng, jLo, jHi) / 10_000
  const corridor = coachCorridorFactor(world.seed, world.week, world.profile.background)
  // ⚠ THE RETAINER RUNS ON A COMPETITION WEEK (owner, 08.08) - a REVERSAL of R4, whose argument used
  // to sit here. «сейчас я говорю про еженедельное списание тренерских сумм на неделях турниров -
  // тренер продолжает работать там и давать прогресс». A weekly retainer does not stop being owed
  // because she is away at an event, and he does not stop working: the tournament week is where the
  // scouting, the warm-ups and the between-match work happen. The full argument, and what R4 ran
  // together, is on `coachWorksThisWeek`.
  //
  // THE DRAWS HAPPEN EITHER WAY, and that has not changed. Both pickInts above and below run on
  // every week whatever this resolves to, and only the ARITHMETIC after them changes - the same
  // discipline the sponsor cameo uses when it discards a gift for an ineligible background. The
  // frozen MAIN capture cannot see whether the coach was billed.
  const works = coachWorksThisWeek(world)
  // ⚠ TWO LINES, ONE TOTAL (docs/specs/split-the-bill-2026-08.md, owner 08.08: «нам нужно отдельной
  // строчкой списывать тренера, а отдельной рент залов и прочего»). `split.totalCents` is the SAME
  // expression this line has always charged - `weeklyBillSplit` runs it and then partitions it - so
  // the wallet, the bench and every survival number are untouched by construction. What the family
  // gains is that it can see which half is the man and which half is the court.
  const split = weeklyBillSplit({
    rateCents: rate,
    ageYears: age,
    tier,
    plan: world.plan,
    background: world.profile.background,
    corridor,
    jitter,
  })
  const expense = works ? split.totalCents : 0
  world.fundsCents -= expense
  const schoolOver = schoolIsOver(world.week, world.profile.birthMonth)
  const flavors =
    world.plan.train >= 70
      ? trainFlavors(world.profile.background)
      : restFlavors(world.profile.background, schoolOver)
  // ⚠ STILL EXACTLY TWO MAIN-STREAM DRAWS IN THIS FUNCTION, and neither the split nor R15-17 added a
  // third. The facility row's VENUE is a pure look-up off the corridor, and the week-to-week clause
  // that R15-17 gave it comes off the private `seed:court:<week>` sub-stream and off the jitter this
  // function has already drawn - never a `pickInt` of its own. See facilityFlavor for why that is a
  // constraint rather than a preference. The frozen MAIN capture cannot see the second line.
  const flavor = flavors[pickInt(rng, 0, flavors.length - 1)]
  // The $0 line is still EMITTED, the way a sponsor-covered gear item is: the Money breakdown should
  // show why a coaching week cost nothing, not silently drop the row.
  //
  // ⚠ AND IT NAMES THE RIGHT REASON NOW. It used to say "Competition week - no coaching billed" for
  // every unbilled week, which was the only reason it could be until 08.08 and is now never the
  // reason at all. The two survivors are the two the owner ruled on, and they are different stories.
  //
  // ⚠ THE STOOD-DOWN WEEK STAYS ONE ROW, DELIBERATELY. Nothing is billed - not the coach and not the
  // court - so splitting zero into two zeroes would double the noise in the feed to say the same
  // thing twice. It keeps the `coaching` category because that is the story the text tells and
  // because a v43 save's history reads the same way.
  if (!works) {
    addEvent(world, {
      week: world.week,
      type: 'expense',
      category: 'coaching',
      text: inCollege(world)
        ? 'At college – the programme coaches her, not us'
        : 'A week away as a family – no coaching billed',
      amountCents: 0,
    })
  } else {
    // ⚠ THE COACH GOES FIRST, AND THE ORDER IS LOAD-BEARING RATHER THAN TIDY. `WeekRecapCard`'s
    // handwritten scrap is `weekEvents.find(e => e.type === 'expense').text` - the week's FIRST
    // expense - so emitting the court above the coach would have replaced every hired family's
    // training flavour ("Coaching block: technique drills") with a court receipt on roughly two
    // ordinary weeks in three, which is the one object on the Weekly Story that carries the week's
    // texture. Coach first keeps that byte-identical, and it reads the way the Money screen's rows
    // are ordered: the man, then the place.
    //
    // ⚠ A SELF-COACHED FAMILY BOOKS NO COACH LINE AT ALL - the sharpest thing the split fixes. The
    // parent works free, so `split.coachCents` is 0 by arithmetic and a row for it would be the same
    // lie in a smaller font. A hired rung always has one: `coachRateBandCents` gives no rung a band
    // that reaches down to the court's price (asserted in tests/split-the-bill.test.ts).
    //
    // ⚠ SO THEIR SCRAP BECOMES THE COURT LINE, and that is a fix rather than a loss. It used to read
    // "Coaching block: technique drills" to a family with no coach - the same category error the
    // owner reported, in the game's most-read sentence - and "Club courts – 5 h, after school" is a
    // true receipt in exactly the genre that scrap is written in. The prose `weekNote` still lands on
    // one week in three either way.
    //
    // ⚠ AND IT IS THE REASON R15-17 EXISTS. Being the scrap is exactly what made an unvarying string
    // expensive: this family reads that one line every week for 208 weeks, and until this wave it was
    // the same eighteen characters every time. See `facilityFlavor` for what varies and what may not.
    if (split.coachCents > 0) {
      addEvent(world, {
        week: world.week,
        type: 'expense',
        category: 'coaching',
        text: flavor,
        amountCents: -split.coachCents,
      })
    }
    addEvent(world, {
      week: world.week,
      type: 'expense',
      category: 'facility',
      text: facilityFlavor({
        background: world.profile.background,
        tier,
        hours: coachHoursForPlan(world.plan),
        seed: world.seed,
        week: world.week,
        jitter,
        schoolOver,
      }),
      amountCents: -split.facilityCents,
    })
  }
  // Local-sponsor cameo: the ROLL (and the gift draw when it hits) run for EVERY family so the
  // main-stream draw count cannot depend on who she is (round-7 keeps the draws exactly as they
  // were). The payout is NEED-BASED: only a family the gate says is short actually banks it; for
  // everyone else the drawn result is discarded – no funds move, no event.
  //
  // ⚠ THE GATE READS THE BALANCE NOW, NOT THE PROFILE ROW (10.08, the owner: «порог по деньгам на
  // счету, а не по строчке в анкете»). `ECONOMY.sponsor.eligible` is gone and `sponsorNeedMet` has
  // taken its place: fewer than `runwayWeeks` weeks of her COURT left in the account, and no coach
  // dearer than `maxCoachTier`. Everything about WHY it is a runway, why the court rather than the
  // whole bill, and why the cut is on the rung is written above `sponsorNeedMet` in world/sponsors.ts;
  // the numbers are on `ECONOMY.sponsor`; the measurement is docs/specs/need-not-background-2026-08.md.
  //
  // ⚠ AND THE DRAW SHAPE IS UNTOUCHED BY IT, WHICH IS THE CONSTRAINT THE WHOLE CHANGE HAD TO FIT
  // INSIDE. The roll is still one `rng()` and the gift is still one `pickInt` taken whenever that
  // roll hits, for EVERY family, before anything is asked about her – so the per-week MAIN count is
  // still 3 or 4 base-cost draws exactly as `tests/condition.test.ts` and `tests/rivals.test.ts` pin
  // it, and the frozen capture (41550 / e6b0c709) cannot see this wave. The gate is post-draw
  // arithmetic on `split`, which was computed above off draws that had already happened.
  if (rng() < ECONOMY.sponsor.rollChance) {
    const [glo, ghi] = ECONOMY.sponsor.amountCents
    const gift = pickInt(rng, glo, ghi)
    // ⚠ AND AN AMATEUR ON A SCHOLARSHIP TAKES NO SPONSOR MONEY (W2-ENDINGS). Same post-draw
    // discipline as the need clause it rides on: the roll and the gift draw BOTH still happen,
    // and only the payout is discarded, so the MAIN sequence cannot depend on a player's answer at
    // the fork. That is invariant 2 - player choices may never re-roll the world's dice.
    if (
      !inCollege(world) &&
      sponsorNeedMet({ fundsCents: world.fundsCents, courtCents: split.facilityCents, tier })
    ) {
      world.fundsCents += gift
      addEvent(world, {
        week: world.week,
        type: 'income',
        category: 'sponsor',
        text: 'A local sponsor chipped in!',
        amountCents: gift,
      })
    }
  }
}

// Recurring gear line-items (round-7 a). Scheduled DETERMINISTICALLY off per-category
// purpose-scoped sub-streams – NEVER the main weekly `rng` – so they add zero main-stream
// draws and cohort drift / the RNG replay stay untouched.
//
// ⚠ THE PRODUCT-SPONSORSHIP VALVE HAS LEFT THIS FUNCTION (30.07, tune/rank-numbers). It used to
// read `world.kidRank` here, at purchase time, and halve or zero the line. Both the table it read
// and the shape of the subsidy were wrong – the whole argument is on `ECONOMY.sponsorship`, which
// is now an annual grant gated on her NATIONAL rank (see reviewLocalSponsor). The gear line is a
// gear line again: the family pays for its kit, and the sponsor's contribution arrives once a year
// as money, where it can actually be seen.
//
// ⚠ ...AND A SIGNED KIT DEAL SENDS SOME OF THESE BILLS TO THE SHOP (v32). This is the sponsorship
// arriving as PRODUCT, which is what the sources say a junior deal actually is, and it is a
// deliberately different animal from the percentage valve that was removed on 30.07:
//   * it is capped by a PER-SEASON allowance, which ECONOMY.sponsorship's own argument identifies as
//     the only shape of subsidy that can be flat. The wealth corridor can raise the BILL but not the
//     ceiling, so a rich family cannot extract more of it by buying a more expensive racket;
//   * it covers the three lines the equipment model reads - racquets, strings, shoes - and not
//     apparel, because it is a kit deal and not a clothing allowance;
//   * the line is still EMITTED, at the amount the family actually paid ($0 when the shop took the
//     whole of it), so the Money breakdown shows the relationship instead of a cost quietly
//     vanishing. Exactly `chargeTravel`'s pattern with the academy's cover, and the $0-line handling
//     the finance aggregate already has (it never stores a zero-valued category entry).
// ⚠ `GEAR_CATEGORY_LINE` - the one place the equipment model's vocabulary (`KitLine`) is mapped onto
// the ledger's (`GearCategory`) - MOVED DOWN to engine/equipment.ts (W3-KIT) and is imported back
// here. It had to: the quality ladder prices a LINE (`kitLinePriceCents`) and that price is read by
// the snapshot and by the till, both of which sit below world.ts. Same map, same values, one owner.

function resolveGear(world: WorldState): void {
  const bg = world.profile.background
  const deal = activeKitDeal(world.offers, world.week)
  const terms = deal ? (deal.terms as KitOfferTerms) : null
  for (const category of GEAR_CATEGORIES) {
    const hit = gearHitForWeek(world.seed, category, bg, world.week)
    if (!hit) continue
    const line = ECONOMY.gear[category]
    const kitLine = GEAR_CATEGORY_LINE[category]
    // ⚠ AND THE RUNG PRICES THE BILL (W3-KIT). The draw is untouched - `gearHitForWeek` still walks
    // `seed:gear:<category>` exactly as it always did and returns exactly the same cents - and the
    // rung MULTIPLIES what comes out of it. So the wealth corridor still sets the base (a wealthy
    // family's frames were always dearer) and the choice multiplies it, which is the shape
    // ECONOMY.gear already had. Apparel has no line and no ladder, so it is charged as it always was.
    //
    // The consequence is the one that makes this a decision rather than a slider: `pro` frames cost
    // four times as much EVERY TIME the cadence comes round, so the choice is a standing commitment
    // to a bigger recurring bill, not a one-off purchase.
    const gradeFactor =
      kitLine && world.kit ? ECONOMY.equipment.grades[world.kit.grade[kitLine]].priceFactor : 1
    const amountCents = Math.round(hit.amountCents * gradeFactor)
    // What the brand picks up of this line: everything, up to whatever is left of the allowance -
    // and ONLY if the deal actually covers this line. That is the brand ladder arriving at the till:
    // a local deal pays her restringing and leaves the racket on the family, a national one adds the
    // frame, and only the top rung pays for everything.
    //
    // ⚠ AND THE ALLOWANCE IS A CEILING IN CENTS, WHICH IS WHY THE TWO SYSTEMS COMPOSE INSTEAD OF
    // FIGHTING. Buying up does not buy MORE sponsorship - the same $1,000 season allowance now covers
    // fewer, dearer items - so a player who signs a kit deal and then moves every line to `pro` finds
    // the brand running out in the spring and the family paying the rest. That is the honest trade
    // and it needed no new rule: `Math.min(amount, remaining)` was always doing it.
    const remaining = deal && terms ? Math.max(0, terms.kitAllowanceCents - (deal.coveredCents ?? 0)) : 0
    const inDeal = !!terms && !!kitLine && terms.covers.includes(kitLine)
    const covered = deal && terms && inDeal ? Math.min(amountCents, remaining) : 0
    const paid = amountCents - covered
    if (deal && covered > 0) deal.coveredCents = (deal.coveredCents ?? 0) + covered
    world.fundsCents -= paid
    addEvent(world, {
      week: world.week,
      type: 'expense',
      category: line.breakdown,
      // ⭐ ROUND-17 #17: the sentence is written from the shop she is actually in, not from the
      // questionnaire she filled in at week 0 – see `gearVoice`. Copy only; `bg` above still keys
      // every draw and every price.
      text: (() => {
        const flavor = line.flavor[gearVoice(bg, inDeal)]
        return covered > 0 ? `${flavor} – on ${terms!.brand}` : flavor
      })(),
      amountCents: -paid,
    })
  }
}

/** ⭐⭐ ROUND 29 #5, docs/specs/the-shop-2026-08.md §3f – WHAT THE SHELF COSTS TO KEEP THIS WEEK.
 *
 *  THE OWNER: «тоже можно разные тиры сделать, кстати и потерю стоимости в год + годовое
 *  обслуживание (недельный кост, ага)».
 *
 *  ⚠⚠ IT IS A WEEKLY BILL, EXACTLY LIKE THE COACH'S, AND THAT IS THE WHOLE DESIGN (§3f): «the toys
 *  compete with the team for the same money. A yacht crew and a masseur come out of one wallet, and
 *  that is a real decision rather than a trophy.» So it is charged HERE, in the phase that charges
 *  the coach, the court, the tuition and the kit, and not somewhere clever.
 *
 *  ⚠ ONE ROW PER THING, AND NOT ONE ROLLED-UP LINE. The masseur has a row, the coach has a row, and
 *  a family that owns a boat and a plane is paying two crews – a single «Upkeep $81,538» line would
 *  be a figure with no object attached, which is the shape round 23 #16 named as «you paid and you
 *  could not tell». `category: 'shop'` so it lands in the breakdown bucket the shelf already owns.
 *
 *  ⚠ DELIVERED ONLY – `weeklyAssetUpkeepCents`' own rule, and the reason a commissioned order cannot
 *  strand a family: while it cannot be sold it costs nothing.
 *
 *  ⚠ ZERO DRAWS ON ANY STREAM. It is arithmetic on the catalogue and on what the family paid, so the
 *  MAIN sequence is byte-identical for every career that owns nothing with an upkeep – which is
 *  every career that has not commissioned one – and the frozen capture (41550 / e6b0c709) cannot see
 *  it. Nothing here is a die, so the input-independence law is not engaged. */
function resolveAssetUpkeep(world: WorldState): void {
  for (const { owned, item } of deliveredAssets(world)) {
    const amountCents = assetUpkeepCents(item, owned.paidCents)
    if (amountCents <= 0) continue
    world.fundsCents -= amountCents
    addEvent(world, {
      week: world.week,
      type: 'expense',
      category: 'shop',
      // Crew, berth, fuel, survey, insurance – §3f's own list, said once in the catalogue's note and
      // not repeated on every row. The row names the THING, which is what the player is deciding
      // about when he reads it beside the masseur.
      text: `Upkeep: ${item.label}`,
      amountCents: -amountCents,
    })
  }
}

/** ⭐ PHASE 2 OF THE WEEKLY TICK – what the week costs.
 *
 *  Called from `tickWeek` immediately after the season boundary and before anything reads her
 *  body. `rng` is the MAIN stream and reaches exactly one function, `resolveBaseCosts`; see the
 *  header for the draw budget that fact is what keeps stable. */
export function weeklyFinance(world: WorldState, rng: Rng): void {
  // 0a0. RETIRED 28.08 by round 29 #12 – `resolveInterest` stood here and paid a weekly wage on the
  //      current account. The owner's ruling and what replaces it are written out where the function
  //      used to live. It drew nothing, so removing it moves no stream.

  // 0a. RETIRED 05.08 – `releaseOutgrownEntries` stood here. An entry already taken is honoured;
  //     see the note where the function used to live. It drew nothing, so removing it moves no
  //     stream: the frozen MAIN capture (41550 / e6b0c709) and the B1/C1 invariance freezes are
  //     untouched by construction.

  // 0. parent's weekly contribution BEFORE costs (no RNG draw)
  resolveParentIncome(world)

  // 0-bis. ⭐⭐ ROUND 29 PART FOUR P7 – the businesses' week: merch (fame) and the academy's stages
  //     (reputation). Income before costs, beside the parents' line it is the same kind of thing
  //     as. ZERO DRAWS on any stream – see resolveBusinessIncome.
  resolveBusinessIncome(world)

  // 1. base costs (main stream, plan-independent draw count)
  resolveBaseCosts(world, rng)

  // 1a. ⭐⭐ THE COLLEGE BILL (v51, docs/specs/what-the-college-place-costs-2026-08.md). The four years
  //     used to be free by construction – `coachWorksThisWeek` returns false at college, gear is
  //     skipped, and the family's whole outgoing stopped. It never had a tuition line to stop.
  //     Now it does: the award pays a share of the year and this is the rest of it, weekly.
  //
  //     ⚠ ZERO DRAWS ON ANY STREAM, which is why it can sit here at all. It is arithmetic on the
  //     offer persisted at the fork, so the MAIN sequence is byte-identical for every career that
  //     did not go to college and for every week before the fork – the frozen capture (41550 /
  //     e6b0c709) is untouched by construction, and the input-independence law is not engaged
  //     because nothing here is a die.
  resolveCollegeBill(world)

  // 1a-bis. ⭐⭐ ROUND 29 #5 – WHAT THE SHELF COSTS TO KEEP (the-shop §3f). It sits between the
  //     college's bill and the gear because it is the same KIND of thing as both: a standing weekly
  //     cost the family signed up for, charged whether anybody looks at it or not. ⚠ AND IT IS NOT
  //     GATED ON COLLEGE, unlike the gear one line below: her kit is the university's for four
  //     years, but a yacht's crew is paid by the people who own the yacht, and the shop is the
  //     PARENT's (§1). `buyAsset`'s own guard is `guardNotEndedForGood` for exactly this reason –
  //     the college years are shoppable. ZERO DRAWS.
  resolveAssetUpkeep(world)

  // 1b. recurring gear line-items (round-7 a). Zero main-stream draws – purpose-scoped
  //     sub-streams only – so this never perturbs the weekly draw count.
  // ⚠ AND NOT WHILE SHE IS AT COLLEGE (W2-ENDINGS). Her kit is the university's for four years, so
  //   the family stops buying frames and stringing too. Free of the invariant this file guards
  //   everywhere else: every gear line runs on a `seed:gear:<category>` sub-stream, so skipping the
  //   purchase costs the MAIN sequence nothing at all.
  if (!inCollege(world)) resolveGear(world)
}

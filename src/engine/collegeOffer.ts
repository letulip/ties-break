// ⭐⭐ WHAT THE COLLEGE ANSWER ACTUALLY OFFERS – a place, a share of the bill, and the rest of the
// bill (16.08.2026, docs/specs/what-the-college-place-costs-2026-08.md).
//
// BEFORE THIS FILE the third answer at the fork was offered unconditionally and FREE, in 100% of
// careers, and the four years cost the family nothing at all. P6 decomposed the college arm banking
// $152,243 against the tour's $45,544 as **100% avoided spend, scholarship $0** – which is a full
// ride at a free institution, and `docs/research/college-and-the-junior-exit.md` §1d says neither
// half is a model of the thing:
//
//   * A year costs **$30,990** in-state, **$50,920** out-of-state, **$65,470** at a private
//     nonprofit `[S]` (College Board, Trends in College Pricing and Student Aid 2025, Figure CP-1).
//   * The NCAA's own words: *"Most scholarships are partial, but student-athletes can combine them
//     with academic awards, NCAA-funded aid programs, and need-based assistance like Federal Pell
//     Grants"* `[S]`.
//   * ~715 D-I places open per incoming class worldwide `[I]` against a junior population in the
//     thousands. **A place is something somebody has to offer her.**
//
// ⚠⚠ AND THE ONE THING THAT DID NOT CHANGE: NOTHING HERE CAN REMOVE THE THIRD ANSWER BECAUSE OF A
// RESULT. That is the owner's ruling of 16.08 («Колледж – это независимая ветка карьеры…»), it is
// not up for revision, and this file is built so it cannot be violated by accident:
//
//   * The recruit view carries **no professional rank, no professional finish and no prize money**.
//     There is nothing in `CollegeRecruitView` a tour result can move. A rule that closed the door
//     from the other side – "she is too good for college now" – is unrepresentable here, which is
//     stronger than a rule that merely does not fire.
//   * **A modest offer is not a refusal.** One junior quarter-final anywhere on the junior ladder is
//     enough for a place; what a weak record buys is a small share at a small programme, and
//     `tests/college-offer.test.ts` pins that a floor record is still offered a place.
//
// ⚠ THE REFUSAL THAT DOES EXIST is an EMPTY junior record – she never reached a quarter-final at any
// junior rung in her whole junior career. That is not "she played badly"; it is "no programme ever
// saw her", which is what §1a's narrow route actually looks like from a coach's desk. §3 of the spec
// measures how often it fires rather than asserting it.
//
// ⭐⭐⭐ ROUND 21 (17.08.2026) ADDS TWO THINGS AND REMOVES NOTHING – see
// `docs/specs/the-college-tariff-2026-08.md`. The owner: «По колледжу надо собрать понятные ступени
// с прозрачной оплатой и годовым списанием с учетом доходов семьи на момент поступления и прочего.»
//
//   1. A SECOND, NAMED LADDER: the FUNDING BAND (`fundingBandOf`). The programme rung says which
//      door opened; the funding band says what came through it, in words rather than in a
//      percentage. Both are derived, neither persists, and neither draws.
//   2. THE NEED LAYER READS THE FAMILY'S POSITION AT ENROLMENT rather than its background LABEL.
//      Trends 2025 names both inputs in one clause – most Pell recipients get less than the maximum
//      because *"their family incomes and assets reduce their aid eligibility"* `[S]` – and until
//      round 21 this file read neither, only the three-value label upstream of them.
//
// ⚠⚠ AND THE ATHLETIC AWARD IS UNTOUCHED BY BOTH. `athleticShareOf` still takes
// `(programme, juniorScore, rng)` and still cannot be handed a family. Round 21 makes that property
// STRONGER rather than weaker: the merit-only sweep in `tests/college-offer.test.ts` block A now
// varies income and savings as well as background and nationality, so an edit that made the award
// read the new fields fails a test that did not previously exist.
import type { CollegeOffer, CollegeProgrammeTier, FamilyBackground } from '../shared/protocol'
import type { Rng } from './rng'

export type { CollegeOffer, CollegeProgrammeTier }

/** ⭐⭐ THE SECOND LADDER, AND IT IS THE ONE THE PLAYER CAN ACTUALLY READ.
 *
 *  The card shipped «62% of the bill» and a dollar figure. A percentage is not a rung: it does not
 *  say whether 62% is a good offer, and the player has nothing to compare it against on a card she
 *  sees once. A NAME does – and the owner asked for exactly that, «понятные ступени».
 *
 *  ⚠ IT IS DERIVED AND NEVER PERSISTED. `covered = min(1, athletic + need)` is arithmetic on two
 *  fields `CollegeOffer` already carries, so this adds no save field, no migration and no fixture –
 *  and a career mid-course keeps the offer it agreed to, band and all, because the band follows the
 *  numbers rather than being stored beside them. */
export type CollegeFundingBand = 'full' | 'most' | 'half' | 'part' | 'none'

/** The junior rungs, strongest first. ⚠ THE ONLY TIER IDS THIS FILE KNOWS, and that is the point:
 *  it cannot read a professional rung because it has no name for one. */
export const JUNIOR_RUNGS = ['j300', 'j60', 'j30'] as const
export type JuniorRung = (typeof JUNIOR_RUNGS)[number]

/** ⚠⚠ WHAT A COLLEGE PROGRAMME IS ALLOWED TO KNOW ABOUT HER – P4's decoupled-leaf pattern, and here
 *  it is a fairness property rather than a tidiness one.
 *
 *  `collegeDoorOpen` was decoupled from `TIERS` so a points edit could not move the college ending.
 *  This view goes further: it is decoupled from her PROFESSIONAL CAREER ENTIRELY. Her tour rank, her
 *  W-rung finishes and her prize money are not fields here, so no future edit to a prize table, an
 *  acceptance cut or a points column can reach the offer, and no agent can re-create the
 *  result-closes-the-door rule the owner deleted without first adding a field and explaining why. */
export interface CollegeRecruitView {
  /** her best finishing position on each junior rung. ⚠ ZERO-BASED: **0 = she won it**, 1 = lost the
   *  final, 2-3 = semi, 4-7 = quarter (`world.ts`'s trophy cabinet is the definition). Absent = never
   *  played it.
   *  ⚠ A CAREER HIGH-WATER MARK (`world.bestFinishByTier`), so it is stable after eighteen and the
   *  offer measured at the fork is the offer any later week would compute. */
  juniorBests: Partial<Record<JuniorRung, number>>
  /** ⭐ how many JUNIOR titles she won, across j30/j60/j300 – `trophiesByTier`, which is never pruned
   *  and never goes backwards. ⚠ Junior rungs only: a professional title is not a field here and must
   *  not become one, for the reason in this file's header. */
  juniorTitles: number
  /** ⚠ READ ONLY BY THE NEED-BASED LAYER. `athleticShareOf` does not take this argument at all.
   *  ⚠⚠ AND SINCE ROUND 21 IT NO LONGER PRICES THE NEED LAYER EITHER – it is upstream of the two
   *  fields below (`parentIncomeForWeekCents` is seeded from it) rather than the means test itself.
   *  It survives on the view because the sticker and the copy still want to know which family this
   *  is, and because dropping it would have made the two money fields unattributable in a bench dump. */
  background: FamilyBackground
  /** ISO 3166-1 alpha-2. ⚠ READ ONLY BY THE NEED-BASED LAYER AND THE STICKER, for the reason in
   *  `COLLEGE_OFFER.needTest` – and never by the athletic award. */
  country: string
  /** ⭐⭐ THE FAMILY'S ANNUALISED INCOME THE WEEK SHE ENROLS – the owner's «доходы семьи на момент
   *  поступления», measured at that moment rather than read off a label fixed at onboarding.
   *
   *  ⚠⚠ IT IS THE PARENTS' CONTRIBUTION TO THE TENNIS x 52, NOT A HOUSEHOLD INCOME, and the whole
   *  calibration of `COLLEGE_OFFER.needTest` turns on saying that out loud. `parentIncomeForWeekCents`
   *  is what they put IN; a family putting $600 a week into a junior career is not a family earning
   *  $31,000 a year. So no federal dollar threshold can be laid over this axis, and the two knots
   *  below are OURS, set on the game's own measured distribution. The SHAPE is what is sourced.
   *
   *  ⚠ READ ONLY BY THE NEED-BASED LAYER. */
  familyIncomeCents: number
  /** ⭐⭐ WHAT THEY HAVE SAVED, at enrolment – «Копят деньги и оплачивают».
   *
   *  ⚠ IT CAN BE NEGATIVE. A career carrying debt into college is a real state (§2e of
   *  `what-the-college-place-costs-2026-08.md`), and a means test that assumed a floor of zero would
   *  quietly price a family in debt as a family with nothing, which are not the same family.
   *
   *  ⚠ THIS IS THE FIELD THAT MAKES THE LABEL WRONG SOMETIMES, and it is the reason round 21 exists:
   *  measured, a working family's savings at the fork run ABOVE a wealthy family's at p75, so the
   *  label and the position genuinely disagree about the same family. Reading the label priced that
   *  family as poor. ⚠ READ ONLY BY THE NEED-BASED LAYER. */
  familyAssetsCents: number
}

export const COLLEGE_OFFER = {
  /** ⚠⚠ TWO STICKERS, AND NATIONALITY IS THE ONLY SOURCED THING THAT PICKS BETWEEN THEM.
   *
   *  §1d's table has three: **$30,990** public in-state, **$50,920** public out-of-state, **$65,470**
   *  private nonprofit, all `[S]` (College Board, Trends 2025, Figure CP-1). We ship two.
   *
   *  WHY NOT THE PRIVATE ONE: it would need a driver, and the honest drivers are all inventions – a
   *  strong programme is not more likely to be private, and no source says otherwise. A third
   *  constant with a made-up selector is exactly the failure `docs/specs/acceptance-cuts-2026-08.md`
   *  §0 finding 2 records. It is recorded here and not modelled.
   *
   *  WHY NATIONALITY PICKS THE OTHER TWO: in-state versus out-of-state IS residence, and a
   *  non-resident alien is never in-state anywhere. That is the one split the sources actually
   *  determine, so it is the one we model.
   *
   *  ⚠ AND THE AMERICAN FIGURE IS THE FLOOR OF THE RANGE, STATED AS A SIMPLIFICATION. An American
   *  recruited by an out-of-state programme pays $50,920 too, and we do not model which school is in
   *  which state. So our US bill is the cheapest a real place can be, never the dearest. */
  costPerYearInStateCents: 30_990_00,
  costPerYearOutOfStateCents: 50_920_00,
  /** recorded, not modelled – §1d's third sticker, kept so the gap is visible rather than forgotten */
  costPerYearPrivateNonprofitCents: 65_470_00,
  /** the country code that gets the in-state figure and the need-based layer. ⚠ Both of those are US
   *  federal facts (34 CFR §668.33; the state-residence tuition split), so this is not a nationality
   *  preference in the game – it is the one place the sourced law is US-specific. */
  usCountryCode: 'US',

  /** ⚠⚠ OURS, NOT THE SPORT'S – said as plainly as `college-is-its-own-branch-2026-08.md` §0a says it
   *  of the Local/Regional/National rungs.
   *
   *  WHAT IS SOURCED: partial awards are the norm (*"Most scholarships are partial"*, NCAA `[S]`); a
   *  school may fund any or all of its ten roster places (Bylaw 17.2 + 16.13.1.5 `[S]`); a FULLY
   *  FUNDED programme at the 2024-25 limit averaged ~85% of a full ride per player, or 80% against
   *  the new roster of ten (`[I]`, §1d, arithmetic shown there).
   *
   *  WHAT IS NOT: the low end. §4 items 15 and 16 are explicit – no per-sport award figure exists and
   *  the share of programmes that fund to their limit is unknown. **So `strong` sits at the sourced
   *  ceiling and the two below it are ours**, spaced so the card shows a real difference. Anyone
   *  re-tuning these is tuning our numbers, not the sport's, and §4 item 15 is the check that would
   *  replace them. */
  /** ⚠⚠ AND THE THRESHOLDS ARE THE MEASURED QUARTILES OF THE SCORE, NOT ROUND NUMBERS I LIKED.
   *
   *  The first set (12 / 5 / 1) put **88 of 90 careers in `strong`** and produced a median family
   *  bill of **$0** – a phase about college not being free, measuring it as free. Re-shaping the score
   *  (see `prestigeWeight`) gave it real spread over 44 careers walked to the fork: **min 4 · p25 6 ·
   *  median 11 · p75 18 · p90 23 · max 25**. These three sit on that distribution's own quarters.
   *  Spec §3b has both runs. */
  programmes: {
    strong: { base: 0.85, minJuniorScore: 18 },
    solid: { base: 0.55, minJuniorScore: 7 },
    small: { base: 0.3, minJuniorScore: 1 },
  } as Record<CollegeProgrammeTier, { base: number; minJuniorScore: number }>,

  /** how far a programme's own funding moves the award either side of its band, ± this.
   *  ⚠ THIS IS THE SOURCED MECHANISM AND NOT A COSMETIC WOBBLE: since the House settlement the
   *  constraint on funding a place is a school's BUDGET, not a bylaw (16.13.1.5 – *"there is no limit
   *  on the number of new athletics scholarships that may be awarded consistent with the roster
   *  limit"*), so two programmes that recruit the same girl genuinely offer her different money. */
  programmeFundingSpread: 0.1,
  /** nobody is offered a place and nothing at all */
  minAthleticShare: 0.05,
  /** the ceiling on the volume term – see `titleVolume` */
  maxTitleVolume: 6,
  /** the score a perfect junior career reaches: `prestigeWeight` x 4 + `maxTitleVolume`. Used only to
   *  scale the within-band half-step, so the top band's edge is not a cliff. */
  maxJuniorScore: 26,

  /** ⚠⚠ THE NEED-BASED LAYER, AND IT IS THE ONLY THING IN THIS FILE THAT READS THE FAMILY.
   *
   *  It exists in the sport – the NCAA's own sentence names *"need-based assistance like Federal Pell
   *  Grants"* alongside the athletics award `[S]` – and it is means-tested by federal formula: Trends
   *  2025's explanation of why most Pell recipients get less than the maximum is *"their family
   *  incomes and assets reduce their aid eligibility"* `[S]`.
   *
   *  ⚠ THE THREE NUMBERS ARE OURS AND ONLY THE TOP ONE HAS A REAL ANCHOR UNDER IT. The arithmetic,
   *  in full, so a re-tune knows what it is arguing with:
   *
   *    * **working = 0.45.** The maximum Pell Grant is **$7,395** in 2025-26 `[S]`, which is **23.9%**
   *      of the $30,990 in-state sticker `[I]` – so roughly half of this row is a sourced federal
   *      entitlement and the rest is the institutional need grant that sits on top of it. A working
   *      family is inside Pell's range: median US family income is **$105,800** `[S]` (Trends 2025,
   *      Figure CP-17B) and Pell phases out far below that.
   *    * **middle = 0.10.** ⚠ SMALL ON PURPOSE, AND THIS IS THE ROW MOST WORTH ARGUING WITH. A family
   *      at or above the US median is out of Pell range entirely, so this row is institutional aid
   *      alone. Setting it high would have made every American family pay nothing and quietly deleted
   *      the owner's question.
   *    * **wealthy = 0.** Need-based aid is need-tested; there is no need.
   *
   *  ⚠ AND THE THREE AVERAGE 18%, BELOW THE 31% ACTUALLY OBSERVED, ON PURPOSE. Average grant aid per
   *  first-time full-time in-state student at a public four-year is ~$9,650 against the $25,850
   *  tuition-fees-housing-food bill (`[I]` from Figure CP-9's own numbers) = ~31% of the sticker – but
   *  that figure includes merit discounting and institutional tuition discounts, and this layer models
   *  only the need-based part. `docs/specs/what-the-college-place-costs-2026-08.md` §2c. */
  needTest: {
    /** ⚠ THE CEILING IS THE ONE ROW WITH A REAL ANCHOR UNDER IT AND IT DOES NOT MOVE IN ROUND 21.
     *  Maximum Pell is **$7,395** in 2025-26 `[S]`, which is **23.9%** of the $30,990 in-state
     *  sticker `[I]` – so roughly half of this number is a sourced federal entitlement and the rest
     *  is the institutional need grant that sits on top of it. Round 21 changes WHO reaches this
     *  ceiling, not where the ceiling is: one thing at a time, the same discipline that left the
     *  award bases alone when the programme bands were re-shaped. */
    maxNeedShare: 0.45,
    /** ⚠⚠ AT OR BELOW THIS POSITION SHE GETS THE WHOLE LAYER; at or above `noNeedAboveCents`, none of
     *  it; between them it tapers straight.
     *
     *  THE SHAPE IS SOURCED AND THE TWO NUMBERS ARE OURS, and the difference matters. Federal need
     *  aid genuinely has this shape – a floor band that receives the maximum, a taper, and a cut
     *  above which nothing is paid – and Trends 2025 names both of its inputs in one clause: most
     *  recipients get less than the maximum because *"their family incomes and assets reduce their
     *  aid eligibility"* `[S]`.
     *
     *  ⚠⚠ BUT THE DOLLARS CANNOT BE BORROWED, AND THIS IS THE HONEST LIMIT OF THE MODEL. Our income
     *  axis is `parentIncomeForWeekCents x 52` – the parents' contribution to the TENNIS, which
     *  measures $17.5k / $31k / $57k at the fork against a US median family income of $105,800 `[S]`.
     *  Laying a real federal threshold over that axis would put EVERY family in this game inside
     *  Pell's floor band and hand all three of them the full 45%, which deletes the owner's question
     *  instead of answering it – the identical failure `needShareByBackground.middle` was written to
     *  avoid. So the knots are set on the game's own measured distribution (spec §3), calibrated to
     *  reproduce the shipped population's three medians, and what changes is that a family is priced
     *  on its own position instead of on the median of its label.
     *
     *  ⚠ AND THE TWO KNOTS ARE THE MEASURED BANDS' OWN EDGES, NOT NUMBERS I LIKED. Annualised parent
     *  income at the fork, n = 53 (`college-price-probe --seeds 6 --all`, arm A at 6575a35):
     *
     *      working  p25 $17,621 · median $18,255 · p75 $18,862
     *      middle   p25 $31,277 · median $31,531 · p75 $32,751
     *      wealthy  p25 $54,035 · median $55,153 · p75 $56,919
     *
     *  **The floor is the top of the working band and the cut is the top of the middle band**, rounded
     *  out: a working family with ordinary savings receives the whole layer, a middle family sits
     *  inside the taper where its savings decide how much of it it keeps, and a wealthy family is out
     *  of the taper on income alone. Every one of the three is a measured consequence rather than an
     *  assignment, which is the difference between this table and the one it replaces. */
    fullNeedBelowCents: 20_000_00,
    noNeedAboveCents: 35_000_00,
    /** ⭐⭐ SAVINGS COUNT, AND THEY COUNT AS "HOW MANY YEARS OF THIS COULD YOU PAY FOR" – which is the
     *  arithmetic a parent actually does, and it is in the same unit as the bill.
     *
     *  ⚠ WHY NOT THE FEDERAL RATE. The real formula converts parental assets to an annual figure at
     *  a few per cent. Measured on our scale that term is worth **$688 a year to the median family**
     *  – invisible beside a $17,500 income axis – so importing the rate would import the WORD
     *  "assets" without the effect, and «копят деньги» is the owner's own verb for the thing being
     *  modelled. Savings above the shield are spread over the four years she will be enrolled.
     *
     *  ⚠ THE SHIELD IS THE RESERVE A FAMILY IS NOT EXPECTED TO LIQUIDATE, and $25,000 is the middle
     *  preset's own starting capital – an ordinary family's whole cushion, taken from the game rather
     *  than from a formula. Below it, savings do not price her at all. */
    assetShieldCents: 25_000_00,
    assetSpreadYears: 4,
  },

  /** ⚠⚠ THE FUNDING BANDS' LOWER EDGES – ours, and set on the MEASURED distribution of `covered`
   *  rather than on round numbers (spec §3b has the run). `full` is not here because it is not ours:
   *  1.0 is Bylaw 15.02.5's own full grant-in-aid. See `fundingBandOf`. */
  fundingBands: { most: 0.8, half: 0.55 },

  /** ⚠⚠ THE PRESTIGE RUNG CARRIES THE SCORE, AND THAT IS A MEASUREMENT AND NOT A TASTE.
   *
   *  The first version weighted all three rungs (j300 3 · j60 2 · j30 1) against each rung's own best
   *  finish, and the score it produced had almost no spread: over 35 careers walked to the fork,
   *  **every one scored 11 or more of a possible 24** and the median was 15. The reason is in the
   *  measurement (spec §3b): `best j60` and `best j30` are **0 at the median and at p75** – she WINS
   *  those rungs, routinely, because they are the on-ramp and she plays dozens of them over five
   *  seasons. A high-water mark on an easy rung saturates, and a term that is the same for three
   *  quarters of the population carries no information about any of them.
   *
   *  `best j300` is where the spread actually is: **p25 = 1 (a final), median = 3 (a semi), p75 = 4
   *  (a quarter)**. So the prestige rung is the score, and the two below it are represented by
   *  VOLUME instead of by a high-water mark – see `titleVolume`. */
  prestigeRung: 'j300' as JuniorRung,
  prestigeWeight: 5,
  /** ⚠⚠ FINISHING POSITION IS ZERO-BASED IN THIS ENGINE, AND THE FIRST VERSION OF THIS TABLE WAS NOT.
   *
   *  `world.ts`'s trophy cabinet is the definition and it is unambiguous:
   *  `if (kidFinish === 0) cabinet.titles.push(...)` / `else if (kidFinish === 1) cabinet.finals.push(...)`.
   *  So **0 = won it, 1 = lost the final, 2-3 = semi, 4-7 = quarter**, and the v50 golden fixture reads
   *  correctly under that scale (`j60: 0` is a J60 TITLE, `j300: 4` a quarter-final).
   *
   *  ⚠ I FIRST WROTE THIS ONE-BASED, and the first 90-career run is what caught it: 88 of 90 careers
   *  landed in the `strong` band and the median family bill came out at $0 – a phase whose whole point
   *  is that college is not free, measuring college as free. Every row was a full round too generous.
   *  The measurement is kept in the spec's §3b because the error is the finding. */
  roundScore: [
    { finish: 0, score: 4 },
    { finish: 1, score: 3 },
    { finish: 3, score: 2 },
    { finish: 7, score: 1 },
  ],
} as const

/** WHAT A PROGRAMME HAS SEEN, as one number. Zero = an empty junior record.
 *
 *  ⚠ IT IS A CAREER RECORD AND NOT A RANK, which is the whole of the brief's "junior-side read". A
 *  rank is a snapshot that decays; `bestFinishByTier` is what she DID, it never goes backwards, and
 *  it is what a coach writing an offer in her junior year is actually looking at (§1c: the commitment
 *  is made at sixteen or seventeen, on a body of junior results). */
export function juniorRecordScore(view: Pick<CollegeRecruitView, 'juniorBests' | 'juniorTitles'>): number {
  const best = view.juniorBests[COLLEGE_OFFER.prestigeRung]
  let prestige = 0
  if (best !== undefined) {
    for (const band of COLLEGE_OFFER.roundScore) {
      if (best <= band.finish) {
        prestige = COLLEGE_OFFER.prestigeWeight * band.score
        break
      }
    }
  }
  return prestige + titleVolume(view.juniorTitles)
}

/** ⭐ HOW MUCH JUNIOR TENNIS SHE ACTUALLY WON, capped. Junior titles measured 0 / 4 / 15 at
 *  min / median / max over 35 careers (spec §3b) – real spread, where the easy rungs' best-finish
 *  had none. Halved and capped so a career that wins fifteen J30s does not out-score a J300 finalist
 *  on volume alone: the prestige rung is worth up to 20 and this is worth up to 6. */
export function titleVolume(juniorTitles: number): number {
  return Math.min(COLLEGE_OFFER.maxTitleVolume, Math.floor(juniorTitles / 2))
}

/** WHICH PROGRAMME, or `null` for an empty record. */
export function programmeFor(juniorScore: number): CollegeProgrammeTier | null {
  const p = COLLEGE_OFFER.programmes
  if (juniorScore >= p.strong.minJuniorScore) return 'strong'
  if (juniorScore >= p.solid.minJuniorScore) return 'solid'
  if (juniorScore >= p.small.minJuniorScore) return 'small'
  return null
}

/** ⚠⚠ THE ATHLETIC SHARE, AND ITS SIGNATURE IS THE ARGUMENT.
 *
 *  It takes a programme, a junior score and a die. **It does not take a `CollegeRecruitView`**, so it
 *  physically cannot read `background` or `country`. That is the owner's question answered in the
 *  type system rather than in a comment: an athletics award that read family wealth would be a rule
 *  the sport does not have – there is no means test anywhere in Bylaw 15 on athletics aid – and it
 *  would read as unfair on a card that is already the most expensive click in the game.
 *
 *  ⚠ `tests/college-offer.test.ts` sweeps all three backgrounds and both nationalities against one
 *  junior record and asserts this number does not move, and that test is mutation-verified. */
export function athleticShareOf(programme: CollegeProgrammeTier, juniorScore: number, rng: Rng): number {
  const band = COLLEGE_OFFER.programmes[programme]
  // The programme's own funding, ± the spread. One draw, on a sub-stream (see `collegeOfferFor`).
  const funding = (rng() * 2 - 1) * COLLEGE_OFFER.programmeFundingSpread
  // ⚠ AND A HALF-STEP FOR THE RECORD INSIDE THE BAND, so the band edges are not cliffs: the top of a
  // band is worth a little more than its floor at the same programme. Scaled by the band's own width
  // so it can never carry her into the next band's money.
  const nextFloor = programme === 'strong' ? COLLEGE_OFFER.maxJuniorScore : nextBandFloor(programme)
  const span = Math.max(1, nextFloor - band.minJuniorScore)
  const within = Math.min(1, Math.max(0, (juniorScore - band.minJuniorScore) / span))
  const shaped = band.base + within * COLLEGE_OFFER.programmeFundingSpread
  return clamp(shaped + funding, COLLEGE_OFFER.minAthleticShare, 1)
}

function nextBandFloor(programme: CollegeProgrammeTier): number {
  const p = COLLEGE_OFFER.programmes
  return programme === 'small' ? p.solid.minJuniorScore : p.strong.minJuniorScore
}

/** ⚠⚠ THE NEED-BASED SHARE – means-tested, and SHUT TO A NON-AMERICAN, which is primary law.
 *
 *  34 CFR §668.33: federal student aid requires that she *"(1) Be a citizen or national of the United
 *  States; or (2) … (ii) Is in the United States for other than a temporary purpose"* – and a student
 *  visa is a temporary purpose by definition `[S]`. NAFSA states it plainly: *"students in a
 *  nonimmigrant category are not eligible for such aid"*, and institutional aid to undergraduate
 *  internationals is *"uncommon"* `[S]`.
 *
 *  ⚠ THE ATHLETIC AWARD IS NOT AFFECTED AND MUST NOT BE. Nothing in Bylaw 15 conditions athletics aid
 *  on nationality – its only nationality clause, 15.2.6.3, expressly contemplates the international
 *  case – and 62–66% of D-I women's tennis rosters are international `[WEAK]`. **The money that reads
 *  merit reaches her; the money that reads her family does not.** */
export type NeedTestView = Pick<CollegeRecruitView, 'country' | 'familyIncomeCents' | 'familyAssetsCents'>

/** ⭐⭐ WHAT THE MEANS TEST READS, AS ONE NUMBER – income plus what the savings can carry.
 *
 *  ⚠ THE ASSET TERM IS SPREAD OVER THE YEARS SHE WILL BE THERE, so it is in the same unit as the
 *  income beside it: both are "dollars available in a year". Adding a stock to a flow without that
 *  division would have made a family with $120,000 banked look like it earned $120,000, and the
 *  knots would then be measuring nothing in particular.
 *
 *  ⚠ AND THE SHIELD FLOORS AT ZERO RATHER THAN GOING NEGATIVE. A family $40,000 in debt is priced at
 *  its income, not at a negative position that would push it below a floor the taper already gives
 *  it – `fullNeedBelowCents` is the maximum this layer pays and there is nothing under it. Debt is
 *  represented by getting the whole layer, which is all this layer has. */
export function familyPositionCents(view: NeedTestView): number {
  const spare = Math.max(0, view.familyAssetsCents - COLLEGE_OFFER.needTest.assetShieldCents)
  return view.familyIncomeCents + Math.round(spare / COLLEGE_OFFER.needTest.assetSpreadYears)
}

export function needShareOf(view: NeedTestView): number {
  if (view.country !== COLLEGE_OFFER.usCountryCode) return 0
  const { fullNeedBelowCents, noNeedAboveCents, maxNeedShare } = COLLEGE_OFFER.needTest
  const position = familyPositionCents(view)
  if (position <= fullNeedBelowCents) return maxNeedShare
  if (position >= noNeedAboveCents) return 0
  const taper = (noNeedAboveCents - position) / (noNeedAboveCents - fullNeedBelowCents)
  // Rounded to whole percentage points of the bill: the card prints percentages, the ledger charges
  // a rounded weekly figure off the result, and a share carrying twelve decimals of a linear
  // interpolation is precision the rest of the pipeline throws away anyway.
  return Math.round(maxNeedShare * taper * 100) / 100
}

/** ⭐⭐ WHICH FUNDING BAND – derived from what the two layers together cover, and nothing else.
 *
 *  ⚠ THE TOP EDGE IS THE ONE THE SPORT NAMES. Bylaw 15.02.5 defines a FULL GRANT-IN-AID as tuition,
 *  fees, living expenses, books and other expenses up to the cost of attendance `[S]` – so "a full
 *  ride" is a real named thing at exactly 100% and not a round number we liked. The three edges below
 *  it are ours, set on the measured distribution of `covered` (spec §3b) so that each band holds a
 *  real share of the population. That check is the whole lesson of `programmes`' own note: a first
 *  set of thresholds put 88 of 90 careers in one band, and a band that holds nearly everybody says
 *  nothing about anybody. */
export function fundingBandOf(covered: number): CollegeFundingBand {
  if (covered >= 1) return 'full'
  if (covered >= COLLEGE_OFFER.fundingBands.most) return 'most'
  if (covered >= COLLEGE_OFFER.fundingBands.half) return 'half'
  if (covered > 0) return 'part'
  return 'none'
}

/** What the offer covers between the two layers, capped at the Bylaw 15.1 ceiling. One expression,
 *  used by the band and by the bill, so the card and the ledger cannot disagree about it. */
export function coveredShareOf(offer: Pick<CollegeOffer, 'athleticShare' | 'needShare'>): number {
  return Math.min(1, offer.athleticShare + offer.needShare)
}

/** ⭐⭐ THE OFFER. One draw, on the sub-stream the caller derives (`seed:collegeoffer:<week>`) –
 *  never MAIN (CLAUDE.md invariant 2).
 *
 *  ⚠ THE TWO LAYERS ARE METERED TOGETHER AT ONE CEILING, AND THE CEILING IS THE BILL. Bylaw 15.1: a
 *  student-athlete is ineligible if she *"receives financial aid that exceeds the value of the cost of
 *  attendance"* `[S]`. So `athletic + need` is capped at 1.
 *
 *  ⚠⚠ AND THE TRIM FALLS ON THE NEED LAYER, NEVER ON THE ATHLETIC ONE. Two reasons and both matter:
 *  the sport's own remedy is to reduce INSTITUTIONAL aid (15.1.3), and trimming the athletic award
 *  instead would make a merit number move with family wealth – the exact thing the owner's question
 *  is about. A strong girl from a poor family therefore pays nothing; her award is not shaved to
 *  make room for her need. */
export function collegeOfferFor(view: CollegeRecruitView, rng: Rng): CollegeOffer {
  const costPerYearCents =
    view.country === COLLEGE_OFFER.usCountryCode
      ? COLLEGE_OFFER.costPerYearInStateCents
      : COLLEGE_OFFER.costPerYearOutOfStateCents

  const score = juniorRecordScore(view)
  const programme = programmeFor(score)

  // ⭐⭐ NO PROGRAMME IS NOT NO ANSWER, AND THIS IS WHERE THE OWNER'S RULING AND THE RESEARCH STOP
  // PULLING AGAINST EACH OTHER.
  //
  // §1a says the route is narrow and a place is something somebody has to OFFER. The owner's ruling
  // of 16.08 says nothing removes the third answer. Both are satisfied by the same sentence: **she
  // can always enrol; what she may not have is anyone paying for it.** A girl with no offer is a
  // walk-on – the roster limit is a ROSTER limit, not a scholarship count, and a school may carry an
  // unfunded player on it (Bylaw 17.2 + 16.13.1.5 `[S]`).
  //
  // ⚠ AND THE NEED-BASED LAYER STILL REACHES HER, because it was never an athletics thing. Pell is
  // means-tested aid to a STUDENT; a poor American family gets it whether or not a coach ever called.
  // So the athletic share is zero here and the other layer is not.
  if (programme === null) {
    const walkOnNeed = needShareOf(view)
    return {
      programme: null,
      athleticShare: 0,
      needShare: walkOnNeed,
      costPerYearCents,
      familyPerYearCents: Math.round(costPerYearCents * (1 - walkOnNeed)),
    }
  }

  const athleticShare = athleticShareOf(programme, score, rng)
  const needShare = Math.min(needShareOf(view), 1 - athleticShare)
  const covered = coveredShareOf({ athleticShare, needShare })
  return {
    programme,
    athleticShare,
    needShare,
    costPerYearCents,
    familyPerYearCents: Math.round(costPerYearCents * (1 - covered)),
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

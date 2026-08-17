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
//   ⚠ RE-AIMED, NOT DELETED (the rebuild below): the first argument is a TIER now – the place the
//   PLAYER picked – and not the funding band her record bought. The property the sentence is about is
//   unchanged and is stronger for it, because the one new input is a player's decision. The sweep is
//   wider still: every background x both nationalities x four incomes x four savings x EVERY TIER.
//
// ⭐⭐⭐⭐ ROUND 21, THE SAME DAY, LATER: THE OWNER READ THE REPORT AND IT ANSWERED A QUESTION HE HAD
// NOT ASKED. `docs/specs/the-college-choice-2026-08.md` is the rebuild and this file is its centre.
// Verbatim: «Есть стоимость в год, она складывается из 52 недельных платежей семьи простым
// суммированием, плюс может быть ситуация, что есть деньги на счете и семья хочет выбрать колледж
// дороже… И всё. мы больше ничего ни с чем не сравниваем.»
//
// ⚠⚠ WHAT WAS WRONG WAS NOT THE ARITHMETIC. It was that A TIER WAS NOT A PLACE. `strong` / `solid` /
// `small` were FUNDING SHARES – 0.85 / 0.55 / 0.30 – **derived from her junior record**, laid over a
// price that was identical at all three. So:
//
//   * the PLAYER chose nothing. Her results picked the "tier" for her, which is the opposite of the
//     owner's «семья хочет выбрать колледж дороже»;
//   * and the card printed **$8,673 a year** under a sourced **$30,990** sticker with nothing on
//     screen connecting them. $8,673 is the family's RESIDUAL after the award. He could not find
//     where it came from because no surface said so.
//
// SO A TIER IS NOW A PLACE WITH A PRICE, three of them on the three sourced stickers, and the player
// picks one. The award is merit-only and is a share OF THE PLACE SHE PICKED. The family pays the rest
// weekly and may go into debt – which `resolveCollegeBill` has done since v51 and is NOT rebuilt.
//
// ⚠ THE PRICES ARE SOURCED. THE QUALITY LADDER OVER THEM IS OURS – see `COLLEGE_TIERS`, where every
// invented number says so on its own line. §0a of the spec is the table.
import type { CollegeOffer, CollegeQuote, CollegeTier, FamilyBackground } from '../shared/protocol'
import type { Rng } from './rng'

export type { CollegeOffer, CollegeQuote, CollegeTier }

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

/** ⭐⭐ THE THREE PLACES, CHEAPEST FIRST. **The prices are sourced; everything else here is ours.**
 *
 *  ⚠⚠ THE PRICES `[S]`: College Board, *Trends in College Pricing and Student Aid 2025*, Figure CP-1
 *  – **$30,990** public four-year in-state, **$50,920** public four-year out-of-state, **$65,470**
 *  private nonprofit. Round 20's model shipped two of the three and its own note said why the third
 *  was left out: *"it would need a driver, and the honest drivers are all inventions."* **The owner
 *  supplied the driver**, and it is the one thing an invented selector could never be – A PLAYER'S
 *  CHOICE. The third sticker is no longer recorded-and-not-modelled; it is the dear place.
 *
 *  ⚠ `residentOnly` IS THE ONE PROPERTY HERE THAT IS NOT OURS. In-state versus out-of-state IS
 *  residence and a non-resident alien is never in-state anywhere, so the cheap place is not open to a
 *  girl on a student visa. Two places always are: **nothing here can remove the college answer**
 *  (owner, 16.08) – it removes one school from a list of three.
 *
 *  ⚠⚠ `squad` IS OURS AND IT IS AN INVENTION WITH A SCALE, NOT A FINDING. It is the programme's own
 *  playing level on the SAME 0-100 scale her skills use, so the card can put it beside her and the
 *  player can read the difference. No source rates a college squad on our scale and none could. The
 *  three are set to BRACKET the measured skill mean at the fork (**58.64**, P5 §2b, n = 52): the
 *  cheap place is below her, the middle one just above, the dear one well above.
 *
 *  ⚠⚠ `fullAwardScore` IS OURS TOO, BUT IT IS SET ON A MEASUREMENT RATHER THAN ON TASTE – the same
 *  discipline the retired `programmes.minJuniorScore` used. It is the junior score at which a
 *  programme funds her whole bill, i.e. the score at which she is the top of its recruiting board,
 *  and the three are the MEASURED QUANTILES of our own junior score over 44 careers walked to the
 *  fork (min 4 · p25 6 · **median 11** · **p75 18** · **p90 23** · max 25). So the cheap place funds
 *  the median junior completely, and the dear place funds only the top tenth completely.
 *
 *  ⚠ `matchesPerWeek` IS OURS. The NCAA dual-match season is real; its length here and the number of
 *  matches a tier plays in it are ours. It is the one thing the squad DOES – see
 *  `collegeMatchesThisWeek` in `world/college.ts`, and §3 of the spec for how little it turned out to
 *  be worth. */
export const COLLEGE_TIERS = {
  state: {
    costPerYearCents: 30_990_00,
    residentOnly: true,
    squad: 55,
    fullAwardScore: 11,
    matchesPerWeek: 1,
  },
  national: {
    costPerYearCents: 50_920_00,
    residentOnly: false,
    squad: 65,
    fullAwardScore: 18,
    matchesPerWeek: 2,
  },
  private: {
    costPerYearCents: 65_470_00,
    residentOnly: false,
    squad: 75,
    fullAwardScore: 23,
    matchesPerWeek: 3,
  },
} as const satisfies Record<
  CollegeTier,
  { costPerYearCents: number; residentOnly: boolean; squad: number; fullAwardScore: number; matchesPerWeek: number }
>

/** cheapest first, and the order the card draws them in. ⚠ THE ORDER IS THE PRICE'S, NOT A RANKING –
 *  a card that led with the dear place would be recommending it in reading order (ruling 4). */
export const COLLEGE_TIER_ORDER = ['state', 'national', 'private'] as const

export const COLLEGE_OFFER = {
  /** the country code that gets the in-state place and the need-based layer. ⚠ Both of those are US
   *  federal facts (34 CFR §668.33; the state-residence tuition split), so this is not a nationality
   *  preference in the game – it is the one place the sourced law is US-specific. */
  usCountryCode: 'US',

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

/** ⭐ DID ANYBODY SEE HER AT ALL? Zero = an empty junior record – she never reached a quarter-final at
 *  any junior rung in her whole junior career.
 *
 *  ⚠⚠ IT IS NOT A REFUSAL AND IT REMOVES NOTHING (owner, 16.08). She enrols as a WALK-ON at whichever
 *  place she picks and pays its whole price: the roster limit is a ROSTER limit and not a scholarship
 *  count, so a school may carry an unfunded player (Bylaw 17.2 + 16.13.1.5 `[S]`). Measured, this is
 *  3 of 90 careers.
 *
 *  ⚠ `programmeFor(score)` WAS HERE and it answered a different question – WHICH funding band her
 *  record bought, back when the band was the "tier". The band is gone (see the header); what survives
 *  is the only part of it that was ever about the world rather than about money. */
export function recruitedAtAll(juniorScore: number): boolean {
  return juniorScore > 0
}

/** ⚠ IS THIS PLACE HERS TO PICK? Residence, and nothing else. Primary law, not a balance knob. */
export function tierOpenTo(tier: CollegeTier, country: string): boolean {
  return !COLLEGE_TIERS[tier].residentOnly || country === COLLEGE_OFFER.usCountryCode
}

/** ⚠⚠ THE ATHLETIC SHARE, AND ITS SIGNATURE IS STILL THE ARGUMENT.
 *
 *  It takes a TIER, a junior score and a die. **It does not take a `CollegeRecruitView`**, so it
 *  physically cannot read `background`, `country`, `familyIncomeCents` or `familyAssetsCents`. That is
 *  the owner's question answered in the type system rather than in a comment: an athletics award that
 *  read family wealth would be a rule the sport does not have – there is no means test anywhere in
 *  Bylaw 15 on athletics aid – and it would read as unfair on a card that is already the most
 *  expensive click in the game.
 *
 *  ⚠⚠ WHAT CHANGED IN THE REBUILD IS THE FIRST ARGUMENT ONLY, AND THAT IS DELIBERATE. It used to be
 *  the funding band her record had bought (`'strong'`), so the argument was a re-statement of the
 *  second one; it is now the PLACE THE PLAYER PICKED, which the function cannot derive and must be
 *  told. The merit-only property is therefore stronger than before rather than weaker: the one new
 *  input is a player decision, and a player decision is not a family's wealth.
 *
 *  ⚠ THE SHAPE IS A RECRUITING BOARD AND IT IS OURS. Her score against the tier's `fullAwardScore`,
 *  clipped at a whole ride and floored so nobody is offered a place and nothing at all. The SAME
 *  record is worth less at a dearer place because a dearer place is a stronger squad – she sits
 *  further down its board. That is the whole of the trade the choice is about.
 *
 *  ⚠ `tests/college-offer.test.ts` sweeps every background, both nationalities, four incomes and four
 *  savings positions against every tier and asserts this number does not move; it is
 *  mutation-verified. */
export function athleticShareOf(tier: CollegeTier, juniorScore: number, rng: Rng): number {
  if (!recruitedAtAll(juniorScore)) return 0
  const board = COLLEGE_TIERS[tier]
  // The programme's own funding, ± the spread. One draw, on a sub-stream (see `collegeOfferFor`).
  const funding = (rng() * 2 - 1) * COLLEGE_OFFER.programmeFundingSpread
  const merit = juniorScore / board.fullAwardScore
  return clamp(merit + funding, COLLEGE_OFFER.minAthleticShare, 1)
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

/** What a quote covers between the two layers, capped at the Bylaw 15.1 ceiling. One expression,
 *  used by the band and by the bill, so the card and the ledger cannot disagree about it. */
export function coveredShareOf(quote: Pick<CollegeQuote, 'athleticShare' | 'needShare'>): number {
  return Math.min(1, quote.athleticShare + quote.needShare)
}

/** ⭐⭐ WHAT A YEAR OF THIS FAMILY'S MONEY IS, and it is a DIFFERENT QUESTION from the means test.
 *
 *  ⚠⚠ NO SHIELD, ON PURPOSE. `familyPositionCents` protects the first $25,000 of savings because a
 *  means test does not expect a family to liquidate its cushion. A family deciding whether it can
 *  afford a place counts the cushion – that is what a cushion is for, and it is the owner's own
 *  sentence: «есть деньги на счете и семья хочет выбрать колледж дороже». Two questions, two numbers,
 *  and folding them into one would have made the dear place unaffordable to every family that had
 *  saved for exactly this.
 *
 *  ⚠ SAVINGS ARE SPREAD OVER THE FOUR YEARS, so this is in the same unit as the bill beside it:
 *  both are "dollars available in a year". ⚠ AND IT FLOORS AT ZERO – a family already in debt can
 *  still enrol (nothing removes the college answer); what it cannot do is call the debt income. */
export function familyCanPayPerYearCents(view: Pick<CollegeRecruitView, 'familyIncomeCents' | 'familyAssetsCents'>): number {
  const savings = Math.max(0, view.familyAssetsCents)
  return Math.max(0, view.familyIncomeCents + Math.round(savings / COLLEGE_OFFER.needTest.assetSpreadYears))
}

/** ⭐⭐ ONE PLACE, PRICED FOR THIS GIRL AND THIS FAMILY. One draw per quote, on the sub-stream the
 *  caller derives (`seed:collegeoffer:<week>`) – never MAIN (CLAUDE.md invariant 2).
 *
 *  ⚠ THE TWO LAYERS ARE METERED TOGETHER AT ONE CEILING, AND THE CEILING IS THE PRICE. Bylaw 15.1: a
 *  student-athlete is ineligible if she *"receives financial aid that exceeds the value of the cost of
 *  attendance"* `[S]`. So `athletic + need` is capped at 1. **The owner guessed this rule exactly**
 *  before being told it, which is recorded in the spec rather than buried here.
 *
 *  ⚠⚠ AND THE TRIM FALLS ON THE NEED LAYER, NEVER ON THE ATHLETIC ONE. Two reasons and both matter:
 *  the sport's own remedy is to reduce INSTITUTIONAL aid (15.1.3), and trimming the athletic award
 *  instead would make a merit number move with family wealth – the exact thing the owner's question
 *  is about. A strong girl from a poor family therefore pays nothing; her award is not shaved to
 *  make room for her need. */
export function quoteFor(tier: CollegeTier, view: CollegeRecruitView, rng: Rng): CollegeQuote {
  const costPerYearCents = COLLEGE_TIERS[tier].costPerYearCents
  const athleticShare = athleticShareOf(tier, juniorRecordScore(view), rng)
  // ⚠ AND THE NEED-BASED LAYER REACHES A WALK-ON TOO, because it was never an athletics thing. Pell is
  // means-tested aid to a STUDENT; a poor American family gets it whether or not a coach ever called.
  const needShare = Math.min(needShareOf(view), 1 - athleticShare)
  const covered = coveredShareOf({ athleticShare, needShare })
  return {
    tier,
    costPerYearCents,
    athleticShare,
    needShare,
    familyPerYearCents: Math.round(costPerYearCents * (1 - covered)),
    open: tierOpenTo(tier, view.country),
  }
}

/** ⭐⭐ THE OFFER – EVERY PLACE SHE COULD TAKE, MEASURED AT ONCE, AND NOBODY HAS PICKED ONE YET.
 *
 *  ⚠⚠ ALL THREE ARE PRICED EVEN THOUGH SHE WILL TAKE ONE, and that is the point of the rebuild: the
 *  owner asked for a CHOICE, and a choice the player cannot see the price of is not one. The card
 *  draws the list; `chosen` stays `null` until she answers.
 *
 *  ⚠ THERE IS NO DEFAULT AND THERE MAY NOT BE. A preselected place is a recommendation drawn in
 *  preselection, and ruling 4 (30.07) forbids this card an opinion about which answer to take.
 *
 *  ⚠ ONE DRAW PER TIER, IN TIER ORDER, ON THE CALLER'S SUB-STREAM. Three draws where round 20 took
 *  one – invisible to the frozen MAIN capture by construction, because the stream is
 *  `seed:collegeoffer:<week>` and is re-derived at the call site. */
export function collegeOfferFor(view: CollegeRecruitView, rng: Rng): CollegeOffer {
  return {
    quotes: COLLEGE_TIER_ORDER.map((tier) => quoteFor(tier, view, rng)),
    chosen: null,
    canPayPerYearCents: familyCanPayPerYearCents(view),
  }
}

/** The quote she actually took, or `null` while the fork is open. ⚠ ONE READER FOR THE LEDGER AND THE
 *  SCREENS ALIKE, so the number the card prints is the number the tick is charging. */
export function chosenQuoteOf(offer: CollegeOffer | null | undefined): CollegeQuote | null {
  if (!offer || offer.chosen === null) return null
  return offer.quotes.find((q) => q.tier === offer.chosen) ?? null
}

/** ⚠ CAN THE FAMILY PAY FOR THIS PLACE OUT OF WHAT IT HAS? A fact for the card, never a verdict:
 *  a family that cannot goes into DEBT, not away (owner, 16.08 – nothing removes the college answer),
 *  and `resolveCollegeBill` will happily take it under water.
 *  ⚠ `null` = the question was never measured (a career migrated from v51). The card prints nothing
 *  rather than guessing – a screen that answered an unmeasured question would be inventing. */
export function canAfford(offer: CollegeOffer, quote: CollegeQuote): boolean | null {
  if (offer.canPayPerYearCents === null) return null
  return quote.familyPerYearCents <= offer.canPayPerYearCents
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

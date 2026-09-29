// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/sponsorship.md#the-sponsorship-block

import type { TierId } from '../season/types'

// THE LOCAL SPONSOR – a shop in her town backing the local girl who is doing well locally.
//
// ⚠ sponsorship: REBUILT 30.07 (tune/rank-numbers).
// ⚠ sponsorship: THE THRESHOLDS ARE DELIBERATELY THE OLD 30 / 10
// ⚠ sponsorship: AND IT IS OPEN TO EVERY BACKGROUND, which is a deliberate difference from its sibling.
// ⚠ sponsorship: AND IT IS PAID IN KIT NOW, NOT IN CASH (31.07, feat/offers-inbox-slice).
// → docs/notes/economy/sponsorship.md#sponsorship
export const sponsorship = {
  /** NATIONAL rank at or inside which a local shop signs her at all. */
  maxRank: 30,
  /** ...and at which the deal steps up - she is one of the best juniors in the country. */
  topMaxRank: 10,
  /** ⚠ ...AND THE JUNIOR TABLE, BECAUSE THE DOMESTIC GATE ON ITS OWN IS INVERTED (09.08, the
   *  owner: «у нас 3 тира этих спонсоров, а мне достается только 1 самый первый… у неё кончился
   *  контракт, а нового не дали»).
   *
   *  ⚠ sponsorship.localMaxItfRank: AND THAT IS THIS BLOCK'S OWN 30.07 ERROR WITH THE TWO TABLES SWAPPED.
   *  ⚠ sponsorship.localMaxItfRank: 128 = `TIERS.j300.drawSize` x 4, AND IT IS THE LADDER'S OWN STEP RUN DOWNWARDS.
   *  ⚠ sponsorship.localMaxItfRank: WHERE IT BITES TODAY, MEASURED, BECAUSE THE NUMBER SHOULD NOT BE TRUSTED WITHOUT THIS.
   *  ⚠ sponsorship.localMaxItfRank: AND IT CANNOT BECOME A PENSION.
   *  → docs/notes/economy/sponsorship.md#sponsorshiplocalmaxitfrank
   */
  localMaxItfRank: 128,
  /** What the season's kit deal is worth, flat, every background the same. `~$1k+/yr value`,
   *  02-tennis-economics.md's figure for a junior product deal, taken at its stated midpoint.
   *  Now a CEILING ON WHAT THE SHOP SPENDS on her kit rather than a cheque - see the note above. */
  seasonCents: 1_000_00,
  /** The stepped-up deal. junior-economics.md: "travel sponsorship only after national/
   *  international wins", and its merit-grant band tops out at £2,000 one-per-player-per-year -
   *  so the better deal is kit plus a hand with the travel, at the top of that band. */
  topSeasonCents: 2_000_00,
  /** The name on the letterhead, and it is READ OFF THE ART rather than invented here: the owner's
   *  own `public/images/sponsors/local.webp` is a racket and a reel of string over the words
   *  "STRING HOUSE – LOCAL. HONEST. TIGHT.". The mark is the signature on the letter, so the two
   *  have to agree; a name picked in this file would have been a second source of truth for the
   *  same shop. ONE rung only - the national and global marks are the brand ladder, which is a
   *  later slice (see `SponsorTier`). */
  localBrand: 'String House',
  /** HOW FRESH THE SHOP KEEPS HER KIT, as a ceiling on `KitWear` (0 = as new, 1 = spent). The
   *  standard deal at 0.5 leaves her at the middle of every service life rather than the dead end;
   *  the stepped-up deal at 0.3 is nearer to always-fresh. Sized SMALL on purpose: the whole
   *  equipment swing is already under one year of relative age (ECONOMY.equipment), so a cap can
   *  only ever be worth a fraction of that, which is the correct order of magnitude for a junior
   *  kit deal and keeps the anti-destiny bound this block's neighbour measures. */
  freshCap: 0.5,
  topFreshCap: 0.3,
  /** WHAT SHE OWES: tournaments entered over the season for the shop to write again. A sponsor
   *  pays to be SEEN, so it wants her playing - and this is the trap the whole design is built
   *  around (spec §4.1): the coach's job is load management and the bench has measured three times
   *  that resting beats racing, so a kit deal is a standing bribe to do the thing that loses.
   *  Sized off what a junior season already contains rather than off what would hurt: six is
   *  roughly the entry cap's own shape at the younger ages, so an ordinary season clears it and a
   *  season spent nursing her does not. */
  minEvents: 6,
  topMinEvents: 8,
  /** HOW LONG THE PARENT HAS TO THINK, in weeks, counted INCLUSIVELY from the week the letter
   *  lands: the deadline is `arrival + decideWeeks - 1` (`kitOfferDeadline`), so five means the
   *  arrival week and the four after it, and the letter is still answerable on the last of them.
   *  The owner asked for exactly this - «давать человеку какое-то время на подумать».
   *
   *  ⚠⚠ sponsorship.decideWeeks: IT BELONGS TO THE LETTER AGAIN, AND IT IS FIVE (28.08, round 28 #17-b, HIS RULING)
   *  owner (sponsorship.decideWeeks), 28.08: «в чем проблема сделать 5?»
   *  ⚠ sponsorship.decideWeeks: WHAT HE IS KNOWINGLY GIVING UP, because the next reader of `docs/specs/sponsor-window-2026-08.md` §3.1…
   *  ⚠ sponsorship.decideWeeks: THE WINDOW ITSELF DID NOT MOVE.
   *  → docs/notes/economy/sponsorship.md#sponsorshipdecideweeks
   */
  decideWeeks: 5,
  /** WHETHER THE SHOP WRITES AT ALL in a season she qualifies for. Not 1, on purpose: an offer
   *  that is guaranteed to come round again is an offer with no cost to letting it expire, and
   *  spec §2 asks for the reverse ("an offer left to expire is gone, and the next one is not
   *  guaranteed to be as good"). Drawn from `seed:offer:<week>` - never the weekly stream. */
  offerChance: 0.7,
  topOfferChance: 0.9,

  // THE BRAND LADDER: the two rungs above the shop (01.08, feat/brand-ladder) – WHY IT EXISTS,
  // in the owner's own case. He finished a season #1 NATIONAL and #13 INTERNATIONAL and asked
  // whether two contracts would arrive. They would not: `kitTermsFor` read only the table above,
  // so a girl who is thirteenth in the world was still being written to by one shop in her town,
  // and by nobody else.
  //
  // ⚠ sponsorship.national: THE RUNG IS COVERAGE, NOT PRESTIGE - see `SponsorTier`.
  // ⚠ sponsorship.national: AND THE TWO UPPER GATES READ THE INTERNATIONAL TABLE, WHICH IS THE POINT.
  // ⚠ sponsorship.national: AND THAT IS THE EXACT ERROR two-ladders.md CAUGHT ONCE
  // → docs/notes/economy/sponsorship.md#sponsorshipnational
  national: {
    /** Read off `public/images/sponsors/national.webp`, which is a wordmark over "STRINGS.
     *  FRAMES. NATIONWIDE." - the coverage this rung ships is on the picture. */
    brand: 'Netrally Distribution',
    /** ⚠ ITF RANK AT OR INSIDE WHICH THEY WRITE, AND IT IS THE J300 MAIN DRAW.
     *  = `TIERS.j300.drawSize`, pinned as an equality in tests/offers.test.ts because this file
     *  cannot import the calendar (calendar.ts imports ECONOMY; the cycle is the reason the number
     *  is written out here rather than computed). A sponsor pays to be SEEN, and J300 is the one
     *  rung in the junior game with a four-figure crowd (900-2,600 against j60's 110-320) - the
     *  lore's "one rung where a junior plays in front of strangers". Inside the world's top 32 she
     *  would fill that draw on merit, which is precisely when a national distributor's logo starts
     *  being worth something. */
    maxItfRank: 32,
    /** ⚠ ...AND THE PROFESSIONAL RANK THAT SAYS THE SAME THING (02.08, the owner: «спонсор вполне
     *  может жить и дальше»). Built exactly as `maxItfRank` above is - off one figure in the tier
     *  table, not picked: National signs the girl who would be IN the prestige draw, and on the
     *  professional side that is W100's acceptance list, `enterPct` 0.25 of the merged W table.
     *  That table is FIELD.size + the cohort (199) + her, so a quarter of it is this number.
     *
     *  ⚠ sponsorship.national.maxWtaRank: 125 -> 350 BY W2-FIELD2, IN TWO STEPS, AND BOTH ARE THE DERIVATION MOVING RATHER THAN A DECISION.
     *  ⚠⚠ sponsorship.national.maxWtaRank: 350 -> 240 (P3, 16.08), AND IT IS THE DERIVATION MOVING FOR THE THIRD TIME RATHER THAN A NEW…
     *  ⚠ sponsorship.national.maxWtaRank: BUT THE DIRECTION IS THE OPPOSITE OF LAST TIME AND THE OWNER SHOULD SEE IT.
     *  ⚠ sponsorship.national.maxWtaRank: WHAT IS NOT DECIDED HERE.
     *  → docs/notes/economy/sponsorship.md#sponsorshipnationalmaxwtarank
     */
    maxWtaRank: 350,
    /** ⚠ ...AND THE DOMESTIC STANDING SHE HAS TO KEEP TO HOLD IT = `maxRank` above, the same top 30
     *  that opens the local shop. This is National's job on the way OUT and the whole reason this
     *  rung is gated on two tables at once: her domestic points are a rolling 52-week best-6, so a
     *  season spent entirely on the international calendar decays them to nothing and she slides
     *  out of this band. The deal ends when she does.
     *
     *  ⚠⚠ sponsorship…keepDomesticRank: AND IT IS NOT THE ONLY WAY TO HOLD THE DEAL ANY MORE (02.08).
     *  → docs/notes/economy/sponsorship.md#sponsorshipnationalkeepdomesticrank
     */
    keepDomesticRank: 30,
    /** TWO SEASONS. `02-tennis-economics.md` puts junior equipment deals at "3-4 year terms"; our
     *  whole junior career is four to six seasons, so the real figure is scaled to the game's own
     *  horizon rather than copied. A term longer than a season is what gives ONE BRAND AT A TIME
     *  its bite: sign this and the global letter that arrives next winter finds her busy. */
    seasons: 2,
    /** WHAT THE SEASON'S KIT IS WORTH, and it is sized on the gear table rather than picked. The
     *  two lines it names cost, over a season: ~$600 working, ~$1,500 middle, ~$4,200 wealthy
     *  (ECONOMY.gear cadences x prices). $3,000 covers both outright for the working and middle
     *  corridors and about two thirds of the wealthy one - which is EXACTLY the relationship
     *  `seasonCents` already has to the single string line ($1,000 against $312 / $625 / $1,495).
     *  Same shape, one rung up, so the ladder's economics are one decision rather than three. */
    seasonCents: 3_000_00,
    /** The stepped-up local deal's own figure, unmoved. ⚠ AND THAT IS DELIBERATE: what a higher
     *  rung buys is MORE LINES, not fresher ones. A second freshness number here would quietly
     *  turn the ladder back into a prestige scale, which is the one thing `SponsorTier` says it is
     *  not. */
    freshCap: 0.3,
    /** WHAT SHE OWES. The pair above steps 6 -> 8; this rung and the one above it keep walking the
     *  block's own step of two. It is the design's best trap and it has to get worse as the deal
     *  gets better: the coach's job is load management, the bench has measured three times that
     *  resting beats racing, and a bigger cheque is a bigger standing bribe to do the thing that
     *  loses. Ten is comfortably inside the ITF's own annual allowance at the ages that reach this
     *  rung (25 at sixteen, unrestricted at seventeen), so it is a choice and never a wall. */
    minEvents: 10,
  },
  global: {
    /** Read off `public/images/sponsors/global.webp` - a wordmark over "EQUIP. SUPPORT.
     *  ELEVATE.", which is this rung's three promises in the artwork's own words. */
    brand: 'Play Beyond',
    /** ⚠ THE LAST EIGHT OF THAT SAME DRAW = `TIERS.j300.drawSize / 4`, pinned in the tests beside
     *  `national.maxItfRank` for the same reason. National signs the girl who would be IN the
     *  prestige draw; global signs the one who would still be in it on the last day. Both numbers
     *  therefore come off ONE figure in the tier table, which is what keeps the ladder's shape a
     *  reading of the game rather than two round numbers picked to feel right.
     *
     *  It leaves the owner's own #13 season one rung short, and that is the intended answer rather
     *  than an accident: the calendar's standing rule is that "there must ALWAYS be somewhere to
     *  go". */
    maxItfRank: 8,
    /** ⚠ THE PROFESSIONAL FIGURE, and it is the same reading one rung up (02.08): National signs
     *  the girl who would be in the prestige draw, Global the one who would still be in it on the
     *  last day - the last quarter. Junior: 8 of the J300's 32. Professional: 87 of the 350 who
     *  would be accepted into a W100 (`national.maxWtaRank` / 4, rounded down as the junior pair
     *  divides exactly). Pinned beside its neighbour in tests/offers.test.ts.
     *
     *  ⚠ sponsorship.global.maxWtaRank: 31 -> 87 BY W2-FIELD2, for exactly the reason its neighbour carries…
     *  ⚠⚠ sponsorship.global.maxWtaRank: 87 -> 60 BY P3 (16.08), THE SAME DERIVATION FOLLOWING THE SAME SOURCE - `national`
     *  ⚠ sponsorship.global.maxWtaRank: AND IT SQUEEZES THIS RUNG'S BAND HARD ENOUGH THAT THE OWNER SHOULD SEE IT.
     *  ⚠⚠ sponsorship.global.maxWtaRank: AND A BAND TEN RANKS WIDE IS NOT A BAND - which is the reason this rung is where the defect…
     *  ⚠ sponsorship.global.maxWtaRank: WHETHER 87 IS STILL RIGHT IS THE OWNER'S CALL AND IS DELIBERATELY NOT TAKEN HERE.
     *  → docs/notes/economy/sponsorship.md#sponsorshipglobalmaxwtarank
     */
    maxWtaRank: 87,
    /** THREE SEASONS - the top of `02-tennis-economics.md`'s "3-4 year terms", scaled the same way
     *  `national.seasons` is. Signing it is the biggest commitment in the game: everything is
     *  covered, and nothing else can be signed until it runs out. */
    seasons: 3,
    /** ⚠ "EVERYTHING" HAS TO MEAN EVERYTHING, and that is what sizes this. All three lines cost
     *  ~$900 working, ~$2,020 middle, ~$4,700 wealthy over a season, so $5,000 clears the most
     *  expensive corridor in the game outright. Every other rung's allowance is a ceiling the
     *  letter is honest about ("up to"); this one is the rung whose letter says "everything", so
     *  it must not be a promise that runs out in October for a wealthy family. */
    seasonCents: 5_000_00,
    /** The same ceiling again, and see `national.freshCap`: the rung buys lines, not freshness. */
    freshCap: 0.3,
    /** The step of two, once more: 6 -> 8 -> 10 -> 12. */
    minEvents: 12,
    /** ⚠ A HAND WITH THE TRAVEL - the one thing no other rung does, and the reason this is the top
     *  of the ladder rather than just a third line of kit. `junior-economics.md`: "travel
     *  sponsorship only after national/international wins", which is exactly this gate.
     *
     *  ⚠ sponsorship.global.travelShare: NOT MEASURED ON THE ECON BENCH YET.
     *  → docs/notes/economy/sponsorship.md#sponsorshipglobaltravelshare
     */
    travelShare: 0.25,

    // ⭐⭐ ROUND 29 PART TWO #5 – THE CASH THIS RUNG NEVER HAD, AND IT IS THE OWNER'S RULING ON A
    // DEFECT THE SPEC ITSELF PREDICTED AND NOBODY EVER TOOK TO HIM. – HIS WORDS: «мировые топы
    // должны иметь все возможности достучаться до топовой спортсменки.»
    //
    // ⚠ sponsorship.global.retainerCents: `tools/sponsor-ladder-reach.ts` prints it as a line, and…
    // ⚠⚠ sponsorship.global.retainerCents: AND IT WAS PREDICTED AT DESIGN TIME.
    // ⚠ sponsorship.global.retainerCents: THE FIX IS THE TERMS AND NOT THE GATE, on his instruction.
    // ⚠ sponsorship.global.retainerCents: STRICTLY BETTER AND NOT MERELY EQUAL, ON PURPOSE.
    // ⚠ sponsorship.global.retainerCents: AND IT STAYS INSIDE THE CHAIN ABOVE IT
    // → docs/notes/economy/sponsorship.md#sponsorshipglobalretainercents
    retainerCents: 2_000_00,
    /** ⭐ THE RESULT BONUS, AND HERE THE HONEST NUMBER IS EXACTLY TOUR'S. The share ladder is
     *  20% → 25% → 30% across tour → premium → icon and the reach is w75 → w50 → w50; inserting a
     *  fourth value between 20 and 25 would be inventing a number to fill a gap the design does not
     *  have. Taking tour's pair verbatim keeps the whole chain non-decreasing (20 / 20 / 25 / 30,
     *  w75 / w75 / w50 / w50) and adds nothing to retune.
     *
     *  ⚠ WHY THE MONEY LADDER STEPS ON THE RETAINER AND NOT HERE. A retainer is a promise about
     *  HER; a result bonus is a share of a cheque she has to go and win. This rung's own step up
     *  over `tour` is a longer, safer term, so the term-shaped money is where its step belongs. */
    bonusShare: 0.2,
    bonusFromTier: 'w75' as TierId,
  },

  // THE PROFESSIONAL RUNGS: tour / premium / icon (W3-ACT2, act2-pro-tour.md section 7) – The
  // owner asked for a proposal («да, надо продумать, предложи что-то») and this is it, built.
  // → docs/notes/economy/sponsorship.md#sponsorshiptour
  tour: {
    /** The first brand that signs a PROFESSIONAL rather than a prospect. Fictional, like every
     *  organisation name in this game (ITF/WTA/ATP and the majors are trademarks). */
    brand: 'Baseline Athletic',
    /** WTA <= 200, the spec's own gate: inside the top 200 she is a working professional whose
     *  name appears on a draw sheet somebody reads. Below `national`'s 350 and above `global`'s
     *  87, which is what makes the chain monotone. */
    maxWtaRank: 200,
    /** ...and NO junior arm at all, which is the point of the rung. `national` and `global` read
     *  BOTH tables because they were built for a junior and learned to read a professional; these
     *  three read one table, because a brand that signs on a WTA ranking is not interested in a
     *  girl who has not got one. `standingClears` treats a missing `maxItfRank` as "no junior
     *  door", never as "open to anyone". */
    seasons: 2,
    /** Everything she wears - the same three lines `global` covers. The LADDER STOPS BEING ABOUT
     *  COVERAGE HERE and starts being about money, which is the honest reading: there is no fourth
     *  line of kit to promise, so a bigger deal has to pay her instead. */
    seasonCents: 5_000_00,
    freshCap: 0.3,
    /** The step of two continues: 6 -> 8 -> 10 -> 12 -> 14. */
    minEvents: 14,
    travelShare: 0.25,
    /** $1,500 a quarter = $6,000 a season, the middle of section 7's own "~$3-8k/yr" band. */
    retainerCents: 1_500_00,
    /** RESULT BONUSES AT W75 AND ABOVE (section 7 verbatim), at a fifth of the cheque. A W75 title
     *  is $9,000, so the bonus is $1,800 - a real number that is not a second prize table. */
    bonusShare: 0.2,
    bonusFromTier: 'w75' as TierId,
  },
  premium: {
    brand: 'Meridian Sport',
    /** WTA <= 50 - the spec's gate, and the same number the mandatory regime binds at. That is not
     *  a coincidence worth hiding: the top 50 is where the tour starts requiring her presence, and
     *  it is exactly where a brand starts paying for it. */
    maxWtaRank: 50,
    seasons: 3,
    seasonCents: 8_000_00,
    freshCap: 0.3,
    minEvents: 16,
    travelShare: 0.5,
    /** x5 the tour rung, the bottom of section 7's «retainer x5-10»: $7,500 a quarter, $30,000 a
     *  season. */
    retainerCents: 7_500_00,
    /** APPEARANCE FEES - the new income line section 7 names, "real at 250s". $15,000 to be on the
     *  poster of a WTA 250 or better, paid when she actually plays it. */
    appearanceFeeCents: 15_000_00,
    appearanceFromTier: 'wta250' as TierId,
    /** ...and the bonus schedule reaches further down the ladder AND up to the Slam rounds, which
     *  is section 7's own phrase - it is the same share against a prize table that now runs to
     *  $3M, so a Slam semi-final bonus is six figures without a second table existing. */
    bonusShare: 0.25,
    bonusFromTier: 'w50' as TierId,
  },
  icon: {
    brand: 'Aurelia',
    /** WTA <= 10, section 7's gate. Its «or a Slam semi-final» half is deliberately NOT modelled as
     *  a second predicate: a Slam semi-final under the shipped points table is 780 points from one
     *  event, which on the real curve the merged table now carries puts her inside the top ten by
     *  arithmetic anyway. One gate that both routes satisfy beats two that can disagree - and if a
     *  future table breaks that equivalence, the honest fix is a second clause here with its own
     *  measurement, not a guess now. */
    maxWtaRank: 10,
    /** FOUR SEASONS - the top of `02-tennis-economics.md`'s "3-4 year terms", and long enough that
     *  signing it really is the last contract decision a career makes. */
    seasons: 4,
    seasonCents: 12_000_00,
    freshCap: 0.3,
    /** The step of two would give 18; it stops at 16 instead, and that is the one place this ladder
     *  declines to get worse as it gets better. A top-10 player's calendar is largely the mandatory
     *  regime's (act2-pro-tour.md section 6: four Slams, the 1000s and six 500s bind the top 50),
     *  so an obligation ABOVE what the tour already compels would be two systems demanding the same
     *  weeks and one of them fining her for it. The trap this block is proud of stays a trap right
     *  up to the rung where it would stop being one. */
    minEvents: 16,
    travelShare: 0.75,
    /** x5 again: $37,500 a quarter, $150,000 a season. */
    retainerCents: 37_500_00,
    appearanceFeeCents: 40_000_00,
    appearanceFromTier: 'wta250' as TierId,
    bonusShare: 0.3,
    bonusFromTier: 'w50' as TierId,
  },
} as const

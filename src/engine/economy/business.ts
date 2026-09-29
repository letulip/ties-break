// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/business.md#the-business-block

// --- THE PARENT'S BUSINESSES (round 29 part four P7 – merch and the academy that earns) --------
//
// His order, verbatim: «нам нужен мерч, растущий от частоты и обилия рекламных контрактов,
// съемок, выступлений, титулов и прочего» and «нам нужна академия, которая зарабатывает».
//
// ⚠ TWO INSTRUMENTS, TWO AXES, DELIBERATELY (P7's own chain): merch follows FAME – the fold over
// contracts, shoots and titles he listed, which is NOT rank – and the academy follows
// SEASONS-IN-BAND (reputation, the P2 ruling «чем выше и дольше место – тем выше доход»). The
// two are different numbers in this game and the businesses keep them apart.
//
// ⚠⚠ INCOME ONLY, NEVER NEGATIVE – «мы ни за что не наказываем». Both lines are the NET of a
// business that simply sells less when nobody is looking; zero is their floor by construction.
// ⚠ ZERO DRAWS ON ANY STREAM: both are arithmetic on persisted records (world/business.ts).
export const business = {
  merch: {
    /** ⭐ WHAT ONE POINT OF FAME SELLS, in cents a week – the merch dial's SCALE. At fame 10 (a
     *  few small titles) the brand pays ≈ the index fund on its $250,000 price; that anchor is the
     *  one end of the curve that was already right, and round 30 #23 kept it to the cent by
     *  pivoting the new curve on it (`famePivot`). Sized originally against the round-29
     *  counterweight gap: the 10% commission costs the MEDIAN career ≈ $130k of peak wallet.
     *
     *  ⚠ IT IS NO LONGER THE WHOLE DIAL – see `famePivot` directly below. Reading this constant
     *  alone as «dollars per fame point» has been true only up to fame 10 since round 30 #23. */
    perFamePointCents: 3_000,
    /** ⭐⭐⭐ ROUND 30 #23 – THE PIVOT OF THE CONVEX INCOME CURVE, in fame points: weekly =
     *  perFamePointCents x fame² / famePivot
     *
     *  owner (business.merch.famePivot): «проанализировать и скорректировать доход мерча»
     *  ⚠⚠ business.merch.famePivot: AND THE SHAPE IS FORCED, NOT CHOSEN.
     *  ⚠ business.merch.famePivot: TEN IS THE ANCHOR'S OWN FAME AND NOT A FREE PARAMETER.
     *  → docs/notes/economy/business.md#businessmerchfamepivot
     */
    famePivot: 10,
    /** ⭐⭐⭐ ROUND 30 #23/#24 – WHAT THE CAREER ADDS TO THE BRAND'S MULTIPLE. The arithmetic is
     *  `world/brand.ts`; this is its ladder.
     *
     *  owner (business.merch.value): «У нас есть её профессионализм, сколько играет, сколько выигрывает»…
     *  ⚠⚠ business.merch.value: THEY MOVE THE WORTH AND NOT THE INCOME, WHICH IS THE POINT OF THEM.
     *  ⚠ business.merch.value: AND NOTHING HERE IS SUBTRACTED.
     *  owner (business.merch.value), 31.08: «мы ни за что не наказываем»
     *  ⚠⚠ business.merch.value: ROUND 32 #3 (31.08) AMENDED THE PARAGRAPH ABOVE AND IT IS NAMED HERE RATHER THAN QUIETLY LEFT WRONG.
     *  owner (business.merch.value): «главное, чтобы эта известность участвовала в механизме»
     *  → docs/notes/economy/business.md#businessmerchvalue
     */
    value: {
      /** ⭐⭐⭐ ROUND 32 #3, 31.08 – THE MULTIPLE A BRAND NOBODY HAS HEARD OF EARNS, and the bottom of
       *  the fame ramp that replaced the flat base. The arithmetic is `world/brand.ts`.
       *
       *  owner (business.merch.value.unknownX): «личный бренд в цене подрос с 250к до 1.8м, а доход у него 1800 в неделю =))) что»…
       *  owner (business.merch.value.unknownX): «её известность 22.3 – да, это ок, главное, чтобы **эта известность участвовала в»…
       *  ⚠⚠ business.merch.value.unknownX: THE DEFECT WAS THAT `earningsMultipleX` WAS THE WHOLE BASE AT EVERY FAME.
       *  owner (business.merch.value.unknownX): «вроде бы как раз спонсорские коллаборации со спортсменами дают и не такое»…
       *  ⚠⚠ business.merch.value.unknownX: 2.5 IS THE HIGHEST VALUE THAT STILL READS SINGLE DIGITS AT THE FAME HE ASKED ABOUT
       *  → docs/notes/economy/business.md#businessmerchvalueunknownx
       */
      unknownX: 2.5,
      /** ⭐ «ОНА ЖЕ ТОП-20 В МИРЕ» – the end-rank a finished season has to beat to count as one of
       *  her top seasons. ⚠ The SAME 20 as `fame.seasonEndBands`' new rung, and deliberately: #24
       *  is one claim about one number, and a brand that valued «top-20» differently from the fame
       *  floor that pays it would be two answers to his one question. */
      topEndRank: 20,
      /** «сколько играет» – per finished PROFESSIONAL season (one carrying a WTA end-rank). */
      seasonX: 0.2,
      seasonCapN: 12,
      /** «она же топ-20» – per season ended inside `topEndRank`. The heaviest rung, because it is
       *  the one he has raised three times. */
      topSeasonX: 0.3,
      topSeasonCapN: 8,
      /** ⭐⭐ «как глубоко проходит» – per professional final REACHED AND LOST (`TierTrophies .finals`,
       *  every tier `fame.titleFloor` names). ⚠ Round 30 #24 established that there is no ledger
       *  below a final, which is true and which is why a quarter-final cannot count; it does not stop
       *  a FINAL counting, and the fame floor reads `finals` only at 'slam', so every lost final from
       *  w15 to wta1000 is a dated professional result nothing in this game has ever read.
       *
       *  ⚠⚠ business.merch.value.finalX: ROUND 34 #17 (03.09) – AND NOW THE FINALS ARE IN THE INCOME TOO (`fame.finalFloorShare`)
       *  → docs/notes/economy/business.md#businessmerchvaluefinalx
       */
      finalX: 0.1,
      finalCapN: 12,
      /** «сколько выигрывает» – her WTA-track career win rate, as a share of the window below. A
       *  career at or under `winRateFrom` adds nothing and is charged nothing. */
      winRateX: 1.0,
      winRateFrom: 0.6,
      winRateTo: 0.85,
      /** the ceiling on the whole multiple, base included. ⚠ IT BINDS THE TOP OF THE SHELF: at fame
       *  100 the convex curve pays $1.56M a year, so this is what decides whether the best career in
       *  a run exits at the RF mark's ~$27M or somewhere absurd. Sized in
       *  docs/specs/brand-worth-and-income-2026-08.md against the researched valuations rather than
       *  picked.
       *
       *  ⚠⚠ business.merch.value.maxX: ROUND 32 #3 – AND IT IS NO LONGER WHAT HOLDS THE TOP, WHICH IS THE MEASUREMENT THAT WAVE WAS ASKED…
       *  → docs/notes/economy/business.md#businessmerchvaluemaxx
       */
      maxX: 20,
    },
    /** ⭐⭐⭐ ROUND 30 #23, 30.08 – THE ROOM SHE PLAYS IN. Its own block, and the arithmetic is
     *  `world/brand.ts`' `brandCrowdMult`.
     *
     *  owner (business.merch.crowd), 30.08: «у нас есть понимание коридора зрителей на каждом турнире»…
     *  ⚠⚠ business.merch.crowd: THE CORRIDOR, NEVER THE DRAW.
     *  ⚠ business.merch.crowd: IT MULTIPLIES THE INCOME, CENTRED ON 1, AND IS BOUNDED BOTH WAYS
     *  → docs/notes/economy/business.md#businessmerchcrowd
     */
    crowd: {
      /** ⭐⭐ THE ROOM THE MULTIPLIER IS CENTRED ON, in people, AND IT IS MEASURED RATHER THAN
       *  PICKED: the median room a family is playing in the week it can first afford the brand.
       *  ⚠ THAT POPULATION AND NOT THE CAREER-WIDE ONE, on purpose – centring on the career-wide
       *  median (≈2,277) is what the first draft did, and it moved round 30 #9's day-one worth by
       *  4.4% because a young career plays smaller rooms than an old one. Centring here is what
       *  makes the term neutral on the day the decision is made.
       *  ⚠⚠ SOLVED BACKWARDS FROM THE BENCH RATHER THAN GUESSED, twice. 1,500 (the first draft's
       *  guess) moved the day-one worth −4.4%; 1,250 (the measured median room at first
       *  affordability) still left −2.8%, because the population's rooms straddle the clamp and the
       *  median of a clamped ratio is not the ratio of the medians. 940 is the value at which the
       *  MEDIAN DAY-ONE MULTIPLIER IS 1.00 and round 30 #9's anchor comes back to the cent it was
       *  published at. The criterion is the anchor, so the criterion sets the constant. */
      refRoom: 940,
      /** ⚠⚠ A TENTH-POWER, AND THE FIRST DRAFT'S QUARTER WAS MEASURABLY WRONG. At 0.25 the term
       *  ran 0.85–1.35 with BOTH clamps binding inside the deciles, pushed the best career's income
       *  to $2.1M/yr – through the ceiling of the researched band – and moved the day-one anchor.
       *  It was not tilting the answer, it was carrying it, and since the room is 0.93-correlated
       *  with fame (spec §5) an amplifier here is mostly a second fame ramp. At 0.10 the term is a
       *  tilt: what survives is the part of the room that rank does NOT predict, which is the only
       *  part worth having. */
      exponent: 0.1,
      minMult: 0.9,
      maxMult: 1.15,
    },
    /** ⭐⭐⭐ ROUND 32 #4 (31.08) – THE BRAND'S SECOND, SLOWER STOCK. `world/brandStrength.ts` is the
     *  arithmetic and docs/specs/brand-inertia-2026-08.md is why.
     *
     *  owner (business.merch.strength), 31.08: «А еще интересно, что будет происходить с годами падения в таблице (как у нее сейчас)»…
     *  owner (business.merch.strength): «Инерция бренда – звучит интересно, давай попробуем»
     *  ⚠⚠ business.merch.strength: THE MEASUREMENT THAT FORCED IT, off his own week-933 career projected five years with nothing won…
     *  ⚠ business.merch.strength: HIS RULING, both halves…
     *  → docs/notes/economy/business.md#businessmerchstrength
     */
    strength: {
      /** ⭐⭐ THE STOCK'S HALF-LIFE, IN WEEKS – four years against fame's two. «с полураспадом в
       *  годах» as a number: two seasons after a reign the brand is still worth ~70% of it, four
       *  years ~50%, and it lands on the floor below rather than on zero. ⚠ It must be LONGER
       *  than `ECONOMY.fame.halfLifeWeeks` or there is no second stock at all – only fame wearing
       *  a slower coat, and the split the spec exists for collapses. */
      /** ⚠⚠ ROUND 38 #2c RAISED THIS 208 -> 312 (six years). The owner: «делая его более плавным».
       *  208 made the STOCK fall 15.9% a season, which – once `retention` below let the stock
       *  govern the tail at all – was the whole of the slope he was complaining about. Measured
       *  with it: his week-1115 career's brand falls 23.3% a season instead of 27.2%, and its
       *  five-year tail holds $822,515 instead of $185,285. */
      halfLifeWeeks: 312,
      /** ⭐⭐ ...AND THE FLOOR, AS A SHARE OF HER OWN PEAK. A career that was genuinely big never
       *  prices at the minimum however long the silence runs; a career that was never noticed has
       *  a peak of nothing and a floor of nothing, so this hands an unknown exactly zero.
       *  ⚠ IT IS A SHARE AND NOT A FLOOR IN POINTS, which is the personal half of his ruling: 0.4
       *  of a Slam champion's peak is a large brand and 0.4 of a club player's is still nothing.
       *
       *  ⚠⚠ ROUND 38 #2c RAISED THIS TO 0.5 AND THE OWNER SENT IT BACK THE SAME DAY, so it is 0.4
       *  again – his own round-32 number, untouched. His words, 07.09: «он вполне может падать и на
       *  185к и ниже, особенно если давно не было рекламных контрактов… А ставить планку "не ниже
       *  662к" – это немного странно, кому нужен бренд, если он пустой?» ⚠ THE MEASUREMENT THAT
       *  PROMPTED THE RAISE STANDS AND IS NOT THE ARGUMENT FOR IT: 0.4 / 0.5 / 0.55 / 0.65 are
       *  IDENTICAL at every live week on 29 of his careers and differ only in where the fall stops,
       *  five years out. What he is asking is whether it should stop at all, and that is a design
       *  question about the FORMULA rather than a value for this constant – see
       *  docs/specs/fame-presence-2026-09.md §5. */
      floorShare: 0.4,
      /** ⭐⭐⭐ REVISION (31.08) – HOW MUCH OF THE STOCK STILL SELLS SHIRTS, 0..1. THE OWNER, reading
       *  the first shipped result and stopping it: «меня смущает вот это: На пятом году бренд стоит
       *  $166 060 при годовом доходе $1 352».
       *
       *  ⚠⚠ business.merch.strength.retention: HE IS RIGHT AND THE FAULT WAS THE SPEC'S.
       *  ⚠⚠ business.merch.strength.retention: AND THE SIZE IS MEASURED AGAINST THE ONE DOCUMENTED CASE THIS REPO HOLDS OF AN OFF-COURT…
       *  ⚠ business.merch.strength.retention: It is a BOUND drawn from one case and not a law; the frontier either side of it is in…
       *  ⚠⚠ business.merch.strength.retention: ROUND 38 #2c RAISED THIS 0.78 -> 0.95, AND IT IS THE DIAL THAT MAKES THE OTHERS WORK.
       *  ⚠ business.merch.strength.retention: IT STAYS BELOW 1 AND THAT IS LOAD-BEARING
       *  → docs/notes/economy/business.md#businessmerchstrengthretention
       */
      retention: 0.95,
    },
    /** ⭐⭐⭐ ROUND 34 #17 (03.09) – THE BRAND FOLLOWS THE CONTRACTS. Approved by the owner: **+1
     *  point of reach per $50,000 of LIVE annual contract value, the contribution capped at +30.**
     *
     *  ⚠⚠ business.merch.contracts: THE INCOHERENCE IT ENDS, MEASURED ON HIS OWN WEEK-569 SAVE.
     *  owner (business.merch.contracts): «плюс есть мощные рекламные контракты… мне кажется нам надо улучшить формулу рассчета»…
     *  ⚠⚠ business.merch.contracts: A SIGNAL INTO REACH, NEVER A CASH TRANSFER, and that distinction is the whole safety of it.
     *  ⚠ business.merch.contracts: AND THE TOTAL IS STILL CLAMPED AT `ECONOMY.fame.cap`
     *  → docs/notes/economy/business.md#businessmerchcontracts
     */
    contracts: {
      /** cents of live annual contract value per point of reach */
      famePerCents: 50_000_00,
      /** ...and the most the whole term may ever add */
      fameCap: 30,
    },
  },
  academy: {
    /** ⭐⭐ WHAT EACH DELIVERED STAGE BRINGS IN AT REPUTATION 1.0, in cents a week, keyed by the
     *  catalogue's own stage ids. THE SHAPE IS THE ROUND-29 REACHABILITY PROPOSAL'S OWN TABLE (the
     *  ledger, part three): the land is a field and earns nothing; the courts rent; the clubhouse
     *  lodges; the staff run the programmes that are the business.
     *
     *  ⚠ business.academy.stageIncomeCents: SIZED A QUARTER ABOVE THE PROPOSAL'S $5,750 BASE ($7,250), AND MEASURED BEFORE IT WAS KEPT
     *  → docs/notes/economy/business.md#businessacademystageincomecents
     */
    stageIncomeCents: {
      'academy-land': 0,
      'academy-courts': 95_000,
      'academy-building': 250_000,
      'academy-staff': 380_000,
    } as Record<string, number>,
    /** ⭐ REPUTATION – the fold over `seasonHistory[].byTrack.wta.endRank` the round-29 ledger
     *  proposed and P2 ruled («чем выше и дольше место – тем выше будет доход»): 1.0 base, plus the
     *  BEST band of each finished season, counted once per season, capped below. A season with no
     *  recorded WTA end-rank (pre-v46 rows, null ranks) counts nothing – «not recorded» is not
     *  «top-100». ⭐⭐⭐ ROUND 34 #17 (03.09) – THE LADDER REACHES BELOW THE TOP 100.
     *
     *  ⚠⚠ business.academy.reputationBands: WHAT IT ENDS, measured on his own save: eleven seasons, eight of them carrying a WTA end-rank…
     *  → docs/notes/economy/business.md#businessacademyreputationbands
     */
    reputationBands: [
      { maxEndRank: 10, add: 0.6 },
      { maxEndRank: 25, add: 0.35 },
      { maxEndRank: 50, add: 0.2 },
      { maxEndRank: 100, add: 0.1 },
      { maxEndRank: 150, add: 0.05 },
      { maxEndRank: 250, add: 0.025 },
    ] as readonly { maxEndRank: number; add: number }[],
    /** ⭐⭐⭐ ROUND 34 #17 (03.09) – THE CAP GROWS WITH THE CAREER instead of the flat 4-for-ever it
     *  was: `reputationCapBase + reputationCapPerSeason x professional seasons played`. Approved by
     *  the owner at 4 + 0.5 – «so a long professional career is worth something and a short one is
     *  not».
     *
     *  ⚠⚠ business.academy.reputationCapBase: AND THE MEASURED CONSEQUENCE IS THAT IT STOPS BINDING AT EVERY REALISTIC CAREER LENGTH
     *  ⚠ business.academy.reputationCapBase: AND IT MOVES THE P7 PAYBACK WINDOW.
     *  → docs/notes/economy/business.md#businessacademyreputationcapbase
     */
    reputationCapBase: 4,
    reputationCapPerSeason: 0.5,
    /** ⭐⭐⭐ ROUND 38 #8 (07.09) – HOW MUCH ONE POINT OF REPUTATION ADDS TO WHAT THE ACADEMY IS
     *  WORTH, as a share of the drifted price. `worth = paid x (1+300bps)^years x (1 +
     *  premiumPerRep x (reputation − 1))`. Option C, which the owner approved out loud: «хорошо
     *  звучит».
     *
     *  ⚠⚠ business.academy.premiumPerRep: IT STARTS AT EXACTLY ZERO AND THAT IS THE DESIGN, not a coincidence of the number.
     *  ⚠ business.academy.premiumPerRep: MEASURED ON HIS OWN WEEK-1115 CAREER rather than argued…
     *  ⚠ business.academy.premiumPerRep: AND IT DOES NOT COMPOUND.
     *  ⚠ business.academy.premiumPerRep: At the reputation cap a long elite career can reach (8.2 on twelve top-10 seasons) the premium is…
     *  → docs/notes/economy/business.md#businessacademypremiumperrep
     */
    premiumPerRep: 0.15,
  },
} as const

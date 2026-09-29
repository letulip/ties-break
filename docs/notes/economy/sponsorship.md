---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The sponsorship block

The comment essays that stood above the `sponsorship` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `sponsorship`

```ts
  // THE LOCAL SPONSOR – a shop in her town backing the local girl who is doing well locally.
  //
  // ⚠ REBUILT 30.07 (tune/rank-numbers). It was a "product-sponsorship valve": a PERCENTAGE
  // discount (half / free) on each gear line-item, gated on `world.kidRank`. Both halves were
  // wrong, and in two different ways.
  //
  // THE GATE WAS WRONG IN KIND, not in degree. `world.kidRank` is her INTERNATIONAL rank, and a
  // local sponsorship is by concept a DOMESTIC-ladder reward. Gating a shop in her home town on a
  // world junior ranking is the same category of error as the two rank writers this branch fixed:
  // an award for domestic prominence denominated in a currency she does not hold. Measured over 120
  // seeds x 208 weeks it therefore fired for NOBODY, in ANY preset, in ANY season - her ITF rank
  // sits at #89-#109 and the gate wanted #30. Her NATIONAL rank sits at #8-#18, which is what a
  // local shop would actually be looking at. So the gate reads the national table.
  //
  // THE AMOUNT WAS WRONG BECAUSE IT SCALED WITH THE FAMILY'S OWN SPENDING. A share of a gear bill
  // is a share of a bill that runs through the wealth corridor (a wealthy family's racket is
  // $480-650 against a working family's $60-120, bought more often), so the same "half price" paid
  // the wealthy family $2,384 a season against the working family's $348 - seven times - measured
  // on the national gate. A local shop's cheque does not know how rich the family is. So the amount
  // is FLAT: the same figure for every background, and it is the whole mechanic's shape rather than
  // a multiplier on something else.
  //
  // WHY A SEASON'S GRANT RATHER THAN A PER-PURCHASE DISCOUNT. Three reasons, and the third is
  // decisive:
  //   * the sources denominate it that way. docs/research/02-tennis-economics.md: junior equipment
  //     sponsorship is "mostly product-only (racquets/strings/shoes, ~$1k+/yr value), 3-4 year
  //     terms". The deal IS an annual value, not a discount rate;
  //   * ECONOMY.academy.kitCentsAtFull already made this exact call for the same reason, and its
  //     comment says so: paid "as money rather than as a gear discount because it arrives once a
  //     year, not per purchase";
  //   * a per-purchase cap CANNOT be flat. The wealthy family buys 39 kit items a year against the
  //     working family's 25 (ECONOMY.gear cadences), so any per-item figure pays it ~1.6x more
  //     however the cap is drawn. Only a per-SEASON figure is actually flat.
  //
  // AND IT IS MORE VISIBLE, which is the other half of item 27. The old valve was smeared across
  // 25-39 invisible line-items; two-ladders.md measured the sibling cash cameo losing 3.10 gifts a
  // season down to 0.65 still on screen at season end, because the snapshot keeps only the trailing
  // 60 events. One annual lump in the `sponsor` income category survives that window.
  //
  // ⚠ THE THRESHOLDS ARE DELIBERATELY THE OLD 30 / 10, moved table but not moved number, so the
  // owner can read the change as "same gate, honest ladder, flat cheque" rather than having to
  // attribute a threshold move at the same time.
  //
  // ⚠ AND IT IS OPEN TO EVERY BACKGROUND, which is a deliberate difference from its sibling. The
  // random `ECONOMY.sponsor` cameo is need-based (`eligible: ['working']`) because it is a gift. This
  // is not a gift - it is EARNED, on the national ladder, and a shop backing the local girl does not
  // audit her parents' income. Means-testing it would also make the mechanic unmeasurable at the top
  // end, and how ruinous the road actually is up there is an open question rather than a settled one.
  // The wealthy family's numbers are reported alongside everybody else's in two-ladders.md §2.
  // ⚠ AND IT IS PAID IN KIT NOW, NOT IN CASH (31.07, feat/offers-inbox-slice). The owner's first
  // rung on docs/specs/offers-and-the-inbox.md's ladder of instruments: «кит вместо денег». Nothing
  // above changes - the gate is the same national table, the figure is the same figure - but the
  // money never reaches the balance. The shop pays her racquet / string / shoe bills as they land
  // until `seasonCents` of them have been paid, and keeps her kit fresh while it does.
  //
  // WHY THAT IS NOT THE VALVE THIS BLOCK ALREADY REJECTED, which is the first question a reader of
  // the argument above should ask. The old valve was a PERCENTAGE of each gear line with no ceiling,
  // so it paid a share of a corridor-scaled bill and handed the wealthy family $2,384 against the
  // working family's $348. This is the per-SEASON figure the paragraph above calls the only flat
  // shape there is - it is simply SPENT on kit rather than handed over, and a family cannot spend
  // more of it by being rich. The direction of the residual difference is also the honest one: a
  // working family's covered lines run to roughly the whole allowance, so she gets her kit paid for,
  // and a wealthy family's run far past it, so the shop covers a slice of a bill she could always
  // afford. And the FRESHNESS half is flat by construction (see `freshCap`) and worth most to
  // exactly the family that was stretching a string bed past its life.
  //
  // WHY IT HAD TO BECOME A DECISION. `02-tennis-economics.md` calls a junior deal "mostly
  // product-only (racquets/strings/shoes, ~$1k+/yr value)" - which is what this block has been
  // paying in cash for want of a mechanism. Main now carries equipment condition, so there is
  // somewhere real for the product to land, and once it lands somewhere real it is worth being asked
  // about. See engine/offers.ts.
```

## `sponsorship.localMaxItfRank`

```ts
    /** ⚠ ...AND THE JUNIOR TABLE, BECAUSE THE DOMESTIC GATE ON ITS OWN IS INVERTED (09.08, the owner:
     *  «у нас 3 тира этих спонсоров, а мне достается только 1 самый первый… у неё кончился контракт,
     *  а нового не дали»).
     *
     *  THE DEFECT, ON HIS OWN SAVE. Olivia at week 104 stands national #67, ITF #4, no professional
     *  ranking. She CLEARS `global` and she CLEARS `national` - and `local` REFUSED her, because the
     *  only evidence the shop would look at was `maxRank` above and she had slid to #67 at home by
     *  playing abroad. Her five-week window therefore carried two letters instead of three, both dice
     *  missed (0.3 x 0.3 = 9%), and she opened the season with no deal at all.
     *
     *  ⚠ AND THAT IS THIS BLOCK'S OWN 30.07 ERROR WITH THE TWO TABLES SWAPPED. The note above records
     *  a local sponsorship gated on a table she does not hold (the ITF one, when her standing was
     *  domestic) and fixes it by reading the national table. The same sentence is true again in the
     *  other direction the moment she leaves home: her domestic points are a rolling 52-week best-6,
     *  so a season on the international calendar decays them to nothing, and a gate that reads only
     *  that table says «the better she gets abroad, the more certainly the shop in her own town
     *  refuses her». A floor that turns away the careers the big brands passed on is not a floor.
     *  So the local rung reads WHICHEVER table she is on, exactly as `national` and `global` learned
     *  to on 02.08 - `standingClears` already carried `|| standing.wtaRanked` as the professional
     *  escape hatch, and this is the junior one it was missing.
     *
     *  ⚠ 128 = `TIERS.j300.drawSize` x 4, AND IT IS THE LADDER'S OWN STEP RUN DOWNWARDS. National is
     *  the J300 main draw (32) and Global is the last eight of it (32 / 4), so the rungs divide by
     *  four as they climb; the rung BELOW national multiplies by four. Pinned as an equality in
     *  tests/offers.test.ts beside its two neighbours, for the reason they are pinned there: this
     *  file cannot import the calendar, so a J300 that ever changed its draw would otherwise detach
     *  the ladder from the ladder it describes.
     *
     *  A SECOND READING OF THE SAME TIER ROW LANDS ON THE SAME NUMBER, which is why it is this one
     *  and not a round figure that felt right: J300 runs `everyNWeeks: 13`, i.e. four a season, so
     *  128 is every main-draw place at the prestige rung over a whole year. National signs the girl
     *  who is IN this draw; Global the one still in it on the last day; the shop backs the girl good
     *  enough to be in a J300 draw at some point this season. That is what a home-town shop knows
     *  about a girl - that she plays at that level - and it is deliberately WIDER than the
     *  distributor's gate, because a shop should be more eager to back a girl the world ranks, not
     *  less.
     *
     *  ⚠ WHERE IT BITES TODAY, MEASURED, BECAUSE THE NUMBER SHOULD NOT BE TRUSTED WITHOUT THIS. The
     *  junior table is the cohort (200 rows) and 75-122 of them hold a counting result in any given
     *  winter (min 75, p50 90, max 122 over 30 observations - three presets x two seeds x five
     *  winters, `rankingFor` at the window's opening week), so a cut at 128 sits just PAST the ranked
     *  depth: in today's population this arm reads "she holds a junior world ranking at all". That is
     *  the same shape the professional arm one line below it already has, and it is the intended
     *  reading - but the ceiling is written down anyway, because the cohort has grown once already
     *  (FIELD 520 -> 1,600) and a rule spelled "any ranking" would silently stay unbounded when the
     *  table outgrows it, while this one starts biting again the day it does.
     *
     *  ⚠ AND IT CANNOT BECOME A PENSION. `itfRanked` is a LIVE 52-week window (`sponsorStandingOf`),
     *  so a girl who stops entering loses the arm on her own - the escape hatch holds only while she
     *  is actually competing, which is the same thing `minEvents` asks of the deal itself. */
```

## `sponsorship.decideWeeks`

```ts
    /** HOW LONG THE PARENT HAS TO THINK, in weeks, counted INCLUSIVELY from the week the letter
     *  lands: the deadline is `arrival + decideWeeks - 1` (`kitOfferDeadline`), so five means the
     *  arrival week and the four after it, and the letter is still answerable on the last of them.
     *  The owner asked for exactly this - «давать человеку какое-то время на подумать».
     *
     *  ⚠⚠ IT BELONGS TO THE LETTER AGAIN, AND IT IS FIVE (28.08, round 28 #17-b, HIS RULING):
     *
     *      «в чем проблема сделать 5? у нас конечная неделя сезона 49 по сути, дальше окно в новый
     *       сезон, даже если приглашение придет на 1й или 2й неделе я не вижу проблем сделать слот
     *       в 5 недель»
     *
     *  From 05.08 to 28.08 this number SIZED THE WINDOW instead: `SPONSOR_WINDOW_WEEKS` was read as
     *  `decideWeeks + 1`, every letter of a winter expired when the window closed, and so the first
     *  letter of a winter carried five weeks and the last carried two. That bought one property -
     *  «no decision is ever open while she is playing» - and it cost the thing this constant is
     *  named for.
     *
     *  ⚠ WHAT HE IS KNOWINGLY GIVING UP, because the next reader of `docs/specs/sponsor-window-2026-08.md`
     *  §3.1 will otherwise re-derive the old rule from a document that still argues for it. A letter
     *  raised on the window's closing week now runs four weeks into the new season, so the inbox can
     *  hold a live decision while she is playing. He was shown that objection in those words and
     *  overruled it, and he is more right than the spec is, for a reason the spec could not have
     *  known: **the property was already gone.** Round 28 #2 gave the ADVERTISING letter five fixed
     *  weeks from arrival, and an advertising letter arrives on whatever week a campaign notices her
     *  - mid-season, most of the time. So «no decision open while playing» had already stopped being
     *  true of the inbox; the window guarantee only ever covered kit letters. His ruling makes the
     *  two kinds of post one rule instead of two, which is simpler than what it replaces.
     *
     *  ⚠ THE WINDOW ITSELF DID NOT MOVE. `SPONSOR_WINDOW_WEEKS` is `OFF_SEASON_WEEKS + 2` and always
     *  was - that is «межсезонье +2», the owner's own sentence - and it is still the five weeks a
     *  brand may WRITE in. What is no longer true is the second reading, `decideWeeks + 1`: the two
     *  numbers are now independent and only coincidentally equal, so nothing should re-derive one
     *  from the other. See `SPONSOR_LETTER_WEEKS`, whose reason changed with this. */
```

## `sponsorship.national`

```ts
    // --- THE BRAND LADDER: the two rungs above the shop (01.08, feat/brand-ladder) ---------------
    //
    // WHY IT EXISTS, in the owner's own case. He finished a season #1 NATIONAL and #13
    // INTERNATIONAL and asked whether two contracts would arrive. They would not: `kitTermsFor` read
    // only the table above, so a girl who is thirteenth in the world was still being written to by
    // one shop in her town, and by nobody else. A national top-30 and a world top-30 are not the
    // same achievement and are not interesting to the same people.
    //
    // ⚠ THE RUNG IS COVERAGE, NOT PRESTIGE - see `SponsorTier`. What steps up is WHICH OF HER LINES
    // the brand supplies (strings / +frames / +shoes +travel), which is legible off the gear the
    // game already models, rather than a number the game would have to invent and then explain.
    //
    // ⚠ AND THE TWO UPPER GATES READ THE INTERNATIONAL TABLE, WHICH IS THE POINT. The local shop
    // keeps the domestic gate above (`maxRank` / `topMaxRank`) - that argument is unchanged and a
    // home-town shop reads the ladder she is on at home. A national distributor and a global brand
    // read the one she is on abroad.
    //
    // ⚠ AND THAT IS THE EXACT ERROR two-ladders.md CAUGHT ONCE ("the gear valve has never fired for
    // anybody": an ITF-rank gate at #30 fired for NOBODY in any preset, because her ITF rank sat at
    // #89-#109). It is not that error twice, for two reasons, and both are measured rather than
    // asserted. First, the ladder still has a rung for those careers - the local shop, on the table
    // they actually hold. Second, the numbers below were picked against a sweep
    // (tools/brand-gate-bench.ts, 18 preset x policy cells x 12 seeds x 312 weeks, best ITF rank ever
    // held): 78/216 careers reach #32 and 34/216 reach #8. The self-coached and grinder cells never
    // reach either - which is the discrimination we want, not a failure - and every managed cell
    // clears #32 in most seeds. So both rungs are live content, and neither is free.
```

## `sponsorship.national.maxWtaRank`

```ts
      /** ⚠ ...AND THE PROFESSIONAL RANK THAT SAYS THE SAME THING (02.08, the owner: «спонсор вполне
       *  может жить и дальше»). Built exactly as `maxItfRank` above is - off one figure in the tier
       *  table, not picked: National signs the girl who would be IN the prestige draw, and on the
       *  professional side that is W100's acceptance list, `enterPct` 0.25 of the merged W table.
       *  That table is FIELD.size + the cohort (199) + her, so a quarter of it is this number.
       *  Pinned against both figures in tests/offers.test.ts, the same way the junior pair is
       *  pinned against `TIERS.j300.drawSize`.
       *
       *  ⚠ 125 -> 350 BY W2-FIELD2, IN TWO STEPS, AND BOTH ARE THE DERIVATION MOVING RATHER THAN A
       *  DECISION. The rule has not changed a word - National signs the girl who would be IN the
       *  W100 draw, i.e. on W100's acceptance list, whatever that list currently is.
       *    1. the fourth storey took the merged table 500 -> 564 rows, so the old SHARE (0.25) went
       *       125 -> 141;
       *    2. then the share itself was retired. Against a table carrying the real points-to-rank
       *       curve a share bites in real ranks - it made the W ladder unwalkable - so the W rungs
       *       took the real tour's own cuts, and a real W100 accepts to about #350.
       *  So this is `TIERS.w100.acceptsRank`, read straight. It IS a looser gate than before, and
       *  that follows from the table being honest rather than compressed: #350 of a 564-row
       *  professional field is a different player from #141 of a table whose #300 held nine points.
       *  Flagged for the owner in the wave report rather than smoothed over.
       *
       *  ⚠⚠ 350 -> 240 (P3, 16.08), AND IT IS THE DERIVATION MOVING FOR THE THIRD TIME RATHER THAN A
       *  NEW DECISION - exactly as the two steps above were. `TIERS.w100.acceptsRank` went 350 -> 240
       *  as the fourth link of the sourced acceptance chain
       *  (docs/specs/acceptance-cuts-corrected-2026-08.md), and the rule here has still not changed a
       *  word: National signs the girl who would be IN the W100 draw, whatever that list currently is.
       *  The equality is pinned by tests/offers.test.ts, so the two cannot drift apart silently.
       *
       *  ⚠ BUT THE DIRECTION IS THE OPPOSITE OF LAST TIME AND THE OWNER SHOULD SEE IT. The paragraph
       *  above flagged a LOOSER gate; this is a materially TIGHTER one - a national sponsor now wants
       *  a top-240 professional where it wanted top-350. Nobody retuning the ladder opened this file,
       *  which is precisely the coupling `TIERS.w100`'s own comment has warned about twice. It is the
       *  first item on the P3 spec's escalation list.
       *
       *  ================================================================================================
       *  ⭐⭐ 240 -> 350, AND THE DERIVATION IS RETIRED: THIS NUMBER IS ITS OWN DECISION NOW (16.08).
       *  ================================================================================================
       *  Everything above this line is the RECORD of how the number got here, kept verbatim because it
       *  is the evidence. What changed is not the value, it is the WIRING.
       *
       *  THE DEFECT IS THE ONE P4 FIXED FOR THE COLLEGE DOOR: one constant doing two unrelated jobs.
       *  `TIERS.w100.acceptsRank` decided BOTH who the tour lets into a W100 AND how famous a rank has
       *  to be before a national distributor writes to her - so P3's acceptance-cut work, which was
       *  about the first, silently moved the second. Nobody decided that; it was a SIDE EFFECT, and the
       *  three paragraphs above are the sound of the repo noticing and shipping it anyway.
       *
       *  AN ACCEPTANCE CUT AND A SPONSOR'S INTEREST HAVE NO REASON TO SHARE A NUMBER. The cut is a rule
       *  of the tour - who may enter, decided by the ITF and the WTA. The sponsor gate is a fact about
       *  visibility - how famous a rank makes you, decided by a marketing department. They coincided
       *  once, in 02.08's derivation, and a coincidence is not a dependency. So the rule that read
       *  "whatever that list currently is" is withdrawn: it was a good way to PICK the number and a bad
       *  way to HOLD it.
       *
       *  350 IS THE VALUE IT HELD BEFORE THE COUPLING DRAGGED IT, restored rather than re-picked -
       *  because the coupling is what moved it and nothing else did. Reverting the side effect is not a
       *  new balance decision and must not be dressed as one; the P3 chain keeps its four links, and
       *  W100's door stays at 240 where the ladder work put it.
       *
       *  ⚠ WHAT IS NOT DECIDED HERE. Whether 350 is still the RIGHT number, now that the rest of the
       *  ladder has moved under it, is a live question and it is the owner's - see
       *  `global.maxWtaRank` below, where it bites hardest, and the spec. Restoring a number the
       *  coupling took is a different act from choosing it. `tests/offers.test.ts` now guards the
       *  DECOUPLING (move `TIERS.w100.acceptsRank`; these two must not follow) instead of pinning the
       *  equality that made the drag possible. */
```

## `sponsorship.national.keepDomesticRank`

```ts
      /** ⚠ ...AND THE DOMESTIC STANDING SHE HAS TO KEEP TO HOLD IT = `maxRank` above, the same top
       *  30 that opens the local shop. This is National's job on the way OUT and the whole reason
       *  this rung is gated on two tables at once: her domestic points are a rolling 52-week best-6,
       *  so a season spent entirely on the international calendar decays them to nothing and she
       *  slides out of this band. The deal ends when she does.
       *
       *  ⚠⚠ AND IT IS NOT THE ONLY WAY TO HOLD THE DEAL ANY MORE (02.08). The paragraph above is
       *  true of a JUNIOR who goes abroad - a lateral move inside the same visibility economy, and
       *  a brand that paid for a domestic name is entitled to notice. It is simply false of a
       *  PROFESSIONAL: she is not less visible than the girl they signed, she is more. So the
       *  keep-condition now reads "still worth being seen with", which the professional rank answers
       *  too - see `standingClears` in offers.ts, which is the one place either question is asked.
       *  The deal's other condition (`minEvents`) is untouched and is still the real obligation: a
       *  sponsor pays to be SEEN, so a season spent resting still costs the deal, at every rung. */
```

## `sponsorship.global.maxWtaRank`

```ts
      /** ⚠ THE PROFESSIONAL FIGURE, and it is the same reading one rung up (02.08): National signs
       *  the girl who would be in the prestige draw, Global the one who would still be in it on the
       *  last day - the last quarter. Junior: 8 of the J300's 32. Professional: 87 of the 350 who
       *  would be accepted into a W100 (`national.maxWtaRank` / 4, rounded down as the junior pair
       *  divides exactly). Pinned beside its neighbour in tests/offers.test.ts.
       *
       *  ⚠ 31 -> 87 BY W2-FIELD2, for exactly the reason its neighbour carries: this is a quarter of
       *  W100's acceptance list, and that list was re-derived from the real tour's own cut.
       *
       *  ⚠⚠ 87 -> 60 BY P3 (16.08), THE SAME DERIVATION FOLLOWING THE SAME SOURCE - `national` went
       *  350 -> 240 with `TIERS.w100.acceptsRank`, and a quarter of 240 is 60.
       *
       *  ⚠ AND IT SQUEEZES THIS RUNG'S BAND HARD ENOUGH THAT THE OWNER SHOULD SEE IT. Global sits
       *  between `premium` (50) and itself, so its band was ranks **51-87 (37 places wide)** and is
       *  now **51-60 (ten)**. Nothing decided that; it fell out of a ladder correction four files
       *  away. Whether a sponsorship rung ten ranks wide is still a rung is a balance question, and
       *  it is on the P3 spec's escalation list rather than absorbed here.
       *
       *  ================================================================================================
       *  ⭐⭐ 60 -> 87, AND THIS NUMBER IS ITS OWN DECISION NOW (16.08). See `national.maxWtaRank` above
       *  for the whole argument - one constant was doing two unrelated jobs, and an acceptance cut and
       *  a brand's interest have no reason to share one.
       *  ================================================================================================
       *  87 IS THE VALUE IT HELD BEFORE THE COUPLING DRAGGED IT, restored and not re-picked. The band
       *  goes back to ranks **51-87 (37 places)** from the ten it had been squeezed to.
       *
       *  ⚠⚠ AND A BAND TEN RANKS WIDE IS NOT A BAND - which is the reason this rung is where the defect
       *  actually hurt. `premium` sits at 50 and `global` at 87, so the whole of this rung's professional
       *  territory is #51-#87: every career that ever holds a rank in that window, for the weeks it holds
       *  it. At 60 that window was #51-#60, and a rung a career crosses in a season or two of climbing is
       *  a letter that arrives, if at all, by luck.
       *
       *  ⚠ WHETHER 87 IS STILL RIGHT IS THE OWNER'S CALL AND IS DELIBERATELY NOT TAKEN HERE. The
       *  argument that made it 87 was arithmetic - a quarter of national's 350 - and that arithmetic is
       *  exactly the derivation this decoupling retires, so the number now stands on nothing but its own
       *  history. It also has to sit ABOVE `premium`'s 50 and BELOW `tour`'s 200 to keep the sponsor
       *  chain monotone (national 350 > tour 200 > global 87 > premium 50 > icon 10), and 87 is barely
       *  a third of the way up that gap. Reported in the spec, not moved: restoring what the coupling
       *  took is a revert; choosing a new figure is a balance decision and it is his. */
```

## `sponsorship.global.travelShare`

```ts
      /** ⚠ A HAND WITH THE TRAVEL - the one thing no other rung does, and the reason this is the top
       *  of the ladder rather than just a third line of kit. `junior-economics.md`: "travel
       *  sponsorship only after national/international wins", which is exactly this gate.
       *
       *  A QUARTER OF THE FARE, and the size is read off the wealth corridor rather than picked: a
       *  trip costs a wealthy family x1.2-1.3 of the sticker and a middle one x0.95-1.05, so a
       *  quarter off is worth almost exactly ONE STEP DOWN that corridor. It is deliberately nowhere
       *  near `ECONOMY.academy.travelCover` (0.75 since R15-7): the academy is a need-based rescue that decides
       *  whether a working family survives at all, and a brand must not quietly become a second one.
       *  This helps a family reach further; it does not carry it.
       *
       *  ⚠ NOT MEASURED ON THE ECON BENCH YET. It is the one number in this block that is argued
       *  rather than swept, and travel is the biggest line in the game, so it is the first knob to
       *  put through econ-bench when the ladder has run for a while. */
```

## `sponsorship.global.retainerCents`

```ts
      // ===============================================================================================
      // ⭐⭐ ROUND 29 PART TWO #5 – THE CASH THIS RUNG NEVER HAD, AND IT IS THE OWNER'S RULING ON A
      // DEFECT THE SPEC ITSELF PREDICTED AND NOBODY EVER TOOK TO HIM.
      // ===============================================================================================
      //
      // HIS WORDS: «мировые топы должны иметь все возможности достучаться до топовой спортсменки.»
      //
      // WHAT WAS WRONG. `global` is sorted ABOVE `tour` – the chain is national 350 > tour 200 >
      // global 87 > premium 50 > icon 10 – and it paid LESS: the same $5,000 of kit and the same 25%
      // of the fare, but NO retainer against tour's $6,000 a season and NO result bonus against
      // tour's 20% of every W75+ cheque, while locking THREE seasons against two. A parent who signed
      // the stronger-looking letter on sight was strictly worse off, which is the exact inversion
      // `windowLadder`'s own header promises cannot happen («signing on sight is always safe and
      // waiting always optional»). `tools/sponsor-ladder-reach.ts` prints it as a ⚠ line, and
      // `tests/round29p2-ladder-monotone.test.ts` is now the guard that stops it recurring – written
      // as a property over the WHOLE ladder rather than as a case about this rung.
      //
      // ⚠⚠ AND IT WAS PREDICTED AT DESIGN TIME. `docs/specs/act2-pro-tour.md` §7, verbatim: «`tour`'s
      // WTA ≤ 200 sits deliberately BELOW global's 31 in strength while above it in kind, which is
      // the one thing to resolve when it is built … an owner's call at build time, not now.» The call
      // was never taken and the rungs shipped side by side. This is that call, finally made, and the
      // spec is amended where it stood open.
      //
      // ⚠ THE FIX IS THE TERMS AND NOT THE GATE, on his instruction. Nothing about who Play Beyond
      // writes to moves by a single rank; what moves is what the letter is worth when it comes.
      /** ⭐ THE RETAINER, AND IT IS READ OFF THE SPEC'S OWN BAND RATHER THAN PICKED. §7 gives the
       *  professional retainer a «~$3–8k/yr» band and `tour` takes the MIDDLE of it ($1,500 a
       *  quarter = $6,000 a season). This rung takes the TOP of the same band – $2,000 a quarter =
       *  $8,000 a season – which is the smallest honest number that is strictly better than the rung
       *  below rather than merely equal to it.
       *
       *  ⚠ STRICTLY BETTER AND NOT MERELY EQUAL, ON PURPOSE. Equal money would still leave this rung
       *  the worse deal, because it locks a THIRD season and a running deal turns the post away – so
       *  a parent who signed it would give up a winter of letters for nothing. (Round 29 part two
       *  #12 narrows that cost: a strictly stronger rung may now write while a deal runs. It does not
       *  remove it – `premium` may write over this deal, `tour` may not.)
       *
       *  ⚠ AND IT STAYS INSIDE THE CHAIN ABOVE IT: `premium`'s $7,500 a quarter is still §7's
       *  «retainer ×5–10» of `tour`, which is the relationship that clause names, and $2,000 sits
       *  between the two without disturbing either. */
```

## `sponsorship.tour`

```ts
    // --- THE PROFESSIONAL RUNGS: tour / premium / icon (W3-ACT2, act2-pro-tour.md section 7) -----
    //
    // The owner asked for a proposal («да, надо продумать, предложи что-то») and this is it, built.
    // Three things are new in KIND rather than in size, and each of them is the first of its sort in
    // the game: a quarterly cash RETAINER (every rung below pays in gear, because juniors pay to
    // play), an APPEARANCE FEE (money for turning up, which the sport really does pay at the top),
    // and a RESULT BONUS expressed as a share of the tournament's own cheque.
    //
    // THE GATES ARE THE PROFESSIONAL TABLE'S, and they slot into a ladder that already had two
    // professional arms rather than starting a second one. After W2-FIELD2 re-derived the W cuts the
    // full chain reads national 350 > tour 200 > global 87 > premium 50 > icon 10 - monotone, one
    // deal at a time, `rungFor` strongest-first. See `SponsorTier` for why that answers section 7's
    // own open question without a new rule.
    //
    // NOTHING HERE SCALES WITH THE WEALTH CORRIDOR. A retainer is a cheque to the player, exactly
    // like prize money, and `prizeCentsFor`'s note is the same rule for the same reason.
    //
    // THE BANDS ARE THE SPEC'S, ANCHORED ON REAL TENNIS ECONOMICS RATHER THAN INVENTED: section 7
    // gives tour a "~$3-8k/yr" retainer band and premium "x5-10" of it. $1,500 a quarter is $6,000 a
    // year, the middle of that band; premium takes x5 ($30,000) and icon x5 again ($150,000). Read
    // against docs/research/02-tennis-economics.md that is the right shape - a #200 player's kit
    // deal does not pay her rent, a #50 player's does, and a top-10 player's endorsement income is
    // the largest line on her page.
```

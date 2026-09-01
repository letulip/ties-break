// ⭐⭐⭐ THE BRAND – round 30 #23 and #24, and it is TWO functions of ONE signal set.
//
// THE OWNER, 30.08, on being shown that a convex income curve hands a $250,000 rung an ~$8.7M peak
// valuation: «а что с этой цифрой не так? вроде бы как раз спонсорские коллаборации со спортсменами
// дают и не такое, а кратно большее.» He is right and the research agrees with him – Sugarpova
// peaked at a $20M valuation, the RF mark is estimated at ~$27M, and Federer's ~3% of On peaked near
// $500M (docs/research/player-brands-and-what-they-are-worth.md §7b/§7c). ⚠ SO THERE WAS NEVER A
// CONFLICT BETWEEN THE TWO SIZING CRITERIA – only a wrong belief that $8.7M was an overshoot.
//
// AND HIS ACTUAL INSTRUCTION, which is bigger than the number: «Давай математику и динамику оценим и
// станет понятно всё. У нас есть её профессионализм, сколько играет, сколько выигрывает, как глубоко
// проходит и вся остальная информация… Всё это можно использовать в расчете так или иначе.»
//
// ⭐⭐ THE SHAPE, AND IT IS THE REPAIR THE PREVIOUS PASS COULD NOT FIND. Income and worth used to be
// ONE dial: `worth = 16 x a year of income`, so nothing could move one without moving the other by
// exactly the same proportion. They are now two functions over the same signals, and the split is
// finding §5.1 of the research written as arithmetic:
//
//   * INCOME IS CURRENT FORM. It is fame – the decaying fold over titles, lost Slam finals, seasons
//     ended in band and lived shoot weeks – and it goes UP AND DOWN with her. A season with no
//     titles is a season the brand sells less.
//   * THE MULTIPLE IS HOW BIG THE BUSINESS IS, PLUS THE ACCUMULATED CAREER ON TOP. How long she
//     played, how high she finished, how deep she went, how often she won – a judgement about
//     durability, «BRAND VALUE FOLLOWS THE ACCUMULATED STOCK, NOT CURRENT FORM», §5.1's first
//     finding verbatim (Sugarpova expanded through a doping ban; EleVen survived thirteen years of
//     decline) – sitting on a BASE that ramps with fame, because a buyer's multiple is also a
//     judgement about size and the size of this business is how loudly she is talked about.
//
// ⚠⚠ THE SECOND HALF OF THAT LINE IS ROUND 32 #3 (31.08) AND IT REVERSES WHAT THIS FILE SHIPPED
// WITH. Round 30 #23 put fame in the income alone, so two careers with the same tennis record and
// different fame valued their brands identically and an unknown's brand traded at the full 14x. THE
// OWNER, shown his own w933 row – $1,720 a week priced at $1.63M: «личный бренд в цене подрос с 250к
// до 1.8м, а доход у него 1800 в неделю =))) что как-будто бы не очень соответствует стоимости», and
// then the ruling that specified the repair: «её известность 22.3 – да, это ок, главное, чтобы ЭТА
// ИЗВЕСТНОСТЬ УЧАСТВОВАЛА В МЕХАНИЗМЕ, тогда мы увидим разницу на других карьерах.» See
// `brandMultipleX` for the arithmetic and docs/specs/brand-multiple-follows-fame-2026-08.md for what
// it cost.
//
// ⚠⚠ SO THE WORTH FALLS IN-CAREER AND THAT IS THE POINT (the owner, correcting the argument for it:
// «но это уже будет после завершения игры, по сути нас это не очень интересует, разве нет?» – the
// post-retirement decline is out of frame and NOTHING here models it). What is in frame is the slump
// the player actually sits through: a season lost to injury, a year with no title, fame decaying
// while she is not winning. Income is convex in fame, so those falls are felt harder than they used
// to be, and `tools/brand-dynamics.ts` measures how often they happen inside a live career.
//
// ⚠ AND THE FOUR CAREER RUNGS DO NOT FALL, WHICH IS DELIBERATE AND IS NOT A RATCHET SMUGGLED IN. A
// career that happened cannot un-happen: twelve seasons on tour are twelve seasons on tour in the
// year she is hurt. That is still true of every rung in `ECONOMY.business.merch.value`.
//
// ⚠⚠ WHAT IS NO LONGER TRUE, SINCE ROUND 32 #3, IS «THE MULTIPLE DOES NOT FALL» – the BASE those
// rungs sit on ramps with fame, and fame falls. What can un-happen is being TALKED ABOUT, and a
// business the world has stopped noticing is smaller as well as poorer. So a slump now compounds:
// the income falls as fame² and the multiple falls with fame on top of it. That is the asset
// behaving like an asset twice over, it is the arithmetic consequence of his ruling rather than a
// second decision, and it is MEASURED – docs/specs/brand-multiple-follows-fame-2026-08.md §6 counts
// the in-career falls on the same 72-career walk round 30 #23 was sized on. The mark floor
// (`ECONOMY.shop.businessValueFloorShare`) still stops it reaching zero.
//
// ⭐⭐⭐ WHY THIS FILE EXISTS AT ALL, AND IT IS THE FOUNDATION NOTE (the owner: «по сути этот мерч
// бренд это фундамент для этого слоя» – the collaboration layer). Everything below is arithmetic on
// THE BRAND'S OWN ECONOMICS, with no idea who owns it: `brandSignalsOf` reads the career,
// `brandWeeklyGrossCents` and `brandMultipleX` price a WHOLE brand, and `brandGrossWorthCents`
// multiplies the two. OWNERSHIP is applied one file up, in `world/assets.ts`, where the owned row
// lives – and today the family owns all of it, so the boundary is a multiplication by one that is
// never written down.
//
// ⚠⚠ THAT BOUNDARY IS A DOOR AND NOT A HINGE, AND NO FIELD IS ADDED FOR IT. A partner buying into
// her brand is a share on the owned row and a single `x share` where the two functions cross into
// `assets.ts`; it is not a second income model beside this one. Adding the field TODAY would be a
// dead field, which is the same disease as a dead guard – so the seam is here and the door is not
// hung. See docs/specs/brand-worth-and-income-2026-08.md §6 for which of the three future shapes
// this accommodates cheaply and which one needs different machinery.
//
// ⭐⭐⭐ AND THE 31.08 REVISION OF ROUND 32 #4 CORRECTS THE FIRST BULLET ABOVE, so a reader does not
// take it for current. «INCOME IS CURRENT FORM. It is fame» was true until the owner read what it
// cost: «меня смущает вот это: На пятом году бренд стоит $166 060 при годовом доходе $1 352». #4 had
// floored the WORTH on the brand's slow stock and left the INCOME a bare function of fame, so the
// valuation floated free of the business it was pricing – 123x annual earnings at the tail.
//
// ⭐⭐ THE MEMORY MOVED INTO THE REVENUE, WHICH IS WHERE THE SPEC'S OWN PREMISE ALWAYS PUT IT: a brand
// keeps «a name, a shelf, a distribution and a customer who already owns two of its shirts», and that
// customer KEEPS BUYING when she stops winning. So the income reads `brandReachOf` –
// `max(fame, retention x strength)` – and the worth is a plain multiple of that income. ONE clock,
// one mechanism, and `worth / a year of income` is `brandMultipleX` again, to the cent.
// docs/specs/brand-inertia-2026-08.md §14-§19.
//
// ⚠⚠ ZERO DRAWS ON ANY STREAM, AND THE SAME PROOF `world/fame.ts` CARRIES. There is no `Rng`
// argument in this file, no clock, no `Math.random` and no persisted field: every number below is
// re-derived from records the career already keeps and never prunes, so a load cannot drift it and
// the frozen MAIN capture (41550 / e6b0c709) cannot see it. A valuation is a fold over history.
import { ECONOMY } from '../economy'
import { WEEKS_PER_YEAR } from '../season/calendar'
import { decayAt, fameAt } from './fame'
import { brandStrengthAt } from './brandStrength'
import { tierCrowdMid } from '../season/preview'
import type { TierId } from '../season/types'
import type { WorldState } from '../world'

/** ⭐⭐ EVERYTHING THE BRAND KNOWS ABOUT THE CAREER, in one read. His own list, in his own order:
 *  «её профессионализм, сколько играет, сколько выигрывает, как глубоко проходит».
 *
 *  ⚠ IT IS A VALUE OBJECT AND NOT A CACHE. Nothing stores it, `brandSignalsOf` rebuilds it on every
 *  read, and the two pricing functions below take it rather than a world – which is what lets a
 *  bench sweep a hypothetical career without building one, and what keeps the pricing testable
 *  without a ticked world behind it. */
export interface BrandSignals {
  /** the fame stock, fractional, at the week asked for – `world/fame.ts`, unrounded. */
  fame: number
  /** ⭐⭐⭐ ROUND 32 #4 – THE BRAND'S SLOW STOCK at the same week (`world/brandStrength.ts`): the best
   *  she has ever been, faded on a half-life measured in YEARS and floored at a share of that best.
   *
   *  ⚠⚠ SINCE THE 31.08 REVISION IT IS READ THROUGH `brandReachOf` AND BY THE INCOME FIRST, which is
   *  the opposite of how it shipped. #4 gave the stock to the WORTH alone and left the income a bare
   *  function of fame; the owner read the result and stopped it, because a valuation whose earnings
   *  have evaporated under it is not a valuation. The stock now floors the REACH, the reach drives
   *  the income, and the worth is floored through the income it is a multiple of.
   *
   *  ⚠ NEVER BELOW `fame`, BY CONSTRUCTION, and equal to it at the cap and at every running peak –
   *  see `brandStrengthAt`'s header for why that is what pins the top of the shelf. */
  strength: number
  /** ⭐ «СКОЛЬКО ИГРАЕТ» – finished seasons that carry a WTA end-rank, i.e. seasons she spent as a
   *  professional. ⚠ A season with no recorded WTA rank counts NOTHING and is not counted as a bad
   *  one: «not recorded» is not «unranked», which is `academyReputationOf`'s own distinction and the
   *  season mirror's before it. */
  proSeasons: number
  /** ⭐⭐ «ОНА ЖЕ ТОП-20 В МИРЕ» – seasons ended inside `value.topEndRank`, counted once each. This is
   *  round 30 #24's claim carried into the WORTH as well as into the fame floor: a career built on
   *  quarter- and semi-finals is a real career and a buyer can see it in the standings. */
  topSeasons: number
  /** ⭐⭐ «КАК ГЛУБОКО ПРОХОДИТ» – finals REACHED AND LOST at a professional tier, dated in the trophy
   *  ledger (`TierTrophies.finals`, whose contract is that a title never appears here too).
   *
   *  ⚠⚠ THIS IS THE DEEP-RUN SIGNAL THE PREVIOUS PASS SAID DID NOT EXIST, and the correction is
   *  narrow: round 30 #24 concluded «TierTrophies stores titles and finals and NOTHING BELOW a
   *  final», which is true and which stops a QUARTER-final being counted. It does not stop a FINAL
   *  being counted, and the fame floor reads `finals` only at 'slam' – so every lost final from w15
   *  to wta1000 is a dated professional result that nothing in the game has ever read. It is read
   *  here, and only into the multiple: what she WON is already priced into the income through fame,
   *  and pricing it twice would be one dial wearing two hats again. */
  finalsLost: number
  /** ⭐⭐⭐ «ДАЖЕ ТО, СКОЛЬКО ЗРИТЕЛЕЙ НА ТРИБУНЫ ПРИХОДИТ» – THE SIZE OF THE ROOM SHE PLAYS FINALS
   *  IN, in people, decayed on the same half-life as everything else. 0 when the career has no
   *  recorded appearance at all, which is «no evidence» and never «an empty stand».
   *
   *  THE OWNER, 30.08, overruling the `[GAP]` this wave had filed: «у нас есть понимание коридора
   *  зрителей на каждом турнире, мне кажется этого достаточно вполне.»
   *
   *  ⚠⚠ A MEAN AND NOT A TOTAL, WHICH IS THE WHOLE REASON IT IS NOT FAME WEARING A HAT. A decayed
   *  TOTAL audience is a decayed sum over the same dated records the fame floor already sums, with
   *  different per-tier weights – it would measure how much she has done, twice. The decay cancels
   *  between numerator and denominator here, so what is left is a recency-weighted MEAN: «how big is
   *  the room she is playing in these days», which is a fact about her SCHEDULE and not about her
   *  haul.
   *
   *  ⚠⚠ AND IT IS «FINALS», NOT «EVERY MATCH», BECAUSE THAT IS ALL THE SAVE CAN ANSWER FOR – said
   *  plainly rather than papered over. There is no career-long record of what she ENTERED:
   *  `world.results` prunes at 52 weeks, the news feed caps at 400 rows, `seasonEntries` and
   *  `proEntryWeeks` are both pruned to the current season. `trophiesByTier[tier].titles/finals` is
   *  the only dated, per-tier, never-pruned appearance ledger in the game. So this reads «the rooms
   *  she reaches finals day in», which is a narrower claim than «who saw her» and is the honest one.
   *
   *  ⭐ IT IS NOT THE LADDER THROUGH A SECOND DOOR, and the corridor table says so itself: crowd is
   *  NOT monotone in tier. A J300 draws 900–2,600 and a W15 draws 20–70, so a junior on the feeder
   *  circuit plays in front of forty times the room a new professional does – «the crowd she plays in
   *  front of gets smaller as the tennis gets better», in `season/preview.ts`' own words. Two careers
   *  can finish a season at the same rank having played to very different houses. The measured
   *  correlations are in docs/specs/brand-worth-and-income-2026-08.md §5. */
  roomSize: number
  /** ⭐ «СКОЛЬКО ВЫИГРЫВАЕТ» – her career win rate ON THE WTA TRACK, 0..1, over finished seasons.
   *  ⚠ THE WTA TRACK AND NOT THE FOLD: `SeasonHistoryEntry.wins` adds all three tables together, so
   *  a junior season of easy wins would read as professional form. `byTrack.wta` is the professional
   *  record and is the only one a brand should be able to see – the same rule that keeps junior
   *  draws out of the fame floor. 0 when she has played no professional match at all. */
  winRate: number
}

/** ⭐⭐ THE CAREER, READ. Pure: reads the world, writes nothing, draws nothing.
 *
 *  ⚠ `week` IS TAKEN AND NOT ASSUMED, exactly as `fameAt` takes it, because the shelf quotes «one
 *  more week of holding» by asking the same question at `week + 1` (`assetWorthCents`' own
 *  `weekOffset`). Everything except fame is week-independent by construction – a season that has
 *  been banked stays banked – so only the fame term moves, which is the fall the player feels. */
export function brandSignalsOf(world: WorldState, week = world.week): BrandSignals {
  const V = ECONOMY.business.merch.value
  let proSeasons = 0
  let topSeasons = 0
  let wins = 0
  let losses = 0
  for (const row of world.seasonHistory ?? []) {
    const wta = row.byTrack?.wta
    if (!wta || wta.endRank == null) continue
    proSeasons++
    if (wta.endRank <= V.topEndRank) topSeasons++
    wins += wta.wins
    losses += wta.losses
  }
  let finalsLost = 0
  // ⚠ THE PROFESSIONAL TIERS ARE `titleFloor`'S OWN KEY SET and are not re-listed here. That list IS
  // the game's definition of «a tier the world notices» (world/fame.ts: «the world does not read
  // junior draws»), and a second copy of it would be free to drift away from the first.
  for (const tier of Object.keys(ECONOMY.fame.titleFloor) as TierId[]) {
    finalsLost += world.trophiesByTier?.[tier]?.finals.length ?? 0
  }
  // ⭐⭐⭐ THE ROOM. ⚠ EVERY TIER SHE HOLDS A SHELF ON, JUNIORS INCLUDED, and that is deliberate and is
  // the opposite of the rule two lines up. The fame floor ignores junior draws because the WORLD does
  // not read them; the CROWD does not care what the world reads – a J300 final is played in front of
  // 900–2,600 people whether or not anybody writes it down, and that is the fact the owner asked to
  // have counted. So this walks the shelves, not `titleFloor`'s key set.
  let audience = 0
  let appearances = 0
  for (const [tier, shelf] of Object.entries(world.trophiesByTier ?? {}) as [TierId, { titles: number[]; finals: number[] }][]) {
    if (!shelf) continue
    const room = tierCrowdMid(tier)
    for (const w of [...shelf.titles, ...shelf.finals]) {
      const d = decayAt(week - w)
      audience += room * d
      appearances += d
    }
  }
  const played = wins + losses
  return {
    fame: fameAt(world, week),
    strength: brandStrengthAt(world, week),
    proSeasons,
    topSeasons,
    finalsLost,
    // ⚠ THE DECAY CANCELS IN THE RATIO and that is the point – see the field's own note. A career
    // with no recorded appearance answers 0, which `brandCrowdMult` reads as «no evidence».
    roomSize: appearances > 0 ? audience / appearances : 0,
    winRate: played > 0 ? wins / played : 0,
  }
}

/** ⭐⭐ HOW MUCH THE ROOM IS WORTH TO THE BRAND – a bounded multiplier on the WEEKLY INCOME, centred
 *  on 1 at `ECONOMY.business.merch.crowd.refRoom`.
 *
 *  ⚠⚠ ON THE INCOME AND NOT ON THE MULTIPLE, and that is the tense argument this file is built on:
 *  being seen is CURRENT FORM – the same tense as fame – while the multiple is the accumulated
 *  career. A player who has stopped playing the big rooms is being watched by fewer people NOW, and
 *  that belongs where the fall lives. It reaches the WORTH anyway, through the income, which is
 *  exactly how fame reaches it.
 *
 *  ⚠ CENTRED, BOUNDED AND A QUARTER-POWER, so it can only ever tilt the answer and never carry it.
 *  A room a hundred times bigger than the reference is worth about ×3.2 before the clamp; the clamp
 *  then holds the whole term inside [`minMult`, `maxMult`]. The reference is the room a family is
 *  typically playing in the week it can first afford the brand, which is what keeps round 30 #9's
 *  day-one anchor where it was – measured, not assumed.
 *
 *  ⚠ 0 IS «NO EVIDENCE» AND ANSWERS 1. A career that has reached no final has an empty appearance
 *  ledger, not an empty stand, and `shared/money.ts`' house rule is that a fact and a missing value
 *  must not look the same. */
export function brandCrowdMult(signals: BrandSignals): number {
  const C = ECONOMY.business.merch.crowd
  if (signals.roomSize <= 0) return 1
  const raw = Math.pow(signals.roomSize / C.refRoom, C.exponent)
  return Math.min(C.maxMult, Math.max(C.minMult, raw))
}

/** ⭐⭐⭐ WHAT A WHOLE BRAND TAKES IN THIS WEEK, in cents, before anybody owns it – §7e's convex
 *  curve, and the shape is FORCED rather than chosen.
 *
 *  THE TWO CONSTRAINTS, and there is exactly one family of curves through both (research §7e):
 *    * THE BOTTOM IS ALREADY RIGHT AND WAS DELIBERATELY CALIBRATED. At the fame a family holds the
 *      week it can first afford the brand, the old linear dial yielded 6.0% a year on its $250,000
 *      against the index fund's 7% – `ECONOMY.business.merch`'s own stated anchor, confirmed live by
 *      `tools/merch-fame-vs-rank.ts`. A flat multiplier would break the end that is right.
 *    * THE TOP IS 3–13x UNDER THE RESEARCHED BAND. A top full own-brand nets on the order of
 *      $0.5M–$2M a year (§7d, a derivation from Sugarpova's $20M valuation and EleVen's $5–12M
 *      turnover); the linear dial paid $156k a year at fame 100.
 *
 *  Hold the anchor, reach the band, and what is left is convex. This is the simplest member, pivoted
 *  on the anchor itself, so it is IDENTICAL at `famePivot` by construction and diverges above it.
 *
 *  ⚠ AND IT IS WHY THE IN-CAREER FALL BITES HARDER NOW: a third off her fame is more than half off
 *  her brand's income. That is the asset behaving like an asset, and it is measured rather than
 *  hoped for – `tools/brand-dynamics.ts` counts the seasons inside a LIVE career in which the worth
 *  fell, which is the only fall the game is in frame for. */
export function brandWeeklyGrossCents(signals: BrandSignals): number {
  const M = ECONOMY.business.merch
  // ⭐⭐⭐ REVISION (31.08) – AND THE THING SQUARED IS THE REACH, NOT THIS WEEK'S NOISE. Not a
  // character of the curve moved; what moved is what it is asked about. See `brandReachOf`.
  const reach = brandReachOf(signals)
  // ⭐⭐⭐ AND THE ROOM TILTS IT (30.08, the owner overruling this wave's `[GAP]` on the crowd). It is
  // a bounded multiplier centred on 1, so the curve above is still the shape and this is still a
  // tilt – see `brandCrowdMult`.
  return Math.round(((M.perFamePointCents * reach * reach) / M.famePivot) * brandCrowdMult(signals))
}

/** ⭐⭐⭐ WHAT A BUYER PAYS PER DOLLAR OF WHAT IT EARNS – the multiple, EARNED rather than constant.
 *
 *  ⚠⚠ THIS FUNCTION IS THE WHOLE DECOUPLING. While the multiple was a constant, worth was income
 *  wearing a bigger number and no signal could reach one without reaching the other in the same
 *  proportion. Here the career's own durability moves it – so two careers at IDENTICAL fame are
 *  worth different money, which is the thing the old model could not express: a girl who was famous
 *  for one enormous season is not the asset a girl who was top-20 for eight years is, however loud
 *  the two seasons sounded.
 *
 *  ⭐⭐⭐ ROUND 32 #3, 31.08 – AND THE BASE IS NOW A RAMP IN FAME, WHICH IS THE HALF THIS FUNCTION WAS
 *  MISSING. On his own w933 career the multiple read 18.23x – all but the 20x ceiling – on a brand
 *  turning over $89,428 a year, and every term of it was about her TENNIS: «личный бренд в цене
 *  подрос с 250к до 1.8м, а доход у него 1800 в неделю =))) что как-будто бы не очень соответствует
 *  стоимости.» HIS RULING ON THE REPAIR, and it is the specification: «её известность 22.3 – да, это
 *  ок, главное, чтобы ЭТА ИЗВЕСТНОСТЬ УЧАСТВОВАЛА В МЕХАНИЗМЕ, тогда мы увидим разницу на других
 *  карьерах.»
 *
 *  So the base runs from `V.unknownX` – what a brand nobody has heard of is worth per dollar – to
 *  `baseX` at `ECONOMY.fame.cap`, and the four career rungs are a PREMIUM ON TOP of it rather than
 *  the whole of it. ⭐⭐ THE TOP CANNOT MOVE, BY CONSTRUCTION AND NOT BY A CAP: at fame 100 the ramp
 *  IS `baseX`, so the multiple there is identical to the pre-round-32 one for every career, and his
 *  standing ruling that the ceiling is not to be cut («спонсорские коллаборации со спортсменами дают
 *  и не такое, кратно большее») is satisfied to the cent. Only the bottom of the scale moves.
 *
 *  ⚠⚠ TWO SHIPPED CLAIMS ARE OVERTURNED BY THIS AND BOTH ARE NAMED RATHER THAN LEFT TO ROT:
 *
 *    1. «A TITLE MOVES THE INCOME AND NOT THE MULTIPLE.» It moves both now, because it moves fame
 *       and fame is the base. That was written as a defence against the one-dial defect – pricing
 *       one fact twice – and the answer to it is that these are not one fact priced twice but the
 *       two halves of what a buyer actually asks: how much does it earn, and how BIG is it. The
 *       size of this business is her fame, so the size term is a fame term. A brand doing $89k of
 *       trade does not change hands at the multiple of one doing $1.5M, whatever the founder's
 *       résumé says.
 *    2. «THE MULTIPLE DOES NOT FALL.» It can now, because fame falls. The file's argument for the
 *       ratchet was that a career that happened cannot un-happen, and that is still true of the four
 *       rungs – they are monotone and nothing here subtracts. What can un-happen is being TALKED
 *       ABOUT, and a business the world has stopped noticing is smaller as well as poorer. ⚠ The
 *       consequence is that a slump now compounds – income falls as fame² and the multiple falls
 *       with fame on top – and it is MEASURED rather than hoped about:
 *       docs/specs/brand-multiple-follows-fame-2026-08.md §6, against the same 72-career walk round
 *       30 #23 was sized on. The mark floor (`ECONOMY.shop.businessValueFloorShare`) is what stops
 *       it reaching zero, exactly as before.
 *
 *  ⚠ AND IT COSTS THE DAY-ONE ANCHOR, WHICH IS THE ONE THING THIS CHANGE COULD NOT HOLD. Round 30
 *  #9 sized `earningsMultipleX` so the brand is worth about what it cost at the fame a family holds
 *  the week it can first afford it (median fame 9.6). A multiple that rises with fame must be LOWER
 *  at fame 9.6 than at 22.3, so bringing his number down necessarily brings the day-one number down
 *  with it – there is no monotone shape that does one without the other, and §4 of the spec proves
 *  it as arithmetic rather than asserting it. The size of the move is measured there, and the one
 *  dial that restores the anchor is the rung's own `entryCents`, which is HIS to rule on.
 *
 *  ⚠ THE BAND IS WIDE SINCE ROUND 32 #3 AND THAT IS THE ITEM. `V.unknownX` is the multiple a brand
 *  with nothing behind it and nobody watching earns, `baseX` is what the ramp reaches at
 *  `ECONOMY.fame.cap` and `maxX` is the ceiling; the research's own band is wide, thin and a choice
 *  (Beckham's DRJB ~10.9x profit, the Nadal academy ~31x – §5.4), so the sizing criterion is ours.
 *  It USED to be the day-one «fair on the day they can afford it» reading round 30 #9 measured; that
 *  criterion and the owner's round-32 complaint cannot both be satisfied by any multiple that rises
 *  with fame, and the arithmetic of why is docs/specs/brand-multiple-follows-fame-2026-08.md §4. His
 *  complaint won; the day-one number moved and is reported there rather than papered over. See
 *  docs/specs/brand-worth-and-income-2026-08.md for the round-30 predicted vs measured.
 *
 *  ⚠⚠ `baseX` IS THE RUNG'S OWN `earningsMultipleX` AND IS PASSED IN RATHER THAN READ HERE, so the
 *  catalogue keeps exactly one number saying «this rung is priced on its earnings, and this is where
 *  that pricing starts». A copy of it in `ECONOMY.business.merch.value` would be a second home for
 *  one fact and would be free to drift from the row the shop actually sells.
 *
 *  Pure arithmetic on a value object: no world, no clock, no draw. */
export function brandMultipleX(signals: BrandSignals, baseX: number): number {
  const V = ECONOMY.business.merch.value
  // ⭐⭐⭐ ROUND 32 #3 – HOW BIG THE BUSINESS IS, 0..1, and the fame axis is `ECONOMY.fame.cap`'s own
  // rather than a typed 100: the ramp has to reach `baseX` exactly where fame stops, or the top of
  // the shelf moves. ⚠ CLAMPED BOTH WAYS. `fameAt` already answers inside [0, cap], so neither bound
  // can bite today – they are here because a ramp that ran past 1 would lift the ceiling this change
  // is forbidden to touch, and that must be impossible by construction rather than by a caller's
  // good behaviour.
  // ⭐⭐ REVISION (31.08) – AND IT IS THE REACH, ON THE SAME CLOCK AS THE INCOME. The size of this
  // business is how many people it reaches, and after the revision that is `brandReachOf` and not
  // this week's attention. ⚠ IT HAS TO BE THE SAME NUMBER THE INCOME READS, or the two halves of the
  // worth would price different brands – which is precisely the disagreement `brandBuiltSignals`
  // was deleted for. `reach ≤ cap` because both fame and strength are, and `retention < 1`.
  const known = Math.min(1, Math.max(0, brandReachOf(signals) / ECONOMY.fame.cap))
  let x = V.unknownX + (baseX - V.unknownX) * known
  x += V.seasonX * Math.min(signals.proSeasons, V.seasonCapN)
  x += V.topSeasonX * Math.min(signals.topSeasons, V.topSeasonCapN)
  x += V.finalX * Math.min(signals.finalsLost, V.finalCapN)
  // ⚠ THE WIN-RATE TERM IS A SHARE OF A WINDOW AND NOT A RATE TIMES A WEIGHT, so a career that loses
  // more than it wins earns nothing here and is never charged for it – «мы ни за что не наказываем»
  // read against a signal that is below its window for most of a climbing career.
  // ⚠ THE FLOOR ON THE SPAN IS NOT DEFENSIVE NOISE: `winRateTo === winRateFrom` is a one-character
  // retune away, and it would divide by zero into a NaN multiple, which would reach the wallet as a
  // NaN valuation rather than as a crash. Money must not be able to become NaN quietly.
  const span = Math.max(1e-9, V.winRateTo - V.winRateFrom)
  const over = Math.min(1, Math.max(0, (signals.winRate - V.winRateFrom) / span))
  x += V.winRateX * over
  return Math.min(V.maxX, x)
}

/** ⭐⭐ WHAT A WHOLE BRAND IS WORTH, in cents, before anybody owns it: a year of what it takes in,
 *  times the multiple the career has earned. The two functions above, joined – and the only place
 *  they are joined, so a screen and a valuation cannot disagree about what a brand is worth.
 *
 *  ⭐⭐⭐ REVISION (31.08) – AND THE SUBSTITUTION THAT USED TO SIT HERE IS GONE, WHICH IS THE POINT.
 *  Round 32 #4 shipped a second mechanism (`brandBuiltSignals`) that priced the WORTH on the slow
 *  stock while the income kept reading fame. That floored the valuation and left the revenue to
 *  collapse, and the owner stopped it: «На пятом году бренд стоит $166 060 при годовом доходе
 *  $1 352». With the memory moved into the REACH the income already reads, worth is floored THROUGH
 *  the income and this function is a plain product again – one mechanism doing one job, which is the
 *  argument §4 of the spec was written on.
 *
 *  ⭐⭐ SO `worth / a year of income` IS THE MULTIPLE AGAIN, exactly, and round 30 #9's claim – which
 *  round 32 #4 had to record as overturned – is restored rather than merely repaired. That ratio is
 *  therefore bounded by the multiple's own band, [`value.unknownX`, `value.maxX`], at EVERY week of
 *  every career, by construction and not by tuning. It is the acceptance the revision exists to meet.
 *
 *  ⚠ NO FLOOR HERE. The mark's floor is a share of what the FAMILY PAID (`businessValueFloorShare`),
 *  which is a fact about the owned row and not about the brand, so it is applied at the ownership
 *  boundary in `world/assets.ts` where the row is. */
export function brandGrossWorthCents(signals: BrandSignals, baseX: number): number {
  return Math.round(brandWeeklyGrossCents(signals) * WEEKS_PER_YEAR * brandMultipleX(signals, baseX))
}

/** ⭐⭐⭐ REVISION (31.08) – THE REACH THE BRAND ACTUALLY SELLS INTO: this week's attention, or what
 *  is left of the brand she built, whichever is larger. `docs/specs/brand-inertia-2026-08.md` §14.
 *
 *      effectiveReach = max(fame, retention x strength)
 *
 *  ⚠⚠ THE MEMORY BELONGS HERE AND NOT IN THE VALUATION, AND THAT IS THE WHOLE REVISION. Round 32 #4
 *  read §3's premise correctly – a brand keeps «a name, a shelf, a distribution and a customer who
 *  already owns two of its shirts» – and then put the memory in the wrong place: it floored the
 *  WORTH and left the INCOME a bare function of fame. The customer who already owns two shirts KEEPS
 *  BUYING when she stops winning, so it is the REVENUE that must not collapse; a valuation that
 *  holds while its earnings evaporate is not a valuation, and 123x annual earnings at the tail is
 *  what that looks like.
 *
 *  ⭐⭐ THE TOP OF THE SHELF IS PRESERVED BY CONSTRUCTION, NOT BY A CLAMP, and `retention < 1` is the
 *  entire proof. `brandStrengthAt` pins strength to fame at the cap and at every running peak
 *  (its own header's properties 1 and 2), so `retention x strength < fame` exactly where the best
 *  careers live and the max resolves to `fame`. The floor can only bind on the way DOWN – the one
 *  place the owner asked anything to move – and the peak income curve is the pre-wave one term for
 *  term.
 *
 *  ⚠ IT IS READ BY BOTH HALVES OF THE PRICING, deliberately: `brandWeeklyGrossCents` squares it and
 *  `brandMultipleX` ramps on it. A business is as big as the audience it reaches, so the size term
 *  and the revenue term have to be asked about the same audience or the worth would price a
 *  different brand from the one the ledger pays.
 *
 *  Pure arithmetic on a value object: no world, no clock, no draw. */
export function brandReachOf(signals: BrandSignals): number {
  return Math.max(signals.fame, ECONOMY.business.merch.strength.retention * signals.strength)
}

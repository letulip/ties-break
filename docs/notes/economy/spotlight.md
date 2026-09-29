---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The spotlight block

The comment essays that stood above the `spotlight` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `spotlight`

```ts
  // --- The spotlight: the weight of being known (who-she-is §3c / §3c-bis, wave 6) ---------
  // ⚠⚠ THIS BLOCK READS FAME AND NEVER TUNES IT. `ECONOMY.fame` is fame-presence's ground
  // (docs/specs/fame-presence-2026-09.md) and the spotlight wave may not touch a number in it – the
  // wave's §8, proven at the final gate by a grep. What lives here is the wave's OWN two questions:
  // where the world starts calling her news, and what counts as a big stage.
  //
  // ⚠ WHAT IS DELIBERATELY NOT HERE YET, so nobody reads the absence as an oversight – the
  // psychologist block's own rule one concern up, and for its reason («a constant with no reader is
  // a constant nobody can be wrong about yet»): ⭐ NOTHING, SINCE T7 (14.09). The list this note kept
  // is empty: `leakBasePerWeek` / `leakOpennessMult` / `wrongShare` landed with T6's hazard and
  // `newsWindowWeeks` with T7's booth, and every one of them is struck below rather than left
  // standing here as a stale forecast.
  // ⭐ AND T5 KEPT THE PROMISE THIS NOTE MADE FOR IT (14.09): the fifth focus's two ladders
  // (`publicLifeShrink`, `publicLifeAccel`) landed in `ECONOMY.psychologist` beside the other focus
  // tables and NOT in this block – they are the seat's price list, and this block holds only what is
  // true of a career with nobody hired. Nothing of T5's is here, which is why nothing of T5's is
  // struck from the list above.
  // ⭐ T3 IS HERE (14.09) AND IT TOOK EXACTLY THE TWO THAT SENTENCE PROMISED IT: `pressureBase` and
  // `opennessScale` below.
  // ⭐ AND T4 IS HERE (14.09) WITH THE TWO IT WAS PROMISED: `habituationFullWeeks` and
  // `habituationFloor`, which are struck from the list above rather than left standing in it – the
  // list is edited as each task lands rather than kept as a stale forecast. What is still absent is
  // T6's three and T7's one.
  // ⭐ AND T6 IS HERE (14.09) WITH EXACTLY THE THREE IT WAS PROMISED: `leakBasePerWeek`,
  // `leakOpennessMult` and `wrongShare`, all struck from the list above.
  // ⭐ AND T7 IS HERE (14.09) WITH THE ONE IT WAS PROMISED AND NO SECOND: `newsWindowWeeks` below,
  // and NOTHING for the beat itself. The booth's copy lives in `src/viz/commentary.ts` where all
  // booth copy lives, its placement is that file's own `PRIORITY` table, and the mention is
  // DETERMINISTIC by design (the wave's §3) – so there is no chance, no cooldown and no per-week cap
  // to price here. The once-ness is the episode's two stamps and not a number.
  // ⭐ D5 (14.09) LATER ADDED TWO BESIDE T6's THREE – `leakFreshWeeks`/`leakFreshMult`, the
  // owner's own word on the founding scene – and D1 replaced the fame bar with the two rank bands.
  // ⚠ AND T6 ADDED NO FOURTH, which is worth saying because ruling I
  // gives the hazard a FAME factor the brief had dropped: the factor is `ECONOMY.fame.cap`, which
  // this block READS and never writes, so the ruling restored a term of the spec's own formula
  // without opening a tunable the owner would have to price.
```

## `spotlight.newsRankKnown`

```ts
    /** ⭐⭐⭐ THE BAR THE WHOLE WAVE STANDS BEHIND – and since the owner's D1 (14.09) it reads her
     *  RANK, never her fame. His words, verbatim, because they are the design: «у нас % достижения
     *  топ-100 огромный, вот уже с топ-200 можно иногда начинать что-то говорить, а в топ-100 так и
     *  вполне уверенно, прямая аналогия – спонсорская лестница». So membership is a STANDING, the
     *  sponsor ladder's own currency (its tour rung gates at WTA ≤ 200 in this same file), with
     *  three bands read by ONE predicate (`newsStandingOf`, `world/spotlight.ts`):
     *
     *      'known'    – WTA rank ≤ newsRankKnown:  she lives known; every kind, habituation grows
     *      'noticed'  – WTA rank ≤ newsRankNoticed: the light finds her only on her occasions;
     *                   every kind may fire, the leak runs at `noticedLeakScale`, and habituation
     *                   does NOT grow – an occasional guest of the light never gets used to it
     *      'quiet'    – everything else: no spotlight, whatever she wins
     *
     *  ⚠⚠ FAME IS OUT OF THE GATE AND STAYS IN THE LEAK – deliberately both. The gate's history
     *  (ruling E's struck anchor, the 33-save measurement that showed a fame bar of 30 excludes
     *  five of eight of the owner's own careers) is preserved in the questions doc §1 and the
     *  decision log's 14.09 entry; fame remains the brand economy's number and the leak hazard's
     *  «more lenses on a bigger star» factor (ruling I, below), which D1 did not touch.
     *
     *  ⚠⚠ THE TWO NUMBERS ARE THE OWNER'S OWN (top-100 / top-200 are his sentence, not a proposal) –
     *  what stays benchable is their EFFECT: T9's news-week shares re-print per band under
     *  `bench:spotlight`. ⚠ And the read carries the house belt: «unranked is not rank one» –
     *  `newsStandingOf` requires live professional points beside the cached rank, the same guard
     *  every rank reader in `world/ladder.ts` carries. */
```

## `spotlight.stageTierMin`

```ts
    /** ⭐⭐⭐ WHAT COUNTS AS A BIG STAGE – the lowest rung whose title, final or early exit puts her
     *  in the light. `'wta500'`, so the set is {wta500, wta1000, slam} today and the slam fortnight
     *  counts by construction.
     *
     *  ⚠⚠ A `TierId` AND NEVER A NUMBER, which is the architect's ruling F and corrects the brief's
     *  own `stageTierMin 500`. THERE IS NO NUMERIC TIER SCALE to compare 500 against: `TierId`
     *  (`season/types.ts`) is a string union of sixteen names – local · regional · national · j30 ·
     *  j60 · j300 · w15 · w35 · w50 · w75 · w100 · wta125 · wta250 · wta500 · wta1000 · slam – and
     *  `wta125` would break any map anybody built from the digits.
     *
     *  ⚠⚠ THE COMPARISON IS `TIER_LADDER`'s OWN INDEX, never a hand-written set of names. The ladder
     *  (`season/calendar.ts`) is the canonical ordering and its own comment says the arithmetic
     *  «moves with the list rather than with a number anybody edited» – it recorded a sixteen-rung
     *  widening that cost «adding four names to this array and nothing else». The alternative's
     *  failure is recorded in this repo in its own words (`src/art/venues.ts:150`): a hand-written
     *  tier array whose `indexOf(t)` «was −1 for every one of them, the lower-tier walk never» ran –
     *  silent, because `indexOf` does not throw. A `['wta500','wta1000','slam']` here is that defect
     *  pre-booked: the week a rung joins the ladder the spotlight quietly stops seeing it.
     *  `tests/wave6-spotlight-ledger.test.ts` §A asserts this value resolves to an index > -1, so a
     *  renamed rung goes red with a sentence instead of turning the spotlight off.
     *
     *  ⚠ A PROPOSAL, LIKE THE BAR ABOVE – the brief's §4 lists it under «Proposals – NONE ruled»,
     *  and what ruling F settles is its TYPE, not its rung. T9 prices where the bar belongs. */
```

## `spotlight.pressureBase`

```ts
    /** ⭐⭐⭐ WHAT ONE EXPOSURE EVENT COSTS HER, **BEFORE ANY SCALING** – the spirit points T3's term
     *  subtracts per event, per kind, keyed by `ExposureKind` so a sixth kind is a design decision
     *  with a number attached rather than a convenience (`world/spotlight.ts`'s own ⚠).
     *
     *  ⚠⚠ «BEFORE SCALING» IS THE LOAD-BEARING HALF OF THE SENTENCE AND IT IS THE ARCHITECT'S RULING
     *  L. These are §3c's «−2..−4 before scaling», so they take `ECONOMY.spirit.perturbationScale`
     *  EXACTLY ONCE, inside T3's own summand – which is why that summand sits OUTSIDE
     *  `weekPerturbation`'s multiplication. The alternative's cost is recorded in this file one
     *  concern up, on `spirit.shock`: those constants are ALREADY intensity-scaled (−27.5 × 0.8 =
     *  −22.0, × 1.25 = −34.4), and a row inside `weekPerturbation` would have scaled them a SECOND
     *  time, to −17.6 / −42.5. A future editor who moves these rows into `perturb` repeats that
     *  defect on new numbers.
     *
     *  ⚠⚠ ALL FIVE ARE §4 PROPOSALS AND NOT ONE OF THEM IS RULED. The brief's own §4 lists them
     *  under «Proposals – NONE ruled, all bench-priced predicted-first, his word after», and the
     *  architect's ruling N measured what they put ON SCREEN before anybody tunes them: at these
     *  bases the deepest single event the wave has – a heavily public loss, expressed-open, steady,
     *  at baseline 70 – lands at 67.6, which is ONE TENTH above the `dimmed` band edge (67.5). The
     *  spotlight's own worst contribution for that girl is 2.40 against a 2.50 distance to the edge,
     *  so it never crosses a Mood band ALONE: it tips a week the ordinary weather had already
     *  carried to the boundary. For scale, a break-up is −22 / −34 on the same axis. ⚠ Ruling N is
     *  explicit that this is NOT a re-tune – «no constant moves in this wave on my word» – so what
     *  T3 ships is the shape, pinned as a RATIO, and T9 prices the sizes.
     *
     *  ⚠ THE RANKING IS THE SPEC'S, NOT A GUESS: a wrong public story and a heavily public loss are
     *  the two deepest (−4), a shoot is the shallowest (−2) because the cameras were invited, and a
     *  big stage and the booth's mention sit between (−3). */
```

## `spotlight.opennessScale`

```ts
    /** ⭐⭐⭐ WHO CARRIES IT WELL – the multiplier on every exposure event, read off her EXPRESSED
     *  openness (§0.6: the mechanics read expression, the voices read birth).
     *
     *  ⚠⚠ ANCHORED, NOT PROPOSED – the one pair of numbers in this block that is the SPEC'S OWN.
     *  who-she-is §3c: an open girl half-feeds on the attention and pays ×0.75; a private one pays
     *  ×1.5. The brief's §4 lists it under «Anchored by the spec» beside the note that the intensity
     *  scale is the STANDING `perturbationScale` and never a new constant.
     *
     *  ⚠ THE RATIO IS THE SHAPE AND IT IS PINNED AS ONE (ruling N part 2): 1.5 / 0.75 is exactly ×2,
     *  so the same event costs an expressed-private girl exactly twice what it costs an
     *  expressed-open one before habituation. T3's pin asserts the RATIO rather than either number,
     *  precisely so a §4 re-tune of `pressureBase` cannot silently break the shape it is about. */
```

## `spotlight.habituationFullWeeks`

```ts
    /** ⭐⭐⭐ HOW MANY WEEKS OF LIVING KNOWN IT TAKES TO BE FULLY USED TO IT – the denominator of
     *  `habituationScale` (engine/spirit.ts) and the CAP `growHabituation` clamps the counter at.
     *  104, two full seasons of being news, which is the brief's own gloss on the number.
     *
     *  ⚠⚠ IT IS A DENOMINATOR AND A CAP AT THE SAME TIME, AND THAT IS WHY IT IS ONE CONSTANT AND NOT
     *  TWO. `spotlightHabituation` is clamped here by the writer, and the reader divides by the same
     *  value – so the scale reaches `habituationFloor` exactly when the counter reaches its ceiling
     *  and never travels past it. Two constants could disagree; one cannot.
     *
     *  ⚠⚠ A §4 PROPOSAL AND **UNRULED**, exactly like the bar and the bases above. The brief's §4
     *  lists it under «Proposals – NONE ruled, all bench-priced predicted-first, his word after»
     *  («`habituationFullWeeks 104` (two seasons of living known)»), and T4 ships the SHAPE – linear,
     *  floored, frozen by walls, capped – with the size left for T9's benches and the owner's word.
     *  ⚠ Nothing in T4's pins asserts 104: they read this constant, so a re-tune moves both sides of
     *  every expectation together and the shape stays guarded. */
```

## `spotlight.habituationFloor`

```ts
    /** ⭐⭐⭐ THE MOST BEING USED TO IT CAN EVER SAVE HER – the floor of `habituationScale`. At a full
     *  `habituationFullWeeks` a veteran pays 0.25 of what the same week cost her the first time.
     *
     *  ⚠⚠ THE FLOOR IS THE POINT, NOT THE DISCOUNT. who-she-is §3c's own sentence is «a veteran star
     *  from a good home shrugs at cameras that once cost her sleep» – a SHRUG and not an immunity.
     *  A floor of 0 would make a long-famous girl free of the spotlight entirely, and the mechanic
     *  would quietly switch itself off in exactly the careers it was written for; the brief's §4 says
     *  the same thing in its own words («the floor keeps the cameras from ever costing exactly
     *  nothing»).
     *
     *  ⚠⚠ A §4 PROPOSAL AND **UNRULED**. «`habituationFloor 0.25`» sits in the same «NONE ruled»
     *  list as everything else in this block bar `opennessScale`, and T9 prices it.
     *
     *  ⚠ AND THE FLOOR IS GUARANTEED BY THE **WRITER'S** CLAMP AND BY NOTHING IN THE READER, which
     *  is stated out loud because it is a coupling across two functions: `habituationScale` is the
     *  ruled formula verbatim and carries no second clamp, so it is total and correct on
     *  `[0, habituationFullWeeks]` – the interval `growHabituation` is pinned to keep the counter
     *  inside. A counter forced past the cap by some future second writer would drive the scale
     *  below this floor and, far enough, through zero into a spotlight that PAYS her. The one writer
     *  and its cap pin are what stand between; a second writer must re-read this note. */
```

## `spotlight.leakBasePerWeek`

```ts
    /** ⭐⭐⭐ HOW OFTEN A PRIVATE LIFE GETS OUT – the BASE weekly probability that the world learns
     *  about an attachment nobody outside the family knows of (who-she-is §3c-bis, «the leak
     *  hazard»). It is the bottom of a product and never the rate itself:
     *
     *      leakBasePerWeek × leakOpennessMult[openness] × (fameAt(world, week) / ECONOMY.fame.cap)
     *
     *  ⚠⚠ THE THIRD FACTOR IS THE ARCHITECT'S **RULING I** AND IT IS NOT OPTIONAL. The wave brief
     *  dropped the fame term on the grounds that «more lenses on a bigger star is already priced by
     *  the news gate»; measured, it is not – inside the news bands fame still runs the whole scale, so under
     *  the brief's spelling a girl at 100 leaked at EXACTLY the rate of a girl at 30. That is a
     *  different claim, not a smaller one, and who-she-is §3c-bis's own sentence («scales by fame ×
     *  EXPRESSED openness – more lenses on a bigger star») wins under the wave's single-source rule.
     *  ⚠ IT ADDS NO TUNABLE: `ECONOMY.fame.cap` is 100 and this block READS it, never writes it (the
     *  wave's §8), and the draw COUNT does not move – still one uniform per eligible episode-week.
     *
     *  ⚠⚠ A §4 PROPOSAL AND **UNRULED**, like everything in this block bar `opennessScale`. At 0.008
     *  the fame factor re-prices the median by roughly 2× against a fameless spelling, and that
     *  re-pricing is T9's to measure and the owner's to rule. */
```

## `spotlight.leakOpennessMult`

```ts
    /** ⭐⭐⭐ WHO IS SIMPLY SEEN – the multiplier on the leak hazard, read off her EXPRESSED openness
     *  (§0.6: mechanics read expression, voices read birth). §3c-bis: «an open girl is simply seen
     *  (dinner, a hand held at an airport)», a private one is not.
     *
     *  ⚠ IT IS THE MIRROR OF `opennessScale` AND POINTS THE OTHER WAY, which is the whole design and
     *  is easy to «fix» by accident: the open girl leaks FOUR times as often (×2.0 against ×0.5) and
     *  pays HALF as much for each exposure (×0.75 against ×1.5). Openness is not a good or a bad
     *  trait here; it decides which half of the bargain she gets.
     *
     *  ⚠⚠ A §4 PROPOSAL AND **UNRULED**. T9's bench prices the pair, and the census prints share
     *  leaked and median lag per temperament (§3c-bis's own expectation: «open leaks often/true,
     *  private rarely/late/wrong»). */
```

## `spotlight.newsWindowWeeks`

```ts
    /** ⭐⭐⭐ HOW LONG A PUBLIC FACT STAYS **NEWS** – the booth's window, in weeks, measured from the
     *  week the fact itself became public (`publicWeek` for «someone is there», `endedWeek` for «it
     *  is over»). Inside it the booth may touch the fact once; outside it the fact is old and is
     *  never voiced at all (T7, `world/lifeBeat.ts` §10).
     *
     *  ⚠⚠ IT IS A WINDOW ON THE **FACT**, NOT A COOLDOWN ON THE BOOTH, and the difference is the
     *  whole design. A cooldown would make the mention a rate the booth is allowed; this makes it a
     *  property of the STORY – a headline six weeks old is not what a commentator fills a changeover
     *  with. The once-ness is carried by the two `aired*` stamps and by nothing here, so shortening
     *  this number can only ever make the booth say LESS, never say it twice.
     *
     *  ⚠ INCLUSIVE, AND THE COMPARISON IS `week − factWeek <= newsWindowWeeks` – «a fact OLDER than
     *  `newsWindowWeeks` is never aired», the brief's own sentence, so a fact of exactly this age
     *  still airs and one week older never does. Both edges are pinned
     *  (`tests/wave6-booth-channel.test.ts` §C) precisely because an off-by-one here is invisible in
     *  play.
     *
     *  ⚠⚠ A §4 PROPOSAL AND **UNRULED**, like everything in this block bar `opennessScale`. The
     *  brief's §4 lists it under «Proposals – NONE ruled, all bench-priced predicted-first, his word
     *  after» («`newsWindowWeeks 6`»). Six weeks is the brief's number and T9 prices it; nothing in
     *  T7's pins asserts the 6 – they read this constant, so a re-tune moves both sides of every
     *  expectation together. */
```

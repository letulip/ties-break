// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/spotlight.md#the-spotlight-block

import type { TierId } from '../season/types'
// ⚠⚠ TYPE-ONLY, AND IT POINTS AT A MODULE THAT IMPORTS **THIS ONE** AT RUNTIME (`world/spotlight.ts`
// reads `ECONOMY`), which is exactly why it is spelled `import type` and may never become a value
// import. `import type` is erased at compile time, so this closes no runtime cycle at all – the same
// shape `TierId` above uses and the same discipline every `world/*.ts` leaf uses for `WorldState`.
// What it buys is that `pressureBase` is typed `Record<ExposureKind, number>` and therefore TOTAL:
// the day a sixth exposure kind joins the union, `vue-tsc` names the missing base instead of letting
// a kind ship priced at `undefined`, which would poison the whole weekly sum with `NaN`.
import type { ExposureKind } from '../world/spotlight'

// The spotlight: the weight of being known (who-she-is §3c / §3c-bis, wave 6) – ⚠⚠ THIS BLOCK
// READS FAME AND NEVER TUNES IT. `ECONOMY.fame` is fame-presence's ground
// (docs/specs/fame-presence-2026-09.md) and the spotlight wave may not touch a number in it –
// the wave's §8, proven at the final gate by a grep. What lives here is the wave's OWN two
// questions: where the world starts calling her news, and what counts as a big stage. ⚠ WHAT…
//
// ⚠ spotlight: AND T6 ADDED NO FOURTH, which is worth saying because ruling I gives the hazard a FAME factor the brief had dropped…
// → docs/notes/economy/spotlight.md#spotlight
export const spotlight = {
  /** ⭐⭐⭐ THE BAR THE WHOLE WAVE STANDS BEHIND – and since the owner's D1 (14.09) it reads her
   *  RANK, never her fame. His words, verbatim, because they are the design: «у нас % достижения
   *  топ-100 огромный, вот уже с топ-200 можно иногда начинать что-то говорить, а в топ-100 так и
   *  вполне уверенно, прямая аналогия – спонсорская лестница».
   *
   *  ⚠⚠ spotlight.newsRankKnown: FAME IS OUT OF THE GATE AND STAYS IN THE LEAK
   *  ⚠⚠ spotlight.newsRankKnown: THE TWO NUMBERS ARE THE OWNER'S OWN (top-100 / top-200 are his sentence, not a proposal)…
   *  ⚠ spotlight.newsRankKnown: And the read carries the house belt: «unranked is not rank one»…
   *  → docs/notes/economy/spotlight.md#spotlightnewsrankknown
   */
  newsRankKnown: 100,
  newsRankNoticed: 200,
  /** ⭐⭐⭐ WHAT COUNTS AS A BIG STAGE – the lowest rung whose title, final or early exit puts her
   *  in the light. `'wta500'`, so the set is {wta500, wta1000, slam} today and the slam fortnight
   *  counts by construction.
   *
   *  ⚠⚠ A `TierId` AND NEVER A NUMBER, which is the architect's ruling F and corrects the brief's own `stageTierMin 500`.
   *  ⚠⚠ spotlight.stageTierMin: THE COMPARISON IS `TIER_LADDER`'s OWN INDEX, never a hand-written set of names.
   *  ⚠ spotlight.stageTierMin: A PROPOSAL, LIKE THE BAR ABOVE
   *  → docs/notes/economy/spotlight.md#spotlightstagetiermin
   */
  stageTierMin: 'wta500' as TierId,
  /** ⭐⭐⭐ WHAT ONE EXPOSURE EVENT COSTS HER, **BEFORE ANY SCALING** – the spirit points T3's term
   *  subtracts per event, per kind, keyed by `ExposureKind` so a sixth kind is a design decision
   *  with a number attached rather than a convenience (`world/spotlight.ts`'s own ⚠).
   *
   *  ⚠⚠ spotlight.pressureBase: «BEFORE SCALING» IS THE LOAD-BEARING HALF OF THE SENTENCE AND IT IS THE ARCHITECT'S RULING L.
   *  ⚠⚠ spotlight.pressureBase: ALL FIVE ARE §4 PROPOSALS AND NOT ONE OF THEM IS RULED.
   *  ⚠ spotlight.pressureBase: Ruling N is explicit that this is NOT a re-tune – «no constant moves in this wave on my word»…
   *  ⚠ spotlight.pressureBase: THE RANKING IS THE SPEC'S, NOT A GUESS
   *  → docs/notes/economy/spotlight.md#spotlightpressurebase
   */
  pressureBase: {
    stage: -3,
    shoot: -2,
    publicLoss: -4,
    aired: -3,
    wrongStory: -4,
  } as Record<ExposureKind, number>,
  /** ⭐⭐⭐ WHO CARRIES IT WELL – the multiplier on every exposure event, read off her EXPRESSED
   *  openness (§0.6: the mechanics read expression, the voices read birth).
   *
   *  ⚠⚠ spotlight.opennessScale: ANCHORED, NOT PROPOSED – the one pair of numbers in this block that is the SPEC'S OWN.
   *  ⚠ spotlight.opennessScale: THE RATIO IS THE SHAPE AND IT IS PINNED AS ONE (ruling N part 2)
   *  → docs/notes/economy/spotlight.md#spotlightopennessscale
   */
  opennessScale: { open: 0.75, private: 1.5 },
  /** ⭐⭐ THE ROW'S OWN BAR – the smallest week charge (absolute, AFTER all five factors) the feed
   *  names out loud. The owner's D1b (14.09), «ок» to the architect's recommendation, and it
   *  OVERRIDES ruling N's events-not-points gate for the ROW ONLY: a habituated, focus-held girl
   *  taking −0.33 from a camera week now lives that week quietly, and «every dip explainable»
   *  reads forwards again – a row prints only where there is a dip worth a sentence. ⚠ THE CHARGE
   *  IS UNTOUCHED: the term still lands whatever its size; only the SENTENCE has a floor. */
  rowMinCharge: 1.0,
  /** ⭐⭐⭐ HOW MANY WEEKS OF LIVING KNOWN IT TAKES TO BE FULLY USED TO IT – the denominator of
   *  `habituationScale` (engine/spirit.ts) and the CAP `growHabituation` clamps the counter at.
   *  104, two full seasons of being news, which is the brief's own gloss on the number.
   *
   *  ⚠⚠ spotlight.habituationFullWeeks: IT IS A DENOMINATOR AND A CAP AT THE SAME TIME, AND THAT IS WHY IT IS ONE CONSTANT AND NOT TWO.
   *  ⚠⚠ spotlight.habituationFullWeeks: A §4 PROPOSAL AND **UNRULED**, exactly like the bar and the bases above.
   *  ⚠ spotlight.habituationFullWeeks: Nothing in T4's pins asserts 104: they read this constant…
   *  → docs/notes/economy/spotlight.md#spotlighthabituationfullweeks
   */
  habituationFullWeeks: 104,
  /** ⭐⭐⭐ THE MOST BEING USED TO IT CAN EVER SAVE HER – the floor of `habituationScale`. At a full
   *  `habituationFullWeeks` a veteran pays 0.25 of what the same week cost her the first time.
   *
   *  ⚠⚠ spotlight.habituationFloor: THE FLOOR IS THE POINT, NOT THE DISCOUNT.
   *  ⚠⚠ spotlight.habituationFloor: A §4 PROPOSAL AND **UNRULED**.
   *  ⚠ spotlight.habituationFloor: AND THE FLOOR IS GUARANTEED BY THE **WRITER'S** CLAMP AND BY NOTHING IN THE READER
   *  → docs/notes/economy/spotlight.md#spotlighthabituationfloor
   */
  habituationFloor: 0.25,
  /** ⭐⭐⭐ HOW OFTEN A PRIVATE LIFE GETS OUT – the BASE weekly probability that the world learns
   *  about an attachment nobody outside the family knows of (who-she-is §3c-bis, «the leak
   *  hazard»). It is the bottom of a product and never the rate itself:
   *
   *  ⚠⚠ spotlight.leakBasePerWeek: THE THIRD FACTOR IS THE ARCHITECT'S **RULING I** AND IT IS NOT OPTIONAL.
   *  ⚠ spotlight.leakBasePerWeek: IT ADDS NO TUNABLE: `ECONOMY.fame.cap` is 100 and this block READS it, never writes it (the wave's §8)…
   *  ⚠⚠ spotlight.leakBasePerWeek: A §4 PROPOSAL AND **UNRULED**, like everything in this block bar `opennessScale`.
   *  → docs/notes/economy/spotlight.md#spotlightleakbaseperweek
   */
  leakBasePerWeek: 0.008,
  /** ⭐⭐⭐ NEW COUPLES GET CAUGHT – the owner's D5 (14.09, «давай попробуем как ты предлагаешь»):
   *  the leak hazard runs `leakFreshMult` times hotter while the episode is at most
   *  `leakFreshWeeks` old (`world.week − sinceWeek <= leakFreshWeeks`). The design's own reason:
   *  the founding scene («a parent learning about a boyfriend from a photograph») fired 0 times
   *  in 93 leaks across 160 bench careers, because the parent's disclosure lag is short against
   *  the time a flat hazard needs – and the girl whose untold window is LONG is exactly the
   *  private girl the scene is about. First dinners are where the lenses are; an old couple is
   *  furniture. ⚠ BOTH §4-CLASS PROPOSALS, bench-priced predicted-first (T9 prints the overtake
   *  share per arm), his word after the numbers – the MECHANISM is ruled, the sizes are not. */
  leakFreshWeeks: 8,
  leakFreshMult: 4,
  /** ⭐⭐⭐ WHO IS SIMPLY SEEN – the multiplier on the leak hazard, read off her EXPRESSED openness
   *  (§0.6: mechanics read expression, voices read birth). §3c-bis: «an open girl is simply seen
   *  (dinner, a hand held at an airport)», a private one is not.
   *
   *  ⚠ spotlight.leakOpennessMult: IT IS THE MIRROR OF `opennessScale` AND POINTS THE OTHER WAY
   *  ⚠⚠ spotlight.leakOpennessMult: A §4 PROPOSAL AND **UNRULED**.
   *  → docs/notes/economy/spotlight.md#spotlightleakopennessmult
   */
  leakOpennessMult: { open: 2.0, private: 0.5 },
  /** ⭐⭐ THE NOTICED BAND'S DISCOUNT ON THE LEAK – D1's «иногда» made a number: at 101–200 the
   *  world glances rather than watches, so the hazard runs at half weight; at ≤ 100 the scale is
   *  1 by construction (the band check multiplies by this only at 'noticed'). ⚠ A PROPOSAL –
   *  the bands are the owner's, this discount is the architect's, T9 prices it. */
  noticedLeakScale: 0.5,
  /** ⭐⭐⭐ HOW WRONG THE WORLD GETS IT – the share of leaks that land as a WRONG story, by
   *  EXPRESSED openness. who-she-is §3c-bis's own gem: «openness controls not only the SPEED of a
   *  leak but its ACCURACY. An open girl's life leaks EARLY and roughly TRUE – the world saw it,
   *  it is ordinary. A private girl's life leaks LATE and WRONG – the tabloid misattribution
   *  engine.»
   *
   *  ⚠⚠ THE **LATE** HALF IS EMERGENT AND THERE IS NO LAG TERM ANYWHERE – the brief's own ⚠, kept
   *  here because this is the constant a later reader would reach for to «add the lateness». It
   *  falls out of `leakOpennessMult` alone: a private girl's hazard is a quarter of an open one's,
   *  so her story breaks later in the episode by arithmetic and not by a second number. A lag term
   *  added beside this one would price the same fact twice. T9's census measures the median lag
   *  rather than setting it.
   *
   *  ⚠⚠ A §4 PROPOSAL AND **UNRULED**. */
  wrongShare: { open: 0.15, private: 0.6 },
  /** ⭐⭐⭐ HOW LONG A PUBLIC FACT STAYS **NEWS** – the booth's window, in weeks, measured from the
   *  week the fact itself became public (`publicWeek` for «someone is there», `endedWeek` for «it
   *  is over»). Inside it the booth may touch the fact once; outside it the fact is old and is
   *  never voiced at all (T7, `world/lifeBeat.ts` §10).
   *
   *  ⚠⚠ spotlight.newsWindowWeeks: IT IS A WINDOW ON THE **FACT**, NOT A COOLDOWN ON THE BOOTH, and the difference is the whole design.
   *  ⚠ spotlight.newsWindowWeeks: INCLUSIVE, AND THE COMPARISON IS `week −
   *  ⚠⚠ spotlight.newsWindowWeeks: A §4 PROPOSAL AND **UNRULED**, like everything in this block bar `opennessScale`.
   *  → docs/notes/economy/spotlight.md#spotlightnewswindowweeks
   */
  newsWindowWeeks: 6,
} as const

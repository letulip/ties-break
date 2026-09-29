// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/equipment.md#the-equipment-block

import type { KitGrade, KitLine } from '../../shared/protocol'

// EQUIPMENT CONDITION: what the three lines above are actually WORTH –
// docs/specs/equipment-and-serve-speed.md §2. Until this block existed the gear lines were
// pure outgoings: the game already said she plays a worse racket and restrings half as often,
// and then never let that matter. Nothing new is bought here - the spend that is already on
// the ledger becomes the thing that keeps her equipment honest. ⚠ IT IS CONDITION, NOT…
//
// owner (equipment): «я вот в падел играю и знаю, что чиненая ракетка работает хуже, чем пусть и старая, но целая»
// ⚠ equipment: AND THE ABSOLUTE LIFE IS THE WHOLE ANTI-DESTINY MECHANISM.
// owner (equipment): «если девочка плохо играет - она и с лучшим тренером и в лучшем экипе будет это делать точно так же»
// → docs/notes/economy/equipment.md#equipment
export const equipment = {
  /** STRINGS - the biggest and truest lever, and it is CONTROL rather than power. In real tennis
   *  the gap between a fresh bed and a dead one dwarfs the gap between a good frame and a great
   *  one, and it shows up as balls landing long rather than as pace. Hence `ret`/`groundstrokes`
   *  carry it and `serve` takes a token share - the spec's "a couple of km/h", which is what it
   *  really is. 5 weeks of life against restring cadences of 4 (working) / 3 (middle) / 2
   *  (wealthy): the wealthy girl never leaves the fresh end, the working girl lives at 0.6 wear. */
  stringLifeWeeks: 5,
  stringWear: { ret: 0.03, groundstrokes: 0.03, serve: 0.01 },

  /** FRAME - integrity, a small constant, and the ONE line that is genuinely binary in spirit. A
   *  sound frame is neutral however old it is (`soundWeeks` of exactly nothing), and only past its
   *  service life does it become the patched racket that works worse than an old whole one. At 13
   *  sound weeks the wealthy cadence (10-12) never reaches it at all and the working cadence
   *  (14-18) always does, which is precisely the sentence the price table was already implying. */
  frameSoundWeeks: 13,
  framePatchWeeks: 6,
  frameWear: { serve: 0.008, groundstrokes: 0.008 },

  /** SHOES - traction, and TWO effects rather than one (owner: «в плохих коньках ребята не могут
   *  угнаться за другими в хороших, просто физика так работает»). Movement has no attribute of its
   *  own, so it lands where movement actually pays: `ret` (reaching the ball at all) and `stamina`
   *  (chasing costs more when you slip).
   *
   *  ⚠ SHOES ARE THE BACKGROUND-NEUTRAL LINE ON PURPOSE. Their cadence is 10-14 for EVERY
   *  background - only the price differs - so wear here is identical for a working and a wealthy
   *  career and contributes exactly zero to the background gap. That is deliberate and it is the
   *  safest possible home for the injury half: a richer family must never be able to buy its
   *  daughter out of getting hurt. */
  shoeLifeWeeks: 14,
  shoeWear: { ret: 0.014, stamina: 0.018 },
  /** ...and the second effect: worn shoes multiply the weekly injury threshold by up to this much
   *  again. A POST-DRAW multiply inside `injuryTau`, the same invariance-safe shape as the
   *  vacation recovery buff - the roll is already drawn, only the threshold moves. */
  shoeInjuryRise: 0.2,

  /** THE FRAME'S OWN INJURY HALF (W3-KIT, owner: «экип влияет и на травмы и на производительность
   *  игрока»). A heavy, stiff, dead frame is an ARM story - tennis elbow is the injury a bad
   *  racket actually causes - and until this wave the frame line had a performance half and no
   *  body half at all, which made the shoes carry the whole of "equipment hurts people".
   *
   *  ⚠ equipment.frameInjuryRise: SMALLER THAN THE SHOES' RISE ON PURPOSE, and the ratio is the research's own…
   *  ⚠ equipment.frameInjuryRise: AND IT IS INVISIBLE TO A CAREER THAT BUYS ON CADENCE, WHICH IS WHY IT COULD BE ADDED AT ALL.
   *  ⚠ equipment.frameInjuryRise: WHAT IS DELIBERATELY *NOT* HERE
   *  → docs/notes/economy/equipment.md#equipmentframeinjuryrise
   */
  frameInjuryRise: 0.12,

  // THE QUALITY LADDER: the rung the PLAYER buys – The owner, W3-KIT: «я вообще за оба подхода
  // одновременно, как с тренерами. Мы же точно знаем, что начальные ракетки из алюминия тяжелее
  // и хуже во многом, чем начальные композитные, значит экип влияет и на травмы и на
  // производительность игрока.» So a rung is like a coach rung: it moves BOTH what she can do
  // and what happens to her body, and the parent pays for it.
  //
  // ⚠⚠ equipment.grades: THE LADDER CANNOT BREAK THE ANTI-DESTINY BOUND, AND NOT BECAUSE IT WAS TUNED NOT TO.
  // ⚠ equipment.grades: THE TOP RUNG IS NEUTRAL-OR-SLOWER-WEARING, NEVER A BONUS.
  // → docs/notes/economy/equipment.md#equipmentgrades
  grades: {
    /** THE ALUMINIUM STARTER - the owner's own example, and the only rung that is worse than the
     *  game has ever been. Heavy, stiff, and a frame that plays like one already half spent: it is
     *  slower off the ground and through the ball, it gives up sooner, and it is the rung that
     *  actually hurts her (a stiff frame's shock goes into the arm - see `frameInjuryRise`).
     *  → docs/notes/economy/equipment.md#equipmentgradesalloy
     */
    alloy: { startWear: { strings: 0.20, frame: 0.40, shoes: 0.16 }, lifeFactor: 0.8, priceFactor: 0.55 },
    /** ⚠ THE GAME AS IT SHIPPED, AND EVERY NUMBER HERE IS THE IDENTITY ELEMENT. No handicap, the
     *  service lives above exactly as written, prices exactly `ECONOMY.gear`'s. A v36 career
     *  migrates onto this rung and its wear, its injury threshold and its gear bills are
     *  byte-identical to what they were - which is the whole reason the rung exists at this
     *  position rather than at the bottom of the ladder. */
    composite: { startWear: { strings: 0, frame: 0, shoes: 0 }, lifeFactor: 1, priceFactor: 1 },
    /** What a serious junior's parents actually buy: a current retail frame, a decent poly bed,
     *  proper court shoes. It buys no extra POWER - it cannot, see the note above - it buys the
     *  thing that is actually worth having, which is that her kit is still good in week four. */
    performance: { startWear: { strings: 0, frame: 0, shoes: 0 }, lifeFactor: 1.4, priceFactor: 2.2 },
    /** Tour-level kit. Four times the bill, and what it returns is a girl who is never playing
     *  worn-out equipment - the realised wear that `tools/kit-bench.ts` §2 measures at 0.30-0.40 on
     *  strings and shoes falls by nearly half. Bounded by fresh kit, like everything else. */
    pro: { startWear: { strings: 0, frame: 0, shoes: 0 }, lifeFactor: 1.9, priceFactor: 4 },
  } as Record<KitGrade, { startWear: Record<KitLine, number>; lifeFactor: number; priceFactor: number }>,

  /** THE COPY, kept beside the numbers so a rung cannot ship with a price and no name. Fictional
   *  brands only (CLAUDE.md: real marks are trademarks), in the parent's register - what the thing
   *  IS, not what it does to a coefficient. */
  gradeCopy: {
    alloy: {
      strings: { label: 'Club synthetic', blurb: 'Cheap nylon – it goes dead in a fortnight.' },
      frame: { label: 'Ashline Alloy', blurb: 'Heavy aluminium starter – slow, stiff, hard on the arm.' },
      shoes: { label: 'Court Basics', blurb: 'Flat soles, no support – she slides when she should grip.' },
    },
    composite: {
      strings: { label: 'Multifil Standard', blurb: 'The usual bed – fine until it is not.' },
      frame: { label: 'Ashline Composite', blurb: 'The frame most juniors own. Nothing wrong with it.' },
      shoes: { label: 'Baseline Trainer', blurb: 'Proper court shoes, mid-range.' },
    },
    performance: {
      strings: { label: 'Kestra Control', blurb: 'Holds tension – the bed is still alive in week four.' },
      frame: { label: 'Kestra Team 98', blurb: 'A current retail frame, and it stays sound far longer.' },
      shoes: { label: 'Kestra Grip', blurb: 'Real support underfoot. Fewer rolled ankles.' },
    },
    pro: {
      strings: { label: 'Kestra Tour Gut', blurb: 'What the tour restrings with. Fresh, always.' },
      frame: { label: 'Kestra Pro Stock', blurb: 'Custom-weighted. She will never out-grow it.' },
      shoes: { label: 'Kestra Tour', blurb: 'Fitted, cushioned, replaced before they wear.' },
    },
  } as Record<KitGrade, Record<KitLine, { label: string; blurb: string }>>,
} as const

---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The equipment block

The comment essays that stood above the `equipment` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `equipment`

```ts
  // --- EQUIPMENT CONDITION: what the three lines above are actually WORTH -------------------
  // docs/specs/equipment-and-serve-speed.md §2. Until this block existed the gear lines were pure
  // outgoings: the game already said she plays a worse racket and restrings half as often, and then
  // never let that matter. Nothing new is bought here - the spend that is already on the ledger
  // becomes the thing that keeps her equipment honest.
  //
  // ⚠ IT IS CONDITION, NOT VINTAGE, and that is the owner's own correction from playing padel:
  // «я вот в падел играю и знаю, что чиненая ракетка работает хуже, чем пусть и старая, но целая».
  // So nothing here reads "how expensive was it" - every line reads WEEKS SINCE THE LAST PURCHASE
  // against an ABSOLUTE service life. A string bed dies after so many weeks of play no matter whose
  // daughter is hitting with it.
  //
  // ⚠ AND THE ABSOLUTE LIFE IS THE WHOLE ANTI-DESTINY MECHANISM. Normalising wear by the FAMILY'S
  // OWN cadence instead would make every background sit at the same average freshness and the block
  // would do nothing; normalising by PRICE would let money buy strokes directly, which is the one
  // outcome the spec forbids. An absolute life gives exactly the intended sentence: the wealthy
  // family restrings inside the life and the working family stretches past it.
  //
  // SIZING, AND IT IS MEASURED (tools/kit-bench.ts). The anchor is the relative age effect -
  // SKILL_POINTS_PER_YEAR = 2.4, what a year of junior development is worth. The whole swing from
  // worst kit to best, all three lines at once, must come in UNDER one year of relative age, because
  // the owner's rule is that «если девочка плохо играет - она и с лучшим тренером и в лучшем экипе
  // будет это делать точно так же». Fresh kit is exactly neutral (factor 1) and every line only ever
  // subtracts, which is also what keeps the shipped balance intact for a family that buys on time.
  //
  // RNG: ZERO DRAWS ANYWHERE. Wear is `week - lastPurchaseWeek` over a constant, and the purchase
  // weeks come off the gear sub-streams that already existed. The frozen MAIN capture
  // (41550 / e6b0c709) cannot see any of this.
```

## `equipment.frameInjuryRise`

```ts
    /** THE FRAME'S OWN INJURY HALF (W3-KIT, owner: «экип влияет и на травмы и на производительность
     *  игрока»). A heavy, stiff, dead frame is an ARM story - tennis elbow is the injury a bad racket
     *  actually causes - and until this wave the frame line had a performance half and no body half at
     *  all, which made the shoes carry the whole of "equipment hurts people".
     *
     *  ⚠ SMALLER THAN THE SHOES' RISE ON PURPOSE, and the ratio is the research's own: the body-region
     *  table (engine/body.ts) is ~48% lower limb against ~28% upper, so the line that lands on arms
     *  cannot be priced like the line that lands on ankles. 0.12 against the shoes' 0.20.
     *
     *  ⚠ AND IT IS INVISIBLE TO A CAREER THAT BUYS ON CADENCE, WHICH IS WHY IT COULD BE ADDED AT ALL.
     *  Realised frame wear is 0.041 (working) / 0.010 (middle) / 0.000 (wealthy) - the frame has a flat
     *  head 13 weeks long and the family replaces it inside that - so this multiplies tau by 1.005 for
     *  the worst-off shipped career. It only bites on the `alloy` rung, which is a thing the player has
     *  to choose. Same POST-DRAW multiply as its neighbour: `injuryTau` keeps its pinned arity and
     *  spends no draw.
     *
     *  ⚠ WHAT IS DELIBERATELY *NOT* HERE: steering WHICH part gets hurt. The honest model of a bad
     *  frame is an elbow, and `drawBodyRegion` spends exactly one pull against a twelve-entry table -
     *  so aiming the result would mean either a second draw (forbidden: the private `seed:injury:<week>`
     *  sequence is byte-identical for every career today) or a second region table selected by kit,
     *  which is a bigger change than this wave's evidence supports. The RATE moves; the anatomy does
     *  not, and that is stated rather than quietly skipped. */
```

## `equipment.grades`

```ts
    // --- THE QUALITY LADDER: the rung the PLAYER buys ------------------------------------------
    //
    // The owner, W3-KIT: «я вообще за оба подхода одновременно, как с тренерами. Мы же точно знаем,
    // что начальные ракетки из алюминия тяжелее и хуже во многом, чем начальные композитные, значит
    // экип влияет и на травмы и на производительность игрока.» So a rung is like a coach rung: it
    // moves BOTH what she can do and what happens to her body, and the parent pays for it.
    //
    // ⚠⚠ THE LADDER CANNOT BREAK THE ANTI-DESTINY BOUND, AND NOT BECAUSE IT WAS TUNED NOT TO. A rung
    // does exactly two things to the arithmetic and both live INSIDE `kitWearAt`'s existing
    // `clamp01`: it starts a line partway down its own wear curve (`startWear`), and it stretches or
    // shortens that curve (`lifeFactor`). So every state the ladder can produce is a state the WEAR
    // model could already produce, the whole ladder lives inside [FRESH_KIT, SPENT_KIT], and the
    // nominal swing tools/kit-bench.ts measures against SKILL_POINTS_PER_YEAR is the same 2.01 < 2.40
    // it was before this wave - structurally, not by choice of coefficient. Nothing new was added to
    // the modifier channel; the ladder only decides WHERE ON THE OLD CURVE she stands.
    //
    // MEASURED (tools/kit-bench.ts §6, and the number is repeated in engine/equipment.ts): the
    // REALISED alloy -> pro swing, i.e. what a career actually lives at on the bottom rung against
    // the top one, is what the ladder is really worth. It is reported in skill points against the
    // same 2.4-point yardstick and against the coach ladder's own 2.26.
    //
    // ⚠ THE TOP RUNG IS NEUTRAL-OR-SLOWER-WEARING, NEVER A BONUS. `startWear` is 0 from `composite`
    // up, so no amount of money can put her ABOVE fresh kit - which is the promise engine/equipment.ts
    // has made since it shipped ("Fresh kit is exactly neutral... wear only ever subtracts") and the
    // reason the KID-ONLY asymmetry stays honest: the 199 rivals have no kit bag, so a kid who could
    // buy her way past neutral would be carrying a bonus the field cannot have.
```

## `equipment.grades.alloy`

```ts
      /** THE ALUMINIUM STARTER - the owner's own example, and the only rung that is worse than the
       *  game has ever been. Heavy, stiff, and a frame that plays like one already half spent: it is
       *  slower off the ground and through the ball, it gives up sooner, and it is the rung that
       *  actually hurts her (a stiff frame's shock goes into the arm - see `frameInjuryRise`).
       *
       *  The `startWear` split is the point: the FRAME carries most of it (0.40 of a service life the
       *  moment it is bought) because that is the item the owner named, while cheap synthetic string
       *  and flat-soled trainers are a smaller, realer handicap. `lifeFactor` 0.80 - cheap kit also
       *  dies faster, which is the second half of why it is a false economy. */
```

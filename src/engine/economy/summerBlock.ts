// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/summerBlock.md#the-summerblock-block

// THE SUMMER TRAINING BLOCK (W3-SUMMER) - nine weeks with no school in them – THE OWNER'S
// RULING, and it is a correction of an objection rather than a fresh idea…
//
// owner (summerBlock): «я играл и брал отпуска между турнирами пропуская и коучинговые сессии в том числе»…
// ⚠ summerBlock: SO IT IS VOLUME, NOT A BETTER MULTIPLIER, and that distinction is the whole design.
// ⚠ summerBlock: AND IT MUST NOT BE MANDATORY.
// owner (summerBlock): «частично компенсирует недостаток тренерских недель»
// → docs/notes/economy/summerBlock.md#summerblock
export const summerBlock = {
  /** The multiplier on the week's development rate, through `growWeek`'s `loadFactor`. Two sessions
   *  a day is not twice the learning - the coach's hours are what they are, and volume has sharply
   *  diminishing returns - so it is +40%, not +100%. */
  loadFactor: 1.4,
  /** ...and what the fuller week COSTS her, in condition points, against a free training week's
   *  `recoveryBase` of 8 plus 0-2 from the rest slider.
   *
   *  ⚠ summerBlock.conditionCost: INTEGER, like every other term in the condition accumulator…
   *  → docs/notes/economy/summerBlock.md#summerblockconditioncost
   */
  conditionCost: 3,
} as const

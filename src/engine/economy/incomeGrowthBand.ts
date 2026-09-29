// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.

// THE PARENTS' CAREERS MOVE TOO (owner, round 12: "с каждым новым годом вклад родителей
// приростал процентов на 5-10 рандомно... не фиксированная сумма на всю жизнь"). Each season
// boundary the weekly contribution grows by a uniform draw from this band, COMPOUNDING - season
// N's income is base x prod(1 + roll_i) over seasons 1..N. Both bounds are knobs.
export const incomeGrowthBand = [0.05, 0.10] as [number, number]

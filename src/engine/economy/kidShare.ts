// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/kidShare.md#the-kidshare-block

// ⭐⭐⭐ R9-1's `savings: { apyWeekly: 0.0006 }` STOOD HERE AND ROUND 29 #12 DELETED IT.
//
// owner (kidShare), 28.08: «И я предлагал убрать авто начисление % на текущий счёт.»
// ⚠ kidShare: DELETED RATHER THAN LEFT AT ZERO, deliberately.
// ⚠ kidShare: WHERE MONEY EARNS NOW: `shop.catalogue` below – the deposit at +2% a season and the index fund at +7%…
// → docs/notes/economy/kidShare.md#kidshare

// HER SHARE OF THE PRIZE MONEY (round-23 #18) – the one income line the family stops keeping –
// THE OWNER: «после появления её счета в банке в 18 начать ей призовые переводить какие-то
// суммы, например начать с 10-20% и может быть наращивать год к году», and then, on the
// ceiling: «да, давай, но может не до 30, а до 40 или 50 вообще, это всё-таки ее карьера?»
//
// owner (kidShare), 15.09: «может быть нам с 18 не по 5, а по 10% в год ей добавлять стоит?»
// owner (kidShare), 15.09: «может даже до 60% к 23»
// owner (kidShare): «пока она снова в тур не вернется»
// ⚠ kidShare: WHY EIGHTEEN AND NOT THE BANK CARD.
// ⚠ kidShare: AND THE MONEY GENUINELY LEAVES THE FAMILY WALLET.
// owner (kidShare): «это всё-таки её карьера»
// → docs/notes/economy/kidShare.md#kidshare-2
export const kidShare = {
  /** The birthday the RAMP starts climbing on. Her own bank account is the eighteenth's gift.
   *
   *  ⚠⚠ ROUND 41 #27 (12.09) – IT IS NO LONGER THE AGE THE TRANSFERS START AT, and the field is
   *  renamed in MEANING rather than in spelling because every reader of it still wants this same
   *  week. The owner: «может быть начать отчисления не в 18, а в 16 лет уже или вообще с момента,
   *  когда она в первый раз на w серию приходит? это же всё таки ее призовые», and then «призовые
   *  падают на её счёт с первого старта W-серии независимо от возраста – согласен». Below this
   *  birthday she now keeps `startBps` flat; from it the ladder climbs exactly as it always did.
   *  See `kidPrizeShareBps` for why «с первого старта W-серии» needs no gate of its own. */
  fromAgeYears: 18,
  /** What she keeps of every cheque in that first year – 10%, the bottom of his own «10-20%».
   *  ⭐ ROUND 41 #27: and what she keeps of every cheque BELOW it, which is the same number by
   *  ruling rather than by coincidence – the curve is continuous across her eighteenth. */
  startBps: 1000,
  /** ...and what each birthday after it adds. ⭐⭐ ROUND 42 #25: TEN points a year, his own «не по
   *  5, а по 10% в год», confirmed 15.09. It was five from round 23 until this item.
   *
   *  ⚠ A BIRTHDAY SPENT AT COLLEGE ADDS NOTHING – the steps count tour years only («пока она снова
   *  в тур не вернется»). That is not a fifth constant: `kidPrizeShareBps` takes the paused count
   *  as an argument and `collegePausedShareYears` derives it off the college span the save already
   *  holds. */
  stepBps: 1000,
  /** The ceiling. ⭐⭐ ROUND 42 #25: 60%, reached at TWENTY-THREE – his «может даже до 60% к 23».
   *  It was 50% at 26 from round 23 until this item, and both halves of that pair moved together:
   *  at ten points a birthday the cap is what decides where the ladder stops, and 60 at 23 is the
   *  shape he confirmed seeing what it does to the family's corridor (the bench print, invariant 5).
   *
   *  ⚠ 23 IS NOT WRITTEN ANYWHERE – it is `fromAgeYears + (capBps − startBps) / stepBps` and falls
   *  out of the three numbers above. Writing the age down as a fourth constant is how a ramp ends
   *  up with two disagreeing definitions of where it stops. */
  capBps: 6000,
} as const

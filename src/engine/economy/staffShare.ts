// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/staffShare.md#the-staffshare-block

// ⭐⭐ THE TEAM'S SHARE OF THE PRIZE MONEY (owner, round 24, 22.08 –
// docs/plans/the-team-share.md) – HIS MODEL, VERBATIM: «3млн призовые из них отчисляется
// процент дочери (скажем 30 для примера) и тренеру (скажем 10 для примера) – это будет 900к
// дочери и 300к тренеру плюс остальные расходы». And on eligibility: «тренер может не ездить,
// но долю получать наверное за победы или 2е места вполне может. За 2е только по-меньше».
//
// owner (staffShare): «мне всё-таки кажется, что массажисту тоже можно за призовые месте давать бонус»…
// owner (staffShare): «за 2е только по-меньше»
// owner (staffShare), 15.09: «я вообще не понял почему мы снова обсуждаем разные проценты»…
// owner (staffShare): «10% от любого заработка на корте»
// ⚠ staffShare: The audit's own verdict line on this very constant read…
// ⚠⚠ staffShare: AND THE MASSEUR IS DELIBERATELY LEFT ON THE ROUND-24 SHAPE
// → docs/notes/economy/staffShare.md#staffshare
export const staffShare = {
  // ⭐⭐⭐ ROUND 42 #41 – FLAT TEN PER CENT AT EVERY FINISH. The three numbers are equal on purpose:
  // «10% безусловных отчислений с любых призовых, независимо от глубины прохода» has no depth in
  // it, so a title, a lost final and a first-round exit all pay the same rate. `finalBps` moved
  // from 500 to 1000 with the rest of them – round 24's «за 2е только по-меньше» was a statement
  // about DEPTH, and his 15.09 word removes depth from the coach's line entirely.
  coach: { titleBps: 1000, finalBps: 1000, everyBps: 1000 },
  // ⚠ THE MASSEUR IS UNCHANGED, AND `everyBps: 0` IS ROUND 24'S SHAPE SPELLED IN THE NEW FIELD –
  // a title-and-final bonus, nothing below a final. See the block above: whether he follows the
  // coach onto every cheque is the owner's to rule off the bench, not an agent's to decide.
  masseur: { titleBps: 300, finalBps: 150, everyBps: 0 },
} as Record<'coach' | 'masseur', { titleBps: number; finalBps: number; everyBps: number }>

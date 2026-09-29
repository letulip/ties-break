// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/managerCommission.md#the-managercommission-block

// ⭐⭐⭐ THE MANAGER'S COMMISSION – round 29 part three P3 (owner, 29.08) – HIS RULING, VERBATIM:
// «как менеджер может от этого что-то получать в свою очередь. 10-20% например… контракт на
// полную сумму ребенку приходит на почту, после подписания видим на счету уже родительский
// кат.» Its context: it was put to him that taking half of a cheque paid for her face reads as
// the parent living off the daughter, and he answered «полностью согласен».
//
// ⚠⚠ managerCommission: WHAT IT REPLACES, AND THE HEADLINE UNDERSTATED IT.
// ⚠ managerCommission: SPONSOR CHEQUES ONLY.
// ⚠ managerCommission: NO AGE GATE, DELIBERATELY, and it is the ruling rather than an omission…
// ⚠⚠ managerCommission: ROUND 41 #15 MADE THAT LAST SENTENCE'S «CLOSE TO UNREACHABLE» LESS TRUE AND THE RULING MORE LOAD-BEARING
// owner (managerCommission): «реклама открывается с 16 … согласен»
// → docs/notes/economy/managerCommission.md#managercommission
export const managerCommission = {
  /** ⚠ PROVISIONAL AND HIS TO MOVE – the midpoint of his own «10-20% например», picked because he
   *  named a band and not a number. It is ONE constant and every sentence on every screen reads
   *  it, so moving it is one edit here. The bench (`tools/sponsor-ladder-reach.ts --commission N`)
   *  overrides it for a run so the band can be swept without a code change. */
  bps: 1500,
} as const

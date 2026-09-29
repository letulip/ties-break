---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The managerCommission block

The comment essays that stood above the `managerCommission` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `managerCommission`

```ts
  // =================================================================================================
  // ⭐⭐⭐ THE MANAGER'S COMMISSION – round 29 part three P3 (owner, 29.08)
  // =================================================================================================
  //
  // HIS RULING, VERBATIM: «как менеджер может от этого что-то получать в свою очередь. 10-20%
  // например… контракт на полную сумму ребенку приходит на почту, после подписания видим на счету
  // уже родительский кат.» Its context: it was put to him that taking half of a cheque paid for her
  // face reads as the parent living off the daughter, and he answered «полностью согласен».
  //
  // ⚠⚠ WHAT IT REPLACES, AND THE HEADLINE UNDERSTATED IT. Until this ruling `bankSponsorCheque`
  // split sponsor cash by HER PRIZE RAMP – so the family kept 100% before her eighteenth, 90% at
  // 18 and 50% only from 26. Measured over 72 careers x 780 weeks the parent actually kept **63.1%
  // of gross sponsor money**, so this is not «50% -> 15%», it is **63.1% -> 15%**.
  //
  // ⚠ SPONSOR CHEQUES ONLY. Prize money's own 50/50 ramp is his standing ruling of 23 #18 and is
  // untouched: `finalizeTournament` still splits the tournament's cheque by `kidPrizeShareBps`, and
  // the staff shares one block up still come off the gross prize. This constant is read at exactly
  // one place in the engine, `bankSponsorCheque`, and by the two screens that describe it.
  //
  // ⚠ NO AGE GATE, DELIBERATELY, and it is the ruling rather than an omission: «контракт на полную
  // сумму ребенку» is addressed to HER at any age, so the commission is flat from the first cheque a
  // brand ever writes. In practice the professional rungs open at WTA #200 and the advertising
  // ladder at eighteen, so a pre-eighteen sponsor cheque is close to unreachable – but where one
  // exists, the money is hers minus the fee, not the family's whole.
  // ⚠⚠ ROUND 41 #15 MADE THAT LAST SENTENCE'S «CLOSE TO UNREACHABLE» LESS TRUE AND THE RULING MORE
  // LOAD-BEARING, which is why the paragraph is amended rather than left to rot. The advertising
  // ladder opens at SIXTEEN now (his «реклама открывается с 16 … согласен»), so a junior drinks or
  // clothing letter is a real pre-eighteen sponsor cheque – and this constant is what decides where
  // it lands. It lands the way he ruled it: hers at full value, the parent earning the fee. Measured
  // reach for the junior band is in `docs/specs/ad-portfolio-2026-08.md`'s round-41 section.
```

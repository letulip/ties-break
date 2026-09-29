---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The kidShare block

The comment essays that stood above the `kidShare` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `kidShare`

```ts
  // ⭐⭐⭐ R9-1's `savings: { apyWeekly: 0.0006 }` STOOD HERE AND ROUND 29 #12 DELETED IT.
  //
  // THE OWNER, 28.08: «И я предлагал убрать авто начисление % на текущий счёт.» It paid ~3.1%/yr on
  // the current account every week, automatically and silently, and it grew with the balance.
  //
  // ⚠ DELETED RATHER THAN LEFT AT ZERO, deliberately. A live balance constant that nothing charges
  // is a decision nobody can find – the exact failure this file's own header exists to prevent – and
  // the next reader would wire it back up believing it was a tuning knob. The rate is recoverable
  // from git and from `docs/rounds/round-29.md`; it is not recoverable from a dead field.
  //
  // ⚠ WHERE MONEY EARNS NOW: `shop.catalogue` below – the deposit at +2% a season and the index fund
  // at +7%, both of which round 29 #11 gave top-ups in the same wave. Yield became a decision the
  // parent makes instead of a wage the wallet pays.
```

## `kidShare` (2)

```ts
  // =================================================================================================
  // HER SHARE OF THE PRIZE MONEY (round-23 #18) – the one income line the family stops keeping
  // =================================================================================================
  //
  // THE OWNER: «после появления её счета в банке в 18 начать ей призовые переводить какие-то суммы,
  // например начать с 10-20% и может быть наращивать год к году», and then, on the ceiling:
  // «да, давай, но может не до 30, а до 40 или 50 вообще, это всё-таки ее карьера?»
  //
  // So it is a RAMP and not a rate: 10% the year she turns eighteen, more every birthday, and it
  // stops. The four numbers live here rather than inside `kidPrizeShareBps` because a literal in a
  // formula is a balance decision nobody can find – the rule this file exists for.
  //
  // ⭐⭐⭐ ROUND 42 #25 (CONFIRMED 15.09, «подтверждаю связку») – THE RAMP IS STEEPER AND SHORTER, AND
  // COLLEGE PAUSES IT. His question was «может быть нам с 18 не по 5, а по 10% в год ей добавлять
  // стоит?», his second pass «может даже до 60% к 23», and the confirmed shape is all three at once:
  //   * `stepBps` 500 -> 1000 – ten points a birthday, not five;
  //   * `capBps` 5000 -> 6000, and it is reached at TWENTY-THREE instead of twenty-six;
  //   * ⭐ and the steps count only years ON TOUR: «пока она снова в тур не вернется». A birthday
  //     spent at college does not move the ladder. See `collegePausedShareYears` – NO SCHEMA, the
  //     college span is already state and the step count derives from it.
  // The measurement that went with it is docs/specs/kid-share-ramp-2026-09.md, predicted-first.
  //
  // ⚠ WHY EIGHTEEN AND NOT THE BANK CARD. Her account is a BIRTHDAY GIFT (`world/birthday.ts`, the
  // eighteenth's `bankcard` row: «Her own bank card and account – she is earning now, it should be in
  // her name»), and a gift is one of four the parent chooses between. Keying the ramp to it would
  // make the mechanic invisible in three careers out of four and, worse, make a father who bought her
  // a watch the reason his daughter never got paid. Eighteen is the age the game already treats as
  // the threshold – school is over by 18.92 for every birth month, the junior rungs shut, the fork is
  // one year away – so the account is the FICTION of this rule and her age is its trigger.
  //
  // ⚠ AND THE MONEY GENUINELY LEAVES THE FAMILY WALLET. See `finalizeTournament`: the family is
  // credited its part and she is credited hers, so the parent watches the cheque get smaller as she
  // grows. A share that only counted beside the wallet would be a number, not a mechanic, and «это
  // всё-таки её карьера» is an argument about whose money it is.
```

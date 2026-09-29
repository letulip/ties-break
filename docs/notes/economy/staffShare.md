---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The staffShare block

The comment essays that stood above the `staffShare` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `staffShare`

```ts
  // =================================================================================================
  // ⭐⭐ THE TEAM'S SHARE OF THE PRIZE MONEY (owner, round 24, 22.08 – docs/plans/the-team-share.md)
  // =================================================================================================
  //
  // HIS MODEL, VERBATIM: «3млн призовые из них отчисляется процент дочери (скажем 30 для примера) и
  // тренеру (скажем 10 для примера) – это будет 900к дочери и 300к тренеру плюс остальные расходы».
  // And on eligibility: «тренер может не ездить, но долю получать наверное за победы или 2е места
  // вполне может. За 2е только по-меньше». Then, the same day, the masseur joined: «мне всё-таки
  // кажется, что массажисту тоже можно за призовые месте давать бонус, может по-меньше чем
  // тренеру, но давать, давай тоже сделаем».
  //
  // WHAT THAT RULING KILLED, so nobody rebuilds it: the plan's original contract-FORM design (flat
  // vs base+share, chosen at hire, persisted per career) is DEAD. The share is a UNIVERSAL rule –
  // no form, no choice, nothing persisted: computed at `finalizeTournament` from these constants
  // and the finish, exactly like the kid's ramp one block up.
  //
  // THE SHAPE, ROUND 24 – «за победы или 2е места», NOT every cheque: a TITLE pays `titleBps`, a
  // FINAL pays `finalBps` («за 2е только по-меньше» – half), below a final NOTHING. The real-world
  // convention (5-15% of every cheque, sliding by depth) was researched and shown to him (the plan's
  // §1); his version was the sharper one and it is what shipped. Both shares are computed OFF THE
  // GROSS cheque – the kid's ramp (round-23 #18) is untouched and each share rounds ONCE, the
  // family keeping the remainder to the cent (`staffPrizeShareCents` + the finalize subtraction).
  //
  // =================================================================================================
  // ⭐⭐⭐ ROUND 42 #41 (15.09) – AND THE COACH'S SHAPE IS NOW THE CONVENTION'S, BY HIS OWN RESEARCH
  // =================================================================================================
  //
  // HIS WORD: «я вообще не понял почему мы снова обсуждаем разные проценты, если уже есть
  // исследование на 10% безусловных отчислений с любых призовых, независимо от глубины прохода. И мы
  // говорили, что это будет сделано».
  //
  // The receipt is his own file – docs/research/team-economics-2026-09.md §2 and finding 3.1: «7–15%,
  // most commonly 10%, of EVERY cheque» (Rublev pays Vicente fixed + 10% per tournament; Kasatkina
  // «10% от любого заработка на корте»). The audit's own verdict line on this very constant read «⚠
  // half-matches: our 10% exists but only at finishIdx 0/1; reality cuts 10% of EVERY cheque». So
  // round 24's sharper shape is REPLACED for the coach and nothing else about the mechanism moves:
  // still universal, still nothing persisted, still off the GROSS, still one rounding each, still
  // `track === 'wta'` and a FILLED seat only.
  //
  // ⭐ THE THIRD NUMBER IS THE WHOLE CHANGE. `everyBps` is what a finish BELOW a final pays; the
  // function one block down (`staffResultShareBps`) reads it instead of returning a hard 0. For the
  // coach all three are 1000, which is «10% of every prize cheque, at every finish» stated as data
  // rather than as a branch – and it is why this is still ONE mechanism with two takers.
  //
  // ⚠⚠ AND THE MASSEUR IS DELIBERATELY LEFT ON THE ROUND-24 SHAPE (`everyBps: 0`), WHICH IS A
  // QUESTION FOR THE OWNER AND NOT A DECISION TAKEN HERE. Item 41 names it as the thing the bench has
  // to answer; the measurement is in docs/specs/coach-every-cheque-2026-09.md §5, and moving him onto
  // the every-cheque road is exactly one number on this object. The default is «no change» because a
  // seat he never asked to re-rule should not move while he is reading a table about the coach.
  //
  // WHO PAYS AND WHEN: the family (the parent is the employer – the game's premise), pro tour only
  // (`track === 'wta'` – junior tennis pays no prize money worth sharing and the convention is a
  // pro convention), independent of any travel switch (his own words: «может не ездить, но долю
  // получать»), and only a seat that is actually FILLED – a self-coached family owes no coach
  // share, an empty table no masseur share.
  //
  // THE MASSEUR'S RATES are roughly a third of the coach's («по-меньше чем тренеру») – the same
  // sizing logic the travelling-team plan used for specialist money against coach money. On his
  // own worked example (a $3M Slam title): coach $300k, masseur $90k, daughter $900k (at the
  // age-22 rung), family $1.71M «плюс остальные расходы».
```

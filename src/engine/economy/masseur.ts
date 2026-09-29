// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/masseur.md#the-masseur-block

// --- THE MASSEUR (travelling team step 1, docs/specs/the-masseur-2026-08.md) -------------------
// A salaried person, pro-career gated, hired/fired like the coach. DISTINCT FROM THE PHYSIO
// ABOVE, and the distinction is the design: the physio is a coach-bundled clinic SERVICE whose
// work is prevention (tau, and the layoff dealt at onset); the masseur is RECOVERY THE PLAYER
// WATCHES – he works the layoff she is already in and the week-to-week body. See
// src/engine/world/masseur.ts for the whole argument.
export const masseur = {
  // ⭐ STEP 2 RE-CUT THE CONTRACT INTO A DIAL (owner, round 24: «а не слишком ли дешево это для
  // специалиста?… может быть добавлять настройки сколько раз в неделю он дает свои услуги»). The
  // step-1 flat $150/wk was half the middle coach's weekly bill and the owner read it right: at
  // his own real-world friendly rate ($50/h) it buys THREE hours, and a professional's body work
  // is not three hours. The honest recalibration is RELATIVE, inside the game's own scale:
  //
  // owner (masseur.perSessionCents): «+2 специалиста это ещё +46к»
  // → docs/notes/economy/masseur.md#masseurpersessioncents
  perSessionCents: 75_00,
  // ⭐⭐⭐ ROUND 43 #4 – AND IT IS THE OPENING PRICE NOW, NOT THE PRICE. His 16.09 ruling: «мы
  // начинаем работать с массажистом по нашим текущим ценам, а дальше он приходит и просит
  // прибавку, либо (так как альтернативы нет) добавить денег, но убавить количество процедур…
  // может просить надбавок за свои часы ежегодно, может быть не так интенсивно как тренер».
  //
  // ⚠⚠ masseur.raisePerYear: THE YARDSTICK IS THE COACH AND NOT A MARKET, and that is a ruling rather than a shortcut.
  // owner (masseur.raisePerYear): «Не так интенсивно как тренер»
  // ⚠ masseur.raisePerYear: MEASURED, NOT GUESSED (invariant 5)
  // owner (masseur.raisePerYear): «это может нам скомпенсировать все ранги»
  // ⚠ masseur.raisePerYear: AND THE ONE THING THE BENCH HAD TO PROVE
  // ⚠ masseur.raisePerYear: DETERMINISTIC – no corridor, no jitter, NO DRAW ON ANY STREAM.
  // → docs/notes/economy/masseur.md#masseurraiseperyear
  raisePerYear: 0.04,
  // THE DIAL – how many times a week the table is hers, the owner's own idea. Three rungs, and
  // each must MEASURABLY beat the one below or the dial is decoration (the plan's §4 law); the
  // bench table in docs/specs/the-masseur-2026-08.md carries every cell.
  // → docs/notes/economy/masseur.md#masseurrungs
  rungs: [
    { sessions: 2, label: 'Twice a week', rehabExtraEveryNWeeks: 3, conditionBonusPerWeek: 1 },
    { sessions: 4, label: 'Every other day', rehabExtraEveryNWeeks: 2, conditionBonusPerWeek: 2 },
    { sessions: 7, label: 'Daily', rehabExtraEveryNWeeks: 1, conditionBonusPerWeek: 3 },
  ],
  // What a fresh hire (and every pre-v59 save) stands on: the middle rung – the professional
  // default the pricing above is anchored to. A LITERAL 4 in the v59 migration, by the house
  // rule; keep the two in step.
  defaultSessions: 4,
  // ⭐ WHAT THE FARE BUYS (step 2, the owner's «влияет ли он на восстановление на глубоких
  // играх»): when the masseur TRAVELS to a tournament (fare paid,
  // `pendingTournament.masseurThere`), the run's strain at finalize is relieved by this much PER
  // NIGHT BETWEEN ROUNDS – i.e. × (matches − 1), capped at the strain itself.
  //
  // ⚠ masseur.tourRecoveryPerRound: 1-vs-2 WAS MEASURED ON THE OWNER'S OWN QUESTION («+2 за каждый круг не многовато?»)
  // owner (masseur.tourRecoveryPerRound), 19.09: «слив на глубине хода и ТУРНИРНАЯ РАБОТА МАССАЖИСТА»…
  // ⚠⚠ masseur.tourRecoveryPerRound: AND +1 IS THE WHOLE STEP, FOR A MEASURED REASON, not for timidity.
  // ⚠ masseur.tourRecoveryPerRound: IT REACHES NO FROZEN CAREER AND NO RIVAL, PROVED RATHER THAN ARGUED.
  // → docs/notes/economy/masseur.md#masseurtourrecoveryperround
  tourRecoveryPerRound: 3,
  // ⭐ THE RETURN-WEEK SESSION (owner 22.08: «довесить послетурнирное восстановление 1 сеанс
  // массажа по возвращении»): when he was NOT flown to a tournament, the first non-played week
  // after it pays one extra session's worth of recovery on top of the ordinary week – the home
  // table working the trip out of her legs. Small and legible on purpose: it is one session, not
  // a second tour-relief channel, and it prints its own receipt (`resolveMasseurReturn`).
  returnSessionBonus: 1,
} as const

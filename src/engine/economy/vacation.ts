// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/vacation.md#the-vacation-block

// ⚠ TYPE-ONLY: `../economy.ts` imports THIS module at runtime, so a value import back would close a cycle;
// `import type` is erased at compile time, which is why the shared shapes may live over there.
import type { VacationPackage } from '../economy'

// Season planner: family vacations (spec §2, owner-approved 25.07) – ONE shared catalogue;
// money is the only gate. A vacation week is a hard blackout (nothing enterable) that pays a
// condition gain on top of a FREE week's recovery, and the two top packages carry an
// injury-tau buff for `buffWeeks` weeks (applied POST-draw, so the MAIN stream stays
// byte-identical). Prices are middle-anchored bands × wealthCorridor, quoted from the…
//
// ⚠⚠ vacation: THE WHOLE TABLE WAS LIFTED 03.08
// owner (vacation): «в течение сезона она сможет брать мини отпуска на неделю иногда»
// ⚠ vacation: AND THE WEALTH CORRIDOR MUST NEVER SCALE THE GAIN ITSELF
// → docs/notes/economy/vacation.md#vacation
export const vacation = {
  /** how many weeks a resort/elite recovery buff rides after the vacation week */
  buffWeeks: 4,
  packages: [
    {
      id: 'staycation',
      // Labels are deliberately dash-FREE: they get embedded in copy that already carries a
      // short dash ("Family vacation – {label}"), and a double dash reads badly.
      label: 'Staycation with friends',
      blurb: 'No travel, no drills – her own bed and her own people.',
      priceCents: [0, 0],
      // ⚠ 10, WAS 18 (owner ruling 12.08: «шифт-8 на всех: у первого будет восстановление +10,
      // у второго +18, у третьего и далее останется без изменений»). The bottom of the ladder
      // used to run 18/22/26 – four points between a FREE week at home and a paid one at
      // grandma's, so the free package was a near-perfect substitute for the paid rungs and the
      // picker's own "cheapest sufficient" rule recommended it almost always. The bottom now
      // steps by 8 (10 → 18 → 26): a paid vacation buys something a free one measurably does not.
      conditionGain: 10,
      buffFactor: 1,
    },
    {
      id: 'grandma',
      label: "Grandma's village",
      blurb: 'Two trains and a bus – slow food, slow days.',
      // ⚠ W7 PUT A FLOOR UNDER THIS ONE BAND, and only this one. The owner: «Grandma's village
      // регулярно стоит 0 или 3 доллара для 8к, мне кажется там можно какой-то порог цены сделать,
      // но можно и так оставить, в принципе.»
      //
      // ⚠ vacation.packages[1].priceCents: AND ZERO WAS NOT MERELY CHEAP, IT WAS A DIFFERENT OBJECT.
      // → docs/notes/economy/vacation.md#vacationpackages1pricecents
      priceCents: [30_00, 50_00],
      // ⚠ 18, WAS 22 – the second half of the owner's 12.08 re-step (see staycation above). The
      // paid rung keeps a real edge over the free one (+8, was +4), and camping keeps the same
      // +8 edge over this. Third rung and up are untouched by the ruling.
      conditionGain: 18,
      buffFactor: 1,
    },
    {
      id: 'camping',
      label: 'Camping road-trip',
      blurb: 'Tent, lake, no racket in the car.',
      priceCents: [150_00, 300_00],
      conditionGain: 26,
      buffFactor: 1,
    },
    {
      id: 'seaside',
      label: 'Seaside family hotel',
      blurb: 'A real holiday – sea, sleep, sun.',
      priceCents: [600_00, 1000_00],
      conditionGain: 32,
      buffFactor: 1,
    },
    {
      id: 'resort',
      label: 'Sports recovery resort',
      blurb: 'Pool, physio, massage – rest with a programme.',
      priceCents: [1800_00, 3000_00],
      conditionGain: 40,
      buffFactor: 0.9,
      // ⭐⭐ ROUND 42 #49(b) – THE SECOND OF THE TWO HIGH TIERS, and it is here because he said
      // «тиры» in the plural: «высокие тиры восстановлений в одном ценовом коридоре независимо от
      // достатка». The full ruling and its measurement are on the `elite` row below; this rung is
      // the other half of the same sentence. $1,800-3,000 a week is not a rung a family on
      // «200-300 в неделю» reaches either, which is the test his reasoning sets.
      //
      // ⚠ THE BAND STOPS HERE AND DOES NOT REACH `seaside` ($600-1,000). That row is the family
      // hotel a stretched family really does book, so the corridor is doing its job there – the
      // ruling is about the TOP of the ladder, not about recovery in general.
      uniformPrice: true,
    },
    {
      id: 'elite',
      label: 'Elite recovery programme',
      blurb: 'The clinic the pros use – she comes back new.',
      priceCents: [4000_00, 7000_00],
      conditionGain: 48,
      buffFactor: 0.85,
      // ⭐⭐ ROUND 42 #49(b) – **SET**, AND THE RULING IS WHAT THE BENCH COULD NOT SEE. His word,
      // 16.09…
      //
      // owner (vacation.packages[5].uniformPrice), 16.09: «высокие тиры восстановлений в одном ценовом коридоре независимо от достатка…»…
      // ⚠⚠ vacation.packages[5].uniformPrice: WHY THE 4-OF-20 REFUSAL DOES NOT BIND ANY MORE.
      // ⚠ vacation.packages[5].uniformPrice: AND THE COST IS STILL THE COST.
      // owner (vacation.packages[5].uniformPrice): «элитный стоит 830 в неделю… И то же про элит рекавери… 2900»
      // owner (vacation.packages[5].uniformPrice): «в про карьере с большими чеками цены для всех должны быть равны»
      // ⚠⚠ vacation.packages[5].uniformPrice: IT WAS REFUSED BY ITS OWN MEASUREMENT, AND BY THE HARDEST CONSTRAINT THIS ITEM HAS.
      // ⚠ vacation.packages[5].uniformPrice: SO THE MECHANISM STAYS AND THE FLAG DOES NOT
      // ⚠ vacation.packages[5].uniformPrice: ZERO DRAWS EITHER WAY when it is switched on: `corridorPrice` still spends its `pickInt` and…
      // → docs/notes/economy/vacation.md#vacationpackages5uniformprice
      uniformPrice: true,
    },
    // ⭐⭐ ROUND 29 #5 – THE SEVENTH RUNG. docs/specs/the-shop-2026-08.md §3f, the owner's own idea:
    // «а неделя на яхте (при наличии яхты) вполне может стать новой строкой отпуска, кстати».
    //
    // owner (vacation.packages[6]), 29.08: «она же бесплатная только при наличии яхты, верно?»
    // ⚠ vacation.packages[6]: His art for the row is coming; until it lands `vacationArtUrl` returns null and the sheet draws the row…
    // ⚠ vacation.packages[6]: #9's BAND IS x1.4 OF ELITE'S ([4000_00, 7000_00] -> [5600_00, 9800_00]) – HIS 29.08 FIGURE…
    // ⚠⚠ vacation.packages[6]: 48 AND `buffFactor: 1` – THE TUNING QUESTION §3f NAMES, ANSWERED ON ITS FIRST ARM.
    // ⚠ vacation.packages[6]: A NUMBER ABOVE 48 WOULD BREAK THAT
    // ⚠ vacation.packages[6]: AND #8's CHARTER MAKES THE VETO HOLD FOR EVERYBODY ELSE TOO, for free
    // → docs/notes/economy/vacation.md#vacationpackages6
    {
      id: 'yacht-week',
      label: 'A week on the yacht',
      blurb: 'Nowhere to be, and the sea to be nowhere on.',
      priceCents: [5600_00, 9800_00],
      conditionGain: 48,
      buffFactor: 1,
      freeOnceGranted: true,
      // ⭐⭐ ROUND 46 #6 – owner, 05.10: «Может для своей яхты тоже поставим -15% вероятности травмы?» «Тоже» is
      // Elite's 0.85 on this very sheet. It rides the OWNER's week only («своей»): the charter above keeps
      // `buffFactor` 1, so a family with no delivered yacht is byte-identical. ⚠ IT RETIRES §3f's VETO ON THE
      // OWNER'S SIDE – free, 48 and 0.85 is Elite with the bill removed; the veto was the spec's guess and his
      // later word outranks it. docs/specs/the-shop-2026-08.md §13h has the measurement and the one-knob revert.
      grantedBuffFactor: 0.85,
    },
  ] as VacationPackage[],
} as const

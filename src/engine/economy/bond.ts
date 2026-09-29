// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/bond.md#the-bond-block

export const bond = {
  /** Start, range and the granularity every write rounds to (build plan §1d: 0..100 in steps of
   *  0.5). Its own block beside `spirit` rather than a key inside it: they are two numbers with two
   *  rules – one is weather and moves on the world, the other is a relationship and moves ONLY on
   *  parent decisions – and nesting one under the other would say they are one thing.
   *
   *  ⚠ `step` HAS A READER SINCE 26.09 AND DID NOT BEFORE (C-05). `roundToStep` in `engine/spirit.ts`
   *  is the one writer's rounding and it reads this key, so turning the dial turns the grid. Until
   *  then the sentence above described a hard-coded `Math.round(x * 2) / 2` and only a test read the
   *  constant – the claim was true of the DESIGN and false of the code. */
  start: 70,
  min: 0,
  max: 100,
  step: 0.5,
  /** THE MEMORY PROPERTY. Deltas land immediately and then regress toward `start` at this rate
   *  and nothing else moves it: a −25 season heals in ~50 weeks, which is recoverability («one
   *  bad click at fifteen» must not ruin a ten-season career) without making a decision
   *  weightless inside the season it was taken in.
   *
   *  ⚠⚠ bond.regressionPerWeek: IT IS NOT A CONTINUOUS DIAL, AND IT LOOKS LIKE ONE.
   *  ⚠ bond.regressionPerWeek: AND THE FIRST OF THOSE TWO IS A WORKING MOVE SINCE 26.09 (C-05)
   *  → docs/notes/economy/bond.md#bondregressionperweek
   */
  regressionPerWeek: 0.5,
  /** WHAT THE PARENT'S DECISIONS ARE WORTH (build plan §1d, verbatim). Every row lands at a real
   *  decision site – see `engine/spirit.ts`'s header for the map of which one writes which. */
  delta: {
    knockRest: 1,
    knockPush: -3,
    knockPushRepeatPart: -5,
    /** entering her with a `'warn'` clearance in hand – she plays hurt because he entered her. */
    playedHurt: -4,
    /** the birthday's TIME-TOGETHER ids only, by id (`day` / `familyweek` / `trip`). */
    giftDay: 2,
    giftFamilyWeek: 3,
    giftTrip: 4,
    /** ⭐ THE ASKED-FOR MATERIAL GIFT, GRANTED (`asked` === `given`) – the owner's own correction of
     *  23.08: «а как же с теми, которых она сама просила? мне кажется там вполне может двигаться в
     *  положительную сторону мораль». A heard request is not a purchase; see `chooseGift`. */
    giftAskedGranted: 2.5,
    /** she asked and was refused – nothing given, or a different thing. */
    giftRefused: -1.5,
    /** ⚠ AND AN UNPROMPTED MATERIAL GIFT IS EXACTLY ZERO, which is birthday ruling 2 surviving
     *  intact: a gift that moves a number is a purchase, and only an ASK the player cannot
     *  manufacture makes the answer to it a relationship move instead. */
    giftUnprompted: 0,
    vacationResolved: 1,
    seasonWithNoVacation: -3,
    /** ⭐⭐ v73 – THE LIFE BEAT'S OWN THREE (the private life, wave 2; build plan §3, «his reaction
     *  options – responses, never her choices»). What he SAYS when she has told him what she wants:
     *  back it, press the other way, or listen and say nothing.
     *
     *  ⚠⚠ bond.delta.beatBacked: THE PRICE LIST IS UNIVERSAL
     *  ⚠ bond.delta.beatBacked: AND SAYING NOTHING IS EXACTLY ZERO, not a small negative.
     *  → docs/notes/economy/bond.md#bonddeltabeatbacked
     */
    beatBacked: 2,
    beatPressed: -2,
    beatListened: 0,
    /** ⭐⭐ v73 – AND THE SECOND DELTA, WHICH LANDS WHERE THE DEED DOES: `answerFork` matching the
     *  want she stated at the beat, or contradicting it. Two deltas, separate on purpose – «a
     *  parent can disagree out loud and then do as she asked» (build plan §3).
     *
     *  ⚠ THE ASYMMETRY IS THE DESIGN'S (+3 / −4) and it is the same shape the knock's rows carry:
     *  doing the thing she asked for is worth less than overriding it costs, because the fork is
     *  the one decision of hers that the parent can take away. */
    forkWithHerWant: 3,
    forkAgainstHerWant: -4,
    /** ⭐⭐ v74 (the private life, wave 3 – T6/T7) – WHAT HE SAYS THE WEEK HE IS TOLD THERE IS
     *  SOMEONE. Four answers, and not one of them is hers: the wave-3 brief §4's «'met' bond
     *  deltas» row, verbatim – warm +2 · wary 0 · intrusive −3 · silent −1.
     *
     *  ⚠⚠ bond.delta.metWarm: THE PRICE LIST IS UNIVERSAL
     *  ⚠ bond.delta.metWarm: SILENCE IS PRICED HERE AND IS EXACTLY ZERO AT THE FORK, and the difference is the beat and not an…
     *  ⚠ bond.delta.metWarm: THE FOUR ROWS BELOW ARE THE TABLE AN **`open`** GIRL IS READ BY
     *  → docs/notes/economy/bond.md#bonddeltametwarm
     */
    metWarm: 2,
    metWary: 0,
    metIntrusive: -3,
    metSilent: -1,
    /** ⭐⭐⭐ v74 T7 – THE WANTS FLIP, AND IT IS TWO ROWS RATHER THAN A SECOND TABLE. A girl whose
     *  drawn `wants` is `'private'` reads silence as the kindness and warmth as the thing that puts
     *  it in the room: silent **+2**, warm **−1** (brief §4's «flip» column, verbatim).
     *
     *  ⚠⚠ bond.delta.metWarmPrivate: `wary` AND `meet` ARE ABSENT ON PURPOSE AND THE ABSENCE IS LOAD-BEARING.
     *  ⚠⚠ bond.delta.metWarmPrivate: AND IT IS STILL NOT A ROW PER GIRL
     *  ⚠ bond.delta.metWarmPrivate: NOTHING PRINTS EITHER NUMBER.
     *  → docs/notes/economy/bond.md#bonddeltametwarmprivate
     */
    metWarmPrivate: -1,
    metSilentPrivate: 2,
    /** ⭐⭐⭐ v75 (the private life, wave 4 – T4) – WHAT HE SAYS THE WEEK HE LEARNS IT IS OVER. Four
     *  answers – give her space · keep her company · try to fix it · blame – priced from the build
     *  plan §5's own row, verbatim: «match +3, mismatch −3, fix-it −1, blame −4 always (some things
     *  are wrong regardless of what she wanted)».
     *
     *  ⚠⚠ bond.delta.endedMatched: THE FIRST TWO ARE ONE PAIR READ TWO WAYS AND THAT IS WHY THEY ARE TWO ROWS RATHER THAN FOUR.
     *  ⚠⚠ bond.delta.endedMatched: AND `endedBlame` IS THE ONE ROW WITH NO READING AT ALL.
     *  ⚠ bond.delta.endedMatched: THE FENCE HOLDS HERE TOO (who-she-is §3)
     *  ⚠ bond.delta.endedMatched: NOTHING PRINTS ANY OF THE FOUR.
     *  → docs/notes/economy/bond.md#bonddeltaendedmatched
     */
    endedMatched: 3,
    endedMismatched: -3,
    endedFixIt: -1,
    endedBlame: -4,
  },
  /** ⭐ THE FOUR BANDS THE DIARY READS (build plan §1e, verbatim): `close` ≥ 80 · `steady` 55..79 ·
   *  `strained` 35..54 · `cold` < 35. Each is the FLOOR of its band, read top-down by `bondBandOf`
   *  – the ONE reader, and the only road `bond` has to a sentence.
   *
   *  ⚠ WHAT THE BANDS SELECT IS THE CHANNEL, NOT THE VOLUME (who-she-is §5b): `close`/`steady` let
   *  her speak in her own voice, `strained` collapses the four voices into the shared flat pool,
   *  and `cold` is silence – the parent's line alone under the painting. A career therefore walks
   *  down a ladder with three rungs, which is the loss the player is meant to hear. ⚠ There is
   *  still NO METER: these divide a number nothing prints. */
  band: {
    close: 80,
    steady: 55,
    strained: 35,
  },
} as const

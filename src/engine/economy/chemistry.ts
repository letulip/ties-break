// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/chemistry.md#the-chemistry-block

// ⚠ `planFactor` (base 0.55 + 0.006 x plan.train) IS GONE, and its job moved rather than
// vanished. It scaled the weekly coaching bill by the training split, but only from 0.91 at
// train 60 to 1.06 at train 85 – a 16% spread on a slider that doubles her development. The
// coach ladder replaces it with HOURS (ECONOMY.coach.sessionsAt60/85), which move the bill 2x
// end to end, because hours are what a coach actually charges for.

// CHEMISTRY – how these two WORK, as against what he can DO
// (docs/specs/the-chemistry-2026-09.md) – The owner, 16.09: «химия между ребёнком и тренером,
// а не просто стиль-метч» … «эта самая химия может как-то нарабатываться с разной динамикой –
// это может стать показателем, насколько ей комфортно с тренером» …
//
// owner (chemistry), 16.09: «самый дешёвый тренер может стать идеальным метчем и дать конкуренцию элитному»…
// ⚠ chemistry: EVERY NUMBER BELOW IS A KNOB AND NOTHING READS A LITERAL.
// → docs/notes/economy/chemistry.md#chemistry-2
export const chemistry = {
  // ⭐⭐ THE 4x4 CENTRES – the pair's disposition before the draw, C1's table (spec §3a).
  //
  // owner (chemistry.affinityCentre): «сама идея мне нравится… концептуально корректно звучит»
  // ⚠ chemistry.affinityCentre: WHICH OF HER AXES MEETS WHICH OF HIS, written down once and here…
  // ⚠⚠ chemistry.affinityCentre: AND THE CENTRE IS DELIBERATELY SMALL AGAINST `spread` BELOW, WHICH IS B10's WHOLE POINT.
  // owner (chemistry.affinityCentre): «такое же редкое событие, как и prodigy девочка»
  // → docs/notes/economy/chemistry.md#chemistryaffinitycentre
  affinityCentre: {
    // sunny = open + steady -> wants a PERSON voice and HEAT
    sunny: { demanding: 1, warm: 0, analytical: -1, driving: 0 },
    // fiery = open + intense -> wants a PERSON voice and a COOL head
    fiery: { demanding: 0, warm: 1, analytical: 0, driving: -1 },
    // quiet = private + steady -> wants a TECHNIQUE voice and HEAT
    quiet: { demanding: 0, warm: -1, analytical: 0, driving: 1 },
    // deep = private + intense -> wants a TECHNIQUE voice and a COOL head
    deep: { demanding: -1, warm: 0, analytical: 1, driving: 0 },
  } as Record<'sunny' | 'fiery' | 'quiet' | 'deep', Record<'demanding' | 'warm' | 'analytical' | 'driving', number>>,

  /** what a cell's `+1` / `-1` is worth in affinity, before the draw. The table above is signed
   *  UNITS so its shape is readable at a glance; this is the one number that scales it. */
  centreScale: 0.26,

  /** the half-width of the per-pair draw around that centre, on a TRIANGULAR shape (two uniforms,
   *  so the middle is likelier than the ends and a corner pairing is genuinely rare).
   *
   *  ⚠ THIS IS THE B10 DIAL. Raising `centreScale` or lowering `spread` makes the table
   *  predictable; the measured ratio is recorded in the spec's §15. */
  spread: 0.9,

  // --- THE CORRIDOR (spec §3.2) --------------------------------------------------------------
  //
  // ⚠⚠ THE CEILING COLUMN IS THE OWNER'S IN BOTH ANCHORS AND IS NOT AN AGENT'S TO MOVE: +33 a
  // year at a perfect pair, +5 a year with «short ups» at no match. He was explicit that it
  // scales – «вверх точно». The FLOOR he was explicit about NOT being sure of – «вниз не уверен» –
  // so its middle is the bench's to fit (B7) and only its two ends are quoted from him.

  /** chemistry points a year at the TOP of the corridor, at affinity +1. His number: «за 3 года
   *  100% метч» is 33 a year, and it is a CEILING a perfect pair can REACH rather than a rate it
   *  runs at (his 16.09 correction, which is why §3 is a corridor at all). */
  ceilingAtPerfect: 33,
  /** ...and at affinity 0. His «+5%, и взлёты короткие» – the whole positive half of a no-match
   *  pair's corridor is five points wide, which is what makes its ups SHORT without a rule
   *  saying so. */
  ceilingAtNone: 5,
  /** ...and at affinity -1: «small and rare». The anti-match can still have a good week; it
   *  cannot have a good year. */
  ceilingAtAnti: 1,

  /** chemistry points a year at the BOTTOM of the corridor, at affinity +1. The middle of his
   *  «-5 to -10»: this is the Borg year, and it is reachable rather than common. */
  floorAtPerfect: -7,
  /** ...at affinity 0. «Deeper» (his «сильнее»), and four times the positive half – so an ordinary
   *  pair's weather spends more of its range losing than gaining, which is his «чаще» expressed as
   *  a SHAPE instead of as a second frequency knob. */
  floorAtNone: -20,
  /** ...at affinity -1. Deepest. */
  floorAtAnti: -33,

  /** ⭐ the pair's EXPECTED annual rate at a perfect affinity – the corridor's centre, where the
   *  weather sits when nothing is happening. Well below `ceilingAtPerfect` on purpose: a click
   *  that ran at the ceiling would make «за 3 года 100%» the rule instead of the lucky run it is.
   *
   *  ⚠ chemistry.driftAtPerfect: FITTED BY B7 AND IT MOVED, WHICH IS THE ONE NUMBER IN THIS BLOCK THE BENCH CHANGED.
   *  → docs/notes/economy/chemistry.md#chemistrydriftatperfect
   */
  driftAtPerfect: 12,
  /** ...and the anti-match's, which is SMALLER in magnitude than the click's. C10 ruled the
   *  anti-match as FREQUENT as the click («согласен») and named the one asymmetry the design
   *  needs: it is slower to ARRIVE. This is that asymmetry and it is the only one. */
  driftAtAnti: -10,

  // --- THE WEEKLY WEATHER (spec §3.3) ---------------------------------------------------------
  //
  // ⚠⚠ «PERIODS» IS THE LOAD-BEARING WORD. White noise around a mean produces a wobbly line and no
  // story; what he described is «есть в периодах и плоские года, и взлёты и падения даже», which
  // requires the weekly step to be AUTOCORRELATED. B9 is the bench that can say it was built: a
  // perfect pair's weekly series must show runs of 8+ weeks on one side of its mean.

  /** how hard the walk is pulled back to 0 each week. The time constant is 1/this in weeks, so
   *  0.05 is a twenty-week memory – weeks near each other share a phase, seasons apart do not. */
  phaseRevert: 0.05,
  /** the week's own shock, on a triangular draw in [-1, +1]. With `phaseRevert` above this settles
   *  to a phase standard deviation near 0.39 – wide enough for a flat year, narrow enough that the
   *  corridor's ends stay rare. */
  phaseShock: 0.3,

  // --- THE THREE EVENT CHANNELS (spec §3.4) ---------------------------------------------------
  //
  // Events nudge the PHASE and never the level, so a single result cannot jolt the number: it
  // bends the weather, and the weather moves the level. And a downward phase does exactly what
  // §3.4 asks of her state – it damps the climb AND deepens the dip – because the corridor is
  // steeper below the drift than above it. The SHAPE does that work; no second rule is needed.

  /** ⭐⭐ C13, RULED 16.09 – «окей, давай слегка». Results now pay TWICE: into §4's `standing` (the
   *  coach grows, wave C2) and into the phase here. A fence would delete a true effect – winning
   *  together honestly does both things – so the chemistry read takes a FRACTION of its own
   *  natural weight instead. Every results nudge below is multiplied by this; her state is not. */
  resultsDamp: 0.5,
  /** a match won last week, before the damp – and its LOSS COUNTERPART IS EXACTLY ITS MIRROR,
   *  which was measured into this block rather than chosen.
   *
   *  ⚠⚠ chemistry.phasePerWin: THE FIRST BUILD WEIGHTED A LOSS HALF AGAIN AS HEAVY AS A WIN AND CHARGED A FIRST-ROUND EXIT ON TOP…
   *  ⚠ chemistry.phasePerWin: IN A KNOCKOUT SPORT EVERY EVENT BUT ONE ENDS IN A LOSS, so any asymmetry here is a tax rather than a signal.
   *  ⚠ chemistry.phasePerWin: «A bad loss as FAVOURITE» (§3.4's third clause) is an EXPECTATION-relative read…
   *  → docs/notes/economy/chemistry.md#chemistryphaseperwin
   */
  phasePerWin: 0.1,
  /** ...and a match lost. The exact mirror – see `phasePerWin` for the measurement that made it so. */
  phasePerLoss: -0.1,
  /** ...and the title, on top of the wins that produced it. «Winning together is how a pair finds
   *  each other», and a trophy is the week they both remember. Rare enough (0.3 a career-year,
   *  measured) that it is a bonus and not a channel. */
  phasePerTitle: 0.3,

  /** HER STATE – the five Mood bands, as a weekly phase nudge. His «психологическое состояние
   *  ребёнка», read through `spiritBandOf`, which is the world's one reading of that number.
   *  ⚠ NOT damped by `resultsDamp`: spirit pays into no second ledger, so it is read once. */
  phasePerBand: { glowing: 0.03, bright: 0.015, steady: 0, dimmed: -0.015, heavy: -0.03 } as Record<
    'glowing' | 'bright' | 'steady' | 'dimmed' | 'heavy',
    number
  >,

  // --- WHAT IT IS WORTH (spec §5 / §5a) -------------------------------------------------------

  /** ⭐ C3, RULED: the `elite` rung HAS no next tier, and a flat zero would say the best coach in
   *  the game cannot grow closer to her, which reads wrong. A token step up – and the FULL
   *  symmetric fall downward, because `high` is a real rung beneath it. */
  eliteUpStep: 0.04,

  // --- WHEN IT MAY BE SHOWN (spec §8b, ruling C7; the corridor is §8d, ruled 18.09) ------------

  // ⭐⭐ C7, RULED 16.09 – «once clear», and a single bar was what «clear» meant for one round.
  // The question C7 asks is whether chemistry surfaces «from season one, or once a band is
  // clear», and his reason for the second was quoted rather than paraphrased: «a sentence in
  // week 3 about a relationship is noise».
  //
  // owner (chemistry.readableFloor), 18.09: «мне кажется медленно, какие-то цифры, пусть и небольшие 1-2% мы всяко может раньше видеть.»
  // owner (chemistry.readableFloor): «вариативность… но при этом математика и стабильность – мы можем воспроизвести все вариации»
  // ⚠⚠ chemistry.readableFloor: THE CORRIDOR IS STILL HIS `ceilingAtNone` AND NOT AN AGENT'S TASTE
  // ⚠ chemistry.readableFloor: NO SCHEMA KEY IS OWED AND NONE IS TAKEN.
  // ⚠⚠ chemistry.readableFloor: AND C7'S WEEK-3 GUARANTEE IS DELIBERATELY SUPERSEDED AT THE LOW END, said out loud rather than discovered.
  // → docs/notes/economy/chemistry.md#chemistryreadablefloor-2

  /** the lowest a pair's own readable threshold can be drawn – `ceilingAtNone / 5` */
  readableFloor: 1,
  /** ...and the highest – `ceilingAtNone / 2`. Small on purpose: the whole span is inside one
   *  ordinary year's gain, so the SLOWEST pair still reads inside a season and the spread is felt
   *  as «this pair took longer to show» rather than as two different games. */
  readableCeiling: 2.5,
} as const

// THE HANDOVER'S WORDS – phase 4 of docs/specs/childhood-prologue-build-2026-09.md §5, and it is a
// TABLE for the same reason the nine cards are one: replacing the owner's copy has to be a data edit
// and not a refactor. `PrologueHandover.vue` renders bindings off this file and holds no sentence.
//
// ⚠⚠ THE COACH'S LINES ARE HIS, APPROVED AS DRAFTS. §8a is the only copy in the whole prologue he has
// read – «⭐ The copy below is DRAFTED, not decided … It ships only with his word» – so the three
// bands below are transcribed VERBATIM from the spec and nothing was smoothed on the way in.
// Everything else in this file is a NEW sentence, marked as a draft where it stands, and CLAUDE.md's
// invariant 4 binds it exactly as it binds the cards: user-facing wording is not an agent's to
// change, and it is not an agent's to invent and then defend either.
//
// ⭐⭐ IT SPEAKS THE VOCABULARY THE COACH ALREADY HAS (§8a). `world/coachMarket.ts` grades her
// remaining room in WORDS and not numbers – `Huge potential` / `Still room to grow` /
// `Close to her ceiling` / `At her ceiling` – and this table is keyed on those exact strings. The
// BAND is decided engine-side and arrives on the snapshot as `handoverBand`; nothing in this file
// sees a skill, a ceiling or a share.
//
// ⚠ IT IS THE SAME WORDS AND A DIFFERENT QUESTION, and the difference is measured rather than
// preferred. `coachRoomBandIndex` grades a REALISATION share, which at fourteen answers
// «Huge potential» to 93% of careers – a handover built on it would promise nearly every player a
// star. `handoverRoomBand` reads how much was in her when she was BORN. The whole measurement is in
// docs/specs/childhood-prologue-money-2026-09.md §5.
//
// ⚠⚠ AND HE MAY NOT NAME A CEILING. §5: «If he ever names a ceiling, the fog stops meaning
// anything.» Two things enforce it. The lines say what he THINKS and admit he can be wrong – «I have
// been wrong before – but not often about this» – and the fourth engine band, whose LABEL is a
// ceiling claim in three words, is deliberately not given a fourth set of lines: a girl the market
// grades `At her ceiling` gets the `Close to her ceiling` read, which is the one that concedes the
// coach can be wrong. Naming a ceiling at fourteen, before a week of the game has been played, is
// exactly what §5 forbids, and the fog is the only thing standing between «she was never going to
// make it» and a hundred hours of finding that out.
//
// ⚠ NO NUMBER APPEARS IN A COACH LINE, and `tests/prologue-handover.test.ts` sweeps every string in
// this table for a digit. The money is the one figure on the screen (§2.4 – the total, once), and it
// is not in his mouth.
import { rngFromSeed } from '../engine/rng'
import { formatCents } from '../shared/money'

/** ⭐ THE COACH'S READ, PER BAND – §8a, verbatim, keyed by the label `coachRoomBand` returns.
 *
 *  ⚠ FOUR KEYS AND THREE SETS OF LINES. The top two share an array by reference rather than by a
 *  copy of the sentences: see the header for why `At her ceiling` may not have a read of its own,
 *  and the test asserts all four labels resolve so a band can never fall through to nothing. */
const NEAR_THE_END: readonly string[] = [
  'She is near what she has. I have been wrong before – but not often about this.',
  'What you see is close to what you get. Some find another gear at seventeen. Most do not.',
  'There is not much more in there. She can have a good life in this sport. She will not have a famous one.',
]

export const COACH_READS: Readonly<Record<string, readonly string[]>> = {
  'Huge potential': [
    'I do not say this often. There is a great deal more in there.',
    'Whatever she is now, she is nowhere near the end of it.',
  ],
  'Still room to grow': [
    'There is more in there. How much, I could not tell you yet.',
    'She is not finished. The next three years will say how far.',
  ],
  'Close to her ceiling': NEAR_THE_END,
  'At her ceiling': NEAR_THE_END,
}

/** ⚠ THE FALLBACK IS THE HONEST ONE AND NOT THE FLATTERING ONE. `coachRoomBand` returns '' when the
 *  note has no separator, which is what both shipped screens already treat as «say nothing» – but
 *  this screen has to say something, because a handover with no read is a handover with nothing on
 *  it. The band that concedes he might be wrong is the safe thing to say about a girl the market
 *  could not grade. */
const FALLBACK_BAND = 'Close to her ceiling'

/** ⭐⭐ WHICH LINE HE SAYS, and it is the same seed every time this career is drawn.
 *
 *  ⚠ A PURPOSE-SCOPED SUB-STREAM, NEVER MAIN (CLAUDE.md invariant 2). `seed:prologue:read` is
 *  re-derived at the call site and persists nothing – the same shape `seed:prologue:field:<age>:<i>`
 *  ships in one file over – so the frozen capture (41550 / e6b0c709) and every career hash cannot
 *  move. It is drawn rather than fixed because the alternative is dead copy: two of the three lines
 *  in each band would never be seen by anybody, which is the defect `coachMarket.ts`'s own band note
 *  records finding in the four-band ladder.
 *
 *  ⚠ IT IS NOT A DICE ROLL ABOUT HER. The BAND is derived from her skills and her ceiling; only
 *  WHICH OF HIS SENTENCES SAYS IT is drawn, so nothing a player can see changes meaning with the
 *  draw. §2.5's «there are no dice in a derived reading» is about the reading, and the reading is
 *  the band. */
export function coachReadFor(band: string, seed: string): string {
  const lines = COACH_READS[band] ?? COACH_READS[FALLBACK_BAND]
  const rng = rngFromSeed(`${seed}:prologue:read`)
  return lines[Math.min(lines.length - 1, Math.floor(rng() * lines.length))]
}

/** ⭐ THE REST OF THE SCREEN'S WORDS – DRAFTS, EVERY ONE, and none of them has been seen by him.
 *
 *  ⚠ THE TWO CONTROLS SAY NOTHING ABOUT A REROLL, AN ODDS OR A FLOOR. That is his explicit ruling
 *  (§2.3): «Про рестарт с перебросом мы ничего не говорим, только слова тренера и честный выбор
 *  игрока "продолжить или попробовать снова"». So the second control is worded as a choice about a
 *  CHILD and not about a mechanism – and it borrows the app's own existing phrase for it rather than
 *  inventing a register: the epilogue already offers «raise another» when a career ends (§5.6).
 *  `tests/prologue-handover.test.ts` sweeps this table and the rendered screen for the vocabulary
 *  the ruling forbids. */
export const HANDOVER_COPY = {
  /** DRAFT – the cards' own kicker shape, one year on */
  kicker: 'She is fourteen',
  /** DRAFT */
  title: 'This is the girl you raised.',
  /** DRAFT – the screen-reader name for the rose. It says where she IS, never how far she could go:
   *  §1d, and the picture itself carries no number. */
  roseTitle: 'Where she is at fourteen',
  /** DRAFT – the label above his sentence. No name and no pronoun: R15-7, «every professional is
   *  UNNAMED», and the person who taught her for nine years was never given a gender. */
  coachLabel: 'The coach who has watched her',
  /** DRAFT */
  goOn: 'Go on with her',
  /** DRAFT – see the ⚠ above */
  startAgain: 'Raise another child',
} as const

/** ⭐ THE WALK'S OWN ONE CONTROL – the way out of the prologue and into the wizard (§6), offered on
 *  the FIRST card only: a skip that follows the player to the eighth year is a screen asking whether
 *  they would rather be somewhere else.
 *
 *  DRAFT. ⚠ It lives beside the handover's copy rather than in the card table because it is not a
 *  card, and it must not become one: `DECISION_AGES` is derived from `options` alone, so a way out
 *  parked in a row would count as a decision the prologue asks for. */
export const WALK_COPY = {
  /** DRAFT */
  skip: 'Skip the childhood',
} as const

/** ⭐⭐ THE MONEY, ONCE, AND THIS IS THE ONLY PLACE IT IS EVER SAID. Build spec §2.4: each card names
 *  its cost in RELATIVE terms and a running balance is never on screen – «the spec builds the
 *  arithmetic and shows the total once, on the last card». `spentCents` in run.ts does the
 *  accumulating and displays nothing; this is the display, and `tests/component/prologue-walk.test.ts`
 *  already asserts that not one digit reaches any of the ten card scenes.
 *
 *  DRAFT. ⚠ It says what the nine years COST and not what the family has left: the balance is the
 *  game's own Family budget card from week 0 onwards, and a second number here would be the ledger
 *  §2.4 says the prologue must not have. */
export function spentLine(cents: number): string {
  return `Nine years of it cost you ${formatCents(cents)}.`
}

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
// this table for a digit. The money is the only figure on the screen (§2.4 – the total, once, and
// since the balance pass the same total said per week), and it is not in his mouth.
//
// =================================================================================================
// ⭐⭐⭐ HE SAYS TWO THINGS, AND THEY ARE NOT THE SAME THING (phase 7)
// =================================================================================================
//
// THE OWNER, 02.09: «оставляем туман, у нас есть слова тренера – вот ими надо добавить понимание
// про базу и перспективы как раз в дополнение к туману» – his own answer to his own ask, that a
// player must come off this screen understanding «на сколько мощно сейчас (на момент 13-14) и какой
// запас впереди».
//
//     the BASE = WHAT YOU BUILT          where she stands against fourteen-year-olds TODAY
//     the ROOM = WHAT SHE WAS BORN WITH  how much was in her before anybody did anything
//
// ⚠⚠ AND THAT IS WHY ONE OF THEM ANSWERS THE CHILDHOOD AND THE OTHER CANNOT. Read the next
// paragraph before "fixing" the room band to respond to the player, because the asymmetry is the
// design and the owner has accepted it:
//
//   * `handoverRoomBand` reads her BIRTH build. Nine years of the best decisions a parent can make
//     do not add a point of potential – §4 – so the room sentence is identical for the neglected
//     childhood and the devoted one from the same seed. That is the potential rule being kept.
//   * `handoverBaseBand` reads her ARRIVAL. Phase 1 measured the nine years at ±2.3 points on the
//     mean attribute, and the cuts sit at 48.50 ± 2.20 of the fourteen-year-old distribution, so the
//     base sentence MOVES with what the player did – on 40.9% of seeds between the cheapest and the
//     dearest walk through the shipped card table, and on 89.9% between the model's own extremes.
//
// So the same seed, walked two ways, comes off this screen with two different base sentences and one
// room sentence. `tests/prologue-handover.test.ts` asserts exactly that pair, because it is the one
// property a reader is most likely to mistake for a bug.
//
// ⚠ NO CEILING CONTOUR ANYWHERE NEAR EITHER OF THEM. §5's rule is untouched: the potential is never
// DRAWN, the rose shows where she IS, and neither sentence names a number or a ceiling. The base
// band is a statement about today against girls the same age – it says nothing about how far she can
// go, which is what leaves the fog doing its job.
import { rngFromSeed } from '../engine/rng'
import { formatCents } from '../shared/money'
import { WEEKS_IN_SEASON } from '../shared/dates'
import { CARD_AGES } from './cards'
import type { HandoverBaseBand } from '../shared/protocol'

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

/** ⭐⭐ THE BASE, IN THE SAME VOICE – DRAFTS, EVERY ONE, and the owner has not read them.
 *
 *  ⚠ §8a's three room bands above are transcribed VERBATIM from the spec and are the only copy in
 *  the whole prologue he has approved. NOTHING BELOW IS. These six sentences are new, they are
 *  written in the register of the approved ones – short, declarative, no adjective stacks, no
 *  number, no ceiling – and they are marked as drafts in §8a beside the lines they now stand next
 *  to. ⚠ The approved room lines were NOT rewritten to accommodate them: the base sentence goes
 *  FIRST and his sentence follows unchanged, which is why none of these ends in a clause that
 *  expects a particular continuation.
 *
 *  ⚠ TOTAL BY CONSTRUCTION. The key is the `HandoverBaseBand` union, so there is no fallback arm
 *  here and none is needed – the compiler will not let a fourth band exist without a fourth set of
 *  lines, which is the failure `FALLBACK_BAND` above exists to catch for the stringly-typed room
 *  band. */
export const COACH_BASE_READS: Readonly<Record<HandoverBaseBand, readonly string[]>> = {
  ahead: [
    'She is ahead of most girls her age. Somebody did the work.',
    'She is further along than the girls she will be playing.',
  ],
  level: [
    'She is where most girls her age are.',
    'She is level with the girls she will be playing.',
  ],
  behind: [
    'She is behind most girls her age. That is the ground she starts from.',
    'There is ground to make up on the girls her age.',
  ],
}

/** WHICH BASE LINE HE SAYS – the same shape as `coachReadFor`, on its OWN purpose-scoped key.
 *
 *  ⚠ `:prologue:base`, NOT `:prologue:read`. Two draws off one key would make the two sentences move
 *  together – always the first of each band, or always the second – which is a pattern a player can
 *  see and which would halve the copy that is ever read. Both are re-derived at the call site, both
 *  persist nothing, and neither touches MAIN, so the frozen capture (41550 / e6b0c709) and every
 *  career hash are unmoved (CLAUDE.md invariant 2).
 *
 *  ⚠ AND, AS ABOVE, THE READING IS THE BAND AND THE BAND IS DERIVED. Only WHICH SENTENCE SAYS IT is
 *  drawn, so nothing a player can see changes meaning with the draw. */
export function coachBaseReadFor(band: HandoverBaseBand | '', seed: string): string {
  // '' is the week-1-onwards value of the snapshot field, and this screen only exists at week 0 –
  // so it is not a band with no lines, it is "there is nothing to say yet", and it says nothing.
  if (band === '') return ''
  const lines = COACH_BASE_READS[band]
  const rng = rngFromSeed(`${seed}:prologue:base`)
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
  /** ⭐⭐ DRAFT, AND THE OWNER HAS ASKED FOR OPTIONS ON THIS ONE LINE (02.09): «по вордингу вроде
   *  всё ок, кроме "Raise another child" – давай подумаем как еще можно написать.»
   *
   *  WHAT WAS WRONG WITH IT, as far as it can be read off his note: «another child» is the phrase a
   *  family uses for a SECOND child, so on a screen that has just introduced the girl you raised it
   *  reads as being offered a sibling rather than a different girl. `START_AGAIN_DRAFTS` below is
   *  the shortlist; this line is the one of them recommended, and switching to another is deleting
   *  one word and typing another.
   *
   *  ⚠ EVERY CANDIDATE OBEYS §2.3 AND THE SWEEP ENFORCES IT. «Про рестарт с перебросом мы ничего не
   *  говорим»: no candidate may mention a reroll, odds, a seed, a floor or a chance, and each one
   *  has to stay a choice about HER rather than about a mechanism. `tests/prologue-handover.test.ts`
   *  sweeps this whole table, drafts included. */
  startAgain: 'Raise a different girl',
} as const

/** ⭐ THE THREE THE OWNER HAS TO PICK FROM, and the recommended one is `HANDOVER_COPY.startAgain`
 *  above so the screen always renders a real answer rather than a menu.
 *
 *  Each says the same thing about a different part of it, which is what makes them a choice and not
 *  three phrasings of one sentence:
 *
 *    `Raise a different girl`         – the smallest change from what he already has, and it fixes
 *                                       the only thing that was wrong: `different` cannot be read
 *                                       as `additional` the way `another child` can.
 *    `Start again with another girl`  – says out loud that this is the beginning over again, which
 *                                       the current wording leaves the player to infer from where
 *                                       the button is.
 *    `Give the nine years to another girl`
 *                                     – the only one that answers the screen it is ON: the card
 *                                       above it is the account of nine years, and this offers the
 *                                       same nine to somebody else. Longest of the three.
 *
 *  ⚠ NONE OF THE THREE NAMES A MECHANISM, EACH IS STILL ABOUT HER, and none of them says «again»
 *  about the girl herself – she is not being re-rolled, a different girl is being raised. A fourth
 *  candidate, «Someone else's nine years», was drafted and dropped for exactly that: it is about the
 *  YEARS and mentions no child at all, which is the half of his ruling that is easiest to lose. */
export const START_AGAIN_DRAFTS: readonly string[] = [
  'Raise a different girl',
  'Start again with another girl',
  'Give the nine years to another girl',
]

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

/** ⭐⭐ WHAT THAT WAS PER WEEK – HIS IDEA, AND IT IS THE THESIS OF THE GAME IN ONE FIGURE.
 *
 *  The nine years come to $8,200 at the cheapest and $28,150 at the dearest, which reads as a large
 *  number either way. Divided by the weeks it actually took, it is about $18 a week against $60 –
 *  and a coach in the game costs $130 to $450 A WEEK (`ECONOMY.coach.hourlyRateCents`, priced by the
 *  rung). So the sentence that follows the total is the one that tells the player what scale they
 *  are about to be charged at, on the screen immediately before the first weekly bill arrives. The
 *  childhood was the cheap part, and this is where that stops being a surprise.
 *
 *  ⚠⚠ THE FIGURE IS DERIVED FROM THE RUN AND NEVER TYPED. `cents` is the player's own total and the
 *  divisor is the card table's own length times the season's own length – `CARD_AGES.length` is nine
 *  because there are nine cards, `WEEKS_IN_SEASON` is the game's own year. A card whose price moves,
 *  or a tenth card, moves this sentence with no edit here, and `tests/prologue-handover.test.ts`
 *  recomputes it from the table rather than pinning a string.
 *
 *  ⚠ IT MAY NOT IMPORT `engine/childhood.ts` for the nine, however natural `CHILDHOOD.startAge`
 *  would read: `tests/childhood.test.ts` pins that module's importer set as exactly
 *  `['engine/world.ts']`, and the card table is the honest source here anyway – the sentence is about
 *  what the PLAYER walked, and what the player walked is the cards.
 *
 *  DRAFT, like every other sentence on this screen, and he has not read it. */
export function weeklySpentLine(cents: number): string {
  const weeks = CARD_AGES.length * WEEKS_IN_SEASON
  return `That is about ${formatCents(Math.round(cents / weeks))} a week, every week of it.`
}

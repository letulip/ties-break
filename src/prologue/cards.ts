// THE NINE CARDS – phase 2 of docs/specs/childhood-prologue-build-2026-09.md, and they are A TABLE.
//
// ⚠⚠ EVERY SENTENCE IN THIS FILE IS A DRAFT AND NONE OF IT HAS BEEN SEEN BY THE OWNER.
// He has approved §8a (the coach's handover lines) and §8b (the wizard's promise). He has never read
// a word of the nine cards. The build spec says so in as many words – «⭐ The copy below is DRAFTED,
// not decided … It ships only with his word» – and CLAUDE.md's invariant 4 says what that means for
// everyone who touches it afterwards: user-facing wording is not an agent's to change, and it is not
// an agent's to INVENT AND THEN DEFEND either. Read every `label`, `lede`, `note`, `title`, `kicker`
// and `read` below as a placeholder in the house register, holding the slot until he fills it.
//
// ⭐⭐ AND THAT IS THE WHOLE REASON THE CARDS ARE DATA. Build spec §7: «Cards are a table, not nine
// components.» Nine components would mean nine templates, nine `<style>` blocks and nine mounted
// tests, and replacing his copy would then be a refactor with a test run at the end of it. Here it
// is A TABLE EDIT AND NOTHING ELSE, and that is literally true and mechanically checked:
//
//   * NOT ONE PLAYER-FACING SENTENCE IS IN A VUE TEMPLATE. `PrologueCard.vue` renders `{{ }}`
//     bindings off this table and holds no copy of its own – `tests/prologue-cards.test.ts` asserts
//     that the component's template contains no sentence at all, so a card's words can never leak
//     back into markup where changing them would mean editing a component.
//     ⚠ AND THIS COMMENT MAY NOT SPELL THE TAG OUT, which cost a gate run and is worth recording.
//     `tests/coach-voice.test.ts` takes a file's rendered surface from the first literal opening tag
//     to the LAST closing one – and a `.ts` file has no closing tag, so `to > from` is false and the
//     region runs to the END OF THE FILE. Naming the tag in prose turned this whole table, comments
//     included, into "rendered template text" and the R15-7 sweep reported nineteen offenders, three
//     of which were the owner's own quoted rulings in comments that the rule explicitly exempts. The
//     same silent-widening family CLAUDE.md's marker-helper gotcha is about, arriving through a
//     COMMENT rather than through a pin.
//   * THE STRUCTURE IS UNIFORM ACROSS ALL NINE. A quiet card is a card with no `options`, not a
//     different kind of thing, so nothing downstream branches on which card it is drawing.
//   * THE COPY RULES ARE ENFORCED HERE RATHER THAN IN THE MARKUP. `template-copy-rules.test.ts`
//     reads Vue templates, and none of these strings are in one, so the same three rules (no
//     Cyrillic, the short dash `–` only, the player is «you» and never «they») are re-asserted over
//     this table by `tests/prologue-cards.test.ts`. Moving copy out of the markup must not move it
//     out of the guard.
//   * ⚠ AND R15-7 ALREADY REACHES THIS TABLE, so it is NOT re-asserted here. `coach-voice.test.ts`
//     sweeps every string literal in `src/**` for a masculine pronoun – «the player is "you", the
//     girl is "she", and every professional is UNNAMED» – and that is exactly the cast of these nine
//     cards. The first draft of the coach's read called the person teaching her "he" fourteen times
//     and the house sweep caught all fourteen; the owner's own fix is to drop the pronoun.
//
// ⚠ FOUR CARDS CARRY NO DECISION – 5, 6, 7 AND 13 – AND THE COUNT IS HIS («может тогда больше без
// решений, 3 или 4?»). Build spec §3: nine consecutive choices is not ten minutes, it is a quiz. The
// shape is the argument: three quiet years while she is small and nothing costs anything, five years
// of real decisions from 8 to 12, then a quiet thirteenth as the run-up to the handover.
// `DECISION_AGES` below is DERIVED from the table rather than declared beside it, and the test pins
// it as the LIST [8, 9, 10, 11, 12] – so a card that grows a decision reddens a test instead of
// quietly making the prologue a quiz.
//
// ⚠⚠ WHY THIS FILE DOES NOT IMPORT `engine/childhood.ts`, WHICH IS THE MODEL IT FEEDS.
// `tests/childhood.test.ts` pins that module's importer set as EMPTY, and phase 4 moves it to
// exactly `['engine/world.ts']` as a one-line reviewed change. Phase 2 is not the wiring phase, so
// nothing under `src/` may import it yet – including this table. The duplication that would
// otherwise create is answered in the test rather than in the source: `tests/prologue-cards.test.ts`
// feeds this table's own rows straight into `childhoodWalk`, which type-checks under `vue-tsc`
// (`PrologueYear` must be assignable to `ChildhoodYear` or the gate goes red) and runs, so the two
// shapes cannot drift apart without a red gate. Same for `APPETITE_AT` below.
import type { SessionKind } from '../shared/protocol'

/** ONE YEAR AS THE MODEL SEES IT – the structural twin of `engine/childhood.ts`'s `ChildhoodYear`.
 *
 *  ⚠ PHASE 2 DECLARED IT HERE; PHASE 4 MOVED IT TO `shared/protocol` AND LEFT THIS RE-EXPORT.
 *  Nothing about the header's argument changed – this table still may not import the engine module
 *  it feeds – but the shape now CROSSES THE WIRE (the `new` command carries the nine years to
 *  `createWorld`), and a wire type belongs to the protocol. There are still exactly two declarations
 *  of it, this file's readers still spell it `PrologueYear`, and the test still asserts assignability
 *  against `ChildhoodYear` in both directions, so it is a duplicate that cannot go stale. */
export type { PrologueYear } from '../shared/protocol'

/** ⚠ A COPY OF `appetiteAt(age)`, FOR THE SAME REASON AS `PrologueYear` – and it is pinned against
 *  the real function for all nine ages, so it is a copy that cannot drift. It is here because the
 *  table wants to say «two thirds of what a nine-year-old can take» rather than «0.417»: a share is
 *  reviewable by a person and an absolute is not. */
export const APPETITE_AT: Readonly<Record<number, number>> = {
  5: 0.25,
  6: 0.34375,
  7: 0.4375,
  8: 0.53125,
  9: 0.625,
  10: 0.71875,
  11: 0.8125,
  12: 0.90625,
  13: 1,
}

/** ⭐ WHAT THE CARD SHOWS ABOUT HER, AND IT IS NEVER A NUMBER. Two short sentences: whether she is
 *  enjoying it, and what the person teaching her makes of it. The argument is in this file's §"what
 *  a card shows" note below `PROLOGUE_CARDS`.
 *
 *  ⚠ IT IS A PAIR AND THE RUN PICKS THE ARM, so a card reports the year the player actually bought
 *  rather than a fixed caption. `cool` is the arm for a childhood that has been taking the lighter
 *  road; `warm` for one that has not. Cards 5..8 have no decision behind them – nothing has been
 *  chosen yet by the time they are drawn – so their two arms are DELIBERATELY the same sentence and
 *  the test asserts it: a card may not claim to have read something it cannot have seen. */
export interface PrologueRead {
  readonly cool: string
  readonly warm: string
}

/** ONE ANSWER ON A CARD. Origins (card 5) and decisions (cards 8..12) are the same shape, so the
 *  screen draws one list and knows nothing about which kind it is holding. */
export interface PrologueOption {
  readonly id: string
  /** DRAFT */
  readonly label: string
  /** DRAFT – and this is where the cost is NAMED IN RELATIVE TERMS (§2.4: «a club is about three
   *  times the municipal court»). ⚠ NO FIGURE MAY APPEAR HERE. A running balance is never on screen
   *  and neither is a price; the total surfaces once, on the handover, which is phase 4. The test
   *  asserts no note contains a digit, and separately that the multiplier a note claims is TRUE of
   *  the cents below it – so the copy and the arithmetic cannot drift apart in silence. */
  readonly note: string
  /** what this year of tennis costs, in cents (house law: money is in cents everywhere). Accumulated
   *  by `run.ts`, rendered by nothing. */
  readonly costCents: number
  /** her share of what a child that age can take, 0..1 – multiplied by `APPETITE_AT[age]` into the
   *  absolute `practice` the model wants. Absent on an origin option: choosing where the family is
   *  from does not change what a five-year-old does with a racket. */
  readonly share?: number
  readonly teaching?: number
  readonly focus?: SessionKind
}

// =================================================================================================
// ⭐⭐⭐ THIS YEAR'S TOURNAMENT QUESTION – phase 11, and it is HIS CORRECTION of a reading I had wrong
// =================================================================================================
//
// THE FIRST READING, WHICH WAS MINE AND WAS WRONG: the age-10 card decides whether she becomes a
// competitor at all, and everything after follows from it. THE OWNER: «Сказали "не в этом году" –
// значит не в этом году, дальше тоже можно спрашивать, не вижу проблем. Может быть в следующие года
// уже тренер будет чуть более настойчив, например, или она сама.»
//
// So «not this year» closes THAT YEAR and nothing else, the question comes back, and – the better
// half of his note – THE ASKING ESCALATES. Year one it is an event in six weeks. Then it is the
// person teaching her, twice. Then it is HER, with the date already written down. A parent who keeps
// saying no should feel the question getting harder to answer, and that is the prologue's own drama
// arriving with no new system behind it.
//
// ⚠⚠ WHY IT IS THIS FIELD AND NOT AN `options` ROW, WHICH IS THE STRUCTURAL PROBLEM THIS SLICE HAD
// TO SOLVE. Three pins collide on the ages the repeat needs:
//
//   * `DECISION_AGES` is DERIVED from `options` and pinned as exactly [8, 9, 10, 11, 12], so an
//     answer added to a card's `options` array changes the shape the owner counted.
//   * THE THIRTEENTH IS ONE OF THE FOUR QUIET CARDS, and the count is his: «может тогда больше без
//     решений, 3 или 4?»
//   * THE TWELFTH IS THE FORK, and a second decision on the card the whole childhood builds to would
//     be the fork sharing its screen.
//
// The way out that keeps all three: the tournament question is A LIGHTER CONTROL AND NOT A YEAR'S
// DECISION – a separate field, invisible to `DECISION_AGES`, buying no `share`, no `teaching` and no
// `focus`. It changes ONE thing about the year, which is whether a weekend happened, and it costs
// the entry. ⚠ THE PRICE OF THAT CHOICE, SAID PLAINLY: the thirteenth card carries a yes/no now,
// so it is quiet in the sense the pin measures (no `options`, no year shaped by it) and not in the
// sense of «nothing is asked». That is a real cost and it is the owner's to overrule – but it is the
// only one of the three shapes that leaves his own count of decision years standing, and widening
// `DECISION_AGES` is his ruling to give rather than a builder's.
//
// ⚠ AND IT IS ASKED AS A SECOND BEAT ON THE SAME CARD, not as a tenth screen. Same painting, same
// kicker, same title; the ask's own line replaces the lede and its two answers replace the card's.
// A separate scene for it would be three more screens in a walk §3 already keeps under nine, and the
// two read lines are deliberately not drawn on the ask beat – they are the card's reading of a YEAR
// and this beat is a question about one weekend.

/** ONE YEAR'S TOURNAMENT QUESTION. Two answers, a line saying who is asking, and the entry's price.
 *
 *  ⚠ NO `share`, NO `teaching`, NO `focus` – that is what makes it lighter than a decision rather
 *  than a decision wearing a different name. Entering a Local Open is not more coaching and is not a
 *  different kind of year; it is a weekend. (The age-10 card's own `matchplay` option is the
 *  exception and is deliberate: at ten the question IS the year's decision, because becoming
 *  somebody who plays tournaments is what that year is about.) */
export interface TournamentAsk {
  /** DRAFT – WHO IS ASKING, AND HOW HARD. This is the escalation, and it is the only thing that
   *  differs between the three rows: the same question, asked by somebody else each year. */
  readonly lede: string
  /** DRAFT – say yes */
  readonly enterLabel: string
  /** DRAFT – and what the yes costs, in relative terms. ⚠ NO FIGURE, like every other note. */
  readonly enterNote: string
  /** DRAFT – say no */
  readonly declineLabel: string
  /** DRAFT */
  readonly declineNote: string
}

/** ⭐ WHAT AN ENTRY COSTS ON TOP OF THE YEAR, in cents – DERIVED FROM THE TENTH CARD'S OWN TWO
 *  ANSWERS and never typed a second time. The difference between «Enter her» and «Not this year» IS
 *  the price of a weekend in this table (150_00 today, and the tenth's own note calls it «about a
 *  month of the group»), so a re-priced tenth card moves every later entry with it and no second
 *  number can go stale. Read by `spentCents` in run.ts; declared below the table because it reads
 *  it. */
export function entryCostCents(): number {
  const tenth = PROLOGUE_CARDS.find((c) => c.age === 10)
  const costs = (tenth?.options ?? []).map((o) => o.costCents)
  return costs.length < 2 ? 0 : Math.max(...costs) - Math.min(...costs)
}

/** The two answer ids, spelled once. `enteredIn` in run.ts compares against `ENTER`. */
export const TOURNAMENT_ANSWER = { enter: 'enter-open', decline: 'skip-open' } as const

export interface PrologueCard {
  readonly age: number
  /** DRAFT */
  readonly kicker: string
  /** DRAFT */
  readonly title: string
  /** DRAFT */
  readonly lede: string
  /** DRAFT – see `PrologueRead` */
  readonly her: PrologueRead
  /** DRAFT – the person teaching her, same selector */
  readonly coach: PrologueRead
  /** DRAFT – the control on a card with nothing to decide */
  readonly continueLabel: string
  /** ⭐⭐ DRAFT – THE QUESTION THE ANSWERS ANSWER, printed directly above them.
   *
   *  THE OWNER, 02.09, on the age-5 card: «у нас есть 3 выбора перед игроком, и вообще непонятно к
   *  чему они, потому что вопроса нет». Three buttons arrived under a scene with nothing asking for
   *  them, so the player had to infer what he was being asked – which is the interpretive reading he
   *  ruled against in the same pass («давай будем более фактичными и менее интерпретативны для
   *  игрока»). A card that offers answers says what the question is.
   *
   *  ⚠ OPTIONAL, AND ONLY THE FIVE CARRIES ONE TODAY. On 8..12 the title IS the question and a
   *  second line restating it would be the screen talking twice; the five is the card where the
   *  title is about HER and the answers are about the family, and that gap is what he fell into. */
  readonly question?: string
  /** the year this card runs when it carries no decision. Absent on 8..12, where the chosen option
   *  supplies it, and on 13, which follows the twelfth (`sameAsLastYear`). */
  readonly share?: number
  readonly teaching?: number
  readonly focus?: SessionKind
  /** what this quiet year costs, in cents */
  readonly costCents?: number
  /** ⚠ THE THIRTEENTH YEAR IS LAST YEAR AGAIN, and that is a claim rather than a shortcut: whatever
   *  the twelfth settled – she stopped, she finished the year, she got the year she asked for – is
   *  what she is doing when the coach speaks at the handover. A thirteenth year with its own fixed
   *  numbers would be the game forgetting the fork one card after showing it. */
  readonly sameAsLastYear?: true
  /** ⭐⭐ PHASE 11 – THIS YEAR'S TOURNAMENT QUESTION, ASKED AGAIN. See `TournamentAsk` below and the
   *  section under the table for the whole argument. Absent on 5..10: below his floor there is
   *  nothing to ask, and at ten the card's OWN decision is the question. */
  readonly tournament?: TournamentAsk
  /** the decisions. ⚠ ABSENT on 5, 6, 7 and 13 – see the header. */
  readonly options?: readonly PrologueOption[]
  /** where the family is FROM (§2.4), and it is NOT a decision: build spec §3 lists card 5's
   *  decision as «none – the hook, and the family's origin», holding the two apart on purpose. It is
   *  the question the wizard used to ask, asked in the fiction instead. `DECISION_AGES` reads
   *  `options` alone, so this cannot creep into the count. */
  readonly origins?: readonly PrologueOption[]
  /** ⭐ WHO SHE IS – her name, her birthday and her country, on the ONE card that carries them
   *  (owner, 02.09: «часть нашего текущего онбординга с датой рождения и именем должны остаться»,
   *  and «страну тоже добавь, да»).
   *
   *  ⚠ A FLAG AND NOT COPY, which is why it is a `true` rather than a table of labels: the fields
   *  are the WIZARD's, in the wizard's own words, and those words live in
   *  `composables/identityCopy.ts` where both surfaces read them. This table says WHICH card asks;
   *  it does not say what the asking sounds like, because that sentence already exists.
   *
   *  ⚠ AND IT IS NOT A DECISION EITHER. Like `origins` it is invisible to `DECISION_AGES`, which
   *  reads `options` alone – the five-year-old's card still carries none, and the shape the owner
   *  counted («может тогда больше без решений, 3 или 4?») is unchanged. */
  readonly identity?: true
}

// =================================================================================================
// THE TABLE
// =================================================================================================

export const PROLOGUE_CARDS: readonly PrologueCard[] = [
  {
    age: 5,
    kicker: 'She is five',
    // ⚠ THE OWNER, 02.09: «хочется спросить "что она еле держит"… если здесь речь о ракетке, то так
    // и напишем.» It was «She can barely hold it.» and the it was never named – the racket is in the
    // NEXT sentence, one paragraph down, which is a sentence too late for a title.
    title: 'She can barely hold the racket.',
    lede:
      'It is too big for her and she swings it like a shovel. She misses, and then she ' +
      'does it again, and she is still doing it twenty minutes later. Nobody has decided anything.',
    her: {
      cool: 'She thinks the game is to hit the ball into the fence.',
      warm: 'She thinks the game is to hit the ball into the fence.',
    },
    coach: {
      cool: 'Nobody is teaching her. She is five.',
      warm: 'Nobody is teaching her. She is five.',
    },
    continueLabel: 'Go on',
    // ⭐ DRAFT – THE QUESTION THAT WAS MISSING (owner, 02.09; see `question` on `PrologueCard`). It
    // names the thing the three buttons are about and what answering decides, and it does so
    // FACTUALLY: not «choose your difficulty» – §7 keeps a difficulty menu out of v1 – but the plain
    // statement of what the answer sets.
    question: 'Where does she grow up? It decides what the family can spend on tennis for the next nine years.',
    share: 0.35,
    teaching: 0.1,
    focus: 'general',
    costCents: 0,
    // ⭐ WHO SHE IS, AND THIS IS THE CARD THAT ASKS. Her name, her birthday and her country – the
    // wizard's own three fields, in the wizard's own words – sit above the origins on the FIRST
    // card, because a name is the one thing a parent has before anything else has happened and
    // because a tenth screen for it would be the quiz §3 exists to avoid. See `identity` on
    // `PrologueCard` and src/prologue/identity.ts.
    identity: true,
    // ⚠ THE ORIGIN, NOT A DIFFICULTY MENU (§7: a difficulty menu is NOT IN v1 and §2.4 replaces it).
    // The three ids are the game's own `FamilyBackground` values, so phase 4 hands `createWorld` a
    // string it already understands and no new type is invented for a choice that already exists.
    origins: [
      {
        id: 'working',
        label: 'A small town, and you both work.',
        note: 'There is nothing spare. Everything after this is a real decision.',
        costCents: 0,
      },
      {
        id: 'middle',
        label: 'A city, and the bills are paid.',
        note: 'There is some room. Not a lot of it.',
        costCents: 0,
      },
      {
        id: 'wealthy',
        label: 'Money is not the question in this house.',
        note: 'You still have to decide where she goes and who teaches her.',
        costCents: 0,
      },
    ],
  },

  {
    age: 6,
    kicker: 'She is six',
    // ⚠ THE OWNER, 02.09: «She asks to go back – куда обратно?… Я бы интерпретировал из заголовка,
    // что она хочет домой.» Read cold, under a kicker that says her age and above a scene about a
    // summer session, «go back» took its destination from the reader – and the reading he got was
    // that she wanted to go HOME, which is the opposite of what the card is about. The place is
    // named in the title now instead of two sentences later.
    title: 'She asks to go back to the court.',
    lede:
      'Somebody handed her a racket at a summer session and she has asked about it every week ' +
      'since. There is a group at the municipal court on Tuesdays. It costs almost nothing and it ' +
      'is twenty minutes away.',
    her: { cool: 'She likes it. That is all you know.', warm: 'She likes it. That is all you know.' },
    coach: {
      cool: 'The coach who runs the group learns her name in the second week.',
      warm: 'The coach who runs the group learns her name in the second week.',
    },
    continueLabel: 'Sign her up',
    share: 0.65,
    teaching: 0.35,
    focus: 'general',
    costCents: 200_00,
  },

  {
    age: 7,
    kicker: 'She is seven',
    title: 'The group works.',
    // ⚠ THE OWNER, 02.09: «she has not noticed – чего она не заметила?» The sentence left the object
    // of «noticed» to the reader, and the object is the clause immediately before it, which is
    // exactly the shape that stops reading as a sentence and starts reading as a riddle. Named.
    lede:
      'Twice a week, eight children, one court. She is not the best of the eight, and she has not ' +
      'noticed that she is not. A year goes by like this and none of it costs you anything you ' +
      'have to think about.',
    her: { cool: 'She still asks to go.', warm: 'She still asks to go.' },
    coach: {
      cool: 'The coach says she listens – at seven that is a compliment.',
      warm: 'The coach says she listens – at seven that is a compliment.',
    },
    continueLabel: 'A year passes',
    share: 0.7,
    teaching: 0.4,
    focus: 'general',
    costCents: 200_00,
  },

  {
    age: 8,
    kicker: 'She is eight',
    title: 'There is a club across town.',
    lede:
      'The municipal court has one coach and no wall. The club has four courts, a programme, and ' +
      'the coaches other families drive their children to. It is forty minutes each way.',
    // Card 8 follows a quiet year, so there is nothing behind it for the two arms to differ on.
    her: {
      cool: 'She has a forehand now and she wants you to watch it.',
      warm: 'She has a forehand now and she wants you to watch it.',
    },
    coach: {
      cool: 'The coach says she could do more than this group gives her.',
      warm: 'The coach says she could do more than this group gives her.',
    },
    continueLabel: 'Go on',
    options: [
      {
        id: 'municipal',
        label: 'Stay at the municipal court',
        // ⚠ the baseline the note on the next option is measured against – 1_800_00 / 600_00 = 3.
        note: 'What you are already paying. She keeps the group and you keep your evenings.',
        costCents: 600_00,
        share: 0.6,
        teaching: 0.3,
        focus: 'general',
      },
      {
        id: 'club',
        label: 'The club across town',
        note: 'About three times the municipal court, every month, and the drive on top.',
        costCents: 1_800_00,
        share: 0.95,
        teaching: 0.95,
        focus: 'general',
      },
    ],
  },

  // ⚠⚠ REWRITTEN WHOLE, 02.09, AND THE OWNER'S VERDICT ON THE OLD ONE WAS TOTAL: «Вот этот весь
  // блок мне смыслово непонятен ни в ответах, ни в формулировках.» Two separate faults, and the
  // rewrite answers both rather than editing a sentence:
  //
  //   * NOTHING ON THE CARD SAID WHAT WAS ON OFFER. The old lede described a feeling («an hour on
  //     her own is not a different amount of tennis, it is a different price») and left the player
  //     to work out that the club was SELLING something. The card names the offer now, in the lede,
  //     before either answer.
  //   * AND IT OPENED ON A CLAIM THE GAME DOES NOT MAKE. «She is a year older than most of them» –
  //     his question was «это мы из даты рождения берем или как?», and the honest answer is NO: the
  //     prologue's nine ages are fixed 5..13 for every career, the birthday she is given on the
  //     five decides only whether she opens the game at thirteen or fourteen (`kidAgeYears`), and
  //     nothing anywhere models the other children's ages. It was a fixed sentence wearing the
  //     clothes of a derived one, which is the worst of both: it cannot be true of every career and
  //     it invites the player to look for the arithmetic behind it. There is none, so the claim is
  //     gone. What is left – eight children and one court – is the group card 7 already described.
  {
    age: 9,
    kicker: 'She is nine',
    title: 'Eight children are waiting for one court.',
    lede:
      'Two sessions a week, and much of each one she spends in the queue for a turn. The club also ' +
      'sells an hour a week with a coach to herself: the same hour of her week, with nobody else ' +
      'on the court.',
    her: {
      cool: 'She is doing what the group does and no more.',
      warm: 'She is one of the ones who stays behind afterwards.',
    },
    coach: {
      cool: 'The coach says she is fine, and says it about all eight of them.',
      warm: 'The coach is the one who offered you the hour.',
    },
    continueLabel: 'Go on',
    options: [
      {
        id: 'group',
        label: 'Keep her in the group',
        note: 'The same money as this year. She keeps her place in the queue.',
        costCents: 1_800_00,
        share: 0.6,
        teaching: 0.25,
        focus: 'general',
      },
      {
        id: 'one-to-one',
        label: 'Buy the hour, one to one',
        // 7_200_00 / 1_800_00 = 4.
        note: 'About four times the group, and it buys one hour a week with nobody else on the court.',
        costCents: 7_200_00,
        share: 0.85,
        teaching: 1,
        focus: 'serve',
      },
    ],
  },

  {
    age: 10,
    kicker: 'She is ten',
    title: 'There is a Local Open in six weeks.',
    lede:
      'Under-twelves, one weekend, forty minutes down the motorway. An entry, a hotel night if she ' +
      'wins on the Saturday, and a draw sheet with her name on it.',
    her: {
      cool: 'She plays on Tuesdays and she thinks about it on Tuesdays.',
      warm: 'She has started watching how other people serve.',
    },
    coach: {
      cool: 'The coach has not mentioned the tournament to you.',
      warm: 'The coach thinks she would not embarrass herself in a draw.',
    },
    continueLabel: 'Go on',
    options: [
      {
        id: 'stay-home',
        label: 'Not this year',
        note: 'Nothing extra. She practises that weekend like any other.',
        costCents: 1_800_00,
        share: 0.7,
        teaching: 0.5,
        focus: 'general',
      },
      {
        id: 'enter',
        label: 'Enter her',
        // 1_950_00 - 1_800_00 = 150_00, and a month of the group is 1_800_00 / 12 = 150_00.
        note: 'An entry and a weekend – about a month of the group, once.',
        costCents: 1_950_00,
        share: 0.8,
        // ⚠ THE SAME `teaching` AS NOT ENTERING, DELIBERATELY. Playing a tournament is not more
        // coaching, and if it read as more coaching the fork below would count one choice twice –
        // once as a tournament and once as a year of one-to-one. The three signals §2.5 names have
        // to stay three signals.
        teaching: 0.5,
        focus: 'matchplay',
      },
    ],
  },

  {
    age: 11,
    kicker: 'She is eleven',
    title: 'The sports school takes children at eleven.',
    lede:
      'Mornings on court, lessons after. Every child there is doing this. The ones who stop at ' +
      'fourteen have no ordinary school to go back to, and everybody knows that and sends them.',
    her: {
      cool: 'She plays when it is on the timetable.',
      warm: 'She has asked whether she can go more often.',
    },
    coach: {
      cool: 'The coach says she has kept up, and nothing more than that.',
      warm: 'The coach says the limit on this is her week, not her hands.',
    },
    continueLabel: 'Go on',
    options: [
      {
        id: 'ordinary-school',
        label: 'Ordinary school',
        note: 'No change to what you pay. Her afternoons stay hers.',
        costCents: 2_400_00,
        share: 0.5,
        teaching: 0.25,
        focus: 'general',
      },
      {
        id: 'sports-school',
        label: 'The sports school',
        // 4_800_00 / 2_400_00 = 2.
        note: 'About twice the club, and it takes most of her week with it.',
        costCents: 4_800_00,
        share: 1,
        teaching: 1,
        focus: 'fitness',
      },
    ],
    // ⭐ THE SECOND ASKING, AND IT IS THE COACH. DRAFT. A year ago the tournament was a poster on a
    // motorway; this year somebody who watches her every week has an opinion about it.
    tournament: {
      lede:
        'There is a Local Open in the spring, and the coach has mentioned it twice now – once to ' +
        'her, once to you.',
      enterLabel: 'Put her name down',
      enterNote: 'An entry and a weekend, on top of the year.',
      declineLabel: 'Not this year',
      declineNote: 'Nothing extra. She practises that weekend like any other.',
    },
  },

  // ⭐⭐ THE FORK. This row is the «she is tired of it» face; `TWELFTH_WANTS_MORE` below is the other
  // one, and exactly one of them is ever drawn. Which one is DERIVED from years 5..11 – see
  // `readTwelfth` in run.ts – and derived is the whole ruling (§2.5): «Развилку в двенадцать лет
  // можно вывести из того, что делал игрок». There is no stored motivation number, no new save
  // field and no dice, and the trap he named – «на новом заходе она точно должна хотеть» – cannot
  // arise, because there is nothing here to roll badly.
  {
    age: 12,
    kicker: 'She is twelve',
    title: 'She does not want to go on Thursday.',
    lede:
      // ⚠ THE «not a mystery» CLAUSE IS GONE FROM BOTH FACES OF THE FORK. It existed to introduce
      // the three-line list under it; the list is one folded sentence now (`TWELFTH_REASONS`), and
      // that sentence introduces itself.
      'Three weeks of this now. There was no scene and she has not said anything. She simply ' +
      'finds something else to be doing at six o\'clock.',
    her: {
      cool: 'She has stopped talking about it at dinner.',
      warm: 'She is not tired of tennis. She is tired of this week.',
    },
    coach: {
      cool: 'The coach has seen it before and is not surprised by it.',
      warm: 'The coach says she is not the first to go quiet at twelve.',
    },
    continueLabel: 'Go on',
    options: [
      {
        id: 'let-her-stop',
        label: 'Let her stop for a season',
        note: 'A quarter of what this year was going to cost. She keeps her Thursdays.',
        costCents: 600_00,
        share: 0.2,
        teaching: 0.1,
        focus: 'general',
      },
      {
        id: 'finish-the-year',
        label: 'Ask her to finish the year',
        note: 'What you are paying now, for one more year of it.',
        costCents: 2_400_00,
        share: 0.8,
        teaching: 0.65,
        focus: 'general',
      },
    ],
    // ⭐⭐ THE THIRD ASKING, ON THE FACE WHERE SHE HAS GONE QUIET – so it is the coach, and it is the
    // most insistent version of it. DRAFT. ⚠ THE OTHER FACE OF THE TWELFTH ASKS DIFFERENTLY, and
    // that is the whole reason the ask lives on a card row: `TWELFTH_WANTS_MORE` carries its own,
    // and on that one it is HER.
    tournament: {
      lede:
        'The coach asked about the Local Open again, and asked you to think about it before ' +
        'answering this time.',
      enterLabel: 'Put her name down',
      enterNote: 'An entry and a weekend, on top of the year.',
      declineLabel: 'Not this year',
      declineNote: 'Nothing extra. She practises that weekend like any other.',
    },
  },

  {
    age: 13,
    kicker: 'She is thirteen',
    title: 'The junior tour opens at fourteen.',
    lede:
      'The club puts the calendar on the wall in January. Entry lists, ranking points, a whole ' +
      'year of it. She reads it like a timetable. Whether you go is not this year\'s question.',
    her: {
      cool: 'She knows which of the girls on the board are going.',
      warm: 'She knows which of the girls on the board are going, and when.',
    },
    coach: {
      cool: 'The coach will tell you what it looks like in the spring.',
      warm: 'The coach will tell you what it looks like in the spring.',
    },
    continueLabel: 'Wait for the coach',
    sameAsLastYear: true,
    // ⭐⭐⭐ THE LAST ASKING, AND IT IS HER – the end of the escalation the owner named («или она
    // сама»). Nobody mentions it to you this year; the date is already on the wall in her writing,
    // which is a harder question to say no to than either of the two before it. DRAFT.
    tournament: {
      lede: 'She has written the date of the Local Open on the kitchen calendar herself.',
      enterLabel: 'Put her name down',
      enterNote: 'An entry and a weekend, on top of the year.',
      declineLabel: 'Not this year',
      declineNote: 'Nothing extra. She practises that weekend like any other.',
    },
  },
]

/** ⭐ THE TWELFTH'S OTHER FACE. Not a tenth card and not a variant field: the same shape, declared
 *  beside the row it replaces, so swapping his copy into either arm is the same table edit as
 *  swapping it into any other card. Nine cards, ten scenes, one of which is never seen. */
export const TWELFTH_WANTS_MORE: PrologueCard = {
  age: 12,
  kicker: 'She is twelve',
  // ⚠⚠ THE ASK IS ON THE CARD NOW (owner, 02.09): «как будто и запроса не было, она не просила
  // год». The second answer is worded «the year she is asking for» and nothing above it said she
  // had asked for anything – she asked a QUESTION about other girls, which is not the same act. Two
  // ways to fix that, and this is the one that keeps his own answer labels: say what she asked for.
  title: 'She has asked you for more than she is getting.',
  lede:
    'She has started asking about the girls whose names are on the board at the club – where they ' +
    'went, and at what age. Then she asked you for the same thing they had: more hours, a better ' +
    'coach, a year built around it.',
  her: {
    // ⚠ NOT «She is asking for more than she has been given» any more: the title says she asked, so
    // this line would have been the card saying it twice. It says how big the ask is instead.
    cool: 'She is asking for a year bigger than any she has had.',
    warm: 'She has worked out what the next step is and she wants it.',
  },
  coach: {
    cool: 'The coach says she is asking the right question a little early.',
    warm: 'The coach has been waiting for her to ask.',
  },
  continueLabel: 'Go on',
  options: [
    {
      id: 'keep-the-size',
      label: 'Keep it the size it is',
      note: 'What you are paying now. She stays where she is for a year.',
      costCents: 2_400_00,
      share: 0.7,
      teaching: 0.6,
      focus: 'general',
    },
    {
      id: 'give-her-the-year',
      label: 'Give her the year she is asking for',
      // 6_000_00 / 2_400_00 = 2.5.
      note: 'About two and a half times what you pay now, for as long as it lasts.',
      costCents: 6_000_00,
      share: 1,
      teaching: 1,
      focus: 'rally',
    },
  ],
  // ⭐⭐ THE THIRD ASKING, ON THE FACE WHERE SHE IS THE ONE PUSHING – so on this face it is HER, a
  // year before the thirteenth's is. The escalation the owner named («тренер … или она сама») runs
  // through the FORK rather than around it: the childhood that carried her reaches her own asking
  // sooner, and the one that did not hears it from the coach for one more year. DRAFT.
  tournament: {
    lede: 'She wants to enter the Local Open in the spring. She asked twice, on two different days.',
    enterLabel: 'Put her name down',
    enterNote: 'An entry and a weekend, on top of the year.',
    declineLabel: 'Not this year',
    declineNote: 'Nothing extra. She practises that weekend like any other.',
  },
}

/** ⭐ WHY THE TWELFTH SAYS WHAT IT READ. A fork that simply arrives is a fork the player will read
 *  as a dice roll, which is the one thing §2.5 forbids it from being. So the card names the three
 *  facts it read – and they are the three the ruling itself names: «years of one-to-one against
 *  group, tournaments entered, whether any year was left light».
 *
 *  ⚠⚠ AND SINCE 02.09 IT IS ONE SENTENCE, NOT THREE LINES. The owner met the list and said «мне
 *  кажется вот это лишнее» – three short declaratives stacked under the scene («Most of those years
 *  she has had somebody to herself.» and its two neighbours) read as noise on a card that is
 *  otherwise prose. ⚠ THE FUNCTION IS NOT DROPPED WITH THE LIST, because the function is the whole
 *  reason the fork is not a die: the card still has to show what it read, or a derived fork is
 *  indistinguishable from a roll and §2.5's ruling is only true inside the code. So the same three
 *  clauses are FOLDED INTO ONE SENTENCE and rendered as a line of prose.
 *
 *  ⚠ THE CLAUSES ARE FRAGMENTS NOW, not sentences, and `sentence` below carries every character of
 *  punctuation that joins them – so replacing his copy, including the shape of the fold, is still a
 *  table edit and `run.ts` contributes no words of its own.
 *
 *  ⚠ DRAFT COPY, PICKED BY THE COUNTS AND NOT BY A DIE. `readTwelfth` supplies the counts; this
 *  table supplies the clause. */
export const TWELFTH_REASONS = {
  /** DRAFT – the fold. `{a}`, `{b}` and `{c}` are the three clauses below, in this order, and they
   *  are the ONLY things `run.ts` substitutes: every other character here is copy. */
  sentence: 'The years behind it: {a}, {b}, {c}.',
  oneToOne: {
    none: 'never a coach to herself',
    some: 'some of it one to one',
    most: 'most of it with somebody to herself',
  },
  tournaments: {
    none: 'nothing entered',
    some: 'one draw sheet with her name on it',
  },
  light: {
    none: 'and no year left to look after itself',
    some: 'and one year you kept light',
    many: 'and more than one year you kept light',
  },
} as const

// =================================================================================================
// ⭐⭐⭐ WHAT A CARD SHOWS ABOUT HER – the design question phase 1 handed to phase 2, and the answer
// is NOT NUMBERS.
// =================================================================================================
//
// Phase 1's spec closed §7 by naming the hole in as many words: «`childhoodWalk` returns the
// per-year arithmetic (coordination, habit, joy, quality, weight) but does NOT claim what a
// seven-year-old's serve number is on screen. That is a design question the spec has not answered.»
// This is the answer, and there are four arguments for it. The first is taste and the last is not.
//
//   1. IT IS NOT WHAT A PARENT HAS. At seven a parent does not read a serve rating. They see
//      whether she is enjoying it and whether the person teaching her thinks she is picking it up –
//      which is exactly `her` and `coach` above, and nothing else. The prologue's claim is that you
//      are the PARENT, not the coach and not the scout; a stat line on card three quietly makes you
//      the scout for the rest of the game.
//
//   2. THE ROSE IS THE HANDOVER'S PAYLOAD AND SPENDING IT EARLY COSTS THE HANDOVER. Build spec §5
//      calls the handover «the most important screen in the game» and its first item is the formed
//      radar. Nine numeric read-outs before it turn that reveal into a summary of nine things the
//      player has already seen, and turn nine cards into a stat screen on the way there.
//
//   3. THE FOG WOULD BE UNDONE BY THE BACK DOOR. §1d: the radar's fog is about the PRESENT – «how
//      wrong we might be about where she is». Nine honest per-year read-outs ARE a longitudinal
//      account of the present, told nine times with no fog on it at all. The screen that admits it
//      might be wrong cannot follow nine screens that never did.
//
//   4. ⚠ AND THE LOAD-BEARING ONE, WHICH IS ABOUT CORRECTNESS AND NOT TASTE: THERE IS NO HONEST
//      PER-YEAR NUMBER TO SHOW. `childhoodWalk`'s `level` is normalised against the median and
//      devoted childhoods over ALL NINE YEARS, so a year's `quality` only means anything once the
//      childhood is finished. A number rendered at seven off a partial walk would CHANGE ITS MEANING
//      at thirteen – the same value, a different scale – and there is no way to draw that honestly.
//      Phase 1 could have invented a per-year constant to make one exist; it explicitly refused
//      («inventing a constant for it here would have been phase 2 arriving early through the back
//      door»), and inventing it here would be the same mistake one phase later.
//
// ⚠ SO THE READ IS QUALITATIVE, AND IT IS STILL DERIVED – it is not decoration. The arm is chosen by
// what the player actually bought in the years before (`warmthAt` in run.ts), off the same counts
// the twelfth's fork reads. One mechanism, two consumers, no dice in either.

// =================================================================================================
// ⭐⭐⭐ THE LOCAL OPEN'S OWN SCENE – phase 11, and it is A ROW OF THIS TABLE LIKE EVERY OTHER SCENE
// =================================================================================================
//
// THE OWNER, on the age-10 card: «И как раз после этого экрана хотелось бы реально увидеть турнир,
// если игрок выбрал "участвовать", а не просто пролистать. В конце турнира либо победный арт, либо
// serious если в финал выбралась, либо грустный, если до финала не дошла.» And, later, the rhythm:
// «мы договаривались, что турниры в прологе тоже будут … надо с 10 лет по 1 хотя бы добавить в год,
// как в колледже.»
//
// ⚠⚠ EVERY SENTENCE BELOW IS A DRAFT AND HE HAS READ NONE OF IT, exactly like the nine cards above.
// It is here rather than in a component for the reason the whole table exists: replacing his copy is
// a data edit and nothing else. `PrologueLocalOpen.vue` renders `{{ }}` bindings off this and holds
// no sentence of its own, and the result scene is a `PrologueCard` – the SAME row shape the nine
// years use – so it goes through `PrologueCard.vue` unchanged and inherits its fit, its contrast and
// its painting for free.
//
// ⚠ THREE OUTCOMES AND NOT TWO, WHICH IS HIS SPLIT AND NOT A DESIGN OF MINE. `won` / `final` /
// `lost` are the three faces he named in one sentence, and the table is TOTAL over them – the same
// reason handover.ts keys its coach reads on the wire's own band union.
//
// ⚠ AND NOT ONE DIGIT REACHES IT. The nine cards are pinned digit-free (tests/component/
// prologue-walk.test.ts) and a result scene is not the place to start: the scoreline was on the
// screen the player just came off, and a card that repeats it in numbers is the stat screen §"what a
// card shows" exists to keep out.

/** WHAT ONE WEEKEND CAME TO, in the three faces the owner named. Declared HERE rather than beside
 *  the bracket because the copy table has to be total over it and because `art/prologue.ts` reads
 *  the same union for the face it hangs – one declaration, three consumers, nothing to keep in step.
 *
 *  ⚠ IT MAY NOT LIVE IN `pool.ts`: that module imports this one, so the arrow only points one way. */
export type LocalOpenOutcome = 'won' | 'final' | 'lost'

/** One result scene's words – the same five fields `PrologueCard` carries, minus the age, which is
 *  the year the weekend happened in. DRAFT, all of it. */
export interface LocalOpenResultCopy {
  readonly kicker: string
  readonly title: string
  readonly lede: string
  readonly her: string
  readonly coach: string
  readonly continueLabel: string
}

export const LOCAL_OPEN_COPY = {
  /** DRAFT – what the weekend is called, above her match. It is the age-10 card's own words for the
   *  thing («There is a Local Open in six weeks»), so the screen the player arrives on is named the
   *  same way the screen that sold it to them was. */
  kicker: 'The Local Open',

  /** DRAFT – the way on at the end of one of her matches. `MatchViewer` holds the press until it is
   *  pressed (`proceedLabel`), which is what stops a finished match ejecting the player. */
  proceed: 'Go on',

  /** ⭐ DRAFT – THE WAY PAST THE REST OF THE WEEKEND, and it is the ten-minute budget's own control.
   *  The viewer already ships a per-match escape («Skip to the result», MatchControls.vue) and that
   *  one is untouched; this is the one that leaves the whole draw at once, because a player who is
   *  not here for tennis should not have to press the other one three times a year for four years. */
  skipRest: 'Skip the rest of the weekend',

  /** ⭐⭐ THE THREE RESULT SCENES. DRAFT. The face each one hangs is NOT written here – it is
   *  `OUTCOME_FACES` in art/prologue.ts, which is art direction and not copy, the same split
   *  `PROLOGUE_FRAMES` is on the other side of.
   *
   *  ⚠⚠ THESE ARE DELIBERATELY THE SHORTEST SCENES IN THE PROLOGUE, AND THE REASON IS REPETITION.
   *  Each of the nine cards is read ONCE in a childhood; one of these three is read up to four
   *  times, and the same one twice over on a childhood that keeps going out early. A paragraph here
   *  is a paragraph four times.
   *
   *  ⚠ AND IT IS NOT ABOUT A CLOCK. THE OWNER: «Десять минут это ваша цифра … ничего не случится,
   *  если у нас будут турниры … это одна из основных частей игры вообще-то.» The ten-minute figure
   *  was ours, it was approximate, and the tournaments are not an interruption to be minimised.
   *  Nothing here was cut to protect a number – `tests/component/prologue-walk.test.ts` MEASURES the
   *  walk and prints it so he can see what he is shipping, and asserts only that the measurement is
   *  real. */
  result: {
    won: {
      kicker: 'The Local Open',
      title: 'She won it.',
      lede: 'Three matches on one weekend, and she is the last one still on the court.',
      her: 'She has not put the cup down since.',
      coach: 'The coach says the draw was small and she still had to win it.',
      continueLabel: 'Go on',
    },
    final: {
      kicker: 'The Local Open',
      title: 'She got to the final.',
      lede: 'Saturday, then Sunday morning, then one more match she did not win.',
      her: 'She wants to know when the next one is.',
      coach: 'The coach says the last one is the hard one.',
      continueLabel: 'Go on',
    },
    lost: {
      kicker: 'The Local Open',
      title: 'She went out before the final.',
      lede: 'A long drive, a court she had never seen, and it was over sooner than the journey.',
      her: 'She watched the girls who were still in it.',
      coach: 'The coach says the first one is never the one that counts.',
      continueLabel: 'Go on',
    },
  } as Readonly<Record<LocalOpenOutcome, LocalOpenResultCopy>>,
} as const

/** ⭐ THE RESULT SCENE AS A CARD ROW, so the shipped card component draws it with no branch of its
 *  own. `her` and `coach` are the same sentence in both arms deliberately, and it is the rule cards
 *  5..8 are written under: a scene may not claim to have read something it cannot have seen, and
 *  what this one has seen is a draw sheet, not nine years. */
export function localOpenCard(age: number, outcome: LocalOpenOutcome): PrologueCard {
  const copy = LOCAL_OPEN_COPY.result[outcome]
  return {
    age,
    kicker: copy.kicker,
    title: copy.title,
    lede: copy.lede,
    her: { cool: copy.her, warm: copy.her },
    coach: { cool: copy.coach, warm: copy.coach },
    continueLabel: copy.continueLabel,
  }
}

/** THE AGES THAT CARRY A DECISION – DERIVED FROM THE TABLE, never declared. `tests/prologue-cards
 *  .test.ts` pins it as the list [8, 9, 10, 11, 12], so giving a quiet card an `options` array
 *  reddens a test rather than quietly turning the prologue into a quiz. */
export const DECISION_AGES: readonly number[] = PROLOGUE_CARDS.filter((c) => c.options).map((c) => c.age)

/** The nine ages the table covers, 5..13. */
export const CARD_AGES: readonly number[] = PROLOGUE_CARDS.map((c) => c.age)

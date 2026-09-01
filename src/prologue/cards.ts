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
//   * NOT ONE PLAYER-FACING SENTENCE IS IN A `<template>`. `PrologueCard.vue` renders `{{ }}`
//     bindings off this table and holds no copy of its own – `tests/prologue-cards.test.ts` asserts
//     that the component's template contains no sentence at all, so a card's words can never leak
//     back into markup where changing them would mean editing a component.
//   * THE STRUCTURE IS UNIFORM ACROSS ALL NINE. A quiet card is a card with no `options`, not a
//     different kind of thing, so nothing downstream branches on which card it is drawing.
//   * THE COPY RULES ARE ENFORCED HERE RATHER THAN IN THE TEMPLATE. `template-copy-rules.test.ts`
//     reads `<template>` blocks, and none of these strings are in one, so the same three rules (no
//     Cyrillic, the short dash `–` only, the player is «you» and never «they») are re-asserted over
//     this table by `tests/prologue-cards.test.ts`. Moving copy out of the markup must not move it
//     out of the guard.
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

/** ONE YEAR AS THE MODEL SEES IT – the structural twin of `engine/childhood.ts`'s `ChildhoodYear`,
 *  declared here rather than imported for the reason in the header. The test asserts assignability
 *  in both directions, so this is a duplicate that cannot go stale. */
export interface PrologueYear {
  age: number
  /** how much tennis, 0 (none) .. 1 (as much as anyone does at any age) – ABSOLUTE, not relative to
   *  her age. That is phase 1's anti-grind mechanism and this table must not soften it. */
  practice: number
  /** who taught her, 0 (a parent on a municipal court) .. 1 (a club, where the coaches are) */
  teaching: number
  focus: SessionKind
}

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
  /** the decisions. ⚠ ABSENT on 5, 6, 7 and 13 – see the header. */
  readonly options?: readonly PrologueOption[]
  /** where the family is FROM (§2.4), and it is NOT a decision: build spec §3 lists card 5's
   *  decision as «none – the hook, and the family's origin», holding the two apart on purpose. It is
   *  the question the wizard used to ask, asked in the fiction instead. `DECISION_AGES` reads
   *  `options` alone, so this cannot creep into the count. */
  readonly origins?: readonly PrologueOption[]
}

// =================================================================================================
// THE TABLE
// =================================================================================================

export const PROLOGUE_CARDS: readonly PrologueCard[] = [
  {
    age: 5,
    kicker: 'She is five',
    title: 'She can barely hold it.',
    lede:
      'The racket is too big for her and she swings it like a shovel. She misses, and then she ' +
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
    share: 0.35,
    teaching: 0.1,
    focus: 'general',
    costCents: 0,
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
    title: 'She asks to go back.',
    lede:
      'Somebody handed her a racket at a summer session and she has asked about it every week ' +
      'since. There is a group at the municipal court on Tuesdays. It costs almost nothing and it ' +
      'is twenty minutes away.',
    her: { cool: 'She likes it. That is all you know.', warm: 'She likes it. That is all you know.' },
    coach: {
      cool: 'The man who runs the group learns her name in the second week.',
      warm: 'The man who runs the group learns her name in the second week.',
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
    lede:
      'Twice a week, eight children, one court. She is not the best of them and she has not ' +
      'noticed. A year goes by like this and none of it costs you anything you have to think about.',
    her: { cool: 'She still asks to go.', warm: 'She still asks to go.' },
    coach: {
      cool: 'He says she listens, and at seven he means it as a compliment.',
      warm: 'He says she listens, and at seven he means it as a compliment.',
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
      cool: 'He says she could do more than this group gives her.',
      warm: 'He says she could do more than this group gives her.',
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
        teaching: 0.35,
        focus: 'general',
      },
      {
        id: 'club',
        label: 'The club across town',
        note: 'About three times the municipal court, every month, and the drive on top.',
        costCents: 1_800_00,
        share: 0.85,
        teaching: 0.8,
        focus: 'general',
      },
    ],
  },

  {
    age: 9,
    kicker: 'She is nine',
    title: 'The group is full of eight-year-olds.',
    lede:
      'She is a year older than most of them and she spends a lot of it waiting her turn. An hour ' +
      'on her own with a coach is not a different amount of tennis. It is a different price.',
    her: {
      cool: 'She is doing what the group does and no more.',
      warm: 'She is one of the ones who stays behind afterwards.',
    },
    coach: {
      cool: 'He says she is fine. He says that about all of them.',
      warm: 'He wants her twice a week instead of once.',
    },
    continueLabel: 'Go on',
    options: [
      {
        id: 'group',
        label: 'Keep her in the group',
        note: 'The same money as this year. She waits her turn.',
        costCents: 1_800_00,
        share: 0.6,
        teaching: 0.45,
        focus: 'general',
      },
      {
        id: 'one-to-one',
        label: 'An hour a week, one to one',
        // 7_200_00 / 1_800_00 = 4.
        note: 'About four times the group, for the same hour of her week.',
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
      cool: 'He has not mentioned the tournament to you.',
      warm: 'He thinks she would not embarrass herself in a draw.',
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
        share: 0.75,
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
      cool: 'He says she has kept up. He does not say more than that.',
      warm: 'He says the ceiling on this is her week, not her hands.',
    },
    continueLabel: 'Go on',
    options: [
      {
        id: 'ordinary-school',
        label: 'Ordinary school',
        note: 'No change to what you pay. Her afternoons stay hers.',
        costCents: 2_400_00,
        share: 0.6,
        teaching: 0.5,
        focus: 'general',
      },
      {
        id: 'sports-school',
        label: 'The sports school',
        // 4_800_00 / 2_400_00 = 2.
        note: 'About twice the club, and it takes most of her week with it.',
        costCents: 4_800_00,
        share: 0.95,
        teaching: 0.85,
        focus: 'fitness',
      },
    ],
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
      'Three weeks of this now. There was no scene and she has not said anything. She simply ' +
      'finds something else to be doing at six o\'clock. The years behind it are not a mystery.',
    her: {
      cool: 'She has stopped talking about it at dinner.',
      warm: 'She is not tired of tennis. She is tired of this week.',
    },
    coach: {
      cool: 'He has seen it before and he is not surprised by it.',
      warm: 'He says she is not the first one to go quiet at twelve.',
    },
    continueLabel: 'Go on',
    options: [
      {
        id: 'let-her-stop',
        label: 'Let her stop for a season',
        note: 'A quarter of what this year was going to cost. She keeps her Thursdays.',
        costCents: 600_00,
        share: 0.35,
        teaching: 0.3,
        focus: 'general',
      },
      {
        id: 'finish-the-year',
        label: 'Ask her to finish the year',
        note: 'What you are paying now, for one more year of it.',
        costCents: 2_400_00,
        share: 0.75,
        teaching: 0.6,
        focus: 'general',
      },
    ],
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
      cool: 'He says he will tell you what he thinks in the spring.',
      warm: 'He says he will tell you what he thinks in the spring.',
    },
    continueLabel: 'Wait for the coach',
    sameAsLastYear: true,
  },
]

/** ⭐ THE TWELFTH'S OTHER FACE. Not a tenth card and not a variant field: the same shape, declared
 *  beside the row it replaces, so swapping his copy into either arm is the same table edit as
 *  swapping it into any other card. Nine cards, ten scenes, one of which is never seen. */
export const TWELFTH_WANTS_MORE: PrologueCard = {
  age: 12,
  kicker: 'She is twelve',
  title: 'She wants to know what happens if she is good.',
  lede:
    'She has started asking about the girls whose names are on the board at the club – where they ' +
    'went, and at what age. She is asking whether she could be one of them. The years behind it ' +
    'are not a mystery either.',
  her: {
    cool: 'She is asking for more than she has been given.',
    warm: 'She has worked out what the next step is and she wants it.',
  },
  coach: {
    cool: 'He says she is asking the right question a little early.',
    warm: 'He says he has been waiting for her to ask.',
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
      teaching: 0.95,
      focus: 'rally',
    },
  ],
}

/** ⭐ WHY THE TWELFTH SAYS WHAT IT READ. A fork that simply arrives is a fork the player will read
 *  as a dice roll, which is the one thing §2.5 forbids it from being. So the card names the three
 *  facts it read – and they are the three the ruling itself names: «years of one-to-one against
 *  group, tournaments entered, whether any year was left light».
 *
 *  ⚠ DRAFT COPY, PICKED BY THE COUNTS AND NOT BY A DIE. `readTwelfth` supplies the counts; this
 *  table supplies the clause. Replacing a sentence is still a table edit. */
export const TWELFTH_REASONS = {
  oneToOne: {
    none: 'She has never had a coach to herself.',
    some: 'Some of it, one to one.',
    most: 'Most of those years she has had somebody to herself.',
  },
  tournaments: {
    none: 'She has never entered anything.',
    some: 'One draw sheet with her name on it.',
  },
  light: {
    none: 'No year of it was left to look after itself.',
    some: 'One year you kept light.',
    many: 'More than one year you kept light.',
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

/** THE AGES THAT CARRY A DECISION – DERIVED FROM THE TABLE, never declared. `tests/prologue-cards
 *  .test.ts` pins it as the list [8, 9, 10, 11, 12], so giving a quiet card an `options` array
 *  reddens a test rather than quietly turning the prologue into a quiz. */
export const DECISION_AGES: readonly number[] = PROLOGUE_CARDS.filter((c) => c.options).map((c) => c.age)

/** The nine ages the table covers, 5..13. */
export const CARD_AGES: readonly number[] = PROLOGUE_CARDS.map((c) => c.age)

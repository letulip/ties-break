// ⭐⭐⭐ ROUND 41 #4 – THE COACH LINE LEARNS TO COUNT.
//
// THE OWNER, 12.09, playing his own build (his Russian is in docs/rounds/round-41.md, item 4, which
// is where it is allowed to live):
//
//   «В прологе проиграли первый турнир "The coach said the first one doesn't count", выиграли второй,
//    а потом снова вылетели в первом раунде 3го турнира, а фраза та же самая пишется, надо какой-то
//    каунтер завести для этих трех турниров может быть и сделать эти фразочки более соответствующими.
//    И в четвертом турнире пролога после вылета в полуфинале я тоже вижу "The coach says the first
//    one is never the one that counts." ту же самую фразу.»
//
// ⚠⚠ THAT IS TWO DEFECTS AND THEY NEED TWO FIXES, which is the whole shape of this file.
//   1. REPETITION – one string served all four weekends, so a third first-round exit was told it was
//      her first.
//   2. A WRONG READING, and it is the sharper one – `outcomeOf` collapses «out in the semifinal» and
//      «out in the first match» into one `lost` face, so a weekend she WON A MATCH at printed the
//      line about never having started. The face is right; the sentence was reading the face.
//
// ⚠ THE THREE LINES THAT WERE ALREADY RIGHT ARE UNTOUCHED AND STAY IN ONE PLACE. Invariant 4: a
// sentence this item did not ask about is not an agent's to rewrite, and the ordinal-one arms return
// `LOCAL_OPEN_COPY.result[...].coach` itself rather than a copy of it – asserted by identity below,
// so a second declaration of any of them reddens here.
//
// ⚠ MUTATION-VERIFIED (the table is in the round's ledger):
//   * `coachLineFor` collapsed to the old constant (every arm returning `result[outcome].coach`) ->
//     the owner's own four-weekend sequence reddens, naming the two lines that repeated.
//   * `finish >= rounds` replaced by `finish >= 3` -> the short-bracket arm reddens.
//   * `past[past.length - 1]` replaced by `past[0]` -> the «not a repeat» arm reddens.
//   * the `past.some(o => o.finish === 0)` title memory dropped -> the second-title arm reddens.
//   * `localOpenCard`'s `weekend` argument ignored -> the wiring arm reddens.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  LOCAL_OPEN_COPY,
  coachLineFor,
  localOpenCard,
  type LocalOpenFinish,
} from '../src/prologue/cards'
import { LOCAL_POOL, outcomeOf } from '../src/prologue/pool'

/** The bracket the shipped pool actually draws: eight children, so three rounds. Read rather than
 *  typed, so a pool that changes size changes this file's arithmetic with it. */
const ROUNDS = Math.log2(LOCAL_POOL.size)

/** The four shapes a weekend can have, named by what happened rather than by an index. */
const TITLE = 0
const FINAL = 1
const SEMI = ROUNDS - 1
const OUT_FIRST = ROUNDS

const AGAIN = LOCAL_OPEN_COPY.coachAgain
const weekend = (finish: number, rounds: number = ROUNDS): LocalOpenFinish => ({ finish, rounds })

describe('⭐⭐⭐ item 4 – which sentence the coach says, and it is a function of what has happened', () => {
  // ⭐⭐⭐ THE WHOLE MATRIX, AS A TABLE. Ten sentences, three of them the ones that already shipped.
  const CASES: readonly { name: string; ordinal: number; finish: number; past: LocalOpenFinish[]; line: string }[] = [
    // --- her first weekend: the three that were already right ------------------------------------
    { name: 'the first one, won', ordinal: 1, finish: TITLE, past: [], line: LOCAL_OPEN_COPY.result.won.coach },
    { name: 'the first one, a final', ordinal: 1, finish: FINAL, past: [], line: LOCAL_OPEN_COPY.result.final.coach },
    {
      name: 'the first one, out in her first match – HIS OWN FIRST TOURNAMENT',
      ordinal: 1,
      finish: OUT_FIRST,
      past: [],
      line: LOCAL_OPEN_COPY.result.lost.coach,
    },
    // --- ...and the reading that was wrong even on a first weekend --------------------------------
    {
      name: 'the first one, out in the semifinal – the line that used to say she never started',
      ordinal: 1,
      finish: SEMI,
      past: [],
      line: AGAIN.pastFirstOnce,
    },
    // --- after that, the count matters -----------------------------------------------------------
    {
      name: 'a title, and it is her first',
      ordinal: 3,
      finish: TITLE,
      past: [weekend(OUT_FIRST), weekend(SEMI)],
      line: AGAIN.firstTitle,
    },
    {
      name: 'a title, and she has won one before',
      ordinal: 4,
      finish: TITLE,
      past: [weekend(OUT_FIRST), weekend(TITLE), weekend(SEMI)],
      line: AGAIN.wonBefore,
    },
    { name: 'a final, and not her first weekend', ordinal: 2, finish: FINAL, past: [weekend(OUT_FIRST)], line: AGAIN.finalAgain },
    {
      name: 'out in her first match, and so was the one before – HIS OWN THIRD TOURNAMENT',
      ordinal: 3,
      finish: OUT_FIRST,
      past: [weekend(SEMI), weekend(OUT_FIRST)],
      line: AGAIN.outFirstAgain,
    },
    {
      name: 'out in her first match, after a weekend that went further',
      ordinal: 3,
      finish: OUT_FIRST,
      past: [weekend(OUT_FIRST), weekend(TITLE)],
      line: AGAIN.outFirst,
    },
    {
      name: 'out in the semifinal, and not her first – HIS OWN FOURTH TOURNAMENT',
      ordinal: 4,
      finish: SEMI,
      past: [weekend(OUT_FIRST), weekend(TITLE), weekend(OUT_FIRST)],
      line: AGAIN.pastFirst,
    },
  ]

  it('⭐⭐⭐ every shape of weekend has its own sentence', () => {
    for (const c of CASES) {
      expect(coachLineFor(c.ordinal, c.finish, ROUNDS, c.past), c.name).toBe(c.line)
    }
  })

  // ⚠ AND THE TABLE COVERS THE WHOLE FUNCTION – every sentence the module declares is reachable, so
  // a line nobody can ever meet cannot sit in the copy table looking shipped.
  it('⚠ every line in the table is reachable, and no two cases share one', () => {
    const said = new Set(CASES.map((c) => c.line))
    expect(said.size, 'two rows of the matrix print the same sentence').toBe(CASES.length)
    for (const [key, line] of Object.entries(AGAIN)) {
      expect(said.has(line), `nothing can ever print coachAgain.${key}`).toBe(true)
    }
  })

  // ⭐⭐⭐ HIS OWN CHILDHOOD, IN ORDER: lost the first, won the second, out in the first round of the
  // third, out in the semifinal of the fourth. That is the sequence he reported, and the defect is
  // that it printed ONE sentence. Four weekends, four different sentences – and the fourth is not
  // the first, which is the line he quoted twice.
  it('⭐⭐⭐ the four weekends he played print four different sentences', () => {
    const played: LocalOpenFinish[] = [weekend(OUT_FIRST), weekend(TITLE), weekend(OUT_FIRST), weekend(SEMI)]
    const said = played.map((w, i) => coachLineFor(i + 1, w.finish, w.rounds, played.slice(0, i)))
    expect(new Set(said).size, `the coach said the same thing twice: ${said.join(' | ')}`).toBe(4)
    expect(said[0], 'the first weekend stopped saying the sentence that was right').toBe(
      LOCAL_OPEN_COPY.result.lost.coach,
    )
    expect(said[3], 'the fourth weekend still prints the first weekend`s line').not.toBe(said[0])
    // ⚠ AND THE SEMIFINAL IS NOT TOLD IT WENT OUT IN THE FIRST ROUND, which is the reading half of
    // his report and the one no amount of counting would have fixed on its own.
    expect(said[3]).toBe(AGAIN.pastFirst)
  })

  // ⚠⚠ THE BRACKET'S DEPTH IS READ, NOT ASSUMED. `playLocalOpen` takes `rounds` off the bracket that
  // was ACTUALLY played rather than off `LOCAL_POOL.size`, because a pool too small to fill the draw
  // makes the two disagree – and a coach line that hard-coded three would then tell a girl who lost
  // the only match she played that she had reached a semifinal.
  it('⚠⚠ «out in her first match» follows the bracket, not the number three', () => {
    expect(coachLineFor(1, 2, 2, []), 'a two-round bracket`s first-match exit').toBe(LOCAL_OPEN_COPY.result.lost.coach)
    expect(coachLineFor(1, 2, 3, []), 'a three-round bracket`s semifinal exit').toBe(AGAIN.pastFirstOnce)
    expect(coachLineFor(1, 4, 4, []), 'a four-round bracket`s first-match exit').toBe(LOCAL_OPEN_COPY.result.lost.coach)
    expect(coachLineFor(1, 2, 4, []), 'a four-round bracket`s quarterfinal exit').toBe(AGAIN.pastFirstOnce)
  })

  // ⚠ THE REPEAT IS THE WEEKEND IMMEDIATELY BEFORE THIS ONE AND NOT «ANY OF THEM», which is the
  // smallest memory «the coach neither panics nor repeats himself» needs. A first-round exit two
  // years ago, with a title in between, is not a run of bad weekends.
  it('⚠ the repeat line reads the LAST weekend, not the oldest', () => {
    const older: LocalOpenFinish[] = [weekend(OUT_FIRST), weekend(TITLE)]
    expect(coachLineFor(3, OUT_FIRST, ROUNDS, older), 'an old first-round exit counted as a repeat').toBe(AGAIN.outFirst)
    const adjacent: LocalOpenFinish[] = [weekend(TITLE), weekend(OUT_FIRST)]
    expect(coachLineFor(3, OUT_FIRST, ROUNDS, adjacent), 'two in a row did not read as two in a row').toBe(
      AGAIN.outFirstAgain,
    )
  })

  // ⚠⚠ DETERMINISTIC BY CONSTRUCTION, AND THE FILE IS ASSERTED TO HOLD NO GENERATOR AT ALL. Invariant
  // 2's own test: the same inputs give the same sentence, and there is nothing in this module that
  // could make them not.
  it('⚠⚠ the same weekend always says the same thing, and cards.ts holds no dice', () => {
    const past = [weekend(OUT_FIRST), weekend(TITLE)]
    const once = coachLineFor(3, SEMI, ROUNDS, past)
    for (let i = 0; i < 50; i++) expect(coachLineFor(3, SEMI, ROUNDS, past)).toBe(once)

    const source = readFileSync(new URL('../src/prologue/cards.ts', import.meta.url), 'utf8')
    for (const forbidden of ['Math.random', 'rngFromSeed', 'new Date(']) {
      expect(source.includes(forbidden), `cards.ts reaches for ${forbidden}`).toBe(false)
    }
  })

  // ⚠ AND THE ORDINAL-ONE ARMS RETURN THE SHIPPED STRING ITSELF rather than a copy of it, which is
  // what keeps invariant 4 cheap: there is one declaration of each, so the owner's edit lands
  // everywhere it is said. MUTATION: paste any of the three into `coachAgain` and return that
  // instead -> this reddens on identity while every arm above stays green.
  it('⚠ the three sentences that were already right are not copied anywhere', () => {
    const kept = [LOCAL_OPEN_COPY.result.won.coach, LOCAL_OPEN_COPY.result.final.coach, LOCAL_OPEN_COPY.result.lost.coach]
    for (const [key, line] of Object.entries(AGAIN)) {
      expect(kept.includes(line), `coachAgain.${key} is a second copy of a line that already exists`).toBe(false)
    }
  })
})

describe('⭐⭐ item 4 – the scene the container builds', () => {
  // ⚠ THE HOOK ARRIVES AS ONE ARGUMENT AT ONE CALL SITE (phase 7's own words), and WITHOUT it the
  // card is byte-identical to what shipped – which is what leaves every existing caller untouched.
  it('⚠ a result scene with no counter is exactly the card that shipped', () => {
    for (const outcome of ['won', 'final', 'lost'] as const) {
      const card = localOpenCard(10, outcome)
      expect(card.coach.cool, outcome).toBe(LOCAL_OPEN_COPY.result[outcome].coach)
      expect(card.coach.warm, outcome).toBe(LOCAL_OPEN_COPY.result[outcome].coach)
      expect(card.title, outcome).toBe(LOCAL_OPEN_COPY.result[outcome].title)
    }
  })

  // ⭐⭐ ...and WITH it the scene says what the weekend was. Built the way the container builds it –
  // the outcome off `outcomeOf`, the sentence off `finish` – so this is the two halves disagreeing
  // on purpose: the PAINTING is «she went out before the final» and the SENTENCE is «she won one
  // first», which is exactly the pair the owner's semifinal needed.
  it('⭐⭐ a counted scene keeps the outcome`s face and takes the finish`s sentence', () => {
    // ⚠ THE CAST IS SCOPED TO THIS LINE AND IS NAMED: `outcomeOf` reads `open.finish` and nothing
    // else (pool.ts – «IT IS READ OFF `finish`, WHICH IS AN INDEX AND NOT A PRIZE»), so assembling a
    // whole bracket here would be three fields of ceremony to feed one read.
    const outcome = outcomeOf({ finish: SEMI } as unknown as Parameters<typeof outcomeOf>[0])
    expect(outcome, 'a semifinal exit stopped being the `lost` face').toBe('lost')
    const card = localOpenCard(12, outcome, false, { ordinal: 1, finish: SEMI, rounds: ROUNDS, past: [] })
    expect(card.title, 'the scene stopped being the one the bracket chose').toBe(LOCAL_OPEN_COPY.result.lost.title)
    expect(card.coach.cool, 'the semifinal is still told it never started').toBe(AGAIN.pastFirstOnce)
    expect(card.coach.cool).toBe(card.coach.warm)
  })

  // ⚠⚠ AND THE HURT FACE COUNTS NOTHING, because there is nothing to count: `PlayedOpen` holds no
  // injury and this item did not add one, so a weekend she left early keeps its own scene and its
  // own sentence whatever the ordinal is.
  it('⚠⚠ the scene after she goes off hurt is untouched by the counter', () => {
    const counted = localOpenCard(12, 'lost', true, { ordinal: 4, finish: SEMI, rounds: ROUNDS, past: [weekend(TITLE)] })
    expect(counted.coach.cool).toBe(LOCAL_OPEN_COPY.hurt.coach)
    expect(counted.title).toBe(LOCAL_OPEN_COPY.hurt.title)
    expect(counted.continueLabel).toBe(LOCAL_OPEN_COPY.hurt.continueLabel)
  })
})

// =================================================================================================
describe('⚠ the copy rules hold over the seven new sentences', () => {
  // ⚠ THE GUARDS THIS TABLE HAS TO PASS ARE THE ONES `tests/prologue-cards.test.ts` states over the
  // nine cards: no Cyrillic, the short dash only, and the player is «you». They are re-asserted here
  // because that file's sweep walks `PROLOGUE_CARDS` and these lines are not on a card row – a copy
  // field no sweep enumerates is a copy field outside the rules.
  const lines = Object.entries(AGAIN)

  it('no Cyrillic in a player-facing string', () => {
    expect(lines.filter(([, t]) => /[А-Яа-яЁё]/.test(t)).map(([k]) => k)).toEqual([])
  })

  it('the short dash – only, never the long one', () => {
    expect(lines.filter(([, t]) => t.includes('—')).map(([k]) => k)).toEqual([])
  })

  it('the player owns things in the second person', () => {
    const FORBIDDEN = [/\bthey own\b/i, /\bthey bought\b/i, /\bwhat they own\b/i]
    expect(lines.filter(([, t]) => FORBIDDEN.some((re) => re.test(t))).map(([k]) => k)).toEqual([])
  })

  // ⚠ R15-7, RESTATED WHERE IT BITES: the person teaching her is UNNAMED and never gendered.
  // `tests/coach-voice.test.ts` sweeps `src/**` for this already; naming it here is what makes the
  // failure say WHICH line rather than which file.
  it('⚠ the coach is unnamed and never gendered', () => {
    const HE = /\b(he|him|his|himself)\b/i
    expect(lines.filter(([, t]) => HE.test(t)).map(([k]) => k)).toEqual([])
  })

  // ⚠⚠ AND NOT ONE OF THEM CARRIES A NUMBER, which is this item's own constraint rather than the
  // walk's. `prologue-walk.test.ts` bans digits from the nine cards; these sentences could not carry
  // a digit OR a spelled count, because the only counts available are her wins – and `rounds` is read
  // off the bracket that was played, so «she won two» is true until a short pool makes it false.
  it('⚠⚠ no line counts her matches, in digits or in words', () => {
    const COUNTS = /\d|\b(one match|two|three|four|twice|three times)\b/i
    expect(lines.filter(([, t]) => COUNTS.test(t)).map(([k]) => k)).toEqual([])
  })

  // ⚠ THE VOICE IS THE SCENE'S OWN: every one of them is the coach speaking, and every one is a
  // single sentence – «these are DELIBERATELY the shortest scenes in the prologue» (cards.ts), and
  // one of them is read up to four times in a childhood.
  it('⚠ one sentence each, in the register the three already-shipped lines set', () => {
    for (const [key, text] of lines) {
      expect(text.startsWith('The coach says'), `coachAgain.${key} is not the coach speaking`).toBe(true)
      expect(text.endsWith('.'), `coachAgain.${key} does not end as a sentence`).toBe(true)
      expect(text.slice(0, -1).includes('.'), `coachAgain.${key} is more than one sentence`).toBe(false)
      expect(text.length, `coachAgain.${key} is longer than any line it sits beside`).toBeLessThanOrEqual(
        Math.max(...Object.values(LOCAL_OPEN_COPY.result).map((r) => r.coach.length)) + 24,
      )
    }
  })
})

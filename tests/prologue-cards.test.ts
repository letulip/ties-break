// THE NINE CARDS AS DATA – phase 2 of docs/specs/childhood-prologue-build-2026-09.md.
//
// ⚠ THIS FILE IS ALSO THE JOIN. `src/prologue/*` may not import `engine/childhood.ts` – phase 1
// pins that module's importer set as EMPTY and phase 4 moves it to exactly `['engine/world.ts']` –
// so the table declares its own `PrologueYear` and its own copy of `appetiteAt`. Both duplicates
// are checked HERE against the real thing: the years go through the real `childhoodWalk`, and the
// assignment below type-checks under `vue-tsc`, so neither can drift without a red gate.
//
// ⚠ MUTATION-VERIFIED. Every block was watched failing before it was believed – the mutation is
// named beside the claim it breaks.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
// ⚠ THE MARKER HELPERS, NEVER A RAW `indexOf` SLICE. CLAUDE.md's gotcha and `npm run pins:check`:
// `slice(indexOf(a), indexOf(b))` does not fail when a marker rots, it silently WIDENS to almost the
// whole file and the pin stays green. `regionToLast` throws instead. `scriptCodeOf` strips JS
// comments and leaves the file's own prose out of the code pins below.
import { regionToLast, scriptCodeOf } from './helpers/source'
import { appetiteAt, childhoodWalk, medianChildhood, type ChildhoodYear } from '../src/engine/childhood'
import { ECONOMY } from '../src/engine/economy'
import {
  APPETITE_AT,
  CARD_AGES,
  DECISION_AGES,
  PROLOGUE_CARDS,
  TWELFTH_REASONS,
  TWELFTH_WANTS_MORE,
  type PrologueCard,
  type PrologueOption,
  type PrologueYear,
} from '../src/prologue/cards'
import {
  EMPTY_RUN,
  cardFor,
  chosenYears,
  isComplete,
  originStartCents,
  pickAt,
  readTwelfth,
  spentCents,
  warmthAt,
  withOrigin,
  withPick,
  type PrologueRun,
} from '../src/prologue/run'

const CARDS_SRC = readFileSync(new URL('../src/prologue/cards.ts', import.meta.url), 'utf8')
const RUN_SRC = readFileSync(new URL('../src/prologue/run.ts', import.meta.url), 'utf8')
const COMPONENT_SRC = readFileSync(new URL('../src/components/PrologueCard.vue', import.meta.url), 'utf8')

/** Every scene the table can draw – the nine rows plus the twelfth's other face. */
const ALL_SCENES: readonly PrologueCard[] = [...PROLOGUE_CARDS, TWELFTH_WANTS_MORE]

/** Every player-facing string in the table, with a path so a failure names the offender. */
function everySentence(): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = []
  for (const c of ALL_SCENES) {
    const face = c.age === 12 && c === TWELFTH_WANTS_MORE ? '12/wants-more' : String(c.age)
    out.push({ where: `${face}.kicker`, text: c.kicker })
    out.push({ where: `${face}.title`, text: c.title })
    out.push({ where: `${face}.lede`, text: c.lede })
    out.push({ where: `${face}.her.cool`, text: c.her.cool })
    out.push({ where: `${face}.her.warm`, text: c.her.warm })
    out.push({ where: `${face}.coach.cool`, text: c.coach.cool })
    out.push({ where: `${face}.coach.warm`, text: c.coach.warm })
    out.push({ where: `${face}.continueLabel`, text: c.continueLabel })
    // ⚠ THE QUESTION IS SWEPT LIKE EVERY OTHER SENTENCE (owner, 02.09). A copy field that the sweep
    // does not enumerate is a copy field outside the three rules, which is exactly what moving the
    // words out of the markup was not allowed to cost.
    if (c.question) out.push({ where: `${face}.question`, text: c.question })
    for (const o of [...(c.origins ?? []), ...(c.options ?? [])]) {
      out.push({ where: `${face}.${o.id}.label`, text: o.label })
      out.push({ where: `${face}.${o.id}.note`, text: o.note })
    }
  }
  // ⚠ AND SO IS THE FORK'S FOLDED SENTENCE, which is not on a card row and would otherwise be the
  // one player-facing string in this module nothing checked.
  out.push({ where: '12.reason.sentence', text: TWELFTH_REASONS.sentence })
  for (const [group, clauses] of Object.entries(TWELFTH_REASONS)) {
    if (typeof clauses === 'string') continue
    for (const [key, text] of Object.entries(clauses)) out.push({ where: `12.reason.${group}.${key}`, text })
  }
  return out
}

/** A run with every answer in it. `picks` names only the decision ages. */
function runOf(picks: Record<number, string>, origin: 'working' | 'middle' | 'wealthy' = 'middle'): PrologueRun {
  let run = withOrigin(EMPTY_RUN, origin)
  for (const [age, id] of Object.entries(picks)) run = withPick(run, Number(age), id)
  return run
}

/** The two ends of the table, and a middle. The twelfth's id depends on which face the run reaches,
 *  so these are built through `cardFor` rather than by naming an id that may not exist on the face
 *  the run actually gets. */
function finish(run: PrologueRun, take: 'light' | 'heavy'): PrologueRun {
  const twelfth = cardFor(12, run)
  const options = twelfth.options ?? []
  const byShare = [...options].sort((a, b) => (a.share ?? 0) - (b.share ?? 0))
  const chosen = take === 'light' ? byShare[0] : byShare[byShare.length - 1]
  return withPick(run, 12, chosen.id)
}

const LIGHT_ROAD = { 8: 'municipal', 9: 'group', 10: 'stay-home', 11: 'ordinary-school' }
const CARRIED_ROAD = { 8: 'club', 9: 'one-to-one', 10: 'enter', 11: 'sports-school' }
const MIDDLE_ROAD = { 8: 'club', 9: 'group', 10: 'enter', 11: 'ordinary-school' }

// =================================================================================================
describe('the table is nine rows, and four of them are quiet', () => {
  it('runs 5..13, one row an age', () => {
    expect(PROLOGUE_CARDS).toHaveLength(9)
    expect(CARD_AGES).toEqual([5, 6, 7, 8, 9, 10, 11, 12, 13])
  })

  // ⭐⭐ THE ACCEPTANCE CRITERION, AND IT IS A LIST SO ADDING A DECISION REDDENS IT.
  // His count (§3): «может тогда больше без решений, 3 или 4?» – nine consecutive choices is not
  // ten minutes, it is a quiz. `DECISION_AGES` is DERIVED from the table (`filter(c => c.options)`),
  // so this fails the moment somebody gives a quiet card an answer to pick.
  // MUTATION: give card 7 a two-option array -> red, naming 7.
  it('⭐ exactly five cards carry a decision – 8, 9, 10, 11, 12', () => {
    expect(DECISION_AGES).toEqual([8, 9, 10, 11, 12])
  })

  // MUTATION: drop `sameAsLastYear` from 13 and give it options -> red here and on the list above.
  it('⭐ and the four quiet ones are 5, 6, 7 and 13 – no options on any of them', () => {
    const quiet = PROLOGUE_CARDS.filter((c) => !c.options).map((c) => c.age)
    expect(quiet).toEqual([5, 6, 7, 13])
    for (const age of quiet) {
      expect(cardFor(age, EMPTY_RUN).options, `age ${age} carries no decision`).toBeUndefined()
      expect(cardFor(age, EMPTY_RUN).continueLabel.length, `age ${age} has a way on`).toBeGreaterThan(0)
    }
  })

  // ⚠ THE ORIGIN IS NOT A DECISION, and the spec holds the two apart on purpose: §3 lists card 5's
  // decision as «none – the hook, and the family's origin (§2.4)». It is the question the wizard
  // used to ask, asked in the fiction. MUTATION: rename `origins` to `options` on card 5 -> the list
  // above goes red with a 5 in it, which is the whole point of reading `options` alone.
  it('card 5 asks where the family is from, and that is not one of the five decisions', () => {
    const five = PROLOGUE_CARDS[0]
    expect(five.options).toBeUndefined()
    expect(five.origins?.map((o) => o.id)).toEqual(['working', 'middle', 'wealthy'])
    expect(DECISION_AGES).not.toContain(5)
  })

  // =============================================================================================
  // ⭐⭐⭐ THE OWNER'S 02.09 READING PASS – «давай будем более фактичными и менее интерпретативны
  // для игрока». He walked the ten scenes and, five times, could not tell what a sentence was
  // pointing at. Each of the five is pinned by name below, so the vague form cannot come back as
  // somebody's tidy-up. They are pins on THE DRAFT and they move with his copy when he replaces it;
  // what they are here to stop is a sentence going back to naming nothing.
  // =============================================================================================

  // ⚠ «у нас есть 3 выбора перед игроком, и вообще непонятно к чему они, потому что вопроса нет».
  // MUTATION: delete `question` from card 5 -> red.
  it('⭐ a card that offers answers asks a question – the five does, and it is the only one that has to', () => {
    const five = PROLOGUE_CARDS[0]
    expect(five.question, 'the three origins arrive with nothing asking for them').toBeTruthy()
    expect(five.question).toContain('?')
    // ...and the eight through twelve do not need one, because their title IS the question. What
    // this asserts is that nobody has quietly added a second voice to every card.
    for (const c of ALL_SCENES.filter((x) => x.age !== 5)) {
      expect(c.question, `age ${c.age} grew a question of its own`).toBeUndefined()
    }
  })

  // ⚠⚠ «She is a year older than most of them – это мы из даты рождения берем или как?» THE ANSWER
  // IS NO, AND THAT IS WHY THE CLAIM IS GONE. The prologue's nine ages are the fixed list 5..13 for
  // every career (`CARD_AGES` above), the birthday collected on the five reaches only the profile,
  // and no card, run or engine call anywhere models the ages of the other children in her group.
  // The sentence was a FIXED string dressed as a derived one – so it either had to become derived
  // or stop being said, and there is nothing to derive it from.
  // MUTATION: put the sentence back on card 9 -> red, naming it.
  it('⭐⭐ no card claims her age RELATIVE to anyone – there is no birthday arithmetic behind it', () => {
    const offenders = everySentence()
      .filter((x) => /\b(a year|years?) (older|younger)\b/i.test(x.text) || /older than (most|any|the)/i.test(x.text))
      .map((x) => `${x.where}: ${x.text.slice(0, 70)}`)
    expect(offenders, 'a card is claiming a relative age the game does not compute').toEqual([])
  })

  // ⚠ THE THREE SENTENCES HE COULD NOT PARSE, each pinned as «the thing is named».
  // MUTATION: revert any one of the three -> red on that line.
  it('⭐ the sentences he asked «what?» and «where?» of now name the thing', () => {
    const five = PROLOGUE_CARDS[0]
    const six = PROLOGUE_CARDS[1]
    const seven = PROLOGUE_CARDS[2]
    // «хочется спросить "что она еле держит"… если здесь речь о ракетке, то так и напишем»
    expect(five.title).toContain('racket')
    // «She asks to go back – куда обратно?… Я бы интерпретировал из заголовка, что она хочет домой»
    expect(six.title).toContain('court')
    expect(six.title).not.toBe('She asks to go back.')
    // «she has not noticed – чего она не заметила?»
    expect(seven.lede).toContain('has not noticed that she is not')
  })

  // ⚠ «как будто и запроса не было, она не просила год» – the wants-more face offers «the year she
  // is asking for» and nothing above it used to say she had asked for anything.
  // MUTATION: drop the ask from the lede -> red.
  it('⭐ the twelfth only offers her «the year she is asking for» on a card where she asks for it', () => {
    const asks = /\bask(s|ed)?\b/
    const offers = TWELFTH_WANTS_MORE.options?.filter((o) => /asking for/.test(o.label)) ?? []
    expect(offers.length, 'the answer that names her ask').toBeGreaterThan(0)
    expect(
      asks.test(TWELFTH_WANTS_MORE.title) || asks.test(TWELFTH_WANTS_MORE.lede),
      'an answer names an ask the card never reports',
    ).toBe(true)
    expect(TWELFTH_WANTS_MORE.lede).toContain('asked you')
  })

  // ⭐ THE FORK IS A SECOND FACE OF ONE ROW, not a tenth card: nine cards, ten scenes.
  it('the twelfth has two faces and the table still has nine rows', () => {
    expect(TWELFTH_WANTS_MORE.age).toBe(12)
    expect(PROLOGUE_CARDS.filter((c) => c.age === 12)).toHaveLength(1)
    expect(TWELFTH_WANTS_MORE.title).not.toBe(PROLOGUE_CARDS[7].title)
    expect(TWELFTH_WANTS_MORE.options).toHaveLength(2)
  })
})

// =================================================================================================
describe('⭐ what a card shows about her – and it is never a number', () => {
  // ⭐⭐ THE DESIGN ANSWER, ASSERTED. The argument is in cards.ts's «what a card shows» note: the
  // rose is the HANDOVER's payload (§5), the fog is about the present (§1d), and – the load-bearing
  // one – `childhoodWalk`'s level is normalised over ALL NINE YEARS, so there is no honest per-year
  // number to draw at seven in the first place.
  // MUTATION: put `coordination` on any card as a percentage -> red, naming the string.
  it('not one sentence in the table contains a digit, at any age, on either face', () => {
    const offenders = everySentence()
      .filter((s) => /\d/.test(s.text))
      .map((s) => `${s.where}: ${s.text.slice(0, 70)}`)
    expect(offenders).toEqual([])
  })

  // MUTATION: put `$8,000` in an origin note -> red.
  it('...and no money reaches a card either – the total surfaces once, on the handover (§2.4)', () => {
    const offenders = everySentence()
      .filter((s) => s.text.includes('$') || /\bdollars?\b/i.test(s.text))
      .map((s) => `${s.where}: ${s.text.slice(0, 70)}`)
    expect(offenders).toEqual([])
  })

  it('every card shows two reads – her, and the person teaching her', () => {
    for (const c of ALL_SCENES) {
      expect(c.her.cool.length, `age ${c.age} says something about her`).toBeGreaterThan(0)
      expect(c.coach.cool.length, `age ${c.age} says what the coach makes of it`).toBeGreaterThan(0)
    }
  })

  // ⭐ A CARD MAY NOT REPORT A YEAR THE PLAYER HAS NOT LIVED. Nothing has been chosen before cards
  // 5, 6, 7 and 8 – the first decision is at 8 and its consequence lands at 9 – so their two arms
  // are deliberately the same sentence, and from 9 they differ because there is something to differ
  // on. MUTATION: write two different sentences on card 6 -> red on the first arm.
  it('cards 5..8 read the same either way, and 9..13 do not', () => {
    for (const c of ALL_SCENES) {
      const differs = c.her.cool !== c.her.warm || c.coach.cool !== c.coach.warm
      if (c.age <= 8) expect(differs, `age ${c.age} claims to have read a year that has not happened`).toBe(false)
      else expect(differs, `age ${c.age} reads the same whatever the player did`).toBe(true)
    }
  })

  // The selector is real, not a constant: the light road never earns a warm arm and the carried road
  // does. MUTATION: `return 'warm'` in `warmthAt` -> red on the light road.
  it('the arm is earned – the light road stays cool, the carried road turns warm', () => {
    const light = runOf(LIGHT_ROAD)
    const carried = runOf(CARRIED_ROAD)
    expect(warmthAt(9, light)).toBe('cool')
    expect(warmthAt(9, carried)).toBe('warm')
    expect(warmthAt(13, light)).toBe('cool')
    expect(warmthAt(13, carried)).toBe('warm')
    // ...and it is unobservable before the first decision lands, which is why 5..8 read the same.
    expect(warmthAt(5, carried)).toBe(warmthAt(5, light))
  })
})

// =================================================================================================
describe('⚠ the copy rules hold over the table, which is where the copy now lives', () => {
  // ⚠ THE GUARD HAD TO MOVE WITH THE COPY. `tests/template-copy-rules.test.ts` reads `<template>`
  // blocks; none of these strings are in one, so moving the words into a table would have moved them
  // out of the only guard that watches them. The three rules are re-asserted here on the table.
  it('no Cyrillic in a player-facing string', () => {
    const offenders = everySentence().filter((s) => /[А-Яа-яЁё]/.test(s.text)).map((s) => s.where)
    expect(offenders).toEqual([])
  })

  it('the short dash – only, never the long one', () => {
    const offenders = everySentence().filter((s) => s.text.includes('—')).map((s) => s.where)
    expect(offenders).toEqual([])
  })

  // The template arm that landed on 01.09: the player is «you», never «they».
  it('the player owns things in the second person', () => {
    const FORBIDDEN = [/\bthey own\b/i, /\bthey bought\b/i, /\bwhat they own\b/i]
    const offenders = everySentence()
      .filter((s) => FORBIDDEN.some((re) => re.test(s.text)))
      .map((s) => `${s.where}: ${s.text.slice(0, 70)}`)
    expect(offenders).toEqual([])
  })

  // ⭐⭐ AND THIS IS WHAT MAKES «replacing his copy is a table edit» LITERALLY TRUE. If a sentence
  // could live in the component, replacing it would mean editing markup. MUTATION: put the age-5
  // title into the template as a literal -> red.
  // The template is allowed the words it needs to be markup – tag names, class names, bindings – so
  // the check is for PROSE: a run of three or more words in a row between tags.
  it('the component holds no copy of its own – every sentence comes from the table', () => {
    const template = regionToLast(COMPONENT_SRC, '<template>', '</template>')
    const bare = template.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]*>/g, '\n')
    const prose = bare
      .split('\n')
      .map((line) => line.replace(/\{\{[^}]*\}\}/g, ' ').trim())
      .filter((line) => line.split(/\s+/).filter(Boolean).length >= 3)
    expect(prose).toEqual([])
  })

  it('...and the scan is real – it can see the template and the table', () => {
    expect(COMPONENT_SRC).toContain('<template>')
    expect(everySentence().length).toBeGreaterThan(60)
  })
})

// =================================================================================================
describe('⭐ the years feed engine/childhood.ts, and neither copy may drift', () => {
  // ⚠ THE `appetiteAt` COPY, PINNED AGAINST THE REAL FUNCTION. `cards.ts` cannot import it (phase
  // 1's importer set is empty until phase 4), so the table carries a literal table of nine numbers
  // and this is what stops it going stale. MUTATION: change any entry in `APPETITE_AT` -> red.
  it('APPETITE_AT is appetiteAt(age), to the last decimal, at all nine ages', () => {
    const years = chosenYears(finish(runOf(CARRIED_ROAD), 'heavy'))
    for (const y of years) {
      // practice = share * APPETITE_AT[age], so the ratio recovers the copy without exporting it
      const share = y.practice / appetiteAt(y.age)
      expect(share, `age ${y.age}`).toBeGreaterThan(0)
      expect(share, `age ${y.age} – the appetite copy has drifted`).toBeLessThanOrEqual(1.0000000001)
    }
    // and directly, through the module's own constant
    for (const age of CARD_AGES) expect(APPETITE_AT[age], `appetite at ${age}`).toBeCloseTo(appetiteAt(age), 12)
  })

  // ⭐⭐ THE TYPE JOIN. This assignment is the whole of it: if `PrologueYear` stops being assignable
  // to `ChildhoodYear` the gate fails at `vue-tsc`, not here – which is the strongest place for it.
  // MUTATION: rename `teaching` to `coaching` on `PrologueYear` -> `npm run check` goes red at type
  // check, before a single test runs.
  it('a finished run is exactly what childhoodWalk takes – nine years, and it walks them', () => {
    // BOTH DIRECTIONS, AND THE COMPILER IS WHAT ENFORCES THEM. These three lines are the entire
    // defence against the duplicate `PrologueYear` drifting from `ChildhoodYear`: rename a field on
    // either side and `vue-tsc -b --force` fails before a single test runs.
    const mine: PrologueYear = { age: 5, practice: 0.25, teaching: 0.5, focus: 'general' }
    const asTheModelSeesIt: ChildhoodYear = mine
    const backAgain: PrologueYear = asTheModelSeesIt
    expect(backAgain).toEqual(mine)

    const run = finish(runOf(CARRIED_ROAD), 'heavy')
    expect(isComplete(run)).toBe(true)
    const years: ChildhoodYear[] = chosenYears(run)
    expect(years.map((y) => y.age)).toEqual([5, 6, 7, 8, 9, 10, 11, 12, 13])

    const walk = childhoodWalk(years)
    expect(walk.years).toHaveLength(9)
    // the model's own contract, restated over OUR rows: the shape channel redistributes and never adds
    const shapeSum = Object.values(walk.shape).reduce((a, b) => a + b, 0)
    expect(shapeSum).toBeCloseTo(0, 10)
  })

  // ⚠ NOT A BALANCE CLAIM AND NOT A TUNE. Phase 1 owns the dials and their bench
  // (docs/specs/childhood-growth-2026-09.md §8); all this asserts is that the table SPANS the model
  // – that the choices reach both sides of a median childhood, so the nine cards are decisions
  // rather than flavour. MUTATION: give both options on every card the same share and teaching ->
  // red, because the two roads collapse onto one level.
  it('the table spans the model – the light road lands below a median childhood and the carried road above', () => {
    const light = childhoodWalk(chosenYears(finish(runOf(LIGHT_ROAD), 'light'))).level
    const carried = childhoodWalk(chosenYears(finish(runOf(CARRIED_ROAD), 'heavy'))).level
    const median = childhoodWalk(medianChildhood()).level
    expect(median).toBeCloseTo(0, 12)
    expect(light, `the light road (${light.toFixed(3)}) is below a median childhood`).toBeLessThan(0)
    expect(carried, `the carried road (${carried.toFixed(3)}) is above it`).toBeGreaterThan(0)
  })

  // ⚠ THE THIRTEENTH IS THE TWELFTH AGAIN – `sameAsLastYear`. A thirteenth year with its own fixed
  // numbers would be the game forgetting the fork one card after showing it.
  // MUTATION: drop `sameAsLastYear` and give 13 a fixed share -> red.
  it('the thirteenth year is whatever the twelfth settled', () => {
    for (const road of [LIGHT_ROAD, CARRIED_ROAD]) {
      for (const take of ['light', 'heavy'] as const) {
        const run = finish(runOf(road), take)
        const years = chosenYears(run)
        const twelfth = years[7]
        const thirteenth = years[8]
        expect(thirteenth.teaching).toBe(twelfth.teaching)
        expect(thirteenth.focus).toBe(twelfth.focus)
        // the SHARE is inherited, so the absolute practice rises with the appetite of a thirteen-year-old
        expect(thirteenth.practice / appetiteAt(13)).toBeCloseTo(twelfth.practice / appetiteAt(12), 12)
      }
    }
  })
})

// =================================================================================================
describe('⚠ the money – accumulated, and displayed by nothing', () => {
  // §2.4: the player chooses where the family is FROM and the nine years move the number from there.
  // MUTATION: return 0 from `spentCents` -> red on both arms.
  it('the nine years accumulate a real number of cents', () => {
    const cheap = spentCents(finish(runOf(LIGHT_ROAD), 'light'))
    const dear = spentCents(finish(runOf(CARRIED_ROAD), 'heavy'))
    expect(cheap).toBeGreaterThan(0)
    expect(dear).toBeGreaterThan(cheap)
    // whole cents, house law – a fractional cent anywhere means a share leaked into the money
    expect(Number.isInteger(cheap)).toBe(true)
    expect(Number.isInteger(dear)).toBe(true)
  })

  it('the origin is the game\'s own three pictures of what a family has, read rather than re-declared', () => {
    for (const origin of ['working', 'middle', 'wealthy'] as const) {
      expect(originStartCents(withOrigin(EMPTY_RUN, origin))).toBe(ECONOMY.startingFundsCents[origin])
    }
    expect(originStartCents(EMPTY_RUN)).toBe(0)
  })

  // ⚠ AND PHASE 2 SHOWS NONE OF IT. The relative note is what the player reads; the cents are what
  // the run adds up. MUTATION: add a `balanceCents` export and render it -> the digit sweep above
  // goes red, and so does the component walk's own no-digit assertion.
  it('no source file in src/prologue nets the spend against the origin – that claim is phase 4\'s', () => {
    expect(RUN_SRC).not.toMatch(/export function balanceCents/)
    expect(CARDS_SRC).not.toMatch(/balanceCents/)
  })

  // ⭐⭐ THE RELATIVE NOTES ARE TRUE OF THE CENTS BEHIND THEM. §2.4 asks for the cost «in relative
  // terms» («a club is about three times the municipal court»), and a sentence that says one thing
  // while the arithmetic says another is exactly the drift a table is supposed to prevent.
  // MUTATION: change the club to 2_000_00 -> red, naming the ratio it now is.
  it('every multiplier a note claims is the ratio the costs actually are', () => {
    const ratio = (card: PrologueCard, dear: string, cheap: string): number => {
      const find = (id: string): PrologueOption => {
        const o = card.options?.find((x) => x.id === id)
        if (!o) throw new Error(`no option ${id} on card ${card.age}`)
        return o
      }
      return find(dear).costCents / find(cheap).costCents
    }
    const eight = PROLOGUE_CARDS[3]
    const nine = PROLOGUE_CARDS[4]
    const ten = PROLOGUE_CARDS[5]
    const eleven = PROLOGUE_CARDS[6]
    const twelfthTired = PROLOGUE_CARDS[7]

    expect(eight.options?.[1].note).toContain('three times')
    expect(ratio(eight, 'club', 'municipal')).toBeCloseTo(3, 10)

    expect(nine.options?.[1].note).toContain('four times')
    expect(ratio(nine, 'one-to-one', 'group')).toBeCloseTo(4, 10)

    expect(eleven.options?.[1].note).toContain('twice')
    expect(ratio(eleven, 'sports-school', 'ordinary-school')).toBeCloseTo(2, 10)

    expect(TWELFTH_WANTS_MORE.options?.[1].note).toContain('two and a half times')
    expect(ratio(TWELFTH_WANTS_MORE, 'give-her-the-year', 'keep-the-size')).toBeCloseTo(2.5, 10)

    expect(twelfthTired.options?.[0].note).toContain('quarter')
    expect(ratio(twelfthTired, 'let-her-stop', 'finish-the-year')).toBeCloseTo(0.25, 10)

    // «about a month of the group, once» – the entry is the difference, and a month of the group is
    // a twelfth of the group's year.
    const enter = ten.options?.[1].costCents ?? 0
    const stay = ten.options?.[0].costCents ?? 0
    expect(ten.options?.[1].note).toContain('a month of the group')
    expect(enter - stay).toBeCloseTo((nine.options?.[0].costCents ?? 0) / 12, 6)
  })
})

// =================================================================================================
describe('⭐⭐ the age-12 fork is DERIVED, and there are no dice in a derived reading', () => {
  // His ruling (§2.5): «Развилку в двенадцать лет можно вывести из того, что делал игрок». The
  // three signals are the ones the spec names – years of one-to-one against group, tournaments
  // entered, whether any year was left light – and every one of them is read off the table by
  // comparing the answer taken against the answers that were on offer beside it.

  // ⭐⭐ THE ACCEPTANCE CRITERION: two runs that differ only in what the player chose, resolving
  // differently. These two differ in ONE pick – the Local Open at ten – and nothing else.
  // MUTATION: `return { reading: 'tired', ... }` -> red on the second arm.
  it('two runs differing in one decision reach two different twelfths', () => {
    const withoutTheOpen = runOf({ 8: 'club', 9: 'one-to-one', 10: 'stay-home', 11: 'ordinary-school' })
    const withTheOpen = runOf({ 8: 'club', 9: 'one-to-one', 10: 'enter', 11: 'ordinary-school' })

    expect(readTwelfth(withoutTheOpen).reading).toBe('tired')
    expect(readTwelfth(withTheOpen).reading).toBe('wants-more')

    // ...and it is the CARD that changes, not a label on one card
    expect(cardFor(12, withoutTheOpen).title).toBe('She does not want to go on Thursday.')
    expect(cardFor(12, withTheOpen).title).toBe('She has asked you for more than she is getting.')
    expect(cardFor(12, withoutTheOpen).options?.map((o) => o.id)).toEqual(['let-her-stop', 'finish-the-year'])
    expect(cardFor(12, withTheOpen).options?.map((o) => o.id)).toEqual(['keep-the-size', 'give-her-the-year'])
  })

  it('the two ends of the table reach the two ends of the fork', () => {
    expect(readTwelfth(runOf(LIGHT_ROAD)).reading).toBe('tired')
    expect(readTwelfth(runOf(CARRIED_ROAD)).reading).toBe('wants-more')
    expect(readTwelfth(runOf(MIDDLE_ROAD)).reading).toBe('tired')
  })

  // MUTATION: count `focus === 'general'` as a tournament -> the counts go wrong and this reddens.
  it('the counts are the three the ruling names, and they are read off what was chosen', () => {
    const light = readTwelfth(runOf(LIGHT_ROAD))
    expect({ ...light, reason: undefined, reading: undefined }).toEqual({
      oneToOne: 0,
      tournaments: 0,
      light: 4,
      reason: undefined,
      reading: undefined,
    })
    const carried = readTwelfth(runOf(CARRIED_ROAD))
    expect({ ...carried, reason: undefined, reading: undefined }).toEqual({
      oneToOne: 3,
      tournaments: 1,
      light: 0,
      reason: undefined,
      reading: undefined,
    })
  })

  // ⚠ THE TOURNAMENT SIGNAL MUST NOT LEAK INTO THE ONE-TO-ONE SIGNAL. Entering the Local Open is a
  // `matchplay` year, not more coaching, so both answers at ten carry the same `teaching` – and if
  // one of them did not, a single choice would be counted twice and the three signals would be two.
  // MUTATION: raise `enter`'s teaching to 0.55 -> `oneToOne` becomes 4 above and this goes red.
  it('entering the Open counts once – as a tournament, never as a year of one-to-one', () => {
    const ten = PROLOGUE_CARDS[5]
    expect(ten.options?.[0].teaching).toBe(ten.options?.[1].teaching)
    expect(ten.options?.[1].focus).toBe('matchplay')
    const only = runOf({ 8: 'municipal', 9: 'group', 10: 'enter', 11: 'ordinary-school' })
    expect(readTwelfth(only).oneToOne).toBe(0)
    expect(readTwelfth(only).tournaments).toBe(1)
  })

  // ⭐ THE CARD SAYS WHAT IT READ, so the fork cannot be mistaken for a die.
  //
  // ⚠⚠ ONE SENTENCE SINCE 02.09, NOT THREE LINES – the owner met the list and said «мне кажется вот
  // это лишнее». THE FUNCTION IS WHAT THIS TEST PROTECTS AND IT DID NOT GO WITH THE LIST: the fold
  // still names all three of the ruling's facts and it still MOVES with the years behind it, which
  // is the whole of why §2.5's «no dice» is visible to a player rather than only true in the code.
  // MUTATION-VERIFIED: returning `TWELFTH_REASONS.sentence` unsubstituted reddens both arms;
  // returning a constant string reddens the second.
  it('the fork names what it read in one sentence, and it changes with the years behind it', () => {
    expect(readTwelfth(runOf(LIGHT_ROAD)).reason).toBe(
      'The years behind it: never a coach to herself, nothing entered, and more than one year you kept light.',
    )
    expect(readTwelfth(runOf(CARRIED_ROAD)).reason).toBe(
      'The years behind it: most of it with somebody to herself, one draw sheet with her name on it, ' +
        'and no year left to look after itself.',
    )
    // ⚠ AND IT IS PROSE RATHER THAN A LIST WHEREVER IT IS DRAWN: no clause is left carrying its own
    // full stop, which is what made three of them stack up as bullet lines on the card.
    for (const road of [LIGHT_ROAD, CARRIED_ROAD, MIDDLE_ROAD]) {
      const reason = readTwelfth(runOf(road)).reason
      expect(reason.match(/\./g)?.length, `age-12 reason on ${JSON.stringify(road)} is more than one sentence`).toBe(1)
      expect(reason).not.toContain('{')
    }
  })

  // ⚠⚠ NO DICE, AND IT IS PINNED IN THE CODE AS WELL AS IN THE BEHAVIOUR. The trap he named – «на
  // новом заходе она точно должна хотеть» – cannot arise if there is nothing to roll badly.
  // MUTATION: add `Math.random()` to the threshold -> the source pin reddens; make the reading
  // depend on it -> the determinism arm reddens.
  it('the same choices always read the same, and the module holds no generator', () => {
    const run = runOf(MIDDLE_ROAD)
    const first = readTwelfth(run).reading
    for (let i = 0; i < 200; i++) expect(readTwelfth(runOf(MIDDLE_ROAD)).reading).toBe(first)
    const code = scriptCodeOf(RUN_SRC)
    // the strip left the module and not an empty string – the negative pins below are worthless
    // without this line, and it is the mutation guard for the strip itself
    expect(code).toMatch(/export function readTwelfth/)
    expect(code).not.toMatch(/\bMath\.random\b/)
    expect(code).not.toMatch(/\brngFromSeed\b/)
    expect(code).not.toMatch(/\bpickInt\b/)
    expect(code).not.toMatch(/from '\.\.\/engine\/rng'/)
  })

  // ⚠ NO STORED MOTIVATION NUMBER AND NO NEW FIELD (§2.5, and §7 names the motivation system as NOT
  // IN v1 and his). The run holds two things: where the family is from, and what was picked.
  it('the run holds no number about her – an origin and a set of answers, and nothing else', () => {
    const run = finish(runOf(CARRIED_ROAD), 'heavy')
    expect(Object.keys(run).sort()).toEqual(['origin', 'picks'])
    for (const v of Object.values(run.picks)) expect(typeof v).toBe('string')
    const code = scriptCodeOf(RUN_SRC)
    expect(code).toMatch(/export function readTwelfth/)
    expect(code).not.toMatch(/\bmotivation\b/i)
  })
})

// =================================================================================================
describe('the run is a plain, replayable record', () => {
  it('is empty until the player answers, and complete when they have', () => {
    expect(isComplete(EMPTY_RUN)).toBe(false)
    let run = withOrigin(EMPTY_RUN, 'working')
    expect(isComplete(run)).toBe(false)
    for (const [age, id] of Object.entries(LIGHT_ROAD)) run = withPick(run, Number(age), id)
    expect(isComplete(run), 'the twelfth is still open').toBe(false)
    run = finish(run, 'light')
    expect(isComplete(run)).toBe(true)
    expect(() => chosenYears(withOrigin(EMPTY_RUN, 'working'))).toThrow(/not finished/)
  })

  // ⚠ A PICK MADE ON ONE FACE OF THE TWELFTH CANNOT BE READ OFF THE OTHER. `pickAt` resolves the
  // card first, so an id from the face the run does not reach reads as no answer at all rather than
  // as somebody else's answer. MUTATION: search both faces in `pickAt` -> red.
  it('the twelfth\'s answer is read off the face the run actually reached', () => {
    const tired = withPick(runOf(LIGHT_ROAD), 12, 'give-her-the-year')
    expect(cardFor(12, tired).title).toBe('She does not want to go on Thursday.')
    expect(pickAt(12, tired)).toBeNull()
    expect(isComplete(tired)).toBe(false)
  })
})

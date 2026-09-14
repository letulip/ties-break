// ⭐⭐ THE DICE ARE BACK ON THE IDENTITY CARD – MOUNTED, ON A 375x667 PHONE.
//
// The owner, 14.09.2026: «вернуть "кубики" на имя и фамилию при создании, оставив дефолт текущий, у
// нас они были, но куда-то пропали». NOTHING WAS DELETED, which is why this file is about a restore
// and not about a feature: `reroll()` / `rerollLast()` and their two buttons have stood in
// `OnboardingWizard.vue` the whole time. Creation moved to the childhood prologue, the age-5 card
// was built with plain inputs, and the player stopped meeting the screen the dice were on.
//
// WHAT IS PINNED HERE, and the four are deliberately different questions:
//   1. THEY ARE ON THE CARD, beside their own fields, and the card the player meets still fits the
//      375x667 phone with them on it (`assertDismissReachable`, the round-20 #3 rule).
//   2. A ROLL LANDS A MEMBER OF THE POOL.
//   3. NOTHING ROLLS ON ITS OWN – an untouched card is still Alice Martin.
//   4. THERE IS ONE POOL WITH TWO READERS, proved on the tree rather than asserted in prose.
//
// ⚠⚠ (2) ASSERTS MEMBERSHIP AND NEVER «≠ THE DEFAULT», AND THAT IS THE WHOLE DESIGN OF THIS FILE.
// `Alice` is not in the first-name pool today, but `Martin` IS in `SURNAMES` – so a surname roll may
// legitimately land the value the field already held, and a test that read that as "the die did
// nothing" would be RED on a correct build roughly one roll in 210. A suite that fires once in N
// teaches the next reader to re-run it rather than to read it, which is worse than no test at all.
// Membership is the property the feature actually has, and it is true on every draw there is.
//
// ⚠ THE ANTI-VACUITY ARM IS «THE DIE MOVED», NOT «THE DIE LEFT THE DEFAULT». Eighty rolls off a
// 24-name pool produce one single repeated value with probability 24 × 24^-80, which is not a
// number this machine will ever see; a button wired to a constant fails it on the first run. So the
// arm separates a real draw from a fake one without borrowing the flake above.
//
// ⚠⚠ AND THE ONE THING THIS INSTRUMENT CANNOT SEE, MEASURED IN A REAL BROWSER RATHER THAN CLAIMED.
// happy-dom does no layout, so the horizontal question – does a 38px die leave the input enough of
// its half of `.prologue-names` on a 375 phone – is not askable here. Measured in Chromium at
// 375x667 on the shipped build, with the dice in:
//
//     input 124x45, die 38x45   – the same height, which is `stretch` doing its job
//     body scrollWidth 375      – nothing overflows sideways
//     card scrollHeight 1165    – against e2e/prologue.spec.ts's 1320 ceiling
//     content without the art 790 – against its 960 ceiling
//     both name fields' top edge 621 == 621 – the row survived the dice
//
// ⭐ AND THE MODEL'S OWN FLOOR IS UNCHANGED BY THIS CHANGE, proved by a control rather than by
// arithmetic: the age-5 card measures 2095px on `fits.ts` both with the dice and with `HEAD`'s
// dice-less card swapped in. `prologue-walk.test.ts`'s ceiling is 2100, so the dice cost none of
// the 5px that are left – see the handoff for why those 5 are not 50.
//
// ⚠ MUTATION-VERIFIED, EIGHT ARMS, ALL RUN AND ALL RED (14.09). Each line is what the run actually
// printed, not what it was expected to print:
//   1. `@click="rollFirstName"` dropped from the first die -> (2) «press 1 on «Random first name»
//      emitted nothing».
//   2. ⭐ `randomName()` replaced with the CONSTANT `'Vera'` – a real member of the pool -> ONLY the
//      anti-vacuity arm reddens, «eighty presses produced one value». The membership arm stays
//      green, which is the proof that the two arms ask different questions and that (2) is really a
//      membership test rather than a disguised inequality.
//   3. `randomName()` replaced with `'Zzz'` -> (2) «'Zzz' is not a first name this game offers».
//   4. `:value="identity.kidName"` replaced with `:value="randomName()"` -> (3) «the card rolled her
//      name before the player touched it: expected 'Petra' to be 'Alice'».
//   5. a private `const NAMES = [...]` pasted back into `OnboardingWizard.vue` -> (4) «keeps a
//      private name list», naming the file.
//   6. `SURNAME_POOL` turned into `[...SURNAMES]` -> (4) «is a copy of SURNAMES rather than
//      SURNAMES» – two arrays of 210 equal strings, and `toBe` still tells them apart.
//   7. `aria-label="Random last name"` renamed on the card alone -> (4) names both spellings, and
//      (1) and (2) go with it because the die can no longer be found by the name it shares.
//   8. the first die's `class="prologue-dice"` renamed -> (1) «the identity card draws no dice:
//      expected 1 to be 2».
import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
// ⚠ THE APP'S OWN STYLESHEET, for the same reason prologue-walk.test.ts imports it: without it
// `.dialog-card`'s height bound is not in the cascade and the fit measurement below is vacuous.
import '../../src/style.css'
import { readFileSync } from 'node:fs'
import { assertDismissReachable, setViewport, PHONE } from './fits'
import { regionToLast } from '../helpers/source'
import PrologueCardView from '../../src/components/PrologueCard.vue'
import { CARD_AGES, PROLOGUE_CARDS } from '../../src/prologue/cards'
import { WALK_COPY } from '../../src/prologue/handover'
import { OPENING_IDENTITY, type PrologueIdentity } from '../../src/prologue/identity'
import { EMPTY_RUN, moodAt, warmthAt } from '../../src/prologue/run'
import { NAME_POOL, SURNAME_POOL } from '../../src/composables/identityDice'
import { SURNAMES } from '../../src/engine/season/names'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'

/** ⚠ THE PATH IS A PARAMETER AND NEVER AN INLINE LITERAL, and `tests/worldSource.ts`'s
 *  `componentFile()` CANNOT be used from the `component` project for exactly that reason: Vite
 *  rewrites a literal `new URL('…', import.meta.url)` into its own asset resolver, the result is an
 *  http URL, and `readFileSync` throws «The URL must be of scheme file». Measured here on the first
 *  run of this file, which is the same wall `round36-rail-dashboard.test.ts` and
 *  `round36-desktop-shell.test.ts` each carry their own copy of this helper for.
 *
 *  ⚠ AND IT IS STILL THE `.vue` ALONE, which is what the negative claims below require (CLAUDE.md's
 *  pin hygiene): it reads one file and never widens to the composables it imports – so a `not.` on
 *  it cannot trip on a definition in `identityDice.ts` that it was never talking about. */
function sfc(rel: string): string {
  return readFileSync(new URL(rel, import.meta.url), 'utf8')
}

/** The wizard's two accessible names, spelled here exactly as both surfaces spell them. This file
 *  is the only place the three copies are compared, which is what (4) below is for. */
const FIRST_DIE = 'Random first name'
const LAST_DIE = 'Random last name'

const AGE_FIVE = PROLOGUE_CARDS[0]

// ⚠ `attachTo: document.body` LEAVES THE CARD IN THE DOCUMENT WHEN A TEST FAILS BEFORE ITS
// `unmount()`, and the next test's `document.querySelector` then reads the PREVIOUS test's card.
// Measured on the first run of this file: the prefill arm reported «expected 'Olivia' to be 'Alice'»
// – a rolled name, correctly rolled, on a card nobody in that test had pressed anything on. A
// failure that manufactures a second, false failure is the kind that sends the next reader after
// the wrong bug, so the document is cleared between tests rather than only at the end of each.
afterEach(() => {
  document.body.innerHTML = ''
})

/** The age-5 card as the player meets it: attached to the document so the cascade is the real one,
 *  and the viewport set BEFORE the mount – happy-dom resolves lengths at `getComputedStyle` time.
 *  The props are `prologue-walk.test.ts`'s own set, narrowed to the ones this card draws. */
function mountFive(identity: PrologueIdentity = { ...OPENING_IDENTITY }) {
  setViewport(PHONE)
  const wrapper = mount(PrologueCardView, {
    attachTo: document.body,
    props: {
      card: AGE_FIVE,
      warmth: warmthAt(AGE_FIVE.age, EMPTY_RUN),
      mood: moodAt(AGE_FIVE.age, EMPTY_RUN),
      skipLabel: AGE_FIVE.age === CARD_AGES[0] ? WALK_COPY.skip : undefined,
      identity,
    },
  })
  return wrapper
}

/** Press one die `times` times, feeding each emitted identity back in as the container would, and
 *  return what the field held after every press. Feeding it back matters: it is the round trip the
 *  player sees, and a die whose value never reaches the field would otherwise pass. */
async function roll(
  wrapper: ReturnType<typeof mountFive>,
  label: string,
  key: 'kidName' | 'kidLastName',
  times: number,
): Promise<string[]> {
  const landed: string[] = []
  // ⚠ `emitted()` IS CUMULATIVE FOR THE LIFE OF THE WRAPPER, so the second die's presses are counted
  // from where the first die's left off. Reading `emits[i]` instead cost the first run of this file
  // a red on press 1 of the surname die («expected 81 to be 1») – the same off-by-a-previous-run
  // shape as every other index that forgot what came before it.
  const before = (wrapper.emitted('identity') ?? []).length
  for (let i = 0; i < times; i++) {
    const die = wrapper.find(`[aria-label="${label}"]`)
    expect(die.exists(), `the ${label} die went missing after ${i} rolls`).toBe(true)
    await die.trigger('click')
    const emits = wrapper.emitted('identity') as PrologueIdentity[][] | undefined
    expect(emits, `press ${i + 1} on «${label}» emitted nothing`).toBeTruthy()
    expect(emits!.length, `press ${i + 1} on «${label}» did not emit`).toBe(before + i + 1)
    const next = emits![before + i][0]
    await wrapper.setProps({ identity: next })
    landed.push(next[key])
  }
  return landed
}

describe('⭐⭐ the two dice stand beside her name again (owner, 14.09)', () => {
  it('both are on the age-5 card, each beside its own field, and the card still fits a 375x667 phone', () => {
    const wrapper = mountFive()
    const dice = document.querySelectorAll('.prologue-dice')
    expect(dice.length, 'the identity card draws no dice').toBe(2)

    // BESIDE, not merely on the card: each die shares a row with the input it rolls, so the two are
    // one control in the player's eye and neither can drift onto the other's field.
    for (const [label, id] of [
      [FIRST_DIE, 'prologue-first'],
      [LAST_DIE, 'prologue-last'],
    ] as const) {
      const die = document.querySelector(`[aria-label="${label}"]`)
      expect(die, `«${label}» is not on the card`).toBeTruthy()
      const row = die!.closest('.prologue-field-row')
      expect(row, `«${label}» is not in a field row`).toBeTruthy()
      expect(row!.querySelector('input')?.id, `«${label}» sits beside the wrong field`).toBe(id)
    }

    // ...and the 375 frame itself. Two controls were added to the tallest card in the walk, and the
    // round-20 #3 rule is about exactly that kind of growth.
    const el = document.querySelector('.prologue-card')!
    const answers = document.querySelector('.prologue-answers')!
    assertDismissReachable(el, answers, PHONE, 'age 5 with the dice')
    wrapper.unmount()
  })

  it('⚠ a roll lands a MEMBER OF THE POOL – never a value from outside it', async () => {
    const wrapper = mountFive()
    const first = await roll(wrapper, FIRST_DIE, 'kidName', 80)
    for (const name of first) {
      expect(NAME_POOL, `«${name}» is not a first name this game offers`).toContain(name)
    }
    // the die really rolls – see the anti-vacuity note in the header for why this is not the flake
    // the «≠ default» assertion would have been
    expect(new Set(first).size, 'eighty presses produced one value – this die writes a constant').toBeGreaterThan(1)

    const last = await roll(wrapper, LAST_DIE, 'kidLastName', 80)
    for (const surname of last) {
      expect(SURNAME_POOL, `«${surname}» is not a surname this world uses`).toContain(surname)
    }
    expect(new Set(last).size, 'eighty presses produced one value').toBeGreaterThan(1)
    wrapper.unmount()
  })

  it('⚠ and the field still OPENS on the default – a roll is the player\'s own act', () => {
    const wrapper = mountFive()
    // ⚠ SCOPED TO THIS WRAPPER, not to the document – see the `afterEach` note. The claim is about
    // the card this test mounted, so it asks that card rather than whatever is on screen.
    const firstField = wrapper.find<HTMLInputElement>('#prologue-first').element
    const lastField = wrapper.find<HTMLInputElement>('#prologue-last').element
    // The prefill doctrine in `src/prologue/identity.ts`: the age-5 card is a quiet card whose whole
    // subject is that nothing has been decided yet, so its fields start on `DEFAULT_PROFILE` rather
    // than on a draw. That is the deliberate difference from the wizard, which opens on a roll, and
    // it survives the dice arriving: a die that fired at mount would be a different feature.
    expect(firstField.value, 'the card rolled her name before the player touched it').toBe(DEFAULT_PROFILE.kidName)
    expect(lastField.value, 'the card rolled her surname before the player touched it').toBe(
      DEFAULT_PROFILE.kidLastName,
    )
    expect(wrapper.emitted('identity'), 'the card edited the identity with nobody pressing anything').toBeUndefined()
    wrapper.unmount()
  })
})

// =================================================================================================
// ⭐⭐ ONE POOL, TWO READERS – A PROPERTY OF THE TREE, NOT A SENTENCE IN A COMMIT MESSAGE
// =================================================================================================
//
// This repo's recurring defect is two sides of one question kept in step by hand: the country names
// in five files, the identity labels in two templates. A second copy of the name pool would have
// made «Random first name» mean different sets on the two doors into a career, and every pin on
// each side would have stayed green while it happened. So the pool has ONE home and this is the
// guard that keeps it that way.
describe('⭐ the wizard and the card roll the SAME dice', () => {
  const wizard = sfc('../../src/components/OnboardingWizard.vue')
  const card = sfc('../../src/components/PrologueCard.vue')

  it('...and the scan is real – it can see both files', () => {
    expect(wizard, 'the wizard was not read').toContain('ob-dice')
    expect(card, 'the card was not read').toContain('prologue-dice')
  })

  it('the surname pool is the engine\'s own array, not a copy of it', () => {
    // `toBe`, not `toEqual`: two arrays with the same 210 strings would satisfy equality and would
    // be exactly the drift this file exists to stop. Reference identity cannot be faked by a paste.
    expect(SURNAME_POOL, 'SURNAME_POOL is a copy of SURNAMES rather than SURNAMES').toBe(SURNAMES)
    expect(SURNAME_POOL.length, 'the surname pool emptied').toBeGreaterThan(40)
  })

  it('neither component declares a pool or a draw of its own', () => {
    for (const [name, src] of [
      ['OnboardingWizard.vue', wizard],
      ['PrologueCard.vue', card],
    ] as const) {
      expect(src, `${name} does not read the shared dice`).toContain("composables/identityDice'")
      // ⚠ THE .vue ALONE – see `sfc` above. A widened source would carry `identityDice.ts` itself,
      // where both of these forbidden strings legitimately live, and the assertion would trip on
      // the definition it was never talking about.
      expect(src, `${name} keeps a private name list`).not.toMatch(/\bconst\s+(NAMES|SURNAMES|NAME_POOL)\s*=\s*\[/)
      // ⚠ THE CLAIM IS «NO SECOND DRAW OVER A NAME POOL», NOT «NO Math.random IN THIS FILE», and the
      // difference is a real line the wizard is entitled to: `openingPromise` picks one of three
      // sentences once at mount. A blanket ban read as a violation on the first run of this file and
      // would have been a guard that punishes an innocent neighbour – so this is scoped to INDEXING
      // a pool, which is what a second draw has to do and what calling the shared helper never does.
      expect(src, `${name} indexes a name pool instead of reading the shared draw`).not.toMatch(
        /\b(NAMES|SURNAMES|NAME_POOL|SURNAME_POOL|FIRST_NAMES)\s*\[/,
      )
    }
  })

  it('⚠ both surfaces spell the two accessible names identically', () => {
    // The labels are the wizard's, lifted verbatim rather than moved into `identityCopy.ts` – the
    // owner's words are his and the task asked for a restore, not for a refactor of his markup. So
    // they ARE declared twice, and this is what stops the two copies drifting: a rename in one
    // template without the other reddens here, naming both spellings.
    const wizardTemplate = regionToLast(wizard, '<template>', '</template>')
    const cardTemplate = regionToLast(card, '<template>', '</template>')
    for (const label of [FIRST_DIE, LAST_DIE]) {
      expect(wizardTemplate, `the wizard no longer says «${label}»`).toContain(`aria-label="${label}"`)
      expect(cardTemplate, `the card no longer says «${label}»`).toContain(`aria-label="${label}"`)
    }
    // ...and the card took the wizard's own die faces, both of them – the second face has three
    // pips on purpose, which the wizard's own comment says in as many words.
    expect(cardTemplate, 'the four-pip face is not the wizard\'s').toContain('cx="15" cy="15"')
    expect(cardTemplate, 'the three-pip face is not the wizard\'s').toContain('cx="15.6" cy="15.6"')
  })
})

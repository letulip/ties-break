// ⭐⭐ WHO SHE IS – ONE DECLARATION OF THE WORDS, AND ONE SETTLING OF THE FIELDS.
//
// The owner's correction of 02.09.2026: «часть нашего текущего онбординга с датой рождения и именем
// должны остаться», extended the same day with «страну тоже добавь, да». Two surfaces now ask a
// player who his daughter is – `OnboardingWizard.vue` (the skip branch) and the prologue's age-5
// card – and CLAUDE.md's invariant 4 is the reason this file exists rather than a comment saying
// they agree: «USER-FACING WORDING IS NOT AN AGENT'S TO CHANGE», and a string declared twice is a
// string that can drift in one copy while every pin on the other stays green.
//
// What is pinned here:
//   1. NEITHER SURFACE WRITES THE LABELS. Both read `composables/identityCopy.ts`.
//   2. The prologue offers the SAME country list as the wizard, because there is only one list.
//   3. `settleIdentity` – the trim, the fallback and the day clamp – behaves like the wizard's own
//      `start()` does, which is where the fallback rule came from.
//
// ⚠ MUTATION-VERIFIED. Watched failing before it was believed:
//   * `First name` written back into PrologueCard.vue's template as a literal -> (1) goes red
//     naming the label and the file.
//   * the same literal put back into OnboardingWizard.vue -> (1) goes red naming the wizard.
//   * a private `COUNTRIES` list re-declared inside PrologueCard.vue -> (2) goes red.
//   * the `.trim()` dropped from `settleIdentity` -> (3) goes red on the blank name.
//   * the day clamp dropped -> (3) goes red on 31 February.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { region, regionToLast } from './helpers/source'
import { IDENTITY_COPY, MONTHS } from '../src/composables/identityCopy'
import { COUNTRIES, POPULAR_COUNTRIES, COUNTRY_NAMES } from '../src/composables/countries'
import { OPENING_IDENTITY, settleIdentity } from '../src/prologue/identity'
import { PROLOGUE_CARDS } from '../src/prologue/cards'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')
/** ⚠ THE TEMPLATE ONLY. Both script blocks quote the owner in Russian and name the strings they are
 *  explaining; a guard about what a PLAYER sees may not read either. `regionToLast` throws on an
 *  absent marker rather than widening to the whole file (CLAUDE.md's marker rule). */
const templateOf = (rel: string) => regionToLast(read(rel), '<template>', '</template>')
const cardTemplate = templateOf('../src/components/PrologueCard.vue')
/** ⚠ THE WIZARD'S TWO FIELD PANES, O AND P, AND NOT ITS WHOLE TEMPLATE – narrowed on purpose, and
 *  the reason is a real collision rather than convenience. Step S reads every choice back, and one
 *  of its six `<dt>` labels is «Birth month», which `tests/redesign-onboarding.test.ts` pins BY NAME
 *  in the design's order. That is the SUMMARY's word for a reading, not the field's label, and the
 *  two are allowed to be the same string. The guard here is about where the question is ASKED.
 *  `region` throws on an absent marker, so a renamed pane reddens instead of exempting the file. */
const wizardTemplate = region(
  read('../src/components/OnboardingWizard.vue'),
  '<!-- ══ O. Identity ══ -->',
  '<!-- ══ Q. Family & Coaching ══ -->',
)

describe('⭐⭐ the two paths ask in the SAME words, because there is one declaration of them', () => {
  it('...and the scan is real – it can see both templates', () => {
    expect(cardTemplate).toContain('prologue-identity')
    expect(wizardTemplate).toContain('ob-fields')
    expect(wizardTemplate, 'the region covers P as well as O').toContain('ob-country')
  })

  for (const [surface, template] of [
    ['the prologue card', cardTemplate],
    ['the wizard', wizardTemplate],
  ] as const) {
    it(`${surface} writes none of the identity labels itself`, () => {
      for (const [key, word] of Object.entries(IDENTITY_COPY)) {
        expect(
          template,
          `${surface} spells «${word}» out instead of binding IDENTITY_COPY.${key} – a second copy of a label the owner owns`,
        ).not.toContain(`>${word}<`)
        expect(template, `${surface} hard-codes «${word}» as an attribute value`).not.toContain(`"${word}"`)
      }
    })
  }

  it('both draw the month names from the one list', () => {
    for (const template of [cardTemplate, wizardTemplate]) {
      expect(template).toContain('MONTHS')
      for (const month of MONTHS) expect(template, `«${month}» written into markup`).not.toContain(`>${month}<`)
    }
    expect(MONTHS.length).toBe(12)
  })

  it('⭐ the country picker offers the SAME 24 on both paths, and the nine tiles are a shortcut into them', () => {
    // One list, imported by both – so "the prologue offers a different set" is not expressible.
    expect(new Set(Object.keys(COUNTRY_NAMES))).toEqual(new Set(COUNTRIES))
    for (const code of POPULAR_COUNTRIES) expect(COUNTRIES, `${code} is a tile but not playable`).toContain(code)
    expect(POPULAR_COUNTRIES.length).toBe(9)
    // ...and neither template re-declares one of its own.
    for (const template of [cardTemplate, wizardTemplate]) {
      expect(template).toContain('COUNTRY_NAMES[code]')
    }
  })
})

describe('⭐ the identity is asked on the age-5 card and on no other', () => {
  it('exactly one row in the table carries it, and it is the five', () => {
    const asking = PROLOGUE_CARDS.filter((c) => c.identity)
    expect(asking.map((c) => c.age)).toEqual([5])
  })

  it('⚠ and it is not a DECISION – the shape the owner counted is unchanged', () => {
    // Build spec §3: four cards carry no decision – 5, 6, 7 and 13 – and «может тогда больше без
    // решений, 3 или 4?» is his own count. `identity` is invisible to `options`, so the five is
    // still a quiet card, exactly as `origins` is.
    expect(PROLOGUE_CARDS.find((c) => c.age === 5)?.options).toBeUndefined()
  })

  it('the fields open on DEFAULT_PROFILE rather than on nothing', () => {
    expect(OPENING_IDENTITY).toEqual({
      kidName: DEFAULT_PROFILE.kidName,
      kidLastName: DEFAULT_PROFILE.kidLastName,
      birthMonth: DEFAULT_PROFILE.birthMonth,
      birthDay: DEFAULT_PROFILE.birthDay,
      country: DEFAULT_PROFILE.country,
    })
    // ⭐ AND THE DEFAULT IS THE OWNER'S: «я просил сделать дефолт на Alice Martin».
    expect(DEFAULT_PROFILE.kidName).toBe('Alice')
    expect(DEFAULT_PROFILE.kidLastName).toBe('Martin')
  })
})

describe('⭐ settleIdentity – what goes into the profile', () => {
  it('trims, and an emptied field falls back rather than starting a nameless career', () => {
    const settled = settleIdentity({ ...OPENING_IDENTITY, kidName: '  Nadia  ', kidLastName: '   ' })
    expect(settled.kidName).toBe('Nadia')
    expect(settled.kidLastName).toBe(DEFAULT_PROFILE.kidLastName)
  })

  it('⚠ clamps the day to the month, so an impossible date never reaches a save', () => {
    // 31 March and then February is the real sequence: the month select can shrink under a day
    // already chosen, and the wrong week for her birthday is how it would eventually surface.
    expect(settleIdentity({ ...OPENING_IDENTITY, birthMonth: 2, birthDay: 31 }).birthDay).toBe(28)
    expect(settleIdentity({ ...OPENING_IDENTITY, birthMonth: 4, birthDay: 31 }).birthDay).toBe(30)
    expect(settleIdentity({ ...OPENING_IDENTITY, birthMonth: 1, birthDay: 31 }).birthDay).toBe(31)
  })

  it('an unchosen country falls back to the default rather than to an empty code', () => {
    expect(settleIdentity({ ...OPENING_IDENTITY, country: '' }).country).toBe(DEFAULT_PROFILE.country)
    expect(settleIdentity({ ...OPENING_IDENTITY, country: 'ES' }).country).toBe('ES')
  })
})

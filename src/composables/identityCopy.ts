// WHO SHE IS – THE WORDS BOTH PATHS INTO A CAREER ASK WITH, declared once.
//
// ⚠⚠ WHY THIS FILE EXISTS, AND IT IS INVARIANT 4 RATHER THAN TIDINESS. CLAUDE.md: «USER-FACING
// WORDING IS NOT AN AGENT'S TO CHANGE», and its corollary is that a string declared twice is a
// string that can drift in one copy while the other stays green – the pins assert what a string IS,
// so they move with it. There are now TWO surfaces that ask a player who his daughter is:
//
//   * `OnboardingWizard.vue` step O (her name, her birthday) and step P (her country) – the SKIP
//     branch, and the only asker there has ever been.
//   * `PrologueCard.vue`'s age-5 card – the DEFAULT branch since the childhood prologue shipped.
//     The owner's ruling of 02.09 («часть нашего текущего онбординга с датой рождения и именем
//     должны остаться»), extended the same day to the country («страну тоже добавь, да»).
//
// The prologue asks the SAME three things, so it must ask them in the SAME words, and the only way
// to guarantee that mechanically is for there to be one declaration. Nothing here is new copy: every
// string below was lifted verbatim out of the wizard's own template, and the wizard now reads them
// back from here. `tests/prologue-identity.test.ts` asserts neither surface writes its own.
//
// ⭐ THE PRECEDENT IS `composables/countries.ts`, in this same folder and for this same reason:
// «five identical definitions are not five decisions, they are one decision pasted five times». That
// file took the country NAMES and the flag; this one takes the field labels. Both are PRESENTATION –
// the engine stores `PlayerProfile` and never renders a word of it – so both live with the view
// helpers and invariant 1 stays intact.

import { t } from '../i18n'

/** Her birth month in full, January first – the option labels on the birthday select.
 *
 *  ⚠ MOVED OUT OF `OnboardingWizard.vue`, where it was declared as `const MONTHS`. Two source pins
 *  named that declaration as a region boundary and both were re-aimed rather than deleted:
 *  `tests/redesign-onboarding.test.ts` (the BACKGROUNDS region) and, for the country list below it,
 *  `tests/season/wildCard.test.ts`.
 *
 *  ⚠ NOT `shared/dates.ts`'s private `MONTHS`, which is the THREE-LETTER form used inside date
 *  ranges ("12 Jun"). A select option is read on its own and wants the whole word. */
export const MONTHS: readonly string[] = localizedList(
  () => t('January'), () => t('February'), () => t('March'), () => t('April'), () => t('May'), () => t('June'),
  () => t('July'), () => t('August'), () => t('September'), () => t('October'), () => t('November'), () => t('December'),
)

/** L2-1 (08.10) – A LIST WHOSE ITEMS ARE READ THROUGH `t()` AT THE MOMENT THEY ARE INDEXED. `MONTHS` keeps its type and its
 *  callers (`MONTHS[i]`, `v-for`, `.map`), and the month names follow the locale on the next render instead of freezing the
 *  language the module was imported in. Twelve keys, the picker's NOMINATIVE form – a date needs its own (see below). */
function localizedList(...readers: (() => string)[]): readonly string[] {
  const list: string[] = []
  readers.forEach((read, i) => Object.defineProperty(list, i, { get: read, enumerable: true }))
  return list
}

/** ⭐ L2-1 (08.10) – THE DATE, AS ITS OWN KEYS (RU-02A «Months and dates»). A date is not the picker list plus a day: Russian
 *  puts the day first and declines the month, which a localized picker array cannot be interpolated into. English is
 *  the shipped `January 5`, byte for byte. */
const MONTH_DAY: readonly ((day: number) => string)[] = [
  (day) => t('January {day}', { day }),
  (day) => t('February {day}', { day }),
  (day) => t('March {day}', { day }),
  (day) => t('April {day}', { day }),
  (day) => t('May {day}', { day }),
  (day) => t('June {day}', { day }),
  (day) => t('July {day}', { day }),
  (day) => t('August {day}', { day }),
  (day) => t('September {day}', { day }),
  (day) => t('October {day}', { day }),
  (day) => t('November {day}', { day }),
  (day) => t('December {day}', { day }),
]
export function monthDayLabel(month: number, day: number): string {
  return MONTH_DAY[month - 1]?.(day) ?? ` ${day}`
}

/** The field labels, placeholders and screen-reader names for the three things both paths ask.
 *
 *  ⚠ VERBATIM. Not one of these is a new sentence: they are the wizard's own strings, moved. A
 *  wording change to any of them is the owner's, not an agent's, and it now happens in one place. */
export const IDENTITY_COPY = {
  /** step O's label AND its placeholder – the same word does both jobs there */
  get firstName() { return t('First name') },
  get lastName() { return t('Last name') },
  /** ONE label for the month/day pair: it is a date, not two settings */
  get birthday() { return t('Birthday') },
  /** the two selects carry their own screen-reader names under that one label */
  get birthMonth() { return t('Birth month') },
  get birthDay() { return t('Birth day') },
  /** step P – the country search, its three view headings and its empty state */
  get searchPlaceholder() { return t('Search countries...') },
  get searchLabel() { return t('Search countries') },
  get popular() { return t('Popular') },
  get results() { return t('Results') },
  get allCountries() { return t('All countries') },
  get browseAll() { return t('Browse all countries') },
  get noMatches() { return t('No country matches that.') },
} as const

/** ⭐⭐ v86 (wave 10 T10, his rulings of 22.09) – THE WORDS A DYNASTY RUN ADDS, declared once for
 *  the same reason everything above is: two surfaces ask (the prologue's age-5 card and the wizard,
 *  which is the skip branch), and a string declared twice drifts in one copy while the other stays
 *  green. Every one of these is a DRAFT for his pass (invariant 4), listed verbatim in the wave's
 *  report.
 *
 *  ⚠ `lineNote` IS NOT NEW: it shipped with T4 inside `ChildhoodPrologue.vue` and MOVED here the
 *  day the wizard became its second reader. The words are byte-identical. */
export const DYNASTY_COPY = {
  /** under the two name fields – why the surname is locked and the origins are not asked */
  get lineNote() { return t('She is born into her mother\'s family and carries her name.') },
  /** under the birthday when it is LOCKED to the one recorded birth – «для подлинности истории»,
   *  his 22.09 ruling: the date is derived from the real birth week, never asked */
  get birthdayNote() { return t('Her birthday is a matter of record.') },
  /** over the date choice when the mother raised MORE THAN ONE daughter – his own ruling: «если
   *  два ребенка было и больше, давать пользователю выбор из этих двух-трех дат» */
  get birthdayChoice() { return t('More than one daughter grew up here. Whose story is this?') },
  /** the wizard's family-background step on a dynasty run – the three buttons are absent because
   *  the band arrived on the block, and the card says so instead of asking */
  get familyNote() { return t('The means she starts with are her mother\'s story, not a choice.') },
} as const

/** ⭐⭐⭐ SUCCESSION W1 (06.10, his ruling 14: «да, звучит хорошо») – THE ONE LINE AN INHERITANCE ADDS TO THE PROLOGUE'S IDENTITY CARD. It sits beside
 *  `DYNASTY_COPY` and not in it: it is this wave's string (W-S4, docs/specs/succession-2026-10.md §8) and not wave 10's, and wave 10's round-trip pin
 *  counts wave 10's table.
 *
 *  ⚠ IT SPEAKS OF A HEAD START AND NAMES NO NUMBER: the multiplier is a sketch the bench retunes, and a sentence that quoted it would be the first
 *  thing to go stale. It is drawn only when the start really is richer than an ordinary one (`ChildhoodPrologue.vue`'s `line`). */
export const LEGACY_COPY = {
  /** under the lock sentence, on a legacy career whose wallet starts above an ordinary one */
  headStart: 'Her mother\'s career leaves her a head start.',
} as const

/** ⭐⭐⭐ v87 (wave 11 T1, his ruling of 22.09) – THE WORDS THE ONE SWITCH IN THE GAME IS ASKED AND
 *  SET IN, declared once for the reason everything above is: TWO surfaces ask it (the prologue's
 *  opening card and the wizard, which is the skip branch) and a THIRD sets it (the settings row), so
 *  three copies of one sentence would be three chances to drift with the pins staying green.
 *
 *  ⚠ ⚠ EVERY STRING BELOW IS A **DRAFT** FOR HIS PASS (invariant 4), listed verbatim in the wave's
 *  report. ⭐ AND THIS IS THE ONE FILE IN THE APP WHERE A WORDING CHANGE IS CHEAP FOR HIM, which is
 *  the whole argument for the file: one edit reaches all three surfaces.
 *
 *  ⚠⚠ WHAT THE WORDS MAY AND MAY NOT DO, and it is tighter than it looks. They must be honest
 *  enough that a player can decide – so they NAME the two things (a pregnancy that ends, a death in
 *  the family) – and they may not preview a scene, price anything, or promise how often. A card that
 *  said «rare» would be quoting a constant the bench is about to retune, and a card that described
 *  the scene would be spending it before it happens.
 *
 *  ⚠ AND THE OFF SIDE IS WRITTEN AS A REAL CHOICE RATHER THAN A WARNING LABEL. The design's own
 *  sentence is «the off switch is not optional here»; a line that shamed the player for taking it
 *  would make the switch decorative. */
export const WEIGHT_COPY = {
  /** the question's own heading, on both creation surfaces and over the settings row */
  get title() { return t('The weight') },
  /** what the switch is about – the two things, named plainly, with no scene and no number */
  get lead() {
    return t('Some careers meet a pregnancy that ends, or a death in the family. They are written carefully and they are part of the story this game tells. You can leave them out.')
  },
  /** the two answers. ⚠ The ON side says what arrives, the OFF side says what does not – neither is
   *  the «right» one, and neither is phrased as a recommendation. */
  get on() { return t('Include them') },
  get off() { return t('Leave them out') },
  /** under the pair on the creation surfaces – the ruling's second half, said where the decision is
   *  made rather than only where it is changed */
  get note() { return t('You can change this later in More. Turning it off stops what has not happened yet – it never erases what a career has already lived.') },
  /** the screen-reader name for the pair, which is one question and not two controls */
  get groupLabel() { return t('The weight') },
  /** ⭐ ROUND 46 #2 – THE SETTINGS ROW'S OWN LABEL (owner: «the weight дублирует the weight в
   *  настройках, надо второе переписать и может немного развернуть»). The row sits under an `<h2>`
   *  that already says `title` and used to print `title` again as its label – the same two words
   *  twice in two lines. The heading KEEPS `title` (it is the question's name on all three
   *  surfaces); the row now says WHAT THE SWITCH GATES, in the spec's own nouns: pregnancy loss and
   *  bereavement are the two hazards that read `world.weightEnabled` (`pregnancyLossEligible`,
   *  `bereavementEligible`). It also names what the hint under it calls «loss» – in a tennis game a
   *  bare «loss» could read as a lost match.
   *  ⚠ A DRAFT FOR HIS BLESSING (R46-S23 in docs/rounds/round-46.md, with two alternates).
   *  ⚠ IT IS ALSO THE SWITCH'S ACCESSIBLE NAME (`aria-labelledby` on the row), so a re-word moves
   *  the name list in `tests/component/a11y-sweep.test.ts` and the two e2e transcriptions with it. */
  settingsLabel: 'Pregnancy loss and bereavement',
  /** the settings row's own second line. ⚠ It is the SAME promise as `note` in the shape that row's
   *  neighbours use (Week story's «Off: …»), because a settings hint that said something different
   *  from the creation card would be two answers to one question. */
  get settingsHint() { return t('Off: no new loss or bereavement arrives. What a career has already lived stays.') },
} as const

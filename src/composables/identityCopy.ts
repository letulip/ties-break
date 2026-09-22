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

/** Her birth month in full, January first – the option labels on the birthday select.
 *
 *  ⚠ MOVED OUT OF `OnboardingWizard.vue`, where it was declared as `const MONTHS`. Two source pins
 *  named that declaration as a region boundary and both were re-aimed rather than deleted:
 *  `tests/redesign-onboarding.test.ts` (the BACKGROUNDS region) and, for the country list below it,
 *  `tests/season/wildCard.test.ts`.
 *
 *  ⚠ NOT `shared/dates.ts`'s private `MONTHS`, which is the THREE-LETTER form used inside date
 *  ranges ("12 Jun"). A select option is read on its own and wants the whole word. */
export const MONTHS: readonly string[] = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** The field labels, placeholders and screen-reader names for the three things both paths ask.
 *
 *  ⚠ VERBATIM. Not one of these is a new sentence: they are the wizard's own strings, moved. A
 *  wording change to any of them is the owner's, not an agent's, and it now happens in one place. */
export const IDENTITY_COPY = {
  /** step O's label AND its placeholder – the same word does both jobs there */
  firstName: 'First name',
  lastName: 'Last name',
  /** ONE label for the month/day pair: it is a date, not two settings */
  birthday: 'Birthday',
  /** the two selects carry their own screen-reader names under that one label */
  birthMonth: 'Birth month',
  birthDay: 'Birth day',
  /** step P – the country search, its three view headings and its empty state */
  searchPlaceholder: 'Search countries...',
  searchLabel: 'Search countries',
  popular: 'Popular',
  results: 'Results',
  allCountries: 'All countries',
  browseAll: 'Browse all countries',
  noMatches: 'No country matches that.',
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
  lineNote: 'She is born into her mother\'s family and carries her name.',
  /** under the birthday when it is LOCKED to the one recorded birth – «для подлинности истории»,
   *  his 22.09 ruling: the date is derived from the real birth week, never asked */
  birthdayNote: 'Her birthday is a matter of record.',
  /** over the date choice when the mother raised MORE THAN ONE daughter – his own ruling: «если
   *  два ребенка было и больше, давать пользователю выбор из этих двух-трех дат» */
  birthdayChoice: 'More than one daughter grew up here. Whose story is this?',
  /** the wizard's family-background step on a dynasty run – the three buttons are absent because
   *  the band arrived on the block, and the card says so instead of asking */
  familyNote: 'The means she starts with are her mother\'s story, not a choice.',
} as const

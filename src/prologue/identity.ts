// WHO SHE IS, ASKED INSIDE THE PROLOGUE – the owner's correction of 02.09.2026.
//
// «часть нашего текущего онбординга с датой рождения и именем должны остаться» – and, the same day,
// «страну тоже добавь, да». Until this shipped, EVERY prologue career was the same girl: the nine
// cards asked where the family was from and nothing else, so `ChildhoodPrologue.vue` handed
// `createWorld` a `DEFAULT_PROFILE` with one field changed, and every childhood in the game belonged
// to Alice Martin of the United States.
//
// ⚠⚠ NOTHING HERE IS NEW STATE AND NOTHING HERE IS PERSISTED SEPARATELY. All five fields have been
// on `PlayerProfile` since long before the prologue existed, the `new` command has always carried a
// whole profile, and `createWorld` has always read it – so this is the prologue filling in fields it
// was leaving at their defaults, NOT a schema move. `SAVE_SCHEMA_VERSION` does not move, no
// migration is added, and a career started here and a career started through the wizard are the same
// shape (which is phase 4's own acceptance criterion).
//
// ⚠ AND THE BIRTHDAY IS NOT COSMETIC. `START_AGE_YEARS` and the game's 13-or-14 opening read
// `birthMonth` / `birthDay` (`kidAgeYears`), and the build spec's §2.1 puts the prologue's own start
// at five «decided by her birthday, on exactly the machinery that already decides 13-or-14». So the
// field has to reach `createWorld` on the prologue path exactly as it does on the wizard path, which
// is what `tests/component/prologue-two-paths.test.ts` asserts end to end against a real world.
import { daysInBirthMonth } from '../shared/dates'
import { DEFAULT_PROFILE, type PlayerProfile } from '../shared/protocol'

/** The five fields the age-5 card asks for – a subset of `PlayerProfile`, declared as one so it
 *  cannot drift from the profile it is spread into. */
export type PrologueIdentity = Pick<
  PlayerProfile,
  'kidName' | 'kidLastName' | 'birthMonth' | 'birthDay' | 'country'
>

/** ⭐ WHAT THE FIELDS HOLD BEFORE THE PLAYER TOUCHES THEM, AND IT IS `DEFAULT_PROFILE` ITSELF –
 *  Alice Martin, born 15 June, of the United States.
 *
 *  ⚠ PREFILLED RATHER THAN EMPTY, and that is a deliberate difference from the wizard, which starts
 *  the name on a random draw and the country on nothing at all and gates Next until one is picked.
 *  A gate is a disabled control with a rule behind it, and the age-5 card is a quiet card whose whole
 *  subject is that nothing has been decided yet; a prefilled field asks the same question without
 *  inventing a state the prologue has never had. A player who reads past it gets exactly what a
 *  prologue career gets today – which is the behaviour this change is correcting, now visible and
 *  now changeable. */
export const OPENING_IDENTITY: PrologueIdentity = {
  kidName: DEFAULT_PROFILE.kidName,
  kidLastName: DEFAULT_PROFILE.kidLastName,
  birthMonth: DEFAULT_PROFILE.birthMonth,
  birthDay: DEFAULT_PROFILE.birthDay,
  country: DEFAULT_PROFILE.country,
}

/**
 * The identity as it goes into the profile: trimmed, with an emptied field falling back to the
 * default rather than starting a career with a hole in it.
 *
 * ⚠ THE FALLBACK IS THE WIZARD'S OWN, and it is here for the same reason it is there: `start()` in
 * `OnboardingWizard.vue` reads `profile.kidName.trim() || DEFAULT_PROFILE.kidName`, because a text
 * field can be cleared and a nameless girl is not a career. The surname differs by one word – the
 * wizard rolls a fresh one, this returns the default – because the wizard's field STARTED on a roll
 * and this one started on the default, so each falls back to what its own field was showing.
 *
 * ⚠ AND THE DAY IS CLAMPED TO THE MONTH. The month select can shrink under a day already chosen (31
 * March, then February), and an impossible date would only surface much later as a birthday landing
 * in the wrong week. `daysInBirthMonth` is the same function the wizard's watcher uses; February is
 * 28 there and here, because her birth year is the band's and is never a leap year.
 */
export function settleIdentity(identity: PrologueIdentity): PrologueIdentity {
  const birthMonth = Number.isFinite(identity.birthMonth) ? identity.birthMonth : DEFAULT_PROFILE.birthMonth
  const maxDay = daysInBirthMonth(birthMonth)
  const wanted = Number.isFinite(identity.birthDay) ? identity.birthDay : DEFAULT_PROFILE.birthDay
  return {
    kidName: identity.kidName.trim() || DEFAULT_PROFILE.kidName,
    kidLastName: identity.kidLastName.trim() || DEFAULT_PROFILE.kidLastName,
    birthMonth,
    birthDay: Math.min(Math.max(1, wanted), maxDay),
    country: identity.country || DEFAULT_PROFILE.country,
  }
}

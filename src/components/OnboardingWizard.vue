<script setup lang="ts">
// SCREENS N–S – the whole onboarding, and the first thing a new player ever sees.
//
// A full-screen takeover that replaces the shell entirely until `game.newCareer(...)` resolves and
// a snapshot exists; App.vue then swaps this out for the tab shell reactively (no emit/props).
//
// ⚠ SIX STEPS NOW, NOT SEVEN. The handoff designs six (N Welcome · O Identity · P Country ·
// Q Family & Coaching · R Play Style · S Summary) and we shipped seven, because background and
// coaching each had a screen of their own. Q merges those two onto one screen. NOTHING ELSE MOVED:
// the same eight `PlayerProfile` fields are collected, in the same order, with the same defaults,
// and the same two validity gates (a name on O, a country on P). This is a redesign of the
// presentation, and the step COUNT is part of the presentation.
//
// THE GUTTER IS 22, AND THIS IS THE ONLY SCREEN THAT PASSES IT. `ScreenShell`'s gutter is opt-in
// precisely so onboarding can be the documented exception (docs/design/HANDOFF-RULES.md: "gutter
// контента 14px (онбординг N–S — 22px)"). Every other screen inherits the app frame.
import { computed, reactive, ref, watch } from 'vue'
import { useGameStore } from '../stores/game'
import { DEFAULT_PROFILE, type CoachTier, type FamilyBackground, type PlayerProfile, type PlayStyle } from '../shared/protocol'
import { SURNAMES } from '../engine/season/cohort'
import { daysInBirthMonth } from '../shared/dates'
import { onboardingHeroUrl, portraitUrl } from '../art/preload'
import ScreenShell from './ui/ScreenShell.vue'
import Card from './ui/Card.vue'
import Eyebrow from './ui/Eyebrow.vue'
import PrimaryPill from './ui/PrimaryPill.vue'
// HER COUNTRY IN WORDS AND AS A FLAG, from `composables/countries.ts`. `flagEmoji` was
// byte-identical in five components and the name map was written out in two; a twenty-fifth
// country would have had to be added in two files with nothing to say so.
import { COUNTRIES, COUNTRY_NAMES, POPULAR_COUNTRIES, flagEmoji } from '../composables/countries'
// ⚠ THE FIELD LABELS AND THE MONTH NAMES ARE NOT THIS FILE'S ANY MORE – see the header of
// composables/identityCopy.ts. The prologue's age-5 card asks the same three things (her name,
// her birthday, her country) and invariant 4 says it must ask them in the same words, so there
// is now ONE declaration and both surfaces read it. Not a string on this screen changed.
import { IDENTITY_COPY, MONTHS } from '../composables/identityCopy'

const game = useGameStore()

// THE TWO PAINTINGS, AND THEY ARE TWO FILES NOW.
//   S, summary  – SETTLED as `jun-norm` (owner, docs/specs/ui-inventory §4 Q4: «первый раз входит
//                 в клуб»). Nothing to draw, nothing to ask about, and unchanged by the line below.
//   N, hero     – ⚠ THE OWNER'S SQUARE MASTER LANDED («картинка для первого экрана создания
//                 персонажа у нас есть, надо поменять»): `welcome-1`, a parent and a daughter on a
//                 floodlit court at dusk. It has been on disk as a webp since 29.07 while this line
//                 still pointed at the stand-in, which is the whole of what the playtest found.
//                 The swap cost exactly what §4 Q4 promised it would - one constant, one call site.
// build/webp-only: both go through a shared url builder, so neither can drift into a 404 again.
const SUMMARY_ART = portraitUrl('jun', 'norm')
const HERO_ART = onboardingHeroUrl()

const NAMES = [
  'Vera', 'Alexandra', 'Maria', 'Elena', 'Sofia', 'Anna', 'Iga', 'Coco', 'Aryna', 'Mirra',
  'Emma', 'Olivia', 'Zoe', 'Lea', 'Carla', 'Bianca', 'Naomi', 'Yuki', 'Ines', 'Petra',
  'Milena', 'Dana', 'Lucia', 'Amelie',
]

const BACKGROUNDS: { id: FamilyBackground; label: string; budget: string; blurb: string }[] = [
  { id: 'wealthy', label: 'Wealthy', budget: '$120,000', blurb: 'Top academies are within reach.' },
  { id: 'middle', label: 'Middle class', budget: '$25,000', blurb: 'Smart choices, steady progress.' },
  { id: 'working', label: 'Working class', budget: '$8,000', blurb: 'Big dreams, hard mode.' },
]

// THE INTERIM CHOOSER. Onboarding still offers the two options it always did, mapped onto the two
// rungs of the ladder they mean: the parent on the court, and the standard private coach. "Hire a
// coach" deliberately lands on `middle` and NOT on the dearest rung – handing a new middle-class
// family an Elite coach is exactly the wall docs/specs/coach-tiers.md exists to close.
//
// THE PROPER CHOOSER SHIPS – screen T, the Coach Market (`screens/CoachMarketScreen.vue`, reached
// from App's `market` tab). This comment used to call it "designed, and a later slice" and then list
// what it would need; it has all of it. A tier is a SECTION rather than a filter, all five rungs
// deep; each rung's weekly band is quoted at HER age and HER plan off `coachWeeklyBandCents`; the
// great / good / off fit pill is read against her play style, through a lens that re-reads every
// pill if the parent asks "what if she played differently"; and the budget meter is there.
//
// So this card stays two options ON PURPOSE and not for want of a better screen. It is the first
// minute of a career, before there is a budget to meter or a style to fit against – the style is
// chosen on the NEXT step – and the two things that make the ladder worth reading, the price and the
// fit, are exactly the two a boolean cannot carry. The market is where that choice is really made,
// and it is one tab away from the moment the career starts.
//
// ⚠ THE BLURBS ARE SHORTER THAN THEY WERE, because Q's coaching card is a 2-line centred cell and
// the old sentences were three lines each. `middle` keeps "a real weekly bill" rather than the
// design's "Pro guidance, real results." – the honest bill IS the decision this card is asking the
// player to make, and a card that only promises results is the one that walks a middle-class family
// into the wall above.
const COACH_OPTIONS: { id: CoachTier; label: string; blurb: string }[] = [
  { id: 'self', label: 'Coach yourself', blurb: 'Cheaper now, training unlocks later.' },
  { id: 'middle', label: 'Hire a coach', blurb: 'Pro guidance, and a real weekly bill.' },
]

// An inclination, not numbers: weights future skill growth (Phase 4).
//
// ⚠ THE `playStyle` ID IS THE WHOLE ADDRESS NOW – there is no mapping table here any more, and that
// is a deliberate deletion. The four pose SVGs used to be named half for the STYLE and half for the
// id (`baseliner` for our `aggressive`, `bigserve` for our `serve-first`), so this list carried a
// `pose:` field per style whose only job was to translate. The owner's ruling (29.07: «переименуй
// если нужно»): the FILES were renamed to the ids, and the translation is gone.
//
// WHICH DIRECTION THE RENAME HAD TO GO, because the other one looks equally easy and is not:
// `PlayStyle` is persisted inside `PlayerProfile`, so every save on every device has one of these
// four strings written into it. Renaming the union would need a save migration to read old careers;
// renaming two files in `public/` costs nothing and breaks nothing. Files are free, the union is
// not. The labels stay the INTERFACE's words ("Aggressive baseliner", "Big serve") - those were
// never the problem, and they are what the owner named the files after in the first place.
//
// So: the pose art is `icons/styles/<id>.svg` and the colour is `var(--style-<id>)`, both derived.
// A fifth style added to the protocol needs a file and a token with its own name, and the guard
// test below fails until both exist rather than 404-ing on half the screen.
//
// The colour paints the pose (the SVGs ship as black silhouettes, invisible on this page until they
// are tinted) and the radar polygon. `radar` is the design's data pentagon, verbatim from the
// prototype, in the 56x56 box the spec asks for. Five spokes, one point each; the shape IS the
// description of the style.
const PLAY_STYLES: {
  id: PlayStyle
  label: string
  blurb: string
  chips: [string, string]
  radar: string
}[] = [
  {
    id: 'aggressive',
    label: 'Aggressive baseliner',
    blurb: 'Dictate with heavy groundstrokes.',
    chips: ['Power', 'Consistency'],
    radar: '28,6 43.7,22.9 34.5,36.9 20.9,37.8 10.2,22.2',
  },
  {
    id: 'counterpuncher',
    label: 'Counterpuncher',
    blurb: 'Speed, defense, and endless patience.',
    chips: ['Defense', 'Stamina'],
    radar: '28,15.9 40.5,23.9 40.3,44.9 15.1,45.8 11.3,22.6',
  },
  {
    id: 'serve-first',
    label: 'Big serve',
    blurb: 'Free points first.',
    chips: ['Serve', 'Power'],
    radar: '28,6 46.8,21.9 33.8,36 22.8,35.1 15.5,23.9',
  },
  {
    id: 'all-court',
    label: 'All-court',
    blurb: 'No weaknesses, no shortcuts.',
    chips: ['Versatility', 'Balance'],
    radar: '28,11.5 43.7,22.9 37.7,41.4 18.3,41.4 12.3,22.9',
  },
]

/** The radar's two guide rings, shared by all four cards: the full pentagon and the 50% one. */
const RADAR_OUTER = '28,6 48.9,21.2 40.9,45.8 15.1,45.8 7.1,21.2'
const RADAR_INNER = '28,17 38.5,24.6 34.5,36.9 21.6,36.9 17.6,24.6'

/** Step titles and their one-line subtitles. N (step 1) has a headline of its own instead.
 *
 *  ⚠ THE TITLES ARE WRITTEN IN TITLE CASE, and that is load-bearing rather than a typo. The screen
 *  used to shout them with `text-transform: uppercase`, which the owner ruled out (29.07); the case
 *  a heading renders in now lives in the string, so this list reads exactly the way the screen does.
 *  House convention, taken off the screens he was comparing them to (Season Planner, Family Budget,
 *  Coach Market): every word capitalised EXCEPT articles and short prepositions – hence "Raise a
 *  Champion". The SUBTITLES stay sentence case; they are sentences, and every other screen's
 *  sub-line is one too. */
/** ⭐⭐ THE OPENING PROMISE, AND IT IS A POOL BECAUSE HE ASKED FOR ONE (01.09): «можно все 3
 *  рандомно использовать, как и предыдущие реплики тренера, все хороши».
 *
 *  ⚠ IT REPLACED A PROMISE THE ENGINE DOES NOT KEEP. The line read «Your kid has real talent. With
 *  the right support, anything is possible.» - and `ECONOMY.development.potentialBand` is [4, 26],
 *  whose own comment says a career at the bottom of that band «is a girl who was never going to make
 *  it, and that has to be a career the game can tell». The wizard was promising the player something
 *  the world may simply not contain, to the very player who would then spend a hundred hours finding
 *  out. The promise belongs to the PARENT; the uncertainty stays hers.
 *
 *  ⚠ PICKED ONCE, ON MOUNT, AND NEVER AGAIN. A line re-drawn on every render is the defect round 31
 *  #4 spent a wave removing from the tournament card - the player reads a sentence as a statement,
 *  not as a roll. There is no seed here (no world exists yet), so the pick is a `ref` set at setup
 *  and read for the life of the wizard. */
const OPENING_PROMISE: readonly string[] = [
  'The talent is hers. The bills, the drives and the decisions are yours.',
  'Your kid can play. What happens next is mostly about you, and it will cost more than you think, sooner than you think.',
  'She has something. Whether it becomes anything is a question about your time, your money and your nerve.',
]
const openingPromise = ref(OPENING_PROMISE[Math.floor(Math.random() * OPENING_PROMISE.length)])

const STEP_HEADS: { title: string; sub: string }[] = [
  { title: 'Raise a Champion', sub: '' },
  { title: 'Who Is Your Player?', sub: "Let's start with who she is." },
  { title: 'Where Are You Starting?', sub: 'Select your country.' },
  { title: 'Family Setup', sub: 'Your resources and support shape the path.' },
  { title: 'Choose Play Style', sub: 'This shapes strengths and training focus.' },
  { title: 'All Set!', sub: 'Here she is. The rest is the two of you.' },
]

/** The pose art for a style, addressed BY ITS ID – see the ⚠ on PLAY_STYLES for why that is safe. */
function poseUrl(id: PlayStyle): string {
  return `${import.meta.env.BASE_URL}icons/styles/${id}.svg`
}

function randomName(): string {
  return NAMES[Math.floor(Math.random() * NAMES.length)]
}

function randomSurname(): string {
  return SURNAMES[Math.floor(Math.random() * SURNAMES.length)]
}

const STEP_COUNT = 6
const step = ref(1)

const profile = reactive<PlayerProfile>({
  kidName: randomName(),
  kidLastName: randomSurname(),
  gender: 'girl',
  country: '',
  background: 'middle',
  coachTier: DEFAULT_PROFILE.coachTier,
  playStyle: 'all-court',
  birthMonth: DEFAULT_PROFILE.birthMonth,
  birthDay: DEFAULT_PROFILE.birthDay,
})

// HER BIRTHDAY, and the day is the player's to choose (owner, 30.07). The month is the one that carries
// the relative-age effect; the DAY exists so the week the family congratulates her on is the right week.
//
// ⚠ THE DAY LIST FOLLOWS THE MONTH, and the day CLAMPS when the month shrinks under it. Picking 31 March
// and then switching to February would otherwise leave an impossible date sitting in the profile, and it
// would only surface much later as a birthday landing in the wrong week. February is 28: her birth year is
// the band's, which is never a leap year, so the 29th is not a date she could have been born on.
const birthDays = computed(() => Array.from({ length: daysInBirthMonth(profile.birthMonth) }, (_, i) => i + 1))
watch(
  () => profile.birthMonth,
  (m) => {
    const max = daysInBirthMonth(m)
    // ⚠ THE `Number.isFinite` ARM IS NOT DEFENSIVE NOISE. `v-model.number` on a `<select>` yields NaN if the
    // bound value ever fails to match an option, and `NaN > max` is FALSE - so a plain `>` clamp would let
    // it through and a NaN would end up in the PERSISTED profile, where it poisons every date derived from
    // it. Vue's default `pre` flush means this watcher runs before the day list re-renders, so a real user
    // cannot reach that state; a probe of mine did, by assigning an option that did not exist, and a field
    // that goes into a save is worth one comparison.
    if (!Number.isFinite(profile.birthDay) || profile.birthDay > max) profile.birthDay = Math.min(max, 15)
  },
)

const countryChosen = computed(() => profile.country !== '')
const nameValid = computed(() => profile.kidName.trim().length > 0)
const nextDisabled = computed(
  () => (step.value === 2 && !nameValid.value) || (step.value === 3 && !countryChosen.value),
)

const head = computed(() => STEP_HEADS[step.value - 1])
const birthMonthLabel = computed(() => `${MONTHS[profile.birthMonth - 1] ?? ''} ${profile.birthDay}`)
const backgroundLabel = computed(() => BACKGROUNDS.find((b) => b.id === profile.background)?.label ?? '')
const coachingLabel = computed(() => COACH_OPTIONS.find((c) => c.id === profile.coachTier)?.label ?? '')
const playStyleLabel = computed(() => PLAY_STYLES.find((s) => s.id === profile.playStyle)?.label ?? '')
const countryLabel = computed(() => COUNTRY_NAMES[profile.country] ?? profile.country)

// --- P, the country search ---------------------------------------------------
// The nine POPULAR tiles are a shortcut, not the list: typing searches all 24, and "Browse all
// countries" opens all 24 in the same grid. Three views of one set, so nothing is unreachable.
const query = ref('')
const browsingAll = ref(false)

const searching = computed(() => query.value.trim().length > 0)
const matches = computed(() => {
  const q = query.value.trim().toLowerCase()
  return COUNTRIES.filter((c) => (COUNTRY_NAMES[c] ?? c).toLowerCase().includes(q) || c.toLowerCase() === q)
})
/** What P's grid shows right now, and what its eyebrow calls it. */
const tiles = computed(() => (searching.value ? matches.value : browsingAll.value ? COUNTRIES : POPULAR_COUNTRIES))
const tilesLabel = computed(() =>
  searching.value ? IDENTITY_COPY.results : browsingAll.value ? IDENTITY_COPY.allCountries : IDENTITY_COPY.popular,
)

function back(): void {
  if (step.value > 1) step.value--
}
function next(): void {
  if (step.value < STEP_COUNT && !nextDisabled.value) step.value++
}
function reroll(): void {
  profile.kidName = randomName()
}
function rerollLast(): void {
  profile.kidLastName = randomSurname()
}
function pickCountry(code: string): void {
  profile.country = code
}
function pickBackground(id: FamilyBackground): void {
  profile.background = id
}
function pickCoach(id: CoachTier): void {
  profile.coachTier = id
}
function pickPlayStyle(id: PlayStyle): void {
  profile.playStyle = id
}
function skipToDefaults(): void {
  game.newCareer('', DEFAULT_PROFILE)
}
function start(): void {
  const finalProfile: PlayerProfile = {
    ...profile,
    kidName: profile.kidName.trim() || DEFAULT_PROFILE.kidName,
    kidLastName: profile.kidLastName.trim() || randomSurname(),
  }
  // No seed input in the wizard – the store generates a readable one (see game.ts newCareer).
  game.newCareer('', finalProfile)
}
</script>

<template>
  <div class="onboarding ob">
    <ScreenShell :gutter="22" class="ob-shell">
      <template #header>
        <!-- THE STEP RAIL. Six numbered circles joined by hairlines; the current one is the lime
             one and says which of six it is out loud, so the indicator is a progress READING and
             not decoration. -->
        <ol class="ob-steps" :aria-label="`Step ${step} of ${STEP_COUNT}`">
          <li
            v-for="n in STEP_COUNT"
            :key="n"
            class="ob-step"
            :aria-current="n === step ? 'step' : undefined"
          >
            <span class="ob-step-dot" :class="{ 'is-current': n === step }">{{ n }}</span>
          </li>
        </ol>

        <header v-if="step === 1" class="ob-head ob-head--hero">
          <h1 class="ob-hero-title">Raise a Champion.<br /><span>Together.</span></h1>
        </header>
        <header v-else class="ob-head">
          <h1 class="ob-title">{{ head.title }}</h1>
          <p class="ob-sub">{{ head.sub }}</p>
        </header>
      </template>

      <!-- ══ N. Welcome ══ -->
      <section v-if="step === 1" class="ob-pane bare ob-welcome" aria-labelledby="ob-hero-title">
        <div class="ob-copy">
          <p>You're the parent now – every choice, every dollar, every away tournament is yours to carry.</p>
          <p>{{ openingPromise }}</p>
          <p>Rackets, coaches, flights, hotels – the costs are honest, and they don't wait for a breakthrough.</p>
        </div>
        <div class="ob-art ob-art--hero">
          <img :src="HERO_ART" alt="" />
          <span class="ob-art-scrim" aria-hidden="true"></span>
        </div>
      </section>

      <!-- ══ O. Identity ══ -->
      <section v-else-if="step === 2" class="ob-pane bare ob-fields">
        <div class="ob-field">
          <label class="ob-label" for="ob-first">{{ IDENTITY_COPY.firstName }}</label>
          <div class="ob-field-row">
            <!-- The mock's fields are never empty, so its placeholder is invisible; ours can be
                 cleared, and then the placeholder is the only thing saying what Next is waiting
                 for. It costs nothing when the field is filled. -->
            <input id="ob-first" v-model="profile.kidName" class="ob-input" type="text" :placeholder="IDENTITY_COPY.firstName" autocomplete="off" />
            <button class="ob-dice" type="button" aria-label="Random first name" @click="reroll">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="4" y="4" width="16" height="16" rx="4" />
                <circle cx="9" cy="9" r="1.3" fill="currentColor" stroke="none" />
                <circle cx="15" cy="9" r="1.3" fill="currentColor" stroke="none" />
                <circle cx="9" cy="15" r="1.3" fill="currentColor" stroke="none" />
                <circle cx="15" cy="15" r="1.3" fill="currentColor" stroke="none" />
              </svg>
            </button>
          </div>
        </div>

        <div class="ob-field">
          <label class="ob-label" for="ob-last">{{ IDENTITY_COPY.lastName }}</label>
          <div class="ob-field-row">
            <input id="ob-last" v-model="profile.kidLastName" class="ob-input" type="text" :placeholder="IDENTITY_COPY.lastName" autocomplete="off" />
            <button class="ob-dice" type="button" aria-label="Random last name" @click="rerollLast">
              <!-- A different face on the second die, on purpose (the design draws three pips here). -->
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="4" y="4" width="16" height="16" rx="4" />
                <circle cx="8.4" cy="8.4" r="1.3" fill="currentColor" stroke="none" />
                <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
                <circle cx="15.6" cy="15.6" r="1.3" fill="currentColor" stroke="none" />
              </svg>
            </button>
          </div>
        </div>

        <!-- GENDER IS A READING, NOT YET A CHOICE. `PlayerProfile.gender` is the literal type
             'girl' – the boys' tour is post-v1 content – so Boy renders in the design's unselected
             state and is genuinely disabled rather than merely styled that way. -->
        <div class="ob-field">
          <span class="ob-label" id="ob-gender-label">Gender</span>
          <div class="ob-pair" role="group" aria-labelledby="ob-gender-label">
            <button class="ob-pick is-on" type="button" aria-pressed="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="8.5" r="4" /><path d="M12 12.5V21" /><path d="M8.5 17.5h7" />
              </svg>
              <span>Girl</span>
            </button>
            <button class="ob-pick" type="button" disabled aria-pressed="false" title="The boys' tour is coming later">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="10.5" cy="13.5" r="4.5" /><path d="M14 10l5.5-5.5" /><path d="M15 4.5h4.5V9" />
              </svg>
              <span>Boy</span>
            </button>
          </div>
        </div>

        <!-- HER BIRTHDAY, ON ONE LINE (owner's call, 30.07). I had shipped these as two stacked fields,
             arguing that at 375px a month name and a day beside each other either truncate the month or
             shrink both taps. He is right that it is one fact and should read as one, and the width
             argument is answerable rather than fatal - so it is answered instead of asserted:

               * ONE LABEL for the pair. It is a date, not two settings, and two labels were the real tell
                 that the old layout had it wrong. The selects carry `aria-label`, so a screen reader still
                 hears which is which.
               * THE MONTH GETS THE ROOM IT NEEDS: a 1.5fr / 1fr grid, because "September" is nine
                 characters and a day is at most two. Sized off the longest label, not split evenly.
               * THE DAY DROPS ITS ICON. Two calendar glyphs on one line is noise, and the day's 19px was
                 exactly the width the month was short of. The row keeps one icon, on the left, for the
                 pair - which is what a date field looks like anyway.
             Measured in the browser at 375px: no truncation, and both taps stay full-height. -->
        <div class="ob-field">
          <label class="ob-label" for="ob-month">{{ IDENTITY_COPY.birthday }}</label>
          <div class="ob-birthday">
            <div class="ob-select-wrap">
              <svg class="ob-select-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
              </svg>
              <select id="ob-month" v-model.number="profile.birthMonth" class="ob-select" :aria-label="IDENTITY_COPY.birthMonth">
                <option v-for="(m, i) in MONTHS" :key="m" :value="i + 1">{{ m }}</option>
              </select>
              <svg class="ob-select-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M6 9.5l6 6 6-6" />
              </svg>
            </div>
            <div class="ob-select-wrap">
              <select id="ob-day" v-model.number="profile.birthDay" class="ob-select" :aria-label="IDENTITY_COPY.birthDay">
                <option v-for="d in birthDays" :key="d" :value="d">{{ d }}</option>
              </select>
              <svg class="ob-select-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M6 9.5l6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>

        <Card class="ob-note" variant="gradient" pad="13px 14px">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" /><path d="M12 11v5.5" />
            <circle cx="12" cy="7.8" r="0.9" fill="currentColor" stroke="none" />
          </svg>
          <!-- ⚠ REWRITTEN, AND THE OLD LINE WAS A PROMISE RATHER THAN A FACT. It read "Birth month affects
               junior age-group dynamics and development" when the month fed exactly one cosmetic line on
               screen C. It is load-bearing now (docs/specs/relative-age.md), so it says what it does -
               and it says BOTH sides, because January is not simply better. Measured: an older-in-band
               girl finishes ~6 rank places higher; a younger one loses ~5 fewer weeks to injury. -->
          <span>
            Age groups go by year, so an older girl is stronger now – and a younger one has more room
            later, and loses fewer weeks. The day is for her birthday.
          </span>
        </Card>
      </section>

      <!-- ══ P. Country ══ -->
      <section v-else-if="step === 3" class="ob-pane bare ob-country">
        <div class="ob-search">
          <input
            v-model="query"
            class="ob-input ob-search-input"
            type="text"
            :placeholder="IDENTITY_COPY.searchPlaceholder"
            :aria-label="IDENTITY_COPY.searchLabel"
            autocomplete="off"
          />
          <svg class="ob-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="10.8" cy="10.8" r="6.3" /><path d="M15.5 15.5L20 20" />
          </svg>
        </div>

        <Eyebrow as="h2" class="ob-eyebrow" :class="{ 'is-muted': searching || browsingAll }">
          {{ tilesLabel }}
        </Eyebrow>

        <div class="ob-tiles">
          <Card
            v-for="code in tiles"
            :key="code"
            as="button"
            class="ob-tile"
            :class="{ 'is-on': profile.country === code }"
            pad="13px 6px"
            :aria-pressed="profile.country === code"
            @click="pickCountry(code)"
          >
            <span class="ob-flag">{{ flagEmoji(code) }}</span>
            <span class="ob-tile-name">{{ COUNTRY_NAMES[code] }}</span>
          </Card>
        </div>
        <p v-if="searching && !matches.length" class="ob-empty">{{ IDENTITY_COPY.noMatches }}</p>

        <template v-if="!searching && !browsingAll">
          <Eyebrow as="h2" class="ob-eyebrow is-muted">{{ IDENTITY_COPY.allCountries }}</Eyebrow>
          <Card as="button" class="ob-browse" pad="15px 16px" @click="browsingAll = true">
            <span>{{ IDENTITY_COPY.browseAll }}</span>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M9.5 6l6 6-6 6" />
            </svg>
          </Card>
        </template>
      </section>

      <!-- ══ Q. Family & Coaching ══ -->
      <section v-else-if="step === 4" class="ob-pane bare ob-family">
        <Eyebrow as="h2" class="ob-eyebrow">Family background</Eyebrow>
        <div class="ob-stack" role="group" aria-label="Family background">
          <Card
            v-for="b in BACKGROUNDS"
            :key="b.id"
            as="button"
            class="ob-row"
            :class="{ 'is-on': profile.background === b.id }"
            pad="14px 15px"
            :aria-pressed="profile.background === b.id"
            @click="pickBackground(b.id)"
          >
            <span class="ob-row-icon" aria-hidden="true">
              <svg v-if="b.id === 'wealthy'" width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 4h12l3.5 5-9.5 11L2.5 9z" /><path d="M2.5 9h19" /><path d="M9.5 4l2.5 5 2.5-5" />
              </svg>
              <svg v-else-if="b.id === 'middle'" width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="8.5" cy="8" r="3.2" /><circle cx="16" cy="9" r="2.6" />
                <path d="M3 19c0-2.8 2.5-4.6 5.5-4.6s5.5 1.8 5.5 4.6" /><path d="M15 14.6c3 0 5 1.6 5 4.4" />
              </svg>
              <svg v-else width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="6.5" width="18" height="12" rx="3" />
                <path d="M3 10.5h13a2 2 0 0 1 0 4H3" />
                <circle cx="16.5" cy="12.5" r="0.9" fill="currentColor" stroke="none" />
              </svg>
            </span>
            <span class="ob-row-text">
              <span class="ob-row-title">{{ b.label }}</span>
              <span class="ob-row-money"><b>{{ b.budget }}</b> starting budget</span>
              <span class="ob-row-blurb">{{ b.blurb }}</span>
            </span>
            <svg v-if="profile.background === b.id" class="ob-check" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" /><path d="M8 12.4l2.6 2.6L16 9.5" />
            </svg>
          </Card>
        </div>

        <Eyebrow as="h2" class="ob-eyebrow">Coaching</Eyebrow>
        <div class="ob-pair" role="group" aria-label="Coaching">
          <Card
            v-for="c in COACH_OPTIONS"
            :key="c.id"
            as="button"
            class="ob-cell"
            :class="{ 'is-on': profile.coachTier === c.id }"
            pad="16px 12px"
            :aria-pressed="profile.coachTier === c.id"
            @click="pickCoach(c.id)"
          >
            <span class="ob-cell-icon" aria-hidden="true">
              <svg v-if="c.id === 'self'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 14.5a8 8 0 0 1 16 0" /><path d="M4 14.5h16.5a1.5 1.5 0 0 1 0 3H4z" /><path d="M12 6.5v8" />
              </svg>
              <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="7" r="3.4" /><path d="M5.5 20c0-3.4 2.9-5.4 6.5-5.4s6.5 2 6.5 5.4" /><path d="M16.5 11.5l2.5-2" />
              </svg>
            </span>
            <span class="ob-cell-title">{{ c.label }}</span>
            <span class="ob-cell-blurb">{{ c.blurb }}</span>
          </Card>
        </div>
      </section>

      <!-- ══ R. Play Style ══ -->
      <section v-else-if="step === 5" class="ob-pane bare ob-styles" role="group" aria-label="Play style">
        <Card
          v-for="s in PLAY_STYLES"
          :key="s.id"
          as="button"
          class="ob-style"
          :class="{ 'is-on': profile.playStyle === s.id }"
          :style="{ '--tone': `var(--style-${s.id})` }"
          pad="12px 14px"
          :aria-pressed="profile.playStyle === s.id"
          @click="pickPlayStyle(s.id)"
        >
          <span class="ob-pose" aria-hidden="true">
            <i class="ob-pose-fig" :style="{ '--pose': `url(${poseUrl(s.id)})` }"></i>
          </span>
          <span class="ob-style-text">
            <span class="ob-style-title">{{ s.label }}</span>
            <span class="ob-style-blurb">{{ s.blurb }}</span>
            <span class="ob-chips">
              <span v-for="chip in s.chips" :key="chip" class="ob-chip">{{ chip }}</span>
            </span>
          </span>
          <svg class="ob-radar" width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
            <polygon :points="RADAR_OUTER" class="ob-radar-ring" />
            <polygon :points="RADAR_INNER" class="ob-radar-ring ob-radar-ring--inner" />
            <polygon :points="s.radar" class="ob-radar-data" />
          </svg>
        </Card>
      </section>

      <!-- ══ S. Summary ══ -->
      <section v-else class="ob-pane bare ob-summary">
        <div class="ob-art ob-art--summary">
          <img :src="SUMMARY_ART" alt="Your champion, on the day she first walks into the club" />
        </div>

        <Card class="ob-sheet" pad="0">
          <dl class="ob-sheet-list">
            <div class="ob-line">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="8.5" r="3.6" /><path d="M5.5 20c0-3.6 3-5.6 6.5-5.6s6.5 2 6.5 5.6" />
              </svg>
              <dt>Name</dt>
              <dd>{{ profile.kidName }} {{ profile.kidLastName }}</dd>
            </div>
            <div class="ob-line">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" /><path d="M3.2 12h17.6" /><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z" />
              </svg>
              <dt>Country</dt>
              <dd>{{ countryLabel }} <span class="ob-flag ob-flag--sm">{{ flagEmoji(profile.country) }}</span></dd>
            </div>
            <div class="ob-line">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
              </svg>
              <dt>Birth month</dt>
              <dd>{{ birthMonthLabel }}</dd>
            </div>
            <div class="ob-line">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="8.5" cy="8" r="3.2" /><circle cx="16" cy="9" r="2.6" />
                <path d="M3 19c0-2.8 2.5-4.6 5.5-4.6s5.5 1.8 5.5 4.6" /><path d="M15 14.6c3 0 5 1.6 5 4.4" />
              </svg>
              <dt>Background</dt>
              <dd>{{ backgroundLabel }}</dd>
            </div>
            <div class="ob-line">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M4 14.5a8 8 0 0 1 16 0" /><path d="M4 14.5h16.5a1.5 1.5 0 0 1 0 3H4z" />
              </svg>
              <dt>Coaching</dt>
              <dd>{{ coachingLabel }}</dd>
            </div>
            <div class="ob-line">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="16.5" cy="5.5" r="2.2" /><path d="M14.5 9l-3.5 3 2 3-1.5 5" /><path d="M11 12L7 13.5 5 18" /><path d="M14.5 9l3 2.5 2.5-.5" />
              </svg>
              <dt>Play style</dt>
              <dd class="ob-accent">{{ playStyleLabel }}</dd>
            </div>
          </dl>
        </Card>

        <p class="ob-vow">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 20C8.5 17.4 3.5 14 3.5 9.6A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8.5 2.6c0 4.4-5 7.8-8.5 10.4z" />
          </svg>
          <span>Every practice. Every match. Every choice. You've got this.</span>
        </p>

        <p v-if="game.error" class="error">{{ game.error }}</p>
      </section>

      <template #footer>
        <!-- N alone ends with one wide affirmative and a quiet line under it – there is nothing to
             go BACK to from the first step, so the quiet line is Skip. O through S all carry the
             same Back / affirmative pair. Same footer element, three fillings.
             ⚠ NO TENNIS BALL ON ANY OF THEM - the owner's 29.07 ruling (quoted on the script
             side): drop that little ball from every onboarding button, it is not needed there.
             The design draws the glyph beside every CTA word; it
             was decoration on a button whose word already says what it does, and it is gone from
             all three. It is NOT gone from the rest of the app - `.ball-icon` in src/style.css is
             the splash's mark and belongs to nobody here. -->
        <div v-if="step === 1" class="ob-foot ob-foot--solo">
          <PrimaryPill variant="cta" class="ob-cta ob-cta--wide" @click="next">
            <span>Begin</span>
          </PrimaryPill>
          <button class="ob-quiet" type="button" @click="skipToDefaults">Skip for now</button>
        </div>

        <!-- ⚠ S CARRIES THE SAME BACK / AFFIRMATIVE PAIR AS THE STEP BEFORE IT (owner, 29.07:
             the owner: mockup S has no Back button - follow the previous step, with the start button a
             little larger than Next). The design draws no Back on S at all, and we had
             it as the quiet underlined line where N puts Skip; it is now the same pill R uses, in
             the same place, so walking back out of the summary is the same gesture it was on every
             step before. Start career is the ONE button in the flow that begins a career rather
             than advancing a step, and `--start` is the size that says so. -->
        <div v-else-if="step === STEP_COUNT" class="ob-foot">
          <button class="ob-back" type="button" @click="back">Back</button>
          <PrimaryPill variant="cta" class="ob-cta ob-cta--start" :disabled="game.busy" @click="start">
            <span>Start career</span>
          </PrimaryPill>
        </div>

        <div v-else class="ob-foot">
          <button class="ob-back" type="button" @click="back">Back</button>
          <PrimaryPill variant="cta" class="ob-cta" :disabled="nextDisabled" @click="next">
            <span>Next</span>
          </PrimaryPill>
        </div>
      </template>
    </ScreenShell>
  </div>
</template>

<style scoped>
/* ⚠ THE FOUR PLAY-STYLE COLOURS USED TO BE DECLARED HERE, on `.ob`, and they have GRADUATED to
   `src/style.css`'s :root as `--style-aggressive` / `--style-counterpuncher` / `--style-serve-first`
   / `--style-all-court`. The old block said "if a second screen ever needs them they graduate";
   what actually forced it was the owner asking what these tokens were for at all (29.07), and the
   answer being that `docs/design/tokens.css` is a reference nobody imports, so a design token only
   exists if some screen hand-copies it - which is two sources of truth and a manual sync that fails
   silently. tests/design-tokens.test.ts is the gate that now makes that impossible to ship.
   The names moved to the `playStyle` ids for the same reason the pose files did: one vocabulary. */

/* `.onboarding` (shared with the splash and the tournament flow) already fixes this to the
   viewport as a column; the shell takes what is left of it.

   ⚠ AND IT IS CAPPED AT THE APP'S OWN WIDTH (R14-9, the owner: onboarding is not width-capped on
   desktop, unlike every other screen). It never was, and the reason is structural rather than an
   oversight: the cap lives on `#app`, and `.onboarding` is a `position: fixed` takeover pinned to
   the viewport, so this wizard is the one screen in the game that hangs OUTSIDE the frame every
   other screen inherits. On a 1440px display the rail, the headings, the fields and the footer pair
   all ran the full width while the tab shell behind them was 880.

   The cap is `--app-max-width` – the SAME declaration `#app` uses, named in src/style.css for this
   call site – and not a second number of this screen's own. It goes on the shell rather than on
   `.onboarding` because the takeover is also what paints the page behind it: capping the painted box
   would letterbox the wizard in the page colour instead of centring its column on it.
   `margin-inline: auto` is the centring half - a flex item with a max-width is left-aligned in a
   column container until it is told otherwise, which is `margin: 0 auto`'s job on `#app` too. */
.ob-shell {
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: var(--app-max-width);
  margin-inline: auto;
}

/* --- the step rail --------------------------------------------------------- */
.ob-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 0;
  padding: calc(28px + env(safe-area-inset-top, 0px)) 0 0;
  list-style: none;
}

.ob-step {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* The rail BETWEEN two steps. `--ring-track` is the app's "unlit part of a progress indicator",
   which is exactly what an untravelled segment is - so the rail and the inactive circles below
   read at the same weight as every other progress track in the app. */
.ob-step + .ob-step::before {
  content: '';
  flex: none;
  width: 14px;
  height: 1.5px;
  background: var(--ring-track);
}

.ob-step-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid var(--ring-track);
  font-size: 10px;
  font-weight: 600;
  color: var(--ink-dim);
  font-variant-numeric: tabular-nums;
}

.ob-step-dot.is-current {
  width: 22px;
  height: 22px;
  border-color: transparent;
  background: var(--accent);
  color: var(--on-lime);
  font-size: 11px;
  font-weight: 800;
}

/* --- the step head --------------------------------------------------------- */
.ob-head {
  padding: 24px 0 0;
}

.ob-head--hero {
  padding: 26px 0 0;
}

/* ⚠ TITLE CASE, NOT CAPS (owner, 29.07: «не капс локом, а просто каждое слово с большой буквы, как
   в остальных всех экранах»). The mock draws every one of these six shouted – "CHOOSE PLAY STYLE" –
   and no other screen in the app does: Season Planner, Family Budget and Coach Market are all set in
   Title Case at this size. So the transform is gone and the STRINGS in STEP_HEADS carry the case
   they render in. Deliberately NOT `text-transform: capitalize`, which would also raise the "a" in
   "Raise a Champion" and would leave the source reading in a case the screen does not.
   The same note answers the other half of his message: the face here was ALREADY Sora
   (`--font-heading`) rather than Manrope, on both of these rules – verified computed in the
   browser, not just read off the sheet. Only the case was wrong. */
.ob-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--ink);
}

.ob-sub {
  margin: 6px 0 0;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--muted);
}

/* N's display headline. Same ruling as `.ob-title` above – the caps are gone, the string carries
   the case. It is bigger and tracked tighter than a screen title because it is a headline and not
   a signpost; that difference predates the owner's note and is not what he was pointing at. */
.ob-hero-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: var(--ink);
}

.ob-hero-title span {
  color: var(--accent);
}

/* --- the pane -------------------------------------------------------------- */
/* Every step's content is a column that takes the height between head and footer. Q5 (owner,
   29.07): fidelity to the composition, and real content may scroll - so it scrolls rather than
   crushing when a phone is shorter than the 844pt the design was drawn at. */
.ob-pane {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  /* Bar hidden, like the draw's two scrollers - the owner's standing call: users will work out
     that it scrolls, and a desktop scrollbar would eat 15px out of a 22px gutter. */
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  /* `bare` in the template strips the app's default `section` furniture (panel, hairline, 16px
     inset); its bottom margin is the one piece it does not, and a takeover has no rhythm gap.
     ⚠ THE SCROLLPORT HAS TO HOLD THE FOCUS RING - THE OTHER HALF OF THE OWNER'S BORDER OVERLAP
     (30.07). This pane is `overflow-y: auto`, and an `overflow` other than `visible` clips on BOTH
     axes whatever the used value of the other one is. Its content box was exactly its children's
     box - 22 to 353 at 375pt - and an `outline` is painted OUTSIDE the border box, so every ring in
     the wizard was sliced off flush at the gutters: measured, the ring on a full-width control
     wanted 18 to 357 against a clip box of 22 to 353, i.e. 4px amputated on each side, which is why
     a focused row read as a border running into the edge of the screen rather than as a ring.
     The old `padding-bottom: 2px` was this same bug, seen once, on one axis, and fixed one pixel
     short: a 2px ring at a 2px offset needs 4, and the ring is a hairline now, so 3 is exact.
     3px of inset all round, cancelled by 3px of negative margin on the two axes that have a
     composition to keep, so the CHILDREN do not move: the design's 22px gutter is untouched and only
     the clip box grows. */
  margin: -3px -3px 0;
  padding: 3px;
}

.ob-pane::-webkit-scrollbar {
  display: none;
}

/* ══ N. Welcome ══ */
.ob-copy {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 20px;
  font-size: 14.5px;
  font-weight: 500;
  line-height: 1.5;
  color: var(--ink-soft);
  text-wrap: pretty;
}

.ob-copy p {
  margin: 0;
}

/* THE PHOTOGRAPH FILLS A FRAME IT DID NOT SIZE. The frame takes what the column leaves it; the
   painting covers it and is cropped to the face. (The app's shared `img` rule for this is a
   selector list of five specific class names in `src/style.css` - joining it would mean editing
   the sheet six agents share this week, so the four declarations are restated here.) */
.ob-art {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-card);
}

.ob-art img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 18%;
}

.ob-art--hero {
  flex: 1;
  min-height: 140px;
  margin-top: 20px;
}

/* The design's bottom scrim, so the CTA below has something to sit against rather than a hard
   photographic edge. */
.ob-art-scrim {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(15, 23, 32, 0) 62%, rgba(15, 23, 32, 0.45) 100%);
}

/* ══ O. Identity ══ */
.ob-fields {
  gap: 16px;
  padding-top: 22px;
}

.ob-field {
  flex: none;
}

.ob-label {
  display: block;
  margin-bottom: 8px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-soft);
}

.ob-field-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* The design's field: a panel-toned box on the page, not the app's default dark input well. */
.ob-input {
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  padding: 14px 15px;
  border-radius: var(--radius-dialog);
  background: var(--card-top);
  border: 1px solid var(--line);
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
}

.ob-input::placeholder {
  font-weight: 500;
  color: var(--ink-dim);
}

.ob-dice {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  padding: 0;
  border-radius: var(--radius-dialog);
  background: var(--card-top);
  border: 1px solid var(--line);
  color: var(--accent);
}

.ob-dice:hover:not(:disabled) {
  color: var(--accent);
  border-color: var(--accent);
}

/* Two side-by-side choices: O's gender pair and Q's coaching pair are the same grid. */
.ob-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.ob-pick {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 13px 10px;
  border-radius: var(--radius-dialog);
  background: var(--card-top);
  border: 1px solid var(--line);
  font-size: 14px;
  font-weight: 600;
  color: var(--muted);
}

.ob-pick.is-on {
  background: var(--accent-fill);
  border-color: var(--accent);
  font-weight: 700;
  color: var(--accent);
}

/* A disabled choice must still be READABLE - the global button:disabled dim would sink Boy below
   the page. It reads as "not chosen" in the design's own unselected tone, and the disabled
   attribute (not a class) is what tells everyone else it cannot be taken. */
.ob-pick:disabled {
  opacity: 1;
}

/* HER BIRTHDAY: month and day on one line. The columns are sized off the LONGEST label ("September",
   nine characters) against a day's two - an even split truncates the month, which is the thing that made
   me stack them in the first place. `min-width: 0` on the wrap is what lets the grid actually shrink the
   column instead of the select's intrinsic width winning and overflowing the row. */
.ob-birthday {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 10px;
}

.ob-birthday .ob-select-wrap {
  min-width: 0;
}

.ob-select-wrap {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 14px 15px;
  border-radius: var(--radius-dialog);
  background: var(--card-top);
  border: 1px solid var(--line);
  color: var(--muted);
}

/* ⚠ THE RING IS THE APP'S NOW - src/style.css declares `:focus-visible` once - but THIS RULE STILL
   HAS TO SPELL IT OUT, and the reason is worth writing down because the obvious shortcut is wrong.
   The fact protected here is not the ring: a real `<select>` is the focusable thing, while the BOX
   the player sees is this wrapper (the select's own chrome is turned off), so the ring must be drawn
   on the PARENT. And the parent is not itself `:focus-visible` - so the app's rule never matches it,
   and hoisting with `outline-style: solid` alone would draw the ring at the CSS INITIAL width and
   offset instead: `medium`, which is 3px, at 0. Three times the app's ring, on the one control in the
   wizard that needs the hoist.
   The declarations are repeated; the VALUE is not, because it is the same token. That is the whole
   point of --stroke-hair, and tests/ui-control-system.test.ts bans a px LITERAL here rather than
   banning the property. Verified in the browser with real keyboard focus: solid 1px at a 2px offset,
   0px clipped at either gutter. */
.ob-select-wrap:has(.ob-select:focus-visible) {
  outline: var(--stroke-hair) solid var(--accent);
  outline-offset: 2px;
}

/* A REAL <select>, so the phone opens its own picker and the keyboard reaches it; the box around
   it is the design's, and the native chrome is turned off rather than reimplemented. */
.ob-select {
  flex: 1;
  min-width: 0;
  appearance: none;
  padding: 0;
  border: none;
  background: transparent;
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
  outline: none;
}

.ob-select-icon,
.ob-select-chevron {
  flex: none;
}

.ob-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--muted);
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1.42;
  text-wrap: pretty;
}

.ob-note svg {
  flex: none;
  margin-top: 1px;
}

/* ══ P. Country ══ */
.ob-country {
  gap: 12px;
  padding-top: 22px;
}

.ob-search {
  position: relative;
  flex: none;
  display: flex;
}

.ob-search-input {
  padding-right: 46px;
  font-weight: 500;
  font-size: 14.5px;
}

.ob-search-icon {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--muted);
}

/* The lime kicker is the section that MATTERS (Popular); the ones that only name a container
   (All countries, Results) are the app's muted label instead - they are different objects.
   Descendant selectors throughout this block, and on every Card below: a bare `.ob-thing` ties on
   specificity with the component's own `.tb-eyebrow` / `.tb-card` and would then be decided by
   stylesheet injection order, which is not a thing to bet a screen on. */
.ob-pane .ob-eyebrow {
  flex: none;
  margin-top: 12px;
}

.ob-pane .ob-eyebrow.is-muted {
  font-size: var(--label-size);
  letter-spacing: var(--label-track);
  font-weight: 600;
  color: var(--muted);
}

.ob-tiles {
  flex: none;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 11px;
}

.ob-tiles .ob-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
  border-radius: var(--radius-frame);
}

.ob-tile.is-on {
  background: var(--accent-fill);
  border-color: var(--accent);
}

.ob-tile-name {
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.25;
  color: var(--ink-2);
  text-align: center;
}

.ob-tile.is-on .ob-tile-name {
  color: var(--accent);
}

/* The flag is an emoji everywhere else in this app (Home, the Kid screen, the draw), so it is an
   emoji here too rather than a tenth way to draw a flag. The box is the design's 34x23. */
.ob-flag {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 23px;
  overflow: hidden;
  border-radius: var(--radius-mark);
  font-size: 21px;
  line-height: 1;
}

.ob-flag--sm {
  width: 22px;
  height: 15px;
  font-size: 14px;
}

.ob-country .ob-browse {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: var(--radius-frame);
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-2);
  text-align: left;
}

.ob-browse span {
  flex: 1;
}

.ob-browse svg {
  flex: none;
  color: var(--muted);
}

.ob-empty {
  flex: none;
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--muted);
}

/* ══ Q. Family & Coaching ══ */
.ob-family {
  padding-top: 22px;
}

.ob-stack {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.ob-stack .ob-row {
  display: flex;
  align-items: center;
  gap: 13px;
  border-radius: var(--radius-frame);
  text-align: left;
}

.ob-row-icon {
  flex: none;
  display: flex;
  color: var(--muted);
}

.ob-row.is-on {
  background: var(--accent-fill);
  border-color: var(--accent);
}

.ob-row.is-on .ob-row-icon,
.ob-row .ob-check {
  color: var(--accent);
}

.ob-row-text {
  flex: 1;
  min-width: 0;
  display: block;
}

.ob-row-title {
  display: block;
  font-size: 14.5px;
  font-weight: 700;
  color: var(--ink);
}

.ob-row-money {
  display: block;
  margin-top: 3px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--muted);
}

.ob-row-money b {
  font-weight: 700;
  color: var(--accent);
}

.ob-row-blurb {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-dim);
}

.ob-row.is-on .ob-row-blurb {
  color: var(--ink-soft);
}

.ob-check {
  flex: none;
}

.ob-pair .ob-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
  border-radius: var(--radius-frame);
}

.ob-cell.is-on {
  background: var(--accent-fill);
  border-color: var(--accent);
}

.ob-cell-icon {
  display: flex;
  color: var(--muted);
}

.ob-cell.is-on .ob-cell-icon {
  color: var(--accent);
}

.ob-cell-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--ink);
  text-align: center;
}

.ob-cell-blurb {
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--muted);
  text-align: center;
  text-wrap: pretty;
}

.ob-cell.is-on .ob-cell-blurb {
  color: var(--ink-soft);
}

/* ══ R. Play Style ══ */
/* Four cards dividing the height between them: the composition is the comparison, so no card is
   taller than another and all four are on screen at once. `min-height` is the floor at which they
   stop shrinking and the column starts scrolling instead. */
.ob-styles {
  gap: 11px;
  padding-top: 18px;
}

.ob-styles .ob-style {
  flex: 1 1 0;
  min-height: 96px;
  display: flex;
  align-items: center;
  gap: 13px;
  border-radius: var(--radius-frame);
  text-align: left;
}

.ob-style.is-on {
  background: var(--accent-fill);
  border-color: var(--accent);
}

/* THE POSE. The four files ship as black silhouettes on transparent, which is invisible on this
   page - so the figure paints itself in the style's colour and uses the drawing as a MASK. That
   also makes the card's colour read twice, in the pose and in the radar, which is the point of
   having four colours at all. The slot is a separate element because a mask clips its own
   element entirely, backing included. */
.ob-pose {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 58px;
  border-radius: var(--radius-control);
  background: var(--line);
}

.ob-pose-fig {
  width: 38px;
  height: 38px;
  background: var(--tone);
  -webkit-mask: var(--pose) center / contain no-repeat;
  mask: var(--pose) center / contain no-repeat;
}

.ob-style-text {
  flex: 1;
  min-width: 0;
  display: block;
}

.ob-style-title {
  display: block;
  font-size: 14.5px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--ink);
}

.ob-style-blurb {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.38;
  color: var(--muted);
  text-wrap: pretty;
}

.ob-style.is-on .ob-style-blurb {
  color: var(--ink-soft);
}

.ob-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 8px;
}

.ob-chip {
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  background: var(--line);
  font-size: 10.5px;
  font-weight: 600;
  color: var(--ink-2);
}

.ob-style.is-on .ob-chip {
  background: var(--accent-fill);
  color: var(--accent);
}

.ob-radar {
  flex: none;
}

.ob-radar-ring {
  fill: none;
  stroke: var(--ring-track);
  stroke-width: 1;
}

.ob-radar-ring--inner {
  stroke: var(--line);
}

.ob-radar-data {
  fill: var(--tone);
  fill-opacity: 0.32;
  stroke: var(--tone);
  stroke-width: 1.4;
}

/* ══ S. Summary ══ */
.ob-summary {
  padding-top: 18px;
}

.ob-art--summary {
  flex: 1;
  min-height: 180px;
  max-height: 306px;
  border: 1px solid rgba(var(--accent-rgb), 0.28);
}

.ob-sheet {
  flex: none;
  margin-top: 16px;
  overflow: hidden;
}

.ob-sheet-list {
  margin: 0;
}

.ob-line {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 11px 14px;
  border-top: 1px solid var(--line);
}

.ob-line:first-child {
  border-top: none;
}

.ob-line svg {
  flex: none;
  color: var(--muted);
}

.ob-line dt {
  flex: 1;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--muted);
}

.ob-line dd {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--ink);
  text-align: right;
}

.ob-line dd.ob-accent {
  color: var(--accent);
}

/* The one handwritten line in the wizard: the promise the player is making, in the app's hand. */
.ob-vow {
  flex: none;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 16px 0 0;
  font-family: var(--font-hand);
  font-size: 19px;
  line-height: 1.3;
  color: rgba(var(--accent-rgb), 0.85);
}

.ob-vow svg {
  flex: none;
  margin-top: 3px;
  color: rgba(var(--accent-rgb), 0.7);
}

/* --- the footer ------------------------------------------------------------ */
.ob-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 0 calc(26px + env(safe-area-inset-bottom, 0px));
}

.ob-foot--solo {
  flex-direction: column;
  gap: 0;
  padding-top: 20px;
}

.ob-back {
  padding: 14px 28px;
  border-radius: var(--radius-pill);
  background: var(--card-top);
  border: 1px solid var(--line);
  font-size: 14px;
  font-weight: 700;
  color: var(--ink-2);
}

/* The export's CTA, with the design's own inset. `.primary` in the selector is what wins the tie
   against PrimaryPill's own `--cta` padding. (`gap` outlived the tennis ball it used to space; it
   costs nothing on a one-child button and is what a second element would land on.) */
.ob-cta.primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 14px 26px;
}

.ob-cta--wide.primary {
  width: 100%;
  padding: 15px 12px;
  font-size: 15px;
  box-shadow: 0 8px 24px rgba(var(--accent-rgb), 0.2);
}

/* START CAREER, ONE STEP LARGER THAN NEXT (owner, 29.07: "чуть больше Next"). Same pill, same row,
   same place – 2px more of vertical inset, 6px more of horizontal, a point more of type and a
   deeper glow. Four small moves rather than one big one, because the pair still has to sit on one
   line beside Back at 390px: this is the last button of the flow reading as MORE than a step, not
   as a different control. */
.ob-cta--start.primary {
  padding: 16px 32px;
  font-size: 15.5px;
  box-shadow: 0 10px 28px rgba(var(--accent-rgb), 0.22);
}

/* The quiet line under N's wide CTA: Skip. (It was Back on S too, until S took the pill.) */
.ob-quiet {
  margin-top: 14px;
  padding: 4px 0;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
  text-decoration: underline;
  text-decoration-color: rgba(142, 155, 164, 0.4);
  text-underline-offset: 3px;
}

.ob-quiet:hover:not(:disabled) {
  color: var(--ink-2);
  border-color: transparent;
}

/* --- keyboard reach -------------------------------------------------------- */
/* ⚠ GONE, AND THE FACT IT PROTECTED IS NOW THE APP'S. This said "every choice on O, P, Q and R is a
   real button, so every one of them is tabbable; this is the ring that says which one has the
   keyboard. The app has no global focus style, so a screen made of card-buttons has to bring its
   own." The app HAS one now - `:focus-visible` in src/style.css - so the wizard no longer brings a
   second, thicker copy of it. Its `.ob-select-wrap` hoist is above; the pane's clip room is on
   `.ob-pane`. Nothing about which controls are reachable has changed. */

@media (prefers-reduced-motion: reduce) {
  .ob-pane {
    scroll-behavior: auto;
  }
}
</style>

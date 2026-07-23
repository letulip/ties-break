<script setup lang="ts">
// Package I – full-screen character-creation wizard. Replaces the shell entirely
// until `game.newCareer(...)` resolves and a snapshot exists; App.vue then swaps
// this out for the tab shell reactively (no emit/props needed).
import { computed, reactive, ref } from 'vue'
import { useGameStore } from '../stores/game'
import { DEFAULT_PROFILE, type CoachSetup, type FamilyBackground, type PlayerProfile, type PlayStyle } from '../shared/protocol'
import { SURNAMES } from '../engine/season/cohort'

const game = useGameStore()

// Round 5 item 30: the finale (summary) step puts a face to the career about to start –
// the jun-norm portrait (public/images, full body/scene art, not the round header avatar).
const FINALE_PORTRAIT = `${import.meta.env.BASE_URL}images/fem-euro-brunnet/fem-euro-brunnet-jun-norm-fs8.webp`

const NAMES = [
  'Vera', 'Alexandra', 'Maria', 'Elena', 'Sofia', 'Anna', 'Iga', 'Coco', 'Aryna', 'Mirra',
  'Emma', 'Olivia', 'Zoe', 'Lea', 'Carla', 'Bianca', 'Naomi', 'Yuki', 'Ines', 'Petra',
  'Milena', 'Dana', 'Lucia', 'Amelie',
]

const COUNTRIES = [
  'US', 'GB', 'FR', 'ES', 'IT', 'DE', 'RU', 'RS', 'CH', 'CZ', 'PL', 'UA',
  'KZ', 'BY', 'AU', 'JP', 'CN', 'KR', 'IN', 'BR', 'AR', 'CA', 'NL', 'SE',
]

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States', GB: 'United Kingdom', FR: 'France', ES: 'Spain', IT: 'Italy', DE: 'Germany',
  RU: 'Russia', RS: 'Serbia', CH: 'Switzerland', CZ: 'Czechia', PL: 'Poland', UA: 'Ukraine',
  KZ: 'Kazakhstan', BY: 'Belarus', AU: 'Australia', JP: 'Japan', CN: 'China', KR: 'South Korea',
  IN: 'India', BR: 'Brazil', AR: 'Argentina', CA: 'Canada', NL: 'Netherlands', SE: 'Sweden',
}

const BACKGROUNDS: { id: FamilyBackground; label: string; budget: string; blurb: string }[] = [
  { id: 'wealthy', label: 'Wealthy', budget: '$120,000', blurb: "Academies are affordable – the pressure isn't." },
  { id: 'middle', label: 'Middle class', budget: '$25,000', blurb: 'Every season is a choice.' },
  { id: 'working', label: 'Working class', budget: '$8,000', blurb: 'Used rackets, big dreams – hard mode.' },
]

const COACH_OPTIONS: { id: CoachSetup; label: string; blurb: string }[] = [
  { id: 'parent', label: 'Coach her yourself', blurb: 'Cheaper weeks – between-set coaching unlocks later.' },
  { id: 'hired', label: 'Hire a coach', blurb: 'Pro guidance, real fees.' },
]

// An inclination, not numbers: weights future skill growth (Phase 4).
const PLAY_STYLES: { id: PlayStyle; label: string; blurb: string }[] = [
  { id: 'aggressive', label: 'Aggressive baseliner', blurb: 'Dictate with heavy groundstrokes.' },
  { id: 'counterpuncher', label: 'Counterpuncher', blurb: 'Speed, defense, patience.' },
  { id: 'serve-first', label: 'Big serve', blurb: 'Free points first.' },
  { id: 'all-court', label: 'All-court', blurb: 'No weaknesses, no shortcuts.' },
]

function randomName(): string {
  return NAMES[Math.floor(Math.random() * NAMES.length)]
}

function randomSurname(): string {
  return SURNAMES[Math.floor(Math.random() * SURNAMES.length)]
}

function flagEmoji(code: string): string {
  if (!code) return ''
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

const STEP_COUNT = 7
const step = ref(1)

const profile = reactive<PlayerProfile>({
  kidName: randomName(),
  kidLastName: randomSurname(),
  gender: 'girl',
  country: '',
  background: 'middle',
  coachSetup: 'hired',
  playStyle: 'all-court',
})

const countryChosen = computed(() => profile.country !== '')
const nameValid = computed(() => profile.kidName.trim().length > 0)
const nextDisabled = computed(
  () => (step.value === 2 && !nameValid.value) || (step.value === 3 && !countryChosen.value),
)

const backgroundLabel = computed(() => BACKGROUNDS.find((b) => b.id === profile.background)?.label ?? '')
const coachingLabel = computed(() => COACH_OPTIONS.find((c) => c.id === profile.coachSetup)?.label ?? '')
const playStyleLabel = computed(() => PLAY_STYLES.find((s) => s.id === profile.playStyle)?.label ?? '')

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
function pickCoach(id: CoachSetup): void {
  profile.coachSetup = id
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
  <div class="onboarding">
    <div class="onboarding-dots">
      <span v-for="n in STEP_COUNT" :key="n" class="dot" :class="{ active: n === step }"></span>
    </div>

    <div class="onboarding-body">
      <section v-if="step === 1" class="onboarding-step">
        <h2>Raise a champion</h2>
        <p>You're the parent now – every choice, every dollar, every away tournament is yours to carry.</p>
        <p>Your kid has real talent. Whether it becomes a career is a different question.</p>
        <p>Rackets, coaches, flights, hotels – the costs are honest, and they don't wait for a breakthrough.</p>
        <div class="onboarding-actions">
          <button class="primary" @click="next">Begin</button>
        </div>
        <button class="link" @click="skipToDefaults">Skip – demo defaults</button>
      </section>

      <section v-else-if="step === 2" class="onboarding-step">
        <h2>Name &amp; gender</h2>
        <div class="controls">
          <input v-model="profile.kidName" type="text" placeholder="First name" />
          <button title="Reroll first name" @click="reroll">🎲</button>
        </div>
        <div class="controls" style="margin-top: 8px">
          <input v-model="profile.kidLastName" type="text" placeholder="Last name" />
          <button title="Reroll last name" @click="rerollLast">🎲</button>
        </div>
        <div class="option-row">
          <span class="option-pill selected">Girl</span>
          <button class="option-pill" disabled title="Coming later">Boy – coming later</button>
        </div>
      </section>

      <section v-else-if="step === 3" class="onboarding-step">
        <h2>Country</h2>
        <div class="country-grid">
          <button
            v-for="code in COUNTRIES"
            :key="code"
            class="country-tile"
            :class="{ selected: profile.country === code }"
            @click="pickCountry(code)"
          >
            <span class="flag">{{ flagEmoji(code) }}</span>
            <span class="country-name">{{ COUNTRY_NAMES[code] }}</span>
          </button>
        </div>
      </section>

      <section v-else-if="step === 4" class="onboarding-step">
        <h2>Family background</h2>
        <div class="choice-cards">
          <button
            v-for="b in BACKGROUNDS"
            :key="b.id"
            class="choice-card"
            :class="{ selected: profile.background === b.id }"
            @click="pickBackground(b.id)"
          >
            <strong>{{ b.label }}</strong>
            <span class="choice-budget">{{ b.budget }}</span>
            <span class="choice-blurb">{{ b.blurb }}</span>
          </button>
        </div>
      </section>

      <section v-else-if="step === 5" class="onboarding-step">
        <h2>Coaching</h2>
        <div class="choice-cards">
          <button
            v-for="c in COACH_OPTIONS"
            :key="c.id"
            class="choice-card"
            :class="{ selected: profile.coachSetup === c.id }"
            @click="pickCoach(c.id)"
          >
            <strong>{{ c.label }}</strong>
            <span class="choice-blurb">{{ c.blurb }}</span>
          </button>
        </div>
      </section>

      <section v-else-if="step === 6" class="onboarding-step">
        <h2>Play style</h2>
        <div class="choice-cards">
          <button
            v-for="s in PLAY_STYLES"
            :key="s.id"
            class="choice-card"
            :class="{ selected: profile.playStyle === s.id }"
            @click="pickPlayStyle(s.id)"
          >
            <strong>{{ s.label }}</strong>
            <span class="choice-blurb">{{ s.blurb }}</span>
          </button>
        </div>
      </section>

      <section v-else-if="step === 7" class="onboarding-step">
        <h2>Summary</h2>
        <img
          class="onboarding-portrait"
          :src="FINALE_PORTRAIT"
          loading="lazy"
          alt="First time on court"
        />
        <p class="onboarding-portrait-caption">First time on court – ready?</p>
        <table>
          <tbody>
            <tr>
              <th>Name</th>
              <td>{{ profile.kidName }} {{ profile.kidLastName }} {{ flagEmoji(profile.country) }}</td>
            </tr>
            <tr>
              <th>Background</th>
              <td>{{ backgroundLabel }}</td>
            </tr>
            <tr>
              <th>Coaching</th>
              <td>{{ coachingLabel }}</td>
            </tr>
            <tr>
              <th>Play style</th>
              <td>{{ playStyleLabel }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="game.error" class="error">{{ game.error }}</p>
        <div class="onboarding-actions">
          <button class="primary" :disabled="game.busy" @click="start">Start career</button>
        </div>
      </section>
    </div>

    <div v-if="step > 1" class="onboarding-nav">
      <button @click="back">Back</button>
      <button v-if="step < STEP_COUNT" class="primary" :disabled="nextDisabled" @click="next">Next</button>
    </div>
  </div>
</template>

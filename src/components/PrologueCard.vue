<script setup lang="ts">
// ONE SCREEN, AND IT DRAWS WHICHEVER ROW IT IS GIVEN – phase 2 of
// docs/specs/childhood-prologue-build-2026-09.md §7: «Cards are a table, not nine components.»
//
// ⚠⚠ IT HOLDS NO COPY. Every player-facing sentence comes from `src/prologue/cards.ts` through a
// `{{ }}` binding, and `tests/prologue-cards.test.ts` asserts that this template contains no
// sentence of its own. That is what makes replacing the owner's copy a table edit rather than a
// refactor – and it matters here more than usual, because HE HAS NOT SEEN ONE WORD OF THE NINE
// CARDS. §8: «⭐ The copy below is DRAFTED, not decided … It ships only with his word.»
//
// ⚠ WHY IT IS BUILT ON `.dialog-overlay` / `.dialog-card` RATHER THAN AS ITS OWN FULL-SCREEN BOX.
// The shared card is where round-20 #3's fix lives – `max-height: 100%; overflow-y: auto` on the
// panel, argued at length in src/style.css – and this surface is exactly the shape that produced
// that defect: a BLOCKING card with prose above the way out, which grows by one honest sentence at a
// time until Continue is off the bottom of a phone. Sitting on the shared box means the bound is
// structural from the first commit and `tests/component/fits.ts` measures the real cascade rather
// than a private copy of it. The nine cards are also the FIRST thing a new player ever sees, so a
// career that stops here stops before it starts.
//
// ⚠ AND THE CONTROLS ARE LAST IN THE FLOW, deliberately: `measureDialog` reads the dismiss control's
// box off the card's own bottom edge once the card is scrolled to its end, which is only the truth
// when nothing follows it.
//
// THE ORDER ON THE CARD, and it is the argument of §"what a card shows about her" in cards.ts: the
// scene, then what you can SEE of her (whether she is enjoying it, and what the person teaching her
// makes of it), then the answers. No number about her appears anywhere on this screen at any age.
// The formed rose is the HANDOVER's payload (§5) and phase 4's to spend.
import { computed, ref, useTemplateRef } from 'vue'
import { useDialogFocus } from '../composables/dialogFocus'
import { COUNTRIES, COUNTRY_NAMES, POPULAR_COUNTRIES, flagEmoji } from '../composables/countries'
// ⚠⚠ THE THREE FIELDS ARE THE WIZARD'S AND SO ARE THEIR WORDS. Not one label, placeholder or
// screen-reader name below is written here: they all come from `composables/identityCopy.ts`, which
// the wizard reads too, because CLAUDE.md's invariant 4 says a label is the owner's and a string
// declared twice is a string that can drift in one copy. See that module's header.
import { IDENTITY_COPY, MONTHS } from '../composables/identityCopy'
import { daysInBirthMonth } from '../shared/dates'
import type { PrologueCard, PrologueOption } from '../prologue/cards'
import type { PrologueIdentity } from '../prologue/identity'
import type { Warmth } from '../prologue/run'

const props = defineProps<{
  card: PrologueCard
  /** which arm of `her` / `coach` this run has earned – see `warmthAt` */
  warmth: Warmth
  /** the twelfth's derived reasons, empty on every other card */
  reasons?: readonly string[]
  /** ⭐ WHO SHE IS – present only while the card that asks is up (`card.identity`), and owned by the
   *  container so that walking off the card and back does not forget what was typed. */
  identity?: PrologueIdentity
  /** ⭐ PHASE 4 – THE WAY OUT OF THE PROLOGUE ENTIRELY (build spec §6: «skip -> the existing wizard»),
   *  and it is a LABEL rather than a sentence for the reason the whole card is a table: the copy is
   *  the caller's and this component still holds none. Absent on eight of the nine cards – the
   *  container offers it on the first one only, because a skip that follows you to the eighth year is
   *  a screen asking whether you would rather be somewhere else. */
  skipLabel?: string
  busy?: boolean
}>()

const emit = defineEmits<{
  /** the id of the option or origin taken, or null for a card with nothing to decide */
  (e: 'answer', id: string | null): void
  /** the player would rather have the wizard */
  (e: 'skip'): void
  /** a field of the identity was edited – the whole of it, so the container stays the owner */
  (e: 'identity', next: PrologueIdentity): void
}>()

// =================================================================================================
// WHO SHE IS – the age-5 card's three fields
// =================================================================================================
//
// ⚠ THE CONTROLS ARE THE WIZARD'S, NOT A SECOND DESIGN OF THEM: two text fields, a month/day pair
// under one label, and the country picker's three views of one list (Popular / Results / All). The
// owner asked for the existing onboarding's questions to survive into the prologue, not for new
// ones, and «do not redesign the picker» is the same instruction from the other side.

/** ⭐ ONE EMIT PER EDIT, CARRYING THE WHOLE IDENTITY. The container owns it; this component never
 *  holds a copy, so there is no second source to fall out of step with what the career is made
 *  from. `identity` is only ever absent on the eight cards that do not ask. */
function setField<K extends keyof PrologueIdentity>(key: K, value: PrologueIdentity[K]): void {
  if (!props.identity) return
  emit('identity', { ...props.identity, [key]: value })
}

/** ⚠ THE DAY LIST FOLLOWS THE MONTH, exactly as it does in the wizard, and the DAY CLAMPS when the
 *  month shrinks under it – 31 March and then February would otherwise leave an impossible date in
 *  the profile, and it would surface much later as a birthday landing in the wrong week. The clamp
 *  is applied on the way out (`settleIdentity`) as well; this one is what the player SEES. */
const birthDays = computed(() =>
  Array.from({ length: daysInBirthMonth(props.identity?.birthMonth ?? 1) }, (_, i) => i + 1),
)

function setMonth(month: number): void {
  if (!props.identity) return
  const max = daysInBirthMonth(month)
  const day = props.identity.birthDay > max ? Math.min(max, 15) : props.identity.birthDay
  emit('identity', { ...props.identity, birthMonth: month, birthDay: day })
}

// --- the country picker, the wizard's own three views of one list --------------------------------
const query = ref('')
const browsingAll = ref(false)
const searching = computed(() => query.value.trim().length > 0)
const matches = computed(() => {
  const q = query.value.trim().toLowerCase()
  return COUNTRIES.filter((c) => (COUNTRY_NAMES[c] ?? c).toLowerCase().includes(q) || c.toLowerCase() === q)
})
const tiles = computed(() => (searching.value ? matches.value : browsingAll.value ? COUNTRIES : POPULAR_COUNTRIES))
const tilesLabel = computed(() =>
  searching.value ? IDENTITY_COPY.results : browsingAll.value ? IDENTITY_COPY.allCountries : IDENTITY_COPY.popular,
)

/** ⭐ ONE LIST, THREE KINDS OF CARD. An origin card, a decision card and a quiet card all render the
 *  same column of controls, so nothing below branches on which card it is drawing and a card that
 *  changes kind changes no markup. The quiet card's single control is synthesised from
 *  `continueLabel`, which is why it has no note. */
const controls = computed<{ id: string | null; label: string; note: string }[]>(() => {
  const list: readonly PrologueOption[] | undefined = props.card.origins ?? props.card.options
  if (list) return list.map((o) => ({ id: o.id, label: o.label, note: o.note }))
  return [{ id: null, label: props.card.continueLabel, note: '' }]
})

const her = computed(() => props.card.her[props.warmth])
const coach = computed(() => props.card.coach[props.warmth])

// ⚠ NAMED `cardEl` AND NOT `card`: `<script setup>` exposes both the props and the locals to the
// template, and a local called `card` SHADOWS the `card` prop – the whole screen renders off `null`
// and every mounted test dies on `Cannot read properties of null`. Cost one run to find.
const cardEl = useTemplateRef<HTMLElement>('cardEl')
// It is a modal and it says so. Escape is passed no handler: there is no way out of a year of her
// childhood that is not an answer, which is the same reason KnockDialog and BirthdayDialog pass none.
useDialogFocus(cardEl)
</script>

<template>
  <div class="dialog-overlay">
    <div
      ref="cardEl"
      class="dialog-card prologue-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prologue-kicker prologue-title"
      tabindex="-1"
    >
      <p id="prologue-kicker" class="prologue-kicker">{{ card.kicker }}</p>
      <h2 id="prologue-title" class="prologue-title">{{ card.title }}</h2>
      <p class="prologue-lede">{{ card.lede }}</p>

      <!-- WHAT YOU CAN SEE OF HER, AND IT IS NEVER A NUMBER. Two sentences: whether she is enjoying
           it, and what the person teaching her makes of it. The full argument is in cards.ts. -->
      <div class="prologue-read">
        <p class="prologue-read-line">{{ her }}</p>
        <p class="prologue-read-line prologue-read-coach">{{ coach }}</p>
      </div>

      <!-- WHY THE TWELFTH SAYS WHAT IT READ. Present only on the fork, where a card that simply
           arrived would read as a dice roll - and there are no dice in it. -->
      <ul v-if="reasons && reasons.length" class="prologue-reasons">
        <li v-for="reason in reasons" :key="reason">{{ reason }}</li>
      </ul>

      <!-- WHO SHE IS. The wizard's three fields, in the wizard's own words, on the one card that
           asks (owner, 02.09). BEFORE the answers and never after them: `.prologue-answers` has to
           stay the card's last element or the fit measurement reads the way out off the wrong
           edge - the same rule the skip control's own note states below. -->
      <div v-if="card.identity && identity" class="prologue-identity">
        <div class="prologue-field">
          <label class="prologue-label" for="prologue-first">{{ IDENTITY_COPY.firstName }}</label>
          <input
            id="prologue-first"
            class="prologue-input"
            type="text"
            :value="identity.kidName"
            :placeholder="IDENTITY_COPY.firstName"
            autocomplete="off"
            @input="setField('kidName', ($event.target as HTMLInputElement).value)"
          />
        </div>

        <div class="prologue-field">
          <label class="prologue-label" for="prologue-last">{{ IDENTITY_COPY.lastName }}</label>
          <input
            id="prologue-last"
            class="prologue-input"
            type="text"
            :value="identity.kidLastName"
            :placeholder="IDENTITY_COPY.lastName"
            autocomplete="off"
            @input="setField('kidLastName', ($event.target as HTMLInputElement).value)"
          />
        </div>

        <!-- ONE LABEL FOR THE PAIR, which is the owner's own call on this field (30.07): it is a
             date, not two settings. The selects carry their own screen-reader names under it. -->
        <div class="prologue-field">
          <label class="prologue-label" for="prologue-month">{{ IDENTITY_COPY.birthday }}</label>
          <div class="prologue-birthday">
            <select
              id="prologue-month"
              class="prologue-select"
              :aria-label="IDENTITY_COPY.birthMonth"
              :value="identity.birthMonth"
              @change="setMonth(Number(($event.target as HTMLSelectElement).value))"
            >
              <option v-for="(m, i) in MONTHS" :key="m" :value="i + 1">{{ m }}</option>
            </select>
            <select
              id="prologue-day"
              class="prologue-select"
              :aria-label="IDENTITY_COPY.birthDay"
              :value="identity.birthDay"
              @change="setField('birthDay', Number(($event.target as HTMLSelectElement).value))"
            >
              <option v-for="d in birthDays" :key="d" :value="d">{{ d }}</option>
            </select>
          </div>
        </div>

        <!-- HER COUNTRY - the wizard's picker, not a second one: a search over all 24, nine popular
             tiles as the shortcut into that same list, and a way to open the rest. -->
        <div class="prologue-field">
          <input
            v-model="query"
            class="prologue-input"
            type="text"
            :placeholder="IDENTITY_COPY.searchPlaceholder"
            :aria-label="IDENTITY_COPY.searchLabel"
            autocomplete="off"
          />
          <p class="prologue-tiles-label">{{ tilesLabel }}</p>
          <div class="prologue-tiles">
            <button
              v-for="code in tiles"
              :key="code"
              class="prologue-tile"
              :class="{ 'is-on': identity.country === code }"
              type="button"
              :aria-pressed="identity.country === code"
              @click="setField('country', code)"
            >
              <span class="prologue-flag">{{ flagEmoji(code) }}</span>
              <span class="prologue-tile-name">{{ COUNTRY_NAMES[code] }}</span>
            </button>
          </div>
          <p v-if="searching && !matches.length" class="prologue-empty">{{ IDENTITY_COPY.noMatches }}</p>
          <button
            v-if="!searching && !browsingAll"
            class="prologue-browse"
            type="button"
            @click="browsingAll = true"
          >
            {{ IDENTITY_COPY.browseAll }}
          </button>
        </div>
      </div>

      <!-- THE ANSWERS, LAST IN THE FLOW. One rule for every row: nothing here marks one of them as
           the one to take, on a card whose whole subject is that the choice is yours. -->
      <div class="prologue-answers">
        <button
          v-for="control in controls"
          :key="control.id ?? 'go-on'"
          class="prologue-answer"
          type="button"
          :disabled="busy"
          @click="emit('answer', control.id)"
        >
          <span class="prologue-answer-label">{{ control.label }}</span>
          <span v-if="control.note" class="prologue-answer-note">{{ control.note }}</span>
        </button>

        <!-- ⭐ PHASE 4, §6 - THE OTHER PATH. Inside `.prologue-answers` and last within it, which is
             what keeps `.prologue-answers` the card's last element: the fit measurement reads the
             way out off the card's bottom edge, and a control added anywhere after it would make
             every fit number on the walk quietly wrong while every one of them stayed green. Quieter
             than an answer because it is not one - it is the door out of the story, not a year of
             it. -->
        <button
          v-if="skipLabel"
          class="prologue-answer prologue-skip"
          type="button"
          :disabled="busy"
          @click="emit('skip')"
        >
          <span class="prologue-answer-label">{{ skipLabel }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* The scrim, the panel and the height bound are `.dialog-overlay` / `.dialog-card` and are not
   restated here - see the script header for why this surface sits on the shared box. What is local
   is the width, the three text blocks and the column of answers.

   ⚠ EVERY COLOUR IS A DECLARED APP TOKEN WITH NO FALLBACK. Round-17 #3 is the reason and
   BirthdayDialog.vue carries the full account: `var(--card, #fff)` and `var(--ink, #1c1c1e)` shipped
   four buttons of near-white text on white, at a measured 1.09:1, on a dialog the player could not
   dismiss. A fallback is honest only where the token is optional; for a colour that has to be
   readable it is a second design nobody reviews. */
.prologue-card {
  max-width: 420px;
  text-align: left;
}

.prologue-kicker {
  margin: 0 0 4px;
  font-size: 11px;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--ink-dim);
}

.prologue-title {
  margin: 0 0 8px;
  font-family: var(--font-heading);
  font-size: 20px;
  line-height: 1.25;
  color: var(--ink);
}

.prologue-lede {
  margin: 0 0 14px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink-soft);
}

/* Set apart from the lede by a rail rather than by a heading: it is a different KIND of sentence -
   the scene is what happened, these two are what you can see of her - and a label above it («How she
   is doing») would be the screen telling the player how to read two sentences it could simply
   show. */
.prologue-read {
  margin: 0 0 14px;
  padding: 0 0 0 10px;
  border-left: 3px solid var(--accent-soft);
}

.prologue-read-line {
  margin: 0;
  font-size: 14px;
  line-height: 1.45;
  color: var(--ink-2);
}

.prologue-read-coach {
  margin-top: 4px;
  color: var(--ink-soft);
}

.prologue-reasons {
  margin: 0 0 14px;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.45;
  color: var(--ink-soft);
}

/* ══ WHO SHE IS – the age-5 card's three fields ══
   ⚠ THE TOKENS ARE THE WIZARD'S FIELD TOKENS, not a second palette: `--card-top` on `--line` with
   `--ink` text, the label at `--ink-soft`. Same rule as everything else on this card - every colour
   is a DECLARED token with no fallback, because round-17 #3 shipped `var(--ink, #1c1c1e)` and put
   near-white text on white at 1.09:1 on a dialog the player could not dismiss. */
.prologue-identity {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0 0 14px;
}

.prologue-label {
  display: block;
  margin-bottom: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-soft);
}

.prologue-input {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 11px 13px;
  border-radius: var(--radius-frame);
  background: var(--card-top);
  border: var(--stroke-hair) solid var(--line);
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
}

.prologue-input::placeholder {
  font-weight: 500;
  color: var(--ink-dim);
}

/* THE MONTH GETS THE ROOM IT NEEDS: "September" is nine characters and a day is at most two, so the
   pair is sized off the longest label rather than split evenly - the owner's own answer on this
   field, kept here so the two surfaces read the same at 375px. */
.prologue-birthday {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 8px;
}

.prologue-select {
  min-width: 0;
  box-sizing: border-box;
  padding: 11px 13px;
  border-radius: var(--radius-frame);
  background: var(--card-top);
  border: var(--stroke-hair) solid var(--line);
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
}

.prologue-tiles-label {
  margin: 10px 0 8px;
  font-size: var(--label-size);
  letter-spacing: var(--label-track);
  font-weight: 600;
  text-transform: uppercase;
  color: var(--muted);
}

.prologue-tiles {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.prologue-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 9px 4px;
  border-radius: var(--radius-frame);
  border: var(--stroke-hair) solid var(--line);
  background: var(--card-top);
  color: var(--ink-2);
  cursor: pointer;
}

.prologue-tile.is-on {
  background: var(--accent-fill);
  border-color: var(--accent);
}

/* The flag is an emoji everywhere else in this app, so it is an emoji here too. */
.prologue-flag {
  font-size: 19px;
  line-height: 1;
}

.prologue-tile-name {
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.25;
  text-align: center;
  color: var(--ink-2);
}

.prologue-tile.is-on .prologue-tile-name {
  color: var(--accent);
}

.prologue-empty {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--muted);
}

.prologue-browse {
  display: block;
  width: 100%;
  margin-top: 8px;
  padding: 10px 13px;
  text-align: left;
  border-radius: var(--radius-frame);
  border: var(--stroke-hair) solid var(--line);
  background: var(--card-top);
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-2);
  cursor: pointer;
}

.prologue-answers {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ⚠ ONE RULE FOR EVERY ROW, AND NO POSITIONAL SELECTOR ANYWHERE. `:first-child` or `:nth-child`
   here would be a mark by another name - the screen pointing at the answer it prefers on a card
   whose entire subject is that the decision is the parent's. Same reasoning, and the same tokens, as
   `.birthday-choice`: the two are the same object and should not drift apart. */
.prologue-answer {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 11px 13px;
  text-align: left;
  border: var(--stroke-hair) solid var(--accent-soft);
  border-radius: var(--radius-frame);
  background: var(--accent-wash);
  color: var(--text);
  cursor: pointer;
}

.prologue-answer:hover:not(:disabled) {
  background: var(--accent-fill);
}

.prologue-answer:disabled {
  opacity: 0.55;
  cursor: default;
}

/* ⚠ QUIETER, AND STILL A DECLARED TOKEN PAIR WITH NO FALLBACK. The border goes and the wash goes;
   the LABEL keeps `var(--text)` so this control is held to the same AA measurement every answer on
   the card is - a way out nobody can read is not a way out. */
.prologue-skip {
  border-color: transparent;
  background: transparent;
  padding: 8px 13px;
}

.prologue-skip:hover:not(:disabled) {
  background: var(--accent-wash);
}

.prologue-answer-label {
  font-size: 15px;
  line-height: 1.3;
  color: var(--text);
}

.prologue-answer-note {
  font-size: 12px;
  line-height: 1.35;
  color: var(--muted);
}
</style>

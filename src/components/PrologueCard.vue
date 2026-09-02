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
// picture, the scene, then what you can SEE of her (whether she is enjoying it, and what the person
// teaching her makes of it), then the answers. No number about her appears anywhere on this screen
// at any age. The formed rose is the HANDOVER's payload (§5) and phase 4's to spend.
//
// =================================================================================================
// ⭐⭐⭐ THE PICTURE (phase 7) – «по типу нашего home screen где большой арт на всю ширину экрана»
// =================================================================================================
//
// WHAT WAS REUSED, because the owner asked for the pattern the game already has rather than a second
// one, and both halves of it were already shipped:
//
//   * ⭐ THE FULL-BLEED MECHANICS ARE `.injury-stop-art`'s, VERBATIM – `width: calc(100% + 32px)`
//     against the shared card's own 16px padding, `margin: -16px -16px …`, `object-fit: cover`, and
//     the top corners rounded to the card's. That is the ONE surface in this app that already puts a
//     painting across the full width of a `.dialog-card`, and style.css's round-20 #3 note cites it
//     by name as the proof the height cap costs a full-bleed child nothing («its art still spans
//     exactly the padding box, scrollWidth === clientWidth, so `overflow-x` computing to `auto`
//     alongside `overflow-y` clips nothing»). Reusing it is why this needs no overflow trick.
//   * ⭐ THE FADE INTO THE PAGE IS `.diary-hero-fade`'s IDEA – Home's own words for it: it «takes
//     the photograph into --panel by 100%, which is what makes the picture read as the page itself
//     rather than as a banner sitting on top of it». Here it ends in `--panel` because the card is
//     `--panel`, so the picture has no bottom edge and the kicker reads as if it were on the frame.
//
// ⚠ WHAT WAS NOT REUSED, AND WHY. Home lays its HEADER on the painting (`.diary-head`, the date and
// two icons over `.diary-hero-top`). The owner allowed either – «а текст под ним или частично на
// нем» – and the text stays UNDER the picture here, deliberately: `tests/component/contrast.ts`
// composites colours through the real cascade and cannot see a photograph, so a title moved onto the
// art would leave `assertLegible` measuring a background that is not behind it. Round-17 #3 is why
// that gate exists (four buttons at a measured 1.09:1 on a dialog the player could not dismiss), and
// «text over an image» is precisely the shape it goes blind to. The fade is what buys the same look
// without blinding it.
//
// ⚠ THE MOOD IS DERIVED AND ARRIVES AS A PROP. `moodAt` (src/prologue/run.ts) reads the SAME counts
// the two read lines read, so the picture cannot disagree with the sentence under it, and there is
// no `mood` column in the card table for anybody to keep in sync by hand.
import { computed, ref, useTemplateRef } from 'vue'
import { prologueArtUrl, prologueFacePoint } from '../art/prologue'
import { useDialogFocus } from '../composables/dialogFocus'
import { COUNTRIES, COUNTRY_NAMES, POPULAR_COUNTRIES, flagEmoji } from '../composables/countries'
// ⚠⚠ THE THREE FIELDS ARE THE WIZARD'S AND SO ARE THEIR WORDS. Not one label, placeholder or
// screen-reader name below is written here: they all come from `composables/identityCopy.ts`, which
// the wizard reads too, because CLAUDE.md's invariant 4 says a label is the owner's and a string
// declared twice is a string that can drift in one copy. See that module's header.
import { IDENTITY_COPY, MONTHS } from '../composables/identityCopy'
import { daysInBirthMonth } from '../shared/dates'
import type { PortraitEmotion } from '../shared/avatarEmotion'
import type { PrologueCard, PrologueOption } from '../prologue/cards'
import type { PrologueIdentity } from '../prologue/identity'
import type { Warmth } from '../prologue/run'

const props = defineProps<{
  card: PrologueCard
  /** which arm of `her` / `coach` this run has earned – see `warmthAt` */
  warmth: Warmth
  /** ⭐ WHICH FACE THE YEAR WEARS – DERIVED by `moodAt` off the same counts `warmth` is, and passed
   *  in by the container for the same reason `warmth` is: this component reads a run no more than it
   *  writes copy. It is not optional, because a card with no picture is the thing phase 7 exists to
   *  stop shipping. */
  mood: PortraitEmotion
  /** the twelfth's derived reason, ONE folded sentence and absent on every other card. It was a
   *  three-item list until the owner met it (02.09, «мне кажется вот это лишнее»); see
   *  `TWELFTH_REASONS` in cards.ts for why the function survived the list. */
  reason?: string
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
//
// ⭐⭐ PHASE 7 ADDS A FOURTH STATE AND IT IS THE CLOSED ONE. The three views are the wizard's and are
// untouched – Popular / Results / All countries, over the same list, with the same headings and the
// same `Browse all countries` control. What is new is that none of them is on screen until the
// player asks, because the age-5 card is the first screen of the game and the field arrives already
// filled in (`OPENING_IDENTITY`). Closed, it is one tile: the country she is from.
//
// ⚠ NOT ONE NEW STRING. The discloser is `IDENTITY_COPY.browseAll`, which already existed and
// already meant this; the closed tile's name is `COUNTRY_NAMES[code]`, which the picker already
// renders. Inventing a «Change country» label would be inventing copy the owner has not seen, on a
// surface whose every word is the wizard's (invariant 4).
const query = ref('')
const browsingAll = ref(false)
const searching = computed(() => query.value.trim().length > 0)
/** Is the picker OPEN? Either way in counts – typing, or the browse control. */
const pickingCountry = computed(() => searching.value || browsingAll.value)
const matches = computed(() => {
  const q = query.value.trim().toLowerCase()
  return COUNTRIES.filter((c) => (COUNTRY_NAMES[c] ?? c).toLowerCase().includes(q) || c.toLowerCase() === q)
})
const tiles = computed(() => {
  if (searching.value) return matches.value
  if (browsingAll.value) return COUNTRIES
  // ⚠ THE CLOSED VIEW SHOWS THE CHOSEN COUNTRY AND NOT `POPULAR_COUNTRIES[0]`: it has to be what the
  // career will actually be started with, or the card would be showing one flag and building
  // another. `identity` is only absent on the eight cards that do not ask.
  return props.identity ? [props.identity.country] : POPULAR_COUNTRIES
})
const tilesLabel = computed(() =>
  searching.value ? IDENTITY_COPY.results : browsingAll.value ? IDENTITY_COPY.allCountries : IDENTITY_COPY.popular,
)

/** Taking a country ANSWERS the question, so it also closes the picker – the same shape the wizard's
 *  step 3 has, where choosing a tile is what makes Next available. A player who wants a different one
 *  opens it again; a player who wanted this one is not left looking at twenty-four more. */
function chooseCountry(code: string): void {
  setField('country', code)
  query.value = ''
  browsingAll.value = false
}

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

// --- the picture ----------------------------------------------------------------------------------
//
// ⚠ WHICH FRAME A CARD SHOWS IS `src/art/prologue.ts`'S, NOT THIS COMPONENT'S. The owner named a
// painting for six of the nine on 02.09; those picks live in `PROLOGUE_FRAMES` beside the URL
// builder, the other three stay derived off `mood`, and this file asks one function and draws what
// it is handed. Same reason the copy is a table: art direction is his, and a component that chose
// its own frame would be a second place to change it.
const artUrl = computed(() => prologueArtUrl(props.card.age, props.mood))
/** Framed off the ONE face table for a portrait, and off the welcome scene's own recorded point for
 *  `welcome-1` – see `prologueFacePoint`, which carries the account of «отец без головы». */
const artStyle = computed(() => {
  const p = prologueFacePoint(props.card.age, props.mood)
  return { objectPosition: `${p.x}% ${p.y}%` }
})

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
      <!-- ⭐⭐ THE PICTURE, FULL WIDTH, FIRST. `alt=""` because it is decorative in the strict
           sense: it shows what the kicker, the title and the two read lines under it already say,
           and a screen reader that announced the painting would say the year twice. The card names
           itself off those two headings (`aria-labelledby`), which is unchanged. -->
      <div class="prologue-hero">
        <img class="prologue-hero-img" :src="artUrl" :style="artStyle" alt="" />
        <!-- The scrim that takes the picture into the card, so it has no bottom edge – Home's own
             `.diary-hero-fade`, ending in this surface's colour instead of the page's. -->
        <div class="prologue-hero-fade"></div>
      </div>

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
           arrived would read as a dice roll - and there are no dice in it.

           ⚠ ONE SENTENCE OF PROSE, NOT A LIST, and the owner's own words on that are quoted in
           `TWELFTH_REASONS` (cards.ts) because Cyrillic may not appear in a template even in a
           comment. The three clauses are folded in `run.ts` off the table's own sentence; what
           changed here is that the card no longer stacks three declaratives on a screen that is
           otherwise paragraphs. cards.ts also carries why the FUNCTION outlived the list. -->
      <p v-if="reason" class="prologue-reason">{{ reason }}</p>

      <!-- WHO SHE IS. The wizard's three fields, in the wizard's own words, on the one card that
           asks (owner, 02.09). BEFORE the answers and never after them: `.prologue-answers` has to
           stay the card's last element or the fit measurement reads the way out off the wrong
           edge - the same rule the skip control's own note states below. -->
      <div v-if="card.identity && identity" class="prologue-identity">
        <!-- ⭐ PHASE 7 – THE TWO NAMES SHARE A ROW. They are one question asked twice («what is she
             called»), each field holds one short word, and stacking them cost a whole row of a card
             that was 3.6 model-screens tall. The labels, the placeholders and the ids are unchanged;
             this is the row they sit in, nothing else. -->
        <div class="prologue-names">
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

        <!-- HER COUNTRY - the wizard's picker, not a second one: a search over all 24, tiles as the
             shortcut into that same list, and a way to open the rest.

             ⭐⭐ PHASE 7 – IT OPENS CLOSED, AND THAT IS THE ONE CHANGE. The picker's PARTS are
             untouched: the same search field, the same tiles, the same three view headings, the same
             `Browse all countries` control, and not one new string. What changed is which of them is
             on screen before the player asks. Measured in a real Chromium at 375x667, the expanded
             picker was 315px of a 1115px card - nine tiles the player scrolls past to reach the
             three origins, on the FIRST screen of the game, to re-pick a value that is already
             filled in. Closed it is her country and the way in.

             ⚠ THE SEARCH IS WHAT OPENS IT TOO, so a player who types never meets the shortcut: the
             wizard's own affordance is the primary one there and stays the primary one here. -->
        <div class="prologue-field">
          <input
            v-if="pickingCountry"
            v-model="query"
            class="prologue-input"
            type="text"
            :placeholder="IDENTITY_COPY.searchPlaceholder"
            :aria-label="IDENTITY_COPY.searchLabel"
            autocomplete="off"
          />
          <p v-if="pickingCountry" class="prologue-tiles-label">{{ tilesLabel }}</p>
          <!-- ⭐ PHASE 8 - CLOSED, THE COUNTRY AND THE WAY IN SHARE A LINE. The owner asked for the
               chosen-country slot and `Browse all countries` on one row (02.09; his words are quoted
               in the style block below, where Cyrillic is allowed). They are one question - which
               country - asked as a state and a door, and stacking them spent a whole row of the
               tallest card in the walk on two controls that are each one line of text. OPEN, the
               wrapper is inert: the grid goes back to three columns and the browse control is not
               rendered at all, so the picker itself is untouched. -->
          <div class="prologue-country" :class="{ 'is-closed': !pickingCountry }">
            <div class="prologue-tiles" :class="{ 'is-one': !pickingCountry }">
              <button
                v-for="code in tiles"
                :key="code"
                class="prologue-tile"
                :class="{ 'is-on': identity.country === code }"
                type="button"
                :aria-pressed="identity.country === code"
                @click="chooseCountry(code)"
              >
                <span class="prologue-flag">{{ flagEmoji(code) }}</span>
                <span class="prologue-tile-name">{{ COUNTRY_NAMES[code] }}</span>
              </button>
            </div>
            <button
              v-if="!searching && !browsingAll"
              class="prologue-browse"
              type="button"
              @click="browsingAll = true"
            >
              {{ IDENTITY_COPY.browseAll }}
            </button>
          </div>
          <p v-if="searching && !matches.length" class="prologue-empty">{{ IDENTITY_COPY.noMatches }}</p>
        </div>
      </div>

      <!-- ⭐⭐ THE QUESTION THE ANSWERS ANSWER - the owner met three buttons on the age-5 card with
           nothing asking for them (02.09; his words are quoted on `question` in cards.ts, which is
           where Cyrillic is allowed to live). Immediately above the column and inside nothing, so it
           reads as the last thing said before the choice rather than as a heading over a section.
           Only the five carries one. -->
      <p v-if="card.question" class="prologue-question">{{ card.question }}</p>

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

/* ══ THE PICTURE (phase 7) ══
   ⭐ FULL-BLEED THE WAY `.injury-stop-art` ALREADY IS – the one shipped painting on a `.dialog-card`,
   and style.css's own round-20 #3 note names it as the proof this costs nothing: «its art still
   spans exactly the padding box (scrollWidth === clientWidth, so `overflow-x` computing to `auto`
   alongside `overflow-y` clips nothing)». `calc(100% + 32px)` is the shared card's 16px padding
   cancelled on both sides, and the negative margins put it back over that padding.

   ⭐⭐⭐ PHASE 8 – IT IS SQUARE, AND THAT IS THE OWNER'S OWN RULE FOR THE WHOLE PROLOGUE.
   «я просил арты делать в квадратном формате по аналогии с home экраном» (02.09, raised against the
   age-6 card and applying to all nine), and separately «Заглавная картинка на экране обрезана (отец
   без головы)» on the age-5 one. Those are the SAME complaint arriving twice: every painting in
   this set is a 512x512 master, and a 16:9 window over a square master throws away 44% of it.

   ⚠ SO THE FORMAT IS ONE RULE AND NOT NINE. There is one declaration here and no per-card
   override anywhere: `aspect-ratio: 1 / 1`, which is literally what `.diary-hero` declares on Home
   («the hero is SQUARE, because the paintings are square (512x512) – so at the full width of the
   phone the whole frame is on screen and nothing is cut») and what `.nt-hero` declares for the
   same reason, in the same words, after he asked the same thing of the tournament card in round 30.
   A third spelling of «square like the main screen» would be a third thing to keep in step.

   ⚠⚠ AND THE MEASUREMENT CAN SEE IT NOW – it could not before, and the note that stood here said
   so: «an `aspect-ratio` is invisible to it, because happy-dom does no layout … a hero declared by
   ratio would measure as ZERO and every fit number on the walk would be optimistic». That was
   true of `tests/component/fits.ts` as it was, and rather than keep a 16:9 pixel height to suit the
   instrument, the INSTRUMENT was taught the property: `boxOf` folds `aspect-ratio` against the
   width it was handed when there is no explicit height. It under-counts here (it uses the card's
   content width, 311px, where the full-bleed box is really 343px), which is the direction fits.ts
   documents itself as erring in. MUTATION-VERIFIED both ways in tests/component/prologue-walk.ts.

   `calc(100% + 32px)` is the shared card's 16px padding cancelled on both sides, and the negative
   margins put it back over that padding. */
.prologue-hero {
  position: relative;
  width: calc(100% + 32px);
  aspect-ratio: 1 / 1;
  margin: -16px -16px 12px;
  overflow: hidden;
  border-radius: var(--radius-panel) var(--radius-panel) 0 0;
}

.prologue-hero-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Home's `.diary-hero-fade`, ending in THIS surface's colour rather than the page's: «it takes the
   photograph into --panel by 100%, which is what makes the picture read as the page itself rather
   than as a banner sitting on top of it». `--panel` is what `.dialog-card` is painted, so the
   picture has no bottom edge and the kicker under it reads as part of the frame. */
.prologue-hero-fade {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(9, 14, 19, 0) 52%, rgba(11, 17, 23, 0.55) 82%, var(--panel) 100%);
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

/* ⚠ A PARAGRAPH, NOT A LIST – and that is the whole of the owner's 02.09 note on it. It was a `ul`
   with `padding-left: 18px` and three `li`s; three declaratives with bullets in front of them, on a
   card whose every other block is prose, read as a debug print rather than as the card talking.
   Same colour and same size as before; what changed is that it is one sentence in one box. */
.prologue-reason {
  margin: 0 0 14px;
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

/* ⭐ THE TWO NAMES IN ONE ROW (phase 7). Even columns, unlike `.prologue-birthday`'s 1.5fr/1fr: a
   first name and a surname are the same KIND of thing and neither is systematically longer, so
   there is no longest-label to size off. `min-width: 0` on the fields is what stops a long
   placeholder from pushing the row wider than the card. */
.prologue-names {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.prologue-names .prologue-field {
  min-width: 0;
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

/* ⭐ THE CLOSED VIEW – one tile, laid along the row rather than as a third of a grid. It is the same
   control with the same tokens; only the axis changes, so a country that is chosen looks like a
   chosen country and not like a lone cell of a table with two holes in it. */
.prologue-tiles.is-one {
  grid-template-columns: 1fr;
}

.prologue-tiles.is-one .prologue-tile {
  flex-direction: row;
  justify-content: flex-start;
  gap: 10px;
  padding: 11px 13px;
}

.prologue-tiles.is-one .prologue-tile-name {
  font-size: 15px;
  text-align: left;
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

/* ⭐ CLOSED, THE CHOSEN COUNTRY AND `Browse all countries` ARE ONE ROW – owner, 02.09: «Browse all
   countries и сам слот выбранной страны давай сделаем на одной строчке тоже». The tile
   takes the room that is left (`min-width: 0` so a long country name wraps inside its own box
   instead of pushing the row wider than the card) and the door takes what its label needs. Neither
   control's tokens, padding or label changed – only the axis, which is the same one-line move the
   two name fields got in phase 7.

   ⚠ OPEN, THIS SELECTOR IS NOT ON: `.prologue-country` alone declares nothing, so the three-column
   grid and the full-width browse control are exactly what they were. */
.prologue-country.is-closed {
  display: flex;
  align-items: stretch;
  gap: 8px;
}

.prologue-country.is-closed .prologue-tiles {
  flex: 1 1 auto;
  min-width: 0;
}

.prologue-country.is-closed .prologue-browse {
  flex: 0 1 auto;
  width: auto;
  margin-top: 0;
  text-align: center;
}

/* ⭐ THE QUESTION ABOVE THE ANSWERS (owner, 02.09). The lede's own size and colour, because it is
   the same voice saying the same kind of thing; what marks it is that it is the last line before
   the column and it is the only line on the card with a question mark in it. Not a `label` and not
   a heading: the three answers are buttons, not a fieldset, and a heading over two of the nine
   cards would be a section that exists on some screens and not others. */
.prologue-question {
  margin: 0 0 10px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink-soft);
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

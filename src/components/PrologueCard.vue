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
import { prologueArtUrl, prologueFacePoint, type PrologueOutcome } from '../art/prologue'
import { useDialogFocus } from '../composables/dialogFocus'
import { COUNTRIES, COUNTRY_NAMES, POPULAR_COUNTRIES, flagEmoji } from '../composables/countries'
// ⚠⚠ THE THREE FIELDS ARE THE WIZARD'S AND SO ARE THEIR WORDS. Not one label, placeholder or
// screen-reader name below is written here: they all come from `composables/identityCopy.ts`, which
// the wizard reads too, because CLAUDE.md's invariant 4 says a label is the owner's and a string
// declared twice is a string that can drift in one copy. See that module's header.
import { IDENTITY_COPY, MONTHS } from '../composables/identityCopy'
import { daysInBirthMonth } from '../shared/dates'
import type { PortraitEmotion } from '../shared/avatarEmotion'
import { TOURNAMENT_ANSWER } from '../prologue/cards'
import type { PrologueCard, PrologueOption, TournamentAsk } from '../prologue/cards'
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
  /** ⭐⭐ PHASE 11 – WHAT THE YEAR'S TOURNAMENT CAME TO, and it is the ONE argument phase 7 left the
   *  hook for: «the wiring, when it comes, is one argument at one call site». Present only on a
   *  Local Open's result scene, where it OUTRANKS both the owner's pinned frame and `mood`'s
   *  derivation – a result is the strongest thing the game knows about that year, and a card showing
   *  `norm` over a won draw sheet would be the picture disagreeing with the screen the player just
   *  came off. See `prologueFace` in src/art/prologue.ts for the ranking. */
  outcome?: PrologueOutcome
  /** ⭐⭐⭐ THIS YEAR'S TOURNAMENT QUESTION, ON THE SAME SCREEN AS THE YEAR'S OWN DECISION.
   *
   *  ⚠⚠ ROUND 35 #4 – IT WAS A SECOND BEAT ON THE SAME PAINTING AND THE OWNER MET IT AS A REPEAT.
   *  He reported seeing «she asks more» and «juniour tour opens at fourteen» twice, and he was
   *  reading the screen correctly: nothing is duplicated in the data, but `answer()` used to run a
   *  card as TWO beats on ONE painting - the card's own choice, and then the ask - with the same
   *  kicker, the same title and the same picture above a different pair of buttons. A screen that
   *  changes only below the fold is a screen the player has already read.
   *
   *  ⭐ SO THE TWO BEATS ARE ONE. The card's own answers and the ask's two sit in one column, in that
   *  order, with the ask's own line between them; neither commits on its own, and the container
   *  moves on when BOTH are answered (`cardAnswered` in run.ts). That is the fix the owner's own
   *  layout note bought - see the style block for what the frameless column freed to pay for it.
   *
   *  ⚠ AND THE TWO READ LINES ARE DRAWN AGAIN. They used to be suppressed on the ask beat, because
   *  `her` and `coach` are the card's reading of a YEAR and the beat was a question about one
   *  weekend. There is one beat now and it is the year's, so the year's reading belongs on it. */
  ask?: TournamentAsk
  /** ⭐ WHICH OF THE CARD'S OWN ANSWERS THIS RUN HAS TAKEN, so a screen carrying two questions can
   *  show which of them is already settled. Owned by the container off the run, exactly as `warmth`
   *  and `mood` are: this component reads no run. Absent on every card that cannot be half-answered. */
  picked?: string
  /** ...and the same for the tournament question's own answer. */
  entry?: string
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
  /** the id of the option or origin taken, or null for a card with nothing to decide. ⭐ On the ask
   *  beat it is one of `TOURNAMENT_ANSWER`'s two ids – the container knows which beat it is on,
   *  because it is the one that put the `ask` prop there. */
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
 *  `continueLabel`, which is why it has no note.
 *
 *  ⚠⚠ ROUND 35 #4 – AND A CARD THAT ALSO CARRIES A TOURNAMENT QUESTION SYNTHESISES NONE. The
 *  thirteenth has no decision of its own (`sameAsLastYear`) and would otherwise draw «Wait for the
 *  coach» directly above «Put her name down» / «Not this year» - a third answer to a question that
 *  has two, on the one screen the whole item is about. The ask's own pair IS the way on there. */
const choices = computed<{ id: string | null; label: string; note: string }[]>(() => {
  const list: readonly PrologueOption[] | undefined = props.card.origins ?? props.card.options
  if (list) return list.map((o) => ({ id: o.id, label: o.label, note: o.note }))
  return props.ask ? [] : [{ id: null, label: props.card.continueLabel, note: '' }]
})

/** ⭐ THE TOURNAMENT QUESTION'S OWN TWO ANSWERS, in the same shape and the same markup as the card's,
 *  because they are answers on the same screen and a second treatment would say they were a
 *  different KIND of decision. Empty on the six cards that carry no ask. */
const askChoices = computed<{ id: string; label: string; note: string }[]>(() => {
  const ask = props.ask
  if (!ask) return []
  return [
    { id: TOURNAMENT_ANSWER.enter, label: ask.enterLabel, note: ask.enterNote },
    { id: TOURNAMENT_ANSWER.decline, label: ask.declineLabel, note: ask.declineNote },
  ]
})

/** ⭐ WHICH ANSWER IS ALREADY TAKEN. ⚠ NOT A RECOMMENDATION, WHICH IS THE ONE THING THIS CARD MAY
 *  NEVER DRAW - see the `.prologue-answer` note in the style block. It marks what the PLAYER did, on
 *  the only screen where a card can be half-answered, and it is gone one tap later. */
function taken(id: string | null): boolean {
  if (id === null) return false
  return id === props.picked || id === props.entry
}

/** ⭐ THE LINE UNDER THE TITLE, AND IT IS THE CARD'S OWN AGAIN (round 35 #4). It used to be replaced
 *  by the ask's line on the second beat, which is exactly what made two screens out of one: the
 *  picture and the title stayed, one paragraph changed, and the player read the same scene twice. The
 *  ask's line is drawn where the ask is, immediately above its own two answers. */
const lede = computed(() => props.card.lede)

const her = computed(() => props.card.her[props.warmth])
const coach = computed(() => props.card.coach[props.warmth])

// --- the picture ----------------------------------------------------------------------------------
//
// ⚠ WHICH FRAME A CARD SHOWS IS `src/art/prologue.ts`'S, NOT THIS COMPONENT'S. The owner named a
// painting for six of the nine on 02.09; those picks live in `PROLOGUE_FRAMES` beside the URL
// builder, the other three stay derived off `mood`, and this file asks one function and draws what
// it is handed. Same reason the copy is a table: art direction is his, and a component that chose
// its own frame would be a second place to change it.
const artUrl = computed(() => prologueArtUrl(props.card.age, props.mood, props.outcome))
/** Framed off the ONE face table for a portrait, and off the welcome scene's own recorded point for
 *  `welcome-1` – see `prologueFacePoint`, which carries the account of «отец без головы». */
const artStyle = computed(() => {
  const p = prologueFacePoint(props.card.age, props.mood, props.outcome)
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
  <!-- ⭐⭐⭐ ROUND 35 #2 – A SCREEN, NOT A POPUP. `.prologue-overlay` is the modifier declared in
       src/style.css (his words are quoted there, and in tests/component/round35-prologue.test.ts):
       it drops the 16px inset and the dim, and changes nothing else about the shared box - the fixed
       full-screen scrim and the card's own height cap are what round-20 #3 put there. -->
  <div class="dialog-overlay prologue-overlay">
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
      <p class="prologue-lede">{{ lede }}</p>

      <!-- WHAT YOU CAN SEE OF HER, AND IT IS NEVER A NUMBER. Two sentences: whether she is enjoying
           it, and what the person teaching her makes of it. The full argument is in cards.ts.

           ⚠ ROUND 35 #4 – DRAWN ON EVERY CARD AGAIN. They used to stand down while the tournament
           question was up, because that was a separate beat about one weekend; there is one beat now
           and it is the year's, so the year's reading belongs on it. See the `ask` prop. -->
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
          v-for="control in choices"
          :key="control.id ?? 'go-on'"
          class="prologue-answer"
          :class="{ 'is-taken': taken(control.id) }"
          type="button"
          :aria-pressed="ask && control.id !== null ? taken(control.id) : undefined"
          :disabled="busy"
          @click="emit('answer', control.id)"
        >
          <span class="prologue-answer-label">{{ control.label }}</span>
          <span v-if="control.note" class="prologue-answer-note">{{ control.note }}</span>
        </button>

        <!-- ⭐⭐⭐ ROUND 35 #4 - THIS YEAR'S TOURNAMENT QUESTION, ON THE SAME SCREEN AND NOT ON A
             SECOND ONE. Its own line first, so the answers under it are answering something the
             player has just read, and then its two answers in the card's own shape.

             ⚠ INSIDE `.prologue-answers`, WHICH IS THE ONE STRUCTURAL RULE THIS SCREEN HAS. The fit
             measurement reads the way out off the CARD'S bottom edge and needs the answers to be the
             card's last element (`measureDialog`'s own docstring, and the walk's own precondition
             test); a question parked between the column and the card's foot would make every fit
             number on the walk quietly wrong while every one of them stayed green. -->
        <p v-if="ask" class="prologue-ask">{{ ask.lede }}</p>
        <button
          v-for="control in askChoices"
          :key="control.id"
          class="prologue-answer"
          :class="{ 'is-taken': taken(control.id) }"
          type="button"
          :aria-pressed="taken(control.id)"
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
/* ⭐⭐⭐ ROUND 35 #2 – NO BACKING PLATE AND NO FRAME. The owner asked for the prologue to be drawn
   as a screen: a square painting across the full width, the way Home does it, and all the text and
   the choices under it. His words are in tests/component/round35-prologue.test.ts.

   WHAT GOES: the panel tone, the hairline, the 12px corners and the TOP padding, all four of which
   are `.dialog-card`'s and all four of which say «this is a box sitting on a page». The ground is
   `--bg` – what the app paints its own screens – so the painting has nothing to sit on and reads as
   the top of the screen rather than as a banner inside a card.

   ⚠ WHAT STAYS, AND IT IS THE HALF THE ROUND-20 #3 FIX LIVES IN: `max-height: 100%; overflow-y:
   auto` on `.dialog-card`, untouched and still inherited. This surface is the exact shape that rule
   exists for – a blocking screen with prose above the way out, first thing a new player ever sees –
   and losing the cap while making the card taller is the one way this change could have stopped a
   career. `tests/component/prologue-walk.test.ts` measures the cap; `round35-prologue.test.ts`
   measures what came off.

   ⚠ THE SIDE PADDING IS KEPT AND IS NOT AN INCONSISTENCY. «Арт во всю ширину» is about the PICTURE,
   and the picture already cancels this padding (`calc(100% + 32px)` and the negative margins below,
   which is `.injury-stop-art`'s own trick). Text run to the bezel is not what Home does either. */
.prologue-card {
  max-width: 420px;
  padding: 0 16px 16px;
  border: 0;
  border-radius: 0;
  background: var(--bg);
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
/* ⚠ ROUND 35 #2 MOVED TWO OF THESE FOUR LINES. The card has no top padding to cancel any more, so
   the negative TOP margin is gone (a -16 against a 0 would have pulled the painting off the top of
   the screen); and the rounded top corners are gone with the frame that made them mean something -
   a picture that is the top of the screen has no corner to round. The full-bleed trick itself is
   unchanged: `calc(100% + 32px)` is the card's remaining 16px side padding cancelled both sides. */
.prologue-hero {
  position: relative;
  width: calc(100% + 32px);
  aspect-ratio: 1 / 1;
  margin: 0 -16px 12px;
  overflow: hidden;
}

.prologue-hero-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Home's `.diary-hero-fade`, ending in THIS surface's colour rather than the page's: «it takes the
   photograph into --panel by 100%, which is what makes the picture read as the page itself rather
   than as a banner sitting on top of it».
   ⚠ ROUND 35 #2 – AND THIS SURFACE'S COLOUR IS `--bg` NOW, which is nearer Home's own words than
   `--panel` ever was: the card is painted the page, so the fade ends in the page and the picture
   genuinely has no bottom edge. Leaving `--panel` here would have drawn a one-pixel band of the
   frame that was just taken off, along the bottom of every painting in the walk. */
.prologue-hero-fade {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(9, 14, 19, 0) 52%, rgba(11, 17, 23, 0.55) 82%, var(--bg) 100%);
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

/* ⚠ 10px OF SIDE PADDING INSTEAD OF 13, ON THIS ROW ONLY. Measured in a real Chromium at 375x667,
   where the row is 309px wide and the two controls want, on one line each:

     the tile     22 flag + 10 gap + 96 «United States» + padding + border   150
     the door    137 «Browse all countries» + padding + border               159
     the gap                                                                   8
                                                                            ----
                                                                             317

   ⚠⚠ SO THE LABELS STILL WRAP, AND THAT IS SAID PLAINLY RATHER THAN CLAIMED AWAY. Six pixels off
   each side of each control does not close an eight-pixel gap; what it buys is headroom for the
   shorter names, and the row is 62px against the ~93px the two cost stacked. The owner's ask was
   the two controls on ONE LINE – one row, side by side – and that is what this is; a label taking
   two lines inside its own box is not a second row.

   ⚠ AND `nowrap` IS DELIBERATELY NOT THE FIX. Holding the door's label on one line would take the
   room out of the tile, which at 320px leaves a country name 35px to live in – or, if the door is
   allowed to shrink instead, overflows its text sideways where nothing can be read at all. A
   control that WRAPS gives ground vertically, which is the trade `fits.ts`'s `demandedWidth` note
   makes in the same words about crediting an ellipsis. The open picker keeps its 13px either way. */
.prologue-country.is-closed .prologue-tile,
.prologue-country.is-closed .prologue-browse {
  padding-left: 10px;
  padding-right: 10px;
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

/* ⭐⭐⭐ ROUND 35 #4 – THE TOURNAMENT QUESTION'S OWN LINE, and it is what stops the two questions on
   this screen reading as one list of four buttons. The lede's size and colour, because it is the
   same voice saying the same kind of thing; what marks it is the gap above it and that it is the
   last line before its own pair. Same reasoning as `.prologue-question`, which does this job for the
   three origins on the five. */
.prologue-ask {
  margin: 6px 0 2px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink-soft);
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

/* ⭐ ROUND 35 #4 – THE ANSWER THE PLAYER HAS ALREADY TAKEN, on the one screen that can be
   half-answered: the year's own decision and this year's tournament question sit in one column, and
   until both are answered the card stays. Without this the first tap looks like it did nothing.

   ⚠ IT IS NOT THE MARK THE RULE ABOVE FORBIDS, and the distinction is the whole of it. That rule
   bans the screen pointing at the answer IT prefers; this points at the answer the PARENT took, it
   can only ever be on after a press, and it is gone one tap later. It borrows `.prologue-tile.is-on`'s
   own pair of tokens rather than inventing a third treatment, because a chosen thing looks the same
   way everywhere on this card. */
.prologue-answer.is-taken {
  background: var(--accent-fill);
  border-color: var(--accent);
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

/* ═════════════════════════════════════════════════════════════════════════════════════════════════
   ⭐⭐⭐ ROUND 36, HIS REVIEW OF THE BUILT WAVE, ITEM #1 – AND IT OVERRULES D28
   ═════════════════════════════════════════════════════════════════════════════════════════════════
   «D28 – пролог - так не пойдет, давай делать примерно как у нас home сделан, надо чтобы картинку
    было видно хорошо, скролла не будет, а текст будет либо ниже и шире (планшет), либо сбоку, ниже
    и шире (десктоп)»

   ⚠⚠ D28's MEASUREMENT IS NOT CONTRADICTED BY THIS, AND UNDERSTANDING THAT IS WHY THIS BUILDS THE
   WAY IT DOES. D28 measured that on this screen a wider column IS a taller picture – the painting is
   square and ran the full width of the card, so every 60px of column was 60px more scroll before the
   decision (cap 420 → the first answer at y=894; cap 640 → y=1093). That is still true of the
   layout it measured. His answer sidesteps it: **the picture stops being the column's width.**
   Home's own hero is the model he named – a photograph with a shape and a CAP of its own, and the
   text under it – so the column can grow for the WORDS while the picture stays the size it should
   be. The two halves of his sentence are the two bands:

       768 – 1023   the picture on top at its own size, centred; the text below it and WIDER
       >= 1024      the picture down the left; the text beside it, and the decision below and wider

   ⚠ «СКРОЛЛА НЕ БУДЕТ» IS THE ACCEPTANCE TEST AND IT IS MEASURED, not asserted – every card at
   768x900 and at 1280x900, in a real browser. The numbers are in docs/rounds/round-36-review.md.

   ⚠ THE PAINTING IS STILL SQUARE AT EVERY WIDTH. That is his own standing rule for this set («я
   просил арты делать в квадратном формате по аналогии с home экраном», 02.09) and the two mounted
   pins that assert it are untouched: what changes here is the picture's WIDTH, never its ratio.

   ⚠ AND NOTHING BELOW 768 MOVES. Every rule in this block is behind a media query the phone never
   matches, and the mobile declarations above are left exactly as they were. */
/* ⚠⚠ EVERY SELECTOR IN THE TWO BLOCKS BELOW IS DOUBLED OR PARENTED, AND THAT IS NOT DECORATION.
   At EQUAL specificity happy-dom keeps the FIRST matching rule where a browser keeps the last
   (measured in phase 2 and written down beside the rail's own `:has()` in src/style.css), so a
   media-query override written at the same weight as the rule it overrides works in Chromium and
   silently does nothing in every mounted test. Naming the parent makes it win in both engines, in
   either source order – which is what lets `tests/component/round36-review-home.test.ts` measure
   this band at all. */
@media (min-width: 768px) {
  .prologue-card.prologue-card {
    /* ⭐ THE PICTURE'S OWN SIZE, and it is a token because the two bands want two of them – the same
       shape `--hero-max` has on Home, for the same reason: a ratio alone does not say how big. */
    --plo-art: 336px;
    /* The column grows for the TEXT. 640 is the app's own reading measure – the cap D18 puts on
       «Her own account» and D24 on the wizard – so the prologue joins a number the round already
       decided rather than inventing a third one. */
    max-width: 640px;
  }

  /* ⭐⭐ THE PICTURE STOPS BEING THE COLUMN. The full-bleed trick above is a PHONE rule – it exists
     so the painting reaches both edges of a 375px screen – and `.diary-hero` drops its own for
     exactly this reason past 1024 («in a column beside a column there are no edges to reach»). Here
     it is centred over the text at its own width, with the card's corner. */
  .prologue-card > .prologue-hero {
    /* ⚠⚠ AND ITS SIZE IS BOUNDED BY THE WINDOW'S HEIGHT, WHICH IS THE HALF «СКРОЛЛА НЕ БУДЕТ»
       ACTUALLY NEEDS. On this band the picture is stacked ABOVE the words, so every pixel of it is a
       pixel of the card – D28's own law, and the reason a flat number cannot answer him: 336 fits an
       iPad's 1024 with 89px to spare and misses a 900px window by 35 on the age-5 card, the one that
       carries the whole identity form. `33vh` is that measurement written as a rule: it binds only
       when the window is short, it applies to all nine cards rather than to the one that overflowed,
       and it leaves the picture at its full 336 on the device this band was drawn for.
       Measured: 336 at 768x1024, 297 at 768x900 – and every card fits at both. */
    width: min(var(--plo-art), 33vh);
    height: min(var(--plo-art), 33vh);
    margin: 0 auto 14px;
    border-radius: var(--radius-frame);
  }

  /* ⚠ THE FADE STANDS DOWN WITH THE BLEED IT BELONGED TO. Its job was to take a full-width painting
     into the page so it had no bottom edge; on a centred, rounded picture it is a dark band across
     the bottom third of a frame that HAS edges. The element and its rule above are untouched. */
  .prologue-hero > .prologue-hero-fade {
    display: none;
  }

  /* ⭐ THE ANSWERS GO TWO TO A ROW, and that is his item #18 arriving on this screen rather than a
     taste: «кнопок в 700 пикселей не должно быть, максимум 500». One column of a 640px card is a
     608px button; two are 300 each. The line that introduces the tournament question and the way out
     of the prologue both span, because neither is an answer in the pair.
     ⭐ It also buys back most of what the wider column costs in height, which is what makes «скролла
     не будет» reachable on the tallest card in the walk. */
  .prologue-card > .prologue-answers {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 8px;
  }

  .prologue-answers > .prologue-ask,
  .prologue-answers > .prologue-skip {
    grid-column: 1 / -1;
  }

  /* …and the age-5 card's three field rows pair up for the same reason: two of them are half-width
     questions (two names, a month and a day) on a column that is now 608px wide. The country picker
     spans, because its open state is a grid of twenty-four tiles. */
  .prologue-card > .prologue-identity {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 12px;
  }

  .prologue-identity > .prologue-field:last-child {
    grid-column: 1 / -1;
  }
}

/* ⭐⭐⭐ AND THE DESKTOP IS «СБОКУ, НИЖЕ И ШИРЕ»: the painting down the left, the reading beside it,
   and the decision under both at the full width of the card.

   ⚠⚠ THE MECHANISM IS ONE GRID OVER THE CARD'S OWN CHILDREN – no wrapper is added, because every
   block on this card is already a direct child of it. The picture takes column 1 and spans; the six
   text blocks are named into column 2; the question and the answers take `1 / -1`, which auto-places
   them at the first row where BOTH columns are free – i.e. under the span. `row-gap: 0` because the
   rhythm is each block's own `margin-bottom` and always has been.
   ⚠ `span 20` AND NOT `1 / -1` ON THE HERO: `-1` counts from the end of the EXPLICIT grid, and the
   card's child set VARIES (the reason line is on one card of nine, the identity block on another,
   the ask on four), so there is no fixed row to name. Twenty is more rows than this card can ever
   draw; the empty ones have no height and no gap, and the picture's own height spreads across them
   only when it is taller than the words – which is exactly when the answers should sit below it. */
@media (min-width: 1024px) {
  .prologue-card.prologue-card.prologue-card {
    --plo-art: 392px;
    max-width: 880px;
    display: grid;
    grid-template-columns: var(--plo-art) minmax(0, 1fr);
    column-gap: 26px;
    row-gap: 0;
    align-content: start;
  }

  /* ⚠ AND THE HEIGHT CAP OF THE BAND BELOW IS LIFTED, because the reason for it is gone: beside the
     words the picture costs the card no height at all unless it is taller than they are. */
  .prologue-card > .prologue-hero.prologue-hero {
    grid-column: 1;
    grid-row: 1 / span 20;
    align-self: start;
    width: 100%;
    height: auto;
    margin: 0;
  }

  .prologue-card > .prologue-kicker,
  .prologue-card > .prologue-title,
  .prologue-card > .prologue-lede,
  .prologue-card > .prologue-read,
  .prologue-card > .prologue-reason,
  .prologue-card > .prologue-identity {
    grid-column: 2;
  }

  .prologue-card > .prologue-question,
  .prologue-card > .prologue-answers {
    grid-column: 1 / -1;
  }

  /* The reading column is 436px wide here, so the identity's rows stop pairing and stack again –
     two 200px fields holding «September» and a surname is the cramped version of the same block. */
  .prologue-card > .prologue-identity.prologue-identity {
    display: flex;
    flex-direction: column;
  }
}
</style>

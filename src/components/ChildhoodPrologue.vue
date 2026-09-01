<script setup lang="ts">
// ⭐⭐ THE PROLOGUE, END TO END – phase 4 of docs/specs/childhood-prologue-build-2026-09.md §6.
// Nine cards, then the career is created with what they came to, then the handover (§5). This
// component is the only thing that knows the ORDER; the cards are a table, the arithmetic is
// `src/prologue/run.ts`, and everything the nine years earned is spent engine-side by `createWorld`.
//
//     new game -+- the prologue (default) -- 9 cards -- the handover -- the game
//               +- skip ------------------- the existing wizard
//
// ⚠⚠ IT HOLDS NO COPY. Every sentence comes from `src/prologue/cards.ts` or
// `src/prologue/handover.ts` through a binding, exactly as `PrologueCard.vue` holds none - the
// owner has not read a word of the nine cards and §8's rule is that they ship only with his word.
//
// ⚠⚠ WHAT THE PROLOGUE DOES NOT ASK, AND IT IS NOT AN OVERSIGHT TO BE PATCHED QUIETLY. The card
// table asks ONE question about the family - where they are from (§2.4) - and the build spec's §3
// lists the other eight cards' decisions in full. Her name, her family name, her country and her
// birthday are questions only the WIZARD asks today, so a career started here takes them from
// `DEFAULT_PROFILE`. That is a real gap and it is the owner's to close: a naming step is a tenth
// scene, and §7 names the things nobody may smuggle in. `coachTier` and `playStyle` are deliberately
// NOT passed - §4 says both are earned, and `createWorld` derives them from the nine years.
//
// ⚠ THE AGE-10 LOCAL OPEN IS NOT PLAYED HERE. Phase 3 built the field (`src/prologue/pool.ts`) and
// proved the shipped viewer will show one (tests/component/prologue-local-open.test.ts); putting it
// INTO the walk is a screen with a tournament flow in it, and phase 4's three items are the
// handover, the wiring and the two paths. The card at ten still charges for the weekend and still
// counts as a matchplay year, so the childhood the engine is handed is unchanged either way.
import { computed, ref } from 'vue'
import PrologueCard from './PrologueCard.vue'
import PrologueHandover from './PrologueHandover.vue'
import { useGameStore } from '../stores/game'
import { CARD_AGES } from '../prologue/cards'
import { coachReadFor, WALK_COPY } from '../prologue/handover'
import {
  EMPTY_RUN,
  cardFor,
  chosenYears,
  isComplete,
  readTwelfth,
  spentCents,
  warmthAt,
  withOrigin,
  withPick,
  type PrologueRun,
} from '../prologue/run'
import { DEFAULT_PROFILE, type FamilyBackground } from '../shared/protocol'

const emit = defineEmits<{
  /** the player wants the wizard instead (§6) */
  (e: 'skip'): void
  /** the handover is answered and the career is hers – the app shell takes over */
  (e: 'done'): void
}>()

const game = useGameStore()

const run = ref<PrologueRun>(EMPTY_RUN)
const at = ref(0)
/** set once the career exists and the handover is up. It is NOT `game.snapshot !== null`: the
 *  snapshot arrives the instant the career is created, and this screen has to outlive that. */
const handoverOpen = ref(false)

const card = computed(() => cardFor(CARD_AGES[at.value], run.value))
const warmth = computed(() => warmthAt(card.value.age, run.value))
const reasons = computed(() => (card.value.age === 12 ? readTwelfth(run.value).reasons : undefined))
/** ⚠ THE FIRST CARD ONLY – see `WALK_COPY.skip`. */
const skipLabel = computed(() => (at.value === 0 ? WALK_COPY.skip : undefined))

/** HIS BAND, IN THE GAME'S OWN WORDS, off the snapshot. The screen computes NO share, percentage or
 *  headroom of its own: `handoverRoomBand` did the reading engine-side at snapshot time and this
 *  looks his sentence up by the word it returned. It is empty from week 1 onwards, by construction –
 *  see the field's note in `shared/protocol/snapshot.ts` – so there is nothing here a later screen
 *  could start drawing. */
const coachRead = computed(() =>
  game.snapshot ? coachReadFor(game.snapshot.handoverBand, game.snapshot.seed) : '',
)

/** ⭐ ONE ANSWER, WHATEVER KIND OF CARD IT WAS. An origin, a decision and a quiet year all arrive
 *  here; the table says which of the three it was, so nothing branches on the age. */
async function answer(id: string | null): Promise<void> {
  const row = card.value
  if (row.origins) {
    if (id === null) return
    run.value = withOrigin(run.value, id as FamilyBackground)
  } else if (row.options) {
    if (id === null) return
    run.value = withPick(run.value, row.age, id)
  }
  if (at.value < CARD_AGES.length - 1) {
    at.value += 1
    return
  }
  await begin()
}

/** ⭐⭐ THE NINE YEARS, SPENT. Everything §4 permits is applied inside `createWorld` from these two
 *  numbers and a list – the build she arrives with, the family's reserve, the style she earned and
 *  the rung she arrives on – and `potential` is not among them. */
async function begin(): Promise<void> {
  if (!isComplete(run.value)) return
  await game.newCareer(
    '',
    { ...DEFAULT_PROFILE, background: run.value.origin ?? DEFAULT_PROFILE.background },
    { years: chosenYears(run.value), spentCents: spentCents(run.value) },
  )
  if (game.snapshot) handoverOpen.value = true
}

/** ⚠ THE SECOND ANSWER ON THE HANDOVER, AND THE GAME SAYS NOTHING ABOUT WHAT IT IS MECHANICALLY.
 *  His ruling (§2.3): «Про рестарт с перебросом мы ничего не говорим». The career is dropped and the
 *  nine cards start over with nothing carried – a different childhood and, because the seed is
 *  generated fresh, a different girl. No copy on this screen says any of that. */
async function startAgain(): Promise<void> {
  const careerId = game.snapshot?.careerId
  if (careerId) await game.deleteCareer(careerId)
  handoverOpen.value = false
  run.value = EMPTY_RUN
  at.value = 0
}
</script>

<template>
  <PrologueHandover
    v-if="handoverOpen && game.snapshot"
    :axes="game.snapshot.radar"
    :read="coachRead"
    :spent-cents="spentCents(run)"
    :busy="game.busy"
    @go-on="emit('done')"
    @start-again="startAgain()"
  />
  <PrologueCard
    v-else
    :card="card"
    :warmth="warmth"
    :reasons="reasons"
    :skip-label="skipLabel"
    :busy="game.busy"
    @answer="answer"
    @skip="emit('skip')"
  />
</template>

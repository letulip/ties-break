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
// ⭐⭐ WHO SHE IS – CLOSED 02.09.2026, AND THE OWNER CLOSED IT. This header used to record the gap:
// «Her name, her family name, her country and her birthday are questions only the WIZARD asks today,
// so a career started here takes them from `DEFAULT_PROFILE` … it is the owner's to close.» He did:
// «часть нашего текущего онбординга с датой рождения и именем должны остаться», and the same day
// «страну тоже добавь, да». The age-5 card asks all three now (`card.identity`, see
// src/prologue/cards.ts and src/prologue/identity.ts), in the WIZARD's own controls and the wizard's
// own words – there is no tenth scene, and no new sentence reaches the screen.
//
// ⚠ `coachTier` and `playStyle` are still deliberately NOT passed - §4 says both are EARNED, and
// `createWorld` derives them from the nine years. The identity is the opposite kind of field: the
// nine years cannot derive a girl's name.
//
// ⚠ THE AGE-10 LOCAL OPEN IS NOT PLAYED HERE. Phase 3 built the field (`src/prologue/pool.ts`) and
// proved the shipped viewer will show one (tests/component/prologue-local-open.test.ts); putting it
// INTO the walk is a screen with a tournament flow in it, and phase 4's three items are the
// handover, the wiring and the two paths. The card at ten still charges for the weekend and still
// counts as a matchplay year, so the childhood the engine is handed is unchanged either way.
import { computed, ref } from 'vue'
import MuteButton from './MuteButton.vue'
import PrologueCard from './PrologueCard.vue'
import PrologueHandover from './PrologueHandover.vue'
import { useGameStore } from '../stores/game'
import { CARD_AGES } from '../prologue/cards'
import { coachBaseReadFor, coachReadFor, WALK_COPY } from '../prologue/handover'
import {
  EMPTY_RUN,
  cardFor,
  chosenYears,
  isComplete,
  moodAt,
  readTwelfth,
  spentCents,
  warmthAt,
  withOrigin,
  withPick,
  type PrologueRun,
} from '../prologue/run'
import { OPENING_IDENTITY, settleIdentity, type PrologueIdentity } from '../prologue/identity'
import { DEFAULT_PROFILE, type FamilyBackground } from '../shared/protocol'

const emit = defineEmits<{
  /** the player wants the wizard instead (§6) */
  (e: 'skip'): void
  /** the handover is answered and the career is hers – the app shell takes over */
  (e: 'done'): void
}>()

const game = useGameStore()

const run = ref<PrologueRun>(EMPTY_RUN)
/** ⭐ WHO SHE IS, held HERE and not on the card, so walking off the five and back does not forget
 *  what was typed – and so `begin()` reads one source rather than asking a component for it. */
const identity = ref<PrologueIdentity>({ ...OPENING_IDENTITY })
const at = ref(0)
/** set once the career exists and the handover is up. It is NOT `game.snapshot !== null`: the
 *  snapshot arrives the instant the career is created, and this screen has to outlive that. */
const handoverOpen = ref(false)

const card = computed(() => cardFor(CARD_AGES[at.value], run.value))
const warmth = computed(() => warmthAt(card.value.age, run.value))
/** ⭐ WHICH FACE THE YEAR WEARS – phase 7, and it is DERIVED off the same counts `warmth` is
 *  (`moodAt`). Computed here for the same reason `warmth` is: the card draws a row it is handed and
 *  reads no run of its own. There is no `mood` column in the table for anybody to keep in sync. */
const mood = computed(() => moodAt(card.value.age, run.value))
const reason = computed(() => (card.value.age === 12 ? readTwelfth(run.value).reason : undefined))
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

/** ⭐⭐ AND WHERE SHE STANDS TODAY – the second half of the read (phase 7), looked up exactly as the
 *  first is: the ENGINE decided the band at snapshot time (`handoverBaseBand`) and this screen looks
 *  a sentence up by the key it returned. No share, no percentile and no comparison is computed here.
 *
 *  ⚠ THE TWO BANDS ARE NOT THE SAME READING AND MUST NOT BE COLLAPSED INTO ONE. `handoverBand` reads
 *  what she was BORN with, which the childhood cannot move; this one reads what the nine years
 *  BUILT, which is the only place the player's own choices are answered. See handover.ts's header. */
const coachBase = computed(() =>
  game.snapshot ? coachBaseReadFor(game.snapshot.handoverBaseBand, game.snapshot.seed) : '',
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
    {
      ...DEFAULT_PROFILE,
      // ⚠ HER NAME, HER BIRTHDAY AND HER COUNTRY REACH `createWorld` HERE, on exactly the path the
      // wizard's own profile takes – the `new` command has always carried a whole `PlayerProfile`,
      // so nothing about the wire, the schema or the save moved to let this through. `birthMonth`
      // and `birthDay` are what `kidAgeYears` reads for the 13-or-14 opening, so this is also what
      // makes the build spec's §2.1 true of a prologue career.
      ...settleIdentity(identity.value),
      background: run.value.origin ?? DEFAULT_PROFILE.background,
    },
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
  // ⚠ AND THE IDENTITY GOES BACK TOO. «Start again» drops the career and starts the childhood over
  // with NOTHING carried (§2.3) – a different childhood and, because the seed is generated fresh, a
  // different girl. Keeping the typed name would make her the same girl with a new childhood, which
  // is the one thing this control does not mean.
  identity.value = { ...OPENING_IDENTITY }
  at.value = 0
}
</script>

<template>
  <!-- ⭐⭐ THE ONE CONTROL THAT IS NOT A YEAR OF HER CHILDHOOD - the owner's 02.09 ask for a mute
       icon in the top-right corner, and his words for it are quoted in MuteButton.vue's script,
       because Cyrillic may not appear in a template even in a comment (house law). Declared ONCE,
       here, rather than on each of the two surfaces below: the prologue is one takeover as far as
       the player is concerned, and an icon that moved or vanished between the ninth card and the
       handover would be two controls wearing one glyph. It is `position: fixed`, so it adds nothing
       to either card's height - see MuteButton.vue for why that matters on this screen. -->
  <MuteButton />
  <PrologueHandover
    v-if="handoverOpen && game.snapshot"
    :axes="game.snapshot.radar"
    :base="coachBase"
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
    :mood="mood"
    :reason="reason"
    :identity="identity"
    :skip-label="skipLabel"
    :busy="game.busy"
    @answer="answer"
    @identity="identity = $event"
    @skip="emit('skip')"
  />
</template>

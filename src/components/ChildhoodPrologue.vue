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
// ⭐⭐ PHASE 11 – THE TOURNAMENTS ARE IN THE WALK NOW, and this header used to record why they were
// not. It said: «THE AGE-10 LOCAL OPEN IS NOT PLAYED HERE … putting it INTO the walk is a screen
// with a tournament flow in it, and phase 4's three items are the handover, the wiring and the two
// paths.» That was true of phase 4 and the owner then asked for the other half: «мы договаривались,
// что турниры в прологе тоже будут, сейчас этого нет, надо с 10 лет по 1 хотя бы добавить в год, как
// в колледже», and, on the age-10 card, «хотелось бы реально увидеть турнир … а не просто
// пролистать».
//
// SO THE ORDER THIS COMPONENT OWNS IS LONGER BY ONE BEAT, AND ONLY IN THE YEARS THAT HAVE ONE:
//
//     card at N -- (weekend, then its result) x localOpensAt(...) -- card at N+1
//
// ⚠ THE RHYTHM IS NOT DECIDED HERE. `localOpensAt` reads the years the player actually chose and
// answers with a count; this component asks it once per year and plays what it is told. There is no
// list of tournament ages anywhere, in this file or beside the table – see pool.ts's rhythm section.
//
// ⚠ AND THE RESULT SCENE IS A CARD, not a fourth screen. `localOpenCard` builds a `PrologueCard` row
// out of the DRAFT copy table, so `PrologueCard.vue` draws it with the nine years' own fit, contrast
// and painting – and the painting is the owner's three faces, through the `outcome` argument phase 7
// left the hook for («the wiring, when it comes, is one argument at one call site»).
import { computed, ref } from 'vue'
import MuteButton from './MuteButton.vue'
import PrologueCard from './PrologueCard.vue'
import PrologueHandover from './PrologueHandover.vue'
import PrologueLocalOpen from './PrologueLocalOpen.vue'
import { useGameStore } from '../stores/game'
import { CARD_AGES, localOpenCard } from '../prologue/cards'
import { coachBaseReadFor, coachReadFor, playedLine, WALK_COPY } from '../prologue/handover'
import { KID_ID } from '../engine/world'
import { localOpensAt, outcomeOf, playLocalOpen, prologueEntrant, type LocalOpen } from '../prologue/pool'
import type { MatchPlayer } from '../engine/match/types'
import {
  EMPTY_RUN,
  cardFor,
  chosenYears,
  isComplete,
  askAt,
  enteredAges,
  moodAt,
  readTwelfth,
  spentCents,
  warmthAt,
  withEntry,
  withOpen,
  withOrigin,
  withPick,
  yearsLivedBy,
  yearsSoFar,
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

// =================================================================================================
// ⭐⭐ THE WEEKENDS – phase 11
// =================================================================================================

/** ⚠ THE PROLOGUE'S OWN SEED, AND IT IS NOT THE CAREER'S. There is no career while the nine cards
 *  are being walked – `newCareer` is called on the far side of the ninth – so the tournaments need a
 *  seed of their own, and it must be stable for the whole run or a weekend re-entered would be a
 *  different weekend.
 *
 *  ⚠ `Math.random` IS THE STORE'S OWN IDIOM AND IS UI-SIDE, NOT ENGINE-SIDE. `game.newCareer` reads
 *  «UI randomness is fine outside the engine» in as many words and generates a career seed the same
 *  way. Everything downstream of this line is a purpose-scoped sub-stream off it (`rngFromSeed`), so
 *  invariant 2 holds: not one draw of the prologue's tennis reaches MAIN, and the frozen capture
 *  cannot see any of it.
 *
 *  ⚠ AND IT IS DROPPED BY `startAgain`, with the run and the identity – a different childhood means
 *  a different girl, and it would be a strange kind of «start again» that replayed the same draws. */
function freshSeed(): string {
  return `prologue-${(Math.random().toString(36).slice(2) + '0000').slice(0, 8)}`
}
const seed = ref(freshSeed())

/** THE WEEKENDS OF THE YEAR JUST ANSWERED, still to be played – `(age, index)` pairs, taken from the
 *  front. Empty in every year that holds none, which is every year of a childhood that never
 *  entered one. */
const queue = ref<{ age: number; index: number }[]>([])
/** ⚠ THE WEEKEND ON SCREEN – the bracket, the year, AND THE GIRL WHO PLAYED IT, held together.
 *  She is kept here rather than recomputed for the template, and that is not tidiness: a `:kid`
 *  bound to a function call is a NEW object on every render of this component, which invalidates
 *  `PrologueLocalOpen`'s `annotated` computed and re-runs a whole `simulateMatch` for nothing. */
const openNow = ref<{ age: number; open: LocalOpen; kid: MatchPlayer } | null>(null)
/** ...and its result scene, once the player has left the court. */
const resultNow = ref<{ age: number; outcome: ReturnType<typeof outcomeOf> } | null>(null)

/** ⭐ HER, AS THE DRAW MEETS HER – the ninth child, drawn on the game's own band by `prologueEntrant`
 *  and named by whatever the age-5 card was told. `KID_ID` is what makes the viewer point at the
 *  right girl (`matchReadout`'s `kidSide`), and pool.ts guarantees no child can collide with it.
 *
 *  ⭐⭐ AND THE YEARS SHE HAS LIVED GO WITH HER – phase 12, the owner's defect: a girl whose parent
 *  paid for the club, the one-to-one hours and the sports school used to play a Local Open exactly
 *  like a neglected one, because the ninth child was a bare band draw. `yearsLivedBy` is the run's
 *  own list cut at this weekend's age, so this hands the arithmetic the childhood that has actually
 *  happened by now and no year that has not.
 *
 *  ⚠ THIS COMPONENT COMPUTES NO STRENGTH OF ITS OWN, and that is the point of the shape: it passes a
 *  list of years, and `prologueEntrant` spends them through the SHIPPED `childhoodArrival` – the
 *  same function the handover uses at fourteen. There is no second model here to drift.
 *
 *  ⚠ AND THE YEAR ON SCREEN IS ALREADY IN THE LIST. `answer()` writes this year's pick into the run
 *  BEFORE it fills the queue, so a weekend at ten is played by a girl who has lived ages 5..10 – six
 *  years, not five. That is the honest reading: the tenth year's tennis is what bought the entry. */
function kidAt(age: number): MatchPlayer {
  const named = settleIdentity(identity.value)
  const fullName = `${named.kidName} ${named.kidLastName}`
  return prologueEntrant(seed.value, KID_ID, fullName, age, yearsLivedBy(run.value, age))
}

/** ⭐⭐ THE NEXT WEEKEND, PLAYED. The bracket is resolved HERE, before the screen opens, and the run
 *  remembers it at that moment – so what she did does not depend on whether the player watched it,
 *  which is the same rule round 16 #19 states about a report being a consequence of what happened
 *  rather than of a screen having been seen. */
function playNext(): boolean {
  const next = queue.value.shift()
  if (!next) return false
  const kid = kidAt(next.age)
  const open = playLocalOpen(seed.value, kid, next.age, next.index)
  const outcome = outcomeOf(open)
  run.value = withOpen(run.value, {
    age: next.age,
    index: next.index,
    finish: open.finish,
    rounds: open.rounds,
    wins: open.wins,
    outcome,
  })
  openNow.value = { age: next.age, open, kid }
  resultNow.value = null
  return true
}

/** The weekend is over – watched or left, the result is the same one the bracket decided. */
function closeOpen(): void {
  const playing = openNow.value
  if (!playing) return
  openNow.value = null
  resultNow.value = { age: playing.age, outcome: outcomeOf(playing.open) }
}

/** ⭐ THE SCENE ON SCREEN. A weekend's result scene is a card row like any other, so this one
 *  computed is the whole of the branch and `PrologueCard.vue` gets no `v-if` of its own. */
const card = computed(() =>
  resultNow.value
    ? localOpenCard(resultNow.value.age, resultNow.value.outcome)
    : cardFor(CARD_AGES[at.value], run.value),
)
const warmth = computed(() => warmthAt(card.value.age, run.value))
/** ⭐ WHICH FACE THE YEAR WEARS – phase 7, and it is DERIVED off the same counts `warmth` is
 *  (`moodAt`). Computed here for the same reason `warmth` is: the card draws a row it is handed and
 *  reads no run of its own. There is no `mood` column in the table for anybody to keep in sync. */
const mood = computed(() => moodAt(card.value.age, run.value))
/** ⚠ THE FORK'S FOLDED REASON BELONGS TO THE TWELFTH CARD AND TO NOTHING ELSE. A weekend's result
 *  scene carries the year's age too, so without `!resultNow` a Local Open played at twelve would
 *  print the fork's account of the years behind it under a draw sheet. */
const reason = computed(() =>
  !resultNow.value && card.value.age === 12 ? readTwelfth(run.value).reason : undefined,
)
/** ⭐ THE RESULT'S FACE, and it is the ONE argument phase 7 left the hook for. Undefined on all nine
 *  cards, so every frame there is still exactly the one the owner picked. */
const outcome = computed(() => resultNow.value?.outcome)
/** ⭐⭐ THIS YEAR'S TOURNAMENT QUESTION, WHILE IT IS OPEN – the SECOND BEAT on the same card. Null on
 *  the card's own beat, on a card that carries no ask, and once the year has been answered either
 *  way. `askAt` is the whole of the decision; this component only asks whether there is one.
 *
 *  ⚠ AND NEVER OVER A WEEKEND'S RESULT SCENE. That scene is a synthesised row and carries no ask of
 *  its own, but `askAt` is keyed on the AGE – so without the guard the eleventh's question would be
 *  drawn again on top of the result of the weekend it just bought. */
/** ⚠⚠ WHICH BEAT OF THE YEAR IS ON SCREEN, and it is a ref rather than a derivation because the
 *  derivation LIED on the thirteenth. `askAt` is open the moment the year is settled – and the
 *  thirteenth's year is settled by the TWELFTH (`sameAsLastYear`), so a computed keyed on it alone
 *  showed the ask the instant the card arrived and the thirteenth's own scene was never drawn.
 *  Caught by the mounted walk, which could not find the card's way on. */
const beat = ref<'card' | 'ask'>('card')
const ask = computed(() => {
  if (resultNow.value || beat.value !== 'ask') return undefined
  return askAt(CARD_AGES[at.value], run.value) ?? undefined
})
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

/** ⭐ WHAT SHE PLAYED, on the one screen that can still mention it – the weekends are thrown away at
 *  the handover, so this is the last of them. Empty for a childhood that never entered one, and the
 *  handover draws nothing at all then. */
const played = computed(() => playedLine(run.value.opens))

/** ⭐ ONE ANSWER, WHATEVER KIND OF CARD IT WAS. An origin, a decision and a quiet year all arrive
 *  here; the table says which of the three it was, so nothing branches on the age. */
async function answer(id: string | null): Promise<void> {
  // ⭐ A WEEKEND'S RESULT SCENE IS ANSWERED HERE TOO, and it answers nothing: it has no `origins`
  // and no `options`, so it falls straight through to «what comes next», which is the next weekend
  // of that year or the next card. One control, one path out of a scene.
  if (resultNow.value) {
    resultNow.value = null
    if (playNext()) return
    await step()
    return
  }
  const age = CARD_AGES[at.value]

  // ⭐⭐ THE ASK BEAT. While the year's tournament question is open, THIS is what the card's answers
  // are – so one control moves the player on, exactly as on every other beat, and «not this year»
  // finishes the card as completely as «put her name down» does. The owner's correction is the whole
  // of this branch: the answer closes THIS year and nothing else.
  if (ask.value) {
    if (id === null) return
    run.value = withEntry(run.value, age, id)
    beat.value = 'card'
    queue.value = opensForYear(age)
    if (playNext()) return
    await step()
    return
  }

  const row = card.value
  if (row.origins) {
    if (id === null) return
    run.value = withOrigin(run.value, id as FamilyBackground)
  } else if (row.options) {
    if (id === null) return
    run.value = withPick(run.value, row.age, id)
  }
  // ⭐ AND NOW THIS YEAR'S TOURNAMENT QUESTION, IF THE CARD CARRIES ONE – the second beat, on the
  // same painting. `ask` recomputes off the run the line above just moved, so nothing here has to
  // decide which cards ask: the table does.
  if (askAt(age, run.value)) {
    beat.value = 'ask'
    return
  }
  // ⭐⭐ OR, ON THE TENTH, THE WEEKEND THE CARD'S OWN DECISION JUST BOUGHT – asked of `localOpensAt`,
  // which answers with a count off the childhood the player has actually chosen. The tournament
  // plays WHERE THE CARD SITS: this year's answer is in the run by the lines above.
  queue.value = opensForYear(row.age)
  if (playNext()) return
  await step()
}

/** How many weekends the year at `age` holds, as `(age, index)` pairs to be played in order. */
function opensForYear(age: number): { age: number; index: number }[] {
  const count = localOpensAt(yearsSoFar(run.value), age, enteredAges(run.value))
  return Array.from({ length: count }, (_, index) => ({ age, index }))
}

/** On to the next card, or – after the ninth – into the career. */
async function step(): Promise<void> {
  beat.value = 'card'
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
  // ⚠ AND SO DO THE WEEKENDS. `EMPTY_RUN` already drops the list of them; these three drop the ones
  // in flight and the seed they were drawn on, so the next childhood plays its own draws rather than
  // replaying this one's.
  queue.value = []
  openNow.value = null
  resultNow.value = null
  beat.value = 'card'
  seed.value = freshSeed()
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
    :played="played"
    :busy="game.busy"
    @go-on="emit('done')"
    @start-again="startAgain()"
  />
  <!-- ⭐⭐ THE WEEKEND ITSELF - her matches, in the shipped viewer, when the year holds one. It is a
       TAKEOVER and not a card, exactly as every other match screen in the app is, and the way out of
       it is its own header control plus the viewer's own per-match one. See PrologueLocalOpen.vue
       for the ten-minute argument behind having two of them. -->
  <PrologueLocalOpen
    v-else-if="openNow"
    :open="openNow.open"
    :kid="openNow.kid"
    @done="closeOpen()"
  />
  <PrologueCard
    v-else
    :card="card"
    :warmth="warmth"
    :mood="mood"
    :reason="reason"
    :outcome="outcome"
    :ask="ask"
    :identity="identity"
    :skip-label="skipLabel"
    :busy="game.busy"
    @answer="answer"
    @identity="identity = $event"
    @skip="emit('skip')"
  />
</template>

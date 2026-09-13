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
import { CARD_AGES, TOURNAMENT_ANSWER, localOpenCard } from '../prologue/cards'
import { coachBaseReadFor, coachReadFor, playedLine, WALK_COPY } from '../prologue/handover'
import { KID_ID } from '../engine/world'
// ⭐ ROUND 35 #7 – THE GAME'S OWN SPELLER FOR AN AGE, called HERE and not in `src/prologue`: that
// directory's importer set is pinned to name no engine world module (tests/prologue-pool.test.ts),
// and the handover's two age lines still have to be spelled the one way the rest of the game spells
// an age. So the container reads the clock, the speller turns it into a word, and the copy table
// puts the word in its own sentence.
import { ageInWords } from '../engine/world/age'
import { localOpensAt, outcomeOf, playLocalOpen, prologueEntrant, sheRetiredIn, type LocalOpen } from '../prologue/pool'
import type { MatchPlayer } from '../engine/match/types'
import {
  EMPTY_RUN,
  cardAnswered,
  cardFor,
  chosenYears,
  isComplete,
  askOn,
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

const props = withDefaults(
  defineProps<{
    /** ⭐⭐ ROUND 40 #7 B – THE PROLOGUE'S SEED, SUPPLIED FROM OUTSIDE, and it is the career's own
     *  input one level up. `game.newCareer(seed, …)` has always taken a seed and fallen back to a
     *  fresh random one when it is blank; this is the same argument in the same shape, so the walk
     *  that happens BEFORE a career exists can be pinned the same way the career already could.
     *
     *  ⚠ WHY IT HAD TO EXIST: the promo recorder had no way in, so it patched `Math.random` around
     *  the mount – which pinned THIS seed and left the career's own random, and the film walked one
     *  childhood into two different girls under a caption reading «Same hidden potential». A tool
     *  that has to reach inside a global to be deterministic will eventually pin the wrong half.
     *
     *  ⚠ A PROP AND NOT A QUERY PARAMETER, and that is the app's own precedent rather than a
     *  preference: `PrologueLocalOpen.vue` already takes this exact seed as a prop from this
     *  component, and `e2e/careerAt.ts` records the house rule the other way round – «NOTHING HERE
     *  IS A TEST HOOK IN THE PRODUCT … no query parameter, no exposed binding, no branch in src/».
     *  So the seam is a prop, and nothing about the shipped app's URLs, storage or bundle moves.
     *
     *  ⚠ ABSENT IS THE SHIPPED BEHAVIOUR, BYTE FOR BYTE. `App.vue` passes nothing, so this is `''`,
     *  so `initialSeed()` calls `freshSeed()` – the one `Math.random` draw the walk has always
     *  made, unchanged in position and in formula. A player cannot tell this exists. */
    seed?: string
  }>(),
  { seed: '' },
)

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
/** ⚠⚠ ROUND 35 #7 – THE GAP BETWEEN THE LAST CARD AND THE HANDOVER, and it is a state because it
 *  was a HOLE. See `begin()` for what the owner saw fall through it. It is not `game.busy`: that
 *  flag is true for every command the store runs, including the `deleteCareer` inside `startAgain`,
 *  and blanking the walk on any of them would be a much larger claim than this one. */
const creating = ref(false)

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
 *  a different girl, and it would be a strange kind of «start again» that replayed the same draws.
 *
 *  ⚠ ROUND 40 #7 B – `freshSeed` IS NOW THE FALLBACK RATHER THAN THE ONLY SOURCE. `initialSeed()`
 *  below is what the walk actually reads; this function is what it calls when nothing was supplied,
 *  and its formula and its single `Math.random` call are unchanged so the unsupplied walk is the
 *  shipped one byte for byte. */
function freshSeed(): string {
  return `prologue-${(Math.random().toString(36).slice(2) + '0000').slice(0, 8)}`
}

/** ⭐⭐ ROUND 40 #7 B – THE SEED THIS WALK RUNS ON: the one that was supplied, or a fresh draw.
 *
 *  ⚠ `.trim() ||` IS THE STORE'S OWN SPELLING, COPIED ON PURPOSE. `game.newCareer` reads
 *  «Empty seed -> generate a readable one store-side» as `seed.trim() || …`, so an explicit seed
 *  wins, blank and whitespace both mean «none», and the fallback is the shipped draw untouched.
 *  One idiom, two places, and the prologue half no longer needs a global patched to be pinned.
 *
 *  ⚠ AND IT IS A FUNCTION BECAUSE `startAgain` CALLS IT TOO. A supplied seed is supplied for the
 *  whole session of the component, restart included – that is the promo film's actual case, ONE
 *  seed walked down two childhoods – while an unsupplied one keeps drawing fresh, which is what
 *  §2.3's «a different childhood and a different girl» has always meant for a player. */
function initialSeed(): string {
  return props.seed.trim() || freshSeed()
}
const seed = ref(initialSeed())

/** THE WEEKENDS OF THE YEAR JUST ANSWERED, still to be played – `(age, index)` pairs, taken from the
 *  front. Empty in every year that holds none, which is every year of a childhood that never
 *  entered one. */
const queue = ref<{ age: number; index: number }[]>([])
/** ⚠ THE WEEKEND ON SCREEN – the bracket, the year, AND THE GIRL WHO PLAYED IT, held together.
 *  She is kept here rather than recomputed for the template, and that is not tidiness: a `:kid`
 *  bound to a function call is a NEW object on every render of this component, which invalidates
 *  `PrologueLocalOpen`'s `annotated` computed and re-runs a whole `simulateMatch` for nothing. */
const openNow = ref<{ age: number; open: LocalOpen; kid: MatchPlayer } | null>(null)
/** ...and its result scene, once the player has left the court. ⭐ ROUND 39 #15a D2 – `hurt` says
 *  she retired in this weekend's bracket, and the scene is the beat the parent can hold (the hug,
 *  the drive home, the quiet week) instead of one of the three faces. The owner, 08.09: «мой
 *  ребенок травмировался, а я даже ничего не поняла, ни обнять, ни понять что дальше. Надо как-то
 *  это обыграть, если травма вообще случилась.» */
const resultNow = ref<{ age: number; outcome: ReturnType<typeof outcomeOf>; hurt: boolean } | null>(null)

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

/** The weekend is over – watched or left, the result is the same one the bracket decided.
 *  ⚠ AND SO IS `hurt` (round 39 #15a D2): `sheRetiredIn` reads the bracket that was resolved before
 *  the screen opened, so the beat follows a retirement whether the player sat through the popup or
 *  left from the header – it happened to her either way. Deterministic, zero draws on any stream. */
function closeOpen(): void {
  const playing = openNow.value
  if (!playing) return
  openNow.value = null
  resultNow.value = {
    age: playing.age,
    outcome: outcomeOf(playing.open),
    hurt: sheRetiredIn(playing.open, playing.kid.id),
  }
}

/** ⭐⭐⭐ ROUND 41 #4 – WHICH LOCAL OPEN THIS SCENE IS, AND WHAT CAME BEFORE IT. The owner met one
 *  static coach line on four different weekends – «а фраза та же самая пишется, надо какой-то
 *  каунтер завести» – and this is the counter. His Russian is in docs/rounds/round-41.md, item 4.
 *
 *  ⚠⚠ IT IS COUNTED OFF THE RUN AND STORED NOWHERE, which is what makes it deterministic and what
 *  keeps it out of the save. `withOpen` appends the weekend the instant the bracket is resolved
 *  (`playNext`, above, before the screen ever opens), and a result scene is shown for the weekend
 *  that was just played – so the tail of `run.opens` IS this scene, its position in the list IS the
 *  ordinal, and everything in front of it is what came before. Zero draws on any stream.
 *
 *  ⚠ THE AGE IS CHECKED RATHER THAN ASSUMED. The tail is this scene's weekend on every road the
 *  table can produce (a year holds at most one, `LOCAL_POOL.maxPerYear`), and if that ever stops
 *  being true this returns nothing and `localOpenCard` falls back to the result table's own line –
 *  a scene that says less rather than a scene that counts wrong. */
const weekendNow = computed(() => {
  const res = resultNow.value
  if (!res) return undefined
  const opens = run.value.opens
  const last = opens[opens.length - 1]
  if (!last || last.age !== res.age) return undefined
  return { ordinal: opens.length, finish: last.finish, rounds: last.rounds, past: opens.slice(0, -1) }
})

/** ⭐ THE SCENE ON SCREEN. A weekend's result scene is a card row like any other, so this one
 *  computed is the whole of the branch and `PrologueCard.vue` gets no `v-if` of its own. */
const card = computed(() =>
  resultNow.value
    ? localOpenCard(resultNow.value.age, resultNow.value.outcome, resultNow.value.hurt, weekendNow.value)
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
/** ⭐⭐⭐ THIS YEAR'S TOURNAMENT QUESTION – ON THE CARD, FROM THE MOMENT THE CARD ARRIVES.
 *
 *  ⚠⚠ ROUND 35 #4 – THIS USED TO BE A `beat` REF AND THE REF IS WHAT THE OWNER SAW. It held
 *  `'card' | 'ask'` and `answer()` flipped it, so a card that carried a question was drawn TWICE on
 *  one painting: same kicker, same title, same picture, one paragraph and two buttons different. He
 *  reported both of the cards that do it («she asks more», «juniour tour opens at fourteen») as
 *  screens he had already seen. There is one beat now, so there is no ref: the ask is a part of the
 *  card, and the card is finished when both of its questions are (`cardAnswered`).
 *
 *  ⚠ `askOn` AND NOT `askAt`, deliberately, and it is the same distinction `cardAnswered` records.
 *  `askAt` answers «is it still OPEN», which is null for a year that has not been settled yet – so a
 *  screen keyed on it would hide the question until the year was answered and then pop it in, which
 *  is the two-beat defect wearing a smaller costume. `askOn` answers «does this card carry one»,
 *  which is the question a LAYOUT is asking. The old ref's own bug is answered by the same change:
 *  the thirteenth's year is settled by the twelfth (`sameAsLastYear`), and its question is simply on
 *  its card from the start now, beside a scene that is drawn once.
 *
 *  ⚠ AND NEVER OVER A WEEKEND'S RESULT SCENE. That scene is a synthesised row and carries no ask of
 *  its own, but the ask is keyed on the AGE – so without the guard the eleventh's question would be
 *  drawn again on top of the result of the weekend it just bought. */
const ask = computed(() => {
  if (resultNow.value) return undefined
  return askOn(CARD_AGES[at.value], run.value) ?? undefined
})
/** ⭐ WHAT THIS YEAR HAS ALREADY ANSWERED, so a card carrying two questions can show which of them is
 *  settled. Read off the run here rather than held on the card, for the same reason `warmth` and
 *  `mood` are: `PrologueCard` reads no run.
 *
 *  ⭐ ROUND 40 #1 – AND IT ANSWERS FOR THE FIVE'S THREE ORIGINS TOO, which it did not need to while
 *  the answers were plain buttons. They are a radio group now, and a radio that can never report
 *  itself checked is a radio that lies about its state – so the card is handed whichever answer the
 *  run holds, and the five's is `origin` rather than a `picks` entry (`withOrigin`). It is the same
 *  question this computed always asked, asked of the card that is actually on the screen.
 *
 *  ⚠ IT IS STILL A READING AND CHANGES NOTHING: the five is finished the moment an origin is taken
 *  (`cardAnswered` – that card carries no ask), so the mark is on screen for exactly as long as the
 *  press takes, which is the same life `picks` has on the eight, the nine and the ten. */
const picked = computed(() => {
  if (resultNow.value) return undefined
  const age = CARD_AGES[at.value]
  return cardFor(age, run.value).origins ? (run.value.origin ?? undefined) : run.value.picks[age]
})
const entry = computed(() => (resultNow.value ? undefined : run.value.entries[CARD_AGES[at.value]]))
/** ⚠ THE FIRST CARD ONLY – see `WALK_COPY.skip`. */
const skipLabel = computed(() => (at.value === 0 ? WALK_COPY.skip : undefined))

// =================================================================================================
// ⭐⭐⭐ ROUND 41 #9 – A RADIO NEVER ADVANCES; ANSWERING EVERYTHING REVEALS Proceed, AND Proceed DOES
// =================================================================================================
//
// THE OWNER, 12.09: «радиобатон на прологе не должен переключать сразу, он только про выбор, давай
// сделаем где нет активных кнопок, а есть только радиобатоны при выборе всех будет появляться наша
// желтая кнопка proceed – это будет хорошее удобное поведение.» His Russian lives in
// docs/rounds/round-41.md, item 9, where it is allowed to.
//
// ⚠⚠ AND IT KNOWINGLY SUPERSEDES ROUND 40 #3 – his ruling, not an agent's read: «8+9 as cut,
// верно». The 200 ms landing hold existed so the ball a press had just filled could be SEEN before
// the card left. With Proceed there is nothing to defer: a selection never moves the screen at all,
// so the taken state is on the card for as long as the player looks at it. The hold, its constant
// and the unmount guard that carried it are gone – r40 #3's own negative arm says a control with no
// taken state to show is not held, and a card that no longer leaves on a press has nothing to hold.
//
// ⚠ THE PREDICATE IS DERIVED EVERY RENDER AND IS NEVER LATCHED – r40 #2's own rule, arriving on the
// third control of the same column: «при отжатом верхнем нижний не должен быть доступен». Proceed is
// not a state the card enters and keeps; it is a reading of the run, so a card that stops being
// finished stops offering it.
//
// ⚠ AND IT IS OFFERED ONLY WHERE A SELECTION IS WHAT FINISHES THE CARD. The six and the seven, and
// every weekend's result scene, keep the way on they already have (`wayOn`, PrologueCard.vue) – they
// decide nothing, so there is no «answer everything» for a Proceed to wait behind, and a second
// advance control beside the first would be two ways on off one screen.

/** ⭐⭐ IS THIS CARD FINISHED? – the whole of when Proceed is on screen, and the five is the one age
 *  it cannot ask `cardAnswered` about.
 *
 *  ⚠⚠ `cardAnswered(5, run)` IS TRUE FROM THE MOMENT THE FIVE ARRIVES, which is correct for what
 *  that function means and wrong for this question. The five carries no `options` and no
 *  `sameAsLastYear`, so `yearAt` returns the card's own row rather than null, and the five's real
 *  decision is its ORIGIN – which `isComplete` asks about separately for exactly this reason
 *  (run.ts). Keyed on `cardAnswered` alone the five would show Proceed before the player had chosen
 *  where the family is from, which is the one card where that is a lie. */
const cardFinished = computed(() => {
  if (resultNow.value) return false
  const age = CARD_AGES[at.value]
  const row = card.value
  // a card with nothing to select keeps its own way on – r40 #1's negative arm, from this side
  if (!row.origins && !row.options && !row.tournament) return false
  if (row.origins) return run.value.origin !== null
  return cardAnswered(age, run.value)
})

/** ⚠ A LABEL AND NOT A FLAG, exactly as `skipLabel` is: the card holds no copy and no predicate of
 *  its own, so «is it finished» is answered here and the component draws whatever it is handed. */
const proceedLabel = computed(() => (cardFinished.value ? WALK_COPY.proceed : undefined))

// =================================================================================================
// ⭐⭐⭐ ROUND 41 #8 – THE WAY BACK TO THE CARD BEFORE THIS ONE
// =================================================================================================
//
// THE OWNER, 12.09: «На прологе добавить возможность вернуться к первому экрану с созданием
// персонажа со второго экрана … а то я на радиобатон нажал и не ожидал, что меня переключит дальше
// сразу.» Of the two roads he offered – a Back control, or a confirmation popup – the round took
// BACK, because item 9 removes the surprise itself and a confirm would then be a second answer to
// the same complaint (round-41.md, item 8).
//
// ⚠⚠ IT MAY NEVER UNWIND A WEEKEND SHE ACTUALLY PLAYED, and that is the whole of the safety
// argument. `run.opens` is APPEND-ONLY BY DESIGN (run.ts's own note: «a weekend that happened cannot
// un-happen»), so a Back that returned to a year whose Local Open had already been played would
// leave the run holding a weekend for a year the player is being invited to answer differently –
// and answering it «Not this year» would then bill and report a tournament that is no longer in the
// childhood. So Back is offered only where the TARGET card's year holds no played weekend. Below ten
// that is every year by construction (`LOCAL_POOL.fromAge`), which is his literal ask – card 2 back
// to card 1 – and from ten it is every year the player declined.
//
// ⚠ NOTHING IS STORED TO MAKE THE EARLIER CARD REDRAW ANSWERED. `picked` and `entry` above already
// read the run, and the run is what Back walks back into – so the card arrives with its own answer
// marked and re-choosable, and `withPick` / `withOrigin` overwrite the same keys. Everything
// downstream is a computed off the run (`yearAt`, the twelfth's face, the ask's disclosure), so a
// changed answer is recomputed rather than refreshed.
const canGoBack = computed(() => {
  if (resultNow.value || at.value === 0) return false
  const target = CARD_AGES[at.value - 1]
  return !run.value.opens.some((o) => o.age === target)
})

// ⚠ IT SHARES THE SLOT WITH THE WAY OUT, AND THE TWO CAN NEVER BOTH BE THERE: `skipLabel` is the
// first card's and `canGoBack` is every card but the first's – it goes down to the card as itself.
//
// ⚠⚠ THERE IS NO `backLabel` COMPUTED HERE ANY MORE, AND ITS ABSENCE IS THE FIX. It read
// `canGoBack.value ? WALK_COPY.back : undefined` – a word, for a hand-written text button – and the
// standing law (owner, 30.07: «Для back я просил везде сделать один компонент и его консистентно
// использовать, просто иконка с белым fill») says a control whose job is «go back» is `IconButton
// variant="bare" icon="back"` wherever it appears. The card draws the house control off this
// predicate, so the prologue's way back has no copy of its own at all and the `Back` DRAFT left
// `WALK_COPY` with it.

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

/** THE YEAR IS FINISHED – the weekend it just bought, or the next card.
 *
 *  ⚠ ROUND 41 #9 – IT IS NO LONGER REACHED BY ANSWERING. It was split out of `answer()` so the
 *  round-40 hold could defer exactly this; the hold is gone and the split survives it, because the
 *  two ways on off a card are now genuinely two callers – `proceed()` on a card that is answered by
 *  selection, and `answer(null)` on a card that decides nothing. */
async function advanceYear(age: number): Promise<void> {
  // ⭐⭐ THE WEEKEND THE YEAR JUST BOUGHT – asked of `localOpensAt`, which answers with a count off
  // the childhood the player has actually chosen. The tournament plays WHERE THE CARD SITS: this
  // year's answers are all in the run by the time this runs.
  queue.value = opensForYear(age)
  if (playNext()) return
  await step()
}

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
  const row = card.value

  // ⭐⭐⭐ ROUND 35 #4 – ONE SCREEN, TWO QUESTIONS, AND THE ANSWER SAYS WHICH ONE IT IS.
  //
  // The year's own answers are `PrologueOption` ids off the table; the tournament question's two are
  // `TOURNAMENT_ANSWER`'s, which are spelled once in cards.ts and collide with no option id (the
  // tenth's own «Enter her» is `enter`, not `enter-open`). So one control column can carry both
  // questions and this branch is the whole of telling them apart.
  //
  // ⚠ THE ORDER THEY ARE ANSWERED IN IS THE PLAYER'S. Neither answer moves the screen on by itself,
  // so the tournament question may be answered before the year or after it - the card is finished
  // when both are, which is what `cardAnswered` says and what the guard at the foot of this function
  // reads. That is the difference from the two-beat version, where the year had to be settled first
  // because the ask was not on screen until it was.
  if (id === TOURNAMENT_ANSWER.enter || id === TOURNAMENT_ANSWER.decline) {
    // ⚠ AND ONLY ON A CARD THAT ASKS. `withEntry` writes an age-keyed answer; letting one through on
    // a card with no `tournament` row would put an entry in the run that `enteredIn` would then read
    // back as a real one, and the rhythm is computed off exactly that.
    if (!askOn(age, run.value)) return
    run.value = withEntry(run.value, age, id)
  } else if (row.origins) {
    if (id === null) return
    run.value = withOrigin(run.value, id as FamilyBackground)
  } else if (row.options) {
    if (id === null) return
    run.value = withPick(run.value, row.age, id)
  }
  // ⭐⭐⭐ ROUND 41 #9 – AND THAT IS THE WHOLE OF ANSWERING NOW: THE RUN IS WRITTEN AND THE SCREEN
  // STAYS. A radio «только про выбор» – it selects, and nothing else happens – so there is no
  // advance on this path and no card named anywhere to decide which presses move the walk.
  //
  // ⚠ `null` IS THE ONE EXCEPTION AND IT IS NOT A SELECTION. It is the way on off a card that
  // decides nothing (`wayOn` in PrologueCard.vue, round 40 #1's own split: every control that
  // SELECTS emits an id, and the one that only ADVANCES emits null) – the six, the seven and every
  // weekend's result scene. Those cards carry no Proceed, so this is their way on and it advances,
  // exactly as it always did.
  if (id !== null) return
  if (!cardAnswered(age, run.value)) return
  await advanceYear(age)
}

/** ⭐⭐⭐ ROUND 41 #9 – THE YELLOW BUTTON, AND IT IS THE ONLY THING THAT MOVES AN ANSWERED CARD ON.
 *
 *  ⚠ THE PREDICATE IS RE-READ HERE RATHER THAN TRUSTED FROM THE SCREEN. `cardFinished` is what
 *  renders the control and what this refuses on, so a press that arrives from a card the run has
 *  since stopped agreeing with (a stale frame, a double tap on the way out) cannot walk the player
 *  past a year. It is the same «re-validate at the boundary» rule the engine states about commands,
 *  spelled for a screen that owns its own state. */
async function proceed(): Promise<void> {
  if (!cardFinished.value) return
  await advanceYear(CARD_AGES[at.value])
}

/** ⭐⭐ ROUND 41 #8 – BACK ONE CARD, with everything the player answered still in the run.
 *
 *  ⚠ IT MOVES `at` AND NOTHING ELSE. Nothing is cleared, unwound or re-derived by hand: the earlier
 *  card reads its own answer back off the run through `picked` / `entry`, and every reading that
 *  depends on it – the twelfth's face, the ask's disclosure, the money – is a computed. See
 *  `canGoBack` for why a year that has already played its weekend is not offered this. */
function goBack(): void {
  if (!canGoBack.value) return
  at.value -= 1
}

/** How many weekends the year at `age` holds, as `(age, index)` pairs to be played in order. */
function opensForYear(age: number): { age: number; index: number }[] {
  const count = localOpensAt(yearsSoFar(run.value), age, enteredAges(run.value))
  return Array.from({ length: count }, (_, index) => ({ age, index }))
}

/** On to the next card, or – after the ninth – into the career. */
async function step(): Promise<void> {
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
  // ⚠⚠ ROUND 35 #7 – THE NINTH CARD MAY NOT BE DRAWN AGAIN WHILE THE CAREER IS BEING MADE, AND IT
  // WAS. The owner: «потом еще какой-то экран (я не успел прочесть что там), который сразу сменился
  // на She is fourteen» - a screen between the trophy and the handover that flashed past unread. It
  // was THIS card. `newCareer` is a worker round-trip, and for the whole of the await `at` still
  // pointed at the thirteenth and nothing else claimed the screen, so the template fell through to
  // `<PrologueCard>` and re-drew the card the player had just finished - the third sighting of «The
  // junior tour opens at fourteen» in one childhood, which is also half of what he filed as item 4.
  //
  // ⚠ IT HOLDS THE GROUND RATHER THAN A SCENE. There is nothing left to say between the last card
  // and the handover, so the gap draws the prologue's own background and no copy at all: a screen
  // that cannot be read in the time it is up should not have anything on it to read.
  creating.value = true
  try {
    await game.newCareer(
      // ⭐⭐ ROUND 40 #7 C – THE CAREER IS BORN ON THE CHILDHOOD'S OWN SEED. It used to be `''`, so
      // the store drew a fresh random one here and the girl the nine cards had just walked became a
      // DIFFERENT girl the instant the childhood ended. That discontinuity is what the promo film
      // caught – «Same hidden potential» over two girls – but it was never the recorder's: it is in
      // the shipped product, once per prologue career, and every player has been getting it.
      //
      // ⭐ AND IT MAKES A CHILDHOOD REPRODUCIBLE FOR THE PLAYER. One girl, one seed, all the way
      // through – the seed is already persisted per career (`world.seed`), so the childhood that
      // produced her is now recoverable from the save rather than lost at the handover.
      //
      // ⚠ NO SCHEMA MOVES AND NO MIGRATION IS OWED. `seed` is a field every save has carried since
      // v1; what changed is the VALUE a career born after this ships is given, and a career already
      // in flight keeps the seed on its own record untouched. Nothing reads a seed's SHAPE.
      //
      // ⚠ AND AN ORDINARY NEW CAREER IS UNTOUCHED. The wizard and «raise another» still call
      // `newCareer('')` and still get the store's random fallback; a prologue career's seed is the
      // walk's own `freshSeed()` draw unless a tool supplied one, which is exactly as random as the
      // fallback it replaces. A player cannot tell this shipped.
      seed.value,
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
  } finally {
    // ⚠ IN A `finally`, so a refused career does not strand the player on an empty ground with no
    // card and no handover. A failure puts the ninth card back, which is the honest place to be.
    creating.value = false
  }
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
  creating.value = false
  // ⚠ ROUND 40 #7 B – `initialSeed()` AND NOT `freshSeed()`, AND THE DIFFERENCE IS ONLY VISIBLE TO A
  // CALLER THAT SUPPLIED ONE. Nothing supplied (every shipped caller) -> a fresh draw, exactly as
  // before, so §2.3's «a different childhood and a different girl» is unmoved for a player. A seed
  // supplied -> that seed again, which is the whole promo case: the SAME girl walked down a second,
  // different childhood is the comparison the film was trying to film.
  seed.value = initialSeed()
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
    :age-word="ageInWords(game.snapshot.ageYears)"
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
    :seed="seed"
    @done="closeOpen()"
  />
  <!-- ⚠⚠ ROUND 35 #7 - THE GAP, AND IT CARRIES NOTHING. The career is a worker round-trip and this
       branch is what the walk shows while it runs; before it existed the template fell through to
       the card below and re-drew the ninth one, which is the screen the owner could not read before
       it changed. The ground only, and it is the prologue's own (`.prologue-overlay`, src/style.css)
       so the picture does not flash to a different colour on the way to the handover. -->
  <div v-else-if="creating" class="dialog-overlay prologue-overlay" aria-busy="true"></div>
  <PrologueCard
    v-else
    :card="card"
    :warmth="warmth"
    :mood="mood"
    :reason="reason"
    :outcome="outcome"
    :ask="ask"
    :picked="picked"
    :entry="entry"
    :identity="identity"
    :skip-label="skipLabel"
    :proceed-label="proceedLabel"
    :can-go-back="canGoBack"
    :busy="game.busy"
    @answer="answer"
    @proceed="proceed()"
    @back="goBack()"
    @identity="identity = $event"
    @skip="emit('skip')"
  />
</template>

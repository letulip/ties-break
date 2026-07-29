<script setup lang="ts">
// SCREEN D – THE WEEKLY STORY. The week that just resolved, told as a page rather than as a row of
// figures: the week's painting, her line about it in handwriting laid over the picture, four cards
// that read the week (Finances / Training / Mood / Highlights), and the goal for the next one taped
// underneath. `docs/design/README.md` §D, reference shot `docs/design/screenshots/D-weekly-story.webp`.
//
// It was already this screen and nobody had noticed: `docs/specs/ui-inventory.md` §2 listed This
// Week as "no design at all" until somebody read it against the handoff. So this is an APPLICATION
// of D, not an invention - and where it departs from D it is because the handoff and this codebase
// disagree about a fact, which is written down at the point of departure rather than left in a
// commit message.
//
// WHAT THIS CARD IS NOT, unchanged from R5-9/R9-18: it is not a simulated day-by-day log. The seven
// day dots are a deterministic cosmetic spread of the week's train/rest plan, and the four cards are
// pure presentation over the snapshot the engine already hands us - no engine change, no new
// persisted state, and the existence rule (composables/weekRecap.ts) is untouched.
//
// R10-12 SURVIVES THE REDESIGN: when the week held a booked friendly, this is where the player lands
// after "Next week", so the live "watch it" path still starts here. D has no such control - our game
// has a match in that week and the design's does not - so it sits between the grid and the goal
// note, on the design's own CTA pill.
import { computed, ref } from 'vue'
import { useGameStore } from '../stores/game'
import { useKidEmotion } from '../composables/kidEmotion'
import { useWeekAhead } from '../composables/weekAhead'
import { weekArtUrl } from '../art/weeks'
import { travelHomeUrl } from '../art/preload'
import { weekLabel } from '../shared/dates'
import PracticeFlow from './PracticeFlow.vue'
import Card from './ui/Card.vue'
import Eyebrow from './ui/Eyebrow.vue'
import PaperNote from './ui/PaperNote.vue'
import PrimaryPill from './ui/PrimaryPill.vue'
import type { PortraitEmotion } from '../shared/avatarEmotion'
import type { TravelHomeMood, TravelHomeScene, WorldEvent, WorldMatch } from '../shared/protocol'

const game = useGameStore()

const week = computed(() => game.snapshot?.week ?? 0)
const plan = computed(() => game.snapshot?.plan ?? { train: 75, rest: 25 })

// --- THE WEEK PAINTING (D: "Арт недели 286px") ----------------------------------------------------
// We already ship one per week - `art/weeks.ts` is a pure function of which week it is, no RNG - and
// the Season feed has been drawing it since 28.07. The recap only ever covers a NON-tournament week
// (the existence rule), which is exactly the set those paintings were made for, so there is no week
// this card can reach that has no picture.
//
// ...AND ON A WEEK SHE TRAVELLED HOME, THE PAINTING IS THE JOURNEY (owner, 29.07: «sleepy показываем
// рандомно после выездов на турниры в конце на экране Week story как в макете»). Four new scenes -
// asleep in an airport, on a plane, on a bus, in a car.
//
// ⚠ WHERE IT GOES, because "как в макете" and "at the end of the week story" can be read two ways
// and the mockup settles it. Screen D has EXACTLY ONE image slot - `<image-slot id="week-scene">`,
// the 286px painting at the top - and there is nothing after the goal note but the frame's edge.
// What makes it conclusive is the mockup's own handwriting, right under that slot: «Bianca quietly
// fell asleep in the car after the tournament.» The mockup's week IS a come-home-from-a-tournament
// week, its one painting is therefore the sleepy-in-the-car scene, and the note is its caption. So
// this is not a second picture bolted to the bottom of the page; it is the week's painting BEING the
// journey home on the weeks there was one.
//   It is also the only placement that fixes a content bug rather than adding one: the story never
//   renders on a tournament week (recapExists), so a travel-home week is a week whose `weekArtStem`
//   is `training` - she is on court doing ladder drills - on a week she actually spent getting home.
//   The scene replaces a picture that was wrong, instead of sitting under it.
// This is flagged in the report; if the owner meant a second image after the goal note, it is a
// small move and nothing else about the composition depends on it.
//
// ⚠ THE STUB IS GONE. This block used to read `travelHomeScene` through a widening cast, because the
// engine half was being written in a sibling worktree and `DiaryFacts` did not declare the field
// yet. It declares two now – the mode AND the mood – so both are read straight off the snapshot, and
// the URL is built by `travelHomeUrl`, the one builder art/preload.ts warms through. That last part
// matters more than it looks: the preloader and the <img> have to spell the same twelve filenames or
// every come-home week fetches a file it never shows and shows a file it never warmed.
const travelHomeScene = computed(() => game.snapshot?.diary.facts.travelHomeScene ?? null)
const travelHomeMood = computed(() => game.snapshot?.diary.facts.travelHomeMood ?? null)

const artUrl = computed(() =>
  travelHomeScene.value
    ? travelHomeUrl(travelHomeScene.value, travelHomeMood.value ?? 'sleepy')
    : weekArtUrl(week.value),
)

// The week paintings are decorative – the handwriting under them says what the week was. The travel
// scenes are not: they are the ONE place the story says she spent the week getting home, so they say
// it out loud for anyone who cannot see them. Both halves of the picture are described, because both
// carry meaning now: `sleepy` is her asleep, `happy` and `sad` are her awake at the window.
const SCENE_ALT: Record<TravelHomeScene, string> = {
  airport: 'in the airport on the way home',
  plane: 'on the plane home',
  bus: 'on the bus home',
  car: 'in the car on the way home',
}
const MOOD_ALT: Record<TravelHomeMood, string> = {
  sleepy: 'Asleep',
  happy: 'Smiling',
  sad: 'Quiet',
}
const artAlt = computed(() =>
  travelHomeScene.value
    ? `${MOOD_ALT[travelHomeMood.value ?? 'sleepy']} ${SCENE_ALT[travelHomeScene.value]}`
    : '',
)

// Mon–Sun letters shown under the day dots (round-7 item 5b).
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// Evenly spread `trainDays` "train" dots across 7 slots (largest-remainder-free integer
// spread – deterministic, no RNG): slot i is a training day iff the running share crosses
// an integer boundary at i.
const dayDots = computed<('train' | 'rest')[]>(() => {
  const trainDays = Math.round((plan.value.train / 100) * 7)
  const dots: ('train' | 'rest')[] = []
  for (let i = 0; i < 7; i++) {
    const before = Math.floor((i * trainDays) / 7)
    const after = Math.floor(((i + 1) * trainDays) / 7)
    dots.push(after > before ? 'train' : 'rest')
  }
  return dots
})
const trainDayCount = computed(() => dayDots.value.filter((d) => d === 'train').length)

const weekEvents = computed(() => (game.snapshot?.events ?? []).filter((e) => e.week === week.value))
const incomeCents = computed(() =>
  weekEvents.value.filter((e) => e.type === 'income').reduce((s, e) => s + (e.amountCents ?? 0), 0),
)
const expenseCents = computed(() =>
  weekEvents.value.filter((e) => e.type === 'expense').reduce((s, e) => s + (e.amountCents ?? 0), 0),
)
// D's Finances card closes on a BALANCE under a hairline, which we never showed and always had:
// income and spend are two halves of one week and the parent reads the pair to get the answer. The
// engine's own expense events are already signed negative, so the net is the plain sum.
const balanceCents = computed(() => incomeCents.value + expenseCents.value)

// The base-cost expense event's own text doubles as this week's flavor line (world.ts
// picks one of TRAIN_EVENTS/REST_EVENTS for it already) – and it is what D writes by hand across
// the bottom of the painting.
const flavorText = computed(() => weekEvents.value.find((e) => e.type === 'expense')?.text ?? '')

/** THE SCRAP UNDER THE PAINTING, and on a come-home week it is a DIFFERENT WRITER.
 *
 *  The mockup settles this the same way it settled where the journey painting goes – its own
 *  handwriting under the image reads «Bianca quietly fell asleep in the car after the tournament».
 *  That caption is about the journey in the picture above it, so on a week the picture IS the
 *  journey, the note is the engine's `travelNote`: a line in the PARENT's voice about the girl who
 *  just got back, licensed by the facts of the tournament she came back from (engine/diary.ts).
 *
 *  On every other week the scrap keeps what it has always carried – the week's own base-cost flavour
 *  line ("Coaching block: technique drills"), which is the ledger's voice and belongs to a training
 *  week. The two never both apply: `travelNote` is non-null on exactly the weeks the painting is a
 *  journey, so this is one scrap with two authors rather than two scraps. */
const noteText = computed(() => game.snapshot?.diary.travelNote ?? flavorText.value)

function formatSigned(cents: number): string {
  const dollars = Math.round(cents / 100)
  const sign = dollars < 0 ? '-' : '+'
  return `${sign}$${Math.abs(dollars).toLocaleString('en-US')}`
}

// --- MOOD (D's third card) -----------------------------------------------------------------------
// D draws a 38px yellow smiley with painted brows. WE HAVE HER ACTUAL FACE, and the engine already
// decided which one: `diary.facts.emotion` is the ONE emotion decision every portrait surface reads
// (R9-13/15), and the 256px crops behind it are the same ones Home and the Kid screen show. A drawn
// smiley here would be a second, dumber emotion system beside the real one - and it would need
// `--mood`/`--mood-ink`, two colours the app has never declared, to draw a face we already own.
// Same composition as D, same size, real data.
const { moodCropUrl, emotion } = useKidEmotion()

/** Her face, as ONE word – D's "Tired", which is literally one of our seven emotions. Player copy,
 *  so it says what a parent would say rather than repeating the asset's file name. */
const MOOD_WORD: Record<PortraitEmotion, string> = {
  norm: 'Steady',
  happy: 'Happy',
  sad: 'Low',
  serious: 'Focused',
  tired: 'Tired',
  injury: 'Hurt',
  // ⚠ `rehab` joined the faces with ui/art-rehab-sleepy - the STATE of a layoff, as against the
  // moment of going down. A word she wears for weeks, so it is not "Hurt" again.
  rehab: 'On the mend',
  angry: 'Frustrated',
}
const moodWord = computed(() => MOOD_WORD[emotion.value])

// D's "Energy" bar under the face. `condition` IS that number in this game (0..100, 100 = fresh),
// so the bar is the value and the word above it is the band – the same pair Home's condition ring
// and its WHY line already show, at a quarter of the size.
const energy = computed(() => Math.max(0, Math.min(100, game.snapshot?.condition ?? 0)))

// --- HIGHLIGHTS (D's fourth card) ----------------------------------------------------------------
// D lists three short beats – and reading its own three tells you what a beat IS: "Regional SF
// reached" is a result, "Good practice on serve" is what the week's training was, "Long trip" is
// what it cost her. A result, a session, a journey.
//
// ⚠ THE OBVIOUS IMPLEMENTATION IS AN EMPTY CARD, and it took a playtest to see it. Filtering the
// week's events down to "the interesting types" (match / milestone / injury / news) reads correctly
// and renders NOTHING: eighteen weeks into a real career the event log held 34 expenses, 26 incomes
// and not one event of any other type. An ordinary week IS its ledger – the engine writes the week's
// texture into the expense lines ("Coaching block: technique drills", "Restring – multifilament",
// "Physio / recovery session") and nowhere else. So a highlight card that refuses to look at money
// events is a quarter of this screen permanently reading "A quiet week."
//
// What it looks at instead, in order of what actually stands out:
//   1. the week's REAL events – a match she played, a milestone, an injury, a recovery, news;
//   2. HER RANK MOVING, which is the number the whole game is about and which no other card here
//      shows. `prevKidRank` is the engine's own capture from the start of the resolved week, so this
//      is a real weekly delta and not a UI guess (rank improves when the number goes DOWN);
//   3. what the family spent the week on – the flavour lines, minus the one already written across
//      the painting above, and minus the two pure plumbing incomes (the parents' standing
//      contribution and savings interest are not events in anyone's week).
const HIGHLIGHT_TYPES = new Set<WorldEvent['type']>(['match', 'milestone', 'injury', 'recovery', 'info'])

const rankMoveLine = computed<string | null>(() => {
  const snap = game.snapshot
  if (!snap || snap.prevKidRank === null || snap.prevKidRank === snap.kidRank) return null
  const by = Math.abs(snap.prevKidRank - snap.kidRank)
  const dir = snap.prevKidRank > snap.kidRank ? 'up' : 'down'
  return `Rank ${dir} ${by} – now #${snap.kidRank}`
})

const highlights = computed<string[]>(() => {
  const events = weekEvents.value
  // The line already quoted on the paper note, by identity rather than by text, so a week with two
  // identically worded spends still lists the second one.
  const quoted = events.find((e) => e.type === 'expense')
  const beats = events.filter((e) => HIGHLIGHT_TYPES.has(e.type)).map((e) => e.text)
  if (rankMoveLine.value) beats.push(rankMoveLine.value)
  beats.push(...events.filter((e) => e.type === 'expense' && e !== quoted).map((e) => e.text))
  return beats.slice(0, 3)
})

// --- THE GOAL NOTE (D's taped scrap) -------------------------------------------------------------
// D writes "Win one match at the Regional Championship" – the goal for the week ahead. `useWeekAhead`
// is the app's ONE answer to "what is next week", already player-facing copy (R10-7/R12-15), already
// reading the engine's arrival verdict rather than guessing. So the note says what the parent has
// actually committed to, and it can never contradict the button that plays that week.
const weekAhead = useWeekAhead()
const goalLine = computed(() => {
  const w = weekAhead.value
  const entered = game.snapshot?.upcoming.find((e) => e.entered)
  // A tournament she is entered for is a GOAL; anything else is a plan, and saying "win a match" of
  // an exam week would be the copy lying to make itself feel bigger.
  if ((w.kind === 'tournament' || w.kind === 'walkover') && entered) {
    return `Win one match at the ${entered.label}`
  }
  return w.label
})

// The week's booked friendly, if it was played (an injury cancels + refunds it, and then there is
// no match event at all). The engine already resolved it; the flow only presents it.
const friendlyMatch = computed<WorldMatch | null>(
  () => weekEvents.value.find((e) => e.type === 'match' && e.friendly && e.match)?.match ?? null,
)
const practiceLive = ref<WorldMatch | null>(null)

// ⚠ `weekLabel` is imported and used for the practice flow's own header, which needs to name the
// week it is replaying. The week the STORY covers is printed once, by the screen's header
// (ThisWeekScreen), because D puts it there – see the note in tests/week-numbering.test.ts.
const practiceWeekLabel = computed(() => weekLabel(week.value))
</script>

<template>
  <section class="recap-card" :aria-label="`Week story, ${practiceWeekLabel}`">
    <!-- The week's painting. `week-art img` is shared vocabulary (style.css) with the Season feed's
         cards, so the two draw the same picture the same way. -->
    <div class="week-art recap-art">
      <img :src="artUrl" :alt="artAlt" />
    </div>

    <!-- The line about the week, handwritten, riding up over the bottom of the painting. On a
         come-home week it is the parent's note about her; otherwise the week's own flavour line. -->
    <PaperNote
      v-if="noteText"
      class="recap-note"
      :class="{ 'recap-note--travel': travelHomeScene }"
      :tilt="-0.5"
      ruled
      torn
      margin-rule
    >
      <p class="recap-note-text">{{ noteText }}</p>
      <svg class="recap-doodle" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">
        <path d="M12 20.2s-7.4-4.6-7.4-9.5A4.1 4.1 0 0 1 12 8.4a4.1 4.1 0 0 1 7.4 2.3c0 4.9-7.4 9.5-7.4 9.5z" />
      </svg>
    </PaperNote>

    <div class="recap-grid">
      <!-- FINANCES -->
      <Card class="recap-tile" pad="12px 13px">
        <Eyebrow>Finances</Eyebrow>
        <div class="recap-rows">
          <div class="recap-row">
            <span class="recap-row-key">Income</span>
            <span class="recap-row-val num positive">{{ formatSigned(incomeCents) }}</span>
          </div>
          <div class="recap-row">
            <span class="recap-row-key">Spent</span>
            <span class="recap-row-val num negative">{{ formatSigned(expenseCents) }}</span>
          </div>
        </div>
        <span class="recap-hairline"></span>
        <div class="recap-row">
          <span class="recap-row-key">Balance</span>
          <span
            class="recap-balance num"
            :class="balanceCents < 0 ? 'negative' : 'positive'"
          >{{ formatSigned(balanceCents) }}</span>
        </div>
      </Card>

      <!-- TRAINING. D lists skill gains; the Snapshot carries none (see the report/README note),
           so this card is the week's actual training DECISION and the days it bought – which is what
           the seven dots have said since round 7, now under a heading that explains them. -->
      <Card class="recap-tile" pad="12px 13px">
        <Eyebrow>Training</Eyebrow>
        <div class="recap-rows">
          <div class="recap-row">
            <span class="recap-row-key">On court</span>
            <span class="recap-row-val num">{{ plan.train }}%</span>
          </div>
          <div class="recap-row">
            <span class="recap-row-key">Rest</span>
            <span class="recap-row-val num">{{ plan.rest }}%</span>
          </div>
        </div>
        <div class="recap-days" :aria-label="`${trainDayCount} of 7 days training`" role="img">
          <div v-for="(d, i) in dayDots" :key="i" class="recap-day">
            <span class="recap-dot" :class="d" :title="d === 'train' ? 'Training' : 'Rest'"></span>
            <span class="recap-day-letter">{{ DAY_LETTERS[i] }}</span>
          </div>
        </div>
      </Card>

      <!-- MOOD -->
      <Card class="recap-tile" pad="12px 13px">
        <Eyebrow>Mood</Eyebrow>
        <div class="recap-mood">
          <img class="recap-face" :src="moodCropUrl" alt="" />
          <span class="recap-mood-word">{{ moodWord }}</span>
        </div>
        <div class="recap-energy">
          <span class="recap-energy-key">Energy</span>
          <span class="recap-energy-track">
            <span class="recap-energy-fill" :style="{ width: `${energy}%` }"></span>
          </span>
          <span class="recap-energy-val num">{{ energy }}%</span>
        </div>
      </Card>

      <!-- HIGHLIGHTS -->
      <Card class="recap-tile" pad="12px 13px">
        <Eyebrow>Highlights</Eyebrow>
        <ul v-if="highlights.length" class="recap-beats">
          <li v-for="(h, i) in highlights" :key="i" class="recap-beat">
            <span class="recap-bullet" aria-hidden="true"></span>
            <span>{{ h }}</span>
          </li>
        </ul>
        <p v-else class="recap-beats-empty">A quiet week.</p>
      </Card>
    </div>

    <!-- R10-12: the friendly she played this week – watch it live, right where the week landed. -->
    <div v-if="friendlyMatch" class="recap-watch">
      <span class="hint">She played her practice match</span>
      <PrimaryPill class="sfx-watch" @click="practiceLive = friendlyMatch">Watch it live</PrimaryPill>
    </div>

    <!-- The goal for the week ahead, taped on. -->
    <PaperNote class="recap-goal" :tilt="0.4" ruled torn="right" tape>
      <span class="recap-goal-label">Next goal</span>
      <span class="recap-goal-text">{{ goalLine }}</span>
      <svg class="recap-doodle" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M8 4h8v4.5a4 4 0 0 1-8 0z" />
        <path d="M11.4 12.6h1.2V16h-1.2z" />
        <path d="M8.6 19.4h6.8" />
        <path d="M10 16h4l1.2 3.4H8.8z" />
        <path d="M8 5H5.6v1.4A2.9 2.9 0 0 0 8 9.2M16 5h2.4v1.4A2.9 2.9 0 0 1 16 9.2" />
      </svg>
    </PaperNote>

    <PracticeFlow
      v-if="practiceLive"
      :match="practiceLive"
      :week="week"
      :kid-rank="game.snapshot?.kidRank ?? null"
      @close="practiceLive = null"
    />
  </section>
</template>

<style scoped>
/* The story is a PAGE, not a panel: no surface of its own, no border, no inset. Every object on it
   (the painting, the two scraps, the four cards) carries its own edge, which is what lets the paper
   overlap the picture instead of sitting in a box beside it. The old `.recap-card` was a bordered
   `<section>` with a lime outline; the accent that used to shout "read this" is now doing that job
   in four places inside, where it says WHAT to read. */
.recap-card {
  background: none;
  border: none;
  border-radius: 0;
  padding: 0;
  margin: 0 0 16px;
}

/* D: "Арт недели 286px, radius 16px". 286 is the design's 390-wide frame; ours is fluid, so the
   height comes from the painting's own 941x536 the way the Season card takes it, capped at D's
   number so a tablet does not turn the story into a poster.
   THE RADIUS IS --radius-card (18px), and the reason is a RELATIONSHIP rather than a number. D puts
   the painting at 16 and the four cards at 15 - the same corner, to the eye. Neither is a rung of
   the app's radius ladder (the owner settled it 29.07: 4/6/8/10/12/14/18), and picking the nearest
   rung for each SEPARATELY gives art 14 against cards 18, which inverts the design: the picture
   ends up visibly squarer than the cards under it. One rung for both keeps what D is actually
   saying, and 18 is the one every card in the app already sits on - including the Season feed's
   week cards, which draw this same painting. */
/* ⚠ THE SLOT IS D'S OWN PROPORTION (390x286), NOT EITHER PAINTING'S, and it has to be: this frame
   now holds TWO art families of different shapes - the week paintings at 941x536 (1.76:1) and the
   four travel scenes at 512x512 (1:1). Taking the ratio from the picture, the way the Season feed's
   cards do, would make the story's own header jump from a letterbox to a square depending on
   whether she came home that week, and a 343px square is taller than the design's whole slot. So
   the slot is fixed at the design's shape and `object-fit: cover` (shared, `.week-art img`) crops
   into it: the wide painting loses a little width, the square one a little height, and the page
   keeps one silhouette. `max-height` is D's 286 for the wide screens where the ratio would exceed
   it. */
.recap-art {
  aspect-ratio: 390 / 286;
  max-height: 286px;
  border-radius: var(--radius-card);
  overflow: hidden;
}

/* THE NOTE RIDES THE PAINTING. D's own numbers: up 34px over the art, and 2px wider than the
   content column on both sides, so the scrap is visibly not aligned to the grid the cards obey. */
.recap-note {
  position: relative;
  z-index: 1;
  margin: -34px -2px 0;
  padding: 16px 62px 18px 26px;
}

.recap-note-text {
  margin: 0;
  font-size: 23px;
  line-height: 1.32;
}

/* ⚠ THE PARENT'S NOTE IS A LONGER SENTENCE THAN THE LEDGER'S, and the scrap has to stay a scrap.
   The flavour lines this note shares its paper with are ledger fragments – "Restring –
   multifilament", 24 characters, one line at 23px. A parent's note about her week is two clauses
   (the pool caps at 80 characters, pinned in tests/travel-home.test.ts), which at 23px runs to three
   lines and turns the scrap into the card's main content instead of a thing tucked under a
   photograph. One step down the type ramp puts it back at two lines and roughly the visual mass of
   the "Next goal" scrap at the other end of the page. The handwriting, the paper and the tilt are
   unchanged – this is the same object saying a longer thing. */
.recap-note--travel .recap-note-text {
  font-size: 19px;
  line-height: 1.34;
}

/* Both doodles are drawn in the paper's own ink (`currentColor` off .tb-paper), pinned to the
   bottom-right corner the writing already leaves clear. */
.recap-doodle {
  position: absolute;
  right: 16px;
  bottom: 14px;
  color: var(--paper-ink);
}

.recap-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 14px;
}

.recap-tile {
  display: flex;
  flex-direction: column;
}

.recap-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 11px;
}

.recap-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.recap-row-key {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--ink-soft);
}

.recap-row-val {
  font-size: 15px;
  font-weight: 700;
}

.recap-hairline {
  height: 1px;
  margin: 10px 0;
  background: var(--line);
}

.recap-balance {
  font-size: 16px;
  font-weight: 800;
}

/* item 5b's day column (dot + Mon–Sun letter), now the bottom half of the Training card. It is
   pushed to the foot of the card so the two tiles in the top row rule off at the same height. */
/* `margin` in full, not `margin-top`: the round-7 rule of the same name is still in `src/style.css`
   (it belongs to this component and this wave may not edit that sheet – see the report), and its
   `12px 0 6px` shorthand would otherwise leave a stray 6px under the dots. */
.recap-days {
  display: flex;
  justify-content: space-between;
  gap: 4px;
  margin: auto 0 0;
  padding-top: 12px;
}

.recap-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.recap-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-mark);
  background: var(--line);
}

.recap-dot.train {
  background: var(--accent);
}

.recap-dot.rest {
  background: var(--muted);
}

.recap-day-letter {
  font-size: 10px;
  line-height: 1;
  color: var(--muted);
}

.recap-mood {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

/* Her face at D's 38px, round – the app's own small-portrait idiom (Home's header avatar), and the
   crop is the emotion the engine chose for this week. */
.recap-face {
  width: 38px;
  height: 38px;
  flex: none;
  border-radius: 50%;
  object-fit: cover;
  background: var(--card-bottom);
}

.recap-mood-word {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--ink);
}

.recap-energy {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: auto;
  padding-top: 12px;
}

.recap-energy-key {
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-soft);
}

.recap-energy-track {
  flex: 1;
  height: 7px;
  border-radius: var(--radius-mark);
  background: var(--ring-track);
  overflow: hidden;
  display: block;
}

.recap-energy-fill {
  display: block;
  height: 100%;
  border-radius: var(--radius-mark);
  background: var(--accent);
  transition: width var(--dur-slow) cubic-bezier(0.2, 0.8, 0.2, 1);
}

.recap-energy-val {
  font-size: 12px;
  font-weight: 700;
  color: var(--ink-2);
}

.recap-beats {
  list-style: none;
  margin: 11px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.recap-beat {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1.25;
  color: var(--ink-2);
}

.recap-bullet {
  width: 3px;
  height: 3px;
  flex: none;
  margin-top: 6px;
  border-radius: 50%;
  background: var(--muted);
}

.recap-beats-empty {
  margin: 11px 0 0;
  font-size: 12.5px;
  color: var(--muted);
}

.recap-watch {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 14px;
}

.recap-watch .hint {
  margin: 0;
}

/* The goal scrap: D's +0.4°, the opposite cut to the note above it, and the label and the goal on
   one line with the trophy in the corner. */
.recap-goal {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-top: 16px;
  padding: 18px 66px 18px 22px;
}

.recap-goal-label {
  flex: none;
  padding-top: 2px;
  font-size: 20px;
  color: var(--paper-ink-soft);
}

.recap-goal-text {
  font-size: 21px;
  line-height: 1.3;
}

@media (prefers-reduced-motion: reduce) {
  .recap-energy-fill {
    transition: none;
  }
}
</style>

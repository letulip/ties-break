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
// after "Next week", so the "watch it" path still starts here. D has no such control - our game
// has a match in that week and the design's does not - so it sits between the grid and the goal
// note, on the design's own CTA pill.
//
// ⚠ IT IS A REPLAY AND THE BUTTON SAYS SO (owner, 30.07: «She played her practice match - Watch it
// live на кнопке. Ну точно не live, а replay, да?»). He is right, and the fix is one word, but the
// reason is worth writing down because the same word is on other buttons. EVERY match in this game is
// resolved by the ENGINE, inside the tick: `PracticeFlow` and `MatchViewer` re-simulate a stored
// MatchRecord under its stored seed, which is what makes a replay reproduce it point for point. So
// "live" was never a description of the simulation - at most it described the VIEWING, and on this
// card it cannot even do that: the sentence next to the button is already in the past tense.
//   TWO LABELS THAT ARE STILL "live" ARE NOT THIS FILE'S, and are listed in the report rather than
//   edited: `MatchViewer`'s blinking Live badge (`mode === 'live'`) and `PracticeFlow`'s "Watch it",
//   both owned by the match-screen wave this round.
import { computed, ref } from 'vue'
import { useGameStore } from '../stores/game'
import { useKidEmotion } from '../composables/kidEmotion'
// The "Next goal" ladder: which round at which tier she is actually aiming at, and the skill line
// for the long stalls. See composables/nextGoal.ts for the two conventions and the measured threshold.
import { nextGoalFor } from '../composables/nextGoal'
// The day layout, ONCE: screen H's calendar grid and this card's dot row are the same fact about the
// same week, seen from either end of it. See the note above `dayDots`.
import { sessionDays, sessionsForPlan } from '../composables/weekDays'
import { vacationPackage } from '../engine/economy'
import { weekArtUrl, weekSceneArtUrl } from '../art/weeks'
import { weekLabel } from '../shared/dates'
import { formatCentsSigned } from '../shared/money'
import PracticeFlow from './PracticeFlow.vue'
import Card from './ui/Card.vue'
import Eyebrow from './ui/Eyebrow.vue'
import PaperNote from './ui/PaperNote.vue'
import PrimaryPill from './ui/PrimaryPill.vue'
import type { PortraitEmotion } from '../shared/avatarEmotion'
import { LADDER_LABEL, activeLadderOfSnapshot } from '../shared/protocol'
import type { TravelHomeMood, TravelHomeScene, WorldEvent, WorldMatch } from '../shared/protocol'

const game = useGameStore()

const week = computed(() => game.snapshot?.week ?? 0)
const plan = computed(() => game.snapshot?.plan ?? { train: 75, rest: 25 })

// --- THE WEEK PAINTING (D: "Арт недели 286px") ----------------------------------------------------
//
// ⚠ W5 TOOK THE DECISION OUT OF THIS FILE, AND THAT IS THE POINT OF THE SLICE. What stood here was
// three chained ternaries – the journey home, else the holiday, else `weekArtUrl(week)` – each with a
// paragraph of its own explaining why it outranked the next. It worked, and it was a SCREEN deciding
// what a week was: two kinds of week had a picture and everything else fell through to
// `weekArtStem`, which answers `training` for every in-year week. So a nine-week layoff drew nine
// paintings of her doing ladder drills, and nobody could see that from here, because the order was
// spelled out in a component rather than stated once as a rule.
//
// It is `snapshot.diary.scene` now – ONE answer, from `engine/diary.ts weekSceneFor`, where the
// priority order is written down and argued against the note pool's own licences (a journey, then the
// layoff, then the holiday, then the calendar's frame). This file keeps exactly two jobs, and both are
// properly a screen's:
//   * the URL, through `weekSceneArtUrl` – one builder, so the preloader and the <img> cannot spell
//     different filenames (which on the twelve journey pictures would fetch a file it never shows and
//     show one it never warmed);
//   * the DESCRIPTION, below, which is player-facing copy about a picture.
//
// WHERE IT GOES is unchanged and was settled by the mockup: screen D has EXACTLY ONE image slot
// (`<image-slot id="week-scene">`, the 286px painting at the top) and its own handwriting sits under
// it – «Bianca quietly fell asleep in the car after the tournament.» The mockup's week is a
// come-home-from-a-tournament week, so its one painting IS the journey and the note is its caption.
// Every arm here inherits that: the week's painting IS what the week was.
const scene = computed(() => game.snapshot?.diary.scene ?? null)
const artUrl = computed(() => (scene.value ? weekSceneArtUrl(scene.value) : weekArtUrl(week.value)))

// The generic week frames are decorative – the handwriting under them says what the week was – so they
// get an empty alt and stay out of the reading order. THE OTHER THREE ARE NOT: each is the only place
// on the page that says which of several weeks this was, so each says it out loud for anyone who
// cannot see it.
//
// The journey describes BOTH halves of its picture, because both carry meaning: `sleepy` is her
// asleep, `happy` and `sad` are her awake at the window.
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
// The holiday names WHICH of the six weeks away it was, off the catalogue's own label (economy.ts) –
// never a second table in a screen; the Season feed's `packageLabel` reads the same one.
const artAlt = computed(() => {
  const s = scene.value
  if (!s) return ''
  switch (s.kind) {
    case 'travel':
      return `${MOOD_ALT[s.mood]} ${SCENE_ALT[s.scene]}`
    case 'vacation':
      return `The family week away – ${vacationPackage(s.packageId)?.label ?? s.packageId}`
    // The layoff painting is her on the bench with a brace on. It is the one arm whose subject is HER
    // rather than a place, and the alt says so plainly – the Mood card next to it already carries the
    // word ("On the mend"), so this does not try to be a second diagnosis.
    case 'rehab':
      return 'On the bench, working her way back'
    // W6: the two at-home weeks. Both DO get spoken, on the same rule as the three above - each is the
    // only place on the page that says which kind of week this was. The knock line names the week and
    // not the part: the scrap under the painting names the part ("A week off the ankle"), and an alt
    // that repeated it would read the same fact out twice to the one reader who gets it read out.
    case 'exam':
      return 'Revising at home – exams this week'
    case 'knock':
      return 'At home, off the court for the week'
    case 'week':
      return ''
  }
})

// Mon–Sun letters shown under the day dots (round-7 item 5b).
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// WHICH DAYS SHE TRAINED, and it is THE SAME ANSWER THE CALENDAR GIVES.
//
// ⚠ THIS USED TO SPREAD THE DOTS ITSELF, and the calendar slice found the two screens disagreeing
// about the same week. This card had a largest-remainder-free integer spread - slot i is a training
// day iff `floor((i+1)*n/7) > floor(i*n/7)` - which for the balanced preset (5 of 7) rests MONDAY and
// THURSDAY and trains on SUNDAY. `composables/weekDays.ts` rests Sunday first, then midweek, because
// that is the shape a junior's week has and because no two rest days may touch. Both were defensible
// in isolation; together they meant the calendar drew Sunday off on the way INTO a week and this card
// drew her on court that Sunday on the way out of it, off the identical `plan.train`.
//
// So the placement is imported and this file no longer decides. The COUNT never differed - both
// computed `Math.round(plan.train / 100 * 7)`, which is what `sessionsForPlan` is - so nothing about
// how many dots are lit has changed, only which ones, and now only one file can answer that.
//
// The dots stay TRAIN/REST rather than learning the calendar's court-versus-gym distinction: this tile
// is a two-number summary of a week that has already happened (see the pin in tests/radar.test.ts for
// how tightly it is bounded), and the gym day is a detail the grid on screen H has room for.
const dayDots = computed<('train' | 'rest')[]>(() => {
  const on = new Set(sessionDays(sessionsForPlan(plan.value.train)))
  return DAY_LETTERS.map((_, i) => (on.has(i) ? 'train' : 'rest'))
})
const trainDayCount = computed(() => dayDots.value.filter((d) => d === 'train').length)

// --- WHAT CAME ALONG THIS WEEK (D's Training card, in the fog) ------------------------------------
// D lists her skill gains here - "Fitness +6%, Backhand +2%, Serve +8%" - and this screen may not
// draw that, ever. It is not that the Snapshot happens to lack the numbers; it is that giving them
// to it would break the skills radar next door. Her true attributes never leave the engine
// (docs/specs/skills-radar.md, decisions.md #11): screen C is handed an ESTIMATE with an error band,
// and a player handed a weekly delta could sum them from week one and reconstruct her exact build,
// at which point the fog is decoration. The owner ruled on the alternative, 29.07: «Правильная
// версия карточки - та же читка в тумане» / «если не сложно туманную - сделайте».
//
// So the card says WHAT MOVED and never BY HOW MUCH, and it does not decide that here: the reading
// is `snapshot.trainingRead`, built by engine/radar.ts beside the model that owns the truth, because
// it needs the one thing this screen must never have - how sure anybody can be about each wing. On
// most weeks it is null and the card is exactly what it has always been. See `buildTrainingRead`
// for why it is quiet, and for the four things that keep it from being a delta channel in prose.
//
// ⚠ THE WING'S NAME COMES WITH THE READ (`label` = the engine's RADAR_AXIS_LABEL). There is no
// table of axis names in this file and there must not be one: the engine field is `ret`, and a
// screen that capitalised its own field names would print "Ret" at a parent.
const trainingRead = computed(() => game.snapshot?.trainingRead ?? null)

const weekEvents = computed(() => (game.snapshot?.events ?? []).filter((e) => e.week === week.value))

// --- FINANCES (D's first card) -------------------------------------------------------------------
//
// ⚠⚠ OFF THE DURABLE LEDGER, NOT THE EVENT FEED (fix/wallet-and-wrapup, 05.08). This card used to
// fold `weekEvents` – `type === 'income'` and `type === 'expense'` – and the owner played far enough
// for that to stop working entirely: «Что-то сломалось в кошельке в конце сезона, не видно вообще
// никаких доходов ни на каком экране, кроме Home.» His week recap for W47 2038 read
// «Income +$0 · Spent +$0 · Balance +$0» beside a HIGHLIGHTS panel listing three real matches from
// the same week, and his save says why: `world.events` is capped at 400 rows and `pruneEvents`
// sacrifices ordinary rows before it touches one of her matches, so once her retained matches plus
// the kept milestones fill the cap on their own (382 + 18 in his save) EVERY money row is deleted on
// the tick that writes it. The matches survived; the money never existed as far as this card knew.
//
// `finance.weekly12` is the same per-week series the Home budget card charts, folded by the engine
// off `financeWeeks` – the per-category ledger that prunes on a 60-WEEK WINDOW and therefore always
// holds the week this card is showing, which is always the CURRENT one. The prune order is fixed too
// (world.ts), so the feed carries its ordinary rows again; this card is on the ledger regardless,
// because "the money for one week" is a question a count-capped feed must never be asked.
//
// SIGNS. `financeSeries` reports spend as a MAGNITUDE, while this card prints the engine's own
// signed-negative convention and takes the balance as a plain sum – so the expense is negated here
// and nothing below the two consts changes.
const weekFinance = computed(
  () => game.snapshot?.finance.weekly12.find((p) => p.week === week.value) ?? null,
)
const incomeCents = computed(() => weekFinance.value?.incomeCents ?? 0)
const expenseCents = computed(() => -(weekFinance.value?.expenseCents ?? 0))
// D's Finances card closes on a BALANCE under a hairline, which we never showed and always had:
// income and spend are two halves of one week and the parent reads the pair to get the answer. The
// engine's own expense events are already signed negative, so the net is the plain sum.
const balanceCents = computed(() => incomeCents.value + expenseCents.value)

// The base-cost expense event's own text doubles as this week's flavor line (world.ts
// picks one of TRAIN_EVENTS/REST_EVENTS for it already) – and it is what D writes by hand across
// the bottom of the painting.
//
// ⚠ STILL THE FEED, DELIBERATELY, and it is the one thing the ledger genuinely cannot answer: this
// is a SENTENCE ("Restring – multifilament"), not a total, and `financeWeeks` stores cents per
// category. `EVENTS_ORDINARY_FLOOR` is what keeps it here – see the prune note in world.ts. Empty
// string on a week whose rows have aged out, which is what it has always fallen back to.
const flavorText = computed(() => weekEvents.value.find((e) => e.type === 'expense')?.text ?? '')

/** THE SCRAP UNDER THE PAINTING, and it has THREE possible writers now.
 *
 *  The mockup settles the shape the same way it settled where the journey painting goes – its own
 *  handwriting under the image reads «Bianca quietly fell asleep in the car after the tournament».
 *  That caption is about the journey in the picture above it, so on a week the picture IS the
 *  journey, the note is the engine's `travelNote`: a line in the PARENT's voice about the girl who
 *  just got back, licensed by the facts of the tournament she came back from (engine/diary.ts).
 *
 *  W2 ADDS THE SECOND HAND, and it is the one this screen was missing. The owner, 30.07: «чтобы
 *  тренировочные недели не просто скипались ... что происходит на этих неделях когда нет матчей а
 *  только тренировки». Until now an ordinary week fell straight through to the base-cost flavour
 *  line – so the single most story-shaped object on the Weekly Story read "Restring –
 *  multifilament" on exactly the weeks the screen had nothing else to say. `weekNote` is the same
 *  parent writing about the same girl on a week she stayed home: what the plan he set actually cost
 *  her, or what the exam fortnight / the holiday / the layoff looked like from the kitchen.
 *
 *  AND THE LEDGER STILL HAS THE SCRAP ON THE QUIET WEEKS. `weekNote` is null roughly two ordinary
 *  weeks in three (engine/diary.ts WEEK_NOTE_CHANCE), and on those the flavour line is exactly what
 *  it always was. That is the training card's lesson applied to the scrap: land occasionally, and be
 *  a receipt the rest of the time.
 *
 *  The three can never collide: `travelNote` is non-null on exactly the weeks the painting is a
 *  journey, and `weekNote`'s own licence is null on every one of those. One scrap, three authors,
 *  in falling order of how much the week is worth saying out loud. */
const noteText = computed(
  () => game.snapshot?.diary.travelNote ?? game.snapshot?.diary.weekNote ?? flavorText.value,
)
/** Which hand wrote it – the two prose notes are a sentence and take the smaller type; the ledger
 *  fragment is 24 characters and keeps the scrap's own 23px. See the `--travel` rule in the style
 *  block for the measurement. */
const noteIsProse = computed(
  () => !!(game.snapshot?.diary.travelNote ?? game.snapshot?.diary.weekNote),
)


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

// ⚠ THE LADDER SHE IS ACTUALLY ON, AND IT SAYS SO (31.07, fix/ladder-separation). This read
// `snapshot.prevKidRank` / `snapshot.kidRank`, the ITF aliases, and printed a bare "Rank up 4 – now
// #118" with no table beside it. Two things were wrong with that and only one of them is the label:
//
//   * a girl who has never left the country is UNRANKED internationally, and `kidRank` is a number
//     anyway (the whole point-less field ties at zero and shares one dense place, on top of a
//     `cohort.length + 1` fallback). So her week's headline could be a move within a tie she is not
//     a member of, in a table the Stats screen was simultaneously calling "Unranked";
//   * and the move itself could be somebody else's ageing calendar. `ladders[t].prevRank` is the
//     per-ladder capture that exists so a movement arrow can never subtract one table from the other.
//
// `activeLadder` is the engine's one answer to which table she is competing in - the same one Home's
// chip, the Kid screen and the Stats screen's default tab read.
const rankMoveLine = computed<string | null>(() => {
  const snap = game.snapshot
  const ladder = snap?.ladders[snap.activeLadder]
  if (!ladder || ladder.rank === null || ladder.prevRank === null || ladder.prevRank === ladder.rank) return null
  const by = Math.abs(ladder.prevRank - ladder.rank)
  const dir = ladder.prevRank > ladder.rank ? 'up' : 'down'
  return `${LADDER_LABEL[snap.activeLadder]} rank ${dir} ${by} – now #${ladder.rank}`
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
// D writes "Win one match at the Regional Championship" – the goal for the week ahead.
//
// ⚠ IT IS A LADDER NOW, AND WHAT WAS HERE WAS WORSE THAN IT LOOKED. The owner, 30.07: «надо что-то
// более осмысленное писать про цель, например писать реально, что она на какой-то тир турнира
// целится, на четверть или полуфинал, на победу потом, т.е. на шаги ее путь разложить. Если долго не
// получается дойти, то разбавлять какими-то навыками, например next goal: improve stability».
//
// The two arms this replaced: entered for a tournament -> "Win one match at the {label}", FOREVER,
// so a girl with three titles at that rung was still being told to win one match; and otherwise
// `weekAhead.label`, which is the BUTTON's text - an ordinary week printed "Next goal: Training
// week", the week's name written twice.
//
// The whole ladder lives in composables/nextGoal.ts, with the two conventions it rests on and the
// bench that set its one threshold. Nothing was added to the Snapshot for it: `TierDef.points` is
// indexed by finish, so a counting result inverts to the round she reached.
//
// ⚠ AND `useWeekAhead` IS GONE FROM THIS CARD, WHICH IS THE POINT RATHER THAN A TIDY-UP. It is still
// the app's one answer to "what is next week" and it is still what the buttons on Home and the
// calendar read; what it stopped being is a stand-in for a goal. The two are different questions,
// and only one of them was ever being answered here.
const goalLine = computed(() => (game.snapshot ? nextGoalFor(game.snapshot).text : ''))

// The week's booked friendly, if it was played (an injury cancels + refunds it, and then there is
// no match event at all). The engine already resolved it; the flow only presents it.
const friendlyMatch = computed<WorldMatch | null>(
  () => weekEvents.value.find((e) => e.type === 'match' && e.friendly && e.match)?.match ?? null,
)
const practiceLive = ref<WorldMatch | null>(null)
// Same one answer the rank-move line above uses, and the same reason – see `activeLadderOfSnapshot`.
const activeRank = computed(() => activeLadderOfSnapshot(game.snapshot).rank)

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
      :class="{ 'recap-note--travel': noteIsProse }"
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
            <span class="recap-row-val num positive">{{ formatCentsSigned(incomeCents) }}</span>
          </div>
          <div class="recap-row">
            <span class="recap-row-key">Spent</span>
            <span class="recap-row-val num negative">{{ formatCentsSigned(expenseCents) }}</span>
          </div>
        </div>
        <span class="recap-hairline"></span>
        <div class="recap-row">
          <span class="recap-row-key">Balance</span>
          <span
            class="recap-balance num"
            :class="balanceCents < 0 ? 'negative' : 'positive'"
          >{{ formatCentsSigned(balanceCents) }}</span>
        </div>
      </Card>

      <!-- TRAINING. The week's training DECISION, what it is starting to do to her, and the days it
           bought. D lists skill gains in the middle slot; we say what moved WITHOUT saying by how
           much, because a number there would unpick the radar on screen C – see the script. -->
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
        <template v-if="trainingRead">
          <span class="recap-hairline"></span>
          <p class="recap-train-read">
            <span v-if="trainingRead.label" class="recap-train-axis">{{ trainingRead.label }}</span>
            <span class="recap-train-text">{{ trainingRead.text }}</span>
          </p>
        </template>
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

    <!-- R10-12: the friendly she played this week, replayable right where the week landed.
         ⚠ W4 renamed this button – see the R10-12 note in the script for the owner's words and for
         the two labels elsewhere that are NOT this file's to change. The short version: the engine
         resolved this match inside the tick and the viewer re-simulates the stored record, so nothing
         here is live, and the sentence beside the button is already in the past tense. -->
    <div v-if="friendlyMatch" class="recap-watch">
      <span class="hint">She played her practice match</span>
      <PrimaryPill class="sfx-watch" @click="practiceLive = friendlyMatch">Watch the replay</PrimaryPill>
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
      :kid-rank="activeRank"
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
/* ⚠ THE SLOT IS D'S OWN PROPORTION (390x286), NOT ANY PAINTING'S, and it has to be: this frame now
   holds FOUR art families of three shapes - the week paintings at 1.88:1, the twelve travel scenes at
   1:1, the six vacation frames at 2.50:1 (W4) and, since W5, the five layoff paintings at 1:1, which
   are portrait masters and share the travel scenes' square.
   Taking the ratio from the picture, the way the Season feed's cards do, would make the story's own
   header jump between a letterbox, a square and a band depending on what the week was, and a 343px
   square is taller than the design's whole slot. So the slot is fixed at the design's shape and
   `object-fit: cover` (shared, `.week-art img`) crops into it: the wide painting loses a little
   width, the square one a little height, and the page keeps one silhouette. `max-height` is D's 286
   for the wide screens where the ratio would exceed it.
   ⚠ THE VACATION FRAME PAYS THE MOST FOR THIS - a 2.50:1 picture in a 1.36:1 slot is a 45% centre
   crop - so it was checked rather than assumed, all five, at this exact ratio: every subject stays in
   frame and the five stay unmistakably different from each other (a fire pit and friends, hens by a
   village wall, a lake at sunset, the pool, the physio). Following the art instead, the way the
   Season feed does, is one line here and a 137px band at 375; it is in the report as the alternative
   if the owner wants the breadth back rather than one silhouette. */
.recap-art {
  aspect-ratio: 390 / 286;
  max-height: 286px;
  border-radius: var(--radius-card);
  overflow: hidden;
}

/* THE NOTE RIDES THE PAINTING. D's own numbers: up 34px over the art, and 2px wider than the
   content column on both sides, so the scrap is visibly not aligned to the grid the cards obey.
   ⚠ WHERE THE PAPER'S OWN BOX IS SET FROM NOW ON. `PaperNote`'s root is a positioned WRAPPER since
   the tape fix (the tape has to live outside the clip-path, or a torn note loses its top half), so
   a class on the component lands on that wrapper and not on the sheet. What positions the object -
   the lift over the painting, the negative margins, the stacking - is the wrapper's business and
   stays here; the INSET is the paper's and is set through `:deep`. Splitting them this way is what
   keeps the padding inside the sheet's background instead of becoming a transparent gap around it. */
.recap-note {
  position: relative;
  z-index: 1;
  margin: -34px -2px 0;
}

.recap-note :deep(.tb-paper) {
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
   unchanged – this is the same object saying a longer thing.
   ⚠ W2 RE-AIMED THE HOOK, NOT THE RULE. The class used to be applied on `travelHomeScene`, which was
   a proxy for "the note is prose" while the journey was the only prose there was. The ordinary
   week's note is the same length under the same 80-character cap, so it wants the same treatment –
   so the hook is now `noteIsProse` and reads WHICH HAND wrote the scrap rather than which picture is
   above it. Same measurement, same two lines; the name `--travel` stays because the guards in
   tests/travel-home.test.ts and tests/radar.test.ts read this file for it. */
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

/* WHAT CAME ALONG, under the hairline. The wing's name and then the coach's sentence, on the
   Highlights card's own idiom (12.5px/500, --ink-2) because it is the same object: a short line of
   prose in a tile. The wing sits above it in the ink the row keys use rather than in the accent -
   the Eyebrow overhead is already lime, and two accents in one 160px tile fight each other. */
.recap-train-read {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.recap-train-axis {
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--ink);
}

.recap-train-text {
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1.25;
  color: var(--ink-2);
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
   one line with the trophy in the corner.
   ⚠ THIS IS THE NOTE THE OWNER WAS LOOKING AT when he reported half a strip of tape, so it is the
   one that pays the most attention to the split above: the flex row lays out the LABEL, THE GOAL
   and the doodle, which are all slotted INSIDE the sheet, so the row has to be the sheet. Left on
   the wrapper it would have made flex items of the paper and the tape - and laid the tape out
   beside the note instead of across its top edge. */
.recap-goal {
  margin-top: 16px;
}

.recap-goal :deep(.tb-paper) {
  display: flex;
  align-items: flex-start;
  gap: 16px;
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

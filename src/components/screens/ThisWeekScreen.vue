<script lang="ts">
// R9-18: TRUE module scope (a plain script block, compiled once per module – NOT per mount).
// The screen re-mounts on every tab switch (App.vue v-if), so a `<script setup>` ref forgets
// the dismissal and the recap card pops back – the owner's "appears sometimes". Keyed by
// career+week so it can never leak across careers; a page reload re-arms it (acceptable).
// R13-12 moved this mechanism here from HomeScreen.vue, WITH the card it guards.
import { ref as moduleRef } from 'vue'
const dismissedRecapKey = moduleRef<string | null>(null)
</script>

<script setup lang="ts">
// R13-12 – the "This week" tab (the owner's #12). Home became the diary page; the pieces that
// DECIDE and RECAP the week live here now: the week's status (the nearest entered event + this
// week's latest score), the training-plan presets, the planned spend, and the WeekRecapCard.
// Each concern is its own <section>, so the economy wave's future controls (coach settings etc.)
// land as sibling sections instead of a rebuild.
//
// U2 – THIS SCREEN IS D, "Weekly Story" (docs/design/README.md §D), and the discovery is worth
// stating: `docs/specs/ui-inventory.md` §2 listed it as "no design at all" until somebody read it
// against the handoff. It always had one. What this file owns of D is the FRAME – the centred week
// line, and the × that closes the story – while the story itself (painting, handwriting, the four
// cards, the goal scrap) is WeekRecapCard.vue.
//
// THE ORDER IS D'S, AND IT IS AN ARGUMENT: header (which week) → the story of the week that just
// resolved → what you are choosing for the next one. The recap used to sit last, under two blocks
// about the week ahead, which read the arrow of time backwards – and the tab's own accent dot fires
// on a FRESH RECAP, so the thing the dot sent the player here to see was the thing furthest down.
//
// NO TAB BAR CHANGE, and none is wanted: D is a modal overlay in the handoff and ours is a tab. The
// owner settled that (ui-inventory §4 Q1 – every screen keeps the navigation it has), so D's × does
// not close a screen here; it dismisses the story, which is exactly what the card's old "Dismiss"
// link did, in the design's own position.
//
// The sticky advance bar is NOT here and must never move here – it is App.vue's, global on every
// tab (R13-12: the R9-9a "no tab can strand the career" guarantee rides on that bar now).
import { computed } from 'vue'
import { useGameStore } from '../../stores/game'
import { WEEK_PLAN_PRESETS, type WorldMatch } from '../../shared/protocol'
import { coachBillRangeCents, coachById, facilityRateCents, tierOf } from '../../engine/coach'
import { weekDateLine, weekLabel } from '../../shared/dates'
import { KID_ID, ageAtWeek, flipScore } from '../../engine/world'
import { recapExists } from '../../composables/weekRecap'
import WeekRecapCard from '../WeekRecapCard.vue'
import NextTournamentPanel from '../NextTournamentPanel.vue'
import IconButton from '../ui/IconButton.vue'
import PrimaryPill from '../ui/PrimaryPill.vue'
import ScreenShell from '../ui/ScreenShell.vue'

// W1: THE × IS A CLOSE NOW. The story opens itself when a week resolves (App.vue's `week` watcher –
// the design's «Конец недели (игровой тик) → D. Weekly Story ... × возвращает на Home»), so the
// header's × has to do what the design says it does: put the story away AND take the player back to
// the page they came from. It still silences exactly one week, which is what it always did; the
// navigation is the half that was missing while nobody was ever sent here.
const emit = defineEmits<{ close: [] }>()

// ⭐⭐ ROUND 31 #1 – WHAT THE ARRIVAL WAS FOR. The owner pressed Home's `Next tournament` plate and
// got a page opening on the results of the week just gone. The shell carries the reason now
// (App.vue's `openWeek`; the whole argument is there), and this screen honours it by putting the
// block that was asked for at the top – nothing is hidden, nothing is dismissed, and no scrolling is
// involved. A scroll was the other candidate shape and it was rejected on two counts: this screen
// has a sticky header AND a `has-proceed` footer, so the target can land under either of them, and
// happy-dom computes no layout, which means the assertion that it did not is unwritable here – a
// guard that cannot fail is not a guard.
//
// ⚠ `'story'` IS THE DEFAULT AND IT IS THE OLD BEHAVIOUR, BYTE FOR BYTE. A tick, the tab, a reload
// and every mounted test that does not pass the prop all get the recap on top, which is D's own
// order and the reason the tab's accent dot points here.
const props = withDefaults(defineProps<{ entry?: 'story' | 'tournament' }>(), { entry: 'story' })

const game = useGameStore()

const week = computed(() => game.snapshot?.week ?? 0)
// D's header line. `weekDateLine` is the ONE place that shape is spelled (shared/dates.ts, R11-6) –
// our week number, the year in full, then the week's real days. It replaces the bare `weekRange`
// this screen printed under its heading: the header now says WHICH week as well as which days, so
// the section below it does not have to repeat either.
const dateLine = computed(() => weekDateLine(week.value))

// --- Round 5 item 9 / R9-18 – the week-recap card. THE RULE (owner: it appeared
// "sometimes"): the card shows after EVERY RESOLVED week – including multi-week
// advances, where it recaps the LATEST resolved week – and never while a reveal is
// pending. Week 0 (career start) has nothing to recap. A dismissal silences one week.
// ⚠ W4 WIDENED IT BY DELETING A CLAUSE: "and never after a tournament week" is gone. That week is
// the one the owner most wanted the story of («сразу после турнира, как будто домой едем»), and the
// only reason it had none was that two full-screen takeovers wanted the same tick. `pending` already
// says which of them owns the week, so the story simply waits for the flow to let go – see
// composables/weekRecap.ts for the whole argument and App.vue for the door.
// R13-12: the EXISTENCE half of the rule moved to composables/weekRecap.ts – the App shell's
// This-week tab dot reads the same predicate, so the card and the dot cannot disagree.
// U2: the DISMISSAL is unchanged in every respect except which element carries it. It used to be a
// "Dismiss" text link inside the card; D puts the close on the header, so the screen's × calls this
// directly and the card no longer emits anything. One control, one key, same one week silenced.
const showRecap = computed(
  () =>
    !!game.snapshot &&
    recapExists(game.snapshot) &&
    dismissedRecapKey.value !== `${game.snapshot.careerId}:${week.value}`,
)
// W4 – THE STORY'S WAY OUT, AT THE BOTTOM (owner, 30.07: «внизу на week recap давай добавим кнопку
// Proceed посередине, как на home, она прямо просится туда»).
//
// The shape is Home's: the export's CTA pill, floating, centred, one thumb's reach off the tab bar.
// He is right that it asks to be there – the story is a PAGE now, it opens itself at the end of every
// week, and the only way off it was a 20px × in the header, which on a phone is at the far end of a
// scroll the player has just finished making.
//
// ⚠ WHAT IT DOES NOT DO, and the label says so out loud. ADVANCING THE WEEK IS IRREVERSIBLE and lives
// on Home only – that is the wave-2 rule App.vue's own bar is split by, and the reason this screen is
// pinned as carrying no advance control (tests/round13-nav.test.ts). A bare "Proceed" on a page whose
// subject is a week that just ended reads exactly like "play the next one", and a stray tap would
// spend the one thing in this game that cannot be given back. So it is named for WHERE IT GOES, which
// is the idiom the match screens were settled on 30.07 (one exit per screen, named for its
// destination), and where it goes is Home – the design's own «× возвращает на Home», and the screen
// that does carry the advance.
//
// ONE HANDLER, TWO CONTROLS: it is `dismissRecap`, byte for byte the ×. Same key, same one week
// silenced, same navigation. Two objects that mean different things by the same gesture is how this
// screen got its "it appears sometimes" bug in the first place.
function dismissRecap(): void {
  if (game.snapshot) dismissedRecapKey.value = `${game.snapshot.careerId}:${week.value}`
  emit('close')
}

// --- This week: the kid's nearest entered event (soonest upcoming week with
// `entered: true`), or a plain "training week" hint when nothing is entered.
const nearestEntered = computed(() => game.snapshot?.upcoming.find((e) => e.entered) ?? null)

// ⭐⭐ ROUND 33 #1 – THE ARRIVAL IS THE SCREEN, AND THE OWNER'S QUESTION IS WHY IT TOOK FIVE PASSES.
//
// «опять экран next tournament содержит next week – объясни мне пожалуйста, почему вообще получилось
//  так, что эти два на одном экране постоянно оказываются? это разные экраны, нужны для разных вещей,
//  мне кажется у них ничего общего нет. На экране family budget ведь нет ничего такого. На экране
//  конца недели теперь нет информации о next tournament и это правильно.»
//
// Two halves, and the second one is a receipt: round 32 #2 took the tournament off the results view
// and he confirms that was right. What is left is the same removal in the other direction.
//
// ⭐⭐ THE ANSWER IS STRUCTURAL, AND IT IS THE WHOLE ITEM: THERE IS NO TOURNAMENT SCREEN.
// `src/components/screens/` holds ten screens and not one of them is one. Home's plate emits
// `navigate -> 'week:tournament'`; App.vue's `openWeek('tournament')` sets `tab = 'week'` and hands
// THIS screen an `entry` prop. The «next tournament screen» IS the This-week screen wearing a prop,
// which is why rounds 29, 30, 31 and 32 all rearranged blocks INSIDE one screen while he was
// describing two, and why none of them could answer him. His own comparison is the proof: the family
// budget has `MoneyScreen.vue` AND a door of its own; the tournament was never given either.
//
// SO THE PROP DECIDES WHAT THE SCREEN IS, not merely what comes first on it. On the tournament
// arrival the page is the tournament: the header's date line, the panel, and the way back to Home.
// None of the week's own furniture rides along – not the «This week» heading, not the status pill,
// not the week's story, not the training plan – because none of it is what the plate is a door to.
//
// ⚠ AND THERE MUST BE A TOURNAMENT TO BE A SCREEN ABOUT. On a training week the plate opens onto a
// heading and one line of hint; there is nothing to build a screen around, so that arrival falls back
// to the week exactly as it always did (round 31 #1's own training-week arm, unchanged).
// `nearestEntered` is the same fact the panel renders by, so the two cannot disagree.
const tournamentOnly = computed(() => props.entry === 'tournament' && !!nearestEntered.value)
/** ⭐⭐ ROUND 33 #1 – THE STORY IS THE WEEK'S, AND IT BELONGS TO THE WEEK'S OWN ARRIVAL. This is the
 *  mirror of round 32 #2, which took the tournament off the results view – and he confirmed that
 *  half was right in the same message. FOUR THINGS HANG OFF THIS ONE FLAG AND THEY MOVE TOGETHER:
 *  the card, the header's ×, the footer's way off the story, and the padding that footer needs. A
 *  screen showing three of the story's four parts and not the story is how this block drifted before.
 *  ⚠ `showRecap` ITSELF IS UNTOUCHED – the story still EXISTS on the tournament arrival's week, and
 *  it is not dismissed, not silenced and not consumed: it is simply not this screen's subject. The
 *  week's own arrival still opens on it, which is the door a tick uses (App.vue's `week` watcher). */
const showStory = computed(() => showRecap.value && !tournamentOnly.value)
/** ⚠ ROUND 32 #2 – THE PANEL'S RULE, STATED ONCE, because `section.bare` has to obey the same one.
 *  Its own comment below reads «ONLY WHEN THE PANEL IS THERE», and when the panel learned to wait
 *  for the story that sentence and the binding parted company: the results view un-framed a section
 *  holding nothing but a heading and a pill. The `v-if` still ends in `nearestEntered` so the
 *  template keeps narrowing it for `:event`. */
const tournamentShown = computed(() => (!showRecap.value || tournamentOnly.value) && !!nearestEntered.value)

// Round-8 R8-4: once this week's tournament has been played, the status block carries
// the kid's LATEST match score (kid-perspective), read straight off the snapshot's match
// events for the current week – no engine extension. Empty on non-tournament weeks.
function kidScoreOf(m: WorldMatch): string {
  if (!m.score) return ''
  return m.bId === KID_ID ? flipScore(m.score) : m.score
}
const thisWeekScore = computed<string | null>(() => {
  const events = game.snapshot?.events ?? []
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i]
    if (e.type === 'match' && e.week === week.value && e.match?.score) return kidScoreOf(e.match)
  }
  return null
})

// --- The plan: preset pills drive game.setPlan(); the spend range is now the ENGINE's own
// arithmetic (coachWeeklyBandCents = the tier's hourly band at her age × the hours the split
// buys), rather than a hand-copied mirror of it. It used to duplicate EXPENSE_RANGE and the plan
// factor here as literals, which is exactly the drift a shared helper removes. Still an estimate
// in one sense only: the engine draws ONE rate inside the band, so the bill lands between these. ---
const PRESET_ORDER = ['grind', 'balanced', 'light'] as const
const PRESET_LABEL: Record<(typeof PRESET_ORDER)[number], string> = {
  grind: 'Grind 85/15',
  balanced: 'Balanced 75/25',
  light: 'Light 60/40',
}
const plan = computed(() => game.snapshot?.plan ?? WEEK_PLAN_PRESETS.balanced)
const activePreset = computed(() => {
  const p = game.snapshot?.plan
  if (!p) return null
  return PRESET_ORDER.find((k) => WEEK_PLAN_PRESETS[k].train === p.train && WEEK_PLAN_PRESETS[k].rest === p.rest) ?? null
})
const spendRange = computed<[number, number]>(() => {
  const snap = game.snapshot
  if (!snap) return [0, 0]
  // HER coach's own rate, not the rung's band: once someone is hired his price is fixed, and what
  // still moves is the corridor roll and the week's jitter. `coachBillRangeCents` is the same
  // arithmetic resolveBaseCosts bills through, so the estimate cannot drift from the charge.
  //
  // ⚠ AND THE PRICE IS THE MARKET'S CLOCK, NOT HERS - `ageAtWeek(snap.week)`, which is exactly what
  // `resolveBaseCosts` bills at (world.ts). This read `snap.ageYears` while that field WAS the band;
  // since the one-clock ruling (09.08, engine/world/age.ts) it is her real age, and the two part
  // company for a whole season whenever they straddle a coach rate row (12-16 / 17-22 / 23+): a
  // December girl is 16 from week 156 to week 204 while the market has already restocked at 17, so
  // this estimate would have quoted the development rate against a bill charged at the pro one.
  const marketAge = ageAtWeek(snap.week)
  const coach = coachById(snap.seed, marketAge, snap.coachId)
  const rate = coach ? coach.rateCents : facilityRateCents(marketAge, tierOf(coach))
  const [lo, hi] = coachBillRangeCents(rate, snap.plan, snap.profile.background)
  return [Math.round(lo / 100), Math.round(hi / 100)]
})
</script>

<template>
  <ScreenShell v-if="game.snapshot" class="this-week" :class="{ 'has-proceed': showStory }">
    <!-- D's header: the week, centred, with the story's close on the right. The left spacer is what
         centres the line against the × – the design's own three-slot row. -->
    <template #header>
      <div class="week-topbar">
        <!-- ⭐⭐ ROUND 33 #1 – THE WAY OFF THE TOURNAMENT SCREEN, and it is the app's own back control
             rather than a new one. `week` has no seat in the bottom bar, so a screen of its own needs
             a door of its own – which is exactly what the screen he compared it to already has
             (MoneyScreen's and KidScreen's `.back-link`: same component, same variant, same icon, same
             label, same destination). The × beside it cannot do this job and must not be asked to: it
             is the STORY's close, it silences that week's story for good, and on this arrival the
             story is not on the page to be closed.
             ⚠ NO NEW WORDING ENTERS THE APP (CLAUDE.md invariant 4). `Back to Home` is the label those
             two screens already carry on this same control for this same trip, so nothing here is a
             string he has not already approved somewhere else. -->
        <IconButton
          v-if="tournamentOnly"
          class="back-link"
          variant="bare"
          icon="back"
          label="Back to Home"
          @click="emit('close')"
        />
        <span v-else class="week-topbar-slot" aria-hidden="true"></span>
        <!-- ⚠ D10 (docs/specs/e2e-coverage.md §12), the half that was on nobody's list. This is the
             app's most-asserted string and it was a plain `<p>`: the one line that says WHICH week
             this screen is about could not be reached as a heading, so a screen-reader user landing
             on the takeover had no landmark for it and a spec had to address it as free text.
             `role`/`aria-level` on the existing `<p>` rather than an `<h1>`, which is Home's own
             ruling on the identical line: `.week-topbar-line` carries its own size and weight inside
             the three-slot header row, and a real `<h1>` would arrive with the browser's font-size
             and margins and break the centring against the ×. Same semantics, not one pixel moves.
             Level 1 because it is the screen's title and the two `<h2>`s below it are its sections. -->
        <p class="week-topbar-line" role="heading" aria-level="1">{{ dateLine }}</p>
        <button
          v-if="showStory"
          class="week-topbar-slot week-close"
          type="button"
          aria-label="Close the week's story"
          title="Close the week's story"
          @click="dismissRecap"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <!-- ⚠ AND THE SPACER MATCHES WHATEVER IS OPPOSITE IT. The row centres the date line BETWEEN
             its two ends, so a 20px spacer against a 32px back control would push the line 6px off
             centre – the one thing D's three-slot header exists to prevent. -->
        <span
          v-else
          class="week-topbar-slot"
          :class="{ 'week-topbar-slot-wide': tournamentOnly }"
          aria-hidden="true"
        ></span>
      </div>
    </template>

    <!-- ⭐⭐ ROUND 33 #1 – THE STORY IS ON THE WEEK'S OWN ARRIVAL, AND THERE IS ONE OF IT AGAIN.
         Round 31 #1 answered his tap by MOVING this card below the tournament, which kept the two
         screens on one page in a new order; round 33 is the same complaint arriving for the fifth
         time, and the answer this time is that the tournament arrival is not the week. So the second
         copy of this card is gone and the flag is `showStory` – the same `showRecap` it always was,
         minus the arrival the card is not part of. Nothing about the story itself changed: same
         card, same ×, same one week silenced, same footer, same `has-proceed`. -->
    <WeekRecapCard v-if="showStory" />

    <!-- ⭐⭐ ROUND 30 #6 – THE FRAME COMES OFF (his first clause; the quote is in
         NextTournamentPanel.vue's script header, because Cyrillic may not appear in a template).
         `section.bare` is src/style.css's own answer and it is not a new one: the Season screen uses it so that "the cards themselves are the only objects on
         the page", which is exactly the shape he described for this screen - a photograph, a row of
         icons, and one plate. His words in full are in NextTournamentPanel.vue's header.
         ⚠ ONLY WHEN THE PANEL IS THERE. A week with nothing entered is a heading and one line of
         hint, and un-framing that is a change to a state he did not ask about (invariant 4's habit
         applied to layout: not asked is not permission). -->
    <!-- ⭐⭐ ROUND 33 #1 – THE HEADING AND THE PILL ARE THE WEEK'S, and they are the block he was
         naming (his words are quoted in this file's script header and in docs/rounds/round-33.md
         item 1, because Cyrillic may not appear in a template): a section titled for the week, naming
         the week's entry and the week's latest score, sitting on the screen his Next-tournament plate
         opened. The `<section>` itself stays as the panel's host, so `section.bare` still says what
         round 30 #6 made it say and round 32 #2 re-bound it to – on the tournament arrival the plate
         is the only object on the page, which is now literally true. -->
    <section :class="{ bare: tournamentShown }">
      <h2 v-if="!tournamentOnly">This week</h2>
      <div v-if="!tournamentOnly" class="this-week-status">
        <span v-if="nearestEntered" class="pill ok">
          {{ nearestEntered.label }} · {{ nearestEntered.surface }} · {{ weekLabel(nearestEntered.week) }}
        </span>
        <span v-else class="hint" style="margin: 0">No event – training week</span>
        <!-- Round-8 R8-4: latest played match score of this week's tournament, once available. -->
        <span v-if="thisWeekScore" class="this-week-score num">Latest match: {{ thisWeekScore }}</span>
      </div>
      <!-- ⭐⭐ ROUND 29 #8 – the owner clicked Home's "Next tournament" card and found emptiness. It
           is a door and this is what it opens onto; until now the tournament behind it was one pill
           of text. The panel is the tournament-start screen shown one entry early, which is his own
           implementation hint - his words, the whole argument, and the one thing he asked for that
           the snapshot cannot supply are all in NextTournamentPanel.vue's header. -->
      <!-- ⭐⭐ ROUND 32 #2 – ...AND NOT WHILE THE SCREEN IS SHOWING THE WEEK THAT JUST ENDED. His
           words are in docs/rounds/round-32.md item 2, where they may be quoted in his own
           language; the sentence in English is that the results view carries the whole tournament
           plate underneath the results, described exactly as the tournament's own screen describes
           it, and the tournament should come off it. So the panel waits for the story to be gone:
           the results view shows results, the × that already dismisses the story then reveals what
           is next, and the arrival through Home's plate still opens on the tournament - which is
           what `|| tournamentOnly` is holding open.
           ⚠⚠ THE COUNT IS THE FINDING. Round 29 part two grew the recap, round 30 #1 cut it back,
           round 31 #1 moved the order, round 32 #2 took the panel off the results view - four passes
           over two blocks, and he came back a fifth time. Round 33 #1 is why: he was never describing
           two blocks. He was describing two SCREENS, and they were one file. -->
      <NextTournamentPanel v-if="tournamentShown && nearestEntered" :event="nearestEntered" />
    </section>

    <!-- ⭐⭐ ROUND 33 #1 – AND THE TRAINING PLAN IS THE WEEK'S TOO. Round 30 #6 asked for it to stay
         at the bottom of this screen and it does, on the screen it belongs to. His clause about it
         (quoted in NextTournamentPanel.vue's script header, because Cyrillic may not appear in a
         template) was a placement INSIDE the week, written before anybody had noticed that the week
         and the tournament were one file. It is the last thing on the week's arrival, framed, with
         its presets, its plan line and its spend row untouched – and it is not on a screen whose
         subject is a tournament that has not been played yet. -->
    <section v-if="!tournamentOnly">
      <h2>Training plan</h2>
      <div class="option-row" style="margin-top: 10px">
        <button
          v-for="p in PRESET_ORDER"
          :key="p"
          class="option-pill"
          :class="{ selected: activePreset === p }"
          :disabled="game.busy"
          @click="game.setPlan(WEEK_PLAN_PRESETS[p])"
        >
          {{ PRESET_LABEL[p] }}
        </button>
      </div>
      <!-- R9-8: the plan reads as unbordered plain text, ONE line, with this week's
           tournament name when one is entered (the pill frame is gone). -->
      <p class="this-week-plan">
        Training {{ plan.train }}% · Rest {{ plan.rest }}%<template v-if="nearestEntered">
          · {{ nearestEntered.label }} – {{ weekLabel(nearestEntered.week) }}</template>
      </p>
      <div class="spend-row">
        <span class="hint">Planned spend</span>
        <span class="negative num">${{ spendRange[0] }}–${{ spendRange[1] }}</span>
      </div>
    </section>

    <!-- The story's way off the page (owner, 30.07). Floating and centred, the same CTA pill Home's
         week button is - and named for where it goes, because it does NOT spend a week.
         ⚠ ROUND 33 #1: it is the STORY's control, so it goes where the story goes. The tournament
         arrival has its own way off in the header, and it is a back arrow rather than this pill
         because this one silences a week's story on the way out. -->
    <template v-if="showStory" #footer>
      <div class="week-proceed">
        <PrimaryPill variant="cta" class="week-proceed-btn" @click="dismissRecap">Proceed to Home</PrimaryPill>
      </div>
    </template>
  </ScreenShell>
</template>

<style scoped>
/* D's header row: three slots, so the week line is centred on the SCREEN rather than on whatever is
   left over beside the ×. The design's 26/20/16 inset is the phone frame's; ours sits inside the
   app's own 16px gutter (`--app-pad-x`), so only the vertical part of it is spent here. */
.week-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 0 16px;
}

.week-topbar-slot {
  width: 20px;
  flex: none;
}

/* ⭐⭐ ROUND 33 #1 – the spacer that balances the back control. `IconButton variant="bare"` is a 32px
   box (its own `.tb-iconbtn--bare`), and this row centres the date line BETWEEN its two ends, so the
   opposite slot has to be the same width or the line drifts 6px left. Two classes rather than one
   value, because the × arrival is still 20px and must not move by a pixel. */
.week-topbar-slot.week-topbar-slot-wide {
  width: 32px;
}

.week-topbar-line {
  margin: 0;
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: 0.01em;
  /* D asks for #c3ccd2 – a fifth step of ink this app has never declared (it keeps four: --ink,
     --ink-2, --ink-soft, --ink-dim). `--ink-2` is the neighbouring step and the one this line is
     doing the job of; adding a colour to satisfy a header would break the one rule the handoff
     states twice. */
  color: var(--ink-2);
}

/* The × is a real button: it is the story's close, so it needs the keyboard and a focus ring. */
.week-close {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  padding: 0;
  border: none;
  background: none;
  color: var(--ink-2);
  cursor: pointer;
}

.week-close:hover {
  color: var(--text);
}

/* THE PROCEED BAR (owner, 30.07: «как на home»). Home's floating advance button lives in
   src/style.css, and this is its geometry, deliberately re-stated rather than shared:
     - the CLASS may not be reused, and this file may not even NAME it. That class is the ADVANCE
       bar; "no tab screen carries an advance control of its own" is a pinned rule
       (tests/round13-nav.test.ts) which reads this file for the literal string, and it is right to -
       two controls that look alike and cost wildly different things must not answer to one name.
     - the SHAPE is shared, and properly: the pill itself is `PrimaryPill variant="cta"`, which IS
       the export's CTA (U0 #7) and is the same object Home's button renders by hand. So the two
       cannot drift in appearance while staying honestly different in meaning.
   `pointer-events` follows Home's pattern: the strip is transparent to taps so the story scrolls
   under it, and only the pill takes the press. */
.week-proceed {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 58px;
  width: 100%;
  /* ⚠ ROUND 36 PHASE 2 – see `.cal-go` in CalendarScreen.vue and the shell's own week button in
     src/style.css: three copies of one floating-CTA box, and phase 1 moved only the one that lives
     in the sheet. The button is centred, so the token changes nothing on screen at any width; it
     stops this box from being a 520px island under a 736px column.
     ⚠ The shell's rule is not named by its class here on purpose - tests/round13-nav.test.ts reads
     this file as text and refuses that name in a tab screen, comments included. See CalendarScreen. */
  max-width: var(--app-bar-max);
  display: flex;
  justify-content: center;
  padding: 0 16px;
  pointer-events: none;
  z-index: 39;
}

.week-proceed-btn {
  pointer-events: auto;
  min-width: 206px;
  max-width: 100%;
}

/* ...and the page has to end above it. The App shell reserves 96px under the content on every tab
   that is not Home, which is 7px short of this pill's own footprint (58px of clearance plus its own
   height) - so the goal scrap's last line sat under the button at 375. This is the difference, paid
   only on the weeks the button exists. */
.this-week.has-proceed {
  padding-bottom: 62px;
}
</style>

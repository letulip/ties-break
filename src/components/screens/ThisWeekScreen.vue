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
import { coachBillRangeCents, coachById, selfRateCents } from '../../engine/coach'
import { weekDateLine, weekLabel } from '../../shared/dates'
import { KID_ID, flipScore } from '../../engine/world'
import { recapExists } from '../../composables/weekRecap'
import WeekRecapCard from '../WeekRecapCard.vue'
import PrimaryPill from '../ui/PrimaryPill.vue'
import ScreenShell from '../ui/ScreenShell.vue'

// W1: THE × IS A CLOSE NOW. The story opens itself when a week resolves (App.vue's `week` watcher –
// the design's «Конец недели (игровой тик) → D. Weekly Story ... × возвращает на Home»), so the
// header's × has to do what the design says it does: put the story away AND take the player back to
// the page they came from. It still silences exactly one week, which is what it always did; the
// navigation is the half that was missing while nobody was ever sent here.
const emit = defineEmits<{ close: [] }>()

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
  const coach = coachById(snap.seed, snap.ageYears, snap.coachId)
  const rate = coach ? coach.rateCents : selfRateCents(snap.ageYears)
  const [lo, hi] = coachBillRangeCents(rate, snap.plan, snap.profile.background)
  return [Math.round(lo / 100), Math.round(hi / 100)]
})
</script>

<template>
  <ScreenShell v-if="game.snapshot" class="this-week" :class="{ 'has-proceed': showRecap }">
    <!-- D's header: the week, centred, with the story's close on the right. The left spacer is what
         centres the line against the × – the design's own three-slot row. -->
    <template #header>
      <div class="week-topbar">
        <span class="week-topbar-slot" aria-hidden="true"></span>
        <p class="week-topbar-line">{{ dateLine }}</p>
        <button
          v-if="showRecap"
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
        <span v-else class="week-topbar-slot" aria-hidden="true"></span>
      </div>
    </template>

    <WeekRecapCard v-if="showRecap" />

    <section>
      <h2>This week</h2>
      <div class="this-week-status">
        <span v-if="nearestEntered" class="pill ok">
          {{ nearestEntered.label }} · {{ nearestEntered.surface }} · {{ weekLabel(nearestEntered.week) }}
        </span>
        <span v-else class="hint" style="margin: 0">No event – training week</span>
        <!-- Round-8 R8-4: latest played match score of this week's tournament, once available. -->
        <span v-if="thisWeekScore" class="this-week-score num">Latest match: {{ thisWeekScore }}</span>
      </div>
    </section>

    <section>
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
         week button is - and named for where it goes, because it does NOT spend a week. -->
    <template v-if="showRecap" #footer>
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
  max-width: 520px;
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

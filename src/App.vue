<script setup lang="ts">
// Package I – app shell: slim header + 5-tab bottom bar, or the full-screen
// onboarding wizard when there is no active career. No router – a plain ref
// switch, per spec.
import { computed, onMounted, ref, watch } from 'vue'
import type { StopReason, WorldMatch } from './shared/protocol'
import { useGameStore } from './stores/game'
import { needRefresh, applyUpdate } from './pwa'
// R10-7: the sticky bar's primary button says what the week AHEAD holds (tournament / vacation /
// practice / exams / off-season / training). All of the derivation lives in the composable – this
// file only renders the label it hands back.
import { useWeekAhead } from './composables/weekAhead'
// R13-12: the This-week tab's accent dot reads the SAME recap-existence rule the tab's screen
// renders the card by – one predicate, two consumers, zero drift.
import { recapExists, thisWeekDotShows } from './composables/weekRecap'
import { playSfx } from './audio/sfx'
import SplashScreen from './components/SplashScreen.vue'
import OnboardingWizard from './components/OnboardingWizard.vue'
import OnboardingTour from './components/OnboardingTour.vue'
import TournamentFlow from './components/TournamentFlow.vue'
import PracticeFlow from './components/PracticeFlow.vue'
import SeasonSummaryDialog from './components/SeasonSummaryDialog.vue'
import InjuryStopDialog from './components/InjuryStopDialog.vue'
import HomeScreen from './components/screens/HomeScreen.vue'
import SeasonScreen from './components/screens/SeasonScreen.vue'
import ThisWeekScreen from './components/screens/ThisWeekScreen.vue'
import KidScreen from './components/screens/KidScreen.vue'
import StatsScreen from './components/screens/StatsScreen.vue'
import MoneyScreen from './components/screens/MoneyScreen.vue'
import MoreScreen from './components/screens/MoreScreen.vue'

// Round 5 item 23: a small accent dot on the Season tab until the player has visited it
// since the last "New events on the calendar" marker. UI-only state (localStorage), no
// engine change – the marker text itself is emitted from world.ts's ensureSeason.
const SEASON_SEEN_KEY = 'tb:lastSeenSeasonWeek'
// Round 5 item 10: the coach-mark tour is shown once, ever, per device.
const TOUR_SEEN_KEY = 'tb:onboardingTourSeen'
const game = useGameStore()

// A2 (owner, 28.07): the app header is GONE, so the shell shows no face of hers at all. R13-12's
// door to the Kid screen and F45-1's rule about which crop it wears both moved to HomeScreen with
// the avatar itself; the shell only routes. (The guards in tests/round11-followups.test.ts and
// tests/round13-nav.test.ts are plain text searches, so this file must not name the crop
// composable or the hint key even in a comment – which is the point.)
const weekAhead = useWeekAhead()

onMounted(() => game.init())

// Round-6 item 2: the splash screen shows on EVERY launch, once init() has settled
// (game.ready) – before either the onboarding wizard or the tab shell. Plain per-mount
// ref, not persisted: "every launch" means every page load, not "once ever".
const splashDone = ref(false)

// 'money' and 'kid' stay valid CONTENT states without a bottom-tab button. Both are reached from
// Home now (A2, 28.07): the wallet from the Family budget card, her profile from her photograph.
// Round-6 dropped Money's tab for Stats; R13-12 dropped the Kid tab for the avatar.
type TabId = 'home' | 'play' | 'week' | 'kid' | 'stats' | 'money' | 'more'
const tab = ref<TabId>('home')

// Package J: the 'play' tab id stays (per spec – no router, minimal diff) but
// is now the Season tab (calendar placeholder + the old exhibition block).
// Round-6: emoji tab glyphs replaced by the owner's SVG icon set (public/icons/*.svg,
// tinted via CSS mask so they follow the button's text color exactly – see `.tab-icon`
// in style.css and `iconUrl()` below). 'money' and 'kid' have no entry here on purpose
// (see TabId). R13-12 (the owner's nav design): the Kid tab left the bar for her photograph, and
// "This week" – the plan + recap tab (ThisWeekScreen) – took the slot.
//
// epic/redesign-home (the owner's redesign, 28.07): the bar is now
//   Season · Calendar · Home · Stats · More
// with HOME IN THE CENTRE – the whole point of the new order, and the reason the bar keeps five
// slots even though only four of them are live.
//
// TWO CONSEQUENCES, both deliberate:
//
//  1. CALENDAR IS A PLACEHOLDER. It is a real tab in the owner's design and it is NOT built in this
//     slice. It renders (glyph + word, a third of the weight, disabled, no press state, no dot) so
//     that Home actually sits in the middle. The alternative – four live tabs – puts Home in seat
//     two of four, which is not the design; an empty gap in the bar reads as a rendering bug. A
//     dimmed tab reads as "next". Its glyph is week.svg, the dot-grid calendar freed up below; the
//     Season tab keeps season.svg (the dated page), so the two are never the same picture.
//
//  2. "THIS WEEK" LEFT THE BAR, NOT THE APP. It joins 'money' and 'kid' as a tabless CONTENT state –
//     the established idiom here – and its door is Home's NEXT TOURNAMENT card, which is exactly
//     what that screen is about (what she is entered for, what we plan for it, how the last one
//     went). The fresh-recap dot moved onto that card with it, so nothing that used to be reachable
//     or noticeable stopped being either.
type NavId = TabId | 'calendar'
const TABS: { id: NavId; icon: string; label: string; soon?: true }[] = [
  { id: 'play', icon: 'season', label: 'Season' },
  { id: 'calendar', icon: 'week', label: 'Calendar', soon: true },
  { id: 'home', icon: 'home', label: 'Home' },
  { id: 'stats', icon: 'stats', label: 'Stats' },
  { id: 'more', icon: 'more', label: 'More' },
]
/** The one writer of `tab` from the bar. A placeholder slot is inert by construction – it can never
 *  route to a screen that does not exist, whatever its `id` says. */
function openNav(entry: (typeof TABS)[number]): void {
  if (entry.soon) return
  tab.value = entry.id as TabId
}
function iconUrl(icon: string): string {
  return `${import.meta.env.BASE_URL}icons/${icon}.svg`
}

// No active snapshot once init() has settled means: no auto-loaded slot and no
// in-progress career (fresh install, or a client-side reset from More).
const showOnboarding = computed(() => game.ready && !game.snapshot)

// A career appearing after onboarding must land on Home, not whatever tab was
// active before the reset (e.g. More, where "New career" lives).
watch(
  () => game.snapshot,
  (now, before) => {
    if (now && !before) {
      tab.value = 'home'
      // Consume the one-shot "first ever career" signal exactly once, regardless of
      // whether the tour actually launches (already seen on this device -> skip it).
      if (game.firstEverCareer) {
        game.$patch({ firstEverCareer: false })
        if (!localStorage.getItem(TOUR_SEEN_KEY)) showTour.value = true
      }
    }
  },
)

const week = computed(() => game.snapshot?.week ?? 0)

// --- Season tab "new events" accent dot (item 23) ---------------------------
// `lastSeenSeasonWeek` is mirrored into a reactive ref: a plain localStorage.getItem()
// inside a computed isn't a tracked dependency, so the dot wouldn't clear until some
// UNRELATED reactive change (e.g. the next tick) happened to force a re-evaluation.
const lastSeenSeasonWeek = ref(Number(localStorage.getItem(SEASON_SEEN_KEY) ?? '-1'))
const seasonHasNew = computed(() => {
  const events = game.snapshot?.events ?? []
  let latest = -1
  for (const e of events) {
    if (e.type === 'info' && e.text === 'New events on the calendar' && e.week > latest) latest = e.week
  }
  return latest >= 0 && latest > lastSeenSeasonWeek.value
})
watch(tab, (t) => {
  if (t === 'play') {
    lastSeenSeasonWeek.value = week.value
    localStorage.setItem(SEASON_SEEN_KEY, String(week.value))
  }
})

// --- R13-12: the This-week tab's accent dot – a FRESH recap is unseen -------------
// "Fresh" is the shared rule in composables/weekRecap.ts: a recap exists for the CURRENT week
// (same predicate ThisWeekScreen renders the card by) and the tab has not been visited since it
// appeared. The seen watermark is the snapshot week at the last visit, persisted per career
// (careers advance independently, so a global key would collide – the R9-21b news lesson), and
// re-read on a career switch so a plain load never invents freshness the stored watermark denies.
const weekSeenKey = () => `tb:lastSeenThisWeek:${game.snapshot?.careerId ?? ''}`
const lastSeenThisWeek = ref(Number(localStorage.getItem(weekSeenKey()) ?? '-1'))
const weekTabDot = computed(() =>
  thisWeekDotShows(recapExists(game.snapshot), week.value, lastSeenThisWeek.value),
)
function markThisWeekSeen(): void {
  if (lastSeenThisWeek.value !== week.value) {
    lastSeenThisWeek.value = week.value
    localStorage.setItem(weekSeenKey(), String(week.value))
  }
}
watch(
  () => game.snapshot?.careerId,
  () => {
    lastSeenThisWeek.value = Number(localStorage.getItem(weekSeenKey()) ?? '-1')
  },
)
watch(tab, (t) => {
  if (t === 'week') markThisWeekSeen()
})
// The global advance bar (below) can resolve a week WHILE the tab is up – the player is looking
// at the fresh recap, so it is seen the moment it lands.
watch(week, () => {
  if (tab.value === 'week') markThisWeekSeen()
})

// --- R13-12: the Kid screen lives behind her photograph ---------------------------
// A2 moved the avatar itself onto Home (App has no header any more), so the hint's state moved
// with it – HomeScreen owns both, and the shell only learns that a navigation happened.

// --- R9-21b: news cue – a soft "тилинь" + a Season-style accent dot on the Home tab -----
// News = the non-financial events HomeScreen's feed shows (expense/income live on Money).
// "Last looked at the feed" ≈ the Home tab being active: seen is marked when Home becomes
// active and whenever a snapshot lands while it is. The cue fires on any genuinely NEW news
// event (id above the last-seen watermark), whatever tab is up – the owner's complaint was
// missing news entirely while week-skipping. Watermark persisted per career (event ids are
// per-career counters, so a global key would collide across careers).
const newsSeenKey = () => `tb:lastSeenNewsId:${game.snapshot?.careerId ?? ''}`
const lastSeenNewsId = ref(Number(localStorage.getItem(newsSeenKey()) ?? '-1'))
const latestNewsId = computed(() => {
  const events = game.snapshot?.events ?? []
  let latest = -1
  for (const e of events) {
    if (e.type !== 'expense' && e.type !== 'income' && e.id > latest) latest = e.id
  }
  return latest
})
const homeHasNews = computed(() => tab.value !== 'home' && latestNewsId.value > lastSeenNewsId.value)
function markNewsSeen(): void {
  if (latestNewsId.value > lastSeenNewsId.value) {
    lastSeenNewsId.value = latestNewsId.value
    localStorage.setItem(newsSeenKey(), String(latestNewsId.value))
  }
}
watch(
  () => game.snapshot?.careerId,
  () => {
    // switching careers re-reads that career's own watermark (never dings on a plain load)
    lastSeenNewsId.value = Number(localStorage.getItem(newsSeenKey()) ?? '-1')
    if (lastSeenNewsId.value < 0) markNewsSeen()
  },
)
watch(tab, (t) => {
  if (t === 'home') markNewsSeen()
})
watch(latestNewsId, (now, before) => {
  if (before !== undefined && before >= 0 && now > before) playSfx('clickSoft') // тилинь
  if (tab.value === 'home') markNewsSeen()
})

// --- coach-mark onboarding tour (item 10) ------------------------------------
const showTour = ref(false)
function dismissTour(): void {
  showTour.value = false
  localStorage.setItem(TOUR_SEEN_KEY, '1')
}

// Package K2: a corrupted-generation recovery is rare and stays a one-time hint –
// dismissing it just patches the flag back to false (same pattern MoreScreen uses
// for the client-side "New career" reset, no store change needed).
function dismissRecovered(): void {
  game.$patch({ recovered: false })
}

// Package N: `stopReasons` lives ON the snapshot (only `advance` ever sets them –
// `tick`/enterEvent/etc. never do), not as an independent store flag, so a local
// dismiss flag is reset whenever a fresh snapshot arrives (any action) and set
// when the user dismisses the toast by hand.
const stopToastDismissed = ref(false)
// Round-7 item 4: the season-end stop is owned by SeasonSummaryDialog, not the toast. A fresh
// snapshot resets both dismiss flags (any action re-arms them).
const seasonSummaryDismissed = ref(false)
// R9-21a: the injury stop is owned by the blocking InjuryStopDialog (the quiet toast buried
// it – the owner only noticed the withdrawal three weeks later). Same dismiss lifecycle.
const injuryStopDismissed = ref(false)
watch(
  () => game.snapshot,
  () => {
    stopToastDismissed.value = false
    seasonSummaryDismissed.value = false
    injuryStopDismissed.value = false
  },
)

// R9-9a: the TournamentFlow splash's "← Back" hides the overlay WITHOUT resolving anything –
// the week stays paused on the engine side. Any change of the pending run (skipped, closed, a
// different event) re-arms the overlay. R13-8 made the sticky bar's primary button the resume
// control on Home ("Play {tier}" via useWeekAhead's pending branch, re-opened by playWeek below);
// R13-12 made that bar GLOBAL, so the button is the resume affordance on EVERY tab now and the
// old paused-tournament banner is gone entirely – off Home it only ever existed to cover for the
// bar's absence, and keeping it would re-create the duplication the owner complained about
// (R13-8) five times over. The R9-9a guarantee – no tab can strand the career – rides on the bar.
const tournamentHidden = ref(false)
watch(
  () => game.snapshot?.pending?.eventId,
  () => {
    tournamentHidden.value = false
  },
)

// R13-5 / R13-8: ONE handler behind both sticky-bar buttons, so a click always does what the
// label promises.
//  - A PAUSED tournament re-opens the overlay – never a tick past it (the engine refuses anyway:
//    advanceWeeks returns 'tournament' untouched, which used to make this click a silent no-op).
//  - A booked PRACTICE week plays THROUGH the flow (R10-12's live watch path, exactly what the
//    Season screen's "Watch it live" does): advance the week – the engine resolves the friendly
//    inside the tick as always – then open PracticeFlow on the resolved match, where the player
//    watches or skips to the result. No more one-click week that felt like a skip. If the advance
//    stopped short (a fresh injury cancels + refunds the friendly), nothing opens and the stop's
//    own dialog explains – same contract as the Season path.
const practiceLive = ref<WorldMatch | null>(null)
async function playWeek(weeks: 1 | 4): Promise<void> {
  if (game.snapshot?.pending) {
    tournamentHidden.value = false
    return
  }
  const throughPractice = weeks === 1 && weekAhead.value.kind === 'practice'
  await game.advance(weeks)
  if (throughPractice) {
    const s = game.snapshot
    const friendly = s?.events.find((e) => e.type === 'match' && e.friendly && e.week === s.week && e.match)
    if (friendly?.match) practiceLive.value = friendly.match
  }
}
// The tournament stop is owned by the full-screen TournamentFlow overlay, the season-end stop by
// SeasonSummaryDialog and the injury stop by InjuryStopDialog (all three show off the snapshot);
// deadline/funds/medical stops keep the toast.
//
// R10-16 (owner playtest 26.07 – "an EMPTY popup appeared on Home, no text at all, just a Dismiss
// button"). THE BUG: this condition excluded the stop reasons that own a dialog BY NAME, and when
// R9-21a moved 'injury' onto its own blocking dialog it was removed from STOP_REASON_TEXT but never
// added to that exclusion list. So a fresh injury satisfied the toast's condition with no copy to
// put in it, and the toast rendered as an empty bar with a lone Dismiss.
//
// THE FIX is to stop maintaining a second list at all: the toast shows iff there is something to
// say. Any future StopReason that gets its own dialog (or simply lacks copy) can no longer produce
// an empty popup – the copy map is the single source of truth for what the toast is for.
//
// 'injury' / 'tournament' / 'season-end' are absent from STOP_REASON_TEXT precisely BECAUSE they own
// a dialog, so they now fall out of the toast for free instead of needing to be listed twice.
const STOP_REASON_TEXT: Record<string, string> = {
  deadline: 'Stopped: an entry deadline is coming up next week.',
  funds: 'Stopped: funds ran below zero.',
  // A withdrawal costs her an entry AND its fee, so it must never slide past during a multi-week
  // advance – the same trap the owner hit with a silent injury withdrawal.
  medical: 'Stopped: she was not cleared to play – withdrawn on medical advice.',
  // R12-15 – THE DEAD CLICK. This beat had no copy anywhere and no stop at all: an entry whose list
  // had already closed came round while she was still laid up, the week resolved as a walkover with
  // the fee forfeited, and the only trace was one line in the news feed. The button that spent it
  // had just said "Play". Now the advance halts and says what it cost.
  walkover: 'Stopped: she was too injured to play – walkover, entry fee forfeited.',
}
// R11-1: an advance reports the SET of reasons it stopped for, already in surfacing order
// (STOP_PRECEDENCE, medical first). Every gate below asks "is my reason in the set?" instead of
// "is my reason THE reason" – which is what used to lose the injury popup whenever the same week
// also ended the season.
const stopReasons = computed<StopReason[]>(() => game.snapshot?.stopReasons ?? [])
// The toast speaks for the highest-precedence reason that HAS copy (R10-16: no copy, no toast).
const stopReasonText = computed(() => {
  for (const reason of stopReasons.value) {
    const text = STOP_REASON_TEXT[reason]
    if (text) return text
  }
  return ''
})
const showStopToast = computed(() => !!stopReasonText.value && !stopToastDismissed.value)
function dismissStopToast(): void {
  stopToastDismissed.value = true
}
// R9-21a: the injury stop popup – blocking, until Continue. The dialog itself plays the alert sfx
// on mount.
//
// R11-1 removed the `tab === 'home'` gate that used to sit here, justified by "advance only ever
// runs from Home's bar". That claim is FALSE on the current build: SeasonScreen's "Watch it live"
// on a booked practice week calls `game.advance(1)` from the Season tab (see playPracticeWeek), so
// an injury rolled on that very tick showed nothing at all. The dialog is a full-screen overlay
// with its own dismiss – there is no tab it cannot open over, and the dismiss flags are per
// snapshot, so it can never re-appear after Continue.
const showInjuryStop = computed(
  () => stopReasons.value.includes('injury') && !!game.snapshot?.injury && !injuryStopDismissed.value,
)
// The end-of-season summary popup: auto-shows when `advance` reports 'season-end' and a summary is
// present, until the player hits Continue (client-side flag). Same tab-gate removal as above.
//
// ONE overlay at a time, in a defined order: when a week is both an injury and the season's end,
// the injury is shown FIRST (it is the news that cost her entries) and the wrap-up waits for that
// Continue – it cannot be lost, because dismissing the injury re-evaluates this gate. No week can
// dead-end: every reason in the set owns either a dialog with a Continue or a dismissable toast.
const showSeasonSummary = computed(
  () =>
    stopReasons.value.includes('season-end') &&
    !!game.snapshot?.lastSeasonSummary &&
    !seasonSummaryDismissed.value &&
    !showInjuryStop.value,
)
function dismissSeasonSummary(): void {
  seasonSummaryDismissed.value = true
}
</script>

<template>
  <!-- PWA update prompt (registerType 'prompt'): fixed above everything, all app states. -->
  <div v-if="needRefresh" class="update-banner">
    <span>New version available</span>
    <button class="primary" @click="applyUpdate">Update</button>
  </div>

  <div v-if="!game.ready" class="app-loading">Loading…</div>

  <SplashScreen v-else-if="!splashDone" @done="splashDone = true" />

  <OnboardingWizard v-else-if="showOnboarding" />

  <template v-else>
    <!-- epic/redesign-home slice A2 (owner, 28.07): THE APP HEADER IS GONE. It carried three
         things and all three found better homes – the avatar and its one-time callout moved onto
         Home's photograph (left of the date, where the export puts the day), the W/$ pill's wallet
         door became the Family budget card, and her name is the 42px headline of the hero. What is
         genuinely lost is the week number and the balance on Season / Stats / More; the owner ruled
         that acceptable, and Season prints the week on every calendar row anyway. -->

    <div v-if="game.recovered" class="recovered-banner">
      <span>Autosave was damaged – restored the previous one.</span>
      <button @click="dismissRecovered">Dismiss</button>
    </div>

    <!-- R11-1: NOT gated on the Home tab any more – an advance can be triggered from the Season
         screen too (playPracticeWeek), and a stop the player never sees is a stop that did not
         happen as far as they are concerned. -->
    <div v-if="showStopToast" class="stop-toast">
      <span>{{ stopReasonText }}</span>
      <button @click="dismissStopToast">Dismiss</button>
    </div>

    <!-- R13-12: the paused-tournament banner is GONE – the sticky bar below is global now, and
         its primary button ("Play {tier}", playWeek) is the resume affordance on every tab. -->

    <main class="app-content with-next-week-bar">
      <!-- epic/redesign-home: Home's notecards are doors (the budget card opens the wallet, the
           next-tournament card opens This week). The shell owns `tab`, so the screen ASKS – one
           event, no router, no store field. `recapFresh` is the This-week dot, still decided by the
           shared rule here (this file owns the per-career seen watermark) and only RENDERED there. -->
      <HomeScreen v-if="tab === 'home'" :recap-fresh="weekTabDot" @navigate="tab = $event" />
      <SeasonScreen v-else-if="tab === 'play'" />
      <ThisWeekScreen v-else-if="tab === 'week'" />
      <KidScreen v-else-if="tab === 'kid'" />
      <StatsScreen v-else-if="tab === 'stats'" />
      <MoneyScreen v-else-if="tab === 'money'" />
      <MoreScreen v-else-if="tab === 'more'" />
    </main>

    <!-- Package N: sticky Next-week bar, fixed above the tab bar. R13-12: GLOBAL – it renders on
         every tab (advancing the week is the game's one always-available verb, and the R9-9a
         "no tab can strand the career" guarantee rides on it now). It must never move into the
         This-week tab. Both buttons go through `advance` (weeks: 1|4) so either one can stop
         early on a tournament week / imminent deadline / funds crossing zero. -->
    <div class="next-week-bar">
      <!-- R10-7: one button, a label that names the plan for the week it is about to play.
           R13-5/R13-8: both buttons route through playWeek – a paused tournament re-opens its
           overlay, a booked practice week opens the flow, everything else advances as before. -->
      <button
        class="primary next-week-btn"
        :class="`plan-${weekAhead.kind}`"
        data-tour="next-week"
        :disabled="game.busy"
        @click="playWeek(1)"
      >
        {{ weekAhead.label }}
      </button>
      <button :disabled="game.busy" @click="playWeek(4)">▶▶ 4</button>
    </div>

    <nav class="tab-bar">
      <button
        v-for="t in TABS"
        :key="t.id"
        class="tab-btn"
        :class="{ active: tab === t.id, 'tab-soon': t.soon }"
        :data-tour="`tab-${t.id}`"
        :disabled="t.soon"
        :aria-disabled="t.soon"
        @click="openNav(t)"
      >
        <span class="tab-icon" :style="{ WebkitMaskImage: `url(${iconUrl(t.icon)})`, maskImage: `url(${iconUrl(t.icon)})` }"></span>
        <span class="tab-label">{{ t.label }}</span>
        <span v-if="t.id === 'play' && seasonHasNew" class="tab-dot"></span>
        <!-- R9-21b: unread-news dot, same accent treatment as the Season tab's. -->
        <span v-else-if="t.id === 'home' && homeHasNews" class="tab-dot"></span>
        <!-- epic/redesign-home: the fresh-recap dot left this bar with the This-week tab – it is on
             Home's Next-tournament card now, which is the door to that screen. -->
      </button>
    </nav>

    <!-- Foreground tournament: a full-screen overlay shown whenever a reveal is in progress.
         R9-9a: the splash's Back hides it (nothing resolved); the global bar's primary button
         (playWeek) re-opens it from any tab (R13-12). -->
    <TournamentFlow v-if="game.snapshot?.pending && !tournamentHidden" @back="tournamentHidden = true" />

    <!-- R13-5: the booked friendly the Next-week button just played, opened as a match (the
         R10-12 flow – the same overlay the Season screen's "Watch it live" uses). -->
    <PracticeFlow
      v-if="practiceLive"
      :match="practiceLive"
      :week="week"
      :kid-rank="game.snapshot?.kidRank ?? null"
      @close="practiceLive = null"
    />

    <!-- Round-7 item 4: end-of-season summary popup at the W49→50 boundary. -->
    <SeasonSummaryDialog v-if="showSeasonSummary" @continue="dismissSeasonSummary" />

    <!-- R9-21a: a fresh injury stops the advance with a BLOCKING popup (kind, layoff, what was
         auto-withdrawn + refunds) and an alert sfx – no more quiet missable toast. -->
    <InjuryStopDialog v-if="showInjuryStop" @continue="injuryStopDismissed = true" />

    <!-- Round 5 item 10: one-shot coach-mark tour after the very first career ever. -->
    <OnboardingTour v-if="showTour" @done="dismissTour" />
  </template>
</template>

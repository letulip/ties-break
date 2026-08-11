<script setup lang="ts">
// Package I – app shell: slim header + 5-tab bottom bar, or the full-screen
// onboarding wizard when there is no active career. No router – a plain ref
// switch, per spec.
import { computed, onMounted, ref, watch } from 'vue'
import { activeLadderOfSnapshot } from './shared/protocol'
import type { StopReason, WorldMatch } from './shared/protocol'
import { useGameStore } from './stores/game'
import { needRefresh, applyUpdate } from './pwa'
// R10-7: the sticky bar's primary button says what the week AHEAD holds (tournament / vacation /
// practice / exams / off-season / training). All of the derivation lives in the composable – this
// file only renders the label it hands back.
//
// ⚠ THE CALENDAR SLICE PUT ONE MORE COMPOSABLE IN FRONT OF IT (`useWeekAction`, which reads
// `useWeekAhead` and nothing else). The Calendar screen has the same main button, and the whole
// hazard of a second week control is that the two answer "what does this press do" separately - the
// arrival-gate bug, one surface further out. So the label, the mode the handler below switches on and
// the blocked state are ONE computed with two readers. See composables/weekAction.ts.
import { useWeekAction } from './composables/weekAction'
// ⚠ RE-AIMED, NOT RETIRED: `calendarOwnsWeekAhead` used to decide where a week LANDED and now decides
// which weeks the calendar PLAYS. That is closer to the owner's original sentence than the landing
// rule ever was - the Calendar tab is «активной при нетурнирных неделях», and a tab that runs the
// week's animation is active in a way a destination is not.
import { calendarOwnsWeekAhead } from './composables/weekAhead'
// The sweep's own preference gate, read here for one reason: the detour to the calendar exists to
// SHOW the animation, so with the animation off there is no detour and the press behaves as it did.
import { dayCrossRuns } from './composables/dayCross'
// R13-12: the This-week tab's accent dot reads the SAME recap-existence rule the tab's screen
// renders the card by – one predicate, two consumers, zero drift.
import { consumePostAdvanceNav, recapExists, storyOpensItself, thisWeekDotShows } from './composables/weekRecap'
// R9-21b's news watermark, and the inbox cue that rides beside it (04.08). Both live in
// composables/inboxCue.ts so Home's bell reads the same rule this bar does - see the module header.
import { useLetterWatermark, useNewsWatermark } from './composables/inboxCue'
// The Trophies tab's dot and the trophy that flies there to leave it. Same shape as the line above:
// the PREDICATE is a pure function in the composable and this file only wires it to a watermark, so
// "when does the dot show" is one testable sentence rather than a computed buried in a shell.
import { trophyDotShows, trophyPieces, useTrophyFlight } from './composables/trophyArrival'
import { useScrollReset } from './composables/scrollReset'
import { playSfx, primeSfx } from './audio/sfx'
import SplashScreen from './components/SplashScreen.vue'
import OnboardingWizard from './components/OnboardingWizard.vue'
import OnboardingTour from './components/OnboardingTour.vue'
import TournamentFlow from './components/TournamentFlow.vue'
import PracticeFlow from './components/PracticeFlow.vue'
import SeasonSummaryDialog from './components/SeasonSummaryDialog.vue'
import InjuryStopDialog from './components/InjuryStopDialog.vue'
import KnockDialog from './components/KnockDialog.vue'
import EndingScreen from './components/EndingScreen.vue'
import ForkDialog from './components/ForkDialog.vue'
import RetirementDialog from './components/RetirementDialog.vue'
import HomeScreen from './components/screens/HomeScreen.vue'
import SeasonScreen from './components/screens/SeasonScreen.vue'
import CalendarScreen from './components/screens/CalendarScreen.vue'
import ThisWeekScreen from './components/screens/ThisWeekScreen.vue'
import KidScreen from './components/screens/KidScreen.vue'
import CoachMarketScreen from './components/screens/CoachMarketScreen.vue'
import StatsScreen from './components/screens/StatsScreen.vue'
import MoneyScreen from './components/screens/MoneyScreen.vue'
import MoreScreen from './components/screens/MoreScreen.vue'
import TrophiesScreen from './components/screens/TrophiesScreen.vue'

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
const weekAction = useWeekAction()

onMounted(() => game.init())

// Round-6 item 2: the splash screen shows on EVERY launch, once init() has settled
// (game.ready) – before either the onboarding wizard or the tab shell. Plain per-mount
// ref, not persisted: "every launch" means every page load, not "once ever".
const splashDone = ref(false)

// STORAGE RECOVERY (W1-INTEGRITY-B, TB-06). init() is a total transition now – `loading -> ready |
// recovery` – and this is recovery's screen: the one place a denied/broken IndexedDB stops being an
// endless "Loading…" and becomes a decision. Three doors, all existing flows merely SURFACED here:
//   * Retry re-runs init() – it can actually succeed without a reload because db/saves.ts no
//     longer caches a rejected open;
//   * Import a save routes through game.importSave – if the write lands, storage is back and the
//     store flips itself to ready; if not, the failure is rendered right here instead of vanishing;
//   * Start new career walks into the ordinary onboarding wizard after an explicit tap – nothing
//     is deleted, and the wizard's own error line reports any save failures that follow.
const recoveryFileInput = ref<HTMLInputElement | null>(null)
function onRecoveryImportPicked(e: Event): void {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) game.importSave(file)
  if (recoveryFileInput.value) recoveryFileInput.value.value = ''
}

// 'money' and 'kid' stay valid CONTENT states without a bottom-tab button. Both are reached from
// Home now (A2, 28.07): the wallet from the Family budget card, her profile from her photograph.
// Round-6 dropped Money's tab for Stats; R13-12 dropped the Kid tab for the avatar.
// ⚠ 'calendar' JOINED THE UNION IN THE CALENDAR SLICE, and it is the one entry here that arrived by
// being BUILT rather than by moving: the bar has carried a dimmed Calendar placeholder since the
// redesign wave, reserving the centre seat for Home, and screen H now fills it.
// ⚠ 'more' JOINED THE TABLESS LIST IN THE TROPHY SLICE – it kept its screen and lost its button. It
// is the FOURTH member of this group and the only one to arrive by being replaced rather than by
// being reached from somewhere better; the gear that already reached it is now its only door. See
// the TABS note below for the owner's ruling. 'trophies' is the button that took the seat.
type TabId = 'home' | 'play' | 'calendar' | 'week' | 'kid' | 'stats' | 'money' | 'more' | 'market' | 'trophies'
const tab = ref<TabId>('home')

// A SCREEN OPENS AT ITS TOP (owner, 31.07: «after a transition between screens, always land at the
// top of the new screen - today a screen can open already scrolled»).
//
// Every screen below is `v-if`'d and therefore mounts fresh, which is exactly why this was missed:
// the screen is new, the SCROLLER is not. `main.app-content` sets no `overflow`, so the document is
// the scrollport for all eight content states and it keeps `window.scrollY` across the swap. Scroll
// to the bottom of Home's news feed, tap Stats, and Stats opens two thirds of the way down.
//
// ⚠ ON `tab` AND NOTHING ELSE, deliberately. `tab` is this app's whole navigation - the bar writes
// it, Home's notecards write it, the market's back button writes it, and the week's story writes it
// when a tick resolves - so one watcher covers every route in the game, including the ones that are
// not bar taps. A router's `scrollBehavior` is what this would have been; there is no router (a
// plain ref switch, per spec), so it is one line here. The takeovers scroll inside `.tf-body`
// instead and are handled by the shell that owns it.
useScrollReset(tab)

// ⚠ WHERE "BACK" GOES FROM THE COACH MARKET, and it used to be a lie. The screen is reachable from TWO
// places - the Home coaching note and the Kid profile's coach row - and its back button was wired
// `@back="tab = 'kid'"`, so a player who opened it from Home was returned to a screen he had not come
// from. The owner found it: «при нажатии на нее я всегда попадаю на профиль героини, а не на главный
// экран».
//
// The market is the only screen in the app that is not a TAB - it has no bar entry and is entered FROM
// somewhere - so it is the only one that needs this, and one ref is the honest size of the fix. A general
// nav history would be machinery for a single case, and would then have to answer what "back" means from a
// tab you reached by tapping the bar (nothing: the bar IS the history).
const marketFrom = ref<TabId>('kid')
function openMarket(from: TabId): void {
  marketFrom.value = from
  tab.value = 'market'
}

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
//  1. ⚠ CALENDAR IS LIVE AS OF THE CALENDAR SLICE, AND THIS NOTE IS THE HISTORY, because the shape of
//     the bar was argued from the placeholder and the argument outlived it. For two waves the slot
//     rendered a glyph and a word at a third of the weight, `disabled`, with no press state and no
//     dot: the alternative – four live tabs – puts Home in seat two of four, which is not the design,
//     and an empty gap in the bar reads as a rendering bug, while a dimmed tab reads as "next". The
//     reservation did its job; screen H (`CalendarScreen.vue`) is now in the seat, so the `soon` flag,
//     its `disabled`/`aria-disabled` bindings, its `.tab-btn.tab-soon` rule and the guard in
//     `openNav` are all GONE rather than left behind as machinery nothing can render. Its glyph is
//     still week.svg, the dot-grid calendar; the Season tab keeps season.svg (the dated page), so the
//     two are never the same picture.
//
//     ⚠ AND THE TAB IS LIVE ON EVERY WEEK, not only on the non-tournament ones the owner named. A tab
//     that greys out on a third of the weeks is exactly the "reads as broken" the paragraph above was
//     written to avoid, and the bar's five entries in this order are pinned as his. The SCREEN honours
//     the sentence instead: on a tournament week it says she is away, its day marks stop pretending
//     she is training, and its animation stands down for the flow that owns that week.
//
//  2. "THIS WEEK" LEFT THE BAR, NOT THE APP. It joins 'money' and 'kid' as a tabless CONTENT state –
//     the established idiom here – and its door is Home's NEXT TOURNAMENT card, which is exactly
//     what that screen is about (what she is entered for, what we plan for it, how the last one
//     went). The fresh-recap dot moved onto that card with it, so nothing that used to be reachable
//     or noticeable stopped being either.
//
// ⚠ THE TROPHY SLICE (31.07): "MORE" LEFT THE BAR AND TROPHIES TOOK ITS SEAT. Fifth of five, not
// sixth of six, and the count is the load-bearing part: Home's centring is EMERGENT from "five
// slots, Home third" – there is no rule that centres it – so a sixth entry moves Home off the middle
// and breaks the owner's own order. tests/round13-nav.test.ts pins exactly that with
// `ids[floor(len / 2)] === 'home'`.
//
// SO SOMETHING HAD TO GO, AND MORE IS THE ONE THE OWNER ALREADY NAMED. docs/specs/ui-inventory.md
// §4 Q1, written 29.07 and his: «More is becoming redundant — the gear on Home already reaches it —
// so the bar gets re-cut in that pass rather than now.» This is that pass.
//
// ⚠ AND NOTHING INSIDE MORE MOVES OR NEEDS REHOMING. Asked directly on 31.07 he was explicit: «она
// уже живет в шестеренке настроек на домашнем экране». `MoreScreen` keeps every row it has –
// careers, saves, sound, haptics, the danger zone, About – and becomes the FOURTH tabless content
// state ('money', 'kid', 'week', 'more'), reached by the gear on Home (HomeScreen's `.diary-tool`)
// and by the gear on the Kid screen. Both of those doors predate this change and neither moved; the
// screen simply stopped having two ways in, one of which cost a fifth of the bottom bar.
const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'play', icon: 'season', label: 'Season' },
  { id: 'calendar', icon: 'week', label: 'Calendar' },
  { id: 'home', icon: 'home', label: 'Home' },
  { id: 'stats', icon: 'stats', label: 'Stats' },
  { id: 'trophies', icon: 'trophy', label: 'Trophies' },
]
/** The one writer of `tab` from the bar. Every entry now routes to a screen that exists, which is
 *  what the deleted `soon` guard was standing in for. */
function openNav(entry: (typeof TABS)[number]): void {
  tab.value = entry.id
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

// --- W1: THE WEEK'S STORY OPENS ITSELF -----------------------------------------------------------
//
// The owner, after a full season: «Экран конца недели не показывается вообще ни разу его не увидел».
//
// IT WAS NEVER THE GATE. A 52-week live trace (seed `week-trace-1`) says the story EXISTS on 30 of
// the 52 weeks, `recapExists` answers true on every one of them, the card renders, and `weekTabDot`
// fires. What is broken is the DOOR. The story is Screen D and it is the This-week screen; the
// redesign wave then took This-week out of the bottom bar (see the TABS comment above) and left its
// only entrance inside Home's NEXT TOURNAMENT card – a card whose kicker, title, dates and travel
// figure are all about the tournament ahead, with the story's presence signalled by an unlabelled
// 7px dot whose only explanation is a `title` tooltip. There is no hover on a phone. A player has no
// reason to press "next tournament" to read what happened LAST week, and he never did.
//
// So the fix is not a wider predicate, it is the beat the design asked for in the first place. The
// handoff's own flow line, verbatim (docs/design/README.md §Interactions, "Переходы"):
//
//     «Конец недели (игровой тик) → D. Weekly Story как модалка; × возвращает на Home.»
//
// End of the week → the Weekly Story; the × returns to Home. That is exactly the × ThisWeekScreen
// already draws in its header and which, until now, closed a story nobody had been shown.
//
// WHY A ROUTE AND NOT AN OVERLAY. The handoff draws D as a modal and ours is a tab, and the owner
// settled that split (ui-inventory §4 Q1 – every screen keeps the navigation it has), so this does
// not turn the screen into an overlay: it NAVIGATES to it, which honours both the flow line and Q1,
// keeps ONE renderer of the card, and adds no component. It also lands the player somewhere useful:
// the story sits directly above that screen's training-plan presets and planned spend, so the week
// that just ended and the decision for the next one are on one page.
//
// WATCHING THE SNAPSHOT RATHER THAN `playWeek`: the sticky bar is not the only thing that advances a
// week (SeasonScreen's "Watch it live" calls `game.advance(1)` too – the same hole R11-1 had to patch
// for the injury dialog), and a story the player only gets on one of two paths is the bug again.
//
// ⚠ AND IT HAS TO BE AN ADVANCE, not just a higher number, which a plain `watch(week)` cannot tell.
// `week` is `snapshot?.week ?? 0`, so the first snapshot of a LOAD reads as 0 → 52 and opened last
// week's story every time the app started – caught in the browser, on the very first pass. So the
// pair (career, week) is tracked explicitly: the story opens when THE SAME career moves FORWARD,
// which is a tick and nothing else. A load, a career switch and a fresh career all fail that test.
//
// --- W4: ...AND A TOURNAMENT WEEK'S STORY OPENS WHEN THE DRIVE HOME STARTS ------------------------
//
// The owner, 30.07: «Я предлагаю ставить week recap сразу после турнира, как будто домой едем» – and,
// separately, «после турнира не появился week recap». Both are one bug and W1's own trigger is half
// of it: an advance that reaches a tournament comes back with `pending` set, `recapExists` is false
// on that snapshot (the flow owns the week), and by the time the flow is finished there is no ADVANCE
// left to fire on. The week's story therefore arrived a week late, riding the NEXT tick – or never,
// if he took the tournament and then closed the app.
//
// So there is a SECOND door, at the other end of the same week: the tournament run CLOSING.
// `snap.pending` is set the moment the tick reaches the event, survives the finale (`finished: true`)
// and is cleared by `closeTournament` – the finale's own Continue, or the post-deadline withdrawal.
// The transition set → null is exactly "the flow has let go of this week", and it is the beat he
// described: the finale fades, the story opens, she is asleep in the car on the painting.
//
// ⚠ TRACKED, NOT WATCHED AS A TRANSITION SHORTHAND, for the same reason `week` is: a plain
// `watch(() => snap.pending)` fires `undefined → null` on the first snapshot of a load and would open
// last week's story on every app start, which is precisely the bug W1 was caught by in the browser.
// `seenPendingId` starts at null and is only ever set from a snapshot of the SAME career, so a load,
// a career switch and a fresh career all fail the test.
//
// ⚠ AND NO TWO TAKEOVERS COLLIDE. The flow is `v-if="game.snapshot?.pending && !tournamentHidden"`,
// so it has already unmounted on the snapshot that clears `pending` – the tab under it is free. The
// old way of keeping them apart (deleting the week's story outright – see composables/weekRecap.ts)
// is what this replaces.
let seenCareerId: string | null = null
let seenWeek = -1
let seenPendingId: string | null = null
watch(
  () => game.snapshot,
  (snap) => {
    if (!snap) {
      seenCareerId = null
      seenWeek = -1
      seenPendingId = null
      return
    }
    const sameCareer = snap.careerId === seenCareerId
    const advanced = sameCareer && snap.week > seenWeek
    // The run the flow was holding has been let go: revealed to the end and closed, or withdrawn.
    const runClosed = sameCareer && seenPendingId !== null && !snap.pending
    seenCareerId = snap.careerId
    seenWeek = snap.week
    seenPendingId = snap.pending?.eventId ?? null
    // The advance can resolve a week WHILE the tab is up – the player is looking at the fresh
    // recap, so it is seen the moment it lands.
    if (tab.value === 'week') markThisWeekSeen()
    // A paused reveal has not finished being a week yet; that falls out of the predicate rather than
    // being listed here, and is the reason `runClosed` needs a door of its own.
    //
    // ⚠ W5 PUT THE SWITCH HERE AND NOWHERE ELSE (owner: «можем сделать отдельную ручку для их
    // отключения в настройках» / «а если это будет отключаемая опция - вообще нет проблем, спидраннеры
    // ликуют»). `storyOpensItself` is `recapExists` AND the player's preference, and the composition is
    // the point: the story still EXISTS on every week with the switch off – the This-week tab still
    // renders it, the accent dot still fires, Home still has its door – and the only thing that stops
    // is this navigation. See composables/weekRecap.ts for why the preference may not be folded into
    // `recapExists` itself, and why it is a localStorage flag rather than a save field.
    // ⚠ A SCREEN THAT OPENED ITS OWN TAKEOVER ON THIS ADVANCE OWNS THE BEAT (owner, 01.08: «Фикс
    // Play it and watch обязателен - он должен вести на пре-матч экран»). "Play it and watch →"
    // advances the week and opens PracticeFlow at its pre-match card - and this watcher then
    // switched the tab out from under it, so the flow unmounted with its screen and the player
    // landed on the recap instead, every time. The hold is one-shot and claimed right before the
    // advance (see weekRecap.ts); it must silence BOTH branches below, because either one unmounts
    // the claimant. The story is untouched - it exists, the dot marks it fresh, it is one tap away.
    const navHeld = (advanced || runClosed) && consumePostAdvanceNav()
    if (navHeld) {
      // stay where the claimant is - it is already showing the result of the week
    } else if ((advanced || runClosed) && storyOpensItself(snap)) tab.value = 'week'
    // ⚠ ...AND OTHERWISE A RESOLVED WEEK GOES HOME. THIS WAS `afterWeekTab()` AND IT WAS BACKWARDS.
    //
    // The calendar used to be where a week ENDED: `afterWeekTab()` sent every non-tournament week to the
    // Calendar tab, on the strength of the owner's «активной при нетурнирных неделях». Wrong reading, and
    // he described the flow he wanted in full on 31.07:
    //
    //   «жмем training week – видим календарь и короткую анимацию как неделя проходит – если есть
    //    тренировочный матч, когда доходим до него анимация прекращается и переходим в окно матча – после
    //    матча либо заканчиваем неделю в training week, либо видим week recap и Proceed to Home, который
    //    ведет Домой»
    //
    // THE CALENDAR IS THE DURING. HOME IS THE AFTER. Landing there at the end cost two things at once: a
    // button that says «Proceed to Home» did not go home, and - measured in the browser - the player was
    // left staring at a grid that had just re-rendered to the NEXT week. He watched W5's days cross
    // themselves out, and the screen he was handed back said W6. That is his other report of the same
    // beat: «на текущей неделе мы видим расписание текущей недели, а не будущей».
    //
    // ⚠ THE OFF-BY-ONE IS NOT IN THE ARITHMETIC, and that was measured before it was changed: through the
    // whole sweep the header, the column dates and the blocks stay on the week being played (W5, Feb 2-8,
    // strokes 0 -> 4 -> 7). `tickWeek` increments `world.week` first, but the advance only fires when the
    // sweep FINISHES, so nothing moves under the animation. The week the calendar names jumps forward
    // exactly once - when the finished week hands the screen back to it. So the fix is this line, not
    // `week + 1`, and the calendar keeps naming the week its button plays.
    else if (advanced || runClosed) tab.value = 'home'
  },
)

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
// ⚠ THE WATERMARK MOVED INTO composables/inboxCue.ts, WHERE HOME'S BELL CAN READ THE SAME RULE. The
// derivation that used to sit inline here (walk the feed, take the highest non-financial id, compare
// against a per-career localStorage number) is unchanged - it is `useNewsWatermark`, and the storage
// key it is given is the one this block has always used, so an existing device keeps its place. What
// changed is that the bell on Home now gets a watermark of its own from the same module instead of
// re-deriving "is there news" a third way and getting it wrong (item 5, 04.08).
const { latestId: latestNewsId, unseen: newsUnseenOffHome, markSeen: markNewsSeen } =
  useNewsWatermark('tb:lastSeenNewsId')

// --- THE INBOX CUE (owner, 04.08: «Добавить отключаемый, но очень аккуратный и консервативный дзынь
// на входящее письмо и точечку возле иконки home») ------------------------------------------------
//
// ⚠ A LETTER IS NOT A NEWS EVENT, which is why it needs its own watch even though the feed already
// has one. A sponsor's letter does write a feed line beside itself; the TOURNAMENT DESK's receipts
// (engine/offers.ts `raiseEntryLetter`) write none at all, so under the news rule alone half the
// post arrives in silence. `newestLetterId` is the arrival, and the module's header argues why it is
// the last id rather than a count or `offerOpen`.
//
// ⚠ MUTEABLE BY CONSTRUCTION, NOT BY A NEW SWITCH: `playSfx` returns at once while `muted`, and
// `muted` is the persisted `tb-muted` flag behind More's "Sound effects" row (src/audio/sfx.ts). So
// the owner's «отключаемый» is the switch he already has, it survives a reload, and no second player
// or second preference was invented for this.
const { unseen: letterUnseen, markSeen: markLettersSeen, newestId: newestLetterId } =
  useLetterWatermark('tb:lastSeenLetter')
// ⚠ WARMED UP FRONT, FOR THE REASON `primeSfx` EXISTS AT ALL (R10-6). The mail cue is the second
// sound in the app that NEVER plays during the flow it belongs to - like `applauseFinal`, it is
// always cold at the exact moment it has to land, and it pays a HEAD probe plus a fetch/decode
// before `play()` makes a noise. That cold start is what "the applause comes a beat late" was.
// Fire-and-forget, needs no gesture, free on repeat, and skipped entirely while muted.
primeSfx('mail')

// ONE DOT ON THE HOME TAB, TWO FACTS BEHIND IT - «точечку возле иконки home». It is deliberately the
// same dot the news already raised rather than a second marker beside it: both sentences are "there
// is something on Home you have not seen", the tab has room for one answer, and a bar with two dots
// on one icon says nothing that one dot does not.
const homeHasNews = computed(() => tab.value !== 'home' && (newsUnseenOffHome.value || letterUnseen.value))
function markHomeSeen(): void {
  markNewsSeen()
  markLettersSeen()
}
watch(tab, (t) => {
  if (t === 'home') markHomeSeen()
})
// ⚠ ONE WATCHER FOR BOTH ARRIVALS, SO THE CHIME NEVER DOUBLES. A sponsor letter lands as a letter AND
// as a feed line in the same tick; two independent watchers would have rung twice for it.
watch([latestNewsId, newestLetterId], ([nowNews, nowLetter], [beforeNews, beforeLetter]) => {
  const newsArrived = beforeNews !== undefined && beforeNews >= 0 && nowNews > beforeNews
  // A letter is new when the newest id CHANGES to a real one - `beforeLetter === undefined` is the
  // very first evaluation and `null` is an empty inbox becoming non-empty on a career load, and
  // neither of those is post arriving while the player watched.
  const letterArrived =
    beforeLetter !== undefined && beforeLetter !== null && nowLetter !== null && nowLetter !== beforeLetter
  // ⚠ THE POST HAS ITS OWN CUE NOW (owner, 05.08: «Письма приходят, но ни маркера, ни извещений
  // нет» - and he shipped public/music/email-notification.mp3 with the report). The note that stood
  // here said the placeholder was `clickSoft` only because "there is no dedicated chime file in
  // public/sounds/ and one is worth recording"; there is one, so the letter gets it and the news
  // keeps the tick it has always had.
  //
  // ⚠ STILL ONE PLAY, NEVER TWO. A sponsor's letter lands as a letter AND as a feed line in the same
  // tick, so the two arms share this single call and the LETTER wins the tie - it is the more
  // specific event, and it is the one the owner said he was missing.
  if (letterArrived) playSfx('mail')
  else if (newsArrived) playSfx('clickSoft') // тилинь
  if (tab.value === 'home') markHomeSeen()
})

// --- THE TROPHIES TAB'S DOT (31.07, the podium slice) --------------------------------------------
//
// ⚠ IT ASSERTS A FACT, NOT AN "UNREAD". Home's bell states the house rule in its own words – "the
// bell's dot asserts one FACT and not the 'unread' it cannot know" – and this dot's fact is:
//
//     THE CABINET HOLDS A PIECE OF SILVERWARE THAT ARRIVED AFTER THE LAST TIME IT WAS OPENED.
//
// `trophiesByTier` only ever grows, so the count of pieces in it is monotonic and the watermark is
// that count at the player's last visit. `pieces > seen` is then arithmetic on two integers, and it
// stops being true the instant the cabinet is opened – which is why the dot goes out then, rather
// than because we have decided anybody has "seen" anything. The long argument is in the composable.
//
// The watermark is per career, in localStorage, like the news and This-week ones: careers advance
// independently, so a global key would collide (the R9-21b lesson).
const trophySeenKey = () => `tb:lastSeenTrophies:${game.snapshot?.careerId ?? ''}`
const trophyPieceCount = computed(() => trophyPieces(game.snapshot))
/** ⚠ A MISSING WATERMARK IS THE CURRENT COUNT, NEVER ZERO. A career with trophies and no stored
 *  watermark – a save from before this shipped, another device – is a case where the app does not
 *  KNOW whether the cabinet was ever opened, and a dot must not claim a fact it cannot hold. Reading
 *  the present count asserts nothing and lets the next trophy be the first one it speaks about. Same
 *  discipline as `if (lastSeenNewsId.value < 0) markNewsSeen()` above. */
function storedTrophyWatermark(): number {
  const stored = localStorage.getItem(trophySeenKey())
  return stored === null ? trophyPieceCount.value : Number(stored)
}
const seenTrophyPieces = ref(storedTrophyWatermark())
// The flight is armed by the finale (`TournamentFlow`'s Continue) and rendered below; while it is in
// the air the dot is held, so it lands WITH the trophy instead of already being there when it
// arrives. Nothing is withheld from anybody by that: the ledger gained this trophy several taps ago,
// behind a full-screen takeover that covers the bar.
const { flight: trophyFlight } = useTrophyFlight()
const trophyTabDot = computed(() =>
  trophyDotShows(trophyPieceCount.value, seenTrophyPieces.value, trophyFlight.value !== null),
)

// =================================================================================================
// D7 – THE BAR'S DOTS, AS WORDS (a11y, docs/specs/e2e-coverage.md §12)
// =================================================================================================
// Three tabs can carry a dot and all three drew it as `<span class="tab-dot"></span>` – an element
// with no role, no text and no label. Nothing could reach it: not a test, not a screen reader, not
// the player who cannot see a 6px circle. The three facts were already distinct in the script (the
// season has something new, the news feed or the letterbox has something unread, the cabinet has
// something that arrived since it was last opened), so they get three distinct sentences rather than
// one word for all three.
//
// ⚠ AND THE TAB'S OWN NAME MUST NOT MOVE WHEN A DOT ARRIVES. A named descendant is folded into a
// button's name, so labelling the dot alone would rename the Home tab to "Home Unread news" every
// time the feed gained a line – the same defect the coach market's sort control was just fixed for,
// one screen over. So the button carries an explicit `aria-label` (identical to the visible word, so
// nothing disagrees) which pins the name, and the dot is handed over as the DESCRIPTION, which is
// where a changing fact belongs. `getByRole('button', { name: 'Home', exact: true })` keeps working
// in every state, which is what four e2e specs already assume.
const TAB_DOT_LABEL: Partial<Record<TabId, string>> = {
  play: 'New on the season calendar',
  home: 'Unread news',
  trophies: 'A new trophy in the cabinet',
}
function tabDot(id: TabId): boolean {
  if (id === 'play') return seasonHasNew.value
  if (id === 'home') return homeHasNews.value
  if (id === 'trophies') return trophyTabDot.value
  return false
}
/** Where the flying trophy is, how big, and how far it still has to go – handed to the element as
 *  custom properties, the ConfettiBurst idiom: one keyframe, and everything that varies is a number
 *  set per element. */
const trophyFlightStyle = computed<Record<string, string> | undefined>(() => {
  const f = trophyFlight.value
  if (!f) return undefined
  return {
    left: `${f.left}px`,
    top: `${f.top}px`,
    width: `${f.size}px`,
    height: `${f.size}px`,
    '--trophy-dx': `${f.dx}px`,
    '--trophy-dy': `${f.dy}px`,
    '--trophy-scale': String(f.scale),
  }
})
function markTrophiesSeen(): void {
  seenTrophyPieces.value = trophyPieceCount.value
  localStorage.setItem(trophySeenKey(), String(trophyPieceCount.value))
}
watch(
  () => game.snapshot?.careerId,
  () => {
    // switching careers re-reads THAT career's own watermark, and writes one for a career that has
    // never had one – so a plain load never invents a trophy the player has not been shown.
    seenTrophyPieces.value = storedTrophyWatermark()
    if (localStorage.getItem(trophySeenKey()) === null) markTrophiesSeen()
  },
)
watch(tab, (t) => {
  if (t === 'trophies') markTrophiesSeen()
})
// A trophy landing while the cabinet is ALREADY the open screen is seen the moment it lands – the
// same clause the news watermark carries for the Home tab, and the reason neither dot can appear on
// the screen that would clear it.
watch(trophyPieceCount, () => {
  if (tab.value === 'trophies') markTrophiesSeen()
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
// it – the owner only noticed the withdrawal three weeks later).
//
// ⚠ ROUND-16 #19 – IT IS ACKNOWLEDGED BY IDENTITY NOW, NOT RESET PER SNAPSHOT, and that is the other
// half of moving the gate off the stop reason (see `showInjuryStop`). A per-snapshot dismiss flag
// only works for a gate that is ALSO per advance: `stopReasons` dies with the advance that produced
// it, so "reset the flag, the reason is gone anyway" was self-consistent. A STATE gate outlives the
// advance, so the flag has to name WHICH injury was reported – otherwise setting the plan or
// entering an event on the onset week would raise the same popup again, forever.
//
// The identity is `sinceWeek:kind`, which is exactly what makes two injuries two events, and it is
// stored per career in localStorage like the news / This-week / trophy watermarks (careers advance
// independently, so a global key would collide – the R9-21b lesson). Persisting it is what stops a
// reload on the onset week from re-raising a report the player has already read.
//
// ⚠ AND AN UNKNOWN INJURY IS AN UNREPORTED ONE – the opposite default to `storedTrophyWatermark`,
// on purpose. A dot that cannot know whether the cabinet was opened must not claim it was; a popup
// that cannot know whether she was told she is hurt must ASSUME SHE WAS NOT. #19's whole complaint
// is a report that never arrived, and the failure modes are not symmetric: showing it twice costs a
// tap, never showing it costs the player three injuries she found out about from a plaque.
const injurySeenKey = () => `tb:injuryReported:${game.snapshot?.careerId ?? ''}`
const injuryIdentity = computed(() => {
  const inj = game.snapshot?.injury
  return inj ? `${inj.sinceWeek}:${inj.kind}` : null
})
const injuryReported = ref<string | null>(localStorage.getItem(injurySeenKey()))
function dismissInjuryStop(): void {
  injuryReported.value = injuryIdentity.value
  if (injuryIdentity.value !== null) localStorage.setItem(injurySeenKey(), injuryIdentity.value)
}
watch(
  () => game.snapshot?.careerId,
  () => {
    injuryReported.value = localStorage.getItem(injurySeenKey())
  },
)
watch(
  () => game.snapshot,
  () => {
    stopToastDismissed.value = false
    seasonSummaryDismissed.value = false
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
//
// ⚠ THE MODE IS ASKED, NOT RE-DERIVED (the calendar slice). This handler used to read
// `weekAhead.value.kind === 'practice'` itself, which was fine while it was the app's only week
// control. It is not any more: the Calendar screen's CTA hands its press straight to this function,
// so "which of the three things does a press do" has to be ONE answer that both buttons can also
// LABEL themselves from. `weekAction.mode` is that answer.
const practiceLive = ref<WorldMatch | null>(null)
// HER rank, on the ladder the engine says she is competing in – a friendly is on neither table, so
// "her rank" is the only question the card can be asking. This used to pass `snapshot.kidRank`, the
// ITF alias, which is a number even when she is unranked internationally. See `activeLadderOfSnapshot`.
const activeRank = computed(() => activeLadderOfSnapshot(game.snapshot).rank)
/** The calendar has been asked to PLAY the week, not merely shown. Consumed once, by the screen, the
 *  moment it mounts – see the detour in `playWeek` and `@auto-played` on the component. */
const calendarPlays = ref(false)

async function playWeek(weeks: 1 | 4): Promise<void> {
  if (game.snapshot?.pending) {
    tournamentHidden.value = false
    return
  }
  // ⚠ THE PRESS GOES TO THE CALENDAR FIRST, AND THE WEEK PASSES THERE. «Жмем training week – видим
  // календарь и короткую анимацию как неделя проходит» (31.07). On a week with no tournament in it
  // the crossing-out sweep is what STANDS IN for a trip: it is the only thing that happens between
  // pressing and reading the result, and pressing from Home used to skip straight past it. So Home's
  // press is a detour rather than an advance - the calendar runs its sweep and hands the press back
  // through `@advance`, which arrives here with `tab === 'calendar'` and spends the week for real.
  //
  // THREE GUARDS, and each excludes a week this beat is not about:
  //   * `weeks === 1`   a four-week skip is not a week anybody watches pass.
  //   * `calendarOwnsWeekAhead`  a tournament week (and a walkover) belongs to the trip's own flow,
  //     which is a full-screen overlay - the sweep would be an animation in front of it.
  //   * `dayCrossRuns`  with the animation switched off or reduced motion set there is nothing to
  //     detour FOR, and a tab that flicks past on the way to the same result is worse than none.
  //     It is asked with `true` because the two weeks whose `animates` is false are already excluded
  //     above: a paused reveal returns at the top of this function, and a trip fails the predicate.
  if (weeks === 1 && tab.value !== 'calendar' && calendarOwnsWeekAhead(weekAction.value.kind) && dayCrossRuns(true)) {
    tab.value = 'calendar'
    calendarPlays.value = true
    return
  }
  const throughPractice = weeks === 1 && weekAction.value.mode === 'practice'
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
    // W2-ENDINGS: the 'funds' toast carries the COUNTDOWN while she is under water. That toast used
    // to say "funds ran below zero" and then say it again, week after week, with nothing behind it -
    // which is precisely the "unending nothing" the review flagged. Now it is the warning phase
    // bankruptcy is required to have (adult spec B4): the number on it is the same one the Money
    // screen's strip shows, off the same `snapshot.debt`, so the two can never disagree.
    if (reason === 'funds' && game.snapshot?.debt) {
      const d = game.snapshot.debt
      const left = Math.max(0, d.graceWeeks - d.weeks)
      return left === 0
        ? 'Stopped: below zero, and out of time.'
        : `Stopped: ${d.weeks} ${d.weeks === 1 ? 'week' : 'weeks'} below zero – ${left} before the money runs out for good.`
    }
    const text = STOP_REASON_TEXT[reason]
    if (text) return text
  }
  return ''
})
const showStopToast = computed(() => !!stopReasonText.value && !stopToastDismissed.value)
function dismissStopToast(): void {
  stopToastDismissed.value = true
}
// W4 – THE KNOCK. Gated on the SNAPSHOT FIELD, not on a stop reason, and that difference is the
// whole reason it cannot be lost.
//
// Every other popup here reads `stopReasons`, which only an `advance` ever sets – fine for the eight
// beats that REPORT something, because a beat that has already happened can wait for the next advance
// to be re-reported. A knock is a QUESTION, and `advanceWeeks` refuses to tick a single week until it
// is answered. If this gate read the stop reason, then any action that produces a fresh snapshot
// without stop reasons (setting the plan, entering an event, hiring a coach, a reload) would clear the
// dialog and leave the career frozen with nothing on screen explaining why. So it reads
// `knockPrompt`, which the engine sets from `pendingKnock` – the identical predicate the block is
// built on. Dialog up exactly when the sim is waiting; no dismiss flag, because there is nothing to
// dismiss. It outranks the other two overlays for the same reason: they can wait a click and this
// cannot.
const showKnock = computed(() => !!game.snapshot?.knockPrompt)

// W2-ENDINGS. Three gates, and every one of them reads a SNAPSHOT FIELD rather than a stop reason -
// the same argument the knock gate above makes, and here it matters more: an ending is permanent.
// Reload an ended career from the Careers list and the album has to be there again; the stop reason
// that reported it died with the advance that produced it.
//
// `showEnding` is not a dialog at all. It REPLACES the tab shell, which is why it is branched in the
// top-level chain beside OnboardingWizard rather than laid over the shell like the four overlays -
// there is nothing behind an epilogue worth painting.
const showEnding = computed(() => !!game.snapshot?.ending)
const showFork = computed(() => !!game.snapshot?.fork)
const showRetirement = computed(() => !!game.snapshot?.retirementOffer && !showFork.value)

// R9-21a: the injury stop popup – blocking, until Continue. The dialog itself plays the alert sfx
// on mount.
//
// R11-1 removed the `tab === 'home'` gate that used to sit here, justified by "advance only ever
// runs from Home's bar". That claim is FALSE on the current build: SeasonScreen's "Watch it live"
// on a booked practice week calls `game.advance(1)` from the Season tab (see playPracticeWeek), so
// an injury rolled on that very tick showed nothing at all. The dialog is a full-screen overlay
// with its own dismiss – there is no tab it cannot open over, and the dismiss flags are per
// snapshot, so it can never re-appear after Continue.
//
// ⚠ ROUND-16 #19 – IT READS THE SNAPSHOT NOW, NOT THE STOP REASON, and this is the same argument the
// knock gate above makes, arriving late at the one popup that most needed it. The owner's ruling:
// the report is owed whether she was hurt in a live match, in a skipped one, or in a week he never
// watched – «it is a consequence of STATE, not of a screen having been open».
//
// WHAT THE STOP REASON COULD NOT SEE, measured: `advanceWeeks` collects `'injury'` from
// `world.injury.sinceWeek === world.week` immediately after `tickWeek`, so it catches the weekly roll
// and the practice friendly (both resolve INSIDE the tick). It cannot catch a TOURNAMENT retirement,
// because `retirementInjury` is opened by `finalizeTournament`, which runs from the reveal's own
// command – `closeTournament` – long after the advance returned with `'tournament'`. That door is
// where 61% of this game's injuries come in (docs/specs/round16-injuries.md §2), and it reported
// nothing at all: no popup, in a career, ever. `match-retirement.md` §6 called that deliberate ("a
// second dialog over the finale would be two popups for one beat"); #18 is the owner overruling it,
// having watched a retirement go by as a scoreline and no explanation.
//
// The predicate is the ENGINE's own – `sinceWeek === week`, the identical test `advanceWeeks` runs –
// asked where the answer survives the command that produced it. `!pending` is what keeps the promise
// the old note was really making: the report waits for the reveal to be resolved and then lands, so
// it is one popup after one beat rather than one popup over it.
const showInjuryStop = computed(
  () =>
    // W2-ENDINGS: ...and behind the epilogue and the two blocking questions, for the reason the
    // knock clause below states. An ending replaces the shell entirely; the fork and the offer are
    // decisions time is stopped on, and an injury report can wait a click.
    !showEnding.value &&
    !showFork.value &&
    !showRetirement.value &&
    !!game.snapshot?.injury &&
    game.snapshot.injury.sinceWeek === game.snapshot.week &&
    // Behind the tournament takeover: a pending reveal is the screen that is mid-sentence, and the
    // retirement's own layoff does not even exist until it closes.
    !game.snapshot.pending &&
    injuryReported.value !== injuryIdentity.value &&
    // W4: one overlay at a time. A knock and a fresh injury cannot land on the same week (a knock only
    // arrives on a week with no injury, and `rollInjury` retires the live one at onset), so this is
    // belt-and-braces rather than a real collision – but the ordering rule is worth stating once and
    // it matches STOP_PRECEDENCE nowhere else: the blocking question comes first, because the injury
    // report can wait a click and the question is what time is stopped on.
    !showKnock.value,
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
    // W2-ENDINGS: the retirement offer is raised ON the wrap week by construction, so this is a real
    // collision rather than a defensive one - the summary waits behind the question.
    !showEnding.value &&
    !showFork.value &&
    !showRetirement.value &&
    stopReasons.value.includes('season-end') &&
    !!game.snapshot?.lastSeasonSummary &&
    !seasonSummaryDismissed.value &&
    !showInjuryStop.value &&
    // W4: ...and behind the knock, for the same reason. A wrap-up week is off-season, so a knock can
    // never arrive on one; this keeps the chain total anyway.
    !showKnock.value,
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

  <!-- Storage recovery: the failure path OUT of the splash. Never behind splashDone – a player
       whose database is broken must meet the choices, not a wordmark waiting on data. -->
  <div v-if="game.phase === 'recovery'" class="recovery-screen">
    <h2>Saved games can't be reached</h2>
    <p class="hint">
      The browser refused to open this game's storage – this can happen in private browsing, when
      disk is full, or after a browser update.
    </p>
    <p v-if="game.initError" class="error">{{ game.initError }}</p>
    <div class="recovery-actions">
      <button class="primary" :disabled="game.busy" @click="game.retryInit()">Retry</button>
      <button :disabled="game.busy" @click="recoveryFileInput?.click()">Import a save file</button>
      <button :disabled="game.busy" @click="game.startFreshFromRecovery()">Start a new career</button>
    </div>
    <input ref="recoveryFileInput" type="file" accept=".tsave" hidden @change="onRecoveryImportPicked" />
    <p v-if="game.saveOp?.op === 'import' && game.saveOp.status === 'error'" class="error">
      {{ game.saveOp.message }}
    </p>
    <p class="hint">
      Nothing has been deleted – if storage comes back, your careers will still be here.
    </p>
  </div>

  <div v-else-if="!game.ready" class="app-loading">Loading…</div>

  <SplashScreen v-else-if="!splashDone" @done="splashDone = true" />

  <OnboardingWizard v-else-if="showOnboarding" />

  <!-- W2-ENDINGS: THE EPILOGUE REPLACES THE APP SHELL. Branched here, beside the wizard, and not laid
       over the tab shell like the four overlays below - the story has no next week, so there is
       nothing behind it to go back to. «Raise another» drops the in-memory career, which flips
       `showOnboarding` above and hands the player to the wizard: exactly the seam MoreScreen's own
       new-career flow uses, and exactly what §5.6 asks for - one tap, one question, nothing carried. -->
  <EndingScreen v-else-if="showEnding" @new-career="game.$patch({ snapshot: null })" />

  <template v-else>
    <!-- epic/redesign-home slice A2 (owner, 28.07): THE APP HEADER IS GONE. It carried three
         things and all three found better homes – the avatar and its one-time callout moved onto
         Home's photograph (left of the date, where the export puts the day), the W/$ pill's wallet
         door became the Family budget card, and her name is the 42px headline of the hero. What is
         genuinely lost is the week number and the balance on Season / Stats / More; the owner ruled
         that acceptable, and Season prints the week on every calendar row anyway. -->

    <!-- D11 – TWO BANNERS, ONE SHAPE, AND THEY CAN BE ON SCREEN TOGETHER. Both said `Dismiss` and
         nothing else, so the pair collided in strict mode AND, more to the point, looked identical
         to anyone reading them: two grey strips stacked at the top of the page with the same word on
         the same button. This is the one place in the sweep where the honest fix is the VISIBLE
         copy rather than a label under it - an `aria-label` saying which is which would have left a
         sighted player with the ambiguity that started this. -->
    <div v-if="game.recovered" class="recovered-banner">
      <span>Autosave was damaged – restored the previous one.</span>
      <button @click="dismissRecovered">Dismiss autosave notice</button>
    </div>

    <!-- R11-1: NOT gated on the Home tab any more – an advance can be triggered from the Season
         screen too (playPracticeWeek), and a stop the player never sees is a stop that did not
         happen as far as they are concerned. -->
    <div v-if="showStopToast" class="stop-toast">
      <span>{{ stopReasonText }}</span>
      <!-- Its message always opens with the word "Stopped:", so this is the sentence's own noun and
           not a new one invented for the button. -->
      <button @click="dismissStopToast">Dismiss stop notice</button>
    </div>

    <!-- R13-12: the paused-tournament banner is GONE – the sticky bar below is global now, and
         its primary button ("Play {tier}", playWeek) is the resume affordance on every tab. -->

    <main class="app-content with-next-week-bar" :class="{ home: tab === 'home' }">
      <!-- epic/redesign-home: Home's notecards are doors (the budget card opens the wallet, the
           next-tournament card opens This week). The shell owns `tab`, so the screen ASKS – one
           event, no router, no store field. `recapFresh` is the This-week dot, still decided by the
           shared rule here (this file owns the per-career seen watermark) and only RENDERED there. -->
      <HomeScreen
        v-if="tab === 'home'"
        :recap-fresh="weekTabDot"
        @navigate="$event === 'market' ? openMarket('home') : (tab = $event)"
      />
      <SeasonScreen v-else-if="tab === 'play'" />
      <!-- Screen H, the calendar. It ASKS to play the week rather than doing it: `playWeek` is the
           app's one advance, and a second caller of `game.advance` is how "what does this press cost"
           gets answered twice (see composables/weekAction.ts). -->
      <CalendarScreen
        v-else-if="tab === 'calendar'"
        :auto-play="calendarPlays"
        @advance="playWeek(1)"
        @auto-played="calendarPlays = false"
      />
      <!-- W1: the story opens itself at the end of a week (see the `week` watcher above), so its ×
           is a real close now – the design's own "the cross returns to Home" – and not just a
           silencer. (The handoff's wording is quoted in the script block; no Cyrillic may appear in
           a template – tests/round13-nav.test.ts.) -->
      <!-- ⚠ AND ITS CLOSE GOES HOME, WHICH IS WHAT THE BUTTON ON IT SAYS. It read `afterWeekTab()` for
           one wave, which sent a resolved week to the Calendar - so a control labelled "Proceed to Home"
           landed on the calendar, showing the week AFTER the one just played. Both doors out of a week
           are `home` again (the other is the watcher in the script), so the two still cannot disagree
           and switching the story off still changes nothing about navigation. The calendar is where a
           week is WATCHED now; see the detour in `playWeek`. -->
      <ThisWeekScreen v-else-if="tab === 'week'" @close="tab = 'home'" />
      <!-- ⚠ MERGE NOTE (round-19): the calendar branch forked before round-18 landed, so it still
           carried the flat `tab = 'kid'` market routing. Both halves are kept - the story's close is
           the shared one above, and the market keeps round-18's `marketFrom`, which is the whole
           point of that fix: the back arrow returns where the market was opened from. -->
      <KidScreen
        v-else-if="tab === 'kid'"
        @navigate="$event === 'market' ? openMarket('kid') : (tab = $event)"
      />
      <CoachMarketScreen v-else-if="tab === 'market'" @back="tab = marketFrom" />
      <StatsScreen v-else-if="tab === 'stats'" />
      <!-- U1 (screen G): the Family Budget grew the export's back arrow, and Money is a tabless
           content state - so it asks the shell to move exactly the way Home and Kid already do. -->
      <MoneyScreen v-else-if="tab === 'money'" @navigate="tab = $event" />
      <MoreScreen v-else-if="tab === 'more'" />
      <TrophiesScreen v-else-if="tab === 'trophies'" />
    </main>

    <!-- Package N: the sticky week button, floating above the tab bar. R13-12: GLOBAL – it renders
         on every tab (advancing the week is the game's one always-available verb, and the R9-9a
         "no tab can strand the career" guarantee rides on it now). It must never move into the
         This-week tab.
         A3 (owner, 28.07): the BAR is gone and the button stands on its own – a panel behind it
         made the bottom of every screen feel heavy – styled as the export's CTA pill, the same
         object as "+ Plan week" on the
         Season screen and "Start Match" on the tournament preview. The skip-4 button went with the
         bar: it was a testing shortcut that offered to skip the thing the player came to play.
         The mockups have no week button at all, because the mockups never modelled a week loop -
         this is the one control the redesign keeps for reasons of play, not of picture.

         WAVE 2 (owner, 28.07): it is HOME-ONLY now, WITH ONE EXCEPTION, and the exception is the
         whole design. R13-12 made the button global so no tab could strand the career, and that was
         right while it sat in a bar of its own; floating, it lands under the thumb on every screen,
         and a stray tap SPENDS A WEEK - the one action in this game that cannot be undone.
         So the button splits by what a stray tap COSTS:
           * ADVANCING A WEEK is irreversible, so it lives on Home only. Home is one tap from
             everywhere, so nothing is stranded.
           * RESUMING A PAUSED TOURNAMENT costs nothing - it re-opens an overlay the player backed
             out of - so it stays global. R13-8 deleted the paused-tournament banner precisely
             because this button carried resume on every tab; keeping that arm global is what lets
             the banner stay deleted. -->
    <div v-if="tab === 'home' || game.snapshot?.pending" class="next-week-bar">
      <!-- R10-7: one button, a label that names the plan for the week it is about to play.
           R13-5/R13-8: it routes through playWeek – a paused tournament re-opens its overlay, a
           booked practice week opens the flow, everything else advances as before. -->
      <button
        class="primary next-week-btn"
        :class="`plan-${weekAction.kind}`"
        data-tour="next-week"
        :disabled="weekAction.disabled"
        @click="playWeek(1)"
      >
        {{ weekAction.label }}
      </button>
    </div>

    <!-- D7: the landmark is named (the epilogue's album has a `<nav>` too, so "the navigation" was
         never a unique thing to ask for), and the active tab announces itself through `aria-current`
         instead of only through a CSS class. `aria-current="page"` and not `role="tab"`: these
         buttons swap the whole screen and there is no `tabpanel` behind them to point at, so a
         tablist would be a costume. -->
    <nav class="tab-bar" aria-label="Main">
      <button
        v-for="t in TABS"
        :key="t.id"
        class="tab-btn"
        :class="{ active: tab === t.id }"
        :data-tour="`tab-${t.id}`"
        :aria-label="t.label"
        :aria-current="tab === t.id ? 'page' : undefined"
        :aria-describedby="tabDot(t.id) ? `tab-dot-${t.id}` : undefined"
        @click="openNav(t)"
      >
        <span class="tab-icon" :style="{ WebkitMaskImage: `url(${iconUrl(t.icon)})`, maskImage: `url(${iconUrl(t.icon)})` }"></span>
        <span class="tab-label">{{ t.label }}</span>
        <!-- ONE DOT ELEMENT FOR THREE FACTS, which is what it always was: same class, same accent,
             no private treatment - R9-21b's unread-news dot (news OR an unopened letter, argued at
             `homeHasNews`), the season's, and the cabinet's. What differs is the sentence, and the
             three sentences are in `TAB_DOT_LABEL` beside the rule that picks them.
             epic/redesign-home: the fresh-recap dot left this bar with the This-week tab - it is on
             Home's Next-tournament card now, which is the door to that screen. -->
        <span
          v-if="tabDot(t.id)"
          :id="`tab-dot-${t.id}`"
          class="tab-dot"
          role="img"
          :aria-label="TAB_DOT_LABEL[t.id]"
        ></span>
      </button>
    </nav>

    <!-- THE TROPHY ON ITS WAY TO THE CABINET. The owner asked for the trophy being ADDED to the
         trophies section, ending in the dot above, and the path crosses a boundary no single screen
         owns: it takes off from the finale poster inside the tournament takeover and lands on the
         bar. So the shell flies it, at the root, and the finale only says "one left, from here"
         (`armTrophyFlight`). Both ends were measured at take-off, so this element has nothing left
         to work out – it is a picture with a start, an offset and a duration.
         Decoration with a job: aria-hidden and never a click target, because the fact it delivers is
         delivered by the dot, which stays. Not mounted at all under reduced motion. -->
    <img
      v-if="trophyFlight"
      class="trophy-flight"
      :src="trophyFlight.src"
      :style="trophyFlightStyle"
      alt=""
      aria-hidden="true"
    />

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
      :kid-rank="activeRank"
      @close="practiceLive = null"
    />

    <!-- Round-7 item 4: end-of-season summary popup at the W49→50 boundary. -->
    <SeasonSummaryDialog v-if="showSeasonSummary" @continue="dismissSeasonSummary" />

    <!-- R9-21a: a fresh injury raises a BLOCKING popup (kind, layoff, what was auto-withdrawn +
         refunds) and an alert sfx – no more quiet missable toast. R16 #19: gated on the SNAPSHOT,
         so the retirement door raises it too and no week can swallow it. -->
    <InjuryStopDialog v-if="showInjuryStop" @continue="dismissInjuryStop" />

    <!-- W4: the ordinary training week's one decision – rest the knock or train through it. It emits
         no event and has no dismiss: answering it IS the exit, and until it is answered the engine
         will not tick a week. Last in the template so it paints over anything else that is up. -->
    <KnockDialog v-if="showKnock" />

    <!-- W2-ENDINGS: the two blocking questions. Neither has a dismiss and neither has a third
         button - answering IS the exit, and until one is answered the engine will not tick a week.
         Painted last, over everything, for the same reason KnockDialog is. -->
    <ForkDialog v-if="showFork" />
    <RetirementDialog v-if="showRetirement" />

    <!-- Round 5 item 10: one-shot coach-mark tour after the very first career ever. -->
    <OnboardingTour v-if="showTour" @done="dismissTour" />
  </template>
</template>

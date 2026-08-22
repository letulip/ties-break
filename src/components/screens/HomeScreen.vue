<script setup lang="ts">
// epic/redesign-home, slice A – HOME AS A DIARY PAGE (the owner's redesign, 28.07).
//
// This is docs/specs/family-diary.md D9/D12, the restructure the doc deliberately parked ("SOON,
// after D2 proves the direction"). D2 proved it. The page, top to bottom:
//
//   hero    the emotion painting, FULL-BLEED and melting into the page, carrying everything:
//           the date line and two quiet icons across the top, the greeting, her NAME at 42px, her
//           age, her rank chip, and the diary caption on a frosted chip low on the photograph
//   body    her condition – the ten squares and the engine's WHY line – right under the picture
//   cards   a 2x2 grid: next tournament (with the painted venue), the family budget (+ a 12-week
//           chart), the coach's photograph, and the memory polaroid
//   strips  the tier ladder and the news feed, unchanged in substance, restyled as more diary
//
// THE GEOMETRY IS THE OWNER'S EXPORT, docs/design/screens.dc.html block "A. Home", measured off the
// markup: 398/844 of the device for the hero, 42px/800/-0.025em for her name, 17px card corners on
// a #17212b->#121a22 gradient, 10px/800/0.1em lime kickers, the venue arch at 112x136 with a 100deg
// dissolve, the 68px cream polaroid. Where the export and the OWNER's explicit answers disagree the
// owner wins, and three places he ruled on are marked in the template below.
//
// WHAT THIS SCREEN IS NOT ALLOWED TO DO, and did not do before either: derive a single fact of its
// own. The emotion, the caption, the condition note, the greeting, the memory and the tier states
// are all engine/composable decisions; this file lays them out. That is why the painting and the
// words can never disagree.
//
// The advance button is NOT here – it is App.vue's sticky bar, global on every tab (R13-12).
import { computed, ref } from 'vue'
import { useGameStore } from '../../stores/game'
import { coachRoomBand } from '../../engine/world/coachMarket'
import { LADDER_LABEL, rankChipTrack, type PlayStyle, type WorldEvent, type WorldMatch } from '../../shared/protocol'
import type { LadderTrack, TierId } from '../../engine/season/types'
import { weekDateLine, weekLabel, weekRange } from '../../shared/dates'
import { formatShortName, rankLabel } from '../../shared/format'
import { formatCents } from '../../shared/money'
import { KID_ID, flipScore, practiceCaution } from '../../engine/world'
import { ECONOMY } from '../../engine/economy'
import { useKidEmotion } from '../../composables/kidEmotion'
import { useHeaderAvatar } from '../../composables/headerAvatar'
// The app's one red-to-green ramp, shared with the Season and Calendar odds rings. `{ pct }` names
// the scale IN the call: this number is a 0..100 percentage, not a 0..1 share, and the signature
// will not let the two be confused.
import { readingColor } from '../../composables/readingColor'
import { facePoint } from '../../art/faceRects'
import { coachPortraitUrl, coachUrlFor, portraitUrl as portraitArtUrl } from '../../art/preload'
import { venueArtUrl } from '../../art/venues'
import { TIER_SHORT } from '../../composables/weekAhead'
// R11-5a: the ONE tier-state rule, shared with the Season screen's lock labels + open-tier note.
// `feedContext` is the ONE reader of the engine's per-rung window (`Snapshot.tierOpen`); the season
// strip is its third consumer, never a second derivation. See `stripExpanded` below.
import { feedContext, isTierOpen, useTierStates } from '../../composables/tierState'
import MatchReplay from '../MatchReplay.vue'
import RankHelpDialog from '../RankHelpDialog.vue'
// v48: the podium's own paper, on the one week a year that is about her rather than about tennis.
import ConfettiBurst from '../ui/ConfettiBurst.vue'
// THE INBOX (docs/specs/offers-and-the-inbox.md) – the popup behind the second tool, beside the bell.
import InboxSheet from '../InboxSheet.vue'
// ⭐⭐ ROUND 24 #2b/#3 – the college year, drawn as a card on this page instead of as a page of an
// epilogue. See `collegeWeek` at the foot of this script for why the predicate is the ending.
import CollegeYearCard from '../CollegeYearCard.vue'
// The bell's dot and the App bar's Home dot read ONE rule from here - see the module header for the
// bug that made the extraction necessary.
import { useLetterWatermark, useNewsWatermark } from '../../composables/inboxCue'
// U0 – the shared components (docs/specs/ui-components.md). Home is one of the two screens this
// slice ports onto them; Season is the other, and the pair is the only honest test that these are
// components rather than one screen with a wrapper round it. Where Home still carries a rule of its
// own it is now in this file's <style scoped> block rather than in src/style.css - see the note at
// the top of that block for why that matters to the five screens being built in parallel.
import ScreenShell from '../ui/ScreenShell.vue'
import Card from '../ui/Card.vue'
import Eyebrow from '../ui/Eyebrow.vue'
import Polaroid from '../ui/Polaroid.vue'
import ProgressRing from '../ui/ProgressRing.vue'
import { playSfx } from '../../audio/sfx'
// HER COUNTRY IN WORDS AND AS A FLAG, from `composables/countries.ts`. `flagEmoji` was
// byte-identical in five components and the name map was written out in two; a twenty-fifth
// country would have had to be added in two files with nothing to say so.
import { flagEmoji } from '../../composables/countries'

// The shell owns `tab`; the notecards that are doors ASK it to move. One event, no router.
// `recapFresh` is App.vue's own This-week dot rule (composables/weekRecap) – it left the bottom bar
// with the tab and is RENDERED here, on the card that opens that screen.
defineProps<{ recapFresh: boolean }>()
const emit = defineEmits<{ navigate: ['money' | 'week' | 'more' | 'kid' | 'market'] }>()

const game = useGameStore()
/** Vite's base path, so the brand mark resolves under a sub-path deploy the same way the art does. */
const base = import.meta.env.BASE_URL

// --- A2: the avatar and its callout, moved off the deleted app header ---------------------------
// TWO different faces live on this screen and they answer to different rules. The BIG painting is
// emotional (useKidEmotion, below). This 256px crop in the corner is F45-1's age-only `norm`: it is
// chrome, and chrome that flickers with each week's result is noise. Keeping them on separate
// composables is what makes that guarantee checkable.
const { cropUrl: headerAvatarUrl } = useHeaderAvatar()
// R13-12's discoverability callout: shown once ever per device, dismissed by the first tap on
// either the avatar or the callout itself. localStorage, never the save.
const KID_HINT_KEY = 'tb:kidAvatarHintSeen'
const showKidHint = ref(!localStorage.getItem(KID_HINT_KEY))
function openKid(): void {
  if (showKidHint.value) {
    showKidHint.value = false
    localStorage.setItem(KID_HINT_KEY, '1')
  }
  emit('navigate', 'kid')
}
// Diary-1 (D2): the top of Home is the BIG painting – the same emotion-correct 512px art the Kid
// screen shows (already preloaded per band, so this costs zero new bytes), landscape-cropped with
// `object-fit: cover` and steered by the face centre from the ONE crop table (src/art/faceRects.ts),
// so the window shows her face plus the scene around it. The emotion is the ENGINE's decision
// (snapshot.diary), same as the caption under it – image and words cannot disagree by construction.
const { portraitUrl, stage, emotion } = useKidEmotion()
const photoStyle = computed(() => {
  const p = facePoint(`${stage.value}-${emotion.value}`)
  return { objectPosition: `${p.x}% ${p.y}%` }
})
// The ONE phrase under her name (D2) – null on a deliberately quiet week. It appears exactly once
// on this page, which is the rule the redesign is most careful about: the greeting above is a time
// of day and never a second copy of it (engine/diary.ts greetingFor).
const photoLine = computed(() => game.snapshot?.diary.photoLine ?? null)
// v48: is this her birthday week? The SAME fact the diary's birthday lines license off
// (`facts.birthdayAge`), so the confetti and the words can never disagree about whose week it is –
// and it stays true for the whole week rather than only while the popup is up, because a birthday is
// a week in this game and the celebration should outlast the choice.
const birthdayWeek = computed(() => game.snapshot?.diary.facts.birthdayAge != null)
// THE GREETING FOLLOWS THE PLAYER'S OWN CLOCK (owner, 29.07).
//
// The engine picks one off `seed:greet:<week>` because the engine may not read a wall clock - its
// whole contract is that the same seed replays the same career. But the greeting is not part of the
// career: it is the app saying hello to the person holding the phone, and that person knows what
// time it is. So the CLOCK decides here, in the view, where a wall-clock read costs nothing and
// changes nothing that is stored.
//
// The engine's choice is still the fallback, and it earns its keep: its rule is that the greeting
// must not repeat the photo caption ("...a quiet morning" under a "Good morning"). When the clock's
// answer would collide with the caption, we defer to the engine's - the caption is the writing, and
// the greeting is the frame around it.
const CLOCK_GREETINGS: [number, string][] = [
  [5, 'Good morning'],
  [12, 'Good afternoon'],
  [18, 'Good evening'],
  [22, 'Good night'],
]

function greetingForHour(hour: number): string {
  let picked = 'Good night' // 22:00-04:59 wraps to the last band
  for (const [from, text] of CLOCK_GREETINGS) if (hour >= from) picked = text
  return picked
}

const greeting = computed(() => {
  const fromEngine = game.snapshot?.diary.greeting ?? ''
  const byClock = greetingForHour(new Date().getHours())
  const caption = (game.snapshot?.diary.photoLine ?? '').toLowerCase()
  const word = byClock.slice('Good '.length)
  return caption.includes(word) ? fromEngine || byClock : byClock
})
// The WHY line beside the condition bar (D1).
const conditionNote = computed(() => game.snapshot?.diary.conditionNote ?? '')
// The Memory card (D10): a past milestone + the painting from the band she was in THEN.
const memory = computed(() => game.snapshot?.diary.memory ?? null)
const memoryArt = computed(() =>
  memory.value ? portraitArtUrl(memory.value.stage, memory.value.emotion) : '',
)
const memoryStyle = computed(() => {
  if (!memory.value) return undefined
  const p = facePoint(`${memory.value.stage}-${memory.value.emotion}`)
  return { objectPosition: `${p.x}% ${p.y}%` }
})

// The export puts her FIRST NAME alone at 42px – the biggest type in the app, and the point of the
// whole screen. Her full name still reads on the Kid screen and in every standings row.
const kidFirstName = computed(() => game.snapshot?.profile.kidName ?? '')
const flag = computed(() => flagEmoji(game.snapshot?.profile.country ?? ''))
const ageYears = computed(() => game.snapshot?.ageYears ?? 0)
const week = computed(() => game.snapshot?.week ?? 0)

// --- the header line ---------------------------------------------------------------------------
// "W27 2033 · Jun 3 – Jun 9" – OUR week number, the year written out in full (the header has the
// room the 30px status pill does not) and the week's real calendar days. Composed by
// shared/dates.ts and nowhere else, so no surface can invent a second shape for it.
const dateLine = computed(() => weekDateLine(week.value))

// ⚠ THE BELL'S DOT NOW CLEARS (owner, 04.08: «Красная точка на колокольчике на домашнем экране не
// сбрасывается»), and the fix is a watermark rather than a new rule.
//
// WHAT IT USED TO SAY, and why that was never a signal:
//
//     events.some(e => e.week === currentWeek && e.type !== 'expense' && e.type !== 'income')
//
// i.e. "this week put something in the feed". The note that stood here defended it as "one FACT and
// not the 'unread' it cannot know" - and the fact was true, useless and permanent: a played week
// essentially always has a diary line in it, so the dot was lit on arrival, lit after the player had
// read every word of the feed, and lit again next week. It counted events; it never asked whether
// anybody had looked.
//
// WHAT IT SAYS NOW: "the feed has something newer than the last time you went to it." That is a fact
// the app genuinely holds - it knows when the bell was tapped - and it is the SAME watermark idiom
// the App shell has used for the Home tab, the Season tab and the trophy cabinet since R9-21b. The
// rule and the storage live in composables/inboxCue.ts so this bell and that tab cannot drift apart;
// the KEY is this surface's own, because the two dots mean different things and one key would make
// each clear the other (the module header spells that out).
const { unseen: newsUnseen, markSeen: markNewsSeen } = useNewsWatermark('tb:lastSeenBellNewsId')
function jumpToNews(): void {
  playSfx('clickSoft')
  // Tapping the bell IS the looking, so it is what puts the dot out - the feed is one scroll away on
  // this same page and there is no later moment to catch.
  markNewsSeen()
  document.getElementById('diary-news')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// THE INBOX, beside the bell (docs/specs/offers-and-the-inbox.md §2). The owner asked for it there
// by name: «можно завести inbox на home возле колокольчика».
//
// ⚠ ITS DOT COPIES THE BELL'S DISCIPLINE EXACTLY, one line up: it asserts one FACT and not the
// "unread" it cannot know. The fact is "an offer is open and its deadline has not passed", and the
// ENGINE holds it - `snapshot.offerOpen`, decided beside the offers themselves, rather than a
// predicate this screen re-derives and could get subtly out of step with. It goes out on its own,
// because the last open offer being signed, refused or expiring is the same event as that turning
// false. What it must never mean is "you have not looked at this": the engine cannot know that, and a
// dot that claims to is a dot that lies on the second visit.
const offerOpen = computed(() => game.snapshot?.offerOpen ?? false)

// ⚠ ...AND THE ENGINE'S FACT ALONE WAS NOT ENOUGH (owner, 05.08: «Письма приходят, но ни маркера,
// ни извещений нет»). `offerOpen` is `hasLiveOffer` - "a decision is waiting" - and a letter that
// asks for no decision never sets it. Since 04.08 a kit deal ENDS with a notice (`state: 'info'`),
// the tournament desk's entry receipts are notices too, and every one of them landed in the post
// with this icon staying dark. `newestLetterId`'s header in composables/inboxCue.ts had already
// written down that this is a second question and that the icon was not yet asking it.
//
// So the dot is now the OR of two facts, and each keeps its own way out:
//   * a live offer clears when it is signed, refused or expires - the engine's business, untouched;
//   * an arrival clears when he OPENS the inbox, which is the moment he has been shown it.
// Its own storage key, per the module's rule that two surfaces watching one thing must not clear
// each other: the App shell's Home-tab dot means "post arrived while you were on another tab" and
// is cleared by arriving on Home, which is a different sentence from "you have not opened it".
const { unseen: letterUnseen, markSeen: markLettersSeen } = useLetterWatermark('tb:lastSeenInboxLetter')
const inboxDot = computed(() => offerOpen.value || letterUnseen.value)
const showInbox = ref(false)
function openInbox(): void {
  playSfx('clickSoft')
  // Opening the inbox IS the reading - the letters are the whole of what the sheet shows, so there
  // is no later moment to catch and no second surface that could still owe him the news.
  markLettersSeen()
  showInbox.value = true
}

// --- her rank: the page's one table-number -----------------------------------------------------
// The diary doc's structural decision is that numbers stop being the content – the full numeric
// truth lives on Stats and in the wallet. Her RANK survives on Home as a single chip because it is
// the one number that is a story beat rather than a readout, and because it carries the best-6
// explainer the owner needed twice (round-6). Season points went to Stats with the rest.
//
// ⚠ AND IT SAYS WHICH TABLE IT IS (30.07, fix/ranking-truth). There are two - the national one and
// the international one, two currencies with no exchange rate (docs/specs/two-ladders.md) - and this
// chip showed a bare "#4" read off `kidRank`, which was a rank folded over BOTH ladders at the time
// and is the international one now. Either way Stats showed a different number for the same week,
// which is the owner's «Rank #4 on the home tab and end of season popup seems strange since in stats
// I can clearly see #128».
//
// So the chip reads the ladder the ENGINE says she is competing in (`activeLadder`: professional
// once any W result has ever counted - permanently from that moment; international while she holds
// a counting result there; national before that) and NAMES it. Same source as the Stats screen's
// default tab, so the two cannot disagree again.
//
// ⚠ AND IT IS NOT ALWAYS DRAWN (owner, 02.08: «нужна ли она там вообще?» - architect's ruling).
// `rankChipTrack` returns null before her first counting result in ANY table, and the chip goes
// with it: "National · Unranked" over a brand-new career was a readout with nothing to read. The
// moment anything counts anywhere the chip is back for good - the professional arm survives even a
// window that empties (Professional + Unranked), which is the one-way door the engine's
// `activeLadderOf` owns. The selection rule is pinned in tests/ladder-separation.test.ts S7.
const chipTrack = computed(() => rankChipTrack(game.snapshot))
const activeLadder = computed(() => game.snapshot?.activeLadder ?? 'domestic')
const ladder = computed(() => game.snapshot?.ladders[activeLadder.value])
const ladderLabel = computed(() => LADDER_LABEL[activeLadder.value])
const kidRank = computed(() => ladder.value?.rank ?? null)
// 'Unranked' until she's earned a counting result (see rankLabel): a point-less kid isn't really
// ranked, so we don't flash a misleading '#1' on a brand-new career. `rank: null` is now the engine's
// own way of saying exactly that, so this stops counting results to find out for itself.
const ranked = computed(() => kidRank.value !== null)
// The long form, where a chip has no room: which table, and the one fact about it that matters.
// A TOTAL Record over LadderTrack (the LADDER_TIP discipline from Stats): a fourth table cannot
// ship until somebody writes this chip's sentence for it.
const RANK_CHIP_TITLE: Record<LadderTrack, string> = {
  domestic:
    'Her national ranking – Local, Regional and National results. These are the points that open her next tier. Tap to see how they add up.',
  itf: 'Her international ranking – Junior Tour results only. National results do not count towards it. Tap to see how it adds up.',
  wta: 'Her professional ranking – W15 and up, the paid tour. Junior points never cross over. Tap to see how it adds up.',
}
const rankChipTitle = computed(() => RANK_CHIP_TITLE[activeLadder.value])
// FROM THE SAME TABLE as `kidRank` above. Reading `snapshot.prevKidRank` here would diff her national
// place against last week's international one; `ladders[t].prevRank` is per-ladder for that reason.
const prevKidRank = computed(() => ladder.value?.prevRank ?? null)
// Rank goes UP when the number goes DOWN. null prev (or no change) shows a neutral dash.
const rankMovement = computed<{ dir: 'up' | 'down' | 'flat'; by: number }>(() => {
  const now = kidRank.value
  const prev = prevKidRank.value
  if (now === null || prev === null || now === prev) return { dir: 'flat', by: 0 }
  return now < prev ? { dir: 'up', by: prev - now } : { dir: 'down', by: now - prev }
})

// --- THE CONDITION RING (A2b, the owner's ruling 28.07) ------------------------------------------
// Slice B's ten squares became the export's ProgressRing, and it moved ONTO the photograph, into the
// bottom-right corner beside the caption chip. Two things changed with it and both are the owner's:
//
//  * THE NUMBER IS BACK. D3 ("Home speaks words, not percentages") took it away, and it belongs in a
//    ring – a ring without its number is a decoration, and the fullness of an arc is not readable to
//    a percent. The WORDS did not leave: the availability chip still speaks, and the WHY line is now
//    the more prominent of the two, sitting above the caption instead of under the picture.
//  * THE RAMP IS CONTINUOUS AND SOLID. Not the old ten discrete fills, and not a gradient either
//    (the owner corrected that on sight): one flat colour, interpolated red→green by the exact
//    number, so 61% and 62% are genuinely different colours. It is the SAME hsl ramp the ten
//    squares used, which is why nothing the player already learned had to be re-learned.
//
// U0: the geometry (46px box, r=19, 3px stroke, round cap, twelve o'clock start) and the arithmetic
// that turns a percentage into a dash offset now live in ui/ProgressRing.vue, where the Season
// card's identical ring reads them too. What stays HERE is the only part that was ever Home's: WHICH
// COLOUR the arc is, because that is data about her body, not styling.
const condition = computed(() => game.snapshot?.condition ?? 0)
/** The arc's colour: hue 0 (red) at 0 through hue 120 (green) at 100 – slice B's own ramp, now read
 *  continuously instead of in ten steps.
 *
 *  ⚠ THE RAMP ITSELF IS NO LONGER WRITTEN HERE. It was, and so were three byte-identical copies of it
 *  on other screens; `composables/readingColor.ts` owns the one expression now. What stays Home's is
 *  the only part that was ever Home's – that the arc is coloured by her CONDITION, and that condition
 *  is a percentage. The clamp went with the ramp: `readingColor` clamps to the ends of the range. */
const ringColor = computed(() => readingColor({ pct: condition.value }))
/** The BANDS survive in the spoken label only. The colour is now a smooth ramp, so it can no longer
 *  say "she is under the entry floor" by itself – and that is a fact worth keeping sayable. */
const conditionStatus = computed<'red' | 'amber' | 'ok'>(() => {
  const c = condition.value
  if (c < ECONOMY.availability.minConditionToEnter.local) return 'red' // below the lowest floor
  if (c < ECONOMY.availability.minConditionToEnter.national) return 'amber' // near the higher floors
  return 'ok'
})
/** The ring is a picture, so it says out loud what it draws – including WHY the number matters. */
const conditionAria = computed(() => {
  const band =
    conditionStatus.value === 'red'
      ? 'below the entry floor'
      : conditionStatus.value === 'amber'
        ? 'near the higher entry floors'
        : 'fit'
  return `Condition ${condition.value} percent, ${band}`
})

// R13-3: the practice-strain warning, read off the same pure predicate the planner sheet asks
// (practiceCaution, for "one more match next week"), so the warning and the booking sheet can never
// disagree.
const strainNote = computed<string | null>(() => {
  const s = game.snapshot
  if (!s || s.injury) return null
  const strain = practiceCaution({
    condition: s.condition,
    practiceWeeks: s.practices.map((p) => p.week),
    week: s.week + 1,
  })
  if (strain.level !== 'caution') return null
  return strain.reasons.includes('tired')
    ? 'Worn out – she needs a rest week'
    : `${strain.streakWeeks} match weeks in a row`
})

// --- NEXT TOURNAMENT card ----------------------------------------------------------------------
// The kid's nearest ENTERED event. The card is a door: it opens the This-week screen, which is
// where the plan presets, the planned spend and the week recap live (they left the bottom bar with
// that tab – see App.vue's TABS comment).
const nearestEntered = computed(() => game.snapshot?.upcoming.find((e) => e.entered) ?? null)
const nextDates = computed(() => (nearestEntered.value ? weekRange(nearestEntered.value.week) : ''))
// A COST, printed plain (owner, 28.07). The minus sign belongs to the ledger, where a number can
// go either way; here the label already says "Travel budget" and nothing about it is ever positive,
// so the sign only made it look like a balance in trouble.
const nextTravel = computed(() =>
  nearestEntered.value ? formatCents(Math.abs(nearestEntered.value.travelCostCents)) : '',
)
// The painted venue. src/art/venues.ts picks it from the event's own id on a purpose-scoped
// sub-stream, so a tournament's photograph is the same one every render, every reload and every
// replay – and it never promises a surface the engine will not play on.
const nextVenue = computed(() => {
  const e = nearestEntered.value
  const s = game.snapshot
  return e && s ? venueArtUrl(e.tier, e.surface, e.id, s.seed) : ''
})

// --- FAMILY BUDGET card ------------------------------------------------------------------------
// The total is the same live figure the wallet's big number shows; the chart is the engine's
// per-week income/expense series over the SAME trailing 12 weeks the wallet's "12 weeks" breakdown
// folds (snapshot.finance.weekly12 – see world.ts financeSeries). Card and wallet read one ledger,
// so they can never disagree about a week. The whole card opens the wallet.
const fundsCents = computed(() => game.snapshot?.fundsCents ?? 0)
const funds = computed(() => formatCents(fundsCents.value))

// THE BUDGET SPARKLINE. The export draws a lime polyline with a soft area under it and one dot per
// point, and the owner ruled we take it (A2, 28.07) over slice A's paired bars. Geometry is the
// export's own: a 146x46 viewBox, 1.8 stroke, r=2.8 dots, the area fading from 0.42 alpha to zero.
//
// WHAT THE LINE PLOTS is our decision, not the export's: the running BALANCE, so the line ends
// exactly on the total printed above it and its slope is the thing that actually matters to a
// family. The dot colours are the export's three day colours, and they say how the week went –
// earned (good), spent but still afloat (mid), spent while under water (bad). A dot is never a
// mood: it is arithmetic the player can check against the wallet.
const CHART_W = 146
const CHART_H = 46
const CHART_PAD = 6 // the export insets the first and last point by this much
const CHART_TOP = 8
const CHART_BOTTOM = 38
interface ChartDot {
  x: number
  y: number
  tone: 'good' | 'mid' | 'bad'
}
const budgetChart = computed<{ dots: ChartDot[]; line: string; area: string; any: boolean }>(() => {
  const points = game.snapshot?.finance.weekly12 ?? []
  const any = points.some((p) => p.incomeCents > 0 || p.expenseCents > 0)
  if (!any || points.length === 0) return { dots: [], line: '', area: '', any: false }
  // The band is the series' own min..max, so a flat-broke career still reads as a flat line rather
  // than as noise amplified to full height. A zero-height band (one point, or a career that never
  // moved) parks the line in the middle instead of dividing by zero.
  const values = points.map((p) => p.balanceCents)
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const span = hi - lo
  const step = points.length > 1 ? (CHART_W - CHART_PAD * 2) / (points.length - 1) : 0
  const dots: ChartDot[] = points.map((p, i) => ({
    x: CHART_PAD + i * step,
    y: span === 0 ? (CHART_TOP + CHART_BOTTOM) / 2 : CHART_BOTTOM - ((p.balanceCents - lo) / span) * (CHART_BOTTOM - CHART_TOP),
    tone: p.incomeCents > p.expenseCents ? 'good' : p.balanceCents < 0 ? 'bad' : 'mid',
  }))
  const line = dots.map((d) => `${round2(d.x)},${round2(d.y)}`).join(' ')
  const area = `M${round2(dots[0].x)} ${round2(dots[0].y)} ${dots
    .slice(1)
    .map((d) => `L${round2(d.x)} ${round2(d.y)}`)
    .join(' ')} L${round2(dots[dots.length - 1].x)} ${CHART_H} L${round2(dots[0].x)} ${CHART_H} Z`
  return { dots, line, area, any: true }
})
function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// --- COACH card --------------------------------------------------------------------------------
// A2c/d (owner, 28.07). The card is the EXPORT's: his portrait standing down the left edge, the
// kicker and his words beside it. Two corrections got it here, both his:
//
//  * the picture is not cropped vertically. It is sized by HEIGHT (`height:100%; width:auto`), so
//    the whole frame is visible and the card simply shows as much of its width as it has room for;
//    the hard right edge is a gradient into the card rather than a cut.
//  * his WORDS came back. Slice A had replaced them with the coaching spend, which was true but was
//    a number on a card that is about a person - the owner cut it and asked for the pool that
//    already existed. This IS that pool, restored verbatim from before the redesign (round-7 5d):
//    five lines per play style, the visible one rotating every FOUR weeks by
//    `floor(week / 4) % 5`. Deterministic, and slow enough that a coach's read on her settles for
//    a while instead of flipping every week.
//
// The default portrait per family background is the owner's mapping and lives in src/art/preload.ts
// with the other art URLs.
// R4: HER coach, once she has one - the roster row marked `current` carries both his portrait stem
// and his name, so the face and the signature below it are the same person. `coachUrlFor` stays the
// fallback for a self-coached career, which is what it was always for: a note with no coach behind
// it still needs a face, and the owner's per-background mapping is the one to use for it.
const currentCoach = computed(() => game.snapshot?.coachMarket.find((c) => c.current) ?? null)
const coachPhoto = computed(() =>
  currentCoach.value
    ? coachPortraitUrl(currentCoach.value.id)
    : game.snapshot
      ? coachUrlFor(game.snapshot.profile.background)
      : '',
)
/** The handwritten signature under the note (design §Home.3: «подпись "M. Ricci"»). Empty while she
 *  is self-coached - the read is the parent's own then, and nobody signs their own diary. */
const coachSignature = computed(() =>
  currentCoach.value ? formatShortName(currentCoach.value.name) : '',
)
// --- Coach's eye: a rotating pool of 5 lines per play style (round-7 item 5d). The
// existing owner-approved line is #1 of each pool; the visible line rotates every 4 weeks by
// `Math.floor(week / 4) % 5` – deterministic (same 4-week block -> same line) but no longer
// churning weekly (owner: a coach's read on the kid should settle for a while, not flip). --
const COACH_QUOTES: Record<PlayStyle, [string, string, string, string, string]> = {
  aggressive: [
    'She hits like it owes her money – now we build the legs to match.',
    'First strike on every point – we just need the misses to come down.',
    'When she is on, nobody lives with her. The job is the quiet days.',
    'She wants the short ball so badly – let us make her earn it.',
    'Big cuts, big heart – footwork turns that into wins.',
  ],
  counterpuncher: [
    'She never gives you the same ball twice. Patience is her weapon.',
    'She would rally till dark – now we teach her when to end it.',
    'Nothing rushes her. Next she needs a way to hurt you.',
    'Every ball comes back – opponents beat themselves against her.',
    'Defense first, always – the finishing shot is next.',
  ],
  'serve-first': [
    'That serve is ahead of her age – free points are a career.',
    'She holds serve in her sleep – now we break the return open.',
    'Big first ball, calm eyes. The second serve is the growth area.',
    'On serve she fears no one. Rally tennis is the homework.',
    'Aces buy her time – we spend it teaching the rest of the court.',
  ],
  'all-court': [
    'No holes in her game. Now we find the weapon.',
    'She can play every style – picking one under pressure is the skill.',
    'Comfortable everywhere, dangerous nowhere yet. That changes this year.',
    'She reads the game beautifully – now the hands must catch up.',
    'Versatile and calm. We are hunting for the shot that ends points.',
  ],
}
const coachQuote = computed(() =>
  game.snapshot ? COACH_QUOTES[game.snapshot.profile.playStyle][Math.floor(week.value / 4) % 5] : '',
)

/** ⭐ ROUND 24 #1 – the plain-language band, read off the engine's own note through the ONE splitter
 *  (`coachRoomBand`), never a second `indexOf` here. Empty before there is anything to say.
 *
 *  The owner asked for it twice. Round 23: «Давай как-то по-другому оформим подсказки про уровень
 *  девушки на карточке тренера. Может что-то вроде "она близка к своему потолку"…». It was built on
 *  the Coach Market screen, and round 24 came back with «Слова для тренеров о потолке девочки ты
 *  предложил, но в интерфейсе не поменял» – because THIS is the card he actually reads, every week,
 *  and its line was five canned quotes per play style that know nothing about her. */
const roomBand = computed(() => coachRoomBand(game.snapshot?.coachRoomNote ?? ''))


// --- Season strip: REAL tier progress. Reads the kid's best finish per tier off the snapshot: a
// reached tier shows the short finish label (W/F/SF/QF/R16…) in accent, an untouched one a muted
// dash. The strip is the whole nine-rung ladder. R10-7: the short names come from the ONE shared
// table, which the dynamic Next-week button also reads – so the strip and the button can never call
// the same tier two different things. This array only carries the LADDER ORDER.
//
// ⚠ THE ADULT RUNGS JOIN IT (task #17), spelled out here rather than folded into TIER_LADDER,
// because the list is deliberately hand-kept: this strip is a chip row on a phone, and the day
// somebody adds a rung the layout is a decision, not an automatic consequence. Their chips
// read `locked` for the whole junior half of a career, which is the truth and is the point of a
// ladder you can see the top of.
//
// ⚠ W2-LADDER: twelve chips, and the layout decision is TAKEN - the strip already wraps
// (.season-strip is flex-wrap), so the ladder reads as two lines on a phone rather than losing
// rungs. The feed's two-type rule (act2-pro-tour.md §4) governs the EVENT FEED, not this strip:
// this row is her whole climb at a glance, achievement plus the top she has not reached, and
// hiding outgrown rungs here would erase the finishes she earned on them.
//
// ⚠ W3-ACT2: SIXTEEN CHIPS, and the layout decision is taken the same way. The strip still wraps, so
// the ladder now reads as three lines on a phone - which is the honest picture of what the climb is
// and the whole argument for keeping the top of it visible from week one. The four act-3 chips read
// `locked` for almost every career that will ever exist; that is the point of a ladder you can see
// the top of, and it is the same reasoning the adult rungs joined under.
const SEASON_STRIP_TIERS: { id: TierId; short: string }[] = (
  [
    'local', 'regional', 'national', 'j30', 'j60', 'j300',
    'w15', 'w35', 'w50', 'w75', 'w100', 'wta125',
    'wta250', 'wta500', 'wta1000', 'slam',
  ] as const
).map((id) => ({ id, short: TIER_SHORT[id] }))
// finish index -> short label (reuses the finish-index convention: 0 = champion).
function shortFinish(finish: number): string {
  if (finish === 0) return 'W'
  if (finish === 1) return 'F'
  if (finish === 2) return 'SF'
  if (finish === 3) return 'QF'
  return `R${2 ** finish}`
}
// R11-5a – the AVAILABILITY half of the chip is decided by the shared rule in
// composables/tierState.ts (the same one the Season screen reads, so the two can never disagree),
// and this file only composes it with her ACHIEVEMENT – the best finish she has on the books for
// that tier. Nothing about a band or a threshold is re-derived here.
type TierChipState = 'locked' | 'outgrown' | 'unlocked' | 'waiting' | 'reached' | 'idle'
interface TierChip {
  id: TierId
  short: string
  label: string
  state: TierChipState
  title: string
  /** ⚠ THE SPOKEN NAME WHEN IT MUST NOT BE THE VISIBLE ONE (16.08). Set only by the capped arm
   *  below, where the strip's label is abbreviated for width and the full sentence – the one that
   *  NAMES THE RULE, per the owner's transparency ruling – has to survive into the accessible name.
   *  Same trick `locked` already plays by reading `title`, and for the same reason. */
  spoken?: string
}
const tierStates = useTierStates()
const seasonChips = computed<TierChip[]>(() =>
  SEASON_STRIP_TIERS.map(({ id, short }) => {
    // By ID, not by index (W2-LADDER): the old `tierStates.value[i]` zip silently assumed this
    // hand-kept list and TIER_LADDER agree position by position - true for one release and a trap
    // for ever. useTierStates is TIER_LADDER-ordered; the find makes the join explicit and total.
    const avail = tierStates.value.find((s) => s.id === id)!
    const best = game.snapshot?.bestFinishByTier[id]
    // Her earned result outranks every open state: once a tier is on the books the chip's job is to
    // show the finish, and the availability lives in the tooltip.
    const reached = isTierOpen(avail) && best !== undefined
    // ⚠ 'outgrown' IS NO LONGER A `kind` FOR A REAL SNAPSHOT (06.08, docs/specs/
    // ladder-floor-2026-08.md): the lower bound stopped refusing, so a rung she has passed comes
    // back 'scheduled'/'unscheduled' WITH the `outgrown` flag set. The kind arm stays for the pure
    // callers that pass no oracle - both readings mean the same thing to this chip, and reading the
    // flag is what keeps the strip's «show the current window» rule (below) working now that the
    // engine holds the rungs beneath her open.
    const past = avail.outgrown === true || avail.kind === 'outgrown'
    const state: TierChipState =
      avail.kind === 'age-locked' || avail.kind === 'locked'
        ? 'locked'
        : past
          ? 'outgrown'
          : reached
            ? 'reached'
            : // 'capped' rides the SAME chip state as 'unscheduled', and deliberately so: both mean
              // "not this week, and not because anything is wrong" – a tier she has every right to
              // that simply is not available to her yet. The padlock would be a lie (the allowance
              // returns when the season turns) and 'unlocked' would be worse still, inviting her to
              // "enter your first!" an event the engine will refuse.
              avail.kind === 'unscheduled' || avail.kind === 'capped'
              ? 'waiting'
              : 'unlocked'
    // Narrowed HERE rather than inside the label chain: `state` is computed above, so a check on it
    // cannot narrow `avail`, and only the discriminant can. Undefined on every other kind.
    const cappedSpend = avail.kind === 'capped' ? avail.entryCap : undefined
    const label =
      state === 'locked'
        ? `🔒 ${avail.note}`
        : state === 'reached'
          ? shortFinish(best!)
          : state === 'outgrown'
            ? (best !== undefined ? shortFinish(best) : avail.note)
            : // ⚠⚠ THE CAPPED CHIP IS ABBREVIATED HERE AND NOWHERE ELSE, AND IT IS A PHONE
              // MEASUREMENT (16.08). `tierState.ts` writes the cap's note as the sentence the Season
              // CARD needs – "Tour age rule – 10 of 10", "Year limit – 12 of 14" – and P2 made that
              // arm fire on W15 at fifteen, where it never could before (the rung opened at 16 and
              // the pro allowance started at 16 too). On the strip that sentence wraps: measured at
              // 375px, the Home season strip went 170px -> 178.28px and e2e/responsive.spec.ts went
              // red with its own warning that this row "wrapped to four rows once before and was
              // fixed to two".
              //
              // ⚠ AND NOTHING IS LOST, WHICH IS THE ONLY REASON THIS IS AN ABBREVIATION AND NOT A
              // DELETION. The rule's name survives in two places a player actually reads it: the
              // tooltip (`title`, unchanged) and the ACCESSIBLE NAME (`spoken`, below), so a screen
              // reader hears the whole sentence rather than a bare count. The Season card, which has
              // the width, still prints it in full. What the strip loses is a repetition of the
              // rule's name in a five-chip row that already colours the state.
              state === 'waiting' && cappedSpend !== undefined
              ? `Used ${cappedSpend.used} of ${cappedSpend.limit}`
              : state === 'waiting'
                ? avail.note
                : // ⚠⚠ THE OWNER'S OWN STRING, ABBREVIATED ON THE STRIP ONLY, AND HE SHOULD BE TOLD
                  // (16.08). R8-8 §6 names it verbatim for this row - «renders in accent as "Unlocked
                  // – enter your first!"» (owner, 25.07) - so this is not a copy edit taken lightly.
                  //
                  // WHAT FORCED IT IS NOT THIS STRING, IT IS THAT THE ROW GAINED A CHIP. The strip
                  // shows «the current available window plus one upper unavailable level» (owner,
                  // 04.08); the junior-ladder wave opened W15 at fourteen, so the window now reaches
                  // W35 and the row carries FIVE rungs where it carried four. Measured at 375px:
                  // 148.9px -> 178.28px, one wrapped row, and e2e/responsive.spec.ts red on a ceiling
                  // whose own note says it "leaves ~21px of headroom ... less than one wrapped row of
                  // chips costs". At 28 characters this label is the widest thing in the row by a
                  // long way, and it is the only one with slack in it: the accent COLOUR already says
                  // unlocked, so the word was saying it twice.
                  //
                  // ⚠ NOTHING IS LOST ANYWHERE ELSE. The full sentence is still the tooltip and still
                  // the accessible name, and the Season card - which has the width - is untouched.
                  // The other two arms of this chain already do exactly this: `locked` shows
                  // "🔒 Opens at 16" and speaks its whole sentence, and `capped` was abbreviated the
                  // same way an hour ago. If he wants the full words back on the strip, the honest
                  // lever is the WINDOW rule rather than the copy - four chips fitted, five do not.
                  'Enter your first!'
    const title =
      state === 'reached'
        ? `Best ${short} finish · ${avail.title}`
        : state === 'outgrown'
          ? `Outgrown – her best ${short} result stays on the books`
          : avail.title
    return {
      id,
      short,
      label,
      state,
      title,
      // Only the abbreviated arm carries one; every other chip's visible label IS its name.
      // The two arms whose visible label was abbreviated for the row's width keep the whole sentence
      // here; every other chip's visible label IS its name.
      ...(state === 'waiting' && cappedSpend !== undefined ? { spoken: avail.note } : {}),
      ...(state === 'unlocked' ? { spoken: 'Unlocked – enter your first!' } : {}),
    }
  }),
)

// D6 – WHAT A CHIP SAYS WHEN NOBODY CAN SEE IT (a11y, docs/specs/e2e-coverage.md §12).
//
// A rung was a `<span class="pill tier-chip">` with a `title` tooltip: no role, no accessible name,
// and – the part that actually loses information – its STATE living entirely in a CSS class. Six
// states, six colours, and a screen reader hears the same six words whichever one is on. `title` is
// not a fix: it is a tooltip, it is not spoken by default, and it never reaches a touch device at
// all.
//
// So each chip becomes a named image (the label REPLACES the dense visual shorthand, which is the
// same contract the trophy cabinet's cells keep) and the label says the state out loud. Every arm
// below is built from what is already on the chip; nothing is re-derived and no new fact is
// invented. `locked` reads `title` rather than `label` on purpose - the visible label opens with a
// padlock emoji, and a spoken name that starts by pronouncing an emoji is not a sentence.
//
// ⚠ AND THE WORDS OF A POINT LOCK ARE STILL WRITTEN IN EXACTLY ONE PLACE - composables/tierState.ts.
// tests/round11-view.test.ts guards that with a plain substring search over this whole file, which
// has no parser and cannot tell code from prose: this comment quoted an example lock label and the
// guard went red over a sentence. It was right to. Same family as the no-curly-brace note on
// `.stop-toast` in src/style.css - do not quote a lock's copy here, not even as an example.
function chipName(chip: TierChip): string {
  switch (chip.state) {
    case 'reached':
      return `${chip.short}: reached, best finish ${chip.label}`
    case 'outgrown':
      return `${chip.short}: outgrown – ${chip.label}`
    case 'locked':
      return `${chip.short}: locked – ${chip.title}`
    case 'waiting':
      // `spoken` when the visible label was abbreviated for the strip's width - see the capped arm
      // in `seasonChips`. Everywhere else the label is the name, unchanged.
      return `${chip.short}: open – ${chip.spoken ?? chip.label}`
    default:
      return `${chip.short}: ${chip.spoken ?? chip.label}`
  }
}

// --- THE STRIP ONLY SHOWS THE RUNGS THAT ARE ABOUT HER (owner, 04.08) --------------------------
//
// «На домашнем экране давай из раздела season убирать j серию, когда переросла. Вообще для экономии
// места в этом блоке предлагаю показать текущее доступное окно турниров как раз плюс один верхний
// недоступный уровень, а нижние недоступные можно за иконкой многоточия скрывать, они не нужны же.
// И места кучу сэкономим.»
//
// ⚠ THIS OVERRULES THE ⚠ TWO NOTES ABOVE `SEASON_STRIP_TIERS` ("twelve chips ... this row is her
// whole climb at a glance ... hiding outgrown rungs here would erase the finishes she earned on
// them"). The objection was right and it is ANSWERED rather than ignored: nothing is erased, the
// outgrown rungs are one tap behind the ellipsis with their finishes intact. What the owner is
// reporting is that on a phone twelve chips wrap to three lines, and eleven of them are answering a
// question he stopped asking - which is exactly what the sliding window was introduced to fix one
// storey down, in the event feed.
//
// ⚠⚠ AND THE WINDOW IS ASKED, NEVER RE-DERIVED. `feedContext` is the ONE reader of the engine's
// per-rung verdict (`Snapshot.tierOpen`, computed by `tierOpenFor` / `tierOutgrown` in
// engine/world/ladder.ts), already shared by the Season feed and the Calendar look-ahead; this strip
// becomes its third consumer rather than its second definition. Re-deriving "which rungs are open"
// in the UI has been the bug twice (tierState.ts's `engineOpen` header records both), and
// `tierOpen` absent -> `feedContext` returns the whole ladder, which is the safe direction and makes
// an old fixture render exactly as it did before.
//
// WHAT IS ON SCREEN, then: the window, plus ONE rung above it (the aspiration - «плюс один верхний
// недоступный уровень»). Everything else - the rungs she has outgrown below, and the far top of the
// ladder above - sits behind an ellipsis chip that expands the row in place.
const stripExpanded = ref(false)
// ⚠ `.working`, NOT `.rungs`, SINCE 06.08 – and the strip is the reason the two exist. The lower
// bound stopped refusing (docs/specs/ladder-floor-2026-08.md), so `tierOpen` is now true for every
// rung she has ever reached and `.rungs` would put the whole climb back on screen: exactly the
// twelve chips over three lines the collapse below was built to end. The FEED wants `.rungs` (a week
// whose only event is beneath her is still a week she can play); this row wants the rungs her career
// is about. Still asked, still never re-derived.
const windowRungs = computed<readonly TierId[]>(
  () =>
    feedContext({
      ageYears: game.snapshot?.ageYears ?? 0,
      tierOpen: game.snapshot?.tierOpen,
      tierOutgrown: game.snapshot?.tierOutgrown,
      // round-21 #5: and the table she has LEFT drops out of the strip too. The hole this row's own
      // note describes ("at nineteen ... the domestic three never close again") is closed at the
      // source now instead of only being hidden behind the ellipsis - `paysIntoHerTables`.
      activeLadder: game.snapshot?.activeLadder,
      upcoming: game.snapshot?.upcoming ?? [],
    }).working,
)
/**
 * WHICH INDICES OF `SEASON_STRIP_TIERS` ARE ON SCREEN – the open rungs THEMSELVES, plus the one rung
 * directly above the highest of them. A SET, never a span.
 *
 * ⚠ THIS IS THE BUG THE OWNER RE-REPORTED (05.08: «я просил спрятать вообще всё неактуальное кроме
 * смежных турниров за точечки, эта штука очень много места на экране занимает» – beside three
 * circled junior rungs). The collapse shipped, and then did nothing on the screen he was looking at,
 * because it was written as `[firstOpen, lastOpen + 1]` and FILLED that range. The comment under it
 * claimed the window is "contiguous in ladder order by construction" and treated a non-contiguous
 * verdict as a case that merely "widens the span instead of dropping a rung out of the middle".
 *
 * The window is NOT contiguous once she ages out of the Junior Tour, and this is the engine working
 * as written rather than a fault to fix one storey down. `tierOutgrown` closes a rung when the rung
 * THREE ABOVE it opens, and it carries an age clause – «a door she cannot open yet cannot close the
 * one behind her» (engine/world/ladder.ts). At nineteen the three rungs above Local, Regional and
 * National are J30, J60 and J300, all of them shut on age for ever, so the domestic three never
 * close again. The engine therefore holds {local, regional, national} open BESIDE {w50, w75, w100},
 * with five dead rungs in the hole between them – and the span-fill dutifully printed all five.
 * That is his screenshot: twelve chips, three of them the junior rungs he circled.
 *
 * So the row is built from the set, and the hole is where the ellipsis goes. Nothing is re-derived:
 * `windowRungs` is still the engine's verdict, verbatim, and this only stops widening it.
 */
/** ⭐⭐ FOUR, AND IT IS MEASURED IN A REAL BROWSER RATHER THAN CHOSEN (16.08). `tools/strip-wrap-probe.mjs`
 *  serves this worktree, renders the strip's own markup against the app's real stylesheet and real
 *  self-hosted faces in Chromium, and reads the boxes off it. The container is **315px** at a 375px
 *  viewport (375 - 2x16 `--app-pad-x` on `#app` - 2x14 the Card's own padding; `.app-content` adds
 *  none), and the row it has to hold is the e2e `junior` fixture's: age 15, week 120, window
 *  {j30, j60, j300, w15, w35} with W50 as the aspiration.
 *
 *      cap 5   4 rows at 315px      J60 · J300 · W15 · W35 · W50
 *      cap 4   3 rows at 315px            J300 · W15 · W35 · W50      <- shipped
 *      cap 3   3 rows                            W15 · W35 · W50
 *
 *  ⚠ FIVE WAS THE FIRST ANSWER AND IT WAS NOT ENOUGH, which is the record worth keeping. Its note
 *  read *"FIVE, and it is the width the phone actually has ... five rungs plus their arrows and both
 *  ellipses sit inside the two rows e2e/responsive.spec.ts pins (148.9px of a 170 ceiling); six wrap
 *  to three and cost 178.28."* The row stayed at 178.28 with the cap on. One chip row is **29.4px**
 *  (= 178.28 - 148.9, the spec's own two numbers), the overshoot is 8.28px, so exactly one row has to
 *  go – and cap 4 is the smallest change that removes exactly one at every width the card can be.
 *
 *  ⚠⚠ AND THE AGE-GRID RULING DID NOT DO IT, WHICH WAS THE HYPOTHESIS AND IS NOW MEASURED. Two of the
 *  five chips read "🔒 Opens at 16" and the owner's ruling of 16.08 opened those rungs at 14, so the
 *  expectation was that the row would shrink. It does not: W35 goes from a 14-character lock to
 *  "Used 10 of 10" (13) and W50 goes from the same lock to "🔒 Opens in the top 330" (23), a net +8
 *  characters. Swept 240-375px, the new labels give the SAME row count at 114 of 136 widths, one
 *  fewer at 301-307 and one MORE at 240-254 – and at the 315px this card actually has, identical.
 *  The lock labels were never the cause; the fifth chip is.
 *
 *  ⚠ THE CEILING IS NOT THE LEVER. 170 leaves ~21px of headroom by its own note, less than one
 *  wrapped row costs, and raising it would retire the only thing that has ever caught this row. */
const STRIP_MAX_RUNGS = 4

const stripVisible = computed<readonly number[]>(() => {
  const last = SEASON_STRIP_TIERS.length - 1
  if (stripExpanded.value) return SEASON_STRIP_TIERS.map((_, i) => i)
  // ⚠⚠ AND THE WINDOW IS THE ENGINE'S, WHOLE – AN AGE FILTER WAS TRIED HERE AND WITHDRAWN (16.08).
  // For a few hours this line also dropped any rung whose chip read `locked`, on the argument that
  // the owner's window rule says AVAILABLE and a rung that refuses her on age is not available.
  // Two things retired it, and both are worth keeping.
  //
  //   1. IT WAS A SECOND OPINION ABOUT THE LADDER, held in one component. The window's own verdict
  //      is a FLOOR asked of her RANK; the age gate is a separate refusal, decided engine-side and
  //      arriving here already folded into the chip's state. A component that drops rungs on the
  //      second verdict is answering "which rungs are open" for itself, which is the bug this row's
  //      own header records twice. The Season feed and the Calendar would have kept reading the
  //      other answer.
  //   2. AND THE STATE IT WAS BUILT FOR NO LONGER EXISTS. It was aimed at a fifteen-year-old whose
  //      rank cleared W35's list a year before the rung's floor would admit her – and the owner's
  //      age-grid ruling of 16.08 put the professional floors on the regulation's own two numbers,
  //      so the two verdicts stopped disagreeing on this row at all. The filter would now be dead
  //      code that still looked like a rule.
  //
  // ⚠ THE PREDICATE IS DELIBERATELY NOT NAMED IN THIS PARAGRAPH: `tests/round11-view.test.ts` greps
  // this whole file for the band-deriving symbols and has no parser, so quoting one in prose turns a
  // comment into a violation. It went red on the very paragraph this replaces, and it was right to.
  //
  // What holds the row to a phone instead is `STRIP_MAX_RUNGS`, above, which is measured.
  const open = SEASON_STRIP_TIERS.map((t, i) => (windowRungs.value.includes(t.id) ? i : -1)).filter((i) => i >= 0)
  // Nothing open at all is not a state the engine produces, and if it ever did, a row with one
  // ellipsis and no rungs would be worse than the old sixteen. Show everything.
  if (!open.length) return SEASON_STRIP_TIERS.map((_, i) => i)
  // ...plus ONE rung above the top of the window - «плюс один верхний недоступный уровень». It is
  // the rung whose unlock condition is the goal text ("Opens in the top 250"), which is the one
  // sentence that makes the ladder legible; the rungs above THAT are years away and cost a line each.
  const aspiration = Math.min(open[open.length - 1] + 1, last)
  const row = open.includes(aspiration) ? open : [...open, aspiration]
  // ⚠⚠ AND THE ROW HAS A HARD WIDTH, WHICH IS A MEASUREMENT AND NOT A TASTE (16.08). The window is
  // the ENGINE's and this does not second-guess it: `tierOpen` is a FLOOR – "has she reached this
  // rung", asked of her rank alone – so a rung can enter the window a year before its own age gate
  // will admit her, and the Accelerator correction made that ordinary rather than rare. On a fifteen-
  // year-old the row reached SIX rungs (two of them locked, one of them only the aspiration), and
  // e2e/responsive.spec.ts went red at 375px: 178.28 against a 170 ceiling whose own note says it
  // leaves ~21px of headroom, "less than one wrapped row of chips costs".
  //
  // ⚠ TRIMMED FROM THE BOTTOM, and the leading ellipsis already covers what goes: the rungs nearest
  // her level are the ones she is choosing between this week, and the ones below are the climb she
  // has already made. Nothing is deleted – tapping any ellipsis still expands the whole ladder in
  // place, which is the property the mounted suite pins.
  //
  // ⚠ WHY A CAP AND NOT AN AGE FILTER is the paragraph above `const open`, which is where the filter
  // was tried and withdrawn.
  //
  // ⚠ AND IT DOES NOT APPLY TO THE NO-VERDICT FALLBACK, which is the same exception the branch above
  // makes and for the same reason. `tierOpen` absent means an old save or a hand-built fixture, and
  // `feedContext` answers by returning the WHOLE ladder – the safe direction, pinned by two mounted
  // tests. Trimming that to four would turn "we do not know, so show everything" into "we know it is
  // these four", which is the one reading the fallback exists to avoid.
  //
  // ⚠⚠ BUT THE HATCH IS KEYED ON THE COUNT RATHER THAN ON THE ABSENT VERDICT, so a career that
  // genuinely opened every rung would skip the cap too. `tierOutgrown` closes the rungs beneath her,
  // so that state is not reachable today; it is flagged for the owner in
  // docs/specs/college-is-its-own-branch-2026-08.md §7b and named by a mounted test rather than
  // half-fixed here, because tightening it means deciding what "no verdict" is allowed to mean.
  const everyRung = open.length === SEASON_STRIP_TIERS.length
  return !everyRung && row.length > STRIP_MAX_RUNGS ? row.slice(row.length - STRIP_MAX_RUNGS) : row
})

/** One cell of the rendered row: either a rung, or the ellipsis standing in for a stretch of them.
 *  The gap's two sentences are built in the script rather than in the template, because both have to
 *  count: "1 levels" is the kind of thing that ships and then reads as a bug to the one player using
 *  a screen reader, which is the surface `aria-label` exists for. */
type StripCell =
  | { kind: 'rung'; key: string; chip: TierChip }
  | { kind: 'gap'; key: string; hidden: number; label: string; title: string }

/**
 * THE ROW, WITH THE ELLIPSIS WHERE THE LADDER SKIPS. A gap cell is emitted for every run of hidden
 * rungs – before the first visible one, between any two non-adjacent visible ones, and after the
 * last – so the affordance sits exactly where the elision is, the way a paginator's does. Each one
 * carries its own count, because "…" that hides eleven rungs and "…" that hides one are different
 * promises and the player is entitled to know which one he is tapping.
 */
const stripCells = computed<StripCell[]>(() => {
  const cells: StripCell[] = []
  const vis = stripVisible.value
  const last = SEASON_STRIP_TIERS.length - 1
  const gapFrom = (lo: number, hi: number): StripCell => {
    const hidden = hi - lo + 1
    const noun = hidden === 1 ? 'level' : 'levels'
    // The RANGE in the tooltip, so the affordance says what is behind it rather than only how much:
    // "5 levels hidden (National to W15)" is a different offer from the same count at the top of the
    // ladder, and a player deciding whether to tap wants the names.
    const span = hidden === 1 ? SEASON_STRIP_TIERS[lo].short : `${SEASON_STRIP_TIERS[lo].short} to ${SEASON_STRIP_TIERS[hi].short}`
    return {
      kind: 'gap',
      key: `gap-${lo}`,
      hidden,
      label: `Show ${hidden} more ${noun}`,
      title: `${hidden} ${noun} hidden (${span}) – tap to show the whole ladder`,
    }
  }
  let prev = -1
  for (const i of vis) {
    if (i - prev > 1) cells.push(gapFrom(prev + 1, i - 1))
    cells.push({ kind: 'rung', key: seasonChips.value[i].id, chip: seasonChips.value[i] })
    prev = i
  }
  if (prev < last) cells.push(gapFrom(prev + 1, last))
  return cells
})

// --- News: structured events (Package M), non-financial types only (expense/income live on the
// Money ledger). Strictly newest-first: most recent week first, and within a week newest event
// first (descending id). Milestones stay pinned to the top of their week group.
const kidShort = computed(() => {
  const p = game.snapshot?.profile
  return p ? formatShortName(`${p.kidName} ${p.kidLastName}`) : ''
})
function oppShort(m: WorldMatch): string {
  return formatShortName(m.oppName)
}
function kidScoreOf(m: WorldMatch): string {
  if (!m.score) return ''
  return m.bId === KID_ID ? flipScore(m.score) : m.score
}
const EVENT_EMOJI: Record<string, string> = {
  info: '💬',
  entry: '📝',
  match: '🎾',
  tournament: '🏁',
  milestone: '🏆',
  injury: '🩹',
  recovery: '💪',
}
interface NewsGroup {
  week: number
  events: WorldEvent[]
}
const newsGroups = computed<NewsGroup[]>(() => {
  const events = (game.snapshot?.events ?? []).filter((e) => e.type !== 'expense' && e.type !== 'income')
  const byWeek = new Map<number, WorldEvent[]>()
  for (const e of events) {
    const list = byWeek.get(e.week)
    if (list) list.push(e)
    else byWeek.set(e.week, [e])
  }
  return [...byWeek.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([week, list]) => ({
      week,
      events: [...list].sort((a, b) => {
        const am = a.type === 'milestone' ? 0 : 1
        const bm = b.type === 'milestone' ? 0 : 1
        return am - bm || b.id - a.id // milestones pinned first, then newest-first
      }),
    }))
})

// --- Click a match event -> replay it in the shared MatchReplay overlay ---------
const replayMatch = ref<WorldMatch | null>(null)
function openReplay(e: WorldEvent): void {
  if (e.match) replayMatch.value = e.match
}

// --- Best-6 help popover (round-6): the owner got confused twice by the windowed ranking, so the
// rank chip itself opens a plain explanation (RankHelpDialog). The redesign folded the separate "?"
// button into the chip – one affordance where there used to be two.
const showRankHelp = ref(false)
function openRankHelp(): void {
  playSfx('clickSoft')
  showRankHelp.value = true
}

// =================================================================================================
// ⭐⭐ ROUND 24 #2b / #3 – A COLLEGE WEEK IS A WEEK, AND IT HAPPENS HERE
// =================================================================================================
//
// The owner, 20.08: «После выбора колледжа показывают фотоальбом как будто карьера закончилась» and
// «Весь флоу колледжа перенести на домашний экран… или отдельный параллельный полноэкранный».
//
// ⚠ THE CHEAPER OF HIS TWO SHAPES IS THE RIGHT ONE, and this is it. Home already has a week, a
// bottom control, a photograph and a news feed; a college week is a week with different content. A
// second full-screen flow would duplicate all four and then have to be kept in step with them – the
// DRY problem this project has spent two rounds removing.
//
// ⚠ WHY THE PREDICATE IS THE ENDING AND NOT `snapshot.inCollege`. Both are true through the freeze,
// but they answer different questions: `inCollege` is "is she at a university this week" (it is what
// the tick reads to charge the bill and to skip the sponsors), while THIS is "is the shell being
// replaced by an epilogue". `ending.college` is the OPEN QUESTION's own view – it is non-null
// exactly while the latch is on AND she has not left – so the screen that answers the question and
// the flag that raises it cannot come apart. It also fails SAFE: a career that gets a real ending
// mid-freeze (a career-ending injury; she is playing a lot of tennis) has `college` null on its
// ending view, this returns false, and App.vue hands it to the epilogue, which is correct.
const collegeWeek = computed(
  () => game.snapshot?.ending?.ending.type === 'college' && game.snapshot.ending.college !== null,
)
const collegeProgress = computed(() => game.snapshot?.ending?.college ?? null)

/** «Play the first year» / «Another year» – the same two words the epilogue's card used, off the
 *  engine's own count.
 *
 *  ⭐ ROUND 24, THE BIRTHDAY: «Finish the year» while one is paused mid-flight. Her birthday stops
 *  the college year (`resumeFromCollege` breaks on the birthday week so the gift dialog can be
 *  answered), and the press after the cake continues THAT year – a button still reading «Another
 *  year» there would be offering a year it is not going to start. `yearInProgress` is the engine's
 *  own fact (`college.pendingYearStart`), so this label and the year the press spends cannot part. */
const collegeYearLabel = computed(() =>
  collegeProgress.value?.yearInProgress
    ? 'Finish the year'
    : (collegeProgress.value?.yearsDone ?? 0) === 0
      ? 'Play the first year'
      : 'Another year',
)

/** She may only leave a year she has actually spent. The engine refuses it too (`endCollegeEarly`
 *  throws on a career with no banked year) – this is the screen agreeing with the rule rather than
 *  being the rule (CLAUDE.md invariant 1).
 *
 *  ⭐ ROUND 24: ...and never mid-year. The birthday pause created the first mid-year rest state, and
 *  the early return is answered at year boundaries – the engine refuses it there too (`The year she
 *  started is still running`), so this is again the screen agreeing rather than deciding. */
const canLeaveCollege = computed(
  () => (collegeProgress.value?.yearsDone ?? 0) > 0 && !collegeProgress.value?.yearInProgress,
)

/** ⚠ THE TWO ANSWERS ARE THE BOTTOM CONTROL, and that placement is the item rather than a detail.
 *  They are where a week is spent on every other week of the game, they are two buttons of ONE
 *  WEIGHT sharing one class (ruling 4, 30.07: «a CTA pill beside a text link is an opinion in a
 *  different font»), and putting them here is what lets the card above be a pure report. */
async function resumeCollege(): Promise<void> {
  await game.resumeFromCollege()
}
async function leaveCollege(): Promise<void> {
  await game.endCollegeEarly()
}
</script>

<template>
  <template v-if="game.snapshot">
    <p v-if="game.error" class="error">{{ game.error }}</p>

    <!-- U0: the page's vertical stack is ScreenShell now. Home used a hand-rolled `.diary` wrapper
         that did exactly what the shell's body does (a flex column), so the class is gone rather
         than kept as a synonym. The shell does NOT take the side gutter here – see ScreenShell. -->
    <ScreenShell>
      <!-- 1 + 2. THE HERO. Full-bleed, and it carries the header: the photograph IS the top of the
           page, not a picture placed on it. Two scrims do the work – one darkens the top so the
           date and the icons read over any of the 35 paintings, one takes the picture down into the
           page colour so there is no bottom edge at all. -->
      <div class="diary-hero" data-tour="home-header">
        <img class="diary-hero-img" :src="portraitUrl" :style="photoStyle" alt="" />
        <div class="diary-hero-top"></div>
        <!-- A2 (owner, 28.07): the identity block runs down the LEFT of the painting, well past
             the top scrim, and on a sunlit court it stopped being readable. This third scrim
             darkens the left edge only – her face sits centre-right in all 35 paintings, so it
             never touches her. -->
        <div class="diary-hero-left"></div>
        <div class="diary-hero-fade"></div>

        <!-- v48: CONFETTI ON HER BIRTHDAY WEEK, the owner's own suggestion (docs/specs/
             birthday-and-gifts.md §3). Over the scrims and under the header, so it falls across the
             painting rather than across the date; `.diary-hero` is already `position: relative` and
             `overflow: hidden`, so the burst is clipped to the square with no new positioning
             context. Gated on `birthdayAge`, the SAME fact the diary's own birthday lines license
             off, so the picture and the words can never disagree about whose week this is. -->
        <ConfettiBurst v-if="birthdayWeek" class="diary-hero-confetti" />

        <header class="diary-head">
          <!-- A2: the app header is gone; its avatar lives here, left of the date, and is still the
               door to her profile. The crop stays F45-1's age-only `norm` – chrome, not an
               emotional surface; the emotion belongs to the big painting behind it. -->
          <button
            class="diary-avatar-btn"
            data-tour="kid-avatar"
            aria-label="Open her profile"
            @click="openKid"
          >
            <img class="diary-avatar" :src="headerAvatarUrl" alt="" />
          </button>
          <!-- OWNER'S RULING over the export, which prints a plain calendar date here: our week
               label with the year in full, then the week's real days. shared/dates.ts owns it.

               D10 – IT IS THE PAGE'S HEADING AND IT HAD NO ROLE. This string is the most-asserted
               one in the whole product ("W18 2033 · May 2 – May 8") and every test that wanted it
               had to fall back to `getByText`, because a diary page whose subject is a WEEK carried
               its subject in a bare `<p>`. Home has no other level-1 heading, and this is what a
               diary entry is headed by, so that is the level.

               ⚠ `role`/`aria-level` ON THE `<p>` RATHER THAN AN `<h1>` ELEMENT, and that is the one
               decision here: `.diary-date` is laid over the photograph with its own size, weight and
               shadow, and a real `<h1>` would arrive carrying the browser's own font-size and
               margins. Same semantics, and not one pixel moves. -->
          <p class="diary-date" role="heading" aria-level="1">{{ dateLine }}</p>
          <div class="diary-tools">
            <!-- ⚠ D15 (docs/specs/e2e-coverage.md §12) – THE TWO DOTS ON THIS HEADER, AS WORDS. Both
                 were `<span class="diary-tool-dot"></span>`: no role, no text, no label, so the app's
                 two unread markers were invisible to a screen reader AND to the e2e level, which is
                 why `sponsor-inbox.spec.ts` can assert that signing empties the letter table but not
                 that the marker goes out - the fact a player actually navigates by.
                 It is D7's fix, one screen over, applied verbatim: the dot is a named `role="img"`
                 handed to the button as its DESCRIPTION, never as part of its name. Both buttons
                 already carry an explicit `aria-label`, so a dot arriving cannot rename them - which
                 is the half of D7 that mattered and is free here. -->
            <button
              class="diary-tool"
              data-tour="home-news"
              aria-label="Go to the news feed"
              title="News"
              :aria-describedby="newsUnseen ? 'diary-dot-news' : undefined"
              @click="jumpToNews"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.7 21a2 2 0 0 1-3.4 0"></path>
              </svg>
              <!-- It goes out when the bell is tapped - see `newsUnseen` in the script for the
                   ruling and for what the dot used to assert instead. -->
              <span
                v-if="newsUnseen"
                id="diary-dot-news"
                class="diary-tool-dot"
                role="img"
                aria-label="Unread news"
              ></span>
            </button>
            <!-- THE INBOX. An envelope at the export's own 22px / 1.7 stroke, inline like the bell,
                 so nothing can 404 and nothing needs a mask. Its dot is the engine's open-offer fact
                 OR an unopened arrival - see the note beside `inboxDot` in the script for why one
                 marker now answers two questions, and how each of them goes out. -->
            <button
              class="diary-tool"
              aria-label="Open the inbox"
              title="Inbox"
              :aria-describedby="inboxDot ? 'diary-dot-inbox' : undefined"
              @click="openInbox"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="2.5" y="5" width="19" height="14" rx="2"></rect>
                <path d="M3 6.5 12 13l9-6.5"></path>
              </svg>
              <!-- ONE MARKER, TWO QUESTIONS, and the sentence says both – see `inboxDot` in the
                   script: an offer the engine is holding open, OR a letter that arrived unopened. -->
              <span
                v-if="inboxDot"
                id="diary-dot-inbox"
                class="diary-tool-dot"
                role="img"
                aria-label="A letter waiting on an answer"
              ></span>
            </button>
            <button class="diary-tool" data-tour="home-settings" aria-label="Settings" title="Settings" @click="emit('navigate', 'more')">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3.2"></circle>
                <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"></path>
              </svg>
            </button>
          </div>
        </header>

        <!-- R13-12's one-time callout, moved with the avatar it explains. Dismissed (and persisted
             per device, never in the save) by the first tap on either it or the avatar. -->
        <button v-if="showKidHint" class="diary-kid-hint" @click="openKid">
          Tap the photo – her page lives here
        </button>

        <div class="diary-id">
          <!-- The greeting is the ENGINE's word (morning before the week is played, evening once a
               tournament resolves) and it is never a second copy of the caption below. -->
          <p class="diary-greeting">{{ greeting }}</p>
          <p class="diary-name">{{ kidFirstName }}</p>
          <p class="diary-age">{{ ageYears }} years old {{ flag }}</p>
          <!-- The chip is drawn only once something counts somewhere - rankChipTrack owns the rule
               (null = no counting result in any table yet, and nothing to read on a chip). -->
          <button
            v-if="chipTrack !== null"
            class="diary-rank"
            aria-label="How ranking points work"
            :title="rankChipTitle"
            @click="openRankHelp"
          >
            <span class="rank-ladder">{{ ladderLabel }}</span>
            <span>{{ rankLabel(kidRank ?? 0, ranked) }}</span>
            <template v-if="ranked">
              <span v-if="rankMovement.dir === 'up'" class="rank-move up">&#8593;{{ rankMovement.by }}</span>
              <span v-else-if="rankMovement.dir === 'down'" class="rank-move down">&#8595;{{ rankMovement.by }}</span>
              <span v-else class="rank-move flat">–</span>
            </template>
          </button>
        </div>

        <!-- A2b (owner, 28.07): HER BODY MOVED ONTO THE PHOTOGRAPH. The bottom row of the hero is
             the caption chip and, to the right of it, the condition ring, which frees the whole
             strip under the picture for the cards.
             THE WHY LINES sit ABOVE the chip, and take its place entirely when there is no caption,
             so a warning is never the thing that goes missing on a quiet week. -->
        <div class="diary-state">
          <div v-if="conditionNote || strainNote" class="diary-notes">
            <!-- D1: one line of WHY, from real facts of the last tick (engine-licensed). -->
            <p v-if="conditionNote" class="condition-note">{{ conditionNote }}</p>
            <p v-if="strainNote" class="condition-note warn">{{ strainNote }}</p>
          </div>
          <div class="diary-state-row">
            <!-- THE CAPTION – the one phrase the parent wrote about her week, on a frosted chip. It
                 appears exactly once on this page. -->
            <div v-if="photoLine" class="diary-caption">
              <!-- The brand's own "i" – the dotted letter out of the wordmark, whose dot is the
                   ball. It marks the caption as the diary's voice; a plain lime dot said nothing. -->
              <img class="diary-caption-mark" :src="`${base}logo-i-light.svg`" alt="" />
              <p class="diary-caption-text">{{ photoLine }}</p>
            </div>
            <!-- THE CONDITION RING (U0's ProgressRing, 46px, r=19, 3px stroke). How far round the
                 arc travels is her condition, and its solid colour is that same number read on a
                 red-to-green ramp - OURS, which is why it is a prop and not a variant. The label
                 follows the export's Kid-screen pair: the figure at 15px/800 with the sign small
                 beside it at 10px/700, on one baseline, and in plain light ink - the ARC is what
                 carries the colour. `on-art` is the one thing this ring needs that Season's does
                 not: it sits on a photograph, so it brings its own shadow. -->
            <ProgressRing
              class="condition-ring"
              :value="condition / 100"
              :color="ringColor"
              :label="conditionAria"
              on-art
            />
          </div>
        </div>
      </div>

      <!-- ⭐⭐ 2b. THE COLLEGE YEAR – the week's content, on the weeks she is at a university. It sits
           immediately under her photograph, where the next-tournament card is the first thing read in
           an ordinary season, because on these weeks it IS the week. Drawn only while the college
           latch is on; every other week of every other career is byte-identical. -->
      <CollegeYearCard v-if="collegeWeek" />

      <!-- 3. THE CARD GRID – the visual signature. Two of the four are doors, and they say so by
           lifting under the finger; the two that are not, do not move. -->
      <div class="card-grid">
        <!-- NEXT TOURNAMENT -> the This-week screen (plan presets, planned spend, week recap).
             U0: `<Card as="button">` - the ELEMENT is still what says "this is a door", which is
             what keeps the lift, the keyboard reach and the focus ring free of any new prop. -->
        <Card
          as="button"
          class="note-card"
          data-tour="next-tournament"
          @click="emit('navigate', 'week')"
        >
          <Eyebrow>Next tournament</Eyebrow>
          <span v-if="recapFresh" class="note-dot" title="A new week recap is waiting"></span>
          <template v-if="nearestEntered">
            <!-- The painted venue, bleeding off the corner under a diagonal dissolve. -->
            <div class="venue-art">
              <img :src="nextVenue" alt="" />
            </div>
            <p class="note-title">{{ nearestEntered.label }}</p>
            <!-- The TIER is not repeated here: the tournament's own name above it already says
                 "Regional Championship" (owner, 28.07). Surface, then dates - the export's order. -->
            <p class="note-meta">
              <span>{{ nearestEntered.surface }}</span>
              <span>{{ nextDates }}</span>
            </p>
            <div class="note-foot">
              <p class="note-foot-label">Travel budget</p>
              <p class="note-figure">{{ nextTravel }}</p>
            </div>
          </template>
          <!-- ⚠ AND A COLLEGE WEEK SAYS WHY IT IS EMPTY. «Nothing entered yet – the calendar is on
               the Season tab» is a nudge to go and enter something, and at college that is a door
               into a refusal: the tour writes to nobody on a scholarship, and every entry command is
               engine-refused while the latch is on. The card states the rule instead of inviting a
               dead click. -->
          <p v-else-if="collegeWeek" class="note-empty">
            No tour entries while the scholarship runs – she plays for the programme.
          </p>
          <p v-else class="note-empty">Nothing entered yet – the calendar is on the Season tab.</p>
        </Card>

        <!-- FAMILY BUDGET -> the wallet. OWNER'S RULING over the export, which shows this week's
             income/spent rows: the current TOTAL, plus income and spending over the last 12 weeks. -->
        <Card as="button" class="note-card" data-tour="family-budget" @click="emit('navigate', 'money')">
          <Eyebrow>Family budget</Eyebrow>
          <p class="budget-total" :class="{ negative: fundsCents < 0 }">{{ funds }}</p>
          <div class="budget-rule"></div>
          <p class="budget-window">Last 12 weeks</p>
          <!-- ONE BOX for the line and the dots. They must share geometry exactly, and the card is
               not that box: `.note-card` is padded 14px, so a dot layer positioned against the CARD
               is 28px wider than the chart and starts 14px to its left - which is precisely how the
               dots ended up beside the line instead of on it. -->
          <div v-if="budgetChart.any" class="budget-chart-wrap">
          <svg
            class="budget-chart"
            :viewBox="`0 0 ${CHART_W} ${CHART_H}`"
            preserveAspectRatio="none"
            role="img"
            aria-label="The family balance over the last 12 weeks"
          >
            <defs>
              <linearGradient id="tb-spark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.42" />
                <stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
              </linearGradient>
            </defs>
            <path class="budget-area" :d="budgetChart.area" fill="url(#tb-spark)" />
            <polyline class="budget-line" :points="budgetChart.line" />
          </svg>
          <!-- THE DOTS LEFT THE SVG (owner, 29.07: "the dots stretched, make them round again").
               The chart is drawn with preserveAspectRatio="none" so one lime stroke fills whatever
               width the card has - which is right for a sparkline and fatal for a circle: the
               viewBox is 146x46 inside a box 66px tall, so every `r` came out an egg. Positioning
               the dots in PERCENT of the same box puts them exactly where the polyline's vertices
               are, and a CSS circle cannot be stretched by an SVG scale it is not inside. -->
          <span class="budget-dots" aria-hidden="true">
            <i
              v-for="(dot, i) in budgetChart.dots"
              :key="i"
              :class="`budget-dot ${dot.tone}`"
              :style="{ left: `${(dot.x / CHART_W) * 100}%`, top: `${(dot.y / CHART_H) * 100}%` }"
            ></i>
          </span>
          </div>
          <p v-else class="note-empty">Nothing has moved yet.</p>
        </Card>

        <!-- COACH NOTE. The export's own layout: his portrait down the left edge, his read on her
             beside it.
             R3: and it is a DOOR into the Coach Market. `button.note-card` is the app's own "this is
             a door" affordance (the lift on hover/focus), so it arrives keyboard-reachable and
             focus-visible for free - no new pattern, and no price on the card: what changed is that
             it can be opened, not what it says. -->
        <Card
          as="button"
          class="note-card card-short coach-card"
          aria-label="Coach note - open the Coach Market"
          @click="emit('navigate', 'market')"
        >
          <div class="coach-art">
            <img :src="coachPhoto" alt="" />
          </div>
          <div class="coach-body">
            <Eyebrow>Coach note</Eyebrow>
            <p class="coach-line">{{ coachQuote }}</p>
            <!-- ⭐⭐ ROUND 24 #1 – WHERE SHE ACTUALLY STANDS, ON THE CARD HE SEES EVERY WEEK. Round 23
                 #1 asked for a plain reading of her level on the coach card; it landed on the Coach
                 MARKET screen instead - a page he opens rarely - so his verdict was exact. THIS is
                 the coach card. His words are quoted beside `roomBand` in the script, because
                 Cyrillic inside a <template> is forbidden (tests/round13-nav.test.ts).
                 ⚠ THE QUOTE ABOVE IS NOT REPLACED. It is owner-approved copy from round 7 #5d, five
                 lines per play style settling every four weeks, and it is his COACH's voice. This is
                 a second, shorter line under it: the voice keeps saying what it says, and the card
                 now also says the one thing the player was asking it for.
                 ⚠ The band and nothing else - no digit, ever. `KidScreen` keeps her ceiling behind a
                 fog of war and the market screen's own note (:757 there) is written to that rule. -->
            <p v-if="roomBand" class="coach-room">{{ roomBand }}</p>
            <!-- The export's handwritten sign-off, Caveat in lime at 0.72. It is his NAME, so it
                 appears only when there is a him. -->
            <p v-if="coachSignature" class="coach-sign">{{ coachSignature }}</p>
          </div>
        </Card>

        <!-- D10: RECENT MEMORY – the painting from the band she was in THEN, on cream paper,
             tilted and tacked to the card. Time, made visible.
             U0: the cream frame, its lip, its shadow and its tilt are the Polaroid component; what
             stays here is WHERE it is dropped and how wide it is, which only the card it lands on
             can know. -->
        <Card as="article" class="note-card card-short">
          <Eyebrow>Recent memory</Eyebrow>
          <template v-if="memory">
            <Polaroid
              class="memory-polaroid"
              :src="memoryArt"
              :photo-style="memoryStyle"
              :photo-height="52"
              tilt="var(--tilt-4)"
            />
            <span class="memory-tack"></span>
            <p class="memory-line">{{ memory.line }}</p>
            <p class="memory-when">{{ memory.whenLabel }}</p>
          </template>
          <p v-else class="note-empty">Too early for memories.</p>
        </Card>
      </div>

      <!-- 4. BELOW THE GRID: the ladder and the feed. Same substance, diary chrome – and literally
           the same chrome, which is why they are Cards: the gradient, the hairline and the corners
           were already one shared rule with the notecards above, and now they are one component. -->
      <Card as="section" class="diary-strip">
        <Eyebrow as="h2">Season</Eyebrow>
        <!-- THE ROW IS THE ENGINE'S OPEN WINDOW PLUS ONE RUNG ABOVE IT; the rungs she has outgrown
             and the far top of the ladder are behind the ellipsis chips, which expand the row in
             place. Nothing is deleted - see the ruling quoted at `stripExpanded` in the script. -->
        <!-- D6: the row is a named group (a `list` would be a lie - the ellipsis affordances inside
             it are buttons, not list items) and every rung is a named image. See `chipName`. -->
        <div class="season-strip" role="group" aria-label="Season ladder">
          <template v-for="(cell, i) in stripCells" :key="cell.key">
            <button
              v-if="cell.kind === 'gap'"
              class="pill tier-chip strip-more"
              :aria-expanded="stripExpanded"
              :aria-label="cell.label"
              :title="cell.title"
              @click="stripExpanded = true"
            >&hellip;</button>
            <span
              v-else
              class="pill tier-chip"
              :class="{
                ok: cell.chip.state === 'reached',
                muted: cell.chip.state === 'idle',
                locked: cell.chip.state === 'locked',
                unlocked: cell.chip.state === 'unlocked',
                waiting: cell.chip.state === 'waiting',
                outgrown: cell.chip.state === 'outgrown',
              }"
              role="img"
              :aria-label="chipName(cell.chip)"
              :title="cell.chip.title"
            >{{ cell.chip.short }} &middot; {{ cell.chip.label }}</span>
            <!-- Decoration: the arrows say "and then", which the reading order already says. -->
            <span v-if="i < stripCells.length - 1" class="strip-arrow" aria-hidden="true">&#8594;</span>
          </template>
          <button
            v-if="stripExpanded"
            class="pill tier-chip strip-more"
            :aria-expanded="stripExpanded"
            aria-label="Show only her current levels"
            title="Back to her current window"
            @click="stripExpanded = false"
          >&minus;</button>
        </div>
      </Card>

      <Card id="diary-news" as="section" class="diary-strip">
        <Eyebrow as="h2">News</Eyebrow>
        <div class="log">
          <p v-if="!newsGroups.length" class="hint" style="margin: 0">No news yet.</p>
          <div v-for="group in newsGroups" :key="group.week" class="news-week">
            <p class="news-week-label">{{ weekLabel(group.week) }}</p>
            <!-- D8: one table PER WEEK, so an unnamed one is not merely anonymous - a reader landing
                 on it cannot tell which week's it is, and `getByRole('table', { name })` had a dozen
                 identical candidates. The name is the label already printed above it, plus the noun,
                 because "W12 2032" on its own does not say what the table holds. -->
            <table :aria-label="`News – ${weekLabel(group.week)}`">
              <tbody>
                <tr v-for="e in group.events" :key="e.id" :class="{ milestone: e.type === 'milestone' }">
                  <td v-if="e.type === 'match' && e.match" class="news-match-cell">
                    <button class="news-match-btn sfx-watch" @click="openReplay(e)">
                      <span class="nm-lines">
                        <span class="nm-players">
                          {{ kidShort }} vs {{ oppShort(e.match) }}
                          <span v-if="e.friendly" class="pill muted nm-friendly">practice</span>
                        </span>
                        <span class="nm-score num">{{ kidScoreOf(e.match) }}</span>
                      </span>
                      <span class="watch-cue">Watch</span>
                    </button>
                  </td>
                  <td v-else>{{ EVENT_EMOJI[e.type] }} {{ e.text }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </ScreenShell>

    <!-- ⭐⭐ THE BOTTOM CONTROL ON A COLLEGE WEEK – the two answers, and nothing else.
         It stands where App.vue's floating week button stands (that bar is hidden while the latch is
         on, because `advanceWeeks` refuses to tick a single week behind an ending and a control that
         cannot work is R10-16's own bug). The geometry is the same: fixed, above the tab bar, inside
         the same 520px column, and the room the shell reserves under Home is already paid for.

         ⚠ TWO BUTTONS OF ONE WEIGHT, SHARING ONE CLASS. Ruling 4 (30.07), the same discipline the
         fork at nineteen keeps: «a CTA pill beside a text link is an opinion in a different font».
         Neither of these is the page's CTA and neither is a link.
         ⚠ AND THE LEAVE ANSWER IS ABSENT BEFORE THE FIRST YEAR IS SPENT, because `endCollegeEarly`
         throws on a career with no banked year – the screen agreeing with the engine's rule.

         ⚠⚠ AND IT STANDS DOWN OVER AN OPEN REVEAL, which is round 24 rule 2 answered from the UI
         side. `resumeFromCollege` REFUSES to spend a year while a tournament is still waiting to be
         resolved (COLLEGE_REVEAL_REFUSAL) – a refusal that closes a whole class of silent failure and
         must not be routed around. Before this wave that state had no exit at all, because the
         epilogue covered the shell and nothing could draw the reveal; now the shell is up, so the
         one control that clears it – App.vue's global resume button, plus `TournamentFlow` itself –
         is on screen, and drawing a second bar over it would offer a press that can only be refused. -->
    <div v-if="collegeWeek && !game.snapshot?.pending" class="college-bar">
      <button class="college-answer" type="button" :disabled="game.busy" @click="resumeCollege">
        {{ collegeYearLabel }}
      </button>
      <button
        v-if="canLeaveCollege"
        class="college-answer"
        type="button"
        :disabled="game.busy"
        @click="leaveCollege"
      >
        Back on tour now
      </button>
    </div>

    <MatchReplay v-if="replayMatch" :match="replayMatch" @close="replayMatch = null" />
    <RankHelpDialog v-if="showRankHelp" @close="showRankHelp = false" />
    <InboxSheet v-if="showInbox" @close="showInbox = false" />
  </template>
</template>

<style scoped>
/* =================================================================================================
   HOME'S OWN STYLES – moved here from src/style.css by U0
   =================================================================================================
   WHY THIS BLOCK IS IN THE SFC AND NOT IN THE SHEET. Six screens are being built on top of this
   slice, in parallel, in separate worktrees, and `src/style.css` is the one file all six would
   touch. So the rule from here on is: what all screens share lives in the sheet or in
   `src/components/ui/`; what ONE screen composes lives scoped in that screen's own file. Every rule
   below had exactly one consumer – this page – and was sitting in a 4,900-line sheet where the next
   screen author would have had to read past it.

   WHAT LEFT THIS BLOCK ENTIRELY, because a component owns it now:
     `.diary`             -> ui/ScreenShell.vue    (it was a flex column and nothing else)
     the notecard surface -> ui/Card.vue           (gradient + hairline + corners + the 14px inset)
     `.note-kicker`       -> ui/Eyebrow.vue        (with `.diary-strip h2`, which was already merged
                                                    into the same rule)
     the ring's box, track, arc, value and the two shadows it wears on a photograph
                          -> ui/ProgressRing.vue   (shared with the Season card's identical ring)
     the polaroid's paper, lip, corner, shadow and tilt
                          -> ui/Polaroid.vue       (what stays here is WHERE it is dropped)

   Scoping changes specificity by one attribute selector, which is why every rule below was measured
   against the running app rather than reasoned about: a full computed-style walk of this page, 191
   nodes and ~50 properties each, before and after.

/* =================================================================================================
   epic/redesign-home, slice A – THE DIARY PAGE
   =================================================================================================
   The full Home restructure the family-diary doc parked as D9/D12 ("SOON, after D2 proves the
   direction"). D2 proved it, so this is the page, and its geometry is the owner's own design export
   (docs/design/screens.dc.html, block "A. Home") measured off the markup rather than eyeballed.

   THE FOUR IDEAS THE EXPORT IS BUILT ON, so a later slice can extend it without guessing:

     * THE PHOTOGRAPH IS THE PAGE, not a picture on it. The hero runs edge to edge and MELTS into
       the panel below through a bottom scrim; the date, the greeting, her name and the caption are
       all laid ON it. There is no frame, no card and no rounded photo at the top of this screen.
     * A CARD IS AN OBJECT: a vertical gradient, a translucent hairline, 17px corners, and art that
       bleeds off its own edge under a soft mask instead of sitting in a box.
     * ONE COLOUR MEANS "READ THIS". Every card kicker is the lime, at 10px/800 and a tenth of an em
       of tracking. Nothing else on the page is that colour.
     * FOUR STEPS OF INK (--ink … --ink-dim), and the export uses all four: headline, sentence,
       label, and the caption under a label. */

/* --- 1 + 2. THE HERO, which carries the header --------------------------------------------------
   Full-bleed: it cancels #app's 16px gutter so the photograph reaches both edges of the phone, the
   way the export draws it. */
.diary-hero {
  position: relative;
  /* Full-bleed: cancel the shell's gutter EXACTLY, on all three sides it touches. */
  margin: calc(-1 * var(--app-pad-top)) calc(-1 * var(--app-pad-x)) 0;
  /* A3 (owner, 28.07): the hero is SQUARE, because the paintings are square (512x512) – so at the
     full width of the phone the whole frame is on screen and nothing is cut. It used to be
     min(52vh, 420px), which cropped a slice off every painting for no reason anyone asked for. The
     export's own hero is 398px on a 390px device, i.e. square to within a rounding error.
     `max-height` keeps a tablet from turning it into a poster; `cover` + the face steering below
     are still there for the one master that is 458x512 rather than square. */
  aspect-ratio: 1 / 1;
  max-height: 60vh;
  overflow: hidden;
}

/* v48: the birthday burst. Above the three scrims (z 0) and below `.diary-head`, so the paper falls
   across the painting and never over the date or the icons. `pointer-events: none` because the hero
   carries the avatar button and the tools, and confetti must not eat a tap. */
.diary-hero-confetti {
  z-index: 1;
  pointer-events: none;
}

/* The hero photograph fills its square – see the shared rule up by .event-art img. */

/* TWO scrims, and they do two different jobs.
   TOP: darkens the first 40% so the date and the icons are legible over any of the 35 paintings.
   BOTTOM: takes the photograph into --panel by 100%, which is what makes the picture read as the
   page itself rather than as a banner sitting on top of it. */
.diary-hero-top {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(6, 10, 14, 0.78) 0%, rgba(6, 10, 14, 0.18) 22%, rgba(6, 10, 14, 0) 40%);
}

.diary-hero-fade {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(9, 14, 19, 0) 46%, rgba(11, 17, 23, 0.72) 78%, var(--bg) 100%);
}

/* A2 (owner, 28.07): the THIRD scrim, and the one the owner asked for. Everything on this page is
   laid down the LEFT of the painting – date, greeting, name, age, rank – and it runs far below the
   top scrim's 40%. On the sunlit courts (local-hard-1, national-grass-1) the age and the rank chip
   simply vanished into the picture. This darkens the left edge and clears well before the middle:
   her face sits centre-right in all 35 paintings, so the gradient never lands on it. */
.diary-hero-left {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    100deg,
    rgba(6, 10, 14, 0.66) 0%,
    rgba(6, 10, 14, 0.44) 26%,
    rgba(6, 10, 14, 0.12) 48%,
    rgba(6, 10, 14, 0) 64%
  );
}

/* The header row, laid on the photograph. A2 put the avatar at its head – the app header that used
   to carry it is gone. */
.diary-head {
  position: absolute;
  left: 20px;
  right: 18px;
  top: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* The date takes the slack so the two tool icons stay pinned right. */
.diary-head .diary-date {
  flex: 1;
}

/* The small round avatar with the lime ring, moved here from the deleted header – same object, same
   job (the door to her profile), now sitting on the photograph beside the date. */
.diary-avatar-btn {
  flex: none;
  width: 30px;
  height: 30px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
}

.diary-avatar-btn:hover:not(:disabled) {
  background: transparent;
}

.diary-avatar {
  display: block;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid var(--accent);
  /* The ring needs to hold against a bright court too, so it carries its own dark halo. */
  box-shadow: 0 0 0 1px rgba(6, 10, 14, 0.55), 0 2px 10px rgba(0, 0, 0, 0.45);
}

.diary-avatar-btn:hover:not(:disabled) .diary-avatar {
  border-color: #ffffff;
}

/* The one-time callout, moved with the avatar it explains. It hangs under the avatar rather than
   beside it – at 30px there is no room on a 390px screen, and the arrow makes the target obvious. */
.diary-kid-hint {
  position: absolute;
  left: 16px;
  top: 58px;
  z-index: 2;
  padding: 6px 11px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--accent);
  background: rgba(10, 15, 20, 0.82);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: var(--ink);
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45);
}

.diary-kid-hint::before {
  content: '';
  position: absolute;
  left: 12px;
  top: -5px;
  width: 8px;
  height: 8px;
  transform: rotate(45deg);
  background: rgba(10, 15, 20, 0.82);
  border-left: 1px solid var(--accent);
  border-top: 1px solid var(--accent);
}

/* "W27 2033 · Jun 3 – Jun 9" – OUR week label, the year in full, and the week's real days. Built by
   shared/dates.ts weekDateLine and by nothing else. (The export prints a plain calendar date here;
   the owner's ruling replaces it, because our whole game speaks in week numbers.) */
.diary-date {
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: rgba(255, 255, 255, 0.86);
  margin: 0;
  font-variant-numeric: tabular-nums;
  text-shadow: var(--shadow-text-on-art);
}

.diary-tools {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.diary-tool {
  position: relative;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.92);
  display: block;
}

.diary-tool:hover:not(:disabled) {
  background: transparent;
  color: var(--accent);
}

.diary-tool svg {
  display: block;
}

/* The export's unread dot: alert red, ringed by the page so it reads on any painting. */
.diary-tool-dot {
  position: absolute;
  top: -1px;
  right: -1px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--danger);
  box-shadow: 0 0 0 2px rgba(10, 15, 20, 0.55);
}

/* Her name is the biggest type in the app, and it is the point of the screen. */
.diary-id {
  position: absolute;
  left: 20px;
  right: 20px;
  top: 74px;
  pointer-events: none;
}

.diary-greeting {
  font-size: 14.5px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.78);
  margin: 0 0 4px;
  text-shadow: var(--shadow-text-on-art);
}

.diary-name {
  font-family: var(--font-heading);
  font-size: 42px;
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1;
  color: #ffffff;
  text-shadow: var(--shadow-text-on-art);
  margin: 0;
}

.diary-age {
  font-size: 14.5px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.82);
  margin: 8px 0 0;
  text-shadow: var(--shadow-text-on-art);
}

/* The rank chip – the page's ONE table-number, and the door to the best-6 explainer (round-6: the
   owner was confused by the windowed ranking twice). It is a button, which is why the old separate
   "?" is gone: one affordance where there used to be two. */
.diary-rank {
  pointer-events: auto;
  margin-top: 10px;
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(10, 15, 20, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: rgba(255, 255, 255, 0.92);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

/* WHICH TABLE the number belongs to. Quieter than the rank itself – it is the unit, not the figure –
   and uppercase/tracked so it reads as a label rather than as a word in a sentence. */
.rank-ladder {
  font-size: 9px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.72;
}

.diary-rank:hover:not(:disabled) {
  border-color: var(--accent);
  background: rgba(10, 15, 20, 0.55);
  color: #ffffff;
}

/* --- A2b: THE STATE ROW, along the bottom of the photograph ------------------------------------
   The owner's layout (28.07): the caption chip on the left, the condition ring on its right, and
   the WHY lines stacked ABOVE both. The lines take the chip's place on a week with no caption, so
   a strain warning is never what goes missing when the diary chooses to stay quiet. */
.diary-state {
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 26px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  pointer-events: none;
}

.diary-state-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

/* The WHY lines ride on the picture now, so they carry the on-art shadow like everything else up
   there, and a scrim of their own where the painting is busy. */
.diary-notes {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-width: 290px;
}

/* D1's WHY line. It had no rule of its own while it sat on the page background; on a painting it
   needs both a colour of its own and the shared on-art shadow. */
.condition-note {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.35;
  color: rgba(255, 255, 255, 0.82);
  text-shadow: var(--shadow-text-on-art);
  text-wrap: pretty;
}

/* R13-3's strain warning – the one line here that is a warning rather than an observation, which
   is exactly why it is --warning and the sun above is still --amber. Same value, different job. */
.condition-note.warn {
  color: var(--warning);
  font-weight: 600;
}

/* THE CAPTION – a frosted chip low on the photograph, with a lime dot glowing beside it. The one
   phrase the parent wrote about her week; it appears exactly once on the page. */
.diary-caption {
  max-width: 250px;
  display: flex;
  gap: 11px;
  align-items: flex-start;
  padding: 13px 16px 14px;
  border-radius: var(--radius-frame);
  background: rgba(10, 15, 20, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* The brand mark, in place of the lime dot that used to sit here (owner, 28.07). The asset is the
   wordmark's "i" – 9x30, a white stem under a lime ball – so it is drawn at its own aspect and
   aligned to the first line of the caption rather than centred on the block. */
.diary-caption-mark {
  flex: none;
  display: block;
  width: 7px;
  height: 23px;
  margin-top: 1px;
}

.diary-caption-text {
  font-size: 15px;
  line-height: 1.42;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.96);
  margin: 0;
}

/* THE CONDITION RING – the export's ProgressRing (46px box, r=19, 3px stroke, round cap, twelve
   o'clock start), parked at the bottom-right of the photograph. The 46px box and everything inside
   it are shared with `.chance-ring` up in the Season card – one rule, so a percentage keeps looking
   like a percentage everywhere. `margin-left: auto` pins it right even when there is no caption
   chip to push it there, and that is the only thing here that is this ring's alone. */
.condition-ring {
  margin-left: auto;
}

/* --- 3. THE CARD GRID --------------------------------------------------------------------------- */

.card-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 11px;
  padding: 2px 0 14px;
}

/* The gradient, the --card-edge hairline and the 17px corners are THE NOTECARD SURFACE, shared
   with .friendly-card and .diary-strip further up the sheet. What is left here is what makes this
   one a card in the grid rather than a strip: its box, its type, its height, its lift. */
.note-card {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  text-align: left;
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 15px;
  min-height: 186px;
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.note-card.card-short {
  min-height: 138px;
}

/* Picking a card up: a TAPPABLE card lifts under the finger. A card with nowhere to go does not
   move – which is the whole affordance, and it costs no chevrons, no "tap to open" copy, no icons. */
button.note-card {
  cursor: pointer;
}

button.note-card:hover:not(:disabled),
button.note-card:focus-visible {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-lift);
  background: linear-gradient(180deg, var(--card-top) 0%, var(--card-bottom) 100%);
  border-color: rgba(255, 255, 255, 0.12);
}

button.note-card:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: var(--shadow-card);
}

@media (prefers-reduced-motion: reduce) {
  .note-card,
  button.note-card:hover:not(:disabled),
  button.note-card:focus-visible,
  button.note-card:active:not(:disabled) {
    transition: none;
    transform: none;
  }
}

.note-title {
  position: relative;
  margin: 11px 0 0;
  font-size: 15.5px;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.01em;
  color: var(--ink);
  max-width: 118px;
  text-wrap: pretty;
}

.note-meta {
  position: relative;
  margin: 9px 0 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-soft);
  max-width: 118px;
}

/* A figure and the word above it – the export's "Travel budget / $137" pair. */
.note-foot {
  position: relative;
  margin-top: auto;
  padding-top: 10px;
}

.note-foot-label {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--ink-dim);
  margin: 0;
}

.note-figure {
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  margin: 2px 0 0;
}

/* The empty state of any card. Not a hole and not an apology – a plain sentence where the content
   would be, so a card is finished before it has anything to say. */
.note-empty {
  position: relative;
  margin: 11px 0 0;
  font-size: 13px;
  line-height: 1.4;
  font-weight: 500;
  color: var(--ink-soft);
  max-width: 130px;
  text-wrap: pretty;
}

/* --- NEXT TOURNAMENT ---------------------------------------------------------------------------- */

/* THE VENUE ART, the export's signature move: the painting bleeds off the card's bottom-right
   corner as a tall arch, and a diagonal mask dissolves its left edge INTO the card so there is no
   seam and no frame. src/art/venues.ts decides which painting (stable per event, forever). */
.venue-art {
  position: absolute;
  right: -4px;
  bottom: 0;
  width: 112px;
  height: 136px;
  border-radius: 56px 56px var(--radius-frame) var(--radius-frame);
  overflow: hidden;
  -webkit-mask-image: linear-gradient(100deg, transparent 4%, #000 44%);
  mask-image: linear-gradient(100deg, transparent 4%, #000 44%);
}

/* Fills its frame – see the shared rule up by .event-art img, which is also where the reason
   `cover` is not optional lives (the venue masters run 626x505 to 625x627). */

/* A fresh recap the player has not read – the dot that used to sit on the This-week tab, re-homed
   onto the card that now opens that screen. */
.note-dot {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 8px rgba(var(--accent-rgb), 0.6);
}

/* --- FAMILY BUDGET ------------------------------------------------------------------------------ */

.budget-total {
  position: relative;
  font-family: var(--font-heading);
  font-size: 23px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  margin: 12px 0 0;
}

.budget-total.negative {
  color: var(--danger);
}

.budget-rule {
  height: 1px;
  background: rgba(255, 255, 255, 0.07);
  margin: 12px 0 9px;
}

.budget-window {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--ink-soft);
  margin: 0;
}

/* 66px, not the export's 46 (owner, 28.07): our card carries a single TOTAL where the export
   stacked Income and Spent rows, so `margin-top: auto` was pushing 20px of nothing above the line.
   The chart takes that space back rather than the card growing a gap. */
.budget-chart {
  display: block;
  width: 100%;
  height: 66px;
  overflow: visible;
}

/* A2: the export's sparkline – one lime stroke, a soft area under it, and a dot per week whose
   colour says how that week went. `vector-effect` keeps the 1.8 stroke honest under the
   `preserveAspectRatio="none"` stretch, which would otherwise squash it horizontally. */
.budget-line {
  fill: none;
  stroke: var(--accent);
  stroke-width: 1.8;
  stroke-linejoin: round;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}

/* THE CHART'S OWN BOX. The line and the dots have to share it EXACTLY, and the card is not it:
   `.note-card` is padded 14px, so a dot layer positioned against the card comes out 28px wider and
   14px to the left of the chart it annotates - which is exactly how the dots ended up beside the
   line instead of on it (owner's screenshot, 29.07). Measured after the fix: layer and svg identical
   to the pixel. */
.budget-chart-wrap {
  position: relative;
  margin-top: auto;
}

/* The dots are HTML, not SVG (see HomeScreen): the chart stretches to the card's width and an SVG
   circle inside it stretches with it. Positioned in percent of the SAME box, so they land on the
   polyline's own vertices, and sized in px, so they stay circles at any card width. */
.budget-dots {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.budget-dot {
  position: absolute;
  width: 5.5px;
  height: 5.5px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.budget-dot.good {
  background: var(--day-good);
}

.budget-dot.mid {
  background: var(--day-mid);
}

.budget-dot.bad {
  background: var(--day-bad);
}

/* --- COACH -------------------------------------------------------------------------------------- */

/* A2 (owner checked this one against the mockup): the export's geometry, restored. The portrait is
   a 54px strip standing the FULL height of the card, flush to its left edge – the card's own
   overflow:hidden rounds it – and everything else lives in the column beside it. Slice A had used
   the venue card's bleed-and-dissolve here, which reads as decoration; a strip reads as a person
   standing there. The card drops its padding, because the strip must reach all four edges. */
.coach-card {
  padding: 0;
  overflow: hidden;
}

/* A2c/d (owner, 28.07): the portrait is sized by HEIGHT and nothing else. `height:100%; width:auto`
   means the whole frame is on screen – no vertical crop, which was the ask – and the card shows as
   much of its width as it has room for. The hard right edge is replaced by a gradient into the
   card; the mask makes the CARD's own gradient show through, so the two can never be different
   colours the way a painted overlay would drift. */
.coach-art {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  -webkit-mask-image: linear-gradient(90deg, #000 0%, #000 34%, transparent 96%);
  mask-image: linear-gradient(90deg, #000 0%, #000 34%, transparent 96%);
}

.coach-art img {
  display: block;
  height: 100%;
  width: auto;
}

/* ⭐ ROUND-18 #1 – 54 IS THE EXPORT'S OWN GEOMETRY AND IT IS BACK (owner, 13.08: «на главном экране
   верни выравнивание текста на плашке тренера как было раньше»). It is the number the A2 note above
   describes: a 54px strip, the text column beside it.

   ⚠ THE RECORD OF THE MISREAD, KEPT ON PURPOSE so this is not re-litigated a fourth time. Round-17
   #14 was «отодвинуть текст от картинок тренеров внутри раздела с выбором тренеров» and it was read
   as THIS card. It never was this card. He was in the coach PICKER – `.cm-row` in
   CoachMarketScreen – and that is where the fix finally landed, as round-18 #2. So this rule went
   54 -> 66 -> 80 across two rounds chasing a complaint that lived on another screen, and Home
   collected two fixes it never needed.

   ⚠ AND THE CHASE COULD NOT HAVE WORKED HERE ANYWAY, which is worth more than the revert is.
   Measured in a browser at 375px, where the grid makes this card 166px wide: `.coach-art` is
   height-driven (`height: 100%; width: auto`, the A2c/d ruling above), the CARD's height is set by
   how many lines the quote wraps to, and widening this margin narrows the quote's column. So every
   push right makes the card taller and the portrait wider with it –

     margin-left 54 -> card 193px tall, portrait 117px wide
     margin-left 66 -> card 231px tall, portrait 141px wide
     margin-left 80 -> card 265px tall, portrait 162px wide (its full natural width)

   The text moved 26px right and the picture grew 45px to meet it: the overlap was WORSE at 80 than
   at 54, and the quote had been squeezed into a two-word ribbon to pay for it. A margin cannot
   outrun a portrait that it is feeding.

   The 66px attempt aimed at the mask's OPAQUE stop (34%) and that reasoning was sound as far as it
   went – the fade only reaches transparent at 96%, so the visible man does extend far past the
   opaque band, and you must measure against the IMAGE. It was aimed at the wrong screen, and on
   this one the lever runs backwards. If Home is ever asked to clear its portrait for real, the fix
   is the one #2 used next door: bound the STRIP's width so the picture stops tracking the height.
   That is a change to the export's geometry and needs the owner, so it is not taken here. */
.coach-body {
  position: relative;
  margin-left: 54px;
  padding: 13px 11px 11px;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
}

.coach-line {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.42;
  font-weight: 500;
  color: var(--ink-2);
  text-wrap: pretty;
}

/* ⭐ ROUND 24 #1 – the band, under his line and above his name. Smaller and quieter than the quote:
   the quote is his VOICE and this is a READING, so it must not shout over him. Accent-toned because
   it is the one thing on this card the player came looking for.
   ⚠ NO WIDTH OR HEIGHT OF ITS OWN. `.coach-card` is `card-short` and the note has to keep fitting a
   375px phone with the portrait beside it - a fixed size here is how that stops being true one
   sentence later. `tests/component/round24-coach-card.test.ts` measures the box instead. */
.coach-room {
  margin: 6px 0 0;
  font-size: 11px;
  line-height: 1.36;
  font-weight: 600;
  color: var(--accent);
  text-wrap: pretty;
}

/* His words need the room, so the text column starts past the opaque part of the portrait and the
   note is free to run to the bottom of the card. */
.coach-line {
  margin-bottom: 0;
}

/* --- RECENT MEMORY ------------------------------------------------------------------------------ */

/* A REAL polaroid: cream paper, a fat bottom lip, tilted, dropped on the corner of the card. The
   only light surface in the app, and the reason the card reads as a page from an album. */
/* Owner, 28.07: leaning further left and pulled in toward the "Recent memory" line, so it reads as
   a photo dropped ON the card rather than one sliding off its edge. The tack below moves with it -
   the two are one object. */
.memory-polaroid {
  position: absolute;
  /* Pulled in from the export's -8px, but not to the 2px the first pass tried: the tilt widens the
     footprint and the handwritten line beside it started running underneath. -4px is as close as it
     comes without stealing the words' room. */
  right: -4px;
  /* Clears the kicker's baseline. The tilt WIDENS its footprint (a rotated 68px box spans 76px), so
     pulling it in toward the text and leaning it further both push it onto the word "memory" - at
     18px it clipped the last letter, at 27px it still grazed it. 34px is the first value that keeps
     the kicker whole; the export starts its polaroid below the kicker line too. */
  top: 34px;
  width: 68px;
}

/* The tack that holds it down - moved with the polaroid it pins. */
.memory-tack {
  position: absolute;
  right: 50px;
  top: 30px;
  width: 22px;
  height: 22px;
  border-radius: var(--radius-control);
  background: #151d25;
  border: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  align-items: center;
  justify-content: center;
}

.memory-tack::after {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
}

/* R4: the coach's handwritten sign-off, from the export (§Home.3: «подпись "M. Ricci" - Caveat 17px
   rgba(207,225,82,.72)»). Its values are the export's, to the digit; the alpha is written against
   `--accent-rgb` so the brand lime stays repairable in one place the way the token pass required.
   It is the SECOND place Caveat goes, and for the same reason as the first - a note on a
   photograph, signed by the person who wrote it. */
.coach-sign {
  margin: 6px 0 0;
  /* ⚠ PINNED RIGHT (owner, 29.07): «подпись тренера на карточке на домашнем экране прибей к правой
     стороне». A signature is the last thing on the note and it sits where a hand stops writing -
     under the end of the line, not under its beginning. Left-aligned it read as another line of the
     message rather than as somebody signing it. */
  align-self: flex-end;
  text-align: right;
  font-family: var(--font-hand);
  font-size: 17px;
  font-weight: 600;
  line-height: 1;
  color: rgba(var(--accent-rgb), 0.72);
}

/* A2e: the one line on this page that is genuinely a note written on a photograph, so it is the
   first place Caveat goes. Bigger than the sans it replaced (17px vs 13.5px) because Caveat's
   x-height is far smaller - the two look the same size on screen. */
.memory-line {
  position: relative;
  margin: 10px 0 0;
  font-family: var(--font-hand);
  font-size: 17px;
  font-weight: 600;
  line-height: 1.25;
  color: var(--ink);
  /* Stops short of the tilted polaroid rather than sliding under it. */
  max-width: 80px;
  text-wrap: pretty;
}

.memory-when {
  position: relative;
  margin: 7px 0 0;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--ink-soft);
  max-width: 86px;
}

/* --- 4. what stays below the grid ---------------------------------------------------------------
   The tier ladder and the news feed keep their markup (and every rule that pins it) and only change
   chrome, so the page below the fold reads as more of the same diary rather than the start of an
   older screen. And it is literally the same chrome: the gradient, the hairline and the corners are
   THE NOTECARD SURFACE, shared with .note-card and .friendly-card. */
.diary-strip {
  margin-bottom: 11px;
  min-height: 0;
}

/* The strip's heading is THE LIME EYEBROW – see .note-kicker above, where the shared rule lives.
   All this one adds is the gap under it; `.diary-strip` is a <section>, so `section h2` used to be
   the thing quietly supplying the uppercase and the eyebrow rule now says it out loud. */
.diary-strip h2 {
  margin: 0 0 12px;
}

/* THE ELLIPSIS AFFORDANCE on the season strip (04.08 - «нижние недоступные можно за иконкой
   многоточия скрывать»). It is a `.pill.tier-chip` like every other rung, because it stands IN the
   row where those rungs are and a second shape there would read as a different kind of thing; what
   this rule adds is only what a <button> needs to stop looking like a button - the app's global
   button padding and background would otherwise make the row's quietest element its loudest.
   Deliberately no accent: it is the one chip on the strip that is not about her progress. */
.strip-more {
  padding: 1px 10px;
  min-height: 0;
  line-height: 1.5;
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--muted);
  font-size: 12px;
  letter-spacing: 0.06em;
}

.strip-more:hover:not(:disabled),
.strip-more:focus-visible {
  color: var(--accent);
  border-color: var(--accent);
  background: transparent;
}

/* --- ⭐⭐ ROUND 24 #3 – THE COLLEGE WEEK'S BOTTOM CONTROL ---------------------------------------
   The same box as the shell's floating week strip (src/style.css): fixed, centred in the 520px
   column, 58px clear of the tab bar, `pointer-events: none` so the strip itself never eats a tap.
   What differs is that it holds TWO controls, so it has a gap and its buttons may shrink.
   ⚠ THE SHELL'S OWN CLASS NAME IS NOT WRITTEN ANYWHERE IN THIS FILE, and that is the guard rather
   than a style: `tests/round13-nav.test.ts` asserts no tab screen carries it, because a screen that
   draws its own advance bar is how the app grows a second, unbudgeted way to spend a week.

   ⚠ NEITHER BUTTON IS THE CTA (ruling 4). `.next-week-btn` is the app's one lime pill and it is
   deliberately NOT what these are: the panel tone with a hairline is the app's neutral control, and
   both answers wear it identically. A lime one beside a grey one would be the recommendation this
   card is not allowed to make.
   ⚠ AND `min-width: 0` IS LOAD-BEARING AT 320px. The shell's single pill carries a 206px minimum,
   which is right for one and impossible for two – `tests/component/college-second-act.test.ts`
   mutates exactly that back in and watches the pair break the viewport. */
.college-bar {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 58px;
  width: 100%;
  max-width: 520px;
  display: flex;
  justify-content: center;
  gap: 10px;
  padding: 0 16px;
  pointer-events: none;
  z-index: 39;
}

.college-answer {
  pointer-events: auto;
  flex: 1 1 0;
  min-width: 0;
  max-width: 240px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  background: var(--panel);
  color: var(--ink);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.college-answer:hover:not(:disabled),
.college-answer:focus-visible {
  border-color: var(--accent);
  color: var(--ink);
  background: var(--panel);
}

.college-answer:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>

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
import { LADDER_LABEL, type PlayStyle, type WorldEvent, type WorldMatch } from '../../shared/protocol'
import type { TierId } from '../../engine/season/types'
import { weekDateLine, weekLabel, weekRange } from '../../shared/dates'
import { formatShortName, rankLabel } from '../../shared/format'
import { KID_ID, flipScore, practiceCaution } from '../../engine/world'
import { ECONOMY } from '../../engine/economy'
import { useKidEmotion } from '../../composables/kidEmotion'
import { useHeaderAvatar } from '../../composables/headerAvatar'
import { facePoint } from '../../art/faceRects'
import { coachPortraitUrl, coachUrlFor, portraitUrl as portraitArtUrl } from '../../art/preload'
import { venueArtUrl } from '../../art/venues'
import { TIER_SHORT } from '../../composables/weekAhead'
// R11-5a: the ONE tier-state rule, shared with the Season screen's lock labels + open-tier note.
import { isTierOpen, useTierStates } from '../../composables/tierState'
import MatchReplay from '../MatchReplay.vue'
import RankHelpDialog from '../RankHelpDialog.vue'
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

function flagEmoji(code: string): string {
  if (!code) return ''
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

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

// The bell's dot asserts one FACT and not the "unread" it cannot know: this week put something in
// the feed. (The App shell's unread-news dot is a different thing and lives on the Home TAB, where
// it is only ever true while the player is somewhere else.)
const newsThisWeek = computed(() =>
  (game.snapshot?.events ?? []).some(
    (e) => e.week === week.value && e.type !== 'expense' && e.type !== 'income',
  ),
)
function jumpToNews(): void {
  playSfx('clickSoft')
  document.getElementById('diary-news')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
// So the chip reads the ladder the ENGINE says she is competing in (`activeLadder`: international
// once she holds a counting result there, national before that) and NAMES it. Same source as the
// Stats screen's default tab, so the two cannot disagree again.
const activeLadder = computed(() => game.snapshot?.activeLadder ?? 'domestic')
const ladder = computed(() => game.snapshot?.ladders[activeLadder.value])
const ladderLabel = computed(() => LADDER_LABEL[activeLadder.value])
const kidRank = computed(() => ladder.value?.rank ?? null)
// 'Unranked' until she's earned a counting result (see rankLabel): a point-less kid isn't really
// ranked, so we don't flash a misleading '#1' on a brand-new career. `rank: null` is now the engine's
// own way of saying exactly that, so this stops counting results to find out for itself.
const ranked = computed(() => kidRank.value !== null)
// The long form, where a chip has no room: which table, and the one fact about it that matters.
const rankChipTitle = computed(() =>
  activeLadder.value === 'domestic'
    ? 'Her national ranking – Local, Regional and National results. These are the points that open her next tier. Tap to see how they add up.'
    : 'Her international ranking – Junior Tour results only. National results do not count towards it. Tap to see how it adds up.',
)
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
 *  continuously instead of in ten steps. */
const ringColor = computed(() => {
  const pct = Math.max(0, Math.min(100, condition.value))
  return `hsl(${Math.round((pct / 100) * 120)}, 72%, 48%)`
})
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
  nearestEntered.value ? formatFunds(Math.abs(nearestEntered.value.travelCostCents)) : '',
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
function formatFunds(cents: number): string {
  const dollars = Math.round(cents / 100)
  const sign = dollars < 0 ? '-' : ''
  return `${sign}$${Math.abs(dollars).toLocaleString('en-US')}`
}
const funds = computed(() => formatFunds(fundsCents.value))

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


// --- Season strip: REAL tier progress. Reads the kid's best finish per tier off the snapshot: a
// reached tier shows the short finish label (W/F/SF/QF/R16…) in accent, an untouched one a muted
// dash. The strip is the whole six-rung ladder. R10-7: the short names come from the ONE shared
// table, which the dynamic Next-week button also reads – so the strip and the button can never call
// the same tier two different things. This array only carries the LADDER ORDER.
const SEASON_STRIP_TIERS: { id: TierId; short: string }[] = (
  ['local', 'regional', 'national', 'j30', 'j60', 'j300'] as const
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
}
const tierStates = useTierStates()
const seasonChips = computed<TierChip[]>(() =>
  SEASON_STRIP_TIERS.map(({ id, short }, i) => {
    const avail = tierStates.value[i]
    const best = game.snapshot?.bestFinishByTier[id]
    // Her earned result outranks every open state: once a tier is on the books the chip's job is to
    // show the finish, and the availability lives in the tooltip.
    const reached = isTierOpen(avail) && best !== undefined
    const state: TierChipState =
      avail.kind === 'age-locked' || avail.kind === 'locked'
        ? 'locked'
        : avail.kind === 'outgrown'
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
    const label =
      state === 'locked'
        ? `🔒 ${avail.note}`
        : state === 'reached'
          ? shortFinish(best!)
          : state === 'outgrown'
            ? (best !== undefined ? shortFinish(best) : avail.note)
            : state === 'waiting'
              ? avail.note
              : 'Unlocked – enter your first!'
    const title =
      state === 'reached'
        ? `Best ${short} finish · ${avail.title}`
        : state === 'outgrown'
          ? `Outgrown – her best ${short} result stays on the books`
          : avail.title
    return { id, short, label, state, title }
  }),
)

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
               label with the year in full, then the week's real days. shared/dates.ts owns it. -->
          <p class="diary-date">{{ dateLine }}</p>
          <div class="diary-tools">
            <button class="diary-tool" aria-label="Go to the news feed" title="News" @click="jumpToNews">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.7 21a2 2 0 0 1-3.4 0"></path>
              </svg>
              <span v-if="newsThisWeek" class="diary-tool-dot"></span>
            </button>
            <button class="diary-tool" aria-label="Settings" title="Settings" @click="emit('navigate', 'more')">
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
          <button
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
          <p v-else class="note-empty">Nothing entered yet – the calendar is on the Season tab.</p>
        </Card>

        <!-- FAMILY BUDGET -> the wallet. OWNER'S RULING over the export, which shows this week's
             income/spent rows: the current TOTAL, plus income and spending over the last 12 weeks. -->
        <Card as="button" class="note-card" @click="emit('navigate', 'money')">
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
        <div class="season-strip">
          <template v-for="(chip, i) in seasonChips" :key="chip.id">
            <span
              class="pill tier-chip"
              :class="{
                ok: chip.state === 'reached',
                muted: chip.state === 'idle',
                locked: chip.state === 'locked',
                unlocked: chip.state === 'unlocked',
                waiting: chip.state === 'waiting',
                outgrown: chip.state === 'outgrown',
              }"
              :title="chip.title"
            >{{ chip.short }} &middot; {{ chip.label }}</span>
            <span v-if="i < seasonChips.length - 1" class="strip-arrow">&#8594;</span>
          </template>
        </div>
      </Card>

      <Card id="diary-news" as="section" class="diary-strip">
        <Eyebrow as="h2">News</Eyebrow>
        <div class="log">
          <p v-if="!newsGroups.length" class="hint" style="margin: 0">No news yet.</p>
          <div v-for="group in newsGroups" :key="group.week" class="news-week">
            <p class="news-week-label">{{ weekLabel(group.week) }}</p>
            <table>
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

    <MatchReplay v-if="replayMatch" :match="replayMatch" @close="replayMatch = null" />
    <RankHelpDialog v-if="showRankHelp" @close="showRankHelp = false" />
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
</style>

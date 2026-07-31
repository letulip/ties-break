<script setup lang="ts">
// SCREEN G - FAMILY BUDGET. What the family earned, what it spent, and on what.
//
// THE GEOMETRY IS THE OWNER'S EXPORT, docs/design/README.md §"G. Family Budget", measured off
// docs/design/prototype/screens.dc.html: header 28/18/18 -> a three-cell summary (radius 16, 14px
// inset, hairlines between the cells, left/centre/right alignment) -> the period switcher (radius
// 11, 12.5px) -> a 202px category column with the paper artefacts laid over the space beside it,
// and the CTA pill under the list.
//
// WHERE THE DATA COMES FROM, unchanged from the screen this replaces: the ENGINE-MAINTAINED finance
// aggregate, never a scrape of `snapshot.events`. The mixed event feed is capped (60 in a snapshot,
// 400 retained) so old finance is pruned and a tournament week buries the rest under news.
// `snapshot.finance` carries category-accurate windows that survive that cap, and
// `snapshot.financialEvents` is a cap-independent slice of recent transactions for the ledger. The
// running ledger balance is still reconstructed BACKWARDS from the live `fundsCents` (the true
// current total), which stays correct for whatever slice of transactions is shown.
//
// ⚠ THREE PLACES THIS SCREEN DEPARTS FROM THE EXPORT, all three because the export is a picture of
// a game with a different engine behind it. They are decisions, not oversights:
//
//  1. THE PERIOD SWITCHER HAS TWO SEGMENTS, NOT THREE. The export offers This week / This month /
//     This year. Our engine folds finance per CATEGORY over exactly two windows (`finance.window12w`
//     and `finance.season`); the third series it carries, `finance.weekly12`, is per-week TOTALS
//     with no category breakdown at all. A "This week" tab would therefore have to scrape the
//     capped transaction feed to fill its own category list - the precise thing the paragraph above
//     says never to do. Two honest windows beat three where one is a guess.
//  2. THE DONUT IS BACK, BELOW THE PHOTOGRAPH (owner, 30.07: «Family budget – let's add our great
//     pie chart below the photo, I believe it'd fit there»). ⚠ This overrules what this note said
//     for one wave - "the export's composition has no donut and no room for one" - and he is right
//     about the room: the artefact column is 146px wide and stops at the polaroid, with the whole
//     depth of the category list still to run beside it. The donut is 116px. It fits with 15px to
//     spare, and the column reads as a receipt, a photo and a chart rather than as two objects and
//     a gap.
//     ⚠ AND IT IS COLOURED AGAIN (round-19, owner: «до этого pie chart был разноцветный, это было
//     сильно нагляднее. Давай снова его сделаем таким в нашей гамме»). This overrules what stood
//     here for two waves - "the ring is the accent at nine descending strengths, and nothing is lost
//     by that, because the slices are sorted largest-first so the ramp IS the ranking".
//     The ranking was never the missing thing: the name and the percentage are printed on the row
//     beside every slice, so a ring that only ranks is a ring that repeats. What one hue cannot say
//     is WHICH spend is which, and that is the only question a reader brings to a pie chart.
//     The objection that argument rested on is answered rather than ignored: round-7's rainbow was
//     nine hexes hand-written inside this file, and these nine are `--cat-*` tokens in
//     `src/style.css`, gated against a second copy by tests/design-tokens.test.ts. The colour comes
//     back; the private palette does not. And the SAME token paints the category's glyph on its row,
//     which is what makes the ring readable without a legend.
//  3. INCOME IS `--money-in`, NOT THE EXPORT'S `#a5db4b`. The app has one green for "money came in"
//     and it is a token; adding a second one for this screen alone would break the very principle
//     the export is written on (docs/design/README.md §3, "цвет = смысл").
import { computed, ref, useTemplateRef } from 'vue'
import { useGameStore } from '../../stores/game'
import { ECONOMY } from '../../engine/economy'
import type { FamilyBackground, FinanceWindow, WorldEvent, WorldEventCategory } from '../../shared/protocol'
import { seasonYear, weekLabel } from '../../shared/dates'
import { venueArtUrl } from '../../art/venues'
import { vacationArtUrl } from '../../art/weeks'
// U0 - the shared components (docs/specs/ui-components.md), plus the NINTH, which this screen is
// the reason for: StatRow. docs/specs/ui-components.md deliberately left it out of that slice
// ("it comes with the Money screen in U1, where it has a real caller"), and the three rows below -
// a category, the income line and a ledger entry - are what gave it its shape.
import ScreenShell from '../ui/ScreenShell.vue'
import Card from '../ui/Card.vue'
import Eyebrow from '../ui/Eyebrow.vue'
import PaperNote from '../ui/PaperNote.vue'
import IconButton from '../ui/IconButton.vue'
import Polaroid from '../ui/Polaroid.vue'
import PrimaryPill from '../ui/PrimaryPill.vue'
import SegmentedRow from '../ui/SegmentedRow.vue'
import StatRow from '../ui/StatRow.vue'

const game = useGameStore()
// The shell owns `tab`; this screen only asks. Money is a tabless CONTENT state reached from Home's
// budget card, so the export's back arrow needs somewhere to go and Home is where it came from.
const emit = defineEmits<{ navigate: ['home'] }>()

// --- Budget section (R9-5): the physio toggle lives HERE and not on Home - it is a spending
// decision, so it belongs with the money (the first brick of the round-7 "wallet levers" plan).
// Reflects/sets snapshot.physioActive; the weekly retainer band is corridor-scaled to the family's
// means.
const physioActive = computed(() => game.snapshot?.physioActive ?? false)
function togglePhysio(): void {
  game.setPhysio(!physioActive.value)
}
const physioCostLabel = computed(() => {
  const background = game.snapshot?.profile.background
  if (!background) return ''
  const [lo, hi] = ECONOMY.physio.retainerPerWeekCents
  const [cLo, cHi] = ECONOMY.physio.medicalBgFactor[background]
  return `$${Math.round((lo * cLo) / 100)}-${Math.round((hi * cHi) / 100)}/wk`
})

// Dollar figures per docs/specs/detour-ui-screens.md; must match
// src/engine/world.ts STARTING_FUNDS_CENTS (wealthy 120k / middle 25k / working 8k).
const STARTING_BUDGET: Record<FamilyBackground, number> = { wealthy: 120_000, middle: 25_000, working: 8_000 }

function formatFunds(cents: number): string {
  const dollars = Math.round(cents / 100)
  const sign = dollars < 0 ? '-' : ''
  return `${sign}$${Math.abs(dollars).toLocaleString('en-US')}`
}
function formatSigned(cents: number): string {
  const dollars = Math.round(cents / 100)
  const sign = dollars < 0 ? '-' : '+'
  return `${sign}$${Math.abs(dollars).toLocaleString('en-US')}`
}
function formatDollars(dollars: number): string {
  return `$${dollars.toLocaleString('en-US')}`
}

const week = computed(() => game.snapshot?.week ?? 0)
const fundsCents = computed(() => game.snapshot?.fundsCents ?? 0)
const funds = computed(() => formatFunds(fundsCents.value))
const startingBudget = computed(() => (game.snapshot ? formatDollars(STARTING_BUDGET[game.snapshot.profile.background]) : ''))

// --- THE PERIOD SWITCHER -----------------------------------------------------------------------
// U0's SegmentedRow finally absorbs this control. Its own header says so: "THE MONEY SCREEN'S
// 12w/season toggle is `.option-row` / `.option-pill`, a THIRD shape. Money is U1's screen;
// converging it belongs with whoever ports it, and it should then come here." It has.
//
// NB the ref must NOT be named `window`: Vue's template compiler treats `window` as the browser
// global (it is on the template global-allowlist), so a ref by that name is unreachable from the
// template and the toggle would silently no-op.
const breakdownWindow = ref<'12w' | 'season'>('12w')
const WINDOW_OPTIONS = [
  { value: '12w', label: 'Last 12 weeks', short: '12 weeks' },
  { value: 'season', label: 'This season', short: 'This season' },
]
// The engine-side finance window for the active toggle (12w: last 12 weeks; season: the current
// 52-week block) - category-accurate over the full retained history, not the trailing event feed.
const activeFinance = computed<FinanceWindow | undefined>(() =>
  breakdownWindow.value === '12w' ? game.snapshot?.finance.window12w : game.snapshot?.finance.season,
)

const incomeCents = computed(() => activeFinance.value?.incomeCents ?? 0)
const spentCents = computed(() => activeFinance.value?.expenseCents ?? 0)
const netCents = computed(() => activeFinance.value?.netCents ?? 0)

// --- THE CATEGORY LIST -------------------------------------------------------------------------
// Expense buckets in a fixed order. Positive (income) events never appear here - they roll into one
// green row under the list. An expense whose category is missing/unknown (pre-round-7 events) falls
// into 'other'. 'interest' (R9-1, weekly savings interest) is INCOME-side and must never appear as
// a spending row.
type ExpenseCategory = Exclude<WorldEventCategory, 'income' | 'sponsor' | 'interest' | 'academy'>
const EXPENSE_META: { key: ExpenseCategory; label: string }[] = [
  { key: 'coaching', label: 'Coaching' },
  { key: 'travel', label: 'Travel' },
  { key: 'entry', label: 'Entry fees' },
  { key: 'gear', label: 'Gear' },
  { key: 'stringing', label: 'Stringing' },
  { key: 'physio', label: 'Fitness & medical' },
  // Season planner (v13): the two planned spends get their own rows - a vacation package is a real
  // money sink the owner wants to see, and the practice court fee is the small recurring one.
  { key: 'vacation', label: 'Vacations' },
  { key: 'practice', label: 'Practice matches' },
  { key: 'other', label: 'Other' },
]
const EXPENSE_KEYS = new Set<string>(EXPENSE_META.map((m) => m.key))

// The export's glyphs, redrawn on its own grid (24x24, 1.5 stroke, round caps) and stored as path
// data rather than nine copies of an <svg> element. `stroke: currentColor` is StatRow's contract,
// so every one of them is drawn in the row's own ink.
// ⚠ THREE ROWS LEFT THIS TABLE ON 31.07 AND THEY WERE DELETED RATHER THAN KEPT "just in case".
// `entry`, `gear` and `vacation` are drawn from the owner's own files now (see CAT_ICON_FILE), and
// the map is keyed by CATEGORY - so a path that nothing renders does not read as dead code, it reads
// as a live alternative somebody might switch back to. There is one drawing per row and one place it
// comes from. Anything still here is a glyph he has not replaced.
const ICON_PATHS: Record<string, string[]> = {
  coaching: ['M12 5.2a3.2 3.2 0 1 1 0 6.4 3.2 3.2 0 0 1 0-6.4z', 'M5.5 19.5c0-3.3 2.9-5.2 6.5-5.2s6.5 1.9 6.5 5.2'],
  travel: ['M3 15.5l18-5.6-2-3.2-4.6 1.5-5.2-4.4-2.2.7 3 4.9-4 1.3-2.6-1.9-1.6.5z', 'M4.5 19.5h15'],
  practice: ['M12 3.6a8.4 8.4 0 1 1 0 16.8 8.4 8.4 0 0 1 0-16.8z', 'M5.2 6.6c3.6 2.2 3.6 8.6 0 10.8M18.8 6.6c-3.6 2.2-3.6 8.6 0 10.8'],
  other: ['M12 4.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15z', 'M12 8.2V12l2.4 1.6'],
}

// ONE COLOUR PER CATEGORY, AND IT IS THE SAME COLOUR IN BOTH PLACES (round-19). The owner:
// «pie chart был разноцветный, это было сильно нагляднее... а еще вот эти иконки категорий покрасим
// в соответственные цвета - тогда это будет потрясающе просто и понятно с первого взгляда.»
//
// That last clause is the whole design and it is why this table exists rather than two lists: the
// slice and the glyph beside its name MUST be the same hue, or the reader has to match by position
// and the chart stops paying for itself. One lookup, two consumers - the ring's stroke and the row's
// ink - so they cannot drift apart.
//
// Values live in `src/style.css` `:root` (see the `--cat-*` block there for why they are ours rather
// than the export's, and why they are not the `--event-*` family). Nothing here may spell a hex.
const CAT_COLOR: Record<string, string> = {
  coaching: 'var(--cat-coaching)',
  travel: 'var(--cat-travel)',
  entry: 'var(--cat-entry)',
  gear: 'var(--cat-gear)',
  stringing: 'var(--cat-stringing)',
  physio: 'var(--cat-physio)',
  vacation: 'var(--cat-vacation)',
  practice: 'var(--cat-practice)',
  other: 'var(--cat-other)',
}
function catColor(key: string): string {
  return CAT_COLOR[key] ?? CAT_COLOR.other
}

// THE GLYPHS THE OWNER DREW (public/icons/*.svg). They are FILES, not path data, so they cannot take
// `stroke: currentColor` the way the inline ones do - they are masked instead, the same technique the
// bottom bar's tab icons use, which paints the category's colour THROUGH the artwork's own
// silhouette. Anything not listed keeps its inline path.
//
// ⚠ `racket` IS FILED UNDER STRINGING, NOT GEAR, and it is a judgement call worth naming: a racket
// is the archetypal "gear" picture, but Gear now ships his sneaker, while Stringing's inline glyph
// was an oval with strings across it - a racket drawn badly. So the owner's art replaces the drawing
// it was already trying to be, and the two rows stay visibly different.
//
// ⚠ AND `interest-discount-fee` IS THE ENTRY-FEE PICTURE, NOT AN `interest` ONE. The filename is a
// trap: `interest` is a real and DIFFERENT category in this codebase - R9-1's weekly savings
// interest - which is INCOME-side and which EXPENSE_META's own note says must never appear as a
// spending row. What the owner asked for is the fees budget, so the file is bound to `entry`
// (tournament entry fees) and the word in its name is ignored. Binding it by filename would have
// created a spending row for an income category, silently, in a table keyed by category.
const CAT_ICON_FILE: Record<string, string> = {
  physio: 'medical-kit-svgrepo-com',
  stringing: 'racket-svgrepo-com',
  income: 'incomes-svgrepo-com',
  gear: 'sneakers-svgrepo-com',
  entry: 'interest-discount-fee-svgrepo-com',
  vacation: 'sun-fog-svgrepo-com',
}
function iconMask(key: string): string {
  return `url("${import.meta.env.BASE_URL}icons/${CAT_ICON_FILE[key]}.svg")`
}

interface BreakdownRow {
  key: string
  label: string
  cents: number
  pct: number
}
// Expense rows (money OUT), largest first, each with its share of total spend. Reads the signed
// per-category totals off the aggregate: negative categories are expenses (magnitude shown); an
// unknown/unbucketed category folds into 'other'.
const expenseRows = computed<BreakdownRow[]>(() => {
  const totals = new Map<string, number>()
  for (const [cat, amt] of Object.entries(activeFinance.value?.byCategory ?? {})) {
    if ((amt ?? 0) >= 0) continue
    const key = EXPENSE_KEYS.has(cat) ? cat : 'other'
    totals.set(key, (totals.get(key) ?? 0) + -(amt ?? 0))
  }
  const total = [...totals.values()].reduce((a, b) => a + b, 0)
  if (total === 0) return []
  return EXPENSE_META.filter((m) => (totals.get(m.key) ?? 0) > 0)
    .map((m) => {
      const cents = totals.get(m.key)!
      return { key: m.key, label: m.label, cents, pct: cents / total }
    })
    .sort((a, b) => b.cents - a.cents)
})
const pctLabel = (pct: number): string => `${Math.round(pct * 100)}%`

// --- THE DONUT (owner, 30.07) ------------------------------------------------------------------
// Round-7's dependency-free ring, restored under the polaroid. The geometry is verbatim: a
// circumference of exactly 100 (r = 100 / 2π) so a slice's dash length IS its percentage and no
// arithmetic is needed to place it, `dashoffset` walking the accumulated fill so the slices sit
// end-to-end starting at twelve o'clock.
//
// ⚠ THE ACCENT RAMP IS GONE, AND ITS OWN ARGUMENT IS WHY. U1 gave every slice the accent at a
// descending opacity and defended it like this: "the slices are already sorted largest-first, so the
// ramp IS the ranking". True - and the ranking was never the thing a reader needs from a ring, since
// the percentage and the name are printed on the row beside it either way. What the ring alone can
// say is WHICH spend is which, and one hue at nine strengths cannot say that at all.
//
// So the slice now wears its category's colour at full strength, and `strength` went with the ramp.
// Fading the small slices would have been the old idea surviving as a habit: it would mute exactly
// the categories whose share is too small to read off the ring, which are the ones that need their
// colour most.
const DONUT_R = 15.915494309189533
interface DonutSeg {
  color: string
  dasharray: string
  dashoffset: number
}
const donutSegments = computed<DonutSeg[]>(() => {
  const rows = expenseRows.value
  let filled = 0
  return rows.map((r) => {
    const dash = r.pct * 100
    const seg = {
      color: catColor(r.key),
      dasharray: `${dash} ${100 - dash}`,
      dashoffset: 125 - filled,
    }
    filled += dash
    return seg
  })
})
const totalExpenseCents = computed(() => expenseRows.value.reduce((s, r) => s + r.cents, 0))

// --- W7: THE CAREER, YEAR BY YEAR --------------------------------------------------------------
//
// The owner: «было бы очень интересно где-то хранить всю историю затрат за карьеру по годам в
// каком-то виде.»
//
// ⚠ WHAT WAS CHECKED FIRST, because the honest version of this feature and the dishonest one look
// identical on screen. The engine keeps TWO records of money and only one of them is a career:
//
//   `finance.window12w` / `finance.season`   the category-accurate folds this screen already draws.
//       They come off `WorldState.financeWeeks`, which `pruneFinanceWeeks` trims to a 60-WEEK
//       trailing window. Sixty weeks is 1.15 seasons. A five-year career has already deleted four
//       years of per-category detail from its own save, and there is no backup of it anywhere.
//   `seasonHistory`                          one row per finished season, capped at 30 seasons -
//       i.e. beyond any playable career - and never pruned in practice. THIS is the career record,
//       and it is what this list reads.
//
// So the chart he might have expected - spending by category, by year, all the way back - CANNOT BE
// DRAWN, and drawing it would mean inventing four years of numbers. What can be shown is a true row
// per season, and that is what this is.
//
// ⚠ AND THE NET WAS NOT ENOUGH, which is why this wave also banked the gross. `seasonHistory` has
// always carried `fundsDeltaCents` - did the year end up or down - and that is not the question he
// asked. ЗАТРАТЫ is what it COST to keep her playing, and a season of $18k of prize money against
// $19k of bills reports as "-$1,000" in a net column: a shrug where the real story is that the year
// cost nineteen thousand dollars. `spentCents` / `earnedCents` are banked at the wrap-up now (see
// protocol.ts SeasonHistoryEntry and world.ts maybeFireSeasonWrapUp), off the same window the
// summary popup has always used, so the two can never disagree.
//
// ⚠ ROWS WITHOUT THE GROSS FIGURES SAY SO, and are not quietly filled with the net. A season banked
// before that field existed has no gross number and none can be reconstructed - the ledger behind it
// was pruned years of game-time ago - so the row prints the balance it DOES have and the panel says
// plainly why. A zero there would read as "a free season", which is the one thing it certainly was
// not.
const seasonRows = computed(() => {
  const rows = game.snapshot?.seasonHistory ?? []
  // Newest first: a parent opening this wants last year, not the year she was fourteen.
  return [...rows]
    .sort((a, b) => b.seasonIndex - a.seasonIndex)
    .map((r) => {
      const recorded = typeof r.spentCents === 'number'
      return {
        seasonIndex: r.seasonIndex,
        yearLabel: `Season ${r.seasonIndex + 1} – ${seasonYear(r.seasonIndex)}`,
        recorded,
        // The headline is what the year COST - his question - and the sub-line carries the other
        // two halves of it: what came in, and what was left when it closed.
        value: recorded ? formatSigned(-r.spentCents!) : '–',
        meta: recorded
          ? `${formatSigned(r.earnedCents ?? 0)} in – ${formatFunds(r.endFundsCents)} left`
          : `${formatFunds(r.endFundsCents)} left`,
      }
    })
})

// --- THE PAPER ARTEFACTS -----------------------------------------------------------------------
// The export lays a receipt and a trip polaroid over the space beside the category column. Both are
// REAL here: the receipt is an actual line out of the family's ledger, and the photograph is the
// trip the money went on.
//
// PaperNote's first caller is the Kid screen's play-style scrap; this is its second, and the one
// that exercises the ruled/torn stock the component was built for.
const receipt = computed<WorldEvent | null>(() => {
  const financial = game.snapshot?.financialEvents ?? []
  // A travel line if there is one - a hotel/flight receipt is what the export pins here - and
  // otherwise the largest recent expense, which is the one a parent would have kept.
  const travel = [...financial].reverse().find((e) => e.category === 'travel' && (e.amountCents ?? 0) < 0)
  if (travel) return travel
  const expenses = financial.filter((e) => (e.amountCents ?? 0) < 0)
  if (!expenses.length) return null
  return expenses.reduce((worst, e) => ((e.amountCents ?? 0) < (worst.amountCents ?? 0) ? e : worst))
})

/** The trip photograph: the family holiday she is booked on if there is one (the painting the
 *  Season feed shows for that package), else the venue of the next tournament the travel budget is
 *  being spent on. Null when neither exists, and then the polaroid simply is not there. */
const tripPhoto = computed<string | null>(() => {
  const snap = game.snapshot
  if (!snap) return null
  const booked = snap.vacations.find((v) => v.week >= snap.week) ?? snap.vacations[snap.vacations.length - 1]
  const vacation = booked ? vacationArtUrl(booked.packageId) : null
  if (vacation) return vacation
  const next = snap.upcoming[0]
  return next ? venueArtUrl(next.tier, next.surface, next.id, snap.seed) : null
})

// --- THE LEDGER --------------------------------------------------------------------------------
interface LedgerRow {
  event: WorldEvent
  balanceAfter: number
}
interface LedgerGroup {
  week: number
  rows: LedgerRow[]
}

const ledgerGroups = computed<LedgerGroup[]>(() => {
  const financial = game.snapshot?.financialEvents ?? []
  // Walk newest -> oldest: the last (most recent) financial event's balance-after equals the live
  // fundsCents; each older event's balance-after is that running total minus the delta of
  // everything more recent than it.
  let running = fundsCents.value
  const rows: LedgerRow[] = []
  for (let i = financial.length - 1; i >= 0; i--) {
    const event = financial[i]
    rows.push({ event, balanceAfter: running })
    running -= event.amountCents ?? 0
  }
  const byWeek = new Map<number, LedgerRow[]>()
  for (const row of rows) {
    const list = byWeek.get(row.event.week)
    if (list) list.push(row)
    else byWeek.set(row.event.week, [row])
  }
  return [...byWeek.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([week, weekRows]) => ({ week, rows: weekRows }))
})

// The export's CTA. There is no separate transactions SCREEN to open - the ledger is on this page,
// below the fold - so the button does what the words promise by taking the player to it. The ref is
// on a plain wrapper and not on the Card: a ref on a component yields the component instance, and
// reaching through `$el` for a DOM node is the kind of thing that breaks the day the component
// grows a second root.
const ledgerEl = useTemplateRef<HTMLElement>('ledger')
function showAllTransactions(): void {
  // The glide is a nicety and the ARRIVAL is the promise, so the behaviour is chosen rather than
  // assumed: a player who has asked their system for less motion gets taken there at once. Found
  // by driving it - the verification browser does not animate `behavior: 'smooth'` at all, and a
  // button whose only mode is an animation nobody runs is a button that does nothing.
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  ledgerEl.value?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
}
</script>

<template>
  <template v-if="game.snapshot">
    <ScreenShell>
      <!-- ============================= 1. THE HEADER =============================
           The export's three-dot menu is NOT here: it opens nothing in this build, and a control
           that goes nowhere is worse than no control. The subtitle carries what the player actually
           came for instead - what is in the account right now. -->
      <div class="money-head">
        <IconButton
          class="back-link"
          variant="bare"
          icon="back"
          label="Back to Home"
          @click="emit('navigate', 'home')"
        />
        <div class="money-head-id">
          <h2 class="money-title">Family Budget</h2>
          <p class="money-sub" :class="{ negative: fundsCents < 0 }">
            {{ funds }} in the account &middot; {{ weekLabel(week) }}
          </p>
        </div>
      </div>

      <!-- ============================= 2. THE SUMMARY ============================= -->
      <Card class="money-summary" pad="14px 4px">
        <div class="money-cell">
          <p class="money-cell-label">Total income</p>
          <p class="money-cell-figure positive">{{ formatFunds(incomeCents) }}</p>
        </div>
        <div class="money-cell money-cell-mid">
          <p class="money-cell-label">Total spent</p>
          <p class="money-cell-figure negative">{{ formatFunds(-spentCents) }}</p>
        </div>
        <div class="money-cell money-cell-end">
          <p class="money-cell-label">Balance</p>
          <p class="money-cell-figure" :class="netCents < 0 ? 'negative' : 'positive'">
            {{ formatSigned(netCents) }}
          </p>
        </div>
      </Card>

      <!-- ============================= 3. THE PERIOD ============================= -->
      <SegmentedRow
        v-model="breakdownWindow"
        class="money-window"
        :options="WINDOW_OPTIONS"
        group-label="Budget period"
      />

      <!-- ================= 4. THE CATEGORY COLUMN + THE ARTEFACTS =================
           The list keeps to its own column and the paper is laid over the space beside it, exactly
           as the export composes it. Below 340px of content the artefacts step out of the way
           rather than crowd the figures - see the media query in the style block. -->
      <p v-if="!expenseRows.length" class="money-empty">No spending in this window yet.</p>

      <div v-else class="money-body">
        <div class="money-list">
          <StatRow
            v-for="row in expenseRows"
            :key="row.key"
            class="money-row"
            :label="row.label"
            :meta="pctLabel(row.pct)"
            :value="formatFunds(-row.cents)"
            tone="negative"
          >
            <template #icon>
              <!-- The owner's own artwork, painted through a mask so the file takes the category's
                   colour instead of shipping one. Same technique as the bottom bar's tab icons. -->
              <span
                v-if="CAT_ICON_FILE[row.key]"
                class="cat-icon-file"
                :style="{ '--cat-mask': iconMask(row.key), background: catColor(row.key) }"
              ></span>
              <svg
                v-else
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                :style="{ color: catColor(row.key) }"
              >
                <path v-for="(d, i) in ICON_PATHS[row.key] ?? ICON_PATHS.other" :key="i" :d="d"></path>
              </svg>
            </template>
          </StatRow>

          <StatRow
            v-if="incomeCents > 0"
            class="money-row"
            label="Income"
            :value="formatSigned(incomeCents)"
            tone="positive"
            :divider="false"
          >
            <template #icon>
              <!-- Income keeps `--money-in`, which is note 3 at the top of this file and is not up
                   for negotiation by a new picture: the app has ONE green for "money came in". The
                   owner's incomes glyph replaces the drawn arrow; the colour it wears is the same
                   token the amount beside it wears. -->
              <span
                class="cat-icon-file"
                :style="{ '--cat-mask': iconMask('income'), background: 'var(--money-in)' }"
              ></span>
            </template>
          </StatRow>

          <PrimaryPill class="money-cta" variant="cta" @click="showAllTransactions">
            View all transactions
          </PrimaryPill>
        </div>

        <div class="money-artefacts" aria-hidden="true">
          <PaperNote v-if="receipt" class="money-receipt" tilt="2deg" ruled torn>
            <span class="money-receipt-line">{{ receipt.text }}</span>
            <span class="money-receipt-line">{{ weekLabel(receipt.week) }}</span>
            <span class="money-receipt-line money-receipt-sum">
              {{ formatFunds(receipt.amountCents ?? 0) }}
            </span>
          </PaperNote>
          <!-- ⚠ A SQUARE WINDOW ON THE RIGHT PART OF A LONG FRAME (owner, 30.07: «Photo crop for the
               family budget should be either square for the square frame either square of the right
               part of a not square (long) frame – there's a face there»). He offered two options and
               named the axis; this is his second, and it needs no new art.
               THE ARITHMETIC, because "there's a face there" is a measurement and not a preference.
               Every trip painting is 512x205 - a very long banner, ratio 2.498 - and in all six she
               is seated on the RIGHT: her face lands at 66% to 79% of the width (vac-village is the
               leftmost at 66, vac-elite the rightmost at 79). `object-fit: cover` scales the source
               to fill the window's SHORT axis, so on a 124x124 window it fills the height and the
               window keeps 124 of 309.7 scaled px - 40% of the picture, cropped HORIZONTALLY. At the
               browser default of `50%` that 40% is the middle: it spans 30% to 70% of the source and
               throws her face away in every single one of them, which is the bug he is reporting.
               `90%` puts the window at 54%-94%, which holds all six faces with room either side.
               Polaroid owns the paper; the caller owns the window and where it looks. -->
          <Polaroid
            v-if="tripPhoto"
            class="money-polaroid"
            :src="tripPhoto"
            alt=""
            tilt="-3deg"
            :photo-height="124"
            :photo-style="{ objectPosition: '90% 50%' }"
            tape
          />

          <!-- THE PIE CHART HE ASKED FOR, under the photo. `aria-hidden` is on the column, so this
               ring is decoration by construction - which is correct and is why it can be monochrome:
               every number in it is printed as text on the rows beside it. -->
          <svg v-if="expenseRows.length" class="donut money-donut" viewBox="0 0 42 42">
            <circle class="donut-track" cx="21" cy="21" :r="DONUT_R" />
            <circle
              v-for="(seg, i) in donutSegments"
              :key="i"
              class="donut-seg"
              cx="21"
              cy="21"
              :r="DONUT_R"
              :stroke-dasharray="seg.dasharray"
              :stroke-dashoffset="seg.dashoffset"
              :style="{ stroke: seg.color }"
            />
            <text class="donut-center-num" x="21" y="20.5">{{ formatFunds(-totalExpenseCents) }}</text>
            <text class="donut-center-cap" x="21" y="25">spent</text>
          </svg>
        </div>
      </div>

      <!-- ============================== 5. THE LEVERS ==============================
           R9-5: recurring budget levers live with the money, not on Home. -->
      <Card class="money-panel">
        <Eyebrow as="h2">Budget</Eyebrow>
        <label class="physio-toggle">
          <input type="checkbox" :checked="physioActive" :disabled="game.busy" @change="togglePhysio" />
          <span>Physio recovery</span>
          <span class="hint physio-cost">{{ physioCostLabel }}</span>
        </label>
        <p class="money-panel-note">
          Weekly retainer - lowers injury risk, shortens recoveries and adds a little condition each
          week.
        </p>
        <p class="money-panel-note">Started this career with {{ startingBudget }}.</p>
      </Card>

      <!-- ============================== 6. THE CAREER, BY YEAR ======================
           One row per season she has finished. Read-only, and honest about the years it cannot
           answer for - see the script for why some rows say nothing. -->
      <Card class="money-panel money-years">
        <Eyebrow as="h2">Every season</Eyebrow>
        <p v-if="!seasonRows.length" class="money-panel-note">
          Her first season is still running – it lands here when the year wraps up.
        </p>
        <StatRow
          v-for="row in seasonRows"
          :key="row.seasonIndex"
          class="money-row"
          :label="row.yearLabel"
          :meta="row.meta"
          :value="row.value"
          :tone="row.recorded ? 'negative' : 'plain'"
        />
        <p v-if="seasonRows.some((r) => !r.recorded)" class="money-panel-note">
          Seasons played before this version kept only the year's balance, so what they cost is not
          on file. Every season from here on records it.
        </p>
      </Card>

      <!-- ============================== 7. THE LEDGER ============================== -->
      <div ref="ledger">
        <Card class="money-panel">
          <Eyebrow as="h2">All transactions</Eyebrow>
          <p v-if="!ledgerGroups.length" class="money-panel-note">No transactions yet.</p>
          <div v-for="group in ledgerGroups" :key="group.week" class="ledger-week">
            <p class="ledger-week-label">{{ weekLabel(group.week) }}</p>
            <StatRow
              v-for="row in group.rows"
              :key="row.event.id"
              class="money-row"
              :label="row.event.text"
              :meta="formatFunds(row.balanceAfter)"
              :value="formatSigned(row.event.amountCents ?? 0)"
              :tone="(row.event.amountCents ?? 0) < 0 ? 'negative' : 'positive'"
            />
          </div>
        </Card>
      </div>
    </ScreenShell>
  </template>
</template>

<style scoped>
/* =================================================================================================
   SCREEN G's OWN STYLES, in the SFC for the reason U0 wrote into HomeScreen: six screens are being
   built on top of that slice in parallel and `src/style.css` is the one file all six would touch.
   WHAT LEFT THIS SCREEN ENTIRELY, because a component owns it now:
     the donut and its rows  -> StatRow (src/components/ui/StatRow.vue) + see note 2 in the script
     `.option-row`/`.option-pill` -> SegmentedRow
     the panel surface       -> Card
     the CTA pill            -> PrimaryPill (variant `cta`)
   WHAT DELIBERATELY STAYED IN THE SHEET: `.physio-toggle`, `.hint`, `.ledger-week-label` and
   `.back-link` - shared vocabulary with other screens, and `.ledger-week-label` is pinned by name
   in tests/week-numbering.test.ts.
   ================================================================================================= */

/* --- 1. THE HEADER ---------------------------------------------------------------------------- */

.money-head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 4px 0 18px;
}

.money-head-id {
  flex: 1;
  min-width: 0;
}

.money-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--ink);
}

.money-sub {
  margin: 5px 0 0;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
}

.money-sub.negative {
  color: var(--money-out);
}

/* --- 2. THE SUMMARY --------------------------------------------------------------------------- */

.money-summary {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
}

/* 8px of inset rather than the export's 10, and 19px figures rather than its 20. The export is
   drawn at 390 and our narrowest supported phone is 375, and this app's figures go a digit further
   than the mockup's: a wealthy family starts at $120,000, so "-$128,540" is a real reading here and
   "-$24,390" is the widest the export ever has to draw. Two pixels of inset and one of type is what
   makes the difference fit without the cell clipping. */
.money-cell {
  padding: 0 8px;
  min-width: 0;
}

/* The export separates the three readings with hairlines rather than with space - the card is one
   object saying three things, not three cards. */
.money-cell-mid {
  text-align: center;
  border-left: 1px solid var(--line);
  border-right: 1px solid var(--line);
}

.money-cell-end {
  text-align: right;
}

.money-cell-label {
  margin: 0;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--ink-soft);
  white-space: nowrap;
}

.money-cell-figure {
  margin: 7px 0 0;
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.025em;
  font-variant-numeric: tabular-nums;
}

.money-cell-figure.positive {
  color: var(--money-in);
}

.money-cell-figure.negative {
  color: var(--money-out);
}

/* --- 3. THE PERIOD ---------------------------------------------------------------------------- */

.money-window {
  margin-top: 14px;
}

/* --- 4. THE LIST AND THE PAPER ---------------------------------------------------------------- */

.money-empty {
  margin: 18px 0 0;
  font-size: 13px;
  color: var(--ink-soft);
}

/* THE EXPORT PUTS THE PAPER ON AN ABSOLUTE LAYER OVER THE LIST; THIS IS A FLEX ROW INSTEAD, and
   the composition is the same one. Measured off the export: the column is 202px inside a 362px
   content width and the receipt starts at 214px - a two-pixel overlap, i.e. none. An absolute layer
   buys that nothing and costs two real things: a ROTATED box paints outside its own rectangle (at
   2deg on a 148px note, about 3px), which is exactly the overhang that puts a 375px document into
   sideways scroll; and paper taller than the list would hang out of the bottom of a container that
   cannot see it. In a row, neither can happen. */
.money-body {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 6px;
}

.money-list {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* The export's own CTA metrics (13.5px/800, 14px/12px inset) rather than PrimaryPill's `cta`
   default of 14.5/12-26: the pill lives in a 190px column here, and at the default the label wraps
   onto two lines. Same object, the column's size. */
.money-cta {
  margin-top: 20px;
  width: 100%;
  padding: 14px 12px;
  font-size: 13.5px;
  text-align: center;
}

.money-artefacts {
  flex: none;
  width: 146px;
  padding-top: 10px;
}

/* The bottom padding is PaperNote's, not this screen's: `torn` owns it, because the cut it applies
   eats into the bottom edge and the copy has to clear it.
   ⚠ AND THE THREE THIS SCREEN DOES SET NOW GO THROUGH `:deep`, because PaperNote's root is a
   positioned wrapper since the tape fix. Padding on the wrapper would have been a transparent
   margin around the receipt rather than an inset inside it - the copy would have sat flush against
   the paper's edges with 13px of page showing outside them. The WIDTH stays on the wrapper: it is
   how wide the object is in the artefact column, which is this screen's business. */
.money-receipt {
  width: 100%;
}

.money-receipt :deep(.tb-paper) {
  padding-top: 15px;
  padding-left: 13px;
  padding-right: 13px;
}

.money-receipt-line {
  display: block;
  font-size: 17px;
  line-height: 1.28;
  overflow-wrap: anywhere;
}

.money-receipt-line + .money-receipt-line {
  margin-top: 2px;
}

.money-receipt-sum {
  text-align: right;
  padding-right: 10px;
}

/* A SQUARE PHOTO WINDOW: 124 of paper width minus Polaroid's own 4px lips = a 124px-tall window in a
   124px-wide one. See the note in the template for why square rather than landscape. */
.money-polaroid {
  width: 132px;
  margin: 26px 0 0 auto;
}

/* The donut under the photograph. It is the full width of the artefact column - wider than the
   polaroid, which is what stops the column reading as one object that got narrower. `--accent` on
   the segments and the per-slice opacity in the template are the whole palette. */
.money-donut {
  width: 100%;
  height: auto;
  margin-top: 18px;
}

/* The stroke comes from the template, one `--cat-*` per slice (see CAT_COLOR in the script). The
   accent stays as the fallback so a category that ever arrives without a colour is a visible ring
   rather than an invisible gap. */
.money-donut .donut-seg {
  stroke: var(--accent);
}

/* THE OWNER'S OWN GLYPHS, painted through their silhouette. A file cannot inherit `currentColor`,
   so the artwork becomes a mask and the colour is the element's own background - the technique
   `.tab-icon` already uses for the bottom bar. Sized to StatRow's icon slot, which is what the six
   inline SVGs fill. */
.cat-icon-file {
  display: block;
  width: 100%;
  height: 100%;
  mask-image: var(--cat-mask);
  -webkit-mask-image: var(--cat-mask);
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  -webkit-mask-size: contain;
}

/* THE ARTEFACTS STEP ASIDE ON A NARROW PHONE. Below 360px of viewport the 146px of paper and the
   figures no longer both fit inside the app's 16px gutters, and a squeezed amount column is a
   budget screen that has stopped doing its job. Paper is the decoration; the figures are the
   screen. */
@media (max-width: 359px) {
  .money-artefacts {
    display: none;
  }
}

/* --- 5-6. THE PANELS -------------------------------------------------------------------------- */

.money-panel {
  margin-top: 14px;
}

.money-panel-note {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--ink-soft);
  text-wrap: pretty;
}

.money-panel .physio-toggle {
  margin-top: 10px;
}

.ledger-week {
  margin-top: 14px;
}
</style>

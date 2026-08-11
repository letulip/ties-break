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
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { useGameStore } from '../../stores/game'
import { ECONOMY } from '../../engine/economy'
// STARTING_FUNDS_CENTS: the ENGINE's own number, not a hand copy – see `startingBudget` below.
// world.ts is already in the UI chunk (PracticeFlow/BracketTabs import from it), so this costs
// nothing at bundle time and removes a "must match" comment that was one retune away from a lie.
import { STARTING_FUNDS_CENTS, ageAtWeek } from '../../engine/world'
// The bill's own arithmetic, so the note under the breakdown quotes the number the engine charges
// rather than a mirror of it - the same rule `startingBudget` above is written under.
import { coachBillRangeCents, coachById, facilityRateCents, tierOf, weeklyBillSplit } from '../../engine/coach'
import type {
  FinanceWindow,
  KitGrade,
  KitLine,
  KitLineView,
  WorldEvent,
  WorldEventCategory,
} from '../../shared/protocol'
import { seasonYear, weekLabel } from '../../shared/dates'
import { formatCents, formatCentsSigned } from '../../shared/money'
import { venueArtUrl } from '../../art/venues'
import { vacationArtUrl } from '../../art/weeks'
// U0 - the shared components (docs/specs/ui-components.md), plus the NINTH, which this screen is
// the reason for: StatRow. docs/specs/ui-components.md deliberately left it out of that slice
// ("it comes with the Money screen in U1, where it has a real caller"), and the three rows below -
// a category, the income line and a ledger entry - are what gave it its shape.
import ConfirmDialog from '../ConfirmDialog.vue'
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
/** One band, corridor-scaled to the family's means, as the `$lo-hi/wk` the toggle prints. Both rates
 *  go through it so the two figures on this panel are computed the same way. */
function weeklyBand(band: readonly [number, number]): string {
  const background = game.snapshot?.profile.background
  if (!background) return ''
  const [cLo, cHi] = ECONOMY.physio.medicalBgFactor[background]
  return `$${Math.round((band[0] * cLo) / 100)}-${Math.round((band[1] * cHi) / 100)}/wk`
}
const physioCostLabel = computed(() => weeklyBand(ECONOMY.physio.retainerPerWeekCents))
// ⚠ THE NUMBER THE BILLS TAB HAS NEVER QUOTED (round-16 #15). `resolvePhysio` (world/injury.ts)
// bills the REHAB rate on every injured week - `if (world.injury !== null)`, BEFORE it looks at the
// toggle at all - and the retainer rate only on a healthy week while the retainer runs. So the one
// figure on this panel described the cheaper of the two rates and the one that is NOT charged while
// she is hurt, and a family with the toggle off read the physio line as $0 on a week that was
// charging them more than the toggle ever would. The behaviour is correct and stays exactly as it
// is; what was wrong is that the screen quoting the family's recurring costs quoted one of them.
const physioRehabLabel = computed(() => weeklyBand(ECONOMY.physio.rehabPerWeekCents))
/** Is she being billed the rehab rate RIGHT NOW - the same test the engine makes (`world.injury !==
 *  null`), so the panel and the ledger cannot disagree about which week this is. */
const injuredNow = computed(() => game.snapshot?.injury != null)

const week = computed(() => game.snapshot?.week ?? 0)
const fundsCents = computed(() => game.snapshot?.fundsCents ?? 0)
const funds = computed(() => formatCents(fundsCents.value))
// The engine's own starting budget, in the engine's own cents. The hand-kept DOLLAR table that sat
// here fed the one formatter in the app that took dollars instead of cents – the ×100 trap P6 was
// written about – and its "must match world.ts" comment was the drift this screen now cannot have:
// retune the engine, and this line retunes with it. tests/money-format.test.ts pins the wiring.
const startingBudget = computed(() => (game.snapshot ? formatCents(STARTING_FUNDS_CENTS[game.snapshot.profile.background]) : ''))

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

// --- WHY THE TRAINING BILL IS NEVER THE QUOTE ---------------------------------------------------
//
// ⚠ THE OWNER'S OTHER HALF (08.08): «на неделях всё еще списывается какая-то рандомная сумма». The
// wobble is real and it stays - `ECONOMY.coach.weekJitterBps` is +/-8% on the weekly bill, the week
// itself varying rather than a bug - but he met it as an unexplained number, and an unexplained
// number in a wallet reads as a swindle rather than as life. This is the sentence that lets him look
// at a week and know why it is not the figure on the coach's card.
//
// EVERY FIGURE IS THE ENGINE'S OWN. `weeklyBillSplit` is the function `resolveBaseCosts` bills
// through and `coachBillRangeCents` is the envelope it lands in, so the note cannot drift from the
// charge the way a hand-written "±8%" would the moment the band is retuned.
const trainingBillNote = computed<string | null>(() => {
  const snap = game.snapshot
  if (!snap) return null
  // ⚠ THE BAND, NOT THE AGE ON THE SCREEN (09.08). `resolveBaseCosts` opens with
  // `const age = ageAtWeek(world.week)` and hands THAT to all three of the calls below - the roster,
  // the facility rate and the split - so a note priced off `snap.ageYears` is quoting a different
  // clock from the one the till charges, and this block's own header ("EVERY FIGURE IS THE ENGINE'S
  // OWN … cannot drift from the charge") is the promise that breaks.
  //
  // It read the same number until now only by accident: `ageYears` WAS the band. The one-clock
  // ruling («есть год рождения и дата. Это всё») makes it HER REAL AGE, while the coach market must
  // stay on the band on purpose - the roster is a pure function of the age with nothing persisted
  // but the chosen id, so keying it to her birthday re-rolls every December career's coach (see the
  // note on `ageAtWeek`). Measured on the identical bug one screen over: a December girl is 16 from
  // week 156 to week 204 while the market had restocked at 17, so the screen spent 49 weeks quoting
  // the development rate against a bill charged at the professional one. The rate rows are
  // 12-16 / 17-22 / 23+, so it bites whenever the two clocks straddle a row.
  //
  // `ageAtWeek(snap.week)` is the idiom `PlanWeekSheet.vue` already prices with.
  const age = ageAtWeek(snap.week)
  const coach = coachById(snap.seed, age, snap.coachId)
  const tier = tierOf(coach)
  const rate = coach ? coach.rateCents : facilityRateCents(age, tier)
  const split = weeklyBillSplit({
    rateCents: rate,
    ageYears: age,
    tier,
    plan: snap.plan,
    background: snap.profile.background,
  })
  const [lo, hi] = coachBillRangeCents(rate, snap.plan, snap.profile.background)
  const quote = coach
    ? `Training quotes at ${formatCents(split.totalCents)} a week – ${formatCents(split.coachCents)} coaching, ${formatCents(split.facilityCents)} courts.`
    : `Court time quotes at ${formatCents(split.facilityCents)} a week – you coach her, so there is no coaching line.`
  return `${quote} No week bills exactly that: a session moves, a court books at a busier hour. Yours runs ${formatCents(lo)}–${formatCents(hi)}.`
})

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
  // ⚠ THE COURT IS ITS OWN ROW (v44, docs/specs/split-the-bill-2026-08.md, owner 08.08: «нам нужно
  // отдельной строчкой списывать тренера, а отдельной рент залов и прочего»). It sits immediately
  // under Coaching because the two are one bill split in two, and the reader should meet them
  // together: the man, then the place. A self-coached family has only the second, which is the
  // honest thing the split fixes - it was being shown "Coaching" for a parent who works free.
  { key: 'facility', label: 'Courts & facility' },
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
  // A court seen from above: the outer fence, the baseline pair and the net across the middle. Drawn
  // on the same 24x24 / 1.5-stroke grid as its neighbours, and deliberately NOT a racket - stringing
  // already owns that picture, and this row is the PLACE rather than the kit.
  facility: ['M4 4.5h16v15H4z', 'M4 12h16', 'M7.5 4.5v15M16.5 4.5v15'],
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
  facility: 'var(--cat-facility)',
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
        value: recorded ? formatCentsSigned(-r.spentCents!) : '–',
        meta: recorded
          ? `${formatCentsSigned(r.earnedCents ?? 0)} in – ${formatCents(r.endFundsCents)} left`
          : `${formatCents(r.endFundsCents)} left`,
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

// --- W3-KIT: HER KIT, AND THE RUNG THE FAMILY BUYS ---------------------------------------------
//
// The owner: «let's make those handles for rackets, shoes and stuff for a user to choose from.
// Somewhere in a ledger maybe?» - so the shop window is this screen, beside the money it costs.
//
// EVERY NUMBER AND EVERY WORD ON IT IS THE ENGINE'S. `snapshot.kit` carries the rung she is on, the
// four rungs with their prices, the fictional-brand copy and her CONDITION on each line
// (engine/world/kit.ts `kitLineViews`). This screen prices nothing, names nothing and grades nothing -
// the same rule the coach market and the planner keep, and the one that matters most here: a price
// the screen multiplied itself is a price the till would not honour.
//
// ⚠ MOVING UP ASKS FIRST, MOVING DOWN DOES NOT, and that mirrors what the engine does with the money.
// Up is a purchase charged the moment it is confirmed; down costs nothing and only changes what the
// family buys next time the cadence comes round. So the confirm is on the irreversible half alone -
// the discipline `signOffer` established, applied to a much smaller decision.
const kitLines = computed(() => game.snapshot?.kit ?? [])
const LINE_TITLE: Record<string, string> = { strings: 'Strings', frame: 'Racket', shoes: 'Shoes' }

/** Her condition on a line, in the parent's words rather than as a number. The bands are the wear
 *  model's own shape - fresh kit is 0 and a spent line is 1 - and the words stop at four, because a
 *  fifth would be a precision the model does not have. */
function wearWord(wear: number): string {
  if (wear < 0.25) return 'Fresh'
  if (wear < 0.55) return 'Fine'
  if (wear < 0.85) return 'Worn'
  return 'Gone'
}

// --- THE DEAL BEHIND THE KIT, AND WHAT IS LEFT OF IT (09.08) --------------------------------------
//
// THE OWNER DIAGNOSED THIS ONE HIMSELF AND HE IS RIGHT: «Списались расходы на весь шмот на 38 неделе
// 34 года, несмотря на наличие спонсора, bills подсвечивает, что всё на нём, но значки free ушли… а
// почему цена в bills отличается от цены в списаниях?… Я понял почему – видимо мы выбрали квоту.
// Значит надо где-то на странице bills писать доступную еще квоту к распределению.»
//
// The allowance is a per-SEASON pot, `world/kit.ts` has always known what was left of it, and the
// purchase dialog was the ONLY surface that ever said so. So the page that promises "her sponsor
// supplies this line" went on promising it after the pot was empty, the `free` badges disappeared
// with no sentence anywhere, and the sticker on this page stopped agreeing with the charge in the
// ledger - which is the same fact, seen from the till's side.
//
// ⚠ NOTHING HERE CHANGES WHAT IS CHARGED. Every figure is `snapshot.kitDeal`, computed by the engine
// off the signed offer (see `KitDealView`); this screen does not subtract a spend from an allowance,
// because the disagreement between two surfaces about that subtraction IS the bug being fixed.
const kitDeal = computed(() => game.snapshot?.kitDeal ?? null)
/** The covered lines in the LETTER's words - the paper says "racquets", the equipment model says
 *  "frame", and a parent reading both must not meet two vocabularies for one thing. */
const KIT_LINE_WORDS: Record<string, string> = { strings: 'strings', frame: 'racquets', shoes: 'shoes' }
const dealCovers = computed(() => {
  const words = (kitDeal.value?.covers ?? []).map((l) => KIT_LINE_WORDS[l] ?? l)
  if (words.length === 0) return ''
  if (words.length === 1) return words[0]
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`
})
/** HOW LONG THE CONTRACT RUNS, which was persisted on the offer and printed nowhere (the owner:
 *  «Непонятно на какое количество лет спонсор контракт заключает, нигде не видно этой информации»).
 *  Seasons AND the two weeks that bound it, because "three seasons" alone still leaves the parent
 *  counting off a calendar he cannot see. */
const SEASON_WORDS = ['', 'One season', 'Two seasons', 'Three seasons', 'Four seasons']
const dealTerm = computed(() => {
  const d = kitDeal.value
  if (!d) return ''
  const seasons = SEASON_WORDS[d.seasons] ?? `${d.seasons} seasons`
  return `${seasons} · ${weekLabel(d.fromWeek)} – ${weekLabel(d.untilWeek)}`
})

// --- THE ACADEMY, WHICH PAYS AND IS NEVER SEEN (backlog #90, measured 09.08) ----------------------
//
// The scholarship is held by half the careers on the bench and it folded $948 of `academy` income
// over four seasons - and it pays as a DISCOUNT ON TRAVEL, so it never appears as a line the family
// can point at. The Calendar's event cards say "academy covers 75%" at the moment of a trip and
// nothing anywhere says what it has been worth. `AcademySupport.coveredCents` has always carried
// exactly that number: travel they have paid since the last annual review.
//
// It belongs on THIS page and beside the sponsor for one reason: they are the same fact from the
// family's side - somebody else is paying part of the bill, and the parent cannot plan against a
// subsidy he cannot see. Read-only, engine-derived, and it changes nothing about what is charged.
const academy = computed(() => game.snapshot?.academy ?? null)
const academyCoverPct = computed(() => Math.round((academy.value?.coverShare ?? 0) * 100))

/** Is any rung on this line PART-paid - the brand covering some of it and the family the rest? That
 *  only ever happens on the purchase that empties the pot, and it is exactly the case the owner
 *  could not explain («почему цена в bills отличается от цены в списаниях»). Read off the engine's
 *  own `payableCents`, never re-derived from the allowance. */
function partCovered(view: KitLineView): boolean {
  return view.rungs.some((r) => r.payableCents > 0 && r.payableCents < r.priceCents)
}

interface PendingKit {
  line: KitLine
  grade: KitGrade
  label: string
  priceCents: number
  payableCents: number
}
const pendingKit = ref<PendingKit | null>(null)

function chooseRung(view: KitLineView, rung: KitLineView['rungs'][number]): void {
  if (rung.owned || game.busy) return
  const ladder = view.rungs.map((r) => r.grade)
  // Down the ladder is free and instant; up the ladder buys the thing, so it asks.
  if (ladder.indexOf(rung.grade) < ladder.indexOf(view.grade)) {
    void game.setKitGrade(view.line, rung.grade)
    return
  }
  pendingKit.value = {
    line: view.line,
    grade: rung.grade,
    label: rung.label,
    priceCents: rung.priceCents,
    payableCents: rung.payableCents,
  }
}

/** ⚠ THE DIALOG HAS TO NAME THE PRICE THE FAMILY IS ACTUALLY PAYING (08.08). It used to quote
 *  `priceCents` unconditionally, so a sponsored line asked "Buy the Kestra Pro Stock for $340?" and
 *  then took $340 - which was true only because the till was ignoring the deal. Now the till honours
 *  the allowance, and a dialog still quoting the sticker would be the same lie in the other
 *  direction. Both numbers come off the engine; this only chooses the sentence. */
const kitConfirmMessage = computed(() => {
  const p = pendingKit.value
  if (!p) return ''
  const tail = 'She plays with it from this week, and every replacement is billed at this level.'
  if (p.payableCents >= p.priceCents) return `Buy the ${p.label} for ${formatCents(p.priceCents)}? ${tail}`
  if (p.payableCents === 0) {
    return `Buy the ${p.label}? Her sponsor covers it in full – ${formatCents(p.priceCents)} off her allowance. ${tail}`
  }
  return `Buy the ${p.label} for ${formatCents(p.payableCents)}? Her sponsor covers ${formatCents(p.priceCents - p.payableCents)} of the ${formatCents(p.priceCents)}. ${tail}`
})

function confirmKit(): void {
  const pending = pendingKit.value
  pendingKit.value = null
  if (pending) void game.setKitGrade(pending.line, pending.grade)
}

// The export's CTA. There is no separate transactions SCREEN to open - the ledger is on this page,
// below the fold - so the button does what the words promise by taking the player to it. The ref is
// on a plain wrapper and not on the Card: a ref on a component yields the component instance, and
// reaching through `$el` for a DOM node is the kind of thing that breaks the day the component
// grows a second root.
const ledgerEl = useTemplateRef<HTMLElement>('ledger')
function showAllTransactions(): void {
  // ⚠ THE LEDGER IS BEHIND A TAB NOW, so the button has to OPEN it before it can scroll to it -
  // otherwise the CTA points at an element that is not in the document and silently does nothing.
  // The scroll waits a tick for the arm to render (`nextTick`), because the ref is null until then.
  screenTab.value = 'history'
  // The glide is a nicety and the ARRIVAL is the promise, so the behaviour is chosen rather than
  // assumed: a player who has asked their system for less motion gets taken there at once. Found
  // by driving it - the verification browser does not animate `behavior: 'smooth'` at all, and a
  // button whose only mode is an animation nobody runs is a button that does nothing.
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  void nextTick(() => {
    ledgerEl.value?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  })
}

// --- THE SCREEN'S OWN TABS (owner, 04.08: «В family budget теперь вообще очень много информации на
// одном экране, предлагаю какие-то вкладки сделать внизу или наверху для переключения между
// разделами») ------------------------------------------------------------------------------------
//
// THE GROUPING IS BY WHAT THE PLAYER IS DOING, NOT BY WHAT THE DATA IS, and the screen already had
// the seam - every block on it answers exactly one of three questions:
//
//   SPENDING  "where is the money going right now?" - the three-cell summary, the 12w/season period
//             switcher, the category column, the receipt/photo/donut. ⚠ These four are ONE tab and
//             cannot be split: the summary figures, the rows and the ring are all reads of
//             `activeFinance`, i.e. of the period switcher. A tab that showed the summary without
//             the control that governs it would be a readout of an invisible setting.
//   BILLS     "what am I signed up to pay?" - the physio retainer and her kit. The only two blocks
//             on this screen that CHANGE anything (a toggle and four buy buttons); everything else
//             is read-only. Putting the two decisions together is also the safety argument: the
//             money you can accidentally spend now lives on one named page.
//   HISTORY   "what has it cost so far?" - every season, and the full transaction ledger. The same
//             record at two zooms, a year per row and a line per row, which is why they belong on
//             one tab rather than one each.
//
// The header (her balance and the week) sits ABOVE the switcher on purpose: it is true on all three
// tabs, and a wallet figure that disappeared when you looked at the ledger would be absurd.
//
// ⚠ NOT A NEW CONTROL. This is `SegmentedRow`, the app's one segmented idiom, wearing the plainer
// look the owner ruled for Stats on 02.08 - see `.money-tabs` in the style block for the ruling and
// the mechanism. Nothing is unmounted for the sake of it: `v-if` is what buys the screen back, and
// each arm is exactly the block that used to be there.
type MoneyTab = 'spend' | 'bills' | 'history'
const screenTab = ref<MoneyTab>('spend')
const TAB_OPTIONS = [
  { value: 'spend', label: 'Spending', title: 'Where the money went in the chosen period' },
  { value: 'bills', label: 'Bills', title: 'The recurring costs the family has signed up to' },
  { value: 'history', label: 'History', title: 'Every season, and every transaction' },
]
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

      <!-- ============================ 1a. THE DEBT STRIP ============================
           W2-ENDINGS. The WARNING PHASE bankruptcy is required to have (adult-tour-and-endings.md
           B4: "a season where the family is visibly running out"). It is the countdown, not a mood:
           the same `snapshot.debt` the stop toast reads, so the two surfaces cannot disagree about
           how long is left, and one solvent week clears it entirely - which is the sentence that
           makes it a spell rather than a sentence. -->
      <p v-if="game.snapshot.debt" class="money-debt" role="status">
        <strong>{{ game.snapshot.debt.weeks }}</strong>
        {{ game.snapshot.debt.weeks === 1 ? 'week' : 'weeks' }} below zero &middot;
        <strong>{{ Math.max(0, game.snapshot.debt.graceWeeks - game.snapshot.debt.weeks) }}</strong>
        before the money runs out for good. One week back in the black clears it.
      </p>

      <!-- ========================= 1b. THE SECTION SWITCHER =========================
           Three tabs over what used to be one very long page. Which block sits behind which tab,
           and why the summary cannot be parted from the period switcher, is argued at
           `TAB_OPTIONS` in the script. The plate is off, per the Stats ruling - see .money-tabs. -->
      <SegmentedRow
        v-model="screenTab"
        class="money-tabs"
        :options="TAB_OPTIONS"
        group-label="Which part of the budget"
      />

      <!-- ============================= 2. THE SUMMARY ============================= -->
      <Card v-if="screenTab === 'spend'" class="money-summary" pad="14px 4px">
        <div class="money-cell">
          <p class="money-cell-label">Total income</p>
          <p class="money-cell-figure positive">{{ formatCents(incomeCents) }}</p>
        </div>
        <div class="money-cell money-cell-mid">
          <p class="money-cell-label">Total spent</p>
          <p class="money-cell-figure negative">{{ formatCents(-spentCents) }}</p>
        </div>
        <div class="money-cell money-cell-end">
          <p class="money-cell-label">Balance</p>
          <p class="money-cell-figure" :class="netCents < 0 ? 'negative' : 'positive'">
            {{ formatCentsSigned(netCents) }}
          </p>
        </div>
      </Card>

      <!-- ============================= 3. THE PERIOD ============================= -->
      <SegmentedRow
        v-if="screenTab === 'spend'"
        v-model="breakdownWindow"
        class="money-window"
        :options="WINDOW_OPTIONS"
        group-label="Budget period"
      />

      <!-- ================= 4. THE CATEGORY COLUMN + THE ARTEFACTS =================
           The list keeps to its own column and the paper is laid over the space beside it, exactly
           as the export composes it. Below 340px of content the artefacts step out of the way
           rather than crowd the figures - see the media query in the style block. -->
      <p v-if="screenTab === 'spend' && !expenseRows.length" class="money-empty">
        No spending in this window yet.
      </p>

      <div v-else-if="screenTab === 'spend'" class="money-body">
        <div class="money-list">
          <StatRow
            v-for="row in expenseRows"
            :key="row.key"
            class="money-row"
            :label="row.label"
            :meta="pctLabel(row.pct)"
            :value="formatCents(-row.cents)"
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
            :value="formatCentsSigned(incomeCents)"
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

          <!-- The jitter, said out loud. It sits UNDER the rows it explains and above the CTA, so a
               reader who has just noticed that Coaching is not the number on the coach's card finds
               the reason in the next line rather than in a help screen. -->
          <p v-if="trainingBillNote" class="money-panel-note money-bill-note">{{ trainingBillNote }}</p>

          <PrimaryPill class="money-cta" variant="cta" @click="showAllTransactions">
            View all transactions
          </PrimaryPill>
        </div>

        <div class="money-artefacts" aria-hidden="true">
          <PaperNote v-if="receipt" class="money-receipt" tilt="2deg" ruled torn>
            <span class="money-receipt-line">{{ receipt.text }}</span>
            <span class="money-receipt-line">{{ weekLabel(receipt.week) }}</span>
            <span class="money-receipt-line money-receipt-sum">
              {{ formatCents(receipt.amountCents ?? 0) }}
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
            <text class="donut-center-num" x="21" y="20.5">{{ formatCents(-totalExpenseCents) }}</text>
            <text class="donut-center-cap" x="21" y="25">spent</text>
          </svg>
        </div>
      </div>

      <!-- ============================== 5. THE LEVERS ==============================
           R9-5: recurring budget levers live with the money, not on Home. -->
      <Card v-if="screenTab === 'bills'" class="money-panel">
        <Eyebrow as="h2">Budget</Eyebrow>
        <label class="physio-toggle">
          <input type="checkbox" :checked="physioActive" :disabled="game.busy" @change="togglePhysio" />
          <span>Physio recovery</span>
          <span class="hint physio-cost">{{ physioCostLabel }}</span>
        </label>
        <p class="money-panel-note">
          Weekly retainer - lowers injury risk, shortens recoveries and adds a little condition each
          week. Charged on the weeks she is fit.
        </p>
        <!-- ⚠ THE SECOND RATE, AND IT IS NOT A SECOND LEVER (round-16 #15). Rehab is not something
             the family switches on: the engine bills it on every injured week whether the toggle is
             set or not, because a hurt girl is being treated. The line therefore sits OUTSIDE the
             toggle's own note and says so in as many words - a figure indented under a checkbox
             would read as a second thing to turn off. Emphasised only while she is actually hurt,
             which is the week it stops being a number and starts being the bill. -->
        <p class="money-panel-note" :class="{ 'money-panel-note-live': injuredNow }">
          <template v-if="injuredNow">She is hurt, so this week bills rehab:</template>
          <template v-else>An injured week bills rehab instead:</template>
          <b>{{ physioRehabLabel }}</b
          >, with or without the retainer above.
        </p>
        <p class="money-panel-note">Started this career with {{ startingBudget }}.</p>
      </Card>

      <!-- ========================= 5b. HER KIT, AND WHAT IT COSTS ===================
           W3-KIT. Three lines, four rungs each. The rung she owns is marked; a dearer one asks
           before it charges, a cheaper one just takes effect at the next purchase. Every price,
           name and condition word comes off the snapshot - see the script. -->
      <Card v-if="screenTab === 'bills'" class="money-panel money-kit">
        <Eyebrow as="h2">Her kit</Eyebrow>
        <!-- ⚠ THE OLD LINE SAID "plays truer" AND THAT WAS THE ONE THING IT DOES NOT DO (08.08).
             engine/equipment.ts is explicit: fresh kit is EXACTLY neutral at every rung, every
             multiplier is 1, and wear only ever subtracts - so a pro frame is not better than a new
             composite one, it is still good in week 24 when the composite is not. The owner asked to
             be told what the tiers actually give (his words are in tests/equipment.test.ts - THIS IS
             A TEMPLATE, and tests/template-copy-rules.test.ts bans Cyrillic in one, comments
             included). He could not tell, and the reason is that the screen was promising an upside
             the model refuses to give. What it says now is the true and more interesting sentence. -->
        <p class="money-panel-note">
          New kit plays the same whatever it cost – what a better rung buys is TIME before it goes
          off, and it is billed every time the family replaces it, not once.
        </p>
        <!-- ⚠ THE SPONSOR'S RUNNING BALANCE, AND IT IS THE POINT OF THIS BLOCK. The allowance is a
             pot for the season, not a discount rate: once it is spent the same kit is billed to the
             family at the sticker price, which is why the free badges vanish and why this page and
             the ledger looked as though they disagreed. The term is here for the same reason - how
             many seasons the contract runs was persisted and printed on no surface at all. Every
             number is the engine's (`snapshot.kitDeal`). -->
        <div v-if="kitDeal" class="kit-deal">
          <div class="kit-deal-head">
            <span class="kit-deal-brand">{{ kitDeal.brand }}</span>
            <span class="kit-deal-term">{{ dealTerm }}</span>
          </div>
          <p class="kit-deal-note">
            They supply her {{ dealCovers }}, and she enters at least
            {{ kitDeal.minEventsPerSeason }} tournaments a season.
          </p>
          <StatRow
            class="money-row"
            label="Allowance left this season"
            :meta="`${formatCents(kitDeal.spentCents)} of ${formatCents(kitDeal.allowanceCents)} used`"
            :value="formatCents(kitDeal.remainingCents)"
            :tone="kitDeal.remainingCents > 0 ? 'positive' : 'negative'"
          />
          <p v-if="kitDeal.remainingCents === 0" class="kit-deal-note is-spent">
            The season's allowance is spent. Her {{ dealCovers }} are billed to the family at full
            price until the new season starts – the deal still keeps them fresh, and it still pays
            again from the first week of next season.
          </p>
        </div>
        <div v-for="view in kitLines" :key="view.line" class="kit-line">
          <div class="kit-line-head">
            <span class="kit-line-name">{{ LINE_TITLE[view.line] ?? view.line }}</span>
            <span class="kit-line-state">{{ wearWord(view.wear) }}</span>
          </div>
          <p class="kit-line-blurb">{{ view.blurb }}</p>
          <!-- Each rung now carries what it BUYS (weeks of good kit) beside what it costs, and the
               price is the engine's `payableCents` - what the family really hands over once a deal's
               allowance is applied - never a discount this screen worked out for itself. -->
          <div class="kit-rungs">
            <button
              v-for="rung in view.rungs"
              :key="rung.grade"
              class="kit-rung"
              :class="{ owned: rung.owned }"
              :disabled="game.busy"
              :aria-pressed="rung.owned"
              @click="chooseRung(view, rung)"
            >
              <span class="kit-rung-name">{{ rung.label }}</span>
              <span class="kit-rung-good">{{ rung.goodWeeks }} good weeks</span>
              <span v-if="rung.payableCents < rung.priceCents" class="kit-rung-price is-covered">
                <s>{{ formatCents(rung.priceCents) }}</s>
                {{ rung.payableCents === 0 ? 'free' : formatCents(rung.payableCents) }}
              </span>
              <span v-else class="kit-rung-price">{{ formatCents(rung.priceCents) }}</span>
            </button>
          </div>
          <!-- ⚠ THE SECOND HALF OF THE SAME FIX. "They pay for what she buys until the allowance
               runs out" was true and unfalsifiable: the parent could not tell whether it had. The
               three arms are the three states the till can actually be in, and the middle one is
               the one that produced the complaint - a struck price with money still beside it is
               the allowance ending mid-purchase, not a discount rate. -->
          <p v-if="view.sponsored && kitDeal" class="kit-line-sponsored">
            <template v-if="kitDeal.remainingCents === 0">
              Her sponsor keeps this line fresh, but the season's allowance is gone – this one is
              the family's to buy until next season.
            </template>
            <template v-else-if="partCovered(view)">
              Her sponsor supplies this line and keeps it fresh. Only
              {{ formatCents(kitDeal.remainingCents) }} of the allowance is left, so a dearer rung is
              part-paid – the struck price is the sticker and the price beside it is the family's
              share.
            </template>
            <template v-else>
              Her sponsor supplies this line – they keep it fresh whatever she plays, and they pay
              for what she buys while {{ formatCents(kitDeal.remainingCents) }} of this season's
              allowance is left.
            </template>
          </p>
        </div>
      </Card>

      <!-- ======================= 5c. HER ACADEMY, AND WHAT IT HAS PAID ===============
           Backlog #90. The scholarship pays as a discount on every fare, so it never becomes a line
           the family can see - the calendar says "academy covers 75%" at the moment of a trip and
           the total is nowhere. `coveredCents` is the engine's own running figure since the last
           annual review, which is the same shape as the sponsor's allowance above it. -->
      <Card v-if="screenTab === 'bills' && academy" class="money-panel">
        <Eyebrow as="h2">Her academy</Eyebrow>
        <p class="money-panel-note">
          They take {{ academyCoverPct }}% off every trip she enters – the travel figures on the
          calendar and in the ledger are already net of it, and it is reviewed once a year.
        </p>
        <StatRow
          class="money-row"
          label="Travel they have paid"
          meta="since the last review"
          :value="formatCents(academy.coveredCents)"
          tone="positive"
        />
        <p class="money-panel-note">With them since {{ weekLabel(academy.sinceWeek) }}.</p>
      </Card>

      <!-- ============================== 6. THE CAREER, BY YEAR ======================
           One row per season she has finished. Read-only, and honest about the years it cannot
           answer for - see the script for why some rows say nothing. -->
      <Card v-if="screenTab === 'history'" class="money-panel money-years">
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
      <div v-if="screenTab === 'history'" ref="ledger">
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
              :meta="formatCents(row.balanceAfter)"
              :value="formatCentsSigned(row.event.amountCents ?? 0)"
              :tone="(row.event.amountCents ?? 0) < 0 ? 'negative' : 'positive'"
            />
          </div>
        </Card>
      </div>

      <ConfirmDialog
        v-if="pendingKit"
        :message="kitConfirmMessage"
        confirm-label="Buy it"
        @confirm="confirmKit"
        @cancel="pendingKit = null"
      />
    </ScreenShell>
  </template>
</template>

<style scoped>
/* The debt strip. Amber rather than red: the family is running out, not finished, and the whole
   point of the grace window is that this state is recoverable right up until it is not. */
.money-debt {
  margin: 0 0 14px;
  padding: 10px 12px;
  border-radius: var(--radius-control);
  border: var(--stroke-hair) solid var(--tier-high);
  background: rgba(226, 130, 47, 0.1);
  font-size: 13px;
  line-height: 1.45;
  color: var(--ink-2);
}

.money-debt strong {
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

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

/* --- 1b. THE SECTION SWITCHER ------------------------------------------------------------------ */

/* ⚠ NO PLATE AROUND THIS SWITCH, and it is the SAME ruling Stats carries (owner, 02.08: «Мне не
   нравится круглая обводка у переключателя уровня турниров в stats, без нее было лучше... Давай
   просто кнопки оставим и всё»). He ruled on a control, not on a screen: the app has ONE segmented
   row, and a second instance of it that kept the panel fill and the hairline would be the app
   disagreeing with itself two taps apart. Copied deliberately rather than shared, exactly as
   `.stats-ladder-row` did it - scoped-over-shared wins on specificity ((0,2,0) with the data-v
   attribute vs the sheet's (0,1,0)), so no `!important` and no edit to src/style.css.
   ⚠ THE PERIOD SWITCH BELOW KEEPS ITS PLATE. That one is not the same object doing the same job:
   these tabs are the page's own chapters, the 12w/season pills are a filter INSIDE one of them, and
   the plate is what says so. Two identical-looking rows stacked six pixels apart would read as one
   broken control. */
.money-tabs {
  padding: 0;
  border: none;
  border-radius: 0;
  background: none;
  /* «и с отступом внизу небольшим» (owner, 05.08). The switcher had none at all, so the first block
     of whichever chapter is open opened flush against the pills. Same 14px `.more-tabs` has carried
     since it shipped, so the two screens he named in one sentence breathe the same amount. */
  margin-bottom: 14px;
}

/* ⚠ BIGGER, BECAUSE 27px IS NOT A TOUCH TARGET (owner, 05.08: «Верхние переключатели-вкладки в
   ledger и настройках сделать немного крупнее и с отступом внизу небольшим»). MEASURED in the
   browser at his own 576-wide viewport before touching anything: the pill was 27px tall - against
   51px for the bottom bar's `.tab-btn`, which is the app's own answer to "how big is a thing you
   navigate with", and against the 44px both platform guidelines ask for. It was the smallest
   control on the page by a wide margin.

   ⚠ AND IT IS SCOPED TO THE CHAPTER PICKERS, NOT TO `.tab-pill`. The shared pill in src/style.css
   is also the draw's round switcher and the 12w/season filter six pixels below this row - growing
   it globally would inflate a filter INSIDE a chapter to the size of the chapter picker above it,
   which is the "two identical-looking rows stacked six pixels apart" the note above is about. So
   the same copy-not-share the four declarations above already use, for the same reason.

   `:deep`, because the pills are SegmentedRow's children: a scoped selector reaches the child's
   ROOT (which is why the block above works unaided) and stops there. */
.money-tabs :deep(.tab-pill) {
  padding: 10px 18px;
  font-size: 14px;
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

/* The rehab line while she is actually hurt: the same note, in the body colour, because on that week
   it describes money leaving the account rather than money that might. No new register, no plate -
   a bill is not an alert. */
.money-panel-note-live {
  color: var(--text);
}

/* The bill note lives in the category COLUMN rather than inside a panel, so it needs the breathing
   room a Card would otherwise have given it. Nothing else about it differs. */
.money-bill-note {
  margin: 14px 2px 0;
}

.money-panel .physio-toggle {
  margin-top: 10px;
}

.ledger-week {
  margin-top: 14px;
}

/* --- 5b. HER KIT ------------------------------------------------------------------------------
   Three stacked lines, each with a row of four rungs. The rungs WRAP rather than scroll: at 375px
   four labels of up to sixteen characters cannot sit on one row, and a horizontally scrolling strip
   of buttons hides the very option a player came to find. Two by two is legible and complete. */
/* THE DEAL, ABOVE THE THREE LINES IT PAYS FOR. It sits inside the same card rather than in one of
   its own: the allowance is not a second subject, it is the reason the prices below it read the way
   they do, and a card between them would put a page break in the middle of one sentence. */
.kit-deal {
  margin-bottom: 4px;
}

.kit-deal-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.kit-deal-brand {
  font-family: var(--font-heading);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: -0.015em;
  color: var(--ink);
}

/* The term. Quiet, tabular and on the same line as the brand, because "how long does this run" is a
   fact the reader wants beside the name and never instead of it. */
.kit-deal-term {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.kit-deal-note {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.35;
  color: var(--ink-soft);
  text-wrap: pretty;
}

/* An empty pot is the one state on this card that changes what the family pays, so it is the one
   that is allowed a colour. */
.kit-deal-note.is-spent {
  color: var(--ink);
}

.kit-line {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

.kit-line:first-of-type {
  border-top: none;
  padding-top: 0;
}

.kit-line-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.kit-line-name {
  font-family: var(--font-heading);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: -0.015em;
  color: var(--ink);
}

.kit-line-state {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--ink-soft);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.kit-line-blurb {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.35;
  color: var(--ink-soft);
  text-wrap: pretty;
}

.kit-rungs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-top: 10px;
}

.kit-rung {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 8px 10px;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  min-width: 0;
}

.kit-rung:disabled {
  opacity: 0.5;
  cursor: default;
}

/* The rung she is on is the STATE, not a selection highlight: it stays legible when the card is
   disabled mid-request, which a colour-only mark would not. */
.kit-rung.owned {
  border-color: var(--accent);
  box-shadow: inset 0 0 0 1px var(--accent);
}

.kit-rung-name {
  font-size: 12px;
  font-weight: 700;
  color: var(--ink);
  overflow-wrap: anywhere;
}

.kit-rung-price {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
}

/* ⚠ WHAT THE RUNG BUYS, ABOVE WHAT IT COSTS (08.08). It is quieter than the price because the price
   is still what the parent is deciding with - but it has to be ON the button, because the button is
   where the four-times bill gets pressed and "24 good weeks against 9" is the whole argument for it. */
.kit-rung-good {
  font-size: 10.5px;
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
}

/* A line the brand is paying for: the sticker is struck through and what the family actually hands
   over sits beside it, in the money-in colour the ledger already uses for somebody else's money. */
.kit-rung-price.is-covered {
  color: var(--money-in);
}
.kit-rung-price.is-covered s {
  color: var(--ink-soft);
  opacity: 0.7;
  margin-right: 4px;
}

.kit-line-sponsored {
  margin: 8px 0 0;
  font-size: 11.5px;
  line-height: 1.35;
  color: var(--money-in);
}
</style>

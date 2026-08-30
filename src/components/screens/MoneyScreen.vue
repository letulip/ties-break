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
import { ECONOMY, kidPrizeShareBps, managerCommissionBps } from '../../engine/economy'
// STARTING_FUNDS_CENTS: the ENGINE's own number, not a hand copy – see `startingBudget` below.
// world.ts is already in the UI chunk (PracticeFlow/BracketTabs import from it), so this costs
// nothing at bundle time and removes a "must match" comment that was one retune away from a lie.
import { ASSET_NAME_MAX_CHARS, STARTING_FUNDS_CENTS, ageAtWeek } from '../../engine/world'
// The bill's own arithmetic, so the note under the breakdown quotes the number the engine charges
// rather than a mirror of it - the same rule `startingBudget` above is written under.
import { coachBillRangeCents, coachById, facilityRateCents, tierOf, weeklyBillSplit } from '../../engine/coach'
import type {
  FinanceWindow,
  KitGrade,
  KitLine,
  KitLineView,
  ShopRowView,
  WorldEvent,
  WorldEventCategory,
} from '../../shared/protocol'
import { seasonYear, weekLabel } from '../../shared/dates'
import { formatCents, formatCentsSigned } from '../../shared/money'
import { venueArtUrl } from '../../art/venues'
import { vacationArtUrl } from '../../art/weeks'
// ⭐ ROUND 30 #5 – one picture per card on the two chapters below. Its header carries the whole
// contract: a key with no painting yet returns null and the card simply draws without a band.
import { BILLS_ART_KEYS, shelfArtUrl } from '../../art/shelf'
// The scholarship's share, from the module the two event cards read it out of. Same rate, same
// rounding – this page reports it as a season total and they print it per trip.
import { useAcademyCoverPct } from '../../composables/eventCard'
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

// =================================================================================================
// ⭐⭐⭐ ROUND 26 #5b – HER SHARE, ON THE SCREEN THAT IS ABOUT MONEY
// =================================================================================================
//
// THE OWNER, 24.08: «Проверь пожалуйста что со всех выигрышей после своего счета в банке в 18 лет
// она получает свои отчисления и неплохо бы об этом где-то игроку сообщать, кстати».
//
// ⚠ THE MEASUREMENT SAYS THE MECHANIC IS SOUND AND ONLY THE TELLING WAS MISSING. `tools/
// kid-share-audit.ts` walked 36 careers past her eighteenth and rebuilt every cheque from outside
// the till (`prizeCentsFor` on the `tournament` row's own `finishIdx`, `kidPrizeShareCents` on her
// real age): 4,737 paying cheques from eighteen, every one paid the exact ramp amount to the cent,
// none skipped, one writer. So this is a surface, not a fix.
//
// ⚠ AND WHY IT IS THIS SCREEN. Round-23 #18 put her balance on HER page, which is right and is not
// where a parent looks at money. The Money screen is – and it was the one place the transfer could
// not be seen at all: the `info` row `finalizeTournament` writes carries no `amountCents` (booking
// it as a family expense would count the same cents twice against `careerTotals.spentCents`), and
// `snapshot.financialEvents` filters on exactly that. So the ledger showed a prize row that had
// quietly shrunk and nothing that said where the rest went.
//
// ⚠ THE SENTENCE IS HONEST ABOUT THE DIRECTION, which is the mechanic the owner asked for – «родитель
// смотрит, как его доля уменьшается». It says the cheque is split BEFORE this account sees it,
// because that is what the till does (`world.fundsCents += familyShare`), and it says it without
// turning into a complaint: the money is hers and the page states it as a fact.
//
// ⚠ EVERY FIGURE IS THE ENGINE'S OWN – `trainingBillNote`'s rule twenty lines down and
// `startingBudget`'s above. The percentage is `kidPrizeShareBps`, the very function the till divides
// by, read at HER AGE (`snapshot.ageYears`, the one-clock ruling of 09.08 – the same input
// `finalizeTournament` uses); the ceiling is `ECONOMY.kidShare`; and the balance sentence is the
// engine-composed `snapshot.life.ownAccount` (kidLife.ownAccountNote), reused rather than re-worded
// so her page and this strip can never promise different shares.
//
// ⚠⚠ ...AND ON 27.08 HE MOVED IT DOWN THE PAGE, WITHOUT TAKING IT AWAY: «вместо вот этой некрасивой
// и большой плашки на вкладке бюджет… эту плашку можно оставить может быть, но переместить вниз, она
// не главная». The same message asked for her cut on the WEEK RECAP's Finances tile, which is where
// he actually reads the week – so the SHORT telling now lives there (WeekRecapCard.vue, `Her cut
// 10% $sum` as a memo under the balance) and this strip keeps the long one at the FOOT of the
// screen. It is section 9 of the template now, not 1a-bis, and it is still outside every tab guard.
//
// ⚠ WHAT DID NOT MOVE IS THE ARITHMETIC. Both surfaces state the split; neither subtracts it twice.
// `finalizeTournament` credits the family `prize − herShare`, so every income figure on both screens
// is already net – which is exactly what this strip's second sentence has always said out loud.
const kidShareBps = computed(() => kidPrizeShareBps(game.snapshot?.ageYears ?? 0))

// ⭐⭐⭐ ROUND 29 PART THREE P3 – THE MANAGER'S COMMISSION, for the advertising card's second line.
//
// HIS RULING, 29.08: «как менеджер может от этого что-то получать в свою очередь. 10-20% например…
// контракт на полную сумму ребенку приходит на почту, после подписания видим на счету уже
// родительский кат.» So the fee is what the parent earns, and the letter never quotes a split.
//
// ⚠ NOT COMPUTED OFF A SNAPSHOT, because it depends on no career: it is the same sentence for a
// family with six deals and for one that has never been written to. `staffResultShareBps` on the
// coaches page is the same shape for the same reason – bps to percent is a display conversion and
// nothing more; the logic stays in bps, where the engine keeps it.
const commissionPct = managerCommissionBps() / 100
/** Null before the ramp starts – there is no account, no transfer and nothing to explain yet, which
 *  is exactly when `ownAccountNote` returns '' too. */
const kidShareNote = computed<string | null>(() => {
  const snap = game.snapshot
  if (!snap || kidShareBps.value <= 0) return null
  const held = snap.life.ownAccount
  return held.length > 0 ? held : null
})

// --- THE PERIOD SWITCHER -----------------------------------------------------------------------
// U0's SegmentedRow finally absorbs this control. Its own header says so: "THE MONEY SCREEN'S
// 12w/season toggle is `.option-row` / `.option-pill`, a THIRD shape. Money is U1's screen;
// converging it belongs with whoever ports it, and it should then come here." It has.
//
// NB the ref must NOT be named `window`: Vue's template compiler treats `window` as the browser
// global (it is on the template global-allowlist), so a ref by that name is unreachable from the
// template and the toggle would silently no-op.
const breakdownWindow = ref<'12w' | 'season'>('12w')
// ⚠⚠ ROUND 30 #4 – «THIS SEASON», AND IT IS NOT OURS TO RENAME.
//
// Round 29 folded in a fix for round 27 #8 and renamed this tab `This season` → `Season so far` /
// `So far` on the way past. THE OWNER, 30.08: «В Family budget вкладка This season изменилась на
// So far. Я это не просил. Верни как было пожалуйста». It is restored, and the prohibition is now
// CLAUDE.md invariant 4: a label may only change when the task ASKED for it, and fixing something
// adjacent is not permission.
//
// ⚠ ROUND 27 #8 IS STILL TRUE AND STILL UNSOLVED. His complaint was real – «в History расход за
// сезон написан 36 тысяч, а на вкладке расходов 25 тысяч» – and the ARITHMETIC WAS NEVER WRONG:
// both figures are right about DIFFERENT seasons. This toggle folds the CURRENT 52-week block
// (34 weeks old on the save he reported from) while the history card below lists seasons that have
// FINISHED. The rename was never the fix, so restoring the word re-opens no defect; it only stops
// answering a question he did not ask. The two-seasons confusion waits for him to choose a repair.
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
// ⚠ 'business' (v66) is INCOME-side too – the merch brand's and the academy's weekly lines – and
// must never appear as a spending row, exactly as 'interest' must not.
type ExpenseCategory = Exclude<WorldEventCategory, 'income' | 'sponsor' | 'interest' | 'academy' | 'business'>
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
  // v59, the travelling team: the SALARIED people beyond the coach – the masseur today. Its own row
  // beside the clinic bucket above, deliberately: a salary folded into 'Fitness & medical' would be
  // the academy's invisible $20,879 again (round 23 #16) – paid every week and findable nowhere.
  { key: 'staff', label: 'Support staff' },
  // Season planner (v13): the two planned spends get their own rows - a vacation package is a real
  // money sink the owner wants to see, and the practice court fee is the small recurring one.
  { key: 'vacation', label: 'Vacations' },
  { key: 'practice', label: 'Practice matches' },
  // ⭐⭐ THE COLLEGE BILL (round 21, docs/specs/the-college-tariff-2026-08.md; owner 17.08 asked for
  // legible rungs, transparent payment and an annual drawdown – his words are in the spec).
  //
  // ⚠⚠ THE ENGINE HAS CHARGED THIS SINCE v51 AND THIS SCREEN HAS NEVER SHOWN IT. `resolveCollegeBill`
  // debits `familyPerYearCents / 52` every week she is enrolled and writes a `tuition` ledger row,
  // and because `tuition` was missing from this table the money fell into 'Other' – the one bucket
  // whose whole job is to be too small to ask about. So the family's largest single outgoing during
  // four years of the game was drawn as a rounding error, in the screen built to answer where the
  // money went. The drawdown was real; only the reporting of it was missing.
  //
  // ⚠ IT SITS LAST BEFORE 'Other' RATHER THAN NEXT TO 'Coaching' because it is not a tennis cost –
  // `WorldEventCategory`'s own note calls it "the first cost in the game that is not tennis" – and
  // because it is the only row here that can be the whole bill for a year at a time.
  { key: 'tuition', label: 'College tuition' },
  // ⚠ v63, THE SHOP – AND THIS ROW IS A NET, NOT A GROSS, WHICH IS THE ONE THING TO KNOW ABOUT IT.
  // Buying books a negative and selling books a positive under the SAME category (the idiom a
  // cancelled vacation already uses), and `financeWindow` folds signed totals – so a car bought for
  // $110,000 and sold for $91,091 inside one window shows here as the $18,909 it actually cost. That
  // is the shop's whole thesis on one line (spec §3b: the vehicle family exists to LOSE money). The
  // two gross prices are on the ledger tab, one row each way, where gross flows belong.
  // ⚠ A window in which the family only BOUGHT therefore shows the full price, which is correct and
  // is also why §2e-5 exists: the shelf must not be the biggest thing on this list before season 4.
  { key: 'shop', label: 'The shop' },
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
  // The massage table, seen from the side: the bed, two legs, and the head-end bolster - the one
  // piece of furniture the staff row is about. Same 24x24 / 1.5-stroke grid as its neighbours, and
  // deliberately not a person: every other glyph in this table is the thing bought, not the buyer.
  staff: ['M3.5 12.5h17', 'M6.5 12.5v6M17.5 12.5v6', 'M5.5 10.2a1.5 1.5 0 1 1 3 0'],
  // A graduation cap: the board, the crown under it, the tassel. Drawn on the same 24x24 / 1.5-stroke
  // grid, and deliberately not a building or a dollar – the row is the DEGREE she is paying for, and
  // every other glyph in this table is the thing bought rather than the money.
  tuition: ['M3 9l9-4 9 4-9 4-9-4z', 'M7 11v4.2c0 1.2 2.2 2.3 5 2.3s5-1.1 5-2.3V11', 'M20.2 9.5v4.5'],
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
  staff: 'var(--cat-staff)',
  vacation: 'var(--cat-vacation)',
  practice: 'var(--cat-practice)',
  tuition: 'var(--cat-tuition)',
  shop: 'var(--cat-shop)',
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
        // ⭐ ROUND-17 #13 – TWO FIGURES ABOUT ONE YEAR, and the third one is gone rather than joined
        // by a fourth. The owner, 12.08: «там некуда добавлять, и так же на "кашу" похоже, надо
        // подумать что там лучше показывать, а лишнее убрать вообще.»
        //
        // WHAT HE WAS READING: `18598 in · 14783 left · -11815` - the cost, what came in, and the
        // family's balance at the year's end. Three numbers that look unrelated, and they ARE
        // unrelated: the first two are about THE SEASON and the third is a running career total.
        //
        // ⚠ AND THE ARITHMETIC THAT WOULD HAVE JOINED THEM DOES NOT CLOSE - MEASURED, on his own
        // save, every season of it. `income - spend = delta` holds exactly (7 of 7). The other half,
        // `previous end + delta = end`, FAILS on every chained row: 2032 is out by $1,103, 2033 by
        // $402, 2034 by -$930, 2035 by -$1,336, 2036 by -$1,049, 2037 by -$1,645. That is not a bug
        // in the ledger - the season window deliberately ENDS AT THE WRAP-UP WEEK and excludes the
        // off-season (see `SeasonHistoryEntry.spentCents` and `maybeFireSeasonWrapUp`), so weeks
        // 50-51 move the balance without moving the delta. Printing all four terms and inviting the
        // player to check them would therefore have shipped an identity that is false by ~$1,600.
        //
        // SO THE BALANCE LEAVES THE ROW. The headline stays what the year COST, which is the
        // question this panel was built to answer and the owner's own earlier ask («история затрат
        // за карьеру по годам»); the sub-line stays what came IN, because a cost with no income
        // beside it is the same shrug in reverse. Both are about the same twelve months and in the
        // same units, so a reader can relate them without being told to. The family's balance is on
        // this screen's own header, where a running total belongs.
        value: recorded ? formatCentsSigned(-r.spentCents!) : '–',
        meta: recorded ? `${formatCentsSigned(r.earnedCents ?? 0)} in` : 'not recorded',
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
//
// ⭐⭐ ROUND-23 #17 – AND THE PRICE ON THE BUTTON IS A QUOTE, WHICH IS NOW SAID OUT LOUD. The owner,
// 19.08: «Перед ценами на карточках Bills написать "Around", тогда точно не будет вопросов "почему
// ракетка стоит 920, а мы заплатили 1070?"»
//
// HIS TWO NUMBERS RECONCILE EXACTLY, and that is what makes this a copy fix rather than a bug.
// `kitLinePriceCents` quotes the MID of the family's band times the rung factor: middle family,
// `pro` frame = mid($180-280) x 4 = $920.00, which is the figure on his card to the cent. The
// RECURRING bill is a different arithmetic on the same band - `gearHitsUpTo` draws a fresh
// `pickInt($180, $280)` per replacement and world.ts multiplies it by the same rung factor - so
// $1,070 is a $267.50 draw, comfortably inside the band. His own ledger shows the same swing on the
// line that replaces fastest: four restrings at $127.40 / $136.72 / $160.20 / $156.84 against a card
// that says $146.00.
//
// ⚠ THE ONE THING THIS WORD MUST NOT BE READ AS. Buying UP a rung from this button charges
// `kitLinePriceCents` to the cent (`setKitGrade`), so the confirm dialog names an exact price and
// takes exactly that. "Around $920" is true of $920; what it qualifies is the LIFE of the rung -
// the note above the ladder already says the price is "billed every time the family replaces it,
// not once", and it is those replacements that come out anywhere in the band.
//
// ⚠ AND IT GOES ON NOTHING ELSE ON THIS TAB. The owner's warning is a real trap: a qualifier on an
// exact figure is a new lie in place of an old confusion. The audit, row by row:
//   * kit rung prices          – A QUOTE. The word goes here. (Above.)
//   * "Started this career with $8,000"   – a constant that never moves. Committed, historical.
//   * kit deal "$2,463.78 of $3,000 used" / "Allowance left this season" – a contract figure and a
//     real ledger total. Both exact, both already spent or already promised on paper.
//   * academy "Travel they have paid"     – the engine's own running total of money already paid.
//   * physio "$45-70/wk" / the rehab rate – `weeklyBand` prints the TRUE bounds of the corridor, so
//     the figure is already an interval. "Around $45-70/wk" would qualify a range with a range.
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
/** ⭐ ROUND 29 PART FOUR P6/§8 – the portfolio shelf, engine-derived rows (`AdPortfolioRow`), empty
 *  before eighteen. This screen renders states and formats money; it decides nothing. */
const adPortfolio = computed(() => game.snapshot?.adPortfolio ?? [])
// ⭐ ROUND 29 PART FOUR P7/P8 – fame, the engine's own whole number (rounded ONCE at the snapshot
// boundary, `condition`'s rule); this screen never re-rounds it and never re-derives the fold.
const fame = computed(() => game.snapshot?.fame ?? 0)
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
const academyCoverPct = useAcademyCoverPct()

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
// ================================ THE SHELF (v63) =================================================
// docs/specs/the-shop-2026-08.md §2, §3a-c. The parent's own money, and the first screen in this game
// where it is his to enjoy.
//
// ⚠⚠ EVERY NUMBER BELOW IS THE ENGINE'S. This block reads `snapshot.shop` and formats it – it never
// prices a rung, never applies a rate, never subtracts a paid price from a current one and never
// rounds a percentage. `shopView` (engine/world/shop.ts) did all four, once, which is the same rule
// `kitLines` above is written under and the reason §5 stores `valueCents` instead of deriving it.
const shop = computed(() => game.snapshot?.shop ?? null)
const shopRows = computed<ShopRowView[]>(() => shop.value?.rows ?? [])
/** The three families, in the order the shelf is read. The note under each is what the family IS
 *  FOR – a shop where the only difference is price is a list, not a decision (spec §3). */
const SHOP_FAMILIES: { key: ShopRowView['family']; title: string; note: string }[] = [
  {
    key: 'investment',
    title: 'Investments',
    note: 'Money that stays money. Each one names a minimum, not a price – put in what you like above it.',
  },
  {
    key: 'car',
    title: 'Cars',
    note: 'Every one of these is worth less next season than it is today. That is what a car is.',
  },
  { key: 'house', title: 'Property', note: 'Slow, large, and the end of paying somebody else rent.' },
  // ⭐⭐ ROUND 29 PART FOUR P7 – THE PARENT'S OWN BUSINESS, and the first rung on the shelf that
  // EARNS. His words are in `shopBusinessNote` in the comment block below (Cyrillic may not appear
  // in a template, and this array is read into one). The note says what the family is FOR – §3's
  // own rule – and names the axis out loud: fame, never rank.
  {
    key: 'business',
    title: 'The business',
    note: 'The first thing on this shelf that earns. What it brings in follows how known she is – the shoots and the titles – not her ranking.',
  },
  // ⭐⭐ ROUND 29 #5 – THE THREE STOREYS THE OWNER ASKED FOR. His words are in `shopEliteNote` in the
  // comment block below (Cyrillic may not appear in a template, and this array is read into one).
  // Each note says what the FAMILY is for, which is §3's own rule: «a shop where the only difference
  // is price is a list, not a decision».
  {
    key: 'boat',
    title: 'On the water',
    note: 'Ordered, not bought – the money goes now and the boat comes years later. Every one of them costs a wage a week to keep.',
  },
  {
    key: 'plane',
    title: 'In the air',
    note: 'The family aeroplane. It takes half the fare off every trip to a tournament, and it is kept the way an aeroplane is kept.',
  },
  {
    key: 'academy',
    title: 'Her academy',
    // ⭐ ROUND 29 PART FOUR P7 – the second sentence is «нам нужна академия, которая зарабатывает»
    // made visible: each stage earns weekly once built, scaled by the seasons she finished high.
    note: 'Four stages, in order, and each one is a decision. Every stage earns once it is built – the higher and longer she placed, the more it brings in – and it outlives the career.',
  },
]
function shopRowsOf(family: ShopRowView['family']): ShopRowView[] {
  return shopRows.value.filter((r) => r.family === family)
}
/** ⭐ §2 – WHAT AN EMPTY SHELF SAYS: the cheapest thing on it, by name and price. «Never a locked
 *  row, a progress bar or a teaser» – so this is a real object at a real number, and the engine
 *  chose it (`shop.cheapestId`) rather than this screen sorting the rows itself. */
const shopCheapest = computed(() => shopRows.value.find((r) => r.id === shop.value?.cheapestId) ?? null)

/** What the player has typed into an 'open' rung, in DOLLARS as typed – the input's own units, kept
 *  as a string so a half-typed figure is not silently coerced to a number. `stakeCentsFor` is the
 *  one place it becomes cents, and the engine re-validates the minimum either way. */
const stakeDollars = ref<Record<string, string>>({})
function stakeCentsFor(row: ShopRowView): number {
  const typed = Number(stakeDollars.value[row.id] ?? '')
  if (!Number.isFinite(typed) || typed <= 0) return row.entryCents
  return Math.round(typed * 100)
}
// ⭐⭐ ROUND 29 #11 – `shopTopUpNote`, THE OWNER'S OWN WORDS, PARKED HERE AND NOT IN THE TEMPLATE.
//
// «Index fund хотелось бы иметь возможность докупать, предполагаю, что Savings deposit будет вести
// себя так же – тоже надо исправить.»
//
// ⚠ AND HIS RULING THAT BINDS IT TO #12, 28.08: «здесь логика простая: в реальности на текущем счете
// нет процентного дохода, максимум кешбек, и то не за все, мы для этого делаем Savings как раз. Одни
// должны друг друга заменить.» So the shelf is not a competitor to the current account's interest –
// it is its REPLACEMENT, and the decision to move money into it is the mechanic. That is why the
// top-up control exists at all: without it the replacement cannot be fed.
//
// ⚠⚠ AND `shopToneNote` (ROUND 29 #9), for the same reason – Cyrillic may not appear in a template,
// in a string OR in a comment (tests/template-copy-rules.test.ts):
// «В строке с машиной и другими вещами Worth now / paid $60,000 / $59,361 – давай последнюю цифру
// сделаем либо белой, либо жёлтой, с красным перебор.»
// He is right about what red MEANS. `negative` is `--money-out`, whose documented sense is money
// LEAVING – a bill, a fare, a cheque. What that figure states is what the thing IS WORTH, which is a
// BALANCE, and StatRow's own vocabulary already has the word: `plain` = «a number with no direction
// (a count, a balance)», painted `--ink`, i.e. white. The existing palette, not a new colour. The
// direction is not lost – it moves to `.shop-row-change`, the signed row that is about a direction.

// ⭐⭐ ROUND 29 PART FOUR P7 – `shopBusinessNote`, THE OWNER'S OWN WORDS, PARKED HERE FOR THE SAME
// REASON AS ITS NEIGHBOURS (no Cyrillic in a template, and `SHOP_FAMILIES` is read into one):
// «до академии можно запустить свой бренд одежды (мерча) – это может стать хорошим шагом и
// подспорьем как в доходе, так и вообще добавить геймплея немного. А еще это дешевле академии» and
// «нам нужен мерч, растущий от частоты и обилия рекламных контрактов, съемок, выступлений, титулов
// и прочего» – so the family note names FAME as the axis, never rank, and the row's income line
// (`incomeCents`, engine-computed) is the mechanic on screen.

// ⭐⭐ ROUND 29 #5 – `shopEliteNote`, THE OWNER'S OWN WORDS, PARKED HERE FOR THE SAME REASON AS THE
// two above: Cyrillic may not appear in a template, in a string OR in a comment
// (tests/template-copy-rules.test.ts), and `SHOP_FAMILIES` is read into one.
//
// «В магазине всё ещё не хватает яхт, самолётов и стойки академии» – round 29 #5, the ask itself.
// «Может что-то элитное добавить - яхты или самолеты? Со временем постройки около реальным - купил и
// ждешь пока будет готово, яхты строят несколько лет.»
// «тоже можно разные тиры сделать, кстати и потерю стоимости в год + годовое обслуживание (недельный
// кост, ага)»
// «построить свою академию за много миллионов - тоже может быть интересно, кстати. Как раз будет
// куда рекламное тратить.»
//
// ⚠⚠ AND THE ONE THING THIS SCREEN MAY NOT SAY. The plane's fare cut is a MONEY fact and money facts
// are always on screen here – «a cost the player cannot find» is this repo's own named defect. Its
// other effect is NOT: «По усталости по аналогии с кортом может 1 накинуть», and the analogy carries
// his ruling about the court with it – «верно, но только если знают об этом, я предложил сделать
// бонус скрытым». So no row, no note and no dialog below states a condition number, and none may be
// added. The spec's §3d rule 4: «Hidden means never a number on a card.»

// ⭐⭐ ROUND 29 PART TWO #4 – `shopPartSaleNote`, HIS WORDS, PARKED HERE FOR THE SAME REASON AS THE
// others: Cyrillic may not appear in a template, in a string OR in a comment
// (tests/template-copy-rules.test.ts).
//
// «при продаже бумаг надо дать возможность только часть продавать, иными словами при продаже надо
// дать цифровой инпут для ввода суммы продажи»
//
// ⭐ His reasoning, in his own message: a holding money can come back OUT of in parts is a real cash
// management decision instead of a one-way door. The input is drawn on an 'open' rung only – the
// same property that decides whether money can go IN in parts – and it is left BLANK by default, so
// the control still says «Sell it for $X» and still means all of it unless a figure is typed.

// ⭐⭐ ROUND 29 PART TWO #6 – `shopAlwaysOpenNote`, HIS RULING, PARKED HERE FOR THE SAME REASON AS
// the three above: Cyrillic may not appear in a template, in a string OR in a comment
// (tests/template-copy-rules.test.ts).
//
// «магазин открыт всегда с начала игры»
//
// So `shop.unlocked` / `shop.lockedDetail` are gone from the protocol, the engine's gate is gone
// with them (engine/world/shop.ts writes out what went and why), and the shelf's chapter here no
// longer has a shut arm. ⭐ It also closes round 29's ask 12b: the junior years, where removing the
// current account's interest bites hardest, now have the instrument that replaces it.

/** ⭐ ROUND 29 #11 – CAN THE FAMILY PUT MORE INTO THIS ONE? True only for an 'open' rung it already
 *  holds: a deposit and an index fund take more money, a car does not. The predicate is the STAKE
 *  and not a list of ids, exactly as `buyAsset` re-validates it engine-side. */
function isTopUp(row: ShopRowView): boolean {
  return row.stake === 'open' && row.valueCents !== null
}
/** ⚠ ADVISORY, NOT THE GATE. The engine refuses a stake under the minimum and a stake over the
 *  wallet with its own sentences (`buyAsset`); this only decides whether the control is pressable,
 *  which is the R10-16 pairing – a disabled control and a refused click telling one story.
 *
 *  ⚠ ROUND 29 #11 re-aimed the owned-row clause: it used to refuse EVERY owned rung, which is what
 *  made the fund un-toppable on screen even once the engine allowed it. A `fixed` rung still
 *  refuses – there is no second helping of a car. */
function canBuy(row: ShopRowView): boolean {
  if (game.busy) return false
  if (row.valueCents !== null && !isTopUp(row)) return false
  // ⭐ ROUND 29 #5, §3g – a stage cannot be built before the one under it. Advisory, like every other
  // clause here: `buyAsset` refuses the same purchase with its own sentence naming the stage.
  if (!row.requirementMet) return false
  const cents = row.stake === 'open' ? stakeCentsFor(row) : row.entryCents
  return cents >= row.entryCents && cents <= (game.snapshot?.fundsCents ?? 0)
}
/** ⭐ ROUND 29 #5, §3f – IS THIS ONE STILL BEING BUILT? A contract, not a boat: no sale, and the
 *  week it is due instead. The engine decided it (`ShopRowView.readyWeek`); this reads the field. */
function isBuilding(row: ShopRowView): boolean {
  return row.readyWeek !== null
}
/** The stage this rung is waiting on, by NAME – the label off the row it names, never an id on
 *  screen. Empty when the requirement is met or there is none. */
function requiresLabel(row: ShopRowView): string {
  if (row.requirementMet || !row.requiresId) return ''
  return shopRows.value.find((r) => r.id === row.requiresId)?.label ?? ''
}
/** ⭐ §3f – HOW LONG THE FAMILY WOULD BE WAITING, in the unit a person thinks in. The engine's
 *  `buildWeeks` is weeks, which is the right unit for the calendar and a bad one for «yachts take
 *  years».
 *
 *  ⚠⚠ MONTHS UNDER TWO YEARS AND YEARS ABOVE IT, WHICH IS §3f's OWN TABLE READ BACK: «~12 months»,
 *  «~18 months», «~2 years», «~3 years», «~4 years». That is not a style choice – a single unit
 *  either turns eighteen months into «1.5 years» or into a wrong «2 years», and the spec already
 *  chose. ⚠ WHOLE NUMBERS EITHER WAY (the owner's display ruling of 26.08: «у пользователя целые в
 *  интерфейсе»); the wait itself is whole weeks and the due date the row prints once ordered is the
 *  engine's own. */
function buildWaitLine(row: ShopRowView): string {
  const months = Math.round((row.buildWeeks / 52) * 12)
  if (months < 24) return `Built to order – about ${months} months from the week it is ordered.`
  return `Built to order – about ${Math.round(months / 12)} years from the week it is ordered.`
}
/** «loses 6% a season» / «+7% a season». ⚠ THE UNIT IS THE GAME'S OWN – a season IS the 52-week
 *  block every other figure on this screen is quoted over, and the spec's own «/yr» and «a season»
 *  are the same span. The number is `annualRatePct`, whole, rounded once in the engine. */
function rateLine(row: ShopRowView): string {
  // ⭐⭐⭐ ROUND 30 #9 – A BUSINESS IS NOT PRICED BY A RATE, so it does not read one out. Its worth is
  // years of what it takes in, and what it takes in is her fame – so this line is what the row is
  // ABOUT rather than a percentage it does not have. See `assetWorthCents`' third branch.
  if (row.earningsMultipleX !== null) return `Worth ${row.earningsMultipleX} years of what it sells`
  if (row.annualRatePct < 0) return `Loses ${-row.annualRatePct}% a season`
  // ⭐⭐⭐ ROUND 30 #11 – RE-WORDED, AND THE ENGINE WAS CHECKED BEFORE A WORD MOVED.
  //
  // THE OWNER, 30.08: «И как будто бы Holds its value странно звучит тоже – это напрямую значит, что
  // оно обесценивается, а это вроде бы не совсем так.»
  //
  // ⚠⚠ HE IS RIGHT AND THE ENGINE SAYS SO. A rung at `annualRateBps: 0` is worth `paidCents x 1^n` –
  // exactly what was paid for it, every week, forever – and `sellAsset` hands back `valueCents`
  // whole with no spread, no fee and no haircut. There is no inflation anywhere in this engine, so
  // there is not even a real-terms slide hiding behind the nominal figure. It does NOT depreciate;
  // the words were the only thing suggesting it might. ⭐ AND THE ROW HE WAS PROBABLY READING IT ON
  // IS GONE FROM THIS BRANCH ENTIRELY – the merch brand is priced as a business one line up, which
  // is item 9, his own next sentence.
  //
  // ⚠ THE PARALLEL IS THE POINT: its two siblings are about a RATE («Loses 6% a season», «Gains
  // about 7% a season») and the third had better be a rate too. «Neither gains nor loses» is the
  // zero of that sentence and cannot be read as a slow slide. It is now said of the four academy
  // stages and of nothing else.
  if (row.annualRatePct === 0) return 'Neither gains nor loses'
  return `Gains about ${row.annualRatePct}% a season`
}

// ⭐⭐⭐ ROUND 30 #14 – `shopUnitsNote`, HIS RULING, PARKED HERE AND NOT IN THE TEMPLATE, for the
// reason every other note in this block carries: Cyrillic may not appear in a template, in a string
// OR in a comment (tests/template-copy-rules.test.ts). ⚠ AND THE TAG IS NOT SPELLED OUT HERE, which
// is not fussiness – `templateOf` in that test scans from the FIRST literal opening tag in the file,
// so a script-side note that writes the tag out drags the whole script into the scanned region and
// fails the guard on its own comment. Every sibling note above says «a template» for that reason.
//
// «Волатильность индексного фонда какая-то очень большая по ощущениям +65/-15 это то, что я видел…
// И надо логику фонда переделать на покупку ДОЛЕЙ в фонде, как раз доли дадут возможность расти на
// горизонте и будут давать разные точки входа, как в жизни. Стоимость активов будет рассчитываться
// исходя из стоимости долей. Зашёл, когда доля стоила 4к, через десять лет она может вполне
// удвоиться. Или зашёл на пике при цене 7-8к и увидел просадку на следующий год – имеешь возможность
// усредниться или зафиксировать убыток.»
//
// ⚠⚠ THE TWO LINES BELOW ARE THE WHOLE OF WHAT THIS ITEM ADDS TO THE SCREEN, and that is invariant 4
// read literally: a mechanic that cannot be decided without a number gets that number and nothing
// else moves. He asked to be able to average down or take a loss; both need the same three figures –
// how many units they hold, what they averaged at, what one costs today – and none of the sentences
// already on this row is touched, re-worded or removed.
//
// ⚠ THE UNOWNED LINE EXISTS FOR «зашёл на пике при цене 7-8к»: the entry price is a fact about the
// WEEK, so a family looking at the row before it buys is looking at the price it would pay.

/** ⭐ HOW MANY UNITS, AS A PERSON READS THEM. ⚠ THE ONE FRACTIONAL FIGURE ON THIS SCREEN, and the
 *  owner's rule of 26.08 («у пользователя целые в интерфейсе») is about MONEY: $5,000 into a $4,000
 *  unit is 1.25 units, and rounding that to 1 would print a quarter of the holding out of existence.
 *  Two places, which is what a real fund statement uses. */
function formatUnits(units: number): string {
  return units.toFixed(2)
}

interface PendingShop {
  kind: 'buy' | 'sell'
  id: string
  label: string
  amountCents: number
  changeCents: number | null
  /** ⭐ ROUND 29 #11 – adding to a holding they already have, rather than opening one. */
  topUp?: boolean
  /** ⭐ ROUND 29 PART TWO #4 – set only when this is a PART sale, so the question can say so. */
  partCents?: number
  /** ⭐ ROUND 29 #5 – how long they would be waiting, in weeks. 0 on everything that arrives at
   *  once, which is every rung the shelf had before §3f. */
  buildWeeks?: number
  /** ⚠ ...and what keeping it costs a week. §3f's whole argument is that this is the number the
   *  decision is actually about, so it is on the question and not only on the row. */
  upkeepCents?: number
  /** ⭐ ROUND 30 #8/#10 – what the family is calling it, on the one purchase that names it. */
  name?: string
}
// ⭐⭐⭐ ROUND 30 #8 AND #10 – `shopNamingNote`, HIS ASK, PARKED HERE AND NOT IN THE TEMPLATE for the
// reason every other note in this block carries: Cyrillic may not appear in a template, in a string
// OR in a comment (tests/template-copy-rules.test.ts).
//
// #8: «Merch brand давай предложим пользователю несколько вариантов именования при покупке… один из
// вариантов "ввести своё название" – это придаст +100 к индивидуальности сразу. Среди вариантов по
// дефолту могут быть инициалы ребёнка или что-то связанное с именем или фамилией.»
// #10: «И нейминг для академии тоже по принципу бренда, как раз одним из вариантов можно предложить
// уже существующее название бренда (если он есть) или снова "ввести своё".»
//
// ⚠⚠ THE FOUR RULES FOR THE TYPED VALUE ARE THE ENGINE'S AND NOT THIS SCREEN'S – `sanitiseAssetName`
// in `world/assets.ts` states all four (a 24-code-point cap, an allow-list, an empty entry becoming
// the first suggestion, and collapsed whitespace) and `buyAsset` applies them to whatever arrives.
// What this screen does is make the cap FELT rather than applied silently: `maxlength` is the same
// constant, imported rather than retyped. A screen that validated instead of the engine would be
// invariant 1 broken in the direction the worker exists to prevent.
//
// ⚠ AND THE SUGGESTIONS ARE THE ENGINE'S TOO (`ShopRowView.nameOptions`), because whether a purchase
// names anything is a fact about the world – it is the FIRST rung of a nameable family – and a
// screen that worked it out would be a second copy of `buyAsset`'s own question.
const nameDrafts = ref<Record<string, string>>({})
/** What is in the box for this row – the first suggestion until the player touches it. ⚠ `??` AND
 *  NOT `||`: a player who clears the field should see it empty rather than have the default snap
 *  back under his cursor, and the engine turns an empty entry into that same default at the command.
 *  `''` is a value here and only `undefined` means «never touched». */
function nameFor(row: ShopRowView): string {
  return nameDrafts.value[row.id] ?? row.nameOptions[0] ?? ''
}

const pendingShop = ref<PendingShop | null>(null)
function askBuy(row: ShopRowView): void {
  if (!canBuy(row)) return
  const amountCents = row.stake === 'open' ? stakeCentsFor(row) : row.entryCents
  pendingShop.value = {
    kind: 'buy',
    id: row.id,
    label: row.label,
    amountCents,
    changeCents: null,
    topUp: isTopUp(row),
    buildWeeks: row.buildWeeks,
    upkeepCents: row.upkeepCents,
    // ⭐ ROUND 30 #8/#10 – carried on the pending question and sent with the command. Undefined on
    // every row that names nothing, which is every row whose `nameOptions` the engine left empty.
    name: row.nameOptions.length > 0 ? nameFor(row) : undefined,
  }
}
// ⭐⭐⭐ ROUND 29 PART TWO #4 – HOW MUCH OF IT TO SELL. His words are in `shopPartSaleNote` below
// (no Cyrillic in a template, and none in a comment a template reads).
//
// ⚠ THE SAME SHAPE AS THE STAKE INPUT ABOVE, deliberately: DOLLARS as typed, kept as a STRING so a
// half-typed figure is not coerced, and `sellCentsFor` is the one place it becomes cents. Blank
// means «all of it», which is what the control said before this item and still says.
const sellDollars = ref<Record<string, string>>({})
/** Null when the box is empty or unusable – the caller then sells the whole holding, which is the
 *  engine's own `amountCents === undefined`. ⚠ CLAMPED NOWHERE: `sellAsset` re-derives the floor and
 *  the ceiling and returns its own sentence, and a screen that silently corrected the number would
 *  be the R10-16 defect (a control and a refusal telling two stories). */
function sellCentsFor(row: ShopRowView): number | null {
  // ⚠ `String(...)` AND NOT A CAST: Vue 3's `v-model` on `type="number"` coerces the bound value to a
  // NUMBER at runtime, whatever the ref is typed as, so «is the box empty» has to survive both. The
  // stake input above only ever reaches this through `Number()`, which is why it never noticed.
  const raw = String(sellDollars.value[row.id] ?? '').trim()
  const typed = Number(raw)
  if (!raw || !Number.isFinite(typed) || typed <= 0) return null
  return Math.round(typed * 100)
}
/** ⚠ ADVISORY, NOT THE GATE – `canBuy`'s own rule one function up. An amount over what they hold is
 *  refused by the engine with the figure in it; this only decides whether the control is pressable. */
function canSell(row: ShopRowView): boolean {
  if (game.busy || row.valueCents === null) return false
  const cents = sellCentsFor(row)
  return cents === null || (cents > 0 && cents <= row.valueCents)
}
function askSell(row: ShopRowView): void {
  if (!canSell(row) || row.valueCents === null) return
  // ⚠ THE PART IS ONLY OFFERED ON AN 'open' RUNG, which is `isTopUp`'s predicate read from the other
  // end – see `sellAsset`'s own header. A car is sold whole whatever is in any box.
  const part = isTopUp(row) ? sellCentsFor(row) : null
  const amountCents = part !== null && part < row.valueCents ? part : row.valueCents
  pendingShop.value = {
    kind: 'sell',
    id: row.id,
    label: row.label,
    amountCents,
    // ⚠ THE REALISED DIFFERENCE, SCALED BY WHAT IS LEAVING. The engine reaches the same figure from
    // the other side – `proceeds − round(paidCents x proceeds / value)` – which is this expression
    // rearranged, so the two can differ by at most a cent and never by a dollar on screen. ⚠ IT IS
    // NOT RE-DERIVED FROM A RATE: `changeCents` is the engine's own subtraction, off `shopView`.
    // Whole sale: the row's own `changeCents`, untouched.
    changeCents:
      row.changeCents === null || amountCents >= row.valueCents
        ? row.changeCents
        : Math.round((row.changeCents * amountCents) / row.valueCents),
    partCents: amountCents < row.valueCents ? amountCents : undefined,
  }
}
/** ⚠ THE SALE'S SENTENCE NAMES THE DIFFERENCE, TO THE CENT, and it is the same sentence the ledger
 *  row carries – both take `changeCents` off the engine rather than working it out. A player who has
 *  to subtract two prices himself has been shown two prices, not a loss (spec §2e-1). */
const shopConfirmMessage = computed(() => {
  const p = pendingShop.value
  if (!p) return ''
  if (p.kind === 'buy') {
    // ⭐ ROUND 29 #11 – a top-up is a different sentence from a first purchase, because it is a
    // different act: «Buy an index fund» reads wrong on the fund they have held for six seasons.
    if (p.topUp) {
      return `Put a further ${formatCents(p.amountCents)} into ${p.label}? It comes out of the family's money this week.`
    }
    // ⭐⭐ ROUND 29 #5, §3f – A COMMISSION ASKS A DIFFERENT QUESTION, because it commits the family to
    // three things and not one: the money now, the wait, and a bill every week for as long as they
    // keep it. «Buy the yacht for $12,000,000?» would be true and would hide the two halves that
    // actually decide it. ⚠ NOT A NUMBER ABOUT HER – the fatigue side of the plane is hidden by his
    // own ruling and no sentence here goes near it.
    if (p.buildWeeks) {
      const keep = p.upkeepCents ? ` It then costs ${formatCents(p.upkeepCents)} a week to keep.` : ''
      return `Order ${p.label} for ${formatCents(p.amountCents)}? The money goes this week and it arrives in ${p.buildWeeks} weeks.${keep}`
    }
    return `Buy ${p.label} for ${formatCents(p.amountCents)}? It comes out of the family's money this week.`
  }
  const tail =
    p.changeCents === null || p.changeCents === 0
      ? 'exactly what it cost'
      : p.changeCents < 0
        ? `${formatCents(-p.changeCents)} less than it cost`
        : `${formatCents(p.changeCents)} more than it cost`
  // ⭐ ROUND 29 PART TWO #4 – a part sale asks a different question, because it leaves something
  // behind: «Sell the index fund» reads wrong on a family taking $10,000 out of one.
  if (p.partCents !== undefined) {
    return `Take ${formatCents(p.partCents)} out of ${p.label}? That part is ${tail}, and the rest stays invested.`
  }
  return `Sell ${p.label} for ${formatCents(p.amountCents)}? That is ${tail}.`
})
function confirmShop(): void {
  const pending = pendingShop.value
  pendingShop.value = null
  if (!pending) return
  if (pending.kind === 'buy') void game.buyAsset(pending.id, pending.amountCents, pending.name)
  // ⚠ `partCents` OR NOTHING: a whole sale sends no amount, which is the engine's «sell the lot» and
  // is byte for byte the call this screen made before part two #4.
  else void game.sellAsset(pending.id, pending.partCents)
}

//
// ⚠ THE FOURTH IS THE SHOP (v63, docs/specs/the-shop-2026-08.md §2), AND IT IS THE OWNER'S OWN
// PLACEMENT: «Можно как раз на вкладку Family budget отдельным пунктом добавить как вариант.» The
// spec's §2 leaves no design here – one row in this list and one `v-if` block, no new navigation and
// no new bottom-bar tab, because it is money and money already has a home. It sits LAST because the
// other three are about money that has already moved and this one is about money that has not.
type MoneyTab = 'spend' | 'bills' | 'history' | 'shop'
const screenTab = ref<MoneyTab>('spend')
const TAB_OPTIONS = [
  { value: 'spend', label: 'Spending', title: 'Where the money went in the chosen period' },
  { value: 'bills', label: 'Bills', title: 'The recurring costs the family has signed up to' },
  { value: 'history', label: 'History', title: 'Every season, and every transaction' },
  { value: 'shop', label: 'Shop', title: 'What the family can buy with what is left' },
]

// =================================================================================================
// ⭐⭐ ROUND 30 #5 – A SECOND ROW OF TABS INSIDE BILLS AND INSIDE SHOP.
//
// The owner: «Внутри Bills и Shop сделать дополнительные вкладки как на экране Spending (12 weeks /
// So far) для каждой категории. Для Bills будет Her Kit / Advs Portfolio. Для Shop будет отдельно
// сверху плашкой The shelf, а ниже под ней вкладки в ряд Invest / Cars / Property / Business
// (Academy is subdivision inside) / Water / Air. Для каждой карточки будет свой арт, карточки лежат
// без общей подложки, примерно как на экране Season».
//
// ⚠ HE NAMED THE MODEL, SO IT IS COPIED RATHER THAN INVENTED. «как на экране Spending» is the period
// switcher a few lines above (`WINDOW_OPTIONS`): the same `SegmentedRow`, the same default `plate`
// appearance, sitting INSIDE a chapter rather than picking one. That is also why neither of these
// rows asks for `appearance="chapter"` – the chapter picker is `TAB_OPTIONS` at the top of the
// screen, and two identically-sized rows six pixels apart is the exact confusion `chapter` exists to
// avoid (SegmentedRow.vue's own note).
//
// ⚠⚠ THE TAB NAMES BELOW ARE HIS, SPELLED AS HE SPELLED THEM, and nothing else on either chapter
// changed a word (CLAUDE.md invariant 4, which this round wrote). In particular the family headings
// INSIDE the shelf keep the words they shipped with – `Investments`, `Cars`, `Property`,
// `The business`, `On the water`, `In the air`, `Her academy` – even where a heading now repeats its
// own tab. Renaming one to match would be exactly the unasked tidy-up item 4 was about; the
// duplication is visible, cheap and his to remove with one sentence.
type BillsTab = 'kit' | 'ads'
const billsTab = ref<BillsTab>('kit')
const BILLS_TAB_OPTIONS = [
  { value: 'kit', label: 'Her Kit', title: 'What she plays with, and what replacing it costs' },
  { value: 'ads', label: 'Advs Portfolio', title: 'The advertising categories, filled and open' },
]
/** The age the portfolio opens at, READ OUT OF THE ENGINE and never typed – the same constant
 *  `toSnapshot` gates the shelf on, so the empty tab's sentence and the gate cannot drift apart. */
const adFromAgeYears = ECONOMY.advertising.fromAgeYears

// ⚠ WHAT IS *NOT* BEHIND THESE TWO TABS, AND WHY IT IS DELIBERATE. He named two categories for Bills
// and the chapter carries four blocks: the budget levers (the physio retainer) and her academy's
// scholarship are neither kit nor advertising. Filing them under one of his two names would be this
// screen deciding that a physio bill is "kit", which is a classification he did not make – so they
// stay OUTSIDE the switcher, the levers above it and the academy below, in the order they already
// had. That is the Spending chapter's own shape as well: the summary sits above its period switcher
// because the switcher does not govern it. ⭐ Say the word and either one moves under a tab.

type ShelfTab = 'invest' | 'cars' | 'property' | 'business' | 'water' | 'air'
const shelfTab = ref<ShelfTab>('invest')
const SHELF_TAB_OPTIONS = [
  { value: 'invest', label: 'Invest', title: 'Money that stays money' },
  { value: 'cars', label: 'Cars', title: 'The garage' },
  { value: 'property', label: 'Property', title: 'Somewhere to live' },
  { value: 'business', label: 'Business', title: 'What the family owns that earns – the academy included' },
  { value: 'water', label: 'Water', title: 'Boats, ordered rather than bought' },
  { value: 'air', label: 'Air', title: 'The family aeroplane' },
]
/** ⚠⚠ «Business (Academy is subdivision inside)» – THE ACADEMY IS NOT A SEVENTH TAB. It is a
 *  subdivision of Business, so that tab holds TWO families and the academy's four stages appear
 *  under it, below the brand. Every other tab holds exactly one. This map is the whole mechanism:
 *  the engine's families are untouched, and so is `SHOP_FAMILIES` and every word in it. */
const SHELF_TAB_FAMILIES: Record<ShelfTab, ShopRowView['family'][]> = {
  invest: ['investment'],
  cars: ['car'],
  property: ['house'],
  business: ['business', 'academy'],
  water: ['boat'],
  air: ['plane'],
}
/** The families the open shelf tab shows, in `SHOP_FAMILIES`' own order – so Business shows the
 *  brand and then the academy under it, which is what "subdivision inside" means on screen. */
const shelfFamilies = computed(() =>
  SHOP_FAMILIES.filter((f) => SHELF_TAB_FAMILIES[shelfTab.value].includes(f.key)),
)
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
        appearance="chapter"
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

      <!-- ===================== 5a. THE BILLS CHAPTER'S OWN TABS =====================
           ⭐⭐ ROUND 30 #5. The Spending chapter's period switcher, one chapter along: same control,
           same plate, and it governs the two blocks he named. Which blocks it does NOT govern, and
           why the levers above and the academy below stay outside it, is argued at
           `BILLS_TAB_OPTIONS` in the script - his words live there, because Cyrillic may not appear
           in a template (tests/template-copy-rules.test.ts). -->
      <SegmentedRow
        v-if="screenTab === 'bills'"
        v-model="billsTab"
        class="money-window money-subtabs"
        :options="BILLS_TAB_OPTIONS"
        group-label="Which bills"
      />

      <!-- ========================= 5b. HER KIT, AND WHAT IT COSTS ===================
           W3-KIT. Three lines, four rungs each. The rung she owns is marked; a dearer one asks
           before it charges, a cheaper one just takes effect at the next purchase. Every price,
           name and condition word comes off the snapshot - see the script. -->
      <Card v-if="screenTab === 'bills' && billsTab === 'kit'" class="money-panel money-kit">
        <!-- ⭐ ROUND 30 #5 – THE CARD'S OWN ART, when there is one. `shelfArtUrl` returns null
             until his painting lands and the band is simply absent: a designed empty state, never
             a broken box. Its header carries the contract. -->
        <div v-if="shelfArtUrl(BILLS_ART_KEYS.kit)" class="card-art">
          <img :src="shelfArtUrl(BILLS_ART_KEYS.kit) ?? undefined" alt="" />
          <span class="card-art-scrim" aria-hidden="true"></span>
        </div>
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
          off, and it is billed every time the family replaces it, not once. The shop's price moves a
          little between replacements, so the figures below are what a rung costs about.
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
               allowance is applied - never a discount this screen worked out for itself.

               ROUND 21 #10: the rung she is ON also carries what is LEFT of those weeks. "24 good
               weeks" is what the rung buys from new and says nothing about the set in her bag, so a
               fourteen-week-old string job read exactly like a fresh one. `goodWeeksLeft` is the
               engine's own figure (world/kit.ts) off the same clock the wear curve walks - this
               screen does not subtract a start date from a week number, because a second reading of
               "how old is it" is how a countdown ends up disagreeing with the condition word two
               lines above it. null means a sponsor is keeping the line fresh: nothing is counting
               down, so nothing is printed. -->
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
              <span class="kit-rung-good">
                {{ rung.goodWeeks }} good weeks
                <span v-if="rung.owned && view.goodWeeksLeft !== null" class="kit-rung-left">
                  ({{ view.goodWeeksLeft }} left)
                </span>
              </span>
              <!-- ⭐ ROUND-23 #17 – "Around" IN FRONT OF EVERY RUNG PRICE. The owner asked for the
                   word so that "why does the racquet say 920 when we paid 1070?" cannot be asked
                   again. It goes HERE and on no other Bills figure, and the audit that decided that
                   is on the script side at `kitLines` – every other number on this tab is money
                   already committed, or a band that is already printed as a range.

                   ⚠ ONE PREFIX FOR THE WHOLE SPAN, INCLUDING THE COVERED ARM. The sticker is the
                   quote in both arms and the family's share is derived from it, so "free" is a
                   quote too. "Around free" is not English, so the word leads the span once and
                   governs everything after it. -->
              <span v-if="rung.payableCents < rung.priceCents" class="kit-rung-price is-covered">
                <!-- ⚠ THE SPACE IS EXPLICIT. Vue's `condense` drops a whitespace-only text node
                     that spans a newline, so a bare line break here renders "Around$920" – the CSS
                     margin would still open a gap on screen, but the accessible name and every
                     copy-paste of this button would have the two words fused. -->
                <span class="kit-rung-approx">Around</span>{{ ' ' }}
                <s>{{ formatCents(rung.priceCents) }}</s>
                {{ rung.payableCents === 0 ? 'free' : formatCents(rung.payableCents) }}
              </span>
              <span v-else class="kit-rung-price">
                <span class="kit-rung-approx">Around</span> {{ formatCents(rung.priceCents) }}
              </span>
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

      <!-- ======================= 5b-bis. THE ADVERTISING PORTFOLIO ===============
           Round 29 part four P6/§8 – the shelf of categories the owner described, filled or empty,
           with the live deal named. Every row is `snapshot.adPortfolio`, derived by the engine off
           the offers and the catalogue: this screen prices nothing, gates nothing and re-derives
           nothing, which is the kit-deal block's own rule one card up. Absent for a junior – the
           engine hands an empty shelf before eighteen and the card simply is not there. -->
      <Card
        v-if="screenTab === 'bills' && billsTab === 'ads' && adPortfolio.length > 0"
        class="money-panel money-ads"
      >
        <!-- ⭐ ROUND 30 #5 – this card's own art, absent until it exists. See `Her kit` above. -->
        <div v-if="shelfArtUrl(BILLS_ART_KEYS.ads)" class="card-art">
          <img :src="shelfArtUrl(BILLS_ART_KEYS.ads) ?? undefined" alt="" />
          <span class="card-art-scrim" aria-hidden="true"></span>
        </div>
        <Eyebrow as="h2">The advertising portfolio</Eyebrow>
        <!-- ⭐⭐⭐ ROUND 29 PART THREE P3 – THE SECOND SENTENCE IS THE MANAGER'S COMMISSION, AND IT
             REPLACES THE ONE THAT DESCRIBED THE OLD SPLIT. It used to read «Fees run through the
             family's account with her share taken like any sponsor cheque», which was true while
             sponsor cash was split by her prize ramp; his ruling of 29.08 inverts it – the letter is
             addressed to her at its full value and the parent earns a fee for the work. His words
             are in the script block above and in tests/round29p3-manager-commission.test.ts, because
             Cyrillic inside a <template> is forbidden (tests/template-copy-rules.test.ts).
             ⚠⚠ THE PERCENTAGE IS READ OUT OF THE ENGINE, NEVER TYPED – part-one #13's rule, and it
             is the same one: `managerCommissionBps()` is the function `bankSponsorCheque` calls when
             it actually pays, so a retune of `ECONOMY.managerCommission` moves this line and the
             cheque together and they cannot drift apart. -->
        <p class="money-panel-note">
          One deal per category – the cheque grows with her standing, the shelf itself does not.
          Every fee is written to her at its full value, and the family banks the manager's
          {{ commissionPct }}% of it.
        </p>
        <!-- ⭐ ROUND 29 PART FOUR P7/P8 – FAME'S ONE LINE, where the sponsors live. The stock of
             docs/specs/fame-and-the-shoots-2026-08.md, first surfaced here and deliberately
             MODESTLY: one sentence, the engine's own whole number (`snapshot.fame`, rounded once
             at the boundary), no meter and no gate re-derived. The full fame surface is a later
             wave; today it is the number the merch line follows. -->
        <p class="money-panel-note ad-fame-line">
          How known she is – {{ fame }} of 100. The court sets that floor, and the shoots she has
          done multiply it; the merch brand sells on it.
        </p>
        <div v-for="row in adPortfolio" :key="row.category" class="ad-slot" :class="`is-${row.state}`">
          <div class="ad-slot-head">
            <span class="ad-slot-name">{{ row.label }}</span>
            <span v-if="row.state === 'filled'" class="ad-slot-brand">{{ row.brand }}</span>
            <span v-else-if="row.state === 'open'" class="ad-slot-state">Open – nobody signed</span>
            <span v-else class="ad-slot-state">
              {{ row.seasonsInTop10
                ? `${row.seasonsInTop10.held} of ${row.seasonsInTop10.needed} top-10 seasons`
                : row.opensAtRank
                  ? `Opens inside WTA #${row.opensAtRank}`
                  : 'Not open yet' }}
            </span>
          </div>
          <p v-if="row.state === 'filled'" class="ad-slot-note">
            {{ formatCents(row.cashCents ?? 0) }} a year ·
            {{ (row.termYears ?? 1) === 1 ? 'one year' : `${row.termYears} years` }} · runs to
            {{ weekLabel(row.untilWeek ?? 0) }}
          </p>
          <p v-else-if="row.state === 'open'" class="ad-slot-note">
            A letter here writes about {{ formatCents(row.openCashCents ?? 0) }} a year at her
            standing.
          </p>
        </div>
      </Card>

      <!-- ⚠ AND WHAT THE SECOND TAB SAYS BEFORE THERE IS A PORTFOLIO. The engine hands an empty
           shelf below eighteen (`snapshot.adPortfolio` is `[]` under
           `ECONOMY.advertising.fromAgeYears`), and until now that meant the card simply was not on
           the screen - which is fine when it is one card among four and a hole when it is a whole
           tab. The age is READ OUT OF THE ENGINE, never typed, so a retune moves this sentence and
           the gate together. -->
      <p
        v-if="screenTab === 'bills' && billsTab === 'ads' && adPortfolio.length === 0"
        class="money-panel-note money-subtab-empty"
      >
        Nothing to show yet – the categories open at {{ adFromAgeYears }}, and they fill one letter
        at a time as she climbs.
      </p>

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
        <!-- ⭐⭐ ROUND 27 #8 (folded into round 29) – «COMPLETED». These rows are seasons that have
             WRAPPED; the period switcher above folds the season still running. The two numbers he
             could not reconcile were each right about a different season.
             ⚠ ROUND 30 #4: its twin USED to read «Season so far» – that half was an unasked rename
             and is back to `This season`. This eyebrow is left as round 29 left it because he did
             not ask about it, so #8 stands OPEN: half-labelled is not solved. See WINDOW_OPTIONS. -->
        <Eyebrow as="h2">Completed seasons</Eyebrow>
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

      <!-- ========================= 8. THE SHELF (v63) =========================
           docs/specs/the-shop-2026-08.md §2. The owner's own placement - a fourth chapter here
           rather than a new screen, because it is money and money already has a home.

           ⚠⚠ THE LOCKED ARM IS GONE - ROUND 29 PART TWO #6, HIS RULING. It used to print one
           sentence in place of the whole chapter until her first counting W-series result; his
           words and the reasoning are in `shopAlwaysOpenNote` in the script block, because Cyrillic
           may not appear in a template (tests/template-copy-rules.test.ts). What SURVIVES from that
           paragraph is the half that was never about the door: on an empty shelf the screen names
           the cheapest reachable thing and its price - "never a locked row, a progress bar or a
           teaser" - so there is no per-row lock anywhere below, and every price is on screen
           whether the family can reach it or not. A shop window is a thing you look into before you
           can afford it. -->
      <Card v-if="screenTab === 'shop' && shop" class="money-panel money-shop">
        <Eyebrow as="h2">The shelf</Eyebrow>
        <p class="money-panel-note">
          This is the family's own money, and none of it is hers. Nothing here makes her better,
          faster or fitter - it is what the money becomes once the tennis has stopped needing it.
        </p>
        <!-- ⭐ THE EMPTY SHELF'S OWN SENTENCE: a real thing at a real price. -->
        <p v-if="shopCheapest" class="money-panel-note is-empty-shelf">
          They own nothing yet. The cheapest thing here is
          {{ shopCheapest.label }}, from {{ formatCents(shopCheapest.entryCents) }}.
        </p>
        <StatRow
          v-else
          class="money-row"
          label="What they own"
          :meta="`${shop.ownedCount} ${shop.ownedCount === 1 ? 'thing' : 'things'}`"
          :value="formatCents(shop.ownedValueCents)"
          tone="positive"
        />
      </Card>

      <!-- ===================== 8a. THE SHELF'S OWN TABS =====================
           ⭐⭐ ROUND 30 #5 – his second clause: "The shelf as a plate on top, and under it the tabs
           in a row". The card above is that plate; this is the row under it. Six segments, and the
           seventh thing on the shelf - the academy - is deliberately NOT one of them: it is a
           subdivision of Business and rides inside that tab. The map and his words in full are at
           `SHELF_TAB_OPTIONS` in the script, where Cyrillic is allowed and a template's is not. -->
      <SegmentedRow
        v-if="screenTab === 'shop' && shop"
        v-model="shelfTab"
        class="money-window money-subtabs shelf-tabs"
        :options="SHELF_TAB_OPTIONS"
        group-label="Which part of the shelf"
      />

      <!-- ===================== 8b. THE SHELF ITSELF, CARD BY CARD =====================
           ⭐⭐ ROUND 30 #5 – "the cards lie with no shared backing, roughly as on the Season screen".
           This is the Season feed's own arrangement, and it is a real change rather than a restyle:
           every rung on the shelf used to sit inside ONE card, so the page had a plate behind a
           plate behind a row. Now each rung IS a card, laid straight on the page, exactly as
           `.event-cards` lays the calendar - `Card variant="photo"`, so a painting can bleed into
           it from behind the words the moment his art lands.
           ⚠ THE FAMILY HEADING AND ITS NOTE STAY, WORD FOR WORD, and they are OUTSIDE the cards:
           they are the sentence that says what a family is FOR (the spec's §3), and under Business
           they are also what separates the brand from the academy under it. -->
      <div v-if="screenTab === 'shop' && shop" class="shelf-feed">
        <div v-for="family in shelfFamilies" :key="family.key" class="shop-family">
          <div class="shop-family-head">{{ family.title }}</div>
          <p class="shop-family-note">{{ family.note }}</p>
          <Card
            v-for="row in shopRowsOf(family.key)"
            :key="row.id"
            variant="photo"
            class="shop-row"
          >
            <!-- ⭐ ROUND 30 #5 – "each card gets its own art". Null until his painting lands, and
                 until then the card simply has no band: `shelfArtUrl`'s header carries the contract,
                 which is `vacationArtUrl`'s, for the reason it was written. -->
            <div v-if="shelfArtUrl(row.id)" class="card-art shop-row-art">
              <img :src="shelfArtUrl(row.id) ?? undefined" alt="" />
              <span class="card-art-scrim" aria-hidden="true"></span>
            </div>
            <div class="shop-row-body">
              <div class="shop-row-head">
                <span class="shop-row-name">{{ row.label }}</span>
                <span class="shop-row-rate" :class="{ 'is-down': row.annualRatePct < 0 }">
                  {{ rateLine(row) }}
                </span>
              </div>
              <p class="shop-row-blurb">{{ row.blurb }}</p>
              <!-- ⭐⭐ ROUND 29 #5 – THE THIRD NUMBER (spec §3f): what it cost, what it loses, and
                   what it takes every week to keep. It is on the row whether the family owns one or
                   not, because it is the half of the price a shop window normally hides – «the
                   weekly figure is what appears in the ledger, beside the masseur, which is where
                   the decision actually lives». The engine computed it (`upkeepCents`); this screen
                   does not divide a percentage by a year. -->
              <p v-if="row.upkeepCents > 0" class="shop-row-upkeep">
                {{ formatCents(row.upkeepCents) }} a week to keep
              </p>
              <!-- ⭐⭐ ROUND 29 PART FOUR P7 – THE MIRROR LINE: what an owned earner brings in RIGHT
                   NOW, the engine's own figure (`incomeCents`, the same arithmetic the till banks).
                   Drawn only when it is really flowing – a brand nobody knows and a stage on order
                   both read $0 and say nothing. Deliberately NOT netted against the upkeep line
                   above (round 29 #10): two facts, two sentences. -->
              <p v-if="row.incomeCents > 0" class="shop-row-earning">
                Brings in {{ formatCents(row.incomeCents) }} a week right now
              </p>
              <!-- ⭐ §3f – THE WAIT, ON THE ROW, BEFORE THE ORDER IS PLACED. Not a teaser and not a
                   lock: the price is beside it and the control is pressable. -->
              <p v-if="row.buildWeeks > 0 && row.valueCents === null && !isBuilding(row)" class="shop-row-wait">
                {{ buildWaitLine(row) }}
              </p>
              <!-- ⭐ §3g – THE STAGE UNDER IT, WHEN THAT STAGE IS NOT BUILT. Again not a lock and
                   not a bar: the price stays on screen and the control is simply not pressable,
                   which is §2's rule read one storey up. -->
              <p v-if="requiresLabel(row)" class="shop-row-wait">
                {{ requiresLabel(row) }} has to come first.
              </p>
              <!-- ⭐⭐ ROUND 29 #5, §3f – ORDERED, AND NOT HERE YET. «Between those two weeks the
                   player owns a CONTRACT, not a boat», so there is nothing to value and nothing to
                   sell – `sellableAsset` refuses the same week, so this is not the gate, it is the
                   honest face of it (R10-16: a disabled control and a refused click tell one
                   story). What the row says instead is the date, which is the whole point of a
                   commission. -->
              <div v-if="isBuilding(row)" class="shop-row-owned is-building">
                <StatRow
                  class="money-row"
                  label="On order"
                  :meta="`paid ${formatCents(row.paidCents ?? 0)}`"
                  :value="weekLabel(row.readyWeek ?? 0)"
                  tone="plain"
                />
                <p class="shop-row-change">It cannot be sold before it is delivered, and it costs nothing to keep until then.</p>
              </div>
              <!-- OWNED: what they paid, what it is worth, and the difference as ONE figure the
                   engine computed. This screen subtracts nothing. -->
              <div v-else-if="row.valueCents !== null" class="shop-row-owned">
                <!-- ⭐⭐ ROUND 29 #9 – `tone="plain"`, AND A DEPRECIATED VALUE IS NOT AN ERROR.
                     The owner's words and the reasoning are in `shopToneNote` in the script block,
                     because Cyrillic inside a template is forbidden - strings AND comments
                     (tests/template-copy-rules.test.ts). In short: `negative` means MONEY OUT, this
                     figure is a BALANCE, and `plain` is StatRow's own word for a balance. -->
                <StatRow class="money-row" label="Worth now" :meta="`paid ${formatCents(row.paidCents ?? 0)}`" :value="formatCents(row.valueCents)" tone="plain" />
                <!-- ⭐⭐⭐ ROUND 30 #14 – THE THREE FIGURES THE DECISION NEEDS. His words and the
                     reasoning are in `shopUnitsNote` in the script block (no Cyrillic in a template).
                     Every number is the engine's: `shopView` counted the units, divided the cost by
                     them and priced the week. This screen divides nothing. -->
                <p v-if="row.unitsHeld !== null && row.avgUnitPriceCents !== null && row.unitPriceCents !== null" class="shop-row-units">
                  {{ formatUnits(row.unitsHeld) }} units &ndash; bought at {{ formatCents(row.avgUnitPriceCents) }} each, {{ formatCents(row.unitPriceCents) }} now
                </p>
                <!-- ⭐⭐⭐ ROUND 30 #8 AND #10 – WHAT THEY CALLED IT. See `shopNamingNote` in the
                     script block (no Cyrillic in a template). One line, the engine's own string,
                     and the row's own label above it is untouched. -->
                <p v-if="row.name" class="shop-row-given-name">Trading as {{ row.name }}</p>
                <p class="shop-row-change" :class="{ 'is-down': (row.changeCents ?? 0) < 0 }">
                  {{ formatCentsSigned(row.changeCents ?? 0) }}
                  <span v-if="row.changePct !== null">since they bought it ({{ row.changePct }}%)</span>
                  <span v-else>since they bought it</span>
                </p>
                <!-- ⭐⭐ ROUND 29 #11 – PUT MORE IN. His words are in `shopTopUpNote` in the
                     script block (no Cyrillic in a template). The control is drawn for an 'open'
                     rung and never for a car; same input, same minimum and same engine command as
                     the opening stake, and `buyAsset` re-validates every one of them. -->
                <label v-if="isTopUp(row)" class="shop-stake">
                  <span class="shop-stake-label">
                    Add more, from {{ formatCents(row.entryCents) }}
                  </span>
                  <input
                    v-model="stakeDollars[row.id]"
                    class="shop-stake-input"
                    type="number"
                    inputmode="numeric"
                    :min="Math.round(row.entryCents / 100)"
                    step="100"
                    :placeholder="String(Math.round(row.entryCents / 100))"
                  />
                </label>
                <button v-if="isTopUp(row)" class="shop-action" :disabled="!canBuy(row)" @click="askBuy(row)">
                  Put more in
                </button>
                <!-- ⭐⭐⭐ ROUND 29 PART TWO #4 – HOW MUCH OF IT TO SELL. His words are in
                     `shopPartSaleNote` in the script block (no Cyrillic in a template). Drawn on an
                     'open' rung only, because that is the property that says a holding takes money in
                     and out in parts; a car has one price and one sale. BLANK BY DEFAULT, so the
                     control below keeps the sentence it has always had and keeps meaning all of it. -->
                <label v-if="isTopUp(row)" class="shop-stake">
                  <span class="shop-stake-label">
                    Take out how much, or leave it blank for all {{ formatCents(row.valueCents) }}
                  </span>
                  <input
                    v-model="sellDollars[row.id]"
                    class="shop-stake-input shop-sell-input"
                    type="number"
                    inputmode="numeric"
                    min="1"
                    step="100"
                    :max="Math.round(row.valueCents / 100)"
                    placeholder="all of it"
                  />
                </label>
                <button class="shop-action" :disabled="!canSell(row)" @click="askSell(row)">
                  {{
                    isTopUp(row) && sellCentsFor(row) !== null && (sellCentsFor(row) ?? 0) < row.valueCents
                      ? `Take out ${formatCents(sellCentsFor(row) ?? 0)}`
                      : `Sell it for ${formatCents(row.valueCents)}`
                  }}
                </button>
              </div>
              <!-- NOT OWNED: the price, and a control that is pressable or is not. -->
              <div v-else class="shop-row-buy">
                <!-- ⭐⭐ ROUND 30 #14 – THE ENTRY PRICE, BEFORE THERE IS A HOLDING. See
                     `shopUnitsNote` in the script block. -->
                <p v-if="row.unitPriceCents !== null" class="shop-row-units">
                  One unit is {{ formatCents(row.unitPriceCents) }} this week
                </p>
                <label v-if="row.stake === 'open'" class="shop-stake">
                  <span class="shop-stake-label">
                    How much, from {{ formatCents(row.entryCents) }}
                  </span>
                  <input
                    v-model="stakeDollars[row.id]"
                    class="shop-stake-input"
                    type="number"
                    inputmode="numeric"
                    :min="Math.round(row.entryCents / 100)"
                    step="100"
                    :placeholder="String(Math.round(row.entryCents / 100))"
                  />
                </label>
                <span v-else class="shop-row-price">{{ formatCents(row.entryCents) }}</span>
                <!-- ⭐⭐⭐ ROUND 30 #8 AND #10 – NAME IT. See `shopNamingNote` in the script block for
                     his words (no Cyrillic in a template) and for the four rules the typed value is
                     bound by. The chips WRITE INTO THE FIELD rather than sitting beside it, so there
                     is exactly one value on screen and «I picked a chip but there was text in the
                     box» is not a state this control can be in. The field starts on the first
                     suggestion, so a player who never touches it still buys a brand with her name
                     on it. -->
                <div v-if="row.nameOptions.length > 0" class="shop-naming">
                  <span class="shop-stake-label">What is it called</span>
                  <div class="shop-naming-chips">
                    <button
                      v-for="option in row.nameOptions"
                      :key="option"
                      type="button"
                      class="shop-naming-chip"
                      :class="{ 'is-on': nameFor(row) === option }"
                      @click="nameDrafts[row.id] = option"
                    >
                      {{ option }}
                    </button>
                  </div>
                  <input
                    :value="nameFor(row)"
                    class="shop-stake-input shop-naming-input"
                    type="text"
                    :maxlength="ASSET_NAME_MAX_CHARS"
                    placeholder="or type your own"
                    aria-label="What it is called"
                    @input="nameDrafts[row.id] = ($event.target as HTMLInputElement).value"
                  />
                </div>
                <!-- ⭐ §3f – A COMMISSIONED THING IS ORDERED, NOT BOUGHT, and the verb on the control
                     is the one difference the player can see before he presses it. -->
                <button class="shop-action" :disabled="!canBuy(row)" @click="askBuy(row)">
                  {{ row.stake === 'open' ? 'Put it in' : row.buildWeeks > 0 ? 'Order it' : 'Buy it' }}
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <!-- ====================== 9. HER SHARE OF THE CHEQUES ======================
           ROUND 26 #5b. His words are in the script block above and in
           tests/component/round26-money-share.test.ts, because Cyrillic inside a <template> is
           forbidden (tests/template-copy-rules.test.ts). Two sentences and no control: the first is
           the engine's own (`kidLife.ownAccountNote`, balance + the ramp), the second is the
           DIRECTION, which is the half nothing in the game had ever said out loud. Absent before
           her eighteenth.

           ⚠⚠ DEMOTED FROM THE TOP OF THE SCREEN, 27.08, ON THE OWNER'S OWN WORD – keep the strip,
           but move it down, it is not the main thing. His sentence is quoted in full in the script
           block above (`kidShareNote`), where Cyrillic belongs. It used to sit above the tab
           switcher as section 1a-bis. He asked for this at the same moment he asked for her cut on
           the WEEK RECAP's Finances tile (WeekRecapCard.vue), which is where he actually reads the
           week – so the telling moves to the surface he uses and this keeps the long version.
           KEPT, NOT DELETED, and not one sentence of it re-written: the copy below is what round 26
           #5b shipped, and tests/component/round26-money-share.test.ts still holds it to every
           clause.
           ⚠ STILL OUTSIDE EVERY `screenTab` GUARD, which is the half of its old placement that was
           never about height: it is on the screen whichever tab is open – including the ledger,
           where the prize rows it is about live. Only its position in the column changed.
           ⚠ ...AND THAT POSITION COST EXACTLY ONE WORD, WHICH IS RECORDED HERE RATHER THAN LEFT TO
           BE FOUND. The last sentence used to read «The prize rows BELOW», written from a strip that
           sat above everything; from the foot of the screen those rows are ABOVE it, so the word is
           the other one now. It is a direction, not a claim: the message, the tone and every clause
           the mounted test asserts are untouched. A demotion that leaves a sentence pointing the
           wrong way is not a demotion, it is a small lie with a good excuse. -->
      <p v-if="kidShareNote" class="money-share" role="note">
        <strong>{{ kidShareNote }}</strong>
        Every prize cheque is split before it reaches this account: her part goes to her, the family
        banks the rest. The prize rows above are what the family kept, and each one names the share
        that left.
      </p>

      <ConfirmDialog
        v-if="pendingKit"
        :message="kitConfirmMessage"
        confirm-label="Buy it"
        @confirm="confirmKit"
        @cancel="pendingKit = null"
      />
      <!-- ⭐ ROUND 29 #5 – the verb on the control matches the verb in the question: a commissioned
           thing is ORDERED, and a button reading "Buy it" under a sentence about a three-year wait
           would be the two halves of one decision disagreeing. -->
      <ConfirmDialog
        v-if="pendingShop"
        :message="shopConfirmMessage"
        :confirm-label="pendingShop.kind === 'sell' ? 'Sell it' : pendingShop.buildWeeks ? 'Order it' : 'Buy it'"
        @confirm="confirmShop"
        @cancel="pendingShop = null"
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

/* ROUND 26 #5b – her share. The debt strip's box, in the app's own "money came in" colour rather
   than the warning one: this is not a problem, it is where a part of the family's money now goes.
   `--money-in` is the single token for that meaning (see note 3 in the script header).
   ⚠ THE MARGIN FLIPPED WITH THE 27.08 DEMOTION («переместить вниз, она не главная»): it used to
   open a gap UNDER itself at the top of the screen and now opens one ABOVE itself at the foot of it.
   Same 14px, other side – the strip is no longer separating the header from the tabs, it is being
   set apart from the chapter it now follows. */
.money-share {
  margin: 14px 0 0;
  padding: 10px 12px;
  border-radius: var(--radius-control);
  border: var(--stroke-hair) solid var(--money-in);
  background: color-mix(in srgb, var(--money-in) 10%, transparent);
  font-size: 13px;
  line-height: 1.45;
  color: var(--ink-2);
}

.money-share strong {
  display: block;
  margin-bottom: 4px;
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

/* ⚠ BOTH RULINGS MOVED TO THE CONTROL (DRY-8, 19.08). The plate coming off (owner, 02.08) is
   `SegmentedRow`'s `appearance="bare"`; the bigger touch target for a page's chapter picker (owner,
   05.08, naming this screen and the settings together) is `appearance="chapter"`. Both live once in
   `src/style.css`, with the measurement and the "not globally" argument beside them - this screen,
   Stats and More had each carried a private copy, and the `:deep(.tab-pill)` escape each needed is
   gone with them.

   ⚠ THE PERIOD SWITCH BELOW KEEPS ITS PLATE, and that is the whole reason `chapter` is opt-in rather
   than a global pill size. That one is not the same object doing the same job: these tabs are the
   page's own chapters, the 12w/season pills are a filter INSIDE one of them, and the plate is what
   says so. Two identical-looking rows stacked six pixels apart would read as one broken control.

   WHAT STAYS HERE is the gap under the switcher, which is this page's rhythm: «и с отступом внизу
   небольшим» (owner, 05.08). The switcher had none at all, so the first block of whichever chapter
   is open opened flush against the pills. The same 14px `.more-tabs` has carried since it shipped,
   so the two screens he named in one sentence breathe the same amount. */
.money-tabs {
  margin-bottom: 14px;
}


/* --- 3. THE PERIOD ---------------------------------------------------------------------------- */

.money-window {
  margin-top: 14px;
}

/* ⭐⭐ ROUND 30 #5 – THE SECOND ROW OF TABS, INSIDE A CHAPTER. It is `.money-window`'s object (the
   Spending period switcher he named as the model) with one addition, and the addition is a 375px
   argument rather than a taste one.

   ⚠⚠ SIX SEGMENTS DO NOT FIT ON A PHONE AT THE SHARED PILL METRICS. `.tab-pill` is 13px type in
   6px/16px padding, which puts Invest/Cars/Property/Business/Water/Air at roughly 450px against the
   343px a 375px phone actually has inside `--app-pad-x`. `.tab-row` is a bare `display: flex` with
   no wrap, so the overflow would push the DOCUMENT sideways - and "at 375 px the app does not scroll
   sideways" is one of the two invariants `e2e/responsive.spec.ts` has held since it was written.

   The row is therefore allowed to WRAP rather than to overflow, and the pills are tightened so that
   on the phone it does not have to. Both halves are wanted: the tightening is what keeps his «в ряд»
   true at the width he plays at, and the wrap is the guarantee that a longer word, a larger font or
   a 320px screen costs a second line instead of a broken page. Verified in a real browser at 375px
   by `e2e/responsive.spec.ts`, which now opens both chapters. */
.money-subtabs {
  flex-wrap: wrap;
  row-gap: 4px;
  border-radius: var(--radius-card);
}

.shelf-tabs :deep(.tab-pill) {
  padding-inline: 9px;
  font-size: 12px;
}

/* The empty arm of a sub-tab still has to say something – see the note in the template. */
.money-subtab-empty {
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

/* ...and what is LEFT of them on the rung she owns (round 21 #10). Louder than the "good weeks" it
   qualifies, because it is the live number: the other one is a catalogue fact that never moves, and
   this one is the week-by-week countdown the parent is actually deciding on. It wraps onto its own
   line inside the button rather than widening it - the four rungs are a two-column grid at 375px. */
.kit-rung-left {
  display: inline-block;
  font-weight: 700;
  color: var(--ink);
}

/* A line the brand is paying for: the sticker is struck through and what the family actually hands
   over sits beside it, in the money-in colour the ledger already uses for somebody else's money. */
/* ROUND-23 #17: the qualifier is quieter than the number it qualifies - the parent is deciding with
   the price, and a word set at the same weight would read as part of the figure. It sits inline so
   the two-column grid at 375px can break the line between the word and the money rather than
   widening the button. */
.kit-rung-approx {
  font-weight: 500;
  color: var(--ink-soft);
  opacity: 0.8;
}

.kit-rung-price.is-covered {
  color: var(--money-in);
}

/* ...and inside the covered arm it must not take the money-in colour: it qualifies the STICKER, and
   the green is reserved for the half somebody else is paying. */
.kit-rung-price.is-covered .kit-rung-approx {
  color: var(--ink-soft);
  margin-right: 4px;
}
.kit-rung-price.is-covered s {
  color: var(--ink-soft);
  opacity: 0.7;
  margin-right: 4px;
}

.ad-slot {
  padding: 8px 0 6px;
  border-top: 1px solid var(--line-soft, rgba(127, 127, 127, 0.18));
}
.ad-slot-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: baseline;
}
.ad-slot-name {
  font-weight: 600;
}
.ad-slot-brand {
  font-weight: 600;
}
.ad-slot-state {
  opacity: 0.62;
  font-size: 13px;
}
.is-closed .ad-slot-name {
  opacity: 0.55;
}
.ad-slot-note {
  margin: 2px 0 0;
  font-size: 13px;
  opacity: 0.75;
}

.kit-line-sponsored {
  margin: 8px 0 0;
  font-size: 11.5px;
  line-height: 1.35;
  color: var(--money-in);
}

/* ============================== THE SHELF (v63) ==============================
   The kit block's own idiom one card down, deliberately: a family, its rows, a price and a control.
   Nothing here spells a hex - every colour is a token from src/style.css. */
.money-shop .is-empty-shelf {
  color: var(--ink);
}

/* ⭐⭐ ROUND 30 #5 – THE FEED, and it is the Season screen's arrangement rather than a card full of
   rows. `.event-cards` on SeasonScreen is a 12px-gap column of cards laid straight on the page; so
   is this. The 14px above it is the same gap `.money-tabs` leaves under the chapter picker, so the
   first card opens the same distance below the tab row as the first block of every other chapter. */
.shelf-feed {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 14px;
}

/* ⚠ THE HAIRLINE ABOVE A FAMILY IS GONE WITH THE PLATE IT DIVIDED. It was a rule INSIDE one card,
   separating a family from the one above it; on a page of free-standing cards there is nothing on
   either side of it to divide, and a line drawn across the page between two cards reads as a
   separator the design does not have. The heading and its note are the divider now, which is what
   they always were doing. */
.shop-family {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* The heading and its note are one object with the cards under them, so they keep the tighter
   spacing they had inside the card rather than the feed's 12px. */
.shop-family-head + .shop-family-note {
  margin-top: -8px;
}

.shop-family-head {
  font-family: var(--font-heading);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: -0.015em;
  color: var(--ink);
}

.shop-family-note {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.35;
  color: var(--ink-soft);
  text-wrap: pretty;
}

/* ⚠ THE ROW IS A CARD NOW, so the hand-rolled border and the 11px radius are gone: `Card`'s own
   hairline and the radius ladder's card rung do that job, and a second set of both inside them was
   the "plate behind a plate" this item is undoing. `variant="photo"` pads to zero on purpose - the
   art band bleeds to the card's own edges and the words below it carry the inset. */
.shop-row-body {
  padding: 12px;
}

/* THE CARD'S OWN PICTURE, when there is one. A band rather than a bleed-behind-the-words: the
   objects on this shelf are things (a car, a boat, an aeroplane), and a thing wants to be seen
   whole rather than read through. The scrim is the Season card's, softened, so a bright painting
   cannot fight the hairline under it. ⚠ THE WHOLE BLOCK IS ABSENT when there is no painting - see
   `shelfArtUrl` - and the card is then simply a card, which is the state it ships in today. */
.card-art {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.card-art img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-art-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgb(0 0 0 / 0%) 55%, rgb(0 0 0 / 45%) 100%);
}

/* On the two Bills cards the band sits inside a padded card, so it cancels that padding to reach
   the card's edges the way it does on a shop row. */
.money-panel > .card-art:first-child {
  margin: -14px -14px 12px;
  border-radius: var(--radius-card) var(--radius-card) 0 0;
}

.shop-row-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.shop-row-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
  overflow-wrap: anywhere;
}

/* ⚠ THE LOSING ROWS SAY SO IN THE INK AS WELL AS IN THE WORDS, because the whole point of the car
   family is that it goes the other way (spec §3b). `--money-out` is the app's one colour for money
   leaving, so the shelf borrows it rather than inventing a second red. */
.shop-row-rate {
  font-size: 11px;
  font-weight: 700;
  color: var(--money-in);
  white-space: nowrap;
}

.shop-row-rate.is-down {
  color: var(--money-out);
}

.shop-row-blurb {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.35;
  color: var(--ink-soft);
  text-wrap: pretty;
}

/* ⭐ ROUND 29 #5, §3f – THE WEEKLY BILL READS AS MONEY LEAVING, because it is: unlike the rate two
   rules up (a valuation) this figure really goes out of the wallet every week. Same `--money-out`
   the ledger paints an expense in, so nothing new is invented for it. */
.shop-row-upkeep {
  margin: 4px 0 0;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--money-out);
}

/* ⭐ ROUND 29 PART FOUR P7 – the mirror of the upkeep line: money that ARRIVES every week, in the
   app's one green for that meaning (note 3 in the script header). Same size and weight as its
   mirror, deliberately – two facts of equal rank, never netted. */
.shop-row-earning {
  margin: 4px 0 0;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--money-in);
}

/* ⭐ ROUND 30 #14 – the units line: a supporting fact under the headline figure and never a headline
   of its own, so it takes the blurb's quiet ink rather than either money colour. It is a COUNT and a
   PRICE, not money moving. */
.shop-row-units {
  margin: 4px 0 0;
  font-size: 11.5px;
  color: var(--ink-soft);
}

/* ⭐⭐⭐ ROUND 30 #8 AND #10 – WHAT THEY CALLED IT, and the naming control that set it.
   ⚠⚠ `overflow-wrap: anywhere` IS THE 375px GUARANTEE AND NOT A GARNISH. The string is
   player-authored: `sanitiseAssetName` caps it at 24 code points and forbids everything but letters,
   digits, the space and `& . ' -`, which bounds the LENGTH – but twenty-four unbroken letters is a
   word no browser will break on its own, and a shop card is 343px of content at 375px. The cap and
   this rule together are what make «it cannot break a layout at 375px» true rather than likely, and
   `tests/component/round30-brand-naming.test.ts` measures it against the viewport rather than
   trusting either half. */
.shop-row-given-name {
  margin: 4px 0 0;
  font-size: 11.5px;
  color: var(--ink-soft);
  overflow-wrap: anywhere;
}

.shop-naming {
  display: block;
  margin-top: 8px;
}

.shop-naming-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 4px 0 6px;
}

.shop-naming-chip {
  padding: 5px 10px;
  border: 1px solid var(--line);
  /* ⚠ THE TOKEN AND NOT A BARE 999px – the owner's capsule-vs-circle ruling of 26.07, pinned in
     tests/round10.test.ts: a wide short element wants the CAPSULE (clamped to half the height), and
     the magic number has to be findable by grep. Caught by that pin on this wave's first gate. */
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--ink-soft);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  /* the chips carry suggestions built from her surname, so the same 24-cap and the same wrap. */
  overflow-wrap: anywhere;
  max-width: 100%;
}

.shop-naming-chip.is-on {
  border-color: var(--ink);
  color: var(--ink);
}

/* ⚠ WIDER THAN THE MONEY BOXES ON PURPOSE: `.shop-stake-input` is 8.5em because it holds a figure,
   and a name is words. `max-width: 100%` keeps it inside the card at 375px either way. */
.shop-naming-input {
  width: 100%;
  font-weight: 600;
}

/* The wait and the stage under it – facts about WHEN, not about money, so they take the quiet ink
   the blurb takes rather than either money colour. */
.shop-row-wait {
  margin: 4px 0 0;
  font-size: 11.5px;
  line-height: 1.35;
  color: var(--ink-soft);
  text-wrap: pretty;
}

.shop-row-owned,
.shop-row-buy {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

.shop-row-owned {
  display: block;
}

.shop-row-change {
  margin: 6px 0 0;
  font-size: 11.5px;
  line-height: 1.35;
  color: var(--money-in);
}

.shop-row-change.is-down {
  color: var(--money-out);
}

.shop-row-price {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
}

.shop-stake {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.shop-stake-label {
  font-size: 11px;
  color: var(--ink-soft);
}

.shop-stake-input {
  width: 8.5em;
  max-width: 100%;
  padding: 7px 9px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: transparent;
  color: var(--ink);
  font-size: 13px;
  font-weight: 700;
}

.shop-action {
  margin-top: 8px;
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: transparent;
  color: var(--ink);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.shop-action:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>

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
import { planWeek } from '../engine/plan'
import { vacationPackage } from '../engine/economy'
import { vacationArtUrl, weekArtUrl, weekSceneArtUrl } from '../art/weeks'
import { weekLabel } from '../shared/dates'
import { formatCents, formatCentsSigned } from '../shared/money'
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

// ⭐ ROUND-17 #26 – WHICH WEEKS ARE CROPPED SIDEWAYS.
//
// ⚠ THE SCENE KIND IS NOT ENOUGH, and the reason is one line up in `weekSceneArtUrl`: a vacation
// scene whose package has no painting yet falls back to `weekArtUrl(week)` – «a caller must handle
// that rather than render a 404, because the package catalogue can grow before the art does». That
// fallback is a 1.88:1 week painting, and shifting IT to 90% would push the crop off the picture in
// the opposite direction. So the test is "is a vacation frame actually on screen", which is the
// same question `vacationArtUrl` already answers by returning null.
const isVacationScene = computed(
  () => scene.value?.kind === 'vacation' && vacationArtUrl(scene.value.packageId) !== null,
)

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
// ⚠ AND AT v47 THAT ONE FILE STOPPED BEING THE PRESET EXPANDER. It read
// `sessionDays(sessionsForPlan(plan.train))` - the arrangement a SCALAR draws - which was the same
// answer for every plan that could exist until the player could tick his own days. The moment he can,
// the scalar's arrangement and his are different weeks, and this card would have gone back to
// disagreeing with the calendar about the same Sunday: the exact defect the paragraph above is
// about, reintroduced from the other end. `planWeek` is the plan itself, and a save that predates
// v47 still reads back through the expander inside it, so nothing about a legacy career moves.
//
// ⚠ AND IT IS THE PLAN AS TICKED, NOT `resolveWeek`'d. The capacity on the snapshot is next week's;
// this card is a week that has already happened, and re-laying a past week under a future week's
// school calendar would be worse than drawing the plan he set.
//
// The dots stay TRAIN/REST rather than learning the calendar's court-versus-gym distinction: this tile
// is a two-number summary of a week that has already happened (see the pin in
// tests/radar-training.test.ts for how tightly it is bounded), and the gym day is a detail the grid
// on screen H has room for.
const dayDots = computed<('train' | 'rest')[]>(() => {
  const week = planWeek(plan.value)
  return DAY_LETTERS.map((_, i) => ((week[i]?.length ?? 0) > 0 ? 'train' : 'rest'))
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

// =================================================================================================
// ⭐⭐⭐ HER CUT, UNDER THE BALANCE, AS A MEMO – AND NOT AS A SUBTRACTION (owner, 27.08)
// =================================================================================================
//
// HIS ASK: «на плашке Finances на week recap после турниров можно писать что-то вроде Income $sum /
// Spent $sum / Her cut 10% $sum / Balance $sum. Мне кажется так будет нагляднее.»
//
// ⚠⚠ AND HIS ARITHMETIC AS WRITTEN DOUBLE-COUNTS, WHICH IS WHY THIS IS A MEMO AND NOT A ROW.
// `finalizeTournament` credits the family `prize − herShare` (world.ts), and the ledger row is
// deliberately «what the family actually banked» – the academy travel-subsidy precedent quoted in
// its own comment. So `incomeCents` above is ALREADY NET of her cut, and a fourth row subtracting it
// again would print a balance the till never had. He was shown the two honest layouts and chose this
// one: «(B) мемо под балансом - вот это хорошо, да».
//
// ⚠ SO NOTHING ABOVE THIS LINE MAY CHANGE. `balanceCents` keeps its definition to the character.
// ⚠⚠ THE SECOND HALF OF THIS PARAGRAPH IS SUPERSEDED BY PART TWO #1 BELOW, AND IS KEPT BECAUSE IT
// RECORDS WHY THE MEMO WAS RIGHT WHILE THE COLUMN WAS NETTED. It read: «the memo is deliberately NOT
// a `.recap-row` with a signed `.recap-row-val` … `formatCents` and never `formatCentsSigned` – a
// leading + or − is the exact misreading the layout exists to prevent.» That was true of a column
// whose Income was ALREADY net, where a signed cut could only read as a second subtraction. The
// column is no longer netted, so her cut is a signed row inside the sum and the sign is now the
// honest thing rather than the misreading. `balanceCents` did not move a cent either way.
//
// ⚠ THE FIGURE IS CARRIED, NOT RECONSTRUCTED. `FinanceWeekPoint.kidShareCents` is the `herShare` the
// engine credited to her account, off the same durable ledger row this card already reads Income and
// Spent from – so it survives the event feed's 400-row cap for the same reason they do, and no
// screen ever divides a family row back by the ramp to guess at it (the penny
// `kidPrizeShareCents`' own comment forbids).
//
// ⚠ SILENT BEFORE HER EIGHTEENTH, and by the prize event's own rule rather than by a second copy of
// it: the engine writes `kidShare` only inside `if (herShare > 0)`, so the age gate lives once, in
// `ECONOMY.kidShare`. Silent too on any week the tennis paid nothing.
//
// ⚠ THE PERCENTAGE IS ALREADY WHOLE (`kidSharePct`, rounded once in `financeSeries`) – the owner's
// rule of 26.08. This file must not divide basis points.
//
// ⭐⭐⭐ ROUND 29 #10 – AND IT NOW NAMES THE BASE, BECAUSE THE PERCENTAGE HAD NONE ON SCREEN.
//
// THE OWNER, off his w780 save: «Income +$29,046 · Spent -$6,883 · Balance +$22,164 · Her cut 50%
// $27,600 – это не 50% по сравнению с income».
//
// ⚠⚠ HE IS RIGHT, AND THE SPLIT IS NOT WHAT IS WRONG. Measured across all 27 weeks of that save
// that credited her, and reproduced in a live engine run: she is paid EXACTLY half of every gross
// cheque, to the cent. His week 738 is the whole story – prize row $23,000, her cut $27,600, and
// both correct: the tournament's cheque was $46,000 GROSS, `finalizeTournament` banks the family
// `prize − herShare` so the row is already net, and the kit contract's result bonus paid a further
// $9,200 gross that the same ramp also split. Half of $55,200 is $27,600. The `Income` figure on
// this very tile is the family's REMAINDER, so it is the one number «50%» can never be a share of –
// and it was the only base a reader had. **The label was quoting a base that was not on the card.**
//
// So the memo prints the base. `kidShareBaseCents` is the gross the engine actually applied the
// ramp to, carried on the ledger row beside the cents (see `FinanceWeekKidShare.baseCents`) – never
// `cents / pct`, which is the division that produced two wrong readings of this item before anybody
// measured it, and which cannot survive the per-cheque rounding anyway.
//
// ⚠ AND IT FALLS BACK RATHER THAN GUESSING. The base is FORWARD-ONLY: a week banked before that
// field existed has none, and no ratio may invent one. Those weeks keep the exact line they printed
// before, which is why the old wording is still here rather than deleted.
//
// =================================================================================================
// ⭐⭐⭐ ROUND 29 PART TWO #1 – ...AND THAT ANSWER WAS WRONG, BECAUSE HE NEVER ASKED FOR AN EXPLANATION
// =================================================================================================
//
// HIS WORDS, 29.08: «У нас есть одна сумма призовых, допустим 55200, тогда и ее доля будет 27600 и у
// нас income должен показывать 27600, а на соседней строчке все остальные расходы. Можно это
// сделать?» – and on the sentence #10 shipped instead: «это усложнило и фразу и интерфейс».
//
// ⚠⚠ #10 DIAGNOSED IT CORRECTLY AND FIXED THE WRONG HALF. The diagnosis stands to the cent: the
// ledger's prize row is already NET and «50%» had no base on screen. But the repair was to put the
// base INTO THE SENTENCE, and what he wants is for the TILE TO STOP NETTING SILENTLY. One gross
// figure, her half, the family's half, the expenses beside them – **a row must mean what its name
// says**, and the test he set himself is that a player can add the numbers on screen and get the
// right answer without knowing anything about our internals.
//
// ⚠⚠ THE STORE STAYS NET AND ONLY THE TILE CHANGES, AND THAT IS A DECISION WITH THREE REASONS.
// `byCategory.prize` could have become the GROSS with her cut as a real outgoing category; both
// shapes are defensible and this one was chosen because:
//   1. `financeWeeks` IS PERSISTED and his save holds sixty of them, all written under the NET
//      convention. A gross `prize` would make `financeWindow` fold sixty net rows together with new
//      gross ones and print a season income the family never had. Forward-only means a career's
//      history keeps reading as it read, and only a display can promise that.
//   2. `careerTotals.prizeCents` is documented as «prize money THE FAMILY KEPT» (the album's
//      break-even page), and booking her cut as a family EXPENSE is what `finalizeTournament`'s own
//      note forbids in as many words: it «would count the same cents twice».
//   3. The engine ALREADY carries the gross – `FinanceWeek.kidShare.baseCents`, added by #10 for
//      exactly this. So nothing new is persisted, `SAVE_SCHEMA_VERSION` does not move, and the fix
//      is the USE of that field the item actually wanted: rows, not a footnote.
//
// ⚠ SO THE COLUMN ADDS UP, EXACTLY, IN CENTS. `kept = base − cut` is the family's half of the split
// cheques, `other = income − kept` is everything else that came in, and
// `base − cut + other − spent === income − spent === balance` by construction. No figure on the tile
// is derived by dividing anything, and `balanceCents` above keeps its definition to the character.
//
// ⚠ AND IT FALLS BACK ON ANY WEEK IT CANNOT DO HONESTLY: no recorded base (every week his save
// already banked), or a derivation that would print a NEGATIVE «Other income» because a category
// that took a split cheque closed the week net-negative. Those weeks keep the exact three rows they
// printed before. ⚠⚠ HISTORICAL WEEKS THEREFORE READ EXACTLY AS THEY DID – said out loud because
// the brief asked: the new shape is forward-only, like the base it reads.
//
// =================================================================================================
// ⭐⭐⭐ ROUND 30 #1 – AND FIVE ROWS WAS MORE THAN HE ASKED FOR. FEWER ROWS, NOT MORE.
// =================================================================================================
//
// HIS WORDS, 30.08, having played it: «вернуть все цифры и надписи как было до этого: Income /
// Spent / Balance, ниже her cut без жирного шрифта, ниже coach's cut если есть результат. Всё
// остальное лишнее, дублирующее и сбивает с толку. Other income странно звучит, можно
// переименовать… например Family income и тогда эту строчку тоже оставить здесь.»
//
// ⚠⚠ PART TWO #1 OVERSHOT. He had asked for ONE prize figure so the rows would add up; what shipped
// was a five-row column – `Before her cut` / `Her cut N%` / `Other income` / `Spent` / `Balance` –
// which puts her cut on screen TWICE (a signed row and then the memo under the balance) and puts a
// gross on screen that no other surface in the game quotes. That is the duplication he names. The
// column goes back to the pair it always was, and the whole story is told BELOW the balance, where
// he himself put her cut in the first place («мемо под балансом - вот это хорошо, да», 27.08).
//
// ⚠ THE PARAGRAPHS ABOVE ARE KEPT, SUPERSEDED, BECAUSE THEY RECORD WHY THE STORE STAYS NET – that
// half of part two #1 was right and is untouched. `financeWeeks` is still persisted under the NET
// convention, `careerTotals.prizeCents` is still «what the family kept», and nothing here re-books
// a cent. Only the TILE changed, and it has changed back.
//
// ⚠ `balanceCents` HAS NOW SURVIVED THREE RESHAPES WITH ITS DEFINITION UNMOVED, which is the point:
// income + spend, and her cut has never been allowed to touch it because `finalizeTournament` took
// it out before the family banked anything.
const kidCutCents = computed(() => weekFinance.value?.kidShareCents ?? 0)
// ⚠ ROUND 31 #2 REMOVED `kidCutPct` (`FinanceWeekPoint.kidSharePct`) FROM THIS FILE, AND THE FIELD
// IS DELIBERATELY STILL ON THE WIRE. It is the week's BLEND across every rule that paid her, which
// round 30 #21 measured as a number no rule in this game states – and it was the memo's fallback on
// a save too old to carry the parts. The memo prints the prize part's own rate now or prints
// nothing, so the last reader of the blend on this card is gone; the field stays because it is what
// makes `cents === round(baseCents × bps / 10_000)` checkable, and its own header says so.

/** The gross, her half and the rest of the week's income – or null on a week the tile cannot break
 *  that down honestly.
 *
 *  ⚠ ROUND 30 #1 NARROWED WHAT THIS FEEDS, IT DID NOT CHANGE THE ARITHMETIC. It used to decide
 *  between two whole column shapes; the column is one shape now and the only survivor of the split
 *  is `other`, which is the line he asked to keep under a new name. `base` and `cut` stay because
 *  they are what makes `other` derivable at all, and because the guards below are the reason no
 *  week can print a figure the tile cannot stand behind. */
const grossSplit = computed(() => {
  const base = weekFinance.value?.kidShareBaseCents ?? 0
  const cut = kidCutCents.value
  if (base <= 0 || cut <= 0) return null
  const kept = base - cut
  const other = incomeCents.value - kept
  // A negative «Family income» would be a row whose name is a lie, which is the very defect this
  // guard has always existed to prevent. Fall back instead – the line simply does not appear.
  if (other < 0) return null
  return { base, cut, other }
})

// =================================================================================================
// ⭐⭐⭐ ROUND 31 #2 – THE COLUMN IS AN ADDITION AGAIN, AND `Income` FINALLY MEANS WHAT IT SAYS
// =================================================================================================
//
// HIS WORDS, 31.08, restating the target himself for the third time: «еще раз, у нас изначально
// было: Income - то, что пришло с турнира / Spent - То, что потрачено на дорогу + другие траты
// недели / Balance - что в итоге пришло на счет. Я просил: Income - то, что пришло с турнира /
// Other income - Другие семейные доходы / Spent - То, что потрачено на дорогу + другие траты недели
// / Balance - что в итоге пришло на счет. и вот здесь her cut от Income»
//
// ⚠⚠ TWO DEFECTS, AND THE SECOND IS WHY HIS FIGURES LOOKED INVENTED.
//
//  (a) `Income` WAS NOT WHAT ITS LABEL SAID. `incomeCents` is the family's WHOLE week – every
//      positive category, so a sponsor cheque, a brand fee, the parents' wages and the bank's
//      interest were all inside a row he reads as «то, что пришло с турнира». `prizeIncomeCents` is
//      the tournament's own half of it, carried on the point since this round (engine/world/ledger.ts;
//      nothing new is persisted – `'prize'` has been a ledger category since task #17).
//
//  (b) `Family income` WAS A SLICE, NOT AN ADDEND, and it was derived from HER CUT'S BASE –
//      `income − (base − cut)`. That is why it appeared and vanished: it existed only on weeks that
//      split a cheque, and could say nothing at all about an ordinary week's other money. It is
//      `income − prize` now, which is the same idea stated against the row above it rather than
//      against a memo below it, and it is defined on EVERY week.
//
// ⭐ SO THE THREE ROWS ADD UP TO THE BALANCE, ON EVERY WEEK AND EVERY SAVE, and that is the property
// he has been asking for since part two #1: Income + Family income − Spent === Balance, by
// construction rather than by coincidence, because `prizeIncomeCents` is taken out of `incomeCents`
// under the same `> 0` gate that built it.
//
// ⚠ THE LABEL IS UNTOUCHED. It is still `Family income`, the name he typed himself in round 30 #1
// («Other income странно звучит, можно переименовать… например Family income и тогда эту строчку
// тоже оставить здесь»), and he confirmed it again here – «Other income – другие семейные доходы
// (можно и Family income)». Invariant 4 cuts both ways: only the row's POSITION and its ARITHMETIC
// moved, not one character of its name.
//
// ⚠ AND `balanceCents` STILL HAS NOT MOVED A CENT, through what is now its fourth reshape. It is
// income + spend, signed, and a week that ended below zero prints below zero – his «что пришло на
// счет (ну или ушло, в зависимости от исхода)».

/** THE FINANCES COLUMN – Income / Family income / Spent, his own three, in his own order. As a list
 *  so the template holds no arithmetic and the test can read the rendered figures back off the
 *  screen and sum them, which is still his own test in his own words: a player with a calculator
 *  adds what is on screen and gets the balance under it.
 *
 *  ⚠ `tone` IS THE ROW'S KIND AND NOT THE SIGN OF ITS FIGURE, which is the pair's historical
 *  behaviour kept to the character: a week that spent nothing printed «+$0» in the money-out colour
 *  before any of this and still does. Deriving the class from `cents < 0` would repaint that row on
 *  a quiet week, which is a contrast question and not a money one.
 *
 *  ⚠ ALL THREE ON EVERY WEEK, INCLUDING THE ZEROES. A row that comes and goes is exactly what made
 *  the old `Family income` unreadable – he could not tell a week with none from a week the card had
 *  nothing to say about – and a column that changes length cannot be added up by eye. */
const prizeIncomeCents = computed(() => weekFinance.value?.prizeIncomeCents ?? 0)
const financeRows = computed<{ key: string; cents: number; tone: 'positive' | 'negative' }[]>(() => [
  { key: 'Income', cents: prizeIncomeCents.value, tone: 'positive' },
  { key: 'Family income', cents: incomeCents.value - prizeIncomeCents.value, tone: 'positive' },
  { key: 'Spent', cents: expenseCents.value, tone: 'negative' },
])

// ⭐⭐ ROUND 29 PART TWO #2 – THE SHORT SENTENCE IS BACK, AND ONLY THE DESTINATION IS LEFT IN IT.
//
// HIS WORDS: «Her cut 50% of $55,200 – $27,600 – это усложнило и фразу и интерфейс – верни Her cut
// 50% – $27,600 как было раньше пожалуйста.»
//
// ⚠ THE LONG FORM IS GONE AND THE BRANCH WENT WITH IT: one string for every week, whether or not the
// base was recorded. ⚠⚠ AND ROUND 30 #1 IS WHY IT MUST STAY GONE EVEN NOW THAT THE BASE IS OFF THE
// CARD AGAIN. Part two #2 was HIS OWN ask – «это усложнило и фразу и интерфейс – верни Her cut 50%
// – $27,600 как было раньше пожалуйста» – so «restore the shape that was there before» does not
// reach back past it to #10's «of $X» clause. He asked for these rows and THIS sentence.
//
// ⚠ HIS EXACT STRING, INCLUDING THE DASH HE TYPED. The pre-#10 memo read «Her cut 50% $27,600» with
// no separator; he quoted the target back as «Her cut 50% – $27,600», and a quoted target beats my
// reading of «как было раньше». The short dash is house law either way. ⚠ ROUND 30 #1 CHANGED ONLY
// ITS WEIGHT, never a character of it.
//
// ⚠ THE FOOT – «The income above is what the family kept.» – IS UNTOUCHED BY ROUND 30 #1 AND STILL
// FIRES ONLY WHERE IT ALWAYS DID: a week with a cut and NO recorded base, i.e. one his save banked
// before round 29 #10 existed. He listed the lines he wants and did not name this one, and invariant
// 4 binds a DELETION as hard as a rename – a sentence I was not asked to remove stays. It is flagged
// in docs/rounds/round-30.md instead: say the word and it goes.
//
// =================================================================================================
// ⭐⭐⭐ ROUND 30 #21 – ...AND ONE SENTENCE WAS BLENDING TWO RULES AND CALLING THE AVERAGE A RULE
// =================================================================================================
//
// HIS WORDS, 30.08, off the w896 save: «Почему-то мне пишут "Her cut 61% – $69,750 into her own
// account", и до этого было про 56%… При том, что на экране бюджета написано "She keeps 50% of every
// prize cheque now"».
//
// ⚠⚠ MEASURED ON HIS SAVE, AND NO FIGURE WAS EVER WRONG. Two rules reach one week since round 29 P3:
// a prize splits at her age ramp and a brand cheque is hers less the manager's fee. His week 894
// banked $80,000 gross of prize at 50% and $35,000 of sponsor money at 85% – $40,000 + $29,750 =
// $69,750 of a $115,000 base, which is 60.65% and rounds to the 61% he read. Week 891 was a sponsor
// cheque alone and said 85%, correctly. What was wrong is that ONE SENTENCE quoted the average of
// two rules as if it were a rule, while the budget screen states the real one.
//
// ⚠⚠ AND IT IS ROUND 29 #10's CLASS AGAIN – a label describing a rule while printing a derived
// number. #10's pin lives below in tests/component/week-recap-kid-share.test.ts and it did not
// catch this, for a reason worth writing down where the next person will read it: the pin asserted
// `pct === kidPrizeShareBps(age)/100` against a fixture that STOPS ON THE FIRST WEEK THE TENNIS PAID
// HER, which is a prize-only week by construction. On a prize-only week the blend IS the ramp, so
// the assertion could not fail on the case it was written to protect. The guard was alive and the
// case was absent from it. The pin now carries a MIXED week too.
//
// ⚠⚠ THE FIX IS THE SPLIT, NOT A RELABEL. `accrueKidShare` records each source's own rate beside the
// blend (`FinanceWeekKidShare.prize` / `.sponsor`), and this memo prints ONE LINE PER RULE. On every
// week governed by a single rule – which is every week in the game before the manager's commission
// shipped, and most weeks after it – the sentence is HIS, to the character, because the part's rate
// and the blend are the same number there. Only a genuinely mixed week prints two lines, and each
// one is separately true: its percentage times its own gross is its own cents.
//
// ⚠ ONE WORD IS ADDED AND ONLY ON THE MIXED WEEK: «Her prize cut …» / «Her sponsor cut …». The two
// monies are already named in exactly these words elsewhere in the game – the event feed writes
// «her share of the prize money» and «her share of the sponsor money», and her own page says «She
// keeps 50% of every prize cheque now. Sponsor cheques are hers, less the manager's 15%.» This
// borrows that vocabulary rather than inventing a third name for either.
//
// ⚠ AND IT IS FORWARD-ONLY, on `kidShareBaseCents`' own reasoning: a week banked before the parts
// existed records only the blend, and the two bases cannot be solved back out of it without the
// division `accrueKidShare`'s header forbids. Those weeks keep the exact line they printed before –
// which for the card he is looking at means the memo corrects itself from her next cheque onward,
// since this tile only ever draws `snapshot.week`.
// =================================================================================================
// ⭐⭐⭐ ROUND 31 #2 – ...AND ONE LINE PER RULE WAS ONE LINE TOO MANY
// =================================================================================================
//
// HIS WORDS, 31.08: «что за Her sponsor cut 85% мне каждую неделю пишут на week results и что там
// снова за цифры странные появились? Я изначально просил просто отразить, что ребенку идет его % с
// призовых и всё. А мы уже второй раз там городим неизвестные суммы какие-то.» And, restating the
// whole card: «и вот здесь her cut от Income».
//
// ⚠⚠ #21's DEFECT WAS REAL AND ITS FIX MUST NOT COME BACK EITHER. The blend – `kidShareCents /
// kidShareBaseCents` across two rules – is a number no rule in this game states, and a label may not
// quote it (see `FinanceWeekKidSharePart`). What #21 got wrong was the REMEDY: it answered a wrong
// percentage by printing a second row on a card he had twice asked to make shorter, and the second
// row was about money he never asked to see weekly.
//
// SO: THE PRIZE RULE, ITS OWN RATE, ITS OWN CENTS, ONE LINE. `kidShareParts` already carries the
// prize part with the rate the engine applied – it is PICKED here, never recomputed, and no total is
// ever divided by another total. Her share of a sponsor cheque is hers in full under the
// manager-commission ruling and is stated on her own page; it is not weekly news.
//
// ⚠ AND THE LINE IS ABSENT RATHER THAN APPROXIMATE, on three weeks:
//   * a week the tennis paid her nothing – there is no prize part, so there is nothing to say;
//   * a week only a brand paid her – same, and it is the «Her sponsor cut 85%» he is complaining of;
//   * a week banked before the parts existed, which carries the blend alone. ⚠⚠ THAT LAST ONE IS
//     WHY THE `kidCutPct` FALLBACK IS GONE: on a mixed legacy week the blend is exactly the number
//     #21 measured as wrong, and printing it under the shorter label would restore the defect with
//     no warning attached. A missing line is honest; a wrong percentage is not.
//
/** HER CUT OF THE PRIZE MONEY – one line, or none. Never a blend, never a second rule's line. */
const kidShareMemo = computed<string | null>(() => {
  if (kidCutCents.value <= 0) return null
  const prize = weekFinance.value?.kidShareParts?.find((p) => p.source === 'prize')
  if (!prize || prize.cents <= 0) return null
  return `Her cut ${prize.pct}% – ${formatCents(prize.cents)} into her own account.`
})
/** The old foot, on the old shape only – see the note above. */
const kidShareFoot = computed(() => (kidCutCents.value > 0 && !grossSplit.value ? 'The income above is what the family kept.' : null))

// ⭐⭐ ROUND 29 PART TWO #13 – THE COACH'S CUT, ON THE WEEKLY SCREEN.
//
// HIS WORDS: «вот и можно как раз добавить cut тренера на weekly экране для прозрачности.» This is
// the FOLLOW-UP to part-one #13, which put the 10%/5% RULE on the coaches page; a rule on a shop
// page and a figure on the week he reads are two different questions, and he asked both.
//
// ⚠⚠ A MEMO AND NOT A ROW, WHICH IS THE OPPOSITE OF HER CUT AND FOR THE OPPOSITE REASON. `Her cut`
// is a ROW because those cents never entered the family ledger, so the column only adds up if the
// gross, the cut and the remainder are all in it. The coach's share IS a family expense – a real
// `coaching` row written the same tick – so it is already inside `Spent` above, and a fourth row
// would make the column charge one cheque twice. It goes under the balance, where the owner himself
// put her cut («мемо под балансом - вот это хорошо, да»), and the sentence says where it already is.
//
// ⚠⚠ AND THE PERCENTAGE IS THE ENGINE'S OWN, NEVER TYPED – part-one #13's binding rule.
// `FinanceWeekPoint.coachCutPct` is `staffResultShareBps('coach', finishIdx)` carried through the
// durable ledger from the very call `finalizeTournament` paid him with, so a retune of
// `ECONOMY.staffShare` moves this line and the cheque together. Nothing here re-derives a rate, and
// no rate is written in this file at all.
//
// ⚠ SILENT ON EVERY OTHER WEEK, which is most of them: below a final the engine writes no row, so
// there is no memo, and the card keeps exactly the shape it has always had.
const coachCutCents = computed(() => weekFinance.value?.coachCutCents ?? 0)
const coachCutMemo = computed(() =>
  coachCutCents.value > 0
    ? `Coach's cut ${weekFinance.value?.coachCutPct ?? 0}% – ${formatCents(coachCutCents.value)}, inside Spent above.`
    : null,
)

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
/** ⭐ ROUND-21 #2: the fourth hand on the same scrap, and the only one that is not a lottery. See
 *  `DiarySnapshot.coachNote` – it is non-null on exactly the trips the family paid a second fare
 *  for, so it says he came every time and never when he did not. */
const coachNote = computed(() => game.snapshot?.diary.coachNote ?? null)


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
// ⚠ NARROWED TO A BOOKED PRACTICE WEEK BY THE COLLEGE WAVE, and it is a trap closed rather than a
// bug fixed. `friendly` means "a watchable match that awards ZERO ranking points", and since that
// wave a national-team RUBBER wears the same flag – deliberately, because it is the one predicate the
// radar, the avatar's emotion, the knock history and the Weekly Story all read to decide whether a
// match is evidence about her form, and a rubber is not. What `friendly` never meant is "practice",
// which is the word the sentence beside this button says. It cannot fire today (the epilogue covers
// the shell for every college week, and the week the recap draws is the year boundary rather than the
// call-up), and "cannot fire today" is precisely how the unreachable copy this wave was sent to fix
// came about. `practice-w<week>` is what `resolvePractice` files under; `nations-w<week>-r<i>` is what
// a rubber does.
const friendlyMatch = computed<WorldMatch | null>(
  () =>
    weekEvents.value.find(
      (e) => e.type === 'match' && e.friendly && e.match?.eventId.startsWith('practice-w'),
    )?.match ?? null,
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
         cards, so the two draw the same picture the same way.
         ⭐ ROUND-17 #26: a vacation week is the one arm whose painting is cropped 45% horizontally
         here, and she is on the right of every one of those six frames – so it says which arm it is
         and the crop follows. Every other scene is square or close to the slot and stays centred. -->
    <div class="week-art recap-art" :class="{ 'recap-art-vacation': isVacationScene }">
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
      <!-- ⭐ ROUND-21 #2 – AND HE WAS THERE, in the week's story. The owner's third ask names the
           three surfaces presence has to reach, and this is the week's-story one. His words in full
           are in tests/component/round21-coach-travel.test.ts - THIS IS A TEMPLATE and
           tests/round13-nav.test.ts bans Cyrillic inside one, comments included.
           ⚠ A SECOND LINE ON THE SAME SCRAP, NOT A REPLACEMENT. `noteText` above is the week's own
           story and must not be displaced by a fact about who came - so this is added under it, on
           exactly the weeks the engine says he travelled (`diary.coachNote`, null on every other
           week including every trip he stayed home for). -->
      <p v-if="coachNote" class="recap-note-text recap-note-coach">{{ coachNote }}</p>
      <svg class="recap-doodle" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">
        <path d="M12 20.2s-7.4-4.6-7.4-9.5A4.1 4.1 0 0 1 12 8.4a4.1 4.1 0 0 1 7.4 2.3c0 4.9-7.4 9.5-7.4 9.5z" />
      </svg>
    </PaperNote>

    <div class="recap-grid">
      <!-- FINANCES. ⚠ `recap-finance` NAMES THE TILE FOR ITS TEST, and it earns the class: the
           training tile beside it uses the same `.recap-rows` / `.recap-row-key` idiom, so «the
           column that must add up» is not addressable without it – and part two #1's whole evidence
           is reading these figures off the screen and summing them. -->
      <Card class="recap-tile recap-finance" pad="12px 13px">
        <Eyebrow>Finances</Eyebrow>
        <!-- ⭐⭐⭐ ROUND 31 #2 – INCOME / FAMILY INCOME / SPENT, AND THE BALANCE UNDER THE HAIRLINE:
             the owner's own four lines, in his own order. His words are in the script block above and
             in tests/component/week-recap-kid-share.test.ts, because Cyrillic inside a <template> is
             forbidden (tests/template-copy-rules.test.ts).
             ⚠ ROUND 29 PART TWO #1 PUT FIVE ROWS HERE AND THAT WAS MORE THAN HE WANTED, NOT FEWER –
             her cut appeared as a row AND as the memo below, which is the duplication he named. Her
             cut is still NOT a row here and must not become one: the engine banks the family
             `prize − herShare`, so those cents never entered this column at all.
             ⚠ AND THESE THREE REALLY ADD UP TO THE BALANCE, on every week and every save – the
             property he has asked for three times. No arithmetic here: `financeRows` is a list. -->
        <div class="recap-rows">
          <div v-for="row in financeRows" :key="row.key" class="recap-row">
            <span class="recap-row-key">{{ row.key }}</span>
            <span class="recap-row-val num" :class="row.tone">{{ formatCentsSigned(row.cents) }}</span>
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
        <!-- HER CUT, UNDER THE BALANCE – AND SINCE ROUND 29 PART TWO #2 ONLY THE DESTINATION IS
             LEFT IN IT. The owner's words are in the script block above and in
             tests/component/week-recap-kid-share.test.ts, because Cyrillic inside a <template> is
             forbidden (tests/template-copy-rules.test.ts). This is the one thing the rows above
             cannot say, which is where the money went.
             ⚠ ROUND 30 #1 UNBOLDED IT AT HIS INSTRUCTION – see the stylesheet; the weight is the
             only thing about this line that moved. The foot survives on the legacy shape alone,
             untouched: he named the weight and the rows, not this sentence.
             ⚠⚠ ROUND 31 #2 – THE PRIZE RULE, AND ONLY IT, IN ONE LINE OR NONE. Round 30 #21 printed
             one line PER RULE and so wrote him a sponsor line every week; he asked for her share of
             the prize money and nothing else. The shape is `string | null` rather than a list, so a
             second line is not a policy here but an impossibility. ⚠ The blend fallback is gone with
             it: on a mixed legacy week that number is the one #21 measured as wrong, and a missing
             line is honest where a wrong percentage is not. See the script block for both. -->
        <p v-if="kidShareMemo || kidShareFoot" class="recap-memo" role="note">
          <span v-if="kidShareMemo" class="recap-memo-line">{{ kidShareMemo }}</span>
          <span v-if="kidShareFoot" class="recap-memo-foot">{{ kidShareFoot }}</span>
        </p>

        <!-- ⭐⭐ THE COACH'S CUT, ROUND 29 PART TWO #13 – his ask for it on the weekly screen, in
             its own memo under the balance. His words are in the script block above and in
             tests/component/round29p2-coach-cut-weekly.test.ts, because Cyrillic inside a <template>
             is forbidden, comments included (tests/template-copy-rules.test.ts – and it caught the
             first draft of this very block, exactly as it caught part-one #13's).
             ⚠ SEPARATE FROM HERS ON PURPOSE: it is present on a title week and absent on a week she
             was paid by a brand, so folding the two into one paragraph would make each appear on the
             other's weeks. ⚠ The percentage comes from `staffResultShareBps` through the ledger –
             see the script; no rate is typed in this template. -->
        <p v-if="coachCutMemo" class="recap-memo recap-memo-coach" role="note">
          <span class="recap-memo-line">{{ coachCutMemo }}</span>
        </p>

        <!-- ⭐⭐ ROUND 31 #2 – FAMILY INCOME MOVED UP INTO THE COLUMN, and this is where it used to
             be drawn. It was a note UNDER the balance because it was a SLICE of the Income row above
             it (the part that was not the family's half of a split cheque), and a term beside Income
             would have counted the family's own money twice. That is no longer true of it: `Income`
             is the tournament's own cheque now, so the family's other money is an ADDEND, and the
             owner asked for it as one. Keeping both would put the same cents on screen twice, which
             is the very defect this aside was written to avoid. The label did not change a
             character – see the script block. -->
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
   ⚠ THE VACATION FRAME PAYS THE MOST FOR THIS - a 2.50:1 picture in a 1.36:1 slot is a 45% crop -
   so it was checked, all five, at this exact ratio: every subject stays in frame and the five stay
   unmistakably different from each other (a fire pit and friends, hens by a village wall, a lake at
   sunset, the pool, the physio). Following the art instead, the way the Season feed does, is one
   line here and a 137px band at 375; it is in the report as the alternative if the owner wants the
   breadth back rather than one silhouette.

   ⚠ AND THAT CHECK WAS RUN ON THE WRONG AXIS (round-17 #26, 12.08). "Every subject stays in frame"
   was true of the SCENE and false of the GIRL: she is on the right of all six frames, at 66% to 79%
   of the width, and a 45% CENTRE crop cuts her out of every one of them. The owner had already ruled
   on exactly this on 30.07 and MoneyScreen's polaroid was measured and fixed then; this surface and
   the package picker draw the same six paintings and were missed. The crop is steered below, off
   `--crop-vacation-x`, so all three now read one number. The paragraph above is kept because its
   argument - one slot, one silhouette - is still the right call; only its verification was partial. */
/* ⭐ ROUND 36 REVIEW #16 – D's 286 IS A TOKEN NOW, BECAUSE TWO RULES READ IT. The cap below and the
   width of the square window past 768 are the SAME number by construction: a square photograph in a
   band is «as wide as the band is tall», so spelling 286 twice would be a pair one edit away from a
   rectangle. Nothing about the base rule moved – the value is D's own. */
.recap-card {
  --recap-art-h: 286px;
}

.recap-art {
  aspect-ratio: 390 / 286;
  max-height: var(--recap-art-h);
  border-radius: var(--radius-card);
  overflow: hidden;
}

/* ⚠⚠ ROUND 36 PHASE 2 – AND THE `max-height` ABOVE WAS TAKING THE WIDTH DOWN WITH IT. Measured on
   the shipped build, this box is 343x251 at 375 and then 390x286 at EVERY width above it: 520, 576,
   768, 900, 1280. The cap was written for exactly the case it broke - «capped at D's number so a
   tablet does not turn the story into a poster» - but a block with `aspect-ratio` and a violated
   `max-height` has its width transferred back down the ratio, so the picture stopped growing at
   390px while the paper note that RIDES it kept spanning the column. At 768 that is a 390px
   photograph under a 736px note, which is not a proportion anyone chose.
   ⭐ `width: 100%` is the author's own intent said in the axis that was missing: the column decides
   the width, `max-height` still decides the height, and the story is a 736x286 band instead of a
   poster - the shape that paragraph is describing.
   ⚠ IT IS INSIDE THE TABLET BLOCK AND THE 520/576 CASE IS DELIBERATELY LEFT ALONE. Phase 2's
   contract (docs/specs/responsive-2026-09.md) is that nothing below 768 may move, and those two
   widths are below it. The same collapse is there and is a phase-4 or an owner call, recorded in
   docs/rounds/round-36.md rather than quietly fixed on the way past. */
/* =================================================================================================
   ⭐⭐⭐ ROUND 36 REVIEW #16 – THE STORY BECOMES A BAND WITH A SQUARE PHOTOGRAPH AND A NOTE BESIDE IT
   =================================================================================================
   The owner, 04.09, and it is three moves in one sentence: «нижняя записка на скотче давай сделаем
   ее на 50-60% ширины, как на календаре примерно. Блок картинок предлагаю сделать более квадратным,
   справа темный фон, а вот эту верхнюю записку (на всю длину скрина) ставим тоже квадратиком
   неправильной формы как раз на это место справа пустое освободившееся.» (quoted here rather than
   in the template: `tests/template-copy-rules.test.ts` bans Cyrillic inside a `<template>`, strings
   AND comments, and welcomes it in a `<script>` or `<style>` one – «that is where the design record
   lives», in its own words).

     1. THE PICTURE BECOMES SQUARE and the rest of the band is dark ground – «более квадратным,
        справа темный фон». The BLOCK keeps phase 2's `width: 100%` and D's 286px height, so the
        card is not one pixel taller; what changed is that the photograph is now 286x286 at the left
        of it instead of a 736x286 letterbox.
     2. THE TOP NOTE MOVES INTO THE SPACE THAT FREES – «ставим квадратиком неправильной формы как
        раз на это место справа пустое освободившееся». Its paper is untouched: the tilt, the torn
        cut, the ruling, the margin rule and the doodle are `PaperNote`'s and none of them is
        touched here, which is «квадратиком неправильной формы» – the shape is the object's.
     3. THE TAPED NOTE AT THE FOOT NARROWS to the band he gave – see `.recap-goal` below.

   ⭐ IT IS A GRID AND NOT AN OVERLAY, and that is the whole reason the card does not move under it.
   Both items sit in ROW 1: the painting spans the row and the note takes the second column on top
   of it (`z-index: 1`, which the note already had for riding the picture). Everything else in the
   card keeps its own place in the flow with its own margins, and `row-gap: 0` is explicit so the
   rhythm below row 1 is byte for byte the block layout's.

   ⚠ THE FIRST COLUMN IS THE BAND'S HEIGHT, so the photograph is square at 768, at 900 and at 1280
   without a second number: `--recap-art-h` is D's 286 and both readers take it. The gap after it is
   dark ground the note is laid ON rather than aligned to.

   ⚠ AND THE NOTE STOPS RIDING THE PICTURE, which is the one declaration of its own it gives up:
   `margin: -34px -2px 0` lifted it 34px over the painting's bottom edge, and beside the painting
   that lift would hang it out of the top of the card. `align-self: center` puts it where the free
   space is instead. Below 768 not one of these rules exists and the note rides the picture exactly
   as it always has. */
@media (min-width: 768px) {
  .recap-card {
    display: grid;
    grid-template-columns: var(--recap-art-h) minmax(0, 1fr);
    column-gap: 16px;
    row-gap: 0;
    align-items: start;
  }

  /* ⚠⚠ AND THE TWO PLACED ITEMS ARE ADDRESSED AS CHILDREN, NOT BY CLASS ALONE – measured, not
     assumed. Vue's scoping makes `.recap-card > *` into `.recap-card[data-v] > *[data-v]`, which is
     (0,3,0), and a bare `.recap-note[data-v]` is (0,2,0): the span would have won and the note
     would have sat UNDER the picture at full width, which is the shipped layout wearing a grid.
     It was built that way first and the mounted arm read `1 / -1` back. */
  .recap-card > * {
    grid-column: 1 / -1;
  }

  .recap-card > .recap-art {
    grid-row: 1;
    width: 100%;
    background: var(--card-bottom);
  }

  /* `.week-art img`'s own `width: 100%` is what made this a letterbox; the height stays 100% of the
     band, so «as wide as it is tall» is one declaration and the picture is square by arithmetic.
     `object-fit: cover` crops sideways on a window that got narrower, which is the A2c/d ruling
     every other slot on this screen already obeys – and the vacation crop above still steers WHERE,
     so her face survives the narrower window for the same reason it survived the wider one. */
  .recap-card > .recap-art img {
    width: var(--recap-art-h);
  }

  .recap-card > .recap-note {
    grid-row: 1;
    grid-column: 2;
    align-self: center;
    margin: 0 12px 0 0;
  }
}

/* ⭐ ROUND-17 #26 – the vacation weeks, and only those. Scoped, so it beats the shared
   `.week-art img` rule in style.css without either of them having to know about the other. */
.recap-art-vacation img {
  object-position: var(--crop-vacation-x) 50%;
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
   tests/travel-home.test.ts and tests/radar-training.test.ts read this file for it. */
/* ⭐ ROUND-21 #2: the coach line is the same hand and the same paper, one step quieter and a little
   further down the scrap - it is a postscript to the week's story, not a second story. It only ever
   appears on a come-home week, where `--travel` is already on the note, so it inherits that rule's
   size and only needs the gap and the drop in weight. */
.recap-note-coach {
  margin-top: 6px;
  opacity: 0.78;
}

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

/* HER CUT, under the balance. It borrows `.recap-train-read`'s shape below rather than
   `.recap-row`'s deliberately: the training read is the other «short line of prose in a tile» on
   this card.
   ⚠ RE-AIMED BY ROUND 29 PART TWO #1, NOT REWRITTEN. This note used to end «a key/value row here
   would put a fourth figure in a column of three that already add up» – and that reasoning died with
   the netted column: her cut IS a row now, signed and inside the sum, and this prose is what is left
   over once the arithmetic moved upstairs, which is the destination. It still takes no
   `.positive`/`.negative`: the sentence is about where money went, not about this wallet's delta. */
.recap-memo {
  margin: 8px 0 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* ⭐⭐ ROUND 30 #1 – NOT BOLD, AT HIS INSTRUCTION: «ниже her cut без жирного шрифта». 700 -> 500,
   which is the weight `.recap-row-key` and `.recap-memo-foot` already use, so the memo now sits in
   the card's own prose voice instead of shouting one line louder than the Balance above it.
   ⚠ THE COACH'S MEMO MOVES WITH IT AND THAT IS DELIBERATE: it is the same class, the same idiom and
   the line he listed immediately after hers («ниже coach's cut если есть результат»). Two adjacent
   memos at two different weights would read as a defect. If he wants his coach line kept bold it is
   a modifier class and one line - flagged in docs/rounds/round-30.md rather than guessed at.
   ⚠ COLOUR IS UNTOUCHED (`--ink`): he asked about weight, and the memo still has to be readable
   against the tile - round 30 #3 is a whole item about a line that went too quiet to read. */
.recap-memo-line {
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1.25;
  color: var(--ink);
}

.recap-memo-foot {
  font-size: 11.5px;
  font-weight: 500;
  line-height: 1.25;
  color: var(--ink-2);
}

/* ⭐⭐ ROUND 31 #2 – `.recap-row-aside` WENT WITH THE ASIDE. It existed to give a `.recap-row` living
   OUTSIDE `.recap-rows` the gap the flex column would have given it, and Family income is inside
   that column now (it is an addend, not a slice), so it inherits the gap like every other row and
   the rule had nothing left to style. Nothing about the row's type changed - the key and the value
   always kept the column's own, which is why it lines up with Income and Spent without a rule. */

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

/* ⭐⭐ ROUND 36 REVIEW #16, THE THIRD MOVE – «нижняя записка на скотче давай сделаем ее на 50-60%
   ширины, как на календаре примерно». 55% is the middle of the band he gave, which puts the scrap
   at 405px of a 736px column and 522px of the desktop's 948 (measured) – wider than the calendar's own 280px
   fridge note in pixels, and the same THING as it in the only sense he can have meant: a piece of
   paper visibly narrower than the page it is laid on rather than another full-width card.
   ⚠ A SHARE AND NOT A `max-width` IN PIXELS, which is where this differs from `.cal-note`: a fixed
   280 would read as half a scrap at 768 and a quarter of one at 1280, and his instruction is a
   PROPORTION. The calendar's own note is the surface he compared it to, not the rule to copy.
   ⚠ FROM 768 UP. His sentence names no width and the round's contract is that nothing below 768
   moves without one – and here the phone is the case the number cannot survive: 55% of 343px is
   189px, and «Next goal» plus a goal at 21px inside it is four lines of scrap where there are two. */
@media (min-width: 768px) {
  .recap-goal {
    width: 55%;
  }
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

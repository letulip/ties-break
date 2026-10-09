<script setup lang="ts">
// Round-7 item 4 – the end-of-season summary popup. Auto-shown on Home when a fresh snapshot
// arrives whose stop reasons include 'season-end' (App.vue owns that trigger, the client-side
// dismiss, and the R11-1 rule that an injury on the same week gets its dialog first);
// reads the structured `lastSeasonSummary` the engine banked at wrap-up time.
//
// U2 – THE OWNER'S RULING (docs/specs/ui-inventory.md §2): tidy it "along the lines of the new
// Weekly Story – они тождественны примерно". They are: this is screen D at season scale. A week
// closes with a painting, four lime-headed cards and a handwritten scrap; a season closes with the
// same cards and the same scrap, because it is the same act – the game stopping to tell the parent
// what just happened before time moves on again.
//
// SO THE TABLE IS GONE, and that is the whole change. The figures were a `<table>` of nine
// label/value rows – "«Таблички» style", as the original note here called it, which was true of the
// app before the redesign and is not true of it now. They are the same nine figures, in the same
// order, grouped into the three things a parent actually asks at the end of a year: where did she
// finish, how did she play, what did it cost. Nothing was added, nothing was dropped, and every row
// that was conditional is still conditional.
//
// WHAT IT DELIBERATELY DOES NOT TAKE FROM D: the painting. A week has one and a season does not –
// there is no season art in the handoff's Assets table and inventing one here would be a redesign,
// not a tidy. The kicker also stays MUTED rather than becoming the lime eyebrow: `src/style.css`
// and `ui/Eyebrow.vue` both say `.season-summary-kicker` is the app's muted label, a different
// object, and recolouring it is the owner's call and he has not made it.
//
// ⭐⭐⭐ ROUND 31 #9 – AND SHE SAYS SOMETHING OF HER OWN, ONCE SHE IS PAST HER PEAK. The owner asked
// for exactly this surface: «Да и она сама в конце сезона … могла бы что-то тоже сказать на эту
// тему.» One sentence, drawn once per SEASON from the three he approved, and silent on every wrap of
// every career before her own decline starts – so the card the owner has seen fifteen times is
// byte-identical until the winter the engine says otherwise.
//
// ⚠ IT IS HERS AND THE SCRAP BELOW IT IS THE PARENT'S, which is why they are two separate objects on
// the card rather than two lines of one note. The closing scrap is the parent's own note about the
// year; this is the daughter answering the question the card is really about.
//
// ⚠ ONCE PER SEASON MEANS THE KEY IS THE SEASON, NOT THE WEEK – `seed:decline:<seasonYear>`, never
// MAIN. This card outlives the advance that follows it, so a week in the key would change her
// sentence under the parent while he was still reading it: round 31 #4's defect, on a smaller card.
// composables/declineVoice.ts carries the full argument and the three sentences.
import { computed, useTemplateRef } from 'vue'
import { useGameStore } from '../stores/game'
import { useDialogFocus } from '../composables/dialogFocus'
import { declineRef, herDeclineLine, seasonLastWinterLine, seasonLastWinterRef } from '../composables/declineVoice'
// ⭐ L3-6 (10.10): her line and the winter warning are drawn from their refs when the locale has them – the PICKS (which sentence, which count) are the composable's and did not move.
import { eventText } from '../i18n'
import { formatCentsCompact, formatCentsSignedCompact } from '../shared/money'
import { LADDER_LABEL } from '../shared/protocol'
import Card from './ui/Card.vue'
import Eyebrow from './ui/Eyebrow.vue'
import PaperNote from './ui/PaperNote.vue'
import PrimaryPill from './ui/PrimaryPill.vue'

const emit = defineEmits<{ continue: [] }>()

const game = useGameStore()
const summary = computed(() => game.snapshot?.lastSeasonSummary ?? null)

// D1 – IT IS A MODAL, AND NOW IT SAYS SO AND HOLDS THE KEYBOARD (see composables/dialogFocus.ts).
// Escape IS wired here, unlike the knock's: this card already closes on a click outside it, so the
// key is the keyboard's spelling of a gesture the mouse has always had, and refusing it would leave
// a trapped keyboard with no exit at all. Same emit, so there is one way out and not two.
const card = useTemplateRef<HTMLElement>('card')
useDialogFocus(card, () => emit('continue'))

/** W4-SCHOOL: the closing scrap, minus the thing she no longer has. It is the same sentence the
 *  engine writes into the feed on the same week (`world/milestones.ts`), read off the same fact -
 *  `schoolEndsWeek` - so the dialog and the ledger cannot disagree about whether she is at school. */
const closingScrap = computed(() => {
  const snap = game.snapshot
  const over = snap !== null && snap.week >= snap.schoolEndsWeek
  return over
    ? 'Off-season now: rest, family time, and the block where next year gets built.'
    : 'Off-season now: rest, school, family time.'
})


// R11-12a: the owner read the single net-delta line as the season's SPEND and compared it against
// the wallet's "This season" total, which is gross spend – two right numbers that look like one
// wrong one. Spend and income now have their own rows (the same financeWindow fold the Money screen
// reads, over the same window), and the net keeps the bottom line. `undefined` on a summary banked
// before R11-12a, in which case only the net row shows, exactly as before.
const spentCents = computed(() => summary.value?.spentCents)
const earnedCents = computed(() => summary.value?.earnedCents)

// ⭐⭐⭐ ROUND 46 #8 + #19 – AND «THE SAME FINANCEWINDOW FOLD» ABOVE IS NOW TRUE OF THE WINDOW ONLY, NOT OF THE
// FIGURES. The owner, 05.10: «в расходы явно что-то лишнее попадает, а в доходах общее состояние и прирост не
// учитываются» / «Потраченные суммы на итогах снова не соответствуют действительности». The card printed exactly
// what the engine banked, and the engine banked the wallet's GROSS fold – a house, a fund deposit and the cars'
// upkeep were «spent». The wrap-up now banks consumption and income apart from what moved to and from the shelf
// (`seasonMoneyOf`, engine/world/ledger.ts), and the holdings and their growth as `summary.wealth`.
// ⚠ NOTHING IS DERIVED HERE: every figure is a field the engine banked, and the only decision this file takes is
// «hide at zero» – the one the Academy row below already takes.
const shelfNetCents = computed(() => summary.value?.wealth?.shelfNetCents ?? 0)

// ⭐⭐⭐ ROUND 46, MORNING ITEM 4 (06.10) – THE REALISED LOSS, ON THE EXPENSE SIDE. The owner: «мне нужно видеть реальные расходы и доходы, мы это уже обсуждали.
// Инвестиция это не совсем расход, только если мы не в минусе зафиксировались». The engine banks the year's NET realised loss on asset sales (`realisedLossOf`,
// engine/world/ledger.ts) beside the shelf figure it is NAMED INSIDE OF, and leaves it absent when there is none – so a summary banked before this prints as it did.
// ⚠⚠ THE SHELF ROW MUST NOT COUNT IT A SECOND TIME. `shelfNetCents` is the whole `'shop'` net with the loss already in it, so the row prints the shelf WITHOUT it –
// `shelfNetCents + realisedLossCents` – and the card's rows still add up to its bottom line: earned - spent - loss + shelf row = funds. That one addition is the
// only arithmetic this file does; the mounted test sums what the card PRINTS (tests/component/round46-season-summary-money.test.ts).
const realisedLossCents = computed(() => summary.value?.wealth?.realisedLossCents ?? 0)
const shelfRowCents = computed(() => shelfNetCents.value + realisedLossCents.value)
/** The family's wealth, or null when it has none to speak of: nothing held and nothing through the shelf this
 *  season, which is every career until its first purchase – the card is then what it always was. */
const wealthRows = computed(() => {
  const w = summary.value?.wealth
  return w && (w.holdingsCents > 0 || w.shelfNetCents !== 0) ? w : null
})

// ⚠⚠ WHICH TABLE THIS SEASON WAS PLAYED ON (fix/wallet-and-wrapup, 05.08). The owner, at
// twenty-one, on the W tour: «итоговый рейтинг сломался... и на том же экране всегда показывается
// international, хотя мы уже давно там не играем. Это тоже надо как-то динамично делать в
// зависимости от текущего уровня турнира, ну или доминирующего в этом году.» This card printed
// "Final international rank – Unranked · She has not played a Junior Tour event yet" at a
// professional whose junior rank was #74 and whose world rank was #288.
//
// The engine decides, at the wrap, off the season's own per-track match record
// (`dominantTrackOfSeason`) – so the milestone line in the news and this card can never name two
// different tables for one season. Both fields are optional: a summary banked before this wave
// falls back to exactly what this file did before, the junior table read off the live snapshot.
const rankTrack = computed(() => summary.value?.rankTrack ?? 'itf')
const rankLabel = computed(() => LADDER_LABEL[rankTrack.value].toLowerCase())
const rankInTrack = computed(() => {
  const s = summary.value
  if (!s) return null
  // The legacy path, unchanged and still correct for the season it was written for: `endRank` is the
  // ITF number and the live snapshot says whether she holds an international point at all.
  if (s.rankTrack === undefined) return game.snapshot?.ladders.itf.rank !== null ? s.endRank : null
  return s.rankInTrack ?? null
})
const ranked = computed(() => rankInTrack.value !== null)

// Rank move over the season (rank improves when the number goes DOWN).
//
// ⚠ ITF ONLY, and it is the engine's limit rather than this card's taste: `startRank` is the v17
// capture of `world.kidRank`, i.e. the JUNIOR table, and it cannot be back-filled for any other one
// (see the note in engine/world/milestones.ts). Subtracting a junior start rank from a professional
// finish rank is the cross-currency subtraction `LadderView.prevRank` exists to forbid, so on any
// other track the card reports where she finished and shows no arrow.
const rankMove = computed<{ dir: 'up' | 'down' | 'flat'; by: number }>(() => {
  const s = summary.value
  const end = rankInTrack.value
  if (!s || rankTrack.value !== 'itf' || end === null) return { dir: 'flat', by: 0 }
  if (s.startRank === null || s.startRank === end) return { dir: 'flat', by: 0 }
  return s.startRank > end ? { dir: 'up', by: s.startRank - end } : { dir: 'down', by: end - s.startRank }
})
const showRankMove = computed(() => ranked.value && rankTrack.value === 'itf')

// ⚠ WHAT THE SEASON COULD NOT DO (feat/season-mirror, docs/specs/season-mirror-2026-08.md). The ladder
// floor made every rung beneath her enterable, which is the owner's ruling and is right - and a probe
// then measured a career that stops climbing while the matches, the win rate and the money all stay
// inside the human envelope, so the mistake was invisible from THIS VERY CARD. It is one number now.
//
// ⚠ THE ENGINE BANKED IT AT THE WRAP AND THIS FILE DOES NOT SECOND-GUESS IT. `entered` is what she
// entered and paid for; `couldNotMove` is how many of those could not have moved her on the table this
// same card names in its RANKING tile. The facts behind the second number were captured in the branch
// that committed each entry, which is the only week they are answerable at - so there is nothing here
// to re-derive and nothing that could disagree.
//
// ⚠ AND ABSENT IS ABSENT. The pair is missing on every summary banked before v45 and on the first wrap
// of a career migrated mid-season, because the counter cannot honestly speak for weeks it did not
// watch. No row, rather than a zero that would read as "none of them" - the `spentCents` precedent.
const entryMirror = computed(() => summary.value?.entryMirror)

// ⭐⭐ HER LINE, or null while she is still at her peak – see the note at the top of this file. The
// season this card is about names its own stream, so the sentence is fixed for that winter and the
// same on every machine.
const herLine = computed(() => {
  const snap = game.snapshot
  const year = summary.value?.seasonYear
  if (!snap || year === undefined) return null
  const line = herDeclineLine(snap.physicalShare, snap.seed, year)
  return line === null ? null : eventText({ text: line, c: declineRef(line) })
})

// ⭐⭐⭐ ROUND 40 #14b – HOW MANY WINTERS BEFORE THE LAST ONE, in the card's own reporting voice. The
// owner, 08.09: «Где-то тренер может подсветить, где-то она сама, где-то финальный экран сезона.»
//
// ⚠ THIS IS THE ONE SURFACE OF THE THREE THAT IS NEITHER OF THEM. Her line above is hers and the
// scrap below is the parent's; the wrap-up itself has been reporting the year in a flat voice since
// round 7, and a warning is a fact about the calendar. So it is a third object on the card, not a
// second clause of one of the two that were already here.
//
// ⚠ NOTHING IS DERIVED HERE. `Snapshot.lastWinterIn` is one engine number (`lastWinterIn`,
// engine/world/coachMarket.ts) read by the coach's card and by her own line on the winter card too –
// so no two of the three can ever be a winter apart. Null on every week outside the window, which is
// every wrap of every career until she is nearly done, and null on the last winter itself.
//
// ⚠ AND IT DRAWS NOTHING, unlike the line above it: the count is a projection over persisted state,
// so this card says the same thing every time it is opened.
const lastWinterNote = computed(() => {
  const winters = game.snapshot?.lastWinterIn
  const line = seasonLastWinterLine(winters)
  return line === null ? null : eventText({ text: line, c: seasonLastWinterRef(winters) ?? undefined })
})
</script>

<template>
  <div v-if="summary" class="dialog-overlay" @click.self="emit('continue')">
    <!-- role/aria-modal on the CARD and not on the scrim: the backdrop is not part of the dialog,
         it is what the dialog is over. Both lines are the name, in the order they are read - the
         year this card is about, then what the card is. -->
    <div
      ref="card"
      class="dialog-card season-summary"
      role="dialog"
      aria-modal="true"
      aria-labelledby="season-summary-kicker season-summary-title"
      tabindex="-1"
    >
      <p id="season-summary-kicker" class="season-summary-kicker">Season {{ summary.seasonYear }} · wrap-up</p>
      <h2 id="season-summary-title" class="season-summary-title">That's a season.</h2>

      <div class="season-grid">
        <!-- WHERE SHE FINISHED -->
        <Card class="season-tile" pad="12px 13px">
          <Eyebrow>Ranking</Eyebrow>
          <div class="season-rows">
            <div class="season-row">
              <span class="season-key">Final {{ rankLabel }} rank</span>
              <span class="season-val">
                <span class="rank-value">{{ ranked ? '#' + rankInTrack : 'Unranked' }}</span>
                <template v-if="showRankMove">
                  <span v-if="rankMove.dir === 'up'" class="rank-move up">&uarr;{{ rankMove.by }}</span>
                  <span v-else-if="rankMove.dir === 'down'" class="rank-move down">&darr;{{ rankMove.by }}</span>
                  <span v-else class="rank-move flat">–</span>
                </template>
              </span>
            </div>
            <p v-if="showRankMove && summary.startRank !== null" class="hint season-summary-from">from #{{ summary.startRank }}</p>
            <!-- The junior table keeps its own sentence: "not ranked yet" means something specific
                 and encouraging for a girl who has not left the country. Every other table gets the
                 plain statement, because "she has not played a Junior Tour event" is nonsense said
                 to a professional - which is exactly the bug this replaced. -->
            <p v-else-if="!ranked && rankTrack === 'itf'" class="hint season-summary-from">
              She has not played a Junior Tour event yet. Her national standing is on the Stats tab.
            </p>
            <p v-else-if="!ranked" class="hint season-summary-from">
              No result counted on that table this season. Her other standings are on the Stats tab.
            </p>
            <div class="season-row">
              <span class="season-key">Season points</span>
              <span class="season-val num">{{ summary.points }}</span>
            </div>
          </div>
        </Card>

        <!-- HOW SHE PLAYED -->
        <Card class="season-tile" pad="12px 13px">
          <Eyebrow>Matches</Eyebrow>
          <div class="season-rows">
            <div class="season-row">
              <span class="season-key">Record</span>
              <span class="season-val num">{{ summary.wins }}–{{ summary.losses }}</span>
            </div>
            <div class="season-row">
              <span class="season-key">Best result</span>
              <span class="season-val">{{ summary.bestResultText }}</span>
            </div>
            <div class="season-row">
              <span class="season-key">Lost to injury</span>
              <!-- weeksInjured is optional (pre-slice-C summaries never stored it): default 0 -->
              <span class="season-val num">{{ summary.weeksInjured ?? 0 }} wk</span>
            </div>
            <!-- The mirror sits in MATCHES rather than in RANKING on purpose: the number it corrects is
                 the record two rows above it. A season of 47 matches at 67% reads as a career that is
                 working, and it is the reading the probe found a parent cannot get past. -->
            <template v-if="entryMirror">
              <div class="season-row">
                <span class="season-key">Tournaments entered</span>
                <span class="season-val num">{{ entryMirror.entered }}</span>
              </div>
              <!-- ⚠ IT NAMES THE SAME TABLE THE ROW ABOVE NAMES, and that is not decoration. The
                   engine judged this count against `rankTrack` – the season's own table – so saying
                   which one makes the agreement visible instead of merely true. An earlier build
                   judged it against the LIVE table and printed "13 could not move her ranking" under
                   "Final national rank #3", about the very events that had made her third. -->
              <p class="hint season-mirror-note">
                {{ entryMirror.couldNotMove }} could not move her {{ rankLabel }} ranking
              </p>
            </template>
          </div>
        </Card>

        <!-- WHAT IT COST -->
        <Card class="season-tile season-tile-wide" pad="12px 13px">
          <Eyebrow>Money</Eyebrow>
          <!-- ⭐ ROUND 46 #19 – ONE TWO-COLUMN GRID FOR THE WHOLE TILE, rows and hairlines together. It was a
               column of wrapping flex rows with the bottom line set a point larger than the rest, which is how
               the figures came to dance: a long one dropped under its label, a short one sat beside it, and no
               two shared a right edge or a digit width. Every figure is now one right-aligned column of tabular
               numerals that cannot wrap, and a million or more is written in M (`formatCentsSignedCompact`) so
               even a rich family's column stays narrow. -->
          <div class="season-money">
            <div v-if="spentCents !== undefined" class="season-row">
              <span class="season-key">Spent this season</span>
              <span class="season-val num negative">{{ formatCentsSignedCompact(-spentCents) }}</span>
            </div>
            <!-- ⭐⭐⭐ ROUND 46, MORNING ITEM 4 – A SALE THAT FIXED A LOSS IS A REAL EXPENSE: its own row on the expense side, under «Spent», hidden at zero (a net realised
                 GAIN is not income and shows nowhere here). The loss is already inside the shelf figure below, which is why that row prints without it. DRAFT R46-S46
                 (docs/rounds/round-46.md). -->
            <div v-if="realisedLossCents > 0" class="season-row">
              <span class="season-key">Sold at a loss</span>
              <span class="season-val num negative">{{ formatCentsSignedCompact(-realisedLossCents) }}</span>
            </div>
            <div v-if="earnedCents !== undefined" class="season-row">
              <span class="season-key">Earned this season</span>
              <span class="season-val num positive">{{ formatCentsSignedCompact(earnedCents) }}</span>
            </div>
            <!-- v21: the scholarship never shows up in "Earned" – its travel half is a discount on
                 the travel line, not income – so this is the only place the year's help is a number.
                 Hidden at zero: a family nobody backed should not read a row of dashes. -->
            <div v-if="(summary.academyCoveredCents ?? 0) > 0" class="season-row">
              <span class="season-key">Academy covered</span>
              <span class="season-val num positive">{{ formatCentsSignedCompact(summary.academyCoveredCents ?? 0) }}</span>
            </div>
            <!-- ⭐⭐⭐ ROUND 46 #8 + #19 – WHAT MOVED TO AND FROM THE SHELF, between «Earned» and the bottom line
                 so the rows add up on the card: earned - spent - loss + this = funds (this row prints the shelf WITHOUT the realised loss, which has its own row above). It is where a house, a fund
                 deposit and the cars' upkeep went when they stopped being «spent». Hidden at zero. DRAFT
                 R46-S12 (docs/rounds/round-46.md). -->
            <div v-if="shelfRowCents !== 0" class="season-row">
              <span class="season-key">Holdings and upkeep</span>
              <span class="season-val num" :class="shelfRowCents < 0 ? 'negative' : 'positive'">{{ formatCentsSignedCompact(shelfRowCents) }}</span>
            </div>
            <span class="season-hairline"></span>
            <div class="season-row">
              <span class="season-key">Funds this season</span>
              <span
                class="season-net num"
                :class="{ negative: summary.fundsDeltaCents < 0, positive: summary.fundsDeltaCents >= 0 }"
              >{{ formatCentsSignedCompact(summary.fundsDeltaCents) }}</span>
            </div>
            <!-- ⭐⭐⭐ ROUND 46 #8 + #19 – THE FAMILY'S WEALTH AND ITS GROWTH, under its own hairline because they
                 are a standing fact and a year-on-year change, not part of the cash arithmetic above. «Family's
                 portfolio» is the epilogue's own label for the same figure (`careerMoney.portfolioCents`), not a
                 new line; the growth label is DRAFT R46-S13. Both absent for a family that holds nothing. -->
            <template v-if="wealthRows">
              <span class="season-hairline"></span>
              <div class="season-row">
                <span class="season-key">Family's portfolio</span>
                <span class="season-val num">{{ formatCentsCompact(wealthRows.portfolioCents) }}</span>
              </div>
              <div v-if="wealthRows.growthCents !== undefined" class="season-row">
                <span class="season-key">Portfolio growth</span>
                <span class="season-val num" :class="wealthRows.growthCents < 0 ? 'negative' : 'positive'">{{ formatCentsSignedCompact(wealthRows.growthCents) }}</span>
              </div>
            </template>
          </div>
        </Card>
      </div>

      <!-- ⭐⭐⭐ ROUND 31 #9 – HER OWN LINE, above the parent's scrap and in her own voice. Absent on
           every wrap before she is past her peak, so the card is unchanged for the whole first half
           of a career. See the note at the top of this file for the key it is drawn on. -->
      <p v-if="herLine" class="season-her-line">{{ herLine }}</p>

      <!-- ⭐⭐⭐ ROUND 40 #14b – THE WARNING, in the card's own reporting voice rather than hers or
           the parent's. Added under her line and above the scrap; neither of them moved a byte.
           Absent on every wrap before the engine's count is inside its window, so this card is
           unchanged for the whole of a career but its last two or three winters. -->
      <p v-if="lastWinterNote" class="season-last-winter">{{ lastWinterNote }}</p>

      <!-- D's closing scrap. It was already the most human line in this dialog and it was set as a
           grey hint; on paper it reads as what it is – the parent's own note about the year. -->
      <!-- W4-SCHOOL: past her last school year the list is one item shorter, and the engine's own
           off-season note (world/milestones.ts) says the same thing in the same week. -->
      <PaperNote class="season-note" :tilt="-0.5" ruled torn tape>
        {{ closingScrap }}
      </PaperNote>

      <div class="dialog-actions">
        <PrimaryPill @click="emit('continue')">Continue</PrimaryPill>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ⭐ ROUND 46, MORNING ITEM 4 (06.10) – the owner's two-columns ask (quoted verbatim in the script
   header above; this block stays Cyrillic-free because the round11 copy pin sweeps everything after
   the template tag, style included), AND THE THREE TILES ARE NOW ONE COLUMN. They were two short cards side by side with the money
   card under them. The half-width pair is gone for a reason that was measured, not guessed: the dialog is 360px at most, so a half tile holds 96px of content at 320
   and 132px at its widest, and a label|value grid needs the label's longest word («Tournaments», about 74px) AND the value's longest («Quarterfinalist», about 110px)
   side by side – 190px. Nothing narrower can put every value beside its label, so at half width some rows dropped under theirs and WHICH ones changed with the
   screen, which is the dance he saw. Full width, every row of all three tiles is the label on the left and the figure on the right. */
.season-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}

.season-tile {
  display: flex;
  flex-direction: column;
}

.season-tile-wide {
  grid-column: 1 / -1;
}

/* ⭐ ROUND 46 #19 + MORNING ITEM 4 – THE LAYOUT THAT DANCED (his word), ANSWERED IN THE GRID AND NOT BY NUDGING A MARGIN. Every tile's rows are one two-column grid: the
   row stops being a box of its own (`display: contents`), so every label sits in the left track and every figure in the right one, on one right edge, and the hairlines
   and the notes under a row span both. The figure track is `fit-content(60%)`: a figure is as wide as it is until it would take more than 60% of the tile, so a long
   value («No tournaments played») wraps inside its own column and can never squeeze a label to nothing. It replaced a column of wrapping flex rows, which is how a value
   came to sit beside its label on one row and under it on the next. */
.season-rows,
.season-money {
  display: grid;
  grid-template-columns: minmax(0, 1fr) fit-content(60%);
  align-items: baseline;
  gap: 8px 10px;
  margin-top: 11px;
}

.season-row {
  display: contents;
}

.season-key {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--ink-soft);
}

.season-val {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
}

.season-summary-from {
  grid-column: 1 / -1;
  margin: -4px 0 0;
  font-size: 12px;
}

/* Tucked under its own row, exactly as `.season-summary-from` sits under the rank, and spanning both columns of the tile's grid because it is a sentence and not a figure.
   It WRAPS: on a 320px phone it reads as two lines, which is the reason it is a sentence under the number rather than a value beside it. */
.season-mirror-note {
  grid-column: 1 / -1;
  margin: -4px 0 0;
  font-size: 12px;
}

.season-hairline {
  height: 1px;
  margin: 10px 0;
  background: var(--line);
}

.season-net {
  font-size: 16px;
  font-weight: 800;
}

/* The figures: right-aligned on one edge in every tile. In the Money tile they cannot wrap and are set in tabular numerals, so the digits of one row stand over the digits
   of the next; in the Ranking and Matches tiles a text value may wrap inside its column, still right-aligned. */
.season-rows .season-val {
  justify-self: end;
  text-align: right;
}

.season-money .season-val,
.season-money .season-net {
  justify-self: end;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.season-money .season-hairline {
  grid-column: 1 / -1;
  margin: 2px 0;
}

/* ROUND 31 #9 – her line. It sits between the tiles and the parent's scrap and is set apart from
   both: the tiles are figures and the scrap is paper, so hers is neither – a quiet centred sentence
   in the card's own ink. No margin games, so the scrap under it keeps the spacing it shipped with. */
.season-her-line {
  margin: 0 0 14px;
  font-size: 14px;
  line-height: 1.5;
  text-align: center;
  color: var(--ink-soft);
}

/* ROUND 40 #14b – the warning, set exactly as her line above it: same measure, same centring, same
   14px gap down to the scrap. It takes the card's full ink rather than `--ink-soft` because it is
   the only line here about something that has not happened yet, and that is the one distinction the
   card needs to make. No new colour and no rule of its own: a warning that shouted would be the
   game grading a career, which §6 of the contract forbids. */
.season-last-winter {
  margin: 0 0 14px;
  font-size: 14px;
  line-height: 1.5;
  text-align: center;
  color: var(--ink);
}

/* ⚠ THE TYPE IS SET ON THE SHEET, NOT ON THE COMPONENT, since PaperNote's root became a wrapper so
   its tape could survive `torn`'s clip-path. `.tb-paper` declares its own `font-size` (17px), which
   beats a larger one inherited from an ancestor - so this closing line would have quietly dropped
   two points had it stayed where it was. Everything that positions the scrap on the page is still
   the wrapper's. This note is `torn tape` and was the second victim of the same bug. */
.season-note {
  display: block;
  margin: 0 0 16px;
}

.season-note :deep(.tb-paper) {
  font-size: 19px;
  text-align: center;
}
</style>

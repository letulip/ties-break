<script setup lang="ts">
// Round-6 – Stats tab. Standings content extracted from SeasonScreen.vue's old
// Calendar/Standings segmented control (now removed there – Season is calendar-only).
// A small header row (rank, season points) sits above the same standings table that used
// to live behind the "Standings" sub-tab; content and behavior are otherwise unchanged
// (competition ranks, gap-ellipsis rows, kid highlight, "Your rank: #N").
//
// W-L this season (round-8, the R6 debt): the engine has tracked world.seasonWins/seasonLosses
// since the season wrap-up work (v10, counted as matches resolve so pruning can't lose them);
// the Snapshot now simply surfaces both, so the header reads them directly – no event scanning.
//
// ⚠ TWO TABLES, AND THIS SCREEN NOW SAYS WHICH ONE IT IS SHOWING (30.07, fix/ranking-truth).
//
// docs/specs/two-ladders.md designed the national table and the ITF table as two currencies with no
// exchange rate between them, and then this screen kept showing ONE table, unlabelled, called
// "Standings" – the ITF one. So a girl with 604 national points and 4 international ones read a
// header saying 4 and a table she did not recognise: the owner's «Tournaments don't give points at
// all: zero in stats. Wins count alright», and the heart of «No points visualisation for
// local-regional-national is super-strange».
//
// It opens on `snapshot.activeLadder` – the ENGINE's answer to which table she is competing in
// (international once she holds a counting result there, national before that), so this screen and
// the Home card cannot disagree – and the other table stays one tap away, because "how far off the
// world am I?" is a real question even before her first international point.
//
// The switch never says "track", "domestic" or "ITF": the words are National and International,
// defined once in `LADDER_LABEL`.
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useGameStore } from '../../stores/game'
import { prefersReducedMotion } from '../../composables/reducedMotion'
import { formatShortName, rankLabel } from '../../shared/format'
import { LADDER_LABEL } from '../../shared/protocol'
import { TIERS, TIER_SHORT, WEEKS_PER_YEAR } from '../../engine/season/calendar'
import { BEST_N_BY_TRACK, RANKABLE_MIN, WINDOW_BY_TRACK } from '../../engine/season/ranking'
import { finishPhrase } from '../../composables/tierState'
import type { LadderTrack } from '../../engine/season/types'
import SegmentedRow from '../ui/SegmentedRow.vue'
// R10-9: the season-by-season history sits right under the header tiles – it is the same three
// figures (rank / points / W-L) for every season she has finished. See SeasonHistoryTable.vue.
import SeasonHistoryTable from '../SeasonHistoryTable.vue'
import CountingResultsTable from '../CountingResultsTable.vue'

const game = useGameStore()

// Which table the player is LOOKING at. Seeded from the engine's `activeLadder`, and re-seeded if
// that changes under her: the week her first international point lands, the screen should follow her
// onto the new ladder rather than leave her on the old one. Her own tap wins from then on.
const shown = ref<LadderTrack>(game.snapshot?.activeLadder ?? 'domestic')
const touched = ref(false)
watch(
  () => game.snapshot?.activeLadder,
  (next) => {
    if (next && !touched.value) shown.value = next
  },
)
const shownModel = computed<string>({
  get: () => shown.value,
  set: (v) => {
    touched.value = true
    shown.value = v as LadderTrack
  },
})

// ⚠ ALL THREE TABLES (01.08, round 15). The switch was hardcoded ['domestic', 'itf'], so her whole
// professional season - seasonRecord.wta and ladders.wta have both been on the snapshot since
// v30/v33 - was invisible on the one screen whose job is tables. A 26-1 W15 record existed nowhere
// in the UI. The tooltip map below is a TOTAL Record on purpose: a fourth LadderTrack member fails
// to compile here until somebody writes its tooltip, and the options list is derived from the map,
// so the switch can never silently trail the type again (the unit guard pins the derivation).
const LADDER_TIP: Record<LadderTrack, string> = {
  domestic: 'Local, Regional and National results. These are the points that open her next tier.',
  itf: 'Junior Tour results only. A national title is worth nothing here – the two tables never meet.',
  wta: 'W15 and up – the paid tour. Junior points never cross over.',
}
const options = computed(() =>
  (Object.keys(LADDER_TIP) as LadderTrack[]).map((t) => ({
    value: t,
    label: LADDER_LABEL[t],
    title: LADDER_TIP[t],
  })),
)

const ladder = computed(() => game.snapshot?.ladders[shown.value])
const standings = computed(() => ladder.value?.standings ?? [])

// --- THE ARCHIVE (W2-LADDER §4: «закрепить, не мозолить») ----------------------------------------
// Once she has aged out of the junior tour (the J rungs are U18 - TIERS.j30.maxAgeYears, the
// engine's own rule, not a screen's guess), the International tab stops being a live table she can
// no longer move and FREEZES to her final standing: the career is pinned, not erased. The peak is
// the best YEAR-END rank in `seasonHistory` (endRank has always been the ITF fold - world.ts's
// wrap-up writes `world.kidRank`), which is the honest number a closed career keeps; the live
// window under it is still emptying week by week, and watching it drain is exactly the «мозолить»
// the owner asked to stop. Domestic never archives (she keeps that ladder for life, ruling 2) and
// the professional tab is where her live career now is.
const J_MAX_AGE = TIERS.j30.maxAgeYears!
const itfClosed = computed(() => (game.snapshot?.ageYears ?? 0) > J_MAX_AGE)
const archiveShown = computed(() => shown.value === 'itf' && itfClosed.value)
const jPeak = computed<number | null>(() => {
  const ranks = (game.snapshot?.seasonHistory ?? []).map((h) => h.endRank).filter((r) => r > 0)
  return ranks.length ? Math.min(...ranks) : null
})
// `rank: null` IS the answer "not ranked in this table at all" – the engine decides it, so this
// screen no longer counts results to work it out for itself.
const ranked = computed(() => ladder.value?.rank !== null && ladder.value?.rank !== undefined)
const rankText = computed(() => rankLabel(ladder.value?.rank ?? 0, ranked.value))
// ⚠⚠ AND THE TABLE ITSELF CAN BE UNRANKED – round 24 #4, and this column is where the owner read it.
// `LadderView.rank` has been nullable since the two-ladders wave so HER line says "Unranked"
// honestly, but the standings beside it print `r.rank` for every row, and on a table where nobody
// has scored that printed a place for all two hundred of them. The engine no longer says #1 there
// (`assignCompetitionRanks` sends an all-zero table to the bottom of itself), but a number is still
// the wrong WORD for it: the tile above says Unranked and the table under it must not disagree.
//
// ⚠ IT IS NOT A SECOND COPY OF THE ENGINE'S RULE, it is a read of what the engine sent. `standings`
// is `computeStandings`' window – top 10 plus a window around her – so index 0 of the whole table is
// always in it, and the table is sorted points-descending; "no row here has scored" is therefore
// "no row in the table has scored" and not an approximation of it.
// `tests/component/round24-unranked-table.test.ts` pins that dependency against a real world, because
// it is a fact about `computeStandings` rather than about this file.
const tableRanked = computed(() => standings.value.some((r) => r.points > 0))
const points = computed(() => ladder.value?.points ?? 0)
const countingResults = computed(() => ladder.value?.countingResults ?? [])

// ⚠ WHY THE TABLE SAYS 0 WHILE THE RESULTS UNDER IT SAY 6 (round-16 #3, and the owner filed it as a
// cache refreshing one event late). It is the WTA's own eligibility minimum, and the engine has been
// applying it correctly since points-by-the-book: a professional appears on the rankings only once
// she has scored in three tournaments or banked ten points. Until then her total reads zero - beside
// a counting-results list showing every row she has won, which is what makes it read as a bug.
//
// `LadderView.banked` is the engine's own number for what is being withheld (absent unless it IS
// being withheld, on any table); the thresholds are read from `RANKABLE_MIN` so this screen and the
// tournament summary's own sentence (`rankingDeltaSuffix`) quote one rule. Nothing is re-derived
// here: if the engine ever stops withholding, the field goes and the line goes with it.
const banked = computed(() => ladder.value?.banked ?? null)
const bankedNote = computed(() =>
  banked.value === null
    ? null
    : `${banked.value} pts banked. A ${LADDER_LABEL[shown.value].toLowerCase()} ranking needs ` +
      `${RANKABLE_MIN.tournaments} events with points, or ${RANKABLE_MIN.points} points – ` +
      `until then the table shows nothing, and every result below still counts towards it.`,
)

// --- THE WINDOW BLOCK (W2-LADDER §3: the owner's «очковое окно возможностей», made visible) ------
// Three facts the rolling window has always had and never said: how full it is against the shown
// table's own width (six, or eighteen on the professional table), the weakest counted value (the
// bar a new result must clear once the window is full), and the NEXT DROP - the oldest counted
// result, what it was, and the week the 52-week window lets it go. All derived from the counting
// list the table below already shows, so the block and the table cannot disagree.
const windowInfo = computed(() => {
  const list = countingResults.value
  const snap = game.snapshot
  if (!list.length || !snap) return null
  const cap = BEST_N_BY_TRACK[shown.value]
  const weakest = Math.min(...list.map((r) => r.points))
  const oldest = list.reduce((a, b) => (b.week < a.week ? b : a))
  // ⚠ WHEN A RESULT DROPS DEPENDS ON THE TABLE NOW (round 23 #12/#13). The domestic table became
  // SEASON-TO-DATE, so on that tab nothing ages out mid-season at all – EVERY row leaves together at
  // the wrap, and the rolling arithmetic below would have promised the player a date that never
  // comes. Read off `WINDOW_BY_TRACK` rather than re-deciding it here: the screen and the fold have
  // to agree about which table she is looking at, and that is precisely the disagreement this whole
  // round kept finding.
  const dropInWeeks =
    WINDOW_BY_TRACK[shown.value] === 'seasonToDate'
      ? WEEKS_PER_YEAR - (snap.week % WEEKS_PER_YEAR)
      : // rolling: windowedBestSum keeps a result while `week - r.week <= 52`, so it drops AT r.week + 53.
        oldest.week + 53 - snap.week
  const finish = oldest.tier ? TIERS[oldest.tier].points.indexOf(oldest.points) : -1
  const what =
    oldest.tier && finish >= 0
      ? `${TIER_SHORT[oldest.tier]} ${finishPhrase(finish, TIERS[oldest.tier].drawSize)}`
      : 'Oldest result'
  return { cap, counted: list.length, full: list.length >= cap, weakest, what, dropPts: oldest.points, dropInWeeks }
})
// This season's W-L, straight off the Snapshot (accumulated at finalizeTournament, reset each
// season wrap-up).
//
// ⚠ IT FOLLOWS THE SWITCH NOW (31.07, the owner: «national/international разделить победы и
// поражения, мне кажется они не должны быть общими»). It used to be the TOTAL, with a comment
// arguing "one figure for both ladders – a win is a win" – and the argument is true about a win and
// false about this screen. Every other figure here changes when the picker at the top does: the
// rank, the points, the standings table, the counting results. One tile that did not move read as a
// claim that those 24 wins were earned in the table currently on screen, which for a domestic career
// is false about all of them.
//
// Every match behind the number is a tournament match, so the split needs no new fact and no guess:
// see `Snapshot.seasonRecord`. Practice friendlies and walkovers are not in either bucket because
// they were never counted at all.
// AGE_COLUMN – the owner, item 12 of 06.08 and again 09.08: «я просил возраста девочек добавить в
// stats доп колонкой и в турнирах перед матчем тоже можно показывать».
//
// The column is in the standings table below, and the pre-match half is in TournamentFlow.vue. There
// is nothing to compute here: `StandingRow.ageYears` arrives on the snapshot already resolved, which
// is deliberate – it is HER OWN age on both sides of the row (`kidAgeAt` for the kid, the rival's own
// `ageYears` for everybody else) and neither is a band. A screen deriving an age from a week and a
// birth month would be a second clock, which is the thing the 09.08 ruling exists to prevent.
const seasonRecord = computed(() => game.snapshot?.seasonRecord[shown.value] ?? { wins: 0, losses: 0 })
const seasonWins = computed(() => seasonRecord.value.wins)
const seasonLosses = computed(() => seasonRecord.value.losses)

// The one sentence no arithmetic on this screen can imply, so it has to be said. Total maps, like
// LADDER_TIP above and for the same reason: a fourth table cannot ship without its sentences.
const NO_EXCHANGE: Record<LadderTrack, string> = {
  domestic: 'National points open her next tier. They do not count towards her international ranking.',
  itf: 'Junior Tour points only. National results do not count here.',
  wta: 'Professional points only. Junior and national results do not count here.',
}
const EMPTY_NOTE: Record<LadderTrack, string> = {
  domestic: 'No national results yet – her first Local Open will put her on this table.',
  itf: 'She has not played a Junior Tour event yet, so she has no international ranking. Her national standing is on the other tab.',
  wta: 'She has not played a professional event yet. The paid tour starts at the World Tour 15, from age 16.',
}
const noExchange = computed(() => NO_EXCHANGE[shown.value])
const emptyNote = computed(() => EMPTY_NOTE[shown.value])

// --- THE SECTION STRIP (round 37 #4) -------------------------------------------------------------
// The owner, 05.09.2026: «На экране stats для всех интерфейсов добавить под первой плашкой STATS
// полосу с переключателем по разделам seasons/ranking/results для каждой категории турниров для
// удобной навигации на странице».
//
// ⚠ IT IS NAVIGATION AND NOT A FOURTH PICKER, in his own words: «для удобной навигации на странице».
// Every section it lists is already drawn, already below the fold and already answering to the
// ladder row above. The strip selects nothing, filters nothing and hides nothing - it takes the
// reader to a heading. That is also why the entries are not a `SegmentedRow`: that component is a
// value switcher (`v-model` + `aria-pressed`), and pressing one of these changes no value.
//
// ⚠⚠ AND EVERY WORD ON IT IS A HEADING THAT IS ALREADY ON THIS SCREEN. His three words - seasons /
// ranking / results - NAME the three sections; the strings below are those sections' own `<h2>`s,
// character for character: `Season by season` is SeasonHistoryTable.vue's heading, `<track> ranking`
// and `Counting results` are the two in the template under this block. So the screen gains a control
// without gaining a second spelling of anything (CLAUDE.md invariant 4 - the copy is his). The
// mounted test asserts each entry equals the `<h2>` of the section it reaches, so the label and the
// heading cannot drift apart later.
//
// ⚠ «ДЛЯ КАЖДОЙ КАТЕГОРИИ ТУРНИРОВ» IS THE ROW ABOVE THIS ONE - the ladder picker, which is what he
// himself called «переключатель уровня турниров в stats» on 02.08. Every figure, table and list on
// this screen already follows it, so the strip is per-category BY CONSTRUCTION rather than by a
// second copy of the taxonomy: it is derived from the sections that render for the track on screen,
// which is why the ranking entry is renamed by the picker and why an entry leaves with its section.
//
// ⚠⚠ A CONTROL THAT SCROLLS TO AN ELEMENT MAY NEVER OFFER ONE THAT IS NOT THERE. Two of the three
// sections are conditional and both conditions are real careers: a closed junior archive draws
// NEITHER the ranking nor the counting list (`archiveShown`), and a table she has not scored in
// draws no counting list (`countingResults.length`). The list below is built out of those same two
// conditions rather than beside them, so a dead entry is not something that has to be remembered.

/** The sections a reader can be taken to, in the order the page draws them. Each `id` is on the
 *  element that owns that section's heading - the two `<section>`s below, and SeasonHistoryTable's
 *  own root for the first. */
const sections = computed(() => {
  const list: { id: string; label: string }[] = [{ id: 'stats-seasons', label: 'Season by season' }]
  if (!archiveShown.value) {
    list.push({ id: 'stats-ranking', label: `${LADDER_LABEL[shown.value]} ranking` })
    if (countingResults.value.length) list.push({ id: 'stats-results', label: 'Counting results' })
  }
  return list
})

// WHICH SECTION THE READER IS IN, ANNOUNCED. `aria-current` and not `role="tab"` - App.vue's own
// choice for the tab bar, and its comment's reason holds here twice over: there is no `tabpanel`
// behind these either, so a tablist would be a costume.
//
// ⚠ THE VALUE IS `location`, WHICH IS THE SAME CHOICE THE BAR MADE, NOT A DIFFERENT ONE. The app
// already picks the token that fits what the control does - the bar swaps pages and says `page`,
// OnboardingWizard's dots walk steps and say `step` - and these entries move the reader WITHIN one
// page. Saying `page` here would also put two "current page" marks in one document, one of them on
// the Stats tab that got us here.
const reached = ref<string | null>(null)
const currentSection = computed(() => {
  const list = sections.value
  const hit = list.find((s) => s.id === reached.value)
  // Nothing pressed and nothing scrolled past yet. A screen always opens at its top
  // (composables/scrollReset.ts), so the first section is where the reader actually is.
  return hit?.id ?? list[0]?.id ?? null
})

/** The line a section's top must rise past before it is the one being read. A FRACTION of the
 *  viewport rather than a constant, because the same 150px is a third of a phone and a seventh of a
 *  desktop. */
const CURRENT_LINE = 0.4

/** Where the reader has got to, off the real geometry: the LAST section whose top has crossed the
 *  line, or null while none has (the top of the page, where the fallback above answers). */
function syncReached(): void {
  if (typeof window === 'undefined') return
  const line = window.innerHeight * CURRENT_LINE
  let at: string | null = null
  for (const s of sections.value) {
    const top = document.getElementById(s.id)?.getBoundingClientRect().top
    if (top !== undefined && top <= line) at = s.id
  }
  reached.value = at
}

// THE DOCUMENT IS THE SCROLLER for every tabbed screen, and this is one - composables/scrollReset.ts
// names the app's only two scrollers and why. Passive, because this listener reads and never blocks.
onMounted(() => window.addEventListener('scroll', syncReached, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', syncReached))

function goToSection(id: string): void {
  // Marked before the glide rather than after it: the press is the answer to "where am I now", and
  // the spy above refines it as the page moves.
  reached.value = id
  const el = document.getElementById(id)
  if (!el || typeof el.scrollIntoView !== 'function') return
  // The house's own shape for a scroll the player ASKED for (MoneyScreen's ledger CTA, the coach
  // market's tier chips): smooth, unless the system has been asked for less motion - U-05's one
  // predicate, because a browser that does not animate `smooth` leaves the press doing nothing.
  el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
}
</script>

<template>
  <template v-if="game.snapshot">
    <section>
      <h2>Stats</h2>
      <!-- WHICH TABLE. Above the tiles, because it governs every figure under it. Carries this
           screen's own class because the shared plate comes off here - see .stats-ladder-row. -->
      <SegmentedRow
        v-model="shownModel"
        appearance="bare"
        class="stats-ladder-row"
        :options="options"
        group-label="Which ranking table"
      />
      <!-- THE ARCHIVE PLATE (W2-LADDER): a closed junior career is a fact to keep, not a table to
           watch drain. It replaces the live tiles on this tab only - the rule and the peak, and
           nothing that still moves. -->
      <div v-if="archiveShown" class="stats-archive">
        <p class="stats-archive-title">Junior career – closed at {{ J_MAX_AGE + 1 }}</p>
        <p v-if="jPeak !== null" class="stats-archive-peak">Peaked #{{ jPeak }} at year-end</p>
        <p class="hint stats-archive-note">
          The Junior Tour is under-{{ J_MAX_AGE + 1 }}, so this table is hers for good – it cannot
          move again. Her live career is on the Pro tab.
        </p>
      </div>
      <!-- R10-2: the three tiles are captions, not body copy – each label stays on ONE line
           (.stats-tile-label nowraps; the tile padding/gap were trimmed to pay for it) and
           "Season points" is now "Season pts", which is what actually fits at 375px. -->
      <div v-if="!archiveShown" class="stats-header-row">
        <div class="stats-tile">
          <span class="stats-tile-label">{{ LADDER_LABEL[shown] }} rank</span>
          <span class="stats-tile-value">{{ rankText }}</span>
        </div>
        <div class="stats-tile">
          <span class="stats-tile-label">Points</span>
          <span class="stats-tile-value num">{{ points }}</span>
        </div>
        <!-- The label carries the ladder for the same reason the rank tile's does: three tiles that
             all change together must all say what they changed to. "W-L" alone, in a row where the
             two figures beside it are named, reads as the one figure that is about everything. -->
        <div class="stats-tile">
          <span class="stats-tile-label">{{ LADDER_LABEL[shown] }} W–L</span>
          <span class="stats-tile-value num">{{ seasonWins }}–{{ seasonLosses }}</span>
        </div>
      </div>
      <!-- ⚠ THE ZERO THAT IS NOT A BUG (round-16 #3). Drawn only while the engine is actually
           withholding her total - `LadderView.banked` is absent otherwise - and placed directly
           under the tiles, because the tile it explains is the one reading 0. -->
      <p v-if="!archiveShown && bankedNote" class="hint stats-banked">{{ bankedNote }}</p>
      <p v-if="!archiveShown" class="hint stats-no-exchange">{{ noExchange }}</p>
    </section>

    <!-- ⭐ ROUND 37 #4 – THE SECTION STRIP, UNDER THE FIRST PLATE AND ABOVE WHAT IT POINTS AT. His
         ask, the argument and the reason each label is a heading rather than a new word are all in
         the script block beside `sections`, where the house convention allows his own words. Three
         things it is not: it is not a picker (nothing is selected), it is not a `<nav>` (a second
         navigation landmark makes `getByRole('navigation')` ambiguous on this screen and reddens the
         suite's tab walk), and it never lists a section this category does not draw. -->
    <div v-if="sections.length > 1" class="controls stats-jump" role="group" aria-label="Stats">
      <button
        v-for="s in sections"
        :key="s.id"
        class="stats-jump-link"
        :aria-current="s.id === currentSection ? 'location' : undefined"
        @click="goToSection(s.id)"
      >
        {{ s.label }}
      </button>
    </div>

    <!-- ⚠ IT TAKES THE TRACK NOW (v46). The owner reported twice that this table showed the same
         thing under every tab, and it did, because a `SeasonHistoryEntry` held one rank and three
         folds - see SeasonHistoryTable.vue and the v45 -> v46 migration for what an old row may say.
         The `id` is the strip's landing point and falls through to this component's own `<section>`,
         so the heading and the anchor are the same element. -->
    <SeasonHistoryTable id="stats-seasons" :track="shown" />

    <section v-if="!archiveShown" id="stats-ranking">
      <h2>{{ LADDER_LABEL[shown] }} ranking</h2>
      <!-- D8: the table answers to a name (docs/specs/e2e-coverage.md §12). It says WHICH table,
           because all three render through this one element and a reader arriving by role has no
           other way to tell which one she landed in. -->
      <table v-if="standings.length" :aria-label="`${LADDER_LABEL[shown]} ranking`">
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <!-- THE AGE COLUMN - the owner's own ask, twice; his words are quoted at AGE_COLUMN in
                 the script block, where the house convention allows the original. -->
            <th>Age</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="r in standings" :key="r.playerId">
            <tr v-if="r.gapBefore" class="standings-gap">
              <td colspan="4">…</td>
            </tr>
            <tr :class="{ 'kid-row': r.isKid }">
              <!-- A dash when NOBODY in this table has scored – see `tableRanked`. The same choice the
                   age column makes one row down, for the same reason: an absent fact is not a value. -->
              <td class="num">{{ tableRanked ? r.rank : '–' }}</td>
              <td>{{ formatShortName(r.name) }}</td>
              <!-- Her OWN age, whole years - never the band; see StandingRow.ageYears. A dash rather
                   than a zero for a row with nobody behind it: a missing age is not an age of none. -->
              <td class="num">{{ r.ageYears === undefined ? '–' : r.ageYears }}</td>
              <td class="num">{{ r.points }}</td>
            </tr>
          </template>
        </tbody>
      </table>
      <p class="hint">Her rank: {{ rankText }}</p>
      <p v-if="!ranked" class="hint">{{ emptyNote }}</p>
    </section>

    <!-- WHERE THE POINTS CAME FROM. The best-N that add up to the total above, from the SAME table:
         a rank and the results that earned it have to come from one ladder or the explanation
         contradicts the number. This is the "points visualisation" the domestic rungs never had. -->
    <section v-if="!archiveShown && countingResults.length" id="stats-results">
      <h2>Counting results</h2>
      <!-- THE WINDOW, said out loud (W2-LADDER §3). One line for where the window stands, one for
           what it is about to let go - the points window of opportunity the owner asked to see
           (his phrase is quoted at `windowInfo` in the script, where the house convention allows
           the original). -->
      <template v-if="windowInfo">
        <p class="hint stats-window-line">
          Counting {{ windowInfo.counted }} of a best-{{ windowInfo.cap }} window.
          <template v-if="windowInfo.full">
            Weakest counted: {{ windowInfo.weakest }} pts – a new result must beat it to raise the total.
          </template>
          <template v-else>The window has room – any scoring result counts in full.</template>
        </p>
        <p class="hint stats-window-drop">
          Next drop: {{ windowInfo.what }}, {{ windowInfo.dropPts }} pts – leaves the window in
          {{ windowInfo.dropInWeeks }} {{ windowInfo.dropInWeeks === 1 ? 'week' : 'weeks' }}.
        </p>
      </template>
      <!-- D8 again: it says WHICH table's results, because the list changes with the picker above and
           a reader arriving by role has no other way to tell which one she is in. -->
      <CountingResultsTable :results="countingResults" :label="`${LADDER_LABEL[shown]} counting results`" />
    </section>
  </template>
</template>

<style scoped>
/* The no-exchange-rate line sits tight under the tiles it qualifies. Local to this screen: the
   shared `.hint` spacing is tuned for standalone paragraphs, and src/style.css is off limits. */
.stats-no-exchange {
  margin-top: 8px;
}

/* The banked line sits between the tiles and the no-exchange note, so the 8px above belongs to
   whichever of the two is first on screen. It is the same quiet `.hint` register: it explains a
   figure, it is not a second figure. */
.stats-banked {
  margin-top: 8px;
}

.stats-banked + .stats-no-exchange {
  margin-top: 4px;
}

/* THE ARCHIVE PLATE (W2-LADDER §4): quiet, final, one card - the visual register of a record
   rather than a readout. Local to this screen; no new design language.
   ⚠ ITS `margin-top: 10px` MOVED TO `.stats-ladder-row` (04.08) - it is not gone, it is now owned by
   the switcher so all three tracks get it. See the note down there for the bug it was causing. */
.stats-archive {
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--panel);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stats-archive-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.stats-archive-peak {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.stats-archive-note {
  margin: 2px 0 0;
}

/* ⚠ THE PLATE RULING MOVED TO THE CONTROL (DRY-8, 19.08). The owner's 02.08 «Давай просто кнопки
   оставим и всё» is now `SegmentedRow`'s `appearance="bare"` and lives once in `src/style.css` -
   this screen, Money and More had each copied the same four declarations with the same specificity
   note. What stays here is the ONLY thing that is this page's: the gap under the switcher.

   ⚠ AND THE GAP UNDER IT IS THIS RULE'S JOB (owner, 04.08: «На вкладке stats при переключении
   international имеет небольшой отступ снизу, а national и professional нет – надо тоже добавить»).

   WHAT HE WAS SEEING, and it is a real inconsistency rather than a preference. Only ONE arm of this
   screen carried any separation from the pills, and it carried it privately: the ITF archive plate
   declared `margin-top: 10px` on itself, and the archive only ever renders on the International tab
   (`archiveShown` = itf AND aged out of the junior tour). `.stats-header-row` - the three tiles that
   stand in its place on National and Professional - declares no top margin at all, so on those two
   tabs the tiles butt straight against the buttons. Switching tracks therefore MOVED the content by
   10px, which is exactly the kind of jump the plate ruling above was meant to stop.

   THE FIX IS TO MOVE THE DECLARATION, NOT TO COPY IT. `margin-bottom` on the switcher spaces it from
   WHATEVER follows - the tiles, the archive, or whatever a fourth arm one day puts there - so the
   three tabs cannot drift apart again by somebody adding a block and forgetting the number. Copying
   `margin-top: 10px` onto `.stats-header-row` would have fixed today's three arms and left the trap
   armed for the fourth. The archive's own copy is deleted at `.stats-archive` above, with a pointer
   here, so the 10px is stated exactly once. */
.stats-ladder-row {
  margin-bottom: 10px;
}

/* THE SECTION STRIP (round 37 #4). NOTHING NEW IS DRAWN HERE and that is deliberate: the row is the
   sheet's shared `.controls` - a wrapping row of chips 8px apart, the app's most repeated layout -
   and each entry is the app's default button, which is already the capsule the control system's one
   affirmative shape ruling asks for. The coach market's tier chips are the same object doing the
   same job one screen over (`scrollToTier`), so this borrows the house's own in-page jump rather
   than inventing a shape for it. `src/style.css` is untouched: what is local is the rhythm under the
   strip and the mark on the entry the reader is in, and both are this page's.

   ⚠ THE 16px IS THE `section` MARGIN, not a number of this control's own. The strip stands BETWEEN
   two sections and the sheet gives every section `margin-bottom: 16px`; any other value would make
   this one gap the odd one out, which is the drift the note above about the switcher's 10px is
   already about. */
.stats-jump {
  margin-bottom: 16px;
}

/* WHERE THE READER IS, IN THE ACCENT - the sighted half of the `aria-current` announcement rather
   than decoration, so the two can never say different things. Same treatment the sheet gives a chip
   that is the live one (`.tier-chip.unlocked`: accent text, accent border, the 12% accent fill),
   because "this is the one you are on" is a state the app has already decided how to draw. */
.stats-jump-link[aria-current] {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-fill);
  font-weight: 700;
}
</style>

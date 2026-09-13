<script setup lang="ts">
// Round-6 – "How ranking points work" popover, opened from the "?" on the Home player
// card's Junior rank row. Owner got confused twice by the best-6 windowed ranking, so
// this spells it out plainly: the same CountingResultsTable the Kid screen shows (so the
// player can see their own six counted results while reading the rule), plus three short
// rule lines. Same dialog-overlay/scrollable-card/pinned-close pattern as TierGuide.vue.
//
// ⚠ IT EXPLAINS BOTH TABLES NOW (30.07, fix/ranking-truth). It showed one list - the ITF one - so a
// girl whose whole career so far is Local/Regional/National opened the explainer for the number on her
// Home chip and found an empty table and three rules about points she could not see. The screen that
// exists to end the owner's confusion was causing it. Both ladders are listed, each headed with its own
// rank, and the no-exchange-rate rule is stated because nothing else on the screen can imply it.
//
// ⚠⚠ AND IT IS THREE NOW (round 41 #1, the owner 12.09: «при клике на ранг на главной She has two
// rankings, их явно три, надо этот попап обновить»). The professional table has been on the snapshot
// since v30 and in the engine since the adult rungs shipped; this card never learned it, because the
// list of tables was written out by hand as `['domestic', 'itf']` - which is the same hardcoded-list
// drift `emptySeasonRecord` was patched for and `StatsScreen` fixed for its own switch in round 15.
// `what-money-buys-2026-08.md:582` had already filed it as «a plain defect... one array, one
// sentence».
//
// SO THE ROWS ARE DERIVED FROM `LADDER_TRACKS`, which is itself derived from `LADDER_LABEL` - a TOTAL
// Record, so a fourth table cannot ship without a name and the day it gets one it appears here. The
// per-table copy below is total for the same reason: a new member fails to COMPILE until somebody
// writes its two sentences, rather than silently rendering a block with no explanation in it.
import { computed, useTemplateRef } from 'vue'
import { useGameStore } from '../stores/game'
import { useDialogFocus } from '../composables/dialogFocus'
import { LADDER_LABEL, LADDER_TRACKS } from '../shared/protocol'
import { rankLabel } from '../shared/format'
import type { LadderTrack } from '../engine/season/types'
import CountingResultsTable from './CountingResultsTable.vue'
import IconButton from './ui/IconButton.vue'

const emit = defineEmits<{ close: [] }>()

// ⚠⚠ U-06 (review of 05.09) – THE ONE POPUP OUTSIDE THE FOCUS-MANAGED SET, and it was the whole
// set's own argument that made it a defect. `composables/dialogFocus.ts` says it plainly: announcing
// modality without containing the keyboard is WORSE than doing neither, because `aria-modal` tells
// assistive technology to ignore everything outside the card while Tab is still free to walk into
// it. This card had NEITHER half - no `role`, no trap, no Escape - so Tab left it for the tab bar
// behind the scrim and a screen reader was never told a card had opened at all. Thirteen dialogs
// call this composable; this is the fourteenth, on exactly the same terms.
//
// ⚠ ESCAPE IS PASSED because this card already closes on a backdrop click, and Escape is the
// keyboard's spelling of that same gesture (the composable's own rule for which dialogs get one -
// the blocking questions, which have no way out that is not an answer, pass nothing).
//
// ⚠ AND IT IS MOUNTED TWICE SINCE P2-6: Home owns the flag for the chip on the photograph and the
// shell owns the rail's. Exactly one of the two chips is reachable at any width (App.vue says so
// where it mounts the second), so the two `v-if`s can never both be up and the id below is never
// duplicated in the document - and because both flags render THIS component, both behave.
const card = useTemplateRef<HTMLElement>('card')
useDialogFocus(card, () => emit('close'))

const game = useGameStore()

/** HOW EACH TABLE COUNTS, in one sentence per table – the facts the shared rule list below could not
 *  carry once there were three of them.
 *
 *  ⚠ EVERY NUMBER HERE IS A REAL CONSTANT AND WAS READ OFF THE ENGINE, not remembered:
 *  `BEST_N_BY_TRACK` = { domestic: 6, itf: 6, wta: 18 } and `WINDOW_BY_TRACK` =
 *  { domestic: 'seasonToDate', itf: 'rolling52', wta: 'rolling52' } (season/ranking.ts), and the
 *  professional table's entry bar is §VIII.A.2.b's own `RANKABLE_MIN` = 3 tournaments or 10 points.
 *
 *  ⚠ AND THE NATIONAL TABLE IS THE ONE THE OLD COPY GOT WRONG. The single shared line said «the last
 *  52 weeks» of every table; the domestic ladder has counted THIS SEASON since round 23 #12, at the
 *  owner's own ruling («таблица должна просто показывать 6 лучших ЗА СЕЗОН»), so the card was telling
 *  him the opposite of what he had asked for. That is the second half of this item and not a wording
 *  change of our own: a rule line that names the wrong window is the same defect as an array that
 *  names two tables. */
const LADDER_RULE: Record<LadderTrack, string> = {
  domestic: 'Her best 6 results this season – the race restarts every January.',
  itf: 'Her best 6 Junior Tour results from the last 52 weeks.',
  wta: 'Her best 18 results from the last 52 weeks. She appears on it after 3 scoring tournaments, or 10 points.',
}

/** What an empty table means, per table – «nothing yet» is a different sentence on each one. */
const LADDER_EMPTY: Record<LadderTrack, string> = {
  domestic: 'Nothing here until she plays her first Local Open.',
  itf: 'Nothing here until she plays a Junior Tour event – national results do not count towards this ranking.',
  wta: 'Nothing here until she plays a W-series event – junior points do not cross over.',
}

const blocks = computed(() =>
  LADDER_TRACKS.map((t) => {
    const l = game.snapshot?.ladders[t]
    return {
      track: t,
      label: LADDER_LABEL[t],
      rank: rankLabel(l?.rank ?? 0, l?.rank !== null && l?.rank !== undefined),
      points: l?.points ?? 0,
      results: l?.countingResults ?? [],
      rule: LADDER_RULE[t],
      empty: LADDER_EMPTY[t],
    }
  }),
)
</script>

<template>
  <div class="dialog-overlay" @click.self="emit('close')">
    <!-- ⚠ U-06: role/aria-modal on the CARD and not on the scrim, `tabindex="-1"` so the trap has a
         landing place, and the title element names it - the same four lines every other dialog in
         the app carries (R2-07). Not one word of the card's copy moved. -->
    <div
      ref="card"
      class="guide-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rank-help-title"
      tabindex="-1"
    >
      <IconButton class="replay-close" icon="close" label="Close" title="Close" @click="emit('close')" />
      <p id="rank-help-title" class="guide-title">How ranking points work</p>
      <!-- ROUND 41 #1: «two» was the count of the hardcoded array below it, not of the game. -->
      <p class="hint">
        She has three rankings and they are counted separately – a result pays into one table only, and
        the totals never add up together.
      </p>
      <section v-for="b in blocks" :key="b.track" class="rank-help-block">
        <p class="rank-help-heading">{{ b.label }} – {{ b.rank }} · {{ b.points }} pts</p>
        <!-- ROUND 41 #1: each table says how IT counts. One shared sentence could carry two windows
             and two best-Ns; it could not carry three, and the one it carried was wrong for the
             National table (season-to-date since round 23 #12, at the owner's own ruling). -->
        <p class="hint rank-help-rule">{{ b.rule }}</p>
        <CountingResultsTable :results="b.results" :empty-note="b.empty" />
      </section>
      <ul class="rank-help-rules">
        <!-- W2-LADDER §3: the window width is per table - six for National and Junior Tour, EIGHTEEN
             on the professional table (the WTA's own rule, §VIII.A.4.a.i; it read sixteen until the
             05.08 correction). ⚠ ROUND 41 #1 MOVED THAT SENTENCE INTO THE BLOCKS rather than deleting
             it: with three tables it had three windows and three best-Ns to state, and the shared
             line had room for neither. The eleven reserved slots stay deliberately unspelled here:
             they convert to open ones for a player who has never been in a Slam or a 1000 draw, which
             is every player this dialog is read by until she is inside the top 50. -->
        <li class="hint">A new result only raises the total if it beats the weakest counted one.</li>
        <li class="hint">On the International and Professional tables, results older than 52 weeks drop out – points must be defended.</li>
        <li class="hint">National points are what open her next tier. The Junior Tour reads her international rank.</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
/* Local to this dialog: src/style.css is off limits, and these rules exist only because the card
   holds several tables instead of one and they need telling apart. */
.rank-help-block {
  margin-top: 14px;
}

.rank-help-heading {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 600;
}

/* ROUND 41 #1 – the table's own counting rule, between its heading and its rows. Tight to the
   heading and loose to the table, so it reads as a note ON the heading rather than as a row. */
.rank-help-rule {
  margin: 0 0 6px;
}
</style>

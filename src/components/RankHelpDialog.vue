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
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { LADDER_LABEL } from '../shared/protocol'
import { rankLabel } from '../shared/format'
import type { LadderTrack } from '../engine/season/types'
import CountingResultsTable from './CountingResultsTable.vue'
import IconButton from './ui/IconButton.vue'

defineEmits<{ close: [] }>()

const game = useGameStore()

const blocks = computed(() =>
  (['domestic', 'itf'] as LadderTrack[]).map((t) => {
    const l = game.snapshot?.ladders[t]
    return {
      track: t,
      label: LADDER_LABEL[t],
      rank: rankLabel(l?.rank ?? 0, l?.rank !== null && l?.rank !== undefined),
      points: l?.points ?? 0,
      results: l?.countingResults ?? [],
      empty:
        t === 'itf'
          ? 'Nothing here until she plays a Junior Tour event – national results do not count towards this ranking.'
          : 'Nothing here until she plays her first Local Open.',
    }
  }),
)
</script>

<template>
  <div class="dialog-overlay" @click.self="$emit('close')">
    <div class="guide-card">
      <IconButton class="replay-close" icon="close" label="Close" title="Close" @click="$emit('close')" />
      <p class="guide-title">How ranking points work</p>
      <p class="hint">
        She has two rankings and they are counted separately – national results and Junior Tour results
        never add up together.
      </p>
      <section v-for="b in blocks" :key="b.track" class="rank-help-block">
        <p class="rank-help-heading">{{ b.label }} – {{ b.rank }} · {{ b.points }} pts</p>
        <CountingResultsTable :results="b.results" :empty-note="b.empty" />
      </section>
      <ul class="rank-help-rules">
        <!-- W2-LADDER §3: the window width is per table now - six for National and Junior Tour,
             EIGHTEEN on the professional table (the WTA's own rule, §VIII.A.4.a.i; it read sixteen
             until the 05.08 correction). One sentence, both numbers, because this dialog shows all
             the tables at once. The eleven reserved slots are deliberately NOT spelled out here:
             they convert to open ones for a player who has never been in a Slam or a 1000 draw,
             which is every player this dialog is read by until she is inside the top 50. -->
        <li class="hint">Each ranking = the sum of her best results from the last 52 weeks in that table – the best 6, or the best 18 on the Pro table.</li>
        <li class="hint">A new result only raises the total if it beats the weakest counted one.</li>
        <li class="hint">Results older than 52 weeks drop out of the window – points must be defended.</li>
        <li class="hint">National points are what open her next tier. The Junior Tour reads her international rank.</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
/* Local to this dialog: src/style.css is off limits, and these two rules exist only because the card
   now holds two tables instead of one and they need telling apart. */
.rank-help-block {
  margin-top: 14px;
}

.rank-help-heading {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 600;
}
</style>

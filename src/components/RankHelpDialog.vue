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
import { computed, useTemplateRef } from 'vue'
import { useGameStore } from '../stores/game'
import { useDialogFocus } from '../composables/dialogFocus'
import { LADDER_LABEL } from '../shared/protocol'
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

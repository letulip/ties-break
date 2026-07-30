<script setup lang="ts">
// Package N – replay a kid WorldMatch on demand (Q&A 12: the result is already
// committed by runKidTournament; this is optional cinema, never re-decided).
// simulateMatch is a pure function of (a, b, opts) so re-running it under the
// SAME stored seed reproduces the exact match (winner/sets/log) byte for byte;
// annotateMatch then layers the rally/probability presentation on top.
import { computed } from 'vue'
import type { WorldMatch } from '../shared/protocol'
import type { MatchOptions } from '../engine/match/types'
import { simulateMatch } from '../engine/match/engine'
import { annotateMatch } from '../engine/match/rally'
import { JUNIOR_TOUR } from '../engine/season/tournament'
import MatchViewer from './MatchViewer.vue'
import IconButton from './ui/IconButton.vue'

const props = defineProps<{ match: WorldMatch }>()
defineEmits<{ close: [] }>()

const opts = computed<MatchOptions>(() => ({
  surface: props.match.surface,
  tour: JUNIOR_TOUR,
  seed: props.match.seed ?? '',
}))

const annotated = computed(() => {
  const result = simulateMatch(props.match.a, props.match.b, opts.value)
  return annotateMatch(result, props.match.a, props.match.b, opts.value)
})
</script>

<template>
  <!-- ⚠ THIS WAS A CENTRED CARD ON A DIMMED PAGE (`.dialog-overlay` > `.replay-card`) AND IT IS NOW
       THE SAME TAKEOVER THE LIVE MATCH IS (owner, 30.07: «I suppose we need the same principle of
       opening live and replay matches. Maybe a popup format (current live) is better – it looks just
       like a separate screen and works fine, let's stick to it»). The container is the only thing
       that differed between watching live and watching again: identical viewer, identical panels,
       one `mode` prop apart, in two different boxes.
       IT WAS ALSO BROKEN, AND MEASURABLY. `.dialog-overlay` is `display: flex; align-items: center`
       with `overflow: visible`, so the card was centred and could not scroll. Measured at 375x812
       once a replay finished and the box score appeared: the card grew to 1243px inside an 812px
       viewport, sitting at y=-215.5, which put the COURT, the close button and the bottom of the box
       score outside the window with no way to reach any of them. The takeover's `.tf-body` is a real
       scroller, so nothing is unreachable at any length.
       No new CSS: `.tournament-flow` / `.tf-top` / `.tf-body` are the shared takeover vocabulary in
       src/style.css that PracticeFlow and TournamentFlow already open a match in. (`.tf-card` was in
       that list until 30.07 took the outer frame off all three - see the note in the body below.) -->
  <div class="tournament-flow">
    <header class="tf-top">
      <div>
        <div class="tf-title">Match replay</div>
        <div class="tf-sub">
          <span class="pill">{{ match.a.name }} vs {{ match.b.name }}</span>
        </div>
      </div>
      <!-- THE ONE CROSS LEFT ON THE MATCH SCREENS, and it is the only one that earns its place: a
           replay has nowhere to go but out. It does exactly what it says - dismisses the overlay -
           and it cannot lose anything, because a replay decides nothing and the box score is inside
           the viewer below, not on a screen after it. The friendly's header used to carry the same
           control and no longer does; there it was competing with "To result →" (see PracticeFlow).
           ⚠ ADOPTED AT THE INTEGRATION MERGE: the owner's own `close.svg` and the `IconButton`
           that carries it landed on the icon-system branch in the same round, and the note that
           stood here asked for exactly this. A glyph in a text run became a named control with a
           real asset - the last bare ✕ in the match flow is gone. -->
      <IconButton icon="close" label="Close replay" title="Close" @click="$emit('close')" />
    </header>
    <div class="tf-body">
      <!-- ⚠ NO PANEL AROUND THE VIEWER, and that is the 30.07 correction (owner: «на экране матча у
           нас двойная рамка, она съедает место, давай внешний контур уберем, он не нужен»). This was
           a `.tf-card` - 16px of padding and a hairline - wrapped around a stack of `Card`s the viewer
           draws itself, so the border was doubled and the padding bought nothing. Measured at 375pt:
           291 -> 327px of canvas, 244.4 -> 274.9px of painted court, 32px of height back. The takeover
           vocabulary this screen borrows is now `.tournament-flow` / `.tf-top` / `.tf-body` only. -->
      <MatchViewer :match="annotated" :player-a="match.a" :player-b="match.b" :surface="match.surface" mode="replay" />
    </div>
  </div>
</template>

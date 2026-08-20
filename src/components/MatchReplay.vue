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
import { occasionOf } from '../viz/preview'
import MatchViewer from './MatchViewer.vue'
import IconButton from './ui/IconButton.vue'
import TakeoverShell from './ui/TakeoverShell.vue'

const props = withDefaults(
  defineProps<{
    match: WorldMatch
    /** ⭐⭐ WHAT THIS MATCH WAS – the college wave, and it is the owner's "only the tournament names
     *  differing" taken literally (19.08, quoted verbatim in `docs/plans/college-as-a-place.md` §3).
     *  A tour re-watch is headed "Match replay" because the occasion line under the
     *  viewer already names the rung; a national-team rubber has NO rung (`occasionOf` correctly
     *  returns null on an id that names no tier), so without this the one screen that could say which
     *  competition she was playing in would say nothing at all.
     *
     *  ⚠ DEFAULTED, NOT REQUIRED, so both existing call sites (the Home feed and the Season bracket)
     *  are byte-identical. `TakeoverShell.title` is deliberately required-and-nullable one layer
     *  down; that rule is about "no header versus a header", which is not the question here. */
    title?: string
  }>(),
  { title: 'Match replay' },
)
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

/**
 * ⭐ ROUND-23 #4 – WHICH TOURNAMENT THIS WAS, and it is the fix for a bug the owner keeps catching by
 * looking at frames: this screen passed NOTHING, so every re-watch in the game fell to storey 1.
 *
 * This component is how a match is watched again from BOTH the Season bracket and the Home feed, and
 * a stored `WorldMatch` carries a rung's worth of context in its `eventId` – so a Grand Slam
 * quarter-final re-opened here narrated like a Sunday-morning local draw: no stake named, no room, no
 * standing, and (since round 23) none of the extra beats the top of the tour is owed. The occasion is
 * DERIVED rather than remembered – see `occasionOf` for why that distinction is the actual fix – and
 * a practice friendly, whose id names no tier, still correctly gets null.
 */
const previewEvent = computed(() => occasionOf(props.match.eventId, props.match.round))
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
       ⚠ AND THE HAND-WRITTEN CHROME IS GONE TOO, 30.07: this screen's `.tournament-flow` / `.tf-top` /
       `.tf-body` were the SHORTEST of the three copies, and being short is what let the sandbox's
       fourth copy drift into a real bug. All four surfaces now draw the layer, the header and the
       scroller through `ui/TakeoverShell.vue`; the classes are unchanged, they just have one author.
       (`.tf-card` was in that list until 30.07 took the outer frame off all three - see below.) -->
  <TakeoverShell :title="title">
    <template #sub>
      <span class="pill">{{ match.a.name }} vs {{ match.b.name }}</span>
    </template>
    <!-- THE CROSS, and it is one of only two in the match flow: a replay has nowhere to go but out.
         It does exactly what it says - dismisses the overlay - and it cannot lose anything, because a
         replay decides nothing and the whole account is in the viewer's log below, not on a screen
         after it (the stats card this replay was opened FROM still holds the numbers; the viewer's
         own box score went with the owner's 12.08 ruling). The friendly's header used to carry the
         same control and no longer does; there it was competing with "To result →" (see PracticeFlow).
         ⚠ ADOPTED AT THE INTEGRATION MERGE: the owner's own `close.svg` and the `IconButton`
         that carries it landed on the icon-system branch in the same round, and the note that
         stood here asked for exactly this. A glyph in a text run became a named control with a
         real asset - the last bare ✕ in the match flow is gone. -->
    <template #exit>
      <IconButton icon="close" label="Close replay" title="Close" @click="$emit('close')" />
    </template>
    <!-- ⚠ NO PANEL AROUND THE VIEWER, and that is the 30.07 correction - the owner's words are on
         the script side; in short, the match screen had a double frame eating space, so the outer
         contour goes. This was
         a `.tf-card` - 16px of padding and a hairline - wrapped around a stack of `Card`s the viewer
         draws itself, so the border was doubled and the padding bought nothing. Measured at 375pt:
         291 -> 327px of canvas, 244.4 -> 274.9px of painted court, 32px of height back. -->
    <!-- ⭐ ROUND-23 #4: `preview-event` is the one prop this screen never passed – see the script. -->
    <MatchViewer
      :match="annotated"
      :player-a="match.a"
      :player-b="match.b"
      :surface="match.surface"
      :preview-event="previewEvent"
      mode="replay"
    />
  </TakeoverShell>
</template>

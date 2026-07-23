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
  <div class="dialog-overlay" @click.self="$emit('close')">
    <div class="replay-card">
      <div class="replay-header">
        <span class="pill">{{ match.a.name }} vs {{ match.b.name }}</span>
        <button class="link" @click="$emit('close')">Close ✕</button>
      </div>
      <MatchViewer :match="annotated" :player-a="match.a" :player-b="match.b" :surface="match.surface" />
    </div>
  </div>
</template>

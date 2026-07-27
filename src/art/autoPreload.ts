// R11-9 – the one place that decides WHEN the art warms up, kept out of the components so the
// screens stay declarative (and so this slice touched no component at all).
//
// The trigger is her AGE, because age is what selects a portrait band (shared/avatarEmotion
// portraitStage). One watch on the snapshot covers every surface at once: the Kid screen portrait,
// the Home card, the header crop and the tournament finale splash all read the same band.
//
// Timing: it runs on the first snapshot the store receives (career loaded / created) and again
// whenever a weekly tick rolls her into a new year – both are moments where nothing is on screen
// yet, so the fetches never compete with a reveal animation.
import { watch } from 'vue'
import { useGameStore } from '../stores/game'
import { preloadForAge, preloadNextStageIfDue } from './preload'

export function startArtPreloader(): void {
  const game = useGameStore()
  watch(
    () => game.snapshot?.ageYears,
    (age) => {
      if (typeof age !== 'number') return
      preloadForAge(age)
      preloadNextStageIfDue(age)
    },
    { immediate: true },
  )
}

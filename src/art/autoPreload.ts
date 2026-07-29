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
import {
  preloadCoachArt,
  preloadCoachMarketArt,
  preloadForAge,
  preloadNextStageIfDue,
  preloadTravelHomeArt,
} from './preload'

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
  // epic/redesign-home: the coach's face, on its OWN trigger, which keeps the per-band portrait
  // budget (14 urls) literal.
  //
  // ⚠ RE-KEYED (R4) FROM THE BACKGROUND TO THE COACH. The original comment said "the family's coach
  // does not change at all in v1", and that stopped being true the moment the Coach Market shipped:
  // Home now renders HER coach's portrait, so a watch on `background` would warm the default face
  // and leave the one actually on screen cold. The key is `coachId`, so the warm follows a hire.
  // Self-coached still falls back to the background default, which is the face Home shows then.
  watch(
    () => [game.snapshot?.coachId, game.snapshot?.profile.background] as const,
    ([coachId, background]) => {
      if (coachId) preloadCoachMarketArt([coachId])
      else if (background) preloadCoachArt(background)
    },
    { immediate: true },
  )
  // R14-2: the journey home, on its own trigger for the same reason the coach has one – it follows
  // the WEEK, not her age band, and the per-band budget is a rule worth keeping literal. The engine
  // has already chosen which of the four this week shows, so exactly one file is fetched, at the
  // weekly tick, before the tab that renders it is opened. Null on every other week and free.
  watch(
    () => game.snapshot?.diary.facts.travelHomeScene,
    (scene) => preloadTravelHomeArt(scene),
    { immediate: true },
  )
}

// F45-1 – the app header's small round avatar, and ONLY that surface.
//
// Owner (27.07): «верхняя круглая аватарка в хедере вообще не должна меняться эмоционально, там
// всегда norm для возраста стоит, в остальном она статична.» The header is chrome: it sits above
// every screen, all the time, so a face that flickers between happy / sad / tired / injury as the
// weeks tick is noise, not information. The Home player card and the Kid screen's big painting are
// where her state is allowed to show, and they keep it.
//
// WHY THIS IS ITS OWN MODULE rather than a call site of the emotion composable that happens to ask
// for 'norm'. A call site can be "fixed" and then quietly re-wired by the next refactor – this
// header has carried an emotion since round 5 and travelled through three refactors (R8-6a/6b,
// R9-13/15, R9-16) without anyone noticing it was still reacting. So the header gets a path on
// which an emotion cannot travel: `headerCropUrl` takes the age and nothing else, there is no
// parameter an emotion could arrive through, and this file never imports the emotion decision.
// Pinned by tests/round11-followups.test.ts (F45-1), which fails if the shell is ever routed back
// through that composable.
import { computed, type ComputedRef } from 'vue'
import { useGameStore } from '../stores/game'
import { avatarCropPath, portraitStage } from '../shared/avatarEmotion'

/** The one emotion the header may ever show. Not a default – the only value. */
const HEADER_EMOTION = 'norm'

/** Her age band's `norm` crop. One argument, by design: there is no seam through which a
 *  result, an injury or a fatigue state could reach this URL. */
export function headerCropUrl(ageYears: number): string {
  return `${import.meta.env.BASE_URL}${avatarCropPath(portraitStage(ageYears), HEADER_EMOTION)}`
}

/** The header avatar: age in, crop out. Re-resolves only on a birthday. */
export function useHeaderAvatar(): { cropUrl: ComputedRef<string> } {
  const game = useGameStore()
  return { cropUrl: computed(() => headerCropUrl(game.snapshot?.ageYears ?? 14)) }
}

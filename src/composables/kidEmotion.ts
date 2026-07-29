// R9-13/15 – ONE emotion decision for every portrait surface that is ALLOWED an emotion (the
// Home photo card and the Kid screen's big portrait), so they can never disagree. The app header
// is age-only (F45-1) and lives in ./headerAvatar.ts.
//
// DIARY-1 MOVED THE DECISION ENGINE-SIDE. This composable used to walk the snapshot's events for
// her latest result/title and call `avatarEmotion` itself; the diary's copy system needed the very
// same walk on the other side of the engine/UI line (a phrase licensed by the emotion must be the
// emotion the painting shows), and one walk in one place is the only way the image and the words
// can never disagree. The walk now lives in `engine/diary.ts` (lastKidResultOf / lastKidTitleOf,
// same predicate, same tier resolution), the engine computes the emotion into
// `snapshot.diary.facts` – with the facts only IT can know, like the rank-climb softener – and
// this composable reads the decision instead of re-making it. URL building stays here: it is
// presentation, not judgement.
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import {
  avatarCropPath,
  portraitStage,
  resultShowsOnHerFace,
  type AvatarEmotion,
  type PortraitStage,
} from '../shared/avatarEmotion'

/**
 * R11-2 – which recorded matches are allowed to change her FACE. THE DEFINITION lives in
 * `shared/avatarEmotion.ts` (fix/world-trio item 3) and is re-exported here unchanged, so every
 * import path that already pointed at this module keeps working. The one walk that asks it is now
 * `engine/diary.ts` (lastKidResultOf) – the engine's facts assembly, whose emotion this composable
 * renders. Its behaviour is byte-identical – `!!e.match && !e.friendly`.
 */
export { resultShowsOnHerFace }

export function useKidEmotion() {
  const game = useGameStore()

  // THE decision, as the engine made it at snapshot time (diary facts). Fallback `norm` only for
  // the no-snapshot mount gap – every real snapshot carries a diary.
  const emotion = computed<AvatarEmotion>(() => game.snapshot?.diary.facts.emotion ?? 'norm')

  // R9-16: the portrait stage follows her age (jun < 11, young 11-16, teen 17-22, adult 23-30,
  // milf 31+).
  const stage = computed<PortraitStage>(() => portraitStage(game.snapshot?.ageYears ?? 14))

  // 256px card crops live in public/avatars/{stage}-{emotion}.webp. `avatarCropPath` is shared
  // with the emotion-free header (F45-1), so the two crop surfaces cannot drift apart.
  const cropUrl = computed(
    () => `${import.meta.env.BASE_URL}${avatarCropPath(stage.value, emotion.value)}`,
  )

  // Full-size paintings: public/images/fem-euro-brunnet/fem-euro-brunnet-{stage}-{emotion}.webp
  // (every stage×emotion exists, adult included).
  const portraitUrl = computed(
    () =>
      `${import.meta.env.BASE_URL}images/fem-euro-brunnet/fem-euro-brunnet-${stage.value}-${emotion.value}.webp`,
  )

  return { emotion, stage, cropUrl, portraitUrl }
}

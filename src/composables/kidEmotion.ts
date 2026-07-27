// R9-13/15 – ONE emotion decision for every portrait surface that is ALLOWED an emotion (the
// Home player-card avatar and the Kid screen's big portrait), so they can never disagree. The
// app header used to be the third; F45-1 took it off this composable for good – it is age-only now
// and lives in ./headerAvatar.ts. Wraps the pure avatarEmotion helper (R8-6a/6b + R9-11
// win-immunity) with the snapshot reads it needs: the freshest kid match (with its tier), the
// freshest title, condition and injury.
//
// Tier resolution is structural, not text-parsing: a SeasonEvent id is `${year}-w${week}-${tier}`
// (calendar.ts), so the match's own eventId names its tier; the title's tier falls back to the
// tournament summary's label prefix against the closed TIERS catalogue.
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import {
  avatarCropPath,
  avatarEmotion,
  portraitStage,
  resultShowsOnHerFace,
  type AvatarEmotion,
  type LastKidResult,
  type LastKidTitle,
  type PortraitStage,
} from '../shared/avatarEmotion'
import { KID_ID } from '../engine/world'
import { TIERS, tierFromLabel } from '../engine/season/calendar'
import type { TierId } from '../engine/season/types'

const TIER_IDS = Object.keys(TIERS) as TierId[]

/**
 * R11-2 – which recorded matches are allowed to change her FACE. THE DEFINITION MOVED to
 * `shared/avatarEmotion.ts` (fix/world-trio item 3) and is re-exported here unchanged, so every
 * import path that already pointed at this module keeps working.
 *
 * It moved because it grew a second caller on the far side of the engine/UI line: the engine's
 * consecutive-loss streak has to skip exactly the same events this walk skips (a friendly that is
 * not a RESULT must not be a LOSS either), and the only way to guarantee that is one function, in
 * the layer both sides can import. Its behaviour is byte-identical – `!!e.match && !e.friendly`.
 *
 * Every portrait that shows an emotion – the Home player card and the Kid screen's big painting –
 * takes it from `useKidEmotion` below, so gating it there gates both at once. The app header is no
 * longer in that set at all (F45-1: it is age-only, ./headerAvatar.ts). TournamentFlow's finale art
 * is NOT affected and must not be: it only ever mounts for a tournament reveal.
 */
export { resultShowsOnHerFace }

/** `${year}-w${week}-${tier}` → tier (undefined for an unparseable/foreign id). */
function tierFromEventId(eventId: string | undefined): TierId | undefined {
  if (!eventId) return undefined
  const tail = eventId.split('-').pop()
  return TIER_IDS.find((t) => t === tail)
}

/** Tournament-summary events read `${TIERS[tier].label} (…)` – the shared longest-label-first
 *  matcher in calendar.ts owns the lookup (and with it the "Junior Tour 30" / "300" prefix trap). */
const tierFromSummaryText = tierFromLabel

export function useKidEmotion() {
  const game = useGameStore()

  // The kid's most recent TOURNAMENT match. A result emotion only lasts until the next weekly
  // tick (avatarEmotion checks week === current), so walking the trailing feed is enough.
  // R11-2: a practice friendly is skipped outright – it is not a result her face reports on.
  const lastResult = computed<LastKidResult | null>(() => {
    const events = game.snapshot?.events
    if (!events) return null
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i]
      const match = e.match
      if (!match || !resultShowsOnHerFace(e)) continue
      const won = match.winnerId === KID_ID
      // R8-6a: a loss in the FINAL = runner-up = a good result. The same week's tournament
      // summary carries finishIdx 1 exactly when her run ended in the final.
      const lostFinal =
        !won && events.some((t) => t.type === 'tournament' && t.week === e.week && t.finishIdx === 1)
      return { week: e.week, won, lostFinal, tier: tierFromEventId(match.eventId) }
    }
    return null
  })

  // R9-11: the kid's most recent TITLE (finishIdx 0 on a tournament summary). The 60-event
  // snapshot window is plenty – the longest immunity is 2 weeks.
  const lastTitle = computed<LastKidTitle | null>(() => {
    const events = game.snapshot?.events
    if (!events) return null
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i]
      if (e.type !== 'tournament' || e.finishIdx !== 0) continue
      const tier = tierFromSummaryText(e.text)
      if (tier) return { tier, week: e.week }
    }
    return null
  })

  const emotion = computed<AvatarEmotion>(() =>
    avatarEmotion({
      week: game.snapshot?.week ?? 0,
      condition: game.snapshot?.condition ?? 100,
      injured: !!game.snapshot?.injury,
      lastResult: lastResult.value,
      lastTitle: lastTitle.value,
      // Taken from the snapshot AS IS – the streak and its anger threshold are the engine's, drawn
      // once per streak off a purpose-scoped sub-stream. Recomputing (or re-drawing) either here
      // would flicker her face between `sad` and `angry` on one screen; see engine computeLossStreak.
      lossStreak: game.snapshot?.lossStreak ?? null,
    }),
  )

  // R9-16: the portrait stage follows her age (jun < 11, young 11-16, teen 17-22).
  const stage = computed<PortraitStage>(() => portraitStage(game.snapshot?.ageYears ?? 14))

  // 256px card crops live in public/avatars/{stage}-{emotion}.webp – the Home player card is the
  // only consumer since F45-1 took the header off this composable. `avatarCropPath` owns the
  // adult→teen clamp for both of us, so the two crop surfaces cannot drift apart.
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

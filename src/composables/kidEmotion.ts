// R9-13/15 – ONE emotion decision for every portrait surface (the header crop, the Home
// player-card avatar and the Kid screen's big portrait), so they can never disagree. Wraps
// the pure avatarEmotion helper (R8-6a/6b + R9-11 win-immunity) with the snapshot reads it
// needs: the freshest kid match (with its tier), the freshest title, condition and injury.
//
// Tier resolution is structural, not text-parsing: a SeasonEvent id is `${year}-w${week}-${tier}`
// (calendar.ts), so the match's own eventId names its tier; the title's tier falls back to the
// tournament summary's label prefix against the closed TIERS catalogue.
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import {
  avatarEmotion,
  portraitStage,
  type AvatarEmotion,
  type LastKidResult,
  type LastKidTitle,
  type PortraitStage,
} from '../shared/avatarEmotion'
import { KID_ID } from '../engine/world'
import { TIERS, tierFromLabel } from '../engine/season/calendar'
import type { TierId } from '../engine/season/types'
import type { WorldEvent } from '../shared/protocol'

const TIER_IDS = Object.keys(TIERS) as TierId[]

/**
 * R11-2 – which recorded matches are allowed to change her FACE. The owner: «на practice match
 * вообще не вижу смысла менять аватарку на выигрыш или проигравшую – на турнирах да, локальные,
 * региональные, национальные да, а на тренировочных не вижу смысла.»
 *
 * A booked friendly is stored as an ordinary `match` event with `friendly: true` (world.ts
 * resolvePractice) – the same shape a tournament round has – so the result layer picked it up and she
 * came home from a hit-out at the club looking crushed. A practice match now leaves her face alone:
 * she falls back to the IDLE emotion (condition / injury), exactly as on any week she did not compete.
 *
 * This is the ONE predicate for it. Every portrait in the app – App.vue's header crop, the Home
 * player card and the Kid screen's big painting – takes its emotion from `useKidEmotion` below, so
 * gating it here gates all three at once and they cannot drift apart. TournamentFlow's finale art is
 * NOT affected and must not be: it only ever mounts for a tournament reveal.
 */
export function resultShowsOnHerFace(e: WorldEvent): boolean {
  return !!e.match && !e.friendly
}

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
    }),
  )

  // R9-16: the portrait stage follows her age (jun < 11, young 11-16, teen 17-22).
  const stage = computed<PortraitStage>(() => portraitStage(game.snapshot?.ageYears ?? 14))

  // 256px header/card crops live in public/avatars/{stage}-{emotion}.webp. Crops exist for
  // jun/young/teen; the adult set is LATER-LIFE content whose crops haven't been cut yet, so
  // the crop surfaces clamp to teen until then (the full-size adult art below already exists).
  const cropUrl = computed(() => {
    const cropStage = stage.value === 'adult' ? 'teen' : stage.value
    return `${import.meta.env.BASE_URL}avatars/${cropStage}-${emotion.value}.webp`
  })

  // Full-size paintings: public/images/fem-euro-brunnet/fem-euro-brunnet-{stage}-{emotion}.webp
  // (every stage×emotion exists, adult included).
  const portraitUrl = computed(
    () =>
      `${import.meta.env.BASE_URL}images/fem-euro-brunnet/fem-euro-brunnet-${stage.value}-${emotion.value}.webp`,
  )

  return { emotion, stage, cropUrl, portraitUrl }
}

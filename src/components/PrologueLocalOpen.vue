<script setup lang="ts">
// ⭐⭐ THE LOCAL OPEN, PLAYED – phase 11 of docs/specs/childhood-prologue-build-2026-09.md.
//
// THE OWNER, on the age-10 card: «И как раз после этого экрана хотелось бы реально увидеть турнир,
// если игрок выбрал "участвовать", а не просто пролистать.» So the weekend is a screen the player
// sits through, not a line of text on the next card - and it is HER matches, in the order she played
// them, in the app's own match viewer.
//
// ⚠⚠ THIS COMPONENT ADDS NO MECHANISM AND NO SENTENCE. Phase 3 built the field and proved the
// shipped viewer plays a pool child (tests/component/prologue-local-open.test.ts: «The viewer needs
// nothing new»), and every word on this screen comes from `LOCAL_OPEN_COPY` in src/prologue/cards.ts
// through a binding, exactly as `PrologueCard.vue` holds none - the owner has read no prologue copy
// and §8's rule is that it ships only with his word. The one string this file resolves for itself is
// the ROUND, and it resolves it through the engine's own `stageLabel`, so a Quarterfinal is called
// what the draw sheet in the rest of the game calls it.
//
// ⚠ THE MATCH IS RE-SIMULATED, NOT RE-DECIDED. `playMatch` writes the engine seed onto every record
// she played (`MatchRecord.seed`), so `simulateMatch` under that seed reproduces the exact match the
// bracket already resolved - the same recipe SeasonScreen's hit-out and every other viewer surface
// use. The bracket is the authority; this screen only shows what it decided.
//
// ⭐⭐ THE MATCH IS THE POINT, AND THE WAY OUT IS A SAFETY CONTROL RATHER THAN THE DEFAULT.
// THE OWNER, on the ten-minute figure a brief had turned into a constraint: «Десять минут это ваша
// цифра, и турниры не должны её съесть – это была примерная цифра … и это одна из основных частей
// игры вообще-то.» So nothing here is designed around a clock: the viewer opens LIVE and plays, at
// the app's own defaults, and its own speed pills are how a player who wants it faster gets it.
//
// What the screen still owes is a way OUT, and that is round-20 #3 rather than a budget: this is a
// takeover with up to three matches on it, and a takeover a player cannot leave is the shape that
// stopped the owner's career on `TourBriefingDialog` («сейчас его даже не закрыть»). There are two,
// and only one of them is new:
//   1. THE VIEWER'S OWN. `MatchControls.vue` ships «Skip to the result» on every match in the game
//      and it is pinned by the phase-3 test; it ends this match and hands over the account of it.
//   2. THE WEEKEND'S. The header control below leaves the whole draw at once - one press instead of
//      three. ⚠ DRAFT copy like everything else here, and the one control in this slice the owner
//      could delete without changing anything else.
// `tests/component/prologue-walk.test.ts` measures what each costs and prints it.
import { computed, ref } from 'vue'
import MatchViewer from './MatchViewer.vue'
import { simulateMatch } from '../engine/match/engine'
import { annotateMatch } from '../engine/match/rally'
import { JUNIOR_TOUR } from '../engine/season/tournament'
import { stageLabel } from '../engine/world/labels'
import { LOCAL_OPEN_COPY } from '../prologue/cards'
import { herMatches, LOCAL_POOL, type LocalOpen } from '../prologue/pool'
import type { MatchOptions, MatchPlayer } from '../engine/match/types'

const props = defineProps<{
  /** the weekend, as `playLocalOpen` resolved it – the bracket is already decided */
  open: LocalOpen
  /** her, with `KID_ID`, which is what makes the viewer point at the right girl (`matchReadout`) */
  kid: MatchPlayer
}>()

const emit = defineEmits<{
  /** the weekend is over, either because she ran out of matches or because the player left */
  (e: 'done'): void
}>()

/** The copy table, bound rather than quoted. */
const copy = LOCAL_OPEN_COPY

/** Her matches, in the order she played them – one to three of them in a draw of eight. */
const played = computed(() => herMatches(props.open, props.kid.id))

/** Which of them is on screen. */
const at = ref(0)

const record = computed(() => played.value[at.value] ?? null)

/** ⚠ SIDES ARE THE RECORD'S, NOT THIS SCREEN'S. `aId`/`bId` are how the bracket drew them and the
 *  viewer colours the accent off whichever side carries `KID_ID`; swapping them here would put her
 *  name on the wrong seat in a match she is in. */
const sides = computed<{ a: MatchPlayer; b: MatchPlayer } | null>(() => {
  const rec = record.value
  if (!rec) return null
  const oppId = rec.aId === props.kid.id ? rec.bId : rec.aId
  const opponent = props.open.field.find((p) => p.id === oppId)
  if (!opponent) return null
  return rec.aId === props.kid.id ? { a: props.kid, b: opponent } : { a: opponent, b: props.kid }
})

const options = computed<MatchOptions>(() => ({
  surface: props.open.event.surface,
  tour: JUNIOR_TOUR,
  seed: record.value?.seed ?? '',
}))

const annotated = computed(() => {
  const two = sides.value
  if (!two) return null
  const opts = options.value
  return annotateMatch(simulateMatch(two.a, two.b, opts), two.a, two.b, opts)
})

/** The round, in the draw sheet's own words – the engine's namer, so there is no second idea here of
 *  what a Semifinal is called. */
const stage = computed(() => stageLabel(record.value?.round ?? 0, LOCAL_POOL.size))

/** ⚠ THE FINAL'S OWN CUE, on the one match that is one. `MatchViewer.finalMatch` swaps the applause
 *  clip; a weekend whose last match is a first-round exit is not a final and does not get it. */
const isFinal = computed(() => (record.value?.round ?? 0) === props.open.rounds - 1)

/** One match is over. The next one, or the weekend is. */
function next(): void {
  if (at.value < played.value.length - 1) {
    at.value += 1
    return
  }
  emit('done')
}
</script>

<template>
  <div class="plo">
    <!-- ⚠⚠ THE HEADER IS FIRST AND IS NOT INSIDE THE VIEWER, which is the round-20 #3 rule applied
         to a screen rather than to a dialog. The way out has to be reachable on a 375x667 phone
         without scrolling past a 420px-tall court, so it sits above it and stays there. -->
    <header class="plo-head">
      <div class="plo-titles">
        <p class="plo-kicker">{{ copy.kicker }}</p>
        <p class="plo-stage">{{ stage }}</p>
      </div>
      <button class="link plo-skip" type="button" @click="emit('done')">{{ copy.skipRest }}</button>
    </header>

    <!-- The shipped viewer, with nothing new asked of it. `mode="live"` is the truth here: the match
         is simulated at the moment this screen opens and is written to no save. -->
    <MatchViewer
      v-if="annotated && sides"
      :key="at"
      :match="annotated"
      :player-a="sides.a"
      :player-b="sides.b"
      :surface="open.event.surface"
      :final-match="isFinal"
      mode="live"
      :proceed-label="copy.proceed"
      @finish="next()"
    />
  </div>
</template>

<style scoped>
/* A TAKEOVER, LIKE EVERY OTHER MATCH SCREEN IN THE APP. The owner took the outer frame off all three
   of them on 30.07 («давай внешний контур уберем, он не нужен» – quoted in style.css), so there is
   no card around a court here either.

   ⚠ EVERY COLOUR IS A DECLARED TOKEN WITH NO FALLBACK – round-17 #3's rule, and PrologueCard.vue's
   style block carries the account of what a fallback shipped. */
.plo {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  overflow-y: auto;
  background: var(--bg);
}

/* ⚠⚠ THE RIGHT-HAND PADDING IS THE MUTE ICON'S SEAT AND IS NOT DECORATION. `MuteButton` is
   `position: fixed` at `top: --app-pad-top; right: --app-pad-x`, 40x40, z-index 61 – i.e. above this
   takeover (60) and in the same place on every prologue surface, which is the whole point of it
   being declared once in `ChildhoodPrologue.vue`. On a card that lands over the painting and costs
   nothing; here the header IS the top of the screen, so without this the escape below would sit
   under the icon on a 375px phone. 40 + a 12px gap. */
.plo-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-right: 52px;
  flex: 0 0 auto;
}

.plo-titles {
  min-width: 0;
}

.plo-kicker {
  margin: 0;
  font-size: var(--label-size);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-dim);
}

.plo-stage {
  margin: 2px 0 0;
  font-family: var(--font-heading);
  font-size: 18px;
  color: var(--ink);
}

/* The way out of the weekend. A LINK rather than a plate, for the same reason the viewer's own
   «Skip to the result» is one: it is not an answer, it is the door. */
.plo-skip {
  flex: 0 0 auto;
  color: var(--ink-soft);
}
</style>

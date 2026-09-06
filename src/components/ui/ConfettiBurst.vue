<script setup lang="ts">
// CONFETTI – the podium's own paper, ported from Tense Titans (the owner's other project).
//
// The owner, on the tournament finale: «На втором месте нет конфетти на финальном экране, есть ли
// на первом, проверить. Мне кажется на втором тоже можно. Всё-таки подиум. На первом тоже нет
// конфетти. Возьми пожалуйста из проекта tense Titans, там есть. Сделай так же.»
//
// He is right on both counts: neither poster had any. What was there instead was a DECISION, and it
// is re-aimed rather than quietly dropped – see the ⚠ over `finaleEmotion` in TournamentFlow.vue.
//
// -------------------------------------------------------------------------------------------------
// WHAT WAS PORTED, AND WHAT WAS NOT
// -------------------------------------------------------------------------------------------------
//
// Tense Titans is plain HTML/JS: a `<div id="confetti">` that lives in index.html for the life of the
// page, a `confettiBurst(n)` that appends `n` divs to it with six hard-coded hex colours and four
// inline custom properties each, and a `setTimeout(p.remove, 1300)` per piece. What is GOOD about it
// is the physics, and that is what came across:
//
//   * ONE keyframe, `translate(--dx, --dy) rotate(--rot)` to `opacity: 0`, so every piece runs the
//     same animation and the variety is entirely in four numbers set per piece. Cheap, and it means
//     the browser composites the whole burst on the GPU.
//   * The numbers themselves, kept to the source's ranges because they are TUNED and a burst is easy
//     to make look wrong: start near the middle (±23%), drift ±110px sideways, fall 160-420px, spin
//     up to a full turn either way, and stagger the starts across 80ms so it does not read as one
//     rigid sheet.
//   * The auto-removal. `forwards` leaves an invisible piece in the DOM for ever otherwise.
//
// WHAT DID NOT COME ACROSS is everything that was a consequence of having no components:
//
//   * THE HEX VALUES. Six literals (`#ffd166`, `#6c5ce7`, …) belong to that app's palette and would
//     be six invented colours in this one - which `tests/design-tokens.test.ts` exists to refuse, and
//     rightly. Every piece here is a token this app already owns; see `PIECE_TOKENS`.
//   * THE GLOBAL ROOT AND THE IMPERATIVE APPEND. A single page-level `#confetti` div plus a function
//     that reaches for it by id is how you do this without a component model. Here the burst IS a
//     component, mounted by whoever is celebrating, and it cleans itself up by unmounting.
//   * `position: fixed`. The source covers the top 70vh of the window because its celebration is the
//     whole page. Ours belongs to a specific card, so it is `absolute` inside it and the caller only
//     has to be a positioning context. That also keeps it out of any fight with the takeover shell
//     over stacking, which a fixed overlay inside a transformed ancestor would lose anyway.
//
// -------------------------------------------------------------------------------------------------
// ⚠ REDUCED MOTION IS A REFUSAL, NOT A SLOWER ANIMATION
// -------------------------------------------------------------------------------------------------
//
// The source's own `reduceMotion()` returns early and draws nothing, and that is the correct answer
// here too: confetti carries no information. The poster already says "Champion" in words, in a mark,
// and in the colour of its own border, so a player who has asked their system for less motion loses
// decoration and no meaning. It is checked in SCRIPT rather than by a `@media` rule that sets
// `animation: none`, because that variant would still mount fifty spans and leave them lying in a
// heap at the top of the card.
//
// RANDOM IS FINE HERE, and only here: `Math.random` is forbidden in `src/engine` (the career must
// replay from its seed) and this is a component that decorates one already-decided result. Same
// licence the name roller and the SFX variant picker use.
import { onBeforeUnmount, ref } from 'vue'
import { prefersReducedMotion } from '../../composables/reducedMotion'

const props = withDefaults(
  defineProps<{
    /** How many pieces. The source's own two settings were 22 for a good run and 40 for a perfect
     *  one; a podium is the perfect one. */
    pieces?: number
  }>(),
  { pieces: 34 },
)

/** THE PALETTE, entirely out of this app's own vocabulary – no new colour is introduced by this
 *  effect. Six is the source's count and the right one: fewer reads as a theme, more as noise.
 *
 *  They are borrowed from four different corners of the token set on purpose. Confetti is cheap
 *  coloured paper, so what it needs is six hues that are far apart and none of which is trying to
 *  mean anything; what this app has is one accent and a lot of semantic colour. Borrowing the
 *  play-style blue and violet and the ledger's green for a decoration does not make a piece of paper
 *  say anything about her forehand or her bank balance – nothing else on this card is those
 *  colours - and it does keep the burst unmistakably part of THIS game rather than a stock effect
 *  dropped into it. */
const PIECE_TOKENS = [
  'var(--accent)',
  'var(--amber)',
  'var(--orange)',
  'var(--style-serve-first)',
  'var(--style-all-court)',
  'var(--money-in)',
] as const

/** How long the whole burst takes: the animation plus the longest start delay, with a beat of slack
 *  so nothing is torn off mid-flight. Mirrors the source's 1200ms + 80ms + margin = 1300ms. */
const BURST_MS = 1300

interface Piece {
  id: number
  style: Record<string, string>
}

// ⭐ U-05 – the app's one reduced-motion predicate (`composables/reducedMotion.ts`), which was this
// expression written out in five places. Read eagerly here for the same reason `shown` is built
// eagerly below: the component is mounted by a `v-if` at the moment of the celebration.
const reduced = prefersReducedMotion()

/** Built ONCE, eagerly, rather than in `onMounted`: the component is mounted by a `v-if` at the
 *  moment of the celebration, so there is no frame in which it should be empty. */
const shown = ref<Piece[]>(
  reduced
    ? []
    : Array.from({ length: props.pieces }, (_, i) => ({
        id: i,
        style: {
          left: `${50 + (Math.random() * 46 - 23)}%`,
          background: PIECE_TOKENS[i % PIECE_TOKENS.length],
          '--dx': `${Math.random() * 220 - 110}px`,
          '--dy': `${160 + Math.random() * 260}px`,
          '--rot': `${Math.random() * 720 - 360}deg`,
          'animation-delay': `${Math.random() * 0.08}s`,
        },
      })),
)

// The source removes each piece on its own timer; one timer for the whole burst is the same result
// with one handle to cancel, which is what an unmount needs.
const timer = shown.value.length
  ? setTimeout(() => {
      shown.value = []
    }, BURST_MS)
  : null
onBeforeUnmount(() => {
  if (timer !== null) clearTimeout(timer)
})
</script>

<template>
  <!-- Decoration, and it says so: no text, no role, and out of the reading order entirely. The
       poster underneath already names the result in words. -->
  <div v-if="shown.length" class="tb-confetti" aria-hidden="true">
    <span v-for="p in shown" :key="p.id" class="tb-confetti-piece" :style="p.style"></span>
  </div>
</template>

<style scoped>
/* Fills whatever it is dropped into, clips the fall at that box, and is never a click target.
   `border-radius: inherit` so a piece cannot ride outside a rounded card's corner. */
.tb-confetti {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
}

/* The source's own geometry: 9x14 with a 2px round, which at this size reads as a scrap of paper
   rather than a dot or a bar. `--radius-paper` is the ladder's 2px rung and is exactly that idea. */
.tb-confetti-piece {
  position: absolute;
  top: 0;
  width: 9px;
  height: 14px;
  border-radius: var(--radius-paper);
  opacity: 0.95;
  animation: tb-confetti-fall 1.2s ease-in forwards;
}

@keyframes tb-confetti-fall {
  to {
    transform: translate(var(--dx), var(--dy)) rotate(var(--rot));
    opacity: 0;
  }
}
</style>

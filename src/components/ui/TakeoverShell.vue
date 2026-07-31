<script setup lang="ts">
// THE FULL-SCREEN TAKEOVER, as one component (owner, 30.07: «Есть четвёртое место, где живёт
// просмотрщик матча - надо все одинаково сделать оверлеем поверх всего экрана ... Будет один
// компонент и без ненужных дублей кода»).
//
// WHAT IT IS. The three-part stack every match surface in this app already assumed and every one of
// them spelled out by hand: a page-coloured layer pinned over the whole app, a header that does not
// scroll, and a scrolling body under it. `ScreenShell` is the same idea for a TABBED screen; this is
// the idea for a screen that COVERS the tabs.
//
// WHY IT HAD TO BE A COMPONENT, and it is not "four copies is untidy". MatchViewer is mounted in
// FOUR places. Three of them (TournamentFlow, PracticeFlow, MatchReplay) wrote out
// `.tournament-flow` / `.tf-top` / `.tf-body` by hand and agreed. The fourth - SeasonScreen's
// sandbox exhibition - was INLINE ON A TABBED SCREEN, and that difference was a measurable bug, not
// a style preference: on a tabbed screen the DOCUMENT is the scrollport, so the viewer's
// `position: sticky; bottom: 0` control bar pinned to the bottom of the VIEWPORT, and the app's
// `position: fixed` tab bar owns y=760..812 there. Measured at 375x812 with the box score on screen:
// the bar sat at y=736.5..791.5 and 31.5 of its 55px were behind the tab bar - `elementFromPoint` at
// the bar's own bottom edge returned `.tab-icon`, so the lower half of both segmented plates could
// not be tapped at all. Inside this shell the scrollport is `.tf-body` and the tab bar is covered,
// so the bar pins against the bottom of the body and nothing is over it. Four copies of a layout,
// three of which agree, is exactly how the fourth came to disagree.
//
// WHAT IT DELIBERATELY DOES NOT OWN:
//   * THE EXIT. It is a SLOT, because the four surfaces mean four different things by it and that
//     difference was hard-won ("To result →" leaves one match for its box score; "Skip all rounds →"
//     resolves the whole remaining draw; a close dismisses a screen that decided nothing; a finished
//     friendly's box score offers nothing here at all, because its own "Done" is the way out). One
//     button with four meanings would be the regression, not the tidy-up.
//   * `mode`. Whether a match is LIVE or a REPLAY is a fact about the match, not about the box it is
//     drawn in - it stays MatchViewer's prop. The sandbox exhibition is genuinely generated at click
//     time and keeps `mode="live"`; the other three replay a match the engine had already resolved.
//   * ANY STYLE OF ITS OWN. Same precedent as `SegmentedRow`, and for the same reason: the takeover
//     vocabulary in `src/style.css` is SHARED - `.tournament-flow` sits in a selector list with
//     `.splash` and `.onboarding`, and `.tf-body` with `.onboarding-body`. Re-homing those rules here
//     would break two screens that are not match screens to tidy up four that are.
import { ref } from 'vue'
import { useScrollReset } from '../../composables/scrollReset'

const props = withDefaults(
  defineProps<{
    /** The header's title line, or `null` for no header at all (the tournament's own E brief draws
     *  the tier on its hero and wants nothing above it).
     *
     *  ⚠ REQUIRED AND NULLABLE RATHER THAN OPTIONAL, ON PURPOSE. A missing title would silently mean
     *  "no header", which is the same trap `MatchViewer.mode` fell into when it defaulted to `'live'`
     *  and shipped a blinking Live badge onto three replays. A caller has to say which it wants. */
    title: string | null
    /**
     * WHICH SCREEN IS IN THE BODY RIGHT NOW - any value that changes when the answer does (owner,
     * 31.07: «after a transition between screens, always land at the top of the new screen»).
     *
     * A takeover holds several screens in one scroller: the tournament walks a brief, a pre-match
     * card, the live match, a box score and a poster through this same `.tf-body`, which is never
     * unmounted between them - so each one inherited the last one's scroll position. The shell
     * cannot work out on its own that the slot content became a different screen, and a caller
     * always can, so it is told.
     *
     * ⚠ OPTIONAL, WHERE `title` IS DELIBERATELY NOT, and the difference is what the default MEANS.
     * A missing `title` would silently claim "this screen wants no header", which is a decision.
     * A missing `screen` claims only "I am one screen" - true of MatchReplay and of the Season
     * sandbox, both of which mount a fresh shell (and therefore a fresh, unscrolled `.tf-body`)
     * every time they open. There is no wrong answer to inherit here, only a no-op.
     */
    screen?: string | number | null
  }>(),
  { screen: null },
)

// The scroller is the shell's, so putting it back at the top is the shell's job - a caller that had
// to reach for `.tf-body` itself would be four callers reaching into one component's DOM.
const bodyRef = ref<HTMLElement | null>(null)
useScrollReset(() => props.screen, bodyRef)
</script>

<template>
  <div class="tournament-flow">
    <header v-if="title !== null" class="tf-top">
      <div>
        <div class="tf-title">{{ title }}</div>
        <!-- The date / surface / round line under the title. Only drawn when a caller fills it, so a
             surface with nothing to say there does not pay 4px of margin for an empty box. -->
        <div v-if="$slots.sub" class="tf-sub"><slot name="sub" /></div>
      </div>
      <!-- THE HEADER'S ONE SLOT. One control, filled by the caller - see the note above for why this
           is not a prop. `.tf-top` is `justify-content: space-between`, so an empty slot simply
           leaves the title alone on the line (which is what a finished friendly wants). -->
      <slot name="exit" />
    </header>
    <!-- THE SCROLLER, and it is the whole point of the refactor. `.tf-body` is `flex: 1;
         overflow-y: auto`, so it is a real scrollport: a sticky child pins against ITS bottom edge
         rather than the viewport's, and no fixed app furniture is in front of it. -->
    <div ref="bodyRef" class="tf-body"><slot /></div>
  </div>
</template>

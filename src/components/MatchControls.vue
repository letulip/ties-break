<script setup lang="ts">
// THE MATCH TRANSPORT – the pinned bar at the foot of the match screen, as a PROP-DRIVEN LEAF
// (R2-11: "prop-driven controls/readout"; TOK-08: "make leaf children prop/emit driven when
// touched; keep screens/App as store-aware composition roots").
//
// -------------------------------------------------------------------------------------------------
// WHY IT IS ITS OWN COMPONENT
// -------------------------------------------------------------------------------------------------
// MatchViewer owned the transport AND the display: the same script that walked the timeline also
// held the two segmented adapters, the skip link, the shout row and the finished bar, reaching
// straight into `viewMode` and `speed` because they happened to be in scope. Nothing here needs to
// know that a timeline exists. It takes the two settings as values, says when the player changed
// one, and says which of the four things the player pressed – so the screen keeps ONE job (drive the
// match) and the bar keeps the other (ask the player questions about it).
//
// ⚠ NOTHING ABOUT WHAT THE PLAYER SEES OR HEARS MOVED. Every comment below is the viewer's own,
// carried verbatim, including the owner's rulings on the sticky bar, on where Skip went and on the
// finished bar's two tracks. The click sounds are in the same statement order they always were: the
// two plates write the setting and THEN click; Skip clicks and THEN writes.
//
// ⚠ AND THAT LAST ORDERING IS PRESERVED BY CONSTRUCTION, NOT BY A TEST – stated because the opposite
// is easy to assume. `tests/component/match-viewer-parity.test.ts` records the run one PAINT at a
// time, so two effects inside a single click handler are ordered but indistinguishable to it:
// swapping them was tried as a mutation arm and the record stayed byte-identical, correctly, because
// the setting's own consequence (`watch(viewMode)` -> retimeForMode) is a pre-flush watcher and does
// not run until after the handler returns either way. An equivalent mutant, not a hole. What the
// record DOES pin is which cue fired on which paint, and that caught every other arm.
import { computed } from 'vue'
import { playSfx } from '../audio/sfx'
import type { ViewMode } from '../viz/types'
import type { MatchSpeed } from '../composables/matchDefaults'
import PrimaryPill from './ui/PrimaryPill.vue'
import SegmentedRow from './ui/SegmentedRow.vue'

const props = defineProps<{
  /** how much of the match to watch – 'skip' is reachable from here but is not one of the pills */
  view: ViewMode
  speed: MatchSpeed
  /** has playback reached the end? The bar swaps its contents and stays where it is. */
  finished: boolean
  /** ⚠ THE SHOUT IS A LIVE-MATCH CONTROL ONLY. docs/specs/ui-inventory §2: the replay "IS the live
   *  match minus the blinking Live and minus shouting" (owner again, 30.07). */
  live: boolean
  /** the pool the picker offers – owned by the viewer, because it is COPY and not a control */
  phrases: readonly string[]
  shoutPhrase: string
  /** the label of the button that leaves the match, or null when there is nowhere to proceed to */
  proceedLabel: string | null
}>()

const emit = defineEmits<{
  'update:view': [ViewMode]
  'update:speed': [MatchSpeed]
  'update:shoutPhrase': [string]
  shout: []
  restart: []
  proceed: []
}>()

// --- controls: the app's segmented row rather than two <select>s -------------------------------
// SegmentedRow speaks in VALUES; speed is a number, so this is the one adapter between them (the
// same shape BracketTabs uses for round ids).
//
// ⚠ TWO OPTIONS, NOT THREE: 'skip' LEFT THIS SWITCH ON 06.08 (owner: «а skip оттуда из этого
// переключателя вообще надо убрать – оно полностью матч пропускает, это вообще неявно в этом
// месте»). Full and Key are RESOLUTIONS - two answers to "how much of this match do I watch", and
// either one leaves you watching. Skip ends the watching. A segmented control says "these are the
// same kind of thing, pick one", and it was saying it about a control that closes the match: the
// third pill of a settings plate is the last place a player expects to lose the whole match, and
// he lost one to it.
// THE CAPABILITY IS UNTOUCHED - `viewMode` still takes 'skip' and every path that reads it
// (resetPlayback -> jumpToEnd, retimeForMode's exemption, More's default-view picker) is exactly as
// it was. What moved is the door: `.mv-skip` below, which says what it does out loud.
const VIEW_OPTIONS = [
  { value: 'full', label: 'Every point', short: 'Full' },
  { value: 'key', label: 'Key points only', short: 'Key' },
] as const
const SPEED_OPTIONS = [
  { value: '1', label: 'Normal speed', short: '1×' },
  { value: '2', label: 'Double speed', short: '2×' },
  { value: '4', label: 'Quadruple speed', short: '4×' },
] as const

const viewSeg = computed({
  get: () => props.view as string,
  set: (v: string) => {
    emit('update:view', v as ViewMode)
    playSfx('clickSoft')
  },
})
const speedSeg = computed({
  get: () => String(props.speed),
  set: (v: string) => {
    emit('update:speed', Number(v) as MatchSpeed)
    playSfx('clickSoft')
  },
})
/** The picker writes upward; the pool and the log it lands in are the viewer's. */
const shoutPhrase = computed({
  get: () => props.shoutPhrase,
  set: (v: string) => emit('update:shoutPhrase', v),
})

/**
 * SKIP TO THE RESULT - the capability the third pill used to carry, as an action that names itself.
 *
 * It sets exactly the same ref the pill set, so `retimeForMode`'s "'skip' is not a position" branch,
 * `resetPlayback`'s jump and the silence of `jumpToEnd` are all reached by the same road they always
 * were. What is different is only what the player is looking at when they take it: a link that says
 * where it goes, under the two plates rather than inside one of them.
 *
 * A player who has set Skip as their DEFAULT view (More -> match settings) opens straight onto the
 * finished match, so this control is already spent and hides itself with `finished` - and the two
 * pills sit unselected, which is the honest reading of "you asked not to watch this one". Pressing
 * either starts the walk, through the same out-of-skip path as before.
 */
function skipToResult(): void {
  playSfx('clickSoft')
  emit('update:view', 'skip')
}
</script>

<template>
  <!-- ===== CONTROLS =======================================================================
       The two <select>s became the app's segmented control (U0 SegmentedRow) - the same plate
       the draw's round switcher uses, so "how much to watch" and "how fast" read as controls
       rather than as a form.
       PINNED, NOT FIXED (owner, 30.07). A fixed bar would cost its height off the top of every
       match screen for the whole watch; sticky costs NOTHING until the bar would otherwise be
       off the bottom, and then it is there. See `.mv-controls` for the measurement. -->
  <!-- ⚠ AND ONCE THE MATCH IS OVER THE BAR SWAPS ITS CONTENTS AND STAYS WHERE IT IS - the owner's
       R17 #10 ruling and his correction to how it landed, both quoted in full on the script side
       (house convention: his words live where Cyrillic is allowed) at the `proceedLabel` prop.
       The plates are questions about a match in PROGRESS - how much of it to watch, how fast -
       and a finished match has no answer to either. What is left is the two things she can do
       with a match she has just watched, side by side, in the row that was already there:
       watch it again, or go on. The affirmative is last, which is the app's own order
       (`.dialog-actions` is Cancel-then-Confirm; pinned in tests/ui-control-system.test.ts).
       The two callers with nowhere to proceed to pass no label and keep the plates, because for
       them there is no third thing this bar could say. -->
  <div v-if="finished && proceedLabel" class="mv-controls mv-controls-done">
    <PrimaryPill class="sfx-watch" variant="ghost" @click="$emit('restart')">Watch again ↻</PrimaryPill>
    <PrimaryPill class="sfx-watch" @click="$emit('proceed')">{{ proceedLabel }}</PrimaryPill>
  </div>
  <div v-else class="mv-controls">
    <SegmentedRow
      v-model="viewSeg"
      class="mv-seg"
      :options="VIEW_OPTIONS"
      group-label="How much of the match to watch"
    />
    <SegmentedRow v-model="speedSeg" class="mv-seg" :options="SPEED_OPTIONS" group-label="Playback speed" />
    <!-- ⚠ SHOUT IS IN THE PINNED BLOCK (owner, 30.07: keep the shout button in the sticky block on the live match screen). It used to sit below the bar in `.mv-actions`, on the
         argument that the bar carries SETTINGS and this is an ACTION - and the argument was wrong
         about this one button. Shouting at your kid is the thing you would reach for mid-rally,
         which is the same test that pinned the speed and the view; leaving it outside meant the
         one control the player might actually want during a point was the one that scrolled away
         as the log filled. It takes a SECOND ROW of the bar rather than squeezing the two plates
         onto a third of it - see `.mv-shout`, and the measurement of the attempt that did squeeze
         them.
         ⚠ AND IT IS A REAL CONTROL NOW, NOT A DISABLED PLACEHOLDER (owner, 30.07: put a set of phrases in a dropdown with a button beside it - pick one, shout it). It read
         "Shout 📣", disabled, `title="Coming in Phase 6"`; it is a phrase picker and the same
         verb beside it, and pressing it puts the line in the log. What it does NOT do is touch
         the match - see `SHOUT_PHRASES` for why that is the only thing it could do and why no
         label here promises or denies an effect.
         ⚠ THE PICKER IS A NATIVE `<select>`, AND THAT IS A FINDING RATHER THAN A CHOICE. This app
         has a control system and it has NO dropdown component: `src/components/ui/` holds eleven
         components and none of them is one, `SegmentedRow` cannot take six phrases on a 327px bar
         (its three `short` labels already needed their padding trimmed to fit), and the only
         designed dropdown in the app is `.ob-select-wrap` in OnboardingWizard - a labelled box
         with an icon and a chevron, scoped to that screen, built around a real `<select>` with
         its chrome turned off. What `src/style.css` DOES declare, in the same rule as the text
         input, is a plain `select` skin, and this is its first live consumer. A native select is
         also the only version that opens the phone's own picker. So: no seventh control shape
         invented, no premature component for one caller. The extraction point, if a second caller
         ever appears, is OnboardingWizard's box - and it should take that box, not this one.
         The gate is the Live badge's own: ui-inventory §2 says the replay "IS the live match minus
         the blinking Live and minus shouting", and the owner said it again on 30.07 (there is no Shout on a replay at all - it need not even be shown, same principle as live). After this
         round three of the four callers are replays, so this is a Season-sandbox control. -->
    <div v-if="live && !finished" class="mv-shout">
      <select v-model="shoutPhrase" class="mv-shout-pick" aria-label="What to shout">
        <option v-for="phrase in phrases" :key="phrase" :value="phrase">{{ phrase }}</option>
      </select>
      <button class="mv-shout-go" @click="$emit('shout')">Shout 📣</button>
    </div>
    <!-- ⚠ WHERE "Skip" WENT (owner, 06.08). It was the third pill of the view plate, beside Full
         and Key, and it does not belong in a switch: those two are resolutions and this one ends
         the match. It is a LINK, not a pill and not a button plate, and that is deliberate on two
         counts - it reads as a way OUT rather than as a setting, and a text row costs ~22px of a
         phone where a third plate row would have cost ~53 on a screen the same owner has twice
         asked to give its height to the court and the log. Same shape as the log's own
         "Show more ⌄" a few lines up, which is the app's existing vocabulary for this weight of
         control. Hidden once the match is over, because there is nothing left to skip. -->
    <button v-if="!finished" class="link mv-skip" @click="skipToResult">Skip to the result</button>
  </div>
</template>

<style scoped>
/* THE PINNED CONTROL BAR (owner, 30.07: «maybe we need to make lower buttons on match screen fixed
   so we could use them anytime?»).
   ⚠ STICKY, NOT FIXED, AND THE MEASUREMENT IS THE ARGUMENT. On a 375pt phone the takeover's scroller
   is 737px; the panel + log + this row + the actions come to ~590px, so at the first point the row
   is already on screen at y=636 and needs no help. Four beats later the log is 220px tall and the
   row has been pushed to y=806 - off the bottom, which is the bug he hit. A FIXED bar would have
   fixed that by taking ~53px off the scroller permanently, for the whole watch, including the
   first point when nothing was wrong; sticky takes NOTHING until the row would otherwise be gone,
   and then puts it exactly where a fixed bar would have been. Same recovery, none of the rent.
   The floor is opaque so the log passes UNDER the bar rather than through it, and it
   is the tone of whatever the viewer is standing on, so the plate is invisible until it pins.
   ⚠ THAT TONE CHANGED WITH THE OUTER FRAME, 30.07. It was `--panel`, because all three match screens
   used to put the viewer inside a `--panel`-toned `.tf-card`; the owner has now taken that frame off
   («давай внешний контур уберем»), so the ground under the viewer is the takeover's own page colour
   and the floor follows it to `--bg`. Leaving it at `--panel` would have drawn exactly the seam this
   line used to warn about, with the two tones swapped. The same move is why the segmented plates
   below are visible at all now: `--panel` on `--bg` reads as a plate, which is what SegmentedRow's
   default `page` tone is for and what it could not do inside a panel of the same colour.
   The negative margin eats `.mv-below`'s 10px gap and the top padding pays it back, so the plate is
   flush against the log instead of leaving a 10px slot for text to show through; the 8px underneath
   is the only height this costs, and the head row it replaced gave back 34.
   ⚠ IT IS TWO ROWS NOW, because "Shout" joined it (owner, 30.07: «на экране live матча кнопку shout
   тоже надо оставить в sticky блоке»). Three controls do not fit one 327px line - the two segmented
   plates alone want ~275px at this bar's trimmed pill padding and the button is another ~110 - so the
   shout takes a second row inside the SAME sticky block, which is the whole of what he asked for.
   ⚠ AND THAT IS WHY THIS IS A GRID AND NOT A FLEX ROW ANY MORE, which is worth writing down because
   the obvious flex answer is wrong in a way that LOOKS right. `flex-wrap: wrap` plus `flex: 0 0 100%`
   on the button does force a second line - but only while nothing clamps it, and clamping is exactly
   what "own row, own width, centred" needs. `max-width: max-content` feeds into the flex item's
   HYPOTHETICAL main size, so the browser sizes the button at ~109px BEFORE deciding where lines break,
   finds it fits beside two zero-basis plates, and puts all three on one line: measured 327px wide, 59px
   tall, and the two plates squeezed to 109px each. Grid decides rows from the template instead of from
   the items, so `grid-column: 1 / -1` is a row no matter how wide its content is. */
.mv-controls {
  /* ⚠ `flex: none` MOVED IN WITH THE MARKUP (R2-11). It used to be one clause of the viewer's
     `.mv-panel, .mv-controls, .mv-actions` rule, and a parent's scoped selector reaches a child's
     ROOT but nothing under it - so leaving it there would have worked by an accident of Vue's scope
     inheritance and broken the day this bar grew a wrapper. It is stated where its element is.
     Everything it says is the viewer's own: in a height deficit the bar must not give ground
     alongside the log it is framing. */
  flex: none;
  position: sticky;
  bottom: 0;
  z-index: 2;
  display: grid;
  /* Two equal tracks for the two plates. `minmax(0, ...)` rather than a bare `1fr`, so a pill row
     that overflows shrinks its track instead of pushing the grid wider than the bar. */
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: -10px;
  padding: 10px 0 8px;
  background: var(--bg);
}

/* R17 #10: THE FINISHED BAR IS THE SAME BAR, and it keeps every geometric property of the one it
   replaces - same sticky floor, same negative margin against the log, same `--bg` skirt - because
   the guarantee the wrapper above provides is about `.mv-controls`, and swapping the class would
   have handed the pinned bar's proof to a second selector nobody had measured.
   ⚠ AND IT IS THE BASE'S OWN TWO TRACKS NOW (owner, 12.08: «2 кнопки рядом просто в этом нижнем
   блоке с контролами и все: Watch again | Proceed»). This rule used to collapse them to a single
   full-width cell for one Proceed; two buttons is exactly what `repeat(2, minmax(0, 1fr))` already
   describes, so what the finished bar needs from this selector is nothing at all - it only has to
   stop overriding. The two plates and these two buttons now stand on the same pair of tracks, which
   is also why nothing shifts sideways when the match ends. */
.mv-controls-done > * {
  width: 100%;
}

/* The plates were `flex: 1` when this was a row; the tracks size them now. `min-width: 0` stays -
   it is what lets a plate's own contents shrink rather than overflow. */
.mv-seg {
  min-width: 0;
}

/* THE SHOUT, ON ITS OWN ROW OF THE PINNED BLOCK: full width of the bar as a CELL. `grid-column` is
   what the flex version could not express - see the note on `.mv-controls` for the measurement of the
   attempt that put all three controls on one line.
   ⚠ IT IS THE ROW NOW, NOT THE BUTTON (30.07). `.mv-shout` used to BE the disabled button, centred in
   its cell with `justify-self`; it is the picker plus the verb, so it is a flex row filling the cell
   and the centring is gone with the empty space it used to leave. The grid template above is
   untouched: two tracks for the two segmented plates, and this spans both. */
.mv-shout {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* THE PHRASE PICKER. It wears the app's own `select` skin from src/style.css (declared in the same
   rule as the text input, and this is its first live consumer - see the template note). Two local
   adjustments, both of them about THIS bar rather than about selects:
     * it takes the row's spare width, and `min-width: 0` is what lets it shrink instead of pushing
       the bar wider than the takeover's 327px;
     * `--panel` instead of the skin's `--bg`, because the bar's own floor IS `--bg`. On the floor a
       `--bg` field reads as a hole with a hairline round it, while the two segmented plates beside it
       are `--panel` on `--bg` and read as plates. Same tone, so the second row of the bar looks like
       the first. Precedent: the pill padding below is trimmed for this bar alone in exactly this way,
       and the shared rule stays shared. */
.mv-shout-pick {
  flex: 1;
  min-width: 0;
  background: var(--panel);
  /* Measured at 375pt: the select came out 36px tall beside a 41px button, because the two shapes
     resolve their content height off different metrics (a button's line box, a select's UA control
     height) from the same 8px padding. Stretching is the fix that survives a font change, where
     hard-coding 41px would not. */
  align-self: stretch;
}

.mv-shout-go {
  flex: none;
}

/* "Skip to the result" - a row of the pinned block, and a LINK rather than a plate. See the
   template note: it is a way out, not a setting, and a text row is ~22px where a third plate row
   would have been ~53 on the screen the owner has twice asked to give its height back. */
.mv-skip {
  grid-column: 1 / -1;
  justify-self: center;
  margin-top: 2px;
  text-decoration: none;
  font-weight: 600;
}

/* ⚠ "Skip" USED TO RENDER AS "Ski", AND THE SPEED PLATE SAT ON TOP OF IT. The two rows want
   ~359px of pill between them at the shared `.tab-pill` padding of 16px a side; inside a .tf-card
   on a 375pt phone they got 293px, so the view row overflowed its half and painted over its
   neighbour. The padding is the only thing here that was negotiable - the labels are already the
   `short` forms - so it is trimmed for THIS bar alone. The sheet's own 16px is untouched, and so is
   every other SegmentedRow (the draw's round tabs have room for theirs).
   ⚠ STILL NEEDED AFTER THE OUTER FRAME CAME OFF (30.07), and it is worth writing the arithmetic down
   rather than re-deriving it next time: the bar is 327px wide now instead of 293, and 327 is still
   short of the 359 the sheet's padding wants. What the extra 34px bought is HEADROOM - the trim
   brings the two rows to ~275px, so they now clear the bar by 52px instead of overflowing it.
   ⚠ AND THAT HEADROOM IS WHAT THE OWNER WAS LOOKING AT, 31.07: «the speed and brevity buttons are
   bunched to the left of their plates - distribute them evenly across the plate, and make it tidy».
   `.tab-row` is a plain flex row and `.tab-pill` is content-sized, so the 52px the trim recovered
   became 26px of empty plate at the RIGHT-HAND END of each of the two rows - the pills sat left, the
   plate ran on past them, and the two rows did not even end in the same place because "Full/Key/Skip"
   and "1x/2x/4x" are different widths. `flex: 1` hands each plate's width to its own three pills, so
   they divide it evenly and both rows end where the plate ends.
   THE PADDING TRIM STAYS, and it is doing a different job now. `flex: 1` is `1 1 0%`, and a flex
   item's automatic minimum size is its CONTENT size - so the padding no longer sets the pill's width
   but still sets the width below which it will not shrink. At the sheet's 16px that floor is the
   ~359px that overflowed in the first place; at 9px it is ~275px, comfortably inside any phone this
   app targets. Trimmed padding is what keeps `flex: 1` from being a lie on a narrow screen.
   SCOPED TO THIS BAR, like the padding above it and for the same reason: `.tab-row`/`.tab-pill` are
   shared vocabulary with five callers, the draw's round tabs deliberately opt their pills OUT of
   flexing (`.bt-tabs :deep(.tab-pill) { flex: 0 0 auto }` - they scroll horizontally), and Stats and
   Money are not this slice's screens to move. */
.mv-controls :deep(.tab-pill) {
  flex: 1;
  padding-left: 9px;
  padding-right: 9px;
}
</style>

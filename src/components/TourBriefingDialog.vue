<script setup lang="ts">
// ⭐ ROUND-18 #8 – THE BRIEFING. The owner, verbatim: «Надо перед началом сезона больших призов и
// чемпионатов присылать какое-то мне кажется уведомление или попап вообще на экране жёстко
// показывать что она реально должна там участвовать что есть такой регламент и всё такое».
//
// ⚠⚠ THE REGULATION ALREADY EXISTED AND IS HIS OWN (W3-ACT2 §6). `engine/world/mandatory.ts` binds
// the regime by rank, a skipped mandatory writes a zero into one of her counting slots, and the desk
// warns per event at its entry deadline. Nothing needed inventing. What was missing is that
// `mandatoryBindsRank` was read by engine internals ONLY: a career climbed past the threshold, the
// tour became compulsory from that week, and the first the player heard of it was an invoice at a
// deadline. Forced entries, constant losses, and nobody ever having told him the rule – that is what
// made his season feel like a trap, and this popup is the missing sentence rather than a new system.
//
// ⚠ IT IS SHOWN ONCE PER CAREER, AND THE WATERMARK IS THIS COMPONENT'S OWN. The engine has nothing
// to wait for here – no decision, no command, no state that changes when it is read – so this is
// deliberately NOT one of the five blocking questions in `composables/blockingOverlay.ts`. It renders
// behind every one of them (App.vue's `showTourBriefing`) and retires itself with a per-career
// localStorage watermark, the same shape the injury report, the news feed, the trophy cabinet and
// the This-week dot all use. That is what let this ship with no save-schema change at all.
//
// ⚠ AND THE WATERMARK IS HERE RATHER THAN IN App.vue ON PURPOSE, which is a departure from where the
// injury report keeps its one. App.vue is never mounted by any test in this repo – every claim about
// it is a SOURCE PIN, and CLAUDE.md is explicit that a source pin "breaks on contact with a refactor
// and proves nothing about behaviour". "Appears exactly once and does not reappear" is the whole of
// this item, so it has to be a claim a MOUNTED test can make: mount, read, press Continue, mount
// again against the same career and get nothing. It can only be that if the component owns the
// record. App's gate is then pure ORDERING (which popup outranks which) and cannot double-answer it.
//
// ⚠ AN UNKNOWN WATERMARK IS AN UNBRIEFED PLAYER – the same asymmetry `injuryReported` records in
// App.vue, and here it is the point rather than a default. Every save that ALREADY binds (his own
// does: she has been inside the top 50 for seasons) has no stored watermark, so the briefing lands
// once on the next launch and then never again. Showing it twice would cost a tap; never showing it
// is the item.
//
// ⚠ THE COPY COMES OFF THE SNAPSHOT, NOT OUT OF THIS FILE, and here that is the load-bearing rule
// rather than a convention. Every number in the briefing is read from `ECONOMY.mandatory` and the
// calendar's own anchor weeks by `buildTourBriefing`; a sentence typed into this template could go
// on saying "the top 50" long after the economy said something else, and a briefing that drifts from
// the rule it explains is worse than none. `tests/tour-briefing.test.ts` mutates the economy and
// watches every sentence move; this component owns no words with a number in them.
//
// ⚠ THE REGISTER IS THE RULING, AND IT IS NOT THIS FILE'S TO CHANGE. «Мы ни за что не наказываем»:
// the TOUR has rules, the GAME has none. Nothing here leans on the player, nothing tells him what she
// ought to do, and a penalty is a price she chose to pay – the same voice `engine/offers.ts` sets
// above `raiseMandatoryDueLetter`. The briefing's last line says so out loud, and it is the engine's.
import { computed, ref, watch, useTemplateRef } from 'vue'
import { useGameStore } from '../stores/game'
import { useDialogFocus } from '../composables/dialogFocus'
import { playSfx } from '../audio/sfx'
import { weekLabel } from '../shared/dates'
import { tourBriefedKey } from '../composables/tourBriefing'
import Eyebrow from './ui/Eyebrow.vue'
import PrimaryPill from './ui/PrimaryPill.vue'

const emit = defineEmits<{ (e: 'continue'): void }>()

const game = useGameStore()

// PER CAREER, mirrored into a ref because localStorage is not a reactive dependency – the same shape
// and the same reason as every other watermark in this app (App.vue's news / This-week / trophy /
// injury notes argue it at length). Re-read on a career switch so one career's acknowledgement can
// never silence another's briefing.
const briefedAt = ref<string | null>(localStorage.getItem(tourBriefedKey(game.snapshot?.careerId)))
watch(
  () => game.snapshot?.careerId,
  (id) => {
    briefedAt.value = localStorage.getItem(tourBriefedKey(id))
  },
)

/** What is on screen: the engine's briefing, unless this career has already read it. One computed,
 *  so there is no second place that could decide the popup is up while the record says it is done. */
const briefing = computed(() =>
  briefedAt.value !== null ? null : game.snapshot?.tourBriefing ?? null,
)

function acknowledge(): void {
  // Guards a double-tap while the parent re-renders – two fast presses on the one button would
  // otherwise emit twice.
  if (briefedAt.value !== null) return
  const at = String(game.snapshot?.week ?? 0)
  // THE RECORD FIRST, then the ref, then the parent. The write is what survives a reload, and it is
  // the only thing that has to happen for the promise "it does not reappear" to hold.
  localStorage.setItem(tourBriefedKey(game.snapshot?.careerId), at)
  briefedAt.value = at
  playSfx('clickSoft')
  emit('continue')
}

// D1 – it is a modal, it says so and it holds the keyboard.
//
// ⚠ AND CONTINUE IS THE ONLY WAY OUT – no scrim click, no Escape, the shape BirthdayDialog argues at
// the top of its own file. The reason is the same one and it is stronger here: this beat happens ONCE
// in a career, and acknowledging it is what retires it for good. A stray tap outside the card, or an
// Escape pressed to dismiss something else, would silently spend the one showing of the rules the
// player has never been told – which is the exact failure this item exists to fix. The wrap-up hands
// Escape to `useDialogFocus` because it can be re-read from the Season screen; there is nowhere else
// this sheet lives, so it is passed no handler.
const card = useTemplateRef<HTMLElement>('card')
useDialogFocus(card)
</script>

<template>
  <!-- No handler on the scrim: reading this is a once-ever beat and a stray tap outside must not
       spend it. See the note above `useDialogFocus` on the script side. -->
  <div v-if="briefing" class="dialog-overlay">
    <div
      ref="card"
      class="dialog-card season-summary tour-briefing"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-briefing-kicker tour-briefing-title"
      tabindex="-1"
    >
      <p id="tour-briefing-kicker" class="season-summary-kicker">
        Tour office · {{ weekLabel(briefing.week) }}
      </p>
      <h2 id="tour-briefing-title" class="season-summary-title">The commitment rules now apply.</h2>

      <!-- The one sentence that names the rule and the standing it starts at. The engine's words:
           the rank threshold in it is ECONOMY.mandatory.maxRank and may not be typed here. -->
      <p class="tour-briefing-lead">{{ briefing.lead }}</p>

      <!-- ⚠ TWO PLAIN SECTIONS ON THE DIALOG'S OWN PANEL, NOT NESTED `Card`s – which is what the
           season wrap-up uses for its tiles, and the departure is deliberate on two counts. A
           briefing is a LETTER: a stack of cards inside a card reads as a dashboard, and this sheet
           is prose with two headings. And a `Card` paints a GRADIENT, whose computed
           `background-color` is `initial`, so text inside one cannot be contrast-measured through the
           real cascade – which would have made the round-17 #3 guard below vacuous on the one dialog
           whose only exit is reading it. -->
      <section class="tour-briefing-block">
        <Eyebrow>What the tour asks for</Eyebrow>
        <ul class="tour-briefing-asks">
          <li v-for="row in briefing.requirements" :key="row.tier" class="tour-briefing-ask">
            <span class="tour-briefing-ask-what">{{ row.ask }}</span>
            <span class="tour-briefing-ask-detail">{{ row.detail }}</span>
          </li>
        </ul>
      </section>

      <!-- WHAT DECLINING COSTS, and the first line is the zero rather than the fine – the tour takes
           a counting SLOT, not points off a total, which is the whole design of the rule. The order
           is the engine's; nothing here re-sorts it. -->
      <section class="tour-briefing-block">
        <Eyebrow>What declining costs</Eyebrow>
        <ul class="tour-briefing-costs">
          <li v-for="cost in briefing.costs" :key="cost">{{ cost }}</li>
        </ul>
      </section>

      <p class="tour-briefing-closing">{{ briefing.closing }}</p>

      <div class="tour-briefing-actions">
        <PrimaryPill @click="acknowledge">Continue</PrimaryPill>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Shares `dialog-overlay` / `dialog-card` / `season-summary*` with the other blocking popups, so the
   scrim, the card and the two heading lines cannot drift apart from them. Only the three text blocks
   are local.

   ⚠ EVERY COLOUR IS A DECLARED APP TOKEN WITH NO FALLBACK – the round-17 #3 lesson, recorded at
   length in BirthdayDialog.vue's own style block. `var(--card, #fff)` shipped four unreadable buttons
   on the one dialog that could not be dismissed, because `--card` is declared nowhere and the
   fallback won. A fallback is only honest when the token is optional; for text that must be read it
   is a second, unreviewed design nobody looks at. `tests/component/tour-briefing.test.ts` measures
   the real contrast ratio through the cascade. */
/* ⚠ ROUND-20 #3 – THE WIDTH IS LOCAL WHILE THE HEIGHT BOUND IS SHARED, AND THE SPLIT IS THE WHOLE
   JUDGEMENT. Owner, 13.08: «на всю ширину экрана телефона и не шире контейнера контента на десктоп».
   HEIGHT is a defect of the shared box – any dialog can outgrow the screen and take its own exit with
   it – so `max-height` / `overflow-y` went onto `.dialog-card` in src/style.css, where the note above
   them records that this is the second surface the same box has eaten. WIDTH is not a defect at all:
   the other nine popups are one to three short paragraphs, 320–360px is the right measure for them,
   and widening all ten would be a redesign of nine surfaces nobody asked for. So the cap that moves
   is this sheet's alone – and `.dialog-card`'s own rule already says as much ("What each surface
   DOESN'T share is its size").
   WHAT WAS WRONG: `.season-summary` caps at 360px, which on the owner's own 576px-wide phone left a
   360px ribbon with 92px of dead scrim down each side, and made a letter that is already long
   1034px tall. `--app-max-width` is his stated bound read literally – the SAME token `#app` uses for
   the content container, named in src/style.css precisely so a second surface could reuse the number
   instead of growing its own (OnboardingWizard.vue is the other one). Measured in Chromium: 343px at
   375, 544px at 576, 880px at 1280 – and the card 1034 -> 724px tall on the desktop width, because
   the two fixes are the same fix from two directions. */
.tour-briefing {
  max-width: var(--app-max-width);
}

.tour-briefing-lead {
  margin: 10px 0 14px;
  font-size: 15px;
  line-height: 1.45;
  color: var(--text);
}

/* A hairline between the sheet's parts and nothing else – the app's one stroke weight
   (`tests/ui-control-system.test.ts`: nothing is outlined with more than a hairline). No fill, so
   the text sits on the dialog's own `--panel` and the contrast measurement is exact. */
.tour-briefing-block {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}

.tour-briefing-asks,
.tour-briefing-costs {
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tour-briefing-ask {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tour-briefing-ask-what {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.tour-briefing-ask-detail,
.tour-briefing-costs li {
  font-size: 12.5px;
  line-height: 1.4;
  color: var(--muted);
}

/* The ruling's own line, and it is set as prose rather than as a footnote: it is the sentence that
   says the game is not asking her for anything. */
.tour-briefing-closing {
  margin: 12px 0 0;
  font-size: 13.5px;
  line-height: 1.45;
  color: var(--text);
}

.tour-briefing-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}
</style>

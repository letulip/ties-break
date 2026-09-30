<script setup lang="ts">
// F2 OF THE FEEDBACK WAVE – THE DIALOG BEHIND THE CONTROL IN MORE (docs/specs/feedback-channel-2026-09.md).
// It shows, in the player's words and BEFORE anything leaves, what a report holds and where it goes, and
// its one action hands the report to `shareReport` (src/feedback.ts, which owns the three transports).
//
// ⚠⚠ THE REPORT IS PREPARED WHEN THE DIALOG OPENS, NEVER WHEN SEND IS PRESSED. `assembleReport()` is a
// worker round trip, and iOS Safari wants `navigator.share` to run inside the tap's user activation with
// no `await` in between – so the call is made from setup, the result waits in `prepared`, and `send()`
// passes THAT object to `shareReport` and reaches it synchronously. Send is disabled until the report is
// there (a fraction of a second), so the player cannot outrun it, and nothing on this card ever asks the
// worker on a tap. tests/component/feedback-f2.test.ts asserts all three halves: one assemble at open,
// the same object on Send, and the share call inside the click with no await before it.
// ⚠ `shallowRef`, NOT `ref`: a deep `ref` would hand `shareReport` a reactive proxy of the report instead
// of the object `assembleReport` returned, and «the prepared report» would be a copy.
//
// ⚠ EVERY SENTENCE ON THIS CARD IS A DRAFT AND NONE OF THEM IS WRITTEN HERE. They are constants in
// src/feedback.ts, tabled in docs/plans/feedback-strings-2026-09.md and held to it by a roundtrip pin, so
// the owner's wording pass edits one file (CLAUDE.md invariant 4). What this file decides is only WHICH
// lines show, and when.
//
// ⚠ THE LIST SAYS WHAT THE REPORT WILL CARRY, so each line reads the same source the report reads: the
// build line from `appBuildLine()` (the Settings footer's own), the error count from the ring, and the
// save line from the prepared report's `file` – null is F1's «no career» sentence, not a claim this card
// invents. The count is read again when the report resolves, so it is the ring the report was made from.
//
// ⚠ A FALLBACK WITH NO FILE CLOSES INSTEAD OF SAYING «ATTACH». The fallback downloads the file and opens
// the mail composer, and the attach sentence tells the player to attach «the save file that was just
// downloaded» – which is false when there was no career and so nothing was downloaded. With nothing left
// for the player to do, the card has nothing left to say.
//
// ⚠ THE DIALOG LAW (CLAUDE.md, round-20 #3). This is a BLOCKING overlay on the shared `.dialog-card`,
// whose height cap and scroller are what keep Close on a 375x667 screen however long a sentence grows.
// Nothing here declares a height or an overflow, so that guarantee is inherited – and the mounted test
// measures it, in the longest state and in the attach state.
//
// ⚠ ESCAPE AND THE SCRIM CLOSE, because closing commits nothing (the ConfirmDialog rule for a card whose
// dismissal is not an answer). Initial focus is Close, the first control in document order – the safe half.
import { computed, ref, shallowRef, useTemplateRef } from 'vue'
import { useDialogFocus } from '../composables/dialogFocus'
import { appBuildLine } from '../composables/buildInfo'
import { errorTail } from '../errorBuffer'
import {
  assembleReport,
  errorCountLine,
  feedbackAddressLine,
  shareReport,
  FEEDBACK_CLOSE_LABEL,
  FEEDBACK_HOLDS_LINE,
  FEEDBACK_LABEL,
  FEEDBACK_PRIVACY_LINE,
  FEEDBACK_SAVE_LINE,
  FEEDBACK_SAVE_PENDING_LINE,
  FEEDBACK_SEND_LABEL,
  REPORT_ATTACH_LINE,
  REPORT_NO_CAREER_LINE,
  type Report,
} from '../feedback'

const emit = defineEmits<{ close: [] }>()

const card = useTemplateRef<HTMLElement>('card')
useDialogFocus(card, () => emit('close'))

/** `ready` is the list and Send; `attach` is what is left after the fallback downloaded the file. */
const stage = ref<'ready' | 'attach'>('ready')
/** The report `assembleReport()` returned – null only for the moment before it resolves. */
const prepared = shallowRef<Report | null>(null)
const sending = ref(false)
const errorCount = ref(errorTail().length)

const buildLine = appBuildLine()
const addressLine = feedbackAddressLine()
const errorLine = computed(() => errorCountLine(errorCount.value))
const saveLine = computed(() => {
  if (prepared.value === null) return FEEDBACK_SAVE_PENDING_LINE
  return prepared.value.file === null ? REPORT_NO_CAREER_LINE : FEEDBACK_SAVE_LINE
})

async function prepare(): Promise<void> {
  let report: Report
  try {
    report = await assembleReport()
  } catch {
    // `assembleReport` catches its own worker failures and never rejects, so this is a seatbelt: a Send
    // that could never enable would be worse than a report with no attachment.
    report = { text: appBuildLine(), file: null }
  }
  errorCount.value = errorTail().length
  prepared.value = report
}
// Started at setup, so the round trip is under way while the player reads the card.
void prepare()

async function send(): Promise<void> {
  const report = prepared.value
  if (report === null || sending.value) return
  sending.value = true
  // ⚠ NO `await` BEFORE THIS CALL (see the header): handed a prepared report, `shareReport` runs to
  // `navigator.share` synchronously, inside the tap.
  const outcome = await shareReport(report).finally(() => {
    sending.value = false
  })
  if (outcome === 'shared') {
    emit('close')
  } else if (outcome === 'fallback') {
    if (report.file === null) emit('close')
    else stage.value = 'attach'
  }
  // 'nothing': the player dismissed the share sheet – nothing was sent or downloaded, so the card stays
  // exactly as it was and Send is pressable again.
}
</script>

<template>
  <div class="dialog-overlay" @click.self="emit('close')">
    <!-- role/aria-modal on the CARD, `tabindex="-1"` for the trap's landing place and the title names it –
         the four lines every dialog in the app carries (R2-07). -->
    <div
      ref="card"
      class="dialog-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-dialog-title"
      tabindex="-1"
    >
      <p id="feedback-dialog-title" class="dialog-title">{{ FEEDBACK_LABEL }}</p>
      <template v-if="stage === 'ready'">
        <p class="feedback-lead">{{ FEEDBACK_HOLDS_LINE }}</p>
        <ul class="feedback-holds">
          <li>{{ buildLine }}</li>
          <li>{{ errorLine }}</li>
          <li>{{ saveLine }}</li>
        </ul>
        <p class="hint">{{ addressLine }}</p>
        <p class="hint">{{ FEEDBACK_PRIVACY_LINE }}</p>
      </template>
      <p v-else class="dialog-message">{{ REPORT_ATTACH_LINE }}</p>
      <!-- Close is written FIRST, so it takes the initial focus: a player who presses Enter before reading
           closes the card rather than opening a share sheet. -->
      <div class="dialog-actions feedback-actions">
        <button @click="emit('close')">{{ FEEDBACK_CLOSE_LABEL }}</button>
        <button v-if="stage === 'ready'" class="primary" :disabled="prepared === null || sending" @click="send">{{ FEEDBACK_SEND_LABEL }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Local to this dialog: the card holds a short list where the shared dialog holds one message. */
.feedback-lead {
  margin: 0 0 6px;
  font-size: 14px;
}

.feedback-holds {
  list-style: none;
  margin: 0 0 12px;
  padding: 0;
  font-size: 14px;
}

.feedback-holds li {
  margin: 4px 0;
}

.feedback-actions {
  margin-top: 12px;
}
</style>

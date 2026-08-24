<script lang="ts">
// ⚠ MODULE SCOPE, AND IT HAS TO BE A SECOND BLOCK. Everything inside `<script setup>` is the setup
// FUNCTION's body and runs once per instance, so a counter declared there would be 1 for every
// confirm in the document – which is the collision it exists to prevent. See `messageId` below.
let messageSeq = 0
</script>

<script setup lang="ts">
// Package K2 – tiny reusable confirm overlay. Callers own the "why" (message text)
// and the "what happens" (the @confirm handler); this component only owns the popup.
//
// ⭐⭐ R2-07 – AND IT IS THE SHELL'S FOURTH TENANT NOW. It was one of D1's roleless overlays: eight
// callers put it in front of the app's irreversible presses (sign a letter, delete a career, delete
// a save, withdraw an entry, hire and fire a coach, overwrite an import) and `getByRole('dialog')`
// found nothing while any of them was open. InboxSheet's own header records what that cost one door
// along: the sign confirm "could not be scoped by dialog either", so two live `Sign` buttons on one
// screen had to be told apart by relabelling the copy.
//
// ⚠ THE SHELL IS SHARED AND THE VOICE IS NOT. Nothing here learns what the eight callers are asking
// – the message and both labels stay props, exactly as they were. What is adopted is `role` +
// `aria-modal` + a name + `useDialogFocus`, i.e. the four things every blocking overlay owes the
// keyboard, and nothing about what this one SAYS.
//
// ⚠⚠ ESCAPE CANCELS, AND IT MAY ONLY EVER CANCEL. This card fronts irreversible acts, so the key has
// to be wired to the half that commits nothing – the same emit the scrim click already sends, so
// there is one way out and not two. Escape mapping to `confirm` would be a delete-career on a stray
// press; Escape mapping to NOTHING would trap the keyboard on a card that a mouse can dismiss by
// clicking beside it. That is the whole reason the policy is per dialog and not per app: the fork
// and the retirement below take no Escape at all, because THEIR dismissal is an answer.
//
// ⚠ INITIAL FOCUS IS CANCEL, and it is a consequence rather than a decision: `useDialogFocus` takes
// the first control in document order and Cancel is written first. Recorded because it is the safe
// half – a player who answers a confirm with the keyboard before reading it backs out of the act
// rather than into it – and because reordering the two buttons would silently move it.
import { useTemplateRef } from 'vue'
import { useDialogFocus } from '../composables/dialogFocus'

withDefaults(
  defineProps<{
    message: string
    confirmLabel?: string
    cancelLabel?: string
    /** Styles the confirm button as destructive (delete-career, delete-slot, ...). */
    danger?: boolean
  }>(),
  { confirmLabel: 'Confirm', cancelLabel: 'Cancel', danger: false },
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()

/** ⚠ PER-INSTANCE, BECAUSE THIS COMPONENT IS NOT A SINGLETON. CoachMarketScreen alone renders five
 *  of these in one template; a fixed `id` would put duplicates in the document the moment two are
 *  ever up together, and a duplicate id makes `aria-labelledby` resolve to whichever came first –
 *  i.e. the wrong question, read out over the right buttons.
 *
 *  ⚠⚠ AND IT IS A MODULE COUNTER RATHER THAN VUE'S `useId`, WHICH WAS MEASURED AND DOES NOT HOLD
 *  HERE. `useId` counts per APP INSTANCE, so two confirms created by two different `createApp`
 *  roots both come back `v-0` – exactly the collision this guards against, and the mounted test in
 *  `tests/component/r2-07-dialog-shell.test.ts` caught it on the first run. A module-scoped counter
 *  is unique per document because there is one module. It is read once in setup, so it is stable
 *  across re-renders, which is the property `aria-labelledby` actually needs. */
const messageId = `confirm-dialog-message-${++messageSeq}`

const card = useTemplateRef<HTMLElement>('card')
useDialogFocus(card, () => emit('cancel'))
</script>

<template>
  <div class="dialog-overlay" @click.self="emit('cancel')">
    <!-- role/aria-modal on the CARD and not on the scrim: the backdrop is not part of the dialog,
         it is what the dialog is over. `tabindex="-1"` is the trap's landing place for a card with
         no enabled control; this one always has two. -->
    <div
      ref="card"
      class="dialog-card"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="messageId"
      tabindex="-1"
    >
      <!-- THE MESSAGE IS THE NAME. It is the only thing on the card that says which question this
           is, and the caller owns every word of it – so the name is the caller's too, and a confirm
           can never be announced as a generic "Confirm". -->
      <p :id="messageId" class="dialog-message">{{ message }}</p>
      <div class="dialog-actions">
        <button @click="emit('cancel')">{{ cancelLabel }}</button>
        <button :class="danger ? 'danger' : 'primary'" @click="emit('confirm')">{{ confirmLabel }}</button>
      </div>
    </div>
  </div>
</template>

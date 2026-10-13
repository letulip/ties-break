<script setup lang="ts">
// Round 51 №11 (13.10) – "What is this ring?", opened from a tap on the chemistry ring of a coach card.
//
// The owner, on item 10: «за 44 недели химия с тренером не сдвинулась ни на одно деление, надо тоже
// проверить там механизм с какой периодичностью у нас пересчет происходит» – and on item 11, which is
// this card: «надо наверное при кликие на химию тренера какой-то небольшой информ попап показывать что
// там вообще, а то этот знак вопроса без движения несколько смущает».
//
// ⚠⚠ THE MECHANISM WAS HEALTHY AND THE PICTURE WAS NOT. Chemistry is recomputed every week a coach is
// hired; his own save held 6.24 after 39 weeks. What he saw was the same «?» for 44 weeks, because the
// ring stays a question mark until the pair clears its OWN reading bar (drawn per pair, median first
// reading at week 21, p90 at week 78 – spec the-chemistry-2026-09.md B12) and a 6% arc is a few pixels.
// And the «?» meant two things the player could not tell apart: «never worked together» and «working,
// not readable yet». This card answers the first question the ring raises, in the game, instead of in
// the owner's head: what it is, that it moves every week, which of the two states THIS coach is in,
// and what firing does to it.
//
// ⚠ THE SHELL IS RankHelpDialog's, ON PURPOSE. Same scrim, same `.guide-card` (whose max-height and
// scroll are round-20 #3's shared bound), same pinned close, the same four accessibility lines and the
// same `useDialogFocus` – a second hand-written popup would be a second answer to «does Escape work
// here». Not one line of the shell is new.
//
// ⚠ IT IS SHORT BECAUSE TourBriefingDialog WAS NOT. One honest sentence at a time made that card taller
// than a phone and stopped a career on it; this one is four lines of copy and the state line is one of
// three. tests/component/r51-chemistry-info.test.ts measures it against 375x667 and was watched failing
// on a too-tall version.
//
// ⚠ THE CARD DERIVES NOTHING ABOUT THE RELATIONSHIP, the screen's own rule (CoachMarketScreen.vue, the
// chemistry block): it is HANDED the state and the figure the row already carries. The state is
// `chemistry` and the wire's `chemistryKnown` read together on the screen; the figure is the one the
// ring speaks. All copy below is a DRAFT for the owner (invariant 4 – the wording is his).
import { computed, useTemplateRef } from 'vue'
import { useDialogFocus } from '../composables/dialogFocus'
import { t } from '../i18n'
import IconButton from './ui/IconButton.vue'

const props = defineProps<{
  /** never – no pair on the books; unread – she has worked with this coach, the reading has not
   *  cleared the pair's bar; read – the ring shows a figure. */
  state: 'never' | 'unread' | 'read'
  /** the figure as the ring speaks it (signed when negative); only read when `state` is `read` */
  figure?: string
}>()
const emit = defineEmits<{ close: [] }>()

// Escape closes, as RankHelpDialog's does: it asks nothing and reports, so the key is the keyboard's
// spelling of the backdrop tap it also has.
const card = useTemplateRef<HTMLElement>('card')
useDialogFocus(card, () => emit('close'))

// One line per state, and each is a different fact about THIS coach – never one sentence with a
// condition in it, which is how the two «?» came to be one.
const stateLine = computed(() => {
  if (props.state === 'read') return t('Right now it reads {0}%.', [props.figure ?? ''])
  if (props.state === 'unread') return t('They have worked together, but it is not readable yet – it needs more time together.')
  return t('She has not worked with this coach yet, so there is nothing to read.')
})
</script>

<template>
  <div class="dialog-overlay" @click.self="emit('close')">
    <div
      ref="card"
      class="guide-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chem-help-title"
      tabindex="-1"
    >
      <IconButton class="replay-close" icon="close" :label="t('Close')" :title="t('Close')" @click="emit('close')" />
      <p id="chem-help-title" class="guide-title">{{ t('Chemistry') }}</p>
      <p class="hint">{{ t('How well she and a coach understand each other.') }}</p>
      <p class="hint">{{ t('It shifts a little every week they work together – slowly, so a first reading can take months.') }}</p>
      <p class="chem-help-state" :data-state="state">{{ stateLine }}</p>
      <p class="hint">{{ t('When a coach is let go, it stays where it was – it does not fade – and carries on if you hire that coach again.') }}</p>
    </div>
  </div>
</template>

<style scoped>
/* The answer to the question the ring raised, so it is the one line on the card that is not a hint:
   the body ink instead of the muted one, at the 500 face the app ships (Manrope has no 600 – the
   renderer would synthesise it). Not an accent – that would read as a verdict on the coach, and the
   three states are facts about the pair's age, not about its quality. */
.chem-help-state {
  margin: 12px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}
</style>

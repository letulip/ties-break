<script setup lang="ts">
// ⭐ THE FIRST-RUN LOCALE PROMPT (L1a, spec §3.4). Ruled 07.10 (docs/decisions.md): «на первом экране
// надо предлагать сразу выбор языка, может даже до всего остального для первого входа». So it is
// asked BEFORE the app – `AppRoot.vue` mounts it ahead of `App.vue`, and with it ahead of the splash,
// the storage-recovery screen and the wizard – on a device that has never answered, and never again
// once it has. The More switcher is the second door to the same preference; both call `setLocale`.
//
// ⚠⚠ IT IS A BLOCKING SURFACE, AND THE ROUND-20 #3 LESSON IS WHY IT IS BUILT THIS WAY. A card that
// cannot be answered stopped a career once (TourBriefingDialog, a Continue button 188 px below a
// 375x667 screen). So: (1) it is the shared `.dialog-card`, which carries the height cap and the
// scroller; (2) it holds TWO controls and nothing else that can grow, and BOTH are answers – there is
// no third state to get stuck in; (3) choosing English is ONE tap and is the control focus lands on,
// so a keyboard player answers with Enter; (4) a second tap while a language loads is honoured
// (`setLocale`: the newest request wins), so a slow chunk can never trap the player in Russian or in
// the prompt. `tests/component/i18n-locale-ui.test.ts` measures it against the phone.
//
// There is deliberately NO Escape handler: dismissing without answering would leave the device
// «never asked», which is the one state this prompt exists to end.
//
// ⚠ EVERY STRING BELOW IS A DRAFT FOR THE OWNER (invariant 4) – new, written once, and his to
// replace. They are rows RU01-L01..L04 in docs/localization/ru-ui-shell-2026-09.md with the Russian
// column left empty on purpose. The prompt shows before any answer exists, so it renders in English;
// whether it should also carry a Russian line for a player who cannot read this one is his call.
import { useTemplateRef } from 'vue'
import { setLocale, t } from '../i18n'
import { useDialogFocus } from '../composables/dialogFocus'

const card = useTemplateRef<HTMLElement>('card')
useDialogFocus(card)

// ⚠ THE AUTONYM NEVER TRANSLATES (owner 10.10, «English / Русский» – the convention his №4 ruling
// implied): each language names ITSELF, so a player who cannot read the current locale still finds
// hers. A `t()` here would be wrong by design – the prompt shows before any choice exists – and the
// word lives in script because the template guard bans Cyrillic in templates, lawfully bypassed by
// a named constant (the night note's plan).
const RUSSIAN_AUTONYM = 'Русский'
</script>

<template>
  <div class="dialog-overlay locale-prompt">
    <!-- DRAFT (L1a, invariant 4): the title, the hint line and the two language names are new strings. -->
    <div
      ref="card"
      class="dialog-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="locale-prompt-title"
      tabindex="-1"
    >
      <h2 id="locale-prompt-title" class="dialog-title">{{ t('Choose your language') }}</h2>
      <p class="dialog-message">{{ t('You can change this later in Settings.') }}</p>
      <div class="dialog-actions">
        <button class="primary" @click="setLocale('en')">{{ t('English') }}</button>
        <button class="primary" @click="setLocale('ru')">{{ RUSSIAN_AUTONYM }}</button>
      </div>
    </div>
  </div>
</template>

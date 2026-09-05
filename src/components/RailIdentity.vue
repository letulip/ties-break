<script setup lang="ts">
// ⭐⭐⭐ THE RAIL'S IDENTITY BLOCK – ROUND 36 SECOND PASS, P2-6, AND IT IS HIS RULING ON `D75`.
//
// «и аватар с текущей позицией и рангом (так же, как и все остальные плашки) на десктоп в боковом
// меню живут на всех страницах неизменно» – and, one item earlier, «давай на главной десктопе
// текущую дату всю вынесем в 2 строки и поставим справа от аватарки круглой, тогда она будет всегда
// видна и будет удобно».
//
// His «так же, как и все остальные плашки» is exact and is what makes this a component: the rail's
// dashboard tiles are the shell's and are drawn on every screen; her face and her rank were HOME's,
// teleported in, and vanished on the other nine. Measured on the stand at 1280 before this: the two
// tiles were 171x218 on Season, Calendar and Stats, and `.rail-id` was an EMPTY 171x20 slot.
//
// -------------------------------------------------------------------------------------------------
// ⚠⚠ NOT ONE FACT IS DERIVED HERE. EVERY ONE COMES OFF `composables/kidIdentity.ts`.
// -------------------------------------------------------------------------------------------------
// D75 argued against a shell copy and argued correctly: the rank chip is five derived facts deep and
// a shortcut that recomputes its own number is this repo's named recurring disease. The answer is
// not to keep the elements on Home – that is what could not survive «на всех страницах» – it is to
// move the ARITHMETIC out from under both of them. `useKidIdentity()` is the one owner; this file
// and `HomeScreen.vue` are two renders of it, and they cannot disagree because there is nothing to
// disagree about.
//
// ⚠ NO `data-tour` ANYWHERE BELOW. The coach-mark tour points at Home's own avatar by
// `data-tour="kid-avatar"`, and two elements answering to one mark is a tour that points at the
// wrong one – D74's rule, and it holds for this copy too.
//
// ⚠ NOT ONE NEW STRING. The two labels, the title and the callout are `HomeScreen.vue`'s own,
// verbatim. Nothing here is a sentence somebody wrote for a rail.
//
// ⚠ DESKTOP-ONLY IS A STYLESHEET FACT, NOT A `v-if` – `.rail-id` is `display: none` below 1024 in
// src/style.css. Same rule, same reason, as `RailDashboard.vue`: a `v-if` on a media query would be
// a second source of truth about the breakpoint, and `display: none` removes the box AND the
// accessibility node, so a phone is byte-for-box what it was.
import { useKidIdentity } from '../composables/kidIdentity'

const emit = defineEmits<{ 'open-kid': []; 'rank-help': [] }>()

const {
  headerAvatarUrl,
  chipTrack,
  ladderLabel,
  rankText,
  ranked,
  rankChipTitle,
  rankMovement,
  showKidHint,
  dismissKidHint,
} = useKidIdentity()

function openKid(): void {
  dismissKidHint()
  emit('open-kid')
}
</script>

<template>
  <div class="rail-id">
    <button class="diary-avatar-btn rail-id-avatar" aria-label="Open her profile" @click="openKid">
      <img class="diary-avatar" :src="headerAvatarUrl" alt="" />
    </button>
    <!-- The one-time callout travels with the face it explains – its rule on Home is «moved with
         the avatar it explains», and a callout left on a photograph that no longer has a face to
         tap points at nothing. Same text, same dismissal, one shared ref. -->
    <button v-if="showKidHint" class="diary-kid-hint rail-id-hint" @click="openKid">
      Tap the photo – her page lives here
    </button>
    <!-- The chip is drawn only once something counts somewhere – `rankChipTrack` owns that rule
         (null = no counting result in any table yet, and nothing to read on a chip). -->
    <button
      v-if="chipTrack !== null"
      class="diary-rank rail-id-rank"
      aria-label="How ranking points work"
      :title="rankChipTitle"
      @click="emit('rank-help')"
    >
      <span class="rank-ladder">{{ ladderLabel }}</span>
      <span>{{ rankText }}</span>
      <template v-if="ranked">
        <span v-if="rankMovement.dir === 'up'" class="rank-move up">&#8593;{{ rankMovement.by }}</span>
        <span v-else-if="rankMovement.dir === 'down'" class="rank-move down">&#8595;{{ rankMovement.by }}</span>
        <span v-else class="rank-move flat">–</span>
      </template>
    </button>
  </div>
</template>

<script setup lang="ts">
// Round-6 item 2 – splash screen. Shown on EVERY launch, once `game.ready` (App.vue gates
// this before either the onboarding wizard or the tab shell) – a full-screen dark beat
// with the owner's wordmark before the app proper appears.
//
// The app is dark, so the "-light" logo marks are the ones rendered here (see
// docs/specs/round5-brand.md for the dark/light naming convention – "-light" = light ink,
// meant for a dark background, not "the light theme").
import { initSfx } from '../audio/sfx'
import { start as startMusic } from '../audio/music'

const emit = defineEmits<{ done: [] }>()

const LOGO_LINE = `${import.meta.env.BASE_URL}logos/logo-tb-line-light.webp`
const LOGO_LINE_2 = `${import.meta.env.BASE_URL}logos/logo-tb-line-2-light.webp`

// Any tap: unlock sfx (same gesture-gate contract as sfx.ts's initSfx – belt-and-suspenders,
// installGlobalSfx's document listener would also catch this click), start the music
// (start() itself respects a persisted mute – see src/audio/music.ts), then hand off.
function onTap(): void {
  initSfx()
  startMusic()
  emit('done')
}
</script>

<template>
  <div class="splash" role="button" tabindex="0" aria-label="Tap to start" @click="onTap" @keydown.enter="onTap" @keydown.space.prevent="onTap">
    <div class="splash-center">
      <!-- Natural size (138x30) – a raster wordmark upscaled goes soft, so it's rendered
           exactly as exported rather than stretched to fill more of the screen. -->
      <img class="splash-logo splash-logo-1" :src="LOGO_LINE" width="138" height="30" alt="Ties Break" />
      <img class="splash-logo splash-logo-2" :src="LOGO_LINE_2" width="139" height="30" alt="Ace Parent" />
    </div>
    <div class="splash-hint-wrap">
      <span class="splash-hint">Tap to start</span>
    </div>
  </div>
</template>

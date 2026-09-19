<script setup lang="ts">
// THE CHAPTERS PICKER – at 390 the chapter rail is a BUTTON, not a rail.
//
// ⚠ AND THAT IS A MEASURED DECISION OF HIS, NOT A SIMPLIFICATION. The README: «390: кнопка
// "Chapters" – рейл занял бы полэкрана» – at the wider widths the six chapters sit as a strip under
// the sheet, and on a phone the same strip would eat half the screen that the sheet is already too
// wide for. The same list, behind a press.
//
// ⚠ THE THUMBNAILS ARE NUMBERED PLATES AND NOT PHOTOGRAPHS – also his: «Миниатюры глав – номерные
// плашки, а не фото», because a 40px drop zone cannot hold what a frame needs to say about itself.
//
// ⚠⚠ ROUND-20 #3 APPLIES TO THIS CARD. It is a blocking overlay on the shared `.dialog-card`, whose
// `max-height: 100%; overflow-y: auto` is what keeps the dismiss control reachable when a career
// with five chapters becomes a career with more rows than a phone is tall.
// `tests/component/album-mobile.test.ts` measures it at 375x667 through the real cascade.
import { ref } from 'vue'
import { useDialogFocus } from '../../composables/dialogFocus'
import type { AlbumChapter } from '../../shared/protocol'

defineProps<{ chapters: readonly AlbumChapter[]; currentChapter: number }>()
const emit = defineEmits<{ pick: [number]; close: [] }>()

const card = ref<HTMLElement | null>(null)
useDialogFocus(card, () => emit('close'))
</script>

<template>
  <div class="dialog-overlay album-chapters" @click.self="emit('close')">
    <div
      ref="card"
      class="dialog-card album-chapters-card"
      role="dialog"
      aria-modal="true"
      aria-label="Chapters"
    >
      <ul class="album-chapters-list">
        <li v-for="c in chapters" :key="c.index">
          <button
            type="button"
            class="album-chapters-row"
            :class="{ 'is-current': c.index === currentChapter }"
            :aria-current="c.index === currentChapter ? 'true' : undefined"
            @click="emit('pick', c.firstSheet)"
          >
            <span class="album-chapters-no">{{ c.index }}</span>
            <span class="album-chapters-id">
              <span class="album-chapters-title">{{ c.title }}</span>
              <span class="album-chapters-age">{{ c.ageLabel }}</span>
            </span>
            <span class="album-chapters-count">{{ c.sheetCount }}</span>
          </button>
        </li>
      </ul>
      <button type="button" class="album-chapters-close" @click="emit('close')">Close</button>
    </div>
  </div>
</template>

<style scoped>
.album-chapters-card {
  max-width: 340px;
}

.album-chapters-list {
  margin: 0 0 12px;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.album-chapters-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--bg);
  color: var(--text);
  text-align: left;
  cursor: pointer;
}

.album-chapters-row.is-current {
  border-color: var(--accent);
}

/* The numbered plate the README asks for, in place of a thumbnail. */
.album-chapters-no {
  flex: none;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-mark);
  background: var(--panel);
  font-family: var(--font-heading);
  font-size: 15px;
  font-weight: 800;
}

.album-chapters-id {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.album-chapters-title {
  font-family: var(--font-heading);
  font-size: 14px;
  font-weight: 700;
}

.album-chapters-age,
.album-chapters-count {
  font-size: var(--label-size);
  color: var(--muted);
}

.album-chapters-count {
  flex: none;
}

.album-chapters-close {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  background: none;
  color: var(--muted);
  cursor: pointer;
}
</style>

<script setup lang="ts">
// ⭐⭐ THE CHAPTERS, OPEN ON THE PAGE – what the «Chapters» button is instead of, past 768.
//
// The README gives the same list three shapes, one per width, and says why each is not the other two:
//
//   1024  «все 6 глав сеткой под листом»       – a grid; the whole book is on screen at once.
//   768   «та же лента, скроллится горизонтально» – one row, panned sideways.
//   390   «кнопка "Chapters" – рейл занял бы полэкрана» – a press, and `AlbumChaptersSheet.vue`.
//
// ⚠⚠ THIS COMPONENT IS IN THE TREE AT EVERY WIDTH AND `display: none` BELOW 768, which is the house's
// own idiom rather than a `v-if` on `matchMedia` – src/style.css states it beside `.rail-dash`: «a
// component that mounted itself off `matchMedia` would be a SECOND source of truth about the
// breakpoint beside the ladder at the top of this file», and `display: none` removes the box AND the
// accessibility node, so a phone is byte-for-box what it was before this file existed.
//
// ⚠ THE THUMBNAIL IS A NUMBERED PLATE AND NOT A PHOTOGRAPH – the owner's README, with its reason:
// «Миниатюры глав – номерные плашки, а не фото», because a 40px drop zone cannot hold what a frame
// needs to say about itself. Same plate as the phone's Chapters card draws, for the same reason.
//
// ⚠ NOT ONE SENTENCE HERE IS THIS FILE'S. Every string on a row arrives on the chapter (invariant 4);
// the only word this template contributes is the landmark's name, and it is the word the phone's card
// already answers to.
import type { AlbumChapter } from './albumWire'

defineProps<{ chapters: readonly AlbumChapter[]; currentChapter: number }>()
const emit = defineEmits<{ pick: [number] }>()
</script>

<template>
  <nav class="album-rail" aria-label="Chapters">
    <ol class="album-rail-list">
      <li v-for="c in chapters" :key="c.index">
        <button
          type="button"
          class="album-rail-plate"
          :class="{ 'is-current': c.index === currentChapter }"
          :aria-current="c.index === currentChapter ? 'true' : undefined"
          @click="emit('pick', c.firstSheet)"
        >
          <span class="album-rail-no" aria-hidden="true">{{ c.index }}</span>
          <span class="album-rail-id">
            <span class="album-rail-title">{{ c.title }}</span>
            <span class="album-rail-age">{{ c.ageLabel }}</span>
          </span>
        </button>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
/* ⚠⚠ THE BASE STATE IS «NOT ON THIS SCREEN», and every rule that draws anything is inside a
   `min-width` query. That ordering is deliberate: it is the only spelling under which a phone cannot
   inherit a single declaration from this file by accident. */
.album-rail {
  display: none;
}

.album-rail-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

@media (min-width: 768px) {
  .album-rail {
    display: block;
  }

  /* 768 – ONE ROW THAT PANS. Six chapters at their natural width are wider than a 736px column, and
     the alternative to scrolling them is shrinking them until the age line stops fitting. */
  .album-rail-list {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    /* The row settles on a plate rather than halfway across one; `proximity` and not `mandatory` for
       the same reason the sheet's own pan gives – a reader who wants to stop between two may. */
    scroll-snap-type: x proximity;
    padding-bottom: 4px;
  }

  .album-rail-list > li {
    flex: none;
    scroll-snap-align: start;
  }

  .album-rail-plate {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 14px 10px 10px;
    border: 1px solid var(--line);
    border-radius: var(--radius-card);
    background: var(--panel);
    color: var(--text);
    text-align: left;
    cursor: pointer;
  }

  .album-rail-plate.is-current {
    border-color: var(--accent);
  }

  /* The plate the README asks for in place of a thumbnail: the chapter's number, drawn big and
     quiet, the way a tab divider in a real album is written on rather than illustrated. */
  .album-rail-no {
    flex: none;
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: var(--radius-mark);
    background: var(--bg);
    font-family: var(--font-hand);
    font-size: 22px;
    color: var(--muted);
  }

  .album-rail-plate.is-current .album-rail-no {
    color: var(--accent);
  }

  .album-rail-id {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .album-rail-title {
    font-family: var(--font-heading);
    font-size: 14px;
    font-weight: 700;
    white-space: nowrap;
  }

  .album-rail-age {
    font-size: var(--label-size);
    color: var(--muted);
  }
}

@media (min-width: 1024px) {
  /* 1024 – THE WHOLE BOOK UNDER THE PAGE. `auto-fit` rather than a fixed six, because spec §3 rules
     that a career has as many chapters as it lived: a short one must not leave four empty columns and
     a long one must not fall off the right edge. ⚠ AND `overflow-x: visible` IS PART OF THE CLAIM,
     not tidying – a grid that still declared a scroller would be the 768 strip wearing a grid's
     clothes, and «сеткой» is the word that distinguishes them. */
  .album-rail-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 10px;
    overflow-x: visible;
    padding-bottom: 0;
  }

  .album-rail-title {
    white-space: normal;
  }
}
</style>

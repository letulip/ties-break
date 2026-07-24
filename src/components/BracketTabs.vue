<script setup lang="ts">
// Round-7 (owner): the tournament DRAW as a round-tabbed bracket. A row of round tabs
// (R32 · R16 · QF · SF · F – only the rounds present in `matches`), the selected round's
// matches as a vertical list of two-row cells (player A / player B, winner-perspective score,
// winner row accent + ✓, the kid's match outlined), and a small SVG elbow to the RIGHT of each
// adjacent pair joining them toward the next round. The body is height-bounded with an internal,
// scrollbar-hidden vertical scroll; on mount / round change the kid's cell (if present) is
// scrolled into view. Reused for the between-rounds view AND the spectate walk in TournamentFlow.
import { computed, nextTick, ref, watch } from 'vue'
import { KID_ID } from '../engine/world'
import type { FullBracketMatch } from '../shared/protocol'

const props = defineProps<{
  matches: FullBracketMatch[]
  drawSize: number
  /** the round whose tab is active by default (kid's latest played round / the spectate round) */
  activeRound: number
}>()

// Fixed cell geometry so the pair connectors line up predictably (single source of truth,
// consumed by the cell height binding and the elbow SVG below).
const CELL_H = 46
const PAIR_GAP = 8
const ELBOW_W = 16
const pairH = CELL_H * 2 + PAIR_GAP

/** Short stage label of a round in a draw of `drawSize`: 2→F, 4→SF, 8→QF, else R{remaining}. */
function shortStage(round: number, drawSize: number): string {
  const remaining = drawSize / 2 ** round
  if (remaining === 2) return 'F'
  if (remaining === 4) return 'SF'
  if (remaining === 8) return 'QF'
  return `R${remaining}`
}

interface RoundTab {
  round: number
  short: string
}
const tabs = computed<RoundTab[]>(() => {
  const seen = new Set<number>()
  for (const m of props.matches) seen.add(m.round)
  return [...seen].sort((a, b) => a - b).map((round) => ({ round, short: shortStage(round, props.drawSize) }))
})

// The selected round tracks `activeRound` but can be overridden by tapping a tab; it snaps back
// to `activeRound` whenever the parent changes it (a newly played round, a spectate step).
const selected = ref(props.activeRound)
watch(
  () => props.activeRound,
  (r) => {
    selected.value = r
  },
)
// Keep `selected` valid if the available rounds change (e.g. the fullBracket grows).
watch(tabs, (list) => {
  if (list.length && !list.some((t) => t.round === selected.value)) {
    selected.value = list[list.length - 1].round
  }
})

interface BracketSide {
  name: string
  won: boolean
  isKid: boolean
}
interface BracketCell {
  a: BracketSide
  b: BracketSide
  score?: string
  isKidMatch: boolean
}
function toCell(m: FullBracketMatch): BracketCell {
  const aKid = m.aId === KID_ID
  const bKid = m.bId === KID_ID
  return {
    a: { name: m.aName, won: m.winnerId === m.aId, isKid: aKid },
    b: { name: m.bName, won: m.winnerId === m.bId, isKid: bKid },
    score: m.score,
    isKidMatch: aKid || bKid,
  }
}
const cells = computed<BracketCell[]>(() =>
  props.matches.filter((m) => m.round === selected.value).map(toCell),
)
// Group cells into adjacent pairs (2 feed 1 in the next round). A trailing single cell (the
// Final) is a lone pair with no elbow.
const pairs = computed<BracketCell[][]>(() => {
  const out: BracketCell[][] = []
  for (let i = 0; i < cells.value.length; i += 2) out.push(cells.value.slice(i, i + 2))
  return out
})

// Elbow path for a full pair: two horizontals into a vertical spine, then a stub toward the
// next round. Geometry is in the ELBOW_W × pairH viewBox (top/bottom cell centres, mid).
const elbow = computed(() => {
  const topY = CELL_H / 2
  const botY = CELL_H + PAIR_GAP + CELL_H / 2
  const midY = pairH / 2
  const x = ELBOW_W / 2
  return {
    w: ELBOW_W,
    h: pairH,
    d: `M0 ${topY} H${x} M0 ${botY} H${x} M${x} ${topY} V${botY} M${x} ${midY} H${ELBOW_W}`,
  }
})

const scrollRef = ref<HTMLElement | null>(null)
watch(
  [selected, cells],
  async () => {
    await nextTick()
    // Centre the kid's cell in the selected round if she's in it (owner: scrollIntoView center).
    scrollRef.value?.querySelector<HTMLElement>('.bt-cell.is-kid')?.scrollIntoView({ block: 'center' })
  },
  { immediate: true },
)
</script>

<template>
  <div class="bt">
    <div class="bt-tabs" role="tablist">
      <button
        v-for="t in tabs"
        :key="t.round"
        class="bt-tab"
        :class="{ active: t.round === selected }"
        role="tab"
        :aria-selected="t.round === selected"
        @click="selected = t.round"
      >
        {{ t.short }}
      </button>
    </div>

    <div ref="scrollRef" class="bt-scroll">
      <div class="bt-list">
        <div v-for="(pair, pi) in pairs" :key="pi" class="bt-pair">
          <div class="bt-pair-cells" :style="{ gap: PAIR_GAP + 'px' }">
            <div
              v-for="(cell, ci) in pair"
              :key="ci"
              class="bt-cell"
              :class="{ 'is-kid': cell.isKidMatch }"
              :style="{ height: CELL_H + 'px' }"
            >
              <div class="bt-players">
                <span class="bt-row" :class="{ won: cell.a.won, kid: cell.a.isKid }">
                  <span class="bt-name">{{ cell.a.name }}</span>
                  <span v-if="cell.a.won" class="bt-check" aria-hidden="true">✓</span>
                </span>
                <span class="bt-row" :class="{ won: cell.b.won, kid: cell.b.isKid }">
                  <span class="bt-name">{{ cell.b.name }}</span>
                  <span v-if="cell.b.won" class="bt-check" aria-hidden="true">✓</span>
                </span>
              </div>
              <span v-if="cell.score" class="bt-score num">{{ cell.score }}</span>
            </div>
          </div>
          <svg
            v-if="pair.length === 2"
            class="bt-elbow"
            :width="elbow.w"
            :height="elbow.h"
            :viewBox="`0 0 ${elbow.w} ${elbow.h}`"
            aria-hidden="true"
          >
            <path :d="elbow.d" fill="none" stroke="var(--line)" stroke-width="1.5" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

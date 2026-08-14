<script setup lang="ts">
// Round-7 (owner): the tournament DRAW as a round-tabbed bracket. A row of round tabs
// (R32 · R16 · QF · SF · F – only the rounds present in `matches`), the selected round's
// matches as a vertical list of two-row cells (player A / player B, per-set score cells,
// winner row accent + ✓, the kid's match outlined), and a small SVG elbow to the RIGHT of each
// adjacent pair joining them toward the next round. The body is height-bounded with an internal,
// scrollbar-hidden vertical scroll; on mount / round change the kid's cell (if present) is
// scrolled into view. Reused for the between-rounds view AND the spectate walk in TournamentFlow.
//
// U4 – SCREENS J AND K (docs/design/README.md §J/K). Two things arrived with the design:
//
//   J  the scoreline stopped being one string on the right of the cell and became per-set
//      COLUMNS, one per set, aligned down the round the way the export draws them. That is the
//      whole read of a draw sheet: you scan a column, not a sentence.
//   K  the FINAL is not a list of one. It gets its own treatment - the trophy, the label, a
//      single wider card in the accent frame, and the line naming who each finalist beat in the
//      semis (derived from the previous round's own matches, not from new data).
//
// What the export asks for and the data does not carry, reported rather than invented: the SEED
// number down the left of each row (FullBracketMatch has no seed field), and the coverage chip +
// date line above the tabs (they belong to whichever screen mounts this).
import { computed, nextTick, ref, watch } from 'vue'
import { KID_ID } from '../engine/world'
// U0: the round switcher is the app's standard segmented control, and this file was its ONE
// consumer – the pair `.tab-row` / `.tab-pill` had been "shared once" and never got a component.
// docs/specs/ui-components.md §8 says this makes it official, so the draw is SegmentedRow's real
// caller. The plate's own CSS stays in `src/style.css` (it is shared vocabulary, and `.bt-tabs`
// below still reaches its pills through it); what arrives with the component is the CONTRACT.
import SegmentedRow from './ui/SegmentedRow.vue'
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
/** Best-of-three, so a scored match shows three set columns and pads the unplayed one. */
const SET_COLS = 3

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
  /** the engine's full stage name for the round ("Round of 16", "Quarterfinal", …) – the aria-label */
  label: string
}
const tabs = computed<RoundTab[]>(() => {
  // Only the rounds actually present in `matches` get a tab. During her run the snapshot caps
  // `fullBracket` at the REVEALED rounds, so an unreached round has no matches here and therefore
  // no tab – the spoiler guard is the data, not the view.
  const seen = new Map<number, string>()
  for (const m of props.matches) if (!seen.has(m.round)) seen.set(m.round, m.roundLabel)
  return [...seen.keys()]
    .sort((a, b) => a - b)
    .map((round) => ({ round, short: shortStage(round, props.drawSize), label: seen.get(round) ?? '' }))
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

// SegmentedRow speaks in VALUES rather than indices, and a round is a number here; this is the one
// adapter between the two, in one place, rather than an index-to-round map at every read site.
const segments = computed(() =>
  tabs.value.map((t) => ({ value: String(t.round), label: t.label, short: t.short })),
)
const selectedSeg = computed({
  get: () => String(selected.value),
  set: (v: string) => {
    selected.value = Number(v)
  },
})

interface BracketSide {
  name: string
  won: boolean
  isKid: boolean
  /** one entry per set column: the games this side won, '–' for a set that was not played, or
   *  '' when this match has no scoreline at all (AI-vs-AI matches are decided, never simulated) */
  sets: string[]
}
interface BracketCell {
  a: BracketSide
  b: BracketSide
  isKidMatch: boolean
}

/** "6-4 3-6 7-5" (always WINNER-perspective, flipped in world.ts before it reaches a snapshot)
 *  into the two rows of set columns the export draws, padded to SET_COLS. */
function splitScore(score: string | undefined): { winner: string[]; loser: string[] } {
  const winner: string[] = []
  const loser: string[] = []
  for (const set of (score ?? '').trim().split(/\s+/).filter(Boolean)) {
    const [w, l] = set.split('-')
    winner.push(w ?? '–')
    loser.push(l ?? '–')
  }
  // A blank column and a dashed one mean different things and must look different: '–' is a set
  // that was not needed, '' is a match nobody scored. The export only ever draws the first.
  const pad = score ? '–' : ''
  while (winner.length < SET_COLS) winner.push(pad)
  while (loser.length < SET_COLS) loser.push(pad)
  return { winner, loser }
}

function toCell(m: FullBracketMatch): BracketCell {
  const aWon = m.winnerId === m.aId
  const { winner, loser } = splitScore(m.score)
  const aKid = m.aId === KID_ID
  const bKid = m.bId === KID_ID
  return {
    a: { name: m.aName, won: aWon, isKid: aKid, sets: aWon ? winner : loser },
    b: { name: m.bName, won: !aWon, isKid: bKid, sets: aWon ? loser : winner },
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

// --- SCREEN K: the Final ------------------------------------------------------------------------
// One match, and it is the only screen in the draw that is about a moment rather than a list.
const isFinal = computed(() => cells.value.length === 1 && shortStage(selected.value, props.drawSize) === 'F')

/** Who each finalist beat to get here, in the finalists' own order - read off the semifinal
 *  matches already in `matches`, so nothing new has to reach the snapshot for this line to exist. */
const semifinalVictims = computed<string[]>(() => {
  if (!isFinal.value) return []
  const final = props.matches.find((m) => m.round === selected.value)
  if (!final) return []
  const semis = props.matches.filter((m) => m.round === selected.value - 1)
  const out: string[] = []
  for (const finalistId of [final.aId, final.bId]) {
    const semi = semis.find((m) => m.winnerId === finalistId)
    if (semi) out.push(semi.winnerId === semi.aId ? semi.bName : semi.aName)
  }
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
/** ⚠⚠ THE TAB STRIP, WHICH NEVER NEEDED SCROLLING INTO VIEW UNTIL 14.08. `.bt-tabs`' own note says
 *  it: *"at 375 px the five segments (R32 · R16 · QF · SF · F) fit, but a longer row scrolls
 *  sideways"*. Every draw in the game was 32, so the row was always five and the overflow rule was
 *  insurance that never fired.
 *
 *  A Grand Slam draws 128 now – SEVEN tabs (R128 · R64 · R32 · R16 · QF · SF · F) – and a 1000
 *  draws 64, six. The row really scrolls, and the tab that opens SELECTED is her latest played
 *  round, which at a deep run is at the far right. Without this she opens the draw of a Slam she
 *  reached the semifinal of and sees R128 with the active pill off the edge of the screen.
 *
 *  Exactly the class of defect round 20 earned its rule for – content grows one honest step at a
 *  time and nothing objects until it is wider than a phone. `inline: 'nearest'` so a tab already
 *  visible does not jog the row, and `block: 'nearest'` so bringing a tab into view can never
 *  scroll the PAGE (the cell centring below deliberately does move its own container).
 *
 *  ⚠ THE REF IS THE COMPONENT, SO IT IS READ THROUGH `$el`: SegmentedRow is a single-root `<div>`
 *  (the one `.bt-tabs` styles), and a wrapper element would have needed the overflow rule moved
 *  onto it. Typed rather than cast, so a future multi-root SegmentedRow breaks the compile here
 *  instead of silently never scrolling. */
const tabsRef = ref<{ $el: HTMLElement } | null>(null)
watch(
  [selected, cells],
  async () => {
    await nextTick()
    // Centre the kid's cell in the selected round if she's in it (owner: scrollIntoView center).
    scrollRef.value?.querySelector<HTMLElement>('.bt-cell.is-kid')?.scrollIntoView({ block: 'center' })
    tabsRef.value?.$el
      ?.querySelector<HTMLElement>('.tab-pill[aria-pressed="true"]')
      ?.scrollIntoView({ inline: 'nearest', block: 'nearest' })
  },
  { immediate: true },
)
</script>

<template>
  <div class="bt">
    <!-- The app's standard segmented control (U0's SegmentedRow, on .tab-row/.tab-pill) so the
         draw's round switcher matches every other tab row; `bt-tabs` only adds scroll safety on a
         narrow phone. Real buttons with aria-pressed + the full stage name as the label (the short
         "QF" is visual) – all three of those are now the component's guarantee, not this file's. -->
    <SegmentedRow
      ref="tabsRef"
      v-model="selectedSeg"
      class="bt-tabs"
      tone="on-panel"
      :options="segments"
      group-label="Draw rounds"
    />

    <!-- SCREEN K – the Final. Not a list of one: the trophy, the label, the single card in the
         accent frame, and the semifinal line under a pair of hairlines. -->
    <div v-if="isFinal" class="bt-final">
      <div class="bt-final-cup" aria-hidden="true">🏆</div>
      <p class="bt-final-label">The Final</p>
      <div
        class="bt-cell bt-cell--final"
        :class="{ 'is-kid': cells[0].isKidMatch }"
        role="group"
        :aria-label="`The final – ${cells[0].a.name} vs ${cells[0].b.name}`"
      >
        <div v-for="(side, si) in [cells[0].a, cells[0].b]" :key="si" class="bt-final-row">
          <span class="bt-row" :class="{ won: side.won, kid: side.isKid }">
            <span class="bt-name">{{ side.name }}</span>
            <span v-if="side.won" class="bt-check" aria-hidden="true">✓</span>
          </span>
          <span class="bt-sets">
            <span v-for="(games, gi) in side.sets" :key="gi" class="bt-set num">{{ games }}</span>
          </span>
        </div>
      </div>
      <p v-if="semifinalVictims.length" class="bt-final-semis">
        <span class="bt-final-semis-text">
          Semifinals: <span v-for="(name, i) in semifinalVictims" :key="i">{{ i ? ' · ' : '' }}def. {{ name }}</span>
        </span>
      </p>
    </div>

    <!-- SCREEN J – every other round, as the list of paired cells with their connectors. -->
    <div v-else ref="scrollRef" class="bt-scroll">
      <div class="bt-list">
        <div v-for="(pair, pi) in pairs" :key="pi" class="bt-pair">
          <div class="bt-pair-cells" :style="{ gap: PAIR_GAP + 'px' }">
            <div
              v-for="(cell, ci) in pair"
              :key="ci"
              class="bt-cell"
              :class="{ 'is-kid': cell.isKidMatch }"
              :style="{ height: CELL_H + 'px' }"
              role="group"
              :aria-label="cell.isKidMatch ? `Her match – ${cell.a.name} vs ${cell.b.name}` : undefined"
            >
              <div class="bt-players">
                <span
                  v-for="(side, si) in [cell.a, cell.b]"
                  :key="si"
                  class="bt-row"
                  :class="{ won: side.won, kid: side.isKid }"
                >
                  <span class="bt-name">{{ side.name }}</span>
                  <span v-if="side.won" class="bt-check" aria-hidden="true">✓</span>
                </span>
              </div>
              <span class="bt-sets">
                <span class="bt-sets-col">
                  <span v-for="(games, gi) in cell.a.sets" :key="gi" class="bt-set num" :class="{ won: cell.a.won }">{{ games }}</span>
                </span>
                <span class="bt-sets-col">
                  <span v-for="(games, gi) in cell.b.sets" :key="gi" class="bt-set num" :class="{ won: cell.b.won }">{{ games }}</span>
                </span>
              </span>
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

<style scoped>
/* The draw's own styles (U4: moved out of src/style.css, which is shared vocabulary). What stayed
   in the sheet is `.tab-row`/`.tab-pill` – SegmentedRow's plate, which six screens use. */

/* The draw stacks twice over - the card's own parts, then the round's cells - at one rhythm. */
.bt,
.bt-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Round tabs reuse the app's segmented control (.tab-row/.tab-pill) so the draw's round switcher
   looks like every other tab row – including its dark-on-accent active state and the round-8 R8-5
   hover pin. This modifier only adds narrow-phone scroll safety: at 375 px the five segments
   (R32 · R16 · QF · SF · F) fit, but a longer row scrolls sideways instead of overflowing the
   card, with the scrollbar hidden like the draw body's. `:deep` because the pills are
   SegmentedRow's elements, not this component's. */
.bt-tabs {
  overflow-x: auto;
  scrollbar-width: none;
}

.bt-tabs :deep(.tab-pill) {
  flex: 0 0 auto;
}

/* Bounded body with an internal vertical scroll; scrollbar hidden – the owner said users will
   figure out it scrolls. The kid's cell is scrolled into view on open / round change. */
.bt-scroll {
  max-height: 300px;
  overflow-y: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

/* Both of the draw's scrollers hide their bar - the owner's call: users will work out that it
   scrolls. `scrollbar-width: none` covers Firefox, this covers WebKit. */
.bt-tabs::-webkit-scrollbar,
.bt-scroll::-webkit-scrollbar {
  display: none;
}

/* A pair of adjacent cells (they feed one match in the next round) + a right-side connector
   elbow. The elbow SVG height is set in the component to match the pair's fixed height. */
.bt-pair {
  display: flex;
  align-items: stretch;
}

.bt-pair-cells {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.bt-elbow {
  flex: 0 0 auto;
  align-self: flex-start;
}

.bt-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: var(--radius-dialog);
  padding: 5px 9px;
  box-sizing: border-box;
}

/* The kid's own match is outlined in accent (path highlight). */
.bt-cell.is-kid {
  border-color: var(--accent);
  background: var(--accent-wash);
}

.bt-players {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  min-width: 0;
  flex: 1;
}

.bt-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12.5px;
  color: var(--muted);
  min-width: 0;
}

/* Name truncates with an ellipsis; the winner ✓ stays outside the ellipsis so it is never
   clipped on a long name. */
.bt-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.bt-check {
  flex-shrink: 0;
  color: var(--accent);
  font-weight: 700;
  font-size: 11px;
}

/* Winner accent-coloured (+ the ✓), loser left muted – the mockup's read: scan the accent names
   down the round. The kid is told apart by her cell's accent frame/tint, not by colour alone. */
.bt-row.won {
  color: var(--accent);
  font-weight: 600;
}
/* Her own name is bolded rather than re-coloured: colour in a cell means result (accent = won,
   muted = lost), so accenting her name too would make her lost matches read as two winners.
   Her cell's accent frame + tint is what finds her at a glance. */
.bt-row.kid {
  font-weight: 700;
}

/* --- U4 / screen J: the score as COLUMNS -----------------------------------------------------
   The export lines the sets up one under the other at a fixed column width, so a whole round can
   be read down its third-set column. That is why each cell is 11px wide and centred rather than
   sized by its digit. */
.bt-sets {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
}

.bt-sets-col {
  display: flex;
  gap: 7px;
}

.bt-set {
  width: 11px;
  text-align: center;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--ink-dim);
  line-height: 1.35;
}

.bt-set.won {
  font-weight: 700;
  color: var(--text);
}

/* --- U4 / screen K: THE FINAL ---------------------------------------------------------------- */
.bt-final {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 0 6px;
}

.bt-final-cup {
  font-size: 32px;
  line-height: 1;
}

/* The app's muted uppercase label, exactly as the champion screen's own (.tf-champ-label). The
   export writes this one in gold at a wider tracking; U0's note is explicit that these labels stay
   MUTED and that recolouring them is the owner's call, not an extraction's - and the trophy above
   it already carries the gold. Reported. */
.bt-final-label {
  margin: 0;
  font-size: var(--label-size);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: var(--label-track);
  color: var(--muted);
}

/* One card instead of a list: wider padding, the accent frame whoever is in it, bigger names. */
.bt-cell--final {
  flex-direction: column;
  align-items: stretch;
  gap: 0;
  width: 100%;
  padding: 4px 14px;
  border-radius: var(--radius-frame);
  border-color: var(--accent);
}

.bt-final-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 0;
}

.bt-final-row + .bt-final-row {
  border-top: 1px solid var(--line);
}

.bt-final-row .bt-row {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 500;
}

.bt-final-row .bt-row.won {
  font-weight: 800;
}

.bt-final-row .bt-set {
  width: 13px;
  font-size: 15px;
}

.bt-final-row .bt-sets {
  flex-direction: row;
  gap: 8px;
}

/* "Semifinals: def. U. Sartori · def. M. Chen", between the export's two short hairlines. The text
   is ONE flex item so a long pair of names wraps as a block between the rules instead of every
   word becoming its own item (which is what it did the first time, in the browser). */
.bt-final-semis {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 4px 0 0;
  font-size: 12.5px;
  color: var(--muted);
  text-align: center;
}

.bt-final-semis-text {
  min-width: 0;
}

.bt-final-semis::before,
.bt-final-semis::after {
  content: '';
  width: 26px;
  height: 1px;
  background: var(--line);
  flex: none;
}
</style>

<script setup lang="ts">
// THE TROPHY CABINET – every piece of silverware her career has produced, and every one it has not.
//
// -------------------------------------------------------------------------------------------------
// THE OWNER'S DESIGN, in his words (31.07)
// -------------------------------------------------------------------------------------------------
//   «под каждым трофеем записку сколько раз брала трофей, может быть даже в какие года сокращенно…
//    показывать по умолчанию все, но полупрозрачными или размытыми, чтобы сложно было разглядеть, а
//    когда взять – уже нормально и ярко»
//
// Three instructions, and every one of them is load-bearing:
//
//   ALL EIGHTEEN FROM WEEK 0. Nine tiers, gold and silver each. A cabinet that fills up one empty
//   slot at a time is a progress bar; a cabinet whose shelves are all visible from the first day is
//   a room she is going to grow into. The screen is the same size on week 1 and on week 500.
//
//   LOCKED ONES BLURRED PAST RECOGNITION, not merely dimmed. He asked for «сложно было разглядеть»,
//   and that is the whole mechanic: the SHAPE of the thing is the reward, so if a locked J300 cup
//   were legible at 40% opacity there would be nothing left to reveal. `blur(9px)` at a 128px plate
//   leaves a coloured smudge that reads as "something is there" and nothing more.
//
//   A NOTE UNDER EACH, WITH THE COUNT AND THE YEARS. His own format, verbatim: `3x'31 2x'32`.
//   ⚠ AND NOTHING ELSE. No scores, no placements, no opponents – he ruled that out explicitly. A
//   cabinet says what came home and when; the Stats screen and the news feed are where a result is
//   spelled out.
//
// -------------------------------------------------------------------------------------------------
// ⚠ THERE IS NO BRONZE, AND THE REASON IS THE DRAW RATHER THAN THE ART BUDGET
// -------------------------------------------------------------------------------------------------
// A knockout draw ends with two losing semi-finalists and no play-off between them, exactly as real
// tennis does – `finishLabel(2)` is "Semifinalist", plural by construction, and the engine never
// resolves a third-place match because no such match is ever drawn. So gold and silver are the only
// two objects a tournament in this game can produce, and eighteen is the whole cabinet, for ever.
//
// -------------------------------------------------------------------------------------------------
// ⚠ THE YEAR IS ARITHMETIC, AND IT MUST NOT BE `weekYear`
// -------------------------------------------------------------------------------------------------
// The ledger stores absolute career WEEKS. The year under a trophy is `seasonYear(floor(week / 52))`
// – the SEASON's display year, the same one the wrap-up popup, the week label and the Stats history
// table print, so a trophy dated '35 sits in the season the rest of the game calls 2035.
//
// `weekYear(week)` is the calendar year of that week's Monday and would be wrong here in a way that
// hides itself: a season is 52 weeks = 364 days, so its opening Monday drifts back a day and a
// quarter every year and crosses New Year at season 5 – `weekYear(208) === weekYear(260) === 2035`.
// Two consecutive seasons of titles would collapse into ONE year group and the count under the cup
// would be right while the years above it lied. That exact collision has already eaten a season out
// of the Stats table once (shared/dates.ts `seasonYear`, and the v16 migration that fixed it).
//
// -------------------------------------------------------------------------------------------------
// OVERFLOW: THE COUNT IS NEVER TRUNCATED, THE YEARS FOLD AT THREE
// -------------------------------------------------------------------------------------------------
// Grouping by year compresses a lot – five J30 titles in one season are one chip – but not enough.
// MEASURED on real careers (ten seasons, `advanceWeeks` end to end, three seeds): a dominant tier
// reaches EIGHT distinct year groups, and eight chips is four lines of text under a 128px plate on a
// 375pt phone. So:
//
//   * the TOTAL is a chip on the plate itself (`x8`) and is never folded, never truncated and never
//     behind a tap. "How many did she win" is the question the screen exists to answer;
//   * the YEARS fold at THREE, oldest first, with a `+5` chip standing for the rest;
//   * tapping the cell expands it and shows every year, wrapped. Tapping again folds it back.
//
// WHY A TAP RATHER THAN A WRAP OR A HARD CAP. A hard cap silently deletes history from a screen
// whose entire subject is history – the years she won at the start of her career are exactly the
// ones a parent wants back. A plain wrap makes the two cells in a row different heights and the
// whole shelf jumps every time a career crosses a year boundary. Expanding on demand keeps the
// resting layout uniform and loses nothing; and the cell was already the natural place to put it,
// because a WON cell is the only thing on this screen that has anything more to say.
//
// A LOCKED CELL IS NOT A BUTTON. It has nothing to expand, so it renders as a plain element with no
// press state, no focus ring and nothing for a screen reader to offer – the design's own logic
// (App.vue's deleted `soon` machinery: a control that cannot do anything must not look like one).
import { computed, ref } from 'vue'
import { useGameStore } from '../../stores/game'
import { seasonYear, WEEKS_IN_SEASON } from '../../shared/dates'
import { TIER_LADDER, TIER_SHORT, TIERS } from '../../engine/season/calendar'
// ⚠ THE URL BUILDER LEFT THIS FILE, AND THE CABINET IS STILL ITS FIRST CONSUMER (31.07, the podium
// slice). `artUrl` was a private helper here for exactly as long as this screen was the only place a
// trophy was drawn; the tournament finale now hangs the same eighteen objects on its podium, so the
// naming scheme moved to `art/trophies.ts` instead of being spelled a second time next to it. See
// that file for why — this app has already 404'd a champion splash on two hand-built filenames that
// disagreed. Nothing about what the cabinet DRAWS changed: same directory, same names, same webp.
import { trophyArtUrl, type TrophyMetal } from '../../art/trophies'
import type { TierId } from '../../engine/season/types'
import Card from '../ui/Card.vue'
import Eyebrow from '../ui/Eyebrow.vue'
import ScreenShell from '../ui/ScreenShell.vue'

const game = useGameStore()

/** How many year groups a folded cell shows before the rest become a `+N` chip. */
const YEARS_SHOWN = 3

/** The season a career week belongs to, as the year the whole game prints for it.
 *
 *  ⚠ `seasonYear(index)`, never `weekYear(week)` – see the header. `WEEKS_IN_SEASON` is the shared
 *  52 rather than a literal so this cannot drift from the engine's own season length. */
function yearOf(week: number): number {
  return seasonYear(Math.floor(week / WEEKS_IN_SEASON))
}

/** The owner's format: `3x'31`. Two-digit year, because it sits three-to-a-line under a 128px plate
 *  and a four-digit one costs a whole chip's width. */
function yearChip(year: number, count: number): string {
  return `${count}x'${String(((year % 100) + 100) % 100).padStart(2, '0')}`
}

/** Weeks -> the owner's chips, oldest first.
 *
 *  The ledger is ascending by construction (`finalizeTournament` pushes as weeks happen), so this
 *  neither sorts nor needs to: first seen is oldest, and a Map keeps insertion order. */
function chipsOf(weeks: number[]): string[] {
  const byYear = new Map<number, number>()
  for (const week of weeks) {
    const year = yearOf(week)
    byYear.set(year, (byYear.get(year) ?? 0) + 1)
  }
  return [...byYear].map(([year, count]) => yearChip(year, count))
}

interface Cell {
  key: string
  tier: TierId
  /** 'gold' = she won it; 'silver' = she LOST the final. The two are disjoint in the ledger. */
  metal: TrophyMetal
  /** the app's own word for the finish, so the cabinet and the finale never disagree. */
  label: string
  art: string
  count: number
  chips: string[]
  won: boolean
}

interface Shelf {
  tier: TierId
  short: string
  full: string
  cells: Cell[]
}

const shelves = computed<Shelf[]>(() => {
  const ledger = game.snapshot?.trophiesByTier
  return TIER_LADDER.map((tier) => {
    const row = ledger?.[tier]
    const titles = row?.titles ?? []
    const finals = row?.finals ?? []
    return {
      tier,
      short: TIER_SHORT[tier],
      full: TIERS[tier].label,
      cells: [
        {
          key: `${tier}-gold`,
          tier,
          metal: 'gold' as const,
          label: 'Champion',
          art: trophyArtUrl(tier, 'gold'),
          count: titles.length,
          chips: chipsOf(titles),
          won: titles.length > 0,
        },
        {
          // ⚠ SILVER IS THE FINALS SHE LOST, and it can only be that. `MilestoneType: 'final'` means
          // she REACHED one, which a title also does; the ledger's `finals` deliberately excludes
          // titles (`=== 1`, never `<= 1`) so this plate cannot light up on a week she WON.
          key: `${tier}-silver`,
          tier,
          metal: 'silver' as const,
          label: 'Runner-up',
          art: trophyArtUrl(tier, 'silver'),
          count: finals.length,
          chips: chipsOf(finals),
          won: finals.length > 0,
        },
      ],
    }
  })
})

const totals = computed(() => {
  let titles = 0
  let finals = 0
  for (const shelf of shelves.value) {
    titles += shelf.cells[0].count
    finals += shelf.cells[1].count
  }
  return { titles, finals }
})

/** The line under the title. Plural handled by hand: the app has no pluralisation helper and one
 *  title reading "1 titles" is exactly the kind of thing this screen cannot afford to get wrong.
 *
 *  "lost finals" rather than "runner-up", which is what the CELLS say. On a cell the word sits under
 *  a silver plate and names the object; on this line it would be counting them ("6 runner-up"), and
 *  that reads as a typo. Same fact, said the way each place can say it. */
const summary = computed(() => {
  const { titles, finals } = totals.value
  if (titles === 0 && finals === 0) return 'Empty for now – her first final puts something in it.'
  const parts: string[] = []
  if (titles > 0) parts.push(`${titles} ${titles === 1 ? 'title' : 'titles'}`)
  if (finals > 0) parts.push(`${finals} lost ${finals === 1 ? 'final' : 'finals'}`)
  return parts.join(' · ')
})

/** Which cells are showing all their years. Keyed per cell, so two open cells do not fight. */
const expanded = ref<Set<string>>(new Set())

function toggle(cell: Cell): void {
  if (!cell.won || cell.chips.length <= YEARS_SHOWN) return
  const next = new Set(expanded.value)
  if (!next.delete(cell.key)) next.add(cell.key)
  expanded.value = next
}

function isOpen(cell: Cell): boolean {
  return expanded.value.has(cell.key)
}

/** Foldable = won, and with more years than fit. Only these are buttons. */
function foldable(cell: Cell): boolean {
  return cell.won && cell.chips.length > YEARS_SHOWN
}

function shownChips(cell: Cell): string[] {
  return isOpen(cell) ? cell.chips : cell.chips.slice(0, YEARS_SHOWN)
}

function hiddenCount(cell: Cell): number {
  return isOpen(cell) ? 0 : Math.max(0, cell.chips.length - YEARS_SHOWN)
}

/** What a screen reader hears. The visual chips are dense shorthand (`3x'31`) that reads as noise
 *  when spoken, so the whole cell carries one honest sentence instead. */
function cellLabel(cell: Cell, shelf: Shelf): string {
  if (!cell.won) return `${shelf.full}, ${cell.label}: not won yet`
  const years = cell.chips.join(', ')
  return `${shelf.full}, ${cell.label}: ${cell.count} time${cell.count === 1 ? '' : 's'} – ${years}`
}
</script>

<template>
  <ScreenShell class="trophies">
    <template #header>
      <div class="trophy-topbar">
        <h1 class="trophy-title">Trophy cabinet</h1>
        <p class="trophy-sub">{{ summary }}</p>
      </div>
    </template>

    <div class="trophy-shelves">
      <Card v-for="shelf in shelves" :key="shelf.tier" as="section" class="trophy-shelf">
        <Eyebrow as="h2">{{ shelf.short }}</Eyebrow>
        <div class="trophy-pair">
          <component
            :is="foldable(cell) ? 'button' : 'div'"
            v-for="cell in shelf.cells"
            :key="cell.key"
            class="trophy-cell"
            :class="[`is-${cell.metal}`, { won: cell.won, open: isOpen(cell) }]"
            :type="foldable(cell) ? 'button' : undefined"
            :aria-expanded="foldable(cell) ? isOpen(cell) : undefined"
            :aria-label="cellLabel(cell, shelf)"
            @click="toggle(cell)"
          >
            <span class="trophy-plate">
              <!-- Decorative: the sentence a reader needs is on the cell, above. `loading="lazy"`
                   because eighteen plates is more than one screenful and the set is fetched at
                   runtime rather than precached. -->
              <img
                class="trophy-art"
                :class="{ locked: !cell.won }"
                :src="cell.art"
                alt=""
                aria-hidden="true"
                width="128"
                height="128"
                loading="lazy"
                decoding="async"
              />
              <span v-if="cell.won" class="trophy-count">x{{ cell.count }}</span>
            </span>
            <span class="trophy-metal">{{ cell.label }}</span>
            <span v-if="cell.won" class="trophy-years">
              <span v-for="chip in shownChips(cell)" :key="chip" class="trophy-year">{{ chip }}</span>
              <span v-if="hiddenCount(cell) > 0" class="trophy-year trophy-more">+{{ hiddenCount(cell) }}</span>
            </span>
            <span v-else class="trophy-years trophy-empty">Not yet</span>
          </component>
        </div>
      </Card>
    </div>
  </ScreenShell>
</template>

<style scoped>
/* =================================================================================================
   THE CABINET'S OWN STYLES
   =================================================================================================
   House rule (the redesign wave, restated by CalendarScreen): shared vocabulary lives in
   `src/style.css` or `src/components/ui/`, and what ONE screen composes lives scoped here. Every
   selector below has exactly one consumer. Deliberately NOT here because it is already shared: the
   card and its gradient (ui/Card.vue), the lime section heading (ui/Eyebrow.vue), the screen stack
   (ui/ScreenShell.vue).

   ⚠ NO NEW COLOUR IS INVENTED, and the one colour this screen chooses is chosen for meaning rather
   than for decoration. `--cat-entry` is the app's TOURNAMENT amber – it is the entry fee on the
   wallet and the tournament day on the calendar grid – and every object in this room came out of a
   tournament, so the count chip wears it. That is the same `цвет = смысл` rule the owner set for
   those two screens, applied to a third.

   ⚠ AND THERE IS DELIBERATELY NO COLOUR PER TIER. Nine rungs against a `--cat-*` family whose names
   mean coaching/travel/entry/gear would be nine arbitrary pairings – a private palette wearing the
   vocabulary's clothes, which is precisely what `tests/design-tokens.test.ts` rule B exists to stop.
   The tiers are told apart by their NAME and by the art, which is nine different cups.
   ================================================================================================= */

.trophy-topbar {
  padding: 0 0 14px;
}

.trophy-title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--ink);
}

.trophy-sub {
  margin: 2px 0 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-soft);
}

.trophy-shelves {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 12px;
}

.trophy-shelf {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Two cells, always – the shelf's shape does not depend on what is on it, which is what makes the
   room the same size on week 1 and week 500. */
.trophy-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  align-items: start;
}

.trophy-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 8px 6px 10px;
  border: 0;
  border-radius: var(--radius-card);
  background: none;
  color: inherit;
  font: inherit;
  text-align: center;
}

/* Only a foldable cell is a <button>, so only a foldable cell gets a press state. */
button.trophy-cell {
  cursor: pointer;
  transition: background-color var(--dur-slow) ease;
}

button.trophy-cell:hover,
button.trophy-cell.open {
  background: var(--accent-wash);
}

button.trophy-cell:active {
  background: var(--accent-fill);
}

/* THE PLATE. A fixed square, clipped, because the locked treatment blurs its contents past the
   edges – without `overflow: hidden` a locked cup smears over its neighbour and over the words
   under it. `max-width` (not `width`) so the plate is the same 128px on a 375pt phone and on a
   tablet: this number is what `SET_MAX_SIDE.trophies = 384` in scripts/optimize-art.mjs is derived
   from (128 x 3 = 384 device pixels on a 3x display), and a plate that grew with the viewport would
   make that cap a guess. */
.trophy-plate {
  position: relative;
  display: block;
  width: 100%;
  max-width: 128px;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: var(--radius-card);
}

.trophy-art {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* ⚠ THE LOCKED TREATMENT IS THE FEATURE, NOT A DISABLED STATE. The owner asked for «сложно было
   разглядеть» – hard to make out – so this is deliberately past the point of legibility: 9px of
   blur on a 128px plate leaves colour and mass and no silhouette. The `scale` is not decoration:
   a blur samples transparent pixels beyond the image edge, so an unscaled plate shows a soft grey
   frame around the smudge, which reads as a rendering fault. Saturation and brightness come down
   with it, because a full-colour smudge still gives the metal away and the metal is half the
   reveal. */
.trophy-art.locked {
  filter: blur(9px) saturate(0.32) brightness(0.62);
  opacity: 0.5;
  transform: scale(1.12);
}

/* HOW MANY, and it is never folded, never truncated and never behind a tap – see the header. */
.trophy-count {
  position: absolute;
  right: 2px;
  bottom: 2px;
  padding: 1px 7px;
  border-radius: var(--radius-pill);
  background: var(--cat-entry);
  color: var(--on-lime);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.01em;
}

.trophy-metal {
  font-size: var(--label-size);
  font-weight: 700;
  letter-spacing: var(--label-track);
  text-transform: uppercase;
  color: var(--ink-2);
}

.trophy-cell:not(.won) .trophy-metal {
  color: var(--ink-dim);
}

.trophy-years {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
  min-height: 16px;
  font-size: 11px;
  font-weight: 700;
  color: var(--ink-soft);
}

.trophy-year {
  font-variant-numeric: tabular-nums;
}

.trophy-more {
  color: var(--accent);
}

.trophy-empty {
  font-weight: 600;
  color: var(--ink-dim);
}
</style>

<script setup lang="ts">
// =================================================================================================
// THE SHELF, AS ITS OWN COMPONENT – the Money shop's markup (E-11, 28.09)
// =================================================================================================
//
// WHY THIS FILE EXISTS: `docs/review-principles-2026-09-26/05-ui.md`, E-11. MoneyScreen.vue was 4,913
// lines and 20 of the UI's 85 heavy template expressions, and the shop was the one region on it with
// state of its own. `composables/shop.ts` took the state and the arithmetic; this took the markup and
// the style block that paints it. `MoneyScreen.vue` owns the instance and passes it in.
//
// ⚠⚠ THE TEMPLATE AND THE STYLE RULES MOVED VERBATIM out of MoneyScreen.vue:2650-3141 and :3982-4912
// at `f0f538a5` – every owner ruling, every HTML comment, every declaration, byte for byte. THE ONE
// CHANGE IS FOUR SPACES OF DEDENT ON THE TEMPLATE, which is what a root block costs instead of a
// block nested inside `ScreenShell`; the style rules moved at column 0 and are byte-identical. Not a
// class, a word, a `v-if`, a predicate or a number moved. `diff -w` against those spans is empty, and
// the bundle's report carries the command.
//
// ⚠ THE CHAPTER GUARD IS NOT HOISTED, AND THAT IS A DECISION. Each of the five roots below still
// carries its own `screenTab === 'shop' && …`, exactly as it did on the screen, which is why
// `screenTab` arrives as a prop. Lifting the guard onto the component would have been a second change
// riding inside a move – and the point of this task is that the move can be read as a move.
//
// ⚠ NO CYRILLIC BELOW, AND THE TAG IS NOT SPELLED IN THIS SCRIPT EITHER. Both halves are
// `tests/template-copy-rules.test.ts`'s and both are load-bearing: it forbids Cyrillic anywhere in a
// template block, comments included, and it slices from the FIRST literal opening tag in the file –
// so one written out in a script comment hands the scan the whole script and every quote in it. The
// owner's rulings live in `composables/shop.ts`, where they always did relative to this markup.
import { computed } from 'vue'
// ⭐⭐ ROUND 30 #8 AND #10 – the naming box's cap is the ENGINE's constant, imported rather than
// retyped: `sanitiseAssetName` (world/assets.ts) states all four rules for a typed name and `buyAsset`
// applies them, so `maxlength` here only makes the cap FELT rather than applied silently. The whole
// argument, and the owner's two asks, are in `shopNamingNote` in `composables/shop.ts`.
import { ASSET_NAME_MAX_CHARS } from '../engine/world'
// ⭐ ROUND 34 #19 – the chart's four windows are a VALUE from the protocol, so the picker here and
// the series length in `shopView` read one table.
import { SHOP_PRICE_RANGE_MONTHS } from '../shared/protocol'
import { monthLabel, weekLabel } from '../shared/dates'
import { formatCents, formatCentsSigned } from '../shared/money'
// ⭐ ROUND 30 #5 – one picture per card. `shelfArtUrl`'s header carries the whole contract: a key with
// no painting yet returns null and the card simply draws without a band.
import { shelfArtUrl } from '../art/shelf'
import type { ShopState } from '../composables/shop'
import Card from './ui/Card.vue'
import Eyebrow from './ui/Eyebrow.vue'
import ProgressRing from './ui/ProgressRing.vue'
import SegmentedRow from './ui/SegmentedRow.vue'
import StatRow from './ui/StatRow.vue'

// ⚠ `screenTab` IS A `string` AND NOT MoneyScreen's `MoneyTab`, because a `<script setup>` block
// exports no types: the union is declared in that screen's own script and cannot be imported from it.
// The comparison below is against a literal either way, so a typo in it is a `vue-tsc` error and not
// a silent always-false.
const props = defineProps<{ state: ShopState; screenTab: string }>()

// ⚠ DESTRUCTURED ONCE, SO THE MARKUP DID NOT HAVE TO CHANGE. Every name below is a ref, a computed or
// a function created by `useShop` – stable identities, so taking them out of the object here costs no
// reactivity and lets the template read `shopRowsOf(family.key)` exactly as it read it on the screen.
// The alternative was prefixing four hundred lines of template with `state.`, which is a rewrite
// wearing a move's commit message.
const {
  shop,
  shopCheapest,
  shopRowsOf,
  shopHome,
  openShelfCategory,
  shelfTab,
  SHELF_TAB_OPTIONS,
  SHELF_CATEGORY_CARDS,
  shelfFamilies,
  rateLine,
  buildWaitLine,
  requiresLabel,
  isBuilding,
  buildProgress,
  buildRingLabel,
  formatUnits,
  shopRowPaidMeta,
  shopRowArtSide,
  shopRowArtWide,
  shopRowCornerAction,
  CHART_W,
  CHART_H,
  chartMonths,
  rangeLabel,
  chartPoints,
  chartPlot,
  chartSummary,
  chartMarks,
  openMark,
  toggleMark,
  openMarkOf,
  markLabel,
  markAlign,
  stakeDollars,
  stakeFieldLabel,
  isTopUp,
  canBuy,
  canSell,
  askBuy,
  askSell,
  nameDrafts,
  nameFor,
} = props.state

// ⚠ A COMPUTED RATHER THAN THE DESTRUCTURED PROP: `const { screenTab } = props` reads the value once
// and never again, so the five guards below would freeze on whichever chapter was open at mount.
const screenTab = computed(() => props.screenTab)
</script>

<template>
  <!-- ========================= 8. THE SHELF (v63) =========================
       docs/specs/the-shop-2026-08.md §2. The owner's own placement - a fourth chapter here
       rather than a new screen, because it is money and money already has a home.

       ⚠⚠ THE LOCKED ARM IS GONE - ROUND 29 PART TWO #6, HIS RULING. It used to print one
       sentence in place of the whole chapter until her first counting W-series result; his
       words and the reasoning are in `shopAlwaysOpenNote` in the script block, because Cyrillic
       may not appear in a template (tests/template-copy-rules.test.ts). What SURVIVES from that
       paragraph is the half that was never about the door: on an empty shelf the screen names
       the cheapest reachable thing and its price - "never a locked row, a progress bar or a
       teaser" - so there is no per-row lock anywhere below, and every price is on screen
       whether the family can reach it or not. A shop window is a thing you look into before you
       can afford it. -->
  <Card v-if="screenTab === 'shop' && shop && shopHome" class="money-panel money-shop">
    <Eyebrow as="h2">The shelf</Eyebrow>
    <p class="money-panel-note">
      This is the family's own money, and none of it is hers. Nothing here makes her better,
      faster or fitter - it is what the money becomes once the tennis has stopped needing it.
    </p>
    <!-- ⭐ THE EMPTY SHELF'S OWN SENTENCE: a real thing at a real price. -->
    <p v-if="shopCheapest" class="money-panel-note is-empty-shelf">
      You own nothing yet. The cheapest thing here is
      {{ shopCheapest.label }}, from {{ formatCents(shopCheapest.entryCents) }}.
    </p>
    <StatRow
      v-else
      class="money-row"
      label="What you own"
      :meta="`${shop.ownedCount} ${shop.ownedCount === 1 ? 'thing' : 'things'}`"
      :value="formatCents(shop.ownedValueCents)"
      tone="positive"
    />
  </Card>

  <!-- ============= 8a-bis. THE SIX CATEGORY CARDS, ON THE HOME ONLY (round 35 #3) =============
       His words - the six cards, the name at the foot in Sora, and his own row order - are in
       the script block beside `SHELF_CATEGORY_CARDS`, because Cyrillic may not appear in a
       template, strings AND comments (tests/template-copy-rules.test.ts).
       ⭐ TALL, NOT SQUARE, AND THE PAINTINGS DECIDED IT: his six category tiles are 332x512, so
       the card takes their ratio and the name sits at the foot of it in the heading face. -->
  <div v-if="screenTab === 'shop' && shop && shopHome" class="shelf-cats">
    <button
      v-for="cat in SHELF_CATEGORY_CARDS"
      :key="cat.key"
      type="button"
      class="shelf-cat"
      :title="cat.title"
      @click="openShelfCategory(cat.key)"
    >
      <img
        v-if="shelfArtUrl(cat.key)"
        class="shelf-cat-art"
        :src="shelfArtUrl(cat.key) ?? undefined"
        alt=""
        loading="lazy"
      />
      <span class="shelf-cat-scrim" aria-hidden="true"></span>
      <span class="shelf-cat-name">{{ cat.label }}</span>
    </button>
  </div>

  <!-- ============= 8a-ter. THE WAY BACK IS THE CHAPTER BUTTON (round 36 review #10) =========
       Round 35 #3's own arrow stood here. It is GONE, at every width, and what replaced it is
       not nothing: his words and the whole argument are on `openChapter` in the script block,
       where Cyrillic is allowed. In short - the door is the way out, so a second control beside
       it was a second answer to one question. -->

  <!-- ===================== 8a. THE SHELF'S OWN TABS =====================
       ⭐⭐ ROUND 30 #5 – his second clause: "The shelf as a plate on top, and under it the tabs
       in a row". Six segments, and the seventh thing on the shelf - the academy - is
       deliberately NOT one of them: it is a subdivision of Business and rides inside that tab.
       The map and his words in full are at `SHELF_TAB_OPTIONS` in the script, where Cyrillic is
       allowed and a template's is not.
       ⚠ ROUND 35 #10 IS AN EXPLICIT DO-NOT-TOUCH ON THIS ROW, so not a label, an order or a
       value below moved. What moved is only WHERE it is in the column: round 35 #3 put a home
       in front of the categories, so «the plate on top and the tabs under it» is now the plate,
       the six category cards, and then this row on the page a card opens. -->
  <SegmentedRow
    v-if="screenTab === 'shop' && shop && !shopHome"
    v-model="shelfTab"
    class="money-window money-subtabs shelf-tabs"
    :options="SHELF_TAB_OPTIONS"
    group-label="Which part of the shelf"
  />

  <!-- ⭐⭐ ROUND 43 #5 – WHOSE MONEY THE FIGURES BELOW ARE. His words, ruled 16.09 as variant C of
       three, and his reason for asking is in `shelfShareNote` in the script block. The two
       percentages are the SNAPSHOT's (`shop.kidBusinessSharePct`), never literals: her share
       ramps with age, so a hard-coded pair would lie to a nineteen-year-old – which is the same
       defect this line exists to remove.
       ⚠ IT HIDES AT ZERO, and that is a fact rather than a guard: before the ramp opens she takes
       nothing from the shelf, the family's figures ARE the whole income, and there is nothing to
       explain. -->
  <p
    v-if="screenTab === 'shop' && shop && !shopHome && shelfTab === 'business' && shop.kidBusinessSharePct > 0"
    class="shelf-share-line"
  >
    She takes {{ shop.kidBusinessSharePct }}% of what these earn; the figures below are the
    family's {{ 100 - shop.kidBusinessSharePct }}%. A holding's worth is the whole business.
  </p>

  <!-- ===================== 8b. THE SHELF ITSELF, CARD BY CARD =====================
       ⭐⭐ ROUND 30 #5 – "the cards lie with no shared backing, roughly as on the Season screen".
       This is the Season feed's own arrangement, and it is a real change rather than a restyle:
       every rung on the shelf used to sit inside ONE card, so the page had a plate behind a
       plate behind a row. Now each rung IS a card, laid straight on the page, exactly as
       `.event-cards` lays the calendar - `Card variant="photo"`, so a painting can bleed into
       it from behind the words the moment his art lands.
       ⚠ THE FAMILY HEADING AND ITS NOTE STAY, WORD FOR WORD, and they are OUTSIDE the cards:
       they are the sentence that says what a family is FOR (the spec's §3), and under Business
       they are also what separates the brand from the academy under it. -->
  <div v-if="screenTab === 'shop' && shop && !shopHome" class="shelf-feed">
    <div v-for="family in shelfFamilies" :key="family.key" class="shop-family">
      <div class="shop-family-head">{{ family.title }}</div>
      <p class="shop-family-note">{{ family.note }}</p>
      <!-- ⭐⭐ ROUND 34 #18 – WHAT THE FAMILY ALREADY OWNS IS IN A FRAME, AND IT IS THE COACH'S
           FRAME. His words are in `shopOwnedFrameNote` in the script block (no Cyrillic in a
           template). `is-owned` is the whole of it; the three declarations it paints are lifted
           from `.cm-row.current` in style.css, which is the frame he is pointing AT.
           ⚠ THE PREDICATE IS THE CARD'S OWN, not a second one: `row.valueCents !== null` is
           exactly what already decides whether this card draws its owned half or its shop
           window, so a rung can never be framed and priced at the same time. -->
      <!-- ⭐⭐ ROUND 35 #5-#9 – THE FRAMED ROW. `shopRowArtSide` is the whole of it: it returns
           the side this family's painting stands on, or null for a rung with no painting, and
           the class it puts on the card is what turns the band above the words into a band
           beside them. A rung with no art is untouched and draws exactly as it did. -->
      <!-- ⭐⭐ ROUND 36 REVIEW #11, #12 AND #13 – TWO MORE CLASSES AND NOT ONE MORE ELEMENT.
           `shop-row--art-wide` carries the owner's own `width: 50%` / `calc(45% + 12px)` on the
           four families the item names; `shop-row--corner-action` sends the buy/sell control to
           the card's bottom-right corner on the two families items 12 and 13 name. Both
           predicates, both quotes and the reasoning are on `shopRowArtWide` and
           `shopRowCornerAction` in the script block, which is where Cyrillic is allowed.
           ⚠⚠ AND THE NOTE IS AN HTML COMMENT RATHER THAN A `//` ONE INSIDE THE BINDING, WHICH
           IS A RULE AND NOT A STYLE. `tests/coach-voice.test.ts` (R15-7, «no surface guesses a
           professional's gender») strips every HTML comment out of a template before it scans,
           and cannot see a `//` line inside an expression - so the first draft of this slice put
           a prose note in the class array, wrote the word it forbids, and reddened that file by
           name.
           ⚠⚠ AND NEITHER HTML COMMENT DELIMITER MAY BE SPELLED INSIDE ONE. Round 36 P2-1, and
           it is this comment's own history rather than a precaution: the paragraph above used to
           QUOTE the opening and closing delimiters in order to name the thing it is about. HTML
           comments do not nest, so that quoted terminator closed this comment two and a half
           lines early and what followed became a TEXT NODE - inside the `v-for` over families,
           so the rest of that paragraph rendered under EVERY family heading on EVERY page of
           the shop, which is where the owner found it. Name them in words, as here.
           `tests/template-comment-terminators.test.ts` parses every component and forbids the
           shape, and the mounted arm in `tests/component/round36-pass2-shop-recap.test.ts`
           reads the six shop pages back. -->
      <Card
        v-for="row in shopRowsOf(family.key)"
        :key="row.id"
        variant="photo"
        class="shop-row"
        :class="[
          shopRowArtSide(row) ? `shop-row--art-${shopRowArtSide(row)}` : undefined,
          {
            'is-owned': row.valueCents !== null,
            'shop-row--art-wide': shopRowArtWide(row),
            'shop-row--corner-action': shopRowCornerAction(row),
          },
        ]"
      >
        <!-- ⭐ ROUND 30 #5 – "each card gets its own art". Null until his painting lands, and
             until then the card simply has no band: `shelfArtUrl`'s header carries the contract,
             which is `vacationArtUrl`'s, for the reason it was written. -->
        <div v-if="shelfArtUrl(row.id)" class="card-art shop-row-art">
          <img :src="shelfArtUrl(row.id) ?? undefined" alt="" />
          <span class="card-art-scrim" aria-hidden="true"></span>
          <!-- ROUND 41 #28 – the build ring, top-right of the painting, only while the engine
               says the thing is still being built. The corner choice is the coordinator's
               (the scrim's name gradient owns the bottom) – one line to move if his eye says
               otherwise. ⚠ AND NEVER AT 100%: a full circle is not progress, it is a delivery
               the tick has not banked yet (the stale over-due load) – the tile goes clean
               instead of wearing a finished dial. His second word on the item, verbatim, is on
               the script side above `buildProgress` (this file's templates carry no Cyrillic –
               tests/template-copy-rules.test.ts). -->
          <ProgressRing
            v-if="isBuilding(row) && row.buildWeeks && buildProgress(row) < 1"
            class="build-ring"
            :size="36"
            :value="buildProgress(row)"
            :label="buildRingLabel(row)"
            on-art
          />
        </div>
        <div class="shop-row-body">
          <div class="shop-row-head">
            <span class="shop-row-name">{{ row.label }}</span>
            <span class="shop-row-rate" :class="{ 'is-down': row.annualRatePct < 0 }">
              {{ rateLine(row) }}
            </span>
          </div>
          <p class="shop-row-blurb">{{ row.blurb }}</p>
          <!-- ⭐⭐⭐ ROUND 34 #19 – THE FUND'S OWN CHART. His words, the four windows and the
               decision NOT to store a series are in `shopChartNote` in the script block and on
               `ShopRowView.priceHistory` (no Cyrillic in a template).
               ⚠ THE PREDICATE IS THE ENGINE'S: a row carries `priceHistory` when it rides the
               market, so this screen never decides which rung has a chart. It is drawn whether
               or not the family owns one, exactly like the unit price it plots. -->
          <div v-if="row.priceHistory" class="fund-chart">
            <div class="fund-chart-ranges" role="group" aria-label="How far back the chart goes">
              <button
                v-for="months in SHOP_PRICE_RANGE_MONTHS"
                :key="months"
                type="button"
                class="fund-chart-range"
                :class="{ 'is-on': chartMonths === months }"
                :aria-pressed="chartMonths === months"
                @click="chartMonths = months"
              >
                {{ rangeLabel(months) }}
              </button>
            </div>
            <!-- ⚠ TWO POINTS ARE THE FLOOR FOR A LINE, and a first-season career has fewer –
                 the series is as long as the months that have actually happened. The honest
                 sentence is drawn instead of an empty box, and nothing is back-filled. -->
            <!-- ⭐⭐⭐ ROUND 41 #22 (v78) – THE PURCHASE MARKS AND THEIR MICRO-POPUP. His words
                 and the geometry's own reasoning are in `shopMarksNote` and `chartMarks` in the
                 script block (no Cyrillic in a template).
                 ⚠ THE WRAPPER EXISTS FOR THE POPUP, which is absolutely positioned against it.
                 `.tb-card--photo` sets `overflow: hidden`, so a bubble anchored any further out
                 would be cut off by the card – see `markAlign` for the geometry that makes
                 that impossible by construction rather than by a clamp. -->
            <div v-if="chartPlot(row)" class="fund-chart-plot-wrap">
              <svg
                class="fund-chart-plot"
                :viewBox="`0 0 ${CHART_W} ${CHART_H}`"
                role="img"
                :aria-label="chartSummary(row)"
              >
                <polyline class="fund-chart-line" :points="chartPlot(row)!.line" />
                <circle
                  v-for="(dot, i) in chartPlot(row)!.dots"
                  :key="i"
                  class="fund-chart-dot"
                  :cx="dot.x"
                  :cy="dot.y"
                  r="2"
                />
                <!-- ⚠ THE RING IS DRAWN AND THE BUTTON IS NOT: an SVG `<circle>` is not focusable
                     and is a 4px tap target, so the mark is PAINTED here and the control that
                     opens it is a real HTML button below, sized for a thumb. -->
                <circle
                  v-for="mark in chartMarks(row)"
                  :key="mark.key"
                  class="fund-chart-mark"
                  :class="{ 'is-open': openMark === mark.key }"
                  :cx="mark.x"
                  :cy="mark.y"
                  r="3.5"
                />
              </svg>
              <!-- ⚠ ONE BUTTON PER MARK, over the plot. `aria-expanded` says whether its bubble
                   is open, which is what a screen reader needs from a disclosure. -->
              <button
                v-for="mark in chartMarks(row)"
                :key="mark.key"
                type="button"
                class="fund-chart-hit"
                :style="{ left: `${(mark.x / CHART_W) * 100}%`, top: `${(mark.y / CHART_H) * 100}%` }"
                :aria-expanded="openMark === mark.key"
                :aria-label="markLabel(mark.buy)"
                @click="toggleMark(mark.key)"
                @mouseenter="openMark = mark.key"
                @mouseleave="openMark = null"
                @focus="openMark = mark.key"
                @blur="openMark = null"
                @keydown.esc="openMark = null"
              ></button>
              <!-- ⚠ ONE BUBBLE, NOT ONE PER MARK. A `v-for` with `v-show` would leave a hidden
                   node per purchase in the tree for a screen reader to walk past, and a career
                   that has topped up thirty times would carry thirty of them. -->
              <div
                v-if="openMarkOf(row)"
                class="fund-chart-poprow"
                :style="{ justifyContent: markAlign(openMarkOf(row)!) }"
              >
              <div class="fund-chart-pop" role="status">
                <span class="fund-chart-pop-top">
                  {{ monthLabel(openMarkOf(row)!.buy.week) }} &ndash; {{ formatCents(openMarkOf(row)!.buy.cents) }}
                </span>
                <span
                  v-if="openMarkOf(row)!.buy.units !== null && openMarkOf(row)!.buy.unitPriceCents !== null"
                  class="fund-chart-pop-sub"
                >
                  {{ formatUnits(openMarkOf(row)!.buy.units!) }} units at
                  {{ formatCents(openMarkOf(row)!.buy.unitPriceCents!) }} each
                </span>
              </div>
              </div>
            </div>
            <p v-else class="fund-chart-empty">One month of prices so far &ndash; the chart starts next month.</p>
            <div v-if="chartPlot(row)" class="fund-chart-axis">
              <span>{{ monthLabel(chartPoints(row)[0].week) }}</span>
              <span class="fund-chart-span">
                {{ formatCents(chartPlot(row)!.low) }} &ndash; {{ formatCents(chartPlot(row)!.high) }}
              </span>
              <span>{{ monthLabel(chartPoints(row)[chartPoints(row).length - 1].week) }}</span>
            </div>
          </div>
          <!-- ⭐⭐ ROUND 29 #5 – THE THIRD NUMBER (spec §3f): what it cost, what it loses, and
               what it takes every week to keep. It is on the row whether the family owns one or
               not, because it is the half of the price a shop window normally hides – «the
               weekly figure is what appears in the ledger, beside the masseur, which is where
               the decision actually lives». The engine computed it (`upkeepCents`); this screen
               does not divide a percentage by a year. -->
          <p v-if="row.upkeepCents > 0" class="shop-row-upkeep">
            {{ formatCents(row.upkeepCents) }} a week to keep
          </p>
          <!-- ⭐⭐ ROUND 29 PART FOUR P7 – THE MIRROR LINE: what an owned earner brings in RIGHT
               NOW, the engine's own figure (`incomeCents`, the same arithmetic the till banks).
               Drawn only when it is really flowing – a brand nobody knows and a stage on order
               both read $0 and say nothing. Deliberately NOT netted against the upkeep line
               above (round 29 #10): two facts, two sentences. -->
          <p v-if="row.incomeCents > 0" class="shop-row-earning">
            Brings in {{ formatCents(row.incomeCents) }} a week right now
          </p>
          <!-- ⭐ §3f – THE WAIT, ON THE ROW, BEFORE THE ORDER IS PLACED. Not a teaser and not a
               lock: the price is beside it and the control is pressable. -->
          <p v-if="row.buildWeeks > 0 && row.valueCents === null && !isBuilding(row)" class="shop-row-wait">
            {{ buildWaitLine(row) }}
          </p>
          <!-- ⭐ §3g – THE STAGE UNDER IT, WHEN THAT STAGE IS NOT BUILT. Again not a lock and
               not a bar: the price stays on screen and the control is simply not pressable,
               which is §2's rule read one storey up. -->
          <p v-if="requiresLabel(row)" class="shop-row-wait">
            {{ requiresLabel(row) }} has to come first.
          </p>
          <!-- ⭐⭐ ROUND 29 #5, §3f – ORDERED, AND NOT HERE YET. «Between those two weeks the
               player owns a CONTRACT, not a boat», so there is nothing to value and nothing to
               sell – `sellableAsset` refuses the same week, so this is not the gate, it is the
               honest face of it (R10-16: a disabled control and a refused click tell one
               story). What the row says instead is the date, which is the whole point of a
               commission. -->
          <!-- ⚠⚠ ROUND 41 #2 – THE `paid $N` META IS GONE. The owner's 12.09 report (quoted
               verbatim on the ledger item and in the script block above `SHELF_NO_PAID_META` -
               not here, the copy law bans Cyrillic inside a template, comments included) reads
               this exact caption as the leftover round 39 #4 removed from the owned card
               above; his report supersedes that reasoning. No `:meta` at all now, rather than
               an empty one - StatRow's own rule
               (`v-if="meta || $slots.meta"`) is what keeps a blank prop from drawing a hairline
               nobody asked for. UNCONDITIONAL, so water (boats) and air (planes) both lose it at
               once - the only two families that reach this card today. -->
          <div v-if="isBuilding(row)" class="shop-row-owned is-building">
            <StatRow
              class="money-row"
              label="On order"
              :value="weekLabel(row.readyWeek ?? 0)"
              tone="plain"
            />
            <p class="shop-row-change">It cannot be sold before it is delivered, and it costs nothing to keep until then.</p>
          </div>
          <!-- OWNED: what they paid, what it is worth, and the difference as ONE figure the
               engine computed. This screen subtracts nothing. -->
          <div v-else-if="row.valueCents !== null" class="shop-row-owned">
            <!-- ⭐⭐ ROUND 29 #9 – `tone="plain"`, AND A DEPRECIATED VALUE IS NOT AN ERROR.
                 The owner's words and the reasoning are in `shopToneNote` in the script block,
                 because Cyrillic inside a template is forbidden - strings AND comments
                 (tests/template-copy-rules.test.ts). In short: `negative` means MONEY OUT, this
                 figure is a BALANCE, and `plain` is StatRow's own word for a balance. -->
            <!-- ⚙ ROUND 35 #7 – ON A HOUSE THE `paid $N` IS GONE AND THE ROW CARRIES THE
                 CURRENT PRICE ALONE. It is his own second spelling, ruled on 03.09; the
                 reasoning and the quote are on `shopRowPaidMeta` in the script block, where
                 Cyrillic is allowed. Nothing about the VALUE changed - it was always the
                 current worth - and the gain still has its own line under this one. -->
            <StatRow class="money-row" label="Worth now" :meta="shopRowPaidMeta(row)" :value="formatCents(row.valueCents)" tone="plain" />
            <!-- ⭐⭐⭐ ROUND 30 #14 – THE THREE FIGURES THE DECISION NEEDS. His words and the
                 reasoning are in `shopUnitsNote` in the script block (no Cyrillic in a template).
                 Every number is the engine's: `shopView` counted the units, divided the cost by
                 them and priced the week. This screen divides nothing. -->
            <p v-if="row.unitsHeld !== null && row.avgUnitPriceCents !== null && row.unitPriceCents !== null" class="shop-row-units">
              {{ formatUnits(row.unitsHeld) }} units &ndash; bought at {{ formatCents(row.avgUnitPriceCents) }} each, {{ formatCents(row.unitPriceCents) }} now
            </p>
            <!-- ⭐⭐⭐ ROUND 30 #8 AND #10 – WHAT THEY CALLED IT. See `shopNamingNote` in the
                 script block (no Cyrillic in a template). One line, the engine's own string,
                 and the row's own label above it is untouched. -->
            <p v-if="row.name" class="shop-row-given-name">Trading as {{ row.name }}</p>
            <p class="shop-row-change" :class="{ 'is-down': (row.changeCents ?? 0) < 0 }">
              {{ formatCentsSigned(row.changeCents ?? 0) }}
              <span v-if="row.changePct !== null">since you bought it ({{ row.changePct }}%)</span>
              <span v-else>since you bought it</span>
            </p>
            <!-- ⭐⭐ ROUND 29 #11 – PUT MORE IN. His words are in `shopTopUpNote` in the
                 script block (no Cyrillic in a template). The control is drawn for an 'open'
                 rung and never for a car; same input, same minimum and same engine command as
                 the opening stake, and `buyAsset` re-validates every one of them. -->
            <!-- ⭐⭐ ROUND 34 #20 – THE CONTROL STANDS BESIDE ITS OWN INPUT. His words and the
                 reasoning are in `shopInlineActionNote` in the script block (no Cyrillic in a
                 template). The `.shop-stake-row` wrapper is the ENTIRE change: the label, the
                 input inside it and the button that acts on it were three stacked blocks and are
                 now one baseline-aligned row. Not one word, minimum, command or `v-if` moved. -->
            <!-- ⭐⭐⭐ ROUND 35 #12 – ONE FIELD, TWO CONTROLS, ONE LINE. His words and the whole
                 reasoning are in `shopOneFieldNote` in the script block (no Cyrillic in a
                 template). Round 34 #20 put each control beside its OWN input and left two fields
                 on a holding; the frame he drew (W-shop-investments.png) has one, with both
                 buttons after it. `stakeDollars` is now the single value and `stakeCentsFor` /
                 `sellCentsFor` are its two readers – neither predicate, command or minimum
                 moved. ⚠ THE ROW IS DRAWN UNCONDITIONALLY, round 34 #20's own reason: a fixed
                 rung has no amount to type, so it holds the Sell button alone and lays out
                 exactly as the bare button did. -->
            <div class="shop-stake-row">
              <!-- ⚠ `min` IS THE BUY FLOOR AND THERE IS DELIBERATELY NO `max`, which is the one
                   asymmetry a shared field creates and is left rather than "fixed". Both
                   attributes were always ADVISORY – `canBuy` / `canSell` decide what is
                   pressable and the engine re-validates every amount with its own sentence – and
                   a field driving two verbs has no single valid range: the buy has a floor, the
                   sale has a ceiling. `min` is kept because it is what the placeholder promises;
                   a `max` is NOT added back, because it would mark a legitimate part sale below
                   the entry minimum as invalid. Nothing styles `:invalid`, so neither attribute
                   can paint a wrong answer on screen. -->
              <input
                v-if="isTopUp(row)"
                v-model="stakeDollars[row.id]"
                class="shop-stake-input"
                type="number"
                inputmode="numeric"
                :min="Math.round(row.entryCents / 100)"
                step="100"
                :placeholder="String(Math.round(row.entryCents / 100))"
                :aria-label="stakeFieldLabel(row)"
              />
              <button v-if="isTopUp(row)" class="shop-action" :disabled="!canBuy(row)" @click="askBuy(row)">
                Add more
              </button>
              <button class="shop-action" :disabled="!canSell(row)" @click="askSell(row)">
                Sell
              </button>
            </div>
          </div>
          <!-- NOT OWNED: the price, and a control that is pressable or is not. -->
          <div v-else class="shop-row-buy">
            <!-- ⭐⭐ ROUND 30 #14 – THE ENTRY PRICE, BEFORE THERE IS A HOLDING. See
                 `shopUnitsNote` in the script block. -->
            <p v-if="row.unitPriceCents !== null" class="shop-row-units">
              One unit is {{ formatCents(row.unitPriceCents) }} this week
            </p>
            <label v-if="row.stake === 'open'" class="shop-stake">
              <span class="shop-stake-label">
                How much, from {{ formatCents(row.entryCents) }}
              </span>
              <input
                v-model="stakeDollars[row.id]"
                class="shop-stake-input"
                type="number"
                inputmode="numeric"
                :min="Math.round(row.entryCents / 100)"
                step="100"
                :placeholder="String(Math.round(row.entryCents / 100))"
              />
            </label>
            <span v-else class="shop-row-price">{{ formatCents(row.entryCents) }}</span>
            <!-- ⭐⭐⭐ ROUND 30 #8 AND #10 – NAME IT. See `shopNamingNote` in the script block for
                 his words (no Cyrillic in a template) and for the four rules the typed value is
                 bound by. The chips WRITE INTO THE FIELD rather than sitting beside it, so there
                 is exactly one value on screen and «I picked a chip but there was text in the
                 box» is not a state this control can be in. The field starts on the first
                 suggestion, so a player who never touches it still buys a brand with her name
                 on it. -->
            <div v-if="row.nameOptions.length > 0" class="shop-naming">
              <span class="shop-stake-label">What is it called</span>
              <div class="shop-naming-chips">
                <button
                  v-for="option in row.nameOptions"
                  :key="option"
                  type="button"
                  class="shop-naming-chip"
                  :class="{ 'is-on': nameFor(row) === option }"
                  @click="nameDrafts[row.id] = option"
                >
                  {{ option }}
                </button>
              </div>
              <input
                :value="nameFor(row)"
                class="shop-stake-input shop-naming-input"
                type="text"
                :maxlength="ASSET_NAME_MAX_CHARS"
                placeholder="or type your own"
                aria-label="What it is called"
                @input="nameDrafts[row.id] = ($event.target as HTMLInputElement).value"
              />
            </div>
            <!-- ⭐ §3f – A COMMISSIONED THING IS ORDERED, NOT BOUGHT, and the verb on the control
                 is the one difference the player can see before he presses it. -->
            <button class="shop-action" :disabled="!canBuy(row)" @click="askBuy(row)">
              {{ row.stake === 'open' ? 'Put it in' : row.buildWeeks > 0 ? 'Order it' : 'Buy it' }}
            </button>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<style scoped>
/* =================================================================================================
   ⚠⚠ FOUR OBJECTS ARE COPIED HERE FROM MoneyScreen.vue'S OWN BLOCK, AND THE COPY IS NOT A CHOICE.
   =================================================================================================
   A `<style scoped>` block paints the component it is written in. When the shelf's markup left
   MoneyScreen.vue, `.money-panel`, `.money-panel-note`, `.money-window` and `.money-subtabs` stayed
   behind with the four chapters that still use them – so the shelf plate and the shelf's own switcher
   would have rendered unstyled, which is a change the class list cannot see and the render-identity
   net measures (`tests/component/principles-e11-shop-identity.test.ts`, the computed-style probes).
   The declarations below are byte-identical to the ones that remain there.

   ⚠ WHICH FOUR, AND HOW THEY WERE FOUND – by probe rather than by eye: every top-level selector in
   MoneyScreen's block was matched against the shop's own DOM subtrees across all six shelf pages, and
   exactly these four matched markup on BOTH sides of the seam. Nothing inside the shelf's own span
   matched anything outside it.

   ⚠ AND THE DUPLICATION IS T6.4's, NOT A DEBT THIS FILE CREATES. F-09 hoists shared CSS objects into
   `src/style.css` under neutral names this wave, and the same shape is already in the review's own
   table one row up (`SupportStaffTab.vue` carries a copy of the coach strip's mask). The moment those
   four are objects in `style.css`, both copies read one rule and these five blocks go.
   ⚠ `src/style.css` IS NOT TOUCHED FROM HERE, deliberately: it is global, so every rule the shelf
   reads out of it keeps matching this component unchanged, and moving one would collide with T6.4.
   ================================================================================================= */
.money-panel {
  margin-top: 14px;
}

.money-panel-note {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--ink-soft);
  text-wrap: pretty;
}

/* --- 3. THE PERIOD ---------------------------------------------------------------------------- */

.money-window {
  margin-top: 14px;
}

/* ⭐⭐ ROUND 30 #5 – THE SECOND ROW OF TABS, INSIDE A CHAPTER. It is `.money-window`'s object (the
   Spending period switcher he named as the model) with one addition, and the addition is a 375px
   argument rather than a taste one.

   ⚠⚠ SIX SEGMENTS DO NOT FIT ON A PHONE AT THE SHARED PILL METRICS. `.tab-pill` is 13px type in
   6px/16px padding, which puts Invest/Cars/Property/Business/Water/Air at roughly 450px against the
   343px a 375px phone actually has inside `--app-pad-x`. `.tab-row` is a bare `display: flex` with
   no wrap, so the overflow would push the DOCUMENT sideways - and "at 375 px the app does not scroll
   sideways" is one of the two invariants `e2e/responsive.spec.ts` has held since it was written.

   The row is therefore allowed to WRAP rather than to overflow, and the pills are tightened so that
   on the phone it does not have to. Both halves are wanted: the tightening is what keeps his «в ряд»
   true at the width he plays at, and the wrap is the guarantee that a longer word, a larger font or
   a 320px screen costs a second line instead of a broken page. Verified in a real browser at 375px
   by `e2e/responsive.spec.ts`, which now opens both chapters. */
.money-subtabs {
  flex-wrap: wrap;
  row-gap: 4px;
  border-radius: var(--radius-card);
}

.shelf-tabs :deep(.tab-pill) {
  padding-inline: 9px;
  font-size: 12px;
}

/* ============================== THE SHELF (v63) ==============================
   The kit block's own idiom one card down, deliberately: a family, its rows, a price and a control.
   Nothing here spells a hex - every colour is a token from src/style.css. */
.money-shop .is-empty-shelf {
  color: var(--ink);
}

/* ⭐⭐ ROUND 30 #5 – THE FEED, and it is the Season screen's arrangement rather than a card full of
   rows. `.event-cards` on SeasonScreen is a 12px-gap column of cards laid straight on the page; so
   is this. The 14px above it is the same gap `.money-tabs` leaves under the chapter picker, so the
   first card opens the same distance below the tab row as the first block of every other chapter. */
.shelf-feed {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 14px;
}

/* =================================================================================================
   ⭐⭐ ROUND 35 #3 – THE SIX CATEGORY CARDS ON THE SHOP'S FRONT DOOR
   =================================================================================================
   «выбором категорий из 6 карточек (название категории встает на карточку внизу шрифтом Sora,
   первый ряд invest, business, property, остальное 2й ряд)». Three across and two down, which is
   the mockup's own grid; the ORDER is his and not the mockup's, and it is set in the markup.

   ⭐⭐ TALL, AND THE PAINTINGS ARE THE SPECIFICATION: «давай на главной магазина вот эти 6 основых
   карточек сделаем не квадратными, как в макете, а высокими (смотри соотношение сторон картинок),
   на них как раз вниз хорошо надписи встанут.» His six category tiles are 332x512 - ratio 0.6484 -
   against the item tiles' 512x512, and `aspect-ratio` below is those two numbers rather than a
   rounding of them, so the card is the shape of the picture in it and the crop is nil.
   MEASURED at 375px: the shell leaves 343px of content, three columns and two 8px gaps put a card
   at 109px x 168.1px, and the two rows stand 344.2px tall. `tests/component/round35-shop.test.ts`
   re-measures that off the real cascade rather than trusting this arithmetic.

   ⚠ IT IS A `button`, WHICH IS WHY THE RESET IS EXPLICIT. A tile is a control - it opens a page -
   and a `div` with a click handler is not reachable from a keyboard. The UA's own border, padding,
   background and font would otherwise arrive with it. */
.shelf-cats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 14px;
}

/* ⭐⭐⭐ ROUND 36 PHASE 4 – THE FRONT DOOR STOPS GROWING, AND THIS IS THE ONE BLOCK IN THE APP THAT
   GOT BIGGER AND TALLER AS THE WINDOW DID. A `1fr` column and a fixed `aspect-ratio` is a card whose
   HEIGHT is its width times 1.542, so widening the reading column raised the whole grid off the
   bottom of the screen. Measured on the shipped build, one card and then the page:

     375   109 x 168 px   grid  344px   page 1057px
     768   240 x 370 px   grid  748px   page 1297px
     900   284 x 438 px   grid  884px   page 1433px
    1280   311 x 479 px   grid  966px   page 1534px

   – so the shop's front door is 477px TALLER on a 1280px monitor than on a 375px phone, which is
   the opposite of what a wider screen is for. Every other screen in this round got shorter.

   ⚠ THE CAP AND NOT A FOURTH COLUMN, on purpose. His layout for these six is explicit and it is a
   3x2: «первый ряд invest, business, property, остальное 2й ряд» (round 35 #3), and the tall shape
   is his too – «сделаем не квадратными, как в макете, а высокими (смотри соотношение сторон
   картинок)». Re-flowing six tiles into one row of six would change the arrangement he specified;
   capping the grid keeps his 3x2 and his ratio exactly and only stops the tiles becoming posters.
   640 is the width this round already caps a reading block at (D18's «Her own account», his own
   «посмотрите, чтобы красиво было»), and it puts the tile at 208px – nearly twice the phone's, and
   the whole door back inside one screenful. ⭐ IF HE WANTS THE SIX IN ONE ROW ON A DESKTOP that is
   `grid-template-columns` here and nothing else; it is D25 and it is his call, not ours.

   ⚠⚠ AND `width: 100%` IS LOAD-BEARING, NOT BELT-AND-BRACES – phase 3's own defect, met again on a
   second screen. This grid is an item of a flex column, and A GRID OR FLEX ITEM WITH AUTO INLINE
   MARGINS DOES NOT STRETCH: the auto margins beat the container's stretch, the box falls back to
   max-content, and the six tiles – which are `width: 100%` of an indefinite width – collapse.
   Measured on the first build of this rule: `.shelf-cats` came out **22px wide with 2 x 3px tiles**
   at 768 and at every width above it. `src/style.css`'s `#app:has(> nav.tab-bar) > .app-content`
   carries the same sentence about the same mistake. */
@media (min-width: 768px) {
  .shelf-cats {
    width: 100%;
    max-width: var(--read-max);
    margin-inline: auto;
  }
}

.shelf-cat {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 332 / 512;
  margin: 0;
  padding: 0;
  overflow: hidden;
  border: var(--stroke-hair) solid var(--card-edge);
  border-radius: var(--radius-card);
  background: var(--card-bottom);
  font: inherit;
  color: inherit;
  cursor: pointer;
}

.shelf-cat-art {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* The name has to be readable on whatever the bottom of the painting happens to be, so the foot of
   the tile darkens under it. Same idea and the same direction as `.card-art-scrim` above, carried
   further because this text sits ON the picture rather than under it. */
.shelf-cat-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgb(0 0 0 / 0%) 42%, rgb(0 0 0 / 78%) 100%);
}

/* ⭐ «название категории встает на карточку внизу шрифтом Sora» – at the foot, in the heading face,
   which is what `--font-heading` is (src/style.css: «Sora on every heading»). */
.shelf-cat-name {
  position: absolute;
  right: 6px;
  bottom: 7px;
  left: 6px;
  font-family: var(--font-heading);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: -0.015em;
  line-height: 1.15;
  text-align: center;
  color: var(--ink);
}

/* ⚙ ROUND 36 REVIEW #10 – `.shelf-nav` AND `.shelf-back` ARE GONE WITH THE CONTROL THEY PLACED.
   The way out of a category is the `Shop` chapter button now; the reasoning is on `openChapter` in
   the script block, where his words can be quoted. */

/* ⚠ THE HAIRLINE ABOVE A FAMILY IS GONE WITH THE PLATE IT DIVIDED. It was a rule INSIDE one card,
   separating a family from the one above it; on a page of free-standing cards there is nothing on
   either side of it to divide, and a line drawn across the page between two cards reads as a
   separator the design does not have. The heading and its note are the divider now, which is what
   they always were doing. */
.shop-family {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ⭐⭐ ROUND 36 PHASE 4 – THE SHELF'S ROWS GO TWO TO A ROW, AND IT IS THE COACH MARKET'S OWN RULE
   RATHER THAN A SECOND ANSWER. A shop row is a photo Card with the painting on one side at 40% and
   the words on the other, `min-height: 132px`; the coach row is a photo card with a portrait strip
   on one side and the words on the other. They are the same object and they were already the same
   width on a phone (343px), so they get the same treatment D3 and D17 argued for the market:

     768–900   two to a row  (364px each at 768, exactly the market's card)
     1024+     `auto-fill, minmax(343px, 1fr)` – as many as fit at no less than the phone's own card

   Measured before: one row per card, 736px wide at 768 and **948px at 1280**, with a 378px painting
   at one end and two short sentences at the other. Measured after: 4 cars in two rows instead of
   four, and the category is a shelf rather than a list.

   ⚠ THE FLOOR IS THE PHONE'S CARD AND NOT A COUNT, which is D17's finding arriving on a second
   screen: three of these in a 948px column would be 310px each – narrower than the phone's – and a
   card whose words wrap more is a card that gets taller, so the page would grow to save width.

   ⚠ THE HEADING AND ITS NOTE SPAN, they are not cells beside a card: a family is a heading with a
   shelf under it. Their own `-8px` pairing margin is untouched and works the same in a grid.

   ⚠⚠ THE SELECTORS ARE DOUBLED AND TRIPLED, AND THE MUTATIONS SAY WHICH HALF OF THAT IS REAL.
   A media query adds no specificity, so both rungs would otherwise tie – with the flex rule above
   and with each other – and `.tier-block.tier-block` in src/style.css records a case where a
   browser and happy-dom settled such a tie in OPPOSITE directions. Measured here, on this file's
   own arms:

     `.shop-family.shop-family` -> `.shop-family` (the 768 rung)      NOTHING WENT RED
     `.shop-family.shop-family.shop-family` -> two classes (1024)     NOTHING WENT RED
     `.shop-family.shop-family.shop-family` -> ONE class (1024)       RED, and by name

   – so what is genuinely load-bearing is that the DESKTOP rung outweighs the TABLET rung; against
   the base rule outside the query, source order is enough in both engines. The doubling stays
   anyway, and the honest reason is that it costs nothing while a rule which wins only on source
   order is one re-order away from silently losing – but this comment says which of the two claims
   the tests actually hold. */
@media (min-width: 768px) {
  .shop-family.shop-family {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }

  .shop-family .shop-family-head,
  .shop-family .shop-family-note {
    grid-column: 1 / -1;
  }
}

@media (min-width: 1024px) {
  .shop-family.shop-family.shop-family {
    grid-template-columns: repeat(auto-fill, minmax(var(--card-min), 1fr));
  }
}

/* The heading and its note are one object with the cards under them, so they keep the tighter
   spacing they had inside the card rather than the feed's 12px. */
.shop-family-head + .shop-family-note {
  margin-top: -8px;
}

.shop-family-head {
  font-family: var(--font-heading);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: -0.015em;
  color: var(--ink);
}

.shop-family-note {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.35;
  color: var(--ink-soft);
  text-wrap: pretty;
}

/* ⭐ ROUND 43 #5 – THE SPLIT LINE, at the top of the Business shelf. It borrows the family note's
   register deliberately: it is the same KIND of sentence – what this part of the shelf is, before
   the cards – and giving it a louder one would make a correction read as an alarm.
   ⚠ The left accent rule is the one difference, and it is there because the line is answering a
   question the screen used to leave open rather than describing a family.

   ⚠⚠ ROUND 43 #11's BUNDLE REPAIRED THE WEIGHT AND CHANGED NOTHING ELSE: 2px -> 3px. This rail
   shipped at 2px and turned `tests/ui-control-system.test.ts` RED on `round/43` itself – the file
   this bundle never touched was the first offender the rule found, and the control (this bundle's
   own rail removed, the pin still red on this line) is what said so. The house idiom is that a
   single-side border of 2px or more IS a rail, that a rail is the LEFT edge, and that it is 3px – or
   4px when it carries a result, which R10-15 made an accessibility decision. This line carries no
   result, so it is the plain weight. ⚠ NOT ONE CHARACTER OF #5's SENTENCE MOVED, and nothing about
   the ruling he gave on it («окей» to draft C) is touched: this is the app's own design system
   correcting a width. */
.shelf-share-line {
  margin: 8px 0 0;
  padding: 6px 0 6px 10px;
  border-left: 3px solid var(--accent-soft);
  font-size: 12px;
  line-height: 1.35;
  color: var(--ink-soft);
  text-wrap: pretty;
}

/* ⭐⭐ ROUND 34 #18 – THE THINGS THEY ALREADY OWN ARE IN THE ACCENT FRAME (owner, 02.09: the quote
   is at `shopOwnedFrameNote` in the script block, because a .vue file carries no Cyrillic in a
   comment either - tests/template-copy-rules.test.ts).

   ⚠⚠ THESE THREE DECLARATIONS ARE `.cm-row.current`'s, COPIED DELIBERATELY AND NOT REINVENTED. He
   asked for the frame «как с тренером делали», so the answer is the frame the coach row already
   draws: an accent border, a 7% accent wash behind it, and an outer 1px ring that makes it read as
   a FRAME rather than as a hairline. Round-21 #11's own note in style.css says why the ring is a
   `box-shadow` and not a second pixel of border - an outer shadow paints outside the border box and
   moves NO layout, so a framed card and an unframed one still line up in the feed.

   ⚠ `background` HAS TO WIN AGAINST `Card`'s OWN `.tb-card--photo { background: var(--card-bottom) }`
   and it does, on specificity rather than on source order: Vue scopes this to
   `.shop-row.is-owned[data-v-x]` (0,3,0) against the card's `.tb-card--photo[data-v-y]` (0,2,0).

   ⚠ AND IT IS ONE COLOUR IN ONE PLACE. If the accent ever moves, both the coach she has and the
   things they own move with it, because both read `--accent`. */
.shop-row.is-owned {
  background: rgba(var(--accent-rgb), 0.07);
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent);
}

/* ⚠ THE ROW IS A CARD NOW, so the hand-rolled border and the 11px radius are gone: `Card`'s own
   hairline and the radius ladder's card rung do that job, and a second set of both inside them was
   the "plate behind a plate" this item is undoing. `variant="photo"` pads to zero on purpose - the
   art band bleeds to the card's own edges and the words below it carry the inset. */
.shop-row-body {
  padding: 12px;
}

/* THE CARD'S OWN PICTURE, when there is one. A band rather than a bleed-behind-the-words: the
   objects on this shelf are things (a car, a boat, an aeroplane), and a thing wants to be seen
   whole rather than read through. The scrim is the Season card's, softened, so a bright painting
   cannot fight the hairline under it. ⚠ THE WHOLE BLOCK IS ABSENT when there is no painting - see
   `shelfArtUrl` - and the card is then simply a card, which is the state it ships in today. */
.card-art {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.card-art img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-art-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgb(0 0 0 / 0%) 55%, rgb(0 0 0 / 45%) 100%);
}
/* ROUND 41 #28 – the build ring rides the painting's top-right corner (the scrim's name gradient
   owns the bottom); `.card-art`'s own `position: relative` is the anchor, `on-art` brings the
   ring's photograph shadow. */
.card-art .build-ring {
  position: absolute;
  top: 8px;
  right: 8px;
}
/* =================================================================================================
   ⭐⭐ ROUND 35 #5-#9 – THE PAINTING MOVES FROM ABOVE THE WORDS TO BESIDE THEM
   =================================================================================================
   «картинки будут квадратными на всю высоту карточки с небольшим градиентом справа (как на
   тренерах)», and, when the width was asked about: «плитки товаров квадратные, во всю высоту
   карточки - нет, они не во всю ширину будут … Текст и темный фон займут 60% (примерно), остальное
   картинка», «Карточки остаются узкие».

   FOUR PROPERTIES, AND EVERY ONE OF THEM IS A SENTENCE OF HIS:
     1. THE CARD IS STILL SHORT. The band is `position: absolute` between the card's own top and
        bottom, so it is sized BY the words and can never size them - «Карточки остаются узкие».
        This is `.cm-art`'s trick and it is here for the reason round-18 #2 wrote it: a picture whose
        height comes from the text cannot start a feedback loop with the text.
     2. IT TAKES 40% OF THE WIDTH, not the whole of it. His «остальное картинка» after 60% of text
        and dark ground; his own frame AA gives the yacht cards 37%, so «почти как в макете» is
        literal. `tests/component/round35-shop.test.ts` pins the 40 and the 60 off the real cascade.
     3. IT FADES INTO THE CARD rather than ending on an edge - «с небольшим градиентом». The mask is
        `.cm-art`'s, mirrored per side, and its stops are percentages of THIS box, so the fade
        reaches transparent exactly where the band stops however wide the card is.
     4. THE SOURCE IS SQUARE AND THE SLOT IS NOT, so there is horizontal cropping, and he accepted
        it in advance: «видимо будет некоторая обрезка по ширине … пока так посмотрим». `object-fit:
        cover` on a height-driven box crops sideways and never vertically, which is the A2c/d ruling
        the coach strip inherits too.

   ⚠ THE `min-height` IS THE ONE NUMBER THAT IS MINE. Without it the shortest card on the shelf - an
   unowned academy stage, four short lines - would give the painting about 90px of height to stand
   in and the thing in it would be unreadable. 132px is the height of the tallest of those short
   cards, so it changes NO row that already has something to say and rescues the ones that do not. */
.shop-row--art-left,
.shop-row--art-right {
  min-height: 132px;
}

.shop-row--art-left > .shop-row-art,
.shop-row--art-right > .shop-row-art {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 40%;
  aspect-ratio: auto;
}

.shop-row--art-left > .shop-row-art {
  left: 0;
  -webkit-mask-image: linear-gradient(90deg, #000 0%, #000 62%, transparent 100%);
  mask-image: linear-gradient(90deg, #000 0%, #000 62%, transparent 100%);
}

.shop-row--art-right > .shop-row-art {
  right: 0;
  -webkit-mask-image: linear-gradient(270deg, #000 0%, #000 62%, transparent 100%);
  mask-image: linear-gradient(270deg, #000 0%, #000 62%, transparent 100%);
}

/* THE OTHER 60%: the words keep the card's own 12px inset and gain the band's width on their side,
   so no sentence can start on top of a painting. One number, `40%`, said twice - and the test reads
   BOTH off the cascade, so they cannot drift apart. */
.shop-row--art-left > .shop-row-body {
  padding-left: calc(40% + 12px);
}

.shop-row--art-right > .shop-row-body {
  padding-right: calc(40% + 12px);
}

/* ⭐⭐ ROUND 36 REVIEW #11 – AND ON FOUR OF THE FAMILIES THE PAINTING TAKES HALF. His two
   declarations, verbatim: «самим картинкам `width: 50%`, а `shop-row-body padding-right: calc(45% +
   12px)`». Which four, why the property name is mirrored on the cars and why the academy is not in
   the set are all on `shopRowArtWide` in the script block, where his sentence can be quoted.

   ⚠ THE PAIR STILL DOES NOT ADD TO 100, AND THAT IS THE POINT OF IT. Round 35's pair was 40 / 40 –
   the inset matched the band exactly, so the words started where the picture stopped. His is 50 /
   45, so the words start 5% BEFORE the band ends and run under its transparent tail: the mask fades
   from opaque to nothing over the band's last 38%, which at 50% of the card is 19% of it, so a
   sentence reaching 5% into that tail sits on paint that is already almost gone. That is «еще чуть
   больше горизонтального места» spent on the picture without buying it out of the words' side.

   ⚠ THREE CLASSES ON BOTH RULES, so neither depends on source order against the round-35 pair it
   overrides – (0,3,0) against (0,2,0) in either engine. The `.shop-action` pill on the `--art-right`
   families keeps its `max-width: calc(40% - 20px)`: it is bounded by the band it sits ON, a 40%
   pill still lands inside a 50% band, and its left edge (60% + 10px at the widest) stays clear of
   the words' new right edge (55% - 12px). Nothing he did not ask about moved. */
.shop-row--art-wide.shop-row--art-left > .shop-row-art,
.shop-row--art-wide.shop-row--art-right > .shop-row-art {
  width: 50%;
}

.shop-row--art-wide.shop-row--art-right > .shop-row-body {
  padding-right: calc(45% + 12px);
}

.shop-row--art-wide.shop-row--art-left > .shop-row-body {
  padding-left: calc(45% + 12px);
}

/* ⭐⭐ ROUND 36 REVIEW #12 AND #13 – THE CONTROL MOVES TO THE CARD'S BOTTOM-RIGHT CORNER. One rule
   for the cars and the academy, because it is one sentence he wrote twice; `shopRowCornerAction` in
   the script block carries both quotes and the reason this corner is reached with `margin-left`
   rather than with `position: absolute`.
   ⚠ IT IS `margin-left: auto` ON THE CONTROL AND NOT `justify-content: flex-end` ON THE ROW,
   because the row is shared: an investment holding puts a field and «Add more» in it, and pushing
   the whole group right would have moved a control on a family he did not name. The margin is on
   the last item, so a lone «Sell» goes to the corner and a row that has a field keeps the field
   where it is. ⚠ AND `flex-wrap: wrap` IS UNTOUCHED – on a phone a long label still takes its own
   line inside the card rather than the right-hand edge of the screen (round-20 #3, and the fits
   assertion in tests/component/round34-money-shelf.test.ts). */
.shop-row--corner-action .shop-row-owned > .shop-stake-row > .shop-action:last-child {
  margin-left: auto;
}

/* ⭐⭐ THE NAME GETS ITS OWN LINE ON A FRAMED ROW, AND HIS OWN HANDOFF ASKS FOR IT IN AS MANY WORDS.
   README §X: «Название – НА СВОЕЙ СТРОКЕ, С ПЕРЕНОСОМ (не в одном флекс-ряду с доходностью, иначе
   обрезается)».

   ⚠⚠ AND IT IS A REAL DEFECT AND NOT A PREFERENCE, WHICH IS WHY IT WAS FOUND BY LOOKING. `.shop-row-
   head` is `justify-content: space-between` with a `nowrap` rate beside the name; on a full-width
   card that is comfortable, but a framed row hands the words 40% less horizontal room and the rate
   («Loses 15% a season», ~92px, unbreakable) takes its share off the top. Rendered at 375px in a
   real browser, «The luxury four-by-four» broke into THREE lines against a column that had room for
   one and a half. The card is short by construction – its height IS the words – so a name wrapping
   three ways is the one thing that can make it tall again.

   `display: block` is the whole fix: the name takes the line, the rate falls under it and keeps its
   own colour and meaning. ⚠ NOT `flex-wrap`, which would leave the rate hard right on a line of its
   own and read as a column heading. */
.shop-row--art-left .shop-row-head,
.shop-row--art-right .shop-row-head {
  display: block;
}

.shop-row--art-left .shop-row-rate,
.shop-row--art-right .shop-row-rate {
  display: block;
  margin-top: 2px;
}

/* ⭐ THE PRICE IS THE HEADLINE ON THESE ROWS – «а текущая цена отдельной строчкой белым шрифтом
   Sora (как на яхтах)», his own description of the water frame, where the figure is a large white
   number at the foot of the words. */
.shop-row--art-left .shop-row-price,
.shop-row--art-right .shop-row-price {
  font-family: var(--font-heading);
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--ink);
}

/* ⭐ AND ON THE `right` FAMILIES THE CONTROL STANDS ON THE PAINTING – «Кнопка покупка/продажа может
   стоять на картинке (как на яхтах, тогда картинка будет более квадратная, как мне кажется)». The
   card is the containing block (`.tb-card--photo` is `position: relative`), so this is the card's
   bottom corner and not the text column's.
   ⚠ IT IS BOUNDED BY THE BAND IT SITS ON. «Sell it for $12,000,000» is a long label, and a pill
   that grew past 40% would put its own left edge back over the sentences. `max-width` plus a
   wrapping label is what makes that impossible rather than unlikely.
   ⚠ AND THE CARS GO THE OTHER WAY BY HIS OWN SEPARATE SENTENCE: «кнопку покупки можно поставить под
   цену - тогда больше горизонтального места для надписей», so `--art-left` leaves the control in
   the flow, under the price, where `.shop-row-buy`'s wrap already puts it. */
.shop-row--art-right .shop-action {
  position: absolute;
  right: 10px;
  bottom: 10px;
  max-width: calc(40% - 20px);
  margin-top: 0;
  white-space: normal;
  background: color-mix(in srgb, var(--card-bottom) 78%, transparent);
  backdrop-filter: blur(6px);
}

/* «кнопку покупки можно поставить под цену» – the price on its own line and the control under it,
   which is what a full-width flex item does in a wrapping row. It buys the words the horizontal
   room he asked for on the same breath. */
/* ⭐⭐⭐ THE PRICE AND THE CONTROL SHARE ONE LINE, AND HE SETTLED IT IN THREE MESSAGES ON ONE DAY.
   All three are his, they are kept in order because the REASON is what survives all three, and the
   third one stands:

     1. item 5, «кнопку покупки можно поставить под цену – тогда больше горизонтального места для
        надписей» – the control on its own line under the price;
     2. «на машинах на карточках кнопку buy всё-таки поставь СЛЕВА от цены пожалуйста, ИНАЧЕ
        КАРТОЧКА ОЧЕНЬ ВЫСОКАЯ ПОЛУЧАЕТСЯ» – he built (1), looked at it, and named the cost;
     3. «и я ошибся: на машинах на карточках кнопку buy поставь СПРАВА от цены пожалуйста» – which
        is also what his own frame X draws, and it is what this rule is.

   ⭐⭐ THE CONSTANT ACROSS ALL THREE IS NOT THE POSITION, IT IS THE PROPERTY: **the card must not
   grow taller.** That is the rule this whole family is built under from here – where a choice adds
   height, take the shorter one – and it is why `.shop-row-head` above puts the name on its own line
   as well. Measured in a real browser at 375px: stacked, the four cars stood 200.3–216.5px; sharing
   the line they are 164.7–180.9px, about 36px each.

   ⚠ THE RULE IS ONE DECLARATION BECAUSE THE ROW ALREADY DOES THE REST. `.shop-row-buy` is
   `display: flex; align-items: center; gap: 8px` in DOM order price-then-control, which IS «price
   on the left, button on its right»; all that has to go is the top margin the pill only ever
   carried to space itself from the thing it used to sit under. ⚠ NO `order` ANYWHERE: reading order
   and visual order agree, which is the arrangement that needs no override to be correct for a
   screen reader. `tests/component/round35-shop.test.ts` holds the pair to ONE LINE by width, which
   is the honest form of the height claim – see its own note on why a card-height ceiling is not. */
.shop-row--art-left .shop-row-buy > .shop-action {
  margin-top: 0;
}

.shop-row-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.shop-row-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
  overflow-wrap: anywhere;
}

/* ⚠ THE LOSING ROWS SAY SO IN THE INK AS WELL AS IN THE WORDS, because the whole point of the car
   family is that it goes the other way (spec §3b). `--money-out` is the app's one colour for money
   leaving, so the shelf borrows it rather than inventing a second red. */
.shop-row-rate {
  font-size: 11px;
  font-weight: 700;
  color: var(--money-in);
  white-space: nowrap;
}

.shop-row-rate.is-down {
  color: var(--money-out);
}

.shop-row-blurb {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.35;
  color: var(--ink-soft);
  text-wrap: pretty;
}

/* ⭐ ROUND 29 #5, §3f – THE WEEKLY BILL READS AS MONEY LEAVING, because it is: unlike the rate two
   rules up (a valuation) this figure really goes out of the wallet every week. Same `--money-out`
   the ledger paints an expense in, so nothing new is invented for it. */
.shop-row-upkeep {
  margin: 4px 0 0;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--money-out);
}

/* ⭐ ROUND 29 PART FOUR P7 – the mirror of the upkeep line: money that ARRIVES every week, in the
   app's one green for that meaning (note 3 in the script header). Same size and weight as its
   mirror, deliberately – two facts of equal rank, never netted. */
.shop-row-earning {
  margin: 4px 0 0;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--money-in);
}

/* ⭐ ROUND 30 #14 – the units line: a supporting fact under the headline figure and never a headline
   of its own, so it takes the blurb's quiet ink rather than either money colour. It is a COUNT and a
   PRICE, not money moving. */
.shop-row-units {
  margin: 4px 0 0;
  font-size: 11.5px;
  color: var(--ink-soft);
}

/* ⭐⭐⭐ ROUND 30 #8 AND #10 – WHAT THEY CALLED IT, and the naming control that set it.
   ⚠⚠ `overflow-wrap: anywhere` IS THE 375px GUARANTEE AND NOT A GARNISH. The string is
   player-authored: `sanitiseAssetName` caps it at 24 code points and forbids everything but letters,
   digits, the space and `& . ' -`, which bounds the LENGTH – but twenty-four unbroken letters is a
   word no browser will break on its own, and a shop card is 343px of content at 375px. The cap and
   this rule together are what make «it cannot break a layout at 375px» true rather than likely, and
   `tests/component/round30-brand-naming.test.ts` measures it against the viewport rather than
   trusting either half. */
.shop-row-given-name {
  margin: 4px 0 0;
  font-size: 11.5px;
  color: var(--ink-soft);
  overflow-wrap: anywhere;
}

.shop-naming {
  display: block;
  margin-top: 8px;
}

.shop-naming-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 4px 0 6px;
}

.shop-naming-chip {
  padding: 5px 10px;
  border: 1px solid var(--line);
  /* ⚠ THE TOKEN AND NOT A BARE 999px – the owner's capsule-vs-circle ruling of 26.07, pinned in
     tests/round10.test.ts: a wide short element wants the CAPSULE (clamped to half the height), and
     the magic number has to be findable by grep. Caught by that pin on this wave's first gate. */
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--ink-soft);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  /* the chips carry suggestions built from her surname, so the same 24-cap and the same wrap. */
  overflow-wrap: anywhere;
  max-width: 100%;
}

.shop-naming-chip.is-on {
  border-color: var(--ink);
  color: var(--ink);
}

/* ⚠ WIDER THAN THE MONEY BOXES ON PURPOSE: `.shop-stake-input` is 8.5em because it holds a figure,
   and a name is words. `max-width: 100%` keeps it inside the card at 375px either way. */
.shop-naming-input {
  width: 100%;
  font-weight: 600;
}

/* The wait and the stage under it – facts about WHEN, not about money, so they take the quiet ink
   the blurb takes rather than either money colour. */
.shop-row-wait {
  margin: 4px 0 0;
  font-size: 11.5px;
  line-height: 1.35;
  color: var(--ink-soft);
  text-wrap: pretty;
}

.shop-row-owned,
.shop-row-buy {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

.shop-row-owned {
  display: block;
}

.shop-row-change {
  margin: 6px 0 0;
  font-size: 11.5px;
  line-height: 1.35;
  color: var(--money-in);
}

.shop-row-change.is-down {
  color: var(--money-out);
}

.shop-row-price {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
}

/* ⭐⭐⭐ ROUND 34 #19 – THE FUND'S CHART (owner, 02.09: the quote is at `shopChartNote` in the script
   block, because a .vue file carries no Cyrillic in a comment either).

   ⚠ THE PLOT IS A viewBox AND NOT A PIXEL SIZE, so the picture is whatever width the card gives it
   and the 375px phone needs no layout of its own – `height: auto` keeps the aspect, so the chart
   cannot squash. `vector-effect: non-scaling-stroke` is what stops the line thickening with it: an
   SVG scaled from 300 units to 351px would otherwise draw a 1.17px hairline, and a chart whose
   stroke width depends on the phone is a chart that looks different on every phone.

   ⚠ THE RANGE CHIPS ARE `.shop-naming-chip`'s SHAPE, deliberately: the naming picker on this very
   card already answers «choose one of these» in the capsule, and a second in-card picker inventing
   its own look would be two idioms on one surface. They wrap, for round-20 #3's reason – four of
   them plus their gaps have to live inside a 351px card body, and the measurement is in
   tests/component/round34-money-shelf.test.ts rather than in this comment. */
.fund-chart {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.fund-chart-ranges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.fund-chart-range {
  padding: 4px 9px;
  border: 1px solid var(--line);
  /* the capsule token, never a bare 999px – the owner's ruling of 26.07, pinned in
     tests/round10.test.ts and already obeyed by `.shop-naming-chip` two rules down. */
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--ink-soft);
  font-size: 11.5px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
}

.fund-chart-range.is-on {
  border-color: var(--ink);
  color: var(--ink);
}

.fund-chart-plot {
  display: block;
  width: 100%;
  height: auto;
}

.fund-chart-line {
  fill: none;
  stroke: var(--accent);
  stroke-width: 1.5;
  stroke-linejoin: round;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}

/* ⚠ THE DOTS ARE THE ITEM AND NOT A DECORATION – «график … с точками его стоимости за пай». One per
   month, which is the resolution he named. */
.fund-chart-dot {
  fill: var(--accent);
}

/* ⭐⭐⭐ ROUND 41 #22 (v78) – THE PURCHASE MARKS. The wrapper is the popup's containing block and the
   only reason it exists; the plot keeps its own rules above, unchanged. */
.fund-chart-plot-wrap {
  position: relative;
}

/* ⚠ RINGED AND NOT FILLED, so a purchase mark can never be mistaken for one of the monthly dots it
   sits among – different shape, not merely a different colour, which is the one distinction that
   survives a colour-blind reader and a screenshot. `non-scaling-stroke` for the reason the line
   carries it: the viewBox is 300 wide and the card is ~351px, so a plain stroke would thicken. */
.fund-chart-mark {
  fill: var(--card-top);
  stroke: var(--ink);
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}

.fund-chart-mark.is-open {
  fill: var(--ink);
}

/* ⚠⚠ THE TAP TARGET IS 30px AND THE PAINTED RING IS ~8px, which is the whole reason the control is
   an HTML button over the SVG rather than the `<circle>` itself. A 4px target is not pressable with
   a thumb, and an SVG shape cannot take keyboard focus. Transparent, centred on the mark, and it
   reaches outside the plot's box on purpose – `.fund-chart-plot-wrap` does not clip. */
.fund-chart-hit {
  position: absolute;
  width: 30px;
  height: 30px;
  margin: -15px 0 0 -15px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-pill);
  background: transparent;
  cursor: pointer;
}

/* ⚠ NO `:focus-visible` RULE HERE, and its absence is the point: `src/style.css` declares the app's
   ONE focus ring (`outline: var(--stroke-hair) solid var(--accent)`) and
   `tests/ui-control-system.test.ts` enforces both halves of that – nothing outlined heavier than a
   hairline, and exactly one ring in the whole app. This block shipped a 2px private ring in its first
   draft and both cases went red on the first full run, which is the gate doing its job. */

/* ⚠ THE MICRO-POPUP – «микро попап при hover/клике с суммой и датой». It sits at the TOP of the
   plot, inside the wrapper, because `.tb-card--photo` clips: a bubble that floated above the chart
   would be cut by the card edge on the one viewport that matters. The horizontal axis is handled by
   the row above it rather than by a clamp – `markAlign` carries the measurement that decided it. */
/* ⚠ THE ROW IS THE PLOT'S OWN WIDTH, and the bubble is a child of it with `max-width: 100%` – see
   `markAlign` for why the bubble is never positioned by its centre. `pointer-events: none` on the row
   so neither it nor the bubble can ever eat the hover that is keeping the bubble open. */
.fund-chart-poprow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  pointer-events: none;
}

.fund-chart-pop {
  display: flex;
  flex-direction: column;
  gap: 1px;
  max-width: 100%;
  padding: 5px 9px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--card-top);
  color: var(--ink);
  font-size: 11.5px;
  line-height: 1.3;
  white-space: nowrap;
}

.fund-chart-pop-top {
  font-weight: 700;
}

.fund-chart-pop-sub {
  color: var(--ink-soft);
}

.fund-chart-axis {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  color: var(--ink-soft);
}

.fund-chart-span {
  font-weight: 700;
}

.fund-chart-empty {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.35;
  color: var(--ink-soft);
  text-wrap: pretty;
}

.shop-stake {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

/* ⭐⭐ ROUND 34 #20 – THE FIELD AND THE CONTROL THAT ACTS ON IT, IN ONE ROW (owner, 02.09: the
   quote is at `shopInlineActionNote` in the script block, because a .vue file carries no Cyrillic
   in a comment either - tests/template-copy-rules.test.ts).

   `align-items: end` rather than `center` is the whole of the alignment: it was written when
   `.shop-stake` was a COLUMN of a caption and a field, so centring would have hung the button
   halfway up the caption. ⭐ ROUND 35 #12 took the captions off this row – the frame draws the field
   bare – so the items are now of a height and `end` and `center` agree; it is left as it is because
   the not-owned branch still stacks a caption over a field and this row may grow one back.

   ⚠ `flex-wrap: wrap` IS THE PHONE, NOT A FLOURISH. Round-20 #3's rule is that every control stays
   inside 375x667, and this row now carries THREE items rather than two – a field, «Add more» and
   «Sell». ⭐ The shorter labels are what pays for the third: the owner chose them for exactly that
   («меньше места занимают» is at `shopOneFieldNote`), and the widest string this row could produce
   before them was «Sell it for $12,000,000». Wrapping spends a line rather than the right-hand edge
   of the screen, which is the failure mode the fits.ts assertion in
   tests/component/round34-money-shelf.test.ts exists to make impossible – re-measured with his
   words in place.

   ⚠ AND `.shop-action`'s OWN `margin-top` IS CLEARED HERE. It was the gap under the stacked layout;
   inside the row it would push the button below the input's baseline, so the row owns its spacing
   and the bare button outside a row keeps the margin it always had. */
.shop-stake-row {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 8px;
  margin-top: 10px;
}

/* ⚠ `nowrap` IS THE MEASUREMENT'S HALF OF THE ITEM, not a flourish. A button that may break its own
   label gives ground VERTICALLY, so it can be squeezed to its padding and still «fit» - which is
   exactly the reading `fits.ts` refuses to credit («a control cut down to Trai… is not a control the
   measurement should score as fitting»). Held to one line, the control demands its real width, the
   fits assertion in tests/component/round34-money-shelf.test.ts measures the row a person actually
   sees, and `flex-wrap` above is what that demand spends when a holding grows a long figure: the
   button takes its own line INSIDE the card instead of leaving the phone. */
.shop-stake-row .shop-action {
  margin-top: 0;
  white-space: nowrap;
}

.shop-stake-label {
  font-size: 11px;
  color: var(--ink-soft);
}

.shop-stake-input {
  width: 8.5em;
  max-width: 100%;
  padding: 7px 9px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: transparent;
  color: var(--ink);
  font-size: 13px;
  font-weight: 700;
}

.shop-action {
  margin-top: 8px;
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: transparent;
  color: var(--ink);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.shop-action:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>

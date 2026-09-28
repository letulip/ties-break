<script lang="ts">
// ⚠ MODULE SCOPE, AND IT HAS TO BE A SECOND BLOCK – `ConfirmDialog.vue`'s own note and its own measured
// reason. `<script setup>` is the setup FUNCTION's body, so a counter declared there would be 1 for
// every row in the document. See the E-P12 note and `descBase` in the setup block below (28.09).
let rowSeq = 0
</script>

<script setup lang="ts">
// U0 #8 – SEGMENTED ROW. One rounded plate, the chosen segment filled solid accent, the rest muted.
// Options in, the active value out - so a screen that needs a switcher writes one line and cannot
// invent a thirteenth shape for it.
//
// Absorbs `.tab-row` / `.tab-pill`, the app's standard segmented control. Its one existing caller
// is BracketTabs (the draw's round switcher), and it is ported here - the spec calls that pair
// "already shared once ... this makes it official".
//
// ⚠ TWO THINGS THE SPEC ASKS THIS TO ABSORB, THAT IT DOES NOT, and both for the same reason: they
// are different objects today, and converging them would move a screen this slice may not move.
//   * SEASON'S PHASE STRIP (`.phase-strip`) is a five-column GRID with hairline dividers and two
//     lines per cell, and it is not a switcher at all - nothing is clickable, it is a read-out of
//     which surface block the current week falls in. Forcing it through here would have meant a
//     "not really a row, not really interactive" mode, which is exactly the special case the spec
//     itself says means the component is wrong. It stays as it is, in Season's own styles.
//   * THE MONEY SCREEN'S 12w/season toggle is `.option-row` / `.option-pill`, a THIRD shape. Money
//     is U1's screen; converging it belongs with whoever ports it, and it should then come here.
//
// ⚠ AND THE TWO APPEARANCE STATES BELOW OBEY THAT SAME RULE (DRY-8, 19.08): `.as-bare` and
// `.as-chapter` live in `src/style.css` beside the plate they modify, NOT in a scoped block here, so
// the sentence below stays literally true. It also keeps the specificity story in one place - a
// shared `.tab-row.as-chapter` is (0,2,0) against the plate's (0,1,0), which is the same argument the
// three screens each used to make privately with a data-v attribute, and no `!important` either way.
//
// `.tab-row` / `.tab-pill` stay in `src/style.css` and this component declares NO styles of its own:
// the plate is shared vocabulary, and the draw's own `.bt-tabs` override still reaches its pills
// through it. What arrives with the component is the CONTRACT - a segmented row is a NAMED group of
// real buttons carrying `aria-pressed`, and the chosen one is a value rather than a position.
//
// The value is a string rather than an index so a caller can switch on its own union (a round id, a
// period id) instead of on a position it has to map back.
// ⭐⭐ ROUND 42 #28 – AND A SEGMENT CAN NOW CARRY AN ACCENT DOT, which is the only thing this
// component gained for the round. The owner asked for the off-season psychologist marker «на плашку
// на home и на support stuff», and the Support-staff ENTRY is a segment of this row – the chapter
// picker on the Coach Market screen. A dot rendered by the caller was not available: the segments are
// this component's own `<button>`s and nothing outside can reach inside one.
//
// ⚠ OPTIONAL, AND EVERY EXISTING CALLER IS BYTE-FOR-BOX WHAT IT WAS. Eight rows use this component;
// none of them passes `dot`, so none of them renders the span, and `.tab-pill` itself is untouched.
//
// ⚠ AND THE SEGMENT'S NAME DOES NOT MOVE WHEN THE DOT ARRIVES – D7's rule, borrowed from the tab
// bar. The button already carries an explicit `aria-label` (`o.label`), which pins the accessible
// name whatever descendants it grows, so `getByRole('button', { name: 'Support staff', exact: true })`
// keeps working in both states. The dot itself carries no word: this round was not asked for one, and
// CLAUDE.md invariant 4 says an unasked sentence is not a builder's to add.
// ⭐⭐⭐ E-P12 (28.09, T6.4) – AND A SEGMENT'S `title` IS SPOKEN NOW, NOT ONLY HOVERED.
// Lane E's accessibility sweep found `SegmentedRow.vue:104` in its «information in the title only»
// list: every caller that passes `title` was putting what a segment is FOR into a desktop tooltip,
// which is not in the accessible name, is not announced, and does not exist on a phone at all. The
// row's proposal is this one - «route `title` to `aria-describedby` in `SegmentedRow`» - so it is
// fixed once here rather than at each of the four callers.
//
// ⚠ NOT ONE NEW WORD (invariant 4). The described span holds `o.title`, the caller's own sentence,
// character for character; `tests/component/a11y-sweep.test.ts` pins the two against each other
// rather than against a literal, so they cannot drift apart.
//
// ⚠ THE `title` STAYS. E-P12's own row offers «or accept it as a desktop tooltip» as the ALTERNATIVE
// to routing it, so the row is not asking for the tooltip to go, and taking it away would remove a
// hover the owner has on his own playtest machine.
//
// ⚠ THE SEGMENT'S NAME DOES NOT MOVE UNDER THE NEW SPAN - the same argument the accent dot needed one
// note down. The button carries an explicit `aria-label` (`o.label`), which pins the accessible name
// whatever descendants it grows, so `getByRole('button', { name: 'History', exact: true })` keeps
// working. The span is `.sr-only`, so it is in the accessibility tree and off the screen.
//
// ⚠⚠ AND THE ID IS A MODULE COUNTER, ON ConfirmDialog's OWN MEASURED PRECEDENT. `useId` counts per APP
// INSTANCE, so two rows created by two different `createApp` roots both come back `v-0` - a duplicate
// id makes `aria-describedby` resolve to whichever came first, i.e. the wrong sentence read over the
// right segment. A module-scoped counter is unique per document because there is one module, and it
// is read once in setup so it is stable across re-renders, which is the property the attribute needs.
// MoneyScreen alone renders three of these rows at once. The counter lives in the SECOND script block
// at the top of this file, because everything in `<script setup>` is the setup function's body and runs
// once per instance – which is the collision it exists to prevent.
defineProps<{
  options: readonly {
    value: string
    label: string
    short?: string
    /** Hovered on a desktop AND spoken as the segment's description - see the E-P12 note above. */
    title?: string
    /** ⭐ ROUND 42 #28: draw the accent dot on this segment. See the note above. */
    dot?: boolean
  }[]
  /** Bare, so the plate reads as a plate on a page background; `on-panel` inside a panel-toned card. */
  tone?: 'page' | 'on-panel'
  /** ⭐⭐ WHAT JOB THIS ROW IS DOING, which is a different question from `tone` (what it is sitting
   *  ON). Three screens had copied the same declarations to answer it – DRY-8 of the August review.
   *
   *  * `plate` (default) – the shared plate. Every existing caller, unchanged.
   *  * `bare` – the plate comes off. The owner, 02.08: «Мне не нравится круглая обводка у
   *    переключателя уровня турниров в stats, без нее было лучше... Давай просто кнопки оставим и
   *    всё». He ruled on a CONTROL, not on a screen, which is why this is a state of the control.
   *  * `chapter` – bare, AND a real touch target, for a row that picks the PAGE'S CHAPTERS. A second
   *    and narrower ruling, 05.08: «Верхние переключатели-вкладки в ledger и настройках сделать
   *    немного крупнее и с отступом внизу небольшим». Measured at his own 576-wide viewport before
   *    anything moved: the pill was 27px tall, against 51px for the bottom bar's `.tab-btn` – the
   *    app's own answer to "how big is a thing you navigate with" – and against the 44px both
   *    platform guidelines ask for. It was the smallest control on the page by a wide margin.
   *
   *  ⚠ WHY `chapter` IS NOT SIMPLY "BIGGER PILLS" GLOBALLY, and this is the objection the three
   *  copies were protecting: the shared `.tab-pill` is ALSO the draw's round switcher and the
   *  12w/season filter six pixels below one of these rows. Growing it globally would inflate a filter
   *  INSIDE a chapter to the size of the chapter picker above it – "two identical-looking rows
   *  stacked six pixels apart", which reads as one broken control. An opt-in state is precisely not
   *  global: the filter row simply does not ask for it.
   *
   *  ⚠ THE BOTTOM MARGIN STAYS WITH THE PAGE. It is page rhythm, not control identity, and the three
   *  callers legitimately differ (10px on Stats, 14px on the two the owner named together). */
  appearance?: 'plate' | 'bare' | 'chapter'
  /** What the group is, for screen readers. A row of pills with no name is a row of mystery.
   *  NOT called `ariaLabel`: Vue would let a caller write `aria-label` and have it fall through to
   *  the root as a plain attribute instead of binding the prop, which type-checks and then quietly
   *  does the wrong thing on the wrapper. A distinct name makes that impossible. */
  groupLabel: string
}>()

/** `v-model` – the ACTIVE option's value, never an index. */
const model = defineModel<string>({ required: true })

/** The id base for this row's description spans – see the E-P12 note at the top of this block. */
const descBase = `tb-seg-desc-${++rowSeq}`
/** The id of one segment's description, or `undefined` when the caller passed no sentence: an
 *  `aria-describedby` with nothing behind it is a promise a screen reader answers with silence. */
const descId = (value: string, title?: string): string | undefined =>
  title === undefined ? undefined : `${descBase}-${value}`
</script>

<template>
  <div
    class="tab-row tb-seg"
    :class="{
      'on-panel': tone === 'on-panel',
      'as-bare': appearance === 'bare' || appearance === 'chapter',
      'as-chapter': appearance === 'chapter',
    }"
    role="group"
    :aria-label="groupLabel"
  >
    <button
      v-for="o in options"
      :key="o.value"
      class="tab-pill"
      :class="{ active: o.value === model }"
      :aria-pressed="o.value === model"
      :aria-label="o.label"
      :title="o.title"
      :aria-describedby="descId(o.value, o.title)"
      @click="model = o.value"
    >
      {{ o.short ?? o.label }}
      <!-- ⭐ ROUND 42 #28 – the accent dot, in the same attention flavour Home's plate wears. See
           the script note for why it is silent and why the segment's name cannot move under it. -->
      <span v-if="o.dot" class="tab-pill-dot" data-nudge="psychologist-focus"></span>
    </button>
    <!-- ⭐⭐⭐ E-P12 – THE TOOLTIPS' OWN SENTENCES, ON A SURFACE A SCREEN READER READS. Same words, new
         surface; `aria-describedby` above points at them by id, which works from anywhere in the
         document. Rendered only for an option that has one, so no segment carries a promise with
         nothing behind it.
         ⚠⚠ BESIDE THE BUTTONS AND NOT INSIDE THEM, AND THAT IS MEASURED RATHER THAN TIDY. Inside, the
         span joins the button's `textContent` – which is not what a sighted player sees, but IS what a
         test sees: `tests/component/round30-subtabs.test.ts` opens a chapter with
         `findAll('button.tab-pill').find((n) => n.text().trim() === 'Bills')`, and ten of its tests went
         red because the segment's text had become «Bills The recurring costs the family has signed up
         to». `tests/component/fits.ts`'s `demandedWidth` reads `textContent` the same way and would
         charge a whole sentence for a one-pixel span. Out here, every control's own text is exactly
         what it was and the accessibility relationship is unchanged. -->
    <template v-for="o in options" :key="`desc-${o.value}`">
      <span v-if="o.title" :id="descId(o.value, o.title)" class="sr-only">{{ o.title }}</span>
    </template>
  </div>
</template>

<script setup lang="ts">
// U0 #9 – STAT ROW. «label … value», with the value carrying a MEANING in its colour. The handoff
// names it as component 8 of 31 ("«лейбл … значение» с семантическим цветом (бюджет, тренировки)")
// and docs/specs/ui-components.md deliberately left it out of the U0 slice: "it comes with the
// Money screen in U1, where it has a real caller; extracting it now would be guessing at its shape".
//
// THIS IS THAT SHAPE, and it was NOT guessed – it is the intersection of the three rows the Family
// Budget screen (design G) actually writes, which is why it has three slots and not six:
//
//   CATEGORY   [icon] Travel ............ 24%  -$1,890     icon + label + meta + negative value
//   INCOME     [dot]  Income .................. +$820      icon + label +        positive value
//   LEDGER            Entry fee, W12 '32  $51,463  -$120   label + meta + negative value
//
// One object, three callers, and the thing all three were saying identically is: a hairline-
// separated row where the LEFT half names a thing, the RIGHT half is a figure, and the figure's
// colour is the only place a direction (money in / money out) is stated. Everything that differs
// between them is a slot.
//
// WHY `tone` IS A PROP AND NOT A CLASS THE CALLER WRITES. The three colours are the app's money
// vocabulary (`--money-in` / `--money-out` / `--ink`), and the whole point of the design's third
// principle - "цвет = смысл" - is that green means earned and red means spent on every screen at
// once. A caller that could pass any colour could break that on one screen only; a caller that
// picks from three cannot.
//
// The geometry is design G's category row, verbatim: 11px gap, 14px/2px inset, the 17px glyph
// slot, 13.5px/600 on the name and 13.5px/700 on the figure.
withDefaults(
  defineProps<{
    /** What the row is about. Falls back to the `label` slot when a caller needs markup. */
    label?: string
    /** The figure. Falls back to the default slot for the same reason. */
    value?: string
    /** What the figure MEANS. `negative` = money out, `positive` = money in, `plain` = a number
     *  with no direction (a count, a balance), `accent` = the one accent, for a figure that is the
     *  point of the screen. */
    tone?: 'plain' | 'positive' | 'negative' | 'accent'
    /** A muted figure between the name and the value – a share, a running balance, a date. */
    meta?: string
    /** The hairline under the row. Off on the last row of a list that already has an edge. */
    divider?: boolean
  }>(),
  { label: '', value: '', tone: 'plain', meta: '', divider: true },
)
// NO `fill` PROP, deliberately, even though design G's category column divides its height between
// its rows (`flex: 1; min-height: 0`). That works in a mockup with exactly six rows and a fixed
// 844px screen; ours has between one and nine and the owner's Q5 ruling is that real content may
// scroll. A prop with no caller is a guess, and this component exists because the last one was
// not taken.
</script>

<template>
  <div class="tb-statrow" :class="[`tb-statrow--${tone}`, { 'tb-statrow--ruled': divider }]">
    <span v-if="$slots.icon" class="tb-statrow-icon"><slot name="icon" /></span>
    <span class="tb-statrow-label"><slot name="label">{{ label }}</slot></span>
    <span v-if="meta || $slots.meta" class="tb-statrow-meta"><slot name="meta">{{ meta }}</slot></span>
    <span class="tb-statrow-value"><slot>{{ value }}</slot></span>
  </div>
</template>

<style scoped>
.tb-statrow {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 14px 2px;
  font-size: 13.5px;
}

.tb-statrow--ruled {
  border-bottom: 1px solid var(--line);
}

/* The glyph slot. `stroke: currentColor` is the contract with the caller: a StatRow icon is drawn
   in the row's own label ink, so the six category glyphs cannot drift apart from one another. */
.tb-statrow-icon {
  flex: none;
  display: flex;
  width: 17px;
  height: 17px;
  color: var(--ink-soft);
}

.tb-statrow-icon :deep(svg) {
  width: 17px;
  height: 17px;
  display: block;
}

.tb-statrow-label {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  color: var(--ink-2);
  letter-spacing: -0.01em;
}

.tb-statrow-meta {
  flex: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-dim);
  font-variant-numeric: tabular-nums;
}

.tb-statrow-value {
  flex: none;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}

.tb-statrow--negative .tb-statrow-value {
  color: var(--money-out);
}

.tb-statrow--positive .tb-statrow-value {
  color: var(--money-in);
}

.tb-statrow--accent .tb-statrow-value {
  color: var(--accent);
}
</style>

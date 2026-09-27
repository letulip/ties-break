// ⭐ THE RADIO GROUP'S OWN KEYS, IN ONE PLACE – F-10 (docs/review-principles-2026-09-26/06-duplication.md,
// jscpd clones #2 and #4), T4.10.
//
// WHAT WAS HERE BEFORE: four 11-line copies of this function, in `PrologueCard.vue`,
// `KnockDialog.vue`, `BirthdayDialog.vue` and `LifeBeatDialog.vue`, each docstring citing one of the
// others as its origin. The bodies were byte-identical except for one selector, which is the drift
// the finding measured: the origin selected every `button`, the three dialogs
// `button:not([disabled])`. It was INERT – every `PrologueCard` radio binds the same
// `:disabled="busy"`, so the group is never half-disabled – which is why F-10 is a P3 and not a
// defect. The `:not([disabled])` form is the one that ships here, per the finding's own proposal: a
// disabled control is not a place the arrows may park focus.
//
// ⚠⚠ THE ARROWS MOVE FOCUS AND DO NOT SELECT, AND THAT IS THE DOCUMENTED VARIATION RATHER THAN AN
// OMISSION. WAI-ARIA's radio-group pattern checks the radio the arrow lands on «unless doing so
// triggers a significant change» – and in every one of these four groups it does:
//   * `PrologueCard` – on the eight, the nine and the ten the card is FINISHED the moment its one
//     question is answered, so selecting on focus would walk the player off the screen with an arrow;
//   * `KnockDialog` – it would mark a branch of her body's question with an arrow key;
//   * `BirthdayDialog` – it would hand her a present with an arrow key;
//   * `LifeBeatDialog` – it would answer her with an arrow key and take the week with it.
// Focus moves; Space and Enter are the button's own, natively.
//
// ⚠ NO WORDING AND NO TEMPLATE STRING MOVES WITH THIS (CLAUDE.md invariant 4): it reads keys and
// calls `focus()`, and every label stays on its own card.

/** Arrow keys walk the focus round a `role="radiogroup"`, wrapping at both ends.
 *
 *  Bind it as the group's own `@keydown`: `event.currentTarget` IS the group, so one handler serves
 *  any number of groups on a card (`PrologueCard` has two) with nothing to keep in sync.
 *
 *  ⚠ IT RETURNS WITHOUT PREVENTING THE DEFAULT unless it is really going to move focus – a key that
 *  is not an arrow, or a focus that is not inside this group, belongs to whatever owns it. */
export function onRadioGroupKey(event: KeyboardEvent): void {
  const forward = event.key === 'ArrowDown' || event.key === 'ArrowRight'
  const back = event.key === 'ArrowUp' || event.key === 'ArrowLeft'
  if (!forward && !back) return
  const group = event.currentTarget as HTMLElement
  const items = [...group.querySelectorAll<HTMLButtonElement>('button:not([disabled])')]
  const at = items.indexOf(document.activeElement as HTMLButtonElement)
  if (at < 0) return
  event.preventDefault()
  items[(at + (forward ? 1 : items.length - 1)) % items.length]?.focus()
}

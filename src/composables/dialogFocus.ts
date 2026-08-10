// A MODAL DIALOG HOLDS THE KEYBOARD (a11y defect D1, docs/specs/e2e-coverage.md §12).
//
// THE DEFECT, STATED. Two of this app's popups block the whole page - the knock refuses to let the
// engine tick until it is answered, the wrap-up sits over the week's story - and both were plain
// `<div>`s. `getByRole('dialog')` found nothing while one was open, a screen reader was never told a
// decision was blocking the app, and Tab walked straight out of the card and into the tab bar
// behind it, where every control either does nothing or does something the player cannot see.
//
// ⚠ `role="dialog"` + `aria-modal="true"` FIXES ONLY THE FIRST HALF, and shipping that alone would
// have been the worse outcome: `aria-modal` tells assistive technology to ignore everything outside
// the dialog, so a keyboard that can still reach outside it now moves focus somewhere the user is no
// longer being told about. The announcement and the containment have to arrive together, which is
// why this file exists rather than three attributes on two templates.
//
// WHAT IT DOES, EXACTLY THREE THINGS:
//   1. moves focus into the dialog when it opens (the first control, or the card itself);
//   2. keeps Tab and Shift+Tab inside it, and pulls focus back if anything else takes it;
//   3. puts focus back where it came from when the dialog closes.
//
// ⚠ WHAT IT DELIBERATELY DOES NOT DO: it does not mark the rest of the app `inert`. That would mean
// the shell reaching into every overlay's lifecycle - four of them, owned by four files, two of
// which are not this wave's - and `aria-modal` already carries the same promise to assistive
// technology. A MOUSE can still reach the page behind a dialog; the keyboard and the screen reader
// cannot. That is where this stops, and it is written down rather than left to be discovered.
import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/** Everything the keyboard can land on inside `root`, in document order. Deliberately a short,
 *  readable selector rather than a general one: these dialogs are two buttons and some prose, and a
 *  selector that tried to be complete (contenteditable, audio/video controls, positive tabindex)
 *  would be a guess at callers that do not exist. */
function focusables(root: HTMLElement): HTMLElement[] {
  const found = root.querySelectorAll<HTMLElement>(
    'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )
  return Array.from(found)
}

function focus(el: HTMLElement | null | undefined): void {
  // `preventScroll` because the dialog is centred in a fixed overlay: without it a browser may
  // scroll the page behind the scrim to "reveal" a control that was never off screen.
  el?.focus({ preventScroll: true })
}

/**
 * Make `root` a modal dialog's keyboard box for as long as the calling component is mounted.
 *
 * @param root     the element carrying `role="dialog"` - it needs `tabindex="-1"` so that a dialog
 *                 with no controls at all still has somewhere to put focus.
 * @param onEscape what Escape means for this dialog, or omitted where it means nothing. The knock
 *                 has no way out that is not an answer (its own header argues that at length), so it
 *                 passes nothing; the wrap-up already closes on a backdrop click, and Escape is the
 *                 keyboard's spelling of that same gesture.
 */
export function useDialogFocus(root: Ref<HTMLElement | null>, onEscape?: () => void): void {
  let returnTo: HTMLElement | null = null

  function onKeydown(event: KeyboardEvent): void {
    const el = root.value
    if (!el) return

    if (event.key === 'Escape' && onEscape) {
      event.preventDefault()
      onEscape()
      return
    }
    if (event.key !== 'Tab') return

    const items = focusables(el)
    const active = document.activeElement as HTMLElement | null
    // Focus is outside the dialog - something else took it (a click on the page behind, a browser
    // control, a stray `.focus()`). Tab pulls it back rather than continuing the page's own order.
    if (!active || !el.contains(active)) {
      event.preventDefault()
      focus(items[event.shiftKey ? items.length - 1 : 0] ?? el)
      return
    }
    if (!items.length) {
      event.preventDefault()
      return
    }
    const first = items[0]
    const last = items[items.length - 1]
    if (event.shiftKey && active === first) {
      event.preventDefault()
      focus(last)
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      focus(first)
    }
  }

  onMounted(() => {
    if (typeof document === 'undefined') return
    const previous = document.activeElement
    returnTo = previous instanceof HTMLElement ? previous : null
    const el = root.value
    if (!el) return
    // Capture, on the document: the dialog's own listener would never fire on the one press this
    // guard exists for - the Tab that happens while focus has already escaped the card.
    document.addEventListener('keydown', onKeydown, true)
    focus(focusables(el)[0] ?? el)
  })

  onBeforeUnmount(() => {
    if (typeof document === 'undefined') return
    document.removeEventListener('keydown', onKeydown, true)
    // `isConnected` because the thing that opened the dialog may not have survived it - the week
    // button is re-rendered by every snapshot, and focusing a detached node silently sends focus to
    // <body>, which is where it would have gone anyway.
    if (returnTo?.isConnected) focus(returnTo)
  })
}

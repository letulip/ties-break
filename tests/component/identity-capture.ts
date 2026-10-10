// THE IDENTITY RECORDS' TEXT CAPTURE – the one place that decides what «the text of a region» means for a frozen render record (L3-T, 10.10).
//
// WHO USES IT. `principles-d07-inbox-identity` (the inbox sheet) and `principles-e11-shop-identity` (the shop region) freeze, per page, the sentences a player reads – `tests/fixtures/
// inbox-identity/render.json`, `…/shop-identity/render.json` – and fail when a refactor moves one. Each used to read a region with `wrapper.findAll(sel)[i].text()`, i.e. the region's
// `textContent`, whitespace-collapsed.
//
// THE CHURN IT ENDS (L2-6's finding, again in L3-2). `textContent` glues text nodes together exactly as the DOM holds them, so a space that lives at the EDGE of a text node is part of the
// record. Vue's condenser keeps one space at the edge of a node that has content (` kit. `), and a paragraph that becomes an interpolation – `{{ t('…') }}`, the L2 wrap, or a letter's body
// assembled from parts in L3-2 – is one node with no edge space. Rendered, the difference is nil (inline whitespace at the edge of a block collapses), but the record read `kit. Her strings`
// and then `kit.Her strings`: L2-6 re-recorded 38 leaves (4 and 34) and L3-2 another 6, every one a single space at the edge of a node and not one a word, each time by hand and each time with the same
// proof (both records equal with all whitespace removed). A localization that wraps copy node by node would have re-recorded these two files on every landing.
//
// WHAT THIS DOES. The text of a region is its TEXT NODES, each trimmed and whitespace-collapsed, joined by ONE space; an empty node contributes nothing. A node boundary is a boundary
// whatever spaces the nodes carry – so a paragraph becoming an interpolation, or the other way round, no longer moves a leaf. It is the same normalisation the records' tree lines
// (`lineOf`, which trims each node's own text) always applied; the blob was the one half that did not.
//
// ⚠⚠ WHAT IT STILL SEES, so the net does not get weaker where it matters: every WORD (a changed price, title, date or sentence moves its leaf), every node's ORDER, and – through the
// tree hash and the controls, which are untouched – the element structure. What it forgives is exactly the invisible class: whitespace at a node's edge. It also joins two adjacent nodes
// that carry NO space between them with one (`5` and `%` in two spans read `5 %`) – a visible-in-a-record difference from the DOM, never from the screen's words, and the price of making a
// node boundary mean the same thing everywhere. `tests/component/identity-capture.test.ts` holds both halves, with the raw reader as its mutation.
import type { VueWrapper } from '@vue/test-utils'

const SKIP = new Set(['STYLE', 'SCRIPT', 'TEMPLATE'])

/** Every non-empty text node under `root`, in document order, trimmed and whitespace-collapsed. */
export function textNodes(root: Node): string[] {
  const out: string[] = []
  const walk = (node: Node): void => {
    if (node.nodeType === 3) {
      const text = (node.textContent ?? '').replace(/\s+/g, ' ').trim()
      if (text !== '') out.push(text)
      return
    }
    if (node.nodeType === 1 && SKIP.has((node as Element).tagName)) return
    for (const child of [...node.childNodes]) walk(child)
  }
  walk(root)
  return out
}

/** The region's text for a record: its text nodes (see above) joined by one space. */
export function regionText(root: Node): string {
  return textNodes(root).join(' ')
}

/** Every match of `selector` in the wrapper, as `regionText`, joined with the record's own region separator. */
export function regionsText(wrapper: VueWrapper, selector: string): string {
  return wrapper.findAll(selector).map((n) => regionText(n.element)).join(' ⟂ ')
}

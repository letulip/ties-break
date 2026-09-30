// THE BUYER'S LETTER'S SHARED WORDS AND ITS LABEL – the secondary market, S5 (docs/specs/secondary-market-2026-09.md §2b, §2i).
//
// Two surfaces name the same sender and the same lot: the inbox LIST (`InboxSheet.vue`: who wrote, what about) and the PAPER (`OfferLetter.vue`:
// its signature, its lead). They live here once so a list row and the sheet it opens cannot say two different things – the same rule
// `SALE_LABELS` (composables/shop.ts) keeps for the popup's controls.
//
// ⚠ EVERY WORD IS A DRAFT: tabled as SM18 and SM19 in docs/plans/secondary-market-strings-2026-09.md and pinned there letter for letter by
// tests/secondary-market-strings-roundtrip.test.ts.
import type { ShopRowView } from '../shared/protocol'

/** Who writes: a buyer, for a proposal; the market itself, for the notice that an ad has gone quiet (spec §2i). Senders in this inbox are what
 *  the letter IS rather than a name – `Order desk`, `The academy` – so neither is invented a person. */
export const SALE_SENDER = {
  buyer: 'A buyer',
  market: 'The market',
} as const

/** WHAT THE LOT IS CALLED ON A LETTER: the engine's own name for it while the family still holds it (`ShopRowView.fire.label` – the name the ledger
 *  row carries, the academy's family-given name included), the shelf's label once it does not (a lot that has since been sold or withdrawn keeps its
 *  paper), and the id itself for a rung the catalogue no longer lists – the engine's `first.id` fallback, so no new wording is invented for it.
 *  ⚠ A LOOKUP, NEVER A DERIVATION: `SaleOfferTerms` carries no label (a letter is numbers and ids), and the shelf is the one place that knows one. */
export function saleLabelOf(rows: readonly ShopRowView[], itemId: string): string {
  const row = rows.find((r) => r.id === itemId)
  return row?.fire?.label ?? row?.label ?? itemId
}

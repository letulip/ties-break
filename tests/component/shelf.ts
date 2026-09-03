// ⭐⭐ ROUND 30 #5 – HOW A MOUNTED TEST REACHES A SHELF ROW NOW THAT THE SHELF HAS SIX PAGES.
//
// The owner asked for sub-tabs inside Bills and Shop («Внутри Bills и Shop сделать дополнительные
// вкладки как на экране Spending … Для Shop … Invest / Cars / Property / Business (Academy is
// subdivision inside) / Water / Air»). His words in full, and the map from tab to family, are in
// `MoneyScreen.vue`'s script beside `SHELF_TAB_OPTIONS`.
//
// ⚠⚠ WHY THIS FILE EXISTS RATHER THAN A LINE OF `v-if`-DODGING IN EACH TEST. Seven mounted files
// reach into the shelf, and every one of them was written when `wrapper.findAll('.shop-row')`
// returned the WHOLE catalogue. It now returns one tab's worth. Each of those assertions is still a
// true and wanted claim - "the launch is priced at $900,000", "an academy stage names the stage
// under it" - so they are RE-AIMED at the control the player actually has, never deleted. The
// helpers below are what "re-aimed" means concretely: the test presses the tab a person would press
// and then makes exactly the assertion it always made.
//
// ⚠ AND `allShelfRows` IS NOT A CONVENIENCE. §2's rule is that the shelf is a WINDOW - «never a
// locked row, a progress bar or a teaser», every price on screen whether the family can reach it or
// not - and with six tabs the honest form of that claim is "every rung is reachable across the six",
// not "every rung is in the document at once". Walking the tabs is the assertion.
import { expect } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'

/** The six segments, in the order they are drawn. His spellings, and `MoneyScreen.vue` is the
 *  source of truth for them – if a label here stops matching, the tab was renamed and that is
 *  exactly what CLAUDE.md invariant 4 wants somebody to notice.
 *
 *  ⚠⚠ RE-AIMED BY ROUND 34 #16, AND NOTHING HERE WAS LOOSENED. The owner asked for «Business
 *  пододвинуть к Invest в магазине», so `Business` moved from fourth to second and the four spending
 *  families shuffled down behind it. `round30-subtabs.test.ts` asserts the RENDERED pills equal this
 *  list, so the pair still fails the moment the screen and this constant disagree – which is the
 *  only property it ever had. The LABELS are untouched: the item moved a position, not a word. */
export const SHELF_TAB_LABELS = ['Invest', 'Business', 'Cars', 'Property', 'Water', 'Air'] as const

/** The two segments inside Bills. */
export const BILLS_TAB_LABELS = ['Her Kit', 'Advs Portfolio'] as const

/** ⭐⭐ ROUND 35 #3 – THE SHOP OPENS ON A HOME NOW, AND THE SWITCHER IS NOT ON IT.
 *
 *  The owner asked for a front door – «главная магазина становится главной с текущей the shelf,
 *  выбором категорий из 6 карточек» – so pressing `Shop` lands on the shelf plate, the six category
 *  cards and her account, with no segments in the document at all. Item 10 is the reason it works
 *  this way round: «переключалка между категориями магазина на самих страницах магазина остается
 *  текущей и не меняется», so the switcher could not grow a seventh segment for the home.
 *
 *  ⚠ SO EVERY CALLER OF THIS HELPER IS RE-AIMED IN ONE PLACE RATHER THAN SEVEN. The six category
 *  cards carry the SAME six words as the six segments (`MoneyScreen.vue` reads the card's name out
 *  of `SHELF_TAB_OPTIONS`, so they cannot drift), which is what lets one lookup serve both: from the
 *  home the tile is pressed, and the segment is then pressed as well so the tab is genuinely open
 *  and a later `openShelfTab` on the same wrapper behaves exactly as it did before. */
export async function openShelfTab(wrapper: VueWrapper, label: string): Promise<void> {
  if (!wrapper.find('.shelf-tabs').exists()) {
    const tile = wrapper.findAll('.shelf-cat').find((n) => n.text().trim() === label)
    expect(tile, `the ${label} category card on the shop home`).toBeTruthy()
    await tile!.trigger('click')
  }
  const pill = wrapper.findAll('.shelf-tabs button.tab-pill').find((n) => n.text().trim() === label)
  expect(pill, `the ${label} segment of the shelf`).toBeTruthy()
  await pill!.trigger('click')
}

/** Press one of the Bills segments and leave it open. */
export async function openBillsTab(wrapper: VueWrapper, label: string): Promise<void> {
  const pill = wrapper
    .findAll('.money-subtabs button.tab-pill')
    .find((n) => n.text().trim() === label)
  expect(pill, `the ${label} segment of Bills`).toBeTruthy()
  await pill!.trigger('click')
}

/** Every rung on the shelf, gathered by walking all six segments. Leaves the LAST one open, so a
 *  caller that wants to press something should use `shelfRow` instead. */
export async function allShelfRows(wrapper: VueWrapper): Promise<ReturnType<VueWrapper['findAll']>> {
  const rows: ReturnType<VueWrapper['findAll']> = []
  for (const label of SHELF_TAB_LABELS) {
    await openShelfTab(wrapper, label)
    rows.push(...wrapper.findAll('.shop-row'))
  }
  return rows
}

/** Everything the shelf says, across all six segments, concatenated – for the assertions that read
 *  `wrapper.text()` looking for a price or a sentence that now lives one tab away. */
export async function shelfText(wrapper: VueWrapper): Promise<string> {
  let text = ''
  for (const label of SHELF_TAB_LABELS) {
    await openShelfTab(wrapper, label)
    text += ` ${wrapper.text()}`
  }
  return text
}

/** The card for one rung, wherever it lives, with ITS OWN TAB LEFT OPEN – so the caller can press a
 *  control on it straight afterwards. Throws when nothing matches, which is the failure a silent
 *  `undefined` used to turn into an unrelated "cannot read property of undefined" three lines down. */
export async function shelfRow(wrapper: VueWrapper, label: string) {
  for (const tab of SHELF_TAB_LABELS) {
    await openShelfTab(wrapper, tab)
    const hit = wrapper.findAll('.shop-row').find((r) => r.text().includes(label))
    if (hit) return hit
  }
  throw new Error(`no row on the shelf matches ${JSON.stringify(label)} on any of its six segments`)
}

// THE INBOX SHEET, MOUNTED WITH ITS POST ANSWERED – one arrangement, for every suite that renders it.
//
// ⚠⚠ WHY THIS FILE EXISTS (T6.2 · D-07, 28.09). `InboxSheet` used to read the career's whole post off
// `Snapshot.offers`, so a mounted test needed nothing but a posed snapshot. It does not any more: the
// weekly snapshot carries the letters this week still needs (the live ones and the deals in force) and
// the LIST is a query – `useGameStore().loadInbox()`, the album's precedent – asked when the sheet
// opens. There is no worker in the component project, so a test has to answer that query itself, and
// eight suites were about to spell the same three lines. They are here instead.
//
// ⚠ AND THE SECOND FACT A POSED SNAPSHOT NOW OWES: `newestLetterId`. It is the id of the newest letter
// of the WHOLE post, derived in the engine because the carried list's last element is a different
// letter – see `Snapshot.newestLetterId`. A posed snapshot that sets `offers` and not this field is a
// snapshot the engine cannot produce, and `newestLetterId`'s three readers (Home's second dot,
// `tabSeen`, `App.vue`) would read a stale id off the base career. `withPost` sets both together so
// they cannot drift.
//
// ⚠ THE AWAIT IS NOT OPTIONAL AND IT IS NOT A RACE. The query is a round trip: the sheet's first frame
// is deliberately empty chrome (a false «Nothing yet.» on a career with 261 letters would be worse),
// so a test that asserts on the list must let the microtask run. `flushPromises` is the house idiom.
// The first frame itself is pinned in `tests/component/principles-d07-inbox-marks.test.ts`, which is
// the one place that deliberately does NOT await.
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import InboxSheet from '../../src/components/InboxSheet.vue'
import { useGameStore } from '../../src/stores/game'
import type { Offer, Snapshot } from '../../src/shared/protocol'

/** A posed snapshot carrying a posed post: the rows, and the newest letter's id off the same list. */
export function withPost(base: Snapshot, offers: Offer[], week = base.week): Snapshot {
  return {
    ...base,
    week,
    offers,
    newestLetterId: offers.length ? offers[offers.length - 1].id : null,
  }
}

/** THE `inbox` QUERY, ANSWERED – the worker's half of it, provided by the test. `null` is the refusal
 *  arm (no active career, a restarted worker), which the sheet draws as its empty chrome. */
export function answerInbox(post: Offer[] | null): void {
  useGameStore().loadInbox = async () => post
}

/** Mount the sheet over `snapshot` with `post` as the query's answer, and wait for the answer.
 *
 *  `post` defaults to the snapshot's own `offers`, which is what a suite that poses one list means –
 *  it keeps a repointed call site reading exactly as it did before the query existed. */
export async function mountInbox(
  snapshot: Snapshot,
  options: Parameters<typeof mount>[1] = {},
  post: Offer[] | null = snapshot.offers,
): Promise<VueWrapper> {
  const store = useGameStore()
  store.snapshot = snapshot
  answerInbox(post)
  const wrapper = mount(InboxSheet, options) as VueWrapper
  await flushPromises()
  return wrapper
}

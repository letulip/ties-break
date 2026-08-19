// THE INBOX AS A MAIL CLIENT (R14-2, the owner: a list, unread in bold, click to open, a bin per row
// once read, yes/no on delete). This module owns the two facts the ENGINE cannot hold - which letters
// this player has actually read, and which he has cleared off the list - plus the rule for when a
// letter may be cleared at all.
//
// ⚠ WHY NEITHER FACT CAN LIVE IN THE SAVE, and it is the house rule rather than a preference.
// `src/shared/protocol.ts` states it at the inbox dot: "the bell's dot asserts one FACT and not the
// 'unread' it cannot know - the engine cannot know what the player has looked at". `composables/
// inboxCue.ts` is the same discipline one step further on: watermarks are per career, in
// localStorage, NEVER in the save, because "have I looked at this" is a fact about a DEVICE and
// putting it in the save would sync it to another phone and mark things read there that nobody read.
// This file is that rule again, at per-letter grain, because "unread in bold" cannot be answered by
// a single high-water mark: a player opens the interesting letter first.
//
// ⚠ AND "DELETE" IS DISMISS-FROM-THE-LIST, NOT DESTROY - which is the whole design decision in this
// item and the reason it is written out here rather than inferred from the code.
//
//   * There is no engine command to delete a letter, and adding one would be a save-schema change
//     (bump + append-only migration + golden fixture) whose PURPOSE is to destroy records other
//     surfaces still read: `activeKitDeal` reads the signed offer to know what the shop is covering,
//     the season-boundary review writes `eventsPlayed` back onto it, `raiseKitRenewal` reads the deal
//     it is renewing, and the tour's penalty letters are the visible half of a ledger with teeth.
//   * A lapsed letter still EXPLAINS WHAT HAPPENED. "Expired - they needed an answer" is the answer
//     to "why did that sponsor go away", and OfferLetter's own header says the letters are kept
//     "because 'what did I do about that?' is a real question and the answer is the record".
//   * The engine already owns retention where retention belongs: `pruneEntryLetters` drops
//     tournament-desk receipts after a year. A second, player-driven destructor over the same list
//     would be two authorities on one lifetime.
//
// So the bin means "I have dealt with this, take it off my list", the record survives in the save,
// and the confirm says so in those words. If the owner ever wants a real destructor, it is an engine
// command with a migration behind it - not this.
//
// ⚠⚠ AND IT IS CAREER-KEYED BY THE SHARED RULE BUT IS NOT A WATERMARK - the distinction is the
// reason this file still owns its own read and write. `careerKey` and `useCareerSync` (composables/
// inboxCue.ts) are the two halves every career-scoped record shares: one shape of key, and one
// re-read when the career changes. What `useWatermark` adds on top of them is a HIGH-WATER MARK -
// one value, "newer than this is unseen" - and the paragraph above is precisely the argument that a
// mark cannot answer this question: a player opens the interesting letter first, so the fact here is
// a SET at per-letter grain. Its missing-key rule is a third one again, and stated in `readSet`:
// nothing stored means the empty set, which is neither "claim nothing" nor a sentinel - it is the
// safe direction for BOTH facts at once (an unread letter shown in bold costs a bold row; the
// opposite default would hide a live offer). So the scoping is shared and the storage is not.
import { computed, ref } from 'vue'
import { useGameStore } from '../stores/game'
import { careerKey, useCareerSync } from './inboxCue'
import type { Offer } from '../shared/protocol'

const READ_KEY = 'tb:inbox:read'
const BINNED_KEY = 'tb:inbox:binned'

/** WHEN A LETTER MAY BE CLEARED OFF THE LIST, by state. Pure, so the sheet and its tests read one
 *  rule, and exported because "what does delete mean for each state" is the question this item had
 *  to answer before the bin could be drawn.
 *
 *  Two states say NO, and both say it because the letter is still LIVE rather than because it is
 *  precious:
 *
 *    `open` inside its deadline  – it is a decision the parent can still take. A bin here deletes
 *                                  the decision, not a record of one. Answer it and the bin appears.
 *    `signed` still running      – this letter is the only surface in the game that states the terms
 *                                  of the contract she is under: what they cover, what she owes them,
 *                                  and the weeks it runs (`fromWeek`-`untilWeek`). Clearing it hides
 *                                  a live agreement from the person bound by it. It clears the week
 *                                  after the deal ends, like every other finished letter.
 *
 *  Everything else is a record and may go: refused, expired, `info` (the desk's receipts, the tour's
 *  notices, a brand's goodbye), a signed deal that has run its course, and an `open` letter whose
 *  deadline has passed - that one already renders as "Expired" and is no longer a decision. */
export function letterDeletable(offer: Offer, week: number): boolean {
  if (offer.state === 'open') return week > offer.deadlineWeek
  if (offer.state === 'signed') return week > (offer.untilWeek ?? -1)
  return true
}

/** localStorage as a set of ids, per career. Storage failures claim NOTHING - an empty set means
 *  "nothing read" and "nothing binned", and both of those are the safe direction: an unread letter
 *  shown in bold costs a bold row, and a letter that refuses to stay hidden costs a second press.
 *  The opposite defaults would hide a live offer. */
function readSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [])
  } catch {
    return new Set()
  }
}

function writeSet(key: string, value: Set<string>): void {
  try {
    localStorage.setItem(key, JSON.stringify([...value]))
  } catch {
    // storage unavailable: the list still behaves for this session, it just will not persist
  }
}

export interface InboxMail {
  isRead: (id: string) => boolean
  markRead: (id: string) => void
  isBinned: (id: string) => boolean
  bin: (id: string) => void
}

/**
 * The two per-letter facts, scoped to the career on the snapshot.
 *
 * ⚠ THE STORED SETS ARE PRUNED TO THE LETTERS THAT STILL EXIST, on every write. `pruneEntryLetters`
 * drops tournament-desk receipts a year after they were filed, so an unpruned set grows for the whole
 * length of a career and is mostly ids of letters nobody can see. Pruning on write keeps it the size
 * of the inbox. It is also why the prune reads the SNAPSHOT rather than a stored count: the list is
 * the authority on what exists, and this module is only ever an annotation on it.
 */
export function useInboxMail(): InboxMail {
  const game = useGameStore()
  const careerId = computed(() => game.snapshot?.careerId ?? '')
  const key = (prefix: string) => careerKey(prefix, careerId.value)

  const read = ref<Set<string>>(new Set())
  const binned = ref<Set<string>>(new Set())

  function sync(): void {
    read.value = readSet(key(READ_KEY))
    binned.value = readSet(key(BINNED_KEY))
  }
  // Switching careers re-reads THAT career's own annotations. A global key would collide, which is
  // the R9-21b lesson inboxCue.ts records at length - and `useCareerSync` is where that lesson lives
  // as code, so this scope cannot drift out of step with the watermarks it sits beside.
  useCareerSync(sync)

  function persist(which: 'read' | 'binned'): void {
    if (!careerId.value) return
    const live = new Set((game.snapshot?.offers ?? []).map((o) => o.id))
    const target = which === 'read' ? read : binned
    const pruned = new Set([...target.value].filter((id) => live.has(id)))
    target.value = pruned
    writeSet(key(which === 'read' ? READ_KEY : BINNED_KEY), pruned)
  }

  return {
    isRead: (id) => read.value.has(id),
    markRead: (id) => {
      if (read.value.has(id)) return
      read.value = new Set(read.value).add(id)
      persist('read')
    },
    isBinned: (id) => binned.value.has(id),
    bin: (id) => {
      if (binned.value.has(id)) return
      binned.value = new Set(binned.value).add(id)
      persist('binned')
    },
  }
}

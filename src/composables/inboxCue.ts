// THE TWO THINGS THAT ARRIVE FOR THE PLAYER, and the ONE way the app decides whether either of them
// is still unseen: the NEWS FEED (the diary's non-financial events) and the INBOX (the letters).
//
// ⚠ WHY THIS FILE EXISTS AT ALL - it is a bug fix, not tidying (owner, 04.08: «Красная точка на
// колокольчике на домашнем экране не сбрасывается»). Home's bell dot read
//
//     events.some(e => e.week === currentWeek && e.type !== 'expense' && e.type !== 'income')
//
// which is not "there is something you have not read" but "this week had a diary line in it" - and a
// played week essentially always does. So the dot was on for ever, it did not respond to being
// tapped, and a signal that is always on is not a signal. The App shell had ALREADY solved the same
// problem for the Home TAB's dot, with a per-career watermark of the newest news id; the bell was
// simply never given one. This module is that rule, extracted so the bell and the tab cannot answer
// "is there news" differently, and extended to letters for the inbox cue.
//
// ⚠ WATERMARKS ARE PER CAREER, IN localStorage, NEVER IN THE SAVE. Event ids are per-career counters,
// so a global key collides across careers (the R9-21b lesson), and "have I looked at this" is a fact
// about a DEVICE rather than about a world - putting it in the save would sync it to another phone
// and mark things read there that nobody read.
//
// ⚠ A MISSING WATERMARK IS THE CURRENT VALUE, NEVER ZERO/EMPTY. A career restored from a file, or one
// that predates this code, is a case where the app does not KNOW whether anything was read - and a
// dot must not claim a fact it cannot hold (the argument is written out at `storedTrophyWatermark`
// in App.vue, and this is the same discipline in a second place).
import { computed, ref, watch, type ComputedRef } from 'vue'
import { useGameStore } from '../stores/game'
import type { Snapshot, WorldEvent } from '../shared/protocol'

/** THE ONE DEFINITION OF "NEWS". The financial events are the Money ledger's, not the feed's - Home
 *  has never shown them and the bell has never counted them. */
export function isNewsEvent(e: WorldEvent): boolean {
  return e.type !== 'expense' && e.type !== 'income'
}

/** The highest news-event id in a snapshot, or -1 when there is no news at all. Monotonic within a
 *  career (ids are a per-career counter), which is what makes "greater than the watermark" a sound
 *  test even though the feed itself is capped and prunes from the front. */
export function latestNewsId(snapshot: Snapshot | null | undefined): number {
  let latest = -1
  for (const e of snapshot?.events ?? []) if (isNewsEvent(e) && e.id > latest) latest = e.id
  return latest
}

/** THE NEWEST LETTER IN THE INBOX, by id, or null for an empty inbox.
 *
 *  ⚠ THE NEWEST LETTER'S ID, NOT A COUNT, and the difference is a real bug avoided. `offers.length`
 *  is NOT monotonic - `pruneEntryLetters` drops tournament-desk receipts after a year - so a count
 *  can fall, and a fallen count against a stored watermark reads as "nothing new" for as long as it
 *  takes to climb back. The list is append-only at the END and pruned only at the front, so the last
 *  element is stable and changes exactly when a letter arrives.
 *
 *  ⚠ AND IT DELIBERATELY DOES NOT ASK `state`. `Snapshot.offerOpen` (engine: `hasLiveOffer`) is the
 *  right question for the INBOX ICON's dot - "is a decision waiting" - and it is already wired
 *  there. This is a different question: "did something LAND in the family's post". Since 04.08 a kit
 *  deal ends with a NOTICE (`state: 'info'`), which is never live and would therefore never ring or
 *  raise a dot if this asked the same question the icon does - and that notice is precisely the one
 *  the owner said the player misses ("the bills are his again"). Two dots, two facts, on purpose. */
export function newestLetterId(snapshot: Snapshot | null | undefined): string | null {
  const offers = snapshot?.offers ?? []
  return offers.length ? offers[offers.length - 1].id : null
}

/** What a watermark gives its caller: the live fact, and the one way to clear it. */
export interface Watermark {
  /** true while the newest thing is newer than what this scope has marked seen */
  unseen: ComputedRef<boolean>
  /** the player has now looked - clears `unseen` until the next arrival */
  markSeen: () => void
}

/**
 * ONE WATERMARK, over whichever "newest" its caller hands it.
 *
 * `keyPrefix` is the localStorage namespace, and it is a PARAMETER because two surfaces watch the
 * same news with different meanings: the Home TAB's dot means "news arrived while you were on
 * another tab" (cleared by arriving on Home), the BELL's means "news arrived that you have not gone
 * to the feed for" (cleared by tapping the bell). One key for both would make each one clear the
 * other, which is exactly the "dot that never means anything" this file is fixing.
 */
function useWatermark<T extends number | string | null>(
  keyPrefix: string,
  newest: ComputedRef<T>,
  isNewer: (now: T, seen: T) => boolean,
): Watermark {
  const game = useGameStore()
  const key = () => `${keyPrefix}:${game.snapshot?.careerId ?? ''}`
  // ⚠ AN EMPTY INBOX IS STORED AS '', NEVER AS THE STRING "null". `String(null)` is `"null"`, which
  // reads back as a five-character id that no letter will ever have - harmless today (nothing equals
  // it, so the first real letter still counts as new) and a trap the day anything compares these
  // values for anything else. '' round-trips to `null` and says what it means in devtools.
  const EMPTY = ''
  const read = (): T => {
    try {
      const stored = localStorage.getItem(key())
      if (stored === null) return newest.value
      if (typeof newest.value === 'number') return Number(stored) as T
      return (stored === EMPTY ? null : stored) as T
    } catch {
      return newest.value // storage unavailable: claim nothing
    }
  }
  const write = (value: T): void => {
    try {
      localStorage.setItem(key(), value === null ? EMPTY : String(value))
    } catch {
      // storage unavailable - the dot still clears for this session, it just will not persist
    }
  }
  const seen = ref(read()) as { value: T }
  function markSeen(): void {
    if (isNewer(newest.value, seen.value)) {
      seen.value = newest.value
      write(newest.value)
    }
  }
  /**
   * Re-read this career's watermark, and PERSIST one for a career that has never had one.
   *
   * ⚠ THE WRITE IS NOT OPTIONAL, and leaving it out is a bug that hides itself. `read()` falls back
   * to the current newest when nothing is stored - the "claim nothing" rule - and App.vue mounts
   * every screen FRESH on each tab visit (a plain `v-if` chain, no keep-alive). So a watermark that
   * is never written is re-seeded to "now" on every single visit, and the dot it feeds can never
   * light: found in the browser, on a week that had definitely produced news.
   */
  function sync(): void {
    seen.value = read()
    // No career yet (the shell builds these before the first snapshot lands) means no key to write
    // under - the careerId watcher below does the seeding the moment there is one.
    if (!game.snapshot?.careerId) return
    try {
      if (localStorage.getItem(key()) === null) write(seen.value)
    } catch {
      // as above
    }
  }
  sync()
  // Switching careers re-reads THAT career's own watermark - so a plain load never invents an
  // arrival the player has not been shown. Careers advance independently; a global key would collide.
  watch(() => game.snapshot?.careerId, sync)
  return { unseen: computed(() => isNewer(newest.value, seen.value)), markSeen }
}

/** The news watermark for one surface. See `useWatermark` for why the key is a parameter. */
export function useNewsWatermark(keyPrefix: string): Watermark & { latestId: ComputedRef<number> } {
  const game = useGameStore()
  const latestId = computed(() => latestNewsId(game.snapshot))
  return { ...useWatermark(keyPrefix, latestId, (now, seen) => now > seen), latestId }
}

/** The inbox watermark: "a letter has landed that this device has not been shown". */
export function useLetterWatermark(keyPrefix: string): Watermark & { newestId: ComputedRef<string | null> } {
  const game = useGameStore()
  const newestId = computed(() => newestLetterId(game.snapshot))
  return {
    // null (an empty inbox) is never "new": there is nothing to have arrived.
    ...useWatermark(keyPrefix, newestId, (now, seen) => now !== null && now !== seen),
    newestId,
  }
}

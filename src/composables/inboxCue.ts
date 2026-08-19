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
// in App.vue, and this is the same discipline in a second place). That is the DEFAULT and not the
// only rule: the popups that must be SHOWN when nothing is known take the opposite one, and both are
// spelled out at the `absent` parameter of `useWatermark`.
//
// ⚠ `useWatermark` IS EXPORTED NOW, AND IT IS MEANT TO BE THE APP'S ONLY COPY. It was private here
// while five other surfaces hand-rolled the same read / write / re-read-on-career-switch around
// their own key - which is how the two opposite "missing key" rules ended up as two unrelated pieces
// of code instead of one parameter with the argument written beside it.
//
// ⚠ FOUR OF THOSE FIVE ARE STILL HAND-ROLLED, IN App.vue, AND THIS IS THE NOTE THAT SAYS SO rather
// than a half-finished job with nothing recording it: `weekSeenKey` / `lastSeenThisWeek`,
// `trophySeenKey` / `seenTrophyPieces`, `seasonWrapSeenKey` / `seasonWrapSeen` and `injurySeenKey` /
// `injuryReported`. Each is expressible here without a change of behaviour, and the parameters each
// one needs are recorded at `absent` below and at `Watermark.seen`. The trophy cabinet is the
// claim-nothing one; the other three are sentinels (-1, null, null). The blocker is not the code:
// three source-pin tests read those key literals out of App.vue's text
// (tests/round13-nav.test.ts, tests/round16-injury-surfacing.test.ts, tests/trophy-podium.test.ts),
// so moving them is a two-file change and the pins have to be re-aimed at the same commit.
//
// `careerKey` and `useCareerSync` are the two halves below the watermark, exported for the one scope
// that is career-keyed but is NOT a watermark: `inboxMail.ts` stores a SET of letter ids, at
// per-letter grain, which no high-water mark can hold.
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

/** `prefix:careerId` - THE ONE SHAPE OF A CAREER-SCOPED KEY, so no two surfaces can namespace the
 *  same fact differently. The empty string keeps it total for the snapshot-less moment before the
 *  first career lands rather than inventing a second code path for one. */
export function careerKey(prefix: string, careerId: string | null | undefined): string {
  return `${prefix}:${careerId ?? ''}`
}

/** Run `sync` NOW and again whenever the career changes.
 *
 *  Switching careers re-reads THAT career's own record - so a plain load never invents an arrival
 *  the player has not been shown. Careers advance independently; a global key would collide (the
 *  R9-21b lesson). Exported because the per-letter annotations in `inboxMail.ts` are scoped by
 *  exactly this rule while storing something a watermark cannot hold - see its own header. */
export function useCareerSync(sync: () => void): void {
  const game = useGameStore()
  sync()
  watch(() => game.snapshot?.careerId, sync)
}

/** What a watermark gives its caller: the live fact, the stored mark, and the one way to clear it. */
export interface Watermark<T> {
  /** true while the newest thing is newer than what this scope has marked seen */
  unseen: ComputedRef<boolean>
  /** the mark itself, for a caller whose dot is not `isNewer` alone - the trophy cabinet holds its
   *  dot back while the trophy is still flying, and the This-week dot also asks whether a recap
   *  exists, so both need the number rather than the verdict. */
  seen: ComputedRef<T>
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
 *
 * ⚠⚠ `absent` IS A PARAMETER BECAUSE THE APP HOLDS TWO OPPOSITE ANSWERS TO "WHAT DOES A MISSING KEY
 * MEAN", AND BOTH ARE DELIBERATE. Flattening them would silently break one half:
 *
 *   omitted  = CLAIM NOTHING. A missing key reads as the CURRENT newest, so a career restored from
 *              a file, or one that predates this code, asserts no arrival it cannot know about.
 *              This is the news feed's, the letterbox's and the trophy cabinet's rule, argued at the
 *              top of this file and again at `storedTrophyWatermark` in App.vue.
 *   { value } = a SENTINEL. A missing key reads as that value, whatever the newest happens to be.
 *              This is the rule for the things that must be SHOWN when nothing is known: the injury
 *              report ("a popup that cannot know whether she was told she is hurt must assume she
 *              was not"), the tour briefing ("an absent key means unbriefed"), the season wrap-up
 *              and the This-week dot. The failure modes are not symmetric - a second showing costs
 *              a tap, and never showing it is the bug each of those items exists to fix.
 *
 * ⚠ AND THE SENTINEL ALSO TURNS THE SEEDING WRITE OFF, which is not a detail. The write in `sync()`
 * exists because a CLAIM-NOTHING watermark that is never persisted is re-seeded to "now" on every
 * mount and can never light (the argument is at `sync` below). A sentinel needs no seed - `read()`
 * answers the same with or without a stored key - and writing one would make "nothing is stored for
 * this career" false for a career nobody has been shown anything.
 */
export function useWatermark<T extends number | string | null>(
  keyPrefix: string,
  newest: ComputedRef<T>,
  isNewer: (now: T, seen: T) => boolean,
  absent?: { value: T },
): Watermark<T> {
  const game = useGameStore()
  const key = () => careerKey(keyPrefix, game.snapshot?.careerId)
  // ⚠ AN EMPTY INBOX IS STORED AS '', NEVER AS THE STRING "null". `String(null)` is `"null"`, which
  // reads back as a five-character id that no letter will ever have - harmless today (nothing equals
  // it, so the first real letter still counts as new) and a trap the day anything compares these
  // values for anything else. '' round-trips to `null` and says what it means in devtools.
  const EMPTY = ''
  /** What this scope believes when there is nothing to read - see the `absent` note above. Storage
   *  being unavailable is the same case as a key that is not there: the app does not KNOW, and each
   *  caller has already said what it wants done about that. */
  const fallback = (): T => (absent ? absent.value : newest.value)
  const read = (): T => {
    try {
      const stored = localStorage.getItem(key())
      if (stored === null) return fallback()
      if (typeof newest.value === 'number') return Number(stored) as T
      return (stored === EMPTY ? null : stored) as T
    } catch {
      return fallback()
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
    // A sentinel scope stores nothing it has not been told - see the `absent` note above.
    if (absent) return
    // No career yet (the shell builds these before the first snapshot lands) means no key to write
    // under - the careerId watcher does the seeding the moment there is one.
    if (!game.snapshot?.careerId) return
    try {
      if (localStorage.getItem(key()) === null) write(seen.value)
    } catch {
      // as above
    }
  }
  useCareerSync(sync)
  return {
    unseen: computed(() => isNewer(newest.value, seen.value)),
    seen: computed(() => seen.value),
    markSeen,
  }
}

/** The news watermark for one surface. See `useWatermark` for why the key is a parameter. */
export function useNewsWatermark(
  keyPrefix: string,
): Watermark<number> & { latestId: ComputedRef<number> } {
  const game = useGameStore()
  const latestId = computed(() => latestNewsId(game.snapshot))
  return { ...useWatermark(keyPrefix, latestId, (now, seen) => now > seen), latestId }
}

/** The inbox watermark: "a letter has landed that this device has not been shown". */
export function useLetterWatermark(
  keyPrefix: string,
): Watermark<string | null> & { newestId: ComputedRef<string | null> } {
  const game = useGameStore()
  const newestId = computed(() => newestLetterId(game.snapshot))
  return {
    // null (an empty inbox) is never "new": there is nothing to have arrived.
    ...useWatermark(keyPrefix, newestId, (now, seen) => now !== null && now !== seen),
    newestId,
  }
}

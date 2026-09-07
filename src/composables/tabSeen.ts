// =================================================================================================
// THE FOUR "HAS THE PLAYER SEEN THIS TAB" MARKS, AND THE DOTS THEY DECIDE
// =================================================================================================
//
// ⚠⚠ MOVED OUT OF `App.vue` VERBATIM (wave B, 07.09 – docs/specs/next-waves-2026-09.md §Wave B,
// finding U-04 in docs/review-principles-2026-09-05/03-ui.md). NOT A REWRITE. Every block below is
// character for character the block that stood in the shell, comments included, in the order it
// stood in – so `git log -p` on this file reads as a move and a reviewer has nothing to re-derive.
// The shell's script was 1,505 lines and held eight concerns; this is the first of them to get a
// file, chosen because it has the most independent state and the fewest edges outward.
//
// WHAT IS HERE: four marks, four watchers, four dot computeds, and nothing else.
//
//   tab        mark (localStorage)               the dot
//   play       tb:lastSeenSeasonWeek:<career>    `seasonHasNew`   – a newer calendar marker
//   week       tb:lastSeenThisWeek:<career>      `weekTabDot`     – a recap for a week not visited
//   home       tb:lastSeenNewsId:<career>        `homeHasNews`    – unread news OR unopened post
//              tb:lastSeenLetter:<career>
//   trophies   tb:lastSeenTrophies:<career>      `trophyTabDot`   – silverware since the last visit
//
// ⚠ THE MARKS ARE PER DEVICE AND NEVER REACH THE SAVE, and that property is the reason this could
// move at all. Every one of them is a `useWatermark` over web storage, scoped `prefix:careerId`;
// a career lives in IndexedDB and reaches the UI as a `Snapshot` (invariant 1), so nothing here can
// corrupt one. The guarded read/write is `inboxCue.ts`'s and it swallows both directions, which is
// what keeps a private-mode browser – where the PROPERTY ACCESS itself throws – from taking the
// shell out rather than one dot (U-07).
//
// ⚠ THE SHELL STILL OWNS `tab`, THE WEEK AND THE TEMPLATE. They are handed in rather than reached
// for: `tab` is the app's whole navigation and belongs to the shell, and `week` is on screen in two
// other places. What comes back is four dots plus the two marks and the two ids the shell's OTHER
// watchers need – the post-advance watcher marks This-week when a week resolves under an open tab,
// and the chime watcher marks Home when post lands while Home is up. Those two stayed behind on
// purpose: one is the week loop and one is a sound, and neither is a tab dot.
//
// ⚠ PINNED AS BEHAVIOUR, NOT AS TEXT. `tests/component/r38-tab-seen.test.ts` mounts the shell and
// drives all four through their real doors – the bar's buttons and Home's next-tournament plate –
// asserting when each fires and what it writes. It was written and made red on the pre-move source
// first (inverting any of the four conditions fails it in two arms), so "green after the move" is a
// statement about behaviour rather than about this file having compiled.
import { computed, watch, type ComputedRef, type Ref } from 'vue'
import { useGameStore } from '../stores/game'
import { useLetterWatermark, useNewsWatermark, useWatermark } from './inboxCue'
import { recapExists, thisWeekDotShows } from './weekRecap'
import { trophyDotShows, trophyPieces, useTrophyFlight } from './trophyArrival'

/** What the shell gets back: the four dots, plus the two marks and two ids its own watchers need. */
export interface TabSeen {
  /** the Season tab has a calendar marker newer than the last visit */
  seasonHasNew: ComputedRef<boolean>
  /** a recap exists for a week the This-week screen has not been opened on */
  weekTabDot: ComputedRef<boolean>
  /** unread news or unopened post, and the player is not standing on Home */
  homeHasNews: ComputedRef<boolean>
  /** the cabinet holds a piece that arrived since it was last opened */
  trophyTabDot: ComputedRef<boolean>
  /** for the post-advance watcher: a week that resolves under an OPEN This-week tab is seen */
  markThisWeekSeen: () => void
  /** for the chime watcher: post landing while Home is up is seen */
  markHomeSeen: () => void
  /** the chime watcher's two sources – it rings on an arrival, which is a CHANGE in these */
  latestNewsId: ComputedRef<number>
  newestLetterId: ComputedRef<string | null>
}

/**
 * `tab` and `week` are the shell's; everything else below is this module's.
 *
 * ⚠ `tab` IS TYPED AS A `Ref<string>` RATHER THAN AS `TabId`, and that is deliberate rather than
 * lazy: `TabId` is declared in `App.vue`, and importing it back would put a composable in a cycle
 * with the component that calls it. The four ids this module compares against are literals in the
 * watchers below, which is where they have always been.
 */
export function useTabSeen(tab: Ref<string>, week: ComputedRef<number>): TabSeen {
  const game = useGameStore()
  // Round 5 item 23: a small accent dot on the Season tab until the player has visited it
  // since the last "New events on the calendar" marker. UI-only state (localStorage), no
  // engine change – the marker text itself is emitted from world.ts's ensureSeason.
  const SEASON_SEEN_KEY = 'tb:lastSeenSeasonWeek'

  // --- Season tab "new events" accent dot (item 23) ---------------------------
  //
  // ⚠⚠ R2-08 – THIS ONE WAS NOT MERELY DUPLICATED, IT WAS WRONG, and it is the find that pays for the
  // whole consolidation. The key was GLOBAL (`tb:lastSeenSeasonWeek`, no career on it) while the value
  // under it is a WEEK NUMBER, so two careers shared one mark: opening Season on a week-90 career
  // wrote 90, and the week-12 career beside it then read every marker it had never been shown as
  // already seen, for the next seventy-eight weeks. That is precisely the R9-21b collision
  // composables/inboxCue.ts was written to end, still living in the file that learned the lesson.
  // Going through `useWatermark` scopes it by `careerId` and repairs it; a device's season dot lights
  // once more on the changeover, which is the trade every watermark in this app already makes.
  //
  // ⚠ THE MARK NAMES THE MARKER'S WEEK, NOT THE CURRENT ONE. It used to store `week` on the visit; the
  // helper stores whatever `newest` says, which is the newest marker's week. The predicate is
  // unchanged either way – markers are only ever emitted for weeks that have happened, so both values
  // make `latest > seen` false – and the honest one is the one that names what was actually seen.
  const latestSeasonMarkWeek = computed(() => {
    let latest = -1
    for (const e of game.snapshot?.events ?? []) {
      if (e.type === 'info' && e.text === 'New events on the calendar' && e.week > latest) latest = e.week
    }
    return latest
  })
  const { unseen: seasonHasNew, markSeen: markSeasonSeen } = useWatermark(
    SEASON_SEEN_KEY,
    latestSeasonMarkWeek,
    // `now >= 0` is the "there is no marker at all" arm, kept explicit: a sentinel of -1 makes the
    // comparison alone sufficient today and would stop being sufficient the day the sentinel moved.
    (now, seen) => now >= 0 && now > seen,
    { value: -1 },
  )
  watch(tab, (t) => {
    if (t === 'play') markSeasonSeen()
  })

  // --- R13-12: the This-week tab's accent dot – a FRESH recap is unseen -------------
  // "Fresh" is the shared rule in composables/weekRecap.ts: a recap exists for the CURRENT week
  // (same predicate ThisWeekScreen renders the card by) and the tab has not been visited since it
  // appeared. The seen watermark is the snapshot week at the last visit, persisted per career
  // (careers advance independently, so a global key would collide – the R9-21b news lesson), and
  // re-read on a career switch so a plain load never invents freshness the stored watermark denies.
  //
  // ⚠ R2-08 – IT IS `useWatermark`'s NOW, and the three sentences above are its three parameters.
  // "Persisted per career" is `careerKey` inside the helper; "re-read on a career switch" is
  // `useCareerSync`; "a missing key is -1, i.e. never visited" is the SENTINEL form of `absent`, which
  // is also what keeps this scope from seeding a key for a career nobody has shown anything to. The
  // dot needs the NUMBER rather than the verdict (`thisWeekDotShows` also asks whether a recap
  // exists), which is exactly why `Watermark.seen` is on the interface.
  const WEEK_SEEN_PREFIX = 'tb:lastSeenThisWeek'
  const { seen: lastSeenThisWeek, markSeen: markThisWeekSeen } = useWatermark(
    WEEK_SEEN_PREFIX,
    week,
    // NOT `>`: the mark is "the week I was last on this tab", and a career loaded at an EARLIER week
    // than the mark (an imported save, a rolled-back device) must re-arm rather than stay silent.
    // This is character for character the old `lastSeenThisWeek.value !== week.value` write gate.
    (now, seen) => now !== seen,
    { value: -1 },
  )
  const weekTabDot = computed(() =>
    thisWeekDotShows(recapExists(game.snapshot), week.value, lastSeenThisWeek.value),
  )
  watch(tab, (t) => {
    if (t === 'week') markThisWeekSeen()
  })

  // --- R9-21b: news cue – a soft "тилинь" + a Season-style accent dot on the Home tab -----
  // News = the non-financial events HomeScreen's feed shows (expense/income live on Money).
  // "Last looked at the feed" ≈ the Home tab being active: seen is marked when Home becomes
  // active and whenever a snapshot lands while it is. The cue fires on any genuinely NEW news
  // event (id above the last-seen watermark), whatever tab is up – the owner's complaint was
  // missing news entirely while week-skipping. Watermark persisted per career (event ids are
  // per-career counters, so a global key would collide across careers).
  // ⚠ THE WATERMARK MOVED INTO composables/inboxCue.ts, WHERE HOME'S BELL CAN READ THE SAME RULE. The
  // derivation that used to sit inline here (walk the feed, take the highest non-financial id, compare
  // against a per-career localStorage number) is unchanged - it is `useNewsWatermark`, and the storage
  // key it is given is the one this block has always used, so an existing device keeps its place. What
  // changed is that the bell on Home now gets a watermark of its own from the same module instead of
  // re-deriving "is there news" a third way and getting it wrong (item 5, 04.08).
  const { latestId: latestNewsId, unseen: newsUnseenOffHome, markSeen: markNewsSeen } =
    useNewsWatermark('tb:lastSeenNewsId')

  // --- THE INBOX CUE (owner, 04.08: «Добавить отключаемый, но очень аккуратный и консервативный дзынь
  // на входящее письмо и точечку возле иконки home») ------------------------------------------------
  //
  // ⚠ A LETTER IS NOT A NEWS EVENT, which is why it needs its own watch even though the feed already
  // has one. A sponsor's letter does write a feed line beside itself; the TOURNAMENT DESK's receipts
  // (engine/offers.ts `raiseEntryLetter`) write none at all, so under the news rule alone half the
  // post arrives in silence. `newestLetterId` is the arrival, and the module's header argues why it is
  // the last id rather than a count or `offerOpen`.
  //
  // ⚠ MUTEABLE BY CONSTRUCTION, NOT BY A NEW SWITCH: `playSfx` returns at once while `muted`, and
  // `muted` is the persisted `tb-muted` flag behind More's "Sound effects" row (src/audio/sfx.ts). So
  // the owner's «отключаемый» is the switch he already has, it survives a reload, and no second player
  // or second preference was invented for this.
  const { unseen: letterUnseen, markSeen: markLettersSeen, newestId: newestLetterId } =
    useLetterWatermark('tb:lastSeenLetter')

  // ONE DOT ON THE HOME TAB, TWO FACTS BEHIND IT - «точечку возле иконки home». It is deliberately the
  // same dot the news already raised rather than a second marker beside it: both sentences are "there
  // is something on Home you have not seen", the tab has room for one answer, and a bar with two dots
  // on one icon says nothing that one dot does not.
  const homeHasNews = computed(() => tab.value !== 'home' && (newsUnseenOffHome.value || letterUnseen.value))
  function markHomeSeen(): void {
    markNewsSeen()
    markLettersSeen()
  }
  watch(tab, (t) => {
    if (t === 'home') markHomeSeen()
  })

  // --- THE TROPHIES TAB'S DOT (31.07, the podium slice) --------------------------------------------
  //
  // ⚠ IT ASSERTS A FACT, NOT AN "UNREAD". Home's bell states the house rule in its own words – "the
  // bell's dot asserts one FACT and not the 'unread' it cannot know" – and this dot's fact is:
  //
  //     THE CABINET HOLDS A PIECE OF SILVERWARE THAT ARRIVED AFTER THE LAST TIME IT WAS OPENED.
  //
  // `trophiesByTier` only ever grows, so the count of pieces in it is monotonic and the watermark is
  // that count at the player's last visit. `pieces > seen` is then arithmetic on two integers, and it
  // stops being true the instant the cabinet is opened – which is why the dot goes out then, rather
  // than because we have decided anybody has "seen" anything. The long argument is in the composable.
  //
  // The watermark is per career, in localStorage, like the news and This-week ones: careers advance
  // independently, so a global key would collide (the R9-21b lesson).
  //
  // ⚠ A MISSING WATERMARK IS THE CURRENT COUNT, NEVER ZERO. A career with trophies and no stored
  // watermark – a save from before this shipped, another device – is a case where the app does not
  // KNOW whether the cabinet was ever opened, and a dot must not claim a fact it cannot hold. Reading
  // the present count asserts nothing and lets the next trophy be the first one it speaks about.
  //
  // ⚠ R2-08 – THAT PARAGRAPH IS NOW A PARAMETER, WHICH IS THE WHOLE POINT OF THE MOVE. It is
  // `useWatermark`'s CLAIM-NOTHING form – `absent` omitted – and the helper's own header argues it at
  // length beside the opposite rule the reports below take. It also brings the SEEDING WRITE with it:
  // a claim-nothing mark that is never persisted is re-seeded to "now" on every mount (every screen
  // here is a plain `v-if`, so it mounts fresh on each visit) and its dot can never light. That used
  // to be the hand-written `if (getItem(...) === null) markTrophiesSeen()` in the career watcher.
  const TROPHY_SEEN_PREFIX = 'tb:lastSeenTrophies'
  const trophyPieceCount = computed(() => trophyPieces(game.snapshot))
  const { seen: seenTrophyPieces, markSeen: markTrophiesSeen } = useWatermark(
    TROPHY_SEEN_PREFIX,
    trophyPieceCount,
    (now, seen) => now > seen,
  )

  // ⚠ THE FLIGHT IS A MODULE-LEVEL CHANNEL, SO ASKING FOR IT HERE COSTS NOTHING AND SHARES ONE REF.
  // `trophyArrival.ts` keeps exactly one `flight` at module scope ("one flight can be in the air at
  // a time, by construction") and `useTrophyFlight` is its accessor, so this is the same ref the
  // shell renders the flying trophy from – not a second one. The dot is HELD while it is in the air
  // so it lands WITH the trophy instead of already being there when it arrives; that argument, and
  // why nothing is withheld from anybody by it, is at `trophyDotShows` in the same module.
  const { flight: trophyFlight } = useTrophyFlight()
  const trophyTabDot = computed(() =>
    trophyDotShows(trophyPieceCount.value, seenTrophyPieces.value, trophyFlight.value !== null),
  )

  // ⚠ THE CAREER WATCHER THAT USED TO SIT HERE IS `useCareerSync`'s, INSIDE THE HELPER – it re-reads
  // THAT career's own watermark on a switch and writes one for a career that has never had one, so a
  // plain load never invents a trophy the player has not been shown. It was the fifth transcription of
  // that rule in this file; there are none left.
  watch(tab, (t) => {
    if (t === 'trophies') markTrophiesSeen()
  })
  // A trophy landing while the cabinet is ALREADY the open screen is seen the moment it lands – the
  // same clause the news watermark carries for the Home tab, and the reason neither dot can appear on
  // the screen that would clear it.
  watch(trophyPieceCount, () => {
    if (tab.value === 'trophies') markTrophiesSeen()
  })

  return {
    seasonHasNew,
    weekTabDot,
    homeHasNews,
    trophyTabDot,
    markThisWeekSeen,
    markHomeSeen,
    latestNewsId,
    newestLetterId,
  }
}

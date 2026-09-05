// ⭐⭐⭐ HER IDENTITY, COMPUTED ONCE – ROUND 36 SECOND PASS, P2-6.
//
// The owner, 05.09.2026, after playing the built wave: «и аватар с текущей позицией и рангом (так
// же, как и все остальные плашки) на десктоп в боковом меню живут на всех страницах неизменно», and
// one item earlier: «давай на главной десктопе текущую дату всю вынесем в 2 строки и поставим справа
// от аватарки круглой, тогда она будет всегда видна и будет удобно».
//
// That is his ruling on the open decision `D75`. The block stops being Home's and becomes the
// shell's – permanent chrome on the desktop rail, on all ten screens, exactly the way the dashboard
// tiles he names as the model already are.
//
// -------------------------------------------------------------------------------------------------
// ⚠⚠ WHY A COMPOSABLE AND NOT A SECOND COPY OF THE ARITHMETIC IN THE SHELL
// -------------------------------------------------------------------------------------------------
// D75 shipped a `<Teleport>` precisely to avoid this file, and its reasoning was right: the rank chip
// is FIVE derived facts deep – which table she is counted on at all, the active ladder, her place on
// THAT table, whether she is ranked, and the movement since last week – and a shortcut that
// recomputes its own number is this repo's named recurring disease (`HouseholdStrip.vue`'s header
// records the version of it that actually shipped, and the Home chip's own note records the round
// where Home said «#4» while Stats said «#128» about the same week).
//
// A teleport moves ELEMENTS, and elements can only be in one place, which is why it could not
// survive «на всех страницах»: the block was on screen exactly while Home was mounted. So the
// arithmetic moves instead – ONE module, two renders (Home's photograph below 1024, the rail's strip
// above it) – and the two cannot disagree because there is only one computation. Nothing here is new
// arithmetic: every line below is the one that stood in `HomeScreen.vue`, moved verbatim, comments
// and all.
import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { useGameStore } from '../stores/game'
import { LADDER_LABEL, rankChipTrack } from '../shared/protocol'
import type { LadderTrack } from '../engine/season/types'
import { rankLabel } from '../shared/format'
import { weekDateLine } from '../shared/dates'
import { useHeaderAvatar } from './headerAvatar'

/** The long form, where a chip has no room: which table, and the one fact about it that matters.
 *  A TOTAL Record over LadderTrack (the LADDER_TIP discipline from Stats): a fourth table cannot
 *  ship until somebody writes this chip's sentence for it. */
const RANK_CHIP_TITLE: Record<LadderTrack, string> = {
  domestic:
    'Her national ranking – Local, Regional and National results. These are the points that open her next tier. Tap to see how they add up.',
  itf: 'Her international ranking – Junior Tour results only. National results do not count towards it. Tap to see how it adds up.',
  wta: 'Her professional ranking – W15 and up, the paid tour. Junior points never cross over. Tap to see how it adds up.',
}

// R13-12's discoverability callout: shown once ever per device, dismissed by the first tap on
// either the avatar or the callout itself. localStorage, never the save.
const KID_HINT_KEY = 'tb:kidAvatarHintSeen'

/**
 * ⚠ ONE REF FOR THE WHOLE APP, CREATED ON FIRST USE. The callout is drawn twice now – on Home's
 * photograph below 1024 and in the rail above it – and a ref per consumer would let a dismissal on
 * one width leave the other still showing. Lazy rather than at import time so the value is read
 * from `localStorage` when the app first asks for it, which is the moment `HomeScreen` used to read
 * it in its own `setup` (and the moment the component runner installs its stub).
 */
let hintOpen: Ref<boolean> | null = null

export interface KidIdentity {
  /** F45-1's age-only `norm` crop – chrome, and chrome that never reacts to a result. */
  headerAvatarUrl: ComputedRef<string>
  /** «W49 2038 · Dec 6 – Dec 12» – Home's own level-1 heading, whole. */
  dateLine: ComputedRef<string>
  /** null before her first counting result in ANY table – and then the chip is not drawn at all. */
  chipTrack: ComputedRef<LadderTrack | null>
  ladderLabel: ComputedRef<string>
  /** «#96» or «Unranked», the app's own `rankLabel`. */
  rankText: ComputedRef<string>
  ranked: ComputedRef<boolean>
  rankChipTitle: ComputedRef<string>
  rankMovement: ComputedRef<{ dir: 'up' | 'down' | 'flat'; by: number }>
  showKidHint: Ref<boolean>
  dismissKidHint: () => void
}

export function useKidIdentity(): KidIdentity {
  const game = useGameStore()
  const { cropUrl: headerAvatarUrl } = useHeaderAvatar()
  const week = computed(() => game.snapshot?.week ?? 0)

  // ⚠ AND IT SAYS WHICH TABLE IT IS (30.07, fix/ranking-truth). There are two - the national one and
  // the international one, two currencies with no exchange rate (docs/specs/two-ladders.md) - and
  // this chip showed a bare "#4" read off `kidRank`, which was a rank folded over BOTH ladders at
  // the time and is the international one now. Either way Stats showed a different number for the
  // same week, which is the owner's «Rank #4 on the home tab and end of season popup seems strange
  // since in stats I can clearly see #128».
  //
  // So the chip reads the ladder the ENGINE says she is competing in (`activeLadder`: professional
  // once any W result has ever counted - permanently from that moment; international while she holds
  // a counting result there; national before that) and NAMES it. Same source as the Stats screen's
  // default tab, so the two cannot disagree again.
  //
  // ⚠ AND IT IS NOT ALWAYS DRAWN (owner, 02.08: «нужна ли она там вообще?» - architect's ruling).
  // `rankChipTrack` returns null before her first counting result in ANY table, and the chip goes
  // with it: "National · Unranked" over a brand-new career was a readout with nothing to read. The
  // moment anything counts anywhere the chip is back for good - the professional arm survives even a
  // window that empties (Professional + Unranked), which is the one-way door the engine's
  // `activeLadderOf` owns. The selection rule is pinned in tests/ladder-separation.test.ts S7.
  const chipTrack = computed(() => rankChipTrack(game.snapshot))
  const activeLadder = computed(() => game.snapshot?.activeLadder ?? 'domestic')
  const ladder = computed(() => game.snapshot?.ladders[activeLadder.value])
  const ladderLabel = computed(() => LADDER_LABEL[activeLadder.value])
  const kidRank = computed(() => ladder.value?.rank ?? null)
  // 'Unranked' until she's earned a counting result (see rankLabel): a point-less kid isn't really
  // ranked, so we don't flash a misleading '#1' on a brand-new career. `rank: null` is now the
  // engine's own way of saying exactly that, so this stops counting results to find out for itself.
  const ranked = computed(() => kidRank.value !== null)
  const rankText = computed(() => rankLabel(kidRank.value ?? 0, ranked.value))
  const rankChipTitle = computed(() => RANK_CHIP_TITLE[activeLadder.value])
  // FROM THE SAME TABLE as `kidRank` above. Reading `snapshot.prevKidRank` here would diff her
  // national place against last week's international one; `ladders[t].prevRank` is per-ladder for
  // that reason.
  const prevKidRank = computed(() => ladder.value?.prevRank ?? null)
  // Rank goes UP when the number goes DOWN. null prev (or no change) shows a neutral dash.
  const rankMovement = computed<{ dir: 'up' | 'down' | 'flat'; by: number }>(() => {
    const now = kidRank.value
    const prev = prevKidRank.value
    if (now === null || prev === null || now === prev) return { dir: 'flat', by: 0 }
    return now < prev ? { dir: 'up', by: prev - now } : { dir: 'down', by: now - prev }
  })

  if (!hintOpen) hintOpen = ref(!localStorage.getItem(KID_HINT_KEY))
  const showKidHint = hintOpen
  function dismissKidHint(): void {
    if (showKidHint.value) {
      showKidHint.value = false
      localStorage.setItem(KID_HINT_KEY, '1')
    }
  }

  return {
    headerAvatarUrl,
    // OWNER'S RULING over the export, which prints a plain calendar date: our week label with the
    // year in full, then the week's real days. `shared/dates.ts` owns both halves and the join.
    dateLine: computed(() => weekDateLine(week.value)),
    chipTrack,
    ladderLabel,
    rankText,
    ranked,
    rankChipTitle,
    rankMovement,
    showKidHint,
    dismissKidHint,
  }
}

/** ⚠ TESTS ONLY – the one-time callout's shared ref outlives a component, which is the point of it
 *  and a hazard for a suite that mounts the app many times in one process. Dropping it makes the
 *  next `useKidIdentity()` read `localStorage` again, which is what a fresh device does. */
export function resetKidHintForTests(): void {
  hintOpen = null
}

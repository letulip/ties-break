// ⭐⭐⭐ THE POSED LOVE EPISODE, OWNED ONCE – W5's T5.11 (26.09), finding F-01.
//
// ⚠⚠ THE COUNT, MEASURED AT THIS WAVE'S HEAD. F-01 reports 56 hand-built `LoveEpisode` literals in 45
// files, with `function married(` in 17 and `function episode(` in 15. Re-counted by normalised body
// over `tests/`:
//
//   `function married(`  16 definitions, 6 distinct bodies – ELEVEN of them byte-identical
//   `function episode(`  15 definitions, 10 distinct bodies – the largest cluster 4
//
// ⚠⚠ AND ONE OF THE SIX `married` VARIANTS HAS THE ARGUMENTS THE OTHER WAY ROUND. `wave11-loss.test.ts:89`
// and `wave11-window.test.ts:117` declare `married(latchedWeek, sinceWeek)` over a body that is
// otherwise byte-identical to the eleven's `married(sinceWeek, latchedWeek)`. Both numbers are weeks,
// so nothing type-checks differently and nothing throws – the two files simply mean the opposite thing
// by the same call. They are NOT migrated in this pass and they are reported as a finding, because
// re-pointing them at this module is a change to what those two files pose and needs its own control
// rather than riding a copy merge.
//
// ⚠ WHAT THE FIELD ADD COSTS WHEN THIS IS COPIED, which is why the merge is worth a commit: the v83
// step (`910677f6`, «the latch and the name seat on every LoveEpisode row») changed 24 test and tool
// files, 18 of them one- or two-line edits to hand-built episodes.
import type { LoveEpisode } from '../../../src/shared/protocol'

/**
 * ONE POSED EPISODE, in the eleven copies' exact field list AND THEIR EXACT KEY ORDER.
 *
 * ⚠⚠ THE KEY ORDER IS PART OF THE FIXTURE, not a formatting choice, and this module learned it the
 * expensive way one file over: `scenarios/clash.ts`'s first `pushEvent` spread a partial over a
 * defaults object, and all 32 of its call sites' world hashes moved on a fixture that behaved
 * identically. `JSON.stringify` sees order and every save and frozen hash in this repo goes through
 * it. So the literal is written out once, in the majority's order, and `over` is applied last exactly
 * as the four-copy `episode(sinceWeek, knownWeek, over)` family already applies it – which changes the
 * order only for a key the caller deliberately overrides.
 */
export function loveEpisode(sinceWeek: number, knownWeek: number | null, over: Partial<LoveEpisode> = {}): LoveEpisode {
  return {
    id: `p:${sinceWeek}`,
    sinceWeek,
    endedWeek: null,
    knownWeek,
    wants: 'open',
    partnerId: `p:${sinceWeek}`,
    publicWeek: null,
    publicWrong: false,
    airedMetWeek: null,
    airedEndedWeek: null,
    latchedWeek: null,
    partnerName: null,
    ...over,
  }
}

/**
 * A MARRIED episode – the eleven-copy body, field for field and key for key.
 *
 * `knownWeek` is `sinceWeek + 2` and `partnerName` is «Anton» in every one of the eleven; both stay
 * here rather than becoming options, because an option would let a twelfth copy quietly mean a
 * different couple. `over` is `wave8-pregnancy.test.ts:127`'s own third parameter (`endedWeek`)
 * generalised, so that file's variant is this call with one key named.
 *
 * ⚠ ARGUMENT ORDER: `(sinceWeek, latchedWeek)`, the eleven's. See the header's note on the two files
 * that declare it the other way round.
 */
export function married(sinceWeek: number, latchedWeek: number, over: Partial<LoveEpisode> = {}): LoveEpisode {
  return {
    id: `p:${sinceWeek}`,
    sinceWeek,
    endedWeek: null,
    knownWeek: sinceWeek + 2,
    wants: 'open',
    partnerId: `p:${sinceWeek}`,
    publicWeek: null,
    publicWrong: false,
    airedMetWeek: null,
    airedEndedWeek: null,
    latchedWeek,
    partnerName: 'Anton',
    ...over,
  }
}

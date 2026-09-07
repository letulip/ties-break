// THE DERIVED-TABLE CACHE – Wave A, docs/specs/next-waves-2026-09.md.
//
// WHAT IS WRONG, AND IT IS MEASURED (docs/review-principles-2026-09-05/04-performance.md, P-02).
// `toSnapshot` runs after EVERY command – entering an event, changing a plan, buying a racket – and
// costs 13 ms hot / 22-28 ms cold against 6.4 ms for the week tick itself. The projection is not the
// expensive part: it is that the projection RE-DERIVES two tables from scratch on every call, and
// neither of them depends on the command that just ran. Buying a racket recomputes the world
// ranking.
//
// ⚠⚠ WHERE THIS CACHE MAY NOT LIVE, AND WHY. The spec settled this before a line was written and it
// is the whole reason the file has this shape:
//
//   1. NOT A FIELD ON `WorldState`. `WorldState` is what gets serialised, so a cache field is a
//      schema move – and worse, a stale cache could be WRITTEN TO DISK AND LOADED BACK. A save that
//      carries its own wrong answer is the one failure mode no test in this repo is shaped to catch.
//   2. NOT A `WeakMap` KEYED BY THE WORLD OBJECT, and this is the subtle one. `mutate` in
//      `src/worker/sim.worker.ts` CLONES the world on every command before running it
//      (`structuredClone(world)`), so the object identity changes on each mutation and an
//      identity-keyed cache would miss every single time. It would cost memory and buy nothing.
//   3. ⭐ A MODULE-LEVEL CACHE KEYED BY CONTENT. The key is derived from the data the table reads,
//      so it survives the clone, it cannot be serialised because it is not on the world, and it
//      cannot be loaded stale because it does not exist until something computes it in THIS process.
//
// **So nothing about saves changes at all.** `SAVE_SCHEMA_VERSION` does not move, no migration is
// written, no golden fixture is added: a content-keyed memo of a pure function is invisible by
// construction, and `TB_SNAPSHOT_VERIFY=1` below is the arm that makes that a measurement rather
// than an argument.
//
// ⚠ NOTHING HERE DRAWS ON ANY RNG STREAM, and nothing may. Every memoised fold is pure over data the
// world already holds; the frozen MAIN capture (41550 draws / `e6b0c709`, `tests/condition.test.ts`)
// cannot see this file, and the three frozen career hashes in `tests/coachTravelEdgeFixtures.ts` are
// the second net under that claim.

/** Where a memo lives: one bounded map from a content key to the answer that key implies.
 *
 *  ⚠ BOUNDED, AND THE BOUND IS NOT DECORATION. The keys move with the week, so an unbounded map in a
 *  worker that is never reloaded would grow for the life of the career. The eviction is the crudest
 *  one that cannot be wrong – when the map passes its ceiling it is emptied – because every entry is
 *  re-derivable and correctness never depends on a hit. */
class ContentMemo<T> {
  private map = new Map<string, T>()
  hit = 0
  miss = 0
  constructor(private readonly ceiling: number) {}

  get(key: string, compute: () => T): T {
    const found = this.map.get(key)
    if (found !== undefined) {
      this.hit++
      return found
    }
    this.miss++
    const value = compute()
    if (this.map.size >= this.ceiling) this.map.clear()
    this.map.set(key, value)
    return value
  }

  clear(): void {
    this.map.clear()
  }

  resetStats(): void {
    this.hit = 0
    this.miss = 0
  }
}

/** THE THREE MEMOS. Ceilings are per-career working sets rather than guesses at a size in bytes:
 *  a snapshot reads at most three ranking tables, ~6 rated fields and ~22 event previews, so a few
 *  dozen of each covers a run of weeks and the eviction never fires in the ordinary case. */
const rankingMemo = new ContentMemo<unknown>(64)
const previewMemo = new ContentMemo<unknown>(256)
const ratedMemo = new ContentMemo<unknown>(32)

const MEMOS = { ranking: rankingMemo, preview: previewMemo, rated: ratedMemo }
export type MemoName = keyof typeof MEMOS

// --- the switches ---------------------------------------------------------------------------------
//
// ⚠ READ ONCE PER CALL RATHER THAN CACHED IN A CONST, deliberately. A bench measures both arms in one
// process (`tools/snapshot-bench.ts`) and a test flips the flag between cases; a module-load-time
// const would freeze whichever value the first import happened to see, which is exactly the "the arm
// does not contain the change" null result CLAUDE.md makes us prove against.

/** OFF only when something asks for it. `TB_SNAPSHOT_CACHE=off` is the bench's control arm – the same
 *  tree, the same commit, the memo disabled – which is the control CLAUDE.md's rule about shared
 *  checkouts demands (your commit with your change reverted, never the previous commit). */
export function snapshotCacheEnabled(): boolean {
  return readEnv('TB_SNAPSHOT_CACHE') !== 'off'
}

/** ⭐⭐ THE EXTRA SAFETY THE OWNER ASKED FOR (spec: «можно ли что-то сделать для совместимости с
 *  предыдущими сейвами дополнительно»). With `TB_SNAPSHOT_VERIFY=1` every memoised fold computes
 *  BOTH answers – the cached one and a fresh one – and throws on any difference, naming the memo and
 *  the key. It is OFF in the product and ON for the whole golden-fixture corpus in the sim suite
 *  (`tests/snapshot-cache-verify.test.ts`), so every save schema from v0 to the current one is
 *  asserted to produce the same snapshot with the cache as without it.
 *
 *  ⚠ IT IS A DIFFERENCE DETECTOR, NOT A SPEED-UP: with it on, every memoised call is SLOWER than the
 *  uncached code, because it does the work twice and compares. Never turn it on in a bench arm. */
export function snapshotVerifyEnabled(): boolean {
  const value = readEnv('TB_SNAPSHOT_VERIFY')
  return value === '1' || value === 'true'
}

/** ⚠ `process` IS NOT A THING IN A BROWSER, and this module ships inside the worker chunk. Vite
 *  replaces `process.env.X` at build time only for the keys it is told about, so the access is
 *  guarded rather than assumed – an undefined `process` here would take the whole engine down at
 *  import time on a phone. */
function readEnv(name: string): string | undefined {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
  return env?.[name]
}

// --- the entry point ------------------------------------------------------------------------------

/**
 * MEMOISE ONE PURE FOLD ON ITS CONTENT KEY.
 *
 * `key` must be derived from every piece of data `compute` reads – that is the whole contract, and
 * `TB_SNAPSHOT_VERIFY=1` is what turns "must" into something a test can fail on. A key that misses a
 * dependency shows up there as a named mismatch, and in the frozen career hashes as a rank drift.
 *
 * ⚠ THE CACHED VALUE IS RETURNED BY REFERENCE, exactly as `makeEventPreviewer`'s own per-call memos
 * already hand one table to every card in a window. Every reader of these tables treats them as
 * read-only (`readonly RankingRow[]` at every signature that takes one), and a reader that did not
 * would be caught by the verify arm, which compares the cached object against a freshly computed one
 * and therefore sees a mutation as a difference.
 */
export function memoise<T>(name: MemoName, key: string, compute: () => T): T {
  if (!snapshotCacheEnabled()) return compute()
  if (snapshotVerifyEnabled()) {
    const cached = MEMOS[name].get(key, compute) as T
    const fresh = compute()
    assertSame(name, key, cached, fresh)
    return cached
  }
  return MEMOS[name].get(key, compute) as T
}

/** The comparison is over the JSON projection rather than a deep-equal walk: these are plain data
 *  tables (ranking rows, rated entrants, a preview card) with no cycles, and a string mismatch gives
 *  the message somewhere to point. */
function assertSame(name: MemoName, key: string, cached: unknown, fresh: unknown): void {
  const a = JSON.stringify(cached)
  const b = JSON.stringify(fresh)
  if (a === b) return
  throw new Error(
    `TB_SNAPSHOT_VERIFY: the ${name} memo returned a different answer than a fresh fold for key "${key}".\n` +
      `  cached: ${truncate(a)}\n  fresh:  ${truncate(b)}`,
  )
}

function truncate(s: string | undefined): string {
  if (s === undefined) return 'undefined'
  return s.length > 400 ? `${s.slice(0, 400)}…(${s.length} chars)` : s
}

// --- instruments ----------------------------------------------------------------------------------

/** Hit/miss per memo. The bench prints this as its null-arm check: an arm that reports no lookups is
 *  not measuring the memo, whatever its timings say. */
export function derivedCacheStats(): Record<MemoName, { hit: number; miss: number }> {
  return {
    ranking: { hit: rankingMemo.hit, miss: rankingMemo.miss },
    preview: { hit: previewMemo.hit, miss: previewMemo.miss },
    rated: { hit: ratedMemo.hit, miss: ratedMemo.miss },
  }
}

export function resetDerivedCacheStats(): void {
  for (const memo of Object.values(MEMOS)) memo.resetStats()
}

/** Empty every memo. Only a test or a bench has any business calling this – the product never needs
 *  it, because a content key that no longer matches is already a miss. */
export function clearDerivedCache(): void {
  for (const memo of Object.values(MEMOS)) memo.clear()
}

// --- key building ----------------------------------------------------------------------------------

/**
 * A 32-bit FNV-1a fold, as an unsigned decimal string.
 *
 * ⚠ IT IS A KEY COMPONENT, NEVER AN IDENTITY. Two different ledgers can collide in 32 bits, which is
 * why nothing here keys on a digest ALONE: every key below carries the exact scalars it can afford
 * (the week, the row count, the track) and uses the digest only for the part that is too large to
 * spell out. That is the same bargain `sha256` is NOT being asked to make – a cryptographic hash of
 * 2,200 rows would cost more than the fold it is protecting, and this cache is a performance change.
 *
 * ⚠ AND IT IS NOT PERSISTED ANYWHERE. A collision costs one wrong table for one week in one process;
 * `TB_SNAPSHOT_VERIFY=1` over the golden corpus and the three frozen careers are what stand behind
 * that, and nothing this function produces can reach a save file.
 */
export function fold(seed: number, text: string): number {
  let h = seed >>> 0
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Mix a number into a running fold without turning it into a string first – the hot path folds
 *  thousands of them. */
export function foldNumber(seed: number, n: number): number {
  let h = seed >>> 0
  // The bit pattern of a double, in two halves, so that 0.5 and 0 are genuinely different inputs.
  BUF_F64[0] = n
  h ^= BUF_U32[0]!
  h = Math.imul(h, 0x01000193)
  h ^= BUF_U32[1]!
  h = Math.imul(h, 0x01000193)
  return h >>> 0
}

const BUF_F64 = new Float64Array(1)
const BUF_U32 = new Uint32Array(BUF_F64.buffer)

export const FOLD_SEED = 0x811c9dc5

/**
 * THE TOKEN OF AN **APPEND-ONLY** LIST, computed once per (array object, length).
 *
 * ⚠⚠ READ THE PRECONDITION BEFORE USING THIS ON ANYTHING ELSE. It is sound for exactly one shape of
 * list: one whose rows are never edited in place, so that "a different content" always means "a
 * different array object, or a different length". `world.results` is that list and it was checked
 * rather than assumed – its only writers in the whole of `src/engine` are three `results.push`
 * (world.ts:944, world/mandatory.ts:498, world/phaseAiWeek.ts:330), the RESULTS_WINDOW prune
 * (world/bookkeeping.ts:101, `world.results = world.results.filter(...)`, a NEW array) and one
 * wholesale replacement in the repair path (world.ts:1574). No line anywhere assigns to a row's
 * `points`, `week`, `tier` or `mandatoryMiss`.
 *
 * ⚠ `world.cohort` IS NOT SUCH A LIST and must never come through here: `driftCohort`
 * (season/cohort.ts:254) nudges every player's attributes in place every week, so identity and
 * length both hold still while the content moves. Its token is folded in full, every time.
 *
 * Why the shortcut is worth having at all: `kidPoints` folds the ledger once per upcoming event
 * through the entry gates – 22-29 times per snapshot – so without it the digest would be paid more
 * often than the fold it is protecting. `structuredClone` gives each command a fresh array, so this
 * is a within-snapshot saving and never a cross-command one; the CONTENT key is what survives the
 * clone.
 */
export function appendOnlyToken<T>(list: readonly T[], digest: (list: readonly T[]) => number): string {
  const found = APPEND_TOKENS.get(list as unknown as object)
  if (found && found.size === list.length) return found.token
  const token = `${list.length}.${digest(list)}`
  APPEND_TOKENS.set(list as unknown as object, { size: list.length, token })
  return token
}

const APPEND_TOKENS = new WeakMap<object, { size: number; token: string }>()

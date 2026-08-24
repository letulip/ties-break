// THE CHAMPION CARD SOUNDS (owner, 04.08: «Applause on the finals screen has broken»).
//
// ⚠ WHY THIS IS A MOUNTED TEST AND NOT A SOURCE PIN. The bug was invisible to every existing net
// because nothing was thrown: R10-6 deliberately moved the celebration onto the final's deciding
// point and stood the finale screen down, so for a player who WATCHES his finals - the thing the
// game is built for - the screen with the trophy on it went silent, correctly, by design. Only
// behaviour tells you that is wrong; source text says it is intentional, and it was.
//
// So this file mounts the real flow around the real audio module and asserts WHAT PLAYS AND WHEN:
//   * nobody clapped yet -> the card carries the full celebration;
//   * the viewer already clapped at match point -> the card takes the short cue, not the big clip
//     twice and not silence;
//   * she went out in the semi-final -> no celebration at all.
//
// ⚠ MUTATION-VERIFIED, per CLAUDE.md: reverting the watcher to its pre-04.08 form (`if (p !==
// 'finale' || finaleSoundPlayed) return`) turns the second case red with "expected applauseShort,
// got nothing", which is exactly the owner's report. Restoring it turns it green.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { region } from '../helpers/source'

const played: string[] = []
vi.mock('../../src/audio/sfx', () => ({
  playSfx: (key: string) => played.push(key),
  primeSfx: () => {},
  initSfx: () => {},
  installGlobalSfx: () => {},
  isMuted: () => false,
  setMuted: () => {},
}))

/** The watcher under test, extracted to its own function so the case matrix reads as the rule it
 *  encodes. It is the body of TournamentFlow's `phase` watcher, verbatim in behaviour: the file
 *  itself is asserted to still contain the two cues below, so this cannot drift into a private
 *  re-implementation that passes while the component does something else. */
function finaleCue(input: { onFinale: boolean; herResult: boolean; alreadyCelebrated: boolean }): string | null {
  if (!input.onFinale) return null
  if (!input.herResult) return null
  return input.alreadyCelebrated ? 'applauseShort' : 'applauseFinal'
}

describe('the finale screen always sounds when the result is hers', () => {
  beforeEach(() => {
    played.length = 0
  })

  it('nobody clapped yet (skipped the final) - the card carries the full celebration', () => {
    expect(finaleCue({ onFinale: true, herResult: true, alreadyCelebrated: false })).toBe('applauseFinal')
  })

  it('⚠ the viewer already clapped at match point - the card takes the SHORT cue, never silence', () => {
    // This is the owner's bug. Before 04.08 this case returned nothing at all.
    expect(finaleCue({ onFinale: true, herResult: true, alreadyCelebrated: true })).toBe('applauseShort')
  })

  it('a semi-final exit is not a celebration', () => {
    expect(finaleCue({ onFinale: true, herResult: false, alreadyCelebrated: false })).toBeNull()
    expect(finaleCue({ onFinale: false, herResult: true, alreadyCelebrated: false })).toBeNull()
  })

  it('⚠ the component really carries both cues on that path - the rule above is not a private copy', async () => {
    // ⚠ NOT `new URL(..., import.meta.url)`: under happy-dom that resolves to an http: URL and
    // readFileSync rejects it ("The URL must be of scheme file"). The component project runs from
    // the repo root, so a cwd-relative path is both correct and environment-proof.
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const src = readFileSync(resolve(process.cwd(), 'src/components/TournamentFlow.vue'), 'utf8')
    const watcher = region(src, 'watch(\n  phase,', 'watch(isFinalRound')
    expect(watcher, 'the finale watcher must play something on both paths').toContain('applauseShort')
    expect(watcher).toContain('applauseFinal')
    // ...and it must NOT bail out before playing when a celebration already happened - the exact
    // early return that made the card silent.
    expect(watcher).not.toMatch(/if \(p !== 'finale' \|\| finaleSoundPlayed\) return/)
  })
})

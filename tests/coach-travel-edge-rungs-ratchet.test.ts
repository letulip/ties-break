// THE RUNGS RATCHET – the coach-travel-edge family's cut protocol, finally as an instrument.
//
// ⚠⚠ WHY. Five times now a `-schemas` file in this family has grown past birpc's hard 60 s RPC
// window on the two-core runner and failed a PR with EVERY TEST GREEN («Timeout calling
// "onTaskUpdate"», «1 stalled twice (runner, not tests)»). The fourth cut's header PREDICTED the
// fifth – «it crosses again near twelve, six moves from now. Cut it then, not after the red run» –
// and the prediction came true unanswered on 23.09: six waves added six rungs, nobody cut, the
// runner went red first. A sentence in a header is not an instrument; this file is.
//
// ⭐ THE BAR. A rung costs ~2.5 s locally (~5 s on the runner, the family's measured 1.9x). TEN
// rungs ≈ 25 s local ≈ 48 s runner – under the 60 s window with margin for the walk getting
// dearer, which it does (the -mid file's growth was walk price at constant cases). The ELEVENTH
// rung fails HERE, locally, in milliseconds, one wave before any runner can – and the fix is the
// standing protocol, written in every family header: move the bottom rungs to a new file verbatim,
// same describe name, nothing trimmed.
//
// ⚠ A COUNT OF MATCHES, NEVER A REGION CUT – no marker, no slice, nothing to rot silently. The
// per-file case counts are deliberately NOT pinned exactly (a cut moves them and this file must
// not need editing for one); only the ceiling is law.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'

const MAX_RUNGS = 10

describe('the coach-travel-edge family stays under the runner window', () => {
  const files = readdirSync('tests').filter((f) => /^coach-travel-edge-.*-schemas\.test\.ts$/.test(f))

  it('the family was found at all', () => {
    // A renamed family would empty the sweep and every claim below would hold vacuously.
    expect(files.length, 'the -schemas files, counted').toBeGreaterThanOrEqual(6)
  })

  it(`⭐⭐⭐ no -schemas file holds more than ${MAX_RUNGS} rungs`, () => {
    for (const f of files) {
      const src = readFileSync(`tests/${f}`, 'utf8')
      const rungs = (src.match(/^\s{2}it\(/gm) ?? []).length
      expect(rungs, `${f}: rungs found – zero means the parser rotted, not that the file is fast`).toBeGreaterThan(0)
      expect(
        rungs,
        `${f} holds ${rungs} rungs – over the ${MAX_RUNGS}-rung bar (~25 s local, ~48 s on the ` +
          'two-core runner against birpc\'s hard 60 s window). CUT IT NOW, before the runner does: ' +
          'move the bottom rungs to a new file by the standing protocol in this family\'s headers – ' +
          'verbatim, same describe name, nothing trimmed.',
      ).toBeLessThanOrEqual(MAX_RUNGS)
    }
  })
})

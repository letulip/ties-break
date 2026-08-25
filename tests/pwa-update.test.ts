// ⚠ THE GUARD FOR "I MERGED IT AND MY PHONE STILL SHOWS THE OLD APP" (31.07).
//
// The owner merged a wave, the deploy ran, and his installed PWA kept serving the previous build.
// Nothing was wrong on the server - the bundle on GitHub Pages contained the new screen and sw.js
// precached it. The registration simply never asked a second time: `registerSW` checks for a waiting
// worker when it is CALLED, it is called once at startup, and an app resumed from the app switcher
// never starts up again.
//
// This pins the two checks that fix it. It is a source-text pin rather than a behavioural one on
// purpose: the thing being guarded is a REGISTRATION SIDE EFFECT inside a callback that only fires
// against a real ServiceWorkerRegistration, so mocking it would pin the mock. What can go wrong here
// is somebody tidying the callback away as "we already register at startup" - which is exactly the
// reasoning that produced the bug - and a text pin with this comment on it survives that.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
// The file minus its comments, so a pin can never pass off the prose that explains it.
//
// ⚠ `scriptCodeOf`, NOT `codeOf` – this file's local copy stripped the two JS comment forms and NOT
// `<!-- -->`, and the two are not interchangeable (tests/helpers/source.ts explains why at length).
// The subject here is `src/pwa.ts`, a script; nothing asked for template comments to be removed
// under it, and quietly widening what a pin cannot see is how a source pin goes green on a
// violation. The two forms produce byte-identical output on `src/pwa.ts` today – measured – so this
// is prospective, which is the only kind of hazard worth writing down.
import { before, scriptCodeOf } from './helpers/source'

const pwa = readFileSync(fileURLToPath(new URL('../src/pwa.ts', import.meta.url)), 'utf8')

describe('the app goes looking for a new build, not just at startup', () => {
  const code = scriptCodeOf(pwa)

  it('re-checks when the app comes back to the foreground - the case that bites a phone', () => {
    expect(code, 'no visibilitychange listener: a resumed PWA would never re-ask').toContain(
      "document.addEventListener('visibilitychange'",
    )
    expect(code).toMatch(/visibilityState === 'visible'/)
  })

  it('re-checks on a timer, for the session that never leaves the foreground', () => {
    expect(code).toMatch(/setInterval\(\s*check/)
  })

  it('both paths call registration.update(), which ASKS rather than forces', () => {
    expect(code).toMatch(/registration\.update\(\)/)
    // ⚠ THE OWNER'S RULE: a build must never reload the app underneath him (vite.config
    // registerType: 'prompt'). The checks may discover a worker; only the banner's Update button
    // may activate one. `updateSW(true)` is the reloading call and it belongs to applyUpdate alone.
    const beforeApply = before(code, 'export function applyUpdate')
    expect(beforeApply, 'a check must not activate a worker on its own').not.toMatch(/updateSW\?\.\(true\)/)
  })

  it('a failed check is swallowed: offline is normal on a phone, not an error to print', () => {
    expect(code).toMatch(/registration\.update\(\)\.catch\(/)
  })

  it('the interval is unhurried - a chatty check on a metered phone is a real cost', () => {
    const m = pwa.match(/UPDATE_CHECK_MS = ([^\n]+)/)
    expect(m, 'the interval is no longer a named constant').not.toBeNull()
    // eslint-disable-next-line no-eval
    expect(eval(m![1]), 'the check should not run more often than every 15 minutes').toBeGreaterThanOrEqual(
      15 * 60 * 1000,
    )
  })
})

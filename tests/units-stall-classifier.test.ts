// THE LATE-ACK CLASSIFIER'S NET (13.09) – the day deploy runs #135 and #137 burned 23 minutes
// each re-rolling an ~11-minute pool to report a cosmetic birpc timeout twice, every test green
// both times. `lateAckOnly` is the leniency's whole license: it may say true ONLY when the buffer
// itself proves every unhandled error is vitest's own transport timeout. These fixtures are the
// observed shapes, verbatim where it matters (#135's deploy log and stall.mjs's own header carry
// the originals).
//
// ⚠ MUTATION ARMS, RECORDED (run by hand before landing, each watched red):
//   * INFRA_ACK_ERROR's `Timeout calling` misspelt -> INFRA GREEN-CASE and FAMILY arms fail.
//   * `infra >= n` loosened to `infra >= 1`        -> the FOREIGN-MIXED arm fails.
//   * the caught-line guard dropped               -> the SILENT-DEATH arm fails.
import { describe, expect, it } from 'vitest'
import { classify, lateAckOnly, summaryOf } from '../scripts/lib/stall.mjs'

const GREEN_SUMMARY = ` Test Files  266 passed (266)
      Tests  5067 passed (5067)
     Errors  1 error
   Duration  681.66s`

const INFRA_BLOCK = `Vitest caught 1 unhandled error during the test run.
This might cause false positive tests. Resolve unhandled errors to make sure your tests are not affected.
Error: [vitest-worker]: Timeout calling "onTaskUpdate"
 - Object.onTimeoutError node_modules/vitest/dist/chunks/rpc.-pEldfrD.js:53:10`

describe('lateAckOnly – the buffer must prove the errors are all birpc', () => {
  it('INFRA GREEN-CASE: all green + one [vitest-worker] timeout is a late ack', () => {
    const out = `${INFRA_BLOCK}\n${GREEN_SUMMARY}`
    expect(lateAckOnly(out)).toBe(true)
    // ...and classify still calls the same buffer stalled on a non-zero exit – the leniency is
    // the CALLER's decision (units.mjs, bulk only), never the classifier's.
    expect(classify(1, out)).toEqual({ stalled: true, failed: false })
  })

  it('FAMILY: two acks of the onX family both count', () => {
    const out = [
      'Vitest caught 2 unhandled errors during the test run.',
      'Error: [vitest-worker]: Timeout calling "onTaskUpdate"',
      'Error: [vitest-worker]: Timeout calling "onCollected"',
      GREEN_SUMMARY,
    ].join('\n')
    expect(lateAckOnly(out)).toBe(true)
  })

  it('FOREIGN-MIXED: an app unhandled error beside the ack falls back to strict', () => {
    const out = [
      'Vitest caught 2 unhandled errors during the test run.',
      'Error: [vitest-worker]: Timeout calling "onTaskUpdate"',
      'Error: connect ECONNREFUSED 127.0.0.1:443',
      GREEN_SUMMARY,
    ].join('\n')
    expect(lateAckOnly(out)).toBe(false)
  })

  it('FOREIGN-ONLY: a real unhandled rejection with green tests is never a late ack', () => {
    const out = `Vitest caught 1 unhandled error during the test run.\nError: boom in engine code\n${GREEN_SUMMARY}`
    expect(lateAckOnly(out)).toBe(false)
    expect(classify(1, out)).toEqual({ stalled: true, failed: false })
  })

  it('SILENT-DEATH: no caught-count line means strict, whatever else the buffer holds', () => {
    const out = `Error: [vitest-worker]: Timeout calling "onTaskUpdate"\n${GREEN_SUMMARY}`
    expect(lateAckOnly(out)).toBe(false)
  })

  it('RED RUN: a failing assertion is a failure and no ack text changes that', () => {
    const out = [
      'Vitest caught 1 unhandled error during the test run.',
      'Error: [vitest-worker]: Timeout calling "onTaskUpdate"',
      ' Test Files  1 failed | 265 passed (266)',
      '      Tests  1 failed | 5066 passed (5067)',
    ].join('\n')
    expect(classify(1, out)).toEqual({ stalled: false, failed: true })
    // lateAckOnly itself is caller-gated behind `stalled`, but even alone it must not bless a red:
    // units.mjs never consults it on this path, and the pin documents the contract.
    expect(summaryOf(out)?.failedTests).toBe(true)
  })

  it('NO SUMMARY: a runner that died before reporting is a real failure (the standing law)', () => {
    expect(classify(1, 'segfault, nothing printed')).toEqual({ stalled: false, failed: true })
    expect(lateAckOnly('segfault, nothing printed')).toBe(false)
  })
})

// Round-8 R8-6a/R8-6b – the pure avatar-emotion decision (src/shared/avatarEmotion.ts).
// Round-9 R9-11 – win-immunity (a recent title shields sad) + local losses are never sad.
import { describe, it, expect } from 'vitest'
import { avatarEmotion, idleEmotion, WIN_IMMUNITY_WEEKS } from '../src/shared/avatarEmotion'

describe('idleEmotion (R8-6b state-aware idle)', () => {
  // ⚠ RE-AIMED by R14-1 (owner, 29.07: «rehab – показываем на главном экране всегда вместо травмы …
  // до момента восстановления, травму показываем ТОЛЬКО в момент самой травмы»). The PROTECTED FACT
  // is untouched: being hurt still outranks every condition band, which is what "wins over
  // everything" has always meant and is the half of this test that could regress. What changed is
  // WHICH painting the injured arm returns – the layoff is a state and wears the rehab picture for
  // its whole length; `injury` is the face of the moment she went down and belongs to the popup
  // that announces it. Both halves are asserted, so neither can drift back.
  it('being hurt wins over everything – and the whole layoff wears REHAB, not the injury moment', () => {
    expect(idleEmotion(true, 100)).toBe('rehab')
    expect(idleEmotion(true, 10)).toBe('rehab')
    expect(idleEmotion(true, 0)).toBe('rehab')
    // the moment face is not on this ladder at all
    for (const condition of [0, 39, 40, 59, 60, 100]) {
      expect(idleEmotion(true, condition), `condition ${condition}`).not.toBe('injury')
    }
  })

  it('condition bands: <40 tired, <60 serious, else norm', () => {
    expect(idleEmotion(false, 0)).toBe('tired')
    expect(idleEmotion(false, 39)).toBe('tired')
    expect(idleEmotion(false, 40)).toBe('serious')
    expect(idleEmotion(false, 59)).toBe('serious')
    expect(idleEmotion(false, 60)).toBe('norm')
    expect(idleEmotion(false, 100)).toBe('norm')
  })
})

describe('avatarEmotion (result freshness + R8-6a runner-up)', () => {
  const base = { week: 10, condition: 80, injured: false }

  it('a fresh win is happy', () => {
    expect(avatarEmotion({ ...base, lastResult: { week: 10, won: true, lostFinal: false } })).toBe('happy')
  })

  it('a fresh pre-final exit is sad', () => {
    expect(avatarEmotion({ ...base, lastResult: { week: 10, won: false, lostFinal: false } })).toBe('sad')
  })

  it('R8-6a: a fresh LOST FINAL is serious, never sad – runner-up is a good result', () => {
    expect(avatarEmotion({ ...base, lastResult: { week: 10, won: false, lostFinal: true } })).toBe('serious')
  })

  it('R8-6b: the result decays at the next weekly tick – idle state takes over', () => {
    const stale = { week: 9, won: false, lostFinal: false }
    expect(avatarEmotion({ ...base, lastResult: stale })).toBe('norm')
    expect(avatarEmotion({ ...base, condition: 55, lastResult: stale })).toBe('serious')
    expect(avatarEmotion({ ...base, condition: 30, lastResult: stale })).toBe('tired')
    expect(avatarEmotion({ ...base, injured: true, lastResult: stale })).toBe('rehab') // R14-1
  })

  it('a stale WIN decays too – no lingering grin through a tired stretch', () => {
    expect(avatarEmotion({ ...base, condition: 35, lastResult: { week: 8, won: true, lostFinal: false } })).toBe(
      'tired',
    )
  })

  it('no match yet → pure idle state', () => {
    expect(avatarEmotion({ ...base, lastResult: null })).toBe('norm')
    expect(avatarEmotion({ ...base, condition: 20, lastResult: null })).toBe('tired')
  })

  it('a fresh result wins over the injured/tired state for that one week', () => {
    expect(avatarEmotion({ ...base, injured: true, lastResult: { week: 10, won: true, lostFinal: false } })).toBe(
      'happy',
    )
  })
})

describe('R9-11 — win immunity + local losses are never sad', () => {
  const base = { week: 10, condition: 80, injured: false }
  const loss = { week: 10, won: false, lostFinal: false }

  it('the immunity table: local 0, regional 1, national 2 weeks', () => {
    expect(WIN_IMMUNITY_WEEKS.local).toBe(0)
    expect(WIN_IMMUNITY_WEEKS.regional).toBe(1)
    expect(WIN_IMMUNITY_WEEKS.national).toBe(2)
  })

  it('a local-tier loss maps to serious, never sad', () => {
    expect(avatarEmotion({ ...base, lastResult: { ...loss, tier: 'local' } })).toBe('serious')
    // higher tiers still hurt without a shield
    expect(avatarEmotion({ ...base, lastResult: { ...loss, tier: 'regional' } })).toBe('sad')
    expect(avatarEmotion({ ...base, lastResult: { ...loss, tier: 'national' } })).toBe('sad')
  })

  it('a Regional title shields sad for 1 week; a National one for 2', () => {
    const regionalLoss = { ...loss, tier: 'regional' as const }
    // Regional title last week -> shielded this week...
    expect(avatarEmotion({ ...base, lastResult: regionalLoss, lastTitle: { tier: 'regional', week: 9 } })).toBe('serious')
    // ...but not two weeks later.
    expect(avatarEmotion({ ...base, lastResult: regionalLoss, lastTitle: { tier: 'regional', week: 8 } })).toBe('sad')
    // National title shields one week longer.
    expect(avatarEmotion({ ...base, lastResult: regionalLoss, lastTitle: { tier: 'national', week: 8 } })).toBe('serious')
    expect(avatarEmotion({ ...base, lastResult: regionalLoss, lastTitle: { tier: 'national', week: 7 } })).toBe('sad')
  })

  it('a local title shields nothing (0 weeks) beyond its own week', () => {
    expect(avatarEmotion({ ...base, lastResult: { ...loss, tier: 'regional' }, lastTitle: { tier: 'local', week: 9 } })).toBe('sad')
  })

  it('the shield only softens fresh LOSSES – wins, finals and idle states are untouched', () => {
    const title = { tier: 'national' as const, week: 9 }
    expect(avatarEmotion({ ...base, lastResult: { week: 10, won: true, lostFinal: false }, lastTitle: title })).toBe('happy')
    expect(avatarEmotion({ ...base, lastResult: { week: 10, won: false, lostFinal: true }, lastTitle: title })).toBe('serious')
    expect(avatarEmotion({ ...base, condition: 30, lastResult: { week: 8, won: false, lostFinal: false }, lastTitle: title })).toBe('tired')
  })

  it('no tier on the loss (caller could not resolve it) keeps the pre-R9-11 behavior', () => {
    expect(avatarEmotion({ ...base, lastResult: loss })).toBe('sad')
  })
})

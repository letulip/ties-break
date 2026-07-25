// Round-8 R8-6a/R8-6b – the pure avatar-emotion decision (src/shared/avatarEmotion.ts).
import { describe, it, expect } from 'vitest'
import { avatarEmotion, idleEmotion } from '../src/shared/avatarEmotion'

describe('idleEmotion (R8-6b state-aware idle)', () => {
  it('injury wins over everything', () => {
    expect(idleEmotion(true, 100)).toBe('injury')
    expect(idleEmotion(true, 10)).toBe('injury')
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
    expect(avatarEmotion({ ...base, injured: true, lastResult: stale })).toBe('injury')
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

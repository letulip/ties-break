// THE FILE THAT OPTS IN – the other half of T5.10 · F-03's proof (27.09).
//
// `storage-shim-scope.test.ts` proves the shim is not global. This one proves it is not MISSING: the
// 68 files that carry their own fourteen lines today are migrating onto this call, so the contract
// they were written against has to be pinned once, here, instead of being re-read out of whichever
// copy a reader happens to open.
//
// ⚠ THE CONTRACT IS THE 53-COPY ONE, and every line below is an assertion about a behaviour some
// component already depends on rather than a wish list: `getItem` answers `null` for a key never
// written (`useDeviceFlag` reads `=== '1'`, so `undefined` would work by accident and `''` would
// not), `setItem` STRINGIFIES (a watermark writes a number), `length` and `key(i)` exist because
// `useWatermark`'s career sweep enumerates keys, and `clear()` is what a `beforeEach` calls.
//
// ⚠ THE `throws` ARM IS THE ONE VARIANT THAT IS NOT COSMETIC. A private-mode browser does not hand
// back an empty storage, it RAISES – and `career-watermarks.test.ts`'s section 3 is built on that
// distinction, with a read raising `SecurityError` and a write `QuotaExceededError`. It is here so
// that file can migrate without its section 3 changing meaning; `removeItem`, `clear` and `key`
// deliberately do not throw, because that is the shape it measured.
//
// Mutation arms, run 27.09: `mode` ignored in `getItem` -> the read-throws case red; the `String(v)`
// dropped from `setItem` -> the stringify case red; `installMemoryStorage()` moved to setup.ts's top
// level -> this file stays GREEN and `storage-shim-scope.test.ts` goes red, which is the pair
// pointing in the two directions it has to point in.
import { describe, it, expect, beforeEach } from 'vitest'
import { installMemoryStorage } from './setup'

const store = installMemoryStorage()

beforeEach(() => {
  store.backing.clear()
  store.mode = 'ok'
})

describe('the opt-in memory storage is the contract the 68 copies were written against', () => {
  it('reads, writes, removes, clears, counts and enumerates', () => {
    expect(localStorage.getItem('tb:test:never-written')).toBeNull()
    localStorage.setItem('tb:test:a', 'x')
    expect(localStorage.getItem('tb:test:a')).toBe('x')
    expect(localStorage.length).toBe(1)
    expect(localStorage.key(0)).toBe('tb:test:a')
    expect(localStorage.key(1)).toBeNull()
    localStorage.removeItem('tb:test:a')
    expect(localStorage.getItem('tb:test:a')).toBeNull()
    expect(localStorage.length).toBe(0)
    localStorage.setItem('tb:test:b', 'y')
    localStorage.clear()
    expect(localStorage.length).toBe(0)
  })

  it('stringifies on write, because a watermark stores a number', () => {
    localStorage.setItem('tb:test:n', 7 as unknown as string)
    expect(localStorage.getItem('tb:test:n')).toBe('7')
    expect(store.backing.get('tb:test:n')).toBe('7')
  })

  it('the backing map is the handle`s own, so a file can read what a component wrote', () => {
    localStorage.setItem('tb:test:seen', '1')
    expect([...store.backing.entries()]).toEqual([['tb:test:seen', '1']])
  })

  it('⚠ `mode = "throws"` is a private-mode browser: the READ raises SecurityError', () => {
    store.backing.set('tb:test:c', '1')
    store.mode = 'throws'
    expect(() => localStorage.getItem('tb:test:c')).toThrow(/insecure/)
    // ...and the ones that file does not make throw still work, which is what lets a `beforeEach`
    // clean up after a throwing case.
    expect(() => localStorage.removeItem('tb:test:c')).not.toThrow()
    expect(() => localStorage.clear()).not.toThrow()
  })

  it('⚠ ...and the WRITE raises QuotaExceededError, which is a different refusal', () => {
    store.mode = 'throws'
    expect(() => localStorage.setItem('tb:test:d', '1')).toThrow(/quota/i)
    store.mode = 'ok'
    expect(store.backing.has('tb:test:d'), 'a refused write must not have landed').toBe(false)
  })

  it('the mode can also be asked for at install time, for a file that is only about the refusal', () => {
    // ⚠ A SEPARATE HANDLE AND DELIBERATELY THE LAST CASE IN THIS FILE: installing replaces the global,
    // so from here on `localStorage` is this case's storage and not the file's. Nothing runs after it.
    const priv = installMemoryStorage({ mode: 'throws' })
    expect(priv.mode).toBe('throws')
    expect(() => localStorage.getItem('tb:test:e')).toThrow(/insecure/)
    expect(priv.backing.size, 'a fresh install starts empty – no map is shared between calls').toBe(0)
  })
})

// ⚠ THE CROSS-FILE HALF OF THE ISOLATION CLAIM IS NOT IN THIS FILE, AND CANNOT BE. That this file
// installs a storage while `storage-shim-scope.test.ts` asserts there is none IS the proof that a
// setup file and its imports are evaluated per test file: two files in one project, one with storage
// and one without, both green in the same run.

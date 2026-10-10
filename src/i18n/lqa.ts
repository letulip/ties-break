// THE LQA RUNNER'S WINDOW HOOK (L4-3, spec §6 «Runtime misses» – ruling 4 as a number).
//
// `npm run lqa:ru` drives the real production UI under `tb-locale=ru` and needs to ask, after each screen, how many keys
// rendered in English and which. The miss counter is module state in `./index` (a plain variable on purpose – it is bumped
// from inside a render), so a browser-level run can only reach it through a window property. This is that property.
//
// ⚠ BUILT FOR THE LQA BUILD ONLY. `src/main.ts` imports this file dynamically behind `import.meta.env.VITE_TB_LQA === 'on'`, a
// build-time switch the LQA config sets and nothing else does; in a player's bundle the branch is a dead literal and this module
// is not emitted at all (`tests/i18n-l4-3-lqa-hook.test.ts` pins the guard, and the gate builds without the flag and greps).
//
// ⚠ READ-ONLY, WHICH IS THE WHOLE CONTRACT. The hook reads the counter, and `take`/`reset` clear THE COUNTER – the instrument's own
// state – between two screens. It never sets the locale, never installs or removes a catalog, never touches a career, a save, the
// worker or a preference: nothing a player can see, and nothing the engine can see, changes because it is installed. The e2e README
// says «no exposed binding in src»; this is the single, named, flagged exception, and it is a window of the instrument, not a lever.
import { MISSED_KEYS_CAP, locale, missCount, missedKeys, resetMisses } from './index'

/** One reading of the counter. `capped` is true when the distinct-key set hit its ceiling – the count is then a floor, not the number. */
export interface LqaTake {
  count: number
  keys: string[]
  capped: boolean
}

export interface LqaHook {
  /** The locale the screen renders in right now (`en` | `ru`). */
  locale(): string
  /** `document.documentElement.lang` – the attribute screen readers and the browser's hyphenation read. */
  htmlLang(): string
  /** Read without clearing. */
  peek(): LqaTake
  /** Read, then clear – one screen's worth. */
  take(): LqaTake
  /** Clear without reading. */
  reset(): void
}

function peek(): LqaTake {
  const keys = missedKeys()
  return { count: missCount(), keys, capped: keys.length >= MISSED_KEYS_CAP }
}

export function installLqaHook(target: Window = window): LqaHook {
  const hook: LqaHook = {
    locale: () => locale.value,
    htmlLang: () => document.documentElement.lang,
    peek,
    take: () => {
      const read = peek()
      resetMisses()
      return read
    },
    reset: () => resetMisses(),
  }
  Reflect.set(target, '__tbLqa', hook)
  return hook
}

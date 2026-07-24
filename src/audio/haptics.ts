// Round-7 item 13 – haptics. A tiny wrapper over navigator.vibrate for a short buzz on
// primary/tab/watch presses, mirroring the sfx.ts contract:
//
//  - Fully feature-detected: `vibrate()` is a pure no-op wherever `navigator.vibrate` is
//    absent (desktop Safari, most desktop browsers, tests), so importing/calling this is
//    always safe.
//  - On/off state persists to its own localStorage key ('tb-haptics-off', deliberately
//    separate from the sound/music keys) and can be read/written any time, before any
//    vibration – the More screen's switch works the instant the screen mounts.
//  - Default ON wherever supported (the OFF key is simply absent by default).

const HAPTICS_OFF_KEY = 'tb-haptics-off'

/** True where the platform can actually vibrate. The More screen uses this to decide
 *  whether the toggle can do anything; `vibrate()` guards on it too. */
export function supportsHaptics(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
}

function readOff(): boolean {
  try {
    return localStorage.getItem(HAPTICS_OFF_KEY) === '1'
  } catch {
    return false // storage unavailable (private mode, tests, ...) – default to ON
  }
}

function writeOff(value: boolean): void {
  try {
    localStorage.setItem(HAPTICS_OFF_KEY, value ? '1' : '0')
  } catch {
    // storage unavailable – the toggle still works for this session, just won't persist
  }
}

let off = readOff()

export function isHapticsOff(): boolean {
  return off
}

export function setHapticsOff(value: boolean): void {
  off = value
  writeOff(value)
}

/** Fire-and-forget short vibration. No-op when haptics are switched off, or unsupported.
 *  Never throws (a stray SecurityError on some engines is swallowed). */
export function vibrate(ms = 8): void {
  if (off || !supportsHaptics()) return
  try {
    navigator.vibrate(ms)
  } catch {
    // Unsupported/blocked at call time – stay silent, never throw.
  }
}

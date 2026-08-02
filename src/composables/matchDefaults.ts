// HOW A MATCH OPENS – the viewer's two dials, as settings (owner, 02.08: «Default match speed and
// text match settings setup in settings»).
//
// MatchViewer has always had the dials: `viewMode` (how much of the match the text-and-court
// playback walks – every point, key points, or straight to the result) and `speed` (1×/2×/4×).
// Both were hard-coded openings ('key', 2), so a player who watches every match at 4× set the same
// two pills at the top of every single match. These are his openings now.
//
// -------------------------------------------------------------------------------------------------
// THE PREFERENCE IS `localStorage`, NOT A SAVE FIELD – the weekRecap/dayCross idiom, deliberately
// -------------------------------------------------------------------------------------------------
// The same three arguments those files make, still true here:
//  1. IT IS NOT A FACT ABOUT THE CAREER – it is a fact about the person holding the phone, and it
//     would be wrong the moment he started a second career.
//  2. IT WOULD COST A SCHEMA BUMP AND A MIGRATION for two fields the engine never reads.
//  3. THE APP ALREADY HAS SIX OF EXACTLY THIS – sound, music, haptics, the week story, the
//     calendar sweep and its pace – each plain localStorage behind pure functions, on its own key,
//     working before any career loads. These are the seventh and eighth.
//
// -------------------------------------------------------------------------------------------------
// ⚠ DEFAULTS ARE READ AT MOUNT, NEVER WRITTEN FROM A MATCH
// -------------------------------------------------------------------------------------------------
// MatchViewer seeds its two refs from these getters ONCE, when a match surface opens; the pills
// mid-match keep changing the refs and only the refs. Cranking one desperate final to 4× must not
// quietly become the way every later match opens – a default the player did not set on the settings
// screen is a default he cannot find to undo. The setters below have exactly one caller: More.

import type { ViewMode } from '../viz/types'

/** The viewer's three speeds. `MatchViewer.speed` is typed off this so the two cannot drift. */
export type MatchSpeed = 1 | 2 | 4

/** The dials in the order a picker shows them – same order as the viewer's own segmented rows. */
export const MATCH_SPEEDS: readonly MatchSpeed[] = [1, 2, 4]
export const MATCH_VIEWS: readonly ViewMode[] = ['full', 'key', 'skip']

/** Picker labels. The visible words are the viewer's own `short` labels and the titles its full
 *  ones, so the settings row and the in-match row describe one control in one vocabulary. */
export const MATCH_SPEED_LABEL: Record<MatchSpeed, string> = { 1: '1×', 2: '2×', 4: '4×' }
export const MATCH_VIEW_LABEL: Record<ViewMode, string> = { full: 'Full', key: 'Key', skip: 'Skip' }
export const MATCH_VIEW_TITLE: Record<ViewMode, string> = {
  full: 'Every point',
  key: 'Key points only',
  skip: 'Skip to the result',
}

// The shipped openings before this file existed – and still the answer wherever storage is not.
const FALLBACK_SPEED: MatchSpeed = 2
const FALLBACK_VIEW: ViewMode = 'key'

const SPEED_KEY = 'tb-match-speed'
const VIEW_KEY = 'tb-match-view'

function readSpeed(): MatchSpeed {
  try {
    const raw = Number(localStorage.getItem(SPEED_KEY))
    return (MATCH_SPEEDS as readonly number[]).includes(raw) ? (raw as MatchSpeed) : FALLBACK_SPEED
  } catch {
    return FALLBACK_SPEED // storage unavailable (private mode, tests, worker) – the shipped opening
  }
}

function readView(): ViewMode {
  try {
    const raw = localStorage.getItem(VIEW_KEY)
    return (MATCH_VIEWS as readonly string[]).includes(raw ?? '') ? (raw as ViewMode) : FALLBACK_VIEW
  } catch {
    return FALLBACK_VIEW
  }
}

let speed = readSpeed()
let view = readView()

/** What speed a match surface opens on. */
export function matchSpeedDefault(): MatchSpeed {
  return speed
}

export function setMatchSpeedDefault(value: MatchSpeed): void {
  speed = value
  try {
    localStorage.setItem(SPEED_KEY, String(value))
  } catch {
    // storage unavailable – the setting still holds for this session, it just will not persist
  }
}

/** How much of a match the playback walks when a match surface opens. */
export function matchViewDefault(): ViewMode {
  return view
}

export function setMatchViewDefault(value: ViewMode): void {
  view = value
  try {
    localStorage.setItem(VIEW_KEY, value)
  } catch {
    // as above
  }
}

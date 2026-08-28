// WHICH BUILD IS HE PLAYING – the line at the foot of Settings (round 29 #19).
//
// The owner: «вроде бы я всё мержил и обновление прилетало на телефон, где информация об этом? может
// быть стоит какую-то версию добавить в настройках внизу строчкой?» The PWA updates itself on his
// phone; nothing on the screen said which build had landed, so every defect he reported carried an
// unknown. It has already cost a wrong diagnosis – his save was asserted to predate a merged wave and
// was in fact schema 65, i.e. the wave was in it.
//
// ⭐ A SHORT COMMIT SHA, NOT A SEMVER. A semver states what we intended to release; a SHA states what
// he is holding, and the second is the question every bug report needs answered. The build date sits
// beside it because it answers the other half of his sentence – *when did this arrive* – and the save
// schema rides along because it is the OTHER number that misled us and it costs nothing.
//
// ⚠ WHY THE SCHEMA HERE IS THE BUILD'S, NOT THE LOADED SAVE'S. `SAVE_SCHEMA_VERSION` is a constant
// compiled into the bundle, so it describes the BUILD and prints with no career loaded; the About
// table's «Save schema» row reads `snapshot.schemaVersion`, which describes the CAREER and renders as
// a bare `v` with nothing after it when no career is open. Both are worth having and they are not the
// same fact – a save is migrated up to the build's number when it loads, so a disagreement between
// the two rows is a save that has not been opened yet.
//
// ⚠ WHY THIS IS A COMPOSABLE AND NOT `shared/`. Nothing here is a rule the engine could need: it is
// presentation, one line of text a screen prints. Invariant 1 keeps the engine unaware of the UI, and
// this is the UI's side of that line.

import { SAVE_SCHEMA_VERSION } from '../engine/world'
import { RAW_BUILD_SHA, RAW_BUILD_DATE } from '../buildStamp'

/** What a field says when nothing honest can fill it. ⚠ Kept in step with `UNKNOWN` in
 *  scripts/build-stamp.mjs – the build-side fallback and the render-side fallback must read the same
 *  on the phone, or the reader has to learn which layer failed to know what he is looking at. */
export const BUILD_UNKNOWN = 'unknown'

/** 7 hex characters, as `scripts/build-stamp.mjs` emits them. Anything longer is accepted and cut so
 *  a full 40-character SHA (a hand-set define, a different builder) still reads as itself. */
const SHORT_SHA_RE = /^[0-9a-f]{7,40}$/
/** `YYYY-MM-DD`, and nothing else – the shape `Date#toISOString` produces. */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * The commit, cut to 7 characters, or `unknown`.
 *
 * ⚠ THE SHAPE IS CHECKED, NOT JUST THE EMPTINESS. An unsubstituted define, a placeholder someone left
 * in, a `HEAD` that git printed back because the argument was wrong – each of those is a string that
 * renders perfectly and points at nothing. A line that says `unknown` costs the reader one lookup; a
 * line that says `abcdefg` when no such commit exists costs him the whole investigation.
 */
export function shortSha(raw: unknown): string {
  const s = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  return SHORT_SHA_RE.test(s) ? s.slice(0, 7) : BUILD_UNKNOWN
}

/** The build date, or `unknown`. Same argument as `shortSha`: a malformed date is not printed. */
export function buildDay(raw: unknown): string {
  const s = typeof raw === 'string' ? raw.trim() : ''
  return ISO_DATE_RE.test(s) ? s : BUILD_UNKNOWN
}

/**
 * The line itself. Pure: every input is an argument, so the fallback path is reachable from a test
 * without a build and without a browser.
 *
 * ⚠ NO CYRILLIC AND NO LONG DASH – it renders in a `<template>`, and both are house law.
 */
export function buildLine(rawSha: unknown, rawDate: unknown, schema: number): string {
  return `Build ${shortSha(rawSha)} · ${buildDay(rawDate)} · save schema v${schema}`
}

/** What the app prints: the pure formatter applied to the baked constants. */
export function appBuildLine(): string {
  return buildLine(RAW_BUILD_SHA, RAW_BUILD_DATE, SAVE_SCHEMA_VERSION)
}

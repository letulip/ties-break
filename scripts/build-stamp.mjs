#!/usr/bin/env node
// THE BUILD STAMP – what the app prints at the foot of Settings so a bug report can name a commit.
//
// Round 29 #19, the owner: «вроде бы я всё мержил и обновление прилетало на телефон, где информация
// об этом? может быть стоит какую-то версию добавить в настройках внизу строчкой?» The PWA updates
// itself on his phone and nothing on the screen said which build had arrived – so every defect he
// reported carried an unknown, and it has already cost one wrong diagnosis (his save was asserted to
// predate a merged wave; it was schema 65 and the wave was in it).
//
// ⭐ A SHORT COMMIT SHA, NOT A SEMVER. A semver says what we intended to release; a SHA says what he
// is holding, and the second is the question a defect report actually needs answered.
//
// ⚠ THIS RUNS AT BUILD TIME AND ONLY AT BUILD TIME. vite.config.ts calls it once and bakes the two
// strings into the bundle with `define`, so what the phone renders is a fact about the bytes it is
// running. Nothing here is reachable from the app at runtime: a version line that resolves itself
// from a file, a header or a manifest can go stale against the bundle around it, and a version line
// that lies is worse than no version line.
//
// The module stays plain ESM JS – same arrangement as scripts/optimize-art.mjs and
// scripts/heavy-tests.mjs – so vite.config.ts, the test suite and a bare `node` can all read it
// with no TS loader. `scripts/build-stamp.d.mts` is its declaration.

import { execFileSync } from 'node:child_process'

/** What every field falls back to. ⚠ EXPLICIT, NEVER EMPTY AND NEVER A GUESS: a blank line reads as
 *  a rendering bug and a plausible-looking wrong SHA sends the reader to the wrong commit. */
export const UNKNOWN = 'unknown'

/** Short SHAs are 7 hex characters here – long enough to be unambiguous in this repo, short enough
 *  to sit on a phone line beside a date and a schema number. */
const SHORT = 7
const SHA_RE = /^[0-9a-f]{40}$/
const SHORT_SHA_RE = /^[0-9a-f]{7,40}$/

/**
 * The commit this build was made from, as 7 hex characters, or `unknown`.
 *
 * ⚠ THE LADDER EXISTS BECAUSE THE BUILD MUST NOT BREAK WHERE GIT CANNOT ANSWER – a tarball export,
 * a container with no git binary, a checkout with no history. Each rung is a fact somebody else
 * asserted about this build, in decreasing order of directness:
 *
 *   1. `GITHUB_SHA` / `CI_COMMIT_SHA` – the CI's own statement of what it checked out. Exact, and
 *      it survives a container that has no git at all.
 *   2. `git rev-parse` – the local answer, which is the only one a developer's build has.
 *   3. `unknown`.
 */
export function buildSha(env = process.env, cwd = process.cwd()) {
  const fromCi = String(env.GITHUB_SHA ?? env.CI_COMMIT_SHA ?? '').trim().toLowerCase()
  if (SHA_RE.test(fromCi)) return fromCi.slice(0, SHORT)

  try {
    const out = execFileSync('git', ['rev-parse', `--short=${SHORT}`, 'HEAD'], {
      cwd,
      encoding: 'utf8',
      // ⚠ stderr is swallowed, not inherited: outside a repository git writes "not a git repository"
      // and the build would look broken while doing exactly the right thing.
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .trim()
      .toLowerCase()
    return SHORT_SHA_RE.test(out) ? out.slice(0, SHORT) : UNKNOWN
  } catch {
    return UNKNOWN
  }
}

/**
 * The day the bundle was built, `YYYY-MM-DD`, UTC.
 *
 * ⚠ THE BUILD DATE, NOT THE COMMIT DATE, and the choice is deliberate. His question is «обновление
 * прилетало на телефон, где информация об этом?» – *when did this thing arrive*, which is the day it
 * was built and deployed. The commit's own date is recoverable from the SHA beside it; the deploy
 * date is not recoverable from anything. It is also the one field that cannot fail: no git, no
 * network and no CI is needed to know what today is.
 */
export function buildDate(now = new Date()) {
  const t = now.getTime()
  if (!Number.isFinite(t)) return UNKNOWN
  return now.toISOString().slice(0, 10)
}

/** Both fields, as vite.config.ts bakes them. */
export function buildStamp(env = process.env, cwd = process.cwd(), now = new Date()) {
  return { sha: buildSha(env, cwd), date: buildDate(now) }
}

// Run directly, it prints what a build made right now would bake in. ⚠ THIS IS THE HALF THAT MAKES
// THE `pull-request` SKILL'S STEP 4d CHECKABLE WITHOUT A BROWSER: step 4d asks whoever assembles the
// PR to confirm the version line the app renders is the one the PR ships, and
// `node scripts/build-stamp.mjs` prints that value on one line, next to which `dist/` can be grepped
// for the same string. A step that needed a phone in hand would be decorative.
if (import.meta.url === `file://${process.argv[1]}`) {
  const { sha, date } = buildStamp()
  process.stdout.write(`${sha} ${date}\n`)
}

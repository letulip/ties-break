// ROUND 29 #19 - THE FOOT OF SETTINGS SAYS WHICH BUILD HE IS PLAYING.
//
// The owner: «вроде бы я всё мержил и обновление прилетало на телефон, где информация об этом? может
// быть стоит какую-то версию добавить в настройках внизу строчкой?» The PWA updates itself on his
// phone, so every defect he reports has carried an unknown - and it already cost a wrong diagnosis:
// his save was asserted to predate a merged wave and was in fact schema 65, with the wave in it.
//
// ⚠⚠ THIS FILE MOUNTS THE REAL SCREEN AND READS THE REAL BAKED VALUES. He reports from a RUNNING
// build; a source grep would prove that a template mentions a variable and nothing more. The SHA
// asserted below is recomputed here with `git rev-parse`, independently of the code under test, so a
// define that silently stopped being substituted turns this red instead of quietly rendering
// `unknown` - which is exactly the failure a version line must never have.
//
// The fallback half - what renders when the constant is ABSENT, the case a clean checkout or a CI
// container with no history will produce one day - is `round29-build-line-fallback.test.ts`. It
// needs `vi.mock` on the injection point, which is file-scoped, so it cannot share a file with the
// real-values arm without mocking the very thing this file exists to check.
import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { execFileSync } from 'node:child_process'
import MoreScreen from '../../src/components/screens/MoreScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { SAVE_SCHEMA_VERSION } from '../../src/engine/world'
import { RAW_BUILD_SHA, RAW_BUILD_DATE } from '../../src/buildStamp'
import { buildLine, shortSha, buildDay, BUILD_UNKNOWN } from '../../src/composables/buildInfo'
import { buildSha, UNKNOWN } from '../../scripts/build-stamp.mjs'

/** The commit, asked of git directly - NOT of the module under test. If git cannot answer here
 *  (a tarball, a container with no history) the expectation becomes `unknown`, which is the same
 *  answer the build makes in that situation, so the assertion stays honest either way.
 *  ⚠ `process.cwd()` and not `import.meta.url`: this project transforms its files, so `import.meta`
 *  carries no file URL here. Vitest runs a project from the repo root, which is what git needs. */
function expectedSha(): string {
  try {
    return execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .trim()
      .toLowerCase()
  } catch {
    return BUILD_UNKNOWN
  }
}

/** MoreScreen asks the worker for the career list on mount and there is no worker in this runner;
 *  the same replacement every other mounted MoreScreen test makes. */
function mountMore() {
  const store = useGameStore()
  store.refreshCareers = async () => {}
  return mount(MoreScreen, { global: { stubs: { teleport: true } } })
}

beforeEach(() => setActivePinia(createPinia()))

describe('the build line renders at the foot of Settings, with the values the build baked in', () => {
  it('prints the commit this build was made from - the real one, not a placeholder', () => {
    const wrapper = mountMore()
    const line = wrapper.get('.build-line').text()

    const sha = expectedSha()
    // ⚠ TWO CLAIMS, AND THE SECOND IS THE LOAD-BEARING ONE. That the text contains SOMETHING is
    // cheap; that it contains the commit git names, asked separately, is what a bug report needs.
    expect(line).toContain('Build ')
    expect(line, `the foot of Settings must name ${sha}`).toContain(sha)
    // And the value came through the define, not through a runtime lookup: the module that holds
    // the substituted constant agrees with git.
    expect(shortSha(RAW_BUILD_SHA)).toBe(sha)
  })

  it('prints the build date and this build\'s save schema, so a report carries both numbers', () => {
    const line = mountMore().get('.build-line').text()
    expect(line).toContain(buildDay(RAW_BUILD_DATE))
    expect(buildDay(RAW_BUILD_DATE)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    // ⚠ THE BUILD'S SCHEMA, NOT THE LOADED SAVE'S - and this mount has no career at all, which is
    // precisely the case the About table's `snapshot.schemaVersion` row cannot answer.
    expect(line).toContain(`save schema v${SAVE_SCHEMA_VERSION}`)
    // ⚠ House law for ITS OWN wave: item 19 is a version string and must not move the schema.
    // ⚠ RE-AIMED AT v66 (29.08, round 29 part four P7 – the 'business' category's own three-part
    // move), NOT WEAKENED: the claim was always «the BUILD-LINE wave moved no schema», and 66 was
    // moved by P7's ledger category with its full move (migration, golden fixture, e2e fixtures
    // regenerated), never by this line's item. The pin follows the ladder's head so the sentence
    // above it stays checkable.
    expect(SAVE_SCHEMA_VERSION).toBe(66)
  })

  it('is one line at the FOOT of the screen, and it is there whichever tab is open', async () => {
    const wrapper = mountMore()
    // One, not one per tab.
    expect(wrapper.findAll('.build-line')).toHaveLength(1)

    // The last thing in the rendered flow. `ConfirmDialog` is absent unless something is pending,
    // so the build line is the final element the screen lays out.
    const children = [...wrapper.element.children]
    expect(children.at(-1)?.className).toContain('build-line')

    // ...and it survives the tab switch, because he should not have to know which tab it is on.
    for (const tab of ['Saves', 'About']) {
      const pill = wrapper.findAll('.more-tabs .tab-pill').find((p) => p.text() === tab)
      expect(pill, `the ${tab} tab exists`).toBeTruthy()
      await pill!.trigger('click')
      expect(wrapper.get('.build-line').text(), `still present on ${tab}`).toContain('Build ')
    }
  })

  it('obeys the house copy rules - no Cyrillic, short dash only', () => {
    const line = mountMore().get('.build-line').text()
    expect(line).not.toMatch(/[А-Яа-яЁё]/)
    expect(line).not.toContain('—')
  })
})

// =================================================================================================
// THE FALLBACK, AT THE BUILD SIDE.
//
// ⚠ THE CASE THAT WILL ACTUALLY HAPPEN, and it will happen in CI: git is not installed, or the
// directory has no history. The build must not break and must not invent a SHA. Exercised against
// the real script with a cwd that is not a repository, which is the same refusal git gives a
// container with a bare copy of the tree.
// =================================================================================================
describe('the build stamp refuses to guess when git cannot answer', () => {
  it('falls back to an explicit "unknown", not to an empty or plausible string', () => {
    // ⚠ THE ENV MUST BE EMPTIED TOO. The first rung of the ladder is the CI's own `GITHUB_SHA`, and
    // this suite runs under GitHub Actions - left in place it would answer and the git-less path
    // would never be reached, which is a green test measuring the wrong rung.
    const sha = buildSha({}, '/')
    expect(sha).toBe(UNKNOWN)
    expect(sha).toBe(BUILD_UNKNOWN)
    expect(sha).not.toBe('')
  })

  it('takes the CI\'s own commit when it is set, so a container with no git still says something true', () => {
    const full = 'a'.repeat(7) + 'b'.repeat(33)
    expect(buildSha({ GITHUB_SHA: full }, '/')).toBe('aaaaaaa')
    expect(buildSha({ CI_COMMIT_SHA: full }, '/')).toBe('aaaaaaa')
    // ...but only when it is a real SHA. A branch name in that variable is not a commit.
    expect(buildSha({ GITHUB_SHA: 'refs/heads/main' }, '/')).toBe(UNKNOWN)
  })

  it('rejects a plausible-looking value rather than sending a reader to a commit that does not exist', () => {
    // ⭐ The whole reason the formatter validates instead of printing whatever it was handed.
    expect(shortSha('HEAD')).toBe(BUILD_UNKNOWN)
    expect(shortSha('__BUILD_SHA__')).toBe(BUILD_UNKNOWN)
    expect(shortSha('zzzzzzz')).toBe(BUILD_UNKNOWN)
    expect(shortSha(undefined)).toBe(BUILD_UNKNOWN)
    expect(buildDay('2026-8-1')).toBe(BUILD_UNKNOWN)
    expect(buildDay('')).toBe(BUILD_UNKNOWN)
    // A full 40-character SHA is real, and is cut rather than refused.
    expect(shortSha('9201e53446cac55260550e96890a585c64d7485a')).toBe('9201e53')
  })

  it('renders a whole line even when every field is missing', () => {
    // No empty field, no dangling separator, no "Build  ·  ·".
    expect(buildLine('', '', 65)).toBe('Build unknown · unknown · save schema v65')
  })
})

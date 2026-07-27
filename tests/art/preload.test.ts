import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  KID_EMOTIONS,
  FINALE_EMOTIONS,
  cropUrl,
  finaleUrl,
  portraitUrl,
  preloadStage,
  preloadForAge,
  preloadNextStageIfDue,
  resetPreloadCache,
  stageDueNext,
  warmedCount,
} from '../../src/art/preload'
import type { PortraitStage } from '../../src/shared/avatarEmotion'

// R11-9. The preloader's whole value is that it asks for the SAME urls the components ask for.
// A url that 404s is worse than no preload: it costs a request, logs an error, and still leaves
// the popup art-less. So every url this module can produce is checked against the real files in
// public/ – which is also what catches the next missing art variant (it caught the first one:
// TournamentFlow asks for `-fs8` at every stage, and adult-happy-fs8.webp did not exist).

const PUBLIC = fileURLToPath(new URL('../../public/', import.meta.url))
const STAGES: PortraitStage[] = ['jun', 'young', 'teen', 'adult']

/** url -> path on disk (strip the Vite base prefix the builders prepend). */
function assetPath(url: string): string {
  return PUBLIC + url.slice(import.meta.env.BASE_URL.length)
}

describe('preload urls resolve to files that actually ship', () => {
  it('every Kid-screen painting exists (4 stages x 6 emotions)', () => {
    for (const stage of STAGES) {
      for (const emotion of KID_EMOTIONS) {
        const p = assetPath(portraitUrl(stage, emotion))
        expect(existsSync(p), `missing painting ${p}`).toBe(true)
      }
    }
  })

  it('every tournament-finale painting exists (4 stages x champion/runner-up/exit)', () => {
    for (const stage of STAGES) {
      for (const emotion of FINALE_EMOTIONS) {
        const p = assetPath(finaleUrl(stage, emotion))
        expect(existsSync(p), `missing finale art ${p}`).toBe(true)
      }
    }
  })

  it('every 256px crop exists (adult clamps to teen, like kidEmotion.ts)', () => {
    for (const stage of STAGES) {
      for (const emotion of KID_EMOTIONS) {
        const p = assetPath(cropUrl(stage, emotion))
        expect(existsSync(p), `missing crop ${p}`).toBe(true)
      }
    }
  })

  it('public/images ships only webp – no raw png/jpeg sources leak into the bundle', () => {
    // art-src/ is the home for sources (scripts/optimize-art.mjs); public/ is what users download.
    // Two 300 KiB jpegs were sitting here unreferenced before R11-9.
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((n) => (statSync(dir + n).isDirectory() ? walk(`${dir}${n}/`) : [dir + n]))
    const stray = walk(`${PUBLIC}images/`).filter((f) => !f.endsWith('.webp'))
    expect(stray, `raw sources under public/images: ${stray.join(', ')}`).toEqual([])
  })
})

describe('preload budget', () => {
  it('one age band is 15 urls: 6 paintings + 6 crops + 3 finale frames', () => {
    resetPreloadCache()
    const urls = preloadStage('young')
    expect(new Set(urls).size).toBe(15)
  })

  it('is idempotent – calling it every tick costs nothing after the first', () => {
    resetPreloadCache()
    preloadForAge(14)
    const after = warmedCount()
    preloadForAge(14)
    preloadForAge(15) // same band (young covers 11-16)
    expect(warmedCount()).toBe(after)
  })

  it('warms one band at a time – the whole 4-band set is never pulled at once', () => {
    resetPreloadCache()
    preloadForAge(14)
    expect(warmedCount()).toBe(15)
  })
})

describe('stageDueNext – only warm the next band on the last year of the current one', () => {
  it('fires exactly on the boundary years', () => {
    expect(stageDueNext(10)).toBe('young') // jun ends at 10
    expect(stageDueNext(16)).toBe('teen') // young ends at 16
    expect(stageDueNext(22)).toBe('adult') // teen ends at 22
  })

  it('stays silent mid-band and at the top of the ladder', () => {
    for (const age of [9, 11, 14, 15, 17, 21]) expect(stageDueNext(age)).toBeNull()
    expect(stageDueNext(23)).toBeNull()
    expect(stageDueNext(30)).toBeNull()
  })

  it('a mid-band career pays for one band only', () => {
    resetPreloadCache()
    preloadForAge(14)
    preloadNextStageIfDue(14)
    expect(warmedCount()).toBe(15)
  })

  it('the last year of a band pays for two', () => {
    resetPreloadCache()
    preloadForAge(16)
    preloadNextStageIfDue(16)
    expect(warmedCount()).toBe(30)
  })
})

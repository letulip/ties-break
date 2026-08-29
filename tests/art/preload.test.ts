import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  KID_PAINTING_EMOTIONS,
  KID_CROP_EMOTIONS,
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
// TournamentFlow asked for `-fs8` at every stage, and adult-happy-fs8.webp did not exist).
//
// build/webp-only closed that hole at the source: `-fs8` is gone from the art and from the code,
// and TournamentFlow.vue / OnboardingWizard.vue now build their urls with the SAME functions this
// file checks, instead of spelling the paths out themselves. These three "exists" tests are
// therefore the complete enumeration of every portrait url the app can construct.
//
// ⚠ RE-AIMED by ui/art-rehab-sleepy: `KID_EMOTIONS` split into KID_PAINTING_EMOTIONS (8) and
// KID_CROP_EMOTIONS (7), because the two art sets stopped being the same set – `rehab` ships as
// five paintings and no crops (nothing in the app renders an emotion crop; see the note on
// KID_PAINTING_EMOTIONS). The property these tests protect is UNCHANGED and is the reason the
// split had to happen here too: every url the module can produce must resolve to a file on disk.
// Looping the crops over the painting set would have asserted the existence of five files that are
// deliberately not cut – i.e. it would have demanded the exact regression the split prevents.

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const PUBLIC = `${ROOT}public/`
const STAGES: PortraitStage[] = ['jun', 'young', 'teen', 'adult', 'lateCareer']

/** url -> path on disk (strip the Vite base prefix the builders prepend). */
function assetPath(url: string): string {
  return PUBLIC + url.slice(import.meta.env.BASE_URL.length)
}

describe('preload urls resolve to files that actually ship', () => {
  it('every Kid-screen painting exists (5 stages x 8 emotions, rehab included)', () => {
    for (const stage of STAGES) {
      for (const emotion of KID_PAINTING_EMOTIONS) {
        const p = assetPath(portraitUrl(stage, emotion))
        expect(existsSync(p), `missing painting ${p}`).toBe(true)
      }
    }
  })

  it('every tournament-finale painting exists (5 stages x champion/runner-up/exit)', () => {
    for (const stage of STAGES) {
      for (const emotion of FINALE_EMOTIONS) {
        const p = assetPath(finaleUrl(stage, emotion))
        expect(existsSync(p), `missing finale art ${p}`).toBe(true)
      }
    }
  })

  it('every 256px crop exists – no stage borrows another stage\'s face any more', () => {
    for (const stage of STAGES) {
      for (const emotion of KID_CROP_EMOTIONS) {
        const p = assetPath(cropUrl(stage, emotion))
        expect(existsSync(p), `missing crop ${p}`).toBe(true)
      }
    }
  })

  it('...and NO crop is warmed for a painting-only face – the 404 the split exists to prevent', () => {
    // The other half of the same property, and the one that would have been lost by simply
    // widening the loop above: `preloadKidArt` must ask for 8 paintings and 7 crops, never 8 and 8.
    // Asserted on the URLS the module actually emits, so a future edit to either loop is caught.
    resetPreloadCache()
    const urls = preloadStage('teen')
    const crops = urls.filter((u) => u.includes('/avatars/'))
    expect(crops.some((u) => u.includes('rehab')), 'a rehab CROP was warmed – that file does not exist').toBe(false)
    expect(new Set(crops).size).toBe(KID_CROP_EMOTIONS.length)
    const paintings = new Set(urls.filter((u) => u.includes('/fem-euro-brunnet/')))
    expect([...paintings].some((u) => u.endsWith('teen-rehab.webp')), 'the rehab PAINTING must be warmed').toBe(true)
    expect(paintings.size).toBe(KID_PAINTING_EMOTIONS.length)
  })

  it('no url the app can build still carries the dead "-fs8" suffix', () => {
    // pngquant-era Floyd-Steinberg name. It selected a second, INCOMPLETE copy of the art set,
    // which is exactly how the adult champion splash 404'd. Nothing may reintroduce it.
    const every = STAGES.flatMap((stage) => [
      ...KID_PAINTING_EMOTIONS.map((e) => portraitUrl(stage, e)),
      ...KID_CROP_EMOTIONS.map((e) => cropUrl(stage, e)),
      ...FINALE_EMOTIONS.map((e) => finaleUrl(stage, e)),
    ])
    expect(every.filter((u) => u.includes('-fs8'))).toEqual([])
    // ...and the files themselves are gone, so a stale url cannot quietly keep working.
    const survivors = readdirSync(`${PUBLIC}images/fem-euro-brunnet/`).filter((n) => n.includes('-fs8'))
    expect(survivors, `-fs8 art still on disk: ${survivors.join(', ')}`).toEqual([])
  })

  it('public/images ships only webp – no raw png/jpeg is COMMITTED into the bundle', () => {
    // art-src/ is the home for masters (scripts/optimize-art.mjs); public/ is what users download.
    //
    // build/webp-only – this test scans the filesystem, so it used to go red on any machine that
    // merely HAD a .DS_Store or a folder of art waiting to be converted, while staying green in
    // CI. Two changes, because the two kinds of offender need two different fixes:
    //   - dotfiles are skipped outright (.DS_Store is not shipped art);
    //   - a TRACKED non-webp still FAILS – that is a commit that has to be undone – while a local
    //     leftover only WARNS, because the build itself evacuates it (the art pipeline plugin in
    //     vite.config.ts moves raw files to art-src/ before Vite copies public/ into dist/).
    const walk = (dir: string): string[] =>
      readdirSync(dir)
        .filter((n) => !n.startsWith('.'))
        .flatMap((n) => (statSync(dir + n).isDirectory() ? walk(`${dir}${n}/`) : [dir + n]))

    // ⚠ RE-AIMED 01.08, not weakened: `README.md` joined the allowed set. The P7 legal wave put the
    // art provenance manifest at public/images/README.md - the exact per-folder convention
    // public/music/README.md and public/sounds/README.md already follow - and this guard predates
    // it. Documentation is not raw art: it ships nothing (the precache glob has no .md and
    // globIgnores covers images/**  – ⚠ RE-AIMED AGAIN 29.08: `globIgnores` is GONE and every webp
    // under images/ is precached now, so the glob's extension list is the only thing keeping the
    // README out of the install, and it is enough), and the manifest ANSWERS the rights question
    // this directory used to be unable to answer. Everything else non-webp still fails exactly as
    // before - the allowance is the one literal filename, never a blanket extension.
    const stray = walk(`${PUBLIC}images/`).filter((f) => !f.endsWith('.webp') && !f.endsWith('/README.md'))

    // git is the authority on "committed". If it cannot answer (no git, exported tarball), treat
    // every offender as tracked – failing loudly beats silently losing the guard.
    let trackedSet: Set<string> | null = null
    try {
      const out = execFileSync('git', ['ls-files', '-z', '--', 'public/images'], {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      })
      trackedSet = new Set(out.split('\0').filter(Boolean))
    } catch {
      trackedSet = null
    }
    const isTracked = (abs: string) => (trackedSet ? trackedSet.has(`public/${abs.slice(PUBLIC.length)}`) : true)

    const tracked = stray.filter(isTracked)
    const leftovers = stray.filter((f) => !isTracked(f))

    if (leftovers.length) {
      console.warn(
        `\n[preload.test] ${leftovers.length} untracked raw file(s) under public/images – LOCAL LEFTOVER, ` +
          `not a commit. The build evacuates these to art-src/ automatically; run \`npm run art\` to do it now:\n  ` +
          leftovers.map((f) => f.slice(PUBLIC.length)).join('\n  ') +
          '\n',
      )
    }

    const label = (f: string) => `${f.slice(PUBLIC.length)} [${isTracked(f) ? 'TRACKED – git rm it' : 'local leftover'}]`
    expect(
      tracked,
      `non-webp COMMITTED under public/images (raw art must never be committed – ` +
        `drop masters in public/images/<set>-jpeg/ and let the build convert them):\n  ` +
        stray.map(label).join('\n  '),
    ).toEqual([])
  })
})

describe('preload budget', () => {
  it('one age band is 15 urls: 8 paintings + 7 crops (the 3 finale frames are 3 of the 8)', () => {
    // It was 15 before build/webp-only, when the finale asked for a duplicate `-fs8` copy of
    // happy/serious/sad. Deleting the duplicates made the finale share the Kid-screen paintings,
    // so a band cost 3 fewer requests and ~150 KiB less.
    // 12 -> 14 (fix/world-trio): `angry` became a REACHABLE outcome (a run of 4-6 straight losses),
    // so its painting + crop joined the warmed set. The budget rule is unchanged and is the reason
    // the number moved at all – warm every face a surface can request, and only those.
    // ⚠ 14 -> 15 (ui/art-rehab-sleepy): `rehab` adds ONE url, not two. It is the first face whose
    // painting exists and whose crop does not, so the band's cost is now asymmetric BY DESIGN –
    // 16 would mean a crop had been warmed that cannot resolve.
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

  it('warms one band at a time – the whole 5-band set is never pulled at once', () => {
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
    expect(stageDueNext(30)).toBe('lateCareer') // adult ends at 30 (it had no upper bound before)
  })

  it('stays silent mid-band and at the top of the ladder', () => {
    for (const age of [9, 11, 14, 15, 17, 21]) expect(stageDueNext(age)).toBeNull()
    expect(stageDueNext(23)).toBeNull() // first year of adult, 7 years from the 31+ band
    expect(stageDueNext(29)).toBeNull()
    // the 31+ band is the LAST one – past it there is never a next one to warm.
    expect(stageDueNext(31)).toBeNull()
    expect(stageDueNext(45)).toBeNull()
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

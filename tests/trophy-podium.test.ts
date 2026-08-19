// THE REAL TROPHY ON THE PODIUM, AND ITS FLIGHT TO THE CABINET (31.07).
//
// The owner, looking at the finished Trophy Cabinet:
//
//   «раз у нас есть реальные трофеи, мы бы могли их как есть рисовать в призах вместо текущих общих
//    эмоджи, каждый титул станет индивидуальным. Можно даже анимацию сделать "добавления трофея в
//    раздел трофеев" с точечкой зеленой по итогу»
//
// Three claims in this slice can rot silently, and each of them fails in a way no other suite would
// notice, which is why they get a file:
//
//   1. THE URL DRIFTING BACK INTO TWO SPELLINGS. The cabinet and the podium now draw the same
//      eighteen files. This app has already shipped a 404 on exactly that mistake – the finale built
//      a `-fs8` filename, the preloader built the same one separately, they disagreed, and the adult
//      champion splash showed nothing on the one screen a player reaches by winning. A trophy url
//      that goes wrong here goes wrong on a poster nobody sees twice.
//
//   2. THE DOT QUIETLY BECOMING "UNREAD". The house rule is Home's bell, in its own words: "the
//      bell's dot asserts one FACT and not the 'unread' it cannot know". A dot fed by a watermark is
//      one small edit away from being a dot fed by a guess, and nothing on screen would look
//      different on the day it changed.
//
//   3. REDUCED MOTION EATING THE INFORMATION ALONG WITH THE ANIMATION. The flight is decoration; the
//      trophy and the dot are not. The failure mode is a single `v-if` in the wrong place, and it
//      would only ever be found by someone who has the preference turned on.
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { TIER_LADDER } from '../src/engine/season/calendar'
import { trophyArtUrl, trophyMetalFor } from '../src/art/trophies'
import {
  TROPHY_FLIGHT_MS,
  armTrophyFlight,
  trophyDotShows,
  trophyPieces,
} from '../src/composables/trophyArrival'
import type { Snapshot, TierTrophies } from '../src/shared/protocol'
import type { TierId } from '../src/engine/season/types'
// CODE WITH THE PROSE TAKEN OUT – the house helper, now in tests/helpers/source.ts, and this file
// needs it more than most: half the assertions below ban a string that the source explains itself by
// QUOTING. `art/trophies.ts` says in a comment why there is no 'bronze'; the finale's script says
// what the emoji it replaced used to be. A ban that reads the comments fires on its own
// documentation, and the only way to satisfy it would be to delete the reasoning.
import { codeOf } from './helpers/source'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const read = (p: string) => readFileSync(`${ROOT}${p}`, 'utf8')

const RESOLVER = 'src/art/trophies.ts'
const ARRIVAL = 'src/composables/trophyArrival.ts'
const FLOW = 'src/components/TournamentFlow.vue'
const CABINET = 'src/components/screens/TrophiesScreen.vue'
const SHELL = 'src/App.vue'
const SHEET = 'src/style.css'

/** url -> path on disk (strip the Vite base the builder prepends) – the preload suite's own helper. */
function assetPath(url: string): string {
  return `${ROOT}public/${url.slice(import.meta.env.BASE_URL.length)}`
}

/** A component's TEMPLATE, root element only. Slicing to the end of the file would drag the <style>
 *  block in, and the copy rules this suite checks are about markup. */
function templateOf(src: string): string {
  return src.slice(src.indexOf('<template>'), src.lastIndexOf('</template>'))
}

/** A full cabinet – every shelf the ledger really carries – with the given weeks on the first tier.
 *  Built off `TIER_LADDER` rather than hand-listed, so a new rung joins these fixtures for free. */
function ledgerWith(titles: number[], finals: number[]): Pick<Snapshot, 'trophiesByTier'> {
  const byTier = {} as Record<TierId, TierTrophies>
  for (const tier of TIER_LADDER) byTier[tier] = { titles: [], finals: [] }
  byTier[TIER_LADDER[0]] = { titles, finals }
  return { trophiesByTier: byTier }
}

// =================================================================================================
describe('the podium hangs the real trophy, and there is ONE builder for it', () => {
  it('every url the builder can produce is a file that actually ships – both directions', () => {
    const dir = `${ROOT}public/images/trophies`
    const onDisk = new Set(readdirSync(dir).filter((f) => f.endsWith('.webp')))
    const built = new Set<string>()
    for (const tier of TIER_LADDER) {
      for (const metal of ['gold', 'silver'] as const) {
        const url = trophyArtUrl(tier, metal)
        expect(existsSync(assetPath(url)), `missing ${url}`).toBe(true)
        built.add(url.slice(url.lastIndexOf('/') + 1))
      }
    }
    // ...and nothing ships that no url can reach: art the app can never draw is art nobody knows is
    // dead. This is the direction tests/art/preload.test.ts calls "the complete enumeration".
    expect([...onDisk].sort()).toEqual([...built].sort())
    // 18 -> 24 with W2-LADDER's three rungs (the count IS TIER_LADDER x two metals; the new pairs
    // are placeholder copies of neighbours' masters, flagged in art/trophies.ts).
    expect(built.size).toBe(TIER_LADDER.length * 2)
  })

  it('gold on the champion screen, silver on the runner-up screen', () => {
    expect(trophyMetalFor(true)).toBe('gold')
    expect(trophyMetalFor(false)).toBe('silver')
    // and the podium asks the shared helper rather than deciding again
    expect(read(FLOW)).toContain('trophyMetalFor(pending.value.kidChampion)')
  })

  it('⚠ NEITHER SCREEN SPELLS THE PATH ITSELF – one place knows how a trophy is addressed', () => {
    // The whole point of the extraction. `images/trophies/` may appear in exactly one source file.
    const spellers = [RESOLVER, ARRIVAL, FLOW, CABINET, SHELL].filter((p) =>
      read(p).includes('images/trophies/'),
    )
    expect(spellers).toEqual([RESOLVER])
    // ...and both consumers go through it.
    expect(read(FLOW)).toContain("from '../art/trophies'")
    expect(read(CABINET)).toContain("from '../../art/trophies'")
    expect(read(CABINET)).toContain('trophyArtUrl(tier, ')
  })

  it('the generic emoji are gone from all three finale posters', () => {
    const flow = read(FLOW)
    // The two the owner named («вместо текущих общих эмоджи») plus the third on the poster where
    // somebody else lifted it – one screen may not carry two art styles for the same object.
    // `codeOf`, because the script's own note QUOTES the pair it replaced, at length and on purpose.
    expect(codeOf(flow)).not.toContain('🏆')
    expect(codeOf(flow)).not.toContain('🥈')
    const marks = [...templateOf(flow).matchAll(/<img\b[^>]*class="tf-poster-mark"[^>]*\/>/g)]
    expect(marks, 'both posters draw a painted cup').toHaveLength(2)
    // Decoration: the poster names the finish in words on the very next line.
    for (const m of marks) {
      expect(m[0]).toContain('alt=""')
      expect(m[0]).toContain('aria-hidden="true"')
    }
    // ...and only the one she can take home is measured for take-off.
    expect(marks.filter((m) => m[0].includes('ref="posterMark"'))).toHaveLength(1)
    expect(flow).toContain(':src="herTrophy"')
    expect(flow).toContain(':src="eventGoldTrophy"')
  })

  it('⚠ THERE IS NO THIRD METAL, AND THE REASON IS THE DRAW', () => {
    // A knockout bracket leaves two losing semi-finalists and no play-off, exactly as real tennis
    // does, so gold and silver are the only two objects a tournament here can produce. The union is
    // closed for that reason and not for an art budget – a 'bronze' would not fail to find a file,
    // it would fail to describe the sport.
    expect(read(RESOLVER)).toContain("export type TrophyMetal = 'gold' | 'silver'")
    for (const p of [RESOLVER, ARRIVAL, FLOW, CABINET, SHELL]) {
      expect(codeOf(read(p)).toLowerCase(), `${p} mentions a third metal`).not.toContain('bronze')
    }
    expect(readdirSync(`${ROOT}public/images/trophies`).some((f) => f.includes('bronze'))).toBe(false)
  })
})

// =================================================================================================
describe('⚠ THE TAB DOT ASSERTS A FACT, not the "unread" it cannot know', () => {
  it('the fact is arithmetic on the ledger: pieces now vs pieces at the last visit', () => {
    expect(trophyDotShows(1, 0, false)).toBe(true) // something arrived since the cabinet was opened
    expect(trophyDotShows(3, 3, false)).toBe(false) // it has been opened since
    expect(trophyDotShows(0, 0, false)).toBe(false) // an empty cabinet claims nothing
    // A watermark AHEAD of the count cannot light the dot – the ledger only grows, so this is a
    // corrupt-state case and the honest answer to it is silence rather than a guess.
    expect(trophyDotShows(2, 5, false)).toBe(false)
  })

  it('it counts OBJECTS, so a second title on a shelf that already had one still speaks', () => {
    expect(trophyPieces(ledgerWith([40], []))).toBe(1)
    expect(trophyPieces(ledgerWith([40, 92, 144], [60]))).toBe(4)
    expect(trophyPieces(ledgerWith([], []))).toBe(0)
    expect(trophyPieces(null)).toBe(0)
    expect(trophyPieces(undefined)).toBe(0)
    // ⚠ `bestFinishByTier` would have said nothing at all on the second J300 title – it is a
    // high-water mark. The cabinet's own screen prints `x8` off these arrays, so counting them is
    // the same arithmetic the room the player is about to walk into is doing.
    expect(codeOf(read(ARRIVAL))).not.toContain('bestFinishByTier')
  })

  it('a save whose shelf is missing counts as empty rather than throwing', () => {
    // The self-healing case tests/trophy-cabinet.test.ts pins from the other end: a career migrated
    // before a rung existed reaches this count with no shelf for it.
    const holed = ledgerWith([40], [60])
    delete (holed.trophiesByTier as Record<string, unknown>)[TIER_LADDER[1]]
    expect(() => trophyPieces(holed)).not.toThrow()
    expect(trophyPieces(holed)).toBe(2)
  })

  it('the shell uses the shared predicate, a PER-CAREER watermark, and nothing else', () => {
    const app = read(SHELL)
    expect(app).toContain('trophyDotShows(')
    // Per career: careers advance independently, so a global key would collide (the R9-21b news
    // lesson, which this file is deliberately copying rather than re-deriving).
    expect(app).toContain('`tb:lastSeenTrophies:${game.snapshot?.careerId ?? \'\'}`')
    // ⚠ A MISSING WATERMARK IS THE CURRENT COUNT, NEVER ZERO. A career with trophies and no stored
    // watermark is a case where the app does not KNOW whether the cabinet was ever opened, and a dot
    // must not claim a fact it cannot hold.
    expect(app).toContain('stored === null ? trophyPieceCount.value : Number(stored)')
    // ...and it goes out when the cabinet is opened, which is when the sentence stops being true.
    expect(app).toMatch(/if \(t === 'trophies'\) markTrophiesSeen\(\)/)
  })

  it('the dot is the SAME object as Season\'s and Home\'s – no private treatment for one tab', () => {
    const app = read(SHELL)
    // ⚠ RE-AIMED, NOT WEAKENED (fix/a11y-sweep, accessibility defect D7). This line used to quote the
    // trophy dot's own `<span v-else-if="t.id === 'trophies' && trophyTabDot" class="tab-dot">`, one
    // of THREE sibling spans that drew the same object three times. The a11y sweep had to name the
    // dot (an empty span is unreachable by a test and silent to a screen reader) and three copies of
    // one element is how three names drift apart, so the siblings were merged into one element fed by
    // `tabDot(id)`.
    //
    // THE CLAIM IS UNCHANGED AND IS NOW STRICTLY STRONGER. "No private treatment for one tab" used to
    // mean "the three spans happen to agree today"; it now means there is exactly ONE dot element in
    // the shell and the trophy fact is one of the three arms that light it. A private trophy dot
    // cannot be added without failing the first line below, where before it could have been added as
    // a fourth sibling that merely looked like the others.
    //
    // ⚠ ANCHORED TO ITS OWN LINE, which is not fussiness: a bare substring count also finds the
    // class quoted inside the comment that explains the merge, so the guard reported two dots for a
    // shell that has one. Exactly the failure family round11-view.test.ts's `Reach ` pin hit in the
    // same wave - a text search has no parser and cannot tell code from prose.
    expect(app.match(/^\s*class="tab-dot"$/gm) ?? [], 'one dot element, not one per tab').toHaveLength(1)
    expect(app).toMatch(/if \(id === 'trophies'\) return trophyTabDot\.value/)
    // ...and its NAME comes out of the same map as the other two, for the same reason.
    expect(app).toMatch(/const TAB_DOT_LABEL[\s\S]{0,240}trophies:/)
    // exactly one `.tab-dot` rule in the sheet, and the trophy dot did not grow a modifier
    const sheet = read(SHEET)
    expect(sheet.match(/^\.tab-dot\s*\{/gm) ?? []).toHaveLength(1)
    expect(sheet).not.toContain('.tab-dot.trophy')
    expect(sheet).not.toContain('.tab-dot-trophy')
  })

  it('⚠ NOTHING NEW RIDES ON THE SNAPSHOT OR THE SAVE – the ledger already existed', () => {
    // The dot is derived from `trophiesByTier`, which shipped with the cabinet, plus a watermark
    // that lives in localStorage exactly like the news and This-week ones. No engine field, no
    // schema bump, no worker message.
    expect(read(ARRIVAL)).toContain("Pick<Snapshot, 'trophiesByTier'>")
    expect(read(ARRIVAL)).toContain("import type { Snapshot } from '../shared/protocol'")
    expect(read(SHELL)).toContain('localStorage.setItem(trophySeenKey()')
    for (const p of [RESOLVER, ARRIVAL]) {
      expect(read(p), `${p} must not reach into the store or the worker`).not.toContain('stores/game')
      expect(read(p), `${p} must not reach into the worker`).not.toContain('worker/')
    }
  })
})

// =================================================================================================
describe('the flight is assembly, and it stays out of the simulation', () => {
  it('⚠ REDUCED MOTION MOUNTS NOTHING, and loses no information', () => {
    const arrival = read(ARRIVAL)
    // Refused in SCRIPT, not by a `@media` rule that sets `animation: none` – that variant would
    // still mount an image and leave it lying over the tab bar (the ConfettiBurst rule).
    expect(arrival).toContain("'(prefers-reduced-motion: reduce)'")
    expect(read(SHEET)).not.toMatch(/prefers-reduced-motion[\s\S]{0,400}\.trophy-flight/)
    // Nothing to fly from means nothing flies, and the caller is told so rather than left guessing.
    expect(armTrophyFlight('images/trophies/local-gold.webp', null)).toBe(false)
    expect(armTrophyFlight('', null)).toBe(false)
    // ...and the dot does NOT depend on a flight ever having happened. This is the whole of the
    // reduced-motion contract: the trophy is in the cabinet, the dot is on the tab, only the
    // animation is skipped.
    expect(trophyDotShows(1, 0, false)).toBe(true)
    // While one IS in the air the dot is held, so it lands with the trophy instead of being there
    // before it arrives – nothing is withheld, the bar is under a full-screen takeover at the time.
    expect(trophyDotShows(1, 0, true)).toBe(false)
  })

  it('the two durations agree – a dot may never land before the trophy does', () => {
    const declared = /--trophy-flight-dur:\s*(\d+)ms/.exec(read(SHEET))?.[1]
    expect(declared, 'src/style.css must declare --trophy-flight-dur').toBeDefined()
    expect(Number(declared)).toBe(TROPHY_FLIGHT_MS)
  })

  it('it is armed BEFORE the close, from the podium only', () => {
    const flow = read(FLOW)
    // Both halves of the ordering: the mark is measured while it is still on screen, and the dot is
    // held before the bar is uncovered.
    expect(flow).toMatch(
      /if \(pending\.value\?\.kidChampion \|\| isRunnerUp\.value\) armTrophyFlight\(herTrophy\.value, posterMark\.value\)\s*\n\s*await game\.tournamentClose\(\)/,
    )
  })

  it('⚠ THIS IS PRESENTATION AND IT NEVER COMES NEAR A DRAW', () => {
    // The frozen MAIN-stream capture (41550 draws / e6b0c709) is re-derived by five other suites; it
    // can only move if something reaches the engine's rng. Nothing in this slice may.
    for (const p of [RESOLVER, ARRIVAL]) {
      const src = read(p)
      expect(src, `${p} must not draw`).not.toContain('Math.random')
      expect(src, `${p} must not touch the rng`).not.toContain('engine/rng')
      expect(src, `${p} must not touch the world`).not.toContain('engine/world')
    }
    // What they DO import from the engine is a constant and a type – the tier ladder, so a new rung
    // is a shelf the day it is added, and `TierId`, which is a compile-time name.
    expect(read(ARRIVAL)).toContain("import { TIER_LADDER } from '../engine/season/calendar'")
    expect(read(RESOLVER)).toContain("import type { TierId } from '../engine/season/types'")
  })

  it('the flight is the shell\'s, because it crosses from a takeover to the bar', () => {
    const app = read(SHELL)
    expect(app).toContain('class="trophy-flight"')
    expect(app).toContain("import { trophyDotShows, trophyPieces, useTrophyFlight } from './composables/trophyArrival'")
    // Over the bar (40) and over the takeover it is leaving (55), under anything modal (60).
    const rule = /\.trophy-flight\s*\{([^}]*)\}/.exec(read(SHEET))?.[1] ?? ''
    expect(rule).toContain('position: fixed')
    expect(rule).toMatch(/z-index:\s*56/)
    expect(rule).toContain('pointer-events: none')
    expect(read(SHEET)).toMatch(/\.tournament-flow\s*\{[^}]*z-index:\s*55/)
    expect(read(SHEET)).toMatch(/\.dialog-overlay\s*\{[^}]*z-index:\s*60/)
  })
})

// =================================================================================================
describe('the copy rules hold on the markup this slice wrote', () => {
  it('the shell\'s template carries no Cyrillic and no long dash', () => {
    const template = templateOf(read(SHELL))
    expect(template).not.toMatch(/[Ѐ-ӿ]/)
    expect(template).not.toContain('—')
  })

  it('⚠ AND THE FINALE\'S NEW MARKUP DOES NOT EITHER, which is narrower than it looks', () => {
    // TournamentFlow's template has quoted the owner in Russian since long before this slice (82
    // runs of it, in comments that explain why five screens are shaped the way they are), so the
    // whole-template assertion the cabinet carries would fail here on code this branch did not
    // write and must not churn. It is a real finding and it is reported as one; what is pinned here
    // is the markup this slice IS responsible for – the two poster marks and the block above each.
    const template = templateOf(read(FLOW))
    const marks = [...template.matchAll(/<img\b[^>]*class="tf-poster-mark"[^>]*\/>/g)]
    expect(marks).toHaveLength(2)
    for (const m of marks) {
      // From the nearest comment opener above the tag through the tag itself – i.e. exactly the
      // block this slice wrote, and none of the file's older prose. Matching the comment with a
      // regex instead would backtrack across `-->` and swallow the whole template.
      const at = m.index ?? 0
      const block = template.slice(template.lastIndexOf('<!--', at), at + m[0].length)
      expect(block).not.toMatch(/[Ѐ-ӿ]/)
      expect(block).not.toContain('—')
    }
    // ...and the player-facing words on the two posters are unchanged and still short-dashed.
    expect(template).toContain(`{{ pending.kidChampion ? 'Champion' : 'Runner-up' }}`)
  })
})

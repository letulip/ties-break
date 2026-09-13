// ⭐ ROUND 41 #7 – THE COACH'S PORTRAIT JOINS THE PRE-MATCH PREDICTION TILE.
//
// The owner: «на экране перед матчем если тренер есть давай может вот на этой нижней плитке со
// словами коуча (Coach prediction Three wins for the title. B. Bakker) поставим ее картинку тоже
// слева как на главной на тайле стоит?» (quoted here rather than in the template –
// tests/round13-nav.test.ts bans Cyrillic inside one).
//
// ⚠ THIS FILE HOLDS THE TWO NEW CLAIMS. The card's existing behaviour (the coach's line, his
// signature, the travel-presence line, the phone-fit budget) is already held by
// tests/component/round21-coach-travel.test.ts §2/§3 – re-run against this item's restructuring and
// still green (27 tests), which is the phone-fit evidence this item owes: `atTournament(..., true)`
// there already fixtures a hired coach, so §3's measurement already includes the portrait.
//
// ⚠ MUTATION-VERIFIED (recorded in the round-41 ledger and the executor's report):
//   * `v-if="coachPhoto"` changed to always render – the self-coached arm goes red (a portrait with
//     nobody behind it).
//   * `coachPortraitUrl(currentCoach.value.id)` changed to read `.name` instead of `.id` – the URL
//     arm goes red.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import TournamentFlow from '../../src/components/TournamentFlow.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot, enterEvent, decideKnock, pendingKnock } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { coachPortraitUrl } from '../../src/art/preload'
import { DEFAULT_PROFILE, type CoachTier, type Snapshot } from '../../src/shared/protocol'

/** A REAL career ticked to a REAL pending tournament – round21-coach-travel.test.ts's own
 *  `atTournament` recipe, parameterised on the coach tier instead of the travel stance (this item
 *  does not care whether he travels, only whether he exists). */
function atTournament(seed: string, coachTier: CoachTier): Snapshot {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier })
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 80; i++) {
    world.fundsCents = Math.max(world.fundsCents, 500_000_00)
    if (pendingKnock(world)) decideKnock(world, 'rest')
    for (const e of world.season) {
      if (e.week > world.week && !world.entries.includes(e.id)) {
        try {
          enterEvent(world, e.id)
        } catch {
          /* eligibility and caps are the engine's business */
        }
      }
    }
    tickWeek(world, rng)
    if (world.pendingTournament) return toSnapshot(world)
  }
  throw new Error('no tournament reached – the fixture is broken, not the assertion')
}

function mountFlow(snapshot: Snapshot) {
  useGameStore().snapshot = snapshot
  return mount(TournamentFlow, { attachTo: document.body })
}

describe('round 41 #7 – the coach portrait, on the splash', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐ a hired coach: the portrait is on the tile, resolved through coachPortraitUrl', () => {
    const snap = atTournament('r41-coach-portrait-on', 'middle')
    const current = snap.coachMarket.find((c) => c.current)
    expect(current, 'the fixture really has a hired coach').toBeTruthy()

    const w = mountFlow(snap)
    const art = w.find('.tf-brief-art')
    expect(art.exists(), 'the portrait strip is on the card').toBe(true)
    const img = art.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src'), "resolved off the engine's own coach id, not a literal").toBe(
      coachPortraitUrl(current!.id),
    )
    // Decorative, exactly as Home's own `.coach-art img` is – the words beside it already say who
    // he is (the signature), so a screen reader gets nothing doubled.
    expect(img.attributes('alt')).toBe('')
    w.unmount()
  })

  it('⚠ self-coached: «если тренер есть» – no coach, no picture, and the body keeps its old place', () => {
    const snap = atTournament('r41-coach-portrait-off', 'self')
    expect(snap.coachId, 'the fixture really is self-coached').toBeNull()

    const w = mountFlow(snap)
    expect(w.find('.tf-brief-art').exists(), 'nobody to picture').toBe(false)
    // The body reads flush left, exactly as the card did before this item – the clearance rule is a
    // sibling selector (`.tf-brief-art + .tf-brief-body`) that cannot fire without the portrait.
    // ⚠ happy-dom reads a genuinely unset longhand back as `''`, not the initial `0px` a browser
    // would report (the same idiom vacation-crop.test.ts uses for `.recap-art`'s unset phone width).
    const bodyMargin = getComputedStyle(w.find('.tf-brief-body').element).marginLeft
    expect(bodyMargin === '' || bodyMargin === '0px', `read back as '${bodyMargin}'`).toBe(true)
    w.unmount()
  })

  it('the coach prediction and his signature are unmoved by the restructuring', () => {
    // ⚠ A REGRESSION NET FOR THE TEMPLATE SURGERY THIS ITEM DID: `.tf-brief-said`/`.tf-brief-go` moved
    // one level deeper (into the new `.tf-brief-body`), so this confirms the existing content is
    // still findable and still says something, without re-asserting round21-coach-travel.test.ts's
    // own detailed claims about its wording.
    const snap = atTournament('r41-coach-portrait-content', 'middle')
    const w = mountFlow(snap)
    expect(w.find('.tf-brief-line').text().length, 'the coach still has something to say').toBeGreaterThan(0)
    expect(w.find('.tf-brief-sign').exists(), 'and he still signs it').toBe(true)
    expect(w.findAll('button').find((b) => b.text().trim() === 'Begin')?.exists()).toBe(true)
    w.unmount()
  })
})

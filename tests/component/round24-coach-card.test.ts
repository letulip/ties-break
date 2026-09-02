// =================================================================================================
// ⭐⭐ ROUND 24 #1 – THE COACH CARD, WHICH IS THE ONE HE ACTUALLY LOOKS AT
// ⚠⚠ RE-AIMED BY ROUND 34 #2a – AND THE ITEM IT PINNED WAS REVERSED BY THE OWNER. READ BOTH.
// =================================================================================================
//
// THE HISTORY, because this file is the only place it is written down and the next reader needs it:
//
// Round 23 #1 asked for a plain reading of her level: «Давай как-то по-другому оформим подсказки про
// уровень девушки на карточке тренера… что-то вроде "она близка к своему потолку"». It was built –
// and it landed on the Coach MARKET screen, a page he opens rarely. Round 24's verdict was one line
// and it was exact:
//
//     «Слова для тренеров о потолке девочки ты предложил, но в интерфейсе не поменял»
//
// ⚠ HE WAS RIGHT THEN, AND THE MISS IS STILL WORTH NAMING. `CoachMarketScreen`'s note sits ABOVE the
// coach list – it is a screen-level line, not a card. The thing called `coach-card` in this app is on
// HOME, and its line was `COACH_QUOTES[playStyle][week/4 % 5]`: five canned lines per play style,
// rotating every four weeks, which know NOTHING about the girl. So round 24 put the band on Home too,
// and this file pinned it there.
//
// ⚠⚠ ROUND 34 #2a SENT IT BACK, AND THAT IS WHY EVERY ASSERTION BELOW POINTS THE OTHER WAY NOW. The
// owner played the shipped result and read the verdict on a fourteen-year-old:
//
//     «Тренер на главном экране (почему-то, давай на карточку тренера вернём лучше) написал 14 летней
//      девочке Close to her ceiling … звучит как приговор … не рановато ли?»
//
// So the read renders in ONE place again – the coach card on the Coach Market screen – and Home keeps
// the coach's VOICE and nothing else. ⚠ THE TESTS WERE NOT DELETED AND NOTHING WAS LOOSENED: each one
// became the mirror of what it was. "The band is on the coach card, which is the whole item" is still
// the claim; what moved is WHICH card, so this file now asserts the absence on Home and the presence
// on the market in the same breath. An assertion that only said "not on Home" would pass just as
// loudly on a deleted feature, which is the failure this pair exists to make impossible.
//
// ⚠ The BAND EDGES moved in the same wave (round 34 #2b, `coachRoomBandIndex`) and for the other half
// of the same complaint. That is pinned in tests/round23-coach-copy.test.ts and tests/coachTiers.ts;
// nothing here depends on which band a given share falls in, only on there being one.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import '../../src/style.css'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { startingSkills } from '../../src/engine/world/player'
import { SKILL_KEYS } from '../../src/engine/development'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'

// ⚠ THIS RUNNER HAS NO localStorage AND `HomeScreen` READS IT. The same shim `home-strip-and-mail`
// and `round20-ui` carry, and for the reason quoted there in full: happy-dom is configured here
// without web storage, every reader in `src/` wraps it in try/catch and answers "claim nothing" when
// it throws, so the correct production fallback would make this screen untestable by accident. The
// runner gets an object; the code is not weakened to suit it.
const backing = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => (backing.has(k) ? backing.get(k)! : null),
    setItem: (k: string, v: string) => void backing.set(k, String(v)),
    removeItem: (k: string) => void backing.delete(k),
    clear: () => backing.clear(),
    key: (i: number) => [...backing.keys()][i] ?? null,
    get length() {
      return backing.size
    },
  },
})

/** Her realised share is the only thing that moves – the same lever `round23-coach-card` uses.
 *
 *  ⚠ RE-CUT FOR ROUND 34 #2b. It used to set a flat ceiling of 60 and `60 * realised` under it,
 *  which was the share the OLD measure read (`mean(skills) / mean(potential)`). The band now reads
 *  the share of the room she was BORN with that she has actually taken, so the level is placed
 *  against her birth build: `born + realised * (potential - born)` makes `realised` exactly what the
 *  engine will compute, on any seed, with no arithmetic left in the reader's head. */
function snapshotAt(realised: number): Snapshot {
  const world = createWorld(`r24-card-${realised}`, { ...DEFAULT_PROFILE, coachTier: 'middle' })
  const born = startingSkills(world.seed, world.profile)
  for (const k of SKILL_KEYS) {
    world.potential[k] = born[k] + 20
    world.skills[k] = born[k] + 20 * realised
  }
  return toSnapshot(world)
}

/** Home, with a real snapshot behind it. Reads the two things the coach card can say about her. */
function homeCoachCard(realised: number): { band: string; quote: string; card: string } {
  const store = useGameStore()
  store.snapshot = snapshotAt(realised)
  const wrapper = mount(HomeScreen, { global: { stubs: { teleport: true } } })
  const out = {
    band: wrapper.find('.coach-room').exists() ? wrapper.get('.coach-room').text() : '',
    quote: wrapper.find('.coach-line').exists() ? wrapper.get('.coach-line').text() : '',
    card: wrapper.find('.coach-card').exists() ? wrapper.get('.coach-card').text() : '',
  }
  wrapper.unmount()
  return out
}

/** Screen T, on the Coaches tab – the card he asked for it to go back to. */
async function marketCoachCard(realised: number): Promise<{ band: string; line: string }> {
  const store = useGameStore()
  store.snapshot = snapshotAt(realised)
  const wrapper = mount(CoachMarketScreen, { global: { stubs: { teleport: true } } })
  const pill = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Coaches')
  await pill!.trigger('click')
  await nextTick()
  const out = {
    band: wrapper.find('.cm-room-band').exists() ? wrapper.get('.cm-room-band').text() : '',
    line: wrapper.find('.cm-room-note').exists() ? wrapper.get('.cm-room-note').text() : '',
  }
  wrapper.unmount()
  return out
}

describe('round 34 #2a – the ceiling read is on the coach card, and not on Home', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐ THE ITEM: Home does not render it, and the coach card does – both halves, one test', async () => {
    // ⚠ ONE WRAPPER AT A TIME. There is one Pinia store per test, so assigning a second snapshot
    // re-renders the first wrapper too – `round23-coach-card` records that trap catching it live,
    // with both arms answering "At her ceiling". Each helper reads while mounted, then unmounts.
    const home = homeCoachCard(0.8)
    const market = await marketCoachCard(0.8)
    expect(home.band, 'the read is back on Home').toBe('')
    // ⚠ NON-VACUITY, AND IT IS THE HALF THAT MAKES THE LINE ABOVE MEAN ANYTHING. Deleting the feature
    // outright would satisfy "not on Home" perfectly; it must be somewhere, and this is where he
    // asked for it.
    expect(market.band, 'the read is nowhere at all – it was deleted, not moved').not.toBe('')
    expect(market.line.length, 'and the argument under the label came with it').toBeGreaterThan(20)
  })

  it('⭐ at every headroom, not just the one – the card he saw at fourteen is quiet now', () => {
    // He met it on a fourteen-year-old, which under the old measure was already band 2. Swept, so a
    // `v-if` that merely hid the low end would not pass.
    for (const realised of [0, 0.2, 0.45, 0.8, 0.95, 1]) {
      const { band, card } = homeCoachCard(realised)
      expect(band, `the read is back on Home at realised ${realised}`).toBe('')
      // ...and it did not come back under another class name. None of the four shipped labels may
      // appear anywhere in the card's text.
      for (const label of ['Huge potential', 'Still room to grow', 'Close to her ceiling', 'At her ceiling']) {
        expect(card, `"${label}" is on Home's coach card at realised ${realised}`).not.toContain(label)
      }
    }
  })

  it("⚠ and his COACH'S VOICE is untouched – the quote is owner-approved copy, and it was never the complaint", () => {
    // Round 7 #5d. Removing the band must not take the line it sat under with it, and nothing may be
    // invented to fill the gap: `HomeScreen` derives no copy of its own (invariant 4).
    const { quote, card } = homeCoachCard(0.85)
    expect(quote, 'the round-7 quote has gone missing').not.toBe('')
    expect(card, 'the coach card itself has gone missing').toContain(quote)
  })

  it('⚠ NO FIGURE where the read now lives, at any headroom – the fog of war is the standing ruling', async () => {
    // `KidScreen` keeps her ceiling behind a fog and the market note is written to that rule. The
    // read moved screens; the rule did not move with it.
    for (const realised of [0.1, 0.5, 0.8, 0.92, 1]) {
      const { band, line } = await marketCoachCard(realised)
      // ⚠ NON-VACUITY FIRST. An absent line has no digit in it either, so without this the arm passes
      // loudest exactly when the feature is gone.
      expect(band, `no band at all at realised ${realised}`).not.toBe('')
      expect(line, `a number leaked at realised ${realised}: "${line}"`).not.toMatch(/\d/)
      expect(line).not.toContain('%')
    }
  })

  it('⚠ and it fits the card it sits on – measured, not assumed', async () => {
    // The band is one clause and stays one clause wherever it renders. `.cm-room-note` is a hint
    // paragraph on a 375px phone, and a label that grew into a sentence is exactly how a short line
    // stops being short – the failure mode CLAUDE.md's dialog rule was written for.
    for (const realised of [0.1, 0.95]) {
      const { band } = await marketCoachCard(realised)
      expect(band, `no band at all at realised ${realised}`).not.toBe('')
      expect(band.length, `the band is too long for a 375px card: "${band}"`).toBeLessThanOrEqual(34)
      expect(band, 'the band should be a clause, not a sentence').not.toMatch(/[.!?]$/)
    }
  })
})

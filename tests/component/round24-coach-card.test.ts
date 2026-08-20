// =================================================================================================
// ⭐⭐ ROUND 24 #1 – THE COACH CARD, WHICH IS THE ONE HE ACTUALLY LOOKS AT
// =================================================================================================
//
// Round 23 #1 asked for this: «Давай как-то по-другому оформим подсказки про уровень девушки на
// карточке тренера… что-то вроде "она близка к своему потолку"». It was built – and it landed on the
// Coach MARKET screen, a page he opens rarely. His verdict was one line and it was exact:
//
//     «Слова для тренеров о потолке девочки ты предложил, но в интерфейсе не поменял»
//
// ⚠ HE WAS RIGHT, AND THE MISS IS WORTH NAMING. `CoachMarketScreen`'s note sits ABOVE the coach list
// (line 794 against the `v-for` at 837) – it is a screen-level line, not a card. The thing called
// `coach-card` in this app is on HOME, and its line was `COACH_QUOTES[playStyle][week/4 % 5]`: five
// canned lines per play style, rotating every four weeks, which know NOTHING about the girl. So the
// screen he sees every week said nothing about her level, and the screen that did was elsewhere.
//
// ⚠ THE QUOTE IS NOT REPLACED. It is owner-approved copy (round 7 #5d) and it is his coach's voice;
// the band is a second, quieter line beneath it. This file pins both halves.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
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

/** Her realised share is the only thing that moves – the same lever `round23-coach-card` uses. */
function snapshotAt(realised: number): Snapshot {
  const world = createWorld(`r24-card-${realised}`, { ...DEFAULT_PROFILE, coachTier: 'middle' })
  for (const k of SKILL_KEYS) {
    world.potential[k] = 60
    world.skills[k] = 60 * realised
  }
  return toSnapshot(world)
}

/** ⚠ ONE WRAPPER AT A TIME. There is one Pinia store per test, so assigning a second snapshot
 *  re-renders the first wrapper too – `round23-coach-card` records that trap catching it live, with
 *  both arms answering "At her ceiling". Read the string while mounted, then unmount. */
async function bandAt(realised: number): Promise<{ band: string; quote: string }> {
  const store = useGameStore()
  store.snapshot = snapshotAt(realised)
  const wrapper = mount(HomeScreen, { global: { stubs: { teleport: true } } })
  const band = wrapper.find('.coach-room').exists() ? wrapper.get('.coach-room').text() : ''
  const quote = wrapper.find('.coach-line').exists() ? wrapper.get('.coach-line').text() : ''
  wrapper.unmount()
  return { band, quote }
}

describe('round 24 #1 – the coach card on HOME says where she stands', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐ the band is ON THE COACH CARD, which is the whole item', async () => {
    const early = await bandAt(0.7)
    expect(early.band, 'the coach card still says nothing about her level').not.toBe('')
  })

  it('⭐ two different headrooms read differently – the complaint, answered', async () => {
    const early = await bandAt(0.7)
    const late = await bandAt(0.99)
    expect(early.band).not.toBe('')
    expect(late.band).not.toBe('')
    expect(late.band, `early "${early.band}" vs late "${late.band}"`).not.toBe(early.band)
  })

  it("⚠ and his COACH'S VOICE is untouched beside it – the quote is owner-approved copy", async () => {
    const { band, quote } = await bandAt(0.85)
    expect(band, 'no band at all – this arm would pass on a deleted feature').not.toBe('')
    expect(quote, 'the round-7 quote has gone missing').not.toBe('')
    expect(band, 'the band replaced the quote instead of joining it').not.toBe(quote)
  })

  it('⚠ NO FIGURE, at any headroom – the fog of war is the standing ruling', async () => {
    // `KidScreen` keeps her ceiling behind a fog and the market note is written to that rule
    // (CoachMarketScreen :757). A digit here would leak it on the screen he sees most.
    for (const realised of [0.6, 0.75, 0.85, 0.92, 0.97, 1]) {
      const { band } = await bandAt(realised)
      // ⚠ NON-VACUITY FIRST. An absent line has no digit in it either, so without this the arm passes
      // loudest exactly when the feature is gone – caught by mutation on its first run.
      expect(band, `no band at all at realised ${realised}`).not.toBe('')
      expect(band, `a number leaked at realised ${realised}: "${band}"`).not.toMatch(/\d/)
    }
  })

  it('⚠ and it fits the card it sits on – measured, not assumed', async () => {
    // `.coach-card` is `card-short` with a portrait beside the text. A second line is exactly how a
    // short card stops being short, one honest sentence at a time – the failure mode CLAUDE.md's
    // dialog rule was written for. The band is one clause and is capped here.
    for (const realised of [0.6, 0.99]) {
      const { band } = await bandAt(realised)
      // ⚠ NON-VACUITY, same reason as the arm above: an empty string fits any card.
      expect(band, `no band at all at realised ${realised}`).not.toBe('')
      expect(band.length, `the band is too long for a 375px card: "${band}"`).toBeLessThanOrEqual(34)
      expect(band, 'the band should be a clause, not a sentence').not.toMatch(/[.!?]$/)
    }
  })
})

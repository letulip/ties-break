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
//
// ⚠⚠ AND ROUND 39 #2b (REOPENED 08.09) PART-REVERSED ROUND 34, BY THE OWNER'S OWN WORD – «И до этого
// были фразочки про то, что ей недалеко до потолка, что потолок достигнут и прочее, вот это тоже
// всё-таки можно показывать буквально в 3-5 слов на home». So the Home arms below re-aimed a second
// time, narrower rather than looser: the round-24 PLATE (label + argument, `.coach-room`) stays off
// Home and the market card keeps the full sentence – that half of round 34 stands – while Home's r39
// plate (`.coach-room-short`) carries the 3-5 word SHORT of the same band row. What was «absent on
// Home» is now «only ever the short, of exactly the band the market names» – both halves still in
// one breath, so a deleted feature still cannot pass.
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
import { ROOM_NOTE_SEP, coachRoomBand, coachRoomBandLabel, coachRoomBandOf, coachRoomBandShort, coachRoomNote } from '../../src/engine/world/coachMarket'
import { reachableHeadroomShare, SKILL_KEYS } from '../../src/engine/development'
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
 *  engine will compute, on any seed, with no arithmetic left in the reader's head.
 *
 *  ⚠⚠ RE-AIMED AGAIN BY ROUND 34 BUNDLE H, AND THE ARGUMENT NOW MEANS THE SHARE SHE IS SHOWN – the
 *  same move `round23-coach-card` made, for the same reason. The read is normalised against what is
 *  REACHABLE (`reachableHeadroomShare`) rather than against `potential`, which `growWeek` approaches
 *  geometrically and never arrives at, so an argument of 0.95 has to keep meaning "nearly everything
 *  she was ever going to have" and not "a number the screen reads as 0.82".
 *
 *  ⚠ BUNDLE I THEN CORRECTED WHAT «REACHABLE» MEANS – the best coaching money can buy (0.9766), not
 *  the bare `ageFactor` curve H walked (0.8668). ⭐ THIS HELPER DID NOT HAVE TO MOVE FOR IT: derived,
 *  so the approved curve wave and a coach-ladder retune both move it with the code. */
function worldAtShown(shown: number) {
  const world = createWorld(`r24-card-${shown}`, { ...DEFAULT_PROFILE, coachTier: 'middle' })
  const born = startingSkills(world.seed, world.profile)
  for (const k of SKILL_KEYS) {
    world.potential[k] = born[k] + 20
    world.skills[k] = born[k] + 20 * shown * reachableHeadroomShare()
  }
  return world
}

function snapshotAt(shown: number): Snapshot {
  return toSnapshot(worldAtShown(shown))
}

/** Home, with a real snapshot behind it. Reads the things the coach card can say about her.
 *  ⚠ `short` JOINED ON THE #2b REOPEN (08.09): the 3-5 word band read the owner asked back onto
 *  Home (`.coach-room-short`); `band` still reads the RETIRED round-24 selector (`.coach-room`),
 *  which stays empty – the old plate itself did not come back, only the short did. */
function homeCoachCard(realised: number): { band: string; short: string; quote: string; card: string } {
  const store = useGameStore()
  store.snapshot = snapshotAt(realised)
  const wrapper = mount(HomeScreen, { global: { stubs: { teleport: true } } })
  const out = {
    band: wrapper.find('.coach-room').exists() ? wrapper.get('.coach-room').text() : '',
    short: wrapper.find('.coach-room-short').exists() ? wrapper.get('.coach-room-short').text() : '',
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

describe('round 34 #2a – the long ceiling read is on the coach card; Home carries only the 3-5 word short', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐ THE ITEM: the round-24 plate stays retired, the coach card keeps the sentence – and the short is back by his word', async () => {
    // ⚠ ONE WRAPPER AT A TIME. There is one Pinia store per test, so assigning a second snapshot
    // re-renders the first wrapper too – `round23-coach-card` records that trap catching it live,
    // with both arms answering "At her ceiling". Each helper reads while mounted, then unmounts.
    // ⚠⚠ RE-AIMED BY ROUND 39 #2b (REOPENED 08.09). The owner reversed the growing half of round 34
    // himself: «И до этого были фразочки про то, что ей недалеко до потолка, что потолок достигнут
    // и прочее, вот это тоже всё-таки можно показывать буквально в 3-5 слов на home». So what this
    // arm now holds: the OLD plate (`.coach-room`, label + argument) is still gone from Home, the
    // market card still carries the full sentence, and Home's r39 plate says the SHORT of the very
    // same band row – two surfaces, one derivation, pinned against each other below.
    const home = homeCoachCard(0.8)
    const market = await marketCoachCard(0.8)
    expect(home.band, 'the round-24 plate itself is back on Home').toBe('')
    expect(home.short, 'the 3-5 word short the owner asked back is not rendered').toBe(coachRoomBandShort(coachRoomBandOf(worldAtShown(0.8))!))
    // ⚠ NON-VACUITY, AND IT IS THE HALF THAT MAKES THE LINE ABOVE MEAN ANYTHING. Deleting the feature
    // outright would satisfy "not on Home" perfectly; it must be somewhere, and this is where he
    // asked for it.
    expect(market.band, 'the read is nowhere at all – it was deleted, not moved').not.toBe('')
    expect(market.line.length, 'and the argument under the label came with it').toBeGreaterThan(20)
    // ...and the two surfaces sit on the same rung: the market's bold label and Home's short are
    // the same `ROOM_BANDS` row, which is the "cannot disagree" half of the reopen.
    expect(market.band).toBe(coachRoomBandLabel(coachRoomBandOf(worldAtShown(0.8))!))
  })

  it('⭐ at every headroom: Home says the band SHORT of that band, and never the argument sentence', () => {
    // ⚠ RE-AIMED BY ROUND 39 #2b (REOPENED 08.09): wave A of round 34 swept the four labels off
    // Home's card entirely; the owner brought them back as 3-5 word shorts, so the sweep now pins
    // the two things still forbidden – the LONG argument («много текста» is what he sent away) and
    // any short that is not the row the engine read. Because `realised` is the lever, this sweep is
    // also the mounted "mutate the band → the plate moves with it" evidence: six realisations, four
    // rows, the plate following the band index each time.
    for (const realised of [0, 0.2, 0.45, 0.8, 0.95, 1]) {
      const { short, card } = homeCoachCard(realised)
      const world = worldAtShown(realised)
      const band = coachRoomBandOf(world)!
      expect(short, `the plate is not band ${band}'s short at realised ${realised}`).toBe(coachRoomBandShort(band))
      // the long note's ARGUMENT (everything after the separator) may not reach Home in any band –
      // cut with the ONE splitter (`coachRoomBand`), never a raw indexOf: an absent separator makes
      // the label '' below and the length guard fail loudly, instead of the slice widening.
      const note = coachRoomNote(world)
      const label = coachRoomBand(note)
      expect(label, `no separator in the note at realised ${realised} – the cut would be wrong`).not.toBe('')
      const argument = note.slice(label.length + ROOM_NOTE_SEP.length)
      expect(argument.length, `no argument derived at realised ${realised} – the check would be vacuous`).toBeGreaterThan(20)
      expect(card, `the market's argument sentence is on Home at realised ${realised}`).not.toContain(argument)
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

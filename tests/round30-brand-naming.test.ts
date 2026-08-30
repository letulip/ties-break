// ⭐⭐⭐ ROUND 30 #8 AND #10 – THE FAMILY NAMES WHAT IT BUILDS.
//
// #8: «Merch brand давай предложим пользователю несколько вариантов именования при покупке… один из
// вариантов "ввести своё название" – это придаст +100 к индивидуальности сразу. Среди вариантов по
// дефолту могут быть инициалы ребёнка или что-то связанное с именем или фамилией.»
// #10: «И нейминг для академии тоже по принципу бренда, как раз одним из вариантов можно предложить
// уже существующее название бренда (если он есть) или снова "ввести своё".»
//
// ⚠⚠ THIS FILE IS THE ENGINE HALF. The suggestions, the four rules for player-authored text, and
// what a purchase does with a name are all decided in `world/assets.ts` and `buyAsset`, and they are
// asserted here on real worlds. The RENDERING half – the chips, the field, and that a 24-character
// name cannot break a 375px card – is `tests/component/round30-brand-naming-screen.test.ts`, because
// an engine arm cannot see a screen (round 30 #14's own lesson, in its own file's header).
//
// ⚠ WHAT THIS FILE HOLDS:
//   §1  the suggestions are made out of HER – initials, surname, both – and never generic;
//   §2  the academy offers the BRAND's name first when there is one (his own #10);
//   §3  ⭐⭐ the four rules: the cap, the allow-list, the empty entry, the whitespace;
//   §4  the purchase names the FIRST rung of a family and nothing else can rename it;
//   §5  a name that never came through a command is re-bounded on the way out;
//   §6  the v66 back-fill: a save that already owns a brand is not left nameless.
//
// ⚠ MUTATION-VERIFIED – the measured log is at the foot of this file.
import { describe, it, expect } from 'vitest'
import {
  ASSET_NAME_MAX_CHARS,
  assetNameOf,
  assetNameSuggestions,
  buyAsset,
  closeTournament,
  createWorld,
  ownedAssets,
  sanitiseAssetName,
  shopView,
  skipTournament,
  tickWeek,
  type WorldState,
} from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { rngFromSeed } from '../src/engine/rng'

function shopper(seed: string, kidName = 'Vera', kidLastName = 'Martin'): WorldState {
  const world = createWorld(seed)
  world.bestFinishByTier.wta250 = 3
  world.profile = { ...world.profile, kidName, kidLastName }
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 8; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  world.fundsCents = 30_000_000_00
  return world
}

const rowOf = (w: WorldState, id: string) => shopView(w).rows.find((r) => r.id === id)!

describe('round 30 #8 §1 – the suggestions are made out of her', () => {
  it('⭐⭐ her initials, her surname and her whole name – and every one of them contains her', () => {
    const w = shopper('r30-8-suggest')
    const options = assetNameSuggestions(w, 'business')
    expect(options.length, 'a handful, not one').toBeGreaterThanOrEqual(3)
    expect(options).toContain('VM')
    expect(options).toContain('Martin')
    expect(options).toContain('Vera Martin')
    // ⭐⭐ THE CLAIM «+100 К ИНДИВИДУАЛЬНОСТИ» MADE MECHANICAL: not one suggestion is generic. Every
    // single option carries her first name, her surname or her initials – so the list a player sees
    // is a list about HIS daughter and could not be the list any other career sees.
    for (const option of options) {
      expect(
        option.includes('Martin') || option.includes('Vera') || option.includes('VM'),
        `${option} is about her`,
      ).toBe(true)
    }
    // ...and a different girl gets a different list, which is the discriminating half.
    const other = assetNameSuggestions(shopper('r30-8-other', 'Nina', 'Okafor'), 'business')
    expect(other).toContain('NO')
    expect(other).toContain('Okafor')
    expect(other.some((o) => o.includes('Martin')), 'nothing of the other family leaks in').toBe(false)
  })

  it('⚠ ...and the list is never empty, even for a world with no name at all', () => {
    // Not reachable through onboarding – `kidName` is required and the save guard bounds it – but a
    // hand-built probe world is, and a `nameOptions[0]` of `undefined` is how a null reaches a
    // template. The last-resort entry is what makes «the first suggestion is the default» total.
    const w = shopper('r30-8-nameless', '', '')
    expect(assetNameSuggestions(w, 'business')).toEqual(['The Brand'])
    expect(assetNameSuggestions(w, 'academy')).toEqual(['The Academy'])
  })
})

describe('round 30 #10 §2 – the academy is offered the brand it already has', () => {
  it('⭐⭐⭐ the brand\'s own name comes FIRST when there is one, and the ladder of the rest is hers', () => {
    const w = shopper('r30-10-brand-first')
    // No brand yet: the list is entirely name-derived.
    expect(assetNameSuggestions(w, 'academy')[0]).toBe('Martin Academy')
    expect(assetNameSuggestions(w, 'academy')).toContain('Vera Martin Academy')

    buyAsset(w, 'merch-brand', undefined, 'Harefield')
    expect(assetNameOf(w, 'business')).toBe('Harefield')
    // ⭐ HIS OWN #10: «одним из вариантов можно предложить уже существующее название бренда».
    const withBrand = assetNameSuggestions(w, 'academy')
    expect(withBrand[0], 'the brand they already built, first').toBe('Harefield')
    expect(withBrand, '...and the name-derived ones are still there').toContain('Martin Academy')
  })

  it('⚠ the list never shows the same chip twice', () => {
    // Reachable in normal play: a family that named its brand `Martin Academy` would otherwise see
    // that string twice in the academy's list, once as the brand and once as the generated option.
    const w = shopper('r30-10-dupe')
    buyAsset(w, 'merch-brand', undefined, 'Martin Academy')
    const options = assetNameSuggestions(w, 'academy')
    expect(new Set(options).size, 'every chip is distinct').toBe(options.length)
  })
})

describe('round 30 #8 §3 – ⭐⭐ the four rules for text a player typed', () => {
  it('⭐ RULE 1 – capped at 24 code points, and counted in code points rather than sliced', () => {
    expect(ASSET_NAME_MAX_CHARS).toBe(24)
    const long = 'A'.repeat(200)
    expect(sanitiseAssetName(long, 'x')).toHaveLength(ASSET_NAME_MAX_CHARS)
    // ⚠⚠ AND IT SURVIVES ASTRAL LETTERS. `'x'.slice(0, 24)` can cut a surrogate pair in half and
    // produce an unrenderable character; `[...str]` cannot. Gothic letters are `\p{L}` and astral,
    // which is exactly the pair of properties that makes this the discriminating input.
    const astral = '\u{10330}'.repeat(40)
    const cut = sanitiseAssetName(astral, 'x')
    expect([...cut]).toHaveLength(ASSET_NAME_MAX_CHARS)
    expect(cut.includes('�'), 'no replacement character, so no half a pair').toBe(false)
  })

  it('⭐ RULE 2 – an allow-list: letters, digits, the space, and & . \' -', () => {
    expect(sanitiseAssetName("Ben & Jerry's", 'x')).toBe("Ben & Jerry's")
    expect(sanitiseAssetName('S by Serena', 'x')).toBe('S by Serena')
    expect(sanitiseAssetName('TB-12', 'x')).toBe('TB-12')
    // ⚠ CYRILLIC IS ALLOWED, and deliberately: the house rule against it is about OUR copy in a
    // template, and a player typing in his own alphabet is data. `М` is a Cyrillic capital EM.
    expect(sanitiseAssetName('Мартин', 'x')).toBe('Мартин')
    // ...and everything that could reach a layout or a log is gone, by NOT being on the list.
    expect(sanitiseAssetName('<b>Martin</b>', 'x')).toBe('bMartinb')
    expect(sanitiseAssetName('Mar\u0000tin', 'x'), 'a control character').toBe('Martin')
    expect(sanitiseAssetName('Martin‮', 'x'), 'a bidi override').toBe('Martin')
    expect(sanitiseAssetName('Martin\n\tHouse', 'x'), 'newlines are whitespace, then collapsed').toBe('Martin House')
    expect(sanitiseAssetName('\u{1F600}\u{1F600}', 'fallback'), 'emoji are not letters').toBe('fallback')
  })

  it('⭐⭐ RULE 3 – an empty entry is the DEFAULT, never a refusal', () => {
    expect(sanitiseAssetName('', 'VM')).toBe('VM')
    expect(sanitiseAssetName('   ', 'VM')).toBe('VM')
    expect(sanitiseAssetName(undefined, 'VM')).toBe('VM')
    expect(sanitiseAssetName('\u{1F4A9}', 'VM'), 'nothing survives the allow-list').toBe('VM')
    // ⭐ AND THROUGH THE COMMAND: a player who clears the box and presses Buy gets a brand named
    // after his daughter. «мы ни за что не наказываем» applies to a text field too.
    const w = shopper('r30-8-empty')
    buyAsset(w, 'merch-brand', undefined, '   ')
    expect(assetNameOf(w, 'business')).toBe(assetNameSuggestions(w, 'business')[0])
    // ...and a command that carries no name at all is the same answer, not a crash.
    const w2 = shopper('r30-8-nocommand')
    buyAsset(w2, 'merch-brand')
    expect(assetNameOf(w2, 'business')).toBe('VM')
  })

  it('⭐ RULE 4 – whitespace is collapsed and trimmed', () => {
    expect(sanitiseAssetName('  V   M  ', 'x')).toBe('V M')
    expect(sanitiseAssetName('Martin  House', 'x')).toBe('Martin House')
    // ⚠ AND THE CAP CANNOT LEAVE A TRAILING SPACE: 24 code points of `A A A ...` ends mid-gap.
    expect(sanitiseAssetName('A '.repeat(40), 'x').endsWith(' ')).toBe(false)
  })
})

describe('round 30 #8/#10 §4 – the purchase names the family, once', () => {
  it('⭐⭐⭐ the first rung of a family carries the name, and every later stage reads it', () => {
    const w = shopper('r30-8-first')
    buyAsset(w, 'academy-land', undefined, 'Harefield Academy')
    expect(assetNameOf(w, 'academy')).toBe('Harefield Academy')
    // ⚠ ONE COPY, ON ONE ROW. Four stages with four names would be four buildings.
    buyAsset(w, 'academy-courts', undefined, 'Something Else')
    buyAsset(w, 'academy-building', undefined, 'And Another')
    expect(assetNameOf(w, 'academy'), 'a later stage cannot rename the institution').toBe('Harefield Academy')
    expect(ownedAssets(w).filter((a) => a.name !== undefined), 'exactly one row is named').toHaveLength(1)
    // ⭐ AND THE VIEW SAYS THE SAME NAME ON EVERY STAGE, which is what the screen prints.
    for (const id of ['academy-land', 'academy-courts', 'academy-building', 'academy-staff']) {
      expect(rowOf(w, id).name, `${id} reads the institution's name`).toBe('Harefield Academy')
    }
  })

  it('⚠⚠ the picker is offered on exactly the rungs that would name something', () => {
    const w = shopper('r30-8-options')
    // Before anything is bought: both nameable families offer a list, and nothing else does.
    expect(rowOf(w, 'merch-brand').nameOptions.length).toBeGreaterThan(0)
    expect(rowOf(w, 'academy-land').nameOptions.length).toBeGreaterThan(0)
    for (const id of ['car-good', 'house-first', 'index-fund', 'yacht', 'plane']) {
      expect(rowOf(w, id).nameOptions, `${id} names nothing`).toEqual([])
      expect(rowOf(w, id).name, `${id} has no name to show`).toBeNull()
    }
    // ...and once the family owns one, the offer is gone from every rung of that family.
    buyAsset(w, 'academy-land', undefined, 'Harefield Academy')
    for (const id of ['academy-land', 'academy-courts', 'academy-building', 'academy-staff']) {
      expect(rowOf(w, id).nameOptions, `${id} no longer asks`).toEqual([])
    }
    expect(rowOf(w, 'merch-brand').nameOptions.length, 'the other family still asks').toBeGreaterThan(0)
  })

  it('⚠ nothing but the engine decides it – a name sent for a car is ignored', () => {
    // Invariant 1: a stale tab must not be able to name a saloon. `buyAsset` re-derives whether this
    // purchase names anything and drops what it did not ask for.
    const w = shopper('r30-8-ignored')
    buyAsset(w, 'car-good', undefined, 'The Batmobile')
    expect(ownedAssets(w)[0].name).toBeUndefined()
  })
})

describe('round 30 #8 §5 – a name that never came through a command', () => {
  it('⭐⭐ an imported save\'s name is re-bounded on the way OUT, so no screen sees an unbounded one', () => {
    // `buyAsset` bounds what the game stores, which covers every name a player of this game can
    // create. A FILE is the other case: `saveGuard`'s bounds walk caps a string at 32,768 characters,
    // which is four hundred times too loose to protect a layout.
    const w = shopper('r30-8-import')
    buyAsset(w, 'merch-brand', undefined, 'VM')
    ownedAssets(w)[0].name = 'Q'.repeat(5_000)
    expect(assetNameOf(w, 'business')).toHaveLength(ASSET_NAME_MAX_CHARS)
    expect(rowOf(w, 'merch-brand').name).toHaveLength(ASSET_NAME_MAX_CHARS)
    // ...and a name made entirely of characters the allow-list refuses reads as no name at all,
    // rather than as an empty string sitting in the middle of a sentence.
    ownedAssets(w)[0].name = '\u{1F600}\u{1F600}\u{1F600}'
    expect(assetNameOf(w, 'business')).toBeNull()
  })
})

describe('round 30 #8/#10 §6 – v66 does not leave an existing brand nameless', () => {
  it('⭐⭐ a v65 save that already owns a brand and an academy comes out with one name each', () => {
    const save = {
      schemaVersion: 65,
      seed: 'r30-8-migrate',
      week: 300,
      fundsCents: 1_000_00,
      careerId: 'c1',
      profile: { kidName: 'Nina', kidLastName: 'Okafor' },
      assets: [
        { id: 'merch-brand', boughtWeek: 100, paidCents: 250_000_00, valueCents: 250_000_00 },
        { id: 'academy-land', boughtWeek: 200, paidCents: 2_000_000_00, valueCents: 2_000_000_00 },
        { id: 'academy-courts', boughtWeek: 210, paidCents: 3_000_000_00, valueCents: 3_000_000_00 },
        { id: 'car-good', boughtWeek: 120, paidCents: 110_000_00, valueCents: 100_000_00 },
      ],
    } as unknown as Record<string, unknown>
    const out = migrateSave(save) as unknown as { assets: { id: string; name?: string }[] }
    const named = out.assets.filter((a) => a.name !== undefined)
    // ⭐ ONE PER FAMILY, and the car is not one of them.
    expect(named.map((a) => a.id)).toEqual(['merch-brand', 'academy-land'])
    // ⭐⭐ AND THE DEFAULT IS A NAME THE GAME ITSELF WOULD HAVE OFFERED – built from HER initials,
    // never a string the migration invented.
    expect(named[0].name).toBe('NO')
    // ⚠ ...and the academy is offered the brand FIRST, exactly as the live shop does it, which is
    // only true because the loop names the business before it asks about the academy.
    expect(named[1].name).toBe('NO')
  })

  it('⚠ a save that owns neither is untouched, and a name it already carries is kept', () => {
    const base = {
      schemaVersion: 65,
      seed: 's',
      week: 10,
      fundsCents: 0,
      careerId: 'c',
      profile: { kidName: 'Vera', kidLastName: 'Martin' },
      assets: [{ id: 'car-good', boughtWeek: 1, paidCents: 110_000_00, valueCents: 110_000_00 }],
    } as unknown as Record<string, unknown>
    const out = migrateSave(base) as unknown as { assets: { name?: string }[] }
    expect(out.assets[0].name).toBeUndefined()
  })
})

// =================================================================================================
// ⚠⚠ MUTATION LOG – each applied ALONE, reverted, and RUN against BOTH halves of the item (this
// file and tests/component/round30-brand-naming-screen.test.ts). Every line is a measured result.
//
//  N1  the picker's `v-if` forced false in the template  -> unit GREEN, component 5 RED. ⭐ That
//      split IS why the screen file exists: every engine arm here passes on a control nobody can
//      reach.
//  N2  the «Trading as» line's `v-if` forced false       -> unit GREEN, component 2 RED.
//  N3  `askBuy` sends `name: undefined`                  -> component 1 RED: «what is typed is what
//      is SENT», ALONE. The engine arms cannot see a screen that stops sending.
//  N4  `buyAsset` ignores the typed name and always takes the first suggestion
//                                                        -> 2 unit RED, 2 component RED.
//  N5  `wasNamed` dropped, so any rung of the family renames it
//                                                        -> 1 unit RED, ALONE: «the first rung of a
//      family carries the name, and every later stage reads it».
//  N6  the 24-code-point cap removed                     -> 2 unit RED (rule 1, and the imported
//      save's re-bound).
//  N7  the allow-list removed                            -> 3 unit RED (rule 2, rule 3's «nothing
//      survives», and the imported save's re-bound).
//  N8  the v66 back-fill's write deleted                 -> 1 unit RED, ALONE: §6.
//  N9  `overflow-wrap: anywhere` removed from the line   -> 1 component RED: the 375px arm, ALONE –
//      so the belt is a measured claim rather than a decoration.
//  N10 the back-fill names EVERY row of the family rather than the first
//                                                        -> 1 unit RED, ALONE: §6's «one per family».
// =================================================================================================

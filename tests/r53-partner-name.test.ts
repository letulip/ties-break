// ⭐ R53 №2 (21.10) – HIS NAME, AND THE WEEK THE PARENT HEARS IT. docs/specs/partner-name-disclosure-2026-10.md.
// The schema move (v95: `nameKnownWeek`), §3.1 (the name at the row's birth, on the v83 key), the four roads
// (her card, asking, insisting, her own later word, the papers) and the tile's fog read.
import { readFileSync } from 'node:fs'
import { describe, it, expect, vi } from 'vitest'
// The press road's standing gate, held open: the booth's licence is `newsStandingOf`'s, and a probe world at 20 has no rank.
const STANDING = vi.hoisted(() => ({ value: 'known' as 'quiet' | 'noticed' | 'known' }))
vi.mock('../src/engine/world/spotlight', async (orig) => ({ ...(await orig<typeof import('../src/engine/world/spotlight')>()), newsStandingOf: () => STANDING.value }))
import {
  answerLifeBeat,
  arrivalEligible,
  buildLifeBeatPrompt,
  createWorld,
  raiseLifeBeat,
  rollArrival,
  rollWedding,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
import { pickInt, rngFromSeed } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { migrateSave } from '../src/engine/migrations'
import { TIER_LADDER } from '../src/engine/season/calendar'
import { atOrAboveStageBar } from '../src/engine/world/spotlight'
import { pressNamesPartnerAt } from '../src/engine/world/lifeBeat/booth'
import {
  PARTNER_NAME,
  PARTNER_NAME_POOL,
  drawNameThisPeriod,
  learnPartnerName,
  nameAtMet,
  partnerNameFor,
  rollPartnerName,
} from '../src/engine/world/lifeBeat/partnerName'
import { renderCopy } from '../src/i18n'
import type { BondBand, LoveEpisode } from '../src/shared/protocol'
import { weekAtAge } from './helpers/career'

const BOND: Record<BondBand, number> = { close: 90, steady: 65, strained: 45, cold: 20 }

function episode(sinceWeek: number, knownWeek: number, more: Partial<LoveEpisode> = {}): LoveEpisode {
  const id = `p:${sinceWeek}`
  return { id, sinceWeek, endedWeek: null, knownWeek, wants: 'open', partnerId: id, publicWeek: null, publicWrong: false, airedMetWeek: null, airedEndedWeek: null, latchedWeek: null, partnerName: 'Matteo', nameKnownWeek: null, ...more }
}

/** A career at 20 with one dating row the parent learns of THIS week, its `'met'` card raised. */
function metCard(seed: string, band: BondBand): { world: WorldState; ep: LoveEpisode } {
  const world = createWorld(seed)
  world.season = []
  world.week = weekAtAge(world, 20)
  const ep = episode(world.week - 6, world.week)
  world.loveEpisodes = [ep]
  world.bond = BOND[band]
  raiseLifeBeat(world, 'met', ep.id)
  return { world, ep }
}

describe('§3.1 – the name exists from the row\'s birth, on the v83 key', () => {
  it('the name at creation is the name the engagement would have drawn (seeded careers)', () => {
    let born = 0
    for (let s = 0; s < 12; s++) {
      const seed = `r53-name-${s}`
      const world = createWorld(seed)
      world.season = []
      world.week = weekAtAge(world, ECONOMY.life.ageGate)
      for (let i = 0; i < 900 && (world.loveEpisodes ?? []).length === 0; i++, world.week++) {
        if (arrivalEligible(world)) rollArrival(world)
      }
      const row = (world.loveEpisodes ?? [])[0]
      if (row === undefined) continue
      born++
      // The key, spelt out: `seed:life:partner-name:<episodeId>` – unchanged since v83.
      const byKey = PARTNER_NAME_POOL[pickInt(rngFromSeed(`${seed}:life:partner-name:${row.id}`), 0, PARTNER_NAME_POOL.length - 1)]
      expect(row.partnerName, 'born with a name').toBe(byKey)
      expect(row.partnerName).toBe(partnerNameFor(seed, row.id))
      expect(row.nameKnownWeek, 'but nobody has told the parent').toBeNull()
      // ...and the engagement keeps it (`??=`), so the husband is the boyfriend.
      const before = row.partnerName
      learnPartnerName(world, row)
      expect(row.partnerName).toBe(before)
    }
    expect(born, 'enough rows born to mean something').toBeGreaterThanOrEqual(8)
  })

  it('an OLD row with no name gets the same one when a road reaches it', () => {
    const { world, ep } = metCard('r53-old', 'steady')
    ep.partnerName = null
    learnPartnerName(world, ep)
    expect(ep.partnerName).toBe(partnerNameFor('r53-old', ep.id))
    expect(ep.nameKnownWeek).toBe(world.week)
  })

  it('the engagement always names him', () => {
    const world = createWorld('r53-eng')
    world.season = []
    world.week = weekAtAge(world, ECONOMY.wedding.ageGate) + 10
    const ep = episode(world.week - ECONOMY.wedding.minEpisodeWeeks - 5, world.week - ECONOMY.wedding.minEpisodeWeeks)
    world.loveEpisodes = [ep]
    for (let i = 0; i < 3000 && ep.nameKnownWeek === null; i++, world.week++) rollWedding(world)
    expect(ep.nameKnownWeek, 'the engagement week').not.toBeNull()
    expect(ep.partnerName).toBe('Matteo')
  })
})

describe('road 1 – the «there is someone» card, by band', () => {
  it('close: she names him in her own line, and is not asked it', () => {
    const { world, ep } = metCard('r53-close', 'close')
    nameAtMet(world)
    expect(ep.nameKnownWeek).toBe(world.week)
    const prompt = buildLifeBeatPrompt(world)!
    expect(prompt.said).toContain('Matteo')
    expect(renderCopy(prompt.saidC!), 'the ref renders the same English').toBe(prompt.said)
    expect(prompt.options.map((o) => o.id)).not.toContain('ask')
    expect(prompt.options.map((o) => o.id)).not.toContain('insist')
  })

  it('steady: no name on the card; «Ask what his name is» gets it, for free', () => {
    const { world, ep } = metCard('r53-steady', 'steady')
    nameAtMet(world)
    expect(ep.nameKnownWeek).toBeNull()
    const prompt = buildLifeBeatPrompt(world)!
    expect(prompt.said).not.toContain('Matteo')
    expect(prompt.options.map((o) => o.id)).toEqual(expect.arrayContaining(['ask', 'insist']))
    const reply = prompt.followUps.find((f) => f.optionId === 'ask')!
    expect(reply.said[0]).toContain('Matteo')
    expect(renderCopy(reply.saidC![0])).toBe(reply.said[0])
    const bond = world.bond
    answerLifeBeat(world, 'ask')
    expect(ep.nameKnownWeek).toBe(world.week)
    expect(world.bond).toBe(bond)
  })

  for (const band of ['strained', 'cold'] as const) {
    it(`${band}: the question gets «later», and no name`, () => {
      const { world, ep } = metCard(`r53-${band}`, band)
      const reply = buildLifeBeatPrompt(world)!.followUps.find((f) => f.optionId === 'ask')!
      expect(reply.said[0]).not.toContain('Matteo')
      answerLifeBeat(world, 'ask')
      expect(ep.nameKnownWeek).toBeNull()
    })
  }
})

describe('road 2 – «Insist: we want to know»', () => {
  for (const band of ['steady', 'strained', 'cold'] as const) {
    it(`${band}: −2 on the bond, and the name ${band === 'cold' ? 'refused' : 'given'}`, () => {
      const { world, ep } = metCard(`r53-insist-${band}`, band)
      const reply = buildLifeBeatPrompt(world)!.followUps.find((f) => f.optionId === 'insist')!
      expect(reply.said[0].includes('Matteo')).toBe(band !== 'cold')
      const bond = world.bond!
      answerLifeBeat(world, 'insist')
      expect(world.bond).toBeCloseTo(bond + PARTNER_NAME.insistBond)
      expect(PARTNER_NAME.insistBond).toBe(-2)
      expect(ep.nameKnownWeek).toBe(band === 'cold' ? null : world.week)
    })
  }
})

describe('road 3 – her own later word, once a feel period, on its own sub-stream', () => {
  it('the rates by band over 1000 periods (±3 points), and cold is a literal zero', () => {
    const want: Record<BondBand, number> = { close: 0.5, steady: 0.2, strained: 0.05, cold: 0 }
    for (const band of Object.keys(want) as BondBand[]) {
      let hits = 0
      for (let p = 0; p < 1000; p++) if (drawNameThisPeriod('r53-rate', `p:${p % 37}`, p, band)) hits++
      expect(Math.abs(hits / 1000 - want[band]), `${band}: ${hits}/1000`).toBeLessThanOrEqual(0.03)
    }
    expect(PARTNER_NAME.perPeriod.cold).toBe(0)
  })

  it('only on a period boundary after `knownWeek`, and the college call is the call', () => {
    const world = createWorld('r53-road3')
    world.season = []
    world.week = weekAtAge(world, 20)
    world.bond = BOND.close
    const ep = episode(world.week - 10, world.week)
    world.loveEpisodes = [ep]
    const start = world.week
    let named = -1
    for (let w = start; w < start + 400 && named < 0; w++) {
      world.week = w
      rollPartnerName(world, true)
      if (ep.nameKnownWeek !== null) named = w
    }
    expect(named).toBeGreaterThan(start)
    expect((named - start) % PARTNER_NAME.periodWeeks).toBe(0)
    const row = world.events.at(-1)!
    expect(row.text).toContain('She called from college')
    expect(row.text).toContain('Matteo')
  })
})

describe('road 4 – the press, from `publicWeek`, at the booth\'s tiers', () => {
  it('nothing before `publicWeek`, the name after it', () => {
    const { world, ep } = metCard('r53-press', 'cold')
    const top = TIER_LADDER[TIER_LADDER.length - 1]
    const press = (): void => pressNamesPartnerAt(world, top)
    press()
    expect(ep.nameKnownWeek, 'never public').toBeNull()
    ep.publicWeek = world.week + 1
    press()
    expect(ep.nameKnownWeek, 'not yet public').toBeNull()
    ep.publicWeek = world.week
    press()
    expect(ep.nameKnownWeek).toBe(world.week)
    expect(world.events.at(-1)!.text).toBe('In the stands – Matteo, her boyfriend.')
  })

  it('at a `noticed` standing (top-200) the papers do not name him – his 22.10 bar is `known` (top-100)', () => {
    const top = TIER_LADDER[TIER_LADDER.length - 1]
    const { world, ep } = metCard('r53-press-noticed', 'cold')
    ep.publicWeek = world.week
    STANDING.value = 'noticed'
    try {
      pressNamesPartnerAt(world, top)
      expect(ep.nameKnownWeek, 'noticed is below the bar').toBeNull()
      STANDING.value = 'known'
      pressNamesPartnerAt(world, top)
      expect(ep.nameKnownWeek, 'known names him').toBe(world.week)
    } finally {
      STANDING.value = 'known'
    }
  })

  it('below the booth\'s stage bar the papers do not know him', () => {
    const low = TIER_LADDER.find((t) => !atOrAboveStageBar(t))!
    const { world, ep } = metCard('r53-press-low', 'cold')
    ep.publicWeek = world.week
    pressNamesPartnerAt(world, low)
    expect(ep.nameKnownWeek).toBeNull()
  })
})

describe('the tile – the name only once the parent heard it (the fog)', () => {
  it('`Together for` before `nameKnownWeek`, `Dating: <name>` after', () => {
    const { world, ep } = metCard('r53-tile', 'steady')
    answerLifeBeat(world, 'silent')
    const before = toSnapshot(world).life?.relationships
    expect(JSON.stringify(before)).not.toContain('Matteo')
    ep.nameKnownWeek = world.week
    expect(toSnapshot(world).life?.relationships?.lead).toBe('Dating: Matteo')
  })
})

describe('v95 – the migration', () => {
  it('married -> latchedWeek, engaged -> the engagement week, dating -> null; partnerName untouched', () => {
    const save = JSON.parse(readFileSync('tests/fixtures/saves/v94.json', 'utf8'))
    save.loveEpisodes = [
      { ...episode(100, 104, { endedWeek: null, latchedWeek: 200, partnerName: 'Ivo' }), nameKnownWeek: undefined },
      { ...episode(300, 302, { partnerName: 'Zeno' }), nameKnownWeek: undefined },
      { ...episode(400, 401, { partnerName: null }), nameKnownWeek: undefined },
    ].map((e) => { const { nameKnownWeek: _drop, ...rest } = e; return rest })
    save.lifeLog = [...(save.lifeLog ?? []), { week: 350, kind: 'engaged', detail: 'p:300', answer: 'bless' }]
    const world = migrateSave(save)
    expect(world.schemaVersion).toBe(95)
    expect(world.loveEpisodes!.map((e) => e.nameKnownWeek)).toEqual([200, 350, null])
    expect(world.loveEpisodes!.map((e) => e.partnerName)).toEqual(['Ivo', 'Zeno', null])
  })

  it('the golden v95 round-trips through the migration unchanged', () => {
    const raw = JSON.parse(readFileSync('tests/fixtures/saves/v95.json', 'utf8'))
    const again = migrateSave(JSON.parse(JSON.stringify(raw)))
    expect(JSON.parse(JSON.stringify(again))).toEqual(raw)
  })
})

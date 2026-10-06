// ⭐⭐ ROUND 46 #11 – THE BIG DAYS, THE ENGINE HALF (bundle B1).
//
// The owner, round 46 #11 (05.10, verbatim): «И кстати, она объявит о свадьбе заранее (… можно там тоже писать
// сколько они вместе, кстати, как вариант)? … И поставим ли мы свадьбу в календарь? Картинка есть. Я дождался
// свадьбы, но самого экрана этого события не было! Подозреваю, что с похоронами то же самое и, возможно, с
// беременностью и родами тоже. Можно делать оверлей на весь экран, например.»
//
// WHAT THIS FILE HOLDS, by item:
//   11b  `upcomingWeddingWeek` is `landWedding`'s own predicate read forward – the SAME week, proven by driving
//        the real `landWedding` week by week, so the calendar's mark and the day itself cannot drift apart.
//   11c  `lifeMomentOf`: the wedding day and the birth day leave a moment whose line IS the feed's kept row and
//        whose painting is the album's own table; the week after, and every week before, there is none.
//   11d  `relationshipDurationWeeks` (the primitive #9's page shares) and the sentence the announcement card
//        carries after the pool line.
//
// ⚠ THE FIXTURES ARE HAND-BUILT WORLDS, NOT A SIMULATED CAREER: the engine's own writers (`raiseLifeBeat`,
// `landWedding`, and the two writes `landBirth` makes) are called for real, but the episode they act on is
// posed – a career that really marries takes a year of ticks and a 0.6% roll, and this file is about what the
// writers leave behind, not whether a seed reaches them. (The roll's own boost is `life-moment-boost.test.ts`.)
//
// ⚠ MUTATIONS, each really run against the real code and watched going red, then put back:
//   * `upcomingWeddingWeek` returning `due + 1` -> RED (the parity case: landWedding latches a week before the
//     calendar's date).
//   * `lifeMomentOf` matching `x.week === world.week + 1` -> RED (the wedding-day and next-week cases).
//   * `engagedWithTogether` returning `said` untouched -> RED (the announcement sentence case).
import { describe, it, expect } from 'vitest'
import { buildLifeBeatPrompt, createWorld, raiseLifeBeat, toSnapshot } from '../src/engine/world'
import { lifeLogOf } from '../src/engine/world/lifeBeat'
import { landWedding, upcomingWeddingWeek } from '../src/engine/world/lifeBeat/wedding'
import { ENGAGED_DRY, ENGAGED_HER_LINE, engagedWithTogether, togetherSpan } from '../src/engine/world/lifeBeat/weddingCopy'
import { lifeMomentOf } from '../src/engine/world/lifeMoment'
import { LIFE_MOMENT_CONFIRM } from '../src/engine/world/lifeMomentCopy'
import { loveEpisodesOf, relationshipDurationWeeks } from '../src/engine/world/loveEpisodes'
import { captureMilestone, fireMilestone } from '../src/engine/world/milestones'
import { ECONOMY } from '../src/engine/economy'
import type { WorldState } from '../src/engine/world'
import type { LoveEpisode } from '../src/shared/protocol/narrative'

const SINCE = 100
const EPISODE_ID = `p:${SINCE}`

function episode(over: Partial<LoveEpisode> = {}): LoveEpisode {
  return {
    id: EPISODE_ID,
    sinceWeek: SINCE,
    endedWeek: null,
    knownWeek: SINCE,
    wants: 'open',
    partnerId: EPISODE_ID,
    publicWeek: null,
    publicWrong: false,
    airedMetWeek: null,
    airedEndedWeek: null,
    latchedWeek: null,
    partnerName: 'Anton',
    ...over,
  }
}

/** A world whose parent has been told she is getting married at `atWeek` – the `'engaged'` row raised by the
 *  real writer – and, unless `answered` is false, has answered the card. */
function engagedWorld(seed: string, atWeek: number, answered = true): WorldState {
  const world = createWorld(seed)
  world.loveEpisodes = [episode()]
  world.week = atWeek
  raiseLifeBeat(world, 'engaged', EPISODE_ID)
  if (answered) lifeLogOf(world).at(-1)!.answer = 'bless'
  return world
}

const DUE_AFTER = ECONOMY.wedding.weeksAfterEngagement

describe('11b – upcomingWeddingWeek is landWedding read forward', () => {
  it('names the week landWedding latches on – from the week it is announced until the day arrives', () => {
    const world = engagedWorld('life-moment-parity', 200)
    const due = 200 + DUE_AFTER
    expect(upcomingWeddingWeek(world), 'announced: the calendar knows the day at once').toBe(due)

    let latchedOn: number | null = null
    for (let w = 200; w <= due + 4 && latchedOn === null; w++) {
      world.week = w
      // BEFORE landWedding runs this week: every week short of the day, the calendar still names the day.
      if (w < due) expect(upcomingWeddingWeek(world), `week ${w}`).toBe(due)
      landWedding(world)
      if (loveEpisodesOf(world)[0].latchedWeek !== null) latchedOn = w
    }
    expect(latchedOn, 'the real writer latches on exactly the week the calendar named').toBe(due)
    expect(upcomingWeddingWeek(world), 'once it has landed the day is no longer upcoming').toBeNull()
  })

  it('is null before the card is answered, once the episode has ended, and on a world with no row', () => {
    expect(upcomingWeddingWeek(engagedWorld('life-moment-unanswered', 200, false)), 'the week is stopped on the card').toBeNull()

    const ended = engagedWorld('life-moment-ended', 200)
    loveEpisodesOf(ended)[0].endedWeek = 203
    expect(upcomingWeddingWeek(ended), 'landWedding skips an ended episode, so no wedding is coming').toBeNull()

    expect(upcomingWeddingWeek(createWorld('life-moment-none')), 'nothing announced').toBeNull()
  })

  it('reaches the wire: the snapshot carries the week the calendar reads', () => {
    expect(toSnapshot(engagedWorld('life-moment-wire', 200)).weddingWeek).toBe(200 + DUE_AFTER)
    expect(toSnapshot(createWorld('life-moment-wire-none')).weddingWeek).toBeNull()
  })
})

describe('11c – lifeMomentOf: the days that get a screen', () => {
  function weddingDay(seed: string): WorldState {
    const world = engagedWorld(seed, 300)
    world.week = 300 + DUE_AFTER
    landWedding(world)
    return world
  }

  it('a plain world holds no moment', () => {
    expect(lifeMomentOf(createWorld('life-moment-plain'))).toBeNull()
    expect(toSnapshot(createWorld('life-moment-plain')).lifeMoment).toBeNull()
  })

  it('the wedding day: the feed\'s own kept line, the bride painting, the one label – and it reaches the wire', () => {
    const world = weddingDay('life-moment-wedding')
    const moment = lifeMomentOf(world)
    expect(moment, 'landWedding left a moment behind').not.toBeNull()
    expect(moment!.kind).toBe('wedding')
    expect(moment!.week).toBe(world.week)
    expect(moment!.face, 'the album\'s own table says which painting').toBe('bride')
    const feedRow = world.events.find((e) => e.milestoneKey === `wedding:${EPISODE_ID}`)
    expect(feedRow, 'the feed row landWedding fires').toBeDefined()
    expect(moment!.line, 'the screen and the feed cannot say different things').toBe(feedRow!.text)
    expect(moment!.confirm).toBe(LIFE_MOMENT_CONFIRM)
    expect(toSnapshot(world).lifeMoment).toEqual(moment)
  })

  it('is gone the week after, and on every week before the day', () => {
    const world = weddingDay('life-moment-after')
    world.week += 1
    expect(lifeMomentOf(world), 'the engine stops handing it over the next week').toBeNull()
    const early = engagedWorld('life-moment-before', 300)
    expect(lifeMomentOf(early), 'announced is not landed').toBeNull()
  })

  it('the birth day: the two writes landBirth makes leave a moment with the birth painting', () => {
    // ⚠ `landBirth` itself needs a whole pregnancy record (support grade, frozen rank …) that this file is not
    // about; its two WRITES are the contract `lifeMomentOf` reads, so they are replayed here verbatim.
    const world = createWorld('life-moment-birth')
    world.week = 500
    fireMilestone(world, `birth:${world.week}`, 'FIXTURE birth line, standing in for BIRTH_EVENT.')
    captureMilestone(world, { type: 'birth', week: world.week })
    const moment = lifeMomentOf(world)
    expect(moment).toMatchObject({ kind: 'birth', week: 500, face: 'birth', line: 'FIXTURE birth line, standing in for BIRTH_EVENT.' })
  })

  it('a moment without its feed line is no moment: a picture with nothing to say is not shown', () => {
    const world = weddingDay('life-moment-no-line')
    world.events = world.events.filter((e) => e.milestoneKey !== `wedding:${EPISODE_ID}`)
    expect(lifeMomentOf(world)).toBeNull()
  })
})

describe('11d – how long they have been together', () => {
  it('relationshipDurationWeeks: counts to now while it lasts, stops at the end, and is null with nobody', () => {
    const world = createWorld('life-moment-duration')
    expect(relationshipDurationWeeks(world), 'no partner is a fact, not a zero').toBeNull()
    world.loveEpisodes = [episode()]
    world.week = SINCE + 60
    expect(relationshipDurationWeeks(world)).toBe(60)
    world.week = SINCE + 75
    expect(relationshipDurationWeeks(world), 'it grows with the week').toBe(75)
    loveEpisodesOf(world)[0].endedWeek = SINCE + 30
    expect(relationshipDurationWeeks(world), 'nobody is there now').toBeNull()
    expect(relationshipDurationWeeks(world, loveEpisodesOf(world)[0]), 'a past attachment keeps the length it had').toBe(30)
    world.week = SINCE + 400
    expect(relationshipDurationWeeks(world, loveEpisodesOf(world)[0]), 'and does not grow after it ended').toBe(30)
  })

  it('togetherSpan reads a 52-week year', () => {
    expect(togetherSpan(52)).toBe('1 year')
    expect(togetherSpan(80)).toBe('1 year and 6 months')
    expect(togetherSpan(104)).toBe('2 years')
    expect(togetherSpan(30)).toBe('6 months')
    expect(togetherSpan(2)).toBe('less than a month')
  })

  it('the announcement card says it after the pool line, untouched – and `null` weeks adds nothing', () => {
    expect(engagedWithTogether('LINE', null)).toBe('LINE')
    const world = engagedWorld('life-moment-sentence', SINCE + 80, false)
    const prompt = buildLifeBeatPrompt(world)
    expect(prompt?.kind, 'the announcement is the pending beat').toBe('engaged')
    const lead = [...Object.values(ENGAGED_HER_LINE), ENGAGED_DRY].find((line) => prompt!.said.startsWith(line))
    expect(lead, 'the pool line is intact and comes first').toBeDefined()
    expect(prompt!.said).toBe(`${lead} They have been together for 1 year and 6 months.`)
  })
})

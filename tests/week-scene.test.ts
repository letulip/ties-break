// W5 — A STORY ON EVERY WEEK: THE PAINTING, AND THE HANDLE THAT TURNS THE PAGE OFF
//
// The owner, 30.07: «давай пожалуйста week recap сделаем на каждую неделю, это реально результат, на
// всех поездках он станет живым, если локальные или региональные, то без самолетов, если национальные
// и выше, то все виды транспорта и настроений. Для недель с тренировками можем использовать наши арты
// тренировки, для недель с восстановлением после травмы соответственно. Если был отпуск - есть
// соответствующие картинки отпуска ... Если нужно - можем сделать отдельную ручку для их отключения в
// настройках.»
//
// This file exists because of what it REPLACES. The card's painting used to be three chained ternaries
// inside WeekRecapCard.vue, and the guard over it was three `expect(card).toContain(...)` string matches
// over that expression (tests/round13-nav.test.ts, re-aimed by this slice). A string match cannot tell
// you that a nine-week layoff draws nine paintings of ladder drills, which is exactly what it did. So
// the decision moved into the engine as one function with a stated priority order, and the guard moved
// with it and became BEHAVIOURAL:
//
//   1. THE ORDER, on facts, including every collision a week can actually be – she came home AND is
//      hurt; she was on holiday during the off-season; she was on holiday during a layoff.
//   2. THE TIER GATE, which is the owner's own sentence: local/regional never fly, national and up can.
//   3. EVERY ARM NAMES A FILE THAT IS ON DISK. A priority function whose fourth branch 404s is worse
//      than the ternary it replaced, and `weekSceneArtUrl` is the only place a filename is spelled.
//   4. A LIVE SEASON: every week of it carries a scene, the layoff weeks really draw the layoff, and
//      the local tournament weeks really draw a road.
//   5. THE HANDLE, and specifically the thing it must NOT do: turning the page off may not stop the
//      story existing. That is the difference between a valve and the game hiding something, and it is
//      one `&&` away from being broken from either side.
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { readFileSync } from 'node:fs'
import {
  assembleDiaryFacts,
  buildDiarySnapshot,
  weekSceneFor,
  type DiaryWorldView,
} from '../src/engine/diary'
import {
  bookVacation,
  closeTournament,
  createWorld,
  enterEvent,
  KID_ID,
  skipTournament,
  tickWeek,
  toSnapshot,
} from '../src/engine/world'
import { weekSceneArtUrl, weekArtUrl } from '../src/art/weeks'
import { portraitUrl, travelHomeUrl } from '../src/art/preload'
import { rngFromSeed } from '../src/engine/rng'
import { isOffSeasonWeek } from '../src/engine/season/calendar'
import { ECONOMY } from '../src/engine/economy'
import {
  isWeekStoryAutoOpenOff,
  recapExists,
  setWeekStoryAutoOpenOff,
  storyOpensItself,
} from '../src/composables/weekRecap'
import type { DiaryFacts, TravelHomeScene, WeekScene, WorldEvent, WorldMatch } from '../src/shared/protocol'
import type { TierId } from '../src/engine/season/types'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

let nextId = 1
function matchAt(week: number, tier: TierId): WorldEvent {
  return {
    id: nextId++,
    week,
    type: 'match',
    text: 'match',
    match: { winnerId: KID_ID, eventId: `2031-w${week}-${tier}` } as unknown as WorldMatch,
  }
}
function trip(week: number, tier: TierId): WorldEvent[] {
  return [
    { id: nextId++, week, type: 'expense', category: 'travel', text: 'Travel to X', amountCents: -400_00 },
    matchAt(week, tier),
  ]
}

/** A view with nothing happening – the fourth arm's own week. */
const view = (over: Partial<DiaryWorldView> = {}): DiaryWorldView => ({
  seed: 's',
  week: 11,
  kidId: KID_ID,
  startAgeYears: 14,
  condition: 70,
  fundsCents: 100_000_00,
  injury: null,
  events: [],
  lossStreak: null,
  kidRank: 50,
  prevKidRank: 50,
  pendingUnfinished: false,
  runPointsThisWeek: 0,
  milestones: [],
  vacationWeek: false,
  vacationPackageId: null,
  trainPct: 75,
  knockChoice: null,
  knockPart: null,
  ...over,
})

const facts = (over: Partial<DiaryWorldView> = {}): DiaryFacts => assembleDiaryFacts(view(over))
const scene = (over: Partial<DiaryWorldView> = {}, vacationPackageId: string | null = null): WeekScene =>
  weekSceneFor({ facts: facts(over), stage: 'young', vacationPackageId })

const INJURY = { kind: 'ankle strain', weeksRemaining: 6, totalWeeks: 9 }

describe('W5 — the priority order, which is the only real design decision here', () => {
  it('the four arms, each on a week that is only itself', () => {
    // 1. she went somewhere and came back
    expect(scene({ events: trip(11, 'regional') }).kind).toBe('travel')
    // 2. she is out
    expect(scene({ injury: INJURY }).kind).toBe('rehab')
    // 3. the family went away
    expect(scene({ vacationWeek: true }, 'seaside').kind).toBe('vacation')
    // 4. ...and everything else is the calendar's own frame
    expect(scene().kind).toBe('week')
  })

  it('THE JOURNEY WINS over the injury she came home with – the week she LIVED was the trip', () => {
    // On the engine's own timing this is a girl who got home and THEN got the news: `rollInjury` runs
    // at the TOP of a week, and an injury the week before would have walked the tournament over and
    // left no journey at all. It is also the one week the frame and the scrap are about different
    // things on purpose – TRAVEL_NOTES' injured band takes the WORDS on exactly this week, so the
    // picture says where she was and the note says how she is.
    const s = scene({ events: trip(11, 'j30'), injury: INJURY })
    expect(s.kind).toBe('travel')
    // ...and the note really is the injury's, on the same week, from the same snapshot
    const snap = buildDiarySnapshot(view({ events: trip(11, 'j30'), injury: INJURY }))
    expect(snap.scene.kind).toBe('travel')
    expect(snap.travelNote, 'the journey takes the frame, the injury takes the scrap').not.toBeNull()
  })

  it('THE LAYOFF WINS over the holiday, because that is where the WORDS already are', () => {
    // WEEK_NOTES' vacation licence carries `f.injured === null` and its layoff band carries no such
    // clause – so the scrap on a holiday-during-a-layoff week says «Rehab, three times this week.» A
    // seaside frame over those words would be the page contradicting itself, and a seaside frame on a
    // week his daughter is in a knee brace would read as the game not noticing.
    const s = scene({ injury: INJURY, vacationWeek: true }, 'resort')
    expect(s.kind).toBe('rehab')
    const snap = buildDiarySnapshot(view({ injury: INJURY, vacationWeek: true, vacationPackageId: 'resort' }))
    expect(snap.scene.kind).toBe('rehab')
    expect(snap.weekNote, 'and the scrap agrees with the frame').toContain('ehab')
  })

  it('THE HOLIDAY WINS over the off-season, because it names ONE week and December names three', () => {
    // Same rule read off the words again: WEEK_NOTES' off-season licence carries `!f.vacationWeek`.
    const offWeek = 50
    expect(isOffSeasonWeek(offWeek), 'the fixture has to actually be in the block').toBe(true)
    expect(scene({ week: offWeek, vacationWeek: true }, 'grandma').kind).toBe('vacation')
    // ...and with no holiday booked, December wears its own frame
    expect(scene({ week: offWeek }).kind).toBe('week')
    expect(weekSceneArtUrl(scene({ week: offWeek }))).toContain('off-')
  })

  it('a holiday with no painting yet falls back to the week frame rather than a 404', () => {
    // `vacationArtUrl`'s documented contract: the package catalogue may grow before the art does.
    const s = scene({ vacationWeek: true }, 'a-package-nobody-has-painted')
    expect(s.kind).toBe('vacation')
    expect(weekSceneArtUrl(s)).toBe(weekArtUrl(s.week))
  })

  it('THE ONSET WEEK draws the layoff, not the moment – R14-1\'s own split', () => {
    // The owner, 29.07: «rehab – показываем ... до момента восстановления, травму показываем ТОЛЬКО в
    // момент самой травмы в попапе». The moment belongs to InjuryStopDialog and to the Memory card;
    // the WEEK belongs here, and every week of a layoff is a week she is not playing.
    const onset = { kind: 'ankle strain', weeksRemaining: 9, totalWeeks: 9 }
    const s = scene({ injury: onset })
    expect(s.kind).toBe('rehab')
    expect(weekSceneArtUrl(s)).toContain('-rehab.webp')
    expect(weekSceneArtUrl(s)).not.toContain('-injury.webp')
  })

  it('the layoff painting is HER AGE BAND – what makes five seasons feel like five seasons', () => {
    // The same arithmetic `selectMemory` uses: her start age plus the completed years.
    const at = (week: number) => buildDiarySnapshot(view({ week, injury: INJURY })).scene
    const young = at(11) // 14
    const teen = at(11 + 52 * 3) // 17
    expect(young.kind === 'rehab' && young.stage).toBe('young')
    expect(teen.kind === 'rehab' && teen.stage).toBe('teen')
    expect(weekSceneArtUrl(young)).not.toBe(weekSceneArtUrl(teen))
  })

  it('PURE AND DETERMINISTIC: the same week always answers the same painting', () => {
    const v = view({ events: trip(11, 'national') })
    for (let i = 0; i < 30; i++) expect(buildDiarySnapshot(v).scene).toEqual(buildDiarySnapshot(v).scene)
    // ...and it adds no draw of its own: the journey's mode and mood were already on the facts
    const f = facts({ events: trip(11, 'national') })
    const s = weekSceneFor({ facts: f, stage: 'young', vacationPackageId: null })
    expect(s.kind === 'travel' && s.scene).toBe(f.travelHomeScene)
    expect(s.kind === 'travel' && s.mood).toBe(f.travelHomeMood)
  })
})

describe('W5 — every arm names a file that is on disk', () => {
  const onDisk = (url: string) =>
    existsSync(new URL(`../public/${url.slice(import.meta.env.BASE_URL.length)}`, import.meta.url))

  it('the five layoff paintings, one per band', () => {
    for (const stage of ['jun', 'young', 'teen', 'adult', 'milf'] as const) {
      const url = weekSceneArtUrl({ kind: 'rehab', week: 11, stage })
      expect(url).toBe(portraitUrl(stage, 'rehab'))
      expect(onDisk(url), url).toBe(true)
    }
  })

  it('the twelve journeys, and the builder is the ONE the preloader warms through', () => {
    for (const mood of ['sleepy', 'happy', 'sad'] as const) {
      for (const s of ['airport', 'plane', 'bus', 'car'] as TravelHomeScene[]) {
        const url = weekSceneArtUrl({ kind: 'travel', week: 11, scene: s, mood })
        expect(url).toBe(travelHomeUrl(s, mood))
        expect(onDisk(url), url).toBe(true)
      }
    }
  })

  it('every shipped holiday package, and every in-year and off-season week frame', () => {
    for (const p of ECONOMY.vacation.packages) {
      const url = weekSceneArtUrl({ kind: 'vacation', week: 11, packageId: p.id })
      expect(onDisk(url), `${p.id} -> ${url}`).toBe(true)
    }
    // one whole season year, so the off-season's three and `training` are both covered
    for (let w = 1; w <= 52; w++) {
      expect(onDisk(weekSceneArtUrl({ kind: 'week', week: w })), `week ${w}`).toBe(true)
    }
  })
})

describe('W5 — a live season: every week has a painting, and it is the week\'s own', () => {
  it('52 weeks, a scene on every one of them, and the arms line up with the facts', () => {
    const world = createWorld('week-scene-live')
    const rng = rngFromSeed(world.seed)
    const kinds = new Set<WeekScene['kind']>()
    let rehabWeeks = 0
    let localRoad = 0
    for (let i = 0; i < 104; i++) {
      for (const e of world.season) {
        if (e.week > world.week && world.week <= e.deadlineWeek && !world.entries.includes(e.id)) {
          try {
            enterEvent(world, e.id)
          } catch {
            /* blocked entries are not this test's business */
          }
        }
      }
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
      const snap = toSnapshot(world)
      const s = snap.diary.scene
      // THE HEADLINE: there is no week without a picture.
      expect(s, `week ${snap.week}`).toBeTruthy()
      expect(s.week).toBe(snap.week)
      kinds.add(s.kind)
      // ...and each arm agrees with the fact it claims to be about
      if (s.kind === 'travel') expect(snap.diary.facts.travelHomeScene).toBe(s.scene)
      if (s.kind === 'rehab') {
        expect(snap.diary.facts.injured, `week ${snap.week} paints a layoff with no injury`).not.toBeNull()
        rehabWeeks++
      }
      if (s.kind === 'vacation') expect(snap.diary.facts.vacationWeek).toBe(true)
      // the LOCAL journey home, which is what the owner's correction bought (bus or car, never air)
      if (s.kind === 'travel' && world.events.some((e) => e.week === snap.week && e.match?.eventId?.endsWith('-local'))) {
        expect(['bus', 'car'], `a Local Open came home by ${s.scene}`).toContain(s.scene)
        localRoad++
      }
    }
    // a two-season career must reach at least the journey, the layoff-or-holiday and the frame
    expect(kinds.has('travel'), 'no journeys home in two seasons').toBe(true)
    expect(kinds.has('week'), 'no ordinary weeks in two seasons').toBe(true)
    expect(rehabWeeks + localRoad, 'the two arms this slice added must be reachable').toBeGreaterThan(0)
  })

  it('a booked holiday really paints ITS OWN frame on the week it resolves', () => {
    const world = createWorld('week-scene-holiday')
    const rng = rngFromSeed(world.seed)
    // A cheap package on a week the calendar leaves empty, far enough ahead to be bookable.
    const target = 8
    bookVacation(world, target, 'staycation')
    let seen = false
    for (let i = 0; i < target + 2; i++) {
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
      const snap = toSnapshot(world)
      if (snap.week !== target) continue
      const s = snap.diary.scene
      // (a layoff would legitimately outrank it – see the order – so only assert when she is healthy)
      if (snap.diary.facts.injured !== null) continue
      expect(s.kind, `week ${target}`).toBe('vacation')
      expect(s.kind === 'vacation' && s.packageId).toBe('staycation')
      expect(weekSceneArtUrl(s)).toContain('vac-friends')
      seen = true
    }
    expect(seen, 'the fixture has to actually reach the booked week').toBe(true)
  })

  it('world.ts really passes the booking through – the one optional field on the view', () => {
    // `vacationPackageId` is the only OPTIONAL field on DiaryWorldView (it feeds no copy licence, so a
    // fixture may omit it), which means a missing wire-up would show up as "every holiday draws the
    // training frame" rather than as a type error. So the wire-up is pinned.
    const world = read('../src/engine/world.ts')
    expect(world).toContain('vacationPackageId: vacationForWeek(world, world.week)?.packageId ?? null')
  })
})

describe('W5 — the handle in settings, and the thing it must not do', () => {
  it('DEFAULT ON: with no preference stored, the end of a week opens the story', () => {
    setWeekStoryAutoOpenOff(false)
    expect(isWeekStoryAutoOpenOff()).toBe(false)
    expect(storyOpensItself({ week: 3, pending: undefined, events: [] })).toBe(true)
  })

  it('OFF stops the PAGE and never the STORY – the whole design of the switch', () => {
    setWeekStoryAutoOpenOff(true)
    const snap = { week: 3, pending: undefined, events: [] }
    // the door closes...
    expect(storyOpensItself(snap)).toBe(false)
    // ...and the story is still there: the card renders on `recapExists`, and so does the tab's dot.
    expect(recapExists(snap), 'the switch must not delete the week\'s story').toBe(true)
    setWeekStoryAutoOpenOff(false)
    expect(storyOpensItself(snap)).toBe(true)
  })

  it('the preference cannot reach `recapExists` – read the body, not the file', () => {
    // The card, the tab dot and the route all read that predicate. If it learned about the preference,
    // switching the page off would silently take the story off the This-week tab as well, which is the
    // one outcome this slice must not produce.
    const rule = read('../src/composables/weekRecap.ts')
    const body = rule.slice(rule.indexOf('export function recapExists'), rule.indexOf('/** The This-week tab'))
    expect(body).toContain('return !snap.pending')
    expect(body).not.toContain('AutoOpen')
    expect(body).not.toContain('localStorage')
  })

  it('it is a localStorage flag on its own key, never a save field', () => {
    const rule = read('../src/composables/weekRecap.ts')
    expect(rule).toContain("const AUTO_OPEN_OFF_KEY = 'tb-week-story-off'")
    // ...and nothing about it is in the protocol: a preference is not a fact about her career, and the
    // save is at v26 with a migration ladder and golden saves over it.
    const protocol = read('../src/shared/protocol.ts')
    expect(protocol).not.toContain('weekStory')
    expect(protocol).not.toContain('tb-week-story-off')
  })

  it('the switch is on the settings screen, in the shape the other three already have', () => {
    const more = read('../src/components/screens/MoreScreen.vue')
    expect(more).toContain("import { isWeekStoryAutoOpenOff, setWeekStoryAutoOpenOff } from '../../composables/weekRecap'")
    expect(more).toContain('<h2>Week story</h2>')
    expect(more).toContain('@click="toggleWeekStory"')
    // the same `role="switch"` + track/knob object Sound, Music and Haptics use – four switches, one
    // idiom, so a settings screen cannot start lying about what a switch is
    const section = more.slice(more.indexOf('<h2>Week story</h2>'), more.indexOf('<h2>About</h2>'))
    expect(section).toContain('class="sound-switch"')
    expect(section).toContain(':aria-checked="!weekStoryOff"')
    // ...and the hint says what OFF means, because "Week story: OFF" alone reads as "no story"
    expect(section).toContain('the story stays on the This week tab')
  })

  it('the settings copy obeys the app\'s rules: short dash only, no Cyrillic', () => {
    const more = read('../src/components/screens/MoreScreen.vue')
    const template = more.slice(more.indexOf('<template>'), more.lastIndexOf('</template>'))
    expect(template.length).toBeGreaterThan(500)
    expect(template).not.toContain('—')
    expect(template).not.toMatch(/[Ѐ-ӿ]/)
  })
})

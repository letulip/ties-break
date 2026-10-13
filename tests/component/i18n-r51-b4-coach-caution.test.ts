// r51 №7 (13.10) – THE HIRED COACH'S SENTENCE ABOUT A TRIP, UNDER A RUSSIAN LOCALE, MOUNTED. The owner: «Your coach would save her... нет перевода ни в попапе при заявке, ни на самой карточке в Сезоне».
//
// WHAT WAS WRONG. The engine wrote the sentence as finished English into `UpcomingEvent.coachCaution` and four screens printed that string: the entry confirm (two message shapes), Season's card, the next-tournament panel and the
// Calendar's marker card. The sentence now arrives ALSO as a ref (`coachCautionC`), and all four read it through `coachCautionText` (composables/eventCard.ts) – the engine's ref rendered under the player's locale, the string where there is no ref.
//
// WHAT THIS FILE ASKS, AND WHY EACH ARM CAN FAIL.
//   · FOUR SURFACES × the engine's own card (the owner's own sentence, «would save her for the…») and a posed tired-body line: the text the screen prints is the EXPECTED RUSSIAN – built here from ru.json rows by hand, hole by hole, not
//     by calling the renderer the screen calls (so a hole reader that stops reading the table's word, or a row that stops compiling, reds a surface even if the screen is wired right) – and no English word survives in it once the
//     tournament's own name (raw, like every name in the app) is taken out;
//   · TEN REFS on one surface, each of the engine's sentences posed onto a real card (two of them – «will not move anything», «even a title here would not move her ranking» – cannot be reached through the engine in any pose that
//     leaves the card open: the gate locks it first, see the characterisation arm in tests/i18n-coach-caution.test.ts, so they are posed here the way the brief asked);
//   · THE ENTRY CONFIRM'S BOTH SHAPES: `{caution} Enter {event} ({week}, {surface})? {fee}` (only the coach objects) and `… anyway? …` (she is also under the rung, the sentence is spliced before the engine's fatigue line);
//   · ENGLISH IS BYTE-IDENTICAL on every surface, and a card with a string but no ref (an old snapshot) still prints the string.
//
// ⚠ NO CYRILLIC IS TYPED HERE: every Russian expectation is read from the real src/i18n/ru.json by key, so a re-worded row follows the screen instead of reddening it, and an absent row fails loudly.
// ⚠ THE ENTRY CONFIRM'S FATIGUE HALF IS NOT UNDER TEST: `cautionDetail` is the fatigue gate's own English sentence (engine/world/medical.ts) printed raw after the coach's, a sibling leak this item did not touch (reported in the commit).
//   The arm below asserts the coach's half is Russian and says nothing about the half after it.
// ⚠ MUTATION-VERIFIED 13.10 – see the commit message for the three runs (the three screens put back to `{{ x.coachCaution }}`; the snapshot putting `coachCautionC` back off the wire; the hole-table row removed).
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import CalendarScreen from '../../src/components/screens/CalendarScreen.vue'
import NextTournamentPanel from '../../src/components/NextTournamentPanel.vue'
import { useGameStore } from '../../src/stores/game'
import { toSnapshot } from '../../src/engine/world'
import { coachEntryLineRef, coachLadderNoteRef } from '../../src/engine/world/coachMarket'
import { TIERS } from '../../src/engine/season/calendar'
import { installCatalog, resetI18nForTests, setLocale } from '../../src/i18n'
import { renderCopyRef, SOURCE_LOCALE, type CopyRef } from '../../src/shared/i18n'
import type { Snapshot, UpcomingEvent } from '../../src/shared/protocol'
import { mountSeason } from '../helpers/mountSeason'
import { aheadPose, bookPose, LEGACY, outgrownPose, paysPose, shutPose, withCoach, type Pose } from '../helpers/coachCautionPoses'
import { EVENT_ID, FLOOR, tiredWithACoach } from '../helpers/r41EntryWarning'
import { installMemoryStorage } from './setup'

/** His Russian, as the importer compiled it. */
const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>
const en = (c: CopyRef): string => renderCopyRef(c, { locale: SOURCE_LOCALE })
const LATIN_WORD = /[A-Za-z]{2,}/

beforeEach(() => {
  installMemoryStorage()
  resetI18nForTests(null)
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})
afterEach(() => {
  document.body.innerHTML = ''
  resetI18nForTests(null)
  document.documentElement.lang = 'en'
})
async function inRussian(): Promise<void> {
  installCatalog('ru', RU)
  await setLocale('ru')
}

// --- the expected Russian, built from the rows by hand ---------------------------------------------------------------

const LADDER_WORD: Record<string, string> = { national: RU['tile|National'] as string, international: RU['tile|International'] as string, professional: RU['tile|Professional'] as string }
const PAYS = 'Your coach says the {0} is the week – this pays {1} points, not the table she is climbing.'

/** One ref, spelled in Russian by substituting its holes into its row: a string hole is a name (raw) – except the table's word in `PAYS`, which is the catalog's compact word – and a nested ref is spelled the same way. The
 *  only row with a plural is the counted tail; its branch is picked with the platform's own Russian plural rules and the number put into it. */
function expectedRu(ref: CopyRef): string {
  const row = RU[ref.k]
  expect(row, `ru.json carries «${ref.k}»`).toBeTruthy()
  const p = ref.p ?? []
  if (ref.k === 'when|in {0} weeks') {
    const n = p[0] as number
    const category = new Intl.PluralRules('ru').select(n)
    const branch = new RegExp(`${category} \\{(\\{0\\}[^{}]*)\\}`).exec(row as string)
    expect(branch, `the plural row has a «${category}» branch`).not.toBeNull()
    return (row as string).replace(/\{0, plural,[\s\S]*\}$/, (branch as RegExpExecArray)[1]!.replace('{0}', String(n)))
  }
  let out = row as string
  p.forEach((hole, i) => {
    const spelled = typeof hole === 'object' && hole !== null ? expectedRu(hole) : ref.k === PAYS && i === 1 ? (LADDER_WORD[String(hole)] as string) : String(hole)
    out = out.replace(`{${i}}`, spelled)
  })
  return out
}

/** Every tournament name a ref carries, at any depth: raw by design, so the English-word scan takes them out before it looks. */
function namesIn(ref: CopyRef): string[] {
  return (ref.p ?? []).flatMap((h) => (typeof h === 'object' && h !== null ? namesIn(h) : typeof h === 'string' && !(h in LADDER_WORD) ? [h] : []))
}
function withoutNames(text: string, names: string[]): string {
  return names.reduce((acc, name) => acc.split(name).join(' '), text)
}

// --- the cards ------------------------------------------------------------------------------------------------------

/** The owner's own sentence, engine-built: an elite coach, a W15 she has outgrown, a W75 three weeks on – «Your coach would save her for the W75 in 3 weeks.» */
function aheadCard(): { snap: Snapshot; card: UpcomingEvent; ref: CopyRef; pose: Pose } {
  const pose = aheadPose(3)
  withCoach(pose.world, 'elite')
  const snap = toSnapshot(pose.world)
  const card = snap.upcoming.find((e) => e.id === pose.event.id)!
  expect(card.coachCautionC, 'precondition: the engine sent the ref beside the string').toBeDefined()
  expect(card.coachCaution).toBe(LEGACY.save(TIERS.w75.label, 3))
  return { snap, card, ref: card.coachCautionC!, pose }
}
/** The same snapshot with ANOTHER ref on that card – a posed caution, the card and everything else the engine's. */
function posed(snap: Snapshot, id: string, ref: CopyRef | null): Snapshot {
  return {
    ...snap,
    upcoming: snap.upcoming.map((e) => {
      if (e.id !== id) return e
      const { coachCaution: _s, coachCautionC: _c, ...rest } = e
      return ref === null ? rest : { ...rest, coachCaution: en(ref), coachCautionC: ref }
    }),
  }
}
/** A tired career with a hired coach, the fixture's one National as the only card (the round-41 idiom: the feed narrowed to the card under test). */
function tiredCard(): { snap: Snapshot; card: UpcomingEvent } {
  const { world } = tiredWithACoach('r51-b4-tired-ui')
  const full = toSnapshot(world)
  const mine = full.upcoming.filter((u) => u.id === EVENT_ID)
  expect(mine.length, 'the fixture event is inside the horizon').toBe(1)
  expect(mine[0]!.coachCaution, 'precondition: he says the «empty» line').toBe(LEGACY.empty)
  return { snap: { ...full, upcoming: mine }, card: mine[0]! }
}

// --- the four surfaces ----------------------------------------------------------------------------------------------

interface Read {
  /** What the surface prints of his sentence (the confirm prints it inside a longer message, so that one is read whole). */
  text: string
  whole: boolean
}
const cardOf = (w: VueWrapper, label: string) => {
  const hit = w.findAll('.event-card').find((c) => c.find('.event-tier').text().trim() === label)
  expect(hit, `Season draws a card for ${label}`).toBeTruthy()
  return hit!
}
const SURFACES: Array<[string, (snap: Snapshot, card: UpcomingEvent) => Promise<Read>]> = [
  [
    'Season card',
    async (snap, card) => {
      const w = mountSeason(snap)
      const note = cardOf(w, TIERS[card.tier].label).find('.coach-note')
      expect(note.exists(), 'the card prints a coach note').toBe(true)
      const text = note.text()
      w.unmount()
      return { text, whole: true }
    },
  ],
  [
    'entry confirm',
    async (snap, card) => {
      const w = mountSeason(snap)
      const enter = cardOf(w, TIERS[card.tier].label)
        .findAll('button')
        .find((b) => b.classes().includes('primary'))
      expect(enter, 'the card has its Enter control').toBeTruthy()
      await enter!.trigger('click')
      const dialog = w.find('.dialog-card')
      expect(dialog.exists(), 'the confirm opened').toBe(true)
      const text = dialog.find('.dialog-message').text()
      w.unmount()
      return { text, whole: false }
    },
  ],
  [
    'next-tournament panel',
    async (snap, card) => {
      useGameStore().snapshot = snap
      const w = mount(NextTournamentPanel, { props: { event: snap.upcoming.find((e) => e.id === card.id)! }, global: { stubs: { teleport: true } }, attachTo: document.body })
      const note = w.find('.coach-note')
      expect(note.exists(), 'the panel prints a coach note').toBe(true)
      const text = note.text()
      w.unmount()
      return { text, whole: true }
    },
  ],
  [
    'Calendar card',
    async (snap, card) => {
      useGameStore().snapshot = snap
      const w = mount(CalendarScreen, { global: { stubs: { teleport: true } }, attachTo: document.body })
      const markers = w.findAll('.cal-marker')
      expect(markers.length, 'the look-ahead lists the tournament as a marker').toBeGreaterThan(0)
      // the look-ahead is in week order and the posed card is the first enterable one
      await markers[0]!.trigger('click')
      const note = w.find('.coach-note')
      expect(note.exists(), `the marker card for ${card.label} prints a coach note`).toBe(true)
      const text = note.text()
      w.unmount()
      return { text, whole: true }
    },
  ],
]

describe('the engine\'s own sentence – «would save her for the…» – on all four surfaces, in Russian', () => {
  it.each(SURFACES)('%s prints the expected Russian row, with no English word left but the tournament\'s name', async (_name, read) => {
    await inRussian()
    const { snap, card, ref } = aheadCard()
    const { text, whole } = await read(snap, card)
    const russian = expectedRu(ref)
    if (whole) expect(text).toBe(russian)
    else expect(text).toContain(russian)
    expect(text, 'the engine\'s English is the bug').not.toContain('Your coach')
    expect(withoutNames(text, namesIn(ref)), 'and no English word survives next to the raw name').not.toMatch(whole ? LATIN_WORD : /Your coach|would save|week/)
  })

  it.each(SURFACES)('%s: English is byte-identical – the engine\'s string, as before', async (_name, read) => {
    const { snap, card } = aheadCard()
    const { text, whole } = await read(snap, card)
    if (whole) expect(text).toBe(card.coachCaution)
    else expect(text).toContain(card.coachCaution as string)
  })
})

describe('the tired-body sentence (the entry confirm\'s FIRST shape: she is under the rung too, his line is spliced before the fatigue line)', () => {
  it('the confirm opens on the fatigue shape and its coach half is the Russian row – the engine\'s English is gone from the message', async () => {
    await inRussian()
    const { snap, card } = tiredCard()
    expect(card.cautionReason, 'precondition: this is the fatigue shape of the confirm').toBe('fatigued')
    const { text } = await SURFACES[1]![1](snap, card)
    expect(text).toContain(RU[LEGACY.empty] as string)
    expect(text, 'the engine\'s English sentence is gone').not.toContain(LEGACY.empty)
  })

  it('and Season\'s card prints the same row under the pill', async () => {
    await inRussian()
    const { snap, card } = tiredCard()
    const { text } = await SURFACES[0]![1](snap, card)
    expect(text).toBe(RU[LEGACY.empty] as string)
  })
})

describe('every sentence the engine can say, posed onto a real card, on Season\'s card', () => {
  const ladder = (pose: Pose): CopyRef => coachLadderNoteRef(pose.world, pose.event, 'elite')!
  const POSE_REFS: Array<[string, () => CopyRef]> = [
    ['empty – she would not be taken', () => coachEntryLineRef('national', FLOOR - 6)],
    ['skip this one', () => coachEntryLineRef('national', FLOOR - 1)],
    ['a week short', () => coachEntryLineRef('national', FLOOR)],
    ['the better one is on this week, she has outgrown this', () => ladder(outgrownPose())],
    ['the better one is on this week, this pays another table', () => ladder(paysPose())],
    ['the better one is on this week, this will not move anything', () => ladder(shutPose())],
    ['even a title here would not move her ranking', () => ladder(bookPose())],
    ['save her for it, a few weeks on', () => ladder(aheadPose(3))],
    ['save her for it, next week', () => ladder(aheadPose(1))],
  ]

  it('the denominator: nine poses, nine distinct refs, ten distinct keys between them', () => {
    const refs = POSE_REFS.map(([, make]) => make())
    expect(new Set(refs.map((r) => JSON.stringify(r))).size).toBe(9)
    const keys = new Set<string>()
    const walk = (c: CopyRef): void => {
      keys.add(c.k)
      for (const h of c.p ?? []) if (typeof h === 'object' && h !== null) walk(h)
    }
    refs.forEach(walk)
    expect(keys.size, 'eight sentences and the two counted tails').toBe(10)
  })

  it.each(POSE_REFS)('%s', async (_name, make) => {
    await inRussian()
    const { snap, card } = aheadCard()
    const ref = make()
    const w = mountSeason(posed(snap, card.id, ref))
    const text = cardOf(w, TIERS[card.tier].label).find('.coach-note').text()
    w.unmount()
    expect(text).toBe(expectedRu(ref))
    expect(withoutNames(text, namesIn(ref))).not.toMatch(LATIN_WORD)
  })
})

describe('the seams around the ref', () => {
  it('a card with the string and NO ref (an old snapshot) still prints the string', async () => {
    await inRussian()
    const { snap, card } = aheadCard()
    const w = mountSeason({ ...snap, upcoming: snap.upcoming.map((e) => (e.id === card.id ? { ...e, coachCautionC: undefined } : e)) })
    expect(cardOf(w, TIERS[card.tier].label).find('.coach-note').text()).toBe(card.coachCaution)
    w.unmount()
  })

  it('a card he said nothing on prints no note on any surface', async () => {
    await inRussian()
    const { snap, card } = aheadCard()
    const quiet = posed(snap, card.id, null)
    const w = mountSeason(quiet)
    expect(cardOf(w, TIERS[card.tier].label).find('.coach-note').exists()).toBe(false)
    w.unmount()
  })
})

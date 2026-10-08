// L2-2 – THE NET UNDER RU-02B: THE CHILDHOOD PROLOGUE, AGES FIVE TO THIRTEEN, THE LOCAL OPEN AND THE HANDOVER.
// docs/specs/i18n-2026-10.md §8, docs/localization/ru-childhood-prologue-2026-10.md.
//
// Five questions, asked of the REAL components mounted and of the REAL tables:
//   1. PARITY. With no catalog the English renders exactly as it shipped – the wiring changed no word (invariant 4). The byte-for-byte
//      proof is a one-off before/after dump of every string leaf and formatter result (248 + 35, identical sha, in the wave report);
//      what stays in the repo is the mounted anchors below plus the existing prologue pin families, which all ran green.
//   2. COMPLETENESS. Every string leaf of the prologue's copy tables is a WIRED key in the catalog – a card that grows a sentence
//      without `t()` reddens here instead of rendering English under a Russian locale (ruling 4).
//   3. THE DICE DO NOT KNOW THE LANGUAGE. The coach's read is drawn from a purpose-scoped sub-stream by `lines.length`; flipping the
//      locale must pick the SAME sentence in another language, never re-roll (invariant 2, applied to language).
//   4. THE RUSSIAN SMOKE. The REAL `src/i18n/ru.json` is installed and the locale flipped. ⚠ NO CYRILLIC LITERAL LIVES IN THIS FILE –
//      every expectation is READ from ru.json by key: a row he has approved must render his Russian, a row he has not must render the
//      English and be COUNTED as a miss. As of this wave no childhood-prologue row is APPROVED, so the second arm is the one that
//      bites today and the first wakes up on its own the day he approves one.
//   5. THE `xx` SWEEP. No unbracketed text where a string is wired, and the tightest cards still hold a 375x667 phone with every word
//      longer. The numbers print.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import '../../src/style.css'
import PrologueCardView from '../../src/components/PrologueCard.vue'
import PrologueHandoverView from '../../src/components/PrologueHandover.vue'
import PrologueLocalOpenView from '../../src/components/PrologueLocalOpen.vue'
import { COUNTRY_NAMES } from '../../src/composables/countries'
import { KID_ID } from '../../src/engine/world'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { ageInWords } from '../../src/engine/world/age'
import { installCatalog, missedKeys, resetI18nForTests, resetMisses, setLocale } from '../../src/i18n'
import {
  CARD_AGES,
  LOCAL_OPEN_COPY,
  PROLOGUE_CARDS,
  TWELFTH_REASONS,
  TWELFTH_WANTS_MORE,
  localDrawLine,
  localOpenCard,
  type PrologueCard,
} from '../../src/prologue/cards'
import {
  COACH_BASE_READS,
  COACH_READS,
  HANDOVER_COPY,
  PLAYED_COPY,
  WALK_COPY,
  coachBaseReadFor,
  coachReadFor,
  playedLine,
} from '../../src/prologue/handover'
import { OPENING_IDENTITY } from '../../src/prologue/identity'
import { playLocalOpen, prologueEntrant } from '../../src/prologue/pool'
import { EMPTY_RUN, cardFor, moodAt, readTwelfth, warmthAt } from '../../src/prologue/run'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import { installMemoryStorage } from './setup'
import { assertDismissReachable, PHONE, setViewport } from './fits'
import { hardcodeLeaks, installPseudoLocale, pseudoCatalog } from './pseudoloc'

/** His approved Russian, as the importer compiled it. Every Russian expectation below is read from here by key. */
const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>
const CATALOG = JSON.parse(readFileSync('src/i18n/catalog.en.json', 'utf8')) as {
  keys: Record<string, { home: string[]; wrapped?: true }>
}
const exact = (...texts: string[]): RegExp[] => texts.map((t) => new RegExp(`^${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`))

beforeEach(() => {
  installMemoryStorage()
  resetI18nForTests(null)
  document.body.innerHTML = ''
})
afterEach(() => {
  document.body.innerHTML = ''
  document.documentElement.lang = 'en'
})

// --- the mounts ------------------------------------------------------------------------------------------------

/** One card as the container draws it: the viewport FIRST (happy-dom resolves lengths at `getComputedStyle` time), then the mount. */
function mountCard(card: PrologueCard, extra: Record<string, unknown> = {}): VueWrapper {
  setViewport(PHONE)
  return mount(PrologueCardView, {
    attachTo: document.body,
    props: {
      card,
      warmth: warmthAt(card.age, EMPTY_RUN),
      mood: moodAt(card.age, EMPTY_RUN),
      canGoBack: card.age !== CARD_AGES[0],
      skipLabel: card.age === CARD_AGES[0] ? WALK_COPY.skip : undefined,
      identity: card.identity ? { ...OPENING_IDENTITY } : undefined,
      weight: card.weight ? false : undefined,
      ask: card.tournament,
      ...extra,
    },
  })
}

/** The tournament question opens once the year's own answer is taken (`askOpen` in PrologueCard.vue), so a scene that carries one is mounted
 *  with its first answer picked – the way the container hands the card its run. */
const pickedOf = (card: PrologueCard): Record<string, unknown> => (card.options && card.tournament ? { picked: card.options[0]!.id } : {})

/** The twelve screens a childhood can show on the card component: nine years, the fork's other face, and the Local Open's result scenes. */
function everyScene(): { name: string; card: PrologueCard; extra: Record<string, unknown> }[] {
  const out = PROLOGUE_CARDS.map((c) => ({
    name: `age ${c.age}`,
    card: cardFor(c.age, EMPTY_RUN),
    extra: { ...pickedOf(c), ...(c.age === 12 ? { reason: readTwelfth(EMPTY_RUN).reason } : {}) },
  }))
  out.push({ name: 'age 12, the other face', card: TWELFTH_WANTS_MORE, extra: { ...pickedOf(TWELFTH_WANTS_MORE), reason: readTwelfth(EMPTY_RUN).reason } })
  for (const outcome of ['won', 'final', 'lost'] as const) {
    out.push({ name: `result: ${outcome}`, card: localOpenCard(10, outcome), extra: { ask: undefined, outcome } })
  }
  out.push({ name: 'result: hurt', card: localOpenCard(10, 'lost', true), extra: { ask: undefined } })
  return out
}

const readOf = (kid = 'Vera Novak') => prologueEntrant('l22', KID_ID, kid, 10)
function mountOpen(): VueWrapper {
  setViewport(PHONE)
  const kid = readOf()
  const open = playLocalOpen('l22', kid, 10)
  return mount(PrologueLocalOpenView, { attachTo: document.body, props: { open, kid, seed: 'l22' } })
}

function mountHandover(extra: Record<string, unknown> = {}): VueWrapper {
  setViewport(PHONE)
  const snapshot = toSnapshot(createWorld('l22-handover', DEFAULT_PROFILE))
  return mount(PrologueHandoverView, {
    attachTo: document.body,
    props: {
      axes: snapshot.radar,
      ageWord: ageInWords(14),
      base: coachBaseReadFor('ahead', 'l22'),
      read: coachReadFor('Huge potential', 'l22'),
      spentCents: 1234500,
      played: playedLine([{ outcome: 'final' }, { outcome: 'lost' }] as never),
      ...extra,
    },
  })
}

// --- 1. parity -------------------------------------------------------------------------------------------------

describe('L2-2 parity – the English the prologue shipped, anchor by anchor', () => {
  it('the age-5 card: kicker, title, scene, the two read lines, the question, the three origins, the way out', () => {
    const w = mountCard(PROLOGUE_CARDS[0]!)
    expect(w.get('#prologue-kicker').text()).toBe('She is five')
    expect(w.get('#prologue-title').text()).toBe('She can barely hold the racket.')
    expect(w.get('.prologue-lede').text()).toBe(
      'It is too big for her and she swings it like a shovel. She misses, and then she does it again, and she is still doing it twenty minutes later. Nobody has decided anything.',
    )
    expect(w.findAll('.prologue-read-line').map((p) => p.text())).toEqual([
      'She thinks the game is to hit the ball into the fence.',
      'Nobody is teaching her. She is five.',
    ])
    expect(w.get('#prologue-question').text()).toBe('Where does she grow up? It decides what the family can spend on tennis for the next nine years.')
    expect(w.findAll('.prologue-choice').map((b) => [b.get('.prologue-answer-label').text(), b.get('.prologue-answer-note').text()])).toEqual([
      ['A small town, and you both work.', 'There is nothing spare. Everything after this is a real decision.'],
      ['A city, and the bills are paid.', 'There is some room. Not a lot of it.'],
      ['Money is not the question in this house.', 'You still have to decide where she goes and who teaches her.'],
    ])
    expect(w.findAll('.prologue-dice').map((b) => b.attributes('aria-label'))).toEqual(['Random first name', 'Random last name'])
    expect(w.get('.prologue-skip').text()).toBe('Skip the childhood')
    w.unmount()
  })

  it('the way back, the quiet way on, and the proceed gate', () => {
    const six = mountCard(PROLOGUE_CARDS[1]!)
    expect(six.get('.prologue-back').attributes('aria-label')).toBe('Back')
    expect(six.get('#prologue-kicker').text()).toBe('She is six')
    expect(six.get('.prologue-answer-label').text()).toBe('Sign her up')
    six.unmount()
    const nine = mountCard(PROLOGUE_CARDS.find((c) => c.age === 9)!, { proceedLabel: WALK_COPY.proceed })
    expect(nine.get('.prologue-proceed').text()).toBe('Proceed')
    expect(nine.findAll('.prologue-choice .prologue-answer-label').map((b) => b.text())).toEqual(['Keep her in the group', 'Buy the hour, one to one'])
    nine.unmount()
  })

  it('the tournament question and the fork: the ask, its two answers, the folded reason, the other face', () => {
    const elevenCard = PROLOGUE_CARDS.find((c) => c.age === 11)!
    const eleven = mountCard(elevenCard, pickedOf(elevenCard))
    expect(eleven.get('.prologue-ask').text()).toBe('There is a Local Open in the spring, and the coach has mentioned it twice now – once to her, once to you.')
    expect(eleven.findAll('.prologue-choice .prologue-answer-label').slice(2).map((b) => b.text())).toEqual(['Put her name down', 'Not this year'])
    eleven.unmount()
    const twelveCard = PROLOGUE_CARDS.find((c) => c.age === 12)!
    const twelve = mountCard(twelveCard, { ...pickedOf(twelveCard), reason: readTwelfth(EMPTY_RUN).reason })
    expect(twelve.get('.prologue-reason').text()).toBe(
      'The years behind it: never a coach to herself, nothing entered, and no year left to look after itself.',
    )
    twelve.unmount()
    const more = mountCard(TWELFTH_WANTS_MORE, pickedOf(TWELFTH_WANTS_MORE))
    expect(more.get('#prologue-title').text()).toBe('She has asked you for more than she is getting.')
    expect(more.get('.prologue-ask').text()).toBe('She wants to enter the Local Open in the spring. She asked twice, on two different days.')
    more.unmount()
    // the thirteenth with the ask withdrawn shows its quiet way on; with the ask up that label is not drawn at all (`wayOn` in the card)
    const thirteen = mountCard(PROLOGUE_CARDS.find((c) => c.age === 13)!, { ask: undefined })
    expect(thirteen.get('.prologue-weight-title').text()).toBe('The weight')
    expect(thirteen.get('.prologue-answer-label').text()).toBe('Wait for the coach')
    thirteen.unmount()
    const asked = mountCard(PROLOGUE_CARDS.find((c) => c.age === 13)!)
    expect(asked.get('.prologue-ask').text()).toBe('She has written the date of the Local Open on the kitchen calendar herself.')
    asked.unmount()
  })

  it('the Local Open: the kicker, the draw line, the separator on both beats, the escape, the two controls', async () => {
    const w = mountOpen()
    expect(w.get('.plo-kicker').text()).toBe('The Local Open')
    expect(w.get('.plo-skip').text()).toBe('Skip the rest of the weekend')
    expect(w.get('.plo-facts').text()).toContain('8-player draw')
    expect(w.get('.plo-vs-mid').text()).toBe('vs')
    expect(w.get('.plo-go').text()).toBe('Begin')
    await w.get('.plo-go').trigger('click')
    expect(w.get('.scene-vs').text()).toBe('vs')
    expect(w.get('.plo-go').text()).toBe('Watch match')
    expect(localDrawLine(16)).toBe('16-player draw')
    w.unmount()
  })

  it('the result scenes and the counter-aware coach lines are the table the owner has not yet read', () => {
    expect(LOCAL_OPEN_COPY.result.won.title).toBe('She won it.')
    expect(LOCAL_OPEN_COPY.hurt.continueLabel).toBe('Hold her')
    expect(LOCAL_OPEN_COPY.hurtNote).toBe(
      'She is alright – worn out, nothing more. She sleeps the whole drive home, and in a few days she is asking to play again.',
    )
    expect(LOCAL_OPEN_COPY.coachAgain.pastFirstOnce).toBe('The coach says she got past the first one, and that is where it starts.')
    expect(TWELFTH_REASONS.sentence).toBe('The years behind it: {a}, {b}, {c}.')
  })

  it('the handover: kicker, title, the coach label, both read lines, the played line, the money lines, both controls', () => {
    const w = mountHandover()
    expect(w.get('#handover-kicker').text()).toBe('She is fourteen')
    expect(w.get('#handover-title').text()).toBe('This is the girl you raised.')
    expect(w.get('.handover-read-label').text()).toBe('The coach who has watched her')
    expect(w.get('.handover-read-base').text()).toBe(COACH_BASE_READS.ahead.find((l) => l === w.get('.handover-read-base').text()))
    expect(w.get('.handover-played').text()).toBe('She played two local tournaments, and she has been in a final.')
    expect(w.get('.handover-spent').text()).toMatch(/^Nine years of it cost you \$[\d,]+\. That is about \$[\d,]+ a week, every week of it\.$/)
    expect(w.findAll('.handover-answer').map((b) => b.text())).toEqual(['Go on with her', 'Start again'])
    expect(PLAYED_COPY.counts.length).toBe(9)
    expect(HANDOVER_COPY.coachLabel).toBe('The coach who has watched her')
    w.unmount()
  })
})

// --- 2. completeness -------------------------------------------------------------------------------------------

/** Every string leaf of a copy table, with the dotted path it lives at – `id`s, `focus` values and the two derived age lines are not copy. */
function leaves(table: unknown, path: string, into: [string, string][] = []): [string, string][] {
  if (typeof table === 'string') into.push([path, table])
  else if (Array.isArray(table)) table.forEach((x, i) => leaves(x, `${path}[${i}]`, into))
  else if (table && typeof table === 'object') {
    for (const k of Object.keys(table)) {
      if (k === 'id' || k === 'focus') continue
      leaves((table as Record<string, unknown>)[k], `${path}.${k}`, into)
    }
  }
  return into
}

describe('L2-2 completeness – every word the prologue prints is a wired key', () => {
  const tables: [string, unknown][] = [
    ['PROLOGUE_CARDS', PROLOGUE_CARDS],
    ['TWELFTH_WANTS_MORE', TWELFTH_WANTS_MORE],
    ['TWELFTH_REASONS', TWELFTH_REASONS],
    ['LOCAL_OPEN_COPY', LOCAL_OPEN_COPY],
    ['COACH_READS', Object.fromEntries(['Huge potential', 'Still room to grow', 'Close to her ceiling', 'At her ceiling'].map((b) => [b, COACH_READS[b]]))],
    ['COACH_BASE_READS', COACH_BASE_READS],
    // the two ageWord-bearing lines are formatter results (`She is {age}`), checked in their own arm below
    ['HANDOVER_COPY', { title: HANDOVER_COPY.title, coachLabel: HANDOVER_COPY.coachLabel, goOn: HANDOVER_COPY.goOn, startAgain: HANDOVER_COPY.startAgain }],
    ['WALK_COPY', WALK_COPY],
    ['PLAYED_COPY', PLAYED_COPY],
  ]
  const all = tables.flatMap(([name, table]) => leaves(table, name))

  it('the tables are walked for real, and each leaf is a wired key in the committed catalog', () => {
    expect(all.length, 'the walk reached the tables').toBeGreaterThan(200)
    const unwired = all.filter(([, text]) => CATALOG.keys[text]?.wrapped !== true).map(([path, text]) => `${path}: «${text}»`)
    expect(unwired, 'a prologue string without a `t()` call site – English would show under Russian').toEqual([])
  })

  it('the formatter lines are keys too, holes and all (the age and the money stay English params)', () => {
    for (const key of ['She is {age}', 'Where she is at {age}', 'Nine years of it cost you {amount}.', 'That is about {amount} a week, every week of it.', '{0}-player draw', 'vs', 'Back', 'Random first name', 'Random last name']) {
      expect(CATALOG.keys[key]?.wrapped, `«${key}»`).toBe(true)
    }
    const homes = (key: string): string[] => CATALOG.keys[key]!.home
    expect(homes('Back')).toContain('src/components/PrologueCard.vue')
    expect(homes('vs')).toContain('src/components/PrologueLocalOpen.vue')
    expect(homes('Proceed')).toContain('src/prologue/handover.ts')
  })
})

// --- 3. the dice do not know the language ----------------------------------------------------------------------

describe('L2-2 the coach draw is language-independent (invariant 2 applied to language)', () => {
  it('the same seed picks the same sentence in another language – 40 seeds, every band, both reads', async () => {
    const bands = ['Huge potential', 'Still room to grow', 'Close to her ceiling', 'At her ceiling']
    const base = ['ahead', 'level', 'behind'] as const
    const en: string[] = []
    for (let i = 0; i < 40; i++) {
      for (const b of bands) en.push(coachReadFor(b, `seed-${i}`))
      for (const b of base) en.push(coachBaseReadFor(b, `seed-${i}`))
    }
    await installPseudoLocale()
    const xx: string[] = []
    for (let i = 0; i < 40; i++) {
      for (const b of bands) xx.push(coachReadFor(b, `seed-${i}`))
      for (const b of base) xx.push(coachBaseReadFor(b, `seed-${i}`))
    }
    expect(xx.length).toBe(en.length)
    expect(xx).toEqual(en.map((line) => pseudoCatalog()[line]))
    expect(new Set(en).size, 'the draw really varies – the comparison is not vacuous').toBeGreaterThan(8)
    expect(COACH_READS['At her ceiling'], 'one shared array, as it always was').toBe(COACH_READS['Close to her ceiling'])
  })
})

// --- 4. the Russian smoke --------------------------------------------------------------------------------------

describe('L2-2 Russian smoke – an approved row renders his Russian, an unapproved one stays English and is counted', () => {
  /** What a key must read under `ru` right now: his value if the importer compiled one, the English otherwise. */
  const underRu = (key: string): string => RU[key] ?? key

  it('the age-5 card, the way back and the Local Open splash follow ru.json key by key', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    resetMisses()
    const card = mountCard(PROLOGUE_CARDS[0]!)
    expect(card.get('#prologue-kicker').text()).toBe(underRu('She is five'))
    expect(card.get('#prologue-title').text()).toBe(underRu('She can barely hold the racket.'))
    expect(card.findAll('.prologue-dice').map((b) => b.attributes('aria-label'))).toEqual([underRu('Random first name'), underRu('Random last name')])
    expect(card.get('.prologue-skip').text()).toBe(underRu('Skip the childhood'))
    card.unmount()
    const six = mountCard(PROLOGUE_CARDS[1]!)
    expect(six.get('.prologue-back').attributes('aria-label')).toBe(underRu('Back'))
    six.unmount()
    const open = mountOpen()
    expect(open.get('.plo-vs-mid').text()).toBe(underRu('vs'))
    expect(open.get('.plo-kicker').text()).toBe(underRu('The Local Open'))
    open.unmount()

    // a key is a miss exactly when ru.json has no value for it – the counter and the catalog agree
    const missed = new Set(missedKeys())
    for (const key of ['She is five', 'She can barely hold the racket.', 'Random first name', 'Skip the childhood', 'Back', 'vs', 'The Local Open', 'Sign her up']) {
      expect(missed.has(key), `«${key}»: ${RU[key] === undefined ? 'no row compiled, so it is a counted miss' : 'his row compiled, so it is not'}`).toBe(RU[key] === undefined)
    }
    const prologueKeys = all()
    const stillEnglish = prologueKeys.filter((k) => RU[k] === undefined).length
    console.log(`[L2-2 ru] ru.json holds ${Object.keys(RU).length} entries; of the ${prologueKeys.length} prologue keys exercised in this file's tables, ${prologueKeys.length - stillEnglish} compiled and ${stillEnglish} wait for his approval (counted misses, English shown)`)
  })

  it('the handover follows ru.json too, and a flip back to English restores the shipped words', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    const w = mountHandover()
    expect(w.get('#handover-title').text()).toBe(underRu('This is the girl you raised.'))
    expect(w.findAll('.handover-answer').map((b) => b.text())).toEqual([underRu('Go on with her'), underRu('Start again')])
    await setLocale('en')
    await flushPromises()
    expect(w.get('#handover-title').text(), 'a mounted screen follows the flip back').toBe('This is the girl you raised.')
    w.unmount()
  })

  it('⭐ the day he approves a row: a compiled value reaches the screen through the getters, holes filled – borrowed values, no Cyrillic typed', async () => {
    // No childhood-prologue row is APPROVED yet, so the "approved" branch is exercised with values BORROWED from ru.json (his own words for
    // other keys): the path under test is key -> catalog -> getter -> mounted text, and that path does not care whose word travels on it.
    const wealthy = RU['Wealthy']!
    installCatalog('ru', {
      ...RU,
      'She is five': RU['Home']!,
      Back: RU['nav|Stats']!,
      'Nine years of it cost you {amount}.': `${wealthy} {amount}`,
    })
    await setLocale('ru')
    resetMisses()
    const five = mountCard(PROLOGUE_CARDS[0]!)
    expect(five.get('#prologue-kicker').text(), 'a table getter reads the compiled value').toBe(RU['Home'])
    five.unmount()
    const six = mountCard(PROLOGUE_CARDS[1]!)
    expect(six.get('.prologue-back').attributes('aria-label'), 'a template attribute reads it too').toBe(RU['nav|Stats'])
    six.unmount()
    const handover = mountHandover()
    expect(handover.get('.handover-spent').text().startsWith(`${wealthy} $`), 'a formatter fills its {amount} hole with the money string').toBe(true)
    handover.unmount()
    expect(missedKeys(), 'the keys he "approved" are not misses').not.toContain('She is five')
    expect(missedKeys()).not.toContain('Back')
    expect(missedKeys()).not.toContain('Nine years of it cost you {amount}.')
    expect(missedKeys(), 'and a neighbour he did not is still counted').toContain('She is six')
  })

  it('⭐ a MOUNTED card follows the flip – the table is getters, and Vue must be tracking them: English, another language, English again', async () => {
    const key = 'She asks to go back to the court.'
    const w = mountCard(PROLOGUE_CARDS[1]!)
    expect(w.get('#prologue-title').text()).toBe(key)
    await installPseudoLocale()
    await flushPromises()
    expect(w.get('#prologue-title').text(), 'the title re-rendered when the catalog arrived').toBe(pseudoCatalog()[key])
    expect(w.get('.prologue-answer-label').text(), 'so did the quiet way on').toBe(pseudoCatalog()['Sign her up'])
    expect(w.get('.prologue-back').attributes('aria-label'), 'and the accessible name of the way back').toBe(pseudoCatalog()['Back'])
    await setLocale('en')
    await flushPromises()
    expect(w.get('#prologue-title').text()).toBe(key)
    w.unmount()
  })

  function all(): string[] {
    return [
      ...leaves(PROLOGUE_CARDS, 'c'),
      ...leaves(TWELFTH_WANTS_MORE, 't'),
      ...leaves(LOCAL_OPEN_COPY, 'l'),
    ].map(([, text]) => text)
  }
})

// --- 5. the xx sweep -------------------------------------------------------------------------------------------

describe('L2-2 xx sweep – no unwrapped literal on the prologue, and the phone still holds longer text', () => {
  const names = Object.values(COUNTRY_NAMES)

  it('all twelve card scenes: nothing is left unbracketed (country names and the typed name allow-listed)', async () => {
    await installPseudoLocale()
    const allow = [...exact(...names), ...exact(OPENING_IDENTITY.kidName, OPENING_IDENTITY.kidLastName, `${OPENING_IDENTITY.kidName} ${OPENING_IDENTITY.kidLastName}`)]
    for (const { name, card, extra } of everyScene()) {
      const w = mountCard(card, extra)
      expect(hardcodeLeaks(w.get('.prologue-card').element, allow), name).toEqual([])
      expect(w.get('#prologue-title').text(), `${name}: the title really went through the catalog`).toMatch(/^⟦/)
      w.unmount()
    }
  })

  it('the Local Open (splash and round beats) and the handover have no leak outside the radar, which is another batch', async () => {
    await installPseudoLocale()
    // ⚠ THE ROUND LABEL IS THE ONE ENGLISH WORD ON THIS SCREEN THAT IS NOT THIS BATCH'S: `stageLabel` (engine/world/labels.ts) builds `Quarterfinal`,
    // `Round of 16` … in the ENGINE and the career flow shares it, so RU02B-LO-F2…F6 wait for that formatter's own `cp` refactor (L3) – doc §13.2
    // says in as many words that parsing it back out in Vue would make English the hidden data model. Named here so it stays a boundary,
    // not a silent hole. The same holds for the surface word beside the draw line (`SurfaceMark` prints the engine's surface id, the
    // formatters-and-countries batch's) – both are allow-listed BY NAME, never by pattern-of-anything.
    const allow = [...exact(...names), /^Vera Novak$/, /^[A-Z][a-z]+ [A-Z][a-z]+$/, /^(?:Final|Semifinal|Quarterfinal|Round of \d+)$/, /^(?:hard|clay|grass|carpet)$/i]
    const open = mountOpen()
    expect(hardcodeLeaks(open.get('.plo-head').element, allow), 'splash header').toEqual([])
    expect(hardcodeLeaks(open.get('.plo-splash').element, allow), 'splash').toEqual([])
    await open.get('.plo-go').trigger('click')
    expect(hardcodeLeaks(open.get('.scene-grid').element, allow), 'round beat grid').toEqual([])
    expect(hardcodeLeaks(open.get('.tf-actions').element, allow), 'round beat actions').toEqual([])
    open.unmount()
    const handover = mountHandover()
    for (const sel of ['#handover-kicker', '#handover-title', '.handover-read', '.handover-played', '.handover-spent', '.handover-answers']) {
      expect(hardcodeLeaks(handover.get(sel).element, allow), sel).toEqual([])
    }
    handover.unmount()
  })

  it('the tightest cards keep their way out inside 375x667 with every word longer (numbers printed)', async () => {
    const measure = (label: string, mount: () => VueWrapper, card: string, answers: string): { label: string; wants: number; cap: number; scrolls: boolean } => {
      const w = mount()
      const fit = assertDismissReachable(document.querySelector(card)!, document.querySelector(answers)!, PHONE, label)
      w.unmount()
      return { label, wants: fit.contentFloor, cap: fit.cap, scrolls: fit.scrollable }
    }
    const scenes: [string, () => VueWrapper, string, string][] = [
      ['age 5 (identity + origins + skip)', () => mountCard(PROLOGUE_CARDS[0]!), '.prologue-card', '.prologue-answers'],
      ['age 12 (two answers + the ask + the reason)', () => mountCard(PROLOGUE_CARDS.find((c) => c.age === 12)!, { ...pickedOf(PROLOGUE_CARDS.find((c) => c.age === 12)!), reason: readTwelfth(EMPTY_RUN).reason, proceedLabel: WALK_COPY.proceed }), '.prologue-card', '.prologue-answers'],
      ['age 13 (the weight + the ask)', () => mountCard(PROLOGUE_CARDS.find((c) => c.age === 13)!), '.prologue-card', '.prologue-answers'],
      ['result: hurt (the longest scene)', () => mountCard(localOpenCard(10, 'lost', true), { ask: undefined }), '.prologue-card', '.prologue-answers'],
      ['the handover (both reads, played, money)', () => mountHandover(), '.handover-card', '.handover-answers'],
    ]
    const english = scenes.map(([label, m, card, answers]) => measure(label, m, card, answers))
    resetI18nForTests(null)
    await installPseudoLocale()
    const xx = scenes.map(([label, m, card, answers]) => measure(label, m, card, answers))
    console.log(
      '[L2-2 xx] 375x667, content floor / cap, English -> xx: ' +
        english.map((e, i) => `${e.label}: ${e.wants.toFixed(0)}/${e.cap === Infinity ? 'none' : e.cap.toFixed(0)}${e.scrolls ? ' scrolls' : ''} -> ${xx[i]!.wants.toFixed(0)}/${xx[i]!.cap === Infinity ? 'none' : xx[i]!.cap.toFixed(0)}${xx[i]!.scrolls ? ' scrolls' : ''}`).join(' · '),
    )
    // not vacuous: the longer text really is taller somewhere, and every scene stayed reachable (assertDismissReachable throws otherwise)
    expect(xx.some((x, i) => x.wants > english[i]!.wants), 'xx made no card taller – the measurement did not see the words').toBe(true)
  })
})

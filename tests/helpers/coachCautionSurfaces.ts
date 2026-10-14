// r51 №7 (13.10) – WHAT THE TWO HALVES OF THE COACH-CAUTION COMPONENT SUITE SHARE, written once. tests/component/i18n-r51-b4-coach-caution.test.ts was cut in two on 14.10 under the radar law (scripts/units.mjs: a file on birpc's 60 s wall is cut, not given a late-ack classifier); that file's header describes both halves.
//   · HERE: the Russian catalog (`RU`), the expectation built from its rows by hand (`expectedRu`, `namesIn`, `withoutNames`), the engine's own card (`aheadCard`), the same snapshot with ANOTHER ref posed on it (`posed`), the card as Season draws it (`cardOf`), and the lifecycle (`useCautionLifecycle`).
//   · NOT HERE: the table of four surfaces and the tired card, which only the original reads, and the posed refs, which only i18n-r51-b4-coach-caution-poses.test.ts reads – whatever one half alone uses stayed in that half, which is why SURFACES is not in a file named for it.
//
// ⚠ COMPONENT PROJECT ONLY, like mountSeason.ts: the lifecycle touches `document` and Pinia, and `installMemoryStorage` lives in tests/component/setup.ts – a unit test importing this would die on its first hook.
// ⚠ NO CYRILLIC IS TYPED HERE: every Russian expectation is read from the real src/i18n/ru.json by key. `RU` is exported because the original's tired-body arms read single rows from it directly.
import { afterEach, beforeEach, expect } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import { toSnapshot } from '../../src/engine/world'
import { TIERS } from '../../src/engine/season/calendar'
import { installCatalog, resetI18nForTests, setLocale } from '../../src/i18n'
import { renderCopyRef, SOURCE_LOCALE, type CopyRef } from '../../src/shared/i18n'
import type { Snapshot, UpcomingEvent } from '../../src/shared/protocol'
import { installMemoryStorage } from '../component/setup'
import { aheadPose, LEGACY, withCoach, type Pose } from './coachCautionPoses'

/** His Russian, as the importer compiled it. */
export const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>
const en = (c: CopyRef): string => renderCopyRef(c, { locale: SOURCE_LOCALE })
export const LATIN_WORD = /[A-Za-z]{2,}/

/** The lifecycle both halves run under, written once: a fresh memory storage, the locale unset, a new Pinia and an empty document before each test; the document emptied and the locale put back after. Call it at the top level of a test file, where vitest hangs the hooks on that file's own suite. */
export function useCautionLifecycle(): void {
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
}
export async function inRussian(): Promise<void> {
  installCatalog('ru', RU)
  await setLocale('ru')
}

// --- the expected Russian, built from the rows by hand ---------------------------------------------------------------

const LADDER_WORD: Record<string, string> = { national: RU['tile|National'] as string, international: RU['tile|International'] as string, professional: RU['tile|Professional'] as string }
const PAYS = 'Your coach says the {0} is the week – this pays {1} points, not the table she is climbing.'

/** One ref, spelled in Russian by substituting its holes into its row: a string hole is a name (raw) – except the table's word in `PAYS`, which is the catalog's compact word – and a nested ref is spelled the same way. The
 *  only row with a plural is the counted tail; its branch is picked with the platform's own Russian plural rules and the number put into it. */
export function expectedRu(ref: CopyRef): string {
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
export function namesIn(ref: CopyRef): string[] {
  return (ref.p ?? []).flatMap((h) => (typeof h === 'object' && h !== null ? namesIn(h) : typeof h === 'string' && !(h in LADDER_WORD) ? [h] : []))
}
export function withoutNames(text: string, names: string[]): string {
  return names.reduce((acc, name) => acc.split(name).join(' '), text)
}

// --- the cards ------------------------------------------------------------------------------------------------------

/** The owner's own sentence, engine-built: an elite coach, a W15 she has outgrown, a W75 three weeks on – «Your coach would save her for the W75 in 3 weeks.» */
export function aheadCard(): { snap: Snapshot; card: UpcomingEvent; ref: CopyRef; pose: Pose } {
  const pose = aheadPose(3)
  withCoach(pose.world, 'elite')
  const snap = toSnapshot(pose.world)
  const card = snap.upcoming.find((e) => e.id === pose.event.id)!
  expect(card.coachCautionC, 'precondition: the engine sent the ref beside the string').toBeDefined()
  expect(card.coachCaution).toBe(LEGACY.save(TIERS.w75.label, 3))
  return { snap, card, ref: card.coachCautionC!, pose }
}
/** The same snapshot with ANOTHER ref on that card – a posed caution, the card and everything else the engine's. */
export function posed(snap: Snapshot, id: string, ref: CopyRef | null): Snapshot {
  return {
    ...snap,
    upcoming: snap.upcoming.map((e) => {
      if (e.id !== id) return e
      const { coachCaution: _s, coachCautionC: _c, ...rest } = e
      return ref === null ? rest : { ...rest, coachCaution: en(ref), coachCautionC: ref }
    }),
  }
}

// --- the card as Season draws it ------------------------------------------------------------------------------------

export const cardOf = (w: VueWrapper, label: string) => {
  const hit = w.findAll('.event-card').find((c) => c.find('.event-tier').text().trim() === label)
  expect(hit, `Season draws a card for ${label}`).toBeTruthy()
  return hit!
}

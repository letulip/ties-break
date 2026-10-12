// r49 №3 (12.10.2026) – THE ALBUM SPEAKS TO THE DAUGHTER IN ONE VOICE. The owner, verbatim: «на
// русском у нас какой-то сильный рассинхрон в альбоме, то "она", то "ты/тебя", наверное надо всё
// на "ты/тебя" переформулировать». That word OVERRULES the Russian corpus doc's old §2 design
// («caption … usually она»): every Russian album string that refers to the daughter is second
// person – notes, captions and loose lines alike. The English corpus is untouched; its own register
// law (note = you, caption/line = she) still holds and is pinned in album-corpus-roundtrip.
//
// WHAT THIS FILE PINS: the COMPILED Russian – src/i18n/ru.json values of the album-corpus keys. The
// corpus joiner (tools/i18n-corpus-join.ts) keys every album cell by its live English string, so the
// key set is enumerated from the engine's own ALBUM_CORPUS and ALBUM_ARC, never retyped. A regex can
// only see pronouns, so the claim is mechanical: no whole-word она/её/неё/ей/ней/ею survives UNLESS
// the row is on the named allowlist below, where the pronoun's referent is provably not the daughter
// (a box, a cap, a sum, a phrase, a story). Every allowlist entry must still match – a stale entry
// is deleted, not accumulated.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { ALBUM_ARC, ALBUM_CORPUS } from '../src/engine/world/albumCorpus'

const RU = JSON.parse(readFileSync(fileURLToPath(new URL('../src/i18n/ru.json', import.meta.url)), 'utf8')) as Record<string, string>

/** Third-person feminine references, whole-word. ⚠ JS \b is ASCII-only, so the word boundary is
 *  spelled as Cyrillic-letter lookarounds; неё/ею are included because «У неё» is the same voice
 *  defect as «у ней» and the plain \bеё\b cannot see it. */
const THIRD = /(?<![а-яёА-ЯЁ])(она|её|неё|ей|ней|ею|нею)(?![а-яёА-ЯЁ])/i

/** The rows where a feminine pronoun legitimately survives because its referent is NOT the daughter.
 *  Each entry names the occasion, the row and the referent – the allowlist is the sweep's honesty. */
const ALLOWED: ReadonlyMap<string, string> = new Map([
  ['the-line · sunny · note', '«её» – мамина коробка, не дочь'],
  ['the-line · fiery · note', '«её» – коробка, не дочь'],
  ['the-line · deep · note', '«ней» – коробка, не дочь'],
  ['injury-return · deep · note', '«её» – первая неделя после возвращения, не дочь'],
  ['first-prize · fiery · note', '«её» – сумма, не дочь'],
  ['wedding · deep · note', '«её» – та одна фраза, не дочь'],
  ['graduated · sunny · note', '«её» – шапочка, не дочь'],
  ['graduated · sunny · caption', '«её» – шапочка, не дочь'],
  ['career-ended · sunny · note', '«её» – эта история, не дочь'],
  ['arc open · deep · note', '«её» – одна правдивая фраза, не дочь'],
])

const REGISTERS = ['note', 'caption', 'line'] as const
const ARC_REGISTERS = ['note', 'line'] as const

describe('r49 №3 – the Russian album is one voice: «ты/тебя», never «она» about the daughter', () => {
  it('⭐⭐ no compiled album string refers to the daughter in the third person', () => {
    const entries: { coord: string; en: string }[] = []
    for (const o of ALBUM_CORPUS) {
      // ⚠ r49 №7 – a voice is a pool of variant hands now; every variant is swept, coordinates
      // naming the ordinal from the second hand on (today every pool is 1, so no coord moved).
      for (const [voice, pool] of Object.entries(o.voices)) {
        for (const [k, hand] of pool.entries()) {
          for (const field of REGISTERS) entries.push({ coord: `${o.id} · ${voice}${k > 0 ? `#${k + 1}` : ''} · ${field}`, en: hand[field] })
        }
      }
    }
    for (const [direction, voices] of Object.entries(ALBUM_ARC)) {
      for (const [voice, hand] of Object.entries(voices)) {
        for (const field of ARC_REGISTERS) entries.push({ coord: `arc ${direction} · ${voice} · ${field}`, en: hand[field] })
      }
    }

    const offenders: string[] = []
    const used = new Set<string>()
    let checked = 0
    for (const { coord, en } of entries) {
      const ru = RU[en]
      if (ru === undefined) continue // a pending cell is the importer's business, not a voice defect
      checked++
      const reason = ALLOWED.get(coord)
      if (reason !== undefined) {
        used.add(coord)
        expect(ru, `${coord}: allowlisted (${reason}) but carries no pronoun any more – delete the stale entry`).toMatch(THIRD)
        continue
      }
      if (THIRD.test(ru)) offenders.push(`${coord} -> «${ru}» (key: ${en})`)
    }

    expect(offenders, 'third-person daughter references left in the compiled album Russian').toEqual([])
    // ⚠ Anti-vacuity: the whole corpus is translated as of r49 (472 of 472 – import report, 12.10).
    // Fewer checked strings means album Russian silently fell out of ru.json, not a smaller task.
    expect(checked, 'the compiled album Russian shrank below the 12.10 full-coverage mark').toBeGreaterThanOrEqual(472)
    expect([...ALLOWED.keys()].filter((k) => !used.has(k)), 'allowlist entries that matched no compiled row').toEqual([])
  })

  it('⭐ the album screen\'s chrome speaks the same voice: chapter tab and art alt texts', () => {
    // The owner's «рассинхрон» is what the SCREEN shows, and the album page interleaves handwriting
    // with the chapter rail and the art's alt texts (keyed in ru-stats-trophies-album-2026-10.md).
    // Trophy-cabinet and ranking rows are NOT the album and keep their she-voice.
    for (const en of ['Growing up', 'Her farewell match', 'Her first days on a court', 'Her wedding day', 'Her, that week']) {
      const ru = RU[en]
      expect(ru, `«${en}» is missing from ru.json`).toBeTypeOf('string')
      expect(ru, `«${en}» -> «${ru}»: the album chrome still speaks of the daughter in the third person`).not.toMatch(THIRD)
    }
  })
})

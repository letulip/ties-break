// L4-3 – THE PRIVACY ROUTE AND THE MANIFEST DECISION (RU-13C, technical half).
//
// Two decisions, one file, because both are «the mechanism exists and the Russian slot is empty until his rows land»:
//
//   1. THE ROUTE (src/composables/privacyRoute.ts): the About row's link is locale-aware. Today every locale opens the English document –
//      byte for byte the URL the row has always had – because the Russian policy is a DRAFT and a draft of a legal text is not served.
//      The day `PRIVACY.ru.md` exists the slot names it; until then these nets fail on a half-done landing in either direction.
//   2. THE MANIFEST: ONE static manifest for both languages. The product mark is English by ruling (spec §9.5, his №5), the description is
//      the deferred L4 item (§9.9c: he asked for a proposal, and said it may wait if it is not critical) and is NOT filled here, and the
//      document's static language stays `en` – the live `<html lang>` is set by src/i18n/locale.ts on boot and on every switch.
//
// MUTATION ARMS (watched red): (a) `ru: 'PRIVACY.ru.md'` with no file -> «a named document exists»; (b) a PRIVACY.ru.md dropped at the
// root with the slot left null -> «no unserved document»; (c) the Russian slot pointed at `PRIVACY.md` -> «a Russian text, not the English
// file»; (d) a Cyrillic character in the manifest block -> the manifest arm.
import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { LOCALES } from '../src/i18n/locale'
import { PRIVACY_BASE_URL, PRIVACY_DOCS, PRIVACY_DOC_EN, privacyDoc, privacyUrl } from '../src/composables/privacyRoute'
import { region } from './helpers/source'

const root = new URL('../', import.meta.url)
const text = (path: string): string => readFileSync(new URL(path, root), 'utf8')
const CYRILLIC = /[\u0400-\u04FF]/

describe('the privacy route', () => {
  it('the English link is the URL the About row has always had, byte for byte', () => {
    expect(privacyUrl('en')).toBe('https://github.com/letulip/ties-break/blob/main/PRIVACY.md')
    expect(PRIVACY_BASE_URL + PRIVACY_DOC_EN).toBe(privacyUrl('en'))
  })

  it('every locale has a slot, and an empty one serves the English document unchanged (the Russian slot is empty today)', () => {
    expect(Object.keys(PRIVACY_DOCS).sort()).toEqual([...LOCALES].sort())
    for (const l of LOCALES) {
      if (PRIVACY_DOCS[l] === null) expect(privacyUrl(l), `${l}: an empty slot is the English document`).toBe(privacyUrl('en'))
    }
    expect(privacyDoc('ru')).toBe(PRIVACY_DOCS.ru ?? PRIVACY_DOC_EN)
  })

  it('a named document exists at the repo root, and for a non-English locale it is a Russian text that is not the English file', () => {
    for (const l of LOCALES) {
      const doc = PRIVACY_DOCS[l]
      if (doc === null) continue
      expect(existsSync(new URL(doc, root)), `${l}: ${doc} is named by the slot and missing`).toBe(true)
      if (l === 'ru') {
        expect(doc).not.toBe(PRIVACY_DOC_EN)
        expect(CYRILLIC.test(text(doc)), `${doc} must be the Russian document`).toBe(true)
        expect(text(doc)).not.toBe(text(PRIVACY_DOC_EN))
      }
    }
  })

  it('no PRIVACY.<locale>.md sits at the root unserved – a document nobody links is a draft in the wrong place', () => {
    const stray = readdirSync(root).filter((f) => /^PRIVACY\.[a-z]+\.md$/.test(f) && !Object.values(PRIVACY_DOCS).includes(f))
    expect(stray).toEqual([])
  })

  it('the About row asks the route, with the reactive locale, and still names the document it surfaces', () => {
    const more = text('src/components/screens/MoreScreen.vue')
    expect(more).toMatch(/:href="privacyUrl\(locale\)"/)
    expect(more).not.toMatch(/href="https:\/\/github\.com\/letulip\/ties-break\/blob\/main\/PRIVACY\.md"/)
    expect(more).toContain('PRIVACY.md') // tests/legal-assets.test.ts's pin: the screen is still the policy URL's surface
  })
})

describe('the manifest decision – one static manifest, the product mark in English', () => {
  const config = text('vite.config.ts')
  const manifest = region(config, 'manifest: {', 'workbox: {')

  it('carries the approved product mark and no Cyrillic: the one file serves both languages', () => {
    expect(manifest).toContain("name: 'Ties Break: Ace Parent'")
    expect(manifest).toContain("short_name: 'Ties Break'")
    expect(CYRILLIC.test(manifest)).toBe(false)
  })

  it('declares no language of its own and no second manifest exists', () => {
    expect(manifest).not.toMatch(/\blang\s*:/)
    expect(config.match(/manifest\s*:\s*\{/g) ?? []).toHaveLength(1)
  })

  it('the static document starts in English and keeps the neutral title – the live <html lang> is the locale layer\'s, set on boot and on every switch', () => {
    const html = text('index.html')
    expect(html).toMatch(/<html lang="en">/)
    expect(html).toMatch(/<title>Ties Break<\/title>/)
    expect(CYRILLIC.test(html)).toBe(false)
    expect(text('src/i18n/locale.ts')).toMatch(/document\.documentElement\.lang = HTML_LANG\[next\]/)
  })
})

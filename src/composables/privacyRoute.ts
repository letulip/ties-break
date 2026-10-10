// THE PRIVACY ROUTE – WHICH DOCUMENT THE ABOUT ROW OPENS, BY LANGUAGE (L4-3, RU-13C §3.1).
//
// The About tab's «Privacy note» link is the app's whole privacy route: there is no in-app policy page, and `PRIVACY.md` at the repo
// root is the single source (and the policy URL portals ask for). RU-13C's rule for the Russian build is «the Russian link must lead to
// the Russian policy, and the English link keeps leading to the English one». This module is that rule as a mechanism, not as copy.
//
// ⚠ THE RUSSIAN SLOT IS EMPTY ON PURPOSE, AND THE ROUTE SERVES THE ENGLISH DOCUMENT UNCHANGED UNTIL IT IS FILLED. `docs/localization/
// ru-privacy-pwa-2026-10.md` holds a DRAFT of the policy; no row of it is approved, and a policy is a legal text – a draft of it must
// not be served as the policy, and an English one with a «not translated yet» label would be new copy nobody asked for (invariant 4).
// So `PRIVACY_DOCS.ru` is `null`, `privacyUrl('ru')` equals `privacyUrl('en')` byte for byte, and nothing a player sees changes.
//
// ⚠ HOW THE SLOT IS FILLED, AND WHAT KEEPS IT HONEST. When his policy rows are APPROVED, a builder writes `PRIVACY.ru.md` FROM THOSE ROWS
// (compiled, not authored) and sets the slot to that file name – one line here. `tests/i18n-l4-3-privacy-route.test.ts` pins both
// halves: a named document must exist at the repo root and must be a Russian text that is not the English file, and a `PRIVACY.<locale>.md`
// at the root that no slot names fails too, so a document cannot sit unserved and a slot cannot name one that is missing.
//
// ⚠ PURE AND LEAF: no Vue, no store, and the locale arrives as an argument, so the screen passes the reactive one and a test passes a string.
import type { Locale } from '../i18n/locale'

/** Where the documents live: the repo root, on the default branch – the URL portals and the About row have always used. */
export const PRIVACY_BASE_URL = 'https://github.com/letulip/ties-break/blob/main/'

/** The English document: the fallback for every locale whose slot is empty, and the only one that exists today. */
export const PRIVACY_DOC_EN = 'PRIVACY.md'

/** One slot per locale. `null` = no document of its own yet – the route serves `PRIVACY_DOC_EN`. */
export const PRIVACY_DOCS: Readonly<Record<Locale, string | null>> = {
  en: PRIVACY_DOC_EN,
  ru: null,
}

export function privacyDoc(locale: Locale): string {
  return PRIVACY_DOCS[locale] ?? PRIVACY_DOC_EN
}

export function privacyUrl(locale: Locale): string {
  return `${PRIVACY_BASE_URL}${privacyDoc(locale)}`
}

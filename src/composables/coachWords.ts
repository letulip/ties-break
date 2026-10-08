// THE COACH TIER'S WORDS, ON THE UI SIDE (L2-5, RU-05 §13 «Coach tiers and fit»).
//
// `COACH_TIER_LABEL` lives in `engine/coach.ts`, which the engine imports and which therefore can never call `t()` (CLAUDE.md invariant 1).
// The profile's coach tile and the Coach Market both PRINT these words, so the UI reads them through a table of getters over `t()` – the
// shape every L2-n table has (`Record<…, string>` keeps its type, the words follow the locale on the next render). The engine's table is
// left exactly where it is and stays the English source: `tests/component/i18n-l2-5-profile-coaching.test.ts` pins this table to it, word
// for word, in English – a tier renamed engine-side cannot drift from the screen without that test saying so.
//
// ⚠ `coach|Budget` carries a context tag and the other four do not: `Budget` is also the Money screen's section heading (a noun), while the tier
// is an adjective (RU-05 §13), so the two want different Russian words. The other four were measured against every batch table and have one each.
import { t } from '../i18n'
import type { CoachTier } from '../shared/protocol'

export const COACH_TIER_WORD: Record<CoachTier, string> = {
  get self() {
    return t('Self-coached')
  },
  get budget() {
    return t('coach|Budget')
  },
  get middle() {
    return t('Middle')
  },
  get high() {
    return t('High')
  },
  get elite() {
    return t('Elite')
  },
}

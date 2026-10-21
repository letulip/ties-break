// ⭐ R53 №2 (21.10) – HIS NAME, AND THE WEEK THE PARENT HEARS IT. Spec:
// docs/specs/partner-name-disclosure-2026-10.md (§3 the contract, §5 the owner's answers).
//
// ⚠ A LEAF THE HUB IMPORTS, AND THEREFORE ONE THAT NEVER IMPORTS THE HUB (A-06's direction, and
// `tests/import-cycles.test.ts` refuses the cycle): every reader below takes the world and the row and
// touches the episode directly. The words live in `./partnerNameCopy`; `wedding.ts` re-exports the pool.
//
// ⚠⚠ ZERO MAIN DRAWS. The name is the v83 draw on `seed:life:partner-name:<episodeId>` – the SAME key,
// moved from the engagement to the row's creation, so a row that reaches the engagement carries the
// name it always would have. Road 3's coin is its own sub-stream, `seed:partnername:<episodeId>:<period>`,
// re-derived at the call site and persisting nothing (invariant 2).
import { pickInt, rngFromSeed } from '../../rng'
import { ECONOMY } from '../../economy'
import { bondBandOf, type Temperament } from '../../spirit'
import { cp, type CopyRef } from '../../../shared/i18n'
import { addEvent } from '../ledger'
import { activeEpisode, loveEpisodesOf } from '../loveEpisodes'
import { metRegisterOf } from './metCopy'
import { ASK_LATER, ASK_NAMED, INSIST_NAMED, INSIST_REFUSED, MET_NAMES_HIM, NAMED_LATER, PRESS_NAMES_HIM, nameRef, withName } from './partnerNameCopy'
import type { BondBand, LifeBeatFollowUp, LifeBeatRecord, LoveEpisode } from '../../../shared/protocol/narrative'
import type { WorldState } from '../state'

/** ⚠ ⚠ DRAFT – THE POOL, ≥ 24 FICTIONAL FIRST NAMES AND NOT ONE SURNAME ANYWHERE IN THE WAVE,
 *  so no real person's name is CONSTRUCTIBLE…
 *
 *  ⚠ PARTNER_NAME_POOL: SINGLE TOKENS ONLY – no spaces, no initials – which is what keeps «no surname» a property a test can assert rather…
 *  ⚠ PARTNER_NAME_POOL: APPEND-ONLY once shipped, `SURNAMES`' own law and for the weaker of its two reasons only…
 *  → docs/notes/life-beats/wedding.md#partner_name_pool--draft--the-pool--24-fictional-first-names
 */
export const PARTNER_NAME_POOL: readonly string[] = [
  'Anton', 'Bruno', 'Casper', 'Daniel', 'Elias', 'Felix', 'Gabriel', 'Henrik',
  'Ivo', 'Jonas', 'Karel', 'Lukas', 'Matteo', 'Niko', 'Oskar', 'Pavel',
  'Rafael', 'Samuel', 'Tomas', 'Viktor', 'Willem', 'Xavier', 'Yann', 'Zeno',
  'Andrei', 'Marco', 'Ruben', 'Stefan',
]

/** ⭐⭐⭐ v83 T6's ONE DERIVATION FUNCTION, landed with T3 because the engagement is its one call
 *  site: WHO SHE IS MARRYING, drawn uniformly on `seed:life:partner-name:<episodeId>` – the…
 *
 *  ⚠⚠ partnerNameFor: CALLED EXACTLY ONCE PER EPISODE, AT THE ENGAGEMENT, AND THE RESULT IS PERSISTED (`LoveEpisode.partnerName`)
 *  ⚠ partnerNameFor: `pickInt` over the whole pool – uniform, one draw, `drawPartnerWants`' own shape.
 *  → docs/notes/life-beats/wedding.md#partnernamefor--v83-t6s-one-derivation-function-landed-with-t3
 */
export function partnerNameFor(seed: string, episodeId: string): string {
  const r = rngFromSeed(`${seed}:life:partner-name:${episodeId}`)
  return PARTNER_NAME_POOL[pickInt(r, 0, PARTNER_NAME_POOL.length - 1)]
}

/** ⭐ The numbers of §3.2, in one place. ⚠ DRAFT values – the architect's (§3.2 road 2, his «как сам
 *  считаешь») and the spec's (road 3); benched in §4. */
export const PARTNER_NAME = {
  /** road 3's period – `COACH_FEEL.periodWeeks`' own four weeks, «как у чувства к тренеру» */
  periodWeeks: 4,
  /** road 3's chance per period, by the bond band that week. ⚠ cold is a literal 0: a cold home hears
   *  the name from the papers (road 4) or at the engagement, never from her (§5 answer 2). */
  perPeriod: { close: 0.5, steady: 0.2, strained: 0.05, cold: 0 } as Readonly<Record<BondBand, number>>,
  /** road 2's price: half the worst big-beat answer, a tenth of a band (§3.2 road 2). */
  insistBond: -2,
} as const

/** The two answers road 1 and road 2 add to the «there is someone» card. */
export const ASK_ID = 'ask'
export const INSIST_ID = 'insist'

/** Has the parent been told his name? ⚠ `!= null` on purpose: absent on a hand-built row is «no». */
export function nameKnown(episode: LoveEpisode): boolean {
  return episode.nameKnownWeek !== undefined && episode.nameKnownWeek !== null
}

/** The ONE writer of `nameKnownWeek`: the name (drawn now only for a row older than §3.1) and the week
 *  he heard it. Idempotent – a second road changes nothing. */
export function learnPartnerName(world: WorldState, episode: LoveEpisode): void {
  episode.partnerName ??= partnerNameFor(world.seed, episode.id)
  if (!nameKnown(episode)) episode.nameKnownWeek = world.week
}

function bandNow(world: WorldState): BondBand {
  return bondBandOf(world.bond ?? ECONOMY.bond.start)
}

function metEpisode(world: WorldState, row: LifeBeatRecord): LoveEpisode | null {
  return row.kind === 'met' ? loveEpisodesOf(world).find((e) => e.id === row.detail) ?? null : null
}

/** Road 1 at close, the week of the card: she names him in her own line. Called right after
 *  `deliverKnownPartner` (phaseHerWeek), and it acts only if that call raised a `'met'` row this week. */
export function nameAtMet(world: WorldState): void {
  if (bandNow(world) !== 'close') return
  for (const row of world.lifeLog ?? []) {
    if (row.kind !== 'met' || row.week !== world.week) continue
    const episode = metEpisode(world, row)
    if (episode !== null) learnPartnerName(world, episode)
  }
}

/** Her naming sentence on the card – only where she speaks in her own voice (`metRegisterOf`'s `her`
 *  rung, the close band) and only once the parent holds the name. */
function metNameSuffix(world: WorldState, row: LifeBeatRecord, voice: Temperament): { text: string; c: CopyRef } | null {
  const episode = metEpisode(world, row)
  if (episode === null || !nameKnown(episode) || episode.partnerName === null) return null
  if (metRegisterOf(bandNow(world)) !== 'her') return null
  const c = MET_NAMES_HIM[voice](nameRef(episode.partnerName))
  return { text: withName(c, episode.partnerName), c }
}

/** The card's line with her naming sentence after it (identity for every other kind and row). */
export function metNamed(world: WorldState, row: LifeBeatRecord, voice: Temperament, said: string): string {
  const suffix = metNameSuffix(world, row, voice)
  return suffix === null ? said : `${said} ${suffix.text}`
}

/** `metNamed` undone – the pool line the hub's `withRefs` refs. */
export function metUnnamed(world: WorldState, row: LifeBeatRecord, voice: Temperament, said: string): string {
  const suffix = metNameSuffix(world, row, voice)
  return suffix === null ? said : said.slice(0, said.length - suffix.text.length - 1)
}

/** `metNamed`'s twin for the ref: `{0} {1}` over the pool line's ref and the naming sentence's. */
export function metNamedRef(world: WorldState, row: LifeBeatRecord, voice: Temperament, said: CopyRef): CopyRef {
  const suffix = metNameSuffix(world, row, voice)
  return suffix === null ? said : cp`${said} ${suffix.c}`
}

/** The card's answers: `ask` and `insist` only while the name is still unknown – a girl who has just
 *  said it is not asked it. Every other kind is untouched. The engine re-validates against THIS list. */
export function metNameOptions<T extends { id: string }>(world: WorldState, row: LifeBeatRecord, options: T[]): T[] {
  const episode = metEpisode(world, row)
  if (episode === null || !nameKnown(episode)) return options
  return options.filter((o) => o.id !== ASK_ID && o.id !== INSIST_ID)
}

/** Does this answer, at this band, get the name? Road 1: asking works at close and steady; road 2:
 *  insisting works at every band but cold. */
function answerNames(optionId: string, band: BondBand): boolean {
  if (optionId === ASK_ID) return band === 'close' || band === 'steady'
  if (optionId === INSIST_ID) return band !== 'cold'
  return false
}

/** Her reply to `ask` / `insist`, read with the same band the answer will be judged by. */
export function metNameFollowUps(world: WorldState, row: LifeBeatRecord, voice: Temperament, done: string): LifeBeatFollowUp[] {
  const episode = metEpisode(world, row)
  if (episode === null || nameKnown(episode)) return []
  const band = bandNow(world)
  const name = episode.partnerName ?? partnerNameFor(world.seed, episode.id)
  const reply = (optionId: string): LifeBeatFollowUp => {
    const named = answerNames(optionId, band)
    const c = optionId === ASK_ID
      ? (named ? ASK_NAMED[voice](nameRef(name)) : ASK_LATER[voice])
      : (named ? INSIST_NAMED[voice](nameRef(name)) : INSIST_REFUSED[voice])
    const text = withName(c, name)
    return { optionId, said: [text], saidC: [c], done }
  }
  return [reply(ASK_ID), reply(INSIST_ID)]
}

/** `answerLifeBeat`'s hook, called BEFORE the bond delta lands so the band is the one her reply was
 *  read with. The price itself is the option's `bond` – this writes the name and nothing else. */
export function nameOnAnswer(world: WorldState, row: LifeBeatRecord, optionId: string): void {
  const episode = metEpisode(world, row)
  if (episode !== null && answerNames(optionId, bandNow(world))) learnPartnerName(world, episode)
}

/** Road 3's chance for a band – exported for the bench and the rate pin. */
export function namePeriodChance(band: BondBand): number {
  return PARTNER_NAME.perPeriod[band]
}

/** Road 3's coin for one period of one episode – its own sub-stream, nothing persisted. */
export function drawNameThisPeriod(seed: string, episodeId: string, period: number, band: BondBand): boolean {
  const chance = namePeriodChance(band)
  return chance > 0 && rngFromSeed(`${seed}:partnername:${episodeId}:${period}`)() < chance
}

/** ⭐ Road 3 – «позже само». Once a period after the parent knows of him (`knownWeek`), while the name
 *  is still unknown, she may say it: a kept life row in the parent's voice (the call from college). */
export function rollPartnerName(world: WorldState, college: boolean): void {
  const episode = activeEpisode(world)
  if (episode === null || nameKnown(episode) || episode.knownWeek === null) return
  const since = world.week - episode.knownWeek
  if (since <= 0 || since % PARTNER_NAME.periodWeeks !== 0) return
  if (!drawNameThisPeriod(world.seed, episode.id, since / PARTNER_NAME.periodWeeks, bandNow(world))) return
  learnPartnerName(world, episode)
  const c = NAMED_LATER[college ? 'college' : 'home'](nameRef(episode.partnerName!))
  addEvent(world, { week: world.week, type: 'life', keep: true, lifeKind: 'met', text: withName(c, episode.partnerName!), c })
}

/** ⭐ Road 4 – the press names him, at any band. ⚠ EVERY GATE IS THE CALLER'S – `pressNamesPartnerAt` in
 *  `booth.ts`, the module that owns the public fields (the tier, the standing, `publicWeek`). */
export function pressNamesPartner(world: WorldState, episode: LoveEpisode): void {
  if (nameKnown(episode)) return
  learnPartnerName(world, episode)
  const c = PRESS_NAMES_HIM(nameRef(episode.partnerName!))
  addEvent(world, { week: world.week, type: 'life', keep: true, lifeKind: 'met', text: withName(c, episode.partnerName!), c })
}

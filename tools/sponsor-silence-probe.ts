/**
 * sponsor-silence-probe – WHY WAS THE POST EMPTY? One winter at a time, one rung at a time.
 *
 * MEASUREMENT ONLY (round 42 #16). This file imports the engine read-only, changes no constant,
 * re-bases nothing and ships no fixture. It exists to answer ONE question the sponsor benches do
 * not ask: `tools/sponsor-window-bench.ts` counts HOW OFTEN a winter passes with a clear ladder and
 * no letter, and `tools/sponsor-ladder-reach.ts` counts WHICH RUNGS a career ever reaches – neither
 * of them names the SILENCER on a particular winter of a particular career, which is what the owner
 * asked for.
 *
 * THE OWNER, 14.09: «За всё время до 18 пришёл 1 спонсор на 40к на год, сейчас #126 и нет никого.
 * Надо проверить систему.»
 *
 * WHAT IT PRINTS, per winter: her standing, which rungs `standingClears` would have, which of them
 * `windowLadder` seats, and then – for every rung that wrote nothing – the FIRST gate in
 * `raiseKitOffers`' own order that stopped it:
 *
 *     not cleared -> not seated -> already written -> turned away -> no terms -> the dice
 *
 * The dice are printed as numbers (`shopWritesAt`'s own draw against `offerChanceFor`'s chance), so
 * "the dice" is never a shrug: a winter silenced by luck says so with the roll that did it.
 *
 * ⭐ AND IT AUDITS THE ONE THING THAT WOULD MAKE THIS A DEFECT. `rungTurnedAway` mutes every rung at
 * or below a running deal's own for as long as that deal covers the season ahead. The spec's law –
 * «nothing may be offered that cannot be honoured» – cuts the other way too: nothing HONOURABLE may
 * be muted. §C below prints, for every mute, the running deal's actual covered span against the
 * season the mute applies to, and flags any mute that falls outside it.
 *
 * ⚠ THE SAVES ARE PERSONAL AND ARE NEVER COMMITTED, and neither is any fixture built from one –
 * `tools/real-vs-bench.ts`' law, one probe along. The human arm reads a `.tsave` handed to it on the
 * command line through the game's OWN import door (`decodeExportFile`), so the world it reads is the
 * world the player played, migrated up the same ladder a real load runs. What leaves this tool is
 * DERIVED NUMBERS ONLY.
 *
 * ⚠ AND THE SAVE ARM IS A RECONSTRUCTION WHERE IT SAYS IT IS. `pruneResults` keeps a rolling 52
 * weeks, so the standings of past winters cannot be re-folded; what survives is
 * `world.seasonHistory[].byTrack[].endRank`, banked by the season wrap. The wrap runs two weeks
 * AFTER the window opens, so a reconstructed standing is her rank at the season's END and not at the
 * letter's own Monday – the two differ only when a rank moved inside the off-season, which carries
 * no tournament. Every reconstructed line is marked `~`. The `--seed` arm has no such gap: it walks
 * the career and reads the standing the review itself would read, on the letter's own week.
 *
 * ⚠⚠ AND THE TWO ARMS ANSWER TWO HALVES, WHICH IS WHY BOTH EXIST. The walked arm never SIGNS
 * anything – `stepCareerWeek` is an entry policy, not a parent, so every letter it raises expires –
 * so it shows the POST in full (every rung, every roll, nothing suppressed) and §C is structurally
 * empty on it: with no contract running, `rungTurnedAway` can never fire. The save arm is the only
 * one that exercises the mute, because it is the only one with a parent's signatures in it.
 *
 * Run:
 *   npx vite-node tools/sponsor-silence-probe.ts -- --save /path/career.tsave
 *   npx vite-node tools/sponsor-silence-probe.ts -- --seed <seed> --weeks 420
 *   npx vite-node tools/sponsor-silence-probe.ts -- --ages          # the age audit alone
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import { createWorld, type WorldState } from '../src/engine/world'
import { POLICIES, stepCareerWeek } from './econ-bench'
import { DEFAULT_PROFILE, type CoachTier, type FamilyBackground, type PlayerProfile } from '../src/shared/protocol'
import { rngFromSeed } from '../src/engine/rng'
import { sponsorStandingOf } from '../src/engine/world/sponsors'
import { kidAgeAt } from '../src/engine/world/age'
import {
  AD_CATEGORIES,
  SPONSOR_TIERS,
  SPONSOR_LETTER_WEEKS,
  adBandFor,
  adFeeFor,
  adJuniorOpen,
  adSpokenFor,
  adWritesAt,
  coveredSeasonStart,
  isSponsorWindowWeek,
  kitOfferId,
  offerChanceFor,
  rungStrength,
  seasonSpokenFor,
  sponsorWindowClosesAt,
  sponsorWindowOpensAt,
  standingClears,
  windowLadder,
  type SponsorStanding,
} from '../src/engine/offers'
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { Offer, KitOfferTerms, AdOfferTerms, SponsorTier } from '../src/shared/protocol'

// -------------------------------------------------------------------------------------------------
// The arguments
// -------------------------------------------------------------------------------------------------

const argv = process.argv.slice(2)
const flag = (name: string): string | undefined => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 ? argv[i + 1] : undefined
}
const savePath = flag('save')
const seed = flag('seed')
const weeks = Number(flag('weeks') ?? 420)
const agesOnly = argv.includes('--ages')

const usd = (cents: number): string => `$${(cents / 100).toLocaleString('en-US')}`

// -------------------------------------------------------------------------------------------------
// §D  THE AGE AUDIT – his separate ruling («надо, чтобы контракты работали с 16»)
// -------------------------------------------------------------------------------------------------

/** Every family of sponsor money in the game and the age gate it holds, read off the catalogue
 *  rather than off a comment. A family whose gate is not 16 (or absent) is the build the round's
 *  ruling asks for; a family whose gate IS 16 is the verification. */
function printAgeAudit(): void {
  const ad = ECONOMY.advertising
  console.log('\n===== D. THE AGE AUDIT – which sponsor family still holds an 18 =====\n')
  console.log('  family                       gate                       source')
  console.log('  ---------------------------  -------------------------  ------------------------------------')
  for (const tier of SPONSOR_TIERS) {
    console.log(
      `  kit ladder: ${tier.padEnd(17)}  no age term (standing only)  ECONOMY.sponsorship.${tier}`,
    )
  }
  console.log(
    `  advertising (all categories)  from age ${String(ad.fromAgeYears).padEnd(16)} ECONOMY.advertising.fromAgeYears`,
  )
  console.log(
    `    └ junior band               [${ad.fromAgeYears}, ${ad.junior.untilAgeYears}): cheque x${(ad.junior.feeBps / 10_000).toFixed(2)}, arrivals x${(ad.junior.chanceBps / 10_000).toFixed(2)}, categories [${ad.junior.categories.join(', ')}]`,
  )
  console.log(`  apparel bond (kit via ad)     the kit rung's, no age term  offers.ts apparelBondLetter`)
  console.log(
    `\n  ⚠ ECONOMY.kidShare.fromAgeYears = ${ECONOMY.kidShare.fromAgeYears} is HER PRIZE SPLIT and not a sponsor gate –`,
  )
  console.log('    named here because it is the only 18 left anywhere near this money, and it is a')
  console.log('    different mechanic (what she keeps of a tournament cheque).')
}

// -------------------------------------------------------------------------------------------------
// §A  THE PAPER TRAIL
// -------------------------------------------------------------------------------------------------

function kitTerms(o: Offer): KitOfferTerms {
  return o.terms as KitOfferTerms
}

/** What a kit deal is worth over one season, in cents – the number the owner counts in when he says
 *  «спонсор на 40к на год». `retainerCents` is a QUARTERLY figure (ECONOMY.sponsorship.tour's own
 *  comment: «$1,500 a quarter = $6,000 a season»), so the season figure is x4. The appearance fee is
 *  per qualifying event and is printed separately rather than multiplied by a guess. */
function seasonWorthCents(t: KitOfferTerms): number {
  return (t.retainerCents ?? 0) * 4 + (t.kitAllowanceCents ?? 0)
}

function printPaperTrail(world: WorldState): void {
  console.log('\n===== A. THE PAPER TRAIL – every kit letter this save still holds =====\n')
  const kit = world.offers.filter((o) => o.kind === 'kit').sort((a, b) => a.week - b.week)
  if (kit.length === 0) {
    console.log('  (none)')
    return
  }
  console.log('  week  age   kind      state    rung      term  covers        season worth   appearance')
  console.log('  ----  ----  --------  -------  --------  ----  ------------  -------------  ----------')
  for (const o of kit) {
    const t = kitTerms(o)
    const kind = o.id.startsWith('kit-bond-')
      ? 'bond'
      : o.id.startsWith('kit-renew-')
        ? 'renewal'
        : o.id.startsWith('kit-end-')
          ? 'goodbye'
          : 'ladder'
    const covers = o.state === 'signed' ? `w${o.fromWeek ?? o.week}-w${o.untilWeek ?? -1}` : '–'
    const app = t.appearanceFeeCents ? `${usd(t.appearanceFeeCents)}/ev` : '–'
    console.log(
      `  ${String(o.week).padStart(4)}  ${kidAgeAt(world, o.week).toFixed(1).padStart(4)}  ${kind.padEnd(8)}  ${o.state.padEnd(7)}  ${(t.tier ?? '?').padEnd(8)}  ${String(t.seasons ?? 1).padStart(4)}  ${covers.padEnd(12)}  ${usd(seasonWorthCents(t)).padStart(13)}  ${app}`,
    )
  }
  const ads = world.offers.filter((o) => o.kind === 'ad').sort((a, b) => a.week - b.week)
  console.log(`\n  and ${ads.length} advertising letters:`)
  for (const o of ads) {
    const t = o.terms as AdOfferTerms
    console.log(
      `    w${String(o.week).padStart(4)}  age ${kidAgeAt(world, o.week).toFixed(1)}  ${o.state.padEnd(7)}  ${String(t.category ?? '?').padEnd(10)}  ${usd(t.cashCents ?? 0).padStart(10)}/yr over ${t.termYears ?? 1}y  covers to w${o.untilWeek ?? -1}`,
    )
  }
}

// -------------------------------------------------------------------------------------------------
// §B  THE WINTERS
// -------------------------------------------------------------------------------------------------

interface Winter {
  seasonIndex: number
  opened: number
  closed: number
  /** the standing the ladder was read from – exact on the walked arm, reconstructed on a save */
  standing: SponsorStanding
  reconstructed: boolean
  ageYears: number
  /** the offer ledger AS IT STOOD when the window opened, for the turned-away question */
  offersAtOpen: Offer[]
}

const MUTES: string[] = []

/** The first gate in `raiseKitOffers`' own order that stopped this rung, as a sentence. */
function silencerFor(w: Winter, tier: SponsorTier, ladder: SponsorTier[], landedTiers: Set<SponsorTier>): string {
  if (!standingClears(w.standing, tier)) return `not cleared      ${gateNote(w.standing, tier)}`
  const slot = ladder.indexOf(tier)
  if (slot < 0) return `not seated       the window seats ${SPONSOR_LETTER_WEEKS}, cut from the top`
  if (landedTiers.has(tier)) return `LANDED           slot ${slot}`
  const running = seasonSpokenFor(w.offersAtOpen, w.opened)
  if (running) {
    const rt = kitTerms(running).tier
    if (rt && rungStrength(tier) <= rungStrength(rt)) {
      const covered = coveredSeasonStart(w.opened)
      const inSpan = (running.untilWeek ?? -1) >= covered
      MUTES.push(
        `  s${w.seasonIndex}  ${tier.padEnd(8)} muted by ${rt} (w${running.fromWeek ?? running.week}-w${running.untilWeek ?? -1}); ` +
          `the muted season starts w${covered} -> ${inSpan ? 'INSIDE the term  ok' : '⚠ OUTSIDE the term  DEFECT'}`,
      )
      return `turned away      by the running ${rt} deal, live to w${running.untilWeek ?? -1}`
    }
  }
  const chance = offerChanceFor(w.standing, tier)
  const roll = rngFromSeed(`${SEED}:offer:${w.opened + slot}`)()
  if (roll >= chance) return `dice missed      roll ${roll.toFixed(3)} >= ${chance.toFixed(2)}`
  // ⚠ A HIT WITH NO LETTER IN THE LEDGER IS THE RECONSTRUCTION SHOWING ITS SEAM, NOT A LOST LETTER.
  // `windowLadder` is re-read from a LIVE standing on every week of the window (`raiseKitOffers`'
  // own note), so a rung the season-END standing seats at slot N may have sat elsewhere – or not at
  // all – on the Monday the slot actually ran, and a different slot is a different sub-stream. The
  // `--seed` arm captures the standing on the window's own opening week and has no such seam.
  return w.reconstructed
    ? `dice hit (recon) roll ${roll.toFixed(3)} < ${chance.toFixed(2)} at the RECONSTRUCTED slot ${slot} – no letter, so the live ladder seated it elsewhere`
    : `dice hit         roll ${roll.toFixed(3)} < ${chance.toFixed(2)} – and no letter: read the gates above it`
}

function gateNote(s: SponsorStanding, tier: SponsorTier): string {
  const c = ECONOMY.sponsorship
  const at = `she is dom#${s.nationalRank} itf#${s.itfRanked ? s.itfRank : 'unranked'} wta#${s.wtaRanked ? s.wtaRank : 'unranked'}`
  if (tier === 'icon') return `needs wta<=${c.icon.maxWtaRank}; ${at}`
  if (tier === 'premium') return `needs wta<=${c.premium.maxWtaRank}; ${at}`
  if (tier === 'tour') return `needs wta<=${c.tour.maxWtaRank}; ${at}`
  if (tier === 'global') return `needs itf<=${c.global.maxItfRank} or wta<=${c.global.maxWtaRank}; ${at}`
  if (tier === 'national') return `needs itf<=${c.national.maxItfRank} or wta<=${c.national.maxWtaRank}; ${at}`
  return `needs dom<=${c.maxRank}, itf<=${c.localMaxItfRank} or any wta point; ${at}`
}

let SEED = ''

function printWinter(world: WorldState, w: Winter): void {
  const ladder = windowLadder(w.standing)
  // What actually landed that winter, off the ledger.
  const landed = world.offers.filter(
    (o) => o.kind === 'kit' && o.week >= w.opened && o.week <= w.closed && !o.id.startsWith('kit-end-'),
  )
  const landedTiers = new Set<SponsorTier>()
  for (const o of landed) {
    const t = kitTerms(o).tier
    if (t) landedTiers.add(t)
  }
  const mark = w.reconstructed ? '~' : ' '
  console.log(
    `\n  --- season ${w.seasonIndex}  window w${w.opened}-w${w.closed}  age ${w.ageYears.toFixed(1)}  ${mark}standing dom#${w.standing.nationalRank} itf#${w.standing.itfRanked ? w.standing.itfRank : 'unranked'} wta#${w.standing.wtaRanked ? w.standing.wtaRank : 'unranked'}`,
  )
  console.log(`      ladder: [${ladder.join(', ') || '(nobody would write)'}]`)
  for (const tier of [...SPONSOR_TIERS].reverse()) {
    console.log(`      ${tier.padEnd(9)} ${silencerFor(w, tier, ladder, landedTiers)}`)
  }
  if (landed.length === 0) console.log('      → the post was EMPTY this winter')
  for (const o of landed) {
    const t = kitTerms(o)
    const kind = o.id.startsWith('kit-bond-') ? 'bond' : o.id.startsWith('kit-renew-') ? 'renewal' : 'ladder'
    const slot = ladder.indexOf(t.tier!)
    const where = kind === 'ladder' ? `slot ${slot} (${kitOfferId(w.opened + Math.max(slot, 0))})` : kind
    console.log(
      `      → w${o.week} ${t.tier} ${where}: ${o.state}, ${t.seasons ?? 1} season(s), ${usd(seasonWorthCents(t))}/season`,
    )
  }
}

// -------------------------------------------------------------------------------------------------
// §B2  THE ADVERTISING SHELF – the other post, and the one «нет никого» is actually about
// -------------------------------------------------------------------------------------------------
//
// ⚠ IT IS A SECOND SECTION AND NOT A SECOND TOOL because the owner's sentence does not distinguish
// them – «спонсор» in «1 спонсор на 40к на год» is a cash endorsement, not a kit allowance, and a
// probe that printed only the kit ladder would answer a question he did not ask. The two posts have
// nothing in common mechanically: the kit ladder is a five-week off-season window with a
// strongest-first queue, and the shelf rolls WEEKLY, per category, all year
// (`reviewAdOffer`).

/** How many weeks of `[from, to)` had NO live contract of `kind` – the honest reading of «нет
 *  никого», which is about cover and not about post. */
function uncoveredWeeks(offers: Offer[], kind: 'kit' | 'ad', from: number, to: number): { weeks: number; longest: number; gapAt: number } {
  let weeks = 0
  let run = 0
  let longest = 0
  let gapAt = -1
  for (let w = from; w < to; w++) {
    const live = offers.some(
      (o) => o.kind === kind && o.state === 'signed' && (o.fromWeek ?? o.week) <= w && (o.untilWeek ?? -1) >= w,
    )
    if (live) {
      run = 0
      continue
    }
    weeks++
    run++
    if (run > longest) {
      longest = run
      gapAt = w - run + 1
    }
  }
  return { weeks, longest, gapAt }
}

function printAdShelf(world: WorldState, winters: Winter[]): void {
  const s = ECONOMY.advertising
  console.log('\n===== B2. THE ADVERTISING SHELF – the weekly post, per season =====\n')
  console.log('  (* her age at the season\'s FIRST week – §B above dates its rows on the window, 47 weeks later.')
  console.log('   `rolls` counts (week x open category) arrival draws actually taken, `hits` the ones that cleared.)\n')
  console.log('  season  age*  band  categories open                                 rolls  hits  letters  live')
  console.log('  ------  ----  ----  ------------------------------------------  ------  ----  -------  ----')
  for (const w of winters) {
    const start = w.seasonIndex * WEEKS_PER_YEAR
    const end = Math.min(start + WEEKS_PER_YEAR, world.week)
    if (end <= start) continue
    const band = adBandFor(w.standing)
    const ageAtStart = kidAgeAt(world, start)
    if (ageAtStart < s.fromAgeYears) {
      console.log(`  s${String(w.seasonIndex).padEnd(5)}  ${ageAtStart.toFixed(1).padStart(4)}  –     under ${s.fromAgeYears}: the shelf is shut`)
      continue
    }
    if (band === null) {
      console.log(
        `  s${String(w.seasonIndex).padEnd(5)}  ${ageAtStart.toFixed(1).padStart(4)}  –     no professional standing (wta ${w.standing.wtaRanked ? `#${w.standing.wtaRank}` : 'unranked'}): the shelf is shut`,
      )
      continue
    }
    const openAt = (age: number): string[] => {
      const out: string[] = []
      for (const c of AD_CATEGORIES) {
        // The two tenure rungs are excluded from the walk rather than modelled: their gates are a
        // Slam count and four top-10 seasons, which the probe would have to re-fold per week.
        if (c === 'capstone' || c === 'lifetime') continue
        if (age < s.junior.untilAgeYears && !adJuniorOpen(c)) continue
        if (adFeeFor(c as never, band) === null) continue
        out.push(c)
      }
      return out
    }
    const open = openAt(kidAgeAt(world, end - 1))
    let rolls = 0
    let hits = 0
    for (let week = start; week < end; week++) {
      // ⚠ HER AGE IS EXACT PER WEEK (`kidAgeAt`, the one clock) and only the BAND is the season's –
      // the reconstruction's single approximation, and the reason `hits` can disagree with
      // `letters`: `adBandFor` is re-read weekly from a LIVE standing, and a band that moved
      // mid-season opens or shuts a category the probe holds fixed. The --seed arm reads both.
      const ageNow = kidAgeAt(world, week)
      if (ageNow < s.fromAgeYears) continue
      const juniorNow = ageNow < s.junior.untilAgeYears
      const chance = juniorNow ? (s.offerChance * s.junior.chanceBps) / 10_000 : s.offerChance
      // ⚠ THE LEDGER AS IT STOOD THAT WEEK, and it has to be filtered rather than passed whole.
      // `adSpokenFor`'s signed arm is `week <= untilWeek` with NO lower bound – correct for the
      // engine, which only ever asks about today, and wrong for a retrospective walk: asked whole,
      // a deal signed in season 7 shuts its category in season 3 as well. Harmless in the game,
      // fatal to a reconstruction, so the filter is the reconstruction's own.
      const asOf = world.offers.filter((o) => o.week <= week)
      for (const c of openAt(ageNow)) {
        if (adSpokenFor(asOf, week, c as never)) continue
        rolls++
        if (adWritesAt(SEED, week, chance, c as never)) hits++
      }
    }
    const letters = world.offers.filter((o) => o.kind === 'ad' && o.week >= start && o.week < end).length
    const liveAtEnd = world.offers.filter(
      (o) => o.kind === 'ad' && o.state === 'signed' && (o.fromWeek ?? o.week) <= end - 1 && (o.untilWeek ?? -1) >= end - 1,
    ).length
    console.log(
      `  s${String(w.seasonIndex).padEnd(5)}  ${ageAtStart.toFixed(1).padStart(4)}  ~${String(band).padStart(3)}  ${open.join(',').padEnd(42)}  ${String(rolls).padStart(6)}  ${String(hits).padStart(4)}  ${String(letters).padStart(7)}  ${liveAtEnd}`,
    )
  }
  const from = 0
  const to = world.week
  const kitGap = uncoveredWeeks(world.offers, 'kit', from, to)
  const adGap = uncoveredWeeks(world.offers, 'ad', from, to)
  const everSigned = world.offers.some((o) => o.state === 'signed')
  console.log(`\n  COVER, over the whole career (w${from}-w${to}):`)
  if (!everSigned) console.log('    ⚠ nothing was ever signed in this career, so both lines below read the whole span.')
  console.log(
    `    kit: ${kitGap.weeks} weeks with no live deal, longest run ${kitGap.longest} weeks from w${kitGap.gapAt}`,
  )
  console.log(
    `    ads: ${adGap.weeks} weeks with no live deal, longest run ${adGap.longest} weeks from w${adGap.gapAt}`,
  )
  console.log('    (this is the reading of «нет никого» that is about COVER rather than about post.)')
}

// -------------------------------------------------------------------------------------------------
// The two arms
// -------------------------------------------------------------------------------------------------

/** THE SAVE ARM. Past winters are reconstructed from `seasonHistory`; the winter the save is
 *  standing in (if it is standing in one) is read live. */
async function runSave(path: string): Promise<void> {
  const world = await decodeExportFile(new Uint8Array(readFileSync(path)))
  SEED = world.seed
  console.log(`\n##### sponsor-silence-probe – ${path.replace(/.*\//, '')}`)
  console.log(
    `week ${world.week}  age ${kidAgeAt(world, world.week).toFixed(1)}  dom#${world.kidRankDomestic}  itf#${world.kidRank}  wta#${world.kidRankWta}`,
  )
  printPaperTrail(world)

  console.log('\n===== B. THE WINTERS – which rungs cleared, which rolled, what silenced the rest =====')
  console.log('  (~ marks a standing reconstructed from seasonHistory: the season END rank, two weeks')
  console.log('   after the window opened. The --seed arm reads the review\'s own standing instead.)')
  const winters: Winter[] = []
  for (const h of world.seasonHistory ?? []) {
    const opened = sponsorWindowOpensAt(h.seasonIndex * WEEKS_PER_YEAR)
    if (opened >= world.week) continue
    const dom = h.byTrack?.domestic
    const itf = h.byTrack?.itf
    const wta = h.byTrack?.wta
    winters.push({
      seasonIndex: h.seasonIndex,
      opened,
      closed: sponsorWindowClosesAt(opened),
      reconstructed: true,
      ageYears: kidAgeAt(world, opened),
      standing: {
        // Absent `byTrack` is a pre-v46 row and cannot be invented; the sentinel is the same one
        // `sponsorStandingOf` uses for a table she does not appear in.
        nationalRank: dom?.endRank ?? h.endRank,
        itfRank: itf?.endRank ?? h.endRank,
        itfRanked: (itf?.points ?? 0) > 0,
        wtaRank: wta?.endRank ?? Number.MAX_SAFE_INTEGER,
        wtaRanked: (wta?.points ?? 0) > 0,
      },
      offersAtOpen: world.offers.filter((o) => o.week <= opened),
    })
  }
  if (isSponsorWindowWeek(world.week)) {
    // ⚠ THE LIVE WINTER REPLACES ITS OWN RECONSTRUCTION rather than standing beside it – the save is
    // sitting inside this window, so `sponsorStandingOf` is the standing the review itself reads and
    // the seasonHistory row for the same season would be the same winter told worse.
    const opened = sponsorWindowOpensAt(world.week)
    const seasonIndex = Math.floor(world.week / WEEKS_PER_YEAR)
    const dup = winters.findIndex((w) => w.seasonIndex === seasonIndex)
    if (dup >= 0) winters.splice(dup, 1)
    winters.push({
      seasonIndex,
      opened,
      closed: sponsorWindowClosesAt(opened),
      reconstructed: false,
      ageYears: kidAgeAt(world, world.week),
      standing: sponsorStandingOf(world),
      offersAtOpen: world.offers.filter((o) => o.week <= world.week),
    })
  }
  for (const w of winters) printWinter(world, w)
  printAdShelf(world, winters)
  printMutes()
  printAgeAudit()
}

/** THE WALKED ARM. No reconstruction: the standing is captured on the window's own opening week,
 *  which is the week `reviewSponsors` reads it. */
function runSeed(s: string): void {
  SEED = s
  // ⚠ THE CAREER HAS TO REACH THE W TABLE OR THE ARM IS A NULL ARM. `createWorld`'s default profile
  // walked under `POLICIES[0]` (the grinder) finishes three careers out of three at `wta unranked`,
  // so every upper rung reads «not cleared» and the probe measures nothing about the silencers this
  // round is asking about. The background and the coach are therefore arguments, defaulting to the
  // econ bench's own top preset (120k · wealthy · elite coach) under its `player` policy, which is
  // the shape that actually turns professional. `--background` / `--coach` move them.
  const profile: PlayerProfile = {
    ...DEFAULT_PROFILE,
    background: (flag('background') ?? 'wealthy') as FamilyBackground,
    coachTier: (flag('coach') ?? 'elite') as CoachTier,
  }
  const policy = POLICIES[POLICIES.length - 1]
  const world = createWorld(s, profile)
  world.coachOnEventWeeks = policy.coachOnEventWeeks
  const rng = rngFromSeed(`${s}:sponsor-probe`)
  console.log(`  profile: ${profile.background} family, ${profile.coachTier} coach, policy "${policy.label}"`)
  const winters: Winter[] = []
  console.log(`\n##### sponsor-silence-probe – walked career, seed "${s}", ${weeks} weeks`)
  for (let i = 0; i < weeks; i++) {
    const opening = world.week === sponsorWindowOpensAt(world.week)
    if (opening) {
      const opened = world.week
      winters.push({
        seasonIndex: Math.floor(opened / WEEKS_PER_YEAR),
        opened,
        closed: sponsorWindowClosesAt(opened),
        reconstructed: false,
        ageYears: kidAgeAt(world, opened),
        standing: sponsorStandingOf(world),
        offersAtOpen: world.offers.map((o) => ({ ...o })),
      })
    }
    stepCareerWeek(world, rng, policy)
  }
  console.log(
    `finished at week ${world.week}  age ${kidAgeAt(world, world.week).toFixed(1)}  dom#${world.kidRankDomestic}  itf#${world.kidRank}  wta#${world.kidRankWta}`,
  )
  printPaperTrail(world)
  console.log('\n===== B. THE WINTERS – which rungs cleared, which rolled, what silenced the rest =====')
  for (const w of winters) printWinter(world, w)
  printAdShelf(world, winters)
  printMutes()
  printAgeAudit()
}

function printMutes(): void {
  console.log('\n===== C. THE MUTE AUDIT – does a running deal mute a season it does not cover? =====\n')
  if (MUTES.length === 0) {
    console.log('  no rung was turned away by a running deal in this career')
    return
  }
  for (const m of MUTES) console.log(m)
  const bad = MUTES.filter((m) => m.includes('DEFECT')).length
  console.log(
    `\n  ${MUTES.length} mutes, ${bad} outside the muting deal's own term. ` +
      (bad === 0
        ? 'Every mute is inside the term the parent signed: the silence is the contract, not a bug.'
        : '⚠ A mute outside the term is the defect round 42 #16 names.'),
  )
}

if (agesOnly) {
  printAgeAudit()
} else if (savePath) {
  await runSave(savePath)
} else if (seed) {
  runSeed(seed)
} else {
  console.log('give me --save <path.tsave>, --seed <seed> [--weeks N], or --ages')
}

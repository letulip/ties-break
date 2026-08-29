/**
 * SPONSOR LADDER REACH – round 29 items 7 and 15, and the question is REACHABILITY, not the catalogue.
 *
 * The owner, off a career at WTA #21 whose inbox holds Quiet Hour, Baseline Athletic, Netrally
 * Distribution and String House: «А что у нас со спонсорами вообще, кстати? Кроме часов за 20к есть
 * ещё кто-то и когда появляется? Мы что-то говорили о больших чеках вроде.» and «И где все наши
 * топовые спонсоры, интересно? … На других аккаунтах я помню один был мощный.»
 *
 * The catalogue is a grep: six rungs in `ECONOMY.sponsorship`, gates in `standingClears`. What a grep
 * CANNOT say is whether the top two of them are ever reached by a career the engine actually
 * produces – and a rung that is theoretically open and empirically never seen is dead content, which
 * is exactly the failure `tools/brand-gate-bench.ts` was written for the first time this happened
 * (the local shop's gate, denominated in a table she did not hold, fired for nobody).
 *
 * SO THIS COUNTS CAREERS, NOT CONSTANTS. Three different questions per rung, kept apart because they
 * have three different answers:
 *
 *   CLEARED  – her standing on a sponsor-window week satisfies `standingClears`. The GATE.
 *   WRITTEN  – a letter from that rung actually landed. The gate AND the dice AND the schedule.
 *   SIGNED   – the parent took it. Under the eager arm below that is "written and not crowded out".
 *
 * ⚠ THE HORIZON IS THE WHOLE INSTRUMENT. `tools/sponsor-window-bench.ts` runs 312 weeks (to age 20)
 * because it measures CONTINUITY, which is legible early. The top rungs are gated on WTA #50 and
 * WTA #10, standings a career reaches – if ever – in its middle twenties, so a 312-week probe cannot
 * see them at all and its silence would be a property of the probe. This one runs to 780 weeks by
 * default: the length of the owner's own save, and age 29.
 *
 * ⚠ THE SIGNING ARM IS DELIBERATELY THE FRIENDLIEST ONE. It signs the strongest live letter the week
 * it lands, so a rung that is never SIGNED here is not being missed by a cautious parent. If even
 * this arm never sees a rung, nobody does.
 *
 * ⚠ MEASUREMENT ONLY. It imports the career loop and the preset ladder from tools/econ-bench.ts, so
 * the world evolution is defined in one place, and it writes nothing to any engine constant. Signing
 * a letter is a player action and taps no MAIN draw (CLAUDE.md invariant 2), so the arms here cannot
 * move the frozen capture.
 *
 * Run:  npx vite-node tools/sponsor-ladder-reach.ts
 *       npx vite-node tools/sponsor-ladder-reach.ts -- --weeks 780 --seeds 6 --json out.json
 */
import { writeFileSync } from 'node:fs'
import { acceptOffer, financeWindow, type WorldState } from '../src/engine/world'
import { AD_TIERS, isOfferLive, seasonSpokenFor, sponsorWindowOpensAt, windowLadder, SPONSOR_TIERS, TIER_COVERS, standingClears, isSponsorWindowWeek } from '../src/engine/offers'
import { sponsorStandingOf } from '../src/engine/world/sponsors'
import { ECONOMY } from '../src/engine/economy'
import { START_AGE_YEARS } from '../src/engine/world/age'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { AdOfferTerms, AdTier, KitOfferTerms, SponsorTier } from '../src/shared/protocol'
import { PRESETS, POLICIES, openCareer, stepCareerWeek, type Preset, type Policy } from './econ-bench'

/** Fifteen seasons – the length of the owner's own save (`w780`), and the first horizon on which the
 *  two upper rungs' gates (WTA #50, WTA #10) are reachable by anybody at all. */
const DEFAULT_WEEKS = 780
const DEFAULT_SEEDS = 6

/** Weakest-first, the array's own order – so an index comparison IS a ladder comparison. */
const LADDER: readonly SponsorTier[] = SPONSOR_TIERS
const rungIndex = (t: SponsorTier): number => LADDER.indexOf(t)

/** ⭐⭐ ONE SPONSOR WINDOW, AND WHAT THE POST DID IN IT – round 29 part two #12. Recorded on the
 *  window's OPENING week, with the letters of this winter taken out of the question: `raiseKitOffers`
 *  asks `seasonSpokenFor` BEFORE it writes, and asking it against the final offer list would also see
 *  the deal the parent signed later the same winter – so every winter would read "spoken for",
 *  including the ones that plainly produced letters. (That mistake was made once in this file's
 *  `readOneSave` and is written out there too.) */
interface Winter {
  week: number
  /** the rung of the contract that was already covering the season ahead, or null */
  spokenBy: SponsorTier | null
  /** the strongest rung her standing cleared that the running contract turned away, or null */
  blockedTop: SponsorTier | null
  /** how many kit letters the winter actually produced */
  letters: number
}

interface CareerRow {
  preset: string
  policy: string
  seed: string
  /** the strongest rung her standing cleared on a sponsor-window week, and the week it first did. */
  bestCleared: SponsorTier | null
  bestClearedWeek: number | null
  /** every rung she EVER cleared on a window week. */
  clearedRungs: SponsorTier[]
  /** ...and the first week each of them opened, which is the half of item 7 that asks «когда». */
  firstClearedWeek: Partial<Record<SponsorTier, number>>
  /** every rung that actually wrote her a letter, and the strongest of them. */
  writtenRungs: SponsorTier[]
  bestWritten: SponsorTier | null
  /** every rung she signed. */
  signedRungs: SponsorTier[]
  bestSigned: SponsorTier | null
  /** the best professional standing she ever held while genuinely ranked. */
  bestWtaRank: number | null
  bestItfRank: number | null
  /** the advertising post – «часов за 20к», its own clock and its own gate. */
  adLettersRaised: number
  adSigned: number
  /** ⭐ round 29 part two #19 – which HOUSES of the advertising ladder ever wrote, and which were
   *  taken. A rung nobody reaches is not shipped, so these two are what turn a catalogue into a
   *  list somebody actually sees. */
  adRungsWritten: AdTier[]
  adRungsSigned: AdTier[]
  /** ⭐ round 29 part two #20 – one reading a season of what the last 52 weeks COST her, tagged with
   *  the professional standing she held when it was taken. The denominator of the sizing rule. */
  outgoingsByRank: { rank: number; cents: number }[]
  /** ⭐ round 29 part two #12 – every sponsor window this career lived through and what the post
   *  did in it. */
  winters: Winter[]
  /** what the sponsors actually banked over the career, gross of her cut. */
  sponsorIncomeCents: number
  /** the single largest sponsor cheque the career ever received. */
  biggestChequeCents: number
  biggestChequeText: string
  endedWeek: number | null
  weeksRun: number
}

/** THE THREE CASH LINES A BRAND WRITES, and they are the sponsor bench's own three regexes rather
 *  than new ones – `payRetainer`, `appearanceFeeFor` and `resultBonusFor` are the only producers, so
 *  two files reading the ledger differently would be two answers to one question. The kit allowance
 *  and the travel share are NOT cash and are deliberately absent: they are bills the brand did not
 *  send, which is a different sentence from a cheque it did. */
const RETAINER_RE = / retainer – quarterly$/
const APPEARANCE_RE = /^Appearance fee – /
const BONUS_RE = /^Sponsor bonus – /

/** Sign the strongest live letter in the inbox, kit or advertising, the week it lands. */
function answerThePost(
  world: WorldState,
  signedRungs: Set<SponsorTier>,
  adSigned: { n: number },
  adSignedRungs: Set<AdTier>,
): void {
  const live = world.offers.filter((o) => (o.kind === 'kit' || o.kind === 'ad') && isOfferLive(o, world.week))
  if (live.length === 0) return
  const kit = live.filter((o) => o.kind === 'kit')
  const best = [...kit].sort(
    (a, b) => rungIndex((b.terms as KitOfferTerms).tier) - rungIndex((a.terms as KitOfferTerms).tier),
  )[0]
  const target = best ?? live[0]
  try {
    acceptOffer(world, target.id)
    if (target.kind === 'kit') signedRungs.add((target.terms as KitOfferTerms).tier)
    else {
      adSigned.n++
      // An ad letter written before the ladder carries no tier; every one of those is the watch
      // rung by construction, which is the same exact fallback `OfferLetter` reads.
      adSignedRungs.add((target.terms as AdOfferTerms).tier ?? 'watch')
    }
  } catch {
    // A career that has ended – or a deal that is already spoken for – refuses. That is the engine
    // re-validating, which is the point of asking it rather than deciding here.
  }
}

function runCareer(preset: Preset, policy: Policy, index: number, weeks: number): CareerRow {
  const { world, rng, seed } = openCareer(preset, index, policy)
  const cleared = new Set<SponsorTier>()
  const written = new Set<SponsorTier>()
  const adWritten = new Set<AdTier>()
  const signed = new Set<SponsorTier>()
  const firstClearedWeek: Partial<Record<SponsorTier, number>> = {}
  const adSigned = { n: 0 }
  const adSignedRungs = new Set<AdTier>()
  const winters: Winter[] = []
  const outgoingsByRank: { rank: number; cents: number }[] = []
  let bestCleared: SponsorTier | null = null
  let bestClearedWeek: number | null = null
  let bestWtaRank: number | null = null
  let bestItfRank: number | null = null
  let sponsorIncomeCents = 0
  let biggestChequeCents = 0
  let biggestChequeText = ''
  let ran = 0

  for (let i = 0; i < weeks; i++) {
    const week = world.week
    stepCareerWeek(world, rng, policy)
    ran++
    const standing = sponsorStandingOf(world)
    if (standing.wtaRanked && (bestWtaRank === null || standing.wtaRank < bestWtaRank)) {
      bestWtaRank = standing.wtaRank
    }
    if (standing.itfRanked && (bestItfRank === null || standing.itfRank < bestItfRank)) {
      bestItfRank = standing.itfRank
    }
    // THE GATE, asked only on the weeks it can produce anything. A standing held in April is not a
    // rung reached: `raiseKitOffers` refuses outside the window, so counting it would inflate every
    // figure below with standings no brand was ever in a position to read.
    // ⭐⭐ THE WINTER CENSUS – round 29 part two #12, taken on the window's OPENING week and BEFORE
    // this winter's own letters exist, which is the only reading `raiseKitOffers` itself takes.
    if (isSponsorWindowWeek(world.week) && sponsorWindowOpensAt(world.week) === world.week) {
      const before = world.offers.filter((o) => o.week < world.week)
      const spoken = seasonSpokenFor(before, world.week)
      const spokenBy = spoken ? ((spoken.terms as KitOfferTerms).tier ?? null) : null
      const ladder = windowLadder(standing)
      winters.push({
        week: world.week,
        spokenBy,
        blockedTop:
          spokenBy && ladder.length > 0 && rungIndex(ladder[0]) > rungIndex(spokenBy) ? ladder[0] : null,
        letters: 0,
      })
      // ...and what the season just gone COST, tagged with the standing she holds today. One reading
      // a year, so a band is counted once per season rather than fifty-two times.
      if (standing.wtaRanked && world.week >= WEEKS_PER_YEAR) {
        outgoingsByRank.push({
          rank: standing.wtaRank,
          cents: financeWindow(world.financeWeeks, world.week - (WEEKS_PER_YEAR - 1)).expenseCents,
        })
      }
    }
    if (isSponsorWindowWeek(world.week)) {
      for (const tier of LADDER) {
        if (!standingClears(standing, tier)) continue
        cleared.add(tier)
        if (firstClearedWeek[tier] === undefined) firstClearedWeek[tier] = world.week
        if (bestCleared === null || rungIndex(tier) > rungIndex(bestCleared)) {
          bestCleared = tier
          bestClearedWeek = world.week
        }
      }
    }
    // THE POST, read off the world's own offer list rather than off a return value, so a letter
    // raised by any path is seen.
    for (const o of world.offers) {
      if (o.kind === 'kit') written.add((o.terms as KitOfferTerms).tier)
      // An ad letter written before the ladder carries no tier; every one of those is the watch rung
      // by construction, so the fallback is exact rather than a guess (`AdOfferTerms.tier`).
      if (o.kind === 'ad') adWritten.add((o.terms as AdOfferTerms).tier ?? 'watch')
    }
    // ⚠ WHAT THE BRANDS PAID, SCANNED AT THE WEEK IT IS WRITTEN AND NOT AT THE END. `world.events`
    // is pruned at 400 ROWS, so an index that only ever grows walks off the end of a career this
    // long and reports ZERO for every rung – which is exactly what the first run of this file did.
    // The sponsor bench dodges the same trap the same way.
    for (const row of world.events) {
      if (row.week !== week || row.type !== 'income') continue
      const amount = row.amountCents ?? 0
      if (amount <= 0) continue
      if (!RETAINER_RE.test(row.text) && !APPEARANCE_RE.test(row.text) && !BONUS_RE.test(row.text)) continue
      sponsorIncomeCents += amount
      if (amount > biggestChequeCents) {
        biggestChequeCents = amount
        biggestChequeText = row.text
      }
    }
    answerThePost(world, signed, adSigned, adSignedRungs)
    if (world.ending) break
  }

  const adLetters = world.offers.filter((o) => o.kind === 'ad')
  // Kit letters are never pruned, so each winter's own count is a complete reconstruction.
  for (const w of winters) {
    w.letters = world.offers.filter(
      (o) => o.kind === 'kit' && o.state !== 'info' && o.week >= w.week && o.week < w.week + 5,
    ).length
  }
  return {
    preset: preset.label,
    policy: policy.label,
    seed,
    bestCleared,
    bestClearedWeek,
    clearedRungs: LADDER.filter((t) => cleared.has(t)),
    firstClearedWeek,
    writtenRungs: LADDER.filter((t) => written.has(t)),
    bestWritten: LADDER.filter((t) => written.has(t)).slice(-1)[0] ?? null,
    signedRungs: LADDER.filter((t) => signed.has(t)),
    bestSigned: LADDER.filter((t) => signed.has(t)).slice(-1)[0] ?? null,
    bestWtaRank,
    bestItfRank,
    adLettersRaised: adLetters.length,
    adSigned: adSigned.n,
    adRungsWritten: AD_TIERS.filter((t) => adWritten.has(t)),
    adRungsSigned: AD_TIERS.filter((t) => adSignedRungs.has(t)),
    outgoingsByRank,
    winters,
    sponsorIncomeCents,
    biggestChequeCents,
    biggestChequeText,
    endedWeek: world.ending ? world.week : null,
    weeksRun: ran,
  }
}

const usd = (cents: number) => `$${Math.round(cents / 100).toLocaleString('en-US')}`
const pct = (n: number, d: number) => (d === 0 ? '  –  ' : `${((100 * n) / d).toFixed(0)}%`.padStart(5))

/** ⚠ ONE SAVE, READ-ONLY, AS ONE DATA POINT AND NEVER AS THE POPULATION. The owner asks these two
 *  questions off a career he is playing, and the career he is playing is one seed - so it can say
 *  where HE is on the ladder and it cannot say what the ladder does. Nothing is written back and
 *  nothing but rungs, brands and a rank is printed: the save is personal and stays in his Downloads.
 *
 *  Run with `--save ~/Downloads/<file>.tsave`. */
async function readOneSave(path: string): Promise<void> {
  const { decodeExportFile } = await import('../src/engine/saveCodec')
  const { readFileSync } = await import('node:fs')
  const bytes = readFileSync(path.replace('~', process.env.HOME ?? ''))
  const world = (await decodeExportFile(new Uint8Array(bytes))) as WorldState
  const standing = sponsorStandingOf(world)
  console.log(`\nONE SAVE – week ${world.week} (age ${(START_AGE_YEARS + world.week / WEEKS_PER_YEAR).toFixed(1)})`)
  console.log(
    `  standing: WTA ${standing.wtaRanked ? `#${standing.wtaRank}` : 'unranked'}` +
      ` · ITF ${standing.itfRanked ? `#${standing.itfRank}` : 'unranked'}` +
      ` · national #${standing.nationalRank}`,
  )
  console.log('  rung        clears?  letters held')
  for (const tier of LADDER) {
    const mine = world.offers.filter((o) => o.kind === 'kit' && (o.terms as KitOfferTerms).tier === tier)
    const states = mine.map((o) => `${o.id}:${o.state}`).join(' ') || '–'
    console.log(`  ${tier.padEnd(11)} ${(standingClears(standing, tier) ? 'YES' : 'no ').padEnd(8)} ${states}`)
  }
  const ads = world.offers.filter((o) => o.kind === 'ad')
  console.log(`  advertising: ${ads.length} letter(s) – ${ads.map((o) => `${o.id}:${o.state}`).join(' ') || '–'}`)

  // ⚠ AND WHY A RUNG HE CLEARS MAY NEVER HAVE WRITTEN – the winters, one line each. `raiseKitOffers`
  // returns EMPTY the moment the season ahead is already promised («one brand at a time»,
  // `seasonSpokenFor`), so a multi-season deal signed once shuts the whole post for as long as it
  // runs. That is the rule having its bite and not a fault, but it is invisible from the inbox: the
  // winters it ate look exactly like winters nobody wrote in. Kit letters are never pruned, so this
  // is a complete reconstruction from the save's own offer list.
  const { seasonSpokenFor, sponsorWindowOpensAt } = await import('../src/engine/offers')
  console.log('\n  every sponsor window of this career, and what the post did:')
  for (let w = WEEKS_PER_YEAR - 5; w <= world.week; w += WEEKS_PER_YEAR) {
    const opened = sponsorWindowOpensAt(w)
    // ⚠⚠ THE QUESTION IS ASKED WITH THE LETTERS OF THIS WINTER TAKEN OUT, and the first draft of
    // this loop did not do that and was therefore wrong on every line. `raiseKitOffers` asks
    // `seasonSpokenFor` BEFORE it writes; asked against the FINAL offer list it also sees the deal
    // the parent signed later the same winter, whose term by construction reaches into the season
    // ahead - so every winter reads "spoken for", including the ones that plainly produced letters.
    // A letter's `week` is its arrival, so dropping the ones that arrived on or after the opening
    // week is exactly the state the schedule read.
    const before = world.offers.filter((o) => o.week < opened)
    const spoken = seasonSpokenFor(before, opened)
    const spokenTier = spoken ? (spoken.terms as KitOfferTerms).tier : null
    const raised = world.offers.filter(
      (o) => o.kind === 'kit' && o.week >= opened && o.week < opened + 5 && !o.id.startsWith('kit-end'),
    )
    const what = raised.map((o) => `${(o.terms as KitOfferTerms).tier}:${o.state}`).join(' ')
    console.log(
      `    w${String(opened).padStart(3)} ${spokenTier ? `SPOKEN FOR by ${spokenTier}`.padEnd(28) : 'post open'.padEnd(28)} ${what || '(nothing)'}`,
    )
  }
}

export function main(argv: string[] = process.argv.slice(2)): void {
  const arg = (name: string, fallback: number): number => {
    const i = argv.indexOf(name)
    return i >= 0 ? Number(argv[i + 1]) : fallback
  }
  const saveAt = argv.indexOf('--save')
  if (saveAt >= 0) {
    void readOneSave(argv[saveAt + 1])
    return
  }
  const weeks = arg('--weeks', DEFAULT_WEEKS)
  const seeds = arg('--seeds', DEFAULT_SEEDS)
  const jsonAt = argv.indexOf('--json')

  const rows: CareerRow[] = []
  for (const preset of PRESETS) {
    for (const policy of POLICIES) {
      for (let i = 0; i < seeds; i++) rows.push(runCareer(preset, policy, i, weeks))
    }
  }

  const n = rows.length
  console.log(`\nSPONSOR LADDER REACH – ${n} careers x ${weeks} weeks (to age ${START_AGE_YEARS + Math.floor(weeks / WEEKS_PER_YEAR)})`)
  console.log(`${PRESETS.length} presets x ${POLICIES.length} policies x ${seeds} seeds, eager signing\n`)

  console.log('  rung        brand                  gate                        cleared  written   signed')
  const gateOf: Record<SponsorTier, string> = {
    local: `national #${ECONOMY.sponsorship.maxRank} / ITF #${ECONOMY.sponsorship.localMaxItfRank} / any W`,
    national: `ITF #${ECONOMY.sponsorship.national.maxItfRank} or WTA #${ECONOMY.sponsorship.national.maxWtaRank}`,
    tour: `WTA #${ECONOMY.sponsorship.tour.maxWtaRank}`,
    global: `ITF #${ECONOMY.sponsorship.global.maxItfRank} or WTA #${ECONOMY.sponsorship.global.maxWtaRank}`,
    premium: `WTA #${ECONOMY.sponsorship.premium.maxWtaRank}`,
    icon: `WTA #${ECONOMY.sponsorship.icon.maxWtaRank}`,
  }
  const brandOf: Record<SponsorTier, string> = {
    local: ECONOMY.sponsorship.localBrand,
    national: ECONOMY.sponsorship.national.brand,
    tour: ECONOMY.sponsorship.tour.brand,
    global: ECONOMY.sponsorship.global.brand,
    premium: ECONOMY.sponsorship.premium.brand,
    icon: ECONOMY.sponsorship.icon.brand,
  }
  for (const tier of LADDER) {
    const cleared = rows.filter((r) => r.clearedRungs.includes(tier)).length
    const written = rows.filter((r) => r.writtenRungs.includes(tier)).length
    const signedN = rows.filter((r) => r.signedRungs.includes(tier)).length
    console.log(
      `  ${tier.padEnd(11)} ${brandOf[tier].padEnd(22)} ${gateOf[tier].padEnd(27)} ` +
        `${String(cleared).padStart(3)} ${pct(cleared, n)}  ${String(written).padStart(3)} ${pct(written, n)}  ${String(signedN).padStart(3)} ${pct(signedN, n)}`,
    )
  }

  // ⚠⚠ AND THE LADDER'S OWN SAFETY PROMISE, CHECKED RATHER THAN ASSUMED. `windowLadder`'s header
  // states it outright: strongest-first ordering exists so that «signing on sight is always safe and
  // waiting always optional». That is only true if a rung listed ABOVE another is worth at least as
  // much, and nothing in the codebase checks it. Read straight off `ECONOMY.sponsorship` – no
  // simulation can make this clearer than the constants do.
  console.log('\n  WHAT EACH RUNG IS WORTH IN A SEASON, weakest-first – the ordering`s own promise:')
  console.log('    rung        kit/season  retainer/season  appearance  bonus       travel  lines  seasons')
  const S = ECONOMY.sponsorship
  const money: Record<SponsorTier, { kit: number; retainer: number; appearance: number; bonus: number; travel: number; lines: number; seasons: number }> = {
    local: { kit: S.seasonCents, retainer: 0, appearance: 0, bonus: 0, travel: 0, lines: TIER_COVERS.local.length, seasons: 1 },
    national: { kit: S.national.seasonCents, retainer: 0, appearance: 0, bonus: 0, travel: 0, lines: TIER_COVERS.national.length, seasons: S.national.seasons },
    tour: { kit: S.tour.seasonCents, retainer: S.tour.retainerCents * 4, appearance: 0, bonus: S.tour.bonusShare, travel: S.tour.travelShare, lines: TIER_COVERS.tour.length, seasons: S.tour.seasons },
    // ⭐ ROUND 29 PART TWO #5 – global carries a retainer and a bonus now, and this row was reading
    // ZERO for both because it was hand-built when they did not exist. A table that prints the
    // domination warning off stale figures is worse than no table: it was still flagging the defect
    // for a whole run AFTER the ruling shipped.
    global: { kit: S.global.seasonCents, retainer: S.global.retainerCents * 4, appearance: 0, bonus: S.global.bonusShare, travel: S.global.travelShare, lines: TIER_COVERS.global.length, seasons: S.global.seasons },
    premium: { kit: S.premium.seasonCents, retainer: S.premium.retainerCents * 4, appearance: S.premium.appearanceFeeCents, bonus: S.premium.bonusShare, travel: S.premium.travelShare, lines: TIER_COVERS.premium.length, seasons: S.premium.seasons },
    icon: { kit: S.icon.seasonCents, retainer: S.icon.retainerCents * 4, appearance: S.icon.appearanceFeeCents, bonus: S.icon.bonusShare, travel: S.icon.travelShare, lines: TIER_COVERS.icon.length, seasons: S.icon.seasons },
  }
  for (const tier of LADDER) {
    const m = money[tier]
    console.log(
      `    ${tier.padEnd(11)} ${usd(m.kit).padStart(10)}  ${usd(m.retainer).padStart(15)}  ` +
        `${(m.appearance ? usd(m.appearance) : '–').padStart(10)}  ${(m.bonus ? `${Math.round(m.bonus * 100)}%` : '–').padStart(10)}  ` +
        `${`${Math.round(m.travel * 100)}%`.padStart(6)}  ${String(m.lines).padStart(5)}  ${String(m.seasons).padStart(7)}`,
    )
  }
  // A rung is DOMINATED when the rung immediately below it pays at least as much on every axis and
  // more on one. That is precisely the case the strongest-first order promises cannot exist.
  for (let i = 1; i < LADDER.length; i++) {
    const hi = money[LADDER[i]]
    const lo = money[LADDER[i - 1]]
    const worseOn = (['kit', 'retainer', 'appearance', 'bonus', 'travel', 'lines'] as const).filter((k) => hi[k] < lo[k])
    if (worseOn.length > 0) {
      console.log(
        `    ⚠ ${LADDER[i]} is presented ABOVE ${LADDER[i - 1]} and pays LESS on: ${worseOn.join(', ')}` +
          ` – and locks ${hi.seasons} seasons against ${lo.seasons}`,
      )
    }
  }

  console.log('\n  WHEN a rung opens, over the careers that ever cleared it (his «когда появляется»):')
  for (const tier of LADDER) {
    const at = rows.map((r) => r.firstClearedWeek[tier]).filter((w): w is number => w !== undefined).sort((a, b) => a - b)
    if (at.length === 0) {
      console.log(`    ${tier.padEnd(9)} never`)
      continue
    }
    const age = (w: number) => (START_AGE_YEARS + w / WEEKS_PER_YEAR).toFixed(1)
    const med = at[Math.floor(at.length / 2)]
    console.log(
      `    ${tier.padEnd(9)} earliest week ${String(at[0]).padStart(3)} (age ${age(at[0])})` +
        `   median week ${String(med).padStart(3)} (age ${age(med)})   n=${at.length}`,
    )
  }

  console.log('\n  the STRONGEST rung each career ever reached (its ceiling):')
  for (const tier of [...LADDER].reverse()) {
    const top = rows.filter((r) => r.bestCleared === tier)
    if (top.length === 0) {
      console.log(`    ${tier.padEnd(9)} 0 careers`)
      continue
    }
    const weeksTo = top.map((r) => r.bestClearedWeek ?? 0).sort((a, b) => a - b)
    console.log(
      `    ${tier.padEnd(9)} ${String(top.length).padStart(3)} careers ${pct(top.length, n)}` +
        `  first cleared at week ${weeksTo[0]} (age ${(START_AGE_YEARS + weeksTo[0] / WEEKS_PER_YEAR).toFixed(1)})`,
    )
  }
  const none = rows.filter((r) => r.bestCleared === null).length
  console.log(`    ${'(none)'.padEnd(9)} ${String(none).padStart(3)} careers ${pct(none, n)}`)

  const ranked = rows.filter((r) => r.bestWtaRank !== null).map((r) => r.bestWtaRank!).sort((a, b) => a - b)
  console.log(`\n  best professional standing ever held – ${ranked.length}/${n} careers were ever W-ranked`)
  if (ranked.length > 0) {
    const at = (q: number) => ranked[Math.min(ranked.length - 1, Math.floor(q * ranked.length))]
    console.log(`    best #${ranked[0]}   p10 #${at(0.1)}   median #${at(0.5)}   p90 #${at(0.9)}   worst #${ranked[ranked.length - 1]}`)
    for (const cut of [ECONOMY.sponsorship.icon.maxWtaRank, ECONOMY.sponsorship.premium.maxWtaRank, ECONOMY.sponsorship.tour.maxWtaRank]) {
      console.log(`    ever inside WTA #${String(cut).padStart(3)}: ${String(ranked.filter((r) => r <= cut).length).padStart(3)} careers ${pct(ranked.filter((r) => r <= cut).length, n)}`)
    }
  }

  const adRows = rows.filter((r) => r.adLettersRaised > 0)
  console.log(
    `\n  the advertising post (age ${ECONOMY.advertising.fromAgeYears}+):` +
      ` ${adRows.length}/${n} careers written to ${pct(adRows.length, n)}, ` +
      `${rows.reduce((s, r) => s + r.adLettersRaised, 0)} letters in all`,
  )

  // ⭐⭐ ROUND 29 PART TWO #19 – THE LIST HE ASKED FOR, AND WHETHER ANYBODY EVER SEES IT.
  //
  // «я не увидел наш список спонсоров для съемок и прочего, не спортивных. С ними что и на каких
  // уровнях и что дают… Хочу увидеть их список и что дают.» Printed here rather than in the docs so
  // it can never go stale against the catalogue, and beside a REACH column, because a rung nobody
  // reaches is not content – the same discipline the kit table above keeps.
  console.log('\n  ⭐ THE ADVERTISING LADDER – the list, what it pays, and how often it is actually seen:')
  console.log('    rung      house              trade                       gate       fee   shoots   written   signed')
  for (const t of AD_TIERS) {
    const h = ECONOMY.advertising.houses[t]
    const written = rows.filter((r) => r.adRungsWritten.includes(t)).length
    const signed = rows.filter((r) => r.adRungsSigned.includes(t)).length
    console.log(
      `    ${t.padEnd(9)} ${h.brand.padEnd(18)} ${h.trade.padEnd(27)} ` +
        `WTA #${String(h.maxWtaRank).padStart(3)} ${usd(h.cashCents).padStart(9)} ${String(h.shootWeeksPerTerm).padStart(6)}` +
        `   ${String(written).padStart(3)} ${pct(written, n)}  ${String(signed).padStart(3)} ${pct(signed, n)}`,
    )
  }

  // ...AND THE SIZING RULE, MEASURED. A rung is a fixed SHARE of the OUTGOINGS of the stage it opens
  // for (`ECONOMY.advertising.houses`), set by the bottom rung's own realised share, so the
  // denominator has to be printed with the numerator or the rule is unfalsifiable. One reading a
  // season, on the sponsor window's own opening week.
  console.log('\n  ...and what a season COSTS in each of those bands – the denominator the fees are a share of:')
  console.log('    band            n   median outgoings   this rung pays   realised share   $ per shoot')
  const bandOf: { tier: AdTier; label: string; lo: number; hi: number }[] = [
    { tier: 'watch', label: 'WTA 51-200', lo: 51, hi: ECONOMY.advertising.houses.watch.maxWtaRank },
    { tier: 'campaign', label: 'WTA 11-50 ', lo: 11, hi: ECONOMY.advertising.houses.campaign.maxWtaRank },
    { tier: 'house', label: 'WTA 1-10  ', lo: 1, hi: ECONOMY.advertising.houses.house.maxWtaRank },
  ]
  for (const b of bandOf) {
    const seen = rows.flatMap((r) => r.outgoingsByRank.filter((o) => o.rank >= b.lo && o.rank <= b.hi).map((o) => o.cents))
    seen.sort((x, y) => x - y)
    if (seen.length === 0) {
      console.log(`    ${b.label}     0   –`)
      continue
    }
    const med = seen[Math.floor(seen.length / 2)]
    const fee = ECONOMY.advertising.houses[b.tier].cashCents
    console.log(
      `    ${b.label} ${String(seen.length).padStart(4)}   ${usd(med).padStart(16)}   ${usd(fee).padStart(14)}   ` +
        `${`${((100 * fee) / med).toFixed(1)}%`.padStart(13)}   ` +
        `${usd(Math.round(fee / ECONOMY.advertising.houses[b.tier].shootWeeksPerTerm)).padStart(11)}`,
    )
  }

  // ⭐⭐ ROUND 29 PART TWO #12 – WHY A WINTER PRODUCES NO KIT LETTER, and how often a BIGGER house
  // was standing behind the closed door. The owner: «открытое сейчас в вашем ящике продление
  // Baseline закроет и следующую зимнюю почту… там без спонсора грустновато немного живется».
  const winters = rows.flatMap((r) => r.winters)
  const shut = winters.filter((w) => w.letters === 0)
  const spoken = winters.filter((w) => w.spokenBy !== null)
  const blocked = winters.filter((w) => w.blockedTop !== null)
  console.log(`\n  ⭐ THE WINTERS – ${winters.length} sponsor windows lived through:`)
  console.log(`    produced no kit letter at all      ${String(shut.length).padStart(4)} ${pct(shut.length, winters.length)}`)
  console.log(`    the season ahead was already promised ${String(spoken.length).padStart(2)} ${pct(spoken.length, winters.length)}` +
    `   (letters raised anyway: ${spoken.filter((w) => w.letters > 0).length})`)
  // ⚠ THE LABEL IS THE SITUATION AND NOT THE OUTCOME, since round 29 part two #12: these are the
  // winters in which a running deal stood in front of a BIGGER house. Under the shipped rule every
  // one of them was silent; under `rungTurnedAway` they are exactly the ones now let through.
  console.log(`    ...and a STRICTLY STRONGER rung was standing behind that contract ${String(blocked.length).padStart(4)} ${pct(blocked.length, winters.length)}`)
  const byStep = new Map<string, number>()
  for (const w of blocked) {
    const k = `${w.spokenBy} -> ${w.blockedTop}`
    byStep.set(k, (byStep.get(k) ?? 0) + 1)
  }
  for (const [k, v] of [...byStep.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`      ${k.padEnd(24)} ${String(v).padStart(4)}`)
  }

  const paid = rows.filter((r) => r.sponsorIncomeCents > 0)
  console.log(`\n  what the brands paid in CASH over a career (retainer + appearance + bonus), ${paid.length}/${n} careers received any:`)
  const cash = paid.map((r) => r.sponsorIncomeCents).sort((a, b) => b - a)
  if (cash.length > 0) {
    console.log(`    most ${usd(cash[0])}   median ${usd(cash[Math.floor(cash.length / 2)])}   least ${usd(cash[cash.length - 1])}`)
    const biggest = [...rows].sort((a, b) => b.biggestChequeCents - a.biggestChequeCents)[0]
    console.log(`    the largest SINGLE cheque any career received: ${usd(biggest.biggestChequeCents)} – "${biggest.biggestChequeText}" (${biggest.preset} · ${biggest.policy})`)
  }

  const ended = rows.filter((r) => r.endedWeek !== null)
  console.log(`\n  ${ended.length}/${n} careers ended before the horizon; median run ${[...rows].map((r) => r.weeksRun).sort((a, b) => a - b)[Math.floor(n / 2)]} weeks\n`)

  if (jsonAt >= 0) {
    writeFileSync(argv[jsonAt + 1], JSON.stringify(rows, null, 1))
    console.log(`rows -> ${argv[jsonAt + 1]}`)
  }
}

// A one-shot probe with no importers, so it simply runs. (`vite-node` strips the script path out of
// `process.argv` altogether – measured, not assumed – so the "am I the entry point" guards the older
// benches carry would never fire here.)
main()

export type { CareerRow }

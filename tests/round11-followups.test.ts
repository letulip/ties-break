// Round-11 FOLLOW-UPS – two owner reports from the post-round-11 playtest (27.07).
//
//   F45-1  the header avatar must never react to results. Owner: «верхняя круглая аватарка в
//          хедере вообще не должна меняться эмоционально, там всегда norm для возраста стоит, в
//          остальном она статична.» This is NOT R11-2 (which asked which RESULTS count); it is
//          stronger: the header shows the `norm` crop for her age band, full stop.
//
//   F45-2  an injury must not withdraw her from tournaments she would be FIT for. Owner: «при
//          получении травмы показывается попап, который автоматически выкидывает СО ВСЕХ поданных
//          заявок и делает рефанд, даже если турнир ТОЧНО ПОСЛЕ выздоровления.»
//
// F45-1 is a source-reading test on purpose: it is a fact about WIRING, and wiring is exactly what
// silently rots (same discipline as round10.test.ts / round11-view.test.ts).
import { describe, it, expect } from 'vitest'
import { worldSource } from './worldSource'
import { readFileSync } from 'node:fs'
import { headerCropUrl } from '../src/composables/headerAvatar'
import { portraitStage, type PortraitEmotion } from '../src/shared/avatarEmotion'
import {
  createWorld,
  advanceWeeks,
  enterEvent,
  rollInjury,
  layoffCovering,
  availabilityStatus,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { TIERS } from '../src/engine/season/calendar'
import type { SeasonEvent, TierId } from '../src/engine/season/types'
import type { InjurySeverity } from '../src/shared/protocol'

const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8')

// ===========================================================================
// F45-1 — the header crop is `norm` for her age band, and nothing else.
// ===========================================================================
describe('F45-1 — the header avatar is age-only, never emotional', () => {
  // ⚠ WIDENED by ui/art-rehab-sleepy to the PAINTED union (8) rather than the croppable one (7).
  // The guard is "no emotion of any kind can reach the header", and `rehab` is an emotion the
  // engine's decision can now land on – checking only the croppable seven would have left the one
  // new face unguarded. There is no rehab crop, so the assertions below are stronger for free.
  const EMOTIONS: PortraitEmotion[] = ['norm', 'happy', 'sad', 'serious', 'tired', 'injury', 'angry', 'rehab']

  it('every age the game can reach resolves to the norm crop of its stage', () => {
    // 6 (the childhood prologue's floor) through 40 (well past the milf boundary at 31) – the
    // whole span the stage resolver can be asked about.
    for (let age = 6; age <= 40; age++) {
      const url = headerCropUrl(age)
      const stage = portraitStage(age)
      // No clamp any more: every stage has its own crops, so the header wears her OWN age's face
      // at every age. `adult` used to redirect to teen here.
      expect(url, `age ${age}`).toBe(`/avatars/${stage}-norm.webp`)
      for (const e of EMOTIONS) {
        if (e === 'norm') continue
        expect(url, `age ${age} must not carry ${e}`).not.toContain(e)
      }
    }
  })

  it('the header builder takes ONE argument – there is no parameter an emotion could arrive through', () => {
    // Not "a call site that happens to pass 'norm'": the SHAPE makes an emotion unpassable.
    expect(headerCropUrl.length).toBe(1)
    const src = read('../src/composables/headerAvatar.ts')
    // it may not reach for the emotion DECISION at all – it borrows only the two pure
    // age/path helpers that live alongside it.
    expect(src).not.toContain('avatarEmotion(')
    expect(src).not.toContain('idleEmotion(')
    expect(src).not.toContain('useKidEmotion')
    expect(src).toMatch(/import \{ avatarCropPath, portraitStage \} from '\.\.\/shared\/avatarEmotion'/)
    // ...and the only emotion name in the file is the pinned constant
    for (const e of EMOTIONS) {
      if (e === 'norm') continue
      expect(src, `headerAvatar.ts must not mention ${e}`).not.toContain(`'${e}'`)
    }
  })

  it('the shell shows no face of hers at all – A2 deleted the header it lived in', () => {
    // ⚠ RE-AIMED by A2 (28.07): this used to read "App.vue takes the crop from useHeaderAvatar and
    // never from the emotion composable". The header is gone, so the stronger statement is now
    // true and is what we pin: the shell renders NO avatar, by either route. The positive half of
    // the old guard – that the surviving avatar is the age-only one – moved to the Home pin below.
    const app = read('../src/App.vue')
    expect(app).not.toContain('useHeaderAvatar')
    expect(app).not.toContain('useKidEmotion')
    expect(app).not.toContain('avatarEmotion')
    expect(app).not.toMatch(/avatars\/\$\{/)
    // ⚠ RE-AIMED AGAIN BY THE PODIUM SLICE (31.07), AND ONLY IN ITS PROXY. The claim above is
    // unchanged and is still the point of this test: the shell shows no face of hers. What changed is
    // that `expect(app).not.toContain('<img')` was STANDING IN for that claim, and the shell now
    // renders exactly one picture – the trophy flying from the finale poster to the Trophies tab.
    // That is an object rather than a portrait, and it is the one image no screen can own: it takes
    // off inside the tournament takeover and lands on the bottom bar, so neither end is its home.
    //
    // The blanket ban is therefore replaced by the thing it was a proxy FOR, in a form no face can
    // pass – and the replacement is STRICTER, not weaker, in the direction that matters:
    //   * every path her art can arrive through is named and forbidden outright (`avatars/` is the
    //     crop directory, `fem-euro` the painting stem, and the two url builders that reach them);
    //   * and every <img> in the file is ENUMERATED, so a second one cannot appear unnoticed. The
    //     old assertion could only ever be honoured by deleting it the first day the shell needed an
    //     image, which is exactly what would have happened here.
    expect(app).not.toContain('avatars/')
    expect(app).not.toContain('fem-euro')
    expect(app).not.toContain('cropUrl')
    expect(app).not.toContain('portraitUrl')
    const imgs = [...app.matchAll(/<img\b[\s\S]*?>/g)].map((m) => m[0])
    expect(imgs, `the shell renders ${imgs.length} images:\n${imgs.join('\n')}`).toHaveLength(1)
    expect(imgs[0]).toContain('class="trophy-flight"')
    expect(imgs[0]).toContain(':src="trophyFlight.src"')
    // ...and it is decoration with no reading of its own: the fact it delivers is the tab dot.
    expect(imgs[0]).toContain('aria-hidden="true"')
    expect(imgs[0]).toContain('alt=""')
  })

  it('the Home hero and the Kid screen KEEP their emotions', () => {
    for (const p of ['../src/components/screens/HomeScreen.vue', '../src/components/screens/KidScreen.vue']) {
      expect(read(p), p).toContain('useKidEmotion')
    }
    // The Kid screen shows ONLY the emotional portrait – nothing static competes with it.
    expect(read('../src/components/screens/KidScreen.vue')).not.toContain('useHeaderAvatar')
  })

  it('A2: Home carries BOTH faces, and each keeps its own rule', () => {
    // ⚠ RE-AIMED by A2 (28.07): the app header is gone and its 30px avatar moved onto Home, so
    // "the shell must not be emotional" became "the CHROME avatar must not be emotional" – the two
    // faces now sit on one screen. What the guard protects is unchanged and the pin is sharper for
    // it: the big painting is the emotion composable's, the small crop is the age-only one's, and
    // no element takes both.
    const home = read('../src/components/screens/HomeScreen.vue')
    expect(home).toContain('useKidEmotion')
    expect(home).toContain('useHeaderAvatar')
    expect(home).toContain('class="diary-hero-img" :src="portraitUrl"')
    expect(home).toContain(':src="headerAvatarUrl"')
    // Neither source is wired to the other's element.
    expect(home).not.toContain('class="diary-avatar" :src="portraitUrl"')
    expect(home).not.toContain('class="diary-hero-img" :src="headerAvatarUrl"')
    // And the age-only composable is still emotion-blind at the source (checked above too).
    expect(read('../src/composables/headerAvatar.ts')).not.toContain('useKidEmotion')
  })

  // ===========================================================================
  // R14-1 — the injury painting has exactly two surfaces, and neither of them is the idle ladder.
  // ===========================================================================
  it('the MOMENT face lives in the popup; the STATE face lives on Home', () => {
    // The popup is the surface that only exists on the week it happened, so its emotion is a
    // CONSTANT rather than a decision – it deliberately does not read the composable (the same
    // shape OnboardingWizard uses for its fixed jun-norm frame).
    const dialog = read('../src/components/InjuryStopDialog.vue')
    expect(dialog, 'the injury popup must paint the injury face').toContain("portraitUrl(stage.value, 'injury')")
    expect(dialog, 'and must not derive an emotion of its own').not.toContain('useKidEmotion')
    expect(dialog).not.toContain('avatarEmotion(')

    // ...and nothing hard-codes the moment face onto an ongoing surface. Home and the Kid screen
    // take whatever the ENGINE decided, which for a layoff week is `rehab`.
    for (const p of ['../src/components/screens/HomeScreen.vue', '../src/components/screens/KidScreen.vue']) {
      expect(read(p), `${p} must not name a fixed emotion`).not.toContain("'injury'")
      expect(read(p), `${p} must not name a fixed emotion`).not.toContain("'rehab'")
    }
  })
})

// ===========================================================================
// F45-2 — an injury cancels only the tournaments it actually swallows.
// ===========================================================================

/** The calendar helper the other injury suites use (same shape, same defaults: lists close at the
 *  END of week-2, so `deadlineWeek` defaults to `week - 2`). */
function injectEvent(
  world: WorldState,
  partial: { week: number; tier: TierId; id?: string; deadlineWeek?: number },
): SeasonEvent {
  const e: SeasonEvent = {
    id: partial.id ?? `f45-${partial.week}-${partial.tier}`,
    week: partial.week,
    tier: partial.tier,
    surface: 'hard',
    travelCostCents: 100_00,
    deadlineWeek: partial.deadlineWeek ?? partial.week - 2,
  }
  world.season.push(e)
  world.season.sort((a, b) => a.week - b.week)
  return e
}

type InjuryKnobs = {
  injuryBaseChance: number
  injuryChanceCap: number
  severityBands: { cum: number; severity: InjurySeverity; weeksLo: number; weeksHi: number }[]
}
const KNOBS = ECONOMY.availability as unknown as InjuryKnobs

/** Force ONE onset of exactly `weeksOut` weeks at `world.week`, by patching the live knobs (the
 *  bench/planner pattern: patch, run, always restore). tau is capped at 1 and the severity table is
 *  collapsed to a single fixed-length band, so neither the occurrence nor the length is a coin
 *  flip. `rollInjury` is called directly – it is the unit under test. */
function forceOnset(world: WorldState, weeksOut: number): void {
  const saved = {
    base: KNOBS.injuryBaseChance,
    cap: KNOBS.injuryChanceCap,
    bands: KNOBS.severityBands,
  }
  try {
    KNOBS.injuryBaseChance = 1
    KNOBS.injuryChanceCap = 1
    KNOBS.severityBands = [{ cum: 1, severity: 'moderate', weeksLo: weeksOut, weeksHi: weeksOut }]
    world.physioActive = false // no recovery speed-up: the layoff is exactly `weeksOut`
    rollInjury(world)
  } finally {
    KNOBS.injuryBaseChance = saved.base
    KNOBS.injuryChanceCap = saved.cap
    KNOBS.severityBands = saved.bands
  }
}

/** tau tops out at `ageInjuryFactor` (0.9 at 14) on a week she is not competing, so the onset roll
 *  is not a certainty even with the knobs at 1 – prefix-index for a seed whose roll clears it.
 *  Same idiom as `findFiringSeed` in tests/injuries.test.ts. */
function seedThatFiresAt(prefix: string, week: number): string {
  for (let i = 0; i < 500; i++) {
    const seed = `${prefix}-${i}`
    if (rngFromSeed(`${seed}:injury:${week}`)() < 0.85) return seed
  }
  throw new Error('no firing seed found')
}

/** The withdrawal beats the injury popup scrapes – they name the tier AND the event week. */
/** Which entries the layoff actually pulled her out of.
 *
 *  ⚠ RE-AIMED 05.08 (fix/outgrown-entry), NOT WIDENED FOR CONVENIENCE. This read `'Withdrew from '`
 *  alone, which was the ONE verb the feed had – and that was the bug next door: the engine's own
 *  pull-out reported itself in the parent's voice, so the owner was told he had withdrawn her from a
 *  tournament he had not touched. The injury path now writes `'Taken out of '`. The question this
 *  helper asks is unchanged ("which entries were released, and were they only the swallowed ones?");
 *  what moved is that the answer is no longer a lie about who did it. `deskTookOut` below is the new
 *  claim, asserted beside the old one rather than instead of it. */
const withdrawnFrom = (w: WorldState) =>
  w.events
    .filter((e) => e.type === 'entry' && (e.text.startsWith('Withdrew from ') || e.text.startsWith('Taken out of ')))
    .map((e) => e.text)

/** ...and the half that says the DESK acted: the injury pull-out never uses the parent's verb. */
const deskTookOut = (w: WorldState) =>
  w.events.filter((e) => e.type === 'entry' && e.text.startsWith('Taken out of ')).map((e) => e.text)

/** Fees actually handed back. Read off the refund beats, not off `fundsCents`: the onset also
 *  charges a scans-and-treatment bill, so the net balance is not a clean refund total. */
const refundTotal = (w: WorldState) =>
  w.events.filter((e) => e.text.startsWith('Entry refunded')).reduce((s, e) => s + (e.amountCents ?? 0), 0)

describe('F45-2 — an injury withdraws only the entries inside the layoff', () => {
  /** world.week 10, three entries, all on REAL calendar spacing (deadline = week - 2):
   *    W11  list already closed (deadline 9)  – inside the layoff, fee committed
   *    W12  list still open   (deadline 10)   – inside the layoff
   *    W15  list still open   (deadline 13)   – BEYOND the return week
   *  A 3-week layoff at W10 covers weeks 10-12 and returns her at W13. */
  function worldWithThreeEntries(seed: string) {
    const w = createWorld(seed)
    w.season = []
    w.entries = []
    w.condition = 100
    w.fundsCents = 1_000_000_00

    w.week = 8 // W11's list is still open here, so this entry can be booked...
    const closed = injectEvent(w, { week: 11, tier: 'local', id: 'f45-closed' })
    enterEvent(w, closed.id)

    w.week = 10 // ...and by now it has shut (deadline 9), fee committed.
    const inside = injectEvent(w, { week: 12, tier: 'local', id: 'f45-inside' })
    const beyond = injectEvent(w, { week: 15, tier: 'local', id: 'f45-beyond' })
    enterEvent(w, inside.id)
    enterEvent(w, beyond.id)
    expect(w.entries).toEqual(['f45-closed', 'f45-inside', 'f45-beyond'])
    return { w, closed, inside, beyond }
  }

  it('the entry beyond the return week stays booked, and keeps its fee', () => {
    const { w, beyond } = worldWithThreeEntries(seedThatFiresAt('f45-2-keep', 10))
    forceOnset(w, 3)

    expect(w.injury).not.toBeNull()
    expect(w.injury!.weeksRemaining).toBe(3) // back at W13
    // W15 is a week she will be FIT for – the entry survives untouched...
    expect(w.entries).toContain(beyond.id)
    // ...and no fee came back for it: exactly ONE entry fee was refunded, the W12 one.
    expect(refundTotal(w)).toBe(TIERS.local.entryFeeCents)
    // the news feed never claims she pulled out of it
    expect(withdrawnFrom(w).join('|')).not.toContain('W15')
  })

  it('the entry the layoff swallows is withdrawn and refunded', () => {
    const { w, inside } = worldWithThreeEntries(seedThatFiresAt('f45-2-in', 10))
    forceOnset(w, 3)
    expect(w.entries).not.toContain(inside.id)
    const refund = w.events.find((e) => e.text.startsWith('Entry refunded'))
    expect(refund).toBeDefined()
    expect(refund!.amountCents).toBe(TIERS.local.entryFeeCents)
    expect(withdrawnFrom(w)).toHaveLength(1) // exactly one – not "all of them"
    // ⚠ AND IT IS THE DESK'S OWN VERB, not his. The parent chose nothing here; a feed row reading
    // "Withdrew from ..." is the same misattribution the owner hit on the letter surface (05.08).
    expect(deskTookOut(w)).toHaveLength(1)
    expect(deskTookOut(w)[0]).toMatch(/^Taken out of Local Open/)
    expect(deskTookOut(w)[0]).toMatch(/not fit for that week/)
  })

  it('a post-deadline entry INSIDE the layoff keeps today’s behaviour: booked, fee forfeited', () => {
    const { w, closed } = worldWithThreeEntries(seedThatFiresAt('f45-2-closed', 10))
    forceOnset(w, 3)
    // the list has shut, so there is nothing to give back – she stays entered and walks over
    expect(w.entries).toContain(closed.id)
    expect(refundTotal(w)).toBe(TIERS.local.entryFeeCents) // the W12 fee only, not this one
    expect(withdrawnFrom(w).join('|')).not.toContain('W11')
  })

  it("the owner's case: a 2-week niggle cancels NOTHING she would be fit for", () => {
    // Entry lists close 2 weeks out, so a still-refundable entry is always >= world.week + 2 –
    // which a 1- or 2-week layoff can never reach. The blast radius of a minor injury is now zero.
    const { w } = worldWithThreeEntries(seedThatFiresAt('f45-2-niggle', 10))
    forceOnset(w, 2)
    expect(w.injury!.weeksRemaining).toBe(2)
    expect(w.entries).toEqual(['f45-closed', 'f45-inside', 'f45-beyond'])
    expect(withdrawnFrom(w)).toEqual([])
    expect(refundTotal(w)).toBe(0)
  })

  it('REGRESSION: the kept entry is still playable when its week arrives', () => {
    const { w, beyond } = worldWithThreeEntries(seedThatFiresAt('f45-2-play', 10))
    forceOnset(w, 3)
    expect(w.entries).toContain(beyond.id)

    // She is back at W13; the knobs are restored, so no second onset is forced on the way.
    //
    // ⚠ TWO advances now, and that is R12-15 LANDING, not a regression. This fixture holds the
    // owner's dead-click state on purpose: `f45-closed` sits on W11, post-deadline, inside the
    // layoff – so W11 resolves as a WALKOVER with its fee forfeited. That beat used to be silent
    // (no stop, no dialog, no toast), which is exactly why a single `advanceWeeks(…, 5)` used to
    // run straight past it to W15. It now HALTS on the walkover, so the player sees the money go;
    // the advance is simply resumed, and the property this test exists for – that the surviving
    // entry beyond her return week still PLAYS – is unchanged below.
    const rng = rngFromSeed(w.seed)
    expect(advanceWeeks(w, rng, 5)).toContain('walkover') // -> W11, the forfeited walkover
    expect(w.week).toBe(11)
    advanceWeeks(w, rng, 4) // -> W15, her event week
    expect(w.week).toBe(15)
    expect(w.injury).toBeNull()
    // the availability gate agrees she may be there...
    expect(availabilityStatus(w, beyond).level).not.toBe('blocked')
    // ...and the week actually resolved as a tournament she is IN – not a walkover, not a
    // silently-dropped entry. The draw is staged for the reveal, keyed to her surviving entry.
    expect(w.events.filter((e) => e.week === 15).some((e) => e.text.startsWith('Walkover'))).toBe(false)
    expect(w.pendingTournament).not.toBeNull()
    expect(w.pendingTournament!.eventId).toBe(beyond.id)
    expect(w.pendingTournament!.result.finishes).toHaveProperty(KID_ID)
    expect(w.pendingTournament!.result.matches.some((m) => m.aId === KID_ID || m.bId === KID_ID)).toBe(true)
  })

  it('the injury popup no longer reads as "your season is cancelled"', () => {
    const dialog = read('../src/components/InjuryStopDialog.vue')
    // the row is about what was CANCELLED, and the empty case says so out loud – "None affected"
    // was ambiguous the moment some entries started surviving.
    expect(dialog).toContain('<th>Cancelled</th>')
    expect(dialog).not.toContain('None affected')
    expect(dialog).toContain('Nothing – every entry stands')
    // ...and whatever the list holds, the note names the boundary the cancellation stops at
    expect(dialog).toContain('is still booked')
    expect(dialog).toContain('backWeek')
    // player-facing copy: the short dash only, and no Cyrillic (owner's standing rule)
    const copy = dialog.slice(dialog.indexOf('<template>'))
    expect(copy).not.toContain('—')
    expect(copy).not.toMatch(/[Ѐ-ӿ]/)
  })

  it('the onset sweep asks the SAME layoff question as the entry gate and the planner', () => {
    // R10-17 fixed this arithmetic once; there must not be a third copy of the comparison.
    const w = createWorld('f45-2-one-rule')
    w.week = 10
    w.injury = { kind: 'ankle strain', severity: 'moderate', weeksRemaining: 3, totalWeeks: 3, sinceWeek: 10 }
    for (const week of [10, 11, 12]) expect(layoffCovering(w, week), `W${week}`).not.toBeNull()
    for (const week of [13, 14, 20]) expect(layoffCovering(w, week), `W${week}`).toBeNull()
    w.injury = null
    expect(layoffCovering(w, 10)).toBeNull()

    // ...and the three surfaces all route through it rather than spelling `world.week +
    // weeksRemaining` again for themselves.
    // world.ts AND every world/*.ts part (P4): the rule is 'one implementation', not 'one file'
    const engine = worldSource()
    expect(engine.match(/week < world\.week \+ world\.injury\.weeksRemaining/g)).toBeNull()
    expect(engine.match(/layoffCovering\(/g)!.length).toBeGreaterThanOrEqual(4)
  })
})

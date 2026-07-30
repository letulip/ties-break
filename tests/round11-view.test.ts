import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import { surfaceStyleAffinity, surfaceStyleHint, SURFACE_STYLE_DELTAS } from '../src/engine/match/style'
import { HORIZON_WEEKS, gapInResultsNote, isTierOpen, pointsLockNote, tierState, type TierStateInput } from '../src/composables/tierState'
import { resultShowsOnHerFace } from '../src/composables/kidEmotion'
import type { PlayStyle, WorldEvent, WorldMatch } from '../src/shared/protocol'
import type { Surface } from '../src/engine/match/types'
import type { TierId } from '../src/engine/season/types'

// ---------------------------------------------------------------------------
// Round 11, wave C — PRESENTATION ONLY. No engine file is touched by any of these
// FILE NAME: this lives in round11-VIEW.test.ts, not round11.test.ts, because wave A created a
// file of that name on its own branch in parallel and the two collided add/add at integration —
// the exact conflict round 10 hit before it (round10.test.ts / round10-view.test.ts). Same split,
// same reason: correctness tests in round11.test.ts, presentation tests here.
// items; every one of them reads data the Snapshot already carries.
//
//   R11-15  the surface PILL comes back to the calendar card corner (this REVERTS
//           R10-11's ringed dot), with the surface name inside the pill and only
//           the fit verdict underneath it.
//   R11-2   a PRACTICE match must not swap the win/loss avatar. Tournaments do; a
//           friendly at the club does not.
//   R11-14  "Practice match + coach" on ONE line in the calendar.
//   R11-5a  "locked – needs N pts" told apart from "unlocked, nothing scheduled".
//
// The file-reading tests are deliberate: three of these four items are facts about a
// TEMPLATE or a STYLESHEET, and those are exactly the facts that silently rot. Same
// discipline as tests/round10.test.ts.
// ---------------------------------------------------------------------------

const seasonScreen = readFileSync(new URL('../src/components/screens/SeasonScreen.vue', import.meta.url), 'utf8')
const homeScreen = readFileSync(new URL('../src/components/screens/HomeScreen.vue', import.meta.url), 'utf8')
// PIN MOVED by Diary-1: the result/title walk left composables/kidEmotion.ts for engine/diary.ts
// (lastKidResultOf), because the diary's copy system needed the same walk engine-side and one walk
// in one place is the only way the painting and the phrase can never disagree. The property this
// file pins – the walk asks resultShowsOnHerFace, not a parallel copy – is unchanged; only the
// file that carries the walk moved.
const kidEmotionSrc = readFileSync(new URL('../src/engine/diary.ts', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')

/** The body of a CSS rule, by selector (every occurrence – see the round-10 lesson). */
function cssBodies(selector: string): string[] {
  const out: string[] = []
  for (let from = 0; ; ) {
    const i = css.indexOf(`${selector} {`, from)
    if (i < 0) return out
    out.push(css.slice(i, css.indexOf('}', i)))
    from = i + 1
  }
}

const STYLES = Object.keys(SURFACE_STYLE_DELTAS) as PlayStyle[]
const SURFACES: Surface[] = ['hard', 'clay', 'grass']

// ⚠ `eventCardTop()` went with wave 2: the card's top row is the name and the weather now, and
// the surface moved down into the place row. The tests above slice `.event-place` instead.

// ===========================================================================
// R11-15 — the pill is back, and the surface name is printed EXACTLY ONCE.
// ===========================================================================
describe('the surface mark on the Season card (R11-15, reversed by the owner in wave 2)', () => {
  // ⚠ R11-15 put a coloured PILL back in the card corner, reverting R10-11's ringed dot, because
  // the owner asked for it. In wave 2 he asked for the EXPORT's mark instead: two concentric rings
  // in the court's colour with the name beside them. That is not a return to R10-11 - what R10-11
  // got wrong was flinging the name away from the mark, and what R11-15 was defending was the name
  // being printed once, next to its colour. Both of those still hold, and both are pinned here.
  it('the card carries the export\'s ring mark, with the name beside it', () => {
    const from = seasonScreen.indexOf('<div class="event-place">')
    expect(from).toBeGreaterThan(0)
    const place = seasonScreen.slice(from, seasonScreen.indexOf('</div>', from))
    expect(place).toContain('class="surface-mark"')
    expect(place).toContain('class="surface-ring"')
    expect(place).toContain('{{ row.event.surface }}') // the NAME sits with the mark
    expect(place).not.toContain('surface-dot') // R10-11's bare dot is still gone
    expect(cssBodies('.surface-dot')).toEqual([])
  })

  it('the surface name is printed EXACTLY ONCE on the card – R11-15\'s actual complaint', () => {
    expect(seasonScreen.split('{{ row.event.surface }}').length - 1).toBe(1)
  })

  it('the VERDICT still reaches the player, exactly once, through the coach', () => {
    // R11-15's real complaint was DUPLICATION - the court named in the pill and named again in the
    // line under it. Wave 2 removed the standalone caption because the card grew a coach's plaque,
    // and his sentence is the natural home for "the court suits her game". Still consumed from the
    // engine, still said once.
    expect(seasonScreen).toContain('const fit = surfaceFit(e.surface)')
    expect(seasonScreen).toContain('coachSays(row.event)')
    expect(seasonScreen.split('coachSays(row.event)').length - 1).toBe(1)
    expect(seasonScreen).not.toContain('surface-caption')
  })

  it('THE STRIP THE COMPONENT SLICES: every engine hint is "<Surface> – <verdict>"', () => {
    // surfaceFit() in SeasonScreen takes the tail after the first "– ". That is only correct while
    // surfaceStyleHint keeps prefixing the surface name; if the engine's copy is ever reworded this
    // fails HERE, rather than shipping "Grass – suits her game" out of a coach's mouth on a card
    // that has already named the court.
    for (const style of STYLES) {
      for (const surface of SURFACES) {
        const hint = surfaceStyleHint(style, surface)
        if (!hint) continue
        expect(hint, `${style}/${surface}`).toMatch(
          new RegExp(`^${surface.charAt(0).toUpperCase()}${surface.slice(1)} – `),
        )
        // ...and the affinity agrees with the words, so the ring's colour and the coach's clause
        // can never contradict each other.
        expect(surfaceStyleAffinity(style, surface), `${style}/${surface}`).not.toBe('neutral')
      }
    }
  })

  it('the ring is the export\'s geometry, and the colour rides on the RING, not the word', () => {
    const outer = cssBodies('.surface-ring')[0] ?? ''
    expect(outer).toContain('width: 19px')
    expect(outer).toContain('border: 1.5px solid currentColor')
    const inner = cssBodies('.surface-ring i')[0] ?? ''
    expect(inner).toContain('width: 9px')
    // one declared colour per surface, and each one only reaches the ring
    for (const surf of ['hard', 'clay', 'grass']) {
      const rule = cssBodies(`.surface-mark.surf-${surf} .surface-ring`)[0] ?? ''
      expect(rule, surf).toContain(`var(--surface-${surf})`)
    }
    // clay is the export's own value, verbatim
    expect(css).toContain('--surface-clay: #e2822f')
  })
})

// ===========================================================================
// R11-2 — a friendly is practice: it must not change how she looks.
// ===========================================================================
describe('R11-2 — no win/loss avatar swap for practice matches', () => {
  const match = { winnerId: 'kid' } as unknown as WorldMatch
  const tournamentRound: WorldEvent = { id: 1, week: 4, type: 'match', text: 'beat X', match }
  const friendly: WorldEvent = { id: 2, week: 4, type: 'match', text: 'beat Y', match, friendly: true }
  const news: WorldEvent = { id: 3, week: 4, type: 'info', text: 'a quiet week' }

  it('a tournament round shows on her face; a friendly does not', () => {
    expect(resultShowsOnHerFace(tournamentRound)).toBe(true)
    expect(resultShowsOnHerFace(friendly)).toBe(false)
    expect(resultShowsOnHerFace(news)).toBe(false)
  })

  it('the gate is what the emotion walk actually asks – not a parallel copy', () => {
    const walk = kidEmotionSrc.slice(
      kidEmotionSrc.indexOf('function lastKidResultOf'),
      kidEmotionSrc.indexOf('function lastKidTitleOf'),
    )
    expect(walk).toContain('resultShowsOnHerFace(e)')
    // the old unguarded `if (!match) continue` must not still be the only filter
    expect(walk).not.toMatch(/if \(!match\) continue/)
  })

  // PIN MOVED by F45-1 (27.07). This used to sweep THREE surfaces including App.vue. The owner has
  // since ruled the header avatar emotion-free entirely — «в хедере… всегда norm для возраста» — so
  // App.vue is no longer an emotional surface and asserting it reads the emotion composable would
  // now pin the bug. The R11-2 property this test exists for is unchanged for the surfaces that DO
  // show an emotion; the header's own rule is pinned in tests/round11-followups.test.ts.
  it('ONE predicate, not two copies: every EMOTIONAL portrait surface reads useKidEmotion', () => {
    const surfaces = ['../src/components/screens/HomeScreen.vue', '../src/components/screens/KidScreen.vue']
    for (const rel of surfaces) {
      const src = readFileSync(new URL(rel, import.meta.url), 'utf8')
      expect(src, rel).toContain('useKidEmotion')
      // none of them derives an emotion (or an avatar filename) of its own
      expect(src, rel).not.toContain('avatarEmotion(')
      expect(src, rel).not.toMatch(/avatars\/\$\{/)
    }
    // the header is not on the list any more – and must not quietly rejoin it
    const app = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
    expect(app).not.toContain('useKidEmotion')
    // TournamentFlow picks its finale art from `pending`, which only exists for a TOURNAMENT
    // reveal – a friendly never mounts it, so it needs no gate and must not grow one.
    const flow = readFileSync(new URL('../src/components/TournamentFlow.vue', import.meta.url), 'utf8')
    expect(flow).toContain('game.snapshot?.pending')
  })
})

// ===========================================================================
// R11-14 — the booking label on ONE line.
// ===========================================================================
describe('R11-14 — "Practice match + coach" is one line in the calendar', () => {
  it('the label is a single uninterrupted expression', () => {
    expect(seasonScreen).toContain("🎾 Practice match{{ row.practice.withCoach ? ' + coach' : '' }}")
  })

  it('the controls sit in their own band, so they can never squeeze the text again', () => {
    const row = seasonScreen.slice(
      seasonScreen.indexOf("row.kind === 'practice' && row.practice"),
      seasonScreen.indexOf('<!-- An empty week'),
    )
    expect(row).toContain('class="planned-actions"')
    // both controls are inside it
    expect(row.indexOf('askCancelPractice')).toBeGreaterThan(row.indexOf('planned-actions'))
    expect(row.indexOf('playPracticeWeek')).toBeGreaterThan(row.indexOf('planned-actions'))
    // the vacation row got the same shape – it is the same card
    const vac = seasonScreen.slice(
      seasonScreen.indexOf("row.kind === 'vacation' && row.vacation"),
      seasonScreen.indexOf("row.kind === 'practice' && row.practice"),
    )
    expect(vac).toContain('class="planned-actions"')
  })

  it('the planned row stacks instead of competing for width', () => {
    const rule = cssBodies('.calendar-row-muted.planned')[0]
    expect(rule).toContain('flex-direction: column')
    // ⚠ RE-AIMED by the css-dry pass (docs/specs/css-dry-audit.md): `.planned-actions` and
    // `.dialog-actions` were the same three declarations - a row of actions pushed right - and are
    // now one rule. The selector list ENDS with `.planned-actions`, so cssBodies() still reads the
    // rule that declares the flex-end, and the fact is unchanged: a booked week's controls take
    // their own band under the text, right-aligned, instead of competing with it for width.
    expect(cssBodies('.planned-actions')[0]).toContain('justify-content: flex-end')
  })
})

// ===========================================================================
// R11-5a — "locked" vs "nothing scheduled", as ONE rule.
// ===========================================================================
describe('R11-5a — the tier ladder tells a point lock apart from an empty calendar', () => {
  // The ITF annual entry cap (feat/junior-age-caps) added a fifth input. R11-5a is about the
  // point lock vs the empty calendar, so every case here runs with the allowance UNTOUCHED – the
  // cap has its own suite in tests/age-caps.test.ts.
  const base: TierStateInput = {
    ageYears: 16,
    points: 0,
    upcoming: [],
    horizonWeeks: HORIZON_WEEKS,
    entryCap: { used: 0, limit: 25, remaining: 25 },
  }
  const at = (points: number, upcoming: { tier: TierId; week: number }[] = []): TierStateInput => ({
    ...base,
    points,
    upcoming,
  })

  it('THE REPORT WAS STRUCTURALLY IMPOSSIBLE: j30 is a strict subset of national', () => {
    // The owner said he could enter a J30 but not a National. By the bands that cannot happen –
    // which is why the fix is a sentence, not a rule.
    // ⚠ RE-AIMED by the two ladders. The original report was structurally impossible because j30's
    // POINTS band was a strict subset of national's - both were on one ladder. They are on two now,
    // so the comparison cannot be made in points at all. The structural fact survives in its real
    // form: national is the last DOMESTIC rung and never closes, and j30 is open to anyone, so a
    // player who has national open always has j30 open too - the report stays impossible.
    const [natMin] = TIERS.national.enterPointBand
    expect(TIERS.j30.enterPct).toBeUndefined()
    expect(natMin).toBeGreaterThan(0)
    for (const points of [180, 200, 400, 1_000]) {
      const nat = tierState('national', at(points))
      const j30 = tierState('j30', at(points))
      expect(isTierOpen(j30) && !isTierOpen(nat), `${points} pts: J30 open but National not`).toBe(false)
    }
  })

  it('below the floor is LOCKED, and says what it costs', () => {
    const s = tierState('national', at(100))
    expect(s.kind).toBe('locked')
    expect(s.pointsToEnter).toBe(TIERS.national.enterPointBand[0])
    // ⚠ RE-AIMED (30.07, fix/ranking-truth), assertion by assertion the SAME facts: below the floor is
    // 'locked', it carries the threshold, and the note says what it costs. What the note now also says
    // is WHICH points ("national" - there are two tables and this band is denominated in one of them)
    // and WHERE SHE STANDS ("100 / 150" rather than a bare target). Both are the owner's item 26,
    // «мне главное, чтобы было наглядно и однозначно». The wording lives in `pointsLockNote`, which is
    // pinned directly below.
    expect(s.note).toBe('100 / 150 national pts')
    expect(isTierOpen(s)).toBe(false)
  })

  it('past the ceiling is OUTGROWN, unchanged', () => {
    const s = tierState('local', at(TIERS.local.enterPointBand[1] + 1))
    expect(s.kind).toBe('outgrown')
    expect(isTierOpen(s)).toBe(false)
  })

  it('open WITH an event on the calendar names the earliest one', () => {
    const s = tierState('national', at(200, [
      { tier: 'national', week: 30 },
      { tier: 'national', week: 24 },
      { tier: 'j30', week: 20 },
    ]))
    expect(s.kind).toBe('scheduled')
    expect(s.nextWeek).toBe(24)
    expect(isTierOpen(s)).toBe(true)
    // the DATE, never a week number – R11-6 owns week rendering and this must not pre-empt it
    expect(s.title).toMatch(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/)
    expect(s.note).not.toMatch(/W\d/)
  })

  it("THE OWNER'S CASE: open, nothing scheduled – and it says exactly that", () => {
    // 200 pts, a J30 on the calendar, no National anywhere in the horizon (national runs every
    // 13 weeks + 2 extras = 6 a season, against j30's ~26).
    const upcoming = [
      { tier: 'j30' as TierId, week: 12 },
      { tier: 'local' as TierId, week: 11 },
    ]
    // ⚠ RE-AIMED by the National stagger: 200 points used to open both rungs, and J30's floor is
    // now 250. The owner's case needs a total at which BOTH are open, so it moved up with the gate.
    const nat = tierState('national', at(260, upcoming))
    const j30 = tierState('j30', at(260, upcoming))
    expect(j30.kind).toBe('scheduled')
    expect(nat.kind).toBe('unscheduled')
    expect(isTierOpen(nat)).toBe(true) // she is NOT locked out – that was the whole confusion
    expect(nat.note).toContain(`${HORIZON_WEEKS} weeks`)
    expect(nat.note).not.toContain('Reach')
    expect(nat.title).toContain('not locked')
  })

  it('the age gate stays its own state (the junior tour is 13+)', () => {
    const s = tierState('j30', { ...at(1_000), ageYears: 12 })
    expect(s.kind).toBe('age-locked')
    expect(s.note).toBe(`Opens at ${TIERS.j30.minAgeYears}`)
  })

  it('every rung, every state, in player copy (short dash, no Cyrillic)', () => {
    for (const points of [0, 100, 200, 500, 1_000]) {
      for (const id of TIER_LADDER) {
        const s = tierState(id, at(points, [{ tier: 'local', week: 3 }]))
        expect(s.note, `${id}@${points}`).not.toMatch(/[—А-Яа-яЁё]/)
        expect(s.title, `${id}@${points}`).not.toMatch(/[—А-Яа-яЁё]/)
        expect(s.note.length, `${id}@${points} note is a chip label, not a sentence`).toBeLessThan(28)
      }
    }
  })

  it('ONE rule, many surfaces: neither screen re-derives a band', () => {
    for (const [name, src] of [['Home', homeScreen], ['Season', seasonScreen]] as const) {
      expect(src, name).toContain("composables/tierState")
      expect(src, name).not.toContain('enterPointBand')
    }
    // the Home ladder no longer reaches for the tier catalogue or the age gate at all
    expect(homeScreen).not.toContain('isTierAgeOpen')
    expect(homeScreen).not.toMatch(/TIERS\[/)
    // ...and the words of a point lock are written in exactly one place
    expect(homeScreen).not.toContain('Reach ')
    const lock = seasonScreen.slice(seasonScreen.indexOf('function lockLabel'), seasonScreen.indexOf('// --- R11-5a'))
    expect(lock).toContain('pointsLockNote(')
    expect(lock).not.toMatch(/`Reach \$/)
  })

  it('an event card keeps the ENGINE\'s own threshold, not the ladder\'s verdict', () => {
    // Found in the browser: reading the ladder's whole note here let a card the engine had locked
    // print the ladder's "open" state. Same words, but each surface keeps its authoritative number.
    //
    // ⚠ RE-AIMED (30.07, fix/ranking-truth). THE PROTECTED FACT IS UNCHANGED and still asserted on the
    // next two lines: the card's number is the ENGINE's per-event `pointsToEnter`, and the WORDS come
    // from the one shared function. What moved is the wording itself, twice over, both for the owner's
    // «мне главное, чтобы было наглядно и однозначно» (item 26):
    //   * it NAMES ITS CURRENCY. "Reach 180 pts" did not say which of the two point tables it meant,
    //     and it means the national one - every rung's band is denominated there.
    //   * it is a FRACTION when the caller knows where she stands, because "how far off am I?" is half
    //     of what a player is asking and the old copy answered only the other half.
    // The one-argument form is kept and still tested, for callers that have the threshold but not her
    // total.
    expect(pointsLockNote(180)).toBe('Reach 180 national pts')
    expect(pointsLockNote(180, 112)).toBe('112 / 180 national pts')
    const lock = seasonScreen.slice(seasonScreen.indexOf('function lockLabel'), seasonScreen.indexOf('// --- R11-5a'))
    expect(lock).toContain('e.pointsToEnter')
  })

  // --- item 26: the gate has to be LEGIBLE, and that is a property a test can hold ----------------
  // The owner asked for J30's points floor to be replaced by "win a National" and then said what he
  // actually wanted was for the gate to be «наглядно и однозначно». The threshold stayed (it is
  // continuous, and it never tells a girl with three National semi-finals she has achieved nothing);
  // what it gained is her position in it, plus a sentence saying what would close the gap.
  describe('the domestic gate reads unambiguously', () => {
    it('the gap is said in TOURNAMENTS, priced off the catalogue rather than hardcoded', () => {
      // 138 short, holding 112 national points: regional is open to her at 112 (band [65, 250]) and its
      // semi-final pays 28, so three of them is 84 - not enough; its FINAL pays 48, and three of those
      // is 144. The function walks best-finish-first and stops at the first plan of <=3 trips.
      const note = gapInResultsNote(138, 112)
      expect(note).toBeTruthy()
      // Whatever it picks, it must be a REAL rung with a REAL finish value that actually closes the gap.
      const m = /^(?:one|(\d+)) more (.+?)s? at (.+)$/.exec(note!)
      expect(m, `unparseable: ${note}`).toBeTruthy()
      const n = m![1] ? Number(m![1]) : 1
      const tier = Object.values(TIERS).find((t) => t.label === m![3])
      expect(tier, `no such tier: ${m![3]}`).toBeTruthy()
      expect(n).toBeLessThanOrEqual(3)
      // it names a rung she can actually enter right now...
      const [lo, hi] = tier!.enterPointBand
      expect(112).toBeGreaterThanOrEqual(lo)
      expect(112).toBeLessThanOrEqual(hi)
      // ...and n x (some finish it really pays) does close the gap.
      expect(tier!.points.some((p) => p > 0 && n * p >= 138 && Math.ceil(138 / p) === n)).toBe(true)
    })

    it('NEVER offers an international result as a way to close a national-points gap', () => {
      // The two ladders have no exchange rate (docs/specs/two-ladders.md). Legibility must not be
      // bought by quietly merging them, so this sweeps the whole plausible range.
      const itfLabels = Object.values(TIERS).filter((t) => t.track === 'itf').map((t) => t.label)
      for (let points = 0; points <= 400; points += 7) {
        for (const gap of [1, 15, 60, 138, 300]) {
          const note = gapInResultsNote(gap, points)
          if (note === null) continue
          for (const label of itfLabels) expect(note, `${points}/${gap}: ${note}`).not.toContain(label)
        }
      }
    })

    it('says nothing rather than something useless: no gap, or no plan inside three trips', () => {
      expect(gapInResultsNote(0, 100)).toBeNull()
      expect(gapInResultsNote(-5, 100)).toBeNull()
      // A gap far past three trips at every rung open to a point-less kid (local tops out at a 30-point
      // title, so 3 x 30 = 90 is the most it can promise).
      expect(gapInResultsNote(5_000, 0)).toBeNull()
    })

    it('the locked tooltip states the gap, her total, the threshold AND which points they are', () => {
      const s = tierState('national', {
        ...base,
        points: 112,
        engineOpen: false,
      })
      expect(s.kind).toBe('locked')
      // the chip: both halves of the question, in one glance
      expect(s.note).toBe('112 / 150 national pts')
      // the tooltip: the distance, where she stands, and the one sentence no number can imply
      expect(s.title).toContain('38 more national pts')
      expect(s.title).toContain('112 of 150')
      expect(s.title).toContain('National points come from Local, Regional and National events')
      // plain copy only: no jargon, no long dash, no Cyrillic
      expect(s.title).not.toMatch(/\btrack\b|\bdomestic\b|\bITF\b/)
      expect(s.note + s.title).not.toContain('—')
      expect(s.note + s.title).not.toMatch(/[Ѐ-ӿ]/)
    })
  })

  it('the Season screen names the open-but-unscheduled tiers under the calendar', () => {
    expect(seasonScreen).toContain('openButUnscheduled')
    expect(seasonScreen).toContain('Also open to her:')
    const note = seasonScreen.slice(seasonScreen.indexOf('Also open to her:'))
    expect(note.slice(0, 220)).toContain('Not locked')
    expect(note.slice(0, 220)).not.toMatch(/[—А-Яа-яЁё]/)
  })

  it('the ladder chip has a state of its own for it', () => {
    expect(homeScreen).toContain("'waiting'")
    expect(cssBodies('.tier-chip.waiting').length).toBe(1)
  })
})

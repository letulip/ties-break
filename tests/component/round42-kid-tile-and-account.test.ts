// =================================================================================================
// ⭐⭐⭐ ROUND 42 #6 + #10 + #22 – HER PAGE STOPS BEING THE SAME PAGE FOR EVERY GIRL
// =================================================================================================
//
// Three items, one screen, and one law underneath all three. The owner, 14.09, after playing the
// deployed wave-5 build:
//
//   #6  «personality у всех девочек одинаковая… patient and stubborn, мы вроде бы делали
//       дифференциацию?» – RULED, with the law stated: «всё, со слоем эмоций "всегда" кончились,
//       теперь у нас вариативность везде».
//   #10 «информация о ее аккаунте… использовать то же, что и в family budget, и поставить либо
//       перед, либо после counting results».
//   #22 «Я как видел в начале карьеры, что она подавать и возвращать не умеет, так и вижу сейчас.
//       По какому принципу тренер работает?» … «"никто не учил" я читаю как "а зачем тогда мне
//       вообще тренер"» – RULED: «его слова о ней точно должны меняться на протяжении роста и
//       карьеры».
//
// His sentences are quoted here and not in a template: tests/round13-nav.test.ts bans Cyrillic
// inside one.
//
// ⚠ THE SNAPSHOTS ARE REAL. Every case below walks a real career through the real engine and mounts
// the real screen with the real stylesheet; the only thing ever posed is a number ON THE WORLD
// (`spirit`, `kidFundsCents`, `plan`), never a string on the wire. A case that spliced `life` would
// be testing this file's arithmetic instead of `buildKidLife`'s.
//
// ⚠⚠ THE ARM LEDGER – every mutation was really applied, really run and really reverted by hand,
// with the file's md5 asserted back to pristine before the next arm. The counts are MEASURED; where
// a prediction was wrong, the measurement is what is written. The round-42 ledger carries the table.
//
//   CONTROL, run first and green: this file 11 · round23-kid-page 5 · round41-kid-desktop-layout 5
//   · kidLife 32 · radar-read 16 = 69/69. Every arm below ran against that same set of five files.
//
//   ARM 1  `toSnapshot` hands `world.spirit >= 70 ? 'sunny' : 'deep'` – the tile bound to this
//          week's mood, which is the defect the fence exists to forbid.
//          **4 RED**: §1's four-careers case, both fence cases, and kidLife's end-to-end.
//   ARM 2  `buildKidLife` returns `TEMPERAMENT_PERSONALITY.quiet` for everybody – «always the same»,
//          the shipped defect in its purest form. **4 RED**: both four-careers cases (here and in
//          kidLife), the walls fence, and kidLife's end-to-end. ⚠ §1's MOOD fence stayed green, and
//          correctly: a constant tile does not move with her mood either.
//   ARM 3  `toSnapshot` hands `expressedTemperamentOf(world)` – the EXPRESSED girl where the voice
//          law says birth. **2 RED**: the walls fence here and kidLife's end-to-end.
//          ⚠⚠ AND THIS ARM IS THE REASON THE WALLS CASE EXISTS. Run against the file as first
//          written it scored **0 red**, because every career these cases walk has `wallsFlipped`
//          false, where the two reads agree by arithmetic (`expressedTemperamentOf`'s own note: the
//          zero arm «is true by construction and is worth nothing on its own»). The case flips both
//          axes by hand – the positive control – and the arm bites.
//   ARM 4  `ownAccountCard` returns null always. **7 RED** across three files: every account case
//          here, the two round-23 account arms, round-23's notes-fit case and round-41's desktop
//          placement.
//   ARM 5  the prize row quotes a literal `'10%'` instead of `kidPrizeShareBps`. **1 RED**: §3's
//          every-figure-is-the-engine's case – which is the only one that can see it, because the
//          career it walks is past the first step of the ramp.
//   ARM 6  `isDone` returns false always – saturation silences nothing, i.e. the shipped licences.
//          **2 RED**: the two registers case and the paid-slot case. The absence line and the edge
//          verdict come back and win the draw on a wing with nothing left in it.
//   ARM 7  the fill band dropped from `axisNote`'s draw key. **0 RED – AND THE CHANGE WAS DROPPED
//          RATHER THAN THE TEST WIDENED.** Measured over four rungs x four seeds x 420 weeks, the
//          key change makes the words change LESS often at a band crossing (85/121 against 103/121),
//          so it was a worse answer to the item it was written for. The measurement is recorded
//          above `axisNote`; the key ships exactly as it was.
//   ARM 8  `aimedHere` returns false always – the eye cannot see where the week is pointed.
//          **1 RED**: the paid-slot case.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import KidScreen from '../../src/components/screens/KidScreen.vue'
import { useGameStore } from '../../src/stores/game'
import {
  createWorld,
  tickWeek,
  toSnapshot,
  closeTournament,
  skipTournament,
  decideKnock,
  pendingKnock,
  pendingBirthday,
  birthdayOffer,
  chooseGift,
  enterEvent,
  availabilityStatus,
} from '../../src/engine/world'
import type { WorldState } from '../../src/engine/world'
import { TEMPERAMENT_PERSONALITY } from '../../src/engine/kidLife'
import { TEMPERAMENTS, expressedTemperamentOf, type Temperament } from '../../src/engine/spirit'
import { radarViewOf } from '../../src/engine/world/knock'
import { axisReadings, buildRadar, fillBandOf, shownSkill, ceilingHalfWidth, CEILING_CENTRE_DRIFT, NOTE_MIN_CONFIDENCE } from '../../src/engine/radar'
import { ECONOMY } from '../../src/engine/economy'
import { rngFromSeed } from '../../src/engine/rng'
import { kidPrizeShareBps, managerCommissionBps } from '../../src/engine/economy'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS, type Snapshot } from '../../src/shared/protocol'
import { availableWidth, boxOf, setViewport, PHONE, TABLET, DESKTOP, type Viewport } from './fits'

/** His own parity set (the standing rule of 14.09: «визуальную проверку на всех экранах надо тоже
 *  заложить в билдера в спеку»). 900 is the top of the tablet band and has no entry in `fits.ts`. */
const WIDE: Viewport = { width: 900, height: 900 }
const SWEEP: Viewport[] = [PHONE, TABLET, WIDE, DESKTOP]

/** A quiet career: every tournament skipped, so nothing on the page is about a result. */
function quietCareer(seed: string, week: number): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, birthMonth: 6 })
  const rng = rngFromSeed(world.seed)
  while (world.week < week) {
    world.fundsCents = Math.max(world.fundsCents, 500_000_00)
    if (pendingKnock(world)) decideKnock(world, 'rest')
    const age = pendingBirthday(world)
    if (age !== null) chooseGift(world, birthdayOffer(world.seed, age).options[0].id)
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return world
}

/** ...and a career that PLAYS, which is the only kind the coach's eye can read at all: evidence is
 *  what lifts confidence past `NOTE_MIN_CONFIDENCE`, and below that floor he speaks no verdict.
 *
 *  ⚠ THE `finished` GUARD IS LOAD-BEARING. `skipTournament` unconditionally is the «skip everything»
 *  harness two functions up, and it produces a career with ZERO matches – measured while building
 *  this file: 416 weeks, `matchesPlayed: 0`, every axis under the floor at every rung, so the whole
 *  of §5 would have measured the fog instead of the girl. */
function playingCareer(
  seed: string,
  weeks: number,
  tier: 'self' | 'budget' | 'middle' | 'elite' = 'elite',
  onWeek?: (w: WorldState) => void,
): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background: 'wealthy', coachTier: tier })
  world.plan = { ...WEEK_PLAN_PRESETS.balanced }
  const rng = rngFromSeed(world.seed)
  for (let w = 0; w < weeks; w++) {
    world.fundsCents = Math.max(world.fundsCents, 900_000_00)
    for (const e of world.season.filter((e) => e.week > world.week && e.week <= world.week + 4)) {
      if (world.entries.includes(e.id)) continue
      try {
        if (availabilityStatus(world, e).level === 'blocked') continue
        enterEvent(world, e.id)
      } catch {
        /* a lock the player would see on the card */
      }
    }
    if (pendingKnock(world)) decideKnock(world, 'rest')
    const age = pendingBirthday(world)
    if (age !== null) chooseGift(world, birthdayOffer(world.seed, age).options[0].id)
    tickWeek(world, rng)
    while (world.pendingTournament) {
      if (!world.pendingTournament.finished) skipTournament(world)
      closeTournament(world)
    }
    onWeek?.(world)
  }
  return world
}

function mountKid(snapshot: Snapshot, attach = false) {
  useGameStore().snapshot = snapshot
  return mount(KidScreen, {
    global: { stubs: { teleport: true } },
    ...(attach ? { attachTo: document.body } : {}),
  })
}

/** The Personality tile's two lines, off the mounted screen. */
function personalityTile(w: ReturnType<typeof mountKid>): string {
  const tile = w.findAll('.kid-tile').find((t) => t.find('.kid-tile-label').text() === 'Personality')
  expect(tile, 'the page has a Personality tile at all').toBeTruthy()
  return tile!.findAll('.kid-tile-line').map((l) => l.text()).join('|')
}

describe('⭐⭐ ROUND 42 #6 – the Personality tile is HER, and it is who she was born as', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐ four careers, four girls – the tile moves with her temperament, end to end', () => {
    // The whole of his report, measured through the real chain: world -> toSnapshot -> the mounted
    // cell. Seeds are walked until every temperament the game can deal has been seen, so the case
    // cannot pass by luck on a pair that happened to differ.
    const seen = new Map<Temperament, string>()
    for (let i = 0; i < 40 && seen.size < TEMPERAMENTS.length; i++) {
      const world = quietCareer(`r42-personality-${i}`, 4)
      const snap = toSnapshot(world)
      const w = mountKid(snap)
      const text = personalityTile(w)
      // ⚠ THE WIRE SAYS BIRTH. This is the pin the fence's mutation arm has to break: a snapshot
      // handing `expressedTemperamentOf(world)` (or anything of her mood) instead of
      // `world.temperament` puts a different girl's pair on the screen the moment an axis flips.
      expect(text, world.temperament).toBe(
        `${TEMPERAMENT_PERSONALITY[world.temperament].lead}|${TEMPERAMENT_PERSONALITY[world.temperament].note}`,
      )
      seen.set(world.temperament, text)
      w.unmount()
    }
    expect(seen.size, 'all four temperaments were reached inside forty seeds').toBe(TEMPERAMENTS.length)
    expect(new Set(seen.values()).size, 'and no two of them read alike on the screen').toBe(TEMPERAMENTS.length)
  })

  it('⚠⚠ THE FENCE – the tile does not move with her mood, and the Mood tile beside it does', () => {
    // who-she-is §3: the voices read BIRTH alone. This is the arm the brief asks for by name – bind
    // the tile to the expressed mood and this case reddens.
    const world = quietCareer('r42-fence', 60)
    const glowing = mountKid(posed(world, ECONOMY.spirit.mood.glowingFrom + 2))
    const glowingTile = personalityTile(glowing)
    const glowingMood = glowing.find('.kid-tile-mood .kid-tile-lead').text()
    const glowingBand = useGameStore().snapshot!.diary.facts.moodBand
    glowing.unmount()

    const heavy = mountKid(posed(world, ECONOMY.spirit.mood.heavyBelow - 5))
    const heavyTile = personalityTile(heavy)
    const heavyMood = heavy.find('.kid-tile-mood .kid-tile-lead').text()
    const heavyBand = useGameStore().snapshot!.diary.facts.moodBand
    heavy.unmount()

    // ⚠ THE ARM IS NOT VACUOUS, and this is the line that proves it: the two weeks really are two
    // different moods, on the engine's own band and on the word the tile beside it prints. Without
    // this, «the Personality tile did not change» would also pass on a harness that changed nothing.
    expect(heavyBand, 'the two poses are genuinely different moods').not.toBe(glowingBand)
    expect(heavyMood, 'and the Mood tile says so out loud').not.toBe(glowingMood)
    expect(heavyTile, 'while the Personality tile is untouched by any of it').toBe(glowingTile)
  })

  it('⚠⚠ THE FENCE, SECOND HALF – nor does it move with her WALLS', () => {
    // who-she-is §3 again, and the sentence `expressedTemperamentOf` carries in its own ⚠⚠ block:
    // «the VOICES read birth and only birth … a quiet girl behind walls still has a quiet girl's
    // syntax. A call from a voice site is a finding, not a tuning miss.» The mechanics read the
    // EXPRESSED girl; this tile may not. Flipping an axis by hand is the positive control that makes
    // the claim testable at all – with both flags false the two reads agree by arithmetic.
    const world = quietCareer('r42-walls', 60)
    const born = toSnapshot(world)
    world.wallsFlipped = { open: true, reg: true }
    const walled = toSnapshot(world)
    expect(
      expressedTemperamentOf(world),
      'the positive control: both axes flipped really is a different bucket',
    ).not.toBe(world.temperament)
    const w = mountKid(walled)
    expect(personalityTile(w), 'and her page still says who she was born as').toBe(
      `${TEMPERAMENT_PERSONALITY[world.temperament].lead}|${TEMPERAMENT_PERSONALITY[world.temperament].note}`,
    )
    expect(walled.life.personality, 'byte for byte the tile she had before the walls went up').toEqual(
      born.life.personality,
    )
    w.unmount()
  })

  /** ⚠ POSED ON THE WORLD, ANSWERED BY THE ENGINE – the `round42-hero-and-ring` idiom: the band, the
   *  word and the tiles are all `assembleDiaryFacts`'s and none of them is this file's arithmetic. */
  function posed(world: WorldState, spirit: number): Snapshot {
    world.spirit = spirit
    world.condition = 90
    world.injury = null
    return toSnapshot(world)
  }
})

describe('⭐⭐ ROUND 42 #10 – her account, said the way the family budget says money', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** A career old enough to have an account, with a balance she could only have from her own share. */
  function withAccount(seed = 'r42-account', week = 300, cents = 512_835_00): Snapshot {
    const world = quietCareer(seed, week)
    world.kidFundsCents = cents
    return toSnapshot(world)
  }

  it('⭐⭐ it is a CARD OF ROWS now, not a paragraph, and every figure is the engine’s', () => {
    const snap = withAccount()
    const w = mountKid(snap)
    const card = w.find('.kid-account')
    expect(card.exists(), 'her page carries the account card').toBe(true)
    // The old surface is gone: a `.hint` paragraph under the attribute grid.
    expect(w.find('.kid-note-account').exists(), 'the hint paragraph is not there as well').toBe(false)

    const rows = card.findAll('.tb-statrow')
    expect(rows.length, 'balance, her cut, the manager’s cut').toBe(3)
    const text = rows.map((r) => r.text())
    expect(text[0]).toContain('$512,835')
    // ⚠ THE RATES ARE THE TILL'S OWN FUNCTIONS, not literals in a template – `ownAccountNote`'s law,
    // applied to the card. A card that quoted a different percentage from the cheque would be the
    // one failure this surface exists to make impossible.
    expect(text[1]).toContain(`${kidPrizeShareBps(snap.ageYears) / 100}%`)
    expect(text[2]).toContain(`${managerCommissionBps() / 100}%`)
    // ...and the ramp is prose under the rows, never a fourth row.
    const note = card.find('.kid-account-note')
    expect(note.exists()).toBe(true)
    expect(note.text()).toMatch(/goes no higher|every birthday/)
    // Player copy: ASCII and the short dash, the same sweep the old paragraph answered to.
    expect(card.text()).not.toContain('—')
    expect(card.text()).toMatch(/^[\x20-\x7e–\s]+$/)
    w.unmount()
  })

  it('⭐ BEFORE the counting results, which is the half of his ask that is a position', () => {
    // «поставить либо перед, либо после counting results» – before, and measured rather than
    // argued: that card ends in a table of up to `bestN` rows (eighteen on the professional
    // ladder), so an account card behind it sits a screen below the fold exactly when she is
    // earning most.
    const w = mountKid(withAccount())
    const panels = w.findAll('.kid-panel')
    const names = panels.map((p) => (p.classes().includes('kid-account') ? 'account' : p.text().slice(0, 16)))
    const account = names.findIndex((n) => n === 'account')
    const counting = names.findIndex((n) => n.startsWith('Counting results'))
    expect(account, 'the account card is on the page').toBeGreaterThanOrEqual(0)
    expect(counting, 'so is the counting-results card').toBeGreaterThanOrEqual(0)
    expect(account, 'and her money is reached before the table that explains her rank').toBeLessThan(counting)
    w.unmount()
  })

  it('⚠ AND IT IS ABSENT WHEN THERE IS NO ACCOUNT – the same gate the Money screen answers to', () => {
    // Without this the case above would pass with the gate deleted. A junior with an empty account
    // is told nothing, because there is nothing to explain yet (round 41 #27's own ruling).
    const world = quietCareer('r42-no-account', 30)
    world.kidFundsCents = 0
    const snap = toSnapshot(world)
    expect(snap.ageYears, 'she is under the threshold birthday').toBeLessThan(ECONOMY.kidShare.fromAgeYears)
    expect(snap.life.account, 'so the engine composes no card').toBeNull()
    const w = mountKid(snap)
    expect(w.find('.kid-account').exists(), 'and her page carries none').toBe(false)
    w.unmount()
  })

  it('⭐ THE VISUAL SWEEP – the rows fit their column at 375 / 768 / 900 / 1280', () => {
    // The standing rule of 14.09. happy-dom does no layout, so the honest measurement is the one
    // `fits.ts` makes: walk the room the card's ancestors leave on each viewport and check the row
    // has a box inside it, with the longest label the card can ever print.
    //
    // ⚠ THE CAREER IS WALKED ONCE AND MOUNTED FOUR TIMES, not walked four times. Measured: the
    // four-walk version crossed the project's 20s file budget under a full `test:component` run
    // while passing in isolation, which is the contention hazard CLAUDE.md names – and the walk is
    // not what the case is about.
    const snap = withAccount('r42-account-wide', 416, 8_909_415_00)
    for (const vp of SWEEP) {
      setViewport(vp)
      const w = mountKid(snap, true)
      const card = w.find('.kid-account')
      expect(card.exists(), `the card renders at ${vp.width}`).toBe(true)
      const rows = card.findAll('.tb-statrow')
      const room = availableWidth(rows[0].element, vp)
      expect(room, `${vp.width}: the card leaves its rows a column`).toBeGreaterThan(0)
      for (const row of rows) {
        const box = boxOf(row.element, room)
        expect(box.h, `${vp.width}: a row with no box is a row nobody can read`).toBeGreaterThan(0)
      }
      // ⚠ THE LABEL IS ALLOWED TO WRAP, which is the one thing this card changes about a StatRow:
      // «Manager's cut of a sponsor cheque» is far longer than any label on the Money screen, and a
      // `nowrap` label would clip it on a phone rather than spend a second line.
      const label = card.find('.tb-statrow-label').element as HTMLElement
      expect(getComputedStyle(label).whiteSpace, `${vp.width}: the long label must be allowed to wrap`).not.toBe('nowrap')
      w.unmount()
    }
    setViewport(DESKTOP)
  })
})

describe('⭐⭐ ROUND 42 #22 – the coach’s eye learns saturation', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** What the eye believes about one wing: how full it is, and whether he can read it at all. */
  function eyeOn(world: WorldState, key: 'serve' | 'ret' | 'composure' | 'stamina' | 'groundstrokes') {
    const view = radarViewOf(world)
    const readings = axisReadings(view)
    const confidence = readings[key].confidence
    const shown = shownSkill(view, key, confidence)
    const half = ceilingHalfWidth(confidence)
    const v = rngFromSeed(`${view.seed}:ceil:${key}`)()
    const centre = view.potential[key] + (2 * v - 1) * CEILING_CENTRE_DRIFT * half
    return { confidence, band: fillBandOf(Math.min(1, shown / centre)) }
  }

  /** The sentence the radar prints beside one wing, off the mounted screen. */
  function noteFor(w: ReturnType<typeof mountKid>, label: string): string | null {
    const row = w.findAll('.radar-notes li').find((li) => li.find('.radar-note-axis').text() === label)
    return row ? row.find('.radar-note-text').text() : null
  }

  it('⭐⭐ A SATURATED WING AND AN OPEN ONE GET DIFFERENT REGISTERS, on the mounted radar', () => {
    // The item's own evidence. A played career is WALKED until the eye holds one wing at the top of
    // the ladder and another below it – which is not posed: it is what `rollPotential` dealing
    // different room to different wings produces on its own.
    //
    // ⚠ WALKED RATHER THAN SAMPLED AT ONE WEEK, and the reason is measured. At week 320 an elite eye
    // reads EVERY wing of this girl as finished (the saturation probe behind the thresholds: 74% of
    // readable axis-weeks land in `done`, and a late career is nearly all of them) – which is the
    // model telling the truth and a useless fixture for a case about two registers. The pair this
    // case needs lives in the middle of a career, so the walk stops at the first week that has one.
    const WINGS = ['serve', 'ret', 'composure', 'stamina', 'groundstrokes'] as const
    let found: { world: Snapshot; done: typeof WINGS[number]; open: typeof WINGS[number] } | null = null
    playingCareer('r42-eye', 320, 'elite', (world) => {
      if (found || world.week % 26 !== 0) return
      const bands = WINGS.map((key) => ({ key, ...eyeOn(world, key) })).filter(
        (b) => b.confidence >= NOTE_MIN_CONFIDENCE,
      )
      const done = bands.find((b) => b.band === 'done')
      const open = bands.find((b) => b.band !== 'done')
      if (done && open) found = { world: toSnapshot(world), done: done.key, open: open.key }
    })
    expect(found, 'somewhere in this career the eye holds a finished wing and an open one at once').toBeTruthy()
    const { world: snap, done, open: notDoneKey } = found!

    const w = mountKid(snap)
    const LABEL = { serve: 'Serve', ret: 'Return', composure: 'Composure', stamina: 'Stamina', groundstrokes: 'Groundstrokes' }
    const doneLine = noteFor(w, LABEL[done])
    const openLine = noteFor(w, LABEL[notDoneKey])
    expect(doneLine, `${done} is spoken for`).toBeTruthy()
    expect(openLine, `${notDoneKey} is spoken for`).toBeTruthy()
    // The saturated wing says the honest thing, and it is a DIFFERENT thing from the wing with room.
    expect(doneLine).not.toBe(openLine)
    expect(doneLine, 'the saturated register names the end of the road').toMatch(
      /as good as it is going|finished|as far as|no more|will go|going to stay|ever going to be|nothing left|buying nothing|not adding|stopped paying|calmer than this/i,
    )
    // ⚠⚠ AND THE HALF HE ACTUALLY REPORTED: a wing the eye believes is full may never be described
    // as one nobody has tested. «Nobody has really made her serve yet» beside 1.6 points of room is
    // what «а зачем тогда мне вообще тренер» was about.
    expect(doneLine, 'no absence line survives on a wing the eye believes is finished').not.toMatch(
      /nobody has|has not (met|faced|been)|never been|do not know|open question|nobody knows/i,
    )
    w.unmount()
  })

  it('⭐⭐ HIS WORDS CHANGE ACROSS HER GROWTH – the same wing, read four seasons apart', () => {
    // «его слова о ней точно должны меняться на протяжении роста и карьеры». Measured, not asserted:
    // a played career is sampled at five points and at least one wing must have moved rung AND
    // sentence. (The probe behind the thresholds measured 35 of 60 axis-tracks crossing two or more
    // rungs in a career, and 29 crossing three.)
    const seen = new Map<string, Set<string>>()
    const samples = new Set([52, 104, 208, 320])
    playingCareer('r42-growth', 322, 'elite', (world) => {
      if (!samples.has(world.week)) return
      for (const axis of buildRadar(radarViewOf(world))) {
        if (!axis.note) continue
        if (!seen.has(axis.key)) seen.set(axis.key, new Set())
        seen.get(axis.key)!.add(axis.note)
      }
    })
    const moved = [...seen.entries()].filter(([, lines]) => lines.size > 1)
    expect(
      moved.length,
      `no wing changed its sentence across the career: ${[...seen.entries()].map(([k, v]) => `${k}=${v.size}`).join(' ')}`,
    ).toBeGreaterThan(0)
  })

  it('⭐ THE EYE FLAGS A PAID SLOT AIMED AT A WING THAT CANNOT ANSWER', () => {
    // The coach-as-the-eye doctrine, and the literal answer to «а зачем тогда мне вообще тренер»:
    // the man the family pays tells them when the sessions they are paying for have stopped paying
    // back. His own save is the case – her plan hammers serve three slots a week against a serve at
    // 96% of its ceiling.
    const world = playingCareer('r42-aimed', 320)
    const saturated = (['serve', 'ret', 'composure', 'stamina', 'groundstrokes'] as const).find(
      (key) => eyeOn(world, key).band === 'done' && eyeOn(world, key).confidence >= NOTE_MIN_CONFIDENCE,
    )
    expect(saturated, 'the career has a finished wing to aim at').toBeTruthy()
    const KIND = { serve: 'serve', ret: 'serve', composure: 'matchplay', stamina: 'fitness', groundstrokes: 'rally' } as const
    const LABEL = { serve: 'Serve', ret: 'Return', composure: 'Composure', stamina: 'Stamina', groundstrokes: 'Groundstrokes' }

    const before = mountKid(toSnapshot(world))
    const plain = noteFor(before, LABEL[saturated!])
    before.unmount()

    // Four sessions a week, all of them pointed at the wing that is already full.
    world.plan = { train: 60, rest: 40, week: [[KIND[saturated!]], [KIND[saturated!]], [], [KIND[saturated!]], [KIND[saturated!]], [], []] }
    const after = mountKid(toSnapshot(world))
    const flagged = noteFor(after, LABEL[saturated!])
    after.unmount()

    expect(plain, 'the wing is spoken for either way').toBeTruthy()
    expect(flagged).toBeTruthy()
    expect(flagged, 'and aiming the week at it changes what he says').not.toBe(plain)
    expect(flagged, 'the flag names the spend, not the girl').toMatch(
      /nothing left to give|buying nothing|not adding|stopped paying|will not make her calmer/i,
    )
  })

  it('⭐ THE VISUAL SWEEP – the radar’s notes keep a column at 375 / 768 / 900 / 1280', () => {
    // ⚠ ONE WALK, FOUR MOUNTS – see the sweep in #10 above for why.
    const snap = toSnapshot(playingCareer('r42-eye-sweep', 208))
    for (const vp of SWEEP) {
      setViewport(vp)
      const w = mountKid(snap, true)
      const notes = w.findAll('.radar-notes li')
      expect(notes.length, `${vp.width}: the eye has something to say`).toBeGreaterThan(0)
      const room = availableWidth(notes[0].element, vp)
      expect(room, `${vp.width}: the note list has a column`).toBeGreaterThan(0)
      for (const n of notes) {
        expect(boxOf(n.element, room).h, `${vp.width}: a note with no box`).toBeGreaterThan(0)
        const text = n.find('.radar-note-text').element as HTMLElement
        expect(getComputedStyle(text).whiteSpace, `${vp.width}: a coach's sentence must be allowed to wrap`).not.toBe('nowrap')
      }
      w.unmount()
    }
    setViewport(DESKTOP)
  })
})

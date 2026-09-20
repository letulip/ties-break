// THE PREGNANCY, WAVE 8 – T10: THE TWO PAINTINGS, THE WINDOW THEY RUN IN, AND THE ONE WIRE FIELD
// (life/wave-8; docs/plans/life-wave-8-builder-2026-09.md §2 T10).
//
// The art shipped with the set and was referenced by NOTHING in `src/` until this task:
// `fem-euro-brunnet-adult-pregnant-early.webp` and `-pregnant-last.webp`. T10 wires them.
//
// THIS FILE IS THE DECISION AND THE ART FACTS; the two mounted surfaces are next door in
// `tests/component/wave8-pregnancy-portrait.test.ts`, which is the same split
// `wave3-graduated-portrait` made one wave layer down and for the same reason: which picture a week
// wears is a pure function and belongs in the unit project, whether it is IN THE DOM is a mount.
//
//   §A  THE WINDOW – `pregnancyFaceAt`, boundary by boundary, on transcribed literals
//   §B  THE UNION IT JOINS IS **NONE** – the claim §2 T10 asked to be argued, asserted rather than
//       only written: no crop, no band matrix, no memory channel, and a builder of its own
//   §C  THE ART IS REALLY THERE and the framing table knows both stems
//   §D  THE WIRE – `toSnapshot` carries the ANSWER, and it is null again the week the child is born
//       although `world.pregnancy` is still standing. That last one is the load-bearing case.
//
// ⚠⚠ MUTATION LEDGER – every arm below was run RED-FIRST against this file, by editing the tree,
// watching the named cases fail, and reverting. The counts are measured, not predicted.
//
//   ARM 1  the window's upper bound read off the RECORD instead of the birth – i.e.
//          `pregnancyFaceAt` loses its `week >= dueWeek` clause, so a pregnancy paints until T5
//          clears it
//          → 4 RED: §A.3 («nothing on the due week itself»), §A.4 (the twenty weeks after it),
//          §A.6's totality sweep, and §D.2 – which is the one that says the WIRE is wrong and not
//          only the predicate. ⚠ §D.3 stayed GREEN and that is the finding inside the arm: it is
//          posed on `pausesWeek`, where this mutation changes nothing, so it is measuring the fog
//          law rather than the window – which is what it is for.
//   ARM 2  `PREGNANT_LAST_WEEKS` raised to 40 – the value that silently retires `pregnant-early`
//          → 5 RED: §A.1, §A.2, §A.5's «both paintings are reachable», §D.1 and §D.3
//   ARM 3  the two stems left out of `PAINTING_ONLY_FACES` (the rectangles kept), i.e. the cutter
//          is handed two crops nobody painted
//          → 4 RED: §B.4 here, and three in `tests/portrait-bands.test.ts` – its own cutter case
//          («a centre is not a crop») and both of the literal skip-list pins this task re-aimed
//   ARM 4  the result guard dropped from `useKidEmotion` – measured in the mounted file next door
//   ARM 5  `toSnapshot`'s `pregnancyFace` forced to `null` – measured in the mounted file next door
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import {
  createWorld,
  toSnapshot,
  kidAgeExact,
  type WorldState,
} from '../src/engine/world'
import {
  CROPPABLE_EMOTIONS,
  FACE_BANDS,
  PORTRAIT_EMOTIONS,
  PREGNANT_LAST_WEEKS,
  pregnancyFaceAt,
  type PregnancyFace,
} from '../src/shared/avatarEmotion'
import { PREGNANT_ART_STEM, pregnantUrl } from '../src/art/preload'
import { CROPS, PAINTING_ONLY_FACES } from '../src/art/faceRects'
import type { LoveEpisode } from '../src/shared/protocol'

// ⚠⚠ THE BRIEF'S OWN LITERALS, TRANSCRIBED AND NEVER READ OFF `ECONOMY.motherhood` – wave 3's ARM 2
// law, inherited through T2's and T3's own §BRIEF blocks: an expectation read out of the thing under
// test moves with it, so a silent retune of `termWeeks` has to walk past THIS line.
const BRIEF = { playsOnWeeks: 8, termWeeks: 31, decisionWeeksAfterBirth: 20 } as const

/** ⚠ AND T10's OWN DRAFT, TRANSCRIBED FOR THE SAME REASON. `PREGNANT_LAST_WEEKS` is this task's
 *  number (§7.1 of the strings table flags it as the builder's), so the cases below state the weeks
 *  they mean and §A.5 is what ties the literal to the constant in exactly one place. */
const LAST_WEEKS = 12

const asset = (rel: string) => new URL(`../public/${rel}`, import.meta.url)
const strip = (url: string) => url.replace(/^\/?/, '').replace(/^.*?(images|avatars)\//, '$1/')

const FACES: PregnancyFace[] = ['pregnant-early', 'pregnant-last']

// =================================================================================================
// A. THE WINDOW
// =================================================================================================
describe('wave 8 T10 §A – which painting a week wears', () => {
  // One pregnancy, on the brief's own arithmetic: announced at 600, entries shut at 608, due at 639.
  const announcedWeek = 600
  const dueWeek = announcedWeek + BRIEF.playsOnWeeks + BRIEF.termWeeks
  const at = (week: number) => pregnancyFaceAt({ week, announcedWeek, dueWeek })

  it('⭐ nothing before she says it, and `pregnant-early` from the week she does', () => {
    expect(at(announcedWeek - 1), 'the week before the card').toBeNull()
    expect(at(announcedWeek), 'the announcement week itself – the card blocks, so he sits on it').toBe('pregnant-early')
    expect(at(announcedWeek + BRIEF.playsOnWeeks), 'the week the entries close').toBe('pregnant-early')
  })

  it('⭐ `pregnant-last` through the final stretch, and the change of painting is one week wide', () => {
    const switchWeek = dueWeek - LAST_WEEKS
    expect(at(switchWeek - 1), 'the last early week').toBe('pregnant-early')
    expect(at(switchWeek), 'and the first late one').toBe('pregnant-last')
    expect(at(dueWeek - 1), 'the week before the birth').toBe('pregnant-last')
  })

  it('⚠⚠ NOTHING ON THE DUE WEEK – the window closes at the BIRTH and not at the record', () => {
    // §2 T10: «After the birth, the standing stage rules resume untouched.» `landBirth` fires on
    // `dueWeek` and writes the feed row that says her daughter was born, so a pregnant woman on the
    // hero that same week would contradict the sentence under her. ARM 1 is this case.
    expect(at(dueWeek), 'the week the child arrives').toBeNull()
  })

  it('⚠ ...and nothing for the twenty weeks the record outlives the birth', () => {
    // The record is cleared by HER DECISION, not by the birth (`landBirth` deliberately writes
    // nothing to it), so `world.pregnancy` stands for up to `decisionWeeksAfterBirth` more weeks.
    for (let i = 1; i <= BRIEF.decisionWeeksAfterBirth; i++) {
      expect(at(dueWeek + i), `week ${i} after the birth`).toBeNull()
    }
  })

  it('⭐⭐ BOTH PAINTINGS ARE REACHABLE AT THE SHIPPED CONSTANTS – neither is dead art', () => {
    // The draft's own guard: a stretch of 39 or more would retire `pregnant-early` in silence, and a
    // stretch of 0 would retire `pregnant-last`. ARM 2 is the first of those.
    expect(PREGNANT_LAST_WEEKS, 'the constant is the number these cases were written against').toBe(LAST_WEEKS)
    expect(PREGNANT_LAST_WEEKS, 'shorter than the term, or the early painting is unreachable').toBeLessThan(
      BRIEF.playsOnWeeks + BRIEF.termWeeks,
    )
    expect(PREGNANT_LAST_WEEKS, 'and longer than nothing, or the late one is').toBeGreaterThan(0)
    const worn = new Set<PregnancyFace | null>()
    for (let w = announcedWeek; w < dueWeek; w++) worn.add(at(w))
    expect([...worn].sort(), 'every week of the window wears one of the two').toEqual([...FACES].sort())
  })

  it('⚠ TOTAL – every week of a career answers, and only the window answers with a painting', () => {
    for (let w = announcedWeek - 60; w < dueWeek + 60; w++) {
      const face = at(w)
      const inside = w >= announcedWeek && w < dueWeek
      expect(face === null, `week ${w}`).toBe(!inside)
      if (face !== null) expect(FACES, `week ${w} names a painting that exists`).toContain(face)
    }
  })
})

// =================================================================================================
// B. THE UNION IT JOINS IS **NONE** – §2 T10's own question, as assertions
// =================================================================================================
//
// «Which union they join is a real decision and the file has already argued the shape of it.» The
// answer is `graduated`'s road – their own builder, no union at all – and every clause of that
// argument is a claim a test can make. `shared/avatarEmotion.ts` carries the prose.
describe('wave 8 T10 §B – the pair is in no union, and each refusal is measured', () => {
  it('⚠ NOT CROPPABLE – `avatarCropPath`\'s totality is what forbids it, and there are no files', () => {
    expect(CROPPABLE_EMOTIONS as readonly string[], 'the seven croppable faces are untouched').toHaveLength(7)
    for (const face of FACES) {
      expect(CROPPABLE_EMOTIONS as readonly string[], face).not.toContain(face)
      // ...and the reason, on disk: a member would make `avatarCropPath` able to name these.
      expect(existsSync(asset(`avatars/adult-${face}.webp`)), `avatars/adult-${face}.webp must NOT exist`).toBe(false)
    }
  })

  it('⚠⚠ NOT IN THE BAND MATRIX – `graduated`\'s own measurement, and the files say why', () => {
    expect(PORTRAIT_EMOTIONS as readonly string[], 'the matrix is still the eight band faces').toHaveLength(8)
    for (const face of FACES) {
      expect(PORTRAIT_EMOTIONS as readonly string[], face).not.toContain(face)
      // The four filenames a member would have let `portraitUrl` build. None of them exists, which
      // is the whole of the argument rather than a restatement of it.
      for (const stage of ['jun', 'young', 'teen', 'lateCareer']) {
        expect(
          existsSync(asset(`images/fem-euro-brunnet/fem-euro-brunnet-${stage}-${face}.webp`)),
          `${stage}-${face} is not on disk – a matrix member would 404 here`,
        ).toBe(false)
      }
    }
  })

  it('⚠⚠ NOT ON THE MEMORY CHANNEL EITHER – and THIS is the one `bride` answers differently', () => {
    // `bride` IS a one-band painting and it DID join a union, because a memory card is filled by the
    // ENGINE and the engine may not know about a UI builder. There is no memory card for a
    // pregnancy – T4's birth polaroid took `MEMORY_EMOTION.birth = 'norm'` – so the reason does not
    // transfer and the band table stays a table of exactly one moment-face.
    expect(Object.keys(FACE_BANDS).sort(), 'the band table holds the bride and nobody else').toEqual(['bride'])
    for (const face of FACES) expect(Object.keys(FACE_BANDS), face).not.toContain(face)
  })

  it('⭐ ...so the CUTTER skips them, and a rectangle is still not a crop', () => {
    for (const face of FACES) {
      expect(PAINTING_ONLY_FACES, `${face} must be on the cutter's skip list`).toContain(face)
    }
  })

  it('⭐⭐ THE BUILDER TAKES NO STAGE – the 11.09 ruling, as a signature', () => {
    // «`lateCareer` pregnancies REUSE the adult scenes» (RULED 11.09). So there is no band to thread
    // and the builder cannot be asked for one: one pair of files serves every age this arc reaches.
    for (const face of FACES) {
      expect(strip(pregnantUrl(face))).toBe(`images/fem-euro-brunnet/fem-euro-brunnet-adult-${face}.webp`)
    }
    // ...and the two stems are the ONE spelling shared by the URL and the framing table.
    expect(PREGNANT_ART_STEM).toEqual({
      'pregnant-early': 'adult-pregnant-early',
      'pregnant-last': 'adult-pregnant-last',
    })
  })
})

// =================================================================================================
// C. THE ART, AND THE TABLE THAT FRAMES IT
// =================================================================================================
describe('wave 8 T10 §C – the paintings are on disk and the face table knows them', () => {
  it('⭐ both files exist – nothing above is vacuous', () => {
    for (const face of FACES) {
      expect(
        existsSync(asset(`images/fem-euro-brunnet/fem-euro-brunnet-adult-${face}.webp`)),
        `${face} painting`,
      ).toBe(true)
    }
  })

  it('⚠ the framing table carries both stems – without a row the hero frames her hands', () => {
    // `facePoint` answers 50/50 for a stem it does not know, and on a landscape cover window over
    // these two canvases 50/50 is not her face. `rehab`'s own reason for having rectangles and no
    // crops, one painting-only face along.
    for (const face of FACES) {
      expect(PREGNANT_ART_STEM[face] in CROPS, `${PREGNANT_ART_STEM[face]} has a face centre`).toBe(true)
    }
  })

  it('⚠ the two rectangles obey the table\'s own square-inside-the-painting rule', () => {
    // The same arithmetic `tests/portrait-bands.test.ts` sweeps the whole table with, asserted here
    // too so a bad centre fails in the file that ADDED it rather than only in the file that sweeps.
    for (const face of FACES) {
      const [cx, cy, side] = CROPS[PREGNANT_ART_STEM[face]]
      expect(side, `${face} side`).toBeGreaterThanOrEqual(100)
      expect(side, `${face} side`).toBeLessThanOrEqual(256)
      expect(cx - side / 2, `${face} left`).toBeGreaterThanOrEqual(0)
      expect(cy - side / 2, `${face} top`).toBeGreaterThanOrEqual(0)
      expect(cx + side / 2, `${face} right`).toBeLessThanOrEqual(512)
      expect(cy + side / 2, `${face} bottom`).toBeLessThanOrEqual(512)
    }
  })
})

// =================================================================================================
// D. THE WIRE – the ONE fact of `world.pregnancy` that crosses to the UI
// =================================================================================================
//
// ⚠⚠ THE FIELD IS THE ANSWER AND NOT THE RECORD. T1 kept `PregnancyState` off `Snapshot` on purpose
// and named the task that would decide what the wire needs; this is it, and what it needs is which
// painting. Nothing about the episode, the support grade, the frozen rank or the due DATE crosses –
// so no surface can build a countdown to a birth the wave tells the player nowhere.
describe('wave 8 T10 §D – `toSnapshot` carries the answer, and only the answer', () => {
  /** The FIRST week she reads at or above `years` – T2's helper, and T3's. */
  function weekAtAge(world: WorldState, years: number): number {
    for (let w = 0; w < 40 * 52; w++) {
      if (kidAgeExact(w, world.profile.birthMonth, world.profile.birthDay) >= years) return w
    }
    throw new Error(`no week reaches age ${years}`)
  }

  function married(sinceWeek: number, latchedWeek: number): LoveEpisode {
    return {
      id: `p:${sinceWeek}`, sinceWeek, endedWeek: null, knownWeek: sinceWeek + 2, wants: 'open',
      partnerId: `p:${sinceWeek}`, publicWeek: null, publicWrong: false, airedMetWeek: null,
      airedEndedWeek: null, latchedWeek, partnerName: 'Anton',
    }
  }

  /** A married career carrying the record T2's `rollPregnancy` writes, hand-built on the BRIEF's own
   *  arithmetic (T3's `expectingFrom`, one task on) so a case can choose the week it is posed on. */
  function expecting(seed: string): WorldState {
    const world = createWorld(seed)
    const announcedWeek = weekAtAge(world, 28)
    world.season = []
    world.week = announcedWeek
    world.loveEpisodes = [married(announcedWeek - 104, announcedWeek - 52)]
    world.pregnancy = {
      episodeId: world.loveEpisodes[0].id,
      announcedWeek,
      pausesWeek: announcedWeek + BRIEF.playsOnWeeks,
      dueWeek: announcedWeek + BRIEF.playsOnWeeks + BRIEF.termWeeks,
      support: null,
      rankAtPause: null,
    }
    return world
  }

  it('⭐⭐ null on a career with no pregnancy, and both faces on one that has', () => {
    const plain = createWorld('t10-wire-plain')
    expect(toSnapshot(plain).pregnancyFace, 'every career before wave 8, and most after it').toBeNull()

    const world = expecting('t10-wire')
    expect(toSnapshot(world).pregnancyFace, 'the week she says it').toBe('pregnant-early')
    world.week = world.pregnancy!.dueWeek - 1
    expect(toSnapshot(world).pregnancyFace, 'the week before the birth').toBe('pregnant-last')
  })

  it('⚠⚠ NULL AGAIN FROM THE BIRTH WEEK, WITH THE RECORD STILL STANDING – ARM 1\'s case', () => {
    // The one that a field hung on «is there a `world.pregnancy`» gets wrong, for twenty weeks, on
    // every career that reaches a birth. T5 clears the record; the birth does not.
    const world = expecting('t10-wire-birth')
    world.week = world.pregnancy!.dueWeek
    expect(world.pregnancy, 'the record really is still standing – the case is not vacuous').not.toBeNull()
    expect(toSnapshot(world).pregnancyFace, 'the week her daughter was born').toBeNull()
    world.week = world.pregnancy!.dueWeek + BRIEF.decisionWeeksAfterBirth
    expect(world.pregnancy, 'and still standing at the decision week').not.toBeNull()
    expect(toSnapshot(world).pregnancyFace, 'twenty weeks of her own face again').toBeNull()
  })

  it('⚠ the field is the ONLY thing the record puts on the wire', () => {
    // The fog law read strictly: a snapshot of a career deep in a pregnancy must not carry the
    // episode it belongs to, the support grade, the frozen rank or the due date anywhere.
    const world = expecting('t10-wire-fog')
    world.week = world.pregnancy!.pausesWeek
    world.pregnancy!.support = 'warm'
    world.pregnancy!.rankAtPause = 88
    const snap = toSnapshot(world) as unknown as Record<string, unknown>
    expect(snap.pregnancyFace, 'the answer is there').toBe('pregnant-early')
    for (const key of ['pregnancy', 'children', 'comeback']) {
      expect(key in snap, `\`${key}\` is engine-side state and must not be on the wire`).toBe(false)
    }
    // ...and the record's own numbers are not reachable under any other name either.
    const json = JSON.stringify(toSnapshot(world))
    expect(json).not.toContain('"support":"warm"')
    expect(json).not.toContain('"dueWeek"')
    expect(json).not.toContain('"announcedWeek"')
  })
})

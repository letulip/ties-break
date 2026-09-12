// =================================================================================================
// WAVE 3, THE ВЫЧИТКА FOLD – THE PRESENCE AXIS, THE SHARED QUOTES, AND THE TWO RE-CUT TAILS
// =================================================================================================
//
// `docs/specs/voice-bibles-2026-09.md`, «The presence law (MUST; 11.09, doc-review finding 3)», and
// the owner's own nineteen away frames delivered 11.09 after his read of T10's package.
//
// WHAT MOVED, in one paragraph. `MET_HER_LINE` and `SMALL_TALK_LINE` shipped with ONE column each,
// and every frame in it stages a house – the dinner table, the bag going down, the kettle filling,
// the plates done. From `college` on the parent is in none of those rooms, so the frames were
// claiming an observation distance the world says he does not have. Both pools now carry a second
// column, drawn by the owner; `lifeBeatSaid` takes a `DiaryLifeStage` and `presenceOf` cuts it into
// roof (`school`, `after-school`) and away (`college`, `independent`).
//
// ⚠ WHAT THIS FILE DOES NOT DO, and it is this wave's standing rule. It asserts SHAPES and
// PROPERTIES, never wording: every sentence it reaches is a DRAFT until the owner's playtest
// (CLAUDE.md invariant 4). What is pinned is «the two registers really are two», «the quoted span is
// the SAME in both», «exactly one cell falls back», «no two rows of the parent's narration end the
// same way» – never a string.
//
// =================================================================================================
// ⚠⚠ THE ARM LEDGER – every net below was RUN, watched fail, and put back. The count is what the
// mutation actually reddened, because a mutation that reddens the WRONG case is as much a finding as
// one that reddens nothing.
// =================================================================================================
//
//   ⚠⚠ THE TRAP THIS STEP WAS WARNED ABOUT, AND ARMS 1–3 ARE THE ANSWER TO IT: **a presence test
//   passes trivially if both registers return the same string.** «She has an away line» is a claim
//   that holds by construction on a pool where away IS roof, so every case below that touches the
//   split asserts the two reads are DIFFERENT, and the one cell that is deliberately shared asserts
//   they are IDENTICAL. Both directions, or the file proves nothing.
//
//   ARM 1   ⚠⚠ PRESENCE COLLAPSED TO ONE REGISTER – `presenceLine` returning `cell.roof` whatever it
//           is handed (the whole axis neutralised, which is the shape a half-wired thread would have).
//           4 RED · §A «⭐⭐⭐ the two registers are two: met sunny/open reads the same at both
//           distances», §B «⚠ and no away frame is any OTHER cell's roof frame either», §C «⭐⭐⭐ and
//           it is EXACTLY one cell, not two: expected 20 to be 1» and §F «⭐⭐ a career living away
//           hears the away frame».
//           ⚠⚠ AND §B's TWO DISTINCTNESS CASES STAYED GREEN UNDER IT, which is a finding rather than
//           a gap: collapsing away onto roof leaves eight distinct met reads and twelve distinct
//           small-talk reads, because the ROOF column is already distinct. «The away column has no
//           duplicates» is simply not a statement about the axis, and only the DIFFERENCE cases are.
//
//   ARM 2   `presenceOf` returning `'roof'` for every stage – the DERIVATION neutralised rather than
//           the pool, which is the other half of the same mutation and reddens through a different
//           door.
//           4 RED · the same four. ⚠ Kept as its own arm because ARM 1 leaves `presenceOf` unread and
//           ARM 2 leaves `presenceLine` unread: either one alone would let the other rot.
//
//   ARM 3   `lifeStageOf` deleted from `lifeBeatPromptFor`'s call (the default `'school'` taken
//           instead) – the ASSEMBLER unwired while the exported function still splits perfectly.
//           1 RED · §F «⭐⭐ a career living away hears the away frame, through the assembler and not
//           through a test's own argument». ⚠⚠ AND ONLY ONE, WHICH IS EXACTLY WHY §F EXISTS: every
//           other case in this file hands `lifeBeatSaid` a stage itself and stays green over a
//           presence axis that never reaches a screen.
//
//   ARM 4   ⚠⚠ THE TWENTIETH ENTRY – an `away` frame added to `sunny`/`joy`, the cell the owner
//           deliberately left shared («She said it before anyone had asked how the week went.» is
//           channel-neutral, which is why his set is 19 and not 20).
//           2 RED · §C «⭐⭐⭐ `sunny`/`joy` is the one SHARED cell, and the away read falls back to
//           its roof line» and «⭐⭐⭐ and it is EXACTLY one cell, not two».
//
//   ARM 5   the fallback removed – `presenceLine` returning `cell.away as string` with no `??`.
//           7 RED · §C's two above, §D's two («⭐⭐⭐ every cell reads the identical quoted span» and
//           the extractor's own control) and all three of §E – the shape a missing cell takes when
//           nothing catches it is `undefined`, and it falls through every sweep downstream.
//
//   ARM 6   ⚠⚠ THE SHARED-QUOTE ARM. One roof quote de-contracted back to its shipped form
//           (`MET_HER_LINE.sunny.open.roof`'s «There's someone.» returned to «There is someone.»),
//           which is EXACTLY the diff the next person editing one side only will produce.
//           1 RED · §D «⭐⭐⭐ every cell reads the identical quoted span at both distances».
//           ⚠⚠ §A STAYED GREEN UNDER IT, and that is the whole argument for §D: a broken quote is
//           invisible to a test that only asks whether the two FRAMES differ. «Цитаты общие» is a
//           property or it is a convention, and a convention is what the next editor never hears.
//
//   ARM 7   `MET_DRY.private` reverted to its shipped tail («…and the house found out anyway»), the
//           duplication the вычитка found.
//           1 RED · §G «⭐⭐ no two rows of the parent's own narration end on the same clause».
//           ⚠⚠ AND IT CAUGHT THE PIN BEFORE IT CAUGHT THE CODE. The first draft of `trailingClauseOf`
//           took the last SENTENCE, and this arm came back GREEN on it – the two dry rows are two
//           different sentences that end on the same seven words, which is precisely the defect.
//           The helper was re-cut to the last CLAUSE and the arm re-run. A pin that cannot fail on
//           the version it was written to catch is not the pin.
//
//   ARM 8   `MET_DRY.private` set to `MET_EVENT['found-out'].private`'s sentence – the collision the
//           re-cut was explicitly checked against.
//           1 RED · §G «⚠ the dry card and the kept feed row are two sentences, not one».
//
//   ARM 9   ⚠ A NULL ARM, RECORDED BECAUSE IT IS A FINDING. `MET_MENTION.open` reverted to its
//           shipped line («…in passing, and did not stop to say who.»).
//           0 RED – 17 passed. The вычитка's second tail is a WORDING improvement (the narration
//           stated the mechanic: it explained an absence instead of naming it), and nothing here
//           pins it, deliberately: its trailing clause was already unique, it broke no banned tail,
//           and inventing a shape-pin around one sentence would pin the owner's copy against his own
//           next edit. What guards it is `tests/wave3-tail-lint.test.ts` and §G's house sweeps, both
//           of which the new line passes; the sentence itself is his to rule on at the playtest.
import { describe, expect, it } from 'vitest'
import {
  buildLifeBeatPrompt,
  createWorld,
  deliverKnownPartner,
  kidAgeExact,
  lifeBeatSaid,
  toSnapshot,
  PARTNER_WANTS,
  SMALL_TALK_SUBJECTS,
  TEMPERAMENTS,
  type WorldState,
} from '../src/engine/world'
import { schoolIsOver } from '../src/engine/kidLife'
import { bondBandOf } from '../src/engine/spirit'
import { DEFAULT_PROFILE, type BondBand, type CollegeState, type DiaryLifeStage, type LoveEpisode, type WorldEvent } from '../src/shared/protocol'

// -------------------------------------------------------------------------------------------------
// THE AXIS, AS A TOTAL RECORD
// -------------------------------------------------------------------------------------------------

/** ⭐⭐ WHICH SIDE OF THE PRESENCE LAW EACH STAGE FALLS ON – a `Record<DiaryLifeStage, …>` and never
 *  two hand-written lists, for the reason `LIFE_BEAT_BLOCKING` is one: a fifth stage must be a
 *  COMPILE error here rather than a stage this file silently stops sweeping. The two lists below are
 *  DERIVED from it, so they can never disagree with it either. */
const SIDE_OF: Record<DiaryLifeStage, 'roof' | 'away'> = {
  school: 'roof',
  'after-school': 'roof',
  college: 'away',
  independent: 'away',
}
const ALL_STAGES = Object.keys(SIDE_OF) as DiaryLifeStage[]
const ROOF_STAGES = ALL_STAGES.filter((s) => SIDE_OF[s] === 'roof')
const AWAY_STAGES = ALL_STAGES.filter((s) => SIDE_OF[s] === 'away')

/** The two stages every case reads as its representatives – the sweeps over ALL four are in §A. */
const ROOF: DiaryLifeStage = 'school'
const AWAY: DiaryLifeStage = 'college'

/** Every voiced cell of the two pools the вычитка touched, as (pool, voice, key) – twenty of them,
 *  eight `met` and twelve `small-talk`. Built from the engine's OWN key lists, so a pool that gains
 *  a want or a subject is swept without this file being edited. */
type Cell = { pool: 'met' | 'small-talk'; voice: (typeof TEMPERAMENTS)[number]; key: string }
const CELLS: Cell[] = [
  ...TEMPERAMENTS.flatMap((voice) => PARTNER_WANTS.map((key) => ({ pool: 'met' as const, voice, key }))),
  ...TEMPERAMENTS.flatMap((voice) => SMALL_TALK_SUBJECTS.map((key) => ({ pool: 'small-talk' as const, voice, key }))),
]
const MET_CELLS = CELLS.filter((c) => c.pool === 'met')
const TALK_CELLS = CELLS.filter((c) => c.pool === 'small-talk')

/** The owner's one deliberate hole in the away column – named once, read by §A and §C. */
const SHARED_CELL = { pool: 'small-talk', voice: 'sunny', key: 'joy' } as const
const isShared = (c: Cell): boolean => c.pool === SHARED_CELL.pool && c.voice === SHARED_CELL.voice && c.key === SHARED_CELL.key

/** Her line for one cell at one stage. ⚠ `'close'` ON THE `met` ROWS AND NOWHERE ELSE: that is the
 *  only bond band at which she speaks in her own voice at all, so it is the only band the presence
 *  axis can be read on. The mention and the dry card are the PARENT's narration and carry no
 *  presence column by design – §G is what holds them. */
function say(cell: Cell, stage: DiaryLifeStage): string {
  return cell.pool === 'met'
    ? lifeBeatSaid('met', 'p:1', cell.voice, 'level', 'close', cell.key as LoveEpisode['wants'], stage)
    : lifeBeatSaid('small-talk', cell.key, cell.voice, 'level', 'close', 'open', stage)
}

const nameOf = (c: Cell): string => `${c.pool} ${c.voice}/${c.key}`

/** The quoted span of a line – ⚠ AND IT THROWS ON AN ABSENT ONE rather than returning `''`.
 *  `tests/helpers/source.ts`' whole argument, applied to a string instead of a file: a matcher that
 *  answers «nothing» for a rotted marker turns §D's equality into `'' === ''`, which is the shape of
 *  a pin that has quietly stopped asking anything. */
function quoteOf(line: string, what: string): string {
  const spans = line.match(/"[^"]*"/g) ?? []
  if (spans.length !== 1) throw new Error(`${what}: expected exactly one quoted span, found ${spans.length} in ${line}`)
  return spans[0]
}

/** The narration of a line – her quotation stripped, which is the half the corpus's shape rules are
 *  about. Same strip `tests/helpers/bannedTails.ts` uses, spelled the same way. */
const narrationOf = (line: string): string => line.replace(/"[^"]*"/g, ' ')

/** The line's LAST CLAUSE – everything after the final comma or full stop.
 *
 *  ⚠⚠ A CLAUSE AND NOT A SENTENCE, AND THE DIFFERENCE IS THE WHOLE FINDING. The first draft of this
 *  helper took the last SENTENCE, and ARM 7 came back green on it: «She did not say so, and the
 *  house found out anyway.» and «She had been keeping it to herself, and the house found out
 *  anyway.» are two different sentences that end on the same seven words, which is exactly the
 *  defect the вычитка named and exactly what the coarser reading could not see. A pin that cannot
 *  fail on the version it was written to catch is not this pin – so the arm was run BEFORE the
 *  helper was trusted, not after. */
function trailingClauseOf(line: string): string {
  const parts = narrationOf(line).trim().split(/(?<=[.,])\s+/)
  return parts[parts.length - 1] ?? ''
}

// -------------------------------------------------------------------------------------------------
// FIXTURES – §F only
// -------------------------------------------------------------------------------------------------

/** The lowest `bond` that still reads as this band, found by ASKING THE LADDER rather than by
 *  re-deriving its cut points – the delivery file's own helper, for its own reason. */
function bondFor(band: BondBand): number {
  for (let b = 0; b <= 100; b += 0.5) if (bondBandOf(b) === band) return b
  throw new Error(`no bond value reads as ${band}`)
}

/** A career parked at `week` with an empty life – wave3-delivery's own `careerAt`, verbatim. */
function careerAt(seed: string, week: number): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  world.season = []
  world.week = week
  return world
}

/** ⭐⭐ A CAREER STANDING IN A NAMED LIFE STAGE, with the news owed to it this week.
 *
 *  ⚠⚠ THE STAGE IS FOUND AND THEN CONFIRMED AGAINST THE ENGINE'S OWN READER, which is what stops
 *  this fixture drifting into a claim of its own. The search below reads the two facts the stage is
 *  cut on; the assertion afterwards asks `toSnapshot(...).diary.facts.lifeStage`, the same field the
 *  diary and the week notes are licensed by. If the two ever part, this throws here instead of
 *  letting §F test a career that is not where it says it is. */
function careerInStage(seed: string, stage: DiaryLifeStage): WorldState {
  const { birthMonth, birthDay } = DEFAULT_PROFILE
  for (let week = 40; week < 52 * 30; week += 1) {
    // ⚠ A CHEAP PRE-FILTER AND NOT THE DECISION. Posing a snapshot for every week of a thirty-year
    // career would make this fixture cost more than the case it serves, so the loop skips on the two
    // facts the stage is cut from – and the snapshot below is still what says yes.
    const schoolDone = schoolIsOver(week, birthMonth)
    const adult = kidAgeExact(week, birthMonth, birthDay) >= 22
    if (stage === 'school' ? schoolDone : !schoolDone) continue
    if (stage === 'after-school' && adult) continue
    if (stage === 'independent' && !adult) continue

    const world = careerAt(seed, week)
    // `college` is the one stage a week cannot reach by itself: it is the FREEZE on the world, not a
    // date. Hand-built here exactly as `tests/ad-offer.test.ts` builds one.
    if (stage === 'college') {
      world.college = { fromWeek: week - 2, untilWeek: week + 208, doneWeek: null, years: [], pendingCallUp: null, pendingLeague: null } as CollegeState
    }
    if (toSnapshot(world).diary.facts.lifeStage !== stage) continue
    return world
  }
  throw new Error(`no week reads as ${stage}`)
}

/** The `'met'` beat delivered on this career's own tick, and the prompt it raises. */
function promptAfterDelivery(world: WorldState, wants: LoveEpisode['wants'] = 'open'): string {
  const known = world.week
  world.loveEpisodes = [{ id: 'p:1', sinceWeek: known - 10, endedWeek: null, knownWeek: known, wants, partnerId: 'p:1' }]
  deliverKnownPartner(world)
  const prompt = buildLifeBeatPrompt(world)
  if (prompt === null) throw new Error('the delivery raised no beat')
  return prompt.said
}

// =================================================================================================
// A. ⭐⭐⭐ THE SPLIT IS REAL – THE ANTI-VACUITY HEART OF THE WHOLE FILE
// =================================================================================================
describe('the вычитка fold A – roof and away are two registers, not one read twice', () => {
  it('⭐⭐⭐ the two registers are two: every cell but the shared one reads DIFFERENTLY at a distance', () => {
    let split = 0
    for (const cell of CELLS) {
      if (isShared(cell)) continue
      expect(say(cell, AWAY), `${nameOf(cell)} reads the same at both distances`).not.toBe(say(cell, ROOF))
      split += 1
    }
    // ⚠ THE COUNTS ARE THE POSITIVE CONTROL. A sweep over an empty list passes for ever, which is
    // how eight dead tests died in this wave; these say the loop really walked twenty cells and
    // really found nineteen of them split.
    expect(MET_CELLS.length, 'the away column is really eight `met` frames').toBe(8)
    expect(TALK_CELLS.length, 'and twelve `small-talk` cells').toBe(12)
    expect(split, 'nineteen of the twenty split – the owner\'s own set').toBe(19)
  })

  it('⭐⭐ the cut is by STAGE, and the two roof stages agree with each other exactly as the two away ones do', () => {
    for (const cell of CELLS) {
      for (const stage of ROOF_STAGES) {
        expect(say(cell, stage), `${nameOf(cell)} at ${stage}: a roof stage reads the roof frame`).toBe(say(cell, ROOF))
      }
      for (const stage of AWAY_STAGES) {
        expect(say(cell, stage), `${nameOf(cell)} at ${stage}: an away stage reads the away frame`).toBe(say(cell, AWAY))
      }
    }
    // ...and the two sides really are two sides, which the loop above cannot say on its own.
    expect(ROOF_STAGES, 'school and after-school are under the roof').toEqual(['school', 'after-school'])
    expect(AWAY_STAGES, 'college and independent are away').toEqual(['college', 'independent'])
  })

  it('⚠ the default is a ROOF read – which is what lets wave 2\'s whole pin sweep keep calling with five arguments', () => {
    for (const cell of CELLS) {
      const defaulted =
        cell.pool === 'met'
          ? lifeBeatSaid('met', 'p:1', cell.voice, 'level', 'close', cell.key as LoveEpisode['wants'])
          : lifeBeatSaid('small-talk', cell.key, cell.voice, 'level', 'close')
      expect(defaulted, `${nameOf(cell)}: the un-staged call is the shipped reading`).toBe(say(cell, ROOF))
    }
  })
})

// =================================================================================================
// B. THE AWAY COLUMN IS A COLUMN – NO SILENT FALLBACK BETWEEN VOICES OR CELLS
// =================================================================================================
describe('the вычитка fold B – nineteen frames, and no two of them are the same frame', () => {
  it('⭐⭐ eight away `met` frames, eight different lines', () => {
    const away = MET_CELLS.map((c) => say(c, AWAY))
    expect(new Set(away).size, 'eight away frames, eight different lines').toBe(8)
  })

  it('⭐⭐ twelve away `small-talk` reads, twelve different lines – the shared cell included', () => {
    const away = TALK_CELLS.map((c) => say(c, AWAY))
    expect(new Set(away).size, 'twelve away reads, twelve different lines').toBe(12)
  })

  it('⚠ and no away frame is any OTHER cell\'s roof frame either – the fallback is one cell wide, not a net', () => {
    const roofs = new Set(CELLS.map((c) => say(c, ROOF)))
    for (const cell of CELLS) {
      if (isShared(cell)) continue
      expect(roofs.has(say(cell, AWAY)), `${nameOf(cell)}: its away frame is somebody's roof frame`).toBe(false)
    }
  })
})

// =================================================================================================
// C. ⭐⭐⭐ THE ONE SHARED CELL – THE OWNER'S OWN NOTE, PINNED FROM BOTH SIDES
// =================================================================================================
//
// «sunny/joy has NO away entry, deliberately... its roof frame is channel-neutral and stays SHARED.
//  That is why the set is 19 and not 20. The away read must fall back to the roof line for exactly
//  this one cell – and that fallback needs its own pin.»
describe('the вычитка fold C – nineteen and not twenty, and the twentieth falls back', () => {
  it('⭐⭐⭐ `sunny`/`joy` is the one SHARED cell, and the away read falls back to its roof line', () => {
    const cell = SHARED_CELL as unknown as Cell
    const roof = say(cell, ROOF)
    expect(say(cell, AWAY), '⚠⚠ the channel-neutral frame stays shared').toBe(roof)
    for (const stage of ALL_STAGES) {
      expect(say(cell, stage), `${stage}: and it is shared at every stage, not just one`).toBe(roof)
    }
    // ⚠ AND IT IS A REAL LINE RATHER THAN AN EMPTY FALLBACK – the shape a deleted `??` takes.
    expect(roof, 'the fallback hands back her actual line').toContain('"')
  })

  it('⭐⭐⭐ and it is EXACTLY one cell, not two – a twentieth away frame goes red here', () => {
    const shared = CELLS.filter((c) => say(c, AWAY) === say(c, ROOF))
    expect(shared.map(nameOf), 'exactly one cell reads the same at both distances').toEqual([nameOf(SHARED_CELL as unknown as Cell)])
    expect(shared.length, 'and it is EXACTLY one cell, not two').toBe(1)
  })
})

// =================================================================================================
// D. ⭐⭐⭐ «ЦИТАТЫ ОБЩИЕ» AS A PROPERTY – THE QUOTED SPAN IS IDENTICAL IN BOTH REGISTERS
// =================================================================================================
//
// The owner, 11.09: «цитаты уже с контракциями по P2, они общие с домашними рамками». Presence moves
// the FRAME – the scene the parent is standing in – and never the sentence she says inside the
// quotation marks, so the roof quotes were re-cut to his contracted forms.
//
// ⚠⚠ THIS IS THE CASE THAT CATCHES THE NEXT PERSON WHO EDITS ONE SIDE ONLY, and it is why the rule
// is pinned instead of promised: §A stays perfectly green over a de-contracted roof quote, because
// the two frames still differ. Only an equality of the SPANS can see it.
describe('the вычитка fold D – the quotation is shared, the frame is not', () => {
  it('⭐⭐⭐ every cell reads the identical quoted span at both distances', () => {
    for (const cell of CELLS) {
      const name = nameOf(cell)
      expect(quoteOf(say(cell, AWAY), `${name} away`), `${name}: the quoted span is the same at both distances`).toBe(
        quoteOf(say(cell, ROOF), `${name} roof`),
      )
    }
    expect(CELLS.length, 'and the sweep really walked all twenty cells').toBe(20)
  })

  it('⚠ the extractor is not answering «nothing» twice – every line carries exactly one span, and it is not empty', () => {
    for (const cell of CELLS) {
      for (const stage of [ROOF, AWAY]) {
        const span = quoteOf(say(cell, stage), `${nameOf(cell)} ${stage}`)
        expect(span.length, `${nameOf(cell)} ${stage}: an empty quotation`).toBeGreaterThan(4)
      }
    }
  })
})

// =================================================================================================
// E. THE HOUSE RULES, ON THE NEW COLUMN – the sweeps the roof column already faces
// =================================================================================================
describe('the вычитка fold E – the away column obeys the same law the roof column does', () => {
  it('⚠ one quoted span, third-person narration, short dash only, no Cyrillic, no number, no price', () => {
    for (const cell of CELLS) {
      const line = say(cell, AWAY)
      const name = nameOf(cell)
      // ⚠ THE TYPE FIRST, AND IT IS NOT PEDANTRY: a cell with no away frame and no fallback hands
      // back `undefined`, which every regex assertion below would then fail on with an unreadable
      // message. ARM 5 is what this line was written for.
      expect(typeof line, `${name}: an away read that is not a line at all`).toBe('string')
      expect((line.match(/"[^"]*"/g) ?? []).length, `${name}: at most one quoted span`).toBe(1)
      expect(line, `${name}: no em-dash`).not.toContain('—')
      expect(line, `${name}: no Cyrillic`).not.toMatch(/[Ѐ-ӿ]/)
      expect(line, `${name}: no number and no price`).not.toMatch(/\d|[$€£]/)
    }
  })

  it('⚠⚠ the narration is ABOUT her, in the third person – and two of his frames open `Her`, not `She`', () => {
    // ⚠ THE RULE AS THE BIBLES MEAN IT, NOT AS THE OLDER PIN SPELLS IT. `tests/wave3-small-talk.test.ts`
    // asks the roof column for the literal word `she`, which was true of every frame it was written
    // against. Two of the owner's own away frames open «Her voice note skipped hello entirely.» and
    // «Her message came and did not ask for a reply.» – third person about her, which is what the rule
    // is FOR, and his words besides. Flagged to him rather than edited; the assertion here is the
    // claim the law actually makes, and the first-person ban below is the half that does the work.
    for (const cell of CELLS) {
      const narration = narrationOf(say(cell, AWAY))
      expect(narration.toLowerCase(), `${nameOf(cell)}: the narration names her`).toMatch(/\b(she|her)\b/)
      expect(narration, `${nameOf(cell)}: the narration is not the parent's own voice`).not.toMatch(/\b(I|you|your|me|mine|we|us|our)\b/i)
    }
  })

  it('⚠ and not one of them names a partner the sim does not hold – no gender, no name, no place', () => {
    // `LoveEpisode` carries no name and no gender ON PURPOSE, so a frame that said «him» would put on
    // screen a fact the world does not have. The delivery file pins this over the option labels; the
    // away column is nineteen more sentences that have to pass it.
    for (const cell of CELLS) {
      expect(say(cell, AWAY), `${nameOf(cell)} names a gender`).not.toMatch(/\b(him|his|boyfriend|girlfriend)\b/i)
    }
  })
})

// =================================================================================================
// F. ⭐⭐ THE ASSEMBLER – THE AXIS REACHES A SCREEN, NOT JUST THIS FILE'S OWN ARGUMENT
// =================================================================================================
//
// ⚠⚠ EVERY OTHER CASE ABOVE HANDS `lifeBeatSaid` A STAGE ITSELF, so all of them stay green over a
// presence axis that `lifeBeatPromptFor` never reads. This is the case that says the world's own
// stage is what the player gets, and ARM 3 is its receipt: unwiring `lifeStageOf` reddens here and
// nowhere else in the file.
describe('the вычитка fold F – the stage the career is actually in is the stage she speaks from', () => {
  it('⭐⭐ a career living away hears the away frame, through the assembler and not through a test\'s own argument', () => {
    const home = careerInStage('presence-roof', 'after-school')
    home.bond = bondFor('close')
    const said = promptAfterDelivery(home)
    expect(said, 'the roof career hears a roof frame').toBe(
      lifeBeatSaid('met', 'p:1', home.temperament!, 'level', 'close', 'open', 'after-school'),
    )

    for (const stage of AWAY_STAGES) {
      const away = careerInStage(`presence-${stage}`, stage)
      away.bond = bondFor('close')
      const awaySaid = promptAfterDelivery(away)
      expect(awaySaid, `${stage}: the away career hears an away frame`).toBe(
        lifeBeatSaid('met', 'p:1', away.temperament!, 'level', 'close', 'open', stage),
      )
      // ⚠⚠ AND THE TWO READS ARE DIFFERENT, which is what stops this passing on a collapsed axis: the
      // equality above holds trivially when roof and away are one string.
      expect(awaySaid, `${stage}: and it is not the frame the same girl would get at home`).not.toBe(
        lifeBeatSaid('met', 'p:1', away.temperament!, 'level', 'close', 'open', 'school'),
      )
    }
  })
})

// =================================================================================================
// G. THE TWO RE-CUT TAILS – ⚠⚠ THE PROPERTY, NOT THE SENTENCE
// =================================================================================================
//
// The вычитка's other two findings, both of them narration that stated the mechanic instead of the
// scene. (a) `MET_DRY`'s two rows both ended «and the house found out anyway», so the one axis that
// pool exists to carry arrived under a tail the player had already read. (b) `MET_MENTION.open`'s
// tail explained an absence («and did not stop to say who»); it now states it («No name came with
// it.»), which is honest precisely because the sim holds no name to withhold.
//
// ⚠ WHAT IS PINNED IS THE PROPERTY. The sentences themselves are drafts until his playtest, so the
// claim below is «no two rows of the parent's own narration for this beat end the same way» – which
// is the вычитка's finding stated as a rule the next draft also has to obey.
describe('the вычитка fold G – the parent\'s narration, four rows, four endings', () => {
  const parentRows = (): { name: string; line: string }[] =>
    PARTNER_WANTS.flatMap((wants) => [
      { name: `mention/${wants}`, line: lifeBeatSaid('met', 'p:1', 'sunny', 'level', 'steady', wants) },
      { name: `dry/${wants}`, line: lifeBeatSaid('met', 'p:1', 'sunny', 'level', 'strained', wants) },
    ])

  it('⭐⭐ no two rows of the parent\'s own narration end on the same clause', () => {
    const rows = parentRows()
    expect(rows.length, 'four rows – a mention and a dry card, per want').toBe(4)
    const tails = rows.map((r) => trailingClauseOf(r.line))
    for (const t of tails) expect(t.length, `an empty tail: ${t}`).toBeGreaterThan(4)
    expect(new Set(tails).size, `four rows, four endings – got ${JSON.stringify(tails)}`).toBe(4)
  })

  it('⚠ the dry card and the kept feed row are two sentences, not one', () => {
    // The collision the re-cut had to be checked against: `MET_EVENT['found-out'].private` is the
    // FEED's permanent record of the same week, and the card is what the player answers on. Two
    // surfaces, two sentences – reached through the engine rather than by quoting either of them.
    const world = careerAt('presence-dry-vs-feed', 900)
    world.bond = bondFor('strained')
    world.loveEpisodes = [{ id: 'p:1', sinceWeek: 890, endedWeek: null, knownWeek: 900, wants: 'private', partnerId: 'p:1' }]
    deliverKnownPartner(world)
    const feed = world.events.filter((e: WorldEvent) => e.type === 'life')
    expect(feed.length, 'the delivery wrote its kept row').toBe(1)
    const card = lifeBeatSaid('met', 'p:1', 'sunny', 'level', 'strained', 'private')
    expect(card, '⚠ the card and the kept feed row are two sentences, not one').not.toBe(feed[0].text)
    expect(trailingClauseOf(card), 'and they do not end the same way either').not.toBe(trailingClauseOf(feed[0].text ?? ''))
  })

  it('⚠ and the parent\'s four rows still assert nothing the world does not hold', () => {
    for (const { name, line } of parentRows()) {
      expect(line, `${name}: quotes nobody – the parent's narration, not hers`).not.toContain('"')
      expect(line, `${name} names a gender`).not.toMatch(/\b(him|his|boyfriend|girlfriend)\b/i)
      expect(line, `${name}: no number and no price`).not.toMatch(/\d|[$€£]/)
      expect(line, `${name}: no em-dash`).not.toContain('—')
    }
  })
})

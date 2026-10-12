// THE DISPLAY BOUNDARY'S WORDS – RU-22 (11.10): the engine writes ENGLISH WORDS into messages it has no business translating, and the screen reads them here.
//
// THE SEAM THIS CLOSES. A message is Russian and one of its holes is not: `Итоговый рейтинг ({0})` with `professional` in the brackets, `доиграв {2} сет` with `second`, `Травма: {1} – {0}` with
// `stress reaction – lower back`. The engine hands those words in as params (a body part, `LADDER_LABEL`, `finishLabel`, the set ordinal, the age spelled out) and cannot call `t()` (CLAUDE.md
// invariant 1; the words are also STORED in refs inside saves, which the digests and the twins hold byte-for-byte). So the word is read at the moment of showing, by a reader table over `t()`:
// the precedent is `BLOCK_WORD` / `localizeDay` of the week grid (L4-2b), generalised from «a label the screen draws» to «a word a message is handed».
//
//   · `HOLE_TABLE` (`wordHoles.ts`) says which hole of which message is which CLASS of word;
//   · a class is a reader: an English word in, a Russian word out (a `t('tag|word')` per entry, so every Russian word is a catalog key the translator sees and edits – none is typed here);
//   · the hook `holes(key, params)` is supplied to the formatter as `RenderContext.words` and runs ONLY when a Russian row renders: English renders itself and cannot reach it;
//   · a word the reader does not know comes back UNCHANGED (the same fallback as `blockWord`), and a name is never a word of any class – tournament names, rivals, brands and the kit marks
//     arrive in holes the table does not list, or in classes whose readers know no name.
//
// ⚠ EVERY READER RETURNS A NOMINATIVE FORM, and that is the rows' own law (`ru-engine-tails-2026-10.md` «Seams that are code»): the Russian around the hole puts the word after a colon, a dash
// or in brackets, so no case is built over it. The ordinal of a set is the exception that proves it – `доиграв {2} сет` takes an adjective, and the masculine nominative IS the accusative of an
// inanimate noun.
//
// ⚠ THE `t` PARAMETER OF `createWordReaders` IS NAMED `t` ON PURPOSE: the catalog extractor recognises a call by that identifier, so each `t('tag|word')` below enters the catalog as a key. The
// ONE call that is not a literal is `t(english)` in `text` (a closed set of labels the economy and the coach own, which are catalog keys already); the seat `engine.text` in
// `tools/i18n-seats.ts` names that set from the real constants.
import type { MessageParams } from '../shared/i18n'
import { HOLE_TABLE, NAMED_HOLES, type HoleRow, type NamedHole, type WordClass } from './wordHoles'
// ⭐ r49 №2 ф2 (12.10) – the `week` class reads the FORMAT REGISTRY, not the catalog: a week label's
// Russian is his compiled pattern (`formats.ru.json`), so the reader is the display module's own
// `localizedWeekLabel`. Imported from the LEAF (`./formats`) and never from `./dates`, which imports
// `./index` – that path would close the cycle words → dates → index → words (tests/import-cycles).
import { localizedWeekLabel } from './formats'

export type Translate = (key: string, params?: MessageParams) => string
/** An English word in, the word the player reads out – unchanged when the reader does not know it. */
export type WordReader = (english: string) => string

export interface WordReaders {
  /** `RenderContext.words`: the params of a message with its engine-born words read through the catalog. */
  holes: (key: string, params: MessageParams | undefined) => MessageParams | undefined
  /** One word through one class (the tests and the few screens that hold a word and no message). */
  word: (cls: WordClass, english: string) => string
  /** A label the economy or the coach owns, read through the catalog by its own text. */
  text: (english: string) => string
  /** ⭐ RU-23 – A LINE OF THE KID SCREEN'S TILES (the personality line, the school and college tile, the friends tile's lead): a sentence matcher per shape. `lead` is the tile's first line when `english` is its second. */
  tile: (english: string, lead?: string) => string
  /** The English words each class KNOWS, per class – what the tests feed through the readers to prove every word of the vocabulary has a Russian reading, and what the carpet looks for raw on a screen. */
  vocabulary: Readonly<Record<string, readonly string[]>>
}

const own = (table: object, key: string): boolean => Object.prototype.hasOwnProperty.call(table, key)

/** A table of thunks as a reader. An unknown word falls through; a THUNK, not a string, so the words follow the locale on the next render. */
function lexicon(table: Readonly<Record<string, () => string>>): WordReader {
  return (english) => (own(table, english) ? (table[english] as () => string)() : english)
}

const isUpper = (s: string): boolean => s !== '' && s.charAt(0) !== s.charAt(0).toLowerCase()
const upperFirst = (s: string): string => (s === '' ? s : s.charAt(0).toUpperCase() + s.slice(1))
const lowerFirst = (s: string): string => (s === '' ? s : s.charAt(0).toLowerCase() + s.slice(1))

/** The hole tables a reader set is built over – the real ones, unless a test hands a mutated copy to prove the net bites. */
export interface WordTables {
  holes: Readonly<Record<WordClass, readonly HoleRow[]>>
  named: readonly NamedHole[]
}

export function createWordReaders(t: Translate, tables: WordTables = { holes: HOLE_TABLE, named: NAMED_HOLES }): WordReaders {
  const vocab: Record<string, string[]> = {}
  /** `lexicon`, remembering which English words the class knows. */
  const lex = (cls: string, table: Readonly<Record<string, () => string>>): WordReader => {
    vocab[cls] = [...(vocab[cls] ?? []), ...Object.keys(table)]
    return lexicon(table)
  }
  /** A label that IS a catalog key (the shop's assets, the vacation packages, the kit grades, the staff rungs, the three college places): the key is the English text, so the lookup is the text itself. The set is
   *  closed and declared as the seat `engine.text`; a text outside it renders as written and counts as a miss, which is the number the owner reads. */
  const text: WordReader = (english) => t(english)
  // ── the draw: stages and finishes ─────────────────────────────────────────────────────────────────
  // The stage names (`stageLabel`) and the finish names (`finishLabel`) are one vocabulary read from two ends: «Quarterfinal» is where she lost, «Quarterfinalist» is what she was. Every stage
  // name and `Champion` / `Runner-up` are catalog keys with Russian already (the bracket and the finale read them); the two `…ist` words are new.
  const roundFixed = lex('round', {
    'Final': () => t('Final'),
    'Semifinal': () => t('Semifinal'),
    'Quarterfinal': () => t('Quarterfinal'),
    'Round of 16': () => t('Round of 16'),
    'Round of 32': () => t('Round of 32'),
    'Round of 64': () => t('Round of 64'),
    'Round of 128': () => t('Round of 128'),
    'First round': () => t('First round'),
    'Champion': () => t('Champion'),
    'Winner': () => t('Winner'),
    'Runner-up': () => t('Runner-up'),
    'Semifinalist': () => t('finish|Semifinalist'),
    'Quarterfinalist': () => t('finish|Quarterfinalist'),
  })
  const round: WordReader = (english) => {
    const fixed = roundFixed(english)
    if (fixed !== english) return fixed
    // any other draw: the generic row does the arithmetic the compact tabs cannot (`Круг из N участниц`)
    const m = /^Round of (\d+)$/.exec(english)
    return m ? t('Round of {0}', [Number(m[1])]) : english
  }

  // ── the court ─────────────────────────────────────────────────────────────────────────────────────
  const surfaceWord = lex('surface', {
    hard: () => t('Hard').toLowerCase(),
    clay: () => t('Clay').toLowerCase(),
    grass: () => t('Grass').toLowerCase(),
    Hard: () => t('Hard'),
    Clay: () => t('Clay'),
    Grass: () => t('Grass'),
  })

  // ── the tiers and the tables ──────────────────────────────────────────────────────────────────────
  const tier = lex('tier', {
    Local: () => t('tier|Local'),
    Regional: () => t('tier|Regional'),
    National: () => t('tier|National'),
    Slam: () => t('tier|Slam'),
  })
  /** «Local, Regional» – a list of short names the screen joined with commas before it was handed in. */
  const tierList: WordReader = (english) => english.split(', ').map(tier).join(', ')
  // The ladder's three names in a bracket or after a colon are the compact words the Stats screen already owns (`tile|`): country, juniors, pro. A capital letter is the English label, a lower
  // case the lowercased one; the compact Russian word is lower case either way (it stands inside a sentence in both).
  const ladder = lex('ladder', {
    National: () => t('tile|National'),
    International: () => t('tile|International'),
    Professional: () => t('tile|Professional'),
    national: () => t('tile|National'),
    international: () => t('tile|International'),
    professional: () => t('tile|Professional'),
  })
  /** The table's FULL display name – the words the rank chip and the Stats heading print («Национальный рейтинг»): for the one row whose Russian is the hole alone. */
  const ladderFull = lex('ladderFull', {
    National: () => t('National'),
    International: () => t('International'),
    Professional: () => t('Professional'),
  })
  const coachTier = lex('coachTier', {
    'Self-coached': () => t('Self-coached'),
    'Budget': () => t('coach|Budget'),
    'Middle': () => t('Middle'),
    'High': () => t('High'),
    'Elite': () => t('Elite'),
  })
  /** The points table's unit (`LADDER_POINTS_LABEL`): `national pts` … – the three rows RU-21 wrote for exactly this hole, the genitive plural after a figure. */
  const unit = lex('unit', {
    'national pts': () => t('national pts'),
    'international pts': () => t('international pts'),
    'professional pts': () => t('professional pts'),
  })
  /** How a finish READS in a sentence (`finishPhrase`, tierState.ts): `title`, `semi-final`, `round of 16`… – a goal, not a person. Nominative, after a colon or inside guillemets. */
  const phraseFixed = lex('phrase', {
    'title': () => t('phrase|title'),
    'final': () => t('phrase|final'),
    'semi-final': () => t('phrase|semi-final'),
    'quarter-final': () => t('phrase|quarter-final'),
  })
  const phrase: WordReader = (english) => {
    const fixed = phraseFixed(english)
    if (fixed !== english) return fixed
    // «round of 16» is the stage the draw sheet already names – the same row, in the lower case a sentence wants
    const m = /^round of (\d+)$/.exec(english)
    return m ? lowerFirst(round(`Round of ${m[1]}`)) : english
  }
  /** The oldest result's name on the Stats screen's «next drop» line – a tier's short name and a finish phrase composed in English («W15 semi-final»). */
  const dropWhat: WordReader = (english) => {
    const m = /^(\S+) (title|final|semi-final|quarter-final|round of \d+)$/.exec(english)
    return m ? `${tier(m[1] as string)} ${phrase(m[2] as string)}` : english
  }
  /** A radar axis, lower case, as `Work on her {axis}` is handed it. */
  const axis = lex('axis', {
    serve: () => t('Serve').toLowerCase(),
    return: () => t('Return').toLowerCase(),
    composure: () => t('Composure').toLowerCase(),
    stamina: () => t('Stamina').toLowerCase(),
    groundstrokes: () => t('Groundstrokes').toLowerCase(),
  })
  const seat = lex('seat', {
    'Coach': () => t('Coach'),
    'Masseur': () => t('Masseur'),
    'Hitting partner': () => t('Hitting partner'),
  })
  const league = lex('league', {
    'the College League': () => t('league|the College League'),
    'the Nations Cup': () => t('league|the Nations Cup'),
  })

  // ── places, sets, numbers ─────────────────────────────────────────────────────────────────────────
  /** `3rd`, `7th`, `21st` – nationalTeam.ts's `ordinal()` – as the place the Russian row names: `3-е`. */
  const place: WordReader = (english) => {
    const m = /^(\d+)(?:st|nd|rd|th)$/.exec(english)
    return m ? t('place|{0}', [Number(m[1])]) : english
  }
  const ordinal = lex('ordinal', {
    first: () => t('ord|first'),
    second: () => t('ord|second'),
    third: () => t('ord|third'),
    fourth: () => t('ord|fourth'),
    fifth: () => t('ord|fifth'),
  })
  const numbers = lex('count', {
    no: () => t('num|no'),
    zero: () => t('num|zero'),
    one: () => t('num|one'),
    two: () => t('num|two'),
    three: () => t('num|three'),
    four: () => t('num|four'),
    five: () => t('num|five'),
    six: () => t('num|six'),
    seven: () => t('num|seven'),
    eight: () => t('num|eight'),
    nine: () => t('num|nine'),
    ten: () => t('num|ten'),
    eleven: () => t('num|eleven'),
    twelve: () => t('num|twelve'),
    thirteen: () => t('num|thirteen'),
    fourteen: () => t('num|fourteen'),
    fifteen: () => t('num|fifteen'),
    sixteen: () => t('num|sixteen'),
    seventeen: () => t('num|seventeen'),
    eighteen: () => t('num|eighteen'),
    nineteen: () => t('num|nineteen'),
    twenty: () => t('num|twenty'),
  })
  const numbersF = lex('countF', {
    one: () => t('numf|one'),
    two: () => t('numf|two'),
  })
  /** A spelled number, either case. `keepCase`: the Russian line opens with it where the English did (a birthday line, the booth's run of games), otherwise it stands inside the sentence in lower case. Digits fall through. */
  const spelled = (feminine: boolean, keepCase: boolean): WordReader => (english) => {
    const low = english.toLowerCase()
    const ru = (feminine && own({ one: 1, two: 1 }, low) ? numbersF : numbers)(low)
    if (ru === low) return english
    return keepCase && isUpper(english) ? upperFirst(ru) : lowerFirst(ru)
  }

  /** A spelled number as the DIGITS it stands for – for a row whose Russian puts a PLURAL over the hole (`{0, plural, one {{0} межсезонье} …}`): the formatter reads a numeric string as the count (`Number('2')`) and prints it,
   *  where a word is "not a number" and the whole sentence falls back to English. No `t()`: a digit needs no catalog row. */
  const NUMBER_DIGITS: Readonly<Record<string, string>> = {
    no: '0', zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
    eleven: '11', twelve: '12', thirteen: '13', fourteen: '14', fifteen: '15', sixteen: '16', seventeen: '17', eighteen: '18', nineteen: '19', twenty: '20',
  }
  const digits: WordReader = (english) => {
    const low = english.toLowerCase()
    return own(NUMBER_DIGITS, low) ? (NUMBER_DIGITS[low] as string) : english
  }
  /** An age that the Russian names with its unit – `Её навыки в четырнадцать лет`: the spelled numeral and the noun, for the one row (`Where she is at {age}`) whose Russian has no `лет` of its own. Every age that is spelled in words is 13 – 20, where the noun is `лет` in every form. */
  const ageYears: WordReader = (english) => {
    const ru = spelled(false, false)(english)
    return ru === english ? english : `${ru} ${t('age|years')}`
  }
  /** The Kid screen's two notes under the grid (`schoolCutOffNote`, `collegeNote` – engine prose in `kidLife.ts`): one fixed sentence and three that carry the campus, a year and a total. They are composed English in the
   *  engine and shown inside `School – {0}` / `College – {0}`; each is read here as the WHOLE sentence it is, so the Russian owns its order and its plural. The place is one of the three college places (catalog keys
   *  now, `engine.text`) or the legacy phrase of a save that never measured an offer. A sentence that matches none of the shapes comes back as written. */
  const kidNote: WordReader = (english) => {
    if (english === 'School runs on a 1 September cut-off and her birthday falls after it – so her last school year ends the summer after she turns 18, a year later than girls born earlier in the same tennis year.') {
      return t('School runs on a 1 September cut-off and her birthday falls after it – so her last school year ends the summer after she turns 18, a year later than girls born earlier in the same tennis year.')
    }
    const place = (name: string): string => (name === 'The college place she took' ? t('The college place she took') : text(name))
    let m = /^(.+) – she is in year (\d+) of (\d+)\.$/.exec(english)
    if (m) return t('{0} – she is in year {1} of {2}.', [place(m[1] as string), Number(m[2]), Number(m[3])])
    m = /^(.+) – she stayed all (\d+) years and finished the course\.$/.exec(english)
    if (m) return t('{0} – she stayed all {1} years and finished the course.', [place(m[1] as string), Number(m[2])])
    m = /^(.+) – 1 year of the (\d+), and she left before the course ended\.$/.exec(english)
    if (m) return t('{0} – 1 year of the {1}, and she left before the course ended.', [place(m[1] as string), Number(m[2])])
    m = /^(.+) – (\d+) years of the (\d+), and she left before the course ended\.$/.exec(english)
    if (m) return t('{0} – {1} years of the {2}, and she left before the course ended.', [place(m[1] as string), Number(m[2]), Number(m[3])])
    return english
  }
  /** The college ending's detail – «1 of 4 years on the scholarship» – is composed English in the engine (`tick.ts`); the numbers are read out of it and the sentence is the catalog's. */
  const span: WordReader = (english) => {
    const m = /^(\d+) of (\d+) years on the scholarship$/.exec(english)
    return m ? t('{0} of {1} years on the scholarship', [Number(m[1]), Number(m[2])]) : english
  }

  // ── the Kid screen's tiles (RU-23) ────────────────────────────────────────────────────────────────
  // `kidLife.ts` composes the lines of three tiles in English and the screen printed them as they came. Each tile line is a WHOLE sentence or a short label, so a reader here matches the SHAPE and asks the
  // catalog for the sentence – the Russian owns its order and its plural, and nothing Russian is typed. The words of the personality line are RU-05 §4's (feminine, agreeing with her: she is the subject of
  // every tile); the school notes and the stage lines are RU-05 §5's; the friends lead is §6's. A line that matches no shape comes back as written.
  const trait = lex('trait', {
    'Unshakeable': () => t('Unshakeable'),
    'Patient': () => t('Patient'),
    'Impatient': () => t('Impatient'),
    'Hot-headed': () => t('Hot-headed'),
    'stubborn': () => t('stubborn'),
    'single-minded': () => t('single-minded'),
    'self-contained': () => t('self-contained'),
    'easy-going': () => t('easy-going'),
  })
  /** The grade's note under the number, and the weeks that override the class standing. */
  const schoolNote = lex('schoolNote', {
    'Exams this week': () => t('Exams this week'),
    'Summer break': () => t('Summer break'),
    'Oldest in class': () => t('Oldest in class'),
    'Older than most': () => t('Older than most'),
    'Young in class': () => t('Young in class'),
    'Youngest of all': () => t('Youngest of all'),
  })
  /** The rungs after the last grade, and the two college notes with no number in them. */
  const stageLine = lex('stageLine', {
    'Student tennis': () => t('Student tennis'),
    'Final year': () => t('Final year'),
    'Graduate': () => t('Graduate'),
    'Left college': () => t('Left college'),
    'The last bell': () => t('The last bell'),
    'Tennis full-time': () => t('Tennis full-time'),
    'No more classes': () => t('No more classes'),
    'Grown up': () => t('Grown up'),
    'Her own life now': () => t('Her own life now'),
  })
  // The friends tile names her closest friend. The names are localized DATA in Russian (RU-05 §6) – not a brand, not a tournament: the sixteen of `kidLife.ts`, once as the name and once as the person
  // she is «with» (the instrumental, which no suffix at the call site can build: `Эммой`, `Софией`, `Майей`, and the names that do not decline). Deliberately NOT `lex`: a friend's name is not an engine
  // WORD for the carpet's vocabulary to hunt, and a rival who happens to be called Sofia is a name nobody reads through a class.
  const friend = lexicon({
    Emma: () => t('friend|Emma'),
    Mia: () => t('friend|Mia'),
    Sofia: () => t('friend|Sofia'),
    Nina: () => t('friend|Nina'),
    Lena: () => t('friend|Lena'),
    Zoe: () => t('friend|Zoe'),
    Iris: () => t('friend|Iris'),
    Maja: () => t('friend|Maja'),
    Noor: () => t('friend|Noor'),
    Yuki: () => t('friend|Yuki'),
    Alba: () => t('friend|Alba'),
    Ines: () => t('friend|Ines'),
    Sara: () => t('friend|Sara'),
    Elif: () => t('friend|Elif'),
    Hana: () => t('friend|Hana'),
    Aida: () => t('friend|Aida'),
  })
  const friendWith = lexicon({
    Emma: () => t('with|Emma'),
    Mia: () => t('with|Mia'),
    Sofia: () => t('with|Sofia'),
    Nina: () => t('with|Nina'),
    Lena: () => t('with|Lena'),
    Zoe: () => t('with|Zoe'),
    Iris: () => t('with|Iris'),
    Maja: () => t('with|Maja'),
    Noor: () => t('with|Noor'),
    Yuki: () => t('with|Yuki'),
    Alba: () => t('with|Alba'),
    Ines: () => t('with|Ines'),
    Sara: () => t('with|Sara'),
    Elif: () => t('with|Elif'),
    Hana: () => t('with|Hana'),
    Aida: () => t('with|Aida'),
  })
  // ⚠ 11.10 (owner: «„1y 6m" → „1 г 6 м" – да, всё так, докинь») – the relationships tile. The
  // leads are a lexicon; the compact span re-composes with Russian unit letters and SPACES (his
  // typography); `together {span}` wraps the span. English never reaches here (engineTile's gate).
  const relLead = lex('relLead', {
    'Married': () => t('tile|Married'),
    'Engaged': () => t('tile|Engaged'),
    'Together for': () => t('tile|Together for'),
    'On her own': () => t('tile|On her own'),
    'it seems': () => t('tile|it seems'),
  })
  const spanRu = (english: string): string => {
    if (english === '<1m') return t('span|<1m')
    const m = /^(?:(\d+)y)?(?: ?(\d+)m)?$/.exec(english)
    if (!m || (m[1] === undefined && m[2] === undefined)) return english
    const parts: string[] = []
    if (m[1] !== undefined) parts.push(`${Number(m[1])} ${t('span|y')}`)
    if (m[2] !== undefined) parts.push(`${Number(m[2])} ${t('span|m')}`)
    return parts.join(' ')
  }
  const tile = (english: string, lead?: string): string => {
    const rel = relLead(english)
    if (rel !== english) return rel
    if (/^(?:<1m|\d+y(?: \d+m)?|\d+m)$/.test(english)) return spanRu(english)
    let tog = /^together (.+)$/.exec(english)
    if (tog) return t('tile|together {0}', [spanRu(tog[1] as string)])
    let m = /^(\S+) and (\S+)$/.exec(english)
    if (m) {
      const a = trait(m[1] as string)
      const b = trait(m[2] as string)
      return a === m[1] || b === m[2] ? english : t('{0} and {1}', [a, b])
    }
    m = /^(\d+)(?:st|nd|rd|th) grade$/.exec(english)
    if (m) return t('{0} grade', [Number(m[1])])
    const note = schoolNote(english)
    if (note !== english) return note
    m = /^Year (\d+) of (\d+)$/.exec(english)
    if (m) return t('Year {0} of {1}', [Number(m[1]), Number(m[2])])
    // «12 years done» under «The last bell» is the SCHOOL's twelve years; the same shape under «Graduate» is a course of four – two different Russian sentences for one English shape, told apart by the lead
    m = /^(\d+) years done$/.exec(english)
    if (m) return lead === 'The last bell' ? t('12 years done') : t('{0} years done', [Number(m[1])])
    m = /^(\d+) of (\d+) years$/.exec(english)
    if (m) return t('{0} of {1} years', [Number(m[1]), Number(m[2])])
    const stage = stageLine(english)
    if (stage !== english) return stage
    m = /^Close to (\S+)$/.exec(english)
    if (m) {
      const name = friendWith(m[1] as string)
      return name === m[1] ? english : t('Close to {0}', [name])
    }
    m = /^(\S+) next door$/.exec(english)
    if (m) {
      const name = friend(m[1] as string)
      return name === m[1] ? english : t('{0} next door', [name])
    }
    return english
  }

  // ── the body ──────────────────────────────────────────────────────────────────────────────────────
  const partWord = lex('part', {
    'ankle': () => t('body|ankle'),
    'knee': () => t('body|knee'),
    'hamstring': () => t('body|hamstring'),
    'calf': () => t('body|calf'),
    'foot': () => t('body|foot'),
    'hip': () => t('body|hip'),
    'wrist': () => t('body|wrist'),
    'shoulder': () => t('body|shoulder'),
    'elbow': () => t('body|elbow'),
    'forearm': () => t('body|forearm'),
    'lower back': () => t('body|lower back'),
    'abdominal': () => t('body|abdominal'),
  })
  const hurtWord = lex('hurt', {
    'soreness': () => t('hurt|soreness'),
    'strain': () => t('hurt|strain'),
    'stress reaction': () => t('hurt|stress reaction'),
    'tear': () => t('hurt|tear'),
    'niggle': () => t('hurt|niggle'),
  })
  const PARTS = ['abdominal', 'lower back', 'hamstring', 'shoulder', 'forearm', 'ankle', 'wrist', 'elbow', 'knee', 'calf', 'foot', 'hip']
  /** The injury's `kind` – «<part> <descriptor>», maybe capitalised – as «descriptor – part», the pair the injury rows already print. The legacy words `injury` and `an injury` read as themselves. */
  const kind: WordReader = (english) => {
    const low = english.toLowerCase()
    let out: string | null = null
    if (low === 'injury') out = t('injury')
    else if (low === 'an injury') out = t('an injury')
    else {
      for (const part of PARTS) {
        if (!low.startsWith(`${part} `)) continue
        const descriptor = low.slice(part.length + 1)
        const hurt = hurtWord(descriptor)
        if (hurt !== descriptor) out = `${hurt} – ${partWord(part)}`
        break
      }
    }
    if (out === null) return english
    return isUpper(english) ? upperFirst(out) : lowerFirst(out)
  }

  // ── the court row: the venue and the clause that says when the hours were booked ──────────────────
  const court = lex('court', {
    'Club courts': () => t('court|Club courts'),
    'Indoor courts': () => t('court|Indoor courts'),
    'Academy courts': () => t('court|Academy courts'),
    'Performance centre': () => t('court|Performance centre'),
    'Court hire': () => t('court|Court hire'),
    'Show courts': () => t('court|Show courts'),
    'Centre court': () => t('court|Centre court'),
    'peak slots': () => t('court|peak slots'),
    'peak rate': () => t('court|peak rate'),
    'prime time': () => t('court|prime time'),
    'the busy hours': () => t('court|the busy hours'),
    'off-peak': () => t('court|off-peak'),
    'quiet hours': () => t('court|quiet hours'),
    'early slots': () => t('court|early slots'),
    'off-peak rate': () => t('court|off-peak rate'),
    'after school': () => t('court|after school'),
    'evenings': () => t('court|evenings'),
    'the usual slot': () => t('court|the usual slot'),
    'weekday hours': () => t('court|weekday hours'),
    'daytime slots': () => t('court|daytime slots'),
    'mornings': () => t('court|mornings'),
    'midweek': () => t('court|midweek'),
  })

  // ── a label the economy or the coach owns ─────────────────────────────────────────────────────────
  const ecoLower: WordReader = (english) => lowerFirst(text(upperFirst(english)))

  // ── the table ────────────────────────────────────────────────────────────────────────────────────
  const readers: Record<WordClass, WordReader> = {
    round,
    surface: surfaceWord,
    tier,
    tierList,
    unit,
    phrase,
    dropWhat,
    axis,
    ladder,
    ladderFull,
    coachTier,
    seat,
    league,
    place,
    span,
    kidNote,
    ordinal,
    age: spelled(false, true),
    ageYears,
    count: spelled(false, false),
    countOpen: spelled(false, true),
    digits,
    countF: spelled(true, false),
    week: localizedWeekLabel,
    part: partWord,
    hurt: hurtWord,
    kind,
    court,
    eco: text,
    ecoLower,
    trait,
    schoolNote,
    stageLine,
    relLead, // ⚠ 11.10 – the relationships tile's leads
  }

  const positional = new Map<string, Map<string, WordReader>>()
  const named = new Map<string, Map<string, WordReader>>()
  const put = (into: Map<string, Map<string, WordReader>>, key: string, hole: string, cls: WordClass): void => {
    const holes = into.get(key) ?? new Map<string, WordReader>()
    holes.set(hole, readers[cls])
    into.set(key, holes)
  }
  for (const cls of Object.keys(tables.holes) as WordClass[]) {
    for (const [key, ...holes] of tables.holes[cls]) for (const h of holes) put(positional, key, String(h), cls)
  }
  for (const [key, hole, cls] of tables.named) put(named, key, hole, cls)

  function holes(key: string, params: MessageParams | undefined): MessageParams | undefined {
    if (params === undefined) return params
    const spec = Array.isArray(params) ? positional.get(key) : named.get(key)
    if (spec === undefined) return params
    if (Array.isArray(params)) {
      const next = [...(params as readonly unknown[])]
      for (const [hole, read] of spec) {
        const i = Number(hole)
        const v = next[i]
        if (typeof v === 'string') next[i] = read(v)
      }
      return next
    }
    const next: Record<string, unknown> = { ...(params as Readonly<Record<string, unknown>>) }
    for (const [hole, read] of spec) {
      const v = next[hole]
      if (typeof v === 'string') next[hole] = read(v)
    }
    return next
  }

  // the composite words have no table of their own: their vocabulary is every part with every descriptor, the legacy words, and the places a nation can finish
  vocab.kind = [...PARTS.flatMap((part) => ['soreness', 'strain', 'stress reaction', 'tear', 'niggle'].map((d) => `${part} ${d}`)), 'injury', 'an injury']
  vocab.place = Array.from({ length: 24 }, (_, i) => `${i + 1}${['th', 'st', 'nd', 'rd'][(i + 1) % 100 >= 11 && (i + 1) % 100 <= 13 ? 0 : (i + 1) % 10] ?? 'th'}`)
  return { holes, word: (cls, english) => readers[cls](english), text, tile, vocabulary: vocab }
}

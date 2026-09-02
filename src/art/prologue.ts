// THE PICTURE ON A PROLOGUE CARD – phase 7 of docs/specs/childhood-prologue-build-2026-09.md.
//
// THE OWNER, 02.09: «надо сделать пролог красивым … по типу нашего home screen где большой арт на всю
// ширину экрана, а текст под ним или частично на нем … Это первое прикосновение к игре, оно должно
// быть "вау! интересно!"»
//
// ⭐⭐ NOTHING WAS DRAWN FOR THIS. Every frame the nine cards show already ships:
//
//   * `fem-euro-brunnet-jun-*.webp`   – eight faces, and `portraitStage` puts every age under 11 in
//     that band. The band's boundary was set FOR this: «young starts at 11 – the childhood prologue
//     is coming, so the boundary is deliberately set where the prologue will need it» (owner, 25.07,
//     recorded in shared/avatarEmotion.ts). The prologue is the first thing that has ever asked for
//     `jun`, which until now existed only as the onboarding hero's stand-in.
//   * `fem-euro-brunnet-young-*.webp` – the same eight, for 11, 12 and 13.
//   * `welcome-1.webp` – ⭐ THE OWNER'S OWN INSTRUCTION FOR THE FIRST CARD: «для этого у нас есть
//     картинка где она первый раз на корт приходит вообще». A parent and a daughter arriving on a
//     floodlit court at dusk, which is the age-5 card – and, since 02.09, the age-8 card too:
//     «вполне можно снова использовать первый арт, там как раз про теннисный клуб».
//
// ⚠ THE URL BUILDERS ARE THE SHIPPED ONES AND THIS FILE ADDS NONE. `portraitUrl` and
// `onboardingHeroUrl` both live in `art/preload.ts`; a fourth place that interpolates
// `fem-euro-brunnet-{stem}-{emotion}` is exactly the divergence `portraitAssetStem`'s note warns
// about, and it stays invisible until an art set arrives under different filenames.
//
// ⚠ AND NOTHING NEEDS PRELOADING. Round 29 part two #7 put the whole of `public/images/**` into the
// PWA precache at the owner's ruling – 313 entries, 12.3 MB – so every frame below is on the device
// before the first card renders. `preloadKidArt` is not called here and must not be: it would warm
// files the service worker already holds.
import { onboardingHeroUrl, portraitUrl } from './preload'
import { facePoint } from './faceRects'
import { portraitAssetStem, portraitStage } from '../shared/avatarEmotion'
import type { PortraitEmotion } from '../shared/avatarEmotion'

// =================================================================================================
// ⭐⭐⭐ WHICH FRAME EACH CARD SHOWS – THE OWNER'S OWN PICKS, 02.09, AND WHY THEY LIVE HERE
// =================================================================================================
//
// He walked the nine cards and named a painting for six of them, card by card:
//
//   age 7   «Использовать портрет serious (где она с ракеткой стоит)» – for variety as much as fit.
//   age 8   «вполне можно снова использовать первый арт, там как раз про теннисный клуб».
//   age 9   `serious` and NOT the delighted frame the derivation was handing him – «ничего ещё не
//           выиграно», nothing has been won yet, and a face that reads as a win before the first
//           tournament is the card claiming something the year has not earned.
//   age 10  a different one again, `serious` or `norm`, «турнир ещё не состоялся» – the Local Open
//           is six weeks away on this card, so the picture may not anticipate it either.
//   age 11  «тоже нужен свой арт, предложи вариант, а я сделаю» – a painting of its own is coming
//           and the row below is the stand-in until it does.
//   age 13  `norm`.
//
// ⚠⚠ AND THEY ARE ART DIRECTION, NOT A `mood` COLUMN IN `cards.ts`. That distinction is the whole
// reason this table is in this file. `tests/prologue-art.test.ts` pins that NO card row carries a
// face – a face typed beside the copy is a second statement about the year kept in step with the
// first by hand – and that pin still holds, because nothing here is in the copy table. What the
// owner picked is which PAINTING hangs on a card, which is the same kind of decision as
// `welcome-1` being the opening one, and it belongs beside it.
//
// ⚠ AN AGE THAT IS ABSENT IS STILL DERIVED. Six ages are pinned; 6 and 12 are not, and they read
// `moodAt` exactly as every card did before – the twelfth in particular, because the fork's two
// faces ARE the fork («keep the current art», his words on that card). So the derivation is not
// replaced, it is the default.

/** One card's frame: a scene instead of a portrait, a pinned face, or neither (derive it). */
export interface PrologueFrame {
  /** ⭐ the welcome painting rather than a portrait of her alone – the arrival on a court */
  readonly scene?: 'welcome'
  /** ⭐ the face the owner named. Absent -> `moodAt`'s derivation stands. */
  readonly face?: PortraitEmotion
}

export const PROLOGUE_FRAMES: Readonly<Record<number, PrologueFrame>> = {
  5: { scene: 'welcome' },
  7: { face: 'serious' },
  8: { scene: 'welcome' },
  9: { face: 'serious' },
  // ⚠ `norm` AND NOT A SECOND `serious`: 7 and 9 are already his serious frame, and «другой портрет»
  // was the ask. It is also the honest face for a card whose tournament has not been played.
  10: { face: 'norm' },
  // ⚠ THE STAND-IN FOR THE PAINTING HE IS COMMISSIONING. `young-norm` rather than `young-serious`
  // because the twelfth's own derived arm is `serious` on the carried road, and two identical
  // frames in a row is the one thing a placeholder must not do. Replace this line when his art
  // lands – it is one row of a table and nothing else moves.
  11: { face: 'norm' },
  13: { face: 'norm' },
}

/** The ages drawn on the welcome painting rather than on a portrait – DERIVED from the table, never
 *  declared beside it, so a card that gains or loses the scene cannot leave a second list stale.
 *  `tests/prologue-art.test.ts` pins the first of them against `PROLOGUE_CARDS[0].age`. */
export const WELCOME_AGES: readonly number[] = Object.keys(PROLOGUE_FRAMES)
  .map(Number)
  .filter((age) => PROLOGUE_FRAMES[age]?.scene === 'welcome')
  .sort((a, b) => a - b)

// =================================================================================================
// ⭐⭐ THE HOOK FOR A RESULT, AND HOW IT IS MEANT TO BE USED
// =================================================================================================
//
// THE OWNER, 02.09, on the age-10 card: the tournament has not happened yet, so the picture may not
// pretend it has. A separate slice is wiring the Local Open itself (`src/prologue/pool.ts` already
// holds the field); this file is not building it and must not.
//
// ⚠ WHAT IS LEFT READY IS ONE OPTIONAL ARGUMENT, not a table and not a flag. `prologueArtUrl`,
// `prologueArtStem` and `prologueFacePoint` all take an optional `outcome`, and when one is passed
// it OUTRANKS both the pinned frame and the derivation – because a result is the strongest thing
// the game can know about that year, and a card that showed `norm` over a won draw sheet would be
// the picture disagreeing with the screen the player just came off.
//
// ⚠ SO THE WIRING, WHEN IT COMES, IS ONE ARGUMENT AT ONE CALL SITE: `ChildhoodPrologue.vue` learns
// the Local Open's result and passes it down to `PrologueCard`'s `mood` neighbour as `outcome`.
// Nothing in this module has to change, no card row gains a column, and until that day every caller
// passes nothing and every frame is exactly the one the owner picked. `tests/prologue-art.test.ts`
// proves the hook is live rather than decorative by exercising it.

/** What the year's tournament came to, when the year has had one. */
export type PrologueOutcome = 'won' | 'lost'

/** ⚠ TWO FACES OUT OF THE SHIPPED EIGHT, so the hook cannot 404: `portrait-bands.test.ts` sweeps
 *  every band x emotion against the files on disk, and both of these are in it. */
const OUTCOME_FACES: Readonly<Record<PrologueOutcome, PortraitEmotion>> = {
  won: 'happy',
  lost: 'sad',
}

/** ⭐ THE ONE PLACE THE THREE INPUTS ARE RANKED – a result, then the owner's pick, then the
 *  derivation – so the URL, the stem and the framing point cannot disagree about which frame a card
 *  is drawing. */
export function prologueFace(age: number, mood: PortraitEmotion, outcome?: PrologueOutcome): PortraitEmotion {
  if (outcome) return OUTCOME_FACES[outcome]
  return PROLOGUE_FRAMES[age]?.face ?? mood
}

/** Is this card drawn on the welcome scene? A result takes it back to a portrait: the scene is two
 *  people arriving at a court and cannot report a draw sheet. */
function showsScene(age: number, outcome?: PrologueOutcome): boolean {
  return !outcome && PROLOGUE_FRAMES[age]?.scene === 'welcome'
}

/** The painting for one year of the childhood.
 *
 *  ⚠ TOTAL AND NEVER A 404. `portraitStage` is total over every age (`jun` below 11, `young` at
 *  11-16) and `tests/portrait-bands.test.ts` already sweeps every band × emotion against the files
 *  on disk, so any `PortraitEmotion` this is handed has a file in both bands the prologue can reach.
 *  `moodAt` in `src/prologue/run.ts` is one producer and `PROLOGUE_FRAMES` above is the other, and
 *  both deal only in `PortraitEmotion`. */
export function prologueArtUrl(age: number, mood: PortraitEmotion, outcome?: PrologueOutcome): string {
  if (showsScene(age, outcome)) return onboardingHeroUrl()
  return portraitUrl(portraitStage(age), prologueFace(age, mood, outcome))
}

/** The painting's stem – what `facePoint` is keyed on, and what the tests name a frame by.
 *
 *  ⚠ `portraitAssetStem`, NEVER THE STAGE INTERPOLATED DIRECTLY. It is identity on all five bands
 *  today and `shared/avatarEmotion.ts` keeps the seam anyway, naming the exact failure this would
 *  otherwise reintroduce: «a fifth that interpolates the stage directly is harmless TODAY and would
 *  break again the moment a stem stops being identity». This is that fifth builder. */
export function prologueArtStem(age: number, mood: PortraitEmotion, outcome?: PrologueOutcome): string {
  if (showsScene(age, outcome)) return 'welcome-1'
  return `${portraitAssetStem(portraitStage(age))}-${prologueFace(age, mood, outcome)}`
}

// =================================================================================================
// ⭐⭐⭐ WHERE THE WINDOW SITS ON THE PAINTING – and the one entry that is NOT a face centre
// =================================================================================================
//
// ⚠⚠ THE OWNER, 02.09: «Заглавная картинка на экране обрезана (отец без головы)». Reproduced, and
// it was arithmetic rather than taste. `welcome-1.webp` is a 512x512 master; the card's hero was
// 16:9, so `object-fit: cover` scaled the painting to 343x343 inside a 343x193 window and threw
// away 150px of it. Centred (`facePoint` returns 50/50 for a stem it does not know), the visible
// band was source y 112..400 – and the parent's head lives at y 20..145. It was cut off at the jaw.
//
// TWO THINGS FIX IT AND BOTH ARE HERE ON PURPOSE:
//
//   1. THE WINDOW IS SQUARE NOW (`.prologue-hero` in PrologueCard.vue, `aspect-ratio: 1 / 1`, which
//      is Home's own declaration for its own square masters). A square window over a square
//      painting crops NOTHING, at any width, so at the shipped size this is already the whole fix
//      and the point below never moves anything.
//   2. AND THE POINT BELOW IS WHAT MAKES THAT TRUE OF A WINDOW THAT IS *NOT* SQUARE. A hero is a
//      layout decision and layout decisions move; a framing point recorded next to the painting
//      does not. `tests/prologue-art.test.ts` measures it against a 16:9 window – i.e. against the
//      exact geometry that produced the defect – so the regression cannot come back by a stylesheet
//      edit alone.
//
// ⚠ AND IT IS DELIBERATELY NOT AN ENTRY IN `art/faceRects.ts`. That table is keyed on
// `{stage}-{emotion}` PORTRAITS and has a second consumer that is not a screen: `croppableStems()`
// feeds the 256px avatar cutter, and `welcome-1` is a scene with two people in it that no avatar is
// ever cut from. Adding it there would ship a crop of somebody's shoulder as an avatar. The
// prologue owns this framing because the prologue is what hangs this painting.

/** ⭐ THE WELCOME SCENE'S FRAMING POINT, as `object-position` percentages.
 *
 *  READ OFF THE PAINTING the way faceRects.ts describes its own method (a labelled grid over the
 *  512px master), and it is the frame of the PAIR rather than of one face, because the picture's
 *  subject is two people arriving somewhere:
 *
 *      the parent's head   x 185..295, y  20..145
 *      her head            x 300..390, y 185..270
 *
 *  Horizontally the pair spans 185..390, so its centre is x 287 -> 56%. Vertically the two heads
 *  span 250px of a 512px master and a 16:9 window over this painting shows only 288 of them, so the
 *  band has to sit HIGH: any y above ~8.9% cuts the parent's hair. 4.5% (y 23px) leaves ~10px of
 *  headroom above the parent and ~29px below her chin, which is the widest margin the geometry
 *  allows on both sides at once. */
export const WELCOME_POINT: { readonly x: number; readonly y: number } = { x: 56, y: 4.5 }

/** Where the card's window sits on the painting it is showing – the face table for a portrait, the
 *  scene's own point for `welcome-1`. One function so the component reads one thing. */
export function prologueFacePoint(
  age: number,
  mood: PortraitEmotion,
  outcome?: PrologueOutcome,
): { x: number; y: number } {
  if (showsScene(age, outcome)) return { x: WELCOME_POINT.x, y: WELCOME_POINT.y }
  return facePoint(prologueArtStem(age, mood, outcome))
}

// =================================================================================================
// THE FEED'S LIFE-ROW GLYPH COLUMN (wave 3, T9) – the mechanism, and a map that is EMPTY ON PURPOSE
// =================================================================================================
//
// THE RULED SURFACE, `docs/specs/who-she-is-2026-09.md` §5a (09.09): «Фид: эмоджи» – the feed's life
// rows and NOTHING ELSE. Nothing lands beside the Mood word, because that tile already carries the
// game's own emoji – her 36px face, stage-true and engine-decided – and a Unicode mark beside it
// would say the same thing twice in two visual languages.
//
// What a glyph buys HERE is navigation rather than decoration, in §5a's own words: a career's feed
// is hundreds of tennis rows, and the private-life thread (met someone · it ended · the wedding ·
// the birthday ask) is exactly the thread a player wants to re-find seasons later.
//
// ⚠⚠ THE GLYPHS THEMSELVES ARE THE OWNER'S PICKS, AND THAT IS WHY THIS FILE SHIPS EMPTY. §5a: «the
// set is his to pick, and no agent adds or swaps one unasked» – CLAUDE.md's invariant 4 (a
// player-facing string is not an agent's to change) extended to glyphs, because a mark on a row IS
// what the row says. T9 ships the COLUMN and hands a PROPOSED glyph to the owner with the wave's
// вычитка package; the map below fills after his word.
//
// ⚠ FILLING IT IS ONE LINE AND NOTHING ELSE. Uncomment (or add) the row kind's line inside `PICKS`.
// No type moves, no renderer moves, no test is re-aimed: `HomeScreen.vue` spreads this map into its
// own `EVENT_EMOJI` and `eventPrefix()` reads whatever is there, and the feed test asserts the row
// against THIS MAP rather than against a hard-coded glyph.
import type { WorldEventType } from '../../shared/protocol'

/** The feed row kinds that are about HER LIFE rather than about her tennis or the family's money.
 *
 *  ⚠ ONE MEMBER TODAY, and the roster is the place a second one gets noticed. `'life'` is what
 *  `deliverKnownPartner` writes (T6); wave 4's endings write «the other half» and §5a imagines a
 *  wedding and a birthday ask after that. Whether those arrive as new `WorldEventType` members or as
 *  a discriminator on the row, the column has to grow with them – and if a member is added here
 *  while the map is filled, the build says so (see `LifeRowGlyphs`).
 *
 *  ⚠ `satisfies` KEEPS THE ROSTER HONEST IN THE OTHER DIRECTION TOO: a kind renamed or dropped from
 *  `WorldEventType` fails the build on this line instead of rotting into a lookup that never hits. */
export const LIFE_ROW_KINDS = ['life'] as const satisfies readonly WorldEventType[]

export type LifeRowKind = (typeof LIFE_ROW_KINDS)[number]

/** ⚠⚠ THE TOTALITY GATE, AND IT IS A UNION ON PURPOSE: **empty, or total – never half-filled.**
 *
 *  `Record<string, never>` is satisfied by `{}` alone, so while the owner has not spoken this type
 *  costs nothing and asserts nothing – inert, but present and compiled. The moment ONE glyph lands,
 *  the literal stops matching that arm (a `string` is not a `never`) and has to match the other,
 *  which requires EVERY life row kind to carry one. So a wave that adds a second kind and fills only
 *  the first fails `vue-tsc`, in `npm run check`, with the missing kind named.
 *
 *  ⚠ A COMPILE SHAPE RATHER THAN A TEST, deliberately: the failure it guards against is a HALF-DONE
 *  fill, which is a thing somebody does while editing this file – and the build is the reader that
 *  cannot be skipped. The runnable mirror of the same property lives in the T9 test, which is where
 *  a reader who is not a compiler can see it stated. */
export type LifeRowGlyphs = Record<string, never> | Record<LifeRowKind, string>

// ⚠⚠ THE OWNER'S PICKS GO HERE AND NOWHERE ELSE. One line per row kind. ⭐ FILLED 11.09: he picked
// the WHITE HEART for the life row – it names the thread at the lowest possible volume, monochrome
// so it sits quietly against the painted feed, gender-free (the episode persists no gender by
// design), and honest across all three registers the row already has: told, found out, and the
// later ones wave 4 will add. `❤️` would shout over the dry card; `🌱` reads as pregnancy the moment
// children exist in the sim.
//
// ⚠ ONE GLYPH MARKS EVERY LIFE ROW TODAY, and that is a known limit rather than an oversight:
// `WorldEvent` carries no life-kind discriminator, so wave 4's endings and §5a's wedding would wear
// this same heart. Per-kind marks need either new `WorldEventType` members or a field on the row –
// a design call that is his, flagged at T9 and still open.
//
// ⚠⚠ HALF OF THAT NOTE WAS ANSWERED AT v75 (wave 4 T1, 12.09) AND THE OTHER HALF IS STILL HIS. The
// design call went the FIELD way: `WorldEvent.lifeKind?: LifeBeatKind` exists now, optional and
// never back-filled, and its own comment carries the argument for why a row's KIND is a finer
// question than what the row IS. So the sentence above – «`WorldEvent` carries no life-kind
// discriminator» – has stopped being true and is kept as the record of where the choice was flagged.
// ⚠ NOTHING ELSE MOVED IN THIS FILE AND NOTHING SHOULD HAVE: T1 writes the field nowhere, so every
// row in every career still reads `undefined` and still wears this same heart. The column learns to
// read it at T5, which keys on `lifeKind ?? 'met'` so a wave-3 row keeps 🤍 untouched – and the
// GLYPHS for the new kinds remain the owner's picks (§5a: «no agent adds or swaps one unasked»),
// proposed to him with T6's package and landing in `PICKS` after his word, never before.
const PICKS = {
  life: '🤍',
} satisfies LifeRowGlyphs

/** The column the feed reads. `Partial<…>` is the honest type for the READER – a kind may have no
 *  glyph – while `PICKS` above carries the empty-or-total gate for the WRITER. */
export const LIFE_ROW_EMOJI: Partial<Record<LifeRowKind, string>> = PICKS

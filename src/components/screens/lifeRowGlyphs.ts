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
import type { LifeBeatKind, WorldEventType } from '../../shared/protocol'

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
// ⚠ T5 IS HERE (12.09) AND IT IS THE SECOND STOREY BELOW THIS RECORD, NOT AN EDIT TO IT. The column
// now reads `lifeKind ?? 'met'` exactly as promised, and `PICKS` did not move by a byte – the per-kind
// picks are their own record, shipped EMPTY, with his white heart as the fallback under all of them.
const PICKS = {
  life: '🤍',
} satisfies LifeRowGlyphs

/** The column the feed reads. `Partial<…>` is the honest type for the READER – a kind may have no
 *  glyph – while `PICKS` above carries the empty-or-total gate for the WRITER. */
export const LIFE_ROW_EMOJI: Partial<Record<LifeRowKind, string>> = PICKS

// =================================================================================================
// ⭐⭐⭐ v75 T5 – THE SECOND STOREY: A GLYPH PER LIFE **KIND**, OVER THE ROW-LEVEL MARK ABOVE
// =================================================================================================
//
// The T9 note above ends «Per-kind marks need either new `WorldEventType` members or a field on the
// row – a design call that is his»; T1 answered it the FIELD way (`WorldEvent.lifeKind?`) and this
// is the column that reads it. ⚠⚠ NOTHING ABOVE THIS LINE MOVED, AND THAT IS DELIBERATE RATHER THAN
// LAZY: `PICKS` is the owner's data, his 11.09 white heart is in it, and a T5 that re-shaped the
// record his pick lives in would be editing his answer while claiming to read it.
//
// ⚠⚠ TWO ROSTERS, ON PURPOSE, AND THEY ANSWER TWO DIFFERENT QUESTIONS. `LIFE_ROW_KINDS` is
// `WorldEventType`-shaped and asks «which feed rows are about her life» – it is what keeps the file
// honest against a `WorldEventType` rename, and collapsing it into this one would throw that guard
// away. `LIFE_BEAT_ROW_KINDS` is `LifeBeatKind`-shaped and asks the finer question `shared/protocol/
// events.ts` names in the `lifeKind` field's own comment: «WHICH life beat it was is a second, finer
// question». One roster could not carry both without one of the two `satisfies` clauses going.
//
// ⚠ IT IS THE NARROWER ROSTER OF THE FIVE `LifeBeatKind`s, and the field's own note says why a
// narrower one is honest HERE while it would not be on the wire: `'small-talk'` raises no feed row
// at all (§3c: the `lifeLog` row IS the record) and the two fork kinds write `'info'` answer rows,
// not `'life'` ones. Two kinds reach a `'life'` row today – `'met'` (wave 3's delivery) and
// `'ended'` (wave 4's, both registers) – and §5a's wedding joins them at step 6.

/** The life-beat kinds that can reach a `'life'` feed row, and therefore the kinds a glyph can be
 *  picked for. ⚠ `satisfies` KEEPS IT HONEST BOTH WAYS, exactly as the roster above: a kind renamed
 *  or dropped from `LifeBeatKind` fails the build on this line instead of rotting into a lookup that
 *  never hits, and a new kind that starts writing rows has to be added here to be markable. */
export const LIFE_BEAT_ROW_KINDS = ['met', 'ended'] as const satisfies readonly LifeBeatKind[]

export type LifeBeatRowKind = (typeof LIFE_BEAT_ROW_KINDS)[number]

/** ⚠ RE-CUT 12.09 – THE TOTALITY GATE GAVE WAY TO HIS OWN RULING, and the note records why rather
 *  than pretending the first shape never stood. As shipped this was «empty, or total – never
 *  half-filled» (`Record<string, never> | Record<LifeBeatRowKind, string>`, `LifeRowGlyphs`' own
 *  argument one storey up). Then he picked: ♡ for `'ended'` – and deliberately NOTHING for
 *  `'met'`, because T1 took no back-fill and a met pick repaints every historical life row in
 *  every save ever written (the consequence block above the reader). A subset IS the ruled state,
 *  so the compile gate now guards the half that is still law: every KEY must be a markable kind –
 *  a typo'd or off-roster key still fails `vue-tsc` – and the unpicked kinds are carried by the
 *  fallback, which the reader's own tests hold load-bearing. */
export type LifeBeatGlyphs = Partial<Record<LifeBeatRowKind, string>>

// ⚠⚠ THE OWNER'S PER-KIND PICKS GO HERE AND NOWHERE ELSE, AND IT SHIPS **EMPTY** – who-she-is §5a,
// «the set is his to pick, and no agent adds or swaps one unasked», which CLAUDE.md's invariant 4
// extends to marks because a mark on a row IS what the row says. T5 ships the COLUMN and hands him
// candidates with the wave's package; this record fills after his word and not before.
//
// ⚠⚠ AND «EMPTY» IS WHY EVERY ROW STILL WEARS HIS WHITE HEART TODAY RATHER THAN NOTHING. The reader
// below falls back to `LIFE_ROW_EMOJI.life` – his own 11.09 pick, read out of `PICKS` rather than
// copied – so an ending row draws exactly what it drew before this file grew a second storey. The
// fallback is the whole reason a per-kind column could be built without touching his data: a kind
// with no pick of its own is not unmarked, it is marked the way the life row has always been marked.
//
// ⚠ FILLING IT IS ONE LINE, as upstairs: `ended: '…',` inside this record, and nothing else anywhere.
//
// -------------------------------------------------------------------------------------------------
// ⭐ THE CANDIDATES T5 PUT TO HIM, RECORDED HERE SO THE REASONING IS BESIDE THE LINE HE WOULD EDIT.
// ⚠⚠ THESE ARE PROPOSALS AND NOT PICKS. They live in a COMMENT precisely because the record below is
// his; none of them is in force, and the day he rules, exactly one of them (or something else
// entirely) becomes one line inside the braces. Read in his own register for 🤍 – lowest possible
// volume, monochrome, gender-free, honest in every register the row has.
//
//   `'ended'`, first choice   🩶  the grey heart: his own mark one shade down, so the column reads as
//                                 one thread rather than two symbols – the same shape, gone quiet,
//                                 with none of 🖤's mourning or 💔's volume. ⚠ Unicode 15.0 (2022),
//                                 so an older phone may draw a box; that is the one thing to weigh.
//   `'ended'`, no-risk alt    ♡  the white heart SUIT (Unicode 1.1, renders everywhere): an outline
//                                 of the mark the arrival wears, the same thread emptied. ⚠ It is a
//                                 text glyph, so it draws thinner and narrower than the emoji beside
//                                 it – quieter still, and slightly out of family.
//   `'ended'`, leave it       🤍  do nothing: the fallback already puts his heart on both rows, and
//                                 an ending sits directly under the arrival it ends, so the thread
//                                 stays findable. Costs nothing and is a real answer.
//
//   `'met'`                   –   NOTHING PROPOSED. 🤍 is already the arrival's mark, so a pick here
//                                 would be re-picking what he picked. ⚠⚠ AND IT HAS A CONSEQUENCE
//                                 WORTH KNOWING BEFORE HE EVER DOES: T1 took no back-fill, so every
//                                 historical row resolves through the `?? 'met'` default – a `'met'`
//                                 glyph would therefore repaint every life row in every save ever
//                                 written, not only the new ones.
//
//   the wedding's 💍          –   NOT PROPOSED NOW. Step 6's, with the row it marks.
// -------------------------------------------------------------------------------------------------
// ⭐ HIS PICK, 12.09 («безрисковая альтернатива ♡ – хорошо»): the ENDING rows wear the text heart –
// the no-risk choice over 🩶, whose Unicode-15.0 box risk the proposal block above records. `'met'`
// stays unpicked on purpose: T1 took no back-fill, so a met glyph would repaint every historical
// life row in every save ever written – that consequence stays chosen-not-discovered, and 🤍
// remains the fallback the unpicked kinds wear.
const KIND_PICKS = { ended: '♡' } satisfies LifeBeatGlyphs

/** The per-kind column the feed reads. ⚠ TYPED OVER THE **WHOLE** `LifeBeatKind`, not over the
 *  narrow roster, and that is the reader/writer split the file already makes one storey up: a caller
 *  holds `WorldEvent.lifeKind`, which is any of the five, and a map that refused to be asked about
 *  `'small-talk'` would force a cast at the only call site. `KIND_PICKS` carries the gate for the
 *  WRITER over the narrow roster; this is the honest type for the READER. */
export const LIFE_BEAT_EMOJI: Partial<Record<LifeBeatKind, string>> = KIND_PICKS

/** ⭐⭐⭐ WHAT A `'life'` ROW WEARS – the one road, and the `?? 'met'` in it is T1's own promise kept.
 *
 *  ⚠⚠ AN UNSTAMPED ROW READS AS `'met'`, WHICH IS NOT A GUESS ABOUT WHAT IT WAS. T1 deliberately took
 *  no back-fill («stamping `'met'` onto the `'life'` rows an old save happens to hold would be
 *  re-deriving a fact from prose and calling the guess a record»), so no historical row carries a
 *  kind – and the DEFAULT here is what keeps that free: every row ever written before T5 resolves to
 *  the `'met'` cell, which is empty, which falls back to the white heart it already wore. The
 *  fallback is what makes the default harmless; a `'met'` pick landing one day is the moment to look
 *  at this line again, and the test file says so beside its arm. */
export function lifeRowGlyph(lifeKind: LifeBeatKind | undefined): string | undefined {
  return LIFE_BEAT_EMOJI[lifeKind ?? 'met'] ?? LIFE_ROW_EMOJI.life
}

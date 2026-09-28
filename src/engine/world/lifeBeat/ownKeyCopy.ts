// A-06 / T6.8 – `world/lifeBeat.ts` §3i MOVED HERE VERBATIM, span for span, comments and all.
//
// A beat kind is its own module (CLAUDE.md, the life-beat line). This is the OWN KEY's copy half – the
// week she lives behind her own door – and a pure leaf by the review's matrix: §3i referenced nothing
// at all. Two readers, both in the hub: the dispatcher (`lifeBeatSaid`, `lifeBeatHeading`) and §13's
// `deliverOwnKey`, which writes `OWN_KEY_ROW` into the feed. Hub -> here, never back, so this module
// imports nothing whatsoever.
//
// ⚠ §13, the independent life's HAZARD half, is still in the hub: it calls back into it
// (`lifeStageOf`, `lifeLogOf`, `pendingLifeBeat`, `liveSoftBeat`, `raiseLifeBeat`) and its three names
// reach `world.ts`, `world/phaseHerWeek.ts` and `world/snapshot.ts` through the hub's re-export, so
// the hub would both import it and be imported by it. «If both are true, it is not ready to move.»
// =================================================================================================
// 3i. `'own-key'` – THE WEEK SHE LIVES BEHIND HER OWN DOOR (wave 7: T10, backlog §8).
//     ⚠ ⚠ DRAFT – EVERY WORD BELOW IS THE BUILDER'S DRAFT FOR THE OWNER (invariant 4; T7's table).
// =================================================================================================
//
// ONE SCENE, TOLD ONCE, IN THE PARENT'S OWN NARRATION – deliberately NO quoted line of hers, and
// that absence is what keeps this a one-cell pool without breaking the voice law: the completeness
// rule («a `quiet` girl can never silently receive a `fiery` girl's line») binds pools that QUOTE
// her, and this card quotes nobody. Giving the scene a voiced line of hers – four cells, two
// presences – is a wording decision the owner may take at T7's table; a draft that jumped ahead of
// it would be choosing for him.
//
// ⚠⚠ AND IF HE EVER TAKES IT, THE SHAPE IS **FOUR CELLS AND NO PRESENCE AXIS** – 26.09, ruling 19 on
// B-08, said here rather than left for the test to say. `'own-key'` fires on the week she lives behind
// her own door, which is past the age at which any stage is still `roof`: school is over by 18.92 for
// every girl the game can generate and `diaryLifeStageFor` sends everyone past 22 to `independent`,
// `college` being away as well. A `roof` column written here would be four lines the owner had read
// and no player could ever be shown – the exact defect ruling 19 removed from §3g, §3j and §3l. ⚠ IT
// IS ALSO ENFORCED: `tests/principles-b08-presence-reach.test.ts` §C measures which kinds read the
// stage and refuses a presence-keyed pool whose roof is unreachable, NAMING the kind – so a voiced
// `'own-key'` pool with two columns goes red there, and this paragraph is how the author connects
// that red to the banner that invited it.

/** ⚠ ⚠ DRAFT – the card's one line: what the week holds, seen from the family's side. */
export const OWN_KEY_SAID = 'She has a place of her own now. A spare key went onto the hook by our door, and Sunday dinner is a standing thing.'

/** ⚠ ⚠ DRAFT – the parent's frame over the card. ONE FRAME, KEYED ON NOTHING – the scene is the
 *  same scene at every distance and in every weather. */
export const OWN_KEY_HEADING = 'She lives behind her own door now'

/** ⚠ ⚠ DRAFT – the Home card's invitation, one short concrete line. */
export const OWN_KEY_CARD = 'She came by with a spare key.'

/** ⚠ ⚠ DRAFT – the kept feed row, written at the raise (`deliverKnownPartner`'s `keep: true`
 *  doctrine: the week she moved out is not a line the album may be missing). ⚠ NO cents, no
 *  mechanic, no address – backlog §8's own boundary. */
export const OWN_KEY_ROW = 'She has her own place now. A spare key lives on the hook, and Sunday dinner stands.'

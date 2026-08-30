// --- THE SHELF'S OWN PICTURES (round 30 #5) ------------------------------------------------------
//
// The owner asked for sub-tabs inside Bills and Shop, and with them: «Для каждой карточки будет свой
// арт, карточки лежат без общей подложки, примерно как на экране Season». So every card on those two
// chapters is allowed a picture of its own – a car, a boat, an aeroplane, the shelf of contracts.
//
// ⚠⚠ HE IS DRAWING IT, AND THIS FILE IS WHAT LETS THE LAYOUT SHIP BEFORE THE ART DOES. The contract
// is `vacationArtUrl`'s, verbatim and for the same reason it was written: «the package catalogue may
// grow before the art does», so this returns NULL for a key we have no painting for and the caller
// must handle that rather than render a 404. On this shelf the map is EMPTY today – not one card has
// a frame yet – which means every card draws artless, and drawing artless is a designed state and
// not a hole: the card is the same object with the same words, one band shorter. A missing picture
// must never cost the row.
//
// THE FILE NAMES WILL BE HIS, NOT THE IDS, exactly as `VACATION_ART` maps them: he paints and names
// by what is in the picture, the engine names by what the family buys (`car-nineteen`, `boat-sail`,
// `academy-courts`). Filling in a line below is the whole of taking delivery of a painting.
//
// ⚠ ONE NAMESPACE, TWO CHAPTERS, AND THE KEYS CANNOT COLLIDE. Shop rows are keyed by their engine id
// (`economy.ts`'s catalogue, 19 of them, all unique); the two Bills cards are keyed by the two
// spellings below, neither of which is an asset id. One map is worth having because it is one
// question – "is there a painting for this card?" – asked from three call sites.

const SHELF_DIR = 'images/shelf/'

/** The Bills chapter's two cards, keyed here rather than by an asset id because neither is an asset.
 *  Exported so a test can name them without spelling a string twice. */
export const BILLS_ART_KEYS = { kit: 'her-kit', ads: 'advs-portfolio' } as const

/** key -> the owner's own file stem, for the cards that have a painting. EMPTY UNTIL HIS ART LANDS,
 *  which is the state this whole module is designed around – see the header. */
const SHELF_ART: Record<string, string> = {}

/** The frame for a shelf card, or null when we have no painting for it – in which case the caller
 *  draws the card without one. Never a broken box, never a placeholder that pretends to be art. */
export function shelfArtUrl(key: string): string | null {
  const stem = SHELF_ART[key]
  return stem ? `${import.meta.env.BASE_URL}${SHELF_DIR}${stem}.webp` : null
}

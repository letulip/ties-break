// --- THE SHELF'S OWN PICTURES (round 30 #5, filled in round 35 #1) -------------------------------
//
// The owner asked for sub-tabs inside Bills and Shop, and with them: «Для каждой карточки будет свой
// арт, карточки лежат без общей подложки, примерно как на экране Season». So every card on those two
// chapters is allowed a picture of its own – a car, a boat, an aeroplane, the shelf of contracts.
//
// ⚠⚠ HE HAS DRAWN IT NOW (round 35 #1) AND THE CONTRACT DID NOT MOVE. The rule is
// `vacationArtUrl`'s, verbatim and for the same reason it was written: «the package catalogue may
// grow before the art does», so this returns NULL for a key we have no painting for and the caller
// must handle that rather than render a 404. TWENTY-FOUR of his paintings landed and the map below
// is no longer empty; what is still empty is real and stays that way – the two Bills cards, the two
// investment rungs and the merch brand have no frame, and those cards draw artless, which is a
// designed state and not a hole. A missing picture must never cost the row.
//
// THE FILE NAMES ARE HIS, NOT THE IDS, exactly as `VACATION_ART` maps them: he paints and names by
// what is in the picture and by its PRICE (`cars-60`, `property-1400`, `water-2400`), the engine
// names by what the family buys (`car-nineteen`, `boat-sail`, `academy-courts`). Every line below is
// one of those two vocabularies translated into the other, and the translation is the whole file.
//
// ⚠ TWO OF HIS STEMS ONCE DISAGREED WITH THE PRICE THEY ARE MAPPED TO, and BOTH were recorded
// rather than silently renamed – which is why both were his to settle and both now agree:
//   `cars-60`      – was `cars-90` when it arrived; HE renamed it («60к правильная – это наш дефолт,
//                    в нейминге я ошибся – поправь пожалуйста»), so this line and the file agree.
//   `property-590` – the rung it belongs to was priced at $520,000 from round 29 through round 35
//                    #7, which added two tiers and touched nothing else. ⭐ ROUND 35 #13 SETTLED IT
//                    IN THE STEM'S FAVOUR – «Дом пусть будет за 590к - ок» – so the price moved to
//                    $590,000 and the filename is now the price again. Nothing in this file changed
//                    for it; the discrepancy was always the catalogue's to resolve, and it did.
//
// ⚠ ONE NAMESPACE, THREE KINDS OF CARD, AND THE KEYS CANNOT COLLIDE. Shop rows are keyed by their
// engine id (`economy.ts`'s catalogue, 22 of them since round 35, all unique); the six CATEGORY
// tiles are keyed by the shelf tab's own value (`invest` … `air`), none of which is an asset id; the
// two Bills cards are keyed by the two spellings below, which are neither. One map is worth having
// because it is one question – "is there a painting for this card?" – asked from four call sites.

const IMAGES_DIR = 'images/'

/** The Bills chapter's two cards, keyed here rather than by an asset id because neither is an asset.
 *  Exported so a test can name them without spelling a string twice. */
export const BILLS_ART_KEYS = { kit: 'her-kit', ads: 'advs-portfolio' } as const

/** ⭐⭐ ROUND 35 #3 – THE SIX CATEGORY TILES, keyed by the shelf tab they open. They are the ONLY
 *  paintings on this shelf that are not square: 332x512, ratio 0.65, and the owner sized the layout
 *  off them rather than the other way round («давай на главной магазина вот эти 6 основых карточек
 *  сделаем не квадратными, как в макете, а высокими (смотри соотношение сторон картинок), на них как
 *  раз вниз хорошо надписи встанут»). `--shelf-cat-ratio` in style.css is that number; this list is
 *  exported so a test can hold the grid to exactly these six and to HIS order. */
export const SHELF_CATEGORY_KEYS = ['invest', 'business', 'property', 'cars', 'water', 'air'] as const
export type ShelfCategoryKey = (typeof SHELF_CATEGORY_KEYS)[number]

/** key -> the owner's own file path under `public/images/`, for every card that has a painting.
 *  A key that is absent here draws without a band – see the header. */
const SHELF_ART: Record<string, string> = {
  // the six category tiles (332x512)
  invest: 'shop/invest',
  business: 'shop/business',
  property: 'shop/property',
  cars: 'shop/cars',
  water: 'shop/water',
  air: 'shop/air',
  // the rungs themselves (512x512)
  'car-sensible': 'shop/cars-60',
  'car-good': 'shop/cars-110',
  'car-nineteen': 'shop/cars-190',
  'car-unreasonable': 'shop/cars-300',
  'house-first': 'shop/property-240',
  'house-garden': 'shop/property-590',
  'house-villa': 'shop/property-1400',
  'house-headland': 'shop/property-3000',
  'boat-launch': 'shop/water-900',
  'boat-sail': 'shop/water-2400',
  yacht: 'shop/water-12000',
  'yacht-big': 'shop/water-28000',
  'plane-small': 'shop/air-7',
  plane: 'shop/air-18',
  'academy-land': 'shop/business-academy-land',
  'academy-courts': 'shop/business-academy-courts',
  'academy-building': 'shop/business-academy-clubhouse',
  'academy-staff': 'shop/business-academy-staff',
}

/** The frame for a shelf card, or null when we have no painting for it – in which case the caller
 *  draws the card without one. Never a broken box, never a placeholder that pretends to be art. */
export function shelfArtUrl(key: string): string | null {
  const stem = SHELF_ART[key]
  return stem ? `${import.meta.env.BASE_URL}${IMAGES_DIR}${stem}.webp` : null
}

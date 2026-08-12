// Shared display helpers usable from both the engine and the UI (no runtime deps).

/** "First Last" -> "F. Last". A name with no space is returned unchanged.
 *  Used for EVERYONE in standings and news match texts (cohort names are "First Last";
 *  the kid's full name is `kidName + ' ' + kidLastName`). */
export function formatShortName(fullName: string): string {
  const trimmed = fullName.trim()
  const sp = trimmed.indexOf(' ')
  if (sp === -1) return trimmed
  const first = trimmed.slice(0, sp)
  const last = trimmed.slice(sp + 1).trim()
  if (!last) return first
  return `${first.charAt(0)}. ${last}`
}

/** The kid's rank for display: 'Unranked' until she's earned a counting result, else '#N'.
 *  A point-less kid dense-ranks near the TOP only because ties at 0 collapse — she isn't really
 *  ranked yet, so the headline rank reads 'Unranked' rather than a misleading '#1'. */
export function rankLabel(kidRank: number, hasResults: boolean): string {
  return hasResults ? `#${kidRank}` : 'Unranked'
}

/**
 * A TIER'S NAME WITH ITS GENERIC NOUN DROPPED: "Regional Championship" -> "Regional".
 *
 * The owner, R17 #9, looking at the match header: «слово Championship можно убрать из хедера».
 *
 * ⚠ FOR ONE LINE, AND HE SAID SO EXPLICITLY. Everywhere else the tournament keeps its whole name -
 * the brief's hero, the pre-match card, the box score, the poster, the letters and the season feed
 * all still read "Regional Championship". The header while a MATCH is on screen is the one place
 * that is short of room (see docs/specs/round17-match-screen.md §3), and it is also the one place
 * the noun carries nothing: the reader is already inside the tournament.
 *
 * ⚠ AN EXPLICIT LIST OF THREE, NOT "DROP THE LAST WORD". Three labels in the whole ladder are
 * "adjective + generic noun" - Local Open, Regional Championship, National Series - and they are
 * exactly the three whose first word already names the rung. Every other label ends in something
 * load-bearing: `Junior Tour 30` and `World Tour 100` end in the NUMBER that is the rung, and
 * `Grand Slam` would become "Grand". A last-word rule would have broken all three families to fix
 * one, which is the difference between a formatter and a guess.
 *
 * Total: a label whose last word is not in the list comes back untouched, and so does one that is
 * nothing BUT a generic noun.
 */
const GENERIC_TIER_NOUNS: readonly string[] = ['Open', 'Championship', 'Series']

export function shortTierLabel(label: string): string {
  const trimmed = label.trim()
  const sp = trimmed.lastIndexOf(' ')
  if (sp <= 0) return trimmed
  const last = trimmed.slice(sp + 1)
  return GENERIC_TIER_NOUNS.includes(last) ? trimmed.slice(0, sp) : trimmed
}

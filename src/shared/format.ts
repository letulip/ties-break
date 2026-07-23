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

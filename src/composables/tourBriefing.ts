// ⭐ ROUND-18 #8 – WHERE "HE HAS READ THE BRIEFING" IS RECORDED, and why it is not in the save.
//
// The tour's commitment rules bind by rank and have been enforced since v38 (engine/world/mandatory.
// ts, W3-ACT2 §6). `snapshot.tourBriefing` says whether they apply to her; this file says whether
// anybody has been TOLD, which is a different question with a different owner.
//
// ⚠⚠ IT IS A QUESTION ABOUT A DEVICE, NOT ABOUT A CAREER, and that is the whole argument for keeping
// it out of the save. Persisting an acknowledgement would be a three-part schema move under CLAUDE.md
// invariant 3 – bump `SAVE_SCHEMA_VERSION`, an append-only migration, a golden fixture – to record
// something no simulation ever reads, that changes no outcome, and that a `localStorage` key already
// answers. The engine would carry a field about a popup. So it is a watermark, exactly like the news
// feed's, the This-week dot's, the trophy cabinet's and the injury report's.
//
// ⚠ PER CAREER, because careers advance independently and a global key would collide the moment a
// player has two – the R9-21b lesson, recorded in App.vue where it was learned.
//
// ⚠ WHAT IT COSTS, STATED HONESTLY: a save carried to a second device is briefed again there, once.
// That is the same trade every watermark in this app already makes, and the failure modes are not
// symmetric – a second reading costs a tap, and never reading it is the item.
//
// ⚠ AN ABSENT KEY MEANS UNBRIEFED. The opposite default to `storedTrophyWatermark`, deliberately: a
// dot that cannot know whether the cabinet was opened must not claim it was, but a briefing that
// cannot know whether the rules were ever explained must assume they were not. Every existing save
// that already binds – the owner's own has been inside the top 50 for seasons – therefore gets the
// briefing once on its next launch, which is the fix reaching the career that reported the problem.
//
// ⚠ THE READ AND THE WRITE ARE `useWatermark`'s NOW (composables/inboxCue.ts), NOT THIS FILE'S AND
// NOT THE DIALOG'S. They were hand-rolled in TourBriefingDialog.vue – a `getItem` at setup, a
// `setItem` in `acknowledge`, and a `watch` on `careerId` to re-read – which is character for
// character what the news feed, the letterbox and the trophy cabinet already had one copy of. The
// paragraph above is exactly the helper's `absent` parameter, so what was a fifth transcription of
// the rule is now the rule stated once and PASSED IN. Nothing here changes: same key, same "an
// absent key means unbriefed", same per-career scope.

/** The namespace half of the key; `useWatermark` appends the career. It stays named here, beside the
 *  argument for it, so the component that writes it and anything that ever reads it cannot disagree
 *  about which string a briefing is recorded under. */
export const TOUR_BRIEFED_PREFIX = 'tb:tourBriefed'

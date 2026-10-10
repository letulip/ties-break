// THE GRACEFUL-ABSENCE LEDGER – L4-1 (10.10). One list, two readers – and EMPTY since the files landed.
//
// The stylesheet DECLARES two Cyrillic subset faces (`src/style.css`, the L4-1 block) that were wired before their files existed. For
// that interval a declared face with no file was the SHIPPED state, not a defect: a Russian session asked, got a 404 and fell through
// the family stack to the system face. This list named the faces in that state.
//
// Every guard that asks «does each declared font file exist» reads THIS list for its exceptions, and
// tests/i18n-l4-1-fonts.test.ts makes the list shrink: an entry whose file has landed fails there until it is deleted here. So the
// exception can never outlive the absence it documents, and no guard has a private copy of it to forget.
//
// ⭐ 10.10: THE FILES LANDED – both entries deleted, by the protocol above (the unit net went red on the landing and named the fix).
// The owner authorised the faces the app already ships – Manrope and Caveat, no new family, no stress mark (U+0301 is in neither
// file). public/fonts/manrope-cyr.woff2 and caveat-cyr.woff2 were cut from the OFL sources by the commands in
// docs/specs/ru-typography-2026-09.md §T3 (the landing note there records the run), `npm run fonts:probe -- --require-cyrillic` reads
// both as FULL, public/fonts/README.md names them, and scripts/install-size.mjs re-measured the install. The list stays, EMPTY, because
// the mechanism is the point: a face declared before its file is generated goes on this list in the commit that declares it.
export const GRACEFUL_ABSENT_FONTS: readonly string[] = []

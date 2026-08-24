// WHAT A GIFT IS, AND THE ONE SPELLING OF "the day together" – docs/specs/birthday-and-gifts.md
//
// ⚠⚠ A LEAF WITH NO IMPORTS, AND THAT IS THE WHOLE DESIGN OF THIS FILE. These two came back from
// `shared/protocol` in R2-09 step 1 (TOK-04 §1): they NEVER CROSSED THE WORKER/UI BOUNDARY, since
// the wire carries `BirthdayOption` rows (id, label, note) and nothing else – the client is never
// told which row answers the ask. A catalogue shape is a fact about the ENGINE, so every protocol
// reader was paying for it on every open.
//
// ⚠ BUT THEY COULD NOT SIMPLY GO INTO `world/birthday.ts`, AND THE CYCLE TEST IS WHY. TWO modules
// read `BIRTHDAY_DAY_NOUN`: the catalogue that sets `DAY_TOGETHER.short` to it, and
// `diary/weekNotes.ts`, whose licences compare against it. `world/birthday.ts` already reaches
// `diary/weekNotes.ts` at runtime (measured: it is in its 61-module import closure), so a value
// import pointing back would have closed a real runtime cycle – the exact failure
// `tests/import-cycles.test.ts` exists to make impossible. A leaf both sides import is the
// dependency inversion CLAUDE.md asks for instead, and a file with no imports cannot be in a cycle
// at all.
//
// ⚠ THE SEAM IS THE POINT, not the constant. The diary has to tell the day apart from a thing – "we
// gave her the day" is a different sentence from "she got the camera" – and it owns no catalogue,
// so it cannot ask the gift what it is. A bare literal on each side would fail SILENTLY on any
// rewording: the day's arm would stop being licensed and a present arm would take the week with a
// sentence about a thing nobody gave her.

/** One gift in the catalogue. Content, and the ENGINE owns every word of it (engine/world/
 *  birthday.ts) – the dialog prints what it is handed, exactly as KnockDialog does.
 *
 *  ⚠ THERE IS NO PRICE FIELD, AND ITS ABSENCE IS THE RULING. The owner, 11.08: «про цену момент,
 *  давай не будем это учитывать в нашем кошельке вообще.» No charge, no Money line, no corridor
 *  pricing and NO PRICE SHOWN. Adding a cents field here is a schema change and a ship-rule failure,
 *  which is exactly the friction the ruling wants: with no price the four options differ only in
 *  WHAT THEY ARE, and the choice stays "what do I think she wants". */
export interface BirthdayGift {
  id: string
  /** the button's own words.
   *
   *  ⚠ IT NAMES A THING, NOT A WANT – round-18 #10a. Three labels used to lead with a placeholder
   *  noun ("The thing she would never buy herself", "Something that is not tennis", "Something for a
   *  home that is not ours") and the ask for each was the same sentence turned round, so the reading
   *  game the scene is built on had nothing to read. The owner: «странные сообщения … с очень явными
   *  странными же ответами». `tests/birthday-ask.test.ts` rule 1 refuses a placeholder head. */
  label: string
  /** the line under it – what it is, in the parent's voice */
  note: string
  /** ⭐ THE NOTE WHEN SHE ALREADY HAS ONE – round-18 #10c, and it replaces `note` on that row rather
   *  than being appended to it. The owner asked twice about buying a new car every year, and the
   *  second time he answered himself: «хотя почему и нет, с другой стороны, но если так, то надо
   *  как-то обыграть». So a repeat is allowed and the game says it out loud – warmly for something
   *  she can want again (`repeatable`), plainly for something already in the house (`durable`). */
  again: string
  /** ⭐ CAN SHE WANT THIS TWICE? A week at home is a tradition; a car is a possession. The two need
   *  DIFFERENT words on a second offer, which is the whole of what `again` is for. */
  repeat: 'durable' | 'repeatable'
  /** the prose line at the top of the dialog when THIS is the thing she has been asking for.
   *
   *  ⚠ IT IS A CLUE AND NOT A RESTATEMENT (round-18 #10a). It must share a word with its own row that
   *  no OTHER row of the same band shares – otherwise two options answer it – and it must not simply
   *  say the label again, which is what made "she has the money for it and will not buy it" answered
   *  by "The thing she would never buy herself" a scene with nothing in it. */
  ask: string
  /** the diary's noun for it – "the headphones" – so a callback three seasons later reads as English */
  short: string
}

/** ⚠ THE DIARY'S NOUN FOR "just the day together", AND THE ONE SPELLING OF IT.
 *
 *  The diary has to tell the day apart from a thing – "we gave her the day" is a different sentence
 *  from "she got the camera" – and it owns no catalogue, so it cannot ask the gift what it is. This
 *  is the seam: the catalogue sets `DAY_TOGETHER.short` to it and the note licences compare against
 *  it, so the two cannot drift into a state where the day silently reads as an object. A bare literal
 *  on each side would fail SILENTLY on any rewording – the day's arm would stop being licensed and a
 *  present arm would take the week with a sentence about a thing nobody gave her. */
export const BIRTHDAY_DAY_NOUN = 'the day together'

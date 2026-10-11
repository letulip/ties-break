// THE RU ARM'S LEDGER – the engine words a mounted surface still prints raw under ru.json although the display boundary can read them (tests/component/ruVocabulary.ts, xxCarpet.ts).
// Held both ways like `xxFindings.ts`: a word that appears here and is not printed any more is red (delete the row), and a new one is red (wrap the print or name it with its reason).
export interface RuRaw {
  area: string
  surface: string
  word: string
  reason: string
}

export const RU_RAW: readonly RuRaw[] = [
  {
    area: 'cards',
    surface: 'WeekSpanReport',
    word: 'Court hire',
    reason: 'the pose hands the report two plain-English ledger rows with no CopyRef (`row(…, \'Court hire\', …)` in the carpet file) – the real court row is `{0} – {1} h, {2}`, a ref, and its venue goes through the court reader (tests/i18n-display-words.test.ts renders it)',
  },
]

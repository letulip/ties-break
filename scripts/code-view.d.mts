// Types for scripts/code-view.mjs (H-04 O1). The script stays plain ESM JS so
// `npm run code:view -- <file>` works on any Node without a TS loader; tests/code-view.test.ts
// imports it, so it needs a declaration.

/** What one line of a file is, for the purpose of hiding it. */
export type LineKind = 'comment' | 'code' | 'blank'

export interface CodeViewStats {
  /** The file's own line count. */
  total: number
  /** Comment blocks found. */
  blocks: number
  /** `[N lines: L-M]` markers emitted – more than one per block when a kept line splits a run. */
  collapsed: number
  /** Comment lines hidden behind those markers. */
  hidden: number
  /** Lines held whole INSIDE a block by the keep rule (a block's first line is not counted here). */
  kept: number
}

export interface CodeViewResult {
  /** The view, one string per printed line, each already carrying its gutter. */
  lines: string[]
  stats: CodeViewStats
}

/** ⚠⚠, a «» quote, or any Cyrillic letter: the three marks that are never collapsed. */
export declare const KEEP: RegExp

export declare function classifyLines(lines: string[]): LineKind[]

export declare function codeView(text: string): CodeViewResult

export declare function summarise(stats: CodeViewStats, printed: number): string

// THE FEEDBACK CHANNEL, BELOW THE GLASS – what a report holds and how it leaves the device (F1;
// docs/specs/feedback-channel-2026-09.md owns the rulings, this file is their code). F2 builds the
// control and the dialog on top of it and owns the strings table.
//
// A report is three things: the build line, the tail of the error ring (src/errorBuffer.ts) and the
// ACTIVE career's export file. One adapter, `shareReport()`, sends it through the first of three
// backends that the device can do, in this order:
//   (a) the Web Share API with the file – Android Chrome, iOS Safari 15+ (browser, PWA, TWA);
//   (b) the shell's bridge slot – a WKWebView has no `navigator.share`, so an app shell injects its
//       own share plugin here (docs/specs/app-shells-2026-10.md §S3 owns the injection, this file
//       owns the slot);
//   (c) the fallback – download the file and open a prefilled `mailto:`.
//
// ⚠ NO NETWORK AND NO STORAGE, BY CONSTRUCTION. Nothing here calls fetch, XHR or sendBeacon and
// nothing writes anywhere: a report leaves the device only through a sheet or a mail composer the
// PLAYER then completes. tests/feedback-f1.test.ts spies on every network door across all three
// backends. ⚠ NOT ENGINE EITHER – app-side like pwa.ts; no line here imports src/engine (the test
// reads the import list), and the build line is reused from the composable the Settings footer
// prints, not re-derived.
//
// ⚠ THE EXPORT IS THE SAVES STRIP'S OWN BYTES. `game.exportSave()` (src/stores/game.ts) sends the
// worker `{ type: 'exportSave' }` and downloads what comes back; the worker's `encodeExportFile` is
// the ONE encoder, and this file asks the same question and wraps the same bytes in a File. Nothing
// here encodes. The store cannot be called for it – it DOWNLOADS inside `runOp` and returns nothing –
// which is also why `downloadFile` below is a five-line TWIN of the store's, not an import: making
// them one function is a store edit, outside F1.
//
// ⚠ AN iOS SAFARI GESTURE WARNING FOR F2. `navigator.share` must run inside the tap's user
// activation, and `assembleReport()` is a worker round trip. Safari is the strictest about that gap,
// so `shareReport` takes an optional PREPARED report: F2 can assemble when its dialog opens and hand
// the result to the button, leaving no `await` between the tap and the share call.
//
// ⚠ AND A PLATFORM RISK THAT IS NOT THIS FILE'S TO FIX, NOTED WHERE IT WILL BE FOUND. Chrome only
// lets a fixed list of file types through `canShare` (audio, image, pdf, video, text – see
// https://web.dev/articles/web-share), and a `.tsave` typed `application/octet-stream` is probably
// not on it. Then (a) is skipped on Chrome and the player lands on (c) – graceful, and still works,
// but not the two-tap path the spec promises for Android. UNVERIFIED on a device. The remedy is one
// decision about the shared file's type/name (`SAVE_FILE_TYPE` below), and it is the owner's.

import { appBuildLine } from './composables/buildInfo'
import { errorTail, type ErrorEntry } from './errorBuffer'
import { request } from './worker/client'

/** Where reports go. Ruled 30.09 (the brAke spelling was his typo); provisional until the domain
 *  registers. The one home – nothing else in the app spells it. */
export const FEEDBACK_ADDRESS = 'feedback@ties-break.com'

// ── DRAFT SENTENCES (F2 puts each one in the strings table with its roundtrip pin) ────────────
// ⚠ Every user-visible sentence this module can produce is a constant below, one home apiece, so
// the table can find them. All of them are DRAFT until his strings pass: written here because the
// adapter has to say SOMETHING, not because the wording is settled.

/** The share sheet's title and the email's subject. DRAFT. */
export const REPORT_SUBJECT = 'Ties Break feedback'
/** The fallback's first body line: `mailto:` cannot attach a file, so the player must. DRAFT. */
export const REPORT_ATTACH_LINE = 'Please attach the save file that was just downloaded before sending this email.'
/** In the report text when there is no save to attach. DRAFT. */
export const REPORT_NO_CAREER_LINE = 'No save is attached: no career is open, or it could not be read.'
/** The tail's heading when the ring holds something. DRAFT. */
export const REPORT_TAIL_HEADING = 'Recent errors, newest first:'
/** The tail's only line when the ring is empty. DRAFT. */
export const REPORT_NO_ERRORS_LINE = 'No errors were recorded in this session.'
/** Closes an email body that had to be cut to fit `mailto:`. DRAFT. */
export const REPORT_TRUNCATED_LINE = '[The rest was cut to fit an email link.]'

/** `mailto:` bodies are safe to about 2 KB. This bounds the ENCODED body, so the whole link – address,
 *  subject and the rest – stays under that with room to spare. */
export const MAILTO_BODY_MAX = 1800

/** The type the Saves strip gives its Blob (game.exportSave) – same file, same type. See the header
 *  for why this is the one line the owner may want to change. */
const SAVE_FILE_TYPE = 'application/octet-stream'

export interface Report {
  /** The build line, a no-save note when there is none, and the error tail, one line per entry. */
  text: string
  /** The ACTIVE career's export, or null when there is no career (or it could not be read). */
  file: File | null
}

/** What `shareReport` did. `shared`: a sheet or the shell took it. `fallback`: the file was downloaded
 *  and the mail composer opened. `nothing`: the player dismissed the share sheet – nothing was sent
 *  and nothing was downloaded, and F2 should stay quiet. */
export type ShareOutcome = 'shared' | 'fallback' | 'nothing'

/** THE SHELLS' ONE INJECTION POINT (app-shells spec §S3). Resolve `true` when the shell took the
 *  report – a player who then CANCELS the shell's sheet counts, or he would be handed a download he
 *  just declined. Resolve `false` (or throw) only when the shell has no way to send it: the fallback
 *  then runs. */
export type ReportBridge = (report: Report) => Promise<boolean>

export let reportBridge: ReportBridge | null = null

export function setReportBridge(bridge: ReportBridge | null): void {
  reportBridge = bridge
}

/** The active career's export, exactly as the Saves strip gets it – or null. `!res.ok` is the
 *  worker's "No active career"; the catch is a worker that crashed or timed out. Either way the
 *  report is still worth sending: an error tail with no save is what a boot failure looks like. */
async function activeCareerFile(): Promise<File | null> {
  try {
    const res = await request({ type: 'exportSave' })
    if (!res.ok) return null
    return new File([res.bytes], res.filename, { type: SAVE_FILE_TYPE })
  } catch {
    return null
  }
}

function formatEntry(e: ErrorEntry): string {
  // A multi-line message would break the one-row-per-entry shape the report promises.
  const head = `${e.at} ${e.kind}: ${e.message.replace(/\s*[\r\n]+\s*/g, ' ')}`
  return e.stack === undefined ? head : `${head} | ${e.stack.split('\n').join(' | ')}`
}

/** Build the report: build line + tail (newest first, so a cut drops the OLDEST rows) + the file. */
export async function assembleReport(): Promise<Report> {
  const file = await activeCareerFile()
  const tail = errorTail().reverse()
  const lines: string[] = [appBuildLine()]
  if (file === null) lines.push(REPORT_NO_CAREER_LINE)
  lines.push('')
  if (tail.length === 0) lines.push(REPORT_NO_ERRORS_LINE)
  else lines.push(REPORT_TAIL_HEADING, ...tail.map(formatEntry))
  return { text: lines.join('\n'), file }
}

/** Replace any lone surrogate with U+FFFD. `encodeURIComponent` THROWS on one (URIError), and a cut
 *  in the middle of an emoji – ours or a capped message's – would otherwise take the whole report
 *  down. A loop, not a lookbehind regex: an older Safari fails the WHOLE MODULE on that syntax. */
function wellFormed(s: string): string {
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (c >= 0xd800 && c <= 0xdbff) {
      const d = s.charCodeAt(i + 1)
      if (d >= 0xdc00 && d <= 0xdfff) {
        out += s.charAt(i) + s.charAt(i + 1)
        i++
      } else {
        out += '�'
      }
    } else if (c >= 0xdc00 && c <= 0xdfff) {
      out += '�'
    } else {
      out += s.charAt(i)
    }
  }
  return out
}

const enc = (s: string): string => encodeURIComponent(wellFormed(s))

/** The encoded body, at most `MAILTO_BODY_MAX` characters. Lines are CRLF (RFC 6068 – some Outlooks
 *  flatten a bare LF); a body that does not fit is cut from the END and closed by the truncation
 *  line, and because the tail is newest-first what is lost is the oldest. Binary search: the encoded
 *  length never shrinks as the prefix grows, and the text can run to some KB. */
function fitBody(raw: string): string {
  const crlf = raw.replace(/\n/g, '\r\n')
  const whole = enc(crlf)
  if (whole.length <= MAILTO_BODY_MAX) return whole
  const mark = enc(`\r\n${REPORT_TRUNCATED_LINE}`)
  let lo = 0
  let hi = crlf.length
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (enc(crlf.slice(0, mid)).length + mark.length <= MAILTO_BODY_MAX) lo = mid
    else hi = mid - 1
  }
  return enc(crlf.slice(0, lo)) + mark
}

/** The store's own five lines (game.exportSave), on a File instead of a fresh Blob. A TWIN, not an
 *  import – see the header. */
function downloadFile(file: File): void {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  URL.revokeObjectURL(url)
}

function openMailto(report: Report): void {
  const raw = (report.file !== null ? `${REPORT_ATTACH_LINE}\n\n` : '') + report.text
  const a = document.createElement('a')
  a.href = `mailto:${FEEDBACK_ADDRESS}?subject=${enc(REPORT_SUBJECT)}&body=${fitBody(raw)}`
  a.click()
}

function isAbort(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { name?: unknown }).name === 'AbortError'
}

/** Send the report through the first backend the device can do (see the header for the order).
 *  `prepared` is F2's way to avoid an `await` between the tap and `navigator.share` – omit it and
 *  the report is assembled here. Never rejects: a share that fails for any reason but the player's
 *  own dismissal falls through to the next backend. */
export async function shareReport(prepared?: Report): Promise<ShareOutcome> {
  const report = prepared ?? (await assembleReport())

  // (a) Web Share with the file. No file, no files-share: a no-career report goes to (b) or (c).
  const file = report.file
  if (
    file !== null &&
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    navigator.canShare?.({ files: [file] }) === true
  ) {
    try {
      await navigator.share({ files: [file], text: report.text, title: REPORT_SUBJECT })
      return 'shared'
    } catch (err) {
      if (isAbort(err)) return 'nothing'
      // Any other refusal (no activation, a type or size the platform will not take): keep going.
    }
  }

  // (b) The shell's bridge – BEFORE the fallback, so a wrapper never lands on a download.
  if (reportBridge !== null) {
    try {
      if (await reportBridge(report)) return 'shared'
    } catch {
      // The shell failed to send; the player still gets (c).
    }
  }

  // (c) Download the file (when there is one) and open the composer. `mailto:` cannot attach.
  if (report.file !== null) downloadFile(report.file)
  openMailto(report)
  return 'fallback'
}

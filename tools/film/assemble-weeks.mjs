// Cut the WEEKS recording into one segment per week SHAPE, plus fill, then the logo card, and lay
// the theme over it from frame zero.
//
// Inputs  : <dir>/*.webm (828x1792, from record-weeks.mjs) + log.json with per-sweep timestamps
// Output  : 828x1792 mp4, ~36s, h264/aac, +faststart.
//
// ⚠ NO SCALING. The source is already 828x1792 – a true 2x of the 414x896 phone layout, straight off
// the compositor. An earlier cut upscaled 540->1080 with lanczos and looked soft; here every pixel
// is native, so the filter chain only sets fps and pixel format.
//
// ⚠ THE LOGO CARD IS LAST, and it is the app's own splash filmed on load. It ANIMATES – verified
// frame by frame: at 0.6s only "Ties Break" has painted and "Ace Parent" is still easing in at 1.2s –
// so the card enters at 0.25s to buy the whole reveal rather than a frozen frame.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const DIR = process.argv[2] || '/tmp/film7'
const OUT = process.argv[3] || '/tmp/ties-break-weeks.mp4'
const MUSIC = process.argv[4] || 'public/music/theme.mp3'
const MAX = 38
const CARD = 3.4

const log = JSON.parse(fs.readFileSync(path.join(DIR, 'log.json'), 'utf8'))
const src = fs.readdirSync(DIR).find((f) => f.endsWith('.webm'))
if (!src) throw new Error('no recording in ' + DIR)
const VIDEO = path.join(DIR, src)
const ff = (a) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...a], { stdio: 'inherit' })

const sweeps = log.filter((e) => e.what === 'sweep')
if (!sweeps.length) throw new Error('no sweeps in the log — the walk filmed nothing')

// ⚠ ROUND-ROBIN, NOT CHRONOLOGICAL. The walk yields ~36 training weeks against 9 school-break, 2
// exam and 1 holiday, so filling in recording order spends the whole budget on identical training
// weeks after the opening four. One of each shape per pass keeps the back half as varied as the
// front, which is the entire point of the clip.
const groups = new Map()
for (const s of sweeps) {
  if (!groups.has(s.kind)) groups.set(s.kind, [])
  groups.get(s.kind).push(s)
}
const byKind = new Map([...groups].map(([k, v]) => [k, v[0]]))
const ordered = []
for (let pass = 0; ordered.length < sweeps.length; pass++) {
  let added = false
  for (const list of groups.values()) {
    if (list[pass]) {
      ordered.push(list[pass])
      added = true
    }
  }
  if (!added) break
}

const segs = ordered.map((s) => ({
  label: s.kind,
  start: Number(s.t) + 0.15,
  dur: Math.min(3.6, Number(s.end) - Number(s.t)),
}))

// trim the fill to fit, but never drop a SHAPE: the first `byKind.size` segments are the point
let total = segs.reduce((a, s) => a + s.dur, 0) + CARD
while (total > MAX && segs.length > byKind.size) total -= segs.pop().dur

const splash = log.find((e) => e.what === 'splash')
if (!splash) throw new Error('no splash in the log — nothing to close on')
segs.push({ label: 'logo', start: 0.25, dur: CARD, card: true })
console.log('segments:', segs.map((s) => `${s.label} ${s.dur.toFixed(1)}s`).join(' | '), `= ${total.toFixed(1)}s`)

const parts = []
segs.forEach((s, i) => {
  const out = path.join(DIR, `w${String(i).padStart(2, '0')}.mp4`)
  const vf = s.card
    ? `fps=30,format=yuv420p,fade=t=in:st=0:d=0.3,fade=t=out:st=${(s.dur - 0.9).toFixed(2)}:d=0.9`
    : 'fps=30,format=yuv420p'
  ff(['-ss', String(s.start), '-t', String(s.dur), '-i', VIDEO,
    '-vf', vf, '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', out])
  parts.push(out)
})

const listFile = path.join(DIR, 'concat-weeks.txt')
fs.writeFileSync(listFile, parts.map((p) => `file '${p}'`).join('\n'))
const silent = path.join(DIR, 'silent-weeks.mp4')
ff(['-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', silent])

const fadeOut = Math.max(0, total - 2.0)
ff(['-i', silent, '-i', MUSIC,
  '-filter_complex', `[1:a]atrim=0:${total},afade=t=in:st=0:d=0.15,afade=t=out:st=${fadeOut}:d=2.0,volume=0.85[a]`,
  '-map', '0:v', '-map', '[a]',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', OUT])

console.log(`\n${OUT}  ${(fs.statSync(OUT).size / 1024 / 1024).toFixed(1)} MB  ${total.toFixed(1)}s  828x1792`)

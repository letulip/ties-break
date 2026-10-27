// Cut the skills recording into one segment per talent setup, then the logo card, and lay the theme
// over it from frame zero. Same tail and same track as the weeks film, by request.
//
// ⚠ NO SCALING ANYWHERE. The source is already 828x1792 – a native 2x of the 414x896 phone layout –
// so the filter chain only sets fps and pixel format. Boundaries come from the rig's own __filmMarks,
// not from guesswork.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const DIR = process.argv[2] || '/tmp/skillfilm'
const OUT = process.argv[3] || '/tmp/ties-break-talent.mp4'
const MUSIC = process.argv[4] || 'public/music/theme.mp3'
const CARD = 3.4

const log = JSON.parse(fs.readFileSync(path.join(DIR, 'log.json'), 'utf8'))
const src = fs.readdirSync(DIR).find((f) => f.endsWith('.webm'))
if (!src) throw new Error('no recording in ' + DIR)
const VIDEO = path.join(DIR, src)
const ff = (a) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...a], { stdio: 'inherit' })

const tiers = log.filter((e) => e.what === 'tier').sort((a, b) => a.index - b.index)
if (!tiers.length) throw new Error('no tier marks in the log')
const segs = tiers.map((t) => ({ label: t.tier, start: Number(t.t), dur: Number(t.end) - Number(t.t) }))

const splash = log.find((e) => e.what === 'splash')
if (!splash) throw new Error('no splash in the log — nothing to close on')
segs.push({ label: 'logo', start: Number(splash.t) + 0.25, dur: CARD, card: true })

const total = segs.reduce((a, s) => a + s.dur, 0)
console.log('segments:', segs.map((s) => `${s.label} ${s.dur.toFixed(1)}s`).join(' | '), `= ${total.toFixed(1)}s`)

const parts = []
segs.forEach((s, i) => {
  const out = path.join(DIR, `s${String(i).padStart(2, '0')}.mp4`)
  const vf = s.card
    ? `fps=30,format=yuv420p,fade=t=in:st=0:d=0.3,fade=t=out:st=${(s.dur - 0.9).toFixed(2)}:d=0.9`
    : 'fps=30,format=yuv420p'
  ff(['-ss', String(s.start), '-t', String(s.dur), '-i', VIDEO,
    '-vf', vf, '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', out])
  parts.push(out)
})

const listFile = path.join(DIR, 'concat.txt')
fs.writeFileSync(listFile, parts.map((p) => `file '${p}'`).join('\n'))
const silent = path.join(DIR, 'silent.mp4')
ff(['-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', silent])

// music from frame one – only a 0.15s ramp to kill the click of starting mid-sample
const fadeOut = Math.max(0, total - 2.0)
ff(['-i', silent, '-i', MUSIC,
  '-filter_complex', `[1:a]atrim=0:${total},afade=t=in:st=0:d=0.15,afade=t=out:st=${fadeOut}:d=2.0,volume=0.85[a]`,
  '-map', '0:v', '-map', '[a]',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', OUT])

console.log(`\n${OUT}  ${(fs.statSync(OUT).size / 1024 / 1024).toFixed(1)} MB  ${total.toFixed(1)}s  828x1792`)

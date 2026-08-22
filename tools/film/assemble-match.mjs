// Cut the live-match recording and REBUILD ITS SOUNDTRACK.
//
// ⚠ THE VIDEO HAS NO AUDIO TRACK. Playwright does not record one, so every sound here is mixed back
// in from `public/sounds/` using the timestamps the recorder captured off `HTMLMediaElement.play`.
// Each event is placed at the output time its own frame landed on, so the take-your-seats beat, the
// ball strikes and the applause all sit where the picture puts them.
//
// ⚠ THE APP'S OWN theme.mp3 IS DROPPED. audio/music.ts plays it in-page and this script lays the
// same track down itself; mixing both would double it.
//
// ⚠ THE MUSIC DUCKS ON THE "WATCH MATCH" CUT, not before - which is the whole point of the beat. In
// the app `duck()` silences the track outright; here it is taken to 0.22 instead, so it stays under
// the intro rather than disappearing, and it comes back up for the logo card.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const DIR = process.argv[2] || '/tmp/matchfilm'
const OUT = process.argv[3] || '/tmp/ties-break-match.mp4'
const MUSIC = process.argv[4] || 'public/music/theme.mp3'
const SOUNDS = 'public'
const CARD = 3.4
const DUCK = 0.22

const data = JSON.parse(fs.readFileSync(path.join(DIR, 'log.json'), 'utf8'))
const src = fs.readdirSync(DIR).find((f) => f.endsWith('.webm'))
if (!src) throw new Error('no recording in ' + DIR)
const VIDEO = path.join(DIR, src)
const ff = (a) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...a], { stdio: 'inherit' })
const at = (what) => {
  const m = data.marks.find((x) => x.what === what)
  if (!m) throw new Error('no mark: ' + what)
  return m.t
}

// --- segments, anchored on the marks --------------------------------------------------------------
const watch = at('watch')
const segs = [
  { label: 'tournament card', start: at('tournament') + 0.1, dur: Math.max(1, watch - at('tournament') - 0.3) },
  { label: '1x + intro', start: watch - 0.15, dur: at('speed2') - watch + 0.1 },
  { label: '2x + shout', start: at('speed2') + 0.05, dur: at('speed4') - at('speed2') - 0.1 },
  { label: '4x + shouts', start: at('speed4'), dur: Math.min(14, at('end') - at('speed4') - 2.6) },
]
segs.push({ label: 'logo', start: 0.25, dur: CARD, card: true })

let outAt = 0
for (const s of segs) {
  s.outStart = outAt
  outAt += s.dur
}
const total = outAt
console.log('segments:', segs.map((s) => `${s.label} ${s.dur.toFixed(1)}s`).join(' | '), `= ${total.toFixed(1)}s`)

// --- cut the picture --------------------------------------------------------------------------------
const parts = []
segs.forEach((s, i) => {
  const out = path.join(DIR, `m${String(i).padStart(2, '0')}.mp4`)
  const vf = s.card
    ? `fps=30,format=yuv420p,fade=t=in:st=0:d=0.3,fade=t=out:st=${(s.dur - 0.9).toFixed(2)}:d=0.9`
    : 'fps=30,format=yuv420p'
  ff(['-ss', String(s.start), '-t', String(s.dur), '-i', VIDEO, '-vf', vf, '-an',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', out])
  parts.push(out)
})
const listFile = path.join(DIR, 'concat-match.txt')
fs.writeFileSync(listFile, parts.map((p) => `file '${p}'`).join('\n'))
const silent = path.join(DIR, 'silent-match.mp4')
ff(['-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', silent])

// --- place every sound on the OUTPUT clock ---------------------------------------------------------
const videoTime = (e) => data.videoAt + (e.t - data.perfAt) / 1000
const cues = []
let dropped = 0
for (const e of data.sfx) {
  const file = (e.src.split('/').pop() || '').split('?')[0]
  if (!file || file === 'theme.mp3') continue // the app's own music - this script lays it down itself
  const rel = e.src.replace(/^https?:\/\/[^/]+\//, '')
  const local = path.join(SOUNDS, rel)
  if (!fs.existsSync(local)) { dropped++; continue }
  const t = videoTime(e)
  const seg = segs.find((s) => !s.card && t >= s.start && t < s.start + s.dur)
  if (!seg) continue
  cues.push({ local, out: seg.outStart + (t - seg.start), rate: Math.max(0.5, Math.min(4, e.rate || 1)) })
}
cues.sort((a, b) => a.out - b.out)
// No silent caps: say what was left out and why.
if (dropped) console.log(`  (${dropped} sfx skipped - file not found under ${SOUNDS}/)`)
console.log(`  mixing ${cues.length} sound cues onto the output clock`)

// --- the mix ------------------------------------------------------------------------------------------
const duckAt = segs[1].outStart // the "Watch match" cut
const upAt = segs[segs.length - 1].outStart // the logo card
const musicExpr = `if(lt(t,${duckAt.toFixed(2)}),1,if(lt(t,${(duckAt + 0.8).toFixed(2)}),1-${(1 - DUCK).toFixed(2)}*(t-${duckAt.toFixed(2)})/0.8,if(lt(t,${upAt.toFixed(2)}),${DUCK},${DUCK}+${(0.85 - DUCK).toFixed(2)}*min(1,(t-${upAt.toFixed(2)})/0.8))))`

const inputs = ['-i', silent, '-i', MUSIC]
for (const c of cues) inputs.push('-i', c.local)

const filters = [
  `[1:a]atrim=0:${total.toFixed(2)},volume='${musicExpr}':eval=frame,afade=t=in:st=0:d=0.15,afade=t=out:st=${(total - 1.6).toFixed(2)}:d=1.6[music]`,
]
const labels = ['[music]']
cues.forEach((c, i) => {
  const n = i + 2
  const tempo = c.rate !== 1 ? `atempo=${c.rate.toFixed(2)},` : ''
  filters.push(`[${n}:a]${tempo}adelay=${Math.round(c.out * 1000)}|${Math.round(c.out * 1000)},volume=1.0[s${i}]`)
  labels.push(`[s${i}]`)
})
filters.push(`${labels.join('')}amix=inputs=${labels.length}:normalize=0:duration=first[mixed]`)

ff([...inputs, '-filter_complex', filters.join(';'),
  '-map', '0:v', '-map', '[mixed]',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', OUT])

console.log(`\n${OUT}  ${(fs.statSync(OUT).size / 1024 / 1024).toFixed(1)} MB  ${total.toFixed(1)}s  828x1792`)

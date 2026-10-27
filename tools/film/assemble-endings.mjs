// Cut the take to the owner's script, lay the theme under it, and put one muted racket impact on
// each major transition.
//
// ⭐ WHY THERE IS A CUT. Switching the app between fixture careers means a touch, a reload and a
// boot – seconds that cannot live inside a shot whose length is written down. The recorder holds
// each shot generously and logs `holdStart`; this keeps `[holdStart + LEAD, + the scripted length]`
// out of each one. Nothing inside a segment is sped up, slowed down or re-ordered.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const DIR = process.argv[2] || '/tmp/endfilm'
const OUT = process.argv[3] || 'out/no-good-ending.mp4'
const MUSIC = process.argv[4] || 'public/music/theme.mp3'
const HIT = process.argv[5] || 'public/sounds/hit-3.mp3'
const XF = 0.28 // the brief: restrained crossfades of 0.2-0.35s
const LEAD = 0.3

/** The shots a racket impact lands ON – the joins between the film's movements, and nowhere else.
 *  "A single muted racket impact for major transitions" is a rhythm instruction, not a sound bed. */
const IMPACT_ON = new Set(['e1', 'peak-slow', 'fall-1', 'v-fiery', 'al1', 'logo1'])

const log = JSON.parse(fs.readFileSync(`${DIR}/log.json`, 'utf8'))
const src = fs.readdirSync(DIR).find((f) => f.endsWith('.webm'))
if (!src) throw new Error(`no take in ${DIR}`)

const segs = log.marks.map((m, i) => ({
  key: m.key,
  start: m.holdStart + LEAD,
  len: m.hold + (i < log.marks.length - 1 ? XF : 0),
}))
for (const [i, s] of segs.entries()) {
  const recorded = log.marks[i].end - log.marks[i].holdStart
  if (s.len + LEAD > recorded + 0.01) throw new Error(`[${s.key}] wants ${(s.len + LEAD).toFixed(2)}s of a ${recorded.toFixed(2)}s hold`)
}
const total = segs.reduce((n, s) => n + s.len, 0) - (segs.length - 1) * XF

const parts = []
segs.forEach((s, i) => {
  parts.push(
    `[0:v]trim=start=${s.start.toFixed(3)}:duration=${s.len.toFixed(3)},setpts=PTS-STARTPTS,` +
      `scale=828:1792:flags=lanczos,fps=30,format=yuv420p[v${i}]`,
  )
})
let prev = 'v0'
let off = 0
const at = {}
at[segs[0].key] = 0
segs.slice(1).forEach((s, k) => {
  off += segs[k].len - XF
  at[s.key] = off
  const out = k === segs.length - 2 ? 'vx' : `x${k}`
  parts.push(`[${prev}][v${k + 1}]xfade=transition=fade:duration=${XF}:offset=${off.toFixed(3)}[${out}]`)
  prev = out
})
parts.push(`[${prev}]fade=t=in:st=0:d=0.5,fade=t=out:st=${(total - 0.9).toFixed(3)}:d=0.9,format=yuv420p[v]`)

// --- audio: the theme, plus one impact per movement join ------------------------------------------
const impacts = segs.filter((s) => IMPACT_ON.has(s.key)).map((s) => at[s.key])
parts.push(
  `[1:a]atrim=0:${total.toFixed(3)},asetpts=PTS-STARTPTS,volume=0.72,` +
    `afade=t=in:st=0:d=1.4,afade=t=out:st=${(total - 3.0).toFixed(3)}:d=3.0,aresample=48000[music]`,
)
impacts.forEach((t, i) => {
  // muted: the impact is a punctuation mark under the music, not a hit on top of it
  parts.push(`[${i + 2}:a]atrim=0:0.5,asetpts=PTS-STARTPTS,volume=0.16,adelay=${Math.round(t * 1000)}|${Math.round(t * 1000)},aresample=48000[h${i}]`)
})
parts.push(`[music]${impacts.map((_, i) => `[h${i}]`).join('')}amix=inputs=${impacts.length + 1}:duration=first:normalize=0,alimiter=limit=0.95[a]`)

const inputs = ['-i', `${DIR}/${src}`, '-stream_loop', '-1', '-i', MUSIC]
for (const _ of impacts) inputs.push('-i', HIT)

fs.mkdirSync(OUT.replace(/\/[^/]+$/, ''), { recursive: true })
const args = [
  '-v', 'error', '-y',
  ...inputs,
  '-filter_complex', parts.join(';'),
  '-map', '[v]', '-map', '[a]',
  '-c:v', 'libx264', '-profile:v', 'high', '-crf', '18', '-preset', 'slow', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart',
  '-t', total.toFixed(3),
  OUT,
]
console.log(`cutting ${segs.length} segments -> ${total.toFixed(2)}s | ${impacts.length} racket impacts at ${impacts.map((t) => t.toFixed(1)).join(', ')}s`)
execFileSync('ffmpeg', args, { stdio: 'inherit' })
console.log('\n' + OUT + '\n' + execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_name,width,height,r_frame_rate:format=duration,size', '-of', 'default=nw=1', OUT]).toString())

// --- the caption cue sheet, off the take ----------------------------------------------------------
let t = 0
const lines = []
for (const m of log.marks) {
  const shot = log.shots.find((s) => s.key === m.key)
  const cap = (m.caption ?? []).join(' / ').replace(/\*\*/g, '') || '(no caption)'
  lines.push(
    `${t.toFixed(1).padStart(5)}–${(t + m.hold).toFixed(1).padStart(5)}s  ${m.key.padEnd(10)} ${cap}` +
      (shot?.badge ? `\n             badge: ${shot.badge}` : '') +
      (shot?.note ? `\n             note:  ${shot.note}` : '') +
      (shot?.save ? `\n             save:  ${shot.save} (${shot.screen})` : ''),
  )
  t += m.hold
}
fs.writeFileSync(OUT.replace(/\.mp4$/, '-cues.txt'), lines.join('\n\n') + '\n')
console.log('cue sheet ->', OUT.replace(/\.mp4$/, '-cues.txt'))

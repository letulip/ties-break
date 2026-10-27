// Cut the take down to the owner's script and lay the theme under it.
//
// ⭐ WHY THERE IS A CUT AT ALL. Navigating two real apps to a screen, measuring the card in both and
// matching the crop takes seconds, and those seconds cannot live inside a shot whose length is
// written down. The recorder therefore holds each shot GENEROUSLY and logs `holdStart`; this keeps
// `[holdStart + LEAD, + the scripted length]` out of each one and throws the dead air away. Nothing
// inside a segment is sped up, slowed down or re-ordered.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const DIR = process.argv[2] || '/tmp/devlog5'
const OUT = process.argv[3] || 'out/two-careers.mp4'
const MUSIC = process.argv[4] || 'public/music/theme.mp3'
const XF = 0.25 // the brief: cuts or short 200-300ms dissolves
const LEAD = 0.25 // let the panel dissolve finish before the segment starts

const log = JSON.parse(fs.readFileSync(`${DIR}/log.json`, 'utf8'))
const src = fs.readdirSync(DIR).find((f) => f.endsWith('.webm'))
if (!src) throw new Error(`no take in ${DIR}`)

const segs = log.marks.map((m, i) => ({
  key: m.key,
  start: m.holdStart + LEAD,
  // every segment but the last carries one transition's worth of tail, so the chain comes out at
  // exactly the scripted total rather than (total - 9 x 0.25)
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
      `scale=1080:1080:flags=lanczos,fps=30,format=yuv420p[v${i}]`,
  )
})
let prev = 'v0'
let off = 0
segs.slice(1).forEach((s, k) => {
  off += segs[k].len - XF
  const out = k === segs.length - 2 ? 'vx' : `x${k}`
  parts.push(`[${prev}][v${k + 1}]xfade=transition=fade:duration=${XF}:offset=${off.toFixed(3)}[${out}]`)
  prev = out
})
parts.push(`[${prev}]fade=t=out:st=${(total - 0.8).toFixed(3)}:d=0.8,format=yuv420p[v]`)
parts.push(
  `[1:a]atrim=0:${total.toFixed(3)},asetpts=PTS-STARTPTS,volume=0.8,` +
    `afade=t=in:st=0:d=1.5,afade=t=out:st=${(total - 3.2).toFixed(3)}:d=3.2,aresample=48000[a]`,
)

fs.mkdirSync(OUT.replace(/\/[^/]+$/, ''), { recursive: true })
const args = [
  '-v', 'error', '-y',
  '-i', `${DIR}/${src}`,
  '-stream_loop', '-1', '-i', MUSIC,
  '-filter_complex', parts.join(';'),
  '-map', '[v]', '-map', '[a]',
  '-c:v', 'libx264', '-profile:v', 'high', '-crf', '18', '-preset', 'slow', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart',
  '-t', total.toFixed(3),
  OUT,
]
console.log(`cutting ${segs.length} segments -> ${total.toFixed(2)}s`)
for (const s of segs) console.log(`  ${s.key.padEnd(11)} from ${s.start.toFixed(2)} for ${s.len.toFixed(2)}`)
execFileSync('ffmpeg', args, { stdio: 'inherit' })

const probe = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_name,width,height,r_frame_rate:format=duration,size', '-of', 'default=nw=1', OUT]).toString()
console.log('\n' + OUT + '\n' + probe)

// ── the caption cue sheet, off the take rather than off the brief ────────────────────────────────
let t = 0
const cues = []
for (const [i, m] of log.marks.entries()) {
  const shot = log.shots.find((s) => s.key === m.key)
  cues.push({ key: m.key, in: t, out: t + m.hold, caption: (m.caption ?? shot?.caption ?? []).join(' / ') || '(no caption)', left: shot?.when?.[0] ?? '\u2013', right: shot?.when?.[1] ?? '\u2013', note: shot?.note ?? m.note ?? '' })
  t += m.hold
}
fs.writeFileSync(OUT.replace(/\.mp4$/, '-cues.txt'), cues.map((c) => `${c.in.toFixed(1).padStart(5)}–${c.out.toFixed(1).padStart(5)}s  ${c.key.padEnd(11)} ${c.caption}\n             left:  ${c.left}\n             right: ${c.right}\n             note:  ${c.note}`).join('\n\n') + '\n')
console.log('cue sheet ->', OUT.replace(/\.mp4$/, '-cues.txt'))

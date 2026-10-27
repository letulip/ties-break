// Cut the take to the film, drop the theme under it, and hand back a 1080x1080 h264/aac mp4.
//
// The rig plays one continuous window with its own dissolves, so there is nothing to splice: the
// only edit is WHERE the window starts and how long it runs, both read off the recorder's log.
// ⚠ The recording is 2160x2160 (the 2x flag) and the deliverable is 1080 – the scale here is a
// DOWNSAMPLE, never an upscale.
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

const DIR = process.argv[2] || '/tmp/prologuefilm'
const OUT = process.argv[3] || 'out/nine-years.mp4'
const MUSIC = process.argv[4] || 'public/music/theme.mp3'

const log = JSON.parse(fs.readFileSync(`${DIR}/log.json`, 'utf8'))
const webm = fs.readdirSync(DIR).filter((f) => f.endsWith('.webm')).map((f) => `${DIR}/${f}`)
if (webm.length !== 1) throw new Error(`expected one recording in ${DIR}, found ${webm.length}`)

// The rig lights the first beat 170ms into its own clock (the dissolve OUT of nothing), so the cut
// starts a touch before `filmStart` and the film fades up inside the frame rather than at its edge.
const start = Math.max(0, log.filmStart - 0.12)
const dur = log.total + 0.24

fs.mkdirSync(OUT.replace(/\/[^/]+$/, ''), { recursive: true })
const args = [
  '-y',
  '-ss', start.toFixed(3), '-t', dur.toFixed(3), '-i', webm[0],
  '-i', MUSIC,
  '-filter_complex',
  [
    // ⚠ SCALE IS A DOWNSAMPLE: the take is 2160 square (the 2x browser flag) and the deliverable is
    // 1080. The tail fade is the rig's one missing dissolve - it lights the logo card and stops.
    `[0:v]scale=1080:1080:flags=lanczos,fps=30,fade=t=out:st=${(dur - 0.9).toFixed(3)}:d=0.9,format=yuv420p[v]`,
    // A bed, not a driver. Measured: at volume 0.40 the cut came back at -26.3 LUFS integrated,
    // which is under a phone speaker's floor; 0.85 lands it near -20, quiet but present.
    `[1:a]atrim=0:${dur.toFixed(3)},volume=0.85,afade=t=in:st=0:d=1.2,afade=t=out:st=${(dur - 3.0).toFixed(3)}:d=3.0,aresample=48000[a]`,
  ].join(';'),
  '-map', '[v]', '-map', '[a]',
  '-c:v', 'libx264', '-profile:v', 'high', '-crf', '18', '-preset', 'slow', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart',
  OUT,
]
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit' })
const probe = execFileSync('ffprobe', ['-hide_banner', '-v', 'error', '-show_entries', 'format=duration,size:stream=codec_name,width,height,pix_fmt,r_frame_rate', '-of', 'default=nw=1', OUT]).toString()
console.log(`\n${OUT}\n${probe}`)

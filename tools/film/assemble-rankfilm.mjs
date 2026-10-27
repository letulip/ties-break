// Cut ONE WEEK, TWO FUTURES: one continuous window over the rig's own timeline, then the logo card.
//
// ⚠ ONE WINDOW, NOT PER-SCENE CUTS. The rig owns the timing AND the 300ms crossfades between scenes;
// cutting scene by scene would slice every crossfade in half. So the picture is taken in a single
// pass and only the logo card is appended.
//
// ⚠ NO SCALING. The source is already 828x1792 - a native 2x of the 414x896 phone layout - so the
// filter chain only fixes fps and pixel format.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const DIR = process.argv[2] || '/tmp/rankfilm'
const OUT = process.argv[3] || '/Users/letulip/Downloads/three_rankings_one_career.mp4'
const MUSIC = process.argv[4] || 'public/music/theme.mp3'
const CARD = 2.0

const data = JSON.parse(fs.readFileSync(path.join(DIR, 'log.json'), 'utf8'))
const src = fs.readdirSync(DIR).find((f) => f.endsWith('.webm'))
if (!src) throw new Error('no recording in ' + DIR)
const VIDEO = path.join(DIR, src)
const ff = (a) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...a], { stdio: 'inherit' })
const mark = (w) => {
  const m = data.marks.find((x) => x.what === w)
  if (!m) throw new Error('no mark: ' + w)
  return m
}

const film = mark('film')
const splash = mark('splash')
const segs = [
  { label: 'film', start: film.t, dur: Number(data.total) },
  { label: 'logo', start: Number(splash.t) + 0.25, dur: CARD, card: true },
]
const total = segs.reduce((a, s) => a + s.dur, 0)
console.log('segments:', segs.map((s) => `${s.label} ${s.dur.toFixed(1)}s`).join(' | '), `= ${total.toFixed(1)}s`)

const parts = []
segs.forEach((s, i) => {
  const out = path.join(DIR, `w${i}.mp4`)
  const vf = s.card
    ? `fps=30,format=yuv420p,fade=t=in:st=0:d=0.3,fade=t=out:st=${(s.dur - 0.7).toFixed(2)}:d=0.7`
    : 'fps=30,format=yuv420p'
  ff(['-ss', String(s.start), '-t', String(s.dur), '-i', VIDEO, '-vf', vf, '-an',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', out])
  parts.push(out)
})
const listFile = path.join(DIR, 'concat.txt')
fs.writeFileSync(listFile, parts.map((p) => `file '${p}'`).join('\n'))
const silent = path.join(DIR, 'silent.mp4')
ff(['-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', silent])

const fadeOut = Math.max(0, total - 1.8)
ff(['-i', silent, '-i', MUSIC,
  '-filter_complex', `[1:a]atrim=0:${total.toFixed(2)},afade=t=in:st=0:d=0.4,afade=t=out:st=${fadeOut.toFixed(2)}:d=1.8,volume=0.85[a]`,
  '-map', '0:v', '-map', '[a]',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', OUT])

const r = data.report
console.log(`\n${OUT}  ${(fs.statSync(OUT).size / 1024 / 1024).toFixed(1)} MB  ${total.toFixed(1)}s  828x1792`)
const line = (l) => `${l.rank == null ? 'Unranked' : '#' + l.rank} · ${l.points} pts · ${l.countingResults.length} counting`
console.log(`seed ${r.seed} | age ${r.ageYears} | National wk ${r.natEventWeek} | J30 wk ${r.j30EventWeek}`)
console.log(`  before      National ${line(r.before.dom)} | International ${line(r.before.itf)} | Professional ${line(r.before.wta)}`)
console.log(`  after title National ${line(r.afterNational.dom)} | International ${line(r.afterNational.itf)} | Professional ${line(r.afterNational.wta)}`)
console.log(`  after J30   National ${line(r.afterJ30.dom)} | International ${line(r.afterJ30.itf)} | Professional ${line(r.afterJ30.wta)}`)

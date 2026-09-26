#!/usr/bin/env node
// Lane H probe (26.09 review, baseline 03d92221). Read-only on the repository: it reads blobs with
// `git show` / `git cat-file`, writes the three sides of each file to a scratch directory and runs
// `git merge-file -p` there (stdout only), so no object, ref or index in the repository is written.
//
// For every two-parent merge in <range>, it replays the textual three-way merge of each file that
// BOTH sides changed and classifies every conflict hunk it produces:
//   comment – every non-blank line on both sides of the hunk is a comment line (//, /*, *, <!--)
//   code    – every non-blank line is code
//   mixed   – both kinds appear
// Files: .ts .mts .mjs .js .vue are classified; .md is counted as `doc`; binary (.tsave, images)
// and .json are counted by extension. A merge the author resolved by hand is exactly one that this
// replay reports a conflict for – the replay asks "what did git hand the person merging".
//
// Usage:  node h-merge-conflicts.mjs <range> <scratchDir> [out.json]
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const [range, scratch, outFile] = process.argv.slice(2)
mkdirSync(scratch, { recursive: true })
const git = (...a) => execFileSync('git', a, { maxBuffer: 1 << 28 }).toString()
const merges = git('log', '--merges', '--format=%H %P', range).trim().split('\n').filter(Boolean)
  .map((l) => l.split(' ')).filter((p) => p.length === 3)

const isComment = (l) => { const t = l.trim(); return t.startsWith('//') || t.startsWith('/*') || t.startsWith('*') || t.startsWith('<!--') || t.endsWith('*/') || t.endsWith('-->') }
const blob = (rev, f) => { const r = spawnSync('git', ['show', `${rev}:${f}`], { maxBuffer: 1 << 28 }); return r.status === 0 ? r.stdout : Buffer.alloc(0) }

const totals = { merges: merges.length, mergesWithConflict: 0, files: {}, conflictedFiles: {}, hunks: { comment: 0, code: 0, mixed: 0 }, hunkLines: { comment: 0, code: 0 }, byFile: {} }
const perMerge = []
for (const [m, p1, p2] of merges) {
  const base = git('merge-base', p1, p2).trim()
  const a = new Set(git('diff', '--name-only', base, p1).trim().split('\n').filter(Boolean))
  const both = git('diff', '--name-only', base, p2).trim().split('\n').filter((f) => f && a.has(f))
  let conflicted = 0
  for (const f of both) {
    const ext = path.extname(f)
    const o = blob(p1, f), b = blob(base, f), t = blob(p2, f)
    if (o.equals(t)) continue
    if (['.tsave', '.webp', '.png', '.mp3', '.json'].includes(ext)) {
      // binary / generated: a both-sides change to different bytes is a conflict git cannot merge textually for binaries
      if (ext !== '.json' || true) {
        const d = path.join(scratch, 'x')
        writeFileSync(d + '.o', o); writeFileSync(d + '.b', b); writeFileSync(d + '.t', t)
        const r = ext === '.json' ? spawnSync('git', ['merge-file', '-p', d + '.o', d + '.b', d + '.t']) : { status: o.equals(b) || t.equals(b) ? 0 : 1 }
        if (r.status !== 0) { totals.files[ext] = (totals.files[ext] || 0) + 1; totals.conflictedFiles[f] = (totals.conflictedFiles[f] || 0) + 1; conflicted++ }
      }
      continue
    }
    const d = path.join(scratch, 'x')
    writeFileSync(d + '.o', o); writeFileSync(d + '.b', b); writeFileSync(d + '.t', t)
    const r = spawnSync('git', ['merge-file', '-p', d + '.o', d + '.b', d + '.t'], { maxBuffer: 1 << 28 })
    if (r.status === 0) continue
    conflicted++
    totals.conflictedFiles[f] = (totals.conflictedFiles[f] || 0) + 1
    const kind = ext === '.md' ? 'doc' : ext
    totals.files[kind] = (totals.files[kind] || 0) + 1
    if (!['.ts', '.mts', '.mjs', '.js', '.vue'].includes(ext)) continue
    const lines = r.stdout.toString().split('\n')
    let inH = false, hl = []
    for (const l of lines) {
      if (l.startsWith('<<<<<<<')) { inH = true; hl = []; continue }
      if (inH && l.startsWith('>>>>>>>')) {
        inH = false
        const nb = hl.filter((x) => x.trim() && !x.startsWith('=======') && !x.startsWith('|||||||'))
        const c = nb.filter(isComment).length, k = nb.length - c
        const cls = k === 0 ? 'comment' : c === 0 ? 'code' : 'mixed'
        totals.hunks[cls]++; totals.hunkLines.comment += c; totals.hunkLines.code += k
        totals.byFile[f] = (totals.byFile[f] || 0) + 1
        continue
      }
      if (inH) hl.push(l)
    }
  }
  if (conflicted) totals.mergesWithConflict++
  perMerge.push({ m: m.slice(0, 8), conflicted })
}
const top = Object.entries(totals.byFile).sort((x, y) => y[1] - x[1]).slice(0, 15)
console.log(JSON.stringify({ ...totals, byFile: undefined, topFiles: top }, null, 2))
if (outFile) writeFileSync(outFile, JSON.stringify({ totals, perMerge }, null, 1))

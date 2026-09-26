// Phase 0c – folds browser-perf.mjs's JSON into the §C tables (no repo imports, no browser).
//   node browser-analyze.mjs toggle <toggle-*.json...>
//   node browser-analyze.mjs advance <advance-*.json...>
//   node browser-analyze.mjs idbproxy <idbproxy.json>
import { readFileSync } from 'node:fs'

const q = (xs, p) => {
  const a = xs.filter((x) => typeof x === 'number' && Number.isFinite(x)).sort((x, y) => x - y)
  if (!a.length) return NaN
  const i = (a.length - 1) * p
  const lo = Math.floor(i)
  const hi = Math.ceil(i)
  return a[lo] + (a[hi] - a[lo]) * (i - lo)
}
const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : '–')
const stat = (xs, d = 1) => `${f(q(xs, 0.5), d)} (p90 ${f(q(xs, 0.9), d)}, ${f(q(xs, 0), d)}–${f(q(xs, 1), d)})`
const med = (xs, d = 1) => f(q(xs, 0.5), d)

function rowFacts(r) {
  const snap = r.replies.find((x) => x.type === 'snapshot')
  const lastFlush = Math.max(...r.replies.map((x) => x.tFlush ?? 0))
  const settle = Math.max(r.tLastMutation ?? 0, lastFlush)
  const w = r.worker
  const cmdId = snap?.id
  const wc = w.cmds.find((c) => c.id === cmdId)
  const wr = w.replies.find((c) => c.id === cmdId)
  const tx = w.txs.find((t) => t.stores === 'saves+careers')
  const put = w.puts.find((p) => p.store === 'saves')
  const send = r.sends.find((s) => s.id === cmdId)
  return {
    cmdToSnapRendered: snap ? snap.tFlush - r.t0 : NaN,
    cmdToSettled: settle - r.t0,
    cmdToFrame: snap ? snap.tFrame - r.t0 : NaN,
    mainSnapHandling: snap ? snap.tFlush - snap.t : NaN,
    mainDeserialize: snap ? snap.td - snap.t : NaN,
    snapToFrame: snap ? snap.tFrame - snap.t : NaN,
    snapToLastMutation: snap && r.tLastMutation ? r.tLastMutation - snap.t : NaN,
    mutations: r.mutations,
    transitIn: send && wc ? wc.t - send.t : NaN,
    workerTotal: wc && wr ? wr.t - wc.t : NaN,
    workerBeforeTx: wc && tx ? tx.t0 - wc.t : NaN,
    idbTx: tx && tx.t1 ? tx.t1 - tx.t0 : NaN,
    idbPutSync: put ? put.dt : NaN,
    putBytes: put?.payloadBytes ?? NaN,
    workerAfterTx: tx && wr ? wr.t - tx.t1 : NaN,
    transitOut: wr && snap ? snap.t - wr.t : NaN,
    snapJson: snap?.snapshotJsonChars ?? NaN,
    replyJson: snap?.jsonChars ?? NaN,
    otherReplies: r.replies.filter((x) => x !== snap).map((x) => `${x.type}:${x.jsonChars}`).join(' '),
    cdpScriptMs: r.cdp.ScriptDuration * 1000,
    cdpTaskMs: r.cdp.TaskDuration * 1000,
    cdpLayoutMs: r.cdp.LayoutDuration * 1000,
    cdpStyleMs: r.cdp.RecalcStyleDuration * 1000,
    timedOut: r.timedOut,
    err: r.err,
    week: `${r.week0}->${r.week1}`,
  }
}

function table(label, rows) {
  const F = rows.map(rowFacts)
  const col = (k, d) => stat(F.map((x) => x[k]), d)
  const out = []
  out.push(`## ${label}  n=${F.length}  weeks ${[...new Set(F.map((x) => x.week))].join(',')}  errors ${F.filter((x) => x.err).length}  timedOut ${F.filter((x) => x.timedOut).length}`)
  for (const k of ['cmdToSnapRendered', 'cmdToSettled', 'cmdToFrame', 'mainSnapHandling', 'mainDeserialize', 'snapToFrame', 'snapToLastMutation', 'mutations', 'transitIn', 'workerTotal', 'workerBeforeTx', 'idbTx', 'idbPutSync', 'putBytes', 'workerAfterTx', 'transitOut', 'snapJson', 'replyJson', 'cdpScriptMs', 'cdpTaskMs', 'cdpLayoutMs', 'cdpStyleMs']) {
    out.push(`  ${k.padEnd(20)} ${col(k, k.endsWith('Bytes') || k.endsWith('Json') || k === 'mutations' ? 0 : 2)}`)
  }
  out.push(`  otherReplies         ${[...new Set(F.map((x) => x.otherReplies))].slice(0, 3).join(' | ')}`)
  return out.join('\n')
}

const [mode, ...files] = process.argv.slice(2)
if (mode === 'toggle') {
  for (const file of files) {
    const r = JSON.parse(readFileSync(file, 'utf8'))
    console.log(`\n# toggle ${r.fixture} (week ${r.week}) n=${r.n} errors=${r.errors.length}`)
    for (const [screen, v] of Object.entries(r.screens)) {
      console.log(table(`${screen} nodes=${v.state.nodes} idleMut/s=${v.idleMutationsPerSec}`, v.rows))
      const t = v.trace.perThread
      const per = (x) => (x ? `busy ${f(x.busyMs / v.trace.iterations, 2)} js ${f(x.jsMs / v.trace.iterations, 2)} gc ${f(x.gcMs / v.trace.iterations, 2)}` : '–')
      console.log(`  trace/iter (5 iters)  main: ${per(t.main)} | worker: ${per(t.worker)}`)
    }
  }
} else if (mode === 'advance') {
  for (const file of files) {
    const r = JSON.parse(readFileSync(file, 'utf8'))
    const timed = r.rows.filter((x) => !x.traced)
    const traced = r.rows.filter((x) => x.traced)
    console.log(`\n# advance ${r.fixture} screen=${r.screen} timed=${timed.length} traced=${traced.length} boot med ${med(timed.map((x) => x.bootMs), 0)} ms, nodes before ${med(timed.map((x) => x.nodes0), 0)} after ${med(timed.map((x) => x.after.nodes), 0)}, dialogs after: ${[...new Set(timed.map((x) => x.after.dialogs.join('/').slice(0, 50)))].join(' | ')}, errors ${timed.flatMap((x) => x.errors).length}`)
    console.log(table(`${r.fixture}/${r.screen}`, timed))
    if (traced.length) {
      const pick = (k, th) => traced.map((x) => x.trace?.[th]?.[k] ?? NaN)
      console.log(`  trace (per advance, ${traced.length} reps)  main busy ${stat(pick('busyMs', 'main'), 2)} js ${stat(pick('jsMs', 'main'), 2)} gc ${stat(pick('gcMs', 'main'), 2)} | worker busy ${stat(pick('busyMs', 'worker'), 2)} gc ${stat(pick('gcMs', 'worker'), 2)}`)
    }
  }
} else if (mode === 'series') {
  for (const file of files) {
    const r = JSON.parse(readFileSync(file, 'utf8'))
    const timed = r.rows.filter((x) => !x.warmup && !(r.stoppedAt && x === r.rows[r.rows.length - 1] && x.week1 === x.week0))
    console.log(`\n# series ${r.fixture} screen=${r.screen} warm=${r.warm} timed=${timed.length} stoppedAt=${JSON.stringify(r.stoppedAt)} errors ${r.errors.length}`)
    console.log(table(`${r.fixture}/${r.screen} consecutive`, timed))
  }
} else if (mode === 'idbproxy') {
  const r = JSON.parse(readFileSync(files[0], 'utf8'))
  for (const [kib, rows] of Object.entries(r)) {
    console.log(`${kib} KiB  n=${rows.length}  tx total ${stat(rows.map((x) => x.totalMs), 2)}  put() sync ${stat(rows.map((x) => x.putSyncMs), 2)}`)
  }
} else throw new Error('mode?')

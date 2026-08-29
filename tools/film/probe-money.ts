import { run } from './scenario'
const out: any[] = []
for (let i = 1; i <= 40; i++) {
  try {
    const r = run(`won-lost-${i}`) as any
    out.push(r.ok ? { i, champion: r.champion, points: r.points, net: r.net, before: r.balanceBefore, after: r.balanceAfter, week: r.eventWeek } : { i, why: r.why })
  } catch (e) {
    out.push({ i, err: String(e).slice(0, 120) })
  }
}
;(window as any).__probe = out
console.log('probe done', out.length)

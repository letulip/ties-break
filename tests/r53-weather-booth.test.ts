// ⭐ r53 W3 – the booth talks about the weather with variety (owner, 22.10: «жара и ветер реплик не
// имеют… дождь может ожидаться, быть сильным, слабым, долгим, коротким, может просто быть облачно»).
// The variant is the day's fourth draw (`weatherLinePicks`) – never a draw of the booth's own.
// Mutation-verified: swapping a pool's variant index turns (b) red.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import type { MatchPlayer } from '../src/engine/match/types'
import { simulateMatch } from '../src/engine/match/engine'
import { annotateMatch } from '../src/engine/match/rally'
import { weatherLinePicks } from '../src/engine/season/preview'
import { buildCommentary, type CommentaryWeather } from '../src/viz/commentary'

const P = (id: string): MatchPlayer => ({ id, name: id, serve: 55, ret: 55, composure: 55, stamina: 55, groundstrokes: 55 }) as MatchPlayer
const o = { surface: 'clay' as const, tour: 'wta' as const, seed: 'booth-weather' }
const a = P('a')
const b = P('b')
const m = annotateMatch(simulateMatch(a, b, o), a, b, o)
const booth = (w: CommentaryWeather | null) => buildCommentary(m, 'Ann', 'Bea', null, null, null, null, null, w).filter((x) => x.kind === 'booth')
const base = booth(null).map((x) => x.text)
const added = (w: CommentaryWeather | null) => booth(w).filter((x) => !base.includes(x.text))

/** A linePick whose booth pick `field` equals `want` (the others are whatever they fall out as). */
function pickFor(field: 'heatRemark' | 'windRemark' | 'rainRemark', want: number): number {
  for (let i = 0; i < 5000; i++) if (weatherLinePicks(i / 5000)[field] === want) return i / 5000
  throw new Error('no pick')
}
const day = (o2: Partial<CommentaryWeather>): CommentaryWeather => ({ temperatureC: 20, wind: 'none', rain: 'none', linePick: 0, ...o2 })

describe('W3 – the booth and the weather', () => {
  it('(a) no weather, or a mild calm dry day, adds no remark', () => {
    expect(m.points.length).toBeGreaterThan(60)
    expect(booth(null).map((x) => x.text)).toEqual(base)
    expect(added(day({}))).toEqual([])
    expect(added(day({ temperatureC: 29 }))).toEqual([])
  })
  it('(b) heat – exactly one remark, late, and the pick chooses the line', () => {
    const lines = [0, 1, 2].map((k) => {
      const got = added(day({ temperatureC: 31, linePick: pickFor('heatRemark', k) }))
      expect(got.length).toBe(1)
      expect(got[0].pointIndex).toBeGreaterThan(Math.floor((m.points.length - 1) / 2))
      return got[0].text
    })
    expect(new Set(lines).size).toBe(3)
    expect(lines[0]).toContain('Long rallies')
    expect(lines[1]).toContain('ice at the changeover')
    expect(lines[2]).toContain('heat is in the legs')
  })
  it('(c) wind – one remark, early, from the pool of its strength', () => {
    const fresh = [0, 1, 2].map((k) => added(day({ wind: 'fresh', linePick: pickFor('windRemark', k) })))
    const strong = [0, 1, 2].map((k) => added(day({ wind: 'strong', linePick: pickFor('windRemark', k) })))
    for (const g of [...fresh, ...strong]) {
      expect(g.length).toBe(1)
      expect(g[0].pointIndex).toBeLessThanOrEqual(Math.floor((m.points.length - 1) / 2))
    }
    const f = fresh.map((g) => g[0].text)
    const s = strong.map((g) => g[0].text)
    expect(new Set(f).size).toBe(3)
    expect(new Set(s).size).toBe(3)
    expect(f.filter((t) => s.includes(t))).toEqual([])
    expect(f[0]).toContain('fresh breeze')
    expect(s[0]).toContain('strong wind')
  })
  it('(d) rain possible – the clouds in the first half, the held-off line in the second; the pick chooses the clouds', () => {
    const k0 = added(day({ rain: 'possible', linePick: pickFor('rainRemark', 0) }))
    const k1 = added(day({ rain: 'possible', linePick: pickFor('rainRemark', 1) }))
    expect(k0.length).toBe(2)
    expect(k0[0].text).toContain('clouds are gathering')
    expect(k1[0].text).toContain('gone dark')
    expect(k0[1].text).toBe(k1[1].text)
    expect(k0[1].text).toContain('held off')
  })
  it('(e) rain falling – pick 0 is the approved first line, pick 1 the heavy one, the second line is the same', () => {
    const light = added(day({ rain: 'falling', linePick: pickFor('rainRemark', 0) }))
    const heavy = added(day({ rain: 'falling', linePick: pickFor('rainRemark', 1) }))
    expect(light[0].text).toContain('The rain is back')
    expect(heavy[0].text).toContain('come down hard')
    expect(light.length).toBe(heavy.length)
    expect(light[1].text).toBe(heavy[1].text)
    expect(light[1].text).toContain('drying out')
    expect(light.map((x) => x.pointIndex)).toEqual(heavy.map((x) => x.pointIndex))
  })
  it('a hot, windy, rainy day keeps one beat per point, the rain placed first', () => {
    const all = added(day({ temperatureC: 33, wind: 'strong', rain: 'falling' }))
    expect(new Set(all.map((x) => x.pointIndex)).size).toBe(all.length)
    expect(all[0].text).toContain('The rain is back')
    expect(all.length).toBeGreaterThanOrEqual(3)
  })
  it('no weather remark draws: the same inputs give the same log twice', () => {
    const w = day({ temperatureC: 33, wind: 'fresh', rain: 'possible', linePick: 0.37 })
    expect(buildCommentary(m, 'Ann', 'Bea', null, null, null, null, null, w)).toEqual(buildCommentary(m, 'Ann', 'Bea', null, null, null, null, null, w))
  })
  it('(f) every remark the booth can say is a key of the catalogue (all 13 reached)', () => {
    const keys = new Set(Object.keys(JSON.parse(readFileSync('src/i18n/catalog.en.json', 'utf8')).keys))
    const said = new Set<string>()
    for (let i = 0; i < 60; i++) {
      const linePick = i / 60
      for (const w of [
        day({ temperatureC: 33, wind: 'strong', linePick }),
        day({ wind: 'fresh', linePick }),
        day({ rain: 'possible', linePick }),
        day({ rain: 'falling', linePick }),
      ])
        for (const x of added(w)) said.add(x.text)
    }
    // 3 heat + 3 strong + 3 fresh + 2 clouds + held off + heavy + the two approved rain lines
    expect(said.size).toBe(15)
    for (const t of said) expect(keys.has(t), t).toBe(true)
  })
})

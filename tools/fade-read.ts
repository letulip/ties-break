// FADE READ (21.09.2026) – derived statistics of one personal save, for the owner's question about
// a super-talented career that «сдулась» at 24. Reads through decodeExportFile per the house law:
// nothing of the save is copied anywhere; only the numbers below leave.
// Usage: vite-node tools/fade-read.ts <path.tsave>

import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import type { WorldState } from '../src/engine/world'
import { kidAgeYears } from '../src/engine/world/age'
import { physicalMean, declineFactor, SKILL_KEYS } from '../src/engine/development'
import { ECONOMY } from '../src/engine/economy'
import { coreForStanding, eloForStanding } from '../src/engine/season/fieldPros'

async function main() {
  const path = process.argv[2]
  if (!path) throw new Error('usage: vite-node tools/fade-read.ts <path.tsave>')
  const w = (await decodeExportFile(new Uint8Array(readFileSync(path)))) as WorldState
  const age = kidAgeYears(w.week, w.profile.birthMonth, w.profile.birthDay)
  const anyW = w as unknown as Record<string, unknown>

  console.log(`schema v${(anyW.schemaVersion as number) ?? '?'} · week ${w.week} · age ${age} · temperament ${String(anyW.temperament ?? '?')}`)
  console.log(`ageCurve on the save: ${JSON.stringify(anyW.ageCurve ?? null)} (default decline ${ECONOMY.development.ageCurve.declineStart})`)
  const curve = (anyW.ageCurve as { plateauStart: number; declineStart: number } | null) ?? ECONOMY.development.ageCurve
  console.log(`declineFactor at her age: ${declineFactor(age, curve).toFixed(4)} (0 = no decline yet)`)

  const skills = w.skills as unknown as Record<string, number>
  const line = SKILL_KEYS.map(k => `${k} ${skills[k]?.toFixed(1)}`).join(' · ')
  console.log(`skills now: ${line}`)
  console.log(`physicalMean now ${physicalMean(w.skills).toFixed(2)} vs peakPhysical ${(anyW.peakPhysical as number)?.toFixed?.(2) ?? '?'}`)
  const overall4 = (skills.serve + skills.ret + skills.composure + skills.stamina) / 4
  console.log(`overall(4) ${overall4.toFixed(1)} – vs SKILL_LAW top 76.4, tourElite band 67–77, elite 56–66`)

  const rankWta = (anyW.kidRankWta as number | undefined)
  console.log(`ranks: ITF ${String(anyW.kidRank ?? '?')} · WTA ${String(rankWta ?? '–')}`)
  if (rankWta) {
    console.log(`coreForStanding(#${rankWta}) = ${coreForStanding(rankWta).toFixed(1)} (Elo ${eloForStanding(rankWta).toFixed(0)}) – the game the table EXPECTS at her chair vs her overall ${overall4.toFixed(1)}`)
  }

  console.log(`condition ${w.condition} · spirit ${w.spirit.toFixed(1)} · bond ${w.bond.toFixed(1)} · masseur ${w.masseurHired} · psychologist ${(anyW.psychologistHired as boolean) ?? '?'} · academy ${w.academy ? 'yes' : 'no'}`)

  const titlesBySeason = new Map<number, number>()
  for (const m of w.milestones as { type: string; week: number }[]) {
    if (m.type === 'title') {
      const s = Math.floor(m.week / 52)
      titlesBySeason.set(s, (titlesBySeason.get(s) ?? 0) + 1)
    }
  }
  console.log('season · ageAtWrap · endRank(ITF) · wta endRank/pts/W-L · itf pts/W-L · titles')
  for (const s of w.seasonHistory) {
    const wta = s.byTrack?.wta
    const itf = s.byTrack?.itf
    const ageAt = kidAgeYears((s.seasonIndex + 1) * 52 - 1, w.profile.birthMonth, w.profile.birthDay)
    console.log(
      `S${s.seasonIndex} · ${ageAt} · #${s.endRank} · ` +
      `${wta?.endRank !== undefined ? '#' + wta.endRank : '–'}/${wta?.points ?? 0}/${wta?.wins ?? 0}-${wta?.losses ?? 0} · ` +
      `${itf?.points ?? 0}/${itf?.wins ?? 0}-${itf?.losses ?? 0} · ${titlesBySeason.get(s.seasonIndex) ?? 0}`,
    )
  }
  const thisSeason = Math.floor(w.week / 52)
  console.log(`current season S${thisSeason}: titles so far ${titlesBySeason.get(thisSeason) ?? 0}`)

  const knocks = w.knockHistory as { week: number }[]
  const recent = knocks.filter(k => k.week > w.week - 104).length
  console.log(`knocks: ${knocks.length} career, ${recent} in the last two years`)
  console.log(`loveEpisodes ${(anyW.loveEpisodes as unknown[])?.length ?? 0} · pregnancy ${JSON.stringify(anyW.pregnancy ?? null) !== 'null' ? 'yes' : 'no'} · children ${((anyW.children as unknown[]) ?? []).length}`)
}

main().catch(e => { console.error(e); process.exit(1) })

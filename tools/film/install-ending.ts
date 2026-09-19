// PUT THE FILM'S FIXTURE CAREERS ON THIS ORIGIN'S DISK, through the app's own doors and nothing else.
//
// `decodeExportFile` is the SHIPPED import door and `adoptAutosave` the SHIPPED write for a world
// that arrived from outside the disk lineage – the same pair `importSave` itself commits with. A
// fresh install cannot reach the import button (`App.vue` opens the childhood prologue as a
// full-screen takeover until a career exists), which is the whole reason this page exists.
//
// ⚠ THE OWNER'S OWN SAVES ARE NEVER OPENED. Every career here is a fixture built by
// `ending-fixtures.ts` in a throwaway directory outside the repository, and this origin is a dev
// server, not the browser he plays in.
import { decodeExportFile } from '../../src/engine/saveCodec'
import { adoptAutosave, listCareers, touchCareer } from '../../src/db/saves'

const fromB64 = (b64: string) => {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

;(window as any).__install = async (b64: string) => {
  const world: any = await decodeExportFile(fromB64(b64))
  const { meta, revision } = await adoptAutosave(world)
  return {
    careerId: world.careerId,
    seed: world.seed,
    week: world.week,
    ending: world.ending?.type ?? null,
    detail: world.ending?.detail ?? null,
    temperament: world.temperament,
    // ⭐ HER OWN WORDS FOR IT, READ OFF THE WORLD. `resolveLeaving` writes `leavingLine(door,
    // temperament)` into the diary as a kept milestone event – and an ended career can never reach
    // the news feed, because the epilogue replaces the shell. So the film QUOTES the save rather
    // than typing the sentence: this is the string the engine composed, verbatim.
    line: (world.events ?? [])
      .filter((e: any) => e.type === 'milestone' && e.keep && !String(e.text).includes(' \u2013 '))
      .map((e: any) => String(e.text))
      .at(-1) ?? null,
    kid: `${world.profile?.kidName} ${world.profile?.kidLastName}`,
    slot: meta.slot,
    revision,
  }
}
/** Make one installed career the most recent, which is the one `init()` boots into. */
;(window as any).__touch = async (careerId: string) => {
  await touchCareer(careerId, Date.now())
  return (await listCareers()).map((c) => ({ id: c.careerId, at: c.lastPlayedAt }))
}
;(window as any).__careers = async () => (await listCareers()).map((c) => ({ id: c.careerId, week: c.week, at: c.lastPlayedAt }))

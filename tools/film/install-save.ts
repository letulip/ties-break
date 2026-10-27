// PUT A REAL EXPORT FILE ON THIS ORIGIN'S DISK, through the app's own doors and nothing else.
//
// A fresh install has no careers, so `App.vue` opens the childhood prologue as a full-screen
// takeover and the More screen – where the shipped import button lives – cannot be reached. This
// page is the way round that, and it adds no code path of its own: `decodeExportFile` is the
// SHIPPED import door (size cap, header, declared version, checksum, bounded inflation, bounds walk,
// then the migration ladder) and `adoptAutosave` is the SHIPPED write for a world that arrived from
// outside the disk lineage – the same function `importSave` commits with. The app then boots into
// it exactly as it boots into any other career: `init()` lists careers and loads the most recent.
//
// ⚠ THE SAVE BYTES NEVER TOUCH THE REPOSITORY. They arrive base64 over `page.evaluate` from the
// recorder, which reads them off the owner's Downloads folder read-only, and nothing is written back
// to the file. Each panel is a SEPARATE ORIGIN (two dev servers, two ports), so the two careers
// never share a database, and neither of them is the browser the owner plays in.
import { decodeExportFile } from '../../src/engine/saveCodec'
import { adoptAutosave } from '../../src/db/saves'

;(window as any).__install = async (b64: string) => {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  const world: any = await decodeExportFile(bytes)
  const { meta, revision } = await adoptAutosave(world)
  return {
    careerId: world.careerId,
    seed: world.seed,
    week: world.week,
    schemaVersion: world.schemaVersion,
    kid: `${world.profile?.kidName} ${world.profile?.kidLastName}`,
    slot: meta.slot,
    revision,
  }
}

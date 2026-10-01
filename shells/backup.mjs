// `npm run shell:backup` – one encrypted-nowhere, plain tar.gz of ~/.tiesbreak (the Android signing
// key + its password file) to a place OUTSIDE this repo. Exists because `gzip -r` already ate the
// directory once (01.10: it compresses each file IN PLACE and deletes the original – restored that
// day from the .gz pair, fingerprint-verified). This is the command that does what that one meant.
// The archive holds the key: treat it like the key – move it into a password manager or encrypted
// storage, do not leave it on the Desktop long-term.
import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { homedir } from 'node:os'
import path from 'node:path'

const home = homedir()
const dir = path.join(home, '.tiesbreak')
for (const f of ['android.keystore', 'android-keystore.txt']) {
  if (!existsSync(path.join(dir, f))) {
    console.error(`[shell:backup] FAILED: ${path.join(dir, f)} is missing – nothing archived`)
    process.exit(1)
  }
}
const stamp = new Date().toISOString().slice(0, 10)
const out = process.argv[2] ?? path.join(home, 'Desktop', `tiesbreak-backup-${stamp}.tar.gz`)
execFileSync('tar', ['-czf', out, '-C', home, '.tiesbreak'])
console.log(`[shell:backup] written: ${out}`)
console.log('[shell:backup] move it into a password manager or encrypted storage.')
console.log(`[shell:backup] restore, if ever needed: tar -xzf ${path.basename(out)} -C ~`)

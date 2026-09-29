#!/bin/bash
# Lane H gap-fill probe: replay the three committed-registry/ratchet checks over history.
# For each commit in RANGE, extract the tree (each commit's OWN scripts and generated files) into a
# scratch dir and run, where the script exists at that commit:
#   node scripts/world-map.mjs --check      (world symbol map)
#   node scripts/tools-registry.mjs --check (tools registry)
#   node scripts/pin-ratchet.mjs            (pins:check ratchet)
# Output: one line per commit: sha parents date wm=<exit|na> tr=<exit|na> pr=<exit|na>
# Usage (from the tb-review worktree): bash h-registry-replay.sh <range or @sha-list-file> <scratch-dir> <out-file>
set -u
RANGE=$1; SCR=$2; OUT=$3
REPO=$(pwd)
: > "$OUT"
if [ "${RANGE:0:1}" = "@" ]; then LIST=$(cat "${RANGE:1}"); else LIST=$(git rev-list --reverse "$RANGE"); fi
for c in $LIST; do
  rm -rf "$SCR/t"; mkdir -p "$SCR/t"
  git archive "$c" src/engine scripts tools tests e2e package.json tsconfig.app.json tsconfig.tools.json \
    ':(exclude)tests/fixtures' ':(exclude)e2e/fixtures' 2>/dev/null | tar -x -C "$SCR/t" 2>/dev/null
  ln -s "$REPO/node_modules" "$SCR/t/node_modules"
  run() { if [ -f "$SCR/t/scripts/$1" ]; then (cd "$SCR/t" && node "scripts/$1" $2 >"$SCR/last-$1.log" 2>&1; echo $?); else echo na; fi; }
  wm=$(run world-map.mjs --check); tr=$(run tools-registry.mjs --check); pr=$(run pin-ratchet.mjs "")
  np=$(git rev-list --parents -n1 "$c" | awk '{print NF-1}')
  echo "$(git log -1 --format='%h %ad' --date=short "$c") p=$np wm=$wm tr=$tr pr=$pr" >> "$OUT"
done
echo "REPLAY_DONE" >> "$OUT"

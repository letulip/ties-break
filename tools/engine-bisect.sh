#!/bin/bash
# =================================================================================================
# engine-bisect.sh – run one career-outcome probe at an ARBITRARY COMMIT with the BENCH'S MANAGER
#                    HELD FIXED, so that only the engine moves between readings.
# =================================================================================================
#
# WHY THIS EXISTS. `docs/specs/the-fortnight-bisected-2026-08.md` had to answer «did the ENGINE move
# career outcomes between 12.08 and 27.08, or did the BENCH'S PARENT?» – and the two moved in the
# same fortnight, so comparing two trees compares both. This runner pins the parent and moves the
# tree, which is the only way to ask the engine question on its own.
#
# USAGE
#   tools/engine-bisect.sh <worktree> <sha> <seeds> <tag> [july|today] [outdir]
#
#   <worktree>  a DETACHED git worktree you own. ⚠ It is `git reset --hard`ed and checked out at
#               <sha>, so never point this at a shared checkout or at another agent's worktree.
#               Create one with:  git worktree add /path/wt-bisect --detach <branch>
#               and `npm install` in it once (dependencies did not move over the measured window;
#               check `git diff <old> <new> -- package.json` before assuming that again).
#   <seeds>     seeds per cell. `ladder-vs-targets` runs 4 cells, so careers = 4 x seeds.
#   <tag>       names the log file. Include the sha and the arm.
#   july|today  WHICH PARENT. `today` runs `--policy player` as that commit ships it.
#               `july` appends the pin below, which sets every field the policy has AT THAT COMMIT
#               to its 12.08 value.
#   [outdir]    where logs go (default: the worktree's parent).
#
# ⚠⚠ THE PIN REFUSES RATHER THAN GUESSES. If `Policy` ever gains a field with no 12.08 value here,
# the appended block THROWS and the run fails loudly. That is deliberate: the failure mode this
# whole exercise exists to avoid is silently comparing two different managers.
#
# ⚠ WHAT THE PIN DOES NOT HOLD FIXED, and both are recorded in the spec's §2c:
#   1. the bench's ENTRY CALL follows the engine's API. Over 12.08–27.08 it gained an `e.id`
#      argument (`d6eb021`) which made the wild cards visible – a step in `tools/`, not in `src/`.
#   2. `FULL_CAREER_WEEKS` (tools/endings-bench.ts) is the measurement WINDOW and moved 1300 → 1612.
#      Neither engine nor manager. Check it in the log header before comparing two readings.
#
# ⚠ READ THE VERDICT OUT OF THE LOG FILE. The script appends `RUN_EXIT=<code>` from the probe
# itself. A background task's completion notice reports the WRAPPER's status, not the probe's.
# =================================================================================================
set -u

WT="${1:?usage: engine-bisect.sh <worktree> <sha> <seeds> <tag> [july|today] [outdir]}"
SHA="${2:?missing sha}"
SEEDS="${3:?missing seeds}"
TAG="${4:?missing tag}"
MODE="${5:-july}"
OUT="${6:-$(dirname "$WT")}"
LOG="$OUT/$TAG.log"

mkdir -p "$OUT"
cd "$WT" || { echo "NO WORKTREE $WT" > "$LOG"; exit 9; }

# ⚠ Guard: this script hard-resets its working tree. Refuse anything that is not a detached worktree.
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "REFUSING: $WT is not a git worktree" > "$LOG"; exit 9
fi
if [ -n "$(git symbolic-ref -q HEAD || true)" ]; then
  echo "REFUSING: $WT is on a BRANCH ($(git branch --show-current)) – use a --detach worktree" > "$LOG"; exit 9
fi

git reset --hard -q >/dev/null 2>&1
git checkout -q --detach "$SHA" >/dev/null 2>&1 || { echo "CHECKOUT FAILED $SHA" > "$LOG"; exit 9; }
REAL=$(git rev-parse --short HEAD)

if [ "$MODE" = "july" ]; then
cat >> tools/econ-bench.ts <<'PIN'

// -------------------------------------------------------------------------------------------------
// BISECT JULY PIN – appended by tools/engine-bisect.sh, never committed to a source tree.
// Holds the BENCH'S MANAGER at the 12.08 `player` literal so only the ENGINE moves between commits.
// A field with no 12.08 value THROWS rather than silently comparing two different managers.
// -------------------------------------------------------------------------------------------------
{
  const JULY: Record<string, unknown> = {
    // the three fields the 12.08 literal actually had
    reserveCents: 5_000_00,
    restFloor: 70,
    coachOnEventWeeks: true,
    // every field added after 12.08, at the value econ-bench documents as the historical one
    reserveWeeks: 0,
    restRelief: 0,
    onlyHerTable: false,
    skipOutgrown: false,
    rescueBelow: null,
    rescueTo: 0,
    offSeasonWeekOff: false,
    vacationSpendShare: 0,
    coachSeasonReview: false,
  }
  const p = POLICIES.find((x) => x.id === 'player') as unknown as Record<string, unknown> | undefined
  if (!p) throw new Error('JULY PIN: no player policy at this commit')
  const uncovered = Object.keys(p).filter((k) => k !== 'id' && k !== 'label' && !(k in JULY))
  if (uncovered.length > 0) {
    throw new Error(`JULY PIN: manager field(s) with no 12.08 value: ${uncovered.join(', ')} – REFUSING to run`)
  }
  let applied = 0
  for (const k of Object.keys(JULY)) {
    if (k in p) {
      p[k] = JULY[k]
      applied++
    }
  }
  p.label = 'july-pin (12.08 manager)'
  console.log(`JULY PIN: ${applied} field(s) pinned – ${JSON.stringify(p)}`)
}
PIN
fi

{
  echo "=== BISECT RUN  tag=$TAG  sha=$REAL  seeds=$SEEDS  manager=$MODE  wt=$WT"
  echo "=== $(git log -1 --format='%h %ad %s' --date=iso HEAD)"
  echo "=== started $(date -u +%FT%TZ)"
} > "$LOG"

npx vite-node tools/ladder-vs-targets.ts -- --only 2 --seeds "$SEEDS" --policy player >> "$LOG" 2>&1
echo "RUN_EXIT=$?" >> "$LOG"
echo "=== finished $(date -u +%FT%TZ)" >> "$LOG"

git checkout -q -- tools/econ-bench.ts 2>/dev/null
exit 0

# Lane C probe – code and comment lines of the engine LEAF modules at a given SHA (review of 26.09.2026).
# Usage (from the repository root): python3 docs/review-principles-2026-09-26/probes/leaf-comment-growth.py <sha>
# Classifier: the Phase 0 rules (blank / comment by //, /*, * prefix or open block / code), per line; scope as leaf-exports.mjs.
import sys,subprocess
def cls(text):
    x=c=0;inb=False
    for l in text.split('\n'):
        t=l.strip()
        if inb:
            c+=1
            if '*/' in t: inb=False
            continue
        if t=='': continue
        if t.startswith('//') or t.startswith('*'): c+=1; continue
        if t.startswith('/*'): c+=1; inb='*/' not in t[2:]; continue
        x+=1
        if '/*' in t and '*/' not in t.split('/*',1)[1]: inb=True
    return x,c
sha=sys.argv[1]
files=subprocess.run(['git','ls-tree','-r','--name-only',sha,'src/engine'],capture_output=True,text=True).stdout.split()
ex={'src/engine/world.ts','src/engine/migrations.ts','src/engine/saveCodec.ts','src/engine/saveGuard.ts','src/engine/rng.ts'}
import re
leaf=[f for f in files if f not in ex and (re.match(r'^src/engine/[^/]+\.ts$',f) or re.match(r'^src/engine/(match|season|diary)/[^/]+\.ts$',f))]
X=C=0; per={}
for f in leaf:
    t=subprocess.run(['git','show',f'{sha}:{f}'],capture_output=True,text=True).stdout
    x,c=cls(t); X+=x;C+=c; per[f]=(x,c)
print(sha,'leaf files',len(leaf),'code',X,'comment',C,'share %.1f%%'%(100*C/(X+C)))
for f in ['src/engine/economy.ts','src/engine/season/calendar.ts','src/engine/offers.ts','src/engine/spirit.ts','src/engine/coach.ts']:
    if f in per: print(' ',f,per[f])

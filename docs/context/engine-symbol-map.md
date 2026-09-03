---
type: context-pack
status: current
area: engine-map
canonical: false
last-reviewed: 2026-09-03
---

# Engine symbol map – how to find the module that OWNS a symbol

`src/engine/world.ts` is a **compatibility barrel, not a discovery surface**. It imports the leaves
and re-exports them under their historical names, so hundreds of files can keep importing
`engine/world` while the implementation moves. That is deliberate and the public API must not change
– but it means "where does X live" cannot be answered by reading the barrel's export list.

**This page does not answer it. One command does, and it is generated from the barrel itself:**

```bash
node scripts/world-map.mjs <symbol>     # the owning module and the line, for one name
grep <partial> tools/generated/world-symbol-map.md   # the same, for a name you half-remember
```

`tools/generated/world-symbol-map.md` is the whole table – every name the barrel re-exports, the
module that declares it, and that module's own banner as the area label. It is regenerated with
`node scripts/world-map.mjs` and **checked**: `npm run map:world:check` fails when it is stale, and
both `npm run check` and CI run that on every change.

⚠ **It answers for the barrel's surface and says so when it cannot.** A symbol that `engine/world`
does not re-export – a rule module the world only calls into, a `src/shared` type – gets
`no export named '…' reaches src/engine/world.ts`, which is the signal to grep instead of a wrong
answer. That is the map working, not failing.

## Why this page no longer carries a table of its own

It used to, and it was wrong. ARCH-36 of the 02.09.2026 principles review found this page and the
generated map disagreeing about two names, `WorldState` and `SAVE_SCHEMA_VERSION`: they had moved
into an extracted module and this page still pointed them at the barrel. The generated map had them
right, because a machine had rebuilt it the same week and a check would have failed if it had not.

So the defect was never the stale row – it was **having two maps of one thing, one of them
unchecked**. A hand-written area-to-owner table stops being true the first time somebody moves a
function, and it stops silently, which is worse than having no table at all: a reader who routes
through it does not know to doubt it. The review's instruction is the fix and it is one sentence –
do not maintain two hand-edited symbol maps – so this page keeps the routing question and hands the
answer to the command that cannot go stale without a red gate.

⚠ The same rule binds the next person who wants to paste a helpful table in here: if it names an
owner, it is a second source, and it will be wrong within a wave. Point at the command.

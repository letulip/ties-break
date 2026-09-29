// A FIXTURE FOR `tests/import-cycles.test.ts` ARM 4 – the other half of the cycle. See `./hub.ts`.
//
// This is the direction `world/lifeBeat/bereavement.ts` really takes (`import { kidAgeNow,
// raiseLifeBeat } from '../lifeBeat'`): a hazard module needs the hub at RUNTIME. It is only a cycle
// when the hub reaches back, which `./hub.ts` does with a re-export – and that is precisely the shape
// CLAUDE.md's A-06 rule forbids («a hazard's names are re-exported by `world.ts` directly from the
// kind module, never through the hub»). The rule is only enforceable if this file's guard can see it.
import { hubValue } from './hub'

export const leafValue = `${hubValue}:leaf`

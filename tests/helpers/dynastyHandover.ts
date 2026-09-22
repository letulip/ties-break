// ⭐ WAVE 10 T1 – THE INHERITANCE BLOCK, FOR A FIXTURE THAT HAS NO WORLD TO BUILD IT OUT OF.
//
// `dynastyHandoverOf(world)` (engine/world/endings.ts) is the one builder the app uses; a MOUNTED
// test hands the store a hand-built `EndingView` and has no world at all, so it needs the same
// shape. `moneyOf` beside it is the precedent, and this follows its rule verbatim.
//
// ⚠ THE DEFAULT IS THE FIRST DAUGHTER OF A CAREER THAT WON NOTHING – generation 1, no titles, no
// rank, and `raisedOnTour: false`, which is the EPILOGUE variant of the door. That is deliberate:
// it is the humblest block the engine can produce, so a fixture written before this field keeps
// meaning exactly what it meant, and nothing in it licenses a single line of `дочь той самой`
// texture by accident. An arm that is ABOUT the lineage says so through `over`.
//
// ⚠ AND IT INVENTS NO FIRST NAME FOR THE DAUGHTER, because there is none to invent – «имя выбирает
// родитель» (his 20.09 ruling). `motherName` is the MOTHER's, which is what the block carries.
import type { DynastyHandover } from '../../src/shared/protocol'

export function dynastyOf(over: Partial<DynastyHandover> = {}): DynastyHandover {
  return {
    generation: 1,
    childSeed: 'fixture-seed:dynasty:1',
    background: 'middle',
    raisedOnTour: false,
    motherName: { first: 'Alice', last: 'Martin' },
    motherCountry: 'US',
    motherTemperament: 'sunny',
    motherCareer: { titles: 0, bestRank: null, slams: 0, endedWeek: 265, endingKind: 'stopped' },
    ...over,
  }
}

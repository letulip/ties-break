// R9-13/15 – ONE emotion decision for every portrait surface that is ALLOWED an emotion (the
// Home photo card and the Kid screen's big portrait), so they can never disagree. The app header
// is age-only (F45-1) and lives in ./headerAvatar.ts.
//
// DIARY-1 MOVED THE DECISION ENGINE-SIDE. This composable used to walk the snapshot's events for
// her latest result/title and call `avatarEmotion` itself; the diary's copy system needed the very
// same walk on the other side of the engine/UI line (a phrase licensed by the emotion must be the
// emotion the painting shows), and one walk in one place is the only way the image and the words
// can never disagree. The walk now lives in `engine/diary.ts` (lastKidResultOf / lastKidTitleOf,
// same predicate, same tier resolution), the engine computes the emotion into
// `snapshot.diary.facts` – with the facts only IT can know, like the rank-climb softener – and
// this composable reads the decision instead of re-making it. URL building stays here: it is
// presentation, not judgement.
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import {
  avatarCropPath,
  hasCrop,
  portraitAssetStem,
  portraitStage,
  resultShowsOnHerFace,
  wearsGraduationPortrait,
  type PortraitEmotion,
  type PortraitStage,
} from '../shared/avatarEmotion'
import { GRADUATED_ART_STEM, graduatedUrl, PREGNANT_ART_STEM, pregnantUrl } from '../art/preload'
import { ENDINGS } from '../engine/ending'

/**
 * R11-2 – which recorded matches are allowed to change her FACE. THE DEFINITION lives in
 * `shared/avatarEmotion.ts` (fix/world-trio item 3) and is re-exported here unchanged, so every
 * import path that already pointed at this module keeps working. The one walk that asks it is now
 * `engine/diary.ts` (lastKidResultOf) – the engine's facts assembly, whose emotion this composable
 * renders. Its behaviour is byte-identical – `!!e.match && !e.friendly`.
 */
export { resultShowsOnHerFace }

export function useKidEmotion() {
  const game = useGameStore()

  // THE decision, as the engine made it at snapshot time (diary facts). Fallback `norm` only for
  // the no-snapshot mount gap – every real snapshot carries a diary.
  const emotion = computed<PortraitEmotion>(() => game.snapshot?.diary.facts.emotion ?? 'norm')

  // ⭐⭐ ROUND 42 #29(a) – AND THE PAINTING IS A NARROWER QUESTION SINCE THE OWNER'S 14.09 RULING:
  // «картинки вернутся к изначальной логике только про победы и поражения», with the layoff painting
  // kept on the hero by his own «это ок». So the two big portraits (Home's hero and the Kid screen's)
  // read THIS, and `emotion` above keeps its job: the Mood tiles' word and their 36px face.
  //
  // ⚠ IT IS STILL THE ENGINE'S, AND STILL THE SAME DECISION – `heroFaceOf` is applied once, in
  // `assembleDiaryFacts`, off the very `channel` that produced `emotion`. Deriving it here from
  // `emotion` alone is not possible and must not be attempted: `happy` is both a win and a glowing
  // week, and only the channel tells them apart. That is the whole of round 42 #2.
  const heroEmotion = computed<PortraitEmotion>(() => game.snapshot?.diary.facts.heroEmotion ?? 'norm')

  // R9-16: the portrait stage follows her age (jun < 11, young 11-16, teen 17-22, adult 23-30,
  // lateCareer 31+).
  const stage = computed<PortraitStage>(() => portraitStage(game.snapshot?.ageYears ?? 14))

  // 256px card crops live in public/avatars/{stage}-{emotion}.webp. `avatarCropPath` is shared
  // with the emotion-free header (F45-1), so the two crop surfaces cannot drift apart.
  //
  // ⚠ NULL FOR A PAINTING-ONLY FACE, and it has to be able to say null (ui/art-rehab-sleepy).
  // `rehab` ships as five paintings and no crops – deliberately, because the app header is the
  // age-only `norm` of F45-1 and Home's corner crop is the same. What this may NOT do is hand a
  // card a URL that 404s, so the emotion is narrowed through `hasCrop` and the absence comes back
  // as a value the caller must handle.
  //
  // ⚠⚠ AND IT ACQUIRED CONSUMERS WHILE THE WAVE WAS BEING BUILT. The note here used to say "zero
  // consumers in src/components/" – true when it was written, false by the time three parallel
  // screens landed: screen C's Mood tile and screen D's Mood tile both render a 36px face from it.
  // The merge is where that showed up, as a type error rather than a broken image, which is the
  // whole reason the null was introduced.
  const cropUrl = computed<string | null>(() =>
    hasCrop(emotion.value)
      ? `${import.meta.env.BASE_URL}${avatarCropPath(stage.value, emotion.value)}`
      : null,
  )

  /** THE MOOD-TILE FACE, which must always resolve to something.
   *
   *  The Mood tiles on C and D are a 36px thumbnail beside a word – "Hurt", "Tired", "Steady". They
   *  are not the emotional portrait; that is the big painting, and during a layoff the big painting
   *  is `rehab`, which is exactly the change the owner asked for.
   *
   *  A thumbnail is a different surface with a different job, and it has no `rehab` crop to show.
   *  It falls back to `injury` – the closest TRUE face, and the one whose word the tile is already
   *  printing. Falling back to `norm` would have the tile say "Hurt" over a photograph of a girl who
   *  is fine, which is worse than either. */
  const moodCropUrl = computed(
    () =>
      `${import.meta.env.BASE_URL}${avatarCropPath(stage.value, hasCrop(emotion.value) ? emotion.value : 'injury')}`,
  )

  // ⭐⭐ T14 – THE ONE WEEK HER PORTRAIT IS NOT ABOUT TENNIS (owner, 11.09: «даже на главной
  // показывать неделю по окончании (если случилось окончание)»).
  //
  // ⚠ IT IS THE PICTURE ONLY, AND THAT IS THE DESIGN, not a shortcut. `emotion` below is untouched
  // on this week: it is the ENGINE's decision and it licenses the Mood tile's WORD (KidScreen's
  // `MOOD_LABEL`, the recap's `MOOD_WORD`), so a face that spoke through it would be a new
  // player-facing string – which is CLAUDE.md invariant 4 and nobody's to add unasked. The
  // graduation painting is a picture on the hero and nothing else says anything new.
  //
  // ⚠ AND THE LEAVER IS EXCLUDED BY THE SHARED PREDICATE, not by a second reading of the same
  // state: `wearsGraduationPortrait` is the popup's own test (shared/avatarEmotion.ts), so the two
  // surfaces cannot come apart on the only question that matters here.
  const college = computed(() => game.snapshot?.college ?? null)
  const graduationWeek = computed(() =>
    wearsGraduationPortrait({
      week: game.snapshot?.week ?? 0,
      doneWeek: college.value?.doneWeek ?? null,
      yearsDone: college.value?.years.length ?? 0,
      totalYears: ENDINGS.collegeYears,
    }),
  )

  // ⭐⭐⭐ v85 T10 – THE MONTHS SHE IS CARRYING, ON THE SAME TWO SURFACES (the pregnancy, wave 8).
  //
  // ⚠⚠ IT SITS AT `rehab`'s RUNG AND NOT AT THE GRADUATION'S, and that placement is the whole of the
  // decision rather than an implementation detail. Round 42 #29(a) is the owner's standing law for
  // this picture – «картинки вернутся к изначальной логике только про победы и поражения» – and the
  // file that records it reads that sentence as «results and the BIG FACTS», with the layoff
  // painting kept by his own «это ок» because «an injury is a fact of the body, not a mood». A
  // pregnancy is that same kind of fact and the largest one this layer has, so it belongs in the
  // ruling; and `rehab`'s standing inside the ruling is that a FRESH RESULT still wins, because the
  // result layer is the half round 42 #29(a) protects.
  //
  // ⚠ SO: her tennis face on a week she competed, the pregnancy painting on every other week of the
  // window. That is not a softening of §2 T10 – it is what the window actually looks like. Entries
  // shut eight weeks after the announcement and stay shut for the rest of it, so the yield costs the
  // pregnancy at most the handful of weeks she is still playing on, and those are precisely the weeks
  // a picture of a title is the true thing to show. The alternative – an unconditional override for
  // thirty-nine weeks – would paint a woman resting a hand on her belly over the week she won a
  // tournament, which is round 42 #2's own defect read backwards.
  //
  // ⚠ `resultFresh` IS THE ENGINE'S OWN FLAG AND NOT A DERIVATION FROM THE FACE. It is set in
  // `assembleDiaryFacts` off the very condition `avatarEmotionRead` enters its result branch on –
  // her latest played match falling in this week – so «a result spoke this week» has ONE reading and
  // this line reads it rather than inferring it from `heroEmotion === 'norm'`. The composable's own
  // header warns against exactly that inference for `emotion`, and the warning generalises.
  // ⚠⚠ AND THE WALK STAYS ENGINE-SIDE, which is this file's standing law and is pinned NEGATIVELY
  // (`tests/diary.test.ts`: the composable «must not have kept a copy»). Reading a boolean the
  // engine already computed is the opposite of re-making the walk, and this comment names no field
  // of that walk on purpose – the pin reads the file's raw text, comments included, and it caught
  // this note in its first draft.
  const pregnancyFace = computed(() => game.snapshot?.pregnancyFace ?? null)
  const pregnancyWeek = computed(
    () => pregnancyFace.value !== null && game.snapshot?.diary.facts.resultFresh !== true,
  )

  // Full-size paintings: public/images/fem-euro-brunnet/fem-euro-brunnet-{stage}-{emotion}.webp
  // (every stage×emotion exists, adult and the painting-only `rehab` included) – or, for one week,
  // the single graduation painting, which has no band and no emotion in its name; or, through a
  // pregnancy, one of the two paintings that have no band either.
  // ⭐ ROUND 42 #29(a): `heroEmotion`, not `emotion` – the results-and-big-facts read. See above.
  //
  // ⚠ THE GRADUATION IS ASKED FIRST AND THAT ORDER IS ARGUED RATHER THAN ALPHABETICAL. Its window is
  // ONE week and it never comes back (`doneWeek` does not move again), where the pregnancy's runs
  // twenty-seven plus twelve; a rule that let the long window win would delete the graduation picture
  // from the only week it can ever be shown, and the pregnancy would not miss the one it lost.
  // ⚠ AND THE COLLISION IS NOT REACHABLE ON THIS TREE, which is why the order is a total function's
  // courtesy and not a live tie-break: the fork is asked at nineteen and the course is four years, so
  // `doneWeek` lands by twenty-three, while the marriage door is 23+ and the hazard's first rung is
  // 24. Answered anyway – `portraitStage`'s own rule, «a total function cannot be made wrong by a
  // future caller».
  const portraitUrl = computed(() =>
    graduationWeek.value
      ? graduatedUrl()
      : pregnancyWeek.value
        ? pregnantUrl(pregnancyFace.value!)
        : `${import.meta.env.BASE_URL}images/fem-euro-brunnet/fem-euro-brunnet-${stage.value}-${heroEmotion.value}.webp`,
  )

  /** WHICH PAINTING THE HERO IS FRAMING, as the key art/faceRects files it under. It exists because
   *  `portraitUrl` can now point at a picture whose stem is not `{stage}-{emotion}`: a caller that
   *  rebuilt that stem by hand would steer the graduation week's crop by the face position of a
   *  painting that is not on screen. One value, so the URL and the framing cannot disagree.
   *  ⚠ v85 T10 – AND THE PREGNANCY PAIR IS THE SECOND SUCH PICTURE, which is why the branch here is
   *  the same branch as above rather than a second reading of the same question. Both paintings have
   *  a row in `art/faceRects`, so Home's hero frames them on her face; without one `facePoint` would
   *  answer 50/50, and on these two canvases that is her hands. */
  const portraitStem = computed(() =>
    graduationWeek.value
      ? GRADUATED_ART_STEM
      : pregnancyWeek.value
        ? PREGNANT_ART_STEM[pregnancyFace.value!]
        : `${portraitAssetStem(stage.value)}-${heroEmotion.value}`,
  )

  return { emotion, heroEmotion, stage, cropUrl, moodCropUrl, portraitUrl, portraitStem }
}

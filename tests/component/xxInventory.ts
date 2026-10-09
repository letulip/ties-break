// THE CARPET'S INVENTORY – wave L4-2. «Every screen and dialog» is only a claim until something names the ones that are NOT in it, so
// every `.vue` under src/components is accounted for in exactly one of three places, and the instrument test (i18n-l4-2-xx-carpet-instrument)
// holds the three to the directory BOTH ways – a component added to the app without a carpet decision is red:
//   MOUNTED      imported by one of the four registries (derived from the files' own import lines – nothing to keep in sync here);
//   CONTAINED    rendered INSIDE a mounted surface – the value names the surface, and the carpet asserts at run time that the surface's
//                mounted tree really holds the component (the walk of `renderedComponents`), so the claim cannot rot into a lie;
//   NOT_MOUNTED  in no surface the carpet poses – the value says why. Each is a gap in the pass, listed by name.

export const CONTAINED: Readonly<Record<string, string>> = {
  AlbumChapterRail: 'AlbumScreen',
  AlbumDoodleMark: 'AlbumScreen',
  AlbumLayoutA: 'AlbumScreen',
  AlbumLayoutB: 'AlbumScreen',
  AlbumLayoutC: 'AlbumScreen: layout C',
  AlbumNoteCard: 'AlbumScreen',
  AlbumPaper: 'AlbumScreen',
  AlbumPatch: 'AlbumScreen',
  AlbumPhoto: 'AlbumScreen',
  AlbumSheet: 'AlbumScreen',
  AlbumSheetTitle: 'AlbumScreen',
  AlbumTagCard: 'AlbumScreen: layout C',
  AlbumTicketPass: 'AlbumScreen',
  AppIcon: 'TierGuide',
  Card: 'WeekRecapCard',
  ConfirmDialog: 'ConfirmDialog (More: delete career)',
  CountingResultsTable: 'StatsScreen',
  Eyebrow: 'WeekRecapCard',
  FeedbackDialog: 'FeedbackDialog (More: saves)',
  HerWeekTab: 'CoachMarketScreen (her week)',
  IconButton: 'TierGuide',
  InboxSheet: 'InboxSheet: open letter',
  MatchControls: 'MatchViewer: replay',
  MatchScene: 'PracticeFlow',
  MoreScreen: 'MoreScreen: Play',
  MuteButton: 'ChildhoodPrologue: opening',
  OfferLetter: 'InboxSheet: open letter',
  PaperNote: 'WeekRecapCard',
  PlanPresetRow: 'ThisWeekScreen',
  Polaroid: 'HomeScreen',
  PrimaryPill: 'TournamentFlow',
  ProgressRing: 'NextTournamentPanel',
  ScreenShell: 'HomeScreen',
  SegmentedRow: 'BracketTabs',
  ShopPanel: 'MoneyScreen: Shop',
  StatRow: 'MoneyScreen: Spending',
  StoreError: 'TournamentFlow',
  SurfaceMark: 'NextTournamentPanel',
  TakeoverShell: 'TournamentFlow',
  WeatherPlate: 'NextTournamentPanel',
}

export const NOT_MOUNTED: Readonly<Record<string, string>> = {
  AlbumChaptersSheet: 'opened by the album foot\'s Chapters button (AlbumScreen.vue:353); no pose presses it',
  AlbumFillerPhoto: 'drawn on a sheet with a free slot (AlbumLayoutB.vue:86, AlbumLayoutC.vue:56); the fixture book\'s sheets all carry `filler: null`',
  BoxScoreTable: 'the post-match box score (PracticeFlow.vue:240, TournamentFlow.vue:1301); the flows are posed before the result is revealed',
  ConfettiBurst: 'the champion poster (TournamentFlow.vue:1398) and a birthday-week Home (HomeScreen.vue:1427); neither state is posed',
}

# Privacy

**Everything stays on your device.** Ties Break: Ace Parent has no accounts, no analytics,
no cookies, no ads, and makes no third-party network requests.

- The app's only network traffic is loading its own files from its own origin – pages,
  scripts, images, fonts, sounds (including a same-origin existence probe for sound files,
  `src/audio/sfx.ts`). Nothing you do in the game is sent anywhere.
- All game data lives in your browser's storage on your device: careers and saves –
  including the child's chosen name and birthday (month and day) you enter at onboarding –
  in IndexedDB; small UI preferences (sound, music, haptics and similar toggles, "seen"
  markers) in localStorage.
- Export files (`.tsave`) are created locally and go only where you yourself put them.
  Importing reads the file locally. No copy is uploaded.
- A service worker caches the app's files so it works offline. That cache holds app assets,
  not your personal data.
- Deleting the site's browser data (or the installed app) removes everything – there is no
  server-side copy to ask anyone to delete.
- The game is served as static files by GitHub Pages; like any web host, GitHub sees
  standard request logs (governed by GitHub's own privacy statement). The app adds nothing
  to them.
- Questions: open a [GitHub Issue](https://github.com/letulip/ties-break/issues).

This document will change before any networked feature (cloud backup, ads) ships.

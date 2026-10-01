# Uploading the Steam depot – Valve's own steamcmd, nothing stored here

1. Fill `steamAppId` and `steamDepotId` in `shells/config.json`, then `npm run shell:win` – it renders `shells/out/win/steam/app_build.vdf` and `depot_build.vdf` beside `win-unpacked/`, the folder the depot ships (the .vdf files in this directory are the templates it renders from).
2. Install Valve's SteamCMD (https://developer.valvesoftware.com/wiki/SteamCMD) and run `steamcmd +login <your_build_account> +run_app_build "$PWD/shells/out/win/steam/app_build.vdf" +quit`.
3. steamcmd prompts for the password and the Steam Guard code itself – neither is read from or written to this repo – and `SetLive` stays empty, so the build waits on a branch you set live in the Steamworks partner site.

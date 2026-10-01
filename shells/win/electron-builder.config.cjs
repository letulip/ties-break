'use strict'
// electron-builder config for the Windows shell. Names and ids come from shells/config.json (the one
// file every shell reads) and the version from the root package.json, so nothing is stated twice.
// Targets are not here: build.mjs passes them (default nsis + dir; SHELL_WIN_TARGETS overrides).
const path = require('node:path')
const config = require('../config.json')
const rootPackage = require('../../package.json')

const shells = path.resolve(__dirname, '..')
const repo = path.resolve(__dirname, '..', '..')

module.exports = {
  appId: config.appId,
  productName: config.productName,
  extraMetadata: { version: rootPackage.version },
  directories: { output: path.join(shells, 'out', 'win') },
  // Listed explicitly so a stray file in shells/win/ can never ride into an installer: the main
  // process, the shared config, and the SAME dist/ every shell wraps.
  files: [
    'main.js',
    { from: shells, to: '.', filter: ['config.json'] },
    { from: path.join(repo, 'dist'), to: 'dist', filter: ['**/*'] },
  ],
  asar: true,
  // steamworks.js loads a native .node and a Steam dll; neither can be read from inside the archive.
  asarUnpack: ['node_modules/steamworks.js/dist/**'],
  npmRebuild: false,
  win: {
    icon: path.join(repo, 'public', 'pwa-512.png'),
    // Rewriting the exe (icon, version info, signing) needs wine anywhere but Windows. Off a Windows
    // machine the exe keeps Electron's own icon and main.js sets the window icon at runtime instead.
    signAndEditExecutable: process.platform === 'win32',
  },
  nsis: { oneClick: false, perMachine: false, allowToChangeInstallationDirectory: true },
}

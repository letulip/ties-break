// The iOS shell's report bridge. build.mjs copies this file beside the SYNCED index.html and loads it with
// a plain <script> BEFORE the app's module script, so `window.__TIES_SHELL_BRIDGE__` exists when
// src/main.ts boots and hands it to the report slot (ReportBridge in src/feedback.ts). Nothing in src
// names this shell or Capacitor: the contract is the global and the signature below, nothing more.
//
// THE CONTRACT (the feedback spec's F1, which the app honours): resolve `true` when the shell TOOK the
// report – that includes a player who opens the sheet and then cancels it, or he would be handed a
// download he just declined. Resolve `false` (or throw) only when this shell has no way to send it; the
// app then runs its own fallback (download + mailto).
//
// No bundler: the runtime is `window.Capacitor`, and the native side lists every installed plugin on
// `Capacitor.Plugins`, so nothing is imported.
//
// This file is evaluated as TEXT by tests/shell-bridge-wiring.test.ts against stand-in plugins.
(function () {
  'use strict'

  // Filesystem's `directory` takes this string; it is the enum's value, spelled out because nothing is imported.
  // The OS may reclaim the cache, and a one-off report file is exactly what belongs there.
  var CACHE_DIRECTORY = 'CACHE'

  /** The bytes as base64: what Filesystem.writeFile takes as `data` when no encoding is given. */
  function toBase64(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader()
      reader.onerror = function () {
        reject(reader.error)
      }
      reader.onload = function () {
        // `data:<type>;base64,<payload>`
        resolve(String(reader.result).split(',')[1] || '')
      }
      reader.readAsDataURL(blob)
    })
  }

  /** Capacitor's web implementation rejects a dismissed sheet ("Share canceled"); the native iOS one
   *  resolves `{ completed: false }` and never reaches here. Either way the shell took it. */
  function isCancel(err) {
    return /cancel|abort|dismiss/i.test(String((err && (err.message || err.name)) || err))
  }

  /** A flat, filesystem-safe name: Filesystem.writeFile makes no directories without `recursive`. */
  function cacheName(file) {
    return String(file.name || '').replace(/[^A-Za-z0-9._-]/g, '_') || 'ties-break-report'
  }

  window.__TIES_SHELL_BRIDGE__ = async function shellBridge(report) {
    var capacitor = window.Capacitor
    var plugins = capacitor && capacitor.Plugins
    var share = plugins && plugins.Share
    // No share plugin: this shell cannot send anything. The app falls through to its own path.
    if (!share) return false

    var options = { title: String(report.text).split('\n')[0], text: report.text }

    // A file goes through the cache directory: the share sheet takes file URIs, not bytes.
    if (report.file) {
      var filesystem = plugins.Filesystem
      // A report whose save file cannot be attached is worse than the fallback, which downloads it.
      if (!filesystem) return false
      var written = await filesystem.writeFile({
        path: cacheName(report.file),
        data: await toBase64(report.file),
        directory: CACHE_DIRECTORY,
      })
      options.files = [written.uri]
    }

    try {
      await share.share(options)
    } catch (err) {
      if (isCancel(err)) return true
      throw err
    }
    return true
  }
})()

// ROUTE 8 OF RU-14: PWA / OFFLINE, ON THE SERVICE-WORKER BUILD (L4-3).
//
// RU-14's row reads «install under ru, open without a network, check title / lang / manifest / privacy route; the English mode must
// not get a Russian document label». What the harness can reach of it is everything except the install prompt itself (the browser's
// own dialog, which is not the game's – RU-13C §3) and the two phones' home-screen label:
//
//   · the document: `<html lang>` follows the locale, `<title>` stays the product mark;
//   · the manifest: ONE static file for both languages, the product mark in English (spec §9.5 / his №5), no Cyrillic, and its
//     `description` is the deferred L4 item – read, not filled;
//   · the privacy route: the About link is locale-aware (src/composables/privacyRoute.ts) and the Russian document slot is EMPTY,
//     so under `ru` it still names the English document – asserted, together with the English mode's link;
//   · the service worker: installs, takes the second visit, and with the network CUT the app boots in Russian – which is only
//     possible if the lazily-loaded `ru` catalog chunk is in the precache. That last fact is the one this route exists to measure.
//
// ⚠ ONE LIMIT, STATED: Chromium on a desktop viewport, no install prompt, no iOS Safari «Add to Home Screen» – the label under the
// icon and the install sheet's description are the platform's, read by him on a phone (RU-13C §3).
import { clearBlockingCards, expect, test, bootCareer, hookReady, nameOf, tabButton, DOOR, RU } from './kit'

const CYRILLIC = /[\u0400-\u04FF]/

test('route 8 – PWA / offline under ru: the document, the manifest, the privacy route, the catalog with the network cut', async ({ page, context, careerAt, lqa }) => {
  const rec = lqa(8, 'a', 'PWA / offline (service-worker build)')
  await bootCareer(careerAt, 'junior')
  await hookReady(page)
  rec.recover = async () => undefined
  await rec.step('boot', async () => {
    await clearBlockingCards(rec)
  })
  await rec.clear()

  // --- the document ---------------------------------------------------------------------------
  const doc = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    title: document.title,
    manifestHref: document.querySelector('link[rel="manifest"]')?.getAttribute('href') ?? '',
  }))
  expect(doc.lang, '<html lang> under tb-locale=ru').toBe('ru')
  rec.note(`document: lang=${doc.lang}, title="${doc.title}", manifest link="${doc.manifestHref}"`)
  await rec.visit('online › Home', { documentLang: doc.lang, documentTitle: doc.title })

  // --- the manifest: one static file, the product mark ----------------------------------------
  await rec.step('manifest', async () => {
    const manifest = (await page.evaluate((href) => fetch(href).then((r) => r.json()), doc.manifestHref)) as Record<string, unknown>
    const text = JSON.stringify(manifest)
    expect(CYRILLIC.test(text), 'the one static manifest carries no Cyrillic').toBe(false)
    expect(manifest.name, 'manifest name = the approved product mark').toBe('Ties Break: Ace Parent')
    expect(manifest.short_name).toBe('Ties Break')
    rec.note(`manifest: name="${String(manifest.name)}", short_name="${String(manifest.short_name)}", description="${String(manifest.description)}" (the description is the deferred L4 item – read, not filled), lang field: ${manifest.lang === undefined ? 'absent' : String(manifest.lang)}`)
  })

  // --- the privacy route ----------------------------------------------------------------------
  await rec.step('privacy route', async () => {
    await tabButton(page, 'home').click()
    await page.locator(DOOR.settings).click()
    const group = page.getByRole('group', { name: nameOf('Which settings') })
    await expect(group).toBeVisible()
    const tabs = await group.getByRole('button').count()
    let href = ''
    for (let i = 0; i < tabs && !href; i++) {
      await group.getByRole('button').nth(i).click()
      const link = page.locator('a[href*="PRIVACY"]').first()
      if (await link.count()) href = (await link.getAttribute('href')) ?? ''
    }
    expect(href, 'the About row links a privacy document').not.toBe('')
    expect(href, 'under ru the Russian document slot is empty, so the route serves the English document unchanged').toMatch(/PRIVACY\.md$/)
    await rec.visit('More › About (the privacy row)', { privacyHref: href })
  })

  // --- the service worker, and the network cut ------------------------------------------------
  await rec.step('service worker installs', async () => {
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined))
    await page.reload()
    await page.getByRole('button', { name: nameOf('Tap to start') }).click()
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true)
    await hookReady(page)
    await rec.clear()
  })
  await rec.step('offline boot in Russian', async () => {
    await context.setOffline(true)
    await page.reload()
    const networkIsDown = await page.evaluate(() => fetch(`/offline-probe-${Date.now()}`, { cache: 'no-store' }).then(() => false, () => true))
    expect(networkIsDown, 'the network was still reachable – this run proves nothing').toBe(true)
    await page.getByRole('button', { name: nameOf('Tap to start') }).click()
    await hookReady(page)
    // The decisive fact: the Home tab reads what ru.json says for it, with no network – so the lazily-loaded ru chunk came from the precache.
    const homeLabel = await tabButton(page, 'home').innerText()
    const expected = RU['Home']
    const fromCatalog = expected !== undefined && homeLabel.trim() === expected
    rec.note(`offline: the Home tab reads ${expected === undefined ? 'English (ru.json has no Home row)' : fromCatalog ? 'the catalog\'s Russian' : `"${homeLabel.trim()}" – NOT the catalog's value`}`)
    expect(expected === undefined || fromCatalog, 'with the network cut the Russian catalog must still be served (precache)').toBe(true)
    await rec.visit('offline › Home', { catalogOffline: fromCatalog, htmlLang: await page.evaluate(() => document.documentElement.lang) })
  })
  rec.note('limits: Chromium desktop only – the install prompt and the home-screen label (Android / iOS) are the platform\'s, read by hand; the manifest has one description for both languages (deferred)')
  if (rec.verdict === 'driven') rec.why = 'document, manifest, privacy route, service-worker install and an offline boot in Russian; the install prompt and the home-screen label are the platform\'s'
  else rec.why = `${rec.why}; the install prompt and the home-screen label are the platform's`
})

test('route 8b – the English mode gets no Russian document label', async ({ page, careerAt, lqa }) => {
  const rec = lqa(8, 'b', 'PWA – the English mode (negative control)')
  await careerAt('junior', { localStorage: { 'tb-locale': 'en', 'tb:onboardingTourSeen': '1' } })
  await hookReady(page, 'en')
  rec.recover = async () => undefined
  await rec.step('boot', async () => {
    await clearBlockingCards(rec)
  })
  const doc = await page.evaluate(() => ({ lang: document.documentElement.lang, title: document.title }))
  expect(doc.lang, '<html lang> under tb-locale=en').toBe('en')
  rec.note(`english: lang=${doc.lang}, title="${doc.title}"`)
  await rec.step('privacy route (en)', async () => {
    await tabButton(page, 'home').click()
    await page.locator(DOOR.settings).click()
    const group = page.getByRole('group', { name: 'Which settings' })
    await expect(group).toBeVisible()
    const tabs = await group.getByRole('button').count()
    let href = ''
    for (let i = 0; i < tabs && !href; i++) {
      await group.getByRole('button').nth(i).click()
      const link = page.locator('a[href*="PRIVACY"]').first()
      if (await link.count()) href = (await link.getAttribute('href')) ?? ''
    }
    expect(href).toMatch(/PRIVACY\.md$/)
    rec.note(`english privacy href: ${href}`)
  })
  // This part has no counter to read (the hook reports ru-only misses; English never counts): a pure negative control.
  rec.visits.push({ label: 'english mode (no counter – English never misses)', misses: 0, keys: [], capped: false, facts: { htmlLang: doc.lang } })
  if (rec.verdict === 'driven') rec.why = 'html lang and the privacy link in English are unchanged'
})

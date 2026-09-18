// Exports every profile tile twice, once per theme, at 2x with transparent corners.
// Same approach as trek-releases/export.mjs: one element per file, so each tile can
// carry its own link in the README.
//
//   node export.mjs

import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'

const HERE = resolve('.')
const OUT = join(HERE, 'build')
const TILES = ['hero', 'trek', 'tune', 'stack-fe', 'stack-be', 'stack-infra', 'link-discord', 'link-demo', 'link-kofi']

const browser = await chromium.launch()
const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 940, height: 1400 } })
await mkdir(OUT, { recursive: true })

for (const theme of ['dark', 'light']) {
  await page.goto(pathToFileURL(join(HERE, 'tiles.html')).href)
  await page.evaluate((t) => {
    document.body.className = t
    // The wordmark is black on light plates and white on dark ones.
    const mark = document.getElementById('trekmark')
    if (mark) mark.setAttribute('src', t === 'dark' ? 'build/trek-wordmark-light.svg' : 'build/trek-wordmark-dark.svg')
    document.body.style.background = 'transparent'
  }, theme)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(400)

  for (const id of TILES) {
    const el = page.locator(`#${id}`)
    await el.screenshot({ path: join(OUT, `${id}-${theme}.png`), omitBackground: true })
    process.stdout.write(`${id}-${theme}.png\n`)
  }
}

await browser.close()

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
/** Transparent margin baked into every tile, in CSS pixels. */
const PAD = 4
const TILES = ['hero', 'trek', 'tune', 'stack-fe', 'stack-be', 'stack-infra', 'link-discord', 'link-demo', 'link-docker', 'link-kofi']

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
    // Four transparent pixels all round. Markdown cannot put a gap between two
    // images without also putting a line break there, so the gap travels inside
    // the picture: two tiles side by side then sit eight pixels apart.
    const box = await page.locator(`#${id}`).boundingBox()
    await page.screenshot({
      path: join(OUT, `${id}-${theme}.png`),
      clip: { x: box.x - PAD, y: box.y - PAD, width: box.width + PAD * 2, height: box.height + PAD * 2 },
      omitBackground: true,
    })
    process.stdout.write(`${id}-${theme}.png
`)
  }
}

await browser.close()

// Pulls today's numbers into tiles.html. Only the four figures change; every
// style, size and colour stays exactly where it is, because the same template is
// rendered afterwards.
//
//   node refresh.mjs        (then: node export.mjs)

import { readFile, writeFile } from 'node:fs/promises'

const REPO = 'liketrek/TREK'
const IMAGE = 'mauriceboe/trek'

const headers = { 'user-agent': 'profile-tiles' }
if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`

async function json(url) {
  const r = await fetch(url, { headers })
  if (!r.ok) throw new Error(`${url} -> HTTP ${r.status}`)
  return r.json()
}

/** 14020 -> "14.0<span>k</span>", 1179648 -> "1.18<span>M</span>". */
function compact(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}<span>M</span>`
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}<span>k</span>`
  if (n >= 1000) return `${(n / 1000).toFixed(2)}<span>k</span>`
  return String(n)
}

const repo = await json(`https://api.github.com/repos/${REPO}`)
const docker = await json(`https://hub.docker.com/v2/repositories/${IMAGE}/`)
const releases = await json(`https://api.github.com/repos/${REPO}/releases?per_page=1`)
// The locales live one directory per language; counting them beats hardcoding.
const locales = await json(`https://api.github.com/repos/${REPO}/contents/shared/src/i18n`)

const stats = {
  stars: compact(repo.stargazers_count),
  pulls: compact(docker.pull_count),
  // Every locale is a directory named like a language tag. "externalNotifications"
  // also lives here and is not a language, so the shape of the name decides.
  languages: String(locales.filter((e) => e.type === 'dir' && /^[a-z]{2}(-[A-Za-z]{2,4})?$/.test(e.name)).length || 23),
  release: releases[0]?.tag_name ?? 'v4.2.1',
}

let html = await readFile('tiles.html', 'utf8')
for (const [key, value] of Object.entries(stats)) {
  // Plain string surgery rather than a regex: the anchor is exact, and an escape
  // slipping through a template literal is exactly how this kind of script breaks.
  const open = `<div class="fig" data-stat="${key}">`
  const start = html.indexOf(open)
  if (start === -1) throw new Error(`no anchor for ${key}`)
  const end = html.indexOf('</div>', start)
  html = html.slice(0, start + open.length) + value + html.slice(end)
}
await writeFile('tiles.html', html)
console.log(Object.entries(stats).map(([k, v]) => `${k}: ${v.replace(/<[^>]+>/g, '')}`).join(' · '))

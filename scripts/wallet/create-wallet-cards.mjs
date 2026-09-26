#!/usr/bin/env node
// Creates one WalletWallet membership card per member and writes their install
// links to a CSV. Run it on your own computer: member data never goes in this
// repository, and the API key only ever comes from the environment.
//
//   export WALLETWALLET_API_KEY=ww_live_...
//   node scripts/wallet/create-wallet-cards.mjs --members members.csv --limit 1
//
// `members.csv` is the Members tab exported from Google Sheets
// (File → Download → CSV). Rows whose Status is `Ex-member` are skipped.
// Re-running is safe: members already marked `ok` in the output are skipped.

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const API_URL = 'https://api.walletwallet.dev/api/passes'
const HERE = dirname(fileURLToPath(import.meta.url))

const args = parseArgs(process.argv.slice(2))
if (!args.members) {
  exit('Usage: create-wallet-cards.mjs --members members.csv [--out wallet-links.csv] [--strip strip.png] [--limit N] [--dry-run]')
}
const apiKey = process.env.WALLETWALLET_API_KEY
if (!apiKey && !args['dry-run']) exit('Set WALLETWALLET_API_KEY in your environment first.')

const outPath = args.out ?? 'wallet-links.csv'
const stripPath = args.strip ?? join(HERE, 'strip.png')
const limit = args.limit ? Number(args.limit) : Infinity

const stripURL = existsSync(stripPath)
  ? `data:image/png;base64,${readFileSync(stripPath).toString('base64')}`
  : undefined
if (!stripURL) console.warn(`No strip image at ${stripPath}; cards will have no banner.`)

const members = readMembers(args.members)
const done = readDone(outPath)
const results = [...done.values()]
const todo = members.filter((m) => !done.has(m.name)).slice(0, limit)

console.log(`${members.length} active members, ${done.size} already done, creating ${todo.length}.`)

for (const member of todo) {
  const body = cardFor(member, stripURL)
  if (args['dry-run']) {
    console.log(JSON.stringify({ ...body, stripURL: body.stripURL && '(image)' }, null, 2))
    continue
  }
  const result = await createCard(body)
  results.push({ name: member.name, ...result })
  console.log(`${result.status === 'ok' ? '✓' : '✗'} ${member.name} ${result.link || result.error}`)
  writeResults(outPath, results)
  await sleep(300)
}

function cardFor(member, strip) {
  // Same design as the hand-made test card. The QR code opens the member's
  // LinkedIn, so scanning someone's card at an event connects you with them.
  return {
    ...(member.linkedin && { barcodeValue: member.linkedin, barcodeFormat: 'QR' }),
    organizationName: 'Pridetech',
    colorPreset: 'blue',
    color: '#ffffff',
    ...(strip && { stripURL: strip }),
    primaryFields: [{ label: 'Name', value: member.name }],
    secondaryFields: [{ label: 'MEMBER', value: 'PrideTech Community' }],
  }
}

async function createCard(body) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    })
    const text = await response.text()
    if (!response.ok) return { status: 'error', link: '', error: `HTTP ${response.status}: ${text}`, raw: text }
    const data = JSON.parse(text)
    return { status: 'ok', link: findLink(data), error: '', raw: text }
  } catch (error) {
    return { status: 'error', link: '', error: String(error), raw: '' }
  }
}

// The response format is not confirmed yet, so take the first thing that looks
// like an install link and keep the raw response alongside it.
function findLink(data) {
  const queue = [data]
  while (queue.length) {
    const value = queue.shift()
    if (typeof value === 'string' && /^https?:\/\//.test(value)) return value
    if (value && typeof value === 'object') queue.push(...Object.values(value))
  }
  return ''
}

function readMembers(path) {
  const [header, ...rows] = parseCsv(readFileSync(path, 'utf8'))
  const column = (name) => header.findIndex((h) => h.trim().toLowerCase() === name)
  const nameAt = column('name')
  const linkedinAt = column('linkedin')
  const statusAt = column('status')
  if (nameAt < 0) exit(`${path} has no "Name" column.`)
  return rows
    .map((row) => ({
      name: (row[nameAt] ?? '').trim(),
      linkedin: normaliseUrl(row[linkedinAt] ?? ''),
      status: (row[statusAt] ?? '').trim(),
    }))
    .filter((m) => m.name && m.status.toLowerCase() !== 'ex-member')
}

function normaliseUrl(value) {
  const url = value.trim()
  if (!url) return ''
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

function readDone(path) {
  const done = new Map()
  if (!existsSync(path)) return done
  const [, ...rows] = parseCsv(readFileSync(path, 'utf8'))
  for (const [name, status, link, error, raw] of rows) {
    if (status === 'ok') done.set(name, { name, status, link, error, raw })
  }
  return done
}

function writeResults(path, rows) {
  const lines = [['name', 'status', 'link', 'error', 'raw']]
  for (const r of rows) lines.push([r.name, r.status, r.link, r.error, r.raw])
  writeFileSync(path, lines.map((cells) => cells.map(csvCell).join(',')).join('\n') + '\n')
}

function csvCell(value) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell); rows.push(row); row = []; cell = ''
    } else cell += c
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows
}

function parseArgs(argv) {
  const parsed = {}
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, '')
    const next = argv[i + 1]
    if (next === undefined || next.startsWith('--')) parsed[key] = true
    else { parsed[key] = next; i++ }
  }
  return parsed
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function exit(message) {
  console.error(message)
  process.exit(1)
}

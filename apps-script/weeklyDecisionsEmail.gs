/*
  Every Saturday morning, emails the team the applications decided on the
  Leads tab over the past week: who was approved, declined and kept for later
  (Maybe), each group with its email addresses on one line, ready to paste
  into a welcome email.

  A week is picked by the Decided on column, which the CRM fills in with the
  day of every decision it records. An application whose status was changed
  by hand in the sheet has no date there unless one is typed in, so it is not
  in the email.

  Every name here starts with "weekly" because all of these scripts can share
  one Apps Script project, where top-level names must not repeat.

  Setup is in apps-script/README.md.
*/

const WEEKLY_DECISIONS_TO = 'pridetechtlv@gmail.com'
const WEEKLY_DECISIONS_SENDER_NAME = 'PrideTech CRM'
const WEEKLY_DECISIONS_TIME_ZONE = 'Asia/Jerusalem'
const WEEKLY_DECISIONS_HOUR = 8
const WEEKLY_DECISIONS_LEADS_TAB = 'Leads'

/* The header wordings the CRM accepts (src/sheets/columnAliases.ts). */
const WEEKLY_DECISIONS_HEADERS = {
  name: ['name', 'full name'],
  email: ['email', 'your email', 'e-mail', 'mail', 'email address'],
  status: ['status'],
  decidedOn: ['decided on', 'decided at', 'decision date', 'date decided'],
}

/* The statuses the CRM writes, in the order the email lists them. */
const WEEKLY_DECISIONS_GROUPS = [
  { title: 'Approved', statuses: ['approved'] },
  { title: 'Declined', statuses: ['declined'] },
  { title: 'Maybe', statuses: ['maybe in the future', 'maybe'] },
]

const WEEKLY_ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

const weeklyNormalize = (value) =>
  String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase()

const weeklyFindColumn = (headerRow, headers) => {
  const normalized = headerRow.map(weeklyNormalize)
  for (const header of headers) {
    const index = normalized.indexOf(header)
    if (index !== -1) {
      return index
    }
  }
  return -1
}

const weeklyHtml = (text) =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/* `2026-11-21` as `21 Nov 2026`: spelled out, so nobody reads 11/21 as a
   different day. */
const weeklyReadableDay = (isoDay) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const [year, month, day] = isoDay.split('-')
  return `${Number(day)} ${months[Number(month) - 1]} ${year}`
}

/* Who was decided on each day from `fromDay` to `toDay`, both included, as
   ISO days. `toIsoDay` turns a Decided on cell into one: the CRM writes the
   day as text, and a date typed by hand arrives as a Date. Kept free of
   SpreadsheetApp and MailApp so it can be run outside Google. */
const weeklyCollectDecisions = ({ rows, fromDay, toDay, toIsoDay }) => {
  const [headerRow, ...dataRows] = rows
  const columns = headerRow === undefined
    ? undefined
    : {
        name: weeklyFindColumn(headerRow, WEEKLY_DECISIONS_HEADERS.name),
        email: weeklyFindColumn(headerRow, WEEKLY_DECISIONS_HEADERS.email),
        status: weeklyFindColumn(headerRow, WEEKLY_DECISIONS_HEADERS.status),
        decidedOn: weeklyFindColumn(headerRow, WEEKLY_DECISIONS_HEADERS.decidedOn),
      }
  if (columns === undefined || columns.status === -1 || columns.decidedOn === -1) {
    throw new Error(
      `The ${WEEKLY_DECISIONS_LEADS_TAB} tab needs a Status column and a Decided on column — check its header row.`,
    )
  }

  const groups = WEEKLY_DECISIONS_GROUPS.map((group) => ({ title: group.title, people: [] }))
  dataRows.forEach((row) => {
    const day = toIsoDay(row[columns.decidedOn])
    if (day === undefined || day < fromDay || day > toDay) {
      return
    }
    const status = weeklyNormalize(row[columns.status])
    const groupIndex = WEEKLY_DECISIONS_GROUPS.findIndex((group) => group.statuses.includes(status))
    if (groupIndex === -1) {
      return
    }
    const email = columns.email === -1 ? '' : String(row[columns.email] ?? '').trim()
    const name = columns.name === -1 ? '' : String(row[columns.name] ?? '').trim()
    const people = groups[groupIndex].people
    /* Somebody who sent the form twice is one person to welcome. */
    if (email !== '' && people.some((person) => weeklyNormalize(person.email) === weeklyNormalize(email))) {
      return
    }
    people.push({ name: name === '' ? email : name, email })
  })
  return groups
}

/* The subject says the counts, so the inbox alone answers "anything this
   week?". Each group carries its addresses on one line, comma-separated, which
   Gmail's To and Bcc fields take as they are. */
const weeklyComposeEmail = ({ groups, fromDay, toDay }) => {
  const period = `${weeklyReadableDay(fromDay)} – ${weeklyReadableDay(toDay)}`
  const counts = groups.map((group) => `${group.people.length} ${group.title.toLowerCase()}`).join(', ')
  const total = groups.reduce((sum, group) => sum + group.people.length, 0)
  const subject = `PrideTech decisions, ${period}: ${counts}`
  const note =
    'Only applications with a Decided on date are listed: the CRM dates every decision it records, and a status changed by hand in the sheet needs a date typed in to show up here.'

  const textGroups = groups.map((group) => {
    const emails = group.people.map((person) => person.email).filter((email) => email !== '')
    const lines = group.people.map(
      (person) => `- ${person.name}${person.email === '' ? ' (no email)' : ` <${person.email}>`}`,
    )
    return [
      `${group.title.toUpperCase()} (${group.people.length})`,
      group.people.length === 0 ? 'Nobody this week.' : `Emails: ${emails.join(', ')}`,
      ...lines,
    ].join('\n')
  })
  const body = [
    `Applications decided ${period}.`,
    total === 0 ? 'No decisions were recorded this week.' : '',
    ...textGroups,
    note,
  ]
    .filter((part) => part !== '')
    .join('\n\n')

  const htmlGroups = groups.map((group) => {
    const emails = group.people.map((person) => person.email).filter((email) => email !== '')
    if (group.people.length === 0) {
      return `<h3>${group.title} (0)</h3><p>Nobody this week.</p>`
    }
    const list = group.people
      .map(
        (person) =>
          `<li>${weeklyHtml(person.name)}${person.email === '' ? ' <i>(no email)</i>' : ` &lt;${weeklyHtml(person.email)}&gt;`}</li>`,
      )
      .join('')
    return [
      `<h3>${group.title} (${group.people.length})</h3>`,
      emails.length === 0
        ? ''
        : `<p><b>Emails, ready to paste:</b><br><span style="font-family:monospace;background:#f3f0ff;padding:4px 6px;display:inline-block">${weeklyHtml(emails.join(', '))}</span></p>`,
      `<ul>${list}</ul>`,
    ].join('')
  })
  const htmlBody = [
    `<p>Applications decided <b>${period}</b>.</p>`,
    total === 0 ? '<p>No decisions were recorded this week.</p>' : '',
    ...htmlGroups,
    `<p style="color:#666;font-size:12px">${weeklyHtml(note)}</p>`,
  ].join('')

  return { subject, body, htmlBody }
}

/* The week that ended yesterday: last Saturday to Friday, in Israel. A
   decision taken on Saturday morning before this runs goes into next week's
   email, so no day is in two emails or in none. */
const weeklyPeriodEndingYesterday = (now) => {
  const day = 24 * 60 * 60 * 1000
  const iso = (date) => Utilities.formatDate(date, WEEKLY_DECISIONS_TIME_ZONE, 'yyyy-MM-dd')
  return { fromDay: iso(new Date(now.getTime() - 7 * day)), toDay: iso(new Date(now.getTime() - day)) }
}

const weeklyToIsoDay = (cell) => {
  if (cell instanceof Date) {
    return Utilities.formatDate(cell, WEEKLY_DECISIONS_TIME_ZONE, 'yyyy-MM-dd')
  }
  const text = String(cell ?? '').trim()
  return WEEKLY_ISO_DAY.test(text) ? text : undefined
}

/* Run by the weekly trigger. Run it from the editor to send this week's email
   now. */
function sendWeeklyDecisionsEmail() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(WEEKLY_DECISIONS_LEADS_TAB)
  if (sheet === null) {
    throw new Error(`There is no ${WEEKLY_DECISIONS_LEADS_TAB} tab in this spreadsheet.`)
  }
  const { fromDay, toDay } = weeklyPeriodEndingYesterday(new Date())
  const groups = weeklyCollectDecisions({
    rows: sheet.getDataRange().getValues(),
    fromDay,
    toDay,
    toIsoDay: weeklyToIsoDay,
  })
  const email = weeklyComposeEmail({ groups, fromDay, toDay })
  MailApp.sendEmail({
    to: WEEKLY_DECISIONS_TO,
    subject: email.subject,
    body: email.body,
    htmlBody: email.htmlBody,
    name: WEEKLY_DECISIONS_SENDER_NAME,
  })
}

/* Run once from the editor. Re-running it does not add a second trigger,
   which would send the email twice. */
function installWeeklyDecisionsTrigger() {
  const alreadyInstalled = ScriptApp.getProjectTriggers().some(
    (trigger) => trigger.getHandlerFunction() === 'sendWeeklyDecisionsEmail',
  )
  if (alreadyInstalled) {
    return
  }
  ScriptApp.newTrigger('sendWeeklyDecisionsEmail')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SATURDAY)
    .atHour(WEEKLY_DECISIONS_HOUR)
    .nearMinute(0)
    .inTimezone(WEEKLY_DECISIONS_TIME_ZONE)
    .create()
}

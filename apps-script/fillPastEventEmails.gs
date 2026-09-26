/*
  One-off: the first RSVP forms never asked for an email, but the Dashboard
  kept a tab per early event that has them. This copies each person's email
  from that tab into an Email column on the event's RSVP sheet, matched by
  full name, then tells the app that sheet now has an email column.

  Run fillPastEventEmails from the editor, after importPreviewedEvents. It only
  fills empty Email cells, so running it again changes nothing already filled.
  Names it could not match are listed in the Execution log.

  Uses EVENTS_TAB, EVENT_SHEETS_TAB, normalizeHeading, columnOf (from
  createEventForms.gs) and toColumnLetter (from migratePastEvents.gs).
*/

/* Event name as imported → the Dashboard tab holding that event's emails.
   Fix a tab name here if yours differs; the log lists every tab if one is
   not found. */
const EMAIL_FILL_SOURCES = [
  { eventName: '1st Event', tabName: '1st Meetup' },
  { eventName: '2nd Event', tabName: '2nd Meetup' },
  { eventName: '3rd Event', tabName: '3rd Meetup' },
  { eventName: '4th Event', tabName: '4th Meetup' },
]

const EMAIL_FILL_NAME_HEADINGS = ['name', 'full name']
const EMAIL_FILL_EMAIL_HEADINGS = ['email', 'mail', 'e-mail', 'your email', 'email address']

const emailFillName = (name) =>
  String(name ?? '').normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase()

const emailFillColumn = (headerRow, headings) =>
  headings.map((heading) => columnOf(headerRow, heading)).find((index) => index !== -1) ?? -1

const emailFillLetterToIndex = (letters) =>
  [...letters].reduce((index, letter) => index * 26 + (letter.charCodeAt(0) - 64), 0) - 1

/* Name → email from a tab whose heading row is within its first five rows.
   A name listed with two different emails is left out: either could be right. */
const readEmailsByName = (values) => {
  const headerIndex = values
    .slice(0, 5)
    .findIndex(
      (row) =>
        emailFillColumn(row, EMAIL_FILL_NAME_HEADINGS) !== -1 &&
        emailFillColumn(row, EMAIL_FILL_EMAIL_HEADINGS) !== -1,
    )
  if (headerIndex === -1) {
    return undefined
  }
  const headerRow = values[headerIndex]
  const nameColumn = emailFillColumn(headerRow, EMAIL_FILL_NAME_HEADINGS)
  const emailColumn = emailFillColumn(headerRow, EMAIL_FILL_EMAIL_HEADINGS)
  const found = new Map()
  const conflicting = new Set()
  values.slice(headerIndex + 1).forEach((row) => {
    const name = emailFillName(row[nameColumn])
    const email = String(row[emailColumn] ?? '').trim()
    if (name === '' || !email.includes('@')) {
      return
    }
    if (found.has(name) && found.get(name).toLowerCase() !== email.toLowerCase()) {
      conflicting.add(name)
    }
    found.set(name, email)
  })
  conflicting.forEach((name) => found.delete(name))
  return found
}

function fillPastEventEmails() {
  const dashboard = SpreadsheetApp.getActiveSpreadsheet()
  const tabNames = dashboard.getSheets().map((sheet) => sheet.getName())
  const eventRows = dashboard.getSheetByName(EVENTS_TAB).getDataRange().getDisplayValues()
  const eventSheetsTab = dashboard.getSheetByName(EVENT_SHEETS_TAB)
  const attachedRows = eventSheetsTab.getDataRange().getDisplayValues()
  const attachedCol = (heading) => columnOf(attachedRows[0], heading)
  const membersTab = dashboard.getSheetByName('Members')
  const members = membersTab === null ? new Map() : readEmailsByName(membersTab.getDataRange().getDisplayValues()) ?? new Map()
  const report = []

  EMAIL_FILL_SOURCES.forEach(({ eventName, tabName }) => {
    const source = dashboard.getSheetByName(tabName)
    if (source === null) {
      report.push(`${eventName}: no tab named "${tabName}". The tabs are: ${tabNames.join(', ')}`)
      return
    }
    const emailsByName = readEmailsByName(source.getDataRange().getDisplayValues())
    if (emailsByName === undefined) {
      report.push(`${eventName}: "${tabName}" has no heading row with both a name and an email column.`)
      return
    }
    const eventRow = eventRows.find(
      (row, index) => index > 0 && emailFillName(row[columnOf(eventRows[0], 'Name')]) === emailFillName(eventName),
    )
    if (eventRow === undefined) {
      report.push(`${eventName}: not on the Events tab. Run importPreviewedEvents first.`)
      return
    }
    const eventId = eventRow[columnOf(eventRows[0], 'Event ID')]

    attachedRows.forEach((attached, attachedIndex) => {
      if (attachedIndex === 0 || attached[attachedCol('Event ID')] !== eventId) {
        return
      }
      const mapping = JSON.parse(attached[attachedCol('Column mapping')] || '{}')
      if (!mapping.name) {
        report.push(`${eventName}: its RSVP sheet has no name column to match on.`)
        return
      }
      const rsvp = SpreadsheetApp.openById(attached[attachedCol('Spreadsheet ID')]).getSheetByName(
        attached[attachedCol('Sheet name')],
      )
      const values = rsvp.getDataRange().getDisplayValues()
      let emailColumn = mapping.email ? emailFillLetterToIndex(mapping.email) : columnOf(values[0], 'Email')
      if (emailColumn === -1) {
        emailColumn = values[0].length
        rsvp.getRange(1, emailColumn + 1).setValue('Email')
      }
      const nameColumn = emailFillLetterToIndex(mapping.name)
      const unmatched = []
      let filled = 0
      values.slice(1).forEach((row, index) => {
        const name = emailFillName(row[nameColumn])
        if (name === '' || String(row[emailColumn] ?? '').trim() !== '') {
          return
        }
        const email = emailsByName.get(name) ?? members.get(name)
        if (email === undefined) {
          unmatched.push(row[nameColumn])
          return
        }
        rsvp.getRange(index + 2, emailColumn + 1).setValue(email)
        filled += 1
      })
      mapping.email = toColumnLetter(emailColumn)
      eventSheetsTab
        .getRange(attachedIndex + 1, attachedCol('Column mapping') + 1)
        .setValue(JSON.stringify(mapping))
      report.push(
        `${eventName}: filled ${filled} emails.` +
          (unmatched.length > 0 ? ` No email found for: ${unmatched.join(', ')}` : ''),
      )
    })
  })

  Logger.log(report.join('\n'))
}

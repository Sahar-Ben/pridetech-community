/*
  One-off migration of the events that happened before the PrideTech app:
  every event folder in the shared Events folder becomes a row on the Events
  tab, and its RSVP sheet(s) become rows on the Event sheets tab, with their
  columns mapped, so the app lists who registered.

  It runs in two steps, each chosen in the Apps Script editor's function
  dropdown and run with ▶ Run:

  1. previewPastEvents reads the Events folder and writes what it found to
     a "Migration preview" tab, one row per RSVP spreadsheet. Nothing else is
     touched. Check the rows, fix any event name or date, and set Include to
     "No" on anything that should not come in (a duplicate copy, a test).
  2. importPreviewedEvents writes every row still marked "Yes".

  It shares the Apps Script project with createEventForms.gs, and uses its
  EVENTS_FOLDER_ID, EVENTS_TAB, EVENT_SHEETS_TAB, normalizeHeading and columnOf.
*/

const MIGRATION_PREVIEW_TAB = 'Migration preview'

const MIGRATION_HEADINGS = [
  'Include',
  'Event name',
  'Date',
  'Folder',
  'Spreadsheet',
  'Responses',
  'Role',
  'Warnings',
  'Spreadsheet ID',
  'Tab',
  'Column mapping',
]

const MIGRATION_IMPORTED = 'Imported'
const MIGRATION_ALREADY_THERE = 'Already in the app'

const MIGRATION_IMPORT_NOTE =
  'Imported from the Events folder. Attendance was not recorded for this event.'

/* The same header wordings the app accepts (src/sheets/columnAliases.ts),
   matched the same way: whole heading, case and spacing aside, first match
   from the left. */
const MIGRATION_ALIASES = {
  timestamp: ['timestamp'],
  name: ['name', 'full name'],
  email: ['email', 'your email', 'e-mail', 'mail', 'email address'],
  company: [
    'company',
    'your company',
    'current employer / organization / company',
    'current employer / organization',
  ],
  jobTitle: ['job title', 'your job title', 'current job title', 'title'],
}

const MIGRATION_FIELDS = ['timestamp', 'name', 'email', 'company', 'jobTitle']

/* "Moabet 14.10.26", "1st Event (16.4.25)", "3rd Meetup (16.7.2025)". */
const FOLDER_DATE = /^(.*?)[\s(\-–]*(\d{1,2})\.(\d{1,2})\.(\d{4}|\d{2})\)?\s*$/

const pad2 = (value) => String(value).padStart(2, '0')

const parseFolderName = (folderName) => {
  const parts = FOLDER_DATE.exec(folderName.trim())
  if (parts === null) {
    return { name: folderName.trim(), date: '' }
  }
  const [, name, day, month, year] = parts
  const fullYear = year.length === 2 ? `20${year}` : year
  return { name: name.trim(), date: `${fullYear}-${pad2(month)}-${pad2(day)}` }
}

const toColumnLetter = (index) => {
  let letters = ''
  let remaining = index + 1
  while (remaining > 0) {
    const digit = (remaining - 1) % 26
    letters = String.fromCharCode(65 + digit) + letters
    remaining = Math.floor((remaining - 1) / 26)
  }
  return letters
}

/* The recorded mapping in the app's own shape: a column letter per field, and
   null for a field this sheet does not have. */
const guessMapping = (headerRow) => {
  const normalized = headerRow.map(normalizeHeading)
  return Object.fromEntries(
    MIGRATION_FIELDS.map((field) => {
      const index = MIGRATION_ALIASES[field]
        .map((alias) => normalized.indexOf(alias))
        .find((found) => found !== -1)
      return [field, index === undefined ? null : toColumnLetter(index)]
    }),
  )
}

/* The tab the form writes into, when there is one; otherwise the first tab,
   which is where a copied or exported response sheet keeps its rows. */
const findResponseTab = (spreadsheet) => {
  const sheets = spreadsheet.getSheets()
  const linked = sheets.filter((sheet) => sheet.getFormUrl() !== null)
  return {
    sheet: linked[0] ?? sheets[0],
    warning:
      linked.length === 0
        ? 'No tab is linked to a form; the first tab was taken as the responses.'
        : linked.length > 1
          ? `${linked.length} tabs are linked to forms; the first was taken. Change Tab if it is the wrong one.`
          : undefined,
  }
}

/* Every spreadsheet in the folder and its subfolders, plus the response
   spreadsheet of every form in them, wherever that spreadsheet lives. */
const collectSpreadsheetIds = (folder) => {
  const ids = new Set()
  const visit = (current) => {
    const sheets = current.getFilesByType(MimeType.GOOGLE_SHEETS)
    while (sheets.hasNext()) {
      ids.add(sheets.next().getId())
    }
    const forms = current.getFilesByType(MimeType.GOOGLE_FORMS)
    while (forms.hasNext()) {
      try {
        const destination = FormApp.openById(forms.next().getId()).getDestinationId()
        if (destination) {
          ids.add(destination)
        }
      } catch (error) {
        // A form this account cannot open is skipped; its sheet may still be in the folder.
      }
    }
    const subfolders = current.getFolders()
    while (subfolders.hasNext()) {
      visit(subfolders.next())
    }
  }
  visit(folder)
  return [...ids]
}

const describeSpreadsheet = ({ spreadsheetId, folderName }) => {
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId)
  const { sheet, warning } = findResponseTab(spreadsheet)
  const values = sheet.getDataRange().getDisplayValues()
  const headerRow = values[0] ?? []
  const mapping = guessMapping(headerRow)
  const responses = values
    .slice(1)
    .filter((row) => row.some((cell) => String(cell).trim() !== '')).length
  const fileName = spreadsheet.getName()
  return {
    folderName,
    fileName,
    spreadsheetId,
    tabName: sheet.getName(),
    responses,
    role: /wait/i.test(`${fileName} ${sheet.getName()}`) ? 'waiting list' : 'main',
    mapping,
    warnings: [
      warning,
      mapping.email === null
        ? 'No email column: these registrants cannot be matched to members.'
        : undefined,
      mapping.name === null ? 'No name column: registrants will be named by email.' : undefined,
      /\bcopy\b|\bnew\b/i.test(fileName) ? 'The file name suggests a copy of another sheet.' : undefined,
    ].filter((line) => line !== undefined),
  }
}

/* Where one folder holds more than one main sheet, the one with the most
   responses is kept and the rest are set to "No". Registering two copies of
   the same sheet would count everybody on it twice; the organiser checks the
   choice before importing. */
const markDuplicates = (found) => {
  const byFolder = new Map()
  found.forEach((item) => {
    if (item.role !== 'main' || item.alreadyThere) {
      return
    }
    byFolder.set(item.folderName, [...(byFolder.get(item.folderName) ?? []), item])
  })
  byFolder.forEach((items) => {
    if (items.length < 2) {
      return
    }
    const kept = items.reduce((best, item) => (item.responses > best.responses ? item : best))
    items.forEach((item) => {
      item.warnings.push(
        `This folder has ${items.length} main sheets. The one with the most responses is set to Yes; check that is the right one.`,
      )
      if (item !== kept) {
        item.include = 'No'
      }
    })
  })
}

/* The editor's Execution log, and a notice in the corner of the spreadsheet.
   Not a pop-up: a pop-up holds the run open until somebody clicks OK in the
   spreadsheet, and a run started from the editor has nobody looking there, so
   it sat until Google stopped it at six minutes. */
const migrationNotice = (message) => {
  Logger.log(message)
  SpreadsheetApp.getActiveSpreadsheet().toast(message, 'PrideTech migration', 30)
}

const readTabValues = (tabName) => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tabName)
  return sheet === null ? [] : sheet.getDataRange().getDisplayValues()
}

const readAttachedSpreadsheetIds = () => {
  const rows = readTabValues(EVENT_SHEETS_TAB)
  const column = columnOf(rows[0] ?? [], 'Spreadsheet ID')
  return new Set(column === -1 ? [] : rows.slice(1).map((row) => String(row[column]).trim()))
}

function previewPastEvents() {
  const attached = readAttachedSpreadsheetIds()
  const found = []
  const folders = DriveApp.getFolderById(EVENTS_FOLDER_ID).getFolders()
  while (folders.hasNext()) {
    const folder = folders.next()
    const folderName = folder.getName()
    const { name, date } = parseFolderName(folderName)
    collectSpreadsheetIds(folder).forEach((spreadsheetId) => {
      try {
        const item = describeSpreadsheet({ spreadsheetId, folderName })
        item.eventName = name
        item.date = date
        item.alreadyThere = attached.has(spreadsheetId)
        item.include = item.alreadyThere ? MIGRATION_ALREADY_THERE : 'Yes'
        if (date === '') {
          item.warnings.push('No date in the folder name: fill in Date as YYYY-MM-DD.')
        }
        found.push(item)
      } catch (error) {
        found.push({
          include: 'No',
          eventName: name,
          date,
          folderName,
          fileName: '',
          responses: '',
          role: '',
          warnings: [`Could not be opened: ${error.message}`],
          spreadsheetId,
          tabName: '',
          mapping: {},
        })
      }
    })
  }
  markDuplicates(found)
  found.sort((left, right) => `${left.date}${left.folderName}`.localeCompare(`${right.date}${right.folderName}`))

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  const preview =
    spreadsheet.getSheetByName(MIGRATION_PREVIEW_TAB) ?? spreadsheet.insertSheet(MIGRATION_PREVIEW_TAB)
  preview.clear()
  const rows = [
    MIGRATION_HEADINGS,
    ...found.map((item) => [
      item.include,
      item.eventName,
      item.date,
      item.folderName,
      item.fileName,
      String(item.responses),
      item.role,
      item.warnings.join(' '),
      item.spreadsheetId,
      item.tabName,
      JSON.stringify(item.mapping),
    ]),
  ]
  const range = preview.getRange(1, 1, rows.length, MIGRATION_HEADINGS.length)
  range.setNumberFormat('@')
  range.setValues(rows)
  preview.setFrozenRows(1)
  preview.getRange(1, 1, 1, MIGRATION_HEADINGS.length).setFontWeight('bold')
  preview.autoResizeColumns(1, 8)
  spreadsheet.setActiveSheet(preview)

  migrationNotice(
    `Found ${found.length} RSVP spreadsheets in ${new Set(found.map((item) => item.folderName)).size} event folders.\n\n` +
      'Check the Migration preview tab: fix any event name or date, set Include to No on anything that should not come in, ' +
      'and read the Warnings column. Then run importPreviewedEvents.',
  )
}

const newEventId = () => {
  const time = Date.now().toString(36).padStart(9, '0')
  const random = Math.floor(Math.random() * 36 ** 4)
    .toString(36)
    .padStart(4, '0')
  return `evt-${time}-${random}`
}

/* Written as plain text: a date typed into a cell is turned into the
   spreadsheet's own date format, and the app reads dates as YYYY-MM-DD. */
const appendByHeading = (sheet, values) => {
  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0]
  const row = headerRow.map(() => '')
  Object.entries(values).forEach(([heading, value]) => {
    const column = columnOf(headerRow, heading)
    if (column === -1) {
      throw new Error(`The ${sheet.getName()} tab has no column headed ${heading}.`)
    }
    row[column] = value
  })
  const target = sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length)
  target.setNumberFormat('@')
  target.setValues([row])
}

const eventKey = (name, date) => `${normalizeHeading(name)}|${date}`

function importPreviewedEvents() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  const preview = spreadsheet.getSheetByName(MIGRATION_PREVIEW_TAB)
  if (preview === null) {
    migrationNotice('Run previewPastEvents first.')
    return
  }
  const eventsSheet = spreadsheet.getSheetByName(EVENTS_TAB)
  const eventSheetsTab = spreadsheet.getSheetByName(EVENT_SHEETS_TAB)
  const attached = readAttachedSpreadsheetIds()

  const eventRows = eventsSheet.getDataRange().getDisplayValues()
  const at = (heading) => columnOf(eventRows[0], heading)
  const existingIds = new Map(
    eventRows
      .slice(1)
      .map((row) => [eventKey(row[at('Name')], row[at('Date')]), row[at('Event ID')]]),
  )

  const previewRows = preview.getDataRange().getDisplayValues()
  const col = (heading) => columnOf(previewRows[0], heading)
  const problems = []
  let eventCount = 0
  let sheetCount = 0

  previewRows.slice(1).forEach((row, index) => {
    if (normalizeHeading(row[col('Include')]) !== 'yes') {
      return
    }
    const rowNumber = index + 2
    const name = String(row[col('Event name')]).trim()
    const date = String(row[col('Date')]).trim()
    const spreadsheetId = String(row[col('Spreadsheet ID')]).trim()
    if (name === '' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      problems.push(`Row ${rowNumber}: needs an event name and a date as YYYY-MM-DD.`)
      return
    }
    if (attached.has(spreadsheetId)) {
      preview.getRange(rowNumber, col('Include') + 1).setValue(MIGRATION_ALREADY_THERE)
      return
    }
    const key = eventKey(name, date)
    let eventId = existingIds.get(key)
    if (eventId === undefined) {
      eventId = newEventId()
      appendByHeading(eventsSheet, {
        'Event ID': eventId,
        Name: name,
        Date: date,
        'Members only': 'No',
        'Closed out': 'No',
        Archived: 'No',
        Notes: MIGRATION_IMPORT_NOTE,
      })
      existingIds.set(key, eventId)
      eventCount += 1
    }
    appendByHeading(eventSheetsTab, {
      'Event ID': eventId,
      'Spreadsheet ID': spreadsheetId,
      'Sheet name': String(row[col('Tab')]).trim(),
      Role: String(row[col('Role')]).trim() || 'main',
      'Column mapping': String(row[col('Column mapping')]).trim(),
    })
    attached.add(spreadsheetId)
    preview.getRange(rowNumber, col('Include') + 1).setValue(MIGRATION_IMPORTED)
    sheetCount += 1
  })

  migrationNotice(
    `Imported ${eventCount} events and ${sheetCount} RSVP sheets.` +
      (problems.length > 0 ? `\n\nSkipped:\n${problems.join('\n')}` : '') +
      '\n\nIn the app, use "Give access to event sheets" on the Events page and select all the RSVP sheets once, so the app can read them.',
  )
}

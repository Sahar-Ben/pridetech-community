/*
  Creates the Drive folder, RSVP form and response sheet for every new event
  added in the PrideTech app, and records the sheet against the event so the
  app can read who registered.

  It runs here, as the organiser who installed it, rather than in the web app:
  editing forms and linking them to sheets needs Google permissions far wider
  than the app's own, which would put an "unverified app" warning in front of
  every organiser at sign-in.

  Setup is in apps-script/README.md.
*/

/* The shared "PrideTech/Events" folder every event folder lives in. */
const EVENTS_FOLDER_ID = '1Q0lskZFOsXtB45q2Q5MKb4yxLHSypDiz'

const EVENTS_TAB = 'Events'
const EVENT_SHEETS_TAB = 'Event sheets'

/* Added by this script at the end of the Events tab. The app reads its columns
   by heading, so an extra one is left alone there. */
const FORM_LINK_HEADING = 'Form link'

/* The questions every RSVP form starts with. The response sheet's columns come
   out in this order after the timestamp, which is what the column mapping
   recorded below relies on. Edit the forms afterwards in Google Forms as usual
   — an added question lands in a column the app simply does not read. */
const QUESTIONS = [
  { title: 'Full Name', required: true, kind: 'text' },
  { title: 'Email', required: true, kind: 'email' },
  { title: 'Company', required: true, kind: 'text' },
  { title: 'Job Title', required: false, kind: 'text' },
]

/* Column letters, in the shape the app records for an attached sheet:
   Timestamp is A and the questions follow it. */
const COLUMN_MAPPING = JSON.stringify({
  timestamp: 'A',
  name: 'B',
  email: 'C',
  company: 'D',
  jobTitle: 'E',
})

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

const isYes = (cell) =>
  ['yes', 'y', 'true', 'x', '1', '✓'].includes(String(cell ?? '').trim().toLowerCase())

const normalizeHeading = (heading) =>
  String(heading ?? '').trim().replace(/\s+/g, ' ').toLowerCase()

const columnOf = (headerRow, heading) =>
  headerRow.map(normalizeHeading).indexOf(normalizeHeading(heading))

/* "Moabet 14.10.26": day and month unpadded, two-digit year, as the existing
   event folders are named. */
const toFolderDate = (isoDate) => {
  const parts = ISO_DATE.exec(isoDate)
  if (parts === null) {
    return undefined
  }
  const [, year, month, day] = parts
  return `${Number(day)}.${Number(month)}.${year.slice(2)}`
}

const toReadableDate = (isoDate) => {
  const parts = ISO_DATE.exec(isoDate)
  if (parts === null) {
    return isoDate
  }
  const [, year, month, day] = parts
  return Utilities.formatDate(
    new Date(Number(year), Number(month) - 1, Number(day)),
    Session.getScriptTimeZone(),
    'EEEE, d MMMM yyyy',
  )
}

const todayIso = () => Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')

const describeEvent = (event) =>
  [
    `Date: ${toReadableDate(event.date)}`,
    event.location === '' ? undefined : `Location: ${event.location}`,
    event.host === '' ? undefined : `Hosted by ${event.host}`,
    event.isMembersOnly ? 'This event is for PrideTech community members.' : undefined,
  ]
    .filter((line) => line !== undefined)
    .join('\n')

const addQuestions = (form) => {
  QUESTIONS.forEach((question) => {
    const item = form.addTextItem().setTitle(question.title).setRequired(question.required)
    if (question.kind === 'email') {
      item.setValidation(
        FormApp.createTextValidation()
          .requireTextIsEmail()
          .setHelpText('Please enter a valid email address.')
          .build(),
      )
    }
  })
}

/* The folder, the form and the sheet, in that order, each moved into the
   folder as soon as it exists so nothing is left loose in My Drive. */
const createEventFiles = (event) => {
  const folderName = `${event.name} ${toFolderDate(event.date)}`
  const folder = DriveApp.getFolderById(EVENTS_FOLDER_ID).createFolder(folderName)

  const form = FormApp.create(`${event.name} RSVP`)
  DriveApp.getFileById(form.getId()).moveTo(folder)
  form.setTitle(event.name).setDescription(describeEvent(event))
  addQuestions(form)

  const spreadsheet = SpreadsheetApp.create(`${event.name} RSVP (Responses)`)
  DriveApp.getFileById(spreadsheet.getId()).moveTo(folder)
  form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheet.getId())
  SpreadsheetApp.flush()

  const reopened = SpreadsheetApp.openById(spreadsheet.getId())
  const responseTab = reopened.getSheets().find((sheet) => sheet.getFormUrl() !== null)
  const responseTabName = responseTab === undefined ? 'Form Responses 1' : responseTab.getName()
  reopened
    .getSheets()
    .filter((sheet) => sheet.getName() !== responseTabName)
    .forEach((sheet) => reopened.deleteSheet(sheet))

  return {
    formUrl: form.getPublishedUrl(),
    spreadsheetId: spreadsheet.getId(),
    responseTabName,
  }
}

const ensureFormLinkColumn = (eventsSheet) => {
  const lastColumn = eventsSheet.getLastColumn()
  const headerRow = eventsSheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0]
  const existing = columnOf(headerRow, FORM_LINK_HEADING)
  if (existing !== -1) {
    return existing
  }
  eventsSheet.getRange(1, lastColumn + 1).setValue(FORM_LINK_HEADING)
  return lastColumn
}

/* The Event sheets row is written by heading, not by position, so a column the
   organiser moved does not send the mapping into the Role cell. */
const appendEventSheetRow = ({ eventSheetsTab, eventId, files }) => {
  const headerRow = eventSheetsTab
    .getRange(1, 1, 1, eventSheetsTab.getLastColumn())
    .getDisplayValues()[0]
  const row = headerRow.map(() => '')
  const put = (heading, value) => {
    const column = columnOf(headerRow, heading)
    if (column === -1) {
      throw new Error(`The ${EVENT_SHEETS_TAB} tab has no column headed ${heading}.`)
    }
    row[column] = value
  }
  put('Event ID', eventId)
  put('Spreadsheet ID', files.spreadsheetId)
  put('Sheet name', files.responseTabName)
  put('Role', 'main')
  put('Column mapping', COLUMN_MAPPING)
  eventSheetsTab.appendRow(row)
}

/* An event gets a form once: when it is upcoming, not archived, has no form
   link yet and has no response sheet attached. Past events already have their
   forms, and one that was attached by hand is left as it is. */
const selectEventsNeedingForms = ({ eventRows, formLinkColumn, attachedEventIds }) => {
  const [headerRow, ...dataRows] = eventRows
  const at = (heading) => columnOf(headerRow, heading)
  const columns = {
    id: at('Event ID'),
    name: at('Name'),
    date: at('Date'),
    host: at('Host'),
    location: at('Location'),
    membersOnly: at('Members only'),
    archived: at('Archived'),
  }
  const today = todayIso()
  return dataRows.flatMap((row, index) => {
    const cell = (column) => (column === -1 ? '' : String(row[column] ?? '').trim())
    const event = {
      rowNumber: index + 2,
      id: cell(columns.id),
      name: cell(columns.name),
      date: cell(columns.date),
      host: cell(columns.host),
      location: cell(columns.location),
      isMembersOnly: isYes(cell(columns.membersOnly)),
    }
    const needsForm =
      event.id !== '' &&
      event.name !== '' &&
      ISO_DATE.test(event.date) &&
      event.date >= today &&
      !isYes(cell(columns.archived)) &&
      cell(formLinkColumn) === '' &&
      !attachedEventIds.has(event.id)
    return needsForm ? [event] : []
  })
}

/* Run every few minutes by the trigger, and from the PrideTech menu. */
function createFormsForNewEvents() {
  const lock = LockService.getScriptLock()
  if (!lock.tryLock(1000)) {
    return
  }
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
    const eventsSheet = spreadsheet.getSheetByName(EVENTS_TAB)
    const eventSheetsTab = spreadsheet.getSheetByName(EVENT_SHEETS_TAB)
    if (eventsSheet === null || eventSheetsTab === null) {
      return
    }
    const formLinkColumn = ensureFormLinkColumn(eventsSheet)
    const eventRows = eventsSheet.getDataRange().getDisplayValues()
    const eventSheetRows = eventSheetsTab.getDataRange().getDisplayValues()
    const eventIdColumn = columnOf(eventSheetRows[0] ?? [], 'Event ID')
    const attachedEventIds = new Set(
      eventSheetRows.slice(1).map((row) => String(row[eventIdColumn] ?? '').trim()),
    )

    selectEventsNeedingForms({ eventRows, formLinkColumn, attachedEventIds }).forEach((event) => {
      const files = createEventFiles(event)
      appendEventSheetRow({ eventSheetsTab, eventId: event.id, files })
      eventsSheet.getRange(event.rowNumber, formLinkColumn + 1).setValue(files.formUrl)
    })
  } finally {
    lock.releaseLock()
  }
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('PrideTech')
    .addItem('Create forms for new events now', 'createFormsForNewEvents')
    .addToUi()
}

/* Run once from the editor. Re-running it does not add a second trigger. */
function installEventFormTrigger() {
  const alreadyInstalled = ScriptApp.getProjectTriggers().some(
    (trigger) => trigger.getHandlerFunction() === 'createFormsForNewEvents',
  )
  if (!alreadyInstalled) {
    ScriptApp.newTrigger('createFormsForNewEvents').timeBased().everyMinutes(5).create()
  }
  createFormsForNewEvents()
}

/*
  Emails an applicant who submits the membership form with an address the
  community already has — on an earlier Leads row, or on the Members tab.

  Google Forms cannot refuse a submission, so this runs after it lands. It only
  sends an email: the new row is left in the sheet, because the CRM's Leads tab
  already groups repeat applications for a reviewer to clean up, and deleting a
  response cannot be undone.

  Setup is in apps-script/README.md.
*/

const LEADS_TAB_NAME = 'Leads'
const MEMBERS_TAB_NAME = 'Members'

/* The same header wordings the CRM accepts (src/sheets/columnAliases.ts), plus
   "email address", which is what the form writes when "Collect email addresses"
   is switched on. */
const EMAIL_HEADERS = ['email', 'your email', 'e-mail', 'mail', 'email address']
const NAME_HEADERS = ['name', 'full name']

const SENDER_NAME = 'PrideTech Community'

const ALREADY_APPLIED_SUBJECT = "We've already got your PrideTech application"
const ALREADY_APPLIED_BODY = (greetingName) =>
  `Hi ${greetingName},

Thanks for your interest in PrideTech! We already have an application from this email address, so there's no need to submit the form again. Our team reviews every application and will be in touch.

If you need to update something in your application, just reply to this email.

The PrideTech team`

const ALREADY_MEMBER_SUBJECT = "You're already a PrideTech member"
const ALREADY_MEMBER_BODY = (greetingName) =>
  `Hi ${greetingName},

Thanks for filling in the PrideTech form again — this email address already belongs to a community member, so there's nothing more you need to do.

If something has changed or you think this is a mistake, just reply to this email.

The PrideTech team`

const toEmailKey = (value) => String(value ?? '').trim().toLowerCase()

const normalizeHeader = (header) =>
  String(header ?? '').trim().replace(/\s+/g, ' ').toLowerCase()

const findColumn = (headerRow, headers) => {
  const normalized = headerRow.map(normalizeHeader)
  for (const header of headers) {
    const index = normalized.indexOf(header)
    if (index !== -1) {
      return index
    }
  }
  return -1
}

/* Every row but the new one is compared, not only the rows above it: a sheet
   that was sorted by hand no longer keeps the oldest application on top. */
const hasEmailOnOtherRow = ({ rows, emailKey, skipRowNumber }) => {
  const [headerRow, ...dataRows] = rows
  if (headerRow === undefined) {
    return false
  }
  const emailColumn = findColumn(headerRow, EMAIL_HEADERS)
  if (emailColumn === -1) {
    return false
  }
  return dataRows.some(
    (row, index) => index + 2 !== skipRowNumber && toEmailKey(row[emailColumn]) === emailKey,
  )
}

/* Decides which email to send, if any. Kept free of SpreadsheetApp and MailApp
   so it can be run outside Google. */
const classifySubmission = ({ leadsRows, membersRows, newRowNumber }) => {
  const [headerRow] = leadsRows
  const newRow = leadsRows[newRowNumber - 1]
  if (headerRow === undefined || newRow === undefined) {
    return { kind: 'none' }
  }
  const emailColumn = findColumn(headerRow, EMAIL_HEADERS)
  if (emailColumn === -1) {
    throw new Error(`The ${LEADS_TAB_NAME} tab has no email column — check its header row`)
  }
  const emailKey = toEmailKey(newRow[emailColumn])
  if (emailKey === '' || !emailKey.includes('@')) {
    return { kind: 'none' }
  }
  const nameColumn = findColumn(headerRow, NAME_HEADERS)
  const name = nameColumn === -1 ? '' : String(newRow[nameColumn] ?? '').trim()
  const greetingName = name === '' ? 'there' : name.split(/\s+/)[0]

  if (hasEmailOnOtherRow({ rows: membersRows, emailKey, skipRowNumber: -1 })) {
    return { kind: 'member', emailKey, greetingName }
  }
  if (hasEmailOnOtherRow({ rows: leadsRows, emailKey, skipRowNumber: newRowNumber })) {
    return { kind: 'applicant', emailKey, greetingName }
  }
  return { kind: 'none' }
}

const readTab = (spreadsheet, tabName) => {
  const sheet = spreadsheet.getSheetByName(tabName)
  return sheet === null ? [] : sheet.getDataRange().getDisplayValues()
}

/* Installed as the spreadsheet's "On form submit" trigger. */
function onApplicationSubmitted(event) {
  const sheet = event.range.getSheet()
  if (sheet.getName() !== LEADS_TAB_NAME) {
    return
  }
  const spreadsheet = sheet.getParent()
  const decision = classifySubmission({
    leadsRows: sheet.getDataRange().getDisplayValues(),
    membersRows: readTab(spreadsheet, MEMBERS_TAB_NAME),
    newRowNumber: event.range.getRow(),
  })
  if (decision.kind === 'none') {
    return
  }
  const isMember = decision.kind === 'member'
  MailApp.sendEmail({
    to: decision.emailKey,
    subject: isMember ? ALREADY_MEMBER_SUBJECT : ALREADY_APPLIED_SUBJECT,
    body: (isMember ? ALREADY_MEMBER_BODY : ALREADY_APPLIED_BODY)(decision.greetingName),
    name: SENDER_NAME,
  })
}

/* Run once from the editor to install the trigger. Re-running it does not add a
   second one, which would send every email twice. */
function installTrigger() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  const alreadyInstalled = ScriptApp.getProjectTriggers().some(
    (trigger) => trigger.getHandlerFunction() === 'onApplicationSubmitted',
  )
  if (alreadyInstalled) {
    return
  }
  ScriptApp.newTrigger('onApplicationSubmitted').forSpreadsheet(spreadsheet).onFormSubmit().create()
}

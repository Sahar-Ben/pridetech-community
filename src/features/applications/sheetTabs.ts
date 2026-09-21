/* Every range the applications screen reads or writes is spelled out once. A
   write addresses a cell by tab name and row number, and a tab name that drifted
   apart from the one the rows were read from would put the write on a different
   sheet entirely. */
export const LEADS_TAB_NAME = 'Leads'

export const MEMBERS_TAB_NAME = 'Members'

/* Status was added by hand past the form's own columns, so the read has to reach
   beyond them; the form gains a column whenever a question is added. */
export const LEADS_RANGE = `${LEADS_TAB_NAME}!A1:Z`

export const LEADS_HEADER_RANGE = `${LEADS_TAB_NAME}!A1:Z1`

export const MEMBERS_RANGE = `${MEMBERS_TAB_NAME}!A1:Z`

export const MEMBERS_HEADER_RANGE = `${MEMBERS_TAB_NAME}!A1:Z1`

export const MEMBERS_APPEND_RANGE = `${MEMBERS_TAB_NAME}!A:Z`

export const buildLeadRowRange = (rowNumber: number): string =>
  `${LEADS_TAB_NAME}!A${rowNumber}:Z${rowNumber}`

export const buildMemberRowRange = (rowNumber: number): string =>
  `${MEMBERS_TAB_NAME}!A${rowNumber}:Z${rowNumber}`

import type { Member } from './member'
import { parseMembers } from './parseMembers'
import { MEMBERS_RANGE, MEMBERS_TAB_NAME } from '../applications/sheetTabs'
import { readTabRows } from '../../sheets/readTabRows'
import type { SheetsClient } from '../../sheets/sheetsClient'

/* A failed read is reported as a failed read of a named tab. The directory it
   would otherwise be drawn from is an empty community, which looks exactly like
   a community with nobody in it and says nothing about the sheet. */
export const loadMembers = async ({
  sheetsClient,
}: {
  sheetsClient: SheetsClient
}): Promise<readonly Member[]> =>
  parseMembers({
    rows: await readTabRows({ sheetsClient, range: MEMBERS_RANGE, tabName: MEMBERS_TAB_NAME }),
  })

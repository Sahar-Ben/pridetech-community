import { toApplicationDate } from './applicationTimestamp'
import type { Lead } from '../applications/lead'
import { toEmailKey } from '../../sheets/emailKey'

/* The earliest of somebody's applications, not the latest: 69 addresses on the
   Leads tab applied more than once, and a member's tenure runs from the first
   time they asked to join rather than from the last form they filled in.

   `parseLeads` already normalises the address it reads, but the key is taken
   again here so this index cannot drift from the member side of the join, which
   reads a raw `Mail` cell. */
export const buildEarliestApplicationIndex = (
  leads: readonly Lead[],
): ReadonlyMap<string, Date> =>
  leads.reduce((earliestByEmail, lead) => {
    const appliedAt = toApplicationDate(lead.timestamp)
    const emailKey = toEmailKey(lead.email)
    if (appliedAt === undefined || emailKey === '') {
      return earliestByEmail
    }
    const alreadyRecorded = earliestByEmail.get(emailKey)
    if (alreadyRecorded === undefined || appliedAt < alreadyRecorded) {
      earliestByEmail.set(emailKey, appliedAt)
    }
    return earliestByEmail
  }, new Map<string, Date>())

import { readForDisplay } from './readCache'
import type { SheetsClient } from './sheetsClient'
import { isExpiredSessionError } from './sheetsRequestError'
import { describeError } from '../errors/describeError'

/* For the reads that put a screen up, so they may be answered from the short
   display cache (readCache.ts). Which tab failed, in the message, because every screen here reads more than
   one and "the spreadsheet could not be read" sends somebody looking at the
   wrong tab. An expired session is passed through as it stands: it is about
   the sign-in rather than about a tab, and the caller signs the reviewer back
   in instead of showing them an error. */
export const readTabRows = async ({
  sheetsClient,
  range,
  tabName,
}: {
  sheetsClient: SheetsClient
  range: string
  tabName: string
}): Promise<string[][]> => {
  try {
    return await readForDisplay({ sheetsClient, range })
  } catch (error: unknown) {
    if (isExpiredSessionError(error)) {
      throw error
    }
    throw new Error(
      `The ${tabName} tab could not be read. ${describeError({ error, fallback: 'Google gave no detail.' })}`,
    )
  }
}

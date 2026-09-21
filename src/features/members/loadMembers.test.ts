import { describe, expect, it, vi } from 'vitest'
import { createFakeSheet } from '../../testing/fakeSheet'
import { MEMBERS_HEADER_ROW, memberRow } from '../../testing/sheetsClientFactory'
import { loadMembers } from './loadMembers'
import { SheetsRequestError } from '../../sheets/sheetsRequestError'
import type { SheetsClient } from '../../sheets/sheetsClient'

const membersTab = (rows: readonly (readonly string[])[]) =>
  createFakeSheet({ tabs: { Members: [MEMBERS_HEADER_ROW, ...rows] } }).client

const failingClient = (error: unknown): SheetsClient => ({
  ...membersTab([]),
  readRange: vi.fn().mockRejectedValue(error),
})

describe('loadMembers', () => {
  it('should read the members out of the Members tab', async () => {
    const members = await loadMembers({
      sheetsClient: membersTab([memberRow({ name: 'Dana Sorkin', mail: 'dana@example.com' })]),
    })

    expect(members.map((member) => member.name)).toEqual(['Dana Sorkin'])
  })

  it('should name the tab it could not read', async () => {
    const client = failingClient(new SheetsRequestError({ range: 'x', status: 500, detail: 'boom' }))

    await expect(loadMembers({ sheetsClient: client })).rejects.toThrow(/Members tab/)
  })

  it('should carry the detail Google gave, so the reason is not lost', async () => {
    const client = failingClient(
      new SheetsRequestError({ range: 'x', status: 403, detail: 'caller has no access' }),
    )

    await expect(loadMembers({ sheetsClient: client })).rejects.toThrow(/caller has no access/)
  })

  it('should let an expired session through untouched, so it is handled as a session', async () => {
    const expired = new SheetsRequestError({ range: 'x', status: 401, detail: 'expired' })

    await expect(loadMembers({ sheetsClient: failingClient(expired) })).rejects.toBe(expired)
  })
})

import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Lead } from './lead'
import { useLeadDecisions } from './useLeadDecisions'
import type { SheetsClient } from '../../sheets/sheetsClient'
import { SheetsRequestError } from '../../sheets/sheetsRequestError'
import { createFakeSheet } from '../../testing/fakeSheet'
import {
  LEADS_HEADER_ROW,
  leadRow,
  MEMBERS_HEADER_ROW,
  memberRow,
} from '../../testing/sheetsClientFactory'

type Gate = {
  wait: Promise<void>
  open: () => void
  fail: (error: Error) => void
}

const createGate = (): Gate => {
  let open: () => void = () => {}
  let fail: (error: Error) => void = () => {}
  const wait = new Promise<void>((resolve, reject) => {
    open = resolve
    fail = reject
  })
  return { wait, open, fail }
}

const DANA_ROW_NUMBER = 3

const dana = (overrides: Partial<Lead> = {}): Lead => ({
  rowNumber: DANA_ROW_NUMBER,
  timestamp: '3/8/2025 14:25:20',
  name: 'Dana Maman',
  jobTitle: 'Founder',
  company: 'Salted Mind',
  linkedIn: 'https://linkedin.com/in/dana',
  email: 'dana@example.com',
  phone: '050',
  city: 'Haifa',
  interests: 'AI',
  status: 'pending',
  ...overrides,
})

const buildSheet = ({ members = [MEMBERS_HEADER_ROW] }: { members?: readonly (readonly string[])[] } = {}) =>
  createFakeSheet({
    tabs: {
      Leads: [
        LEADS_HEADER_ROW,
        leadRow({ name: 'Noa Feldman', email: 'noa@example.com' }),
        leadRow({ name: 'Dana Maman', email: 'dana@example.com' }),
      ],
      Members: members,
    },
  })

const renderDecisions = ({
  sheetsClient,
  onSessionExpired = vi.fn(),
}: {
  sheetsClient: SheetsClient
  onSessionExpired?: () => void
}) => renderHook(() => useLeadDecisions({ sheetsClient, onSessionExpired }))

describe('useLeadDecisions', () => {
  it('should take the application out of the queue once the sheet has been written', async () => {
    const sheet = buildSheet()
    const { result } = renderDecisions({ sheetsClient: sheet.client })

    act(() => {
      result.current.approve({ lead: dana(), gender: 'F' })
    })

    await waitFor(() => {
      expect(result.current.decidedRowNumbers.has(DANA_ROW_NUMBER)).toBe(true)
    })
    expect(sheet.writes.map((write) => write.kind)).toEqual(['append', 'update'])
  })

  it('should stamp the approval with today date', async () => {
    const sheet = buildSheet()
    const { result } = renderDecisions({ sheetsClient: sheet.client })

    act(() => {
      result.current.approve({ lead: dana(), gender: 'F' })
    })
    await waitFor(() => {
      expect(result.current.decidedRowNumbers.has(DANA_ROW_NUMBER)).toBe(true)
    })

    const appended = sheet.rowsOf('Members')[1] ?? []
    expect(appended[MEMBERS_HEADER_ROW.indexOf('Approved at')]).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('should report the application as busy while the write is in flight', async () => {
    const sheet = buildSheet()
    const gate = createGate()
    const gatedClient: SheetsClient = {
      ...sheet.client,
      appendRow: async (options) => {
        await gate.wait
        await sheet.client.appendRow(options)
      },
    }
    const { result } = renderDecisions({ sheetsClient: gatedClient })

    act(() => {
      result.current.approve({ lead: dana(), gender: 'F' })
    })

    await waitFor(() => {
      expect(result.current.stateFor(DANA_ROW_NUMBER).isSaving).toBe(true)
    })
    expect(result.current.decidedRowNumbers.has(DANA_ROW_NUMBER)).toBe(false)

    await act(async () => {
      gate.open()
      await gate.wait
    })
    await waitFor(() => {
      expect(result.current.stateFor(DANA_ROW_NUMBER).isSaving).toBe(false)
    })
  })

  it('should ignore a second decision on an application already being written', async () => {
    const sheet = buildSheet()
    const gate = createGate()
    const gatedClient: SheetsClient = {
      ...sheet.client,
      appendRow: async (options) => {
        await gate.wait
        await sheet.client.appendRow(options)
      },
    }
    const { result } = renderDecisions({ sheetsClient: gatedClient })

    act(() => {
      result.current.approve({ lead: dana(), gender: 'F' })
      result.current.approve({ lead: dana(), gender: 'F' })
      result.current.decline({ lead: dana() })
    })

    await act(async () => {
      gate.open()
      await gate.wait
    })
    await waitFor(() => {
      expect(result.current.decidedRowNumbers.has(DANA_ROW_NUMBER)).toBe(true)
    })

    expect(sheet.writes.filter((write) => write.kind === 'append')).toHaveLength(1)
    expect(sheet.writes).toHaveLength(2)
  })

  it('should keep the application in the queue and remember why the write failed', async () => {
    const sheet = buildSheet()
    const failingClient: SheetsClient = {
      ...sheet.client,
      appendRow: () => Promise.reject(new Error('quota exceeded')),
    }
    const { result } = renderDecisions({ sheetsClient: failingClient })

    act(() => {
      result.current.approve({ lead: dana(), gender: 'F' })
    })

    await waitFor(() => {
      expect(result.current.stateFor(DANA_ROW_NUMBER).errorMessage).toMatch(/quota exceeded/)
    })
    expect(result.current.decidedRowNumbers.has(DANA_ROW_NUMBER)).toBe(false)
  })

  it('should let the reviewer try the same application again after a failure', async () => {
    const sheet = buildSheet()
    let hasFailedOnce = false
    const flakyClient: SheetsClient = {
      ...sheet.client,
      appendRow: async (options) => {
        if (!hasFailedOnce) {
          hasFailedOnce = true
          throw new Error('quota exceeded')
        }
        await sheet.client.appendRow(options)
      },
    }
    const { result } = renderDecisions({ sheetsClient: flakyClient })

    act(() => {
      result.current.approve({ lead: dana(), gender: 'F' })
    })
    await waitFor(() => {
      expect(result.current.stateFor(DANA_ROW_NUMBER).errorMessage).toBeDefined()
    })

    act(() => {
      result.current.approve({ lead: dana(), gender: 'F' })
    })
    await waitFor(() => {
      expect(result.current.decidedRowNumbers.has(DANA_ROW_NUMBER)).toBe(true)
    })
    expect(result.current.stateFor(DANA_ROW_NUMBER).errorMessage).toBeUndefined()
  })

  it('should hand an expired session to the app rather than show it on the card', async () => {
    const sheet = buildSheet()
    const onSessionExpired = vi.fn()
    const expiredClient: SheetsClient = {
      ...sheet.client,
      appendRow: () =>
        Promise.reject(
          new SheetsRequestError({ range: 'Members!A:Z', status: 401, detail: 'Invalid Credentials' }),
        ),
    }
    const { result } = renderDecisions({ sheetsClient: expiredClient, onSessionExpired })

    act(() => {
      result.current.approve({ lead: dana(), gender: 'F' })
    })

    await waitFor(() => {
      expect(onSessionExpired).toHaveBeenCalledTimes(1)
    })
    expect(result.current.stateFor(DANA_ROW_NUMBER).errorMessage).toBeUndefined()
  })

  it('should decline without touching the Members tab', async () => {
    const sheet = buildSheet()
    const { result } = renderDecisions({ sheetsClient: sheet.client })

    act(() => {
      result.current.decline({ lead: dana() })
    })

    await waitFor(() => {
      expect(result.current.decidedRowNumbers.has(DANA_ROW_NUMBER)).toBe(true)
    })
    expect(sheet.writes).toEqual([{
        kind: 'update',
        range: 'Leads!K3',
        values: ['Declined'],
        valueInputOption: 'USER_ENTERED',
      }])
  })

  it('should keep an application for later through the same protected path', async () => {
    const sheet = buildSheet()
    const { result } = renderDecisions({ sheetsClient: sheet.client })

    act(() => {
      result.current.markMaybe({ lead: dana() })
    })

    await waitFor(() => {
      expect(result.current.decidedRowNumbers.has(DANA_ROW_NUMBER)).toBe(true)
    })
    expect(sheet.writes).toEqual([{
        kind: 'update',
        range: 'Leads!K3',
        values: ['Maybe in the future'],
        valueInputOption: 'USER_ENTERED',
      }])
  })

  it('should say plainly when the address already belongs to another active member', async () => {
    const sheet = buildSheet({
      members: [
        MEMBERS_HEADER_ROW,
        memberRow({ name: 'Dana Cohen', mail: 'dana@example.com', status: 'Active' }),
      ],
    })
    const { result } = renderDecisions({ sheetsClient: sheet.client })

    act(() => {
      result.current.approve({ lead: dana(), gender: 'F' })
    })

    await waitFor(() => {
      expect(result.current.stateFor(DANA_ROW_NUMBER).errorMessage).toMatch(
        /already belongs to an active member/i,
      )
    })
    expect(sheet.writes).toEqual([])
  })

  it('should forget what it decided when a fresh read of the sheet arrives', async () => {
    const sheet = buildSheet()
    const { result } = renderDecisions({ sheetsClient: sheet.client })

    act(() => {
      result.current.decline({ lead: dana() })
    })
    await waitFor(() => {
      expect(result.current.decidedRowNumbers.has(DANA_ROW_NUMBER)).toBe(true)
    })

    act(() => {
      result.current.forgetDecisions()
    })

    expect(result.current.decidedRowNumbers.size).toBe(0)
  })
})

describe('useLeadDecisions, when a fresh read lands while a decision is still being written', () => {
  const gatedApproval = () => {
    const sheet = buildSheet()
    const gate = createGate()
    let appendCallCount = 0
    const gatedClient: SheetsClient = {
      ...sheet.client,
      appendRow: async (options) => {
        appendCallCount += 1
        await gate.wait
        await sheet.client.appendRow(options)
      },
    }
    return { sheet, gate, gatedClient, appendCount: () => appendCallCount }
  }

  const settle = async () => {
    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 0)
      })
    })
  }

  it('should keep reporting the application as busy, so its buttons do not come back', async () => {
    const { gatedClient } = gatedApproval()
    const { result } = renderDecisions({ sheetsClient: gatedClient })

    act(() => {
      result.current.approve({ lead: dana(), gender: 'F' })
    })
    await waitFor(() => {
      expect(result.current.stateFor(DANA_ROW_NUMBER).isSaving).toBe(true)
    })
    act(() => {
      result.current.forgetDecisions()
    })

    expect(result.current.stateFor(DANA_ROW_NUMBER).isSaving).toBe(true)
  })

  it('should refuse a second decision on a row whose first write has not come back', async () => {
    const { gatedClient, appendCount } = gatedApproval()
    const { result } = renderDecisions({ sheetsClient: gatedClient })

    act(() => {
      result.current.approve({ lead: dana(), gender: 'F' })
    })
    await waitFor(() => {
      expect(appendCount()).toBe(1)
    })
    act(() => {
      result.current.forgetDecisions()
    })
    act(() => {
      result.current.approve({ lead: dana(), gender: 'F' })
    })
    await settle()

    expect(appendCount()).toBe(1)
  })

  it('should not mark anything decided against the read that replaced the one it was written for', async () => {
    const { sheet, gate, gatedClient } = gatedApproval()
    const { result } = renderDecisions({ sheetsClient: gatedClient })

    act(() => {
      result.current.approve({ lead: dana(), gender: 'F' })
    })
    await waitFor(() => {
      expect(result.current.stateFor(DANA_ROW_NUMBER).isSaving).toBe(true)
    })
    act(() => {
      result.current.forgetDecisions()
    })
    await act(async () => {
      gate.open()
      await gate.wait
    })
    await waitFor(() => {
      expect(sheet.rowsOf('Leads')[2]?.[10]).toBe('Approved')
    })

    expect(result.current.decidedRowNumbers.has(DANA_ROW_NUMBER)).toBe(false)
  })

  it('should let the row be decided again once its superseded write has come back', async () => {
    const { sheet, gate, gatedClient, appendCount } = gatedApproval()
    const { result } = renderDecisions({ sheetsClient: gatedClient })

    act(() => {
      result.current.approve({ lead: dana(), gender: 'F' })
    })
    await waitFor(() => {
      expect(appendCount()).toBe(1)
    })
    act(() => {
      result.current.forgetDecisions()
    })
    await act(async () => {
      gate.open()
      await gate.wait
    })
    await waitFor(() => {
      expect(result.current.stateFor(DANA_ROW_NUMBER).isSaving).toBe(false)
    })

    act(() => {
      result.current.decline({ lead: dana() })
    })
    await waitFor(() => {
      expect(result.current.decidedRowNumbers.has(DANA_ROW_NUMBER)).toBe(true)
    })
    expect(sheet.writes.filter((write) => write.kind === 'append')).toHaveLength(1)
  })

  it('should not show a failure from a superseded write on a card from the new read', async () => {
    const sheet = buildSheet()
    const gate = createGate()
    const failingClient: SheetsClient = {
      ...sheet.client,
      appendRow: async () => {
        await gate.wait
        throw new Error('quota exceeded')
      },
    }
    const { result } = renderDecisions({ sheetsClient: failingClient })

    act(() => {
      result.current.approve({ lead: dana(), gender: 'F' })
    })
    await waitFor(() => {
      expect(result.current.stateFor(DANA_ROW_NUMBER).isSaving).toBe(true)
    })
    act(() => {
      result.current.forgetDecisions()
    })
    await act(async () => {
      gate.open()
      await gate.wait.catch(() => {})
    })
    await waitFor(() => {
      expect(result.current.stateFor(DANA_ROW_NUMBER).isSaving).toBe(false)
    })

    expect(result.current.stateFor(DANA_ROW_NUMBER).errorMessage).toBeUndefined()
  })
})

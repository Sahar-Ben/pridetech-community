import { describe, expect, it } from 'vitest'
import {
  ATTENDANCE_TAB_NAME,
  EVENTS_HEADINGS,
  EVENTS_TAB_NAME,
  EVENT_SHEETS_TAB_NAME,
} from './eventRegistryTabs'
import { buildRegistryHeadingWrites } from './registryHeadingWrites'
import type { RegistryTabPlan } from './registrySetupPlan'

describe('buildRegistryHeadingWrites', () => {
  it('should write every heading of an absent tab across row one', () => {
    const writes = buildRegistryHeadingWrites([{ tabName: EVENTS_TAB_NAME, state: 'absent' }])

    expect(writes.map((write) => write.value)).toEqual([...EVENTS_HEADINGS])
    expect(writes.map((write) => write.range).slice(0, 3)).toEqual([
      'Events!A1',
      'Events!B1',
      'Events!C1',
    ])
  })

  it('should write the headings of a tab that is already there and empty', () => {
    const writes = buildRegistryHeadingWrites([
      { tabName: EVENT_SHEETS_TAB_NAME, state: 'empty' },
    ])

    expect(writes.map((write) => write.range)).toEqual([
      "'Event sheets'!A1",
      "'Event sheets'!B1",
      "'Event sheets'!C1",
      "'Event sheets'!D1",
      "'Event sheets'!E1",
    ])
  })

  it('should write nothing into a tab that is already set up', () => {
    expect(buildRegistryHeadingWrites([{ tabName: EVENTS_TAB_NAME, state: 'ready' }])).toEqual([])
  })

  it('should write nothing into a tab that holds something else', () => {
    const unusable: RegistryTabPlan = {
      tabName: EVENTS_TAB_NAME,
      state: 'unusable',
      reason: 'it holds a guest list',
    }

    expect(buildRegistryHeadingWrites([unusable])).toEqual([])
  })

  it('should address one cell per heading rather than a span, so no cell beside them is written', () => {
    const writes = buildRegistryHeadingWrites([{ tabName: ATTENDANCE_TAB_NAME, state: 'absent' }])

    expect(writes.every((write) => /![A-Z]+1$/.test(write.range))).toBe(true)
  })
})

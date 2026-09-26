import { describe, expect, it } from 'vitest'
import {
  ATTENDANCE_TAB_NAME,
  EVENTS_TAB_NAME,
  EVENT_SHEETS_TAB_NAME,
} from './eventRegistryTabs'
import { describeRegistrySetupAction, describeRegistryTabPlan } from './registrySetupText'
import type { RegistryTabPlan } from './registrySetupPlan'

const absent = (tabName: string): RegistryTabPlan => ({ tabName, state: 'absent' })
const empty = (tabName: string): RegistryTabPlan => ({ tabName, state: 'empty' })
const ready = (tabName: string): RegistryTabPlan => ({ tabName, state: 'ready' })

describe('describeRegistrySetupAction', () => {
  it('should say three tabs are being added when none of them are there', () => {
    const action = describeRegistrySetupAction([
      absent(EVENTS_TAB_NAME),
      absent(EVENT_SHEETS_TAB_NAME),
      absent(ATTENDANCE_TAB_NAME),
    ])

    expect(action).toMatch(/add 3 tabs/i)
    expect(action).not.toMatch(/heading row into/i)
  })

  it('should say only headings are being written when every tab is already there and empty', () => {
    const action = describeRegistrySetupAction([
      empty(EVENTS_TAB_NAME),
      empty(EVENT_SHEETS_TAB_NAME),
      empty(ATTENDANCE_TAB_NAME),
    ])

    expect(action).toMatch(/already there and empty/i)
    expect(action).toMatch(/heading row/i)
    expect(action).not.toMatch(/add 3 tabs/i)
  })

  it('should count the added tabs and the filled ones separately when it is doing both', () => {
    const action = describeRegistrySetupAction([
      absent(EVENTS_TAB_NAME),
      empty(EVENT_SHEETS_TAB_NAME),
      empty(ATTENDANCE_TAB_NAME),
    ])

    expect(action).toMatch(/add 1 tab\b/i)
    expect(action).toMatch(/2 tabs/i)
  })

  it('should not offer to add a tab when the only work left is a heading row', () => {
    const action = describeRegistrySetupAction([
      empty(EVENTS_TAB_NAME),
      ready(EVENT_SHEETS_TAB_NAME),
      ready(ATTENDANCE_TAB_NAME),
    ])

    expect(action).not.toMatch(/\badd\b/i)
    expect(action).toMatch(/1 tab\b/i)
  })

  it('should promise that nothing else in the spreadsheet is changed', () => {
    expect(describeRegistrySetupAction([absent(EVENTS_TAB_NAME)])).toMatch(/nothing else/i)
  })
})

describe('describeRegistryTabPlan', () => {
  it('should say an absent tab will be added, and what it will hold', () => {
    const line = describeRegistryTabPlan(absent(EVENTS_TAB_NAME))

    expect(line).toMatch(/will be added/i)
    expect(line).toMatch(/one row per event/i)
  })

  it('should say an empty tab is already there and only gains its headings', () => {
    const line = describeRegistryTabPlan(empty(EVENTS_TAB_NAME))

    expect(line).toMatch(/already there/i)
    expect(line).toMatch(/heading/i)
    expect(line).not.toMatch(/will be added, with/i)
  })

  it('should say a ready tab is left alone', () => {
    expect(describeRegistryTabPlan(ready(EVENTS_TAB_NAME))).toMatch(/nothing will be changed/i)
  })

  it('should give an unusable tab its own reason rather than a generic line', () => {
    expect(
      describeRegistryTabPlan({
        tabName: EVENTS_TAB_NAME,
        state: 'unusable',
        reason: 'it holds a guest list',
      }),
    ).toBe('it holds a guest list')
  })
})

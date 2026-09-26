import { describe, expect, it } from 'vitest'
import { createAttendanceStore } from './attendanceStore'
import { ATTENDANCE_HEADINGS, ATTENDANCE_TAB_NAME } from './eventRegistryTabs'
import { createFakeSheet } from '../../testing/fakeSheet'

const dana = {
  eventId: 'evt-1',
  email: 'dana@example.com',
  name: 'Dana Sorkin',
  status: 'attended' as const,
  at: '2026-10-14T18:00:00.000Z',
}

describe('createAttendanceStore', () => {
  it('should append a check-in to the Attendance tab and read it back', async () => {
    const sheet = createFakeSheet({ tabs: { [ATTENDANCE_TAB_NAME]: [[...ATTENDANCE_HEADINGS]] } })
    const store = createAttendanceStore(sheet.client)

    await store.appendEntry(dana)

    expect(sheet.rowsOf(ATTENDANCE_TAB_NAME)[1]).toEqual([
      'evt-1',
      'dana@example.com',
      'Dana Sorkin',
      'Attended',
      '2026-10-14T18:00:00.000Z',
      '',
    ])
    expect(await store.readEntries()).toEqual([dana])
  })

  it('should write raw, so the timestamp is not turned into a local date', async () => {
    const sheet = createFakeSheet({ tabs: { [ATTENDANCE_TAB_NAME]: [[...ATTENDANCE_HEADINGS]] } })

    await createAttendanceStore(sheet.client).appendEntry(dana)

    expect(sheet.writes.map((write) => write.valueInputOption)).toEqual(['RAW'])
  })

  it('should read the header only once for a run of check-ins', async () => {
    const sheet = createFakeSheet({ tabs: { [ATTENDANCE_TAB_NAME]: [[...ATTENDANCE_HEADINGS]] } })
    const store = createAttendanceStore(sheet.client)

    await store.appendEntry(dana)
    await store.appendEntry({ ...dana, status: 'undone' })

    expect(sheet.client.readRange).toHaveBeenCalledTimes(1)
  })
})

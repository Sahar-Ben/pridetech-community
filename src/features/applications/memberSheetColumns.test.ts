import { describe, expect, it } from 'vitest'
import { buildMemberCellWrites, buildMemberSheetRow, readMemberCell } from './memberSheetColumns'
import { MEMBERS_HEADER_ROW } from '../../testing/sheetsClientFactory'

describe('buildMemberSheetRow', () => {
  it('should place each value under its own heading rather than at a fixed position', () => {
    const row = buildMemberSheetRow({
      membersHeaderRow: ['Mail', 'Status', 'Name'],
      writes: [
        { target: 'name', value: 'Dana Maman' },
        { target: 'mail', value: 'dana@example.com' },
        { target: 'status', value: 'Active' },
      ],
    })

    expect(row).toEqual(['dana@example.com', 'Active', 'Dana Maman'])
  })

  it('should produce a row as wide as the header, so short writes do not shorten the sheet', () => {
    const row = buildMemberSheetRow({
      membersHeaderRow: MEMBERS_HEADER_ROW,
      writes: [{ target: 'name', value: 'Dana Maman' }],
    })

    expect(row).toHaveLength(MEMBERS_HEADER_ROW.length)
  })

  it('should leave a column it was not asked to write empty', () => {
    const row = buildMemberSheetRow({
      membersHeaderRow: ['Name', 'Notes', 'Mail'],
      writes: [
        { target: 'name', value: 'Dana Maman' },
        { target: 'mail', value: 'dana@example.com' },
      ],
    })

    expect(row[1]).toBe('')
  })

  it('should refuse to write at all when a column it was asked for is missing', () => {
    expect(() =>
      buildMemberSheetRow({
        membersHeaderRow: ['Name', 'Company', 'Status'],
        writes: [
          { target: 'name', value: 'Dana Maman' },
          { target: 'mail', value: 'dana@example.com' },
        ],
      }),
    ).toThrow(/Mail/)
  })

  it('should name every missing column at once, so one renamed heading is not found six times', () => {
    expect(() =>
      buildMemberSheetRow({
        membersHeaderRow: ['Name'],
        writes: [
          { target: 'mail', value: 'dana@example.com' },
          { target: 'approvedAt', value: '2026-09-21' },
        ],
      }),
    ).toThrow(/Mail.*Approved at/)
  })

  it('should say the Members tab is the one to check, since the reviewer cannot see which tab failed', () => {
    expect(() =>
      buildMemberSheetRow({
        membersHeaderRow: ['Name'],
        writes: [{ target: 'mail', value: 'dana@example.com' }],
      }),
    ).toThrow(/Members tab/i)
  })
})

describe('readMemberCell', () => {
  it('should read a cell by its heading rather than its position', () => {
    expect(
      readMemberCell({
        membersHeaderRow: ['Mail', 'Gender'],
        row: ['dana@example.com', 'F'],
        target: 'gender',
      }),
    ).toBe('F')
  })

  it('should report a blank cell as absent, so a padded cell is not read as a recorded value', () => {
    expect(
      readMemberCell({ membersHeaderRow: ['Mail', 'Gender'], row: ['dana@example.com', '  '], target: 'gender' }),
    ).toBeUndefined()
  })

  it('should report an absent column as absent rather than reading a neighbouring cell', () => {
    expect(
      readMemberCell({ membersHeaderRow: ['Mail'], row: ['dana@example.com'], target: 'gender' }),
    ).toBeUndefined()
  })
})

describe('buildMemberCellWrites', () => {
  it('should address each value as a single cell on the row it was given', () => {
    expect(
      buildMemberCellWrites({
        membersHeaderRow: ['Name', 'Notes', 'Mail'],
        rowNumber: 57,
        writes: [
          { target: 'name', value: 'Dana Maman' },
          { target: 'mail', value: 'dana@example.com' },
        ],
      }),
    ).toEqual([
      { range: 'Members!A57', value: 'Dana Maman' },
      { range: 'Members!C57', value: 'dana@example.com' },
    ])
  })

  it('should address no cell for a column it was not asked to write', () => {
    const ranges = buildMemberCellWrites({
      membersHeaderRow: ['Name', 'Notes', 'Mail'],
      rowNumber: 57,
      writes: [{ target: 'name', value: 'Dana Maman' }],
    }).map((write) => write.range)

    expect(ranges).toEqual(['Members!A57'])
  })

  it('should write nothing at all when it was asked for a column the tab does not have', () => {
    expect(() =>
      buildMemberCellWrites({
        membersHeaderRow: ['Name'],
        rowNumber: 57,
        writes: [{ target: 'mail', value: 'dana@example.com' }],
      }),
    ).toThrow(/Mail/)
  })
})

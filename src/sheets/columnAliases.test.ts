import { describe, expect, it } from 'vitest'
import { buildHeaderMap, findColumn } from './headerMap'
import { COLUMN_ALIASES } from './columnAliases'

describe('COLUMN_ALIASES', () => {
  it('should prefer a specific job-title column over a generic Title column', () => {
    const headerMap = buildHeaderMap(['Timestamp', 'Title', 'Current Job Title'])
    expect(findColumn({ headerMap, aliases: COLUMN_ALIASES.jobTitle })).toBe(2)
  })

  it('should not treat "Arrived to the bus" as an attendance column', () => {
    const headerMap = buildHeaderMap(['Arrived to the bus'])
    expect(findColumn({ headerMap, aliases: COLUMN_ALIASES.arrived })).toBeUndefined()
  })
})

const realSheetWordings: ReadonlyArray<[keyof typeof COLUMN_ALIASES, readonly string[]]> = [
  ['timestamp', ['Timestamp']],
  ['name', ['Name', 'Full Name']],
  ['jobTitle', ['Job Title', 'Your Job Title', 'Current job title', 'Title']],
  [
    'company',
    [
      'Company',
      'Your Company',
      'Current Employer / Organization / Company',
      'Current Employer / Organization',
    ],
  ],
  ['email', ['Email', 'Your Email', 'E-Mail', 'Mail']],
  ['phone', ['Phone', 'Phone Number']],
  ['linkedIn', ['LinkedIn', 'LinkedIn Profile (Link)']],
  ['city', ['City', 'Which city do you currently live in?']],
  ['interests', ['Interests', 'Please select your areas of interest (you can choose multiple)']],
  ['status', ['Status']],
  ['gender', ['Gender']],
  ['removalReason', ['Removal reason']],
  ['decisionReason', ['Reason', 'Declined reason', 'Decline reason', 'Decision reason']],
  ['approvedAt', ['Approved at']],
  ['arrived', ['Arrived']],
]

describe.each(realSheetWordings)('COLUMN_ALIASES.%s', (group, wordings) => {
  it.each(wordings)('should find the column headed "%s"', (wording) => {
    const headerMap = buildHeaderMap(['Notes', wording])
    expect(findColumn({ headerMap, aliases: COLUMN_ALIASES[group] })).toBe(1)
  })
})

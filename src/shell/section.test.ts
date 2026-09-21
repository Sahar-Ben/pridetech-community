import { describe, expect, it } from 'vitest'
import { DEFAULT_SECTION, SECTION_LABELS, SECTIONS } from './section'

describe('SECTIONS', () => {
  it('should open the workspace on the Overview', () => {
    expect(DEFAULT_SECTION).toBe('overview')
  })

  it('should list Overview first in the sidebar', () => {
    expect(SECTIONS[0]).toBe('overview')
  })

  it('should label every section it offers', () => {
    expect(SECTIONS.map((section) => SECTION_LABELS[section])).toEqual([
      'Overview',
      'Leads',
      'Members',
      'Events',
    ])
  })
})

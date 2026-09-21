import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SectionPlaceholder } from './SectionPlaceholder'

describe('SectionPlaceholder', () => {
  it('should say the section is not built yet', () => {
    render(<SectionPlaceholder title="Members" plannedContent="This will list the community." />)

    expect(screen.getByText(/not built yet/i)).toBeInTheDocument()
  })

  it('should name what the section will hold', () => {
    render(<SectionPlaceholder title="Members" plannedContent="This will list the community." />)

    expect(screen.getByText(/this will list the community/i)).toBeInTheDocument()
  })

  it('should show no rows or list items that could be mistaken for real records', () => {
    render(<SectionPlaceholder title="Members" plannedContent="This will list the community." />)

    expect(screen.queryAllByRole('row')).toHaveLength(0)
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })
})

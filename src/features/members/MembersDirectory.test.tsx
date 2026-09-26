import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { buildMember } from '../../testing/memberFactory'
import { MembersDirectory } from './MembersDirectory'

const dana = buildMember({
  rowNumber: 2,
  name: 'Dana Sorkin',
  mail: 'dana.sorkin@example.com',
  company: 'Ridgeway Systems',
  title: 'Site Reliability Engineer',
  city: 'Tel Aviv',
  gender: 'F',
})

const tomer = buildMember({
  rowNumber: 3,
  name: 'Tomer Reznik',
  mail: 'tomer.reznik@example.com',
  company: 'Palewood Analytics',
  gender: 'M',
})

const sparse = buildMember({ rowNumber: 4, name: 'Roni Halperin', mail: 'roni@example.com' })

const formerMember = buildMember({
  rowNumber: 5,
  name: 'Gaya Ronen',
  mail: 'gaya.ronen@example.com',
  status: 'Ex-member',
  removalReason: 'Moved abroad',
})

const everyone = [dana, tomer, sparse, formerMember]

const renderDirectory = (onSaveMember = vi.fn().mockResolvedValue(undefined)) => {
  render(
    <MembersDirectory
      members={everyone}
      onSaveMember={onSaveMember}
      renderEventHistory={(member) => <p>History of {member.name}</p>}
    />,
  )
  return onSaveMember
}

const listedNames = (): readonly string[] =>
  within(screen.getByRole('table', { name: /members/i }))
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0]?.textContent ?? '')

const searchBox = () => screen.getByRole('searchbox', { name: /search/i })

/* The search is debounced, so the table follows the typing rather than keeping
   up with it. */
const waitForNames = async (names: readonly string[]): Promise<void> => {
  await waitFor(() => {
    expect(listedNames()).toEqual(names)
  })
}

describe('MembersDirectory', () => {
  it('should list the active members in a table', () => {
    renderDirectory()

    expect(listedNames()).toEqual(['Dana Sorkin', 'Tomer Reznik', 'Roni Halperin'])
  })

  it('should leave ex-members out until they are asked for', () => {
    renderDirectory()

    expect(screen.queryByText('Gaya Ronen')).not.toBeInTheDocument()
  })

  it('should show how many members there are and how many are active', () => {
    renderDirectory()

    expect(screen.getByText(/4 members/)).toBeInTheDocument()
    expect(screen.getByText(/3 active/)).toBeInTheDocument()
  })

  it('should report the share of women among active members', () => {
    renderDirectory()

    expect(screen.getByText(/34% women/)).toBeInTheDocument()
  })

  it('should report the share of active members whose gender was never filled in', () => {
    renderDirectory()

    expect(screen.getByText(/33% not recorded/)).toBeInTheDocument()
  })

  it('should narrow the table to the matching company as the user types', async () => {
    renderDirectory()

    await userEvent.type(searchBox(), 'Palewood')

    await waitForNames(['Tomer Reznik'])
  })

  it('should narrow the table by email', async () => {
    renderDirectory()

    await userEvent.type(searchBox(), 'roni@example.com')

    await waitForNames(['Roni Halperin'])
  })

  it('should keep every keystroke in the search box while the table catches up', async () => {
    renderDirectory()

    await userEvent.type(searchBox(), 'Palewood')

    expect(searchBox()).toHaveValue('Palewood')
  })

  it('should list everyone again once the search box is cleared', async () => {
    renderDirectory()

    await userEvent.type(searchBox(), 'Palewood')
    await userEvent.clear(searchBox())

    await waitForNames(['Dana Sorkin', 'Tomer Reznik', 'Roni Halperin'])
  })

  it('should say nobody matched rather than showing an empty table', async () => {
    renderDirectory()

    await userEvent.type(searchBox(), 'nobody-by-this-name')

    expect(await screen.findByText(/no members match/i)).toBeInTheDocument()
    expect(screen.queryByRole('table', { name: /members/i })).not.toBeInTheDocument()
  })

  it('should list only ex-members when the status filter asks for them', async () => {
    renderDirectory()

    await userEvent.selectOptions(screen.getByRole('combobox', { name: /status/i }), 'Ex-member')

    expect(listedNames()).toEqual(['Gaya Ronen'])
  })

  it('should list everyone when the status filter is set to All', async () => {
    renderDirectory()

    await userEvent.selectOptions(screen.getByRole('combobox', { name: /status/i }), 'All')

    expect(listedNames()).toEqual([
      'Dana Sorkin',
      'Tomer Reznik',
      'Roni Halperin',
      'Gaya Ronen',
    ])
  })

  it('should open a member detail when the row is activated from the keyboard', async () => {
    renderDirectory()

    screen.getByRole('button', { name: 'Dana Sorkin' }).focus()
    await userEvent.keyboard('{Enter}')

    expect(screen.getByRole('heading', { name: 'Dana Sorkin' })).toBeInTheDocument()
    expect(screen.queryByRole('table', { name: /members/i })).not.toBeInTheDocument()
  })

  it('should open a member detail when the row is clicked', async () => {
    renderDirectory()

    await userEvent.click(screen.getByRole('button', { name: 'Tomer Reznik' }))

    expect(screen.getByRole('heading', { name: 'Tomer Reznik' })).toBeInTheDocument()
  })

  it('should open the detail of a member whose optional fields are all empty', async () => {
    renderDirectory()

    await userEvent.click(screen.getByRole('button', { name: 'Roni Halperin' }))

    expect(screen.getByRole('heading', { name: 'Roni Halperin' })).toBeInTheDocument()
    expect(screen.getAllByText('Not recorded').length).toBeGreaterThan(0)
  })

  it('should show the removal reason when an ex-member detail is opened', async () => {
    renderDirectory()

    await userEvent.selectOptions(screen.getByRole('combobox', { name: /status/i }), 'Ex-member')
    await userEvent.click(screen.getByRole('button', { name: 'Gaya Ronen' }))

    expect(screen.getByText('Moved abroad')).toBeInTheDocument()
  })

  it('should return to the table when the detail is dismissed', async () => {
    renderDirectory()

    await userEvent.click(screen.getByRole('button', { name: 'Dana Sorkin' }))
    await userEvent.keyboard('{Escape}')

    expect(screen.getByRole('table', { name: /members/i })).toBeInTheDocument()
  })

  it('should put focus back on the row it came from when the detail is dismissed', async () => {
    renderDirectory()

    await userEvent.click(screen.getByRole('button', { name: 'Dana Sorkin' }))
    await userEvent.keyboard('{Escape}')

    expect(screen.getByRole('button', { name: 'Dana Sorkin' })).toHaveFocus()
  })

  it('should keep the search box and filter usable after returning from a detail', async () => {
    renderDirectory()

    await userEvent.click(screen.getByRole('button', { name: 'Dana Sorkin' }))
    await userEvent.keyboard('{Escape}')
    await userEvent.type(searchBox(), 'Palewood')

    await waitForNames(['Tomer Reznik'])
  })

  it('should hand the save the member as it was and as it is now', async () => {
    const onSaveMember = renderDirectory()

    await userEvent.click(screen.getByRole('button', { name: 'Dana Sorkin' }))
    await userEvent.click(screen.getByRole('button', { name: /^edit$/i }))
    const cityField = screen.getByLabelText('City')
    await userEvent.clear(cityField)
    await userEvent.type(cityField, 'Haifa')
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(onSaveMember).toHaveBeenCalledWith({
        originalMember: dana,
        updatedMember: { ...dana, city: 'Haifa' },
      })
    })
  })

  it('should never tell the organiser their edits stayed in this browser', async () => {
    renderDirectory()

    await userEvent.click(screen.getByRole('button', { name: 'Dana Sorkin' }))
    await userEvent.click(screen.getByRole('button', { name: /^edit$/i }))
    const cityField = screen.getByLabelText('City')
    await userEvent.clear(cityField)
    await userEvent.type(cityField, 'Haifa')
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))

    expect(await screen.findByText(/saved to the google sheet/i)).toBeInTheDocument()
    expect(screen.queryByText(/in this browser only/i)).not.toBeInTheDocument()
  })
})

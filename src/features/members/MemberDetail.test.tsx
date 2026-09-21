import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { buildMember } from '../../testing/memberFactory'
import { MemberDetail } from './MemberDetail'
import type { Member } from './member'

const renderDetail = ({
  member,
  onClose = vi.fn(),
  onSave = vi.fn().mockResolvedValue(undefined),
}: {
  member: Member
  onClose?: () => void
  onSave?: (member: Member) => Promise<void>
}) => render(<MemberDetail member={member} onClose={onClose} onSave={onSave} />)

const editButton = () => screen.getByRole('button', { name: /^edit$/i })
const saveButton = () => screen.getByRole('button', { name: /^save$/i })
const cancelButton = () => screen.getByRole('button', { name: /^cancel$/i })

const startEditing = async (member: Member, onSave?: (member: Member) => Promise<void>) => {
  renderDetail(onSave === undefined ? { member } : { member, onSave })
  await userEvent.click(editButton())
}

const retype = async (label: string, value: string) => {
  const field = screen.getByLabelText(label)
  await userEvent.clear(field)
  if (value !== '') {
    await userEvent.type(field, value)
  }
}

describe('MemberDetail', () => {
  it('should name the member it is showing', () => {
    renderDetail({ member: buildMember({ name: 'Dana Sorkin' }) })

    expect(screen.getByRole('heading', { name: 'Dana Sorkin' })).toBeInTheDocument()
  })

  it('should render a member whose every optional field is empty', () => {
    renderDetail({ member: buildMember({ name: 'Roni Halperin' }) })

    expect(screen.getByRole('heading', { name: 'Roni Halperin' })).toBeInTheDocument()
    expect(screen.getByText('Phone')).toBeInTheDocument()
    expect(screen.getAllByText('Not recorded').length).toBeGreaterThan(0)
  })

  it('should show an empty field as empty rather than leaving it out', () => {
    renderDetail({ member: buildMember({ name: 'Roni Halperin', city: undefined }) })

    const cityTerm = screen.getByText('City')
    expect(cityTerm.nextElementSibling).toHaveTextContent('Not recorded')
  })

  it('should show why an ex-member was removed', () => {
    renderDetail({
      member: buildMember({
        name: 'Gaya Ronen',
        status: 'Ex-member',
        removalReason: 'Moved abroad',
      }),
    })

    expect(screen.getByText('Removal reason')).toBeInTheDocument()
    expect(screen.getByText('Moved abroad')).toBeInTheDocument()
  })

  it('should not offer a removal reason for someone who is still a member', () => {
    renderDetail({ member: buildMember({ name: 'Dana Sorkin' }) })

    expect(screen.queryByText('Removal reason')).not.toBeInTheDocument()
  })

  it('should say the event history is not built yet instead of inventing attendance', () => {
    renderDetail({ member: buildMember({ name: 'Dana Sorkin' }) })

    expect(screen.getByRole('heading', { name: /event history/i })).toBeInTheDocument()
    expect(screen.getByText(/not built yet/i)).toBeInTheDocument()
  })

  it('should take focus when it opens so a keyboard reaches it', () => {
    renderDetail({ member: buildMember({ name: 'Dana Sorkin' }) })

    expect(screen.getByRole('heading', { name: 'Dana Sorkin' })).toHaveFocus()
  })

  it('should close when the back button is pressed', async () => {
    const onClose = vi.fn()
    renderDetail({ member: buildMember({ name: 'Dana Sorkin' }), onClose })

    await userEvent.click(screen.getByRole('button', { name: /back to members/i }))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('should close on Escape', async () => {
    const onClose = vi.fn()
    renderDetail({ member: buildMember({ name: 'Dana Sorkin' }), onClose })

    await userEvent.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('should link to the member email address', () => {
    renderDetail({ member: buildMember({ name: 'Dana Sorkin', mail: 'dana.sorkin@example.com' }) })

    expect(screen.getByRole('link', { name: 'dana.sorkin@example.com' })).toHaveAttribute(
      'href',
      'mailto:dana.sorkin@example.com',
    )
  })

  it('should show an Edit button on the member detail', () => {
    renderDetail({ member: buildMember({ name: 'Dana Sorkin' }) })

    expect(editButton()).toBeInTheDocument()
  })

  it('should show the current values in the form when editing starts', async () => {
    await startEditing(
      buildMember({
        name: 'Dana Sorkin',
        company: 'Ridgeway Systems',
        title: 'Site Reliability Engineer',
        mail: 'dana.sorkin@example.com',
        city: 'Tel Aviv',
        gender: 'F',
      }),
    )

    expect(screen.getByLabelText('Name')).toHaveValue('Dana Sorkin')
    expect(screen.getByLabelText('Company')).toHaveValue('Ridgeway Systems')
    expect(screen.getByLabelText('Title')).toHaveValue('Site Reliability Engineer')
    expect(screen.getByLabelText('Email')).toHaveValue('dana.sorkin@example.com')
    expect(screen.getByLabelText('City')).toHaveValue('Tel Aviv')
    expect(screen.getByLabelText('Gender')).toHaveValue('F')
  })

  it('should move focus into the form when editing starts', async () => {
    await startEditing(buildMember({ name: 'Dana Sorkin' }))

    expect(screen.getByLabelText('Name')).toHaveFocus()
  })

  it('should restore the original values when the edit is cancelled', async () => {
    await startEditing(buildMember({ name: 'Dana Sorkin', city: 'Tel Aviv' }))

    await retype('Name', 'Someone Else')
    await retype('City', 'Haifa')
    await retype('Name', 'Yet Another Name')
    await userEvent.click(cancelButton())

    expect(screen.getByRole('heading', { name: 'Dana Sorkin' })).toBeInTheDocument()
    expect(screen.getByText('Tel Aviv')).toBeInTheDocument()

    await userEvent.click(editButton())

    expect(screen.getByLabelText('Name')).toHaveValue('Dana Sorkin')
    expect(screen.getByLabelText('City')).toHaveValue('Tel Aviv')
  })

  it('should return focus to the Edit button when the edit is cancelled', async () => {
    await startEditing(buildMember({ name: 'Dana Sorkin' }))

    await userEvent.click(cancelButton())

    expect(editButton()).toHaveFocus()
  })

  it('should cancel the edit instead of closing the detail when Escape is pressed while editing', async () => {
    const onClose = vi.fn()
    renderDetail({ member: buildMember({ name: 'Dana Sorkin' }), onClose })
    await userEvent.click(editButton())

    await retype('Name', 'Someone Else')
    await userEvent.keyboard('{Escape}')

    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'Dana Sorkin' })).toBeInTheDocument()
  })

  it('should pass the updated member to onSave when saved', async () => {
    const onSave = vi.fn()
    await startEditing(buildMember({ rowNumber: 4, name: 'Dana Sorkin', city: 'Tel Aviv' }), onSave)

    await retype('City', 'Haifa')
    await retype('Notes', 'Runs the mentorship circle')
    await userEvent.click(saveButton())

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        rowNumber: 4,
        name: 'Dana Sorkin',
        city: 'Haifa',
        notes: 'Runs the mentorship circle',
      }),
    )
  })

  it('should return to the read-only view once the edit is saved', async () => {
    await startEditing(buildMember({ name: 'Dana Sorkin', city: 'Tel Aviv' }))

    await retype('City', 'Haifa')
    await userEvent.click(saveButton())

    expect(editButton()).toBeInTheDocument()
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument()
  })

  it('should confirm the edit reached the sheet rather than warning it did not', async () => {
    await startEditing(buildMember({ name: 'Dana Sorkin', city: 'Tel Aviv' }))

    await retype('City', 'Haifa')
    await userEvent.click(saveButton())

    expect(await screen.findByText(/saved to the google sheet/i)).toBeInTheDocument()
    expect(screen.queryByText(/in this browser only/i)).not.toBeInTheDocument()
  })

  it('should keep the confirmation on screen instead of letting it fade', async () => {
    await startEditing(buildMember({ name: 'Dana Sorkin', city: 'Tel Aviv' }))

    await retype('City', 'Haifa')
    await userEvent.click(saveButton())
    await userEvent.click(editButton())
    await userEvent.click(cancelButton())

    expect(screen.getByText(/saved to the google sheet/i)).toBeInTheDocument()
  })

  it('should show the removal reason field only when the status is Ex-member', async () => {
    await startEditing(buildMember({ name: 'Dana Sorkin' }))

    expect(screen.queryByLabelText('Removal reason')).not.toBeInTheDocument()

    await userEvent.selectOptions(screen.getByLabelText('Status'), 'Ex-member')

    expect(screen.getByLabelText('Removal reason')).toBeInTheDocument()
  })

  it('should clear the removal reason when the status returns to Active', async () => {
    const onSave = vi.fn()
    await startEditing(
      buildMember({ name: 'Gaya Ronen', status: 'Ex-member', removalReason: 'Moved abroad' }),
      onSave,
    )

    await userEvent.selectOptions(screen.getByLabelText('Status'), 'Active')
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'Ex-member')

    expect(screen.getByLabelText('Removal reason')).toHaveValue('')

    await userEvent.selectOptions(screen.getByLabelText('Status'), 'Active')
    await userEvent.click(saveButton())

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'Active', removalReason: undefined }),
    )
  })

  it('should refuse to save a member with no name', async () => {
    const onSave = vi.fn()
    await startEditing(buildMember({ name: 'Dana Sorkin' }), onSave)

    await retype('Name', '')
    await userEvent.click(saveButton())

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription(/name/i)
  })

  it('should refuse to save a member with no email', async () => {
    const onSave = vi.fn()
    await startEditing(buildMember({ name: 'Dana Sorkin' }), onSave)

    await retype('Email', '')
    await userEvent.click(saveButton())

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription(/email/i)
  })

  it('should warn when the email has been changed, since it is the matching key', async () => {
    await startEditing(buildMember({ name: 'Dana Sorkin', mail: 'dana@example.com' }))

    expect(screen.queryByText(/match/i)).not.toBeInTheDocument()

    await retype('Email', 'dana.sorkin@example.com')

    expect(screen.getByText(/event history and applications/i)).toBeInTheDocument()
  })

  it('should keep Approved at read-only while editing', async () => {
    await startEditing(buildMember({ name: 'Dana Sorkin', approvedAt: '2023-02-14' }))

    const approvedAtField = screen.getByLabelText('Approved at')
    expect(approvedAtField).toHaveValue('2023-02-14')
    expect(approvedAtField).toHaveAttribute('readonly')
  })
})

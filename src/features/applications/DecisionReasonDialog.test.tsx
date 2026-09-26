import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DecisionReasonDialog } from './DecisionReasonDialog'
import type { ReasonedDecisionKind } from './decisionReason'

const renderDialog = ({
  kind = 'decline',
  applicantName = 'Dana Maman',
  isSaving = false,
  onCancel = vi.fn(),
  onSubmit = vi.fn(),
}: {
  kind?: ReasonedDecisionKind
  applicantName?: string
  isSaving?: boolean
  onCancel?: () => void
  onSubmit?: (reason: string | undefined) => void
} = {}) => {
  render(
    <DecisionReasonDialog
      applicantName={applicantName}
      isSaving={isSaving}
      kind={kind}
      onCancel={onCancel}
      onSubmit={onSubmit}
    />,
  )
  return { onCancel, onSubmit }
}

const reasonField = (): HTMLElement => screen.getByLabelText(/reason/i)

const applyButton = (): HTMLElement => screen.getByRole('button', { name: /apply/i })

describe('DecisionReasonDialog', () => {
  it('should be a modal dialog named by its own heading', () => {
    renderDialog()

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName(
      screen.getByRole('heading', { level: 2 }).textContent ?? '',
    )
  })

  it('should ask why the applicant is being declined', () => {
    renderDialog({ kind: 'decline' })
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/declin/i)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Dana Maman')
  })

  it('should ask why the applicant is being kept for later rather than why they were declined', () => {
    renderDialog({ kind: 'maybe' })
    expect(screen.getByRole('heading', { level: 2 })).not.toHaveTextContent(/declin/i)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/later/i)
  })

  it('should move focus into the dialog so the reviewer can type straight away', () => {
    renderDialog()
    expect(reasonField()).toHaveFocus()
  })

  it('should offer the reasons an application is turned away for', () => {
    renderDialog({ kind: 'decline' })

    expect(screen.getByRole('button', { name: 'Not in Tech' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Less than 3 years' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'In tech but not in the Industry' })).toBeInTheDocument()
  })

  it('should not offer the declining reasons when somebody is being kept for later', () => {
    renderDialog({ kind: 'maybe' })
    expect(screen.queryByRole('button', { name: 'Not in Tech' })).not.toBeInTheDocument()
  })

  it('should refuse to apply until there is a reason', () => {
    renderDialog()
    expect(applyButton()).toBeDisabled()
  })

  it('should refuse to apply a reason of spaces alone', async () => {
    renderDialog()

    await userEvent.type(reasonField(), '   ')

    expect(applyButton()).toBeDisabled()
  })

  it('should let the reviewer apply once they have written a reason', async () => {
    renderDialog()

    await userEvent.type(reasonField(), 'Moving abroad')

    expect(applyButton()).toBeEnabled()
  })

  it('should fill the field with the chip the reviewer picked', async () => {
    renderDialog()

    await userEvent.click(screen.getByRole('button', { name: 'Not in Tech' }))

    expect(reasonField()).toHaveValue('Not in Tech')
  })

  it('should add a second chip beside the first', async () => {
    renderDialog()

    await userEvent.click(screen.getByRole('button', { name: 'Not in Tech' }))
    await userEvent.click(screen.getByRole('button', { name: 'Less than 3 years' }))

    expect(reasonField()).toHaveValue('Not in Tech, Less than 3 years')
  })

  it('should take a chip back out of the field when it is picked again', async () => {
    renderDialog()

    await userEvent.click(screen.getByRole('button', { name: 'Not in Tech' }))
    await userEvent.click(screen.getByRole('button', { name: 'Not in Tech' }))

    expect(reasonField()).toHaveValue('')
  })

  it('should show a chip whose text is in the field as selected', async () => {
    renderDialog()

    await userEvent.click(screen.getByRole('button', { name: 'Not in Tech' }))

    expect(screen.getByRole('button', { name: 'Not in Tech' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Less than 3 years' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('should read a chip the reviewer typed out by hand as selected', async () => {
    renderDialog()

    await userEvent.type(reasonField(), 'Not in Tech')

    expect(screen.getByRole('button', { name: 'Not in Tech' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('should keep the reviewer own words editable after a chip filled the field', async () => {
    renderDialog()

    await userEvent.click(screen.getByRole('button', { name: 'Not in Tech' }))
    await userEvent.type(reasonField(), ', and moving abroad')

    expect(reasonField()).toHaveValue('Not in Tech, and moving abroad')
  })

  it('should apply the reason the reviewer wrote', async () => {
    const { onSubmit } = renderDialog()

    await userEvent.type(reasonField(), 'Moving abroad')
    await userEvent.click(applyButton())

    expect(onSubmit).toHaveBeenCalledWith('Moving abroad')
  })

  it('should apply the reason without the spaces around it', async () => {
    const { onSubmit } = renderDialog()

    await userEvent.type(reasonField(), '  Moving abroad  ')
    await userEvent.click(applyButton())

    expect(onSubmit).toHaveBeenCalledWith('Moving abroad')
  })

  it('should take the decision with no reason when the reviewer skips', async () => {
    const { onSubmit } = renderDialog()

    await userEvent.click(screen.getByRole('button', { name: /skip/i }))

    expect(onSubmit).toHaveBeenCalledWith(undefined)
  })

  it('should let the reviewer skip even after typing, since skipping is not applying', async () => {
    const { onSubmit } = renderDialog()

    await userEvent.type(reasonField(), 'Moving abroad')
    await userEvent.click(screen.getByRole('button', { name: /skip/i }))

    expect(onSubmit).toHaveBeenCalledWith(undefined)
  })

  it('should cancel rather than decide when the reviewer presses Escape', async () => {
    const { onCancel, onSubmit } = renderDialog()

    await userEvent.type(reasonField(), 'Moving abroad')
    await userEvent.keyboard('{Escape}')

    expect(onCancel).toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('should cancel rather than decide when the reviewer closes it', async () => {
    const { onCancel, onSubmit } = renderDialog()

    await userEvent.click(screen.getByRole('button', { name: /close/i }))

    expect(onCancel).toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('should keep Shift+Tab inside the dialog rather than letting focus fall behind it', async () => {
    renderDialog()
    screen.getByRole('button', { name: /close/i }).focus()

    await userEvent.tab({ shift: true })

    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true)
  })

  it('should keep focus inside the dialog when Tab reaches its last control', async () => {
    renderDialog()
    await userEvent.type(reasonField(), 'Moving abroad')
    applyButton().focus()

    await userEvent.tab()

    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true)
  })

  it('should say that the decision is being written while it is in flight', () => {
    renderDialog({ isSaving: true })
    expect(screen.getByRole('status')).toHaveTextContent(/saving/i)
  })

  it('should not let the reviewer decide a second time while the first is in flight', () => {
    renderDialog({ isSaving: true })

    expect(applyButton()).toBeDisabled()
    expect(screen.getByRole('button', { name: /skip/i })).toBeDisabled()
    expect(reasonField()).toBeDisabled()
  })
})

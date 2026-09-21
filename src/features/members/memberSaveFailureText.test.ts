import { describe, expect, it } from 'vitest'
import { buildMember } from '../../testing/memberFactory'
import { describeMemberSaveFailure } from './memberSaveFailureText'
import { SheetsRequestError } from '../../sheets/sheetsRequestError'

const failureFor = ({
  member = buildMember({ name: 'Dana Sorkin' }),
  error = new Error('Google was unreachable'),
}: {
  member?: ReturnType<typeof buildMember>
  error?: unknown
} = {}) => describeMemberSaveFailure({ member, error })

describe('describeMemberSaveFailure', () => {
  it('should name the member whose edit was lost', () => {
    expect(failureFor()).toMatch(/^Dana Sorkin was not saved\./)
  })

  it('should carry the reason Google gave', () => {
    expect(failureFor()).toMatch(/Google was unreachable/)
  })

  it('should fall back to the address when the row has no name', () => {
    const member = buildMember({ name: '', mail: 'roni@example.com' })

    expect(failureFor({ member })).toMatch(/^roni@example\.com was not saved\./)
  })

  it('should point at the row when there is neither a name nor an address', () => {
    const member = buildMember({ rowNumber: 512, name: '', mail: '' })

    expect(failureFor({ member })).toMatch(/^the member on row 512 was not saved\./)
  })

  it('should say a refusal is about picking the spreadsheet again', () => {
    const refusal = new SheetsRequestError({ range: 'Members!I2', status: 403, detail: 'denied' })

    expect(failureFor({ error: refusal })).toMatch(/pick this one again/i)
  })

  it('should say something rather than nothing when the failure carries no message', () => {
    const silentFailure = describeMemberSaveFailure({
      member: buildMember({ name: 'Dana Sorkin' }),
      error: undefined,
    })

    expect(silentFailure).toMatch(/Google gave no detail/)
  })
})

import { describe, expect, it } from 'vitest'
import { buildMember } from '../../testing/memberFactory'
import { applyDraftToMember, hasMailChanged, toMemberDraft, withDraftStatus } from './memberDraft'

describe('toMemberDraft', () => {
  it('should offer an empty box for a column the sheet never filled in', () => {
    const draft = toMemberDraft(buildMember({ city: undefined, gender: undefined }))

    expect(draft.city).toBe('')
    expect(draft.gender).toBe('')
  })

  it('should carry the recorded values into the form', () => {
    const draft = toMemberDraft(
      buildMember({
        name: 'Dana Sorkin',
        company: 'Ridgeway Systems',
        gender: 'F',
        status: 'Ex-member',
        removalReason: 'Moved abroad',
      }),
    )

    expect(draft).toMatchObject({
      name: 'Dana Sorkin',
      company: 'Ridgeway Systems',
      gender: 'F',
      status: 'Ex-member',
      removalReason: 'Moved abroad',
    })
  })
})

describe('applyDraftToMember', () => {
  const member = buildMember({ rowNumber: 7, name: 'Dana Sorkin', approvedAt: '2023-02-14' })

  it('should keep the edited values', () => {
    const draft = { ...toMemberDraft(member), name: 'Dana Sorkin-Levi', city: 'Haifa' }

    expect(applyDraftToMember({ member, draft })).toMatchObject({
      name: 'Dana Sorkin-Levi',
      city: 'Haifa',
    })
  })

  it('should record a cleared box as a column nobody filled in', () => {
    const draft = { ...toMemberDraft(buildMember({ city: 'Haifa' })), city: '   ' }

    expect(applyDraftToMember({ member, draft }).city).toBeUndefined()
  })

  it('should trim the surrounding whitespace a hand-typed value picks up', () => {
    const draft = { ...toMemberDraft(member), name: '  Dana Sorkin  ' }

    expect(applyDraftToMember({ member, draft }).name).toBe('Dana Sorkin')
  })

  it('should keep the row it came from and when it was approved', () => {
    const draft = { ...toMemberDraft(member), name: 'Dana Sorkin-Levi' }

    expect(applyDraftToMember({ member, draft })).toMatchObject({
      rowNumber: 7,
      approvedAt: '2023-02-14',
    })
  })

  it('should leave an active member without a removal reason', () => {
    const draft = { ...toMemberDraft(member), status: 'Active' as const, removalReason: 'Other' as const }

    expect(applyDraftToMember({ member, draft }).removalReason).toBeUndefined()
  })

  it('should not change the member it was given', () => {
    const draft = { ...toMemberDraft(member), name: 'Dana Sorkin-Levi' }

    applyDraftToMember({ member, draft })

    expect(member.name).toBe('Dana Sorkin')
  })
})

describe('withDraftStatus', () => {
  it('should forget the removal reason when someone is made active again', () => {
    const draft = {
      ...toMemberDraft(buildMember({ status: 'Ex-member', removalReason: 'Moved abroad' })),
    }

    expect(withDraftStatus({ draft, status: 'Active' }).removalReason).toBe('')
  })

  it('should keep the removal reason while the member stays an ex-member', () => {
    const draft = {
      ...toMemberDraft(buildMember({ status: 'Ex-member', removalReason: 'Moved abroad' })),
    }

    expect(withDraftStatus({ draft, status: 'Ex-member' }).removalReason).toBe('Moved abroad')
  })
})

describe('hasMailChanged', () => {
  it('should notice an address the editor replaced', () => {
    const member = buildMember({ mail: 'dana@example.com' })
    const draft = { ...toMemberDraft(member), mail: 'dana.sorkin@example.com' }

    expect(hasMailChanged({ member, draft })).toBe(true)
  })

  it('should not call added whitespace a changed address', () => {
    const member = buildMember({ mail: 'dana@example.com' })
    const draft = { ...toMemberDraft(member), mail: ' dana@example.com ' }

    expect(hasMailChanged({ member, draft })).toBe(false)
  })
})

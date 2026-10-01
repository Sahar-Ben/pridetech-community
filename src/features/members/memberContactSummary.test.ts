import { describe, expect, it } from 'vitest'
import { buildMemberContactSummary } from './memberContactSummary'
import { buildMember } from '../../testing/memberFactory'

describe('buildMemberContactSummary', () => {
  it('should list the person and every way to reach them, one per line', () => {
    const member = buildMember({
      name: 'Achva Rettig',
      title: 'Senior product analyst',
      company: 'Scopely',
      mail: 'achva@example.com',
      phone: '0522653289',
      linkedIn: 'www.linkedin.com/in/achva',
      city: 'Rishon LeZion',
    })

    expect(buildMemberContactSummary(member)).toBe(
      [
        'Achva Rettig',
        'Senior product analyst · Scopely',
        'Email: achva@example.com',
        'Phone: 0522653289',
        'LinkedIn: https://www.linkedin.com/in/achva',
        'City: Rishon LeZion',
      ].join('\n'),
    )
  })

  it('should leave blank fields out rather than print empty labels', () => {
    const member = buildMember({
      name: 'Dana',
      title: undefined,
      company: undefined,
      mail: '',
      phone: undefined,
      linkedIn: undefined,
      city: undefined,
    })

    expect(buildMemberContactSummary(member)).toBe('Dana')
  })
})

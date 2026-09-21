import { describe, expect, it } from 'vitest'
import { classifyPosition, NO_TITLE_POSITION, UNCLASSIFIED_POSITION } from './classifyPosition'

const positionOf = (title: string | undefined): string => classifyPosition(title).key

describe('classifyPosition', () => {
  it('should read engineering out of the titles that name it', () => {
    expect(positionOf('Site Reliability Engineer')).toBe('engineering')
    expect(positionOf('iOS Developer')).toBe('engineering')
    expect(positionOf('Solutions Architect')).toBe('engineering')
    expect(positionOf('VP R&D')).toBe('engineering')
  })

  it('should read the specific discipline rather than the word engineer it is built on', () => {
    expect(positionOf('Data Engineer')).toBe('data-and-analytics')
    expect(positionOf('Penetration Tester')).toBe('security')
  })

  it('should read design out of a research title that is a design title', () => {
    expect(positionOf('UX Researcher')).toBe('design')
    expect(positionOf('Head of Research')).toBe('research')
  })

  it('should read product, people, legal and operations out of their titles', () => {
    expect(positionOf('Product Manager')).toBe('product')
    expect(positionOf('Chief people officer')).toBe('people-and-hr')
    expect(positionOf('Legal Counsel')).toBe('finance-and-legal')
    expect(positionOf('Operations Manager')).toBe('operations')
  })

  it('should read a founder as a founder rather than as whatever they also do', () => {
    expect(positionOf('Co-founder, CEO')).toBe('founder-and-general-management')
  })

  it('should put a title no rule recognises in the unclassified bucket rather than guessing', () => {
    expect(positionOf('Chief Vibes Officer')).toBe(UNCLASSIFIED_POSITION.key)
    expect(positionOf('\u{05DE}\u{05E4}\u{05EA}\u{05D7}\u{05EA}')).toBe(UNCLASSIFIED_POSITION.key)
  })

  it('should tell a member with no title at all apart from one whose title was not recognised', () => {
    expect(positionOf(undefined)).toBe(NO_TITLE_POSITION.key)
    expect(positionOf('   ')).toBe(NO_TITLE_POSITION.key)
    expect(NO_TITLE_POSITION.key).not.toBe(UNCLASSIFIED_POSITION.key)
  })

  it('should resolve a title matching several disciplines by the documented order, every time', () => {
    expect(positionOf('Security Data Engineer')).toBe('security')
    expect(positionOf('Data Engineer Security')).toBe('security')
  })

  it('should label every category it returns', () => {
    expect(classifyPosition('Product Manager').label).toBe('Product')
    expect(classifyPosition(undefined).label).toBe('No title recorded')
  })
})

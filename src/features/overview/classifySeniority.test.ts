import { describe, expect, it } from 'vitest'
import { classifySeniority, NO_LEVEL_SENIORITY, NO_TITLE_SENIORITY } from './classifySeniority'

const levelOf = (title: string | undefined): string => classifySeniority(title).key

describe('classifySeniority', () => {
  it('should read the executive titles as executive', () => {
    expect(levelOf('VP R&D')).toBe('executive')
    expect(levelOf('Chief people officer')).toBe('executive')
    expect(levelOf('Co-founder, CEO')).toBe('executive')
  })

  it('should read a head of something as a director', () => {
    expect(levelOf('Head of Product')).toBe('director')
  })

  it('should read the manager, lead, senior and junior rungs', () => {
    expect(levelOf('Engineering Manager')).toBe('manager')
    expect(levelOf('QA Lead')).toBe('lead')
    expect(levelOf('Senior Backend Developer')).toBe('senior')
    expect(levelOf('Junior Frontend Developer')).toBe('junior')
  })

  it('should resolve a title naming two rungs to the higher one, every time', () => {
    expect(levelOf('Senior Engineering Manager')).toBe('manager')
    expect(levelOf('VP, Senior Director of Data')).toBe('executive')
    expect(levelOf('Junior Team Lead')).toBe('lead')
  })

  it('should not read a manager of a thing as a manager of people', () => {
    expect(levelOf('Product Manager')).toBe(NO_LEVEL_SENIORITY.key)
    expect(levelOf('Clinical Data Manager')).toBe(NO_LEVEL_SENIORITY.key)
    expect(levelOf('Community Manager')).toBe(NO_LEVEL_SENIORITY.key)
  })

  it('should still read the rung a manager of a thing was given', () => {
    expect(levelOf('Senior Product Manager')).toBe('senior')
  })

  it('should say a title states no level rather than inventing one for it', () => {
    expect(levelOf('Site Reliability Engineer')).toBe(NO_LEVEL_SENIORITY.key)
    expect(levelOf('Data Scientist')).toBe(NO_LEVEL_SENIORITY.key)
  })

  it('should tell a member with no title apart from one whose title states no level', () => {
    expect(levelOf(undefined)).toBe(NO_TITLE_SENIORITY.key)
    expect(NO_TITLE_SENIORITY.key).not.toBe(NO_LEVEL_SENIORITY.key)
  })

  it('should label every level it returns', () => {
    expect(classifySeniority('QA Lead').label).toBe('Lead / Staff / Principal')
  })
})

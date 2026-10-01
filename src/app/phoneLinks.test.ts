import { describe, expect, it } from 'vitest'
import { toInternationalDigits, toTelHref, toWhatsAppHref } from './phoneLinks'

describe('toInternationalDigits', () => {
  it.each([
    ['0522653289', '972522653289'],
    ['052-265-3289', '972522653289'],
    ['052 265 3289', '972522653289'],
    ['+972 52-265-3289', '972522653289'],
    ['+972522653289', '972522653289'],
    ['972522653289', '972522653289'],
    ['00972522653289', '972522653289'],
    ['522653289', '972522653289'],
    ['03-1234567', '97231234567'],
    ['+1 248 302 3477', '12483023477'],
    ['+44 20 7946 0958', '442079460958'],
  ])('should read %j as %j', (phone, expected) => {
    expect(toInternationalDigits(phone)).toBe(expected)
  })

  it.each([undefined, '', '   ', '050', 'no phone', '-'])(
    'should find no number in %j',
    (phone) => {
      expect(toInternationalDigits(phone)).toBeUndefined()
    },
  )
})

describe('toWhatsAppHref', () => {
  it('should open a chat with an Israeli mobile typed locally', () => {
    expect(toWhatsAppHref('052-265-3289')).toBe('https://wa.me/972522653289')
  })

  it('should give no link when there is no number', () => {
    expect(toWhatsAppHref(undefined)).toBeUndefined()
  })
})

describe('toTelHref', () => {
  it('should dial the international form, which works from any phone', () => {
    expect(toTelHref('0522653289')).toBe('tel:+972522653289')
  })

  it('should give no link when there is no number', () => {
    expect(toTelHref('n/a')).toBeUndefined()
  })
})

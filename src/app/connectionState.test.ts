import { describe, expect, it } from 'vitest'
import { resolveConnectionState } from './connectionState'

describe('resolveConnectionState', () => {
  it('should be signed out when there is no access token', () => {
    expect(resolveConnectionState({ accessToken: undefined, spreadsheetId: 'sheet-1' })).toBe(
      'signed-out',
    )
  })

  it('should need a spreadsheet when signed in without one chosen', () => {
    expect(resolveConnectionState({ accessToken: 'token', spreadsheetId: undefined })).toBe(
      'needs-spreadsheet',
    )
  })

  it('should be ready once both a token and a spreadsheet are known', () => {
    expect(resolveConnectionState({ accessToken: 'token', spreadsheetId: 'sheet-1' })).toBe('ready')
  })

  it('should stay signed out even when a spreadsheet is remembered from a previous session', () => {
    expect(resolveConnectionState({ accessToken: undefined, spreadsheetId: undefined })).toBe(
      'signed-out',
    )
  })
})

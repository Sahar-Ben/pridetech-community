import { afterEach, describe, expect, it, vi } from 'vitest'
import { createGoogleSpreadsheetPicker } from './googlePicker'
import type { GooglePickerBuilder, GooglePickerResponse } from '../google/googleGlobals'

const PICKED = 'picked'
const CANCEL = 'cancel'
const SPREADSHEETS_VIEW_ID = 'spreadsheets'

const stubGooglePicker = () => {
  const setVisible = vi.fn()
  const calls = {
    viewIds: [] as string[],
    oauthTokens: [] as string[],
    developerKeys: [] as string[],
    appIds: [] as string[],
  }
  let pickerCallback: ((response: GooglePickerResponse) => void) | undefined

  const builder: GooglePickerBuilder = {
    addView: () => builder,
    setOAuthToken: (accessToken) => {
      calls.oauthTokens.push(accessToken)
      return builder
    },
    setDeveloperKey: (apiKey) => {
      calls.developerKeys.push(apiKey)
      return builder
    },
    setAppId: (appId) => {
      calls.appIds.push(appId)
      return builder
    },
    setTitle: () => builder,
    setCallback: (callback) => {
      pickerCallback = callback
      return builder
    },
    build: () => ({ setVisible }),
  }

  window.gapi = {
    load: (_libraryName, callback) => {
      callback()
    },
  }
  window.google = {
    picker: {
      PickerBuilder: function PickerBuilderStub(this: GooglePickerBuilder) {
        return builder
      } as unknown as new () => GooglePickerBuilder,
      DocsView: function DocsViewStub(this: object, viewId: string) {
        calls.viewIds.push(viewId)
        return {}
      } as unknown as new (viewId: string) => object,
      ViewId: { SPREADSHEETS: SPREADSHEETS_VIEW_ID },
      Action: { PICKED, CANCEL },
    },
  }

  const respond = (response: GooglePickerResponse) => {
    if (pickerCallback === undefined) {
      throw new Error('the picker was never given a callback')
    }
    pickerCallback(response)
  }

  return { calls, setVisible, respond }
}

const openPicker = (callbacks: {
  onPicked?: (spreadsheetId: string) => void
  onCancelled?: () => void
  onError?: (message: string) => void
}) => {
  const pickSpreadsheet = createGoogleSpreadsheetPicker({ apiKey: 'api-key', appId: 'app-id' })
  pickSpreadsheet({
    accessToken: 'token-1',
    onPicked: callbacks.onPicked ?? vi.fn(),
    onCancelled: callbacks.onCancelled ?? vi.fn(),
    onError: callbacks.onError ?? vi.fn(),
  })
}

afterEach(() => {
  delete window.gapi
  delete window.google
})

describe('createGoogleSpreadsheetPicker', () => {
  it('should show a spreadsheets-only picker with the token, developer key and app id', () => {
    const picker = stubGooglePicker()

    openPicker({})

    expect(picker.calls.viewIds).toEqual([SPREADSHEETS_VIEW_ID])
    expect(picker.calls.oauthTokens).toEqual(['token-1'])
    expect(picker.calls.developerKeys).toEqual(['api-key'])
    expect(picker.calls.appIds).toEqual(['app-id'])
    expect(picker.setVisible).toHaveBeenCalledWith(true)
  })

  it('should report the id of the chosen spreadsheet', () => {
    const picker = stubGooglePicker()
    const onPicked = vi.fn()

    openPicker({ onPicked })
    picker.respond({ action: PICKED, docs: [{ id: 'spreadsheet-1' }] })

    expect(onPicked).toHaveBeenCalledWith('spreadsheet-1')
  })

  it('should report a cancelled picker', () => {
    const picker = stubGooglePicker()
    const onCancelled = vi.fn()

    openPicker({ onCancelled })
    picker.respond({ action: CANCEL })

    expect(onCancelled).toHaveBeenCalledTimes(1)
  })

  it('should ignore lifecycle callbacks that answer neither question', () => {
    const picker = stubGooglePicker()
    const onPicked = vi.fn()
    const onCancelled = vi.fn()
    const onError = vi.fn()

    openPicker({ onPicked, onCancelled, onError })
    picker.respond({ action: 'loaded' })

    expect(onPicked).not.toHaveBeenCalled()
    expect(onCancelled).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })

  it('should report a pick that carried no file rather than storing nothing', () => {
    const picker = stubGooglePicker()
    const onError = vi.fn()

    openPicker({ onError })
    picker.respond({ action: PICKED, docs: [] })

    expect(onError).toHaveBeenCalledWith(expect.stringMatching(/no file/i))
  })

  it('should say the script has not loaded when the picker api is absent', () => {
    const onError = vi.fn()

    openPicker({ onError })

    expect(onError).toHaveBeenCalledWith(expect.stringMatching(/has not loaded yet/i))
  })
})

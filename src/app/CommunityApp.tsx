import { useMemo } from 'react'
import { CommunityWorkspace } from './CommunityWorkspace'
import { resolveConnectionState } from './connectionState'
import type { CreateAccessTokenRequester } from '../auth/accessTokenRequester'
import { SignInScreen } from '../auth/SignInScreen'
import { useGoogleAuth } from '../auth/useGoogleAuth'
import { useStoredSpreadsheetId } from '../config/useStoredSpreadsheetId'
import type { PickSpreadsheet } from '../picker/spreadsheetPicker'
import { SpreadsheetPickerScreen } from '../picker/SpreadsheetPickerScreen'
import { useSpreadsheetPicker } from '../picker/useSpreadsheetPicker'
import type { CreateSheetsClient } from '../sheets/sheetsClient'

type CommunityAppProps = {
  createAccessTokenRequester: CreateAccessTokenRequester
  pickSpreadsheet: PickSpreadsheet
  createClient: CreateSheetsClient
}

export const CommunityApp = ({
  createAccessTokenRequester,
  pickSpreadsheet,
  createClient,
}: CommunityAppProps) => {
  const { accessToken, errorMessage, signIn, signOut, reportExpiredSession } = useGoogleAuth({
    createAccessTokenRequester,
  })
  const { spreadsheetId, spreadsheetName, selectSpreadsheet } = useStoredSpreadsheetId()
  const picker = useSpreadsheetPicker({
    pickSpreadsheet,
    accessToken,
    onPicked: selectSpreadsheet,
  })

  const sheetsClient = useMemo(() => {
    if (accessToken === undefined || spreadsheetId === undefined) {
      return undefined
    }
    return createClient({ spreadsheetId, getAccessToken: () => accessToken })
  }, [accessToken, createClient, spreadsheetId])

  const connectionState = resolveConnectionState({ accessToken, spreadsheetId })

  if (connectionState === 'signed-out') {
    return <SignInScreen errorMessage={errorMessage} onSignIn={signIn} />
  }

  if (connectionState === 'needs-spreadsheet' || sheetsClient === undefined) {
    return <SpreadsheetPickerScreen message={picker.message} onChoose={picker.choose} />
  }

  return (
    <CommunityWorkspace
      sheetsClient={sheetsClient}
      spreadsheetName={spreadsheetName}
      onSessionExpired={reportExpiredSession}
      onChangeSpreadsheet={picker.choose}
      onSignOut={signOut}
    />
  )
}

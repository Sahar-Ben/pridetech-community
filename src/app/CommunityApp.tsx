import { useMemo } from 'react'
import { CommunityWorkspace } from './CommunityWorkspace'
import { createResponseSheetAccess } from './createResponseSheetAccess'
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

  /* Built from the same grant and the same picker as the Dashboard
     spreadsheet: attaching a response sheet is the one thing here that reaches
     another Drive file, and it can only ever reach one the organiser has just
     picked. */
  const responseSheetAccess = useMemo(() => {
    if (accessToken === undefined) {
      return undefined
    }
    return createResponseSheetAccess({ pickSpreadsheet, accessToken, createClient })
  }, [accessToken, createClient, pickSpreadsheet])

  const connectionState = resolveConnectionState({ accessToken, spreadsheetId })

  if (connectionState === 'signed-out') {
    return <SignInScreen errorMessage={errorMessage} onSignIn={signIn} />
  }

  if (
    connectionState === 'needs-spreadsheet' ||
    sheetsClient === undefined ||
    responseSheetAccess === undefined
  ) {
    return <SpreadsheetPickerScreen message={picker.message} onChoose={picker.choose} />
  }

  return (
    <CommunityWorkspace
      sheetsClient={sheetsClient}
      responseSheetAccess={responseSheetAccess}
      spreadsheetName={spreadsheetName}
      onSessionExpired={reportExpiredSession}
      onChangeSpreadsheet={picker.choose}
      onSignOut={signOut}
    />
  )
}

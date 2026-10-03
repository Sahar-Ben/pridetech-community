import { useCallback, useEffect, useRef, useState } from 'react'
import type { DeviceLock } from './deviceLock'
import {
  clearStoredLockCredential,
  readStoredLockCredential,
  writeStoredLockCredential,
} from './storedLockCredential'
import { describeError } from '../errors/describeError'

/* Long enough to answer a WhatsApp at the door and come back without Face ID;
   short enough that a phone left on a table locks before anyone wanders off
   with it. */
export const RELOCK_AFTER_MS = 5 * 60 * 1000

const LOCK_FAILED_MESSAGE = 'Face ID could not be started.'

const currentTime = () => Date.now()

export type ScreenLock = {
  /* False until the device has said it can do this at all. */
  isAvailable: boolean
  isOn: boolean
  isLocked: boolean
  isBusy: boolean
  message: string | undefined
  unlock: () => void
  turnOn: () => void
  turnOff: () => void
}

/* The lock sits in front of everything, Google sign-in included, and holds no
   data of its own: locking hides the app rather than unmounting it, so the
   Google session and whatever screen was open survive a Face ID round trip. */
export const useScreenLock = ({
  deviceLock,
  relockAfterMs = RELOCK_AFTER_MS,
  now = currentTime,
}: {
  deviceLock: DeviceLock
  relockAfterMs?: number
  now?: () => number
}): ScreenLock => {
  const [credentialId, setCredentialId] = useState(readStoredLockCredential)
  const [isLocked, setIsLocked] = useState(() => credentialId !== undefined)
  const [isAvailable, setIsAvailable] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const [message, setMessage] = useState<string | undefined>(undefined)
  const hiddenAtRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    let isCurrent = true
    void deviceLock.isAvailable().then((available) => {
      if (isCurrent) {
        setIsAvailable(available)
      }
    })
    return () => {
      isCurrent = false
    }
  }, [deviceLock])

  useEffect(() => {
    if (credentialId === undefined) {
      return
    }
    const relockAfterAbsence = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = now()
        return
      }
      const hiddenAt = hiddenAtRef.current
      hiddenAtRef.current = undefined
      if (hiddenAt !== undefined && now() - hiddenAt >= relockAfterMs) {
        setIsLocked(true)
        setMessage(undefined)
      }
    }
    document.addEventListener('visibilitychange', relockAfterAbsence)
    return () => {
      document.removeEventListener('visibilitychange', relockAfterAbsence)
    }
  }, [credentialId, now, relockAfterMs])

  const run = useCallback((action: () => Promise<void>) => {
    setIsBusy(true)
    setMessage(undefined)
    action()
      .catch((error: unknown) => {
        setMessage(describeError({ error, fallback: LOCK_FAILED_MESSAGE }))
      })
      .finally(() => {
        setIsBusy(false)
      })
  }, [])

  const unlock = useCallback(() => {
    if (credentialId === undefined) {
      setIsLocked(false)
      return
    }
    run(async () => {
      await deviceLock.verify(credentialId)
      setIsLocked(false)
    })
  }, [credentialId, deviceLock, run])

  const turnOn = useCallback(() => {
    run(async () => {
      const enrolledId = await deviceLock.enrol()
      writeStoredLockCredential(enrolledId)
      setCredentialId(enrolledId)
    })
  }, [deviceLock, run])

  /* Forgets the passkey here only. The passkey itself stays in the device's
     Passwords app, which is the one place a site cannot delete it from. */
  const turnOff = useCallback(() => {
    clearStoredLockCredential()
    setCredentialId(undefined)
    setIsLocked(false)
    setMessage(undefined)
  }, [])

  return {
    isAvailable,
    isOn: credentialId !== undefined,
    isLocked: isLocked && credentialId !== undefined,
    isBusy,
    message,
    unlock,
    turnOn,
    turnOff,
  }
}

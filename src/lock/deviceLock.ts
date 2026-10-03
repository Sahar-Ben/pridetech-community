/* The device's own unlock (Face ID, Touch ID, or the passcode they fall back
   to), reached through a passkey made for this site and nothing else. There is
   no server here to check a signature against, so this proves only that the
   person holding the device just unlocked it, which is all a lock in front of
   Google sign-in has to know. */
export type DeviceLock = {
  isAvailable: () => Promise<boolean>
  /* Resolves to the new passkey's id, kept so later unlocks ask for that one. */
  enrol: () => Promise<string>
  verify: (credentialId: string) => Promise<void>
}

const CANCELLED_MESSAGE = 'Face ID was cancelled or did not recognise you. Try again.'
const UNAVAILABLE_MESSAGE = 'This device cannot lock the app with Face ID.'
const NOT_VERIFIED_MESSAGE =
  'The device unlocked the passkey without checking who you are. Try again.'

/* Bit 2 of the flags byte in authenticator data: the device checked the
   person (biometric or passcode), not only that someone tapped. */
const USER_VERIFIED_FLAG = 0x04
const FLAGS_BYTE_INDEX = 32

const toBase64Url = (bytes: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

const fromBase64Url = (value: string): Uint8Array<ArrayBuffer> => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

const randomBytes = (length: number): Uint8Array<ArrayBuffer> =>
  crypto.getRandomValues(new Uint8Array(length))

/* NotAllowedError covers a cancelled sheet, a face not recognised and a
   timeout alike; the browser does not say which, on purpose. */
const describeWebAuthnError = (error: unknown): Error => {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    return new Error(CANCELLED_MESSAGE)
  }
  if (error instanceof Error && error.message.trim() !== '') {
    return error
  }
  return new Error(CANCELLED_MESSAGE)
}

export const createWebAuthnDeviceLock = (): DeviceLock => ({
  isAvailable: async () => {
    if (typeof window.PublicKeyCredential === 'undefined') {
      return false
    }
    try {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    } catch {
      return false
    }
  },

  enrol: async () => {
    if (typeof window.PublicKeyCredential === 'undefined') {
      throw new Error(UNAVAILABLE_MESSAGE)
    }
    try {
      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge: randomBytes(32),
          rp: { name: 'PrideTech Community' },
          user: {
            id: randomBytes(16),
            name: 'PrideTech Community lock',
            displayName: 'PrideTech Community lock',
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 },
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            residentKey: 'preferred',
            userVerification: 'required',
          },
          timeout: 60_000,
        },
      })) as PublicKeyCredential | null
      if (credential === null) {
        throw new Error(CANCELLED_MESSAGE)
      }
      return toBase64Url(credential.rawId)
    } catch (error) {
      throw describeWebAuthnError(error)
    }
  },

  verify: async (credentialId) => {
    let credential: PublicKeyCredential | null
    try {
      credential = (await navigator.credentials.get({
        publicKey: {
          challenge: randomBytes(32),
          allowCredentials: [{ type: 'public-key', id: fromBase64Url(credentialId) }],
          userVerification: 'required',
          timeout: 60_000,
        },
      })) as PublicKeyCredential | null
    } catch (error) {
      throw describeWebAuthnError(error)
    }
    if (credential === null) {
      throw new Error(CANCELLED_MESSAGE)
    }
    const response = credential.response as AuthenticatorAssertionResponse
    const flags = new Uint8Array(response.authenticatorData)[FLAGS_BYTE_INDEX] ?? 0
    if ((flags & USER_VERIFIED_FLAG) === 0) {
      throw new Error(NOT_VERIFIED_MESSAGE)
    }
  },
})

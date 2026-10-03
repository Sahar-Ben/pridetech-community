import { vi } from 'vitest'
import type { DeviceLock } from '../lock/deviceLock'

export type FakeDeviceLock = DeviceLock & {
  isAvailable: ReturnType<typeof vi.fn<DeviceLock['isAvailable']>>
  enrol: ReturnType<typeof vi.fn<DeviceLock['enrol']>>
  verify: ReturnType<typeof vi.fn<DeviceLock['verify']>>
}

/* Unavailable unless asked, so a test that is not about the lock never meets
   it. Enrolling hands back a fixed id and every unlock succeeds until a test
   says otherwise. */
export const createFakeDeviceLock = ({
  available = false,
}: { available?: boolean } = {}): FakeDeviceLock => ({
  isAvailable: vi.fn<DeviceLock['isAvailable']>(() => Promise.resolve(available)),
  enrol: vi.fn<DeviceLock['enrol']>(() => Promise.resolve('passkey-1')),
  verify: vi.fn<DeviceLock['verify']>(() => Promise.resolve()),
})

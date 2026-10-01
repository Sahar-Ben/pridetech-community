/* The fake sheet the harness runs on is the one the unit tests use, and it
   wraps its methods in `vi.fn`. In the browser there is no vitest, so `vi.fn`
   is the function it was given. */
export const vi = {
  fn: <T>(implementation?: T): T | (() => undefined) => implementation ?? (() => undefined),
}

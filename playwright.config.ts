import { defineConfig, devices } from '@playwright/test'

const PORT = 5199

/* The app on an in-memory sheet (`e2e/harness`), in a real browser, at the
   three widths it has to hold up at. Every check in `e2e/` runs at each width
   unless it says otherwise, so a layout that only breaks on a small phone
   still fails the build. */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'phone',
      use: {
        ...devices['Pixel 7'],
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'small-phone',
      use: {
        ...devices['Pixel 7'],
        browserName: 'chromium',
        viewport: { width: 320, height: 640 },
      },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command: `npx vite --config e2e/harness/vite.config.ts --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

/* The real workspace, on an in-memory sheet instead of Google: everything
   from the shell down is the production code, and nothing reaches Google. */
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { vitest: fileURLToPath(new URL('./vitest-shim.ts', import.meta.url)) },
  },
  server: { fs: { allow: ['../..'] } },
})

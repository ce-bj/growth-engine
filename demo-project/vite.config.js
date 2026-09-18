import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react({ fastRefresh: false })],
  base: process.env.VITE_BASE || '/',
  server: {
    host: true,
    port: 5174,
    open: false,
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        funnelReview: resolve(__dirname, 'funnel-review.html'),
      },
    },
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
  server: {
    host: '0.0.0.0',
    port: 5177,
    strictPort: true,
  },
  preview: {
    port: 4177,
    strictPort: true,
  },
})

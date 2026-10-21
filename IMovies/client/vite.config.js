import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The dev server forwards /api/* to the Express backend, so the browser sees ONE origin
// (http://localhost:5173) and the login cookie works without any CORS trouble.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
})

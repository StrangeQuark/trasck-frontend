import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  plugins: [
    react()
  ],
  server: {
    port: 8080
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    force: true
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setupTests.js',
    include: ['src/**/*.{test,spec}.{js,jsx}']
  },
})

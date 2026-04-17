import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  plugins: [
    react()
  ],
  server: {
    port: 6100
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    force: true
  },
//   test: {
//     globals: true,
//     environment: "jsdom",
//     setupFiles: "./src/test/setupTests.js",
//     include: ["src/test/**/*.{test,spec}.{js,jsx}"]
//   },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    // VitePWA({ // Uncomment to allow PWA
    //   registerType: 'autoUpdate',
    //   includeAssets: ['icons/*.png']
    // })
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
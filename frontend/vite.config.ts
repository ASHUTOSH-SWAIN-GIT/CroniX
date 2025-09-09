import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss()
  ],
  server: {
    proxy: {
      '/auth/google': {
        target: 'http://localhost:8080',
        changeOrigin: false,
      },
      '/auth/google/callback': {
        target: 'http://localhost:8080',
        changeOrigin: false,
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: false,
      },
    },
  },
})

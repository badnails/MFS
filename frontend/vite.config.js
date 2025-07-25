import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  server: {
    proxy: {
      '/user': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/admin': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/transaction': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/agent': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/merchant': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/biller': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})

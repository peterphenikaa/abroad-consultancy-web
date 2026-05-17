import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // AES worker (chạy local: uvicorn … --port 8088) — phải khai báo trước /api chung
      '/api/v1/aes': {
        target: 'http://127.0.0.1:8088',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://server:5000',
        changeOrigin: true,
      },
    },
  },
})

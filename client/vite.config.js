import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    host: '0.0.0.0',
    port: 80,
    watch: {
      usePolling: true,
    },
    hmr: {
      clientPort: 81,
    },
    proxy: {
      // AES worker (chạy local: uvicorn … --port 8088) — phải khai báo trước /api chung
      '/api/v1/aes': {
        target: 'http://127.0.0.1:8088',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://api-gateway:8080',
        changeOrigin: true,
      },
    },
  },
})

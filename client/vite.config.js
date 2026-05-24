import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /.*\.pdf$/,
            handler: "CacheFirst",
            options: {
              cacheName: "offline-media-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /.*\.(mp4|webm|audio|mp3|wav)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "offline-media-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
      },
      manifest: {
        name: "TuDien DuHoc PWA",
        short_name: "DuHocPWA",
        description: "Ứng dụng học tập",
        theme_color: "#ffffff",
      },
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: 80,
    watch: {
      usePolling: true,
    },
    hmr: {
      clientPort: 81,
    },
    proxy: {
      "/api": {
        target: "http://cambridge-kong:8000",
        changeOrigin: true,
      },
    },
  },
});

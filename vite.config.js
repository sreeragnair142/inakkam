import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.png',
        'favicon.png',
        'icons.svg',
        'offline.html',
        'icons/*.png',
      ],
      manifest: false, // We use our own public/manifest.json
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        // Precache all built assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}'],
        // Runtime caching strategies
        runtimeCaching: [
          {
            // Cache API calls with NetworkFirst
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'inakkam-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache images with CacheFirst
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'inakkam-image-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache Google Fonts
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        // Offline fallback
        navigateFallback: null,
        navigationPreload: false,
      },
      devOptions: {
        enabled: false, // Set to true for testing SW in dev
      },
    }),
  ],
  server: {
    port: 7002,
    proxy: {
      // '/api': {
      //   target: 'http://127.0.0.1:7000',
      //   changeOrigin: true,
      //   secure: false,
      // },
      // '/uploads': {
      //   target: 'http://127.0.0.1:7000',
      //   changeOrigin: true,
      //   secure: false,
      // },
      // '/socket.io': {
      //   target: 'http://127.0.0.1:7000',
      //   changeOrigin: true,
      //   ws: true,
      // },
      '/api': {
        target: 'http://82.29.165.57:7000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://82.29.165.57:7000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://82.29.165.57:7000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})

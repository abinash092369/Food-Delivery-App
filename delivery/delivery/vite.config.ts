import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  define: {
    global: 'window',
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'éets Driver',
        short_name: 'éets',
        description: 'éets Delivery Partner App',
        theme_color: '#FF4F18',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^http:\/\/localhost:8080\/api\/driver\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'driver-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 86400 // 1 day
              },
              networkTimeoutSeconds: 5
            }
          },
          {
            urlPattern: /\.(?:js|css|html|png|jpg|jpeg|svg|gif|woff2?)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets-cache',
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 30 * 86400 // 30 days
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5176,
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
  },
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('leaflet')) {
              return 'vendor-maps';
            }
            return 'vendor';
          }
          if (id.includes('pages/auth/')) {
            return 'chunk-auth';
          }
          if (id.includes('pages/home/')) {
            return 'chunk-home';
          }
          if (id.includes('pages/restaurant/')) {
            return 'chunk-restaurant';
          }
          if (id.includes('pages/cart/')) {
            return 'chunk-cart';
          }
          if (id.includes('pages/checkout/')) {
            return 'chunk-checkout';
          }
          if (id.includes('pages/orders/OrderTrackingPage') || id.includes('components/order/DriverMap') || id.includes('components/order/OrderTracker')) {
            return 'chunk-tracking';
          }
          if (id.includes('pages/orders/')) {
            return 'chunk-orders';
          }
          if (id.includes('pages/profile/')) {
            return 'chunk-profile';
          }
          if (id.includes('pages/notifications/')) {
            return 'chunk-notifications';
          }
        }
      }
    }
  }
})


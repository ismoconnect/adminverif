import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    open: true
  },
  optimizeDeps: {
    include: ['firebase/app', 'firebase/firestore', 'firebase/auth']
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    rollupOptions: {
      external: (id) => {
        // Ne pas externaliser les modules Firebase, mais gérer les imports dynamiques
        return false
      },
      output: {
        globals: {
          'firebase/app': 'firebase',
          'firebase/firestore': 'firebase',
          'firebase/auth': 'firebase'
        }
      }
    }
  }
})

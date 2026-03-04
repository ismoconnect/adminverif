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
    include: ['firebase/app', 'firebase/firestore', '@firebase/webchannel-wrapper']
  },
  build: {
    rollupOptions: {
      external: [
        // certain versions of firebase have issues with this internal import in vite
        // "@firebase/webchannel-wrapper/bloom-blob" 
      ]
    }
  }
})

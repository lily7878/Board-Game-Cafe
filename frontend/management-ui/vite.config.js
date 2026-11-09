
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      // STOMP over WebSocket for live updates (signals only; data is refetched through REST)
      '/ws': {
        target: 'ws://localhost:8082',
        ws: true,
      },
      '/actuator': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
    },
  },
})

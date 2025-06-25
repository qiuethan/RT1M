// client/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: 'client',           // only needed if you run vite from RT1M/
  optimizeDeps: {
    entries: ['client/index.html', 'client/src/main.tsx']
    // or include: ['react', 'react-dom', 'react-router-dom']
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
})
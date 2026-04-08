import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Permite acceso externo
    port: 3000,
    strictPort: false, // Si el puerto está ocupado, busca otro
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Backend corre en puerto 3001
        changeOrigin: true,
        secure: false, // No verificar certificado del backend (desarrollo)
      },
    },
  },
})

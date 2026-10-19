import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'https://ardoise.art-crea.fr',
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: true,
  },
})

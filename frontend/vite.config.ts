import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/supabase-api': {
        target: 'https://fmbzsljswafgvpfwiwyl.supabase.co',
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/supabase-api/, ''),
      },
    },
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/snap': {
        target: 'https://www.snapchat.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/snap/, ''),
      },
    },
  },
  build: {
    target: 'es2015',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  }
})

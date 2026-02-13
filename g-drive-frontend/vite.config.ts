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

  optimizeDeps: {
    include: ['lucide-react'],
  },

  build: {

    rollupOptions: {
      output: {
        manualChunks: {

          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'appwrite-vendor': ['appwrite'],
        },
      },
    },

    minify: 'esbuild',

    sourcemap: false,
  },

  server: {
    port: 3000,
    strictPort: true,
    host: true,
  },
})

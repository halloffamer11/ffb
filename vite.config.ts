import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          charts: ['recharts'],
          state: ['zustand', '@tanstack/react-query'],
          ui: ['styled-components', 'react-grid-layout']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
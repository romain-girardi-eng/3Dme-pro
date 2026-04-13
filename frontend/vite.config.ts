import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Enable Buffer polyfill for @gradio/client
      include: ['buffer'],
      globals: {
        Buffer: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          'react-three': ['@react-three/fiber', '@react-three/drei'],
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei'],
  },
});

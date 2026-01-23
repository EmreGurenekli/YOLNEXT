import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    open: false,
    hmr: { 
      overlay: true,
      protocol: 'ws',
    },
    cors: true,
    watch: {
      usePolling: false,
      interval: 1000,
      ignored: [
        '**/node_modules/**', 
        '**/.git/**',
        '**/backend/server-modular.js', // Large file - don't watch
        '**/dist/**',
        '**/coverage/**',
        '**/test-results/**',
        '**/logs/**',
      ],
    },
    fs: {
      strict: false,
      allow: ['..'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        timeout: 10000,
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1500, // Modern React uygulamaları için makul limit
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
    // Backend files are automatically excluded via watch.ignored
  },
  logLevel: 'warn',
  clearScreen: false,
  // Performance optimizations
  esbuild: {
    target: 'es2020',
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
});

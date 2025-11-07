// vite.config.js or vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? './' : '/',
  css: {
    postcss: './postcss.config.js'
  },
  build: {
    // Enable minification in production
    minify: 'terser', // Use terser for more aggressive minification
    // Configure terser options
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ['console.log'], // Remove specific function calls
      },
      mangle: true, // Mangle variable names
    },
    // Optimize CSS
    cssMinify: true,
    // Enable source maps for debugging (optional, can be false to reduce size)
    sourcemap: false,
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries into separate chunks for better caching
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        },
        // Minimize chunk names
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: ({ name }) => {
          if (/\.(gif|jpe?g|png|svg)$/.test(name ?? '')) {
            return 'images/[name]-[hash][extname]';
          }
          if (/\.css$/.test(name ?? '')) {
            return 'css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    // Compress assets
    reportCompressedSize: true
  }
});

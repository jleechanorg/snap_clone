import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Ensure JSX files are properly handled
      include: ['**/*.jsx', '**/*.tsx', '**/*.js', '**/*.ts'],
      // Fast refresh configuration
      fastRefresh: true,
      // Babel configuration for JSX
      babel: {
        babelrc: false,
        configFile: false,
        plugins: []
      }
    })
  ],
  server: {
    // Configure MIME types for proper JSX handling
    middlewareMode: false,
    configure: (server) => {
      server.middlewares.use('/src', (req, res, next) => {
        if (req.url?.endsWith('.jsx')) {
          res.setHeader('Content-Type', 'application/javascript')
        }
        next()
      })
    },
    proxy: {
      '/snap': {
        target: 'https://www.snapchat.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/snap/, ''),
      },
    },
  },
  // Explicit MIME type handling
  optimizeDeps: {
    include: ['react', 'react-dom'],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
        '.jsx': 'jsx',
        '.ts': 'tsx',
        '.tsx': 'tsx'
      }
    }
  },
  // Ensure proper file resolution and MIME types
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']
  },
  // Configure asset handling
  assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif'],
  build: {
    // Ensure JSX files are transpiled before bundling
    target: 'es2015',
    rollupOptions: {
      external: [],
      output: {
        // Proper MIME type handling for chunks
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor'
            }
            return 'vendor'
          }
          if (id.includes('Tabs.jsx')) {
            return 'tabs'
          }
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    // Ensure proper transpilation
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  },
  // Define environment for proper JSX handling
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  }
})

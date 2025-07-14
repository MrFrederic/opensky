import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'configure-response-headers',
        configureServer: (server) => {
          server.middlewares.use((_req, res, next) => {
            // Add permissive CSP headers for development including frame-ancestors for Telegram
            res.setHeader(
              'Content-Security-Policy',
              "default-src * 'self' data: blob: 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'self' https://telegram.org https://*.telegram.org;"
            );
            
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    server: {
      port: 80,
      proxy: {
        '/api': {
          target: env.API_HOST || 'http://backend:8000',
          changeOrigin: true,
        },
      },
    },
  }
})

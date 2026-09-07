import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import cardImageHandler from './api/card-image.js';
import cardPreviewHandler from './api/card-preview.js';

// Vite Plugin to mount server endpoints in local development
function apiDevPlugin() {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (url.startsWith('/api/card-image')) {
          return cardImageHandler(req, res);
        }
        if (url.startsWith('/api/card-preview') || (url.startsWith('/card-preview') && req.url.includes('bot=1'))) {
          return cardPreviewHandler(req, res);
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), apiDevPlugin()],
  resolve: {
    alias: {
      '@/asset': path.resolve(__dirname, './public/asset'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'firstpassapp.co',
      'www.firstpassapp.co'
    ]
  }
});
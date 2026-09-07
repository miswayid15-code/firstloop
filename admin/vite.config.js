import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Vite plugin for local /api/card-image and /card-preview SSR meta tags
function cardApiDevPlugin() {
  return {
    name: 'card-api-dev-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const url = req.url || '';
          if (url.startsWith('/api/card-image')) {
            const { default: cardImageHandler } = await import('./api/card-image.js');
            return await cardImageHandler(req, res);
          }
          if (url.startsWith('/card-preview') && (req.headers.accept?.includes('text/html') || req.headers['user-agent']?.includes('WhatsApp') || req.headers['user-agent']?.includes('facebook'))) {
            // Check if crawler or direct page load
            const { default: cardPreviewHandler } = await import('./api/card-preview.js');
            return await cardPreviewHandler(req, res);
          }
        } catch (e) {
          console.error('Error in cardApiDevPlugin middleware:', e);
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), cardApiDevPlugin()],
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
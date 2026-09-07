import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

function cardImageDevPlugin() {
  return {
    name: 'card-image-dev-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && (req.url.startsWith('/api/card-image/') || req.url.startsWith('/api/card-image?') || req.url === '/api/card-image')) {
          try {
            const { generateCardImagePng } = await import('./api/generateCardImage.js');
            const url = new URL(req.url, `http://${req.headers.host || 'localhost:5173'}`);
            
            let cardId = 1;
            const matches = url.pathname.match(/\/api\/card-image\/([^/?]+)/);
            if (matches) {
              cardId = matches[1];
            } else {
              cardId = url.searchParams.get('cardId') || url.searchParams.get('id') || 1;
            }

            const type = url.searchParams.get('type') || 1;
            const cusId = url.searchParams.get('cus_id') || url.searchParams.get('customer_id') || 1;
            const queryParams = Object.fromEntries(url.searchParams.entries());

            const pngBuffer = await generateCardImagePng(cardId, type, cusId, queryParams);

            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'no-cache');
            res.statusCode = 200;
            res.end(pngBuffer);
            return;
          } catch (err) {
            console.error('Error generating card image in Vite dev server:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Failed to generate card image', details: err.message }));
            return;
          }
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), cardImageDevPlugin()],
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
})
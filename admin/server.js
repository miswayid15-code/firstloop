import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cardImageHandler from './api/card-image.js';
import cardPreviewHandler from './api/card-preview.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

const BOT_USER_AGENTS = /bot|crawler|spider|whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|linkedinbot|slackbot|discordbot/i;

const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // 1. Route: /api/card-image and /card-image
    if (pathname.startsWith('/api/card-image') || pathname.startsWith('/card-image')) {
        return cardImageHandler(req, res);
    }

    // 2. Route: /card-preview/:id (intercept for WhatsApp / crawlers)
    if (pathname.startsWith('/card-preview')) {
        const userAgent = req.headers['user-agent'] || '';
        const isBot = BOT_USER_AGENTS.test(userAgent) || parsedUrl.searchParams.get('bot') === '1';

        if (isBot) {
            return cardPreviewHandler(req, res);
        }
    }

    // 3. Static Files from dist/
    let filePath = path.join(DIST_DIR, pathname);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        return fs.createReadStream(filePath).pipe(res);
    }

    // 4. SPA Fallback: Serve dist/index.html
    const indexPath = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return fs.createReadStream(indexPath).pipe(res);
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

server.listen(PORT, () => {
    console.log(`Dealora Production Server listening on http://localhost:${PORT}`);
});

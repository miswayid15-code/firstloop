import fs from 'fs';
import path from 'path';
import { fetchCardData } from './utils/fetchCardData.js';

// Crawler User-Agent regex pattern
const BOT_USER_AGENTS = /bot|crawler|spider|crawling|whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|linkedinbot|slackbot|discordbot|applebot|bingbot|googlebot|yandex/i;

/**
 * Serverless / Node.js handler for GET /card-preview/:id
 * Injects dynamic Open Graph & Twitter meta tags for WhatsApp and other crawlers.
 * Delivers full React application to human users.
 */
export default async function handler(req, res) {
    try {
        const urlObj = new URL(req.url, `http://${req.headers?.host || 'localhost'}`);
        const pathSegments = urlObj.pathname.split('/').filter(Boolean);

        // Match /card-preview/:id
        let pathId = null;
        const cardPreviewIdx = pathSegments.findIndex(s => s === 'card-preview');
        if (cardPreviewIdx !== -1 && pathSegments[cardPreviewIdx + 1]) {
            pathId = pathSegments[cardPreviewIdx + 1];
        }

        const id = req.query?.id || pathId || urlObj.searchParams.get('id') || '35';
        const type = req.query?.type || urlObj.searchParams.get('type') || '1';
        const cus_id = req.query?.cus_id || req.query?.customer_id || urlObj.searchParams.get('cus_id') || '1';

        const userAgent = req.headers?.['user-agent'] || '';
        const isBot = BOT_USER_AGENTS.test(userAgent) || urlObj.searchParams.get('bot') === '1';

        // Resolve current host & protocol dynamically (zero hardcoding)
        const forwardedProto = req.headers?.['x-forwarded-proto'] || 'https';
        const host = req.headers?.['x-forwarded-host'] || req.headers?.host || 'localhost:5173';
        const proto = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : forwardedProto;
        const baseUrl = `${proto}://${host}`;

        // Extract query parameters for dynamic fallback
        const query = Object.fromEntries(urlObj.searchParams.entries());

        // 1. Fetch card details
        const card = await fetchCardData({ id, type, cus_id, query });

        const brandName = card.brandName || 'FirstPass';
        const cardTitle = card.title || (Number(type) === 2 ? 'Membership Pass' : 'Stamp Card');
        const ogTitle = `${brandName} - ${cardTitle}`;
        const totalStamps = Number(card.total_stamps || 8);
        const ogDescription = Number(type) === 2
            ? (card.description || `View your exclusive ${brandName} Membership Pass.`)
            : `Collect ${totalStamps} stamps to earn exclusive rewards at ${brandName}!`;

        const ogImageUrl = `${baseUrl}/api/card-image/${id}?type=${type}&cus_id=${cus_id}`;
        const ogPageUrl = `${baseUrl}/card-preview/${id}?type=${type}&cus_id=${cus_id}`;

        // 2. If requested by a CRAWLER (WhatsApp, Facebook, etc.): Return SSR HTML with Image-Only OG tags
        if (isBot) {
            const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="index, follow">

    <!-- Open Graph: Image Only -->
    <meta property="og:type" content="website">
    <meta property="og:image" content="${ogImageUrl}">
    <meta property="og:image:secure_url" content="${ogImageUrl}">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="840">
    <meta property="og:image:height" content="480">
    <meta property="og:image:alt" content="Card Preview">
    <meta property="og:url" content="${ogPageUrl}">

    <!-- Twitter: Large Image Only -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="${ogImageUrl}">
</head>
<body>
</body>
</html>`;

            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
            if (typeof res.status === 'function') {
                return res.status(200).send(html);
            } else {
                res.statusCode = 200;
                return res.end(html);
            }
        }

        // 3. For HUMAN USERS: Serve index.html (or built dist/index.html)
        let indexPath = path.resolve(process.cwd(), 'dist', 'index.html');
        if (!fs.existsSync(indexPath)) {
            indexPath = path.resolve(process.cwd(), 'index.html');
        }

        if (fs.existsSync(indexPath)) {
            let html = fs.readFileSync(indexPath, 'utf-8');

            // Inject dynamic Open Graph tags into the static index.html head for initial page load
            const injectedMeta = `
    <!-- Dynamic Server-Injected Open Graph Meta -->
    <title>${escapeHtml(ogTitle)}</title>
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeHtml(ogTitle)}">
    <meta property="og:description" content="${escapeHtml(ogDescription)}">
    <meta property="og:image" content="${ogImageUrl}">
    <meta property="og:url" content="${ogPageUrl}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(ogTitle)}">
    <meta name="twitter:description" content="${escapeHtml(ogDescription)}">
    <meta name="twitter:image" content="${ogImageUrl}">
`;
            html = html.replace('</head>', `${injectedMeta}\n</head>`);

            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            if (typeof res.status === 'function') {
                return res.status(200).send(html);
            } else {
                res.statusCode = 200;
                return res.end(html);
            }
        }

        // Fallback redirect if index.html is not directly accessible
        res.setHeader('Location', `/card-preview/${id}?type=${type}&cus_id=${cus_id}`);
        res.statusCode = 302;
        return res.end();
    } catch (err) {
        console.error('Error handling card-preview request:', err);
        if (typeof res.status === 'function') {
            return res.status(500).send('Internal Server Error');
        } else {
            res.statusCode = 500;
            return res.end('Internal Server Error');
        }
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

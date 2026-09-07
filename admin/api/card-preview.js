import fs from 'fs';
import path from 'path';

/**
 * Fetch Card Data for Meta Tags
 */
async function fetchCardMeta(cardId, type = 1, cusId = null) {
    const baseUrl = process.env.VITE_API_URL || process.env.API_URL || 'https://dealora-7st9.onrender.com';
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const url = `${cleanBase}/firstloop/customer/fetch-card`;

    const payload = {
        id: Number(cardId),
        type: Number(type) === 2 ? 2 : 1
    };
    if (cusId) {
        payload.cus_id = Number(cusId);
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Skip-Auth-Redirect': 'true'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const data = await response.json();
            if (data && (data.status === 1 || data.status === '1' || data.success)) {
                const rawItem = data.data;
                const item = Array.isArray(rawItem) ? rawItem[0] : rawItem;
                if (item) {
                    const isType2 = Number(type) === 2;
                    const brand = item.brand_name || item.brandName || 'FirstLoop';
                    const title = item.title || item.name || (isType2 ? 'Membership Pass' : 'Digital Stamp Card');
                    const totalStamps = Number(item.number_of_stamps || item.total_stamps || 8);
                    const desc = isType2
                        ? `Exclusive ${title} by ${brand}. View your membership pass and benefits.`
                        : `Collect ${totalStamps} stamps to earn exclusive rewards with ${brand}!`;

                    return {
                        title: `${brand} - ${title}`,
                        description: desc
                    };
                }
            }
        }
    } catch (e) {
        console.warn('Error fetching card meta:', e.message);
    }

    return {
        title: Number(type) === 2 ? 'FirstLoop Merchant - Membership Pass' : 'FirstLoop Merchant - Digital Stamp Card',
        description: 'Collect stamps to earn exclusive rewards!'
    };
}

// Escape HTML characters
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Serverless Handler for /card-preview/:id
 */
export default async function handler(req, res) {
    try {
        const proto = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host || 'dealora-azure.vercel.app';
        const origin = `${proto}://${host}`;

        const urlObj = new URL(req.url, origin);
        const pathSegments = urlObj.pathname.split('/').filter(Boolean);

        // Match cardId from path /card-preview/:cardId
        let cardId = req.query?.cardId || req.query?.id;
        if (!cardId && pathSegments.length > 0) {
            const lastSegment = pathSegments[pathSegments.length - 1];
            if (lastSegment !== 'card-preview' && !isNaN(Number(lastSegment))) {
                cardId = lastSegment;
            }
        }
        cardId = cardId || urlObj.searchParams.get('cardId') || urlObj.searchParams.get('id') || '35';

        const type = Number(req.query?.type || urlObj.searchParams.get('type') || 1);
        const cusId = req.query?.cus_id || urlObj.searchParams.get('cus_id') || null;

        const cardMeta = await fetchCardMeta(cardId, type, cusId);

        const cardImageUrl = `${origin}/api/card-image/${cardId}?type=${type}${cusId ? `&cus_id=${cusId}` : ''}`;
        const pageUrl = `${origin}/card-preview/${cardId}?type=${type}${cusId ? `&cus_id=${cusId}` : ''}`;

        // Try reading built index.html or local index.html
        let htmlTemplate = '';
        const distIndexPath = path.resolve(process.cwd(), 'dist/index.html');
        const rootIndexPath = path.resolve(process.cwd(), 'index.html');

        if (fs.existsSync(distIndexPath)) {
            htmlTemplate = fs.readFileSync(distIndexPath, 'utf8');
        } else if (fs.existsSync(rootIndexPath)) {
            htmlTemplate = fs.readFileSync(rootIndexPath, 'utf8');
        }

        // Construct dynamic Open Graph Meta Tags
        const metaTags = `
    <!-- Dynamic WhatsApp / Social Open Graph Tags -->
    <title>${escapeHtml(cardMeta.title)}</title>
    <meta name="description" content="${escapeHtml(cardMeta.description)}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeHtml(cardMeta.title)}">
    <meta property="og:description" content="${escapeHtml(cardMeta.description)}">
    <meta property="og:image" content="${cardImageUrl}">
    <meta property="og:image:secure_url" content="${cardImageUrl}">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="840">
    <meta property="og:image:height" content="480">
    <meta property="og:url" content="${pageUrl}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(cardMeta.title)}">
    <meta name="twitter:description" content="${escapeHtml(cardMeta.description)}">
    <meta name="twitter:image" content="${cardImageUrl}">
        `.trim();

        let finalHtml = '';
        if (htmlTemplate) {
            // Remove existing static meta/title if present and insert dynamic tags
            finalHtml = htmlTemplate
                .replace(/<title>.*?<\/title>/gi, '')
                .replace(/<meta property="og:.*?".*?>/gi, '')
                .replace(/<meta name="twitter:.*?".*?>/gi, '')
                .replace('</head>', `${metaTags}\n</head>`);
        } else {
            // Fallback complete HTML document
            finalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${metaTags}
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
</body>
</html>`;
        }

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
        res.statusCode = 200;
        
        if (typeof res.send === 'function') {
            res.send(finalHtml);
        } else {
            res.end(finalHtml);
        }
    } catch (err) {
        console.error('Error rendering card preview meta:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Error: ' + err.message);
    }
}

import { fetchCardData } from './utils/fetchCardData.js';
import { generateCardPngBuffer } from './utils/cardSvgGenerator.js';

/**
 * Serverless / Node.js handler for GET /api/card-image/:id
 * Generates and returns binary PNG image for WhatsApp og:image
 */
export default async function handler(req, res) {
    try {
        // Extract parameters from query or URL path
        const urlObj = new URL(req.url, `http://${req.headers?.host || 'localhost'}`);
        const pathSegments = urlObj.pathname.split('/').filter(Boolean);
        
        // Match /api/card-image/:id or /card-image/:id
        let pathId = null;
        const cardImgIdx = pathSegments.findIndex(s => s === 'card-image');
        if (cardImgIdx !== -1 && pathSegments[cardImgIdx + 1]) {
            pathId = pathSegments[cardImgIdx + 1];
        }

        const id = req.query?.id || pathId || urlObj.searchParams.get('id') || '35';
        const type = req.query?.type || urlObj.searchParams.get('type') || '1';
        const cus_id = req.query?.cus_id || req.query?.customer_id || urlObj.searchParams.get('cus_id') || '1';

        // Extract query params for fallback/custom dynamic preview
        const query = Object.fromEntries(urlObj.searchParams.entries());

        // 1. Fetch card details
        const card = await fetchCardData({ id, type, cus_id, query });

        // 2. Render card to high-res PNG binary buffer
        const pngBuffer = await generateCardPngBuffer(card);

        // 3. Respond with Content-Type: image/png
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', pngBuffer.length);
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (typeof res.status === 'function') {
            return res.status(200).send(pngBuffer);
        } else {
            res.statusCode = 200;
            return res.end(pngBuffer);
        }
    } catch (err) {
        console.error('Error generating card image:', err);
        if (typeof res.status === 'function') {
            return res.status(500).json({ error: 'Failed to generate card image', details: err.message });
        } else {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Failed to generate card image', details: err.message }));
        }
    }
}

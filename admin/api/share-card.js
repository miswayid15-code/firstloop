export default async function handler(req, res) {
    const { id, title: qTitle, brand: qBrand, img: qImg } = req.query;

    const host = req.headers['x-forwarded-host'] || req.headers.host || 'dealora-azure.vercel.app';
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const frontendBase = `${proto}://${host}`;
    const targetPreviewUrl = `${frontendBase}/card-preview/${id || ''}`;

    if (!id) {
        return res.redirect(302, frontendBase);
    }

    let brandName = qBrand || '';
    let title = qTitle || '';
    let imageUrl = qImg || '';
    const description = `Collect stamps to earn exclusive rewards!`;

    const apiBaseUrl = process.env.VITE_API_URL || process.env.BACKEND_URL || 'https://dealora-7st9.onrender.com';
    const cleanApiUrl = apiBaseUrl.replace(/\/+$/, '');

    // If query params are missing, fetch from API as fallback
    if (!brandName || !title || !imageUrl) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);

            const response = await fetch(`${cleanApiUrl}/firstloop/merchant/fetch-stamp-card-details`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: Number(id) }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const data = await response.json();
            const item = data?.data?.[0];
            if (item) {
                brandName = brandName || item.brand_name || 'Merchant';
                title = title || item.title || 'Stamp Pass';
                imageUrl = imageUrl || item.background_image || item.brand_image || '';
            }
        } catch (e) {
            console.error('API Fetch Fallback error:', e?.message || e);
        }
    }

    brandName = brandName || 'FirstLoop Merchant';
    title = title || 'Digital Stamp Card';

    // Format absolute image URL
    if (imageUrl) {
        // Strip duplicate http if present
        const uploadsMatch = imageUrl.match(/(uploads\/.*)/i);
        if (uploadsMatch && uploadsMatch[1]) {
            imageUrl = `${cleanApiUrl}/${uploadsMatch[1].replace(/^\/+/, '')}`;
        } else if (!imageUrl.startsWith('http') && !imageUrl.startsWith('//')) {
            imageUrl = `${cleanApiUrl}/${imageUrl.replace(/^\/+/, '')}`;
        }
    } else {
        imageUrl = `${frontendBase}/asset/images/img/new-logo.png`;
    }

    const fullTitle = `${brandName} - ${title}`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');

    return res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${fullTitle}</title>
    <meta name="description" content="${description}">

    <!-- Open Graph / WhatsApp Preview Meta Tags -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="FirstLoop">
    <meta property="og:title" content="${fullTitle}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:secure_url" content="${imageUrl}">
    <meta property="og:image:alt" content="${fullTitle}">
    <meta property="og:url" content="${targetPreviewUrl}">

    <!-- Twitter Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${fullTitle}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${imageUrl}">

    <!-- Browser redirect to the interactive card preview -->
    <meta http-equiv="refresh" content="0;url=${targetPreviewUrl}">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #F8FAFC;">
    <div style="text-align: center; padding: 20px;">
        <h2 style="color: #0E88B8; margin-bottom: 8px;">${fullTitle}</h2>
        <p style="color: #64748B; margin-bottom: 16px;">${description}</p>
        <p style="font-size: 0.9rem; color: #94A3B8;">Redirecting to your card...</p>
        <a href="${targetPreviewUrl}" style="display: inline-block; background: #0E88B8; color: #FFFFFF; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; margin-top: 10px;">
            Open Card
        </a>
    </div>
    <script>
        window.location.replace("${targetPreviewUrl}");
    </script>
</body>
</html>`);
}

export default async function handler(req, res) {
    const { 
        id, 
        title: qTitle, 
        brand: qBrand, 
        stamps: qStamps,
        bg: qBg, 
        logo: qLogo,
        bgcolor: qBgColor,
        textcolor: qTextColor,
        border: qBorder,
        radius: qRadius 
    } = req.query;

    const host = req.headers['x-forwarded-host'] || req.headers.host || 'dealora-azure.vercel.app';
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const frontendBase = `${proto}://${host}`;
    const targetPreviewUrl = `${frontendBase}/card-preview/${id || ''}`;

    if (!id) {
        return res.redirect(302, frontendBase);
    }

    let brandName = qBrand || '';
    let title = qTitle || '';
    let totalStamps = Number(qStamps) || 8;
    let bgImage = qBg || '';
    let brandLogo = qLogo || '';
    let bgColor = qBgColor || '#0E88B8';
    let textColor = qTextColor || '#FFFFFF';
    let borderColor = qBorder || '#00A6D6';
    let stampRadius = Number(qRadius ?? 50);

    const description = `Collect ${totalStamps} stamps to earn exclusive rewards!`;

    const apiBaseUrl = process.env.VITE_API_URL || process.env.BACKEND_URL || 'https://dealora-7st9.onrender.com';
    const cleanApiUrl = apiBaseUrl.replace(/\/+$/, '');

    // If query params are missing, fetch from API as fallback
    if (!brandName || !title) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

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
                totalStamps = Number(item.number_of_stamps) || totalStamps;
                bgImage = bgImage || item.background_image || '';
                brandLogo = brandLogo || item.brand_image || '';
                bgColor = bgColor || item.background_color || '#0E88B8';
                textColor = textColor || item.text_color || '#FFFFFF';
                borderColor = borderColor || item.border_color || '#00A6D6';
                stampRadius = Number(item.stamp_radius ?? stampRadius);
            }
        } catch (e) {
            console.error('API Fetch error in share-card:', e?.message || e);
        }
    }

    brandName = brandName || 'FirstLoop Merchant';
    title = title || 'Digital Stamp Card';

    // Construct dynamic complete card image PNG URL
    const cardParams = new URLSearchParams({
        id: String(id),
        brand: brandName,
        title: title,
        stamps: String(totalStamps),
        bg: bgImage,
        logo: brandLogo,
        bgcolor: bgColor,
        textcolor: textColor,
        border: borderColor,
        radius: String(stampRadius)
    }).toString();

    const cardImageUrl = `${frontendBase}/api/card-image?${cardParams}`;
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
    <meta property="og:image" content="${cardImageUrl}">
    <meta property="og:image:secure_url" content="${cardImageUrl}">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="800">
    <meta property="og:image:height" content="460">
    <meta property="og:image:alt" content="${fullTitle}">
    <meta property="og:url" content="${targetPreviewUrl}">

    <!-- Twitter Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${fullTitle}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${cardImageUrl}">

    <!-- Browser redirect to the interactive card preview -->
    <meta http-equiv="refresh" content="0;url=${targetPreviewUrl}">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0F172A;">
    <div style="text-align: center; padding: 20px; color: #FFFFFF;">
        <h2 style="color: #38BDF8; margin-bottom: 8px;">${fullTitle}</h2>
        <p style="color: #94A3B8; margin-bottom: 16px;">${description}</p>
        <p style="font-size: 0.9rem; color: #64748B;">Opening Digital Stamp Card...</p>
        <a href="${targetPreviewUrl}" style="display: inline-block; background: #0E88B8; color: #FFFFFF; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-weight: bold; margin-top: 10px;">
            Open Card
        </a>
    </div>
    <script>
        window.location.replace("${targetPreviewUrl}");
    </script>
</body>
</html>`);
}

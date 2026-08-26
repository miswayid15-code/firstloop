export default async function handler(req, res) {
    const { id } = req.query
    const cardId = Number(id)

    if (!cardId) {
        return res.status(400).send('Invalid Card ID')
    }

    const host = req.headers['x-forwarded-host'] || req.headers.host || 'dealora-azure.vercel.app'
    const proto = req.headers['x-forwarded-proto'] || 'https'
    const baseUrl = `${proto}://${host}`

    const backendUrl = process.env.VITE_API_URL || process.env.API_URL || 'http://localhost:5000/'
    const cleanApiBase = backendUrl.replace(/\/+$/, '')

    let card = null

    try {
        const apiResponse = await fetch(`${cleanApiBase}/firstloop/merchant/fetch-stamp-card-details`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: cardId })
        })

        const data = await apiResponse.json()
        if (data?.status === 1 && data?.data?.[0]) {
            card = data.data[0]
        }
    } catch (e) {
        console.error('Error fetching card details in card-preview serverless function:', e)
    }

    const brandName = card?.brand_name || 'Merchant'
    const cardTitle = card?.title || 'Digital Stamp Card'
    const totalStamps = Number(card?.number_of_stamps) || 8
    const description = `Collect ${totalStamps} stamps to earn exclusive rewards!`

    // Image URL for WhatsApp / Social Media Preview
    // Priority: Dynamic generated card image endpoint -> Brand image -> Background image -> Fallback
    const dynamicCardImageUrl = `${baseUrl}/card-preview-image/${cardId}`
    
    const formatImg = (path) => {
        if (!path) return null
        if (path.startsWith('http://') || path.startsWith('https://')) return path
        return `${cleanApiBase}/${path.replace(/^\/+/, '')}`
    }

    const fallbackImg = formatImg(card?.brand_image) || formatImg(card?.background_image) || `${baseUrl}/asset/images/img/fs.png`
    const ogImageUrl = dynamicCardImageUrl || fallbackImg

    const pageUrl = `${baseUrl}/card-preview/${cardId}`

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <title>${brandName} - ${cardTitle}</title>
    <meta name="description" content="${description}">

    <!-- Open Graph / WhatsApp / Facebook Meta Tags -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="FirstLoop">
    <meta property="og:title" content="${brandName} - ${cardTitle}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${ogImageUrl}">
    <meta property="og:image:secure_url" content="${ogImageUrl}">
    <meta property="og:image:type" content="image/svg+xml">
    <meta property="og:image:width" content="800">
    <meta property="og:image:height" content="480">
    <meta property="og:url" content="${pageUrl}">

    <!-- Twitter Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${brandName} - ${cardTitle}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${ogImageUrl}">

    <!-- Favicon -->
    <link rel="shortcut icon" href="/asset/images/img/fs.png">

    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        body { background: #F8FAFC; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px 16px; }
        .card-container { width: 100%; max-width: 440px; }
        .card-img { width: 100%; height: auto; border-radius: 22px; box-shadow: 0 20px 45px -10px rgba(0,0,0,0.3); display: block; }
    </style>
</head>
<body>
    <div class="card-container">
        <img src="${ogImageUrl}" alt="${brandName} - ${cardTitle}" class="card-img" />
    </div>
</body>
</html>`

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400')
    return res.send(html)
}

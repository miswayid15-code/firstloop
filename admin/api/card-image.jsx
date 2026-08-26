import { ImageResponse } from '@vercel/og';

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        let brandName = searchParams.get('brand') || '';
        let title = searchParams.get('title') || '';
        let totalStamps = Number(searchParams.get('stamps')) || 8;
        let bgColor = searchParams.get('bgcolor') || '#0E88B8';
        let textColor = searchParams.get('textcolor') || '#FFFFFF';
        let borderColor = searchParams.get('border') || '#00A6D6';
        let stampBgColor = searchParams.get('stampbg') || 'rgba(255, 255, 255, 0.35)';
        let stampBorderColor = searchParams.get('stampborder') || '#FFFFFF';
        let stampTextColor = searchParams.get('stampcolor') || '#FFFFFF';
        let stampRadius = Number(searchParams.get('radius') ?? 50);
        let bgImage = searchParams.get('bg') || '';
        let brandLogo = searchParams.get('logo') || '';

        const apiBaseUrl = process.env.VITE_API_URL || process.env.BACKEND_URL || 'https://dealora-7st9.onrender.com';
        const cleanApiUrl = apiBaseUrl.replace(/\/+$/, '');

        // If query parameters are not supplied, attempt fetch with quick timeout
        if (!brandName && id) {
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
                    brandName = item.brand_name || 'Merchant';
                    title = item.title || 'Stamp Pass';
                    totalStamps = Number(item.number_of_stamps) || 8;
                    bgColor = item.background_color || '#0E88B8';
                    textColor = item.text_color || '#FFFFFF';
                    borderColor = item.border_color || '#00A6D6';
                    stampBgColor = item.stamp_background || 'rgba(255, 255, 255, 0.35)';
                    stampBorderColor = item.stamp_border_color || '#FFFFFF';
                    stampTextColor = item.stamp_text_color || '#FFFFFF';
                    stampRadius = Number(item.stamp_radius ?? 50);
                    bgImage = item.background_image || '';
                    brandLogo = item.brand_image || '';
                }
            } catch (e) {
                console.error('Fetch card details error:', e?.message || e);
            }
        }

        brandName = brandName || 'FirstLoop Merchant';
        title = title || 'Digital Stamp Pass';

        if (bgImage && !bgImage.startsWith('http') && !bgImage.startsWith('//')) {
            const m = bgImage.match(/(uploads\/.*)/i);
            bgImage = m && m[1] ? `${cleanApiUrl}/${m[1].replace(/^\/+/, '')}` : `${cleanApiUrl}/${bgImage.replace(/^\/+/, '')}`;
        }

        if (brandLogo && !brandLogo.startsWith('http') && !brandLogo.startsWith('//')) {
            const m = brandLogo.match(/(uploads\/.*)/i);
            brandLogo = m && m[1] ? `${cleanApiUrl}/${m[1].replace(/^\/+/, '')}` : `${cleanApiUrl}/${brandLogo.replace(/^\/+/, '')}`;
        }

        const stampsArray = Array.from({ length: totalStamps });

        return new ImageResponse(
            (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#0F172A',
                        padding: 24,
                    }}
                >
                    <div
                        style={{
                            width: 752,
                            height: 412,
                            borderRadius: 28,
                            backgroundColor: bgColor,
                            border: `4px solid ${borderColor}`,
                            backgroundImage: bgImage ? `url(${bgImage})` : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            color: textColor,
                            padding: '28px 32px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            position: 'relative',
                            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                        }}
                    >
                        {/* Top: Brand Header & Stamps */}
                        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                            {/* Left Side: Brand Logo, Name, Title, and Stamps */}
                            <div style={{ display: 'flex', flexDirection: 'column', width: 490 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                    {brandLogo ? (
                                        <div
                                            style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 12,
                                                backgroundColor: '#FFFFFF',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: 4,
                                                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                                            }}
                                        >
                                            <img
                                                src={brandLogo}
                                                alt="Logo"
                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                            />
                                        </div>
                                    ) : null}
                                    <span style={{ fontSize: 26, fontWeight: 800, color: textColor }}>
                                        {brandName}
                                    </span>
                                </div>

                                <span style={{ fontSize: 20, fontWeight: 700, opacity: 0.95, marginBottom: 16, color: textColor }}>
                                    {title}
                                </span>

                                {/* Stamp Circles Grid */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, width: 490 }}>
                                    {stampsArray.map((_, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                width: 46,
                                                height: 46,
                                                borderRadius: `${stampRadius}%`,
                                                border: `2.5px solid ${stampBorderColor}`,
                                                backgroundColor: stampBgColor,
                                                color: stampTextColor,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 20,
                                                fontWeight: 800,
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                            }}
                                        >
                                            🎁
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Side: QR Code Area */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <div
                                    style={{
                                        width: 135,
                                        height: 135,
                                        borderRadius: 16,
                                        backgroundColor: '#FFFFFF',
                                        padding: 8,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                                    }}
                                >
                                    <img
                                        src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=FIRSTLOOP-CARD"
                                        alt="QR"
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    />
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 800, marginTop: 8, letterSpacing: 1, textTransform: 'uppercase', color: textColor }}>
                                    SCAN TO STAMP
                                </span>
                            </div>
                        </div>

                        {/* Bottom Right: Powered By */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, opacity: 0.95, fontSize: 15, fontWeight: 700, color: textColor }}>
                            <span>powered by</span>
                            <span style={{ fontWeight: 900 }}>firstloop.co.in</span>
                        </div>
                    </div>
                </div>
            ),
            {
                width: 800,
                height: 460,
                headers: {
                    'Content-Type': 'image/png',
                    'Cache-Control': 'public, max-age=86400, s-maxage=86400',
                },
            }
        );
    } catch (err) {
        console.error('Error in card-image API:', err);
        return new Response('Error generating image', { status: 500 });
    }
}

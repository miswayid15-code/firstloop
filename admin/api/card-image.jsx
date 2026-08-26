import { ImageResponse } from '@vercel/og';

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return new Response('Missing card ID', { status: 400 });
        }

        const apiBaseUrl = process.env.VITE_API_URL || process.env.BACKEND_URL || 'https://dealora-7st9.onrender.com';
        const cleanApiUrl = apiBaseUrl.replace(/\/+$/, '');

        const response = await fetch(`${cleanApiUrl}/firstloop/merchant/fetch-stamp-card-details`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: Number(id) })
        });

        const data = await response.json();
        const item = data?.data?.[0];

        if (!item) {
            return new Response('Card not found', { status: 404 });
        }

        const brandName = item.brand_name || 'Merchant';
        const title = item.title || 'Stamp Pass';
        const totalStamps = Number(item.number_of_stamps) || 8;
        const bgColor = item.background_color || '#0E88B8';
        const textColor = item.text_color || '#FFFFFF';
        const borderColor = item.border_color || '#00A6D6';
        const stampBgColor = item.stamp_background || 'rgba(255, 255, 255, 0.3)';
        const stampBorderColor = item.stamp_border_color || '#FFFFFF';
        const stampTextColor = item.stamp_text_color || '#FFFFFF';
        const stampRadius = Number(item.stamp_radius ?? 50);

        let bgImage = item.background_image || '';
        if (bgImage && !bgImage.startsWith('http')) {
            bgImage = `${cleanApiUrl}/${bgImage.replace(/^\/+/, '')}`;
        }

        let brandLogo = item.brand_image || '';
        if (brandLogo && !brandLogo.startsWith('http')) {
            brandLogo = `${cleanApiUrl}/${brandLogo.replace(/^\/+/, '')}`;
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
                        backgroundColor: '#F8FAFC',
                        padding: 20,
                    }}
                >
                    <div
                        style={{
                            width: 760,
                            height: 420,
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
                            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                        }}
                    >
                        {/* Top: Header & Main Row */}
                        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                            {/* Left Side: Brand Logo, Name, Title, and Stamps */}
                            <div style={{ display: 'flex', flexDirection: 'column', width: 480 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                    {brandLogo ? (
                                        <div
                                            style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 10,
                                                backgroundColor: '#FFFFFF',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: 4,
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
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, width: 480 }}>
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
                                        borderRadius: 14,
                                        backgroundColor: '#FFFFFF',
                                        padding: 8,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <img
                                        src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=FIRSTLOOP-PASS"
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
        console.error('Error generating card image:', err);
        return new Response('Error generating image', { status: 500 });
    }
}

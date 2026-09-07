import satori from 'satori';
import { Resvg, initWasm } from '@resvg/resvg-wasm';
import fs from 'fs';
import path from 'path';
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import ReactDOMServer from 'react-dom/server';

let wasmInitialized = false;
let fontCache = null;

// Initialize WASM once
async function ensureWasm() {
    if (!wasmInitialized) {
        try {
            const wasmPath = path.resolve('./node_modules/@resvg/resvg-wasm/index_bg.wasm');
            if (fs.existsSync(wasmPath)) {
                const wasmBuffer = fs.readFileSync(wasmPath);
                await initWasm(wasmBuffer);
                wasmInitialized = true;
            }
        } catch (e) {
            // Already initialized or in-memory
            wasmInitialized = true;
        }
    }
}

// Load Inter font buffer
async function getFontBuffer() {
    if (fontCache) return fontCache;
    try {
        const fontRes = await fetch('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf');
        fontCache = Buffer.from(await fontRes.arrayBuffer());
        return fontCache;
    } catch (e) {
        console.error('Error fetching font:', e);
        return null;
    }
}

// Format image URL
function formatImageUrl(img, baseUrl = 'https://dealora-7st9.onrender.com') {
    if (!img) return '';
    const str = String(img).trim();
    if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:')) {
        return str;
    }
    const cleanImg = str.replace(/^\/+/, '');
    const cleanBase = baseUrl.replace(/\/+$/, '');
    return `${cleanBase}/${cleanImg}`;
}

// Fetch card data from backend API
export async function fetchCardData(cardId, cardType = 1, cusId = 1, customParams = {}) {
    const id = Number(cardId) || 1;
    const type = Number(cardType) === 2 ? 2 : 1;
    const customerId = Number(cusId) || 1;

    const apiUrl = process.env.VITE_API_URL || 'https://dealora-7st9.onrender.com/';
    const endpoint = `${apiUrl.replace(/\/+$/, '')}/firstloop/customer/fetch-card`;

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id,
                type,
                cus_id: customerId
            })
        });

        const json = await res.json();
        if (json?.status === 1 && json?.data) {
            const rawItem = Array.isArray(json.data) ? json.data[0] : json.data;
            if (rawItem) {
                return parseCardItem(rawItem, type);
            }
        }
    } catch (e) {
        console.error('Error fetching card from API for image generation:', e);
    }

    // Fallback card structure based on params
    return {
        id,
        type,
        card_type: type,
        title: customParams.title || (type === 2 ? 'Membership Pass' : 'Stamp Pass'),
        brandName: customParams.brand || customParams.brandName || 'FirstLoop',
        brand_name: customParams.brand || customParams.brandName || 'FirstLoop',
        cardholderName: customParams.customer_name || customParams.name || 'Member',
        bgColor: customParams.bgColor || (type === 2 ? '#D97706' : '#0E88B8'),
        borderColor: customParams.borderColor || '#FFFFFF',
        totalStamps: Number(customParams.stamps) || 8,
        number_of_stamps: Number(customParams.stamps) || 8,
        discountVal: customParams.discount || '10',
        validity: customParams.validity || '12 Months',
        expiry: customParams.validity || '12 Months',
        qrImg: `card_${id}_cus_${customerId}`,
        stamp_levels: Array.from({ length: 8 }, (_, i) => ({
            stamp_number: i + 1,
            type: i + 1 === 8 ? 'Discount' : 'Free',
            discount: 10
        }))
    };
}

// Parse backend item into standard card structure
function parseCardItem(item, type) {
    const totalStamps = Number(item.number_of_stamps || item.total_stamps || 8);
    const levels = Array.isArray(item.CustomerStampLevels)
        ? item.CustomerStampLevels
        : Array.isArray(item.stamp_levels)
        ? item.stamp_levels
        : [];

    return {
        id: item.id,
        type,
        card_type: type,
        title: item.title || item.card_name || (type === 2 ? 'Membership Pass' : 'Stamp Pass'),
        brandName: item.brand_name || item.brandName || 'Merchant',
        brandLogo: item.brand_logo || item.logo || '',
        cardholderName: item.customer_name || item.cardholderName || 'Member',
        bgColor: item.background_color || item.bgColor || (type === 2 ? '#D97706' : '#0E88B8'),
        borderColor: item.border_color || item.borderColor || 'rgba(255,255,255,0.4)',
        bgImage: item.background_image || item.bgImage || '',
        totalStamps,
        number_of_stamps: totalStamps,
        discountVal: item.discount_value || item.discount || '10',
        validity: item.validity_months ? `${item.validity_months} Months` : item.expiry_date || '12 Months',
        expiry: item.expiry_date || (item.validity_months ? `${item.validity_months} Months` : '12 Months'),
        qrImg: item.qr_code || item.qr_token || item.card_number || `card_${item.id}`,
        stamp_levels: levels.map((lvl, idx) => ({
            stamp_number: Number(lvl.stamp_number || lvl.stamp) || idx + 1,
            type: String(lvl.reward_type) === '2' ? 'Discount' : 'Free',
            discount: Number(lvl.discount || 10)
        }))
    };
}

// Convert QR SVG into data URI
function getQrCodeDataUri(value, size = 92) {
    try {
        const qrElement = React.createElement(QRCodeSVG, {
            value: String(value || 'firstloop'),
            size
        });
        const svgString = ReactDOMServer.renderToStaticMarkup(qrElement);
        return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
    } catch (e) {
        return '';
    }
}

// Generate the complete Card PNG buffer
export async function generateCardImagePng(cardId, cardType = 1, cusId = 1, customParams = {}) {
    await ensureWasm();
    const fontBuffer = await getFontBuffer();
    const card = await fetchCardData(cardId, cardType, cusId, customParams);

    const type = Number(cardType) === 2 ? 2 : 1;
    const defaultBg = type === 2 ? '#D97706' : '#0E88B8';
    const bgColor = card.bgColor || defaultBg;
    const scanText = type === 2 ? 'SCAN PASS' : 'SCAN TO STAMP';
    const totalStamps = Number(card.totalStamps || 8);
    const qrDataUri = getQrCodeDataUri(card.qrImg, 92);

    // Build Stamp circles
    const stampItems = type === 1 ? Array.from({ length: totalStamps }).map((_, i) => {
        const stampNum = i + 1;
        const reward = card.stamp_levels?.find(l => l.stamp_number === stampNum);
        const isDiscount = reward?.type === 'Discount';
        const label = isDiscount ? `${reward?.discount || 10}%` : `${stampNum}`;

        return {
            type: 'div',
            props: {
                key: i,
                style: {
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: '2px solid rgba(255, 255, 255, 0.9)',
                    background: 'rgba(255, 255, 255, 0.3)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isDiscount ? '10px' : '13px',
                    fontWeight: 800,
                    marginRight: '6px',
                    marginBottom: '6px'
                },
                children: label
            }
        };
    }) : null;

    // Build Satori Element Tree matching CustomerCard.jsx exactly
    const element = {
        type: 'div',
        props: {
            style: {
                width: '420px',
                height: '260px',
                borderRadius: '22px',
                backgroundColor: bgColor,
                color: '#FFFFFF',
                padding: '22px 22px 16px 22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxSizing: 'border-box',
                border: `2px solid ${card.borderColor || 'rgba(255,255,255,0.4)'}`,
                fontFamily: 'Inter'
            },
            children: [
                {
                    type: 'div',
                    props: {
                        style: {
                            display: 'flex',
                            width: '100%',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start'
                        },
                        children: [
                            // LEFT COLUMN
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        display: 'flex',
                                        flexDirection: 'column',
                                        flex: 1,
                                        marginRight: '16px'
                                    },
                                    children: [
                                        // Brand Header
                                        {
                                            type: 'div',
                                            props: {
                                                style: {
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    marginBottom: '4px'
                                                },
                                                children: [
                                                    {
                                                        type: 'div',
                                                        props: {
                                                            style: {
                                                                width: '26px',
                                                                height: '26px',
                                                                borderRadius: '8px',
                                                                background: '#FFFFFF',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                marginRight: '8px',
                                                                fontWeight: 800,
                                                                color: bgColor,
                                                                fontSize: '14px'
                                                            },
                                                            children: (card.brandName || 'M').charAt(0).toUpperCase()
                                                        }
                                                    },
                                                    {
                                                        type: 'span',
                                                        props: {
                                                            style: {
                                                                fontSize: '16px',
                                                                fontWeight: 800,
                                                                color: '#FFFFFF'
                                                            },
                                                            children: card.brandName || 'Merchant'
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        // Title
                                        {
                                            type: 'div',
                                            props: {
                                                style: {
                                                    fontSize: '13px',
                                                    fontWeight: 700,
                                                    opacity: 0.95,
                                                    marginBottom: '4px'
                                                },
                                                children: card.title
                                            }
                                        },
                                        // Cardholder Name
                                        {
                                            type: 'div',
                                            props: {
                                                style: {
                                                    fontSize: '15px',
                                                    fontWeight: 700,
                                                    marginBottom: type === 1 ? '10px' : '6px',
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                },
                                                children: `👤 ${card.cardholderName || 'Member'}`
                                            }
                                        },
                                        // Stamps Grid or Valid Thru
                                        type === 1 ? {
                                            type: 'div',
                                            props: {
                                                style: {
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    maxWidth: '220px'
                                                },
                                                children: stampItems
                                            }
                                        } : {
                                            type: 'div',
                                            props: {
                                                style: {
                                                    borderTop: '1px solid rgba(255,255,255,0.3)',
                                                    paddingTop: '6px',
                                                    marginTop: '12px',
                                                    display: 'flex',
                                                    flexDirection: 'column'
                                                },
                                                children: [
                                                    {
                                                        type: 'span',
                                                        props: {
                                                            style: {
                                                                fontSize: '10px',
                                                                textTransform: 'uppercase',
                                                                opacity: 0.85,
                                                                letterSpacing: '0.5px'
                                                            },
                                                            children: 'VALID THRU'
                                                        }
                                                    },
                                                    {
                                                        type: 'span',
                                                        props: {
                                                            style: {
                                                                fontSize: '14px',
                                                                fontWeight: 800,
                                                                marginTop: '2px'
                                                            },
                                                            children: card.expiry || '12 Months'
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            },
                            // RIGHT COLUMN (QR CODE & SCAN TEXT)
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        width: '96px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    },
                                    children: [
                                        qrDataUri ? {
                                            type: 'img',
                                            props: {
                                                src: qrDataUri,
                                                width: '92',
                                                height: '92',
                                                style: {
                                                    width: '92px',
                                                    height: '92px',
                                                    background: '#FFFFFF',
                                                    borderRadius: '6px',
                                                    padding: '4px'
                                                }
                                            }
                                        } : null,
                                        {
                                            type: 'span',
                                            props: {
                                                style: {
                                                    fontSize: '10px',
                                                    fontWeight: 700,
                                                    marginTop: '6px',
                                                    letterSpacing: '0.5px',
                                                    opacity: 0.9,
                                                    textTransform: 'uppercase'
                                                },
                                                children: scanText
                                            }
                                        }
                                    ].filter(Boolean)
                                }
                            }
                        ]
                    }
                },
                // FOOTER (POWERED BY FIRSTLOOP.CO.IN)
                {
                    type: 'div',
                    props: {
                        style: {
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            fontSize: '10px',
                            fontWeight: 600,
                            opacity: 0.9
                        },
                        children: 'powered by firstloop.co.in'
                    }
                }
            ]
        }
    };

    const svg = await satori(element, {
        width: 420,
        height: 260,
        fonts: fontBuffer ? [
            {
                name: 'Inter',
                data: fontBuffer,
                weight: 400,
                style: 'normal'
            }
        ] : []
    });

    const resvg = new Resvg(svg, {
        fitTo: {
            mode: 'width',
            value: 420
        }
    });

    const pngData = resvg.render();
    return Buffer.from(pngData.asPng());
}

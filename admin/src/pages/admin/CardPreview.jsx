import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import API from '../../api.js'
import fl_logo from '../../assets/img/firstloop-favicon.png'
import qrImg from '../../assets/img/qr-img.png'

const getRelativeImagePath = (path) => {
    if (!path || typeof path !== 'string') return ''
    let str = path.trim()
    if (str.startsWith('data:') || str.startsWith('blob:')) return str

    const uploadsMatch = str.match(/(uploads\/.*)/i)
    if (uploadsMatch && uploadsMatch[1]) {
        return uploadsMatch[1].replace(/^\/+/, '')
    }

    if (str.startsWith('http://') || str.startsWith('https://')) {
        const lastHttp = str.lastIndexOf('http://')
        const lastHttps = str.lastIndexOf('https://')
        const idx = Math.max(lastHttp, lastHttps)
        try {
            const url = new URL(str.substring(idx))
            str = url.pathname
        } catch (e) {
            str = str.replace(/^https?:\/\/[^/]+/i, '')
        }
    }

    return str.replace(/^\/+/, '')
}

const formatImageUrl = (img) => {
    if (!img) return ''
    let str = String(img).trim()

    if (str.startsWith('data:') || str.startsWith('blob:')) {
        return str
    }

    const rel = getRelativeImagePath(str)
    if (!rel) return ''

    const baseUrl = import.meta.env.VITE_API_URL || ''
    const cleanBase = baseUrl.replace(/\/+$/, '')
    const cleanImg = rel.replace(/^\/+/, '')
    return cleanBase ? `${cleanBase}/${cleanImg}` : cleanImg
}

const getCardStyle = (card) => {
    if (!card) return {}
    const style = {
        border: `2px solid ${card.borderColor || card.border_color || 'rgba(255,255,255,0.4)'}`
    }
    const bgImg = card.bgImage || card.background_image
    if (bgImg && bgImg !== 'none' && bgImg !== 'null' && bgImg !== 'undefined') {
        style.backgroundImage = `url(${formatImageUrl(bgImg)})`
        style.backgroundSize = 'cover'
        style.backgroundPosition = 'center'
        style.backgroundRepeat = 'no-repeat'
    } else {
        style.backgroundColor = card.bgColor || card.background_color || '#0E88B8'
    }
    return style
}

export default function CardPreview() {
    const { id } = useParams()
    const [stampSelected, setStampSelected] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchStampCards = async () => {
        if (!id) return
        setLoading(true)
        try {
            const response = await API.post(
                'firstloop/merchant/fetch-stamp-card-details',
                {
                    id: Number(id)
                }
            )

            if (response?.data?.status !== 1) {
                console.error('Failed to fetch stamp card:', response?.data?.msg)
                setStampSelected(null)
                return
            }

            const item = response?.data?.data?.[0]
            if (!item) {
                console.error('No stamp card found')
                setStampSelected(null)
                return
            }

            const totalStamps = Number(item.number_of_stamps) || 8
            const stampLevels = Array.isArray(item.StampLevels) ? item.StampLevels : []

            const formatted = {
                id: Number(item.id),
                title: item.title || 'Stamp Pass',
                brandName: item.brand_name || 'Merchant',
                brandLogo: item.brand_image ? getRelativeImagePath(item.brand_image) : null,
                total_stamps: totalStamps,
                reward: item.reward || 'Special Gift',
                active_members: Number(item.active_members) || 0,
                expiry: item.expiry || '2026-12-31',
                status: Number(item.status) === 1 ? 'Active' : 'Inactive',
                bgColor: item.background_color || '#0E88B8',
                bgImage: item.background_image ? getRelativeImagePath(item.background_image) : null,
                textColor: item.text_color || '#FFFFFF',
                borderColor: item.border_color || '#00A6D6',
                stampBgColor: item.stamp_background || 'rgba(255, 255, 255, 0.3)',
                stampBorderColor: item.stamp_border_color || '#FFFFFF',
                stampTextColor: item.stamp_text_color || '#FFFFFF',
                stamp_radius: Number(item.stamp_radius ?? 50),
                preset: 'Custom',
                branch_ids: Array.isArray(item.branch_ids)
                    ? item.branch_ids.map(Number)
                    : item.branch_id
                        ? [Number(item.branch_id)]
                        : [],
                levelRewards: stampLevels.length > 0
                    ? stampLevels.map((lvl, idx) => ({
                        stamp: Number(lvl.stamp_number) || idx + 1,
                        reward: lvl.reward_text || (
                            lvl.reward_type === '2'
                                ? 'Discount'
                                : lvl.reward_type === '3'
                                    ? 'Paid'
                                    : 'Free Item'
                        ),
                        type: lvl.reward_type === '2'
                            ? 'Discount'
                            : lvl.reward_type === '3'
                                ? 'Paid'
                                : 'Free',
                        discountVal: lvl.reward_type === '2'
                            ? parseInt(lvl.reward_text) || 10
                            : 0,
                        icon: 'fa-gift',
                        amt: Number(lvl.amt) || 0
                    }))
                    : Array.from({ length: totalStamps }).map((_, i) => ({
                        stamp: i + 1,
                        reward: `Stamp #${i + 1}`,
                        type: 'Free',
                        discountVal: 0,
                        icon: 'fa-gift',
                        amt: 0
                    }))
            }

            setStampSelected(formatted)
        } catch (err) {
            console.error('Error fetching stamp card from API:', err)
            setStampSelected(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (id) {
            fetchStampCards()
        }
    }, [id])

    // Dynamic Meta Tags for Open Graph and WhatsApp link previews
    useEffect(() => {
        if (!stampSelected) return
        const brand = stampSelected.brandName || 'Merchant'
        const title = stampSelected.title || 'Digital Stamp Card'
        document.title = `${brand} - ${title}`

        const updateMeta = (prop, content) => {
            if (!content) return
            let el = document.querySelector(`meta[property="${prop}"]`) || document.querySelector(`meta[name="${prop}"]`)
            if (!el) {
                el = document.createElement('meta')
                el.setAttribute('property', prop)
                document.head.appendChild(el)
            }
            el.setAttribute('content', content)
        }

        const fullImageUrl = formatImageUrl(stampSelected.brandLogo || stampSelected.bgImage)
        updateMeta('og:title', `${brand} - ${title}`)
        updateMeta('og:description', `Collect ${stampSelected.total_stamps || 8} stamps to earn exclusive rewards!`)
        updateMeta('og:image', fullImageUrl)
        updateMeta('og:url', window.location.href)
        updateMeta('twitter:card', 'summary_large_image')
        updateMeta('twitter:image', fullImageUrl)
    }, [stampSelected])

    const card = stampSelected
    const cardTitle = `${card?.brandName || 'Merchant'} - ${card?.title || 'Digital Stamp Card'}`
    const cardDesc = `Collect ${card?.total_stamps || 8} stamps to earn exclusive rewards!`
    const cardImageUrl = card ? formatImageUrl(card.brandLogo || card.bgImage) : ''
    const currentUrl = typeof window !== 'undefined' ? window.location.href : ''

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: '#F8FAFC' }}>
                <div className="spinner-border text-primary" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        )
    }

    if (!card) {
        return null
    }

    return (
        <>
            {/* META TAGS FOR WHATSAPP, OPEN GRAPH, AND TWITTER */}
            <title>{cardTitle}</title>
            <meta name="description" content={cardDesc} />
            
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content="FirstLoop" />
            <meta property="og:title" content={cardTitle} />
            <meta property="og:description" content={cardDesc} />
            <meta property="og:image" content={cardImageUrl} />
            <meta property="og:image:secure_url" content={cardImageUrl} />
            <meta property="og:image:alt" content={cardTitle} />
            <meta property="og:url" content={currentUrl} />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={cardTitle} />
            <meta name="twitter:description" content={cardDesc} />
            <meta name="twitter:image" content={cardImageUrl} />

            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px', background: '#F8FAFC' }}>
                {/* DIGITAL STAMP CARD CANVAS */}
                <div
                    id="stamp-card-preview-canvas"
                    style={{
                        width: '100%',
                        maxWidth: 420,
                        borderRadius: 22,
                        ...getCardStyle(card),
                        color: card.textColor || '#FFFFFF',
                        padding: 22,
                        boxShadow: '0 20px 45px -10px rgba(0,0,0,0.3)',
                        position: 'relative',
                        minHeight: 230
                    }}
                >
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        {/* LEFT SIDE: Brand, Title & Stamp Circles */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FFFFFF', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                                    <img src={formatImageUrl(card.brandLogo) || fl_logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </div>
                                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'inherit' }}>
                                    {card.brandName || 'Merchant'}
                                </span>
                            </div>

                            <div style={{ fontSize: '0.82rem', opacity: 0.9, marginBottom: 12, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                <strong>{card.title}</strong>
                            </div>

                            {/* Stamp Circles Grid */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 6, maxWidth: 230 }}>
                                {Array.from({ length: Number(card.total_stamps || 8) }).map((_, i) => {
                                    const rewardItem = card.levelRewards ? card.levelRewards[i] : null
                                    let iconMarkup = i + 1

                                    if (rewardItem) {
                                        if (rewardItem.type === 'Free') {
                                            iconMarkup = <i className="fas fa-gift" style={{ fontSize: '0.8rem' }} />
                                        } else if (rewardItem.type === 'Discount') {
                                            iconMarkup = <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>{rewardItem.discountVal || 10}%</span>
                                        } else if (rewardItem.type === 'Paid' && rewardItem.icon) {
                                            iconMarkup = <i className={`fas ${rewardItem.icon}`} style={{ fontSize: '0.8rem' }} />
                                        }
                                    }

                                    return (
                                        <div
                                            key={i}
                                            style={{
                                                width: 38,
                                                height: 38,
                                                borderRadius: `${card.stamp_radius ?? 50}%`,
                                                border: `2px solid ${card.stampBorderColor || '#FFFFFF'}`,
                                                background: card.stampBgColor || 'rgba(255, 255, 255, 0.3)',
                                                color: card.stampTextColor || 'inherit',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.85rem',
                                                fontWeight: 800,
                                                flexShrink: 0
                                            }}
                                        >
                                            {iconMarkup}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* RIGHT SIDE: QR CODE */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <img
                                src={qrImg}
                                alt="QR Code"
                                style={{ width: 92, height: 92, objectFit: 'contain', flexShrink: 0 }}
                            />
                            <small style={{ fontSize: '0.62rem', fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>
                                SCAN TO STAMP
                            </small>
                        </div>
                    </div>

                    {/* BOTTOM RIGHT ALIGNED POWERED BY BADGE WITH FIRSTLOOP LOGO */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 5, fontSize: '0.65rem', opacity: 0.9, fontWeight: 600, marginTop: 12, lineHeight: 1 }}>
                        <span style={{ lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>powered by</span>
                        <img src={fl_logo} alt="FirstLoop" style={{ height: 13, width: 'auto', display: 'inline-block', verticalAlign: 'middle', objectFit: 'contain', margin: '0 1px' }} />
                        <strong style={{ color: 'inherit', lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>firstloop.co.in</strong>
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}
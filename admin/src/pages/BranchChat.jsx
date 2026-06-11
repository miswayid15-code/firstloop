import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import AppToaster from '../components/AppToaster.jsx'
import API from '../api.js'

/* ═══════════════════════════════════════════════════════
   SENDER ROLE CONFIG  — single source of truth
═══════════════════════════════════════════════════════ */
const ROLE_CONFIG = {
    customer: {
        label: 'Customer',
        icon: 'fa-user',
        bubble: '#fff',
        bubbleBorder: '1px solid #f0f0f0',
        bubbleShadow: '0 2px 10px rgba(0,0,0,0.07)',
        nameColor: '#555',
        textColor: '#222',
        badgeBg: '#f0f4ff',
        badgeColor: '#3f51b5',
        avatarBg: '#3f51b5',
    },
    merchant: {
        label: 'Merchant',
        icon: 'fa-store',
        bubble: 'linear-gradient(135deg,#1a73e8 0%,#0d47a1 100%)',
        bubbleBorder: 'none',
        bubbleShadow: '0 4px 18px rgba(26,115,232,0.28)',
        nameColor: 'rgba(255,255,255,0.8)',
        textColor: '#fff',
        badgeBg: '#e8f0fe',
        badgeColor: '#1a73e8',
        avatarBg: '#1a73e8',
    },
    receptionist: {
        label: 'Receptionist',
        icon: 'fa-headset',
        bubble: 'linear-gradient(135deg,#e91e8c 0%,#c2185b 100%)',
        bubbleBorder: 'none',
        bubbleShadow: '0 4px 18px rgba(233,30,140,0.28)',
        nameColor: 'rgba(255,255,255,0.8)',
        textColor: '#fff',
        badgeBg: '#fce4ec',
        badgeColor: '#c2185b',
        avatarBg: '#e91e8c',
    },
    admin: {
        label: 'Admin',
        icon: 'fa-shield-alt',
        bubble: 'linear-gradient(135deg,#6a1b9a 0%,#4a148c 100%)',
        bubbleBorder: 'none',
        bubbleShadow: '0 4px 18px rgba(106,27,154,0.28)',
        nameColor: 'rgba(255,255,255,0.8)',
        textColor: '#fff',
        badgeBg: '#f3e5f5',
        badgeColor: '#7b1fa2',
        avatarBg: '#7b1fa2',
    },
}

/* ═══════════════════════════════════════════════════════
   DUMMY DATA
═══════════════════════════════════════════════════════ */
const DUMMY_BRANCH = {
    id: 1,
    name: 'Downtown Starbucks',
    address: '410 Broadway Ave, Downtown City',
    merchant_id: 1,
}

const DUMMY_CONVERSATIONS = [
    {
        id: 1, customer_id: 101, customer_name: 'Alice Cooper', profile_image: null,
        last_message: 'Thank you so much! See you tomorrow.',
        last_message_time: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        unread_count: 2, is_online: true,
    },
    {
        id: 2, customer_id: 102, customer_name: 'Brian Rogers', profile_image: null,
        last_message: 'Perfect, heading over now. Thanks!',
        last_message_time: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
        unread_count: 0, is_online: true,
    },
    {
        id: 3, customer_id: 103, customer_name: 'Charlotte Hall', profile_image: null,
        last_message: 'Great, thanks for the quick response!',
        last_message_time: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
        unread_count: 0, is_online: false,
    },
    {
        id: 4, customer_id: 104, customer_name: 'David Miller', profile_image: null,
        last_message: 'Just checked and it works! Thank you.',
        last_message_time: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
        unread_count: 1, is_online: false,
    },
    {
        id: 5, customer_id: 105, customer_name: 'Emma Watson', profile_image: null,
        last_message: 'Yes please, reserve two brewed coffees.',
        last_message_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        unread_count: 0, is_online: false,
    },
    {
        id: 6, customer_id: 106, customer_name: 'Frank Castle', profile_image: null,
        last_message: 'Can I book a table for 4?',
        last_message_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        unread_count: 0, is_online: false,
    },
]

const DUMMY_MESSAGES = {
    /* Alice Cooper — shows all 4 roles in one thread */
    101: [
        {
            id: 1, sender_type: 'customer', sender_name: 'Alice Cooper',
            message: "Hi! I'd like to make a reservation for tomorrow morning.",
            createdAt: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
        },
        {
            id: 2, sender_type: 'receptionist', sender_name: 'Sarah (Receptionist)',
            message: "Hello Alice! Of course — how many people and what time works best for you?",
            createdAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
        },
        {
            id: 3, sender_type: 'customer', sender_name: 'Alice Cooper',
            message: "It's for 2 people, preferably around 10:30 AM.",
            createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        },
        {
            id: 4, sender_type: 'merchant', sender_name: 'Downtown Starbucks',
            message: "Hi Alice! Just confirming we have a cosy corner table available at 10:30 AM for two. It's all yours!",
            createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
        },
        {
            id: 5, sender_type: 'admin', sender_name: 'Admin — Dealora',
            message: "This conversation has been reviewed. Reservation confirmed and logged in the system.",
            createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
        {
            id: 6, sender_type: 'receptionist', sender_name: 'Sarah (Receptionist)',
            message: "You're all set, Alice! 2 people at 10:30 AM tomorrow. See you then! ☕",
            createdAt: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
        },
        {
            id: 7, sender_type: 'customer', sender_name: 'Alice Cooper',
            message: "Thank you so much! See you tomorrow.",
            createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        },
    ],

    /* Brian Rogers — receptionist + customer */
    102: [
        {
            id: 10, sender_type: 'customer', sender_name: 'Brian Rogers',
            message: "Is the branch open today? I want to grab a coffee.",
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 11, sender_type: 'receptionist', sender_name: 'James (Receptionist)',
            message: "Yes Brian, we're open until 9 PM today. Come on in!",
            createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 12, sender_type: 'merchant', sender_name: 'Downtown Starbucks',
            message: "We're also running a 20% off promotion on all cold brews today!",
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 13, sender_type: 'customer', sender_name: 'Brian Rogers',
            message: "Perfect, heading over now. Thanks!",
            createdAt: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
        },
    ],

    /* Charlotte Hall — customer + admin */
    103: [
        {
            id: 20, sender_type: 'customer', sender_name: 'Charlotte Hall',
            message: "Do you have any gluten-free options on your menu?",
            createdAt: new Date(Date.now() - 27 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 21, sender_type: 'receptionist', sender_name: 'Sarah (Receptionist)',
            message: "Hi Charlotte! Yes, we have several gluten-free pastries and all beverages are gluten-free.",
            createdAt: new Date(Date.now() - 26.5 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 22, sender_type: 'admin', sender_name: 'Admin — Dealora',
            message: "For your reference, the full allergen menu is available at the front counter.",
            createdAt: new Date(Date.now() - 26.2 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 23, sender_type: 'customer', sender_name: 'Charlotte Hall',
            message: "Great, thanks for the quick response!",
            createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
        },
    ],

    /* David Miller — receptionist + merchant */
    104: [
        {
            id: 30, sender_type: 'merchant', sender_name: 'Downtown Starbucks',
            message: "Hi David! Your exclusive coupon SAVE20 has been applied to your loyalty account.",
            createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 31, sender_type: 'receptionist', sender_name: 'James (Receptionist)',
            message: "The coupon gives you 20% off your next visit. Valid until Sunday!",
            createdAt: new Date(Date.now() - 25.5 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 32, sender_type: 'customer', sender_name: 'David Miller',
            message: "Just checked and it works! Thank you.",
            createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
        },
    ],

    /* Emma Watson */
    105: [
        {
            id: 40, sender_type: 'customer', sender_name: 'Emma Watson',
            message: "Hi, can I pre-order two brewed coffees for pickup at 8 AM?",
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 41, sender_type: 'receptionist', sender_name: 'Sarah (Receptionist)',
            message: "Absolutely Emma! Pre-orders are available. I'll note it — 2 brewed coffees at 8 AM.",
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
        },
        {
            id: 42, sender_type: 'customer', sender_name: 'Emma Watson',
            message: "Yes please, reserve two brewed coffees. Thank you!",
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
        },
        {
            id: 43, sender_type: 'admin', sender_name: 'Admin — Dealora',
            message: "Pre-order confirmed in the system. Order #PO-2847 created.",
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
        },
    ],

    /* Frank Castle */
    106: [
        {
            id: 50, sender_type: 'customer', sender_name: 'Frank Castle',
            message: "Can I book a table for 4 people this Saturday?",
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 51, sender_type: 'receptionist', sender_name: 'James (Receptionist)',
            message: "Hi Frank! Let me check availability for Saturday. Can you confirm the preferred time?",
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
        },
        {
            id: 52, sender_type: 'merchant', sender_name: 'Downtown Starbucks',
            message: "We have 11 AM and 2 PM slots open on Saturday for groups of 4.",
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
        },
    ],
}

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
const formatChatTime = (value) => {
    if (!value) return ''
    const d = new Date(value)
    if (isNaN(d.getTime())) return ''
    const now = new Date()
    const sameDay = (a, b) =>
        a.getDate() === b.getDate() &&
        a.getMonth() === b.getMonth() &&
        a.getFullYear() === b.getFullYear()
    if (sameDay(d, now))
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    if (sameDay(d, yesterday)) return 'Yesterday'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatMessageTime = (value) => {
    if (!value) return ''
    const d = new Date(value)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

const formatDateDivider = (value) => {
    if (!value) return ''
    const d = new Date(value)
    if (isNaN(d.getTime())) return ''
    const now = new Date()
    const sameDay = (a, b) =>
        a.getDate() === b.getDate() &&
        a.getMonth() === b.getMonth() &&
        a.getFullYear() === b.getFullYear()
    if (sameDay(d, now)) return 'Today'
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    if (sameDay(d, yesterday)) return 'Yesterday'
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

const getInitials = (name) => {
    if (!name) return '?'
    const parts = String(name).trim().split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

const AVATAR_COLORS = ['#e91e8c', '#9c27b0', '#2196f3', '#009688', '#ff5722', '#607d8b', '#795548', '#3f51b5']
const getAvatarColor = (name) => {
    if (!name) return AVATAR_COLORS[0]
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const getRoleConfig = (senderType) => ROLE_CONFIG[senderType] || ROLE_CONFIG.customer

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════ */
function Avatar({ name, size = 40, src, forceColor }) {
    const bg = forceColor || (src ? 'transparent' : getAvatarColor(name))
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            background: src ? 'transparent' : bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.38, fontWeight: 700, color: '#fff',
            flexShrink: 0, overflow: 'hidden', letterSpacing: '0.5px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.14)',
        }}>
            {src
                ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : getInitials(name)}
        </div>
    )
}

function RoleBadge({ senderType }) {
    const cfg = getRoleConfig(senderType)
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.4px',
            textTransform: 'uppercase',
            background: cfg.badgeBg, color: cfg.badgeColor,
            borderRadius: 20, padding: '2px 7px',
            flexShrink: 0,
        }}>
            <i className={`fas ${cfg.icon}`} style={{ fontSize: '0.55rem' }} />
            {cfg.label}
        </span>
    )
}

function ConversationItem({ conv, isActive, onClick }) {
    const name = conv.customer_name || 'Customer'
    return (
        <div className={`bch-conv-item${isActive ? ' active' : ''}`} onClick={onClick}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
                <Avatar name={name} size={46} src={conv.profile_image} />
                {conv.is_online && <span className="bch-online-dot" />}
            </div>
            <div className="bch-conv-info">
                <div className="bch-conv-top">
                    <span className="bch-conv-name">{name}</span>
                    <span className="bch-conv-time">{formatChatTime(conv.last_message_time)}</span>
                </div>
                <div className="bch-conv-bottom">
                    <span className="bch-conv-last">{conv.last_message || <em>No messages yet</em>}</span>
                    {conv.unread_count > 0 && <span className="bch-unread">{conv.unread_count}</span>}
                </div>
            </div>
        </div>
    )
}

function MessageBubble({ msg }) {
    const type = msg.sender_type || 'customer'
    const cfg = getRoleConfig(type)
    // customer bubbles align left; staff bubbles (receptionist / merchant / admin) align right
    const isRight = type !== 'customer'

    return (
        <div className={`bch-msg-row${isRight ? ' right' : ''}`}>
            {/* Avatar — left for customer, right for staff */}
            {!isRight && (
                <Avatar
                    name={msg.sender_name || 'Customer'}
                    size={32}
                    src={msg.sender_image}
                    forceColor={cfg.avatarBg}
                />
            )}

            <div className="bch-bubble-wrap">
                {/* Sender name + role badge */}
                <div className={`bch-sender-row${isRight ? ' right' : ''}`}>
                    <span className="bch-sender-name" style={{ color: isRight ? '#666' : '#444' }}>
                        {msg.sender_name}
                    </span>
                    <RoleBadge senderType={type} />
                </div>

                {/* Message bubble */}
                <div
                    className={`bch-bubble${isRight ? ' right' : ''}`}
                    style={{
                        background: cfg.bubble,
                        border: cfg.bubbleBorder,
                        boxShadow: cfg.bubbleShadow,
                    }}
                >
                    <p className="bch-bubble-text" style={{ color: cfg.textColor }}>
                        {msg.message || msg.content || msg.text}
                    </p>
                    <div className="bch-bubble-meta">
                        <span className="bch-bubble-time" style={{
                            color: isRight ? 'rgba(255,255,255,0.6)' : '#bbb',
                        }}>
                            {formatMessageTime(msg.createdAt || msg.created_at)}
                        </span>
                        {isRight && (
                            <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.7)' }}>
                                <i className="fas fa-check-double" />
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {isRight && (
                <Avatar
                    name={msg.sender_name || type}
                    size={32}
                    src={msg.sender_image}
                    forceColor={cfg.avatarBg}
                />
            )}
        </div>
    )
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════ */
export default function BranchChat() {
    const navigate = useNavigate()
    const { id } = useParams()
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

    const [branchData, setBranchData] = useState(null);
    const [conversations] = useState(DUMMY_CONVERSATIONS)
    const [convSearch, setConvSearch] = useState('')
    const [activeConv, setActiveConv] = useState(DUMMY_CONVERSATIONS[0])
    const [messages, setMessages] = useState(DUMMY_MESSAGES[DUMMY_CONVERSATIONS[0].customer_id] || [])
    const [inputText, setInputText] = useState('')
    const [sending, setSending] = useState(false)
    const [loading, setLoading] = useState(true)

    const fetchBranch = async () => {
        try {
            setLoading(true);

            const response = await API.get(`admin/branch/details/${id}`);
            const data = response.data || {};

            console.log("Data", data);

            if (isSuccessResponse(data)) {
                setBranchData(data.data); // set branch details from API
            } else {
                toast.error(data.message || 'Failed to load branch details');
            }
        } catch (error) {
            const apiMessage =
                error?.response?.data?.message || 'Failed to load branch details';

            toast.error(apiMessage);
            console.error('Error fetching branch:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectConversation = (conv) => {
        setActiveConv(conv)
        setMessages(DUMMY_MESSAGES[conv.customer_id] || [])
    }
    useEffect(() => {
        fetchBranch()
    }, [id])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, activeConv])

    const handleSend = () => {
        const text = inputText.trim()
        if (!text || sending) return
        setSending(true)
        setMessages(prev => [...prev, {
            id: Date.now(),
            sender_type: 'receptionist',
            sender_name: 'Sarah (Receptionist)',
            message: text,
            createdAt: new Date().toISOString(),
        }])
        setInputText('')
        if (inputRef.current) inputRef.current.style.height = 'auto'
        setTimeout(() => setSending(false), 400)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
    }

    const groupedMessages = (() => {
        const groups = []
        let curDate = null
        messages.forEach(msg => {
            const raw = msg.createdAt || msg.created_at || ''
            const dateKey = raw ? new Date(raw).toDateString() : 'Unknown'
            if (dateKey !== curDate) {
                curDate = dateKey
                groups.push({ type: 'divider', label: formatDateDivider(raw), key: `div-${dateKey}` })
            }
            groups.push({ type: 'message', msg, key: msg.id })
        })
        return groups
    })()

    const filteredConvs = conversations.filter(c =>
        (c.customer_name || '').toLowerCase().includes(convSearch.toLowerCase())
    )

    const merchantId = branchData?.merchant_id

    return (
        <>
            <AppToaster />
            <style>{`
                /* ─── layout ─── */
                .bch-page{display:flex;flex-direction:column;height:calc(100vh - 118px);min-height:540px}
                .bch-shell{display:flex;flex:1;border-radius:20px;overflow:hidden;
                    box-shadow:0 12px 48px rgba(0,0,0,0.10);border:1px solid rgba(0,0,0,0.06);
                    background:#fff;min-height:0}

                /* ─── sidebar ─── */
                .bch-sidebar{width:310px;min-width:260px;display:flex;flex-direction:column;
                    border-right:1px solid #f0f0f0;background:#fff}
                .bch-sidebar-hdr{padding:18px 16px 14px;border-bottom:1px solid #f5f5f5}
                .bch-sidebar-title{font-size:1rem;font-weight:700;color:#111;margin:0 0 12px;
                    font-family:var(--font-heading);display:flex;align-items:center;gap:8px}
                .bch-sidebar-count{background:linear-gradient(135deg,#e91e8c,#c2185b);color:#fff;
                    font-size:0.68rem;font-weight:700;border-radius:20px;padding:2px 9px}
                .bch-search-wrap{display:flex;align-items:center;gap:8px;background:#f5f6fa;
                    border-radius:12px;padding:9px 13px;border:1.5px solid transparent;transition:border-color .2s}
                .bch-search-wrap:focus-within{border-color:rgba(233,30,140,.25);background:#fff}
                .bch-search-wrap i{color:#bbb;font-size:.8rem}
                .bch-search-wrap input{border:none;background:transparent;outline:none;
                    font-size:.85rem;color:#333;flex:1;font-family:inherit}
                .bch-conv-list{flex:1;overflow-y:auto}
                .bch-conv-list::-webkit-scrollbar{width:3px}
                .bch-conv-list::-webkit-scrollbar-thumb{background:#eee;border-radius:3px}

                /* conversation item */
                .bch-conv-item{display:flex;align-items:center;gap:12px;padding:13px 16px;
                    cursor:pointer;transition:background .15s;border-bottom:1px solid #fafafa;position:relative}
                .bch-conv-item:hover{background:#fdf3f8}
                .bch-conv-item.active{background:linear-gradient(135deg,rgba(233,30,140,.08),rgba(233,30,140,.03));
                    border-right:3px solid #e91e8c}
                .bch-online-dot{position:absolute;bottom:2px;right:2px;width:12px;height:12px;
                    background:#22c55e;border-radius:50%;border:2.5px solid #fff}
                .bch-conv-info{flex:1;min-width:0}
                .bch-conv-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
                .bch-conv-name{font-size:.88rem;font-weight:600;color:#111;white-space:nowrap;
                    overflow:hidden;text-overflow:ellipsis;max-width:155px}
                .bch-conv-time{font-size:.71rem;color:#bbb;flex-shrink:0}
                .bch-conv-bottom{display:flex;align-items:center;justify-content:space-between}
                .bch-conv-last{font-size:.77rem;color:#999;white-space:nowrap;overflow:hidden;
                    text-overflow:ellipsis;max-width:190px}
                .bch-unread{background:#e91e8c;color:#fff;font-size:.67rem;font-weight:700;
                    min-width:20px;height:20px;border-radius:10px;display:flex;align-items:center;
                    justify-content:center;padding:0 5px;flex-shrink:0}

                /* ─── chat panel ─── */
                .bch-panel{flex:1;display:flex;flex-direction:column;min-width:0;background:#f8f5fb}
                .bch-panel-hdr{display:flex;align-items:center;gap:12px;padding:13px 20px;
                    background:#fff;border-bottom:1px solid #f0f0f0;box-shadow:0 2px 10px rgba(0,0,0,.04)}
                .bch-panel-name{font-size:.95rem;font-weight:700;color:#111;font-family:var(--font-heading)}
                .bch-panel-status{font-size:.73rem;color:#22c55e;font-weight:500}
                .bch-panel-actions{margin-left:auto;display:flex;gap:6px}
                .bch-icon-btn{width:36px;height:36px;border-radius:50%;border:none;background:#f5f6fa;
                    color:#888;cursor:pointer;display:flex;align-items:center;justify-content:center;
                    font-size:.84rem;transition:background .15s,color .15s}
                .bch-icon-btn:hover{background:rgba(233,30,140,.1);color:#e91e8c}

                /* ─── role legend ─── */
                .bch-legend{display:flex;align-items:center;gap:10px;padding:8px 20px;
                    background:#fafafa;border-bottom:1px solid #f0f0f0;flex-wrap:wrap}
                .bch-legend-label{font-size:.68rem;color:#aaa;font-weight:600;margin-right:2px}
                .bch-legend-item{display:inline-flex;align-items:center;gap:4px;
                    font-size:.66rem;font-weight:700;padding:2px 8px;border-radius:20px}

                /* ─── messages ─── */
                .bch-messages{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:2px}
                .bch-messages::-webkit-scrollbar{width:4px}
                .bch-messages::-webkit-scrollbar-thumb{background:#ddd;border-radius:4px}

                /* date divider */
                .bch-date-div{display:flex;align-items:center;gap:10px;margin:18px 0 10px}
                .bch-date-div::before,.bch-date-div::after{content:'';flex:1;height:1px;background:rgba(0,0,0,.07)}
                .bch-date-label{font-size:.7rem;font-weight:600;color:#aaa;background:#ede9f5;
                    padding:3px 13px;border-radius:20px;white-space:nowrap}

                /* message row */
                .bch-msg-row{display:flex;align-items:flex-end;gap:8px;margin-bottom:10px}
                .bch-msg-row.right{flex-direction:row-reverse}
                .bch-bubble-wrap{display:flex;flex-direction:column;max-width:62%;min-width:0}
                .bch-sender-row{display:flex;align-items:center;gap:6px;margin-bottom:4px}
                .bch-sender-row.right{flex-direction:row-reverse}
                .bch-sender-name{font-size:.73rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

                /* bubble */
                .bch-bubble{border-radius:18px 18px 18px 4px;padding:10px 14px 8px;
                    animation:bchIn .18s ease}
                .bch-bubble.right{border-radius:18px 18px 4px 18px}
                @keyframes bchIn{from{opacity:0;transform:translateY(7px) scale(.96)}to{opacity:1;transform:none}}
                .bch-bubble-text{font-size:.875rem;margin:0;line-height:1.55;word-break:break-word}
                .bch-bubble-meta{display:flex;align-items:center;gap:4px;justify-content:flex-end;margin-top:5px}
                .bch-bubble-time{font-size:.64rem}

                /* ─── input bar ─── */
                .bch-input-bar{display:flex;align-items:flex-end;gap:10px;padding:14px 20px;
                    background:#fff;border-top:1px solid #f0f0f0}
                .bch-input-wrap{flex:1;display:flex;align-items:center;background:#f5f6fa;
                    border-radius:24px;padding:10px 16px;gap:10px;border:1.5px solid transparent;
                    transition:border-color .2s,background .2s}
                .bch-input-wrap:focus-within{border-color:rgba(233,30,140,.3);background:#fff;
                    box-shadow:0 0 0 3px rgba(233,30,140,.06)}
                .bch-input-wrap textarea{flex:1;border:none;background:transparent;outline:none;
                    font-size:.88rem;color:#333;font-family:inherit;resize:none;max-height:120px;line-height:1.5}
                .bch-input-wrap textarea::placeholder{color:#bbb}
                .bch-send-btn{width:46px;height:46px;border-radius:50%;border:none;
                    background:linear-gradient(135deg,#e91e8c,#c2185b);color:#fff;cursor:pointer;
                    display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;
                    box-shadow:0 4px 16px rgba(233,30,140,.35);transition:transform .15s,box-shadow .15s,opacity .15s}
                .bch-send-btn:hover:not(:disabled){transform:scale(1.07);box-shadow:0 6px 22px rgba(233,30,140,.45)}
                .bch-send-btn:disabled{opacity:.45;cursor:not-allowed}

                /* no-conv */
                .bch-no-conv{flex:1;display:flex;flex-direction:column;align-items:center;
                    justify-content:center;gap:16px}
                .bch-no-conv h4{font-size:1rem;font-weight:700;color:#333;margin:0;font-family:var(--font-heading)}
                .bch-no-conv p{font-size:.82rem;color:#bbb;margin:0;text-align:center;max-width:230px}

                @media(max-width:680px){
                    .bch-sidebar{width:100%;max-width:100%;border-right:none;height:200px}
                    .bch-shell{flex-direction:column}
                    .bch-bubble-wrap{max-width:84%}
                }
            `}</style>

            {/* breadcrumb + page header */}
            <div style={{ marginBottom: 20 }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: '0.79rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: 8
                }}>
                    <NavLink to="/merchants" style={{ color: 'var(--primary)' }}>Merchants</NavLink>
                    <i className="fas fa-chevron-right" style={{ fontSize: '0.65rem' }} />
                    {merchantId && <>
                        <NavLink to={`/view-merchant/${merchantId}`} style={{ color: 'var(--primary)' }}>Merchant</NavLink>
                        <i className="fas fa-chevron-right" style={{ fontSize: '0.65rem' }} />
                    </>}
                    <NavLink to={`/view-branch/${id}`} style={{ color: 'var(--primary)' }}>
                        {branchData?.name || 'Branch'}
                    </NavLink>
                    <i className="fas fa-chevron-right" style={{ fontSize: '0.65rem' }} />
                    <span>Customer Chats</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                        <h3 style={{
                            fontFamily: 'var(--font-heading)', fontSize: '1.18rem',
                            fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10
                        }}>
                            <span style={{
                                width: 34, height: 34, borderRadius: '50%',
                                background: 'linear-gradient(135deg,#e91e8c,#c2185b)',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontSize: '0.88rem', flexShrink: 0
                            }}>
                                <i className="fas fa-comments" />
                            </span>
                            {branchData?.name} — Customer Chats
                        </h3>
                        {branchData?.address && (
                            <p style={{ fontSize: '0.79rem', color: 'var(--text-muted)', margin: '5px 0 0 44px' }}>
                                <i className="fas fa-map-marker-alt" style={{ marginRight: 5, color: '#e91e8c' }} />
                                {branchData.address}
                            </p>
                        )}
                    </div>
                    <button type="button" className="btn btn-secondary"
                        onClick={() => navigate(merchantId ? `/view-merchant/${merchantId}` : '/merchants')}>
                        <i className="fas fa-arrow-left" /> Back to Merchant
                    </button>
                </div>
            </div>

            <div className="bch-page">
                <div className="bch-shell">

                    {/* ══════════ SIDEBAR ══════════ */}
                    <div className="bch-sidebar">
                        <div className="bch-sidebar-hdr">
                            <p className="bch-sidebar-title">
                                <i className="fas fa-comment-dots" style={{ color: '#e91e8c', fontSize: '0.9rem' }} />
                                Customer Chats
                                <span className="bch-sidebar-count">{conversations.length}</span>
                            </p>
                            <div className="bch-search-wrap">
                                <i className="fas fa-search" />
                                <input type="text" placeholder="Search customer chats..."
                                    value={convSearch} onChange={e => setConvSearch(e.target.value)}
                                    id="bch-search-input" />
                            </div>
                        </div>
                        <div className="bch-conv-list">
                            {filteredConvs.length === 0 ? (
                                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#ccc', fontSize: '0.82rem' }}>
                                    <i className="fas fa-comment-slash" style={{ fontSize: '1.6rem', display: 'block', marginBottom: 8 }} />
                                    No chats found
                                </div>
                            ) : filteredConvs.map(conv => (
                                <ConversationItem key={conv.id} conv={conv}
                                    isActive={activeConv?.id === conv.id}
                                    onClick={() => selectConversation(conv)} />
                            ))}
                        </div>
                    </div>

                    {/* ══════════ CHAT PANEL ══════════ */}
                    {activeConv ? (
                        <div className="bch-panel">
                            {/* Header */}
                            <div className="bch-panel-hdr">
                                <Avatar name={activeConv.customer_name} size={42} src={activeConv.profile_image} />
                                <div>
                                    <div className="bch-panel-name">{activeConv.customer_name || 'Customer'}</div>
                                    {activeConv.is_online && <div className="bch-panel-status">● Online</div>}
                                </div>
                                <div className="bch-panel-actions">
                                    <button className="bch-icon-btn" title="Call" id="bch-call-btn">
                                        <i className="fas fa-phone" />
                                    </button>
                                    <button className="bch-icon-btn" title="Profile" id="bch-profile-btn">
                                        <i className="fas fa-user-circle" />
                                    </button>
                                </div>
                            </div>

                            {/* Role legend */}
                            <div className="bch-legend">
                                <span className="bch-legend-label">Roles:</span>
                                {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                                    <span key={key} className="bch-legend-item"
                                        style={{ background: cfg.badgeBg, color: cfg.badgeColor }}>
                                        <i className={`fas ${cfg.icon}`} style={{ fontSize: '0.6rem' }} />
                                        {cfg.label}
                                    </span>
                                ))}
                            </div>

                            {/* Messages */}
                            <div className="bch-messages" id="bch-messages-area">
                                {groupedMessages.map(item => {
                                    if (item.type === 'divider') {
                                        return (
                                            <div className="bch-date-div" key={item.key}>
                                                <span className="bch-date-label">{item.label}</span>
                                            </div>
                                        )
                                    }
                                    return <MessageBubble key={item.key} msg={item.msg} />
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input bar */}
                            <div className="bch-input-bar">
                                <div className="bch-input-wrap">
                                    <textarea ref={inputRef} rows={1}
                                        placeholder="Type a response as Receptionist..."
                                        value={inputText}
                                        onChange={e => {
                                            setInputText(e.target.value)
                                            e.target.style.height = 'auto'
                                            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
                                        }}
                                        onKeyDown={handleKeyDown}
                                        id="bch-message-input" />
                                </div>
                                <button className="bch-send-btn" onClick={handleSend}
                                    disabled={!inputText.trim() || sending}
                                    title="Send message" id="bch-send-btn">
                                    {sending
                                        ? <i className="fas fa-circle-notch fa-spin" />
                                        : <i className="fas fa-paper-plane" />}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bch-no-conv">
                            <div style={{
                                width: 80, height: 80, borderRadius: '50%',
                                background: 'linear-gradient(135deg,rgba(233,30,140,.14),rgba(233,30,140,.06))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '2.2rem', color: '#e91e8c'
                            }}>
                                <i className="fas fa-comments" />
                            </div>
                            <h4>Select a conversation</h4>
                            <p>Choose a customer from the list to view messages.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

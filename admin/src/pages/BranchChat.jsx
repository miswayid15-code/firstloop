import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import AppToaster from '../components/AppToaster.jsx'
import API from '../api.js'
import { db } from "../firebase";
import {
    collection,
    query,
    orderBy,
    onSnapshot, where
} from "firebase/firestore";


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
    const name = `${conv.customerName || conv.customerId ||''}`
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
                    <span className="bch-conv-last">{conv.lastMessage || <em>No messages yet</em>}</span>
                    {conv.unread_count > 0 && <span className="bch-unread">{conv.unread_count}</span>}
                </div>
            </div>
        </div>
    )
}

function MessageBubble({ msg }) {
    const type = msg.senderRole || 'customer'
    const cfg = getRoleConfig(type)
    // customer bubbles align left; staff bubbles (receptionist / merchant / admin) align right
    const isRight = type !== 'customer'

    return (
        <div className={`bch-msg-row${isRight ? ' right' : ''}`}>
            {/* Avatar — left for customer, right for staff */}
            {!isRight && (
                <Avatar
                    name={msg.senderName || 'Customer'}
                    size={32}
                    // src={msg.sender_image}
                    forceColor={cfg.avatarBg}
                />
            )}

            <div className="bch-bubble-wrap">
                {/* Sender name + role badge */}
                <div className={`bch-sender-row${isRight ? ' right' : ''}`}>

                    <RoleBadge senderType={type} />

                    <span
                        className="bch-sender-name"
                        style={{
                            color: isRight ? '#718096' : '#4a5568',
                            fontWeight: 600,
                            fontSize: '0.78rem',
                            letterSpacing: '0.1px'
                        }}
                    >
                        {msg.senderName || cfg.label}
                    </span>

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
                            {formatMessageTime(
                                msg.timestamp?.seconds
                                    ? msg.timestamp.seconds * 1000
                                    : msg.timestamp
                            )}
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
                    name={msg.senderName || type}
                    size={32}
                    // src={msg.sender_image}
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
    const [conversations, setConversations] = useState([]);
    const [convSearch, setConvSearch] = useState('')
    const [activeConv, setActiveConv] = useState(null)
    const [messages, setMessages] = useState([])
    const [inputText, setInputText] = useState('')
    const [sending, setSending] = useState(false)
    const [loading, setLoading] = useState(true)

    const fetchBranch = async () => {
        try {
            setLoading(true);

            const response = await API.get(`/admin/branch/details/${id}`);

            // console.log("Branch Response:", response.data);

            if (response.data?.status === 1) {
                setBranchData(response.data.data);
            } else {
                console.error(response.data?.message);
            }

        } catch (error) {
            console.error("Error fetching branch:", error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {

        if (!id) return;

        const q = query(
            collection(db, "chats"),
            where("branchId", "==", String(id)),
            orderBy("lastMessageAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {

            const chats = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // console.log("Branch Chats:", chats);

            setConversations(chats);

            if (!activeConv && chats.length > 0) {
                setActiveConv(chats[0]);
            }
        });

        return () => unsubscribe();

    }, [id]);
    useEffect(() => {

        if (!activeConv) return;

        if (typeof activeConv.id !== "string") {
            // console.log("Invalid chat id:", activeConv);
            return;
        }

        const q = query(
            collection(db, "chats", activeConv.id, "messages"),
            orderBy("timestamp", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {

            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // console.log("ACTIVE CHAT:", activeConv);
            // console.log(
            //     "PATH:",
            //     "chats",
            //     activeConv?.id,
            //     "messages"
            // );
            // console.log("MESSAGES:", msgs);
            setMessages(msgs);
        });

        return () => unsubscribe();

    }, [activeConv]);
    useEffect(() => {
        fetchBranch();
    }, [id]);
    const selectConversation = (conv) => {
        setActiveConv(conv)

    }


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, activeConv])

   const handleSend = async () => {

    const text = inputText.trim();

    if (!text || sending || !activeConv) return;

    try {

        setSending(true);

        const response = await API.post('/admin/chat/send', {
            chatId: activeConv.id,
            content: text
        });

        if (response.data.status === 1) {
            setInputText('');
        }

    } catch (error) {
        console.error(error);
    } finally {
        setSending(false);
    }
};

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
    }

    const groupedMessages = (() => {
        const groups = []
        let curDate = null
        messages.forEach(msg => {
            const raw = msg.timestamp?.seconds
                ? msg.timestamp.seconds * 1000
                : ''
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
        (`${c.customerId || ''}`)
            .toLowerCase()
            .includes(convSearch.toLowerCase())
    )

    const merchantId = branchData?.merchant_id;


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
                                {branchData?.address}
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
                                <Avatar
                                    name={`${activeConv.customerName ||activeConv.customerId || ''}`}
                                    size={42}
                                />

                                <div className="bch-panel-name">
                                    {activeConv.customerName ||activeConv.customerId || ''}
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
                                        placeholder="Send Message..."
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

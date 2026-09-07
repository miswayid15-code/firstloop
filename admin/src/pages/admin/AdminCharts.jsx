import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import API from '../../api.js'
import { db } from "../../firebase.js";
import { v4 as uuidv4 } from "uuid";
import {
    collection,
    doc,
    query,
    orderBy,
    onSnapshot,
    where,
    getDocs,
    addDoc,
    updateDoc,
    serverTimestamp
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from 'react-hot-toast'

// Initialize Firebase Storage
const storage = getStorage();

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
import { getAuth } from "firebase/auth";

// console.log("currentUser", getAuth().currentUser);
/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */
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

function MessageBubble({ msg }) {
    const type = msg.senderRole || 'customer'
    const cfg = getRoleConfig(type)
    const isRight = type !== 'customer'

    return (
        <div className={`ach-msg-row${isRight ? ' right' : ''}`}>
            {!isRight && (
                <Avatar
                    name={msg.senderName || 'Customer'}
                    size={32}
                    forceColor={cfg.avatarBg}
                />
            )}

            <div className="ach-bubble-wrap">
                <div className={`ach-sender-row${isRight ? ' right' : ''}`}>
                    <RoleBadge senderType={type} />
                    <span
                        className="ach-sender-name"
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

                <div
                    className={`ach-bubble${isRight ? ' right' : ''}`}
                    style={{
                        background: cfg.bubble,
                        border: cfg.bubbleBorder,
                        boxShadow: cfg.bubbleShadow,
                    }}
                >
                    {msg.type === 'image' && msg.imageUrl && (
                        <div style={{ marginBottom: (msg.message || msg.content || msg.text) ? 8 : 0 }}>
                            <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                                <img
                                    src={msg.imageUrl}
                                    alt="Shared attachment"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: 240,
                                        borderRadius: 8,
                                        objectFit: 'contain',
                                        display: 'block',
                                        cursor: 'zoom-in'
                                    }}
                                />
                            </a>
                        </div>
                    )}
                    {(msg.message || msg.content || msg.text) && (
                        <p className="ach-bubble-text" style={{ color: cfg.textColor }}>
                            {msg.message || msg.content || msg.text}
                        </p>
                    )}
                    <div className="ach-bubble-meta">
                        <span className="ach-bubble-time" style={{
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
                    forceColor={cfg.avatarBg}
                />
            )}
        </div>
    )
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════ */
export default function AdminCharts() {
    const navigate = useNavigate()
    const { id } = useParams() // Customer ID
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

    const [customerData, setCustomerData] = useState(null)
    const [customerLoading, setCustomerLoading] = useState(true)

    const [chatData, setChatData] = useState(null)
    const [chatLoading, setChatLoading] = useState(true)
    const [messages, setMessages] = useState([])
    const [inputText, setInputText] = useState('')
    const [sending, setSending] = useState(false)

    const [selectedImage, setSelectedImage] = useState(null)
    const [imagePreview, setImagePreview] = useState('')

    const initializingChatRef = useRef(false)

    const handleImageChange = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedImage(file)
            setImagePreview(URL.createObjectURL(file))
        }
        e.target.value = ''
    }

    const clearSelectedImage = () => {
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview)
        }
        setSelectedImage(null)
        setImagePreview('')
    }

    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview)
            }
        }
    }, [imagePreview])

    // Reset state when Customer ID changes
    useEffect(() => {
        if (id) {
            setCustomerData(null)
            setChatData(null)
            setMessages([])
            setCustomerLoading(true)
            setChatLoading(true)
            initializingChatRef.current = false
            fetchCustomer()
        }
    }, [id])

    // Fetch Customer Details
    const fetchCustomer = async () => {
        try {
            setCustomerLoading(true)
            // console.log("AdminChat - Fetching customer details for ID:", id)
            const response = await API.post('admin/customer/details', { id })
            if (response.data?.status === 1 && response.data.data?.length > 0) {
                const customer = response.data.data[0]
                setCustomerData(customer)
                // console.log("AdminChat - Customer details loaded successfully:", customer)
            } else {
                console.warn("AdminChat - Unexpected customer details response:", response.data)
            }
        } catch (error) {
            console.error("AdminChat - Error fetching customer details:", error)
            toast.error("Failed to load customer details")
        } finally {
            setCustomerLoading(false)
        }
    }

    // Query or Create unique Admin Chat document in Firestore
    useEffect(() => {
        if (!id || customerLoading || initializingChatRef.current) return

        const findOrCreateChat = async () => {
            try {
                initializingChatRef.current = true
                setChatLoading(true)
                // console.log("AdminChat - Querying Firestore for existing admin chat with customer ID:", id)

                const chatsRef = collection(db, "chats")
                const q = query(
                    chatsRef,
                    where("customerId", "==", parseInt(id, 10)),
                    where("chatType", "==", "admin")
                )

                const querySnapshot = await getDocs(q)

                if (!querySnapshot.empty) {
                    // Chat document already exists
                    const chatDoc = querySnapshot.docs[0]
                    const data = chatDoc.data()
                    // console.log("AdminChat - Found existing admin chat document with auto-generated ID:", chatDoc.id, data)
                    setChatData({ id: chatDoc.id, ...data })
                } else {
                    // Create new direct admin chat document with auto-generated ID
                    const customerName = customerData?.name || "Customer"
                    const newChatPayload = {
                        customerId: parseInt(id, 10),
                        customerName: customerName,
                        chatType: "admin",
                        status: "active",
                        createdAt: serverTimestamp(),
                        lastMessage: "",
                        lastMessageAt: serverTimestamp(),
                        lastMessageBy: "admin"
                    }

                    // console.log("AdminChat - No existing admin chat found. Creating direct admin chat in Firestore...", newChatPayload)
                    const docRef = await addDoc(chatsRef, newChatPayload)
                    setChatData({ id: docRef.id, ...newChatPayload })
                    // console.log("AdminChat - Created new admin chat document with ID:", docRef.id)
                }
            } catch (error) {
                console.error("AdminChat - Error during findOrCreateChat session:", error)
                toast.error("Failed to initialize chat session")
            } finally {
                setChatLoading(false)
                initializingChatRef.current = false
            }
        }

        findOrCreateChat()
    }, [id, customerLoading, customerData])

    // Load Messages for the Direct Chat from Firestore using onSnapshot
    useEffect(() => {
        const chatId = chatData?.id
        if (!chatId) return

        // console.log("AdminChat - Listening to messages for chatId:", chatId)
        const q = query(
            collection(db, "chats", chatId, "messages"),
            orderBy("timestamp", "asc")
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            // console.log(`AdminChat - Messages loaded from Firestore. Count: ${msgs.length}. Path: chats/${chatId}/messages`)
            setMessages(msgs)
        }, (error) => {
            console.error("AdminChat - Error streaming messages from Firestore:", error)
        })

        return () => unsubscribe()
    }, [chatData?.id])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Send Message directly via Firebase Firestore & Storage SDKs
    const handleSend = async () => {
        const text = inputText.trim()
        const chatId = chatData?.id

        if (!text && !selectedImage) return
        if (sending || !chatId) return

        try {
            setSending(true)
            let imageUrl = null

            // 1. Upload file if selected
            if (selectedImage) {
                const fileName = `chat_images/${chatId}/${uuidv4()}_${selectedImage.name}`;
                const storageRef = ref(storage, fileName);
                const uploadSnapshot = await uploadBytes(storageRef, selectedImage);
                imageUrl = await getDownloadURL(uploadSnapshot.ref);
            }

            // 2. Add message to chats/{chatId}/messages subcollection
            const messagePayload = {
                customerId: chatData.customerId,
                senderId: "admin",
                senderName: "Admin",
                senderRole: "admin",
                content: text,
                imageUrl: imageUrl || "",
                type: imageUrl ? "image" : "text",
                timestamp: serverTimestamp()
            }

            // console.log("AdminChat - Saving message directly to subcollection: chats/" + chatId + "/messages", messagePayload)
            const messagesRef = collection(db, "chats", chatId, "messages")
            await addDoc(messagesRef, messagePayload)

            // 3. Update parent document: lastMessage, lastMessageAt, lastMessageBy
            const chatDocRef = doc(db, "chats", chatId)
            const parentUpdatePayload = {
                lastMessage: imageUrl ? "Shared an image" : text,
                lastMessageAt: serverTimestamp(),
                lastMessageBy: "admin"
            }

            // console.log("AdminChat - Updating parent chat document values:", parentUpdatePayload)
            await updateDoc(chatDocRef, parentUpdatePayload)

            // 4. Trigger Customer Notification API
            try {
                const cusId = chatData?.customerId || parseInt(id, 10)
                const chId = chatData?.ch_id || chatId
                await API.post('api/chats/send-cus-notifications', {
                    cus_id: cusId,
                    ch_id: chId
                })
                // console.log("AdminChat - Customer notification API called successfully:", { cus_id: cusId, ch_id: chId })
            } catch (notifErr) {
                console.error("AdminChat - Failed to send customer notification:", notifErr)
            }

            // 5. Reset inputs
            setInputText('')
            clearSelectedImage()
            if (inputRef.current) {
                inputRef.current.style.height = 'auto'
            }
        } catch (error) {
            console.error("AdminChat - Direct message send failure:", error)
            toast.error("Failed to send message")
        } finally {
            setSending(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
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

    const customerName = customerData?.name || 'Customer'
    const customerImage = customerData?.profile_image || ''

    return (
        <>
            <style>{`
                /* ─── layout ─── */
                .ach-page{display:flex;flex-direction:column;height:calc(100vh - 118px);min-height:540px}
                .ach-shell{display:flex;flex:1;border-radius:20px;overflow:hidden;
                    box-shadow:0 12px 48px rgba(0,0,0,0.10);border:1px solid rgba(0,0,0,0.06);
                    background:#fff;min-height:0}

                /* ─── chat panel ─── */
                .ach-panel{flex:1;display:flex;flex-direction:column;min-width:0;background:#f8f5fb}
                .ach-panel-hdr{display:flex;align-items:center;gap:12px;padding:13px 20px;
                    background:#fff;border-bottom:1px solid #f0f0f0;box-shadow:0 2px 10px rgba(0,0,0,.04)}
                .ach-panel-name{font-size:.95rem;font-weight:700;color:#111;font-family:var(--font-heading)}
                .ach-panel-status{font-size:.73rem;color:#22c55e;font-weight:500}
                .ach-panel-actions{margin-left:auto;display:flex;gap:6px}
                .ach-icon-btn{width:36px;height:36px;border-radius:50%;border:none;background:#f5f6fa;
                    color:#888;cursor:pointer;display:flex;align-items:center;justify-content:center;
                    font-size:.84rem;transition:background .15s,color .15s}
                .ach-icon-btn:hover{background:rgba(233,30,140,.1);color:#e91e8c}

                /* ─── role legend ─── */
                .ach-legend{display:flex;align-items:center;gap:10px;padding:8px 20px;
                    background:#fafafa;border-bottom:1px solid #f0f0f0;flex-wrap:wrap}
                .ach-legend-label{font-size:.68rem;color:#aaa;font-weight:600;margin-right:2px}
                .ach-legend-item{display:inline-flex;align-items:center;gap:4px;
                    font-size:.66rem;font-weight:700;padding:2px 8px;border-radius:20px}

                /* ─── messages ─── */
                .ach-messages{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:2px}
                .ach-messages::-webkit-scrollbar{width:4px}
                .ach-messages::-webkit-scrollbar-thumb{background:#ddd;border-radius:4px}

                /* date divider */
                .ach-date-div{display:flex;align-items:center;gap:10px;margin:18px 0 10px}
                .ach-date-div::before,.ach-date-div::after{content:'';flex:1;height:1px;background:rgba(0,0,0,.07)}
                .ach-date-label{font-size:.7rem;font-weight:600;color:#aaa;background:#ede9f5;
                    padding:3px 13px;border-radius:20px;white-space:nowrap}

                /* message row */
                .ach-msg-row{display:flex;align-items:flex-end;gap:8px;margin-bottom:10px}
                .ach-msg-row.right{flex-direction:row-reverse}
                .ach-bubble-wrap{display:flex;flex-direction:column;max-width:62%;min-width:0}
                .ach-sender-row{display:flex;align-items:center;gap:6px;margin-bottom:4px}
                .ach-sender-row.right{flex-direction:row-reverse}
                .ach-sender-name{font-size:.73rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

                /* bubble */
                .ach-bubble{border-radius:18px 18px 18px 4px;padding:10px 14px 8px;
                    animation:achIn .18s ease}
                .ach-bubble.right{border-radius:18px 18px 4px 18px}
                @keyframes achIn{from{opacity:0;transform:translateY(7px) scale(.96)}to{opacity:1;transform:none}}
                .ach-bubble-text{font-size:.875rem;margin:0;line-height:1.55;word-break:break-word}
                .ach-bubble-meta{display:flex;align-items:center;gap:4px;justify-content:flex-end;margin-top:5px}
                .ach-bubble-time{font-size:.64rem}

                /* ─── input bar ─── */
                .ach-input-bar{display:flex;align-items:flex-end;gap:10px;padding:14px 20px;
                    background:#fff;border-top:1px solid #f0f0f0}
                .ach-input-wrap{flex:1;display:flex;align-items:center;background:#f5f6fa;
                    border-radius:24px;padding:10px 16px;gap:10px;border:1.5px solid transparent;
                    transition:border-color .2s,background .2s}
                .ach-input-wrap:focus-within{border-color:rgba(233,30,140,.3);background:#fff;
                    box-shadow:0 0 0 3px rgba(233,30,140,.06)}
                .ach-input-wrap textarea{flex:1;border:none;background:transparent;outline:none;
                    font-size:.88rem;color:#333;font-family:inherit;resize:none;max-height:120px;line-height:1.5}
                .ach-input-wrap textarea::placeholder{color:#bbb}
                .ach-send-btn{width:46px;height:46px;border-radius:50%;border:none;
                    background:linear-gradient(135deg,#e91e8c,#c2185b);color:#fff;cursor:pointer;
                    display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;
                    box-shadow:0 4px 16px rgba(233,30,140,.35);transition:transform .15s,box-shadow .15s,opacity .15s}
                .ach-send-btn:hover:not(:disabled){transform:scale(1.07);box-shadow:0 6px 22px rgba(233,30,140,.45)}
                .ach-send-btn:disabled{opacity:.45;cursor:not-allowed}

                @media(max-width:680px){
                    .ach-bubble-wrap{max-width:84%}
                }
            `}</style>

            {/* Breadcrumb + page header */}
            <div style={{ marginBottom: 20 }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: '0.79rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: 8
                }}>
                    <NavLink to="/customers" style={{ color: 'var(--primary)' }}>Customers</NavLink>
                    <i className="fas fa-chevron-right" style={{ fontSize: '0.65rem' }} />
                    <span>Direct Chat</span>
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
                            {customerLoading ? 'Loading Customer...' : `Direct Chat with ${customerName}`}
                        </h3>
                        {customerData && (
                            <p style={{ fontSize: '0.79rem', color: 'var(--text-muted)', margin: '5px 0 0 44px' }}>
                                <i className="fas fa-envelope" style={{ marginRight: 5, color: '#e91e8c' }} />
                                {customerData.email}
                                <span style={{ margin: '0 8px', color: '#ccc' }}>|</span>
                                <i className="fas fa-phone-alt" style={{ marginRight: 5, color: '#e91e8c' }} />
                                {customerData.country_code} {customerData.phone}
                            </p>
                        )}
                    </div>
                    <button type="button" className="btn btn-secondary"
                        onClick={() => navigate('/customers')}>
                        <i className="fas fa-arrow-left" /> Back to Customers
                    </button>
                </div>
            </div>

            <div className="ach-page">
                <div className="ach-shell">

                    {/* ══════════ CHAT PANEL ══════════ */}
                    <div className="ach-panel">
                        {/* Header */}
                        <div className="ach-panel-hdr">
                            <Avatar
                                name={customerName}
                                size={42}
                                src={customerImage}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div className="ach-panel-name">
                                    {customerName}
                                </div>
                                <span className="ach-panel-status">
                                    <i className="fas fa-circle" style={{ fontSize: '0.55rem', marginRight: 4 }} />
                                    Active Session
                                </span>
                            </div>
                            <div className="ach-panel-actions">
                                {customerData?.phone && (
                                    <a href={`tel:${customerData.phone}`} className="ach-icon-btn" title="Call Customer">
                                        <i className="fas fa-phone" />
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Role legend */}
                        <div className="ach-legend">
                            <span className="ach-legend-label">Roles:</span>
                            {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                                <span key={key} className="ach-legend-item"
                                    style={{ background: cfg.badgeBg, color: cfg.badgeColor }}>
                                    <i className={`fas ${cfg.icon}`} style={{ fontSize: '0.6rem' }} />
                                    {cfg.label}
                                </span>
                            ))}
                        </div>

                        {/* Messages */}
                        <div className="ach-messages" id="ach-messages-area">
                            {chatLoading ? (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', flexDirection: 'column', gap: 10 }}>
                                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem' }} />
                                    <span>Initializing Admin Chat...</span>
                                </div>
                            ) : groupedMessages.length === 0 ? (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', flexDirection: 'column', gap: 10 }}>
                                    <i className="fas fa-comments" style={{ fontSize: '2rem' }} />
                                    <span>Send a message to start conversation</span>
                                </div>
                            ) : groupedMessages.map(item => {
                                if (item.type === 'divider') {
                                    return (
                                        <div className="ach-date-div" key={item.key}>
                                            <span className="ach-date-label">{item.label}</span>
                                        </div>
                                    )
                                }
                                return <MessageBubble key={item.key} msg={item.msg} />
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Image Preview Area */}
                        {imagePreview && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '10px 20px',
                                background: '#fff',
                                borderTop: '1px solid #f0f0f0',
                                borderBottom: '1px solid #f0f0f0'
                            }}>
                                <div style={{
                                    position: 'relative',
                                    width: 60,
                                    height: 60,
                                    borderRadius: 6,
                                    overflow: 'hidden',
                                    border: '1.5px solid #e0e0e0',
                                    flexShrink: 0
                                }}>
                                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button
                                        type="button"
                                        onClick={clearSelectedImage}
                                        style={{
                                            position: 'absolute',
                                            top: 2,
                                            right: 2,
                                            width: 18,
                                            height: 18,
                                            borderRadius: '50%',
                                            background: 'rgba(0,0,0,0.6)',
                                            border: 'none',
                                            color: '#fff',
                                            fontSize: 10,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: 0
                                        }}
                                    >
                                        <i className="fas fa-times" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Input Bar */}
                        <div className="ach-input-bar">
                            <label htmlFor="ach-image-upload" style={{ margin: 0 }}>
                                <span className="ach-icon-btn" style={{ cursor: 'pointer' }} title="Attach Image">
                                    <i className="fas fa-paperclip" />
                                </span>
                                <input
                                    type="file"
                                    id="ach-image-upload"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    style={{ display: 'none' }}
                                />
                            </label>

                            <div className="ach-input-wrap">
                                <textarea
                                    ref={inputRef}
                                    rows={1}
                                    placeholder="Type a message..."
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    style={{ overflowY: 'auto' }}
                                />
                            </div>

                            <button
                                type="button"
                                className="ach-send-btn"
                                onClick={handleSend}
                                disabled={sending || chatLoading || (!inputText.trim() && !selectedImage)}
                                id="ach-send-message-btn"
                            >
                                {sending ? (
                                    <i className="fas fa-spinner fa-spin" />
                                ) : (
                                    <i className="fas fa-paper-plane" />
                                )}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </>
    )
}
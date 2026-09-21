import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from 'axios'
import API from '../api.js'


// Static default stamp cards fallback
const STATIC_STAMP_CARDS = [
    {
        id: "stamp_1",
        title: "Coffee Lover's Stamp Card",
        total_stamps: 10,
        reward: "Free Specialty Coffee & Pastry",
        color: "#0E88B8",
        badge: "Loyalty Favorite",
        description: "Collect 10 stamps to unlock a free specialty drink of your choice."
    },
    {
        id: "stamp_2",
        title: "Dining Rewards Pass",
        total_stamps: 8,
        reward: "20% Off Next Main Course",
        color: "#059669",
        badge: "Food & Beverage",
        description: "Earn 1 stamp per dine-in visit over $25."
    },
    {
        id: "stamp_3",
        title: "Wellness & Spa Stamp Card",
        total_stamps: 6,
        reward: "Complimentary 30min Massage",
        color: "#7C3AED",
        badge: "Spa & Beauty",
        description: "Collect 6 stamps on any spa session or beauty treatment."
    }
];

// Static default membership cards fallback
const STATIC_MEMBERSHIP_CARDS = [
    {
        id: "member_1",
        title: "VIP Elite Gold Pass",
        tier: "Gold Tier",
        validity: "1 Year Validity",
        reward: "15% Off All Orders + Priority Lounge Access",
        color: "#D97706",
        badge: "Most Popular",
        description: "Exclusive member benefits including 15% discount on all purchases."
    },
    {
        id: "member_2",
        title: "Silver Member Club",
        tier: "Silver Tier",
        validity: "6 Months",
        reward: "10% Discount & Free Delivery Perks",
        color: "#4B5563",
        badge: "Essential",
        description: "Enjoy 10% discount on every order and free home deliveries."
    },
    {
        id: "member_3",
        title: "Platinum Founder's Circle",
        tier: "Platinum Tier",
        validity: "Lifetime Access",
        reward: "25% Lifetime Off + VIP Concierge Support",
        color: "#0F172A",
        badge: "VIP Exclusive",
        description: "Highest level access pass with dedicated personal assistant."
    }
];

const AddCardCustomer = ({
    isOpen = true,
    onClose,
    stampCards = [],
    membershipCards = [],
    branch = null,
    onAddSuccess
}) => {
    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState(searchParams?.get("email") || "");
    const [customerName, setCustomerName] = useState("");
    const [phone, setPhone] = useState(searchParams?.get("phone") || "");
    const [customerStatus, setCustomerStatus] = useState("New Customer");
    const [isSearching, setIsSearching] = useState(false);
    const [emailChecked, setEmailChecked] = useState(false);

    const [cardType, setCardType] = useState("stamp"); // 'stamp' or 'membership'
    const [selectedCardId, setSelectedCardId] = useState("");
    const [initialStamps, setInitialStamps] = useState(1);
    const [sendNotification, setSendNotification] = useState(true);
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const availableStampCards = stampCards && stampCards.length > 0 ? stampCards : STATIC_STAMP_CARDS;
    const availableMembershipCards = membershipCards && membershipCards.length > 0 ? membershipCards : STATIC_MEMBERSHIP_CARDS;

    const fetchCheckCustomer = async (searchEmail) => {
        const emailToLookup = (searchEmail || email).trim().toLowerCase();
        if (!emailToLookup) return null;

        try {
            const response = await API.post("firstloop/customer/check-customer", { email: emailToLookup });
            if (response?.data?.status === 1 || response?.data?.status === "1") {
                const cust = response.data.customer || response.data.data || {};
                if (cust.name) setCustomerName(cust.name);
                if (cust.phone) setPhone(cust.phone);
                if (cust.email) setEmail(cust.email);

                setCustomerStatus("Existing Customer");
                setEmailChecked(true);
                toast.success(`Found customer: ${cust.name || emailToLookup}`);
                return cust;
            } else {
                setCustomerStatus("New Customer");
                setEmailChecked(true);
                setCustomerName("");
                setPhone("");

                toast.success("Ready to register new customer profile");
                return null;
            }
        } catch (error) {
            console.log("Error checking customer from API:", error);

            setCustomerStatus("New Customer");
            setEmailChecked(true);
            toast.success("Ready to register as new customer");
            return null;
        }
    };

    // Auto lookup when email is passed in URL query
    useEffect(() => {
        const paramEmail = searchParams?.get("email");
        if (paramEmail && paramEmail.trim()) {
            const clean = paramEmail.trim().toLowerCase();
            setEmail(clean);
            fetchCheckCustomer(clean);
        }
        const paramPhone = searchParams?.get("phone");
        if (paramPhone && paramPhone.trim()) {
            setPhone(paramPhone.trim());
        }
    }, [searchParams]);

    useEffect(() => {
        if (cardType === "stamp") {
            const firstStamp = availableStampCards[0];
            setSelectedCardId(firstStamp?.id || firstStamp?._id || "stamp_1");
        } else {
            const firstMember = availableMembershipCards[0];
            setSelectedCardId(firstMember?.id || firstMember?._id || "member_1");
        }
    }, [cardType]);

    // Handle ESC key press to close modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && isOpen && onClose) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Lookup customer trigger (button click or Enter key)
    const handleCheckEmail = async (customEmail) => {
        const emailToLookup = (typeof customEmail === "string" ? customEmail : email).trim().toLowerCase();
        if (!emailToLookup) {
            toast.error("Please enter a customer email address");
            return;
        }

        setIsSearching(true);
        try {
            await fetchCheckCustomer(emailToLookup);
        } catch (err) {
            console.error("Lookup error:", err);
        } finally {
            setIsSearching(false);
        }
    };

    // Quick fill from demo chip
    const handleSelectDemoProfile = (demo) => {
        setEmail(demo.email);
        setCustomerName(demo.name);
        setPhone(demo.phone);
        setCustomerStatus("Existing Customer");
        setEmailChecked(true);
        toast.success(`Auto-filled: ${demo.name}`);
    };

    // Find current active selected card object
    const currentCardList = cardType === "stamp" ? availableStampCards : availableMembershipCards;
    const activeCard = currentCardList.find(
        (c) => String(c.id || c._id) === String(selectedCardId)
    ) || currentCardList[0];

    const handleSubmit = async (e) => {
        e?.preventDefault();

        if (!email.trim()) {
            toast.error("Customer email is required");
            return;
        }
        if (!customerName.trim()) {
            toast.error("Customer full name is required");
            return;
        }
        if (!phone.trim()) {
            toast.error("Customer phone number is required");
            return;
        }
        if (!selectedCardId) {
            toast.error("Please select a card to assign");
            return;
        }

        setIsSubmitting(true);

        // Simulate API call delay
        setTimeout(() => {
            setIsSubmitting(false);

            const payload = {
                id: "cust_card_" + Date.now(),
                customer: {
                    name: customerName.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    isNew: customerStatus === "New Customer"
                },
                cardType,
                cardId: selectedCardId,
                cardTitle: activeCard?.title || activeCard?.name || "Loyalty Pass",
                initialStamps: cardType === "stamp" ? Number(initialStamps) : null,
                sendNotification,
                notes: notes.trim(),
                assignedAt: new Date().toISOString(),
                branchName: branch?.name || "Main Branch"
            };

            console.log("Customer Card Issued Successfully:", payload);
            toast.success(`Successfully assigned "${payload.cardTitle}" to ${customerName}!`, {
                duration: 4000,
                icon: "🎉"
            });

            if (onAddSuccess) {
                onAddSuccess(payload);
            }

            if (onClose) {
                onClose();
            }
        }, 600);
    };

    return (
        <div
            className="add-card-customer-modal-backdrop"
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(15, 23, 42, 0.72)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 99999,
                padding: "16px",
                overflowY: "auto",
                animation: "fadeIn 0.2s ease-out"
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget && onClose && !isSubmitting) {
                    onClose();
                }
            }}
        >
            <div
                className="add-card-customer-modal-dialog"
                style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "20px",
                    width: "100%",
                    maxWidth: "640px",
                    maxHeight: "92vh",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                    overflow: "hidden",
                    position: "relative",
                    animation: "scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* MODAL HEADER */}
                <div
                    style={{
                        padding: "20px 24px",
                        borderBottom: "1px solid #F1F5F9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%)"
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div
                            style={{
                                width: "44px",
                                height: "44px",
                                borderRadius: "12px",
                                background: "linear-gradient(135deg, #0E88B8 0%, #059669 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#FFFFFF",
                                fontSize: "1.2rem",
                                boxShadow: "0 8px 16px rgba(14, 136, 184, 0.25)",
                                flexShrink: 0
                            }}
                        >
                            <i className="fas fa-id-card-clip"></i>
                        </div>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <h3
                                    style={{
                                        margin: 0,
                                        fontSize: "1.18rem",
                                        fontWeight: 700,
                                        color: "#0F172A",
                                        letterSpacing: "-0.01em"
                                    }}
                                >
                                    Assign Card to Customer
                                </h3>
                                <span
                                    style={{
                                        backgroundColor: "#E0F2FE",
                                        color: "#0369A1",
                                        fontSize: "0.72rem",
                                        fontWeight: 700,
                                        padding: "2px 8px",
                                        borderRadius: "999px",
                                        textTransform: "uppercase"
                                    }}
                                >
                                    Pass Issuer
                                </span>
                            </div>
                            <p
                                style={{
                                    margin: "3px 0 0",
                                    fontSize: "0.82rem",
                                    color: "#64748B",
                                    lineHeight: 1.3
                                }}
                            >
                                {branch?.name ? `Branch: ${branch.name} • ` : ""}
                                Search or register customer & issue loyalty cards
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        style={{
                            border: "none",
                            background: "#F1F5F9",
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: "#64748B",
                            fontSize: "1rem",
                            transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#E2E8F0";
                            e.currentTarget.style.color = "#0F172A";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#F1F5F9";
                            e.currentTarget.style.color = "#64748B";
                        }}
                        title="Close modal (Esc)"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* MODAL BODY (SCROLLABLE) */}
                <div
                    style={{
                        padding: "22px 24px",
                        overflowY: "auto",
                        maxHeight: "calc(92vh - 145px)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "20px"
                    }}
                >
                    {/* SECTION 1: CUSTOMER LOOKUP & DETAILS */}
                    <div
                        style={{
                            background: "#F8FAFC",
                            border: "1px solid #E2E8F0",
                            borderRadius: "14px",
                            padding: "16px 18px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "14px"
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <i className="fas fa-user-circle" style={{ color: emailChecked ? "#10B981" : "#0E88B8", fontSize: "0.95rem" }}></i>
                                <span style={{ fontWeight: 700, fontSize: "0.88rem", color: emailChecked ? "#065F46" : "#1E293B" }}>
                                    Step 1: Customer Profile
                                </span>
                            </div>
                            {emailChecked && (
                                <span
                                    style={{
                                        fontSize: "0.74rem",
                                        fontWeight: 600,
                                        padding: "2px 8px",
                                        borderRadius: "6px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        backgroundColor: customerStatus === "Existing Customer" ? "#DCFCE7" : "#E0E7FF",
                                        color: customerStatus === "Existing Customer" ? "#15803D" : "#4338CA"
                                    }}
                                >
                                    {customerStatus}
                                </span>
                            )}
                        </div>

                        {/* Customer Email Input & Lookup Button */}
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "0.8rem",
                                    fontWeight: 600,
                                    color: "#475569",
                                    marginBottom: "6px"
                                }}
                            >
                                Customer Email <span style={{ color: "#EF4444" }}>*</span>
                            </label>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <div style={{ position: "relative", flex: 1 }}>
                                    <i
                                        className="fas fa-envelope"
                                        style={{
                                            position: "absolute",
                                            left: "14px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            color: "#94A3B8",
                                            fontSize: "0.85rem"
                                        }}
                                    ></i>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setEmailChecked(false);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleCheckEmail();
                                            }
                                        }}
                                        placeholder="e.g. customer@example.com"
                                        style={{
                                            width: "100%",
                                            padding: "10px 14px 10px 38px",
                                            borderRadius: "10px",
                                            border: "1px solid #CBD5E1",
                                            backgroundColor: "#FFFFFF",
                                            fontSize: "0.88rem",
                                            color: "#1E293B",
                                            outline: "none",
                                            boxSizing: "border-box",
                                            transition: "border-color 0.2s, box-shadow 0.2s"
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = "#0E88B8";
                                            e.target.style.boxShadow = "0 0 0 3px rgba(14, 136, 184, 0.12)";
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = "#CBD5E1";
                                            e.target.style.boxShadow = "none";
                                        }}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleCheckEmail()}
                                    disabled={isSearching || !email.trim()}
                                    style={{
                                        padding: "10px 18px",
                                        borderRadius: "10px",
                                        border: "none",
                                        backgroundColor: isSearching || !email.trim() ? "#94A3B8" : "#0E88B8",
                                        color: "#FFFFFF",
                                        fontSize: "0.85rem",
                                        fontWeight: 600,
                                        cursor: isSearching || !email.trim() ? "not-allowed" : "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        flexShrink: 0,
                                        transition: "background-color 0.2s"
                                    }}
                                >
                                    {isSearching ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin"></i>
                                            <span>Looking up...</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-search"></i>
                                            <span>Lookup</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Customer Name Field */}
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "0.8rem",
                                    fontWeight: 600,
                                    color: "#475569",
                                    marginBottom: "6px"
                                }}
                            >
                                Customer Name <span style={{ color: "#EF4444" }}>*</span>
                            </label>
                            <div style={{ position: "relative" }}>
                                <i
                                    className="fas fa-user"
                                    style={{
                                        position: "absolute",
                                        left: "14px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: "#94A3B8",
                                        fontSize: "0.85rem"
                                    }}
                                ></i>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="e.g. Jane Doe"
                                    style={{
                                        width: "100%",
                                        padding: "10px 14px 10px 38px",
                                        borderRadius: "10px",
                                        border: "1px solid #CBD5E1",
                                        backgroundColor: "#FFFFFF",
                                        fontSize: "0.88rem",
                                        color: "#1E293B",
                                        outline: "none",
                                        boxSizing: "border-box"
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        {/* Customer Phone Field */}
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "0.8rem",
                                    fontWeight: 600,
                                    color: "#475569",
                                    marginBottom: "6px"
                                }}
                            >
                                Phone Number
                            </label>
                            <div style={{ position: "relative" }}>
                                <i
                                    className="fas fa-phone"
                                    style={{
                                        position: "absolute",
                                        left: "14px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: "#94A3B8",
                                        fontSize: "0.85rem"
                                    }}
                                ></i>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="e.g. +1 555-0199"
                                    style={{
                                        width: "100%",
                                        padding: "10px 14px 10px 38px",
                                        borderRadius: "10px",
                                        border: "1px solid #CBD5E1",
                                        backgroundColor: "#FFFFFF",
                                        fontSize: "0.88rem",
                                        color: "#1E293B",
                                        outline: "none",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: SELECT CARD TYPE */}
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                            <i className="fas fa-layer-group" style={{ color: cardType ? "#10B981" : "#0E88B8", fontSize: "0.95rem" }}></i>
                            <span style={{ fontWeight: 700, fontSize: "0.88rem", color: cardType ? "#065F46" : "#1E293B" }}>
                                Step 2: Choose Card Type
                            </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                            {/* Stamp Card Choice */}
                            <button
                                type="button"
                                onClick={() => setCardType("stamp")}
                                style={{
                                    padding: "14px 16px",
                                    borderRadius: "14px",
                                    border: cardType === "stamp" ? "2px solid #10B981" : "1.5px solid #E2E8F0",
                                    backgroundColor: cardType === "stamp" ? "#F0FDF4" : "#FFFFFF",
                                    textAlign: "left",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "12px",
                                    transition: "all 0.2s",
                                    position: "relative",
                                    boxShadow: cardType === "stamp" ? "0 4px 12px rgba(16, 185, 129, 0.15)" : "none"
                                }}
                            >
                                <div
                                    style={{
                                        width: "38px",
                                        height: "38px",
                                        borderRadius: "10px",
                                        backgroundColor: cardType === "stamp" ? "#10B981" : "#F1F5F9",
                                        color: cardType === "stamp" ? "#FFFFFF" : "#64748B",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "1.1rem",
                                        flexShrink: 0
                                    }}
                                >
                                    <i className="fas fa-stamp"></i>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <span style={{ fontWeight: 700, fontSize: "0.92rem", color: cardType === "stamp" ? "#065F46" : "#0F172A" }}>
                                            Stamp Card
                                        </span>
                                    </div>
                                    <p style={{ margin: "2px 0 0", fontSize: "0.76rem", color: "#64748B", lineHeight: 1.3 }}>
                                        Digital punch card with milestone rewards
                                    </p>
                                </div>
                            </button>

                            {/* Membership Card Choice */}
                            <button
                                type="button"
                                onClick={() => setCardType("membership")}
                                style={{
                                    padding: "14px 16px",
                                    borderRadius: "14px",
                                    border: cardType === "membership" ? "2px solid #D97706" : "1.5px solid #E2E8F0",
                                    backgroundColor: cardType === "membership" ? "#FFFBEB" : "#FFFFFF",
                                    textAlign: "left",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "12px",
                                    transition: "all 0.2s",
                                    position: "relative",
                                    boxShadow: cardType === "membership" ? "0 4px 12px rgba(217, 119, 6, 0.15)" : "none"
                                }}
                            >
                                <div
                                    style={{
                                        width: "38px",
                                        height: "38px",
                                        borderRadius: "10px",
                                        backgroundColor: cardType === "membership" ? "#D97706" : "#F1F5F9",
                                        color: cardType === "membership" ? "#FFFFFF" : "#64748B",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "1.1rem",
                                        flexShrink: 0
                                    }}
                                >
                                    <i className="fas fa-crown"></i>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "#0F172A" }}>
                                            Membership Pass
                                        </span>
                                        {cardType === "membership" && (
                                            <i className="fas fa-check-circle" style={{ color: "#D97706", fontSize: "0.95rem" }}></i>
                                        )}
                                    </div>
                                    <p style={{ margin: "2px 0 0", fontSize: "0.76rem", color: "#64748B", lineHeight: 1.3 }}>
                                        Tiered VIP pass with discounts & perks
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* SECTION 3: SELECT SPECIFIC CARD & PREVIEW */}
                    <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                            <label
                                style={{
                                    fontSize: "0.88rem",
                                    fontWeight: 700,
                                    color: "#1E293B",
                                    margin: 0
                                }}
                            >
                                Step 3: Select {cardType === "stamp" ? "Stamp Card" : "Membership Tier"}
                            </label>
                            <span style={{ fontSize: "0.76rem", color: "#64748B" }}>
                                {currentCardList.length} template(s) available
                            </span>
                        </div>

                        {/* Card Dropdown Selector */}
                        <div style={{ position: "relative", marginBottom: "12px" }}>
                            <select
                                value={selectedCardId}
                                onChange={(e) => setSelectedCardId(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "11px 16px",
                                    borderRadius: "10px",
                                    border: "1.5px solid #CBD5E1",
                                    backgroundColor: "#FFFFFF",
                                    fontSize: "0.88rem",
                                    fontWeight: 600,
                                    color: "#0F172A",
                                    outline: "none",
                                    cursor: "pointer",
                                    appearance: "none",
                                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                                    backgroundRepeat: "no-repeat",
                                    backgroundPosition: "right 14px center",
                                    backgroundSize: "16px",
                                    boxSizing: "border-box"
                                }}
                            >
                                {currentCardList.map((card) => {
                                    const cId = card.id || card._id;
                                    const cTitle = card.title || card.name || "Untitled Card";
                                    const cSub = card.reward || card.tier || "";
                                    return (
                                        <option key={cId} value={cId}>
                                            {cTitle} {cSub ? `(${cSub})` : ""}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {/* LIVE CARD PREVIEW BADGE / CARD WIDGET */}
                        {activeCard && (
                            <div
                                style={{
                                    background: cardType === "stamp"
                                        ? "linear-gradient(135deg, #0E88B8 0%, #0369A1 100%)"
                                        : "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
                                    borderRadius: "14px",
                                    padding: "16px 18px",
                                    color: "#FFFFFF",
                                    boxShadow: "0 10px 20px -5px rgba(0, 0, 0, 0.2)",
                                    position: "relative",
                                    overflow: "hidden"
                                }}
                            >
                                {/* Decorative Glow Accent */}
                                <div
                                    style={{
                                        position: "absolute",
                                        right: "-20px",
                                        top: "-20px",
                                        width: "100px",
                                        height: "100px",
                                        borderRadius: "50%",
                                        background: cardType === "stamp" ? "rgba(255,255,255,0.15)" : "rgba(245,158,11,0.2)",
                                        filter: "blur(20px)"
                                    }}
                                />

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
                                    <div>
                                        <span
                                            style={{
                                                fontSize: "0.68rem",
                                                fontWeight: 700,
                                                letterSpacing: "0.08em",
                                                textTransform: "uppercase",
                                                backgroundColor: "rgba(255, 255, 255, 0.2)",
                                                padding: "2px 8px",
                                                borderRadius: "4px",
                                                display: "inline-block",
                                                marginBottom: "6px"
                                            }}
                                        >
                                            {activeCard.badge || (cardType === "stamp" ? "Stamp Pass" : "VIP Tier")}
                                        </span>
                                        <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#FFFFFF" }}>
                                            {activeCard.title || activeCard.name}
                                        </h4>
                                        <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "rgba(255, 255, 255, 0.85)" }}>
                                            {activeCard.description || activeCard.reward}
                                        </p>
                                    </div>
                                    <div
                                        style={{
                                            background: "rgba(255, 255, 255, 0.15)",
                                            padding: "6px 10px",
                                            borderRadius: "8px",
                                            textAlign: "center",
                                            flexShrink: 0
                                        }}
                                    >
                                        <div style={{ fontSize: "0.65rem", textTransform: "uppercase", opacity: 0.8 }}>
                                            {cardType === "stamp" ? "Total Stamps" : "Tier"}
                                        </div>
                                        <div style={{ fontSize: "1rem", fontWeight: 800 }}>
                                            {cardType === "stamp" ? `${activeCard.total_stamps || 8} Stamps` : (activeCard.tier || "Gold")}
                                        </div>
                                    </div>
                                </div>

                                {cardType === "stamp" && (
                                    <div
                                        style={{
                                            marginTop: "12px",
                                            paddingTop: "10px",
                                            borderTop: "1px solid rgba(255, 255, 255, 0.15)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            fontSize: "0.78rem"
                                        }}
                                    >
                                        <span>
                                            <i className="fas fa-gift" style={{ marginRight: "6px" }}></i>
                                            Reward: <strong>{activeCard.reward || "Free Gift"}</strong>
                                        </span>
                                        <span style={{ opacity: 0.85 }}>Ready to issue</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* SECTION 4: ISSUANCE CONFIGURATION */}
                    <div
                        style={{
                            background: "#F8FAFC",
                            border: "1px solid #E2E8F0",
                            borderRadius: "14px",
                            padding: "16px 18px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px"
                        }}
                    >


                        {/* SMS / Email Notification Checkbox */}
                        <label
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                cursor: "pointer",
                                marginTop: "4px"
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={sendNotification}
                                onChange={(e) => setSendNotification(e.target.checked)}
                                style={{
                                    width: "16px",
                                    height: "16px",
                                    accentColor: "#0E88B8",
                                    cursor: "pointer"
                                }}
                            />
                            <span style={{ fontSize: "0.82rem", color: "#334155", fontWeight: 500 }}>
                                Send digital pass wallet link to customer via Whastsapp
                            </span>
                        </label>
                    </div>
                </div>

                {/* MODAL FOOTER */}
                <div
                    style={{
                        padding: "16px 24px",
                        borderTop: "1px solid #F1F5F9",
                        backgroundColor: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: "12px"
                    }}
                >


                    <div style={{ display: "flex", gap: "10px" }}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            style={{
                                padding: "10px 18px",
                                borderRadius: "10px",
                                border: "1px solid #E2E8F0",
                                backgroundColor: "#FFFFFF",
                                color: "#475569",
                                fontSize: "0.88rem",
                                fontWeight: 600,
                                cursor: isSubmitting ? "not-allowed" : "pointer",
                                transition: "all 0.2s"
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            style={{
                                padding: "10px 22px",
                                borderRadius: "10px",
                                border: "none",
                                background: "linear-gradient(135deg, #0E88B8 0%, #059669 100%)",
                                color: "#FFFFFF",
                                fontSize: "0.88rem",
                                fontWeight: 700,
                                cursor: isSubmitting ? "not-allowed" : "pointer",
                                opacity: isSubmitting ? 0.75 : 1,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                boxShadow: "0 4px 14px rgba(14, 136, 184, 0.3)",
                                transition: "all 0.2s"
                            }}
                        >
                            {isSubmitting ? (
                                <>
                                    <i className="fas fa-circle-notch fa-spin"></i>
                                    <span>Issuing Pass...</span>
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-plus-circle"></i>
                                    <span>Issue & Add Customer</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddCardCustomer;
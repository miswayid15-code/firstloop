import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams, NavLink, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import API from "../../api.js";
import qrImg from "../../assets/img/qr-img.png";
import flLogo from "../../assets/img/firstloop-favicon.png";
import StampCardItem from "../../components/StampCardItem.jsx";
import MembershipCardItem from "../../components/MembershipCardItem.jsx";

import PhoneNumberField from '../../components/PhoneNumberField.jsx'
import {
    fetchStampCardsApi,
    fetchMembershipCardsApi,
    getCardStyle,
    formatImageUrl,
    getRelativeImagePath
} from '../../services/cardService.js'



export default function AddCardCustomer() {
    const navigate = useNavigate();
    const location = useLocation();
    const { branchId: paramBranchId } = useParams();
    const [searchParams] = useSearchParams();

    const isMerchantMode = location.pathname.startsWith("/merchant") || window.location.pathname.startsWith("/merchant");
    const isReceptionistMode = location.pathname.startsWith("/receptionist") || window.location.pathname.startsWith("/receptionist");

    let receptionist = {};
    try {
        const rawReceptionist = localStorage.getItem("receptionist_data");
        if (rawReceptionist && rawReceptionist !== "null" && rawReceptionist !== "undefined") {
            receptionist = JSON.parse(rawReceptionist) || {};
        }
    } catch (e) {
        console.error("Error parsing receptionist_data:", e);
    }

    const recBranchId = receptionist?.user_branch_id || receptionist?.branch_id || "";
    const branchId = paramBranchId || searchParams.get("branchId") || (isReceptionistMode ? recBranchId : "");

    const backUrl = branchId
        ? (isMerchantMode ? `/merchant/branches/${branchId}` : (isReceptionistMode ? `/receptionist/dashboard` : `/view-fl-branch/${branchId}`))
        : (isMerchantMode ? "/merchant/customers" : (isReceptionistMode ? "/receptionist/customers" : "/customers"));

    const [branch, setBranch] = useState(null);
    const [branchLoading, setBranchLoading] = useState(false);

    // Customer Search & Form State
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || searchParams.get("email") || searchParams.get("phone") || "");
    const [searchResults, setSearchResults] = useState([]);
    const [searchPerformed, setSearchPerformed] = useState(false);
    const [selectedCustomerObj, setSelectedCustomerObj] = useState(null);

    const [email, setEmail] = useState(searchParams.get("email") || "");
    const [customerName, setCustomerName] = useState("");
    const [phone, setPhone] = useState("");
    const [customerId, setCustomerId] = useState("");
    const [countryCode, setCountryCode] = useState("+91");
    const [customerStatus, setCustomerStatus] = useState("New Customer");
    const [isSearching, setIsSearching] = useState(false);
    const [emailChecked, setEmailChecked] = useState(false);
    const [isCreatingNewCustomer, setIsCreatingNewCustomer] = useState(false);

    // Card Selection State
    const [cardType, setCardType] = useState("stamp"); // 'stamp' or 'membership'
    const [selectedCardId, setSelectedCardId] = useState("");
    const [initialStamps, setInitialStamps] = useState(1);
    const [sendNotification, setSendNotification] = useState(true);
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dynamic Lists State
    const [stampCardsList, setStampCardsList] = useState([]);
    const [membershipCardsList, setMembershipCardsList] = useState([]);

    // Fetch Branch Details if branchId is present
    useEffect(() => {
        if (!branchId) return;

        const loadBranch = async () => {
            setBranchLoading(true);
            try {
                let response = await API.post(`firstloop/merchant/branch_details/${branchId}`);


                if (!response?.data) {
                    try {
                        const fallbackRes = await API.post(`firstloop/branch_details/${branchId}`);
                        if (fallbackRes?.data && (fallbackRes.data.status === 1) && fallbackRes.data.data) {
                            response = fallbackRes;
                        }
                    } catch (e) { }
                }

                if (response?.data && (response.data.status === 1) && response.data.data) {
                    const bData = response.data.data;
                    setBranch(bData);
                    fetchStampCards(branchId, bData?.name);
                    fetchMembershipCards(branchId, bData?.name);
                } else {
                    toast.error("There is no branch");
                    setTimeout(() => {
                        navigate(backUrl || -1);
                    }, 1200);
                }
            } catch (e) {
                console.log("Branch load error:", e);
                toast.error("There is no branch");
                setTimeout(() => {
                    navigate(backUrl || -1);
                }, 1200);
            } finally {
                setBranchLoading(false);
            }
        };

        loadBranch();
    }, [branchId]);

    // Ensure default card is selected when cardType or list changes
    useEffect(() => {
        const list = cardType === "stamp" ? stampCardsList : membershipCardsList;
        if (list && list.length > 0) {
            const first = list[0];
            setSelectedCardId(first.id || first._id || "");
        } else {
            setSelectedCardId("");
        }
    }, [cardType, stampCardsList, membershipCardsList]);

    // Lookup customer logic using search
    const handleSearchCustomer = async (customQuery) => {
        const q = (typeof customQuery === "string" ? customQuery : searchQuery).trim();
        if (!q) {
            toast.error("Please enter a customer name, email, or phone number to search");
            return;
        }

        setIsSearching(true);
        setSearchPerformed(true);
        setSelectedCustomerObj(null);
        setIsCreatingNewCustomer(false);

        try {
            const response = await API.post("firstloop/customer/check-customer", { search: q });
            const resData = response?.data;
            const custList = Array.isArray(resData?.data)
                ? resData.data
                : (resData?.customer ? [resData.customer] : (resData?.data ? [resData.data] : []));

            if (resData?.status === 1 && custList.length > 0) {
                setSearchResults(custList);
                if (custList.length === 1) {
                    handleSelectCustomer(custList[0]);
                } else {
                    toast.success(`Found ${custList.length} customer${custList.length > 1 ? 's' : ''}`);
                }
            } else {
                setSearchResults([]);
                setSelectedCustomerObj(null);
                setIsCreatingNewCustomer(false);
                setCustomerName("");
                toast("No existing customer found. You can add as a new customer.", { icon: "ℹ️" });
            }
        } catch (error) {
            console.error("Error checking customer from API:", error);
            setSearchResults([]);
            setSelectedCustomerObj(null);
            setIsCreatingNewCustomer(false);
            setCustomerName("");
            toast.error("Error searching for customer");
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectCustomer = (cust) => {
        if (!cust) return;
        setSelectedCustomerObj(cust);
        setIsCreatingNewCustomer(false);
        setCustomerId(cust.id || "");
        setCustomerName(cust.name || "");
        setEmail(cust.email || "");
        setPhone(cust.phone ? String(cust.phone) : "");
        const rawCC = cust.country_code ?? cust.countryCode;
        if (rawCC != null && rawCC !== "") {
            const strCC = String(rawCC).trim();
            setCountryCode(strCC.startsWith("+") ? strCC : `+${strCC}`);
        } else {
            setCountryCode("+91");
        }
        setCustomerStatus("Existing Customer");
        setEmailChecked(true);
        toast.success(`Selected customer: ${cust.name || cust.email || cust.id}`);
    };

    const handleResetCustomer = () => {
        setSelectedCustomerObj(null);
        setIsCreatingNewCustomer(false);
        setCustomerId("");
        setCustomerName("");
        setEmail("");
        setPhone("");
        setCustomerStatus("New Customer");
        setEmailChecked(false);
        setSearchResults([]);
        setSearchPerformed(false);
    };

    const handleStartNewCustomer = () => {
        setSelectedCustomerObj(null);
        setIsCreatingNewCustomer(true);
        setCustomerId("");
        setCustomerStatus("New Customer");
        setEmailChecked(true);

        const q = searchQuery.trim();
        if (q.includes("@")) {
            setEmail(q.toLowerCase());
            setPhone("");
            setCustomerName("");
        } else if (/^\d+$/.test(q)) {
            setPhone(q);
            setEmail("");
            setCustomerName("");
        } else {
            setEmail("");
            setPhone("");
            setCustomerName("");
        }
    };

    // Auto lookup customer if search, email, or phone is passed via URL query param
    useEffect(() => {
        const querySearch = searchParams.get("search");
        const queryEmail = searchParams.get("email");
        const queryPhone = searchParams.get("phone");
        const term = querySearch || queryEmail || queryPhone;

        if (term && term.trim()) {
            const clean = term.trim();
            setSearchQuery(clean);
            handleSearchCustomer(clean);
        }
    }, [searchParams]);

    const fetchStampCards = async (targetBranchId, fallbackName) => {
        const idToUse = targetBranchId || branchId;
        if (!idToUse) return;

        try {
            const list = await fetchStampCardsApi({
                branchId: idToUse,
                fallbackBrandName: fallbackName || branch?.name || 'FirstLoop Branch'
            });
            if (list && list.length > 0) {
                setStampCardsList(list);
            }
        } catch (err) {
            console.error('Error fetching stamp cards:', err);
        }
    };

    const fetchMembershipCards = async (targetBranchId, fallbackName) => {
        const idToUse = targetBranchId || branchId;
        if (!idToUse) return;

        try {
            const list = await fetchMembershipCardsApi({
                branchId: idToUse,
                fallbackBrandName: fallbackName || branch?.name || 'FirstLoop Branch'
            });
            if (list && list.length > 0) {
                setMembershipCardsList(list);
            }
        } catch (err) {
            console.error('Error fetching membership cards:', err);
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

    // Find currently selected card object
    const currentCardList = cardType === "stamp" ? stampCardsList : membershipCardsList;
    const activeCard = currentCardList.find(
        (c) => String(c.id || c._id) === String(selectedCardId)
    ) || (currentCardList.length > 0 ? currentCardList[0] : null);

    const handleSubmit = async (e) => {
        e?.preventDefault();

        if (!selectedCustomerObj && !isCreatingNewCustomer) {
            toast.error("Please lookup an existing customer or click 'Add New Customer'");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const cleanEmail = email.trim();

        if (!cleanEmail) {
            toast.error("Customer email is required");
            return;
        }
        if (!emailRegex.test(cleanEmail)) {
            toast.error("Please enter a valid email address");
            return;
        }
        if (!customerName.trim()) {
            toast.error("Customer name is required");
            return;
        }
        if (!phone.trim()) {
            toast.error("Customer phone number is required");
            return;
        }
        if (!selectedCardId) {
            toast.error("Please select a loyalty card to issue");
            return;
        }

        const normalizedCountryCode = countryCode.startsWith("+") ? countryCode : `+${countryCode}`;
        const branchNum = Number(branch?.id || branchId);
        const cardIdNum = Number(selectedCardId) || selectedCardId;

        const payload = {
            cardType,
            cus_id: customerId ? Number(customerId) || customerId : "",
            br_id: branchNum || branchId || "main",
            cardId: cardIdNum,
            name: customerName.trim(),
            email: cleanEmail,
            phone: phone.trim(),
            country_code: normalizedCountryCode
        };

        setIsSubmitting(true);
        try {
            const response = await API.post("firstloop/customer/link-customer", payload);
            const resStatus = response?.data?.status;
            const resMsg = response?.data?.message || response?.data?.msg || "";
            const resData = response?.data?.data;

            if (resStatus === 1 || resStatus === "1" || response?.data?.success) {
                toast.success(resMsg || `🎉 Successfully assigned card to ${customerName}!`, {
                    duration: 4500
                });
                console.log("Link Customer Response Data:", resData);

                const targetCardId = resData?.customer_card_id;
                const typeNum = resData?.card_type || (cardType === "membership" ? 2 : 1);
                const targetCusId = resData?.customer_id || customerId || (payload.cus_id || 1);

                // Broadcast to sync with other open tabs (e.g. ReceptionistCustomerList)
                try {
                    const syncData = {
                        timestamp: Date.now(),
                        customerId: targetCusId,
                        customerCardId: targetCardId,
                        name: customerName.trim(),
                        email: cleanEmail,
                        phone: phone.trim(),
                        branchId: branchNum || branchId
                    };
                    localStorage.setItem("dealora_customer_added", JSON.stringify(syncData));
                } catch (syncErr) {
                    console.error("Sync storage error:", syncErr);
                }

                if (isReceptionistMode) {
                    const params = new URLSearchParams();
                    params.set("autoCheckIn", "true");
                    if (cleanEmail) params.set("email", cleanEmail);
                    if (phone.trim()) params.set("phone", phone.trim());
                    if (targetCusId) params.set("customerId", String(targetCusId));
                    navigate(`/receptionist/customers?${params.toString()}`);
                } else if (targetCardId) {
                    navigate(`/card-preview/${targetCardId}?type=${typeNum}&cus_id=${targetCusId}`);
                } else {
                    navigate(`/view-fl-branch/${branchId}`);
                }
            } else if (resData && (resStatus === 0 || resStatus === "0")) {
                toast(resMsg || "Customer already has this card", {
                    icon: "ℹ️",
                    duration: 4000
                });

                const targetCardId = resData?.id;
                const typeNum = resData?.card_type || (cardType === "membership" ? 2 : 1);
                const targetCusId = resData?.customer_id || customerId || (payload.cus_id || 1);

                if (isReceptionistMode) {
                    const params = new URLSearchParams();
                    params.set("autoCheckIn", "true");
                    if (cleanEmail) params.set("email", cleanEmail);
                    if (phone.trim()) params.set("phone", phone.trim());
                    if (targetCusId) params.set("customerId", String(targetCusId));
                    navigate(`/receptionist/customers?${params.toString()}`);
                } else if (targetCardId) {
                    navigate(`/card-preview/${targetCardId}?type=${typeNum}&cus_id=${targetCusId}`);
                }
            } else {
                toast.error(resMsg || "Failed to link card to customer");
            }
        } catch (error) {
            console.error("Error linking customer card:", error);
            const errMsg = error?.response?.data?.message || error?.response?.data?.msg || error?.message || "Failed to link customer card";
            toast.error(errMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ paddingBottom: 60 }}>
            {/* TOP HEADER & BREADCRUMBS */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.84rem", color: "var(--text-muted)", fontWeight: 500, marginBottom: 8 }}>
                    {isMerchantMode ? (
                        <>
                            <NavLink to="/merchant/branches" style={{ color: "var(--firstloop-primary, #0E88B8)", textDecoration: "none" }}>
                                Branches
                            </NavLink>
                            {branchId && (
                                <>
                                    <i className="fas fa-chevron-right" style={{ fontSize: "0.7rem" }} />
                                    <NavLink to={`/merchant/branches/${branchId}`} style={{ color: "var(--firstloop-primary, #0E88B8)", textDecoration: "none" }}>
                                        {branch?.name || "Branch"}
                                    </NavLink>
                                </>
                            )}
                        </>
                    ) : isReceptionistMode ? (
                        <>
                            <NavLink to="/receptionist/dashboard" style={{ color: "var(--firstloop-primary, #0E88B8)", textDecoration: "none" }}>
                                Dashboard
                            </NavLink>
                        </>
                    ) : (
                        <>
                            <NavLink to="/merchants" style={{ color: "var(--firstloop-primary, #0E88B8)", textDecoration: "none" }}>
                                Merchants
                            </NavLink>
                            {branchId && (
                                <>
                                    <i className="fas fa-chevron-right" style={{ fontSize: "0.7rem" }} />
                                    <NavLink to={`/view-fl-branch/${branchId}`} style={{ color: "var(--firstloop-primary, #0E88B8)", textDecoration: "none" }}>
                                        {branch?.name || "Branch"}
                                    </NavLink>
                                </>
                            )}
                        </>
                    )}
                    <i className="fas fa-chevron-right" style={{ fontSize: "0.7rem" }} />
                    <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Issue Card to Customer</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                                Issue & Add Card to Customer
                            </h2>
                            <span
                                style={{
                                    backgroundColor: "#E0F2FE",
                                    color: "#0369A1",
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    padding: "3px 10px",
                                    borderRadius: "999px",
                                    textTransform: "uppercase"
                                }}
                            >
                                Pass Issuer
                            </span>
                        </div>
                        <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginTop: 6, marginBottom: 0 }}>
                            Search customer or register new profile to issue Stamp Loyalty Cards & VIP Membership Passes.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="btn firstloop-btn-secondary"
                        onClick={() => navigate(backUrl)}
                        style={{
                            padding: "9px 18px",
                            borderRadius: 10,
                            fontSize: "0.86rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #CBD5E1",
                            color: "#334155",
                            fontWeight: 600,
                            cursor: "pointer"
                        }}
                    >
                        <i className="fas fa-arrow-left" />
                        Back
                    </button>
                </div>
            </div>

            <style>{`
                .add-card-page-grid {
                    display: grid;
                    grid-template-columns: 1.5fr 1fr;
                    gap: 24px;
                    align-items: start;
                }
                .add-card-page-preview-col {
                    position: sticky;
                    top: 20px;
                }
                .add-card-page-search-wrap {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                .add-card-page-search-btns {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }

                @media (max-width: 992px) {
                    .add-card-page-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .add-card-page-preview-col {
                        position: static !important;
                        margin-top: 16px;
                    }
                }

                @media (max-width: 640px) {
                    .add-card-page-search-wrap {
                        flex-direction: column !important;
                        align-items: stretch !important;
                    }
                    .add-card-page-search-wrap > div:first-child {
                        min-width: 100% !important;
                        width: 100% !important;
                    }
                    .add-card-page-search-btns {
                        width: 100% !important;
                        display: flex !important;
                    }
                    .add-card-page-search-btns button {
                        flex: 1 !important;
                        justify-content: center !important;
                        padding: 0 10px !important;
                        font-size: 0.82rem !important;
                    }
                }
            `}</style>

            {/* MAIN 2-COLUMN GRID (FORM ON LEFT, LIVE PREVIEW ON RIGHT) */}
            <div className="add-card-page-grid">

                {/* LEFT COLUMN: STEP-BY-STEP FORM */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                    {/* CARD 1: CUSTOMER LOOKUP & PROFILE */}
                    <div className="card" style={{ padding: 22, borderRadius: 16, backgroundColor: "#FFFFFF", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #E2E8F0" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 10,
                                        backgroundColor: (selectedCustomerObj || isCreatingNewCustomer) ? "#DCFCE7" : "#EFF6FF",
                                        color: (selectedCustomerObj || isCreatingNewCustomer) ? "#10B981" : "#0E88B8",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "1rem",
                                        transition: "all 0.2s ease"
                                    }}
                                >
                                    <i className="fas fa-user-circle"></i>
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#1E293B" }}>
                                        Step 1: Customer Profile
                                    </h3>
                                    <span style={{ fontSize: "0.78rem", color: "#64748B" }}>
                                        Search customer by name, email, or phone to find existing profile or register a new one
                                    </span>
                                </div>
                            </div>

                            {selectedCustomerObj ? (
                                <span
                                    style={{
                                        fontSize: "0.75rem",
                                        fontWeight: 700,
                                        padding: "3px 10px",
                                        borderRadius: 6,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 5,
                                        backgroundColor: "#DCFCE7",
                                        color: "#15803D"
                                    }}
                                >
                                    Existing Customer (#{selectedCustomerObj.id})
                                </span>
                            ) : isCreatingNewCustomer ? (
                                <span
                                    style={{
                                        fontSize: "0.75rem",
                                        fontWeight: 700,
                                        padding: "3px 10px",
                                        borderRadius: 6,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 5,
                                        backgroundColor: "#E0F2FE",
                                        color: "#0369A1"
                                    }}
                                >
                                    <i className="fas fa-user-plus"></i>
                                    New Customer Profile
                                </span>
                            ) : null}
                        </div>

                        {/* Customer Search / Lookup & Add New Customer Bar */}
                        {!selectedCustomerObj && (
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                                    Search / Lookup Customer
                                </label>
                                <div className="add-card-page-search-wrap">
                                    <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
                                        <i
                                            className="fas fa-search"
                                            style={{
                                                position: "absolute",
                                                left: 14,
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                color: "#94A3B8",
                                                fontSize: "0.88rem"
                                            }}
                                        />
                                        <input
                                            type="text"
                                            name="customer-search"
                                            id="customer-search-input"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    handleSearchCustomer();
                                                }
                                            }}
                                            placeholder="Search by name, email, or phone (e.g. 9876543210, john@example.com)..."
                                            style={{
                                                width: "100%",
                                                padding: "11px 14px 11px 40px",
                                                borderRadius: 10,
                                                border: "1px solid #CBD5E1",
                                                backgroundColor: "#FFFFFF",
                                                fontSize: "0.9rem",
                                                color: "#1E293B",
                                                outline: "none",
                                                boxSizing: "border-box"
                                            }}
                                        />
                                    </div>
                                    <div className="add-card-page-search-btns">
                                        <button
                                            type="button"
                                            onClick={() => handleSearchCustomer()}
                                            disabled={isSearching || !searchQuery.trim()}
                                            style={{
                                                padding: "0 20px",
                                                height: 44,
                                                borderRadius: 10,
                                                border: "none",
                                                background: "linear-gradient(135deg, #0E88B8 0%, #0284C7 100%)",
                                                color: "#FFFFFF",
                                                fontSize: "0.88rem",
                                                fontWeight: 700,
                                                cursor: isSearching || !searchQuery.trim() ? "not-allowed" : "pointer",
                                                opacity: isSearching || !searchQuery.trim() ? 0.65 : 1,
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: 8,
                                                flexShrink: 0
                                            }}
                                        >
                                            {isSearching ? (
                                                <>
                                                    <i className="fas fa-circle-notch fa-spin"></i>
                                                    <span>Searching...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-search"></i>
                                                    <span>Lookup</span>
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleStartNewCustomer}
                                            title="Register a new customer profile"
                                            style={{
                                                padding: "0 18px",
                                                height: 44,
                                                borderRadius: 10,
                                                border: isCreatingNewCustomer ? "2px solid #0E88B8" : "1px solid #CBD5E1",
                                                backgroundColor: isCreatingNewCustomer ? "rgba(14, 136, 184, 0.08)" : "#F8FAFC",
                                                color: "#0E88B8",
                                                fontSize: "0.86rem",
                                                fontWeight: 700,
                                                cursor: "pointer",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: 6,
                                                flexShrink: 0
                                            }}
                                        >
                                            <i className="fas fa-user-plus"></i>
                                            <span>Add New Customer</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SELECTABLE LIST OF MULTIPLE MATCHING CUSTOMERS */}
                        {!selectedCustomerObj && !isCreatingNewCustomer && searchPerformed && searchResults.length > 1 && (
                            <div style={{ marginBottom: 18, border: "1.5px solid #BAE6FD", borderRadius: 12, backgroundColor: "#F0F9FF", padding: 14 }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0369A1", display: "flex", alignItems: "center", gap: 6 }}>
                                        <i className="fas fa-users"></i>
                                        Found {searchResults.length} Matching Customers:
                                    </span>
                                    <span style={{ fontSize: "0.74rem", color: "#0284C7" }}>
                                        Click a customer below to select
                                    </span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 250, overflowY: "auto" }}>
                                    {searchResults.map((cust) => (
                                        <div
                                            key={cust.id}
                                            onClick={() => handleSelectCustomer(cust)}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                padding: "10px 14px",
                                                backgroundColor: "#FFFFFF",
                                                borderRadius: 10,
                                                border: "1px solid #E0F2FE",
                                                cursor: "pointer",
                                                transition: "all 0.15s ease",
                                                boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = "#0E88B8";
                                                e.currentTarget.style.backgroundColor = "#F8FAFC";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = "#E0F2FE";
                                                e.currentTarget.style.backgroundColor = "#FFFFFF";
                                            }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <div style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: "50%",
                                                    backgroundColor: "#E0F2FE",
                                                    color: "#0369A1",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontWeight: 800,
                                                    fontSize: "0.88rem"
                                                }}>
                                                    {(cust.name || cust.email || "C").charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                        <strong style={{ fontSize: "0.88rem", color: "#0F172A" }}>
                                                            {cust.name || "Customer"}
                                                        </strong>
                                                        <span style={{ fontSize: "0.7rem", backgroundColor: "#F1F5F9", color: "#475569", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                                                            ID #{cust.id}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 3, fontSize: "0.78rem", color: "#64748B" }}>
                                                        {cust.email && (
                                                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                                                <i className="fas fa-envelope" style={{ fontSize: "0.7rem" }} />
                                                                {cust.email}
                                                            </span>
                                                        )}
                                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                                            <i className="fas fa-phone-alt" style={{ fontSize: "0.7rem" }} />
                                                            {cust.phone ? `${cust.country_code ? `+${cust.country_code} ` : ''}${cust.phone}` : <em style={{ color: "#94A3B8" }}>No phone</em>}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-sm"
                                                style={{
                                                    backgroundColor: "#0E88B8",
                                                    color: "#FFFFFF",
                                                    borderRadius: 8,
                                                    padding: "5px 12px",
                                                    fontSize: "0.78rem",
                                                    fontWeight: 700,
                                                    border: "none",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 5
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectCustomer(cust);
                                                }}
                                            >
                                                <span>Select</span>
                                                <i className="fas fa-arrow-right" style={{ fontSize: "0.7rem" }} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* NO CUSTOMERS FOUND STATE */}
                        {!selectedCustomerObj && !isCreatingNewCustomer && searchPerformed && searchResults.length === 0 && (
                            <div style={{ marginBottom: 18, border: "1px dashed #CBD5E1", borderRadius: 12, backgroundColor: "#F8FAFC", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#F1F5F9", color: "#64748B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
                                        <i className="fas fa-user-slash" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#334155" }}>
                                            No existing customer found for "{searchQuery}"
                                        </div>
                                        <div style={{ fontSize: "0.78rem", color: "#64748B", marginTop: 2 }}>
                                            Click the button on the right to register as a new customer profile.
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleStartNewCustomer}
                                    style={{
                                        backgroundColor: "#0E88B8",
                                        color: "#FFFFFF",
                                        borderRadius: 8,
                                        padding: "8px 16px",
                                        fontSize: "0.82rem",
                                        fontWeight: 700,
                                        border: "none",
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 6,
                                        boxShadow: "0 2px 8px rgba(14, 136, 184, 0.25)"
                                    }}
                                >
                                    <i className="fas fa-user-plus" />
                                    <span>Add New Customer</span>
                                </button>
                            </div>
                        )}

                        {/* SELECTED CUSTOMER PROFILE BANNER (SHOWN WHEN CUSTOMER EXISTS) */}
                        {selectedCustomerObj && (
                            <div style={{ marginBottom: 18, border: "1.5px solid #86EFAC", borderRadius: 14, backgroundColor: "#F0FDF4", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                    <div style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: "50%",
                                        backgroundColor: "#DCFCE7",
                                        color: "#15803D",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "1.2rem",
                                        fontWeight: 800
                                    }}>
                                        {(selectedCustomerObj.name || selectedCustomerObj.email || "C").charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                            <strong style={{ fontSize: "1rem", color: "#14532D" }}>
                                                {selectedCustomerObj.name || "Customer"}
                                            </strong>
                                            {selectedCustomerObj.id && (
                                                <span style={{ fontSize: "0.72rem", backgroundColor: "#DCFCE7", color: "#15803D", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>
                                                    ID #{selectedCustomerObj.id}
                                                </span>
                                            )}
                                            <span style={{ fontSize: "0.72rem", backgroundColor: "#BBF7D0", color: "#166534", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>
                                                Existing Customer
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 4, fontSize: "0.82rem", color: "#166534", flexWrap: "wrap" }}>
                                            {selectedCustomerObj.email && (
                                                <span><i className="fas fa-envelope" style={{ marginRight: 6 }} />{selectedCustomerObj.email}</span>
                                            )}
                                            <span><i className="fas fa-phone-alt" style={{ marginRight: 6 }} />{selectedCustomerObj.phone ? `${selectedCustomerObj.country_code ? `+${String(selectedCustomerObj.country_code).replace('+', '')} ` : ''}${selectedCustomerObj.phone}` : 'No phone'}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleResetCustomer}
                                    style={{
                                        backgroundColor: "#FFFFFF",
                                        color: "#374151",
                                        border: "1px solid #CBD5E1",
                                        borderRadius: 10,
                                        padding: "8px 16px",
                                        fontSize: "0.82rem",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 6
                                    }}
                                >
                                    <i className="fas fa-exchange-alt" />
                                    <span>Change Customer</span>
                                </button>
                            </div>
                        )}

                        {/* NEW CUSTOMER CREATION FORM (ONLY SHOWN AFTER CLICKING 'ADD NEW CUSTOMER') */}
                        {isCreatingNewCustomer && !selectedCustomerObj && (
                            <div style={{
                                border: "1.5px solid #BAE6FD",
                                borderRadius: 14,
                                backgroundColor: "#F0F9FF",
                                padding: "18px 20px",
                                marginBottom: 18
                            }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, borderBottom: "1px solid #E0F2FE", paddingBottom: 10 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <div style={{ width: 30, height: 30, borderRadius: 8, background: "#0284C7", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem" }}>
                                            <i className="fas fa-user-plus" />
                                        </div>
                                        <div>
                                            <strong style={{ fontSize: "0.92rem", color: "#0369A1", display: "block" }}>
                                                New Customer Registration
                                            </strong>
                                            <small style={{ color: "#64748B", fontSize: "0.75rem" }}>
                                                Enter customer information to register profile and issue card
                                            </small>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleResetCustomer}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: "#64748B",
                                            fontSize: "0.78rem",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 4
                                        }}
                                    >
                                        <i className="fas fa-arrow-left" />
                                        <span>Back to Search</span>
                                    </button>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                                            Customer Full Name <span style={{ color: "#EF4444" }}>*</span>
                                        </label>
                                        <div style={{ position: "relative" }}>
                                            <i
                                                className="fas fa-user"
                                                style={{
                                                    position: "absolute",
                                                    left: 14,
                                                    top: "50%",
                                                    transform: "translateY(-50%)",
                                                    color: "#0E88B8",
                                                    fontSize: "0.85rem"
                                                }}
                                            />
                                            <input
                                                type="text"
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                placeholder="e.g. John Doe"
                                                style={{
                                                    width: "100%",
                                                    padding: "10px 14px 10px 38px",
                                                    borderRadius: 10,
                                                    border: "1px solid #CBD5E1",
                                                    backgroundColor: "#FFFFFF",
                                                    color: "#1E293B",
                                                    fontSize: "0.88rem",
                                                    outline: "none",
                                                    boxSizing: "border-box"
                                                }}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <PhoneNumberField
                                            value={phone}
                                            countryCode={countryCode}
                                            required={true}
                                            onChange={(value, newCountryCode) => {
                                                setPhone(value || '');
                                                if (newCountryCode) setCountryCode(newCountryCode);
                                            }}
                                        />
                                    </div>

                                    <div style={{ gridColumn: "1 / -1" }}>
                                        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                                            Customer Email Address <span style={{ color: "#EF4444" }}>*</span>
                                        </label>
                                        <div style={{ position: "relative" }}>
                                            <i
                                                className="fas fa-envelope"
                                                style={{
                                                    position: "absolute",
                                                    left: 14,
                                                    top: "50%",
                                                    transform: "translateY(-50%)",
                                                    color: "#0E88B8",
                                                    fontSize: "0.88rem"
                                                }}
                                            />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value.replace(/\s+/g, ''))}
                                                placeholder="e.g. john@example.com"
                                                style={{
                                                    width: "100%",
                                                    padding: "10px 14px 10px 38px",
                                                    borderRadius: 10,
                                                    border: "1px solid #CBD5E1",
                                                    backgroundColor: "#FFFFFF",
                                                    color: "#1E293B",
                                                    fontSize: "0.88rem",
                                                    outline: "none",
                                                    boxSizing: "border-box"
                                                }}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                                       {/* CARD 2: CHOOSE CARD TYPE */}
                    <div className="card" style={{ padding: 22, borderRadius: 16, backgroundColor: "#FFFFFF", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #E2E8F0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    backgroundColor: cardType ? "#DCFCE7" : "#EFF6FF",
                                    color: cardType ? "#10B981" : "#0E88B8",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "1rem",
                                    transition: "all 0.2s ease"
                                }}
                            >
                                <i className="fas fa-layer-group"></i>
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#1E293B" }}>
                                    Step 2: Choose Card Type
                                </h3>
                                <span style={{ fontSize: "0.78rem", color: "#64748B" }}>
                                    Select between a visit-based Stamp Pass or a tiered VIP Membership Pass
                                </span>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                            {/* Stamp Card Option */}
                            <button
                                type="button"
                                onClick={() => {
                                    setCardType("stamp");
                                    fetchStampCards();
                                }}
                                style={{
                                    padding: "18px 20px",
                                    borderRadius: 14,
                                    border: cardType === "stamp" ? "2px solid #10B981" : "1.5px solid #E2E8F0",
                                    backgroundColor: cardType === "stamp" ? "#F0FDF4" : "#FFFFFF",
                                    textAlign: "left",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 14,
                                    transition: "all 0.2s",
                                    boxShadow: cardType === "stamp" ? "0 6px 16px rgba(16, 185, 129, 0.15)" : "none"
                                }}
                            >
                                <div
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 12,
                                        backgroundColor: cardType === "stamp" ? "#10B981" : "#F1F5F9",
                                        color: cardType === "stamp" ? "#FFFFFF" : "#64748B",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "1.2rem",
                                        flexShrink: 0
                                    }}
                                >
                                    <i className="fas fa-stamp"></i>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <span style={{ fontWeight: 800, fontSize: "0.98rem", color: cardType === "stamp" ? "#065F46" : "#0F172A" }}>
                                            Stamp Card
                                        </span>
                                    </div>
                                    <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#64748B", lineHeight: 1.4 }}>
                                        Digital punch loyalty card with reward milestones per purchase or check-in.
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* CARD 3: SELECT SPECIFIC CARD TEMPLATE */}
                    <div className="card" style={{ padding: 22, borderRadius: 16, backgroundColor: "#FFFFFF", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #E2E8F0" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 10,
                                        backgroundColor: selectedCardId ? "#DCFCE7" : "#EFF6FF",
                                        color: selectedCardId ? "#10B981" : "#0E88B8",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "1rem",
                                        transition: "all 0.2s ease"
                                    }}
                                >
                                    <i className="fas fa-id-card"></i>
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#1E293B" }}>
                                        Step 3: Select {cardType === "stamp" ? "Stamp Card" : "Membership Card"}
                                    </h3>
                                    <span style={{ fontSize: "0.78rem", color: "#64748B" }}>
                                        Pick from available templates configured for this branch
                                    </span>
                                </div>
                            </div>
                            <span style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: 600 }}>
                                {currentCardList.length} card(s) available
                            </span>
                        </div>

                        {/* Quick Card Selection Tiles or Empty State */}
                        {currentCardList.length === 0 ? (
                            <div
                                style={{
                                    padding: "26px 20px",
                                    textAlign: "center",
                                    backgroundColor: "#F8FAFC",
                                    borderRadius: 12,
                                    border: "1.5px dashed #CBD5E1"
                                }}
                            >
                                <div
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: "50%",
                                        backgroundColor: "#EFF6FF",
                                        color: "#0E88B8",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "1.2rem",
                                        marginBottom: 10
                                    }}
                                >
                                    <i className="fas fa-id-card"></i>
                                </div>
                                <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#334155" }}>
                                    No {cardType === "stamp" ? "Stamp Cards" : "Membership Cards"} Available
                                </div>
                                <p style={{ fontSize: "0.8rem", color: "#64748B", margin: "4px auto 0", maxWidth: 320, lineHeight: 1.4 }}>
                                    No active {cardType === "stamp" ? "stamp card" : "membership card"} designs configured for this branch.
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                                {currentCardList.map((card) => {
                                    const cId = card.id || card._id;
                                    const isSelected = String(cId) === String(selectedCardId);
                                    return (
                                        <div
                                            key={cId}
                                            onClick={() => setSelectedCardId(cId)}
                                            style={{
                                                padding: "12px 14px",
                                                borderRadius: 12,
                                                border: isSelected ? "2px solid #10B981" : "1px solid #E2E8F0",
                                                backgroundColor: isSelected ? "#F0FDF4" : "#F8FAFC",
                                                cursor: "pointer",
                                                transition: "all 0.15s",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                gap: 10
                                            }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                                                <div
                                                    style={{
                                                        width: 32,
                                                        height: 32,
                                                        borderRadius: 8,
                                                        backgroundColor: isSelected ? "#10B981" : "#E2E8F0",
                                                        color: isSelected ? "#FFFFFF" : "#64748B",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontSize: "0.9rem",
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    <i className={cardType === "stamp" ? "fas fa-stamp" : "fas fa-crown"}></i>
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontWeight: 700, fontSize: "0.85rem", color: isSelected ? "#065F46" : "#1E293B", wordBreak: "break-word", lineHeight: 1.35 }}>
                                                        {card.title || card.name}
                                                    </div>
                                                    <div style={{ fontSize: "0.74rem", color: "#64748B", marginTop: 2, wordBreak: "break-word", lineHeight: 1.35 }}>
                                                        {cardType === "stamp" ? `${card.total_stamps || 8} Stamps${card.reward || card.reward_text ? ` • ${card.reward || card.reward_text}` : ''}${card.free_text ? ` • Free: ${card.free_text}` : ''}` : (card.tier || "VIP Tier")}
                                                    </div>
                                                </div>
                                            </div>
                                            <div
                                                style={{
                                                    width: 18,
                                                    height: 18,
                                                    borderRadius: "50%",
                                                    border: isSelected ? "5px solid #10B981" : "2px solid #CBD5E1",
                                                    backgroundColor: "#FFFFFF",
                                                    flexShrink: 0,
                                                    transition: "all 0.15s"
                                                }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>           </div>

                </div>

                {/* RIGHT COLUMN: STICKY LIVE DIGITAL WALLET PASS PREVIEW & ACTIONS */}
                <div className="add-card-page-preview-col">
                    <div style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "#1E293B", display: "flex", alignItems: "center", gap: 8 }}>
                            <i className="fas fa-mobile-alt" style={{ color: "#0E88B8" }}></i>
                            Live Digital Pass Preview
                        </h4>
                        <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>
                            {cardType === "stamp" ? "Stamp Card" : "Membership Card"}
                        </span>
                    </div>

                    {/* CARD ITEM PREVIEW COMPONENT OR EMPTY STATE */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
                        {activeCard && (activeCard.id || activeCard._id || activeCard.title || activeCard.name) ? (
                            cardType === 'stamp' ? (
                                <StampCardItem
                                    card={{
                                        ...activeCard,
                                        brandName: branch?.name || activeCard.brandName || 'FirstLoop Branch',
                                        brandLogo: branch?.brand_image || branch?.logo || activeCard.brandLogo
                                    }}
                                    merchantName={branch?.name || 'FirstLoop Branch'}
                                />
                            ) : (
                                <MembershipCardItem
                                    card={{
                                        ...activeCard,
                                        brandName: branch?.name || activeCard.brandName || 'FirstLoop Branch',
                                        brandLogo: branch?.brand_image || branch?.logo || activeCard.brandLogo,
                                        cardholderName: customerName || 'Member Pass'
                                    }}
                                    merchantName={branch?.name || 'FirstLoop Branch'}
                                />
                            )
                        ) : (
                            <div
                                style={{
                                    width: '100%',
                                    maxWidth: 380,
                                    borderRadius: 20,
                                    backgroundColor: "#FFFFFF",
                                    border: "2px dashed #CBD5E1",
                                    padding: "36px 20px",
                                    textAlign: "center",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    minHeight: 220,
                                    boxSizing: "border-box",
                                    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.02)"
                                }}
                            >
                                <div
                                    style={{
                                        width: 52,
                                        height: 52,
                                        borderRadius: "50%",
                                        backgroundColor: "#F1F5F9",
                                        color: "#64748B",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "1.4rem",
                                        marginBottom: 12
                                    }}
                                >
                                    <i className="fas fa-id-card-clip"></i>
                                </div>
                                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#1E293B", marginBottom: 4 }}>
                                    No Card Available
                                </div>
                                <p style={{ fontSize: "0.82rem", color: "#64748B", margin: 0, maxWidth: 260, lineHeight: 1.4 }}>
                                    No active {cardType === "stamp" ? "stamp card" : "membership card"} available for this branch.
                                </p>
                            </div>
                        )}

                        {/* Customer Assignment Summary Box */}
                        <div
                            style={{
                                backgroundColor: "#FFFFFF",
                                border: "1px solid #E2E8F0",
                                borderRadius: 16,
                                padding: "16px 18px",
                                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.04)",
                                maxWidth: 380,
                                width: "100%"
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                <span style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "#64748B", fontWeight: 700 }}>
                                    Assigned Pass Holder
                                </span>
                                <span
                                    style={{
                                        fontSize: "0.72rem",
                                        fontWeight: 700,
                                        padding: "2px 8px",
                                        borderRadius: 999,
                                        backgroundColor: customerStatus === "Existing Customer" ? "#DCFCE7" : "#E0E7FF",
                                        color: customerStatus === "Existing Customer" ? "#15803D" : "#4338CA"
                                    }}
                                >
                                    {customerStatus}
                                </span>
                            </div>
                            <div style={{ fontSize: "0.98rem", fontWeight: 800, color: "#1E293B" }}>
                                {customerName || "Customer Name"}
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "#64748B", marginTop: 2 }}>
                                {email || "customer@example.com"} • {phone ? `${countryCode ? countryCode + ' ' : ''}${phone}` : "+1 (555) 000-0000"}
                            </div>
                        </div>

                        {/* RIGHT SIDE ACTION & ISSUANCE CARD */}
                        <div
                            className="card"
                            style={{
                                padding: 18,
                                borderRadius: 16,
                                backgroundColor: "#FFFFFF",
                                boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                                border: "1px solid #E2E8F0",
                                maxWidth: 380,
                                width: "100%"
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                                <button
                                    type="button"
                                    onClick={() => navigate(backUrl)}
                                    disabled={isSubmitting}
                                    style={{
                                        padding: "10px 18px",
                                        borderRadius: 10,
                                        border: "1px solid #CBD5E1",
                                        backgroundColor: "#FFFFFF",
                                        color: "#475569",
                                        fontSize: "0.88rem",
                                        fontWeight: 600,
                                        cursor: "pointer"
                                    }}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !activeCard || currentCardList.length === 0}
                                    style={{
                                        flex: 1,
                                        padding: "10px 18px",
                                        borderRadius: 10,
                                        border: "none",
                                        background: (!activeCard || currentCardList.length === 0)
                                            ? "#94A3B8"
                                            : "linear-gradient(135deg, #0E88B8 0%, #059669 100%)",
                                        color: "#FFFFFF",
                                        fontSize: "0.88rem",
                                        fontWeight: 700,
                                        cursor: (isSubmitting || !activeCard || currentCardList.length === 0) ? "not-allowed" : "pointer",
                                        opacity: isSubmitting ? 0.75 : 1,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 8,
                                        boxShadow: (!activeCard || currentCardList.length === 0) ? "none" : "0 6px 18px rgba(14, 136, 184, 0.35)"
                                    }}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <i className="fas fa-circle-notch fa-spin"></i>
                                            <span>Issuing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-id-card-clip"></i>
                                            <span>Issue & Add Customer</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

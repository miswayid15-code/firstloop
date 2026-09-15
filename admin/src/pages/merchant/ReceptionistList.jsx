import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import API from "../../api.js";

// Helper to safely retrieve merchant data from localStorage
const getStoredMerchant = () => {
    try {
        const raw = localStorage.getItem("merchant_data") || localStorage.getItem("mer_data");
        if (raw && raw !== "null" && raw !== "undefined") {
            const parsed = JSON.parse(raw);
            return parsed?.merchant_data || parsed?.data || parsed?.user || parsed || {};
        }
    } catch (e) {
        console.error("Error parsing merchant_data in ReceptionistList:", e);
    }
    return {};
};

export default function ReceptionistList() {
    const navigate = useNavigate();

    const [receptionists, setReceptionists] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'assigned' | 'unassigned'

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Modal state
    const [selectedReceptionistModal, setSelectedReceptionistModal] = useState(null);

    /* ---------------------------------------------------
       Fetch Receptionists & Branches
    --------------------------------------------------- */
    const fetchReceptionistsData = async () => {
        try {
            setLoading(true);
            const merchant = getStoredMerchant();
            const merchantId =
                merchant?.id ||
                merchant?.merchant_id ||
                merchant?.user_id ||
                merchant?.merchant_data?.id ||
                localStorage.getItem("mer_user_id");

            const payload = {};
            if (merchantId) {
                payload.merchant_id = merchantId;
            }

            // Fetch receptionists and branches in parallel for fast loading
            const [recResponse, branchResponse] = await Promise.allSettled([
                API.post("admin/receptionist/list", payload),
                API.post("firstloop/merchant/branch-list")
            ]);

            // Handle Receptionists response
            if (recResponse.status === "fulfilled" && recResponse.value?.data) {
                const resData = recResponse.value.data;
                if (resData.status === 1 || resData.success || Array.isArray(resData.data)) {
                    const list = Array.isArray(resData.data) ? resData.data : [];
                    setReceptionists(list);
                } else {
                    setReceptionists([]);
                    toast.error(resData.message || "No receptionists found");
                }
            } else {
                setReceptionists([]);
                toast.error("Failed to load receptionists list");
            }

            // Handle Branches response to map branch names
            if (branchResponse.status === "fulfilled" && branchResponse.value?.data) {
                const bData = branchResponse.value.data;
                if (bData?.status === 1 && Array.isArray(bData.data)) {
                    setBranches(bData.data);
                }
            }
        } catch (error) {
            console.error("Receptionist Fetch Error:", error.response?.data || error);
            setReceptionists([]);
            toast.error(
                error.response?.data?.message ||
                "Something went wrong while fetching receptionists"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReceptionistsData();
    }, []);

    // Reset pagination to first page when search or status filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter]);

    /* ---------------------------------------------------
       Branch Lookup Helper
    --------------------------------------------------- */
    const branchMap = useMemo(() => {
        const map = {};
        if (Array.isArray(branches)) {
            branches.forEach((b) => {
                const id = b.id || b._id;
                if (id) {
                    map[String(id)] = b;
                }
            });
        }
        return map;
    }, [branches]);

    const getBranchDetails = (branchId) => {
        if (!branchId) return null;
        return branchMap[String(branchId)] || null;
    };

    /* ---------------------------------------------------
       Stats Computation
    --------------------------------------------------- */
    const stats = useMemo(() => {
        if (!Array.isArray(receptionists)) {
            return { total: 0, assigned: 0, unassigned: 0 };
        }

        const total = receptionists.length;
        let assigned = 0;

        receptionists.forEach((r) => {
            const isBranch = Number(r?.is_branch) === 1 || Boolean(r?.branch_id);
            if (isBranch) {
                assigned++;
            }
        });

        return {
            total,
            assigned,
            unassigned: total - assigned
        };
    }, [receptionists]);

    /* ---------------------------------------------------
       Search & Status Filtering
    --------------------------------------------------- */
    const filteredReceptionists = useMemo(() => {
        if (!Array.isArray(receptionists)) return [];

        const q = search.toLowerCase().trim();

        return receptionists.filter((rec) => {
            const isBranch = Number(rec?.is_branch) === 1 || Boolean(rec?.branch_id);

            // Filter by Assignment Status
            if (statusFilter === "assigned" && !isBranch) return false;
            if (statusFilter === "unassigned" && isBranch) return false;

            if (!q) return true;

            const name = (rec?.name || "").toLowerCase();
            const refName = (rec?.ref_name || "").toLowerCase();
            const repId = (rec?.rep_id || "").toLowerCase();
            const phone = (rec?.phone || "").toLowerCase();
            const email = (rec?.email || "").toLowerCase();
            const branchObj = getBranchDetails(rec?.branch_id);
            const branchName = (branchObj?.name || branchObj?.branch_name || "").toLowerCase();

            return (
                name.includes(q) ||
                refName.includes(q) ||
                repId.includes(q) ||
                phone.includes(q) ||
                email.includes(q) ||
                branchName.includes(q)
            );
        });
    }, [receptionists, search, statusFilter, branchMap]);

    /* ---------------------------------------------------
       Pagination Calculations
    --------------------------------------------------- */
    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(filteredReceptionists.length / rowsPerPage));
    }, [filteredReceptionists.length, rowsPerPage]);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [totalPages, currentPage]);

    const paginatedReceptionists = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredReceptionists.slice(start, start + rowsPerPage);
    }, [filteredReceptionists, currentPage, rowsPerPage]);

    const startEntry = filteredReceptionists.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const endEntry = Math.min(currentPage * rowsPerPage, filteredReceptionists.length);

    /* ---------------------------------------------------
       Navigation to Branch
    --------------------------------------------------- */
    const handleGoToBranch = (branchId) => {
        if (!branchId) {
            toast.error("No branch assigned to this receptionist.");
            return;
        }
        navigate(`/merchant/branches/${branchId}`);
    };

    return (
        <div style={{ paddingBottom: 40 }}>
            {/* Top Header */}
            <div
                className="flex-between mb-4"
                style={{
                    flexWrap: "wrap",
                    gap: 16,
                    alignItems: "center"
                }}
            >
                <div>
                    <h2
                        style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: "1.4rem",
                            fontWeight: 800,
                            margin: 0,
                            color: "var(--text-primary)"
                        }}
                    >
                        Receptionist Staff
                    </h2>
                    <p
                        style={{
                            fontSize: "0.85rem",
                            color: "var(--text-muted)",
                            marginTop: 4,
                            marginBottom: 0
                        }}
                    >
                        View receptionist desk accounts, staff IDs, and direct branch assignments.
                    </p>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate(-1)}
                    >
                        <i className="fas fa-arrow-left" /> Back
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={fetchReceptionistsData}
                        disabled={loading}
                    >
                        <i className={`fas fa-sync-alt ${loading ? "fa-spin" : ""}`} /> Refresh
                    </button>
                </div>
            </div>

            {/* Overview Metric Cards */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                    gap: 16,
                    marginBottom: 24
                }}
            >
                {/* Total Receptionists */}
                <div
                    className="card"
                    style={{
                        padding: "16px 20px",
                        borderRadius: 16,
                        border: "1px solid #E2E8F0",
                        background: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
                    }}
                >
                    <div
                        style={{
                            width: 46,
                            height: 46,
                            borderRadius: 12,
                            background: "var(--firstloop-primary-light, #E6F2FA)",
                            color: "var(--firstloop-primary, #0E88B8)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.2rem"
                        }}
                    >
                        <i className="fas fa-user-tie" />
                    </div>
                    <div>
                        <div
                            style={{
                                fontSize: "0.78rem",
                                color: "var(--text-muted)",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px"
                            }}
                        >
                            Total Receptionists
                        </div>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)" }}>
                            {stats.total}
                        </div>
                    </div>
                </div>

                {/* Assigned to Branch */}
                <div
                    className="card"
                    style={{
                        padding: "16px 20px",
                        borderRadius: 16,
                        border: "1px solid #E2E8F0",
                        background: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
                    }}
                >
                    <div
                        style={{
                            width: 46,
                            height: 46,
                            borderRadius: 12,
                            background: "rgba(16, 185, 129, 0.12)",
                            color: "#059669",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.2rem"
                        }}
                    >
                        <i className="fas fa-building" />
                    </div>
                    <div>
                        <div
                            style={{
                                fontSize: "0.78rem",
                                color: "var(--text-muted)",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px"
                            }}
                        >
                            Assigned to Branch
                        </div>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#059669" }}>
                            {stats.assigned}
                        </div>
                    </div>
                </div>

                {/* Unassigned Receptionists */}
                <div
                    className="card"
                    style={{
                        padding: "16px 20px",
                        borderRadius: 16,
                        border: "1px solid #E2E8F0",
                        background: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
                    }}
                >
                    <div
                        style={{
                            width: 46,
                            height: 46,
                            borderRadius: 12,
                            background: "rgba(245, 158, 11, 0.12)",
                            color: "#D97706",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.2rem"
                        }}
                    >
                        <i className="fas fa-user-clock" />
                    </div>
                    <div>
                        <div
                            style={{
                                fontSize: "0.78rem",
                                color: "var(--text-muted)",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px"
                            }}
                        >
                            Unassigned Staff
                        </div>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#D97706" }}>
                            {stats.unassigned}
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div
                className="card mb-4"
                style={{
                    padding: "16px 20px",
                    borderRadius: 16,
                    border: "1px solid #E2E8F0",
                    background: "#FFFFFF",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 14
                    }}
                >
                    {/* Search Field */}
                    <div
                        style={{
                            position: "relative",
                            flex: 1,
                            minWidth: "260px"
                        }}
                    >
                        <i
                            className="fas fa-search"
                            style={{
                                position: "absolute",
                                left: 14,
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "var(--text-muted)",
                                fontSize: "0.9rem"
                            }}
                        />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search by Name, Alias, Rep ID, Phone or Branch..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                paddingLeft: 38,
                                borderRadius: 10,
                                height: 42,
                                fontSize: "0.88rem"
                            }}
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                style={{
                                    position: "absolute",
                                    right: 12,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    color: "var(--text-muted)",
                                    cursor: "pointer",
                                    fontSize: "0.85rem"
                                }}
                            >
                                <i className="fas fa-times" />
                            </button>
                        )}
                    </div>

                    {/* Filter Status Tabs */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <button
                            type="button"
                            onClick={() => setStatusFilter("all")}
                            style={{
                                padding: "8px 14px",
                                borderRadius: 8,
                                border: "1px solid",
                                borderColor: statusFilter === "all" ? "var(--firstloop-primary)" : "#E2E8F0",
                                background: statusFilter === "all" ? "var(--firstloop-primary-light)" : "#FFFFFF",
                                color: statusFilter === "all" ? "var(--firstloop-primary)" : "var(--text-secondary)",
                                fontWeight: statusFilter === "all" ? 700 : 500,
                                fontSize: "0.84rem",
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                            }}
                        >
                            All ({stats.total})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter("assigned")}
                            style={{
                                padding: "8px 14px",
                                borderRadius: 8,
                                border: "1px solid",
                                borderColor: statusFilter === "assigned" ? "#059669" : "#E2E8F0",
                                background: statusFilter === "assigned" ? "rgba(16, 185, 129, 0.12)" : "#FFFFFF",
                                color: statusFilter === "assigned" ? "#059669" : "var(--text-secondary)",
                                fontWeight: statusFilter === "assigned" ? 700 : 500,
                                fontSize: "0.84rem",
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                            }}
                        >
                            <i className="fas fa-check-circle" style={{ marginRight: 6 }} />
                            Assigned ({stats.assigned})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter("unassigned")}
                            style={{
                                padding: "8px 14px",
                                borderRadius: 8,
                                border: "1px solid",
                                borderColor: statusFilter === "unassigned" ? "#D97706" : "#E2E8F0",
                                background: statusFilter === "unassigned" ? "rgba(245, 158, 11, 0.12)" : "#FFFFFF",
                                color: statusFilter === "unassigned" ? "#D97706" : "var(--text-secondary)",
                                fontWeight: statusFilter === "unassigned" ? 700 : 500,
                                fontSize: "0.84rem",
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                            }}
                        >
                            <i className="fas fa-clock" style={{ marginRight: 6 }} />
                            Unassigned ({stats.unassigned})
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop Table View */}
            <div
                className="card d-none d-md-block"
                style={{
                    borderRadius: 16,
                    border: "1px solid #E2E8F0",
                    background: "#FFFFFF",
                    overflow: "hidden",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
                }}
            >
                <div className="table-responsive">
                    <table
                        className="table"
                        style={{
                            width: "100%",
                            marginBottom: 0,
                            borderCollapse: "collapse"
                        }}
                    >
                        <thead>
                            <tr
                                style={{
                                    background: "#F8FAFC",
                                    borderBottom: "1px solid #E2E8F0",
                                    color: "var(--text-secondary)",
                                    fontSize: "0.78rem",
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px"
                                }}
                            >
                                <th style={{ padding: "14px 18px" }}>Receptionist Staff</th>
                                <th style={{ padding: "14px 18px" }}>Rep ID</th>
                                <th style={{ padding: "14px 18px" }}>Contact Info</th>
                                <th style={{ padding: "14px 18px" }}>Branch Assignment</th>
                                <th style={{ padding: "14px 18px", textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: "40px", textAlign: "center" }}>
                                        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, color: "var(--firstloop-primary)" }}>
                                            <i className="fas fa-spinner fa-spin fa-2x" />
                                            <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                                                Loading receptionist staff...
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedReceptionists.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: "50px 20px", textAlign: "center" }}>
                                        <div style={{ color: "var(--text-muted)", marginBottom: 8 }}>
                                            <i className="fas fa-user-slash fa-3x" style={{ opacity: 0.4 }} />
                                        </div>
                                        <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                                            No Receptionists Found
                                        </div>
                                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 4 }}>
                                            {search || statusFilter !== "all"
                                                ? "Try adjusting your search query or filter."
                                                : "No receptionist accounts exist for this merchant."}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedReceptionists.map((item) => {
                                    const isBranch = Number(item?.is_branch) === 1 && Boolean(item?.branch_id);
                                    const branchObj = isBranch ? getBranchDetails(item?.branch_id) : null;
                                    const branchDisplayName = branchObj?.name || branchObj?.branch_name || `Branch #${item.branch_id}`;

                                    const initial = (item.name || "R").charAt(0).toUpperCase();

                                    return (
                                        <tr
                                            key={item.id || item.rep_id}
                                            style={{
                                                borderBottom: "1px solid #F1F5F9",
                                                transition: "background 0.15s ease"
                                            }}
                                            className="table-row-hover"
                                        >
                                            {/* Name & Reference */}
                                            <td style={{ padding: "14px 18px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                    <div
                                                        style={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: "50%",
                                                            background: isBranch
                                                                ? "linear-gradient(135deg, #0E88B8 0%, #00B4D8 100%)"
                                                                : "linear-gradient(135deg, #94A3B8 0%, #64748B 100%)",
                                                            color: "#FFFFFF",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            fontWeight: 800,
                                                            fontSize: "1rem",
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        {initial}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.92rem" }}>
                                                            {item.name || "Unnamed Staff"}
                                                        </div>
                                                        {item.ref_name && item.ref_name !== item.name && (
                                                            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>
                                                                Alias: <strong>{item.ref_name}</strong>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Rep ID Badge */}
                                            <td style={{ padding: "14px 18px" }}>
                                                <span
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 5,
                                                        background: "#F1F5F9",
                                                        color: "#334155",
                                                        padding: "4px 9px",
                                                        borderRadius: 6,
                                                        fontSize: "0.78rem",
                                                        fontWeight: 700,
                                                        fontFamily: "monospace"
                                                    }}
                                                >
                                                    <i className="fas fa-id-badge" style={{ color: "var(--firstloop-primary)" }} />
                                                    {item.rep_id || `ID: ${item.id}`}
                                                </span>
                                            </td>

                                            {/* Contact Info */}
                                            <td style={{ padding: "14px 18px" }}>
                                                <div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 600 }}>
                                                        <i className="fas fa-phone" style={{ fontSize: "0.75rem", color: "#059669" }} />
                                                        {item.country_code && item.phone ? `${item.country_code} ${item.phone}` : "-"}
                                                    </div>
                                                    {item.email && (
                                                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 3 }}>
                                                            <i className="fas fa-envelope" style={{ fontSize: "0.72rem" }} />
                                                            {item.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Branch Assignment Status */}
                                            <td style={{ padding: "14px 18px" }}>
                                                {isBranch ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleGoToBranch(item.branch_id)}
                                                        title={`Click to view ${branchDisplayName}`}
                                                        style={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: 8,
                                                            background: "rgba(16, 185, 129, 0.1)",
                                                            color: "#059669",
                                                            border: "1px solid rgba(16, 185, 129, 0.25)",
                                                            padding: "6px 12px",
                                                            borderRadius: 8,
                                                            fontSize: "0.82rem",
                                                            fontWeight: 700,
                                                            cursor: "pointer",
                                                            transition: "all 0.15s ease"
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = "#059669";
                                                            e.currentTarget.style.color = "#FFFFFF";
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)";
                                                            e.currentTarget.style.color = "#059669";
                                                        }}
                                                    >
                                                        <i className="fas fa-store" />
                                                        <span>{branchDisplayName}</span>
                                                        <i className="fas fa-arrow-right" style={{ fontSize: "0.7rem", opacity: 0.8 }} />
                                                    </button>
                                                ) : (
                                                    <span
                                                        style={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: 6,
                                                            background: "rgba(245, 158, 11, 0.1)",
                                                            color: "#D97706",
                                                            border: "1px solid rgba(245, 158, 11, 0.25)",
                                                            padding: "5px 10px",
                                                            borderRadius: 8,
                                                            fontSize: "0.8rem",
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        <i className="fas fa-clock" />
                                                        Unassigned
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td style={{ padding: "14px 18px", textAlign: "right" }}>
                                                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                                    {isBranch && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm"
                                                            onClick={() => handleGoToBranch(item.branch_id)}
                                                            title="Navigate to Assigned Branch"
                                                            style={{
                                                                padding: "6px 10px",
                                                                borderRadius: 8,
                                                                background: "var(--firstloop-primary-light)",
                                                                color: "var(--firstloop-primary)",
                                                                border: "none",
                                                                fontWeight: 700,
                                                                fontSize: "0.8rem",
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: 5
                                                            }}
                                                        >
                                                            <i className="fas fa-external-link-alt" />
                                                            <span>Go to Branch</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-secondary"
                                                        onClick={() => setSelectedReceptionistModal(item)}
                                                        title="View Details"
                                                        style={{
                                                            padding: "6px 10px",
                                                            borderRadius: 8,
                                                            fontSize: "0.8rem"
                                                        }}
                                                    >
                                                        <i className="fas fa-eye" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer with Pagination */}
                {!loading && filteredReceptionists.length > 0 && (
                    <div
                        style={{
                            padding: "14px 20px",
                            background: "#F8FAFC",
                            borderTop: "1px solid #E2E8F0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: 12
                        }}
                    >
                        <div style={{ fontSize: "0.84rem", color: "var(--text-muted)" }}>
                            Showing <strong>{startEntry}</strong> to <strong>{endEntry}</strong> of{" "}
                            <strong>{filteredReceptionists.length}</strong> receptionists
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                style={{ borderRadius: 8, padding: "5px 10px" }}
                            >
                                <i className="fas fa-chevron-left" />
                            </button>

                            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                                <button
                                    key={pageNum}
                                    type="button"
                                    onClick={() => setCurrentPage(pageNum)}
                                    style={{
                                        minWidth: 32,
                                        height: 32,
                                        borderRadius: 8,
                                        border: "1px solid",
                                        borderColor: currentPage === pageNum ? "var(--firstloop-primary)" : "#E2E8F0",
                                        background: currentPage === pageNum ? "var(--firstloop-primary)" : "#FFFFFF",
                                        color: currentPage === pageNum ? "#FFFFFF" : "var(--text-secondary)",
                                        fontWeight: currentPage === pageNum ? 700 : 500,
                                        fontSize: "0.82rem",
                                        cursor: "pointer"
                                    }}
                                >
                                    {pageNum}
                                </button>
                            ))}

                            <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                style={{ borderRadius: 8, padding: "5px 10px" }}
                            >
                                <i className="fas fa-chevron-right" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Cards View */}
            <div className="d-md-none" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {loading ? (
                    <div className="card text-center" style={{ padding: 30, borderRadius: 16 }}>
                        <i className="fas fa-spinner fa-spin fa-2x" style={{ color: "var(--firstloop-primary)" }} />
                        <div style={{ marginTop: 10, fontSize: "0.9rem", color: "var(--text-muted)" }}>
                            Loading receptionists...
                        </div>
                    </div>
                ) : filteredReceptionists.length === 0 ? (
                    <div className="card text-center" style={{ padding: 40, borderRadius: 16 }}>
                        <i className="fas fa-user-slash fa-2x" style={{ color: "var(--text-muted)", marginBottom: 8 }} />
                        <div style={{ fontWeight: 700 }}>No Receptionists Found</div>
                    </div>
                ) : (
                    paginatedReceptionists.map((item) => {
                        const isBranch = Number(item?.is_branch) === 1 && Boolean(item?.branch_id);
                        const branchObj = isBranch ? getBranchDetails(item?.branch_id) : null;
                        const branchDisplayName = branchObj?.name || branchObj?.branch_name || `Branch #${item.branch_id}`;
                        const initial = (item.name || "R").charAt(0).toUpperCase();

                        return (
                            <div
                                key={item.id || item.rep_id}
                                className="card"
                                style={{
                                    padding: 16,
                                    borderRadius: 16,
                                    border: "1px solid #E2E8F0",
                                    background: "#FFFFFF",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div
                                            style={{
                                                width: 42,
                                                height: 42,
                                                borderRadius: "50%",
                                                background: isBranch
                                                    ? "linear-gradient(135deg, #0E88B8 0%, #00B4D8 100%)"
                                                    : "linear-gradient(135deg, #94A3B8 0%, #64748B 100%)",
                                                color: "#FFFFFF",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontWeight: 800,
                                                fontSize: "1.1rem"
                                            }}
                                        >
                                            {initial}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                                                {item.name || "Staff Member"}
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: "0.75rem",
                                                    fontWeight: 700,
                                                    fontFamily: "monospace",
                                                    color: "var(--firstloop-primary)",
                                                    background: "var(--firstloop-primary-light)",
                                                    padding: "2px 6px",
                                                    borderRadius: 4
                                                }}
                                            >
                                                {item.rep_id || `ID: ${item.id}`}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action button */}
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => setSelectedReceptionistModal(item)}
                                        style={{ borderRadius: 8, padding: "6px 10px" }}
                                    >
                                        <i className="fas fa-eye" />
                                    </button>
                                </div>

                                <div
                                    style={{
                                        background: "#F8FAFC",
                                        borderRadius: 10,
                                        padding: "10px 12px",
                                        fontSize: "0.82rem",
                                        marginBottom: 12,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 6
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <i className="fas fa-phone" style={{ color: "#059669", width: 14 }} />
                                        <span style={{ fontWeight: 600 }}>{item.phone || "No phone"}</span>
                                    </div>
                                    {item.ref_name && (
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)" }}>
                                            <i className="fas fa-user-tag" style={{ width: 14 }} />
                                            <span>Alias: <strong>{item.ref_name}</strong></span>
                                        </div>
                                    )}
                                </div>

                                {/* Branch Status / Link */}
                                {isBranch ? (
                                    <button
                                        type="button"
                                        onClick={() => handleGoToBranch(item.branch_id)}
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            background: "rgba(16, 185, 129, 0.1)",
                                            color: "#059669",
                                            border: "1px solid rgba(16, 185, 129, 0.25)",
                                            padding: "10px 14px",
                                            borderRadius: 10,
                                            fontWeight: 700,
                                            fontSize: "0.84rem",
                                            cursor: "pointer"
                                        }}
                                    >
                                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <i className="fas fa-store" />
                                            {branchDisplayName}
                                        </span>
                                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.78rem" }}>
                                            Go to Branch <i className="fas fa-arrow-right" />
                                        </span>
                                    </button>
                                ) : (
                                    <div
                                        style={{
                                            textAlign: "center",
                                            padding: "8px 12px",
                                            borderRadius: 10,
                                            background: "rgba(245, 158, 11, 0.1)",
                                            color: "#D97706",
                                            fontWeight: 600,
                                            fontSize: "0.82rem",
                                            border: "1px solid rgba(245, 158, 11, 0.25)"
                                        }}
                                    >
                                        <i className="fas fa-clock" style={{ marginRight: 6 }} />
                                        Unassigned to Branch
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Receptionist Details Modal */}
            {selectedReceptionistModal && (
                <div
                    className="modal-backdrop"
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(15, 23, 42, 0.65)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1060,
                        padding: 16
                    }}
                    onClick={() => setSelectedReceptionistModal(null)}
                >
                    <div
                        className="modal-card"
                        style={{
                            width: "100%",
                            maxWidth: 500,
                            background: "#FFFFFF",
                            borderRadius: 18,
                            padding: 24,
                            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                            position: "relative"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                borderBottom: "1px solid #E2E8F0",
                                paddingBottom: 14,
                                marginBottom: 18
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div
                                    style={{
                                        width: 38,
                                        height: 38,
                                        borderRadius: 10,
                                        background: "var(--firstloop-primary-light)",
                                        color: "var(--firstloop-primary)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "1.1rem"
                                    }}
                                >
                                    <i className="fas fa-user-tie" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>
                                        Receptionist Details
                                    </h3>
                                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                                        Staff Terminal Profile
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedReceptionistModal(null)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "var(--text-muted)",
                                    fontSize: "1.1rem",
                                    cursor: "pointer"
                                }}
                            >
                                <i className="fas fa-times" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {/* Staff Name & ID */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 14,
                                    padding: "14px",
                                    borderRadius: 12,
                                    background: "#F8FAFC"
                                }}
                            >
                                <div
                                    style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: "50%",
                                        background: "var(--firstloop-primary)",
                                        color: "#FFFFFF",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "1.2rem",
                                        fontWeight: 800
                                    }}
                                >
                                    {(selectedReceptionistModal.name || "R").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary)" }}>
                                        {selectedReceptionistModal.name || "Unnamed"}
                                    </div>
                                    <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>
                                        Alias: <strong>{selectedReceptionistModal.ref_name || "-"}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                <div style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: 10 }}>
                                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
                                        Staff Rep ID
                                    </div>
                                    <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--firstloop-primary)", fontFamily: "monospace", marginTop: 2 }}>
                                        {selectedReceptionistModal.rep_id || `ID: ${selectedReceptionistModal.id}`}
                                    </div>
                                </div>

                                <div style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: 10 }}>
                                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
                                        Phone Number
                                    </div>
                                    <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>
                                        {selectedReceptionistModal.phone || "-"}
                                    </div>
                                </div>
                            </div>

                            {/* Email */}
                            <div style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: 10 }}>
                                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
                                    Email Address
                                </div>
                                <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)", marginTop: 2 }}>
                                    {selectedReceptionistModal.email || "No email registered"}
                                </div>
                            </div>

                            {/* Branch Status */}
                            <div
                                style={{
                                    padding: "12px 14px",
                                    borderRadius: 12,
                                    background:
                                        Number(selectedReceptionistModal.is_branch) === 1 && selectedReceptionistModal.branch_id
                                            ? "rgba(16, 185, 129, 0.08)"
                                            : "rgba(245, 158, 11, 0.08)",
                                    border:
                                        Number(selectedReceptionistModal.is_branch) === 1 && selectedReceptionistModal.branch_id
                                            ? "1px solid rgba(16, 185, 129, 0.2)"
                                            : "1px solid rgba(245, 158, 11, 0.2)"
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "0.72rem",
                                        fontWeight: 700,
                                        textTransform: "uppercase",
                                        color:
                                            Number(selectedReceptionistModal.is_branch) === 1 && selectedReceptionistModal.branch_id
                                                ? "#059669"
                                                : "#D97706",
                                        marginBottom: 4
                                    }}
                                >
                                    Branch Studio Assignment
                                </div>
                                <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)" }}>
                                    {Number(selectedReceptionistModal.is_branch) === 1 && selectedReceptionistModal.branch_id ? (
                                        (() => {
                                            const b = getBranchDetails(selectedReceptionistModal.branch_id);
                                            return b?.name || b?.branch_name || `Assigned to Branch ID #${selectedReceptionistModal.branch_id}`;
                                        })()
                                    ) : (
                                        "Not currently assigned to any retail branch"
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 10,
                                marginTop: 20,
                                paddingTop: 14,
                                borderTop: "1px solid #E2E8F0"
                            }}
                        >
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setSelectedReceptionistModal(null)}
                            >
                                Close
                            </button>

                            {Number(selectedReceptionistModal.is_branch) === 1 && selectedReceptionistModal.branch_id && (
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => {
                                        const bId = selectedReceptionistModal.branch_id;
                                        setSelectedReceptionistModal(null);
                                        handleGoToBranch(bId);
                                    }}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 6
                                    }}
                                >
                                    <i className="fas fa-store" />
                                    <span>Go to Assigned Branch</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

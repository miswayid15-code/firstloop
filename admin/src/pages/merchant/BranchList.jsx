import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import API from "../../api.js";

export default function BranchList() {
    const navigate = useNavigate();

    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [selectedReceptionistModal, setSelectedReceptionistModal] = useState(null);

    /* ---------------------------------------------------
       Fetch Branches
    --------------------------------------------------- */
    const fetchBranches = async () => {
        try {
            setLoading(true);
            const response = await API.post("firstloop/merchant/branch-list");
            console.log("Branch List Response:", response.data);

            if (response.data?.status === 1) {
                setBranches(Array.isArray(response.data?.data) ? response.data.data : []);
            } else {
                setBranches([]);
                toast.error(response.data?.message || "Branch list not found");
            }
        } catch (error) {
            console.error("Branch Fetch Error:", error.response?.data || error);
            setBranches([]);
            toast.error(
                error.response?.data?.message ||
                "Something went wrong while fetching branches"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    // Reset pagination to first page when search or status filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter]);

    /* ---------------------------------------------------
       Get Receptionist Helper
    --------------------------------------------------- */
    const getPrimaryReceptionist = (branch) => {
        if (!branch) return null;

        if (branch.Receptionist) {
            return branch.Receptionist;
        }
        if (Array.isArray(branch.Receptionists) && branch.Receptionists.length > 0) {
            return branch.Receptionists[0];
        }
        if (branch.receptionist) {
            return branch.receptionist;
        }
        return null;
    };

    /* ---------------------------------------------------
       Stats Computation
    --------------------------------------------------- */
    const stats = useMemo(() => {
        if (!Array.isArray(branches)) {
            return { total: 0, active: 0, assigned: 0, unassigned: 0 };
        }

        const total = branches.length;
        let active = 0;
        let assigned = 0;

        branches.forEach((b) => {
            const st = (b?.status || "Active").toString().toLowerCase();
            if (st === "active" || st === "1" || st === "true") {
                active++;
            }
            if (getPrimaryReceptionist(b)) {
                assigned++;
            }
        });

        return {
            total,
            active,
            assigned,
            unassigned: total - assigned
        };
    }, [branches]);

    /* ---------------------------------------------------
       Search & Status Filtering
    --------------------------------------------------- */
    const filteredBranches = useMemo(() => {
        if (!Array.isArray(branches)) return [];

        const q = search.toLowerCase().trim();

        return branches.filter((branch) => {
            // Filter by Status
            if (statusFilter !== "all") {
                const st = (branch?.status || "Active").toString().toLowerCase();
                const isActive = st === "active" || st === "1" || st === "true";
                if (statusFilter === "active" && !isActive) return false;
                if (statusFilter === "inactive" && isActive) return false;
            }

            if (!q) return true;

            const name = (branch?.name || branch?.branch_name || "").toLowerCase();
            const city = (branch?.city || branch?.address || "").toLowerCase();
            
            const phone = (branch?.phone || "").toLowerCase();

            return name.includes(q) || city.includes(q)  || phone.includes(q);
        });
    }, [branches, search, statusFilter]);

    /* ---------------------------------------------------
       Pagination Calculations
    --------------------------------------------------- */
    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(filteredBranches.length / rowsPerPage));
    }, [filteredBranches.length, rowsPerPage]);

    // Safety check for currentPage bounds
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [totalPages, currentPage]);

    const paginatedBranches = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredBranches.slice(start, start + rowsPerPage);
    }, [filteredBranches, currentPage, rowsPerPage]);

    const startEntry = filteredBranches.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const endEntry = Math.min(currentPage * rowsPerPage, filteredBranches.length);

    /* ---------------------------------------------------
       Delete Handler (UI state)
    --------------------------------------------------- */
    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this branch location?")) {
            setBranches((prev) => prev.filter((branch) => (branch.id || branch._id) !== id));
            toast.success("Branch removed");
        }
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
                        Merchant Branch Locations
                    </h2>
                    <p
                        style={{
                            fontSize: "0.85rem",
                            color: "var(--text-muted)",
                            marginTop: 4,
                            marginBottom: 0
                        }}
                    >
                        Manage store outlets, receptionist assignments, and direct branch studio access.
                    </p>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={fetchBranches}
                        disabled={loading}
                        style={{
                            borderRadius: 10,
                            padding: "8px 14px",
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                        }}
                    >
                        <i className={`fas fa-sync-alt ${loading ? "fa-spin" : ""}`} />
                        Refresh
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
                {/* Total Outlets */}
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
                        <i className="fas fa-store" />
                    </div>
                    <div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Total Outlets
                        </div>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)" }}>
                            {stats.total}
                        </div>
                    </div>
                </div>

                {/* Active Outlets */}
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
                        <i className="fas fa-check-circle" />
                    </div>
                    <div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Active Outlets
                        </div>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#059669" }}>
                            {stats.active}
                        </div>
                    </div>
                </div>

                {/* Assigned Receptionists */}
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
                            background: "rgba(99, 102, 241, 0.12)",
                            color: "#4F46E5",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.2rem"
                        }}
                    >
                        <i className="fas fa-user-check" />
                    </div>
                    <div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Assigned Receptionists
                        </div>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#4F46E5" }}>
                            {stats.assigned}
                        </div>
                    </div>
                </div>

                {/* Unassigned Outlets */}
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
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Unassigned Outlets
                        </div>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#D97706" }}>
                            {stats.unassigned}
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Toolbar */}
            <div
                className="card mb-4"
                style={{
                    padding: 16,
                    borderRadius: 16,
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 14
                    }}
                >
                    {/* Left: Search input */}
                    <div
                        style={{
                            position: "relative",
                            minWidth: 280,
                            flex: 1,
                            maxWidth: 400
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
                                fontSize: "0.88rem"
                            }}
                        />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search by name, city, manager, phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                paddingLeft: 40,
                                paddingRight: search ? 36 : 14,
                                height: 40,
                                borderRadius: 10,
                                fontSize: "0.88rem",
                                border: "1px solid #CBD5E1"
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
                                    border: "none",
                                    background: "transparent",
                                    color: "#94A3B8",
                                    cursor: "pointer",
                                    padding: 0,
                                    fontSize: "0.85rem"
                                }}
                                title="Clear search"
                            >
                                <i className="fas fa-times-circle" />
                            </button>
                        )}
                    </div>

                    {/* Right: Status filter & Page size selector */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            flexWrap: "wrap"
                        }}
                    >
                        {/* Status Filter */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>
                                Status:
                            </span>
                            <select
                                className="form-control"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{
                                    height: 40,
                                    borderRadius: 10,
                                    fontSize: "0.85rem",
                                    padding: "0 12px",
                                    minWidth: 130,
                                    border: "1px solid #CBD5E1",
                                    background: "#FFFFFF"
                                }}
                            >
                                <option value="all">All Outlets</option>
                                <option value="active">Active Only</option>
                                <option value="inactive">Inactive Only</option>
                            </select>
                        </div>

                        {/* Page Size Selector */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>
                                Show:
                            </span>
                            <select
                                className="form-control"
                                value={rowsPerPage}
                                onChange={(e) => {
                                    setRowsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                style={{
                                    height: 40,
                                    borderRadius: 10,
                                    fontSize: "0.85rem",
                                    padding: "0 8px",
                                    width: 75,
                                    border: "1px solid #CBD5E1",
                                    background: "#FFFFFF"
                                }}
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Branch Table Card */}
            <div
                className="card"
                style={{
                    padding: 0,
                    overflow: "hidden",
                    borderRadius: 16,
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.04)"
                }}
            >
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead
                            style={{
                                background: "#F8FAFC",
                                borderBottom: "2px solid #E2E8F0"
                            }}
                        >
                            <tr>
                                <th style={{ padding: "14px 18px", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748B" }}>
                                    Branch Location
                                </th>
                                <th style={{ padding: "14px 18px", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748B" }}>
                                    Branch Details
                                </th>
                                <th style={{ padding: "14px 18px", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748B" }}>
                                    Assigned Receptionist
                                </th>
                                <th style={{ padding: "14px 18px", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748B" }}>
                                    Status
                                </th>
                                <th style={{ padding: "14px 18px", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748B", textAlign: "right" }}>
                                    Actions & Studio View
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="5"
                                        style={{
                                            textAlign: "center",
                                            padding: "50px 20px",
                                            color: "var(--text-muted)"
                                        }}
                                    >
                                        <i
                                            className="fas fa-circle-notch fa-spin"
                                            style={{
                                                fontSize: "1.8rem",
                                                color: "var(--firstloop-primary, #0E88B8)",
                                                marginBottom: 10
                                            }}
                                        />
                                        <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                                            Loading Branch Outlets...
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedBranches.length > 0 ? (
                                paginatedBranches.map((branch, idx) => {
                                    const branchId = branch.id || branch._id || idx;
                                    const receptionist = getPrimaryReceptionist(branch);
                                    const branchName = branch.name || branch.branch_name || "Outlet Branch";
                                    const address = branch.address || "Address -";
                                    const city = branch.city || "";
                                    const zip = branch.zip_code || branch.zip || "";
                                    const manager = branch.manager || branch.manager_name || "Branch Manager";
                                    const email = branch.email || "-";
                                    const phone = branch.phone || "-";
                                    const rawStatus = (branch.status || "Active").toString();
                                    const isActive = rawStatus.toLowerCase() === "active" || rawStatus === "1" || rawStatus.toLowerCase() === "true";

                                    return (
                                        <tr key={branchId} style={{ transition: "background-color 0.15s ease" }}>
                                            {/* Branch Name & Address */}
                                            <td style={{ padding: "14px 18px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                    <div
                                                        style={{
                                                            width: 42,
                                                            height: 42,
                                                            borderRadius: 12,
                                                            background: "var(--firstloop-primary-light, #E6F2FA)",
                                                            color: "var(--firstloop-primary, #0E88B8)",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            fontWeight: 800,
                                                            fontSize: "1.1rem",
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                    {branch?.profile_image ? (
                                                        <img
                                                            src={branch.profile_image}
                                                            alt={branchName}
                                                            style={{
                                                                width: "100%",
                                                                height: "100%",
                                                                objectFit: "cover",
                                                                borderRadius: "12px"
                                                            }}
                                                        />
                                                    ) : (
                                                        <i className="fas fa-store" />
                                                    )}
                                                    </div>
                                                    <div>
                                                        <strong style={{ color: "var(--text-primary)", fontSize: "0.92rem", display: "block" }}>
                                                            {branchName}
                                                        </strong>
                                                        <div
                                                            style={{
                                                                fontSize: "0.78rem",
                                                                color: "var(--text-muted)",
                                                                marginTop: 2
                                                            }}
                                                        >
                                                            <i
                                                                className="fas fa-map-marker-alt"
                                                                style={{
                                                                    marginRight: 5,
                                                                    color: "var(--firstloop-primary, #0E88B8)"
                                                                }}
                                                            />
                                                            {address}
                                                            {city ? `, ${city}` : ""}
                                                            {zip ? ` (${zip})` : ""}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Manager Details */}
                                            <td style={{ padding: "14px 18px" }}>
                                               
                                                {email && email !== "-" && (
                                                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>
                                                        <i className="far fa-envelope" style={{ marginRight: 5, fontSize: "0.75rem" }} />
                                                        {email}
                                                    </div>
                                                )}
                                                {phone && phone !== "-" && (
                                                    <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: 2 }}>
                                                        <i className="fas fa-phone-alt" style={{ marginRight: 5, fontSize: "0.72rem" }} />
                                                        {phone}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Assigned Receptionist */}
                                            <td style={{ padding: "14px 18px" }}>
                                                {receptionist ? (
                                                    <div
                                                        onClick={() => setSelectedReceptionistModal(receptionist)}
                                                        title="Click to view receptionist profile"
                                                        style={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: 10,
                                                            cursor: "pointer",
                                                            padding: "6px 12px",
                                                            borderRadius: 10,
                                                            background: "var(--firstloop-primary-light, #E6F2FA)",
                                                            border: "1px solid rgba(14,136,184,0.18)",
                                                            transition: "all 0.2s ease"
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius: "50%",
                                                                background: "var(--firstloop-primary, #0E88B8)",
                                                                color: "#FFFFFF",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontSize: "0.85rem",
                                                                flexShrink: 0
                                                            }}
                                                        >
                                                            <i className="fas fa-user-shield" />
                                                        </div>
                                                        <div>
                                                            <div
                                                                style={{
                                                                    fontSize: "0.85rem",
                                                                    fontWeight: 700,
                                                                    color: "var(--firstloop-primary, #0E88B8)",
                                                                    lineHeight: 1.2
                                                                }}
                                                            >
                                                                {receptionist.name || "Receptionist"}
                                                            </div>
                                                            {receptionist.phone && (
                                                                <div
                                                                    style={{
                                                                        fontSize: "0.72rem",
                                                                        color: "#059669",
                                                                        fontWeight: 600,
                                                                        marginTop: 2
                                                                    }}
                                                                >
                                                                    {receptionist.phone}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span
                                                        style={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: 6,
                                                            padding: "6px 12px",
                                                            borderRadius: 8,
                                                            background: "rgba(100, 116, 139, 0.08)",
                                                            border: "1px solid rgba(100, 116, 139, 0.18)",
                                                            color: "#64748B",
                                                            fontSize: "0.78rem",
                                                            fontWeight: 600,
                                                            whiteSpace: "nowrap"
                                                        }}
                                                    >
                                                        <i className="fas fa-user-slash" style={{ fontSize: "0.72rem" }} />
                                                        Unassigned
                                                    </span>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td style={{ padding: "14px 18px" }}>
                                                <span
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 6,
                                                        padding: "5px 12px",
                                                        borderRadius: 20,
                                                        background: isActive ? "rgba(16, 185, 129, 0.12)" : "rgba(100, 116, 139, 0.12)",
                                                        color: isActive ? "#059669" : "#64748B",
                                                        fontWeight: 700,
                                                        fontSize: "0.78rem"
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            width: 7,
                                                            height: 7,
                                                            borderRadius: "50%",
                                                            background: isActive ? "#10B981" : "#94A3B8"
                                                        }}
                                                    />
                                                    {isActive ? "Active" : "Inactive"}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td style={{ padding: "14px 18px", textAlign: "right" }}>
                                                <button
                                                    type="button"
                                                    className="btn firstloop-btn-primary btn-sm"
                                                    onClick={() => navigate(`/merchant/branches/${branchId}`)}
                                                    style={{
                                                        borderRadius: 8,
                                                        padding: "6px 14px",
                                                        fontSize: "0.82rem",
                                                        fontWeight: 600,
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 6
                                                    }}
                                                >
                                                    <i className="fas fa-eye" />
                                                    View Branch
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan="5"
                                        style={{
                                            textAlign: "center",
                                            padding: "40px 20px",
                                            color: "var(--text-muted)"
                                        }}
                                    >
                                        <div style={{ marginBottom: 12 }}>
                                            <i
                                                className="fas fa-store-slash"
                                                style={{
                                                    fontSize: "2.2rem",
                                                    color: "#CBD5E1"
                                                }}
                                            />
                                        </div>
                                        <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                                            No branch locations found
                                        </div>
                                        <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", margin: 0 }}>
                                            {search || statusFilter !== "all"
                                                ? "Try resetting your search or filter parameters."
                                                : "There are currently no branch outlets available."}
                                        </p>
                                        {(search || statusFilter !== "all") && (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary mt-3"
                                                onClick={() => {
                                                    setSearch("");
                                                    setStatusFilter("all");
                                                }}
                                                style={{ borderRadius: 8, fontSize: "0.8rem", fontWeight: 600 }}
                                            >
                                                Clear Search & Filters
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {!loading && filteredBranches.length > 0 && (
                    <div
                        style={{
                            padding: "16px 20px",
                            background: "#F8FAFC",
                            borderTop: "1px solid #E2E8F0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: 16
                        }}
                    >
                        {/* Range Summary */}
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
                            Showing <strong style={{ color: "var(--text-primary)" }}>{startEntry}</strong> to{" "}
                            <strong style={{ color: "var(--text-primary)" }}>{endEntry}</strong> of{" "}
                            <strong style={{ color: "var(--text-primary)" }}>{filteredBranches.length}</strong> entries
                        </div>

                        {/* Pagination Buttons */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {/* Previous Button */}
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                style={{
                                    height: 34,
                                    padding: "0 14px",
                                    fontSize: "0.82rem",
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6
                                }}
                            >
                                <i className="fas fa-chevron-left" style={{ fontSize: "0.75rem" }} />
                                Previous
                            </button>

                            {/* Page Numbers */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                const isCurrent = currentPage === page;
                                return (
                                    <button
                                        key={page}
                                        type="button"
                                        className={`btn btn-sm ${isCurrent ? "firstloop-btn-primary" : "btn-secondary"}`}
                                        onClick={() => setCurrentPage(page)}
                                        style={{
                                            height: 34,
                                            minWidth: 34,
                                            padding: "0 10px",
                                            fontSize: "0.82rem",
                                            borderRadius: 8,
                                            fontWeight: isCurrent ? 800 : 600,
                                            border: isCurrent ? "none" : "1px solid #CBD5E1",
                                            background: isCurrent ? "var(--firstloop-gradient-primary)" : "#FFFFFF",
                                            color: isCurrent ? "#FFFFFF" : "var(--text-primary)"
                                        }}
                                    >
                                        {page}
                                    </button>
                                );
                            })}

                            {/* Next Button */}
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                disabled={currentPage === totalPages || totalPages === 0}
                                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                style={{
                                    height: 34,
                                    padding: "0 14px",
                                    fontSize: "0.82rem",
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6
                                }}
                            >
                                Next
                                <i className="fas fa-chevron-right" style={{ fontSize: "0.75rem" }} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Receptionist Profile Modal */}
            {selectedReceptionistModal && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(15, 23, 42, 0.75)",
                        backdropFilter: "blur(6px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: 20
                    }}
                    onClick={() => setSelectedReceptionistModal(null)}
                >
                    <div
                        style={{
                            background: "#FFFFFF",
                            borderRadius: 24,
                            maxWidth: 480,
                            width: "100%",
                            overflow: "hidden",
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div
                            style={{
                                background: "var(--firstloop-gradient-primary)",
                                padding: "24px 28px",
                                color: "#FFFFFF"
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                }}
                            >
                                <div>
                                    <span
                                        style={{
                                            fontSize: "0.72rem",
                                            fontWeight: 700,
                                            letterSpacing: "0.5px",
                                            opacity: 0.9,
                                            textTransform: "uppercase"
                                        }}
                                    >
                                        BRANCH RECEPTIONIST PROFILE
                                    </span>
                                    <h3
                                        style={{
                                            fontSize: "1.25rem",
                                            fontWeight: 800,
                                            margin: "4px 0 0",
                                            color: "#FFFFFF"
                                        }}
                                    >
                                        {selectedReceptionistModal.name || "Receptionist"}
                                    </h3>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setSelectedReceptionistModal(null)}
                                    style={{
                                        background: "rgba(255,255,255,0.2)",
                                        border: "none",
                                        color: "#FFF",
                                        borderRadius: "50%",
                                        width: 32,
                                        height: 32,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "1.1rem"
                                    }}
                                >
                                    &times;
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div
                            style={{
                                padding: 24,
                                display: "flex",
                                flexDirection: "column",
                                gap: 16
                            }}
                        >
                            <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                                <small style={{ color: "var(--text-muted)", fontSize: "0.76rem", textTransform: "uppercase", fontWeight: 600 }}>
                                    Receptionist Name
                                </small>
                                <strong style={{ display: "block", color: "var(--text-primary)", fontSize: "0.95rem", marginTop: 2 }}>
                                    {selectedReceptionistModal.name || "-"}
                                </strong>
                            </div>

                            <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                                <small style={{ color: "var(--text-muted)", fontSize: "0.76rem", textTransform: "uppercase", fontWeight: 600 }}>
                                    Receptionist Code / ID
                                </small>
                                <strong style={{ display: "block", color: "var(--text-primary)", fontSize: "0.95rem", marginTop: 2 }}>
                                    {selectedReceptionistModal.rep_id || selectedReceptionistModal.id || "-"}
                                </strong>
                            </div>

                            <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                                <small style={{ color: "var(--text-muted)", fontSize: "0.76rem", textTransform: "uppercase", fontWeight: 600 }}>
                                    Email Address
                                </small>
                                <strong style={{ display: "block", color: "var(--text-primary)", fontSize: "0.95rem", marginTop: 2 }}>
                                    {selectedReceptionistModal.email || "-"}
                                </strong>
                            </div>

                            <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                                <small style={{ color: "var(--text-muted)", fontSize: "0.76rem", textTransform: "uppercase", fontWeight: 600 }}>
                                    Phone Number
                                </small>
                                <strong style={{ display: "block", color: "var(--text-primary)", fontSize: "0.95rem", marginTop: 2 }}>
                                    {selectedReceptionistModal?.country_code ? `${selectedReceptionistModal.country_code} ` : ""}
                                    {selectedReceptionistModal?.phone || "-"}
                                </strong>
                            </div>

                            {selectedReceptionistModal.ref_name && (
                                <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                                    <small style={{ color: "var(--text-muted)", fontSize: "0.76rem", textTransform: "uppercase", fontWeight: 600 }}>
                                        Reference Name
                                    </small>
                                    <strong style={{ display: "block", color: "var(--text-primary)", fontSize: "0.95rem", marginTop: 2 }}>
                                        {selectedReceptionistModal.ref_name}
                                    </strong>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div
                            style={{
                                padding: "16px 24px",
                                background: "#F8FAFC",
                                borderTop: "1px solid #E2E8F0",
                                textAlign: "right"
                            }}
                        >
                            <button
                                type="button"
                                className="btn firstloop-btn-primary"
                                onClick={() => setSelectedReceptionistModal(null)}
                                style={{ borderRadius: 8, padding: "8px 20px" }}
                            >
                                Close Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
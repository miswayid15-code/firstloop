import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { toast } from "react-hot-toast"
import {
    INITIAL_REPORTS_LOGS
} from './mockMerchantData'
import API from '../../api.js';
let merchant = {};
try {
    const rawMerchant = localStorage.getItem("merchant_data");

    if (rawMerchant && rawMerchant !== "null" && rawMerchant !== "undefined") {
        merchant = JSON.parse(rawMerchant) || {};

    }
} catch (e) {
    console.error("Error parsing merchant_data:", e);
}
// console.log("merchant",localStorage)
import flLogo from '../../assets/img/firstloop-favicon.png'
import qrImg from '../../assets/img/qr-img.png'

export default function MerchantDashboard() {
    const navigate = useNavigate()
    const [dashboard, setDashboard] = useState(null);

    const fetchDashboard = async () => {
        try {

            const response = await API.post(
                "firstloop/merchant/dashboard"
            );

            // console.log("Dashboard Response:", response.data);

            if (response.data?.status === 1) {

                setDashboard(
                    response.data.data || {}
                );

            } else {

                toast.error(
                    response.data?.message ||
                    "Failed to fetch dashboard"
                );
            }

        } catch (error) {

            // console.log(
            //     "Dashboard Fetch Error:",
            //     error.response?.data || error
            // );

            toast.error(
                error.response?.data?.message ||
                "Something went wrong"
            );
        }
    };


    useEffect(() => {

        fetchDashboard();

    }, []);

    const [logs] = useState(INITIAL_REPORTS_LOGS)

    const displayName = merchant?.user_name || merchant?.email || 'Merchant'
    // console.log("displayName",displayName)
    return (
        <div style={{ paddingBottom: 40 }}>
            {/* WELCOME BANNER HEADER */}
            <div
                style={{
                    background: 'var(--firstloop-gradient-primary)',
                    borderRadius: 20,
                    padding: '24px 28px',
                    color: '#FFFFFF',
                    marginBottom: 28,
                    boxShadow: '0 12px 28px -6px rgba(14, 136, 184, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 20
                }}
            >
                <div>
                    <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
                        Welcome back, {displayName}!
                    </h1>
                    <p style={{ fontSize: '0.88rem', opacity: 0.95, marginTop: 4, maxWidth: 600 }}>
                        Here is your live loyalty performance, stamp card issuance, membership tier activity, and branch operational status.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={() => navigate('/merchant/cards')}
                        style={{
                            background: '#FFFFFF',
                            color: 'var(--firstloop-primary)',
                            padding: '10px 18px',
                            borderRadius: 12,
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    >
                        <i className="fas fa-plus-circle" />
                        <span>Manage Cards</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/merchant/branches')}
                        style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            color: '#FFFFFF',
                            padding: '10px 18px',
                            borderRadius: 12,
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8
                        }}
                    >
                        <i className="fas fa-store" />
                        <span>View Branches</span>
                    </button>
                </div>
            </div>

            {/* TOP KPI STAT METRICS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 28 }}>
                <div className="card" style={{ padding: 18, borderRadius: 16, border: '1px solid rgba(14, 136, 184, 0.15)', background: '#FFFFFF' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Branches</span>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--firstloop-primary-light)', color: 'var(--firstloop-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fas fa-store" />
                        </div>
                    </div>
                    <div
                        style={{
                            fontSize: '1.6rem',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            marginTop: 8
                        }}
                    >
                        {dashboard?.active_br || 0} Locations
                    </div>
                    <small style={{ fontSize: '0.72rem', color: 'var(--status-success)', fontWeight: 600, marginTop: 4, display: 'block' }}>
                        <i className="fas fa-check" style={{ marginRight: 4 }} /> All branches open
                    </small>
                </div>

                <div className="card" style={{ padding: 18, borderRadius: 16, border: '1px solid rgba(14, 136, 184, 0.15)', background: '#FFFFFF' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Enrolled Customers</span>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(16, 185, 129, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fas fa-users" />
                        </div>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 8 }}>{dashboard?.active_cus || 0} Members</div>
                    <small style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600, marginTop: 4, display: 'block' }}>
                        <i className="fas fa-arrow-up" style={{ marginRight: 4 }} /> +18.4% this month
                    </small>
                </div>

                <div className="card" style={{ padding: 18, borderRadius: 16, border: '1px solid rgba(14, 136, 184, 0.15)', background: '#FFFFFF' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Stamp Cards</span>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(239, 0, 3, 0.1)', color: '#EF0003', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fas fa-stamp" />
                        </div>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 8 }}>{dashboard?.active_st_cr || 0} Active Passes</div>
                    <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                        {dashboard?.active_st_cr || 0} total stamps issued
                    </small>
                </div>

                <div className="card" style={{ padding: 18, borderRadius: 16, border: '1px solid rgba(14, 136, 184, 0.15)', background: '#FFFFFF' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Membership Tiers</span>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(245, 158, 11, 0.1)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fas fa-crown" />
                        </div>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 8 }}>{dashboard?.active_mem_cr || 0} Tiers</div>
                    <small style={{ fontSize: '0.72rem', color: '#D97706', fontWeight: 600, marginTop: 4, display: 'block' }}>
                        {dashboard?.active_mem_cr || 0} Tier Cardholders
                    </small>
                </div>
            </div>



            {/* RECENT CUSTOMER STAMP & REDEMPTION TRANSACTIONS */}
            <div className="card" style={{ padding: 20, borderRadius: 18, border: '1px solid rgba(14, 136, 184, 0.12)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                    <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                            Recent Customer Redemptions & Activity
                        </h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            Real-time log of customer stamps issued, rewards redeemed & tier discounts
                        </p>
                    </div>

                    <NavLink to="/merchant/reports" className="btn btn-sm" style={{ background: 'var(--firstloop-primary-light)', color: 'var(--firstloop-primary)', fontWeight: 700, fontSize: '0.82rem', borderRadius: 8, padding: '6px 12px', textDecoration: 'none' }}>
                        View Full Reports &rarr;
                    </NavLink>
                </div>

                <div className="table-responsive">
                    <table className="table table-custom align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ background: 'rgba(14, 136, 184, 0.05)' }}>
                                <th>Date & Time</th>
                                <th>Customer</th>
                                <th>Branch</th>
                                <th>Card Type</th>
                                <th>Action Performed</th>
                                <th>Reward Unlocked</th>
                                <th>Staff Member</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((tx) => (
                                <tr key={tx.id}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{tx.date}</td>
                                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{tx.customer}</td>
                                    <td>
                                        <small style={{ color: 'var(--text-secondary)' }}>{tx.branch}</small>
                                    </td>
                                    <td>
                                        <span className="badge" style={{ background: tx.cardType === 'Stamp Card' ? 'rgba(239, 0, 3, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: tx.cardType === 'Stamp Card' ? '#EF0003' : '#D97706', fontWeight: 700 }}>
                                            {tx.cardType}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{tx.action}</td>
                                    <td style={{ color: 'var(--firstloop-primary)', fontWeight: 700 }}>{tx.rewardUnlocked}</td>
                                    <td>{tx.staff}</td>
                                    <td>
                                        <span className="badge" style={{ background: 'var(--status-success-bg)', color: 'var(--status-success)', fontWeight: 700 }}>
                                            {tx.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

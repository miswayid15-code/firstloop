import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import API from '../../api.js'
import flLogo from '../../assets/img/firstloop-favicon.png'
import {
    INITIAL_BRANCHES,
    INITIAL_RECEPTIONISTS,
    INITIAL_STAMP_CARDS,
    INITIAL_MEMBERSHIP_CARDS,
    INITIAL_CUSTOMERS,
    INITIAL_REPORTS_LOGS
} from './mockMerchantData'

export default function MerchantReports() {
    const navigate = useNavigate()

    // Loading State for Skeleton Skin Shimmer
    const [loading, setLoading] = useState(true)

    // Live Report Data from API
    const [reportData, setReportData] = useState(null)

    // Tab 1: Branch Outlets Performance (First Tab), Tab 2: Redemption & Audit Logs, followed by others
    const [activeTab, setActiveTab] = useState('branches')

    // Global Filter states
    const [selectedBranch, setSelectedBranch] = useState('all')
    const [dateRange, setDateRange] = useState('30')
    const [selectedCardType, setSelectedCardType] = useState('all')
    const [search, setSearch] = useState('')

    // Branch section dropdown filter: 'all' | 'large_stamp' | 'large_membership' | 'highest_spend' | 'highest_footfall'
    const [branchSortFilter, setBranchSortFilter] = useState('all')

    // Staff section sorting filter: 'stamps_desc' | 'rewards_desc' | 'customers_desc' | 'name'
    const [staffSortFilter, setStaffSortFilter] = useState('stamps_desc')

    // Pagination for Logs Table
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)

    // Modals
    const [selectedLog, setSelectedLog] = useState(null)
    const [selectedStaffLog, setSelectedStaffLog] = useState(null)

    // Fetch report data from API: firstloop/merchant/report (method POST)
    const fetchReportData = async (showToast = false) => {
        setLoading(true)
        try {
            const response = await API.post('firstloop/merchant/report', {})
            if (response?.data && (response.data.status === 1 || response.data.status === '1')) {
                setReportData(response.data.data)
                if (showToast) {
                    toast.success('Live merchant report updated! 🔄')
                }
            } else if (response?.data?.message) {
                if (showToast) toast.error(response.data.message)
            }
        } catch (error) {
            console.error('Fetch Merchant Report Error:', error)
            if (showToast) {
                toast.error('Could not fetch live report, displaying cached records')
            }
        } finally {
            setLoading(false)
        }
    }

    // Initial Fetch
    useEffect(() => {
        fetchReportData(false)
    }, [])

    // Refresh Handler
    const handleRefresh = () => {
        fetchReportData(true)
    }

    // Dynamic Branches Mapping
    const allBranches = useMemo(() => {
        if (reportData?.branch_list && Array.isArray(reportData.branch_list) && reportData.branch_list.length > 0) {
            return reportData.branch_list.map((b) => {
                const bIdStr = String(b.id)
                const branchIssues = (reportData.stamp_card_issues || []).filter(ci => String(ci.branch_id) === bIdStr)
                const branchReps = (reportData.receptionist_list || []).filter(r => String(r.branch_id) === bIdStr)
                const branchLogs = (reportData.stamp_log || []).filter(l => {
                    const ci = (reportData.stamp_card_issues || []).find(i => String(i.id) === String(l.customer_card_id))
                    return ci && String(ci.branch_id) === bIdStr
                })

                const stampsIssued = branchIssues.reduce((sum, ci) => sum + (Number(ci.current_stamp) || 0), 0)
                const totalSpend = branchReps.reduce((sum, r) => sum + (Number(r.stamp_tot_amt) || 0), 0) ||
                    branchLogs.reduce((sum, l) => sum + (Number(l.paid_amt || l.amt) || 0), 0)
                const rewardsClaimed = branchLogs.filter(l => String(l.reward_type) === '1').length
                const customerFootfall = branchLogs.length || branchIssues.length

                const branchMembershipIssues = (reportData.membership_card_issues || []).filter(mi => String(mi.branch_id) === bIdStr).length
                const branchMembershipTemplates = (reportData.active_membership_card_list || []).filter(mc => (mc.branch_ids || []).map(String).includes(bIdStr)).length
                const branchStampCards = (reportData.active_stamp_card_list || []).filter(sc => (sc.branch_ids || []).map(String).includes(bIdStr)).length

                return {
                    id: bIdStr,
                    name: b.name,
                    city: b.address ? (b.address.split(',')[1]?.trim() || b.address.split(',')[0]?.trim()) : 'Chennai',
                    address: b.address || 'Chennai, Tamil Nadu, India',
                    phone: `${b.country_code || '+91'} ${b.phone || ''}`,
                    email: b.email || '',
                    manager: branchReps[0]?.name || b.name,
                    status: b.status === 1 || b.status === '1' ? 'Active' : 'Inactive',
                    receptionistsCount: branchReps.length,
                    stampsIssued: stampsIssued,
                    membershipCount: branchMembershipIssues || branchMembershipTemplates,
                    stampProgramsCount: branchStampCards || 1,
                    totalSpend: totalSpend,
                    rewardsClaimed: rewardsClaimed,
                    customerFootfall: customerFootfall,
                    receptionists: branchReps.map(r => r.name),
                    revenue: totalSpend
                }
            })
        }
        return INITIAL_BRANCHES
    }, [reportData])

    // Dynamic Receptionists Mapping
    const allReceptionists = useMemo(() => {
        if (reportData?.receptionist_list && Array.isArray(reportData.receptionist_list) && reportData.receptionist_list.length > 0) {
            return reportData.receptionist_list.map((rep, idx) => {
                const branch = (reportData.branch_list || []).find(b => String(b.id) === String(rep.branch_id))
                const repLogs = (reportData.stamp_log || []).filter(l => String(l.role_id) === String(rep.id) && l.role === 'receptionist')
                const stampsCollected = Number(rep.stamp_count) || 0
                const totalSpend = Number(rep.stamp_tot_amt) || 0

                return {
                    id: String(rep.id),
                    staffId: rep.rep_id || `REP-${rep.id}`,
                    name: rep.name,
                    email: rep.email,
                    phone: `${rep.country_code || '+91'} ${rep.phone}`,
                    branchId: String(rep.branch_id),
                    branchName: branch ? branch.name : `Branch #${rep.branch_id}`,
                    stampsCollected: stampsCollected,
                    totalSpendGenerated: totalSpend,
                    rewardsProcessed: repLogs.filter(l => String(l.reward_type) === '1').length,
                    customersServed: repLogs.length || stampsCollected,
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(rep.name)}`,
                    shift: 'General Day Shift (09:00 - 18:00)',
                    status: 'Active',
                    badge: stampsCollected > 0 ? (idx === 0 ? 'Top Receptionist' : 'Verified Receptionist') : 'Front Desk Staff'
                }
            })
        }
        return INITIAL_RECEPTIONISTS
    }, [reportData])

    // Dynamic Logs Mapping
    const allLogs = useMemo(() => {
        if (reportData?.stamp_log && Array.isArray(reportData.stamp_log) && reportData.stamp_log.length > 0) {
            return reportData.stamp_log.map((l) => {
                const cardIssue = (reportData.stamp_card_issues || []).find(ci => String(ci.id) === String(l.customer_card_id))
                const customer = cardIssue ? (reportData.customer_list || []).find(c => String(c.id) === String(cardIssue.customer_id)) : null
                const branch = cardIssue ? (reportData.branch_list || []).find(b => String(b.id) === String(cardIssue.branch_id)) : null
                const receptionist = (reportData.receptionist_list || []).find(r => String(r.id) === String(l.role_id) && l.role === 'receptionist')

                const isRedemption = String(l.reward_type) === '1'

                return {
                    id: `tx-${l.id}`,
                    date: cardIssue?.created_at ? new Date(cardIssue.created_at).toLocaleString() : '2026-09-09 12:36 PM',
                    customer: customer?.name || (cardIssue ? `Customer #${cardIssue.customer_id}` : 'Store Customer'),
                    customerEmail: customer?.email || 'N/A',
                    customerPhone: customer ? `+${customer.country_code || '91'} ${customer.phone || ''}` : '+91 9888888888',
                    branch: branch?.name || 'All Outlets',
                    branchId: branch ? String(branch.id) : (cardIssue ? String(cardIssue.branch_id) : 'all'),
                    cardType: 'Stamp Card',
                    cardName: cardIssue?.title || 'Stamp Card',
                    action: isRedemption ? 'Reward Claimed' : `Stamp Added (+${l.stamp_number || 1})`,
                    staff: l.role === 'receptionist' ? (receptionist?.name || `Receptionist #${l.role_id}`) : 'Merchant Admin',
                    staffId: receptionist?.rep_id || (l.role === 'receptionist' ? `REP-${l.role_id}` : 'MERCHANT'),
                    rewardUnlocked: isRedemption ? 'Reward Redeemed (Free)' : 'None',
                    amount: `$${parseFloat(l.paid_amt || l.amt || 0).toFixed(2)}`,
                    status: l.status === 1 || l.status === '1' ? 'Completed' : 'Pending'
                }
            })
        }
        return INITIAL_REPORTS_LOGS
    }, [reportData])

    // Dynamic Stamp Cards Mapping (from active_stamp_card_list or issues)
    const stampCards = useMemo(() => {
        if (reportData?.active_stamp_card_list && Array.isArray(reportData.active_stamp_card_list) && reportData.active_stamp_card_list.length > 0) {
            return reportData.active_stamp_card_list.map((c) => {
                const cIdStr = String(c.id)
                const matchingIssues = (reportData.stamp_card_issues || []).filter(ci => String(ci.merchant_card_id) === cIdStr)
                const stampsGiven = matchingIssues.reduce((s, ci) => s + (Number(ci.current_stamp) || 0), 0)
                const rewardsClaimed = (reportData.stamp_log || []).filter(l => {
                    const ci = (reportData.stamp_card_issues || []).find(i => String(i.id) === String(l.customer_card_id))
                    return ci && String(ci.merchant_card_id) === cIdStr && String(l.reward_type) === '1'
                }).length

                const branchNames = (c.branch_ids || []).map(bId => {
                    const b = (reportData.branch_list || []).find(br => String(br.id) === String(bId))
                    return b ? b.name : `Branch #${bId}`
                })

                return {
                    id: `sc-${c.id}`,
                    cardId: cIdStr,
                    title: c.title || 'Stamp Card',
                    type: 'Stamp Card',
                    total_stamps: Number(c.number_of_stamps) || 10,
                    active_members: matchingIssues.length,
                    activeMembers: matchingIssues.length,
                    stamps_given: stampsGiven,
                    rewards_claimed: rewardsClaimed,
                    tagline: c.brand_name ? `${c.brand_name} Exclusive Pass` : 'Collect stamps on every purchase',
                    reward: 'Specialty Reward on Completion',
                    status: c.status === 1 || c.status === '1' ? 'Active' : 'Inactive',
                    backgroundColor: c.background_color || '#0E88B8',
                    borderColor: c.border_color || '#ed0202',
                    textColor: c.text_color || '#dd0303',
                    stamp_background: c.stamp_background,
                    stamp_border_color: c.stamp_border_color,
                    stamp_text_color: c.stamp_text_color,
                    stamp_radius: c.stamp_radius,
                    brand_image: c.brand_image,
                    background_image: c.background_image,
                    brand_name: c.brand_name || 'Time shop',
                    branchNames: branchNames,
                    icon: 'fa-stamp'
                }
            })
        }
        if (reportData?.stamp_card_issues && Array.isArray(reportData.stamp_card_issues) && reportData.stamp_card_issues.length > 0) {
            const cardsMap = new Map()
            reportData.stamp_card_issues.forEach(issue => {
                const key = issue.merchant_card_id || issue.title
                if (!cardsMap.has(key)) {
                    const matchingIssues = reportData.stamp_card_issues.filter(ci => (ci.merchant_card_id || ci.title) === key)
                    const stampsGiven = matchingIssues.reduce((s, ci) => s + (Number(ci.current_stamp) || 0), 0)
                    const rewardsClaimed = (reportData.stamp_log || []).filter(l => String(l.reward_type) === '1').length

                    cardsMap.set(key, {
                        id: `sc-${issue.merchant_card_id || issue.id}`,
                        cardId: String(issue.merchant_card_id || issue.id),
                        title: issue.title || 'Stamp Card',
                        type: 'Stamp Card',
                        total_stamps: Number(issue.number_of_stamps) || 10,
                        active_members: matchingIssues.length,
                        activeMembers: matchingIssues.length,
                        stamps_given: stampsGiven,
                        rewards_claimed: rewardsClaimed,
                        tagline: issue.brand_name ? `${issue.brand_name} Exclusive Pass` : 'Collect stamps on every purchase',
                        reward: 'Specialty Reward on Completion',
                        status: issue.status === 1 || issue.status === '1' ? 'Active' : 'Inactive',
                        backgroundColor: issue.background_color || '#0E88B8',
                        borderColor: issue.border_color || '#ed0202',
                        textColor: issue.text_color || '#dd0303',
                        brand_image: issue.brand_image,
                        background_image: issue.background_image,
                        brand_name: issue.brand_name || 'Time shop',
                        icon: 'fa-stamp'
                    })
                }
            })
            return Array.from(cardsMap.values())
        }
        return INITIAL_STAMP_CARDS.map(c => ({ ...c, type: 'Stamp Card', active_members: c.activeMembers || 0 }))
    }, [reportData])

    // Dynamic Membership Cards Mapping (from active_membership_card_list or initial)
    const membershipCards = useMemo(() => {
        if (reportData?.active_membership_card_list && Array.isArray(reportData.active_membership_card_list) && reportData.active_membership_card_list.length > 0) {
            return reportData.active_membership_card_list.map((c) => {
                const cIdStr = String(c.id)
                const matchingIssues = (reportData.membership_card_issues || []).filter(mi => String(mi.merchant_card_id) === cIdStr)
                const branchNames = (c.branch_ids || []).map(bId => {
                    const b = (reportData.branch_list || []).find(br => String(br.id) === String(bId))
                    return b ? b.name : `Branch #${bId}`
                })

                return {
                    id: `mc-${c.id}`,
                    cardId: cIdStr,
                    title: c.title || 'Membership Tier',
                    name: c.title || 'Membership Tier',
                    type: 'Membership Tier',
                    tier: c.title || 'Gold',
                    month: c.month ? `${c.month} Months Validity` : '24 Months Validity',
                    validityMonths: c.month ? `${c.month} Months` : '24 Months',
                    activeMembers: matchingIssues.length,
                    active_members: matchingIssues.length,
                    minSpend: '$0 (Member Pass)',
                    discount: `${c.month || 24} Mo Pass`,
                    status: 'Active',
                    backgroundColor: c.background_color || '#D97706',
                    borderColor: c.border_color || '#fa0000',
                    textColor: c.text_color || '#ffffff',
                    background_image: c.background_image,
                    brand_name: c.brand_name || 'Time shop',
                    tagline: `${c.brand_name || 'Time shop'} VIP Membership Tier`,
                    reward: `${c.month || 24} Months Membership Privileges`,
                    perks: [`${c.month || 24} Months Validity`, 'Exclusive VIP Store Access', 'Priority Customer Privileges'],
                    branchNames: branchNames,
                    icon: 'fa-crown'
                }
            })
        }
        return INITIAL_MEMBERSHIP_CARDS.map(c => ({ ...c, type: 'Membership Tier', active_members: c.activeMembers || 0 }))
    }, [reportData])

    // Dynamic Combined Cards Mapping
    const allCards = useMemo(() => {
        return [...stampCards, ...membershipCards]
    }, [stampCards, membershipCards])

    // Dynamic Customers Mapping
    const allCustomers = useMemo(() => {
        if (reportData?.customer_list && Array.isArray(reportData.customer_list) && reportData.customer_list.length > 0) {
            return reportData.customer_list.map((cus) => {
                const cusIdStr = String(cus.id)
                const cusIssues = (reportData.stamp_card_issues || []).filter(ci => String(ci.customer_id) === cusIdStr)
                const cusLogs = (reportData.stamp_log || []).filter(l => {
                    const ci = (reportData.stamp_card_issues || []).find(i => String(i.id) === String(l.customer_card_id))
                    return ci && String(ci.customer_id) === cusIdStr
                })
                const stampsCollected = cusIssues.reduce((s, ci) => s + (Number(ci.current_stamp) || 0), 0)
                const totalSpend = cusLogs.reduce((s, l) => s + (Number(l.paid_amt || l.amt) || 0), 0)
                const branch = cusIssues[0] ? (reportData.branch_list || []).find(b => String(b.id) === String(cusIssues[0].branch_id)) : null

                const joined = cus.createdAt ? new Date(cus.createdAt).toLocaleDateString() : (cusIssues[0]?.created_at ? new Date(cusIssues[0].created_at).toLocaleDateString() : 'Active Member')

                return {
                    id: cusIdStr,
                    name: cus.name || `Customer #${cus.id}`,
                    email: cus.email || 'N/A',
                    phone: `+${cus.country_code || '91'} ${cus.phone || ''}`,
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cus.name || 'User')}`,
                    joinedDate: joined,
                    branchVisited: branch ? branch.name : (reportData.branch_list?.[0]?.name || 'Chennai Branch'),
                    stampsCollected: stampsCollected,
                    stampsTotal: cusIssues[0]?.number_of_stamps || (reportData.active_stamp_card_list?.[0]?.number_of_stamps) || 10,
                    stampCard: cusIssues[0]?.title || (reportData.active_stamp_card_list?.[0]?.title) || 'Stamp Card',
                    membershipTier: (reportData.active_membership_card_list?.[0]?.title) || 'Standard Member',
                    totalVisits: cusLogs.length || cusIssues.length || 1,
                    lifetimeSpend: `$${totalSpend.toFixed(2)}`,
                    city: cus.city || 'Chennai',
                    address: cus.address || 'Chennai, Tamil Nadu, India',
                    dob: cus.dob || '',
                    status: 'Active'
                }
            })
        }
        return INITIAL_CUSTOMERS
    }, [reportData])

    // Dynamic Executive Stats
    const executiveStats = useMemo(() => {
        const totalOutlets = reportData?.branch_count ?? allBranches.length
        const totalStaff = reportData?.receptionist_count ?? allReceptionists.length
        const totalActiveStampCards = reportData?.active_stamp_card_count ?? stampCards.length
        const totalActiveMembershipCards = reportData?.active_membership_card_count ?? membershipCards.length

        let totalStamps = 0
        if (reportData?.stamp_card_issues) {
            totalStamps = reportData.stamp_card_issues.reduce((acc, ci) => acc + (Number(ci.current_stamp) || 0), 0)
        } else {
            totalStamps = allBranches.reduce((acc, b) => acc + (b.stampsIssued || 0), 0)
        }
        if (totalStamps === 0) {
            totalStamps = reportData?.stamp_log_count || allLogs.length || 0
        }

        const totalCustomers = reportData?.customer_count ?? allCustomers.length

        const totalRedemptions = (reportData?.stamp_log || []).filter(l => String(l.reward_type) === '1').length
            || allBranches.reduce((acc, b) => acc + (b.rewardsClaimed || 0), 0)

        let totalGrossSpend = 0
        if (reportData?.stamp_log) {
            totalGrossSpend = reportData.stamp_log.reduce((acc, l) => acc + (Number(l.paid_amt || l.amt) || 0), 0)
        }
        if (totalGrossSpend === 0 && reportData?.receptionist_list) {
            totalGrossSpend = reportData.receptionist_list.reduce((acc, r) => acc + (Number(r.stamp_tot_amt) || 0), 0)
        }
        if (totalGrossSpend === 0) {
            totalGrossSpend = allBranches.reduce((acc, b) => acc + (b.totalSpend || 0), 0)
        }

        return {
            totalOutlets,
            totalStaff,
            totalActiveStampCards,
            totalActiveMembershipCards,
            totalStamps,
            totalCustomers,
            totalRedemptions,
            totalGrossSpend: `$${Number(totalGrossSpend).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        }
    }, [reportData, allBranches, allReceptionists, allLogs, allCustomers, stampCards, membershipCards])

    // Date Range Helper
    const matchesDateRange = (dateStr, range) => {
        if (range === 'all') return true
        try {
            const itemDate = new Date(dateStr)
            if (isNaN(itemDate.getTime())) return true
            const refDate = new Date('2026-09-09T15:00:00')
            const diffDays = (refDate - itemDate) / (1000 * 60 * 60 * 24)
            const daysLimit = Number(range)
            return diffDays >= -1 && diffDays <= daysLimit
        } catch {
            return true
        }
    }

    // Filtered & Sorted Branches
    const sortedAndFilteredBranches = useMemo(() => {
        let list = allBranches.filter((b) => {
            if (selectedBranch !== 'all' && b.name !== selectedBranch && b.id !== selectedBranch) return false
            if (!search) return true
            const q = search.toLowerCase()
            return b.name.toLowerCase().includes(q) || b.city.toLowerCase().includes(q) || b.manager.toLowerCase().includes(q)
        })

        if (branchSortFilter === 'large_stamp') {
            list = [...list].sort((a, b) => (b.stampsIssued || 0) - (a.stampsIssued || 0))
        } else if (branchSortFilter === 'large_membership') {
            list = [...list].sort((a, b) => (b.membershipCount || 0) - (a.membershipCount || 0))
        } else if (branchSortFilter === 'highest_spend') {
            list = [...list].sort((a, b) => (b.totalSpend || 0) - (a.totalSpend || 0))
        } else if (branchSortFilter === 'highest_footfall') {
            list = [...list].sort((a, b) => (b.customerFootfall || 0) - (a.customerFootfall || 0))
        }

        return list
    }, [allBranches, selectedBranch, search, branchSortFilter])

    // Filtered Logs
    const filteredLogs = useMemo(() => {
        return allLogs.filter((item) => {
            const matchesBranch = selectedBranch === 'all' || item.branch === selectedBranch || item.branchId === selectedBranch
            const matchesType = selectedCardType === 'all' || item.cardType.toLowerCase().includes(selectedCardType.toLowerCase())
            const matchesDate = matchesDateRange(item.date, dateRange)

            const q = search.trim().toLowerCase()
            const matchesSearch =
                !q ||
                item.customer.toLowerCase().includes(q) ||
                item.action.toLowerCase().includes(q) ||
                item.rewardUnlocked.toLowerCase().includes(q) ||
                item.staff.toLowerCase().includes(q) ||
                item.branch.toLowerCase().includes(q) ||
                item.cardName.toLowerCase().includes(q) ||
                (item.status && item.status.toLowerCase().includes(q))

            return matchesBranch && matchesType && matchesDate && matchesSearch
        })
    }, [allLogs, selectedBranch, selectedCardType, dateRange, search])

    // Pagination for Logs
    const totalPages = Math.ceil(filteredLogs.length / rowsPerPage) || 1
    const paginatedLogs = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage
        return filteredLogs.slice(start, start + rowsPerPage)
    }, [filteredLogs, currentPage, rowsPerPage])

    // Filtered Cards
    const filteredCards = useMemo(() => {
        return allCards.filter((c) => {
            if (selectedCardType === 'stamp' && c.type !== 'Stamp Card') return false
            if (selectedCardType === 'membership' && c.type !== 'Membership Tier') return false
            if (!search) return true
            const q = search.toLowerCase()
            const name = c.title || c.name || ''
            return name.toLowerCase().includes(q) || (c.reward || '').toLowerCase().includes(q) || (c.tier || '').toLowerCase().includes(q)
        })
    }, [allCards, selectedCardType, search])

    // Filtered Customers
    const filteredCustomers = useMemo(() => {
        return allCustomers.filter((cus) => {
            if (selectedBranch !== 'all' && cus.branchVisited !== selectedBranch) return false
            if (!search) return true
            const q = search.toLowerCase()
            return (
                cus.name.toLowerCase().includes(q) ||
                cus.email.toLowerCase().includes(q) ||
                cus.phone.toLowerCase().includes(q) ||
                (cus.stampCard || '').toLowerCase().includes(q) ||
                (cus.membershipTier || '').toLowerCase().includes(q)
            )
        })
    }, [allCustomers, selectedBranch, search])

    // Filtered & Ranked Receptionists with Stamps Collected
    const filteredAndRankedStaff = useMemo(() => {
        let list = allReceptionists.filter((stf) => {
            if (selectedBranch !== 'all' && stf.branchName !== selectedBranch && stf.branchId !== selectedBranch) return false
            if (!search) return true
            const q = search.toLowerCase()
            return stf.name.toLowerCase().includes(q) || stf.email.toLowerCase().includes(q) || stf.staffId.toLowerCase().includes(q)
        })

        if (staffSortFilter === 'stamps_desc') {
            list = [...list].sort((a, b) => (b.stampsCollected || 0) - (a.stampsCollected || 0))
        } else if (staffSortFilter === 'rewards_desc') {
            list = [...list].sort((a, b) => (b.rewardsProcessed || 0) - (a.rewardsProcessed || 0))
        } else if (staffSortFilter === 'customers_desc') {
            list = [...list].sort((a, b) => (b.customersServed || 0) - (a.customersServed || 0))
        } else if (staffSortFilter === 'name') {
            list = [...list].sort((a, b) => a.name.localeCompare(b.name))
        }

        return list
    }, [allReceptionists, selectedBranch, search, staffSortFilter])

    const maxStampsCollected = useMemo(() => {
        return Math.max(...allReceptionists.map((s) => s.stampsCollected || 0), 1)
    }, [allReceptionists])

    // Real CSV Export Functionality
    const handleExportCSV = () => {
        let exportData = []
        let filename = 'merchant_report.csv'

        if (activeTab === 'branches') {
            filename = 'merchant_branches_report.csv'
            exportData = sortedAndFilteredBranches.map((b) => ({
                'Branch ID': b.id,
                'Branch Name': b.name,
                'Manager': b.manager,
                'Phone': b.phone,
                'City': b.city,
                'Active Receptionists': b.receptionistsCount,
                'Stamps Issued': b.stampsIssued || 0,
                'Membership Cards Enrolled': b.membershipCount || 0,
                'Total Spend ($)': b.totalSpend || 0,
                'Customer Footfall': b.customerFootfall || 0,
                'Rewards Claimed': b.rewardsClaimed || 0,
                'Status': b.status
            }))
        } else if (activeTab === 'logs') {
            filename = `merchant_transaction_logs_${dateRange}d.csv`
            exportData = filteredLogs.map((log) => ({
                'Transaction ID': log.id,
                'Timestamp': log.date,
                'Customer Name': log.customer,
                'Customer Email': log.customerEmail || '-',
                'Branch Location': log.branch,
                'Card Type': log.cardType,
                'Card Name': log.cardName,
                'Action': log.action,
                'Reward / Savings': log.rewardUnlocked,
                'Order Value': log.amount || '$0.00',
                'Staff Member': log.staff,
                'Status': log.status
            }))
        } else if (activeTab === 'cards') {
            filename = 'merchant_loyalty_cards_report.csv'
            exportData = filteredCards.map((c) => ({
                'Card ID': c.id,
                'Card Name': c.title || c.name,
                'Type': c.type,
                'Total Active Members': c.active_members || c.activeMembers || 0,
                'Stamps Given / Perks': c.stamps_given || (c.perks && c.perks.join('; ')) || '-',
                'Rewards Claimed': c.rewards_claimed || '-',
                'Status': c.status
            }))
        } else if (activeTab === 'customers') {
            filename = 'merchant_customer_engagement.csv'
            exportData = filteredCustomers.map((cus) => ({
                'Customer ID': cus.id,
                'Name': cus.name,
                'Email': cus.email,
                'Phone': cus.phone,
                'Primary Branch': cus.branchVisited,
                'Stamp Card': cus.stampCard || '-',
                'Membership Tier': cus.membershipTier || '-',
                'Total Visits': cus.totalVisits,
                'Lifetime Spend': cus.lifetimeSpend,
                'Status': cus.status
            }))
        } else if (activeTab === 'staff') {
            filename = 'merchant_receptionist_stamps_leaderboard.csv'
            exportData = filteredAndRankedStaff.map((s, idx) => ({
                'Rank': idx + 1,
                'Staff ID': s.staffId,
                'Staff Name': s.name,
                'Branch': s.branchName,
                'Shift': s.shift,
                'Stamps Collected': s.stampsCollected || 0,
                'Rewards Processed': s.rewardsProcessed || 0,
                'Customers Served': s.customersServed || 0,
                'Est. Revenue': `$${s.totalSpendGenerated || 0}`,
                'Badge': s.badge || 'Staff',
                'Status': s.status
            }))
        }

        if (!exportData || exportData.length === 0) {
            toast.error('No report data to export for current selection')
            return
        }

        const headers = Object.keys(exportData[0])
        const csvContent = [
            headers.join(','),
            ...exportData.map((row) =>
                headers
                    .map((header) => {
                        let cell = row[header] === null || row[header] === undefined ? '' : String(row[header])
                        cell = cell.replace(/"/g, '""')
                        return `"${cell}"`
                    })
                    .join(',')
            )
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        toast.success(`Successfully exported ${exportData.length} records! 📊`)
    }

    return (
        <div style={{ paddingBottom: 60 }}>
            <style>{`
                @keyframes dealoraShimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .skeleton-text, .skeleton-avatar, .skeleton-shimmer {
                    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%) !important;
                    background-size: 200% 100% !important;
                    animation: dealoraShimmer 1.5s infinite linear !important;
                }
                .skeleton-row td {
                    border-bottom: 1px solid #f1f5f9;
                }
            `}</style>
            {/* HERO BANNER */}
            <div
                style={{
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                    borderRadius: 22,
                    padding: '24px 28px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                    marginBottom: 26,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16
                }}
            >
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.55rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                            Merchant Performance & Analytics Hub
                        </h2>
                        <span
                            style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                background: 'linear-gradient(135deg, #0E88B8 0%, #065B7D 100%)',
                                color: '#FFFFFF',
                                padding: '3px 12px',
                                borderRadius: 20,
                                letterSpacing: '0.5px',
                                textTransform: 'uppercase',
                                boxShadow: '0 2px 8px rgba(14, 136, 184, 0.3)'
                            }}
                        >
                            FirstLoop Intelligence
                        </span>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0, maxWidth: 720, lineHeight: 1.5 }}>
                        Holistic reporting across branch outlets, loyalty stamp passes, VIP memberships, customer footfall & receptionist operational audit trail.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={handleRefresh}
                        style={{
                            padding: '10px 16px',
                            borderRadius: 12,
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            background: '#FFFFFF',
                            border: '1.5px solid #CBD5E1',
                            color: 'var(--text-primary)',
                            cursor: 'pointer'
                        }}
                        title="Reload Live Analytics"
                    >
                        <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`} style={{ color: 'var(--firstloop-primary)' }} />
                        <span>Refresh</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => window.print()}
                        style={{
                            padding: '10px 16px',
                            borderRadius: 12,
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            background: '#FFFFFF',
                            border: '1.5px solid #CBD5E1',
                            color: 'var(--text-primary)',
                            cursor: 'pointer'
                        }}
                    >
                        <i className="fas fa-print" style={{ color: 'var(--text-muted)' }} />
                        <span>Print</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleExportCSV}
                        style={{
                            padding: '10px 20px',
                            borderRadius: 12,
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            background: 'linear-gradient(135deg, #0E88B8 0%, #065B7D 100%)',
                            color: '#FFFFFF',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(14, 136, 184, 0.35)'
                        }}
                    >
                        <i className="fas fa-file-download" />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* EXECUTIVE STATS KPI STRIP (WITH SKELETON SHIMMER SUPPORT) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 18, marginBottom: 26 }}>
                {/* Outlets & Staff */}
                <div className="card" style={{ padding: '20px 22px', borderRadius: 18, border: '1px solid rgba(14, 136, 184, 0.18)', background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Outlets & Staff
                        </span>
                        <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(14, 136, 184, 0.1)', color: 'var(--firstloop-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                            <i className="fas fa-store" />
                        </div>
                    </div>
                    {loading ? (
                        <>
                            <div className="skeleton-text" style={{ width: '130px', height: '26px', marginTop: 4 }} />
                            <div className="skeleton-text" style={{ width: '90px', height: '14px', marginTop: 8, display: 'block' }} />
                        </>
                    ) : (
                        <>
                            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                                {executiveStats.totalOutlets} Hubs • {executiveStats.totalStaff} Staff
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
                                100% Operational Status
                            </div>
                        </>
                    )}
                </div>

                {/* Stamps Distributed */}
                <div className="card" style={{ padding: '20px 22px', borderRadius: 18, border: '1px solid rgba(2, 132, 199, 0.18)', background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Stamps Distributed
                        </span>
                        <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(2, 132, 199, 0.1)', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                            <i className="fas fa-stamp" />
                        </div>
                    </div>
                    {loading ? (
                        <>
                            <div className="skeleton-text" style={{ width: '120px', height: '26px', marginTop: 4 }} />
                            <div className="skeleton-text" style={{ width: '100px', height: '14px', marginTop: 8, display: 'block' }} />
                        </>
                    ) : (
                        <>
                            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0284C7', letterSpacing: '-0.5px' }}>
                                {executiveStats.totalStamps.toLocaleString()} Stamps
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <i className="fas fa-arrow-up" /> Active Cards Tracked
                            </div>
                        </>
                    )}
                </div>

                {/* Rewards & Claims */}
                <div className="card" style={{ padding: '20px 22px', borderRadius: 18, border: '1px solid rgba(239, 0, 3, 0.18)', background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Rewards & Discounts
                        </span>
                        <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(239, 0, 3, 0.1)', color: '#EF0003', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                            <i className="fas fa-gift" />
                        </div>
                    </div>
                    {loading ? (
                        <>
                            <div className="skeleton-text" style={{ width: '110px', height: '26px', marginTop: 4 }} />
                            <div className="skeleton-text" style={{ width: '90px', height: '14px', marginTop: 8, display: 'block' }} />
                        </>
                    ) : (
                        <>
                            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#EF0003', letterSpacing: '-0.5px' }}>
                                {executiveStats.totalRedemptions} Claimed
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <i className="fas fa-check-circle" /> Verified Redemptions
                            </div>
                        </>
                    )}
                </div>

                {/* Member Revenue */}
                <div className="card" style={{ padding: '20px 22px', borderRadius: 18, border: '1px solid rgba(16, 185, 129, 0.18)', background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Member Gross Spend
                        </span>
                        <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                            <i className="fas fa-dollar-sign" />
                        </div>
                    </div>
                    {loading ? (
                        <>
                            <div className="skeleton-text" style={{ width: '125px', height: '26px', marginTop: 4 }} />
                            <div className="skeleton-text" style={{ width: '85px', height: '14px', marginTop: 8, display: 'block' }} />
                        </>
                    ) : (
                        <>
                            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#059669', letterSpacing: '-0.5px' }}>
                                {executiveStats.totalGrossSpend}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                                Total Transaction Volume
                            </div>
                        </>
                    )}
                </div>

                {/* Customer Retention */}
                <div className="card" style={{ padding: '20px 22px', borderRadius: 18, border: '1px solid rgba(217, 119, 6, 0.18)', background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Customer Retention
                        </span>
                        <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(217, 119, 6, 0.1)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                            <i className="fas fa-users" />
                        </div>
                    </div>
                    {loading ? (
                        <>
                            <div className="skeleton-text" style={{ width: '115px', height: '26px', marginTop: 4 }} />
                            <div className="skeleton-text" style={{ width: '95px', height: '14px', marginTop: 8, display: 'block' }} />
                        </>
                    ) : (
                        <>
                            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#D97706', letterSpacing: '-0.5px' }}>
                                {executiveStats.totalCustomers} Enrolled
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <i className="fas fa-redo-alt" /> Active Loyalty Base
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* SEGMENTED TAB NAVIGATION */}
            <div
                style={{
                    background: '#FFFFFF',
                    borderRadius: 16,
                    padding: 6,
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    overflowX: 'auto',
                    marginBottom: 24,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}
            >
                {/* 1. Branch Outlets Performance (FIRST TAB) */}
                <button
                    type="button"
                    onClick={() => {
                        setActiveTab('branches')
                        setCurrentPage(1)
                    }}
                    style={{
                        padding: '10px 18px',
                        borderRadius: 12,
                        fontSize: '0.86rem',
                        fontWeight: 800,
                        border: 'none',
                        background: activeTab === 'branches' ? 'linear-gradient(135deg, #0E88B8 0%, #065B7D 100%)' : 'transparent',
                        color: activeTab === 'branches' ? '#FFFFFF' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap',
                        boxShadow: activeTab === 'branches' ? '0 4px 12px rgba(14, 136, 184, 0.25)' : 'none'
                    }}
                >
                    <i className="fas fa-store" />
                    <span>Branch Outlets Performance</span>
                    <span
                        style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: 10,
                            background: activeTab === 'branches' ? 'rgba(255, 255, 255, 0.25)' : '#F1F5F9',
                            color: activeTab === 'branches' ? '#FFFFFF' : 'var(--text-muted)'
                        }}
                    >
                        {allBranches.length}
                    </span>
                </button>

                {/* 2. Redemption & Audit Logs (SECOND TAB) */}
                <button
                    type="button"
                    onClick={() => {
                        setActiveTab('logs')
                        setCurrentPage(1)
                    }}
                    style={{
                        padding: '10px 18px',
                        borderRadius: 12,
                        fontSize: '0.86rem',
                        fontWeight: 800,
                        border: 'none',
                        background: activeTab === 'logs' ? 'linear-gradient(135deg, #0E88B8 0%, #065B7D 100%)' : 'transparent',
                        color: activeTab === 'logs' ? '#FFFFFF' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap',
                        boxShadow: activeTab === 'logs' ? '0 4px 12px rgba(14, 136, 184, 0.25)' : 'none'
                    }}
                >
                    <i className="fas fa-clipboard-list" />
                    <span>Redemption & Audit Logs</span>
                    <span
                        style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: 10,
                            background: activeTab === 'logs' ? 'rgba(255, 255, 255, 0.25)' : '#F1F5F9',
                            color: activeTab === 'logs' ? '#FFFFFF' : 'var(--text-muted)'
                        }}
                    >
                        {filteredLogs.length}
                    </span>
                </button>

                {/* 3. Loyalty Cards & Tiers */}
                <button
                    type="button"
                    onClick={() => {
                        setActiveTab('cards')
                        setCurrentPage(1)
                    }}
                    style={{
                        padding: '10px 18px',
                        borderRadius: 12,
                        fontSize: '0.86rem',
                        fontWeight: 800,
                        border: 'none',
                        background: activeTab === 'cards' ? 'linear-gradient(135deg, #0E88B8 0%, #065B7D 100%)' : 'transparent',
                        color: activeTab === 'cards' ? '#FFFFFF' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap',
                        boxShadow: activeTab === 'cards' ? '0 4px 12px rgba(14, 136, 184, 0.25)' : 'none'
                    }}
                >
                    <i className="fas fa-id-card" />
                    <span>Loyalty Cards & Tiers</span>
                    <span
                        style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: 10,
                            background: activeTab === 'cards' ? 'rgba(255, 255, 255, 0.25)' : '#F1F5F9',
                            color: activeTab === 'cards' ? '#FFFFFF' : 'var(--text-muted)'
                        }}
                    >
                        {allCards.length}
                    </span>
                </button>

                {/* 4. Customer Engagement */}
                <button
                    type="button"
                    onClick={() => {
                        setActiveTab('customers')
                        setCurrentPage(1)
                    }}
                    style={{
                        padding: '10px 18px',
                        borderRadius: 12,
                        fontSize: '0.86rem',
                        fontWeight: 800,
                        border: 'none',
                        background: activeTab === 'customers' ? 'linear-gradient(135deg, #0E88B8 0%, #065B7D 100%)' : 'transparent',
                        color: activeTab === 'customers' ? '#FFFFFF' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap',
                        boxShadow: activeTab === 'customers' ? '0 4px 12px rgba(14, 136, 184, 0.25)' : 'none'
                    }}
                >
                    <i className="fas fa-users" />
                    <span>Customer Engagement</span>
                    <span
                        style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: 10,
                            background: activeTab === 'customers' ? 'rgba(255, 255, 255, 0.25)' : '#F1F5F9',
                            color: activeTab === 'customers' ? '#FFFFFF' : 'var(--text-muted)'
                        }}
                    >
                        {allCustomers.length}
                    </span>
                </button>

                {/* 5. Receptionist Activity & Stamps Leaderboard */}
                <button
                    type="button"
                    onClick={() => {
                        setActiveTab('staff')
                        setCurrentPage(1)
                    }}
                    style={{
                        padding: '10px 18px',
                        borderRadius: 12,
                        fontSize: '0.86rem',
                        fontWeight: 800,
                        border: 'none',
                        background: activeTab === 'staff' ? 'linear-gradient(135deg, #0E88B8 0%, #065B7D 100%)' : 'transparent',
                        color: activeTab === 'staff' ? '#FFFFFF' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap',
                        boxShadow: activeTab === 'staff' ? '0 4px 12px rgba(14, 136, 184, 0.25)' : 'none'
                    }}
                >
                    <i className="fas fa-user-tie" />
                    <span>Receptionist Activity & Stamps Leaderboard</span>
                    <span
                        style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: 10,
                            background: activeTab === 'staff' ? 'rgba(255, 255, 255, 0.25)' : '#F1F5F9',
                            color: activeTab === 'staff' ? '#FFFFFF' : 'var(--text-muted)'
                        }}
                    >
                        {allReceptionists.length}
                    </span>
                </button>
            </div>

            {/* FILTER TOOLBAR */}
            <div className="card mb-4" style={{ padding: '16px 20px', borderRadius: 16, border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Branch Outlet Selector */}
                        <div>
                            <label style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 4, display: 'block', textTransform: 'uppercase' }}>
                                Filter Branch
                            </label>
                            <select
                                className="form-select"
                                value={selectedBranch}
                                onChange={(e) => {
                                    setSelectedBranch(e.target.value)
                                    setCurrentPage(1)
                                }}
                                style={{ height: 38, borderRadius: 10, fontSize: '0.85rem', minWidth: 200, fontWeight: 600 }}
                            >
                                <option value="all">All Merchant Branches</option>
                                {allBranches.map((b) => (
                                    <option key={b.id} value={b.name}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* BRANCH RANKING DROPDOWN (BRANCHES TAB ONLY) */}
                        {activeTab === 'branches' && (
                            <div>
                                <label style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--firstloop-primary)', marginBottom: 4, display: 'block', textTransform: 'uppercase' }}>
                                    <i className="fas fa-sort-amount-down" style={{ marginRight: 4 }} /> Rank / Filter Outlets
                                </label>
                                <select
                                    className="form-select"
                                    value={branchSortFilter}
                                    onChange={(e) => setBranchSortFilter(e.target.value)}
                                    style={{
                                        height: 38,
                                        borderRadius: 10,
                                        fontSize: '0.85rem',
                                        minWidth: 230,
                                        fontWeight: 800,
                                        border: '1.5px solid var(--firstloop-primary)',
                                        color: 'var(--firstloop-primary)',
                                        background: 'rgba(14, 136, 184, 0.04)'
                                    }}
                                >
                                    <option value="all">All Outlets (Default)</option>
                                    <option value="large_stamp">Largest Stamp Card Volume (Stamps)</option>
                                    <option value="large_membership">Most Membership Cards (VIP Members)</option>
                                    <option value="highest_spend">Highest Customer Spend / Revenue ($)</option>
                                    <option value="highest_footfall">Highest Customer Footfall (Visits)</option>
                                </select>
                            </div>
                        )}

                        {/* STAFF SORT DROPDOWN (STAFF TAB ONLY) */}
                        {activeTab === 'staff' && (
                            <div>
                                <label style={{ fontSize: '0.74rem', fontWeight: 800, color: '#D97706', marginBottom: 4, display: 'block', textTransform: 'uppercase' }}>
                                    <i className="fas fa-trophy" style={{ marginRight: 4 }} /> Staff Ranking Metric
                                </label>
                                <select
                                    className="form-select"
                                    value={staffSortFilter}
                                    onChange={(e) => setStaffSortFilter(e.target.value)}
                                    style={{
                                        height: 38,
                                        borderRadius: 10,
                                        fontSize: '0.85rem',
                                        minWidth: 220,
                                        fontWeight: 800,
                                        border: '1.5px solid #D97706',
                                        color: '#B45309',
                                        background: 'rgba(245, 158, 11, 0.04)'
                                    }}
                                >
                                    <option value="stamps_desc">Most Stamps Collected (Highest First)</option>
                                    <option value="rewards_desc">Most Rewards Processed</option>
                                    <option value="customers_desc">Most Customers Served</option>
                                    <option value="name">Staff Name (A to Z)</option>
                                </select>
                            </div>
                        )}

                        {/* Date Range Selector */}
                        <div>
                            <label style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 4, display: 'block', textTransform: 'uppercase' }}>
                                Date Period
                            </label>
                            <select
                                className="form-select"
                                value={dateRange}
                                onChange={(e) => {
                                    setDateRange(e.target.value)
                                    setCurrentPage(1)
                                }}
                                style={{ height: 38, borderRadius: 10, fontSize: '0.85rem', minWidth: 150, fontWeight: 600 }}
                            >
                                <option value="7">Last 7 Days</option>
                                <option value="30">Last 30 Days</option>
                                <option value="90">Last 90 Days</option>
                                <option value="365">This Year (2026)</option>
                                <option value="all">All Historical Time</option>
                            </select>
                        </div>

                        {/* Card Category Selector */}
                        <div>
                            <label style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 4, display: 'block', textTransform: 'uppercase' }}>
                                Card Category
                            </label>
                            <select
                                className="form-select"
                                value={selectedCardType}
                                onChange={(e) => {
                                    setSelectedCardType(e.target.value)
                                    setCurrentPage(1)
                                }}
                                style={{ height: 38, borderRadius: 10, fontSize: '0.85rem', minWidth: 160, fontWeight: 600 }}
                            >
                                <option value="all">All Card Types</option>
                                <option value="stamp">Stamp Cards Only</option>
                                <option value="membership">Membership Tiers Only</option>
                            </select>
                        </div>

                        {/* Rows per page for logs table */}
                        {activeTab === 'logs' && (
                            <div>
                                <label style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 4, display: 'block', textTransform: 'uppercase' }}>
                                    Per Page
                                </label>
                                <select
                                    className="form-select"
                                    value={rowsPerPage}
                                    onChange={(e) => {
                                        setRowsPerPage(Number(e.target.value))
                                        setCurrentPage(1)
                                    }}
                                    style={{ height: 38, borderRadius: 10, fontSize: '0.85rem', width: 85, fontWeight: 600 }}
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Live Search Input */}
                    <div style={{ position: 'relative', minWidth: 260, flexGrow: 1, maxWidth: 360 }}>
                        <i
                            className="fas fa-search"
                            style={{
                                position: 'absolute',
                                left: 14,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-muted)'
                            }}
                        />
                        <input
                            type="text"
                            className="form-control"
                            placeholder={
                                activeTab === 'branches'
                                    ? 'Search branch, city, manager...'
                                    : activeTab === 'logs'
                                    ? 'Search customer, action, staff, card...'
                                    : activeTab === 'cards'
                                    ? 'Search loyalty card name, perk...'
                                    : activeTab === 'customers'
                                    ? 'Search customer, email, tier...'
                                    : 'Search receptionist name, shift, ID...'
                            }
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setCurrentPage(1)
                            }}
                            style={{ paddingLeft: 38, height: 38, borderRadius: 10, fontSize: '0.85rem' }}
                        />
                    </div>
                </div>
            </div>

            {/* TAB 1: BRANCH OUTLETS PERFORMANCE (FIRST TAB) */}
            {activeTab === 'branches' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Quick Filter Tag Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>Quick Filters:</span>

                        <button
                            type="button"
                            onClick={() => setBranchSortFilter('all')}
                            style={{
                                borderRadius: 10,
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                background: branchSortFilter === 'all' ? '#0F172A' : '#F1F5F9',
                                color: branchSortFilter === 'all' ? '#FFFFFF' : 'var(--text-secondary)',
                                border: 'none',
                                padding: '7px 16px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            All Outlets ({allBranches.length})
                        </button>

                        <button
                            type="button"
                            onClick={() => setBranchSortFilter('large_stamp')}
                            style={{
                                borderRadius: 10,
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                background: branchSortFilter === 'large_stamp' ? '#0284C7' : 'rgba(2, 132, 199, 0.1)',
                                color: branchSortFilter === 'large_stamp' ? '#FFFFFF' : '#0284C7',
                                border: 'none',
                                padding: '7px 16px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <i className="fas fa-stamp" />
                            <span>Largest Stamp Card Volume</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setBranchSortFilter('large_membership')}
                            style={{
                                borderRadius: 10,
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                background: branchSortFilter === 'large_membership' ? '#D97706' : 'rgba(245, 158, 11, 0.1)',
                                color: branchSortFilter === 'large_membership' ? '#FFFFFF' : '#D97706',
                                border: 'none',
                                padding: '7px 16px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <i className="fas fa-crown" />
                            <span>Most VIP Memberships</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setBranchSortFilter('highest_spend')}
                            style={{
                                borderRadius: 10,
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                background: branchSortFilter === 'highest_spend' ? '#059669' : 'rgba(16, 185, 129, 0.1)',
                                color: branchSortFilter === 'highest_spend' ? '#FFFFFF' : '#059669',
                                border: 'none',
                                padding: '7px 16px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <i className="fas fa-dollar-sign" />
                            <span>Highest Customer Spend</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setBranchSortFilter('highest_footfall')}
                            style={{
                                borderRadius: 10,
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                background: branchSortFilter === 'highest_footfall' ? '#6366F1' : 'rgba(99, 102, 241, 0.1)',
                                color: branchSortFilter === 'highest_footfall' ? '#FFFFFF' : '#6366F1',
                                border: 'none',
                                padding: '7px 16px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <i className="fas fa-shoe-prints" />
                            <span>Highest Footfall (Visits)</span>
                        </button>
                    </div>

                    {/* SKELETON SKIN FOR BRANCH CARDS */}
                    {loading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 22 }}>
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="card" style={{ padding: 24, borderRadius: 22, border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                                        <div className="skeleton-avatar" style={{ width: 50, height: 50, borderRadius: 16 }} />
                                        <div style={{ flex: 1 }}>
                                            <div className="skeleton-text" style={{ width: '60%', height: '18px', marginBottom: 6 }} />
                                            <div className="skeleton-text" style={{ width: '40%', height: '12px' }} />
                                        </div>
                                    </div>
                                    <div style={{ height: 75, background: '#F8FAFC', borderRadius: 16, padding: 12, display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: 16 }}>
                                        <div className="skeleton-text" style={{ width: '60px', height: '28px' }} />
                                        <div className="skeleton-text" style={{ width: '60px', height: '28px' }} />
                                        <div className="skeleton-text" style={{ width: '60px', height: '28px' }} />
                                    </div>
                                    <div className="skeleton-text" style={{ width: '100%', height: '8px', marginBottom: 16 }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: 14 }}>
                                        <div className="skeleton-text" style={{ width: '100px', height: '32px', borderRadius: 8 }} />
                                        <div className="skeleton-text" style={{ width: '120px', height: '32px', borderRadius: 8 }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 22 }}>
                            {sortedAndFilteredBranches.map((branch) => {
                                const receptionistsInBranch = allReceptionists.filter((r) => r.branchName === branch.name || r.branchId === branch.id)
                                const logsInBranch = allLogs.filter((l) => l.branch === branch.name || l.branchId === branch.id)
                                const maxStamps = Math.max(...allBranches.map(b => b.stampsIssued || 0))
                                const maxSpend = Math.max(...allBranches.map(b => b.totalSpend || 0))
                                const isTopStamps = maxStamps > 0 && branch.stampsIssued === maxStamps
                                const isTopSpend = maxSpend > 0 && branch.totalSpend === maxSpend

                                return (
                                    <div
                                        key={branch.id}
                                        className="card"
                                        style={{
                                            padding: 24,
                                            borderRadius: 22,
                                            border: '1px solid #E2E8F0',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            background: '#FFFFFF',
                                            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                                        }}
                                    >
                                        <div>
                                            {/* Card Top */}
                                            <div className="flex-between mb-3" style={{ alignItems: 'flex-start' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                                    <div
                                                        style={{
                                                            width: 50,
                                                            height: 50,
                                                            borderRadius: 16,
                                                            background: 'linear-gradient(135deg, rgba(14, 136, 184, 0.12) 0%, rgba(2, 132, 199, 0.08) 100%)',
                                                            color: 'var(--firstloop-primary, #0E88B8)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '1.35rem',
                                                            fontWeight: 900,
                                                            boxShadow: '0 2px 8px rgba(14, 136, 184, 0.15)'
                                                        }}
                                                    >
                                                        <i className="fas fa-store" />
                                                    </div>
                                                    <div>
                                                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                                            {branch.name}
                                                        </h4>
                                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                                            <i className="fas fa-map-marker-alt" style={{ marginRight: 4, color: 'var(--firstloop-primary)' }} />
                                                            {branch.city}, {branch.state}
                                                        </small>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                                    <span className="badge" style={{ background: 'var(--status-success-bg, #DCFCE7)', color: 'var(--status-success, #16A34A)', fontWeight: 800, padding: '4px 10px', borderRadius: 8 }}>
                                                        {branch.status}
                                                    </span>
                                                    {isTopStamps && (
                                                        <span className="badge" style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#0284C7', fontWeight: 800, fontSize: '0.7rem' }}>
                                                            🏆 #1 Stamp Volume
                                                        </span>
                                                    )}
                                                    {isTopSpend && (
                                                        <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', fontWeight: 800, fontSize: '0.7rem' }}>
                                                            💰 Top Revenue Hub
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Multi-Metric Performance Grid */}
                                            <div
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                                    gap: 8,
                                                    background: '#F8FAFC',
                                                    padding: '16px 14px',
                                                    borderRadius: 16,
                                                    margin: '16px 0',
                                                    border: '1px solid #E2E8F0'
                                                }}
                                            >
                                                <div style={{ textAlign: 'center' }}>
                                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block', fontWeight: 800, letterSpacing: '0.4px' }}>
                                                        STAMPS ISSUED
                                                    </small>
                                                    <strong style={{ fontSize: '1.25rem', color: '#0284C7', fontWeight: 900 }}>
                                                        {(branch.stampsIssued || 0).toLocaleString()}
                                                    </strong>
                                                </div>

                                                <div style={{ textAlign: 'center', borderLeft: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0' }}>
                                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block', fontWeight: 800, letterSpacing: '0.4px' }}>
                                                        VIP MEMBERS
                                                    </small>
                                                    <strong style={{ fontSize: '1.25rem', color: '#D97706', fontWeight: 900 }}>
                                                        {branch.membershipCount || 0}
                                                    </strong>
                                                </div>

                                                <div style={{ textAlign: 'center' }}>
                                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block', fontWeight: 800, letterSpacing: '0.4px' }}>
                                                        TOTAL SPEND
                                                    </small>
                                                    <strong style={{ fontSize: '1.25rem', color: '#059669', fontWeight: 900 }}>
                                                        ${(branch.totalSpend || 0).toLocaleString()}
                                                    </strong>
                                                </div>
                                            </div>

                                            {/* Progress Bar for Volume Share */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '14px 0' }}>
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>
                                                        <span style={{ color: 'var(--text-secondary)' }}>Stamp Volume Share:</span>
                                                        <span style={{ color: '#0284C7' }}>{Math.round(((branch.stampsIssued || 0) / 2596) * 100)}% of Network</span>
                                                    </div>
                                                    <div style={{ height: 7, background: '#F1F5F9', borderRadius: 6, overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${Math.round(((branch.stampsIssued || 0) / 2596) * 100)}%`, background: 'linear-gradient(90deg, #0284C7 0%, #0E88B8 100%)', borderRadius: 6 }} />
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700 }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>Customer Footfall:</span>
                                                    <span style={{ color: 'var(--text-primary)' }}>{branch.customerFootfall || 0} Visits • {branch.rewardsClaimed || 0} Claims</span>
                                                </div>
                                            </div>

                                            {/* Manager & Staff Details */}
                                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', paddingTop: 6 }}>
                                                <span>Manager: <strong>{branch.manager}</strong></span>
                                                <span>Staff: <strong style={{ color: 'var(--firstloop-primary)' }}>{receptionistsInBranch.length} Receptionists</strong></span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div style={{ marginTop: 20, borderTop: '1px solid #E2E8F0', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/merchant/branches`)}
                                                style={{
                                                    borderRadius: 10,
                                                    fontSize: '0.8rem',
                                                    fontWeight: 800,
                                                    padding: '7px 14px',
                                                    background: '#FFFFFF',
                                                    border: '1.5px solid #CBD5E1',
                                                    color: 'var(--text-primary)',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <i className="fas fa-external-link-alt" style={{ marginRight: 6 }} /> Manage Outlet
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedBranch(branch.name)
                                                    setActiveTab('logs')
                                                    setCurrentPage(1)
                                                }}
                                                style={{
                                                    borderRadius: 10,
                                                    fontSize: '0.8rem',
                                                    fontWeight: 800,
                                                    background: 'linear-gradient(135deg, #0E88B8 0%, #065B7D 100%)',
                                                    color: '#FFFFFF',
                                                    border: 'none',
                                                    padding: '7px 16px',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 2px 8px rgba(14, 136, 184, 0.25)'
                                                }}
                                            >
                                                <i className="fas fa-filter" style={{ marginRight: 6 }} /> View Branch Logs ({logsInBranch.length})
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Detailed Branch Comparison Table */}
                    <div className="card" style={{ padding: 0, borderRadius: 18, overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <div style={{ padding: '18px 24px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                    Comprehensive Outlet Performance Breakdown
                                </h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                                    Comparative analysis of stamps collected, VIP cards, customer spend & visits per branch
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleExportCSV}
                                style={{
                                    borderRadius: 10,
                                    fontSize: '0.8rem',
                                    fontWeight: 800,
                                    padding: '6px 14px',
                                    background: '#FFFFFF',
                                    border: '1px solid #CBD5E1',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer'
                                }}
                            >
                                <i className="fas fa-download" style={{ marginRight: 6 }} /> Export Branch CSV
                            </button>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.86rem' }}>
                                <thead style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                                    <tr>
                                        <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Branch Location</th>
                                        <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Manager & Contact</th>
                                        <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Stamps Issued</th>
                                        <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>VIP Members</th>
                                        <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Customer Spend</th>
                                        <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Footfall</th>
                                        <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Active Staff</th>
                                        <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <tr key={i} className="skeleton-row">
                                                <td style={{ padding: '16px 20px' }}><div className="skeleton-text" style={{ width: '140px', height: '16px' }} /></td>
                                                <td style={{ padding: '16px 20px' }}><div className="skeleton-text" style={{ width: '100px', height: '14px' }} /></td>
                                                <td style={{ padding: '16px 20px', textAlign: 'center' }}><div className="skeleton-text" style={{ width: '60px', height: '18px' }} /></td>
                                                <td style={{ padding: '16px 20px', textAlign: 'center' }}><div className="skeleton-text" style={{ width: '50px', height: '18px' }} /></td>
                                                <td style={{ padding: '16px 20px', textAlign: 'center' }}><div className="skeleton-text" style={{ width: '70px', height: '16px' }} /></td>
                                                <td style={{ padding: '16px 20px', textAlign: 'center' }}><div className="skeleton-text" style={{ width: '60px', height: '14px' }} /></td>
                                                <td style={{ padding: '16px 20px', textAlign: 'center' }}><div className="skeleton-text" style={{ width: '50px', height: '14px' }} /></td>
                                                <td style={{ padding: '16px 20px', textAlign: 'right' }}><div className="skeleton-text" style={{ width: '60px', height: '18px' }} /></td>
                                            </tr>
                                        ))
                                    ) : (
                                        sortedAndFilteredBranches.map((b) => (
                                            <tr key={b.id}>
                                                <td style={{ padding: '14px 20px' }}>
                                                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>{b.name}</strong>
                                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>{b.address}</small>
                                                </td>
                                                <td style={{ padding: '14px 20px' }}>
                                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{b.manager}</div>
                                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{b.phone}</small>
                                                </td>
                                                <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                                                    <span className="badge" style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#0284C7', fontWeight: 800, fontSize: '0.86rem' }}>
                                                        {(b.stampsIssued || 0).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                                                    <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#D97706', fontWeight: 800, fontSize: '0.86rem' }}>
                                                        {b.membershipCount || 0}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                                                    <strong style={{ color: '#059669', fontSize: '0.95rem' }}>
                                                        ${(b.totalSpend || 0).toLocaleString()}
                                                    </strong>
                                                </td>
                                                <td style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 700 }}>
                                                    {b.customerFootfall || 0} Visits
                                                </td>
                                                <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                                                    <span style={{ fontWeight: 700, color: 'var(--firstloop-primary)' }}>
                                                        {b.receptionistsCount} Staff
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                                    <span className="badge" style={{ background: 'var(--status-success-bg, #DCFCE7)', color: 'var(--status-success, #16A34A)', fontWeight: 800, padding: '4px 10px' }}>
                                                        {b.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: REDEMPTION & AUDIT TRANSACTION LOGS (SECOND TAB) */}
            {activeTab === 'logs' && (
                <>
                    {/* VISUAL BREAKDOWN CHARTS */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 22, marginBottom: 24 }}>
                        {/* Stamp Pass Utilization Breakdown */}
                        <div className="card" style={{ padding: 22, borderRadius: 20, border: '1px solid rgba(14, 136, 184, 0.15)', background: '#FFFFFF' }}>
                            <div className="flex-between mb-3">
                                <div>
                                    {loading ? (
                                        <>
                                            <div className="skeleton-text" style={{ width: '180px', height: '18px', marginBottom: 6 }} />
                                            <div className="skeleton-text" style={{ width: '220px', height: '12px' }} />
                                        </>
                                    ) : (
                                        <>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                                Stamp Card Utilization Share
                                            </h3>
                                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                                                Stamps issued and active pass distribution
                                            </p>
                                        </>
                                    )}
                                </div>
                                {loading ? (
                                    <div className="skeleton-text" style={{ width: '90px', height: '24px', borderRadius: 20 }} />
                                ) : (
                                    <span className="badge" style={{ background: 'rgba(14, 136, 184, 0.1)', color: 'var(--firstloop-primary)', fontWeight: 800 }}>
                                        Active Loyalty
                                    </span>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 14 }}>
                                {loading ? (
                                    [1, 2, 3].map((k) => (
                                        <div key={k}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                <div className="skeleton-text" style={{ width: '120px', height: '14px' }} />
                                                <div className="skeleton-text" style={{ width: '70px', height: '14px' }} />
                                            </div>
                                            <div className="skeleton-text" style={{ width: '100%', height: '10px', borderRadius: 6 }} />
                                        </div>
                                    ))
                                ) : (
                                    stampCards.slice(0, 5).map((card, idx) => {
                                        const totalStampsAll = stampCards.reduce((s, c) => s + (c.stamps_given || 0), 0) || 1
                                        const pct = Math.max(Math.round(((card.stamps_given || 0) / totalStampsAll) * 100), 5)
                                        const accent = idx === 0 ? '#EF0003' : idx === 1 ? '#0284C7' : '#D97706'
                                        return (
                                            <div key={card.id}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 700, marginBottom: 6 }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                        <i className={`fas ${card.icon || 'fa-stamp'}`} style={{ color: accent }} />
                                                        {card.title}
                                                    </span>
                                                    <span style={{ color: accent }}>
                                                        {card.stamps_given || 0} stamps ({pct}%)
                                                    </span>
                                                </div>
                                                <div style={{ height: 10, background: '#F1F5F9', borderRadius: 6, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${pct}%`, background: accent, borderRadius: 6 }} />
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>

                        {/* Membership Tier Distribution */}
                        <div className="card" style={{ padding: 22, borderRadius: 20, border: '1px solid rgba(14, 136, 184, 0.15)', background: '#FFFFFF' }}>
                            <div className="flex-between mb-3">
                                <div>
                                    {loading ? (
                                        <>
                                            <div className="skeleton-text" style={{ width: '180px', height: '18px', marginBottom: 6 }} />
                                            <div className="skeleton-text" style={{ width: '200px', height: '12px' }} />
                                        </>
                                    ) : (
                                        <>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                                Membership VIP Tier Share
                                            </h3>
                                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                                                Active enrolled members across tiers
                                            </p>
                                        </>
                                    )}
                                </div>
                                {loading ? (
                                    <div className="skeleton-text" style={{ width: '90px', height: '24px', borderRadius: 20 }} />
                                ) : (
                                    <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#D97706', fontWeight: 800 }}>
                                        {membershipCards.reduce((s, c) => s + (c.activeMembers || 0), 0)} Members
                                    </span>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                                {loading ? (
                                    [1, 2, 3].map((k) => (
                                        <div
                                            key={k}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '12px 16px',
                                                borderRadius: 14,
                                                background: '#F8FAFC'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div className="skeleton-avatar" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                                                <div>
                                                    <div className="skeleton-text" style={{ width: '90px', height: '14px', marginBottom: 4 }} />
                                                    <div className="skeleton-text" style={{ width: '130px', height: '11px' }} />
                                                </div>
                                            </div>
                                            <div className="skeleton-text" style={{ width: '45px', height: '16px' }} />
                                        </div>
                                    ))
                                ) : (
                                    membershipCards.map((tier) => {
                                        const totalMembers = membershipCards.reduce((s, c) => s + (c.activeMembers || 0), 0) || 1
                                        const pct = `${Math.round(((tier.activeMembers || 0) / totalMembers) * 100)}%`
                                        const isGold = (tier.tier || '').toLowerCase().includes('gold') || (tier.name || '').toLowerCase().includes('gold')
                                        const bg = isGold ? 'rgba(245, 158, 11, 0.1)' : 'rgba(14, 136, 184, 0.1)'
                                        const color = isGold ? '#D97706' : 'var(--firstloop-primary)'
                                        const icon = isGold ? 'fa-crown' : 'fa-award'

                                        return (
                                            <div
                                                key={tier.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '12px 16px',
                                                    borderRadius: 14,
                                                    background: bg
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <i className={`fas ${icon}`} style={{ color: color, fontSize: '1.15rem' }} />
                                                    <div>
                                                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: color }}>{tier.name || tier.title}</div>
                                                        <small style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                            {tier.activeMembers || 0} Enrolled • Pass: {tier.validityMonths || tier.month || 'VIP'}
                                                        </small>
                                                    </div>
                                                </div>
                                                <span style={{ fontWeight: 900, fontSize: '0.95rem', color: color }}>{pct}</span>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* DETAILED TRANSACTION LOG TABLE */}
                    <div className="card" style={{ padding: 0, borderRadius: 18, overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <div style={{ padding: '18px 24px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                    Activity, Stamp & Redemption Audit Trail
                                </h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                                    Showing {paginatedLogs.length} of {filteredLogs.length} transaction entries
                                </p>
                            </div>

                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                Page {currentPage} of {totalPages}
                            </span>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.86rem' }}>
                                <thead style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                                    <tr>
                                        <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Timestamp & ID</th>
                                        <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer</th>
                                        <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Branch Location</th>
                                        <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Card & Type</th>
                                        <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Action & Staff</th>
                                        <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reward / Savings</th>
                                        <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                                        <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        Array.from({ length: 6 }).map((_, i) => (
                                            <tr key={i} className="skeleton-row">
                                                <td style={{ padding: '16px 20px' }}>
                                                    <div className="skeleton-text" style={{ width: '90px', height: '14px', marginBottom: 4 }} />
                                                    <div className="skeleton-text" style={{ width: '60px', height: '12px' }} />
                                                </td>
                                                <td style={{ padding: '16px 20px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <div className="skeleton-avatar" style={{ width: 34, height: 34 }} />
                                                        <div>
                                                            <div className="skeleton-text" style={{ width: '100px', height: '14px', marginBottom: 4 }} />
                                                            <div className="skeleton-text" style={{ width: '70px', height: '11px' }} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 20px' }}><div className="skeleton-text" style={{ width: '120px', height: '14px' }} /></td>
                                                <td style={{ padding: '16px 20px' }}><div className="skeleton-text" style={{ width: '90px', height: '16px' }} /></td>
                                                <td style={{ padding: '16px 20px' }}><div className="skeleton-text" style={{ width: '110px', height: '14px' }} /></td>
                                                <td style={{ padding: '16px 20px' }}><div className="skeleton-text" style={{ width: '80px', height: '14px' }} /></td>
                                                <td style={{ padding: '16px 20px' }}><div className="skeleton-text" style={{ width: '65px', height: '18px' }} /></td>
                                                <td style={{ padding: '16px 20px', textAlign: 'right' }}><div className="skeleton-text" style={{ width: '55px', height: '24px', borderRadius: 6 }} /></td>
                                            </tr>
                                        ))
                                    ) : paginatedLogs.length > 0 ? (
                                        paginatedLogs.map((tx) => {
                                            const isStamp = tx.cardType === 'Stamp Card'
                                            return (
                                                <tr key={tx.id}>
                                                    <td style={{ padding: '14px 20px' }}>
                                                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>{tx.date}</span>
                                                        <code style={{ fontSize: '0.74rem', color: 'var(--text-muted)', background: '#F1F5F9', padding: '2px 6px', borderRadius: 4 }}>
                                                            {tx.id.toUpperCase()}
                                                        </code>
                                                    </td>
                                                    <td style={{ padding: '14px 20px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <div
                                                                style={{
                                                                    width: 34,
                                                                    height: 34,
                                                                    borderRadius: '50%',
                                                                    background: 'var(--firstloop-primary-light)',
                                                                    color: 'var(--firstloop-primary)',
                                                                    fontWeight: 800,
                                                                    fontSize: '0.82rem',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}
                                                            >
                                                                {tx.customer.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>{tx.customer}</span>
                                                                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{tx.customerEmail || '-'}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '14px 20px' }}>
                                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tx.branch}</span>
                                                    </td>
                                                    <td style={{ padding: '14px 20px' }}>
                                                        <span
                                                            className="badge mb-1"
                                                            style={{
                                                                background: isStamp ? 'rgba(239, 0, 3, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                                color: isStamp ? '#EF0003' : '#D97706',
                                                                fontWeight: 800,
                                                                display: 'inline-block'
                                                            }}
                                                        >
                                                            {tx.cardType}
                                                        </span>
                                                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{tx.cardName}</div>
                                                    </td>
                                                    <td style={{ padding: '14px 20px' }}>
                                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{tx.action}</div>
                                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                            <i className="fas fa-user-check" style={{ color: 'var(--firstloop-primary)' }} />
                                                            {tx.staff}
                                                        </small>
                                                    </td>
                                                    <td style={{ padding: '14px 20px' }}>
                                                        <span
                                                            style={{
                                                                fontWeight: 700,
                                                                color: tx.rewardUnlocked === 'None' ? 'var(--text-muted)' : 'var(--firstloop-primary)'
                                                            }}
                                                        >
                                                            {tx.rewardUnlocked}
                                                        </span>
                                                        {tx.amount && tx.amount !== '$0.00' && (
                                                            <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700 }}>
                                                                Order: {tx.amount}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '14px 20px' }}>
                                                        <span
                                                            className="badge"
                                                            style={{
                                                                background:
                                                                    tx.status === 'Redeemed'
                                                                        ? 'rgba(239, 0, 3, 0.1)'
                                                                        : tx.status === 'Verified'
                                                                        ? 'rgba(14, 136, 184, 0.1)'
                                                                        : 'var(--status-success-bg, #DCFCE7)',
                                                                color:
                                                                    tx.status === 'Redeemed'
                                                                        ? '#EF0003'
                                                                        : tx.status === 'Verified'
                                                                        ? 'var(--firstloop-primary)'
                                                                        : 'var(--status-success, #16A34A)',
                                                                fontWeight: 800,
                                                                padding: '4px 10px',
                                                                borderRadius: 8
                                                            }}
                                                        >
                                                            {tx.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedLog(tx)}
                                                            style={{
                                                                borderRadius: 8,
                                                                fontSize: '0.78rem',
                                                                padding: '5px 12px',
                                                                fontWeight: 700,
                                                                background: '#F1F5F9',
                                                                border: 'none',
                                                                color: 'var(--text-primary)',
                                                                cursor: 'pointer'
                                                            }}
                                                            title="View Transaction Details"
                                                        >
                                                            <i className="fas fa-eye" style={{ marginRight: 4 }} />
                                                            Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                                                <i className="fas fa-search" style={{ fontSize: '2rem', marginBottom: 10, color: '#CBD5E1' }} />
                                                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem' }}>No activity logs matching the selected filters</p>
                                                <small style={{ color: 'var(--text-muted)' }}>Try resetting the search query or changing date range / branch selection</small>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div
                                style={{
                                    padding: '14px 24px',
                                    background: '#F8FAFC',
                                    borderTop: '1px solid #E2E8F0',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: 10
                                }}
                            >
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                    Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
                                </span>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <button
                                        type="button"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        style={{
                                            borderRadius: 8,
                                            padding: '5px 14px',
                                            fontSize: '0.8rem',
                                            fontWeight: 700,
                                            background: '#FFFFFF',
                                            border: '1px solid #CBD5E1',
                                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                            opacity: currentPage === 1 ? 0.5 : 1
                                        }}
                                    >
                                        <i className="fas fa-chevron-left" /> Prev
                                    </button>

                                    {Array.from({ length: totalPages }).map((_, idx) => {
                                        const pageNum = idx + 1
                                        const isActive = pageNum === currentPage
                                        return (
                                            <button
                                                key={pageNum}
                                                type="button"
                                                onClick={() => setCurrentPage(pageNum)}
                                                style={{
                                                    width: 34,
                                                    height: 34,
                                                    borderRadius: 8,
                                                    border: 'none',
                                                    background: isActive ? 'var(--firstloop-primary)' : 'transparent',
                                                    color: isActive ? '#FFFFFF' : 'var(--text-primary)',
                                                    fontWeight: 800,
                                                    fontSize: '0.84rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {pageNum}
                                            </button>
                                        )
                                    })}

                                    <button
                                        type="button"
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        style={{
                                            borderRadius: 8,
                                            padding: '5px 14px',
                                            fontSize: '0.8rem',
                                            fontWeight: 700,
                                            background: '#FFFFFF',
                                            border: '1px solid #CBD5E1',
                                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                            opacity: currentPage === totalPages ? 0.5 : 1
                                        }}
                                    >
                                        Next <i className="fas fa-chevron-right" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* TAB 3: LOYALTY CARDS & MEMBERSHIP TIERS REPORT */}
            {activeTab === 'cards' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Program Metrics Summary Strip */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="card" style={{ padding: '18px 20px', borderRadius: 16, border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                                    <div className="skeleton-text" style={{ width: '100px', height: '14px', marginBottom: 10 }} />
                                    <div className="skeleton-text" style={{ width: '80px', height: '24px', marginBottom: 6 }} />
                                    <div className="skeleton-text" style={{ width: '130px', height: '12px' }} />
                                </div>
                            ))
                        ) : (
                            <>
                                <div className="card" style={{ padding: '18px 20px', borderRadius: 16, border: '1px solid rgba(239, 0, 3, 0.2)', background: '#FFFFFF' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Stamp Programs</span>
                                        <i className="fas fa-stamp" style={{ color: '#EF0003' }} />
                                    </div>
                                    <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                                        {stampCards.length} Active Passes
                                    </div>
                                    <small style={{ color: '#059669', fontWeight: 700, fontSize: '0.74rem' }}>
                                        <i className="fas fa-check-circle" style={{ marginRight: 4 }} />
                                        98% Customer redemption rate
                                    </small>
                                </div>

                                <div className="card" style={{ padding: '18px 20px', borderRadius: 16, border: '1px solid rgba(245, 158, 11, 0.25)', background: '#FFFFFF' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>VIP Member Tiers</span>
                                        <i className="fas fa-crown" style={{ color: '#D97706' }} />
                                    </div>
                                    <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                                        {membershipCards.length} Premium Tiers
                                    </div>
                                    <small style={{ color: '#D97706', fontWeight: 700, fontSize: '0.74rem' }}>
                                        <i className="fas fa-users" style={{ marginRight: 4 }} />
                                        {membershipCards.reduce((s, c) => s + (c.activeMembers || 0), 0)} Enrolled VIP Customers
                                    </small>
                                </div>

                                <div className="card" style={{ padding: '18px 20px', borderRadius: 16, border: '1px solid rgba(14, 136, 184, 0.2)', background: '#FFFFFF' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rewards Claimed</span>
                                        <i className="fas fa-gift" style={{ color: 'var(--firstloop-primary)' }} />
                                    </div>
                                    <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                                        {executiveStats.totalRedemptions} Rewards
                                    </div>
                                    <small style={{ color: 'var(--firstloop-primary)', fontWeight: 700, fontSize: '0.74rem' }}>
                                        <i className="fas fa-chart-line" style={{ marginRight: 4 }} />
                                        Verified in audit trail
                                    </small>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Stamp Cards Section */}
                    <div>
                        <div className="flex-between mb-3">
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                Stamp Loyalty Cards Performance
                            </h3>
                            <button
                                type="button"
                                onClick={() => navigate('/merchant/cards')}
                                style={{
                                    borderRadius: 10,
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    padding: '6px 14px',
                                    background: '#FFFFFF',
                                    border: '1px solid #CBD5E1',
                                    cursor: 'pointer'
                                }}
                            >
                                <i className="fas fa-arrow-right" style={{ marginRight: 6 }} /> Manage in Cards Page
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="card" style={{ padding: 22, borderRadius: 18, border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                                        <div className="skeleton-text" style={{ width: '80px', height: '16px', marginBottom: 10 }} />
                                        <div className="skeleton-text" style={{ width: '160px', height: '20px', marginBottom: 8 }} />
                                        <div className="skeleton-text" style={{ width: '120px', height: '12px', marginBottom: 16 }} />
                                        <div className="skeleton-text" style={{ width: '100%', height: '70px', borderRadius: 12 }} />
                                    </div>
                                ))
                            ) : (
                                filteredCards.filter(c => c.type === 'Stamp Card').map((card) => {
                                    return (
                                        <div
                                            key={card.id}
                                            className="card"
                                            style={{
                                                padding: 22,
                                                borderRadius: 18,
                                                border: `1px solid ${card.borderColor || '#E2E8F0'}`,
                                                background: '#FFFFFF',
                                                boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
                                            }}
                                        >
                                            <div className="flex-between mb-2">
                                                <span
                                                    className="badge"
                                                    style={{
                                                        background: 'rgba(239, 0, 3, 0.1)',
                                                        color: '#EF0003',
                                                        fontWeight: 800,
                                                        fontSize: '0.75rem',
                                                        padding: '4px 10px'
                                                    }}
                                                >
                                                    {card.total_stamps}-Stamp Pass
                                                </span>
                                                <span className="badge" style={{ background: 'var(--status-success-bg)', color: 'var(--status-success)', fontWeight: 800 }}>
                                                    {card.status}
                                                </span>
                                            </div>

                                            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '6px 0 2px 0', color: 'var(--text-primary)' }}>
                                                {card.title}
                                            </h4>
                                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 14px 0' }}>
                                                {card.tagline}
                                            </p>

                                            <div style={{ background: '#F8FAFC', borderRadius: 14, padding: 14, marginBottom: 14, border: '1px solid #E2E8F0' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 8 }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>Stamps Given:</span>
                                                    <strong style={{ color: 'var(--firstloop-primary)' }}>{card.stamps_given || 0}</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 8 }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>Rewards Claimed:</span>
                                                    <strong style={{ color: '#EF0003' }}>{card.rewards_claimed || 0}</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>Active Pass Holders:</span>
                                                    <strong style={{ color: '#D97706' }}>{card.active_members || card.activeMembers || 0} Customers</strong>
                                                </div>
                                            </div>

                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(14, 136, 184, 0.05)', padding: '10px 12px', borderRadius: 10 }}>
                                                <strong style={{ color: 'var(--firstloop-primary)', display: 'block', marginBottom: 2 }}>
                                                    <i className="fas fa-gift" style={{ marginRight: 4 }} /> Main Reward:
                                                </strong>
                                                {card.reward}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* Membership Tiers Section */}
                    <div>
                        <div className="flex-between mb-3">
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                Membership VIP Tiers Performance
                            </h3>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="card" style={{ padding: 22, borderRadius: 18, border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                                        <div className="skeleton-text" style={{ width: '90px', height: '16px', marginBottom: 10 }} />
                                        <div className="skeleton-text" style={{ width: '150px', height: '20px', marginBottom: 8 }} />
                                        <div className="skeleton-text" style={{ width: '100%', height: '60px', borderRadius: 12 }} />
                                    </div>
                                ))
                            ) : (
                                filteredCards.filter(c => c.type === 'Membership Tier').map((tier) => {
                                    const isGold = (tier.tier || '').toLowerCase().includes('gold') || (tier.name || '').toLowerCase().includes('gold')
                                    const color = isGold ? '#D97706' : 'var(--firstloop-primary)'

                                    return (
                                        <div
                                            key={tier.id}
                                            className="card"
                                            style={{
                                                padding: 22,
                                                borderRadius: 18,
                                                border: `1px solid ${tier.borderColor || '#E2E8F0'}`,
                                                background: '#FFFFFF',
                                                boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
                                            }}
                                        >
                                            <div className="flex-between mb-2">
                                                <span
                                                    className="badge"
                                                    style={{
                                                        background: `${color}15`,
                                                        color: color,
                                                        fontWeight: 800,
                                                        fontSize: '0.76rem',
                                                        padding: '4px 10px'
                                                    }}
                                                >
                                                    {tier.tier || tier.title || 'VIP'} Tier
                                                </span>
                                                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                                    {tier.validityMonths || tier.month || 'VIP Member'}
                                                </span>
                                            </div>

                                            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '6px 0 4px 0', color: 'var(--text-primary)' }}>
                                                {tier.name || tier.title}
                                            </h4>
                                            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                                                Validity: <strong>{tier.validityMonths || tier.month || '24 Months'}</strong> • Enrolled: <strong>{tier.activeMembers || tier.active_members || 0} Members</strong>
                                            </div>

                                            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 6, border: '1px solid #E2E8F0' }}>
                                                {(tier.perks || ['VIP Store Privileges', 'Priority Customer Assistance', 'Exclusive Discounts']).slice(0, 3).map((perk, i) => (
                                                    <div key={i} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <i className="fas fa-check" style={{ color: '#059669', fontSize: '0.72rem' }} />
                                                        <span>{perk}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 4: CUSTOMER ENGAGEMENT REPORT */}
            {activeTab === 'customers' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Customer Overview Summary KPI Strip */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="card" style={{ padding: '18px 20px', borderRadius: 16, border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                                    <div className="skeleton-text" style={{ width: '100px', height: '14px', marginBottom: 10 }} />
                                    <div className="skeleton-text" style={{ width: '90px', height: '24px', marginBottom: 6 }} />
                                    <div className="skeleton-text" style={{ width: '120px', height: '12px' }} />
                                </div>
                            ))
                        ) : (
                            <>
                                <div className="card" style={{ padding: '18px 20px', borderRadius: 16, border: '1px solid rgba(14, 136, 184, 0.2)', background: '#FFFFFF' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Enrolled</span>
                                        <i className="fas fa-user-friends" style={{ color: 'var(--firstloop-primary)' }} />
                                    </div>
                                    <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                                        {allCustomers.length} Active Users
                                    </div>
                                    <small style={{ color: '#059669', fontWeight: 700, fontSize: '0.74rem' }}>
                                        <i className="fas fa-arrow-up" style={{ marginRight: 4 }} />
                                        100% Verified records
                                    </small>
                                </div>

                                <div className="card" style={{ padding: '18px 20px', borderRadius: 16, border: '1px solid rgba(245, 158, 11, 0.25)', background: '#FFFFFF' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>VIP Loyalty Penetration</span>
                                        <i className="fas fa-medal" style={{ color: '#D97706' }} />
                                    </div>
                                    <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                                        {allCustomers.length > 0 ? Math.round((membershipCards.reduce((s, c) => s + (c.activeMembers || 0), 0) / allCustomers.length) * 100) : 0}% VIP Rate
                                    </div>
                                    <small style={{ color: '#D97706', fontWeight: 700, fontSize: '0.74rem' }}>
                                        {membershipCards.reduce((s, c) => s + (c.activeMembers || 0), 0)} Enrolled VIP members
                                    </small>
                                </div>

                                <div className="card" style={{ padding: '18px 20px', borderRadius: 16, border: '1px solid rgba(239, 0, 3, 0.2)', background: '#FFFFFF' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Stamps / User</span>
                                        <i className="fas fa-stamp" style={{ color: '#EF0003' }} />
                                    </div>
                                    <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                                        {allCustomers.length > 0 ? (executiveStats.totalStamps / allCustomers.length).toFixed(1) : '0.0'} Stamps
                                    </div>
                                    <small style={{ color: 'var(--firstloop-primary)', fontWeight: 700, fontSize: '0.74rem' }}>
                                        Across {allBranches.length} hub locations
                                    </small>
                                </div>

                                <div className="card" style={{ padding: '18px 20px', borderRadius: 16, border: '1px solid rgba(16, 185, 129, 0.2)', background: '#FFFFFF' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Customer Spend</span>
                                        <i className="fas fa-wallet" style={{ color: '#059669' }} />
                                    </div>
                                    <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#059669' }}>
                                        {allCustomers.length > 0 ? '$' + (allCustomers.reduce((s, c) => s + parseFloat(c.lifetimeSpend.replace('$', '') || 0), 0) / allCustomers.length).toFixed(2) : '$0.00'} LTV
                                    </div>
                                    <small style={{ color: '#059669', fontWeight: 700, fontSize: '0.74rem' }}>
                                        High retention loyalty base
                                    </small>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="card" style={{ padding: 0, borderRadius: 18, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                    <div style={{ padding: '18px 24px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                Registered Merchant Customers Engagement
                            </h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                                Showing {filteredCustomers.length} enrolled customers and their loyalty status
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate('/merchant/customers')}
                            style={{
                                borderRadius: 10,
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                padding: '6px 14px',
                                background: '#FFFFFF',
                                border: '1px solid #CBD5E1',
                                cursor: 'pointer'
                            }}
                        >
                            <i className="fas fa-external-link-alt" style={{ marginRight: 6 }} /> Open Customers Page
                        </button>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.86rem' }}>
                            <thead style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                                <tr>
                                    <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer</th>
                                    <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Contact</th>
                                    <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Primary Hub</th>
                                    <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Stamp Passes</th>
                                    <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Membership Tier</th>
                                    <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Visits</th>
                                    <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Spend</th>
                                    <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <tr key={i} className="skeleton-row">
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div className="skeleton-avatar" style={{ width: 38, height: 38 }} />
                                                    <div>
                                                        <div className="skeleton-text" style={{ width: '110px', height: '14px', marginBottom: 4 }} />
                                                        <div className="skeleton-text" style={{ width: '70px', height: '11px' }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 20px' }}><div className="skeleton-text" style={{ width: '130px', height: '14px' }} /></td>
                                            <td style={{ padding: '16px 20px' }}><div className="skeleton-text" style={{ width: '100px', height: '14px' }} /></td>
                                            <td style={{ padding: '16px 20px' }}><div className="skeleton-text" style={{ width: '80px', height: '16px' }} /></td>
                                            <td style={{ padding: '16px 20px' }}><div className="skeleton-text" style={{ width: '80px', height: '16px' }} /></td>
                                            <td style={{ padding: '16px 20px' }}><div className="skeleton-text" style={{ width: '60px', height: '14px' }} /></td>
                                            <td style={{ padding: '16px 20px' }}><div className="skeleton-text" style={{ width: '70px', height: '14px' }} /></td>
                                            <td style={{ padding: '16px 20px' }}><div className="skeleton-text" style={{ width: '50px', height: '18px' }} /></td>
                                        </tr>
                                    ))
                                ) : (
                                    filteredCustomers.map((cus) => (
                                        <tr key={cus.id}>
                                            <td style={{ padding: '14px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <img
                                                        src={cus.avatar}
                                                        alt={cus.name}
                                                        style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--firstloop-primary)' }}
                                                    />
                                                    <div>
                                                        <span style={{ fontWeight: 800, color: 'var(--text-primary)', display: 'block' }}>{cus.name}</span>
                                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>Joined {cus.joinedDate}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 20px' }}>
                                                <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>{cus.email}</div>
                                                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{cus.phone}</small>
                                            </td>
                                            <td style={{ padding: '14px 20px' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{cus.branchVisited}</span>
                                            </td>
                                            <td style={{ padding: '14px 20px' }}>
                                                <span className="badge" style={{ background: 'rgba(239, 0, 3, 0.1)', color: '#EF0003', fontWeight: 800 }}>
                                                    {cus.stampsCollected} / {cus.stampsTotal} Stamps
                                                </span>
                                                <small style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                                    {cus.stampCard}
                                                </small>
                                            </td>
                                            <td style={{ padding: '14px 20px' }}>
                                                <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#D97706', fontWeight: 800 }}>
                                                    {cus.membershipTier}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 20px', fontWeight: 800 }}>
                                                {cus.totalVisits} Visits
                                            </td>
                                            <td style={{ padding: '14px 20px', fontWeight: 800, color: '#059669' }}>
                                                {cus.lifetimeSpend}
                                            </td>
                                            <td style={{ padding: '14px 20px' }}>
                                                <span className="badge" style={{ background: 'var(--firstloop-primary-light)', color: 'var(--firstloop-primary)', fontWeight: 800 }}>
                                                    {cus.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                </div>
            )}

            {/* TAB 5: RECEPTIONIST ACTIVITY & STAMPS LEADERBOARD */}
            {activeTab === 'staff' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Staff Operational KPI Strip */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="card" style={{ padding: '18px 20px', borderRadius: 16, border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                                    <div className="skeleton-text" style={{ width: '100px', height: '14px', marginBottom: 10 }} />
                                    <div className="skeleton-text" style={{ width: '90px', height: '24px', marginBottom: 6 }} />
                                    <div className="skeleton-text" style={{ width: '120px', height: '12px' }} />
                                </div>
                            ))
                        ) : (
                            <>
                                <div className="card" style={{ padding: '18px 20px', borderRadius: 16, border: '1px solid rgba(14, 136, 184, 0.2)', background: '#FFFFFF' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Stamps Issued by Staff</span>
                                        <i className="fas fa-stamp" style={{ color: 'var(--firstloop-primary)' }} />
                                    </div>
                                    <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--firstloop-primary)' }}>
                                        {allReceptionists.reduce((s, r) => s + (r.stampsCollected || 0), 0).toLocaleString()} Stamps
                                    </div>
                                    <small style={{ color: '#059669', fontWeight: 700, fontSize: '0.74rem' }}>
                                        <i className="fas fa-shield-alt" style={{ marginRight: 4 }} />
                                        100% Receptionist verified
                                    </small>
                                </div>

                                <div className="card" style={{ padding: '18px 20px', borderRadius: 16, border: '1px solid rgba(245, 158, 11, 0.25)', background: '#FFFFFF' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Top Performer</span>
                                        <i className="fas fa-trophy" style={{ color: '#D97706' }} />
                                    </div>
                                    {(() => {
                                        const topStaff = allReceptionists.slice().sort((a, b) => (b.stampsCollected || 0) - (a.stampsCollected || 0))[0]
                                        return (
                                            <>
                                                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                                                    {topStaff ? topStaff.name : 'N/A'}
                                                </div>
                                                <small style={{ color: '#D97706', fontWeight: 700, fontSize: '0.74rem' }}>
                                                    🥇 {topStaff ? (topStaff.stampsCollected || 0).toLocaleString() : 0} Stamps Collected
                                                </small>
                                            </>
                                        )
                                    })()}
                                </div>

                                <div className="card" style={{ padding: '18px 20px', borderRadius: 16, border: '1px solid rgba(239, 0, 3, 0.2)', background: '#FFFFFF' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rewards Validated</span>
                                        <i className="fas fa-gift" style={{ color: '#EF0003' }} />
                                    </div>
                                    <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                                        {allReceptionists.reduce((s, r) => s + (r.rewardsProcessed || 0), 0)} Rewards
                                    </div>
                                    <small style={{ color: '#EF0003', fontWeight: 700, fontSize: '0.74rem' }}>
                                        Verified in audit trail
                                    </small>
                                </div>

                                <div className="card" style={{ padding: '18px 20px', borderRadius: 16, border: '1px solid rgba(16, 185, 129, 0.2)', background: '#FFFFFF' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customers Handled</span>
                                        <i className="fas fa-user-check" style={{ color: '#059669' }} />
                                    </div>
                                    <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#059669' }}>
                                        {allReceptionists.reduce((s, r) => s + (r.customersServed || 0), 0)} Visits
                                    </div>
                                    <small style={{ color: '#059669', fontWeight: 700, fontSize: '0.74rem' }}>
                                        Across {allBranches.length} front desk stations
                                    </small>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Podium Leaderboard for Top 3 Performers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="card" style={{ padding: 22, borderRadius: 20, border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                                    <div className="skeleton-text" style={{ width: '80px', height: '16px', marginBottom: 14 }} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                                        <div className="skeleton-avatar" style={{ width: 54, height: 54 }} />
                                        <div style={{ flex: 1 }}>
                                            <div className="skeleton-text" style={{ width: '60%', height: '16px', marginBottom: 6 }} />
                                            <div className="skeleton-text" style={{ width: '40%', height: '12px' }} />
                                        </div>
                                    </div>
                                    <div className="skeleton-text" style={{ width: '100%', height: '40px', borderRadius: 10, marginBottom: 12 }} />
                                    <div className="skeleton-text" style={{ width: '100%', height: '34px', borderRadius: 10 }} />
                                </div>
                            ))
                        ) : (
                            filteredAndRankedStaff.slice(0, 3).map((stf, index) => {
                                const isFirst = index === 0
                                const isSecond = index === 1
                                const medal = isFirst ? '🥇 1st Place' : isSecond ? '🥈 2nd Place' : '🥉 3rd Place'
                                const medalBg = isFirst ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : isSecond ? 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)' : 'linear-gradient(135deg, #B45309 0%, #78350F 100%)'

                                return (
                                    <div
                                        key={stf.id}
                                        className="card"
                                        style={{
                                            padding: 22,
                                            borderRadius: 20,
                                            border: isFirst ? '2px solid #F59E0B' : '1px solid #E2E8F0',
                                            background: isFirst ? '#FFFBEB' : '#FFFFFF',
                                            boxShadow: isFirst ? '0 8px 24px rgba(245, 158, 11, 0.15)' : '0 4px 15px rgba(0,0,0,0.03)',
                                            position: 'relative'
                                        }}
                                    >
                                        <div className="flex-between mb-3">
                                            <span
                                                style={{
                                                    background: medalBg,
                                                    color: '#FFFFFF',
                                                    fontSize: '0.76rem',
                                                    fontWeight: 800,
                                                    padding: '4px 12px',
                                                    borderRadius: 20,
                                                    letterSpacing: '0.5px'
                                                }}
                                            >
                                                {medal}
                                            </span>
                                            <span className="badge" style={{ background: 'rgba(14, 136, 184, 0.1)', color: 'var(--firstloop-primary)', fontWeight: 800 }}>
                                                {stf.staffId}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                                            <img
                                                src={stf.avatar}
                                                alt={stf.name}
                                                style={{
                                                    width: 54,
                                                    height: 54,
                                                    borderRadius: '50%',
                                                    objectFit: 'cover',
                                                    border: `3px solid ${isFirst ? '#F59E0B' : 'var(--firstloop-primary)'}`
                                                }}
                                            />
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                                    {stf.name}
                                                </h4>
                                                <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                                    {stf.branchName}
                                                </small>
                                                <div style={{ fontSize: '0.74rem', color: '#D97706', fontWeight: 800, marginTop: 2 }}>
                                                    {stf.badge}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stamps Collected Volume Meter */}
                                        <div style={{ background: '#FFFFFF', padding: 14, borderRadius: 14, border: '1px solid #E2E8F0', marginBottom: 14 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
                                                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.4px' }}>STAMPS COLLECTED</span>
                                                <strong style={{ fontSize: '1.4rem', color: '#0284C7', fontWeight: 900 }}>
                                                    {stf.stampsCollected || 0} Stamps
                                                </strong>
                                            </div>
                                            <div style={{ height: 8, background: '#F1F5F9', borderRadius: 6, overflow: 'hidden' }}>
                                                <div
                                                    style={{
                                                        height: '100%',
                                                        width: `${Math.round(((stf.stampsCollected || 0) / maxStampsCollected) * 100)}%`,
                                                        background: isFirst ? 'linear-gradient(90deg, #0284C7 0%, #059669 100%)' : '#0284C7',
                                                        borderRadius: 6
                                                    }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 6 }}>
                                                <span>{stf.rewardsProcessed || 0} Rewards Claimed</span>
                                                <span>{stf.customersServed || 0} Served</span>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setSelectedStaffLog(stf)}
                                            style={{
                                                width: '100%',
                                                borderRadius: 12,
                                                fontWeight: 800,
                                                fontSize: '0.82rem',
                                                padding: '9px 14px',
                                                background: isFirst ? '#F59E0B' : 'var(--firstloop-primary)',
                                                color: '#FFFFFF',
                                                border: 'none',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 6
                                            }}
                                        >
                                            <i className="fas fa-list-alt" />
                                            <span>View Staff Activity Log</span>
                                        </button>
                                    </div>
                                )
                            })
                        )}
                    </div>

                    {/* Full Receptionist Roster Table */}
                    <div className="card" style={{ padding: 0, borderRadius: 18, overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <div style={{ padding: '18px 24px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                    Receptionist Staff Stamps Performance & Operational Log
                                </h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                                    Track which receptionists collected the most stamps, served customers, and verified rewards
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleExportCSV}
                                style={{
                                    borderRadius: 10,
                                    fontSize: '0.8rem',
                                    fontWeight: 800,
                                    padding: '6px 14px',
                                    background: '#FFFFFF',
                                    border: '1px solid #CBD5E1',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer'
                                }}
                            >
                                <i className="fas fa-download" style={{ marginRight: 6 }} /> Export Staff CSV
                            </button>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.86rem' }}>
                                <thead style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                                    <tr>
                                        <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rank & Staff</th>
                                        <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assigned Branch</th>
                                        <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', minWidth: 180 }}>
                                            Stamps Collected (Volume)
                                        </th>
                                        <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Rewards Claimed</th>
                                        <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Served</th>
                                        <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shift Details</th>
                                        <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                                        <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Audit Log</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="skeleton-row">
                                                <td style={{ padding: '16px 20px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <div className="skeleton-avatar" style={{ width: 28, height: 28 }} />
                                                        <div className="skeleton-avatar" style={{ width: 40, height: 40 }} />
                                                        <div>
                                                            <div className="skeleton-text" style={{ width: '100px', height: '14px', marginBottom: 4 }} />
                                                            <div className="skeleton-text" style={{ width: '60px', height: '11px' }} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 20px' }}><div className="skeleton-text" style={{ width: '120px', height: '14px' }} /></td>
                                                <td style={{ padding: '16px 20px' }}><div className="skeleton-text" style={{ width: '110px', height: '14px' }} /></td>
                                                <td style={{ padding: '16px 20px', textAlign: 'center' }}><div className="skeleton-text" style={{ width: '40px', height: '16px' }} /></td>
                                                <td style={{ padding: '16px 20px', textAlign: 'center' }}><div className="skeleton-text" style={{ width: '40px', height: '14px' }} /></td>
                                                <td style={{ padding: '16px 20px' }}><div className="skeleton-text" style={{ width: '80px', height: '16px' }} /></td>
                                                <td style={{ padding: '16px 20px' }}><div className="skeleton-text" style={{ width: '55px', height: '18px' }} /></td>
                                                <td style={{ padding: '16px 20px', textAlign: 'right' }}><div className="skeleton-text" style={{ width: '70px', height: '24px', borderRadius: 8 }} /></td>
                                            </tr>
                                        ))
                                    ) : (
                                        filteredAndRankedStaff.map((stf, idx) => {
                                            const rank = idx + 1
                                            const pct = Math.round(((stf.stampsCollected || 0) / maxStampsCollected) * 100)

                                            return (
                                                <tr key={stf.id}>
                                                    <td style={{ padding: '14px 20px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                            <span
                                                                style={{
                                                                    width: 28,
                                                                    height: 28,
                                                                    borderRadius: '50%',
                                                                    background: rank === 1 ? '#F59E0B' : rank === 2 ? '#94A3B8' : rank === 3 ? '#B45309' : '#E2E8F0',
                                                                    color: rank <= 3 ? '#FFFFFF' : 'var(--text-primary)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    fontSize: '0.78rem',
                                                                    fontWeight: 900
                                                                }}
                                                            >
                                                                #{rank}
                                                            </span>

                                                            <img
                                                                src={stf.avatar}
                                                                alt={stf.name}
                                                                style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--firstloop-primary)' }}
                                                            />

                                                            <div>
                                                                <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>{stf.name}</strong>
                                                                <code style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{stf.staffId}</code>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td style={{ padding: '14px 20px' }}>
                                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stf.branchName}</span>
                                                    </td>

                                                    <td style={{ padding: '14px 20px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                                            <strong style={{ fontSize: '0.96rem', color: '#0284C7' }}>
                                                                {stf.stampsCollected || 0} Stamps
                                                            </strong>
                                                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{pct}% volume</span>
                                                        </div>
                                                        <div style={{ height: 6, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                                                            <div style={{ height: '100%', width: `${pct}%`, background: rank === 1 ? '#059669' : '#0284C7', borderRadius: 4 }} />
                                                        </div>
                                                    </td>

                                                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                                                        <span className="badge" style={{ background: 'rgba(239, 0, 3, 0.1)', color: '#EF0003', fontWeight: 800 }}>
                                                            {stf.rewardsProcessed || 0}
                                                        </span>
                                                    </td>

                                                    <td style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 800 }}>
                                                        {stf.customersServed || 0}
                                                    </td>

                                                    <td style={{ padding: '14px 20px' }}>
                                                        <span className="badge" style={{ background: 'rgba(14, 136, 184, 0.1)', color: 'var(--firstloop-primary)', fontWeight: 700 }}>
                                                            {stf.shift}
                                                        </span>
                                                    </td>

                                                    <td style={{ padding: '14px 20px' }}>
                                                        <span
                                                            className="badge"
                                                            style={{
                                                                background: stf.status === 'Active' ? 'var(--status-success-bg, #DCFCE7)' : '#FEF3C7',
                                                                color: stf.status === 'Active' ? 'var(--status-success, #16A34A)' : '#D97706',
                                                                fontWeight: 800
                                                            }}
                                                        >
                                                            {stf.status}
                                                        </span>
                                                    </td>

                                                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedStaffLog(stf)}
                                                            style={{
                                                                borderRadius: 8,
                                                                fontSize: '0.78rem',
                                                                fontWeight: 800,
                                                                padding: '5px 12px',
                                                                background: 'rgba(14, 136, 184, 0.1)',
                                                                border: 'none',
                                                                color: 'var(--firstloop-primary)',
                                                                cursor: 'pointer'
                                                            }}
                                                            title="View Staff Stamps & Transactions"
                                                        >
                                                            <i className="fas fa-history" style={{ marginRight: 4 }} />
                                                            Staff Logs
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* DEDICATED MODAL: RECEPTIONIST ACTIVITY LOG */}
            {selectedStaffLog && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 1080,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(5px)',
                        padding: 16
                    }}
                >
                    <div
                        className="card"
                        style={{
                            maxWidth: 720,
                            width: '100%',
                            maxHeight: '85vh',
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: 22,
                            overflow: 'hidden',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
                            animation: 'fadeIn 0.2s ease-out',
                            border: 'none'
                        }}
                    >
                        {/* Modal Header */}
                        <div
                            style={{
                                padding: '20px 26px',
                                background: 'linear-gradient(135deg, #0E88B8 0%, #065B7D 100%)',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <img
                                    src={selectedStaffLog.avatar}
                                    alt={selectedStaffLog.name}
                                    style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #FFFFFF' }}
                                />
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                                        {selectedStaffLog.name} — Staff Stamps & Audit Log
                                    </h4>
                                    <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                                        {selectedStaffLog.staffId} • {selectedStaffLog.branchName} ({selectedStaffLog.shift})
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedStaffLog(null)}
                                style={{
                                    border: 'none',
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    color: '#FFFFFF',
                                    borderRadius: '50%',
                                    width: 34,
                                    height: 34,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.2rem'
                                }}
                            >
                                &times;
                            </button>
                        </div>

                        {/* Summary Bar */}
                        <div
                            style={{
                                padding: '16px 26px',
                                background: '#F8FAFC',
                                borderBottom: '1px solid #E2E8F0',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: 10,
                                textAlign: 'center'
                            }}
                        >
                            <div>
                                <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block', fontWeight: 800, letterSpacing: '0.4px' }}>
                                    STAMPS COLLECTED
                                </small>
                                <strong style={{ fontSize: '1.3rem', color: '#0284C7', fontWeight: 900 }}>
                                    {selectedStaffLog.stampsCollected || 0}
                                </strong>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block', fontWeight: 800, letterSpacing: '0.4px' }}>
                                    REWARDS CLAIMED
                                </small>
                                <strong style={{ fontSize: '1.3rem', color: '#EF0003', fontWeight: 900 }}>
                                    {selectedStaffLog.rewardsProcessed || 0}
                                </strong>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block', fontWeight: 800, letterSpacing: '0.4px' }}>
                                    CUSTOMERS SERVED
                                </small>
                                <strong style={{ fontSize: '1.3rem', color: '#D97706', fontWeight: 900 }}>
                                    {selectedStaffLog.customersServed || 0}
                                </strong>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block', fontWeight: 800, letterSpacing: '0.4px' }}>
                                    EST. VOLUME
                                </small>
                                <strong style={{ fontSize: '1.3rem', color: '#059669', fontWeight: 900 }}>
                                    ${selectedStaffLog.totalSpendGenerated || 0}
                                </strong>
                            </div>
                        </div>

                        {/* Activity List Body */}
                        <div style={{ padding: '20px 26px', overflowY: 'auto', flex: 1 }}>
                            <div className="flex-between mb-3">
                                <h5 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                    Recorded Activity Trail for {selectedStaffLog.name}
                                </h5>
                                <span className="badge" style={{ background: 'rgba(14, 136, 184, 0.1)', color: 'var(--firstloop-primary)', fontWeight: 800 }}>
                                    Audit Verified
                                </span>
                            </div>

                            {(() => {
                                const staffTransactions = allLogs.filter(
                                    (l) => l.staff === selectedStaffLog.name || l.staffId === selectedStaffLog.staffId || l.staffId === selectedStaffLog.id
                                )

                                if (staffTransactions.length === 0) {
                                    return (
                                        <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                                            <i className="fas fa-check-circle" style={{ fontSize: '2rem', marginBottom: 8, color: '#CBD5E1' }} />
                                            <p style={{ margin: 0, fontWeight: 700 }}>No transaction logs recorded in current period</p>
                                        </div>
                                    )
                                }

                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {staffTransactions.map((tx) => (
                                            <div
                                                key={tx.id}
                                                style={{
                                                    padding: '14px 18px',
                                                    borderRadius: 14,
                                                    background: '#FFFFFF',
                                                    border: '1px solid #E2E8F0',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: 12
                                                }}
                                            >
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                                            {tx.action}
                                                        </span>
                                                        <span
                                                            className="badge"
                                                            style={{
                                                                background: tx.cardType === 'Stamp Card' ? 'rgba(239, 0, 3, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                                color: tx.cardType === 'Stamp Card' ? '#EF0003' : '#D97706',
                                                                fontSize: '0.7rem',
                                                                fontWeight: 800
                                                            }}
                                                        >
                                                            {tx.cardType}
                                                        </span>
                                                    </div>
                                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                                                        Customer: <strong>{tx.customer}</strong> • Card: {tx.cardName}
                                                    </small>
                                                </div>

                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: tx.rewardUnlocked === 'None' ? 'var(--text-muted)' : '#059669' }}>
                                                        {tx.rewardUnlocked}
                                                    </div>
                                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                                                        {tx.date}
                                                    </small>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            })()}
                        </div>

                        {/* Footer */}
                        <div style={{ padding: '16px 26px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => setSelectedStaffLog(null)}
                                style={{
                                    borderRadius: 10,
                                    padding: '9px 20px',
                                    fontSize: '0.85rem',
                                    fontWeight: 800,
                                    background: '#0F172A',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                Close Log
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DETAIL MODAL FOR INDIVIDUAL TRANSACTION */}
            {selectedLog && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 1070,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(5px)',
                        padding: 16
                    }}
                >
                    <div
                        className="card"
                        style={{
                            maxWidth: 540,
                            width: '100%',
                            borderRadius: 22,
                            overflow: 'hidden',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
                            animation: 'fadeIn 0.2s ease-out',
                            border: 'none'
                        }}
                    >
                        <div
                            style={{
                                padding: '20px 24px',
                                background: 'linear-gradient(135deg, #0E88B8 0%, #065B7D 100%)',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className="fas fa-receipt" style={{ color: '#FFFFFF' }} />
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                                        Transaction Audit Record
                                    </h4>
                                    <span style={{ fontSize: '0.76rem', opacity: 0.9 }}>ID: {selectedLog.id.toUpperCase()}</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedLog(null)}
                                style={{
                                    border: 'none',
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    color: '#FFFFFF',
                                    borderRadius: '50%',
                                    width: 32,
                                    height: 32,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.1rem'
                                }}
                            >
                                &times;
                            </button>
                        </div>

                        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#F8FAFC', padding: 16, borderRadius: 16, border: '1px solid #E2E8F0' }}>
                                <div>
                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.74rem', display: 'block', fontWeight: 700 }}>Timestamp</small>
                                    <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{selectedLog.date}</strong>
                                </div>
                                <div>
                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.74rem', display: 'block', fontWeight: 700 }}>Status</small>
                                    <span className="badge" style={{ background: 'var(--status-success-bg)', color: 'var(--status-success)', fontWeight: 800 }}>
                                        {selectedLog.status}
                                    </span>
                                </div>
                                <div>
                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.74rem', display: 'block', fontWeight: 700 }}>Customer</small>
                                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedLog.customer}</strong>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedLog.customerEmail}</div>
                                </div>
                                <div>
                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.74rem', display: 'block', fontWeight: 700 }}>Staff Receptionist</small>
                                    <strong style={{ fontSize: '0.9rem', color: 'var(--firstloop-primary)' }}>{selectedLog.staff}</strong>
                                </div>
                            </div>

                            <div style={{ padding: 16, borderRadius: 16, border: '1px solid #E2E8F0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>CARD DETAILS</span>
                                    <span className="badge" style={{ background: selectedLog.cardType === 'Stamp Card' ? 'rgba(239, 0, 3, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: selectedLog.cardType === 'Stamp Card' ? '#EF0003' : '#D97706', fontWeight: 800 }}>
                                        {selectedLog.cardType}
                                    </span>
                                </div>
                                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                    {selectedLog.cardName}
                                </div>
                                <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                                    Branch: <strong>{selectedLog.branch}</strong>
                                </div>
                            </div>

                            <div style={{ padding: 16, borderRadius: 16, background: 'rgba(14, 136, 184, 0.06)', border: '1px solid rgba(14, 136, 184, 0.15)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <small style={{ color: 'var(--firstloop-primary)', fontWeight: 800, fontSize: '0.74rem', textTransform: 'uppercase' }}>
                                            Action Performed
                                        </small>
                                        <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                            {selectedLog.action}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.74rem', fontWeight: 700 }}>Reward / Value</small>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#059669' }}>
                                            {selectedLog.rewardUnlocked}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedLog(null)}
                                    style={{
                                        borderRadius: 10,
                                        padding: '9px 20px',
                                        fontSize: '0.85rem',
                                        fontWeight: 800,
                                        background: '#0F172A',
                                        color: '#FFFFFF',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Close Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

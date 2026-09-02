import flLogo from '../../assets/img/firstloop-favicon.png'

export const MOCK_MERCHANT_PROFILE = {
    id: 'm-204',
    name: 'Urban Brew & Glow Outlets',
    email: 'contact@urbanbrewglow.com',
    phone: '+1 (555) 987-6543',
    logo: flLogo,
    category: 'Cafe & Wellness Salon',
    address: '100 Market Street, Suite 400, San Francisco, CA',
    joinedDate: '2024-11-10',
    status: 'Active',
    plan: 'Enterprise VIP'
}

export const INITIAL_BRANCHES = [
    {
        id: 'br-101',
        name: 'FirstLoop Flagship Hub - Downtown',
        merchant_id: 'm-204',
        email: 'downtown.fl@dealora.com',
        phone: '+1 (555) 382-9102',
        address: '450 Grand Avenue, Suite 120',
        city: 'San Francisco',
        state: 'California',
        country: 'United States',
        zip_code: '94108',
        status: 'Active',
        manager: 'Samantha Vance',
        managerRole: 'Senior Branch Manager',
        receptionistsCount: 3,
        timings: [
            { day: 1, name: 'Mon - Fri', open_time: '08:00 AM', close_time: '08:00 PM', is_closed: false },
            { day: 6, name: 'Saturday', open_time: '09:00 AM', close_time: '10:00 PM', is_closed: false },
            { day: 7, name: 'Sunday', open_time: '10:00 AM', close_time: '06:00 PM', is_closed: false },
        ]
    },
    {
        id: 'br-102',
        name: 'Uptown Beauty & Salon Lounge',
        merchant_id: 'm-204',
        email: 'uptown.salon@dealora.com',
        phone: '+1 (555) 492-1184',
        address: '780 Valencia Street, Bay 4',
        city: 'San Francisco',
        state: 'California',
        country: 'United States',
        zip_code: '94110',
        status: 'Active',
        manager: 'Marcus Sterling',
        managerRole: 'Salon Director',
        receptionistsCount: 2,
        timings: [
            { day: 1, name: 'Mon - Sat', open_time: '09:00 AM', close_time: '09:00 PM', is_closed: false },
            { day: 7, name: 'Sunday', open_time: '10:00 AM', close_time: '05:00 PM', is_closed: true },
        ]
    },
    {
        id: 'br-103',
        name: 'Westside Specialty Coffee Hub',
        merchant_id: 'm-204',
        email: 'westside.brew@dealora.com',
        phone: '+1 (555) 619-3320',
        address: '1250 Sunset Blvd, Building B',
        city: 'San Francisco',
        state: 'California',
        country: 'United States',
        zip_code: '94122',
        status: 'Active',
        manager: 'Chloe Bennett',
        managerRole: 'Operations Lead',
        receptionistsCount: 2,
        timings: [
            { day: 1, name: 'Mon - Sun', open_time: '07:00 AM', close_time: '07:00 PM', is_closed: false }
        ]
    }
]

export const INITIAL_RECEPTIONISTS = [
    {
        id: 'rec-1',
        branchId: 'br-101',
        branchName: 'FirstLoop Flagship Hub - Downtown',
        name: 'Elena Rostova',
        email: 'elena.r@dealora.com',
        phone: '+1 (555) 201-9988',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
        staffId: 'STF-DT-01',
        shift: 'Morning (08:00 AM - 04:00 PM)',
        status: 'Active',
        joinedDate: '2025-01-10',
        referenceName: 'Alex Thompson (Sales Representative)'
    },
    {
        id: 'rec-2',
        branchId: 'br-101',
        branchName: 'FirstLoop Flagship Hub - Downtown',
        name: 'David Miller',
        email: 'david.m@dealora.com',
        phone: '+1 (555) 302-8877',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
        staffId: 'STF-DT-02',
        shift: 'Evening (12:00 PM - 08:00 PM)',
        status: 'Active',
        joinedDate: '2025-01-18',
        referenceName: 'Alex Thompson (Sales Representative)'
    },
    {
        id: 'rec-3',
        branchId: 'br-101',
        branchName: 'FirstLoop Flagship Hub - Downtown',
        name: 'Sophia Chen',
        email: 'sophia.c@dealora.com',
        phone: '+1 (555) 412-7766',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120',
        staffId: 'STF-DT-03',
        shift: 'Weekend Shift',
        status: 'Active',
        joinedDate: '2025-02-01',
        referenceName: 'Alex Thompson (Sales Representative)'
    },
    {
        id: 'rec-4',
        branchId: 'br-102',
        branchName: 'Uptown Beauty & Salon Lounge',
        name: 'Isabella Cruz',
        email: 'isabella.c@dealora.com',
        phone: '+1 (555) 523-6655',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
        staffId: 'STF-UT-01',
        shift: 'Full Day (09:00 AM - 06:00 PM)',
        status: 'Active',
        joinedDate: '2025-01-15',
        referenceName: 'Sarah Jenkins (Regional Sales Manager)'
    },
    {
        id: 'rec-5',
        branchId: 'br-102',
        branchName: 'Uptown Beauty & Salon Lounge',
        name: 'Jordan Hayes',
        email: 'jordan.h@dealora.com',
        phone: '+1 (555) 634-5544',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=120',
        staffId: 'STF-UT-02',
        shift: 'Evening Shift',
        status: 'On Leave',
        joinedDate: '2025-02-12',
        referenceName: 'Sarah Jenkins (Regional Sales Manager)'
    },
    {
        id: 'rec-6',
        branchId: 'br-103',
        branchName: 'Westside Specialty Coffee Hub',
        name: 'Lucas Dupont',
        email: 'lucas.d@dealora.com',
        phone: '+1 (555) 745-4433',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=120',
        staffId: 'STF-WS-01',
        shift: 'Morning Shift',
        status: 'Active',
        joinedDate: '2025-02-05',
        referenceName: 'Michael Vance (Senior Sales Executive)'
    },
    {
        id: 'rec-7',
        branchId: 'br-103',
        branchName: 'Westside Specialty Coffee Hub',
        name: 'Mia Wong',
        email: 'mia.w@dealora.com',
        phone: '+1 (555) 856-3322',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120',
        staffId: 'STF-WS-02',
        shift: 'Afternoon Shift',
        status: 'Active',
        joinedDate: '2025-02-20'
    }
]

export const INITIAL_STAMP_CARDS = [
    {
        id: 'sc-101',
        title: 'Artisanal Coffee 8-Stamp Pass',
        brandName: 'Urban Brew & Glow',
        brandLogo: flLogo,
        tagline: 'Buy 8 Specialty Coffees, Get 1 Free Dessert!',
        total_stamps: 8,
        reward: 'Free Gourmet Muffin or Specialty Beverage',
        active_members: 142,
        expiry: '2026-12-31',
        status: 'Active',
        icon: 'fa-coffee',
        bgColor: '#EF0003',
        bgImage: null,
        textColor: '#FFFFFF',
        borderColor: '#FF3B3B',
        stampBgColor: 'rgba(255, 255, 255, 0.3)',
        stampBorderColor: '#FFFFFF',
        stampTextColor: '#FFFFFF',
        preset: 'Wave Red',
        stamps_given: 856,
        rewards_claimed: 98,
        levelRewards: Array.from({ length: 8 }).map((_, i) => ({
            stamp: i + 1,
            reward: i === 7 ? 'Free Specialty Drink & Muffin' : i === 3 ? '20% Discount' : 'Free Extra Shot',
            type: i === 3 ? 'Discount' : 'Free',
            discountVal: i === 3 ? 20 : 0,
            icon: 'fa-gift'
        }))
    },
    {
        id: 'sc-102',
        title: 'Beauty Styling 6-Stamp Card',
        brandName: 'Urban Glow Salon',
        brandLogo: flLogo,
        tagline: 'Collect 6 Stamps on Hair & Facial Services',
        total_stamps: 6,
        reward: '50% Discount on Next Styling Session',
        active_members: 89,
        expiry: '2026-11-15',
        status: 'Active',
        icon: 'fa-cut',
        bgColor: '#0284C7',
        bgImage: null,
        textColor: '#FFFFFF',
        borderColor: '#00A6D6',
        stampBgColor: 'rgba(255, 255, 255, 0.3)',
        stampBorderColor: '#FFFFFF',
        stampTextColor: '#FFFFFF',
        preset: 'Aurora Blue',
        stamps_given: 320,
        rewards_claimed: 45,
        levelRewards: Array.from({ length: 6 }).map((_, i) => ({
            stamp: i + 1,
            reward: i === 5 ? '50% Off Styling' : 'Free Hair Treatment',
            type: i === 5 ? 'Discount' : 'Free',
            discountVal: i === 5 ? 50 : 0,
            icon: 'fa-gift'
        }))
    },
    {
        id: 'sc-103',
        title: 'Gourmet Bakery 10-Stamp Card',
        brandName: 'Urban Bakery',
        brandLogo: flLogo,
        tagline: 'Enjoy 10 Fresh Pastries & Unlock Box of Donuts',
        total_stamps: 10,
        reward: 'Complimentary Box of 6 Assorted Donuts',
        active_members: 215,
        expiry: '2026-10-30',
        status: 'Active',
        icon: 'fa-utensils',
        bgColor: '#D97706',
        bgImage: null,
        textColor: '#FFFFFF',
        borderColor: '#F59E0B',
        stampBgColor: 'rgba(255, 255, 255, 0.3)',
        stampBorderColor: '#FFFFFF',
        stampTextColor: '#FFFFFF',
        preset: 'Warm Amber',
        stamps_given: 1420,
        rewards_claimed: 160,
        levelRewards: Array.from({ length: 10 }).map((_, i) => ({
            stamp: i + 1,
            reward: i === 9 ? 'Box of 6 Donuts' : i === 4 ? '15% Off Pastries' : 'Free Cookie',
            type: i === 4 ? 'Discount' : 'Free',
            discountVal: i === 4 ? 15 : 0,
            icon: 'fa-gift'
        }))
    }
]

export const INITIAL_MEMBERSHIP_CARDS = [
    {
        id: 'mc-201',
        name: 'Gold Elite Membership',
        cardholderName: 'Sarah Jenkins',
        brandName: 'Urban Brew Elite',
        brandLogo: flLogo,
        validityMonths: '12 Months',
        tier: 'Gold',
        bgColor: '#D97706',
        bgImage: null,
        textColor: '#FFFFFF',
        borderColor: '#F59E0B',
        preset: 'Gold Tier',
        isDefault: true,
        minSpend: '$250 / year',
        activeMembers: 128,
        perks: [
            '15% Instant Discount on All Items',
            'Priority Queue & Reserved Seating',
            'Free Birthday Gift & $10 Voucher',
            'Exclusive Double Stamp Days'
        ],
        status: 'Active'
    },
    {
        id: 'mc-202',
        name: 'Platinum Black VIP Pass',
        cardholderName: 'Alex Mercer',
        brandName: 'Urban VIP Club',
        brandLogo: flLogo,
        validityMonths: '12 Months',
        tier: 'Platinum',
        bgColor: '#1E293B',
        bgImage: null,
        textColor: '#FFFFFF',
        borderColor: '#64748B',
        preset: 'Midnight Black',
        isDefault: false,
        minSpend: '$500 / year',
        activeMembers: 64,
        perks: [
            '25% Discount on All Premium Services',
            'Dedicated Concierge & Priority Booking',
            'Complimentary Valet Parking',
            'Free Monthly Tasting Pass'
        ],
        status: 'Active'
    },
    {
        id: 'mc-203',
        name: 'Silver Select Tier',
        cardholderName: 'Emily Clark',
        brandName: 'Urban Brew Club',
        brandLogo: flLogo,
        validityMonths: '6 Months',
        tier: 'Silver',
        bgColor: '#0284C7',
        bgImage: null,
        textColor: '#FFFFFF',
        borderColor: '#38BDF8',
        preset: 'Sapphire Silver',
        isDefault: false,
        minSpend: '$100 / year',
        activeMembers: 310,
        perks: [
            '10% Discount on Coffee & Drinks',
            'Monthly Member Secret Offers',
            'Free Upgrades on Drinks Size'
        ],
        status: 'Active'
    }
]

export const INITIAL_CUSTOMERS = [
    {
        id: 'cus-501',
        name: 'Sophia Reynoldss',
        email: 'sophia.reynolds@example.com',
        phone: '+1 (555) 234-5678',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
        stampCard: 'Artisanal Coffee 8-Stamp Pass',
        stampsCollected: 7,
        stampsTotal: 8,
        membershipTier: 'Gold Elite Membership',
        tierBadge: 'Gold',
        totalVisits: 24,
        lifetimeSpend: '$480.50',
        joinedDate: '2025-02-10',
        status: 'VIP',
        branchVisited: 'FirstLoop Flagship Hub - Downtown',
        stampCardsCount: 2,
        membershipCardsCount: 1,
        heldStampCards: [
            {
                title: 'Artisanal Coffee 8-Stamp Pass',
                collected: 7,
                total: 8,
                reward: 'Free Gourmet Muffin or Specialty Beverage',
                usageStatus: '7 of 8 stamps collected — 1 stamp away from unlocking Free Muffin reward!'
            },
            {
                title: 'Beauty Styling 6-Stamp Card',
                collected: 4,
                total: 6,
                reward: '50% Discount on Next Styling Session',
                usageStatus: '4 of 6 stamps collected — 2 stamps remaining for 50% Off Styling reward.'
            }
        ],
        heldMemberships: [
            {
                name: 'Gold Elite Membership',
                tier: 'Gold',
                validThru: '12/26',
                expiryDate: '28 Dec 2026',
                expiryNotice: 'Active (Expires 28 Dec 2026)',
                status: 'Active'
            }
        ]
    },
    {
        id: 'cus-502',
        name: 'Alexander Wright',
        email: 'alex.wright@example.com',
        phone: '+1 (555) 876-5432',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
        stampCard: 'Beauty Styling 6-Stamp Card',
        stampsCollected: 5,
        stampsTotal: 6,
        membershipTier: 'Platinum Black VIP Pass',
        tierBadge: 'Platinum',
        totalVisits: 38,
        lifetimeSpend: '$920.00',
        joinedDate: '2025-01-22',
        status: 'VIP',
        branchVisited: 'Uptown Beauty & Salon Lounge',
        stampCardsCount: 1,
        membershipCardsCount: 1,
        heldStampCards: [
            {
                title: 'Beauty Styling 6-Stamp Card',
                collected: 5,
                total: 6,
                reward: '50% Discount on Next Styling Session',
                usageStatus: '5 of 6 stamps collected — 1 stamp remaining for 50% Off Styling reward.'
            }
        ],
        heldMemberships: [
            {
                name: 'Platinum Black VIP Pass',
                tier: 'Platinum',
                validThru: '11/26',
                expiryDate: '15 Nov 2026',
                expiryNotice: 'Active (Expires 15 Nov 2026)',
                status: 'Active'
            }
        ]
    },
    {
        id: 'cus-503',
        name: 'Jessica Taylor',
        email: 'jessica.t@example.com',
        phone: '+1 (555) 345-6789',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
        stampCard: 'Gourmet Bakery 10-Stamp Card',
        stampsCollected: 9,
        stampsTotal: 10,
        membershipTier: 'Silver Select Tier',
        tierBadge: 'Silver',
        totalVisits: 18,
        lifetimeSpend: '$310.00',
        joinedDate: '2025-01-15',
        status: 'Active',
        branchVisited: 'Westside Specialty Coffee Hub',
        stampCardsCount: 1,
        membershipCardsCount: 1,
        heldStampCards: [
            {
                title: 'Gourmet Bakery 10-Stamp Card',
                collected: 9,
                total: 10,
                reward: 'Complimentary Box of 6 Assorted Donuts',
                usageStatus: '9 of 10 stamps collected — 1 stamp remaining!'
            }
        ],
        heldMemberships: [
            {
                name: 'Silver Select Tier',
                tier: 'Silver',
                validThru: '10/26',
                expiryDate: '10 Oct 2026',
                expiryNotice: 'Active (Expires 10 Oct 2026)',
                status: 'Active'
            }
        ]
    },
    {
        id: 'cus-504',
        name: 'Michael Vance',
        email: 'michael.vance@example.com',
        phone: '+1 (555) 901-2345',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
        stampCard: 'Artisanal Coffee 8-Stamp Pass',
        stampsCollected: 3,
        stampsTotal: 8,
        membershipTier: 'Silver Select Tier',
        tierBadge: 'Silver',
        totalVisits: 12,
        lifetimeSpend: '$195.00',
        joinedDate: '2025-02-01',
        status: 'Active',
        branchVisited: 'FirstLoop Flagship Hub - Downtown',
        stampCardsCount: 1,
        membershipCardsCount: 1,
        heldStampCards: [
            {
                title: 'Artisanal Coffee 8-Stamp Pass',
                collected: 3,
                total: 8,
                reward: 'Free Gourmet Muffin or Specialty Beverage',
                usageStatus: '3 of 8 stamps collected'
            }
        ],
        heldMemberships: [
            {
                name: 'Silver Select Tier',
                tier: 'Silver',
                validThru: '10/26',
                expiryDate: '01 Oct 2026',
                expiryNotice: 'Active',
                status: 'Active'
            }
        ]
    }
]

export const INITIAL_REPORTS_LOGS = [
    {
        id: 'tx-901',
        date: '2026-08-14 10:24 AM',
        customer: 'Sophia Reynoldss',
        branch: 'FirstLoop Flagship Hub - Downtown',
        cardType: 'Stamp Card',
        cardName: 'Artisanal Coffee 8-Stamp Pass',
        action: 'Stamp Added (+1)',
        staff: 'Elena Rostova',
        rewardUnlocked: 'None',
        status: 'Completed'
    },
    {
        id: 'tx-902',
        date: '2026-08-14 09:45 AM',
        customer: 'Alexander Wright',
        branch: 'Uptown Beauty & Salon Lounge',
        cardType: 'Membership Tier',
        cardName: 'Platinum Black VIP Pass',
        action: '25% VIP Discount Applied',
        staff: 'Isabella Cruz',
        rewardUnlocked: '$45.00 Saved',
        status: 'Completed'
    },
    {
        id: 'tx-903',
        date: '2026-08-13 04:12 PM',
        customer: 'Jessica Taylor',
        branch: 'Westside Specialty Coffee Hub',
        cardType: 'Stamp Card',
        cardName: 'Gourmet Bakery 10-Stamp Card',
        action: 'Reward Claimed',
        staff: 'Lucas Dupont',
        rewardUnlocked: 'Box of 6 Assorted Donuts',
        status: 'Redeemed'
    },
    {
        id: 'tx-904',
        date: '2026-08-13 02:30 PM',
        customer: 'Michael Vance',
        branch: 'FirstLoop Flagship Hub - Downtown',
        cardType: 'Stamp Card',
        cardName: 'Artisanal Coffee 8-Stamp Pass',
        action: 'Stamp Added (+1)',
        staff: 'David Miller',
        rewardUnlocked: 'None',
        status: 'Completed'
    },
    {
        id: 'tx-905',
        date: '2026-08-12 11:15 AM',
        customer: 'Sophia Reynoldss',
        branch: 'FirstLoop Flagship Hub - Downtown',
        cardType: 'Membership Tier',
        cardName: 'Gold Elite Membership',
        action: '15% Member Discount',
        staff: 'Elena Rostova',
        rewardUnlocked: '$18.50 Saved',
        status: 'Completed'
    }
]

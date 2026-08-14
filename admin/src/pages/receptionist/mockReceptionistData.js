import flLogo from '../../assets/img/firstloop-favicon.png'
import qrImg from '../../assets/img/qr-img.png'

export const MOCK_RECEPTIONIST_PROFILE = {
    id: 'rec-1',
    name: 'Elena Rostova',
    staffId: 'STF-DT-01',
    email: 'elena.r@dealora.com',
    phone: '+1 (555) 201-9988',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    branchId: 'br-101',
    branchName: 'FirstLoop Flagship Hub - Downtown',
    merchantName: 'Urban Brew & Glow Outlets',
    merchantLogo: flLogo,
    referenceName: 'Alex Thompson (Sales Representative)',
    shift: 'Morning Shift (08:00 AM - 04:00 PM)'
}

export const RECEPTIONIST_STATS = {
    activeCustomers: 128,
    activeStampCards: 42,
    activeMembershipCards: 35,
    todayCheckIns: 18,
    todayRevenue: '$420.00'
}

export const RECEPTIONIST_CUSTOMERS = [
    {
        id: 'cus-101',
        name: 'Sophia Reynolds',
        email: 'sophia.r@example.com',
        phone: '+1 (555) 234-5678',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
        joinedDate: '2025-01-15',
        totalVisits: 14,
        status: 'Active',
        heldCards: [
            {
                id: 'sc-101',
                type: 'stamp',
                title: 'Artisanal Coffee 8-Stamp Pass',
                brandName: 'FirstLoop Flagship Hub',
                collected: 5,
                total: 8,
                reward: 'Free Gourmet Muffin or Specialty Beverage',
                status: 'Active',
                qrCode: qrImg
            },
            {
                id: 'mc-101',
                type: 'membership',
                title: 'Gold Elite VIP Membership',
                tier: 'Gold',
                validThru: '12/26',
                expiryDate: '31 Dec 2026',
                status: 'Active',
                qrCode: qrImg
            }
        ]
    },
    {
        id: 'cus-102',
        name: 'Liam Vance',
        email: 'liam.v@example.com',
        phone: '+1 (555) 345-6789',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
        joinedDate: '2025-01-20',
        totalVisits: 9,
        status: 'Active',
        heldCards: [
            {
                id: 'sc-102',
                type: 'stamp',
                title: 'Beauty Styling 6-Stamp Card',
                brandName: 'Urban Brew & Glow',
                collected: 3,
                total: 6,
                reward: '50% Discount on Styling Session',
                status: 'Active',
                qrCode: qrImg
            }
        ]
    },
    {
        id: 'cus-103',
        name: 'Emma Sterling',
        email: 'emma.s@example.com',
        phone: '+1 (555) 456-7890',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
        joinedDate: '2025-02-01',
        totalVisits: 22,
        status: 'Active',
        heldCards: [
            {
                id: 'mc-102',
                type: 'membership',
                title: 'Platinum Executive Pass',
                tier: 'Platinum',
                validThru: '06/26',
                expiryDate: '30 Jun 2026',
                status: 'Active',
                qrCode: qrImg
            },
            {
                id: 'sc-103',
                type: 'stamp',
                title: 'Wellness Spa 10-Stamp Rewards',
                brandName: 'FirstLoop Flagship Hub',
                collected: 7,
                total: 10,
                reward: 'Free 30-min Massage Session',
                status: 'Active',
                qrCode: qrImg
            }
        ]
    },
    {
        id: 'cus-104',
        name: 'Noah Bennett',
        email: 'noah.b@example.com',
        phone: '+1 (555) 567-8901',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
        joinedDate: '2025-02-10',
        totalVisits: 6,
        status: 'Active',
        heldCards: [
            {
                id: 'sc-104',
                type: 'stamp',
                title: 'Artisanal Coffee 8-Stamp Pass',
                brandName: 'FirstLoop Flagship Hub',
                collected: 2,
                total: 8,
                reward: 'Free Gourmet Beverage',
                status: 'Active',
                qrCode: qrImg
            }
        ]
    }
]

export const TODAY_CHECKINS = [
    {
        id: 'log-1',
        customerName: 'Sophia Reynolds',
        phone: '+1 (555) 234-5678',
        cardTitle: 'Artisanal Coffee 8-Stamp Pass',
        cardType: 'stamp',
        stampsAdded: 1,
        paymentMethod: 'Cash',
        amount: '$18.50',
        time: '12:35 PM',
        status: 'Completed'
    },
    {
        id: 'log-2',
        customerName: 'Emma Sterling',
        phone: '+1 (555) 456-7890',
        cardTitle: 'Platinum Executive Pass',
        cardType: 'membership',
        stampsAdded: 0,
        paymentMethod: 'Membership Benefit',
        amount: '$0.00',
        time: '11:15 AM',
        status: 'Check-In Validated'
    },
    {
        id: 'log-3',
        customerName: 'Liam Vance',
        phone: '+1 (555) 345-6789',
        cardTitle: 'Beauty Styling 6-Stamp Card',
        cardType: 'stamp',
        stampsAdded: 1,
        paymentMethod: 'Online (UPI)',
        amount: '$45.00',
        time: '10:05 AM',
        status: 'Completed'
    }
]

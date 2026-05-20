const initialMerchants = [
    {
        name: 'Starbucks Coffee',
        subtitle: 'Beverages & Cafe',
        email: 'partner@starbucks.com',
        phone: '+1 (555) 019-2831',
        status: 'Active',
        branches: '14 Branches',
        date: 'Oct 12, 2025'
    },
    {
        name: 'Zara Fashion Group',
        subtitle: 'Apparel & Design',
        email: 'retail@zara.com',
        phone: '+1 (555) 041-9876',
        status: 'Active',
        branches: '8 Branches',
        date: 'Nov 05, 2025'
    }
]

let merchants = initialMerchants.slice()
const listeners = new Set()

export function getMerchants() {
    return merchants.slice()
}

export function addMerchant(merchant) {
    const newMerchant = { ...merchant }
    merchants = [newMerchant, ...merchants]
    listeners.forEach((cb) => cb(merchants.slice()))
}

export function subscribeMerchants(cb) {
    listeners.add(cb)
    return () => listeners.delete(cb)
}

export default {
    getMerchants,
    addMerchant,
    subscribeMerchants
}

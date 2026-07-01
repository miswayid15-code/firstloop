import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const initialForm = {
    ownerName: '',
    businessName: '',
    serviceProvided: '',
    category: '',
    email: '',
    phone: '',
    country: '',
    password: '',
    taxNumber: '',
    address: '',
    city: '',
    state: '',
    zipcode: '',
    latitude: '',
    longitude: '', 
    countryCode: '',
    description: '',
    profilePhoto: null,
    businessLogo: null,
    kycDocument: null,
}

export const useMerchantFormStore = create(
    persist(
        (set) => ({
            form: initialForm,
            profilePreview: '',
            logoPreview: '',
            setFormFields: (fields) => set((state) => ({
                form: { ...state.form, ...fields }
            })),
            setPreviews: (previews) => set((state) => ({
                ...state,
                ...previews
            })),
            resetForm: () => set({
                form: initialForm,
                profilePreview: '',
                logoPreview: ''
            })
        }),
        {
            name: 'add-merchant-form',
            partialize: (state) => ({
                form: Object.fromEntries(
                    Object.entries(state.form).filter(([key]) => 
                        !['profilePhoto', 'businessLogo', 'kycDocument'].includes(key)
                    )
                )
            })
        }
    )
)
